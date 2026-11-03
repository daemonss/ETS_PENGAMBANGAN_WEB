/**
 * TokoKilat automated load experiment (Node.js >= 18, no npm dependencies).
 * OFAT factor: concurrency. Requests, endpoint, cache TTL and test data are controlled.
 * Output: one CSV file containing all individual runs and summary rows.
 */
const http = require('node:http');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');

const PORT = Number(process.env.PORT || 3187);
const BASE_URL = process.env.BASE_URL || `http://127.0.0.1:${PORT}`;
const REQUESTS = Number(process.env.REQUESTS || 1000);
const REPEATS = Number(process.env.REPEATS || 3);
const TTL_MS = Number(process.env.CACHE_TTL_MS || 15000);
const CONCURRENCY_LEVELS = (process.env.CONCURRENCY_LEVELS || '1,10,20,50')
  .split(',').map(x => Number(x.trim())).filter(x => Number.isInteger(x) && x > 0);
const OUT = path.resolve(process.env.OUT_FILE || 'hasil_uji_beban.csv');
const EXTERNAL_SERVER = process.env.EXTERNAL_SERVER === '1';
const APPEND = process.env.APPEND === '1';
const CATEGORIES = (process.env.CATEGORIES || 'electronics,books,clothing,home,grocery,sports').split(',').map(x => x.trim()).filter(Boolean);
const SCENARIO_PREFIX = process.env.SCENARIO_PREFIX || 'concurrency';
const serverPath = path.join(__dirname, 'server.js');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function waitForServer(child, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (child.exitCode !== null) throw new Error('Server berhenti sebelum siap. Periksa pesan server di terminal.');
    try { const r = await fetch(`${BASE_URL}/`); if (r.ok) return; } catch {}
    await sleep(250);
  }
  throw new Error(`Server tidak siap dalam ${timeoutMs} ms pada ${BASE_URL}`);
}
async function readServerMetrics() {
  try { const r = await fetch(`${BASE_URL}/api/metrics`); return r.ok ? await r.json() : {}; } catch { return {}; }
}
function processSnapshot(m) {
  return { cpu: m.process?.cpu || {}, memory: m.process?.memory || {}, resource: m.process?.resource || {} };
}
async function runLoad(concurrency) {
  const latencies = new Array(REQUESTS);
  const categoryCounts = Object.fromEntries(CATEGORIES.map(category => [category, 0]));
  let next = 0, failures = 0;
  const beforeMetrics = processSnapshot(await readServerMetrics());
  const started = performance.now();
  async function worker() {
    while (true) {
      const index = next++;
      if (index >= REQUESTS) return;
      const t0 = performance.now();
      try {
        const category = CATEGORIES[index % CATEGORIES.length];
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        const response = await fetch(`${BASE_URL}/api/products?category=${encodeURIComponent(category)}`);
        const body = await response.json();
        if (!response.ok || !Array.isArray(body.data) || body.data.some(product => product.category !== category)) failures++;
      } catch { failures++; }
      latencies[index] = performance.now() - t0;
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, REQUESTS) }, worker));
  const durationSeconds = (performance.now() - started) / 1000;
  const sorted = latencies.filter(Number.isFinite).sort((a, b) => a - b);
  const percentile = p => sorted.length ? sorted[Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1)] : 0;
  const avg = sorted.length ? sorted.reduce((a, b) => a + b, 0) / sorted.length : 0;
  const serverMetrics = await readServerMetrics();
  const after = processSnapshot(serverMetrics);
  const cache = serverMetrics.cache || {};
  const cpuDeltaUs = Math.max(0, Number(after.cpu.user || 0) - Number(beforeMetrics.cpu.user || 0)) + Math.max(0, Number(after.cpu.system || 0) - Number(beforeMetrics.cpu.system || 0));
  const cpuMs = cpuDeltaUs / 1000;
  const rssBytes = Number(after.memory.rss || 0);
  const heapUsedBytes = Number(after.memory.heapUsed || 0);
  const fsReadOps = Math.max(0, Number(after.resource.fsRead || 0) - Number(beforeMetrics.resource.fsRead || 0));
  const fsWriteOps = Math.max(0, Number(after.resource.fsWrite || 0) - Number(beforeMetrics.resource.fsWrite || 0));
  return {
    requests: REQUESTS, concurrency, categories_tested: CATEGORIES.join('|'), category_counts: JSON.stringify(categoryCounts), duration_seconds: durationSeconds,
    requests_per_second: REQUESTS / Math.max(durationSeconds, 0.000001),
    avg_latency_ms: avg, p50_latency_ms: percentile(.50), p95_latency_ms: percentile(.95),
    p99_latency_ms: percentile(.99), failed_requests: failures,
    cache_hits: cache.hits ?? '', cache_misses: cache.misses ?? '',
    cache_hit_ratio: cache.hitRatio ?? '', cache_ttl_ms: cache.defaultTtlMs ?? TTL_MS,
    server_cpu_time_ms: cpuMs, server_cpu_percent_one_core: durationSeconds ? (cpuMs / (durationSeconds * 1000)) * 100 : 0,
    server_memory_rss_mb: rssBytes / (1024 * 1024), server_memory_heap_used_mb: heapUsedBytes / (1024 * 1024),
    server_fs_read_ops_delta: fsReadOps, server_fs_write_ops_delta: fsWriteOps
  };
}
function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function toCsv(rows) {
  const headers = ['row_type','scenario','repeat','requests','concurrency','categories_tested','category_counts','duration_seconds','requests_per_second','avg_latency_ms','p50_latency_ms','p95_latency_ms','p99_latency_ms','failed_requests','cache_hits','cache_misses','cache_hit_ratio','cache_ttl_ms','server_cpu_time_ms','server_cpu_percent_one_core','server_memory_rss_mb','server_memory_heap_used_mb','server_fs_read_ops_delta','server_fs_write_ops_delta','notes'];
  return [headers.join(','), ...rows.map(row => headers.map(h => csvEscape(row[h])).join(','))].join('\n') + '\n';
}
(async () => {
  if (!CONCURRENCY_LEVELS.length) throw new Error('CONCURRENCY_LEVELS tidak valid. Contoh: 1,10,20,50');
  if (!CATEGORIES.length) throw new Error('CATEGORIES tidak valid. Contoh: electronics,books,clothing,home,grocery,sports');
  const rows = [];
  let runNumber = 0;
  console.log('Eksperimen uji beban TokoKilat');
  console.log(`Mode server: ${EXTERNAL_SERVER ? 'server eksternal' : 'server lokal otomatis'}`);
  if (EXTERNAL_SERVER) {
    const check = await fetch(`${BASE_URL}/`);
    if (!check.ok) throw new Error(`Server eksternal merespons HTTP ${check.status}`);
    const reset = await fetch(`${BASE_URL}/api/reset`, { method: 'POST' });
    if (!reset.ok) throw new Error('Tidak dapat mereset server eksternal. Periksa akses /api/reset.');
  }
  console.log(`Endpoint: ${BASE_URL}/api/products?category=...`);
  console.log(`Kategori bergilir: ${CATEGORIES.join(', ')}`);
  console.log(`Requests/run: ${REQUESTS}; pengulangan: ${REPEATS}; TTL: ${TTL_MS} ms`);
  console.log(`Skenario concurrency: ${CONCURRENCY_LEVELS.join(', ')}`);
  for (const concurrency of CONCURRENCY_LEVELS) {
    const scenarioRuns = [];
    for (let repeat = 1; repeat <= REPEATS; repeat++) {
      runNumber++;
      console.log(`\n[${runNumber}/${CONCURRENCY_LEVELS.length * REPEATS}] concurrency=${concurrency}, pengulangan=${repeat}`);
      let child = null;
      let serverLog = '';
      if (!EXTERNAL_SERVER) {
        child = spawn(process.execPath, [serverPath], {
          cwd: __dirname,
          env: { ...process.env, PORT: String(PORT), CACHE_TTL_MS: String(TTL_MS) },
          stdio: ['ignore', 'pipe', 'pipe']
        });
        child.stdout.on('data', d => { serverLog += d.toString(); });
        child.stderr.on('data', d => { serverLog += d.toString(); });
      }
      try {
        if (EXTERNAL_SERVER) {
          const reset = await fetch(`${BASE_URL}/api/reset`, { method: 'POST' });
          if (!reset.ok) throw new Error('Gagal mereset server eksternal sebelum pengulangan.');
        } else {
          await waitForServer(child);
          await fetch(`${BASE_URL}/api/reset`, { method: 'POST' });
        }
        const result = await runLoad(concurrency);
        scenarioRuns.push(result);
        rows.push({ row_type: 'run', scenario: `${SCENARIO_PREFIX}_${concurrency}`, repeat, ...result, notes: EXTERNAL_SERVER ? 'Pengukuran individual; server eksternal' : 'Pengukuran individual; server lokal' });
        console.log(`  RPS=${result.requests_per_second.toFixed(2)}; p95=${result.p95_latency_ms.toFixed(2)} ms; gagal=${result.failed_requests}; cache hit=${(Number(result.cache_hit_ratio || 0) * 100).toFixed(2)}%`);
      } finally {
        if (child) {
          child.kill();
          await Promise.race([new Promise(resolve => child.once('exit', resolve)), sleep(1500)]);
        }
      }
      if (serverLog.includes('EADDRINUSE')) throw new Error(`Port ${PORT} sedang digunakan. Tutup server TokoKilat lain atau ubah PORT.`);
    }
    const median = key => {
      const a = scenarioRuns.map(r => Number(r[key])).filter(Number.isFinite).sort((x, y) => x - y);
      if (!a.length) return '';
      return a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
    };
    rows.push({ row_type: 'summary', scenario: `${SCENARIO_PREFIX}_${concurrency}`, repeat: `median_of_${scenarioRuns.length}`, requests: REQUESTS, concurrency, categories_tested: CATEGORIES.join('|'), category_counts: JSON.stringify(Object.fromEntries(CATEGORIES.map(category => [category, Math.floor(REQUESTS / CATEGORIES.length) + (CATEGORIES.indexOf(category) < REQUESTS % CATEGORIES.length ? 1 : 0)]))),
      duration_seconds: median('duration_seconds'), requests_per_second: median('requests_per_second'), avg_latency_ms: median('avg_latency_ms'),
      p50_latency_ms: median('p50_latency_ms'), p95_latency_ms: median('p95_latency_ms'), p99_latency_ms: median('p99_latency_ms'),
      failed_requests: median('failed_requests'), cache_hits: median('cache_hits'), cache_misses: median('cache_misses'),
      cache_hit_ratio: median('cache_hit_ratio'), cache_ttl_ms: TTL_MS, server_cpu_time_ms: median('server_cpu_time_ms'),
      server_cpu_percent_one_core: median('server_cpu_percent_one_core'), server_memory_rss_mb: median('server_memory_rss_mb'),
      server_memory_heap_used_mb: median('server_memory_heap_used_mb'), server_fs_read_ops_delta: median('server_fs_read_ops_delta'),
      server_fs_write_ops_delta: median('server_fs_write_ops_delta'), notes: 'Ringkasan median; gunakan baris ini untuk membandingkan skenario' });
  }
  const csv = toCsv(rows);
  if (APPEND && fs.existsSync(OUT)) {
    const existing = fs.readFileSync(OUT, 'utf8').trimEnd();
    const newLines = csv.split(/\r?\n/).slice(1).join('\n');
    fs.writeFileSync(OUT, `${existing}\n${newLines}\n`, 'utf8');
  } else {
    fs.writeFileSync(OUT, csv, 'utf8');
  }
  console.log(`\nSelesai. Semua hasil (${rows.filter(r => r.row_type === 'run').length} pengukuran + ringkasan) disimpan dalam satu file:\n${OUT}`);
})().catch(error => { console.error('\nGAGAL:', error.message); process.exitCode = 1; });
