import assert from 'node:assert/strict';
import * as state from '../js/state.js';
import { checkTerms, d20, presentCompanions, resolveCheck, resultText } from '../js/checks.js';
import { layouts } from '../js/world/layouts.js';
import { isVisible } from '../js/ui/modal.js';
import { distanceTo, routeTo, walkable } from '../js/world/navigation.js';

globalThis.window = {};
const { chapters, classes, rooms, items, companions, journalSize } = await import('../js/story/data.js');
const { openDialogue, nodeChoices, choiceAvailable, followChoice, advanceDialogue } = await import('../js/dialogue.js');
const engineer = classes[0];
const fresh = () => state.newRun(engineer);
const find = id => rooms.flatMap(room => room.hotspots).find(hotspot => hotspot.id === id);
const flag = (run, id) => state.setFlag(run, id, chapters, items);
function choice(id) {
  for (const room of rooms) for (const hotspot of room.hotspots) {
    for (const node of Object.values(hotspot.dialogue?.nodes ?? {})) {
      const match = node.choices?.find(entry => entry.id === id);
      if (match) return match;
    }
  }
  assert.fail(`Missing choice ${id}`);
}

assert.deepEqual(classes.map(entry => Object.values(entry.stats).reduce((a, b) => a + b)), [9, 9, 9]);
assert.equal(state.modifier(2), -1);
assert.equal(state.modifier(5), 2);
assert.equal(d20(() => 0), 1);
assert.equal(d20(() => .9999), 20);

const repair = choice('c1_lab_eng');
const headers = choice('c1_lab_sci');
const delivery = choice('c2_cap_all');
const run = fresh();
assert.equal(checkTerms(run, repair, companions).mode, 'disadvantage');
assert.equal(checkTerms(run, repair, companions).bonus, 1);
const uneven = [14, 7];
const result = resolveCheck(run, repair, companions, () => uneven.shift());
assert.deepEqual(result.dice, [14, 7]);
assert.equal(result.kept, 7);
assert.equal(result.total, 10);
assert.equal(result.passed, false);
assert.match(resultText(result), /ORI \+1.*Total 10 against DC 12. Fail/);
flag(run, 'c1_air_ok');
assert.equal(resolveCheck(run, repair, companions, () => assert.fail('Cached rolls must not roll again')), result);
assert.equal(checkTerms(run, repair, companions).mode, 'normal');
assert.equal(resolveCheck(fresh(), repair, companions, () => 9).passed, true, 'Ties pass');
state.collect(run, 'maintenance_log');
state.collect(run, 'maintenance_log');
assert.deepEqual(run.inventory, ['maintenance_log']);
const scienceRolls = [1, 13];
const science = resolveCheck(run, headers, companions, () => scienceRolls.shift());
assert.equal(science.mode, 'advantage');
assert.equal(science.kept, 13);
assert.equal(science.total, 12);
assert.equal(science.passed, true);
const both = { ...headers, id: 'both', check: { ...headers.check, disadvantageUnless: 'missing' } };
assert.deepEqual(resolveCheck(run, both, companions, () => 8).dice, [8]);
assert.equal(checkTerms(run, both, companions).canceled, true);
const doubled = [{ id: 'helper', name: 'Helper', aid: [{ choice: headers.id, advantage: true }] }];
assert.equal(resolveCheck({ ...run, rolls: {} }, headers, doubled, () => 7).dice.length, 2);

assert.deepEqual(presentCompanions(run, companions).map(entry => entry.id), ['ori']);
flag(run, 'c2_ring_lit');
flag(run, 'c2_tamsin_calm');
assert.equal(checkTerms(run, delivery, companions).mode, 'advantage');
assert.equal(checkTerms(run, delivery, companions).bonus, 1);
state.enterRoom(run, 7);
state.enterRoom(run, 1);
assert.deepEqual(presentCompanions(run, companions).map(entry => entry.id), ['ori', 'tamsin', 'fern']);
assert.equal(checkTerms(run, choice('c3_quarrel_sci'), companions).bonus, 1);
flag(run, 'c3_fern_calm');
assert.equal(checkTerms(run, choice('c3_fern_release'), companions).mode, 'advantage');

