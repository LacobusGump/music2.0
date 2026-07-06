// reveal.js — scroll-triggered entrance animations. One script tag, drop it on any page.
// Usage: add data-reveal="left" | "right" | "up" | "depth" to any element.
// Group children with data-reveal-group on the parent for auto-staggered delays.
(function(){
'use strict';
var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

var style = document.createElement('style');
style.textContent =
  '[data-reveal]{opacity:0;will-change:transform,opacity;transition:opacity .7s cubic-bezier(.22,.9,.28,1),transform .7s cubic-bezier(.22,.9,.28,1),box-shadow .7s ease;}' +
  '[data-reveal="left"]{transform:translateX(-32px);}' +
  '[data-reveal="right"]{transform:translateX(32px);}' +
  '[data-reveal="up"]{transform:translateY(28px);}' +
  '[data-reveal="depth"]{transform:translateY(18px) scale(.94);box-shadow:0 0 0 rgba(0,0,0,0);}' +
  '[data-reveal].is-revealed{opacity:1;transform:none;}' +
  '[data-reveal="depth"].is-revealed{box-shadow:0 18px 40px rgba(0,0,0,.28);}';
document.head.appendChild(style);

if(reduce){
  // no animation — just make everything visible immediately
  document.querySelectorAll('[data-reveal]').forEach(function(el){ el.classList.add('is-revealed'); });
  return;
}

// auto-stagger: children of a data-reveal-group get increasing transition-delay
document.querySelectorAll('[data-reveal-group]').forEach(function(group){
  var kids = group.querySelectorAll('[data-reveal]');
  var step = parseFloat(group.dataset.revealStep) || 0.08;
  kids.forEach(function(el, i){ el.style.transitionDelay = (i*step).toFixed(2)+'s'; });
});

var io = new IntersectionObserver(function(entries){
  entries.forEach(function(entry){
    if(entry.isIntersecting){
      entry.target.classList.add('is-revealed');
      io.unobserve(entry.target); // reveal once, don't re-hide on scroll back up
    }
  });
}, {threshold:0.15, rootMargin:'0px 0px -8% 0px'});

document.querySelectorAll('[data-reveal]').forEach(function(el){ io.observe(el); });
})();
