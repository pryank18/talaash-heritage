#!/usr/bin/env python3
"""Reel QC: mechanical checks every Talaash reel must pass before its queue row is set Ready.

Usage:
  python3 tools/reel_qc.py path/to/reel.mp4 [--3d] [--report out.json]

Checks (all must pass):
  format    h264 video 1080x1920, 24-60 fps, AAC audio present, 5-90 s
  loudness  integrated -15 to -13 LUFS, true peak <= -1.0 dBTP
  music     real music, not silence and not a static bed: enough note onsets
            (>= 0.5 per second), no silent gap over 1.5 s before the last 3 s, and a
            changing spectrum (neighbouring 0.5 s blocks correlate <= 0.86; a drone sits near 0.92+)
  bass      share of energy below 100 Hz <= 25% (phone speakers)
  logos     Talaash logo in the top-right corner on every sampled frame (every 1 s), plus the
            archaeologywala logo beside it on every sampled frame when --3d is given
            (masked template match, so any background colour works; the last
            4 s, the end card, may carry only one of the two small logos)
  size      file under 100 MB
Writes a contact sheet (one frame every 3 s) next to the report for the visual review.
Exit code 0 = PASS, 1 = FAIL.
"""
import json, os, subprocess, sys
from fractions import Fraction
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TALAASH_LOGO = os.path.join(ROOT, "site/assets/img/logo-192.png")
AW_LOGO = os.path.join(ROOT, "site/assets/img/archaeologywala-logo.png")


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)


def probe(path):
    r = run(["ffprobe", "-v", "error", "-show_entries",
             "stream=codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels:format=duration,size",
             "-of", "json", path])
    return json.loads(r.stdout)


def audio(path, sr=22050):
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vn", "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"],
                       capture_output=True)
    return np.frombuffer(r.stdout, dtype=np.float32), sr


def loudness(path):
    r = run(["ffmpeg", "-hide_banner", "-i", path, "-vn", "-af", "ebur128=peak=true", "-f", "null", "-"])
    I = tp = None
    for line in r.stderr.splitlines()[::-1]:
        s = line.strip()
        if s.startswith("I:") and I is None:
            I = float(s.split()[1])
        if s.startswith("Peak:") and tp is None:
            tp = float(s.split()[1])
    return I, tp


def onset_rate(x, sr):
    hop, win = 512, 2048
    if len(x) < win * 4:
        return 0.0, 0.0
    frames = np.lib.stride_tricks.sliding_window_view(x, win)[::hop] * np.hanning(win)
    mag = np.abs(np.fft.rfft(frames, axis=1))
    flux = np.maximum(np.diff(np.log1p(mag * 100), axis=0), 0).sum(axis=1)
    thr = np.median(flux) + 1.5 * np.std(flux)
    peaks = [i for i in range(1, len(flux) - 1) if flux[i] > thr and flux[i] >= flux[i - 1] and flux[i] >= flux[i + 1]]
    # merge onsets closer than 80 ms
    merged, last = [], -1e9
    for p in peaks:
        t = p * hop / sr
        if t - last > 0.08:
            merged.append(t); last = t
    dur = len(x) / sr
    return len(merged) / dur, dur


def steadiness(x, sr):
    """Median spectral correlation between neighbouring 0.5 s blocks. A drone or static bed stays near 1."""
    blk = int(0.5 * sr); n = len(x) // blk
    if n < 4:
        return 1.0
    S = np.array([np.log1p(np.abs(np.fft.rfft(x[i * blk:(i + 1) * blk] * np.hanning(blk)))[:4000] * 100) for i in range(n)])
    with np.errstate(invalid="ignore", divide="ignore"):
        d = [np.corrcoef(S[i], S[i + 1])[0, 1] for i in range(n - 1)]
    return float(np.median(np.nan_to_num(d, nan=1.0)))


def longest_gap(x, sr, end_skip=3.0):
    blk = int(0.05 * sr)
    n = int((len(x) - end_skip * sr) // blk)
    if n <= 0:
        return 0.0
    rms = np.sqrt((x[: n * blk].reshape(n, blk) ** 2).mean(1) + 1e-12)
    db = 20 * np.log10(rms)
    quiet = db < -50
    best = cur = 0
    for q in quiet:
        cur = cur + 1 if q else 0
        best = max(best, cur)
    return best * 0.05


def bass_share(x, sr):
    X = np.abs(np.fft.rfft(x)) ** 2
    f = np.fft.rfftfreq(len(x), 1 / sr)
    return float(X[f < 100].sum() / (X.sum() + 1e-12))


def gray_frames(path, fps=1.0, w=540, h=960):
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vf", f"fps={fps},scale={w}:{h},format=gray",
                        "-f", "rawvideo", "-"], capture_output=True)
    a = np.frombuffer(r.stdout, dtype=np.uint8)
    return a.reshape(-1, h, w).astype(np.float32)


def load_logo(png, size):
    """Grey template plus its alpha mask, so the background behind the logo does not matter."""
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", png, "-vf",
                        f"scale={size}:{size}:force_original_aspect_ratio=decrease,pad={size}:{size}:(ow-iw)/2:(oh-ih)/2:color=black@0,format=rgba",
                        "-f", "rawvideo", "-"], capture_output=True)
    a = np.frombuffer(r.stdout, dtype=np.uint8).reshape(size, size, 4).astype(np.float32)
    grey = 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]
    mask = a[..., 3] > 128
    return grey, mask


