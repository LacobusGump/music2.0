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
  // Custom cursor — tiny atom with orbiting electron
  'body{cursor:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'%3E%3Ccircle cx=\'12\' cy=\'12\' r=\'3\' fill=\'%23b8753a\' opacity=\'0.5\'/%3E%3Ccircle cx=\'12\' cy=\'12\' r=\'8\' fill=\'none\' stroke=\'%23b8753a\' stroke-width=\'0.5\' opacity=\'0.25\'/%3E%3Ccircle cx=\'20\' cy=\'12\' r=\'1.5\' fill=\'%23e8cfa0\' opacity=\'0.6\'/%3E%3C/svg%3E") 12 12, auto !important;}'+
  'a,button,.card,.door{cursor:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'%3E%3Ccircle cx=\'12\' cy=\'12\' r=\'3\' fill=\'%23e8cfa0\' opacity=\'0.7\'/%3E%3Ccircle cx=\'12\' cy=\'12\' r=\'8\' fill=\'none\' stroke=\'%23e8cfa0\' stroke-width=\'0.7\' opacity=\'0.35\'/%3E%3Ccircle cx=\'20\' cy=\'12\' r=\'1.5\' fill=\'%23fff\' opacity=\'0.8\'/%3E%3C/svg%3E") 12 12, pointer !important;}'+

  // Brand font — Futura everywhere. Not just titles. The whole voice.
  'body,p,li,td,th,span,div,.sub,.note,.quiet,.dim{'+
  'font-family:Futura,"Century Gothic",Avenir,"Avenir Next",system-ui,sans-serif !important;}'+

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

    // Code blocks — subtle green. Tables stay body color.
    'code,.eq{color:#7a9a6a;}'+
    // Tables: warm text, not monospace green
    'td{color:#b0a898 !important;font-family:Georgia,serif !important;}'+

    // Links — deep amber
    'a{color:#a0622d;transition:color 0.3s,text-shadow 0.3s;}'+
    'a:hover{color:#e8cfa0;text-shadow:0 0 8px rgba(184,117,58,0.15);}'+

    // Scrollbar — ember
    '::-webkit-scrollbar{width:6px;}'+
    '::-webkit-scrollbar-track{background:#1a110d;}'+
    '::-webkit-scrollbar-thumb{background:rgba(184,117,58,0.12);border-radius:3px;}'+
    '::-webkit-scrollbar-thumb:hover{background:rgba(184,117,58,0.25);}'+

    // Sacred
    '.sacred,.must-see,strong.sacred{color:#7a9a6a !important;}'+

    // ═══ BEAUTY LAYER — cascades to all research pages ═══

    // Breathing room: more space between sections for the eye to rest
    'h2{margin-top:48px !important;margin-bottom:16px !important;}'+
    'hr{margin:44px 0 !important;}'+

    // Tables: more padding, slightly larger text, gentler on mobile
    'td{padding:8px 10px !important;font-size:0.8em !important;}'+
    'th{padding:8px 10px !important;font-size:0.72em !important;}'+

    // Oversimplification box: warmer border so it feels like an invitation
    '[style*="8b451320"]{border-color:rgba(184,117,58,0.15) !important;}'+

    // Link-boxes: subtle left border accent for visual hierarchy
    '.link-box{border-left:2px solid rgba(184,117,58,0.12) !important;'+
    'transition:border-color 0.3s, background 0.3s !important;}'+
    '.link-box:hover{border-left-color:rgba(184,117,58,0.35) !important;'+
    'background:rgba(184,117,58,0.03) !important;}'+

    // Paragraphs: slightly warmer body text for readability
    '.page p{color:#b0a898 !important;line-height:2 !important;}'+

    // The .bright class: brighter for emphasis contrast
    '.bright{color:#ddd !important;}'+

    // Kill-styled text: clearer crossed-out styling
    '.kill,del,s{color:#a55 !important;text-decoration:line-through !important;'+
    'text-decoration-color:rgba(170,85,85,0.4) !important;}'+

    // Mobile: slightly bigger base text for readability
    '@media(max-width:600px){.page p{font-size:0.88em !important;line-height:2.1 !important;}'+
    'td{font-size:0.82em !important;padding:8px 6px !important;}'+
    'h1{font-size:1.5em !important;}}';
document.head.appendChild(style);

