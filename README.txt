PAKET SOAL ETS PRAKTIKUM WEB SCALABILITY — TOKOKILAT

1. Baca PETUNJUK_UJI_BEBAN_TOKOKILAT.docx sampai selesai.
2. Eksperimen utama pada komputer klien: Node.js versi 18+ diperlukan; jalankan node run-load-experiments.js.
3. Untuk bagian network impairment, server Linux hanya membutuhkan Docker Engine dan tc/iproute2 pada host. Node.js tidak perlu dipasang langsung pada server Linux.
4. Di server Linux, dari folder yang berisi Dockerfile, server.js, dan src, jalankan:
   docker build -t tokokilat-api .
   docker run --rm --name tokokilat-api --network host -e PORT=3187 -e CACHE_TTL_MS=15000 tokokilat-api
5. Biarkan container berjalan. Dari komputer klien, akses http://IP_SERVER:3187/.
6. Untuk menghentikan server, tekan Ctrl+C di terminal server.
7. Bagian network impairment memerlukan dua komputer: server Linux dan klien. Gunakan tc sesuai petunjuk dan hanya pada interface/jaringan praktikum yang diizinkan.
8. Untuk menambahkan hasil jaringan ke CSV yang sama, gunakan EXTERNAL_SERVER=1 dan APPEND=1 sesuai petunjuk.

Eksperimen utama: concurrency 1, 10, 20, 50; 1.000 request/run; 3 pengulangan. Request diputar bergiliran pada kategori electronics, books, clothing, home, grocery, dan sports.
CSV memuat response time, RPS, failed requests, kategori yang diuji dan jumlah request per kategori, cache, CPU/memory proses server, dan hitungan operasi filesystem.
Peringatan: jangan menguji layanan publik/produksi tanpa izin.
