/**
 * ORGANISM — Golden Spiral Field
 *
 * 89 particles (Fibonacci) at golden angle spacing.
 * Sunflower disk distribution. φ drives space, time, and color.
 *
 * Always orbiting — even at rest the field slowly turns,
 * particles weave in DNA-like helical paths.
 * Energy expands the field and brightens, but never starts it.
 * Colors muted — desaturated, soft, felt more than seen.
 */

const Organism = (function () {
  'use strict';

  const TWO_PI = Math.PI * 2;
  const PHI = 1.6180339887;
  const GOLDEN_ANGLE = TWO_PI * (1 - 1 / PHI);  // ~137.5°
  const PARTICLE_COUNT = 89;  // Fibonacci
  const TRAIL_MAX = 80;

  // ── STATE ──────────────────────────────────────────────────────────

  let time = 0;
  let lifeForce = 0;
  let touchTime = 0;
  const seenGestures = new Set();
  const trail = [];

  let smoothEnergy = 0;
  let smoothSpread = 0.15;
  let smoothBreath = 0;
  let smoothRotation = 0;
  let touchRipple = 0;
  let touchRipplePhase = 0;

  let lensHue = 0;
  let lensSat = 0;
  let lensLight = 50;

  // Per-particle persistent state
  const particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const fi = i * GOLDEN_ANGLE;
    const fRadius = Math.sqrt(i / PARTICLE_COUNT);
    particles.push({
      baseAngle: fi,
      baseRadius: fRadius,
      phase: i * GOLDEN_ANGLE * 0.618,  // φ-spaced phase offsets (never align)
      drift: (Math.random() - 0.5) * 0.3,
      size: 0.3 + Math.random() * 0.6,  // smaller range
      brightness: 0.3 + Math.random() * 0.7,
      // Orbit: individual speed + direction
      orbitSpeed: 0.4 + (i % 13) * 0.06,
      orbitDir: (i % 3 === 0) ? -1 : 1,
      // DNA helix: perpendicular oscillation
      helixAmp: 0.1 + (i % 8) * 0.04,
      // Wander
      wanderX: 0, wanderY: 0,
      wanderVX: (Math.random() - 0.5) * 0.12,
      wanderVY: (Math.random() - 0.5) * 0.12,
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

  function applyLens(lens) {
    if (lens && lens.color) hexToHSL(lens.color);
  }

  // ── UPDATE ─────────────────────────────────────────────────────────

  function update(dt, posX, posY, width, height, brainState, touching) {
    time += dt;
    if (touching) touchTime += dt;

    const energy = brainState.energy || 0;
    lifeForce = touchTime + energy * 2 + seenGestures.size * 3;

    const neurons = brainState.neurons;
    if (neurons) {
      if (neurons.shake    && neurons.shake.rate()    > 0.5) seenGestures.add('shake');
      if (neurons.sweep    && neurons.sweep.rate()    > 0.5) seenGestures.add('sweep');
      if (neurons.circle   && neurons.circle.rate()   > 0.5) seenGestures.add('circle');
      if (neurons.pendulum && neurons.pendulum.rate() > 0.5) seenGestures.add('pendulum');
      if (neurons.stillness&& neurons.stillness.rate()> 0.5) seenGestures.add('stillness');
    }

    smoothEnergy += (energy - smoothEnergy) * (1 - Math.exp(-3 * dt));

    // Spread: tighter overall, energy opens it
    const targetSpread = 0.05 + Math.min(0.28, smoothEnergy * 0.22) + seenGestures.size * 0.012;
    smoothSpread += (targetSpread - smoothSpread) * (1 - Math.exp(-1.5 * dt));

    // φ-driven breath — two oscillators that never sync
    const breathRate = 0.35 + smoothEnergy * 0.7;
    smoothBreath += dt * breathRate;

    // Orbit rotation — ALWAYS turning, energy just speeds it
    smoothRotation += dt * (0.08 + smoothEnergy * 0.18) * (1 / PHI);

    // Touch ripple
    if (touching && touchRipple < 0.5) {
      touchRipple = Math.min(1, touchRipple + dt * 3);
    } else {
      touchRipple *= Math.exp(-2 * dt);
    }
    touchRipplePhase += dt * 8;

    // Particle wander (gentle brownian)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i];
      p.wanderX += p.wanderVX * dt;
      p.wanderY += p.wanderVY * dt;
      p.wanderVX -= p.wanderX * 0.5 * dt;
      p.wanderVY -= p.wanderY * 0.5 * dt;
      p.wanderVX += (Math.random() - 0.5) * 0.3 * dt;
      p.wanderVY += (Math.random() - 0.5) * 0.3 * dt;
    }

    // Trail
    trail.push({ x: posX * width, y: posY * height, t: time });
    if (trail.length > TRAIL_MAX) trail.shift();
  }

  function addMutation(surprise) {
    if (surprise < 0.3) return;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i];
      const angle = p.baseAngle + smoothRotation;
      p.wanderVX += Math.cos(angle) * surprise * 0.6;
      p.wanderVY += Math.sin(angle) * surprise * 0.6;
    }
  }

  // ── DRAW ───────────────────────────────────────────────────────────

  function draw(canvasCtx, x, y, w, h) {
    const minDim = Math.min(w, h);
    const fieldScale = minDim * smoothSpread;

    // Warm hue only — golden amber to rose, never green
    var hueBase = (lensHue + time * 0.3) % 60 + 10;  // range 10-70: gold→amber→rose

    canvasCtx.save();

    // ── TRAIL: thin, fading path ──
    if (trail.length > 3) {
      const tLen = Math.min(trail.length, 30 + Math.floor(smoothEnergy * 30));
      const tStart = trail.length - tLen;
      canvasCtx.beginPath();
      canvasCtx.moveTo(trail[tStart].x, trail[tStart].y);
      for (let i = tStart + 1; i < trail.length; i++) {
        canvasCtx.lineTo(trail[i].x, trail[i].y);
      }
      const trailAlpha = 0.03 + smoothEnergy * 0.04;
      canvasCtx.strokeStyle = 'rgba(255,230,180,' + trailAlpha + ')';
      canvasCtx.lineWidth = 0.7;
      canvasCtx.stroke();
    }

    // ── PARTICLES: orbiting golden spiral field ──
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i];

      // Orbit: each particle rotates at its own speed/direction
      const orbitAngle = p.baseAngle + smoothRotation * p.orbitSpeed * p.orbitDir;

      // DNA helix: perpendicular weave
      const helixT = time * (0.6 + p.orbitSpeed * 0.4) + p.phase;
      const helixOffset = Math.sin(helixT * PHI) * p.helixAmp * fieldScale * 0.12;
      const perpAngle = orbitAngle + Math.PI * 0.5;

      const baseR = p.baseRadius * fieldScale;

      // Breathing: dual φ oscillators
      const breath = Math.sin(smoothBreath * TWO_PI + p.phase) * 0.07
                   + Math.sin(smoothBreath * TWO_PI * PHI + p.phase * PHI) * 0.05;

      // Touch ripple
      const ripple = touchRipple * 6 * Math.sin(
        touchRipplePhase - p.baseRadius * 12
      ) * (1 - p.baseRadius);

      const r = baseR * (1 + breath) + ripple;

      const px = x + Math.cos(orbitAngle) * r + Math.cos(perpAngle) * helixOffset
               + p.wanderX * fieldScale * 0.2;
      const py = y + Math.sin(orbitAngle) * r + Math.sin(perpAngle) * helixOffset
               + p.wanderY * fieldScale * 0.2;

      // Size: smaller overall
      const baseSize = p.size * (0.3 + p.baseRadius * 0.5);
      const sz = baseSize * (1 + smoothEnergy * 1.2);

      // Alpha: muted
      const innerBright = 1 - p.baseRadius * 0.6;
      const energyBright = smoothEnergy * p.baseRadius;
      let alpha = (innerBright + energyBright) * p.brightness;
      alpha *= 0.12 + smoothEnergy * 0.25;
      alpha = Math.max(0.015, Math.min(0.35, alpha));

      // Color: warm amber-gold range, never cold
      const hue = (hueBase + i * 0.8) % 70 + 10;
      const sat = Math.min(25, 8 + smoothEnergy * 14);
      const light = 55 + p.brightness * 15;

      // Draw particle
      canvasCtx.fillStyle = hsl(hue, sat, light, alpha);
      canvasCtx.beginPath();
      canvasCtx.arc(px, py, sz, 0, TWO_PI);
      canvasCtx.fill();

      // Soft glow on brighter particles
      if (alpha > 0.12 && sz > 0.8) {
        const glowR = sz * 3.5;
        const g = canvasCtx.createRadialGradient(px, py, 0, px, py, glowR);
        g.addColorStop(0, hsl(hue, sat, light, alpha * 0.25));
        g.addColorStop(1, 'rgba(0,0,0,0)');
        canvasCtx.fillStyle = g;
        canvasCtx.beginPath();
        canvasCtx.arc(px, py, glowR, 0, TWO_PI);
        canvasCtx.fill();
      }
    }

    // ── ORIGIN: faint warmth ──
    const originAlpha = 0.06 + smoothEnergy * 0.1;
    const originR = 1.5 + smoothEnergy * 2;
    const og = canvasCtx.createRadialGradient(x, y, 0, x, y, originR * 4);
    og.addColorStop(0, hsl(hueBase, Math.min(15, 6), 70, originAlpha));
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
