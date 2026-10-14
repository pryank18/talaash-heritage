# Talaash Heritage guides: writing spec

Every guide is one JSON file in `content/guides/<slug>.json`. `tools/build_learn.py` turns each into `site/<slug>.html`.
The aim: rank on Google (and be quoted by AI search) for heritage, history, archaeology, anthropology and Sanskrit searches from India, and turn readers into requests for Talaash Heritage walks, lectures, courses and journeys.

## Who we are (for context, do not paste)
Talaash Heritage is a team for Archaeology, Linguistics, Anthropology, Arts, Sanskrit, History and Heritage, working since 2018 and registered in 2021, based in New Delhi. It runs heritage walks, museum visits, lectures, courses (Prakrit, Pali, Śāradā, Brāhmī, temple architecture), workshops, field schools, study tours and career counselling. Almost everything is arranged on request for a group, anywhere in India or online. TALAASHH (double H) is its travel name for multi-day journeys. Never write "Trust for".

## JSON schema

```json
{
  "slug": "what-is-epigraphy",
  "type": "pillar | explainer | city | state | list",
  "pillar": "heritage | history | archaeology | anthropology | sanskrit | architecture",
  "title": "What is epigraphy? Reading India's inscriptions",          // the H1, keyword first, under 70 chars
  "seo_title": "What is Epigraphy? Meaning, Types and Indian Examples",  // <title>, 50-60 chars, no brand (added automatically)
  "meta_description": "140-158 characters, contains the main keyword, says what the reader gets.",
  "keywords": ["epigraphy", "what is epigraphy", "epigraphy in indian history", "..."],   // 6-15, main first, lower case, real search phrasings
  "summary": "40-60 word direct answer to the main question. Written so Google can lift it as a featured snippet. No 'In this article'.",
  "sections": [
    {"h2": "A heading phrased the way people search", "paras": ["Paragraph.", "Paragraph."], "list": ["optional bullet", "..."], "table": {"head": ["Col", "Col"], "rows": [["a", "b"]]}}
  ],
  "faq": [{"q": "Question people actually type?", "a": "Answer in 30-70 words."}],
  "related_programmes": ["humayuns-tomb.html", "introduction-to-numismatics-with-replicas.html"],
  "related_guides": ["what-is-numismatics", "brahmi-script"],
  "cta": "One sentence that ties the topic to something Talaash Heritage runs, e.g. 'We run a two-hour Brāhmī workshop for schools and colleges, online or at your campus.'"
}
```

`list` and `table` inside a section are optional. `table` is good for timelines, lists of sites, comparisons.

Extra fields by type:
- **city**: `"city": "Jaipur"`, `"state": "Rajasthan"`, `"stops": [{"name": "Hawa Mahal", "period": "1799", "note": "1-2 sentences on what to look at"}]` (10-16 real places), `"routes": [{"name": "The walled city on foot", "length": "About 3 hours", "stops": ["Hawa Mahal", "City Palace", "Jantar Mantar"]}]` (2-3 walking routes using stop names), `"museums": [{"name": "...", "note": "..."}]` (2-5), `"best_time": "One or two sentences"`.
- **state**: `"state": "Karnataka"`, `"sites": [{"name": "Hampi", "note": "...", "unesco": true}]` (12-25), `"cities": ["heritage-walk-in-hampi"]` (only slugs from the city list below), `"museums": [...]`.

Inline links: inside `paras` you may write `[anchor text](slug.html)` pointing ONLY to a page in the lists below or in `content/programmes.tsv`. Use 3-8 inline links per page, with descriptive anchors (not "click here"). Every `related_guides` entry must be a slug from the lists below; every `related_programmes` entry a filename from `content/programmes.tsv`. Pick programmes that genuinely match.

