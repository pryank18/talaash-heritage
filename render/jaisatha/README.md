# Jaisa Tha (As it was): Talaash Heritage reel series

One episode per field of TALAASH (archaeology, linguistics, anthropology, arts, Sanskrit, history, heritage), never two archaeology episodes in a row. Each episode points to a Talaash programme or guide. Rules: docs/SOCIAL.md and the project note "social-content-split".

## Episode 1: Purana Qila (made 10 Nov 2026)
- Script, caption, sources and fact-check notes: 01-purana-qila.md
- 3D stills: `pip install bpy` (Blender 5.2 wheel, Python 3.13), then `python3 purana_qila_scene.py STAGE SAMPLES` for STAGE 1..11 (40 samples, about 2 min a still on 2 CPUs). Stage 11 also writes the label positions.
- Assembly: `python3 purana_qila_compose.py` (needs the stills in frames/, the Noto Sans and Tiro Devanagari Sanskrit fonts in fonts/, and site/assets/img/logo-badge.png), then the two-pass encode at 560 kbit/s video + 64 kbit/s mono AAC keeps a 46 s reel under 3.8 MB, the largest file the browser upload accepts.
- Paths inside the scripts point to /home/claude/jaisatha; change them when reusing.

## Episode 2: Sabz Burj, Delhi (made 14 Nov 2026, arts)
- Script, caption, sources, three-check notes: 02-sabz-burj.md
- Stills: three.js r158 in headless Chromium, `python3 sabz_burj_shoot.py` (renders sabz_burj_scene.html for 9 scenes and writes label positions); then `python3 sabz_burj_compose.py` and the two-pass encode at 420 kbit/s + 64 kbit/s mono AAC (55.7 s, 3.45 MB). Paths in the scripts point to /tmp/claude-0/jt2 and /tmp/claude-0/fonts (Noto Sans and Tiro from @fontsource, converted to TTF); change them when reusing.
- From this episode on, both logos sit on every frame: archaeologywala top left, Talaash top right, and both on the end card.

## Making the next episode
1. Script from primary sources; two independent fact checks (one opens every source, one tries to disprove each claim) before rendering.
2. Render, then check every segment frame by frame: text clear of objects, labels on the right layers. Run `python3 edgecheck.py <reel.mp4>`: it must report 0 frames touching an edge (a vertical frame is narrow, so the camera auto-fits each scene inside 110–970 px; the push-in is kept to 3.5% and the sway to 12 px so they never crop).
3. Schedule on @talaashheritage (not at 08:10 or 19:40, the daily slide times), add the entry to content/reels.json, and fill its "instagram" link once it is live.

## Episode 3: the Sanskrit alphabet, a map of the mouth (made 28 Nov 2026, linguistics)
- Script, caption, LinkedIn text, sources, three-check notes: 03-varnamala.md
- Stills: three.js r158 in headless Chromium, `python3 varnamala_shoot.py` (renders varnamala_scene.html from /tmp/claude-0/jt3 for 9 scenes and writes label positions); `python3 varnamala_compose.py`; score `python3 score/varnamala_score.py out.wav 51.5`, then acompressor + volume 19 dB + alimiter 0.56 (gives -14.6 LUFS, -1.9 dBTP); two-pass x264 at 480 kbit/s + 64 kbit/s mono AAC (51.5 s, 3.63 MB). Fonts: Noto Sans latin + latin-ext merged, Tiro Devanagari Sanskrit (latin and devanagari) from @fontsource, converted to TTF with fontTools.
- One framing for every scene so the head never touches the frame edge (edgecheck 0). Logos as in episode 2 v2: archaeologywala at 96 px beside the Talaash badge, no backing disc (tools/reel_qc.py --3d PASS).

## Episode 4: Kandariya Mahadeva (drafted 28 Nov 2026, not built)
- Draft text: 04-kandariya.md. Stills come from the site's own model: serve site/ on localhost:8765 and run `python3 kandariya_shoot.py` (portrait 1080x1920 stage, labels off). Checks still open: see the ledger notes for tl-jaisa-tha-04-kandariya.
