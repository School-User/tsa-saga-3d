// Docking ring: watch the sequence light up, then repeat it on the four pads.
// Every pad has its own colour AND its own shape, so the pattern is never colour-only.
var SECRET = [3, 1, 4, 2, 3];
var FAIL_AT = 3;
var PADS = [
  { n: 1, colour: '#ff7a8a', shape: 'circle', shapeName: 'red circle' },
  { n: 2, colour: '#ffb454', shape: 'triangle', shapeName: 'amber triangle' },
  { n: 3, colour: '#5be3a1', shape: 'square', shapeName: 'green square' },
  { n: 4, colour: '#7fb2ff', shape: 'diamond', shapeName: 'blue diamond' }
];

function mk(tag, attrs, text) {
  var e = document.createElement(tag);
  Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
  if (text !== undefined) e.textContent = text;
  return e;
}

// Build the geometric cue: a circle, triangle, square or diamond.
function makeShape(kind, colour) {
  var s = document.createElement('span');
  s.setAttribute('aria-hidden', 'true');
  s.style.display = 'inline-block';
  s.style.flex = '0 0 auto';
  s.style.marginRight = '.55rem';
  if (kind === 'circle') {
    s.style.width = '1.3rem'; s.style.height = '1.3rem';
    s.style.borderRadius = '50%'; s.style.background = colour;
  } else if (kind === 'square') {
    s.style.width = '1.2rem'; s.style.height = '1.2rem';
    s.style.borderRadius = '.15rem'; s.style.background = colour;
  } else if (kind === 'diamond') {
    s.style.width = '1rem'; s.style.height = '1rem';
    s.style.transform = 'rotate(45deg)'; s.style.background = colour;
    s.style.marginLeft = '.15rem';
  } else {
    s.style.width = '0'; s.style.height = '0';
    s.style.borderLeft = '.75rem solid transparent';
    s.style.borderRight = '.75rem solid transparent';
    s.style.borderBottom = '1.25rem solid ' + colour;
  }
  return s;
}

