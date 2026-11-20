import { chapters, classes, items, companions, chapterAt, roomAt } from './story/data.js';
import * as state from './state.js';
import { d20, resolveCheck } from './checks.js';
import { openDialogue, nodeChoices, choiceAvailable, followChoice, advanceDialogue } from './dialogue.js';
import { puzzles } from './puzzles/index.js';
import { createWorld } from './world/view.js';
import { get, el, button } from './ui/dom.js';
import { createModal } from './ui/modal.js';
import { showTitle, showClasses, showChapter, showFinale } from './ui/screens.js';
import { initializeHud, showRoomHud, updateHud, setPrompt } from './ui/room.js';
import { openPanel } from './ui/panels.js';
import { showDialogue } from './ui/dialogue.js';

const test = new URLSearchParams(location.search).get('test') === '1';
const root = get('screen');
const roomScreen = get('room-screen');
const canvas = get('world');
const focusDefault = () => roomScreen.hidden ? root.querySelector('h1') : get('room-title');
const modal = createModal(focusDefault, () => world?.cancel());
const storage = getStorage();
let run = state.loadRun(storage);
if (run && !classes.some(background => background.id === run.classId)) run = null;
let world = null;
let room = null;
let forcedRoll = null;
let activePuzzle = null;
let saved = true;

function getStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function persist() {
  saved = state.saveRun(storage, run);
  get('save-warning').hidden = saved;
}

function refresh() {
  world?.update(run);
  updateHud(room, run);
  if (run.points) {
    get('rank-panel').append(button('Spend points', () => panel('training'), 'btn ghost small'));
  }
}

function titleScreen() {
  modal.close();
  room = null;
  roomScreen.hidden = true;
  root.hidden = false;
  get('app').dataset.chapter = '1';
  showTitle(root, run, actions);
}

const actions = {
  title: titleScreen,
  resume: render,
  newGame() {
    if (!run) return showClasses(root, actions);
    modal.open('reset', 'Start a new run?', content => {
      content.append(el('p', '', 'Confirming a new background will replace this saved voyage.'));
      content.append(button('Choose a new background', () => {
        modal.close();
        showClasses(root, actions);
      }, 'btn primary'), button('Back', modal.close));
    }, modal.close);
  },
  start(background) {
    run = state.newRun(background);
    transition();
  },
  select(chapter) {
    state.enterChapter(run, chapter, chapterAt(chapter).levels[0].id);
    transition();
  },
  begin() {
    state.enterRoom(run, chapterAt(run.chapter).levels[0].id);
    transition();
  },
  next() {
    if (run.chapter === 3) run.screen = 'finale';
    else return actions.select(run.chapter + 1);
    transition();
  }
};

function transition() {
  persist();
  render();
}

function render() {
  modal.close();
  get('app').dataset.chapter = run.chapter;
  roomScreen.hidden = run.screen !== 'room';
  root.hidden = !roomScreen.hidden;
  room = null;
  if (run.screen === 'finale') {
    world?.setFinale(run.flags);
    showFinale(root, run, actions, world ? canvas : null);
  } else if (run.screen !== 'room') showChapter(root, run, actions);
  else {
    room = roomAt(run.room);
    roomScreen.querySelector('.room-body').prepend(canvas);
    canvas.setAttribute('aria-label', 'Walkable 3D view of the current room');
    canvas.setAttribute('aria-describedby', 'walk-help');
    world?.setRoom(room);
    showRoomHud(room, run);
    refresh();
    if (run.activeDialogue && byId(run.activeDialogue)?.dialogue) displayDialogue(byId(run.activeDialogue));
  }
}

function byId(id) {
  return room?.hotspots.find(hotspot => hotspot.id === id);
}

function panel(id) {
  if (!room || modal.kind) return;
  openRoomPanel(id);
}

function openRoomPanel(id) {
  openPanel(id, {
    modal, room, run, saved, close: modal.close, title: titleScreen, position: world?.position,
    guide(id) {
      modal.close();
      guide(id);
    },
    spend(stat) {
      if (!state.spendPoint(run, stat)) return;
      persist();
      refresh();
      openRoomPanel('training');
    }
  });
}

function guide(id) {
  if (!world) return interact(id);
  const guided = world.guide(id);
  setPrompt(null, guided ? `Walking to ${byId(id).label.toLowerCase()}` : 'This aisle is blocked. Try from another side.');
  return guided;
}

function message(heading, text) {
  modal.open('message', heading, content => {
    content.append(el('p', 'dialogue-line', text), button('Back', modal.close, 'btn primary'));
  }, modal.close);
}

