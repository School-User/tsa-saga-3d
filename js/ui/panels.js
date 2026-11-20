import { chapters, companions, items, rooms } from '../story/data.js';
import { hotspotStatus, meetsFlags, STATS } from '../state.js';
import { presentCompanions } from '../checks.js';
import { layouts } from '../world/layouts.js';
import { direction } from '../world/navigation.js';
import { portrait } from './portraits.js';
import { button, el, section, list } from './dom.js';

const panelTitles = {
  journal: 'Journal', inventory: 'Inventory', party: 'Party', objects: 'Room objects',
  pause: 'Paused', training: 'Spend rank points'
};

export function openPanel(id, ctx) {
  const { modal, room, run, close } = ctx;
  modal.open(id, panelTitles[id], content => {
    if (id === 'journal') journal(content, run);
    if (id === 'inventory') inventory(content, run);
    if (id === 'party') party(content, room, run);
    if (id === 'objects') objects(content, room, run, ctx);
    if (id === 'pause') {
      if (!ctx.saved) content.append(el('p', '', 'Progress is available for this session. Keep this tab open to continue.'));
      content.append(button(ctx.saved ? 'Save and return to title' : 'Return to title', ctx.title));
    }
    if (id === 'training') training(content, run, ctx);
    content.append(button(id === 'pause' ? 'Resume' : 'Back', close, 'btn primary'));
  }, close);
}

function journal(content, run) {
  const entries = Object.values(run.journal);
  if (!entries.length) content.append(el('p', '', 'Inspections and console work are recorded here.'));
  chapters.forEach((chapter, index) => {
    const chapterRooms = rooms.filter(room => room.chapter === index + 1
      && entries.some(entry => entry.room === room.id));
    if (!chapterRooms.length) return;
    content.append(el('h3', '', chapter.title));
    for (const room of chapterRooms) {
      content.append(el('h4', 'eyebrow', room.title));
      for (const entry of entries.filter(record => record.room === room.id)) {
        const label = el('strong', '', entry.label + (entry.bypass ? ' · Bypassed' : ''));
        const row = el('p', 'record');
        row.append(label, el('span', '', entry.text));
        content.append(row);
      }
    }
  });
}

function inventory(content, run) {
  if (!run.inventory.length) content.append(el('p', '', 'Your evidence and route records will appear here.'));
  for (const item of items.filter(item => run.inventory.includes(item.id))) {
    section(content, item.name, item.text);
  }
}

function party(content, room, run) {
  partyMember(content, 'navigator', 'Navigator · Present', 'Fleet Navigator');
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
