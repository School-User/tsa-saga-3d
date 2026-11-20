import { characters } from '../story/characters.js';

const marks = {
  navigator: [
    ['shell', 'M7 15 19 5 35 5 45 16 42 33 34 43 17 43 8 33Z'],
    ['face', 'M11 18 40 18 39 30 32 36 15 33Z'],
    ['light', 'M15 22 36 22 36 25 15 25Z']
  ],
  ori: [
    ['shell', 'M32 15 38 3 42 4 39 15 45 15 45 36 35 42 12 42 6 34 6 15Z'],
    ['face', 'M10 19 41 19 41 34 34 38 12 37 10 32Z'],
    ['light', 'M16 23H21V31H16Z M30 23H35V31H30Z']
  ],
  tamsin: [
    ['shell', 'M7 17 16 6 32 4 43 12 46 29 40 31 35 42 17 43 8 34Z'],
    ['face', 'M13 18 37 15 40 31 31 40 20 39 13 31Z'],
    ['light', 'M10 20 40 18 39 25 13 27Z M42 27 45 29 36 37 28 37 28 34 35 34Z']
  ],
  fern: [
    ['light', 'M24 15Q9 19 10 5 23 5 24 15 M26 16Q25 4 40 4 40 15 26 16'],
    ['shell', 'M7 24 16 14 34 14 44 24 39 38 26 45 12 38Z'],
    ['face', 'M16 23H21V29H16Z M30 23H35V29H30Z M21 33H30V35H21Z']
  ],
  veil: [
    ['shell', 'M4 13 15 19 19 40 8 34Z M46 13 35 19 31 40 42 34Z'],
    ['face', 'M25 3 37 24 25 46 13 24Z'],
    ['light', 'M25 14 34 23 25 32 16 23Z M25 40 28 44 25 48 22 44Z']
  ]
};

export function portrait(id) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 50 50');
  svg.setAttribute('class', 'portrait');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  for (const [color, points] of marks[id]) {
    const path = document.createElementNS(svg.namespaceURI, 'path');
    path.setAttribute('d', points);
    path.setAttribute('fill', '#' + characters[id][color].toString(16).padStart(6, '0'));
    svg.append(path);
  }
  return svg;
}
