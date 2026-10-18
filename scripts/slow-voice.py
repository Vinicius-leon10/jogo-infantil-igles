"""Slows a recorded word down without changing the pitch (ffmpeg rubberband).

`--tail-ms` keeps the end untouched from that point (e.g. a final "n" already shortened with
trim-nasal.py, which would grow back into "tene" if stretched).

Usage: python3 scripts/slow-voice.py <in.mp3> <out.mp3> --tempo 0.75 [--tail-ms 370]
"""
import argparse
import subprocess

p = argparse.ArgumentParser()
p.add_argument("src")
p.add_argument("dst")
p.add_argument("--tempo", type=float, required=True, help="< 1 is slower (0.75 = 33%% longer)")
p.add_argument("--tail-ms", type=int, default=0, help="keep the audio from this point unchanged")
a = p.parse_args()

stretch = f"rubberband=tempo={a.tempo}:pitch=1:formant=preserved:transients=smooth"
if a.tail_ms:
    t = a.tail_ms / 1000
    graph = (
        f"[0:a]asplit[x][y];[x]atrim=0:{t},asetpts=N/SR/TB,{stretch}[head];"
        f"[y]atrim={t},asetpts=N/SR/TB[tail];[head][tail]concat=n=2:v=0:a=1[out]"
    )
else:
    graph = f"[0:a]{stretch}[out]"
subprocess.run(
    ["ffmpeg", "-v", "error", "-y", "-i", a.src, "-filter_complex", graph, "-map", "[out]",
     "-ac", "1", "-codec:a", "libmp3lame", "-b:a", "128k", a.dst],
    check=True,
)
print(a.dst)
