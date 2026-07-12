// The Radio — a quiet player pinned to the top of every page, the way Harmonia
// rides the bottom. It shows the song of the page you're on; once you press play
// it carries the stream from page to page (via sessionStorage). Only one thing
// plays at a time — it yields to any inline song you start, and they yield to it.
//
// window.RADIO is guaranteed to exist by the time this runs: every page loads
// playlist.js before radio-bar.js, both as <script defer>, and deferred scripts
// execute in document order before DOMContentLoaded (verified across all 140
// pages that carry this bar — see MEMORY). So no polling/retry loop is needed;
// if RADIO is somehow still missing, retrying every 50ms wouldn't fix a broken
// playlist.js anyway, so this bails once and says why, instead of pretending.
(function(){
  function start(){
    var R = window.RADIO;
    if (!R || !R.list || !R.list.length) { console.warn('[radio-bar] window.RADIO missing — playlist.js did not load or set it. Bar not mounted.'); return; }
    if (!document.body) { return setTimeout(start, 30); } // only real race left: script ran before body exists yet
    if (document.querySelector('.gump-radio')) return; // never twice
    var PLAY = R.list, KEY = 'gump_radio', CDN = R.cdn || '', triedFb = false;
    var pageIdx = R.indexFor(R.slug());

    // ── Paywall — the bar rides the same album the /radio/ page gates, so it has to
    // respect the same lock. Before this, next/ended just walked PLAY forward with zero
    // check — the whole album played free from the top bar on any page, no Universal Key
    // needed. gump-unlock.js is the one place that knows if the $30 pass is still valid;
    // load it if this page didn't already (most pages that carry the bar never needed it
    // before now), then reuse the exact same three free paths /radio/ honors: the Harmonia
    // playlist, an already-owned per-song unlock, and the Universal Key itself. ──
    if (!window.gumpUnlockAll){
      var us = document.createElement('script'); us.src = '/js/gump-unlock.js';
      document.head.appendChild(us);
    }
    var harmoniaPages = {};
    (function(){
      var pl = R.playlists || [];
      for (var i = 0; i < pl.length; i++){
        if (pl[i].name !== 'for Harmonia') continue;
        for (var j = 0; j < pl[i].pages.length; j++) harmoniaPages[pl[i].pages[j]] = true;
      }
    })();
    var harmoniaMode = !!localStorage.getItem('gump_harmonia');
    function trackSlug(p){ return (p.f || '').split('/').pop().replace(/\.[^.]+$/, ''); }
    function songUnlocks(){ try { return JSON.parse(localStorage.getItem('gump_unlocks') || '{}'); } catch(e){ return {}; } }
    function isUnlocked(p){
      if (harmoniaMode && harmoniaPages[p.page]) return true;
      var u = songUnlocks();
      return !!((window.gumpUnlockAll && window.gumpUnlockAll()) || u[trackSlug(p)]);
    }

    var st = {}; try { st = JSON.parse(sessionStorage.getItem(KEY) || '{}'); } catch(e){}
    var manual = !!st.manual; // did they ever take the wheel (hit skip)? then no page may interrupt their stream
    var idx, t0, wantPlay;
    if (st.playing) {
      // already listening? the album RIDES. a new page never yanks the stream — you read, it plays on.
      // (the page-match cleverness lives in the branch below: the song a page CUES before you press play.)
      wantPlay = true;
      idx = (st.idx != null && st.idx < PLAY.length) ? st.idx : pageIdx;
      t0 = st.time || 0;
    } else {
      // not playing yet: this page cues its own song — the lyric matches the room you walked into,
      // and pressing play starts you right there. the entry point honors the match; after that, it rides.
      idx = pageIdx; t0 = 0; wantPlay = false;
    }

    var css = document.createElement('style');
    css.textContent =
      ".gump-radio{position:fixed;top:0;left:50%;transform:translateX(-50%);z-index:9980;display:flex;align-items:center;gap:9px;" +
      "background:rgba(12,8,5,0.82);border:1px solid rgba(201,164,74,0.16);border-top:none;border-radius:0 0 14px 14px;" +
      "padding:7px 13px 8px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);max-width:min(440px,92vw);" +
      "box-shadow:0 4px 22px rgba(0,0,0,0.42);font-family:Futura,'Century Gothic',system-ui,sans-serif;transition:opacity .4s;}" +
      ".gump-radio button,.gump-radio a{background:none;border:none;cursor:pointer;color:rgba(201,164,74,0.6);font-size:0.9em;line-height:1;padding:6px 8px;text-decoration:none;transition:color .25s;flex-shrink:0;}" +
      ".gump-radio button:hover,.gump-radio a:hover{color:#e8cfa0;}" +
      ".gr-now{display:flex;align-items:center;gap:7px;min-width:0;overflow:hidden;}" +
      ".gr-dot{width:6px;height:6px;border-radius:50%;background:#5a3a20;flex-shrink:0;transition:background .3s,box-shadow .3s;}" +
      ".gump-radio.on .gr-dot{background:#c9a44a;box-shadow:0 0 8px rgba(201,164,74,0.6);animation:grpulse 2s ease-in-out infinite;}" +
      ".gump-radio.cued .gr-dot{background:#8b6a32;}" +
      "@keyframes grpulse{50%{opacity:0.45;}}" +
      ".gr-title{font-size:0.62em;letter-spacing:0.1em;text-transform:uppercase;color:rgba(196,160,136,0.72);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px;text-decoration:none;cursor:default;}" +
      ".gr-title[href]{cursor:pointer;}.gr-title[href]:hover{color:#e8cfa0;text-decoration:underline;text-underline-offset:3px;}" +
      ".gr-full{font-family:Futura,'Century Gothic',system-ui,sans-serif;font-size:0.52em!important;letter-spacing:0.08em;padding:5px 10px!important;border:1px solid rgba(201,164,74,0.22);border-radius:10px;opacity:1!important;background:rgba(201,164,74,0.07);white-space:nowrap;}" +
      ".gr-full:hover{background:rgba(201,164,74,0.15)!important;border-color:rgba(201,164,74,0.45)!important;}" +
      ".gr-prog{position:absolute;left:0;bottom:0;height:2px;background:linear-gradient(90deg,#5a2d0a,#c9a44a);width:0;border-radius:0 0 2px 2px;}" +
      "@media(max-width:520px){.gr-title{max-width:100px;}.gump-radio{gap:6px;padding:6px 10px 7px;}}";
    document.head.appendChild(css);

    var bar = document.createElement('div'); bar.className = 'gump-radio';
    bar.innerHTML =
      '<button class="gr-play" aria-label="play">▶</button>' +
      '<div class="gr-now"><span class="gr-dot"></span><a class="gr-title"></a></div>' +
      '<button class="gr-next" aria-label="next">⏭</button>' +
      '<a class="gr-full" href="/radio/" title="open the full show">the show</a>' +
      '<div class="gr-prog"></div>';
    document.body.appendChild(bar);
    // The bar is fixed and floats over normal-flow content — the page must reserve real space
    // for it or every heading underneath gets covered. That reservation now happens BEFORE this
    // script ever runs: every page carrying this bar has a render-blocking snippet at the very
    // top of <head> — `:root{--radio-bar-h:44px}body{padding-top:var(--radio-bar-h)!important}`
    // — a CSS-computed estimate (padding 7+8px + the tallest child's line-box) that applies
    // before first paint, no JS dependency for the critical initial value. The 3 pages that
    // deliberately lock body overflow to hidden (immersive full-viewport pages) don't carry that
    // snippet at all, so `overflowLocked` here is just a safety check, not the real gate anymore.
    // This is what killed the actual CLS: the old code measured the bar's real height AFTER
    // appending it and applied padding a full frame later, so the page had already painted once
    // with zero reserved space (confirmed live via Cloudflare Web Analytics: recurring shift on
    // html>body>div.page across every page carrying this bar). Now all this does is correct the
    // estimate to the real measured value — a same-or-few-px delta, not a 0-to-44px jump.
    // research/math/'s own jumpnav already reads this same variable; this is the one place that
    // ever needs to set it.
    var overflowLocked = getComputedStyle(document.body).overflowY === 'hidden';
    requestAnimationFrame(function(){
      var h = bar.offsetHeight;
      if (h <= 0 || overflowLocked) return;
      document.documentElement.style.setProperty('--radio-bar-h', h + 'px');
    });
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
      refreshInline();
    }

    // ── the inline song boxes on a page are triggers, not players. they route their
    // song INTO this bar (one audio element, one source of truth) and light up when it's live. ──
    function stemOf(s){ return ('' + (s || '')).split('/').pop().replace(/\?.*$/, ''); }
    function curStem(){ return stemOf(a.currentSrc || a.src); }
    function refreshInline(){
      var cs = curStem(), auds = document.getElementsByTagName('audio');
      for (var i = 0; i < auds.length; i++){
        var el = auds[i]; if (el === a || !el.id) continue;
        var btn = document.getElementById(el.id + '-btn'); if (!btn) continue;
        var live = stemOf(el.src) === cs;
        btn.textContent = (live && !a.paused) ? '▐▐' : '▶';   // glyphs audio.js recognises
        if (el.parentNode && el.parentNode.style){            // "unlock" glow on the active box
          el.parentNode.style.borderColor = live ? 'rgba(201,164,74,0.45)' : 'rgba(184,117,58,0.12)';
        }
      }
    }
    function onPlay(){ wantPlay = true; playBtn.textContent = '❚❚'; bar.classList.add('on'); bar.classList.remove('cued'); save(); refreshInline(); }
    function onPause(){ playBtn.textContent = '▶'; bar.classList.remove('on'); save(); refreshInline(); }
    function save(){ try { sessionStorage.setItem(KEY, JSON.stringify({ idx: idx, time: a.currentTime || 0, playing: wantPlay && !a.paused, manual: manual })); } catch(e){} }
    function pauseOthers(){ var all = document.getElementsByTagName('audio'); for (var i = 0; i < all.length; i++){ if (all[i] !== a && !all[i].paused) all[i].pause(); } }
    function play(){ pauseOthers(); var p = a.play(); if (p && p.then) p.then(onPlay).catch(function(err){ if (err && err.name === 'AbortError') return; armGesture(); }); } // ignore benign aborts from rapid skips

    // stop cold on a locked track instead of ever letting next/ended walk past the free set
    function lockOut(){
      a.pause(); wantPlay = false; onPause();
      bar.classList.remove('cued');
      titleEl.textContent = '🔒 unlock the album'; titleEl.href = '/radio/'; titleEl.title = 'get the Universal Key';
    }
    // like setTrack, but refuses to load a locked track — returns false and locks the bar out instead
    function goTo(i){
      var target = ((i % PLAY.length) + PLAY.length) % PLAY.length;
      if (!isUnlocked(PLAY[target])){ lockOut(); return false; }
      setTrack(target); return true;
    }

    // public: an inline song box hands its track to the bar. matches the album by filename
    // so it joins the stream (progress + carry) when it's an album track; otherwise plays it as a one-off.
    window.gumpRadio = {
      isLive: function(src){ return stemOf(src) === curStem() && !a.paused; },
      pageTitle: function(){ return (PLAY[pageIdx] && PLAY[pageIdx].t) || 'the song'; },
      playPageSong: function(){ manual = true; setTrack(pageIdx); play(); }, // this page IS a track on the album — play it
      toggle: function(src, title, url){
        if (stemOf(src) === curStem() && !a.paused){ a.pause(); wantPlay = false; onPause(); return; } // second click on the live song = pause
        manual = true; // they picked a song on purpose — no page-cue may override the stream now
        var stem = stemOf(src), found = -1;
        for (var i = 0; i < PLAY.length; i++){ if (stemOf(PLAY[i].f) === stem){ found = i; break; } }
        if (found >= 0){ setTrack(found); }
        else { a.src = src; titleEl.textContent = title || stem; if (url){ titleEl.href = url; } else { titleEl.removeAttribute('href'); titleEl.removeAttribute('title'); } refreshInline(); }
        play();
      }
    };

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
      if (a.error && a.error.code === 1) return; // MEDIA_ERR_ABORTED from a src change (rapid skip) — not a failure, ignore
      if (CDN && !triedFb && (''+a.src).indexOf('jsdelivr') >= 0){ triedFb = true; a.src = PLAY[idx].f; a.load(); if (wantPlay) play(); return; } // jsDelivr hiccup → fall back to the origin
      if (fails++ < PLAY.length){ setTrack(idx + 1); if (wantPlay) play(); } // bad track never stalls the stream
    });

    playBtn.onclick = function(){ if (a.paused){ if (!isUnlocked(PLAY[idx])){ lockOut(); return; } play(); } else { a.pause(); wantPlay = false; onPause(); } };
    nextBtn.onclick = function(){ manual = true; if (goTo(idx + 1)) play(); }; // taking the wheel — from here on, pages don't interrupt (but still can't skip past a lock)
    a.addEventListener('ended', function(){ fails = 0; if (goTo(idx + 1)) play(); }); // continuous, until it hits the paywall
    a.addEventListener('play', onPlay); a.addEventListener('pause', onPause);
    var tick = 0;
    a.addEventListener('timeupdate', function(){ if (a.duration) prog.style.width = (a.currentTime / a.duration * 100) + '%'; if (++tick % 4 === 0) save(); });
    window.addEventListener('pagehide', save); window.addEventListener('beforeunload', save);
    document.addEventListener('visibilitychange', function(){ if (document.visibilityState === 'hidden') save(); });

    // yield to any inline song the visitor starts (and they yield to the bar via pauseOthers)
    document.addEventListener('play', function(e){ if (e.target && e.target.tagName === 'AUDIO' && e.target !== a && !a.paused) a.pause(); }, true);
    // and yield to a page reading itself aloud — never play music over the spoken word
    try { var sp = window.speechSynthesis; if (sp && sp.speak) { var _speak = sp.speak.bind(sp); sp.speak = function(u){ if (!a.paused) a.pause(); return _speak(u); }; } } catch(e){}

    // ── The Egg: a reading reward. Drop the literal text "(egg)" anywhere deep in a page.
    // Whoever hunts it down clicks it — this page's song unlocks in the radio, and the egg
    // becomes a door to the whole album. No one reads walls of text; but they'll chase an
    // egg, and the chase IS the read. One trigger, one radio — nothing to fall out of sync.
    // Walking every text node in the page is real work almost every page load pays for zero
    // benefit (most pages have no egg) — deferred to idle time so it never competes with
    // getting the bar and audio element actually usable first. ──
    var scheduleIdle = window.requestIdleCallback || function(fn){ setTimeout(fn, 200); };
    scheduleIdle(function wireEgg(){
      var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null), hits = [], n;
      while ((n = walker.nextNode())){
        if (n.parentNode && n.parentNode.closest && n.parentNode.closest('a,script,style,button,.gump-radio,.gr-egg')) continue;
        if (n.nodeValue && n.nodeValue.indexOf('(egg)') >= 0) hits.push(n);
      }
      if (!hits.length) return;
      hits.forEach(function(node){
        var parts = node.nodeValue.split('(egg)'), frag = document.createDocumentFragment();
        for (var i = 0; i < parts.length; i++){
          if (parts[i]) frag.appendChild(document.createTextNode(parts[i]));
          if (i < parts.length - 1){
            var egg = document.createElement('span');
            egg.className = 'gr-egg'; egg.textContent = '(egg)'; egg.setAttribute('role', 'button'); egg.title = 'hm?';
            frag.appendChild(egg);
          }
        }
        node.parentNode.replaceChild(frag, node);
      });
      var s = document.createElement('style');
      s.textContent =
        ".gr-egg{color:rgba(201,164,74,0.5);border-bottom:1px dashed rgba(201,164,74,0.35);cursor:pointer;transition:color .2s;white-space:nowrap;}" +
        ".gr-egg:hover{color:#e8cfa0;border-bottom-color:rgba(201,164,74,0.7);}" +
        ".gr-egg.cracked{color:#c9a44a;border:none;cursor:default;}" +
        ".gr-egg.cracked a{color:#e8cfa0;text-decoration:underline;text-underline-offset:3px;}";
      document.head.appendChild(s);
      document.addEventListener('click', function(e){
        var egg = e.target && e.target.closest && e.target.closest('.gr-egg');
        if (!egg || egg.classList.contains('cracked')) return;
        egg.classList.add('cracked');
        window.gumpRadio.playPageSong();
        egg.innerHTML = '♪ ' + window.gumpRadio.pageTitle() + ' — <a href="/radio/">hear the whole album →</a>';
      }, false);
    });

    // carry the stream across the page change — resume now if allowed, otherwise on first touch.
    // guards a stale carried session too (an unlock that expired, or a track that was never
    // actually unlocked before this fix shipped) instead of trusting the old sessionStorage blindly.
    if (wantPlay && isUnlocked(PLAY[idx])){ play(); } else { onPause(); if (wantPlay) lockOut(); }
  }
  // fire as early as possible (deferred scripts run after parse, so the body already exists)
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
