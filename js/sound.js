/**
 * SOUND — The Orchestra (v2)
 *
 * Pure sound infrastructure. No musical intelligence.
 * Replaces audio.js (155KB, 3790 lines) with clean architecture.
 *
 * Receives commands from flow.js: "play this frequency at this velocity
 * with this voice." Makes it sound good. Never decides what or when.
 *
 * Research justification:
 *   - Acoustic cues convey emotion (Juslin & Laukka 2003): tempo, dynamics,
 *     articulation, vibrato, attack time, spectral centroid. Every voice
 *     parameter here maps to one of these emotional dimensions.
 *   - 1/f in timbre: analog warmth = correlated drift + noise floor +
 *     asymmetric saturation. addDrift() and addBreath() implement this.
 *   - Phone speaker constraints: 55Hz HPF, conservative compression,
 *     high-shelf cut above 3.2kHz. Engineering, not art.
 *
 * Signal chain (v2):
 *   voice → reverbSend/delaySend → sidechainGain → compressor →
 *   masterGain → masterHPF(55Hz) → eqLowShelf → eqMidPeak →
 *   eqHighShelf → masterLP → limiter(-3dBFS) → panner → destination
 *
 *   drums → drumBus → drumComp → drumBusLP → masterGain
 *   void drone → voidGain → masterHPF (bypasses masterGain!)
 *
 * Gain staging (designed correctly from build 1):
 *   Target: -12 dBFS average, -6 dBFS peaks, limiter at -3 dBFS safety
 */

