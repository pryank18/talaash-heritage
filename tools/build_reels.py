#!/usr/bin/env python3
"""Builds the reels pages from content/reels.json.

- site/watch.html: the Instagram bio link for @talaashheritage. Lists every live reel
  with the programmes, guides or news it points to.
- site/archaeologywala.html: the "Series" block between the reels markers.

A reel is shown only once its "instagram" (or "youtube") link is filled in, so nothing
unpublished ever appears. Programme pages embed their reels through build_catalogue.py,
which reads the same file. Run:

    python3 tools/build_reels.py
    python3 tools/build_catalogue.py site/data/catalogue.json
"""
import html
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, "site")
SITE_URL = "https://talaash-heritage.pages.dev/"
h = html.escape

SERIES = {
    "jaisa-tha": ("Jaisa Tha", "Sites as they were, rebuilt in 3D from the excavation reports."),
    "ancient-india-3d": ("Ancient India in 3D", "@archaeologywala rebuilds what was dug up, in 3D."),
    "explorer": ("Explorer", "@archaeologywala walks a site from end to end."),
    "news": ("From the Heritage desk", "New finds, explained in under a minute."),
    "khudai-khabar": ("Khudai Khabar", "Real archaeology news, told as satire by @archaeologywala."),
}
ORDER = ["jaisa-tha", "ancient-india-3d", "explorer", "news", "khudai-khabar"]
IG_RE = re.compile(r"^https://www\.instagram\.com/(?:[A-Za-z0-9_.]+/)?(?:reel|p)/[A-Za-z0-9_-]+/?$")
YT_RE = re.compile(r"^[A-Za-z0-9_-]{11}$")


def load():
    data = json.load(open(os.path.join(ROOT, "content", "reels.json"), encoding="utf-8"))
    reels = data["reels"]
    ids = set()
    for r in reels:
        assert r["id"] not in ids, f"duplicate reel id {r['id']}"
        ids.add(r["id"])
        assert r["series"] in SERIES, f"{r['id']}: unknown series {r['series']}"
        if r.get("instagram"):
            assert IG_RE.match(r["instagram"]), f"{r['id']}: not an Instagram post link: {r['instagram']}"
        if r.get("youtube"):
            assert YT_RE.match(r["youtube"]), f"{r['id']}: youtube must be the 11-character video id"
        if r["series"] == "khudai-khabar":
            assert not r.get("pages"), f"{r['id']}: satire must not point at programme pages"
        for p in r.get("pages", []):
            assert os.path.exists(os.path.join(SITE, p + ".html")), f"{r['id']}: no page site/{p}.html"
    return reels


def live(reels):
    out = [r for r in reels if r.get("instagram") or r.get("youtube")]
    return sorted(out, key=lambda r: r.get("date") or "", reverse=True)


def page_title(slug):
    text = open(os.path.join(SITE, slug + ".html"), encoding="utf-8").read()
    m = re.search(r"<h1[^>]*>(.*?)</h1>", text, re.S)
    return html.unescape(re.sub(r"<[^>]+>", "", m.group(1))).strip() if m else slug


def is_programme(slug):
    text = open(os.path.join(SITE, slug + ".html"), encoding="utf-8").read()
    return 'id="programme-data"' in text


def embed(r):
    if r.get("youtube"):
        return (f'<div class="reel-frame"><iframe src="https://www.youtube-nocookie.com/embed/{h(r["youtube"])}" '
                f'title="{h(r["title"])}" loading="lazy" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe></div>')
    url = r["instagram"].rstrip("/") + "/"
    return (f'<blockquote class="instagram-media" data-instgrm-permalink="{h(url)}" data-instgrm-version="14">'
            f'<a href="{h(url)}" rel="noopener">{h(r["title"])}, on Instagram</a></blockquote>')


def links(r):
    items = []
    for p in r.get("pages", []):
        label = "Go there with us" if is_programme(p) else ("Read the story" if p.startswith("news-") else "Read the guide")
        items.append(f'<li><a href="{h(p)}.html">{h(page_title(p))}</a> <span class="muted small">{label}</span></li>')
    return f'<ul class="reel-links">{"".join(items)}</ul>' if items else ""


def by_line(r):
    who = "@" + r["account"] + (f" with @{r['collab']}" if r.get("collab") else "")
    return f'<p class="small muted">{h(who)}</p>'


def card(r):
    return (f'<article class="reel" id="{h(r["id"])}"><h3>{h(r["title"])}</h3>{by_line(r)}'
            f'<p>{h(r["blurb"])}</p>{embed(r)}{links(r)}</article>')


