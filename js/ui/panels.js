import { classes, companions, items, rooms } from '../story/data.js';
import { hotspotStatus, meetsFlags, modifier, passivePerception, rankFor, signed, STATS } from '../state.js';
import { presentCompanions } from '../checks.js';
import { keepsakes, skills } from '../story/tabletop.js';
import { layouts } from '../world/layouts.js';
import { direction } from '../world/navigation.js';
import { portrait } from './portraits.js';
import { button, el, section, list } from './dom.js';

const panelTitles = {
  journal: 'Quest log', inventory: 'Inventory', sheet: 'Character sheet', objects: 'Room objects',
  help: 'How to play', pause: 'Paused', training: 'Spend rank points'
};

export function openPanel(id, ctx) {
  const { modal, room, run, close } = ctx;
  modal.open(id, panelTitles[id], content => {
    if (id === 'journal') journal(content, room, run);
    if (id === 'inventory') inventory(content, run);
    if (id === 'sheet') characterSheet(content, room, run, ctx.markChatter);
    if (id === 'help') help(content);
    if (id === 'objects') objects(content, room, run, ctx);
    if (id === 'pause') {
      if (!ctx.saved) content.append(el('p', '', 'Progress is available for this session. Keep this tab open to continue.'));
      content.append(ctx.musicControls());
      content.append(button(ctx.saved ? 'Save and return to title' : 'Return to title', ctx.title));
    }
    if (id === 'training') training(content, run, ctx);
    content.append(button(id === 'pause' ? 'Resume' : 'Back', close, 'btn primary'));
  }, close);
}

function help(content) {
  section(content, 'Explore', 'Walk with WASD or the arrow keys. When an object is within reach, press E. Click or tap a prop to approach and interact, or open Room objects to choose from a list.');
  section(content, 'Use panels and consoles', 'Tab or Shift+Tab moves between controls. Enter or Space activates the focused control. Use arrow keys inside puzzle grids and sliders. Escape closes a panel or opens Pause while exploring.');
  section(content, 'Make a check', 'Roll a d20 and add your stat modifier (score minus 3) and any companion bonus. Meet or exceed the difficulty class (DC) to pass. Advantage keeps the higher of two dice and disadvantage keeps the lower. A natural 20 always passes and earns Inspiration. A natural 1 always fails. Marked roleplay replies also earn Inspiration, up to one token. Spend it before a check for advantage. A failed check still leaves another way forward.');
  section(content, 'Gain ranks and use evidence', 'Inspections and repairs earn XP. When you gain a rank, use Spend points by the rank meter to raise a stat. The Quest log tracks goals, inspections and chatter. The Character sheet shows your skills, personality and party. Inventory holds evidence and keepsakes.');
}

function journal(content, room, run) {
  content.append(el('h3', '', 'Main quest'), el('p', '', `Follow the signal · ${room.title}`),
    list(room.goals.map(goal => questRow(goal.text, meetsFlags(run, goal)))));
  const repairs = Object.values(run.journal).filter(entry =>
    rooms[entry.room - 1]?.hotspots.some(hotspot => hotspot.puzzle && hotspot.label === entry.label));
  if (repairs.length) {
    const records = el('details');
    records.append(el('summary', '', 'Console records'));
    for (const entry of repairs) records.append(questRow(entry.label, true, entry.text));
    content.append(records);
  }

  content.append(el('h3', '', 'Side quests'));
  const present = presentCompanions(run, companions);
  for (const visited of rooms.slice(0, run.furthestRoom)) {
    const optional = visited.hotspots.filter(hotspot => hotspot.text && !hotspot.puzzle);
    const chatter = (visited.banter ?? []).map((line, index) => {
      const companion = companions.find(entry => entry.id === line.companion);
      const heard = !!run.chatter[`${visited.id}.${index}`];
      if (!heard && (!present.includes(companion) || !meetsFlags(run, line))) return null;
      return questRow(`Listen to ${companion.name}`, heard, heard ? line.text : '');
    }).filter(Boolean);
    if (!optional.length && !chatter.length) continue;
    content.append(el('h4', '', visited.title), list([
      ...optional.map(hotspot => {
        const record = run.journal[hotspot.id];
        const keepsake = keepsakes[hotspot.id];
        const treasure = keepsake && run.inventory.includes(keepsake.id) ? keepsake.name : '';
        return questRow(hotspot.label, !!record, record?.text, treasure);
      }),
      ...chatter
    ], 'quest-list'));
  }
}

