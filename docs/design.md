# Drift Signal: The Long Quiet

The player is a fleet Navigator. A signal leads from the drifting survey ship Meridian to Harbor Nine, where three pilots need a way into port, and then to Verdant, an ark carrying the last seeds of a lost world. Each chapter ends with a decision about what the Navigator will do for the people or intelligences they met.

Play alternates between walking a small room, reading the Game Master’s account, inspecting objects, working a console, and talking through a decision. The Game Master describes what the Navigator can see and what changes after an action. The player decides what matters. Urgency comes from the scene and its visible state. Exploration and conversation give the player time to read and think. Every encounter is peaceful and is resolved by investigation, conversation or a puzzle.

The game runs on GitHub Pages as a static browser game with locally vendored Three.js and its license. Use simple low-poly geometry for every 3D object, with local 2D illustrations on chapter cards if available. The game is silent, including its dice, radio, ship systems and menus. All radio and companion lines appear as text. Runtime uses local files served with the game and local save storage. All character names are fictional and the Navigator uses a title.

## Character creation and checks

Choose a single class with an associated background. Each starts with nine points across Engineering (ENG), Science (SCI) and Empathy (EMP). The selection shows the scores, their modifiers and the background description before the player confirms.

| Class | Background | ENG | SCI | EMP |
| --- | --- | ---: | ---: | ---: |
| Engineer | Survey Fleet Mechanic | 5 | 2 | 2 |
| Diplomat | Waystation Liaison | 2 | 2 | 5 |
| Scientist | Field Researcher | 2 | 5 | 2 |

A checked reply shows its stat, difficulty class (DC) and any situational or companion aid before selection. Roll a d20, add the chosen score minus 3, then add the applicable flat companion bonus. A total equal to or above the DC passes. Every die face uses the same rule, including 1 and 20. A starting score of 5 gives +2 and a score of 2 gives −1. DC 12 covers a supported explanation or a negotiation with room for questions. DC 13 covers reassurance at a first meeting, DC 14 covers Fern’s seed release, and DC 15 covers simultaneous docking.

- Normal roll uses one d20. Advantage rolls two and keeps the higher. Disadvantage rolls two and keeps the lower. Multiple sources of the same kind count once. If both kinds apply, use one die.
- In Life Support, reading the maintenance log gives advantage on the version-header reply. Offering a memory repair while the air ring is still unstable imposes disadvantage. The player can work the valves first to avoid it.
- Each checked reply gets one result per run, keyed by its choice ID. On a return to that reply, show the saved result and follow the same branch if selected. Checks consume only the opportunity to make a fresh roll. The player can put off an unrolled choice while they look for evidence or complete another task.
- Show each die value, the kept value, modifiers, aid and DC, then the total and result. For example, a Navigator with ENG 5 and ORI’s +1 who rolls 7 with a steady air ring gets 10 against DC 12 and lands on ORI’s request for more time. Continue advances into that branch. Reduced-motion mode shows the result immediately. A text summary conveys everything the dice graphic does.
- Lab permission, manifest clearance and settling the botanists’ disagreement have direct, no-roll replies. Failures lead into those routes. Contact with the Veil offers all three outcomes through conversation alone. Docking all three ships at once and releasing the seeds require a successful check. If either fails, two no-roll outcomes are still open. Confirm an ending in dialogue, close the channel, then use the exit.

## Party

Companion presence and eligible aid are shown in the party panel. Aid applies automatically to the listed check when its conditions hold. Room banter can be read through the panel and occasional scene prompts. Each line is available when its companion is present and any required flag is set. Banter carries no check, XP or progression requirement.

| Companion | Joins | Grants |
| --- | --- | --- |
| ORI | Aboard Meridian from the start. Travels with the Navigator by text channel. | +1 to offering the memory-core repair in Life Support. Advantage on reassuring ORI about opening the lab if the Navigator calmed ORI on the Cryo Deck (`c1_ori_calm`). |
| Pilot Tamsin | Helps remotely from the Reed once the docking ring is lit (`c2_ring_lit`). | +1 to coordinating all three dockings. Calming Tamsin at the ring (`c2_tamsin_calm`) grants advantage on that same check. |
| Fern | Joins the party’s text channel on reaching the Seed Vault (room 7). | +1 to reading the rota headings with the botanists. Calming Fern in the Seed Vault (`c3_fern_calm`) grants advantage when proposing seed release. |

