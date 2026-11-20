// Lights Out: press cells to switch it and its four neighbours; make the deck dark.
// Solvable in four presses: row 1 col 1, row 2 col 3, row 3 col 2, row 4 col 4.
var SIZE = 4;
var START = ['1110', '1011', '1101', '0111'];
var SKIP_AT = 20;

function mk(tag, attrs, text) {
  var e = document.createElement(tag);
  Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
  if (text !== undefined) e.textContent = text;
  return e;
}

export function start(el, ctx, done) {
  var sci = !!(ctx && typeof ctx.stat === 'function' && ctx.stat('sci') >= 4);
  var cells = [], buttons = [], moves = 0, failures = 0;
  var stopped = false, solving = false, timer;
  var focusR = 0, focusC = 0;

  el.appendChild(mk('h2', {}, 'Seed vault locks'));
  el.appendChild(mk('p', { 'class': 'small' },
    'The vault locks are lit in patches. Each press flips one cell and the four cells ' +
    'touching it. Put every cell out. Arrow keys move, Enter or Space presses.'));

  if (sci) {
    el.appendChild(mk('p', { 'class': 'small' }, 'Hint: Four presses are enough.'));
  }

  var grid = mk('div', {
    role: 'group', 'aria-label': 'Lights grid, 4 rows by 4 columns',
    style: 'display:grid;grid-template-columns:repeat(4,minmax(3rem,3.6rem));gap:.4rem;' +
           'margin:.75rem 0;max-width:16rem'
  });

  START.forEach(function (line, r) {
    cells[r] = line.split('').map(Number);
    buttons[r] = [];
    for (var c = 0; c < SIZE; c++) {
      var b = mk('button', {
        type: 'button',
        style: 'font:inherit;font-size:1.4rem;line-height:1;padding:.7rem 0;' +
               'border:2px solid var(--line);border-radius:.6rem;cursor:pointer;' +
               'min-height:2.8rem'
      });
      b.addEventListener('click', press.bind(null, r, c));
      b.addEventListener('focus', function (rr, cc) {
        return function () { focusR = rr; focusC = cc; paint(); };
      }(r, c));
      buttons[r][c] = b;
      grid.appendChild(b);
    }
  });
  el.appendChild(grid);

  var counter = mk('p', { 'class': 'small', role: 'status', 'aria-live': 'polite' },
    'Moves: 0');
  el.appendChild(counter);
  var live = mk('p', { 'class': 'small', role: 'status', 'aria-live': 'polite' });
  el.appendChild(live);

  grid.addEventListener('keydown', onGridKey);

  var controls = mk('div', { 'class': 'row' });
  var reset = mk('button', { type: 'button', 'class': 'btn ghost small' }, 'Reset');
  reset.addEventListener('click', resetGrid);
  controls.appendChild(reset);
  el.appendChild(controls);

  var skip = mk('button', { type: 'button', 'class': 'btn ghost small', hidden: '' },
    'Skip puzzle (no XP)');
  skip.addEventListener('click', function () { finish('skip'); });
  var back = mk('button', { type: 'button', 'class': 'btn ghost small' }, 'Back');
  back.addEventListener('click', function () { finish(false); });
  el.appendChild(skip); el.appendChild(back);

  function onGridKey(e) {
    var dr = 0, dc = 0;
    if (e.key === 'ArrowUp') dr = -1;
    else if (e.key === 'ArrowDown') dr = 1;
    else if (e.key === 'ArrowLeft') dc = -1;
    else if (e.key === 'ArrowRight') dc = 1;
    else return;
    e.preventDefault();
    focusR = Math.max(0, Math.min(SIZE - 1, focusR + dr));
    focusC = Math.max(0, Math.min(SIZE - 1, focusC + dc));
    paint();
    buttons[focusR][focusC].focus();
  }

  function allDark() {
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) if (cells[r][c]) return false;
    }
    return true;
  }

  function paint() {
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        var lit = cells[r][c] === 1, b = buttons[r][c];
        b.textContent = lit ? '●' : '·';
        b.setAttribute('aria-pressed', lit ? 'true' : 'false');
        b.setAttribute('aria-label', 'Row ' + (r + 1) + ', column ' + (c + 1) + ', ' +
          (lit ? 'lit' : 'dark'));
        b.setAttribute('tabindex', (r === focusR && c === focusC) ? '0' : '-1');
        b.style.background = lit ? 'var(--accent)' : 'transparent';
        b.style.color = lit ? '#071030' : 'var(--soft)';
      }
    }
    counter.textContent = 'Moves: ' + moves;
  }

  function press(r, c) {
    if (stopped || solving) return;
    focusR = r; focusC = c;
    cells[r][c] ^= 1;
    if (r > 0) cells[r - 1][c] ^= 1;
    if (r < SIZE - 1) cells[r + 1][c] ^= 1;
    if (c > 0) cells[r][c - 1] ^= 1;
    if (c < SIZE - 1) cells[r][c + 1] ^= 1;
    moves += 1;
    paint();
    if (allDark()) {
      winNow();
      return;
    }
    if (moves >= SKIP_AT && skip.hidden) {
      skip.hidden = false;
      live.textContent = 'A bypass has unlocked.';
    }
  }

  function winNow() {
    solving = true;
    live.textContent = 'Every light is out. The vault opens.';
    grid.querySelectorAll('button').forEach(function (b) { b.disabled = true; });
    reset.disabled = true; skip.disabled = true; back.disabled = true;
    timer = setTimeout(function () { finish(true); }, 1000);
  }

  function resetGrid() {
    if (stopped || solving) return;
    cells = START.map(function (line) { return line.split('').map(Number); });
    moves = 0;
    paint();
    live.textContent = 'Lamps restored to their starting pattern.';
  }

  function finish(ok) {
    if (stopped) return;
    stopped = true; clearTimeout(timer);
    grid.removeEventListener('keydown', onGridKey);
    grid.querySelectorAll('button').forEach(function (b) { b.disabled = true; });
    reset.disabled = true; skip.disabled = true; back.disabled = true;
    done({ solved: ok === true, skipped: ok === 'skip' });
  }

  paint();
}
