// The garden: one long side-view level, y down, the lawn surface at GROUND.
// Hedges sit in the gaps between patrol stretches, so a gardener never walks
// through one and each hedge gives cover from the cone on its far side. Tall
// grass hides a crouching Wren; shade dims her; open sun brightens her.
import { GROUND, WORLD_W } from './state.js';

export const LAYOUT = {
  width: WORLD_W,
  startX: 120,
  gate: { x: 2462, w: 86, h: 210 },
  sunpetal: { x: 2230, y: GROUND - 16 },
  hedges: [
    { x: 300, y: GROUND - 104, w: 64, h: 104, tone: 0 },
    { x: 690, y: GROUND - 96, w: 64, h: 96, tone: 1 },
    { x: 1120, y: GROUND - 112, w: 64, h: 112, tone: 0 },
    { x: 1612, y: GROUND - 92, w: 64, h: 92, tone: 1 },
    { x: 2318, y: GROUND - 100, w: 64, h: 100, tone: 0 },
  ],
  grass: [
    { x: 160, w: 140 },
    { x: 520, w: 132 },
    { x: 900, w: 128 },
    { x: 1290, w: 122 },
    { x: 1478, w: 118 },
    { x: 1800, w: 104 },
    { x: 2010, w: 92 },
    { x: 2196, w: 104 },
  ],
  shade: [
    { x: 452, rx: 148, ry: 54 },
    { x: 1032, rx: 132, ry: 48 },
    { x: 1582, rx: 142, ry: 52 },
    { x: 1920, rx: 126, ry: 46 },
  ],
  trees: [
    { x: 452, size: 1.0 },
    { x: 1032, size: 0.86 },
    { x: 1582, size: 0.96 },
    { x: 1920, size: 0.82 },
  ],
  beds: [
    { x: 64, w: 92, hue: 0 },
    { x: 392, w: 112, hue: 1 },
    { x: 812, w: 100, hue: 2 },
    { x: 1064, w: 92, hue: 3 },
    { x: 1350, w: 106, hue: 0 },
    { x: 1852, w: 100, hue: 2 },
    { x: 2150, w: 92, hue: 1 },
  ],
  seeds: [
    { x: 468, y: GROUND - 8 },
    { x: 1196, y: GROUND - 8 },
    { x: 1744, y: GROUND - 8 },
  ],
  // Each gardener walks between a and b on the lawn, pausing at the ends.
  guards: [
    { a: 372, b: 660, speed: 40, pause: 1.5, shirt: '#e2603f', name: 'Pip' },
    { a: 830, b: 1090, speed: 50, pause: 1.1, shirt: '#4f79c9', name: 'Moss' },
    { a: 1250, b: 1580, speed: 44, pause: 1.8, shirt: '#8b5ab8', name: 'Fern' },
    { a: 1740, b: 2170, speed: 54, pause: 1.2, shirt: '#3f9a7c', name: 'Bram' },
  ],
};

export function inGrass(x) {
  for (const patch of LAYOUT.grass) {
    if (x > patch.x && x < patch.x + patch.w) return patch;
  }
  return null;
}

export function inShade(x) {
  for (const zone of LAYOUT.shade) {
    if (Math.abs(x - zone.x) < zone.rx) return zone;
  }
  return null;
}
