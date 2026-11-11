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
| Jaisa Tha 3D reel | Talaash IG + FB, then YouTube Short the next Saturday | **Fri 19:30, weekly**; it is that Friday's main post | Talaash 3D studio, Saturday 8 days ahead |
| Interactive 3D model page | Talaash website | Any day; one before each archaeology/history Jaisa Tha | Talaash 3D studio |
| **Durlabh Sunday** = Talaash Lectures (8–15 min) + long read | Website long read, Talaash YouTube, then a week of cuts (section 10) | **Every Sunday from 22 Nov 2026**: page 11:00, video public about 11:40 (Sunday review) | Durlabh desk (Tue), lecture studio (Fri), release task (Sun/Thu); section 10 |
| Heritage desk news | Talaash website | 0–3 a day | Desk task 11:23 |
| Reels, carousels, Explorer, Khudai Khabar, Rahasya, Ancient India in 3D | archaeologywala IG (Pryank schedules on his phone on Saturdays) | Mon/Wed 20:30 reels, Fri 20:30 Rahasya from 4 Dec, Sat 21:30 flagship, Sun 20:30 carousel | archaeologywala project tasks |
| **Deep Dive** (from 26 Nov 2026) | archaeologywala: blog at archaeologywala.pages.dev/deep-dive/, IG launch reel, IG notes carousel; Talaash channels carry the video and link posts: YouTube (playlist "archaeologywala Deep Dive", credited "Narrated by @archaeologywala") plus the reel as a Short, LinkedIn company page, Facebook Page | **Thursday weekly**: blog 18:00, YouTube about 18:30, IG reel 21:00 (cloud queue), LinkedIn and Facebook link posts after the blog is live; YouTube Short Friday; IG notes carousel the following Tuesday 21:00 | archaeologywala project tasks (Deep Dive studio, Deep Dive publish); rules in the project note claude/deep-dive.md |

Superseded on 11 Nov 2026: older notes (project notes talaash-ops-status "Plan from 12 Nov" and social-content-split "Cadence to start" / "Jaisa Tha rotation") that say Jaisa Tha runs every two weeks, or put #2 on 4 Dec, #3 on 18 Dec and #4 on 1 Jan. The dates in content/universe.json are the plan.

