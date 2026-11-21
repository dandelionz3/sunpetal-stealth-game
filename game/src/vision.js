// Vision cones, hedge line-of-sight and the suspicion maths. A gardener sees
// Wren only inside its cone, within reach and with no hedge between eye and
// body; shade, crouching and keeping still slow suspicion, and it decays
// whenever she is unseen, so a near miss can still be walked back. A guard also
// notices someone close by out of the corner of an eye unless she is hidden in
// tall grass, and suspicion cools slowly enough that brushes add up: the player
// has to break line of sight, not merely outrun the meter.
import { CONE_LEN, CONE_HALF, MAX_SUSPICION, clamp } from './state.js';
import { LAYOUT } from './levels.js';

export const EYE_H = 92;
export const BODY_STAND = 58;
export const BODY_CROUCH = 36;
const CONE_TILT = 0.3;
const NEAR = 92;

export function eyeOf(guard) {
  return { x: guard.x, y: guard.y - EYE_H };
}

// Segment against an axis-aligned rect (Liang-Barsky), inset a few pixels so a
// body hugging a hedge is still hidden behind it.
export function segmentHitsRect(x1, y1, x2, y2, rect) {
  const pad = 5;
  const rx = rect.x + pad;
  const ry = rect.y + pad;
  const rw = rect.w - pad * 2;
  const rh = rect.h - pad * 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  let near = 0;
  let far = 1;
  for (const [p, q] of [
    [-dx, x1 - rx],
    [dx, rx + rw - x1],
    [-dy, y1 - ry],
    [dy, ry + rh - y1],
  ]) {
    if (p === 0) {
      if (q < 0) return false;
      continue;
    }
    const t = q / p;
    if (p < 0) {
      if (t > far) return false;
      if (t > near) near = t;
    } else {
      if (t < near) return false;
      if (t < far) far = t;
    }
  }
  return true;
}

export function sightBlocked(guard, tx, ty) {
  const eye = eyeOf(guard);
  for (const hedge of LAYOUT.hedges) {
    if (segmentHitsRect(eye.x, eye.y, tx, ty, hedge)) return true;
  }
  return false;
}

export function bodyY(player) {
  return player.y - (player.crouch ? BODY_CROUCH : BODY_STAND);
}

export function coneAngle(guard) {
  return guard.facing > 0 ? CONE_TILT : Math.PI - CONE_TILT;
}

export function canSee(state, guard) {
  const p = state.player;
  const eye = eyeOf(guard);
  const ty = bodyY(p);
  const dx = p.x - eye.x;
  const dy = ty - eye.y;
  const dist = Math.hypot(dx, dy);
  if (dist > CONE_LEN || dist < 8) return false;
  let diff = Math.atan2(dy, dx) - coneAngle(guard);
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > CONE_HALF) return false;
  if (p.crouch && p.inGrass && dist > 70) return false;
  return !sightBlocked(guard, p.x, ty);
}

// How fast this guard's suspicion climbs while Wren stands in its sight.
export function detectionRate(state, guard, dist) {
  const p = state.player;
  const reach = clamp(1.6 - dist / CONE_LEN, 0.5, 1.4);
  let mult = p.inShade ? 0.5 : 1.5;
  if (p.crouch) mult *= 0.55;
  if (p.sprint) mult *= 1.8;
  else if (p.moving) mult *= 1.2;
  else mult *= 0.75;
  return 76 * reach * mult;
}

// Updates one guard's suspicion. Returns true when it has eyes on Wren.
export function sense(state, guard, dt) {
  const p = state.player;
  if (canSee(state, guard)) {
    const eye = eyeOf(guard);
    const dist = Math.hypot(p.x - eye.x, bodyY(p) - eye.y);
    guard.suspicion = clamp(guard.suspicion + detectionRate(state, guard, dist) * dt, 0, MAX_SUSPICION);
    guard.lastSeen = { x: p.x, t: 0 };
    guard.unseen = 0;
    return true;
  }
  const hidden = p.crouch && p.inGrass;
  const close = Math.abs(p.x - guard.x);
  if (close < NEAR && !hidden) {
    const edge = 1 - close / NEAR;
    const rattle = (p.sprint ? 100 : p.moving ? 74 : 42) * edge * (p.crouch ? 0.75 : 1);
    guard.suspicion = clamp(guard.suspicion + rattle * dt, 0, MAX_SUSPICION);
    guard.lastSeen = { x: p.x, t: 0 };
  }
  const calm = guard.mode === 'alerted' ? 7 : hidden ? 20 : 13;
  guard.suspicion = clamp(guard.suspicion - calm * dt, 0, MAX_SUSPICION);
  guard.unseen += dt;
  return false;
}
