import { meetsFlags, modifier, signed } from './state.js';

export function presentCompanions(run, companions) {
  return companions.filter(companion => meetsFlags(run, companion)
    && run.furthestRoom >= (companion.minLevel ?? 0));
}

export function checkTerms(run, choice, companions) {
  const check = choice.check;
  const aid = presentCompanions(run, companions).flatMap(companion =>
    companion.aid.filter(entry => entry.choice === choice.id && meetsFlags(run, entry))
      .map(entry => ({ ...entry, companion: companion.name })));
  const reasons = aid.map(entry => entry.text);
  const log = check.advantageWith && run.inventory.includes(check.advantageWith);
  const advantage = !!log || aid.some(entry => entry.advantage);
  const disadvantage = check.disadvantageUnless && !run.flags[check.disadvantageUnless];
  if (log) reasons.push('The maintenance log corroborates the version header.');
  if (disadvantage) reasons.push('The air ring is unstable.');
  const mode = advantage === !!disadvantage ? 'normal'
    : advantage ? 'advantage' : 'disadvantage';
  return {
    stat: check.stat, dc: check.dc, modifier: modifier(run.stats[check.stat]),
    mode, aid, reasons, bonus: aid.reduce((sum, entry) => sum + (entry.bonus ?? 0), 0),
    canceled: !!(advantage && disadvantage)
  };
}

export function d20(random = Math.random) {
  return 1 + Math.floor(random() * 20);
}

export function resolveCheck(run, choice, companions, roll = d20) {
  if (run.rolls[choice.id]) return run.rolls[choice.id];
  const terms = checkTerms(run, choice, companions);
  const dice = terms.mode === 'normal' ? [roll()] : [roll(), roll()];
  const kept = terms.mode === 'disadvantage' ? Math.min(...dice) : Math.max(...dice);
  const total = kept + terms.modifier + terms.bonus;
  const passed = total >= terms.dc;
  const next = passed ? choice.check.onPass : choice.check.onFail;
  return (run.rolls[choice.id] = { ...terms, dice, kept, total, passed, next });
}

export function termsText(terms) {
  const mode = terms.canceled ? 'advantage and disadvantage cancel' : terms.mode;
  const aid = terms.aid.filter(entry => entry.bonus)
    .map(entry => ` · ${entry.companion} ${signed(entry.bonus)}`).join('');
  return `${terms.stat.toUpperCase()} ${signed(terms.modifier)} · DC ${terms.dc} · ${mode}${aid}`;
}

export function resultText(result) {
  return `Rolled ${result.dice.join(' and ')}. Kept ${result.kept}. ${termsText(result)}. `
    + `Total ${result.total} against DC ${result.dc}. ${result.passed ? 'Pass' : 'Fail'}.`;
}