// ═══ 0.5 TITLE — clean Futura, subtle breathing glow ═══
// Living particles on homepage only. Research pages get clean text + glow.
var h1=document.querySelector('h1');
if(h1 && isDark && !isHomepage){
  h1.style.transition='text-shadow 2s ease';
  var glowPhase=0;
  setInterval(function(){
    glowPhase+=0.05;
    var glow=0.08+Math.sin(glowPhase)*0.06;
    h1.style.textShadow='0 0 '+(10+Math.sin(glowPhase)*5)+'px rgba(184,117,58,'+glow.toFixed(3)+')';
  },50);
}

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

  // 137 coupled oscillators as background — every page is alive
  var N_BG = 33; // lighter than homepage but still coupled
  var motes=[];
  var bgPhases=new Float64Array(N_BG);
  var bgOmega=new Float64Array(N_BG);
  var GA_BG=2.39996322; // golden angle
  for(var i=0;i<N_BG;i++){
    bgPhases[i]=Math.random()*Math.PI*2;
    bgOmega[i]=(0.3+Math.random()*0.7)*Math.PI*2*0.4;
    motes.push({
      x:Math.random()*2000,y:Math.random()*2000,
      vx:(Math.random()-0.5)*0.06,vy:(Math.random()-0.5)*0.06,
      s:Math.random()*1.8+0.3,
      base:Math.random()*0.04+0.015,
      flicker:Math.random()*0.5+0.5,
      phase:bgPhases[i],
      warm:Math.random()
    });
  }

  var bgT=0;
  function bgDraw(){
    bgT+=0.016;
    bgCx.clearRect(0,0,bW,bH);

    // Kuramoto step: coupled phase update
    var bgK=0.8;
    var mre=0,mim=0;
    for(var i=0;i<N_BG;i++){mre+=Math.cos(bgPhases[i]);mim+=Math.sin(bgPhases[i]);}
    mre/=N_BG;mim/=N_BG;
    var bgR=Math.sqrt(mre*mre+mim*mim);
    var bgPsi=Math.atan2(mim,mre);
    for(var i=0;i<N_BG;i++){
      bgPhases[i]+=0.016*(bgOmega[i]+bgK*Math.sin(bgPsi-bgPhases[i]));
    }

    // Draw connections between phase-locked neighbors
    for(var i=0;i<N_BG;i++){
      for(var j=i+1;j<N_BG;j++){
        var sync=Math.cos(bgPhases[j]-bgPhases[i]);
        if(sync>0.85){
          var dx=motes[j].x-motes[i].x,dy=motes[j].y-motes[i].y;
          var d=Math.sqrt(dx*dx+dy*dy);
          if(d<300){
            var ca=(sync-0.85)*6*(1-d/300)*0.04;
            bgCx.beginPath();
            bgCx.moveTo(motes[i].x,motes[i].y);
            bgCx.lineTo(motes[j].x,motes[j].y);
            bgCx.strokeStyle='rgba(184,117,58,'+ca.toFixed(4)+')';
            bgCx.lineWidth=0.5;
            bgCx.stroke();
          }
        }
      }
    }

    // Draw nodes
    for(var i=0;i<N_BG;i++){
      var m=motes[i];
      m.x+=m.vx;m.y+=m.vy;
      if(m.x<0)m.x=bW;if(m.x>bW)m.x=0;
      if(m.y<0)m.y=bH;if(m.y>bH)m.y=0;

      var breath=Math.sin(bgPhases[i]);
      var alpha=m.base*(0.5+Math.abs(breath)*0.5);
      // Brighter when phase-locked with the group
      var lockBoost=Math.max(0,Math.cos(bgPsi-bgPhases[i]))*0.03;
      alpha+=lockBoost;

      var r=Math.floor(184+m.warm*16);
      var g=Math.floor(117+m.warm*30);
      var b=Math.floor(58+m.warm*20);

      var gl=bgCx.createRadialGradient(m.x,m.y,0,m.x,m.y,m.s*5);
      gl.addColorStop(0,'rgba('+r+','+g+','+b+','+(alpha*0.4).toFixed(4)+')');
      gl.addColorStop(0.4,'rgba('+r+','+g+','+b+','+(alpha*0.1).toFixed(4)+')');
      gl.addColorStop(1,'rgba('+r+','+g+','+b+',0)');
      bgCx.fillStyle=gl;
      bgCx.fillRect(m.x-m.s*5,m.y-m.s*5,m.s*10,m.s*10);

      bgCx.beginPath();bgCx.arc(m.x,m.y,m.s*(0.5+Math.abs(breath)*0.3),0,Math.PI*2);
      bgCx.fillStyle='rgba('+Math.min(255,r+40)+','+Math.min(255,g+30)+','+Math.min(255,b+20)+','+(alpha*1.2).toFixed(4)+')';
      bgCx.fill();
    }
    requestAnimationFrame(bgDraw);
  }
  bgDraw();
}

})();
