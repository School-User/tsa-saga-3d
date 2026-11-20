import { characters } from '../story/characters.js';
import { T, box, tube, mesh, beam } from './geometry.js';

function facet(group, radius, color, x, y, z, scale, glow = false) {
  const part = mesh(group, new T.IcosahedronGeometry(radius), color, x, y, z, { glow });
  part.scale.set(...scale);
  return part;
}

function suit(group, { shell, face, light }, pilot) {
  tube(group, .29, .23, .52, shell, 0, .72, 0, 6);
  for (const x of [-.15, .15]) {
    box(group, .18, .44, .22, face, x, .33, 0);
    box(group, .21, .15, .31, face, x, .11, .035);
  }
  for (const x of [-.36, .36]) {
    tube(group, .095, .075, .37, shell, x, .73, 0, 5);
    box(group, .16, .12, .23, light, x, .88, .02);
  }
  if (pilot) {
    facet(group, .33, 0x473239, 0, 1.14, -.05, [1, 1.04, .87]);
    facet(group, .25, face, 0, 1.13, .13, [1, 1.08, .66]);
    box(group, .36, .09, .06, light, 0, 1.18, .275, true);
    box(group, .11, .22, .19, shell, .265, 1.13, .08);
    beam(group, [.29, 1.06, .17], [.13, 1.01, .31], .033, light);
  } else {
    facet(group, .34, shell, 0, 1.2, 0, [1, .94, 1]);
    box(group, .43, .16, .12, face, 0, 1.22, .24);
    box(group, .33, .041, .018, light, 0, 1.25, .307, true);
    box(group, .39, .45, .21, face, 0, .75, -.24);
    box(group, .29, .09, .02, light, 0, .8, -.35, true);
  }
}

function ori(group, { shell, face, light }) {
  tube(group, .23, .39, .38, face, 0, .49, 0, 6);
  box(group, .64, .42, .35, shell, 0, .94);
  box(group, .49, .28, .09, face, 0, .94, .18);
  for (const x of [-.13, .13]) box(group, .073, .12, .025, light, x, .97, .238, true);
  beam(group, [.18, 1.12, 0], [.28, 1.41, 0], .044, shell);
  facet(group, .065, light, .28, 1.41, 0, [1, 1, 1], true);
}

function fern(group, { shell, face, light }) {
  tube(group, .39, .21, .62, face, 0, .65, 0, 7);
  facet(group, .32, shell, 0, 1.12, 0, [1.06, .88, .88]);
  for (const x of [-.11, .11]) box(group, .074, .08, .06, face, x, 1.15, .23);
  box(group, .13, .029, .033, face, 0, 1.04, .24);
  for (const x of [-.23, .23]) {
    const leaf = facet(group, .26, light, x, 1.43, -.07, [.66, 1, .25]);
    leaf.rotation.z = -x * 3.4;
  }
  facet(group, .13, light, 0, .64, .29, [.66, 1, .45], true);
}

function veil(group, { shell, face, light }) {
  facet(group, .45, face, 0, .96, 0, [.8, 1.37, .67]);
  for (const side of [-1, 1]) {
    const wing = facet(group, .36, shell, side * .36, .98, -.01, [.45, 1.36, .49]);
    wing.rotation.z = side * -.29;
  }
  const eye = box(group, .18, .18, .045, light, 0, 1.05, .28, true);
  eye.rotation.z = Math.PI / 4;
  facet(group, .085, light, 0, .32, .03, [.68, 1, .68], true);
}

export function buildCharacter(parent, id) {
  const group = new T.Group();
  const colors = characters[id];
  parent.add(group);
  if (id === 'ori') ori(group, colors);
  else if (id === 'fern') fern(group, colors);
  else if (id === 'veil') veil(group, colors);
  else suit(group, colors, id === 'tamsin');
  return group;
}

export function bobOffset(now, phase, reduced) {
  return reduced ? 0 : Math.sin(now / 460 + phase) * .042;
}
