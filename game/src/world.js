// The run: build a fresh garden from the level, pick up seeds and the Sunpetal,
// watch the clock and decide the ending. Also runs the per-step simulation in a
// fixed order so guards, vision and Wren all see the same frame.
import { STEP, clamp, emit } from './state.js';
import { LAYOUT } from './levels.js';
import { spawnGuards, updateGuards } from './guards.js';
import { updatePlayer, updateStones, resetPlayer } from './player.js';
import { updateFx, spawnBurst, spawnText } from './fx.js';

export function resetRun(state) {
  state.time = 0;
  state.suspicion = 0;
  state.spotted = 0;
  state.alert = false;
  state.seedsGot = 0;
  state.hasPetal = false;
  state.stones = [];
  state.fx = { parts: [], rings: [], texts: [] };
  state.stats = { time: 0, spotted: 0, seeds: 0 };
  state.objective = 'Reach the Sunpetal bed';
  state.camera.x = 0;
  state.rating = 'S';
  resetPlayer(state);
  spawnGuards(state);
  state.seeds = LAYOUT.seeds.map((seed, index) => ({ ...seed, id: index, taken: false, bob: index * 1.7 }));
  state.petal = { ...LAYOUT.sunpetal, taken: false };
}

export function stepWorld(state, input) {
  state.time += STEP;
  updatePlayer(state, input, STEP);
  updateStones(state, STEP);
  updateGuards(state, STEP);
  updateFx(state, STEP);
  collect(state);
  updateCamera(state);
  checkEnding(state);
}

function collect(state) {
  const p = state.player;
  for (const seed of state.seeds) {
    if (!seed.taken && Math.abs(seed.x - p.x) < 26) {
      seed.taken = true;
      state.seedsGot += 1;
      spawnBurst(state, seed.x, seed.y - 10, '#ffd66b', 10);
      spawnText(state, seed.x, seed.y - 46, '+1 seed', '#ffe9a8');
      emit(state, 'pickup', 0);
    }
  }
  const petal = state.petal;
  if (!petal.taken && Math.abs(petal.x - p.x) < 30) {
    petal.taken = true;
    state.hasPetal = true;
    spawnBurst(state, petal.x, petal.y - 18, '#ffcf4a', 22);
    spawnBurst(state, petal.x, petal.y - 18, '#fff0b8', 14);
    spawnText(state, petal.x, petal.y - 60, 'Sunpetal!', '#fff4c2');
    state.objective = 'Escape through the garden gate';
    emit(state, 'bloom', 0);
  }
}

function updateCamera(state) {
  const target = clamp(state.player.x - 520, 0, LAYOUT.width - 1280);
  state.camera.x += (target - state.camera.x) * 0.09;
}

export function ratingFor(spotted) {
  return spotted === 0 ? 'S' : spotted === 1 ? 'A' : spotted <= 3 ? 'B' : 'C';
}

function checkEnding(state) {
  if (state.hasPetal && state.player.x > LAYOUT.gate.x + 10) {
    state.mode = 'won';
    state.stats.time = state.time;
    state.stats.spotted = state.spotted;
    state.stats.seeds = state.seedsGot;
    state.rating = ratingFor(state.spotted);
    emit(state, 'win', 0);
  }
}

export function caughtBy(state, guard) {
  state.mode = 'caught';
  state.stats.time = state.time;
  state.stats.spotted = Math.max(1, state.spotted);
  state.stats.seeds = state.seedsGot;
  state.caughtBy = guard ? guard.name : 'a gardener';
  state.progress = Math.round((state.player.x / LAYOUT.gate.x) * 100);
  emit(state, 'caught', 0);
}