def best_match(frame, tpl, region, avoid=None):
    """Masked normalised cross-correlation of tpl (grey, mask) over region (y0,y1,x0,x1), 2 px stride.
    Positions overlapping the box `avoid` (y, x, h, w) are skipped. Returns (score, (y, x, h, w))."""
    grey, mask = tpl
    y0, y1, x0, x1 = region
    th, tw = grey.shape
    t = grey[mask]; t = t - t.mean(); tn = np.sqrt((t ** 2).sum()) + 1e-6
    best, where = -1.0, None
    for y in range(y0, max(y0 + 1, y1 - th), 2):
        for x in range(x0, max(x0 + 1, x1 - tw), 2):
            if avoid is not None:
                ay, ax, ah, aw = avoid
                if y < ay + ah and ay < y + th and x < ax + aw and ax < x + tw:
                    continue
            p = frame[y:y + th, x:x + tw]
            if p.shape != grey.shape:
                continue
            p = p[mask]; p = p - p.mean(); pn = np.sqrt((p ** 2).sum()) + 1e-6
            sc = float((p * t).sum() / (pn * tn))
            if sc > best:
                best, where = sc, (y, x, th, tw)
    return best, where


T_MIN, AW_MIN = 0.60, 0.75


def logo_check(path, need_aw):
    fr = gray_frames(path)
    region = (0, 140, 300, 540)  # top-right band at 540x960
    res = {"frames": len(fr), "talaash_min": None, "aw_min": None, "fail_at": []}
    for f in (TALAASH_LOGO, AW_LOGO if need_aw else TALAASH_LOGO):
        if not os.path.exists(f):
            res["error"] = "logo file missing: " + f
            return False, res
    tals = [load_logo(TALAASH_LOGO, s) for s in (56, 64, 72)]
    aws = [load_logo(AW_LOGO, s) for s in (40, 48, 56)] if need_aw else []
    scores_t, scores_a = [], []
    end_card_from = len(fr) - 4
    ok = True
    for i, f in enumerate(fr):
        st, box = max((best_match(f, t, region) for t in tals), key=lambda r: r[0])
        scores_t.append(st)
        if need_aw:
            # the archaeologywala logo must be found somewhere other than on the Talaash logo
            sa = max(best_match(f, a, region, avoid=box if st >= T_MIN else None)[0] for a in aws)
        else:
            sa = 1.0
        scores_a.append(sa)
        t_ok, a_ok = st >= T_MIN, sa >= AW_MIN
        on_end = i >= end_card_from
        if not (t_ok and a_ok) and not (on_end and (t_ok or a_ok)):
            ok = False
            res["fail_at"].append({"t": i, "talaash": round(st, 2), "aw": round(sa, 2)})
    res["talaash_min"] = round(min(scores_t), 2) if scores_t else None
    res["aw_min"] = round(min(scores_a), 2) if need_aw and scores_a else None
    return ok, res


def contact_sheet(path, out_png):
    run(["ffmpeg", "-v", "error", "-y", "-i", path, "-vf", "fps=1/3,scale=216:384,tile=8x3", "-frames:v", "1", out_png])


def main():
    args = sys.argv[1:]
    if not args:
        print(__doc__); sys.exit(2)
    path = args[0]
    need_aw = "--3d" in args
    report_path = args[args.index("--report") + 1] if "--report" in args else os.path.splitext(path)[0] + ".qc.json"
    checks = {}
    p = probe(path)
    v = next((s for s in p["streams"] if s["codec_type"] == "video"), None)
    a = next((s for s in p["streams"] if s["codec_type"] == "audio"), None)
    dur = float(p["format"]["duration"]); size = int(p["format"]["size"])
    fps = float(Fraction(v["r_frame_rate"])) if v else 0
    checks["format"] = {"pass": bool(v and v["codec_name"] == "h264" and v["width"] == 1080 and v["height"] == 1920
                                     and 24 <= fps <= 60 and a and a["codec_name"] == "aac" and 5 <= dur <= 90),
                        "video": v and f'{v["codec_name"]} {v["width"]}x{v["height"]} {fps:.2f}fps',
                        "audio": a and f'{a["codec_name"]} {a.get("sample_rate")}Hz {a.get("channels")}ch',
                        "duration": round(dur, 2)}
    checks["size"] = {"pass": size < 100 * 1024 * 1024, "bytes": size}
    if a:
        I, tp = loudness(path)
        checks["loudness"] = {"pass": I is not None and -15 <= I <= -13 and tp is not None and tp <= -1.0,
                              "lufs": I, "true_peak": tp}
        x, sr = audio(path)
        rate, _ = onset_rate(x, sr)
        gap = longest_gap(x, sr)
        sted = steadiness(x, sr)
        checks["music"] = {"pass": rate >= 0.5 and gap <= 1.5 and sted <= 0.86, "onsets_per_s": round(rate, 2),
                           "longest_silence_s": round(gap, 2), "steadiness": round(sted, 3)}
        bs = bass_share(x, sr)
        checks["bass"] = {"pass": bs <= 0.25, "share_below_100hz": round(bs, 3)}
    else:
        for k in ("loudness", "music", "bass"):
            checks[k] = {"pass": False, "error": "no audio stream"}
    ok, lr = logo_check(path, need_aw)
    checks["logos"] = dict(pass_=ok, **lr)
    checks["logos"]["pass"] = checks["logos"].pop("pass_")
    sheet = os.path.splitext(report_path)[0] + ".sheet.png"
    contact_sheet(path, sheet)
    result = "PASS" if all(c["pass"] for c in checks.values()) else "FAIL"
    rep = {"file": os.path.basename(path), "result": result, "checks": checks, "contact_sheet": sheet}
    with open(report_path, "w") as fh:
        json.dump(rep, fh, indent=1)
    print(json.dumps(rep, indent=1))
    sys.exit(0 if result == "PASS" else 1)


if __name__ == "__main__":
    main()
