/**
 * ORGANISM — Zero-G Liquid
 *
 * A droplet of living liquid floating in space. Bigger. Wetter. 3D.
 * Surface tension holds it. Movement deforms it. Drips fall and shift color.
 * Lens determines base color. The liquid breathes.
 */

const Organism = (function () {
  'use strict';

  const TWO_PI = Math.PI * 2;
  const PHI = 1.6180339887;
  const POINTS = 80;

  let time = 0;
  let smoothEnergy = 0;
  let smoothBreath = 0;
  let velX = 0, velY = 0;
  let prevX = 0, prevY = 0;
  let lensR = 180, lensG = 220, lensB = 255;

  // Drips — fall from the main body
  var drips = [];
  var MAX_DRIPS = 5;
  var dripTimer = 0;

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
    smoothBreath += dt * (0.25 + smoothEnergy * 0.08);

    var cx = posX * width;
    var cy = posY * height;
    velX += (cx - prevX - velX) * 0.12;
    velY += (cy - prevY - velY) * 0.12;
    velX *= 0.90;
    velY *= 0.90;
    prevX = cx;
    prevY = cy;

    // Spawn drips when moving
    dripTimer += dt;
    var speed = Math.sqrt(velX * velX + velY * velY);
    if (speed > 2 && dripTimer > 0.8 && drips.length < MAX_DRIPS) {
      dripTimer = 0;
      drips.push({
        x: cx + (Math.random() - 0.5) * 10,
        y: cy + (Math.random() - 0.5) * 10,
        vy: 0.5 + Math.random() * 1.5,
        r: 2 + Math.random() * 3,
        life: 1.0,
        hueShift: 0,
      });
    }

    // Update drips — fall and shift color
    for (var i = drips.length - 1; i >= 0; i--) {
      var d = drips[i];
      d.vy += dt * 60;  // gravity
      d.y += d.vy * dt;
      d.r *= (1 - dt * 0.3);  // shrink
      d.life -= dt * 0.4;
      d.hueShift += dt * 40;  // color shifts as it falls
      if (d.life <= 0 || d.r < 0.3) drips.splice(i, 1);
    }
  }

  function addMutation() {}

  function draw(ctx, x, y, w, h) {
    var minDim = Math.min(w, h);
    var en = Math.min(1, smoothEnergy * 0.07);

    // Bigger base radius
    var baseR = minDim * (0.045 + en * 0.02);

    var speed = Math.sqrt(velX * velX + velY * velY);
    var distort = Math.min(0.5, speed * 0.004);

    // ── DRIPS — fall from the body, shift color ──
    for (var di = 0; di < drips.length; di++) {
      var d = drips[di];
      var shift = d.hueShift;
      var dr = Math.min(255, lensR + shift * 0.5);
      var dg = Math.max(0, lensG - shift * 0.3);
      var db = Math.min(255, lensB + shift * 0.2);
      var dAlpha = d.life * 0.25;

      // Drip body
      var dGrad = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r);
      dGrad.addColorStop(0, 'rgba(' + Math.floor(dr) + ',' + Math.floor(dg) + ',' + Math.floor(db) + ',' + dAlpha + ')');
      dGrad.addColorStop(0.6, 'rgba(' + Math.floor(dr * 0.7) + ',' + Math.floor(dg * 0.7) + ',' + Math.floor(db * 0.7) + ',' + (dAlpha * 0.4) + ')');
      dGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = dGrad;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, TWO_PI);
      ctx.fill();

      // Drip highlight
      ctx.fillStyle = 'rgba(255,255,255,' + (d.life * 0.1) + ')';
      ctx.beginPath();
      ctx.arc(d.x - d.r * 0.2, d.y - d.r * 0.3, d.r * 0.25, 0, TWO_PI);
      ctx.fill();
    }

    // ── LIQUID SURFACE — deformed circle ──
    ctx.beginPath();
    for (var i = 0; i <= POINTS; i++) {
      var angle = (i / POINTS) * TWO_PI;
      var cos = Math.cos(angle);
      var sin = Math.sin(angle);

      var wave1 = Math.sin(angle * 3 + time * 1.6) * 0.08;
      var wave2 = Math.sin(angle * 5 + time * 2.7 * PHI) * 0.04;
      var wave3 = Math.sin(angle * 8 + time * 1.3) * 0.025;
      var energyWave = Math.sin(angle * 4 + time * 3.2) * en * 0.10;
      var pushX = velX * cos * 0.005;
      var pushY = velY * sin * 0.005;
      var breath = Math.sin(smoothBreath * TWO_PI) * 0.02;

      var r = baseR * (1 + wave1 + wave2 + wave3 + energyWave + breath + distort * (pushX + pushY));
      var px = x + cos * r;
      var py = y + sin * r;

      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();

    // ── 3D LIQUID FILL — depth gradient ──
    var grad = ctx.createRadialGradient(
      x - baseR * 0.25, y - baseR * 0.3, baseR * 0.1,
      x + baseR * 0.1, y + baseR * 0.1, baseR * 1.4
    );
    grad.addColorStop(0, 'rgba(' + Math.min(255, lensR + 100) + ',' + Math.min(255, lensG + 80) + ',' + Math.min(255, lensB + 60) + ',0.45)');
    grad.addColorStop(0.3, 'rgba(' + lensR + ',' + lensG + ',' + lensB + ',0.28)');
    grad.addColorStop(0.7, 'rgba(' + Math.floor(lensR * 0.6) + ',' + Math.floor(lensG * 0.6) + ',' + Math.floor(lensB * 0.6) + ',0.15)');
    grad.addColorStop(1, 'rgba(' + Math.floor(lensR * 0.2) + ',' + Math.floor(lensG * 0.2) + ',' + Math.floor(lensB * 0.2) + ',0.05)');
    ctx.fillStyle = grad;
    ctx.fill();

    // ── WET EDGE — rim light ──
    ctx.strokeStyle = 'rgba(' + Math.min(255, lensR + 80) + ',' + Math.min(255, lensG + 60) + ',' + Math.min(255, lensB + 40) + ',0.15)';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // ── SPECULAR — big wet highlight ──
    var specR = baseR * 0.45;
    var specX = x - baseR * 0.2;
    var specY = y - baseR * 0.25;
    var spec = ctx.createRadialGradient(specX, specY, 0, specX, specY, specR);
    spec.addColorStop(0, 'rgba(255,255,255,0.30)');
    spec.addColorStop(0.5, 'rgba(255,255,255,0.08)');
    spec.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = spec;
    ctx.beginPath();
    ctx.arc(specX, specY, specR, 0, TWO_PI);
    ctx.fill();

    // ── SECONDARY HIGHLIGHT — bottom rim for 3D depth ──
    var rimX = x + baseR * 0.15;
    var rimY = y + baseR * 0.3;
    var rimR = baseR * 0.2;
    var rim = ctx.createRadialGradient(rimX, rimY, 0, rimX, rimY, rimR);
    rim.addColorStop(0, 'rgba(255,255,255,0.08)');
    rim.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = rim;
    ctx.beginPath();
    ctx.arc(rimX, rimY, rimR, 0, TWO_PI);
    ctx.fill();

    // ── AMBIENT GLOW ──
    var glowR = baseR * 2.5;
    var glow = ctx.createRadialGradient(x, y, baseR * 0.8, x, y, glowR);
    glow.addColorStop(0, 'rgba(' + lensR + ',' + lensG + ',' + lensB + ',' + (0.04 + en * 0.03) + ')');
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
