"""Exports the marketing team's working files from content/guides, so SEO, paid
search and social all point at the same pages with the same message.

Writes to docs/marketing/:
  keyword-map.csv      every target keyword, its intent and the page that owns it
  google-ads.csv       campaigns, ad groups, keywords, negatives and responsive
                       search ads, in the Google Ads Editor import format
  social-calendar.csv  90 days of Instagram, Facebook and LinkedIn posts and reels,
                       each with a tracked link back to its guide
  pages.csv            one row per guide: titles, share text, bundle, programmes

Run: python3 tools/export_marketing.py [start date, default next Monday]
"""
import csv, datetime, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GUIDE_DIR = os.path.join(ROOT, "content", "guides")
OUT = os.path.join(ROOT, "docs", "marketing")
SITE_URL = "https://talaash-heritage.pages.dev/"
os.makedirs(OUT, exist_ok=True)

GUIDES = [json.load(open(os.path.join(GUIDE_DIR, f), encoding="utf-8")) for f in sorted(os.listdir(GUIDE_DIR)) if f.endswith(".json")]
BY = {g["slug"]: g for g in GUIDES}

BOOKING = re.compile(r"\b(walk|walks|walking|tour|tours|trip|course|courses|class|classes|workshop|lecture|guided|guide for|book|booking|near me|for schools|school trip|field trip|study tour|counsell|coaching|online|certificate|admission|itinerary|package)\b")
INFO = re.compile(r"\b(what|how|why|who|when|which|meaning|definition|facts|notes|list|history|timeline|types|difference|examples|essay|pdf|upsc|for students|explained)\b")


def intent(k):
    if BOOKING.search(k):
        return "Booking"
    if re.search(r"\b(in|near) [a-z]", k) and not INFO.search(k):
        return "Local discovery"
    if INFO.search(k):
        return "Informational"
    return "Informational"


def url(g, **utm):
    q = "&".join(f"utm_{k}={v}" for k, v in utm.items())
    return f"{SITE_URL}{g['slug']}.html" + (f"?{q}" if q else "")


def campaign(g):
    return {"city": "Search | Heritage walks by city", "state": "Search | Heritage travel by state"}.get(
        g["type"], {"sanskrit": "Search | Languages and scripts", "anthropology": "Search | Learning and careers",
                    "archaeology": "Search | Learning and careers"}.get(g["pillar"], "Search | Lectures, walks and tours"))


