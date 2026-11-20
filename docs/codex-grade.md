# Judge sheet — Drift Signal: The Long Quiet

TSA Video Game Design (High School), preliminary game criteria. Judged November 20, 2026. Scope judged includes all nine rooms, three chapter transitions, and the finale.

**How this was scored.** Reviewed `index.html`, `css/`, `js/`, `docs/design.md`, `docs/notes.md`, `tests/`, the browser test, and the supplied Chromium screenshots for rooms 1, 5, 9 and the finale. The supplied browser run finished all nine rooms with zero console errors. Its script drives progression with the test hook and exercises the first puzzle's keyboard controls. I ran the baseline Node suite and checked the light grid and sliding board solutions in Node. The supplied captures show desktop rendering. The narrow-screen findings below follow from CSS and control flow.

---

## Score table

### Game (70 points)

| Criterion | × | Score /10 | Points | One-line reason |
|---|---:|---:|---:|---|
| Creativity and Artisanship | 2 | 7 | 14 | A peaceful space campaign makes reassurance, evidence and companion help part of the mechanics. The bespoke cargo bay and cryo props sell their rooms, while stock puzzle rules and repeated deck shells limit their character. |
| Technical Skill | 2 | 7 | 14 | A local Three.js world, collision-aware guided walking, persisted d20 checks, and a full set of gates show real engineering. The tuner stalls, chapter access can regress, and the browser test bypasses most puzzle logic. |
| Storyline / Flow of the Game | 1 | 8 | 8 | The three chapters escalate from one frightened AI to a decision about a lost world's seeds. Evidence and early conversations matter, and all nine authored endings feed the epilogue. Generic repeat dialogue and stale room narration weaken revisits. |
| Overall Appeal | 2 | 6 | 12 | Bold typography, clear chapter colors and legible objectives frame the voyage. Repeated floor plans, weak first-room direction and a cramped touch layout make the nine-room loop feel more uniform than the writing. |
| **Game subtotal** | | | **48 / 70** | |

| | Points |
|---|---:|
| Previous 2D game (rooms 1–3) | 44 / 70 |
| Current 3D game (rooms 1–9) | **48 / 70** |

The world is the main gain. Cryo Deck reads at a glance and Cargo Bay gives its weighing puzzle a place in the story. Water Room still shares Cryo Deck's square silhouette and centerline markings. The finale has the strongest composition of the supplied captures, though its illustration returns to the opening star after the player settles Verdant's fate.

---

## Bugs and problems, ranked by severity

Line numbers refer to the judged build.

### Blocking

No verified blocker on a normal run. The original puzzles have separate bypass paths and the supplied browser run reached the finale.

### Major

1. **A reached chapter can disappear from Chapter select.** `js/ui/screens.js:48`, `js/main.js:73–78`, `js/state.js:93–98`. Reach Harbor Nine's intro, return to Title before entering Room 4, select Meridian, then return to Title again. Selecting Meridian overwrites the current chapter and the furthest room is still Room 3, so Harbor Nine drops off the list. The same sequence applies to Verdant.
2. **The beacon tuner gives no directional feedback across part of its range.** `js/puzzles/tuner.js:75–76`, `:86–94`. At the initial phase of 0, frequency 0, 1 and 2 all read 0%. Starting at (0,0), every phase setting also reads 0%. The bar uses a floor that conceals changes precisely where the player starts, and only ENG 4 exposes its number as text. A player trying one dial at a time can reasonably conclude it has no effect.
3. **Touch exploration requires leaving the room view to take a step.** `js/world/view.js:159–185`, `index.html:37–39`, `js/ui/panels.js:72–86`. A tap on any out-of-reach object tells the player to move closer, but only hardware keys move the character directly. The Room objects list is a working workaround. Pointer interaction should guide the Navigator along that same route.
4. **The HUD occupies the same space as the room on narrow screens.** `css/style.css:130–142`, `:260–269`, `js/world/view.js:144–149`. At up to 460px, the two objective/rank panels stack above the lower copy inside the room body while the width-limited projection stays centered behind them. Neither the camera nor the layout reserves a viewport for the deck, so the panels can cover the targets the tap interface is supposed to expose.

### Minor

