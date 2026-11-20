import { checkTerms, resultText, termsText } from '../checks.js';
import { nodeChoices } from '../dialogue.js';
import { companions } from '../story/data.js';
import { el, button, reducedMotion } from './dom.js';

export function showDialogue(modal, run, hotspot, actions) {
  const cursor = run.dialogues[hotspot.id];
  const node = hotspot.dialogue.nodes[cursor.node];
  modal.open('dialogue', node.speaker, content => {
    content.append(el('p', 'dialogue-line', node.text));
    if (cursor.pending) {
      const result = run.rolls[cursor.pending];
      showResult(content, result, actions);
    } else {
      const group = el('div', 'choice-list');
      for (const choice of nodeChoices(hotspot, cursor.node)) {
        const pick = button('', () => actions.choose(choice.id), 'response');
        pick.dataset.choice = choice.id;
        pick.append(el('span', '', choice.text));
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

function showResult(content, result, actions) {
  const dice = el('div', `dice ${actions.animate && !reducedMotion() ? 'dice-enter' : ''}`);
  dice.setAttribute('aria-hidden', 'true');
  let kept = false;
  for (const die of result.dice) {
    const highlight = !kept && die === result.kept;
    const face = el('span', highlight ? 'die kept' : 'die', die);
    if (highlight) kept = true;
    dice.append(face);
  }
  const summary = el('p', `result ${result.passed ? 'pass' : 'fail'}`, resultText(result));
  summary.setAttribute('role', 'status');
  const next = button('Continue', () => actions.choose('continue'), 'btn primary');
  next.dataset.choice = 'continue';
  content.append(dice, summary, next);
}
