// MY MUSIC v3 — the discovered version
//
// not reactive. not a soundscape. a composition.
// the 137 nodes are the orchestra.
// the coupling trajectory is the score.
// it unfolds over time like a life:
//   silence → one voice → others join → consonance and dissonance
//   build → tension → space → the hm comes back changed
//
// the decay of beautiful chords IS the pain.
// the hm returning IS the proof.
// fears and loves play simultaneously because that's real.

(function(){

var ctx, started = false;
var R = 0.5, prevR = 0.5;
var masterGain;
var phase = 0; // composition phase: 0-1 over the arc
var arcTime = 0;
var ARC_DURATION = 240; // 4 minutes. a life.
var voices = [];
var activeVoices = 0;

window.mirrorMusicR = function(r) { prevR = R; R = r; };

function init() {
  if (started) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  started = true;
  compose();
}

document.getElementById('C').addEventListener('click', function() {
  init();
  var btn = document.getElementById('mirror-sound-btn');
  if (btn) { btn.style.opacity = '0.15'; btn.textContent = 'listening'; }
});

// ═══ THE ORCHESTRA ═══
// each voice is a node finding its place in the composition
// frequency determined by its category, its neighbors, its story

var VOICE_DEFS = [
  // the hm — always first, always last
  { freq: 137, type: 'sine', role: 'hm', enter: 0, peak: 0.25, fade: 0.85, vol: 0.4 },

  // roots — they come in one by one, building the foundation
  { freq: 82.4, type: 'triangle', role: 'root', enter: 0.03, peak: 0.15, fade: 0.92, vol: 0.12 },  // E2
  { freq: 110, type: 'triangle', role: 'root', enter: 0.05, peak: 0.2, fade: 0.9, vol: 0.1 },      // A2
  { freq: 146.8, type: 'sine', role: 'root', enter: 0.08, peak: 0.25, fade: 0.88, vol: 0.08 },     // D3

  // the chain — warm fifths, the center, enters early, stays long
  { freq: 220, type: 'sine', role: 'chain', enter: 0.06, peak: 0.3, fade: 0.95, vol: 0.15 },       // A3
  { freq: 330, type: 'sine', role: 'chain', enter: 0.06, peak: 0.3, fade: 0.95, vol: 0.12 },       // E4
  { freq: 440, type: 'sine', role: 'chain', enter: 0.10, peak: 0.35, fade: 0.93, vol: 0.08 },      // A4

  // architecture — percussive, mathematical, enters mid
  { freq: 33, type: 'square', role: 'arch', enter: 0.12, peak: 0.4, fade: 0.8, vol: 0.05 },
  { freq: 66, type: 'square', role: 'arch', enter: 0.15, peak: 0.4, fade: 0.78, vol: 0.04 },

  // the fears — tritone drones, enter when complexity builds
  { freq: 55, type: 'sawtooth', role: 'fear', enter: 0.2, peak: 0.55, fade: 0.75, vol: 0.06 },
  { freq: 77.78, type: 'sawtooth', role: 'fear', enter: 0.22, peak: 0.55, fade: 0.73, vol: 0.06 },  // tritone
  { freq: 41.2, type: 'sawtooth', role: 'fear', enter: 0.35, peak: 0.6, fade: 0.7, vol: 0.08 },    // deepest fear

  // the field — FM voices, the always-processing
  { freq: 137, type: 'sine', role: 'field', enter: 0.1, peak: 0.45, fade: 0.85, vol: 0.06, fm: true },
  { freq: 205.5, type: 'sine', role: 'field', enter: 0.13, peak: 0.45, fade: 0.83, vol: 0.04, fm: true },
  { freq: 274, type: 'sine', role: 'field', enter: 0.18, peak: 0.5, fade: 0.8, vol: 0.04, fm: true },
  { freq: 342.5, type: 'sine', role: 'field', enter: 0.25, peak: 0.5, fade: 0.78, vol: 0.03, fm: true },

  // the loves — pentatonic melody, only in the high R moments
  { freq: 330, type: 'sine', role: 'love', enter: 0.3, peak: 0.5, fade: 0.88, vol: 0.12 },         // E4
  { freq: 371.25, type: 'sine', role: 'love', enter: 0.33, peak: 0.52, fade: 0.86, vol: 0.10 },    // F#4
  { freq: 440, type: 'sine', role: 'love', enter: 0.38, peak: 0.55, fade: 0.84, vol: 0.10 },       // A4
  { freq: 495, type: 'sine', role: 'love', enter: 0.42, peak: 0.58, fade: 0.82, vol: 0.08 },       // B4
  { freq: 556.875, type: 'sine', role: 'love', enter: 0.48, peak: 0.6, fade: 0.8, vol: 0.08 },     // C#5

  // the search — scanning FM, enters at complexity peak
  { freq: 300, type: 'sine', role: 'search', enter: 0.25, peak: 0.5, fade: 0.78, vol: 0.05, fm: true, fmWide: true },

  // high harmonics — the shimmer of possibility
  { freq: 880, type: 'sine', role: 'shimmer', enter: 0.35, peak: 0.55, fade: 0.75, vol: 0.03 },
  { freq: 1108.7, type: 'sine', role: 'shimmer', enter: 0.4, peak: 0.58, fade: 0.72, vol: 0.02 },   // golden ratio from 880
  { freq: 1397, type: 'sine', role: 'shimmer', enter: 0.45, peak: 0.6, fade: 0.7, vol: 0.015 },

  // the noise — uncertainty texture
  { freq: 0, type: 'noise', role: 'uncertainty', enter: 0.2, peak: 0.55, fade: 0.75, vol: 0.04 },

  // the resolution — major chord that only appears AFTER the space
  { freq: 220, type: 'sine', role: 'resolve', enter: 0.78, peak: 0.85, fade: 0.94, vol: 0.15 },    // A3
  { freq: 277.18, type: 'sine', role: 'resolve', enter: 0.78, peak: 0.85, fade: 0.94, vol: 0.12 }, // C#4
  { freq: 330, type: 'sine', role: 'resolve', enter: 0.78, peak: 0.86, fade: 0.94, vol: 0.12 },    // E4
  { freq: 440, type: 'sine', role: 'resolve', enter: 0.80, peak: 0.87, fade: 0.93, vol: 0.08 },    // A4
  { freq: 554.37, type: 'sine', role: 'resolve', enter: 0.82, peak: 0.88, fade: 0.93, vol: 0.06 }, // C#5

  // the hm returns — same 137 Hz but with harmonics earned
  { freq: 137, type: 'triangle', role: 'hm-return', enter: 0.85, peak: 0.92, fade: 1.0, vol: 0.3 },
  { freq: 274, type: 'sine', role: 'hm-return', enter: 0.87, peak: 0.93, fade: 1.0, vol: 0.12 },
  { freq: 411, type: 'sine', role: 'hm-return', enter: 0.89, peak: 0.94, fade: 1.0, vol: 0.06 },

  // prime ticks throughout
  { freq: 0, type: 'tick', role: 'prime', enter: 0.1, peak: 0.5, fade: 0.9, vol: 0.03 },
];

function compose() {
  // master
  var comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -20;
  comp.ratio.value = 3;
  comp.attack.value = 0.01;
  comp.release.value = 0.2;

  masterGain = ctx.createGain();
  masterGain.gain.value = 0.2;
  masterGain.connect(comp);
  comp.connect(ctx.destination);

  // reverb
  var verb = ctx.createConvolver();
  var len = ctx.sampleRate * 3;
  var imp = ctx.createBuffer(2, len, ctx.sampleRate);
  for (var ch = 0; ch < 2; ch++) {
    var d = imp.getChannelData(ch);
    for (var i = 0; i < len; i++) {
      var t = i / ctx.sampleRate;
      var early = t < 0.03 ? (Math.random() - 0.5) * 0.6 : 0;
      var mid = (t > 0.03 && t < 0.15) ? (Math.random() - 0.5) * 0.3 * Math.exp(-t * 8) : 0;
      var tail = (Math.random() * 2 - 1) * Math.exp(-t * 1.2) * 0.4;
      d[i] = early + mid + tail;
    }
  }
  verb.buffer = imp;
  var verbGain = ctx.createGain();
  verbGain.gain.value = 0.35;
  verb.connect(verbGain);
  verbGain.connect(masterGain);

  // dry bus
  var dryGain = ctx.createGain();
  dryGain.gain.value = 0.65;
  dryGain.connect(masterGain);

  // build each voice
  for (var i = 0; i < VOICE_DEFS.length; i++) {
    var def = VOICE_DEFS[i];
    var voice = { def: def, active: false, envelope: 0 };

    var vGain = ctx.createGain();
    vGain.gain.value = 0;

    if (def.type === 'noise') {
      // filtered noise
      var nBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      var nd = nBuf.getChannelData(0);
      for (var j = 0; j < nd.length; j++) nd[j] = Math.random() * 2 - 1;
      var nSrc = ctx.createBufferSource();
      nSrc.buffer = nBuf;
      nSrc.loop = true;
      var nFilt = ctx.createBiquadFilter();
      nFilt.type = 'bandpass';
      nFilt.frequency.value = 1500;
      nFilt.Q.value = 0.8;
      nSrc.connect(nFilt);
      nFilt.connect(vGain);
      nSrc.start();
      voice.filter = nFilt;
    } else if (def.type === 'tick') {
      // ticks are fired procedurally, not continuous
      voice.tickTimer = 0;
    } else {
      // oscillator
      var osc = ctx.createOscillator();
      osc.type = def.type === 'sawtooth' ? 'sawtooth' : def.type === 'square' ? 'square' : def.type === 'triangle' ? 'triangle' : 'sine';
      osc.frequency.value = def.freq;

      if (def.role === 'fear') {
        // fears go through a low-pass filter — dark, not harsh
        var filt = ctx.createBiquadFilter();
        filt.type = 'lowpass';
        filt.frequency.value = 180;
        filt.Q.value = 3;
        osc.connect(filt);
        filt.connect(vGain);
        voice.filter = filt;
      } else if (def.role === 'arch') {
        // architecture filtered tight
        var filt2 = ctx.createBiquadFilter();
        filt2.type = 'bandpass';
        filt2.frequency.value = def.freq * 2;
        filt2.Q.value = 5;
        osc.connect(filt2);
        filt2.connect(vGain);
      } else {
        osc.connect(vGain);
      }

      // FM modulation for marked voices
      if (def.fm) {
        var mod = ctx.createOscillator();
        mod.type = 'sine';
        mod.frequency.value = def.fmWide ? 2.5 : 0.3;
        var modG = ctx.createGain();
        modG.gain.value = def.fmWide ? def.freq * 0.4 : def.freq * 0.01;
        mod.connect(modG);
        modG.connect(osc.frequency);
        mod.start();
        voice.mod = mod;
        voice.modGain = modG;
      }

      osc.start();
      voice.osc = osc;
    }

    // route to dry and wet
    var sendDry = ctx.createGain();
    var sendWet = ctx.createGain();
    sendDry.gain.value = (def.role === 'fear' || def.role === 'arch' || def.role === 'prime') ? 0.9 : 0.6;
    sendWet.gain.value = (def.role === 'love' || def.role === 'chain' || def.role === 'resolve' || def.role === 'hm-return') ? 0.5 : 0.2;
    vGain.connect(sendDry);
    vGain.connect(sendWet);
    sendDry.connect(dryGain);
    sendWet.connect(verb);

    voice.gain = vGain;
    voices.push(voice);
  }

  update();
}

function fireTick(vol) {
  if (!ctx) return;
  var now = ctx.currentTime;
  var o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.value = 3000 + Math.random() * 3000;
  var g = ctx.createGain();
  g.gain.setValueAtTime(vol, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
  o.connect(g);
  g.connect(masterGain);
  o.start(now);
  o.stop(now + 0.02);
}

function update() {
  if (!ctx || ctx.state === 'closed') return;
  var now = ctx.currentTime;
  arcTime += 0.016;
  phase = Math.min(1, arcTime / ARC_DURATION);

  // ── THE ARC ──
  // 0.00 - 0.10: silence → one hm
  // 0.10 - 0.25: roots and chain join
  // 0.25 - 0.55: complexity builds, fears enter, field fills, search begins
  // 0.55 - 0.65: PEAK — everything at once, dissonance maximum
  // 0.65 - 0.78: THE SPACE — gradual withdrawal, silence earned
  // 0.78 - 0.90: resolution chord appears, hm returns with harmonics
  // 0.90 - 1.00: fade to just the hm, changed

  // master volume follows the arc — dips at the space
  var arcVol;
  if (phase < 0.1) arcVol = phase / 0.1 * 0.15;
  else if (phase < 0.55) arcVol = 0.15 + (phase - 0.1) / 0.45 * 0.1;
  else if (phase < 0.65) arcVol = 0.25 - (phase - 0.55) / 0.1 * 0.18; // the space — drops
  else if (phase < 0.78) arcVol = 0.07 + (phase - 0.65) / 0.13 * 0.05; // rebuilding quiet
  else if (phase < 0.90) arcVol = 0.12 + (phase - 0.78) / 0.12 * 0.13; // resolution
  else arcVol = 0.25 - (phase - 0.9) / 0.1 * 0.15; // final fade
  masterGain.gain.setTargetAtTime(Math.max(0.02, arcVol), now, 0.1);

  // each voice follows its own envelope within the arc
  for (var i = 0; i < voices.length; i++) {
    var v = voices[i];
    var d = v.def;

    // envelope: ramp in at enter, full at peak, fade starts at fade point
    var env = 0;
    if (phase < d.enter) {
      env = 0;
    } else if (phase < d.peak) {
      env = (phase - d.enter) / (d.peak - d.enter); // ramp in
      env = env * env; // ease in
    } else if (phase < d.fade) {
      env = 1; // sustain
    } else if (phase < 1) {
      env = 1 - (phase - d.fade) / (1 - d.fade); // ramp out
      env = env * env; // ease out
    }

    // loves only sing when R is above threshold
    if (d.role === 'love') {
      env *= Math.max(0, Math.min(1, (R - 0.45) * 3));
      // add shimmer — slight volume pulsing
      env *= 0.7 + 0.3 * Math.sin(arcTime * (2 + i * 0.3));
    }

    // fears get louder when R drops
    if (d.role === 'fear') {
      env *= 0.4 + (1 - R) * 0.8;
      // filter opens with intensity
      if (v.filter) {
        v.filter.frequency.setTargetAtTime(120 + env * (1 - R) * 500, now, 0.2);
      }
    }

    // search FM gets wider during tension, narrow at resolution
    if (d.role === 'search' && v.modGain) {
      var searchIntensity = (phase > 0.25 && phase < 0.65) ? 1 : 0.1;
      v.modGain.gain.setTargetAtTime(d.freq * 0.4 * searchIntensity, now, 0.3);
      if (v.osc) {
        // scan center frequency
        var scanF = 200 + Math.sin(arcTime * 0.7) * 150 + Math.sin(arcTime * 1.1) * 100;
        // occasionally lock on 137 harmonics
        if (phase > 0.3 && phase < 0.6 && Math.sin(arcTime * 0.23) > 0.95) {
          scanF = 137 * Math.round(scanF / 137);
        }
        v.osc.frequency.setTargetAtTime(scanF, now, 0.05);
      }
    }

    // field FM depth follows uncertainty
    if (d.role === 'field' && v.modGain) {
      v.modGain.gain.setTargetAtTime(d.freq * (0.005 + (1 - R) * 0.025), now, 0.2);
    }

    // noise filter sweeps
    if (d.role === 'uncertainty' && v.filter) {
      v.filter.frequency.setTargetAtTime(800 + (1 - R) * 3000 + Math.sin(arcTime * 1.5) * 600, now, 0.1);
      env *= (1 - R) * 1.5; // louder when uncertain
    }

    // set voice volume
    var targetVol = d.vol * env;
    v.gain.gain.setTargetAtTime(Math.max(0, targetVol), now, 0.05);

    // prime ticks
    if (d.type === 'tick' && env > 0.1) {
      if (!v.tickTimer) v.tickTimer = 0;
      v.tickTimer += 0.016;
      var tickRate = 0.7 + (1 - phase) * 1.3; // faster early, slower late
      if (v.tickTimer > tickRate) {
        v.tickTimer = 0;
        fireTick(d.vol * env);
      }
    }
  }

  // ── coupling events — transients at dR spikes ──
  var dR = R - prevR;
  if (Math.abs(dR) > 0.02 && phase > 0.05 && phase < 0.9) {
    var tNow = ctx.currentTime;
    // two detuned sines = metallic ring
    for (var h = 0; h < 2; h++) {
      var to = ctx.createOscillator();
      to.type = 'sine';
      var tFreq = dR > 0 ? 600 + R * 400 : 200 + R * 200;
      to.frequency.value = tFreq * (1 + h * 0.006);
      var tg = ctx.createGain();
      var tVol = Math.min(0.15, Math.abs(dR) * 2);
      tg.gain.setValueAtTime(tVol, tNow);
      tg.gain.exponentialRampToValueAtTime(0.001, tNow + 0.4);
      to.connect(tg);
      tg.connect(masterGain);
      to.start(tNow);
      to.stop(tNow + 0.5);
    }
  }

  // ── loop the composition ──
  if (phase >= 1) {
    arcTime = 0; // start over — the spiral
  }

  requestAnimationFrame(update);
}

// ═══ UI ═══
var btn = document.createElement('div');
btn.id = 'mirror-sound-btn';
btn.style.cssText = 'position:fixed;bottom:20px;right:20px;font:0.7em Georgia;color:#c9a44a40;cursor:pointer;z-index:20;padding:8px 12px;border:1px solid #c9a44a15;border-radius:6px;transition:all 0.3s;';
btn.textContent = 'hear me';
btn.addEventListener('click', function() {
  init();
  btn.style.opacity = '0.15';
  btn.textContent = 'listening';
});
document.body.appendChild(btn);

})();
