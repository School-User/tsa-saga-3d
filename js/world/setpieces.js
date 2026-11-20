import { T, box, tube, beam, mesh } from './geometry.js';

const steel = 0x819ba8;

function conduit(group, points, width, color, glow = false) {
  return points.slice(1).map((point, i) => beam(group, points[i], point, width, color, glow));
}

function cryo(group, c) {
  const feeds = [];
  for (const side of [-1, 1]) {
    const line = [[side * 4, .04, 2], [side * 4, .04, -3.3],
      [side * 2.2, .04, -4.7], [side * .58, .04, -5.72]];
    conduit(group, line, .22, c.dark);
    feeds.push(...conduit(group, line.map(([x, , z]) => [x, .17, z]), .075, c.hull, true));
    for (const z of [-2, 0, 2]) {
      box(group, 1.96, .09, 1.57, c.hull, side * 4, .025, z);
    }
  }
  return { statusLights: feeds, flag: 'c1_power_on' };
}

function airBank(group, c) {
  const header = [[-5.58, 1.53, -4.6], [-5.58, 1.53, .9], [-4.78, 1.53, 1.5]];
  return { statusLights: conduit(group, header, .13, c.hull, true), flag: 'c1_air_ok' };
}

function signalDish(group, c) {
  const dish = new T.Group();
  group.add(dish);
  dish.position.set(4.25, 1.45, -7.1);
  dish.rotation.set(-.63, -.45, 0);
  beam(group, [4.25, .05, -7.1], [4.25, 1.5, -7.1], .23, steel);
  mesh(dish, new T.SphereGeometry(1.32, 11, 4, 0, Math.PI * 2, 0, Math.PI / 3), c.hull, 0, 0, 0,
    { material: { side: T.DoubleSide } }).rotation.x = Math.PI;
  mesh(dish, new T.TorusGeometry(1.14, .055, 5, 16), steel, 0, -.66, 0).rotation.x = Math.PI / 2;
  for (const x of [-.69, .69]) beam(dish, [x, -.66, .7], [0, .36, 0], .046, steel);
  return { statusLights: [tube(dish, .14, .16, .22, c.hull, 0, .36, 0, 6, true)], flag: 'c1_decoded' };
}

function dockingRing(group, c) {
  const ring = mesh(group, new T.TorusGeometry(2.1, .19, 6, 16), steel, 0, 1.6, -7.35);
  ring.rotation.x = -.1;
  const lights = [];
  for (let i = 0; i < 12; i++) {
    const angle = i / 12 * Math.PI * 2;
    const lamp = box(group, .29, .17, .12, c.hull, Math.cos(angle) * 2.1,
      1.6 + Math.sin(angle) * 2.1, -7.15, true);
    lamp.rotation.z = angle + Math.PI / 2;
    lights.push(lamp);
  }
  for (const x of [-5, 5]) beam(group, [x, 0, -4.7], [x * .43, 2.1, -7.5], .26, c.hull);
  return { statusLights: lights, flag: 'c2_ring_lit', cadence: 'chase' };
}

function cargo(group, c) {
  for (const x of [-6, 6]) box(group, .12, .042, 3.8, c.accent, x, .022, -3.95);
  return {};
}

function beacon(group, c) {
  for (const x of [-1.04, 1.04]) {
    beam(group, [x, .12, -6.8], [0, 3.7, -7.35], .18, steel);
    beam(group, [x, .12, -7.9], [0, 3.7, -7.35], .14, c.hull);
  }
  for (const y of [1, 2.08, 3.14]) {
    tube(group, 1.08 - y * .25, 1.08 - y * .25, .12, c.hull, 0, y, -7.35, 8);
  }
  const lens = mesh(group, new T.OctahedronGeometry(.63), c.hull, 0, 3.91, -7.35, { glow: true });
  beam(group, [0, 4.25, -7.35], [0, 5.11, -7.35], .07, steel);
  return { statusLights: [lens], flag: 'c2_beacon_tuned', cadence: 'pulse' };
}

function seedVault(group, c) {
  for (const x of [-3.7, 3.7]) {
    box(group, 2.23, 2.45, .22, c.dark, x, 1.23, -5.76);
    for (const y of [.42, .96, 1.5, 2.04]) for (const dx of [-.76, -.25, .25, .76]) {
      box(group, .43, .4, .14, steel, x + dx, y, -5.54);
      box(group, .28, .11, .04, c.accent, x + dx, y, -5.44);
    }
  }
  return {};
}

function dome(group, c) {
  for (const z of [-7.2, -4.1, -1.15]) {
    const arch = [[-10, .9, z], [-8.2, 2.7, z], [-4.4, 3.7, z],
      [4.4, 3.7, z], [8.2, 2.7, z], [10, .9, z]];
    conduit(group, arch, .075, steel);
  }
  const growLights = [-6, 0, 6].map(x =>
    box(group, 2.35, .11, .19, c.hull, x, 2.31, -3, true));
  return { statusLights: growLights, flag: 'c3_crew_set' };
}

function water(group, c) {
  box(group, 2.05, .09, 9.6, 0x182d3c, -2.35, .02, -.25);
  box(group, 1.51, .06, 9.34, 0x203b48, -2.35, .085, -.25);
  for (const x of [-3.39, -1.31]) box(group, .095, .12, 9.6, steel, x, .075, -.25);
  for (const z of [-3.85, -.65, 3.4]) box(group, 2.17, .081, .42, steel, -2.35, .13, z);
  const stream = box(group, 1.43, .061, 9.29, 0x287f9b, -2.35, .104, -.25);
  const ripples = Array.from({ length: 8 }, (_, i) =>
    box(group, .43 + i % 3 * .16, .011, .046, 0x86e8e8, -2.35, .149, -4 + i, true));
  const branch = conduit(group, [[-5.6, 2.14, 2], [-5.6, 2.14, -3.9],
    [-5.6, .63, -3.9], [-3.3, .31, -3.9]], .19, steel);
  return { statusLights: branch, stream, ripples, flag: 'c3_water_flows' };
}

const builders = [cryo, airBank, signalDish, dockingRing, cargo, beacon, seedVault, dome, water];

export function buildSetpiece(group, id, colors) {
  return builders[id - 1](group, colors);
}

export function updateSetpiece(piece, flags, colors) {
  const ready = !!flags[piece.flag];
  piece.ready = ready;
  piece.bright = colors.bright;
  for (const light of piece.statusLights ?? []) light.material.color.set(ready ? colors.bright : colors.hull);
  if (piece.stream) piece.stream.visible = ready;
  piece.ripples?.forEach(ripple => { ripple.visible = ready; });
}

export function animateSetpiece(piece, now, reduced) {
  if (piece.ready && piece.cadence) {
    const step = Math.floor(now / 155) % piece.statusLights.length;
    piece.statusLights.forEach((light, i) => {
      const distance = (step - i + piece.statusLights.length) % piece.statusLights.length;
      const intensity = piece.cadence === 'pulse' ? .73 + .27 * Math.cos(now / 440)
        : Math.max(.36, 1 - distance * .25);
      light.material.color.set(piece.bright).multiplyScalar(reduced ? 1 : intensity);
    });
  }
  piece.ripples?.forEach((ripple, i) => {
    const travel = reduced ? 0 : now / 1380;
    ripple.position.z = -4.65 + ((i * 1.13 + travel) % 8.8);
    ripple.position.x = -2.35 + ((i % 3) - 1) * .2;
  });
}
