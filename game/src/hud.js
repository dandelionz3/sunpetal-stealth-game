// The DOM layer: HUD readouts, the title wordmark and start bar, and the pause,
// caught and win cards. It only mirrors state; a click reports back as a start
// or restart intent through the callback it is given.
const SEED_ICONS = 3;

function el(id) {
  return document.getElementById(id);
}

function fmtTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function createHud(onAction) {
  const hud = el('hud');
  const suspicionFill = el('suspicion-fill');
  const suspicionLabel = el('suspicion-label');
  const seedsEl = el('seeds');
  const pebblesEl = el('pebbles');
  const petalEl = el('petal');
  const timerEl = el('timer');
  const objectiveEl = el('objective');
  const noiseEl = el('noise');
  const screenEl = el('screen');
  const screenBody = el('screen-body');
  const hintEl = el('hint');
  const wordmark = el('wordmark');
  const startbar = el('startbar');
  const bestLine = document.createElement('p');
  bestLine.className = 'best';
  wordmark.appendChild(bestLine);

  const seedSlots = [];
  for (let i = 0; i < SEED_ICONS; i += 1) {
    const slot = document.createElement('span');
    slot.className = 'seed-slot';
    seedsEl.appendChild(slot);
    seedSlots.push(slot);
  }

  el('screen-action').addEventListener('click', () => onAction());
  el('start-btn').addEventListener('click', () => onAction());

  function update(state) {
    const player = state.player;
    const pct = Math.round(state.suspicion);
    suspicionFill.style.width = `${pct}%`;
    suspicionFill.className = pct >= 100 ? 'fill red' : pct >= 50 ? 'fill amber' : 'fill green';
    suspicionLabel.textContent = state.alert ? 'SPOTTED' : pct >= 50 ? 'SEEN' : pct > 0 ? 'UNEASY' : 'HIDDEN';
    suspicionLabel.className = `tag ${pct >= 100 ? 'red' : pct >= 50 ? 'amber' : 'green'}`;
    seedSlots.forEach((slot, i) => slot.classList.toggle('got', i < state.seedsGot));
    pebblesEl.textContent = `${player.pebbles}`;
    pebblesEl.classList.toggle('empty', player.pebbles === 0);
    petalEl.classList.toggle('got', state.hasPetal);
    timerEl.textContent = fmtTime(state.time);
    objectiveEl.textContent = state.objective;
    noiseEl.className = `noise ${player.sprint && player.moving ? 'loud' : player.moving ? 'soft' : 'still'}`;
    noiseEl.textContent = player.sprint && player.moving ? 'noisy' : player.moving ? 'soft steps' : player.crouch ? 'still' : 'quiet';
  }

  function card(kind, html, action, showHint = true) {
    screenEl.className = `screen show ${kind}`;
    screenBody.innerHTML = html;
    el('screen-action').textContent = action;
    hintEl.style.display = showHint ? '' : 'none';
  }

  return {
    update,
    setVisible(visible) {
      hud.classList.toggle('hidden', !visible);
    },
    showTitle(best) {
      wordmark.classList.add('show');
      startbar.classList.add('show');
      hud.classList.remove('hidden');
      bestLine.textContent = best
        ? `Best: ${best.rating} rating · ${best.seeds}/3 seeds · ${fmtTime(best.time)}`
        : 'Crouch in the grass · keep out of the cones · reach the gate';
    },
    hideTitle() {
      wordmark.classList.remove('show');
      startbar.classList.remove('show');
    },
    showPause() {
      card('pause', `<h2>Paused</h2><p class="lede">The gardeners are still. Take a breath.</p><p class="keys">P resume &middot; R restart &middot; M mute</p>`, 'Resume');
    },
    showCaught(state) {
      card(
        'caught',
        `<h2>Caught!</h2>
         <p class="lede">${state.caughtBy} spotted you ${state.progress}% of the way to the gate.</p>
         <p class="stats">${fmtTime(state.stats.time)} elapsed &middot; ${state.stats.seeds}/3 seeds</p>`,
        'Try again',
      );
    },
    showWin(state) {
      card(
        'won',
        `<p class="eyebrow">the Sunpetal is yours</p>
         <h2>Bloom</h2>
         <p class="rating">${state.rating}</p>
         <p class="stats">${fmtTime(state.stats.time)} &middot; ${state.stats.seeds}/3 seeds &middot; spotted ${state.stats.spotted}x</p>
         <p class="lede">${state.rating === 'S' ? 'Not a single gardener looked your way.' : 'The gate clicked shut behind you.'}</p>`,
        'Play again',
      );
    },
    hideScreen() {
      screenEl.className = 'screen';
    },
  };
}