1. **A failed save is silent.** `js/main.js:35–37`, `js/state.js:37–44`, `js/ui/panels.js:20`. A throwing storage returns false and the UI still offers “Save and return to title.” This is reproducible with failing storage in Node. The current session can keep playing, but a reload can lose its progress.
2. **Three introductory conversations restart at their first line after completion.** `js/dialogue.js:9–12`, `js/story/ch1.js:56–79`, `js/story/ch2.js:58–80`, `js/story/ch3.js:56–79`. Finish one and open it again. The first line returns even after the task it describes is solved. Cached dice prevent another payout but do not fix the dialogue.
3. **Completed systems can still be described as broken.** `js/ui/room.js:17`, `js/main.js:159–165`, `js/story/ch1.js:103`, `js/story/ch3.js:143`. The intro remains static and inspecting the gauges or return pipes after repair still reports the original condition.
4. **Timed memory playback is the only way to read the sequence.** `js/puzzles/memory.js:48–61`, `:125–149`. The live region and numbered shapes help, but every player must take in the cues at a fixed cadence, even in reduced-motion mode. An explicit next-cue control would make the sequence available at a player-controlled pace.
5. **Grid buttons inherit modal sibling spacing.** `css/style.css:214–215`, `js/puzzles/power.js:51–60`, `js/puzzles/lights.js:29–51`, `js/puzzles/sliding.js:30–48`. Each button after the first inherits a left margin on top of the grid gap. The first tile gets extra width and the controls no longer share a single tile alignment.
6. **Room guidance is uneven.** `index.html:37–39`, `css/style.css:130`, `js/ui/room.js:13–20`. The intro asks what the player will inspect first, while move/interact help is at the bottom and the actionable alternative is in the header. The supplied screenshots also show north-door labels partly obscured by the back wall (`js/world/props.js:184`, `js/world/shell.js:32–36`).
7. **Several puzzle aids are presentational or underspecified.** `js/puzzles/valves.js:33–40` corroborates a note already labeled unreliable. `js/puzzles/cipher.js:59–61` previews the entire message for every shift, so a sweep solves it without reading the mapping. `js/puzzles/sliding.js:21–24` leaves the required final location of the gap implicit.

## Top improvements by points at stake

1. Give mouse, touch and keyboard players a clear way into the first encounter, and reserve a dedicated room viewport on narrow screens. This helps every room and has the biggest effect on Overall Appeal.
2. Make chapter unlocks durable and make puzzle feedback actionable. Bring the tuner and memory console up to the accessibility standard set by the Room objects list.
3. Give the decoder a signal to deduce, let successful checks and evidence change what a player can do, and show repairs in both the room and the Game Master's narration. That would make the tabletop systems feel connected to the world.
4. Give rooms stronger silhouettes and prop states, then bring the finale back to the ark. The supplied captures suggest more room-specific visual work would earn more than adding another puzzle.

---

## Fixes made

- **Chapter access.** Reaching an intro now updates a saved chapter high-water mark independently of the current chapter and furthest room. Existing v1 saves still load. The regression test returns to an earlier chapter and reloads the result.
- **Beacon tuner.** Each slider step toward the target improves strength throughout the range. Everyone gets an announced percentage. Engineers get frequency direction, and the successful Veil signal check now supplies the phase clue.
- **Pointer navigation and narrow layout.** Clicking or tapping distant objects uses the same collision-aware guided route as Room objects. Interactive props get a pointer cursor. Narrow layouts give the 3D view its own row, separate from objectives and narration. Touch HUD buttons have larger targets. Cryo Deck names the first objective and highlights Room objects.
- **Save feedback.** A failed write shows a visible warning and changes the Pause action to reflect the in-memory session.
- **Dialogue and world continuity.** Finished ORI, Tamsin and Fern introductions get short follow-ups. Every room has post-repair narration and points to the exit once it opens. The gauges and return window describe their current state. Pipes brighten when their systems run, door labels sit in front of the wall, and prop markers vary by shape as well as color.
- **Puzzle controls and clues.** Memory playback can wait on each numbered cue. The decoder asks the player to derive a shift using a marker and previews just that marker. Science adds a second marker and a more actionable valve hint. Open valves show their order on the buttons. The sliding board names the final empty square and announces tile positions. Grid buttons have consistent spacing, and the power puzzle announces bypass availability.
- **Character creation and finale.** The class screen explains d20 checks, companion aid and alternative routes after a failed check. The finale uses the existing Verdant illustration.
- **Verification.** `node tests/core.test.js` passes and now exercises all nine puzzle solutions through their control handlers. `node --check` passes on all JavaScript and MJS files, including the vendor files. The `?test=1` hook, choice IDs, original power bypass threshold and browser script are intact. Chromium was not rerun, so touch layout, ray picking and post-fix visuals still need the operator's browser pass.

### Estimated game rescore (70 points)

