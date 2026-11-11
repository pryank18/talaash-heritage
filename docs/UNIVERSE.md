# The Talaash–archaeologywala universe

Decided 11 Nov 2026 (Pryank: "take ownership, be my main manager for social media, nothing left, nothing overlapping, everything keeps getting made"). This file and `content/universe.json` sit above `docs/SOCIAL.md` and the archaeologywala run book wherever they differ on numbering, slots or topics. Both projects' scheduled tasks read this file.


> **Timing test, 11–29 Nov 2026 (data, not habit).** Meta Business Suite's Planner shows Talaash's Instagram followers most active at 21:30; posts had been going out at 19:40. Reach of 26 carousels, 15 Oct–11 Nov: median 45.5; by type Careers 294 (n=1), Festival 86.5, Main 64, Fact 45.5, Navratri daily 24.5; days of the week have only 2–4 posts each, too few to choose days on. So the evening window moved to 20:55–21:20 (Make scenario 6534359; the queue task moved to 21:43). Rows keep the 19:30 label. On 29 Nov compare each type's median reach against the baseline above and keep the window or move it back. Morning festival window unchanged (07:55–08:20). Never run the helper swap inside either window.

## 0. Audience (read before choosing language, time or format)
- Talaash Instagram (833 followers, checked 10 Nov 2026): India 94%; aged 25–34 63%; men 56%, women 44%; top cities Delhi 10%, Pune 6%, Bangalore 6%, Mumbai 4%, Chennai 3%, then Gurugram, Kolkata, Hyderabad. Many followers are outside the Hindi belt, so everything Talaash makes is in English (captions, on-screen text, lectures). Followers most active at 21:30 (Meta), hence the evening timing test above. Best reach so far by type: Careers, then festivals, then main posts, then Facts.
- Talaash Facebook (1,723): India 93%, men 75%, mostly 25–44.
- archaeologywala Instagram (2,148): 86% of views come from followers and 86.5% from stories; reels were 0.4%. Reach, not language, is its limit; Hinglish voice with English facts in every caption. Hindi-belt content belongs here, not on Talaash.
- So: Talaash = English, scholarly, pan-India, evening; archaeologywala = Hinglish, personal, story-led reach. Same topic never twice; the Collab is the bridge.

## 1. One ledger
- `content/universe.json` holds every piece both brands make: posts, reels, 3D models, lectures, web pages. Each has one id, its series and number, field, status, slot, platforms, the website page it points to (`page`) and the product it sells (`sells`).
- A piece gets its ledger entry **before** it is built. Series numbers are taken only from the "next numbers" line that `python3 tools/check_universe.py` prints. Never number from memory or from a caption.
- Statuses: idea → building → ready → scheduled → live (or hold / dropped). Talaash tasks update Talaash items. archaeologywala tasks do not write to this repo; the Sunday universe review copies their live posts in from Instagram.
- `tools/check_universe.py` must pass before any commit that touches the ledger. It blocks: repeated or falling series numbers, two posts from one account in one slot, two Jaisa Tha archaeology episodes in a row, one topic used twice within 30 days, links to pages that do not exist.
- Known history: Fact 006 and 007 were never posted (the feed went 005 → 008). They are retired. The 17 Nov archaeologywala burials reel is **Ancient India in 3D #1**, not Jaisa Tha; the Harappan diorama carousel is #2.

## 2. Who is what
| | Talaash Heritage (@talaashheritage) | archaeologywala (@archaeologywala) |
|---|---|---|
| Role | The institution that teaches and sells | Pryank the person: voice, face, humour; builds reach and trust |
| Fields | All seven, rotated: Archaeology, Linguistics, Anthropology, Arts, Sanskrit, History, Heritage. No field may take more than 2 of the 7 weekly 19:30 posts. | Archaeology first (the audience came for it), with prehistory, protohistory, epigraphy and palaeography; other fields only through an archaeological object |
| Voice | English captions, faceless, scholarly | Hinglish voice, English facts in every caption |
| 3D | **Jaisa Tha** (reels) and interactive models on the website | **Ancient India in 3D** (reels, diorama carousels), always a Collab with Talaash |
| Long form | **Talaash Lectures** on YouTube, pages on the website | Explorer episodes |
| Never | Satire, fiction, find-news as its own post | Prices, bookings, Talaash's daily slide topics |

## 3. Push and pull (why both exist)
- **archaeologywala → Talaash.** Every archaeologywala piece about a site or subject Talaash teaches is a Collab and ends on the Talaash page as plain text. The archaeologywala bio says "Go deeper → @talaashheritage".
- **Talaash → archaeologywala.** Talaash Lectures and Jaisa Tha credit "Narrated by @archaeologywala" whenever his voice is used, and the creator page `archaeologywala.html` lists his series.
- **Social → website.** Every post names one page in `page`. Reels appear on `watch.html` and as "Watch it" on that page once live (`content/reels.json`). Each 3D model and lecture has its own page, which links to the programme in `sells`.
- **Website → social.** Programme and guide pages show the reels and models made about them; the 3D pages end with "Follow the series" (both handles).
- **What performs moves up.** A topic in the top quarter of archaeologywala reach for a month becomes a Talaash Lecture or a Jaisa Tha episode within six weeks, and then a programme page if none exists. The Sunday review makes this call.