## Cross-selling (required on every page)
Every guide is a shop window. The reader arrives for free information; the page should leave them with a clear, relevant next step they can book.
- `related_programmes`: 4 to 8 filenames from `content/programmes.tsv`, ordered best fit first. Mix formats where it makes sense: a walk or visit, a lecture or masterclass, a workshop or course, and a study tour or private journey for travel topics. Career and course pages lead with career sessions.
- `bundle`: one suggested combination of 2 or 3 programmes that genuinely work together, shown as a highlighted box mid-page:
  `"bundle": {"title": "Before and after the walk", "pitch": "One or two sentences on why these go together, e.g. a lecture in class the week before, then the walk on site.", "items": ["reading-a-temple.html", "humayuns-tomb.html"]}`
- At least 2 of the inline links in `paras` must point to programmes (not only guides), placed where the reader would naturally want to do the thing being described.
- `audience_hooks`: 2 or 3 short lines, one per audience, saying how this topic is offered to them, e.g. `["Schools: a 75-minute lecture with a quiz, at your school or online.", "Companies: a weekend walk as a team outing.", "Travellers: a private day with an archaeologist."]` Only use formats that exist in programmes.tsv.
- Never push hard: no "book now!", no urgency, no invented discounts. Plain, helpful offers.

## One source for SEO, SEM, SMM and SMO (required on every page)
Each guide is also the brief for paid search and social, so all four channels say the same thing and point to the same page.
- `sem`: a Google Ads ad group for this page.
  `"sem": {"ad_group": "Heritage walk Jaipur", "keywords": ["heritage walk in jaipur", "jaipur walking tour for schools", "..."], "negatives": ["free", "pdf", "..."], "headlines": ["...", "..."], "descriptions": ["...", "..."]}`
  5-10 commercial or booking-intent keywords (not the informational ones), 3-8 negatives, 5 headlines of at most 30 characters, 2 descriptions of at most 90 characters. Honest claims only: no "best", "No.1", prices or discounts.
- `social`: 3 post ideas for Instagram, LinkedIn and Facebook, one per angle (a surprising fact, a how-to-see-it tip, an invitation to a programme), each with a one-line hook and a 2-3 sentence caption, plus one reel idea:
  `"social": {"posts": [{"angle": "fact", "hook": "...", "caption": "..."}, {"angle": "tip", ...}, {"angle": "offer", ...}], "reel": "A 20-30 second idea: what is filmed, the on-screen line, the ending card.", "hashtags": ["#IndianHeritage", "..."]}` with 6-12 hashtags mixing broad and specific.
- `og_title` (at most 60 characters) and `og_description` (at most 120 characters): written for the share preview on WhatsApp and social, warmer than the meta description.

## Length
- pillar / list: 2,200-3,200 words of body text, 8-12 sections, 6-8 FAQs.
- explainer: 1,000-1,500 words, 5-8 sections, 4-6 FAQs.
- city: 900-1,400 words in sections + the stops/routes/museums; 4-6 FAQs. Sections should cover: why the city matters, its layers of history (by period), what you see on a walk, practical advice for groups and schools.
- state: 900-1,300 words + sites list; 4-5 FAQs.

## Voice and style (strict)
- Plain, confident, specific. Write like an archaeologist explaining to a curious, intelligent reader. Indian/British spelling (programme, centre, civilisation in prose; but the keyword "Indus Valley Civilization" may keep the z where people search it).
- Never use em dashes or en dashes as punctuation. Use commas, colons, full stops or brackets. Hyphens in compound words are fine. Number ranges use "to" ("1206 to 1526").
- Banned words: delve, tapestry, landscape (as metaphor), realm, boasts, seamless, robust, leverage, unlock, elevate, unparalleled, dive into, nestled, testament, rich tapestry, vibrant, bustling, hidden gem, must-visit, breathtaking, awe-inspiring, timeless, journey (as metaphor), truly, incredibly, it's important to note, it's worth mentioning, in conclusion, overall, to sum up, whether you're.
- No rule-of-three padding, no "on one hand / on the other" filler, no closing summary paragraph.
- Spellings in titles, headings and the first mention: the common English spelling people search (Ashoka, Brahmi, Sanchi, Konark). You may add the scholarly form once in brackets (Aśoka). After that pick one and stay consistent.
- Neutral and evidence-led on contested questions (Aryan migration, ancient DNA, dates of texts, temple-mosque disputes): state what the evidence shows, name the main positions fairly, no polemic, no religious or political advocacy.
- No deity worship content, no astrology, no shloka-by-shloka recitation. Religion is treated historically.
- Talaash Heritage is mentioned at most 2 times in the body plus the `cta`. Never invent things Talaash has done, partnerships, numbers of students, testimonials, prices or awards.

