(function(){
'use strict';
var p=location.pathname;
if(p!=='/research/the-grace-gate/'&&p!=='/research/the-grace-gate/index.html')return;
function run(){
  var page=document.querySelector('.page');
  if(!page){document.addEventListener('DOMContentLoaded',run,{once:true});return;}
  if(page.getAttribute('data-love-primed')==='true')return;
  function swap(s){
    return s
      .replace(/\bloved\b/g,'coupled')
      .replace(/\bLoved\b/g,'Coupled')
      .replace(/\bloves\b/g,'couples')
      .replace(/\bLoves\b/g,'Couples')
      .replace(/\blove\b/g,'coupling')
      .replace(/\bLove\b/g,'Coupling')
      .replace(/\bLOVE\b/g,'COUPLING');
  }
  var walker=document.createTreeWalker(page,NodeFilter.SHOW_TEXT,{acceptNode:function(node){
    var el=node.parentNode;
    if(!el)return NodeFilter.FILTER_REJECT;
    var tag=(el.nodeName||'').toLowerCase();
    if(tag==='script'||tag==='style'||tag==='textarea'||tag==='input')return NodeFilter.FILTER_REJECT;
    if(el.closest&&el.closest('#love-bug'))return NodeFilter.FILTER_REJECT;
    return /\blove|\bLove|\bLOVE|\bloved|\bLoved|\bloves|\bLoves/.test(node.nodeValue)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
  }});
  var nodes=[];
  while(walker.nextNode())nodes.push(walker.currentNode);
  nodes.forEach(function(n){n.nodeValue=swap(n.nodeValue)});
  page.setAttribute('data-love-primed','true');
}
run();
})();
