"""Assembles the Jaisa Tha #1 reel from the rendered stills.
Slow push-in on each still, crossfades, fact-checked text, original drone track, end card.
Writes out/jaisatha-01-purana-qila.mp4 (1080x1920, 30 fps)."""
import math, subprocess, wave, struct
import numpy as np
from PIL import Image, ImageDraw, ImageFont

W, H, FPS = 1080, 1920, 30
F = "/home/claude/jaisatha/fonts/"
SERIF = F + "TiroDevanagariSanskrit-Regular.ttf"
SANS = F + "NotoSans.ttf"
GOLD = (221, 166, 56)
PLASTER = (250, 248, 243)
SOFT = (210, 204, 192)
CHARCOAL = (42, 41, 38)

# segment: (still, eyebrow, heading, body, seconds)
SEG = [
    ("stage11", "JAISA THA  ·  AS IT WAS", "Purana Qila", "Under Delhi's Old Fort: over 2,500 years of living, one layer on another.", 4.0),
    ("stage01", "BELOW THE PRE-MAURYAN LEVELS", "Silt", "Below the oldest layers: a thick silt deposit. Probably a sign the area was once under water.", 4.0),
    ("stage02", "LEVEL 1", "Pre-Mauryan", "Painted Grey Ware sherds, found below the Mauryan floors. Dated samples from this level go back as early as 540 BCE.", 5.0),
    ("stage03", "LEVEL 2", "Mauryan", "A ring well built of terracotta rings, about 70 cm across.", 3.6),
    ("stage04", "LEVEL 3", "Sunga", "Walls of mud brick and rubble stone. Copper coins.", 3.4),
    ("stage05", "LEVEL 4", "Kushan", "A house of three or more rooms, mostly burnt brick.", 3.4),
    ("stage06", "LEVEL 5", "Gupta", "Burnt-brick buildings. A Gaja Lakshmi medallion.", 3.4),
    ("stage07", "LEVEL 6", "Post-Gupta", "Brick-bat walls. Terracotta dabbers, one inscribed in Brahmi.", 3.6),
    ("stage08", "LEVEL 7", "Rajput", "An unusually wide stone wall, perhaps a fortification. A stone image of Vishnu.", 4.0),
    ("stage09", "LEVEL 8", "Sultanate", "Rubble walls, lime floors, glazed pottery.", 3.4),
    ("stage10", "LEVEL 9", "Mughal", "The fort on top. Humayun founded his city Dinpanah here in 1533; Sher Shah took Delhi in 1540. Who built which walls is still debated.", 5.4),
    ("stage11", "STILL DIGGING", "Almost 14 m", "Excavation has gone almost 14 m deep, and natural soil has still not been reached.", 4.2),
    ("end", "", "", "", 4.4),
]
XF = 0.45  # crossfade seconds
LABEL = "Reconstruction from published excavation reports. Not to scale."


def font(path, size):
    f = ImageFont.truetype(path, size)
    try:
        if path == SANS:
            f.set_variation_by_axes([100, 400])
    except Exception:
        pass
    return f


def AX(weight):
    names = [a["name"] for a in ImageFont.truetype(SANS, 10).get_variation_axes()]
    return [weight if n in (b"Weight", "Weight") else 100 for n in names]


def sans(size, weight=400):
    f = ImageFont.truetype(SANS, size)
    try:
        f.set_variation_by_axes(AX(weight))
    except Exception:
        pass
    return f


def wrap(draw, text, f, width):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if draw.textlength(t, font=f) <= width:
            cur = t
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


import json
LABELS = [("mughal", "Mughal"), ("sultanate", "Sultanate"), ("rajput", "Rajput"), ("postgupta", "Post-Gupta"),
          ("gupta", "Gupta"), ("kushan", "Kushan"), ("sunga", "Sunga"), ("maurya", "Mauryan"),
          ("premaurya", "Pre-Mauryan"), ("silt", "Silt")]


def draw_labels(im):
    pts = json.load(open("/home/claude/jaisatha/frames/stage11_layers.json"))
    d = ImageDraw.Draw(im)
    f = sans(32, 600)
    for key, name in LABELS:
        x, y = pts[key]
        d.ellipse([x - 4, y - 6, x + 8, y + 6], fill=GOLD + (255,))
        d.line([(x + 8, y), (x + 48, y)], fill=GOLD + (255,), width=3)
        d.text((x + 58, y - 22), name, font=f, fill=PLASTER + (255,))
    return im


