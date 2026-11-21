import { T, box, tube, mesh, beam, shadow, person, lettering, miniatureBase } from './geometry.js';
import { buildCharacter } from './characters.js';
import { sizes } from './layouts.js';

const steel = 0x718694;
const white = 0xb8c7cd;
const green = 0x97f3ad;
const glass = 0x5f96ad;
const brass = 0xd2a160;

const labelOffsets = {
  c2_pip: { x: -.35, y: .25 },
  c3_door1: { x: -.4, y: .24 },
  c3_p_lights: { x: .44, y: -.07 },
  c3_look2: { x: -.23, y: .15 },
  c3_p_assign: { x: .36, y: -.08 }
};

function screen(group, width, height, x, y, z, colors) {
  box(group, width, height, .13, steel, x, y, z);
  box(group, width * .87, height * .72, .15, colors.dark, x, y, z + .025);
}

function station(group, type, c) {
  const [w, d] = sizes[type];
  const strips = [];
  box(group, w, .13, d, c.dark, 0, .07);
  box(group, w * .73, .83, d * .68, c.hull, 0, .55);
  box(group, w, .13, d, steel, 0, .99);
  box(group, w * .65, .07, .035, c.accent, 0, .55, d * .35, true);
  if (type === 'grid') {
    for (let row = 0; row < 4; row++) for (let col = 0; col < 5; col++) {
      const active = (row + col) % 3 === 0;
      const tile = box(group, .18, .051, .13, active ? c.accent : c.dark,
        (col - 2) * .25, 1.08, (row - 1.5) * .17, true);
      if (active) strips.push(tile);
    }
  } else if (type === 'decoder') {
    screen(group, 1.35, .52, 0, 1.3, -.21, c);
    lettering(group, 'DL HYL UVA HSVUL', 1.32, -.089, { scale: .53 });
    for (const x of [-.53, .53]) {
      strips.push(box(group, .1, .054, .054, c.accent, x, 1.05, .3, true));
    }
  } else if (type === 'locks') {
    for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) {
      const x = (col - 1.5) * .25;
      const z = (row - 1.5) * .19;
      box(group, .21, .085, .16, c.dark, x, 1.095, z);
      strips.push(box(group, .12, .02, .085, c.accent, x, 1.145, z, true));
    }
  } else if (type === 'pipeFrame') {
    for (const x of [-.44, 0, .44]) {
      beam(group, [x, 1.07, .29], [x, 1.41, -.24], .09, brass);
      strips.push(box(group, .055, .07, .28, c.accent, x, 1.29, .024, true));
    }
  } else if (type === 'pads') {
    const colors = [0xf68199, 0xf5b857, 0x76dfa6, 0x75acfa];
    colors.forEach((color, i) => {
      const x = (i - 1.5) * .33;
      const pad = tube(group, .127, .149, .08, color, x, 1.1, 0, [16, 3, 4, 4][i], true);
      pad.rotation.y = i === 2 ? Math.PI / 4 : 0;
    });
  } else if (type === 'valves' || type === 'gauges') {
    const count = type === 'valves' ? 4 : 2;
    for (let i = 0; i < count; i++) {
      const x = (i - (count - 1) / 2) * (count === 4 ? .43 : .64);
      const rim = tube(group, .18, .21, .11, brass, x, 1.18, -.19, 14);
      rim.rotation.x = Math.PI / 2;
      const face = tube(group, .132, .132, .12, c.dark, x, 1.18, -.119, 12);
      face.rotation.x = Math.PI / 2;
      if (type === 'valves') {
        strips.push(box(group, .13, .035, .04, c.accent, x, 1.41, -.12, true));
        box(group, .28, .037, .044, white, x, 1.18, -.054);
        box(group, .037, .27, .044, white, x, 1.18, -.054);
        lettering(group, 'ABCD'[i], 1.11, .33, { x, scale: .42 });
      } else {
        const needle = box(group, .025, .17, .034, c.accent, x, 1.22, -.054, true);
        needle.rotation.z = -.83 + i * .45;
        strips.push(needle);
      }
    }
  } else if (type === 'log') {
    const display = box(group, w * .83, .065, .52, 0xbfb492, 0, 1.09, -.05);
    display.rotation.x = -.28;
    for (let i = 0; i < 4; i++) box(group, .58 - .07 * i, .025, .027, c.dark, -.11, 1.134, i * .085 - .11);
  } else {
    screen(group, w * .89, .48, 0, 1.22, -.19, c);
    const count = type === 'wave' ? 8 : 3;
    for (let i = 0; i < count; i++) {
      const height = type === 'wave' ? [.08, .17, .11, .28, .07, .15, .22, .07][i] : .06;
      strips.push(box(group, .065, height, .03, c.accent, (i - (count - 1) / 2) * .135, 1.225, -.081, true));
    }
  }
  return strips;
}

