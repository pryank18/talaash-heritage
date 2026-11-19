# Reel SOP (Talaash Heritage)

Every reel and Short on @talaashheritage follows this, start to finish. Each stage has a gate. A reel that fails a gate does not move on. If it cannot pass by its deadline, the slot gets a normal carousel. A slot is never left empty.

Rules elsewhere still apply: `docs/UNIVERSE.md` (slots, numbering, topics), `docs/SOCIAL.md` (captions, badges, follow block), `docs/3D-SOP.md` (3D pieces), `docs/SITE-FILE.md` (Site File explainers).

## Timeline (T = the slot's publishing day)

| When | Stage | Gate |
|---|---|---|
| T-7 | 1. Topic and slot | Locked in `content/universe.json`; `python3 tools/check_universe.py` passes |
| T-4 | 2. Facts | Three checks passed; every on-screen line has a source |
| T-3 | 3. Cue sheet | Every line has a start time; total 20–60 s |
| T-3 | 4. Picture | Visual checklist passed |
| T-2 | 5. Score | Written to the cue sheet; mix targets met |
| T-2 | 6. Machine QC | `python3 tools/reel_qc.py <file> [--3d]` says PASS |
| T-2 | 7. Second review | A reviewer who did not build it passes the checklist |
| T-2 | 8. Host | Hosted file's SHA-256 matches the QC'd file; the site URL answers |
| T-1 by 12:00 | 9. Queue | Row read back from the sheet and matches; Validation filled |
| T-1 12:00 | Cut-off | Anything not done → carousel in the slot, reel moves to the next free slot |
| T +30 min | 10. Live check | Post opened; audio, caption and logo confirmed |

## 1. Topic and slot
- Check the ledger for the 30-day rule, field rotation and the other account's reserved topics before choosing.
- Lock the item (brand `talaash`, date, slot) and run the checker before and after.

## 2. Facts
- Three checks: (a) your own, with every source opened and quoted against the line; (b) a reviewer given the claims and the sources; (c) a reviewer given the claims only, who tries to disprove each.
- Keep a line only if both reviewers confirm it. Otherwise drop it or tag it Estimated with the reason.
- Primary or standard scholarly sources only, with edition and page.
- Banned on screen: deity figures, invented carvings or colours, generated lettering, maps of India, contested identifications.

## 3. Cue sheet
- A table: time, on-screen text, picture, evidence tag (Measured, Documented, Comparative, Hypothetical, Reconstructed, Estimated, Illustrative).
- The first 2 s carry the strongest picture plus a number or a question. A new picture at least every 3 s.

## 4. Picture checklist
- 1080×1920, at least 5 distinct visuals, real movement throughout (pan, zoom, animated 3D). Never one still under text cards.
- Talaash logo on every frame. On 3D pieces, the archaeologywala logo too, on every frame.
- Key text kept clear of the bottom fifth and the right-hand edge, where Instagram's caption and buttons sit.
- All lettering built in the edit, never inside a generated image.
- End card: the page that teaches or sells it (plain address), the handles, the sources.

## 5. Score (original music, written to the picture)
- Original only, from CC0 samples (VSCO 2 CE). No library tracks, film or label songs, silence, drones or ambient beds. Never reuse another series' theme.
- Cue the music to the cue sheet: a hook in the first second, a hit on every new line, one layer added every few cues, a build into the main fact, a drop on it, and resolution on the end card.
- Keep it earthy and small (low strings, harp, timpani, frame or log drum, light strings). Match the subject; no default "Indian groove".
- Mix: −14 LUFS (QC accepts −15 to −13), true peak ≤ −1.5 dBTP, high-pass at about 55 Hz, under 25% of energy below 100 Hz.
- Narrated cuts (YouTube only): narration 15–22 dB above the music while speaking.

## 6. Machine QC
`tools/reel_qc.py` checks format, size, loudness, real changing music (onsets, no gaps, not a static bed), bass share, and the logos on every sampled frame. It writes a JSON report and a contact sheet (one frame every 3 s). Only PASS moves on. Keep the report with the build.

## 7. Second review
A reviewer who did not build the reel gets the file's contact sheet, the QC report, the cue sheet and the caption. They tick each line of sections 2–5 and the caption rules in `docs/SOCIAL.md`. Any "no" sends the reel back.

## 8. Host
- Push to `site/media/ig/<slug>.mp4` (a new name for every new version; never overwrite a file a queued row already points to unless the row is updated in the same step).
- Fetch the file back from the repo and compare its SHA-256 with the QC'd file. Then confirm the live site URL answers.
- If the push can't be made from where the reel was built, the file goes to the owner by T-2 with a one-step upload note. The T-1 check confirms the hosted SHA-256; if it doesn't match by 12:00, the cut-off applies.

## 9. Queue
- Write the row through the sheet helper. Account, Due At, Title, Caption, Media URL, Type Reel, column N as required.
- Read the row back and compare it field by field. Validation reads: `QC PASS <date> · review PASS · sha <first 12> · N visuals · original score`.

## 10. Live check
- Within 30 minutes of the window: open the post, play it with sound, read the caption, and confirm the logo and the audio. Record the post ID.
- A mistake found after posting is fixed at once where the platform allows, and recorded with its cause in the reel log, so the stage that missed it gets a new check.

## Owner preview
The owner gets the finished reel in the next twice-daily update, as a preview. It is not an approval step: the reel posts unless he says otherwise.
