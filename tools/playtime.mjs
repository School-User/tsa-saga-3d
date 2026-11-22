import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { chromium, serve, until } from './chromium.mjs';
import { layouts } from '../js/world/layouts.js';
import { routeTo } from '../js/world/navigation.js';
import { optionalVisit, roomDialogue, solveLaterPuzzle } from './playtime-route.mjs';
import { powerRotations } from './playtime-solutions.mjs';
import { additions, formatReport, formatWalkthrough, readingDelay, seconds, threshold } from './playtime-report.mjs';

const root = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '');
const all = process.argv.includes('--all');
const reportPath = new URL(all ? '../docs/walkthrough-timing.md' : '../docs/playtime.md', import.meta.url);
const walkSpeed = 7; // Guided walking in createWorld().move(), js/world/view.js.
const profiles = [
  { title: 'Average player', wpm: 230 },
  { title: 'Speedrunner', wpm: 0 },
  { title: 'Careful reader', wpm: 180, optional: true }
];
const wordCount = text => (text.match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu) ?? []).length;

const server = await serve(root);
let browser;
try {
  browser = await chromium();
  await browser.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }]
  });
  const results = [];
  for (const profile of profiles) {
    console.log(`Running ${profile.title}…`);
    const result = await play(browser, profile);
    assert.deepEqual(browser.errors, [], 'Browser console errors');
    results.push(result);
  }
  const report = all ? formatWalkthrough(results) : formatReport(results);
  console.log(report);
  const doc = await readFile(reportPath, 'utf8');
  const key = all ? 'walkthrough-results' : 'playtime-results';
  const section = new RegExp(`<!-- ${key}:start -->[\\s\\S]*?<!-- ${key}:end -->`);
  assert.match(doc, section, `Missing results section in ${reportPath.pathname}`);
  const updated = doc.replace(section, () => `<!-- ${key}:start -->\n${report.trim()}\n<!-- ${key}:end -->`);
  if (all) {
    await writeFile(reportPath, updated);
  } else {
    const followup = /<!-- playtime-followup:start -->[\s\S]*?<!-- playtime-followup:end -->/;
    assert.match(doc, followup, 'Missing follow-up section in docs/playtime.md');
    const underTarget = results[0].segments.slice(1).reduce((total, room) => total + room.model, 0) < threshold * 1000;
    await writeFile(reportPath, updated.replace(followup,
      () => `<!-- playtime-followup:start -->\n${underTarget ? additions() + '\n' : ''}<!-- playtime-followup:end -->`));
  }
} finally {
  try {
    await browser?.close();
  } finally {
    await server.close();
  }
}

