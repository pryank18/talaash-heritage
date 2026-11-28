"""Jaisa Tha #3: the Sanskrit alphabet, a map of the mouth. Assembles the reel from the three.js stills
(varnamala_scene.html, varnamala_shoot.py). Slow push-in, crossfades, checked text, both logos top right on
every frame. Writes out3/video_hq.mp4 (1080x1920, 30 fps); the score is score/varnamala_score.py.
Paths: stills in /tmp/claude-0/jt3/frames, fonts in /tmp/claude-0/fonts (Noto Sans and Tiro from @fontsource)."""
import math, subprocess, json, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

D = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(D))
FR = "/tmp/claude-0/jt3/frames"
OUT = "/tmp/claude-0/jt3/out"
W, H, FPS = 1080, 1920, 30
F = "/tmp/claude-0/fonts/"
SERIF = F + "Tiro.ttf"
DEVA = F + "TiroDeva.ttf"
GOLD = (221, 166, 56)
PLASTER = (250, 248, 243)
SOFT = (222, 216, 204)
CHARCOAL = (34, 31, 36)
LBL = json.load(open(f"{FR}/labels.json"))

def sans(size, weight=400):
    return ImageFont.truetype(F + {400: "NotoSans-400.ttf", 600: "NotoSans-600.ttf", 700: "NotoSans-700.ttf"}[weight], size)

ROWS = {
    "velar": ("k  kh  g  gh  ṅ", "कखगघङ"),
    "palatal": ("c  ch  j  jh  ñ", "चछजझञ"),
    "retroflex": ("ṭ  ṭh  ḍ  ḍh  ṇ", "टठडढण"),
    "dental": ("t  th  d  dh  n", "तथदधन"),
    "labial": ("p  ph  b  bh  m", "पफबभम"),
}
# (still, eyebrow, heading, body, seconds, extra)
SEG = [
    ("hero", "JAISA THA  ·  AS IT WAS", "ka kha ga gha ṅa", "Why do the Sanskrit consonants begin like this? The first 25 are ordered by where the mouth makes them, from the back of the mouth to the lips.", 5.4, None),
    ("places", "EIGHT PLACES", "The Pāṇinīya Śikṣā", "A phonetics text ascribed to Pāṇini, its date disputed, names eight places of sound: chest, throat, head, root of the tongue, teeth, nose, lips and palate.", 6.2,
     [("chest", "Chest"), ("throat", "Throat"), ("head", "Head"), ("root", "Root of the tongue"), ("teeth", "Teeth"), ("nose", "Nose"), ("lips", "Lips"), ("palate", "Palate")]),
    ("velar", "ROW 1  ·  VELAR", None, "The back of the tongue, furthest back in the mouth.", 4.6, "ROW"),
    ("palatal", "ROW 2  ·  PALATAL", None, "The flat of the tongue against the hard palate.", 4.4, "ROW"),
    ("retroflex", "ROW 3  ·  RETROFLEX", None, "The tip of the tongue turned up and drawn back into the dome of the palate.", 4.8, "ROW"),
    ("dental", "ROW 4  ·  DENTAL", None, "The tip of the tongue at the teeth.", 4.2, "ROW"),
    ("labial", "ROW 5  ·  LABIAL", None, "The lips.", 4.0, "ROW"),
    ("rows", "BACK TO FRONT", "Five rows", "Read the rows in order and the sound moves forward, from the back of the mouth to the lips.", 5.0, "NUM"),
    ("grid", "ACROSS EACH ROW", "Breath and voice", "The place stays the same. k, then kh with a puff of breath, g voiced, gh voiced with breath, ṅ through the nose.", 6.6, "GRID"),
    ("hero", "AS IT WAS", "A map of the mouth", "This is the traditional order of the consonant rows in the Sanskrit alphabet. Learn the varṇamālā and you learn a map of the mouth.", 5.4, None),
    ("end", "", "", "", 5.4, None),
]
XF = 0.45
LABEL = "Illustrative section, not to scale. Places from published phonetics."

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
AW = Image.open(f"{REPO}/site/assets/img/archaeologywala-logo.png").convert("RGBA").resize((96, 97), Image.LANCZOS)

