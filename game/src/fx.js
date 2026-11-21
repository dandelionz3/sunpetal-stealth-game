// Particles, expanding sound rings and floating words. Everything is plain data
// in state.fx so the renderer can draw it without owning any timing.
const MAX_PARTS = 260;

export function spawnBurst(state, x, y, color, count = 12, speed = 150) {
  for (let i = 0; i < count; i += 1) {
    const a = state.rng() * Math.PI * 2;
    const v = speed * (0.35 + state.rng() * 0.8);
    state.fx.parts.push({
      x,
      y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v - 60,
      life: 0.7 + state.rng() * 0.7,
      max: 1.4,
      size: 2 + state.rng() * 3.4,
      color,
      spin: (state.rng() - 0.5) * 8,
      rot: state.rng() * 6.28,
      shape: state.rng() < 0.5 ? 'petal' : 'dot',
    });
  }
  trim(state);
}

export function spawnDust(state, x, y) {
  state.fx.parts.push({
    x,
    y,
    vx: -14 + state.rng() * 28,
    vy: -18 - state.rng() * 22,
    life: 0.42,
    max: 0.42,
    size: 4 + state.rng() * 5,
    color: 'rgba(232,214,160,0.8)',
    spin: 0,
    rot: 0,
    shape: 'dot',
  });
  trim(state);
}

export function spawnRing(state, x, y, r0, r1, color, life = 0.5) {
  state.fx.rings.push({ x, y, r0, r1, color, life, max: life });
}

export function spawnText(state, x, y, text, color = '#fff') {
  state.fx.texts.push({ x, y, text, color, life: 1.15, max: 1.15 });
}

function trim(state) {
  while (state.fx.parts.length > MAX_PARTS) state.fx.parts.shift();
}

export function updateFx(state, dt) {
  const parts = state.fx.parts;
  for (let i = parts.length - 1; i >= 0; i -= 1) {
    const p = parts[i];
    p.life -= dt;
    if (p.life <= 0) {
      parts.splice(i, 1);
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 240 * dt;
    p.vx *= 0.985;
    p.rot += p.spin * dt;
  }
  const rings = state.fx.rings;
  for (let i = rings.length - 1; i >= 0; i -= 1) {
    rings[i].life -= dt;
    if (rings[i].life <= 0) rings.splice(i, 1);
  }
  const texts = state.fx.texts;
  for (let i = texts.length - 1; i >= 0; i -= 1) {
    texts[i].life -= dt;
    texts[i].y -= 26 * dt;
    if (texts[i].life <= 0) texts.splice(i, 1);
  }
}

export function clearFx(state) {
  state.fx = { parts: [], rings: [], texts: [] };
}
