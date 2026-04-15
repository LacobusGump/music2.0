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

// ═══ 1. SECTION TITLES: glow when they enter viewport ═══
var h2s=document.querySelectorAll('h2');
if(h2s.length>0&&'IntersectionObserver' in window){
  var h2Obs=new IntersectionObserver(function(entries){
    for(var i=0;i<entries.length;i++){
      var e=entries[i];
      if(e.isIntersecting){
        e.target.style.transition='text-shadow 0.8s ease, opacity 0.8s ease';
        e.target.style.textShadow='0 0 12px rgba(201,164,74,0.3), 0 0 30px rgba(201,164,74,0.1)';
        e.target.style.opacity='1';
      }else{
        e.target.style.textShadow='0 0 8px rgba(201,164,74,0.05)';
        e.target.style.opacity='0.8';
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
bgCanvas.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;pointer-events:none;';
document.body.appendChild(bgCanvas);
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
for(var i=0;i<25;i++){
  motes.push({
    x:Math.random()*2000,y:Math.random()*2000,
    vx:(Math.random()-0.5)*0.12,vy:(Math.random()-0.5)*0.12,
    s:Math.random()*1.8+0.5,a:Math.random()*0.08+0.03
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
    var pulse=m.a*(0.7+Math.sin(bgT/PHI+i*2.4)*0.3);
    // Glow
    var g=bgCx.createRadialGradient(m.x,m.y,0,m.x,m.y,m.s*4);
    g.addColorStop(0,'rgba(201,164,74,'+(pulse*0.5)+')');
    g.addColorStop(1,'rgba(201,164,74,0)');
    bgCx.fillStyle=g;
    bgCx.fillRect(m.x-m.s*4,m.y-m.s*4,m.s*8,m.s*8);
    // Core
    bgCx.beginPath();bgCx.arc(m.x,m.y,m.s,0,Math.PI*2);
    bgCx.fillStyle='rgba(201,164,74,'+pulse+')';
    bgCx.fill();
  }
  requestAnimationFrame(bgDraw);
}
bgDraw();

})();
