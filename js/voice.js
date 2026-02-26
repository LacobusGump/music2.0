/**
 * VOICE — The Orchestra
 *
 * Everything that makes sound lives here. 6 layers, effects chain,
 * drums, touch notes, gesture responses, void drone.
 *
 * The voice has NO opinions. Every parameter comes from the active lens.
 * Change the lens, change the entire musical world.
 */

const Voice = (function () {
  'use strict';

  // ── AUDIO CONTEXT + MASTER CHAIN ─────────────────────────────────────

  let ctx = null;
  let masterGain = null;
  let compressor = null;
  let sidechainGain = null;

  // Effects
  let convolver = null;
  let reverbSend = null;
  let reverbGain = null;
  let delayNode = null;
  let delayFeedback = null;
  let delayFilter = null;
  let delaySend = null;
  let delayMix = null;
  let saturator = null;

  // Drum bus
  let drumBus = null;
  let drumComp = null;

  // Crackle
  let crackleNode = null;
  let crackleGainNode = null;

  // ── LAYERS ───────────────────────────────────────────────────────────

  const layers = {
    pad:        { gain: null, oscs: [], filter: null, active: false, vol: 0 },
    atmosphere: { gain: null, oscs: [], filter: null, active: false, vol: 0 },
    bass:       { gain: null, oscs: [], filter: null, active: false, vol: 0 },
    strings:    { gain: null, oscs: [], filter: null, active: false, vol: 0 },
    shimmer:    { gain: null, oscs: [], filter: null, active: false, vol: 0 },
    choir:      { gain: null, oscs: [], filter: null, active: false, vol: 0 },
  };

  // ── STATE ────────────────────────────────────────────────────────────

  const state = {
    ready: false,
    lens: null,       // active lens object
    stage: 'EMERGING',
    stageIndex: 0,
    tempo: 80,
    groovePlaying: false,
    grooveStep: 0,
    nextStepTime: 0,
    filterFreq: 2000,
    harmonicRoot: 432,
    rootOffset: 0,
    energy: 0,
    intensity: 0,
    sidechainValue: 1,
    lastNoteTime: 0,
  };

  // Scale intervals (will be overridden by lens)
  let scale = [0, 2, 4, 7, 9, 11, 12, 14, 16, 19, 23, 24];

  // Stage thresholds + shifts (overridden by lens)
  const STAGES = [
    { name: 'EMERGING',     threshold: 0,   bpmBoost: 0,  shift: 0 },
    { name: 'FLOWING',      threshold: 100, bpmBoost: 3,  shift: 7 },
    { name: 'SURGING',      threshold: 400, bpmBoost: 8,  shift: 14 },
    { name: 'TRANSCENDENT', threshold: 800, bpmBoost: 12, shift: 19 },
  ];

  // ── DRUM PATTERNS ────────────────────────────────────────────────────

  const PATTERNS = {
    EMERGING: null,
    FLOWING: {
      kick:  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      snare: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      hat:   [0.3,0,0,0,0.3,0,0,0,0.3,0,0,0,0.3,0,0,0],
    },
    SURGING: {
      kick:  [1,0,0,0,0,0,0.4,0,0.9,0,0,0,0,0,0,0],
      snare: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      hat:   [0.5,0,0.3,0,0.5,0,0.3,0,0.5,0,0.3,0,0.5,0,0.3,0],
    },
    TRANSCENDENT: {
      kick:  [1,0,0,0,0,0,0.4,0,0.9,0,0,0,0,0,0.3,0],
      snare: [0,0,0,0,1,0,0,0.15,0,0,0,0,1,0,0,0.2],
      hat:   [0.5,0.15,0.3,0.15,0.5,0.15,0.3,0.15,0.5,0.15,0.3,0.15,0.5,0.15,0.3,0.15],
    },
  };

  // ── MUSIC THEORY HELPERS ─────────────────────────────────────────────

  function semitoneToFreq(root, semitones) {
    return root * Math.pow(2, semitones / 12);
  }

  function scaleNote(index) {
    const oct = Math.floor(index / scale.length);
    const deg = index % scale.length;
    return scale[deg < 0 ? deg + scale.length : deg] + oct * 12;
  }

  function noteFreq(index) {
    return semitoneToFreq(state.harmonicRoot, scaleNote(index) + state.rootOffset);
  }

  // ── MODES → SCALE INTERVALS ──────────────────────────────────────────

  const MODES = {
    major:            [0,2,4,5,7,9,11,12,14,16,17,19,21,23,24],
    dorian:           [0,2,3,5,7,9,10,12,14,15,17,19,21,22,24],
    'pentatonic-major': [0,2,4,7,9,12,14,16,19,21,24],
    'whole-tone':     [0,2,4,6,8,10,12,14,16,18,20,22,24],
    blues:            [0,3,5,6,7,10,12,15,17,18,19,22,24],
    chromatic:        [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24],
    mixolydian:       [0,2,4,5,7,9,10,12,14,16,17,19,21,22,24],
    phrygian:         [0,1,3,5,7,8,10,12,13,15,17,19,20,22,24],
  };

  // ── INIT AUDIO ───────────────────────────────────────────────────────

  function init(audioCtx) {
    ctx = audioCtx;

    // Master chain: sidechainGain → saturator → compressor → masterGain → dest
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.8;
    masterGain.connect(ctx.destination);

    compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 12;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.15;
    compressor.connect(masterGain);

    // Waveshaper for tape saturation
    saturator = ctx.createWaveShaper();
    saturator.curve = makeSaturationCurve(0.3);
    saturator.oversample = '2x';
    saturator.connect(compressor);

    sidechainGain = ctx.createGain();
    sidechainGain.gain.value = 1;
    sidechainGain.connect(saturator);

    // Drum bus: drumComp → masterGain (bypasses sidechain)
    drumBus = ctx.createGain();
    drumBus.gain.value = 1;
    drumComp = ctx.createDynamicsCompressor();
    drumComp.threshold.value = -12;
    drumComp.ratio.value = 6;
    drumComp.attack.value = 0.001;
    drumComp.release.value = 0.08;
    drumBus.connect(drumComp);
    drumComp.connect(masterGain);

    // Convolver reverb
    buildConvolver();

    // Delay line
    buildDelay();

    // Layer gain nodes
    for (const name in layers) {
      const L = layers[name];
      L.gain = ctx.createGain();
      L.gain.gain.value = 0;
      L.gain.connect(sidechainGain);
      // Also send to reverb
      const send = ctx.createGain();
      send.gain.value = 0.3;
      L.gain.connect(send);
      send.connect(reverbSend);
    }

    state.ready = true;
  }

  // ── CONVOLVER REVERB ─────────────────────────────────────────────────

  function buildConvolver() {
    convolver = ctx.createConvolver();
    const len = ctx.sampleRate * 3;
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
      }
    }
    convolver.buffer = buf;

    reverbSend = ctx.createGain();
    reverbSend.gain.value = 0.3;

    reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.5;

    reverbSend.connect(convolver);
    convolver.connect(reverbGain);
    reverbGain.connect(masterGain);
  }

  // ── DELAY LINE ───────────────────────────────────────────────────────

  function buildDelay() {
    delayNode = ctx.createDelay(2);
    delayNode.delayTime.value = 0.375; // dotted eighth at ~80bpm

    delayFeedback = ctx.createGain();
    delayFeedback.gain.value = 0.35;

    delayFilter = ctx.createBiquadFilter();
    delayFilter.type = 'lowpass';
    delayFilter.frequency.value = 3000;

    delayMix = ctx.createGain();
    delayMix.gain.value = 0.3;

    delaySend = ctx.createGain();
    delaySend.gain.value = 0.25;

    delaySend.connect(delayNode);
    delayNode.connect(delayFilter);
    delayFilter.connect(delayFeedback);
    delayFeedback.connect(delayNode);
    delayFilter.connect(delayMix);
    delayMix.connect(masterGain);
  }

  // ── SATURATION CURVE ─────────────────────────────────────────────────

  function makeSaturationCurve(amount) {
    const n = 256;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = (1 + amount) * x / (1 + amount * Math.abs(x));
    }
    return curve;
  }

  // ── APPLY LENS ───────────────────────────────────────────────────────

  function applyLens(lens) {
    state.lens = lens;
    if (!lens) return;

    // Harmony
    if (lens.harmony) {
      state.harmonicRoot = lens.harmony.root || 432;
      const mode = MODES[lens.harmony.mode] || MODES.major;
      scale = mode;
    }

    // Rhythm
    if (lens.rhythm) {
      const bpmArr = lens.rhythm.bpm;
      state.tempo = Array.isArray(bpmArr) ? bpmArr[0] : (bpmArr || 80);
    }

    // Voice: saturation
    if (lens.voice && saturator) {
      saturator.curve = makeSaturationCurve(lens.voice.saturation || 0.3);
    }

    // Voice: space → reverb character
    if (lens.voice && reverbGain) {
      const spaces = { intimate: 0.2, room: 0.35, cathedral: 0.5, infinite: 0.7 };
      reverbGain.gain.value = spaces[lens.voice.space] || 0.4;
    }

    // Voice: delay type
    if (lens.voice && delayNode) {
      const dottedEighth = (60 / state.tempo) * 0.75;
      delayNode.delayTime.value = lens.voice.delay === 'dotted-eighth' ? dottedEighth :
                                  lens.voice.delay === 'quarter' ? 60 / state.tempo :
                                  lens.voice.delay === 'eighth' ? 30 / state.tempo : dottedEighth;
    }

    // Stages thresholds from lens
    if (lens.stages && lens.stages.thresholds) {
      const t = lens.stages.thresholds;
      if (t[0] !== undefined) STAGES[1].threshold = t[0];
      if (t[1] !== undefined) STAGES[2].threshold = t[1];
      if (t[2] !== undefined) STAGES[3].threshold = t[2];
    }

    // Rebuild layers with new lens character
    rebuildLayers();
  }

  // ── BUILD / REBUILD LAYERS ───────────────────────────────────────────

  function rebuildLayers() {
    if (!ctx || !state.lens) return;

    // Kill existing oscillators
    for (const name in layers) {
      const L = layers[name];
      for (let i = 0; i < L.oscs.length; i++) {
        try { L.oscs[i].stop(); } catch (e) { /* ok */ }
      }
      L.oscs = [];
      if (L.filter) { try { L.filter.disconnect(); } catch (e) { /* ok */ } L.filter = null; }
    }

    const root = state.harmonicRoot;
    const lens = state.lens;
    const lensLayers = (lens.voice && lens.voice.layers) || ['pad', 'bass', 'strings', 'shimmer', 'choir'];
    const timbre = (lens.voice && lens.voice.timbre) || 'warm';
    const isWarm = timbre === 'warm' || timbre === 'dark';

    // PAD — wide detuned saw/sine cluster
    if (lensLayers.indexOf('pad') >= 0) {
      buildPad(root, isWarm);
    }

    // ATMOSPHERE — noise through bandpass, breathes
    if (lensLayers.indexOf('atmosphere') >= 0) {
      buildAtmosphere();
    }

    // BASS — sub sine + harmonic
    if (lensLayers.indexOf('bass') >= 0) {
      buildBass(root);
    }

    // STRINGS — detuned saws through lowpass
    if (lensLayers.indexOf('strings') >= 0) {
      buildStrings(root);
    }

    // SHIMMER — high sine harmonics with vibrato
    if (lensLayers.indexOf('shimmer') >= 0) {
      buildShimmer(root);
    }

    // CHOIR — breathy filtered sines at octave + fifth
    if (lensLayers.indexOf('choir') >= 0) {
      buildChoir(root);
    }
  }

  function buildPad(root, warm) {
    const L = layers.pad;
    L.filter = ctx.createBiquadFilter();
    L.filter.type = 'lowpass';
    L.filter.frequency.value = warm ? 1200 : 2400;
    L.filter.Q.value = 0.7;
    L.filter.connect(L.gain);

    const detunes = [-8, -3, 0, 3, 8];
    for (let i = 0; i < detunes.length; i++) {
      const o = ctx.createOscillator();
      o.type = warm ? 'sawtooth' : 'triangle';
      o.frequency.value = root / 2;
      o.detune.value = detunes[i];
      o.connect(L.filter);
      o.start();
      L.oscs.push(o);
    }
    L.active = true;
  }

  function buildAtmosphere() {
    const L = layers.atmosphere;
    // Pink-ish noise through a bandpass
    const bufLen = ctx.sampleRate * 2;
    const noiseBuf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufLen; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;

    L.filter = ctx.createBiquadFilter();
    L.filter.type = 'bandpass';
    L.filter.frequency.value = 800;
    L.filter.Q.value = 0.5;

    src.connect(L.filter);
    L.filter.connect(L.gain);
    src.start();
    L.oscs.push(src);
    L.active = true;
  }

  function buildBass(root) {
    const L = layers.bass;
    L.filter = ctx.createBiquadFilter();
    L.filter.type = 'lowpass';
    L.filter.frequency.value = 250;
    L.filter.Q.value = 1.5;
    L.filter.connect(L.gain);

    // Sub sine
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = root / 4;
    sub.connect(L.filter);
    sub.start();
    L.oscs.push(sub);

    // Harmonic triangle
    const harm = ctx.createOscillator();
    harm.type = 'triangle';
    harm.frequency.value = root / 4;
    harm.detune.value = 5;

    const hGain = ctx.createGain();
    hGain.gain.value = 0.3;
    harm.connect(hGain);
    hGain.connect(L.filter);
    harm.start();
    L.oscs.push(harm);
    L.active = true;
  }

  function buildStrings(root) {
    const L = layers.strings;
    L.filter = ctx.createBiquadFilter();
    L.filter.type = 'lowpass';
    L.filter.frequency.value = 3500;
    L.filter.Q.value = 0.5;
    L.filter.connect(L.gain);

    // Ensemble: detuned saws at root, fifth, octave
    const freqs = [root, root * 1.5, root * 2];
    const detunes = [-5, 0, 5];
    for (let f = 0; f < freqs.length; f++) {
      for (let d = 0; d < detunes.length; d++) {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = freqs[f];
        o.detune.value = detunes[d];
        const g = ctx.createGain();
        g.gain.value = 0.12;
        o.connect(g);
        g.connect(L.filter);
        o.start();
        L.oscs.push(o);
      }
    }
    L.active = true;
  }

  function buildShimmer(root) {
    const L = layers.shimmer;
    // High harmonics with slow vibrato
    const freqs = [root * 4, root * 5, root * 6];
    for (let i = 0; i < freqs.length; i++) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = freqs[i];

      // Vibrato LFO
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.3 + i * 0.2;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = freqs[i] * 0.008;
      lfo.connect(lfoGain);
      lfoGain.connect(o.frequency);
      lfo.start();

      const g = ctx.createGain();
      g.gain.value = 0.1;
      o.connect(g);
      g.connect(L.gain);
      o.start();
      L.oscs.push(o, lfo);
    }
    L.active = true;
  }

  function buildChoir(root) {
    const L = layers.choir;
    L.filter = ctx.createBiquadFilter();
    L.filter.type = 'bandpass';
    L.filter.frequency.value = 1200;
    L.filter.Q.value = 2;
    L.filter.connect(L.gain);

    // Breathy formant cluster
    const intervals = [0, 7, 12, 19]; // root, fifth, octave, octave+fifth
    for (let i = 0; i < intervals.length; i++) {
      const freq = root * Math.pow(2, intervals[i] / 12);
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = freq;
      o.detune.value = (Math.random() - 0.5) * 12;
      const g = ctx.createGain();
      g.gain.value = 0.08;
      o.connect(g);
      g.connect(L.filter);
      o.start();
      L.oscs.push(o);
    }
    L.active = true;
  }

  // ── UPDATE (called every frame from app.js) ──────────────────────────

  function update(brainState, sensorState, dt) {
    if (!state.ready || !state.lens) return;

    const lens = state.lens;
    const totalMotion = brainState.totalMotion;
    const energy = brainState.energy;
    const pattern = brainState.pattern;
    const voidDepth = brainState.voidDepth;
    const tiltY = sensorState.beta;

    state.energy = energy;

    // ── EVOLUTION STAGE ──
    let newStage = 0;
    for (let i = STAGES.length - 1; i >= 0; i--) {
      if (totalMotion >= STAGES[i].threshold) { newStage = i; break; }
    }
    if (newStage !== state.stageIndex) {
      state.stageIndex = newStage;
      state.stage = STAGES[newStage].name;
      state.rootOffset = STAGES[newStage].shift;
      updateLayerRoots();
    }

    // ── TEMPO ──
    const bpmArr = (lens.rhythm && lens.rhythm.bpm) || [80];
    const baseBPM = Array.isArray(bpmArr) ? bpmArr[Math.min(newStage, bpmArr.length - 1)] : bpmArr;
    state.tempo = baseBPM + STAGES[newStage].bpmBoost;

    // Context mods
    if (lens.context) {
      const tod = sensorState.timeOfDay;
      const cmod = lens.context[tod];
      if (cmod) {
        if (cmod.bpm_mod) state.tempo += cmod.bpm_mod;
      }
      const wmod = lens.context[sensorState.weather];
      if (wmod && wmod.reverb && reverbGain) {
        reverbGain.gain.value = Math.max(reverbGain.gain.value, wmod.reverb);
      }
    }

    // Delay time follows tempo
    if (delayNode) {
      const dottedEighth = (60 / state.tempo) * 0.75;
      delayNode.delayTime.value = dottedEighth;
    }

    // ── LAYER VOLUMES based on motion pattern + lens mapping ──
    const motionMap = (lens.motion && lens.motion[pattern]) || pattern;
    const lensLayers = (lens.voice && lens.voice.layers) || ['pad', 'bass', 'strings', 'shimmer', 'choir'];

    // Determine target volumes
    const targets = { pad: 0, atmosphere: 0, bass: 0, strings: 0, shimmer: 0, choir: 0 };

    // Base: pad + atmosphere always on (if in lens)
    if (lensLayers.indexOf('pad') >= 0) targets.pad = 0.25;
    if (lensLayers.indexOf('atmosphere') >= 0) targets.atmosphere = 0.15;

    // Motion drives layers
    if (pattern === 'gentle' || pattern === 'rhythmic' || pattern === 'vigorous' || pattern === 'chaotic') {
      if (lensLayers.indexOf('bass') >= 0) targets.bass = 0.3;
    }
    if (pattern === 'rhythmic' || pattern === 'vigorous' || pattern === 'chaotic') {
      if (lensLayers.indexOf('strings') >= 0) targets.strings = 0.25;
    }
    if (pattern === 'vigorous' || pattern === 'chaotic') {
      if (lensLayers.indexOf('shimmer') >= 0) targets.shimmer = 0.2;
    }
    if (state.stage === 'TRANSCENDENT') {
      if (lensLayers.indexOf('choir') >= 0) targets.choir = 0.18;
    }

    // Stage amplifies
    const stageAmp = 1 + newStage * 0.15;
    for (const name in targets) targets[name] *= stageAmp;

    // Void fades everything
    if (voidDepth > 0.1) {
      const voidFade = 1 - voidDepth * 0.8;
      for (const name in targets) targets[name] *= voidFade;
    }

    // Smooth layer gains
    for (const name in layers) {
      const L = layers[name];
      if (!L.gain) continue;
      const target = targets[name] || 0;
      L.vol += (target - L.vol) * 0.03;
      L.gain.gain.value = L.vol;
    }

    // ── TILT EXPRESSION ──
    // TiltY (beta: 0-180) maps to filter open + reverb send
    const tiltNorm = Math.max(0, Math.min(1, (tiltY - 20) / 70));
    const targetFilterFreq = 400 + tiltNorm * 6000;
    state.filterFreq += (targetFilterFreq - state.filterFreq) * 0.08;

    // Apply filter to pad and strings
    if (layers.pad.filter) layers.pad.filter.frequency.value = state.filterFreq;
    if (layers.strings.filter) layers.strings.filter.frequency.value = state.filterFreq * 1.2;

    // Reverb send from tilt
    if (reverbSend) {
      reverbSend.gain.value = 0.15 + tiltNorm * 0.5;
    }

    // ── SIDECHAIN RECOVERY ──
    state.sidechainValue += (1 - state.sidechainValue) * 0.15;
    if (sidechainGain) sidechainGain.gain.value = state.sidechainValue;

    // ── GROOVE ──
    updateGroove();

    // ── VOID DRONE ──
    updateVoidDrone(voidDepth);
  }

  // ── UPDATE LAYER ROOTS ON STAGE CHANGE ───────────────────────────────

  function updateLayerRoots() {
    if (!ctx || !state.lens) return;
    const root = semitoneToFreq(state.harmonicRoot, state.rootOffset);

    // Pad
    if (layers.pad.oscs.length) {
      for (let i = 0; i < layers.pad.oscs.length; i++) {
        if (layers.pad.oscs[i].frequency) {
          layers.pad.oscs[i].frequency.setTargetAtTime(root / 2, ctx.currentTime, 0.5);
        }
      }
    }
    // Bass
    if (layers.bass.oscs.length) {
      for (let i = 0; i < layers.bass.oscs.length; i++) {
        if (layers.bass.oscs[i].frequency) {
          layers.bass.oscs[i].frequency.setTargetAtTime(root / 4, ctx.currentTime, 0.3);
        }
      }
    }
    // Strings: root, fifth, octave
    const strFreqs = [root, root * 1.5, root * 2];
    const strOscs = layers.strings.oscs;
    let si = 0;
    for (let f = 0; f < strFreqs.length && si < strOscs.length; f++) {
      for (let d = 0; d < 3 && si < strOscs.length; d++) {
        if (strOscs[si].frequency) {
          strOscs[si].frequency.setTargetAtTime(strFreqs[f], ctx.currentTime, 0.5);
        }
        si++;
      }
    }
  }

  // ── GROOVE / DRUM SEQUENCER ──────────────────────────────────────────

  function updateGroove() {
    if (!ctx) return;

    const pat = PATTERNS[state.stage];
    const lens = state.lens;
    const feel = (lens && lens.rhythm && lens.rhythm.feel) || 'straight';

    // Lens says no drums ever?
    if (lens && lens.rhythm && lens.rhythm.density === 'none') {
      state.groovePlaying = false;
      return;
    }

    // Need at least FLOWING for drums (unless lens overrides)
    const grooveThresh = (lens && lens.rhythm && lens.rhythm.groove_threshold) || 0.3;
    if (!pat || state.energy < grooveThresh) {
      state.groovePlaying = false;
      return;
    }

    state.groovePlaying = true;
    const now = ctx.currentTime;

    // Step timing
    const stepDur = (60 / state.tempo) / 4; // 16th notes
    if (now < state.nextStepTime) return;

    if (state.nextStepTime === 0) state.nextStepTime = now;

    // Schedule ahead slightly
    while (state.nextStepTime <= now + 0.05) {
      const step = state.grooveStep % 16;

      // Swing feel
      let swingOffset = 0;
      if ((feel === 'swing' || feel === 'shuffle') && step % 2 === 1) {
        swingOffset = stepDur * (feel === 'shuffle' ? 0.25 : 0.18);
      }

      const t = state.nextStepTime + swingOffset;

      // Kick
      if (pat.kick[step] > 0) {
        playKick(t, pat.kick[step]);
      }
      // Snare
      if (pat.snare[step] > 0) {
        playSnare(t, pat.snare[step]);
      }
      // Hat
      if (pat.hat[step] > 0) {
        playHat(t, pat.hat[step]);
      }

      state.grooveStep++;
      state.nextStepTime += stepDur;
    }
  }

  // ── DRUM SYNTHESIS ───────────────────────────────────────────────────

  function playKick(time, vel) {
    if (!ctx) return;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(160 * vel, time);
    o.frequency.exponentialRampToValueAtTime(40, time + 0.08);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.8 * vel, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

    o.connect(g);
    g.connect(drumBus);
    o.start(time);
    o.stop(time + 0.4);

    // Sidechain pump
    const depth = (state.lens && state.lens.voice && state.lens.voice.sidechain) || 0.3;
    state.sidechainValue = 1 - depth * vel;

    // Crackle with vinyl feel
    if (state.lens && state.lens.voice && state.lens.voice.crackle) {
      ensureCrackle();
    }
  }

  function playSnare(time, vel) {
    if (!ctx) return;
    // Noise burst
    const len = ctx.sampleRate * 0.15;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const filt = ctx.createBiquadFilter();
    filt.type = 'highpass';
    filt.frequency.value = 1200;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.5 * vel, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    src.connect(filt);
    filt.connect(g);
    g.connect(drumBus);
    src.start(time);
    src.stop(time + 0.2);

    // Body tone
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = 200;
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.3 * vel, time);
    og.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
    o.connect(og);
    og.connect(drumBus);
    o.start(time);
    o.stop(time + 0.1);
  }

  function playHat(time, vel) {
    if (!ctx) return;
    const len = ctx.sampleRate * 0.05;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 7000;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.25 * vel, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    src.connect(hp);
    hp.connect(g);
    g.connect(drumBus);
    src.start(time);
    src.stop(time + 0.06);
  }

  // ── CRACKLE (vinyl texture) ──────────────────────────────────────────

  function ensureCrackle() {
    if (crackleNode) return;
    const len = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      d[i] = Math.random() > 0.997 ? (Math.random() * 2 - 1) * 0.3 : 0;
    }
    crackleNode = ctx.createBufferSource();
    crackleNode.buffer = buf;
    crackleNode.loop = true;

    crackleGainNode = ctx.createGain();
    crackleGainNode.gain.value = 0.04;
    crackleNode.connect(crackleGainNode);
    crackleGainNode.connect(masterGain);
    crackleNode.start();
  }

  // ── TOUCH NOTES ──────────────────────────────────────────────────────

  function playTouchNote(tx, ty) {
    if (!ctx || !state.ready) return;
    const now = ctx.currentTime;

    // Rate limit
    if (now - state.lastNoteTime < 0.08) return;
    state.lastNoteTime = now;

    // X position → scale degree, Y position → octave
    const degree = Math.floor(tx * scale.length);
    const octaveShift = Math.floor((1 - ty) * 3); // top of screen = higher
    const semitones = scaleNote(degree) + octaveShift * 12 + state.rootOffset;
    const freq = semitoneToFreq(state.harmonicRoot, semitones);

    // Oscillator
    const o = ctx.createOscillator();
    const lens = state.lens;
    const timbre = (lens && lens.voice && lens.voice.timbre) || 'warm';
    o.type = timbre === 'warm' ? 'triangle' : timbre === 'bright' ? 'sawtooth' : 'sine';
    o.frequency.value = freq;

    // Gain envelope
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.2, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    o.connect(g);
    g.connect(sidechainGain);

    // Send to reverb + delay
    const rSend = ctx.createGain();
    rSend.gain.value = 0.35;
    g.connect(rSend);
    rSend.connect(reverbSend);

    const dSend = ctx.createGain();
    dSend.gain.value = 0.25;
    g.connect(dSend);
    dSend.connect(delaySend);

    o.start(now);
    o.stop(now + 1.5);
  }

  // ── GESTURE RESPONSES ────────────────────────────────────────────────

  function onSpike(data) {
    if (!ctx || !state.ready) return;
    const now = ctx.currentTime;
    const n = data.neuron;

    if (n === 'shake') playTrill(now, data.rate);
    else if (n === 'sweep') playGliss(now, data.magnitude);
    else if (n === 'circle') playArp(now);
    else if (n === 'toss') playImpact(now, data.magnitude);
    else if (n === 'rock') playVibrato(now);
  }

  function playTrill(time, rate) {
    const baseFreq = noteFreq(Math.floor(Math.random() * 5) + 3);
    const count = Math.min(8, Math.ceil(rate * 3));
    const interval = 0.06;

    for (let i = 0; i < count; i++) {
      const t = time + i * interval;
      const freq = baseFreq * (i % 2 === 0 ? 1 : 1.06);
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.12, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      o.connect(g);
      g.connect(sidechainGain);
      // Delay send
      const ds = ctx.createGain();
      ds.gain.value = 0.3;
      g.connect(ds);
      ds.connect(delaySend);
      o.start(t);
      o.stop(t + 0.1);
    }
  }

  function playGliss(time, magnitude) {
    const startSemi = state.rootOffset;
    const range = Math.min(24, magnitude * 8);
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(semitoneToFreq(state.harmonicRoot, startSemi), time);
    o.frequency.exponentialRampToValueAtTime(
      semitoneToFreq(state.harmonicRoot, startSemi + range), time + 0.4
    );
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.15, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.6);
    o.connect(g);
    g.connect(sidechainGain);
    const rs = ctx.createGain();
    rs.gain.value = 0.4;
    g.connect(rs);
    rs.connect(reverbSend);
    o.start(time);
    o.stop(time + 0.7);
  }

  function playArp(time) {
    const degrees = [0, 2, 4, 6, 8, 10];
    const interval = 0.1;
    for (let i = 0; i < degrees.length; i++) {
      const t = time + i * interval;
      const freq = noteFreq(degrees[i]);
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.1, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      o.connect(g);
      g.connect(sidechainGain);
      const ds = ctx.createGain();
      ds.gain.value = 0.35;
      g.connect(ds);
      ds.connect(delaySend);
      o.start(t);
      o.stop(t + 0.3);
    }
  }

  function playImpact(time, magnitude) {
    // Low boom + reverb wash
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(80, time);
    o.frequency.exponentialRampToValueAtTime(30, time + 0.5);
    const g = ctx.createGain();
    g.gain.setValueAtTime(Math.min(0.5, magnitude * 0.15), time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.8);
    o.connect(g);
    g.connect(masterGain);
    // Heavy reverb send
    const rs = ctx.createGain();
    rs.gain.value = 0.7;
    g.connect(rs);
    rs.connect(reverbSend);
    o.start(time);
    o.stop(time + 1);
  }

  function playVibrato(time) {
    const freq = noteFreq(4);
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = freq;

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 5.5;
    const lfoG = ctx.createGain();
    lfoG.gain.value = freq * 0.025;
    lfo.connect(lfoG);
    lfoG.connect(o.frequency);
    lfo.start(time);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.12, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.8);
    o.connect(g);
    g.connect(sidechainGain);
    const rs = ctx.createGain();
    rs.gain.value = 0.3;
    g.connect(rs);
    rs.connect(reverbSend);
    o.start(time);
    o.stop(time + 0.9);
    lfo.stop(time + 0.9);
  }

  // ── VOID DRONE ───────────────────────────────────────────────────────

  let voidOsc = null;
  let voidGain = null;
  let voidOvertone = null;
  let voidOvertoneGain = null;
  let voidFilter = null;

  function updateVoidDrone(depth) {
    if (!ctx) return;

    if (depth > 0.15) {
      if (!voidOsc) startVoidDrone();
      const targetVol = depth * 0.25;
      voidGain.gain.value += (targetVol - voidGain.gain.value) * 0.02;

      // Breath modulation
      const breath = Brain.breathPhase;
      if (voidFilter) {
        voidFilter.frequency.value = 300 + Math.sin(breath) * 150;
      }
      if (voidOvertone && depth > 0.5) {
        voidOvertoneGain.gain.value += ((depth - 0.5) * 0.1 - voidOvertoneGain.gain.value) * 0.02;
      }
    } else if (voidOsc) {
      stopVoidDrone();
    }
  }

  function startVoidDrone() {
    voidFilter = ctx.createBiquadFilter();
    voidFilter.type = 'lowpass';
    voidFilter.frequency.value = 400;
    voidFilter.Q.value = 1;

    voidGain = ctx.createGain();
    voidGain.gain.value = 0;

    voidOsc = ctx.createOscillator();
    voidOsc.type = 'sine';
    voidOsc.frequency.value = 432;

    voidOsc.connect(voidFilter);
    voidFilter.connect(voidGain);
    voidGain.connect(reverbGain);
    voidOsc.start();

    // Overtone
    voidOvertone = ctx.createOscillator();
    voidOvertone.type = 'sine';
    voidOvertone.frequency.value = 432 * 1.5; // fifth
    voidOvertoneGain = ctx.createGain();
    voidOvertoneGain.gain.value = 0;
    voidOvertone.connect(voidOvertoneGain);
    voidOvertoneGain.connect(voidFilter);
    voidOvertone.start();
  }

  function stopVoidDrone() {
    try {
      if (voidOsc) { voidOsc.stop(); voidOsc.disconnect(); }
      if (voidOvertone) { voidOvertone.stop(); voidOvertone.disconnect(); }
      if (voidGain) voidGain.disconnect();
      if (voidFilter) voidFilter.disconnect();
      if (voidOvertoneGain) voidOvertoneGain.disconnect();
    } catch (e) { /* ok */ }
    voidOsc = null;
    voidGain = null;
    voidOvertone = null;
    voidOvertoneGain = null;
    voidFilter = null;
  }

  // ── PUBLIC ───────────────────────────────────────────────────────────

  return Object.freeze({
    init: init,
    applyLens: applyLens,
    update: update,
    playTouchNote: playTouchNote,
    onSpike: onSpike,

    get stage() { return state.stage; },
    get tempo() { return state.tempo; },
    get energy() { return state.energy; },
    get filterFreq() { return state.filterFreq; },
    get groovePlaying() { return state.groovePlaying; },
    get ready() { return state.ready; },
    get layerVolumes() {
      const v = {};
      for (const name in layers) v[name] = layers[name].vol.toFixed(2);
      return v;
    },
  });
})();
