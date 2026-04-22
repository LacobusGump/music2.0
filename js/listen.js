/* listen.js — Audio for every page
   Click to play. Click to pause. Double-click to stop.
   Web Speech API. No server. No cost. */

(function(){
  var page = document.querySelector('.page');
  if (!page) return;
  if (document.querySelector('[data-no-listen]')) return;

  // Kill any speech leftover from previous page / refresh
  try { speechSynthesis.cancel(); } catch(e){}

  // State
  var speaking = false, paused = false, chunks = [], chunkIndex = 0;
  var voiceReady = false, selectedVoice = null;

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

  // Pick the best voice available
  // Priority: deeper American male voices that match what James liked
  function pickVoice(){
    var voices = speechSynthesis.getVoices();
    if (!voices.length) return;

    // Ranked preference for American English male voices
    var priority = [
      'Aaron',           // iOS 17+ premium voice
      'Evan',            // macOS premium
      'Tom',             // macOS
      'Alex',            // macOS classic
      'Fred',            // macOS
      'Samantha',        // iOS/macOS (female but very clear)
      'Daniel',          // British but clear
      'Google US English' // Chrome
    ];

    // First pass: exact name match from priority list, English only
    for (var p = 0; p < priority.length; p++){
      for (var i = 0; i < voices.length; i++){
        if (voices[i].lang.startsWith('en') && voices[i].name.indexOf(priority[p]) >= 0){
          selectedVoice = voices[i];
          voiceReady = true;
          return;
        }
      }
    }

    // Second pass: any en-US voice
    for (var i = 0; i < voices.length; i++){
      if (voices[i].lang === 'en-US'){
        selectedVoice = voices[i];
        voiceReady = true;
        return;
      }
    }

    // Fallback: any English voice
    for (var i = 0; i < voices.length; i++){
      if (voices[i].lang.startsWith('en')){
        selectedVoice = voices[i];
        voiceReady = true;
        return;
      }
    }

    voiceReady = true; // use default
  }

  // Voices load async on most browsers
  pickVoice();
  if (speechSynthesis.onvoiceschanged !== undefined){
    speechSynthesis.onvoiceschanged = pickVoice;
  }

  // Extract readable text
  function getPageText(){
    var clone = page.cloneNode(true);
    var skip = clone.querySelectorAll('script,style,canvas,svg,.back,.foot,.meta,.tag,button,[data-no-read]');
    for (var i = 0; i < skip.length; i++) skip[i].remove();
    var text = (clone.textContent || clone.innerText || '').replace(/\s+/g, ' ').trim();
    // Clean symbols
    text = text.replace(/[←→]/g, '');
    text = text.replace(/—/g, ' — ');
    text = text.replace(/×/g, ' times ');
    text = text.replace(/±/g, ' plus or minus ');
    text = text.replace(/[≈~]/g, ' approximately ');
    text = text.replace(/[≥≤]/g, '');
    text = text.replace(/\s+/g, ' ');
    return text;
  }

  // Split into sentences, keep chunks short for reliability
  function makeChunks(text){
    var out = [], buf = '';
    // Split on sentence boundaries
    var parts = text.split(/(?<=[.!?:;])\s+/);
    for (var i = 0; i < parts.length; i++){
      if ((buf + ' ' + parts[i]).length > 180 && buf.length > 0){
        out.push(buf.trim());
        buf = parts[i];
      } else {
        buf += (buf ? ' ' : '') + parts[i];
      }
    }
    if (buf.trim()) out.push(buf.trim());
    return out;
  }

  function speakNext(){
    if (chunkIndex >= chunks.length){ stop(); return; }

    var u = new SpeechSynthesisUtterance(chunks[chunkIndex]);
    u.rate = 0.92;   // slightly slower than default
    u.pitch = 0.95;  // slightly deeper
    if (selectedVoice) u.voice = selectedVoice;

    u.onend = function(){
      chunkIndex++;
      if (speaking && !paused) speakNext();
    };
    u.onerror = function(e){
      if (e.error !== 'canceled' && e.error !== 'interrupted'){
        chunkIndex++;
        if (speaking) speakNext();
      }
    };

    speechSynthesis.speak(u);
  }

  function play(){
    speechSynthesis.cancel();
    speaking = true;
    paused = false;
    chunks = makeChunks(getPageText());
    chunkIndex = 0;
    btn.innerHTML = '&#9646;&#9646; Pause';
    btn.style.borderColor = '#c9a44a';
    btn.style.color = '#e8e4dc';
    // Small delay to let cancel() finish
    setTimeout(speakNext, 100);
  }

  function pause(){
    speechSynthesis.pause();
    paused = true;
    btn.innerHTML = '&#9654; Resume';
  }

  function resume(){
    speechSynthesis.resume();
    paused = false;
    btn.innerHTML = '&#9646;&#9646; Pause';
  }

  function stop(){
    speechSynthesis.cancel();
    speaking = false;
    paused = false;
    chunkIndex = 0;
    btn.innerHTML = '&#9654; Listen';
    btn.style.borderColor = '#c9a44a30';
    btn.style.color = '#c9a44a';
  }

  // Click handler
  var lastClick = 0;
  btn.onclick = function(e){
    e.preventDefault();
    var now = Date.now();
    // Double-click = stop
    if (now - lastClick < 400 && speaking){ stop(); lastClick = 0; return; }
    lastClick = now;
    if (!speaking) play();
    else if (paused) resume();
    else pause();
  };

  // Prevent touch glitches on iOS
  btn.addEventListener('touchend', function(e){ e.preventDefault(); btn.click(); }, {passive:false});

  document.body.appendChild(btn);

  // Clean up on page leave AND on page show (back/forward cache)
  window.addEventListener('beforeunload', function(){ try{speechSynthesis.cancel();}catch(e){} });
  window.addEventListener('pagehide', function(){ try{speechSynthesis.cancel();}catch(e){} });
  window.addEventListener('pageshow', function(e){
    if (e.persisted){ try{speechSynthesis.cancel();}catch(e){} stop(); }
  });
  // Also cancel on visibility change (tab switch)
  document.addEventListener('visibilitychange', function(){
    if (document.hidden && speaking && !paused){ pause(); }
  });
})();
