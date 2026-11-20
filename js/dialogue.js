import { chapters, items } from './story/data.js';
import { award, setFlag } from './state.js';

export function openDialogue(run, hotspot) {
  run.activeDialogue = hotspot.id;
  return (run.dialogues[hotspot.id] ??= { node: hotspot.dialogue.start, pending: null });
}

export function closeDialogue(run, id) {
  delete run.dialogues[id];
  run.activeDialogue = null;
}

export function nodeChoices(hotspot, nodeId) {
  const node = hotspot.dialogue.nodes[nodeId];
  return (node.choices ?? [{ text: 'Done', id: 'done' }]).map((choice, index) =>
    ({ ...choice, id: choice.id ?? `${hotspot.id}.${nodeId}.${index}` }));
}

export function choiceAvailable(run, choice) {
  return !choice.needItem || run.inventory.includes(choice.needItem);
}

export function followChoice(run, hotspot, choice, next = choice.next) {
  setFlag(run, choice.setFlag, chapters, items);
  award(run, choice.id, choice.xp);
  advanceDialogue(run, hotspot, next);
}

export function advanceDialogue(run, hotspot, next) {
  if (!next) {
    closeDialogue(run, hotspot.id);
    return;
  }
  run.dialogues[hotspot.id] = { node: next, pending: null };
}
