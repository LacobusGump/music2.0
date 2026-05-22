(function(){
'use strict';
if(location.pathname!=='/research/'&&location.pathname!=='/research/index.html')return;
var gated=[
'/research/religion/','/research/the-builder/','/research/dreamtime/','/research/scripture-engineering/','/research/sirius-signal/','/research/lost-civilizations/','/research/voynich/','/research/proto-elamite/','/research/indus-script/','/research/aaron-is-right/','/research/from-twitter/','/research/loo9/','/research/in-memory/','/research/the-download/','/research/shroud/','/research/sirius-thesis/','/research/crop-circles/','/research/leedskalnin/','/research/calendar-decode/','/research/planetary-geometry/','/research/comedians/','/research/the-jumps/','/research/dr-adk/','/research/for-taelin/','/research/sleep-dreams/','/research/earth-cell/','/research/sacsayhuaman/','/research/the-shape-keepers/'
];
var set={};gated.forEach(function(p){set[p]=true});
function norm(h){try{return new URL(h,location.origin).pathname.replace(/index\.html$/,'').replace(/\/+$/,'/')||'/'}catch(e){return h}}
function mark(){
  document.querySelectorAll('a.card').forEach(function(a){
    var p=norm(a.getAttribute('href')||'');
    if(set[p]){
      a.classList.add('gated');
      a.setAttribute('data-gated','true');
      a.setAttribute('aria-label',(a.textContent||'gated study')+' — gated');
    }
  });
  var note=document.querySelector('.footer-note');
  if(note)note.textContent='⬡ = gated · password required.';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mark);else mark();
})();
