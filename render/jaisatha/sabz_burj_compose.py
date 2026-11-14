"""Jaisa Tha #2: Sabz Burj. Assembles the reel from the three.js stills (scene.html, shoot.py).
Slow push-in, crossfades, checked text, both logos on every frame, original drone track.
Writes out/video_hq.mp4 and out/drone.wav (1080x1920, 30 fps)."""
import math, subprocess, wave, json, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

D = os.path.dirname(os.path.abspath(__file__))
REPO = "/home/claude/talaash-heritage"
W, H, FPS = 1080, 1920, 30
F = "/tmp/claude-0/fonts/"
SERIF = F + "Tiro.ttf"
GOLD = (221, 166, 56)
PLASTER = (250, 248, 243)
SOFT = (222, 216, 204)
CHARCOAL = (42, 41, 38)
LBL = json.load(open(f"{D}/frames/labels.json"))

def sans(size, weight=400):
    return ImageFont.truetype(F + {400: "NotoSans-400.ttf", 600: "NotoSans-600.ttf", 700: "NotoSans-700.ttf"}[weight], size)

# (still, eyebrow, heading, body, seconds, labels[(anchor, text)])
SEG = [
    ("hero", "JAISA THA  ·  AS IT WAS", "Sabz Burj", "A Mughal tomb on a Delhi roundabout, and a painted ceiling that lay hidden under 20th-century cement.", 4.6, []),
    ("aerial", "WHERE", "A traffic island", "It stands on a roundabout at the entrance to Humayun's Tomb. It bears no date, and no one recorded who is buried here.", 5.2, []),
    ("section", "THE BUILDING", "An octagon", "Timurid in style, like octagonal tombs across Central Asia, with a double dome on a tall drum. Its style places it in the early Mughal years.", 5.6,
     [("outer", "Outer dome"), ("drum", "Drum"), ("inner", "Inner dome: the painted ceiling"), ("chamber", "Chamber")]),
    ("tiles", "SABZ MEANS GREEN", "Glazed tiles", "Today the lotus finial is green and the dome turquoise blue; sources differ on the dome's first colour. The drum: blues, green and yellow.", 5.8,
     [("finial", "Lotus finial"), ("dome", "Dome"), ("drum", "Drum (pattern simplified)")]),
    ("police", "EARLY 20TH CENTURY", "A police station", "The tomb was used as a police station. Its painted interior was possibly plastered over then. By 1984 many dome tiles had fallen or lost their glaze.", 5.8,
     [("ceiling", "Ceiling under plaster")]),
    ("asi", "THE 1980s", "New tiles", "The dome was re-clad in tiles of terracotta, not the quartz base of the 16th-century tiles. Water seeping through the dome damaged the ceiling's edge for good.", 5.8,
     [("ceiling", "Water damage (illustrative)")]),
    ("reveal", "THE CONSERVATION", "Under the cement", "The Aga Khan Trust for Culture and the ASI removed the cement. Beneath it: a 36 m² (about 390 sq ft) domed ceiling painted with pure gold and lapis lazuli. Work finished in 2021.", 6.0,
     [("edge", "Edge lost to water"), ("ceiling", "Gold specks (illustrative)")]),
    ("palette", "FIVE COLOURS", "As it was painted", "Lapis blue for the ground of the flower design. Gold over a beige undercoat. Red. Yellow earth, peeli maati. Black for the bold lines.", 5.6, "PALETTE"),
    ("reveal", "WHY IT MATTERS", "Among the earliest", "Thought to be among the earliest surviving painted ceilings in India. Missing parts were not repainted; an architect's reconstruction shows the full design instead.", 5.6, []),
    ("plan", "EIGHT FAÇADES", "Eight patterns", "Each of the eight façades has a different incised plaster pattern, restored from the fragments that survived. Patterns not shown.", 5.2, "PLAN"),
    ("end", "", "", "", 5.0, []),
]
XF = 0.45
LABEL = "Reconstruction from published conservation records. Not to scale."

def wrap(d, text, f, width):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if d.textlength(t, font=f) <= width:
            cur = t
        else:
            lines.append(cur); cur = w
    if cur:
        lines.append(cur)
    return lines

TL = Image.open(f"{REPO}/site/assets/img/logo-badge.png").convert("RGBA").resize((124, 124), Image.LANCZOS)
AW = Image.open(f"{REPO}/site/assets/img/archaeologywala-logo.png").convert("RGBA").resize((108, 109), Image.LANCZOS)

def logos(im):
    d = ImageDraw.Draw(im)
    d.ellipse([84 - 10, 52, 84 + 118, 52 + 128], fill=(250, 248, 243, 225))
    im.alpha_composite(AW, (84, 62))
    im.alpha_composite(TL, (W - 84 - 124, 54))
    return im

