export const SAVE_KEY = 'driftSignal3d.v1';
export const STATS = ['eng', 'sci', 'emp'];
export const modifier = score => score - 3;
export const signed = number => number < 0 ? String(number) : `+${number}`;
export const rankFor = xp => Math.min(9, 1 + Math.floor(xp / 45));

export function newRun(background) {
  return {
    version: 1, classId: background.id, stats: { ...background.stats },
    screen: 'intro', chapter: 1, room: 1, furthestRoom: 0, furthestChapter: 1,
    flags: {}, xp: 0, points: 0, awards: {}, journal: {}, inventory: [],
    rolls: {}, dialogues: {}, activeDialogue: null
  };
}

export function loadRun(storage) {
  try {
    const run = JSON.parse(storage.getItem(SAVE_KEY));
    const isRecord = value => !!value && typeof value === 'object' && !Array.isArray(value);
    if (run?.version === 1 && typeof run.classId === 'string'
      && STATS.every(stat => Number.isInteger(run.stats?.[stat]) && run.stats[stat] >= 1 && run.stats[stat] <= 9)
      && Number.isInteger(run.room) && run.room >= 1 && run.room <= 9
      && Number.isInteger(run.chapter) && run.chapter >= 1 && run.chapter <= 3
      && Math.ceil(run.room / 3) === run.chapter
      && Number.isInteger(run.furthestRoom) && run.furthestRoom >= 0 && run.furthestRoom <= 9
      && (run.furthestChapter === undefined
        || (Number.isInteger(run.furthestChapter) && run.furthestChapter >= 1 && run.furthestChapter <= 3))
      && Number.isInteger(run.xp) && run.xp >= 0 && Number.isInteger(run.points) && run.points >= 0
      && ['intro', 'room', 'complete', 'finale'].includes(run.screen)
      && [run.flags, run.awards, run.journal, run.dialogues, run.rolls].every(isRecord)
      && Array.isArray(run.inventory)) return run;
  } catch {
    // A damaged or unavailable save leaves the title ready for a fresh run.
  }
  return null;
}

export function saveRun(storage, run) {
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(run));
    return true;
  } catch {
    return false;
  }
}

export function award(run, id, xp) {
  if (!id || !xp || run.awards[id]) return false;
  const before = rankFor(run.xp);
  run.awards[id] = xp;
  run.xp += xp;
  run.points += rankFor(run.xp) - before;
  return true;
}

export function spendPoint(run, stat) {
  if (run.screen !== 'room' || !STATS.includes(stat) || !run.points || run.stats[stat] >= 9) return false;
  run.stats[stat]++;
  run.points--;
  return true;
}

export function meetsFlags(run, entry) {
  return (!entry.needFlag || !!run.flags[entry.needFlag])
    && (!entry.needAll || entry.needAll.every(flag => run.flags[flag]))
    && (!entry.anyFlag || entry.anyFlag.some(flag => run.flags[flag]));
}

export function hotspotStatus(run, hotspot) {
  if (!meetsFlags(run, hotspot)) return 'Locked';
  if (hotspot.dialogue && run.dialogues[hotspot.id]) return 'Resume';
  if (hotspot.notFlag && run.flags[hotspot.notFlag]) return 'Complete';
  if (hotspot.puzzle && run.flags[hotspot.setFlag]) return 'Complete';
  if (hotspot.exit) return 'Open';
  return run.journal[hotspot.id] ? 'Recorded' : 'Available';
}

export function collect(run, item) {
  if (!item || run.inventory.includes(item)) return false;
  run.inventory.push(item);
  return true;
}

export function applyRoomAid(run, room) {
  const aid = room.entryAid;
  return !!(aid && meetsFlags(run, aid) && collect(run, aid.item));
}

export function setFlag(run, flag, chapters, items) {
  if (!flag) return;
  const chapter = chapters.find(entry => entry.endings.some(ending => ending.flag === flag));
  chapter?.endings.forEach(ending => { delete run.flags[ending.flag]; });
  run.flags[flag] = true;
  items.filter(item => (item.needFlag || item.anyFlag) && meetsFlags(run, item))
    .forEach(item => collect(run, item.id));
}

export function record(run, room, hotspot, text, bypass = false) {
  run.journal[hotspot.id] ??= { room, label: hotspot.label, text, bypass };
}

export function enterRoom(run, id) {
  run.screen = 'room';
  run.chapter = Math.ceil(id / 3);
  run.room = id;
  run.furthestRoom = Math.max(run.furthestRoom, id);
}

export function reachedChapter(run) {
  return Math.max(run.furthestChapter ?? 1, run.chapter, Math.ceil(run.furthestRoom / 3));
}

export function enterChapter(run, chapter, firstRoom) {
  run.furthestChapter = Math.max(reachedChapter(run), chapter);
  run.chapter = chapter;
  run.room = firstRoom;
  run.screen = 'intro';
  run.activeDialogue = null;
}