export function start(el, ctx, done) {
  var sci = !!(ctx && typeof ctx.stat === 'function' && ctx.stat('sci') >= 4);
  var stepMs = sci ? 1100 : 700;
  var entry = [], failures = 0;
  var stopped = false, solving = false, playing = false, manualStep = null;
  var timers = [];

  el.appendChild(mk('h2', {}, 'Pad memory'));
  el.appendChild(mk('p', { 'class': 'small' },
    'The panel keeps a five-step access sequence. Watch it light the pads, then press the ' +
    'same pads in the same order. Watch plays continuously. Step through reveals one cue at a time ' +
    'and waits for you. You can replay either way. A wrong pad clears your entry.'));

  var status = mk('p', { 'class': 'small',
    role: 'status' }, 'Ready to replay.');
  el.appendChild(status);

  var padBox = mk('div', { role: 'group', 'aria-label': 'Four memory pads',
    style: 'display:flex;flex-wrap:wrap;gap:.6rem;margin:.6rem 0' });
  var pads = [];
  PADS.forEach(function (info) {
    var b = mk('button', { type: 'button', 'class': 'btn ghost',
      style: 'display:flex;align-items:center;min-width:7.5rem',
      'aria-label': 'Pad ' + info.n + ', ' + info.shapeName }, 'Pad ' + info.n);
    b.insertBefore(makeShape(info.shape, info.colour), b.firstChild);
    b.addEventListener('click', function () { press(info.n); });
    pads.push(b);
    padBox.appendChild(b);
  });
  el.appendChild(padBox);

  var entryLine = mk('p', { 'class': 'small' });
  var entryLabel = mk('span', {});
  entryLine.appendChild(entryLabel);
  var dots = mk('span', { 'aria-hidden': 'true' });
  entryLine.appendChild(dots);
  el.appendChild(entryLine);

  var live = mk('p', { 'class': 'small', role: 'status', 'aria-live': 'polite' });
  el.appendChild(live);

  var watch = mk('button', { type: 'button', 'class': 'btn' }, 'Watch');
  watch.addEventListener('click', beginWatch);
  var steps = mk('button', { type: 'button', 'class': 'btn ghost' }, 'Step through');
  steps.addEventListener('click', nextCue);

  var skip = mk('button', { type: 'button', 'class': 'btn ghost small', hidden: '' },
    'Skip puzzle (no XP)');
  skip.addEventListener('click', function () { finish('skip'); });
  var back = mk('button', { type: 'button', 'class': 'btn ghost small' }, 'Back');
  back.addEventListener('click', function () { finish('back'); });
  var controls = mk('div', { 'class': 'puzzle-controls' });
  controls.append(watch, steps, skip, back);
  el.appendChild(controls);

  function later(fn, ms) {
    var t = setTimeout(fn, ms);
    timers.push(t);
    return t;
  }

  function paintDots() {
    var marks = [0, 1, 2, 3, 4].map(function (i) {
      return i < entry.length ? '●' : '○';
    });
    dots.textContent = marks.join(' ');
    entryLabel.textContent = 'Your entry (' + entry.length + ' of ' + SECRET.length + '): ';
  }

  function cueAt(index) {
    var pad = PADS[SECRET[index] - 1];
    status.textContent = 'Cue ' + (index + 1) + ' of ' + SECRET.length +
      ' · Pad ' + pad.n + ', ' + pad.shapeName + '.';
    pads.forEach(function (control, i) {
      control.classList.toggle('memory-cue', i + 1 === pad.n);
    });
  }

  function readyToEnter() {
    playing = false;
    manualStep = null;
    watch.removeAttribute('aria-disabled');
    steps.removeAttribute('aria-disabled');
    steps.textContent = 'Step through';
    setPadsEnabled(true);
    pads.forEach(function (pad) { pad.classList.remove('memory-cue'); });
    status.textContent = 'Repeat the sequence on the pads.';
    if (document.activeElement === watch || document.activeElement === steps) pads[0].focus();
  }

  function setPadsEnabled(on) {
    pads.forEach(function (p) { p.disabled = !on; });
  }

  function beginWatch() {
    if (stopped || solving || playing || manualStep !== null) return;
    playing = true;
    entry = [];
    paintDots();
    live.textContent = '';
    watch.setAttribute('aria-disabled', 'true');
    steps.setAttribute('aria-disabled', 'true');
    setPadsEnabled(false);
    var i = 0;
    function step() {
      if (stopped) return;
      if (i >= SECRET.length) {
        readyToEnter();
        return;
      }
      cueAt(i);
      i += 1;
      later(step, stepMs);
    }
    later(step, 350);
  }

  function nextCue() {
    if (stopped || solving || playing) return;
    if (manualStep === null) {
      manualStep = 0;
      entry = [];
      paintDots();
      live.textContent = '';
      setPadsEnabled(false);
      watch.setAttribute('aria-disabled', 'true');
    }
    if (manualStep === SECRET.length) {
      readyToEnter();
      return;
    }
    cueAt(manualStep++);
    steps.textContent = manualStep === SECRET.length ? 'Enter sequence' : 'Next cue';
  }

  function press(n) {
    if (stopped || solving || playing || manualStep !== null) return;
    entry.push(n);
    paintDots();
    var at = entry.length - 1;
    if (entry[at] !== SECRET[at]) {
      entry = [];
      paintDots();
      failures += 1;
      live.textContent = 'That pad is not next in the sequence. Entry cleared. (Attempt ' +
        failures + ' of ' + FAIL_AT + '.)';
      if (failures >= FAIL_AT) {
        skip.hidden = false;
        live.textContent += ' A bypass has unlocked.';
      }
      return;
    }
    status.textContent = 'Pad ' + n + ' accepted. ' + entry.length + ' of ' + SECRET.length + '.';
    if (entry.length === SECRET.length) {
      solving = true;
      watch.disabled = true;
      steps.disabled = true;
      setPadsEnabled(false);
      skip.disabled = true;
      back.disabled = true;
      live.textContent = 'Sequence accepted. The docking ring answers with a steady glow.';
      later(function () { finish('solved'); }, 1000);
    }
  }

  function finish(kind) {
    if (stopped) return;
    stopped = true;
    timers.forEach(clearTimeout);
    timers = [];
    pads.forEach(function (pad) { pad.classList.remove('memory-cue'); });
    skip.disabled = true;
    back.disabled = true;
    watch.disabled = true;
    steps.disabled = true;
    done(kind === 'skip' ? { solved: false, skipped: true } : { solved: kind === 'solved' });
  }

  paintDots();
}