function interact(id) {
  const hotspot = byId(id);
  if (!hotspot || modal.kind) return false;
  const status = state.hotspotStatus(run, hotspot);
  if (status === 'Locked') message(hotspot.label, hotspot.blockedText);
  else if (hotspot.exit) exitRoom();
  else if (hotspot.dialogue && status !== 'Complete') {
    openDialogue(run, hotspot);
    persist();
    displayDialogue(hotspot);
  } else if (hotspot.dialogue) message(hotspot.label, hotspot.afterText ?? 'This conversation is complete.');
  else if (hotspot.puzzle && status !== 'Complete') startPuzzle(hotspot);
  else if (hotspot.puzzle) message(hotspot.label, run.journal[id]?.text ?? hotspot.text);
  else {
    const text = hotspot.afterText && run.flags[hotspot.afterFlag] ? hotspot.afterText : hotspot.text;
    state.record(run, room.id, hotspot, text);
    state.collect(run, hotspot.giveItem);
    state.award(run, id, hotspot.xp);
    persist();
    refresh();
    message(hotspot.label, text);
  }
  return true;
}

function exitRoom() {
  run.activeDialogue = null;
  if (room.id % 3 === 0) run.screen = 'complete';
  else state.enterRoom(run, room.id + 1);
  transition();
}

function displayDialogue(hotspot, animate = false) {
  showDialogue(modal, run, hotspot, {
    animate, choose,
    back() {
      run.activeDialogue = null;
      persist();
      modal.close();
      refresh();
    }
  });
}

function choose(id) {
  const hotspot = byId(run?.activeDialogue);
  if (!hotspot || modal.kind !== 'dialogue') return false;
  const cursor = run.dialogues[hotspot.id];
  let animate = false;
  if (cursor.pending) {
    if (id !== 'continue') return false;
    const choice = nodeChoices(hotspot, cursor.node).find(entry => entry.id === cursor.pending);
    const result = run.rolls[cursor.pending];
    if (result.passed) followChoice(run, hotspot, choice, result.next);
    else advanceDialogue(run, hotspot, result.next);
  } else {
    const choice = nodeChoices(hotspot, cursor.node).find(entry => entry.id === id);
    if (!choice || !choiceAvailable(run, choice)) return false;
    if (choice.check) {
      animate = !run.rolls[id];
      resolveCheck(run, choice, companions, () => forcedRoll ?? d20());
      forcedRoll = null;
      cursor.pending = id;
    } else followChoice(run, hotspot, choice);
  }
  persist();
  refresh();
  if (run.activeDialogue) displayDialogue(hotspot, animate);
  else modal.close();
  return true;
}

function startPuzzle(hotspot) {
  activePuzzle = hotspot;
  function back() {
    [...get('overlay-content').querySelectorAll('button')]
      .find(control => control.textContent === 'Back')?.click();
  }
  modal.open('puzzle', null, content => {
    const consolePanel = el('section', `puzzle-console puzzle-${hotspot.puzzle}`);
    consolePanel.append(el('p', 'eyebrow console-origin', `${room.title} · ${hotspot.console}`));
    content.append(consolePanel);
    puzzles[hotspot.puzzle].start(consolePanel, {
      stat: key => run.stats[key], hasFlag: flag => !!run.flags[flag],
      recorded: id => !!run.journal[id]
    }, outcome => {
      activePuzzle = null;
      if (outcome.solved || outcome.skipped) finishPuzzle(hotspot, outcome.skipped);
      else modal.close();
    });
  }, back);
}

function finishPuzzle(hotspot, bypass) {
  state.setFlag(run, hotspot.setFlag, chapters, items);
  const text = bypass ? hotspot.bypassText : hotspot.text;
  state.record(run, room.id, hotspot, text, bypass);
  if (!bypass) state.award(run, hotspot.id, hotspot.xp);
  persist();
  refresh();
  message(hotspot.label, text);
}

initializeHud(panel, guide);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && room && !modal.kind && !event.repeat) {
    event.preventDefault();
    panel('pause');
  }
});

function graphicsUnavailable() {
  world?.stop();
  world = null;
  canvas.hidden = true;
  const fallback = canvas.parentElement?.querySelector('.finale-art img');
  if (fallback) fallback.hidden = false;
  get('walk-help').hidden = true;
  setPrompt(null);
  const message = get('graphics-message');
  message.hidden = false;
  message.textContent = 'WebGL 2 is unavailable. Use Room objects to explore and play without the 3D view.';
}

try {
  world = createWorld(canvas, {
    test, active: () => !!room && !modal.kind,
    eligible: id => !!byId(id),
    near: id => setPrompt(byId(id)),
    guide,
    interact
  });
  canvas.addEventListener('webglcontextlost', graphicsUnavailable);
} catch {
  graphicsUnavailable();
}
titleScreen();

if (test) {
  window.__game = {
    get state() { return run; },
    get roomId() { return room?.id ?? null; },
    get hotspots() {
      return room?.hotspots.map(hotspot => ({ ...hotspot, status: state.hotspotStatus(run, hotspot) })) ?? [];
    },
    interact,
    choose,
    solvePuzzle() {
      const hotspot = activePuzzle;
      if (!hotspot) return false;
      const back = [...get('overlay-content').querySelectorAll('button')].find(control => control.textContent === 'Back');
      if (back.disabled) return false;
      back.click();
      finishPuzzle(hotspot, false);
      return true;
    },
    forceRoll(number) {
      if (!Number.isInteger(number) || number < 1 || number > 20) throw new RangeError('Use a die face from 1 to 20.');
      forcedRoll = number;
    }
  };
}
