# Judge sheet — Drift Signal 3D: The Long Quiet

2027–28 TSA Video Game Design (High School), preliminary round. Judged 2026-11-20.
Scope judged: the 3D browser game in this repository only. The portfolio, video and storyboard were not graded. I did not read `docs/codex-grade.md`, so this sheet is independent of the other judge.

**How this was scored.** Source read: `index.html`, `css/style.css`, `css/tabletop.css`, all of `js/` (`main.js`, `state.js`, `checks.js`, `dialogue.js`, `story/`, `puzzles/`, `ui/`, `world/`), `docs/design.md`, `docs/notes.md`, the three test files, `tools/e2e.mjs`, `tools/chromium.mjs` and `README.md`, plus the four screenshots in `tools/shots/`. Executed `node tests/core.test.js` (passes; it imports the nine-puzzle DOM tests and the 3D state tests) and `node --check` on every `.js`/`.mjs` file (passes). I drove the real build in headless Chromium at 1440×900 with SwiftShader: played room 1 and into room 2 through the UI, solved the power grid in 9 rotations, took the skip/bypass route, solved the valves, resumed a dialogue after Back, exercised Journal/Inventory/Party/Room objects/Pause/Spend points, loaded crafted saves, and opened rooms 3, 5 and 6 that way to reproduce the findings below. Zero browser console errors in the normal runs. I did **not** run `tools/e2e.mjs`, because it rewrites `tools/shots/*.png` and this pass was asked not to touch any other file; I read it instead. I did not hand-play rooms 4, 7 and 8, so those are judged from source, tests and the finale screenshot.

---

## Score table

### Game (70 points)

| Criterion | × | Score /10 | Points | One-line reason |
|---|---|---:|---:|---|
| Creativity and Artisanship | 2 | 8 | 16 | The tabletop-RPG frame is built, not painted on: three classes, DC checks, a party, a Game Master voice, a low-poly diorama with in-world printed labels and three chapter palettes. Held back by reusing the nine stock puzzle types from the 2D game, several of which hand the player their own answer. |
| Technical Skill | 2 | 8 | 16 | Real engineering for a high-school entry: vendored Three.js, data-driven rooms, resumable dialogue with cached rolls, validated saves, BFS pathing, focus trap, reduced motion, WebGL fallback, and tests that exercise every puzzle control. Held back by a broken balance-scale rule, a browser test that skips real puzzle completion, and puzzle code built from inline-styled DOM. |
| Storyline / Flow of the Game | 1 | 7 | 7 | Three proper chapters with three distinct endings each, per-ending epilogues, items and a chapter-2 intro variant for the quiet route. But the room-to-room path is fixed, checks mostly buy XP and endings rather than changing what happens inside a room, and one promised scene (the lab) never appears. |
| Overall Appeal | 2 | 8 | 16 | It looks and reads like a finished small game: strong HUD typography, chapter colour identity, the CSS d20, portraits, the "next step" narration and a 3D finale. But rooms are sparse tableaux, the avatar is small, and walking is decorative next to Room objects. |
| **Game subtotal** | | | **55 / 70** | |

The 2D version on the previous sheet scored **44 / 70**; this is **55 / 70**, or 78.6% of the game score. The +11 is real and comes from the presentation, the RPG layer and the engineering, not from new puzzle or story ideas — those were carried over largely unchanged.

### What is genuinely strong

- **It is finishable and stable.** No console errors, no runtime network, no audio, no combat, and no soft-lock: every required flag has a no-roll route, so a judge cannot get stuck even on a low stat roll.
- **The design document and the code agree.** I checked the class table, DCs, aid conditions, XP values, all nine puzzle bypass thresholds, all nine room gates, the item table and the 20-entry journal; the only mismatches are noted below.
- **The D&D layer is honest.** Scores are 9 points, modifier is score−3, advantage/disadvantage cancel correctly, rolls are cached per choice, failed checks lead somewhere, and companion aid is shown before the roll.
- **The accessibility work is not decorative.** The Room objects list gives every hotspot a keyboard/screen-reader route, the modal traps focus, reduced motion is honoured, the dice result is repeated as text, and no interaction depends on the 3D view.
- **The shots are the real build.** `room-1.png`, `room-5.png`, `room-9.png` and `finale.png` are 1440×900 captures of the game, and the finale shot (rank 9, 415 XP, journal 20/20) matches what the data and tests predict.

