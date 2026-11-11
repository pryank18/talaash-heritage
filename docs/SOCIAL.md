# Social reels and the website

> Above this file: `docs/UNIVERSE.md` and the ledger `content/universe.json` (11 Nov 2026). Every piece is entered there, with its number from `tools/check_universe.py`, before it is built.

Decided 10 Nov 2026. The full reasoning is in the Claude project note "social-content-split".

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
