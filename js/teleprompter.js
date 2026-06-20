// ── THE TELEPROMPTER — one slow-scroll engine for every song on the record. ──────────────────
// A song page only has to define window.SONG and include this file. Everything else is built here,
// so the feel is tuned in one place and every song reads the same.
//
//   window.SONG = {
//     title: 'Song name',           // optional — sets the browser tab
//     back:  '/radio/',             // where the ← goes (default /radio/)
//     backLabel: 'the show',        // its label
//     text:  `...the lyrics...`     // raw. one line per line. [brackets] = a stage cue. blank = a breath.
//   };
//
// The breaks ARE the phrasing — paste the words exactly as written, line for line. Don't reflow them.
(function(){
  var SONG = window.SONG || {};
  if(SONG.title) document.title = SONG.title + ' — GUMP';

  // ── parse the raw block: every newline is a line. [brackets] → cue. empty → breath. ──
  function parse(text){
    var out=[];
    (text||'').replace(/\r/g,'').split('\n').forEach(function(line){
      var s=line.trim();
      if(s===''){ if(out.length && out[out.length-1].t!=='blank') out.push({t:'blank'}); return; } // collapse runs of blanks
      var m=s.match(/^\[(.*)\]$/) || s.match(/^\((.*)\)$/);     // [brackets] or (parens) → a stage cue
      if(m){ out.push({t:'cue', x:m[1].trim()}); return; }
      out.push({x:s});
    });
    while(out.length && out[0].t==='blank') out.shift();
    while(out.length && out[out.length-1].t==='blank') out.pop();
    return out;
  }
  var L = parse(SONG.text);

  // ── styles, injected so a song page needs nothing but its words ──
  var css = ''+
  '*{margin:0;padding:0;box-sizing:border-box;}html,body{height:100%;}'+
  'body{background:#0a0604;color:#c4a088;font-family:Georgia,serif;overflow:hidden;}'+
  '#field{position:fixed;inset:0;width:100vw;height:100vh;z-index:0;pointer-events:none;opacity:0.5;}'+
  '#stage{position:fixed;inset:0;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;}'+
  '#scroll{width:100%;max-width:820px;padding:50vh 26px;text-align:center;transition:transform 1.1s cubic-bezier(.22,.61,.36,1);}'+
  '.ln{font-size:clamp(1.5em,4.4vw,2.5em);line-height:1.5;color:#3a2c20;font-weight:400;letter-spacing:0.01em;margin:0.06em 0;'+
     'transition:color .9s ease,opacity .9s ease,text-shadow .9s ease;opacity:0.5;cursor:pointer;}'+
  '.ln.cue{font-family:Futura,"Century Gothic",system-ui,sans-serif;font-size:clamp(0.5em,1.5vw,0.64em);'+
     'letter-spacing:0.22em;text-transform:uppercase;color:#5a3a20;opacity:0.34;margin:1.4em 0 0.7em;}'+
  '.ln.blank{height:0.6em;margin:0;}'+
  '.ln.on{color:#e8cfa0;opacity:1;text-shadow:0 0 34px rgba(201,164,74,0.32);}'+
  '.ln.cue.on{color:#c9a44a;opacity:0.8;text-shadow:none;}'+
  '.ln.near{color:#7a5a3c;opacity:0.66;}.ln.cue.near{color:#6a4324;opacity:0.4;}'+
  '#bar{position:fixed;left:0;right:0;bottom:0;z-index:3;display:flex;align-items:center;justify-content:center;gap:14px;'+
     'padding:16px 18px;background:linear-gradient(0deg,rgba(10,6,4,0.94),rgba(10,6,4,0));transition:opacity .6s;flex-wrap:wrap;}'+
  '#bar.hide{opacity:0;pointer-events:none;}'+
  '.btn{background:none;border:1px solid rgba(184,117,58,0.26);color:rgba(201,164,74,0.78);border-radius:24px;padding:9px 18px;'+
     'font-family:Futura,"Century Gothic",system-ui,sans-serif;font-size:0.74em;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;transition:all .25s;white-space:nowrap;}'+
  '.btn:hover{border-color:rgba(201,164,74,0.6);color:#e8cfa0;}'+
  '.btn.play{background:radial-gradient(circle at 40% 35%,#c9a44a,#8b4513 75%);border:none;color:#1a110d;width:52px;height:52px;'+
     'border-radius:50%;padding:0;font-size:1.1em;display:flex;align-items:center;justify-content:center;box-shadow:0 0 24px rgba(201,164,74,0.22);}'+
  '.spd{display:flex;align-items:center;gap:9px;color:rgba(184,117,58,0.6);font-family:Futura,"Century Gothic",system-ui,sans-serif;'+
     'font-size:0.6em;letter-spacing:0.14em;text-transform:uppercase;}'+
  '.spd input{width:120px;accent-color:#c9a44a;cursor:pointer;}'+
  '.spd .val{font-family:"Courier New",monospace;font-size:1.1em;color:#c9a44a;min-width:48px;text-align:right;letter-spacing:0;}'+
  '#hint{position:fixed;top:0;left:0;right:0;z-index:3;text-align:center;padding:18px;'+
     'font-family:Futura,"Century Gothic",system-ui,sans-serif;font-size:0.58em;letter-spacing:0.2em;text-transform:uppercase;color:rgba(184,117,58,0.4);transition:opacity .6s;}'+
  '#hint.hide{opacity:0;}#hint a{color:rgba(184,117,58,0.55);text-decoration:none;border-bottom:1px solid rgba(184,117,58,0.2);}'+
  '#hint a:hover{color:#c9a44a;}';
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  // ── DOM ──
  var back=SONG.back||'/radio/', backLabel=SONG.backLabel||'the show';
  var body=document.body;
  body.innerHTML=''+
    '<canvas id="field"></canvas>'+
    '<div id="hint"><a href="'+back+'">&larr; '+backLabel+'</a> &nbsp;&middot;&nbsp; space / tap a line to drive it &middot; play to let it read itself</div>'+
    '<div id="stage"><div id="scroll" aria-live="polite"></div></div>'+
    '<div id="bar">'+
      '<button class="btn" id="back" title="previous line">&uarr; back</button>'+
      '<button class="btn play" id="play" aria-label="auto-read">&#9654;</button>'+
      '<button class="btn" id="fwd" title="next line">next &darr;</button>'+
      '<div class="spd"><span>slow</span><input type="range" id="spd" min="0.5" max="2.2" step="0.05" value="0.85">'+
        '<span>fast</span><span class="val" id="spdval">0.85&times;</span></div>'+
      '<button class="btn" id="restart" title="back to the top">&#8634; top</button>'+
    '</div>';

  var scroll=document.getElementById('scroll');
  var els=[], lineIdx=[];                    // lineIdx = landable lines (cues pace the room too; blanks don't)
  L.forEach(function(item,i){
    var d=document.createElement('div');
    d.className='ln'+(item.t==='cue'?' cue':'')+(item.t==='blank'?' blank':'');
    d.textContent=item.x||''; d.dataset.i=i;
    scroll.appendChild(d); els.push(d);
    if(item.t!=='blank') lineIdx.push(i);
  });

  var pos=0, playing=false, timer=null, speed=0.85;

  function render(){
    var cur=lineIdx[pos];
    els.forEach(function(d,i){
      d.classList.remove('on','near');
      var li=lineIdx.indexOf(i);
      if(i===cur) d.classList.add('on');
      else if(li>=0 && Math.abs(li-pos)===1) d.classList.add('near');
    });
    var t=els[cur];
    if(t){ var y=t.offsetTop - window.innerHeight*0.42 + t.offsetHeight/2; scroll.style.transform='translateY('+(-y)+'px)'; }
  }
  // pacing: sung lines linger by word count, lines ending on a stop hold a beat, cues pass quicker
  function dwell(i){
    var item=L[lineIdx[i]];
    if(item.t==='cue') return 1500/speed;
    var words=(item.x||'').split(/\s+/).filter(Boolean).length;
    var base=1400 + words*620;
    if(/[.…—,;:]$/.test(item.x||'')) base+=500;
    return base/speed;
  }
  function step(dir){ pos=Math.max(0,Math.min(lineIdx.length-1,pos+dir)); render(); }
  function autoNext(){ if(!playing) return; if(pos>=lineIdx.length-1){ stop(); return; } step(1); timer=setTimeout(autoNext, dwell(pos)); }

  var playBtn=document.getElementById('play');
  function start(){ playing=true; playBtn.innerHTML='&#10074;&#10074;'; clearTimeout(timer); timer=setTimeout(autoNext, dwell(pos)); }
  function stop(){ playing=false; playBtn.innerHTML='&#9654;'; clearTimeout(timer); }
  playBtn.onclick=function(){ playing?stop():start(); };
  document.getElementById('fwd').onclick=function(){ stop(); step(1); };
  document.getElementById('back').onclick=function(){ stop(); step(-1); };
  document.getElementById('restart').onclick=function(){ stop(); pos=0; render(); };

  scroll.addEventListener('click',function(e){
    var d=e.target.closest('.ln'); if(!d||d.classList.contains('blank')) return;
    var li=lineIdx.indexOf(+d.dataset.i); if(li<0) return; stop(); pos=li; render();
  });
  document.addEventListener('keydown',function(e){
    if(e.key===' '||e.key==='ArrowDown'||e.key==='ArrowRight'){ e.preventDefault(); stop(); step(1); }
    else if(e.key==='ArrowUp'||e.key==='ArrowLeft'){ e.preventDefault(); stop(); step(-1); }
    else if(e.key.toLowerCase()==='p'){ e.preventDefault(); playing?stop():start(); }
  });
  var spd=document.getElementById('spd'), spdval=document.getElementById('spdval');
  spd.oninput=function(){ speed=+spd.value; spdval.innerHTML=(+spd.value).toFixed(2)+'&times;'; if(playing){ clearTimeout(timer); timer=setTimeout(autoNext, dwell(pos)); } };

  var bar=document.getElementById('bar'), hint=document.getElementById('hint'), idle=null;
  function wake(){ bar.classList.remove('hide'); hint.classList.remove('hide'); clearTimeout(idle);
    idle=setTimeout(function(){ if(playing){ bar.classList.add('hide'); hint.classList.add('hide'); } }, 3200); }
  ['mousemove','pointerdown','keydown','touchstart'].forEach(function(ev){ document.addEventListener(ev, wake, {passive:true}); });
  window.addEventListener('resize', render);
  render(); wake();

  // ── audio-locked mode — if SONG.audio + SONG.cues are present, drive from the actual track ──
  (function(){
    if(!SONG.audio||!SONG.cues||!SONG.cues.length) return;
    var C=SONG.cues;
    var aud=document.createElement('audio');
    aud.src=SONG.audio; aud.preload='auto';
    document.body.appendChild(aud);
    // override start/stop to control real audio
    start=function(){ playing=true; playBtn.innerHTML='&#10074;&#10074;'; aud.play(); };
    stop=function(){ playing=false; playBtn.innerHTML='&#9654;'; aud.pause(); };
    // timeupdate drives the highlight
    aud.addEventListener('timeupdate',function(){
      var t=aud.currentTime,np=0;
      for(var i=0;i<C.length;i++){ if(C[i]<=t) np=i; else break; }
      if(np!==pos){ pos=np; render(); }
    });
    aud.addEventListener('ended',function(){ stop(); });
    // fwd/back/restart seek in the real audio
    document.getElementById('fwd').onclick=function(){
      if(pos<C.length-1){ pos++; aud.currentTime=C[pos]; render(); }
    };
    document.getElementById('back').onclick=function(){
      if(pos>0){ pos--; aud.currentTime=C[pos]; render(); }
    };
    document.getElementById('restart').onclick=function(){
      pos=0; aud.currentTime=0; render();
    };
    // clicking a line seeks audio to that cue
    scroll.addEventListener('click',function(e){
      var d=e.target.closest('.ln'); if(!d||d.classList.contains('blank')) return;
      var li=lineIdx.indexOf(+d.dataset.i); if(li<0||li>=C.length) return;
      pos=li; aud.currentTime=C[li]; render();
    });
    // hide speed slider (audio drives timing now)
    var spdEl=document.querySelector('.spd'); if(spdEl) spdEl.style.display='none';
    // update hint
    var hintEl=document.getElementById('hint');
    if(hintEl) hintEl.innerHTML='<a href="'+(SONG.back||'/radio/')+'">&larr; '+(SONG.backLabel||'the show')+'</a> &nbsp;&middot;&nbsp; tap ▶ to play &middot; tap a line to jump';
  })();

  // ── the faint background field, same hand as the radio ──
  (function(){
    var cv=document.getElementById('field'); if(!cv)return; var cx=cv.getContext('2d'); var W,H;
    function rz(){var d=devicePixelRatio||1;W=innerWidth;H=innerHeight;cv.width=W*d;cv.height=H*d;cx.setTransform(d,0,0,d,0,0);}
    rz(); addEventListener('resize',rz);
    var N=46,m=[]; for(var i=0;i<N;i++)m.push({a:i*2.39996,r:80+Math.pow(i/N,0.7)*Math.min(W,H)*0.55,sp:(0.02+Math.random()*0.07)*(Math.random()<.5?1:-1),sz:0.5+Math.random()*1.2,ph:Math.random()*6.28});
    function draw(ts){var t=ts*0.001;cx.clearRect(0,0,W,H);var cxp=W/2,cyp=H*0.42;
      for(var i=0;i<N;i++){var p=m[i];p.a+=p.sp*0.016;var x=cxp+Math.cos(p.a)*p.r,y=cyp+Math.sin(p.a)*p.r*0.6;
        var al=0.05+0.05*Math.sin(t*1.1+p.ph);cx.beginPath();cx.arc(x,y,p.sz,0,6.28);cx.fillStyle='rgba(201,164,74,'+al.toFixed(3)+')';cx.fill();}
      requestAnimationFrame(draw);}
    requestAnimationFrame(draw);
  })();
})();
