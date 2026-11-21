import { classes, chapterAt, companions } from '../story/data.js';
import { hotspotStatus, meetsFlags, rankFor, STATS } from '../state.js';
import { presentCompanions } from '../checks.js';
import { get, el, button, statsText, title } from './dom.js';

export function initializeHud(open) {
  const panels = [
    ['Quest log', 'journal'], ['Inventory', 'inventory'], ['Character sheet', 'sheet'],
    ['Room objects', 'objects'], ['How to play', 'help'], ['Pause', 'pause']
  ];
  for (const [label, id] of panels) {
    const control = button(label, () => open(id));
    control.dataset.panel = id;
    get('room-nav').append(control);
  }
}

export function showRoomHud(room, run, hasWorld) {
  get('room-kicker').textContent = `Chapter 0${room.chapter} / ${chapterAt(room.chapter).title}`;
  get('room-title').textContent = room.title;
  get('room-tag').textContent = `Room 0${room.id} / 09`;
  get('room-class').textContent = `Navigator / ${classes.find(entry => entry.id === run.classId).name}`;
  get('scene-banter').open = false;
  get('first-steps').textContent = hasWorld
    ? 'Walk northwest to Power Conduits with WASD or the arrow keys. Press E when the prompt appears. You can also tap the console or use Room objects.'
    : 'Use Room objects to open the cryo console.';
  setPrompt(null);
  title(get('room-title'));
}

export function updateHud(room, run) {
  const exit = room.hotspots.find(hotspot => hotspot.exit);
  const puzzle = room.hotspots.find(hotspot => hotspot.puzzle);
  const exitStatus = hotspotStatus(run, exit);
  const repaired = run.flags[puzzle.setFlag];
  const opening = room.id === 1 && !repaired;
  const passage = exitStatus === 'Open' ? ` Next step: ${exit.label}.` : '';
  get('room-nav').querySelector('[data-panel="objects"]').classList.toggle('first-route', opening);
  get('first-steps').hidden = !opening;
  const outcome = room.narration?.find(entry => meetsFlags(run, entry));
  const narration = (outcome?.text ?? (repaired ? room.afterIntro : room.intro)) + passage;
  const lines = availableChatter(room, run);
  get('scene-lines').replaceChildren(...lines.map(line => el('p', 'small', line.text)));
  get('scene-banter').hidden = !lines.length;
  get('passive-clue').hidden = !run.observations[room.id];
  get('passive-clue').textContent = run.observations[room.id]
    ? `You notice · ${run.observations[room.id]}` : '';
  if (get('room-intro').textContent !== narration) get('room-intro').textContent = narration;
  const goals = room.goals.map(goal => {
    const completed = meetsFlags(run, goal);
    const node = el('li', completed ? 'goal-complete' : '');
    const marker = el('span', 'goal-icon', completed ? '✓' : '○');
    marker.setAttribute('aria-label', completed ? 'Complete' : 'Pending');
    node.append(marker, el('span', '', goal.text));
    return node;
  });
  get('goals').replaceChildren(...goals);
  const inspiration = `Inspiration ${run.inspiration}/1`;
  if (get('inspiration').textContent !== inspiration) get('inspiration').textContent = inspiration;
  const rank = rankFor(run.xp);
  const xpGoal = rank * 45;
  const progress = el('progress');
  progress.max = 45;
  progress.value = rank === 9 ? 45 : run.xp % 45;
  progress.setAttribute('aria-label', rank === 9 ? 'Maximum rank' : 'Progress to next rank');
  get('rank-progress').replaceChildren(el('h2', '', `Rank ${rank}`),
    el('p', 'xp-text', rank === 9 ? `${run.xp} XP · Maximum rank` : `${run.xp} XP / ${xpGoal} XP`),
    progress, el('p', 'points', `Banked points ${run.points}`));
  get('stats').replaceChildren(...STATS.map(stat => {
    const score = el('span', 'score');
    score.append(el('span', '', stat.toUpperCase()), el('strong', '', run.stats[stat]));
    return score;
  }));
  get('stats').setAttribute('aria-label', statsText(run.stats));
}

export function setPrompt(hotspot, prefix) {
  const node = get('prompt');
  if (prefix) node.replaceChildren(el('span', '', prefix));
  else if (hotspot) node.replaceChildren(el('kbd', '', 'E'), el('span', '', hotspot.label));
  else node.replaceChildren();
}

export function availableChatter(room, run) {
  const present = presentCompanions(run, companions);
  return (room.banter ?? []).flatMap((line, index) => {
    const companion = present.find(entry => entry.id === line.companion);
    return companion && meetsFlags(run, line)
      ? [{ id: `${room.id}.${index}`, text: `${companion.name} · ${line.text}` }] : [];
  });
}