## XP, rank and records

Room numbers track the route from 1 to 9. Character rank starts at 1 and rises once per 45 XP, capped at rank 9 at 360 XP. Each new rank gives one point to spend on ENG, SCI or EMP, up to a score of 9. Bank points until the player is back on a room screen. The HUD shows rank, XP, next-rank progress and any banked points.

Solve a puzzle for 30 XP. The eleven inspection hotspots grant 5 XP each. Optional reassurance checks grant 15 XP. Lab permission grants 25 XP on a check or 10 XP for waiting. Manifest clearance and calming the botanists each grant 20 XP on a check or 10 XP on the no-roll route. A Veil approach grants 20 XP on a pass. Coordinating all three dockings or convincing Fern to release the seeds grants 25 XP on a pass. Each award is paid once per ID. A failed check gives 0 XP and taking its fallback can earn the fallback award. The nine solves and the three no-roll social routes yield 300 XP before inspections, enough for rank 7. A run can finish at any rank and retain XP beyond the rank cap.

The journal groups entries by chapter and room. Record the eleven inspections and nine puzzles once per hotspot. A bypass fills the puzzle’s journal entry with its own account and grants 0 XP. The end card reports journal coverage out of 20. Inventory is a read-only list of evidence, records and route items. Recording the same item again leaves one copy.

| Item | Acquisition | Use |
| --- | --- | --- |
| Navigator badge | Inspect the open cryo pod. | Identifies the Navigator and records the handwritten note. |
| Maintenance log | Read the Life Support log. | Points to the valve housing and grants advantage on the lab’s SCI version-header check. |
| Veil’s star chart | Welcome the Veil or save its recording, then close the channel. | Records Meridian’s route to Harbor Nine. |
| Veil recording | Confirm the recording with the Veil. | Preserves its words and patterns for the fleet. |
| Route plotted from pulses | Say goodbye to the Veil and close the channel. | Records the alternate route to Harbor Nine. |
| Cargo manifest | Pip shares the list. | Carries Pip’s tentative clue about crate seven. The lift still requires the weight flag. |
| Verdant’s relay message | Close the captains’ channel after confirming a docking plan. | Records Verdant’s distress call and coordinates. |
| Greenhouse rota | Complete or bypass the greenhouse panel. | Keeps the final assignment where the player can refer to it. |

## Walking, interaction and screens

Use an elevated third-person camera with a fixed north-up orientation. Walk with WASD or the arrow keys. The Navigator turns in the direction of movement. Within roughly 1.5 grid units of a hotspot’s reachable side, the HUD shows its label and the E prompt. Press E for the nearest eligible target, or click or tap a visible target. A distant target uses the same guided walk as Room objects. The player can approach a locked door and read what it needs. Each hotspot takes one action to open once the Navigator is nearby.

The room HUD shows chapter, global room number, room name, stats, rank and goals. It provides Journal, Inventory, Party, Room objects and Pause. Use Tab or Shift+Tab to move between controls and Enter or Space to activate them. The Room objects list gives each hotspot’s name, compass direction and lock state. Activating an entry guides the Navigator along the room’s walking path to its reachable side and presents the same interaction. This provides a keyboard and screen-reader route through each room. Text and shapes carry all the information shown by accent colours. Puzzle panels retain their keyboard controls. When a panel opens, suspend movement, move focus to the panel heading and keep focus inside. On close, return focus to the opener or room heading. Escape closes a panel through its Back action or opens Pause from the room. Dialogue choices and dice results remain visible until the player advances.

Screen order is Title → class selection → chapter intro → room → chapter complete → next chapter intro. During a room the player can open dialogue, inspect an object, use a puzzle overlay or read from the HUD. Every exit inside a chapter leads to the next room. The three chapter exits lead to a chapter-complete card with the chosen ending, route text and current rank. Continue on Verdant’s completion card opens **The Long Quiet**. The finale joins one epilogue sentence from each chapter in order, using the nine authored variants, and shows final stats, rank, XP and journal coverage. The finale uses Verdant’s chapter illustration. Play again offers a fresh run after confirming the save reset.

