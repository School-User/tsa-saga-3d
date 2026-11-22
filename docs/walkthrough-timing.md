# Drift Signal walkthrough timing

Run `node tools/playtime.mjs --all` from the repository on a machine with Chromium, Node with a global WebSocket, and loopback access. It updates the results section after all three profiles reach the finale. Run `node tools/playtime.mjs` for the original Meridian timing report.

## Method

- All three runs start with a fresh save and choose the first Mechanic Ideal and Bond. They solve all nine puzzles, complete the required conversations, and read through to the observation-deck finale. The route welcomes the Veil aboard, opens all bays at Harbor Nine, and replants the dome.
- Average reads new visible text at **230 wpm**. Careful reads at **180 wpm** and includes all inspection hotspots, the optional ORI, Reed and Fern conversations, companion chatter, the step-by-step docking cues, and the replies in each chapter recap. Each conversation follows one branch per run.
- Both reading profiles allow at least 1.5 seconds when new text appears, 10 seconds to understand each puzzle, 2.5 seconds per puzzle move, and two seconds per d20 choice. Speedrunner uses half a second per UI action and skips the reading delays. Fixed dice make the selected branches repeatable. Test mode silences audio and displays d20 results immediately.
- **Paced** time uses those delays, the room-by-room guided route at seven units per second, and the puzzles’ native waits. The graphics fallback allows two seconds per object approach. **Browser** time measures elapsed time during the scripted run, including automation and rendering overhead. The `mm:ss` values round to the nearest second.
- The first-image clock starts when the runner detects the visible, loaded title artwork. Setup includes character creation and the Meridian intro. Each room ends on arrival at the next room or chapter completion card. Chapter subtotals sum the three rooms. The chapter cards and later intros have their own rows. The full run ends after the finale art is available and the profile’s finale reading time has elapsed.

For the TSA check, rooms 1–3 must take more than **3:00** from the first image or sound to the Chapter 1 completion card. A run under 3:00 incurs a **five-point deduction**. The title artwork starts the clock in this silent run.

## Results

