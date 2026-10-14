"""Checks guide JSON files in content/guides against content/SPEC.md.
Run: python3 tools/check_guides.py [files...]   (no arguments: every guide)
Exits non-zero if anything fails.
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPEC = open(os.path.join(ROOT, "content", "SPEC.md"), encoding="utf-8").read()
PROGRAMMES = {l.split("\t")[0] for l in open(os.path.join(ROOT, "content", "programmes.tsv"), encoding="utf-8") if l.strip()}

# Every slug named in the "Linking targets" part of the spec.
targets = SPEC.split("## Linking targets", 1)[1].split("## Checks", 1)[0]
GUIDES = set(re.findall(r"\b[a-z0-9]+(?:-[a-z0-9]+)+\b", targets)) | {"mahajanapadas"}  # single-word slugs
GUIDES = (GUIDES) - {"heritage-walk-in-", "heritage-sites-in-"}
GUIDES |= {"indian-heritage-guide", "learn"}
HAND = {"index.html", "shop.html", "finder.html", "journeys.html", "work.html", "about.html", "contact.html", "learn.html"}

BANNED = ["delve", "tapestry", "realm", "boasts", "seamless", "robust", "leverage", "unlock", "elevate", "unparalleled",
          "dive into", "nestled", "testament", "vibrant", "bustling", "hidden gem", "must-visit", "breathtaking",
          "awe-inspiring", "timeless", "truly", "incredibly", "it's important to note", "it is important to note",
          "it's worth mentioning", "in conclusion", "to sum up", "whether you're", "trust for archaeology"]
WORDS = {"pillar": (2000, 4200), "list": (1800, 4200), "explainer": (900, 2200), "city": (800, 2200), "state": (750, 2000)}


def text_of(g):
    out = [g.get("summary", ""), g.get("cta", ""), (g.get("bundle") or {}).get("pitch", "")] + g.get("audience_hooks", [])
    for s in g.get("sections", []):
        out += [s.get("h2", "")] + s.get("paras", []) + s.get("list", [])
        if s.get("table"):
            out += [" ".join(r) for r in s["table"]["rows"]]
    social = [p.get("hook", "") + " " + p.get("caption", "") for p in (g.get("social") or {}).get("posts", [])]
    out += social + [(g.get("social") or {}).get("reel", ""), g.get("og_description", "")]
    for f in g.get("faq", []):
        out += [f["q"], f["a"]]
    for k in ("stops", "sites", "museums"):
        for x in g.get(k, []):
            out += [x.get("name", ""), x.get("note", "")]
    return "\n".join(out)


def check(path):
    errs = []
    try:
        g = json.load(open(path, encoding="utf-8"))
    except Exception as e:
        return [f"invalid JSON: {e}"]
    slug = os.path.basename(path)[:-5]
    if g.get("slug") != slug:
        errs.append(f"slug field {g.get('slug')!r} does not match file name")
    if slug not in GUIDES:
        errs.append("slug is not in the spec's page list")
    for k in ("type", "pillar", "title", "seo_title", "meta_description", "keywords", "summary", "sections", "faq", "cta"):
        if not g.get(k):
            errs.append(f"missing {k}")
    t = g.get("type")
    if t not in WORDS:
        errs.append(f"bad type {t!r}")
    if len(g.get("seo_title", "")) > 65:
        errs.append(f"seo_title is {len(g['seo_title'])} chars (max 65)")
    md = g.get("meta_description", "")
    if not 120 <= len(md) <= 165:
        errs.append(f"meta_description is {len(md)} chars (want 120-165)")
    body = text_of(g)
    n = len(re.findall(r"\w+", body))
    lo, hi = WORDS.get(t, (0, 99999))
    if not lo <= n <= hi:
        errs.append(f"{n} words; want {lo}-{hi} for a {t}")
    if "—" in body or "–" in body or " -- " in body or " - " in body:
        errs.append("contains an em/en dash or spaced hyphen used as a dash")
    low = body.lower()
    for b in BANNED:
        if re.search(r"\b" + re.escape(b) + r"\b", low):
            errs.append(f"banned phrase: {b!r}")
    for href in re.findall(r"\]\(([^)]+)\)", body):
        page = href.split("#")[0]
        if page in PROGRAMMES or page in HAND or page[:-5] in GUIDES:
            continue
        errs.append(f"inline link to unknown page {href!r}")
    for r in g.get("related_guides", []):
        if r not in GUIDES:
            errs.append(f"related_guides: unknown {r!r}")
    for r in g.get("related_programmes", []):
        if r not in PROGRAMMES:
            errs.append(f"related_programmes: unknown {r!r}")
    rp = g.get("related_programmes", [])
    if not 4 <= len(rp) <= 8:
        errs.append(f"related_programmes has {len(rp)}; want 4-8")
    b = g.get("bundle") or {}
    if not (b.get("title") and b.get("pitch") and 2 <= len(b.get("items", [])) <= 3):
        errs.append("bundle needs title, pitch and 2-3 items")
    for r in b.get("items", []):
        if r not in PROGRAMMES:
            errs.append(f"bundle: unknown programme {r!r}")
    hooks = g.get("audience_hooks", [])
    if not 2 <= len(hooks) <= 3:
        errs.append("audience_hooks needs 2-3 lines")
    inline_prog = [h for h in re.findall(r"\]\(([^)#]+)", body) if h in PROGRAMMES]
    if len(inline_prog) < 2:
        errs.append(f"only {len(inline_prog)} inline links to programmes; want at least 2")
    sem = g.get("sem") or {}
    if not 5 <= len(sem.get("keywords", [])) <= 10:
        errs.append("sem.keywords needs 5-10")
    if len(sem.get("headlines", [])) != 5 or any(len(x) > 30 for x in sem.get("headlines", [])):
        errs.append("sem.headlines needs exactly 5, each at most 30 chars")
    if len(sem.get("descriptions", [])) != 2 or any(len(x) > 90 for x in sem.get("descriptions", [])):
        errs.append("sem.descriptions needs exactly 2, each at most 90 chars")
    soc = g.get("social") or {}
    if len(soc.get("posts", [])) != 3 or not soc.get("reel") or not 6 <= len(soc.get("hashtags", [])) <= 12:
        errs.append("social needs 3 posts, a reel and 6-12 hashtags")
    if not g.get("og_title") or len(g["og_title"]) > 60 or not g.get("og_description") or len(g["og_description"]) > 120:
        errs.append("og_title (<=60) and og_description (<=120) required")
    if t == "city":
        names = {s["name"] for s in g.get("stops", [])}
        if len(names) < 8:
            errs.append("city needs at least 8 stops")
        for r in g.get("routes", []):
            for s in r.get("stops", []):
                if s not in names:
                    errs.append(f"route {r.get('name')!r} uses stop {s!r} not in stops")
    if t == "state":
        if len(g.get("sites", [])) < 8:
            errs.append("state needs at least 8 sites")
        for c in g.get("cities", []):
            if c not in GUIDES:
                errs.append(f"cities: unknown {c!r}")
    return errs


def main(paths):
    if not paths:
        d = os.path.join(ROOT, "content", "guides")
        paths = sorted(os.path.join(d, f) for f in os.listdir(d) if f.endswith(".json"))
    bad = 0
    for p in paths:
        e = check(p)
        if e:
            bad += 1
            print(os.path.basename(p))
            for x in e:
                print("   ", x)
    print(f"{len(paths) - bad}/{len(paths)} files pass")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
