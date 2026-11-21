import { T } from '../world/geometry.js';
import { el } from './dom.js';

let graphics;

export function createDiceTray(result, animate) {
  const tray = el('div', 'dice');
  tray.dataset.dice = result.dice.length;
  tray.setAttribute('aria-hidden', 'true');
  const picture = el('canvas');
  const ratio = Math.min(window.devicePixelRatio, 1.5);
  picture.width = Math.round(320 * ratio);
  picture.height = Math.round(132 * ratio);
  const keptIndex = result.dice.indexOf(result.kept);
  try {
    graphics ??= createGraphics();
    const output = picture.getContext('2d');
    if (!output || graphics.renderer.getContext().isContextLost()) throw new Error('Dice graphics unavailable');
    tray.append(picture);
    if (animate) tray.dataset.rolling = '';
    const start = performance.now();
    function draw(now) {
      if (!tray.isConnected && now !== start) return;
      const progress = animate ? Math.min((now - start) / 680, 1) : 1;
      graphics.render(picture, output, result.dice, keptIndex, progress);
      if (progress < 1) requestAnimationFrame(draw);
      else delete tray.dataset.rolling;
    }
    draw(start);
  } catch {
    tray.replaceChildren(...result.dice.map((face, index) =>
      el('span', index === keptIndex ? 'die kept' : 'die', face)));
  }
  return tray;
}

function createGraphics() {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('webgl2', { alpha: true, antialias: true });
  if (!context) throw new Error('WebGL 2 unavailable');
  const renderer = new T.WebGLRenderer({ canvas, context });
  renderer.setClearColor(0x000000, 0);
  const scene = new T.Scene();
  const camera = new T.OrthographicCamera(-3, 3, 1.2375, -1.2375, .1, 30);
  camera.position.set(0, 8, 4);
  camera.lookAt(0, .66, 0);
  const lamp = new T.DirectionalLight(0xffebd2, 2.3);
  lamp.position.set(-3, 6, 2);
  scene.add(lamp, new T.HemisphereLight(0xc5e1ff, 0x526174, 1.8));

  const geometry = new T.IcosahedronGeometry(.71, 0);
  const faces = numberFaces(geometry);
  const vertices = geometry.getAttribute('position');
  const unique = [];
  for (let index = 0; index < vertices.count; index++) {
    const vertex = new T.Vector3().fromBufferAttribute(vertices, index);
    if (!unique.some(point => point.equals(vertex))) unique.push(vertex);
  }
  const numbers = numberTexture();
  const dice = [0, 1].map(() => {
    const die = new T.Mesh(geometry, new T.MeshStandardMaterial({
      map: numbers, roughness: .67, flatShading: true
    }));
    scene.add(die);
    return die;
  });
  const shadowGeometry = new T.CircleGeometry(.59, 20);
  const shadows = dice.map(() => {
    const shadow = new T.Mesh(shadowGeometry, new T.MeshBasicMaterial({
      color: 0x030b0d, transparent: true, opacity: .5, depthWrite: false
    }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.scale.y = .83;
    scene.add(shadow);
    return shadow;
  });
  const tilted = new T.Quaternion();
  const turn = new T.Euler();
  const point = new T.Vector3();

  return {
    renderer,
    render(picture, output, values, kept, progress) {
      if (canvas.width !== picture.width || canvas.height !== picture.height) {
        renderer.setSize(picture.width, picture.height, false);
      }
      dice.forEach((die, index) => {
        const face = values[index];
        const shadow = shadows[index];
        shadow.visible = die.visible = face !== undefined;
        if (!die.visible) return;
        die.material.color.set(index === kept ? 0xffcc7e : 0xaccce0);
        const travel = 1 - progress;
        const x = values.length === 1 ? 0 : (index ? 1 : -1) * .85;
        turn.set(travel * 7.6, travel * (index ? 8 : -9), travel * 3);
        tilted.setFromEuler(turn);
        die.quaternion.copy(faces[face - 1]).premultiply(tilted);
        const bottom = Math.min(...unique.map(vertex => point.copy(vertex).applyQuaternion(die.quaternion).y));
        const bounce = Math.abs(Math.sin(progress * Math.PI * 3)) * travel * .62;
        die.position.set(x - travel * .85, -bottom + bounce, 0);
        shadow.position.x = die.position.x;
        shadow.material.opacity = .5 - bounce * .6;
      });
      renderer.render(scene, camera);
      output.clearRect(0, 0, picture.width, picture.height);
      output.drawImage(canvas, 0, 0);
    }
  };
}

export function numberFaces(geometry) {
  const positions = geometry.getAttribute('position');
  const uv = geometry.getAttribute('uv');
  const rotations = [];
  const up = new T.Vector3(0, 1, 0);
  for (let face = 0; face < 20; face++) {
    const start = face * 3;
    const left = new T.Vector3().fromBufferAttribute(positions, start);
    const right = new T.Vector3().fromBufferAttribute(positions, start + 1);
    const top = new T.Vector3().fromBufferAttribute(positions, start + 2);
    const base = left.clone().add(right).multiplyScalar(.5);
    const normal = right.clone().sub(left).cross(top.clone().sub(left)).normalize();
    const rotation = new T.Quaternion().setFromUnitVectors(normal, up);
    const north = top.sub(base).applyQuaternion(rotation);
    const yaw = new T.Quaternion().setFromAxisAngle(up, Math.atan2(north.x, -north.z));
    rotations.push(rotation.premultiply(yaw));
    const col = face % 5;
    const row = Math.floor(face / 5);
    uv.setXY(start, (col + .035) / 5, 1 - (row + .91) / 4);
    uv.setXY(start + 1, (col + .965) / 5, 1 - (row + .91) / 4);
    uv.setXY(start + 2, (col + .5) / 5, 1 - (row + .08) / 4);
  }
  return rotations;
}

function numberTexture() {
  const canvas = document.createElement('canvas');
  const tile = 96;
  canvas.width = tile * 5;
  canvas.height = tile * 4;
  const context = canvas.getContext('2d');
  context.fillStyle = '#ece5d6';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.font = 'bold 31px Georgia, serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  for (let face = 0; face < 20; face++) {
    const x = (face % 5) * tile;
    const y = Math.floor(face / 5) * tile;
    context.fillStyle = face % 2 ? '#ded6c8' : '#f8f1e1';
    context.fillRect(x, y, tile, tile);
    context.strokeStyle = '#8a7965';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(x + 48, y + 12);
    context.lineTo(x + 88, y + 84);
    context.lineTo(x + 8, y + 84);
    context.closePath();
    context.stroke();
    context.fillStyle = '#17202b';
    const label = face === 5 || face === 8 ? `${face + 1}.` : String(face + 1);
    context.fillText(label, x + 48, y + 60);
  }
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  return texture;
}
