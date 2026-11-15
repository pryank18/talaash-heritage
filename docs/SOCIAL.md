# Social reels and the website

> Above this file: `docs/UNIVERSE.md` and the ledger `content/universe.json` (11 Nov 2026). Every piece is entered there, with its number from `tools/check_universe.py`, before it is built.

Decided 10 Nov 2026. The full reasoning is in the project note "social-content-split".

## Growth rules for @talaashheritage (15 Nov 2026; read first)
Full plan and the numbers behind it: project doc `claude/growth-plan.md`. Where an older line below differs, these rules win.

Why: 17 Oct to 15 Nov, 27 posts, all carousels, no reels. Median reach 64 (below our 833 followers), median interactions 6, about one new follower a month. Carousels reach mostly existing followers; reels are what reaches new people.

1. **Weekly grid** (one evening main post a day, published about 21:00): Mon reel (Durlabh teaser from 23 Nov); **Tue Fact as a vertical reel**; Wed carousel (Durlabh / Deep Story); Thu reel (What the Text Says from 26 Nov; until then the Fact as a reel); Fri reel (Jaisa Tha); Sat carousel (word story Fact); Sun carousel (Heritage this week, jobs, exams and deadlines on the cover). Four reels, three carousels.
2. **Fact reels**: scenes in `render/queue/_shorts/<YYYYMMDD>-fact-<slug>-reel/` (N.html + scenes.json), classes from `render/queue/_shorts/short.css`; copy `20261117-fact-didarganj-yakshi-reel`. 6 to 8 scenes, 25 to 35 s: hook over the best licensed photo first, one checked sentence per scene, one photo scene, end scene with the takeaway, talaash-heritage.pages.dev and sources. Logo `.lgc` on every scene. Photos that must not be cropped (manuscripts, wide objects) use `<img class="ph phm">` above the text instead of the full-bleed `.pf`. Text comes word for word from checked copy; the hook adds no new claim. The "Render social slides" Action builds `site/media/ig/<slug>.mp4` (own drone, no voice, no AI frames). Confirm it is served and under 4.8 MB, look at frames, then queue the row as Type Reel, Media = the mp4 URL, column N = "Not needed". Captions must not say "swipe" or "slide".
3. **Hooks** (cover line and first scene): give a 25 to 34 reader a reason to stop: a career or exam stake, a mystery or dispute, a big checked number, or an everyday link. Never open with an object description ("One stone pillar at...") or a series label ("Day 8 of...").
4. **Morning 08:00**: major pan-India festivals only. No daily festival series, no minor observances.
5. **Captions**: line 1 is the hook and names the place or subject in plain words, under about 125 characters. One genuine question at the end is fine; no engagement bait. Follow block and exactly 5 hashtags stay: #TalaashHeritage once plus 4 subject or place tags people search. No #TalaashFact.
6. **Weekly check** (Sunday review): Business Suite → Insights → Content (Instagram), last 7 days; log reach, interactions and follows per post by format; top 2 and bottom 2 with the reason. A format below the account median three weeks running is rebuilt or cut. Targets by 13 Dec: median reach ≥ 200, net +40 followers.

## Who posts what
- **@archaeologywala** is Pryank's own page. It posts Khudai Khabar (satire, never a Collab), Explorer episodes and faceless news reels. Explorer and news reels are Instagram Collabs with @talaashheritage.
- **@talaashheritage** is the business. It posts the daily slides and Shorts from `render/`, and the 3D series **Jaisa Tha**, which only covers sites with a Talaash programme page.
- One site or topic gets one reel across both accounts. A Collab counts once.

## Making a Collab
Instagram web (instagram.com, logged in as the author) → Create, or More → Scheduled content → open the post → **Add collaborators** → pick the other account → Save (never "Share", which publishes at once). The other account must accept the invite once the post is live.

## Putting a reel on the site
1. Add or update its entry in `content/reels.json`: `instagram` = the public post link (or `youtube` = the 11-character Shorts id), `pages` = programme, guide or news pages without `.html`.
2. Run `python3 tools/build_reels.py` and `python3 tools/build_catalogue.py site/data/catalogue.json`.
3. Commit. The reel then appears on `watch.html`, on the creator page `archaeologywala.html` (if posted by @archaeologywala) and as "Watch it" on each programme page it lists.

Entries without a link are plans and never show. `build_reels.py` refuses a Khudai Khabar entry that lists pages, a malformed link, or a page that does not exist.

