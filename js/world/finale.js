import { T, box, beam, tube, mesh } from './geometry.js';

const hull = 0x426764;
const ribs = 0x8ca9a0;
const glass = 0x64cbb2;
const light = 0xb9ffd7;
const seed = 0xf3d489;

// Each ending uses the same ark silhouette and highlights a different system.
const endings = {
  release: { flag: 'c3_ending_release', caption: 'Verdant · Seeds drift past the open bay.' },
  replant: { flag: 'c3_ending_replant', caption: 'Verdant · The dome is lit for planting.' },
  vault: { flag: 'c3_ending_vault', caption: 'Verdant · The vault is sealed for the voyage.' }
};

export function finaleEnding(flags) {
  return Object.keys(endings).find(id => flags[endings[id].flag]) ?? 'vault';
}

export function finaleCaption(flags) {
  return endings[finaleEnding(flags)].caption;
}

export function buildFinale(group, flags) {
  const ending = finaleEnding(flags);
  const ship = new T.Group();
  group.add(ship);
  ship.rotation.y = .31;

  box(ship, 13.2, .48, 4.65, 0x203c46, 0, 1.16);
  const keel = tube(ship, 1.43, .88, 12.8, hull, 0, .86, 0, 6);
  keel.rotation.z = Math.PI / 2;
  for (const x of [-5.65, 5.65]) {
    box(ship, 2.02, 1.06, 3.92, hull, x, 1.54);
    box(ship, 1.72, .11, 4.24, ribs, x, 1.19);
    box(ship, 1.5, .17, .08, light, x, 1.44, 2, true);
  }
  for (const z of [-2.03, 2.03]) {
    beam(ship, [-5.8, 1.51, z], [5.8, 1.51, z], .13, ribs);
    for (const x of [-4.55, -3.05, -1.5, 0, 1.5, 3.05, 4.55]) {
      box(ship, .61, .085, .11, light, x, 1.2, z * 1.15, true);
    }
  }
  const dome = mesh(ship, new T.SphereGeometry(1, 16, 7, 0, Math.PI * 2, 0, Math.PI / 2),
    glass, 0, 1.49, 0, { material: { transparent: true, opacity: .29, depthWrite: false } });
  dome.scale.set(4.36, 2.42, 2.13);
  for (const x of [-3.2, -1.65, 0, 1.65, 3.2]) {
    const span = Math.sqrt(1 - (x / 4.36) ** 2);
    const arch = new T.TorusGeometry(1, .026, 5, 12, Math.PI);
    const rib = mesh(ship, arch, ribs, x, 1.49, 0);
    rib.rotation.y = Math.PI / 2;
    rib.scale.set(2.13 * span, 2.42 * span, 1);
  }
  for (const z of [-1.05, 0, 1.05]) {
    box(ship, 6.7, .11, .74, 0x564735, 0, 1.55, z);
    for (let i = -6; i <= 6; i++) {
      const height = ending === 'replant' ? .28 + (i + 6) % 3 * .085 : .23;
      const sprout = mesh(ship, new T.IcosahedronGeometry(.15), ending === 'replant' ? light : 0x58976b,
        i * .49, 1.61 + height * .37, z, { glow: ending === 'replant' });
      sprout.scale.set(1, height * 3, .75);
    }
  }

  const bayOpen = ending === 'release';
  const seal = tube(ship, .62, .62, .12, bayOpen ? 0x13252e : ending === 'vault' ? seed : ribs, 5.7, 1.53, 2.08, 10);
  seal.rotation.x = Math.PI / 2;
  mesh(ship, new T.TorusGeometry(.64, .071, 5, 14), bayOpen ? light : hull, 5.7, 1.53, 2.15, { glow: bayOpen });
  if (bayOpen) for (let i = 0; i < 21; i++) {
    const x = 5.52 + (i % 7) * .37;
    const y = 1.46 + Math.sin(i * 2.2) * (.22 + i * .025);
    const z = 2.25 + i * .119;
    const grain = mesh(ship, new T.OctahedronGeometry(.05 + i % 4 * .012), seed, x, y, z, { glow: true });
    grain.scale.y = 1.75;
  }

  mesh(group, new T.IcosahedronGeometry(3.8, 2), 0x304258, -8.5, 1.3, -14);
}