function pod(group, open, c) {
  box(group, 1.66, .19, 1.27, c.dark, 0, .12);
  box(group, 1.44, .37, 1.13, white, 0, .37);
  const shell = mesh(group, new T.CapsuleGeometry(.45, .63, 4, 10), open ? c.dark : glass, 0, .54, 0);
  shell.rotation.z = Math.PI / 2;
  shell.scale.z = open ? .59 : .92;
  for (const x of [-.68, .68]) box(group, .09, .37, 1.22, steel, x, .45);
  box(group, 1.08, .048, .036, c.accent, 0, .33, .58, true);
  if (open) {
    const lid = mesh(group, new T.CapsuleGeometry(.43, .57, 3, 8), glass, 0, .86, -.48);
    lid.rotation.z = Math.PI / 2;
    lid.scale.set(.54, 1, .17);
    box(group, .28, .04, .19, brass, .26, .79, .04);
    box(group, .16, .044, .026, white, .26, .804, .04);
  }
}

function door(group, round, c) {
  if (round) {
    mesh(group, new T.TorusGeometry(.95, .12, 6, 14), steel, 0, 1.04, .07);
  } else {
    for (const x of [-1, 1]) box(group, .16, 2.18, .44, steel, x, 1.09);
    box(group, 2.12, .16, .46, steel, 0, 2.08);
  }
  const inset = round ? tube(group, .91, .91, .13, c.dark, 0, 1.04, .09, 14)
    : box(group, 1.91, 1.95, .13, c.dark, 0, 1.02, .09);
  if (round) inset.rotation.x = Math.PI / 2;
  const panels = [-.43, .43].map(x => box(group, round ? .61 : .82, round ? 1.27 : 1.75, .18, c.hull, x, 1, .22));
  const light = box(group, .65, .09, .06, c.accent, 0, 1.88, .33, true);
  return { inset, panels, lights: [light] };
}

function crate(group, c) {
  box(group, 1.25, 1, 1.24, 0x737977, 0, .53);
  box(group, 1.28, .1, 1.28, steel, 0, .92);
  for (const x of [-.47, .47]) {
    box(group, .12, 1.05, 1.29, c.hull, x, .55);
    box(group, .15, .085, .02, brass, x, .18, .652, true);
  }
  box(group, 1.27, .11, 1.26, c.dark, 0, .11);
}

function plant(group, x, z, variant) {
  tube(group, .23, .17, .29, 0x8d6047, x, .24, z, 6);
  beam(group, [x, .36, z], [x, .82, z], .04, 0x758f54);
  for (const [dx, y, dz] of [[-.15, .64, .06], [.16, .75, .02], [.02, .87, -.06]]) {
    const leaf = mesh(group, new T.IcosahedronGeometry(.18), variant, x + dx, y, z + dz);
    leaf.scale.set(1, 1.4, .42);
    leaf.rotation.z = -dx * 3;
  }
}