function questRow(label, complete, detail, treasure) {
  const row = el('div', 'record');
  const heading = el('strong', '', label);
  const marker = el('span', 'quest-marker', complete ? '✓' : '○');
  marker.setAttribute('aria-label', complete ? 'Complete' : 'Pending');
  heading.prepend(marker, ' ');
  row.append(heading);
  if (detail) row.append(el('span', '', detail));
  if (treasure && complete) row.append(el('span', '', `Keepsake · ${treasure}`));
  return row;
}

function inventory(content, run) {
  if (!run.inventory.length) content.append(el('p', '', 'Your evidence, route records and keepsakes will appear here.'));
  for (const item of items.filter(item => run.inventory.includes(item.id))) {
    section(content, item.name, item.text);
  }
}

function characterSheet(content, room, run, markChatter) {
  const background = classes.find(entry => entry.id === run.classId);
  partyMember(content, 'navigator', background.name, `${background.background} · Rank ${rankFor(run.xp)}`);
  content.append(el('p', 'sheet-inspiration', `Inspiration ${run.inspiration}/1 · Passive Perception ${passivePerception(run)}`));
  content.append(el('h3', '', 'Abilities and skills'), list(STATS.map(stat =>
    `${stat.toUpperCase()} ${run.stats[stat]} (${signed(modifier(run.stats[stat]))}) · ${skills[stat].join(', ')}`)));
  content.append(el('h3', '', 'Personality'), list([
    `Ideal · ${run.personality.ideal}`, `Bond · ${run.personality.bond}`
  ]));
  const group = el('details');
  group.append(el('summary', '', 'Party and companion aid'));
  group.addEventListener('toggle', () => {
    if (group.open && group.isConnected) markChatter();
  });
  party(group, room, run);
  content.append(group);
}

function party(content, room, run) {
  const present = presentCompanions(run, companions);
  for (const companion of companions) {
    const joined = present.includes(companion);
    partyMember(content, companion.id, companion.name + (joined ? ' · Present' : ' · Away'), companion.joins);
    const aids = companion.aid.map(aid => {
      const active = joined && meetsFlags(run, aid);
      const bonus = aid.advantage ? 'Advantage' : `+${aid.bonus} aid`;
      return `${bonus} · ${active ? 'Available' : 'Conditional'}. ${aid.text}`;
    });
    content.append(list(aids, 'aid-list'));
    for (const line of room.banter ?? []) {
      if (joined && line.companion === companion.id && meetsFlags(run, line)) {
        content.append(el('blockquote', '', line.text));
      }
    }
  }
  if (run.flags.c1_contacted && run.flags.c1_ending_peace) {
    partyMember(content, 'veil', 'The Veil · Present', 'Carries its memories aboard Meridian.');
  }
}

function partyMember(content, id, name, text) {
  const heading = el('h3', 'party-name', name);
  heading.prepend(portrait(id));
  content.append(heading, el('p', '', text));
}

function objects(content, room, run, ctx) {
  const layout = layouts[room.id];
  const position = ctx.position ?? { x: 0, z: layout.spawn };
  content.append(el('p', '', ctx.position
    ? 'Choose an object to walk to it and interact.'
    : 'Choose an object to interact.'));
  const rows = room.hotspots.map(hotspot => {
    const prop = layout.props.find(entry => entry.hotspot === hotspot.id);
    const compass = direction(prop.x - position.x, prop.z - position.z);
    const status = hotspotStatus(run, hotspot);
    const control = button('', () => ctx.guide(hotspot.id), 'object-choice');
    control.append(el('strong', '', hotspot.label), el('span', '', `${compass} · ${status}`));
    return control;
  });
  content.append(list(rows, 'object-list'));
}

function training(content, run, ctx) {
  content.append(el('p', '', `${run.points} points available. Each point raises one score by 1.`));
  const row = el('div', 'row');
  for (const stat of STATS) {
    const choice = button(`Raise ${stat.toUpperCase()} (${run.stats[stat]})`, () => ctx.spend(stat));
    choice.disabled = !run.points || run.stats[stat] >= 9;
    row.append(choice);
  }
  content.append(row);
}
