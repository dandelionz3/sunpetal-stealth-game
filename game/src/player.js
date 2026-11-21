// Wren's movement: walk, crouch, sprint, and throw a pebble toward the pointer.
// Crouching is slow, low and quiet; sprinting is fast but every few strides sends
// a sound ring that wakes the nearest gardener. Grass and shade are read here so
// the vision maths can stay about sight alone.
import { GROUND, clamp, emit } from './state.js';
import { LAYOUT, inGrass, inShade } from './levels.js';
import { hearNoise, lure } from './guards.js';
import { spawnRing, spawnDust, spawnText } from './fx.js';

const WALK = 158;
const CROUCH_SPEED = 84;
const SPRINT = 253;

export function updatePlayer(state, input, dt) {
  const p = state.player;
  const left = input.left;
  const right = input.right;
  p.crouch = Boolean(input.crouch);
  p.sprint = Boolean(input.sprint) && !p.crouch && (left || right);
  const speed = p.crouch ? CROUCH_SPEED : p.sprint ? SPRINT : WALK;
  let dir = 0;
  if (left && !right) dir = -1;
  if (right && !left) dir = 1;
  p.moving = dir !== 0;
  p.vx = dir * speed;
  p.x = clamp(p.x + p.vx * dt, 26, LAYOUT.width - 22);
  if (dir !== 0) p.facing = dir;
  p.anim += Math.abs(p.vx) * dt * 0.06;

  p.inGrass = Boolean(inGrass(p.x));
  p.inShade = Boolean(inShade(p.x));
  p.hidden = p.crouch && p.inGrass;

  p.throwCd = Math.max(0, p.throwCd - dt);
  p.throwArm = Math.max(0, p.throwArm - dt);
  if ((input.throwPebble || input.clickThrow) && p.pebbles > 0 && p.throwCd <= 0) {
    const tx = clamp(input.pointerX + state.camera.x, 60, LAYOUT.width - 40);
    throwPebble(state, tx);
    p.throwCd = 0.45;
    p.throwArm = 0.28;
    p.pebbles -= 1;
    input.clickThrow = false;
    input.throwPebble = false;
  }

  p.stepTimer = (p.stepTimer ?? 0) + dt;
  if (p.moving && p.sprint) {
    if (p.stepTimer > 0.19) {
      p.stepTimer = 0;
      spawnDust(state, p.x - p.facing * 12, GROUND - 4);
      spawnRing(state, p.x, GROUND - 6, 18, 74, 'rgba(250,240,205,0.55)', 0.5);
      hearNoise(state, p.x, 200);
      emit(state, 'step', 1);
    }
  } else if (p.moving) {
    const gap = p.crouch ? 0.44 : 0.3;
    if (p.stepTimer > gap) {
      p.stepTimer = 0;
      emit(state, 'step', p.crouch ? 0 : 1);
    }
  }
}

function throwPebble(state, targetX) {
  const p = state.player;
  const x0 = p.x + p.facing * 10;
  const y0 = p.y - 74;
  const flight = clamp(Math.abs(targetX - x0) / 460, 0.3, 1.1);
  state.stones.push({ x: x0, y: y0, x0, y0, tx: targetX, ty: GROUND - 8, t: 0, flight, landed: false, life: 0 });
  emit(state, 'throw', 0);
}

export function updateStones(state, dt) {
  for (const stone of state.stones) {
    if (stone.landed) continue;
    stone.t += dt;
    const k = Math.min(1, stone.t / stone.flight);
    stone.x = stone.x0 + (stone.tx - stone.x0) * k;
    stone.y = stone.y0 + (stone.ty - stone.y0) * k - Math.sin(k * Math.PI) * 96;
    if (k >= 1) {
      stone.landed = true;
      stone.life = 2.2;
      spawnRing(state, stone.x, GROUND - 8, 10, 92, 'rgba(255,246,210,0.75)', 0.62);
      spawnText(state, stone.x, GROUND - 44, 'clink', '#fff3c9');
      lure(state, stone.x);
      emit(state, 'clink', 0);
    }
  }
  for (let i = state.stones.length - 1; i >= 0; i -= 1) {
    const stone = state.stones[i];
    if (!stone.landed) continue;
    stone.life -= dt;
    if (stone.life <= 0) state.stones.splice(i, 1);
  }
}

export function resetPlayer(state) {
  const p = state.player;
  p.x = LAYOUT.startX;
  p.y = GROUND;
  p.vx = 0;
  p.facing = 1;
  p.crouch = false;
  p.sprint = false;
  p.moving = false;
  p.pebbles = 5;
  p.throwCd = 0;
  p.stepTimer = 0;
  p.throwArm = 0;
  p.inGrass = false;
  p.inShade = false;
  p.hidden = false;
}
