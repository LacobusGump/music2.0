// ═══════════════════════════════════════════════════════════
// BREATHE — gives life to any page. Drop in, forget about it.
//
// TWO MODES:
//   WORKSHOP (light) — products, support, start-here
//   COSMOS (dark) — research, gallery, /33/, individual pages
//
// The homepage is its own thing (dusk — handled in index.html).
//
// Font rules everywhere: Futura 400+, letter-spacing 0.04-0.06em.
// No weight below 300 anywhere. The site speaks, it doesn't whisper.
// ═══════════════════════════════════════════════════════════
(function(){
'use strict';
if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;

var PHI=(1+Math.sqrt(5))/2;

// ═══ DETECT PAGE TYPE ═══
var path=window.location.pathname;
var isHomepage=(path==='/' || path==='/index.html');
var isDark=!isHomepage;

// ═══ 0. THE STYLE — injected via CSS ═══
var style=document.createElement('style');

// --- SHARED FONT RULES (all pages) ---
var fontRules=
  // Brand font — Futura at real weight, tighter spacing
  'h1{font-family:Futura,"Century Gothic",Avenir,"Avenir Next",system-ui,sans-serif !important;'+
  'font-weight:400 !important;letter-spacing:0.06em !important;}'+

  'h2{font-family:Futura,"Century Gothic",Avenir,"Avenir Next",system-ui,sans-serif !important;'+
  'font-weight:400 !important;letter-spacing:0.06em !important;}'+

  '.card h3,.item .name,.d-name,.name{'+
  'font-family:Futura,"Century Gothic",Avenir,"Avenir Next",system-ui,sans-serif !important;'+
  'font-weight:400 !important;letter-spacing:0.04em !important;}'+

  '.back{font-family:Futura,"Century Gothic",Avenir,"Avenir Next",system-ui,sans-serif !important;'+
  'letter-spacing:0.06em !important;}';

  // ═══ EMBER MODE — all dark pages ═══
  style.textContent=fontRules+

    // Film grain overlay — keep on dark pages
    'body::after{content:"";position:fixed;top:0;left:0;width:100%;height:100%;'+
    'pointer-events:none;z-index:9998;opacity:0.018;mix-blend-mode:overlay;'+
    'background-image:url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'256\' height=\'256\' filter=\'url(%23n)\' opacity=\'1\'/%3E%3C/svg%3E");}'+

    // Text — shell (quiet)
    'body{color:#c4a088;}'+
    'p{color:#c4a088;}'+

    // Result blocks — deep dark ember cards
    '.result,.box{background:#120d0a;'+
    'border:1px solid rgba(184,117,58,0.08);'+
    'box-shadow:0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(184,117,58,0.03);}'+

    // Equations — ember inlay
    '.eq{background:#120d0a;'+
    'border:1px solid rgba(184,117,58,0.1);'+
    'box-shadow:0 1px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(184,117,58,0.04);}'+

    // H2 rule — ember gradient
    'h2{border-bottom:none;padding-bottom:8px;position:relative;color:#b8753a !important;}'+
    'h2::after{content:"";position:absolute;bottom:0;left:10%;right:10%;height:1px;'+
    'background:linear-gradient(90deg,transparent,rgba(184,117,58,0.2),transparent);}'+

    // Tables — ember tint
    'tr:nth-child(even){background:rgba(184,117,58,0.02);}'+
    'th{border-bottom:1px solid rgba(184,117,58,0.1) !important;}'+

    // Monospace — code green
    'code,.eq,td{color:#7a9a6a;}'+

    // Links — deep amber
    'a{color:#a0622d;transition:color 0.3s,text-shadow 0.3s;}'+
    'a:hover{color:#e8cfa0;text-shadow:0 0 8px rgba(184,117,58,0.15);}'+

    // Scrollbar — ember
    '::-webkit-scrollbar{width:6px;}'+
    '::-webkit-scrollbar-track{background:#1a110d;}'+
    '::-webkit-scrollbar-thumb{background:rgba(184,117,58,0.12);border-radius:3px;}'+
    '::-webkit-scrollbar-thumb:hover{background:rgba(184,117,58,0.25);}'+

    // Sacred
    '.sacred,.must-see,strong.sacred{color:#7a9a6a !important;}';
document.head.appendChild(style);

// ═══ 1. SECTION TITLES: glow on scroll (dark) / fade-in on scroll (light) ═══
var h2s=document.querySelectorAll('h2');
if(h2s.length>0&&'IntersectionObserver' in window){
  var h2Obs=new IntersectionObserver(function(entries){
    for(var i=0;i<entries.length;i++){
      var e=entries[i];
      // Ember glow
      if(e.isIntersecting){
        e.target.style.transition='text-shadow 0.8s ease, opacity 0.8s ease';
        e.target.style.textShadow='0 0 10px rgba(184,117,58,0.25), 0 0 25px rgba(184,117,58,0.06)';
        e.target.style.opacity='1';
      }else{
        e.target.style.textShadow='0 0 6px rgba(184,117,58,0.04)';
        e.target.style.opacity='0.75';
      }
    }
  },{threshold:0.5});
  for(var i=0;i<h2s.length;i++){
    h2s[i].style.opacity='0.85';
    h2Obs.observe(h2s[i]);
  }
}

// ═══ 2. NUMBERS: count up (all pages) ═══
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
  var duration=600;
  var t0=performance.now();
  function tick(now){
    var t=Math.min(1,(now-t0)/duration);
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

// ═══ 3. RESULT/BOX: breathing side-glow (dark only) / subtle left-border pulse (light) ═══
var boxes=document.querySelectorAll('.result, .box, .eq');
{
  // Breathing ember side-glow
  for(var i=0;i<boxes.length;i++){
    var b=boxes[i];
    b.style.transition='border-color 1.618s ease';
    (function(el,delay){
      setInterval(function(){
        el.style.borderLeft='2px solid rgba(184,117,58,0.25)';
        el.style.boxShadow='inset 3px 0 12px rgba(184,117,58,0.06)';
        setTimeout(function(){
          el.style.borderLeft='2px solid rgba(184,117,58,0.06)';
          el.style.boxShadow='none';
        },810);
      },3236+delay);
    })(b,i*400);
  }
}

// ═══ 4. TABLE ROW HOVER ═══
var trs=document.querySelectorAll('tr');
for(var i=0;i<trs.length;i++){
  trs[i].style.transition='background 0.3s';
  trs[i].addEventListener('mouseenter',function(){this.style.background='rgba(184,117,58,0.06)';});
  trs[i].addEventListener('mouseleave',function(){this.style.background='';});
}

// ═══ 5. BACKGROUND MOTES — dark pages only ═══
if(isDark && !isHomepage){
  var bgCanvas=document.createElement('canvas');
  bgCanvas.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none;opacity:0.8;';
  document.body.appendChild(bgCanvas);
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
      base:Math.random()*0.06+0.025,
      flicker:Math.random()*0.5+0.5,
      phase:Math.random()*100,
      warm:Math.random()
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

      var flick=Math.sin(bgT*m.flicker+m.phase)
               *Math.sin(bgT*m.flicker*PHI+m.phase*0.7)
               *0.5+0.5;
      var flare=(Math.sin(bgT*0.3+m.phase*3)>0.97)?1.8:1.0;
      var alpha=m.base*flick*flare;

      // Color: shift between ember (184,117,58) and spark (232,207,160)
      var r=Math.floor(184+m.warm*16);
      var g=Math.floor(117+m.warm*30);
      var b=Math.floor(58+m.warm*20);

      var gl=bgCx.createRadialGradient(m.x,m.y,0,m.x,m.y,m.s*5);
      gl.addColorStop(0,'rgba('+r+','+g+','+b+','+(alpha*0.4)+')');
      gl.addColorStop(0.4,'rgba('+r+','+g+','+b+','+(alpha*0.1)+')');
      gl.addColorStop(1,'rgba('+r+','+g+','+b+',0)');
      bgCx.fillStyle=gl;
      bgCx.fillRect(m.x-m.s*5,m.y-m.s*5,m.s*10,m.s*10);

      bgCx.beginPath();bgCx.arc(m.x,m.y,m.s*0.6,0,Math.PI*2);
      bgCx.fillStyle='rgba('+Math.min(255,r+40)+','+Math.min(255,g+30)+','+Math.min(255,b+20)+','+(alpha*1.2)+')';
      bgCx.fill();
    }
    requestAnimationFrame(bgDraw);
  }
  bgDraw();
}

})();
