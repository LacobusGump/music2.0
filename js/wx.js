/**
 * WX — Weather Visual Layer
 *
 * Renders on top of the organism canvas.
 * Rain: glass window physics — drops nucleate, bead, run in rivulets.
 * Snow: slow crystalline drift.
 * Night: vignette + star-pulse to music energy.
 * Time of day: thin horizon light at screen edge.
 *
 * The aesthetic is always GUMP: phosphor green on black.
 * These effects live ON the glass, not in the world.
 */

var Wx = (function () {

  // ── RAIN DROPS ──────────────────────────────────────────────────────────
  // Physics-lite: nucleate → grow → fall → trail → gone

  var drops     = [];
  var MAX_DROPS = 22;
  var lastSpawn = 0;

  function spawnDrop(W, H) {
    var r = 2.5 + Math.random() * 5.5;
    drops.push({
      x:       Math.random() * W,
      y:       H * 0.05 + Math.random() * H * 0.30,
      r:       0,
      maxR:    r,
      vy:      0,
      falling: false,
      trailY:  0,           // y where fall began
      trailLen: 0,          // current trail length
      wobble:   (Math.random() - 0.5) * 0.4,  // slight horizontal drift
    });
  }

  function updateDrops(dt, now, W, H, intensity) {
    var spawnInterval = Math.max(80, 400 - intensity * 320);
    if (now - lastSpawn > spawnInterval && drops.length < MAX_DROPS) {
      spawnDrop(W, H);
      lastSpawn = now;
    }

    for (var i = drops.length - 1; i >= 0; i--) {
      var d = drops[i];
      if (!d.falling) {
        // Growing phase: nucleation
        d.r += dt * (1.2 + Math.random() * 0.4);
        if (d.r >= d.maxR) {
          d.falling = true;
          d.trailY  = d.y;
          d.vy      = 40 + Math.random() * 30;
        }
      } else {
        // Falling phase: gravity + slight wobble
        d.vy += dt * 180;
        d.y  += d.vy * dt;
        d.x  += d.wobble * dt * 8;
        d.trailLen = d.y - d.trailY;

        if (d.y > H + 20) drops.splice(i, 1);
      }
    }
  }

  function drawDrops(ctx, intensity) {
    for (var i = 0; i < drops.length; i++) {
      var d = drops[i];
      var alpha = 0.55 + intensity * 0.25;

      if (d.falling && d.trailLen > 0) {
        // Rivulet trail — gradient from dim at top to bright just behind drop
        var grad = ctx.createLinearGradient(d.x, d.trailY, d.x, d.trailY + d.trailLen);
        grad.addColorStop(0,   'rgba(0,255,65,0)');
        grad.addColorStop(0.6, 'rgba(0,255,65,' + (alpha * 0.08) + ')');
        grad.addColorStop(1,   'rgba(0,255,65,' + (alpha * 0.22) + ')');
        ctx.beginPath();
        ctx.moveTo(d.x, d.trailY);
        ctx.lineTo(d.x, d.trailY + d.trailLen);
        ctx.strokeStyle = grad;
        ctx.lineWidth   = d.r * 0.38;
        ctx.lineCap     = 'round';
        ctx.stroke();
      }

      // Drop body — dark fill (glass lens effect)
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,8,2,' + (alpha * 0.18) + ')';
      ctx.fill();

      // Drop rim — phosphor green ring (surface tension)
      ctx.strokeStyle = 'rgba(0,255,65,' + (alpha * 0.42) + ')';
      ctx.lineWidth   = 0.7;
      ctx.stroke();

      // Specular highlight — upper-left reflection
      var hx = d.x - d.r * 0.32;
      var hy = d.y - d.r * 0.32;
      var hr = d.r * 0.28;
      ctx.beginPath();
      ctx.arc(hx, hy, hr, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,255,65,' + (alpha * 0.55) + ')';
      ctx.fill();

      // Inner refraction glow (the display showing through)
      var igr = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r * 0.8);
      igr.addColorStop(0,   'rgba(0,255,65,' + (alpha * 0.12) + ')');
      igr.addColorStop(1,   'rgba(0,255,65,0)');
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = igr;
      ctx.fill();
    }
  }

  // ── RAIN OVERLAY — soft grey-green fog of moisture on the glass ────────
  function drawRainAtmosphere(ctx, W, H, intensity) {
    // Very subtle moisture haze — more rain = slightly more diffuse
    var haze = intensity * 0.035;
    ctx.fillStyle = 'rgba(0,12,4,' + haze + ')';
    ctx.fillRect(0, 0, W, H);

    // Running water streaks on glass surface (very thin, fast)
    // These are separate from drops — ambient moisture already running
    // Drawn as very faint vertical lines of varying length
    ctx.save();
    ctx.globalAlpha = 0.07 * intensity;
    ctx.strokeStyle = '#00FF41';
    ctx.lineWidth = 0.4;
    for (var s = 0; s < 6; s++) {
      var sx = (W * 0.1 * s + W * 0.05 + Math.sin(Date.now() * 0.0001 + s) * 20);
      var sy = ((Date.now() * 0.03 * (0.6 + s * 0.1) + s * 137) % H);
      var sl = 15 + Math.random() * 25;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + (Math.random() - 0.5) * 2, sy + sl);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ── SNOW ────────────────────────────────────────────────────────────────

  var snowParticles = [];
  var SNOW_COUNT    = 35;

  function initSnow(W, H) {
    snowParticles = [];
    for (var i = 0; i < SNOW_COUNT; i++) {
      snowParticles.push({
        x:     Math.random() * W,
        y:     Math.random() * H,
        r:     0.8 + Math.random() * 2.0,
        vx:    (Math.random() - 0.5) * 0.4,
        vy:    0.25 + Math.random() * 0.55,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  function drawSnow(ctx, W, H, dt, intensity) {
    if (snowParticles.length === 0) initSnow(W, H);

    for (var i = 0; i < snowParticles.length; i++) {
      var p = snowParticles[i];
      p.phase += dt * 0.8;
      p.x     += p.vx + Math.sin(p.phase) * 0.3;
      p.y     += p.vy * intensity * 1.4;
      if (p.y > H + 4) { p.y = -4; p.x = Math.random() * W; }
      if (p.x < -4)    { p.x = W + 4; }
      if (p.x > W + 4) { p.x = -4; }

      var a = 0.4 + intensity * 0.3;
      // Soft crystal dot with glow
      var gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.5);
      gr.addColorStop(0,   'rgba(160,255,200,' + a + ')');
      gr.addColorStop(0.4, 'rgba(0,255,65,'   + (a * 0.5) + ')');
      gr.addColorStop(1,   'rgba(0,255,65,0)');
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = gr;
      ctx.fill();
    }
  }

  // ── STARS — night sky ────────────────────────────────────────────────────

  var stars = [];
  var STAR_COUNT = 40;

  function initStars(W, H) {
    stars = [];
    // Avoid the center (organism lives there)
    var cx = W / 2, cy = H / 2, safe = Math.min(W, H) * 0.28;
    var attempts = 0;
    while (stars.length < STAR_COUNT && attempts < 400) {
      attempts++;
      var x = Math.random() * W;
      var y = Math.random() * H;
      var dx = x - cx, dy = y - cy;
      if (Math.sqrt(dx * dx + dy * dy) < safe) continue;
      stars.push({
        x: x, y: y,
        r: 0.4 + Math.random() * 0.9,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.8,
      });
    }
  }

  function drawStars(ctx, W, H, dt, energy) {
    if (stars.length === 0) initStars(W, H);

    var t = Date.now() * 0.001;
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      s.phase += dt * s.speed;
      // Stars pulse gently with music energy
      var pulse = 0.3 + 0.4 * Math.abs(Math.sin(s.phase)) + energy * 0.3;
      var r     = s.r * (0.8 + pulse * 0.4);
      var a     = 0.15 + pulse * 0.25;

      ctx.beginPath();
      ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,255,100,' + a + ')';
      ctx.fill();
    }
  }

  // ── VIGNETTE — night darkening at screen edges ─────────────────────────

  function drawVignette(ctx, W, H, strength) {
    var grad = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.85);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,10,' + strength + ')');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  // ── TIME-OF-DAY HORIZON LIGHT ────────────────────────────────────────────
  // Not a sky. A thin strip of light at the edge — the signature of the hour.

  function drawTimeLight(ctx, W, H, hour) {
    var color = null, edge = 'bottom', alpha = 0;

    if (hour >= 5  && hour < 7)  { color = '40,180,120';  edge = 'bottom'; alpha = 0.18; } // dawn — cool green-gold
    if (hour >= 7  && hour < 9)  { color = '20,220,100';  edge = 'bottom'; alpha = 0.10; } // morning — clean
    if (hour >= 18 && hour < 20) { color = '60,160,80';   edge = 'bottom'; alpha = 0.14; } // dusk — deepening
    if (hour >= 20 && hour < 22) { color = '0,80,30';     edge = 'bottom'; alpha = 0.20; } // early night
    if (hour >= 22 || hour < 5)  { color = '0,20,8';      edge = 'bottom'; alpha = 0.30; } // deep night

    if (!color) return;

    var grad;
    if (edge === 'bottom') {
      grad = ctx.createLinearGradient(0, H * 0.75, 0, H);
      grad.addColorStop(0, 'rgba(' + color + ',0)');
      grad.addColorStop(1, 'rgba(' + color + ',' + alpha + ')');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, H * 0.75, W, H * 0.25);
  }

  // ── TRANSITION BLEND ────────────────────────────────────────────────────
  // Smoothly interpolate the weather alpha so effects don't snap on load

  var blendAlpha  = 0;
  var targetAlpha = 0;

  // ── MAIN RENDER ──────────────────────────────────────────────────────────

  var _dt = 0, _lastTime = 0;

  function render(ctx, W, H, musicEnergy) {
    var now = performance.now();
    _dt = _lastTime ? Math.min(0.05, (now - _lastTime) / 1000) : 0.016;
    _lastTime = now;

    var cond      = Weather.condition;
    var isNight   = Weather.isNight;
    var intensity = Weather.intensity;
    var loaded    = Weather.loaded;
    var hour      = Weather.hour;

    // Blend alpha: ramp up when loaded, ramp down to 0 if not yet loaded
    targetAlpha = loaded ? 1.0 : 0.0;
    blendAlpha += (targetAlpha - blendAlpha) * _dt * 0.8;
    if (blendAlpha < 0.01) return;

    ctx.save();
    ctx.globalAlpha = blendAlpha;

    // 1. Time-of-day horizon
    drawTimeLight(ctx, W, H, hour);

    // 2. Night vignette
    if (isNight) {
      drawVignette(ctx, W, H, 0.40);
    } else if (cond === 'cloudy' || cond === 'fog') {
      drawVignette(ctx, W, H, 0.12);
    }

    // 3. Night stars
    if (isNight && (cond === 'clear' || cond === 'cloudy')) {
      drawStars(ctx, W, H, _dt, musicEnergy);
    }

    // 4. Precipitation
    if (cond === 'rain' || cond === 'storm') {
      drawRainAtmosphere(ctx, W, H, intensity);
      updateDrops(_dt, now, W, H, intensity);
      drawDrops(ctx, intensity);
    } else if (cond === 'snow') {
      drawSnow(ctx, W, H, _dt, intensity);
    }

    ctx.restore();
  }

  return { render: render };
})();