BADGE = Image.open("/home/claude/talaash-heritage/site/assets/img/logo-badge.png").convert("RGBA").resize((128, 128), Image.LANCZOS)


def text_layer(eyebrow, heading, body, labels=False):
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    # gentle top gradient for legibility
    grad = np.zeros((H, W, 4), np.uint8)
    for y in range(760):
        a = int(170 * (1 - y / 760) ** 1.4)
        grad[y, :, :3] = (16, 15, 14)
        grad[y, :, 3] = a
    im = Image.alpha_composite(im, Image.fromarray(grad, "RGBA"))
    d = ImageDraw.Draw(im)
    x, y = 84, 190
    if eyebrow:
        d.text((x, y), eyebrow, font=sans(34, 650), fill=GOLD + (255,))
        y += 66
    if heading:
        hf = ImageFont.truetype(SERIF, 104)
        d.text((x, y), heading, font=hf, fill=PLASTER + (255,))
        y += 136
    if body:
        bf = sans(46, 450)
        for line in wrap(d, body, bf, W - 2 * x):
            d.text((x, y), line, font=bf, fill=SOFT + (255,))
            y += 64
    # label and wordmark
    lf = sans(26, 450)
    lw = d.textlength(LABEL, font=lf)
    d.rounded_rectangle([(W - lw) / 2 - 22, H - 130, (W + lw) / 2 + 22, H - 78], radius=26, fill=(20, 19, 17, 170))
    d.text(((W - lw) / 2, H - 120), LABEL, font=lf, fill=(240, 236, 228, 235))
    d.text((84, 108), "TALAASH HERITAGE", font=sans(28, 700), fill=(235, 230, 220, 200))
    im.alpha_composite(BADGE, (W - 84 - 128, 64))
    if labels:
        im = draw_labels(im)
    return im


def end_card():
    im = Image.new("RGB", (W, H), CHARCOAL)
    logo = Image.open("/home/claude/talaash-heritage/site/assets/img/logo-badge.png").convert("RGBA").resize((520, 520), Image.LANCZOS)
    im.paste(logo, ((W - 520) // 2, 430), logo)
    d = ImageDraw.Draw(im)
    lines = [("Walk Purana Qila and its excavations", ImageFont.truetype(SERIF, 56), PLASTER),
             ("with Talaash Heritage.", ImageFont.truetype(SERIF, 56), PLASTER),
             ("talaash-heritage.pages.dev/purana-qila", sans(40, 650), GOLD)]
    y = 1060
    for t, f, c in lines:
        w = d.textlength(t, font=f)
        d.text(((W - w) / 2, y), t, font=f, fill=c)
        y += 96 if f != lines[-1][1] else 0
    sf = sans(30, 500)
    for k, s in enumerate(["Instagram @talaashheritage  ·  YouTube @talaashheritage1967",
                           "LinkedIn and Facebook: Talaash Heritage"]):
        d.text(((W - d.textlength(s, font=sf)) / 2, 1400 + k * 48), s, font=sf, fill=PLASTER)
    s = "Sources: Swarnkar and Bal, Heritage 11.1 (2023–24); PIB, 30 May 2023"
    sf = sans(26, 450)
    d.text(((W - d.textlength(s, font=sf)) / 2, 1540), s, font=sf, fill=SOFT)
    return im


stills = {}
for s, *_ in SEG:
    if s != "end" and s not in stills:
        stills[s] = Image.open(f"/home/claude/jaisatha/frames/{s}.png").convert("RGB")
END = end_card()
layers = [text_layer(e, h, b, labels=(h == "Almost 14 m")) if s != "end" else None for s, e, h, b, _ in SEG]


def base_frame(i, t):
    """Segment i at local time t (seconds): slow push-in towards the upper third."""
    s, *_, dur = SEG[i]
    if s == "end":
        return END.copy()
    img = stills[s]
    z = 1.0 + (0.0 if SEG[i][2] == "Almost 14 m" else 0.035) * (t / dur)
    w, h = int(W / z), int(H / z)
    drift = 0 if SEG[i][2] == "Almost 14 m" else 12 * math.sin(math.pi * (t / dur) - math.pi / 2) * (1 if i % 2 else -1)
    cx, cy = W / 2 + drift, H * (0.55 + 0.03 * (t / dur))
    box = (int(cx - w / 2), int(cy - h / 2), int(cx - w / 2) + w, int(cy - h / 2) + h)
    bx = max(0, min(W - w, box[0]))
    by = max(0, min(H - h, box[1]))
    box = (bx, by, bx + w, by + h)
    return img.crop(box).resize((W, H), Image.BILINEAR)


rng = np.random.default_rng(11)
DUST = [(rng.uniform(0, W), rng.uniform(250, H - 200), rng.uniform(1.2, 3.4), rng.uniform(-6, 6), rng.uniform(-14, -4), rng.uniform(0, 6.28))
        for _ in range(70)]


def dust(T):
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for x0, y0, r, vx, vy, ph in DUST:
        x = (x0 + vx * T + 8 * math.sin(T * 0.6 + ph)) % W
        y = (y0 + vy * T - 250) % (H - 450) + 250
        a = int(70 + 60 * math.sin(T * 1.3 + ph))
        d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 226, 170, max(0, a)))
    return im