## Tracking
Bio links carry UTM tags so the admin Traffic tab credits the whole visit:
- @talaashheritage: `https://talaash-heritage.pages.dev/watch.html?utm_source=instagram&utm_medium=bio&utm_campaign=talaash-bio`
- @archaeologywala: `https://talaash-heritage.pages.dev/archaeologywala.html?utm_source=instagram&utm_medium=bio&utm_campaign=aw-bio`
- YouTube Short descriptions link straight to the programme with `utm_source=youtube&utm_medium=short&utm_campaign=<series>-<reel id>`.

## Post types and badges (10 Nov 2026)
Every @talaashheritage carousel carries exactly one type badge on its cover, so followers can tell at a glance what a post is. The badge sits under the top line, left-aligned: `<div class="bdg TYPE">Label</div>` placed before `<div class="top">`. Styles are in `render/house.css`; nothing else on the cover moves.

| Badge | Class | Look | Used for |
|---|---|---|---|
| Special Day | `special` | solid gold | Festivals and observances, 08:00 slot, on the day |
| Fact | `fact` | gold outline | Tue, Thu, Sat 19:30 Facts. The Fact number stays in the top line ("Talaash Heritage · Fact 011") |
| Deep Story | `story` | solid cream | Mon, Wed, Fri main posts: scripts, inscriptions, art, language, anthropology, teach-a-skill |
| Careers | `careers` | cream outline | The weekly careers or exams main post |
| Event | `event` | dark with gold | A dated event: a Talaash live event, or an outside event at least 5 days away, with its date on the cover |
| This Week | `week` | dashed gold | Sunday "Heritage this week" digest |

Rules
- One badge per post, cover only. The top line then reads "Talaash Heritage" (plus the Fact number); the type no longer goes in the top line.
- News of finds is archaeologywala's (Khudai Khabar, news reels). Talaash covers finds only inside This Week and on the website news page, so there is no News badge.
- Reels (Jaisa Tha) and Shorts carry no badge; they have the logo on every frame.
- Starts with rows due 17 Nov 2026. Rows already Ready for 11 to 16 Nov keep their rendered slides (images are never re-rendered).
- Test covers for all six: `render/queue/_badges/` (test folder, never posted).

## The 168-post calendar (docs/marketing/social-calendar.csv)
Built 15 Oct by `tools/export_marketing.py`, before the rotation above and the account split. It is an idea bank, not a schedule: the queue sheet and the rotation decide what posts. When taking an idea from it, map its angle to a badge (fact → Fact; tip or offer → Deep Story, ending on the programme page), skip any row on a reserved topic (Purana Qila, Tughlaqabad, Rakhigarhi before 1 Dec), and run the three checks as for any other post.

## Brand SOP (Pryank, 10 Nov 2026)
Every Talaash post carries the Talaash Heritage logo and the other social links.
- Carousels: logo badge on the cover and on the last slide. Reels: logo on every frame.
- Every caption ends, just before the 5 hashtags, with:
  Follow Talaash Heritage / Instagram: @talaashheritage / Facebook: facebook.com/109410924674841 / LinkedIn: linkedin.com/company/talaashheritage / YouTube: @talaashheritage1967 / Website: talaash-heritage.pages.dev
- Never "link in bio" until the bio actually points to the site.
- Three checks before anything is queued: own source check, a subagent that confirms every claim against the sources, and a second subagent that tries to disprove each claim independently.
- Fact numbers rise with the date and never repeat (001-010 used by 14 Nov 2026).

## Walk and event posts (12 Nov 2026)
- Story title first. A walk or event post leads with a theme title, not the monument's name, then one line saying what the visitor will see, in date order.
- Name the place and city in plain words in the first two lines of the caption. Instagram search reads captions, so the place name, city and field ("heritage walk", "Brahmi script", "Mughal architecture") belong in real sentences. No keyword dumps, no lists in brackets.
- Logistics block for any dated Event post, one line each, in this order: date and day; time (IST, start to end); meeting point; price "per person, including GST" plus "monument entry extra" where it applies; how to book (the plain Talaash page address and wa.me/917397829282). Price only if it matches the live `products` rows and `tools/pricing.py`; walks never show a minimum, a headcount or a group total.
- Name who leads or researched the piece, with one credential line.
- Duration and depth in one line ("Three hours, a thousand years") is fine on covers.
- Never: "DM us", "link in bio" or a Google Form link (booking goes through the Talaash page and checkout); paid boosting; joint posts with another organisation; hashtags without "#" or more than 5. Before queueing, count them: exactly 5, each starting with "#".

## Our own work, our own references (15 Nov 2026)
Talaash content, rules and plans come from Talaash's own research and our own post data. No other heritage page, operator or channel is named, linked, quoted or used as a reference in anything Talaash publishes, in this repository or in the project docs. Sources for facts are primary texts, museums, the ASI and standard scholarly works, as in the three checks.
