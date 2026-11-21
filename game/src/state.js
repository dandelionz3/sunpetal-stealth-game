// One state object per run, plus the constants every module agrees on. Rendering
// only reads it; simulation writes it at a fixed 60 Hz.
import { mulberry32 } from './rng.js';

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const WORLD_W = 2560;
export const GROUND = 596;
export const STEP = 1 / 60;
export const CONE_LEN = 260;
export const CONE_HALF = (25 * Math.PI) / 180;
export const MAX_SUSPICION = 100;

export const MODE = {
  TITLE: 'title',
  PLAY: 'play',
  PAUSE: 'pause',
  CAUGHT: 'caught',
  WON: 'won',
};

export function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

export function createState(seed = 1) {
  return {
    seed: seed >>> 0,
    rng: mulberry32(seed),
    time: 0,
    mode: MODE.TITLE,
    camera: { x: 0 },
    player: {
      x: 130,
      y: GROUND,
      vx: 0,
      facing: 1,
      crouch: false,
      sprint: false,
      moving: false,
      anim: 0,
      pebbles: 5,
      throwCd: 0,
      throwArm: 0,
      stepTimer: 0,
      inGrass: false,
      inShade: false,
      hidden: false,
    },
    guards: [],
    seeds: [],
    petal: null,
    stones: [],
    fx: { parts: [], rings: [], texts: [] },
    suspicion: 0,
    spotted: 0,
    alert: false,
    objective: 'Reach the Sunpetal bed',
    seedsGot: 0,
    hasPetal: false,
    rating: 'S',
    events: [],
    stats: { time: 0, spotted: 0, seeds: 0 },
    shot: null,
    muted: false,
  };
}

export function emit(state, type, value = 0) {
  state.events.push({ type, value });
}

export function drainEvents(state) {
  const events = state.events;
  state.events = [];
  return events;
}
