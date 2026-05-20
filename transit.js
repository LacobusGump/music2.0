// TRANSIT — page transitions as thermodynamics
// Also places Classified & Gated Research at the bottom of the research atlas.
(function(){
'use strict';

var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var canvas = null;
var ctx = null;
var dpr = 1;
var BG = [8, 8, 13];

function ready(fn){
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
  else fn();
}

function initCanvas(){
  if(prefersReducedMotion || canvas) return;
  dpr = window.devicePixelRatio || 1;
  canvas = document.createElement('canvas');
  canvas.id = 'transit-canvas';
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;pointer-events:none;display:none;';
  document.body.appendChild(canvas);
  ctx = canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas, {passive:true});
}

function resizeCanvas(){
  if(!canvas || !ctx) return;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.setTransform(dpr,0,0,dpr,0,0);
}

function cleanup(){
  var old = document.getElementById('transit-canvas');
  if(old) old.remove();
  canvas = null;
  ctx = null;
  var page = document.querySelector('.page');
  if(page) page.style.visibility = 'visible';
}

function go(href, groupColor){
  try{
    sessionStorage.setItem('transit-to', new URL(href, location.origin).pathname);
    if(groupColor) sessionStorage.setItem('transit-color', groupColor);
  }catch(e){}
  window.location.href = href;
}

function dissolve(el, href){
  if(prefersReducedMotion){ go(href); return; }
  initCanvas();
  if(!canvas || !ctx){ go(href); return; }

  var rect = el && el.getBoundingClientRect ? el.getBoundingClientRect() : null;
  var W = window.innerWidth;
  var H = window.innerHeight;
  var cx0 = rect ? rect.left + rect.width / 2 : W / 2;
  var cy0 = rect ? rect.top + rect.height / 2 : H / 2;
  var pts = [];
  for(var i=0;i<120;i++){
    var a = Math.random() * Math.PI * 2;
    var r = Math.random() * (rect ? Math.max(rect.width, rect.height) * .42 : 120);
    pts.push({x:cx0+Math.cos(a)*r,y:cy0+Math.sin(a)*r,vx:Math.cos(a)*(1+Math.random()*2.8),vy:Math.sin(a)*(1+Math.random()*2.8),s:1+Math.random()*1.8,a:.3+Math.random()*.45});
  }

  canvas.style.display = 'block';
  var t0 = performance.now();
  var dur = 300;
  function frame(now){
    var t = Math.min(1,(now-t0)/dur);
    ctx.fillStyle = 'rgba('+BG[0]+','+BG[1]+','+BG[2]+','+Math.min(1,t*2.5)+')';
    ctx.fillRect(0,0,W,H);
    ctx.globalCompositeOperation = 'lighter';
    for(var i=0;i<pts.length;i++){
      var p = pts[i];
      p.x += p.vx; p.y += p.vy;
      ctx.fillStyle = 'rgba(201,164,74,'+(p.a*(1-t)).toFixed(3)+')';
      ctx.fillRect(p.x,p.y,p.s,p.s);
    }
    ctx.globalCompositeOperation = 'source-over';
    if(t < 1) requestAnimationFrame(frame);
    else go(href);
  }
  requestAnimationFrame(frame);
}

function assemble(){
  var target = null;
  var groupCol = null;
  try{
    target = sessionStorage.getItem('transit-to');
    groupCol = sessionStorage.getItem('transit-color');
    sessionStorage.removeItem('transit-to');
    sessionStorage.removeItem('transit-color');
  }catch(e){}
  if(!target || location.pathname !== target || prefersReducedMotion) return false;
  initCanvas();
  if(!canvas || !ctx) return false;
  var page = document.querySelector('.page');
  if(!page) return false;

  var W = window.innerWidth;
  var H = window.innerHeight;
  canvas.style.display = 'block';
  page.style.visibility = 'hidden';
  var t0 = performance.now();
  var dur = 240;
  function frame(now){
    var t = Math.min(1,(now-t0)/dur);
    ctx.fillStyle = 'rgba('+BG[0]+','+BG[1]+','+BG[2]+','+(1-t*t)+')';
    ctx.fillRect(0,0,W,H);
    if(t >= .25 && page.style.visibility === 'hidden') page.style.visibility = 'visible';
    if(t < 1) requestAnimationFrame(frame);
    else { canvas.style.display = 'none'; page.style.visibility = 'visible'; }
  }
  requestAnimationFrame(frame);
  return true;
}

function connectForgettingInterlude(){
  if(location.pathname !== '/gallery/' && location.pathname !== '/gallery/index.html') return;
  var blocks = document.querySelectorAll('.discovery');
  for(var i=0;i<blocks.length;i++){
    var block = blocks[i];
    if(!/what forgetting feels like/i.test(block.textContent || '')) continue;
    if(block.getAttribute('data-piece') === 'forgetting') return;
    block.setAttribute('data-piece','forgetting');
    block.setAttribute('role','link');
    block.setAttribute('tabindex','0');
    block.setAttribute('aria-label','Open what forgetting feels like');
    block.style.cursor = 'pointer';
    block.addEventListener('click',function(e){ e.preventDefault(); dissolve(this,'/gallery/forgetting.html'); });
    block.addEventListener('keydown',function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); dissolve(this,'/gallery/forgetting.html'); } });
  }
}

