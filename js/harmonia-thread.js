// Suppress Harmonia's own floating orb/panel.
// Classified/gated research card injection removed.
(function(){
  'use strict';
  var s = document.createElement('style');
  s.textContent = '#harmonia-orb{display:none!important;}#harmonia-panel{display:none!important;}';
  document.head.appendChild(s);
})();