Deep Dive rules: one rare, sourced topic a week, archaeology first. Each gets a ledger item with a topic_lock before it is built (next number from check_universe.py). Narration in Hinglish (Pryank's cloned voice, Devanagari script) with English on every slide and English subtitles, so Talaash's English audience can follow it; the Talaash lecture series stays separate and in English. A Deep Dive's Talaash LinkedIn/Facebook link post counts towards Talaash's two posts a day on that platform; if that day already has two, it moves to the next day. Talaash's own posts avoid a Deep Dive's topic for 30 days either side.

Jaisa Tha rotation: archaeology/history episodes alternate with arts, linguistics/Sanskrit and anthropology episodes; never two archaeology in a row. Models already built (Kandariya Mahadeva, Bhaja Cave 12) are slotted as archaeology/history episodes. Cut rule: if three Jaisa Tha reels in a row get less reach than the median Talaash carousel of the same weeks, go back to fortnightly.

Lecture rules: each lecture is 2–3 parts of about 5 minutes, each under 4.8 MB, because Make's free plan refuses larger files; animated slides (16:9, 1280×720), English on every slide and English subtitles, narration in clear English in Pryank's cloned voice (English clone from the archaeologywala kit's reference voice; if it fails the likeness check, his cloned Hindi voice with English subtitles, and the report says so), 8–15 minutes, chapters in the description, sources on the last slide and in the description, the TALAASHH logo on every slide, "Narrated by @archaeologywala". The lecture page on the site carries the video, the slides as text (for search) and the programme it sells. Fields rotate like Jaisa Tha.

## 5. Platforms
| Platform | Use now | Why |
|---|---|---|
| Instagram | Both accounts, as above | Where both audiences are |
| Facebook | Talaash mirrors Instagram automatically | Free through the same Make run |
| LinkedIn | Talaash company page: lectures and careers posts; Pryank's own profile has its separate queue | Careers and institutions read LinkedIn |
| YouTube | Talaash: Jaisa Tha Shorts and Lectures | Long form and search. The 11 Nov publish-time problem only hits uploads with a scheduled time, so every upload here goes up without one and is read back |
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
| Talaash queue refill (trig_012zAYUKNEGrDkqNN2zX7UZS) | daily 21:43 (timing test) | Talaash slides and reel rows, ledger entries, Fact numbers |
| Talaash Heritage desk news | daily 11:23 | Website news |
| Talaash 3D studio | Sat 13:07 | Jaisa Tha reel for the Friday 6–13 days ahead; last live Jaisa Tha to YouTube as a Short (public, never a publishAt); 3D model pages; keeps 4 Jaisa Tha slots planned |
| Talaash lecture studio | Fri 14:23 | The Durlabh lecture due within 10 days (built from the checked long read); Monday teaser; two Short cuts |
| Durlabh desk | Tue 15:17 | Long read, carousel and captions for the Sunday 12 days ahead; keeps 4 future Sundays locked with briefs |
| Durlabh release | Sun 12:13, Wed 12:13 | Checks page and video, embeds the video, uploads the Shorts, reports |
| Universe review | Sun 11:37 | Both accounts' numbers, ledger sync, lecture goes public, what moves up, limits |
| archaeologywala tasks (archaeologywala project) | Sat mornings and nightly | Reels, carousels, Explorer, hand-over to Pryank's phone; read this ledger for topics and numbers |

## 9. Stories (archaeologywala's real reach)
- 86.5% of archaeologywala's views come from stories, so stories are the main bridge to Talaash. On the day a Talaash Jaisa Tha reel, lecture teaser or new 3D page goes live, the archaeologywala scheduler shares it to an archaeologywala story (reshare of the Talaash post, or a frame with the page address as plain text), and shares every live Collab to a story the same evening.
- If stories cannot be scheduled or published from the cloud, the scheduler logs "story not possible: <reason>" once; it never asks Pryank to post them.
- Talaash's own stories: only if Make's Instagram module can publish a story on the free plan; the Sunday review checks this once and records the answer here.

## 10. Durlabh Sunday (decided 12 Nov 2026; Pryank: "one day a week for a rare topic, used across every platform all week")
**What it is.** *Durlabh* = rare, hard to find. Every Sunday one rare subject is studied properly and published as one connected piece. It is the weekly form of Talaash Lectures: the Durlabh number is the Talaash Lectures number (#1 = 22 Nov). Monthly lectures are superseded.

**Why Sunday.** The lecture slot was already Sunday late morning, the Sunday review (11:37) already makes lectures public, Talaash's audience (25–34, working) has time for an 8–15 minute video at the weekend, and Friday is Jaisa Tha.

**One piece, every platform, all linked.**
| When (IST) | What | Where | Links to |
|---|---|---|---|
| Sun 11:00 | Long read (900–1,600 words, every source listed, FAQ) | site/durlabh-NN-slug, index site/durlabh, sitemap-durlabh.xml; published by the GitHub Action "Durlabh Sunday: release" (no laptop, no Claude session needed) | the programme in `sells`, guides, the video once public |
| Sun ~11:40 | Narrated lecture, 2–3 parts, English, cloned voice | YouTube @talaashheritage1967 (Sunday review makes it public) | the long read and the `sells` page, UTM campaign durlabh-NN |
| Sun 12:13 | Release check; video embedded on the page; Short 1 (the teaser) public | site, YouTube Shorts | long read |
| Sun evening | "Heritage this week" opens with the Durlabh piece (cover line and the page address) | IG, FB, LinkedIn | long read, YouTube |
| Mon 19:30 slot | 45 s teaser reel (main post) | IG, FB, LinkedIn company | long read, YouTube (plain text) |
| Wed 19:30 slot | Durlabh carousel (the story in 7–9 slides; replaces that Wednesday's Deep Story) | IG, FB, LinkedIn company | long read, YouTube |
| Wed 12:13 | Short 2 (a second 30–45 s cut) public | YouTube Shorts | long read |
| Same days | archaeologywala stories share the teaser and the carousel (section 9) | archaeologywala IG stories | Talaash post |
Rules: every caption ends with the Follow block; the long-read address always appears as plain text (talaash-heritage.pages.dev/durlabh-NN-slug); never "link in bio". The long read lists the YouTube parts once public; YouTube descriptions carry the long read first, then the `sells` page. The Durlabh field counts for 2 of the week's 7 evening posts (Mon, Wed), so the queue task must not put a third post of that field in the same week. Net cost about 55 Make operations a month (uploads and Shorts; the Mon and Wed posts replace existing slots). If the Sunday review projects more than 850, drop Short 2 first.

**Durlabh and Deep Dive.** archaeologywala's Deep Dive (Thursday, Hinglish, archaeology first, its own blog) and Durlabh Sunday (Talaash, English, all seven fields, the Talaash site) are two different series. Durlabh leans to linguistics, anthropology, arts, Sanskrit, history and heritage, and takes an archaeology subject at most one Sunday in four, never in a week whose Deep Dive is archaeology on a related subject. Topic locks cover both. On YouTube the week runs: Sun Durlabh lecture and Short 1, Wed Durlabh Short 2, Thu Deep Dive video, Fri Deep Dive Short, Sat Jaisa Tha Short.

**Choosing subjects.** Rare = not already a Talaash guide or programme subject, not posted by either account in the last 90 days, not standard school-textbook material, and supported by at least two scholarly or primary sources. Fields rotate through all seven; never the same field as the previous Durlabh or as that week's Friday Jaisa Tha; prefer subjects that sell an existing programme and pull Talaash's top cities. Every subject gets a `topic_lock` in the ledger so Jaisa Tha and archaeologywala never repeat it within 30 days. The desk always keeps the next 4 Sundays locked, each with a brief in render/lectures/NN-slug/brief.md.

**Pipeline per piece (D = the Sunday).** D−12 Tue: Durlabh desk writes content/durlabh/NN-slug.json (the long read), runs the three checks (render/lectures/NN-slug/checks.md), builds the Wednesday carousel slides and all captions, adds the Monday teaser, Wednesday carousel and Shorts ledger items. D−9 Fri: lecture studio voices and renders the lecture from the checked long read (no new claims), uploads private, cuts the teaser and two Shorts. D 11:00: page goes live automatically. D 11:37: Sunday review makes the parts public. D 12:13: release task checks everything, sets `video_public`, rebuilds, uploads Short 1. If the video is not ready, the long read still publishes; Monday's slot then carries the carousel and Wednesday's returns to the normal rotation, and the video follows the next Sunday.

**Locked plan (12 Nov 2026).** #01 22 Nov History: Rāya Asoko, the only portrait that names Ashoka (long read written and checked). #02 29 Nov Arts: the Ajanta copies that burned twice. #03 6 Dec Linguistics: Read Brāhmī, a first lesson. #04 13 Dec Sanskrit: a knight's tour in a Sanskrit verse (Rudraṭa). #05 20 Dec Anthropology: ittal, the wall paintings of the Sora. Next to add: History and Heritage.
