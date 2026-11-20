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
  cipher.input('cipher-shift', '');
  cipher.button('Transmit').click();
  assert.match(cipher.content.textContent, /whole shift from 0 to 25/);
  assert.equal(cipher.button('Skip puzzle (no XP)').hidden, true);
  cipher.input('cipher-shift', 7);
  assert.doesNotMatch(cipher.content.textContent, /WE ARE NOT ALONE/);
  assert.match(cipher.content.textContent, /D → W/);
  cipher.button('Transmit').click();
  cipher.solved();

  const memory = open('memory');
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

  const power = open('power');
  const tiles = power.controls().slice(0, 25);
  for (const [index, count] of [[11, 3], [6, 2], [7, 1], [8, 1], [13, 2]]) {
    for (let turn = 0; turn < count; turn++) tiles[index].click();
  }
  power.solved();

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

  const sliding = open('sliding');
  for (const tile of [3, 6, 5, 3, 8, 2, 3, 5, 6, 8, 5, 6]) sliding.button(String(tile)).click();
  sliding.solved();

  const rota = open('assign');
  const selects = rota.content.querySelectorAll('select');
  ['Vine', 'Moss', 'Dome'].forEach((place, index) => { selects[index].value = place; });
  rota.button('Check').click();
  rota.solved();

  const scales = open('scales');
  const crates = scales.controls().slice(0, 9);
  crates.slice(0, 3).forEach(crate => crate.click());
  crates.slice(3, 6).forEach(crate => { crate.click(); crate.click(); });
  scales.button('Weigh').click();
  assert.match(scales.content.textContent, /the pans balance/);
  crates.slice(0, 3).forEach(crate => { crate.click(); crate.click(); });
  crates.slice(3, 6).forEach(crate => crate.click());
  crates[6].click();
  crates[7].click();
  crates[7].click();
  scales.button('Weigh').click();
  assert.match(scales.content.textContent, /the left pan sinks/);
  scales.button('Name the heavy crate').click();
  scales.controls().find(node => node.getAttribute('aria-label') === 'Crate 7').click();
  scales.button('Confirm').click();
  scales.solved();
} finally {
  Object.assign(globalThis, originalTimers);
  delete globalThis.document;
}
