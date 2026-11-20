import { checkTerms, resultText, termsText } from '../checks.js';
import { choiceAvailable, nodeChoices } from '../dialogue.js';
import { companions, items } from '../story/data.js';
import { characterId } from '../story/characters.js';
import { portrait } from './portraits.js';
import { el, button, reducedMotion } from './dom.js';

export function showDialogue(modal, run, hotspot, actions) {
  const cursor = run.dialogues[hotspot.id];
  const node = hotspot.dialogue.nodes[cursor.node];
  modal.open('dialogue', node.speaker, content => {
    const speaker = characterId(node.speaker);
    if (speaker) {
      const heading = content.querySelector('h2');
      heading.classList.add('speaker-badge');
      heading.prepend(portrait(speaker));
    }
    const line = node.afterFlag && run.flags[node.afterFlag] ? node.afterText : node.text;
    content.append(el('p', 'dialogue-line', line));
    if (cursor.pending) {
      const result = run.rolls[cursor.pending];
      const choice = nodeChoices(hotspot, cursor.node).find(entry => entry.id === cursor.pending);
      showResult(content, result, actions, choice?.unlock);
    } else {
      const group = el('div', 'choice-list');
      const responseHeading = el('p', 'eyebrow speaker-badge', 'Navigator');
      responseHeading.prepend(portrait('navigator'));
      group.append(responseHeading);
      for (const choice of nodeChoices(hotspot, cursor.node)) {
        const pick = button('', () => actions.choose(choice.id), 'response');
        pick.dataset.choice = choice.id;
        const reply = choice.afterFlag && run.flags[choice.afterFlag] ? choice.afterText : choice.text;
        pick.append(el('span', '', reply));
        if (choice.needItem) {
          const available = choiceAvailable(run, choice);
          const item = items.find(entry => entry.id === choice.needItem);
          pick.classList.toggle('choice-locked', !available);
          pick.setAttribute('aria-disabled', String(!available));
          pick.append(el('span', available ? 'unlock-note' : 'check-reasons',
            available ? `Available · ${item.name}` : `Locked · Collect ${item.name.toLowerCase()}`));
        }
        if (choice.check) addTerms(pick, run, choice);
        group.append(pick);
      }
      content.append(group);
    }
    content.append(button('Back', actions.back));
  }, actions.back);
}

function addTerms(pick, run, choice) {
  const saved = run.rolls[choice.id];
  const terms = saved ?? checkTerms(run, choice, companions);
  pick.append(el('span', 'check-terms', saved ? `Saved result · ${resultText(saved)}` : termsText(terms)));
  if (terms.reasons.length) pick.append(el('span', 'check-reasons', terms.reasons.join(' ')));
}

function showResult(content, result, actions, unlock) {
  const dice = el('div', `dice ${actions.animate && !reducedMotion() ? 'dice-enter' : ''}`);
  dice.setAttribute('aria-hidden', 'true');
  let kept = false;
  for (const die of result.dice) {
    const highlight = !kept && die === result.kept;
    const face = el('span', highlight ? 'die kept' : 'die', die);
    face.append(el('i'), el('b'));
    if (highlight) kept = true;
    dice.append(face);
  }
  const summary = el('p', `result ${result.passed ? 'pass' : 'fail'}`, resultText(result));
  summary.setAttribute('role', 'status');
  const next = button('Continue', () => actions.choose('continue'), 'btn primary');
  next.dataset.choice = 'continue';
  content.append(dice, summary);
  if (result.passed && unlock) content.append(el('p', 'unlock-note', unlock));
  content.append(next);
}