---

## Verified bugs, ranked

No **blocking** bugs found: I could not make the game crash, soft-lock or drop a save.

### Major

Items 1–5 are gameplay/design defects rather than crashes; each was reproduced in the browser or read against a hard gate in the data.

**1. The balance puzzle can be named after one weighing, so its deduction is optional.**
`js/puzzles/scales.js:117` shows "Name the heavy crate" whenever `phase === 'weigh' && weighings >= 1`, and `:155` lets the naming phase begin on that same condition. Trigger (reproduced in Chromium): room 5, put 1–3 on the left and 4–6 on the right, weigh once; the pans balance, and the name button is already visible. Pick any crate and Confirm. A wrong name also resets `weighings` to 0 but leaves the pans loaded (`:190`), so the player can re-weigh once and guess again; after three failures the skip unlocks, but nothing stops further guesses. The three-weighing puzzle is now "weigh once, guess until it lands, or skip".

**2. The answer to the same puzzle is handed over by Pip, whose conversation the lift requires.**
`js/story/ch2.js:127` — "Manifest unlocked. Crate seven is on the heavy side. Pip thinks." — and `:150` makes `c2_manifest` a hard requirement for the tower lift. Every player therefore receives the name of the heavy crate before touching the scale. Combined with bug 1, the balance can be "solved" with one weighing and one click. This contradicts the design's own word, "tentative" (`docs/design.md:52`).

**3. The ENG 5 hint marks the exact tiles the first puzzle needs turned.**
`js/puzzles/power.js:26` defines `PATH` as `'2,1','1,1','1,2','1,3','2,3'`, and `:82` draws a dot on each of those tiles. Reproduced in Chromium with the Engineer: the dots land on tile indices `[6, 7, 8, 11, 13]`, which are precisely the five fittings to rotate (the documented solution). The Engineer starts ENG 5 (`js/story/classes.js:8`), so the default class is shown the route through the very first puzzle. It still has to find the turn counts, but the deduction is gone.

**4. The cipher's live marker preview turns the shift into a matching game.**
`js/puzzles/cipher.js:59` recomputes `D → <letter>` on every input. Reproduced: shift 0 shows `D → D`, shift 3 `D → A`, shift 7 `D → W`. Because the calibration plate already states "Incoming D maps to W", the player can type or arrow through 0–25 and stop when the preview matches, without counting backward or understanding the substitution. The SCI 4 line at `:26` adds a second pair but is not needed. This is better than the 2D version (no plaintext on screen), but it still is not a deduction.

**5. The tuner can be solved from its own hints.**
`js/puzzles/tuner.js:65-68` prints "Start with phase 3" whenever the player passed the Veil's SCI check (`c1_knows_signal`), and `:99-105` prints "Raise/Lower the frequency" for ENG ≥ 4. Reproduced in Chromium with a Scientist who has ENG 4: both hints are on screen at once, so the two dials are instructions, not a puzzle. The 100% strength meter then makes the remaining dial a hill-climb.

### Minor

**6. The lab is opened but never visited.**
`js/story/ch1.js:157` labels room 2's exit "Go to the lab", the goal is "Get ORI to open the lab", and the narration promises the lab door opening — but the exit loads room 3, "The Signal", a glass dome. A judge following the goals will notice that the lab they unlocked does not exist. Either rename the exit ("Go through to the signal dome") or put a short lab beat at the top of room 3.

