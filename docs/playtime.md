# Meridian playtime test

The source estimate puts the required route at **345.22 seconds at 230 wpm**, above the 180-second benchmark. The same route takes an estimated **28.82 seconds** at speedrunner pace. The prescribed reading model therefore predicts a pass, while the speed route predicts that the chapter does **not** require three minutes to finish. Browser timings are pending. An observed run under 180 seconds would disprove a hard minimum.

Run `node tools/playtime.mjs` from the repository. It runs all three profiles in headless Chromium with `?test=1` and replaces the results below after all three complete. Allow roughly 18 minutes. The tool needs the same Chromium, Node, and loopback access as `tools/e2e.mjs`.

<!-- playtime-results:start -->
| Pace | Segment | Paced seconds | Cumulative seconds | Browser seconds | Words | Actions | Puzzle moves |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Average player | Setup | 73.83 | 73.83 | 73.92 | 283 | 6 | 0 |
| Average player | Room 1 | 127.72 | 127.72 | 128.14 | 335 | 14 | 9 |
| Average player | Room 2 | 138.57 | 266.28 | 140.45 | 450 | 14 | 4 |
| Average player | Room 3 | 116.28 | 382.57 | 116.11 | 383 | 14 | 2 |
| Average player | Rooms 1–3 total | 382.57 | 382.57 | 384.71 | 1168 | 42 | 15 |
| Average player | New game to chapter complete | 456.39 | 456.39 | 458.62 | 1451 | 48 | 15 |
| Speedrunner | Setup | 3.00 | 3.00 | 3.06 | 283 | 6 | 0 |
| Speedrunner | Room 1 | 9.29 | 9.29 | 11.73 | 335 | 14 | 9 |
| Speedrunner | Room 2 | 10.39 | 19.68 | 13.83 | 450 | 14 | 4 |
| Speedrunner | Room 3 | 9.14 | 28.82 | 11.19 | 383 | 14 | 2 |
| Speedrunner | Rooms 1–3 total | 28.82 | 28.82 | 36.75 | 1168 | 42 | 15 |
| Speedrunner | New game to chapter complete | 31.82 | 31.82 | 39.81 | 1451 | 48 | 15 |
| Careful reader | Setup | 94.33 | 94.33 | 94.39 | 283 | 6 | 0 |
| Careful reader | Room 1 | 247.00 | 247.00 | 246.77 | 608 | 27 | 9 |
| Careful reader | Room 2 | 202.83 | 449.83 | 203.95 | 544 | 21 | 4 |
| Careful reader | Room 3 | 168.83 | 618.67 | 168.00 | 458 | 17 | 2 |
| Careful reader | Rooms 1–3 total | 618.67 | 618.67 | 618.72 | 1610 | 65 | 15 |
| Careful reader | New game to chapter complete | 713.00 | 713.00 | 713.11 | 1893 | 71 | 15 |

**230-wpm rooms 1–3 result — PASS at 382.57 s against 180.00 s.**
The speedrunner paced total was 28.82 s. The careful reader paced total was 618.67 s.
The speedrunner reached chapter complete after 36.75 browser seconds from room 1. That run falsifies a hard 180-second minimum.

Six optional objects and three chatter panels added 153.50 s at 180 wpm, with the required route repriced at the same reading rate. The delta includes changed text and walking on the optional route.

The completion card contained 74 new words and added 19.30 s of reading after arrival at 230 wpm.
<!-- playtime-results:end -->

## Static cross-check

The word count comes from the screen, HUD, panel, dialogue, and puzzle renderers, following the source state changes on the timed route. It includes option labels, check terms, new statuses, and puzzle feedback. Identical text chunks count once per run. A contraction or hyphenated word counts as one token. Numbers and standalone letters count as tokens. Frame-dependent proximity prompts can shift the browser count slightly.

| Segment | Required route words | Careful route words | Required object visits | Required UI actions | Puzzle moves | Guided walk, required / careful |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Setup from New game | 211 | 211 | 0 | 4 | 0 | — |
| 1 · Cryo Deck | 260 | 485 | 2 | 14 | 9 | 1.29 / 2.36 s |
| 2 · Life Support | 435 | 542 | 3 | 14 | 4 | 2.39 / 3.04 s |
| 3 · Signal Laboratory | 358 | 441 | 3 | 14 | 2 | 2.14 / 2.71 s |
| **Rooms 1–3** | **1,053** | **1,468** | **8** | **42** | **15** | **5.82 / 8.11 s** |
| Completion card after arrival | 57 | 56 | 0 | 0 | 0 | — |

