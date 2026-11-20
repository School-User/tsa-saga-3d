import { T, box, tube, mesh, beam, shadow, person, lettering } from './geometry.js';
import { sizes } from './layouts.js';

const steel = 0x718694;
const white = 0xb8c7cd;
const green = 0x97f3ad;
const glass = 0x5f96ad;
const brass = 0xd2a160;

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

function greenhouse(group, c) {
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
  for (let i = 0; i < 6; i++) plant(group, (i % 3 - 1) * .91, i < 3 ? -.62 : .6,
    [0x86b965, 0x559a63, 0xb8ba78][i % 3]);
}

export function buildProp(parent, prop, c) {
  const group = new T.Group();
  group.position.set(prop.x, 0, prop.z);
  parent.add(group);
  const [w, d, h] = sizes[prop.type];
  shadow(group, w, d);
  const type = prop.type;
  let status = { lights: [] };
  if (type === 'door' || type === 'vault') status = door(group, type === 'vault', c);
  else if (type === 'pod' || type === 'openPod') pod(group, type === 'openPod', c);
  else if (type === 'crate') crate(group, c);
  else if (type === 'greenhouse') greenhouse(group, c);
  else if (type === 'robot') {
    box(group, .77, .34, .77, c.dark, 0, .22);
    tube(group, .37, .46, .6, brass, 0, .65, 0, 6);
    box(group, .63, .3, .45, steel, 0, 1.04);
    for (const x of [-.14, .14]) box(group, .13, .08, .025, c.accent, x, 1.065, .239, true);
    beam(group, [.2, 1.14, 0], [.25, 1.36, 0], .038, white);
  } else if (type === 'crew') {
    for (const [x, coat] of [[-1, 0xc2ab75], [1, 0xa0bbc8]]) {
      const figure = new T.Group();
      figure.position.x = x;
      group.add(figure);
      person(figure, coat, false);
    }
  } else if (type === 'cabinet') {
    box(group, w, 1.61, d, white, 0, .83);
    for (const y of [.42, .83, 1.24]) {
      box(group, 1.47, .32, .06, glass, 0, y, .47);
      box(group, .34, .052, .085, c.dark, 0, y + .04, .51);
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
  const badgeZ = type === 'door' || type === 'vault' ? .47 : .053;
  if (prop.name) lettering(group, prop.name, h + .17, badgeZ, { badge: !!prop.hotspot });
  if (prop.hotspot) {
    group.userData.hotspot = prop.hotspot;
    const marker = mesh(group, new T.OctahedronGeometry(.11), c.accent, 0, h + .48, badgeZ, { glow: true });
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
  for (const light of visual.lights) light.material.color.set(ready ? green : prop.flag ? 0xa06651 : colors.accent);
  visual.panels?.forEach((panel, i) => { panel.position.x = (i ? 1 : -1) * (ready ? .95 : .43); });
  if (visual.inset) visual.inset.visible = !ready;
  if (visual.load) visual.load.visible = ready;
}
