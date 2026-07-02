/* audio.js — mobile-safe audio for begump.com
   Loads in <head> so its document listeners register BEFORE the inline
   autoplay scripts at the bottom of each page. When a play button is
   tapped, this fires first (capture phase), handles the play/pause with
   proper Promise flow, and calls stopImmediatePropagation() to prevent
   the onG document listener from also firing — which caused the
   double-play race condition on mobile. */
(function(){
'use strict';
var PL='▶',PA='▐▐'; // must match the pause glyph every embedded button actually uses (see CLAUDE.md pattern)

function findBtn(t){
  while(t&&t!==document){
    if(t.id&&t.id.slice(-4)==='-btn')return t;
    t=t.parentElement;
  }
  return null;
}

// Block onG's touchstart for standard audio button taps.
// Non-standard buttons (doors ♫, etc.) keep their own handlers.
document.addEventListener('touchstart',function(e){
  var btn=findBtn(e.target);
  if(!btn)return;
  var tc=btn.textContent;
  if(tc!==PL&&tc!==PA)return;
  var audio=document.getElementById(btn.id.slice(0,-4));
  if(!audio||audio.tagName!=='AUDIO')return;
  e.stopImmediatePropagation();
},true);

// Handle play/pause before onG and before inline onclick.
document.addEventListener('click',function(e){
  var btn=findBtn(e.target);
  if(!btn)return;
  var tc=btn.textContent;
  if(tc!==PL&&tc!==PA)return; // skip ♫ and other special buttons
  var audio=document.getElementById(btn.id.slice(0,-4));
  if(!audio||audio.tagName!=='AUDIO')return;
  e.stopImmediatePropagation(); // block onG click listener
  e.stopPropagation();           // block button's inline onclick
  // If the page has the top radio, the song routes INTO it — one player, one source of
  // truth. The radio takes over this button's glyph. Falls back to inline play if no radio.
  if(window.gumpRadio){
    window.gumpRadio.toggle(audio.currentSrc||audio.src);
    return;
  }
  if(audio.paused){
    audio.play()
      .then(function(){btn.textContent=PA;})
      .catch(function(){btn.textContent=PL;});
  }else{
    audio.pause();
    btn.textContent=PL;
  }
},true);
})();

// ── cross-tab audio lock — only one tab's audio plays at a time ──
// The radio bar already carries a stream across page navigations within one
// tab (sessionStorage). But browsers clone sessionStorage into a new tab
// opened via a link click, so an already-playing tab's "I'm playing" state
// leaks into the new tab, which then spins up its own independent <audio>
// element — two tabs, two sources, layered. Individual inline song embeds
// have the same problem from their own muted-autoplay-on-load. Fix: every
// play(), anywhere on the site, in any tab, claims ownership over
// BroadcastChannel (+ localStorage as a fallback for older browsers). Any
// other tab hearing a claim that isn't its own immediately pauses everything
// it has playing. Whichever tab you last pressed play in wins — that's the
// one that keeps sounding, exactly like a single-tab session already does.
(function(){
'use strict';
var TAB_ID='gt-'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);
var LOCK_KEY='gump_audio_owner';
var bc=null;
try{if('BroadcastChannel' in window)bc=new BroadcastChannel('gump-audio');}catch(e){}

function pauseAllLocal(){
  var els=document.getElementsByTagName('audio');
  for(var i=0;i<els.length;i++){if(!els[i].paused)els[i].pause();}
}
function claim(){
  var msg={tabId:TAB_ID,ts:Date.now()};
  if(bc){try{bc.postMessage(msg);}catch(e){}}
  try{localStorage.setItem(LOCK_KEY,JSON.stringify(msg));}catch(e){}
}
function onRemoteClaim(msg){
  if(!msg||msg.tabId===TAB_ID)return; // ignore our own echo, if any
  pauseAllLocal();
}

if(bc)bc.onmessage=function(e){onRemoteClaim(e.data);};
// storage event only ever fires in OTHER tabs, never the one that wrote the key —
// exactly the fallback semantics we want, no self-filtering needed here either.
window.addEventListener('storage',function(e){
  if(e.key!==LOCK_KEY||!e.newValue)return;
  try{onRemoteClaim(JSON.parse(e.newValue));}catch(err){}
});

// catches every <audio> on the page however it was started — inline embed,
// the radio bar, an egg unlock, all of it. play doesn't bubble, but capture does.
document.addEventListener('play',function(e){
  if(e.target&&e.target.tagName==='AUDIO')claim();
},true);
})();

if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js');}
// mobile tap target — bumps all audio buttons to 44px on phones (inline styles can't override this without !important)
(function(){var s=document.createElement('style');s.textContent='@media(max-width:760px){[id$="-btn"]{min-width:44px!important;min-height:44px!important;width:44px!important;height:44px!important;}}';document.head.appendChild(s);})();

