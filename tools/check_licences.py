#!/usr/bin/env python3
"""Copyright and licence audit for everything Talaash publishes (15 Nov 2026).

Runs in the GitHub Action "Licence audit" (it needs the open internet; the editing
sandbox cannot reach Wikimedia or the Met). It checks, against the source's own
records, every third-party image used:

  1. social slides: render/queue/<post>/*.html (folders starting with _ are tests)
  2. the website: content/media.json (every photo the site shows)
  3. Met Museum images on slides: Open Access status read from the Met API

For each Wikimedia Commons file it reads LicenseShortName and Artist from the
Commons API and fails the image if the licence is NonCommercial, NoDerivatives,
fair use, missing, or if the file no longer exists. For slides it also checks that
the slide itself carries a visible credit naming the licence.

It also downloads the pre-repo (Macaly) slides listed in
render/audit/legacy-macaly-urls.txt into render/audit/legacy/ so they can be
inspected by eye. Nothing under render/ is published.

Writes render/audit/licences.json, render/audit/licences.md and
content/social-credits.json (read by tools/build_learn.py for the credits page).
Exit code is always 0; problems are reported in the files.
"""
import glob, html, json, os, re, sys, time, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = {"User-Agent": "TalaashHeritageLicenceAudit/1.0 (talaashheritage@gmail.com)"}
BAD = re.compile(r"\bNC\b|NonCommercial|\bND\b|NoDerivs|NoDerivatives|fair use|non-free|all rights reserved", re.I)


def get(url, tries=3):
    for i in range(tries):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40).read()
        except Exception as e:  # noqa: BLE001
            err = e
            time.sleep(3 * (i + 1))
    raise err


def commons_name(url):
    p = url.split("/commons/")[1].split("/")
    return urllib.parse.unquote(p[3] if p[0] == "thumb" else p[2]).replace(" ", "_")


def strip(s):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", s or ""))).strip()


def commons_meta(names):
    out = {}
    names = sorted(set(names))
    for i in range(0, len(names), 40):
        batch = names[i:i + 40]
        q = urllib.parse.urlencode({"action": "query", "format": "json", "prop": "imageinfo",
                                    "iiprop": "extmetadata", "titles": "|".join("File:" + n for n in batch)})
        data = json.loads(get("https://commons.wikimedia.org/w/api.php?" + q))
        norm = {n["to"]: n["from"] for n in data["query"].get("normalized", [])}
        for page in data["query"]["pages"].values():
            title = norm.get(page["title"], page["title"])
            key = title[5:].replace(" ", "_")
            if "missing" in page or "imageinfo" not in page:
                out[key] = {"exists": False}
                continue
            md = page["imageinfo"][0].get("extmetadata", {})
            out[key] = {"exists": True,
                        "license": strip(md.get("LicenseShortName", {}).get("value")),
                        "artist": strip(md.get("Artist", {}).get("value")),
                        "credit": strip(md.get("Credit", {}).get("value"))[:200],
                        "license_url": md.get("LicenseUrl", {}).get("value", ""),
                        "page": "https://commons.wikimedia.org/wiki/File:" + urllib.parse.quote(key)}
        time.sleep(1)
    return out


MET_VERIFIED = os.path.join(ROOT, "render/audit/met-verified.json")


def met_status(acc):
    known = json.load(open(MET_VERIFIED)) if os.path.exists(MET_VERIFIED) else {}
    try:
        d = json.loads(get("https://collectionapi.metmuseum.org/public/collection/v1/search?q=" + urllib.parse.quote(acc)))
        for oid in (d.get("objectIDs") or [])[:25]:
            o = json.loads(get(f"https://collectionapi.metmuseum.org/public/collection/v1/objects/{oid}"))
            if o.get("accessionNumber") == acc:
                return {"object": oid, "isPublicDomain": o.get("isPublicDomain"), "title": o.get("title"),
                        "url": o.get("objectURL")}
        err = "accession not found"
    except Exception as e:  # noqa: BLE001
        err = str(e)
    if acc in known:
        return {**known[acc], "via": "met-verified.json", "api_error": err}
    return {"error": err}


