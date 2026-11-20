// Each prop entry gives its primitive type, center, printed name and optional hotspot.
const prop = (type, x, z, name, hotspot, flag, character) => ({ type, x, z, name, hotspot, flag, character });
const room = (x, z, spawn, props) => ({ x, z, spawn, props });

const crates = [4, 2, 0].flatMap((z, row) => [-7, -5, -3].map((x, column) =>
  prop('crate', x, z, String(row * 3 + column + 1), x === -3 && z === 4 ? 'c2_look2' : null)));

export const layouts = {
  1: room(6, 6, 4, [
    prop('openPod', -2, 4, 'BADGE', 'c1_badge'),
    ...[2, 0, -2].flatMap(z => [-4, 4].map(x =>
      prop('pod', x, z, '', x === -4 && z === 2 ? 'c1_look' : null))),
    prop('talk', 3, 4, 'ORI', 'c1_ori1', null, 'ori'),
    prop('grid', -2, -4, 'POWER CONDUITS', 'c1_p_power'),
    prop('door', 0, -6, 'PRESSURE DOOR', 'c1_door1')
  ]),
  2: room(6, 6, 4, [
    prop('tankBank', -5.58, -2.5, ''),
    prop('gauges', -4, 2, 'GAUGES', 'c1_gauges', 'c1_air_ok'),
    prop('valves', -4, -2, 'VALVES A–D', 'c1_p_valves', 'c1_air_ok'),
    prop('log', 4, 3, 'MAINTENANCE', 'c1_log2'),
    prop('talk', 4, -3, 'ORI / LAB', 'c1_lab', null, 'ori'),
    prop('door', 0, -6, 'LAB DOOR', 'c1_door2')
  ]),
  3: room(7, 6, 4, [
    prop('labBench', 4, 3, 'SAMPLE BENCH'),
    prop('wave', -4, -2, 'PULSE MONITOR', 'c1_listen'),
    prop('decoder', -4, 2, 'DECODER', 'c1_p_cipher'),
    prop('talk', 4, -2, 'THE VEIL', 'c1_talk', 'c1_decoded', 'veil'),
    prop('stand', 0, -4, 'NAVIGATION', 'c1_finish')
  ]),
  4: room(6, 6, 4, [
    prop('wave', 0, -4, 'RING WINDOW', 'c2_look1'),
    prop('pads', -3, -1, 'RING CONTROLS', 'c2_p_memory'),
    prop('talk', 3, 1, 'THE REED', 'c2_radio1', null, 'tamsin'),
    prop('door', 4, -5, 'CARGO HATCH', 'c2_door1'),
    prop('lamp', -5, -3, '', null, 'c2_ring_lit'),
    prop('lamp', 5, -3, '', null, 'c2_ring_lit')
  ]),
  5: room(9, 7, 5, [
    ...crates,
    prop('crateStack', -8.25, -5.95, ''),
    prop('crateStack', 8.25, -5.95, ''),
    prop('robot', 4, 1, 'PIP', 'c2_pip'),
    prop('talk', 6, 1, 'MANIFEST', null, 'c2_manifest'),
    prop('scale', -4, -3, 'BALANCE SCALE', 'c2_p_scales'),
    prop('rig', 4, -3, 'LIFTING RIG', null, 'c2_cargo_ok'),
    prop('door', 0, -7, 'TOWER LIFT', 'c2_door2')
  ]),
  6: room(6, 6, 4, [
    prop('wave', -4, 2, 'STATIC MONITOR', 'c2_look3'),
    prop('gauges', -4, -2, 'BEACON DIALS', 'c2_p_tuner'),
    prop('talk', 4, -2, 'CAPTAINS', 'c2_talk3', 'c2_beacon_tuned', 'tamsin'),
    prop('stand', 0, -4, 'ALL-CLEAR', 'c2_finish3')
  ]),
  7: room(6, 6, 4, [
    prop('cabinet', -4, 2, 'SEED DRAWERS', 'c3_look1', 'c3_vault_open'),
    prop('cabinet', -4, -1, '', null, 'c3_vault_open'),
    prop('cabinet', 4, -1, '', null, 'c3_vault_open'),
    prop('talk', 4, 2, 'FERN', 'c3_fern1', null, 'fern'),
    prop('locks', 2, -5, 'VAULT LOCKS', 'c3_p_lights'),
    prop('vault', 0, -6, 'SEED VAULT', 'c3_door1')
  ]),
  8: room(10, 8, 6, [
    prop('greenhouse', -6, -3, 'DOME', null, 'c3_crew_set'),
    prop('greenhouse', 0, -3, 'VINE', null, 'c3_crew_set'),
    prop('greenhouse', 6, -3, 'MOSS', null, 'c3_crew_set'),
    prop('log', -5, 3, 'NOTICE BOARD', 'c3_look2'),
    prop('crew', 4, 3, 'ANA & CY', 'c3_quarrel'),
    prop('log', -2, 2, 'ROTA STAND', 'c3_p_assign'),
    prop('crate', -8, 5, 'COMPOST'),
    prop('door', -3, -8, 'WATER ROOM', 'c3_door2')
  ]),
  9: room(6, 6, 4, [
    prop('wave', -4, 2, 'RETURN WINDOW', 'c3_look3', 'c3_water_flows'),
    prop('pipeFrame', -4, -2, 'PIPE FRAME', 'c3_p_sliding'),
    prop('talk', 4, -2, 'FERN / WATER', 'c3_talk3', 'c3_water_flows', 'fern'),
    prop('lamp', 4, 2, 'DOME FEEDER', null, 'c3_water_flows'),
    prop('door', 0, -6, 'DEPARTURE', 'c3_finish3')
  ])
};

// Horizontal footprint and height of the interaction marker, in grid units.
export const sizes = {
  pod: [1.65, 1.35, 1.05], openPod: [1.7, 1.4, 1.05],
  tankBank: [.84, 3, 1.65], crateStack: [1.05, 1.12, 2.29],
  decoder: [1.55, .92, 1.75], locks: [1.48, .95, 1.35], pipeFrame: [1.48, .95, 1.48],
  talk: [1.16, .74, 1.75], grid: [1.48, .95, 1.28], door: [1.95, .42, 2.15],
  vault: [1.95, .5, 2.09], gauges: [1.55, .9, 1.45], valves: [1.95, .75, 1.55],
  log: [1.28, .77, 1.46], wave: [1.55, .85, 1.58], stand: [1.05, .75, 1.4],
  pads: [1.55, .9, 1.28], crate: [1.28, 1.28, 1.15], robot: [.84, .84, 1.55],
  scale: [1.95, .95, 1.74], rig: [1.9, 1.1, 2.25], lamp: [.5, .52, 1.4],
  labBench: [2.2, .95, 1.24],
  cabinet: [1.65, .94, 1.85], greenhouse: [3.35, 2.8, 2.1], crew: [2.9, .74, 1.75]
};
