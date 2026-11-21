import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkTerms, naturalLine, resolveCheck, skillLabel } from '../js/checks.js';
import { earnInspiration, personalityLine, recordReply, sessionRecap } from '../js/session.js';
import { keepsakes, personalities, skills } from '../js/story/tabletop.js';
import { collect, enterRoom, loadRun, newRun, noticeRoom, passivePerception, saveRun } from '../js/state.js';

globalThis.window = {};
const { chapters, classes, companions, items, rooms } = await import('../js/story/data.js');
const { nodeChoices, openDialogue } = await import('../js/dialogue.js');
const fresh = () => newRun(classes[0]);
const authored = rooms.flatMap(room => room.hotspots.flatMap(hotspot =>
  Object.keys(hotspot.dialogue?.nodes ?? {}).flatMap(node => nodeChoices(hotspot, node))));
const choice = id => authored.find(reply => reply.id === id);
const checks = authored.filter(reply => reply.check);
const fromFaces = (...faces) => () => faces.shift();

test('Every check labels an authored skill for its ability and preserves its DC', () => {
  assert.deepEqual(checks.map(({ check }) => check.dc), [13, 12, 12, 12, 12, 12, 13, 12, 12, 12, 15, 13, 12, 12, 14]);
  const usedSkills = new Set();
  for (const { check } of checks) {
    assert.ok(skills[check.stat].includes(check.skill));
    assert.equal(skillLabel(check), `${check.skill} (${check.stat.toUpperCase()}) check — DC ${check.dc}`);
    usedSkills.add(check.skill);
  }
  assert.deepEqual([...usedSkills].sort(), Object.values(skills).flat().sort());
  assert.equal(skillLabel(choice('c1_ori_calm').check), 'Insight (EMP) check — DC 13');
});

test('Only the kept natural face overrides the total and selects the branch', () => {
  const source = choice('c1_ori_calm');
  const run = fresh();
  const highDC = { ...source, check: { ...source.check, dc: 30 } };
  const perfect = resolveCheck(run, highDC, [], () => 20);
  assert.ok(perfect.total < perfect.dc);
  assert.equal(perfect.passed, true);
  assert.equal(perfect.next, source.check.onPass);
  assert.match(naturalLine(perfect), /Natural 20/);
  assert.equal(run.inspiration, 1);

  const lowDC = { ...source, check: { ...source.check, dc: 0 } };
  const one = resolveCheck(fresh(), lowDC, [], () => 1);
  assert.ok(one.total >= one.dc);
  assert.equal(one.passed, false);
  assert.equal(one.next, source.check.onFail);
  assert.match(naturalLine(one), /rehearsal/);

  const repair = choice('c1_lab_eng');
  const dropped20 = resolveCheck(fresh(), repair, companions, fromFaces(20, 7));
  assert.equal(dropped20.natural, null);
  assert.equal(dropped20.passed, false);
  const kept1 = resolveCheck(fresh(), repair, companions, fromFaces(1, 20));
  assert.equal(kept1.natural, 1);
  assert.equal(kept1.passed, false);
});

test('Roleplay and natural twenties earn one token, and only a new check can spend it', () => {
  const run = fresh();
  const moment = choice('c1_ori1.a.2');
  recordReply(run, moment);
  assert.equal(run.inspiration, 1);
  earnInspiration(run);
  assert.equal(run.inspiration, 1);

  const approach = choice('c1_ori_calm');
  assert.equal(checkTerms(run, approach, [], true).mode, 'advantage');
  assert.equal(run.inspiration, 1, 'Preview keeps the token');
  const result = resolveCheck(run, approach, [], fromFaces(1, 16), true);
  assert.deepEqual(result.dice, [1, 16]);
  assert.equal(result.kept, 16);
  assert.equal(result.passed, true);
  assert.equal(run.inspiration, 0);
  recordReply(run, moment);
  assert.equal(run.inspiration, 0, 'A roleplay moment grants its reward once');

  const other = choice('c1_veil_emp');
  const normal = resolveCheck(run, other, [], () => 20, true);
  assert.deepEqual(normal.dice, [20], 'Unheld Inspiration leaves the mode unchanged');
  assert.equal(run.inspiration, 1);
  assert.equal(resolveCheck(run, approach, [], () => assert.fail('Already rolled'), true), result);
  assert.equal(run.inspiration, 1, 'Reviewing a saved check keeps the token');

  const repair = choice('c1_lab_eng');
  const canceled = resolveCheck(run, repair, companions, () => 20, true);
  assert.deepEqual(canceled.dice, [20]);
  assert.equal(canceled.canceled, true);
  assert.equal(run.inspiration, 1, 'The kept natural 20 refills the spent token');
});