**7. Closing any panel throws on browsers without `Element.checkVisibility`.**
`js/ui/modal.js:34` calls `opener.checkVisibility()` after `dialog.close()`. `checkVisibility` is Chrome 105 / Firefox 125 / Safari 17.4 and newer. Reproduced by deleting the method in the page: the panel still closes, but an uncaught `TypeError: opener.checkVisibility is not a function` appears in the console, and the focus-restoration code below it never runs. This only matters on an old school browser, but it is a one-line guard.

**8. Escape is ignored for the one-second solve animation.**
Every puzzle disables Back when it starts solving (`js/puzzles/power.js:163` is representative) while `js/main.js:261` routes Escape through that same Back button. Trigger: solve the power grid, press Escape during the one-second confirmation. The panel cannot be closed until the timer ends. Negligible, but it is the only moment the modal ignores Escape.

**9. The Verdant completion card has no route line.**
`js/ui/screens.js:94` builds `ending.nextStop ?? chapter.nextStop`; chapter 3 has neither (`js/story/ch3.js` endings stop at `epilogue`), so the card renders an empty `p.route-copy`. The final chapter has nowhere to route, so this is cosmetic, but it leaves a visible gap where chapters 1 and 2 have a sentence.

**10. The browser test does not test real puzzle completion.**
The test hook at `js/main.js:303-309` clicks the puzzle's Back button and then calls `finishPuzzle(hotspot, false)` directly; `tools/e2e.mjs:146` uses that hook for all nine rooms. So the e2e proves the room gates, the finale and the save/reload path, but it never exercises a puzzle's own success callback, its one-second timer, or the solve→message transition. I verified the power and valves solve paths by hand and they work — the gap is in the test, not the game. A judge reading the test suite will notice.

**11. Documentation vs implementation (small).**
`docs/design.md:29` promises banter through "the panel and occasional scene prompts"; banter only exists in the Party panel (`js/ui/panels.js:71`). There are no dead flags: all 31 flags that are set are read by a gate, an item, a companion aid, a puzzle hint, a chapter ending or the finale, unlike the 2D build.

---

## Top 5 improvements, by points at stake

Estimates are on the 70-point game scale; they partially overlap and are not additive one-for-one.

**1. Rebuild the cargo chain so the scale is the only way through. Worth ~+3 (Technical, Creativity, Appeal).**
Gate the name button on all three weighings (`scales.js:117`, `:155`) and stop resetting the weighing count on a wrong guess, or make it a real cost. Change Pip's line to a constraint ("the heavy one is in the back row" / "seven or eight, Pip thinks") instead of the answer. Then fix the e2e to solve the scale through its own UI. This turns the weakest room into a real deduction and removes the "required conversation spoils the puzzle" contradiction.

**2. Stop handing over puzzle answers in hints. Worth ~+3 (Creativity, Technical).**
Power: draw dots on the source's first two conductors only, or make the ENG 5 aid show the live circuit once it is already connected. Cipher: remove the `D → X` preview; check the shift only on Transmit and make the SCI 4 aid a second crib pair, not a verifier. Tuner: make the Veil evidence a phase *band* ("between 2 and 4"), not the value, and the ENG aid hot/cold ("closer"), not "raise/lower". The puzzles that survive these edits are the ones that will read as designed rather than labeled.

**3. Let a check change the room, not just the XP. Worth ~+2–3 (Storyline ×1, Appeal ×2).**
Right now success mostly pays 20–25 XP and opens an ending. Add one visible consequence per chapter that a judge can see: calming ORI means the maintenance log is already on the shelf in room 2 (saving a walk) or the lab door opens without the wait route; calming Tamsin means she gives one memory cue; calming Fern means the rota board already has Cy's two constraints. Failing the check removes the shortcut. This is where the "tabletop RPG" claim becomes true instead of cosmetic, and it costs data edits, not engine work.