def logos(im):
    d = ImageDraw.Draw(im)
    im.alpha_composite(AW, (W - 84 - 124 - 64 - 96, 68))
    im.alpha_composite(TL, (W - 84 - 124, 54))
    return im

def pin(d, x, y, text, right=True):
    f = sans(31, 600)
    tw = d.textlength(text, font=f)
    if right and x + 80 + tw > W - 30:
        right = False
    if not right and x - 80 - tw < 30:
        right = True
    if right:
        d.line([(x + 9, y), (x + 50, y)], fill=GOLD + (255,), width=3)
        d.rounded_rectangle([x + 54, y - 26, x + 74 + tw, y + 24], radius=12, fill=(20, 19, 17, 190))
        d.text((x + 64, y - 22), text, font=f, fill=PLASTER + (255,))
    else:
        d.line([(x - 50, y), (x - 9, y)], fill=GOLD + (255,), width=3)
        d.rounded_rectangle([x - 74 - tw, y - 26, x - 54, y + 24], radius=12, fill=(20, 19, 17, 190))
        d.text((x - 64 - tw, y - 22), text, font=f, fill=PLASTER + (255,))

def deva_row(d, x, y, letters, size=84, gap=34):
    f = ImageFont.truetype(DEVA, size)
    for ch in letters:
        d.text((x, y), ch, font=f, fill=PLASTER + (255,))
        x += d.textlength(ch, font=f) + gap

def text_layer(still, eyebrow, heading, body, extra):
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    grad = np.zeros((H, W, 4), np.uint8)
    for y in range(1080):
        grad[y, :, :3] = (16, 15, 18); grad[y, :, 3] = int(232 * min(1, (1 - y / 1080) * 1.6) ** 1.1)
    im = Image.alpha_composite(im, Image.fromarray(grad, "RGBA"))
    d = ImageDraw.Draw(im)
    x, y = 84, 230
    d.text((x, y), eyebrow, font=sans(34, 700), fill=GOLD + (255,)); y += 62
    if extra == "ROW":
        roman, deva = ROWS[still]
        d.text((x, y), roman, font=ImageFont.truetype(SERIF, 92), fill=PLASTER + (255,)); y += 122
        deva_row(d, x, y, deva); y += 136
    else:
        d.text((x, y), heading, font=ImageFont.truetype(SERIF, 92), fill=PLASTER + (255,)); y += 128
    bf = sans(42, 400)
    for line in wrap(d, body, bf, W - 2 * x):
        d.text((x, y), line, font=bf, fill=SOFT + (255,)); y += 58
    if extra == "ROW" and still == "velar":
        d.text((x, y + 8), "Row names are modern phonetic terms.", font=sans(28, 400), fill=SOFT + (230,))
    pts = LBL[still]
    if isinstance(extra, list):
        for key, t in extra:
            px, py, _ = pts[key]
            pin(d, px, py, t, right=px > W * 0.5)
    elif extra == "ROW":
        px, py, _ = pts[still]
    elif extra == "NUM":
        f = sans(34, 700)
        for k in range(1, 6):
            px, py, _ = pts["n%d" % k]
            qx, qy = px, py - 78 - (16 if k % 2 == 0 else 0)
            d.ellipse([qx - 28, qy - 28, qx + 28, qy + 28], fill=(20, 19, 17, 215), outline=GOLD + (255,), width=3)
            n = str(k)
            d.text((qx - d.textlength(n, font=f) / 2, qy - 24), n, font=f, fill=PLASTER + (255,))
    elif extra == "GRID":
        cols = ["voiceless", "+ breath", "voiced", "voiced + breath", "nasal"]
        rows = [r[0].split() for r in ROWS.values()]
        x0, y0, cw, rh = 84, 1190, 182, 82
        d.rounded_rectangle([x0 - 20, y0 - 96, W - x0 + 20, y0 + 5 * rh + 24], radius=24, fill=(20, 19, 17, 215))
        hf = sans(24, 600)
        for c, t in enumerate(cols):
            tw = d.textlength(t, font=hf)
            d.text((x0 + c * cw + (cw - tw) / 2, y0 - 70), t, font=hf, fill=GOLD + (255,))
        cf = ImageFont.truetype(SERIF, 56)
        for r, row in enumerate(rows):
            for c, t in enumerate(row):
                tw = d.textlength(t, font=cf)
                d.text((x0 + c * cw + (cw - tw) / 2, y0 + r * rh), t, font=cf, fill=PLASTER + (255,))
    lf = sans(25, 400)
    lw = d.textlength(LABEL, font=lf)
    d.rounded_rectangle([(W - lw) / 2 - 22, H - 132, (W + lw) / 2 + 22, H - 80], radius=26, fill=(20, 19, 17, 190))
    d.text(((W - lw) / 2, H - 122), LABEL, font=lf, fill=(240, 236, 228, 240))
    return logos(im)

