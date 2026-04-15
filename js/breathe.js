// ═══════════════════════════════════════════════════════════
// BREATHE — gives life to any page. Drop in, forget about it.
//
// What it does:
//   1. Section titles glow on scroll (IntersectionObserver)
//   2. Numbers count up when first visible (the math computing)
//   3. .result/.box blocks get a subtle side-glow that pulses
//   4. Tables get row highlights on hover
//   5. The page has a faint golden particle field in the background
//
// Usage: <script src="/js/breathe.js"></script>
// That's it. It reads the existing HTML and brings it alive.
// ═══════════════════════════════════════════════════════════
(function(){
'use strict';
if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;

var PHI=(1+Math.sqrt(5))/2;

// ═══ 0. THE DESK — warm texture injected via CSS ═══
var style=document.createElement('style');
style.textContent=
  // Film grain overlay — barely there, adds tactile warmth
  'body::after{content:"";position:fixed;top:0;left:0;width:100%;height:100%;'+
  'pointer-events:none;z-index:9998;opacity:0.018;mix-blend-mode:overlay;'+
  'background-image:url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'256\' height=\'256\' filter=\'url(%23n)\' opacity=\'1\'/%3E%3C/svg%3E");}'+

  // Warm the text color slightly — not white, not gray, warm cream
  'body{color:#e5dfd4;}'+
  'p{color:#a09585;}'+

  // Result blocks: desk cards — warm shadow, subtle inset feel
  '.result,.box{background:linear-gradient(180deg,#0d0c12 0%,#0b0a10 100%);'+
  'border:1px solid rgba(201,164,74,0.06);'+
  'box-shadow:0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(201,164,74,0.03);}'+

  // Equations: brass inlay feel
  '.eq{background:linear-gradient(180deg,#0e0d14 0%,#0a0912 100%);'+
  'border:1px solid rgba(201,164,74,0.08);'+
  'box-shadow:0 1px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(201,164,74,0.04);}'+

  // H2: thin brass rule with gradient fade at edges
  'h2{border-bottom:none;padding-bottom:8px;position:relative;}'+
  'h2::after{content:"";position:absolute;bottom:0;left:10%;right:10%;height:1px;'+
  'background:linear-gradient(90deg,transparent,rgba(201,164,74,0.15),transparent);}'+

  // Tables: warm alternating rows
  'tr:nth-child(even){background:rgba(201,164,74,0.015);}'+
  'th{border-bottom:1px solid rgba(201,164,74,0.1) !important;}'+

  // Monospace: warm it up
  'code,.eq,td{color:#c4b896;}'+

  // Links: warm gold, not cold
  'a{color:#d4a843;transition:color 0.3s,text-shadow 0.3s;}'+
  'a:hover{color:#f0d070;text-shadow:0 0 8px rgba(201,164,74,0.2);}'+

  // Scrollbar: dark brass
  '::-webkit-scrollbar{width:6px;}'+
  '::-webkit-scrollbar-track{background:#08080d;}'+
  '::-webkit-scrollbar-thumb{background:rgba(201,164,74,0.12);border-radius:3px;}'+
  '::-webkit-scrollbar-thumb:hover{background:rgba(201,164,74,0.25);}'+

  // ═══ BRAND FONT — Futura geometric sans on all titles ═══
  // The ONE non-serif element. Mathematics rendered as letterforms.
  'h1{font-family:Futura,"Century Gothic",Avenir,"Avenir Next",system-ui,sans-serif !important;'+
  'font-weight:200 !important;letter-spacing:0.12em !important;}'+

  // Section titles: same brand font, lighter weight
  'h2{font-family:Futura,"Century Gothic",Avenir,"Avenir Next",system-ui,sans-serif !important;'+
  'font-weight:200 !important;letter-spacing:0.12em !important;}'+

  // Card titles, product names, door names — brand font
  '.card h3,.item .name,.d-name,.name{'+
  'font-family:Futura,"Century Gothic",Avenir,"Avenir Next",system-ui,sans-serif !important;'+
  'font-weight:200 !important;letter-spacing:0.08em !important;}'+

  // Back links — brand font, small
  '.back{font-family:Futura,"Century Gothic",Avenir,"Avenir Next",system-ui,sans-serif !important;'+
  'letter-spacing:0.08em !important;}';
document.head.appendChild(style);

// ═══ 1. SECTION TITLES: glow when they enter viewport ═══
var h2s=document.querySelectorAll('h2');
if(h2s.length>0&&'IntersectionObserver' in window){
  var h2Obs=new IntersectionObserver(function(entries){
    for(var i=0;i<entries.length;i++){
      var e=entries[i];
      if(e.isIntersecting){
        e.target.style.transition='text-shadow 0.8s ease, opacity 0.8s ease';
        e.target.style.textShadow='0 0 10px rgba(210,155,60,0.3), 0 0 25px rgba(201,164,74,0.08)';
        e.target.style.opacity='1';
      }else{
        e.target.style.textShadow='0 0 6px rgba(201,164,74,0.04)';
        e.target.style.opacity='0.75';
      }
    }
  },{threshold:0.5});
  for(var i=0;i<h2s.length;i++){
    h2s[i].style.opacity='0.85';
    h2Obs.observe(h2s[i]);
  }
}

// ═══ 2. NUMBERS: count up when first visible ═══
// Finds numbers like 0.74, 1.868, 216,211, 0.4% in .highlight spans
var highlights=document.querySelectorAll('.highlight');
if(highlights.length>0&&'IntersectionObserver' in window){
  var numObs=new IntersectionObserver(function(entries){
    for(var i=0;i<entries.length;i++){
      var e=entries[i];
      if(e.isIntersecting&&!e.target._counted){
        e.target._counted=true;
        countUp(e.target);
      }
    }
  },{threshold:0.8});
  for(var i=0;i<highlights.length;i++){
    numObs.observe(highlights[i]);
  }
}

function countUp(el){
  var text=el.textContent;
  // Extract the number portion
  var match=text.match(/^([~]?)([\d,]+\.?\d*)(.*)/);
  if(!match)return;
  var prefix=match[1];
  var numStr=match[2].replace(/,/g,'');
  var suffix=match[3];
  var target=parseFloat(numStr);
  if(isNaN(target)||target===0)return;

  var hasCommas=match[2].indexOf(',')>=0;
  var decimals=(numStr.split('.')[1]||'').length;
  var start=0;
  var duration=600; // ms
  var t0=performance.now();

  function tick(now){
    var t=Math.min(1,(now-t0)/duration);
    // Ease out cubic
    var ease=1-Math.pow(1-t,3);
    var current=start+(target-start)*ease;
    var display=current.toFixed(decimals);
    if(hasCommas)display=addCommas(display);
    el.textContent=prefix+display+suffix;
    if(t<1)requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function addCommas(s){
  var parts=s.split('.');
  parts[0]=parts[0].replace(/\B(?=(\d{3})+(?!\d))/g,',');
  return parts.join('.');
}

// ═══ 3. RESULT/BOX BLOCKS: subtle breathing side-glow ═══
var boxes=document.querySelectorAll('.result, .box, .eq');
for(var i=0;i<boxes.length;i++){
  var b=boxes[i];
  b.style.transition='border-color 1.618s ease';
  // Stagger the pulse
  (function(el,delay){
    setInterval(function(){
      el.style.borderLeft='2px solid rgba(201,164,74,0.25)';
      el.style.boxShadow='inset 3px 0 12px rgba(201,164,74,0.06)';
      setTimeout(function(){
        el.style.borderLeft='2px solid rgba(201,164,74,0.06)';
        el.style.boxShadow='none';
      },810);
    },3236+delay);
  })(b,i*400);
}

// ═══ 4. TABLE ROW HOVER ═══
var trs=document.querySelectorAll('tr');
for(var i=0;i<trs.length;i++){
  trs[i].style.transition='background 0.3s';
  trs[i].addEventListener('mouseenter',function(){this.style.background='rgba(201,164,74,0.06)';});
  trs[i].addEventListener('mouseleave',function(){this.style.background='';});
}

// ═══ 5. BACKGROUND PARTICLE FIELD ═══
// Very subtle — just enough to know the page is alive
var bgCanvas=document.createElement('canvas');
bgCanvas.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none;opacity:0.8;';
document.body.appendChild(bgCanvas);
// Make sure page content sits above the canvas
var page=document.querySelector('.page');
if(page)page.style.position='relative';
if(page)page.style.zIndex='1';
var bgCx=bgCanvas.getContext('2d');
var dpr=devicePixelRatio||1;
var bW,bH;
function bgResize(){
  bW=innerWidth;bH=innerHeight;
  bgCanvas.width=bW*dpr;bgCanvas.height=bH*dpr;
  bgCx.setTransform(dpr,0,0,dpr,0,0);
}
bgResize();addEventListener('resize',bgResize);

var motes=[];
for(var i=0;i<20;i++){
  motes.push({
    x:Math.random()*2000,y:Math.random()*2000,
    vx:(Math.random()-0.5)*0.08,vy:(Math.random()-0.5)*0.08,
    s:Math.random()*1.5+0.4,
    base:Math.random()*0.06+0.025,  // base brightness
    flicker:Math.random()*0.5+0.5,  // flicker frequency (irregular)
    phase:Math.random()*100,        // phase offset
    warm:Math.random()              // warm shift: 0=gold, 1=amber
  });
}

var bgT=0;
function bgDraw(){
  bgT+=0.016;
  bgCx.clearRect(0,0,bW,bH);
  for(var i=0;i<motes.length;i++){
    var m=motes[i];
    m.x+=m.vx;m.y+=m.vy;
    if(m.x<0)m.x=bW;if(m.x>bW)m.x=0;
    if(m.y<0)m.y=bH;if(m.y>bH)m.y=0;

    // Incandescent flicker: irregular sine + noise + occasional flare
    var flick=Math.sin(bgT*m.flicker+m.phase)
             *Math.sin(bgT*m.flicker*PHI+m.phase*0.7)
             *0.5+0.5;
    // Occasional bright flare (1 in ~200 frames)
    var flare=(Math.sin(bgT*0.3+m.phase*3)>0.97)?1.8:1.0;
    var alpha=m.base*flick*flare;

    // Color: shift between gold (201,164,74) and warm amber (210,140,50)
    var r=Math.floor(201+m.warm*9);
    var g=Math.floor(164-m.warm*24);
    var b=Math.floor(74-m.warm*24);

    // Warm glow halo
    var gl=bgCx.createRadialGradient(m.x,m.y,0,m.x,m.y,m.s*5);
    gl.addColorStop(0,'rgba('+r+','+g+','+b+','+(alpha*0.4)+')');
    gl.addColorStop(0.4,'rgba('+r+','+g+','+b+','+(alpha*0.1)+')');
    gl.addColorStop(1,'rgba('+r+','+g+','+b+',0)');
    bgCx.fillStyle=gl;
    bgCx.fillRect(m.x-m.s*5,m.y-m.s*5,m.s*10,m.s*10);

    // Hot core — brighter, slightly whiter
    bgCx.beginPath();bgCx.arc(m.x,m.y,m.s*0.6,0,Math.PI*2);
    bgCx.fillStyle='rgba('+Math.min(255,r+40)+','+Math.min(255,g+30)+','+Math.min(255,b+20)+','+(alpha*1.2)+')';
    bgCx.fill();
  }
  requestAnimationFrame(bgDraw);
}
bgDraw();

})();
