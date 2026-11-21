import { T, palette, shadow, mesh } from './geometry.js';
import { buildCharacter, bobOffset } from './characters.js';
import { buildSetpiece, updateSetpiece, animateSetpiece } from './setpieces.js';
import { buildFinale } from './finale.js';
import { layouts } from './layouts.js';
import { distanceTo, reach, routeTo, walkable } from './navigation.js';
import { buildProp, updateProp } from './props.js';
import { buildShell, exterior, starfield } from './shell.js';
import { hotspotStatus } from '../state.js';

const movementKeys = new Set(['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright']);

const cameraRise = 15.9;
const cameraRun = 14.6;
const cameraLength = Math.hypot(cameraRise, cameraRun);
const northSlope = cameraRise / cameraLength;
const heightSlope = cameraRun / cameraLength;
const backdrop = { 3: [12, 3.7], 4: [9, 3.8], 6: [7.9, 5.15], 8: [8, 3.8] };

export function roomFrame(layout, id, ratio) {
  const [north, height] = backdrop[id] ?? [layout.z + .2, 2.7];
  const top = north * northSlope + height * heightSlope + .48;
  const bottom = -(layout.z + .75) * northSlope - .82 * heightSlope - .2;
  const half = Math.max((top - bottom) / 2, (layout.x + .86) / ratio);
  return { half, center: (top + bottom) / 2 };
}

