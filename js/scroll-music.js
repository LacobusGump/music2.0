/* scroll-music.js v2 — the page is the composition

   rebuilt with the same philosophy as the mirror music:
   not safe. not quiet. alive.

   scroll position = where you are in the journey.
   the music breathes continuously — it doesn't die when you stop scrolling.
   each section is an emotional world, not just a chord. */

(function(){
'use strict';

var ctx = null, started = false, masterGain = null;
var scrollPos = 0; // 0-1

// ═══ SECTIONS — emotional worlds mapped to the page ═══
var SECTIONS = [
  // intro — one breath, barely there
  { at:0.00, root:137, mode:'open', density:0.15, bright:0.2, tension:0, warmth:0.8, pulse:0 },
  // the point — growing, warm, coupling explained
  { at:0.06, root:137, mode:'major', density:0.3, bright:0.3, tension:0, warmth:0.9, pulse:0.1 },
  // K — coupling IS the verb. warm. open fifths. life.
  { at:0.12, root:137, mode:'major', density:0.5, bright:0.4, tension:0, warmth:1.0, pulse:0.2 },
  // sweet spot — the pocket. rhythmic. 1/phi. the groove.
  { at:0.18, root:110, mode:'major', density:0.6, bright:0.5, tension:0.05, warmth:0.8, pulse:0.5 },
  // primes — mathematical. cold beauty. ticking underneath.
  { at:0.24, root:82.4, mode:'lydian', density:0.4, bright:0.6, tension:0.1, warmth:0.4, pulse:0.3 },
  // phase — circles. pure. rotating.
  { at:0.30, root:165, mode:'open', density:0.35, bright:0.5, tension:0.05, warmth:0.6, pulse:0.15 },
  // consciousness — layers opening. more channels. more harmonics.
  { at:0.35, root:137, mode:'lydian', density:0.6, bright:0.6, tension:0.1, warmth:0.7, pulse:0.2 },
  // music — the framework singing. consonance. THIS section.
  { at:0.40, root:110, mode:'major', density:0.8, bright:0.7, tension:0, warmth:1.0, pulse:0.4 },
  // the body — organic. heartbeat. breath.
  { at:0.46, root:82.4, mode:'minor', density:0.5, bright:0.3, tension:0.15, warmth:0.9, pulse:0.6 },
  // energy — bright. landauer cost. each note has a price.
  { at:0.52, root:165, mode:'lydian', density:0.5, bright:0.8, tension:0.1, warmth:0.5, pulse:0.2 },
  // the forces — powerful. geometric. deep.
  { at:0.56, root:55, mode:'open', density:0.6, bright:0.4, tension:0.2, warmth:0.6, pulse:0.15 },
  // gravity — heavy. torus. bending everything.
  { at:0.60, root:41.2, mode:'minor', density:0.4, bright:0.2, tension:0.4, warmth:0.5, pulse:0.1 },
  // the machine — 137 nodes. the birds. life.
  { at:0.65, root:137, mode:'major', density:0.7, bright:0.6, tension:0.05, warmth:0.8, pulse:0.3 },
  // attunement — resolution. two voices finding each other.
  { at:0.72, root:110, mode:'major', density:0.6, bright:0.5, tension:0, warmth:1.0, pulse:0.2 },
  // the FOR — deepest warmth. love IS the optimization.
  { at:0.78, root:137, mode:'major', density:0.7, bright:0.5, tension:0, warmth:1.0, pulse:0.15 },
  // the edge — tension returns. what we can't see yet.
  { at:0.84, root:123, mode:'minor', density:0.5, bright:0.4, tension:0.5, warmth:0.6, pulse:0.2 },
  // the spiral — rising. never closing. 1/phi prevents it.
  { at:0.90, root:137, mode:'lydian', density:0.5, bright:0.5, tension:0.15, warmth:0.7, pulse:0.1 },
  // end — the hm. alone. having been through everything.
  { at:0.97, root:137, mode:'open', density:0.1, bright:0.2, tension:0, warmth:0.9, pulse:0 },
  { at:1.00, root:137, mode:'open', density:0.02, bright:0.1, tension:0, warmth:0.9, pulse:0 },
];

var MODES = {
  open:     [0, 7, 12, 19, 24],
  major:    [0, 4, 7, 11, 12, 16, 19, 24],
  minor:    [0, 3, 7, 10, 12, 15, 19, 22],
  lydian:   [0, 4, 6, 7, 11, 12, 16, 18],
};

function lerp(a, b, t) { return a + (b - a) * t; }

function getParams(s) {
  for (var i = SECTIONS.length - 2; i >= 0; i--) {
    if (s >= SECTIONS[i].at) {
      var a = SECTIONS[i], b = SECTIONS[i + 1];
      var t = (s - a.at) / (b.at - a.at + 0.001);
      t = Math.max(0, Math.min(1, t));
      // ease the transition
      t = t * t * (3 - 2 * t); // smoothstep
      return {
        root: lerp(a.root, b.root, t),
        density: lerp(a.density, b.density, t),
        bright: lerp(a.bright, b.bright, t),
        tension: lerp(a.tension, b.tension, t),
        warmth: lerp(a.warmth, b.warmth, t),
        pulse: lerp(a.pulse, b.pulse, t),
        mode: t < 0.5 ? a.mode : b.mode,
      };
    }
  }
  return SECTIONS[0];
}

function semiToFreq(root, semi) {
  return root * Math.pow(2, semi / 12);
}

// ═══ AUDIO ENGINE ═══
var NUM_VOICES = 10;
var voiceOscs = [], voiceGains = [], voiceFilters = [];
var subOsc, subGain;
var noiseNode, noiseGain, noiseFilter;
var verbNode, dryBus, wetBus;
var tickTimer = 0;
var breathPhase = 0;
var t = 0;

function initAudio() {
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();

  // compressor for glue
  var comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -15;
  comp.ratio.value = 3;
  comp.attack.value = 0.01;
  comp.release.value = 0.2;

  masterGain = ctx.createGain();
  masterGain.gain.value = 0.22;
  masterGain.connect(comp);
  comp.connect(ctx.destination);

  // convolution reverb
  verbNode = ctx.createConvolver();
  var impLen = ctx.sampleRate * 2.5;
  var impBuf = ctx.createBuffer(2, impLen, ctx.sampleRate);
  for (var ch = 0; ch < 2; ch++) {
    var d = impBuf.getChannelData(ch);
    for (var i = 0; i < impLen; i++) {
      var tt = i / ctx.sampleRate;
      d[i] = (Math.random() * 2 - 1) * Math.exp(-tt * 1.5) * 0.5;
      if (tt < 0.04) d[i] += (Math.random() - 0.5) * 0.4; // early reflections
    }
  }
  verbNode.buffer = impBuf;

  dryBus = ctx.createGain(); dryBus.gain.value = 0.6;
  wetBus = ctx.createGain(); wetBus.gain.value = 0.4;
  dryBus.connect(masterGain);
  verbNode.connect(wetBus);
  wetBus.connect(masterGain);

  // voice pool — each voice has oscillator + filter
  for (var i = 0; i < NUM_VOICES; i++) {
    var osc = ctx.createOscillator();
    osc.type = i < 3 ? 'triangle' : i < 6 ? 'sine' : 'sine';
    osc.frequency.value = 137;

    // each voice gets a filter for brightness control
    var filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 2000;
    filt.Q.value = 1;

    var g = ctx.createGain();
    g.gain.value = 0;

    osc.connect(filt);
    filt.connect(g);
    g.connect(dryBus);
    g.connect(verbNode);
    osc.start();

    voiceOscs.push(osc);
    voiceGains.push(g);
    voiceFilters.push(filt);
  }

  // sub-bass — the weight underneath
  subOsc = ctx.createOscillator();
  subOsc.type = 'sine';
  subOsc.frequency.value = 33;
  subGain = ctx.createGain();
  subGain.gain.value = 0;
  subOsc.connect(subGain);
  subGain.connect(dryBus);
  subOsc.start();

  // noise for tension/uncertainty
  var nBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  var nd = nBuf.getChannelData(0);
  for (var i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  noiseNode = ctx.createBufferSource();
  noiseNode.buffer = nBuf;
  noiseNode.loop = true;
  noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 1000;
  noiseFilter.Q.value = 1;
  noiseGain = ctx.createGain();
  noiseGain.gain.value = 0;
  noiseNode.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(dryBus);
  noiseNode.start();

  started = true;
  animate();
}

function fireTick(freq, vol) {
  var now = ctx.currentTime;
  var o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.value = freq;
  var g = ctx.createGain();
  g.gain.setValueAtTime(vol, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
  o.connect(g);
  g.connect(dryBus);
  o.start(now);
  o.stop(now + 0.03);
}

// ═══ CONTINUOUS ANIMATION — the music breathes even when you don't scroll ═══
function animate() {
  if (!ctx || ctx.state !== 'running') {
    requestAnimationFrame(animate);
    return;
  }

  var now = ctx.currentTime;
  t += 0.016;
  breathPhase += 0.016;

  var p = getParams(scrollPos);
  var mode = MODES[p.mode] || MODES.open;

  // breath — everything pulses slowly
  var breathRate = 0.3 + p.pulse * 0.7;
  var breathAmt = 0.03 + p.warmth * 0.04;
  var breath = 1 + Math.sin(breathPhase * breathRate * Math.PI * 2) * breathAmt;

  // how many voices active
  var numActive = Math.max(1, Math.round(p.density * NUM_VOICES));

  for (var i = 0; i < NUM_VOICES; i++) {
    if (i < numActive) {
      // pick note from scale
      var noteIdx = i % mode.length;
      var freq = semiToFreq(p.root, mode[noteIdx]);

      // slight FM vibrato — alive, not static
      freq *= 1 + Math.sin(t * (1.5 + i * 0.2)) * 0.003;

      // tension: push some voices off-scale
      if (p.tension > 0.2 && i > numActive / 2) {
        freq *= Math.pow(2, p.tension * 0.8 / 12); // sharp by up to a semitone
      }

      var vol = p.bright * 0.08 / (1 + i * 0.25) * breath;

      // warmth: lower voices louder, upper voices softer
      if (i < 3) vol *= (0.7 + p.warmth * 0.5);

      voiceOscs[i].frequency.setTargetAtTime(freq, now, 0.3);
      voiceGains[i].gain.setTargetAtTime(vol, now, 0.15);

      // filter follows brightness
      var cutoff = 400 + p.bright * 4000;
      voiceFilters[i].frequency.setTargetAtTime(cutoff, now, 0.2);
    } else {
      voiceGains[i].gain.setTargetAtTime(0, now, 0.3);
    }
  }

  // sub-bass: grounded when warm, absent when cold
  var subVol = p.warmth * p.density * 0.12 * breath;
  subOsc.frequency.setTargetAtTime(p.root / 2, now, 0.5);
  subGain.gain.setTargetAtTime(subVol, now, 0.2);

  // noise: rises with tension
  noiseGain.gain.setTargetAtTime(p.tension * 0.06, now, 0.3);
  noiseFilter.frequency.setTargetAtTime(600 + p.tension * 3000 + Math.sin(t * 1.2) * 400, now, 0.1);

  // prime ticks — mathematical, throughout, but sparse
  tickTimer += 0.016;
  if (p.density > 0.2 && tickTimer > 1.5 + (1 - p.bright) * 2) {
    tickTimer = 0;
    fireTick(3000 + Math.random() * 3000, 0.03 * p.density);
  }

  // pulse — rhythmic emphasis when pulse > 0
  if (p.pulse > 0.1) {
    var pulseRate = 0.5 + p.pulse * 2; // Hz
    var pulseAmp = Math.abs(Math.sin(t * pulseRate * Math.PI));
    masterGain.gain.setTargetAtTime(
      (0.18 + p.density * 0.06) * (0.85 + pulseAmp * 0.15 * p.pulse),
      now, 0.05
    );
  } else {
    masterGain.gain.setTargetAtTime(0.18 + p.density * 0.06, now, 0.2);
  }

  // reverb wet/dry follows warmth
  wetBus.gain.setTargetAtTime(0.2 + p.warmth * 0.3, now, 0.3);

  requestAnimationFrame(animate);
}

// ═══ SCROLL LISTENER ═══
window.addEventListener('scroll', function() {
  var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  var docHeight = document.documentElement.scrollHeight - window.innerHeight;
  scrollPos = docHeight > 0 ? scrollTop / docHeight : 0;
});

// ═══ BUTTON ═══
var btn = document.createElement('div');
btn.style.cssText = 'position:fixed;bottom:60px;right:20px;z-index:9998;cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent;';
btn.innerHTML = '<span style="font-size:0.65em;color:#c9a44a30;letter-spacing:0.06em;border:1px solid #c9a44a15;padding:6px 14px;border-radius:16px;transition:all 0.3s;font-family:Georgia,serif;">&#9835; hear the page</span>';

btn.onclick = function(e) {
  e.preventDefault();
  if (!started) {
    initAudio();
    btn.firstChild.textContent = '\u266B listening';
    btn.firstChild.style.color = '#c9a44a60';
    btn.firstChild.style.borderColor = '#c9a44a30';
  } else if (ctx.state === 'running') {
    ctx.suspend();
    btn.firstChild.textContent = '\u266B hear the page';
    btn.firstChild.style.color = '#c9a44a30';
    btn.firstChild.style.borderColor = '#c9a44a15';
  } else {
    ctx.resume();
    btn.firstChild.textContent = '\u266B listening';
    btn.firstChild.style.color = '#c9a44a60';
    btn.firstChild.style.borderColor = '#c9a44a30';
  }
};

document.body.appendChild(btn);

})();