The required route uses two room-object controls per visit. Room 1 has nine clockwise turns, one result dismissal, and two object visits. Room 2 has four valve moves in order C, A, D, B, one result dismissal, three ORI responses, and three object visits. Room 3 opens the calibration disclosure, enters shift 7 and transmits it, dismisses the result, makes four Veil responses, and visits three objects. Expanding the calibration disclosure is an action. Entering the shift and transmitting it are the two puzzle moves. Setup uses New game, Engineer, Confirm background, and Begin chapter. The route waits with ORI at the lab and welcomes the Veil aboard through dialogue options that require no rolls.

Chapter 1 also has story copy that this route cannot display in one run. These are counts of distinct authored strings within each category in [ch1.js](../js/story/ch1.js). They cover alternative dialogue, failure and pass branches, locked interactions, and bypass outcomes.

| Room | Introductions, narration, goals, and chatter | Inspection, repair, and locked-object messages | Dialogue, responses, and unlock copy | Canvas lettering |
| --- | ---: | ---: | ---: | ---: |
| 1 | 78 | 116 | 200 | 8 |
| 2 | 137 | 112 | 269 | 15 |
| 3 | 94 | 91 | 302 | 16 |

The authored inventory and the route word counts use different scopes. The route count includes rendered UI and puzzle copy. It excludes canvas lettering, which is printed on 3D objects and counted separately from [layouts.js](../js/world/layouts.js), [props.js](../js/world/props.js), and [shell.js](../js/world/shell.js). Global reference panels, keyboard-only accessibility strings, and the chapter 2 preview are outside both timed routes.

### Estimated seconds

| Segment | Average at 230 wpm | Cumulative average | Speedrunner | Careful at 180 wpm |
| --- | ---: | ---: | ---: | ---: |
| 1 · Cryo Deck | 101.33 | 101.33 | 9.29 | 201.79 |
| 2 · Life Support | 134.13 | 235.46 | 10.39 | 202.00 |
| 3 · Signal Laboratory | 109.76 | 345.22 | 9.14 | 163.17 |
| **Rooms 1–3** | **345.22** | **345.22** | **28.82** | **566.95** |
| Setup | 55.04 | — | 2.00 | 70.33 |
| **New game to chapter complete** | **400.26** | — | **30.82** | **637.29** |

The average and careful profiles allow a minimum 1.5 seconds when a screen shows new words, plus 10 seconds per puzzle and 2.5 seconds per puzzle move. The speedrunner uses the same required route with half a second per UI action and keeps the native walks and puzzle confirmations. The guided route uses [navigation.js](../js/world/navigation.js) and the 7-unit-per-second speed in [view.js](../js/world/view.js). With 3D graphics unavailable, the tool uses two seconds per object approach. The power grid and valves each have a one-second native confirmation. Reading transient travel and confirmation text overlaps the corresponding wait. Browser seconds include rendering and automation overhead. Paced seconds use the source travel speed and the prescribed delays for the benchmark.

Title reading occurs before New game. Setup and post-arrival completion-card reading are shown separately from the rooms. At 230 wpm the estimated completion-card reading adds 14.87 seconds after the finish.

### Optional content

- **Cryo Deck** has two inspections, your badge and the pod row, and the optional first conversation with ORI.
- **Life Support** has two inspections, the gauges and maintenance log. Waiting with ORI opens the lab without collecting evidence, so both are optional.
- **Signal Laboratory** has the optional pulse-monitor inspection. Its calibration clue is also available inside the decoder. Inspecting the monitor substitutes for opening that disclosure.
- **Companion chatter** has one expandable panel in each room. The careful route opens all three and reads new lines as they appear.

These six optional object visits and three chatter panels add an estimated **146.45 seconds at 180 wpm** over the required route at that same reading speed, estimated at **420.50 seconds**. The careful route includes choosing to reassure ORI, a two-second decision and a native 0.62-second dice reveal. It uses a fixed d20 face of 15 for a reproducible pass through the game’s real check UI. A failed check would take a different dialogue path. Alternate resolutions, return visits, and reference menus can also be explored and have no single additive duration.

<!-- playtime-followup:start -->
<!-- playtime-followup:end -->
