# Drift Signal: The Long Quiet — merge spec

Merge the three finished games (sources in `js/chapters-src/`, puzzles in `js/puzzles/`, art in `assets/ch1..ch3/`) into ONE campaign with 3 chapters and 9 levels. Plain HTML/CSS/vanilla JS, no libraries, no network, no audio, no combat, no weapons/violence. Runs from static hosting (GitHub Pages) in any browser. Keep every file small and readable: a student must be able to explain the code in an interview.

## Story
You are the Navigator of the survey fleet. One mysterious signal links three crises:
- **Chapter 1 "Meridian"** (source ch1_*): the drifting ship, ORI, the Veil's signal. (Levels 1-3)
- **Chapter 2 "Harbor Nine"** (ch2_*): following the Veil's star chart, you reach a waystation and guide three lost ships in. (Levels 4-6)
- **Chapter 3 "Verdant"** (ch3_*): the final voyage, an ark ship carrying the last seeds, with Fern the gardener AI. (Levels 7-9)
Write short bridge text so it reads as one story (e.g. chapter 1 ends with the Veil sending a chart; chapter 2 intro says the chart led here; chapter 2 ends with the harbor sending the Verdant's distress call; chapter 3 intro says that call). ORI can be mentioned as still in the Navigator's ear in later chapters (flavour text only, no new puzzles). Keep every existing dialogue, puzzle and stat check; only fix wording that breaks continuity.

## Required changes
1. **Chapter files:** convert each source into `js/chapters/ch1.js`, `ch2.js`, `ch3.js`, each setting `window.Chapters[n] = { title, tagline, intro, image, imageAlt, endings:[{flag, text}...], levels:[...] }` (levels keep the same shape: id, title, image, imageAlt, intro, hotspots). Image paths become `assets/chN/...`. Delete `js/chapters-src/` when done.
2. **Namespacing loader `js/loader.js`:** builds `window.Levels` (9 levels, global ids 1-9, each with `chapter: n`) from `window.Chapters`. It must prefix with `cN_` every hotspot `id`, every flag (`setFlag`, `needFlag`, `notFlag`, `needAll[]`), and every dialogue choice `id`/flag, so ids and flags from different chapters never collide (all three chapters currently reuse names like `contacted`, `look1`, `door1`, `ending_*`). Do NOT prefix the `puzzle` name or `exit`. Chapter `endings[].flag` must be prefixed the same way.
3. **Dialogue ending flags:** in `js/dialogue.js`, a flag matching `/^c\d_ending_/` clears only the other flags with the SAME `cN_ending_` prefix, not other chapters'. Update `tests/core.test.js` to cover it.
4. **State:** `State.newGame` stays 9 points across 3 stats. `XP_PER_LEVEL = 45`, `MAX_LEVEL = 9`. Add `journal: []` to the state (and tolerate old saves without it). New save key `driftSignalSaga.v1`. Add State tests.
5. **Chapter cards in `js/game.js`:** when the player enters the first level of a chapter, show a card first (chapter number, title, tagline, image, the chapter intro text, "Begin chapter" button). When the player leaves the last level of a chapter, show a "Chapter complete" card with the outcome text of that chapter's ending (use the `endings` list, first matching flag wins, last entry is the fallback), the XP/rank so far, and a "Continue" button. Save progress at each card so Continue resumes correctly.
6. **Journal:** any hotspot with an `id` and `xp` that is used adds `{ id, level, text }` to `S.journal` (once). Add a "Journal" button to the HUD that opens a panel listing entries grouped by chapter, with a Close button. Keyboard accessible, focus moves to the panel heading, Close returns to the game.
7. **Finale:** after Level 9 the game shows "The Long Quiet" ending screen: a short epilogue paragraph that combines the three chapter outcomes (write 3 x 3 = 9 short sentence variants, one per chapter ending, joined into a paragraph), final rank and XP, stats, number of journal entries found out of the total available, and a "Play again" button (clears the save). Use a new `assets/finale.webp` if it exists, otherwise `assets/ch1/title.webp`; do not break if missing.
8. **Chapter theme colour:** `<body data-chapter="1|2|3">` set by game.js; CSS variables `--accent` per chapter (ch1 #7aa2ff blue, ch2 #ffb454 amber, ch3 #6fdc8c green). Add a subtle fade-in for each screen, disabled under `prefers-reduced-motion`.
9. **Level-up and HUD:** keep the existing behaviour (stat points can only be spent on room screens, never inside a puzzle). HUD must show chapter name and level number (e.g. "Ch 2 · Level 5 · Docking Ring").
10. **Menu:** the title screen needs Continue / New game, and a small "Chapter select" list showing unlocked chapters (a chapter is unlocked when its first level has been reached) which jumps to the first level of that chapter, keeping stats and XP.
11. **index.html:** title "Drift Signal: The Long Quiet", description, loads scripts in the right order (meta, state, dialogue, puzzle registry, nine puzzle files, chapters, loader, game).
12. **Do not change puzzle behaviour** except to fix real bugs you find; if you change a puzzle, say so.
13. **No sound, no external assets, no new libraries.** All text must be calm and non-violent.

## Acceptance
- `node tests/core.test.js` passes, including new tests.
- `node --check` passes on every js file.
- A player can complete all 9 levels (all puzzles solvable, every stat build can finish).
- Level exits require all needed flags (e.g. level 2's exit needs both `air_ok` and `lab_open`, level 5's needs `cargo_ok` and `manifest`, level 8's needs `crew_set` and `crew_calm`; keep the original conditions).
- Do not commit. Do not touch `.git`. Write a short `docs/saga-notes.md` listing every file you created or changed and any puzzle fix.
