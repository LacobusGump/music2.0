// ═══════════════════════════════════════════════════════════════
// TRANSIT — page transitions as thermodynamics
//
// Not scatter-converge-reassemble. That's a video game.
// This is a paint job:
//   1. FLASH — surface tension breaks, card lifts
//   2. FLOW — particles follow the gradient, find position
//   3. CURE — content resolves coarse to sharp (L → h → C)
//
// Same physics as the A-Way:
//   - Orange peel = quench (don't cool too fast)
//   - Tinting = gradient descent (one variable at a time)
//   - Wet sanding = frequency filtering (coarse → fine)
//   - Pearl = wave interference (angle determines what you see)
//
// Never touch .page styles. Canvas IS the surface.
// ═══════════════════════════════════════════════════════════════

(function() {
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var canvas, ctx, dpr;
  var BG = [8, 8, 13]; // #08080d

  function init() {
    if (canvas) return;
    dpr = devicePixelRatio || 1;
    canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;pointer-events:none;display:none;';
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }

  function resize() {
    if (!canvas) return;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ═══ SAMPLE — read the card's surface ═══
  // Like measuring ΔE before you spray
  function sampleCard(el) {
    var rect = el.getBoundingClientRect();
    var tmp = document.createElement('canvas');
    var w = Math.ceil(rect.width), h = Math.ceil(rect.height);
    tmp.width = w; tmp.height = h;
    var tc = tmp.getContext('2d');

    // Render the card background
    tc.fillStyle = '#0d0d14';
    tc.fillRect(0, 0, w, h);

    // Render text content
    var title = el.querySelector('.name');
    var pitch = el.querySelector('.pitch');
    var price = el.querySelector('.price');

    if (title) {
      tc.fillStyle = '#c9a44a';
      tc.font = '200 16px Georgia';
      tc.fillText(title.textContent, 20, 24);
    }
    if (price) {
      tc.fillStyle = '#4a9';
      tc.font = '14px Georgia';
      tc.fillText(price.textContent, w - tc.measureText(price.textContent).width - 20, 24);
    }
    if (pitch) {
      tc.fillStyle = '#aaa';
      tc.font = '13px Georgia';
      var words = pitch.textContent.split(' '), line = '', y = 44, mw = w - 40;
      for (var i = 0; i < words.length; i++) {
        var test = line + words[i] + ' ';
        if (tc.measureText(test).width > mw && line) {
          tc.fillText(line, 20, y); line = words[i] + ' '; y += 17;
          if (y > h - 8) break;
        } else line = test;
      }
      if (line) tc.fillText(line, 20, y);
    }

    // Sample — every lit pixel becomes a droplet
    var img = tc.getImageData(0, 0, w, h), data = img.data;
    var pts = [], step = 3;
    for (var py = 0; py < h; py += step) {
      for (var px = 0; px < w; px += step) {
        var i = (py * w + px) * 4;
        if (data[i] + data[i+1] + data[i+2] < 30) continue;
        pts.push({
          // Position on screen
          x: rect.left + px,
          y: rect.top + py,
          // Home position (for flow back)
          hx: rect.left + px,
          hy: rect.top + py,
          // Color channels (L, h, C in spirit — r,g,b in practice)
          r: data[i], g: data[i+1], b: data[i+2],
          // Luminance (L channel — resolves first)
          L: (data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114) / 255,
          // Physics
          vx: 0, vy: 0,
          settled: false,
        });
      }
    }
    return { particles: pts, rect: rect };
  }

  // ═══ DISSOLVE — the flash + flow out ═══
  function dissolve(el, href) {
    init();
    var sample = sampleCard(el);
    var pts = sample.particles;
    if (!pts.length) { window.location.href = href; return; }

    var W = window.innerWidth, H = window.innerHeight;
    var rect = sample.rect;
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;

    canvas.style.display = 'block';

    // Phase 1: FLASH — surface tension breaks
    // Particles drift outward from card center, slowly, like paint lifting
    // High-L particles move first (brightest = most energy = gold text)
    // Low-L particles follow (darker text = less energy = moves later)

    var t0 = performance.now(), dur = 650;

    function frame(now) {
      var t = Math.min(1, (now - t0) / dur);

      // Background anneals from transparent to opaque
      // Like the booth filling with coverage
      var bgAlpha = Math.min(1, t * 2.5);
      ctx.fillStyle = 'rgba(' + BG[0] + ',' + BG[1] + ',' + BG[2] + ',' + bgAlpha + ')';
      ctx.fillRect(0, 0, W, H);

      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];

        // Each particle's activation time depends on its L
        // Bright particles (gold, green) activate first
        // Dark particles (gray text) activate later
        // This is L → h → C ordering
        var activation = t - (1 - p.L) * 0.25;
        if (activation < 0) {
          // Not yet activated — draw at home position
          ctx.fillStyle = 'rgba(' + p.r + ',' + p.g + ',' + p.b + ',0.9)';
          ctx.fillRect(p.x, p.y, 1.5, 1.5);
          continue;
        }

        var at = Math.min(1, activation / 0.6); // local time 0-1

        if (at < 0.5) {
          // FLASH — gentle drift outward from card center
          // Not explosion. Surface tension releasing.
          var angle = Math.atan2(p.hy - cy, p.hx - cx);
          var drift = at * 30; // gentle
          p.x = p.hx + Math.cos(angle) * drift + Math.sin(at * 3 + p.L * 5) * 3;
          p.y = p.hy + Math.sin(angle) * drift + Math.cos(at * 3 + p.L * 5) * 3;

          // Color shifts toward gold during flash (pearl interference)
          var pearl = Math.sin(at * Math.PI) * 0.6;
          var r = Math.round(p.r * (1 - pearl) + 201 * pearl);
          var g = Math.round(p.g * (1 - pearl) + 164 * pearl);
          var b = Math.round(p.b * (1 - pearl) + 74 * pearl);
          ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',0.9)';
        } else {
          // FLOW — particles follow gradient toward screen center
          // Like droplets merging. Not snapping. Flowing.
          var ft = (at - 0.5) / 0.5;
          var ease = ft * ft * (3 - 2 * ft); // smoothstep
          p.x = p.x + (W / 2 - p.x) * ease * 0.15;
          p.y = p.y + (H / 2 - p.y) * ease * 0.15;

          // Fade as they approach center
          var alpha = 1 - ft * 0.7;
          // Gold shimmer fading
          var pearl = (1 - ft) * 0.4;
          var r = Math.round(p.r * (1 - pearl) + 201 * pearl);
          var g = Math.round(p.g * (1 - pearl) + 164 * pearl);
          var b = Math.round(p.b * (1 - pearl) + 74 * pearl);
          ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + (alpha * 0.9) + ')';
        }

        ctx.fillRect(p.x, p.y, 1.5, 1.5);
      }

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        try { sessionStorage.setItem('transit', '1'); } catch(e) {}
        window.location.href = href;
      }
    }

    requestAnimationFrame(frame);
  }

  // ═══ ASSEMBLY — the cure ═══
  // Content resolves from coarse to sharp, like crosslinks forming
  function assemble() {
    var flag = false;
    try { flag = sessionStorage.getItem('transit'); sessionStorage.removeItem('transit'); } catch(e) {}
    if (!flag) return;

    init();
    var page = document.querySelector('.page');
    if (!page) return;

    var W = window.innerWidth, H = window.innerHeight;

    // Sample destination content
    var els = page.querySelectorAll('h1, h2, p, .result, .ref, .sub, .price-tag, .finding, .meta, .stats, .bench, .feat-item');
    var pts = [];

    for (var e = 0; e < els.length; e++) {
      var rect = els[e].getBoundingClientRect();
      if (rect.top > H * 1.5 || rect.height === 0) continue;
      var cs = window.getComputedStyle(els[e]);
      var rgb = (cs.color || '').match(/\d+/g) || [200, 200, 200];
      var r = +rgb[0], g = +rgb[1], b = +rgb[2];
      var L = (r * 0.299 + g * 0.587 + b * 0.114) / 255;

      var n = Math.min(50, Math.max(1, Math.floor(rect.width * rect.height / 400)));
      for (var i = 0; i < n; i++) {
        pts.push({
          // Target (where it cures to)
          tx: rect.left + Math.random() * rect.width,
          ty: rect.top + Math.random() * rect.height,
          // Start from center (where the flow converged)
          x: W / 2 + (Math.random() - 0.5) * 20,
          y: H / 2 + (Math.random() - 0.5) * 20,
          r: r, g: g, b: b, L: L,
          // Cure delay: bright elements cure first (L → h → C)
          delay: (1 - L) * 0.2 + e * 0.01,
        });
      }
    }

    if (!pts.length) return;

    canvas.style.display = 'block';
    page.style.visibility = 'hidden';

    var t0 = performance.now(), dur = 500;

    function frame(now) {
      var t = Math.min(1, (now - t0) / dur);

      // Background: starts opaque, anneals to transparent
      // Like clear coat curing — you see through it as it sets
      var bgAlpha = 1 - t * t; // quadratic fade — slow start, fast finish
      ctx.fillStyle = 'rgba(' + BG[0] + ',' + BG[1] + ',' + BG[2] + ',' + bgAlpha + ')';
      ctx.fillRect(0, 0, W, H);

      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        var pt = Math.max(0, (t - p.delay) / (0.9 - p.delay));
        if (pt <= 0) continue;
        pt = Math.min(1, pt);

        // Smoothstep easing — like droplets finding their level
        var ease = pt * pt * (3 - 2 * pt);

        var x = W/2 + (p.tx - W/2) * ease;
        var y = H/2 + (p.ty - H/2) * ease;

        // Color cures: starts gold (pearl flash), settles to true color
        var pearl = Math.max(0, 1 - pt * 2);
        var cr = Math.round(p.r * (1 - pearl) + 201 * pearl);
        var cg = Math.round(p.g * (1 - pearl) + 164 * pearl);
        var cb = Math.round(p.b * (1 - pearl) + 74 * pearl);

        // Alpha: visible during flight, fades as real content appears
        var alpha = pt < 0.6 ? 0.85 : 0.85 * (1 - (pt - 0.6) / 0.4);

        ctx.fillStyle = 'rgba(' + cr + ',' + cg + ',' + cb + ',' + alpha + ')';
        ctx.fillRect(x, y, 1.5, 1.5);
      }

      // Reveal real page as particles settle
      if (t >= 0.35 && page.style.visibility === 'hidden') {
        page.style.visibility = 'visible';
      }

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        canvas.style.display = 'none';
        page.style.visibility = 'visible';
      }
    }

    requestAnimationFrame(frame);
  }

  // ═══ BOOT ═══
  function boot() {
    init();
    assemble();

    var links = document.querySelectorAll('a.product, a.card, a.harmonia-section');
    for (var i = 0; i < links.length; i++) {
      (function(link) {
        link.addEventListener('click', function(e) {
          var href = link.getAttribute('href');
          if (!href || href === '#' || href.indexOf('http') === 0) return;
          e.preventDefault();
          dissolve(link, href);
        });
      })(links[i]);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