test('Each chapter has three or four distinct roleplay replies and one optional keepsake', () => {
  for (const chapter of [1, 2, 3]) {
    const moments = authored.filter(reply => reply.roleplay && reply.id.startsWith(`c${chapter}_`));
    assert.ok(moments.length >= 3 && moments.length <= 4);
    assert.equal(new Set(moments.map(reply => reply.id)).size, moments.length);
    const finds = rooms.filter(room => room.chapter === chapter).flatMap(room => room.hotspots)
      .filter(hotspot => keepsakes[hotspot.id]);
    assert.equal(finds.length, 1);
    assert.ok(finds[0].text && !finds[0].exit && !finds[0].puzzle);
  }
});

test('Personality, Inspiration and an old pending result survive save and load', () => {
  let value;
  const storage = { getItem: () => value, setItem: (_, saved) => { value = saved; } };
  const background = classes[2];
  const options = personalities[background.id];
  const personality = { ideal: options.ideal[1], bond: options.bond[1] };
  const run = newRun(background, personality);
  earnInspiration(run);
  assert.equal(saveRun(storage, run), true);
  assert.deepEqual(loadRun(storage).personality, personality);
  assert.equal(loadRun(storage).inspiration, 1);
  assert.ok(personalityLine(run).includes(personality.ideal));
  enterRoom(run, 4);
  assert.ok(personalityLine(run).includes(personality.bond));
  enterRoom(run, 7);
  assert.ok(personalityLine(run).includes(personality.ideal));

  const old = JSON.parse(value);
  for (const field of ['personality', 'inspiration', 'replies', 'observations', 'roleplay', 'chatter', 'lootChapters']) {
    delete old[field];
  }
  enterRoom(old, 2);
  const repair = choice('c1_lab_eng');
  const { skill, ...legacyTerms } = checkTerms(old, repair, companions);
  old.rolls[repair.id] = { ...legacyTerms, dice: [7, 8], kept: 7, total: 7, passed: false, next: repair.check.onFail };
  const lab = rooms[1].hotspots.find(hotspot => hotspot.id === 'c1_lab');
  openDialogue(old, lab).pending = repair.id;
  saveRun(storage, old);
  const restored = loadRun(storage);
  assert.equal(restored.inspiration, 0);
  assert.deepEqual(restored.personality, { ideal: options.ideal[0], bond: options.bond[0] });
  assert.deepEqual(restored.rolls, old.rolls);
  assert.equal(restored.dialogues[lab.id].pending, repair.id);
  assert.equal(saveRun(storage, restored), true);
  assert.deepEqual(loadRun(storage), restored);
});

test('Passive Perception uses 10 + SCI modifier and reveals at the hidden DC', () => {
  const engineer = fresh();
  assert.equal(passivePerception(engineer), 9);
  assert.ok(noticeRoom(engineer, 1));
  assert.equal(noticeRoom(engineer, 2), false);
  assert.equal(noticeRoom(engineer, 1), false);
  engineer.stats.sci = 4;
  assert.equal(passivePerception(engineer), 11);
  assert.ok(noticeRoom(engineer, 2));
  assert.equal(noticeRoom(engineer, 3), false);
  const scientist = newRun(classes[2]);
  assert.equal(passivePerception(scientist), 12);
  for (const room of rooms) assert.ok(noticeRoom(scientist, room.id));
});

test('Session recaps report actual replies, best kept roll, natural 20s and acquired loot', () => {
  const run = fresh();
  recordReply(run, choice('c1_talk.peace.0'));
  const high = resolveCheck(run, choice('c1_ori_calm'), [], () => 20);
  resolveCheck(run, choice('c1_lab_eng'), [], fromFaces(20, 9));
  collect(run, 'cryo_patch');
  collect(run, 'cryo_patch');
  enterRoom(run, 4);
  collect(run, 'harbor_token');
  resolveCheck(run, choice('c2_tamsin_calm'), [], () => 20);
  const ending = chapters[0].endings[0];
  assert.deepEqual(sessionRecap(run, 1, items, ending), {
    choices: ['Welcome the Veil aboard.'],
    ending: ending.text,
    best: high,
    natural20s: 1,
    loot: ['Meridian mission patch']
  });
  assert.deepEqual(sessionRecap(run, 3, items), {
    choices: [], ending: undefined, best: null, natural20s: 0, loot: []
  });
});
