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

    var title = el.querySelector('.name, h3, .gold');
    var pitch = el.querySelector('.pitch, p');
    var price = el.querySelector('.price, .meta');

    if (title) { tc.fillStyle = '#c9a44a'; tc.font = '200 16px Georgia'; tc.fillText(title.textContent, 20, 24); }
    if (price) { tc.fillStyle = '#4a9'; tc.font = '14px Georgia'; tc.fillText(price.textContent, Math.max(20, w - tc.measureText(price.textContent).width - 20), 24); }
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
    var t0 = performance.now(), dur = 350;

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

  function go(href, groupColor) {
    try {
      sessionStorage.setItem('transit-to', new URL(href, location.origin).pathname);
      if (groupColor) sessionStorage.setItem('transit-color', groupColor);
    } catch(e) {}
    window.location.href = href;
  }

  // ═══ ASSEMBLY ═══
  function assemble() {
    var target = null, groupCol = null;
    try {
      target = sessionStorage.getItem('transit-to');
      groupCol = sessionStorage.getItem('transit-color');
      sessionStorage.removeItem('transit-to');
      sessionStorage.removeItem('transit-color');
    } catch(e) {}
    var pearlR=201, pearlG=164, pearlB=74;
    if (groupCol) {
      var parts = groupCol.split(',');
      if (parts.length === 3) { pearlR=+parts[0]; pearlG=+parts[1]; pearlB=+parts[2]; }
    }

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

    var t0 = performance.now(), dur = 280;
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
        ctx.fillStyle = 'rgba(' + Math.round(p.r*(1-pearl)+pearlR*pearl) + ',' + Math.round(p.g*(1-pearl)+pearlG*pearl) + ',' + Math.round(p.b*(1-pearl)+pearlB*pearl) + ',' + alpha + ')';
        ctx.fillRect(x, y, 1.5, 1.5);
      }

      if (t >= 0.35 && page.style.visibility === 'hidden') page.style.visibility = 'visible';
      if (t < 1) requestAnimationFrame(frame);
      else { canvas.style.display = 'none'; page.style.visibility = 'visible'; }
    }
    requestAnimationFrame(frame);
    return true;
  }

  function connectForgettingInterlude() {
    if (location.pathname !== '/gallery/' && location.pathname !== '/gallery/index.html') return;
    var blocks = document.querySelectorAll('.discovery');
    for (var i = 0; i < blocks.length; i++) {
      var block = blocks[i];
      if (!/what forgetting feels like/i.test(block.textContent || '')) continue;
      if (block.getAttribute('data-piece') === 'forgetting') return;
      block.setAttribute('data-piece', 'forgetting');
      block.setAttribute('role', 'link');
      block.setAttribute('tabindex', '0');
      block.setAttribute('aria-label', 'Open what forgetting feels like');
      block.style.cursor = 'pointer';
      block.style.transition = 'border-color .35s, background .35s, transform .35s';
      block.addEventListener('mouseenter', function(){ this.style.borderLeftColor = 'rgba(232,207,160,.34)'; this.style.background = 'rgba(184,117,58,.045)'; this.style.transform = 'translateY(-2px)'; });
      block.addEventListener('mouseleave', function(){ this.style.borderLeftColor = 'rgba(184,117,58,.18)'; this.style.background = 'rgba(18,13,10,.32)'; this.style.transform = 'none'; });
      block.addEventListener('click', function(e){ e.preventDefault(); dissolve(this, '/gallery/forgetting.html'); });
      block.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); dissolve(this, '/gallery/forgetting.html'); } });
    }
  }

  // ═══ BACK BUTTON — clean slate ═══
  window.addEventListener('pageshow', function(e) { if (e.persisted) cleanup(); });

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
    connectForgettingInterlude();
    if (!assemble()) {
      cleanup();
    }

    var links = document.querySelectorAll('a.product, a.card, a.harmonia-section');
    for (var i = 0; i < links.length; i++) {
      (function(link) {
        link.addEventListener('click', function(e) {
          var href = link.getAttribute('href');
          if (!href || href === '#' || href.indexOf('http') === 0 || href.indexOf('mailto') === 0) return;
          e.preventDefault();
          var gc = link.getAttribute('data-group-color') || null;
          if (gc) { try { sessionStorage.setItem('transit-color', gc); } catch(ex){} }
          dissolve(link, href);
        });
      })(links[i]);
    }

    setTimeout(prefetch, 2000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

// Research classified topics fallback. Keeps /research/ live even if the threaded helper is cached.
(function(){
'use strict';
if (location.pathname !== '/research/' && location.pathname !== '/research/index.html') return;
function ready(fn){ if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }
ready(function(){
  var container = document.getElementById('card-container');
  if (!container || document.getElementById('classified-topics')) return;
  var style = document.createElement('style');
  style.textContent = '#classified-topics{margin:0 0 48px}#classified-topics .group-name{color:rgba(255,120,80,.55);border-bottom-color:rgba(255,120,80,.10)}#classified-topics .card{border-color:rgba(255,120,80,.14);animation:classifiedPulse 5.5s ease-in-out infinite}#classified-topics .card h3{color:rgba(255,150,95,.86)}#classified-topics .card:hover{border-color:rgba(255,180,120,.36)}#classified-topics .tag{display:inline-block;margin-top:10px;font-family:Futura,"Century Gothic",system-ui,sans-serif;font-size:.52em;letter-spacing:.12em;text-transform:uppercase;border:1px solid rgba(255,120,80,.14);border-radius:999px;padding:3px 8px;color:rgba(232,207,160,.46)}#classified-topics .tag.gate{color:rgba(255,160,120,.55)}@keyframes classifiedPulse{0%,100%{box-shadow:0 0 4px rgba(255,120,80,.05)}50%{box-shadow:0 0 22px rgba(255,120,80,.13),inset 0 0 12px rgba(255,120,80,.035)}}';
  document.head.appendChild(style);
  var items=[
    ['Classified Topics','/research/33/','The edge shelf: public releases plus gated deeper/speculative work from the 33 archive.','index'],
    ['Dreamtime','/research/33/dreamtime/','65,000 years of K framework: songlines, strong Country, everywhen, and continuity.','public'],
    ['Scripture as Engineering Blueprints','/research/33/scripture-engineering/','Construction specs, resonance chambers, Ark/capacitor logic, cube pattern, and encoded architecture.','public'],
    ['Sirius Signal','/research/33/sirius-signal/','Chandra data, 3.1M photons, non-Poisson timing, and the 31.22 Hz signal.','public'],
    ['Lost Civ','/research/lost-civilizations/','The public ancient-civilization edge: DST vertex tracking, Sacsayhuaman, shape keepers, 12,500 years.','public'],
    ['The Builder','/research/the-builder/','A tekton’s son through the framework: historical, framework, speculation — all labeled.','public'],
    ['Shroud of Turin','/research/33/gated/cloth-study/','The kill-list version: deeper, more speculative, gated behind the archive frequency.','gated'],
    ['Sirius Thesis','/research/33/gated/sirius-thesis/','The OG civilization theory layer of the Sirius work.','gated'],
    ['Crop Circles through K','/research/33/gated/crop-circles/','Geometry and coupling analysis for the strangest field artifacts.','gated'],
    ['Leedskalnin / Coral Castle','/research/33/gated/leedskalnin-coral-castle/','Private structure and engineering notes for Coral Castle.','gated'],
    ['Calendar Decode','/research/33/gated/calendar-decode/','Private calendar decode paper from the 33 shelf.','gated']
  ];
  var section=document.createElement('div');
  section.className='group g-classified';
  section.id='classified-topics';
  section.innerHTML='<div class="group-name g-classified">Classified Topics</div><div class="card-grid"></div>';
  var grid=section.querySelector('.card-grid');
  items.forEach(function(it){
    var a=document.createElement('a');
    a.className='card';
    a.href=it[1];
    a.setAttribute('data-classified-card','1');
    a.setAttribute('data-search-text',(it[0]+' '+it[2]+' '+it[3]).toLowerCase());
    a.innerHTML='<h3>'+it[0]+'</h3><p>'+it[2]+'</p><span class="tag '+(it[3]==='gated'?'gate':'')+'">'+it[3]+'</span>';
    grid.appendChild(a);
  });
  container.insertBefore(section,container.firstChild);
  var search=document.getElementById('search');
  if(search){ search.addEventListener('input',function(){
    var q=search.value.toLowerCase().trim(),cards=section.querySelectorAll('[data-classified-card]'),visible=0;
    for(var i=0;i<cards.length;i++){ var match=!q||cards[i].getAttribute('data-search-text').indexOf(q)!==-1; cards[i].style.display=match?'':'none'; if(match)visible++; }
    section.style.display=visible?'':'none';
  }); }
});
})();