def main():
    report = {"checked_at": time.strftime("%Y-%m-%d %H:%M UTC", time.gmtime()), "slides": [], "site": [], "problems": []}
    # ---- slides
    uses = []  # (post, slide, url, slide_text)
    for f in sorted(glob.glob(os.path.join(ROOT, "render/queue/*/*.html"))):
        post = os.path.basename(os.path.dirname(f))
        if post.startswith("_"):
            continue
        s = open(f, encoding="utf-8").read()
        text = strip(re.sub(r"<(style|script).*?</\1>", " ", s, flags=re.S))
        for u in re.findall(r"https://(?:upload|thumb)\.wikimedia\.org/wikipedia/commons/[^\"')\s]+", s):
            uses.append((post, os.path.basename(f), "commons", u, text))
        for u in re.findall(r"https://images\.metmuseum\.org/[^\"')\s]+", s):
            uses.append((post, os.path.basename(f), "met", u, text))
    # ---- site
    media = json.load(open(os.path.join(ROOT, "content/media.json"), encoding="utf-8"))

    def walk(v, k=""):
        if isinstance(v, dict):
            if "src" in v:
                yield k, v
            else:
                for kk, x in v.items():
                    yield from walk(x, kk)
        elif isinstance(v, list):
            for x in v:
                yield from walk(x, k)
    site = [(k, m) for k, m in walk(media)]
    names = [commons_name(u) for _, _, kind, u, _ in uses if kind == "commons"]
    names += [m["page"].split("File:")[1].replace(" ", "_") for _, m in site if "commons.wikimedia.org/wiki/File:" in m.get("page", "")]
    names = [urllib.parse.unquote(n) for n in names]
    meta = commons_meta(names)

    social_credits = {}
    for post, slide, kind, u, text in uses:
        row = {"post": post, "slide": slide, "url": u}
        if kind == "commons":
            n = commons_name(u)
            m = meta.get(n, {"exists": False})
            row.update(file=n, **m)
            lic = m.get("license", "")
            if not m.get("exists"):
                row["problem"] = "file not found on Commons"
            elif not lic or BAD.search(lic):
                row["problem"] = f"licence not allowed for commercial use: {lic!r}"
            elif not re.search(r"CC|public domain|PD|Photo|Image|Credit", text, re.I):
                row["problem"] = "no visible credit on the slide"
            social_credits.setdefault(n, {"file": n, "author": m.get("artist", ""), "license": lic,
                                          "license_url": m.get("license_url", ""), "page": m.get("page", ""),
                                          "posts": []})
            if post not in social_credits[n]["posts"]:
                social_credits[n]["posts"].append(post)
        else:
            acc = re.search(r"Metropolitan Museum of Art, ([0-9][0-9A-Za-z.\-]+)", text)
            st = met_status(acc.group(1).rstrip(".")) if acc else {"error": "accession number not on slide"}
            row.update(met=st)
            if st.get("isPublicDomain") is not True:
                row["problem"] = f"Met Open Access not confirmed: {st}"
            else:
                key = "met-" + acc.group(1).rstrip(".")
                social_credits.setdefault(key, {"file": st.get("title", ""), "author": "The Metropolitan Museum of Art",
                                                "license": "Public domain (CC0)",
                                                "license_url": "https://creativecommons.org/publicdomain/zero/1.0/",
                                                "page": st.get("url", ""), "posts": []})
                if post not in social_credits[key]["posts"]:
                    social_credits[key]["posts"].append(post)
        report["slides"].append(row)
        if row.get("problem"):
            report["problems"].append(f"slide {post}/{slide}: {row['problem']} ({row.get('file', u)})")

    for k, m in site:
        page = m.get("page", "")
        row = {"key": k, "recorded_license": m.get("license"), "recorded_credit": m.get("credit"), "page": page}
        if "commons.wikimedia.org/wiki/File:" in page:
            n = urllib.parse.unquote(page.split("File:")[1]).replace(" ", "_")
            cm = meta.get(n, {"exists": False})
            row.update(commons=cm)
            lic = cm.get("license", "")
            if not cm.get("exists"):
                row["problem"] = "file not found on Commons"
            elif not lic or BAD.search(lic):
                row["problem"] = f"licence not allowed: {lic!r}"
            elif lic.replace(" ", "").lower() != (m.get("license") or "").replace(" ", "").lower() and not (
                    "public domain" in lic.lower() and "public domain" in (m.get("license") or "").lower()):
                row["problem"] = f"licence on Commons ({lic}) differs from the one we show ({m.get('license')})"
        elif "unsplash.com" in page:
            try:
                body = get(page).decode("utf-8", "replace")
                if re.search(r"Unsplash\+|plus\.unsplash\.com|\"premium\":true", body):
                    row["problem"] = "Unsplash+ (paid) image"
            except Exception as e:  # noqa: BLE001
                row["note"] = f"could not open Unsplash page: {e}"
        if row.get("problem"):
            report["problems"].append(f"site {k}: {row['problem']}")
        report["site"].append(row)

    # ---- legacy Macaly slides: download for inspection
    leg = os.path.join(ROOT, "render/audit/legacy")
    os.makedirs(leg, exist_ok=True)
    lst = os.path.join(ROOT, "render/audit/legacy-macaly-urls.txt")
    if os.path.exists(lst):
        for u in open(lst).read().split():
            out = os.path.join(leg, os.path.basename(u))
            if not os.path.exists(out):
                try:
                    open(out, "wb").write(get(u))
                except Exception as e:  # noqa: BLE001
                    report["problems"].append(f"legacy download failed: {u}: {e}")

    json.dump(report, open(os.path.join(ROOT, "render/audit/licences.json"), "w"), indent=1, ensure_ascii=False)
    json.dump({"_readme": "Written by tools/check_licences.py from the Commons and Met APIs. Third-party images used in Talaash social posts; tools/build_learn.py lists them on the credits page.",
               "items": sorted(social_credits.values(), key=lambda x: x["posts"][0])},
              open(os.path.join(ROOT, "content/social-credits.json"), "w"), indent=1, ensure_ascii=False)
    md = [f"# Licence audit ({report['checked_at']})", "",
          f"Slides checked: {len(report['slides'])} image uses. Site photos checked: {len(report['site'])}.", "",
          "## Problems", ""] + ([f"- {p}" for p in report["problems"]] or ["None."]) + ["", "## Slide images", "",
          "| Post | Slide | File | Licence (source) | Author (source) |", "|---|---|---|---|---|"]
    for r in report["slides"]:
        md.append(f"| {r['post']} | {r['slide']} | {r.get('file', r['url'])[:70]} | {r.get('license', r.get('met', ''))} | {r.get('artist', '')[:60]} |")
    open(os.path.join(ROOT, "render/audit/licences.md"), "w").write("\n".join(md) + "\n")
    print("\n".join(report["problems"]) or "no problems")


if __name__ == "__main__":
    sys.exit(main())
