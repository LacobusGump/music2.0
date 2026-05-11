// ═══════════════════════════════════════════════════════════════════
// GUMP VIZ — Standalone coupling renderer. One script tag. Living visuals.
//
// Usage:
//   <script src="https://begump.com/js/viz.js" data-viz="flock"></script>
//
// Or programmatic:
//   GUMP.create({ type: 'flock', container: el, n: 80 });
//
// Grand Unified Music Project — begump.com
// ═══════════════════════════════════════════════════════════════════
;(function(root) {
'use strict';

// ═══ CONSTANTS FROM THE MATH ═══
var PHI = (1 + Math.sqrt(5)) / 2;
var INV_PHI = 1 / PHI;
var GA = Math.PI * (3 - Math.sqrt(5)); // golden angle 137.5 degrees
var K_STAR = 1.868;
var TAU = Math.PI * 2;

// ═══ PALETTES — each color IS a K value ═══
var PALETTES = {
  ember: {
    bg: [26, 17, 13],
    particles: [
      [210, 120, 45],  [185, 82, 40],  [190, 145, 60],
      [165, 90, 35],   [220, 155, 65], [200, 100, 40],
      [230, 170, 80],  [180, 130, 50], [240, 180, 90],
      [175, 110, 45],  [195, 135, 55], [145, 85, 40]
    ],
    glow: [201, 164, 74],
    accent: [189, 110, 55],
    dim: [136, 100, 70],
    text: [232, 228, 220]
  },
  ocean: {
    bg: [8, 14, 22],
    particles: [
      [60, 130, 180],  [40, 100, 160], [80, 150, 200],
      [50, 120, 170],  [90, 160, 190], [70, 140, 175],
      [100, 170, 210], [45, 110, 165], [110, 180, 220],
      [55, 125, 155],  [85, 155, 195], [65, 135, 185]
    ],
    glow: [100, 170, 210],
    accent: [60, 140, 190],
    dim: [70, 100, 130],
    text: [210, 230, 240]
  },
  forest: {
    bg: [10, 18, 12],
    particles: [
      [64, 149, 64],   [80, 130, 50],  [50, 120, 55],
      [90, 140, 60],   [70, 160, 80],  [55, 110, 45],
      [100, 150, 70],  [60, 135, 55],  [110, 160, 80],
      [45, 105, 40],   [85, 145, 65],  [75, 125, 50]
    ],
    glow: [100, 160, 80],
    accent: [64, 149, 64],
    dim: [80, 110, 70],
    text: [220, 230, 210]
  },
  mono: {
    bg: [0, 0, 0],
    particles: [
      [255, 255, 255], [220, 220, 220], [200, 200, 200],
      [240, 240, 240], [180, 180, 180], [210, 210, 210],
      [230, 230, 230], [190, 190, 190], [250, 250, 250],
      [170, 170, 170], [215, 215, 215], [195, 195, 195]
    ],
    glow: [255, 255, 255],
    accent: [200, 200, 200],
    dim: [100, 100, 100],
    text: [255, 255, 255]
  }
};

// ═══ UTILITY ═══
function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
function lerp(a, b, t) { return a + (b - a) * t; }
function lerpColor(c1, c2, t) {
  return [
    Math.round(lerp(c1[0], c2[0], t)),
    Math.round(lerp(c1[1], c2[1], t)),
    Math.round(lerp(c1[2], c2[2], t))
  ];
}
function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
function dist(x1, y1, x2, y2) { var dx = x2-x1, dy = y2-y1; return Math.sqrt(dx*dx+dy*dy); }
function smoothstep(t) { return t * t * (3 - 2 * t); }

// Detect mobile for reduced particles
function isMobile() { return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth < 768; }

// Parse custom palette from user-provided array
function parsePalette(name, custom) {
  if (name === 'custom' && custom) {
    return {
      bg: custom.bg || [0,0,0],
      particles: custom.particles || PALETTES.ember.particles,
      glow: custom.glow || custom.particles[0] || [200,200,200],
      accent: custom.accent || custom.particles[1] || [180,180,180],
      dim: custom.dim || [100,100,100],
      text: custom.text || [220,220,220]
    };
  }
  return PALETTES[name] || PALETTES.ember;
}

// ═══ CORE ENGINE ═══
function createInstance(opts) {
  opts = opts || {};
  var type = opts.type || 'flock';
  var container = opts.container || null;
  var n = opts.n || null;
  var k = opts.k || null;
  var paletteName = opts.palette || 'ember';
  var customPalette = opts.customPalette || null;
  var interactive = opts.interactive !== false;
  var isBackground = opts.background === true || opts.background === 'true';
  var targetFps = parseInt(opts.fps) || 60;

  var pal = parsePalette(paletteName, customPalette);

  // Create canvas
  var cv = document.createElement('canvas');
  var cx = cv.getContext('2d');
  var W, H, dpr;

  // Mouse state
  var mx = -9999, my = -9999, mDown = false;

  // Determine parent
  var parent;
  if (container) {
    if (typeof container === 'string') container = document.getElementById(container);
    parent = container;
  } else {
    parent = document.body;
  }

  // Style the canvas
  if (isBackground || !container) {
    cv.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:-1;pointer-events:' + (interactive ? 'auto' : 'none') + ';';
  } else {
    cv.style.cssText = 'width:100%;height:100%;display:block;';
  }

  parent.appendChild(cv);

  function resize() {
    var rect;
    if (isBackground || !container) {
      W = window.innerWidth;
      H = window.innerHeight;
    } else {
      rect = parent.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
    }
    dpr = window.devicePixelRatio || 1;
    cv.width = W * dpr;
    cv.height = H * dpr;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  // Mouse/touch
  if (interactive) {
    cv.addEventListener('mousemove', function(e) {
      var r = cv.getBoundingClientRect();
      mx = e.clientX - r.left; my = e.clientY - r.top;
    });
    cv.addEventListener('mouseleave', function() { mx = -9999; my = -9999; mDown = false; });
    cv.addEventListener('mousedown', function() { mDown = true; });
    cv.addEventListener('mouseup', function() { mDown = false; });
    cv.addEventListener('touchmove', function(e) {
      e.preventDefault();
      var t = e.touches[0]; var r = cv.getBoundingClientRect();
      mx = t.clientX - r.left; my = t.clientY - r.top;
    }, {passive: false});
    cv.addEventListener('touchstart', function(e) {
      var t = e.touches[0]; var r = cv.getBoundingClientRect();
      mx = t.clientX - r.left; my = t.clientY - r.top; mDown = true;
    }, {passive: true});
    cv.addEventListener('touchend', function() { mx = -9999; my = -9999; mDown = false; });
  }

  // ═══ SELECT VISUALIZATION ═══
  var viz = VISUALIZATIONS[type];
  if (!viz) viz = VISUALIZATIONS.flock;

  var mobileN = isMobile();
  var defaultN = viz.defaultN || 80;
  if (n === null) n = mobileN ? Math.max(20, Math.floor(defaultN * 0.5)) : defaultN;
  if (k === null) k = viz.defaultK || K_STAR;

  var state = viz.init(n, k, pal, W, H);

  // ═══ ANIMATION LOOP ═══
  var time = 0;
  var dt = 1 / targetFps;
  var running = true;
  var frameInterval = 1000 / targetFps;
  var lastFrame = 0;

  function loop(ts) {
    if (!running) return;
    requestAnimationFrame(loop);
    if (ts - lastFrame < frameInterval * 0.9) return;
    lastFrame = ts;
    time += dt;

    // Handle resize changes
    if (cv.width !== W * dpr || cv.height !== H * dpr) resize();

    cx.clearRect(0, 0, W, H);
    cx.fillStyle = rgba(pal.bg, 1);
    cx.fillRect(0, 0, W, H);

    viz.step(state, dt, W, H, mx, my, mDown, k, time);
    viz.draw(cx, state, W, H, pal, time);
  }

  requestAnimationFrame(loop);

  // Return handle
  return {
    canvas: cv,
    destroy: function() {
      running = false;
      window.removeEventListener('resize', resize);
      if (cv.parentNode) cv.parentNode.removeChild(cv);
    },
    setK: function(newK) { k = newK; },
    setN: function(newN) {
      n = newN;
      state = viz.init(n, k, pal, W, H);
    }
  };
}


// ═══════════════════════════════════════════════════════════════════
// VISUALIZATIONS
// ═══════════════════════════════════════════════════════════════════

var VISUALIZATIONS = {};

// ─────────────────────────────────────────────────────────
// 1. FLOCK — emergent formations from coupling
// ─────────────────────────────────────────────────────────
VISUALIZATIONS.flock = {
  defaultN: 80,
  defaultK: 1.868,

  init: function(n, k, pal, W, H) {
    var px = [], py = [], vx = [], vy = [];
    var phases = [], omega = [], colors = [];
    var isScout = [], trails = [], trailIdx = [];
    var couplingCredit = [];

    for (var i = 0; i < n; i++) {
      var r = 0.8 + Math.sqrt(i / n) * 5;
      var a = i * GA;
      px.push(Math.cos(a) * r);
      py.push(Math.sin(a) * r);
      vx.push((Math.random() - 0.5) * 0.02);
      vy.push((Math.random() - 0.5) * 0.02);
      phases.push(Math.random() * TAU);
      omega.push((0.3 + Math.random() * 0.7) * TAU * (0.8 + Math.random() * 0.4));
      colors.push(pal.particles[Math.floor((i * PHI * 7) % pal.particles.length)]);
      isScout.push(Math.random() < 0.10);
      couplingCredit.push(0.3);
      if (isScout[i]) {
        trails.push(new Float64Array(15 * 2));
      } else {
        trails.push(null);
      }
      trailIdx.push(0);
    }

    // Build neighbor list
    var nbrs = [];
    for (var i = 0; i < n; i++) {
      var nn = [];
      for (var j = 0; j < n; j++) {
        if (j === i) continue;
        var dx = px[j] - px[i], dy = py[j] - py[i];
        if (dx*dx + dy*dy < 12) nn.push(j);
      }
      nbrs.push(nn);
    }

    return {
      n: n, px: px, py: py, vx: vx, vy: vy,
      phases: phases, omega: omega, colors: colors,
      isScout: isScout, trails: trails, trailIdx: trailIdx,
      couplingCredit: couplingCredit, nbrs: nbrs,
      breathPhase: 0, driftX: 0, driftY: 0, driftAngle: Math.random() * TAU,
      R: 0, pulseTimer: 8 + Math.random() * 12,
      pulseActive: false, pulseBright: new Float64Array(n),
      pulseOrigin: -1, pulseStartTime: 0
    };
  },

  step: function(s, dt, W, H, mx, my, mDown, K, time) {
    var n = s.n;
    var sW = 18, sH = 18; // simulation space
    var scaleX = W / sW, scaleY = H / sH;

    // Breath
    s.breathPhase += dt * 0.4;
    var breath = 1 + Math.sin(s.breathPhase) * 0.12;

    // Drift
    s.driftAngle += (Math.random() - 0.5) * 0.03;
    s.driftX += Math.cos(s.driftAngle) * 0.003;
    s.driftY += Math.sin(s.driftAngle) * 0.003;
    s.driftX *= 0.995;
    s.driftY *= 0.995;

    // Center of mass
    var comX = 0, comY = 0;
    for (var i = 0; i < n; i++) { comX += s.px[i]; comY += s.py[i]; }
    comX /= n; comY /= n;

    // Pulse timer
    s.pulseTimer -= dt;
    if (s.pulseTimer <= 0 && !s.pulseActive) {
      s.pulseActive = true;
      s.pulseOrigin = Math.floor(Math.random() * n);
      s.pulseStartTime = time;
      s.pulseBright[s.pulseOrigin] = 1;
      s.pulseTimer = 8 + Math.random() * 12;
    }

    // Phase coupling (Kuramoto)
    var sumCos = 0, sumSin = 0;
    for (var i = 0; i < n; i++) {
      var coupling = 0;
      var nn = s.nbrs[i];
      for (var j = 0; j < nn.length; j++) {
        var idx = nn[j];
        coupling += Math.sin(s.phases[idx] - s.phases[i]);
      }
      coupling *= K / n * 3;
      s.phases[i] += (s.omega[i] + coupling) * dt;
      sumCos += Math.cos(s.phases[i]);
      sumSin += Math.sin(s.phases[i]);
    }
    s.R = Math.sqrt(sumCos * sumCos + sumSin * sumSin) / n;

    // Convert mouse to sim coords (screen -> simulation space centered at 0)
    var simMX = (mx - W / 2) / scaleX;
    var simMY = (my - H / 2) / scaleY;

    for (var i = 0; i < n; i++) {
      var fx = 0, fy = 0;

      // 1. Cohesion toward center (strong enough to keep flock in view)
      fx += (comX - s.px[i]) * 0.008;
      fy += (comY - s.py[i]) * 0.008;
      // Also pull toward canvas center to prevent drift
      fx -= s.px[i] * 0.002;
      fy -= s.py[i] * 0.002;

      // 2. Alignment — match neighbors
      var nn = s.nbrs[i];
      var avgVX = 0, avgVY = 0, avgCount = 0;
      for (var j = 0; j < nn.length; j++) {
        var idx = nn[j];
        avgVX += s.vx[idx]; avgVY += s.vy[idx]; avgCount++;
        // 3. Separation
        var dx = s.px[i] - s.px[idx], dy = s.py[i] - s.py[idx];
        var d2 = dx*dx + dy*dy;
        if (d2 < 1.5 && d2 > 0.001) {
          var sep = 0.015 / d2;
          fx += dx * sep; fy += dy * sep;
        }
        // Coupling credit
        if (d2 < 4) {
          var sync = Math.cos(s.phases[i] - s.phases[idx]);
          s.couplingCredit[i] += sync * 0.001;
        }
      }
      if (avgCount > 0) {
        fx += (avgVX / avgCount - s.vx[i]) * 0.06;
        fy += (avgVY / avgCount - s.vy[i]) * 0.06;
      }

      // 4. Wander
      fx += (Math.random() - 0.5) * 0.008;
      fy += (Math.random() - 0.5) * 0.008;

      // 5. Drift
      fx += s.driftX; fy += s.driftY;

      // 6. Scout behavior — slightly more exploratory
      if (s.isScout[i]) {
        fx += (Math.random() - 0.5) * 0.02;
        fy += (Math.random() - 0.5) * 0.02;
      }

      // 7. Mouse interaction
      if (mx > -9000) {
        var mdx = s.px[i] - simMX, mdy = s.py[i] - simMY;
        var md = Math.sqrt(mdx*mdx + mdy*mdy);
        if (md < 4 && md > 0.01) {
          if (mDown) {
            // attract
            fx -= mdx / md * 0.03 * (1 - md/4);
          } else {
            // gentle repel
            fx += mdx / md * 0.01 * (1 - md/4);
          }
        }
      }

      // 8. Boundary (strong enough to contain)
      var bx = sW / 2, by = sH / 2;
      var edgeX = s.px[i] / bx, edgeY = s.py[i] / by;
      if (Math.abs(edgeX) > 0.7) { var ex = (Math.abs(edgeX)-0.7)/0.3; fx -= edgeX * ex * 0.08; }
      if (Math.abs(edgeY) > 0.7) { var ey = (Math.abs(edgeY)-0.7)/0.3; fy -= edgeY * ey * 0.08; }
      // Hard clamp — never leave the canvas
      if (Math.abs(s.px[i]) > bx) { s.px[i] = Math.sign(s.px[i]) * bx * 0.95; s.vx[i] *= -0.3; }
      if (Math.abs(s.py[i]) > by) { s.py[i] = Math.sign(s.py[i]) * by * 0.95; s.vy[i] *= -0.3; }

      // 9. Breathing
      var bDir = Math.atan2(s.py[i] - comY, s.px[i] - comX);
      fx += Math.cos(bDir) * (breath - 1) * 0.01;
      fy += Math.sin(bDir) * (breath - 1) * 0.01;

      // Apply forces
      s.vx[i] += fx;
      s.vy[i] += fy;
      s.vx[i] *= 0.96;
      s.vy[i] *= 0.96;

      // Speed limit
      var spd = Math.sqrt(s.vx[i]*s.vx[i] + s.vy[i]*s.vy[i]);
      if (spd > 0.15) { s.vx[i] *= 0.15/spd; s.vy[i] *= 0.15/spd; }

      s.px[i] += s.vx[i];
      s.py[i] += s.vy[i];
      s.couplingCredit[i] = clamp(s.couplingCredit[i], 0, 1);

      // Trail update for scouts
      if (s.trails[i]) {
        var ti = s.trailIdx[i];
        s.trails[i][ti * 2] = s.px[i];
        s.trails[i][ti * 2 + 1] = s.py[i];
        s.trailIdx[i] = (ti + 1) % 15;
      }

      // Pulse propagation
      if (s.pulseActive && s.pulseBright[i] > 0.01) {
        for (var j = 0; j < nn.length; j++) {
          var idx = nn[j];
          if (s.pulseBright[idx] < s.pulseBright[i] * 0.7) {
            s.pulseBright[idx] = Math.max(s.pulseBright[idx], s.pulseBright[i] * 0.65);
          }
        }
        s.pulseBright[i] *= 0.94;
      }
    }

    // Check if pulse done
    if (s.pulseActive) {
      var anyBright = false;
      for (var i = 0; i < n; i++) { if (s.pulseBright[i] > 0.01) { anyBright = true; break; } }
      if (!anyBright) s.pulseActive = false;
    }
  },

  draw: function(cx, s, W, H, pal, time) {
    var n = s.n;
    var sW = 18, sH = 18;
    var scaleX = W / sW, scaleY = H / sH;
    var offX = W / 2, offY = H / 2;

    // Connections
    for (var i = 0; i < n; i++) {
      var nn = s.nbrs[i];
      for (var j = 0; j < nn.length; j++) {
        var idx = nn[j];
        if (idx <= i) continue;
        var dx = s.px[idx] - s.px[i], dy = s.py[idx] - s.py[i];
        var d = Math.sqrt(dx*dx + dy*dy);
        if (d > 3.5) continue;
        var sync = Math.abs(Math.cos(s.phases[i] - s.phases[idx]));
        var alpha = (1 - d/3.5) * sync * 0.12;
        if (alpha < 0.005) continue;
        var col = lerpColor(s.colors[i], s.colors[idx], 0.5);
        cx.beginPath();
        cx.moveTo(offX + s.px[i] * scaleX, offY + s.py[i] * scaleY);
        cx.lineTo(offX + s.px[idx] * scaleX, offY + s.py[idx] * scaleY);
        cx.strokeStyle = rgba(col, alpha);
        cx.lineWidth = sync * 0.8;
        cx.stroke();
      }
    }

    // Trails (scouts)
    for (var i = 0; i < n; i++) {
      if (!s.trails[i]) continue;
      cx.beginPath();
      var started = false;
      for (var t = 0; t < 15; t++) {
        var ti = (s.trailIdx[i] + t) % 15;
        var tx = offX + s.trails[i][ti * 2] * scaleX;
        var ty = offY + s.trails[i][ti * 2 + 1] * scaleY;
        if (s.trails[i][ti * 2] === 0 && s.trails[i][ti * 2 + 1] === 0) continue;
        if (!started) { cx.moveTo(tx, ty); started = true; }
        else cx.lineTo(tx, ty);
      }
      if (started) {
        cx.strokeStyle = rgba(s.colors[i], 0.06);
        cx.lineWidth = 0.5;
        cx.stroke();
      }
    }

    // Nodes
    for (var i = 0; i < n; i++) {
      var sx = offX + s.px[i] * scaleX, sy = offY + s.py[i] * scaleY;
      var sync = 0.5 + Math.abs(Math.cos(s.phases[i])) * 0.5;
      var credit = s.couplingCredit[i];
      var size = 1.5 + credit * 2;
      var pulse = s.pulseBright[i];

      // Glow
      if (credit > 0.4 || pulse > 0.1) {
        var glowR = size * (3 + pulse * 8);
        var glow = cx.createRadialGradient(sx, sy, 0, sx, sy, glowR);
        glow.addColorStop(0, rgba(s.colors[i], (0.05 + pulse * 0.3) * sync));
        glow.addColorStop(1, rgba(s.colors[i], 0));
        cx.fillStyle = glow;
        cx.fillRect(sx - glowR, sy - glowR, glowR * 2, glowR * 2);
      }

      // Body
      cx.beginPath();
      cx.arc(sx, sy, size * (1 + pulse * 0.5), 0, TAU);
      cx.fillStyle = rgba(s.colors[i], sync * (0.6 + credit * 0.4 + pulse * 0.4));
      cx.fill();
    }

    // Pulse ring
    if (s.pulseActive && s.pulseOrigin >= 0) {
      var elapsed = time - s.pulseStartTime;
      var ringR = elapsed * 180 * W / 1200;
      var ringAlpha = Math.max(0, 0.15 - elapsed * 0.02);
      if (ringAlpha > 0.001) {
        var ox = offX + s.px[s.pulseOrigin] * scaleX;
        var oy = offY + s.py[s.pulseOrigin] * scaleY;
        cx.beginPath();
        cx.arc(ox, oy, ringR, 0, TAU);
        cx.strokeStyle = rgba(pal.glow, ringAlpha);
        cx.lineWidth = 1.5;
        cx.stroke();
      }
    }
  }
};


// ─────────────────────────────────────────────────────────
// 2. KURAMOTO — phase synchronization circle
// ─────────────────────────────────────────────────────────
VISUALIZATIONS.kuramoto = {
  defaultN: 32,
  defaultK: 1.5,

  init: function(n, k, pal, W, H) {
    var phases = [], omega = [], colors = [];
    for (var i = 0; i < n; i++) {
      phases.push(Math.random() * TAU);
      omega.push(0.5 + (Math.random() - 0.5) * 2);
      colors.push(pal.particles[i % pal.particles.length]);
    }
    return { n: n, phases: phases, omega: omega, colors: colors, R: 0, meanAngle: 0, trail: [] };
  },

  step: function(s, dt, W, H, mx, my, mDown, K, time) {
    var n = s.n;
    // Kuramoto coupling
    var sumCos = 0, sumSin = 0;
    for (var i = 0; i < n; i++) {
      sumCos += Math.cos(s.phases[i]);
      sumSin += Math.sin(s.phases[i]);
    }
    s.R = Math.sqrt(sumCos*sumCos + sumSin*sumSin) / n;
    s.meanAngle = Math.atan2(sumSin, sumCos);

    for (var i = 0; i < n; i++) {
      var coupling = 0;
      for (var j = 0; j < n; j++) {
        if (j === i) continue;
        coupling += Math.sin(s.phases[j] - s.phases[i]);
      }
      coupling *= K / n;
      s.phases[i] += (s.omega[i] + coupling) * dt;
    }

    // Mouse: push oscillators away or attract
    if (mx > -9000) {
      var cX = W/2, cY = H/2;
      var radius = Math.min(W, H) * 0.35;
      for (var i = 0; i < n; i++) {
        var px = cX + Math.cos(s.phases[i]) * radius;
        var py = cY + Math.sin(s.phases[i]) * radius;
        var md = dist(px, py, mx, my);
        if (md < 60) {
          var nudge = (60 - md) / 60 * 0.3 * (mDown ? -1 : 1);
          s.phases[i] += nudge * dt;
        }
      }
    }

    // R trail
    s.trail.push({ R: s.R, angle: s.meanAngle });
    if (s.trail.length > 120) s.trail.shift();
  },

  draw: function(cx, s, W, H, pal, time) {
    var cX = W/2, cY = H/2;
    var radius = Math.min(W, H) * 0.35;
    var n = s.n;

    // Outer ring
    cx.beginPath();
    cx.arc(cX, cY, radius, 0, TAU);
    cx.strokeStyle = rgba(pal.dim, 0.2);
    cx.lineWidth = 1;
    cx.stroke();

    // 1/phi ring
    cx.beginPath();
    cx.arc(cX, cY, radius * INV_PHI, 0, TAU);
    cx.strokeStyle = rgba(pal.accent, 0.12);
    cx.lineWidth = 0.5;
    cx.setLineDash([4, 4]);
    cx.stroke();
    cx.setLineDash([]);

    // R vector trail
    for (var t = 0; t < s.trail.length - 1; t++) {
      var tr = s.trail[t];
      var alpha = t / s.trail.length * 0.15;
      var rx = cX + Math.cos(tr.angle) * radius * tr.R;
      var ry = cY + Math.sin(tr.angle) * radius * tr.R;
      cx.beginPath();
      cx.arc(rx, ry, 1, 0, TAU);
      cx.fillStyle = rgba(pal.glow, alpha);
      cx.fill();
    }

    // Spokes
    for (var i = 0; i < n; i++) {
      var px = cX + Math.cos(s.phases[i]) * radius;
      var py = cY + Math.sin(s.phases[i]) * radius;
      cx.beginPath();
      cx.moveTo(cX, cY);
      cx.lineTo(px, py);
      cx.strokeStyle = rgba(s.colors[i], 0.06);
      cx.lineWidth = 0.5;
      cx.stroke();
    }

    // R vector
    var rX = cX + Math.cos(s.meanAngle) * radius * s.R;
    var rY = cY + Math.sin(s.meanAngle) * radius * s.R;
    cx.beginPath();
    cx.moveTo(cX, cY);
    cx.lineTo(rX, rY);
    cx.strokeStyle = rgba(pal.glow, 0.6);
    cx.lineWidth = 2;
    cx.stroke();

    // R dot
    cx.beginPath();
    cx.arc(rX, rY, 5, 0, TAU);
    cx.fillStyle = rgba(pal.glow, 0.9);
    cx.fill();

    // Phase dots
    for (var i = 0; i < n; i++) {
      var px = cX + Math.cos(s.phases[i]) * radius;
      var py = cY + Math.sin(s.phases[i]) * radius;

      // Glow
      var glow = cx.createRadialGradient(px, py, 0, px, py, 12);
      glow.addColorStop(0, rgba(s.colors[i], 0.15));
      glow.addColorStop(1, rgba(s.colors[i], 0));
      cx.fillStyle = glow;
      cx.fillRect(px - 12, py - 12, 24, 24);

      cx.beginPath();
      cx.arc(px, py, 3.5, 0, TAU);
      cx.fillStyle = rgba(s.colors[i], 0.85);
      cx.fill();
    }

    // R readout
    cx.fillStyle = rgba(pal.glow, 0.7);
    cx.font = 'bold 14px "Courier New",monospace';
    cx.textAlign = 'center';
    cx.fillText('R = ' + s.R.toFixed(3), cX, cY + 6);
  }
};


// ─────────────────────────────────────────────────────────
// 3. LORENZ — strange attractor
// ─────────────────────────────────────────────────────────
VISUALIZATIONS.lorenz = {
  defaultN: 4000,
  defaultK: 10,

  init: function(n, k, pal) {
    return {
      n: n,
      x: 1, y: 1, z: 1,
      trail: [],
      sigma: 10, rho: 28, beta: 8/3,
      rotY: 0
    };
  },

  step: function(s, dt, W, H, mx, my, mDown, K, time) {
    // Mouse controls rotation
    if (mx > -9000) {
      s.rotY = (mx / W - 0.5) * TAU * 0.5;
    } else {
      s.rotY += dt * 0.15;
    }

    // Integrate Lorenz
    var steps = 8;
    var h = 0.004;
    for (var i = 0; i < steps; i++) {
      var dx = s.sigma * (s.y - s.x);
      var dy = s.x * (s.rho - s.z) - s.y;
      var dz = s.x * s.y - s.beta * s.z;
      s.x += dx * h;
      s.y += dy * h;
      s.z += dz * h;
      s.trail.push([s.x, s.y, s.z]);
    }

    if (s.trail.length > s.n) {
      s.trail.splice(0, s.trail.length - s.n);
    }
  },

  draw: function(cx, s, W, H, pal, time) {
    var cX = W/2, cY = H * 0.55;
    var scale = Math.min(W, H) / 80;
    var cosR = Math.cos(s.rotY), sinR = Math.sin(s.rotY);

    // Project 3D to 2D
    function proj(p) {
      var rx = p[0] * cosR - p[1] * sinR;
      var ry = p[1] * cosR + p[0] * sinR;
      var depth = rx * 0.02 + 1;
      return [cX + ry * scale / depth, cY - (p[2] - 25) * scale / depth, depth];
    }

    var trail = s.trail;
    var len = trail.length;
    if (len < 2) return;

    for (var i = 1; i < len; i++) {
      var a = proj(trail[i-1]), b = proj(trail[i]);
      var t = i / len;
      var alpha = t * 0.6 * clamp(a[2], 0.3, 1);
      var col = lerpColor(pal.particles[0], pal.glow, t);
      cx.beginPath();
      cx.moveTo(a[0], a[1]);
      cx.lineTo(b[0], b[1]);
      cx.strokeStyle = rgba(col, alpha);
      cx.lineWidth = 0.5 + t * 1.5;
      cx.stroke();
    }

    // Head glow
    var head = proj(trail[len-1]);
    var glow = cx.createRadialGradient(head[0], head[1], 0, head[0], head[1], 20);
    glow.addColorStop(0, rgba(pal.glow, 0.4));
    glow.addColorStop(1, rgba(pal.glow, 0));
    cx.fillStyle = glow;
    cx.fillRect(head[0] - 20, head[1] - 20, 40, 40);
  }
};


// ─────────────────────────────────────────────────────────
// 4. LIFE — emergent biological forms
// ─────────────────────────────────────────────────────────
VISUALIZATIONS.life = {
  defaultN: 60,
  defaultK: 1.2,

  init: function(n, k, pal, W, H) {
    var cells = [];
    for (var i = 0; i < n; i++) {
      cells.push({
        x: (Math.random() - 0.5) * 16,
        y: (Math.random() - 0.5) * 16,
        vx: 0, vy: 0,
        phase: Math.random() * TAU,
        freq: 0.3 + Math.random() * 0.6,
        size: 0.3 + Math.random() * 0.5,
        type: Math.floor(Math.random() * 3), // 0=round, 1=elongated, 2=small
        color: pal.particles[i % pal.particles.length],
        membrane: 0
      });
    }
    return { cells: cells, n: n, spiralPhase: 0 };
  },

  step: function(s, dt, W, H, mx, my, mDown, K, time) {
    var cells = s.cells;
    var n = s.n;
    var sW = 18, sH = 18;
    var scaleX = W/sW, scaleY = H/sH;
    s.spiralPhase += dt * 0.1;

    for (var i = 0; i < n; i++) {
      var c = cells[i];
      c.phase += c.freq * dt;
      c.membrane = 0.5 + Math.sin(c.phase) * 0.5;

      var fx = 0, fy = 0;

      // Attract to similar types, form chains/spirals
      for (var j = 0; j < n; j++) {
        if (j === i) continue;
        var other = cells[j];
        var dx = other.x - c.x, dy = other.y - c.y;
        var d = Math.sqrt(dx*dx + dy*dy);
        if (d < 0.01) continue;

        if (c.type === other.type) {
          // Same type: chain formation
          var ideal = 1.5 + c.size + other.size;
          if (d < ideal * 3) {
            var force = (d - ideal) * 0.003 * K;
            fx += dx/d * force;
            fy += dy/d * force;
          }
        } else {
          // Different types: separation
          if (d < 2) {
            var rep = 0.005 / (d * d);
            fx -= dx/d * rep;
            fy -= dy/d * rep;
          }
        }

        // Universal separation at very close range
        if (d < c.size + other.size) {
          var push = 0.03 / (d + 0.1);
          fx -= dx/d * push;
          fy -= dy/d * push;
        }
      }

      // Spiral tendency
      var distFromCenter = Math.sqrt(c.x*c.x + c.y*c.y);
      if (distFromCenter > 0.5) {
        var tang = Math.atan2(c.y, c.x) + Math.PI * 0.5;
        fx += Math.cos(tang) * 0.002;
        fy += Math.sin(tang) * 0.002;
      }

      // Boundary
      if (Math.abs(c.x) > 7) fx -= c.x * 0.01;
      if (Math.abs(c.y) > 7) fy -= c.y * 0.01;

      // Mouse
      if (mx > -9000) {
        var smx = (mx - W/2) / (scaleX * 0.5), smy = (my - H/2) / (scaleY * 0.5);
        var mdx = c.x - smx, mdy = c.y - smy;
        var md = Math.sqrt(mdx*mdx + mdy*mdy);
        if (md < 4 && md > 0.01) {
          var mf = mDown ? -0.02 : 0.01;
          fx += mdx/md * mf * (1 - md/4);
          fy += mdy/md * mf * (1 - md/4);
        }
      }

      // Wander
      fx += (Math.random() - 0.5) * 0.004;
      fy += (Math.random() - 0.5) * 0.004;

      c.vx = (c.vx + fx) * 0.95;
      c.vy = (c.vy + fy) * 0.95;
      c.x += c.vx;
      c.y += c.vy;
    }
  },

  draw: function(cx, s, W, H, pal, time) {
    var cells = s.cells;
    var n = s.n;
    var sW = 18, sH = 18;
    var scaleX = W/sW, scaleY = H/sH;
    var offX = W/2, offY = H/2;

    // Connections between same-type neighbors
    for (var i = 0; i < n; i++) {
      var c = cells[i];
      for (var j = i+1; j < n; j++) {
        var o = cells[j];
        if (c.type !== o.type) continue;
        var d = dist(c.x, c.y, o.x, o.y);
        if (d > 4) continue;
        var alpha = (1 - d/4) * 0.08;
        cx.beginPath();
        cx.moveTo(offX + c.x * scaleX * 0.5, offY + c.y * scaleY * 0.5);
        cx.lineTo(offX + o.x * scaleX * 0.5, offY + o.y * scaleY * 0.5);
        cx.strokeStyle = rgba(c.color, alpha);
        cx.lineWidth = 0.5;
        cx.stroke();
      }
    }

    // Cells
    for (var i = 0; i < n; i++) {
      var c = cells[i];
      var sx = offX + c.x * scaleX * 0.5;
      var sy = offY + c.y * scaleY * 0.5;
      var sz = (c.size * 6 + c.membrane * 2) * Math.min(W, H) / 800;

      // Glow
      var glow = cx.createRadialGradient(sx, sy, 0, sx, sy, sz * 4);
      glow.addColorStop(0, rgba(c.color, 0.06 + c.membrane * 0.04));
      glow.addColorStop(1, rgba(c.color, 0));
      cx.fillStyle = glow;
      cx.fillRect(sx - sz*4, sy - sz*4, sz*8, sz*8);

      // Body
      cx.beginPath();
      if (c.type === 1) {
        // Elongated
        cx.save();
        cx.translate(sx, sy);
        cx.rotate(c.phase * 0.5);
        cx.scale(1.6, 0.7);
        cx.arc(0, 0, sz, 0, TAU);
        cx.restore();
      } else {
        cx.arc(sx, sy, sz, 0, TAU);
      }
      cx.fillStyle = rgba(c.color, 0.5 + c.membrane * 0.3);
      cx.fill();

      // Membrane ring
      cx.beginPath();
      cx.arc(sx, sy, sz * 1.2, 0, TAU);
      cx.strokeStyle = rgba(c.color, 0.1 + c.membrane * 0.15);
      cx.lineWidth = 0.5;
      cx.stroke();
    }
  }
};


// ─────────────────────────────────────────────────────────
// 5. PULSE — heartbeat through a network
// ─────────────────────────────────────────────────────────
VISUALIZATIONS.pulse = {
  defaultN: 50,
  defaultK: 1.0,

  init: function(n, k, pal, W, H) {
    var nodes = [], edges = [];
    // Place nodes on golden spiral
    for (var i = 0; i < n; i++) {
      var a = i * GA;
      var r = Math.sqrt(i + 1) * 0.8;
      nodes.push({
        x: Math.cos(a) * r,
        y: Math.sin(a) * r,
        phase: Math.random() * TAU,
        freq: 0.2 + Math.random() * 0.3,
        bright: 0,
        color: pal.particles[i % pal.particles.length]
      });
    }
    // Connect nearby
    for (var i = 0; i < n; i++) {
      for (var j = i+1; j < n; j++) {
        var d = dist(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
        if (d < 2.5) {
          edges.push({ a: i, b: j, weight: 1 - d/2.5 });
        }
      }
    }
    return {
      nodes: nodes, edges: edges, n: n,
      pulseTimer: 2, pulseOrigin: -1, pulseActive: false
    };
  },

  step: function(s, dt, W, H, mx, my, mDown, K, time) {
    var nodes = s.nodes;
    var edges = s.edges;
    var n = s.n;

    // Phase evolution
    for (var i = 0; i < n; i++) {
      nodes[i].phase += nodes[i].freq * dt;
    }

    // Kuramoto coupling along edges
    for (var e = 0; e < edges.length; e++) {
      var edge = edges[e];
      var a = nodes[edge.a], b = nodes[edge.b];
      var coupling = K * edge.weight * Math.sin(b.phase - a.phase) * 0.1;
      a.phase += coupling * dt;
      b.phase -= coupling * dt;
    }

    // Pulse
    s.pulseTimer -= dt;
    if (s.pulseTimer <= 0) {
      // Fire from mouse location or random
      if (mx > -9000) {
        var sW = 18, sH = 18;
        var scaleX = W/sW, scaleY = H/sH;
        var bestD = 999, bestI = 0;
        for (var i = 0; i < n; i++) {
          var sx = W/2 + nodes[i].x * scaleX * 0.8;
          var sy = H/2 + nodes[i].y * scaleY * 0.8;
          var d = dist(sx, sy, mx, my);
          if (d < bestD) { bestD = d; bestI = i; }
        }
        s.pulseOrigin = bestI;
      } else {
        s.pulseOrigin = Math.floor(Math.random() * n);
      }
      nodes[s.pulseOrigin].bright = 1;
      s.pulseActive = true;
      s.pulseTimer = 3 + Math.random() * 4;
    }

    // Propagate brightness
    if (s.pulseActive) {
      for (var e = 0; e < edges.length; e++) {
        var edge = edges[e];
        var a = nodes[edge.a], b = nodes[edge.b];
        if (a.bright > 0.1 && b.bright < a.bright * 0.6) {
          b.bright = Math.max(b.bright, a.bright * 0.55 * edge.weight);
        }
        if (b.bright > 0.1 && a.bright < b.bright * 0.6) {
          a.bright = Math.max(a.bright, b.bright * 0.55 * edge.weight);
        }
      }

      var anyActive = false;
      for (var i = 0; i < n; i++) {
        nodes[i].bright *= 0.93;
        if (nodes[i].bright > 0.01) anyActive = true;
      }
      if (!anyActive) s.pulseActive = false;
    }
  },

  draw: function(cx, s, W, H, pal, time) {
    var nodes = s.nodes;
    var edges = s.edges;
    var n = s.n;
    var scaleX = W / 18 * 0.8, scaleY = H / 18 * 0.8;
    var offX = W/2, offY = H/2;

    // Edges
    for (var e = 0; e < edges.length; e++) {
      var edge = edges[e];
      var a = nodes[edge.a], b = nodes[edge.b];
      var ax = offX + a.x * scaleX, ay = offY + a.y * scaleY;
      var bx = offX + b.x * scaleX, by = offY + b.y * scaleY;
      var sync = Math.abs(Math.cos(a.phase - b.phase));
      var bright = Math.max(a.bright, b.bright);
      var alpha = edge.weight * 0.08 * (0.3 + sync * 0.7) + bright * 0.3;

      var col = bright > 0.1 ? lerpColor(pal.dim, pal.glow, bright) : pal.dim;
      cx.beginPath();
      cx.moveTo(ax, ay);
      cx.lineTo(bx, by);
      cx.strokeStyle = rgba(col, alpha);
      cx.lineWidth = 0.5 + edge.weight * 1 + bright * 2;
      cx.stroke();
    }

    // Nodes
    for (var i = 0; i < n; i++) {
      var nd = nodes[i];
      var sx = offX + nd.x * scaleX, sy = offY + nd.y * scaleY;
      var sync = 0.5 + Math.abs(Math.cos(nd.phase)) * 0.5;
      var sz = 2 + nd.bright * 6;

      // Glow
      if (nd.bright > 0.05) {
        var glow = cx.createRadialGradient(sx, sy, 0, sx, sy, sz * 5);
        glow.addColorStop(0, rgba(pal.glow, nd.bright * 0.3));
        glow.addColorStop(1, rgba(pal.glow, 0));
        cx.fillStyle = glow;
        cx.fillRect(sx - sz*5, sy - sz*5, sz*10, sz*10);
      }

      cx.beginPath();
      cx.arc(sx, sy, sz, 0, TAU);
      var col = nd.bright > 0.1 ? lerpColor(nd.color, pal.glow, nd.bright) : nd.color;
      cx.fillStyle = rgba(col, sync * 0.7 + nd.bright * 0.3);
      cx.fill();
    }
  }
};


// ─────────────────────────────────────────────────────────
// 6. CREATION — 0+0=1, particles aggregating
// ─────────────────────────────────────────────────────────
VISUALIZATIONS.creation = {
  defaultN: 120,
  defaultK: 1.0,

  init: function(n, k, pal) {
    var particles = [];
    for (var i = 0; i < n; i++) {
      var a = Math.random() * TAU;
      var r = 3 + Math.random() * 8;
      particles.push({
        x: Math.cos(a) * r,
        y: Math.sin(a) * r,
        vx: (Math.random() - 0.5) * 0.05,
        vy: (Math.random() - 0.5) * 0.05,
        phase: Math.random() * TAU,
        mass: 0.5 + Math.random() * 0.5,
        coupled: false,
        partner: -1,
        color: pal.particles[i % pal.particles.length],
        born: i * 0.05
      });
    }
    return { particles: particles, n: n, coupledCount: 0, age: 0 };
  },

  step: function(s, dt, W, H, mx, my, mDown, K, time) {
    var p = s.particles;
    var n = s.n;
    s.age += dt;

    for (var i = 0; i < n; i++) {
      if (s.age < p[i].born) continue; // stagger entry

      p[i].phase += 0.5 * dt;
      var fx = 0, fy = 0;

      // Gravity toward center (gentle)
      var d2c = Math.sqrt(p[i].x*p[i].x + p[i].y*p[i].y);
      if (d2c > 0.1) {
        fx -= p[i].x / d2c * 0.005 * (1 + s.coupledCount / n * 0.5);
        fy -= p[i].y / d2c * 0.005 * (1 + s.coupledCount / n * 0.5);
      }

      // Pair coupling
      for (var j = 0; j < n; j++) {
        if (j === i || s.age < p[j].born) continue;
        var dx = p[j].x - p[i].x, dy = p[j].y - p[i].y;
        var d = Math.sqrt(dx*dx + dy*dy);
        if (d < 0.01) continue;

        // Attract when close
        if (d < 3) {
          var attract = K * 0.002 * p[i].mass * p[j].mass / (d + 0.5);
          fx += dx/d * attract;
          fy += dy/d * attract;

          // Coupling check
          if (d < 1 && !p[i].coupled && !p[j].coupled) {
            p[i].coupled = true;
            p[j].coupled = true;
            p[i].partner = j;
            p[j].partner = i;
            p[i].mass += p[j].mass * 0.3;
            p[j].mass += p[i].mass * 0.3;
            s.coupledCount += 2;
          }
        }

        // Separation at very close range
        if (d < 0.8) {
          var rep = 0.008 / (d*d);
          fx -= dx/d * rep;
          fy -= dy/d * rep;
        }
      }

      // Coupled pair orbit
      if (p[i].coupled && p[i].partner >= 0) {
        var partner = p[p[i].partner];
        var dx = partner.x - p[i].x, dy = partner.y - p[i].y;
        var d = Math.sqrt(dx*dx + dy*dy);
        if (d > 0.3) {
          // Tangential orbit force
          fx += -dy / d * 0.003;
          fy += dx / d * 0.003;
          // Elastic bond
          var ideal = 0.8;
          fx += dx/d * (d - ideal) * 0.01;
          fy += dy/d * (d - ideal) * 0.01;
        }
      }

      // Wander
      fx += (Math.random()-0.5) * 0.003;
      fy += (Math.random()-0.5) * 0.003;

      // Mouse
      if (mx > -9000) {
        var sW = 18, sH = 18;
        var smx = (mx / W - 0.5) * sW;
        var smy = (my / H - 0.5) * sH;
        var mdx = p[i].x - smx, mdy = p[i].y - smy;
        var md = Math.sqrt(mdx*mdx + mdy*mdy);
        if (md < 5 && md > 0.01) {
          fx += mdx/md * (mDown ? -0.02 : 0.01) * (1 - md/5);
          fy += mdy/md * (mDown ? -0.02 : 0.01) * (1 - md/5);
        }
      }

      p[i].vx = (p[i].vx + fx) * 0.97;
      p[i].vy = (p[i].vy + fy) * 0.97;
      p[i].x += p[i].vx;
      p[i].y += p[i].vy;
    }
  },

  draw: function(cx, s, W, H, pal, time) {
    var p = s.particles;
    var n = s.n;
    var scaleX = W / 18, scaleY = H / 18;
    var offX = W/2, offY = H/2;

    // Coupled bonds
    for (var i = 0; i < n; i++) {
      if (!p[i].coupled || p[i].partner < i) continue;
      if (s.age < p[i].born) continue;
      var j = p[i].partner;
      var ax = offX + p[i].x * scaleX, ay = offY + p[i].y * scaleY;
      var bx = offX + p[j].x * scaleX, by = offY + p[j].y * scaleY;

      // Bond glow
      var mx2 = (ax+bx)/2, my2 = (ay+by)/2;
      var glow = cx.createRadialGradient(mx2, my2, 0, mx2, my2, 15);
      glow.addColorStop(0, rgba(pal.glow, 0.08));
      glow.addColorStop(1, rgba(pal.glow, 0));
      cx.fillStyle = glow;
      cx.fillRect(mx2-15, my2-15, 30, 30);

      cx.beginPath();
      cx.moveTo(ax, ay);
      cx.lineTo(bx, by);
      cx.strokeStyle = rgba(pal.glow, 0.3);
      cx.lineWidth = 1;
      cx.stroke();
    }

    // Particles
    for (var i = 0; i < n; i++) {
      if (s.age < p[i].born) continue;
      var fadeIn = clamp((s.age - p[i].born) / 0.5, 0, 1);
      var sx = offX + p[i].x * scaleX;
      var sy = offY + p[i].y * scaleY;
      var sz = (1 + p[i].mass) * 1.5;
      var pulse = Math.sin(p[i].phase) * 0.3 + 0.7;

      // Glow for coupled
      if (p[i].coupled) {
        var glow = cx.createRadialGradient(sx, sy, 0, sx, sy, sz * 5);
        glow.addColorStop(0, rgba(pal.glow, 0.1 * fadeIn));
        glow.addColorStop(1, rgba(pal.glow, 0));
        cx.fillStyle = glow;
        cx.fillRect(sx - sz*5, sy - sz*5, sz*10, sz*10);
      }

      cx.beginPath();
      cx.arc(sx, sy, sz * fadeIn, 0, TAU);
      var col = p[i].coupled ? lerpColor(p[i].color, pal.glow, 0.3) : p[i].color;
      cx.fillStyle = rgba(col, pulse * 0.6 * fadeIn);
      cx.fill();
    }

    // Coupling counter
    cx.fillStyle = rgba(pal.glow, 0.4);
    cx.font = '11px "Courier New",monospace';
    cx.textAlign = 'center';
    cx.fillText(s.coupledCount + '/' + n + ' coupled', W/2, H - 20);
  }
};


// ─────────────────────────────────────────────────────────
// 7. FIELD — background field of distant particles + nebulae
// ─────────────────────────────────────────────────────────
VISUALIZATIONS.field = {
  defaultN: 100,
  defaultK: 0.5,

  init: function(n, k, pal, W, H) {
    var stars = [], nebulae = [];
    for (var i = 0; i < n; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.08,
        vy: (Math.random() - 0.5) * 0.08,
        size: Math.random() * 1.5 + 0.3,
        phase: Math.random() * 100,
        flicker: Math.random() * 0.5 + 0.3,
        base: Math.random() * 0.06 + 0.02,
        color: pal.particles[i % pal.particles.length],
        depth: 0.3 + Math.random() * 0.7
      });
    }
    // Nebulae — large soft regions
    for (var i = 0; i < 5; i++) {
      nebulae.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 80 + Math.random() * 200,
        vx: (Math.random() - 0.5) * 0.02,
        vy: (Math.random() - 0.5) * 0.02,
        color: pal.particles[Math.floor(Math.random() * pal.particles.length)],
        alpha: 0.01 + Math.random() * 0.015,
        phase: Math.random() * TAU
      });
    }
    return { stars: stars, nebulae: nebulae, n: n, parallaxX: 0, parallaxY: 0 };
  },

  step: function(s, dt, W, H, mx, my, mDown, K, time) {
    // Parallax from mouse
    if (mx > -9000) {
      s.parallaxX += ((mx / W - 0.5) * 10 - s.parallaxX) * 0.03;
      s.parallaxY += ((my / H - 0.5) * 10 - s.parallaxY) * 0.03;
    } else {
      s.parallaxX *= 0.98;
      s.parallaxY *= 0.98;
    }

    for (var i = 0; i < s.stars.length; i++) {
      var star = s.stars[i];
      star.x += star.vx + s.parallaxX * star.depth * 0.05;
      star.y += star.vy + s.parallaxY * star.depth * 0.05;
      // Wrap
      if (star.x < -20) star.x = W + 20;
      if (star.x > W + 20) star.x = -20;
      if (star.y < -20) star.y = H + 20;
      if (star.y > H + 20) star.y = -20;
    }
    for (var i = 0; i < s.nebulae.length; i++) {
      var nb = s.nebulae[i];
      nb.x += nb.vx + s.parallaxX * 0.02;
      nb.y += nb.vy + s.parallaxY * 0.02;
      // Soft wrap
      if (nb.x < -nb.r) nb.x = W + nb.r;
      if (nb.x > W + nb.r) nb.x = -nb.r;
      if (nb.y < -nb.r) nb.y = H + nb.r;
      if (nb.y > H + nb.r) nb.y = -nb.r;
    }
  },

  draw: function(cx, s, W, H, pal, time) {
    // Nebulae
    for (var i = 0; i < s.nebulae.length; i++) {
      var nb = s.nebulae[i];
      var breathe = 1 + Math.sin(time * 0.3 + nb.phase) * 0.15;
      var glow = cx.createRadialGradient(nb.x, nb.y, 0, nb.x, nb.y, nb.r * breathe);
      glow.addColorStop(0, rgba(nb.color, nb.alpha * 1.5));
      glow.addColorStop(0.4, rgba(nb.color, nb.alpha * 0.6));
      glow.addColorStop(1, rgba(nb.color, 0));
      cx.fillStyle = glow;
      cx.fillRect(nb.x - nb.r * breathe, nb.y - nb.r * breathe, nb.r * breathe * 2, nb.r * breathe * 2);
    }

    // Stars
    for (var i = 0; i < s.stars.length; i++) {
      var star = s.stars[i];
      var flick = Math.sin(time * star.flicker + star.phase) * Math.sin(time * star.flicker * PHI + star.phase * 0.7) * 0.5 + 0.5;
      var flare = Math.sin(time * 0.3 + star.phase * 3) > 0.97 ? 1.8 : 1.0;
      var alpha = star.base * flick * flare;

      // Core glow
      var gl = cx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 5);
      gl.addColorStop(0, rgba(star.color, alpha * 0.5));
      gl.addColorStop(0.4, rgba(star.color, alpha * 0.15));
      gl.addColorStop(1, rgba(star.color, 0));
      cx.fillStyle = gl;
      cx.fillRect(star.x - star.size * 5, star.y - star.size * 5, star.size * 10, star.size * 10);

      // Bright center
      cx.beginPath();
      cx.arc(star.x, star.y, star.size * 0.6, 0, TAU);
      cx.fillStyle = rgba(star.color, alpha * 1.5);
      cx.fill();
    }
  }
};


