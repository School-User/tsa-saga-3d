import * as T from '../../lib/three.module.js';

export { T };
export const palette = [
  { accent: 0x69c7fb, hull: 0x304a60, deck: 0x24384a, dark: 0x0b1926, bright: 0xb3e7ff },
  { accent: 0xffbf72, hull: 0x60524c, deck: 0x433a37, dark: 0x211823, bright: 0xffdb9d },
  { accent: 0x8fe6a2, hull: 0x365c50, deck: 0x273e3b, dark: 0x0b241f, bright: 0xc3ffd0 }
];

export function mesh(parent, geometry, color, x, y, z, options = {}) {
  const material = options.glow
    ? new T.MeshBasicMaterial({ color, ...options.material })
    : new T.MeshStandardMaterial({ color, roughness: .82, flatShading: true, ...options.material });
  const object = new T.Mesh(geometry, material);
  object.position.set(x, y, z);
  parent.add(object);
  return object;
}

export function box(group, w, h, d, color, x = 0, y = 0, z = 0, glow = false) {
  return mesh(group, new T.BoxGeometry(w, h, d), color, x, y, z, { glow });
}

export function tube(group, top, base, height, color, x, y, z, sides = 8, glow = false) {
  return mesh(group, new T.CylinderGeometry(top, base, height, sides), color, x, y, z, { glow });
}

export function beam(group, from, to, width, color, glow = false) {
  const start = new T.Vector3(...from);
  const vector = new T.Vector3(...to).sub(start);
  const middle = start.addScaledVector(vector, .5);
  const part = box(group, width, vector.length(), width, color, ...middle, glow);
  part.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), vector.normalize());
  return part;
}

export function lettering(group, text, y, z, { badge = false, x = 0, scale = 1 } = {}) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const font = 'bold 26px monospace';
  ctx.font = font;
  const width = Math.min(256, Math.ceil(ctx.measureText(text).width) + 24);
  canvas.width = width;
  canvas.height = 52;
  ctx.font = font;
  if (badge) {
    ctx.fillStyle = '#091722';
    ctx.fillRect(0, 2, width, 46);
    ctx.fillStyle = '#7895a8';
    ctx.fillRect(0, 46, width, 2);
  }
  ctx.fillStyle = '#f3f9fc';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, 26, width - 18);
  const map = new T.CanvasTexture(canvas);
  map.colorSpace = T.SRGBColorSpace;
  const label = new T.Sprite(new T.SpriteMaterial({ map, depthWrite: false, transparent: true }));
  label.position.set(x, y, z);
  label.scale.set(width * .011 * scale, .572 * scale, 1);
  group.add(label);
  return label;
}

export function shadow(group, width, depth) {
  const object = mesh(group, new T.CircleGeometry(1, 16), 0x020711, 0, .025, 0,
    { glow: true, material: { transparent: true, opacity: .34, depthWrite: false } });
  object.rotation.x = -Math.PI / 2;
  object.scale.set(width * .66, depth * .69, 1);
}

export function miniatureBase(group, color = 0xa47a51) {
  tube(group, .47, .55, .10, 0x27232a, 0, .055, 0, 16);
  tube(group, .455, .48, .025, color, 0, .109, 0, 16);
}

export function person(group, coat, visor = true) {
  tube(group, .26, .32, .53, coat, 0, .79, 0, 6);
  for (const x of [-.15, .15]) {
    box(group, .18, .44, .21, 0x283746, x, .33, 0);
    box(group, .2, .16, .33, 0x131f2d, x, .11, .035);
  }
  for (const x of [-.32, .32]) tube(group, .08, .094, .39, coat, x, .78, 0, 5);
  mesh(group, new T.IcosahedronGeometry(.27, 1), visor ? 0xffdfb4 : 0xd9ab8f, 0, 1.24, 0);
  if (visor) {
    box(group, .36, .145, .11, 0x527f8c, 0, 1.24, .209);
    box(group, .38, .39, .19, 0xd09354, 0, .82, -.23);
    box(group, .26, .06, .02, 0xffd692, 0, .88, -.335, true);
  }
}