function greenhouse(group, c, name) {
  box(group, 3.35, .18, 2.8, c.hull, 0, .09);
  for (const z of [-1.32, 0, 1.32]) {
    const outline = [[-1.62, .18, z], [-1.62, 1.18, z], [0, 2.08, z], [1.62, 1.18, z], [1.62, .18, z]];
    outline.slice(1).forEach((to, i) => beam(group, outline[i], to, .085, steel));
  }
  beam(group, [0, 2.08, -1.35], [0, 2.08, 1.35], .09, c.accent);
  for (const x of [-1.6, 1.6]) {
    const pane = mesh(group, new T.BoxGeometry(.035, .94, 2.65), glass, x, .68, 0,
      { material: { transparent: true, opacity: .24, depthWrite: false } });
    pane.renderOrder = 2;
  }
  const foliage = { DOME: 0x9bc86f, VINE: 0x52975d, MOSS: 0xd2be77 };
  for (let i = 0; i < 6; i++) plant(group, (i % 3 - 1) * .91, i < 3 ? -.62 : .6, foliage[name]);
  if (name === 'VINE') {
    for (const x of [-1.16, 0, 1.16]) beam(group, [x, .2, -.66], [x, 1.52, -.66], .043, 0x857147);
    beam(group, [-1.17, 1.38, -.66], [1.17, 1.38, -.66], .049, 0x91ad59);
  }
}

