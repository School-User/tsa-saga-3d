import assert from 'node:assert/strict';
import { balanceWeighings, crateTurns, pipReplies, quarrelReplies,
  captainCheck, fernCheck, reedCheck, vaultCheck } from './playtime-solutions.mjs';

const overlay = '#overlay button';
const crate = '.crate-rack button';

export async function optionalVisit(room, { inspect, approach, choose }, hotspots) {
  for (const item of hotspots.filter(entry => entry.text && !entry.puzzle && !entry.exit)) {
    await inspect(item.id);
  }
  if (room === 4) await dialogue('c2_radio1', reedCheck, { approach, choose });
  if (room === 7) await dialogue('c3_fern1', vaultCheck, { approach, choose });
}

export async function roomDialogue(room, controls) {
  const { approach, choose } = controls;
  if (room === 5) {
    await approach('c2_pip', 'dialogue');
    for (const reply of pipReplies) await choose(reply);
  } else if (room === 6) {
    await dialogue('c2_talk3', captainCheck, controls);
  } else if (room === 8) {
    await approach('c3_quarrel', 'dialogue');
    for (const reply of quarrelReplies) await choose(reply);
  } else if (room === 9) {
    await dialogue('c3_talk3', fernCheck, controls);
  }
}

async function dialogue(hotspot, { id, die, replies }, { approach, choose }) {
  await approach(hotspot, 'dialogue');
  await choose(id, { die });
  for (const reply of replies) await choose(reply);
}

export async function solveLaterPuzzle(room, { click, setValue, evaluate, puzzleConfirmation }, optional) {
  const move = { move: true };
  const first = { move: true, understand: true };
  if (room === 4) {
    if (optional) {
      await click(overlay, 'Step through', { understand: true });
      for (let cue = 1; cue < 5; cue++) await click(overlay, 'Next cue');
      await click(overlay, 'Enter sequence');
    } else {
      await click(overlay, 'Watch', { understand: true });
      // 350 ms lead-in plus five 700 ms cues for the Mechanic.
      await puzzleConfirmation('!document.querySelector("#overlay [aria-label^=Pad]").disabled', 3850);
    }
    for (const pad of [3, 1, 4, 2, 3]) await click(overlay, 'Pad ' + pad, move);
  } else if (room === 5) {
    let firstTurn = true;
    for (const [left, right] of balanceWeighings) {
      const labels = await evaluate(`[...document.querySelectorAll(${JSON.stringify(crate)})].map(button => button.textContent)`);
      assert.equal(labels.length, 9);
      for (const [index, label] of labels.entries()) {
        const turns = crateTurns(index, label, left, right);
        for (let turn = 0; turn < turns; turn++) {
          await click(crate, undefined, { index, move: true, understand: firstTurn });
          firstTurn = false;
        }
      }
      await click(overlay, 'Weigh', move);
    }
    await click(overlay, 'Name the heavy crate', move);
    await click('#overlay button[aria-label="Crate 7"]', '7', move);
    await click(overlay, 'Confirm', move);
  } else if (room === 6) {
    await setValue('#tuner-freq', '6', first);
    await setValue('#tuner-phase', '3', move);
    await click(overlay, 'Lock in', move);
  } else if (room === 7) {
    for (const index of [0, 6, 9, 15]) {
      await click('.vault-lock', undefined, { index, move: true, understand: index === 0 });
    }
  } else if (room === 8) {
    for (const [index, place] of ['Vine', 'Moss', 'Dome'].entries()) {
      await setValue('#assign-' + index, place, index === 0 ? first : move);
    }
    await click(overlay, 'Check', move);
  } else if (room === 9) {
    const tiles = [3, 6, 5, 3, 8, 2, 3, 5, 6, 8, 5, 6];
    for (const [step, tile] of tiles.entries()) {
      await click('.pipe-section', String(tile), step === 0 ? first : move);
    }
  }
  await puzzleConfirmation();
}
