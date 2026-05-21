// FIRST TIMER MIRROR — borrowed grammar from /mirror/
// black field · two mirrored attractors · 137 coupled points · R/T made visible
(function(){
'use strict';

var path = location.pathname;
if(path !== '/start-here/' && path !== '/start-here/index.html') return;
if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

function ready(fn){
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
  else fn();
}

ready(function(){
  var box = document.querySelector('.visual');
  if(!box || document.getElementById('first-timer-mirror-canvas')) return;

  var style = document.createElement('style');
  style.textContent = '.visual.mirror-visual{background:#000;border-color:rgba(201,164,74,.13);box-shadow:0 30px 95px rgba(0,0,0,.38),0 0 80px rgba(116,199,210,.045),inset 0 0 70px rgba(201,164,74,.025)}.mirror-visual:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,rgba(201,164,74,.05),transparent 26%),radial-gradient(circle at 28% 50%,rgba(201,164,74,.035),transparent 25%),radial-gradient(circle at 72% 50%,rgba(116,199,210,.045),transparent 25%);pointer-events:none;z-index:1}.mirror-visual canvas{position:absolute;inset:0;width:100%;height:100%;z-index:0}.mirror-caption{position:absolute;left:18px;bottom:16px;z-index:2;border:1px solid rgba(201,164,74,.16);border-radius:999px;background:rgba(0,0,0,.50);padding:9px 13px;font-family:"Courier New",monospace;font-size:.68em;color:rgba(232,207,160,.68);backdrop-filter:blur(6px)}.mirror-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#c9a44a;box-shadow:0 0 14px rgba(201,164,74,.7);margin-right:7px}.mirror-word{position:absolute;right:18px;top:16px;z-index:2;font-family:Futura,"Century Gothic",system-ui,sans-serif;font-size:.56em;letter-spacing:.18em;text-transform:uppercase;color:rgba(201,164,74,.28)}';
  document.head.appendChild(style);

  box.classList.add('mirror-visual');
  box.innerHTML = '<canvas id="first-timer-mirror-canvas" aria-hidden="true"></canvas><div class="mirror-word">mirror field</div><div class="mirror-caption"><span class="mirror-dot"></span><span id="first-timer-mirror-readout">K=1.868 · R=0.000 · T=1.000 · 137</span></div>';

  var cv = document.getElementById('first-timer-mirror-canvas');
  var read = document.getElementById('first-timer-mirror-readout');
  var cx = cv.getContext('2d');
  var W = 1, H = 1, dpr = 1;
  var TAU = Math.PI * 2;
  var PHI = (1 + Math.sqrt(5)) / 2;
  var N = 137;
  var nodes = [];
  var t = 0;
  var R = 0;
  var psi = 0;
  var mouse = {x:0,y:0,on:false};

  function resize(){
    dpr = window.devicePixelRatio || 1;
    var r = cv.getBoundingClientRect();
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    cv.width = W * dpr;
    cv.height = H * dpr;
    cx.setTransform(dpr,0,0,dpr,0,0);
  }

  function init(){
    resize();
    nodes = [];
    for(var i=0;i<N;i++){
      var side = i % 2 ? 1 : -1;
      var a = i * 2.399963229728653;
      var r = Math.sqrt(i/N);
      nodes.push({
        i:i,
        side:side,
        x:W/2 + side*W*.16 + Math.cos(a)*r*W*.18,
        y:H/2 + Math.sin(a)*r*H*.26,
        vx:0,vy:0,
        p:Math.random()*TAU,
        o:(.33 + Math.random()*.58)*TAU,
        s:.55 + Math.random()*1.85,
        seed:Math.random()*TAU,
        lock:0
      });
    }
  }

  function order(){
    var re=0, im=0;
    for(var i=0;i<N;i++){ re += Math.cos(nodes[i].p); im += Math.sin(nodes[i].p); }
    re /= N; im /= N;
    R = Math.sqrt(re*re + im*im);
    psi = Math.atan2(im,re);
  }

  function step(){
    t += .016;
    order();
    var breathe = .55 + .45*Math.sin(t*.21);
    for(var i=0;i<N;i++){
      var n = nodes[i];
      var u = i / (N-1);
      var mirrorA = n.side < 0 ? Math.PI - u*Math.PI*1.72 : u*Math.PI*1.72;
      var spiral = i * 2.399963229728653 + t*(.10 + n.side*.035);
      var radius = Math.sqrt(u) * Math.min(W,H) * (.26 + .055*Math.sin(t*.17 + n.seed));
      var cx0 = W/2 + n.side * W * (.17 + .035*Math.sin(t*.13));
      var cy0 = H/2 + Math.sin(t*.09) * H*.025;
      var tx = cx0 + Math.cos(spiral)*radius*.72 + Math.cos(mirrorA + t*.18)*W*.055;
      var ty = cy0 + Math.sin(spiral)*radius + Math.sin(mirrorA*PHI - t*.15)*H*.06;

      var md = 999;
      if(mouse.on){
        var mx = mouse.x - n.x, my = mouse.y - n.y;
        md = Math.sqrt(mx*mx + my*my);
        if(md < 180){
          var pull = (1-md/180)*.022;
          tx += mx * pull * 6;
          ty += my * pull * 6;
        }
      }

      n.p += .014 * (n.o + 1.868*Math.sin(psi-n.p));
      n.lock += ((R + Math.max(0,1-md/180))*.5 - n.lock) * .035;
      n.vx += (tx - n.x) * (.006 + R*.012 + n.lock*.012);
      n.vy += (ty - n.y) * (.006 + R*.012 + n.lock*.012);
      n.vx *= .91; n.vy *= .91;
      n.x += n.vx; n.y += n.vy;
      if(n.x<-40)n.x=W+40;if(n.x>W+40)n.x=-40;if(n.y<-40)n.y=H+40;if(n.y>H+40)n.y=-40;
    }
  }

  function draw(){
    step();
    cx.clearRect(0,0,W,H);
    cx.globalCompositeOperation = 'source-over';
    var bg = cx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*.7);
    bg.addColorStop(0,'rgba(20,14,8,.92)');
    bg.addColorStop(.45,'rgba(0,0,0,.92)');
    bg.addColorStop(1,'rgba(0,0,0,1)');
    cx.fillStyle = bg;
    cx.fillRect(0,0,W,H);

    cx.globalCompositeOperation = 'lighter';
    var left = {x:W*.33,y:H*.51};
    var right = {x:W*.67,y:H*.51};
    var center = {x:W*.5,y:H*.5};

    function glow(x,y,c,a,rad){
      var g = cx.createRadialGradient(x,y,0,x,y,rad);
      g.addColorStop(0,'rgba('+c+','+a+')');
      g.addColorStop(1,'rgba('+c+',0)');
      cx.fillStyle = g;
      cx.fillRect(x-rad,y-rad,rad*2,rad*2);
    }
    glow(left.x,left.y,'201,164,74',.075+R*.05,Math.min(W,H)*.36);
    glow(right.x,right.y,'116,199,210',.075+R*.05,Math.min(W,H)*.36);
    glow(center.x,center.y,'232,207,160',.045+R*.08,Math.min(W,H)*.25);

    for(var i=0;i<N;i+=2){
      var a = nodes[i];
      for(var j=i+5;j<N;j+=11){
        var b = nodes[j];
        var dx = a.x-b.x, dy = a.y-b.y, d = Math.sqrt(dx*dx+dy*dy);
        if(d > 125) continue;
        var pd = Math.abs(a.p-b.p) % TAU; if(pd>Math.PI) pd = TAU-pd;
        var sync = 1 - pd/Math.PI;
        if(sync < .72) continue;
        var cross = a.side !== b.side;
        cx.strokeStyle = cross ? 'rgba(232,207,160,'+((1-d/125)*sync*.075).toFixed(3)+')' : (a.side<0?'rgba(201,164,74,':'rgba(116,199,210,') + ((1-d/125)*sync*.060).toFixed(3) + ')';
        cx.lineWidth = cross ? .9 : .55;
        cx.beginPath(); cx.moveTo(a.x,a.y); cx.lineTo(b.x,b.y); cx.stroke();
      }
    }

    cx.strokeStyle = 'rgba(232,207,160,'+(.045+R*.06).toFixed(3)+')';
    cx.lineWidth = 1;
    cx.beginPath();
    cx.ellipse(W/2,H/2,W*.29,H*.34,0,0,TAU);
    cx.stroke();
    cx.beginPath();
    cx.ellipse(W/2,H/2,W*.29,H*.34,Math.PI/2,0,TAU);
    cx.stroke();

    for(i=0;i<N;i++){
      var n = nodes[i];
      var bright = .32 + .5*Math.max(0,Math.cos(n.p-psi)) + n.lock*.35;
      var size = n.s * (.8 + bright*.75);
      var color = n.side < 0 ? '201,164,74' : '116,199,210';
      cx.fillStyle = 'rgba('+color+','+(.11+bright*.28).toFixed(3)+')';
      cx.beginPath(); cx.arc(n.x,n.y,size,0,TAU); cx.fill();
    }

    var core = cx.createRadialGradient(W/2,H/2,0,W/2,H/2,60+R*80);
    core.addColorStop(0,'rgba(255,250,220,'+(.20+R*.34).toFixed(3)+')');
    core.addColorStop(.35,'rgba(232,207,160,'+(.08+R*.13).toFixed(3)+')');
    core.addColorStop(1,'rgba(232,207,160,0)');
    cx.fillStyle = core;
    cx.fillRect(W/2-160,H/2-160,320,320);

    cx.globalCompositeOperation = 'source-over';
    if(read) read.textContent = 'K=1.868 · R='+R.toFixed(3)+' · T='+(1-R).toFixed(3)+' · 137';
    requestAnimationFrame(draw);
  }

  box.addEventListener('mousemove',function(e){
    var r = cv.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.on = true;
  },{passive:true});
  box.addEventListener('mouseleave',function(){mouse.on=false;},{passive:true});
  window.addEventListener('resize',init,{passive:true});
  init();
  draw();
});
})();