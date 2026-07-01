// love-bug.js — add to any page that carries a song.
// Detects the page slug, finds the matching song from RADIO.list,
// and injects a love bug at the bottom of .page (or body if not found).
// Clicking it writes to localStorage so /radio/ sees the unlock.
(function(){
  function init(){
    var R=window.RADIO; if(!R) return;
    var slug=R.slug();
    var song=null;
    for(var i=0;i<R.list.length;i++){
      if(R.list[i].page===slug){ song=R.list[i]; break; }
    }
    if(!song) return;

    var fslug=(song.f||'').split('/').pop().replace(/\.[^.]+$/,'');
    var songIdx=R.list.indexOf(song); // direct index — bypasses SHARED slug redirects

    var HARMONIA_PAGES={framework:1,'computation-floor':1,'how-we-work':1,'science-tree':1,chemistry:1,alzheimers:1,'bird-coupling':1,harmonia:1,'the-loop':1};
    var LINK_SONG='https://buy.stripe.com/00wcN5clOgVb10N5PWfIs0h'; // $1 One Key — same link as /radio/

    function isUnlocked(){
      try{
        var u=JSON.parse(localStorage.getItem('gump_unlocks')||'{}');
        if(u.all||u[fslug]) return true;
      }catch(e){}
      if(!!localStorage.getItem('gump_harmonia') && HARMONIA_PAGES[slug]) return true;
      return false;
    }

    var wrap=document.querySelector('.page')||document.body;
    var bug=document.createElement('div');
    bug.id='love-bug';
    bug.style.cssText='margin:48px auto 0;padding:18px 0 0;border-top:1px solid rgba(184,117,58,0.1);text-align:center;';

    function render(unlocked){
      if(unlocked){
        bug.innerHTML='<div style="font-family:Futura,\'Century Gothic\',system-ui,sans-serif;font-size:0.5em;letter-spacing:0.18em;text-transform:uppercase;color:rgba(184,117,58,0.4);">— unlocked —</div>'+
          '<div style="font-size:0.72em;color:#8a7560;font-family:Georgia,serif;margin-top:5px;font-style:italic;">'+song.t+' · <a href="/radio/?i='+songIdx+'" style="color:#b8753a;text-decoration:none;border-bottom:1px solid rgba(184,117,58,0.25);">play it →</a></div>';
        bug.style.cursor='default';
      } else {
        bug.innerHTML='<div style="font-size:1.4em;cursor:pointer;" id="lb-icon">🦋</div>'+
          '<div style="font-family:Futura,\'Century Gothic\',system-ui,sans-serif;font-size:0.46em;letter-spacing:0.16em;text-transform:uppercase;color:rgba(184,117,58,0.38);margin-top:5px;">'+song.t+' · $1</div>'+
          '<div style="font-size:0.62em;color:#5a4a3a;font-style:italic;font-family:Georgia,serif;margin-top:3px;">tap the bug to hear it</div>';
        bug.style.cursor='pointer';
        bug.onclick=function(){
          try{ sessionStorage.setItem('gump_pend',JSON.stringify({slug:fslug,ts:Date.now()})); }catch(e){}
          location.href=LINK_SONG;
        };
      }
    }

    render(isUnlocked());
    wrap.appendChild(bug);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init);
  } else {
    init();
  }
})();