async function play({ send, evaluate }, profile) {
  const state = () => evaluate('window.__game.state');
  const url = new URL('/?test=1', server.url);
  url.searchParams.set('pace', profile.title);
  await send('Page.navigate', { url: url.href });
  await until(() => evaluate(`location.href === ${JSON.stringify(url.href)} && Boolean(window.__game)`));
  await send('Page.bringToFront');
  assert.equal(await state(), null, 'Expected a fresh game for each run');

  const seen = new Set();
  const segments = [];
  let segment;
  if (all) {
    await until(() => evaluate(`(() => {
      const image = document.querySelector('#screen .card-art img');
      return image?.complete && image.naturalWidth > 0 && image.checkVisibility();
    })()`));
    startSegment('Title screen');
    await readScreen();
    finishSegment();
  } else {
    await sleep(readingDelay(await newWords(), profile.wpm));
  }
  startSegment('Setup', all ? segment.finished : undefined);
  await click('#screen button', 'New game', { read: false });
  await click('.class-choice', undefined, { index: 0 });
  await click('input[name="ideal"]', undefined, { index: 0 });
  await click('input[name="bond"]', undefined, { index: 0 });
  await click('#screen button', 'Confirm background');
  await click('#screen button', 'Begin chapter');

  let position;
  finishSegment();
  for (let room = 1; room <= (all ? 9 : 3); room++) {
    startSegment(`Room ${room}`, segment.finished);
    assert.equal(await evaluate('window.__game.roomId'), room);
    const layout = layouts[room];
    position = { x: 0, z: layout.spawn };
    const world = await evaluate('!document.querySelector("#world").hidden');
    const hotspots = await evaluate('window.__game.hotspots');
    const [puzzle, exit] = hotspots.filter(entry => entry.puzzle || entry.exit);
    const controls = { approach, choose, inspect, click, setValue, evaluate, puzzleConfirmation };
    assert.ok(puzzle.puzzle && exit.exit, 'Expected one puzzle and one exit');

    if (profile.optional) {
      await chatter();
      if (room === 1) {
        await inspect('c1_badge');
        await inspect('c1_look');
        await approach('c1_ori1', 'dialogue');
        await choose('c1_ori_calm', { die: 15 });
        assert.equal((await state()).rolls.c1_ori_calm.passed, true);
        await choose('continue');
        await choose('c1_ori1.calm.0');
        await choose('done');
        assert.equal((await state()).flags.c1_ori1_heard, true);
      } else if (room === 2) {
        await inspect('c1_log2');
        await inspect('c1_gauges');
      } else if (room === 3) {
        await inspect('c1_listen');
      } else {
        await optionalVisit(room, controls, hotspots);
      }
    }

    await approach(puzzle.id, 'puzzle');
    if (room === 1) {
      for (const [index, turns] of powerRotations) {
        for (let turn = 0; turn < turns; turn++) {
          await click('.conduit-tile', undefined, { index, move: true, understand: index === 11 && turn === 0 });
        }
      }
      await puzzleConfirmation();
    } else if (room === 2) {
      for (const letter of ['C', 'A', 'D', 'B']) {
        await click('.valve-wheel', letter, { move: true, understand: letter === 'C' });
      }
      await puzzleConfirmation();
    } else if (room === 3) {
      if (!profile.optional) await click('.pulse-note summary', undefined, { understand: true });
      await typeShift(profile.optional);
      await click('#overlay button', 'Transmit', { move: true });
    } else {
      await solveLaterPuzzle(room, controls, profile.optional);
    }
    const solved = await state();
    assert.equal(solved.flags[puzzle.setFlag], true);
    assert.equal(solved.journal[puzzle.id].bypass, false);
    assert.equal(solved.awards[puzzle.id], 30);
    await back();

    if (room === 2) {
      await approach('c1_lab', 'dialogue');
      await choose('c1_lab.a.5');
      await choose('c1_lab_patient');
      await choose('done');
    }
    if (room === 3) {
      await approach('c1_talk', 'dialogue');
      await choose('c1_talk.a.0');
      await choose('c1_talk.need.0');
      await choose('c1_talk.peace.0');
      await choose('c1_talk.fin.0');
      assert.equal((await state()).flags.c1_ending_peace, true);
    }
    if (all && room > 3) await roomDialogue(room, controls);

    await approach(exit.id);
    console.log(`  ${segment.name} reached in ${seconds(segment.wall)} s`);

    if (all && room % 3 === 0) {
      const chapter = room / 3;
      assert.match(await evaluate('document.querySelector("#screen .eyebrow").textContent'),
        new RegExp(`Chapter ${chapter} of 3 complete`));
      startSegment(`Chapter ${chapter} completion card`, segment.finished);
      if (profile.optional && await evaluate('Boolean(document.querySelector(".session-recap details"))')) {
        await click('.session-recap summary');
      }
      await click('#screen button', 'Continue');
      finishSegment();
      if (room < 9) {
        startSegment(`Chapter ${chapter + 1} intro`, segment.finished);
        assert.equal((await state()).screen, 'intro');
        await click('#screen button', 'Begin chapter');
        finishSegment();
      }
    }

    async function inspect(id) {
      await approach(id, 'message');
      assert.ok((await state()).journal[id], `Missing inspection: ${id}`);
      await back();
    }

    async function approach(id, kind) {
      const target = (await evaluate('window.__game.hotspots')).find(entry => entry.id === id);
      assert.ok(target && target.status !== 'Locked', `Unavailable object: ${id}`);
      const panel = '#overlay[data-kind="objects"] .object-choice';
      await click('[data-panel="objects"]');
      const index = await evaluate(`[...document.querySelectorAll(${JSON.stringify(panel)})].findIndex(
        control => control.querySelector('strong').textContent === ${JSON.stringify(target.label)})`);
      assert.ok(index >= 0, `Missing object in panel: ${id}`);
      const prop = layout.props.find(entry => entry.hotspot === id);
      assert.ok(prop, `Missing prop: ${id}`);

      let travel = 2000;
      if (world) {
        const path = routeTo(layout, position.x, position.z, prop);
        assert.ok(path, `No guided path to ${id}`);
        let distance = 0;
        for (const point of path) {
          distance += Math.hypot(point.x - position.x, point.z - position.z);
          position = point;
        }
        travel = distance * 1000 / walkSpeed;
      }
      const arrived = kind ? `document.querySelector('#overlay').open &&
        document.querySelector('#overlay').dataset.kind === ${JSON.stringify(kind)}`
        : room % 3 === 0 ? 'window.__game.state.screen === "complete"' : `window.__game.roomId === ${room + 1}`;

      // Wait before selecting the object when the graphics fallback interacts immediately.
      const prompt = await click(panel, undefined, { index, extra: world ? 0 : travel, walking: world });
      const waitForArrival = async () => {
        await until(() => evaluate(arrived), 20000);
        if (!kind) finishSegment();
      };
      if (world) {
        await Promise.all([
          paceReading(countNewWords(prompt ? [prompt] : []), travel),
          waitForArrival()
        ]);
      } else {
        await waitForArrival();
      }
    }
  }
  let endingWords, endingReading;
  if (all) {
    startSegment('Finale', segment.finished);
    const finale = await state();
    assert.equal(finale.screen, 'finale');
    if (profile.optional) assert.equal(Object.keys(finale.journal).length, 20, 'Careful route journal coverage');
    assert.equal(await evaluate('document.querySelectorAll(".epilogue p").length'), 3);
    assert.match(await evaluate('document.querySelector(".finale-art figcaption").textContent'), /lit for planting/);
    await until(() => evaluate(`(() => {
      const art = document.querySelector('.finale-art');
      const canvas = art.querySelector('canvas');
      const image = art.querySelector('img');
      return (canvas && !canvas.hidden) || (image.complete && image.naturalWidth > 0);
    })()`));
    await evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve(true))))');
    await readScreen();
    finishSegment();
  } else {
    assert.equal((await state()).screen, 'complete');
    assert.match(await evaluate('document.querySelector("#screen .eyebrow").textContent'), /Chapter 1 of 3 complete/);
    endingWords = await newWords();
    endingReading = readingDelay(endingWords, profile.wpm);
    await sleep(endingReading);
  }
  await evaluate('localStorage.clear()');
  return { ...profile, segments, endingWords, endingReading };

  function startSegment(name, started = performance.now()) {
    segment = { name, model: 0, reading: [], words: 0, actions: 0, moves: 0, started };
    segments.push(segment);
  }

  function finishSegment() {
    segment.finished = performance.now();
    segment.wall = segment.finished - segment.started;
  }

  async function newWords() {
    return countNewWords(await evaluate(`(${visibleText.toString()})()`));
  }

  function countNewWords(entries) {
    let words = 0;
    for (const entry of entries.flatMap(line => line.split(/(?<=[.!?])\\s+(?=[“‘"A-Z0-9])/u))) {
      if (seen.has(entry)) continue;
      seen.add(entry);
      words += wordCount(entry);
    }
    return words;
  }

  async function readScreen(overlap = 0) {
    await paceReading(await newWords(), overlap);
  }

  async function paceReading(words, overlap) {
    const delay = readingDelay(words, profile.wpm);
    segment.words += words;
    segment.reading.push({ words, overlap });
    segment.model += Math.max(delay, overlap);
    if (delay) await sleep(delay);
  }

  async function action(perform, { read = true, move, understand, die, extra = 0 } = {}) {
    if (read) await readScreen();
    const wait = profile.wpm ? (move ? 2500 : 0) + (understand ? 10000 : 0) + (die ? 2000 : 0) : 500;
    segment.model += wait + extra;
    segment.actions++;
    if (move) segment.moves++;
    if (wait + extra) await sleep(wait + extra);
    return perform();
  }

  function click(selector, label, options = {}) {
    return action(async () => {
      const outcome = await evaluate(`(() => {
        const controls = [...document.querySelectorAll(${JSON.stringify(selector)})];
        const control = ${label === undefined ? `controls[${options.index ?? 0}]`
          : `controls.find(node => node.textContent.trim() === ${JSON.stringify(label)})`};
        if (!control?.checkVisibility({ checkVisibilityCSS: true }) || control.disabled ||
            control.getAttribute('aria-disabled') === 'true') return false;
        control.click();
        return ${options.walking ? "document.querySelector('#prompt').textContent" : "''"};
      })()`);
      assert.notEqual(outcome, false, `Unavailable control: ${label ?? selector}`);
      return outcome;
    }, options);
  }

  function back() {
    return click('#overlay button', 'Back');
  }

  function chatter() {
    return click('#scene-banter > summary');
  }

  async function choose(id, options = {}) {
    if (options.die) await evaluate(`window.__game.forceRoll(${options.die})`);
    await click(`#overlay [data-choice="${id}"]`, undefined, options);
  }

  async function puzzleConfirmation(
    ready = 'document.querySelector("#overlay").dataset.kind === "message"', duration = 1000
  ) {
    // Read newly visible text while the native puzzle timer runs.
    await Promise.all([readScreen(duration), until(() => evaluate(ready))]);
  }

  function setValue(selector, value, options) {
    return action(async () => {
      assert.equal(await evaluate(`(() => {
        const control = document.querySelector(${JSON.stringify(selector)});
        if (!control?.checkVisibility({ checkVisibilityCSS: true }) || control.disabled) return false;
        control.value = ${JSON.stringify(value)};
        control.dispatchEvent(new Event('input', { bubbles: true }));
        control.dispatchEvent(new Event('change', { bubbles: true }));
        return control.value === ${JSON.stringify(value)};
      })()`), true, `Unavailable puzzle setting: ${selector} = ${value}`);
    }, options);
  }

  async function typeShift(understand) {
    await action(async () => {
      assert.equal(await evaluate(`(() => {
        const input = document.querySelector('#cipher-shift');
        input.focus();
        return document.activeElement === input;
      })()`), true, 'Cipher shift input could not receive focus');
      const selectAll = { key: 'a', code: 'KeyA', windowsVirtualKeyCode: 65, modifiers: 2 };
      await send('Input.dispatchKeyEvent', { ...selectAll, type: 'rawKeyDown' });
      await send('Input.dispatchKeyEvent', { ...selectAll, type: 'keyUp' });
      await send('Input.insertText', { text: '7' });
      assert.equal(await evaluate('document.querySelector("#cipher-shift").valueAsNumber'), 7);
    }, { move: true, understand });
  }
}

// This function runs in Chromium. Collect visible text nodes once per screen, including
// choice labels, status lines, and puzzle feedback. Closed details expose only the summary.
function visibleText() {
  const dialog = document.querySelector('#overlay');
  const room = document.querySelector('#room-screen');
  const root = dialog.open ? dialog : room.hidden ? document.querySelector('#screen') : room;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const byElement = new Map();
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const parent = node.parentElement;
    const value = node.textContent.replace(/\s+/g, ' ').trim();
    if (!value || !parent.checkVisibility({ checkVisibilityCSS: true })) continue;
    if (parent.closest('details:not([open])') && !parent.closest('summary')) continue;
    const previous = byElement.get(parent);
    byElement.set(parent, previous ? `${previous} ${value}` : value);
  }
  return [...byElement.values()];
}
