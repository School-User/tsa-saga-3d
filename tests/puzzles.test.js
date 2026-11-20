import assert from 'node:assert/strict';
import { puzzles } from '../js/puzzles/index.js';
import { decode } from '../js/puzzles/cipher.js';
import { signalStrength } from '../js/puzzles/tuner.js';

// Exercise the puzzle modules' rendered controls in Node without a browser dependency.
class Element {
  constructor(tagName) {
    this.tagName = tagName;
    this.children = [];
    this.style = {};
    this.hidden = false;
    this.disabled = false;
    this.attributes = new Map();
    this.listeners = new Map();
    const classes = new Set();
    this.classList = {
      toggle: (name, on) => on ? classes.add(name) : classes.delete(name),
      remove: name => classes.delete(name),
      contains: name => classes.has(name)
    };
  }

  set textContent(text) { this.text = String(text); this.children = []; }
  get textContent() { return (this.text ?? '') + this.children.map(child => child.textContent).join(''); }
  get firstChild() { return this.children[0]; }
  get valueAsNumber() { return this.value === '' ? Number.NaN : Number(this.value); }

  append(...children) { this.children.push(...children); }
  appendChild(child) { this.append(child); }
  insertBefore(child) { this.children.unshift(child); }
  setAttribute(name, value) {
    this.attributes.set(name, value);
    if (name === 'hidden') this.hidden = true;
    if (name === 'id' || name === 'value') this[name] = value;
  }
  getAttribute(name) { return this.attributes.get(name); }
  removeAttribute(name) { this.attributes.delete(name); }
  addEventListener(type, handler) { this.listeners.set(type, handler); }
  removeEventListener(type) { this.listeners.delete(type); }
  dispatch(type, event) { this.listeners.get(type)?.(event); }
  click() { if (!this.disabled) this.dispatch('click'); }
  focus() { document.activeElement = this; this.dispatch('focus'); }
  querySelectorAll(tagName) {
    return this.children.flatMap(child => [
      ...(child.tagName === tagName ? [child] : []), ...child.querySelectorAll(tagName)
    ]);
  }
}

const timerQueue = new Map();
let timerId = 0;
const originalTimers = { setTimeout, clearTimeout };
globalThis.setTimeout = run => { timerQueue.set(++timerId, run); return timerId; };
globalThis.clearTimeout = id => timerQueue.delete(id);
globalThis.document = { createElement: tag => new Element(tag), activeElement: null };

function flushTimers() {
  for (const [id, run] of timerQueue) {
    timerQueue.delete(id);
    run();
  }
}

function open(id, context = { stat: () => 2 }) {
  const content = new Element('div');
  const outcomes = [];
  puzzles[id].start(content, context, outcome => outcomes.push(outcome));
  const controls = () => content.querySelectorAll('button');
  const button = label => {
    const control = controls().find(node => node.textContent === label);
    assert.ok(control, `Missing ${id} control: ${label}`);
    return control;
  };
  const input = (id, value) => {
    const node = content.querySelectorAll('input').find(control => control.id === id);
    assert.ok(node, `Missing input ${id}`);
    node.value = String(value);
    node.dispatch('input');
  };
  function solved() {
    flushTimers();
    assert.deepEqual(outcomes.map(outcome => [outcome.solved, !!outcome.skipped]), [[true, false]]);
  }
  return { content, outcomes, controls, button, input, solved };
}

