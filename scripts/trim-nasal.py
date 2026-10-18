"""Shortens the final "n" of a recorded word and fades it out, so "Ten" does not end as "Tene".

The voice holds the closing nasal for ~200 ms at almost full volume and then releases it, which
sounds like an extra vowel. This finds where the nasal starts (the vowel's bright sound gives way
to a muffled one: little energy above 1 kHz) and keeps only `--keep` ms of it, fading the last
`--fade` ms.

Usage: python3 scripts/trim-nasal.py <in.mp3> <out.mp3> [--keep 90] [--fade 60]
"""
import argparse
import subprocess

import numpy as np

p = argparse.ArgumentParser()
p.add_argument("src")
p.add_argument("dst")
p.add_argument("--keep", type=int, default=90, help="ms of the nasal to keep")
p.add_argument("--fade", type=int, default=60, help="ms of fade-out at the end")
a = p.parse_args()

SR = 44100
raw = subprocess.run(
    ["ffmpeg", "-v", "error", "-i", a.src, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
    check=True, capture_output=True,
).stdout
x = np.frombuffer(raw, dtype=np.int16).astype(np.float64) / 32768

hop = SR // 100  # 10 ms frames
frames = []
for i in range(0, len(x) - hop, hop):
    seg = x[i : i + hop] * np.hanning(hop)
    sp = np.abs(np.fft.rfft(seg)) ** 2
    fr = np.fft.rfftfreq(hop, 1 / SR)
    tot = sp.sum() + 1e-12
    frames.append((i, 10 * np.log10(tot / hop + 1e-12), sp[fr > 1000].sum() / tot))

peak = max(db for _, db, _ in frames)
# The vowel: loud and bright. The nasal: first frame after the loudest point that is still loud but muffled.
loudest = max(range(len(frames)), key=lambda k: frames[k][1])
start = next(
    (k for k in range(loudest, len(frames)) if frames[k][2] < 0.05 and frames[k][1] > peak - 25),
    None,
)
if start is None:
    raise SystemExit("não achei o 'n' final")
cut = frames[start][0] + SR * a.keep // 1000
y = x[:cut].copy()
n = min(len(y), SR * a.fade // 1000)
y[-n:] *= np.linspace(1, 0, n) ** 2
y = np.concatenate([y, np.zeros(SR // 20)])  # 50 ms of silence after
subprocess.run(
    ["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-",
     "-codec:a", "libmp3lame", "-b:a", "128k", a.dst],
    input=(y * 32767).astype(np.int16).tobytes(), check=True,
)
print(f"{a.dst}: 'n' começa em {frames[start][0] * 1000 // SR} ms, cortado em {cut * 1000 // SR} ms")