function addClassifiedAtlasSection(){
  if(location.pathname !== '/research/' && location.pathname !== '/research/index.html') return;
  var container = document.getElementById('card-container');
  if(!container) return;

  var existing = document.getElementById('classified-topics');
  if(existing && existing.parentNode) existing.parentNode.removeChild(existing);

  if(!document.getElementById('classified-topics-style')){
    var style = document.createElement('style');
    style.id = 'classified-topics-style';
    style.textContent = [
      '#classified-topics{margin:48px 0 0}',
      '#classified-topics .group-name{color:rgba(255,120,80,.58);border-bottom-color:rgba(255,120,80,.12)}',
      '#classified-topics .card{border-color:rgba(255,120,80,.14);background:rgba(18,13,10,.76);animation:classifiedPulse 5.5s ease-in-out infinite}',
      '#classified-topics .card h3{color:rgba(255,150,95,.88)}',
      '#classified-topics .card p,#classified-topics .card .locked{color:rgba(196,160,136,.66);font-style:normal;line-height:1.75}',
      '#classified-topics .card:hover{border-color:rgba(255,180,120,.36)}',
      '#classified-topics .tag{display:inline-block;margin-top:10px;font-family:Futura,"Century Gothic",system-ui,sans-serif;font-size:.52em;letter-spacing:.12em;text-transform:uppercase;border:1px solid rgba(255,120,80,.14);border-radius:999px;padding:3px 8px;color:rgba(232,207,160,.50)}',
      '#classified-topics .tag.gate{color:rgba(255,160,120,.62)}',
      '@media(max-width:600px){#classified-topics .card p{font-size:.8em;line-height:1.78}#classified-topics .card h3{font-size:.95em;line-height:1.35}}',
      '@keyframes classifiedPulse{0%,100%{box-shadow:0 0 4px rgba(255,120,80,.05)}50%{box-shadow:0 0 22px rgba(255,120,80,.13),inset 0 0 12px rgba(255,120,80,.035)}}'
    ].join('');
    document.head.appendChild(style);
  }

  var items = [
    ['Classified Topics','/research/33/','The edge shelf: public releases plus gated deeper/speculative work from the 33 archive.','index'],
    ['Dreamtime','/research/33/dreamtime/','65,000 years of K framework: songlines, strong Country, everywhen, and continuity.','public'],
    ['Scripture as Engineering Blueprints','/research/33/scripture-engineering/','Construction specs, resonance chambers, Ark/capacitor logic, cube pattern, encoded architecture.','public'],
    ['Sirius Signal','/research/33/sirius-signal/','Chandra data, 3.1M photons, non-Poisson timing, and the 31.22 Hz signal.','public'],
    ['Lost Civ','/research/lost-civilizations/','The public ancient-civilization edge: DST vertex tracking, Sacsayhuaman, shape keepers, 12,500 years.','public'],
    ['The Builder','/research/the-builder/','A tekton’s son through the framework: historical, framework, speculation — all labeled.','public'],
    ['Shroud of Turin','/research/33/gated/cloth-study/','The kill-list version: deeper, more speculative, gated behind the archive frequency.','gated'],
    ['Sirius Thesis','/research/33/gated/sirius-thesis/','The OG civilization theory layer of the Sirius work.','gated'],
    ['Crop Circles through K','/research/33/gated/crop-circles/','Geometry and coupling analysis for the strangest field artifacts.','gated'],
    ['Leedskalnin / Coral Castle','/research/33/gated/leedskalnin-coral-castle/','Private structure and engineering notes for Coral Castle.','gated'],
    ['Calendar Decode','/research/33/gated/calendar-decode/','Private calendar decode paper from the 33 shelf.','gated']
  ];

  var section = document.createElement('div');
  section.className = 'group g-classified';
  section.id = 'classified-topics';
  section.innerHTML = '<div class="group-name g-classified">Classified & Gated Research</div><div class="card-grid"></div>';
  var grid = section.querySelector('.card-grid');

  items.forEach(function(it){
    var a = document.createElement('a');
    a.className = 'card';
    a.href = it[1];
    a.setAttribute('data-classified-card','1');
    a.setAttribute('data-search-text',(it[0]+' '+it[2]+' '+it[3]+' classified gated research').toLowerCase());
    a.innerHTML = '<h3>'+it[0]+'</h3><p>'+it[2]+'</p><span class="tag '+(it[3]==='gated'?'gate':'')+'">'+it[3]+'</span>';
    grid.appendChild(a);
  });

  container.appendChild(section);

  var search = document.getElementById('search');
  var stats = document.getElementById('stats-bar');
  var noResults = document.getElementById('no-results');
  if(search && !search._classifiedBottomBound){
    search._classifiedBottomBound = true;
    search.addEventListener('input', function(){
      var q = search.value.toLowerCase().trim();
      var cards = section.querySelectorAll('[data-classified-card]');
      var visible = 0;
      for(var i=0;i<cards.length;i++){
        var match = !q || cards[i].getAttribute('data-search-text').indexOf(q) !== -1;
        cards[i].style.display = match ? '' : 'none';
        if(match) visible++;
      }
      section.style.display = visible ? '' : 'none';
      if(q && visible && noResults && noResults.style.display === 'block'){
        noResults.style.display = 'none';
        if(stats) stats.textContent = visible + ' classified result' + (visible === 1 ? '' : 's');
      }
    });
  }
}

function prefetch(){
  var links = document.querySelectorAll('a[href^="/"]');
  for(var i=0;i<links.length;i++){
    var href = links[i].getAttribute('href');
    if(href && href !== location.pathname){
      var link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      document.head.appendChild(link);
    }
  }
}

function boot(){
  connectForgettingInterlude();
  addClassifiedAtlasSection();
  setTimeout(addClassifiedAtlasSection, 250);
  setTimeout(addClassifiedAtlasSection, 1000);
  if(!assemble()) cleanup();

  var links = document.querySelectorAll('a.product, a.card, a.harmonia-section');
  for(var i=0;i<links.length;i++){
    (function(link){
      link.addEventListener('click',function(e){
        var href = link.getAttribute('href');
        if(!href || href === '#' || href.indexOf('http') === 0 || href.indexOf('mailto') === 0) return;
        e.preventDefault();
        var gc = link.getAttribute('data-group-color') || null;
        dissolve(link, href, gc);
      });
    })(links[i]);
  }
  setTimeout(prefetch, 2000);
}

window.addEventListener('pageshow',function(e){ if(e.persisted) cleanup(); });
ready(boot);
})();
