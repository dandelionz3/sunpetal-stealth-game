// All art is canvas vector drawing: sky, sun, clouds, hills, lawn, beds, trees,
// hedges, the gate, the gardeners and Wren. Draw order is back to front, with
// vision cones painted under the hedges so a hedge visibly cuts a guard's sight.
import { VIEW_W, VIEW_H, GROUND, CONE_LEN, CONE_HALF, clamp } from './state.js';
import { LAYOUT } from './levels.js';
import { eyeOf, coneAngle } from './vision.js';
import { MODE_ALERTED } from './guards.js';

const SKY_TOP = '#7fc9ee';
const SKY_LOW = '#e6f6ff';
const LAWN_TOP = '#8cc95a';
const LAWN_LOW = '#5d9b3e';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = VIEW_W;
  canvas.height = VIEW_H;
  const clouds = [
    { x: 120, y: 118, s: 1.0, v: 5 },
    { x: 560, y: 78, s: 0.74, v: 3.4 },
    { x: 900, y: 150, s: 1.16, v: 4.2 },
    { x: 1400, y: 96, s: 0.9, v: 6 },
    { x: 1750, y: 168, s: 0.7, v: 3 },
  ];

  function draw(state, dt) {
    const cam = state.camera.x;
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    drawSky(state, cam);
    drawHills(cam);
    drawTreeLine(cam);
    drawTrees(cam);
    drawShade(cam);
    drawLawn(state, cam);
    drawBeds(cam);
    drawGate(state, cam);
    drawCones(state, cam);
    drawHedges(cam);
    drawPickups(state, cam);
    drawStones(state, cam);
    drawGuards(state, cam);
    drawGrass(state, cam, false);
    drawWren(state, cam);
    drawGrass(state, cam, true);
    drawFx(state, cam);
    drawVignette(state);
  }

  function drawSky(state, cam) {
    const g = ctx.createLinearGradient(0, 0, 0, GROUND);
    g.addColorStop(0, SKY_TOP);
    g.addColorStop(0.62, '#b8e4f7');
    g.addColorStop(1, SKY_LOW);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, GROUND + 4);

    const sunX = 1080 - cam * 0.04;
    const sunY = 108;
    ctx.save();
    ctx.translate(sunX, sunY);
    ctx.rotate(state.time * 0.04);
    ctx.fillStyle = 'rgba(255,236,150,0.20)';
    for (let i = 0; i < 12; i += 1) {
      ctx.rotate(Math.PI / 6);
      ctx.beginPath();
      ctx.moveTo(-7, -20);
      ctx.lineTo(7, -20);
      ctx.lineTo(0, -122);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    const glow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 92);
    glow.addColorStop(0, 'rgba(255,250,214,0.95)');
    glow.addColorStop(0.55, 'rgba(255,236,150,0.35)');
    glow.addColorStop(1, 'rgba(255,236,150,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 92, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff8cf';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 38, 0, Math.PI * 2);
    ctx.fill();

    for (const cloud of clouds) {
      const x = ((cloud.x + state.time * cloud.v - cam * 0.12) % 1800 + 1800) % 1800 - 220;
      drawCloud(x, cloud.y, cloud.s);
    }
  }

  function drawCloud(x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.arc(34, -10, 38, 0, Math.PI * 2);
    ctx.arc(74, 2, 26, 0, Math.PI * 2);
    ctx.arc(38, 16, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(206,236,248,0.55)';
    ctx.beginPath();
    ctx.ellipse(38, 22, 52, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawHills(cam) {
    ctx.fillStyle = '#a9d7b0';
    ctx.beginPath();
    ctx.moveTo(0, 500);
    for (let x = 0; x <= VIEW_W + 120; x += 120) {
      const px = x - ((cam * 0.18) % 240);
      ctx.quadraticCurveTo(px + 60, 418 + ((x / 120) % 2) * 26, px + 120, 500);
    }
    ctx.lineTo(VIEW_W, 560);
    ctx.lineTo(0, 560);
    ctx.fill();
    ctx.fillStyle = '#8fc79b';
    ctx.beginPath();
    ctx.moveTo(0, 532);
    for (let x = 0; x <= VIEW_W + 160; x += 160) {
      const px = x - ((cam * 0.3) % 320);
      ctx.quadraticCurveTo(px + 80, 474 + ((x / 160) % 2) * 18, px + 160, 532);
    }
    ctx.lineTo(VIEW_W, 580);
    ctx.lineTo(0, 580);
    ctx.fill();
  }

  function drawTreeLine(cam) {
    ctx.fillStyle = '#4f8a52';
    for (let i = 0; i < 22; i += 1) {
      const x = i * 128 - ((cam * 0.42) % 128) - 60;
      const h = 46 + ((i * 31) % 30);
      ctx.beginPath();
      ctx.arc(x, 528, h, Math.PI, 0);
      ctx.fill();
    }
    ctx.fillStyle = '#3f7a46';
    ctx.fillRect(0, 524, VIEW_W, 46);
  }

  function drawTrees(cam) {
    for (const tree of LAYOUT.trees) {
      const x = tree.x - cam;
      if (x < -240 || x > VIEW_W + 240) continue;
      const s = tree.size;
      ctx.save();
      ctx.translate(x, GROUND);
      ctx.scale(s, s);
      ctx.fillStyle = '#8a6242';
      ctx.fillRect(-13, -212, 26, 214);
      ctx.fillStyle = '#a97a51';
      ctx.fillRect(-13, -212, 9, 214);
      ctx.strokeStyle = '#6d4b33';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(0, -160);
      ctx.lineTo(-44, -206);
      ctx.moveTo(0, -186);
      ctx.lineTo(46, -226);
      ctx.stroke();
      const canopy = [
        [0, -268, 92],
        [-64, -232, 62],
        [62, -236, 66],
        [-28, -300, 58],
        [34, -304, 54],
      ];
      for (const [cx, cy, r] of canopy) {
        ctx.fillStyle = '#4d8f45';
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      for (const [cx, cy, r] of canopy) {
        ctx.fillStyle = 'rgba(126,186,92,0.85)';
        ctx.beginPath();
        ctx.arc(cx - r * 0.22, cy - r * 0.26, r * 0.66, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawShade(cam) {
    for (const zone of LAYOUT.shade) {
      const x = zone.x - cam;
      if (x < -240 || x > VIEW_W + 240) continue;
      const g = ctx.createRadialGradient(x, GROUND + 8, 10, x, GROUND + 8, zone.rx);
      g.addColorStop(0, 'rgba(38,74,44,0.34)');
      g.addColorStop(1, 'rgba(38,74,44,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, GROUND + 10, zone.rx, zone.ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawLawn(state, cam) {
    const g = ctx.createLinearGradient(0, GROUND - 6, 0, VIEW_H);
    g.addColorStop(0, LAWN_TOP);
    g.addColorStop(1, LAWN_LOW);
    ctx.fillStyle = g;
    ctx.fillRect(0, GROUND, VIEW_W, VIEW_H - GROUND);

    ctx.save();
    ctx.globalAlpha = 0.13;
    ctx.fillStyle = '#f2f7d8';
    const offset = -(cam % 120);
    for (let x = offset - 120; x < VIEW_W + 120; x += 120) {
      ctx.beginPath();
      ctx.moveTo(x, GROUND);
      ctx.lineTo(x + 54, GROUND);
      ctx.lineTo(x + 96, VIEW_H);
      ctx.lineTo(x + 24, VIEW_H);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    ctx.fillStyle = '#cdbb9a';
    ctx.fillRect(0, GROUND + 48, VIEW_W, 56);
    ctx.fillStyle = '#dccbaa';
    for (let i = 0; i < 40; i += 1) {
      const x = i * 78 - (cam % 78) - 40;
      const w = 44 + ((i * 17) % 18);
      ctx.beginPath();
      ctx.ellipse(x, GROUND + 76, w, 15, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(0, GROUND + 46, VIEW_W, 3);
  }

  function drawBeds(cam) {
    const hues = ['#f2778f', '#f4b93e', '#b98be8', '#f0f0f5'];
    for (const bed of LAYOUT.beds) {
      const x = bed.x - cam;
      if (x < -200 || x > VIEW_W + 200) continue;
      ctx.fillStyle = '#7a5a3c';
      roundRect(x, GROUND + 44, bed.w, 20, 8);
      ctx.fill();
      ctx.fillStyle = '#6b4c31';
      roundRect(x + 4, GROUND + 58, bed.w - 8, 8, 4);
      ctx.fill();
      const n = Math.floor(bed.w / 16);
      for (let i = 0; i < n; i += 1) {
        const fx = x + 10 + i * 15;
        const fy = GROUND + 38 - (i % 3) * 5;
        ctx.strokeStyle = '#4f8b3c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(fx, GROUND + 50);
        ctx.lineTo(fx, fy);
        ctx.stroke();
        ctx.fillStyle = hues[(i + bed.hue) % hues.length];
        for (let p = 0; p < 5; p += 1) {
          const a = (p / 5) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(fx + Math.cos(a) * 3.4, fy + Math.sin(a) * 3.4, 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#ffe28a';
        ctx.beginPath();
        ctx.arc(fx, fy, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawGate(state, cam) {
    const x = LAYOUT.gate.x - cam;
    if (x < -160 || x > VIEW_W + 200) return;
    const g = LAYOUT.gate;
    ctx.fillStyle = '#b9b2a4';
    ctx.fillRect(x - 26, GROUND - g.h, 30, g.h);
    ctx.fillRect(x + g.w - 4, GROUND - g.h, 30, g.h);
    ctx.fillStyle = '#cdc6b7';
    ctx.fillRect(x - 26, GROUND - g.h, 9, g.h);
    ctx.fillRect(x + g.w - 4, GROUND - g.h, 9, g.h);
    ctx.strokeStyle = '#8f897c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 26, GROUND - g.h + 6);
    ctx.quadraticCurveTo(x + g.w / 2, GROUND - g.h - 76, x + g.w + 26, GROUND - g.h + 6);
    ctx.stroke();
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#a8a193';
    ctx.beginPath();
    ctx.moveTo(x - 22, GROUND - g.h + 2);
    ctx.quadraticCurveTo(x + g.w / 2, GROUND - g.h - 68, x + g.w + 22, GROUND - g.h + 2);
    ctx.stroke();

    ctx.fillStyle = '#3d4b42';
    for (let i = 0; i < 7; i += 1) ctx.fillRect(x + 6 + i * 10, GROUND - g.h + 22, 3, g.h - 22);
    ctx.fillRect(x + 2, GROUND - g.h + 40, g.w - 4, 4);
    ctx.fillRect(x + 2, GROUND - 20, g.w - 4, 4);
    ctx.fillStyle = '#ffe9a0';
    ctx.beginPath();
    ctx.arc(x + g.w / 2, GROUND - g.h + 28, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = 'bold 13px Georgia, serif';
    ctx.fillStyle = '#5c5648';
    ctx.textAlign = 'center';
    ctx.fillText('GARDEN GATE', x + g.w / 2, GROUND - g.h - 84);
    if (state.hasPetal) {
      const glow = ctx.createRadialGradient(x + g.w / 2, GROUND - 40, 4, x + g.w / 2, GROUND - 40, 70);
      glow.addColorStop(0, 'rgba(255,236,150,0.55)');
      glow.addColorStop(1, 'rgba(255,236,150,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x + g.w / 2, GROUND - 40, 70, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawCones(state, cam) {
    for (const guard of state.guards) {
      const eye = eyeOf(guard);
      const x = eye.x - cam;
      if (x < -CONE_LEN - 60 || x > VIEW_W + CONE_LEN + 60) continue;
      const a = coneAngle(guard);
      const pct = guard.suspicion;
      const hot = guard.mode === MODE_ALERTED || pct >= 100;
      const warm = pct >= 50;
      const inner = hot ? 'rgba(255,96,86,0.34)' : warm ? 'rgba(255,158,70,0.32)' : 'rgba(255,232,120,0.30)';
      const g = ctx.createRadialGradient(x, eye.y, 14, x, eye.y, CONE_LEN);
      g.addColorStop(0, inner);
      g.addColorStop(0.72, warm || hot ? inner : 'rgba(255,232,120,0.14)');
      g.addColorStop(1, hot ? 'rgba(255,96,86,0)' : warm ? 'rgba(255,158,70,0)' : 'rgba(255,232,120,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x, eye.y);
      ctx.arc(x, eye.y, CONE_LEN, a - CONE_HALF, a + CONE_HALF);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = hot ? 'rgba(255,110,96,0.55)' : warm ? 'rgba(255,166,72,0.5)' : 'rgba(255,226,110,0.42)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x, eye.y);
      ctx.lineTo(x + Math.cos(a - CONE_HALF) * CONE_LEN, eye.y + Math.sin(a - CONE_HALF) * CONE_LEN);
      ctx.moveTo(x, eye.y);
      ctx.lineTo(x + Math.cos(a + CONE_HALF) * CONE_LEN, eye.y + Math.sin(a + CONE_HALF) * CONE_LEN);
      ctx.stroke();
    }
  }

  function drawHedges(cam) {
    for (const hedge of LAYOUT.hedges) {
      const x = hedge.x - cam;
      if (x < -140 || x > VIEW_W + 140) continue;
      const top = hedge.y;
      const dark = hedge.tone === 0 ? '#2f6b3d' : '#356f3a';
      const light = hedge.tone === 0 ? '#4f9152' : '#589a54';
      ctx.fillStyle = dark;
      roundRect(x, top + 12, hedge.w, hedge.h - 12, 12);
      ctx.fill();
      ctx.fillStyle = light;
      for (let i = 0; i < hedge.w; i += 13) {
        const r = 12 + ((i * 7) % 8);
        ctx.beginPath();
        ctx.arc(x + i + 6, top + 14 + ((i * 5) % 9), r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(180,222,140,0.55)';
      for (let i = 0; i < hedge.w; i += 19) {
        ctx.beginPath();
        ctx.arc(x + i + 8, top + 16 + ((i * 3) % 8), 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(20,48,28,0.28)';
      ctx.fillRect(x + 4, top + hedge.h - 14, hedge.w - 8, 12);
    }
  }

  function drawPickups(state, cam) {
    for (const seed of state.seeds) {
      if (seed.taken) continue;
      const x = seed.x - cam;
      if (x < -60 || x > VIEW_W + 60) continue;
      const bob = Math.sin(state.time * 3 + seed.bob) * 3;
      ctx.fillStyle = 'rgba(255,236,150,0.22)';
      ctx.beginPath();
      ctx.arc(x, seed.y - 16 + bob, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e8d49a';
      roundRect(x - 7, seed.y - 22 + bob, 14, 16, 3);
      ctx.fill();
      ctx.fillStyle = '#b79a5c';
      ctx.fillRect(x - 7, seed.y - 17 + bob, 14, 3);
      ctx.strokeStyle = '#7fa35a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 1, seed.y - 22 + bob);
      ctx.quadraticCurveTo(x + 8, seed.y - 30 + bob, x + 12, seed.y - 26 + bob);
      ctx.stroke();
    }
    const petal = state.petal;
    if (!petal || petal.taken) return;
    const x = petal.x - cam;
    if (x < -80 || x > VIEW_W + 80) return;
    const bob = Math.sin(state.time * 2.2) * 4;
    const glow = ctx.createRadialGradient(x, petal.y - 34 + bob, 4, x, petal.y - 34 + bob, 62);
    glow.addColorStop(0, 'rgba(255,232,120,0.6)');
    glow.addColorStop(1, 'rgba(255,232,120,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, petal.y - 34 + bob, 62, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#4e8b3c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, petal.y);
    ctx.quadraticCurveTo(x + 4, petal.y - 18, x, petal.y - 26 + bob);
    ctx.stroke();
    ctx.fillStyle = '#ffd24a';
    for (let i = 0; i < 9; i += 1) {
      const a = (i / 9) * Math.PI * 2 + state.time * 0.4;
      ctx.beginPath();
      ctx.ellipse(x + Math.cos(a) * 12, petal.y - 34 + bob + Math.sin(a) * 12, 8, 5, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#fff3b0';
    ctx.beginPath();
    ctx.arc(x, petal.y - 34 + bob, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawStones(state, cam) {
    ctx.fillStyle = '#8d8577';
    for (const stone of state.stones) {
      const x = stone.x - cam;
      ctx.beginPath();
      ctx.ellipse(x, stone.y, 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawGuards(state, cam) {
    for (const guard of state.guards) {
      const x = guard.x - cam;
      if (x < -100 || x > VIEW_W + 100) continue;
      drawGuard(guard, x, state.time);
    }
  }

  function drawGuard(guard, x, time) {
    const moving = guard.mode !== 'patrol' || guard.wait <= 0;
    const bob = moving ? Math.abs(Math.sin(time * 7 + guard.id)) * 2.2 : 0;
    const face = guard.facing;
    ctx.save();
    ctx.translate(x, GROUND - bob);
    ctx.fillStyle = 'rgba(30,52,30,0.22)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 20, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#4a3f36';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    const swing = moving ? Math.sin(time * 7 + guard.id) * 6 : 0;
    ctx.beginPath();
    ctx.moveTo(-4, -20);
    ctx.lineTo(-6 + swing, 0);
    ctx.moveTo(5, -20);
    ctx.lineTo(7 - swing, 0);
    ctx.stroke();
    ctx.fillStyle = '#3a3129';
    ctx.beginPath();
    ctx.ellipse(-7 + swing, 0, 7, 3.5, 0, 0, Math.PI * 2);
    ctx.ellipse(8 - swing, 0, 7, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = guard.shirt;
    roundRect(-11, -52, 23, 34, 8);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    roundRect(-8, -50, 7, 30, 4);
    ctx.fill();

    ctx.fillStyle = '#f3e6c8';
    roundRect(-8, -34, 18, 26, 5);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(-8, -22, 18, 2);

    ctx.strokeStyle = guard.shirt;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-9, -46);
    ctx.lineTo(-15 - face * 2, -30 + (moving ? Math.sin(time * 7) * 3 : 0));
    ctx.moveTo(10, -46);
    ctx.lineTo(15 + face * 2, -32 - (moving ? Math.sin(time * 7) * 3 : 0));
    ctx.stroke();

    ctx.fillStyle = '#f0c9a0';
    ctx.beginPath();
    ctx.arc(0, -62, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a2a20';
    ctx.beginPath();
    ctx.arc(face * 3.5, -63, 1.7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f0d07a';
    ctx.beginPath();
    ctx.ellipse(0, -70, 26, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e3bd5f';
    ctx.beginPath();
    ctx.ellipse(0, -74, 13, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c9a34a';
    ctx.fillRect(-13, -73, 26, 3);

    if (guard.mode === MODE_ALERTED) {
      ctx.fillStyle = '#e8443a';
      ctx.font = 'bold 22px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', 0, -96 + Math.sin(time * 12) * 2);
    } else if (guard.suspicion > 25) {
      ctx.fillStyle = guard.suspicion >= 50 ? '#e58a2f' : '#c9a53a';
      ctx.font = 'bold 20px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', 0, -96);
    }
    ctx.restore();
  }

  function drawWren(state, cam) {
    const p = state.player;
    const x = p.x - cam;
    if (x < -80 || x > VIEW_W + 80) return;
    const crouch = p.crouch;
    const h = crouch ? 36 : 58;
    const walk = p.moving && !crouch ? Math.sin(p.anim * 3.4) : 0;
    const bob = p.moving ? Math.abs(Math.sin(p.anim * 3.4)) * 2 : 0;

    // A soft green ring while she is hidden in grass or shade, amber in the open.
    const safe = p.hidden || p.inShade;
    const halo = ctx.createRadialGradient(x, GROUND - 6, 4, x, GROUND - 6, 46);
    halo.addColorStop(0, safe ? 'rgba(150,226,120,0.34)' : 'rgba(255,226,140,0.16)');
    halo.addColorStop(1, 'rgba(150,226,120,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.ellipse(x, GROUND - 6, 46, 26, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(x, GROUND - bob);
    ctx.fillStyle = 'rgba(28,48,30,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 2, crouch ? 17 : 15, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#4a3b2c';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-3, -h * 0.34);
    ctx.lineTo(-4 + walk * 5, 0);
    ctx.moveTo(4, -h * 0.34);
    ctx.lineTo(5 - walk * 5, 0);
    ctx.stroke();
    ctx.fillStyle = '#5c4630';
    ctx.beginPath();
    ctx.ellipse(-5 + walk * 5, 0, 6, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(6 - walk * 5, 0, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#3f7f6d';
    roundRect(-11, -h + 12, 22, h * 0.56, 7);
    ctx.fill();
    ctx.fillStyle = '#356e5e';
    roundRect(-11, -h + 12, 8, h * 0.56, 6);
    ctx.fill();
    ctx.fillStyle = '#c9a05f';
    roundRect(-15, -h + 20, 8, 12, 3);
    ctx.fill();

    const headY = -h + 4;
    ctx.fillStyle = '#f2cba4';
    ctx.beginPath();
    ctx.arc(0, headY, 9.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7d5a3c';
    ctx.beginPath();
    ctx.arc(0, headY - 1, 9.6, Math.PI * 1.02, Math.PI * 2.02);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-p.facing * 6, headY + 2, 4, 6, p.facing * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4a3220';
    ctx.beginPath();
    ctx.arc(p.facing * 4, headY + 1, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#a8cf6a';
    ctx.beginPath();
    ctx.ellipse(-p.facing * 7, headY - 9, 6, 3.4, -p.facing * 0.6, 0, Math.PI * 2);
    ctx.fill();

    if (p.throwArm > 0) {
      ctx.strokeStyle = '#f2cba4';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(8, -h + 20);
      ctx.lineTo(16, -h + 12);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Grass is drawn in two passes: the bulk behind Wren, then a few front blades
  // over her feet, so a crouching Wren reads as inside the patch, not erased by it.
  function drawGrass(state, cam, front) {
    for (const patch of LAYOUT.grass) {
      const x = patch.x - cam;
      if (x < -180 || x > VIEW_W + 180) continue;
      const base = GROUND + 4;
      if (!front) {
        ctx.fillStyle = 'rgba(58,110,48,0.32)';
        ctx.beginPath();
        ctx.ellipse(x + patch.w / 2, base + 2, patch.w / 2, 8, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let i = 0; i < patch.w; i += 6) {
        const isFront = i % 18 >= 9;
        if (isFront !== front) continue;
        const gx = x + i;
        const sway = Math.sin(state.time * 1.8 + i * 0.14) * 3.4;
        const hh = 34 + ((i * 13) % 18);
        ctx.strokeStyle = front ? 'rgba(84,148,66,0.85)' : i % 18 < 9 ? '#4d8f3e' : '#69ab4c';
        ctx.lineWidth = front ? 2 : 2.4;
        ctx.beginPath();
        ctx.moveTo(gx, base);
        ctx.quadraticCurveTo(gx + sway * 0.4, base - hh * 0.6, gx + sway, base - hh);
        ctx.stroke();
      }
      if (!front) {
        ctx.fillStyle = 'rgba(140,196,96,0.5)';
        for (let i = 4; i < patch.w; i += 15) {
          ctx.beginPath();
          ctx.ellipse(x + i, base - 30 - ((i * 7) % 8), 3, 7, 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  function drawFx(state, cam) {
    for (const ring of state.fx.rings) {
      const k = 1 - ring.life / ring.max;
      const r = ring.r0 + (ring.r1 - ring.r0) * k;
      ctx.strokeStyle = ring.color;
      ctx.globalAlpha = Math.max(0, 1 - k) * 0.9;
      ctx.lineWidth = 3 - k * 2;
      ctx.beginPath();
      ctx.ellipse(ring.x - cam, ring.y, r, r * 0.42, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    for (const part of state.fx.parts) {
      const k = part.life / part.max;
      ctx.save();
      ctx.globalAlpha = clamp(k, 0, 1);
      ctx.translate(part.x - cam, part.y);
      ctx.rotate(part.rot);
      ctx.fillStyle = part.color;
      if (part.shape === 'petal') {
        ctx.beginPath();
        ctx.ellipse(0, 0, part.size * 1.5, part.size * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, part.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    for (const text of state.fx.texts) {
      ctx.globalAlpha = clamp(text.life / text.max, 0, 1);
      ctx.fillStyle = text.color;
      ctx.font = 'bold 17px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(text.text, text.x - cam, text.y);
      ctx.globalAlpha = 1;
    }
  }

  function drawVignette(state) {
    if (state.suspicion <= 40) return;
    const a = clamp((state.suspicion - 40) / 60, 0, 1) * 0.34;
    const g = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, 300, VIEW_W / 2, VIEW_H / 2, 760);
    g.addColorStop(0, 'rgba(255,80,60,0)');
    g.addColorStop(1, `rgba(220,50,40,${a})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  function roundRect(x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  return { draw };
}
