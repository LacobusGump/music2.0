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
if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js');}
// mobile tap target — bumps all audio buttons to 44px on phones (inline styles can't override this without !important)
(function(){var s=document.createElement('style');s.textContent='@media(max-width:760px){[id$="-btn"]{min-width:44px!important;min-height:44px!important;width:44px!important;height:44px!important;}}';document.head.appendChild(s);})();

