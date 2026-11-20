// Botanist rota: give each botanist a greenhouse so no two share one and every clue holds.
// The one arrangement that fits all four clues is Ana=Vine, Bo=Moss, Cy=Dome.
var PEOPLE = ['Ana', 'Bo', 'Cy'];
var PLACES = ['Dome', 'Vine', 'Moss'];
var ANSWER = { Ana: 'Vine', Bo: 'Moss', Cy: 'Dome' };
var CLUES = [
  'Ana does not tend Moss.',
  'Bo does not tend Dome.',
  'Cy does not tend Vine.',
  'Cy does not tend Moss.'
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
  var failures = 0, stopped = false, solving = false, timer;
  var selects = {};

  el.appendChild(mk('h2', {}, 'Greenhouse rota'));
  el.appendChild(mk('p', { 'class': 'small' },
    'Three botanists, three greenhouses. Each tends a different one. Read the clues, then ' +
    'fill in the rota and check it.'));

  if (sci) {
    el.appendChild(mk('p', { 'class': 'small' }, 'Hint: Start with Cy: two clues are about him.'));
  }

  var clueList = mk('ul', { 'class': 'small', 'aria-label': 'Clues' });
  CLUES.forEach(function (clue) { clueList.appendChild(mk('li', {}, clue)); });
  el.appendChild(clueList);

  var form = mk('div', { 'class': 'row', style: 'flex-direction:column;align-items:stretch' });
  PEOPLE.forEach(function (who, i) {
    var row = mk('div', { 'class': 'row' });
    var label = mk('span', { 'class': 'statname' }, who);
    var id = 'assign-' + who.toLowerCase();
    label.setAttribute('id', id + '-label');
    var select = mk('select', {
      id: 'assign-' + i, 'aria-labelledby': id + '-label',
      style: 'font:inherit;color:var(--fg);background:var(--panel);border:2px solid var(--line);' +
             'border-radius:.5rem;padding:.4rem .6rem;min-width:9rem'
    });
    PLACES.forEach(function (place) {
      select.appendChild(mk('option', { value: place }, place));
    });
    select.value = PLACES[i];
    selects[who] = select;
    row.appendChild(label); row.appendChild(select);
    form.appendChild(row);
  });
  el.appendChild(form);

  var live = mk('p', { 'class': 'small', role: 'status', 'aria-live': 'polite' });
  el.appendChild(live);

  var check = mk('button', { type: 'button', 'class': 'btn' }, 'Check');
  check.addEventListener('click', verify);
  el.appendChild(check);

  var skip = mk('button', { type: 'button', 'class': 'btn ghost small', hidden: '' },
    'Skip puzzle (no XP)');
  skip.addEventListener('click', function () { finish('skip'); });
  var back = mk('button', { type: 'button', 'class': 'btn ghost small' }, 'Back');
  back.addEventListener('click', function () { finish(false); });
  el.appendChild(skip); el.appendChild(back);

  function lock() {
    PEOPLE.forEach(function (who) { selects[who].disabled = true; });
    check.disabled = true; skip.disabled = true; back.disabled = true;
  }

  function verify() {
    if (stopped || solving) return;
    var picks = {}, ok = true;
    PEOPLE.forEach(function (who) {
      var place = selects[who].value;
      if (picks[place]) ok = false;
      picks[place] = true;
      if (ANSWER[who] !== place) ok = false;
    });
    if (ok) {
      solving = true;
      lock();
      live.textContent = 'Ana takes Vine, Bo takes Moss, Cy takes Dome. The rota holds.';
      timer = setTimeout(function () { finish(true); }, 1000);
      return;
    }
    failures += 1;
    live.textContent = 'Something in the rota is still wrong. (Attempt ' + failures +
      ' of ' + FAIL_AT + '.)';
    if (failures >= FAIL_AT) {
      skip.hidden = false;
      live.textContent += ' A bypass has unlocked.';
    }
  }

  function finish(ok) {
    if (stopped) return;
    stopped = true; clearTimeout(timer);
    lock();
    done({ solved: ok === true, skipped: ok === 'skip' });
  }

  live.textContent = 'Choose a greenhouse for each botanist.';
}
