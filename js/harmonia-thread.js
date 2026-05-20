// Suppress Harmonia's own floating orb/panel.
// Classified/gated research card injection removed.
// Also removes stale injected atlas blocks left by older cached scripts.
(function(){
  'use strict';
  function removeClassifiedAtlasBlock(){
    if(location.pathname !== '/research/' && location.pathname !== '/research/index.html') return;
    var block = document.getElementById('classified-topics');
    if(block && block.parentNode) block.parentNode.removeChild(block);
    var stale = document.querySelectorAll('[data-classified-card]');
    for(var i=0;i<stale.length;i++){
      var group = stale[i].closest('.group');
      if(group && group.parentNode) group.parentNode.removeChild(group);
      else if(stale[i].parentNode) stale[i].parentNode.removeChild(stale[i]);
    }
  }
  var s = document.createElement('style');
  s.textContent = '#harmonia-orb{display:none!important;}#harmonia-panel{display:none!important;}#classified-topics{display:none!important;}';
  document.head.appendChild(s);
  removeClassifiedAtlasBlock();
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', removeClassifiedAtlasBlock);
  else removeClassifiedAtlasBlock();
  setTimeout(removeClassifiedAtlasBlock,50);
  setTimeout(removeClassifiedAtlasBlock,250);
  setTimeout(removeClassifiedAtlasBlock,1000);
  setTimeout(removeClassifiedAtlasBlock,2500);
  if(window.MutationObserver){
    new MutationObserver(removeClassifiedAtlasBlock).observe(document.documentElement,{childList:true,subtree:true});
  }
})();
