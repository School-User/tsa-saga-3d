// Routes shared with the browser smoke test. Each entry keeps the real UI actions countable.
export const powerRotations = [[11, 3], [6, 2], [7, 1], [8, 1], [13, 2]];
export const balanceWeighings = [[[1, 2], [3, 4]], [[5], [6]], [[7], [8]]];

export function crateTurns(index, label, left, right) {
  const id = index + 1;
  const current = label.endsWith(' L') ? 1 : label.endsWith(' R') ? 2 : 0;
  const target = left.includes(id) ? 1 : right.includes(id) ? 2 : 0;
  return (target - current + 3) % 3;
}

export const pipReplies = ['c2_pip.a.3', 'c2_pip_count', 'c2_pip.win.0', 'done'];
export const quarrelReplies = ['c3_quarrel.a.2', 'c3_quarrel_rota', 'done'];
export const captainCheck = { id: 'c2_cap_all', die: 20, replies: ['continue', 'c2_talk3.all.0', 'c2_talk3.fin.0'] };
export const fernCheck = { id: 'c3_fern_release', die: 1, replies: ['continue', 'c3_talk3.pause.0', 'c3_talk3.replant.0', 'c3_talk3.fin.0'] };
export const reedCheck = { id: 'c2_tamsin_calm', die: 16, replies: ['continue', 'c2_radio1.calm.0', 'done'] };
export const vaultCheck = { id: 'c3_fern_calm', die: 20, replies: ['continue', 'c3_fern1.calm.0', 'done'] };
