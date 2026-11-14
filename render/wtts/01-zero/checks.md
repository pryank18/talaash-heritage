# Three checks: What the Text Says #01, "Where did 'zero' come from?" (14 Nov 2026)
Locked core claim (claude/what-the-text-says.md, checked 13 Nov): English "zero" (via Italian zero, Medieval Latin zephirum) and "cipher" (via Medieval Latin cifra) both go back to Arabic ṣifr, "empty", the Arabic translation of Sanskrit śūnya, which means the same. The script uses this wording or weaker.

## Check 1: own (sources re-opened 14 Nov)
- Merriam-Webster "zero": "French or Italian; French zéro, from Italian zero, from Medieval Latin zephirum, from Arabic ṣifr". First known use 1598.
- Merriam-Webster "cipher": "Middle English, from Medieval Latin cifra, from Arabic ṣifr empty, cipher, zero"; noun sense 1a "zero".
- Jaouiche, arXiv:1008.0874 (tr. of the 1998 paper), p. 5: sifr "has the meaning 'empty' in Arabic"; "the Arabic translation of the Sanskrit 'śunya', which has precisely the same meaning". Also p. 3: al-Khwārizmī's arithmetic survives only in 12th-century Latin versions (Allard ed., Paris 1992); pp. 4 and 12: the Indians and Arabs had no word with our modern sense of "zero".
- Apte (Poona, 1890), p. 1052, s.v. śūnya: adj. 1 "Empty, void" (text layer reads "valid", an OCR slip; "void" confirmed by checks A and B); n. 1 "A vacuum, void, blank"; n. 3 "A cipher, dot."
- First draft had: "from French and Italian"; "Its first meaning in the dictionary is still 'zero'"; "In a book explaining the Indian number system, al-Khwārizmī writes that the Indians use the ṣifr"; "which means exactly the same"; "two English words carry one Sanskrit word for 'empty'".

## Check 2: subagent A (claims + sources; opened all four)
- CONFIRMED: zephirum (C2), ṣifr (C3), "empty" (C4), cipher via cifra (C5), translation of śūnya with the same meaning (C8), Apte "empty, void" and "a cipher" (C9).
- FIXES: "French or Italian", not "and" (C1); "first listed" meaning in Merriam-Webster (C6); al-Khwārizmī line goes beyond the surviving text: Arabic lost, Latin versions only (C7); final line must say ṣifr translated śūnya, not that the English words descend from the Sanskrit word (C10); avoid implying śūnya or ṣifr meant modern zero.

## Check 3: subagent B (claims only; independent search; tried to disprove)
- HOLDS: C2, C3, C4, C5 (say "same Arabic word"), C6 (name the dictionary), C9 (Monier-Williams 1899: "empty, void, hollow ..."; "(in arithm.) nought, a cypher"; revised Apte: "Empty, void." / "A cipher, dot.").
- WEAK: C1 ("or", not "and"; French zéro is itself from Italian); C7 (the Latin text mostly calls the zero sign a "circulus"; the Arabic is lost; drop the line); C8 (drop "exactly"); C10 (make the Arabic step explicit).
- FALSE: none.

## Result: final wording (kept only where both A and B confirm)
- C1 → "English took 'zero' from Italian, directly or through French." (both sources: French zéro is from Italian)
- C6 → shown on screen (Merriam-Webster card, sense 1a "zero") and in the captions as "first meaning"/"first listed meaning"; cut from the narration for length.
- C7 → dropped (al-Khwārizmī line removed from script, captions and screen).
- C8 → "It translated the Sanskrit word śūnya, which also means 'empty'."
- C9 → "Apte's Sanskrit dictionary gives śūnya as 'empty, void', and also as 'a cipher'."
- C10 → "So zero and cipher both come from one Arabic word that translated a Sanskrit word for 'empty'."
- On-screen dictionary cards quote Merriam-Webster and Apte as printed; Apte card marked "Entry quoted in part, as printed."
- Caption, LinkedIn text and Shorts description re-read against the final claims: same wording or weaker; Jaouiche cited with year and page.

## British-English proofread
Script, captions, caption.md, linkedin.md, shorts.md read through: British spelling (no -ize forms used), "Let's" kept as spoken, curly quotes on screen, no "link in bio", no AI tool names, Follow block word for word per docs/SOCIAL.md, exactly 5 hashtags.

## Voice, likeness and finished-file check (14 Nov 2026)
- Narration: English clone (F5-TTS v1 Base) from Pryank's 30 s reference (Drive "archaeologywala – voice reference 30s (Pryank).mp3"), prompt clip 6.6–12.7 s ("And three different concepts of maths: algebra, geometry and arithmetic.") plus 0.7 s silence. Two earlier prompt clips leaked the word "maths" into the lines and were discarded. Lines 3, 4 and 10 regenerated with other seeds (unclear Latin word; a doubled "that"); line 7 reworded to "But the Arabic word ṣifr was itself a translation." because "ṣifr" alone was heard as "cipher". The Merriam-Webster line was cut from the narration to keep the reel under 60 s; its card stays on screen (claim C6 checked).
- Likeness (SpeechBrain ECAPA vs the held-out 13–29 s of the reference): finished narration 0.358; pass mark 0.25; calibration: reference vs itself 0.59, two unrelated voices 0.03 and 0.09. PASS.
- Transcript (Whisper medium) of the finished file against script.md: every sentence present, in order, no extra words. Accent variants only on single words: "took" heard as "looks"/"book", "or through" as "goes to" in the full-file pass (heard correctly when the line is transcribed alone), "ṣifr" and "cifra" heard as "cipher", "Apte's" as "Apti". Burned-in captions carry the exact wording throughout.
- Frames: every second inspected on contact sheets; logo badge pixel-identical on all 1,747 frames; no spelling errors; captions match narration lines (timed from the line audio); no text off the frame.
- File: wtts-01-zero.mp4, 1080×1920, 30 fps, H.264 High + AAC 96k mono, 58.2 s, 4,649,735 bytes, SHA-256 1b18b4d100a5758f7fe3ba61965592d972c4dd08111a8663d1401e1dd07e4622; loudness normalised to −14 LUFS.
- Not hosted from this run: the session had no push access for binaries (git push refused by the proxy), and the Drive connector refuses files over about 3.1 MB. Re-render from these files (about 75 minutes on 2 CPUs) in a run with push access.