**4. Make the diorama carry the game, not just host overlays. Worth ~+2 (Appeal ×2).**
The camera is fixed and the room mesh only fills the middle of a full-bleed canvas: in the room-1 shot the diorama occupies roughly 600×530 of the 1440×900 view, with large empty margins, and room 9 is framed the same way. Frame each room's four-to-eight props larger and tighter, stagger the floating labels so they do not collide with walls, and animate the set pieces that already exist (ring lights in sequence, beacon strobe, water ripples) plus small ambient motion that respects reduced motion. Add a click-to-walk path ring or footprint marker; the avatar currently drifts with no feedback. The 3D is the differentiator from the 2D game, so it should be doing more than the floor.

**5. Onboard, and finish the phone layout. Worth ~+1–2 (Appeal ×2, Technical).**
There is no Help panel: the class screen explains checks once, and then the player must remember how stat points, panels and puzzle grids work. Add a "How to play" panel to the room nav (dice + DC, spending points, Tab/Enter, E, Escape) and make the first room ask the player to walk and press E once, instead of offering "Walk to the cryo console" as a teleport. At 390×844 there is no horizontal overflow (checked) but the canvas is 361×304 and props are tiny targets, so a phone pass that raises the canvas and puts the room name, goals and "Room objects" above it would make the game usable without pinch-zoom.

---

## Claims checked / not checked

Checked by execution: the three classes are 9 points each; modifier score−3 and the advantage/disadvantage cancel rule; roll caching and a pending roll surviving the save round-trip (core tests); the save key `driftSignal3d.v1` and the corrupted-save path; 20 journal entries (11 inspections + 9 puzzles); 325 XP from hotspots (270 puzzle + 55 inspection); 300 XP from nine solves plus the three no-roll social routes, giving rank 7; all nine room gates and walkable routes (core tests); all nine puzzle solutions and controls (puzzle tests); and zero console errors in the normal browser runs. The four shots reviewed are of the real 3D build and show the finale at rank 9, 415 XP and 20/20 coverage.

Not checked: a full nine-room manual playthrough (rooms 4, 7 and 8 were read, not played; rooms 3, 5 and 6 were opened from crafted saves); real touch-device `pointer: coarse` sizing; screen-reader output (the ARIA wiring was read, not heard); the WebGL-unavailable path (read, not forced); older-browser rendering beyond the simulated missing `checkVisibility`; and `tools/e2e.mjs`, which was read but not run because it would overwrite `tools/shots/*.png`.

## Bottom line

The remake is a real game, not a reskin: it is stable, finishable, accessible, tested and coherent with its design document, and it is worth **55/70** against **44/70** for the 2D version. Its ceiling is set by its content, not its code: four of the nine puzzles hand over their own answer or can be brute-forced, and the story's choices live in the chapter cards rather than the rooms. Fix the cargo chain and the hint leaks first; they are the cheapest points on the sheet.

## Verification

1. **Confirmed.** The scale exposed and accepted naming after one weighing, and a failed name reset the count while leaving the pans loaded.
2. **Confirmed.** Pip's manifest completion named crate seven, and the lift required that manifest flag.
3. **Confirmed.** The ENG 5 dot map contained exactly the five fittings in the documented solution.
4. **Confirmed.** Editing the shift recalculated the same D marker supplied by the calibration plate.
5. **Confirmed.** The Veil flag printed the exact phase while ENG 4 compared frequency with its exact target.
6. **Confirmed.** Room 2 opened an exit labeled for the lab, but room 3 began inside the signal dome.
7. **Confirmed.** Panel close and focus trapping both called `checkVisibility()` without a fallback.
8. **Confirmed.** Modal Escape clicked Back, which timed solve confirmations disabled.
9. **Confirmed.** Verdant lacked route text on both the chapter and ending records read by the completion card.
10. **Confirmed.** The browser test finished every puzzle through `solvePuzzle()`, which calls the game completion handler directly.
11. **Confirmed.** Only the Party panel rendered the room banter, although the design also described scene prompts.
