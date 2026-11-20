import { T, box, mesh, tube, beam, lettering } from './geometry.js';

export function buildShell(group, layout, id, c) {
  const { x, z } = layout;
  const panorama = [3, 4, 6, 8].includes(id);
  box(group, x * 2 + .32, .46, z * 2 + .32, c.dark, 0, -.29);
  box(group, x * 2, .11, z * 2, c.deck, 0, -.057);
  const seams = [];
  for (let col = -x; col <= x; col++) seams.push(col, .007, -z, col, .007, z);
  for (let row = -z; row <= z; row++) seams.push(-x, .007, row, x, .007, row);
  const grid = new T.BufferGeometry();
  grid.setAttribute('position', new T.Float32BufferAttribute(seams, 3));
  group.add(new T.LineSegments(grid, new T.LineBasicMaterial({ color: c.dark, transparent: true, opacity: .46 })));
  for (const side of [-1, 1]) {
    box(group, .06, .015, z * 2 - 1, c.hull, side * (x - .34), .012);
    box(group, .18, .85, z * 2, c.hull, side * x, .42);
    box(group, .27, .12, z * 2 + .18, c.dark, side * x, .9);
    box(group, .024, .052, z * 2 - .46, c.accent, side * (x - .102), .69, 0, true);
    for (let j = -z + 1; j < z; j += 2) {
      box(group, .36, 1.16, .28, c.hull, side * x, .58, j);
      box(group, .54, .018, .065, c.accent, side * (x - .28), .014, j, true);
    }
  }
  box(group, x * 2, .23, .23, c.hull, 0, .115, z);
  box(group, x * 2, .035, .055, c.accent, 0, .2, z + .122, true);
  const exit = layout.props.find(prop => prop.z === -z && ['door', 'vault'].includes(prop.type));
  if (exit) {
    const left = exit.x - 1.04;
    const right = exit.x + 1.04;
    box(group, left + x, 2.47, .23, c.hull, (left - x) / 2, 1.235, -z);
    box(group, x - right, 2.47, .23, c.hull, (right + x) / 2, 1.235, -z);
    box(group, 2.08, .32, .23, c.hull, exit.x, 2.31, -z);
  } else {
    box(group, x * 2, panorama ? .58 : 2.47, .23, c.hull, 0, panorama ? .29 : 1.235, -z);
  }
  box(group, x * 2, .075, .34, c.bright, 0, 2.43, -z, true);
  for (let col = -x; col <= x; col += 2) {
    if (exit && Math.abs(col - exit.x) < 1.25) continue;
    box(group, .16, 2.41, .34, c.dark, col, 1.205, -z);
    if (!panorama) {
      box(group, .58, .17, .032, c.deck, col + .55, 1.92, -z + .13);
      box(group, .08, .035, .045, c.accent, col + .48, 1.93, -z + .15, true);
    }
  }
  if (panorama) {
    mesh(group, new T.BoxGeometry(x * 2, 1.86, .035), c.accent, 0, 1.48, -z,
      { glow: true, material: { transparent: true, opacity: .10, depthWrite: false } });
  }
  if ([1, 3, 4, 6, 7].includes(id)) {
    for (let i = -z + 2; i <= z - 2; i += 2) {
      box(group, .07, .017, .48, c.accent, -.76, .02, i, true);
      box(group, .07, .017, .48, c.accent, .76, .02, i, true);
    }
  }
  for (const side of [-1, 1]) for (let i = 0; i < 5; i++) {
    const stripe = box(group, .11, .015, .4, c.accent, side * (x - 1 + i * .15), .014, z - .39);
    stripe.rotation.y = -.54;
  }
  lettering(group, `DECK 0${id}`, .46, z - .05, { scale: 1.25 });
}

export function exterior(group, layout, id, c) {
  const { x, z } = layout;
  const pipes = [];
  const ships = [];
  if (id === 2 || id === 9) {
    for (let i = 0; i < 3; i++) {
      const px = id === 2 ? -5 - i * .23 : -2.4 + i * 2.4;
      const height = id === 2 ? .57 + i * .22 : 2.16 + i * .18;
      pipes.push(beam(group, [px, height, id === 2 ? -4.2 : -5.86],
        [px, height, id === 2 ? .3 : 4], .13, c.hull, true));
      for (let k = -4; k < (id === 2 ? 1 : 5); k += 2) {
        const fitting = tube(group, .125, .125, .15, c.bright, px, height, k, 6);
        fitting.rotation.x = Math.PI / 2;
      }
    }
  }
  if (id === 3) {
    for (const px of [-x, -x / 2, x / 2, x]) {
      beam(group, [px, .87, -3], [px * .73, 2.75, -5], .09, c.hull);
      beam(group, [px * .73, 2.75, -5], [px * .52, 2.7, -6], .09, c.hull);
    }
    mesh(group, new T.IcosahedronGeometry(1.5, 2), 0xc86757, 0, 2.1, -12);
    mesh(group, new T.IcosahedronGeometry(1.64, 2), 0xa83b49, 0, 2.1, -12,
      { glow: true, material: { transparent: true, opacity: .27, depthWrite: false } });
  }
  if (id === 4 || id === 6) {
    for (const px of [-4, 0, 4]) {
      if (id === 4) {
        const ship = mesh(group, new T.OctahedronGeometry(1.1), c.hull, px, 1.45, -z - 3);
        ship.scale.set(.96, .32, .53);
      } else {
        box(group, 1.9, .17, 2.42, c.hull, px, .18, -z - 1.4);
        box(group, 1.65, .13, .24, c.hull, px, .61, -z - 2.25);
      }
      ships.push(box(group, .8, .08, .08, c.accent, px, id === 4 ? 1.44 : .59,
        -z - (id === 4 ? 2.42 : 2.09), true));
    }
  }
  return { ships, pipes };
}

export function starfield(scene) {
  const positions = [];
  for (let i = 0; i < 400; i++) {
    const x = Math.sin(i * 44.36) * 54;
    const y = Math.sin(i * 2.37) * 32;
    const z = -18 - (Math.cos(i * 36.13) + 1) * 24;
    positions.push(x, y, z);
  }
  const points = new T.BufferGeometry();
  points.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  scene.add(new T.Points(points, new T.PointsMaterial({ color: 0x8da6b8, size: .052 })));
}
