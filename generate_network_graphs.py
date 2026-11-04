import os
import matplotlib.pyplot as plt

os.makedirs('grafik', exist_ok=True)

# Data
scenarios = ['N1 (Normal)', 'N2 (50ms Delay & 5Mbit/s)']
p95_values = [15.69, 106.02]
rps_values = [2334.52, 191.20]

# Style configuration
plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')
plt.rcParams['font.sans-serif'] = 'Arial'
plt.rcParams['axes.edgecolor'] = '#cccccc'
plt.rcParams['axes.linewidth'] = 0.8

# 1. Grafik Perbandingan p95 Latency (ms)
fig, ax = plt.subplots(figsize=(6, 4.5), dpi=300)
colors = ['#337ab7', '#d9534f']
bars = ax.bar(scenarios, p95_values, color=colors, width=0.45, edgecolor=['#286090', '#c9302c'], linewidth=1.2)
for bar in bars:
    yval = bar.get_height()
    ax.text(bar.get_x() + bar.get_width()/2, yval + 2, f"{yval:.2f} ms", ha='center', va='bottom', fontsize=10, fontweight='bold')
ax.set_title('Perbandingan Median p95 Response Time (ms)', fontsize=12, fontweight='bold', pad=14)
ax.set_ylabel('p95 Latency (ms)', fontsize=10, labelpad=8)
ax.set_ylim(0, max(p95_values) * 1.2)
ax.grid(True, linestyle='--', alpha=0.6, axis='y')
plt.tight_layout()
plt.savefig('grafik/grafik_jaringan_p95_latency.png')
plt.close()

# 2. Grafik Perbandingan Throughput (RPS)
fig, ax = plt.subplots(figsize=(6, 4.5), dpi=300)
bars = ax.bar(scenarios, rps_values, color=['#337ab7', '#d9534f'], width=0.45, edgecolor=['#286090', '#c9302c'], linewidth=1.2)
for bar in bars:
    yval = bar.get_height()
    ax.text(bar.get_x() + bar.get_width()/2, yval + 40, f"{yval:.2f}", ha='center', va='bottom', fontsize=10, fontweight='bold')
ax.set_title('Perbandingan Median Throughput (Requests Per Second)', fontsize=12, fontweight='bold', pad=14)
ax.set_ylabel('Throughput (RPS)', fontsize=10, labelpad=8)
ax.set_ylim(0, max(rps_values) * 1.15)
ax.grid(True, linestyle='--', alpha=0.6, axis='y')
plt.tight_layout()
plt.savefig('grafik/grafik_jaringan_throughput_rps.png')
plt.close()

# 3. Grafik Side-by-Side (Persis format laporan)
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11, 4.5), dpi=300)

bars1 = ax1.bar(scenarios, p95_values, color=['#337ab7', '#d9534f'], width=0.45)
for bar in bars1:
    yval = bar.get_height()
    ax1.text(bar.get_x() + bar.get_width()/2, yval + 2, f"{yval:.2f} ms", ha='center', va='bottom', fontsize=9, fontweight='bold')
ax1.set_title('p95 Response Time (ms)', fontsize=11, fontweight='bold')
ax1.set_ylabel('Latency (ms)', fontsize=10)
ax1.set_ylim(0, 130)
ax1.grid(True, linestyle='--', alpha=0.6, axis='y')

bars2 = ax2.bar(scenarios, rps_values, color=['#337ab7', '#d9534f'], width=0.45)
for bar in bars2:
    yval = bar.get_height()
    ax2.text(bar.get_x() + bar.get_width()/2, yval + 50, f"{yval:.2f}", ha='center', va='bottom', fontsize=9, fontweight='bold')
ax2.set_title('Throughput (Requests Per Second)', fontsize=11, fontweight='bold')
ax2.set_ylabel('Request per Second', fontsize=10)
ax2.set_ylim(0, 2700)
ax2.grid(True, linestyle='--', alpha=0.6, axis='y')

plt.suptitle('Perbandingan Hasil Uji Jaringan (N1 vs N2)', fontsize=13, fontweight='bold', y=1.02)
plt.tight_layout()
plt.savefig('grafik/grafik_perbandingan_jaringan_lengkap.png')
plt.close()

print("Grafik uji jaringan berhasil dibuat di folder 'grafik/'!")
