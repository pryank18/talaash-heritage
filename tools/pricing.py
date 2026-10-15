"""Prices for programmes run on request. One table, used by the catalogue,
the programme pages, the cards and the structured data.

All amounts are in rupees and include GST. Sources and reasoning: the pricing
research of 15 October 2026 (docs/PRICING.md). Change prices here only.

Rules that shape the numbers:
- Round prices, no ₹999 endings.
- Schools pay about half the public per-head price above a headcount; companies
  pay about 1.5 to 2 times, with a minimum booking value.
- A private group never pays less per head than a public seat would cost.
"""
import re

WORD_NUM = {"two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10}


def inr(n):
    """₹ with Indian digit grouping: 150000 -> ₹1,50,000."""
    s = str(int(n))
    if len(s) > 3:
        head, tail = s[:-3], s[-3:]
        head = re.sub(r"(\d)(?=(\d\d)+$)", r"\1,", head)
        s = head + "," + tail
    return "₹" + s


def count(text, default):
    """First number in a length such as 'Six sessions' or '5 to 6 days'."""
    t = (text or "").lower()
    m = re.search(r"\d+", t)
    if m:
        return int(m.group())
    for w, n in WORD_NUM.items():
        if re.search(r"\b" + w + r"\b", t):
            return n
    return default


def tier(label, amount, unit, note="", best=False):
    return {"label": label, "amount": inr(amount), "unit": unit, "note": note, "best": best}


# Private prices by group size: (from, to, rupees per person). No minimum: one person can book.
# The per-person rate falls as the group grows, and a group of 10 pays what it paid before this
# table existed. private_tier() checks that adding a person never makes the total cheaper.
PRIVATE_BANDS = {
    "Heritage walk": [(1, 1, 3000), (2, 2, 1800), (3, 4, 1250), (5, 9, 1000), (10, 25, 900)],
    "Museum visit": [(1, 1, 2500), (2, 2, 1500), (3, 4, 1000), (5, 9, 850), (10, 25, 800)],
    "Workshop": [(1, 1, 3500), (2, 2, 2200), (3, 4, 1600), (5, 9, 1300), (10, 25, 1200)],
    "Study tour, one day": [(1, 1, 5000), (2, 2, 3000), (3, 4, 2000), (5, 9, 1600), (10, 25, 1500)],
}
MAX_PRIVATE = 25
SMALLER = "Smaller groups book at the private prices."


def each(bands, n):
    return next(p for lo, hi, p in bands if lo <= n <= hi)


def private_tier(bands, label="Private, any group size"):
    totals = [n * each(bands, n) for n in range(1, MAX_PRIVATE + 1)]
    assert all(b >= a for a, b in zip(totals, totals[1:])), f"a larger group would pay less in total: {bands}"
    t = tier(label, each(bands, 2), "per person for 2", f"More than {MAX_PRIVATE} people: we quote.")
    t["bands"] = [{"from": lo, "to": hi, "each": p} for lo, hi, p in bands]
    return t


def private_card(bands):
    return f"{inr(each(bands, 2))} per person for 2, {inr(each(bands, 10))} each for 10 or more"


COURSE_PRICE = {3: 1200, 4: 1500, 6: 2000, 8: 2500, 10: 3000}
CLINICS = {"ma-admissions-portfolio-clinic", "phd-research-direction-clinic", "international-study-scholarships", "archaeology-research-proposal-lab"}
OUTSIDE_NCR = "Prices are for Delhi NCR. Elsewhere, the expert's travel is added to your quotation."
TICKETS = "Monument and museum entry fees are not included and are paid at the site."
CUSTOM = "Everything can be changed to suit you: length, route, level, language, date and group size. Tell us what you need and we will quote."


def pricing(p):
    """Returns the price block for one programme, or None if it has no fixed price."""
    kind, slug = p["kind"], p["slug"]
    length = (p.get("details") or {}).get("Length", "")
    ncr = any(x in (p.get("venue") or "") for x in ("Delhi", "Online", "online", "Your", "your"))
    notes, tiers = [], []

    if kind in ("Heritage walk", "Museum visit"):
        bands = PRIVATE_BANDS[kind]
        sch, co = (450, 1500) if kind == "Heritage walk" else (400, 1500)
        tiers = [private_tier(bands),
                 tier("Schools", sch, "per student", f"For 30 or more students. One teacher free for every 10 students. {SMALLER}", True),
                 tier("Companies", co, "per person", f"Minimum booking {inr(25000)}")]
        card, frm = private_card(bands), each(bands, MAX_PRIVATE)
        notes = [TICKETS] + ([] if ncr else [OUTSIDE_NCR])
    elif kind == "Lecture":
        tiers = [tier("Small group, online", 5000, "per session", "For 1 to 10 people"),
                 tier("Your class or department, online", 12000, "per session", "", True),
                 tier("At your school or college", 18000, "per session", "In Delhi NCR")]
        notes = [f"Companies and organisations: {inr(30000)} per session.", OUTSIDE_NCR]
        card, frm = f"From {inr(5000)} per session", 5000
    elif kind == "Masterclass":
        tiers = [tier("Online", 25000, "per session"),
                 tier("At your institution", 40000, "per session", "In Delhi NCR", True),
                 tier("Companies", 50000, "per session")]
        notes = ["Individual places in open masterclasses, when we announce them: " + inr(1500) + " online.", OUTSIDE_NCR]
        card, frm = f"From {inr(25000)} per session", 25000
    elif kind == "Discussion":
        tiers = [tier("Schools and colleges", 10000, "per session", "Online or on your campus in Delhi NCR", True),
                 tier("Companies and organisations", 20000, "per session")]
        card, frm = f"From {inr(10000)} per session", 10000
    elif kind == "Workshop":
        bands = PRIVATE_BANDS["Workshop"]
        tiers = [private_tier(bands),
                 tier("Schools", 700, "per student", f"For 25 or more students. Materials included. {SMALLER}", True),
                 tier("Companies", 2000, "per person", f"Minimum booking {inr(30000)}")]
        notes = ["Prices are for one session of up to 3 hours, with materials. Full-day and multi-day formats are quoted in proportion.", OUTSIDE_NCR]
        card, frm = private_card(bands), each(bands, MAX_PRIVATE)
    elif kind == "Course":
        if slug == "remote-sensing-in-archaeology-and-heritage-management":
            per, batch, n = 9000, None, None
            tiers = [tier("Per learner", 9000, "for the full three months", "20% off for students with ID", True)]
        else:
            n = count(length, 6)
            per = COURSE_PRICE.get(n) or COURSE_PRICE[min(COURSE_PRICE, key=lambda k: abs(k - n))]
            if slug == "pali-a-first-course":
                n, per = 6, 2000
            tiers = [tier("Per learner, open batch", per, f"for {n} sessions", "20% off for students with ID", True),
                     tier("Private batch for your institution", 5000 * n, "for up to 30 learners", f"{inr(5000)} per session")]
            notes = ["An open batch runs with 10 or more learners. If it does not, you get a full refund or a place in the next batch."]
        card, frm = f"From {inr(per)} per learner", per
    elif kind == "Career session":
        one = 3000 if slug in CLINICS else 1500
        tiers = [tier("One-to-one, online", one, "per person", "About 60 minutes, with written next steps" + (" and a review of your statement and CV" if one == 3000 else ""), True),
                 tier("Group session for your institution, online", 15000, "per session", "Up to 100 students"),
                 tier("Group session on your campus", 25000, "per session", "In Delhi NCR")]
        card, frm = f"From {inr(one)} per person", one
    elif kind == "One-to-one counselling":
        tiers = [tier("One-to-one, online", 1500, "per session", "About 60 minutes, with written next steps", True),
                 tier("Application clinic", 3000, "per session", "Includes a review of your statement of purpose and CV")]
        card, frm = f"From {inr(1500)} per session", 1500
    elif kind == "Day trip":
        tiers = [tier("Private, 1 to 4 people", 16000, "in total", "Car from Delhi, with the archaeologist all day"),
                 tier("Private, 5 to 7 people", 22000, "in total", "SUV from Delhi, with the archaeologist all day", True),
                 tier("Schools", 1600, "per student", "From this price, for 40 or more students, with coach and lunch. Smaller groups book the private car prices.")]
        notes = ["Companies: " + inr(4500) + " per person, for 15 or more.", TICKETS + " Meals are extra unless stated."]
        card, frm = f"{inr(16000)} for 1 to 4 people, car included", 16000
    elif kind == "Study tour":
        days = count(length, 0)
        one_day = "full day" in length.lower() or days == 0 and "day" in length.lower()
        if slug == "a-study-tour-built-for-your-group":
            tiers = [tier("Per person", 6500, "per day", "Twin sharing, 3-star stays, transport and the archaeologist"),
                     tier("Schools", 4000, "per student per day", "All inclusive. One teacher free for every 15 students.", True),
                     tier("Colleges and companies", 8000, "per person per day")]
            card, frm = f"From {inr(6500)} per person per day", 6500
        elif one_day or days in (1, 2) or "two days" in length.lower():
            d = 2 if "two days" in length.lower() or days == 2 else 1
            bands = [(lo, hi, p * d) for lo, hi, p in PRIVATE_BANDS["Study tour, one day"]]
            tiers = [private_tier(bands),
                     tier("Schools", 700 * d, "per student", f"For 30 or more students. {SMALLER}", True),
                     tier("Companies", 2500 * d, "per person", f"Minimum booking {inr(30000 * d)}")]
            notes = ["The archaeologist is with you all day" + (" on both days." if d == 2 else ".") + " Travel to the site and any stay are quoted separately. " + TICKETS]
            card, frm = private_card(bands), each(bands, MAX_PRIVATE)
        else:
            tiers = [tier("Per person", 6500 * days, f"for {days} days", f"{inr(6500)} per day, twin sharing"),
                     tier("Schools", 4000 * days, f"per student for {days} days", f"{inr(4000)} per day, all inclusive. One teacher free for every 15 students.", True),
                     tier("Colleges and companies", 8000 * days, f"per person for {days} days", f"{inr(8000)} per day")]
            notes = ["Includes 3-star stays on twin sharing, transport and the expert throughout. Single rooms are quoted separately."]
            card, frm = f"From {inr(6500 * days)} per person", 6500 * days
    elif kind == "Private journey":
        days = count(length, 3)
        tiers = [tier("Per person", 12000 * days, f"for {days} days", f"{inr(12000)} per day, twin sharing. Travelling alone? We quote with a single room.", True)]
        notes = ["Includes private car, 4-star stays and the archaeologist or historian with you. Single rooms, flights and entry fees are quoted separately."]
        card, frm = f"From {inr(12000 * days)} per person", 12000 * days
    elif kind == "Field school":
        days = count(length, 5)
        tiers = [tier("Residential", 3000 * days, f"per participant for {days} days", f"{inr(3000)} per day with stay, meals and field kit", True),
                 tier("Day participant", 1800 * days, f"per participant for {days} days", f"{inr(1800)} per day, without stay")]
        notes = ["Travel to the host site is not included."]
        card, frm = f"From {inr(1800 * days)} per participant", 1800 * days
    else:
        return None
    notes = [CUSTOM] + notes
    return {"card": card, "from_paise": frm * 100, "tiers": tiers, "notes": notes,
            "gst": "All prices include GST. A GST invoice is issued on request."}