## 4. Formats and cadence (from 20 Nov 2026)
| Format | Account | Slot | Made by |
|---|---|---|---|
| Daily slides | Talaash IG + FB (+ LinkedIn company) | Evening slot every day (rows say 19:30; the poster publishes them in its 20:55–21:20 window during the timing test, 11–29 Nov 2026); 08:00 on festivals | 21:43 queue task |
| Jaisa Tha 3D reel | Talaash IG + FB, then YouTube Short | **Fri 19:30, weekly**; it is that Friday's main post | Talaash 3D studio, Saturday 8 days ahead |
| Interactive 3D model page | Talaash website | Any day; one before each archaeology/history Jaisa Tha | Talaash 3D studio |
| Talaash Lectures (8–15 min) | Talaash YouTube and website page; its 45 s cut is the next Monday's 19:30 main post on IG/FB; LinkedIn post | **First Sunday of the month, about 12:00** (uploaded private when built, made public by the Sunday review at about 11:40); fortnightly once two lectures beat the channel median | Talaash lecture studio, Friday 9 days before |
| Heritage desk news | Talaash website | 0–3 a day | Desk task 11:23 |
| Reels, carousels, Explorer, Khudai Khabar, Rahasya, Ancient India in 3D | archaeologywala IG (Pryank schedules on his phone on Saturdays) | Mon/Wed 20:30 reels, Fri 20:30 Rahasya from 4 Dec, Sat 21:30 flagship, Sun 20:30 carousel | archaeologywala project tasks |

Superseded on 11 Nov 2026: older notes (project notes talaash-ops-status "Plan from 12 Nov" and social-content-split "Cadence to start" / "Jaisa Tha rotation") that say Jaisa Tha runs every two weeks, or put #2 on 4 Dec, #3 on 18 Dec and #4 on 1 Jan. The dates in content/universe.json are the plan.

Jaisa Tha rotation: archaeology/history episodes alternate with arts, linguistics/Sanskrit and anthropology episodes; never two archaeology in a row. Models already built (Kandariya Mahadeva, Bhaja Cave 12) are slotted as archaeology/history episodes. Cut rule: if three Jaisa Tha reels in a row get less reach than the median Talaash carousel of the same weeks, go back to fortnightly.

Lecture rules: each lecture is 2–3 parts of about 5 minutes, each under 4.8 MB, because Make's free plan refuses larger files; animated slides (16:9, 1280×720), English on every slide and English subtitles, narration in clear English in Pryank's cloned voice (English clone from the archaeologywala kit's reference voice; if it fails the likeness check, his cloned Hindi voice with English subtitles, and the report says so), 8–15 minutes, chapters in the description, sources on the last slide and in the description, the TALAASHH logo on every slide, "Narrated by @archaeologywala". The lecture page on the site carries the video, the slides as text (for search) and the programme it sells. Fields rotate like Jaisa Tha.

## 5. Platforms
| Platform | Use now | Why |
|---|---|---|
| Instagram | Both accounts, as above | Where both audiences are |
| Facebook | Talaash mirrors Instagram automatically | Free through the same Make run |
| LinkedIn | Talaash company page: lectures and careers posts; Pryank's own profile has its separate queue | Careers and institutions read LinkedIn |
| YouTube | Talaash: Jaisa Tha Shorts and Lectures | Long form and search; Shorts held until the publish-time check in talaash-ops-status is cleared |
| X | Dormant | No free, reliable posting route; revisit when lectures have run for two months |
| Reddit | Not used | Self-promotion rules and no automation; revisit with lectures |

## 6. Limits (credits)
- Make Free: 1,000 operations a month, ceiling 850, only 2 active scenarios. A post costs about 6. If the Sunday review projects more than 600, Talaash drops to the 19:30 slot only.
- Apify free credit: the weekly reviews and nightly checks only.
- No paid tools, no ads, no new subscriptions without Pryank's yes.
- Never more than 2 of an account's own posts a day; never a filler post. An archaeologywala Collab also appears on Talaash's grid but is not counted as a Talaash post; it must not be in the same topic as Talaash's own post that day.

## 7. Quality (unchanged, applies to every piece)
Primary sources or two independent reputable ones; nothing from memory; three checks (own, a subagent with the sources, a subagent without them trying to disprove); reconstructions labelled and evidence-tagged; no deity images in illustrations; real images with checked open licences only; Brand SOP logo and links blocks; British English; "link in bio" never on Talaash.

## 8. Who runs what (scheduled tasks, 11 Nov 2026)
| Task | When (IST) | Does |
|---|---|---|
| Talaash queue refill | daily 20:13 | Talaash slides and reel rows, ledger entries, Fact numbers |
| Talaash Heritage desk news | daily 11:23 | Website news |
| Talaash 3D studio | Sat 13:07 | Jaisa Tha reel for the Friday 6–13 days ahead; 3D model pages; keeps 4 Jaisa Tha slots planned |
| Talaash lecture studio | Fri 14:23 | Talaash Lectures when one is due within 10 days; teaser for the following Monday |
| Universe review | Sun 11:37 | Both accounts' numbers, ledger sync, lecture goes public, what moves up, limits |
| archaeologywala tasks (archaeologywala project) | Sat mornings and nightly | Reels, carousels, Explorer, hand-over to Pryank's phone; read this ledger for topics and numbers |

## 9. Stories (archaeologywala's real reach)
- 86.5% of archaeologywala's views come from stories, so stories are the main bridge to Talaash. On the day a Talaash Jaisa Tha reel, lecture teaser or new 3D page goes live, the archaeologywala scheduler shares it to an archaeologywala story (reshare of the Talaash post, or a frame with the page address as plain text), and shares every live Collab to a story the same evening.
- If stories cannot be scheduled or published from the cloud, the scheduler logs "story not possible: <reason>" once; it never asks Pryank to post them.
- Talaash's own stories: only if Make's Instagram module can publish a story on the free plan; the Sunday review checks this once and records the answer here.
