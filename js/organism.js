/**
 * ORGANISM — The Living Visual
 *
 * Polar harmonic shape that evolves from spore to entity.
 * Lens-influenced: color palette comes from the active lens.
 * Trail rendered with Catmull-Rom splines.
 *
 * Stages: Spore → Tendril → Bloom → Entity → Abyss
 */

const Organism = (function () {
  'use strict';

  const TWO_PI = Math.PI * 2;
  const ANGULAR_STEPS = 100;
  const TRAIL_MAX = 120;

  const STAGES = [
    { name: 'spore',   threshold: 0,   trailLen: 8,   glowAlpha: 0 },
    { name: 'tendril', threshold: 5,   trailLen: 30,  glowAlpha: 0.08 },
    { name: 'bloom',   threshold: 20,  trailLen: 60,  glowAlpha: 0.12 },
    { name: 'entity',  threshold: 60,  trailLen: 100, glowAlpha: 0.18 },
    { name: 'abyss',   threshold: 180, trailLen: 120, glowAlpha: 0.25 },
  ];

  // ── STATE ────────────────────────────────────────────────────────────

  let time = 0;
  let lifeForce = 0;
  let touchTime = 0;
  const seenGestures = new Set();
  const trail = [];
  const mutations = [];

  // DNA — organism genome, shaped by neurons
  const dna = {
    numArms: 3, armLength: 0.2, spikiness: 0, flowiness: 0,
    spiralness: 0, symmetry: 0, breathDepth: 0.3, intensity: 0,
    hue: 0, saturation: 0,
  };
  const dnaTarget = { ...dna };

  // Lens color parsed to HSL
  let lensHue = 0;
  let lensSat = 0;
  let lensLight = 50;

  // ── HELPERS ──────────────────────────────────────────────────────────

  function getStage() {
    for (let i = STAGES.length - 1; i >= 0; i--) {
      if (lifeForce >= STAGES[i].threshold) return i;
    }
    return 0;
  }

  function stageProgress() {
    const s = getStage();
    if (s >= STAGES.length - 1) return 1;
    const lo = STAGES[s].threshold;
    const hi = STAGES[s + 1].threshold;
    return Math.min(1, (lifeForce - lo) / (hi - lo));
  }

  function smoothDna(dt) {
    const rate = 1 - Math.exp(-2.5 * dt);
    for (const k in dna) dna[k] += (dnaTarget[k] - dna[k]) * rate;
  }

  function hsl(h, s, l, a) {
    s /= 100; l /= 100;
    const k = function (n) { return (n + h / 30) % 12; };
    const f = function (n) { return l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)); };
    return 'rgba(' + Math.round(f(0)*255) + ',' + Math.round(f(8)*255) + ',' + Math.round(f(4)*255) + ',' + a + ')';
  }

  function hexToHSL(hex) {
    if (!hex || hex === '#ffffff') { lensHue = 200; lensSat = 0; lensLight = 90; return; }
    let r = 0, g = 0, b = 0;
    if (hex.length === 7) {
      r = parseInt(hex.slice(1,3), 16) / 255;
      g = parseInt(hex.slice(3,5), 16) / 255;
      b = parseInt(hex.slice(5,7), 16) / 255;
    }
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    lensHue = h * 360;
    lensSat = s * 100;
    lensLight = l * 100;
  }

  // ── APPLY LENS ───────────────────────────────────────────────────────

  function applyLens(lens) {
    if (lens && lens.color) hexToHSL(lens.color);
  }

  // ── UPDATE ───────────────────────────────────────────────────────────

  function update(dt, posX, posY, width, height, brainState, touching) {
    time += dt;

    if (touching) touchTime += dt;

    const energy = brainState.energy;
    lifeForce = touchTime + energy * 2 + seenGestures.size * 3;

    // Read neuron rates
    const neurons = brainState.neurons;
    if (neurons) {
      const shake    = neurons.shake    ? neurons.shake.rate()    : 0;
      const sweep    = neurons.sweep    ? neurons.sweep.rate()    : 0;
      const circle   = neurons.circle   ? neurons.circle.rate()   : 0;
      const pendulum = neurons.pendulum ? neurons.pendulum.rate() : 0;
      const stillness= neurons.stillness? neurons.stillness.rate(): 0;

      if (shake > 0.5)    seenGestures.add('shake');
      if (sweep > 0.5)    seenGestures.add('sweep');
      if (circle > 0.5)   seenGestures.add('circle');
      if (pendulum > 0.5) seenGestures.add('pendulum');
      if (stillness > 0.5) seenGestures.add('stillness');

      dnaTarget.spikiness  = shake * 0.8;
      dnaTarget.flowiness  = sweep * 0.7;
      dnaTarget.spiralness = circle * 0.6;
      dnaTarget.symmetry   = pendulum * 0.5;
      dnaTarget.breathDepth= 0.3 + stillness * 0.5;
      dnaTarget.numArms    = 3 + shake * 4 + sweep * 2 + circle * 3;
      dnaTarget.armLength  = 0.2 + energy * 0.6 + (shake + sweep) * 0.15;
    }

    dnaTarget.intensity = Math.min(1, energy * 2);

    // Color: lens hue + drift from gesture variety
    const stage = getStage();
    dnaTarget.hue = lensHue + seenGestures.size * 20 + time * 2;
    dnaTarget.saturation = Math.max(lensSat, Math.min(70, 15 + stage * 12));

    // Mutations from brain spikes (called externally via addMutation)

    // Trail
    const px = posX * width;
    const py = posY * height;
    trail.push({ x: px, y: py, t: time });
    if (trail.length > TRAIL_MAX) trail.shift();

    smoothDna(dt);
  }

  function addMutation(surprise) {
    if (surprise < 0.5) return;
    mutations.push({
      time: time, freq: 5 + Math.random() * 10,
      amp: surprise * 0.3, decay: 3 + Math.random() * 4,
      phase: Math.random() * TWO_PI,
    });
    dnaTarget.hue += (Math.random() - 0.5) * 30;
  }

  // ── POLAR RADIUS ─────────────────────────────────────────────────────

  function polarRadius(theta, baseSize, t) {
    const stage = getStage();
    const prog = stageProgress();
    let r = baseSize;

    if (stage < 1 && prog < 0.3) {
      r += baseSize * 0.05 * Math.sin(t * 3);
      return r;
    }

    const gate = stage < 1 ? prog * 3 : 1;

    // 6 harmonics
    r += baseSize * dna.spikiness  * 0.4  * gate * Math.cos(dna.numArms * theta + t * 2);
    r += baseSize * dna.flowiness  * 0.35 * gate * Math.sin(2.3 * theta + t * 0.7);
    r += baseSize * dna.spiralness * 0.3  * gate * Math.cos(Math.PI * theta + t * 1.3);
    r += baseSize * dna.symmetry   * 0.25 * gate * Math.sin(1.5 * theta + 0.7 * t);
    r += baseSize * dna.breathDepth* 0.15 * Math.sin(t * 1.8);
    r += baseSize * dna.intensity  * 0.2  * Math.cos(3 * theta - t * 4);

    // Mutation ripples
    for (let i = mutations.length - 1; i >= 0; i--) {
      const m = mutations[i];
      const age = t - m.time;
      if (age > m.decay * 2) { mutations.splice(i, 1); continue; }
      r += baseSize * m.amp * Math.exp(-age / m.decay) * Math.sin(m.freq * theta + m.phase + t * 6);
    }

    return Math.max(baseSize * 0.3, r);
  }

  // ── CATMULL-ROM TRAIL ────────────────────────────────────────────────

  function catmull(p0, p1, p2, p3, t) {
    const t2 = t * t, t3 = t2 * t;
    return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
  }

  function drawTrail(ctx, stage) {
    const len = Math.min(trail.length, STAGES[stage].trailLen);
    if (len < 4) return;
    const start = trail.length - len;

    ctx.beginPath();
    for (let i = 0; i < len - 1; i++) {
      const idx = start + i;
      const p0 = trail[Math.max(start, idx - 1)];
      const p1 = trail[idx];
      const p2 = trail[Math.min(trail.length - 1, idx + 1)];
      const p3 = trail[Math.min(trail.length - 1, idx + 2)];

      for (let s = 0; s < 4; s++) {
        const t = s / 4;
        const x = catmull(p0.x, p1.x, p2.x, p3.x, t);
        const y = catmull(p0.y, p1.y, p2.y, p3.y, t);
        if (i === 0 && s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
    }

    const alpha = 0.08 + stage * 0.04;
    ctx.strokeStyle = stage >= 1 ? hsl(dna.hue % 360, dna.saturation, 60, alpha) : 'rgba(255,255,255,' + alpha + ')';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // ── DRAW ─────────────────────────────────────────────────────────────

  function draw(canvasCtx, x, y, w, h) {
    const stage = getStage();
    const energy = dna.intensity;
    const baseSize = 6 + energy * 20 + stage * 4;

    canvasCtx.save();

    // Trail
    drawTrail(canvasCtx, stage);

    // Glow
    if (stage >= 1) {
      const glowR = baseSize * (2.5 + energy * 2);
      const g = canvasCtx.createRadialGradient(x, y, 0, x, y, glowR);
      g.addColorStop(0, hsl(dna.hue % 360, dna.saturation, 55, STAGES[stage].glowAlpha));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      canvasCtx.fillStyle = g;
      canvasCtx.beginPath();
      canvasCtx.arc(x, y, glowR, 0, TWO_PI);
      canvasCtx.fill();
    }

    // Polar body
    canvasCtx.beginPath();
    for (let i = 0; i <= ANGULAR_STEPS; i++) {
      const theta = (i / ANGULAR_STEPS) * TWO_PI;
      const r = polarRadius(theta, baseSize, time);
      const px = x + Math.cos(theta) * r;
      const py = y + Math.sin(theta) * r;
      if (i === 0) canvasCtx.moveTo(px, py); else canvasCtx.lineTo(px, py);
    }
    canvasCtx.closePath();

    // Fill
    if (stage >= 1) {
      canvasCtx.fillStyle = hsl(dna.hue % 360, dna.saturation, 50, 0.06 + energy * 0.08);
    } else {
      canvasCtx.fillStyle = 'rgba(255,255,255,0.04)';
    }
    canvasCtx.fill();

    // Stroke
    const strokeA = 0.3 + energy * 0.4;
    canvasCtx.strokeStyle = stage >= 1 ? hsl(dna.hue % 360, dna.saturation, 70, strokeA) : 'rgba(255,255,255,' + strokeA + ')';
    canvasCtx.lineWidth = 1.5;
    canvasCtx.stroke();

    // Inner nodes (stage >= 2)
    if (stage >= 2) {
      const count = Math.min(7, 2 + stage);
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * TWO_PI + time * (0.5 + i * 0.13);
        const dist = baseSize * (0.4 + 0.2 * Math.sin(time * 1.7 + i));
        const nx = x + Math.cos(angle) * dist;
        const ny = y + Math.sin(angle) * dist;
        const ns = 1.5 + energy * 2;
        const na = 0.3 + 0.2 * Math.sin(time * 2.3 + i * 1.4);

        canvasCtx.fillStyle = hsl((dna.hue + i * 40) % 360, dna.saturation, 70, na);
        canvasCtx.beginPath();
        canvasCtx.arc(nx, ny, ns, 0, TWO_PI);
        canvasCtx.fill();
      }
    }

    // Core dot
    const coreSize = 2 + energy * 4;
    const coreAlpha = 0.5 + energy * 0.4 + 0.1 * Math.sin(time * 3);
    canvasCtx.fillStyle = 'rgba(255,255,255,' + coreAlpha + ')';
    canvasCtx.beginPath();
    canvasCtx.arc(x, y, coreSize, 0, TWO_PI);
    canvasCtx.fill();

    canvasCtx.restore();
  }

  // ── PUBLIC ───────────────────────────────────────────────────────────

  return Object.freeze({
    update: update,
    draw: draw,
    applyLens: applyLens,
    addMutation: addMutation,
    get stage() { return STAGES[getStage()].name; },
    get lifeForce() { return lifeForce; },
  });
})();
