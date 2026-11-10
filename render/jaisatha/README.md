# Jaisa Tha (As it was): Talaash Heritage reel series

One episode per field of TALAASH (archaeology, linguistics, anthropology, arts, Sanskrit, history, heritage), never two archaeology episodes in a row. Each episode points to a Talaash programme or guide. Rules: docs/SOCIAL.md and the project note "social-content-split".

## Episode 1: Purana Qila (made 10 Nov 2026)
- Script, caption, sources and fact-check notes: 01-purana-qila.md
- 3D stills: `pip install bpy` (Blender 5.2 wheel, Python 3.13), then `python3 purana_qila_scene.py STAGE SAMPLES` for STAGE 1..11 (40 samples, about 2 min a still on 2 CPUs). Stage 11 also writes the label positions.
- Assembly: `python3 purana_qila_compose.py` (needs the stills in frames/, the Noto Sans and Tiro Devanagari Sanskrit fonts in fonts/, and site/assets/img/logo-badge.png), then the two-pass encode at 560 kbit/s video + 64 kbit/s mono AAC keeps a 46 s reel under 3.8 MB, the largest file the browser upload accepts.
- Paths inside the scripts point to /home/claude/jaisatha; change them when reusing.

## Making the next episode
1. Script from primary sources; two independent fact checks (one opens every source, one tries to disprove each claim) before rendering.
2. Render, then check every segment frame by frame: text clear of objects, labels on the right layers. Run `python3 edgecheck.py <reel.mp4>`: it must report 0 frames touching an edge (a vertical frame is narrow, so the camera auto-fits each scene inside 110–970 px; the push-in is kept to 3.5% and the sway to 12 px so they never crop).
3. Schedule on @talaashheritage (not at 08:10 or 19:40, the daily slide times), add the entry to content/reels.json, and fill its "instagram" link once it is live.