export function createWorld(canvas, handlers) {
  const context = canvas.getContext('webgl2', {
    antialias: true, alpha: true, preserveDrawingBuffer: handlers.test
  });
  if (!context) throw new Error('WebGL 2 unavailable');
  const renderer = new T.WebGLRenderer({ canvas, context });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0x070e18, 0);
  const scene = new T.Scene();
  const camera = new T.OrthographicCamera(-9, 9, 7, -7, .1, 170);
  const keyLight = new T.DirectionalLight(0xffe8ce, 2.35);
  keyLight.position.set(-6, 11, 7);
  const rimLight = new T.DirectionalLight(0x83c5ff, 1.25);
  rimLight.position.set(6, 6, -7);
  scene.add(new T.HemisphereLight(0xc7e4fa, 0x586984, 1.75), keyLight, rimLight);
  starfield(scene);
  const ray = new T.Raycaster();
  const pointer = new T.Vector2();
  const keys = new Set();
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let group, avatar, navigator, layout, room, colors, visuals, exteriorDetails, setpiece, destination;
  let finale = false, dirty = true, lastReduced;
  let last = performance.now(), width = 0, height = 0;
  let route = null, target = null, lastNear;

  function replaceScene() {
    if (group) {
      group.traverse(object => {
        object.geometry?.dispose();
        object.material?.map?.dispose();
        object.material?.dispose();
      });
      scene.remove(group);
    }
    group = new T.Group();
    scene.add(group);
    cancel();
    canvas.style.cursor = '';
    width = 0;
  }

  function setRoom(next) {
    finale = false;
    room = next;
    layout = layouts[room.id];
    colors = palette[room.chapter - 1];
    rimLight.color.set([0x8bc9ff, 0xb9cafa, 0x9ce1d8][room.chapter - 1]);
    replaceScene();
    buildShell(group, layout, room.id, colors);
    destination = mesh(group, new T.RingGeometry(.32, .49, 24), colors.bright, 0, .038, 0,
      { glow: true, material: { depthWrite: false } });
    destination.rotation.x = -Math.PI / 2;
    destination.visible = false;
    exteriorDetails = exterior(group, layout, room.id, colors);
    setpiece = buildSetpiece(group, room.id, colors);
    visuals = layout.props.map(prop => buildProp(group, prop, colors));
    avatar = new T.Group();
    group.add(avatar);
    avatar.position.set(0, 0, layout.spawn);
    avatar.rotation.y = Math.PI;
    shadow(avatar, 1.1, .92);
    navigator = buildCharacter(avatar, 'navigator');
    navigator.scale.setScalar(1.17);
  }

  function setFinale(flags) {
    finale = true;
    rimLight.color.set(0x9ce1d8);
    replaceScene();
    buildFinale(group, flags);
  }

  function update(run) {
    dirty = true;
    updateSetpiece(setpiece, run.flags, colors);
    layout.props.forEach((prop, index) => {
      const hotspot = room.hotspots.find(entry => entry.id === prop.hotspot);
      updateProp(prop, visuals[index], run, hotspot && hotspotStatus(run, hotspot), colors);
    });
    const bayOrder = run.flags.c2_ending_all ? ['1', '1', '1']
      : run.flags.c2_ending_medic ? ['2', '1', '3'] : ['1', '2', '3'];
    exteriorDetails.ships.forEach((ship, i) => {
      ship.material.color.set(room.id === 6 && run.flags.c2_contacted
        ? [0x000000, 0xa4ffba, 0xffcd8c, 0x8dcaff][Number(bayOrder[i])]
        : room.id === 4 && run.flags.c2_ring_lit ? 0xa4ffba : colors.accent);
    });
    const flowing = room.id === 2 ? run.flags.c1_air_ok : run.flags.c3_water_flows;
    exteriorDetails.pipes.forEach(pipe => pipe.material.color.set(flowing ? colors.accent : colors.hull));
  }

  function guide(id) {
    const prop = layout.props.find(entry => entry.hotspot === id);
    if (!prop) return false;
    cancel();
    route = routeTo(layout, avatar.position.x, avatar.position.z, prop);
    target = route ? prop : null;
    const end = route?.at(-1);
    if (end) {
      destination.position.set(end.x, .038, end.z);
      destination.visible = true;
    }
    return !!route;
  }

  function cancel() {
    dirty = true;
    keys.clear();
    if (destination) destination.visible = false;
    route = null;
    target = null;
    lastNear = undefined;
  }

  function nearest() {
    let best = reach;
    let nearestId = null;
    for (const prop of layout.props) {
      if (!prop.hotspot || !handlers.eligible(prop.hotspot)) continue;
      const distance = distanceTo(prop, avatar.position.x, avatar.position.z);
      if (distance < best) {
        best = distance;
        nearestId = prop.hotspot;
      }
    }
    return nearestId;
  }

  function move(dt) {
    const point = avatar.position;
    if (target && !route.length) {
      const id = target.hotspot;
      cancel();
      handlers.interact(id);
      return;
    }
    const dx = Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft'));
    const dz = Number(keys.has('s') || keys.has('arrowdown')) - Number(keys.has('w') || keys.has('arrowup'));
    let x = route ? route[0].x - point.x : dx;
    let z = route ? route[0].z - point.z : dz;
    const length = Math.hypot(x, z);
    if (length === 0) return;
    const step = route ? Math.min(dt * 7, length) : dt * 4.2;
    avatar.rotation.y = Math.atan2(x, z);
    x *= step / length;
    z *= step / length;
    if (walkable(layout, point.x + x, point.z)) point.x += x;
    if (walkable(layout, point.x, point.z + z)) point.z += z;
    if (route && step >= length) route.shift();
  }

  function draw(now) {
    const dt = Math.min((now - last) / 1000, .04);
    last = now;
    if (!canvas.clientWidth || !canvas.clientHeight || (!layout && !finale)) return;
    const active = handlers.active();
    const moving = active && (keys.size || target);
    if (active) {
      move(dt);
      if (!target && handlers.active()) {
        const near = nearest();
        if (lastNear !== near) {
          lastNear = near;
          handlers.near(near);
        }
      }
    }
    const resized = width !== canvas.clientWidth || height !== canvas.clientHeight;
    if (resized) {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      renderer.setSize(width, height, false);
      const ratio = width / height;
      const { half, center } = finale ? { half: Math.max(5.85, 8.75 / ratio), center: 0 }
        : roomFrame(layout, room.id, ratio);
      camera.left = -half * ratio;
      camera.right = half * ratio;
      camera.top = center + half;
      camera.bottom = center - half;
      camera.updateProjectionMatrix();
    }
    const reduced = motion.matches;
    const ambient = active && !reduced;
    if (!resized && !dirty && !moving && (!ambient || finale) && reduced === lastReduced) return;
    dirty = false;
    lastReduced = reduced;
    if (finale) {
      camera.position.set(3, 9.5, 17);
      camera.lookAt(.5, 1.3, 0);
      renderer.render(scene, camera);
      return;
    }
    navigator.rotation.z = bobOffset(now, 0, reduced) * (keys.size || route?.length ? .8 : .2);
    visuals.forEach(({ figure }, i) => {
      if (figure) figure.rotation.z = bobOffset(now, i, reduced) * .3;
    });
    animateSetpiece(setpiece, now, reduced);
    camera.position.set(0, cameraRise, cameraRun);
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }

  function objectAt(event) {
    if (!width || !height || finale) return null;
    const bounds = canvas.getBoundingClientRect();
    pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1,
      1 - (event.clientY - bounds.top) / bounds.height * 2);
    ray.setFromCamera(pointer, camera);
    const hit = ray.intersectObjects(visuals.map(visual => visual.group), true)
      .find(({ object }) => {
        for (let part = object; part; part = part.parent) {
          if (!part.visible) return false;
        }
        return true;
      });
    let object = hit?.object;
    while (object && !object.userData.hotspot) object = object.parent;
    return object?.userData.hotspot;
  }

  canvas.addEventListener('pointermove', event => {
    if (event.pointerType !== 'touch' && handlers.active()) {
      canvas.style.cursor = objectAt(event) ? 'pointer' : '';
    }
  });
  canvas.addEventListener('pointerleave', () => { canvas.style.cursor = ''; });
  canvas.addEventListener('click', event => {
    if (!handlers.active()) return;
    const id = objectAt(event);
    if (!id || !handlers.eligible(id)) return;
    const prop = layout.props.find(entry => entry.hotspot === id);
    if (distanceTo(prop, avatar.position.x, avatar.position.z) <= reach) handlers.interact(id);
    else handlers.guide(id);
  });

  window.addEventListener('keydown', event => {
    if (!handlers.active() || event.altKey || event.ctrlKey || event.metaKey) return;
    const key = event.key.toLowerCase();
    if (movementKeys.has(key)) {
      event.preventDefault();
      if (target) cancel();
      keys.add(key);
    }
    if (key === 'e' && !event.repeat) {
      const id = nearest();
      if (id) handlers.interact(id);
    }
  });
  window.addEventListener('keyup', event => keys.delete(event.key.toLowerCase()));
  window.addEventListener('blur', cancel);
  renderer.setAnimationLoop(draw);
  return { setRoom, setFinale, update, guide, cancel, stop: () => renderer.setAnimationLoop(null),
    get position() { return avatar?.position; } };
}
