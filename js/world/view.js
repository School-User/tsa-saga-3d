import { T, palette, person, shadow } from './geometry.js';
import { layouts } from './layouts.js';
import { distanceTo, reach, routeTo, walkable } from './navigation.js';
import { buildProp, updateProp } from './props.js';
import { buildShell, exterior, starfield } from './shell.js';
import { hotspotStatus } from '../state.js';

const movementKeys = new Set(['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright']);

export function createWorld(canvas, handlers) {
  const context = canvas.getContext('webgl2', {
    antialias: true, alpha: true, preserveDrawingBuffer: handlers.test
  });
  if (!context) throw new Error('WebGL 2 unavailable');
  const renderer = new T.WebGLRenderer({ canvas, context });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
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
  let group, avatar, layout, room, colors, visuals, exteriorDetails;
  let last = performance.now(), width = 0, height = 0;
  let route = null, target = null, lastNear;

  function setRoom(next) {
    room = next;
    layout = layouts[room.id];
    colors = palette[room.chapter - 1];
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
    buildShell(group, layout, room.id, colors);
    exteriorDetails = exterior(group, layout, room.id, colors);
    visuals = layout.props.map(prop => buildProp(group, prop, colors));
    avatar = new T.Group();
    group.add(avatar);
    avatar.position.set(0, 0, layout.spawn);
    avatar.rotation.y = Math.PI;
    shadow(avatar, .89, .8);
    person(avatar, 0xf3ce9e);
    cancel();
    canvas.style.cursor = '';
    width = 0;
  }

  function update(run) {
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
    route = routeTo(layout, avatar.position.x, avatar.position.z, prop);
    target = route ? prop : null;
    return !!route;
  }

  function cancel() {
    keys.clear();
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
    if (!canvas.clientWidth || !canvas.clientHeight || !layout) return;
    if (handlers.active()) {
      move(dt);
      if (!target && handlers.active()) {
        const near = nearest();
        if (lastNear !== near) {
          lastNear = near;
          handlers.near(near);
        }
      }
    }
    if (width !== canvas.clientWidth || height !== canvas.clientHeight) {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      renderer.setSize(width, height, false);
      const ratio = width / height;
      const half = Math.max(layout.z * .91 + 2.7, (layout.x + 1.45) / ratio);
      camera.left = -half * ratio;
      camera.right = half * ratio;
      camera.top = half;
      camera.bottom = -half;
      camera.updateProjectionMatrix();
    }
    const x = avatar.position.x * .12;
    const z = avatar.position.z * .1;
    camera.position.set(x, 15.9, 14.6 + z);
    camera.lookAt(x, 0, z - .45);
    renderer.render(scene, camera);
  }

  function objectAt(event) {
    if (!width || !height) return null;
    const bounds = canvas.getBoundingClientRect();
    pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1,
      1 - (event.clientY - bounds.top) / bounds.height * 2);
    ray.setFromCamera(pointer, camera);
    const hit = ray.intersectObjects(visuals.map(visual => visual.group), true)
      .find(entry => entry.object.visible);
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
      if (target) lastNear = undefined;
      route = null;
      target = null;
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
  return { setRoom, update, guide, cancel, stop: () => renderer.setAnimationLoop(null),
    get position() { return avatar?.position; } };
}