<!-- walkthrough-results:start -->
| Segment | Average paced | Average browser | Speedrunner paced | Speedrunner browser | Careful paced | Careful browser |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Title screen | 4.96 s (00:05) | 4.96 s (00:05) | 0.00 s (00:00) | 0.00 s (00:00) | 6.33 s (00:06) | 6.33 s (00:06) |
| Setup | 73.83 s (01:14) | 73.92 s (01:14) | 3.00 s (00:03) | 3.05 s (00:03) | 94.33 s (01:34) | 94.42 s (01:34) |
| Room 1 | 127.72 s (02:08) | 128.18 s (02:08) | 9.29 s (00:09) | 12.02 s (00:12) | 247.00 s (04:07) | 246.98 s (04:07) |
| Room 2 | 138.57 s (02:19) | 140.41 s (02:20) | 10.39 s (00:10) | 14.21 s (00:14) | 202.83 s (03:23) | 204.06 s (03:24) |
| Room 3 | 116.28 s (01:56) | 116.08 s (01:56) | 9.14 s (00:09) | 11.04 s (00:11) | 168.83 s (02:49) | 167.99 s (02:48) |
| **Chapter 1 subtotal (rooms 1–3)** | 382.57 s (06:23) | 384.67 s (06:25) | 28.82 s (00:29) | 37.26 s (00:37) | 618.67 s (10:19) | 619.03 s (10:19) |
| Chapter 1 completion card | 19.30 s (00:19) | 20.26 s (00:20) | 0.50 s (00:01) | 0.51 s (00:01) | 29.00 s (00:29) | 30.51 s (00:31) |
| Chapter 2 intro | 20.35 s (00:20) | 20.38 s (00:20) | 0.50 s (00:01) | 0.52 s (00:01) | 26.00 s (00:26) | 26.04 s (00:26) |
| Room 4 | 102.20 s (01:42) | 102.62 s (01:43) | 12.17 s (00:12) | 14.19 s (00:14) | 231.33 s (03:51) | 231.20 s (03:51) |
| Room 5 | 234.67 s (03:55) | 238.93 s (03:59) | 23.18 s (00:23) | 29.10 s (00:29) | 295.33 s (04:55) | 298.60 s (04:59) |
| Room 6 | 123.65 s (02:04) | 123.77 s (02:04) | 10.14 s (00:10) | 12.00 s (00:12) | 178.83 s (02:59) | 178.31 s (02:58) |
| **Chapter 2 subtotal (rooms 4–6)** | 460.52 s (07:41) | 465.31 s (07:45) | 45.49 s (00:45) | 55.29 s (00:55) | 705.50 s (11:45) | 708.12 s (11:48) |
| Chapter 2 completion card | 20.09 s (00:20) | 20.68 s (00:21) | 0.50 s (00:01) | 0.51 s (00:01) | 27.00 s (00:27) | 27.79 s (00:28) |
| Chapter 3 intro | 17.22 s (00:17) | 17.26 s (00:17) | 0.50 s (00:01) | 0.53 s (00:01) | 22.00 s (00:22) | 22.06 s (00:22) |
| Room 7 | 73.02 s (01:13) | 73.35 s (01:13) | 6.79 s (00:07) | 9.06 s (00:09) | 160.67 s (02:41) | 160.70 s (02:41) |
| Room 8 | 117.92 s (01:58) | 122.34 s (02:02) | 10.61 s (00:11) | 15.86 s (00:16) | 160.50 s (02:41) | 165.10 s (02:45) |
| Room 9 | 160.43 s (02:40) | 161.69 s (02:42) | 15.39 s (00:15) | 19.15 s (00:19) | 217.00 s (03:37) | 217.08 s (03:37) |
| **Chapter 3 subtotal (rooms 7–9)** | 351.38 s (05:51) | 357.39 s (05:57) | 32.79 s (00:33) | 44.07 s (00:44) | 538.17 s (08:58) | 542.88 s (09:03) |
| Chapter 3 completion card | 18.26 s (00:18) | 18.28 s (00:18) | 0.50 s (00:01) | 0.52 s (00:01) | 24.33 s (00:24) | 24.57 s (00:25) |
| Finale | 14.87 s (00:15) | 15.16 s (00:15) | 0.00 s (00:00) | 0.31 s (00:00) | 19.00 s (00:19) | 19.28 s (00:19) |
| **Total from first image** | 1383.34 s (23:03) | 1398.28 s (23:18) | 112.60 s (01:53) | 142.56 s (02:23) | 2110.33 s (35:10) | 2121.02 s (35:21) |
| **Total from room 1** | 1304.55 s (21:45) | 1319.39 s (21:59) | 109.60 s (01:50) | 139.51 s (02:20) | 2009.67 s (33:30) | 2020.26 s (33:40) |

### TSA three-minute check

| Pace | First image to Chapter 1 complete (paced) | From first image (browser) | Rooms 1–3 alone (browser) |
| --- | --- | --- | ---: |
| Average player | 461.35 s (07:41) · PASS | 463.56 s (07:44) · PASS | 384.67 s (06:25) |
| Speedrunner | 31.82 s (00:32) · FAIL (−5 points) | 40.31 s (00:40) · FAIL (−5 points) | 37.26 s (00:37) |
| Careful reader | 719.33 s (11:59) · PASS | 719.79 s (12:00) · PASS | 619.03 s (10:19) |
<!-- walkthrough-results:end -->

## Static walkthrough findings

