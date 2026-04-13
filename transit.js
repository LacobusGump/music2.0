// ═══════════════════════════════════════════════════════════════
// TRANSIT — page transitions as thermodynamics
//
// A paint job, not a video game:
//   1. FLASH — surface tension breaks, bright particles lift first
//   2. FLOW — droplets follow gradient, merge toward center
//   3. CURE — content resolves coarse to sharp (L → h → C)
//
// RULES:
//   - Never modify .page opacity (breaks bfcache)
//   - Canvas covers via opaque background, not by hiding content
//   - Transit flag stores the TARGET URL, not just a boolean
//   - Assembly only runs if current URL matches the flag
//   - Back button = fresh state, always
// ═══════════════════════════════════════════════════════════════

(function() {
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var canvas, ctx, dpr;
  var BG = [8, 8, 13];

  function init() {
    if (canvas) return;
    dpr = devicePixelRatio || 1;
    canvas = document.createElement('canvas');
    canvas.id = 'transit-canvas';
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

  function cleanup() {
    var old = document.getElementById('transit-canvas');
    if (old) old.remove();
    canvas = null; ctx = null;
    var page = document.querySelector('.page');
    if (page) page.style.visibility = 'visible';
  }

  // ═══ SAMPLE — read the card's pixels ═══
  function sampleCard(el) {
    var rect = el.getBoundingClientRect();
    var tmp = document.createElement('canvas');
    var w = Math.ceil(rect.width), h = Math.ceil(rect.height);
    tmp.width = w; tmp.height = h;
    var tc = tmp.getContext('2d');

    tc.fillStyle = '#0d0d14';
    tc.fillRect(0, 0, w, h);

    var title = el.querySelector('.name');
    var pitch = el.querySelector('.pitch');
    var price = el.querySelector('.price');

    if (title) { tc.fillStyle = '#c9a44a'; tc.font = '200 16px Georgia'; tc.fillText(title.textContent, 20, 24); }
    if (price) { tc.fillStyle = '#4a9'; tc.font = '14px Georgia'; tc.fillText(price.textContent, w - tc.measureText(price.textContent).width - 20, 24); }
    if (pitch) {
      tc.fillStyle = '#aaa'; tc.font = '13px Georgia';
      var words = pitch.textContent.split(' '), line = '', y = 44, mw = w - 40;
      for (var i = 0; i < words.length; i++) {
        var test = line + words[i] + ' ';
        if (tc.measureText(test).width > mw && line) { tc.fillText(line, 20, y); line = words[i] + ' '; y += 17; if (y > h - 8) break; }
        else line = test;
      }
      if (line) tc.fillText(line, 20, y);
    }

    var img = tc.getImageData(0, 0, w, h), data = img.data, pts = [], step = 3;
    for (var py = 0; py < h; py += step) {
      for (var px = 0; px < w; px += step) {
        var i = (py * w + px) * 4;
        if (data[i] + data[i+1] + data[i+2] < 30) continue;
        var L = (data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114) / 255;
        pts.push({ x: rect.left+px, y: rect.top+py, hx: rect.left+px, hy: rect.top+py, r: data[i], g: data[i+1], b: data[i+2], L: L });
      }
    }
    return { particles: pts, rect: rect };
  }

  // ═══ DISSOLVE ═══
  function dissolve(el, href) {
    init();
    var sample = sampleCard(el);
    var pts = sample.particles;
    if (!pts.length) { go(href); return; }

    var W = window.innerWidth, H = window.innerHeight;
    var cx = sample.rect.left + sample.rect.width / 2;
    var cy = sample.rect.top + sample.rect.height / 2;

    canvas.style.display = 'block';
    var t0 = performance.now(), dur = 650;

    function frame(now) {
      var t = Math.min(1, (now - t0) / dur);

      var bgAlpha = Math.min(1, t * 2.5);
      ctx.fillStyle = 'rgba(' + BG[0] + ',' + BG[1] + ',' + BG[2] + ',' + bgAlpha + ')';
      ctx.fillRect(0, 0, W, H);

      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        var activation = t - (1 - p.L) * 0.25;
        if (activation < 0) {
          ctx.fillStyle = 'rgba(' + p.r + ',' + p.g + ',' + p.b + ',0.9)';
          ctx.fillRect(p.x, p.y, 1.5, 1.5);
          continue;
        }
        var at = Math.min(1, activation / 0.6);

        if (at < 0.5) {
          var angle = Math.atan2(p.hy - cy, p.hx - cx);
          var drift = at * 30;
          p.x = p.hx + Math.cos(angle) * drift + Math.sin(at * 3 + p.L * 5) * 3;
          p.y = p.hy + Math.sin(angle) * drift + Math.cos(at * 3 + p.L * 5) * 3;
          var pearl = Math.sin(at * Math.PI) * 0.6;
          ctx.fillStyle = 'rgba(' + Math.round(p.r*(1-pearl)+201*pearl) + ',' + Math.round(p.g*(1-pearl)+164*pearl) + ',' + Math.round(p.b*(1-pearl)+74*pearl) + ',0.9)';
        } else {
          var ft = (at - 0.5) / 0.5;
          var ease = ft * ft * (3 - 2 * ft);
          p.x += (W/2 - p.x) * ease * 0.15;
          p.y += (H/2 - p.y) * ease * 0.15;
          var alpha = 1 - ft * 0.7;
          var pearl = (1 - ft) * 0.4;
          ctx.fillStyle = 'rgba(' + Math.round(p.r*(1-pearl)+201*pearl) + ',' + Math.round(p.g*(1-pearl)+164*pearl) + ',' + Math.round(p.b*(1-pearl)+74*pearl) + ',' + (alpha*0.9) + ')';
        }
        ctx.fillRect(p.x, p.y, 1.5, 1.5);
      }

      if (t < 1) requestAnimationFrame(frame);
      else go(href);
    }
    requestAnimationFrame(frame);
  }

  function go(href) {
    // SPECTRAL NAVIGATION: fetch only the content residual, not the full page.
    // Base (CSS, layout, scripts) is already loaded. Just swap the content.
    if (href.indexOf('http') === 0 || href.indexOf('mailto') === 0) {
      window.location.href = href;
      return;
    }

    fetch(href).then(function(r) { return r.text(); }).then(function(html) {
      // Extract the content from the fetched page
      var parser = new DOMParser();
      var doc = parser.parseFromString(html, 'text/html');
      var newContent = doc.querySelector('.page');
      var newTitle = doc.querySelector('title');

      if (newContent) {
        // Inject the residual into the current base
        var currentPage = document.querySelector('.page');
        if (currentPage) {
          currentPage.innerHTML = newContent.innerHTML;
          // Reset animations
          currentPage.style.visibility = 'visible';
          currentPage.querySelectorAll('[style*="animation"]').forEach(function(el) {
            el.style.animationDelay = '0s';
            el.style.opacity = '1';
            el.style.transform = 'none';
          });
        }
        // Update title and URL
        if (newTitle) document.title = newTitle.textContent;
        history.pushState({path: href}, '', href);

        // Re-bind click handlers on new content
        bindLinks();

        // Run assembly animation on the new content
        canvas.style.display = 'none';
        try { sessionStorage.setItem('transit-to', new URL(href, location.origin).pathname); } catch(e) {}
        assemble();

        // Scroll to top
        window.scrollTo(0, 0);
      } else {
        // Fallback: full navigation
        window.location.href = href;
      }
    }).catch(function() {
      // Network error: fall back to full navigation
      window.location.href = href;
    });
  }

  // Handle browser back/forward
  window.addEventListener('popstate', function(e) {
    if (e.state && e.state.path) {
      go(e.state.path);
    }
  });

  // ═══ ASSEMBLY ═══
  function assemble() {
    var target = null;
    try { target = sessionStorage.getItem('transit-to'); sessionStorage.removeItem('transit-to'); } catch(e) {}

    // Only assemble if THIS page is the intended destination
    if (!target || location.pathname !== target) return false;

    init();
    var page = document.querySelector('.page');
    if (!page) return false;

    var W = window.innerWidth, H = window.innerHeight;
    var els = page.querySelectorAll('h1, h2, p, .result, .ref, .sub, .price-tag, .finding, .meta, .stats, .bench, .feat-item');
    var pts = [];

    for (var e = 0; e < els.length; e++) {
      var rect = els[e].getBoundingClientRect();
      if (rect.top > H * 1.5 || rect.height === 0) continue;
      var rgb = (window.getComputedStyle(els[e]).color || '').match(/\d+/g) || [200,200,200];
      var r = +rgb[0], g = +rgb[1], b = +rgb[2];
      var L = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
      var n = Math.min(50, Math.max(1, Math.floor(rect.width * rect.height / 400)));
      for (var i = 0; i < n; i++) {
        pts.push({ tx: rect.left + Math.random() * rect.width, ty: rect.top + Math.random() * rect.height,
          x: W/2 + (Math.random()-0.5)*20, y: H/2 + (Math.random()-0.5)*20,
          r: r, g: g, b: b, L: L, delay: (1-L)*0.2 + e*0.01 });
      }
    }
    if (!pts.length) return false;

    canvas.style.display = 'block';
    page.style.visibility = 'hidden';

    var t0 = performance.now(), dur = 500;
    function frame(now) {
      var t = Math.min(1, (now - t0) / dur);
      var bgAlpha = 1 - t * t;
      ctx.fillStyle = 'rgba(' + BG[0] + ',' + BG[1] + ',' + BG[2] + ',' + bgAlpha + ')';
      ctx.fillRect(0, 0, W, H);

      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        var pt = Math.max(0, (t - p.delay) / (0.9 - p.delay));
        if (pt <= 0) continue;
        pt = Math.min(1, pt);
        var ease = pt * pt * (3 - 2 * pt);
        var x = W/2 + (p.tx - W/2) * ease, y = H/2 + (p.ty - H/2) * ease;
        var pearl = Math.max(0, 1 - pt * 2);
        var alpha = pt < 0.6 ? 0.85 : 0.85 * (1 - (pt-0.6)/0.4);
        ctx.fillStyle = 'rgba(' + Math.round(p.r*(1-pearl)+201*pearl) + ',' + Math.round(p.g*(1-pearl)+164*pearl) + ',' + Math.round(p.b*(1-pearl)+74*pearl) + ',' + alpha + ')';
        ctx.fillRect(x, y, 1.5, 1.5);
      }

      if (t >= 0.35 && page.style.visibility === 'hidden') page.style.visibility = 'visible';
      if (t < 1) requestAnimationFrame(frame);
      else { canvas.style.display = 'none'; page.style.visibility = 'visible'; }
    }
    requestAnimationFrame(frame);
    return true;
  }

  // ═══ BACK BUTTON — clean slate ═══
  window.addEventListener('pageshow', function(e) { if (e.persisted) cleanup(); });

  // ═══ LINK BINDING ═══
  function bindLinks() {
    var links = document.querySelectorAll('a.product, a.card, a.harmonia-section');
    for (var i = 0; i < links.length; i++) {
      if (links[i].dataset.transitBound) continue; // don't double-bind
      links[i].dataset.transitBound = '1';
      (function(link) {
        link.addEventListener('click', function(e) {
          var href = link.getAttribute('href');
          if (!href || href === '#' || href.indexOf('http') === 0 || href.indexOf('mailto') === 0) return;
          e.preventDefault();
          dissolve(link, href);
        });
      })(links[i]);
    }
  }

  // ═══ PREFETCH — load adjacent pages in background ═══
  function prefetch() {
    var links = document.querySelectorAll('a[href^="/"]');
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href');
      if (href && href !== location.pathname) {
        var link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = href;
        document.head.appendChild(link);
      }
    }
  }

  // ═══ BOOT ═══
  function boot() {
    // Set initial history state
    history.replaceState({path: location.pathname}, '', location.pathname);

    if (!assemble()) {
      cleanup();
    }

    bindLinks();

    // Prefetch adjacent pages after 2 seconds (when idle)
    setTimeout(prefetch, 2000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
