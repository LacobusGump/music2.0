// scrub.js — continuous scroll-linked progress. Companion to reveal.js.
// reveal.js = one-shot (fades in once, done). This is the other half: a live 0→1
// value driven directly by scroll position, for parallax, pinned-dissolve heroes,
// and anything that should unravel WITH the scroll instead of just appearing.
//
// Usage: window.gumpScrub(el, function(progress, rect){ ... }) — progress is 0
// when el enters the bottom of the viewport, 1 when it exits the top.
// Only runs its rAF loop while at least one tracked element is actually near
// the viewport (gated by IntersectionObserver) — not a permanent scroll listener.
(function(){
'use strict';
var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
if(reduce){ window.gumpScrub = function(){}; return; } // scrubbed motion is exactly what reduced-motion opts out of

var tracked = [];
var ticking = false;

var io = new IntersectionObserver(function(entries){
  entries.forEach(function(entry){
    for(var i=0;i<tracked.length;i++){
      if(tracked[i].el === entry.target){ tracked[i].active = entry.isIntersecting; break; }
    }
  });
  ensureLoop();
}, {rootMargin:'25% 0px 25% 0px'});

function ensureLoop(){
  if(!ticking && tracked.some(function(t){return t.active;})){ ticking = true; requestAnimationFrame(loop); }
}

function loop(){
  var vh = innerHeight, anyActive = false;
  for(var i=0;i<tracked.length;i++){
    var item = tracked[i];
    if(!item.active) continue;
    anyActive = true;
    var r = item.el.getBoundingClientRect();
    var total = r.height + vh;
    var p = total>0 ? (vh - r.top) / total : 0;
    if(p<0)p=0; else if(p>1)p=1;
    item.onProgress(p, r);
  }
  if(anyActive) requestAnimationFrame(loop);
  else ticking = false;
}

window.gumpScrub = function(el, onProgress){
  tracked.push({el:el, onProgress:onProgress, active:false});
  io.observe(el);
};
})();
