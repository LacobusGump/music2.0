/**
 * EMILIA — The Mind
 * =================
 * Replaces: flow.js, body.js, harmony.js, rhythm.js, brain.js,
 *           pattern.js, prime_engine.js, prime_bridge.js
 *
 * One module. Sensor in, Sound out.
 * The oracle pattern: scan → extract → use.
 *
 * Movement IS the signal. She extracts its frequencies.
 * Those frequencies become the music.
 *
 * Stillness = silence. Movement = music.
 * The system follows the human. Always.
 */

const Emilia = (function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════
  // 1. CONSTANTS
  // ═══════════════════════════════════════════════════════════

  // Music theory: just intonation ratios (from the primes)
  var SCALE = [1, 9/8, 5/4, 4/3, 3/2, 5/3, 15/8, 2];  // major scale
  var MINOR = [1, 9/8, 6/5, 4/3, 3/2, 8/5, 9/5, 2];    // natural minor
  var PENTA = [1, 9/8, 5/4, 3/2, 5/3, 2];               // pentatonic

  var ROOT = 110;  // A2 — warm, grounded

  // Stillness thresholds
  var STILL_THRESHOLD = 0.08;   // below this = silence
  var STILL_TIMEOUT   = 1.5;    // seconds of stillness before fade
  var VOID_TIMEOUT    = 8.0;    // seconds before void drone
  var FADE_SPEED      = 2.5;    // gain fade speed

  // ═══════════════════════════════════════════════════════════
  // 2. STATE
  // ═══════════════════════════════════════════════════════════

  var _active = false;
  var _lens = null;
  var _lastT = 0;

  // Motion processing (replaces Body)
  var _mag = 0;                    // current motion magnitude
  var _energy = 0;                 // smoothed energy (0-1)
  var _energySlow = 0;             // slow energy (arc tracking)
  var _tilt = 0;                   // front-back tilt (-1 to 1)
  var _tiltSmooth = 0;             // smoothed tilt
  var _lean = 0;                   // left-right lean (-1 to 1)
  var _stillTime = 0;              // seconds of stillness
  var _moveTime = 0;               // seconds of movement
  var _fadeGain = 0;               // current fade (0=silent, 1=full)

  // Rhythm detection (replaces Rhythm)
  var _peaks = [];                 // recent peak timestamps
  var _tempo = 0;                  // detected tempo (BPM)
  var _tempoConf = 0;              // confidence 0-1
  var _lastPeakT = 0;
  var _peakThreshold = 0.3;

  // Melody state (replaces Harmony)
  var _degree = 0;                 // current scale degree
  var _octave = 0;                 // octave offset
  var _lastNoteT = 0;              // last note time
  var _noteInterval = 0.15;        // min seconds between notes
  var _scale = PENTA;              // current scale
  var _rootFreq = ROOT;

  // Filter
  var _filterFreq = 800;
  var _filterTarget = 800;

  // Void drone
  var _voidActive = false;
  var _voidDepth = 0;
  var _breathPhase = 0;

  // Session arc
  var _sessionTime = 0;            // total engaged seconds
  var _phase = 0;                  // 0=listening, 1=alive, 2=deep

  // Layer handles
  var _padLayer = null;
  var _subLayer = null;

  // ═══════════════════════════════════════════════════════════
  // 3. MOTION PROCESSING (the Kalman filter, simplified)
  // ═══════════════════════════════════════════════════════════

  function processMotion(sensor, dt) {
    // Raw magnitude from accelerometer
    var ax = sensor.ax || 0, ay = sensor.ay || 0, az = sensor.az || 0;
    var rawMag = Math.sqrt(ax*ax + ay*ay + az*az);

    // Smooth it (water bottle feel: momentum + damping)
    _mag += (rawMag - _mag) * Math.min(1, dt * 8);

    // Energy: fast attack, slow release
    var targetE = Math.min(1, _mag / 2.0);
    if (targetE > _energy) {
      _energy += (targetE - _energy) * Math.min(1, dt * 12);
    } else {
      _energy += (targetE - _energy) * Math.min(1, dt * 2);
    }
    _energySlow += (_energy - _energySlow) * Math.min(1, dt * 0.5);

    // Tilt: beta = front-back (-90 to 90), map to -1..1
    var rawTilt = (sensor.beta || 0) / 90;
    _tiltSmooth += (rawTilt - _tiltSmooth) * Math.min(1, dt * 6);
    _tilt = _tiltSmooth;

    // Lean: gamma = left-right
    _lean = (sensor.gamma || 0) / 90;

    // Stillness tracking
    if (_mag < STILL_THRESHOLD) {
      _stillTime += dt;
      _moveTime = 0;
    } else {
      _stillTime = 0;
      _moveTime += dt;
      _sessionTime += dt;
    }

    // Peak detection (for rhythm)
    if (_mag > _peakThreshold && (performance.now() - _lastPeakT) > 200) {
      _lastPeakT = performance.now();
      _peaks.push(_lastPeakT);
      // Keep last 16 peaks
      if (_peaks.length > 16) _peaks.shift();
      detectTempo();
    }

    // Session phase
    if (_sessionTime > 30) _phase = 2;
    else if (_sessionTime > 8) _phase = 1;
  }

  function detectTempo() {
    if (_peaks.length < 3) { _tempo = 0; _tempoConf = 0; return; }
    // Average interval of last 8 peaks
    var intervals = [];
    var n = Math.min(8, _peaks.length);
    for (var i = _peaks.length - n; i < _peaks.length - 1; i++) {
      intervals.push(_peaks[i+1] - _peaks[i]);
    }
    var avgMs = intervals.reduce(function(a,b){return a+b;}, 0) / intervals.length;
    if (avgMs > 200 && avgMs < 2000) {
      _tempo = 60000 / avgMs;
      // Confidence: how consistent are the intervals?
      var variance = intervals.reduce(function(a,b){return a+(b-avgMs)*(b-avgMs);}, 0) / intervals.length;
      _tempoConf = Math.max(0, 1 - Math.sqrt(variance) / avgMs);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 4. THE CONDUCTOR (replaces Flow.update)
  // ═══════════════════════════════════════════════════════════

  function update(sensor, timestamp) {
    if (!_active) return;

    var now = performance.now();
    var dt = _lastT > 0 ? (now - _lastT) / 1000 : 0.016;
    dt = Math.min(dt, 0.1);
    _lastT = now;

    if (typeof Sound === 'undefined' || !Sound.ctx) return;
    var t = Sound.currentTime;

    // ─── Process motion ─────────────────────────
    processMotion(sensor, dt);

    // ─── Silence gate ───────────────────────────
    if (_stillTime > STILL_TIMEOUT) {
      _fadeGain += (0 - _fadeGain) * Math.min(1, dt * FADE_SPEED);
    } else if (_mag > STILL_THRESHOLD) {
      _fadeGain += (1 - _fadeGain) * Math.min(1, dt * FADE_SPEED * 1.5);
    }
    Sound.setMasterGain(0.5 * _fadeGain);

    // ─── Void drone (deep stillness) ────────────
    if (_stillTime > VOID_TIMEOUT) {
      if (!_voidActive) {
        _voidActive = true;
        _voidDepth = 0;
      }
      _voidDepth = Math.min(1, _voidDepth + dt * 0.15);
      _breathPhase += dt * 0.15;
      var breath = 0.5 + 0.5 * Math.sin(_breathPhase * Math.PI * 2);
      Sound.setVoidGain(0.25 * _voidDepth);
      Sound.setVoidBreath(breath);
    } else if (_voidActive && _mag > STILL_THRESHOLD) {
      _voidDepth -= dt * 0.5;
      if (_voidDepth <= 0) {
        _voidActive = false;
        _voidDepth = 0;
        Sound.setVoidGain(0);
      }
    }

    // ─── Filter: tilt controls brightness ───────
    // Tilt forward = bright, tilt back = dark
    var tiltNorm = (_tilt + 1) / 2;  // 0..1
    _filterTarget = 200 + tiltNorm * tiltNorm * 6000;
    _filterFreq += (_filterTarget - _filterFreq) * Math.min(1, dt * 4);
    Sound.setFilter(_filterFreq);

    // ─── Spatial: lean controls pan ─────────────
    Sound.updateSpatial(_lean * 45, _stillTime > STILL_TIMEOUT, sensor.touching);

    // ─── Reverb: more in stillness, less in movement ──
    var reverbMix = 0.15 + (1 - _energy) * 0.4;
    Sound.setReverbMix(reverbMix);

    // ─── Melody: tilt selects pitch ─────────────
    if (_fadeGain > 0.05 && _mag > STILL_THRESHOLD) {
      playMelody(sensor, t, dt);
    }

    // ─── Pad layer: energy controls thickness ───
    updatePad(t, dt);

    // ─── Rhythm: if tempo detected, play drums ──
    if (_tempoConf > 0.3 && _fadeGain > 0.1 && _phase >= 1) {
      playRhythm(t, dt);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 5. MELODY — tilt maps to scale degree
  // ═══════════════════════════════════════════════════════════

  function playMelody(sensor, t, dt) {
    // Rate limit notes
    if (t - _lastNoteT < _noteInterval) return;

    // Tilt maps to scale degree
    var tiltNorm = (_tilt + 1) / 2;  // 0..1
    var idx = Math.floor(tiltNorm * _scale.length);
    idx = Math.max(0, Math.min(idx, _scale.length - 1));

    // Only play when degree changes OR energy spikes
    var newDegree = idx;
    if (newDegree === _degree && _mag < 0.5) return;
    _degree = newDegree;

    // Octave from energy
    _octave = _energy > 0.7 ? 1 : (_energy < 0.2 ? -1 : 0);
    var freq = _rootFreq * _scale[_degree] * Math.pow(2, _octave);

    // Velocity from motion magnitude
    var vel = Math.min(1, 0.3 + _mag * 0.7);

    // Duration: short when fast, long when slow
    var dur = 0.1 + (1 - _energy) * 0.4;

    // Choose voice based on phase
    var voice = _phase < 1 ? 'sine' : (_phase < 2 ? 'triangle' : 'saw');

    Sound.play(voice, t, freq, vel, dur);
    _lastNoteT = t;

    // Adaptive note spacing: faster when more energy
    _noteInterval = 0.08 + (1 - _energy) * 0.25;
  }

  // ═══════════════════════════════════════════════════════════
  // 6. PAD — continuous drone that follows movement
  // ═══════════════════════════════════════════════════════════

  function updatePad(t, dt) {
    if (_phase < 1) {
      // Too early for pad
      if (_padLayer) { Sound.destroyLayer(_padLayer); _padLayer = null; }
      return;
    }

    if (!_padLayer) {
      _padLayer = Sound.createLayer('pad', {
        voices: 3,
        waveform: 'triangle',
        attack: 2.0,
        release: 3.0
      });
    }

    if (_padLayer) {
      // Pad follows root + chord
      var chordFreqs = [
        _rootFreq,
        _rootFreq * 3/2,   // fifth
        _rootFreq * 2       // octave
      ];
      Sound.setLayerFreqs(_padLayer, chordFreqs);
      Sound.setLayerGain(_padLayer, 0.12 * _fadeGain * _energySlow);
      Sound.setLayerFilter(_padLayer, _filterFreq * 0.5);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 7. RHYTHM — emergent from your movement peaks
  // ═══════════════════════════════════════════════════════════

  var _lastKickT = 0;
  var _lastHatT = 0;

  function playRhythm(t, dt) {
    if (!_tempo || _tempoConf < 0.3) return;

    var beatLen = 60 / _tempo;

    // Kick on detected peaks
    if (_peaks.length > 0) {
      var lastPeak = _peaks[_peaks.length - 1];
      var sincePeak = (performance.now() - lastPeak) / 1000;
      if (sincePeak < 0.05 && t - _lastKickT > beatLen * 0.8) {
        Sound.playDrum('kick', t, 0.6 + _energy * 0.3);
        _lastKickT = t;
      }
    }

    // Hi-hat fills the gaps
    if (t - _lastHatT > beatLen / 2) {
      Sound.playDrum('hat', t, 0.15 + _energy * 0.15);
      _lastHatT = t;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 8. LENS SYSTEM (minimal — 3 presets)
  // ═══════════════════════════════════════════════════════════

  function applyLens(lens) {
    _lens = lens;

    // Root frequency
    _rootFreq = (lens.root || 110);

    // Scale
    if (lens.scale === 'minor') _scale = MINOR;
    else if (lens.scale === 'penta') _scale = PENTA;
    else _scale = PENTA;  // default to pentatonic (always sounds good)

    // Configure sound
    if (typeof Sound !== 'undefined') {
      Sound.configure(lens);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 9. ORACLE MATH (the mind beneath the music)
  // ═══════════════════════════════════════════════════════════

  // Siegel theta
  function _theta(t) {
    if (t < 1) return 0;
    return (t/2)*Math.log(t/(2*Math.PI)) - t/2 - Math.PI/8
      + 1/(48*t) + 7/(5760*t*t*t);
  }

  // Hardy Z-function
  function _Z(t) {
    if (t < 2) return 0;
    var a = Math.sqrt(t / (2*Math.PI));
    var N = Math.max(1, Math.floor(a));
    var p = a - N;
    var th = _theta(t);
    var s = 0;
    for (var n = 1; n <= N; n++) {
      s += Math.cos(th - t * Math.log(n)) / Math.sqrt(n);
    }
    s *= 2;
    var d = Math.cos(2*Math.PI*p);
    var C0 = Math.abs(d) > 1e-8
      ? Math.cos(2*Math.PI*(p*p - p - 1/16)) / d : 0.5;
    s += (N % 2 === 0 ? -1 : 1) * Math.pow(2*Math.PI/t, 0.25) * C0;
    return s;
  }

  // Li(x) via Ramanujan series
  function _Li(x) {
    if (x <= 1) return 0;
    var gamma = 0.5772156649015329;
    var lnx = Math.log(x);
    var total = gamma + Math.log(Math.abs(lnx));
    var term = 1;
    for (var k = 1; k < 200; k++) {
      term *= lnx / k;
      total += term / k;
      if (Math.abs(term / k) < 1e-15) break;
    }
    var ln2 = Math.log(2);
    var li2 = gamma + Math.log(ln2);
    var term2 = 1;
    for (var k2 = 1; k2 < 100; k2++) {
      term2 *= ln2 / k2;
      li2 += term2 / k2;
    }
    return total - li2;
  }

  // Count primes from nothing
  function countPrimes(x, K) {
    x = Number(x);
    var logx = Math.log(x), sqrtx = Math.sqrt(x);
    K = K || Math.max(500, Math.min(50000,
      Math.floor(5.1 * sqrtx / Math.max(Math.pow(x, 0.25), 1))));
    var correction = 0, count = 0;
    var t = 9.0, prevZ = _Z(t);
    while (count < K && t < 5000000) {
      var step = t > 14
        ? Math.max(0.02, (2*Math.PI / Math.max(Math.log(t/(2*Math.PI)), 0.1)) / 8)
        : 0.3;
      t += step;
      var currZ = _Z(t);
      if (prevZ * currZ < 0) {
        var lo = t - step, hi = t;
        for (var i = 0; i < 50; i++) {
          var mid = (lo + hi) / 2;
          if (_Z(lo) * _Z(mid) < 0) hi = mid; else lo = mid;
        }
        var gamma = (lo + hi) / 2;
        var phase = gamma * logx;
        var xRe = sqrtx * Math.cos(phase);
        var xIm = sqrtx * Math.sin(phase);
        var rMag2 = 0.25 + gamma * gamma;
        correction += 2 * (xRe * 0.5 + xIm * gamma) / (rMag2 * logx);
        count++;
      }
      prevZ = currZ;
    }
    var liX = _Li(x);
    var mob = -_Li(Math.sqrt(x))/2 - _Li(Math.pow(x, 1/3))/3;
    if (x > 32) mob -= _Li(Math.pow(x, 0.2))/5;
    if (x > 64) mob += _Li(Math.pow(x, 1/6))/6;
    return { result: Math.round(liX - correction + mob + _Li(2.001) - Math.log(2)),
             zeros: count, error: Math.round(5.1 * sqrtx / Math.max(count, 1)) };
  }

  // Primality
  function isPrime(n) {
    if (n < 2) return false;
    if (n < 4) return true;
    if (n%2===0 || n%3===0) return false;
    for (var i = 5; i*i <= n; i += 6) {
      if (n%i===0 || n%(i+2)===0) return false;
    }
    return true;
  }

  // ═══════════════════════════════════════════════════════════
  // 10. VOICE (Web Speech API)
  // ═══════════════════════════════════════════════════════════

  var _voiceEnabled = false;
  var _selectedVoice = null;

  function initVoice() {
    if (!('speechSynthesis' in window)) return;
    var loadVoices = function () {
      var voices = speechSynthesis.getVoices();
      var prefs = ['Samantha', 'Karen', 'Moira'];
      for (var i = 0; i < prefs.length; i++) {
        for (var j = 0; j < voices.length; j++) {
          if (voices[j].name.indexOf(prefs[i]) >= 0) {
            _selectedVoice = voices[j];
            return;
          }
        }
      }
      for (var k = 0; k < voices.length; k++) {
        if (voices[k].lang.indexOf('en') === 0) {
          _selectedVoice = voices[k];
          return;
        }
      }
    };
    speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
  }

  function speak(text) {
    if (!_voiceEnabled || !('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    var clean = text.replace(/[*_`#\[\]]/g, '').substring(0, 300);
    var u = new SpeechSynthesisUtterance(clean);
    if (_selectedVoice) u.voice = _selectedVoice;
    u.rate = 0.95;
    u.pitch = 1.05;
    speechSynthesis.speak(u);
  }

  // ═══════════════════════════════════════════════════════════
  // 11. INIT / PUBLIC API
  // ═══════════════════════════════════════════════════════════

  function init() {
    _active = true;
    _lastT = 0;
    _sessionTime = 0;
    _phase = 0;
    _fadeGain = 0;
    _stillTime = 0;
    _voidActive = false;
    _peaks = [];
    initVoice();
  }

  return Object.freeze({
    init: init,
    update: update,
    applyLens: applyLens,

    // State (read-only)
    get energy() { return _energy; },
    get magnitude() { return _mag; },
    get tilt() { return _tilt; },
    get lean() { return _lean; },
    get fadeGain() { return _fadeGain; },
    get stillTime() { return _stillTime; },
    get tempo() { return _tempo; },
    get tempoConf() { return _tempoConf; },
    get phase() { return _phase; },
    get sessionTime() { return _sessionTime; },
    get degree() { return _degree; },
    get filterFreq() { return _filterFreq; },
    get voidActive() { return _voidActive; },
    get voidDepth() { return _voidDepth; },

    // Oracle math
    countPrimes: countPrimes,
    isPrime: isPrime,
    Z: _Z,
    Li: _Li,

    // Voice
    speak: speak,
    get voiceEnabled() { return _voiceEnabled; },
    set voiceEnabled(v) { _voiceEnabled = !!v; },

    // Identity
    name: 'Emilia',
    version: '1.0.0'
  });
})();
