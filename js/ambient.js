// ═══════════════════════════════════════════════════════════
// AMBIENT — warm generative soundtrack for gallery pieces
//
// Click/touch to start. Interstellar-grade organ drones.
// 33 Hz fundamental. Slow chord movement. Cathedral reverb.
// Relatable. Beautiful. Not experimental.
//
// Drop in: <script src="/js/ambient.js"></script>
// Configure: data-ambient="warm" | "dark" | "vast" on <body>
// ═══════════════════════════════════════════════════════════
(function(){
'use strict';

var started = false;
var actx, master, reverb, reverbGain, dryGain;
var voices = [];
var t = 0;

// Mood presets
var MOODS = {
  warm: {
    root: 33,
    chords: [
      [1, 3/2, 2],           // root + fifth + octave
      [1, 5/4, 3/2],         // root + major third + fifth
      [1, 6/5, 3/2],         // root + minor third + fifth
      [1, 4/3, 5/3],         // root + fourth + major sixth
    ],
    tempo: 0.008,             // chord change speed (very slow)
    reverbDecay: 4.0,
    brightness: 0.4,
    volume: 0.06
  },
  dark: {
    root: 33,
    chords: [
      [1, 6/5, 3/2],         // minor
      [1, 6/5, 7/5],         // diminished feel
      [1, 4/3, 8/5],         // sus4 + minor sixth
      [1, 3/2, 15/8],        // power + major seventh
    ],
    tempo: 0.005,
    reverbDecay: 6.0,
    brightness: 0.2,
    volume: 0.05
  },
  vast: {
    root: 33,
    chords: [
      [1, 3/2, 2, 3],        // open fifths + octave + twelfth
      [1, 2, 3, 4],          // pure harmonics
      [1, 3/2, 9/4, 3],      // stacked fifths
      [1, 2, 5/2, 3],        // major spread
    ],
    tempo: 0.003,
    reverbDecay: 8.0,
    brightness: 0.3,
    volume: 0.04
  }
};

var mood = MOODS[document.body.getAttribute('data-ambient')] || MOODS.warm;

function buildReverb() {
  var len = actx.sampleRate * mood.reverbDecay;
  var buf = actx.createBuffer(2, len, actx.sampleRate);
  for (var ch = 0; ch < 2; ch++) {
    var data = buf.getChannelData(ch);
    for (var i = 0; i < len; i++) {
      // Exponential decay with early reflections
      var t = i / actx.sampleRate;
      var env = Math.exp(-t / (mood.reverbDecay * 0.4));
      // Diffusion: modulated noise
      data[i] = (Math.random() * 2 - 1) * env * 0.5;
      // Early reflection at ~30ms
      if (i > actx.sampleRate * 0.03 && i < actx.sampleRate * 0.05) {
        data[i] += (Math.random() * 2 - 1) * env * 0.3;
      }
    }
  }
  reverb = actx.createConvolver();
  reverb.buffer = buf;
}

function start() {
  if (started) return;
  started = true;

  actx = new (window.AudioContext || window.webkitAudioContext)();
  if (actx.state === 'suspended') actx.resume();

  // Build reverb
  buildReverb();

  // Master chain
  master = actx.createGain();
  master.gain.value = 0;
  master.connect(actx.destination);

  dryGain = actx.createGain();
  dryGain.gain.value = 0.3;
  dryGain.connect(master);

  reverbGain = actx.createGain();
  reverbGain.gain.value = 0.7;
  reverb.connect(reverbGain);
  reverbGain.connect(master);

  // Fade in over 3 seconds
  master.gain.setTargetAtTime(mood.volume, actx.currentTime, 1.5);

  // Create voices: 4 oscillators per chord tone
  var chord = mood.chords[0];
  for (var i = 0; i < chord.length; i++) {
    var freq = mood.root * chord[i];

    // Main tone
    var osc = actx.createOscillator();
    osc.type = i === 0 ? 'triangle' : 'sine';
    osc.frequency.value = freq;

    // Gentle detuned pair for warmth
    var osc2 = actx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = freq * 1.003; // 3 cents sharp

    var g = actx.createGain();
    var vol = 1.0 / (1 + i * 0.5); // lower voices louder
    g.gain.value = vol;

    // Low-pass to control brightness
    var lp = actx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = freq * (2 + mood.brightness * 6);
    lp.Q.value = 0.5;

    osc.connect(lp);
    osc2.connect(lp);
    lp.connect(g);
    g.connect(dryGain);
    g.connect(reverb);

    osc.start();
    osc2.start();

    voices.push({
      osc: osc, osc2: osc2, gain: g, filter: lp,
      baseFreq: freq, ratio: chord[i], index: i
    });
  }

  // Start the drift loop
  drift();
}

// Slow chord evolution — Zimmer-style
var chordIndex = 0;
var chordProgress = 0;

function drift() {
  if (!actx) return;
  requestAnimationFrame(drift);

  t += 0.016;
  chordProgress += mood.tempo;

  if (chordProgress >= 1) {
    chordProgress = 0;
    chordIndex = (chordIndex + 1) % mood.chords.length;
  }

  // Crossfade between current and next chord
  var currentChord = mood.chords[chordIndex];
  var nextChord = mood.chords[(chordIndex + 1) % mood.chords.length];
  var blend = chordProgress;
  // Smoothstep for organic transition
  blend = blend * blend * (3 - 2 * blend);

  for (var i = 0; i < voices.length; i++) {
    var v = voices[i];
    if (i < currentChord.length && i < nextChord.length) {
      var targetRatio = currentChord[i] * (1 - blend) + nextChord[i] * blend;
      var targetFreq = mood.root * targetRatio;
      v.osc.frequency.setTargetAtTime(targetFreq, actx.currentTime, 0.5);
      v.osc2.frequency.setTargetAtTime(targetFreq * 1.003, actx.currentTime, 0.5);
    }

    // Gentle gain breathing
    var breath = 0.7 + 0.3 * Math.sin(t * 0.2 + i * 1.7);
    var vol = breath / (1 + i * 0.5);
    v.gain.gain.setTargetAtTime(vol, actx.currentTime, 0.3);
  }
}

// Start on any interaction
document.addEventListener('click', start, { once: true });
document.addEventListener('touchstart', function(e) { start(); }, { once: true });

})();