| Criterion | × | Score /10 | Points | One-line reason |
|---|---:|---:|---:|---|
| Creativity and Artisanship | 2 | 7 | 14 | The decoder and Veil clue integrate the fiction more closely, while several puzzle patterns and room shells remain familiar. |
| Technical Skill | 2 | 8 | 16 | Regression coverage reaches all nine puzzle controls and the save path preserves reached chapters across revisits. |
| Storyline / Flow of the Game | 1 | 8 | 8 | Repairs and completed conversations now carry through to the room, reinforcing the existing three-chapter arc. |
| Overall Appeal | 2 | 8 | 16 | Clearer onboarding, tap-to-walk interactions and a dedicated narrow-screen viewport improve access to the room. The final visual score is provisional pending the browser pass. |
| **Estimated game subtotal** | | | **54 / 70** | |

## Round 2 changes

- **Visual identity.** ORI, Pilot Tamsin, Fern, the Veil and the Navigator now have distinct low-poly bodies and faces. Dialogue and Party use matching vector portraits. The character idle, water highlights and dice artwork respect reduced motion.
- **Rooms and finale.** The room geometry includes a pod bank and conduit runs, pressure tanks, a signal dish, docking ring, crate stacks, a beacon mast, frosted drawers, greenhouse beds and a return-water channel. Repairs visibly power equipment, clear locks and open doors. The Verdant finale shows the ark in 3D with an open seed bay, a lit garden dome or a sealed vault according to the saved outcome.
- **Puzzles and tabletop.** The room consoles now introduce their own equipment. The pulse-monitor inspection carries its calibration pair into the Veil decoder. A copy of the plate is also available at the decoder. The maintenance log unlocks a direct reply with ORI, successful checks identify the options or aid they unlock, and the Game Master accounts for both repairs and clearance. Cryo Deck has a one-action guided walk to the first repair.
- **Verification.** The two Node suites and syntax checks pass. The tests cover the evidence reply, marker access, bypass thresholds, reduced-motion states and all three finale variants. The operator’s Chromium test now checks the evidence reply, successful-check feedback and the finale canvas. Chromium startup was denied in this workspace, so the browser capture and touch-layout checks remain pending.

| Criterion | × | Estimated score /10 | Points | Reason |
| --- | ---: | ---: | ---: | --- |
| Creativity and Artisanship | 2 | 9 | 18 | Original character silhouettes and purpose-built ship equipment carry the fiction into the 3D scenes and consoles. |
| Technical Skill | 2 | 8 | 16 | Saved outcomes now drive more scene and dialogue states. The updated browser pass is pending. |
| Storyline / Flow of the Game | 1 | 9 | 9 | Evidence opens a reply, completed repairs change dialogue, and each seed decision has a visible ending. |
| Overall Appeal | 2 | 9 | 18 | More legible rooms, a direct first action and a 3D reunion with the ark give the voyage a stronger visual arc. |
| **Estimated game subtotal** | | | **61 / 70** | Provisional pending the operator’s browser pass. |

## Round 3 changes

- Verified all 11 DeepSeek findings against the original code and recorded the evidence in [the independent review](deepseek-grade.md#verification).
- The freight scale records three distinct equal-load comparisons and requires those readings to identify one crate. An inconclusive record or incorrect name calls for a clean reset. Pip and the manifest explain the load without identifying a crate. The power grid points to the fixed terminal, the decoder checks the shift on Transmit, and the beacon gives a phase band and relative signal feedback.
- The pressure door leads into the Signal Laboratory. Reassuring ORI delivers the maintenance log when the player reaches Life Support. Reassuring Tamsin adds a cue at the ring controls, and reassuring Fern marks up the greenhouse rota. Companion chatter is available in the room transcript, and Verdant’s completion card points to the observation deck.
- The diorama fills more of the view. Labels have more space around nearby props, a floor ring marks guided walks, and the docking lights, beacon and water support reduced motion. The first room gives directions for walking and interacting, and How to play explains controls, checks and rank points. The phone layout gives the canvas more height below the name, goals and Room objects.
- Escape during a solve confirmation records the repair and returns to the room. Panel focus uses a fallback when the browser lacks `checkVisibility()`. Node tests and JavaScript syntax checks pass. The browser test now completes the power grid and freight balance through their own controls and retains the test hook for the other seven. The operator’s Chromium run and visual review are pending.

| Criterion | × | Estimated score /10 | Points | Reason |
| --- | ---: | ---: | ---: | --- |
| Creativity and Artisanship | 2 | 9 | 18 | Equipment and evidence give the puzzles a place in the setting while preserving player deduction. |
| Technical Skill | 2 | 9 | 18 | The scale validates the measurement record, and the browser script covers both early dismissal and normal solve completion. |
| Storyline / Flow of the Game | 1 | 9 | 9 | Dialogue checks change what players find at the consoles and carry into later rooms. |
| Overall Appeal | 2 | 9 | 18 | Tighter framing, clearer movement feedback and phone onboarding support the nine-room voyage. |
| **Estimated game subtotal** | | | **63 / 70** | Provisional pending the operator’s Chromium pass. |
