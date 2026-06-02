// The Radio — a quiet player pinned to the top of every page, the way Harmonia
// rides the bottom. It shows the song of the page you're on; once you press play
// it carries the stream from page to page (via sessionStorage). Only one thing
// plays at a time — it yields to any inline song you start, and they yield to it.
(function(){
  function start(){
    var R = window.RADIO;
    if (!R || !R.list) { return setTimeout(start, 60); } // wait for playlist.js
    if (document.querySelector('.gump-radio')) return;    // never twice
    var PLAY = R.list, KEY = 'gump_radio';
    var pageIdx = R.indexFor(R.slug());

    var st = {}; try { st = JSON.parse(sessionStorage.getItem(KEY) || '{}'); } catch(e){}
    var idx, t0, autoplay;
    if (st.playing) { idx = (st.idx != null ? st.idx : pageIdx); t0 = st.time || 0; autoplay = true; }
    else { idx = pageIdx; t0 = 0; autoplay = false; }

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
      "@keyframes grpulse{50%{opacity:0.45;}}" +
      ".gr-title{font-size:0.62em;letter-spacing:0.1em;text-transform:uppercase;color:rgba(196,160,136,0.72);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px;}" +
      ".gr-full{font-size:0.74em!important;opacity:0.7;}" +
      ".gr-prog{position:absolute;left:0;bottom:0;height:2px;background:linear-gradient(90deg,#5a2d0a,#c9a44a);width:0;border-radius:0 0 2px 2px;}" +
      "@media(max-width:520px){.gr-title{max-width:130px;}.gump-radio{gap:7px;padding:6px 10px 7px;}}";
    document.head.appendChild(css);

    var bar = document.createElement('div'); bar.className = 'gump-radio';
    bar.innerHTML =
      '<button class="gr-play" aria-label="play">▶</button>' +
      '<div class="gr-now"><span class="gr-dot"></span><span class="gr-title"></span></div>' +
      '<button class="gr-next" aria-label="next">⏭</button>' +
      '<a class="gr-full" href="/radio/" title="open the full radio">⤢</a>' +
      '<div class="gr-prog"></div>';
    document.body.appendChild(bar);
    var a = document.createElement('audio'); a.preload = 'none'; document.body.appendChild(a);
    var playBtn = bar.querySelector('.gr-play'), titleEl = bar.querySelector('.gr-title');
    var nextBtn = bar.querySelector('.gr-next'), prog = bar.querySelector('.gr-prog');

    function setTrack(i){ idx = (i + PLAY.length) % PLAY.length; a.src = PLAY[idx].f; titleEl.textContent = PLAY[idx].t; }
    function onPlay(){ playBtn.textContent = '❚❚'; bar.classList.add('on'); save(); }
    function onPause(){ playBtn.textContent = '▶'; bar.classList.remove('on'); save(); }
    function save(){ try { sessionStorage.setItem(KEY, JSON.stringify({ idx: idx, time: a.currentTime || 0, playing: !a.paused })); } catch(e){} }
    function pauseOthers(){ var all = document.getElementsByTagName('audio'); for (var i = 0; i < all.length; i++){ if (all[i] !== a && !all[i].paused) all[i].pause(); } }

    setTrack(idx);
    a.addEventListener('loadedmetadata', function(){ if (t0 && Math.abs((a.currentTime||0) - t0) > 1){ try { a.currentTime = t0; } catch(e){} } t0 = 0; });

    playBtn.onclick = function(){ if (a.paused){ pauseOthers(); a.play().then(onPlay).catch(function(){}); } else { a.pause(); onPause(); } };
    nextBtn.onclick = function(){ setTrack(idx + 1); pauseOthers(); a.play().then(onPlay).catch(function(){}); };
    a.addEventListener('ended', function(){ setTrack(idx + 1); a.play().then(onPlay).catch(function(){}); }); // continuous
    a.addEventListener('play', onPlay); a.addEventListener('pause', onPause);
    var tick = 0;
    a.addEventListener('timeupdate', function(){ if (a.duration) prog.style.width = (a.currentTime / a.duration * 100) + '%'; if (++tick % 4 === 0) save(); });
    window.addEventListener('pagehide', save); window.addEventListener('beforeunload', save);

    // yield to any inline song the visitor starts (and they yield to the bar via pauseOthers)
    document.addEventListener('play', function(e){ if (e.target && e.target.tagName === 'AUDIO' && e.target !== a && !a.paused) a.pause(); }, true);

    if (autoplay){ pauseOthers(); a.play().then(onPlay).catch(function(){ onPause(); }); } else { onPause(); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
