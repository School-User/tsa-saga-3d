import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium, serve, until } from './chromium.mjs';

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

  await click('New game');
  await evaluate('document.querySelector(".class-choice").click()');
  await click('Confirm background');
  await click('Begin chapter');

  assert.match(await evaluate('document.querySelector("#first-steps").textContent'), /Press E/);
  assert.match(await evaluate('document.querySelector("#scene-lines").textContent'), /chronometer/);
  await checkPhoneLayout();

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

  async function roll(id, face, mode, total, passed) {
    await evaluate(`window.__game.forceRoll(${face})`);
    await choose(id);
    const result = (await current()).rolls[id];
    assert.equal(result.mode, mode);
    assert.deepEqual(result.dice, mode === 'normal' ? [face] : [face, face]);
    assert.equal(result.total, total);
    assert.equal(result.passed, passed);
    assert.equal(await evaluate('document.querySelectorAll(".dice .die").length'), result.dice.length);
    assert.equal(await evaluate('Boolean(document.querySelector(".dice-enter"))'), false);
    assert.match(await evaluate('document.querySelector(".result").textContent'), new RegExp(`Total ${total} .* ${passed ? 'Pass' : 'Fail'}`));
  }

  for (let room = 1; room <= 9; room++) {
    assert.equal(await evaluate('window.__game.roomId'), room);
    await verifyCanvas(evaluate);
    if ([1, 5, 9].includes(room)) await shot(`room-${room}`);
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
      await roll('c2_tamsin_calm', 20, 'normal', 19, true);
      await choose('continue');
      await choose('c2_radio1.calm.0');
      await choose('done');
      assert.match(await evaluate('document.querySelector("#room-intro").textContent'), /cue from the Reed/);
    }
    if (room === 5) {
      await interact('c2_pip');
      await choose('c2_pip.a.3');
      await choose('c2_pip_count');
      await choose('c2_pip.win.0');
      assert.doesNotMatch(await evaluate('document.querySelector("#overlay .dialogue-line").textContent'), /seven|7/i);
      await choose('done');
    }

    if (room === 7) {
      await interact('c3_fern1');
      await roll('c3_fern_calm', 20, 'normal', 19, true);
      await choose('continue');
      await choose('c3_fern1.calm.0');
      await choose('done');
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
      assert.match(await evaluate('document.querySelector(".unlock-note").textContent'), /phase clue/);
      await choose('continue');
      await choose('c1_talk.study.0');
      await choose('c1_talk.fin.0');
    }
    if (room === 6) {
      await interact(gated.id);
      await roll('c2_cap_all', 20, 'advantage', 20, true);
      await choose('continue');
      await choose('c2_talk3.all.0');
      await choose('c2_talk3.fin.0');
    }
    if (room === 8) {
      await interact('c3_quarrel');
      await choose('c3_quarrel.a.2');
      await choose('c3_quarrel_rota');
      await choose('done');
    }
    if (room === 9) {
      await interact(gated.id);
      await roll('c3_fern_release', 1, 'advantage', 0, false);
      await choose('continue');
      await choose('c3_talk3.pause.0');
      await choose('c3_talk3.replant.0');
      await choose('c3_talk3.fin.0');
    }

    assert.equal(await evaluate(`window.__game.hotspots.find(entry => entry.id === ${JSON.stringify(exit.id)}).status`), 'Open');
    await interact(exit.id);
    if (room % 3 === 0) {
      assert.equal((await current()).screen, 'complete');
      if (room === 9) {
        assert.match(await evaluate('document.querySelector(".route-copy").textContent'), /observation deck/);
      }
      await click('Continue');
      if (room < 9) await click('Begin chapter');
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
      for (const [index, turns] of [[11, 3], [6, 2], [7, 1], [8, 1], [13, 2]]) {
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
        const id = index + 1;
        const current = crate.textContent.endsWith(' L') ? 1 : crate.textContent.endsWith(' R') ? 2 : 0;
        const target = ${JSON.stringify(left)}.includes(id) ? 1 : ${JSON.stringify(right)}.includes(id) ? 2 : 0;
        for (let turns = (target - current + 3) % 3; turns > 0; turns--) crate.click();
      })`);
      await click('Weigh', modal);
    }
    await weigh([1, 2], [3, 4]);
    assert.equal(await naming(), false);
    await weigh([5], [6]);
    assert.equal(await naming(), false);
    await weigh([7], [8]);
    assert.equal(await naming(), true);
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
    } finally {
      await send('Emulation.clearDeviceMetricsOverride');
      await send('Emulation.setTouchEmulationEnabled', { enabled: false });
    }
  }

}

async function verifyCanvas(evaluate) {
  await evaluate('new Promise(done => requestAnimationFrame(() => requestAnimationFrame(() => done(true))))');
  await until(() => evaluate(`(() => {
    const canvas = document.querySelector('#world');
    const gl = canvas.getContext('webgl2');
    if (!canvas.checkVisibility() || !gl || gl.isContextLost()) return false;
    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;
    const pixels = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    const colors = new Set();
    let opaque = 0;
    // Read a sparse grid directly from the preserved WebGL framebuffer.
    for (let row = 1; row < 20; row++) {
      for (let col = 1; col < 32; col++) {
        const offset = (Math.floor(height * row / 20) * width + Math.floor(width * col / 32)) * 4;
        if (pixels[offset + 3] >= 240) {
          opaque++;
          colors.add(pixels.slice(offset, offset + 3).join(','));
        }
      }
    }
    return opaque > 35 && colors.size > 8;
  })()`));
}
