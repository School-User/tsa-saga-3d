// Life Support valves: open A, B, C and D in the right order, deduced from written clues.
var ORDER = ['C', 'A', 'D', 'B'];
var CLUES = [
  'C must be opened before A.',
  'D is opened immediately after A.',
  'B is opened last.'
];
var FAIL_AT = 3;

function mk(tag, attrs, text) {
  var e = document.createElement(tag);
  Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
  if (text !== undefined) e.textContent = text;
  return e;
}

export function start(el, ctx, done) {
  var sci = !!(ctx && typeof ctx.stat === 'function' && ctx.stat('sci') >= 4);
  var seq = [], failures = 0, stopped = false, solving = false, timer;
  var letters = ['A', 'B', 'C', 'D'], buttons = [];

  el.appendChild(mk('h2', {}, 'Life support valves'));
  el.appendChild(mk('p', { 'class': 'small' },
    'Four valves feed the ring that keeps the ship breathing. Open them in the right order. ' +
    'Use the order engraved on the manifold plate. ' +
    'Click a valve, or focus it and press Enter or Space.'));

  var clues = mk('div', { 'class': 'panel' });
  clues.appendChild(mk('p', {}, 'Written on the valve housing:'));
  var list = mk('ul');
  CLUES.forEach(function (c) { list.appendChild(mk('li', {}, c)); });
  if (sci) {
    list.appendChild(mk('li', {}, 'SCI 4 · Read A and D as one block. It must go between the other two valves.'));
  }
  clues.appendChild(list);
  el.appendChild(clues);

  var orderLine = mk('p', { 'class': 'small' }, 'Order so far: none');
  el.appendChild(orderLine);
  var live = mk('p', { 'class': 'small', role: 'status', 'aria-live': 'polite' });
  el.appendChild(live);

  var grid = mk('div', { role: 'group', 'aria-label': 'Valves A, B, C and D',
    style: 'display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.5rem;' +
           'width:min(16rem,100%);margin:.5rem 0;' });
  el.appendChild(grid);
  letters.forEach(function (letter) {
    var b = mk('button', { type: 'button', 'class': 'valve-wheel',
      style: 'font-size:1.6rem;font-weight:700;padding:.7rem 0;border:2px solid var(--line);' +
             'border-radius:.5rem;background:#0d142a;color:var(--fg);cursor:pointer;' +
             'touch-action:manipulation' }, letter);
    b.addEventListener('click', function () { press(letter); });
    buttons.push(b); grid.appendChild(b);
  });

  var reset = mk('button', { type: 'button', 'class': 'btn ghost small' }, 'Reset');
  reset.addEventListener('click', function () {
    if (stopped || solving) return;
    seq = [];
    paint();
    live.textContent = 'The valves reset to closed.';
  });
  el.appendChild(reset);

  var controls = mk('div', { 'class': 'row' });
  var skip = mk('button', { type: 'button', 'class': 'btn ghost small', hidden: '' },
    'Skip puzzle (no XP)');
  skip.addEventListener('click', function () { finish('skip'); });
  var back = mk('button', { type: 'button', 'class': 'btn ghost small' }, 'Back');
  back.addEventListener('click', function () { finish(false); });
  controls.appendChild(skip); controls.appendChild(back);
  el.appendChild(controls);

  function paint() {
    letters.forEach(function (letter, i) {
      var at = seq.indexOf(letter), on = at !== -1, b = buttons[i];
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.setAttribute('aria-label', 'Valve ' + letter + ', ' +
        (on ? 'open, ' + (at + 1) + ' of 4.' : 'closed. Press Enter or Space to open it.'));
      b.textContent = on ? letter + ' · ' + (at + 1) : letter;
      b.style.background = on ? '#16294a' : '#0d142a';
      b.style.borderColor = on ? 'var(--accent)' : 'var(--line)';
    });
    orderLine.textContent = 'Order so far: ' + (seq.length ? seq.join(' → ') : 'none');
  }

  function finish(ok) {
    if (stopped) return;
    stopped = true; clearTimeout(timer);
    buttons.forEach(function (b) { b.disabled = true; });
    reset.disabled = true; skip.disabled = true; back.disabled = true;
    done({ solved: ok === true, skipped: ok === 'skip' });
  }

  function solve() {
    solving = true;
    buttons.forEach(function (b) { b.disabled = true; });
    reset.disabled = true; skip.disabled = true; back.disabled = true;
    live.textContent = 'The valves hiss open one after another. The gauge steadies and climbs.';
    timer = setTimeout(function () { finish(true); }, 1000);
  }

  function press(letter) {
    if (stopped || solving || seq.length >= 4 || seq.indexOf(letter) !== -1) return;
    seq.push(letter);
    paint();
    if (seq.length < 4) {
      live.textContent = 'Valve ' + letter + ' opened. ' + seq.length + ' of 4.';
      return;
    }
    if (seq.join('') === ORDER.join('')) { solve(); return; }
    failures += 1;
    seq = [];
    paint();
    live.textContent = 'Pressure rose. The valves slam shut and reset to closed. ' +
      '(Failure ' + failures + ' of ' + FAIL_AT + '.)';
    if (failures >= FAIL_AT) {
      skip.hidden = false;
      live.textContent += ' A bypass has unlocked.';
    }
  }

  paint();
}
