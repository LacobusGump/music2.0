// The Radio — a quiet player pinned to the top of every page, the way Harmonia
// rides the bottom. It shows the song of the page you're on; once you press play
// it carries the stream from page to page (via sessionStorage). Only one thing
// plays at a time — it yields to any inline song you start, and they yield to it.
(function(){
  var tries = 0;
  function start(){
    var R = window.RADIO;
    if (!R || !R.list || !R.list.length) { if (tries++ < 80) return setTimeout(start, 50); return; } // wait for playlist.js, then give up gracefully
    if (!document.body) { return setTimeout(start, 30); }
    if (document.querySelector('.gump-radio')) return; // never twice
    var PLAY = R.list, KEY = 'gump_radio', CDN = R.cdn || '', triedFb = false;
    var pageIdx = R.indexFor(R.slug());

    var st = {}; try { st = JSON.parse(sessionStorage.getItem(KEY) || '{}'); } catch(e){}
    var idx, t0, wantPlay;
    if (st.playing) { idx = (st.idx != null && st.idx < PLAY.length ? st.idx : pageIdx); t0 = st.time || 0; wantPlay = true; }
    else { idx = pageIdx; t0 = 0; wantPlay = false; }

    var css = document.createElement('style');
    css.textContent =
      ".gump-radio{position:fixed;top:0;left:50%;transform:translateX(-50%);z-index:9980;display:flex;align-items:center;gap:9px;" +
      "background:rgba(12,8,5,0.82);border:1px solid rgba(201,164,74,0.16);border-top:none;border-radius:0 0 14px 14px;" +
      "padding:7px 13px 8px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);max-width:min(440px,92vw);" +
      "box-shadow:0 4px 22px rgba(0,0,0,0.42);font-family:Futura,'Century Gothic',system-ui,sans-serif;transition:opacity .4s;}" +
      ".gump-radio button,.gump-radio a{background:none;border:none;cursor:pointer;color:rgba(201,164,74,0.6);font-size:0.9em;line-height:1;padding:2px 3px;text-decoration:none;transition:color .25s;flex-shrink:0;}" +
      ".gump-radio button:hover,.gump-radio a:hover{color:#e8cfa0;}" +
      ".gr-now{display:flex;align-items:center;gap:7px;min-width:0;overflow:hidden;}" +
      ".gr-dot{width:6px;height:6px;border-radius:50%;background:#5a3a20;flex-shrink:0;transition:background .3s,box-shadow .3s;}" +
      ".gump-radio.on .gr-dot{background:#c9a44a;box-shadow:0 0 8px rgba(201,164,74,0.6);animation:grpulse 2s ease-in-out infinite;}" +
      ".gump-radio.cued .gr-dot{background:#8b6a32;}" +
      "@keyframes grpulse{50%{opacity:0.45;}}" +
      ".gr-title{font-size:0.62em;letter-spacing:0.1em;text-transform:uppercase;color:rgba(196,160,136,0.72);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px;text-decoration:none;cursor:default;}" +
      ".gr-title[href]{cursor:pointer;}.gr-title[href]:hover{color:#e8cfa0;text-decoration:underline;text-underline-offset:3px;}" +
      ".gr-full{font-size:0.74em!important;opacity:0.7;}" +
      ".gr-prog{position:absolute;left:0;bottom:0;height:2px;background:linear-gradient(90deg,#5a2d0a,#c9a44a);width:0;border-radius:0 0 2px 2px;}" +
      "@media(max-width:520px){.gr-title{max-width:130px;}.gump-radio{gap:7px;padding:6px 10px 7px;}}";
    document.head.appendChild(css);

    var bar = document.createElement('div'); bar.className = 'gump-radio';
    bar.innerHTML =
      '<button class="gr-play" aria-label="play">▶</button>' +
      '<div class="gr-now"><span class="gr-dot"></span><a class="gr-title"></a></div>' +
      '<button class="gr-next" aria-label="next">⏭</button>' +
      '<a class="gr-full" href="/radio/" title="open the full radio">⤢</a>' +
      '<div class="gr-prog"></div>';
    document.body.appendChild(bar);
    var a = document.createElement('audio');
    a.preload = wantPlay ? 'auto' : 'metadata'; // metadata = fast cue; auto = buffer the carried stream so it resumes instantly
    document.body.appendChild(a);
    var playBtn = bar.querySelector('.gr-play'), titleEl = bar.querySelector('.gr-title');
    var nextBtn = bar.querySelector('.gr-next'), prog = bar.querySelector('.gr-prog');

    function setTrack(i){
      idx = (i % PLAY.length + PLAY.length) % PLAY.length; triedFb = false;
      a.src = CDN + PLAY[idx].f;                 // jsDelivr first
      titleEl.textContent = PLAY[idx].t;
      if (PLAY[idx].url){ titleEl.href = PLAY[idx].url; titleEl.title = 'go study where this one came from'; } // like it? click through and read
      else { titleEl.removeAttribute('href'); titleEl.removeAttribute('title'); } // a ghost ship has no port
    }
    function onPlay(){ wantPlay = true; playBtn.textContent = '❚❚'; bar.classList.add('on'); bar.classList.remove('cued'); save(); }
    function onPause(){ playBtn.textContent = '▶'; bar.classList.remove('on'); save(); }
    function save(){ try { sessionStorage.setItem(KEY, JSON.stringify({ idx: idx, time: a.currentTime || 0, playing: wantPlay && !a.paused })); } catch(e){} }
    function pauseOthers(){ var all = document.getElementsByTagName('audio'); for (var i = 0; i < all.length; i++){ if (all[i] !== a && !all[i].paused) all[i].pause(); } }
    function play(){ pauseOthers(); var p = a.play(); if (p && p.then) p.then(onPlay).catch(armGesture); }

    // if the browser blocks autoplay on a fresh page, resume the moment the visitor touches anything
    var armed = false;
    function armGesture(){
      if (armed) return; armed = true;
      bar.classList.add('cued'); // dim "ready" dot so it's clearly cued, not dead
      function go(e){ armed = false; off(); if (e && e.target && e.target.closest && e.target.closest('.gump-radio')) return; pauseOthers(); var p = a.play(); if (p && p.then) p.then(onPlay).catch(function(){}); } // clicks on the bar itself are handled by its own buttons
      function off(){ ['pointerdown','touchstart','keydown'].forEach(function(ev){ document.removeEventListener(ev, go, true); }); }
      ['pointerdown','touchstart','keydown'].forEach(function(ev){ document.addEventListener(ev, go, true); });
    }

    setTrack(idx);
    // seek to the carried position as soon as the track knows its own length
    function seek(){ if (t0 && a.duration && Math.abs((a.currentTime||0) - t0) > 1){ try { a.currentTime = Math.min(t0, a.duration - 0.3); } catch(e){} } t0 = 0; }
    a.addEventListener('loadedmetadata', seek);

    // a track that 404s or won't decode never stalls the stream — skip on
    var fails = 0;
    a.addEventListener('error', function(){
      if (CDN && !triedFb && (''+a.src).indexOf('jsdelivr') >= 0){ triedFb = true; a.src = PLAY[idx].f; a.load(); if (wantPlay) play(); return; } // jsDelivr hiccup → fall back to the origin
      if (fails++ < PLAY.length){ setTrack(idx + 1); if (wantPlay) play(); } // bad track never stalls the stream
    });

    playBtn.onclick = function(){ if (a.paused){ play(); } else { a.pause(); wantPlay = false; onPause(); } };
    nextBtn.onclick = function(){ setTrack(idx + 1); play(); };
    a.addEventListener('ended', function(){ fails = 0; setTrack(idx + 1); play(); }); // continuous
    a.addEventListener('play', onPlay); a.addEventListener('pause', onPause);
    var tick = 0;
    a.addEventListener('timeupdate', function(){ if (a.duration) prog.style.width = (a.currentTime / a.duration * 100) + '%'; if (++tick % 4 === 0) save(); });
    window.addEventListener('pagehide', save); window.addEventListener('beforeunload', save);
    document.addEventListener('visibilitychange', function(){ if (document.visibilityState === 'hidden') save(); });

    // yield to any inline song the visitor starts (and they yield to the bar via pauseOthers)
    document.addEventListener('play', function(e){ if (e.target && e.target.tagName === 'AUDIO' && e.target !== a && !a.paused) a.pause(); }, true);
    // and yield to a page reading itself aloud — never play music over the spoken word
    try { var sp = window.speechSynthesis; if (sp && sp.speak) { var _speak = sp.speak.bind(sp); sp.speak = function(u){ if (!a.paused) a.pause(); return _speak(u); }; } } catch(e){}

    // carry the stream across the page change — resume now if allowed, otherwise on first touch
    if (wantPlay){ play(); } else { onPause(); }
  }
  // fire as early as possible (deferred scripts run after parse, so the body already exists)
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
