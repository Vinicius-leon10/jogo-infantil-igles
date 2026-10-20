"""Removes (or softens) the hissy sound at the end of a recorded word, e.g. the "dj" of "Orange".

The owner wants Orange without the final "g" sound. That ending is a burst of high-pitched hiss (most
of the energy above 3 kHz) right after the "n"; this finds where the last hissy stretch starts and keeps
only `--keep` ms of it (0 = none), with a short fade so the cut does not click.

Usage: python3 scripts/trim-final-hiss.py <in.mp3> <out.mp3> [--keep 0] [--fade 25]
For a take, also add its note to src/assets/voice-takes/notes.json (shown in "Escolher vozes").
"""
import argparse
import subprocess

import numpy as np

p = argparse.ArgumentParser()
p.add_argument("src")
p.add_argument("dst")
p.add_argument("--keep", type=int, default=0, help="ms of the final hiss to keep")
p.add_argument("--fade", type=int, default=25, help="ms of fade-out at the cut")
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
    frames.append((i, 10 * np.log10(tot / hop + 1e-12), sp[fr > 3000].sum() / tot))

peak = max(db for _, db, _ in frames)
audible = [k for k, (_, db, _) in enumerate(frames) if db > peak - 35]
# The last hissy frame among the last 100 ms of sound (the very end is the hiss fading out).
tail = [k for k in audible if k >= audible[-1] - 10 and frames[k][2] >= 0.3]
if not tail:
    raise SystemExit("o fim não é um chiado (nada para cortar)")
last = tail[-1]
start = last
while start > 0 and frames[start - 1][2] >= 0.25:
    start -= 1
cut = frames[start][0] + SR * a.keep // 1000
y = x[:cut].copy()
n = min(len(y), SR * max(a.fade, 1) // 1000)
y[-n:] *= np.linspace(1, 0, n) ** 2
y = np.concatenate([y, np.zeros(SR // 20)])  # 50 ms of silence after
subprocess.run(
    ["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-",
     "-codec:a", "libmp3lame", "-b:a", "128k", a.dst],
    input=(y * 32767).astype(np.int16).tobytes(), check=True,
)
print(f"{a.dst}: chiado final de {frames[start][0] * 1000 // SR} a {frames[last][0] * 1000 // SR + 10} ms, cortado em {cut * 1000 // SR} ms")