def frame(i, t, T=None):
    s, *_, dur = SEG[i]
    f = base_frame(i, t).convert("RGBA")
    if s != "end" and T is not None and SEG[i][2] != "Almost 14 m":
        f = Image.alpha_composite(f, dust(T))
    if layers[i] is not None:
        a = min(1.0, max(0.0, (t - 0.25) / 0.5))
        L = layers[i]
        if a < 1:
            L = L.copy()
            L.putalpha(L.getchannel("A").point(lambda v: int(v * a)))
        f = Image.alpha_composite(f, L)
    return f.convert("RGB")


starts, acc = [], 0.0
for k, seg in enumerate(SEG):
    starts.append(acc)
    acc += seg[4] - (XF if k < len(SEG) - 1 else 0)
TOTAL = acc
N = int(TOTAL * FPS)

ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
                       "-i", "-", "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", "-pix_fmt", "yuv420p",
                       "/home/claude/jaisatha/out/video_hq.mp4"], stdin=subprocess.PIPE)
for n in range(N):
    T = n / FPS
    i = max(k for k in range(len(SEG)) if starts[k] <= T)
    t = T - starts[i]
    img = frame(i, t, T)
    if i + 1 < len(SEG) and T >= starts[i + 1]:
        pass
    # crossfade into next segment during the last XF seconds
    if i + 1 < len(SEG):
        nxt_start = starts[i + 1]
        if T >= nxt_start:
            pass
    if i > 0 and t < XF:
        prev = frame(i - 1, T - starts[i - 1], T)
        img = Image.blend(prev, img, t / XF)
    ff.stdin.write(img.tobytes())
ff.stdin.close()
ff.wait()

# ---- original drone track: a soft tanpura-like drone on D, with a low pluck at each new layer ----
SR = 44100
ts = np.arange(int(TOTAL * SR)) / SR
base = 73.42  # D2
sig = np.zeros_like(ts)
for k, (mult, amp) in enumerate([(1, 0.5), (2, 0.25), (3, 0.18), (1.5, 0.22), (4, 0.08), (6, 0.04)]):
    sig += amp * np.sin(2 * np.pi * base * mult * ts + 0.3 * np.sin(2 * np.pi * 0.07 * (k + 1) * ts))
sig *= 0.55 + 0.45 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.11 * ts))
for k, st in enumerate(starts[1:-1], 1):
    i0 = int(st * SR)
    n = int(1.6 * SR)
    tt = np.arange(n) / SR
    f0 = base * (2 if k % 2 else 3)
    pl = (np.sin(2 * np.pi * f0 * tt) + 0.4 * np.sin(2 * np.pi * f0 * 2 * tt)) * np.exp(-tt * 3.2)
    sig[i0:i0 + n] += 0.35 * pl[: len(sig[i0:i0 + n])]
fade = np.minimum(1, np.minimum(ts / 1.5, (TOTAL - ts) / 2.0))
sig = sig * fade
sig = 0.32 * sig / np.max(np.abs(sig))
with wave.open("/home/claude/jaisatha/out/drone.wav", "w") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((sig * 32767).astype(np.int16).tobytes())
print("TOTAL", round(TOTAL, 2), "frames", N)
