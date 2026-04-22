/* listen.js — Audio for every page
   Plays pre-generated MP3 if available (the good voice).
   Falls back to Web Speech API if not.
   Click to play. Click to pause. Double-click to stop. */

(function(){
  var page = document.querySelector('.page');
  if (!page) return;
  if (document.querySelector('[data-no-listen]')) return;

  // Kill leftover speech from refresh
  try { speechSynthesis.cancel(); } catch(e){}

  // Derive page name from URL path
  var path = location.pathname.replace(/\/+$/, '').replace(/\/index\.html$/, '');
  var parts = path.split('/').filter(Boolean);
  var pageName = parts[parts.length - 1] || 'home';

  // State
  var speaking = false, paused = false;
  var audioEl = null;    // for MP3 playback
  var useMP3 = false;
  var mp3Checked = false;

  // Button
  var btn = document.createElement('button');
  btn.id = 'listen-btn';
  btn.setAttribute('aria-label', 'Listen to this page');
  btn.innerHTML = '&#9654; Listen';
  btn.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;' +
    'background:rgba(12,12,20,0.9);color:#c9a44a;border:1px solid #c9a44a30;' +
    'border-radius:20px;padding:8px 16px;font-family:Georgia,serif;' +
    'font-size:0.78em;cursor:pointer;transition:all 0.3s;' +
    'backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);' +
    '-webkit-tap-highlight-color:transparent;user-select:none;';

  btn.onmouseenter = function(){ if(!speaking) btn.style.borderColor='#c9a44a'; };
  btn.onmouseleave = function(){ if(!speaking) btn.style.borderColor='#c9a44a30'; };

  // ═══════════════════════════════════
  // MP3 PLAYBACK (the good voice)
  // ═══════════════════════════════════

  var mp3Url = '/audio/' + pageName + '.mp3';

  // Check if MP3 exists
  function checkMP3(callback){
    if (mp3Checked){ callback(useMP3); return; }
    var xhr = new XMLHttpRequest();
    xhr.open('HEAD', mp3Url, true);
    xhr.onload = function(){
      useMP3 = (xhr.status === 200);
      mp3Checked = true;
      callback(useMP3);
    };
    xhr.onerror = function(){ mp3Checked = true; useMP3 = false; callback(false); };
    xhr.send();
  }

  function playMP3(){
    if (!audioEl){
      audioEl = new Audio(mp3Url);
      audioEl.addEventListener('ended', function(){ stop(); });
      audioEl.addEventListener('error', function(){
        // MP3 failed, fall back to speech
        useMP3 = false;
        audioEl = null;
        playSpeech();
      });
    }
    audioEl.currentTime = 0;
    audioEl.play().catch(function(){
      // Autoplay blocked — try speech instead
      useMP3 = false;
      playSpeech();
    });
    speaking = true;
    paused = false;
    setBtn('pause');
  }

  function pauseMP3(){
    if (audioEl) audioEl.pause();
    paused = true;
    setBtn('resume');
  }

  function resumeMP3(){
    if (audioEl) audioEl.play();
    paused = false;
    setBtn('pause');
  }

  function stopMP3(){
    if (audioEl){ audioEl.pause(); audioEl.currentTime = 0; }
    speaking = false;
    paused = false;
    setBtn('listen');
  }

  // ═══════════════════════════════════
  // WEB SPEECH FALLBACK (the robot)
  // ═══════════════════════════════════

  var chunks = [], chunkIndex = 0, selectedVoice = null;

  function pickVoice(){
    var voices = speechSynthesis.getVoices();
    if (!voices.length) return;
    var priority = ['Aaron','Evan','Tom','Alex','Samantha','Daniel','Google US English'];
    for (var p = 0; p < priority.length; p++){
      for (var i = 0; i < voices.length; i++){
        if (voices[i].lang.startsWith('en') && voices[i].name.indexOf(priority[p]) >= 0){
          selectedVoice = voices[i]; return;
        }
      }
    }
    for (var i = 0; i < voices.length; i++){
      if (voices[i].lang === 'en-US'){ selectedVoice = voices[i]; return; }
    }
    for (var i = 0; i < voices.length; i++){
      if (voices[i].lang.startsWith('en')){ selectedVoice = voices[i]; return; }
    }
  }
  pickVoice();
  if (speechSynthesis.onvoiceschanged !== undefined) speechSynthesis.onvoiceschanged = pickVoice;

  function getPageText(){
    var clone = page.cloneNode(true);
    var skip = clone.querySelectorAll('script,style,canvas,svg,.back,.foot,.meta,.tag,button,[data-no-read]');
    for (var i = 0; i < skip.length; i++) skip[i].remove();
    var text = (clone.textContent || clone.innerText || '').replace(/\s+/g,' ').trim();
    text = text.replace(/[←→]/g,'').replace(/—/g,' — ').replace(/×/g,' times ');
    return text;
  }

  function makeChunks(text){
    var out=[], buf='', parts=text.split(/(?<=[.!?:;])\s+/);
    for(var i=0;i<parts.length;i++){
      if((buf+' '+parts[i]).length>180 && buf.length>0){ out.push(buf.trim()); buf=parts[i]; }
      else buf+=(buf?' ':'')+parts[i];
    }
    if(buf.trim()) out.push(buf.trim());
    return out;
  }

  function speakNext(){
    if(chunkIndex>=chunks.length){stop();return;}
    var u=new SpeechSynthesisUtterance(chunks[chunkIndex]);
    u.rate=0.92; u.pitch=0.95;
    if(selectedVoice) u.voice=selectedVoice;
    u.onend=function(){chunkIndex++;if(speaking&&!paused)speakNext();};
    u.onerror=function(e){if(e.error!=='canceled'){chunkIndex++;if(speaking)speakNext();}};
    speechSynthesis.speak(u);
  }

  function playSpeech(){
    speechSynthesis.cancel();
    speaking=true; paused=false;
    chunks=makeChunks(getPageText()); chunkIndex=0;
    setBtn('pause');
    setTimeout(speakNext,100);
  }

  function pauseSpeech(){ speechSynthesis.pause(); paused=true; setBtn('resume'); }
  function resumeSpeech(){ speechSynthesis.resume(); paused=false; setBtn('pause'); }
  function stopSpeech(){ speechSynthesis.cancel(); speaking=false; paused=false; chunkIndex=0; setBtn('listen'); }

  // ═══════════════════════════════════
  // UNIFIED CONTROLS
  // ═══════════════════════════════════

  function setBtn(state){
    if(state==='pause'){
      btn.innerHTML='&#9646;&#9646; Pause';
      btn.style.borderColor='#c9a44a'; btn.style.color='#e8e4dc';
    } else if(state==='resume'){
      btn.innerHTML='&#9654; Resume';
    } else {
      btn.innerHTML='&#9654; Listen';
      btn.style.borderColor='#c9a44a30'; btn.style.color='#c9a44a';
    }
  }

  function play(){
    checkMP3(function(hasMP3){
      if(hasMP3) playMP3();
      else playSpeech();
    });
  }

  function stop(){
    if(useMP3 && audioEl) stopMP3();
    else stopSpeech();
  }

  var lastClick=0;
  btn.onclick = function(e){
    e.preventDefault();
    var now=Date.now();
    if(now-lastClick<400 && speaking){stop();lastClick=0;return;}
    lastClick=now;
    if(!speaking) play();
    else if(paused){
      if(useMP3 && audioEl) resumeMP3(); else resumeSpeech();
    } else {
      if(useMP3 && audioEl) pauseMP3(); else pauseSpeech();
    }
  };

  btn.addEventListener('touchend',function(e){e.preventDefault();btn.click();},{passive:false});
  document.body.appendChild(btn);

  // Cleanup
  window.addEventListener('beforeunload',function(){try{speechSynthesis.cancel();}catch(e){} if(audioEl){audioEl.pause();}});
  window.addEventListener('pagehide',function(){try{speechSynthesis.cancel();}catch(e){} if(audioEl){audioEl.pause();}});
  window.addEventListener('pageshow',function(e){if(e.persisted){stop();}});
  document.addEventListener('visibilitychange',function(){
    if(document.hidden && speaking && !paused){
      if(useMP3 && audioEl) pauseMP3(); else pauseSpeech();
    }
  });
})();