try {
  for (let fixed = 0; fixed <= 9; fixed++) {
    for (let dial = 0; dial <= 9; dial++) {
      const value = signalStrength(dial, fixed);
      assert.ok(value >= 0 && value <= 100);
      assert.equal(value === 100, dial === 6 && fixed === 3);
      if (dial !== 6) assert.ok(signalStrength(dial + Math.sign(6 - dial), fixed) > value);
      if (dial !== 3) assert.ok(signalStrength(fixed, dial + Math.sign(3 - dial)) > signalStrength(fixed, dial));
    }
  }
  const assistedTuner = open('tuner', { stat: () => 5, hasFlag: flag => flag === 'c1_knows_signal' });
  assert.match(assistedTuner.content.textContent, /band from 2 to 4/);
  assert.doesNotMatch(assistedTuner.content.textContent, /phase 3|Raise the frequency|Lower the frequency|Frequency is aligned/i);
  assistedTuner.input('tuner-freq', 1);
  assert.match(assistedTuner.content.textContent, /Closer to peak/);
  assistedTuner.input('tuner-freq', 0);
  assert.match(assistedTuner.content.textContent, /Farther from peak/);
  const tuner = open('tuner');
  assert.match(tuner.content.textContent, /Signal strength: 28%/);
  tuner.input('tuner-freq', 1);
  assert.match(tuner.content.textContent, /Signal strength: 36%/);
  tuner.input('tuner-freq', 6);
  tuner.input('tuner-phase', 3);
  assert.match(tuner.content.textContent, /Signal strength: 100%/);
  tuner.button('Lock in').click();
  tuner.solved();

  assert.equal(decode('D L', 7), 'W E');
  assert.equal(decode('DL HYL UVA HSVUL', 7), 'WE ARE NOT ALONE');
  const cipher = open('cipher');
  assert.equal(cipher.content.querySelectorAll('details').length, 1);
  const inspectedCipher = open('cipher', { stat: () => 5, recorded: id => id === 'c1_listen' });
  assert.equal(inspectedCipher.content.querySelectorAll('details').length, 0);
  assert.match(inspectedCipher.content.textContent, /Incoming D maps to W/);
  assert.match(inspectedCipher.content.textContent, /L with E/);
  cipher.input('cipher-shift', '');
  cipher.button('Transmit').click();
  assert.match(cipher.content.textContent, /whole shift from 0 to 25/);
  assert.equal(cipher.button('Skip puzzle (no XP)').hidden, true);
  const cipherPrompt = cipher.content.textContent;
  for (let shift = 0; shift < 26; shift++) {
    cipher.input('cipher-shift', shift);
    assert.equal(cipher.content.textContent, cipherPrompt, 'Changing the dial does not reveal a mapping');
  }
  cipher.input('cipher-shift', 7);
  cipher.button('Transmit').click();
  cipher.solved();
  const cipherBypass = open('cipher');
  for (let i = 1; i <= 3; i++) {
    cipherBypass.button('Transmit').click();
    assert.equal(cipherBypass.button('Skip puzzle (no XP)').hidden, i < 3);
  }
  cipherBypass.button('Skip puzzle (no XP)').click();
  assert.deepEqual(cipherBypass.outcomes, [{ solved: false, skipped: true }]);

  const helpedMemory = open('memory', { hasFlag: flag => flag === 'c2_tamsin_calm' });
  assert.match(helpedMemory.content.textContent, /First cue: Pad 3/);
  const memory = open('memory');
  assert.doesNotMatch(memory.content.textContent, /First cue:/);
  const step = memory.button('Step through');
  const sequence = [3, 1, 4, 2, 3];
  sequence.forEach((pad, index) => {
    step.click();
    assert.match(memory.content.textContent, new RegExp(`Cue ${index + 1} of 5 · Pad ${pad}`));
    assert.ok(memory.button(`Pad ${pad}`).classList.contains('memory-cue'));
    assert.equal(memory.button(`Pad ${pad}`).disabled, true);
    assert.equal(timerQueue.size, 0, 'Manual playback waits for the player');
  });
  assert.equal(step.textContent, 'Enter sequence');
  step.click();
  sequence.forEach(pad => memory.button(`Pad ${pad}`).click());
  memory.solved();

  function routePower(puzzle) {
    const tiles = puzzle.controls().slice(0, 25);
    for (const [index, count] of [[11, 3], [6, 2], [7, 1], [8, 1], [13, 2]]) {
      for (let turn = 0; turn < count; turn++) tiles[index].click();
    }
  }
  const power = open('power', { stat: () => 5 });
  assert.match(power.content.textContent, /fixed door terminal/);
  assert.ok(power.controls().slice(0, 25).every(tile => !tile.getAttribute('aria-label').includes('live route')));
  assert.equal(power.controls()[11].children.length, 5, 'No hint marker on the source elbow');
  routePower(power);
  power.solved();
  const powerDismiss = open('power');
  routePower(powerDismiss);
  assert.deepEqual(powerDismiss.outcomes, []);
  powerDismiss.button('Back').click();
  assert.equal(timerQueue.size, 0);
  powerDismiss.solved();

  const valves = open('valves');
  const valveC = valves.button('C');
  valveC.click();
  valveC.click();
  assert.equal(valveC.textContent, 'C · 1');
  for (const valve of ['A', 'D', 'B']) valves.button(valve).click();
  valves.solved();

  const lights = open('lights');
  for (const index of [0, 6, 9, 15]) lights.controls()[index].click();
  lights.solved();
  const lockBypass = open('lights');
  for (let i = 1; i <= 20; i++) {
    lockBypass.controls()[0].click();
    assert.equal(lockBypass.button('Skip puzzle (no XP)').hidden, i < 20);
  }

  const sliding = open('sliding');
  for (const tile of [3, 6, 5, 3, 8, 2, 3, 5, 6, 8, 5, 6]) sliding.button(String(tile)).click();
  sliding.solved();

  const annotatedRota = open('assign', { hasFlag: flag => flag === 'c3_fern_calm' });
  assert.match(annotatedRota.content.textContent, /Fern’s corrections · Cy does not tend Vine. Cy does not tend Moss/);
  const rota = open('assign');
  assert.doesNotMatch(rota.content.textContent, /Fern’s corrections/);
  assert.match(rota.content.textContent, /Cy does not tend Vine/);
  const selects = rota.content.querySelectorAll('select');
  ['Vine', 'Moss', 'Dome'].forEach((place, index) => { selects[index].value = place; });
  rota.button('Check').click();
  rota.solved();

  function placeCrates(puzzle, left, right) {
    puzzle.controls().slice(0, 9).forEach((crate, index) => {
      const id = index + 1;
      const current = crate.textContent.endsWith(' L') ? 1 : crate.textContent.endsWith(' R') ? 2 : 0;
      const target = left.includes(id) ? 1 : right.includes(id) ? 2 : 0;
      for (let turns = (target - current + 3) % 3; turns > 0; turns--) crate.click();
    });
    puzzle.button('Weigh').click();
  }
  const scales = open('scales');
  const name = scales.button('Name the heavy crate');
  placeCrates(scales, [1], []);
  assert.match(scales.content.textContent, /Weighings: 0 of 3/);
  placeCrates(scales, [1, 2, 3], [4, 5, 6]);
  assert.match(scales.content.textContent, /the pans balance/);
  assert.equal(name.hidden, true);
  placeCrates(scales, [4, 5, 6], [1, 2, 3]);
  assert.match(scales.content.textContent, /already been compared/);
  assert.match(scales.content.textContent, /Weighings: 1 of 3/);
  placeCrates(scales, [7], [8]);
  assert.match(scales.content.textContent, /the left pan sinks/);
  assert.equal(name.hidden, true);
  placeCrates(scales, [9], [8]);
  assert.equal(name.hidden, false);
  assert.match(scales.content.textContent, /1, 2, 3 vs 4, 5, 6/);
  const pickCrate = (puzzle, id) => puzzle.controls().find(node => node.getAttribute('aria-label') === `Crate ${id}`).click();
  name.click();
  pickCrate(scales, 8);
  scales.button('Confirm').click();
  assert.match(scales.content.textContent, /does not fit your record/);
  assert.equal(name.hidden, true);
  scales.button('Reset balance').click();
  assert.match(scales.content.textContent, /Left pan: empty.*Right pan: empty/);
  assert.match(scales.content.textContent, /Weighings: 0 of 3/);
  placeCrates(scales, [1, 2, 3], [4, 5, 6]);
  placeCrates(scales, [7], [8]);
  placeCrates(scales, [9], [8]);
  name.click();
  pickCrate(scales, 7);
  scales.button('Confirm').click();
  scales.solved();

  const inconclusive = open('scales');
  for (let attempt = 1; attempt <= 3; attempt++) {
    placeCrates(inconclusive, [1], [2]);
    placeCrates(inconclusive, [3], [4]);
    placeCrates(inconclusive, [5], [6]);
    assert.match(inconclusive.content.textContent, /still fits multiple crates/);
    assert.equal(inconclusive.button('Name the heavy crate').hidden, true);
    assert.equal(inconclusive.button('Skip puzzle (no XP)').hidden, attempt < 3);
    if (attempt < 3) inconclusive.button('Reset balance').click();
  }
  inconclusive.button('Skip puzzle (no XP)').click();
  assert.deepEqual(inconclusive.outcomes, [{ solved: false, skipped: true }]);
} finally {
  Object.assign(globalThis, originalTimers);
  delete globalThis.document;
}