# 1. Keyword map
with open(os.path.join(OUT, "keyword-map.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["Keyword", "Intent", "Role", "Page", "Page type", "Topic", "Also in Google Ads"])
    seen = set()
    for g in GUIDES:
        ads = set(g["sem"]["keywords"])
        for i, k in enumerate(g["keywords"]):
            k = k.lower().strip()
            if k in seen:
                continue
            seen.add(k)
            w.writerow([k, intent(k), "Main" if i == 0 else "Supporting", url(g), g["type"], g["pillar"], "Yes" if k in ads else ""])
        for k in g["sem"]["keywords"]:
            k = k.lower().strip()
            if k not in seen:
                seen.add(k)
                w.writerow([k, "Booking", "Paid", url(g), g["type"], g["pillar"], "Yes"])
print(len(seen), "keywords mapped")

# 2. Google Ads Editor import
with open(os.path.join(OUT, "google-ads.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["Campaign", "Ad group", "Keyword", "Criterion Type", "Ad type", "Headline 1", "Headline 2", "Headline 3", "Headline 4", "Headline 5",
                "Description 1", "Description 2", "Final URL", "Path 1", "Path 2"])
    groups = 0
    for g in GUIDES:
        c, ag = campaign(g), g["sem"]["ad_group"]
        final = url(g, source="google", medium="cpc", campaign=re.sub(r"[^a-z0-9]+", "-", c.lower()).strip("-"), content=g["slug"])
        for k in g["sem"]["keywords"]:
            w.writerow([c, ag, k, "Phrase", "", "", "", "", "", "", "", "", final, "", ""])
            w.writerow([c, ag, k, "Exact", "", "", "", "", "", "", "", "", final, "", ""])
        for n in g["sem"].get("negatives", []):
            w.writerow([c, ag, n, "Negative phrase", "", "", "", "", "", "", "", "", "", "", ""])
        hl = (g["sem"]["headlines"] + [""] * 5)[:5]
        ds = (g["sem"]["descriptions"] + [""] * 2)[:2]
        p1 = {"city": "heritage-walks", "state": "heritage-travel"}.get(g["type"], "learn")
        p2 = (g.get("city") or g.get("state") or g["pillar"]).lower().replace(" ", "-")[:15]
        w.writerow([c, ag, "", "", "Responsive search ad", *hl, *ds, final, p1, p2])
        groups += 1
print(groups, "ad groups")

# 3. 90-day social calendar. Priority: pillars and the UNESCO list, Delhi, then
# high-demand explainers and big-city walks, then the rest. Heritage Week
# (19 to 25 November) gets the heritage and conservation pages.
if len(sys.argv) > 1:
    start = datetime.date.fromisoformat(sys.argv[1])
else:
    t = datetime.date.today()
    start = t + datetime.timedelta(days=(7 - t.weekday()) % 7 or 7)
FIRST = ["unesco-world-heritage-sites-in-india", "heritage-walk-in-delhi", "seven-cities-of-delhi", "indus-valley-civilization", "ancient-indian-history",
         "indian-temple-architecture", "brahmi-script", "learn-sanskrit-for-beginners", "how-to-become-an-archaeologist-in-india", "heritage-walk-in-agra",
         "heritage-walk-in-jaipur", "archaeology-in-india", "what-is-epigraphy", "mughal-architecture", "stepwells-of-india", "heritage-sites-in-delhi",
         "ashoka-and-his-edicts", "heritage-walk-in-varanasi", "classical-languages-of-india", "rock-art-in-india", "heritage-walk-in-mumbai",
         "archaeology-courses-in-india", "how-archaeologists-date-artifacts", "heritage-walk-in-hampi", "gupta-empire", "delhi-sultanate"]
HERITAGE_WEEK = ["what-is-cultural-heritage", "heritage-conservation-in-india", "what-is-intangible-cultural-heritage", "indian-heritage-guide",
                 "heritage-tourism-in-india", "difference-between-heritage-and-history", "traditional-crafts-of-india"]
rank = {"pillar": 0, "list": 0, "city": 1, "explainer": 2, "state": 3}
rest = sorted((g["slug"] for g in GUIDES if g["slug"] not in FIRST + HERITAGE_WEEK), key=lambda s: (rank[BY[s]["type"]], s))
queue = [s for s in FIRST if s in BY] + rest
hw_start = datetime.date(start.year, 11, 19)
rows, angle_cycle = [], ["fact", "tip", "offer"]
qi = 0
for d in range(90):
    day = start + datetime.timedelta(days=d)
    hw = (day - hw_start).days
    if 0 <= hw < len(HERITAGE_WEEK) and HERITAGE_WEEK[hw] in BY:
        slug, note = HERITAGE_WEEK[hw], "World Heritage Week (19 to 25 Nov)"
    else:
        while queue[qi % len(queue)] in HERITAGE_WEEK and start <= hw_start <= start + datetime.timedelta(days=89):
            qi += 1
        slug, note = queue[qi % len(queue)], ""
        qi += 1
    g = BY[slug]
    posts = {p["angle"]: p for p in g["social"]["posts"]}
    angle = angle_cycle[d % 3] if angle_cycle[d % 3] in posts else g["social"]["posts"][0]["angle"]
    p = posts.get(angle, g["social"]["posts"][0])
    tags = " ".join(g["social"]["hashtags"])
    camp = g["pillar"] if g["type"] not in ("city", "state") else g["type"]
    rows.append([day.isoformat(), day.strftime("%a"), "Instagram + Facebook", "Post (carousel)", slug, p["angle"], p["hook"], p["caption"], tags,
                 url(g, source="instagram", medium="social", campaign=camp, content=f"{slug}-{p['angle']}"), note])
    if day.weekday() in (0, 2, 4):
        lp = posts.get("fact") if day.weekday() != 4 else posts.get("offer")
        lp = lp or g["social"]["posts"][0]
        rows.append([day.isoformat(), day.strftime("%a"), "LinkedIn", "Post", slug, lp["angle"], lp["hook"], lp["caption"], " ".join(g["social"]["hashtags"][:4]),
                     url(g, source="linkedin", medium="social", campaign=camp, content=f"{slug}-{lp['angle']}"), note])
    if day.weekday() in (1, 3, 5):
        rows.append([day.isoformat(), day.strftime("%a"), "Instagram Reels + YouTube Shorts", "Reel", slug, "reel", "", g["social"]["reel"], tags,
                     url(g, source="instagram", medium="reel", campaign=camp, content=f"{slug}-reel"), note])
with open(os.path.join(OUT, "social-calendar.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["Date", "Day", "Channel", "Format", "Guide", "Angle", "Hook", "Caption or brief", "Hashtags", "Tracked link", "Note"])
    w.writerows(rows)
print(len(rows), "calendar rows from", start, "to", start + datetime.timedelta(days=89))

# 4. Page register
with open(os.path.join(OUT, "pages.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["Page", "Type", "Topic", "Main keyword", "SEO title", "Meta description", "Share title", "Share text", "Bundle", "Bundle programmes", "Programmes promoted"])
    for g in GUIDES:
        w.writerow([url(g), g["type"], g["pillar"], g["keywords"][0], g["seo_title"], g["meta_description"], g["og_title"], g["og_description"],
                    g["bundle"]["title"], " + ".join(g["bundle"]["items"]), ", ".join(g["related_programmes"])])
print(len(GUIDES), "pages listed")
