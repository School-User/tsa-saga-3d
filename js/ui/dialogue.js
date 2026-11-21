import { checkTerms, naturalLine, resultText, skillLabel, termsText } from '../checks.js';
import { choiceAvailable, nodeChoices } from '../dialogue.js';
import { companions, items } from '../story/data.js';
import { characterId } from '../story/characters.js';
import { portrait } from './portraits.js';
import { replyText } from '../session.js';
import { createDiceTray } from './dice.js';
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
    content.append(el('p', node.speaker === 'Game Master' ? 'dialogue-line read-aloud' : 'dialogue-line', line));
    if (cursor.pending) {
      const result = run.rolls[cursor.pending];
      const choice = nodeChoices(hotspot, cursor.node).find(entry => entry.id === cursor.pending);
      showResult(content, result, actions, choice);
    } else {
      const group = el('div', 'choice-list');
      const responseHeading = el('p', 'eyebrow speaker-badge', 'Navigator');
      responseHeading.prepend(portrait('navigator'));
      group.append(responseHeading);
      const choices = nodeChoices(hotspot, cursor.node);
      const spend = el('input');
      spend.type = 'checkbox';
      const previews = [];
      if (run.inspiration && choices.some(choice => choice.check && !run.rolls[choice.id] && choiceAvailable(run, choice))) {
        const label = el('label', 'toggle-option');
        label.append(spend, 'Spend Inspiration on the next check for advantage');
        group.append(label);
        spend.addEventListener('change', () => previews.forEach(update => update()));
      }
      for (const choice of choices) {
        const pick = button('', () => actions.choose(choice.id, spend.checked), 'response');
        pick.dataset.choice = choice.id;
        pick.append(el('span', '', replyText(run, choice)));
        if (choice.roleplay) {
          const reward = run.roleplay[choice.id] ? 'Recorded'
            : run.inspiration ? 'Inspiration full' : 'Earn Inspiration';
          pick.append(el('span', 'unlock-note', `Roleplay moment · ${reward}`));
        }
        if (choice.needItem) {
          const available = choiceAvailable(run, choice);
          const item = items.find(entry => entry.id === choice.needItem);
          pick.classList.toggle('choice-locked', !available);
          pick.setAttribute('aria-disabled', String(!available));
          pick.append(el('span', available ? 'unlock-note' : 'check-reasons',
            available ? `Available · ${item.name}` : `Locked · Collect ${item.name.toLowerCase()}`));
        }
        if (choice.check) previews.push(addTerms(pick, run, choice, spend));
        group.append(pick);
      }
      content.append(group);
    }
    content.append(button('Back', actions.back));
  }, actions.back);
}

function addTerms(pick, run, choice, spend) {
  const saved = run.rolls[choice.id];
  const label = el('span', 'check-terms', skillLabel(choice.check));
  const detail = el('span', 'check-reasons');
  const reasons = el('span', 'check-reasons');
  pick.append(label, detail, reasons);

  function update() {
    const terms = saved ?? checkTerms(run, choice, companions, spend.checked && choiceAvailable(run, choice));
    detail.textContent = saved ? `Saved result · ${resultText(saved)}` : termsText(terms);
    reasons.textContent = terms.reasons.join(' ');
    reasons.hidden = !terms.reasons.length;
  }
  update();
  return update;
}

function showResult(content, result, actions, choice) {
  const dice = createDiceTray(result, actions.animate && !reducedMotion());
  const summary = el('p', `result ${result.passed ? 'pass' : 'fail'}`,
    `${skillLabel(choice.check)}. ${resultText(result)}`);
  summary.setAttribute('role', 'status');
  const next = button('Continue', () => actions.choose('continue'), 'btn primary');
  next.dataset.choice = 'continue';
  content.append(dice, summary);
  const gm = naturalLine(result);
  if (gm) content.append(el('p', 'read-aloud', `Game Master · ${gm}`));
  if (result.passed && choice.unlock) content.append(el('p', 'unlock-note', choice.unlock));
  content.append(next);
}
