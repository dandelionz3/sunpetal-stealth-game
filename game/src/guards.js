// The four gardeners. Each patrols its own stretch of lawn, pauses and scans at
// the ends, investigates the last place it saw Wren or the pebble it heard, and
// chases once suspicion fills. A glimpse turns its head toward her, so a cone
// reacts the way a player expects. A touch while fully alerted is a catch;
// anything short of that is a scare she can still walk away from.
import { GROUND, MAX_SUSPICION, clamp, emit } from './state.js';
import { LAYOUT } from './levels.js';
import { sense } from './vision.js';

export const MODE_PATROL = 'patrol';
export const MODE_SUSPICIOUS = 'suspicious';
export const MODE_ALERTED = 'alerted';

export function spawnGuards(state) {
  state.guards = LAYOUT.guards.map((spec, index) => ({
    ...spec,
    id: index,
    x: spec.a + (spec.b - spec.a) * (0.18 + index * 0.16),
    y: GROUND,
    dir: index % 2 === 0 ? 1 : -1,
    facing: index % 2 === 0 ? 1 : -1,
    mode: MODE_PATROL,
    suspicion: 0,
    wait: 0,
    unseen: 0,
    look: 0,
    lastSeen: null,
    target: null,
    chase: 0,
  }));
}

function faceTo(guard, x) {
  guard.facing = x >= guard.x ? 1 : -1;
}

function walk(guard, target, speed, dt) {
  const dx = target - guard.x;
  const step = speed * dt;
  if (Math.abs(dx) <= step) {
    guard.x = target;
    return true;
  }
  guard.x += Math.sign(dx) * step;
  guard.dir = Math.sign(dx);
  guard.facing = guard.dir;
  return false;
}

function nearestGuardTo(state, x) {
  let best = null;
  let bestDist = Infinity;
  for (const guard of state.guards) {
    const dist = Math.abs(guard.x - x);
    if (dist < bestDist) {
      bestDist = dist;
      best = guard;
    }
  }
  return best;
}

// Sprint footsteps call the closest gardener within earshot, raising suspicion.
export function hearNoise(state, x, strength) {
  const guard = nearestGuardTo(state, x);
  if (!guard) return;
  const dist = Math.abs(guard.x - x);
  if (dist > strength) return;
  guard.suspicion = clamp(guard.suspicion + (1 - dist / strength) * 15, 0, MAX_SUSPICION);
  if (guard.mode === MODE_PATROL && dist < strength * 0.7) {
    guard.mode = MODE_SUSPICIOUS;
    guard.target = clamp(x, guard.a, guard.b);
    guard.look = 0;
    guard.wait = 0;
  }
}

// A landed pebble: the closest gardener walks over to it and looks around.
export function lure(state, x) {
  const guard = nearestGuardTo(state, x);
  if (!guard || guard.mode === MODE_ALERTED) return;
  guard.mode = MODE_SUSPICIOUS;
  guard.target = clamp(x, guard.a - 30, guard.b + 30);
  guard.lastSeen = { x, t: 0 };
  guard.look = 0;
  guard.wait = 0;
  guard.suspicion = Math.max(guard.suspicion, 26);
}

function updatePatrol(state, guard, dt) {
  if (guard.wait > 0) {
    guard.wait -= dt;
    guard.look += dt;
    // Scan slowly toward the lawn while resting at a waypoint.
    if (Math.floor(guard.look * 1.6) % 2 === 0) faceTo(guard, guard.x + guard.dir);
    else faceTo(guard, guard.x - guard.dir);
    return;
  }
  const target = guard.dir > 0 ? guard.b : guard.a;
  if (walk(guard, target, guard.speed, dt)) {
    guard.wait = guard.pause;
    guard.look = 0;
    guard.dir *= -1;
  }
}

function updateSuspicious(state, guard, dt) {
  if (guard.target === null) {
    guard.mode = MODE_PATROL;
    return;
  }
  const arrived = walk(guard, guard.target, guard.speed * 1.5, dt);
  if (arrived) {
    guard.look += dt;
    guard.facing = Math.floor(guard.look * 2.4) % 2 === 0 ? -guard.dir : guard.dir;
    if (guard.look > 2.2) {
      guard.mode = MODE_PATROL;
      guard.target = null;
      guard.look = 0;
      guard.suspicion = Math.min(guard.suspicion, 22);
      guard.dir = guard.x < (guard.a + guard.b) / 2 ? 1 : -1;
    }
  }
}

function updateAlerted(state, guard, dt) {
  const p = state.player;
  guard.chase -= dt;
  faceTo(guard, p.x);
  if (Math.abs(p.x - guard.x) < 30) {
    if (guard.chase > 0.5) emit(state, 'caught', guard.id);
    return;
  }
  if (guard.chase > 0) walk(guard, p.x, guard.speed * 2.4, dt);
  else {
    guard.mode = MODE_SUSPICIOUS;
    guard.target = guard.lastSeen ? guard.lastSeen.x : p.x;
    guard.look = 0;
    guard.suspicion = Math.min(guard.suspicion, MAX_SUSPICION - 12);
  }
}

export function updateGuards(state, dt) {
  for (const guard of state.guards) {
    if (guard.lastSeen) guard.lastSeen.t += dt;
    sense(state, guard, dt);
    if (guard.suspicion >= MAX_SUSPICION && guard.mode !== MODE_ALERTED) {
      guard.mode = MODE_ALERTED;
      guard.chase = 2.4;
      guard.target = state.player.x;
      emit(state, 'alarm', guard.id);
      state.spotted += 1;
    }
    if (guard.mode === MODE_PATROL) {
      // A glimpse or a nearby footfall turns its head toward Wren.
      if (guard.suspicion > 16 && guard.lastSeen) faceTo(guard, guard.lastSeen.x);
      updatePatrol(state, guard, dt);
    } else if (guard.mode === MODE_SUSPICIOUS) updateSuspicious(state, guard, dt);
    else updateAlerted(state, guard, dt);
    guard.x = clamp(guard.x, 40, LAYOUT.gate.x - 10);
  }
  let top = 0;
  let alarm = false;
  for (const guard of state.guards) {
    if (guard.suspicion > top) top = guard.suspicion;
    if (guard.mode === MODE_ALERTED) alarm = true;
  }
  state.suspicion = top;
  state.alert = alarm;
}
