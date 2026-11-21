// Every sound is synthesised with WebAudio on the spot: no files, no network.
// Footsteps are soft filtered ticks, the pebble a bright clink, suspicion a rising
// two-note sting, and the alarm a quick falling triad. M mutes the master gain.
export function createAudio() {
  let ctx = null;
  let master = null;
  let muted = false;
  let birdTimer = 4;

  function ensure() {
    if (ctx) return ctx;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.34;
    master.connect(ctx.destination);
    return ctx;
  }

  function tone(freq, dur, type, gain, slideTo, delay = 0) {
    if (!ensure() || muted) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    amp.gain.setValueAtTime(0.0001, t0);
    amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(amp).connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function noise(dur, gain, cutoff, delay = 0) {
    if (!ensure() || muted) return;
    const t0 = ctx.currentTime + delay;
    const frames = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    const amp = ctx.createGain();
    amp.gain.value = gain;
    src.connect(filter).connect(amp).connect(master);
    src.start(t0);
  }

  const sfx = {
    step(sprint) {
      noise(sprint ? 0.09 : 0.07, sprint ? 0.2 : 0.09, sprint ? 900 : 620);
      if (sprint) tone(96, 0.06, 'sine', 0.05);
    },
    throwPebble() {
      noise(0.08, 0.1, 1500);
    },
    clink() {
      tone(1480, 0.1, 'triangle', 0.14);
      tone(2210, 0.07, 'sine', 0.07, 1900, 0.02);
    },
    rising() {
      tone(330, 0.22, 'triangle', 0.08, 470);
    },
    alarm() {
      tone(740, 0.16, 'square', 0.1);
      tone(590, 0.18, 'square', 0.1, 520, 0.17);
      tone(440, 0.3, 'square', 0.09, 380, 0.35);
    },
    pickup() {
      tone(880, 0.12, 'sine', 0.12);
      tone(1320, 0.16, 'sine', 0.1, 1400, 0.07);
    },
    bloom() {
      [660, 830, 990, 1320].forEach((f, i) => tone(f, 0.3, 'triangle', 0.11, f * 1.01, i * 0.08));
    },
    win() {
      [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.42, 'triangle', 0.12, f, i * 0.13));
    },
    caught() {
      tone(300, 0.4, 'sawtooth', 0.1, 140);
      tone(150, 0.55, 'sine', 0.09, 80, 0.1);
    },
    bird() {
      const base = 1500 + Math.random() * 900;
      tone(base, 0.09, 'sine', 0.045, base * 1.35);
      tone(base * 1.25, 0.08, 'sine', 0.035, base * 1.6, 0.11);
    },
  };

  return {
    resume() {
      if (ensure() && ctx.state === 'suspended') ctx.resume();
    },
    play(type, value = 0) {
      if (muted) return;
      if (type === 'step') sfx.step(value > 0);
      else if (type === 'throw') sfx.throwPebble();
      else if (type === 'clink') sfx.clink();
      else if (type === 'alarm') sfx.alarm();
      else if (type === 'pickup') sfx.pickup();
      else if (type === 'bloom') sfx.bloom();
      else if (type === 'win') sfx.win();
      else if (type === 'caught') sfx.caught();
      else if (type === 'rising') sfx.rising();
    },
    tick(dt, suspicion) {
      if (muted || !ctx) return;
      birdTimer -= dt;
      if (birdTimer <= 0) {
        birdTimer = 6 + Math.random() * 9;
        sfx.bird();
      }
      if (suspicion > 30 && suspicion < 100 && Math.random() < dt * 1.4) sfx.rising();
    },
    setMuted(value) {
      muted = value;
      if (master) master.gain.value = muted ? 0 : 0.34;
    },
    get muted() {
      return muted;
    },
  };
}