// ─────────────────────────────────────────────────────────
// 8. DANCE — two flocks orbiting each other. 1+1=3.
// ─────────────────────────────────────────────────────────
VISUALIZATIONS.dance = {
  defaultN: 80,
  defaultK: 1.868,

  init: function(n, k, pal, W, H) {
    var half = Math.floor(n / 2);
    var px = [], py = [], vx = [], vy = [];
    var phases = [], omega = [], colors = [], group = [];

    // Palette B for second flock
    var PALETTE_B = [
      [100,140,160],[120,130,145],[85,125,150],
      [140,155,165],[95,150,135],[110,120,140],
      [130,145,155],[75,135,145],[150,160,170],
      [90,115,135],[125,140,150],[105,130,155]
    ];

    for (var i = 0; i < n; i++) {
      var isA = i < half;
      var localIdx = isA ? i : (i - half);
      var localN = isA ? half : (n - half);
      var r = 0.5 + Math.sqrt(localIdx / localN) * 3;
      var a = localIdx * GA;
      var offsetX = isA ? -3 : 3;

      px.push(Math.cos(a) * r + offsetX);
      py.push(Math.sin(a) * r);
      vx.push((Math.random() - 0.5) * 0.01);
      vy.push((Math.random() - 0.5) * 0.01);
      phases.push(Math.random() * TAU);
      omega.push((0.3 + Math.random() * 0.5) * TAU);

      if (isA) {
        colors.push(pal.particles[localIdx % pal.particles.length]);
      } else {
        colors.push(PALETTE_B[localIdx % PALETTE_B.length]);
      }
      group.push(isA ? 0 : 1);
    }

    return {
      n: n, half: half, px: px, py: py, vx: vx, vy: vy,
      phases: phases, omega: omega, colors: colors, group: group,
      orbitAngle: 0, breathA: 0, breathB: Math.PI,
      RA: 0, RB: 0, RCross: 0,
      crossStrength: 0
    };
  },

  step: function(s, dt, W, H, mx, my, mDown, K, time) {
    var n = s.n;
    var half = s.half;
    s.orbitAngle += dt * 0.15;
    s.breathA += dt * 0.4;
    s.breathB += dt * 0.4;
    s.crossStrength = clamp(s.crossStrength + dt * 0.1, 0, 1);

    // Centers of mass per group
    var comAX = 0, comAY = 0, comBX = 0, comBY = 0;
    for (var i = 0; i < n; i++) {
      if (s.group[i] === 0) { comAX += s.px[i]; comAY += s.py[i]; }
      else { comBX += s.px[i]; comBY += s.py[i]; }
    }
    comAX /= half; comAY /= half;
    comBX /= (n - half); comBY /= (n - half);

    // Reactive breathing — when A contracts, B expands
    var breathA = 1 + Math.sin(s.breathA) * 0.1;
    var breathB = 1 - Math.sin(s.breathA) * 0.08;

    // Phase coupling
    var sumCosA = 0, sumSinA = 0, sumCosB = 0, sumSinB = 0;
    for (var i = 0; i < n; i++) {
      var coupling = 0;
      for (var j = Math.max(0, i - 15); j < Math.min(n, i + 15); j++) {
        if (j === i) continue;
        var dx = s.px[j] - s.px[i], dy = s.py[j] - s.py[i];
        if (dx*dx + dy*dy > 16) continue;
        var kVal = (s.group[i] === s.group[j]) ? K : K * 0.3 * s.crossStrength;
        coupling += kVal * Math.sin(s.phases[j] - s.phases[i]) / n * 3;
      }
      s.phases[i] += (s.omega[i] + coupling) * dt;

      if (s.group[i] === 0) { sumCosA += Math.cos(s.phases[i]); sumSinA += Math.sin(s.phases[i]); }
      else { sumCosB += Math.cos(s.phases[i]); sumSinB += Math.sin(s.phases[i]); }
    }
    s.RA = Math.sqrt(sumCosA*sumCosA + sumSinA*sumSinA) / half;
    s.RB = Math.sqrt(sumCosB*sumCosB + sumSinB*sumSinB) / (n - half);

    // Cross R
    var sumCosC = 0, sumSinC = 0;
    for (var i = 0; i < n; i++) { sumCosC += Math.cos(s.phases[i]); sumSinC += Math.sin(s.phases[i]); }
    s.RCross = Math.sqrt(sumCosC*sumCosC + sumSinC*sumSinC) / n;

    var simMX = (mx / W - 0.5) * 18;
    var simMY = (my / H - 0.5) * 18;

    for (var i = 0; i < n; i++) {
      var fx = 0, fy = 0;
      var myGroup = s.group[i];
      var myCom = myGroup === 0 ? [comAX, comAY] : [comBX, comBY];
      var otherCom = myGroup === 0 ? [comBX, comBY] : [comAX, comAY];
      var myBreath = myGroup === 0 ? breathA : breathB;

      // Cohesion to own group
      fx += (myCom[0] - s.px[i]) * 0.005;
      fy += (myCom[1] - s.py[i]) * 0.005;

      // Orbital force around the other group
      var toCom = [otherCom[0] - s.px[i], otherCom[1] - s.py[i]];
      var toComD = Math.sqrt(toCom[0]*toCom[0] + toCom[1]*toCom[1]);
      if (toComD > 0.1) {
        // Tangential
        fx += -toCom[1] / toComD * 0.002 * s.crossStrength;
        fy += toCom[0] / toComD * 0.002 * s.crossStrength;
        // Ideal distance
        var idealSep = 5;
        fx += toCom[0]/toComD * (toComD - idealSep) * 0.001;
        fy += toCom[1]/toComD * (toComD - idealSep) * 0.001;
      }

      // Breathing
      var bDir = Math.atan2(s.py[i] - myCom[1], s.px[i] - myCom[0]);
      fx += Math.cos(bDir) * (myBreath - 1) * 0.015;
      fy += Math.sin(bDir) * (myBreath - 1) * 0.015;

      // Separation from nearby same-group
      for (var j = Math.max(0, i - 10); j < Math.min(n, i + 10); j++) {
        if (j === i) continue;
        var dx = s.px[i] - s.px[j], dy = s.py[i] - s.py[j];
        var d2 = dx*dx + dy*dy;
        if (d2 < 1.2 && d2 > 0.001) {
          fx += dx * 0.008 / d2;
          fy += dy * 0.008 / d2;
        }
      }

      // Wander
      fx += (Math.random() - 0.5) * 0.005;
      fy += (Math.random() - 0.5) * 0.005;

      // Mouse
      if (mx > -9000) {
        var mdx = s.px[i] - simMX, mdy = s.py[i] - simMY;
        var md = Math.sqrt(mdx*mdx + mdy*mdy);
        if (md < 4 && md > 0.01) {
          fx += mdx/md * (mDown ? -0.02 : 0.01) * (1 - md/4);
          fy += mdy/md * (mDown ? -0.02 : 0.01) * (1 - md/4);
        }
      }

      // Boundary
      if (Math.abs(s.px[i]) > 8) fx -= s.px[i] * 0.01;
      if (Math.abs(s.py[i]) > 8) fy -= s.py[i] * 0.01;

      s.vx[i] = (s.vx[i] + fx) * 0.96;
      s.vy[i] = (s.vy[i] + fy) * 0.96;
      var spd = Math.sqrt(s.vx[i]*s.vx[i] + s.vy[i]*s.vy[i]);
      if (spd > 0.12) { s.vx[i] *= 0.12/spd; s.vy[i] *= 0.12/spd; }
      s.px[i] += s.vx[i];
      s.py[i] += s.vy[i];
    }
  },

  draw: function(cx, s, W, H, pal, time) {
    var n = s.n;
    var scaleX = W / 18, scaleY = H / 18;
    var offX = W/2, offY = H/2;
    var ROSE_GOLD = [210, 150, 120];

    // Cross-coupling glow (the 3)
    if (s.RCross > 0.2 && s.crossStrength > 0.5) {
      var comAX = 0, comAY = 0, comBX = 0, comBY = 0;
      for (var i = 0; i < n; i++) {
        var sx = offX + s.px[i] * scaleX;
        var sy = offY + s.py[i] * scaleY;
        if (s.group[i] === 0) { comAX += sx; comAY += sy; }
        else { comBX += sx; comBY += sy; }
      }
      comAX /= s.half; comAY /= s.half;
      comBX /= (n - s.half); comBY /= (n - s.half);
      var midX = (comAX + comBX) / 2;
      var midY = (comAY + comBY) / 2;
      var glow = cx.createRadialGradient(midX, midY, 0, midX, midY, 80);
      glow.addColorStop(0, rgba(ROSE_GOLD, s.RCross * 0.06));
      glow.addColorStop(1, rgba(ROSE_GOLD, 0));
      cx.fillStyle = glow;
      cx.fillRect(midX - 80, midY - 80, 160, 160);
    }

    // Connections
    for (var i = 0; i < n; i++) {
      for (var j = i + 1; j < Math.min(n, i + 20); j++) {
        var dx = s.px[j] - s.px[i], dy = s.py[j] - s.py[i];
        var d = Math.sqrt(dx*dx + dy*dy);
        if (d > 3) continue;
        var sync = Math.abs(Math.cos(s.phases[i] - s.phases[j]));
        var isCross = s.group[i] !== s.group[j];
        var alpha = (1 - d/3) * sync * (isCross ? 0.06 : 0.1);
        if (alpha < 0.003) continue;

        var col = isCross ? ROSE_GOLD : lerpColor(s.colors[i], s.colors[j], 0.5);
        cx.beginPath();
        cx.moveTo(offX + s.px[i] * scaleX, offY + s.py[i] * scaleY);
        cx.lineTo(offX + s.px[j] * scaleX, offY + s.py[j] * scaleY);
        cx.strokeStyle = rgba(col, alpha);
        cx.lineWidth = isCross ? 0.6 : 0.5;
        cx.stroke();
      }
    }

    // Nodes
    for (var i = 0; i < n; i++) {
      var sx = offX + s.px[i] * scaleX;
      var sy = offY + s.py[i] * scaleY;
      var sync = 0.5 + Math.abs(Math.cos(s.phases[i])) * 0.5;
      var sz = 1.8;

      // Glow
      var glow = cx.createRadialGradient(sx, sy, 0, sx, sy, sz * 4);
      glow.addColorStop(0, rgba(s.colors[i], 0.06 * sync));
      glow.addColorStop(1, rgba(s.colors[i], 0));
      cx.fillStyle = glow;
      cx.fillRect(sx - sz*4, sy - sz*4, sz*8, sz*8);

      cx.beginPath();
      cx.arc(sx, sy, sz, 0, TAU);
      cx.fillStyle = rgba(s.colors[i], sync * 0.7);
      cx.fill();
    }
  }
};


