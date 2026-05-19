// GUMP FLOW — keeps deep routes returning to the door that opened them.
// Static site. No router. Just memory of where the coupling began.
(function(){
'use strict';
var KEY='gump:return:research';
function norm(path){
  path=(path||location.pathname).replace(/\/index\.html$/,'/');
  if(path.length>1) path=path.replace(/\/$/,'');
  return path || '/';
}
function isResearch(path){path=norm(path);return path==='/research'||path.indexOf('/research/')===0;}
function isDoors(path){return norm(path)==='/research/doors';}
function rememberDoors(){try{sessionStorage.setItem(KEY,'/research/doors/');}catch(e){}}
function remembered(){try{return sessionStorage.getItem(KEY);}catch(e){return null;}}
function rewriteBackLinks(){
  var path=norm(location.pathname);
  if(isDoors(path)){
    var doorBack=document.querySelector('a.back');
    if(doorBack && norm(doorBack.getAttribute('href')||'')==='/research'){
      doorBack.href='/';
      doorBack.textContent='← GUMP';
      doorBack.setAttribute('aria-label','Return to GUMP home');
    }
    return;
  }
  if(!isResearch(path))return;
  if(remembered()!=='/research/doors/')return;
  var links=document.querySelectorAll('a.back[href="/research/"],a.back[href="/research"],a[href="/research/"].back,a[href="/research"].back');
  for(var i=0;i<links.length;i++){
    links[i].href='/research/doors/';
    links[i].textContent='← research doors';
    links[i].setAttribute('aria-label','Return to research doors');
  }
}
if(isDoors()) rememberDoors();
document.addEventListener('click',function(e){
  var a=e.target.closest&&e.target.closest('a[href]');
  if(!a)return;
  var href=a.getAttribute('href')||'';
  if(!href || href.charAt(0)!=='/')return;
  if(isDoors(location.pathname) && /^\/research\/(?!$)/.test(href)) rememberDoors();
  if(norm(location.pathname)==='/' && norm(href)==='/research/doors') rememberDoors();
},true);
rewriteBackLinks();
window.addEventListener('pageshow',rewriteBackLinks);
})();
