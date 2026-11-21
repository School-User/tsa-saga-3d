import { personalities } from './story/tabletop.js';

export function personalityFor(classId, selection) {
  const options = personalities[classId];
  if (!options) return null;
  return Object.fromEntries(['ideal', 'bond'].map(trait => [
    trait, options[trait].includes(selection?.[trait]) ? selection[trait] : options[trait][0]
  ]));
}

export function restoreSession(run) {
  run.inspiration = run.inspiration === 1 ? 1 : 0;
  run.personality = personalityFor(run.classId, run.personality);
  for (const field of ['replies', 'roleplay', 'observations', 'chatter', 'lootChapters']) {
    const value = run[field];
    if (!value || typeof value !== 'object' || Array.isArray(value)) run[field] = {};
  }
  return run;
}

export function earnInspiration(run) {
  run.inspiration = 1;
}

export function spendInspiration(run) {
  if (!run.inspiration) return false;
  run.inspiration = 0;
  return true;
}

export function replyText(run, choice) {
  return choice.afterFlag && run.flags[choice.afterFlag] ? choice.afterText : choice.text;
}

export function recordReply(run, choice) {
  if (choice.id === 'done' || choice.setFlag?.endsWith('_contacted')) return;
  run.replies[choice.id] ??= { chapter: run.chapter, text: replyText(run, choice) };
  if (choice.roleplay && !run.roleplay[choice.id]) {
    run.roleplay[choice.id] = true;
    earnInspiration(run);
  }
}

export function personalityLine(run) {
  const trait = run.chapter === 2 ? 'bond' : 'ideal';
  const reflection = run.chapter === 2 ? 'The port lights remind you of a bond you carry.'
    : run.chapter === 3 ? 'The ark gives you a moment to consider your ideal.'
      : 'As you wake, a familiar ideal comes to mind.';
  return `${reflection} “${run.personality[trait]}”`;
}

export function sessionRecap(run, chapter, items, ending) {
  const choices = Object.values(run.replies)
    .filter(reply => reply.chapter === chapter).map(reply => reply.text);
  const rolls = Object.entries(run.rolls)
    .filter(([id]) => id.startsWith(`c${chapter}_`)).map(([, result]) => result);
  const best = rolls.reduce((highest, roll) => !highest || roll.kept > highest.kept
    || (roll.kept === highest.kept && roll.total > highest.total) ? roll : highest, null);
  return {
    ending: ending?.text,
    choices,
    best,
    natural20s: rolls.filter(roll => roll.kept === 20).length,
    loot: items.filter(item => run.inventory.includes(item.id)
      && (run.lootChapters[item.id] ?? item.chapter) === chapter).map(item => item.name)
  };
}
