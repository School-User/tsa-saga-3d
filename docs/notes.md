# Running Drift Signal 3D

From the repository root, run `python3 -m http.server 8000` and open
`http://localhost:8000/`. The game uses local files, including its copy of
Three.js. Browser saves use `driftSignal3d.v1`.

Walk with WASD or the arrow keys. Press E to use an object within reach.
Click or tap an object to walk to it and interact. Choose **Room objects** to
reach any hotspot from the keyboard.
Escape backs out of a panel or opens Pause. If WebGL 2 is unavailable, use
**Room objects** to keep playing.

## Files

| File or folder | Contents |
| --- | --- |
| `index.html`, `css/style.css` | Game shell, HUD, cards, panels and responsive styling |
| `js/main.js` | Screen transitions and room, dialogue, puzzle and save actions |
| `js/state.js`, `js/checks.js`, `js/dialogue.js` | Progression, inventory, XP, d20 checks and dialogue branching |
| `js/story/` | Starting classes, chapter dialogue, flags, items, companions and epilogues |
| `js/world/` | Room layouts and meshes, camera, collision and guided walking |
| `js/puzzles/` | The nine original puzzle rules and controls, adapted as room overlays |
| `js/ui/` | Title, character creation, chapter cards, finale, HUD, panels and dialogue presentation |
| `assets/ch1/`, `assets/ch2/`, `assets/ch3/` | Local WebP chapter illustrations. The finale uses Verdant’s illustration. |
| `lib/` | Vendored Three.js modules and license |
| `tests/` | Dice math, saves, chapter revisits, room gates and paths, XP and rank, and all nine puzzle solutions through their controls |
| `tools/chromium.mjs`, `tools/e2e.mjs` | Local HTTP server, DevTools connection and nine-room browser playthrough |

## Tests

```sh
node tests/core.test.js
find js lib tests tools -type f \( -name '*.js' -o -name '*.mjs' \) -exec node --check {} \;
node tools/e2e.mjs
```

The browser test uses Node 22 or newer and a `chromium` executable on PATH. It
needs permission to start Chromium and open loopback ports for HTTP and DevTools.
It checks the keyboard route to a puzzle, samples the WebGL canvas in every room,
restores a pending dialogue roll, and plays to the finale with the test hook.
It checks browser errors and writes `room-1.png`, `room-5.png`, `room-9.png`
and `finale.png` to `tools/shots/`.

The test hook is available only when the URL includes `?test=1`.