## Accuracy (strict)
- Only state facts you are confident are correct. Prefer "about", "around the 3rd century BCE" over a precise figure you are unsure of. No invented statistics, no visitor numbers, no ticket prices or opening hours (these change: say "check the ASI or site website before you go").
- UNESCO World Heritage Sites in India: there are 45 as of October 2026 (37 cultural, 7 natural, 1 mixed). The newest is the Ancient Buddhist Site of Sarnath (Uttar Pradesh), inscribed in July 2026 at the 48th session of the World Heritage Committee in Busan. 2025: Maratha Military Landscapes of India (12 forts in Maharashtra and Tamil Nadu, including Gingee). 2024: Moidams, the mound-burial system of the Ahom dynasty (Assam). 2023: Santiniketan; Sacred Ensembles of the Hoysalas. 2021: Dholavira; Ramappa (Kakatiya Rudreshwara) Temple. Full list: Agra Fort, Taj Mahal, Ellora, Ajanta (1983); Konark Sun Temple, Mahabalipuram (1984); Kaziranga, Keoladeo, Manas (1985); Hampi, Khajuraho, Fatehpur Sikri, Churches and Convents of Goa (1986); Great Living Chola Temples (1987, extended 2004), Pattadakal, Elephanta, Sundarbans (1987); Nanda Devi and Valley of Flowers (1988, 2005); Sanchi (1989); Humayun's Tomb, Qutb Minar (1993); Mountain Railways of India (1999, 2005, 2008); Mahabodhi Temple, Bodh Gaya (2002); Bhimbetka (2003); Chhatrapati Shivaji Terminus, Champaner-Pavagadh (2004); Red Fort Complex (2007); Jantar Mantar Jaipur (2010); Western Ghats (2012); Hill Forts of Rajasthan (2013: Chittorgarh, Kumbhalgarh, Ranthambore, Gagron, Amber, Jaisalmer); Rani-ki-Vav, Great Himalayan National Park (2014); Nalanda Mahavihara, Le Corbusier's Capitol Complex Chandigarh, Khangchendzonga (mixed) (2016); Historic City of Ahmadabad (2017); Victorian Gothic and Art Deco Ensembles of Mumbai (2018); Jaipur City (2019).
- Aurangabad is now officially Chhatrapati Sambhajinagar; Allahabad is Prayagraj; Gulbarga is Kalaburagi; Bijapur is Vijayapura; Rajpath is Kartavya Path. Use the current name with the old one in brackets once.
- Don't claim a site is open/closed or under restoration unless permanent.

## Linking targets

### Pillars (type pillar, plus one list page)
indian-heritage-guide | ancient-indian-history | archaeology-in-india | anthropology-and-tribal-india | sanskrit-and-indian-knowledge-systems | indian-temple-architecture | unesco-world-heritage-sites-in-india (type list)

