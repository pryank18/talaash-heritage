#!/usr/bin/env python3
"""Turns the programme bank in Drive into tools/bank.json, the public part of it.

The bank (Talaash_160_Full_Programme_Profiles_v5.json, in Drive under
Talaash Heritage - Programme Master 2026 / v5) holds 160 designed programmes
with internal notes. This script keeps only what can be shown to visitors:
the plan of each session, what participants do and take away, who leads it,
and how long it takes. Internal notes (supplier checks, access caveats,
publication status) are dropped.

Run: python3 tools/import_bank.py <path to the v5 profiles json>
Then: python3 tools/build_catalogue.py site/data/catalogue.json
"""
import json
import re
import sys
from pathlib import Path

SRC = json.load(open(sys.argv[1], encoding="utf-8"))
BY_ID = {p["id"]: p for p in SRC}

# Programmes already on the site (written by hand in build_catalogue.py), by bank id.
LIVE = {
    "TH-001": "mehrauli-archaeological-park", "TH-002": "the-qutb-complex", "TH-003": "purana-qila", "TH-004": "hauz-khas",
    "TH-091": "museum-morning-with-an-archaeologist", "TH-061": "culture-and-heritage-what-we-inherit-and-why-it-matters",
    "TH-056": "what-archaeologists-actually-do", "TH-057": "from-stone-tools-to-the-first-villages",
    "TH-058": "the-first-cities-harappa-among-the-early-civilisations", "TH-064": "reading-india-s-scripts-brahmi-to-sarada",
    "TH-042": "how-to-read-a-temple", "TH-065": "india-s-linguistic-heritage", "TH-059": "rock-art-of-india",
    "TH-099": "the-goddess-in-text-and-image-the-devimahatmya", "TH-066": "careers-in-archaeology-museums-and-heritage",
    "TH-076": "mock-trench-a-practice-excavation", "TH-077": "clay-and-the-past-a-pottery-workshop", "TH-078": "reading-sculpture",
    "TH-079": "write-like-asoka-s-scribes-a-brahmi-workshop", "TH-080": "recording-the-past-a-documentation-workshop",
    "TH-081": "caring-for-collections-preventive-conservation-basics", "TH-082": "stone-tools-up-close",
    "TH-083": "the-dig-an-archaeology-team-challenge", "TH-086": "prakrit-a-first-course", "TH-087": "pali-a-first-course",
    "TH-088": "sarada-script", "TH-041": "understanding-indian-temple-architecture",
    "TH-089": "remote-sensing-in-archaeology-and-heritage-management", "TH-100": "martial-arts-and-society",
    "TH-094": "museum-field-school-documentation-and-conservation", "TH-085": "prehistory-field-workshop",
    "TH-096": "three-capitals-delhi-agra-and-jaipur", "TH-097": "forts-of-rajasthan",
    "TH-098": "stupas-caves-and-temples-of-central-india",
}
# Live programmes whose bank plan describes a different event (length or content), so no plan is shown.
NO_PLAN = {"TH-094", "TH-085"}

FORMAT = {
    "Heritage walk": "walk", "Heritage experience": "trip", "Masterclass": "masterclass", "Lecture": "lecture",
    "Career session": "career", "Workshop": "workshop", "Practical workshop": "workshop", "Course": "course",
    "Museum experience": "visit", "Museum visit": "visit", "Study tour": "tour", "Multi-day study tour": "tour",
    "Interactive discussion": "discussion", "Workshop / field school": "field",
}

VENUE = {
    "TH-005": "Nizamuddin, Delhi", "TH-006": "Lodhi Garden, Delhi", "TH-007": "Lodhi Road, Delhi", "TH-008": "Nizamuddin, Delhi",
    "TH-009": "Old Delhi", "TH-010": "Old Delhi", "TH-011": "Firoz Shah Kotla, Delhi", "TH-012": "Tughlaqabad, Delhi",
    "TH-013": "Siri Fort, Delhi", "TH-014": "Begumpur, Delhi", "TH-015": "Khirki, Delhi", "TH-016": "Khirki, Delhi",
    "TH-017": "Mehrauli, Delhi", "TH-018": "Mehrauli, Delhi", "TH-019": "Sultan Ghari, Delhi", "TH-020": "Connaught Place, Delhi",
    "TH-021": "Connaught Place, Delhi", "TH-022": "Sunder Nursery, Delhi", "TH-023": "Nizamuddin, Delhi",
    "TH-024": "Nizamuddin, Delhi", "TH-025": "Nizamuddin, Delhi", "TH-026": "Kashmere Gate, Delhi",
    "TH-027": "Connaught Place, Delhi", "TH-028": "Central Delhi", "TH-029": "Mehrauli, Delhi", "TH-030": "Mehrauli, Delhi",
    "TH-031": "Rakhigarhi, Hisar district, Haryana", "TH-032": "Hansi, Haryana", "TH-033": "Hisar, Haryana", "TH-034": "Agroha, Haryana",
    "TH-038": "Thanesar, Kurukshetra, Haryana", "TH-039": "Pinjore, Haryana",
    "TH-123": "Bhimbetka and Bhojpur, near Bhopal, Madhya Pradesh", "TH-127": "Elephanta, Mumbai",
    "TH-125": "the Fort precinct, Mumbai",  "TH-126": "the Fort precinct, Mumbai", "TH-134": "Bhubaneswar, Odisha",
}
PLACE_VENUE = {
    "Online / arranged venue": "Online or at your venue", "Arranged teaching venue": "Your campus or office",
    "Delhi / arranged venue": "A Delhi museum chosen with you", "Online or at a campus": "Online or at your campus",
    "Online or at venue": "Online or at your venue", "At school or online": "At your school, or online",
    "Online plus local neighbourhood": "Online, then a neighbourhood near you", "Delhi or requested city": "Delhi, or a city you choose",
    "At partner venue": "At a partner venue",
}

