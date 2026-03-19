/**
 * ORGANISM — Liquid Glass
 *
 * One breathing point of warm light. Minimal. Clean. 2026.
 * Responds to energy subtly — never overwhelms.
 * Fades in smoothly. Reflects manipulation, not dominates.
 */

const Organism = (function () {
  'use strict';

  const TWO_PI = Math.PI * 2;
  const PHI = 1.6180339887;

  let time = 0;
  let smoothEnergy = 0;
  let smoothBreath = 0;
  let touchRipple = 0;
  let fadeIn = 0;  // smooth entrance

  function applyLens() {}

  function update(dt, posX, posY, width, height, brainState, touching) {
    time += dt;
    fadeIn = Math.min(1, fadeIn + dt * 0.3);  // ~3 seconds to fully appear
    var energy = brainState.energy || 0;
    smoothEnergy += (energy - smoothEnergy) * (1 - Math.exp(-3 * dt));
    smoothBreath += dt * (0.35 + smoothEnergy * 0.15);

    if (touching && touchRipple < 1) {
      touchRipple = Math.min(1, touchRipple + dt * 4);
    } else {
      touchRipple *= Math.exp(-2.5 * dt);
    }
  }

  function addMutation() {}

  function draw(ctx, x, y, w, h) {
    if (fadeIn < 0.01) return;
    var minDim = Math.min(w, h);

    // Breath
    var breath = Math.sin(smoothBreath * TWO_PI) * 0.3 + 0.5;
    var breath2 = Math.sin(smoothBreath * TWO_PI * PHI) * 0.2 + 0.5;
    var b = breath * 0.6 + breath2 * 0.4;

    // Clamp energy influence — never overwhelm
    var en = Math.min(1, smoothEnergy * 0.08);

    // Radius: tiny at rest, grows gently with energy
    var baseR = minDim * (0.012 + en * 0.018 + b * 0.003) * fadeIn;

    // Alpha: whisper — never bright
    var alpha = (0.06 + en * 0.08 + b * 0.02) * fadeIn;

    // ── OUTER GLOW ──
    var glowR = baseR * (5 + en * 2);
    var glow = ctx.createRadialGradient(x, y, 0, x, y, glowR);
    glow.addColorStop(0, 'rgba(255,245,230,' + (alpha * 0.3) + ')');
    glow.addColorStop(0.4, 'rgba(255,235,215,' + (alpha * 0.08) + ')');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, glowR, 0, TWO_PI);
    ctx.fill();

    // ── CORE ──
    var coreR = baseR * (1.2 + b * 0.2);
    var core = ctx.createRadialGradient(x, y, 0, x, y, coreR);
    core.addColorStop(0, 'rgba(255,248,235,' + Math.min(0.35, alpha * 1.5) + ')');
    core.addColorStop(0.6, 'rgba(255,240,220,' + Math.min(0.15, alpha * 0.6) + ')');
    core.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(x, y, coreR, 0, TWO_PI);
    ctx.fill();

    // ── TOUCH RIPPLE ──
    if (touchRipple > 0.01) {
      var rippleR = baseR * (3 + touchRipple * 6);
      ctx.strokeStyle = 'rgba(255,240,220,' + (touchRipple * 0.06 * fadeIn) + ')';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.arc(x, y, rippleR, 0, TWO_PI);
      ctx.stroke();
    }
  }

  return Object.freeze({
    update: update,
    draw: draw,
    applyLens: applyLens,
    addMutation: addMutation,
  });
})();
