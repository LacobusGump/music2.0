/* scroll-music.js — the page is the song, scrolling is playing it

   Each section of the page has musical parameters.
   Scroll position smoothly interpolates between them.
   The reader's position IS the instrument.

   No audio files. Pure Web Audio synthesis.
   The music generates from WHERE you are, not how fast you moved. */

(function(){
'use strict';

// Don't auto-start. Wait for user gesture.
var ctx = null;
var started = false;
var masterGain = null;

// ═══ SECTIONS — each one is a musical world ═══
// Defined by scroll percentage and sonic parameters
var SECTIONS = [
  // intro — quiet, a single breath
  { at:0.00, root:33, mode:'open',    density:0.1, brightness:0.2, tension:0.0, reverb:0.8, tempo:0 },
  // K — coupling — warm, consonant, growing
  { at:0.08, root:33, mode:'major',   density:0.3, brightness:0.3, tension:0.0, reverb:0.7, tempo:0.2 },
  // R — synchronization — rhythmic, locked, steady
  { at:0.20, root:44, mode:'major',   density:0.5, brightness:0.4, tension:0.1, reverb:0.5, tempo:0.5 },
  // E — energy — brighter, more harmonics
  { at:0.32, root:55, mode:'lydian',  density:0.6, brightness:0.6, tension:0.15, reverb:0.4, tempo:0.4 },
  // T — tension — dissonant, unresolved, searching
  { at:0.42, root:49, mode:'minor',   density:0.4, brightness:0.3, tension:0.6, reverb:0.6, tempo:0.3 },
  // ego section — darker, heavier
  { at:0.50, root:37, mode:'phrygian',density:0.5, brightness:0.2, tension:0.7, reverb:0.7, tempo:0.2 },
  // quiet ego — resolution begins
  { at:0.58, root:44, mode:'major',   density:0.3, brightness:0.4, tension:0.3, reverb:0.6, tempo:0.3 },
  // AI section — clean, precise, open
  { at:0.65, root:55, mode:'lydian',  density:0.4, brightness:0.5, tension:0.1, reverb:0.5, tempo:0.2 },
  // denominator — warmth returns
  { at:0.72, root:44, mode:'major',   density:0.4, brightness:0.4, tension:0.2, reverb:0.5, tempo:0.3 },
  // for coupling — the deepest warmth
  { at:0.80, root:33, mode:'major',   density:0.6, brightness:0.5, tension:0.05, reverb:0.7, tempo:0.2 },
  // predictions — anticipatory, rising
  { at:0.88, root:49, mode:'mixo',    density:0.5, brightness:0.6, tension:0.3, reverb:0.4, tempo:0.4 },
  // echoes — callback, recognition, home
  { at:0.94, root:33, mode:'open',    density:0.3, brightness:0.3, tension:0.0, reverb:0.9, tempo:0.1 },
  // end — silence returns
  { at:1.00, root:33, mode:'open',    density:0.05, brightness:0.1, tension:0.0, reverb:0.9, tempo:0 },
];

// Scale intervals from root (in semitones)
var MODES = {
  open:     [0, 7, 12, 19, 24],
  major:    [0, 4, 7, 11, 12, 16, 19],
  minor:    [0, 3, 7, 10, 12, 15, 19],
  lydian:   [0, 4, 7, 11, 12, 18, 23],
  phrygian: [0, 1, 5, 7, 10, 12, 13],
  mixo:     [0, 4, 7, 10, 12, 16, 19],
};

// ═══ INTERPOLATE between sections ═══
function lerp(a, b, t){ return a + (b - a) * t; }

function getParams(scroll){
  // Find which two sections we're between
  for(var i = SECTIONS.length - 2; i >= 0; i--){
    if(scroll >= SECTIONS[i].at){
      var a = SECTIONS[i], b = SECTIONS[i+1];
      var t = (scroll - a.at) / (b.at - a.at + 0.001);
      t = Math.max(0, Math.min(1, t));
      return {
        root: lerp(a.root, b.root, t),
        density: lerp(a.density, b.density, t),
        brightness: lerp(a.brightness, b.brightness, t),
        tension: lerp(a.tension, b.tension, t),
        reverb: lerp(a.reverb, b.reverb, t),
        tempo: lerp(a.tempo, b.tempo, t),
        modeA: a.mode,
        modeB: b.mode,
        blend: t,
      };
    }
  }
  return SECTIONS[0];
}

// ═══ AUDIO ENGINE ═══
var oscs = [];
var gains = [];
var MAX_VOICES = 6;
var convolver = null;

function initAudio(){
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = ctx.createGain();
  masterGain.gain.value = 0.08;

  // Simple reverb via delay feedback
  var delay = ctx.createDelay(1.0);
  delay.delayTime.value = 0.15;
  var feedback = ctx.createGain();
  feedback.gain.value = 0.3;
  var reverbGain = ctx.createGain();
  reverbGain.gain.value = 0.4;

  masterGain.connect(ctx.destination);
  masterGain.connect(delay);
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(reverbGain);
  reverbGain.connect(ctx.destination);

  // Create voice pool
  for(var i = 0; i < MAX_VOICES; i++){
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 33;
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    oscs.push(osc);
    gains.push(gain);
  }

  started = true;
}

// Convert semitones to frequency
function semiToFreq(root, semi){
  return root * Math.pow(2, semi / 12);
}

// ═══ UPDATE — called on scroll ═══
var lastScroll = -1;

function update(){
  if(!started || !ctx) return;

  var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  var docHeight = document.documentElement.scrollHeight - window.innerHeight;
  var scroll = docHeight > 0 ? scrollTop / docHeight : 0;

  // Don't update if scroll hasn't changed meaningfully
  if(Math.abs(scroll - lastScroll) < 0.001) return;
  lastScroll = scroll;

  var p = getParams(scroll);
  var now = ctx.currentTime;

  // Pick notes from the current mode
  var mode = MODES[p.modeA] || MODES.open;
  var numVoices = Math.max(1, Math.round(p.density * MAX_VOICES));

  for(var i = 0; i < MAX_VOICES; i++){
    var targetGain = 0;
    var targetFreq = p.root;

    if(i < numVoices){
      // Pick a note from the scale
      var noteIdx = i % mode.length;
      targetFreq = semiToFreq(p.root, mode[noteIdx]);

      // Add slight detuning for warmth
      targetFreq *= (1 + (Math.random() - 0.5) * 0.002);

      // Volume shaped by brightness and position in the chord
      targetGain = p.brightness * 0.04 / (1 + i * 0.5);

      // Tension adds dissonance — shift some voices by a semitone
      if(p.tension > 0.3 && i > 2){
        targetFreq *= Math.pow(2, (p.tension * 0.5) / 12);
      }
    }

    // Smooth transitions — never jump
    oscs[i].frequency.setTargetAtTime(targetFreq, now, 0.5);
    gains[i].gain.setTargetAtTime(targetGain, now, 0.3);
  }

  // Master volume follows density
  masterGain.gain.setTargetAtTime(0.03 + p.density * 0.06, now, 0.5);
}

// ═══ SCROLL LISTENER ═══
var ticking = false;
window.addEventListener('scroll', function(){
  if(!ticking){
    requestAnimationFrame(function(){
      update();
      ticking = false;
    });
    ticking = true;
  }
});

// ═══ START BUTTON — user gesture required ═══
var btn = document.createElement('div');
btn.style.cssText = 'position:fixed;bottom:60px;right:20px;z-index:9998;cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent;';
btn.innerHTML = '<span style="font-size:0.6em;color:#c9a44a30;letter-spacing:0.06em;border:1px solid #c9a44a15;padding:5px 12px;border-radius:16px;transition:all 0.4s;font-family:Georgia,serif;">♪ hear the page</span>';

btn.onmouseenter = function(){ btn.firstChild.style.color='#c9a44a80'; btn.firstChild.style.borderColor='#c9a44a40'; };
btn.onmouseleave = function(){
  btn.firstChild.style.color = started ? '#c9a44a60' : '#c9a44a30';
  btn.firstChild.style.borderColor = started ? '#c9a44a30' : '#c9a44a15';
};

btn.onclick = function(){
  if(!started){
    initAudio();
    update();
    btn.firstChild.textContent = '♪ mute';
    btn.firstChild.style.color = '#c9a44a60';
  } else if(ctx.state === 'running'){
    ctx.suspend();
    btn.firstChild.textContent = '♪ hear the page';
    btn.firstChild.style.color = '#c9a44a30';
  } else {
    ctx.resume();
    update();
    btn.firstChild.textContent = '♪ mute';
    btn.firstChild.style.color = '#c9a44a60';
  }
};

document.body.appendChild(btn);

})();