The title has Continue, New game and a list of reached chapters. New game asks before replacing an existing run. Continue restores the saved room or card. Chapter select takes the Navigator to a reached chapter’s opening card using the current character, items, flags and awards. Completed objectives and decisions remain recorded on a revisit. Visiting a chapter intro unlocks that chapter in Chapter select even before entering its first room. Save locally under a separate 3D key after state-changing actions and screen transitions. Report when saving is unavailable. Preserve each in-progress dialogue’s cursor, cached roll result and any pending result step so the player can return to the same line. A reopened unfinished puzzle starts from its initial board. The save tracks completed puzzle flags and outcomes. The first intro opens with the chapter number, title, tagline, illustration if available, intro text and Begin chapter. Use blue for Meridian, amber for Harbor Nine and green for Verdant, with high-contrast labels and an immediate transition in reduced-motion mode.

## Puzzle panels

Use the existing nine puzzle rules in 2D overlays tied to the in-world consoles. Higher scores reveal the existing hints or aids. The room mesh shows context and resolved state while the panel owns moves and validation. Back returns without advancing the objective. The source bypass thresholds are listed below. Completing or bypassing sets the same original puzzle flag. A bypass uses the authored room line and resolves the same visual state as a solve. Each final conversation stays behind its puzzle flag, even after opening the room early through a chapter revisit.

| Room | Panel and player action | Score aid | Bypass unlock |
| --- | --- | --- | --- |
| 1 | `power` — rotate conductors in the 5×5 grid so the source reaches the door. | ENG 5 marks conductors on the live route. | 12 rotations or 3 minutes. |
| 2 | `valves` — deduce and enter the order of four valves. | SCI 4 explains how to treat A and D as a single block. | 3 incorrect sequences. |
| 3 | `cipher` — derive a backward shift from a known marker and transmit it. | SCI 4 gives a second marker without alphabet wraparound. | 3 rejected transmissions. |
| 4 | `memory` — replay or step through five cues, then repeat them on four numbered and shaped pads. | SCI 4 slows continuous playback. | 3 incorrect entries. |
| 5 | `scales` — compare nine crates in up to three weighings, then name the heaviest. | SCI 4 suggests weighing three against three. | 3 incorrect identifications. |
| 6 | `tuner` — adjust frequency and phase and confirm at peak signal strength. | Everyone gets a numerical readout. ENG 4 gives frequency direction, and a successful Veil signal check reveals the phase. | 3 unsuccessful locks. |
| 7 | `lights` — toggle each selected lock and its orthogonal neighbours until all sixteen are dark. | SCI 4 says four presses suffice. | 20 presses. |
| 8 | `assign` — assign three botanists to distinct greenhouses using the rota clues. | SCI 4 points to Cy’s two constraints. | 3 incorrect rotas. |
| 9 | `sliding` — slide the eight numbered pipe sections into order, with the socket last. | ENG 4 says twelve moves suffice. | 40 moves. |

## Room layouts and progression

Coordinates are rough `(x,z)` centres on a one-metre floor grid, with +x east, −z north and y up. Each room has four perimeter walls or glass partitions around the listed bounds. The Navigator starts facing north at the listed spawn. The north exit in one room leads to the spawn of the next room or chapter. Maintain a clear north–south route and a reachable spot on the inward side of each wall object. Leave at least 1.5 metres of clear aisle beside freestanding consoles. Doors, panels and talk points have distinct labels and silhouettes. Use a static emissive strip or printed marker to show availability, with text specifying what is locked or complete.

Listed hotspot IDs are prefixed by chapter in the JS, so `p_power` below is `c1_p_power`. All flags below are saved exactly as written. A puzzle and its nearby scenery can share a prop assembly, but the puzzle, dialogue and exit targets have independent interaction zones.

### Chapter 1 — Meridian

**Room 1 · Cryo Deck** • bounds x −6 to 6, z −6 to 6 • spawn (0, 4)

| Object | (x,z) | Interaction |
| --- | --- | --- |
| Open cryo pod with badge recess | (−2, 4) | `badge` inspection. |
| Six closed pods along the two sides | (−4, 2), (−4, 0), (−4, −2), (4, 2), (4, 0), (4, −2) | `look` inspection targets the nearest west pod, with the rest as scenery. |
| ORI text terminal | (3, 4) | `ori1` dialogue. Optional reassurance sets `c1_ori_calm`. |
| Cryo power console | (−2, −4) | `p_power` opens `power`. |
| Pressure door | (0, −6) | `door1` exit requires `c1_power_on`. |

**Room 2 · Life Support** • bounds x −6 to 6, z −6 to 6 • spawn (0, 4)

