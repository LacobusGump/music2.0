// ═══════════════════════════════════════════════════════════════
// TRANSIT — page transitions via particle dissolve
//
// Rule: NEVER modify .page styles. The canvas covers everything.
// No DOM mutation = no bfcache problems = back button always works.
// ═══════════════════════════════════════════════════════════════

(function() {
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var canvas, ctx, dpr;

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

  // Render card text to offscreen canvas, sample non-black pixels as particles
  function textToParticles(el) {
    var rect = el.getBoundingClientRect();
    var tmp = document.createElement('canvas');
    var w = Math.ceil(rect.width), h = Math.ceil(rect.height);
    tmp.width = w; tmp.height = h;
    var tc = tmp.getContext('2d');

    tc.fillStyle = '#08080d';
    tc.fillRect(0, 0, w, h);

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
        if (tc.measureText(test).width > mw && line) { tc.fillText(line, 20, y); line = words[i] + ' '; y += 17; if (y > h - 8) break; }
        else line = test;
      }
      if (line) tc.fillText(line, 20, y);
    }

    var img = tc.getImageData(0, 0, w, h), data = img.data, pts = [], step = 3;
    for (var y = 0; y < h; y += step) {
      for (var x = 0; x < w; x += step) {
        var i = (y * w + x) * 4;
        if (data[i] + data[i+1] + data[i+2] < 30) continue;
        pts.push({
          x: rect.left + x, y: rect.top + y,
          vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
          r: data[i], g: data[i+1], b: data[i+2],
          phase: Math.random() * 6.28, life: 1, size: 1.5
        });
      }
    }
    return pts;
  }

  function dissolve(el, href) {
    init();
    var particles = textToParticles(el);
    if (!particles.length) { window.location.href = href; return; }

    var W = window.innerWidth, H = window.innerHeight;
    var cx = W / 2, cy = H / 2;

    // Push particles toward center
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i], dx = cx - p.x, dy = cy - p.y, d = Math.sqrt(dx*dx+dy*dy) || 1;
      p.vx += dx / d * 3;
      p.vy += dy / d * 3;
    }

    // Show canvas with opaque background — this COVERS the page
    canvas.style.display = 'block';
    // Draw initial frame with background to hide page immediately
    ctx.fillStyle = '#08080d';
    ctx.fillRect(0, 0, W, H);

    var t0 = performance.now(), dur = 700;

    function frame(now) {
      var t = Math.min(1, (now - t0) / dur);
      // Opaque background — page is hidden by the canvas, not by opacity
      ctx.fillStyle = '#08080d';
      ctx.fillRect(0, 0, W, H);

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        if (t < 0.35) {
          p.x += p.vx * 1.2; p.y += p.vy * 1.2;
        } else if (t < 0.65) {
          p.vx += (cx - p.x) * 0.01; p.vy += (cy - p.y) * 0.01;
          p.vx *= 0.96; p.vy *= 0.96;
          p.x += p.vx; p.y += p.vy;
          p.phase += 0.3;
          p.size = 1.2 + Math.sin(p.phase) * 0.4;
        } else {
          p.x += (cx - p.x) * 0.12; p.y += (cy - p.y) * 0.12;
          p.life = 1 - (t - 0.65) / 0.35;
          p.size = p.life * 1.5;
        }
        if (p.life <= 0) continue;

        var shimmer = (t > 0.3 && t < 0.7) ? Math.sin(p.phase) * 0.5 + 0.5 : 0;
        ctx.fillStyle = 'rgba(' +
          Math.round(p.r*(1-shimmer) + 201*shimmer) + ',' +
          Math.round(p.g*(1-shimmer) + 164*shimmer) + ',' +
          Math.round(p.b*(1-shimmer) + 74*shimmer) + ',' +
          (p.life * 0.9) + ')';
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }

      // Gold flash at peak
      if (t > 0.42 && t < 0.55) {
        ctx.fillStyle = 'rgba(201,164,74,' + ((1 - Math.abs(t-0.48)/0.06) * 0.07) + ')';
        ctx.fillRect(0, 0, W, H);
      }

      if (t < 1) requestAnimationFrame(frame);
      else window.location.href = href;
    }
    requestAnimationFrame(frame);
  }

  // ═══ ASSEMBLY on destination ═══
  function assemble() {
    var flag = false;
    try { flag = sessionStorage.getItem('transit'); sessionStorage.removeItem('transit'); } catch(e) {}
    if (!flag) return;

    init();
    var page = document.querySelector('.page');
    if (!page) return;

    var W = window.innerWidth, H = window.innerHeight, cx = W/2, cy = H/2;
    var els = page.querySelectorAll('h1, h2, p, .result, .ref, .sub, .price-tag');
    var pts = [];

    for (var e = 0; e < els.length; e++) {
      var rect = els[e].getBoundingClientRect();
      if (rect.top > H * 1.5) continue;
      var cs = window.getComputedStyle(els[e]);
      var rgb = (cs.color || '').match(/\d+/g) || [200,200,200];
      var n = Math.min(60, Math.max(1, Math.floor(rect.width * rect.height / 300)));
      for (var i = 0; i < n; i++) {
        pts.push({
          tx: rect.left + Math.random() * rect.width,
          ty: rect.top + Math.random() * rect.height,
          x: cx + (Math.random()-0.5)*30, y: cy + (Math.random()-0.5)*30,
          r: +rgb[0], g: +rgb[1], b: +rgb[2],
          delay: e * 0.015 + Math.random() * 0.08,
          life: 1, size: 1.5
        });
      }
    }

    if (!pts.length) return;

    // Canvas covers page during assembly
    canvas.style.display = 'block';
    page.style.visibility = 'hidden';

    var t0 = performance.now(), dur = 500;

    function frame(now) {
      var t = Math.min(1, (now - t0) / dur);
      ctx.fillStyle = '#08080d';
      ctx.fillRect(0, 0, W, H);

      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        var pt = Math.max(0, Math.min(1, (t - p.delay) / (0.85 - p.delay)));
        if (pt <= 0) continue;
        var ease = 1 - Math.pow(1 - pt, 3);
        var x = cx + (p.tx - cx) * ease;
        var y = cy + (p.ty - cy) * ease;
        var alpha = pt < 0.7 ? 0.9 : 0.9 * (1 - (pt-0.7)/0.3);
        var shimmer = pt < 0.5 ? 1 - pt/0.5 : 0;

        ctx.fillStyle = 'rgba(' +
          Math.round(p.r*(1-shimmer)+201*shimmer) + ',' +
          Math.round(p.g*(1-shimmer)+164*shimmer) + ',' +
          Math.round(p.b*(1-shimmer)+74*shimmer) + ',' + alpha + ')';
        ctx.fillRect(x, y, 1.5, 1.5);
      }

      if (t >= 0.5 && page.style.visibility === 'hidden') {
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

  // Set transit flag just before navigating
  function setFlag() {
    try { sessionStorage.setItem('transit', '1'); } catch(e) {}
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
          setFlag();
          dissolve(link, href);
        });
      })(links[i]);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
