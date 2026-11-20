// The Veil's marker gives a known pair. Use it to recover the backward shift.
import { el, button } from '../ui/dom.js';

const SIGNAL = 'DL HYL UVA HSVUL';
const MARKER = 'D';
const REFERENCE = 'W';
const FAIL_AT = 3;

export function decode(text, shift) {
  return text.replace(/[A-Z]/g, ch => String.fromCharCode(
    ((ch.charCodeAt(0) - 65 - shift) % 26 + 26) % 26 + 65));
}

export function start(content, ctx, done) {
  const heading = el('h2', '', 'Decode the Veil’s signal');
  const signal = el('p', 'scene cipher-code', SIGNAL);
  content.append(heading, el('p', 'small', 'The Veil repeats the same header with every burst. Count backward from the incoming marker to Meridian’s reference letter. Wrap from A to Z and transmit that shift.'), signal);
  const mark = el('p', 'scene small', `Pulse monitor calibration · Incoming ${MARKER} maps to ${REFERENCE}.`);
  if (ctx?.recorded?.('c1_listen')) content.append(mark);
  else {
    const monitor = el('details', 'pulse-note');
    monitor.append(el('summary', '', 'Read the pulse monitor calibration plate'), mark);
    content.append(monitor);
  }
  content.append(el('p', 'cipher-code', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'));
  if (ctx?.stat?.('sci') >= 4) {
    content.append(el('p', 'small', 'SCI 4 · A second marker pairs L with E. Cross-check your count without wrapping.'));
  }

  const controls = el('div', 'puzzle-controls');
  const label = el('label', 'statname', 'Backward shift');
  label.htmlFor = 'cipher-shift';
  const input = el('input', 'cipher-shift');
  Object.assign(input, { id: 'cipher-shift', type: 'number', min: 0, max: 25, step: 1, value: '0' });
  const live = el('p', 'small');
  live.setAttribute('role', 'status');
  let failures = 0;
  let finished = false;

  const transmit = button('Transmit', check, 'btn primary');
  const skip = button('Skip puzzle (no XP)', () => finish('skip'), 'btn ghost small');
  const back = button('Back', () => finish('back'), 'btn ghost small');
  skip.hidden = true;
  controls.append(label, input, transmit, skip, back);
  content.append(controls, live);
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') check();
  });

  function validShift() {
    const shift = input.valueAsNumber;
    return Number.isInteger(shift) && shift >= 0 && shift <= 25;
  }

  function check() {
    if (finished) return;
    if (!validShift()) {
      live.textContent = 'Enter a whole shift from 0 to 25.';
      return;
    }
    if (decode(MARKER, input.valueAsNumber) === REFERENCE) {
      finish('solved');
      return;
    }
    failures++;
    skip.hidden = failures < FAIL_AT;
    live.textContent = skip.hidden
      ? `The marker still differs from the known pair. ${failures} of ${FAIL_AT} attempts before bypass.`
      : 'The marker still differs from the known pair. A bypass is available.';
  }

  function finish(outcome) {
    if (finished) return;
    finished = true;
    done({ solved: outcome === 'solved', skipped: outcome === 'skip' });
  }
}
