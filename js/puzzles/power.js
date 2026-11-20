// Cryo Deck power routing: turn the conductor fittings until power reaches the door.
// Types: s source (fixed), d door (fixed), l straight, c corner, t tee, e empty socket (fixed).
// Arms are directions 0=N 1=E 2=S 3=W; rotating shifts every arm one step clockwise.
var BASE = { s: [1], d: [3], l: [0, 2], c: [0, 1], t: [0, 1, 2], e: [] };
var NAMES = { s: 'power source', d: 'pressure door', l: 'straight conduit',
              c: 'elbow conduit', t: 'branch conduit', e: 'empty socket' };

// ONE fixed hand-made layout, starting rotations included. Rotate clockwise only.
//   row 1: t0  e0  l1  e0  c2
//   row 2: e0  c3  l0  c1  t1
//   row 3: s0  c0  t2  c2  d0
//   row 4: c1  t3  l0  e0  c3
//   row 5: e0  c0  e0  t1  e0
// Solution, counted in clockwise turns from the layout above (1-based coords):
//   (3,2) 3 turns -> corner W+N, (2,2) 2 -> corner E+S, (2,3) 1 -> straight E-W,
//   (2,4) 1 -> corner S+W, (3,4) 2 -> corner N+E.   (9 turns total)
// Path: source (3,1) ->E (3,2) ->N (2,2) ->E (2,3) ->E (2,4) ->S (3,4) ->E door (3,5).
// That path is the only full route: every other fitting is a dead end or a decoy branch.
var LAYOUT = [
  ['t0', 'e0', 'l1', 'e0', 'c2'],
  ['e0', 'c3', 'l0', 'c1', 't1'],
  ['s0', 'c0', 't2', 'c2', 'd0'],
  ['c1', 't3', 'l0', 'e0', 'c3'],
  ['e0', 'c0', 'e0', 't1', 'e0']
];
var PATH = { '2,1': 1, '1,1': 1, '1,2': 1, '1,3': 1, '2,3': 1 }; // hint dots (0-based row,col)
var SRC = 10, DOOR = 14, LIMIT_MS = 180000, SKIP_AT = 12;

function mk(tag, attrs, text) {
  var e = document.createElement(tag);
  Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
  if (text !== undefined) e.textContent = text;
  return e;
}
function conns(t) { return BASE[t.type].map(function (d) { return (d + t.rot) % 4; }); }

