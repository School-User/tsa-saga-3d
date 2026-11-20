# Running Drift Signal 3D

From the repository root, run `python3 -m http.server 8000` and open
`http://localhost:8000/`. The game uses local files, including its copy of
Three.js. Browser saves use `driftSignal3d.v1`.

Walk with WASD or the arrow keys. Press E to use an object within reach.
Click or tap an object to walk to it and interact. Choose **Room objects** to
reach any hotspot from the keyboard. The Cryo Deck gives directions to the first
console. Open **How to play** from any room to review movement, skill checks and
spending rank points.
Escape backs out of a panel or opens Pause. If WebGL 2 is unavailable, use
**Room objects** to keep playing.

The original ambient soundtrack is generated in code with the Web Audio API.
It starts at low volume after a click or keypress and crossfades between the
title, chapter themes and finale. Use **Music** and **Volume** on the title
screen or in Pause. Pause lowers the music until you resume, and the browser
saves your music preference and volume separately from the game save.

## Files

| File or folder | Contents |
| --- | --- |
| `index.html`, `css/` | Game shell, HUD, cards, panels and responsive styling |
| `js/main.js` | Screen transitions and room, dialogue, puzzle and save actions |
| `js/state.js`, `js/checks.js`, `js/dialogue.js` | Progression, inventory, XP, d20 checks and dialogue branching |
| `js/story/` | Starting classes, chapter dialogue, flags, items, companions and epilogues |
| `js/world/` | Room layouts, low-poly characters, repair set pieces, Verdant finale, camera and guided walking |
| `js/puzzles/` | The nine original puzzle rules and controls, adapted as room overlays |
| `js/audio/` | Original note patterns, oscillator voices and soundtrack sequencer |
| `js/ui/` | Title, character creation, chapter cards, finale, HUD, panels and dialogue presentation |
| `assets/ch1/`, `assets/ch2/`, `assets/ch3/` | Local WebP chapter illustrations. Verdant’s illustration is also the graphics fallback for the finale. |
| `lib/` | Vendored Three.js modules and license (upstream files) |
| `tests/` | Dice math, saves, chapter revisits, room gates and paths, XP and rank, all nine puzzle controls, evidence unlocks, 3D state changes and music |
| `tools/chromium.mjs`, `tools/e2e.mjs` | Local HTTP server, DevTools connection and nine-room browser playthrough |

## Tests

```sh
node --test tests/*.test.js
find js lib tests tools -type f \( -name '*.js' -o -name '*.mjs' \) -exec node --check {} \;
node tools/e2e.mjs
```

The browser test uses Node 22 or newer and a `chromium` executable on PATH. It
needs permission to start Chromium and open loopback ports for HTTP and DevTools.
It checks the keyboard route to a puzzle, tests the phone HUD and modal focus,
and completes the power grid and freight balance through their own controls.
It uses the test hook for the seven other puzzles, samples the WebGL canvas in
every room, restores a pending dialogue roll and plays to Verdant’s 3D finale.
It checks browser errors and writes `room-1.png`, `room-5.png`, `room-9.png`
and `finale.png` to `tools/shots/`.

The test hook is available only when the URL includes `?test=1`. That mode
forces music off and skips creating an AudioContext.

## Round 2 play details

- The archived protocol in the Life Support maintenance log opens an additional
  reply with ORI. It grants the same XP as waiting with ORI and still requires
  stable pressure to use the lab door.
- In the Signal Laboratory, the pulse monitor has the known marker pair. Inspections carry
  it into the decoder with the player. The decoder also has a keyboard-accessible
  copy of the calibration plate.
- Repairs drive the conduit feed, docking lamps, beacon mast, greenhouse lamps,
  door panels and water channel. Bypasses set the same repair flags. Saved
  repairs and ending choices restore the appropriate scene on Continue.
- Reduced motion holds character bodies, ring lights, the beacon and water highlights steady and reveals
  the d20 result immediately. The finale text and caption remain visible with
  the chapter illustration if WebGL 2 is unavailable.
