// TRANSIT — page transitions as thermodynamics
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

function simplifyHomeHarmoniaMentions(){
  var path = location.pathname;
  if(path !== '/' && path !== '/index.html' && path !== '/home-lab/' && path !== '/home-lab/index.html') return;

  var style = document.createElement('style');
  style.textContent = '.whisper{display:none!important;}';
  document.head.appendChild(style);

  var whisper = document.querySelector('.whisper');
  if(whisper) whisper.remove();

  function keepGateSimple(){
    var gateText = document.getElementById('gate-text');
    if(gateText && gateText.textContent !== 'Harmonia is the field you can talk to') {
      gateText.textContent = 'Harmonia is the field you can talk to';
    }
    requestAnimationFrame(keepGateSimple);
  }
  keepGateSimple();
}

function installFirstTimerHome(){
  var path = location.pathname;
  if(path !== '/' && path !== '/index.html') return;
  var doors = document.querySelector('.doors');
  if(!doors || document.querySelector('.first-timer-band')) return;
  // Big "First Timer" band removed — the small "first timer?" link top-right covers it
  var topStart = document.querySelector('.toplinks a[href="/start-here/"]');
  if(topStart) topStart.textContent = 'first timer?';
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
      p.x += p.vx;
      p.y += p.vy;
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
  try{
    target = sessionStorage.getItem('transit-to');
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
  simplifyHomeHarmoniaMentions();
  installFirstTimerHome();
  connectForgettingInterlude();
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