"""Scans every frame of the reel: reports frames where the soil block touches the left or right edge.
Block surfaces are much brighter than the dark background and ground; text lives above y=640."""
import subprocess, sys
import numpy as np

W, H = 1080, 1920
path = sys.argv[1]
p = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-i", path, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
bad, n = [], 0
while True:
    buf = p.stdout.read(W * H * 3)
    if len(buf) < W * H * 3:
        break
    f = np.frombuffer(buf, np.uint8).reshape(H, W, 3).astype(np.int32)
    lum = f.mean(axis=2)
    band = lum[700:1780]  # below the text, above the bottom label
    left, right = band[:, :8], band[:, -8:]
    hit_l, hit_r = (left > 96).mean(), (right > 96).mean()
    if hit_l > 0.02 or hit_r > 0.02:
        bad.append((n, round(n / 30, 2), round(hit_l, 3), round(hit_r, 3)))
    n += 1
print("frames", n, "frames touching an edge", len(bad))
for b in bad[:40]:
    print(b)