export function buildProp(parent, prop, c) {
  const group = new T.Group();
  group.position.set(prop.x, 0, prop.z);
  parent.add(group);
  const [w, d, h] = sizes[prop.type];
  const type = prop.type;
  let status = { lights: [] };
  shadow(group, w, d);
  if (type === 'door' || type === 'vault') status = door(group, type === 'vault', c);
  else if (type === 'pod' || type === 'openPod') pod(group, type === 'openPod', c);
  else if (type === 'crate') crate(group, c);
  else if (type === 'crateStack') {
    for (const y of [.42, 1.18, 1.94]) {
      box(group, w, .69, d, y === 1.18 ? steel : c.hull, 0, y);
      box(group, .49, .13, .06, c.accent, 0, y, d / 2 + .03);
    }
  } else if (type === 'tankBank') {
    for (const z of [-1.1, 0, 1.1]) {
      tube(group, .3, .39, 1.5, steel, 0, .82, z);
      for (const y of [.32, 1.12]) tube(group, .4, .4, .12, c.dark, 0, y, z);
    }
  } else if (type === 'greenhouse') {
    greenhouse(group, c, prop.name);
    for (const x of [-.78, .78]) {
      box(group, .88, .19, 2.44, 0x453932, x, .24);
      status.lights.push(box(group, .54, .06, .045, c.accent, x, .4, 1.12, true));
    }
  } else if (type === 'robot') {
    miniatureBase(group, brass);
    tube(group, .34, .45, .25, c.dark, 0, .245, 0, 12);
    tube(group, .37, .46, .6, brass, 0, .65, 0, 6);
    box(group, .63, .3, .45, steel, 0, 1.04);
    for (const x of [-.14, .14]) box(group, .13, .08, .025, c.accent, x, 1.065, .239, true);
    beam(group, [.2, 1.14, 0], [.25, 1.36, 0], .038, white);
  } else if (type === 'crew') {
    for (const [x, coat] of [[-1, 0xc2ab75], [1, 0xa0bbc8]]) {
      const figure = new T.Group();
      figure.position.x = x;
      group.add(figure);
      miniatureBase(figure, coat);
      person(figure, coat, false);
    }
  } else if (type === 'labBench') {
    box(group, w, .12, d, steel, 0, .94);
    for (const x of [-.89, .89]) box(group, .12, .89, .73, c.hull, x, .445);
    box(group, .9, .06, .56, c.dark, -.4, 1.02);
    for (const x of [-.64, -.4, -.16]) tube(group, .068, .083, .27, glass, x, 1.19, 0, 8);
    box(group, .5, .29, .48, c.hull, .55, 1.11);
    box(group, .24, .042, .026, c.bright, .55, 1.16, .25, true);
  } else if (type === 'cabinet') {
    box(group, w, 1.61, d, white, 0, .83);
    for (const y of [.42, .83, 1.24]) {
      box(group, 1.47, .32, .06, glass, 0, y, .47);
      box(group, .34, .052, .085, c.dark, 0, y + .04, .51);
      for (const x of [-.52, .52]) {
        status.lights.push(box(group, .095, .13, .045, c.accent, x, y, .515, true));
      }
    }
  } else if (type === 'scale') {
    box(group, 1.69, .18, .84, c.dark, 0, .13);
    tube(group, .09, .19, 1.24, brass, 0, .78, 0);
    box(group, 1.8, .1, .12, brass, 0, 1.39);
    for (const x of [-.69, .69]) {
      beam(group, [x, 1.39, 0], [x, .8, 0], .04, white);
      tube(group, .34, .24, .09, brass, x, .8, 0, 12);
    }
  } else if (type === 'rig') {
    for (const x of [-.81, .81]) box(group, .17, 2.1, .7, steel, x, 1.05);
    box(group, 1.82, .25, .67, c.hull, 0, 2.04);
    box(group, 1.82, .17, .94, brass, 0, .11);
    status.lights.push(box(group, .31, .09, .04, c.accent, 0, 2.03, .35, true));
    status.load = box(group, .92, .78, .77, steel, 0, .56);
  } else if (type === 'lamp') {
    tube(group, .1, .2, .94, steel, 0, .5, 0);
    status.lights.push(tube(group, .22, .21, .23, c.accent, 0, 1.045, 0, 6, true));
  } else {
    status.lights = station(group, type, c);
  }
  if (prop.hotspot === 'c2_p_memory') {
    status.aid = box(group, .27, .065, .27, green, 0, 1.14, .26, true);
    status.aidFlag = 'c2_tamsin_calm';
  } else if (prop.hotspot === 'c3_p_assign') {
    status.aid = lettering(group, 'FERN’S NOTES', 1.2, .42, { scale: .52, x: .28, badge: true });
    status.aidFlag = 'c3_fern_calm';
  }
  if (prop.character) {
    const figure = buildCharacter(group, prop.character);
    figure.position.set(0, 1.18, -.13);
    figure.rotation.y = .16;
    figure.scale.setScalar(1.05);
    status.figure = figure;
    box(group, .65, .06, .48, c.bright, 0, 1.11, -.12, true);
  }
  if (prop.hotspot === 'c1_listen') {
    lettering(group, 'D → W', 1.36, .34, { scale: .55 });
  }
  const badgeZ = type === 'door' || type === 'vault' ? .67 : .18;
  const offset = labelOffsets[prop.hotspot];
  const badgeX = offset?.x ?? 0;
  const badgeY = h + (prop.character ? 1.16 : .17) + (offset?.y ?? 0);
  if (prop.name) lettering(group, prop.name, badgeY, badgeZ, { badge: !!prop.hotspot, x: badgeX });
  if (prop.hotspot) {
    group.userData.hotspot = prop.hotspot;
    const marker = mesh(group, new T.OctahedronGeometry(.11), c.accent, badgeX, badgeY + .34, badgeZ, { glow: true });
    status.marker = marker;
  }
  return { group, ...status };
}

export function updateProp(prop, visual, run, status, colors) {
  const ready = prop.flag ? !!run.flags[prop.flag] : ['Open', 'Complete', 'Recorded'].includes(status);
  if (visual.marker) {
    visual.marker.material.color.set(status === 'Locked' ? 0xffba82 : ready ? green : colors.accent);
    visual.marker.scale.set(status === 'Locked' ? 1.5 : 1, ready ? .6 : 1, 1);
  }
  for (const light of visual.lights) {
    light.material.color.set(ready ? green : prop.flag ? 0xa06651 : colors.accent);
    if (prop.type === 'locks') light.visible = !ready;
    if (prop.type === 'gauges' && prop.flag === 'c1_air_ok' && ready) light.rotation.z = .28;
  }
  if (visual.aid) visual.aid.visible = !!run.flags[visual.aidFlag];
  if (visual.figure) visual.figure.visible = status !== 'Locked';
  visual.panels?.forEach((panel, i) => { panel.position.x = (i ? 1 : -1) * (ready ? .95 : .43); });
  if (visual.inset) visual.inset.visible = !ready;
  if (visual.load) visual.load.visible = ready;
}
