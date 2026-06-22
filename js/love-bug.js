// love-bug.js — add to any page that carries a song.
// Detects the page slug, finds the matching song from RADIO.list,
// and injects a love bug at the bottom of .page (or body if not found).
// Clicking it writes to localStorage so /radio/ sees the unlock.
(function(){
  // wait for RADIO to be available (playlist.js must load first)
  function init(){
    var R=window.RADIO; if(!R) return;
    var slug=R.slug();
    // find the song owned by this page
    var song=null;
    for(var i=0;i<R.list.length;i++){
      if(R.list[i].page===slug){ song=R.list[i]; break; }
    }
    if(!song) return; // no song assigned to this page

    // derive the audio file slug (same key used by gump_unlocks)
    var fslug=(song.f||'').split('/').pop().replace(/\.[^.]+$/,'');

    // always-free songs: no bug needed
    var FREE={coupled_dynamics_remix:1,mashed_coupling:1,twelve_bullet_points_v3:1};
    if(FREE[fslug]) return;

    // check if already unlocked
    function isUnlocked(){
      try{
        var u=JSON.parse(localStorage.getItem('gump_unlocks')||'{}');
        if(u.all||u[fslug]) return true;
      }catch(e){}
      // grace check
      var GRACE_BEFORE=1767225600000; // 2027-01-01
      var g=+localStorage.getItem('gump_v1');
      return !!(g && g < GRACE_BEFORE);
    }

    // mark first visit
    if(!localStorage.getItem('gump_v1')) localStorage.setItem('gump_v1',Date.now());

    var wrap=document.querySelector('.page')||document.body;
    var bug=document.createElement('div');
    bug.id='love-bug';
    bug.style.cssText='margin:48px auto 0;padding:18px 0 0;border-top:1px solid rgba(184,117,58,0.1);text-align:center;';

    function render(unlocked){
      if(unlocked){
        bug.innerHTML='<div style="font-family:Futura,\'Century Gothic\',system-ui,sans-serif;font-size:0.5em;letter-spacing:0.18em;text-transform:uppercase;color:rgba(184,117,58,0.4);">— unlocked —</div>'+
          '<div style="font-size:0.72em;color:#8a7560;font-family:Georgia,serif;margin-top:5px;font-style:italic;">'+song.t+' · <a href="/radio/" style="color:#b8753a;text-decoration:none;border-bottom:1px solid rgba(184,117,58,0.25);">play it →</a></div>';
        bug.style.cursor='default';
      } else {
        bug.innerHTML='<div style="font-size:1.4em;cursor:pointer;" id="lb-icon">🦋</div>'+
          '<div style="font-family:Futura,\'Century Gothic\',system-ui,sans-serif;font-size:0.46em;letter-spacing:0.16em;text-transform:uppercase;color:rgba(184,117,58,0.38);margin-top:5px;">unlock · '+song.t+'</div>'+
          '<div style="font-size:0.62em;color:#5a4a3a;font-style:italic;font-family:Georgia,serif;margin-top:3px;">read the work — tap the bug</div>';
        bug.style.cursor='pointer';
        bug.onclick=function(){
          try{
            var u=JSON.parse(localStorage.getItem('gump_unlocks')||'{}');
            u[fslug]=true;
            localStorage.setItem('gump_unlocks',JSON.stringify(u));
          }catch(e){}
          render(true);
        };
      }
    }

    render(isUnlocked());
    wrap.appendChild(bug);
  }

  // playlist.js loads synchronously before this, but guard anyway
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init);
  } else {
    init();
  }
})();
