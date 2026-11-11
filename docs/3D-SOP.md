# 3D model pages: standard operating procedure

For every interactive 3D page on the site (`site/3d-<page>.html`). Written 12 Nov 2026 after the Kandariya Mahadeva and Bhaja pages. Follow every step in order. A step that fails stops the work: the item goes to `hold` in the ledger with the reason, and nothing is published.

Live examples: https://talaash-heritage.pages.dev/3d-kandariya-mahadeva and https://talaash-heritage.pages.dev/3d-bhaja-chaitya

## 1. Choose the subject

- Fields rotate across archaeology, linguistics/Sanskrit, anthropology, arts and history/heritage. Never two models from the same field in a row (see `docs/UNIVERSE.md`).
- It must have a Talaash guide or programme page that mentions it. That page is the model's `sells`.
- It must be shown from published evidence: measured surveys, excavation plans, published plates, ethnography or conservation studies. If the main figures cannot be found in such a source, choose another subject.
- Anthropology: published ethnography only, shown with respect. No sacred buildings or rites, no identifiable people, and say which period the source describes.
- Never: deity figures (a liṅga or stupa is a plain labelled shape), a Buddha figure where the evidence has none, carvings or paintings drawn from imagination (mark a position only), or a colour that no published study records.

## 2. Ledger first

Add the item to `content/universe.json` before building: series `3d-model`, status `idea`, `page` (`3d-<slug>`), `sells`, `sources` (the evidence sheet path). Set it to `building` with the date in `notes` when work starts. Run `python3 tools/check_universe.py`.

## 3. Evidence sheet: `render/3d/<slug>-sources.md`

Sections, in this order:
1. **The object**: what is modelled and what is deliberately left out.
2. **Sources**: primary or standard scholarly works, with edition, volume, page and plate. Wikipedia, Sahapedia, blogs, travel guides and AI answers never count.
3. **Figures**: every number and claim, each with its evidence tag and its source and page. Give imperial figures as printed and the metric conversion.
4. **Estimated**: everything the model needs that no source gives.
5. **Rules**: what must not be shown.
6. **Three checks** (added after step 4): what was kept and what was dropped, and why.

Evidence tags, and only these: **Measured** (a published measurement), **Documented** (stated in a source), **Comparative** (from a similar site, named), **Hypothetical** (a reasoned guess at a lost part), **Reconstructed** (rebuilt from published fragments), **Estimated** (no source gives it), **Illustrative** (for scale or reading only).

## 4. The three checks

1. **Your own check**: open every source and confirm every figure word by word and number by number. Do every conversion again by arithmetic.
2. **Subagent A**: sees only the final claims list and the source list. It opens each source and confirms or rejects each claim.
3. **Subagent B**: sees the claims list only, with no source list. It searches on its own and tries to prove each claim wrong.

Keep a claim only if both subagents confirm it. Otherwise drop it, or show it as Estimated with the reason. If OCR is unclear (fractions especially), say "about" or use the plainest reading the two sources share. Record the result at the end of the evidence sheet.

## 5. Page data: `content/models3d.json`

One entry per model. `tools/build_3d.py` refuses to build if a required field is empty, a tag is wrong, or a linked page or file is missing.

- `page`, `ledger` (the ledger id), `script` (scene file name), `still` (`assets/img/3d/<page>.webp`)
- `label`: "Reconstruction from published surveys. Estimated parts tagged." (add "and plans" when a plan was used)
- `title` (ends "| Talaash Heritage"), `h1`, `eyebrow` (field name), `crumb` ([pillar guide, pillar name]), `short` (link text), `description` (meta, at most about 160 characters), `og_title`, `og_description`
- `lede`: what it is, which sources the model is built from, and how to use it ("Drag to turn it, zoom with the + and − buttons (or pinch on a phone) …")
- `facts`: [label, text, tag] rows. Every checked figure, metric first then imperial, plus one row for each Estimated, Hypothetical and Illustrative part.
- `body`: two short paragraphs. What the model shows, and what it does not show and why.
- `visit`, `visit_links` ([page, link text]; must include `sells`), `sells`
- `guides`: **at least two** guides that mention the subject. Each one gets a "See it in 3D" block.
- `programmes`: **at least two** active programmes that teach or visit it. They show as cards on the page and get a "See it in 3D" block.
- `sources`: full citations; HTML links are allowed
- `published`, and `updated` whenever the page changes (ISO dates)

## 6. The scene: `site/assets/js/3d/<script>.js`

