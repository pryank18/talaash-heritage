#!/usr/bin/env python3
"""Rewrite absolute site URLs to the form Cloudflare Pages actually serves.

Cloudflare Pages answers /page.html with a 308 redirect to /page, and /index.html
with a redirect to /. Canonical tags, og:url, JSON-LD, sitemaps and llms.txt must
point at the final address, or search engines see every listed page as a redirect.

Only absolute https://talaash-heritage.pages.dev/... URLs are touched. Relative
links inside the pages stay as they are (they still work through the redirect).

Run after any build (the GitHub Action "SEO: clean URLs and IndexNow" runs it on
every push to main). Prints the files it changed. Exit code 0 always.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "site"
HOST = "https://talaash-heritage.pages.dev/"
PATTERN = re.compile(r"https://talaash-heritage\.pages\.dev/((?:[A-Za-z0-9_\-]+/)*)([A-Za-z0-9_\-]+)\.html(?![A-Za-z0-9_\-])")


def clean(text: str) -> str:
    def repl(m: re.Match) -> str:
        folder, name = m.group(1), m.group(2)
        if name == "index":
            return HOST + folder
        return HOST + folder + name
    return PATTERN.sub(repl, text)


def targets():
    yield from ROOT.rglob("*.html")
    yield from ROOT.glob("sitemap*.xml")
    llms = ROOT / "llms.txt"
    if llms.exists():
        yield llms


def main() -> int:
    changed = []
    for path in targets():
        text = path.read_text(encoding="utf-8")
        new = clean(text)
        if new != text:
            path.write_text(new, encoding="utf-8")
            changed.append(path.relative_to(ROOT.parent).as_posix())
    for c in changed:
        print(c)
    if "--self-test" in sys.argv:
        cases = {
            "https://talaash-heritage.pages.dev/purana-qila.html": "https://talaash-heritage.pages.dev/purana-qila",
            "https://talaash-heritage.pages.dev/index.html": "https://talaash-heritage.pages.dev/",
            "https://talaash-heritage.pages.dev/news/x-y.html#a": "https://talaash-heritage.pages.dev/news/x-y#a",
            "https://talaash-heritage.pages.dev/product.html?slug=a": "https://talaash-heritage.pages.dev/product?slug=a",
            "https://talaash-heritage.pages.dev/media/ig/a-1.jpg": "https://talaash-heritage.pages.dev/media/ig/a-1.jpg",
            "https://talaash-heritage.pages.dev/": "https://talaash-heritage.pages.dev/",
        }
        for a, b in cases.items():
            assert clean(a) == b, (a, clean(a), b)
        print("self-test ok")
    return 0


if __name__ == "__main__":
    sys.exit(main())
