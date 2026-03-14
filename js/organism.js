/**
 * ORGANISM — Golden Spiral Field
 *
 * Not a dot. Not an orb. A living field of particles
 * arranged along Fibonacci spiral arms. The math IS the beauty —
 * golden angle spacing means no two particles align the same way.
 *
 * Still = tight constellation, barely breathing.
 * Moving = particles expand along spiral paths, trailing light.
 * Touch = ripple perturbation through the field.
 *
 * The field follows your body position but it's not centered on you —
 * it radiates FROM you. You are the origin, not the subject.
 */

const Organism = (function () {
  'use strict';

  const TWO_PI = Math.PI * 2;
  const PHI = 1.6180339887;
  const GOLDEN_ANGLE = Math.PI * 2 * (1 - 1 / PHI);  // ~137.5° — the sunflower angle
  const PARTICLE_COUNT = 89;  // Fibonacci number
  const TRAIL_MAX = 80;

  // ── STATE ──────────────────────────────────────────────────────────

  let time = 0;
  let lifeForce = 0;
  let touchTime = 0;
  const seenGestures = new Set();
  const trail = [];

  // Smooth values
  let smoothEnergy = 0;
  let smoothSpread = 0.15;   // how far particles extend from origin
  let smoothBreath = 0;      // breathing phase
  let smoothRotation = 0;    // slow rotation of the whole field
  let touchRipple = 0;       // ripple from touch
  let touchRipplePhase = 0;

  // Lens color
  let lensHue = 0;
  let lensSat = 0;
  let lensLight = 50;

  // Per-particle persistent state (so they feel alive, not computed)
  const particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const fi = i * GOLDEN_ANGLE;  // golden angle position
    const fRadius = Math.sqrt(i / PARTICLE_COUNT);  // sunflower disk distribution
    particles.push({
      baseAngle: fi,
      baseRadius: fRadius,
      phase: Math.random() * TWO_PI,   // individual breathing offset
      drift: (Math.random() - 0.5) * 0.3,  // slight angular drift
      size: 0.5 + Math.random() * 1.0,
      brightness: 0.3 + Math.random() * 0.7,
      // Wander: each particle has a slow individual wander
      wanderX: 0, wanderY: 0,
      wanderVX: (Math.random() - 0.5) * 0.15,
      wanderVY: (Math.random() - 0.5) * 0.15,
    });
  }

  // ── HELPERS ────────────────────────────────────────────────────────

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

  // ── APPLY LENS ─────────────────────────────────────────────────────

  function applyLens(lens) {
    if (lens && lens.color) hexToHSL(lens.color);
  }

  // ── UPDATE ─────────────────────────────────────────────────────────

  function update(dt, posX, posY, width, height, brainState, touching) {
    time += dt;
    if (touching) touchTime += dt;

    const energy = brainState.energy || 0;
    lifeForce = touchTime + energy * 2 + seenGestures.size * 3;

    // Gesture tracking (for visual evolution)
    const neurons = brainState.neurons;
    if (neurons) {
      if (neurons.shake    && neurons.shake.rate()    > 0.5) seenGestures.add('shake');
      if (neurons.sweep    && neurons.sweep.rate()    > 0.5) seenGestures.add('sweep');
      if (neurons.circle   && neurons.circle.rate()   > 0.5) seenGestures.add('circle');
      if (neurons.pendulum && neurons.pendulum.rate() > 0.5) seenGestures.add('pendulum');
      if (neurons.stillness&& neurons.stillness.rate()> 0.5) seenGestures.add('stillness');
    }

    // Smooth energy — controls spread, brightness, particle size
    smoothEnergy += (energy - smoothEnergy) * (1 - Math.exp(-3 * dt));

    // Spread: still = tight cluster, energy = expanding field
    const targetSpread = 0.06 + Math.min(0.5, smoothEnergy * 0.35) + seenGestures.size * 0.02;
    smoothSpread += (targetSpread - smoothSpread) * (1 - Math.exp(-1.5 * dt));

    // Breathing: φ-driven frequencies that NEVER exactly loop
    // Two oscillators at ratio φ:1 = infinite variation
    const breathRate = 0.4 + smoothEnergy * 0.8;
    smoothBreath += dt * breathRate;

    // Field rotation: φ speed ratio — the spiral itself turns at golden time
    smoothRotation += dt * (0.03 + smoothEnergy * 0.12) * (1 / PHI);

    // Touch ripple
    if (touching && touchRipple < 0.5) {
      touchRipple = Math.min(1, touchRipple + dt * 3);
    } else {
      touchRipple *= Math.exp(-2 * dt);
    }
    touchRipplePhase += dt * 8;

    // Particle wander (slow brownian drift so they feel alive)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i];
      p.wanderX += p.wanderVX * dt;
      p.wanderY += p.wanderVY * dt;
      // Gentle spring back so they don't wander too far
      p.wanderVX -= p.wanderX * 0.5 * dt;
      p.wanderVY -= p.wanderY * 0.5 * dt;
      // Slight random perturbation
      p.wanderVX += (Math.random() - 0.5) * 0.4 * dt;
      p.wanderVY += (Math.random() - 0.5) * 0.4 * dt;
    }

    // Trail
    const px = posX * width;
    const py = posY * height;
    trail.push({ x: px, y: py, t: time });
    if (trail.length > TRAIL_MAX) trail.shift();
  }

  function addMutation(surprise) {
    if (surprise < 0.3) return;
    // Mutations perturb all particles outward briefly
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i];
      const angle = p.baseAngle + smoothRotation;
      p.wanderVX += Math.cos(angle) * surprise * 0.8;
      p.wanderVY += Math.sin(angle) * surprise * 0.8;
    }
  }

  // ── DRAW ───────────────────────────────────────────────────────────

  function draw(canvasCtx, x, y, w, h) {
    const minDim = Math.min(w, h);
    const fieldScale = minDim * smoothSpread;

    // Evolving hue: lens base + slow drift from gesture variety
    const hueBase = lensHue + seenGestures.size * 15 + time * 1.5;

    canvasCtx.save();

    // ── TRAIL: thin, fading path showing where you've been ──
    if (trail.length > 3) {
      const tLen = Math.min(trail.length, 40 + Math.floor(smoothEnergy * 40));
      const tStart = trail.length - tLen;
      canvasCtx.beginPath();
      canvasCtx.moveTo(trail[tStart].x, trail[tStart].y);
      for (let i = tStart + 1; i < trail.length; i++) {
        canvasCtx.lineTo(trail[i].x, trail[i].y);
      }
      const trailAlpha = 0.04 + smoothEnergy * 0.06;
      canvasCtx.strokeStyle = hsl(hueBase % 360, Math.max(lensSat, 20), 60, trailAlpha);
      canvasCtx.lineWidth = 1;
      canvasCtx.stroke();
    }

    // ── PARTICLES: golden spiral field ──
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i];

      // Golden spiral position
      const angle = p.baseAngle + smoothRotation + p.drift * smoothEnergy;
      const baseR = p.baseRadius * fieldScale;

      // Breathing: TWO φ-ratio oscillators per particle = never repeats
      const breath = Math.sin(smoothBreath * TWO_PI + p.phase) * 0.08
                   + Math.sin(smoothBreath * TWO_PI * PHI + p.phase * PHI) * 0.06;

      // Touch ripple: concentric wave radiating outward
      const rippleOffset = touchRipple * 8 * Math.sin(
        touchRipplePhase - p.baseRadius * 12
      ) * (1 - p.baseRadius);  // stronger near center

      const r = baseR * (1 + breath) + rippleOffset + p.wanderX * 3;

      const px = x + Math.cos(angle) * r + p.wanderX * fieldScale * 0.3;
      const py = y + Math.sin(angle) * r + p.wanderY * fieldScale * 0.3;

      // Size: inner particles smaller (tighter), outer bigger
      // Energy makes everything grow
      const baseSize = p.size * (0.4 + p.baseRadius * 0.8);
      const sz = baseSize * (1 + smoothEnergy * 1.5);

      // Alpha: inner particles brighter, outer particles dimmer
      // Energy brings outer particles to life
      const innerBright = 1 - p.baseRadius * 0.6;
      const energyBright = smoothEnergy * p.baseRadius;
      let alpha = (innerBright + energyBright) * p.brightness;
      alpha *= 0.15 + smoothEnergy * 0.35;  // globally dimmer when still
      alpha = Math.max(0.02, Math.min(0.6, alpha));

      // Hue shifts along the spiral — golden angle in color space too
      const hue = (hueBase + i * 2.5) % 360;
      const sat = Math.max(lensSat, 15 + smoothEnergy * 25);
      const light = 55 + p.brightness * 15;

      // Draw particle
      canvasCtx.fillStyle = hsl(hue, sat, light, alpha);
      canvasCtx.beginPath();
      canvasCtx.arc(px, py, sz, 0, TWO_PI);
      canvasCtx.fill();

      // Glow on brighter particles (inner ones, or during high energy)
      if (alpha > 0.2 && sz > 1.2) {
        const glowR = sz * 3;
        const g = canvasCtx.createRadialGradient(px, py, 0, px, py, glowR);
        g.addColorStop(0, hsl(hue, sat, light, alpha * 0.3));
        g.addColorStop(1, 'rgba(0,0,0,0)');
        canvasCtx.fillStyle = g;
        canvasCtx.beginPath();
        canvasCtx.arc(px, py, glowR, 0, TWO_PI);
        canvasCtx.fill();
      }
    }

    // ── ORIGIN POINT: barely-there, almost invisible ──
    // Not a "dot" — a faint warmth at the center of the field
    const originAlpha = 0.08 + smoothEnergy * 0.15;
    const originR = 2 + smoothEnergy * 3;
    const og = canvasCtx.createRadialGradient(x, y, 0, x, y, originR * 4);
    og.addColorStop(0, hsl(hueBase % 360, Math.max(lensSat, 20), 70, originAlpha));
    og.addColorStop(1, 'rgba(0,0,0,0)');
    canvasCtx.fillStyle = og;
    canvasCtx.beginPath();
    canvasCtx.arc(x, y, originR * 4, 0, TWO_PI);
    canvasCtx.fill();

    canvasCtx.restore();
  }

  // ── PUBLIC ─────────────────────────────────────────────────────────

  return Object.freeze({
    update: update,
    draw: draw,
    applyLens: applyLens,
    addMutation: addMutation,
    get stage() {
      if (lifeForce > 180) return 'abyss';
      if (lifeForce > 60) return 'entity';
      if (lifeForce > 20) return 'bloom';
      if (lifeForce > 5) return 'tendril';
      return 'spore';
    },
    get lifeForce() { return lifeForce; },
  });
})();