// ═══════════════════════════════════════════════════════════════════
// AUTO-INIT FROM SCRIPT TAG
// ═══════════════════════════════════════════════════════════════════
function autoInit() {
  var scripts = document.getElementsByTagName('script');
  var myScript = null;
  for (var i = scripts.length - 1; i >= 0; i--) {
    var src = scripts[i].getAttribute('src') || '';
    if (src.indexOf('viz.js') !== -1) {
      myScript = scripts[i];
      break;
    }
  }
  if (!myScript) return;

  var vizType = myScript.getAttribute('data-viz');
  if (!vizType) return; // no auto-init if no data-viz

  var opts = {
    type: vizType,
    n: myScript.getAttribute('data-n') ? parseInt(myScript.getAttribute('data-n')) : null,
    k: myScript.getAttribute('data-k') ? parseFloat(myScript.getAttribute('data-k')) : null,
    palette: myScript.getAttribute('data-palette') || 'ember',
    interactive: myScript.getAttribute('data-interactive') !== 'false',
    background: myScript.getAttribute('data-background') || 'false',
    fps: myScript.getAttribute('data-fps') || '60'
  };

  var containerId = myScript.getAttribute('data-container');
  if (containerId) {
    opts.container = containerId;
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { createInstance(opts); });
  } else {
    createInstance(opts);
  }
}

// ═══ PUBLIC API ═══
root.GUMP = {
  create: createInstance,
  palettes: PALETTES,
  PHI: PHI,
  GA: GA,
  K_STAR: K_STAR,
  version: '1.0.0'
};

autoInit();

})(typeof window !== 'undefined' ? window : this);