| Room | Finding | Source |
| --- | --- | --- |
| 1 · Cryo Deck | The opening directions call the console **Power Conduits**, while Room objects calls it **Repair the power grid**. Players switching to the list have to infer that these refer to the same object. | [js/ui/room.js:24](../js/ui/room.js#L24), [js/story/ch1.js:80](../js/story/ch1.js#L80) |
| 2 · Life Support | After a successful Cryo Deck check with ORI, Life Support still says the red needle is falling even after the valve repair. The ORI-aid narration takes precedence over the repaired-room text until the lab lock is cleared. | [js/story/ch1.js:96](../js/story/ch1.js#L96), [js/ui/room.js:40](../js/ui/room.js#L40) |
| 3 · Signal Laboratory | The decoder instructions depend on a D-to-W calibration pair that is behind a disclosure unless the player inspected the pulse monitor. Guessing the shift before opening it gives only generic mismatch feedback. The backward alphabet wrap is easy to count a step off. | [js/puzzles/cipher.js:17](../js/puzzles/cipher.js#L17), [js/puzzles/cipher.js:59](../js/puzzles/cipher.js#L59), [js/story/ch1.js:177](../js/story/ch1.js#L177) |
| 4 · Docking Ring | The replay advances every 0.7 seconds for the Mechanic, and one wrong entry clears the whole sequence. **Step through** offers more time, but it takes a separate **Enter sequence** action after the fifth cue before the pads respond again. | [js/puzzles/memory.js:45](../js/puzzles/memory.js#L45), [js/puzzles/memory.js:168](../js/puzzles/memory.js#L168), [js/puzzles/memory.js:186](../js/puzzles/memory.js#L186) |
| 5 · Cargo Bay | The balance requires exactly three distinct weighings, even if the record already identifies a single crate. The pans retain their loads between weighings and moving a crate to the right from off takes two clicks. Repositioning crates can dominate this room. | [js/puzzles/scales.js:25](../js/puzzles/scales.js#L25), [js/puzzles/scales.js:127](../js/puzzles/scales.js#L127), [js/puzzles/scales.js:149](../js/puzzles/scales.js#L149) |
| 6 · Beacon Tower | A failed **Lock in** leaves a below-peak warning on screen while the player retunes, even after the separate strength label reaches 100%. The warning changes on the next lock attempt. | [js/puzzles/tuner.js:87](../js/puzzles/tuner.js#L87), [js/puzzles/tuner.js:120](../js/puzzles/tuner.js#L120) |
| 7 · Seed Vault | The lock instructions say a press flips the four locks beside it. Edge and corner presses affect fewer neighbors, and the copy leaves the orthogonal pattern implicit. **Reset** also clears the move counter used to unlock the bypass after 20 moves. | [js/puzzles/lights.js:20](../js/puzzles/lights.js#L20), [js/puzzles/lights.js:113](../js/puzzles/lights.js#L113), [js/puzzles/lights.js:141](../js/puzzles/lights.js#L141) |
| 8 · The Dome | The greenhouse form accepts duplicate assignments during entry. On **Check**, duplicates and clue violations produce the same generic failure, with no row identified for correction. Leaving also requires resolving Ana and Cy’s separate conversation. | [js/puzzles/assign.js:46](../js/puzzles/assign.js#L46), [js/puzzles/assign.js:86](../js/puzzles/assign.js#L86), [js/story/ch3.js:131](../js/story/ch3.js#L131) |
| 9 · Water Room | The numbered pipe board takes twelve moves on the shortest route. The Mechanic hint gives that count without giving a starting move. Players who repeatedly reset the board also reset the 40-move bypass counter. | [js/puzzles/sliding.js:1](../js/puzzles/sliding.js#L1), [js/puzzles/sliding.js:26](../js/puzzles/sliding.js#L26), [js/puzzles/sliding.js:122](../js/puzzles/sliding.js#L122), [js/puzzles/sliding.js:141](../js/puzzles/sliding.js#L141) |
| Finale · The Long Quiet | The finale displays journal coverage but offers only **Play again** and **Title**. A player who wants to find missed entries has to return to the title and pick a chapter. The coverage line gives a count without identifying the missing rooms or entries. | [js/ui/screens.js:167](../js/ui/screens.js#L167), [js/ui/screens.js:183](../js/ui/screens.js#L183), [js/ui/screens.js:51](../js/ui/screens.js#L51) |