def pin(d, x, y, text, right=True):
    f = sans(31, 600)
    tw = d.textlength(text, font=f)
    d.ellipse([x - 7, y - 7, x + 7, y + 7], fill=GOLD + (255,))
    if right and x + 80 + tw > W - 40:
        right = False
    if not right and x - 80 - tw < 40:
        right = True
    if right:
        d.line([(x + 7, y), (x + 50, y)], fill=GOLD + (255,), width=3)
        d.rounded_rectangle([x + 54, y - 26, x + 74 + tw, y + 24], radius=12, fill=(20, 19, 17, 175))
        d.text((x + 64, y - 22), text, font=f, fill=PLASTER + (255,))
    else:
        d.line([(x - 50, y), (x - 7, y)], fill=GOLD + (255,), width=3)
        d.rounded_rectangle([x - 74 - tw, y - 26, x - 54, y + 24], radius=12, fill=(20, 19, 17, 175))
        d.text((x - 64 - tw, y - 22), text, font=f, fill=PLASTER + (255,))

def text_layer(still, eyebrow, heading, body, labels):
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    grad = np.zeros((H, W, 4), np.uint8)
    for y in range(900):
        grad[y, :, :3] = (16, 15, 14); grad[y, :, 3] = int(190 * (1 - y / 900) ** 1.3)
    im = Image.alpha_composite(im, Image.fromarray(grad, "RGBA"))
    d = ImageDraw.Draw(im)
    x, y = 84, 230
    d.text((x, y), eyebrow, font=sans(34, 700), fill=GOLD + (255,)); y += 62
    d.text((x, y), heading, font=ImageFont.truetype(SERIF, 96), fill=PLASTER + (255,)); y += 128
    bf = sans(42, 400)
    for line in wrap(d, body, bf, W - 2 * x):
        d.text((x, y), line, font=bf, fill=SOFT + (255,)); y += 58
    pts = LBL[still]
    if labels == "PALETTE":
        sw = [("Lapis blue", (35, 64, 143)), ("Gold", (201, 160, 62)), ("Red", (176, 52, 38)), ("Yellow earth", (196, 158, 70)), ("Black", (22, 22, 22))]
        y0 = 1180
        d.rounded_rectangle([84, y0 - 30, W - 84, y0 + 5 * 92 + 70], radius=24, fill=(20, 19, 17, 200))
        for k, (n, c) in enumerate(sw):
            yy = y0 + k * 92
            d.rounded_rectangle([120, yy, 220, yy + 64], radius=10, fill=c + (255,), outline=(240, 236, 228, 255), width=2)
            d.text((248, yy + 8), n, font=sans(40, 600), fill=PLASTER + (255,))
        note = "Colours from the conservation records. The floral pattern is not shown."
        nf = sans(27, 400)
        for k, ln in enumerate(wrap(d, note, nf, W - 2 * 120)):
            d.text((120, y0 + 5 * 92 + k * 36 - 8), ln, font=nf, fill=SOFT + (255,))
    elif labels == "PLAN":
        f = sans(40, 700)
        for k in range(8):
            px, py, _ = pts["face%d" % k]
            # push the numerals out from the plan centre so they sit outside the walls
            cx, cy = W / 2, H / 2
            vx, vy = px - cx, py - cy; L = math.hypot(vx, vy) or 1
            qx, qy = px + vx / L * 62, py + vy / L * 62
            d.ellipse([qx - 34, qy - 34, qx + 34, qy + 34], fill=(20, 19, 17, 200), outline=GOLD + (255,), width=3)
            n = str([1, 2, 3, 4, 5, 6, 7, 8][k])
            d.text((qx - d.textlength(n, font=f) / 2, qy - 28), n, font=f, fill=PLASTER + (255,))
    else:
        for key, t in labels:
            px, py, _ = pts[key]
            pin(d, px, py, t, right=px < W * 0.55)
    lf = sans(25, 400)
    lw = d.textlength(LABEL, font=lf)
    d.rounded_rectangle([(W - lw) / 2 - 22, H - 132, (W + lw) / 2 + 22, H - 80], radius=26, fill=(20, 19, 17, 185))
    d.text(((W - lw) / 2, H - 122), LABEL, font=lf, fill=(240, 236, 228, 240))
    return logos(im)

