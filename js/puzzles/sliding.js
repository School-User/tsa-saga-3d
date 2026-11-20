// Dome return pipes: move the numbered pipe sections into order around the empty socket.
// The starting board is twelve moves from solved.
var START = [1, 8, 2, 4, 0, 5, 7, 3, 6];
var GOAL = [1, 2, 3, 4, 5, 6, 7, 8, 0];
var SKIP_AT = 40;

function mk(tag, attrs, text) {
  var e = document.createElement(tag);
  Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
  if (text !== undefined) e.textContent = text;
  return e;
}

export function start(el, ctx, done) {
  var eng = !!(ctx && typeof ctx.stat === 'function' && ctx.stat('eng') >= 4);
  var board = START.slice(), buttons = [], moves = 0;
  var stopped = false, solving = false, timer;
  var focusAt = 1;

  el.appendChild(mk('h2', {}, 'Dome return pipes'));
  el.appendChild(mk('p', { 'class': 'small' },
    'The pipe sections slipped loose. Slide them around the empty socket until they ' +
    'read 1 to 8 left to right, top to bottom, with the empty socket at bottom right. ' +
    'Only tiles above, below or beside the socket can slide. Use arrow keys to focus a tile and Enter or Space to slide it.'));

  if (eng) {
    el.appendChild(mk('p', { 'class': 'small' }, 'Hint: Count the moves: twelve is enough.'));
  }

  var grid = mk('div', {
    role: 'group', 'aria-label': 'Pipe frame, 3 rows by 3 columns',
    style: 'display:grid;grid-template-columns:repeat(3,minmax(3.4rem,4rem));gap:.4rem;' +
           'margin:.75rem 0;max-width:13rem'
  });

  for (var i = 0; i < 9; i++) {
    var b = mk('button', {
      type: 'button', 'class': 'pipe-section',
      style: 'font:inherit;font-size:1.3rem;font-weight:600;padding:.8rem 0;' +
             'border:2px solid var(--line);border-radius:.6rem;min-height:3.2rem;cursor:pointer'
    });
    b.addEventListener('click', press.bind(null, i));
    b.addEventListener('focus', function (idx) {
      return function () { focusAt = idx; paint(); };
    }(i));
    buttons[i] = b;
    grid.appendChild(b);
  }
  el.appendChild(grid);

  var counter = mk('p', { 'class': 'small', role: 'status', 'aria-live': 'polite' }, 'Moves: 0');
  el.appendChild(counter);
  var live = mk('p', { 'class': 'small', role: 'status', 'aria-live': 'polite' });
  el.appendChild(live);

  grid.addEventListener('keydown', onGridKey);

  var controls = mk('div', { 'class': 'row' });
  var reset = mk('button', { type: 'button', 'class': 'btn ghost small' }, 'Reset');
  reset.addEventListener('click', resetBoard);
  controls.appendChild(reset);
  el.appendChild(controls);

  var skip = mk('button', { type: 'button', 'class': 'btn ghost small', hidden: '' },
    'Skip puzzle (no XP)');
  skip.addEventListener('click', function () { finish('skip'); });
  var back = mk('button', { type: 'button', 'class': 'btn ghost small' }, 'Back');
  back.addEventListener('click', function () { finish(solving); });
  el.appendChild(skip); el.appendChild(back);

  function gap() { return board.indexOf(0); }

  function adjacent(i) {
    var g = gap(), dr = Math.abs((i / 3 | 0) - (g / 3 | 0));
    var dc = Math.abs((i % 3) - (g % 3));
    return dr + dc === 1;
  }

  function onGridKey(e) {
    var idx = focusAt, r = idx / 3 | 0, c = idx % 3;
    if (e.key === 'ArrowUp') r = Math.max(0, r - 1);
    else if (e.key === 'ArrowDown') r = Math.min(2, r + 1);
    else if (e.key === 'ArrowLeft') c = Math.max(0, c - 1);
    else if (e.key === 'ArrowRight') c = Math.min(2, c + 1);
    else return;
    e.preventDefault();
    focusAt = r * 3 + c;
    paint();
    buttons[focusAt].focus();
  }

  function paint() {
    for (var i = 0; i < 9; i++) {
      var b = buttons[i], tile = board[i], canMove = tile !== 0 && adjacent(i);
      var location = 'Row ' + (Math.floor(i / 3) + 1) + ', column ' + (i % 3 + 1) + ': ';
      b.textContent = tile === 0 ? '' : String(tile);
      b.setAttribute('tabindex', i === focusAt ? '0' : '-1');
      b.style.cursor = canMove ? 'pointer' : 'default';
      b.style.borderColor = canMove ? 'var(--accent)' : 'var(--line)';
      b.style.background = tile === 0 ? '#0b1020' : 'var(--panel)';
      b.style.color = tile === 0 ? 'var(--soft)' : 'var(--fg)';
      b.setAttribute('aria-label', location + (tile === 0 ? 'Empty socket'
        : 'Tile ' + tile + ', ' + (canMove ? 'can move' : 'cannot move')));
      b.setAttribute('aria-disabled', String(!canMove));
    }
    counter.textContent = 'Moves: ' + moves;
  }

  function press(i) {
    if (stopped || solving) return;
    if (!adjacent(i)) return;
    var g = gap();
    board[g] = board[i];
    board[i] = 0;
    focusAt = i;
    moves += 1;
    paint();
    if (solved()) {
      winNow();
      return;
    }
    if (moves >= SKIP_AT && skip.hidden) {
      skip.hidden = false;
      live.textContent = 'A bypass has unlocked.';
    }
  }

  function solved() {
    for (var i = 0; i < 9; i++) if (board[i] !== GOAL[i]) return false;
    return true;
  }

  function winNow() {
    solving = true;
    live.textContent = 'The sections lock into order. Water flows to the dome.';
    buttons.forEach(function (b) { b.disabled = true; });
    reset.disabled = true; skip.disabled = true;
    timer = setTimeout(function () { finish(true); }, 1000);
  }

  function resetBoard() {
    if (stopped || solving) return;
    board = START.slice();
    moves = 0;
    focusAt = 1;
    paint();
    live.textContent = 'Tiles returned to their starting layout.';
  }

  function finish(ok) {
    if (stopped) return;
    stopped = true; clearTimeout(timer);
    grid.removeEventListener('keydown', onGridKey);
    buttons.forEach(function (b) { b.disabled = true; });
    reset.disabled = true; skip.disabled = true; back.disabled = true;
    done({ solved: ok === true, skipped: ok === 'skip' });
  }

  paint();
}
