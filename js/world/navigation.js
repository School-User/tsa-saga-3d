import { sizes } from './layouts.js';

const radius = .28;
export const reach = 1.5;

export function distanceTo(prop, x, z) {
  const [width, depth] = sizes[prop.type];
  return Math.hypot(Math.max(0, Math.abs(x - prop.x) - width / 2),
    Math.max(0, Math.abs(z - prop.z) - depth / 2));
}

export function walkable(layout, x, z) {
  return Math.abs(x) <= layout.x - radius && Math.abs(z) <= layout.z - radius
    && layout.props.every(prop => distanceTo(prop, x, z) >= radius);
}

export function direction(x, z) {
  if (Math.hypot(x, z) < .4) return 'nearby';
  const names = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
  return names[(Math.round(Math.atan2(x, -z) * 4 / Math.PI) + 8) % 8];
}

// Search a small floor grid in breadth-first order, so guidance takes a short safe route.
export function routeTo(layout, x, z, prop) {
  const step = .25;
  const queue = [{ x, z, from: null }];
  const visited = new Set(['0,0']);
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const point = queue[cursor];
    if (distanceTo(prop, point.x, point.z) <= 1.2) {
      const path = [];
      for (let end = point; end.from; end = end.from) path.push(end);
      return path.reverse();
    }
    for (const [dx, dz] of [[0, -step], [-step, 0], [step, 0], [0, step]]) {
      const next = { x: point.x + dx, z: point.z + dz, from: point };
      const key = `${Math.round((next.x - x) / step)},${Math.round((next.z - z) / step)}`;
      if (visited.has(key) || !walkable(layout, next.x, next.z)) continue;
      if (!walkable(layout, point.x + dx / 2, point.z + dz / 2)) continue;
      visited.add(key);
      queue.push(next);
    }
  }
  return null;
}
