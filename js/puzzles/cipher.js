// The Veil's marker gives a known pair. Use it to recover the backward shift.
import { el, button } from '../ui/dom.js';

const SIGNAL = 'DL HYL UVA HSVUL';
const ANSWER = 7;
const FAIL_AT = 3;

export function decode(text, shift) {
  return text.replace(/[A-Z]/g, ch => String.fromCharCode(
    ((ch.charCodeAt(0) - 65 - shift) % 26 + 26) % 26 + 65));
}

export function start(content, ctx, done) {
  const heading = el('h2', '', 'Caesar decoder');
  const signal = el('p', 'scene cipher-code', SIGNAL);
  const mark = el('p', 'small', 'Known marker · Incoming D decodes as W.');
  content.append(heading, el('p', 'small', 'Every letter was shifted by the same amount. Count backward from D to W, wrapping from A to Z, then apply that shift to the signal.'), signal, mark);
  content.append(el('p', 'cipher-code', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'));
  if (ctx?.stat?.('sci') >= 4) {
    content.append(el('p', 'small', 'SCI 4 · A second marker pairs L with E. Cross-check your count without wrapping.'));
  }

  const controls = el('div', 'puzzle-controls');
  const label = el('label', 'statname', 'Backward shift');
  label.htmlFor = 'cipher-shift';
  const input = el('input', 'cipher-shift');
  Object.assign(input, { id: 'cipher-shift', type: 'number', min: 0, max: 25, step: 1, value: '0' });
  const preview = el('p', 'small');
  preview.setAttribute('role', 'status');
  const live = el('p', 'small');
  live.setAttribute('role', 'status');
  let failures = 0;
  let finished = false;

  const transmit = button('Transmit', check, 'btn primary');
  const skip = button('Skip puzzle (no XP)', () => finish('skip'), 'btn ghost small');
  const back = button('Back', () => finish('back'), 'btn ghost small');
  skip.hidden = true;
  controls.append(label, input, transmit, skip, back);
  content.append(controls, preview, live);
  input.addEventListener('input', paint);
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') check();
  });
  paint();

  function validShift() {
    const shift = input.valueAsNumber;
    return Number.isInteger(shift) && shift >= 0 && shift <= 25;
  }

  function paint() {
    preview.textContent = validShift() ? `Marker preview · D → ${decode('D', input.valueAsNumber)}` : '';
  }

  function check() {
    if (finished) return;
    if (!validShift()) {
      live.textContent = 'Enter a whole shift from 0 to 25.';
      return;
    }
    if (input.valueAsNumber === ANSWER) {
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