| Object | (x,z) | Interaction |
| --- | --- | --- |
| Gauge stack | (−4, 2) | `gauges` inspection. |
| Valve manifold with wheels A to D | (−4, −2) | `p_valves` opens `valves` and sets `c1_air_ok`. |
| Wall pipes and pressure ring | (−5, 0) through (−5, −4) | Scenery. Needle and pipes gain steady status indicators after the puzzle. |
| Maintenance shelf | (4, 3) | `log2` inspection. |
| ORI terminal | (4, −3) | `lab` dialogue sets `c1_lab_open`; either objective may be completed first. |
| Lab pressure door | (0, −6) | `door2` exit requires both `c1_air_ok` and `c1_lab_open`. |

**Room 3 · The Signal** • bounds x −7 to 7, z −6 to 6 • spawn (0, 4)

| Object | (x,z) | Interaction |
| --- | --- | --- |
| Glass dome ribs and distant red star | dome rim; star beyond (0, −12) | Scenery. |
| Pulse monitor | (−4, −2) | `listen` inspection presents the timing visually. |
| Decoder desk | (−4, 2) | `p_cipher` opens `cipher` and sets `c1_decoded`. |
| Reply terminal | (4, −2) | `talk` becomes actionable when `c1_decoded` is set. |
| Navigation console | (0, −4) | `finish` chapter exit requires `c1_contacted`. |

The Veil may come aboard (`c1_ending_peace`), give permission to carry a recording (`c1_ending_study`), or remain alone to keep broadcasting (`c1_ending_quiet`). The SCI reply can also set `c1_knows_signal`. It gives a phase clue at the Harbor Nine tuner and carries no gate. The ending confirmation is followed by closing the channel to set `c1_contacted`. The first two outcomes bring the Veil’s chart. The third plots the route from pulse timing, reflected on the Meridian completion card and Harbor Nine intro.

### Chapter 2 — Harbor Nine

**Room 4 · Docking Ring** • bounds x −6 to 6, z −6 to 6 • spawn (0, 4)

| Object | (x,z) | Interaction |
| --- | --- | --- |
| Ring window and three distant ships | (0, −6); ships beyond window | `look1` inspection at the sill (0, −4). |
| Four-pad control desk | (−3, −1) | `p_memory` opens `memory` and sets `c2_ring_lit`. |
| Radio text display | (3, 1) | `radio1` dialogue. Optional reassurance sets `c2_tamsin_calm`. |
| Ring braces and lamps | (−5, −3), (5, −3) | Scenery. Lamps switch on with `c2_ring_lit`. |
| Cargo stair hatch | (4, −5) | `door1` exit requires `c2_ring_lit`. |

**Room 5 · Cargo Bay** • bounds x −9 to 9, z −7 to 7 • spawn (0, 5)

| Object | (x,z) | Interaction |
| --- | --- | --- |
| Nine identical numbered crates | x ∈ {−7, −5, −3}, z ∈ {0, 2, 4} | `look2` inspection on the nearest crate at (−3, 4). Number each row left to right, near to far. |
| Dock robot Pip | (4, 1) | `pip` dialogue releases `c2_manifest`. |
| Manifest terminal | (6, 1) | Scenery with clearance status, beside Pip. |
| Brass balance scale | (−4, −3) | `p_scales` opens `scales` and sets `c2_cargo_ok`. |
| Lifting rig | (4, −3) | Scenery with crate weight status. |
| Tower lift doors | (0, −7) | `door2` exit requires both `c2_cargo_ok` and `c2_manifest`. |

**Room 6 · Beacon Tower** • bounds x −6 to 6, z −6 to 6 • spawn (0, 4)

| Object | (x,z) | Interaction |
| --- | --- | --- |
| Nebula glazing and three bay lights | bays beyond (−4, −6), (0, −6), (4, −6) | Scenery. Show the confirmed bay sequence when the channel closes. |
| Static monitor | (−4, 2) | `look3` inspection. |
| Frequency and phase desk | (−4, −2) | `p_tuner` opens `tuner` and sets `c2_beacon_tuned`. |
| Captains’ channel station | (4, −2) | `talk3` becomes actionable when `c2_beacon_tuned` is set. |
| All-clear stand | (0, −4) | `finish3` chapter exit requires `c2_contacted`. |

The captains dock together on three distinct approaches (`c2_ending_all`), take the Halcyon first for medical care (`c2_ending_medic`), or dock in arrival order starting with the Reed (`c2_ending_fair`). Confirm the plan and close the channel for `c2_contacted`. Harbor Nine then relays Verdant’s distress call.

