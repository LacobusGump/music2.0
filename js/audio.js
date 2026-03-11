/**
 * AUDIO — The Orchestra
 *
 * Pure sound infrastructure. No musical intelligence.
 * All synthesis engines, drum voices, effects, layer management.
 * Score.js tells it WHAT to play. This file knows HOW to play it.
 */

const Audio = (function () {
  'use strict';

  // ── AUDIO GRAPH STATE ──────────────────────────────────────────────────

  let ctx = null;
  let masterGain = null;
  let masterHPF = null;       // high-pass at 55Hz — kills sub-bass phone can't reproduce
  let masterLimiter = null;   // brick wall limiter, last node before destination
  let eqLowShelf = null;
  let eqMidPeak = null;
  let eqHighShelf = null;
  let masterLP = null;
  let compressor = null;
  let sidechainGain = null;
  let saturator = null;
  let drumBus = null;
  let drumComp = null;
  let drumBusLP = null;
  let convolver = null;
  let reverbSend = null;
  let reverbGain = null;
  let reverbLP = null;
  let delayNode = null;
  let delayFeedback = null;
  let delayFilter = null;
  let delaySend = null;
  let delayMix = null;
  let crackleNode = null;
  let crackleGainNode = null;
  let sidechainDepth = 0.3;

  // Void drone
  let voidOsc = null, voidGain = null, voidOvertone = null;
  let voidOvertoneGain = null, voidFilter = null;

  // Descent bass — Vangelis/Tron sub-bass world
  let desOsc1 = null, desOsc2 = null, desOsc3 = null;
  let desGain = null, desFilter = null, desRvbSend = null;
  let desLFO = null, desLFOGain = null;

  // 8D Spatial stage
  let spatialPanner  = null;
  let spatialLFO     = null;
  let spatialLFOGain = null;
  let spatialSweepDepth = 0.55;  // how wide the LFO sweeps (0 = mono, 1 = full L/R)

  // Named layer registry
  const layers = {};

  // ── INIT ───────────────────────────────────────────────────────────────

  function init(audioCtx) {
    ctx = audioCtx;

    // ── 8D Spatial stage — everything passes through here ────────────────
    // StereoPannerNode at the end of the chain so all sound spatializes:
    //   masterLP → spatialPanner → destination
    // An LFO drives the sweep when still; device tilt biases the center;
    // touch X directly spatializes in real time.
    spatialPanner  = ctx.createStereoPanner();
    spatialLFO     = ctx.createOscillator();
    spatialLFO.type = 'sine';
    spatialLFO.frequency.value = 0.12;
    spatialLFOGain = ctx.createGain();
    spatialLFOGain.gain.value = 0;        // starts silent, opens on first lens configure
    spatialLFO.connect(spatialLFOGain);
    spatialLFOGain.connect(spatialPanner.pan);
    spatialLFO.start();
    spatialPanner.connect(ctx.destination);

    // ── Master limiter — brick wall before spatialPanner ─────────────────
    // Last defence against clipping. All streams (synth + drums + reverb + delay)
    // sum at masterGain; this catches anything that peaks past -1dBFS.
    masterLimiter = ctx.createDynamicsCompressor();
    masterLimiter.threshold.value = -1;
    masterLimiter.knee.value = 0;
    masterLimiter.ratio.value = 20;
    masterLimiter.attack.value = 0.001;
    masterLimiter.release.value = 0.05;
    masterLimiter.connect(spatialPanner);

    // 4-band per-lens parametric EQ → limiter → spatialPanner
    masterLP = ctx.createBiquadFilter();
    masterLP.type = 'lowpass';
    masterLP.frequency.value = 3200;
    masterLP.Q.value = 0.3;
    masterLP.connect(masterLimiter);

    eqHighShelf = ctx.createBiquadFilter();
    eqHighShelf.type = 'highshelf';
    eqHighShelf.frequency.value = 2800;
    eqHighShelf.gain.value = -8;
    eqHighShelf.connect(masterLP);

    eqMidPeak = ctx.createBiquadFilter();
    eqMidPeak.type = 'peaking';
    eqMidPeak.frequency.value = 800;
    eqMidPeak.Q.value = 0.8;
    eqMidPeak.gain.value = 1;
    eqMidPeak.connect(eqHighShelf);

    eqLowShelf = ctx.createBiquadFilter();
    eqLowShelf.type = 'lowshelf';
    eqLowShelf.frequency.value = 120;
    eqLowShelf.gain.value = 1;    // was 5dB — phone speakers can't reproduce 80Hz, boost = mud
    eqLowShelf.connect(eqMidPeak);

    // High-pass at 55Hz: removes sub-bass the phone speaker converts to distortion
    masterHPF = ctx.createBiquadFilter();
    masterHPF.type = 'highpass';
    masterHPF.frequency.value = 55;
    masterHPF.Q.value = 0.5;
    masterHPF.connect(eqLowShelf);

    masterGain = ctx.createGain();
    masterGain.gain.value = 0.8;
    masterGain.connect(masterHPF);

    compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -16;
    compressor.knee.value = 6;    // was 12 — tighter, more transparent
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.10; // was 0.15 — faster recovery, less pumping
    compressor.connect(masterGain);

    saturator = ctx.createWaveShaper();
    saturator.curve = makeSatCurve(0.08); // was 0.3 — subtle warmth, not grit
    saturator.oversample = '4x';          // higher oversample = less aliasing
    saturator.connect(compressor);

    sidechainGain = ctx.createGain();
    sidechainGain.connect(saturator);

    drumBus = ctx.createGain();
    drumBus.gain.value = 1;
    drumComp = ctx.createDynamicsCompressor();
    drumComp.threshold.value = -12;
    drumComp.ratio.value = 6;
    drumComp.attack.value = 0.004;
    drumComp.release.value = 0.08;
    drumBusLP = ctx.createBiquadFilter();
    drumBusLP.type = 'lowpass';
    drumBusLP.frequency.value = 3500;
    drumBusLP.Q.value = 0.3;
    drumBus.connect(drumComp);
    drumComp.connect(drumBusLP);
    drumBusLP.connect(masterGain);

    buildReverb(3.0, 0.4);
    buildDelay();
  }

  // ── CONFIGURE (per-lens effects setup) ─────────────────────────────────

  function configure(lens) {
    if (!lens || !ctx) return;

    var space = lens.space || {};
    var rev = space.reverb || {};
    var del = space.delay || {};

    // Saturation
    // Cap saturation at 0.15 — phone speakers distort badly above this
    var satAmt = space.saturation !== undefined ? Math.min(0.15, space.saturation) : 0.08;
    if (saturator) saturator.curve = makeSatCurve(satAmt);

    // Rebuild reverb with lens-specific IR
    buildReverb(rev.decay || 3.0, rev.damping || 0.4);

    // Reverb level: use reverbMix if defined, otherwise fall back to space type lookup
    var spaces = { intimate: 0.2, room: 0.35, cathedral: 0.5, infinite: 0.7 };
    var reverbLevel = space.reverbMix !== undefined ? space.reverbMix : (spaces[space.type || 'cathedral'] || 0.4);
    if (reverbGain) reverbGain.gain.value = reverbLevel;

    // Delay
    if (delayFeedback) delayFeedback.gain.value = del.feedback || 0.35;
    if (delayFilter) delayFilter.frequency.value = del.filter || 2000;

    // Initial delay sync
    var bpm = lens.rhythm && lens.rhythm.bpm;
    var tempo = Array.isArray(bpm) ? bpm[0] : (bpm || 80);
    updateDelaySync(tempo, del.sync || 'dotted-eighth');

    // Drum bus gain
    if (drumBus && lens.behaviors && lens.behaviors.pulse) {
      drumBus.gain.value = lens.behaviors.pulse.gain !== undefined ? lens.behaviors.pulse.gain : 1.0;
    }

    // Sidechain depth
    sidechainDepth = space.sidechain || 0.3;

    // Per-lens master EQ (the "lensing filter")
    var tone = lens.tone || {};
    if (eqLowShelf) {
      eqLowShelf.frequency.value = tone.bassFreq || 80;
      eqLowShelf.gain.value = tone.bassGain !== undefined ? tone.bassGain : 5;
    }
    if (eqMidPeak) {
      eqMidPeak.frequency.value = tone.midFreq || 800;
      eqMidPeak.Q.value = tone.midQ || 0.8;
      eqMidPeak.gain.value = tone.midGain !== undefined ? tone.midGain : 1;
    }
    if (eqHighShelf) {
      eqHighShelf.frequency.value = tone.highFreq || 2800;
      eqHighShelf.gain.value = tone.highGain !== undefined ? tone.highGain : -8;
    }
    if (masterLP) {
      masterLP.frequency.value = tone.ceiling || 3200;
    }

    // Configure 8D spatial parameters for this lens
    if (spatialLFO && lens.space && lens.space.spatial) {
      var sp = lens.space.spatial;
      spatialSweepDepth = sp.sweepDepth !== undefined ? sp.sweepDepth : 0.55;
      spatialLFO.frequency.setTargetAtTime(sp.sweepRate || 0.12, ctx.currentTime, 0.5);
    } else {
      spatialSweepDepth = 0.55;
    }
  }

  // ── 8D SPATIAL ─────────────────────────────────────────────────────────

  // Called every frame from follow.js with device tilt + motion state.
  // Tilt biases the center pan position. LFO sweeps around that center.
  // When still: full sweep — sounds rotate around your head.
  // When moving: minimal sweep — your body drives the space.
  // When touching: suppressed — finger takes over directly via setTouchPan().
  function updateSpatial(gamma, isSilent, touching) {
    if (!spatialPanner || !ctx) return;

    if (touching) {
      // Finger is on screen — suppress LFO, let setTouchPan() drive
      spatialLFOGain.gain.setTargetAtTime(0.02, ctx.currentTime, 0.08);
      return;
    }

    // Tilt → center pan: tilting left biases sounds left, right biases right
    var tiltPan = Math.max(-0.55, Math.min(0.55, (gamma || 0) / 48));
    spatialPanner.pan.setTargetAtTime(tiltPan, ctx.currentTime, 0.18);

    // LFO depth: full rotation when still, whisper when body is active
    var depth = isSilent ? spatialSweepDepth : spatialSweepDepth * 0.22;
    spatialLFOGain.gain.setTargetAtTime(depth, ctx.currentTime, 1.4);
  }

  // Called from app.js touchmove — finger directly spatializes in real time.
  // Draw left: sounds go left. Draw right: sounds go right.
  // Draw a circle: sounds rotate. Draw a figure 8: double sweep.
  function setTouchPan(normX) {
    if (!spatialPanner || !ctx) return;
    var pan = Math.max(-0.92, Math.min(0.92, (normX - 0.5) * 1.84));
    spatialPanner.pan.setTargetAtTime(pan, ctx.currentTime, 0.025);
  }

  // ── REVERB ─────────────────────────────────────────────────────────────

  function buildReverb(decayTime, damping) {
    if (reverbSend) { try { reverbSend.disconnect(); } catch (e) {} }
    if (convolver) { try { convolver.disconnect(); } catch (e) {} }
    if (reverbGain) { try { reverbGain.disconnect(); } catch (e) {} }

    var cappedDecay = Math.min(decayTime, 6);
    convolver = ctx.createConvolver();
    var len = Math.floor(ctx.sampleRate * cappedDecay);
    var buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      var d = buf.getChannelData(ch);
      for (var i = 0; i < len; i++) {
        var t = i / len;
        var exponent = 1.5 + damping * 3;
        var envelope = Math.pow(1 - t, exponent);
        var hfDamp = 1 - damping * t;
        d[i] = (Math.random() * 2 - 1) * envelope * Math.max(0.05, hfDamp);
      }
    }
    convolver.buffer = buf;

    if (!reverbSend) {
      reverbSend = ctx.createGain();
      reverbSend.gain.value = 0.3;
    }

    reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.5;

    // Dark reverb LP: kill brightness in reverb tail (~3kHz)
    reverbLP = ctx.createBiquadFilter();
    reverbLP.type = 'lowpass';
    reverbLP.frequency.value = 3000;
    reverbLP.Q.value = 0.5;

    reverbSend.connect(convolver);
    convolver.connect(reverbLP);
    reverbLP.connect(reverbGain);
    reverbGain.connect(masterGain);
  }

  // ── DELAY ──────────────────────────────────────────────────────────────

  function buildDelay() {
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
    if (sync === 'quarter') delayNode.delayTime.value = beat;
    else if (sync === 'eighth') delayNode.delayTime.value = beat / 2;
    else delayNode.delayTime.value = beat * 0.75; // dotted-eighth
  }

  // ── SATURATION ─────────────────────────────────────────────────────────

  function makeSatCurve(amount) {
    var n = 512, c = new Float32Array(n);
    for (var i = 0; i < n; i++) {
      var x = (i * 2) / n - 1;
      // Asymmetric: even harmonics (tube warmth), not odd (harsh)
      if (x >= 0) {
        c[i] = (1 + amount * 0.6) * x / (1 + amount * 0.6 * x);
      } else {
        c[i] = (1 + amount) * x / (1 + amount * Math.abs(x));
      }
      c[i] = c[i] * 0.95 + x * x * amount * 0.08;
    }
    return c;
  }

  // ── HUMANIZE ───────────────────────────────────────────────────────────

  function hTime(t) { return t + (Math.random() - 0.5) * 0.007; }
  function hVel(vel) { return Math.min(0.95, vel * (0.87 + Math.random() * 0.26)); }

  // ── SIDECHAIN ──────────────────────────────────────────────────────────

  function pumpSidechain(vel) {
    if (!sidechainGain) return;
    var now = ctx.currentTime;
    var pumpVal = Math.max(0.3, 1 - sidechainDepth * vel);
    sidechainGain.gain.setValueAtTime(pumpVal, now);
    sidechainGain.gain.setTargetAtTime(1, now + 0.01, 0.06);
  }

  // ── LAYER MANAGEMENT ──────────────────────────────────────────────────

  function buildLayer(name, config) {
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
      // Morph LFO
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
      var noiseBuf = config.noise === 'pink' ? createPinkNoise() : createWhiteNoise();
      var src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      src.loop = true;
      if (Array.isArray(sourceTarget)) {
        for (var si = 0; si < sourceTarget.length; si++) src.connect(sourceTarget[si]);
      } else {
        src.connect(sourceTarget);
      }
      src.start();
      L.allNodes.push(src);
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

    // Connect output to sidechain by default
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
    if (L.gain) { try { L.gain.disconnect(); } catch (e) {} }
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

  // ── NOISE GENERATORS ───────────────────────────────────────────────────

  function createPinkNoise() {
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

  function createWhiteNoise() {
    var bufLen = ctx.sampleRate * 2;
    var buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  // ── DRUM SYNTHESIS ─────────────────────────────────────────────────────

  function playKick(time, vel, kit) {
    var o = ctx.createOscillator();
    o.type = 'sine';
    if (kit === '808') {
      o.frequency.setValueAtTime(120, time);
      o.frequency.exponentialRampToValueAtTime(30, time + 0.15);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.9 * vel, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
      o.connect(g); g.connect(drumBus);
      o.start(time); o.stop(time + 0.55);
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
      // Layer 1: Click transient — 4kHz noise burst, 4ms attack
      var clickLen = Math.floor(ctx.sampleRate * 0.004);
      var clickBuf = ctx.createBuffer(1, clickLen, ctx.sampleRate);
      var cd = clickBuf.getChannelData(0);
      for (var ci = 0; ci < clickLen; ci++) cd[ci] = (Math.random() * 2 - 1) * (1 - ci / clickLen);
      var clickSrc = ctx.createBufferSource(); clickSrc.buffer = clickBuf;
      var clickHP = ctx.createBiquadFilter(); clickHP.type = 'highpass'; clickHP.frequency.value = 3500;
      var clickG = ctx.createGain();
      clickG.gain.setValueAtTime(0.65 * vel, time);
      clickG.gain.exponentialRampToValueAtTime(0.001, time + 0.005);
      clickSrc.connect(clickHP); clickHP.connect(clickG); clickG.connect(drumBus);
      clickSrc.start(time); clickSrc.stop(time + 0.006);

      // Layer 2: Body sweep — 150→38Hz over 280ms
      o.frequency.setValueAtTime(150 + 30 * vel, time);
      o.frequency.exponentialRampToValueAtTime(38, time + 0.28);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.85 * vel, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.30);
      o.connect(g); g.connect(drumBus);
      o.start(time); o.stop(time + 0.32);

      // Layer 3: Sub tail — 40Hz sine, 550ms sustain
      var subO = ctx.createOscillator(); subO.type = 'sine';
      subO.frequency.value = 40;
      var subG = ctx.createGain();
      subG.gain.setValueAtTime(0.50 * vel, time + 0.01);
      subG.gain.exponentialRampToValueAtTime(0.001, time + 0.55);
      subO.connect(subG); subG.connect(drumBus);
      subO.start(time + 0.01); subO.stop(time + 0.58);
    }
    pumpSidechain(vel);
  }

  function playSnare(time, vel, kit) {
    if (kit === '808') {
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
      // Layer 1: Crack — HP noise swept 800→2800Hz over 70ms
      var crackLen = Math.floor(ctx.sampleRate * 0.07);
      var crackBuf = ctx.createBuffer(1, crackLen, ctx.sampleRate);
      var crd = crackBuf.getChannelData(0);
      for (var ci = 0; ci < crackLen; ci++) crd[ci] = (Math.random() * 2 - 1) * Math.pow(1 - ci / crackLen, 0.5);
      var crackSrc = ctx.createBufferSource(); crackSrc.buffer = crackBuf;
      var crackHP = ctx.createBiquadFilter(); crackHP.type = 'highpass';
      crackHP.frequency.setValueAtTime(800, time);
      crackHP.frequency.exponentialRampToValueAtTime(2800, time + 0.07);
      var crackG = ctx.createGain();
      crackG.gain.setValueAtTime(0.55 * vel, time);
      crackG.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
      crackSrc.connect(crackHP); crackHP.connect(crackG); crackG.connect(drumBus);
      crackSrc.start(time); crackSrc.stop(time + 0.15);

      // Layer 2: Body — oscillator 200→130Hz
      var bodyO = ctx.createOscillator(); bodyO.type = 'triangle';
      bodyO.frequency.setValueAtTime(200, time);
      bodyO.frequency.exponentialRampToValueAtTime(130, time + 0.08);
      var bodyG = ctx.createGain();
      bodyG.gain.setValueAtTime(0.4 * vel, time);
      bodyG.gain.exponentialRampToValueAtTime(0.001, time + 0.10);
      bodyO.connect(bodyG); bodyG.connect(drumBus);
      bodyO.start(time); bodyO.stop(time + 0.12);

      // Layer 3: Wire noise — bandpass 3kHz, snare rattle character
      var wireLen = Math.floor(ctx.sampleRate * 0.15);
      var wireBuf = ctx.createBuffer(1, wireLen, ctx.sampleRate);
      var wrd = wireBuf.getChannelData(0);
      for (var wi = 0; wi < wireLen; wi++) wrd[wi] = (Math.random() * 2 - 1) * Math.pow(1 - wi / wireLen, 1.2);
      var wireSrc = ctx.createBufferSource(); wireSrc.buffer = wireBuf;
      var wireBP = ctx.createBiquadFilter(); wireBP.type = 'bandpass'; wireBP.frequency.value = 3000; wireBP.Q.value = 0.7;
      var wireG = ctx.createGain();
      wireG.gain.setValueAtTime(0.30 * vel, time);
      wireG.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
      wireSrc.connect(wireBP); wireBP.connect(wireG); wireG.connect(drumBus);
      wireSrc.start(time); wireSrc.stop(time + 0.20);
    }
  }

  function playHat(time, vel, kit) {
    // Inharmonic metallic oscillators — the actual spectrum of a hi-hat
    // Ratios from physical modeling of struck metal plates
    var ratios = [1.0, 1.483, 1.932, 2.546, 3.111, 3.637];
    var baseFreq, dur, masterVol;
    if (kit === '808')    { baseFreq = 400; dur = 0.055; masterVol = 0.22; }
    else if (kit === 'brushes') { baseFreq = 320; dur = 0.095; masterVol = 0.11; }
    else if (kit === 'glitch')  { baseFreq = 600; dur = 0.022; masterVol = 0.28; }
    else                        { baseFreq = 440; dur = 0.048; masterVol = 0.20; }

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

  function playRide(time, vel) {
    // Bell: warm resonant ping (darkened)
    var bell = ctx.createOscillator(); bell.type = 'square'; bell.frequency.value = 800;
    var bellFilt = ctx.createBiquadFilter();
    bellFilt.type = 'bandpass'; bellFilt.frequency.value = 1800; bellFilt.Q.value = 1.5;
    var bellG = ctx.createGain();
    bellG.gain.setValueAtTime(0.10 * vel, time);
    bellG.gain.exponentialRampToValueAtTime(0.001, time + 0.6);
    bell.connect(bellFilt); bellFilt.connect(bellG); bellG.connect(drumBus);
    bell.start(time); bell.stop(time + 0.65);

    // Shimmer wash (bandpass — controlled, not crispy)
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

    // Stick click (LP filtered)
    var cLen = Math.floor(ctx.sampleRate * 0.004);
    var cBuf = ctx.createBuffer(1, cLen, ctx.sampleRate);
    var cd = cBuf.getChannelData(0);
    for (var i = 0; i < cLen; i++) cd[i] = (Math.random() * 2 - 1) * (1 - i / cLen);
    var cSrc = ctx.createBufferSource(); cSrc.buffer = cBuf;
    var cLP = ctx.createBiquadFilter(); cLP.type = 'lowpass'; cLP.frequency.value = 2000; cLP.Q.value = 0.5;
    var cG = ctx.createGain(); cG.gain.value = 0.25 * vel;
    cSrc.connect(cLP); cLP.connect(cG); cG.connect(drumBus);
    cSrc.start(time); cSrc.stop(time + 0.006);
  }

  function playTimpani(time, vel) {
    var o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(85, time);
    o.frequency.exponentialRampToValueAtTime(55, time + 0.12);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.5 * vel, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 1.8);
    o.connect(g); g.connect(drumBus);
    o.start(time); o.stop(time + 1.9);

    var o2 = ctx.createOscillator(); o2.type = 'sine';
    o2.frequency.setValueAtTime(170, time);
    o2.frequency.exponentialRampToValueAtTime(110, time + 0.08);
    var g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.2 * vel, time);
    g2.gain.exponentialRampToValueAtTime(0.001, time + 1.0);
    o2.connect(g2); g2.connect(drumBus);
    o2.start(time); o2.stop(time + 1.1);

    var mLen = Math.floor(ctx.sampleRate * 0.02);
    var mBuf = ctx.createBuffer(1, mLen, ctx.sampleRate);
    var md = mBuf.getChannelData(0);
    for (var i = 0; i < mLen; i++) md[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / mLen, 4);
    var mSrc = ctx.createBufferSource(); mSrc.buffer = mBuf;
    var mLP = ctx.createBiquadFilter(); mLP.type = 'lowpass'; mLP.frequency.value = 250;
    var mG = ctx.createGain(); mG.gain.value = 0.35 * vel;
    mSrc.connect(mLP); mLP.connect(mG); mG.connect(drumBus);
    mSrc.start(time); mSrc.stop(time + 0.03);
  }

  // ── SYNTH ENGINES ──────────────────────────────────────────────────────

  function synthesize(type, time, freq, vel, decay, opts) {
    switch (type) {
      case 'piano': synthPiano(time, freq, vel, decay); break;
      case 'organ': synthOrgan(time, freq, vel, decay); break;
      case 'bell': synthBell(time, freq, vel, decay); break;
      case 'stab': synthStab(time, freq, vel); break;
      case 'glitch': synthGlitch(time, freq, vel); break;
      case 'fm': synthFM(time, freq, vel, decay, opts); break;
      case 'epiano': synthEPiano(time, freq, vel, decay); break;
      case 'pluck': synthPluck(time, freq, vel, decay); break;
      case 'brass': synthBrass(time, freq, vel, decay); break;
      case 'sub808': synthSub808(time, freq, vel); break;
      case 'choir': synthChoir(time, freq, vel, decay); break;
      case 'formant': synthFormantNote(time, freq, vel, decay); break;
      case 'vibe': synthVibe(time, freq, vel, decay); break;
      case 'strings': synthStrings(time, freq, vel, decay); break;
      case 'reverse': synthReverse(time, freq, vel, decay); break;
      case 'upright': synthUpright(time, freq, vel); break;
      case 'dirty':   synthDirtyWorld(time, freq, vel, decay); break;
      case 'massive': synthMassive(time, freq, vel, decay); break;
      default: synthSimple(time, freq, vel, decay, opts); break;
    }
  }

  // ── DIRTY WORLD — Fred Again underworld: detuned saws, fuzz, sub ──────
  // This is the sound of falling through the floor.
  // Three detuned saws through heavy distortion. A sine sub underneath.
  // Slow LFO on the filter — it breathes. It's alive and dark.

  function synthDirtyWorld(time, freq, vel, decay) {
    var dur = decay || 7.0;

    // Heavy distortion waveshaper — the filth
    var dist = ctx.createWaveShaper();
    var n = 256, curve = new Float32Array(n);
    for (var i = 0; i < n; i++) {
      var x = (i * 2) / n - 1;
      curve[i] = Math.sign(x) * Math.pow(Math.abs(x), 0.28); // aggressive asymmetric clip
    }
    dist.curve = curve;
    dist.oversample = '4x';

    // Dark LP filter — starts sealed, LFO slowly opens it
    var filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(500, time);
    filt.frequency.linearRampToValueAtTime(2200, time + dur * 0.5);
    filt.Q.value = 2.4;

    // Slow LFO — the filter breathes at 0.15Hz
    var lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.15;
    var lfoG = ctx.createGain();
    lfoG.gain.value = 140;
    lfo.connect(lfoG);
    lfoG.connect(filt.frequency);
    lfo.start(time);
    lfo.stop(time + dur + 1);

    // Master envelope — slow organic attack, very long sustain
    var env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.setTargetAtTime(vel * 0.68, time, 0.025);
    env.gain.setTargetAtTime(vel * 0.50, time + 0.08, 1.2);
    env.gain.setTargetAtTime(0.001, time + dur * 0.65, dur * 0.45);

    // Three detuned saws — the mass
    var detunes = [-34, 0, 29];
    for (var d = 0; d < detunes.length; d++) {
      var o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = freq;
      o.detune.value = detunes[d];
      var og = ctx.createGain();
      og.gain.value = 0.32;
      o.connect(og);
      og.connect(filt);
      o.start(time);
      o.stop(time + dur + 1);
    }

    filt.connect(dist);
    dist.connect(env);
    env.connect(sidechainGain);

    // Sub sine underneath — felt more than heard
    var sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = freq / 2;
    var subG = ctx.createGain();
    subG.gain.setValueAtTime(0.0001, time);
    subG.gain.setTargetAtTime(vel * 0.55, time, 0.05);
    subG.gain.setTargetAtTime(0.0001, time + dur * 0.7, dur * 0.4);
    sub.connect(subG);
    subG.connect(sidechainGain);
    sub.start(time);
    sub.stop(time + dur + 1);

    // Heavy reverb send — the darkness has space
    var rs = ctx.createGain();
    rs.gain.value = 0.62;
    env.connect(rs);
    rs.connect(reverbSend);
  }

  // ── MASSIVE — detuned unison: same note, 4 copies, spread across pitch ──
  // This is the RFTN808 technique: duplicate a synth, detune each copy slightly.
  // Tight pair ±2 cents: subtle thickening (the "main synth" layer)
  // Wide pair ±13 cents: obvious chorus width (the "arp" layer)
  // The slight beating between copies creates movement without any LFO.
  // 4 oscillators only — mobile safe.

  function synthMassive(time, freq, vel, decay) {
    var dur = decay || 1.0;

    // Same frequency, 4 copies — detune only (NOT harmonic ratios)
    var detunes = [-13, -2,   2,   13 ];
    var gains   = [0.20, 0.25, 0.25, 0.20]; // wide pair quieter than tight core

    // Warm LP — not bright, not sealed. The width lives in the mids.
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2400;
    lp.Q.value = 1.0;

    // Light saturation — warmth without dirt
    var sat = ctx.createWaveShaper();
    var n = 128, sc = new Float32Array(n);
    for (var j = 0; j < n; j++) {
      var x = (j * 2) / n - 1;
      sc[j] = x * (1 - Math.abs(x) * 0.18); // very gentle soft clip
    }
    sat.curve = sc;

    // Envelope
    var env = ctx.createGain();
    env.gain.setValueAtTime(0.001, time);
    env.gain.linearRampToValueAtTime(Math.min(0.78, vel * 0.70), time + 0.014);
    env.gain.setTargetAtTime(vel * 0.38, time + 0.045, dur * 0.32);
    env.gain.linearRampToValueAtTime(0.001, time + dur);

    for (var i = 0; i < detunes.length; i++) {
      var o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = freq;
      o.detune.value = detunes[i];
      var g = ctx.createGain();
      g.gain.value = gains[i];
      o.connect(g);
      g.connect(lp);
      o.start(time);
      o.stop(time + dur + 0.12);
    }

    lp.connect(sat);
    sat.connect(env);
    env.connect(sidechainGain);
    var rs = ctx.createGain(); rs.gain.value = 0.30; env.connect(rs); rs.connect(reverbSend);
    var ds = ctx.createGain(); ds.gain.value = 0.44; env.connect(ds); ds.connect(delaySend);
  }

  // ── PIANO — jazz piano: hammer attack, layered harmonics ──────────────

  function synthPiano(time, freq, vel, decay) {
    var filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(1800 + vel * 2000, time);
    filt.frequency.setTargetAtTime(1400, time + 0.01, 0.2);
    filt.Q.value = 0.7;

    var env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(Math.min(0.92, vel * 0.88), time + 0.004);
    env.gain.setTargetAtTime(vel * 0.52, time + 0.004, 0.14);
    env.gain.setTargetAtTime(0.0001, time + decay * 0.5, decay * 0.35);

    var o1 = ctx.createOscillator(); o1.type = 'triangle'; o1.frequency.value = freq;
    var o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = freq; o2.detune.value = 6;
    var o3 = ctx.createOscillator(); o3.type = 'sine'; o3.frequency.value = freq * 2;
    var hG = ctx.createGain(); hG.gain.value = 0.18; o3.connect(hG);

    var cLen = Math.floor(ctx.sampleRate * 0.015);
    var cBuf = ctx.createBuffer(1, cLen, ctx.sampleRate);
    var cd = cBuf.getChannelData(0);
    for (var i = 0; i < cLen; i++) cd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / cLen, 3);
    var cSrc = ctx.createBufferSource(); cSrc.buffer = cBuf;
    var cG = ctx.createGain(); cG.gain.value = vel * 0.5; cSrc.connect(cG);

    o1.connect(filt); o2.connect(filt); hG.connect(filt); cG.connect(filt);
    filt.connect(env); env.connect(sidechainGain);

    var rs = ctx.createGain(); rs.gain.value = 0.45; env.connect(rs); rs.connect(reverbSend);
    var ds = ctx.createGain(); ds.gain.value = 0.2; env.connect(ds); ds.connect(delaySend);

    var end = time + decay + 0.5;
    o1.start(time); o1.stop(end); o2.start(time); o2.stop(end);
    o3.start(time); o3.stop(end); cSrc.start(time); cSrc.stop(time + 0.015);
  }

  // ── UPRIGHT BASS — walking bass: formant, string buzz ─────────────────

  function synthUpright(time, freq, vel) {
    var formant = ctx.createBiquadFilter();
    formant.type = 'peaking'; formant.frequency.value = 700; formant.Q.value = 2; formant.gain.value = 5;
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

  // ── ORGAN — gospel: drawbar harmonics, Leslie vibrato ─────────────────

  function synthOrgan(time, freq, vel, decay) {
    var filt = ctx.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.value = 2800; filt.Q.value = 0.5;

    var env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(Math.min(0.92, vel * 0.85), time + 0.010);
    env.gain.setTargetAtTime(vel * 0.72, time + 0.010, 0.22);
    env.gain.setTargetAtTime(0.0001, time + decay, decay * 0.3);

    var lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 6.5;

    var harmonics = [1, 2, 3, 4, 5.333];
    var hGains = [0.5, 0.4, 0.25, 0.15, 0.08];
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

  // ── BELL — inharmonic partials, long shimmer ──────────────────────────

  function synthBell(time, freq, vel, decay) {
    var env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(Math.min(0.92, vel * 0.85), time + 0.001);
    env.gain.setTargetAtTime(vel * 0.28, time + 0.001, decay * 0.4);

    var partials = [1, 2.4, 4.1, 5.3, 6.7];
    var pGains = [0.5, 0.25, 0.15, 0.1, 0.06];
    for (var i = 0; i < partials.length; i++) {
      var o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = freq * partials[i];
      var g = ctx.createGain(); g.gain.value = pGains[i];
      o.connect(g); g.connect(env);
      o.start(time); o.stop(time + decay + 0.5);
    }

    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2800; lp.Q.value = 0.5;
    env.connect(lp); lp.connect(sidechainGain);
    var rs = ctx.createGain(); rs.gain.value = 0.6; lp.connect(rs); rs.connect(reverbSend);
    var ds = ctx.createGain(); ds.gain.value = 0.4; lp.connect(ds); ds.connect(delaySend);
  }

  // ── STAB — resonant filter sweep, punchy ──────────────────────────────

  function synthStab(time, freq, vel) {
    var filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(3500, time);
    filt.frequency.exponentialRampToValueAtTime(250, time + 0.08);
    filt.Q.value = 6;

    var env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(Math.min(0.92, vel * 0.88), time + 0.001);
    env.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    var o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = freq;
    var oG = ctx.createGain(); oG.gain.value = 0.6; o.connect(oG);
    var sub = ctx.createOscillator(); sub.type = 'sine'; sub.frequency.value = freq;

    oG.connect(filt); sub.connect(filt); filt.connect(env);
    env.connect(sidechainGain);
    var rs = ctx.createGain(); rs.gain.value = 0.08; env.connect(rs); rs.connect(reverbSend);
    o.start(time); o.stop(time + 0.2); sub.start(time); sub.stop(time + 0.2);
  }

  // ── GLITCH — unstable pitch, distorted ────────────────────────────────

  function synthGlitch(time, freq, vel) {
    var waves = ['sawtooth', 'square', 'triangle'];
    var o = ctx.createOscillator();
    o.type = waves[Math.floor(Math.random() * waves.length)];
    o.frequency.value = freq;

    var lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 2 + Math.random() * 8;
    var lG = ctx.createGain(); lG.gain.value = freq * (0.02 + Math.random() * 0.05);
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
    var rs = ctx.createGain(); rs.gain.value = 0.3; lp.connect(rs); rs.connect(reverbSend);
    o.start(time); o.stop(time + 0.4); lfo.start(time); lfo.stop(time + 0.4);
  }

  // ── SIMPLE — fallback: single oscillator ──────────────────────────────

  function synthSimple(time, freq, vel, decay, opts) {
    var wave = (opts && opts.wave) || 'triangle';
    var o = ctx.createOscillator(); o.type = wave; o.frequency.value = freq;

    var g = ctx.createGain();
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(vel, time + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, time + decay);

    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3000; lp.Q.value = 0.5;
    o.connect(g); g.connect(lp); lp.connect(sidechainGain);
    var rs = ctx.createGain(); rs.gain.value = 0.35; lp.connect(rs); rs.connect(reverbSend);
    var ds = ctx.createGain(); ds.gain.value = 0.2; lp.connect(ds); ds.connect(delaySend);
    o.start(time); o.stop(time + decay + 0.1);
  }

  // ── FM SYNTHESIS — DX7 metallic, complex timbres ──────────────────────

  function synthFM(time, freq, vel, decay, opts) {
    var ratio = (opts && opts.ratio) || 3;
    var index = (opts && opts.index) || 6;

    var mod = ctx.createOscillator(); mod.type = 'sine';
    mod.frequency.value = freq * ratio;
    var modG = ctx.createGain();
    modG.gain.setValueAtTime(freq * index * 0.6, time);
    modG.gain.exponentialRampToValueAtTime(freq * index * 0.04, time + decay * 0.4);

    var car = ctx.createOscillator(); car.type = 'sine';
    car.frequency.value = freq;
    mod.connect(modG); modG.connect(car.frequency);

    var car2 = ctx.createOscillator(); car2.type = 'sine';
    car2.frequency.value = freq * 2;
    var c2g = ctx.createGain(); c2g.gain.value = 0.25; car2.connect(c2g);

    var env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(Math.min(0.92, vel * 0.88), time + 0.003);
    env.gain.setTargetAtTime(vel * 0.46, time + 0.003, 0.07);
    env.gain.setTargetAtTime(0.0001, time + decay * 0.4, decay * 0.3);

    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3000; lp.Q.value = 0.5;
    car.connect(env); c2g.connect(env);
    env.connect(lp); lp.connect(sidechainGain);
    var rs = ctx.createGain(); rs.gain.value = 0.3; lp.connect(rs); rs.connect(reverbSend);
    var ds = ctx.createGain(); ds.gain.value = 0.25; lp.connect(ds); ds.connect(delaySend);

    var end = time + decay + 0.3;
    mod.start(time); mod.stop(end);
    car.start(time); car.stop(end);
    car2.start(time); car2.stop(end);
  }

  // ── ELECTRIC PIANO — Rhodes: FM tine model, proper AM tremolo ─────────
  // The tine is an FM pair. Velocity drives modulation index (brightness).
  // Tremolo is AM (multiply after envelope) not additive — the original bug.

  function synthEPiano(time, freq, vel, decay) {
    var end = time + decay + 0.5;

    // FM pair 1: fundamental tine (vel drives modulation depth → brightness)
    var mod1 = ctx.createOscillator(); mod1.type = 'sine'; mod1.frequency.value = freq;
    var mod1G = ctx.createGain();
    var modIdx = 2.5 + vel * 1.8;  // soft touch = 2.5, hard = 4.3
    mod1G.gain.setValueAtTime(freq * modIdx, time);
    mod1G.gain.exponentialRampToValueAtTime(freq * 0.12, time + decay * 0.35);
    var car1 = ctx.createOscillator(); car1.type = 'sine'; car1.frequency.value = freq;
    mod1.connect(mod1G); mod1G.connect(car1.frequency);

    // FM pair 2: upper harmonic (softens toward silence)
    var mod2 = ctx.createOscillator(); mod2.type = 'sine'; mod2.frequency.value = freq * 2.01;
    var mod2G = ctx.createGain();
    mod2G.gain.setValueAtTime(freq * 1.2, time);
    mod2G.gain.exponentialRampToValueAtTime(freq * 0.04, time + decay * 0.2);
    var car2 = ctx.createOscillator(); car2.type = 'sine'; car2.frequency.value = freq * 2.01;
    mod2.connect(mod2G); mod2G.connect(car2.frequency);
    var c2gain = ctx.createGain(); c2gain.gain.value = 0.28; car2.connect(c2gain);

    // Envelope: exponential attack (no clicks), natural decay tail
    var env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(Math.min(0.92, vel * 0.88), time + 0.004);
    env.gain.setTargetAtTime(vel * 0.44, time + 0.004, 0.09);
    env.gain.setTargetAtTime(0.0001, time + decay * 0.5, decay * 0.38);

    // Tremolo: AM multiplication AFTER envelope, not LFO-into-envelope (was a bug)
    var tremoloGain = ctx.createGain(); tremoloGain.gain.value = 1;
    var trem = ctx.createOscillator(); trem.type = 'sine'; trem.frequency.value = 4.8;
    var tremDepth = ctx.createGain(); tremDepth.gain.value = 0.11 * vel; // velocity-sensitive tremolo depth
    trem.connect(tremDepth); tremDepth.connect(tremoloGain.gain);

    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4200; lp.Q.value = 0.4;
    car1.connect(env); c2gain.connect(env);
    env.connect(tremoloGain); tremoloGain.connect(lp); lp.connect(sidechainGain);
    var rs = ctx.createGain(); rs.gain.value = 0.38; lp.connect(rs); rs.connect(reverbSend);
    var ds = ctx.createGain(); ds.gain.value = 0.18; lp.connect(ds); ds.connect(delaySend);

    mod1.start(time); mod1.stop(end); car1.start(time); car1.stop(end);
    mod2.start(time); mod2.stop(end); car2.start(time); car2.stop(end);
    trem.start(time); trem.stop(end);
  }

  // ── PLUCKED STRING — harp/pizzicato ───────────────────────────────────

  function synthPluck(time, freq, vel, decay) {
    var excLen = Math.floor(ctx.sampleRate * 0.004);
    var excBuf = ctx.createBuffer(1, excLen, ctx.sampleRate);
    var ed = excBuf.getChannelData(0);
    for (var i = 0; i < excLen; i++) ed[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / excLen, 2);
    var excSrc = ctx.createBufferSource(); excSrc.buffer = excBuf;

    var body = ctx.createBiquadFilter();
    body.type = 'bandpass'; body.frequency.value = freq; body.Q.value = 60;
    var body2 = ctx.createBiquadFilter();
    body2.type = 'bandpass'; body2.frequency.value = freq * 2; body2.Q.value = 30;
    var b2g = ctx.createGain(); b2g.gain.value = 0.25;

    var osc = ctx.createOscillator(); osc.type = 'triangle'; osc.frequency.value = freq;
    var oscEnv = ctx.createGain();
    oscEnv.gain.setValueAtTime(vel * 0.6, time);
    oscEnv.gain.exponentialRampToValueAtTime(0.001, time + decay * 0.6);

    var env = ctx.createGain();
    env.gain.setValueAtTime(Math.min(0.92, vel * 0.88), time);
    env.gain.exponentialRampToValueAtTime(0.0001, time + decay);

    excSrc.connect(body); body.connect(env);
    excSrc.connect(body2); body2.connect(b2g); b2g.connect(env);
    osc.connect(oscEnv); oscEnv.connect(env);
    env.connect(sidechainGain);

    var rs = ctx.createGain(); rs.gain.value = 0.45; env.connect(rs); rs.connect(reverbSend);
    var ds = ctx.createGain(); ds.gain.value = 0.15; env.connect(ds); ds.connect(delaySend);

    excSrc.start(time); excSrc.stop(time + 0.006);
    osc.start(time); osc.stop(time + decay + 0.1);
  }

  // ── BRASS — cinematic: sawtooth + filter bite + vibrato ───────────────

  function synthBrass(time, freq, vel, decay) {
    var filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(300, time);
    filt.frequency.exponentialRampToValueAtTime(1500 + vel * 1500, time + 0.06);
    filt.frequency.setTargetAtTime(1200, time + 0.06, 0.3);
    filt.Q.value = 2;

    var env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.setTargetAtTime(Math.min(0.92, vel * 0.82), time, 0.018);
    env.gain.setTargetAtTime(vel * 0.62, time + 0.06, 0.2);
    env.gain.setTargetAtTime(0.0001, time + decay * 0.6, decay * 0.3);

    var detunes = [-8, 0, 8];
    for (var i = 0; i < detunes.length; i++) {
      var o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = freq;
      o.detune.value = detunes[i];
      var g = ctx.createGain(); g.gain.value = 0.35;
      o.connect(g); g.connect(filt);
      o.start(time); o.stop(time + decay + 0.5);
    }

    var vib = ctx.createOscillator(); vib.type = 'sine'; vib.frequency.value = 5.5;
    var vibG = ctx.createGain();
    vibG.gain.setValueAtTime(0, time);
    vibG.gain.linearRampToValueAtTime(freq * 0.006, time + 0.15);
    vib.connect(vibG);
    vibG.connect(filt.frequency);
    vib.start(time); vib.stop(time + decay + 0.5);

    filt.connect(env); env.connect(sidechainGain);
    var rs = ctx.createGain(); rs.gain.value = 0.35; env.connect(rs); rs.connect(reverbSend);
  }

  // ── SUB 808 — chest-shaking bass hit ──────────────────────────────────

  function synthSub808(time, freq, vel) {
    var o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(freq * 3, time);
    o.frequency.exponentialRampToValueAtTime(freq, time + 0.06);

    var env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(Math.min(0.92, vel * 0.85), time + 0.004);
    env.gain.setTargetAtTime(vel * 0.65, time + 0.004, 0.09);
    env.gain.exponentialRampToValueAtTime(0.0001, time + 1.8);

    var sub = ctx.createOscillator(); sub.type = 'sine';
    sub.frequency.value = freq / 2;
    var subG = ctx.createGain(); subG.gain.value = 0.45;
    sub.connect(subG);

    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.value = 600; lp.Q.value = 1.2;  // was 120Hz — nearly inaudible on headphones

    o.connect(lp); subG.connect(lp); lp.connect(env);
    env.connect(sidechainGain);
    var rs = ctx.createGain(); rs.gain.value = 0.05; env.connect(rs); rs.connect(reverbSend);

    o.start(time); o.stop(time + 2);
    sub.start(time); sub.stop(time + 2);
  }

  // ── FORMANT NOTE — vocal synthesis ────────────────────────────────────

  function synthFormantNote(time, freq, vel, decay) {
    var o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = freq;
    var o2 = ctx.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = freq;
    o2.detune.value = 7;

    var f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 700; f1.Q.value = 5;
    var f2 = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 1100; f2.Q.value = 5;
    var f3 = ctx.createBiquadFilter(); f3.type = 'bandpass'; f3.frequency.value = 2400; f3.Q.value = 5;

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
    env.gain.setTargetAtTime(vel * 0.52, time + 0.07, 0.28);
    env.gain.setTargetAtTime(0.0001, time + decay * 0.6, decay * 0.3);

    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2800; lp.Q.value = 0.5;
    mix.connect(env); env.connect(lp); lp.connect(sidechainGain);
    var rs = ctx.createGain(); rs.gain.value = 0.5; lp.connect(rs); rs.connect(reverbSend);

    var end = time + decay + 0.5;
    o.start(time); o.stop(end); o2.start(time); o2.stop(end);
    morphLfo.start(time); morphLfo.stop(end);
  }

  // ── VIBRAPHONE — motor tremolo, felt mallet, resonator bars ──────────

  function synthVibe(time, freq, vel, decay) {
    // Motor tremolo — the spinning discs inside a real vibraphone
    var motor = ctx.createOscillator();
    motor.type = 'sine'; motor.frequency.value = 5.8;
    var motorDepth = ctx.createGain();
    motorDepth.gain.value = 0.22 * vel;
    motor.connect(motorDepth);

    // Bar partials: these ratios are specific to metal bar geometry
    var partials = [1, 3.93, 9.9];
    var pGains   = [0.6, 0.18, 0.06];
    var end = time + decay + 0.6;

    var sumGain = ctx.createGain(); sumGain.gain.value = 1;
    for (var i = 0; i < partials.length; i++) {
      var o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.value = freq * partials[i];
      var g = ctx.createGain(); g.gain.value = pGains[i];
      o.connect(g); g.connect(sumGain);
      o.start(time); o.stop(end);
    }

    // Soft felt mallet attack — not a hard bell strike
    var env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(Math.min(0.92, vel * 0.82), time + 0.016);
    env.gain.setTargetAtTime(vel * 0.50, time + 0.016, decay * 0.28);
    env.gain.setTargetAtTime(0.0001, time + decay * 0.65, decay * 0.3);
    motorDepth.connect(env.gain); // motor modulates the envelope amplitude

    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5000; lp.Q.value = 0.3;
    sumGain.connect(env); env.connect(lp); lp.connect(sidechainGain);
    var rs = ctx.createGain(); rs.gain.value = 0.55; lp.connect(rs); rs.connect(reverbSend);
    var ds = ctx.createGain(); ds.gain.value = 0.28; lp.connect(ds); ds.connect(delaySend);
    motor.start(time); motor.stop(end);
  }

  // ── STRINGS — bowed section: slow bow attack, detuned saws ──────────

  function synthStrings(time, freq, vel, decay) {
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 2200; lp.Q.value = 0.4;

    var detunes = [-14, -5, 0, 5, 14];
    var gains   = [0.18, 0.28, 0.32, 0.28, 0.18];
    var end = time + decay + 1.5;
    for (var i = 0; i < detunes.length; i++) {
      var o = ctx.createOscillator(); o.type = 'sawtooth';
      o.frequency.value = freq; o.detune.value = detunes[i];
      var g = ctx.createGain(); g.gain.value = gains[i];
      o.connect(g); g.connect(lp);
      o.start(time); o.stop(end);
    }

    // Vibrato — bowing character, fades in after attack
    var vib = ctx.createOscillator(); vib.type = 'sine'; vib.frequency.value = 5.2;
    var vibG = ctx.createGain();
    vibG.gain.setValueAtTime(0, time);
    vibG.gain.linearRampToValueAtTime(freq * 0.004, time + 0.4);
    vib.connect(vibG); vibG.connect(lp.frequency);
    vib.start(time); vib.stop(end);

    // Slow bow attack: setTargetAtTime gives the organic "bow catching the string" swell
    // Linear was the tell — this is the change that makes strings stop sounding synthetic
    var env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.setTargetAtTime(vel * 0.88, time, 0.12);  // τ=120ms: reaches ~86% at 360ms, sounds natural
    env.gain.setTargetAtTime(vel * 0.68, time + 0.45, 0.5);
    env.gain.setTargetAtTime(0.0001, time + decay * 0.7, decay * 0.4);

    lp.connect(env); env.connect(sidechainGain);
    var rs = ctx.createGain(); rs.gain.value = 0.65; env.connect(rs); rs.connect(reverbSend);
    var ds = ctx.createGain(); ds.gain.value = 0.08; env.connect(ds); ds.connect(delaySend);
  }

  // ── CHOIR — 3-voice layered vocal synthesis with breathing attack ──────

  function synthChoir(time, freq, vel, decay) {
    var freqs   = [freq, freq * 1.5, freq * 2];   // unison, 5th, octave
    var vGains  = [0.55, 0.3, 0.2];
    var end = time + decay + 0.8;

    var mix = ctx.createGain(); mix.gain.value = 1;

    for (var v = 0; v < freqs.length; v++) {
      var vf = freqs[v];
      var o1 = ctx.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = vf;
      var o2 = ctx.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = vf;
      o2.detune.value = 9; // choir width

      // Vowel formant filters — open 'ah' character
      var f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 800;  f1.Q.value = 4;
      var f2 = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 1200; f2.Q.value = 5;
      var f3 = ctx.createBiquadFilter(); f3.type = 'bandpass'; f3.frequency.value = 2500; f3.Q.value = 6;
      var f1g = ctx.createGain(); f1g.gain.value = 0.5;
      var f2g = ctx.createGain(); f2g.gain.value = 0.35;
      var f3g = ctx.createGain(); f3g.gain.value = 0.12;
      var vg  = ctx.createGain(); vg.gain.value = vGains[v];

      o1.connect(f1); o1.connect(f2); o1.connect(f3);
      o2.connect(f1); o2.connect(f2); o2.connect(f3);
      f1.connect(f1g); f2.connect(f2g); f3.connect(f3g);
      f1g.connect(vg); f2g.connect(vg); f3g.connect(vg);
      vg.connect(mix);

      o1.start(time); o1.stop(end);
      o2.start(time); o2.stop(end);
    }

    // Breathing attack — the inhale before the note
    var env = ctx.createGain();
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(vel * 0.85, time + 0.18);
    env.gain.setTargetAtTime(vel * 0.65, time + 0.18, 0.5);
    env.gain.setTargetAtTime(0.001, time + decay * 0.65, decay * 0.35);

    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3000; lp.Q.value = 0.5;
    mix.connect(env); env.connect(lp); lp.connect(sidechainGain);
    var rs = ctx.createGain(); rs.gain.value = 0.7; lp.connect(rs); rs.connect(reverbSend);
    var ds = ctx.createGain(); ds.gain.value = 0.1; lp.connect(ds); ds.connect(delaySend);
  }

  // ── REVERSE — inverted envelope + downward glide = psychedelic tunnel ─

  function synthReverse(time, freq, vel, decay) {
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(3500, time);
    lp.frequency.exponentialRampToValueAtTime(500, time + decay * 0.85);
    lp.Q.value = 1.2;

    // Downward pitch glide: starts high, falls — the reversed-tape feel
    var detunes = [-12, 0, 12];
    var end = time + decay + 0.4;
    for (var i = 0; i < detunes.length; i++) {
      var o = ctx.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(freq * 1.3, time);
      o.frequency.exponentialRampToValueAtTime(freq * 0.72, time + decay * 0.9);
      o.detune.value = detunes[i];
      var g = ctx.createGain(); g.gain.value = 0.33;
      o.connect(g); g.connect(lp);
      o.start(time); o.stop(end);
    }

    // Reverse envelope: swell IN, then abrupt silence — the backwards ghost
    var env = ctx.createGain();
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(vel * 0.08, time + decay * 0.25);
    env.gain.linearRampToValueAtTime(vel * 1.1, time + decay * 0.88);
    env.gain.linearRampToValueAtTime(0.001, time + decay);

    lp.connect(env); env.connect(sidechainGain);
    var rs = ctx.createGain(); rs.gain.value = 0.5; env.connect(rs); rs.connect(reverbSend);
    var ds = ctx.createGain(); ds.gain.value = 0.75; env.connect(ds); ds.connect(delaySend);
  }

  // ── CRACKLE ────────────────────────────────────────────────────────────

  function startCrackle() {
    if (crackleNode) return;
    var len = ctx.sampleRate * 4;
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() > 0.997 ? (Math.random() * 2 - 1) * 0.3 : 0;
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

  // ── VOID DRONE ─────────────────────────────────────────────────────────

  function startVoidDrone(root) {
    if (voidOsc) return;
    var r = root || 432;
    voidFilter = ctx.createBiquadFilter(); voidFilter.type = 'lowpass';
    voidFilter.frequency.value = 400; voidFilter.Q.value = 1;
    voidGain = ctx.createGain(); voidGain.gain.value = 0;
    voidOsc = ctx.createOscillator(); voidOsc.type = 'sine'; voidOsc.frequency.value = r;
    voidOsc.connect(voidFilter); voidFilter.connect(voidGain);
    voidGain.connect(reverbGain);
    voidOsc.start();
    voidOvertone = ctx.createOscillator(); voidOvertone.type = 'sine';
    voidOvertone.frequency.value = r * 1.5;
    voidOvertoneGain = ctx.createGain(); voidOvertoneGain.gain.value = 0;
    voidOvertone.connect(voidOvertoneGain); voidOvertoneGain.connect(voidFilter);
    voidOvertone.start();
  }

  function stopVoidDrone() {
    try { if (voidOsc) { voidOsc.stop(); voidOsc.disconnect(); } } catch (e) {}
    try { if (voidOvertone) { voidOvertone.stop(); voidOvertone.disconnect(); } } catch (e) {}
    try { if (voidGain) voidGain.disconnect(); } catch (e) {}
    try { if (voidFilter) voidFilter.disconnect(); } catch (e) {}
    try { if (voidOvertoneGain) voidOvertoneGain.disconnect(); } catch (e) {}
    voidOsc = voidGain = voidOvertone = voidOvertoneGain = voidFilter = null;
  }

  function updateVoidDrone(depth, breathPhase) {
    if (!ctx) return;
    if (depth > 0.15) {
      if (!voidOsc) startVoidDrone();
      var target = depth * 0.25;
      voidGain.gain.value += (target - voidGain.gain.value) * 0.02;
      if (voidFilter) voidFilter.frequency.value = 300 + Math.sin(breathPhase || 0) * 150;
      if (voidOvertone && depth > 0.5) {
        voidOvertoneGain.gain.value += ((depth - 0.5) * 0.1 - voidOvertoneGain.gain.value) * 0.02;
      }
    } else if (voidOsc) {
      stopVoidDrone();
    }
  }

  // ── DESCENT BASS — the sub-bass world ─────────────────────────────────
  // Vangelis / Giorgio Moroder / Tron: sine foundation, slow LFO pulse,
  // filter that opens as the user earns the ascent back to full spectrum.
  // Three oscillators: root (heavy) + fifth (body) + octave (air).

  function startDescentBass(freq) {
    if (desOsc1) return;
    var f = freq || 54;

    desFilter = ctx.createBiquadFilter();
    desFilter.type = 'lowpass';
    desFilter.frequency.value = 140;
    desFilter.Q.value = 1.4;

    desGain = ctx.createGain();
    desGain.gain.value = 0;

    // 0.35 Hz LFO — the Tron pulse, the slow breath of the machine
    desLFO = ctx.createOscillator();
    desLFO.type = 'sine';
    desLFO.frequency.value = 0.35;
    desLFOGain = ctx.createGain();
    desLFOGain.gain.value = 0.20;
    desLFO.connect(desLFOGain);
    desLFOGain.connect(desGain.gain);
    desLFO.start();

    desOsc1 = ctx.createOscillator(); desOsc1.type = 'sine'; desOsc1.frequency.value = f;
    desOsc2 = ctx.createOscillator(); desOsc2.type = 'sine'; desOsc2.frequency.value = f * 1.5;
    desOsc3 = ctx.createOscillator(); desOsc3.type = 'sine'; desOsc3.frequency.value = f * 2;

    var g1 = ctx.createGain(); g1.gain.value = 0.62;
    var g2 = ctx.createGain(); g2.gain.value = 0.22;
    var g3 = ctx.createGain(); g3.gain.value = 0.10;

    desOsc1.connect(g1); g1.connect(desFilter);
    desOsc2.connect(g2); g2.connect(desFilter);
    desOsc3.connect(g3); g3.connect(desFilter);

    desFilter.connect(desGain);
    desGain.connect(masterGain);

    desRvbSend = ctx.createGain();
    desRvbSend.gain.value = 0.55;
    desGain.connect(desRvbSend);
    if (reverbSend) desRvbSend.connect(reverbSend);

    desOsc1.start(); desOsc2.start(); desOsc3.start();
  }

  function stopDescentBass() {
    try { if (desLFO)      { desLFO.stop();  desLFO.disconnect(); }      } catch (e) {}
    try { if (desOsc1)     { desOsc1.stop(); desOsc1.disconnect(); }     } catch (e) {}
    try { if (desOsc2)     { desOsc2.stop(); desOsc2.disconnect(); }     } catch (e) {}
    try { if (desOsc3)     { desOsc3.stop(); desOsc3.disconnect(); }     } catch (e) {}
    try { if (desLFOGain)  desLFOGain.disconnect();  } catch (e) {}
    try { if (desFilter)   desFilter.disconnect();   } catch (e) {}
    try { if (desGain)     desGain.disconnect();     } catch (e) {}
    try { if (desRvbSend)  desRvbSend.disconnect();  } catch (e) {}
    desOsc1 = desOsc2 = desOsc3 = null;
    desGain = desFilter = desLFO = desLFOGain = desRvbSend = null;
  }

  function updateDescentBass(vol, filterHz, freq) {
    if (!ctx) return;
    if (!desOsc1 && vol > 0.01) startDescentBass(freq);
    if (!desOsc1) return;

    // Smooth gain — LFO rides on top of this base value
    desGain.gain.value += (Math.max(0, vol) - desGain.gain.value) * 0.018;

    // Filter sweep — the 80s drama: tight sine → harmonic wash
    if (desFilter) desFilter.frequency.value += (filterHz - desFilter.frequency.value) * 0.03;

    // Portamento — bass pitch glides, never jumps. Tilt wobble is glacial.
    if (freq) {
      desOsc1.frequency.value += (freq       - desOsc1.frequency.value) * 0.008;
      desOsc2.frequency.value += (freq * 1.5 - desOsc2.frequency.value) * 0.008;
      desOsc3.frequency.value += (freq * 2   - desOsc3.frequency.value) * 0.008;
    }

    if (vol < 0.005 && Math.abs(desGain.gain.value) < 0.005) stopDescentBass();
  }

  // ── PUBLIC API ─────────────────────────────────────────────────────────

  return Object.freeze({
    init: init,
    configure: configure,
    updateDelaySync: updateDelaySync,

    synth: Object.freeze({
      piano: synthPiano,
      epiano: synthEPiano,
      organ: synthOrgan,
      bell: synthBell,
      brass: synthBrass,
      pluck: synthPluck,
      fm: synthFM,
      simple: synthSimple,
      upright: synthUpright,
      sub808: synthSub808,
      formant: synthFormantNote,
      stab: synthStab,
      glitch: synthGlitch,
      massive: synthMassive,
      play: synthesize,
    }),

    drum: Object.freeze({
      kick: playKick,
      snare: playSnare,
      hat: playHat,
      ride: playRide,
      timpani: playTimpani,
    }),

    layer: Object.freeze({
      build: buildLayer,
      destroy: destroyLayer,
      destroyAll: destroyAllLayers,
      setGain: setLayerGain,
      setFreqs: setLayerFreqs,
      setFilter: setLayerFilter,
      get: getLayer,
    }),

    crackle: Object.freeze({ start: startCrackle, stop: stopCrackle }),
    voidDrone: Object.freeze({ start: startVoidDrone, stop: stopVoidDrone, update: updateVoidDrone }),
    descentBass: Object.freeze({ start: startDescentBass, stop: stopDescentBass, update: updateDescentBass }),

    spatial: Object.freeze({ update: updateSpatial, setTouchPan: setTouchPan }),

    hTime: hTime,
    hVel: hVel,
    pumpSidechain: pumpSidechain,

    setMasterGain: function (v) { if (masterGain) masterGain.gain.value = v; },
    setReverbMix: function (v) { if (reverbSend) reverbSend.gain.value = v; },

    get ctx() { return ctx; },
    get master() { return masterGain; },
    get sidechain() { return sidechainGain; },
    get reverbSendNode() { return reverbSend; },
    get delaySendNode() { return delaySend; },
    get drumBusNode() { return drumBus; },
    get reverbGainNode() { return reverbGain; },
  });
})();