const Sound = (function () {
  'use strict';

  // ── AUDIO GRAPH STATE ──────────────────────────────────────────────────

  var ctx = null;

  // Master chain nodes (built in init, never rebuilt)
  var masterGain    = null;   // overall volume — flow.js fades this
  var masterHPF     = null;   // 55Hz highpass — kills sub-bass phone can't reproduce
  var eqLowShelf    = null;   // bass shelf EQ
  var eqMidPeak     = null;   // mid presence EQ
  var eqHighShelf   = null;   // high shelf cut — phone speakers are harsh up here
  var masterLP      = null;   // ceiling lowpass
  var masterLimiter = null;   // brick wall safety — should RARELY engage
  var spatialPanner = null;   // stereo positioning (LFO + tilt + touch)
  var compressor    = null;   // bus compressor — transparent levelling
  var sidechainGain = null;   // duck on kick — the EDM pump

  // Spatial LFO
  var spatialLFO      = null;
  var spatialLFOGain  = null;
  var spatialSweepDepth = 0.55;
  var spatialTouchActive = false;

  // Drum bus
  var drumBus   = null;
  var drumComp  = null;
  var drumBusLP = null;

  // Reverb chain
  var convolver      = null;
  var reverbSend     = null;
  var reverbGain     = null;
  var reverbLP       = null;
  var reverbHPF      = null;
  var reverbPreDelay = null;

  // Delay chain
  var delayNode     = null;
  var delayFeedback = null;
  var delayFilter   = null;
  var delaySend     = null;
  var delayMix      = null;

  // Sidechain
  var sidechainDepth = 0.3;

  // Void drone state
  var voidOscs = [], voidOscGains = [];
  var voidGain = null;

  // Named layer registry
  var layers = {};

  // Portamento memory (per-voice type that needs it)
  var _monoLastFreq      = 0;
  var _massiveLastFreq   = 0;
  var _massivePhase      = 0;

  // EDM 808 sub frequency — overrideable per lens
  var _edm808SubFreq = 55;


  // ══════════════════════════════════════════════════════════════════════
  // ██ VOICE REGISTRY
  // ══════════════════════════════════════════════════════════════════════
  //
  // Every synth voice defined in one place with consistent parameters.
  // The play() function reads from here and builds the appropriate
  // oscillator/filter/envelope chain. Voices that need custom synthesis
  // (FM, formant, massive phase, mono portamento) have dedicated builders
  // called from play() when matched.
  //
  // ADSR: attack/decay in seconds, sustain 0-1 (fraction of peak),
  //        release = total note duration multiplier for tail
  // filterFreq/filterQ: initial LP cutoff and resonance
  // reverbSend/delaySend: wet send levels (0-1)
  // voices/detune: unison voice count and cents spread
  // drift: cents of analog pitch drift LFO
  // breath: level of noise floor texture

  var VOICES = {
    piano: {
      wave: 'triangle', attack: 0.005, decay: 0.3, sustain: 0.4, release: 0.8,
      filterFreq: 2800, filterQ: 0.8, filterDecay: 0.2,
      breath: 0.003, drift: 2, reverbSend: 0.25, delaySend: 0.20,
      // Hammer click transient, two detuned triangles + sine octave harmonic
      custom: 'piano'
    },
    mono: {
      wave: 'triangle', attack: 0.018, decay: 0.3, sustain: 0.7, release: 0.5,
      filterFreq: 1800, filterQ: 0.5, drift: 3, reverbSend: 0.50, delaySend: 0.22,
      // Portamento lead — two triangles + sub sine, glides between pitches
      custom: 'mono'
    },
    strings: {
      wave: 'sawtooth', voices: 5, detune: [-14, -5, 0, 5, 14],
      attack: 0.12, decay: 0.0, sustain: 0.8, release: 1.5,
      filterFreq: 2200, filterQ: 0.4,
      vibrato: { rate: 5.2, depth: 0.004, delay: 0.4 },
      reverbSend: 0.25, delaySend: 0.08
    },
    organ: {
      wave: 'sine', attack: 0.010, decay: 0.0, sustain: 1.0, release: 2.0,
      filterFreq: 2800, filterQ: 0.5,
      // Drawbar harmonics: fundamental through 5.333
      partials: [1, 2, 3, 4, 5.333],
      partialGains: [0.40, 0.25, 0.15, 0.08, 0.04],
      vibrato: { rate: 2.0, depth: 0.001 },
      reverbSend: 0.25, delaySend: 0.20
    },
    epiano: {
      wave: 'sine', attack: 0.004, decay: 1.2, sustain: 0.15, release: 0.6,
      filterFreq: 4200, filterQ: 0.4,
      // FM tine model — velocity drives modulation index (brightness)
      fm: { ratio: 1, depth: 2.5, decay: 0.35 },
      tremolo: { rate: 4.8, depth: 0.11 },
      reverbSend: 0.20, delaySend: 0.18,
      custom: 'epiano'
    },
    bell: {
      wave: 'sine', attack: 0.001, decay: 3.0, sustain: 0.0, release: 0.1,
      filterFreq: 2800, filterQ: 0.5,
      // Inharmonic partials — real bell spectrum
      partials: [1, 2.4, 4.1, 5.3, 6.7],
      partialGains: [0.50, 0.25, 0.15, 0.10, 0.06],
      reverbSend: 0.25, delaySend: 0.40
    },
    pluck: {
      wave: 'triangle', attack: 0.001, decay: 0.15, sustain: 0.0, release: 0.3,
      filterFreq: 4000, filterQ: 0.7, filterDecay: 0.2,
      reverbSend: 0.25, delaySend: 0.15,
      // Noise excitation + resonant bandpass body
      custom: 'pluck'
    },
    stab: {
      wave: 'sawtooth', voices: 2, attack: 0.001, decay: 0.1, sustain: 0.0, release: 0.2,
      filterFreq: 3500, filterQ: 6, filterDecay: 0.08,
      reverbSend: 0.08, delaySend: 0.0,
      custom: 'stab'
    },
    formant: {
      wave: 'sawtooth', attack: 0.022, decay: 0.0, sustain: 0.8, release: 1.0,
      // Three formant bandpass filters with LFO morph
      custom: 'formant',
      reverbSend: 0.50, delaySend: 0.0
    },
    massive: {
      wave: 'sawtooth', attack: 0.013, decay: 0.5, sustain: 0.5, release: 0.8,
      filterFreq: 2600, filterQ: 1.2,
      // Phase-dependent unison build (0-4 phases, earned by engagement)
      custom: 'massive',
      reverbSend: 0.28, delaySend: 0.44
    },
    gridstack: {
      wave: 'sawtooth', attack: 0.007, decay: 0.2, sustain: 0.32, release: 0.3,
      // Harmonic stack: root + m3 + P5 + m7 + octave, each with unison detune
      // Resonant filter sweep = the viral "whoop"
      custom: 'gridstack',
      reverbSend: 0.22, delaySend: 0.58
    },
    unisonWall: {
      wave: 'sawtooth', voices: 8, attack: 0.05, decay: 0.0, sustain: 1.0, release: 3.0,
      filterFreq: 600, filterQ: 0.5,
      // Built via createLayer, not fire-and-forget
      custom: 'unisonWall',
      reverbSend: 0.45, delaySend: 0.22
    },
    upright: {
      wave: 'triangle', attack: 0.005, decay: 0.6, sustain: 0.2, release: 0.4,
      filterFreq: 1100, filterQ: 0.8,
      // Formant body resonance + string buzz transient
      custom: 'upright',
      reverbSend: 0.20, delaySend: 0.0
    },
    fm: {
      wave: 'sine', attack: 0.003, decay: 0.8, sustain: 0.2, release: 0.5,
      filterFreq: 3000, filterQ: 0.5,
      fm: { ratio: 3, depth: 6, decay: 0.4 },
      reverbSend: 0.15, delaySend: 0.25,
      custom: 'fm'
    },
    glitch: {
      wave: 'random', attack: 0.004, decay: 0.05, sustain: 0.0, release: 0.01,
      filterFreq: 2500, filterQ: 0.5,
      custom: 'glitch',
      reverbSend: 0.15, delaySend: 0.0
    }
  };


  // ══════════════════════════════════════════════════════════════════════
  // ██ INIT — Build the master signal chain
  // ══════════════════════════════════════════════════════════════════════

  function init(audioCtx) {
    ctx = audioCtx;

    // ── 8D Spatial panner — end of chain before destination ──────────
    // StereoPannerNode. LFO provides gentle auto-sweep when still,
    // device tilt biases center, touch overrides directly.
    spatialPanner = ctx.createStereoPanner();
    spatialLFO = ctx.createOscillator();
    spatialLFO.type = 'sine';
    spatialLFO.frequency.value = 0.12;
    spatialLFOGain = ctx.createGain();
    spatialLFOGain.gain.value = 0;
    spatialLFO.connect(spatialLFOGain);
    spatialLFOGain.connect(spatialPanner.pan);
    spatialLFO.start();
    spatialPanner.connect(ctx.destination);

    // ── Master limiter — transparent safety ceiling ──────────────────
    // -3 dBFS threshold, gentle knee. Should RARELY engage.
    // If it's working hard, the mix is too hot upstream.
    masterLimiter = ctx.createDynamicsCompressor();
    masterLimiter.threshold.value = -3;
    masterLimiter.knee.value = 4;
    masterLimiter.ratio.value = 12;
    masterLimiter.attack.value = 0.002;
    masterLimiter.release.value = 0.12;
    masterLimiter.connect(spatialPanner);

    // ── Master LP — phone speaker ceiling ────────────────────────────
    // 3.2kHz: everything above this is harshness on phone speakers
    masterLP = ctx.createBiquadFilter();
    masterLP.type = 'lowpass';
    masterLP.frequency.value = 3200;
    masterLP.Q.value = 0.3;
    masterLP.connect(masterLimiter);

    // ── Master EQ — tuned for phone + Bluetooth ──────────────────────
    // Goal: warm mids, controlled lows, no harshness in highs

    // High shelf: cut above 3.2kHz — phone speakers are harsh here
    eqHighShelf = ctx.createBiquadFilter();
    eqHighShelf.type = 'highshelf';
    eqHighShelf.frequency.value = 3200;
    eqHighShelf.gain.value = -10;
    eqHighShelf.connect(masterLP);

    // Mid peak: warm presence zone — clarity without nasal
    eqMidPeak = ctx.createBiquadFilter();
    eqMidPeak.type = 'peaking';
    eqMidPeak.frequency.value = 700;
    eqMidPeak.Q.value = 0.6;
    eqMidPeak.gain.value = 2.5;
    eqMidPeak.connect(eqHighShelf);

    // Low shelf: cut lows — phone speakers turn bass boost into mud
    eqLowShelf = ctx.createBiquadFilter();
    eqLowShelf.type = 'lowshelf';
    eqLowShelf.frequency.value = 150;
    eqLowShelf.gain.value = -1;
    eqLowShelf.connect(eqMidPeak);

    // ── Master HPF — 55Hz ────────────────────────────────────────────
    // Removes sub-bass that phone speaker converts to distortion.
    // Void drone also connects here (bypassing masterGain).
    masterHPF = ctx.createBiquadFilter();
    masterHPF.type = 'highpass';
    masterHPF.frequency.value = 55;
    masterHPF.Q.value = 0.5;
    masterHPF.connect(eqLowShelf);

    // ── Master gain — overall volume control ─────────────────────────
    // 0.25 = approx -12 dBFS. Flow.js fades this for silence/presence.
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.25;
    masterGain.connect(masterHPF);

    // ── Bus compressor — transparent levelling ───────────────────────
    // Soft knee, moderate ratio. Lets transients through.
    compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 12;
    compressor.ratio.value = 2.5;
    compressor.attack.value = 0.012;
    compressor.release.value = 0.30;
    compressor.connect(masterGain);

    // ── Sidechain gain — duck on kick ────────────────────────────────
    sidechainGain = ctx.createGain();
    sidechainGain.connect(compressor);

    // ── Drum bus — separate compression for punch ────────────────────
    drumBus = ctx.createGain();
    drumBus.gain.value = 0.7;
    drumComp = ctx.createDynamicsCompressor();
    drumComp.threshold.value = -15;
    drumComp.ratio.value = 4;
    drumComp.attack.value = 0.005;
    drumComp.release.value = 0.12;
    drumBusLP = ctx.createBiquadFilter();
    drumBusLP.type = 'lowpass';
    drumBusLP.frequency.value = 3500;
    drumBusLP.Q.value = 0.3;
    drumBus.connect(drumComp);
    drumComp.connect(drumBusLP);
    drumBusLP.connect(masterGain);

    // ── Effects buses ────────────────────────────────────────────────
    _buildReverb(3.0, 0.4, 20);
    _buildDelay();
  }


  // ══════════════════════════════════════════════════════════════════════
  // ██ CONFIGURE — Per-lens effects setup
  // ══════════════════════════════════════════════════════════════════════

  function configure(lens) {
    if (!lens || !ctx) return;
    var space = lens.space || {};
    var rev   = space.reverb || {};
    var del   = space.delay || {};
    var tone  = lens.tone || {};

    // Reverb
    _buildReverb(rev.decay || 3.0, rev.damping || 0.4, rev.preDelay || 20);
    var spaces = { intimate: 0.2, room: 0.35, cathedral: 0.5, infinite: 0.7 };
    var reverbLevel = space.reverbMix !== undefined
      ? space.reverbMix
      : (spaces[space.type || 'cathedral'] || 0.4);
    if (reverbGain) reverbGain.gain.value = reverbLevel;

    // Delay
    if (delayFeedback) delayFeedback.gain.value = del.feedback || 0.35;
    if (delayFilter) delayFilter.frequency.value = del.filter || 2000;
    var bpm = lens.rhythm && lens.rhythm.bpm;
    var tempo = Array.isArray(bpm) ? bpm[0] : (bpm || 80);
    updateDelaySync(tempo, del.sync || 'dotted-eighth');

    // Sidechain depth
    sidechainDepth = space.sidechain !== undefined ? space.sidechain : 0;

    // Drum bus gain
    if (drumBus && lens.behaviors && lens.behaviors.pulse) {
      drumBus.gain.value = lens.behaviors.pulse.gain !== undefined
        ? lens.behaviors.pulse.gain : 1.0;
    }

    // Per-lens master EQ
    if (eqLowShelf) {
      eqLowShelf.frequency.value = tone.bassFreq || 150;
      eqLowShelf.gain.value = tone.bassGain !== undefined ? tone.bassGain : -1;
    }
    if (eqMidPeak) {
      eqMidPeak.frequency.value = tone.midFreq || 700;
      eqMidPeak.Q.value = tone.midQ || 0.6;
      eqMidPeak.gain.value = tone.midGain !== undefined ? tone.midGain : 2.5;
    }
    if (eqHighShelf) {
      eqHighShelf.frequency.value = tone.highFreq || 3200;
      eqHighShelf.gain.value = tone.highGain !== undefined ? tone.highGain : -10;
    }
    if (masterLP) {
      masterLP.frequency.value = tone.ceiling || 3200;
    }

    // Spatial
    if (spatialLFO && space.spatial) {
      var sp = space.spatial;
      spatialSweepDepth = sp.sweepDepth !== undefined ? sp.sweepDepth : 0.55;
      spatialLFO.frequency.setTargetAtTime(sp.sweepRate || 0.12, ctx.currentTime, 0.5);
    } else {
      spatialSweepDepth = 0.55;
    }
  }


  // ══════════════════════════════════════════════════════════════════════
  // ██ REVERB
  // ══════════════════════════════════════════════════════════════════════
  //
  // Generates a synthetic impulse response rather than loading a file.
  // Two-channel independent noise with exponential decay and HF damping.
  // 50ms fade-in: the room "blooms" open rather than snapping on.
  // Pre-delay node provides acoustic distance perception (1ms ~ 34cm).

  function _buildReverb(decayTime, damping, preDelayMs) {
    // Disconnect existing nodes safely
    var nodes = [reverbSend, reverbPreDelay, convolver, reverbHPF, reverbLP, reverbGain];
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i]) { try { nodes[i].disconnect(); } catch (e) {} }
    }

    var sr = ctx.sampleRate;
    var cappedDecay = Math.min(decayTime, 6);
    convolver = ctx.createConvolver();
    var len = Math.floor(sr * cappedDecay);
    var buf = ctx.createBuffer(2, len, sr);
    var fadeInSamples = Math.floor(0.050 * sr);

    for (var ch = 0; ch < 2; ch++) {
      var d = buf.getChannelData(ch);
      for (var j = 0; j < len; j++) {
        var t = j / len;
        var fadeIn   = Math.min(1, j / fadeInSamples);
        var exponent = 1.5 + damping * 3;
        var envelope = Math.pow(1 - t, exponent);
        var hfDamp   = 1 - damping * t;
        d[j] = (Math.random() * 2 - 1) * envelope * Math.max(0.05, hfDamp) * fadeIn;
      }
    }
    convolver.buffer = buf;

    if (!reverbSend) {
      reverbSend = ctx.createGain();
      reverbSend.gain.value = 0.3;
    }

    // Pre-delay: 20ms default = instrument ~7m away
    reverbPreDelay = ctx.createDelay(0.12);
    reverbPreDelay.delayTime.value = Math.min((preDelayMs || 20), 100) / 1000;

    reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.5;

    // HPF on reverb return: kills sub-bass mud below 120Hz
    reverbHPF = ctx.createBiquadFilter();
    reverbHPF.type = 'highpass';
    reverbHPF.frequency.value = 120;
    reverbHPF.Q.value = 0.5;

    // LP on reverb: 4000Hz — air without harshness
    reverbLP = ctx.createBiquadFilter();
    reverbLP.type = 'lowpass';
    reverbLP.frequency.value = 4000;
    reverbLP.Q.value = 0.5;

    // Chain: send → preDelay → convolver → HPF → LP → gain → master
    reverbSend.connect(reverbPreDelay);
    reverbPreDelay.connect(convolver);
    convolver.connect(reverbHPF);
    reverbHPF.connect(reverbLP);
    reverbLP.connect(reverbGain);
    reverbGain.connect(masterGain);
  }


  // ══════════════════════════════════════════════════════════════════════
  // ██ DELAY
  // ══════════════════════════════════════════════════════════════════════
  //
  // Tempo-synced feedback delay. Default dotted-eighth for rhythmic echo.
  // LP filter in the feedback loop: each repeat gets darker (tape delay).

  function _buildDelay() {
    delayNode = ctx.createDelay(4);
    delayNode.delayTime.value = 0.375;

    delayFeedback = ctx.createGain();
    delayFeedback.gain.value = 0.35;

    delayFilter = ctx.createBiquadFilter();
    delayFilter.type = 'lowpass';
    delayFilter.frequency.value = 2000;

    delayMix = ctx.createGain();
    delayMix.gain.value = 0.3;

    delaySend = ctx.createGain();
    delaySend.gain.value = 0.25;

    // Chain: send → delay → filter → feedback → delay (loop)
    //                        └→ mix → master
    delaySend.connect(delayNode);
    delayNode.connect(delayFilter);
    delayFilter.connect(delayFeedback);
    delayFeedback.connect(delayNode);
    delayFilter.connect(delayMix);
    delayMix.connect(masterGain);
  }

  function updateDelaySync(tempo, sync) {
    if (!delayNode) return;
    var beat = 60 / tempo;
    if (sync === 'quarter')      delayNode.delayTime.value = beat;
    else if (sync === 'eighth')  delayNode.delayTime.value = beat / 2;
    else                         delayNode.delayTime.value = beat * 0.75; // dotted-eighth
  }


  // ══════════════════════════════════════════════════════════════════════
  // ██ HUMANIZE — 1/f warmth helpers
  // ══════════════════════════════════════════════════════════════════════
  //
  // From the research: Moog sounds better because of drift, noise,
  // saturation. These helpers make any digital oscillator feel analog.

  // Timing humanization: +-3.5ms (below 10ms JND threshold)
  function hTime(t) { return t + (Math.random() - 0.5) * 0.007; }

  // Velocity humanization: +-13% variation
  function hVel(vel) { return Math.min(0.95, vel * (0.87 + Math.random() * 0.26)); }

  // Velocity micro-variation: +-2% (subtler, for within-phrase consistency)
  function _humanVel(vel) {
    return Math.max(0.01, Math.min(1, vel + (Math.random() - 0.5) * 0.04));
  }

  /**
   * Add oscillator drift: +-2-4 cents random LFO, 0.2-0.8 Hz.
   * Makes digital oscillators feel alive. Call on any OscillatorNode.
   * Returns the LFO node for cleanup tracking.
   */
  function addDrift(osc, cents) {
    if (!ctx || !osc) return null;
    var c = cents || 3;
    var lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.2 + Math.random() * 0.6;
    var lfoG = ctx.createGain();
    lfoG.gain.value = osc.frequency.value * (c / 1200);
    lfo.connect(lfoG);
    lfoG.connect(osc.detune);
    lfo.start(ctx.currentTime);
    return lfo;
  }

  /**
   * Add a whisper of noise texture to a synth voice.
   * -48 to -55 dB relative to signal. Fills the spectrum like analog circuits.
   */
  function addBreath(destination, time, duration, level) {
    if (!ctx) return;
    var noiseLen = Math.floor(ctx.sampleRate * Math.min(4, duration || 1));
    var noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
    var nd = noiseBuf.getChannelData(0);
    for (var j = 0; j < noiseLen; j++) nd[j] = (Math.random() * 2 - 1);
    var src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    var g = ctx.createGain();
    g.gain.value = level || 0.004;
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 4000;
    src.connect(g);
    g.connect(lp);
    lp.connect(destination);
    src.start(time);
    src.stop(time + (duration || 1));
  }


  // ══════════════════════════════════════════════════════════════════════
  // ██ SIDECHAIN
  // ══════════════════════════════════════════════════════════════════════

  function pumpSidechain(vel) {
    if (!sidechainGain || !ctx) return;
    var now = ctx.currentTime;
    var pumpVal = Math.max(0.3, 1 - sidechainDepth * vel);
    sidechainGain.gain.setValueAtTime(pumpVal, now);
    sidechainGain.gain.setTargetAtTime(1, now + 0.01, 0.06);
  }


  // ══════════════════════════════════════════════════════════════════════
  // ██ NOISE GENERATORS
  // ══════════════════════════════════════════════════════════════════════

  // Voss-McCartney pink noise — 1/f spectrum, warm, natural
  function _createPinkNoise() {
    var bufLen = ctx.sampleRate * 2;
    var buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    var d = buf.getChannelData(0);
    var b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (var i = 0; i < bufLen; i++) {
      var w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.96900 * b2 + w * 0.1538520;
      b3 = 0.86650 * b3 + w * 0.3104856;
      b4 = 0.55000 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.0168980;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
    return buf;
  }

  function _createWhiteNoise() {
    var bufLen = ctx.sampleRate * 2;
    var buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }


  // ══════════════════════════════════════════════════════════════════════
  // ██ SPATIAL — 8D panning
  // ══════════════════════════════════════════════════════════════════════
  //
  // Tilt biases center pan. LFO sweeps around that center (suppressed).
  // When still: sounds at center. When moving: tilt positions.
  // When touching: finger takes over directly via setTouchPan().

  function updateSpatial(gamma, isSilent, touching) {
    if (!spatialPanner || !ctx) return;

    // Kill LFO entirely — tilt and touch drive spatial now
    spatialLFOGain.gain.setTargetAtTime(0, ctx.currentTime, 0.5);

    if (touching) {
      spatialTouchActive = true;
      return;
    }

    // When touch releases, smooth return to center before tilt takes over
    if (spatialTouchActive) {
      spatialTouchActive = false;
      spatialPanner.pan.setTargetAtTime(0, ctx.currentTime, 0.3);
      return;
    }

    // Tilt → gentle pan. +-0.18 max — subtle positioning, not slamming
    var tiltPan = Math.max(-0.18, Math.min(0.18, (gamma || 0) / 140));
    spatialPanner.pan.setTargetAtTime(tiltPan, ctx.currentTime, 0.5);
  }

  // Touch directly spatializes — draw left: sounds go left, etc.
  function setTouchPan(normX) {
    if (!spatialPanner || !ctx) return;
    var pan = Math.max(-0.92, Math.min(0.92, (normX - 0.5) * 1.84));
    spatialPanner.pan.setTargetAtTime(pan, ctx.currentTime, 0.025);
  }


  // ══════════════════════════════════════════════════════════════════════
  // ██ LAYER MANAGEMENT — Continuous sound layers
  // ══════════════════════════════════════════════════════════════════════
  //
  // Unlike fire-and-forget voices, layers persist and can be faded,
  // filtered, and pitch-shifted in real time. Used for drones, pads,
  // the Ascension wall, wobble bass, etc.

  function createLayer(name, config) {
    destroyLayer(name);

    var L = { gain: null, filter: null, pitchOscs: [], allNodes: [] };
    L.gain = ctx.createGain();
    L.gain.gain.value = config.gain || 0;

    // Determine source connection target
    var sourceTarget;

    if (config.formants && config.formants.length > 0) {
      // Formant mode: sources → parallel bandpass filters → gain
      var fFilters = [];
      for (var fi = 0; fi < config.formants.length; fi++) {
        var fc = config.formants[fi];
        var bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = fc.freq;
        bp.Q.value = fc.Q || 5;
        var fg = ctx.createGain();
        fg.gain.value = fc.gain || 0.3;
        bp.connect(fg);
        fg.connect(L.gain);
        fFilters.push(bp);
        L.allNodes.push(bp, fg);
      }
      // Formant morph LFO
      if (config.formantMorph) {
        var morphLfo = ctx.createOscillator();
        morphLfo.type = 'sine';
        morphLfo.frequency.value = config.formantMorph.rate || 0.15;
        morphLfo.start();
        if (fFilters[0] && config.formantMorph.f1range) {
          var m1 = ctx.createGain(); m1.gain.value = config.formantMorph.f1range;
          morphLfo.connect(m1); m1.connect(fFilters[0].frequency);
          L.allNodes.push(m1);
        }
        if (fFilters[1] && config.formantMorph.f2range) {
          var m2 = ctx.createGain(); m2.gain.value = config.formantMorph.f2range;
          morphLfo.connect(m2); m2.connect(fFilters[1].frequency);
          L.allNodes.push(m2);
        }
        L.allNodes.push(morphLfo);
      }
      sourceTarget = fFilters;
    } else if (config.filter) {
      L.filter = ctx.createBiquadFilter();
      L.filter.type = config.filter.type || 'lowpass';
      L.filter.frequency.value = config.filter.freq || 1400;
      L.filter.Q.value = config.filter.Q || 0.7;
      L.filter.connect(L.gain);
      sourceTarget = L.filter;
    } else {
      sourceTarget = L.gain;
    }

    // Create oscillators
    if (config.oscillators) {
      for (var oi = 0; oi < config.oscillators.length; oi++) {
        var spec = config.oscillators[oi];
        var o = ctx.createOscillator();
        o.type = spec.wave || 'sine';
        o.frequency.value = spec.freq || 440;
        if (spec.detune) o.detune.value = spec.detune;
        var g = ctx.createGain();
        g.gain.value = spec.gain !== undefined ? spec.gain : 0.15;
        o.connect(g);
        if (Array.isArray(sourceTarget)) {
          for (var si = 0; si < sourceTarget.length; si++) g.connect(sourceTarget[si]);
        } else {
          g.connect(sourceTarget);
        }
        o.start();
        L.pitchOscs.push(o);
        L.allNodes.push(o, g);
      }
    }

    // Create noise source
    if (config.noise) {
      var noiseBuf = config.noise === 'pink' ? _createPinkNoise() : _createWhiteNoise();
      var nSrc = ctx.createBufferSource();
      nSrc.buffer = noiseBuf;
      nSrc.loop = true;
      if (Array.isArray(sourceTarget)) {
        for (var nsi = 0; nsi < sourceTarget.length; nsi++) nSrc.connect(sourceTarget[nsi]);
      } else {
        nSrc.connect(sourceTarget);
      }
      nSrc.start();
      L.allNodes.push(nSrc);
    }

    // Vibrato LFO (modulates all pitch oscillators)
    if (config.vibrato && config.vibrato.rate > 0 && config.vibrato.depth > 0) {
      var lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = config.vibrato.rate;
      lfo.start();
      for (var vi = 0; vi < L.pitchOscs.length; vi++) {
        var po = L.pitchOscs[vi];
        var vg = ctx.createGain();
        vg.gain.value = po.frequency.value * config.vibrato.depth;
        lfo.connect(vg);
        vg.connect(po.frequency);
        L.allNodes.push(vg);
      }
      L.allNodes.push(lfo);
    }

    // Connect output to sidechain
    L.gain.connect(sidechainGain);

    // Optional reverb send
    if (config.reverbSend > 0 && reverbSend) {
      var rs = ctx.createGain();
      rs.gain.value = config.reverbSend;
      L.gain.connect(rs);
      rs.connect(reverbSend);
      L.allNodes.push(rs);
    }

    layers[name] = L;
    return L;
  }

  function destroyLayer(name) {
    var L = layers[name];
    if (!L) return;
    for (var i = 0; i < L.allNodes.length; i++) {
      try { L.allNodes[i].stop(); } catch (e) {}
      try { L.allNodes[i].disconnect(); } catch (e) {}
    }
    if (L.gain)   { try { L.gain.disconnect();   } catch (e) {} }
    if (L.filter) { try { L.filter.disconnect(); } catch (e) {} }
    delete layers[name];
  }

  function destroyAllLayers() {
    for (var name in layers) destroyLayer(name);
  }

  function setLayerGain(name, vol, rampTime) {
    var L = layers[name];
    if (!L || !L.gain) return;
    if (rampTime > 0) {
      L.gain.gain.setTargetAtTime(vol, ctx.currentTime, rampTime);
    } else {
      L.gain.gain.value = vol;
    }
  }

  function setLayerFreqs(name, freqs, glideTime) {
    var L = layers[name];
    if (!L) return;
    var now = ctx.currentTime;
    for (var i = 0; i < L.pitchOscs.length && i < freqs.length; i++) {
      L.pitchOscs[i].frequency.setTargetAtTime(freqs[i], now, glideTime || 0.3);
    }
  }

  function setLayerFilter(name, freq, rampTime) {
    var L = layers[name];
    if (!L || !L.filter) return;
    if (rampTime > 0) {
      L.filter.frequency.setTargetAtTime(freq, ctx.currentTime, rampTime);
    } else {
      L.filter.frequency.value = freq;
    }
  }

  function getLayer(name) { return layers[name] || null; }


  // ══════════════════════════════════════════════════════════════════════
  // ██ SYNTHESIS — Voice engines
  // ══════════════════════════════════════════════════════════════════════
  //
  // All voices follow the pattern:
  //   create oscillator(s) → filter → gain (ADSR) → connect to bus
  //
  // Custom voices have dedicated functions for complex synthesis
  // (FM, formant, multi-phase, portamento). Registry voices that
  // don't need custom code use the generic _synthFromRegistry builder.


  // ── PLAY — Main entry point ───────────────────────────────────────────
  // All note-on events come through here. Dispatches to the appropriate
  // synthesis engine based on voice name.

  function play(voice, time, freq, velocity, duration) {
    try {
      if (!ctx) return;
      var t   = time || ctx.currentTime;
      var f   = freq || 440;
      var vel = Math.max(0.01, Math.min(1, velocity || 0.5));
      var dur = duration || 1.0;

      var reg = VOICES[voice];
      if (!reg) {
        // Unknown voice — fall back to simple triangle
        _synthSimple(t, f, vel, dur);
        return;
      }

      // Route to custom synthesis if the voice needs it
      if (reg.custom) {
        switch (reg.custom) {
          case 'piano':     _synthPiano(t, f, vel, dur);     break;
          case 'mono':      _synthMono(t, f, vel, dur);      break;
          case 'epiano':    _synthEPiano(t, f, vel, dur);    break;
          case 'pluck':     _synthPluck(t, f, vel, dur);     break;
          case 'stab':      _synthStab(t, f, vel);           break;
          case 'formant':   _synthFormant(t, f, vel, dur);   break;
          case 'massive':   _synthMassive(t, f, vel, dur);   break;
          case 'gridstack': _synthGridstack(t, f, vel, dur); break;
          case 'upright':   _synthUpright(t, f, vel);        break;
          case 'fm':        _synthFM(t, f, vel, dur);        break;
          case 'glitch':    _synthGlitch(t, f, vel);         break;
          default:          _synthFromRegistry(reg, t, f, vel, dur);
        }
      } else {
        _synthFromRegistry(reg, t, f, vel, dur);
      }
    } catch (e) {
      // Never crash the music
      if (typeof console !== 'undefined') console.warn('[Sound.play]', e.message);
    }
  }


  // ── PLAY CHORD — Arpeggiated chord ────────────────────────────────────
  // Slight time offset between notes = more natural than block chords.
  // Research: staggered onsets create richer perception (Wright & Bregman 1987).

  function playChord(voice, time, freqs, velocity, duration, spacing) {
    try {
      if (!ctx || !freqs || !freqs.length) return;
      var sp = spacing || 0.015;  // 15ms between notes
      for (var i = 0; i < freqs.length; i++) {
        play(voice, time + i * sp, freqs[i], velocity, duration);
      }
    } catch (e) {
      if (typeof console !== 'undefined') console.warn('[Sound.playChord]', e.message);
    }
  }


  // ── GENERIC REGISTRY BUILDER ──────────────────────────────────────────
  // For voices defined entirely by their registry entry (strings, organ, bell).
  // Creates oscillator(s), optional unison detune, filter, ADSR envelope.

  function _synthFromRegistry(reg, time, freq, vel, dur) {
    var end = time + dur + (reg.release || 0.5);

    // LP filter
    var filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = reg.filterFreq || 3000;
    filt.Q.value = reg.filterQ || 0.5;

    // Filter decay: some voices open bright then close
    if (reg.filterDecay) {
      filt.frequency.setValueAtTime((reg.filterFreq || 3000) + vel * 1500, time);
      filt.frequency.setTargetAtTime(reg.filterFreq || 3000, time + 0.01, reg.filterDecay);
    }

    // ADSR envelope — all use setTargetAtTime for click-free curves
    var env = ctx.createGain();
    var peakVel = Math.min(0.85, vel * 0.70);
    var sustainVel = peakVel * (reg.sustain !== undefined ? reg.sustain : 0.5);

    env.gain.setValueAtTime(0.0001, time);
    // Attack
    env.gain.setTargetAtTime(peakVel, time, Math.max(0.001, (reg.attack || 0.01) / 3));
    // Decay → sustain
    if (reg.decay > 0) {
      env.gain.setTargetAtTime(sustainVel, time + (reg.attack || 0.01), reg.decay || 0.3);
    }
    // Release
    var releaseStart = time + dur * 0.7;
    env.gain.setTargetAtTime(0.0001, releaseStart, (reg.release || 0.5) * 0.35);

    // ── Oscillator creation ──

    if (reg.partials && reg.partials.length > 0) {
      // Partial-based voice (organ, bell): multiple sine oscillators at harmonic ratios
      var pGains = reg.partialGains || [];
      for (var pi = 0; pi < reg.partials.length; pi++) {
        var po = ctx.createOscillator();
        po.type = reg.wave || 'sine';
        po.frequency.value = freq * reg.partials[pi];
        var pg = ctx.createGain();
        pg.gain.value = pGains[pi] !== undefined ? pGains[pi] : (0.3 / (pi + 1));
        po.connect(pg);
        pg.connect(filt);
        po.start(time);
        po.stop(end);

        // Per-partial vibrato for organ
        if (reg.vibrato) {
          var vLfo = ctx.createOscillator();
          vLfo.type = 'sine';
          vLfo.frequency.value = reg.vibrato.rate || 5;
          var vG = ctx.createGain();
          vG.gain.value = freq * reg.partials[pi] * (reg.vibrato.depth || 0.003);
          vLfo.connect(vG);
          vG.connect(po.frequency);
          vLfo.start(time);
          vLfo.stop(end);
        }
      }
    } else if (reg.voices && reg.voices > 1) {
      // Unison detuned voice (strings, stab): multiple oscillators spread in pitch
      var detuneArr = reg.detune;
      var voiceCount = reg.voices;

      // If detune is an array, use it directly. Otherwise generate spread.
      if (!Array.isArray(detuneArr)) {
        var spread = detuneArr || 10;
        detuneArr = [];
        for (var vi = 0; vi < voiceCount; vi++) {
          detuneArr.push((vi / (voiceCount - 1) - 0.5) * 2 * spread);
        }
      }

      var perVoiceGain = 0.80 / detuneArr.length;
      for (var ui = 0; ui < detuneArr.length; ui++) {
        var uo = ctx.createOscillator();
        uo.type = reg.wave || 'sawtooth';
        uo.frequency.value = freq;
        uo.detune.value = detuneArr[ui];
        var ug = ctx.createGain();
        ug.gain.value = perVoiceGain;
        uo.connect(ug);
        ug.connect(filt);
        uo.start(time);
        uo.stop(end);
      }

      // Vibrato that fades in (bowing character for strings)
      if (reg.vibrato) {
        var vibDelay = reg.vibrato.delay || 0;
        var vibLfo = ctx.createOscillator();
        vibLfo.type = 'sine';
        vibLfo.frequency.value = reg.vibrato.rate || 5;
        var vibLfoG = ctx.createGain();
        vibLfoG.gain.setValueAtTime(0, time);
        vibLfoG.gain.linearRampToValueAtTime(
          freq * (reg.vibrato.depth || 0.003),
          time + vibDelay + 0.3
        );
        vibLfo.connect(vibLfoG);
        vibLfoG.connect(filt.frequency);
        vibLfo.start(time);
        vibLfo.stop(end);
      }
    } else {
      // Single oscillator voice
      var so = ctx.createOscillator();
      so.type = reg.wave || 'triangle';
      so.frequency.value = freq;
      so.connect(filt);
      so.start(time);
      so.stop(end);

      if (reg.drift) addDrift(so, reg.drift);
    }

    // Connect to bus
    filt.connect(env);
    env.connect(sidechainGain);

    // Effects sends
    if (reg.reverbSend && reverbSend) {
      var rs = ctx.createGain();
      rs.gain.value = reg.reverbSend;
      env.connect(rs);
      rs.connect(reverbSend);
    }
    if (reg.delaySend && delaySend) {
      var ds = ctx.createGain();
      ds.gain.value = reg.delaySend;
      env.connect(ds);
      ds.connect(delaySend);
    }
  }


  // ══════════════════════════════════════════════════════════════════════
  // ██ CUSTOM VOICE ENGINES
  // ══════════════════════════════════════════════════════════════════════


  // ── PIANO — jazz: hammer click, layered harmonics, analog drift ──────
  // Two detuned triangles + sine octave harmonic + noise click transient.
  // Velocity drives filter brightness: soft = dark, hard = bright.

  function _synthPiano(time, freq, vel, decay) {
    vel = _humanVel(vel);

    var filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(1800 + vel * 2000, time);
    filt.frequency.setTargetAtTime(1400, time + 0.01, 0.2);
    filt.Q.value = 0.6;

    // ADSR: fast attack (hammer), medium decay, warm sustain
    var env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(Math.min(0.65, vel * 0.60), time + 0.004);
    env.gain.setTargetAtTime(vel * 0.38, time + 0.004, 0.14);
    env.gain.setTargetAtTime(0.0001, time + decay * 0.5, decay * 0.35);

    // Two detuned triangles — body
    var o1 = ctx.createOscillator(); o1.type = 'triangle'; o1.frequency.value = freq;
    addDrift(o1, 2);
    var o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = freq;
    o2.detune.value = 5;
    addDrift(o2, 3);

    // Sine octave harmonic — shimmer
    var o3 = ctx.createOscillator(); o3.type = 'sine'; o3.frequency.value = freq * 2;
    var hG = ctx.createGain(); hG.gain.value = 0.18; o3.connect(hG);

    // Hammer click — noise transient
    var cLen = Math.floor(ctx.sampleRate * 0.015);
    var cBuf = ctx.createBuffer(1, cLen, ctx.sampleRate);
    var cd = cBuf.getChannelData(0);
    for (var i = 0; i < cLen; i++) cd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / cLen, 3);
    var cSrc = ctx.createBufferSource(); cSrc.buffer = cBuf;
    var cG = ctx.createGain(); cG.gain.value = vel * 0.5; cSrc.connect(cG);

    o1.connect(filt); o2.connect(filt); hG.connect(filt); cG.connect(filt);
    filt.connect(env); env.connect(sidechainGain);

    var rs = ctx.createGain(); rs.gain.value = 0.25; env.connect(rs); rs.connect(reverbSend);
    var ds = ctx.createGain(); ds.gain.value = 0.2;  env.connect(ds); ds.connect(delaySend);

    var end = time + decay + 0.5;
    o1.start(time); o1.stop(end);
    o2.start(time); o2.stop(end);
    o3.start(time); o3.stop(end);
    cSrc.start(time); cSrc.stop(time + 0.015);
  }


  // ── MONO — portamento lead ────────────────────────────────────────────
  // Monophonic: slides between pitches. Two triangles + sub sine.
  // Velocity controls filter brightness: soft = intimate, hard = forward.

  function _synthMono(time, freq, vel, dur) {
    var prevF = _monoLastFreq > 20 ? _monoLastFreq : freq;
    _monoLastFreq = freq;

    // Portamento: scales with interval size
    var semitones = Math.abs(Math.log2(Math.max(0.01, freq / prevF)) * 12);
    var glide = Math.min(0.22, 0.025 + semitones * 0.006);

    // LP filter: warm, minimal resonance
    var baseCut = 600 + vel * 1200;
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(baseCut * 0.40, time);
    lp.frequency.linearRampToValueAtTime(baseCut, time + glide + 0.025);
    lp.Q.value = 0.5;

    // Envelope
    var env = ctx.createGain();
    env.gain.setValueAtTime(0.001, time);
    env.gain.linearRampToValueAtTime(vel * 0.38, time + 0.018);
    env.gain.setTargetAtTime(vel * 0.28, time + 0.06, dur * 0.45);
    env.gain.linearRampToValueAtTime(0.001, time + dur);

    // Sub-octave sine: depth and warmth
    var sub = ctx.createOscillator(); sub.type = 'sine';
    sub.frequency.setValueAtTime(prevF / 2, time);
    sub.frequency.exponentialRampToValueAtTime(freq / 2, time + glide);
    var subG = ctx.createGain(); subG.gain.value = 0.28;
    sub.connect(subG); subG.connect(lp);
    sub.start(time); sub.stop(time + dur + 0.08);

    // Two triangles: 5 cents apart — gentle unison
    var detunes = [0, 5];
    var gains   = [0.55, 0.35];
    for (var d = 0; d < detunes.length; d++) {
      var o = ctx.createOscillator(); o.type = 'triangle';
      o.frequency.setValueAtTime(prevF, time);
      o.frequency.exponentialRampToValueAtTime(freq, time + glide);
      o.detune.value = detunes[d];
      var g = ctx.createGain(); g.gain.value = gains[d];
      o.connect(g); g.connect(lp);
      o.start(time); o.stop(time + dur + 0.08);
    }

    lp.connect(env); env.connect(sidechainGain);
    var rs = ctx.createGain(); rs.gain.value = 0.50; env.connect(rs); rs.connect(reverbSend);
    var ds = ctx.createGain(); ds.gain.value = 0.22; env.connect(ds); ds.connect(delaySend);
  }


  // ── ELECTRIC PIANO — Rhodes: FM tine model, proper AM tremolo ────────
  // FM pair 1: fundamental tine (vel drives modulation index = brightness).
  // FM pair 2: upper harmonic. Tremolo is AM (multiply after envelope).

  function _synthEPiano(time, freq, vel, decay) {
    var end = time + decay + 0.5;

    // FM pair 1: fundamental
    var mod1 = ctx.createOscillator(); mod1.type = 'sine'; mod1.frequency.value = freq;
    var mod1G = ctx.createGain();
    var modIdx = 2.5 + vel * 1.8;
    mod1G.gain.setValueAtTime(freq * modIdx, time);
    mod1G.gain.exponentialRampToValueAtTime(freq * 0.12, time + decay * 0.35);
    var car1 = ctx.createOscillator(); car1.type = 'sine'; car1.frequency.value = freq;
    mod1.connect(mod1G); mod1G.connect(car1.frequency);

    // FM pair 2: upper harmonic
    var mod2 = ctx.createOscillator(); mod2.type = 'sine'; mod2.frequency.value = freq * 2.01;
    var mod2G = ctx.createGain();
    mod2G.gain.setValueAtTime(freq * 1.2, time);
    mod2G.gain.exponentialRampToValueAtTime(freq * 0.04, time + decay * 0.2);
    var car2 = ctx.createOscillator(); car2.type = 'sine'; car2.frequency.value = freq * 2.01;
    mod2.connect(mod2G); mod2G.connect(car2.frequency);
    var c2gain = ctx.createGain(); c2gain.gain.value = 0.28; car2.connect(c2gain);

    // Envelope
    var env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(Math.min(0.65, vel * 0.60), time + 0.004);
    env.gain.setTargetAtTime(vel * 0.44, time + 0.004, 0.09);
    env.gain.setTargetAtTime(0.0001, time + decay * 0.5, decay * 0.38);

    // AM tremolo (NOT additive — the original bug fix from v1)
    var tremoloGain = ctx.createGain(); tremoloGain.gain.value = 1;
    var trem = ctx.createOscillator(); trem.type = 'sine'; trem.frequency.value = 4.8;
    var tremDepth = ctx.createGain(); tremDepth.gain.value = 0.11 * vel;
    trem.connect(tremDepth); tremDepth.connect(tremoloGain.gain);

    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4200; lp.Q.value = 0.4;
    car1.connect(env); c2gain.connect(env);
    env.connect(tremoloGain); tremoloGain.connect(lp); lp.connect(sidechainGain);
    var rs = ctx.createGain(); rs.gain.value = 0.20; lp.connect(rs); rs.connect(reverbSend);
    var ds = ctx.createGain(); ds.gain.value = 0.18; lp.connect(ds); ds.connect(delaySend);

    mod1.start(time); mod1.stop(end); car1.start(time); car1.stop(end);
    mod2.start(time); mod2.stop(end); car2.start(time); car2.stop(end);
    trem.start(time); trem.stop(end);
  }


  // ── PLUCK — harp/pizzicato ────────────────────────────────────────────
  // Noise excitation through resonant bandpass = physical string model.
  // Short bright attack, decaying body, filter closes with note.

  function _synthPluck(time, freq, vel, decay) {
    // Noise excitation
    var excLen = Math.floor(ctx.sampleRate * 0.004);
    var excBuf = ctx.createBuffer(1, excLen, ctx.sampleRate);
    var ed = excBuf.getChannelData(0);
    for (var i = 0; i < excLen; i++) ed[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / excLen, 2);
    var excSrc = ctx.createBufferSource(); excSrc.buffer = excBuf;

    // Resonant body filters
    var body = ctx.createBiquadFilter();
    body.type = 'bandpass'; body.frequency.value = freq; body.Q.value = 60;
    var body2 = ctx.createBiquadFilter();
    body2.type = 'bandpass'; body2.frequency.value = freq * 2; body2.Q.value = 30;
    var b2g = ctx.createGain(); b2g.gain.value = 0.25;

    // Sustain oscillator
    var osc = ctx.createOscillator(); osc.type = 'triangle'; osc.frequency.value = freq;
    var oscEnv = ctx.createGain();
    oscEnv.gain.setValueAtTime(vel * 0.6, time);
    oscEnv.gain.exponentialRampToValueAtTime(0.001, time + decay * 0.6);

    // Master envelope
    var env = ctx.createGain();
    env.gain.setValueAtTime(Math.min(0.65, vel * 0.60), time);
    env.gain.exponentialRampToValueAtTime(0.0001, time + decay);

    excSrc.connect(body); body.connect(env);
    excSrc.connect(body2); body2.connect(b2g); b2g.connect(env);
    osc.connect(oscEnv); oscEnv.connect(env);
    env.connect(sidechainGain);

    var rs = ctx.createGain(); rs.gain.value = 0.25; env.connect(rs); rs.connect(reverbSend);
    var ds = ctx.createGain(); ds.gain.value = 0.15; env.connect(ds); ds.connect(delaySend);

    excSrc.start(time); excSrc.stop(time + 0.006);
    osc.start(time); osc.stop(time + decay + 0.1);
  }


  // ── STAB — resonant filter sweep, punchy ──────────────────────────────
  // Square + sine through steep resonant LP that sweeps down fast.
  // The "punch" of EDM — felt in the chest, gone before you think.

  function _synthStab(time, freq, vel) {
    var filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(3500, time);
    filt.frequency.exponentialRampToValueAtTime(250, time + 0.08);
    filt.Q.value = 6;

    var env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(Math.min(0.65, vel * 0.60), time + 0.001);
    env.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    var o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = freq;
    var oG = ctx.createGain(); oG.gain.value = 0.6; o.connect(oG);
    var sub = ctx.createOscillator(); sub.type = 'sine'; sub.frequency.value = freq;

    oG.connect(filt); sub.connect(filt); filt.connect(env);
    env.connect(sidechainGain);
    var rs = ctx.createGain(); rs.gain.value = 0.08; env.connect(rs); rs.connect(reverbSend);
    o.start(time); o.stop(time + 0.2); sub.start(time); sub.stop(time + 0.2);
  }


  // ── FORMANT — vocal synthesis ─────────────────────────────────────────
  // Two detuned saws through three bandpass filters (vowel formants).
  // LFO morphs formant frequencies — the vowel slowly changes.

  function _synthFormant(time, freq, vel, decay) {
    var o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = freq;
    var o2 = ctx.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = freq;
    o2.detune.value = 7;

    // Vowel formant filters (default 'ah')
    var f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 700;  f1.Q.value = 5;
    var f2 = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 1100; f2.Q.value = 5;
    var f3 = ctx.createBiquadFilter(); f3.type = 'bandpass'; f3.frequency.value = 2400; f3.Q.value = 5;

    // Morph LFO — vowel slowly drifts
    var morphLfo = ctx.createOscillator(); morphLfo.type = 'sine'; morphLfo.frequency.value = 0.4;
    var morph1 = ctx.createGain(); morph1.gain.value = 150;
    morphLfo.connect(morph1); morph1.connect(f1.frequency);
    var morph2 = ctx.createGain(); morph2.gain.value = 200;
    morphLfo.connect(morph2); morph2.connect(f2.frequency);

    var f1g = ctx.createGain(); f1g.gain.value = 0.45;
    var f2g = ctx.createGain(); f2g.gain.value = 0.35;
    var f3g = ctx.createGain(); f3g.gain.value = 0.15;

    var mix = ctx.createGain();
    o.connect(f1); o.connect(f2); o.connect(f3);
    o2.connect(f1); o2.connect(f2); o2.connect(f3);
    f1.connect(f1g); f2.connect(f2g); f3.connect(f3g);
    f1g.connect(mix); f2g.connect(mix); f3g.connect(mix);

    var env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.setTargetAtTime(vel * 0.82, time, 0.022);
    env.gain.setTargetAtTime(vel * 0.38, time + 0.07, 0.28);
    env.gain.setTargetAtTime(0.0001, time + decay * 0.6, decay * 0.3);

    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2800; lp.Q.value = 0.5;
    mix.connect(env); env.connect(lp); lp.connect(sidechainGain);
    var rs = ctx.createGain(); rs.gain.value = 0.5; lp.connect(rs); rs.connect(reverbSend);

    var end = time + decay + 0.5;
    o.start(time); o.stop(end); o2.start(time); o2.stop(end);
    morphLfo.start(time); morphLfo.stop(end);
  }


  // ── MASSIVE — Phase-dependent unison build ────────────────────────────
  // Phase 0: naked saw (raw, thin, honest)
  // Phase 1: + octave below + perfect fifth (weight and fullness)
  // Phase 3: + +-2 cent chorus pair (whisper of width)
  // Phase 4: + +-13 cent voices (THE DROP — shimmer + portamento)
  // Each phase earned by user engagement. The drop is the release.

  function _synthMassive(time, freq, vel, dur) {
    var voices = [
      { r: 1.0, d: 0, g: 0.38 },  // always: naked root
    ];
    if (_massivePhase >= 1) {
      voices.push({ r: 0.5, d: 0, g: 0.28 });  // octave below
      voices.push({ r: 1.5, d: 0, g: 0.20 });  // perfect fifth
    }
    if (_massivePhase >= 3) {
      voices.push({ r: 1.0, d: -2, g: 0.16 }); // +-2 chorus
      voices.push({ r: 1.0, d:  2, g: 0.16 });
    }
    if (_massivePhase >= 4) {
      voices.push({ r: 1.0, d: -13, g: 0.13 }); // +-13 DROP
      voices.push({ r: 1.0, d:  13, g: 0.13 });
    }

    // Normalize gains so sum stays under 0.90
    var gainSum = 0;
    for (var vi = 0; vi < voices.length; vi++) gainSum += voices[vi].g;
    var normK = Math.min(1.0, 0.82 / gainSum);

    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 2600; lp.Q.value = 1.2;

    var env = ctx.createGain();
    env.gain.setValueAtTime(0.001, time);
    env.gain.linearRampToValueAtTime(Math.min(0.82, vel * 0.74), time + 0.013);
    env.gain.setTargetAtTime(vel * 0.40, time + 0.042, dur * 0.30);
    env.gain.linearRampToValueAtTime(0.001, time + dur);

    // Portamento at phase 4
    var prevF = (_massivePhase >= 4 && _massiveLastFreq > 20) ? _massiveLastFreq : 0;
    _massiveLastFreq = freq;

    for (var j = 0; j < voices.length; j++) {
      var v = voices[j];
      var o = ctx.createOscillator(); o.type = 'sawtooth';
      var targetF = freq * v.r;
      if (prevF > 0) {
        o.frequency.setValueAtTime(prevF * v.r, time);
        o.frequency.linearRampToValueAtTime(targetF, time + 0.14);
      } else {
        o.frequency.value = targetF;
      }
      o.detune.value = v.d;
      var g = ctx.createGain(); g.gain.value = v.g * normK;
      o.connect(g); g.connect(lp);
      o.start(time); o.stop(time + dur + 0.12);
    }

    lp.connect(env); env.connect(sidechainGain);
    var rs = ctx.createGain(); rs.gain.value = 0.28; env.connect(rs); rs.connect(reverbSend);
    var ds = ctx.createGain(); ds.gain.value = 0.44; env.connect(ds); ds.connect(delaySend);
  }


  // ── GRIDSTACK — TikTok supersaw: stacked intervals + unison detune ───
  // Root + minor 3rd + P5 + minor 7th + octave, each with detuned copies.
  // Resonant filter sweeps open on attack = the "viral whoop."

  function _synthGridstack(time, freq, vel, decay) {
    var dur = decay || 0.45;

    var stack = [
      { ratio: 1.0,    det: [0, -10,  10], wt: [0.40, 0.24, 0.24] },
      { ratio: 1.1892, det: [0,  +8     ], wt: [0.26, 0.16       ] },
      { ratio: 1.4983, det: [0,  -8     ], wt: [0.28, 0.18       ] },
      { ratio: 1.7818, det: [0,  +6     ], wt: [0.18, 0.12       ] },
      { ratio: 2.0,    det: [0,  -5     ], wt: [0.22, 0.14       ] },
    ];

    // Resonant sweep: sealed → rips open
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(180, time);
    lp.frequency.linearRampToValueAtTime(3800 + vel * 2200, time + 0.05);
    lp.frequency.setTargetAtTime(2000, time + 0.05, dur * 0.35);
    lp.Q.value = 3.0;

    var hp = ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 65; hp.Q.value = 0.5;

    for (var si = 0; si < stack.length; si++) {
      var s = stack[si];
      var iFreq = freq * s.ratio;
      for (var di = 0; di < s.det.length; di++) {
        var o = ctx.createOscillator(); o.type = 'sawtooth';
        o.frequency.value = iFreq; o.detune.value = s.det[di];
        var dg = ctx.createGain(); dg.gain.value = s.wt[di];
        o.connect(dg); dg.connect(hp);
        o.start(time); o.stop(time + dur + 0.2);
      }
    }

    // Sub octave sine — chest resonance
    var subO = ctx.createOscillator(); subO.type = 'sine';
    subO.frequency.value = freq * 0.5;
    var subG = ctx.createGain();
    subG.gain.setValueAtTime(0.001, time);
    subG.gain.linearRampToValueAtTime(vel * 0.44, time + 0.010);
    subG.gain.setTargetAtTime(0.001, time + dur * 0.28, dur * 0.38);
    subO.connect(subG); subG.connect(sidechainGain);
    subO.start(time); subO.stop(time + dur + 0.2);

    // Punchy envelope
    var env = ctx.createGain();
    env.gain.setValueAtTime(0.001, time);
    env.gain.linearRampToValueAtTime(vel * 0.64, time + 0.007);
    env.gain.setTargetAtTime(vel * 0.32, time + 0.030, dur * 0.18);
    env.gain.linearRampToValueAtTime(0.001, time + dur);

    hp.connect(lp); lp.connect(env); env.connect(sidechainGain);
    var rs = ctx.createGain(); rs.gain.value = 0.22; env.connect(rs); rs.connect(reverbSend);
    var ds = ctx.createGain(); ds.gain.value = 0.58; env.connect(ds); ds.connect(delaySend);
  }


  // ── UPRIGHT BASS — walking bass: formant body, string buzz ────────────

  function _synthUpright(time, freq, vel) {
    var formant = ctx.createBiquadFilter();
    formant.type = 'peaking'; formant.frequency.value = 700;
    formant.Q.value = 2; formant.gain.value = 5;
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 1100; lp.Q.value = 0.8;

    var env = ctx.createGain();
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(vel, time + 0.005);
    env.gain.setTargetAtTime(vel * 0.55, time + 0.005, 0.1);
    env.gain.exponentialRampToValueAtTime(0.001, time + 0.6);

    var o1 = ctx.createOscillator(); o1.type = 'triangle'; o1.frequency.value = freq;
    var o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = freq;
    var subG = ctx.createGain(); subG.gain.value = 0.6; o2.connect(subG);

    // String buzz transient
    var bLen = Math.floor(ctx.sampleRate * 0.008);
    var bBuf = ctx.createBuffer(1, bLen, ctx.sampleRate);
    var bd = bBuf.getChannelData(0);
    for (var i = 0; i < bLen; i++) bd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bLen, 5);
    var bSrc = ctx.createBufferSource(); bSrc.buffer = bBuf;
    var bG = ctx.createGain(); bG.gain.value = vel * 0.2; bSrc.connect(bG);

    o1.connect(formant); subG.connect(formant); bG.connect(formant);
    formant.connect(lp); lp.connect(env); env.connect(sidechainGain);
    var rs = ctx.createGain(); rs.gain.value = 0.2; env.connect(rs); rs.connect(reverbSend);

    o1.start(time); o1.stop(time + 0.55);
    o2.start(time); o2.stop(time + 0.55);
    bSrc.start(time); bSrc.stop(time + 0.012);
  }


  // ── FM — DX7 metallic timbres ─────────────────────────────────────────
  // Carrier + modulator pair with decaying modulation index.
  // Second carrier at octave for shimmer.

  function _synthFM(time, freq, vel, decay, opts) {
    var ratio = (opts && opts.ratio) || 3;
    var index = (opts && opts.index) || 6;

    var mod = ctx.createOscillator(); mod.type = 'sine';
    mod.frequency.value = freq * ratio;
    var modG = ctx.createGain();
    modG.gain.setValueAtTime(freq * index * 0.6, time);
    modG.gain.exponentialRampToValueAtTime(freq * index * 0.04, time + decay * 0.4);

    var car = ctx.createOscillator(); car.type = 'sine'; car.frequency.value = freq;
    mod.connect(modG); modG.connect(car.frequency);

    var car2 = ctx.createOscillator(); car2.type = 'sine'; car2.frequency.value = freq * 2;
    var c2g = ctx.createGain(); c2g.gain.value = 0.25; car2.connect(c2g);

    var env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(Math.min(0.65, vel * 0.60), time + 0.003);
    env.gain.setTargetAtTime(vel * 0.46, time + 0.003, 0.07);
    env.gain.setTargetAtTime(0.0001, time + decay * 0.4, decay * 0.3);

    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3000; lp.Q.value = 0.5;
    car.connect(env); c2g.connect(env);
    env.connect(lp); lp.connect(sidechainGain);
    var rs = ctx.createGain(); rs.gain.value = 0.15; lp.connect(rs); rs.connect(reverbSend);
    var ds = ctx.createGain(); ds.gain.value = 0.25; lp.connect(ds); ds.connect(delaySend);

    var end = time + decay + 0.3;
    mod.start(time); mod.stop(end);
    car.start(time); car.stop(end);
    car2.start(time); car2.stop(end);
  }


  // ── GLITCH — unstable pitch, distorted ────────────────────────────────

  function _synthGlitch(time, freq, vel) {
    var waves = ['sawtooth', 'square', 'triangle'];
    var o = ctx.createOscillator();
    o.type = waves[Math.floor(Math.random() * waves.length)];
    o.frequency.value = freq;

    var lfo = ctx.createOscillator(); lfo.type = 'sine';
    lfo.frequency.value = 2 + Math.random() * 8;
    var lG = ctx.createGain();
    lG.gain.value = freq * (0.02 + Math.random() * 0.05);
    lfo.connect(lG); lG.connect(o.frequency);

    var dist = ctx.createWaveShaper();
    var n = 64, curve = new Float32Array(n);
    for (var i = 0; i < n; i++) { var x = (i * 2) / n - 1; curve[i] = Math.tanh(x * 3); }
    dist.curve = curve;

    var env = ctx.createGain();
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(vel * 0.6, time + 0.004);
    env.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2500; lp.Q.value = 0.5;
    o.connect(dist); dist.connect(env); env.connect(lp); lp.connect(sidechainGain);
    var rs = ctx.createGain(); rs.gain.value = 0.15; lp.connect(rs); rs.connect(reverbSend);
    o.start(time); o.stop(time + 0.4); lfo.start(time); lfo.stop(time + 0.4);
  }


  // ── SIMPLE — fallback: single oscillator ──────────────────────────────

  function _synthSimple(time, freq, vel, decay) {
    var o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = freq;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(vel * 0.5, time + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, time + decay);

    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3000; lp.Q.value = 0.5;
    o.connect(g); g.connect(lp); lp.connect(sidechainGain);
    var rs = ctx.createGain(); rs.gain.value = 0.18; lp.connect(rs); rs.connect(reverbSend);
    var ds = ctx.createGain(); ds.gain.value = 0.2;  lp.connect(ds); ds.connect(delaySend);
    o.start(time); o.stop(time + decay + 0.1);
  }


  // ══════════════════════════════════════════════════════════════════════
  // ██ DRUM SYNTHESIS
  // ══════════════════════════════════════════════════════════════════════
  //
  // All drums are synthesized, not samples. Each instrument supports
  // multiple kits: 'acoustic' (default), '808', 'tribal', 'brushes', 'glitch'.
  //
  // playDrum(instrument, time, velocity, kit) is the single entry point.

  function playDrum(instrument, time, velocity, kit) {
    try {
      if (!ctx) return;
      var t   = time || ctx.currentTime;
      var vel = Math.max(0.01, Math.min(1, velocity || 0.5));
      var k   = kit || 'acoustic';

      switch (instrument) {
        case 'kick':   _drumKick(t, vel, k);   break;
        case 'snare':  _drumSnare(t, vel, k);  break;
        case 'hat':    _drumHat(t, vel, k);    break;
        case 'shaker': _drumShaker(t, vel);    break;
        case 'perc':   _drumPerc(t, vel, k);   break;
        default:
          if (typeof console !== 'undefined') console.warn('[Sound.playDrum] Unknown:', instrument);
      }
    } catch (e) {
      if (typeof console !== 'undefined') console.warn('[Sound.playDrum]', e.message);
    }
  }


  // ── KICK ──────────────────────────────────────────────────────────────

  function _drumKick(time, vel, kit) {
    var o = ctx.createOscillator(); o.type = 'sine';

    if (kit === '808') {
      // 4-layer 808 kick: click + body + sub tail + saturation
      // The sub tail IS the bass in EDM

      // Layer 1: Click — noise burst HP 3500Hz, 5ms snap
      var clickLen = Math.floor(ctx.sampleRate * 0.005);
      var clickBuf = ctx.createBuffer(1, clickLen, ctx.sampleRate);
      var cd = clickBuf.getChannelData(0);
      for (var ci = 0; ci < clickLen; ci++) cd[ci] = (Math.random() * 2 - 1) * Math.pow(1 - ci / clickLen, 0.3);
      var clickSrc = ctx.createBufferSource(); clickSrc.buffer = clickBuf;
      var clickHP = ctx.createBiquadFilter(); clickHP.type = 'highpass'; clickHP.frequency.value = 3500;

      // Layer 2: Body — sine 220→subFreq over 35ms
      var bodyO = ctx.createOscillator(); bodyO.type = 'sine';
      bodyO.frequency.setValueAtTime(220, time);
      bodyO.frequency.exponentialRampToValueAtTime(_edm808SubFreq || 55, time + 0.035);
      var bodyG = ctx.createGain();
      bodyG.gain.setValueAtTime(0.85 * vel, time);
      bodyG.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

      // Saturation on click+body — tanh warmth
      var sat808 = ctx.createWaveShaper();
      var satN = 256, satCurve = new Float32Array(satN);
      for (var si = 0; si < satN; si++) {
        var sx = (si * 2) / satN - 1;
        satCurve[si] = Math.tanh(sx * 2.5);
      }
      sat808.curve = satCurve; sat808.oversample = '2x';

      var clickG = ctx.createGain();
      clickG.gain.setValueAtTime(0.7 * vel, time);
      clickG.gain.exponentialRampToValueAtTime(0.001, time + 0.005);
      clickSrc.connect(clickHP); clickHP.connect(clickG); clickG.connect(sat808);
      bodyO.connect(bodyG); bodyG.connect(sat808);
      sat808.connect(drumBus);
      clickSrc.start(time); clickSrc.stop(time + 0.006);
      bodyO.start(time); bodyO.stop(time + 0.18);

      // Layer 3: Sub tail — sine at root freq
      var subFreq = _edm808SubFreq || 55;
      o.frequency.value = subFreq;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.001, time);
      g.gain.linearRampToValueAtTime(0.55 * vel, time + 0.008);
      g.gain.setTargetAtTime(0.001, time + 0.18, 0.18);
      o.connect(g); g.connect(drumBus);
      o.start(time); o.stop(time + 0.6);

    } else if (kit === 'tribal') {
      // Djembe — warm body, NO click, long resonance
      o.type = 'triangle';
      o.frequency.setValueAtTime(120 + 20 * vel, time);
      o.frequency.exponentialRampToValueAtTime(55, time + 0.06);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.001, time);
      g.gain.linearRampToValueAtTime(0.80 * vel, time + 0.003);
      g.gain.setTargetAtTime(0.001, time + 0.06, 0.12);
      var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 400;
      o.connect(lp); lp.connect(g); g.connect(drumBus);
      o.start(time); o.stop(time + 0.5);

      // Sub resonance
      var subO = ctx.createOscillator(); subO.type = 'sine'; subO.frequency.value = 65;
      var subG = ctx.createGain();
      subG.gain.setValueAtTime(0.45 * vel, time + 0.005);
      subG.gain.setTargetAtTime(0.001, time + 0.08, 0.10);
      subO.connect(subG); subG.connect(drumBus);
      subO.start(time); subO.stop(time + 0.45);

    } else if (kit === 'brushes') {
      o.frequency.setValueAtTime(80, time);
      o.frequency.exponentialRampToValueAtTime(40, time + 0.04);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.2 * vel, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
      o.connect(g); g.connect(drumBus);
      o.start(time); o.stop(time + 0.2);

    } else if (kit === 'glitch') {
      o.frequency.setValueAtTime(200 + Math.random() * 100, time);
      o.frequency.exponentialRampToValueAtTime(30, time + 0.03);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.6 * vel, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
      o.connect(g); g.connect(drumBus);
      o.start(time); o.stop(time + 0.15);

    } else {
      // Acoustic kick: click transient + body sweep + sub tail
      // Layer 1: Click
      var clickLen = Math.floor(ctx.sampleRate * 0.005);
      var clickBuf = ctx.createBuffer(1, clickLen, ctx.sampleRate);
      var cd = clickBuf.getChannelData(0);
      for (var ci = 0; ci < clickLen; ci++) cd[ci] = (Math.random() * 2 - 1) * Math.pow(1 - ci / clickLen, 0.5);
      var clickSrc = ctx.createBufferSource(); clickSrc.buffer = clickBuf;
      var clickHP = ctx.createBiquadFilter(); clickHP.type = 'highpass'; clickHP.frequency.value = 3000;
      var clickG = ctx.createGain();
      clickG.gain.setValueAtTime(0.88 * vel, time);
      clickG.gain.exponentialRampToValueAtTime(0.001, time + 0.006);
      clickSrc.connect(clickHP); clickHP.connect(clickG); clickG.connect(drumBus);
      clickSrc.start(time); clickSrc.stop(time + 0.007);

      // Layer 2: Body sweep
      o.frequency.setValueAtTime(155 + 25 * vel, time);
      o.frequency.exponentialRampToValueAtTime(45, time + 0.18);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.90 * vel, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
      o.connect(g); g.connect(drumBus);
      o.start(time); o.stop(time + 0.25);

      // Layer 3: Sub tail
      var subO = ctx.createOscillator(); subO.type = 'sine'; subO.frequency.value = 45;
      var subG = ctx.createGain();
      subG.gain.setValueAtTime(0.55 * vel, time + 0.008);
      subG.gain.exponentialRampToValueAtTime(0.001, time + 0.38);
      subO.connect(subG); subG.connect(drumBus);
      subO.start(time + 0.008); subO.stop(time + 0.40);
    }

    pumpSidechain(vel);
  }


  // ── SNARE ─────────────────────────────────────────────────────────────

  function _drumSnare(time, vel, kit) {
    if (kit === '808') {
      // Layered noise bursts
      for (var c = 0; c < 3; c++) {
        var t = time + c * 0.015;
        var len = ctx.sampleRate * 0.08;
        var buf = ctx.createBuffer(1, len, ctx.sampleRate);
        var d = buf.getChannelData(0);
        for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
        var src = ctx.createBufferSource(); src.buffer = buf;
        var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1000; bp.Q.value = 1;
        var g = ctx.createGain();
        g.gain.setValueAtTime(0.35 * vel, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        src.connect(bp); bp.connect(g); g.connect(drumBus);
        src.start(t); src.stop(t + 0.15);
      }

    } else if (kit === 'tribal') {
      // Hand slap — warm body, short transient
      var slapLen = Math.floor(ctx.sampleRate * 0.015);
      var slapBuf = ctx.createBuffer(1, slapLen, ctx.sampleRate);
      var sd = slapBuf.getChannelData(0);
      for (var si = 0; si < slapLen; si++) sd[si] = (Math.random() * 2 - 1) * Math.pow(1 - si / slapLen, 0.6);
      var slapSrc = ctx.createBufferSource(); slapSrc.buffer = slapBuf;
      var slapBP = ctx.createBiquadFilter(); slapBP.type = 'bandpass'; slapBP.frequency.value = 1200; slapBP.Q.value = 1.2;
      var slapG = ctx.createGain();
      slapG.gain.setValueAtTime(0.40 * vel, time);
      slapG.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
      slapSrc.connect(slapBP); slapBP.connect(slapG); slapG.connect(drumBus);
      slapSrc.start(time); slapSrc.stop(time + 0.08);

      // Body tone
      var toneO = ctx.createOscillator(); toneO.type = 'sine';
      toneO.frequency.setValueAtTime(280, time);
      toneO.frequency.exponentialRampToValueAtTime(180, time + 0.05);
      var toneG = ctx.createGain();
      toneG.gain.setValueAtTime(0.30 * vel, time);
      toneG.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
      toneO.connect(toneG); toneG.connect(drumBus);
      toneO.start(time); toneO.stop(time + 0.22);

    } else if (kit === 'brushes') {
      var len = ctx.sampleRate * 0.2;
      var buf = ctx.createBuffer(1, len, ctx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.5) * 0.3;
      var src = ctx.createBufferSource(); src.buffer = buf;
      var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2000; bp.Q.value = 0.5;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.15 * vel, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
      src.connect(bp); bp.connect(g); g.connect(drumBus);
      src.start(time); src.stop(time + 0.25);

    } else if (kit === 'glitch') {
      var len = ctx.sampleRate * 0.06;
      var buf = ctx.createBuffer(1, len, ctx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() > 0.5 ? 0.5 : -0.5;
      var src = ctx.createBufferSource(); src.buffer = buf;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.3 * vel, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
      src.connect(g); g.connect(drumBus);
      src.start(time); src.stop(time + 0.08);

    } else {
      // Acoustic snare: crack + body + wire rattle
      // Layer 1: Crack — bright stick impact
      var crackLen = Math.floor(ctx.sampleRate * 0.08);
      var crackBuf = ctx.createBuffer(1, crackLen, ctx.sampleRate);
      var crd = crackBuf.getChannelData(0);
      for (var ci = 0; ci < crackLen; ci++) crd[ci] = (Math.random() * 2 - 1) * Math.pow(1 - ci / crackLen, 0.4);
      var crackSrc = ctx.createBufferSource(); crackSrc.buffer = crackBuf;
      var crackHP = ctx.createBiquadFilter(); crackHP.type = 'highpass';
      crackHP.frequency.setValueAtTime(600, time);
      crackHP.frequency.exponentialRampToValueAtTime(3200, time + 0.07);
      var crackG = ctx.createGain();
      crackG.gain.setValueAtTime(0.72 * vel, time);
      crackG.gain.exponentialRampToValueAtTime(0.001, time + 0.16);
      crackSrc.connect(crackHP); crackHP.connect(crackG); crackG.connect(drumBus);
      crackSrc.start(time); crackSrc.stop(time + 0.18);

      // Layer 2: Body — shell tone
      var bodyO = ctx.createOscillator(); bodyO.type = 'triangle';
      bodyO.frequency.setValueAtTime(220, time);
      bodyO.frequency.exponentialRampToValueAtTime(140, time + 0.08);
      var bodyG = ctx.createGain();
      bodyG.gain.setValueAtTime(0.55 * vel, time);
      bodyG.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
      bodyO.connect(bodyG); bodyG.connect(drumBus);
      bodyO.start(time); bodyO.stop(time + 0.14);

      // Layer 3: Wire rattle
      var wireLen = Math.floor(ctx.sampleRate * 0.22);
      var wireBuf = ctx.createBuffer(1, wireLen, ctx.sampleRate);
      var wrd = wireBuf.getChannelData(0);
      for (var wi = 0; wi < wireLen; wi++) wrd[wi] = (Math.random() * 2 - 1) * Math.pow(1 - wi / wireLen, 1.0);
      var wireSrc = ctx.createBufferSource(); wireSrc.buffer = wireBuf;
      var wireBP = ctx.createBiquadFilter(); wireBP.type = 'bandpass'; wireBP.frequency.value = 3500; wireBP.Q.value = 0.6;
      var wireG = ctx.createGain();
      wireG.gain.setValueAtTime(0.45 * vel, time);
      wireG.gain.exponentialRampToValueAtTime(0.001, time + 0.24);
      wireSrc.connect(wireBP); wireBP.connect(wireG); wireG.connect(drumBus);
      wireSrc.start(time); wireSrc.stop(time + 0.26);
    }
  }


  // ── HAT ───────────────────────────────────────────────────────────────
  // Inharmonic metallic oscillators — the actual spectrum of a hi-hat.
  // Ratios from physical modeling of struck metal plates.

  function _drumHat(time, vel, kit) {
    var ratios = [1.0, 1.483, 1.932, 2.546, 3.111, 3.637];

    if (kit === 'tribal') {
      // Shaker hit — filtered noise, warm and organic
      var shLen = Math.floor(ctx.sampleRate * 0.035);
      var shBuf = ctx.createBuffer(1, shLen, ctx.sampleRate);
      var shd = shBuf.getChannelData(0);
      for (var i = 0; i < shLen; i++) shd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / shLen, 1.2);
      var shSrc = ctx.createBufferSource(); shSrc.buffer = shBuf;
      var shBP = ctx.createBiquadFilter(); shBP.type = 'bandpass'; shBP.frequency.value = 4000; shBP.Q.value = 0.4;
      var shG = ctx.createGain();
      shG.gain.setValueAtTime(0.12 * vel, time);
      shG.gain.exponentialRampToValueAtTime(0.001, time + 0.035);
      shSrc.connect(shBP); shBP.connect(shG); shG.connect(drumBus);
      shSrc.start(time); shSrc.stop(time + 0.04);
      return;
    }

    var baseFreq, dur, masterVol;
    if (kit === '808')         { baseFreq = 400; dur = 0.055; masterVol = 0.22; }
    else if (kit === 'brushes'){ baseFreq = 320; dur = 0.095; masterVol = 0.11; }
    else if (kit === 'glitch') { baseFreq = 600; dur = 0.022; masterVol = 0.28; }
    else                       { baseFreq = 440; dur = 0.048; masterVol = 0.20; }

    // Square oscillators at metallic ratios
    for (var r = 0; r < ratios.length; r++) {
      var o = ctx.createOscillator(); o.type = 'square';
      o.frequency.value = baseFreq * ratios[r];
      var bandP = ctx.createBiquadFilter(); bandP.type = 'highpass'; bandP.frequency.value = 6000;
      var oG = ctx.createGain();
      oG.gain.setValueAtTime(masterVol * vel * (1 - r * 0.09), time);
      oG.gain.exponentialRampToValueAtTime(0.001, time + dur);
      o.connect(bandP); bandP.connect(oG); oG.connect(drumBus);
      o.start(time); o.stop(time + dur + 0.005);
    }

    // HP noise layer — air and sizzle
    var noiseLen = Math.floor(ctx.sampleRate * dur);
    var noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
    var nd = noiseBuf.getChannelData(0);
    for (var i = 0; i < noiseLen; i++) nd[i] = (Math.random() * 2 - 1) * (1 - i / noiseLen);
    var noiseSrc = ctx.createBufferSource(); noiseSrc.buffer = noiseBuf;
    var noiseHP = ctx.createBiquadFilter(); noiseHP.type = 'highpass'; noiseHP.frequency.value = 7000;
    var noiseG = ctx.createGain();
    noiseG.gain.setValueAtTime(masterVol * 0.65 * vel, time);
    noiseG.gain.exponentialRampToValueAtTime(0.001, time + dur);
    noiseSrc.connect(noiseHP); noiseHP.connect(noiseG); noiseG.connect(drumBus);
    noiseSrc.start(time); noiseSrc.stop(time + dur + 0.005);
  }


  // ── SHAKER ────────────────────────────────────────────────────────────
  // Seeds in a gourd. Two-phase envelope: sharp attack then gentle rattle.

  function _drumShaker(time, vel, dur) {
    var duration = dur || 0.06;
    var len = Math.floor(ctx.sampleRate * duration);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) {
      var t = i / len;
      var env = t < 0.1 ? t / 0.1 : Math.pow(1 - (t - 0.1) / 0.9, 0.8);
      d[i] = (Math.random() * 2 - 1) * env;
    }
    var src = ctx.createBufferSource(); src.buffer = buf;
    var bp = ctx.createBiquadFilter(); bp.type = 'bandpass';
    bp.frequency.value = 3500 + Math.random() * 1500;
    bp.Q.value = 0.6;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.18 * vel, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + duration);
    src.connect(bp); bp.connect(g); g.connect(drumBus);
    src.start(time); src.stop(time + duration + 0.005);
  }


  // ── PERC — generic percussion (ride, timpani, etc.) ───────────────────
  // Kit-aware: acoustic = ride cymbal, tribal = frame drum, 808 = clap

  function _drumPerc(time, vel, kit) {
    if (kit === 'tribal') {
      // Low tom: triangle sweep with sub
      var o = ctx.createOscillator(); o.type = 'triangle';
      o.frequency.setValueAtTime(200, time);
      o.frequency.exponentialRampToValueAtTime(100, time + 0.08);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.35 * vel, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
      var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600;
      o.connect(lp); lp.connect(g); g.connect(drumBus);
      o.start(time); o.stop(time + 0.35);
    } else if (kit === '808') {
      // Clap: layered noise bursts with pre-delay
      for (var c = 0; c < 3; c++) {
        var cTime = time + c * 0.012;
        var len = Math.floor(ctx.sampleRate * 0.04);
        var buf = ctx.createBuffer(1, len, ctx.sampleRate);
        var d = buf.getChannelData(0);
        for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.5);
        var src = ctx.createBufferSource(); src.buffer = buf;
        var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = 0.8;
        var g = ctx.createGain();
        g.gain.setValueAtTime(0.25 * vel, cTime);
        g.gain.exponentialRampToValueAtTime(0.001, cTime + 0.08);
        src.connect(bp); bp.connect(g); g.connect(drumBus);
        src.start(cTime); src.stop(cTime + 0.1);
      }
    } else {
      // Ride cymbal: bell + shimmer + stick click
      var bell = ctx.createOscillator(); bell.type = 'square'; bell.frequency.value = 800;
      var bellFilt = ctx.createBiquadFilter();
      bellFilt.type = 'bandpass'; bellFilt.frequency.value = 1800; bellFilt.Q.value = 1.5;
      var bellG = ctx.createGain();
      bellG.gain.setValueAtTime(0.10 * vel, time);
      bellG.gain.exponentialRampToValueAtTime(0.001, time + 0.6);
      bell.connect(bellFilt); bellFilt.connect(bellG); bellG.connect(drumBus);
      bell.start(time); bell.stop(time + 0.65);

      // Shimmer wash
      var shimLen = Math.floor(ctx.sampleRate * 0.5);
      var shimBuf = ctx.createBuffer(1, shimLen, ctx.sampleRate);
      var sd = shimBuf.getChannelData(0);
      for (var i = 0; i < shimLen; i++) sd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / shimLen, 0.4);
      var shimSrc = ctx.createBufferSource(); shimSrc.buffer = shimBuf;
      var shimBP = ctx.createBiquadFilter(); shimBP.type = 'bandpass'; shimBP.frequency.value = 2000; shimBP.Q.value = 1.0;
      var shimG = ctx.createGain();
      shimG.gain.setValueAtTime(0.10 * vel, time);
      shimG.gain.exponentialRampToValueAtTime(0.001, time + 0.7);
      shimSrc.connect(shimBP); shimBP.connect(shimG); shimG.connect(drumBus);
      shimSrc.start(time); shimSrc.stop(time + 0.75);
    }
  }


  // ══════════════════════════════════════════════════════════════════════
  // ██ VOID DRONE
  // ══════════════════════════════════════════════════════════════════════
  //
  // 6 harmonic partials + 3 wind bands → voidGain → masterHPF.
  // BYPASSES masterGain — so void sounds during silence when masterGain=0.
  //
  // Research: cardiovascular system resonates at 0.1 Hz (Lehrer & Gevirtz 2014).
  // Breathing at this rate strengthens vagal tone and produces calm.
  // The void drone breathes at 0.1 Hz — stillness becomes the body's
  // own resonance made audible.

  function _startVoidDrone(root) {
    if (voidOscs.length) return;
    var r = root || 432;

    voidGain = ctx.createGain();
    voidGain.gain.value = 0;
    voidGain.connect(reverbGain);
    voidGain.connect(masterHPF);  // BYPASSES masterGain

    // 0.1 Hz breathing LFO
    var voidLFO = ctx.createOscillator();
    voidLFO.type = 'sine';
    voidLFO.frequency.value = 0.1;
    var voidLFOGain = ctx.createGain();
    voidLFOGain.gain.value = 0.15;
    voidLFO.connect(voidLFOGain);
    voidLFOGain.connect(voidGain.gain);
    voidLFO.start();
    voidOscs.push(voidLFO);
    voidOscGains.push(voidLFOGain);

    var end = ctx.currentTime + 999;

    // ── HARMONIC PARTIALS — each breathes and drifts independently ────
    var partials = [
      { freq: r / 4,   gain: 0.42, ampRate: 0.031, ampDepth: 0.18, pitchRate: 0.018, pitchHz: 3 },
      { freq: r / 2,   gain: 0.36, ampRate: 0.047, ampDepth: 0.14, pitchRate: 0.027, pitchHz: 4 },
      { freq: r,       gain: 0.28, ampRate: 0.019, ampDepth: 0.10, pitchRate: 0.041, pitchHz: 5 },
      { freq: r * 4/3, gain: 0.18, ampRate: 0.063, ampDepth: 0.12, pitchRate: 0.022, pitchHz: 6 },
      { freq: r * 3/2, gain: 0.12, ampRate: 0.038, ampDepth: 0.08, pitchRate: 0.055, pitchHz: 4 },
      { freq: r * 2,   gain: 0.08, ampRate: 0.052, ampDepth: 0.06, pitchRate: 0.033, pitchHz: 3 },
    ];

    for (var i = 0; i < partials.length; i++) {
      var p = partials[i];

      var osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = p.freq;
      osc.detune.value = (i % 3) - 1;

      // Pitch drift LFO
      var pLFO = ctx.createOscillator(); pLFO.type = 'sine';
      pLFO.frequency.value = p.pitchRate;
      var pLFOG = ctx.createGain(); pLFOG.gain.value = p.pitchHz;
      pLFO.connect(pLFOG); pLFOG.connect(osc.frequency);

      // Amplitude LFO — this partial swells and recedes
      var aLFO = ctx.createOscillator(); aLFO.type = 'sine';
      aLFO.frequency.value = p.ampRate;
      var aLFOG = ctx.createGain(); aLFOG.gain.value = p.gain * p.ampDepth;
      aLFO.connect(aLFOG);

      var g = ctx.createGain(); g.gain.value = p.gain;
      aLFOG.connect(g.gain);
      osc.connect(g); g.connect(voidGain);

      osc.start(); osc.stop(end);
      pLFO.start(); pLFO.stop(end);
      aLFO.start(); aLFO.stop(end);

      voidOscs.push(osc, pLFO, aLFO);
      voidOscGains.push(g);
    }

    // ── COSMIC WIND — noise bands at low / mid / high ────────────────
    var noiseLen = ctx.sampleRate * 4;
    var noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
    var nd = noiseBuf.getChannelData(0);
    var b0=0, b1=0, b2=0, b3=0, b4=0, b5=0;
    for (var ni = 0; ni < noiseLen; ni++) {
      var w = Math.random() * 2 - 1;
      b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759;
      b2=0.96900*b2+w*0.1538520; b3=0.86650*b3+w*0.3104856;
      b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980;
      nd[ni]=(b0+b1+b2+b3+b4+b5+w*0.5362)*0.11;
    }

    var windBands = [
      { center: 160,  Q: 2.5, g: 0.20, lfoRate: 0.041 },
      { center: 600,  Q: 1.8, g: 0.14, lfoRate: 0.027 },
      { center: 2200, Q: 2.2, g: 0.09, lfoRate: 0.058 },
    ];
    for (var wi = 0; wi < windBands.length; wi++) {
      var wb = windBands[wi];
      var ns = ctx.createBufferSource(); ns.buffer = noiseBuf; ns.loop = true;
      var bp = ctx.createBiquadFilter(); bp.type = 'bandpass';
      bp.frequency.value = wb.center; bp.Q.value = wb.Q;
      var wg = ctx.createGain(); wg.gain.value = wb.g;
      var wLFO = ctx.createOscillator(); wLFO.type = 'sine';
      wLFO.frequency.value = wb.lfoRate;
      var wLFOG = ctx.createGain(); wLFOG.gain.value = wb.g * 0.35;
      wLFO.connect(wLFOG); wLFOG.connect(wg.gain);
      ns.connect(bp); bp.connect(wg); wg.connect(voidGain);
      ns.start(); ns.stop(end);
      wLFO.start(); wLFO.stop(end);
      voidOscs.push(ns, wLFO);
      voidOscGains.push(wg);
    }
  }

  function _stopVoidDrone() {
    for (var i = 0; i < voidOscs.length; i++) {
      try { voidOscs[i].stop(); voidOscs[i].disconnect(); } catch (e) {}
    }
    for (var j = 0; j < voidOscGains.length; j++) {
      try { voidOscGains[j].disconnect(); } catch (e) {}
    }
    voidOscs = []; voidOscGains = [];
    try { if (voidGain) voidGain.disconnect(); } catch (e) {}
    voidGain = null;
  }

  // Called every frame by flow.js: manages fade in/out of void drone
  function setVoidBreath(phase, depth) {
    try {
      if (!ctx) return;
      if (depth > 0.05) {
        if (!voidOscs.length) _startVoidDrone();
        if (voidGain) {
          var target = depth * 0.42;
          voidGain.gain.value += (target - voidGain.gain.value) * 0.015;
        }
      } else if (voidOscs.length) {
        if (voidGain) {
          voidGain.gain.value *= 0.97;
          if (voidGain.gain.value < 0.003) _stopVoidDrone();
        }
      }
    } catch (e) {
      if (typeof console !== 'undefined') console.warn('[Sound.setVoidBreath]', e.message);
    }
  }

  function setVoidGain(level, rampTime) {
    try {
      if (!voidGain || !ctx) return;
      if (rampTime > 0) {
        voidGain.gain.setTargetAtTime(level, ctx.currentTime, rampTime);
      } else {
        voidGain.gain.value = level;
      }
    } catch (e) {
      if (typeof console !== 'undefined') console.warn('[Sound.setVoidGain]', e.message);
    }
  }


  // ══════════════════════════════════════════════════════════════════════
  // ██ MASTER CONTROLS
  // ══════════════════════════════════════════════════════════════════════

  function setMasterGain(level, rampTime) {
    try {
      if (!masterGain || !ctx) return;
      if (rampTime > 0) {
        masterGain.gain.setTargetAtTime(level, ctx.currentTime, rampTime);
      } else {
        masterGain.gain.value = level;
      }
    } catch (e) {}
  }

  function setFilter(freq, rampTime) {
    try {
      if (!masterLP || !ctx) return;
      var f = Math.max(80, Math.min(12000, freq));
      if (rampTime > 0) {
        masterLP.frequency.setTargetAtTime(f, ctx.currentTime, rampTime);
      } else {
        masterLP.frequency.value = f;
      }
    } catch (e) {}
  }

  function setSpatial(pan, rampTime) {
    try {
      if (!spatialPanner || !ctx) return;
      var p = Math.max(-1, Math.min(1, pan));
      if (rampTime > 0) {
        spatialPanner.pan.setTargetAtTime(p, ctx.currentTime, rampTime);
      } else {
        spatialPanner.pan.value = p;
      }
    } catch (e) {}
  }

  function setReverbMix(level, rampTime) {
    try {
      if (!reverbSend || !ctx) return;
      if (rampTime > 0) {
        reverbSend.gain.setTargetAtTime(level, ctx.currentTime, rampTime);
      } else {
        reverbSend.gain.value = level;
      }
    } catch (e) {}
  }

  function setDelayMix(level, rampTime) {
    try {
      if (!delaySend || !ctx) return;
      if (rampTime > 0) {
        delaySend.gain.setTargetAtTime(level, ctx.currentTime, rampTime);
      } else {
        delaySend.gain.value = level;
      }
    } catch (e) {}
  }

  function setSidechainDepth(depth) {
    sidechainDepth = Math.max(0, Math.min(1, depth));
  }

  function set808SubFreq(freq) {
    _edm808SubFreq = freq || 55;
  }

  function setMassivePhase(p) {
    _massivePhase = Math.max(0, Math.min(4, p));
  }

  function resetPortamento() {
    _monoLastFreq = 0;
    _massiveLastFreq = 0;
  }


  // ══════════════════════════════════════════════════════════════════════
  // ██ PUBLIC API
  // ══════════════════════════════════════════════════════════════════════

  return Object.freeze({
    // Lifecycle
    init: init,
    configure: configure,

    // Synthesis
    play: play,
    playChord: playChord,

    // Drums
    playDrum: playDrum,

    // Continuous layers
    createLayer: createLayer,
    setLayerGain: setLayerGain,
    setLayerFreqs: setLayerFreqs,
    setLayerFilter: setLayerFilter,
    destroyLayer: destroyLayer,
    destroyAllLayers: destroyAllLayers,
    getLayer: getLayer,

    // Master controls
    setMasterGain: setMasterGain,
    setFilter: setFilter,
    setSpatial: setSpatial,
    pumpSidechain: pumpSidechain,
    setSidechainDepth: setSidechainDepth,

    // Void
    setVoidBreath: setVoidBreath,
    setVoidGain: setVoidGain,

    // Effects
    setReverbMix: setReverbMix,
    setDelayMix: setDelayMix,
    updateDelaySync: updateDelaySync,

    // Spatial
    updateSpatial: updateSpatial,
    setTouchPan: setTouchPan,

    // Voice state
    setMassivePhase: setMassivePhase,
    set808SubFreq: set808SubFreq,
    resetPortamento: resetPortamento,

    // Humanize helpers (exposed for flow.js timing)
    hTime: hTime,
    hVel: hVel,

    // Voice registry (read-only, for flow.js to inspect voice params)
    get voices() { return VOICES; },

    // Context access
    get ctx() { return ctx; },
    get currentTime() { return ctx ? ctx.currentTime : 0; },

    // Bus node access (for modules that need direct routing)
    get master() { return masterGain; },
    get sidechain() { return sidechainGain; },
    get reverbSendNode() { return reverbSend; },
    get delaySendNode() { return delaySend; },
    get drumBusNode() { return drumBus; },
    get reverbGainNode() { return reverbGain; },
    get masterHPFNode() { return masterHPF; },
  });
})();

// Expose globally
if (typeof window !== 'undefined') window.Sound = Sound;
