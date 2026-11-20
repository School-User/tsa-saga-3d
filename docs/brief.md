# Drift Signal 3D — brief

Remake of the 2D TSA game "Drift Signal: The Long Quiet" (source: ~/Projects/tsa-saga, live at school-user.github.io/tsa-saga)
as a 3D, Dungeons & Dragons-style RPG for the TSA Video Game Design event.

Hard rules (TSA + owner):
- NO combat, weapons or violence. Encounters are solved by talking, skill checks, and puzzles. Calm tone.
- NO audio of any kind. NO network at runtime. Runs from GitHub Pages in a browser.
- Three.js vendored locally (lib/three.module.min.js + LICENSE), no CDN, no other libraries.
- Low-poly primitives built in code (no external 3D models). Reuse the existing 2D art only as UI/illustration.
- Small readable files; a high-school student must be able to explain every file in an interview.
- No real names anywhere in the repo.

D&D elements:
- d20 + stat modifier skill checks vs a DC, shown with an on-screen dice roll (advantage/disadvantage from choices).
- Character creation: pick a background/class (e.g. Engineer, Diplomat, Scientist) that sets starting stats.
- A party: companions (ORI, the Harbor pilot, Fern) who give bonuses/advantage on certain checks and have short banter.
- Narrator "Game Master" voice for room/scene text. Branching choices with consequences, XP, levels, inventory of items.
- Same story: 3 chapters (Meridian, Harbor Nine, Verdant), 9 levels, finale "The Long Quiet".
- The 9 existing puzzles stay, shown as 2D overlay panels.
- Third-person or first-person walkable 3D rooms; hotspots are 3D objects you walk to and press E / click.
- Keyboard + mouse, and fully keyboard accessible menus.
