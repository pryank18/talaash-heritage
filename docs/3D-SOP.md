# 3D model pages: standard operating procedure

For every interactive 3D page on the site (`site/3d-<page>.html`). Written 12 Nov 2026 after the Kandariya Mahadeva and Bhaja pages; section 6 updated the same day, when the pages were moved onto the original design canvases. Follow every step in order. A step that fails stops the work: the item goes to `hold` in the ledger with the reason, and nothing is published.

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

- `page`, `ledger` (the ledger id), `script` (the app module, `<slug>-app`), `still` (`assets/img/3d/<page>.webp`)
- `app`: `three` (vendored folder), `theme` (`k`-style light or `bj`-style dark, or a new scoped theme), `fonts`, `eyebrow`, `heading` (the page h1), `intro`
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

## 6. The scene: the design canvas, run on the website as it is

Each model is first designed as a Claude Design canvas (an interactive artboard with its own three.js scene, views, layers, sun, walk mode and facts panel). The website runs that same canvas, so the page looks and behaves like the design. Do not rebuild a canvas from scratch for the site.

1. Read the canvas's `project/Main.dc.html` and its three.js asset (Artifact tool, `read`). Note the three.js version from the asset's header (`const e="147"` etc.) and vendor the official build of that version from npm into `site/assets/js/vendor/three-r<version>/three.min.js` with its LICENSE. Check the sha256 against the canvas asset; they must match. For r150 and later, remove only the first `console.warn(...)` line and put `!` before the function (see `three-r158/README.txt`).
2. Make `site/assets/js/3d/<slug>-app.js`: the canvas's `<x-dc>` markup (without `<helmet>`) as `MARKUP`, then its `Component` class unchanged except for the edits below, then `export function start(host) { return mount(host, MARKUP, Component); }`. `dc-lite.js` runs `{{ bindings }}`, `<sc-for>`, `<sc-if>`, `on…` events and `ref` exactly as the canvas does.
3. Copy the `<helmet>` styles into `site/assets/css/model3d.css`, each rule scoped under `.m3d-app-<theme>` (never a bare `.tag`, `.tab` or `body` rule), and the canvas's Google Fonts link into `app.fonts` in `content/models3d.json`.
4. Edits to the canvas code, all required:
   - Replace every fact, label, tab text and source with the checked wording from the evidence sheet. Drop anything the three checks did not keep, and cite only qualifying sources: Wikipedia, blogs, Medium and travel sites are never listed as sources.
   - Put both logos (Talaash and archaeologywala) and the reconstruction label in a corner of the model view.
   - Do not trap page scrolling. The mouse wheel zooms only when the model has been clicked (has focus), Ctrl or ⌘ is held, or the view is full screen; otherwise show "Click the model first, or hold Ctrl…" for 1.6 s and let the page scroll.
   - Phones: set the model height with a CSS variable, put the model before long button rows, and make overlay panels collapsible (a Facts button). Buttons must not wrap their text.
   - Name lost or unknown orientation honestly. For example, a view called "Entrance front", not "East front", unless a checked source gives the direction.
5. The page header (crumbs, eyebrow, h1, intro, byline, Share) is static HTML built from `app` in `content/models3d.json`, in the canvas's own fonts and colours. The app section follows it, then the website sections.

## 7. Build

```
python3 tools/build_catalogue.py site/data/catalogue.json
python3 tools/build_learn.py      # "See it in 3D" on guides, Learn hub, search, llms.txt
python3 tools/build_reels.py      # Watch page strip
python3 tools/build_3d.py         # the 3D pages and sitemap-3d.xml
python3 tools/clean_urls.py
```

`build_learn.py` rewrites the "Updated" date on every guide. Before committing, keep only files with real changes. Revert any page whose only change is the date or the JSON-LD dateModified.

Then make the still image (og:image, no-script fallback and the thumbnail on Learn, Watch, guides and programme pages). Render the model view headless at 1600×900 (Playwright Chromium with SwiftShader; heavy scenes need 20–30 s to draw), with the help buttons hidden. Check that both logos and the reconstruction label are in it, and save it as WebP in `site/assets/img/3d/`. Regenerate it whenever the scene or its labels change. In headless tests, click the app's buttons with `element.click()` in the page: SwiftShader is too slow for Playwright's stability checks.

## 8. Visitor check, A to Z (before every push)

Serve `site/` locally and use Playwright Chromium (SwiftShader WebGL). Take screenshots and look at every one.

- [ ] 3D page at 1440×900 and 390×844, light and dark theme. Full-page screenshots and the stage.
- [ ] Both logos (Talaash and archaeologywala) visible in the viewer corner and in "Follow the series", on desktop and phone.
- [ ] Reconstruction label visible and not covered.
- [ ] Model visible and framed on desktop and phone. Labels legible, not overlapping, none pointing off-screen, and the top label shown.
- [ ] Every view, layer, tab, unit and look button works, with no console errors; the sun slider and date change the light; walk mode moves.
- [ ] The mouse wheel scrolls the page until the model is clicked; Ctrl + wheel zooms. Touch drag turns the model on a phone.
- [ ] No console errors and no 404s (fonts blocked by the sandbox do not count).
- [ ] No-WebGL: the app shows its own message, and the facts are still on the page ("All the key facts as text").
- [ ] The page matches the canvas: same fonts, colours, buttons and panel; compare screenshots of the canvas and the page side by side.
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
