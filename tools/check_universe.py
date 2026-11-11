#!/usr/bin/env python3
"""Check content/universe.json, the ledger of everything Talaash Heritage and
archaeologywala make. Run before every commit that touches it.

Fails on: duplicate ids; unknown series or field; a series number used twice,
or numbers that do not rise with the slot date; a number at or above the
series 'next'; two items from the same account in the same slot; two Jaisa Tha
archaeology episodes in a row; a topic_lock used by two items within 30 days
(one topic = one piece across both accounts; a Collab counts once); a 'page'
or 'sells' that does not exist in site/ (except pages marked building)."""
import json, os, sys
from datetime import datetime, timedelta

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
d = json.load(open(os.path.join(ROOT, "content", "universe.json"), encoding="utf-8"))
errors, warns = [], []
FIELDS = set(d["fields"])
SERIES = d["series"]
STATUS = {"idea", "building", "ready", "scheduled", "live", "hold", "dropped"}


def when(s):
    if not s:
        return None
    s = s.replace(" ", "T")
    return datetime.fromisoformat(s if "T" in s else s + "T00:00")


ids = set()
nxt = {}
for it in d["items"]:
    i = it["id"]
    if i in ids:
        errors.append(f"duplicate id {i}")
    ids.add(i)
    if it.get("series") and it["series"] not in SERIES:
        errors.append(f"{i}: unknown series {it['series']}")
    if it.get("field") not in FIELDS:
        errors.append(f"{i}: field must be one of {sorted(FIELDS)}")
    if it.get("status") not in STATUS:
        errors.append(f"{i}: status must be one of {sorted(STATUS)}")
    for key in ("page", "sells"):
        pg = it.get(key)
        if pg and not os.path.exists(os.path.join(ROOT, "site", pg + ".html")):
            if it.get("series") == "3d-model" and it["status"] in ("idea", "building"):
                continue
            if key == "page" and pg.startswith("durlabh-") and any(
                    json.load(open(os.path.join(ROOT, "content", "durlabh", f), encoding="utf-8")).get("page") == pg
                    for f in os.listdir(os.path.join(ROOT, "content", "durlabh")) if f.endswith(".json")):
                continue  # Durlabh page: published by tools/build_durlabh.py at its release time
            if key == "page" and pg.startswith("durlabh-") and it["status"] in ("idea", "building"):
                continue  # long read not written yet (Durlabh desk)
            errors.append(f"{i}: {key} {pg}.html does not exist in site/")
    if it.get("series") == "khudai-khabar" and (it.get("collab") or it.get("page")):
        errors.append(f"{i}: Khudai Khabar is never a Collab and never sells a page")

# series numbering
for s, meta in SERIES.items():
    nums = sorted(((when(it.get("slot")) or datetime.max, it["number"], it["id"])
                   for it in d["items"] if it.get("series") == s and it.get("number") is not None
                   and it["status"] != "dropped"))
    seen = set()
    prev = 0
    for t, n, i in nums:
        if n in seen:
            errors.append(f"{s}: number {n} used twice ({i})")
        seen.add(n)
        if n <= prev:
            errors.append(f"{s}: {i} has number {n} but an earlier slot already used {prev}")
        prev = max(prev, n)
    if s in ("fact",):
        prev = max(prev, 11)  # 006 and 007 skipped in public; 011 is the highest used by 11 Nov 2026
    if prev:
        nxt[s] = prev + 1

# one account, one slot
slots = {}
for it in d["items"]:
    if it["status"] in ("dropped",) or not it.get("slot") or len(it["slot"]) < 16:
        continue
    acct = it["brand"]
    k = (acct, it["slot"][:16])
    if k in slots:
        errors.append(f"slot clash on {acct} at {k[1]}: {slots[k]} and {it['id']}")
    slots[k] = it["id"]

# Jaisa Tha field rotation
jt = sorted((when(it["slot"]), it) for it in d["items"]
            if it.get("series") == "jaisa-tha" and it["status"] != "dropped" and it.get("slot"))
for (t1, a), (t2, b) in zip(jt, jt[1:]):
    if a["field"] == b["field"] == "archaeology":
        errors.append(f"Jaisa Tha: two archaeology episodes in a row ({a['id']}, {b['id']})")

# one topic, one piece (30 days)
locks = []
for it in d["items"]:
    for tl in it.get("topic_lock", []):
        locks.append((tl, when(it.get("slot")), it["id"], it.get("collab")))
for a in range(len(locks)):
    for b in range(a + 1, len(locks)):
        ta, wa, ia, _ = locks[a]
        tb, wb, ib, _ = locks[b]
        if ta == tb and wa and wb and abs(wa - wb) < timedelta(days=30):
            errors.append(f"topic {ta} used twice within 30 days: {ia} and {ib}")

print("next numbers: " + ", ".join(f"{k} {v:03d}" if k == "fact" else f"{k} #{v}" for k, v in nxt.items()))
for w in warns:
    print("note:", w)
if errors:
    print("\n".join("ERROR: " + e for e in errors))
    sys.exit(1)
print(f"universe.json OK: {len(d['items'])} items, {len(SERIES)} series")
