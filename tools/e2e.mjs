import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium, serve, until } from './chromium.mjs';
import { verifyCanvas } from './e2e-canvas.mjs';
import { powerRotations, balanceWeighings, crateTurns, pipReplies, quarrelReplies,
  captainCheck, fernCheck, reedCheck, vaultCheck } from './playtime-solutions.mjs';

const root = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '');
const shots = new URL('./shots/', import.meta.url);
await mkdir(shots, { recursive: true });

const server = await serve(root);
let browser;
try {
  browser = await chromium();
  await play(browser);
  assert.deepEqual(browser.errors, [], 'Browser console errors');
  console.log('Chromium passed all nine rooms, the finale, and the production debug-hook check.');
} finally {
  try {
    await browser?.close();
  } finally {
    server.close();
  }
}

async function play({ send, evaluate }) {
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `
    if (new URLSearchParams(location.search).get('test') === '1') {
      window.audioContextAttempts = 0;
      for (const key of ['AudioContext', 'webkitAudioContext']) {
        const Audio = window[key];
        if (Audio) window[key] = new Proxy(Audio, {
          construct(target, args) {
            window.audioContextAttempts++;
            return Reflect.construct(target, args);
          }
        });
      }
    }
  ` });
  await send('Page.navigate', { url: server.url + '/?test=1' });
  await until(() => evaluate('Boolean(window.__game)'));
  await send('Page.bringToFront');
  assert.equal(await evaluate(`document.querySelector('[aria-label="Music"]:disabled')
    ?.getAttribute('aria-pressed')`), 'false');

  // Use the same buttons a player does for screens and modal Back actions.
  const click = async (label, selector = 'button') => {
    assert.equal(await evaluate(`(() => {
      const control = [...document.querySelectorAll(${JSON.stringify(selector)})].find(button =>
        button.checkVisibility() && !button.disabled && button.textContent.trim() === ${JSON.stringify(label)});
      if (!control) return false;
      control.click();
      return true;
    })()`), true, `Missing button: ${label}`);
  };
  const back = () => click('Back', '#overlay button');
  const current = () => evaluate('window.__game.state');
  const interact = async id => {
    assert.equal(await evaluate(`window.__game.interact(${JSON.stringify(id)})`), true, id);
  };
  const choose = async id => {
    assert.equal(await evaluate(`window.__game.choose(${JSON.stringify(id)})`), true, id);
  };
  const key = async name => {
    const codes = { Tab: 9, Enter: 13, Escape: 27, ArrowRight: 39 };
    const event = { key: name, code: name, windowsVirtualKeyCode: codes[name] };
    const press = name === 'Enter' ? { type: 'keyDown', text: '\r', unmodifiedText: '\r' } : { type: 'rawKeyDown' };
    await send('Input.dispatchKeyEvent', { ...event, ...press });
    await send('Input.dispatchKeyEvent', { ...event, type: 'keyUp' });
  };
  const shot = async name => {
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    await writeFile(new URL(name + '.png', shots), Buffer.from(data, 'base64'));
  };

  for (const [index, id] of [[1, 'diplomat'], [2, 'scientist'], [0, 'engineer']]) {
    if (await current()) {
      await click('Pause', '#room-nav button');
      await click('Save and return to title', '#overlay button');
    }
    await click('New game');
    const reset = await evaluate('document.querySelector("#overlay").open');
    if (reset) await click('Choose a new background', '#overlay button');
    await evaluate(`document.querySelectorAll('.class-choice')[${index}].click();
      document.querySelectorAll('input[name="ideal"]')[1].click();
      document.querySelectorAll('input[name="bond"]')[1].click()`);
    await click('Confirm background');
    const created = await current();
    assert.equal(created.classId, id);
    assert.ok((await evaluate('document.querySelector(".read-aloud").textContent')).includes(created.personality.ideal));
    await click('Begin chapter');
    assert.equal(await evaluate('window.__game.roomId'), 1);
    assert.match(await evaluate('document.querySelector("#passive-clue").textContent'), /handrail/);
    if (id === 'engineer') break;
    await interact('c1_p_power');
    await solvePower();
    await interact('c1_door1');
    assert.equal(await evaluate('window.__game.roomId'), 2);
    assert.equal(await evaluate('document.querySelector("#passive-clue").hidden'), id !== 'scientist');
  }

  assert.match(await evaluate('document.querySelector("#first-steps").textContent'), /Press E/);
  assert.match(await evaluate('document.querySelector("#scene-lines").textContent'), /chronometer/);
  await checkPhoneLayout();

  await evaluate('document.querySelector("[data-panel=sheet]").focus()');
  await key('Enter');
  assert.equal(await evaluate('document.activeElement.textContent'), 'Character sheet');
  assert.match(await evaluate('document.querySelector("#overlay-content").textContent'), /Mechanic.*Inspiration 0\/1.*Repair, Tinkering.*Ideal.*Bond/);
  await shot('character-sheet');
  await key('Escape');
  assert.equal(await evaluate('document.activeElement.dataset.panel'), 'sheet');

  const visibilityDescriptor = await evaluate('Boolean(Object.getOwnPropertyDescriptor(Element.prototype, "checkVisibility"))');
  assert.equal(visibilityDescriptor, true);
  await evaluate('document.querySelector("[data-panel=help]").focus()');
  await key('Enter');
  assert.match(await evaluate('document.querySelector("#overlay-content").textContent'), /d20.*Spend points/);
  await evaluate(`window.visibilityDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'checkVisibility');
    delete Element.prototype.checkVisibility; true`);
  try {
    await key('Tab');
    assert.equal(await evaluate('document.activeElement.textContent'), 'Back');
    await key('Escape');
    assert.equal(await evaluate('document.activeElement.textContent'), 'How to play');
  } finally {
    await evaluate(`Object.defineProperty(Element.prototype, 'checkVisibility', window.visibilityDescriptor);
      delete window.visibilityDescriptor`);
  }

  // Reach the workspace by keyboard and verify the rotation threshold on a practice attempt.
  await evaluate(`document.querySelector('#room-nav button').focus()`);
  for (let i = 0; i < 3; i++) await key('Tab');
  assert.equal(await evaluate('document.activeElement.textContent'), 'Room objects');
  await key('Enter');
  for (let i = 0; i < 2; i++) await key('Tab');
  await key('Enter');
  await until(() => evaluate('document.querySelector("#overlay h2")?.textContent === "Power routing"'));
  await key('Tab');
  await key('ArrowRight');
  await key('ArrowRight');
  await key('Enter');
  assert.match(await evaluate('document.querySelector("#overlay-content").textContent'), /Rotations: 1/);
  const bypassVisible = () => evaluate(`[...document.querySelectorAll('#overlay button')].some(
    button => button.textContent === 'Skip puzzle (no XP)' && button.checkVisibility())`);
  for (let i = 0; i < 10; i++) await key('Enter');
  assert.equal(await bypassVisible(), false);
  await key('Enter');
  assert.equal(await bypassVisible(), true);
  await key('Escape');
  await until(() => evaluate('!document.querySelector("#overlay").open'));

  async function roll(id, face, mode, total, passed, spend = false) {
    await evaluate(`window.__game.forceRoll(${face})`);
    if (spend) {
      await evaluate('document.querySelector(".choice-list input[type=checkbox]").click()');
      assert.match(await evaluate(`document.querySelector('[data-choice="${id}"]').textContent`), /advantage/);
      assert.equal(await evaluate(`document.querySelector('[data-choice="${id}"]').click(); true`), true);
    } else await choose(id);
    const result = (await current()).rolls[id];
    assert.equal(result.mode, mode);
    assert.deepEqual(result.dice, mode === 'normal' ? [face] : [face, face]);
    assert.equal(result.total, total);
    assert.equal(result.passed, passed);
    assert.equal(await evaluate('Number(document.querySelector(".dice").dataset.dice)'), result.dice.length);
    assert.equal(await evaluate('Boolean(document.querySelector(".dice canvas"))'), true);
    assert.equal(await evaluate('Boolean(document.querySelector(".dice[data-rolling]"))'), false);
    assert.match(await evaluate('document.querySelector(".result").textContent'), new RegExp(`Total ${total} .* ${passed ? 'Pass' : 'Fail'}`));
  }

  for (let room = 1; room <= 9; room++) {
    assert.equal(await evaluate('window.__game.roomId'), room);
    await verifyCanvas(evaluate);
    if ([1, 2, 3, 5, 9].includes(room)) await shot(`room-${room}`);
    const hotspots = await evaluate('window.__game.hotspots');
    const exit = hotspots.find(hotspot => hotspot.exit);
    const puzzle = hotspots.find(hotspot => hotspot.puzzle);
    const gated = hotspots.find(hotspot => hotspot.dialogue && hotspot.needFlag);
    assert.equal(exit.status, 'Locked', `room ${room} exit before objectives`);
    await interact(exit.id);
    assert.equal(await evaluate('window.__game.roomId'), room);
    await back();
    if (gated) {
      assert.equal(gated.status, 'Locked');
      await interact(gated.id);
      await back();
    }
    if (room === 2) {
      await interact('c1_lab');
      assert.equal(await evaluate('window.__game.choose("c1_lab_archive")'), false);
      assert.equal(await evaluate('document.querySelector("[data-choice=c1_lab_archive]").getAttribute("aria-disabled")'), 'true');
      await back();
    }
    for (const hotspot of hotspots.filter(entry => entry.text && !entry.puzzle)) {
      await interact(hotspot.id);
      await back();
    }

    if (room === 2) {
      await interact('c1_lab');
      assert.equal(await evaluate('document.querySelector("[data-choice=c1_lab_archive]").getAttribute("aria-disabled")'), 'false');
      assert.equal(await evaluate('document.querySelectorAll(".speaker-badge .portrait").length'), 2);
      await roll('c1_lab_eng', 7, 'disadvantage', 10, false);
      // Reload while the dice are on screen and continue the saved dialogue.
      await send('Page.reload');
      await until(() => evaluate('Boolean(window.__game) && document.querySelector("#screen h1")?.textContent === "The Long Quiet"'));
      await click('Continue', '#screen button');
      assert.match(await evaluate('document.querySelector(".result").textContent'), /Total 10 .* Fail/);
      await choose('continue');
      await choose('c1_lab.repair_pause.0');
      await choose('c1_lab_patient');
      await choose('done');
    }
    if (room === 4) {
      await interact('c2_radio1');
      await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
      await roll(reedCheck.id, reedCheck.die, 'advantage', 15, true, true);
      await shot('dice-roll');
      assert.equal((await current()).inspiration, 0);
      await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
      for (const reply of reedCheck.replies) await choose(reply);
      assert.match(await evaluate('document.querySelector("#room-intro").textContent'), /cue from the Reed/);
    }
    if (room === 5) {
      await interact('c2_pip');
      await choose(pipReplies[0]);
      assert.equal((await current()).inspiration, 1, 'Roleplay awards Inspiration');
      for (const reply of pipReplies.slice(1, -1)) await choose(reply);
      assert.doesNotMatch(await evaluate('document.querySelector("#overlay .dialogue-line").textContent'), /seven|7/i);
      await choose(pipReplies.at(-1));
    }

    if (room === 7) {
      await interact('c3_fern1');
      await roll(vaultCheck.id, vaultCheck.die, 'normal', 19, true);
      for (const reply of vaultCheck.replies) await choose(reply);
    }

    await interact(puzzle.id);
    assert.equal(await evaluate('document.querySelector("#overlay").dataset.kind'), 'puzzle');
    if (room === 1) {
      await solvePower();
    } else if (room === 5) {
      await solveBalance();
      await back();
    } else {
      if (room === 4) {
        assert.match(await evaluate('document.querySelector("#overlay-content").textContent'), /First cue: Pad 3/);
      }
      if (room === 8) {
        assert.match(await evaluate('document.querySelector("#room-intro").textContent'), /Cy’s two corrections/);
        assert.match(await evaluate('document.querySelector("#overlay-content").textContent'), /Fern’s corrections/);
      }
      assert.equal(await evaluate('window.__game.solvePuzzle()'), true);
      await back();
    }
    const record = await current();
    assert.equal(record.flags[puzzle.setFlag], true);
    assert.equal(record.journal[puzzle.id].bypass, false);
    assert.equal(record.awards[puzzle.id], 30);

    if (room === 3) {
      assert.equal(await evaluate('document.querySelector("#room-title").textContent'), 'Signal Laboratory');
      await interact(gated.id);
      await roll('c1_veil_sci', 20, 'normal', 19, true);
      assert.equal((await current()).inspiration, 1);
      assert.match(await evaluate('document.querySelector("#overlay .read-aloud").textContent'), /Natural 20/);
      assert.match(await evaluate('document.querySelector(".unlock-note").textContent'), /phase clue/);
      await choose('continue');
      await choose('c1_talk.study.0');
      await choose('c1_talk.fin.0');
    }
    if (room === 6) {
      await interact(gated.id);
      await roll(captainCheck.id, captainCheck.die, 'advantage', 20, true);
      for (const reply of captainCheck.replies) await choose(reply);
    }
    if (room === 8) {
      await interact('c3_quarrel');
      for (const reply of quarrelReplies) await choose(reply);
    }
    if (room === 9) {
      await interact(gated.id);
      await roll(fernCheck.id, fernCheck.die, 'advantage', 0, false);
      for (const reply of fernCheck.replies) await choose(reply);
    }

    assert.equal(await evaluate(`window.__game.hotspots.find(entry => entry.id === ${JSON.stringify(exit.id)}).status`), 'Open');
    await interact(exit.id);
    if (room % 3 === 0) {
      assert.equal((await current()).screen, 'complete');
      assert.match(await evaluate('document.querySelector(".session-recap").textContent'), /Session recap.*Best roll.*Natural 20s.*Loot/);
      if (room === 3) await shot('chapter-card');
      if (room === 9) {
        assert.match(await evaluate('document.querySelector(".route-copy").textContent'), /observation deck/);
      }
      await click('Continue');
      if (room < 9) {
        assert.match(await evaluate('document.querySelector(".read-aloud h2").textContent'), /Previously, on Drift Signal/);
        await click('Begin chapter');
      }
    }
    console.log(`Room ${room} passed`);
  }

  const finale = await current();
  assert.equal(finale.screen, 'finale');
  assert.equal(finale.xp, 430);
  assert.equal(Object.keys(finale.journal).length, 20);
  assert.equal(await evaluate('document.querySelector("h1").textContent'), 'The Long Quiet');
  assert.equal(await evaluate('document.querySelectorAll(".epilogue p").length'), 3);
  assert.match(await evaluate('document.querySelector(".finale-art figcaption").textContent'), /lit for planting/);
  assert.equal(await evaluate('document.querySelector(".finale-art").contains(document.querySelector("#world"))'), true);
  await verifyCanvas(evaluate);
  await shot('finale');

  assert.equal(await evaluate('window.audioContextAttempts'), 0, 'Test mode must never create an AudioContext');
  await send('Page.navigate', { url: server.url + '/' });
  await until(() => evaluate('document.querySelector("#screen h1")?.textContent === "The Long Quiet"'));
  assert.equal(await evaluate('Object.hasOwn(window, "__game")'), false);
  await click('Continue');
  assert.match(await evaluate('document.querySelector(".journal-coverage").textContent'), /20 of 20/);

  async function solvePower() {
    assert.equal(await evaluate(`(() => {
      const tiles = document.querySelectorAll(".conduit-tile");
      for (const [index, turns] of ${JSON.stringify(powerRotations)}) {
        for (let turn = 0; turn < turns; turn++) tiles[index].click();
      }
      return document.querySelector("#overlay-content").textContent.includes("Power reaches the door.")
        && !window.__game.state.flags.c1_power_on;
    })()`), true, 'Power is solved and its confirmation is still in progress');
    await key('Escape');
    await until(() => evaluate('!document.querySelector("#overlay").open'));
    assert.equal((await current()).flags.c1_power_on, true);
  }

  async function solveBalance() {
    const modal = '#overlay button';
    const naming = () => evaluate(`[...document.querySelectorAll('#overlay button')].find(
      button => button.textContent === 'Name the heavy crate').checkVisibility()`);
    async function weigh(left, right) {
      await evaluate(`[...document.querySelectorAll('.crate-rack button')].forEach((crate, index) => {
        const count = (${crateTurns})(index, crate.textContent, ${JSON.stringify(left)}, ${JSON.stringify(right)});
        for (let turns = count; turns > 0; turns--) crate.click();
      })`);
      await click('Weigh', modal);
    }
    for (const [index, pans] of balanceWeighings.entries()) {
      await weigh(...pans);
      assert.equal(await naming(), index === balanceWeighings.length - 1);
    }
    await click('Name the heavy crate', modal);
    await click('7', '#overlay button[aria-label="Crate 7"]');
    await click('Confirm', modal);
    await until(() => evaluate('document.querySelector("#overlay").dataset.kind === "message"'));
    assert.match(await evaluate('document.querySelector("#overlay .dialogue-line").textContent'), /heavy crate rolls/);
  }

  async function checkPhoneLayout() {
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true });
    try {
      assert.equal(await evaluate(`(() => {
        const bounds = selector => document.querySelector(selector).getBoundingClientRect();
        const canvas = bounds('#world');
        return document.documentElement.scrollWidth <= 390
          && canvas.height > 350
          && bounds('#room-title').bottom <= canvas.top
          && bounds('#goals').bottom <= canvas.top
          && bounds('[data-panel=objects]').bottom <= canvas.top;
      })()`), true, 'Phone viewport fits the HUD and keeps objectives and Room objects above the canvas');
      await verifyCanvas(evaluate);
      await shot('phone-390x844');
    } finally {
      await send('Emulation.clearDeviceMetricsOverride');
      await send('Emulation.setTouchEmulationEnabled', { enabled: false });
    }
  }

}
