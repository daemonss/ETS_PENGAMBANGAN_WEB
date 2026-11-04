import os
import pandas as pd
import matplotlib.pyplot as plt

# Ensure output directory exists
os.makedirs('grafik', exist_ok=True)

# Read CSV and filter for summary rows
df = pd.read_csv('hasil_uji_beban.csv')
summary_df = df[df['row_type'] == 'summary'].copy()
summary_df['concurrency'] = summary_df['concurrency'].astype(int)
summary_df = summary_df.sort_values('concurrency')

# Style configuration
plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')
plt.rcParams['font.sans-serif'] = 'Arial'
plt.rcParams['axes.edgecolor'] = '#cccccc'
plt.rcParams['axes.linewidth'] = 0.8

# 1. Concurrency vs Median p95 Response Time
fig, ax = plt.subplots(figsize=(7, 4.5), dpi=300)
ax.plot(summary_df['concurrency'], summary_df['p95_latency_ms'], marker='o', color='#d9534f', linewidth=2, markersize=7, label='Median p95 Latency')
for _, row in summary_df.iterrows():
    ax.annotate(f"{row['p95_latency_ms']:.2f} ms", (row['concurrency'], row['p95_latency_ms']),
                textcoords="offset points", xytext=(0, 10), ha='center', fontsize=9, fontweight='bold', color='#d9534f')
ax.set_title('Grafik 1: Concurrency vs Median p95 Response Time', fontsize=12, fontweight='bold', pad=12)
ax.set_xlabel('Concurrency Level', fontsize=10, labelpad=8)
ax.set_ylabel('p95 Latency (ms)', fontsize=10, labelpad=8)
ax.set_xticks(summary_df['concurrency'])
ax.grid(True, linestyle='--', alpha=0.6)
ax.set_ylim(0, max(summary_df['p95_latency_ms']) * 1.25)
plt.tight_layout()
plt.savefig('grafik/grafik_1_p95_latency.png')
plt.close()

# 2. Concurrency vs Median RPS (Throughput)
fig, ax = plt.subplots(figsize=(7, 4.5), dpi=300)
ax.plot(summary_df['concurrency'], summary_df['requests_per_second'], marker='s', color='#0275d8', linewidth=2, markersize=7, label='Median Throughput (RPS)')
for _, row in summary_df.iterrows():
    ax.annotate(f"{row['requests_per_second']:.1f}", (row['concurrency'], row['requests_per_second']),
                textcoords="offset points", xytext=(0, 10), ha='center', fontsize=9, fontweight='bold', color='#0275d8')
ax.set_title('Grafik 2: Concurrency vs Median Throughput (RPS)', fontsize=12, fontweight='bold', pad=12)
ax.set_xlabel('Concurrency Level', fontsize=10, labelpad=8)
ax.set_ylabel('Requests Per Second (RPS)', fontsize=10, labelpad=8)
ax.set_xticks(summary_df['concurrency'])
ax.grid(True, linestyle='--', alpha=0.6)
ax.set_ylim(0, max(summary_df['requests_per_second']) * 1.2)
plt.tight_layout()
plt.savefig('grafik/grafik_2_throughput_rps.png')
plt.close()

# 3. Concurrency vs Median Failed Requests
fig, ax = plt.subplots(figsize=(7, 4.5), dpi=300)
bars = ax.bar(summary_df['concurrency'].astype(str), summary_df['failed_requests'], color='#5cb85c', width=0.4, edgecolor='#4cae4c')
for bar in bars:
    yval = bar.get_height()
    ax.text(bar.get_x() + bar.get_width()/2, yval + 0.05, f"{int(yval)}", ha='center', va='bottom', fontsize=10, fontweight='bold')
ax.set_title('Grafik 3: Concurrency vs Median Failed Requests', fontsize=12, fontweight='bold', pad=12)
ax.set_xlabel('Concurrency Level', fontsize=10, labelpad=8)
ax.set_ylabel('Failed Requests', fontsize=10, labelpad=8)
ax.set_ylim(0, 5)
ax.grid(True, linestyle='--', alpha=0.6, axis='y')
plt.tight_layout()
plt.savefig('grafik/grafik_3_failed_requests.png')
plt.close()

# 4. Concurrency vs Median CPU% dan Memory RSS (Separate Subplots for clear scale)
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4.5), dpi=300)

# 4a. CPU
ax1.plot(summary_df['concurrency'], summary_df['server_cpu_percent_one_core'], marker='^', color='#f0ad4e', linewidth=2, markersize=7)
for _, row in summary_df.iterrows():
    ax1.annotate(f"{row['server_cpu_percent_one_core']:.1f}%", (row['concurrency'], row['server_cpu_percent_one_core']),
                 textcoords="offset points", xytext=(0, 10), ha='center', fontsize=9, fontweight='bold', color='#e08e0b')
ax1.set_title('4a. CPU Utilization (% 1-Core)', fontsize=11, fontweight='bold')
ax1.set_xlabel('Concurrency Level', fontsize=10)
ax1.set_ylabel('CPU Usage (% 1-Core)', fontsize=10)
ax1.set_xticks(summary_df['concurrency'])
ax1.set_ylim(0, max(summary_df['server_cpu_percent_one_core']) * 1.25)
ax1.grid(True, linestyle='--', alpha=0.6)

# 4b. Memory RSS
ax2.plot(summary_df['concurrency'], summary_df['server_memory_rss_mb'], marker='d', color='#5bc0de', linewidth=2, markersize=7)
for _, row in summary_df.iterrows():
    ax2.annotate(f"{row['server_memory_rss_mb']:.2f} MB", (row['concurrency'], row['server_memory_rss_mb']),
                 textcoords="offset points", xytext=(0, 10), ha='center', fontsize=9, fontweight='bold', color='#31b0d5')
ax2.set_title('4b. Memory RSS (MB)', fontsize=11, fontweight='bold')
ax2.set_xlabel('Concurrency Level', fontsize=10)
ax2.set_ylabel('Resident Set Size (MB)', fontsize=10)
ax2.set_xticks(summary_df['concurrency'])
ax2.set_ylim(50, max(summary_df['server_memory_rss_mb']) * 1.15)
ax2.grid(True, linestyle='--', alpha=0.6)

plt.suptitle('Grafik 4: Concurrency vs Penggunaan Sumber Daya Server', fontsize=13, fontweight='bold', y=1.02)
plt.tight_layout()
plt.savefig('grafik/grafik_4_cpu_memory.png')
plt.close()

print("Semua grafik berhasil dibuat di folder 'grafik/'!")
