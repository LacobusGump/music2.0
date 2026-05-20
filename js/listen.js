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
  btn.style.cssText = 'position:fixed;top:14px;right:14px;z-index:9999;' +
    'background:rgba(12,12,20,0.9);color:#b8753a;border:1px solid #b8753a30;' +
    'border-radius:20px;padding:8px 16px;font-family:Georgia,serif;' +
    'font-size:0.78em;cursor:pointer;transition:all 0.3s;' +
    'backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);' +
    '-webkit-tap-highlight-color:transparent;user-select:none;';

  btn.onmouseenter = function(){ if(!speaking) btn.style.borderColor='#b8753a'; };
  btn.onmouseleave = function(){ if(!speaking) btn.style.borderColor='#b8753a30'; };

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
    var out=[], buf='', parts=text.split(/([.!?:;])\s+/);
    // Rejoin punctuation to preceding segment (replaces lookbehind for Safari compat)
    for(var j=parts.length-2;j>=0;j--){
      if(/^[.!?:;]$/.test(parts[j+1])){parts[j]+=parts[j+1];parts.splice(j+1,1);}
    }
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
      btn.style.borderColor='#b8753a'; btn.style.color='#e8e4dc';
    } else if(state==='resume'){
      btn.innerHTML='&#9654; Resume';
    } else {
      btn.innerHTML='&#9654; Listen';
      btn.style.borderColor='#b8753a30'; btn.style.color='#b8753a';
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

/* products polish — scoped only to /products/. Keeps the giant tool data intact. */
(function(){
  var path = location.pathname.replace(/\/+$/,'/');
  if(path !== '/products/' && path !== '/products/index.html') return;
  function boot(){
    var page=document.querySelector('.page'); if(!page || page.dataset.productsPolished) return;
    page.dataset.productsPolished='1';
    document.documentElement.classList.add('products-polished');

    var css=document.createElement('style');
    css.textContent = ''+
    'html.products-polished body{background:#120d0a;overflow-x:hidden;}'+
    'html.products-polished body:before,html.products-polished body:after{content:"";position:fixed;inset:0;pointer-events:none;}'+
    'html.products-polished body:before{z-index:0;opacity:.08;background:repeating-linear-gradient(0deg,rgba(255,255,255,.018) 0 1px,transparent 1px 4px),radial-gradient(circle at 50% 28%,transparent 0 42%,rgba(0,0,0,.56) 100%);mix-blend-mode:screen;}'+
    'html.products-polished body:after{z-index:0;background:radial-gradient(circle at 18% 8%,rgba(184,117,58,.11),transparent 30%),radial-gradient(circle at 82% 18%,rgba(122,154,106,.07),transparent 28%),linear-gradient(180deg,rgba(18,13,10,.05),rgba(18,13,10,.78));}'+
    'html.products-polished #products-field{position:fixed;inset:0;width:100vw;height:100vh;z-index:0;pointer-events:none;opacity:.72;}'+
    'html.products-polished .page{position:relative;z-index:1;max-width:920px;padding:34px 22px 100px;}'+
    'html.products-polished .back{font-family:Futura,"Century Gothic",system-ui,sans-serif;font-size:.62em;letter-spacing:.13em;color:rgba(201,164,74,.42);margin-bottom:42px;}'+
    'html.products-polished h1{font-size:clamp(2.25rem,7vw,4.8rem);font-weight:100;line-height:.9;letter-spacing:.13em;text-transform:uppercase;color:rgba(184,117,58,.96);text-shadow:0 0 38px rgba(184,117,58,.13);}'+
    'html.products-polished .sub{max-width:650px;margin:16px auto 24px;font-size:.82em;line-height:2;color:rgba(196,160,136,.76);}'+
    'html.products-polished .products-thesis{max-width:720px;margin:0 auto 24px;padding:14px 18px;border:1px solid rgba(184,117,58,.10);border-left:3px solid rgba(184,117,58,.30);border-radius:12px;background:rgba(18,13,10,.42);font-size:.76em;line-height:2;color:rgba(196,160,136,.68);text-align:left;}'+
    'html.products-polished .products-runes{display:flex;justify-content:center;flex-wrap:wrap;gap:8px;margin:18px auto 30px;}'+
    'html.products-polished .products-runes span{font-family:Futura,"Century Gothic",system-ui,sans-serif;font-size:.52em;letter-spacing:.10em;text-transform:uppercase;padding:6px 10px;border:1px solid rgba(184,117,58,.10);border-radius:999px;background:rgba(18,13,10,.30);color:rgba(232,207,160,.42);}'+
    'html.products-polished .products-runes b{font-weight:400;color:rgba(184,117,58,.85);}'+
    'html.products-polished .drop{position:relative;overflow:hidden;border-radius:16px;padding:16px 20px;background:linear-gradient(180deg,rgba(18,13,10,.76),rgba(9,6,5,.56));box-shadow:0 0 0 1px rgba(255,255,255,.012) inset;}'+
    'html.products-polished .drop:after{content:"";position:absolute;inset:0;background:linear-gradient(115deg,transparent 0 36%,rgba(184,117,58,.055) 50%,transparent 64%);transform:translateX(-120%);transition:transform .9s ease;}'+
    'html.products-polished .drop:hover:after{transform:translateX(120%);}'+
    'html.products-polished .group-label{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:14px;margin:38px 0 12px;padding:0;text-align:center;font-size:.62em;letter-spacing:.20em;color:rgba(184,117,58,.72);}'+
    'html.products-polished .group-label:before,html.products-polished .group-label:after{content:"";height:1px;background:linear-gradient(90deg,transparent,rgba(184,117,58,.20));}'+
    'html.products-polished .group-label:after{background:linear-gradient(90deg,rgba(184,117,58,.20),transparent);}'+
    'html.products-polished .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;}'+
    'html.products-polished .card{min-height:132px;align-items:flex-start;border-radius:16px;padding:18px;background:linear-gradient(180deg,rgba(18,13,10,.72),rgba(9,6,5,.54));border-color:rgba(184,117,58,.11);box-shadow:0 0 0 1px rgba(255,255,255,.012) inset;}'+
    'html.products-polished .card:hover{transform:translateY(-3px);border-color:rgba(184,117,58,.30);box-shadow:0 18px 45px rgba(0,0,0,.18),0 0 28px rgba(184,117,58,.055);}'+
    'html.products-polished .card-name{color:#d0a35f;letter-spacing:.06em;}'+
    'html.products-polished .card-desc{color:rgba(196,160,136,.66);line-height:1.82;}'+
    'html.products-polished .card canvas{margin-top:2px;filter:drop-shadow(0 0 10px rgba(184,117,58,.08));}'+
    'html.products-polished .pip{border-radius:14px;margin-top:44px;background:rgba(18,13,10,.55);}'+
    'html.products-polished .foot{font-family:Futura,"Century Gothic",system-ui,sans-serif;letter-spacing:.10em;text-transform:uppercase;margin-top:56px;}'+
    '@media(max-width:720px){html.products-polished .grid{grid-template-columns:1fr;}html.products-polished .page{padding:28px 16px 90px;}html.products-polished .group-label{grid-template-columns:1fr;}html.products-polished .group-label:before,html.products-polished .group-label:after{display:none;}}';
    document.head.appendChild(css);

    var field=document.createElement('canvas');field.id='products-field';field.setAttribute('aria-hidden','true');document.body.insertBefore(field,document.body.firstChild);
    var h1=page.querySelector('h1');
    if(h1){
      var thesis=document.createElement('div');thesis.className='products-thesis';thesis.innerHTML='<strong style="color:#e8cfa0;font-weight:400;">Tools are the proof.</strong> Each instrument does one thing with coupling math: measure K, find R, count E, expose T, then show the next move without a cloud bill or a fake priesthood.';
      var runes=document.createElement('div');runes.className='products-runes';runes.innerHTML='<span><b>K</b> coupling</span><span><b>R</b> sync</span><span><b>E</b> cost</span><span><b>T</b> tension</span><span><b>local</b> first</span><span><b>free</b> always</span>';
      var sub=page.querySelector('.sub');
      if(sub&&sub.parentNode){sub.parentNode.insertBefore(thesis,sub.nextSibling);sub.parentNode.insertBefore(runes,thesis.nextSibling);}
    }

    var drops=page.querySelectorAll('.drop');
    for(var i=0;i<drops.length;i++){drops[i].setAttribute('data-group-color',i===0?'201,164,74':i===1?'122,154,106':'184,117,58');}

    var ctx=field.getContext('2d'),W=0,H=0,dpr=1,t=0,pts=[];
    function resize(){dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;field.width=W*dpr;field.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);if(!pts.length){for(var i=0;i<96;i++){var a=i*2.39996322,r=Math.sqrt(i/96)*Math.min(W,H)*.42;pts.push({x:W/2+Math.cos(a)*r,y:H*.36+Math.sin(a)*r*.58,p:Math.random()*6.283,z:.45+Math.random()*.9});}}}
    function draw(){t+=.006;ctx.clearRect(0,0,W,H);ctx.globalCompositeOperation='lighter';var cx=W/2,cy=H*.36,s=Math.min(W,H);ctx.strokeStyle='rgba(184,117,58,.025)';ctx.lineWidth=.7;for(var r=0;r<4;r++){ctx.beginPath();ctx.ellipse(cx,cy,s*(.13+r*.075),s*(.07+r*.042),Math.sin(t*.18+r)*.18,0,Math.PI*2);ctx.stroke();}for(var i=0;i<pts.length;i++){var p=pts[i],br=.5+.5*Math.sin(p.p+t*2),dr=13*p.z;p.x+=(cx+Math.cos(i*2.39996322+t*.32)*Math.sqrt(i/96)*s*.42-p.x)*.003;p.y+=(cy+Math.sin(i*2.39996322+t*.26)*Math.sqrt(i/96)*s*.24-p.y)*.003;var x=p.x+Math.cos(p.p+t)*dr,y=p.y+Math.sin(p.p+t*.8)*dr*.65,a=.011+br*.028,rr=1.2+br*2.3;var g=ctx.createRadialGradient(x,y,0,x,y,rr*8);g.addColorStop(0,'rgba(184,117,58,'+(a*.55).toFixed(4)+')');g.addColorStop(.36,'rgba(122,154,106,'+(a*.13).toFixed(4)+')');g.addColorStop(1,'rgba(184,117,58,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,rr*8,0,Math.PI*2);ctx.fill();}ctx.globalCompositeOperation='source-over';requestAnimationFrame(draw);}
    resize();addEventListener('resize',resize,{passive:true});if(!matchMedia('(prefers-reduced-motion: reduce)').matches)draw();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();