def end_card():
    im = Image.new("RGBA", (W, H), CHARCOAL + (255,))
    big = Image.open(f"{REPO}/site/assets/img/logo-badge.png").convert("RGBA").resize((380, 380), Image.LANCZOS)
    aw = Image.open(f"{REPO}/site/assets/img/archaeologywala-logo.png").convert("RGBA").resize((300, 304), Image.LANCZOS)
    d = ImageDraw.Draw(im)
    im.alpha_composite(big, (110, 420))
    d.ellipse([W - 110 - 380, 420, W - 110, 800], fill=(250, 248, 243, 255))
    im.alpha_composite(aw, (W - 110 - 380 + 40, 458))
    sf = ImageFont.truetype(SERIF, 54)
    y = 900
    for t in ["Walk Humayun's Tomb with", "Talaash Heritage. Sabz Burj", "stands at its entrance."]:
        d.text(((W - d.textlength(t, font=sf)) / 2, y), t, font=sf, fill=PLASTER); y += 78
    u = "talaash-heritage.pages.dev/humayuns-tomb"
    uf = sans(40, 700)
    d.text(((W - d.textlength(u, font=uf)) / 2, y + 30), u, font=uf, fill=GOLD)
    hf = sans(30, 600)
    for k, s in enumerate(["Instagram @talaashheritage  ·  YouTube @talaashheritage1967",
                           "LinkedIn and Facebook: Talaash Heritage",
                           "3D series with @archaeologywala"]):
        d.text(((W - d.textlength(s, font=hf)) / 2, 1290 + k * 50), s, font=hf, fill=PLASTER)
    s = "Sources: Aga Khan Trust for Culture, Sabz Burj conservation records"
    rf = sans(26, 400)
    d.text(((W - d.textlength(s, font=rf)) / 2, 1500), s, font=rf, fill=SOFT)
    lf = sans(25, 400); lw = d.textlength(LABEL, font=lf)
    d.text(((W - lw) / 2, H - 122), LABEL, font=lf, fill=(200, 196, 188))
    return logos(im).convert("RGB")

stills = {s: Image.open(f"{D}/frames/{s}.png").convert("RGB") for s, *_ in SEG if s != "end"}
END = end_card()
layers = [text_layer(s, e, h, b, l) if s != "end" else None for s, e, h, b, _, l in SEG]
STATIC = {"plan"}

def base_frame(i, t):
    s, dur = SEG[i][0], SEG[i][4]
    if s == "end":
        return END.copy()
    img = stills[s]
    if s in STATIC:
        return img.copy()
    z = 1.0 + 0.03 * (t / dur)
    w, h = int(W / z), int(H / z)
    dx = 10 * math.sin(math.pi * (t / dur) - math.pi / 2) * (1 if i % 2 else -1)
    bx = int(max(0, min(W - w, W / 2 + dx - w / 2))); by = int(max(0, min(H - h, H * 0.56 - h / 2)))
    return img.crop((bx, by, bx + w, by + h)).resize((W, H), Image.BILINEAR)

def frame(i, t):
    f = base_frame(i, t).convert("RGBA")
    if layers[i] is not None:
        a = min(1.0, max(0.0, (t - 0.2) / 0.45))
        L = layers[i]
        if a < 1:
            # logos and label stay fully on; only the text block fades in
            L2 = L.copy(); L2.putalpha(L.getchannel("A").point(lambda v: int(v * a)))
            f = Image.alpha_composite(f, L2)
            f = logos(f)
        else:
            f = Image.alpha_composite(f, L)
    return f.convert("RGB")

starts, acc = [], 0.0
for k, seg in enumerate(SEG):
    starts.append(acc); acc += seg[4] - (XF if k < len(SEG) - 1 else 0)
TOTAL = acc; N = int(TOTAL * FPS)
os.makedirs(f"{D}/out", exist_ok=True)
if os.environ.get("PREVIEW"):
    for i in range(len(SEG)):
        frame(i, SEG[i][4] - 0.6).save(f"{D}/out/p{i:02d}.png")
    raise SystemExit
ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
                       "-i", "-", "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", "-pix_fmt", "yuv420p", f"{D}/out/video_hq.mp4"], stdin=subprocess.PIPE)
for n in range(N):
    T = n / FPS
    i = max(k for k in range(len(SEG)) if starts[k] <= T)
    t = T - starts[i]
    img = frame(i, t)
    if i > 0 and t < XF:
        img = Image.blend(frame(i - 1, T - starts[i - 1]), img, t / XF)
    ff.stdin.write(img.tobytes())
ff.stdin.close(); ff.wait()

SR = 44100
ts = np.arange(int(TOTAL * SR)) / SR
base = 82.41  # E2
sig = np.zeros_like(ts)
for k, (mult, amp) in enumerate([(1, 0.5), (2, 0.25), (3, 0.16), (1.5, 0.22), (4, 0.07)]):
    sig += amp * np.sin(2 * np.pi * base * mult * ts + 0.3 * np.sin(2 * np.pi * 0.07 * (k + 1) * ts))
sig *= 0.55 + 0.45 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.1 * ts))
for k, st in enumerate(starts[1:-1], 1):
    i0 = int(st * SR); nn = int(1.6 * SR); tt = np.arange(nn) / SR
    f0 = base * (2 if k % 2 else 3)
    pl = (np.sin(2 * np.pi * f0 * tt) + 0.4 * np.sin(2 * np.pi * f0 * 2 * tt)) * np.exp(-tt * 3.2)
    sig[i0:i0 + nn] += 0.35 * pl[: len(sig[i0:i0 + nn])]
sig *= np.minimum(1, np.minimum(ts / 1.5, (TOTAL - ts) / 2.0))
sig = 0.32 * sig / np.max(np.abs(sig))
with wave.open(f"{D}/out/drone.wav", "w") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((sig * 32767).astype(np.int16).tobytes())
print("TOTAL", round(TOTAL, 2), "frames", N)
