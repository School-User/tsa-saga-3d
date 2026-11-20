import assert from 'node:assert/strict';
import { characters, characterId } from '../js/story/characters.js';
import { T, palette } from '../js/world/geometry.js';
import { roomFrame } from '../js/world/view.js';
import { layouts } from '../js/world/layouts.js';
import { buildCharacter, bobOffset } from '../js/world/characters.js';
import { buildFinale, finaleCaption, finaleEnding } from '../js/world/finale.js';
import { buildSetpiece, animateSetpiece, updateSetpiece } from '../js/world/setpieces.js';

const silhouettes = new Set();
for (const [id, colors] of Object.entries(characters)) {
  assert.equal(characterId(colors.name), id);
  const figure = buildCharacter(new T.Group(), id);
  const bounds = new T.Box3().setFromObject(figure).getSize(new T.Vector3());
  assert.ok(bounds.y > 1, id);
  assert.ok(figure.children.some(part => part.material.color.getHex() === colors.light), id);
  silhouettes.add(bounds.toArray().map(n => n.toFixed(2)).join());
}
assert.equal(silhouettes.size, 5);
for (const phase of [0, 1, 2]) {
  assert.equal(bobOffset(550, phase, true), 0);
  assert.notEqual(bobOffset(550, phase, false), bobOffset(1100, phase, false));
}
for (const layout of Object.values(layouts)) {
  assert.ok(layout.props.every(prop => !prop.character || characters[prop.character]));
}

for (let id = 1; id <= 9; id++) {
  const group = new T.Group();
  const colors = palette[Math.ceil(id / 3) - 1];
  const piece = buildSetpiece(group, id, colors);
  assert.ok(group.children.length > 0, `Room ${id}`);
  updateSetpiece(piece, {}, colors);
  const lights = piece.statusLights ?? [];
  assert.ok(lights.every(light => light.material.color.getHex() === colors.hull));
  if (piece.stream) assert.equal(piece.stream.visible, false);
  updateSetpiece(piece, { [piece.flag]: true }, colors);
  assert.ok(lights.every(light => light.material.color.getHex() === colors.bright));
  if (piece.cadence) {
    animateSetpiece(piece, 170, false);
    const animated = lights.map(light => light.material.color.getHex());
    assert.ok(animated.some(color => color !== colors.bright));
    animateSetpiece(piece, 550, false);
    assert.notDeepEqual(lights.map(light => light.material.color.getHex()), animated);
    animateSetpiece(piece, 550, true);
    assert.ok(lights.every(light => light.material.color.getHex() === colors.bright));
  }
  if (piece.stream) {
    assert.equal(piece.stream.visible, true);
    assert.ok(piece.ripples.every(ripple => ripple.visible));
    const first = piece.ripples[0];
    animateSetpiece(piece, 100, true);
    const still = first.position.z;
    animateSetpiece(piece, 1300, true);
    assert.equal(first.position.z, still);
    animateSetpiece(piece, 1300, false);
    assert.notEqual(first.position.z, still);
  }
}

const finale = {};
for (const [id, line] of [['release', /open bay/], ['replant', /lit for planting/], ['vault', /sealed/]]) {
  const flags = { [`c3_ending_${id}`]: true };
  const group = new T.Group();
  assert.equal(finaleEnding(flags), id);
  assert.match(finaleCaption(flags), line);
  buildFinale(group, flags);
  finale[id] = group.children[0].children.length;
}
assert.ok(finale.release > finale.vault, 'The release ending shows a seed trail');

const { buildProp, updateProp } = await import('../js/world/props.js');
const previousDocument = globalThis.document;
// The meshes only need a small 2D canvas API for their printed labels.
globalThis.document = {
  createElement: () => ({
    getContext: () => ({ measureText: text => ({ width: text.length * 14 }), fillRect() {}, fillText() {} })
  })
};
try {
  for (const [id, layout] of Object.entries(layouts)) {
    const colors = palette[Math.ceil(id / 3) - 1];
    const group = new T.Group();
    for (const ratio of [.8, 1.8]) {
      const { half, center } = roomFrame(layout, Number(id), ratio);
      assert.ok(half * ratio > layout.x);
      assert.ok(half - Math.abs(center) > layout.z * .72);
    }
    for (const prop of layout.props) {
      const visual = buildProp(group, prop, colors);
      updateProp(prop, visual, { flags: {} }, 'Locked', colors);
      if (visual.figure) assert.equal(visual.figure.visible, false);
      if (visual.aid) assert.equal(visual.aid.visible, false);
      if (visual.panels) assert.equal(visual.inset.visible, true);

      updateProp(prop, visual, { flags: { [prop.flag]: true, [visual.aidFlag]: true } }, 'Open', colors);
      if (visual.figure) assert.equal(visual.figure.visible, true);
      if (visual.aid) assert.equal(visual.aid.visible, true);
      if (visual.panels) {
        assert.equal(visual.inset.visible, false);
        assert.ok(visual.panels.every(panel => Math.abs(panel.position.x) > .9));
      }
      if (prop.type === 'locks') assert.ok(visual.lights.every(light => !light.visible));
    }
  }
} finally {
  if (previousDocument) globalThis.document = previousDocument;
  else delete globalThis.document;
}
