/**
 * ORGANISM — Golden Spiral Field
 *
 * 55 particles (Fibonacci) at golden angle spacing.
 * Not dots — soft radial wisps. Essence, not objects.
 * Constant orbital motion like DNA helices — they orbit even when still.
 * Energy controls spread + speed, not existence.
 * Colors are muted, desaturated, nearly monochrome.
 */

const Organism = (function () {
  'use strict';

  const TWO_PI = Math.PI * 2;
  const PHI = 1.6180339887;
  const GOLDEN_ANGLE = TWO_PI * (1 - 1 / PHI);
  const PARTICLE_COUNT = 55;  // Fibonacci
  const TRAIL_MAX = 60;

  // ── STATE ──────────────────────────────────────────────────────────

  let time = 0;
  let lifeForce = 0;
  let touchTime = 0;
  const seenGestures = new Set();
  const trail = [];

  let smoothEnergy = 0;
  let smoothSpread = 0.08;
  let smoothBreath = 0;
  let smoothRotation = 0;
  let touchRipple = 0;
  let touchRipplePhase = 0;

  let lensHue = 0;
  let lensSat = 0;
  let lensLight = 50;

  // Per-particle state
  const particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const fi = i * GOLDEN_ANGLE;
    const fRadius = Math.sqrt(i / PARTICLE_COUNT);
    particles.push({
      baseAngle: fi,
      baseRadius: fRadius,
      phase: i * GOLDEN_ANGLE * 0.7,  // φ-spaced phase offsets
      // Orbital: each particle has its own orbit speed + direction
      orbitSpeed: 0.3 + (i % 8) * 0.08,  // varied speeds
      orbitDir: (i % 3 === 0) ? -1 : 1,  // some orbit counter
      orbitEcc: 0.15 + Math.random() * 0.2, // elliptical eccentricity
      // DNA helix: particles oscillate perpendicular to their radius
      helixPhase: i * GOLDEN_ANGLE * 1.3,
      helixAmp: 0.3 + (i % 5) * 0.12,
      // Wander
      wanderX: 0, wanderY: 0,
      wanderVX: (Math.random() - 0.5) * 0.08,
      wanderVY: (Math.random() - 0.5) * 0.08,
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

    // Spread: tight when still, opens with energy — but stays small
    const targetSpread = 0.04 + Math.min(0.22, smoothEnergy * 0.18) + seenGestures.size * 0.01;
    smoothSpread += (targetSpread - smoothSpread) * (1 - Math.exp(-1.5 * dt));

    // φ-driven breath
    const breathRate = 0.3 + smoothEnergy * 0.6;
    smoothBreath += dt * breathRate;

    // Global rotation — always moving, energy just speeds it up
    smoothRotation += dt * (0.06 + smoothEnergy * 0.15) * (1 / PHI);

    // Touch ripple
    if (touching && touchRipple < 0.5) {
      touchRipple = Math.min(1, touchRipple + dt * 3);
    } else {
      touchRipple *= Math.exp(-2.5 * dt);
    }
    touchRipplePhase += dt * 6;

    // Particle wander (very gentle)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i];
      p.wanderX += p.wanderVX * dt;
      p.wanderY += p.wanderVY * dt;
      p.wanderVX -= p.wanderX * 0.6 * dt;
      p.wanderVY -= p.wanderY * 0.6 * dt;
      p.wanderVX += (Math.random() - 0.5) * 0.2 * dt;
      p.wanderVY += (Math.random() - 0.5) * 0.2 * dt;
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
      p.wanderVX += Math.cos(angle) * surprise * 0.5;
      p.wanderVY += Math.sin(angle) * surprise * 0.5;
    }
  }

  // ── DRAW ───────────────────────────────────────────────────────────

  function draw(canvasCtx, x, y, w, h) {
    const minDim = Math.min(w, h);
    const fieldScale = minDim * smoothSpread;

    // Muted hue: barely shifts, mostly desaturated
    const hueBase = lensHue + seenGestures.size * 8 + time * 0.5;

    canvasCtx.save();

    // ── TRAIL: hair-thin whisper ──
    if (trail.length > 3) {
      const tLen = Math.min(trail.length, 20 + Math.floor(smoothEnergy * 20));
      const tStart = trail.length - tLen;
      canvasCtx.beginPath();
      canvasCtx.moveTo(trail[tStart].x, trail[tStart].y);
      for (let i = tStart + 1; i < trail.length; i++) {
        canvasCtx.lineTo(trail[i].x, trail[i].y);
      }
      const trailAlpha = 0.02 + smoothEnergy * 0.04;
      canvasCtx.strokeStyle = 'rgba(255,255,255,' + trailAlpha + ')';
      canvasCtx.lineWidth = 0.5;
      canvasCtx.stroke();
    }

    // ── PARTICLES: orbiting wisps ──
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i];

      // ── ORBIT: always rotating, even at rest ──
      // Each particle orbits at its own speed/direction
      const orbitAngle = p.baseAngle + smoothRotation * p.orbitSpeed * p.orbitDir;

      // ── DNA HELIX: perpendicular oscillation ──
      // Particles weave in and out like a double helix strand
      const helixT = time * (0.8 + p.orbitSpeed * 0.5) + p.helixPhase;
      const helixOffset = Math.sin(helixT * PHI) * p.helixAmp * fieldScale * 0.15;

      // Base spiral radius
      const baseR = p.baseRadius * fieldScale;

      // Breathing: dual φ oscillators
      const breath = Math.sin(smoothBreath * TWO_PI + p.phase) * 0.06
                   + Math.sin(smoothBreath * TWO_PI * PHI + p.phase * PHI) * 0.04;

      // Elliptical orbit (not circular — more organic)
      const eccAngle = orbitAngle * 2 + p.phase;
      const eccR = 1 + Math.sin(eccAngle) * p.orbitEcc;

      // Touch ripple
      const ripple = touchRipple * 4 * Math.sin(
        touchRipplePhase - p.baseRadius * 10
      ) * (1 - p.baseRadius * 0.7);

      const r = baseR * eccR * (1 + breath) + ripple;

      // Helix adds perpendicular displacement
      const perpAngle = orbitAngle + Math.PI * 0.5;
      const px = x + Math.cos(orbitAngle) * r + Math.cos(perpAngle) * helixOffset
               + p.wanderX * fieldScale * 0.15;
      const py = y + Math.sin(orbitAngle) * r + Math.sin(perpAngle) * helixOffset
               + p.wanderY * fieldScale * 0.15;

      // ── SIZE: small. Essence, not objects. ──
      const sz = (0.3 + p.baseRadius * 0.4) * (0.8 + smoothEnergy * 0.6);

      // ── ALPHA: muted, ghostly ──
      const innerFade = 1 - p.baseRadius * 0.5;
      const energyFade = smoothEnergy * p.baseRadius * 0.6;
      let alpha = (innerFade + energyFade) * 0.5;
      alpha *= 0.08 + smoothEnergy * 0.18;  // very dim when still
      alpha = Math.max(0.01, Math.min(0.25, alpha));

      // ── COLOR: desaturated, muted ──
      // Low saturation, high lightness = fog/essence, not neon
      const hue = (hueBase + i * 1.5) % 360;
      const sat = Math.min(12, lensSat * 0.3 + smoothEnergy * 8);
      const light = 65 + (1 - p.baseRadius) * 15;

      // Draw as soft radial gradient — NOT a hard dot
      const glowR = sz * 4;
      const g = canvasCtx.createRadialGradient(px, py, 0, px, py, glowR);
      g.addColorStop(0, hsl(hue, sat, light, alpha));
      g.addColorStop(0.4, hsl(hue, sat, light, alpha * 0.4));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      canvasCtx.fillStyle = g;
      canvasCtx.beginPath();
      canvasCtx.arc(px, py, glowR, 0, TWO_PI);
      canvasCtx.fill();
    }

    // ── CONNECTIVE THREADS: faint lines between nearby particles ──
    // Like the bonds in a molecule — shows structure without drawing attention
    if (smoothEnergy > 0.05) {
      canvasCtx.strokeStyle = 'rgba(255,255,255,' + Math.min(0.03, smoothEnergy * 0.02) + ')';
      canvasCtx.lineWidth = 0.3;
      // Only draw between sequential spiral neighbors (not all pairs)
      for (let i = 1; i < PARTICLE_COUNT; i += 2) {
        const p0 = particles[i - 1];
        const p1 = particles[i];

        const a0 = p0.baseAngle + smoothRotation * p0.orbitSpeed * p0.orbitDir;
        const a1 = p1.baseAngle + smoothRotation * p1.orbitSpeed * p1.orbitDir;
        const r0 = p0.baseRadius * fieldScale;
        const r1 = p1.baseRadius * fieldScale;

        const x0 = x + Math.cos(a0) * r0;
        const y0 = y + Math.sin(a0) * r0;
        const x1 = x + Math.cos(a1) * r1;
        const y1 = y + Math.sin(a1) * r1;

        const dist = Math.sqrt((x1-x0)*(x1-x0) + (y1-y0)*(y1-y0));
        if (dist < fieldScale * 0.5) {
          canvasCtx.beginPath();
          canvasCtx.moveTo(x0, y0);
          canvasCtx.lineTo(x1, y1);
          canvasCtx.stroke();
        }
      }
    }

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