### Chapter 3 — Verdant

**Room 7 · Seed Vault** • bounds x −6 to 6, z −6 to 6 • spawn (0, 4)

| Object | (x,z) | Interaction |
| --- | --- | --- |
| Frosted seed cabinets | (−4, 2), (−4, −1), (4, −1) | `look1` inspection on the cabinet at (−4, 2). |
| Fern’s garden terminal | (4, 2) | `fern1` dialogue. Optional reassurance sets `c3_fern_calm`. |
| Sixteen-light vault panel | (2, −5) | `p_lights` opens `lights` and sets `c3_vault_open`. |
| Round vault door | (0, −6) | `door1` exit requires `c3_vault_open`. |

**Room 8 · The Dome** • bounds x −10 to 10, z −8 to 8 • spawn (0, 6)

| Object | (x,z) | Interaction |
| --- | --- | --- |
| Dome, Vine and Moss greenhouse shells | (−6, −3), (0, −3), (6, −3) | Scenery. Keep the exit route open between Dome and Vine. |
| Notice board | (−5, 3) | `look2` inspection. |
| Ana and Cy | (3, 3) and (5, 3) | `quarrel` shared dialogue at (4, 3) sets `c3_crew_calm`. Bo is offstage by the compost. |
| Rota work stand | (−2, 2) | `p_assign` opens `assign` and sets `c3_crew_set`. |
| Compost bins | (−8, 5) | Scenery. |
| Water room door | (−3, −8) | `door2` exit requires both `c3_crew_set` and `c3_crew_calm`. |

**Room 9 · Water Room** • bounds x −6 to 6, z −6 to 6 • spawn (0, 4)

| Object | (x,z) | Interaction |
| --- | --- | --- |
| Ceiling pipes and dry return window | pipes overhead; window at (−4, 2) | `look3` inspection at the window. |
| Numbered pipe frame | (−4, −2) | `p_sliding` opens `sliding` and sets `c3_water_flows`. |
| Fern’s water terminal | (4, −2) | `talk3` becomes actionable when `c3_water_flows` is set. |
| Feeder status lamp | (4, 2) | Scenery, with a flowing-water indicator after puzzle completion. |
| Departure hatch | (0, −6) | `finish3` chapter exit requires `c3_contacted`. |

The Navigator and Fern may release the seeds (`c3_ending_release`), store them for another world (`c3_ending_vault`), or replant the dome (`c3_ending_replant`). Confirm the plan and close the channel to set `c3_contacted`. On re-entry or during the exit shot, the ending can be reflected through the glass, with drifting seeds, sealed vault status or the replanting plan marked on Fern’s display.

## Story data contract

`js/story/classes.js` exposes `window.StoryClasses`. The three chapter files populate `window.Story[1]` through `window.Story[3]`. The chapters use global room IDs, explicit chapter-prefixed hotspot IDs, flags and rewarded choice IDs, and the unmodified puzzle registry keys. Node IDs are local to a dialogue. Room layouts live in this document.

- Chapters carry the introduction, any flag-matched intro variant, the ending cards and the transition text. Each ending supplies its own `epilogue` sentence. Setting an ending clears only the other ending flags of the same chapter. Closing each final conversation sets that chapter’s separate `contacted` flag.
- A room has an intro narrated by the Game Master, goals, hotspot entries and short optional banter. `needFlag` requires one flag, `needAll` checks all of its flags, and `notFlag` hides an exhausted conversation. Locked objects use `blockedText`. An in-progress dialogue can be resumed even if its latest reply set the flag that hides the hotspot. Show the saved line so the player can finish reading.
- Dialogue choices use `next` for a direct branch. For a checked choice, `check` contains `stat`, `dc`, `onPass` and `onFail`. Either result names the next node. `setFlag` and `xp` on that choice apply on a pass only. Optional `advantageWith` names an inventory item and `disadvantageUnless` names a flag. A choice without a destination closes the dialogue. A node without choices has a Done action.
- An inspection may grant an item by `giveItem`. Other items are acquired once when all stated conditions are true. `needFlag` requires its flag and `anyFlag` requires at least one in its list. A companion’s `needFlag` or `minLevel` gates joining, using the furthest room reached for `minLevel`. Each `aid` record names the choice it modifies and may require an additional flag.
