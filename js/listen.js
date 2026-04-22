/* listen.js — Audio for every research page
   One button. Click it. The page reads itself to you.
   Uses Web Speech API (built into all modern browsers).
   No server. No cost. No tokens. */

(function(){
  // Only add to pages with .page class
  var page = document.querySelector('.page');
  if (!page) return;

  // Don't add to pages that opt out
  if (document.querySelector('[data-no-listen]')) return;

  // Create the button
  var btn = document.createElement('button');
  btn.id = 'listen-btn';
  btn.innerHTML = '&#9654; Listen';
  btn.title = 'Read this page aloud';
  btn.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;' +
    'background:#0c0c14;color:#c9a44a;border:1px solid #c9a44a30;' +
    'border-radius:20px;padding:8px 16px;font-family:Georgia,serif;' +
    'font-size:0.78em;cursor:pointer;transition:all 0.3s;' +
    'backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);';

  // Hover
  btn.onmouseenter = function(){ btn.style.borderColor = '#c9a44a'; btn.style.color = '#e8e4dc'; };
  btn.onmouseleave = function(){
    if (!speaking) { btn.style.borderColor = '#c9a44a30'; btn.style.color = '#c9a44a'; }
  };

  // State
  var speaking = false;
  var paused = false;
  var utterance = null;

  // Extract readable text from the page
  function getPageText(){
    var clone = page.cloneNode(true);

    // Remove elements that shouldn't be read
    var skip = clone.querySelectorAll('script, style, canvas, .back, .foot, .meta, .tag, #listen-btn, [data-no-read]');
    for (var i = 0; i < skip.length; i++) skip[i].remove();

    // Get text, clean it up
    var text = clone.textContent || clone.innerText || '';

    // Clean up whitespace and special chars
    text = text.replace(/\s+/g, ' ').trim();

    // Replace common HTML entities that might survive
    text = text.replace(/←/g, '').replace(/→/g, '').replace(/—/g, ' — ');
    text = text.replace(/×/g, ' times ').replace(/±/g, ' plus or minus ');
    text = text.replace(/≈/g, ' approximately ').replace(/≥/g, ' greater than or equal to ');
    text = text.replace(/≤/g, ' less than or equal to ');

    return text;
  }

  // Chunk text for reliability (some browsers cut off long utterances)
  function chunkText(text, maxLen){
    var chunks = [];
    var sentences = text.split(/(?<=[.!?])\s+/);
    var current = '';

    for (var i = 0; i < sentences.length; i++){
      if ((current + ' ' + sentences[i]).length > maxLen && current.length > 0){
        chunks.push(current.trim());
        current = sentences[i];
      } else {
        current += (current ? ' ' : '') + sentences[i];
      }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks;
  }

  var chunks = [];
  var chunkIndex = 0;

  function speakNextChunk(){
    if (chunkIndex >= chunks.length){
      stopSpeaking();
      return;
    }

    utterance = new SpeechSynthesisUtterance(chunks[chunkIndex]);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    // Try to pick a good voice
    var voices = speechSynthesis.getVoices();
    var preferred = null;
    for (var i = 0; i < voices.length; i++){
      var v = voices[i];
      // Prefer natural-sounding English voices
      if (v.lang.startsWith('en') && (v.name.indexOf('Samantha') >= 0 ||
          v.name.indexOf('Daniel') >= 0 || v.name.indexOf('Karen') >= 0 ||
          v.name.indexOf('Google') >= 0 || v.name.indexOf('Natural') >= 0)){
        preferred = v;
        break;
      }
    }
    if (!preferred){
      for (var i = 0; i < voices.length; i++){
        if (voices[i].lang.startsWith('en')){ preferred = voices[i]; break; }
      }
    }
    if (preferred) utterance.voice = preferred;

    utterance.onend = function(){
      chunkIndex++;
      if (speaking && !paused) speakNextChunk();
    };

    utterance.onerror = function(e){
      if (e.error !== 'canceled'){
        chunkIndex++;
        if (speaking) speakNextChunk();
      }
    };

    speechSynthesis.speak(utterance);
  }

  function startSpeaking(){
    speechSynthesis.cancel();
    speaking = true;
    paused = false;
    chunks = chunkText(getPageText(), 200);
    chunkIndex = 0;
    btn.innerHTML = '&#9646;&#9646; Pause';
    btn.style.borderColor = '#c9a44a';
    btn.style.color = '#e8e4dc';
    speakNextChunk();
  }

  function pauseSpeaking(){
    speechSynthesis.pause();
    paused = true;
    btn.innerHTML = '&#9654; Resume';
  }

  function resumeSpeaking(){
    speechSynthesis.resume();
    paused = false;
    btn.innerHTML = '&#9646;&#9646; Pause';
  }

  function stopSpeaking(){
    speechSynthesis.cancel();
    speaking = false;
    paused = false;
    chunkIndex = 0;
    btn.innerHTML = '&#9654; Listen';
    btn.style.borderColor = '#c9a44a30';
    btn.style.color = '#c9a44a';
  }

  // Click handler: play → pause → resume cycle, double-click to stop
  var lastClick = 0;
  btn.onclick = function(){
    var now = Date.now();

    // Double-click to stop
    if (now - lastClick < 400 && speaking){
      stopSpeaking();
      lastClick = 0;
      return;
    }
    lastClick = now;

    if (!speaking){
      startSpeaking();
    } else if (paused){
      resumeSpeaking();
    } else {
      pauseSpeaking();
    }
  };

  // Load voices (some browsers load async)
  if (speechSynthesis.onvoiceschanged !== undefined){
    speechSynthesis.onvoiceschanged = function(){};
  }

  // Add button to page
  document.body.appendChild(btn);

  // Stop on page leave
  window.addEventListener('beforeunload', function(){ speechSynthesis.cancel(); });
})();