def end_card():
    im = Image.new("RGBA", (W, H), CHARCOAL + (255,))
    big = Image.open(f"{REPO}/site/assets/img/logo-badge.png").convert("RGBA").resize((360, 360), Image.LANCZOS)
    aw = Image.open(f"{REPO}/site/assets/img/archaeologywala-logo.png").convert("RGBA").resize((280, 284), Image.LANCZOS)
    d = ImageDraw.Draw(im)
    im.alpha_composite(big, (130, 420))
    d.ellipse([W - 130 - 360, 420, W - 130, 780], fill=(250, 248, 243, 255))
    im.alpha_composite(aw, (W - 130 - 360 + 40, 458))
    sf = ImageFont.truetype(SERIF, 54)
    y = 880
    for t in ["Learn the Sanskrit alphabet,", "sound by sound, with", "Talaash Heritage."]:
        d.text(((W - d.textlength(t, font=sf)) / 2, y), t, font=sf, fill=PLASTER); y += 78
    u = "talaash-heritage.pages.dev/sanskrit-alphabet"
    uf = sans(38, 700)
    d.text(((W - d.textlength(u, font=uf)) / 2, y + 30), u, font=uf, fill=GOLD)
    hf = sans(30, 600)
    for k, s in enumerate(["Instagram @talaashheritage  ·  YouTube @talaashheritage1967",
                           "LinkedIn and Facebook: Talaash Heritage",
                           "3D series with @archaeologywala"]):
        d.text(((W - d.textlength(s, font=hf)) / 2, 1270 + k * 50), s, font=hf, fill=PLASTER)
    rf = sans(26, 400)
    for k, s in enumerate(["Sources: Pāṇinīya Śikṣā (Kalidas Akademi ed.); S. K. Chatterji (1971);",
                           "W. D. Whitney, Sanskrit Grammar; M. M. Deshpande (1975)"]):
        d.text(((W - d.textlength(s, font=rf)) / 2, 1480 + k * 40), s, font=rf, fill=SOFT)
    lf = sans(25, 400); lw = d.textlength(LABEL, font=lf)
    d.text(((W - lw) / 2, H - 122), LABEL, font=lf, fill=(200, 196, 188))
    return logos(im).convert("RGB")

stills = {s: Image.open(f"{FR}/{s}.png").convert("RGB") for s, *_ in SEG if s != "end"}
END = end_card()
layers = [text_layer(s, e, h, b, x) if s != "end" else None for s, e, h, b, _, x in SEG]

def base_frame(i, t):
    s, dur = SEG[i][0], SEG[i][4]
    if s == "end":
        return END.copy()
    img = stills[s]
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
os.makedirs(OUT, exist_ok=True)
if os.environ.get("PREVIEW"):
    for i in range(len(SEG)):
        frame(i, SEG[i][4] - 0.6).save(f"{OUT}/p{i:02d}.png")
    print("TOTAL", round(TOTAL, 2))
    raise SystemExit
ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
                       "-i", "-", "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", "-pix_fmt", "yuv420p", f"{OUT}/video_hq.mp4"], stdin=subprocess.PIPE)
for n in range(N):
    T = n / FPS
    i = max(k for k in range(len(SEG)) if starts[k] <= T)
    t = T - starts[i]
    img = frame(i, t)
    if i > 0 and t < XF:
        img = Image.blend(frame(i - 1, T - starts[i - 1]), img, t / XF)
    ff.stdin.write(img.tobytes())
ff.stdin.close(); ff.wait()
print("TOTAL", round(TOTAL, 2), "frames", N)