DELIVERABLE = {
    "Talaash Heritage interpretation sheet with evidence prompts and suggested reading.": "An interpretation sheet with questions to ask on site and suggested reading",
    "Participant activity sheet and short feedback rubric": "An activity sheet to keep",
    "Annotated field card / sketch / observation log": "Your annotated field card, sketches and notes",
    "Four-part assessed learning portfolio": "A portfolio of your work from each session",
    "Individual action plan with timelines and verified resources": "A personal action plan with dates and checked sources",
    "Regional comparison field sheet": "A field sheet comparing what you saw",
    "Daily field sheets and final comparative portfolio": "Daily field sheets and a final comparative portfolio",
    "Rakhigarhi field journal, comparative archaeology sheet, cultural reflection": "A field journal and a comparison sheet from the day",
}
EXPERT = {
    "Appropriate Talaash heritage specialist or disciplinary educator; exact personnel confirmed at booking.": "A specialist in the subject, named in your quotation",
    "Subject-matter instructor qualified in the stated topic; practical lab support for physical workshops.": "A specialist in the subject",
    "Historian or archaeologist specialising in Delhi built heritage; authorised guide arranged operationally.": "A historian or archaeologist who specialises in Delhi's buildings",
    "Career mentor with archaeology/heritage academic experience; external expert when needed.": "A career mentor with academic experience in archaeology and heritage",
    "Regional heritage researcher with local host/guide as needed.": "A regional heritage researcher, with a local guide where needed",
    "Tour leader + location-specific qualified scholar/guide.": "A tour leader, with a specialist at each site",
}
AUDIENCE_TEXT = {
    "Public, student groups and private groups": "Schools, colleges, the public and private groups",
    "Individuals, families, schools, universities, private groups and international visitors": "Individuals, families, schools, colleges, private groups and visitors from abroad",
    "Interested adults, students, heritage professionals": "Adults, students and heritage professionals",
    "Curious adults, students and academic groups": "Adults, students and academic groups",
    "Students, graduates and early-career scholars": "Students, graduates and early-career researchers",
    "Schools, universities and learning groups": "Schools, colleges and study groups",
    "Individuals, families, schools and institutions": "Individuals, families, schools and institutions",
    "Students and specialist learners": "Students and specialist learners",
    "Students, collections learners and groups": "Students, museum staff and groups",
    "Schools, universities, adult learning groups": "Schools, colleges and adult study groups",
    "Interested adults and student groups": "Adults and student groups",
}
GENERIC_OBJECTIVE = re.compile(r"Practise the specific techniques|Identify the specific material evidence|Distinguish documented history from speculation|Use cited material responsibly")
NUM = {1: "one", 2: "two", 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven", 8: "eight", 10: "ten"}


def minutes_of(duration):
    """Best single number of minutes for a duration string, or None for days and sessions."""
    d = duration.replace("–", "-")
    m = re.match(r"^(\d+) min$", d)
    if m:
        return int(m.group(1))
    m = re.match(r"^([\d.]+)(?:-([\d.]+))? h$", d)
    if m:
        lo, hi = float(m.group(1)), float(m.group(2) or m.group(1))
        return int(round((lo + hi) / 2 * 60))
    return None


def hours_words(mins):
    if mins <= 110:
        return f"About {mins} minutes"
    h = round(mins / 30) / 2
    return f"About {int(h) if h == int(h) else h} hours" if h != 1 else "About an hour"


def length_text(duration):
    d = duration.replace("–", " to ")
    special = {
        "Half day": "Half a day", "Full day": "A full day", "Half/full day": "Half a day or a full day",
        "Half day plus ferry": "Half a day, plus the ferry", "Half day on site": "Half a day on site",
        "1 day with driving": "A full day, with driving", "1 day locally": "A full day on site",
        "Full day with transport": "A full day, with transport", "2 days": "Two days",
        "Full day on site; travel optional": "A full day at the site, plus travel",
        "6 sessions": "Six sessions", "8 sessions": "Eight sessions", "4 sessions": "Four sessions",
    }
    if duration in special:
        return special[duration]
    mins = minutes_of(duration)
    if mins is None:
        return d
    m = re.match(r"^([\d.]+)-([\d.]+) h$", duration.replace("–", "-"))
    if m:
        return f"{m.group(1)} to {m.group(2)} hours"
    return hours_words(mins)


def length_adjective(duration):
    """'two-hour', '90-minute', 'half-day' for the subtitle."""
    special = {"Half day": "half-day", "Full day": "full-day", "Half/full day": "half- or full-day", "Half day plus ferry": "half-day",
               "Half day on site": "half-day", "1 day with driving": "full-day", "1 day locally": "full-day",
               "Full day with transport": "full-day", "2 days": "two-day", "Full day on site; travel optional": "full-day",
               "6 sessions": "six-session", "8 sessions": "eight-session", "4 sessions": "four-session"}
    if duration in special:
        return special[duration]
    mins = minutes_of(duration)
    if mins is None:
        return ""
    if mins <= 110:
        return f"{mins}-minute"
    h = round(mins / 30) / 2
    if h == int(h):
        return f"{NUM.get(int(h), int(h))}-hour"
    return f"{h}-hour"


def lengths_key(duration, f):
    if f in ("course",):
        return ["series"]
    mins = minutes_of(duration)
    if mins is not None:
        return ["short"] if mins <= 120 else ["half"]
    if "Half" in duration:
        return ["half"]
    return ["long"]


def region_of(venue, place):
    v = venue + " " + place
    if "Delhi" in v and "requested" not in v:
        return "delhi"
    if "Haryana" in v:
        return "nearby"
    if any(w in v.lower() for w in ("online", "your campus", "your venue", "your school", "partner venue", "your campus or office")):
        return "anywhere"
    return "india"


def places_key(region, venue):
    if region == "delhi":
        return ["delhi"]
    if region in ("nearby", "india"):
        return ["travel"]
    out = []
    if "nline" in venue:
        out.append("online")
    if any(w in venue for w in ("venue", "campus", "school", "office", "neighbourhood", "partner")):
        out.append("local")
    return out or ["local"]


def topics_of(p, f):
    t = (p["title"] + " " + p["promise"]).lower()
    out = []
    rules = [
        ("careers", ("career", "admission", "phd", "scholarship", "cv ", "proposal", "class 12", "pathways")),
        ("scripts", ("script", "inscription", "epigraph", "brahmi", "prakrit", "pali", "language", "literary", "poet")),
        ("museums", ("museum", "collection", "object", "exhibition", "gallery")),
        ("ancient", ("harappan", "prehistor", "rock art", "stone tool", "bhimbetka", "dna", "burial", "dating", "chronology", "agroha", "rakhigarhi", "harappa", "nalanda", "sanchi", "numismatic", "climate")),
        ("archaeology", ("archaeolog", "excavat", "mapping", "survey", "documentation", "mound", "field")),
        ("art", ("sculpture", "iconograph", "art", "temple", "cave", "relief", "photograph")),
        ("monuments", ("tomb", "fort", "mosque", "masjid", "monument", "baoli", "gate", "temple", "stupa", "palace", "architecture", "garden", "church", "minar", "complex", "terminus", "cemetery", "jantar")),
        ("heritage", ("living", "village", "neighbourhood", "street", "market", "food", "heritage", "culture", "memory", "oral", "community", "podcast", "club", "sufi", "dargah", "families")),
    ]
    for key, words in rules:
        if any(w in t for w in words):
            out.append(key)
    if f in ("walk", "trip", "tour") and "monuments" not in out and "heritage" not in out:
        out.append("monuments")
    return out[:3] or ["heritage"]


def audience_keys(text):
    low = text.lower()
    keys = []
    if "school" in low:
        keys.append("school")
    if any(w in low for w in ("college", "universit", "student", "graduate", "academic", "scholar")):
        keys.append("college")
    if any(w in low for w in ("institution", "professional", "compan", "organisation", "collections learners", "group")):
        keys.append("work")
    if any(w in low for w in ("public", "individual", "famil", "adult", "visitor", "private", "learner", "researcher")):
        keys.append("public")
    return keys or ["public"]


INTRO = {"walk": "On this walk you", "trip": "On this day you", "masterclass": "In this masterclass you", "lecture": "In this lecture you",
         "career": "In this session you", "workshop": "In this workshop you", "course": "On this course you", "visit": "On this visit you",
         "tour": "On this tour you", "discussion": "In this discussion you", "field": "In this field school you"}
KIND = {"walk": "heritage walk", "trip": "day trip", "masterclass": "masterclass", "lecture": "lecture", "career": "career session",
        "workshop": "workshop", "course": "course", "visit": "museum visit", "tour": "study tour", "discussion": "discussion", "field": "field school"}


def lower_first(s):
    return s[0].lower() + s[1:] if s and not (s[:2].isalpha() and s[:2].isupper()) else s


def description(p, f):
    promise = p["promise"].rstrip(".")
    if promise.startswith("Help "):
        return f"In this session we {lower_first(promise)}."
    return f"{INTRO[f]} {lower_first(promise)}."


def where_phrase(venue, region):
    if venue.startswith("A "):
        return " at " + lower_first(venue)
    if region == "anywhere" or venue.startswith("At "):
        return ", " + lower_first(venue)
    return f" in {venue}"


def subtitle(p, f, venue, region):
    if f == "trip":
        return f"A day trip from Delhi to {venue}"
    adj = length_adjective(p["duration"])
    words = f"{adj} {KIND[f]}".strip()
    art = "An" if words[0].lower() in "aeiou" or words.startswith(("8", "11-", "18-", "80-", "85-")) else "A"
    return f"{art} {words}{where_phrase(venue, region)}"


def clean_segment(s):
    return re.sub(r"\s+", " ", s).strip()


def plan_of(p, f, detailed):
    steps = []
    for a in p["agenda"]:
        step = {"title": clean_segment(a["segment"])}
        if f not in ("course", "tour") and a.get("minutes"):
            step["minutes"] = a["minutes"]
        if detailed:
            step["detail"] = a["interpretation"].rstrip(".") + "."
            step["activity"] = a["participant_activity"].rstrip(".")
        steps.append(step)
    return steps


def objectives_of(p):
    kept = [o.rstrip(".") + "." for o in p.get("objectives", []) if not GENERIC_OBJECTIVE.search(o)]
    return kept if len(kept) >= 2 else []


def plan_kind(f):
    return {"course": "outline", "tour": "days"}.get(f, "timed")


def slug_of(p):
    """The bank's slug, except where an en dash in the title ran two words together."""
    if "–" not in p["title"]:
        return p["slug"]
    t = p["title"].replace("’", "").replace("'", "").replace("&", "and").lower()
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")


bank = {"_about": "Generated by tools/import_bank.py from the Drive programme bank. Public fields only.", "plans": {}, "programmes": []}

for pid, slug in LIVE.items():
    p = BY_ID[pid]
    f = FORMAT[p["format"]]
    if pid in NO_PLAN:
        continue
    detailed = int(pid[3:]) <= 100
    entry = {"plan": plan_of(p, f, detailed), "plan_kind": plan_kind(f),
             "takeaway": DELIVERABLE.get(p["deliverable"], p["deliverable"])}
    obj = objectives_of(p) if detailed else []
    if obj:
        entry["objectives"] = obj
    bank["plans"][slug] = entry

for p in SRC:
    pid = p["id"]
    if pid in LIVE or p["priority"] == "P3":
        continue
    f = FORMAT[p["format"]]
    detailed = int(pid[3:]) <= 100
    venue = VENUE.get(pid) or PLACE_VENUE.get(p["place"]) or p["place"]
    region = region_of(venue, p["place"])
    entry = {
        "bank_id": pid, "slug": slug_of(p), "f": f, "title": p["title"].replace("’", "'").replace(" & ", " and "),
        "subtitle": subtitle(p, f, venue, region), "description": description(p, f), "venue": venue, "region": region,
        "for": AUDIENCE_TEXT.get(p["audience"], p["audience"]),
        "length": length_text(p["duration"]) + (" at the site, plus travel from Delhi" if f == "trip" and minutes_of(p["duration"]) else ""),
        "led_by": EXPERT.get(p.get("expert", ""), "A specialist in the subject, named in your quotation"),
        "takeaway": DELIVERABLE.get(p["deliverable"], p["deliverable"]),
        "highlights": [re.sub(r"\s*\([^)]*\)", "", clean_segment(a["segment"])) for a in p["agenda"]][:4],
        "plan": plan_of(p, f, detailed), "plan_kind": plan_kind(f),
        "audience": audience_keys(p["audience"]),
        "find": {"topics": topics_of(p, f), "places": places_key(region, venue), "lengths": lengths_key(p["duration"], f)},
        "priority": p["priority"],
    }
    obj = objectives_of(p) if detailed else []
    if obj:
        entry["objectives"] = obj
    bank["programmes"].append(entry)

out = Path(__file__).resolve().parent / "bank.json"
out.write_text(json.dumps(bank, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
print(len(bank["plans"]), "plans for live programmes,", len(bank["programmes"]), "new programmes written to", out)