### Explainers
heritage: what-is-cultural-heritage, what-is-intangible-cultural-heritage, difference-between-heritage-and-history, heritage-conservation-in-india, heritage-tourism-in-india, classical-dances-of-india, folk-dances-of-india-state-wise, traditional-crafts-of-india, stepwells-of-india, forts-of-india, mughal-architecture, indo-islamic-architecture
history: indian-history-timeline, indus-valley-civilization, vedic-period, mahajanapadas, mauryan-empire, ashoka-and-his-edicts, gupta-empire, delhi-sultanate, mughal-empire, vijayanagara-empire, chola-dynasty, major-dynasties-of-ancient-india, seven-cities-of-delhi, how-to-study-ancient-indian-history-for-upsc
archaeology: what-is-archaeology, difference-between-archaeology-and-history, how-archaeologists-date-artifacts, what-is-epigraphy, what-is-numismatics, famous-archaeological-sites-in-india, how-an-excavation-works, rock-art-in-india, buddhist-caves-in-india, best-archaeology-museums-in-india, archaeology-courses-in-india, how-to-become-an-archaeologist-in-india, archaeological-survey-of-india
anthropology: what-is-anthropology, branches-of-anthropology, difference-between-anthropology-and-sociology, what-is-ethnography, tribes-of-india, anthropology-optional-for-upsc, stone-age-in-india, folklore-of-india
sanskrit: what-is-sanskrit, learn-sanskrit-for-beginners, sanskrit-alphabet, sanskrit-grammar-basics, vedas-and-upanishads, brahmi-script, ancient-scripts-of-india, prakrit-and-pali, sanskrit-literature, indian-manuscripts, classical-languages-of-india

### City heritage walks (type city, slug heritage-walk-in-<city>)
heritage-walk-in-delhi, heritage-walk-in-agra, heritage-walk-in-jaipur, heritage-walk-in-mumbai, heritage-walk-in-kolkata, heritage-walk-in-chennai, heritage-walk-in-hyderabad, heritage-walk-in-bengaluru, heritage-walk-in-ahmedabad, heritage-walk-in-lucknow, heritage-walk-in-varanasi, heritage-walk-in-bhopal, heritage-walk-in-pune, heritage-walk-in-hampi, heritage-walk-in-udaipur, heritage-walk-in-jodhpur, heritage-walk-in-jaisalmer, heritage-walk-in-mysuru, heritage-walk-in-madurai, heritage-walk-in-thanjavur, heritage-walk-in-kochi, heritage-walk-in-puducherry, heritage-walk-in-amritsar, heritage-walk-in-chandigarh, heritage-walk-in-shimla, heritage-walk-in-leh, heritage-walk-in-srinagar, heritage-walk-in-guwahati, heritage-walk-in-bhubaneswar, heritage-walk-in-gwalior, heritage-walk-in-orchha, heritage-walk-in-khajuraho, heritage-walk-in-chhatrapati-sambhajinagar, heritage-walk-in-old-goa, heritage-walk-in-mahabalipuram, heritage-walk-in-bodh-gaya, heritage-walk-in-patna, heritage-walk-in-prayagraj, heritage-walk-in-vijayapura, heritage-walk-in-badami

### State guides (type state, slug heritage-sites-in-<state>)
heritage-sites-in-andhra-pradesh, heritage-sites-in-arunachal-pradesh, heritage-sites-in-assam, heritage-sites-in-bihar, heritage-sites-in-chhattisgarh, heritage-sites-in-goa, heritage-sites-in-gujarat, heritage-sites-in-haryana, heritage-sites-in-himachal-pradesh, heritage-sites-in-jharkhand, heritage-sites-in-karnataka, heritage-sites-in-kerala, heritage-sites-in-madhya-pradesh, heritage-sites-in-maharashtra, heritage-sites-in-manipur, heritage-sites-in-meghalaya, heritage-sites-in-mizoram, heritage-sites-in-nagaland, heritage-sites-in-odisha, heritage-sites-in-punjab, heritage-sites-in-rajasthan, heritage-sites-in-sikkim, heritage-sites-in-tamil-nadu, heritage-sites-in-telangana, heritage-sites-in-tripura, heritage-sites-in-uttar-pradesh, heritage-sites-in-uttarakhand, heritage-sites-in-west-bengal, heritage-sites-in-delhi, heritage-sites-in-jammu-and-kashmir, heritage-sites-in-ladakh, heritage-sites-in-puducherry

### Programmes
See `content/programmes.tsv` (filename, title). Link to the ones that fit.

## Checks before you finish
Run `python3 tools/check_guides.py content/guides/<slug>.json ...` on your files (it validates JSON, links, banned words, dashes and word counts) and fix everything it reports.
