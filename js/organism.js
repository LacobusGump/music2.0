/**
 * ORGANISM — Zero-G Liquid
 *
 * A droplet of liquid floating in space. Surface tension holds it.
 * Movement pushes the surface. Energy excites it. Stillness calms it.
 * Lens determines the color. Organic. Alive. Not quite real.
 */

const Organism = (function () {
  'use strict';

  const TWO_PI = Math.PI * 2;
  const PHI = 1.6180339887;
  const POINTS = 64;  // surface resolution

  let time = 0;
  let smoothEnergy = 0;
  let smoothBreath = 0;
  let velX = 0, velY = 0;
  let prevX = 0, prevY = 0;
  let lensR = 180, lensG = 220, lensB = 255;  // default: cool blue-white

  function hexToRGB(hex) {
    if (!hex || hex.length < 7) return;
    lensR = parseInt(hex.slice(1,3), 16);
    lensG = parseInt(hex.slice(3,5), 16);
    lensB = parseInt(hex.slice(5,7), 16);
  }

  function applyLens(lens) {
    if (lens && lens.color) hexToRGB(lens.color);
  }

  function update(dt, posX, posY, width, height, brainState, touching) {
    time += dt;
    var energy = brainState.energy || 0;
    smoothEnergy += (energy - smoothEnergy) * (1 - Math.exp(-4 * dt));
    smoothBreath += dt * (0.3 + smoothEnergy * 0.1);

    // Track velocity for surface deformation
    var cx = posX * width;
    var cy = posY * height;
    velX += (cx - prevX - velX) * 0.15;
    velY += (cy - prevY - velY) * 0.15;
    velX *= 0.92;  // damping
    velY *= 0.92;
    prevX = cx;
    prevY = cy;
  }

  function addMutation() {}

  function draw(ctx, x, y, w, h) {
    var minDim = Math.min(w, h);
    var en = Math.min(1, smoothEnergy * 0.07);

    // Base radius — small, intimate
    var baseR = minDim * (0.025 + en * 0.015);

    // Speed of position change drives surface distortion
    var speed = Math.sqrt(velX * velX + velY * velY);
    var distort = Math.min(0.4, speed * 0.003);

    // ── LIQUID SURFACE — deformed circle ──
    // Each point on the perimeter is displaced by layered sine waves
    // Movement pushes the surface in the direction of travel
    ctx.beginPath();
    for (var i = 0; i <= POINTS; i++) {
      var angle = (i / POINTS) * TWO_PI;
      var cos = Math.cos(angle);
      var sin = Math.sin(angle);

      // Surface tension waves — 3 frequencies, phi-offset
      var wave1 = Math.sin(angle * 3 + time * 1.8) * 0.06;
      var wave2 = Math.sin(angle * 5 + time * 2.9 * PHI) * 0.03;
      var wave3 = Math.sin(angle * 7 + time * 1.1) * 0.02;

      // Energy excites the surface more
      var energyWave = Math.sin(angle * 4 + time * 3.5) * en * 0.08;

      // Movement pushes — velocity deforms the surface
      var pushX = velX * cos * 0.004;
      var pushY = velY * sin * 0.004;

      // Breath — slow expansion/contraction
      var breath = Math.sin(smoothBreath * TWO_PI) * 0.015;

      var r = baseR * (1 + wave1 + wave2 + wave3 + energyWave + breath + distort * (pushX + pushY));

      var px = x + cos * r;
      var py = y + sin * r;

      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();

    // ── FILL — liquid gradient ──
    var grad = ctx.createRadialGradient(
      x - baseR * 0.2, y - baseR * 0.25, 0,
      x, y, baseR * 1.3
    );
    // Highlight (top-left light source)
    grad.addColorStop(0, 'rgba(' + Math.min(255, lensR + 80) + ',' + Math.min(255, lensG + 60) + ',' + Math.min(255, lensB + 40) + ',0.35)');
    // Body
    grad.addColorStop(0.4, 'rgba(' + lensR + ',' + lensG + ',' + lensB + ',0.18)');
    // Edge — darker
    grad.addColorStop(1, 'rgba(' + Math.floor(lensR * 0.4) + ',' + Math.floor(lensG * 0.4) + ',' + Math.floor(lensB * 0.4) + ',0.06)');

    ctx.fillStyle = grad;
    ctx.fill();

    // ── SURFACE EDGE — thin highlight ring ──
    ctx.strokeStyle = 'rgba(' + Math.min(255, lensR + 60) + ',' + Math.min(255, lensG + 40) + ',' + Math.min(255, lensB + 30) + ',0.10)';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // ── SPECULAR HIGHLIGHT — the "wet" look ──
    var specR = baseR * 0.3;
    var specX = x - baseR * 0.15;
    var specY = y - baseR * 0.2;
    var spec = ctx.createRadialGradient(specX, specY, 0, specX, specY, specR);
    spec.addColorStop(0, 'rgba(255,255,255,0.18)');
    spec.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = spec;
    ctx.beginPath();
    ctx.arc(specX, specY, specR, 0, TWO_PI);
    ctx.fill();

    // ── AMBIENT GLOW — very subtle halo ──
    var glowR = baseR * 3;
    var glow = ctx.createRadialGradient(x, y, baseR * 0.5, x, y, glowR);
    glow.addColorStop(0, 'rgba(' + lensR + ',' + lensG + ',' + lensB + ',' + (0.03 + en * 0.02) + ')');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, glowR, 0, TWO_PI);
    ctx.fill();
  }

  return Object.freeze({
    update: update,
    draw: draw,
    applyLens: applyLens,
    addMutation: addMutation,
  });
})();
