// Life support balance: nine identical crates, one heavier. Weigh at most three times.
// Any pan may hold any number of crates; an empty pan is refused rather than weighed.
var HEAVY = 7;
var MAX_WEIGHS = 3;
var FAIL_AT = 3;

function mk(tag, attrs, text) {
  var e = document.createElement(tag);
  Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
  if (text !== undefined) e.textContent = text;
  return e;
}

export function start(el, ctx, done) {
  var sci = !!(ctx && typeof ctx.stat === 'function' && ctx.stat('sci') >= 4);
  var crates = [];
  var weighings = 0, failures = 0, chosen = 0;
  var phase = 'weigh';            // 'weigh' -> 'locked' -> 'name' -> solved
  var stopped = false, solving = false;
  var timers = [];

  el.appendChild(mk('h2', {}, 'Nine-crate balance'));
  el.appendChild(mk('p', { 'class': 'small' },
    'Nine crates look identical and one of them is heavier. Put crates on the left and ' +
    'right pans and weigh. You get ' + MAX_WEIGHS + ' weighings, then you must name the ' +
    'heavy crate. Press a crate to move it: off, left pan, right pan. Any number of crates ' +
    'per pan is allowed, but both pans need at least one.'));
  if (sci) {
    el.appendChild(mk('p', { 'class': 'small' }, 'Hint: Try three against three first.'));
  }

  var crateBox = mk('div', { role: 'group', 'aria-label': 'Crates',
    style: 'display:flex;flex-wrap:wrap;gap:.5rem;margin:.75rem 0' });
  for (var n = 1; n <= 9; n += 1) {
    (function (num) {
      var c = { n: num, pan: 0, btn: null };
      var b = mk('button', { type: 'button', 'class': 'btn ghost',
        style: 'min-width:3.6rem' }, String(num));
      b.addEventListener('click', function () { cycle(c); });
      c.btn = b;
      crates.push(c);
      crateBox.appendChild(b);
    })(n);
  }
  el.appendChild(crateBox);

  var pansLine = mk('p', { 'class': 'small' });
  el.appendChild(pansLine);

  var weighRow = mk('div', { 'class': 'row' });
  var weighBtn = mk('button', { type: 'button', 'class': 'btn' }, 'Weigh');
  weighBtn.addEventListener('click', weigh);
  var countLine = mk('span', { 'class': 'small' }, 'Weighings: 0 of ' + MAX_WEIGHS);
  weighRow.appendChild(weighBtn);
  weighRow.appendChild(countLine);
  el.appendChild(weighRow);

  var nameRow = mk('div', { 'class': 'row' });
  var nameBtn = mk('button', { type: 'button', 'class': 'btn', hidden: '' },
    'Name the heavy crate');
  nameBtn.addEventListener('click', beginNaming);
  nameRow.appendChild(nameBtn);
  el.appendChild(nameRow);

  var live = mk('p', { 'class': 'small', role: 'status', 'aria-live': 'polite' });
  el.appendChild(live);

  // Naming phase: shown once all three weighings are spent.
  var naming = mk('div', { style: 'display:none' });
  naming.appendChild(mk('p', { 'class': 'small' }, 'Name the heavy crate:'));
  var pickBox = mk('div', { role: 'group', 'aria-label': 'Name the heavy crate',
    style: 'display:flex;flex-wrap:wrap;gap:.5rem;margin:.4rem 0' });
  var picks = [];
  for (var m = 1; m <= 9; m += 1) {
    (function (num) {
      var p = mk('button', { type: 'button', 'class': 'btn ghost small',
        'aria-pressed': 'false', 'aria-label': 'Crate ' + num }, String(num));
      p.addEventListener('click', function () { pick(num); });
      picks.push(p);
      pickBox.appendChild(p);
    })(m);
  }
  naming.appendChild(pickBox);
  var confirm = mk('button', { type: 'button', 'class': 'btn' }, 'Confirm');
  confirm.addEventListener('click', confirmName);
  naming.appendChild(confirm);
  el.appendChild(naming);

  var skip = mk('button', { type: 'button', 'class': 'btn ghost small', hidden: '' },
    'Skip puzzle (no XP)');
  skip.addEventListener('click', function () { finish('skip'); });
  var back = mk('button', { type: 'button', 'class': 'btn ghost small' }, 'Back');
  back.addEventListener('click', function () { finish('back'); });
  el.appendChild(skip); el.appendChild(back);

  function later(fn, ms) {
    var t = setTimeout(fn, ms);
    timers.push(t);
    return t;
  }

  function paint() {
    var left = [], right = [];
    crates.forEach(function (c) {
      if (c.pan === 1) left.push(c.n);
      if (c.pan === 2) right.push(c.n);
      c.btn.textContent = c.pan === 0 ? String(c.n) : c.n + (c.pan === 1 ? '  L' : '  R');
      c.btn.setAttribute('aria-label', 'Crate ' + c.n +
        (c.pan === 0 ? ', off the pans' : c.pan === 1 ? ', on the left pan' : ', on the right pan') +
        (phase === 'weigh' ? '. Press to move it' : ''));
      c.btn.disabled = phase !== 'weigh';
    });
    pansLine.textContent = 'Left pan: ' + (left.length ? left.join(', ') : 'empty') +
      '  ·  Right pan: ' + (right.length ? right.join(', ') : 'empty');
    countLine.textContent = 'Weighings: ' + weighings + ' of ' + MAX_WEIGHS;
    weighBtn.disabled = phase !== 'weigh';
    nameBtn.hidden = !(phase === 'locked' || (phase === 'weigh' && weighings >= 1));
    naming.style.display = phase === 'name' || phase === 'done' ? 'block' : 'none';
  }

  function cycle(c) {
    if (stopped || solving || phase !== 'weigh') return;
    c.pan = (c.pan + 1) % 3;
    paint();
  }

  function weigh() {
    if (stopped || solving || phase !== 'weigh') return;
    var left = [], right = [];
    crates.forEach(function (c) {
      if (c.pan === 1) left.push(c.n);
      if (c.pan === 2) right.push(c.n);
    });
    if (!left.length || !right.length) {
      live.textContent = 'Place at least one crate on each pan before weighing. ' +
        'Nothing was counted.';
      return;
    }
    weighings += 1;
    // A normal crate weighs two units and the heavy crate weighs three.
    var leftWeight = 2 * left.length + (left.indexOf(HEAVY) !== -1 ? 1 : 0);
    var rightWeight = 2 * right.length + (right.indexOf(HEAVY) !== -1 ? 1 : 0);
    var result = leftWeight > rightWeight ? 'the left pan sinks. It is heavier.'
      : rightWeight > leftWeight ? 'the right pan sinks. It is heavier.'
      : 'the pans balance.';
    live.textContent = 'Weighing ' + weighings + ' of ' + MAX_WEIGHS + ': ' + result;
    if (weighings >= MAX_WEIGHS) {
      phase = 'locked';
      live.textContent += ' The balance locks. Press "Name the heavy crate" when you are ready.';
    }
    paint();
  }

  function beginNaming() {
    if (stopped || solving || !(phase === 'locked' || (phase === 'weigh' && weighings >= 1))) return;
    phase = 'name';
    paint();
    live.textContent = 'Pick the crate you think is heavy, then Confirm.';
  }

  function pick(num) {
    if (stopped || solving || phase !== 'name') return;
    chosen = num;
    picks.forEach(function (p, i) {
      p.setAttribute('aria-pressed', i + 1 === num ? 'true' : 'false');
    });
  }

  function confirmName() {
    if (stopped || solving || phase !== 'name') return;
    if (!chosen) {
      live.textContent = 'Choose one crate to name first.';
      return;
    }
    if (chosen === HEAVY) {
      solving = true;
      phase = 'done';
      paint();
      confirm.disabled = true;
      picks.forEach(function (p) { p.disabled = true; });
      skip.disabled = true;
      back.disabled = true;
      live.textContent = 'Crate ' + chosen + ' is the heavy one. The load balances at last.';
      later(function () { finish('solved'); }, 1000);
      return;
    }
    var guess = chosen;
    failures += 1;
    chosen = 0;
    weighings = 0;
    phase = 'weigh';
    picks.forEach(function (p) { p.setAttribute('aria-pressed', 'false'); });
    paint();
    live.textContent = 'Crate ' + guess + ' was not the heavy one — the balance resets. ' +
      '(' + failures + ' of ' + FAIL_AT + ' failed attempts.)';
    if (failures >= FAIL_AT) {
      skip.hidden = false;
      live.textContent += ' A bypass has unlocked.';
    }
  }

  function finish(kind) {
    if (stopped) return;
    stopped = true;
    timers.forEach(clearTimeout);
    timers = [];
    crates.forEach(function (c) { c.btn.disabled = true; });
    picks.forEach(function (p) { p.disabled = true; });
    weighBtn.disabled = true;
    nameBtn.disabled = true;
    confirm.disabled = true;
    skip.disabled = true;
    back.disabled = true;
    done(kind === 'skip' ? { solved: false, skipped: true } : { solved: kind === 'solved' });
  }

  paint();
}
