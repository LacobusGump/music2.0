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
    lens: null,
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
    sidechainValue: 1,
    lastNoteTime: 0,
    autoStep: 0,
    nextAutoTime: 0,
    chordIndex: 0,
    nextChordTime: 0,
    chordOffset: 0,
    walkDeg: 0,
    arpIndex: 0,
  };

  let scale = [0, 2, 4, 7, 9, 11, 12, 14, 16, 19, 23, 24];

  const STAGES = [
    { name: 'EMERGING',     threshold: 0,   bpmBoost: 0,  shift: 0 },
    { name: 'FLOWING',      threshold: 100, bpmBoost: 3,  shift: 7 },
    { name: 'SURGING',      threshold: 400, bpmBoost: 8,  shift: 14 },
    { name: 'TRANSCENDENT', threshold: 800, bpmBoost: 12, shift: 19 },
  ];

  // ── MODES ────────────────────────────────────────────────────────────

  const MODES = {
    major:              [0,2,4,5,7,9,11,12,14,16,17,19,21,23,24],
    dorian:             [0,2,3,5,7,9,10,12,14,15,17,19,21,22,24],
    'pentatonic-major': [0,2,4,7,9,12,14,16,19,21,24],
    'whole-tone':       [0,2,4,6,8,10,12,14,16,18,20,22,24],
    blues:              [0,3,5,6,7,10,12,15,17,18,19,22,24],
    chromatic:          [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24],
    mixolydian:         [0,2,4,5,7,9,10,12,14,16,17,19,21,22,24],
    phrygian:           [0,1,3,5,7,8,10,12,13,15,17,19,20,22,24],
  };

  // ── MUSIC THEORY ─────────────────────────────────────────────────────

  function semi2freq(root, semi) {
    return root * Math.pow(2, semi / 12);
  }

  function scaleNote(index) {
    if (scale.length === 0) return index;
    const len = scale.length;
    const oct = Math.floor(index / len);
    let deg = index % len;
    if (deg < 0) deg += len;
    return scale[deg] + oct * 12;
  }

  function noteFreq(index) {
    return semi2freq(state.harmonicRoot, scaleNote(index) + state.rootOffset);
  }

  // ── INIT ─────────────────────────────────────────────────────────────

  function init(audioCtx) {
    ctx = audioCtx;

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

    saturator = ctx.createWaveShaper();
    saturator.curve = makeSatCurve(0.3);
    saturator.oversample = '2x';
    saturator.connect(compressor);

    sidechainGain = ctx.createGain();
    sidechainGain.connect(saturator);

    drumBus = ctx.createGain();
    drumBus.gain.value = 1;
    drumComp = ctx.createDynamicsCompressor();
    drumComp.threshold.value = -12;
    drumComp.ratio.value = 6;
    drumComp.attack.value = 0.001;
    drumComp.release.value = 0.08;
    drumBus.connect(drumComp);
    drumComp.connect(masterGain);

    // Reverb — will be rebuilt per lens
    buildReverb(3.0, 0.4);

    // Delay — params will be set per lens
    buildDelay();

    // Layer gain nodes (persistent — never recreated)
    for (const name in layers) {
      const L = layers[name];
      L.gain = ctx.createGain();
      L.gain.gain.value = 0;
      L.gain.connect(sidechainGain);
      const send = ctx.createGain();
      send.gain.value = 0.3;
      L.gain.connect(send);
      send.connect(reverbSend);
    }

    state.ready = true;
  }

  // ── REVERB — lens-specific IR ────────────────────────────────────────

  function buildReverb(decayTime, damping) {
    // Disconnect old if exists
    if (convolver) { try { convolver.disconnect(); } catch (e) {} }
    if (reverbGain) { try { reverbGain.disconnect(); } catch (e) {} }

    convolver = ctx.createConvolver();
    const len = Math.floor(ctx.sampleRate * decayTime);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        const t = i / len;
        // Power decay — lower exponent = longer tail
        const exponent = 1.5 + damping * 3; // damping 0 → exp 1.5 (long), damping 1 → exp 4.5 (short)
        const envelope = Math.pow(1 - t, exponent);
        // High frequency damping: multiply by lowpass-like rolloff over time
        const hfDamp = 1 - damping * t;
        const noise = Math.random() * 2 - 1;
        d[i] = noise * envelope * Math.max(0.05, hfDamp);
      }
    }
    convolver.buffer = buf;

    if (!reverbSend) {
      reverbSend = ctx.createGain();
      reverbSend.gain.value = 0.3;
    }

    reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.5;

    reverbSend.connect(convolver);
    convolver.connect(reverbGain);
    reverbGain.connect(masterGain);
  }

  // ── DELAY ────────────────────────────────────────────────────────────

  function buildDelay() {
    delayNode = ctx.createDelay(4);
    delayNode.delayTime.value = 0.375;

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

  function makeSatCurve(amount) {
    const n = 256, c = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      c[i] = (1 + amount) * x / (1 + amount * Math.abs(x));
    }
    return c;
  }

  // ── APPLY LENS ───────────────────────────────────────────────────────

  function applyLens(lens) {
    state.lens = lens;
    if (!lens || !ctx) return;

    // Kill crackle from previous lens
    stopCrackle();

    // Reset groove state
    state.grooveStep = 0;
    state.nextStepTime = 0;
    state.groovePlaying = false;
    state.chordIndex = 0;
    state.chordOffset = 0;
    state.nextChordTime = 0;
    state.autoStep = 0;
    state.nextAutoTime = 0;
    state.walkDeg = 0;
    state.arpIndex = 0;

    // Harmony
    if (lens.harmony) {
      state.harmonicRoot = lens.harmony.root || 432;
      scale = MODES[lens.harmony.mode] || MODES.major;
    }

    // Rhythm
    if (lens.rhythm) {
      const bpm = lens.rhythm.bpm;
      state.tempo = Array.isArray(bpm) ? bpm[0] : (bpm || 80);
    }

    // Saturation
    if (saturator) {
      saturator.curve = makeSatCurve(v(lens, 'voice.saturation', 0.3));
    }

    // Rebuild reverb with lens-specific IR
    var decayTime = v(lens, 'voice.reverbDecay', 3.0);
    var damping = v(lens, 'voice.reverbDamping', 0.4);
    buildReverb(decayTime, damping);

    // Reverb level from space
    var spaces = { intimate: 0.2, room: 0.35, cathedral: 0.5, infinite: 0.7 };
    if (reverbGain) reverbGain.gain.value = spaces[v(lens, 'voice.space', 'cathedral')] || 0.4;

    // Delay
    if (delayFeedback) delayFeedback.gain.value = v(lens, 'voice.delayFeedback', 0.35);
    if (delayFilter) delayFilter.frequency.value = v(lens, 'voice.delayFilterFreq', 3000);
    var delType = v(lens, 'voice.delay', 'dotted-eighth');
    if (delayNode) {
      var de = (60 / state.tempo) * 0.75;
      delayNode.delayTime.value = delType === 'quarter' ? 60 / state.tempo :
                                   delType === 'eighth' ? 30 / state.tempo : de;
    }

    // Drum bus gain
    if (drumBus) drumBus.gain.value = v(lens, 'voice.drumGain', 1.0);

    // Stage thresholds
    if (lens.stages && lens.stages.thresholds) {
      var t = lens.stages.thresholds;
      if (t[0] !== undefined) STAGES[1].threshold = t[0];
      if (t[1] !== undefined) STAGES[2].threshold = t[1];
      if (t[2] !== undefined) STAGES[3].threshold = t[2];
    }

    // Start crackle immediately if lens wants it (vinyl / old record)
    if (v(lens, 'voice.crackle', false)) ensureCrackle();

    // Rebuild all layers
    rebuildLayers();
  }

  // Helper: deep property access
  function v(obj, path, def) {
    var parts = path.split('.');
    var cur = obj;
    for (var i = 0; i < parts.length; i++) {
      if (!cur || cur[parts[i]] === undefined) return def;
      cur = cur[parts[i]];
    }
    return cur;
  }

  // ── REBUILD LAYERS ───────────────────────────────────────────────────

  function rebuildLayers() {
    if (!ctx || !state.lens) return;
    var lens = state.lens;

    // Kill all existing oscillators
    for (var name in layers) {
      var L = layers[name];
      for (var i = 0; i < L.oscs.length; i++) {
        try { L.oscs[i].stop(); } catch (e) {}
        try { L.oscs[i].disconnect(); } catch (e) {}
      }
      L.oscs = [];
      if (L.filter) { try { L.filter.disconnect(); } catch (e) {} L.filter = null; }
      L.active = false;
      L.vol = 0;
    }

    var root = state.harmonicRoot;
    var ll = v(lens, 'voice.layers', ['pad', 'bass', 'strings', 'shimmer', 'choir']);

    if (ll.indexOf('pad') >= 0) buildPad(root, lens);
    if (ll.indexOf('atmosphere') >= 0) buildAtmosphere(lens);
    if (ll.indexOf('bass') >= 0) buildBass(root, lens);
    if (ll.indexOf('strings') >= 0) buildStrings(root, lens);
    if (ll.indexOf('shimmer') >= 0) buildShimmer(root, lens);
    if (ll.indexOf('choir') >= 0) buildChoir(root, lens);

    // Set initial volumes — immediate sound for 'always' layers
    var iGates = {
      pad: 'always', atmosphere: 'always', bass: 'moving',
      strings: 'rhythmic', shimmer: 'intense', choir: 'transcendent'
    };
    for (var n in layers) {
      if (ll.indexOf(n) < 0) continue;
      var gate = v(lens, 'voice.' + n + 'Unlock', iGates[n] || 'always');
      if (gate === 'always') {
        var iv = v(lens, 'voice.' + n + 'Vol', 0.15);
        layers[n].vol = iv;
        if (layers[n].gain) layers[n].gain.gain.value = iv;
      }
    }
  }

  // ── PAD — lens-aware ─────────────────────────────────────────────────

  function buildPad(root, lens) {
    var L = layers.pad;
    var wave = v(lens, 'voice.padWaveform', 'sawtooth');
    var octave = v(lens, 'voice.padOctave', -1);
    var detune = v(lens, 'voice.padDetune', 8);
    var chord = v(lens, 'voice.padChord', [0, 7, 12]);
    var timbre = v(lens, 'voice.timbre', 'warm');

    L.filter = ctx.createBiquadFilter();
    L.filter.type = 'lowpass';
    L.filter.frequency.value = timbre === 'bright' ? 3000 : timbre === 'dark' ? 800 : 1400;
    L.filter.Q.value = 0.7;
    L.filter.connect(L.gain);

    var baseFreq = root * Math.pow(2, octave);
    var detunes = [-detune, -detune/3, 0, detune/3, detune];

    for (var c = 0; c < chord.length; c++) {
      var chordFreq = baseFreq * Math.pow(2, chord[c] / 12);
      // 2 oscillators per chord tone (detuned pair for width)
      for (var d = 0; d < 2; d++) {
        var o = ctx.createOscillator();
        o.type = wave;
        o.frequency.value = chordFreq;
        o.detune.value = d === 0 ? -detune : detune;
        var g = ctx.createGain();
        g.gain.value = 0.15 / chord.length;
        o.connect(g);
        g.connect(L.filter);
        o.start();
        L.oscs.push(o);
      }
    }
    L.active = true;
  }

  // ── ATMOSPHERE — lens-aware ──────────────────────────────────────────

  function buildAtmosphere(lens) {
    var L = layers.atmosphere;
    var freq = v(lens, 'voice.atmosphereFreq', 800);
    var q = v(lens, 'voice.atmosphereQ', 0.5);

    // Pink noise
    var bufLen = ctx.sampleRate * 2;
    var noiseBuf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0);
    var b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
    for (var i = 0; i < bufLen; i++) {
      var w = Math.random() * 2 - 1;
      b0 = 0.99886*b0 + w*0.0555179;
      b1 = 0.99332*b1 + w*0.0750759;
      b2 = 0.96900*b2 + w*0.1538520;
      b3 = 0.86650*b3 + w*0.3104856;
      b4 = 0.55000*b4 + w*0.5329522;
      b5 = -0.7616*b5 - w*0.0168980;
      d[i] = (b0+b1+b2+b3+b4+b5+b6+w*0.5362) * 0.11;
      b6 = w * 0.115926;
    }

    var src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;

    L.filter = ctx.createBiquadFilter();
    L.filter.type = 'bandpass';
    L.filter.frequency.value = freq;
    L.filter.Q.value = q;

    src.connect(L.filter);
    L.filter.connect(L.gain);
    src.start();
    L.oscs.push(src);
    L.active = true;
  }

  // ── BASS — lens-aware ────────────────────────────────────────────────

  function buildBass(root, lens) {
    var L = layers.bass;
    var bassType = v(lens, 'voice.bassType', 'sub');

    L.filter = ctx.createBiquadFilter();
    L.filter.type = 'lowpass';
    L.filter.connect(L.gain);

    if (bassType === '808') {
      // 808: deep sub sine, resonant filter
      L.filter.frequency.value = 180;
      L.filter.Q.value = 3;
      var o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = root / 4;
      o.connect(L.filter);
      o.start();
      L.oscs.push(o);
      // Sub harmonic
      var sub = ctx.createOscillator();
      sub.type = 'sine';
      sub.frequency.value = root / 8;
      var sg = ctx.createGain();
      sg.gain.value = 0.5;
      sub.connect(sg);
      sg.connect(L.filter);
      sub.start();
      L.oscs.push(sub);
    } else if (bassType === 'upright') {
      // Upright: triangle with formant, higher register
      L.filter.frequency.value = 600;
      L.filter.Q.value = 2;
      var o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = root / 2;
      o.connect(L.filter);
      o.start();
      L.oscs.push(o);
      // Formant resonance
      var formant = ctx.createBiquadFilter();
      formant.type = 'peaking';
      formant.frequency.value = 800;
      formant.Q.value = 3;
      formant.gain.value = 6;
      L.filter.connect(formant);
      formant.connect(L.gain);
    } else if (bassType === 'growl') {
      // Growl: square wave, aggressive resonant filter
      L.filter.frequency.value = 350;
      L.filter.Q.value = 5;
      var o = ctx.createOscillator();
      o.type = 'square';
      o.frequency.value = root / 4;
      var g = ctx.createGain();
      g.gain.value = 0.4;
      o.connect(g);
      g.connect(L.filter);
      o.start();
      L.oscs.push(o);
      // Sub layer
      var sub = ctx.createOscillator();
      sub.type = 'sine';
      sub.frequency.value = root / 4;
      sub.connect(L.filter);
      sub.start();
      L.oscs.push(sub);
    } else {
      // Sub: clean sine + triangle
      L.filter.frequency.value = 250;
      L.filter.Q.value = 1.5;
      var o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = root / 4;
      o.connect(L.filter);
      o.start();
      L.oscs.push(o);
      var h = ctx.createOscillator();
      h.type = 'triangle';
      h.frequency.value = root / 4;
      h.detune.value = 5;
      var hg = ctx.createGain();
      hg.gain.value = 0.3;
      h.connect(hg);
      hg.connect(L.filter);
      h.start();
      L.oscs.push(h);
    }
    L.active = true;
  }

  // ── STRINGS — lens-aware ─────────────────────────────────────────────

  function buildStrings(root, lens) {
    var L = layers.strings;
    var voicing = v(lens, 'voice.stringVoicing', [0, 4, 7, 12]);
    var timbre = v(lens, 'voice.timbre', 'warm');

    L.filter = ctx.createBiquadFilter();
    L.filter.type = 'lowpass';
    L.filter.frequency.value = timbre === 'bright' ? 5000 : timbre === 'dark' ? 2000 : 3500;
    L.filter.Q.value = 0.5;
    L.filter.connect(L.gain);

    for (var i = 0; i < voicing.length; i++) {
      var freq = root * Math.pow(2, voicing[i] / 12);
      var detunes = [-5, 0, 5];
      for (var d = 0; d < detunes.length; d++) {
        var o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = freq;
        o.detune.value = detunes[d];
        var g = ctx.createGain();
        g.gain.value = 0.1 / voicing.length;
        o.connect(g);
        g.connect(L.filter);
        o.start();
        L.oscs.push(o);
      }
    }
    L.active = true;
  }

  // ── SHIMMER — lens-aware ─────────────────────────────────────────────

  function buildShimmer(root, lens) {
    var L = layers.shimmer;
    var ringMod = v(lens, 'voice.shimmerRingMod', false);
    var freqs = [root * 4, root * 5, root * 6];

    for (var i = 0; i < freqs.length; i++) {
      var o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = freqs[i];

      // Vibrato LFO
      var lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.3 + i * 0.2;
      var lfoG = ctx.createGain();
      lfoG.gain.value = freqs[i] * 0.008;
      lfo.connect(lfoG);
      lfoG.connect(o.frequency);
      lfo.start();

      var g = ctx.createGain();
      g.gain.value = 0.12;

      if (ringMod) {
        // Ring modulation for metallic texture
        var modOsc = ctx.createOscillator();
        modOsc.type = 'sine';
        modOsc.frequency.value = freqs[i] * 1.414; // irrational ratio = inharmonic
        var modGain = ctx.createGain();
        modGain.gain.value = 0.5;
        modOsc.connect(modGain);
        modGain.connect(g.gain); // AM modulation
        modOsc.start();
        L.oscs.push(modOsc);
      }

      o.connect(g);
      g.connect(L.gain);
      o.start();
      L.oscs.push(o, lfo);
    }
    L.active = true;
  }

  // ── CHOIR ────────────────────────────────────────────────────────────

  function buildChoir(root, lens) {
    var L = layers.choir;
    L.filter = ctx.createBiquadFilter();
    L.filter.type = 'bandpass';
    L.filter.frequency.value = 1200;
    L.filter.Q.value = 2;
    L.filter.connect(L.gain);

    var intervals = [0, 7, 12, 19];
    for (var i = 0; i < intervals.length; i++) {
      var freq = root * Math.pow(2, intervals[i] / 12);
      var o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = freq;
      o.detune.value = (Math.random() - 0.5) * 12;
      var g = ctx.createGain();
      g.gain.value = 0.1;
      o.connect(g);
      g.connect(L.filter);
      o.start();
      L.oscs.push(o);
    }
    L.active = true;
  }

  // ── UPDATE ───────────────────────────────────────────────────────────

  function update(brainState, sensorState, dt) {
    if (!state.ready || !state.lens) return;

    var lens = state.lens;
    var totalMotion = brainState.totalMotion;
    var energy = brainState.energy;
    var pattern = brainState.pattern;
    var voidDepth = brainState.voidDepth;
    var tiltY = (sensorState.beta || 0);

    state.energy = energy;

    // ── EVOLUTION STAGE
    var newStage = 0;
    for (var i = STAGES.length - 1; i >= 0; i--) {
      if (totalMotion >= STAGES[i].threshold) { newStage = i; break; }
    }
    if (newStage !== state.stageIndex) {
      state.stageIndex = newStage;
      state.stage = STAGES[newStage].name;
      state.rootOffset = STAGES[newStage].shift;
      updateLayerRoots();
    }

    // ── TEMPO
    var bpmArr = v(lens, 'rhythm.bpm', [80]);
    var baseBPM = Array.isArray(bpmArr) ? bpmArr[Math.min(newStage, bpmArr.length - 1)] : bpmArr;
    state.tempo = baseBPM + STAGES[newStage].bpmBoost;

    // Context mods
    if (lens.context) {
      var cmod = lens.context[sensorState.timeOfDay];
      if (cmod && cmod.bpm_mod) state.tempo += cmod.bpm_mod;
      var wmod = lens.context[sensorState.weather];
      if (wmod && wmod.reverb && reverbGain) {
        reverbGain.gain.value = Math.max(reverbGain.gain.value, wmod.reverb);
      }
    }

    // Delay time follows tempo
    if (delayNode) {
      delayNode.delayTime.value = (60 / state.tempo) * 0.75;
    }

    // ── LAYER VOLUMES — per-lens mix profile
    var ll = v(lens, 'voice.layers', ['pad', 'bass', 'strings', 'shimmer', 'choir']);
    var targets = { pad: 0, atmosphere: 0, bass: 0, strings: 0, shimmer: 0, choir: 0 };

    // Unlock conditions — each lens chooses when layers appear
    var unlocked = {
      always: true,
      moving: pattern !== 'still',
      gentle: pattern !== 'still',
      rhythmic: pattern === 'rhythmic' || pattern === 'vigorous' || pattern === 'chaotic',
      intense: pattern === 'vigorous' || pattern === 'chaotic',
      transcendent: state.stage === 'TRANSCENDENT',
    };

    // Defaults (used if lens doesn't specify)
    var defs = {
      pad:        { vol: 0.25, gate: 'always' },
      atmosphere: { vol: 0.15, gate: 'always' },
      bass:       { vol: 0.30, gate: 'moving' },
      strings:    { vol: 0.25, gate: 'rhythmic' },
      shimmer:    { vol: 0.20, gate: 'intense' },
      choir:      { vol: 0.18, gate: 'transcendent' },
    };

    for (var n in targets) {
      if (ll.indexOf(n) < 0) continue;
      var vol = v(lens, 'voice.' + n + 'Vol', defs[n].vol);
      var gate = v(lens, 'voice.' + n + 'Unlock', defs[n].gate);
      if (unlocked[gate]) targets[n] = vol;
    }

    // Stage amplifies
    var stageAmp = 1 + newStage * 0.15;
    for (var n in targets) targets[n] *= stageAmp;

    // Void fades
    if (voidDepth > 0.1) {
      var fade = 1 - voidDepth * 0.8;
      for (var n in targets) targets[n] *= fade;
    }

    // Smooth layer gains
    for (var n in layers) {
      var L = layers[n];
      if (!L.gain) continue;
      var target = targets[n] || 0;
      L.vol += (target - L.vol) * 0.15;
      L.gain.gain.value = L.vol;
    }

    // ── TILT EXPRESSION
    var filterRange = v(lens, 'voice.filterRange', [400, 6000]);
    var tiltNorm = Math.max(0, Math.min(1, (tiltY - 20) / 70));
    var targetFreq = filterRange[0] + tiltNorm * (filterRange[1] - filterRange[0]);
    state.filterFreq += (targetFreq - state.filterFreq) * 0.08;

    if (layers.pad.filter) layers.pad.filter.frequency.value = state.filterFreq;
    if (layers.strings.filter) layers.strings.filter.frequency.value = state.filterFreq * 1.2;

    var rm = v(lens, 'voice.reverbMix', 0.4);
    if (reverbSend) reverbSend.gain.value = rm * (0.3 + tiltNorm * 0.7);

    // ── SIDECHAIN
    state.sidechainValue += (1 - state.sidechainValue) * 0.15;
    if (sidechainGain) sidechainGain.gain.value = state.sidechainValue;

    // ── GROOVE
    updateGroove();

    // ── CHORD PROGRESSION
    updateChords();

    // ── AUTOPLAY MELODY
    updateAutoplay();

    // ── VOID DRONE
    updateVoidDrone(voidDepth);
  }

  // ── UPDATE ROOTS ON STAGE CHANGE ─────────────────────────────────────

  function updateLayerRoots() {
    if (!ctx || !state.lens) return;
    var root = semi2freq(state.harmonicRoot, state.rootOffset + state.chordOffset);
    var now = ctx.currentTime;

    // Update pad chord tones
    var chord = v(state.lens, 'voice.padChord', [0, 7, 12]);
    var padOct = v(state.lens, 'voice.padOctave', -1);
    var baseFreq = root * Math.pow(2, padOct);
    var pi = 0;
    for (var c = 0; c < chord.length && pi < layers.pad.oscs.length; c++) {
      var cf = baseFreq * Math.pow(2, chord[c] / 12);
      for (var d = 0; d < 2 && pi < layers.pad.oscs.length; d++) {
        if (layers.pad.oscs[pi].frequency) {
          layers.pad.oscs[pi].frequency.setTargetAtTime(cf, now, 0.5);
        }
        pi++;
      }
    }

    // Bass
    for (var i = 0; i < layers.bass.oscs.length; i++) {
      if (layers.bass.oscs[i].frequency) {
        layers.bass.oscs[i].frequency.setTargetAtTime(root / 4, now, 0.3);
      }
    }

    // Strings
    var sv = v(state.lens, 'voice.stringVoicing', [0, 4, 7, 12]);
    var si = 0;
    for (var s = 0; s < sv.length && si < layers.strings.oscs.length; s++) {
      var sf = root * Math.pow(2, sv[s] / 12);
      for (var d = 0; d < 3 && si < layers.strings.oscs.length; d++) {
        if (layers.strings.oscs[si].frequency) {
          layers.strings.oscs[si].frequency.setTargetAtTime(sf, now, 0.5);
        }
        si++;
      }
    }
  }

  // ── GROOVE / DRUM SEQUENCER ──────────────────────────────────────────

  function updateGroove() {
    if (!ctx || !state.lens) return;

    var lens = state.lens;
    var kit = v(lens, 'voice.drumKit', 'acoustic');
    var feel = v(lens, 'rhythm.feel', 'straight');

    // No drums?
    if (kit === 'none' || v(lens, 'rhythm.density', 'full') === 'none') {
      state.groovePlaying = false;
      return;
    }

    // Get per-lens patterns for current stage
    var patterns = v(lens, 'rhythm.patterns', {});
    var pat = patterns[state.stage];

    if (!pat) { state.groovePlaying = false; return; }

    // Energy threshold
    var thresh = v(lens, 'rhythm.groove_threshold', 0.3);
    if (state.energy < thresh && state.stage === 'EMERGING') {
      state.groovePlaying = false;
      return;
    }

    state.groovePlaying = true;
    var now = ctx.currentTime;
    var stepDur = (60 / state.tempo) / 4;

    if (state.nextStepTime === 0) state.nextStepTime = now;
    if (now < state.nextStepTime - 0.05) return;

    while (state.nextStepTime <= now + 0.05) {
      var step = state.grooveStep % 16;

      var swingOff = 0;
      if ((feel === 'swing' || feel === 'shuffle') && step % 2 === 1) {
        swingOff = stepDur * (feel === 'shuffle' ? 0.25 : 0.18);
      }

      var t = state.nextStepTime + swingOff;

      if (pat.kick && pat.kick[step] > 0) playKick(t, pat.kick[step], kit);
      if (pat.snare && pat.snare[step] > 0) playSnare(t, pat.snare[step], kit);
      if (pat.hat && pat.hat[step] > 0) playHat(t, pat.hat[step], kit);

      state.grooveStep++;
      state.nextStepTime += stepDur;
    }
  }

  // ── DRUM SYNTHESIS — per-kit ─────────────────────────────────────────

  function playKick(time, vel, kit) {
    var o = ctx.createOscillator();
    o.type = 'sine';

    if (kit === '808') {
      // 808: deeper pitch sweep, longer sustain
      o.frequency.setValueAtTime(120, time);
      o.frequency.exponentialRampToValueAtTime(30, time + 0.15);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.9 * vel, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
      o.connect(g); g.connect(drumBus);
      o.start(time); o.stop(time + 0.55);
    } else if (kit === 'brushes') {
      // Brushes: soft thump
      o.frequency.setValueAtTime(80, time);
      o.frequency.exponentialRampToValueAtTime(40, time + 0.04);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.2 * vel, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
      o.connect(g); g.connect(drumBus);
      o.start(time); o.stop(time + 0.2);
    } else if (kit === 'glitch') {
      // Glitch: short click + pitched
      o.frequency.setValueAtTime(200 + Math.random() * 100, time);
      o.frequency.exponentialRampToValueAtTime(30, time + 0.03);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.6 * vel, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
      o.connect(g); g.connect(drumBus);
      o.start(time); o.stop(time + 0.15);
    } else {
      // Acoustic: standard
      o.frequency.setValueAtTime(160 * vel, time);
      o.frequency.exponentialRampToValueAtTime(40, time + 0.08);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.8 * vel, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
      o.connect(g); g.connect(drumBus);
      o.start(time); o.stop(time + 0.4);
    }

    // Sidechain pump
    var depth = v(state.lens, 'voice.sidechain', 0.3);
    state.sidechainValue = 1 - depth * vel;

    // Crackle
    if (v(state.lens, 'voice.crackle', false)) ensureCrackle();
  }

  function playSnare(time, vel, kit) {
    if (kit === '808') {
      // 808 clap: layered noise bursts
      for (var c = 0; c < 3; c++) {
        var t = time + c * 0.015;
        var len = ctx.sampleRate * 0.08;
        var buf = ctx.createBuffer(1, len, ctx.sampleRate);
        var d = buf.getChannelData(0);
        for (var i = 0; i < len; i++) d[i] = (Math.random()*2-1) * Math.pow(1-i/len, 2);
        var src = ctx.createBufferSource(); src.buffer = buf;
        var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = 1;
        var g = ctx.createGain();
        g.gain.setValueAtTime(0.35 * vel, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        src.connect(bp); bp.connect(g); g.connect(drumBus);
        src.start(t); src.stop(t + 0.15);
      }
    } else if (kit === 'brushes') {
      // Brushes: soft swish
      var len = ctx.sampleRate * 0.2;
      var buf = ctx.createBuffer(1, len, ctx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = (Math.random()*2-1) * Math.pow(1-i/len, 1.5) * 0.3;
      var src = ctx.createBufferSource(); src.buffer = buf;
      var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3000; bp.Q.value = 0.5;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.15 * vel, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
      src.connect(bp); bp.connect(g); g.connect(drumBus);
      src.start(time); src.stop(time + 0.25);
    } else if (kit === 'glitch') {
      // Glitch: short digital noise
      var len = ctx.sampleRate * 0.06;
      var buf = ctx.createBuffer(1, len, ctx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() > 0.5 ? 0.5 : -0.5; // bit-crushed
      var src = ctx.createBufferSource(); src.buffer = buf;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.3 * vel, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
      src.connect(g); g.connect(drumBus);
      src.start(time); src.stop(time + 0.08);
    } else {
      // Acoustic
      var len = ctx.sampleRate * 0.15;
      var buf = ctx.createBuffer(1, len, ctx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = (Math.random()*2-1) * (1-i/len);
      var src = ctx.createBufferSource(); src.buffer = buf;
      var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1200;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.5 * vel, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
      src.connect(hp); hp.connect(g); g.connect(drumBus);
      src.start(time); src.stop(time + 0.2);
      // Body
      var o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = 200;
      var og = ctx.createGain();
      og.gain.setValueAtTime(0.3*vel, time);
      og.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
      o.connect(og); og.connect(drumBus);
      o.start(time); o.stop(time + 0.1);
    }
  }

  function playHat(time, vel, kit) {
    var dur, hpFreq;
    if (kit === '808') { dur = 0.06; hpFreq = 6000; }
    else if (kit === 'brushes') { dur = 0.1; hpFreq = 4000; }
    else if (kit === 'glitch') { dur = 0.03; hpFreq = 9000; }
    else { dur = 0.05; hpFreq = 7000; }

    var len = Math.floor(ctx.sampleRate * dur);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random()*2-1) * (1-i/len);

    var src = ctx.createBufferSource(); src.buffer = buf;
    var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = hpFreq;
    var g = ctx.createGain();
    g.gain.setValueAtTime((kit === 'brushes' ? 0.12 : 0.25) * vel, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + dur);
    src.connect(hp); hp.connect(g); g.connect(drumBus);
    src.start(time); src.stop(time + dur + 0.01);
  }

  // ── CRACKLE ──────────────────────────────────────────────────────────

  function ensureCrackle() {
    if (crackleNode) return;
    var len = ctx.sampleRate * 4;
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() > 0.997 ? (Math.random()*2-1)*0.3 : 0;
    crackleNode = ctx.createBufferSource();
    crackleNode.buffer = buf;
    crackleNode.loop = true;
    crackleGainNode = ctx.createGain();
    crackleGainNode.gain.value = 0.04;
    crackleNode.connect(crackleGainNode);
    crackleGainNode.connect(masterGain);
    crackleNode.start();
  }

  function stopCrackle() {
    if (crackleNode) {
      try { crackleNode.stop(); } catch (e) {}
      try { crackleNode.disconnect(); } catch (e) {}
      crackleNode = null;
    }
    if (crackleGainNode) {
      try { crackleGainNode.disconnect(); } catch (e) {}
      crackleGainNode = null;
    }
  }

  // ── TOUCH NOTES — lens-aware ─────────────────────────────────────────

  function playTouchNote(tx, ty) {
    if (!ctx || !state.ready || !state.lens) return;
    var now = ctx.currentTime;
    if (now - state.lastNoteTime < 0.08) return;
    state.lastNoteTime = now;

    var degree = Math.floor(tx * scale.length);
    var octShift = Math.floor((1 - ty) * 3);
    var semi = scaleNote(degree) + octShift * 12 + state.rootOffset + state.chordOffset;
    var freq = semi2freq(state.harmonicRoot, semi);
    var decay = v(state.lens, 'voice.noteDecay', 1.2);
    var vel = 0.18 + ty * 0.07; // harder at top of screen

    synthesizeNote(now, freq, vel, decay);
  }

  // ── GESTURE RESPONSES ────────────────────────────────────────────────

  function onSpike(data) {
    if (!ctx || !state.ready) return;
    var now = ctx.currentTime;
    var n = data.neuron;
    if (n === 'shake') playTrill(now, data.rate);
    else if (n === 'sweep') playGliss(now, data.magnitude);
    else if (n === 'circle') playArp(now);
    else if (n === 'toss') playImpact(now, data.magnitude);
    else if (n === 'rock') playVibrato(now);
  }

  function playTrill(time, rate) {
    var baseFreq = noteFreq(Math.floor(Math.random() * 5) + 3);
    var count = Math.min(8, Math.ceil(rate * 3));
    var wave = v(state.lens, 'voice.noteWave', 'triangle');
    for (var i = 0; i < count; i++) {
      var t = time + i * 0.06;
      var o = ctx.createOscillator();
      o.type = wave;
      o.frequency.value = baseFreq * (i % 2 === 0 ? 1 : 1.06);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.12, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      o.connect(g); g.connect(sidechainGain);
      var ds = ctx.createGain(); ds.gain.value = 0.3; g.connect(ds); ds.connect(delaySend);
      o.start(t); o.stop(t + 0.1);
    }
  }

  function playGliss(time, mag) {
    var range = Math.min(24, mag * 8);
    var o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(semi2freq(state.harmonicRoot, state.rootOffset), time);
    o.frequency.exponentialRampToValueAtTime(semi2freq(state.harmonicRoot, state.rootOffset + range), time + 0.4);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.15, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.6);
    o.connect(g); g.connect(sidechainGain);
    var rs = ctx.createGain(); rs.gain.value = 0.4; g.connect(rs); rs.connect(reverbSend);
    o.start(time); o.stop(time + 0.7);
  }

  function playArp(time) {
    var degrees = [0, 2, 4, 6, 8, 10];
    var wave = v(state.lens, 'voice.noteWave', 'sine');
    for (var i = 0; i < degrees.length; i++) {
      var t = time + i * 0.1;
      var o = ctx.createOscillator(); o.type = wave;
      o.frequency.value = noteFreq(degrees[i]);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.1, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      o.connect(g); g.connect(sidechainGain);
      var ds = ctx.createGain(); ds.gain.value = 0.35; g.connect(ds); ds.connect(delaySend);
      o.start(t); o.stop(t + 0.3);
    }
  }

  function playImpact(time, mag) {
    var o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(80, time);
    o.frequency.exponentialRampToValueAtTime(30, time + 0.5);
    var g = ctx.createGain();
    g.gain.setValueAtTime(Math.min(0.5, mag * 0.15), time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.8);
    o.connect(g); g.connect(masterGain);
    var rs = ctx.createGain(); rs.gain.value = 0.7; g.connect(rs); rs.connect(reverbSend);
    o.start(time); o.stop(time + 1);
  }

  function playVibrato(time) {
    var freq = noteFreq(4);
    var wave = v(state.lens, 'voice.noteWave', 'triangle');
    var o = ctx.createOscillator(); o.type = wave; o.frequency.value = freq;
    var lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 5.5;
    var lfoG = ctx.createGain(); lfoG.gain.value = freq * 0.025;
    lfo.connect(lfoG); lfoG.connect(o.frequency); lfo.start(time);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.12, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.8);
    o.connect(g); g.connect(sidechainGain);
    var rs = ctx.createGain(); rs.gain.value = 0.3; g.connect(rs); rs.connect(reverbSend);
    o.start(time); o.stop(time + 0.9); lfo.stop(time + 0.9);
  }

  // ── CHORD PROGRESSION ─────────────────────────────────────────────────

  function updateChords() {
    if (!ctx || !state.lens) return;
    var now = ctx.currentTime;
    var barDur = (60 / state.tempo) * 4;
    var changeBars = v(state.lens, 'voice.chordBars', 4);

    if (state.nextChordTime === 0) state.nextChordTime = now + barDur * changeBars;
    if (now < state.nextChordTime) return;

    var prog = v(state.lens, 'harmony.progression', [0, 5, 7, 0]);
    state.chordIndex = (state.chordIndex + 1) % prog.length;
    state.chordOffset = prog[state.chordIndex];
    state.nextChordTime = now + barDur * changeBars;

    updateLayerRoots();
  }

  // ── AUTOPLAY MELODY — style-aware per lens ───────────────────────────

  function updateAutoplay() {
    if (!ctx || !state.lens) return;
    var density = v(state.lens, 'voice.autoplay', 0.4);
    if (density <= 0) return;

    var style = v(state.lens, 'voice.autoplayStyle', 'random');
    var feel = v(state.lens, 'rhythm.feel', 'straight');
    var now = ctx.currentTime;

    // Different step sizes per style
    var stepDur;
    if (style === 'walking') stepDur = 60 / state.tempo; // quarter notes
    else if (style === 'sparse') stepDur = (60 / state.tempo) * 2; // half notes
    else stepDur = (60 / state.tempo) / 4; // 16th notes

    if (state.nextAutoTime === 0) state.nextAutoTime = now;
    if (now < state.nextAutoTime - 0.05) return;

    while (state.nextAutoTime <= now + 0.05) {
      var step = state.autoStep % 16;
      var prob;

      if (style === 'walking') {
        prob = density * (0.85 + Math.min(1, state.energy) * 0.15);
      } else if (style === 'sparse') {
        prob = density * (0.3 + Math.min(1, state.energy) * 0.3);
      } else if (style === 'arpeggio') {
        var str = (step % 4 === 0) ? 1.0 : (step % 2 === 0) ? 0.4 : 0.1;
        prob = density * str * (0.5 + Math.min(1, state.energy) * 0.5);
      } else {
        var str = (step === 0) ? 1.0 : (step === 8) ? 0.7 : (step % 4 === 0) ? 0.5 : (step % 2 === 0) ? 0.25 : 0.1;
        prob = density * str * (0.5 + Math.min(1, state.energy) * 0.5);
      }

      // Swing timing — offbeats arrive late for jazz/shuffle feel
      var swingOff = 0;
      if ((feel === 'swing' || feel === 'shuffle') && step % 2 === 1) {
        var stepDur16 = (60 / state.tempo) / 4;
        swingOff = stepDur16 * (feel === 'shuffle' ? 0.25 : 0.18);
      }

      if (Math.random() < prob) {
        playAutoNote(state.nextAutoTime + swingOff, style);
      }

      state.autoStep++;
      state.nextAutoTime += stepDur;
    }
  }

  function playAutoNote(time, style) {
    var lens = state.lens;
    var decay = v(lens, 'voice.noteDecay', 1.2) * 0.5;
    var octave = v(lens, 'voice.autoplayOctave', 0);
    var semi;

    if (style === 'walking') {
      semi = scaleNote(state.walkDeg) + state.rootOffset + state.chordOffset - 12;
      if (Math.random() > 0.25) state.walkDeg = (state.walkDeg + 1) % 7;
      else state.walkDeg = (state.walkDeg + 6) % 7;
      // Walking bass always uses upright synthesis
      var freq = semi2freq(state.harmonicRoot, semi);
      var vel = (0.15 + Math.min(0.1, state.energy * 0.06)) * (state.autoStep % 2 === 0 ? 1.0 : 0.7);
      synthUpright(time, freq, vel);
      return;
    } else if (style === 'arpeggio') {
      var chord = v(lens, 'voice.padChord', [0, 4, 7, 12]);
      semi = chord[state.arpIndex] + state.rootOffset + state.chordOffset + octave * 12;
      state.arpIndex = (state.arpIndex + 1) % chord.length;
    } else if (style === 'sparse') {
      var degree = Math.floor(Math.random() * 8);
      semi = scaleNote(degree) + state.rootOffset + state.chordOffset + (octave + 1) * 12;
      decay = v(lens, 'voice.noteDecay', 3.0) * 0.7;
    } else {
      var range = Math.max(3, Math.floor(3 + state.energy * 4));
      var degree = Math.floor(Math.random() * range);
      semi = scaleNote(degree) + state.rootOffset + state.chordOffset + octave * 12;
    }

    var freq = semi2freq(state.harmonicRoot, semi);
    var vel = (0.12 + Math.min(0.1, state.energy * 0.06)) * (0.7 + Math.random() * 0.3);
    synthesizeNote(time, freq, vel, decay);
  }

  // ── NOTE SYNTHESIS — per lens instrument ───────────────────────────

  function synthesizeNote(time, freq, vel, decay) {
    var noteType = v(state.lens, 'voice.noteType', 'simple');
    switch (noteType) {
      case 'piano': synthPiano(time, freq, vel, decay); break;
      case 'organ': synthOrgan(time, freq, vel, decay); break;
      case 'bell': synthBell(time, freq, vel, decay); break;
      case 'stab': synthStab(time, freq, vel); break;
      case 'glitch': synthGlitch(time, freq, vel); break;
      default: synthSimple(time, freq, vel, decay); break;
    }
  }

  // ── PIANO — jazz piano: hammer attack, layered harmonics, warm ─────

  function synthPiano(time, freq, vel, decay) {
    var filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(2500 + vel * 4000, time);
    filt.frequency.setTargetAtTime(1800, time + 0.01, 0.2);
    filt.Q.value = 0.7;

    var env = ctx.createGain();
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(vel, time + 0.003);
    env.gain.setTargetAtTime(vel * 0.45, time + 0.003, 0.12);
    env.gain.setTargetAtTime(0.001, time + decay * 0.4, decay * 0.4);

    // Body: detuned triangle pair
    var o1 = ctx.createOscillator(); o1.type = 'triangle'; o1.frequency.value = freq;
    var o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = freq; o2.detune.value = 4;
    // Brightness: quiet harmonic at 2x
    var o3 = ctx.createOscillator(); o3.type = 'sine'; o3.frequency.value = freq * 2;
    var hG = ctx.createGain(); hG.gain.value = 0.12; o3.connect(hG);

    // Hammer click — brief noise transient
    var cLen = Math.floor(ctx.sampleRate * 0.012);
    var cBuf = ctx.createBuffer(1, cLen, ctx.sampleRate);
    var cd = cBuf.getChannelData(0);
    for (var i = 0; i < cLen; i++) cd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / cLen, 4);
    var cSrc = ctx.createBufferSource(); cSrc.buffer = cBuf;
    var cG = ctx.createGain(); cG.gain.value = vel * 0.3; cSrc.connect(cG);

    o1.connect(filt); o2.connect(filt); hG.connect(filt); cG.connect(filt);
    filt.connect(env); env.connect(sidechainGain);

    var rs = ctx.createGain(); rs.gain.value = 0.45; env.connect(rs); rs.connect(reverbSend);
    var ds = ctx.createGain(); ds.gain.value = 0.2; env.connect(ds); ds.connect(delaySend);

    var end = time + decay + 0.5;
    o1.start(time); o1.stop(end); o2.start(time); o2.stop(end);
    o3.start(time); o3.stop(end); cSrc.start(time); cSrc.stop(time + 0.015);
  }

  // ── UPRIGHT BASS — walking bass: formant, string buzz, warm ────────

  function synthUpright(time, freq, vel) {
    var formant = ctx.createBiquadFilter();
    formant.type = 'peaking'; formant.frequency.value = 700; formant.Q.value = 2; formant.gain.value = 5;
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 1100; lp.Q.value = 0.8;

    var env = ctx.createGain();
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(vel, time + 0.005);
    env.gain.setTargetAtTime(vel * 0.35, time + 0.005, 0.08);
    env.gain.exponentialRampToValueAtTime(0.001, time + 0.5);

    // Body: triangle fundamental
    var o1 = ctx.createOscillator(); o1.type = 'triangle'; o1.frequency.value = freq;
    // Sub: sine for weight
    var o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = freq;
    var subG = ctx.createGain(); subG.gain.value = 0.5; o2.connect(subG);

    // String buzz — very short noise
    var bLen = Math.floor(ctx.sampleRate * 0.008);
    var bBuf = ctx.createBuffer(1, bLen, ctx.sampleRate);
    var bd = bBuf.getChannelData(0);
    for (var i = 0; i < bLen; i++) bd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bLen, 5);
    var bSrc = ctx.createBufferSource(); bSrc.buffer = bBuf;
    var bG = ctx.createGain(); bG.gain.value = vel * 0.2; bSrc.connect(bG);

    o1.connect(formant); subG.connect(formant); bG.connect(formant);
    formant.connect(lp); lp.connect(env); env.connect(sidechainGain);

    var rs = ctx.createGain(); rs.gain.value = 0.2; env.connect(rs); rs.connect(reverbSend);

    o1.start(time); o1.stop(time + 0.55); o2.start(time); o2.stop(time + 0.55);
    bSrc.start(time); bSrc.stop(time + 0.012);
  }

  // ── ORGAN — gospel: drawbar harmonics, vibrato, sustained ──────────

  function synthOrgan(time, freq, vel, decay) {
    var filt = ctx.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.value = 3500; filt.Q.value = 0.5;

    var env = ctx.createGain();
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(vel, time + 0.015);
    env.gain.setTargetAtTime(vel * 0.7, time + 0.015, 0.3);
    env.gain.setTargetAtTime(0.001, time + decay, decay * 0.3);

    // Leslie-like vibrato
    var lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 5.8;

    // Drawbar harmonics: 1x, 2x, 3x, 4x
    var harmonics = [1, 2, 3, 4];
    var hGains = [0.5, 0.35, 0.2, 0.1];
    for (var i = 0; i < harmonics.length; i++) {
      var o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = freq * harmonics[i];
      var lG = ctx.createGain(); lG.gain.value = freq * harmonics[i] * 0.004;
      lfo.connect(lG); lG.connect(o.frequency);
      var g = ctx.createGain(); g.gain.value = hGains[i];
      o.connect(g); g.connect(filt);
      o.start(time); o.stop(time + decay + 1);
    }

    lfo.start(time); lfo.stop(time + decay + 1);
    filt.connect(env); env.connect(sidechainGain);

    var rs = ctx.createGain(); rs.gain.value = 0.25; env.connect(rs); rs.connect(reverbSend);
  }

  // ── BELL — tundra: inharmonic partials, long shimmer ───────────────

  function synthBell(time, freq, vel, decay) {
    var env = ctx.createGain();
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(vel, time + 0.001);
    env.gain.exponentialRampToValueAtTime(0.001, time + decay);

    // Inharmonic partials — bell character
    var partials = [1, 2.4, 5.3, 6.7];
    var pGains = [0.5, 0.22, 0.1, 0.06];
    for (var i = 0; i < partials.length; i++) {
      var o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = freq * partials[i];
      var g = ctx.createGain(); g.gain.value = pGains[i];
      o.connect(g); g.connect(env);
      o.start(time); o.stop(time + decay + 0.5);
    }

    env.connect(sidechainGain);
    // Heavy reverb — bells should ring forever
    var rs = ctx.createGain(); rs.gain.value = 0.6; env.connect(rs); rs.connect(reverbSend);
    var ds = ctx.createGain(); ds.gain.value = 0.4; env.connect(ds); ds.connect(delaySend);
  }

  // ── STAB — DnB: resonant filter sweep, punchy, dry ────────────────

  function synthStab(time, freq, vel) {
    var filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(5000, time);
    filt.frequency.exponentialRampToValueAtTime(350, time + 0.12);
    filt.Q.value = 5; // resonant sweep

    var env = ctx.createGain();
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(vel, time + 0.002);
    env.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    // Square wave body
    var o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = freq;
    var oG = ctx.createGain(); oG.gain.value = 0.5; o.connect(oG);
    // Sub sine for weight
    var sub = ctx.createOscillator(); sub.type = 'sine'; sub.frequency.value = freq;

    oG.connect(filt); sub.connect(filt); filt.connect(env);
    env.connect(sidechainGain);

    // Dry — barely any reverb
    var rs = ctx.createGain(); rs.gain.value = 0.08; env.connect(rs); rs.connect(reverbSend);

    o.start(time); o.stop(time + 0.2); sub.start(time); sub.stop(time + 0.2);
  }

  // ── GLITCH — dark matter: unstable pitch, distorted, alien ─────────

  function synthGlitch(time, freq, vel) {
    var waves = ['sawtooth', 'square', 'triangle'];
    var o = ctx.createOscillator();
    o.type = waves[Math.floor(Math.random() * waves.length)];
    o.frequency.value = freq;

    // Pitch drift LFO
    var lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 2 + Math.random() * 8;
    var lG = ctx.createGain(); lG.gain.value = freq * (0.02 + Math.random() * 0.05);
    lfo.connect(lG); lG.connect(o.frequency);

    // Distortion
    var dist = ctx.createWaveShaper();
    var n = 64, curve = new Float32Array(n);
    for (var i = 0; i < n; i++) { var x = (i * 2) / n - 1; curve[i] = Math.tanh(x * 3); }
    dist.curve = curve;

    var env = ctx.createGain();
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(vel * 0.6, time + 0.004);
    env.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

    o.connect(dist); dist.connect(env); env.connect(sidechainGain);
    var rs = ctx.createGain(); rs.gain.value = 0.3; env.connect(rs); rs.connect(reverbSend);

    o.start(time); o.stop(time + 0.4); lfo.start(time); lfo.stop(time + 0.4);
  }

  // ── SIMPLE — fallback: single oscillator (Conductor) ───────────────

  function synthSimple(time, freq, vel, decay) {
    var wave = v(state.lens, 'voice.noteWave', 'triangle');
    var o = ctx.createOscillator(); o.type = wave; o.frequency.value = freq;

    var g = ctx.createGain();
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(vel, time + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, time + decay);

    o.connect(g); g.connect(sidechainGain);
    var rs = ctx.createGain(); rs.gain.value = 0.35; g.connect(rs); rs.connect(reverbSend);
    var ds = ctx.createGain(); ds.gain.value = 0.2; g.connect(ds); ds.connect(delaySend);
    o.start(time); o.stop(time + decay + 0.1);
  }

  // ── VOID DRONE ───────────────────────────────────────────────────────

  var voidOsc = null, voidGain = null, voidOvertone = null, voidOvertoneGain = null, voidFilter = null;

  function updateVoidDrone(depth) {
    if (!ctx) return;
    if (depth > 0.15) {
      if (!voidOsc) startVoidDrone();
      var target = depth * 0.25;
      voidGain.gain.value += (target - voidGain.gain.value) * 0.02;
      var breath = Brain.breathPhase;
      if (voidFilter) voidFilter.frequency.value = 300 + Math.sin(breath) * 150;
      if (voidOvertone && depth > 0.5) {
        voidOvertoneGain.gain.value += ((depth - 0.5) * 0.1 - voidOvertoneGain.gain.value) * 0.02;
      }
    } else if (voidOsc) {
      stopVoidDrone();
    }
  }

  function startVoidDrone() {
    voidFilter = ctx.createBiquadFilter(); voidFilter.type = 'lowpass'; voidFilter.frequency.value = 400; voidFilter.Q.value = 1;
    voidGain = ctx.createGain(); voidGain.gain.value = 0;
    voidOsc = ctx.createOscillator(); voidOsc.type = 'sine'; voidOsc.frequency.value = 432;
    voidOsc.connect(voidFilter); voidFilter.connect(voidGain); voidGain.connect(reverbGain); voidOsc.start();
    voidOvertone = ctx.createOscillator(); voidOvertone.type = 'sine'; voidOvertone.frequency.value = 432 * 1.5;
    voidOvertoneGain = ctx.createGain(); voidOvertoneGain.gain.value = 0;
    voidOvertone.connect(voidOvertoneGain); voidOvertoneGain.connect(voidFilter); voidOvertone.start();
  }

  function stopVoidDrone() {
    try { if (voidOsc) { voidOsc.stop(); voidOsc.disconnect(); } } catch (e) {}
    try { if (voidOvertone) { voidOvertone.stop(); voidOvertone.disconnect(); } } catch (e) {}
    try { if (voidGain) voidGain.disconnect(); } catch (e) {}
    try { if (voidFilter) voidFilter.disconnect(); } catch (e) {}
    try { if (voidOvertoneGain) voidOvertoneGain.disconnect(); } catch (e) {}
    voidOsc = voidGain = voidOvertone = voidOvertoneGain = voidFilter = null;
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
      var r = {};
      for (var n in layers) r[n] = layers[n].vol.toFixed(2);
      return r;
    },
  });
})();
