# Heritage desk stories

One JSON file per story, named `<slug>.json`. Build with `python3 tools/build_news.py` (check only: `--check`). Pages: `site/news.html` and `site/news-<slug>.html`.

Fields: `slug`, `title` (8-160 chars, plain, no clickbait), `dek` (one or two sentences), `body` (2-8 paragraphs, our own words, no links), `category` (finds, research, exhibitions, events, opportunities, policy), `field` (archaeology, linguistics, anthropology, arts, sanskrit, history, heritage), `published` (YYYY-MM-DD), optional `updated`, `place`, `event_start`, `event_end`, `deadline`, `correction`; `sources` (list of {title, publisher, url (https), date}); `status` (published, draft, withdrawn).

Rules: a story runs only if a primary source (PIB, ASI, ministry, museum, university, UNESCO, ICOMOS, the paper itself, the official notice) or two independent reputable outlets confirm it. Superlatives ("oldest", "first") are attributed to whoever claims them. At most one quote under 15 words. No copied headlines or images. First reported in the last 14 days, or an event or deadline at least 5 days away. Published stories are never deleted: correct them with `correction`, or set `status` to `withdrawn` with a note.
