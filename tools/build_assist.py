#!/usr/bin/env python3
"""Writes functions/_lib/assist-data.json: what the site assistant may say about each programme and guide.
Built from the catalogue, the guides and the search index, so the assistant follows the site.
build_learn.py runs this at the end. Run it alone with: python3 tools/build_assist.py
Prices are left out on purpose: the assistant sends people to the page that shows the current price."""
import glob, json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, "site")
DETAILS = ("For", "Length", "When", "Language", "Led by", "Where")


def clean(text, limit):
    text = re.sub(r"<[^>]+>", " ", str(text or ""))
    text = re.sub(r"\s+", " ", text).strip()
    return text if len(text) <= limit else text[:limit].rsplit(" ", 1)[0]


def no_money(text):
    """Drops any sentence that carries a price, so a figure can never reach the model."""
    parts = re.split(r"(?<=[.!?])\s+", text)
    return " ".join(p for p in parts if not re.search(r"₹|\bRs\.?\b|\bINR\b|rupee|per head|per person", p, re.I))


def main():
    cat = json.load(open(os.path.join(SITE, "data", "catalogue.json"), encoding="utf-8"))
    search = json.load(open(os.path.join(SITE, "data", "search.json"), encoding="utf-8"))
    hidden = set(cat.get("hide", []))
    rows, seen = [], set()
    for p in cat["programmes"]:
        if p.get("slug") in hidden or not p.get("page") or p.get("is_active") is False:
            continue
        d = p.get("details") or {}
        facts = "; ".join(f"{k}: {clean(no_money(str(d[k])), 140)}" for k in DETAILS if d.get(k))
        text = no_money(clean(f"{p.get('subtitle', '')}. {p.get('description', '')}", 520))
        rows.append({"t": p["title"], "u": p["page"], "k": p.get("kind") or p.get("type") or "Programme", "p": p.get("venue") or "",
                     "f": clean(f"{text} {facts}", 760), "s": clean(" ".join(p.get("tags") or []), 200)})
        seen.add(p["page"])
    for path in sorted(glob.glob(os.path.join(ROOT, "content", "guides", "*.json"))):
        g = json.load(open(path, encoding="utf-8"))
        faq = " ".join(f"{i['q']} {i['a']}" for i in (g.get("faq") or [])[:3])
        rows.append({"t": g["title"], "u": f"{g['slug']}.html", "k": "Guide", "p": "",
                     "f": no_money(clean(f"{g.get('summary', '')} {faq}", 760)), "s": clean(" ".join(g.get("keywords") or []), 200)})
        seen.add(f"{g['slug']}.html")
    # One-to-one work is sold in several formats, some of them database listings outside the catalogue.
    one = "One to one, online, for Class 11 and 12 students, undergraduates, graduates and parents. A parent is welcome to join. In English and Hindi."
    rows += [
        {"t": "One-to-one career counselling", "u": "product.html?slug=counselling-archaeology-careers", "k": "One-to-one counselling", "p": "Online",
         "f": f"One private online session of about 60 minutes on study and career choices, with written next steps. There is also an application clinic, a session that includes a review of your statement of purpose and CV. {one}",
         "s": "one to one 1:1 counselling counseling career mentoring guidance session application clinic sop cv"},
        {"t": "Career course: one evening with an archaeologist", "u": "product.html?slug=career-course-one-evening", "k": "One-to-one career course", "p": "Online",
         "f": f"One private session of 2 hours with @archaeologywala on a Saturday or Sunday evening you choose, starting between 5:00 and 6:00 pm IST, booked on the site. Topics: careers in archaeology; careers with history, museums, heritage and research; studying abroad. {one}",
         "s": "one to one 1:1 one day single evening career course mentoring guidance counselling"},
        {"t": "Career course: a weekend with an archaeologist", "u": "product.html?slug=career-course-weekend", "k": "One-to-one career course", "p": "Online",
         "f": f"Two private sessions of 1 hour 30 minutes with @archaeologywala, on the Saturday and Sunday of a weekend you choose, starting between 5:00 and 6:30 pm IST, booked on the site. Topics: careers in archaeology; careers with history, museums, heritage and research; studying abroad. {one}",
         "s": "one to one 1:1 two day weekend career course mentoring guidance counselling"},
    ]
    seen.update(r["u"] for r in rows)
    # Everything else in the search index: database listings such as the career courses, and the main pages.
    kinds = search.get("kinds", {})
    for i in search["items"]:
        u = i["u"]
        slug = u[:-5] if u.endswith(".html") else u
        if u in seen or slug in hidden:
            continue
        rows.append({"t": i["t"], "u": u, "k": kinds.get(slug, i.get("k", "Page")), "p": i.get("p", ""),
                     "f": no_money(clean(i.get("x", ""), 420)), "s": ""})
        seen.add(u)
    src = open(os.path.join(SITE, "assets", "js", "search.js"), encoding="utf-8").read()
    hindi = re.findall(r'\["([ऀ-ॿ][^"]*)", "([a-z][a-z ]*)"\]', src)
    os.makedirs(os.path.join(ROOT, "functions", "_lib"), exist_ok=True)
    out = {"rows": rows, "hindi": sorted(set(hindi), key=lambda x: -len(x[0]))}
    with open(os.path.join(ROOT, "functions", "_lib", "assist-data.json"), "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, separators=(",", ":"))
    print(len(rows), "entries and", len(out["hindi"]), "Hindi names in functions/_lib/assist-data.json")


if __name__ == "__main__":
    main()