def head(title, desc, url, robots):
    return f"""<!doctype html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<script src="assets/js/theme.js"></script>
<title>{h(title)}</title>
<meta name="description" content="{h(desc)}">
{robots}<link rel="canonical" href="{SITE_URL}{url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Talaash Heritage">
<meta property="og:url" content="{SITE_URL}{url}">
<meta property="og:title" content="{h(title)}">
<meta property="og:description" content="{h(desc)}">
<meta property="og:image" content="{SITE_URL}assets/img/logo-badge.png">
<meta name="theme-color" content="#2a2926">
<link rel="icon" href="assets/img/favicon-64.png" type="image/png">
<link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">
<link rel="manifest" href="manifest.webmanifest">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Talaash">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Noto+Sans+Devanagari:wght@400;600&family=Tiro+Devanagari+Sanskrit:ital@0;1&display=swap">
<link rel="stylesheet" href="assets/css/styles.css">
</head>"""


def watch_page(shown):
    sections = []
    for s in ORDER:
        rs = [r for r in shown if r["series"] == s and "talaashheritage" in (r["account"], r.get("collab"))]
        if not rs:
            continue
        name, line = SERIES[s]
        sections.append(f'<section class="reel-series"><h2>{h(name)}</h2><p class="muted">{h(line)}</p>'
                        f'<div class="reel-grid">{"".join(card(r) for r in rs)}</div></section>')
    if sections:
        body = "".join(sections)
        robots = ""
    else:
        body = ('<div class="doc"><p>Our reels are on Instagram. Each one ends here, with the walk, course or guide '
                'it comes from.</p></div>')
        robots = '<meta name="robots" content="noindex">\n'
    ig_script = ""  # Instagram loads only on request: site/assets/js/embeds.js
    return head("Reels: watch, then go there with us | Talaash Heritage",
                "Talaash Heritage reels on Indian history and archaeology, each linked to the walk, course or guide it comes from.",
                "watch.html", robots) + f"""
<body data-gate="open" data-english-only="1">
<div id="site-header"></div>
<main id="main">
<div class="wrap">
  <header class="page-head creator-head">
    <p class="guide-eyebrow">Reels</p>
    <h1>Watch, then go there with us</h1>
    <p class="guide-lede">Short films on Indian history and archaeology from Talaash Heritage and @archaeologywala. Every reel here links to the walk, course or guide it comes from.</p>
    <div class="buy-row">
      <a class="btn btn-primary" href="shop.html">Everything we offer</a>
      <a class="btn btn-outline" href="https://www.instagram.com/talaashheritage/" rel="noopener" target="_blank">Follow on Instagram</a>
    </div>
  </header>
  {body}
  <p class="small muted ig-note">Instagram reels load only when you ask; Instagram and YouTube may then set their own cookies.</p>
</div>
</main>
<div id="site-footer"></div>
<script type="module" src="assets/js/layout.js"></script>{ig_script}
</body>
</html>
"""


START, END = "<!-- reels:start -->", "<!-- reels:end -->"


def creator_block(shown):
    mine = [r for r in shown if r["account"] == "archaeologywala"]
    parts = [f"{START}\n    <h2>Series</h2>"]
    for s in ["khudai-khabar", "explorer", "news", "jaisa-tha"]:
        rs = [r for r in mine if r["series"] == s]
        if not rs:
            continue
        name, line = SERIES[s]
        items = "".join(
            f'<li><a href="{h((r.get("instagram") or "https://www.youtube.com/shorts/" + r["youtube"]))}" rel="noopener" target="_blank">{h(r["title"])}</a>'
            + ("".join(f' · <a href="{h(p)}.html">{h(page_title(p))}</a>' for p in r.get("pages", []) if is_programme(p)))
            + "</li>" for r in rs)
        parts.append(f"    <h3>{h(name)}</h3>\n    <p>{h(line)}</p>\n    <ul>{items}</ul>")
    if len(parts) == 1:
        parts.append("    <p>Episodes of his Instagram series are listed here as they go live.</p>")
    parts.append(f"    {END}")
    return "\n".join(parts)


def main():
    reels = load()
    shown = live(reels)
    open(os.path.join(SITE, "watch.html"), "w", encoding="utf-8").write(watch_page(shown))
    path = os.path.join(SITE, "archaeologywala.html")
    text = open(path, encoding="utf-8").read()
    block = creator_block(shown)
    if START in text:
        text = re.sub(re.escape(START) + r".*?" + re.escape(END), lambda m: block, text, flags=re.S)
    else:
        anchor = "    <h2>From the field</h2>"
        assert anchor in text, "creator page: anchor for the series block not found"
        text = text.replace(anchor, "    " + block + "\n" + anchor, 1)
    open(path, "w", encoding="utf-8").write(text)
    print(f"{len(shown)} live reel(s) of {len(reels)}; wrote watch.html and the creator page series block")


if __name__ == "__main__":
    sys.exit(main())
