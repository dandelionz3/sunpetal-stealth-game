// Screenshot staging for ?shot=cover|sneak|alarm|bloom, and the same pilot drives
// ?autoplay=1. The pilot really plays: it walks toward the current objective,
// retreats into tall grass when a cone reaches it, creeps past a gardener that
// is close but looking away, and lobs a pebble at one that stares down the path.
// Each shot then settles into a deliberate pose and holds, so the captured frame
// is a real render of the live game.
import { GROUND, WORLD_W, clamp } from './state.js';
import { LAYOUT } from './levels.js';
import { spawnBurst, updateFx } from './fx.js';
import { MODE_ALERTED } from './guards.js';
import { canSee } from './vision.js';

export function setupShot(kind, seed) {
  return { kind, seed, t: 0 };
}

function goalX(state) {
  return state.hasPetal ? LAYOUT.gate.x + 20 : state.petal.x;
}

// Nearest tall grass centre, preferring one behind Wren over one past a guard.
function coverX(state) {
  const p = state.player;
  let best = p.x;
  let bestScore = -Infinity;
  for (const patch of LAYOUT.grass) {
    const centre = patch.x + patch.w / 2;
    const score = -Math.abs(centre - p.x) - (centre > p.x + 40 ? 260 : 0);
    if (score > bestScore) {
      bestScore = score;
      best = centre;
    }
  }
  return best;
}

// A gardener within reach whose cone is sweeping across the way ahead.
function stareDown(state) {
  const p = state.player;
  for (const guard of state.guards) {
    const dx = guard.x - p.x;
    if (Math.abs(dx) > 300 || Math.abs(dx) < 34) continue;
    if (guard.facing === Math.sign(dx)) return guard;
  }
  return null;
}

export function shotAutopilot(state, shot, t) {
  const p = state.player;
  const intent = {
    left: false,
    right: false,
    crouch: false,
    sprint: false,
    throwPebble: false,
    clickThrow: false,
    pointerX: 640,
    pointerY: 360,
  };
  const dx = goalX(state) - p.x;
  const seen = state.guards.some((guard) => canSee(state, guard));
  const stare = stareDown(state);

  if (seen) {
    // Break line of sight: crouch low and slip into the nearest grass.
    const cover = coverX(state);
    intent.crouch = true;
    intent.right = cover - p.x > 6;
    intent.left = cover - p.x < -6;
  } else if (state.suspicion > 45) {
    // Still hot: hold in grass until the meter cools.
    intent.crouch = true;
    if (!p.inGrass) {
      const cover = coverX(state);
      intent.right = cover - p.x > 6;
      intent.left = cover - p.x < -6;
    }
  } else if (stare) {
    // Close guard looking this way: creep past low, or pull it off with a pebble.
    intent.crouch = true;
    intent.right = dx > 6;
    intent.left = dx < -6;
    if (p.pebbles > 0 && Math.abs(stare.x - p.x) < 250) {
      intent.throwPebble = true;
      intent.pointerX = clamp(stare.x + (stare.x > p.x ? 250 : -250) - state.camera.x, 60, 1220);
    }
  } else {
    intent.right = dx > 6;
    intent.left = dx < -6;
    if (Math.abs(dx) > 420 && state.suspicion < 18) intent.sprint = true;
  }
  if (state.hasPetal && p.x > LAYOUT.gate.x - 230 && !seen) {
    intent.sprint = true;
    intent.crouch = false;
    intent.right = true;
    intent.left = false;
  }
  return intent;
}

export function isShotDone(state, shot) {
  if (shot.kind === 'cover') return shot.t > 2.2;
  if (shot.kind === 'bloom') return state.hasPetal || shot.t > 40;
  if (shot.kind === 'alarm') return shot.t > 24;
  return shot.t > 12;
}

function pose(guard, x, facing, suspicion, mode = 'patrol') {
  guard.x = x;
  guard.facing = facing;
  guard.dir = facing;
  guard.suspicion = suspicion;
  guard.mode = mode;
  guard.wait = 0.4;
  guard.look = 0;
  guard.target = null;
  guard.chase = mode === MODE_ALERTED ? 1.6 : 0;
}

// Settle the garden into the frame each screenshot wants.
export function stageShot(state, shot) {
  const p = state.player;
  const g = state.guards;
  p.y = GROUND;
  p.moving = false;
  p.throwArm = 0;
  p.anim = 0;
  state.spotted = 0;

  if (shot.kind === 'cover') {
    state.camera.x = 1280;
    p.x = 2046;
    p.crouch = true;
    p.inGrass = true;
    p.hidden = true;
    p.facing = 1;
    p.pebbles = 4;
    state.petal.taken = false;
    state.hasPetal = false;
    state.seedsGot = 1;
    state.seeds.forEach((seed, i) => { seed.taken = i === 0; });
    pose(g[3], 1836, 1, 0);
    pose(g[0], 2178, -1, 18);
    pose(g[1], 2328, 1, 34);
    pose(g[2], 2444, -1, 0);
    state.suspicion = 34;
    state.alert = false;
    state.objective = 'Reach the Sunpetal bed';
  } else if (shot.kind === 'sneak') {
    state.camera.x = 878;
    p.x = 1318;
    p.crouch = true;
    p.inGrass = true;
    p.hidden = true;
    p.facing = 1;
    p.pebbles = 4;
    pose(g[2], 1448, -1, 14);
    pose(g[1], 940, 1, 0);
    g[0].suspicion = 0;
    g[3].suspicion = 0;
    state.suspicion = 14;
    state.alert = false;
    state.objective = 'Reach the Sunpetal bed';
  } else if (shot.kind === 'alarm') {
    state.camera.x = 1280;
    p.x = 1914;
    p.crouch = true;
    p.inGrass = false;
    p.hidden = false;
    p.facing = -1;
    p.pebbles = 2;
    pose(g[3], 2026, -1, 88, MODE_ALERTED);
    pose(g[2], 1650, 1, 12);
    state.suspicion = 88;
    state.alert = true;
    state.objective = 'Reach the Sunpetal bed';
    spawnBurst(state, 1962, GROUND - 74, '#f3e6bf', 9, 80);
  } else if (shot.kind === 'bloom') {
    state.camera.x = 1280;
    p.x = 2246;
    p.crouch = false;
    p.inGrass = false;
    p.hidden = false;
    p.facing = 1;
    p.pebbles = 3;
    state.petal.taken = true;
    state.hasPetal = true;
    state.seedsGot = Math.max(2, state.seedsGot);
    state.seeds.forEach((seed, i) => { seed.taken = i < state.seedsGot; });
    pose(g[3], 1930, 1, 44);
    pose(g[2], 1670, -1, 8);
    state.suspicion = 44;
    state.alert = false;
    state.objective = 'Escape through the garden gate';
    spawnBurst(state, state.petal.x, state.petal.y - 34, '#ffcf4a', 30, 180);
    spawnBurst(state, state.petal.x, state.petal.y - 34, '#fff0b8', 18, 140);
    spawnBurst(state, state.petal.x, state.petal.y - 20, '#f6a93c', 12, 100);
    for (let i = 0; i < 10; i += 1) updateFx(state, 0.016);
  }
  state.camera.x = clamp(state.camera.x, 0, WORLD_W - 1280);
}

export function shotHold(state, shot) {
  const times = { cover: 6.4, sneak: 22.6, alarm: 48.8, bloom: 74.2 };
  state.time = times[shot.kind] ?? 9.5;
  state.stats.time = state.time;
  state.stats.seeds = state.seedsGot;
  state.stats.spotted = state.spotted;
}
