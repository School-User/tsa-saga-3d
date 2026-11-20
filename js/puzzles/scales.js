// Cargo bay balance: nine identical crates, one heavier. Weigh at most three times.
// Equal loads let each result rule out crates. Keep a visible record for deduction.
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
  var phase = 'weigh';
  var candidates = [], used = new Set();
  var history = mk('ol', { 'class': 'small', 'aria-label': 'Weighing record' });
  var stopped = false, solving = false;
  var timers = [];

  el.appendChild(mk('h2', {}, 'Freight balance'));
  el.appendChild(mk('p', { 'class': 'small' },
    'Nine crates look identical and one of them is heavier. Put crates on the left and ' +
    'right pans in equal numbers. Three different weighings must leave only one crate possible ' +
    'before you can name it. Press a crate to move it: off, left pan, right pan.'));
  if (sci) {
    el.appendChild(mk('p', { 'class': 'small' }, 'Hint: Try three against three first.'));
  }

  var crateBox = mk('div', { role: 'group', 'aria-label': 'Crates', 'class': 'crate-rack',
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

  var pansLine = mk('p', { 'class': 'small scene' });
  el.appendChild(pansLine);

  var weighRow = mk('div', { 'class': 'row' });
  var weighBtn = mk('button', { type: 'button', 'class': 'btn' }, 'Weigh');
  weighBtn.addEventListener('click', weigh);
  var countLine = mk('span', { 'class': 'small' }, 'Weighings: 0 of ' + MAX_WEIGHS);
  weighRow.appendChild(weighBtn);
  weighRow.appendChild(countLine);
  el.appendChild(weighRow);
  el.appendChild(history);

  var nameRow = mk('div', { 'class': 'row' });
  var nameBtn = mk('button', { type: 'button', 'class': 'btn', hidden: '' },
    'Name the heavy crate');
  nameBtn.addEventListener('click', beginNaming);
  nameRow.appendChild(nameBtn);
  var retry = mk('button', { type: 'button', 'class': 'btn ghost', hidden: '' }, 'Reset balance');
  retry.addEventListener('click', reset);
  nameRow.appendChild(retry);
  el.appendChild(nameRow);

  var live = mk('p', { 'class': 'small', role: 'status', 'aria-live': 'polite' });
  el.appendChild(live);

  // Keep the record visible while the player names a crate.
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
  back.addEventListener('click', function () { finish(solving ? 'solved' : 'back'); });
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
    nameBtn.hidden = phase !== 'locked';
    retry.hidden = phase !== 'retry';
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
    if (!left.length || left.length !== right.length) {
      live.textContent = 'Put the same number of crates on each pan. Nothing was counted.';
      return;
    }
    var key = [left.join(','), right.join(',')].sort().join('|');
    if (used.has(key)) {
      live.textContent = 'Those groups have already been compared. Nothing was counted.';
      return;
    }
    used.add(key);
    weighings += 1;
    function tilt(crate) {
      return Number(left.includes(crate)) - Number(right.includes(crate));
    }
    var reading = tilt(HEAVY);
    candidates = candidates.filter(function (crate) { return tilt(crate) === reading; });
    var result = reading > 0 ? 'the left pan sinks.'
      : reading < 0 ? 'the right pan sinks.' : 'the pans balance.';
    history.appendChild(mk('li', {}, left.join(', ') + ' vs ' + right.join(', ') + ': ' + result));
    live.textContent = 'Weighing ' + weighings + ': ' + result;
    if (weighings === MAX_WEIGHS) {
      if (candidates.length === 1) {
        phase = 'locked';
        live.textContent += ' Check your record and name the heavy crate.';
      } else fail('The record still fits multiple crates.');
    }
    paint();
    if (phase === 'locked') nameBtn.focus();
    if (phase === 'retry') retry.focus();
  }

  function beginNaming() {
    if (stopped || solving || phase !== 'locked') return;
    phase = 'name';
    paint();
    live.textContent = 'Pick the crate you think is heavy, then Confirm.';
    picks[0].focus();
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
    if (chosen === candidates[0]) {
      solving = true;
      phase = 'done';
      paint();
      confirm.disabled = true;
      picks.forEach(function (p) { p.disabled = true; });
      skip.disabled = true;
      live.textContent = 'Crate ' + chosen + ' is the heavy one. The load balances at last.';
      later(function () { finish('solved'); }, 1000);
      return;
    }
    fail('That crate does not fit your record.');
    paint();
    retry.focus();
  }

  function fail(text) {
    phase = 'retry';
    failures += 1;
    live.textContent = text + ' Reset the balance to make a new record.';
    if (failures >= FAIL_AT) {
      skip.hidden = false;
      live.textContent += ' A bypass has unlocked.';
    }
  }

  function reset() {
    if (phase !== 'retry') return;
    chosen = 0;
    weighings = 0;
    phase = 'weigh';
    candidates = crates.map(function (crate) { crate.pan = 0; return crate.n; });
    used.clear();
    history.textContent = '';
    picks.forEach(function (p) { p.setAttribute('aria-pressed', 'false'); });
    live.textContent = 'The pans are clear.';
    paint();
    crates[0].btn.focus();
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

  candidates = crates.map(function (crate) { return crate.n; });
  paint();
}
