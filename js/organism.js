/**
 * ORGANISM — Liquid Glass
 *
 * One breathing orb of light. Minimal. Clean. 2026.
 * Energy expands and brightens. Stillness fades to almost nothing.
 * Touch creates a ripple. The glass breathes with the music.
 */

const Organism = (function () {
  'use strict';

  const TWO_PI = Math.PI * 2;
  const PHI = 1.6180339887;

  // ── STATE ──────────────────────────────────────────────────────────

  let time = 0;
  let smoothEnergy = 0;
  let smoothBreath = 0;
  let touchRipple = 0;
  let lensHue = 30;  // warm gold default

  // ── HELPERS ────────────────────────────────────────────────────────

  function hexToHue(hex) {
    if (!hex || hex.length < 7) return 30;
    var r = parseInt(hex.slice(1,3), 16) / 255;
    var g = parseInt(hex.slice(3,5), 16) / 255;
    var b = parseInt(hex.slice(5,7), 16) / 255;
    var max = Math.max(r,g,b), min = Math.min(r,g,b);
    if (max === min) return 30;
    var d = max - min, h = 0;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
    return h * 360;
  }

  function applyLens(lens) {
    if (lens && lens.color) lensHue = hexToHue(lens.color);
  }

  // ── UPDATE ─────────────────────────────────────────────────────────

  function update(dt, posX, posY, width, height, brainState, touching) {
    time += dt;
    var energy = brainState.energy || 0;
    smoothEnergy += (energy - smoothEnergy) * (1 - Math.exp(-3 * dt));
    smoothBreath += dt * (0.4 + smoothEnergy * 0.6);

    if (touching && touchRipple < 1) {
      touchRipple = Math.min(1, touchRipple + dt * 4);
    } else {
      touchRipple *= Math.exp(-2.5 * dt);
    }
  }

  function addMutation() {}

  // ── DRAW — Liquid Glass ────────────────────────────────────────────

  function draw(ctx, x, y, w, h) {
    var minDim = Math.min(w, h);

    // Breath: two phi-offset oscillators that never sync
    var breath1 = Math.sin(smoothBreath * TWO_PI) * 0.5 + 0.5;
    var breath2 = Math.sin(smoothBreath * TWO_PI * PHI) * 0.5 + 0.5;
    var breath = breath1 * 0.6 + breath2 * 0.4;

    // Base radius: small at rest, expands with energy
    var baseR = minDim * (0.03 + smoothEnergy * 0.06 + breath * 0.01);

    // Alpha: whisper at rest, present with energy
    var baseAlpha = 0.04 + smoothEnergy * 0.12 + breath * 0.02;

    // ── OUTER GLOW — the glass halo ──
    var glowR = baseR * (4 + smoothEnergy * 3);
    var glow = ctx.createRadialGradient(x, y, 0, x, y, glowR);
    glow.addColorStop(0, 'rgba(255,245,230,' + (baseAlpha * 0.4) + ')');
    glow.addColorStop(0.3, 'rgba(255,235,210,' + (baseAlpha * 0.15) + ')');
    glow.addColorStop(0.7, 'rgba(255,225,200,' + (baseAlpha * 0.04) + ')');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, glowR, 0, TWO_PI);
    ctx.fill();

    // ── INNER ORB — the liquid glass core ──
    var coreR = baseR * (1.5 + breath * 0.3);
    var core = ctx.createRadialGradient(x, y, 0, x, y, coreR);
    core.addColorStop(0, 'rgba(255,250,240,' + Math.min(0.5, baseAlpha * 2) + ')');
    core.addColorStop(0.5, 'rgba(255,240,220,' + Math.min(0.3, baseAlpha * 1.2) + ')');
    core.addColorStop(1, 'rgba(255,230,200,0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(x, y, coreR, 0, TWO_PI);
    ctx.fill();

    // ── TOUCH RIPPLE — expands outward ──
    if (touchRipple > 0.01) {
      var rippleR = baseR * (2 + touchRipple * 8);
      var rippleAlpha = touchRipple * 0.08;
      ctx.strokeStyle = 'rgba(255,240,220,' + rippleAlpha + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, rippleR, 0, TWO_PI);
      ctx.stroke();
    }

    // ── ENERGY RING — appears with motion ──
    if (smoothEnergy > 0.5) {
      var ringR = baseR * 2.5;
      var ringAlpha = Math.min(0.12, (smoothEnergy - 0.5) * 0.08);
      ctx.strokeStyle = 'rgba(255,235,210,' + ringAlpha + ')';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.arc(x, y, ringR, 0, TWO_PI);
      ctx.stroke();
    }
  }

  // ── PUBLIC ─────────────────────────────────────────────────────────

  return Object.freeze({
    update: update,
    draw: draw,
    applyLens: applyLens,
    addMutation: addMutation,
  });
})();
