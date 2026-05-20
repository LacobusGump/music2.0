(function(){
'use strict';
function load(){var p=location.pathname;if(p!=='/products/'&&p!=='/products/index.html')return;if(document.querySelector('script[src^="/js/products-room.js"]'))return;var s=document.createElement('script');s.src='/js/products-room.js?v=2';document.head.appendChild(s)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load);else load();
})();
