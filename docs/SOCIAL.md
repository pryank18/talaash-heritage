# Social reels and the website

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