export function start(el, ctx, done) {
  var hint = !!(ctx && typeof ctx.stat === 'function' && ctx.stat('eng') >= 5);
  var tiles = [], buttons = [], turns = 0, sel = 0, stopped = false, solving = false, timer;

  el.appendChild(mk('h2', {}, 'Power routing'));
  el.appendChild(mk('p', { 'class': 'small' },
    'Route power from Meridian’s cryo supply (IN) to the pressure door relay (OUT). ' +
    'Click a fitting, or focus it with the arrow keys and press Enter or Space, to turn it clockwise.' +
    (hint ? ' Faint dots mark the conductors on the live route.' : '')));
  el.appendChild(mk('p', { 'class': 'small' },
    'Example: one turn changes a vertical fitting (│) to horizontal (─).'));

  var count = mk('p', { 'class': 'small' }, 'Rotations: 0');
  el.appendChild(count);
  var live = mk('p', { 'class': 'small', role: 'status', 'aria-live': 'polite' });
  el.appendChild(live);

  var grid = mk('div', { role: 'group', 'aria-label': 'Power grid, five rows by five columns',
    style: 'display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:.35rem;' +
           'width:min(19rem,100%);margin:.5rem 0;' });
  el.appendChild(grid);
  var geom = ['left:38%;top:0;width:24%;height:50%', 'left:50%;top:38%;width:50%;height:24%',
              'left:38%;top:50%;width:24%;height:50%', 'left:0;top:38%;width:50%;height:24%'];

  for (var i = 0; i < 25; i++) {
    var r = Math.floor(i / 5), c = i % 5, spec = LAYOUT[r][c];
    var t = { type: spec.charAt(0), rot: Number(spec.charAt(1)), r: r, c: c };
    var fixed = t.type === 's' || t.type === 'd' || t.type === 'e';
    var b = mk('button', { type: 'button', tabindex: i === 0 ? '0' : '-1',
      'class': 'conduit-tile', style: 'position:relative;aspect-ratio:1;padding:0;border:2px solid var(--line);' +
             'border-radius:.4rem;background:#0d142a;touch-action:manipulation;' +
             (fixed ? 'border-style:dashed;cursor:default;' : 'cursor:pointer;') });
    t.arms = [];
    for (var k = 0; k < 4; k++) {
      var a = mk('div', { style: 'position:absolute;pointer-events:none;border:1px solid #c8e9ff52;background:#5b6a9c;' + geom[k] });
      b.appendChild(a); t.arms.push(a);
    }
    t.hub = mk('div', { style: 'position:absolute;left:34%;top:34%;width:32%;height:32%;' +
      'border-radius:50%;border:2px solid #c8e9ff77;background:#5b6a9c;pointer-events:none' });
    b.appendChild(t.hub);
    if (t.type === 's' || t.type === 'd') {
      b.appendChild(mk('span', { 'aria-hidden': 'true', style: 'position:absolute;left:0;right:0;' +
        'bottom:2px;font-size:.5rem;letter-spacing:.05em;color:var(--soft);pointer-events:none' },
        t.type === 's' ? 'IN' : 'OUT'));
    }
    if (hint && PATH[r + ',' + c]) {
      b.appendChild(mk('div', { style: 'position:absolute;left:4px;top:4px;width:5px;height:5px;' +
        'border-radius:50%;background:rgba(232,236,248,.5);pointer-events:none' }));
    }
    (function (index) {
      b.addEventListener('click', function () { rotate(index); });
      b.addEventListener('focus', function () {
        if (sel !== index) {
          buttons[sel].tabIndex = -1;
          sel = index;
          buttons[sel].tabIndex = 0;
        }
      });
      b.addEventListener('keydown', function (e) {
        var dirs = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3 };
        if (Object.prototype.hasOwnProperty.call(dirs, e.key)) {
          e.preventDefault(); moveFocus(index, dirs[e.key]);
        }
      });
    })(i);
    tiles.push(t); buttons.push(b); grid.appendChild(b);
  }

  function moveFocus(i, d) {
    var r = Math.floor(i / 5), c = i % 5;
    if (d === 0) r = Math.max(0, r - 1); else if (d === 2) r = Math.min(4, r + 1);
    else if (d === 1) c = Math.min(4, c + 1); else c = Math.max(0, c - 1);
    buttons[r * 5 + c].focus();
  }

  function power() {
    var on = [], q = [SRC], n;
    for (n = 0; n < 25; n++) on[n] = false;
    on[SRC] = true;
    while (q.length) {
      var i = q.shift(), row = Math.floor(i / 5), col = i % 5, cs = conns(tiles[i]);
      for (var k = 0; k < cs.length; k++) {
        var d = cs[k];
        var nr = row + (d === 0 ? -1 : d === 2 ? 1 : 0);
        var nc = col + (d === 3 ? -1 : d === 1 ? 1 : 0);
        if (nr < 0 || nr > 4 || nc < 0 || nc > 4) continue;
        var j = nr * 5 + nc;
        if (!on[j] && conns(tiles[j]).indexOf((d + 2) % 4) !== -1) { on[j] = true; q.push(j); }
      }
    }
    return on;
  }

  function label(t, on) {
    var fixed = t.type === 's' || t.type === 'd' || t.type === 'e';
    return 'Row ' + (t.r + 1) + ', column ' + (t.c + 1) + ': ' + NAMES[t.type] +
      (t.type === 'e' ? '' : ', connects ' + conns(t).map(function (d) { return ['north', 'east', 'south', 'west'][d]; }).join(' and ')) +
      ', ' + (on ? 'powered' : 'no power') + (hint && PATH[t.r + ',' + t.c] ? ', on the live route' : '') +
      (fixed ? '. Fixed.' : '. Press Enter or Space to rotate.');
  }

  function paint() {
    var on = power();
    for (var i = 0; i < 25; i++) {
      var t = tiles[i], b = buttons[i], cs = conns(t), lit = on[i];
      b.style.background = lit ? '#16294a' : '#0d142a';
      b.style.borderColor = lit ? 'var(--good)' : 'var(--line)';
      for (var k = 0; k < 4; k++) {
        t.arms[k].style.display = cs.indexOf(k) === -1 ? 'none' : 'block';
        t.arms[k].style.background = lit ? 'var(--good)' : '#5b6a9c';
      }
      t.hub.style.background = lit ? 'var(--good)'
        : (t.type === 's' || t.type === 'd' ? 'var(--accent)' : '#5b6a9c');
      b.setAttribute('aria-label', label(t, lit));
    }
    if (on[DOOR] && !solving && !stopped) solve();
  }

  function finish(ok) {
    if (stopped) return;
    stopped = true; clearTimeout(timer);
    done({ solved: ok === true, skipped: ok === 'skip' });
  }

  function solve() {
    solving = true; clearTimeout(timer);
    skip.disabled = true; back.disabled = true;
    live.textContent = 'Power reaches the door.';
    setTimeout(function () { finish(true); }, 1000);
  }

  function rotate(i) {
    if (stopped || solving) return;
    var t = tiles[i];
    if (t.type === 'e') { live.textContent = 'That socket is empty.'; return; }
    if (t.type === 's' || t.type === 'd') { live.textContent = 'That terminal is fixed.'; return; }
    t.rot = (t.rot + 1) % 4; turns += 1;
    count.textContent = 'Rotations: ' + turns;
    if (turns >= SKIP_AT && skip.hidden) {
      skip.hidden = false;
      live.textContent = 'A bypass has unlocked.';
    }
    paint();
  }

  var controls = mk('div', { 'class': 'row' });
  var skip = mk('button', { type: 'button', 'class': 'btn ghost small', hidden: '' },
    'Skip puzzle (no XP)');
  skip.addEventListener('click', function () { finish('skip'); });
  var back = mk('button', { type: 'button', 'class': 'btn ghost small' }, 'Back');
  back.addEventListener('click', function () { finish(false); });
  controls.appendChild(skip); controls.appendChild(back);
  el.appendChild(controls);

  timer = setTimeout(function () {
    live.textContent = 'The console is stuck. You can skip it now, with no XP.';
    skip.hidden = false;
  }, LIMIT_MS);

  paint();
}
