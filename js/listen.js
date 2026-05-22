(function(){
'use strict';
function add(src){
  if(document.querySelector('script[src^="'+src+'"]'))return;
  var s=document.createElement('script');
  s.src=src;
  s.async=false;
  document.head.appendChild(s);
}
function load(){
  var p=location.pathname;
  if(p==='/research/the-grace-gate/'||p==='/research/the-grace-gate/index.html')add('/js/grace-love-prime.js?v=2');
  if(p==='/products/'||p==='/products/index.html')add('/js/products-room.js?v=2');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load);else load();
})();
