// ═══════════════════════════════════════════════════════════════
// TRANSIT — the "wait wtf" moment between pages
//
// When you click a card, the text dissolves into particles,
// flows through a computation state, then navigates.
// The destination page catches the particles and assembles.
//
// This is shape computing on the page itself.
// The text IS the sequence. The transition IS the fold.
// ═══════════════════════════════════════════════════════════════

(function() {
  'use strict';

  // Skip on reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var canvas, ctx, particles, animating = false, targetHref = '';

  function init() {
    canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;pointer-events:none;opacity:0;transition:opacity 0.15s;';
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }

  function resize() {
    if (!canvas) return;
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);
  }

  // Extract text pixels from an element — shape compute the card
  function extractParticles(el) {
    var rect = el.getBoundingClientRect();
    var pts = [];

    // Create offscreen canvas, render the element's text as pixels
    var tmp = document.createElement('canvas');
    var w = Math.ceil(rect.width), h = Math.ceil(rect.height);
    tmp.width = w * 2; tmp.height = h * 2;
    var tc = tmp.getContext('2d');
    tc.scale(2, 2);

    // Draw the card's text content
    tc.fillStyle = '#08080d';
    tc.fillRect(0, 0, w, h);

    // Get computed styles from the card
    var title = el.querySelector('.name');
    var pitch = el.querySelector('.pitch');
    var price = el.querySelector('.price');

    // Title
    if (title) {
      tc.fillStyle = '#c9a44a';
      tc.font = '200 17px Georgia';
      tc.fillText(title.textContent, 22, 28);
    }
    // Price
    if (price) {
      tc.fillStyle = '#4a9';
      tc.font = '14px Georgia';
      tc.fillText(price.textContent, w - tc.measureText(price.textContent).width - 22, 28);
    }
    // Pitch text — wrap manually
    if (pitch) {
      tc.fillStyle = '#aaa';
      tc.font = '13px Georgia';
      var words = pitch.textContent.split(' ');
      var line = '', y = 50, maxW = w - 44;
      for (var i = 0; i < words.length; i++) {
        var test = line + words[i] + ' ';
        if (tc.measureText(test).width > maxW && line) {
          tc.fillText(line, 22, y);
          line = words[i] + ' ';
          y += 18;
          if (y > h - 10) break;
        } else {
          line = test;
        }
      }
      if (line) tc.fillText(line, 22, y);
    }

    // Sample pixels — every pixel that isn't background becomes a particle
    var imgData = tc.getImageData(0, 0, tmp.width, tmp.height);
    var data = imgData.data;
    var step = 3; // sample every 3rd pixel for performance

    for (var y = 0; y < tmp.height; y += step) {
      for (var x = 0; x < tmp.width; x += step) {
        var i = (y * tmp.width + x) * 4;
        var r = data[i], g = data[i+1], b = data[i+2];
        // Skip near-black (background)
        if (r + g + b < 30) continue;

        pts.push({
          // Start position (where the card is on screen)
          x: rect.left + x / 2,
          y: rect.top + y / 2,
          // Store original position for assembly on other end
          ox: x / 2,
          oy: y / 2,
          // Velocity (will be set during dissolve)
          vx: 0,
          vy: 0,
          // Color from the rendered text
          r: r, g: g, b: b,
          // Life
          life: 1,
          size: 1.5,
          // Phase (for computation state shimmer)
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    return pts;
  }

  // The dissolve animation
  function dissolve(el, href) {
    if (animating) return;
    animating = true;
    targetHref = href;

    particles = extractParticles(el);
    if (particles.length === 0) {
      window.location.href = href;
      return;
    }

    canvas.style.opacity = '1';

    // Center of screen — the convergence point
    var cx = window.innerWidth / 2;
    var cy = window.innerHeight / 2;

    // Give each particle a velocity toward center with spread
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var dx = cx - p.x, dy = cy - p.y;
      var dist = Math.sqrt(dx * dx + dy * dy) || 1;
      // Velocity toward center + random spread
      p.vx = dx / dist * (2 + Math.random() * 3) + (Math.random() - 0.5) * 4;
      p.vy = dy / dist * (2 + Math.random() * 3) + (Math.random() - 0.5) * 4;
    }

    // Fade the page content
    var pageEl = document.querySelector('.page');
    if (pageEl) {
      pageEl.style.transition = 'opacity 0.3s';
      pageEl.style.opacity = '0';
    }

    var startTime = performance.now();
    var duration = 800; // ms

    function frame(now) {
      var t = Math.min(1, (now - startTime) / duration);
      ctx.clearRect(0, 0, canvas.width / devicePixelRatio, canvas.height / devicePixelRatio);

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];

        // Phase 1 (0-0.4): dissolve — particles scatter from card
        // Phase 2 (0.4-0.7): compute — particles shimmer, converge toward center
        // Phase 3 (0.7-1.0): tunnel — particles stream toward center and fade

        if (t < 0.4) {
          // Scatter
          p.x += p.vx * 1.5;
          p.y += p.vy * 1.5;
          p.size = 1.5;
        } else if (t < 0.7) {
          // Compute state — shimmer and converge
          var cx2 = window.innerWidth / 2;
          var cy2 = window.innerHeight / 2;
          p.vx += (cx2 - p.x) * 0.008;
          p.vy += (cy2 - p.y) * 0.008;
          p.vx *= 0.97;
          p.vy *= 0.97;
          p.x += p.vx;
          p.y += p.vy;
          // Shimmer — color flickers between gold and original
          p.phase += 0.3;
          p.size = 1 + Math.sin(p.phase) * 0.5;
        } else {
          // Tunnel — converge and shrink
          var cx2 = window.innerWidth / 2;
          var cy2 = window.innerHeight / 2;
          p.x += (cx2 - p.x) * 0.1;
          p.y += (cy2 - p.y) * 0.1;
          p.life = 1 - (t - 0.7) / 0.3;
          p.size = p.life * 1.5;
        }

        if (p.life <= 0 || p.size <= 0) continue;

        // Draw
        var shimmer = t > 0.35 && t < 0.75 ? Math.sin(p.phase) * 0.5 + 0.5 : 0;
        var r = Math.round(p.r * (1 - shimmer) + 201 * shimmer);
        var g = Math.round(p.g * (1 - shimmer) + 164 * shimmer);
        var b = Math.round(p.b * (1 - shimmer) + 74 * shimmer);

        ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + (p.life * 0.9) + ')';
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }

      // Brief flash at the computation peak (t ≈ 0.5)
      if (t > 0.45 && t < 0.55) {
        var flash = 1 - Math.abs(t - 0.5) / 0.05;
        ctx.fillStyle = 'rgba(201,164,74,' + (flash * 0.06) + ')';
        ctx.fillRect(0, 0, canvas.width / devicePixelRatio, canvas.height / devicePixelRatio);
      }

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        // Navigate
        // Store a flag so the destination page knows to run assembly
        try { sessionStorage.setItem('transit', '1'); } catch(e) {}
        window.location.href = targetHref;
      }
    }

    requestAnimationFrame(frame);
  }

  // ═══ ASSEMBLY — the destination page catches the particles ═══
  // Called on page load if transit flag is set
  function assemble() {
    var hasTransit = false;
    try { hasTransit = sessionStorage.getItem('transit'); sessionStorage.removeItem('transit'); } catch(e) {}
    if (!hasTransit) return;

    var page = document.querySelector('.page');
    if (!page) return;

    // Hide page, show canvas
    page.style.opacity = '0';
    page.style.transition = 'none';

    if (!canvas) init();
    canvas.style.opacity = '1';

    // Generate particles from the destination page content
    // Sample visible text positions
    var textEls = page.querySelectorAll('h1, h2, p, .result, .ref, .feat-item, .price-tag, .sub, .bench');
    var pts = [];

    for (var e = 0; e < textEls.length; e++) {
      var rect = textEls[e].getBoundingClientRect();
      if (rect.top > window.innerHeight * 1.5) continue; // skip offscreen

      var text = textEls[e].textContent || '';
      var style = window.getComputedStyle(textEls[e]);
      var color = style.color || 'rgb(200,200,200)';
      var rgb = color.match(/\d+/g) || [200, 200, 200];

      // Generate particles along the text area
      var density = Math.max(1, Math.floor(rect.width * rect.height / 200));
      for (var i = 0; i < Math.min(density, 80); i++) {
        pts.push({
          // Target position (where it should end up)
          tx: rect.left + Math.random() * rect.width,
          ty: rect.top + Math.random() * rect.height,
          // Start from center
          x: window.innerWidth / 2 + (Math.random() - 0.5) * 40,
          y: window.innerHeight / 2 + (Math.random() - 0.5) * 40,
          r: parseInt(rgb[0]), g: parseInt(rgb[1]), b: parseInt(rgb[2]),
          life: 1,
          size: 1.5,
          phase: Math.random() * Math.PI * 2,
          delay: e * 0.02 + Math.random() * 0.1, // stagger by element
        });
      }
    }

    if (pts.length === 0) {
      page.style.transition = 'opacity 0.4s';
      page.style.opacity = '1';
      canvas.style.opacity = '0';
      return;
    }

    particles = pts;
    var startTime = performance.now();
    var duration = 600;

    function frame(now) {
      var t = Math.min(1, (now - startTime) / duration);
      ctx.clearRect(0, 0, canvas.width / devicePixelRatio, canvas.height / devicePixelRatio);

      var allDone = true;

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        var pt = Math.max(0, Math.min(1, (t - p.delay) / (1 - p.delay)));

        if (pt <= 0) { allDone = false; continue; }

        // Ease out cubic
        var ease = 1 - Math.pow(1 - pt, 3);

        p.x = window.innerWidth / 2 + (p.tx - window.innerWidth / 2) * ease;
        p.y = window.innerHeight / 2 + (p.ty - window.innerHeight / 2) * ease;
        p.life = pt < 0.8 ? 1 : 1 - (pt - 0.8) / 0.2;
        p.size = 1.5 * (pt < 0.8 ? 1 : p.life);

        if (p.life <= 0) continue;
        allDone = false;

        // Shimmer gold during flight, settle to target color
        var shimmer = pt < 0.6 ? 1 - pt / 0.6 : 0;
        var r = Math.round(p.r * (1 - shimmer) + 201 * shimmer);
        var g = Math.round(p.g * (1 - shimmer) + 164 * shimmer);
        var b = Math.round(p.b * (1 - shimmer) + 74 * shimmer);

        ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + (p.life * 0.8) + ')';
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }

      if (t >= 0.4 && page.style.opacity === '0') {
        // Start fading in the real page underneath
        page.style.transition = 'opacity 0.5s';
        page.style.opacity = '1';
      }

      if (t < 1 || !allDone) {
        requestAnimationFrame(frame);
      } else {
        canvas.style.opacity = '0';
        animating = false;
      }
    }

    requestAnimationFrame(frame);
  }

  // ═══ RESTORE — handle back/forward navigation ═══
  // Multiple strategies because browsers are inconsistent with bfcache
  function restore() {
    animating = false;
    var page = document.querySelector('.page');
    if (page) { page.style.cssText += ';opacity:1!important;transition:none!important;'; }
    if (canvas) canvas.style.opacity = '0';
  }
  window.addEventListener('pageshow', restore);
  window.addEventListener('popstate', restore);
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) restore();
  });

  // ═══ BOOT ═══
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  function boot() {
    init();

    // Check if we're assembling (arrived from a transition)
    assemble();

    // Intercept product/research link clicks
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
})();
