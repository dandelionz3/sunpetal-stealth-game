// Bootstrap: build the state, renderer, HUD and audio, then run one fixed-step
// simulation with a render each frame. ?shot= hands the run to shots.js and
// freezes one staged frame; ?autoplay=1 drives the same pilot live.
import { createState, STEP, MODE, drainEvents } from './state.js';
import { resetRun, stepWorld, caughtBy } from './world.js';
import { createRenderer } from './render.js';
import { createHud } from './hud.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { setupShot, shotAutopilot, stageShot, shotHold, isShotDone } from './shots.js';

const canvas = document.getElementById('game');
const params = new URLSearchParams(location.search);
const shotName = params.get('shot');
const autoplay = params.get('autoplay') === '1';
const seed = Number(params.get('seed') ?? 1) || 1;

const state = createState(seed);
const renderer = createRenderer(canvas);
const audio = createAudio();
const input = createInput(canvas);
const hud = createHud(() => primaryAction());
const best = readBest();
let acc = 0;
let last = performance.now();

resetRun(state);
state.mode = MODE.TITLE;

if (shotName) startShot(shotName);
else {
  hud.showTitle(best);
  requestAnimationFrame(frame);
}

function startShot(name) {
  const shot = setupShot(name, seed);
  state.shot = shot;
  resetRun(state);
  state.mode = MODE.PLAY;
  hud.setVisible(false);
  hud.hideScreen();
  for (let i = 0; i < 2400 && !isShotDone(state, shot); i += 1) {
    shot.t += STEP;
    stepWorld(state, shotAutopilot(state, shot, shot.t));
    if (state.mode !== MODE.PLAY) break;
  }
  stageShot(state, shot);
  shotHold(state, shot);
  state.mode = MODE.PLAY;
  hud.setVisible(true);
  if (name === 'cover') hud.showTitle(best);
  hud.update(state);
  renderer.draw(state, 0);
  document.body.dataset.shotReady = '1';
}

function primaryAction() {
  audio.resume();
  if (state.mode === MODE.TITLE || state.mode === MODE.CAUGHT || state.mode === MODE.WON) {
    resetRun(state);
    state.mode = MODE.PLAY;
    hud.hideScreen();
    hud.hideTitle();
    hud.setVisible(true);
  } else if (state.mode === MODE.PAUSE) {
    state.mode = MODE.PLAY;
    hud.hideScreen();
  }
}

function handleEvents(events) {
  for (const event of events) {
    if (['step', 'throw', 'clink', 'alarm', 'pickup', 'bloom', 'win', 'caught'].includes(event.type)) {
      audio.play(event.type, event.value);
    }
    if (event.type === 'caught' && state.mode === MODE.PLAY) {
      caughtBy(state, state.guards[event.value]);
      hud.setVisible(false);
      hud.showCaught(state);
    }
    if (event.type === 'win' && state.mode === MODE.PLAY) {
      saveBest(state);
      hud.setVisible(false);
      hud.showWin(state);
    }
  }
}

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (input.mute) {
    state.muted = !state.muted;
    audio.setMuted(state.muted);
  }
  if (input.start) primaryAction();
  if (input.pause && state.mode === MODE.PLAY) {
    state.mode = MODE.PAUSE;
    hud.showPause();
  } else if (input.pause && state.mode === MODE.PAUSE) {
    state.mode = MODE.PLAY;
    hud.hideScreen();
  }
  if (input.restart && state.mode !== MODE.TITLE) primaryAction();
  if (autoplay && state.mode === MODE.TITLE) primaryAction();

  if (state.mode === MODE.PLAY) {
    const intent = autoplay ? shotAutopilot(state, { kind: 'auto', t: state.time }, state.time) : input;
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      stepWorld(state, intent);
      acc -= STEP;
      steps += 1;
      handleEvents(drainEvents(state));
      if (state.mode !== MODE.PLAY) break;
    }
    hud.update(state);
    audio.tick(dt, state.suspicion);
  } else if (state.mode === MODE.TITLE) {
    // Attract view: the first stretch of garden, swaying gently.
    state.time += dt;
    state.camera.x = Math.sin(state.time * 0.12) * 55;
  }
  renderer.draw(state, dt);
  input.endFrame();
  requestAnimationFrame(frame);
}

function readBest() {
  try {
    const raw = localStorage.getItem('sunpetal.best');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveBest(state) {
  const current = readBest();
  const rank = { S: 4, A: 3, B: 2, C: 1 };
  const entry = { rating: state.rating, seeds: state.seedsGot, time: state.time };
  try {
    if (!current || rank[entry.rating] > rank[current.rating] ||
        (entry.rating === current.rating && entry.time < current.time)) {
      localStorage.setItem('sunpetal.best', JSON.stringify(entry));
    }
  } catch {
    /* storage unavailable: the run still counts */
  }
}
