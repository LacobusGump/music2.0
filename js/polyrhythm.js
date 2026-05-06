// polyrhythm.js — The Coupling Machine
//
// Four voices. Four limbs. One cycle.
// Layer Euclidean rhythms and hear how they couple.
//
// The coincidence points — where onsets from different voices
// land together — are resolution events. The spaces between
// are prediction errors. The ratio of coincidence to total onsets
// IS the coupling strength. This is K, made audible.
//
// Uses euclidean.js for pattern generation.

(function(){
'use strict';

// ═══ STATE ═══
var voices = [
  { k:3, n:8,  on:true,  name:'Right Hand', color:'#b8753a', short:'RH' },
  { k:2, n:8,  on:false, name:'Left Hand',  color:'#7a9a6a', short:'LH' },
  { k:1, n:8,  on:false, name:'Right Foot', color:'#6a8a9a', short:'RF' },
  { k:0, n:8,  on:false, name:'Left Foot',  color:'#9a6a8a', short:'LF' },
];

var bpm = 120;
var playing = false;
var audioCtx = null;
var currentStep = -1;
var stepTimer = null;
var cycleN = 8; // shared cycle length
var scheduledStep = -1;
var nextStepTime = 0;
var LOOKAHEAD = 0.05; // seconds
var SCHEDULE_INTERVAL = 25; // ms

// Presets: classic kit patterns as Euclidean decompositions
// In an 8-step cycle: positions 0-7 map to eighth notes.
// Backbeat snare on beats 2&4 = positions 2,6 = E(2,8) rot:2
// Kick on 1&3 = positions 0,4 = E(2,8) no rotation
// Hi-hat on all = E(8,8), on quarters = E(4,8)
var PRESETS = {
  'basic-rock':     { label:'Basic Rock',     voices:[{k:4,n:8},{k:2,n:8,rot:2},{k:2,n:8},{k:4,n:8}], bpm:120, n:8, desc:'The foundation. Hi-hat quarters, snare on 2&4, kick on 1&3, pedal hat on quarters.' },
  'tresillo-kit':   { label:'Tresillo Kit',   voices:[{k:3,n:8},{k:2,n:8,rot:2},{k:3,n:8,rot:1},{k:2,n:8}], bpm:100, n:8, desc:'Afro-Cuban tresillo on hi-hat, snare backbeat, kick tresillo offset.' },
  'bossa-nova':     { label:'Bossa Nova',     voices:[{k:5,n:16},{k:3,n:16,rot:6},{k:3,n:16},{k:4,n:16}], bpm:200, n:16, desc:'5+3+3+4 in 16. The gentlest asymmetry.' },
  '3-against-2':    { label:'3 Against 2',    voices:[{k:3,n:12},{k:2,n:12},{k:0,n:12},{k:0,n:12}], bpm:180, n:12, desc:'The simplest polyrhythm. Two predictions at once.' },
  '4-against-3':    { label:'4 Against 3',    voices:[{k:4,n:12},{k:3,n:12},{k:0,n:12},{k:0,n:12}], bpm:180, n:12, desc:'Coincidence every 12. More complex. More K.' },
  'west-african':   { label:'West African',   voices:[{k:7,n:12},{k:5,n:12},{k:3,n:12},{k:2,n:12}], bpm:180, n:12, desc:'Four voices, maximum density. Every frequency band has errors.' },
  'samba':          { label:'Samba',          voices:[{k:7,n:16},{k:5,n:16},{k:3,n:16,rot:1},{k:4,n:16}], bpm:220, n:16, desc:'Dense, layered, alive. The room is the instrument.' },
  'solo':           { label:'One Voice',      voices:[{k:3,n:8},{k:0,n:8},{k:0,n:8},{k:0,n:8}], bpm:120, n:8, desc:'Start here. One limb. Tresillo.' },
};

// ═══ TIMBRES ═══
// Each voice gets a distinct drum sound
var timbres = {
  'Right Hand': function(ac, t, vel) {
    // Hi-hat: high, short, metallic noise burst
    var buf = ac.createBuffer(1, ac.sampleRate * 0.04, ac.sampleRate);
    var d = buf.getChannelData(0);
    for(var i=0;i<d.length;i++) d[i]=(Math.random()*2-1);
    var ns = ac.createBufferSource(), ng = ac.createGain();
    var filt = ac.createBiquadFilter();
    ns.buffer = buf; filt.type='highpass'; filt.frequency.value=7000;
    ng.gain.setValueAtTime(0.18*vel, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t+0.06);
    ns.connect(filt); filt.connect(ng); ng.connect(ac.destination);
    ns.start(t); ns.stop(t+0.07);
  },
  'Left Hand': function(ac, t, vel) {
    // Snare: mid crack + noise
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(200, t);
    o.frequency.exponentialRampToValueAtTime(120, t+0.04);
    g.gain.setValueAtTime(0.25*vel, t);
    g.gain.exponentialRampToValueAtTime(0.001, t+0.12);
    o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t+0.13);
    // Noise layer
    var buf = ac.createBuffer(1, ac.sampleRate * 0.08, ac.sampleRate);
    var d = buf.getChannelData(0);
    for(var i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*0.7;
    var ns = ac.createBufferSource(), ng = ac.createGain();
    var filt = ac.createBiquadFilter();
    ns.buffer = buf; filt.type='highpass'; filt.frequency.value=2000;
    ng.gain.setValueAtTime(0.2*vel, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t+0.1);
    ns.connect(filt); filt.connect(ng); ng.connect(ac.destination);
    ns.start(t); ns.stop(t+0.11);
  },
  'Right Foot': function(ac, t, vel) {
    // Kick: low thump
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(40, t+0.08);
    g.gain.setValueAtTime(0.4*vel, t);
    g.gain.exponentialRampToValueAtTime(0.001, t+0.25);
    o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t+0.26);
    // Click layer
    var o2 = ac.createOscillator(), g2 = ac.createGain();
    o2.type = 'triangle'; o2.frequency.setValueAtTime(4000, t);
    o2.frequency.exponentialRampToValueAtTime(200, t+0.01);
    g2.gain.setValueAtTime(0.15*vel, t);
    g2.gain.exponentialRampToValueAtTime(0.001, t+0.02);
    o2.connect(g2); g2.connect(ac.destination); o2.start(t); o2.stop(t+0.03);
  },
  'Left Foot': function(ac, t, vel) {
    // Pedal hi-hat: short, closed, ticky
    var buf = ac.createBuffer(1, ac.sampleRate * 0.02, ac.sampleRate);
    var d = buf.getChannelData(0);
    for(var i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*0.5;
    var ns = ac.createBufferSource(), ng = ac.createGain();
    var filt = ac.createBiquadFilter();
    ns.buffer = buf; filt.type='bandpass'; filt.frequency.value=5000; filt.Q.value=2;
    ng.gain.setValueAtTime(0.12*vel, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t+0.03);
    ns.connect(filt); filt.connect(ng); ng.connect(ac.destination);
    ns.start(t); ns.stop(t+0.04);
  }
};

// ═══ GENERATE PATTERNS ═══
function getPattern(voice) {
  var pat = Euclidean.generate(voice.k, voice.n);
  if (voice.rot) pat = Euclidean.rotate(pat, voice.rot);
  return pat;
}

function getAllPatterns() {
  return voices.map(function(v) {
    return v.on && v.k > 0 ? getPattern(v) : null;
  });
}

// ═══ COUPLING ANALYSIS ═══
// The heart of it: measure how patterns interact
function analyzeCoupling() {
  var patterns = getAllPatterns();
  var activePatterns = patterns.filter(function(p){ return p !== null; });

  if (activePatterns.length < 2) return { K: 0, coincidences: 0, totalOnsets: 0, density: 0, composite: null };

  // Build composite: how many voices hit each step
  var composite = new Array(cycleN).fill(0);
  for (var i = 0; i < patterns.length; i++) {
    if (!patterns[i]) continue;
    for (var j = 0; j < cycleN; j++) {
      composite[j] += patterns[i][j] || 0;
    }
  }

  var coincidences = 0; // steps where 2+ voices hit
  var totalOnsets = 0;
  var activeSteps = 0;
  for (var j = 0; j < cycleN; j++) {
    if (composite[j] >= 2) coincidences++;
    if (composite[j] >= 1) activeSteps++;
    totalOnsets += composite[j];
  }

  // K = ratio of coincidence to maximum possible coincidence
  // If all active voices hit every step together, K=1
  // If they never overlap, K=0
  var maxCoincidence = Math.min.apply(null, activePatterns.map(function(p){
    var c = 0; for(var i=0;i<p.length;i++) c+=p[i]; return c;
  }));

  var K = maxCoincidence > 0 ? coincidences / maxCoincidence : 0;

  // Prediction error density: how many steps have some-but-not-all voices
  var partials = 0;
  for (var j = 0; j < cycleN; j++) {
    if (composite[j] >= 1 && composite[j] < activePatterns.length) partials++;
  }

  return {
    K: K,
    coincidences: coincidences,
    totalOnsets: totalOnsets,
    density: activeSteps / cycleN,
    partials: partials,
    composite: composite
  };
}

// ═══ AUDIO ═══
function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function scheduleNote(voice, time) {
  var ac = getAudioCtx();
  var fn = timbres[voice.name];
  if (fn) fn(ac, time, 1.0);
}

// ═══ SCHEDULING ═══
// Web Audio lookahead scheduler for tight timing
function startPlayback() {
  var ac = getAudioCtx();
  playing = true;
  currentStep = -1;
  scheduledStep = -1;
  nextStepTime = ac.currentTime + 0.05;
  scheduleAhead();
  stepTimer = setInterval(scheduleAhead, SCHEDULE_INTERVAL);
  updatePlayBtn();
}

function scheduleAhead() {
  if (!playing) return;
  var ac = getAudioCtx();
  var stepDur = 60 / bpm; // seconds per step

  while (nextStepTime < ac.currentTime + LOOKAHEAD) {
    scheduledStep++;
    var idx = scheduledStep % cycleN;

    // Schedule each active voice
    var patterns = getAllPatterns();
    for (var i = 0; i < voices.length; i++) {
      if (patterns[i] && patterns[i][idx]) {
        scheduleNote(voices[i], nextStepTime);
      }
    }

    // Update visual on the beat closest to now
    var stepToShow = idx;
    (function(s, t){
      var delay = Math.max(0, (t - ac.currentTime) * 1000);
      setTimeout(function(){
        currentStep = s;
        drawCanvas();
      }, delay);
    })(stepToShow, nextStepTime);

    nextStepTime += stepDur;
  }
}

function stopPlayback() {
  playing = false;
  if (stepTimer) { clearInterval(stepTimer); stepTimer = null; }
  currentStep = -1;
  updatePlayBtn();
  drawCanvas();
}

function togglePlay() {
  if (playing) stopPlayback();
  else startPlayback();
}

// ═══ CANVAS ═══
var canvas, ctx2d, dpr;
var cssW = 320, cssH = 320;

function initCanvas() {
  canvas = document.getElementById('poly-canvas');
  if (!canvas) return;
  ctx2d = canvas.getContext('2d');
  dpr = window.devicePixelRatio || 1;
  canvas.width = cssW * dpr;
  canvas.height = cssH * dpr;
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawCanvas() {
  if (!ctx2d) return;
  var cx = cssW / 2, cy = cssH / 2;
  ctx2d.clearRect(0, 0, cssW, cssH);

  var patterns = getAllPatterns();
  var activeCount = patterns.filter(function(p){return p!==null;}).length;

  // Draw concentric rings, one per active voice
  var ringRadii = [110, 92, 74, 56];
  var voiceIdx = 0;

  for (var v = 0; v < voices.length; v++) {
    if (!voices[v].on || voices[v].k === 0) continue;
    var pat = patterns[v];
    if (!pat) continue;

    var r = ringRadii[voiceIdx] || (ringRadii[ringRadii.length-1] - voiceIdx*18);
    voiceIdx++;

    // Ring circle
    ctx2d.beginPath();
    ctx2d.arc(cx, cy, r, 0, Math.PI*2);
    ctx2d.strokeStyle = voices[v].color + '20';
    ctx2d.lineWidth = 1;
    ctx2d.stroke();

    // Steps
    for (var i = 0; i < cycleN; i++) {
      var angle = (i / cycleN) * Math.PI * 2 - Math.PI / 2;
      var x = cx + Math.cos(angle) * r;
      var y = cy + Math.sin(angle) * r;
      var isOnset = pat[i] === 1;
      var isCurrent = i === currentStep;

      if (isOnset) {
        // Connect to next onset
        for (var j = 1; j <= cycleN; j++) {
          var ni = (i + j) % cycleN;
          if (pat[ni] === 1) {
            var a2 = (ni / cycleN) * Math.PI * 2 - Math.PI / 2;
            var x2 = cx + Math.cos(a2) * r;
            var y2 = cy + Math.sin(a2) * r;
            ctx2d.beginPath();
            ctx2d.moveTo(x, y);
            ctx2d.lineTo(x2, y2);
            ctx2d.strokeStyle = isCurrent ? voices[v].color + '80' : voices[v].color + '18';
            ctx2d.lineWidth = isCurrent ? 1.5 : 0.7;
            ctx2d.stroke();
            break;
          }
        }

        // Node
        var nodeR = isCurrent ? 7 : 4;
        ctx2d.beginPath();
        ctx2d.arc(x, y, nodeR, 0, Math.PI*2);
        if (isCurrent) {
          ctx2d.fillStyle = voices[v].color;
          ctx2d.shadowColor = voices[v].color;
          ctx2d.shadowBlur = 10;
        } else {
          ctx2d.fillStyle = voices[v].color + 'AA';
          ctx2d.shadowBlur = 0;
        }
        ctx2d.fill();
        ctx2d.shadowBlur = 0;
      } else {
        ctx2d.beginPath();
        ctx2d.arc(x, y, isCurrent ? 3 : 1.5, 0, Math.PI*2);
        ctx2d.fillStyle = isCurrent ? voices[v].color + '60' : voices[v].color + '15';
        ctx2d.fill();
      }
    }
  }

  // Draw coincidence markers — where voices land together
  if (activeCount >= 2) {
    var analysis = analyzeCoupling();
    if (analysis.composite) {
      for (var i = 0; i < cycleN; i++) {
        if (analysis.composite[i] >= 2) {
          var angle = (i / cycleN) * Math.PI * 2 - Math.PI / 2;
          // Draw a radial line through all rings at coincidence points
          var innerR = ringRadii[Math.min(voiceIdx-1, ringRadii.length-1)] - 12;
          var outerR = ringRadii[0] + 12;
          var x1 = cx + Math.cos(angle) * innerR;
          var y1 = cy + Math.sin(angle) * innerR;
          var x2 = cx + Math.cos(angle) * outerR;
          var y2 = cy + Math.sin(angle) * outerR;
          ctx2d.beginPath();
          ctx2d.moveTo(x1, y1);
          ctx2d.lineTo(x2, y2);
          var isCurrent = i === currentStep;
          ctx2d.strokeStyle = isCurrent ? 'rgba(255,220,160,0.5)' : 'rgba(255,220,160,0.08)';
          ctx2d.lineWidth = isCurrent ? 2 : 1;
          ctx2d.stroke();
        }
      }
    }
  }

  // Center: coupling K
  if (activeCount >= 2) {
    var a = analyzeCoupling();
    ctx2d.fillStyle = 'rgba(184,117,58,0.25)';
    ctx2d.font = '400 11px Futura, Century Gothic, system-ui, sans-serif';
    ctx2d.textAlign = 'center';
    ctx2d.textBaseline = 'middle';
    ctx2d.fillText('K = ' + a.K.toFixed(2), cx, cy - 8);
    ctx2d.font = '9px Courier New, monospace';
    ctx2d.fillStyle = 'rgba(184,117,58,0.15)';
    ctx2d.fillText(a.coincidences + ' coincidence' + (a.coincidences!==1?'s':''), cx, cy + 6);
    ctx2d.fillText(a.partials + ' prediction error' + (a.partials!==1?'s':''), cx, cy + 18);
  } else if (activeCount === 1) {
    ctx2d.fillStyle = 'rgba(184,117,58,0.15)';
    ctx2d.font = '10px Georgia, serif';
    ctx2d.textAlign = 'center';
    ctx2d.textBaseline = 'middle';
    ctx2d.fillText('one voice', cx, cy - 4);
    ctx2d.font = '9px Georgia, serif';
    ctx2d.fillStyle = 'rgba(184,117,58,0.1)';
    ctx2d.fillText('add another to couple', cx, cy + 10);
  }

  // Step indicator at the outermost ring
  if (currentStep >= 0) {
    var angle = (currentStep / cycleN) * Math.PI * 2 - Math.PI / 2;
    var x = cx + Math.cos(angle) * (ringRadii[0] + 22);
    var y = cy + Math.sin(angle) * (ringRadii[0] + 22);
    ctx2d.beginPath();
    ctx2d.arc(x, y, 3, 0, Math.PI*2);
    ctx2d.fillStyle = 'rgba(255,220,160,0.4)';
    ctx2d.fill();
  }
}

// ═══ UI ═══
function updatePlayBtn() {
  var btn = document.getElementById('poly-play');
  if (!btn) return;
  btn.textContent = playing ? 'Stop' : 'Play';
  btn.classList.toggle('active', playing);
}

function buildUI() {
  var container = document.getElementById('poly-controls');
  if (!container) return;

  container.innerHTML = '';

  for (var v = 0; v < voices.length; v++) {
    (function(idx) {
      var voice = voices[idx];
      var row = document.createElement('div');
      row.className = 'voice-row';
      row.style.cssText = 'display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(184,117,58,0.06);';
      if (idx === voices.length - 1) row.style.borderBottom = 'none';

      // On/off toggle
      var toggle = document.createElement('button');
      toggle.className = 'voice-toggle';
      toggle.style.cssText = 'width:32px;height:20px;border-radius:10px;border:1px solid ' + voice.color + '40;background:' + (voice.on ? voice.color + '30' : 'transparent') + ';cursor:pointer;position:relative;transition:all 0.3s;flex-shrink:0;';
      var dot = document.createElement('span');
      dot.style.cssText = 'position:absolute;top:2px;' + (voice.on?'right:2px':'left:2px') + ';width:14px;height:14px;border-radius:50%;background:' + (voice.on ? voice.color : voice.color + '40') + ';transition:all 0.3s;';
      toggle.appendChild(dot);
      toggle.onclick = function() {
        voice.on = !voice.on;
        buildUI();
        if (playing) { stopPlayback(); startPlayback(); }
        drawCanvas();
      };

      // Name
      var name = document.createElement('span');
      name.style.cssText = 'font-family:Futura,Century Gothic,system-ui,sans-serif;font-size:0.7em;color:' + voice.color + ';letter-spacing:0.06em;width:80px;flex-shrink:0;opacity:' + (voice.on ? '1' : '0.35') + ';';
      name.textContent = voice.name;

      // K control
      var kGroup = document.createElement('span');
      kGroup.style.cssText = 'display:flex;align-items:center;gap:4px;opacity:' + (voice.on ? '1' : '0.2') + ';';
      var kLabel = document.createElement('span');
      kLabel.style.cssText = 'font-size:0.6em;color:rgba(184,117,58,0.4);font-family:Futura,Century Gothic,sans-serif;letter-spacing:0.06em;';
      kLabel.textContent = 'k';
      var kDown = document.createElement('button');
      kDown.className = 'ctrl-btn';
      kDown.textContent = '\u2212';
      kDown.onclick = function() {
        if (!voice.on) return;
        if (voice.k > 0) { voice.k--; voice.rot = 0; buildUI(); if(playing){stopPlayback();startPlayback();} drawCanvas(); }
      };
      var kVal = document.createElement('span');
      kVal.style.cssText = 'font-family:Courier New,monospace;font-size:0.85em;color:' + voice.color + ';min-width:1.5em;text-align:center;';
      kVal.textContent = voice.k;
      var kUp = document.createElement('button');
      kUp.className = 'ctrl-btn';
      kUp.textContent = '+';
      kUp.onclick = function() {
        if (!voice.on) return;
        if (voice.k < cycleN) { voice.k++; voice.rot = 0; buildUI(); if(playing){stopPlayback();startPlayback();} drawCanvas(); }
      };
      kGroup.appendChild(kLabel);
      kGroup.appendChild(kDown);
      kGroup.appendChild(kVal);
      kGroup.appendChild(kUp);

      // Pattern display
      var patDisplay = document.createElement('span');
      patDisplay.style.cssText = 'font-family:Courier New,monospace;font-size:0.65em;color:' + voice.color + '60;letter-spacing:0.06em;flex:1;text-align:right;overflow:hidden;white-space:nowrap;';
      if (voice.on && voice.k > 0) {
        patDisplay.textContent = Euclidean.toString(getPattern(voice));
      } else {
        patDisplay.textContent = '';
      }

      row.appendChild(toggle);
      row.appendChild(name);
      row.appendChild(kGroup);
      row.appendChild(patDisplay);
      container.appendChild(row);
    })(v);
  }
}

function buildPresets() {
  var container = document.getElementById('poly-presets');
  if (!container) return;
  container.innerHTML = '';

  var keys = Object.keys(PRESETS);
  for (var i = 0; i < keys.length; i++) {
    (function(key) {
      var preset = PRESETS[key];
      var btn = document.createElement('button');
      btn.className = 'preset-btn';
      btn.textContent = preset.label;
      btn.title = preset.desc;
      btn.onclick = function() {
        loadPreset(key);
        // Highlight active
        var all = container.querySelectorAll('.preset-btn');
        for (var j = 0; j < all.length; j++) all[j].classList.remove('active');
        btn.classList.add('active');
      };
      container.appendChild(btn);
    })(keys[i]);
  }
}

function loadPreset(key) {
  var preset = PRESETS[key];
  if (!preset) return;
  cycleN = preset.n;
  bpm = preset.bpm;
  for (var i = 0; i < 4; i++) {
    var pv = preset.voices[i];
    voices[i].k = pv.k;
    voices[i].n = pv.n || preset.n;
    voices[i].on = pv.k > 0;
    voices[i].rot = pv.rot || 0;
  }
  document.getElementById('poly-n-val').textContent = cycleN;
  document.getElementById('poly-bpm-val').textContent = bpm;
  updateDesc(preset.desc);
  buildUI();
  if (playing) { stopPlayback(); startPlayback(); }
  drawCanvas();
}

function updateDesc(text) {
  var el = document.getElementById('poly-desc');
  if (el) el.textContent = text || '';
}

function updateCouplingBar() {
  var bar = document.getElementById('coupling-bar');
  var label = document.getElementById('coupling-label');
  if (!bar || !label) return;

  var activeCount = voices.filter(function(v){return v.on && v.k > 0;}).length;
  if (activeCount < 2) {
    bar.style.width = '0%';
    label.textContent = '';
    return;
  }

  var a = analyzeCoupling();
  bar.style.width = (a.K * 100) + '%';

  if (a.K > 0.7) {
    label.textContent = 'High coupling — voices resolve together';
    bar.style.background = '#7a9a6a';
  } else if (a.K > 0.3) {
    label.textContent = 'Medium coupling — mix of resolution and error';
    bar.style.background = '#b8753a';
  } else if (a.K > 0) {
    label.textContent = 'Low coupling — mostly prediction errors';
    bar.style.background = '#9a6a8a';
  } else {
    label.textContent = 'Zero coupling — voices never coincide';
    bar.style.background = '#a55';
  }
}

// ═══ GLOBAL CONTROLS ═══
function setupGlobalControls() {
  var playBtn = document.getElementById('poly-play');
  if (playBtn) playBtn.onclick = togglePlay;

  // Cycle length (n)
  var nDown = document.getElementById('poly-n-down');
  var nUp = document.getElementById('poly-n-up');
  var nVal = document.getElementById('poly-n-val');
  if (nDown) nDown.onclick = function() {
    if (cycleN > 2) {
      cycleN--;
      for (var i=0;i<voices.length;i++) {
        voices[i].n = cycleN;
        voices[i].rot = 0;
        if (voices[i].k > cycleN) voices[i].k = cycleN;
      }
      nVal.textContent = cycleN;
      buildUI();
      if (playing) { stopPlayback(); startPlayback(); }
      drawCanvas();
    }
  };
  if (nUp) nUp.onclick = function() {
    if (cycleN < 32) {
      cycleN++;
      for (var i=0;i<voices.length;i++) { voices[i].n = cycleN; voices[i].rot = 0; }
      nVal.textContent = cycleN;
      buildUI();
      if (playing) { stopPlayback(); startPlayback(); }
      drawCanvas();
    }
  };

  // BPM
  var bpmDown = document.getElementById('poly-bpm-down');
  var bpmUp = document.getElementById('poly-bpm-up');
  var bpmVal = document.getElementById('poly-bpm-val');
  if (bpmDown) bpmDown.onclick = function() {
    if (bpm > 40) { bpm -= 10; bpmVal.textContent = bpm; if(playing){stopPlayback();startPlayback();} }
  };
  if (bpmUp) bpmUp.onclick = function() {
    if (bpm < 300) { bpm += 10; bpmVal.textContent = bpm; if(playing){stopPlayback();startPlayback();} }
  };
}

// ═══ REDRAW LOOP ═══
function loop() {
  updateCouplingBar();
  requestAnimationFrame(loop);
}

// ═══ INIT ═══
function init() {
  initCanvas();
  buildUI();
  buildPresets();
  setupGlobalControls();
  drawCanvas();
  loop();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