- Import `start` from `./viewer.js`. Units are metres. Each measured figure is a named constant with its source in a comment, and its conversion from feet and inches is done in code (`const FT = 0.3048`).
- Every visible element that carries a figure gets `api.label(text, tag, [x, y, z], layer)`. Keep label text short, metric then imperial; the full wording goes in the facts table. The first labels added have priority when space is short.
- Add `api.person(x, z)` (1.7 m) with an Illustrative label.
- Use layers for parts a reader may want to hide, such as the cutaway, a hypothetical timber front, or roofs. Pass them in `toggles`.
- Return `target`, `camera`, a `phone` view ({target, camera}) tested at 390×844, and `sun` if the default light leaves the inside dark. `minDistance` and `maxDistance` should stop a reader zooming inside walls or losing the model.
- Plain shapes only. Do not invent ornament, carving or colour.

## 7. Build

```
python3 tools/build_catalogue.py site/data/catalogue.json
python3 tools/build_learn.py      # "See it in 3D" on guides, Learn hub, search, llms.txt
python3 tools/build_reels.py      # Watch page strip
python3 tools/build_3d.py         # the 3D pages and sitemap-3d.xml
python3 tools/clean_urls.py
```

`build_learn.py` rewrites the "Updated" date on every guide. Before committing, keep only files with real changes. Revert any page whose only change is the date or the JSON-LD dateModified.

Then make the still image (fallback, og:image and the thumbnail on Learn, Watch, guides and programme pages). Render the stage headless at 1600×900 with the hint hidden, check both logos and the reconstruction label are in it, and save it as WebP in `site/assets/img/3d/`. Regenerate it whenever the scene or its labels change.

## 8. Visitor check, A to Z (before every push)

Serve `site/` locally and use Playwright Chromium (SwiftShader WebGL). Take screenshots and look at every one.

- [ ] 3D page at 1440×900 and 390×844, light and dark theme. Full-page screenshots and the stage.
- [ ] Both logos (Talaash and archaeologywala) visible in the viewer corner and in "Follow the series", on desktop and phone.
- [ ] Reconstruction label visible and not covered. The hint is correct for mouse ("Ctrl + scroll or + −") and touch ("pinch").
- [ ] Model visible and framed on desktop and phone. Labels legible, not overlapping, none pointing off-screen, and the top label shown.
- [ ] Every toggle, + and −, Reset view and Full screen work. Labels can be switched off.
- [ ] The mouse wheel scrolls the page, and Ctrl + wheel zooms. Touch drag turns the model on a phone.
- [ ] No console errors and no 404s (fonts blocked by the sandbox do not count).
- [ ] No-WebGL fallback: the still image and the note show, and the facts are still there.
- [ ] The facts table reads correctly on a phone (rows stacked).
- [ ] Every link on the page resolves: Plan a visit, WhatsApp, programme cards, More in 3D, Read next, sources.
- [ ] "See it in 3D" block on every guide and programme in the entry, plus Learn ("Explore in 3D"), Watch, the home chips and the Learn menus.
- [ ] The search finds it (kind "3D model"), and it is listed in `llms.txt` and `sitemap-3d.xml`.
- [ ] Every figure on the page matches the evidence sheet's kept list, word for word.

## 9. Publish and confirm

1. Run `python3 tools/check_universe.py`. Commit as `pryank18 <pryank18@users.noreply.github.com>` ending with the Co-Authored-By line, and push to `main`.
2. Wait for Cloudflare Pages (about a minute), then open https://talaash-heritage.pages.dev/3d-<page> with web fetch. Confirm the h1, the reconstruction label, both logo alt texts and a facts row. If the clean address errors once, fetch the `.html` address; it redirects to the same page.
3. Only then set the ledger item to `live` with `url` and a dated note, and add a dated line to the project doc `claude/talaash-site-status.md`.

## 10. Interlinking (built automatically, check it)

- On the 3D page: Plan a visit (`sells` and the visit links, plus WhatsApp with `ref: <page>`), "Do this with Talaash Heritage" programme cards, "More in 3D" (every other model), "Read next" (the guides), the series line with both handles, and the breadcrumb Learn / 3D models.
- Pointing to the 3D page: "See it in 3D" on each guide and programme listed, Learn "Explore in 3D", Watch, search, llms.txt, sitemap. Site-wide: the Learn menus (header and More sheet) and the home chip "Explore in 3D".
- A new model is added to every other model's "More in 3D" automatically when `build_3d.py` runs.