const lab = find('c1_lab');
const archive = fresh();
const archiveReply = nodeChoices(lab, 'a').find(entry => entry.id === 'c1_lab_archive');
assert.equal(choiceAvailable(archive, archiveReply), false);
const lifeSupport = rooms[1];
const orisPod = find('c1_ori1');
const calmOri = choice('c1_ori_calm');
const failed = resolveCheck(archive, calmOri, companions, () => 1);
assert.equal(failed.passed, false);
assert.equal(state.applyRoomAid(archive, lifeSupport), false);
assert.equal(choiceAvailable(archive, archiveReply), false);
const reassured = fresh();
const success = resolveCheck(reassured, calmOri, companions, () => 20);
assert.equal(success.passed, true);
followChoice(reassured, orisPod, calmOri, success.next);
assert.equal(state.applyRoomAid(reassured, rooms[0]), false);
assert.equal(state.applyRoomAid(reassured, lifeSupport), true);
assert.equal(state.applyRoomAid(reassured, lifeSupport), false);
assert.deepEqual(reassured.inventory, ['maintenance_log']);
assert.equal(reassured.xp, 15);
assert.deepEqual(reassured.journal, {});
assert.equal(choiceAvailable(reassured, archiveReply), true);
state.collect(archive, 'maintenance_log');
assert.equal(choiceAvailable(archive, archiveReply), true);
openDialogue(archive, lab);
followChoice(archive, lab, archiveReply);
assert.equal(archive.dialogues[lab.id].node, 'archive');
assert.equal(archive.flags.c1_lab_open, true);
assert.equal(Object.hasOwn(archive.rolls, archiveReply.id), false);
assert.equal(archive.xp, 10);

const cursor = openDialogue(run, lab);
cursor.pending = repair.id;
const storage = new Map();
const saved = { setItem: (key, value) => storage.set(key, value), getItem: key => storage.get(key) };
assert.equal(state.saveRun(saved, run), true);
assert.deepEqual([...storage.keys()], ['driftSignal3d.v1']);
assert.deepEqual(state.loadRun(saved), run);
assert.equal(state.loadRun(saved).dialogues.c1_lab.pending, 'c1_lab_eng');
assert.equal(state.loadRun({ getItem: () => 'damaged' }), null);
assert.equal(state.saveRun({ setItem: () => { throw new Error('Full'); } }, run), false);

const beforeRoomFour = fresh();
delete beforeRoomFour.furthestChapter; // A v1 save made before explicit chapter tracking.
state.enterRoom(beforeRoomFour, 3);
state.enterChapter(beforeRoomFour, 2, 4);
assert.equal(beforeRoomFour.furthestRoom, 3);
state.enterChapter(beforeRoomFour, 1, 1);
state.saveRun(saved, beforeRoomFour);
assert.equal(state.reachedChapter(state.loadRun(saved)), 2);
state.enterChapter(beforeRoomFour, 3, 7);
state.enterChapter(beforeRoomFour, 2, 4);
assert.equal(state.reachedChapter(beforeRoomFour), 3);

for (const id of ['c1_ori1', 'c2_radio1', 'c3_fern1']) {
  const visit = fresh();
  const hotspot = find(id);
  openDialogue(visit, hotspot);
  advanceDialogue(visit, hotspot, 'end');
  assert.equal(state.hotspotStatus(visit, hotspot), 'Resume');
  const done = nodeChoices(hotspot, 'end')[0];
  assert.equal(done.id, 'done');
  followChoice(visit, hotspot, done);
  assert.equal(state.hotspotStatus(visit, hotspot), 'Complete');
  assert.equal(visit.activeDialogue, null);
  assert.ok(hotspot.afterText);
}

advanceDialogue(run, lab, 'wait');
followChoice(run, lab, nodeChoices(lab, 'wait')[0]);
assert.equal(state.hotspotStatus(run, lab), 'Resume');
followChoice(run, lab, nodeChoices(lab, 'done')[0]);
assert.equal(state.hotspotStatus(run, lab), 'Complete');

assert.match(rooms[2].title, /Laboratory/);
assert.ok(layouts[3].props.some(prop => prop.type === 'labBench'));
assert.ok(chapters[2].nextStop.trim());
const pip = find('c2_pip');
const manifest = items.find(item => item.id === 'cargo_manifest');
assert.doesNotMatch(JSON.stringify([pip.dialogue, manifest]), /seven|crate 7/i);
assert.equal(isVisible({ checkVisibility: () => true }), true);
globalThis.getComputedStyle = node => ({ visibility: node.visibility });
assert.equal(isVisible({ getClientRects: () => [{}], visibility: 'visible' }), true);
assert.equal(isVisible({ getClientRects: () => [{}], visibility: 'hidden' }), false);
assert.equal(isVisible({ getClientRects: () => [], visibility: 'visible' }), false);
delete globalThis.getComputedStyle;

const gates = [
  ['c1_power_on'], ['c1_air_ok', 'c1_lab_open'], ['c1_contacted'],
  ['c2_ring_lit'], ['c2_cargo_ok', 'c2_manifest'], ['c2_contacted'],
  ['c3_vault_open'], ['c3_crew_set', 'c3_crew_calm'], ['c3_contacted']
];
let records = 0;
for (const room of rooms) {
  assert.ok(room.afterIntro, `Missing repaired narration for room ${room.id}`);
  const progress = fresh();
  const exit = room.hotspots.find(hotspot => hotspot.exit);
  const puzzle = room.hotspots.find(hotspot => hotspot.puzzle);
  const gatedTalk = room.hotspots.find(hotspot => hotspot.dialogue && hotspot.needFlag);
  const layout = layouts[room.id];
  assert.equal(state.hotspotStatus(progress, exit), 'Locked');
  assert.equal(state.hotspotStatus(progress, puzzle), 'Available');
  if (gatedTalk) assert.equal(state.hotspotStatus(progress, gatedTalk), 'Locked');
  flag(progress, puzzle.setFlag);
  assert.equal(state.hotspotStatus(progress, puzzle), 'Complete');
  if (gatedTalk) assert.equal(state.hotspotStatus(progress, gatedTalk), 'Available');
  for (const required of gates[room.id - 1]) {
    delete progress.flags[required];
    assert.equal(state.hotspotStatus(progress, exit), 'Locked', `Room ${room.id}: missing ${required}`);
    flag(progress, required);
  }
  assert.equal(state.hotspotStatus(progress, exit), 'Open');
  records += room.hotspots.filter(hotspot => hotspot.puzzle || hotspot.text).length;
  assert.equal(walkable(layout, 0, layout.spawn), true);
  assert.equal(walkable(layout, layout.x, 0), false);
  for (const hotspot of room.hotspots) {
    const prop = layout.props.find(entry => entry.hotspot === hotspot.id);
    const route = routeTo(layout, 0, layout.spawn, prop);
    assert.ok(route, `No accessible route to ${hotspot.id}`);
    assert.ok(route.every(point => walkable(layout, point.x, point.z)));
    const end = route.at(-1) ?? { x: 0, z: layout.spawn };
    assert.ok(distanceTo(prop, end.x, end.z) <= 1.5);
  }
}
assert.equal(records, journalSize);

const progress = fresh();
flag(progress, 'c1_ending_study');
assert.ok(progress.inventory.includes('veil_recording'));
assert.ok(!progress.inventory.includes('veil_chart'));
flag(progress, 'c1_contacted');
assert.ok(progress.inventory.includes('veil_chart'));
flag(progress, 'c2_ending_medic');
flag(progress, 'c1_ending_quiet');
assert.ok(progress.inventory.includes('pulse_route'));
assert.ok(!progress.flags.c1_ending_study);
assert.ok(progress.flags.c2_ending_medic);

const training = fresh();
for (const room of rooms) {
  const puzzle = room.hotspots.find(entry => entry.puzzle);
  assert.equal(state.award(training, puzzle.id, 30), true);
  assert.equal(state.award(training, puzzle.id, 30), false);
}
for (const id of ['c1_lab_patient', 'c2_pip_count', 'c3_quarrel_rota']) state.award(training, id, 10);
assert.equal(training.xp, 300);
assert.equal(state.rankFor(training.xp), 7);
assert.equal(training.points, 6);
assert.equal(state.spendPoint(training, 'eng'), false, 'Points can only be spent on a room screen');
state.enterRoom(training, 2);
for (let n = 0; n < 4; n++) assert.equal(state.spendPoint(training, 'eng'), true);
assert.equal(training.stats.eng, 9);
assert.equal(state.spendPoint(training, 'eng'), false);
state.award(training, 'large', 100);
assert.equal(state.rankFor(training.xp), 9);
assert.equal(training.points, 4);
assert.equal(training.xp, 400);
assert.deepEqual([0, 44, 45, 89, 90, 359, 360].map(state.rankFor), [1, 1, 2, 2, 3, 8, 9]);
await import('./puzzles.test.js');
await import('./visuals.test.js');
console.log('Core tests passed for checks, saves, chapter revisits, nine room gates and paths, XP, and puzzle controls.');
