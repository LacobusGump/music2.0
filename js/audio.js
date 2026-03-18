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
  let reverbHPF = null;
  let reverbPreDelay = null;
  let delayNode = null;
  let delayFeedback = null;
  let delayFilter = null;
  let delaySend = null;
  let delayMix = null;
  let crackleNode = null;
  let crackleGainNode = null;
  let sidechainDepth = 0.3;
  var _edm808SubFreq = 55;  // overrideable by Grid EDM engine

  // Void drone
  let voidOscs = [], voidOscGains = [];
  let voidGain = null, voidFilter = null;
  let voidLFO = null, voidLFOGain = null;

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

    // ── Master limiter — safety ceiling before spatialPanner ─────────────
    // Catches anything over -3dBFS. Ratio 10:1 with soft knee — transparent,
    // not a brick wall. The compressor upstream should handle most levelling.
    masterLimiter = ctx.createDynamicsCompressor();
    masterLimiter.threshold.value = -3;
    masterLimiter.knee.value = 2;
    masterLimiter.ratio.value = 10;
    masterLimiter.attack.value = 0.002;
    masterLimiter.release.value = 0.10;
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
    masterGain.gain.value = 0.8;  // runtime value set by follow.js setMasterGain
    masterGain.connect(masterHPF);

    compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -22;   // gentler threshold — more headroom before gain reduction
    compressor.knee.value = 10;         // soft knee — transparent, not grabby
    compressor.ratio.value = 3;         // subtle ratio — levelling, not crushing
    compressor.attack.value = 0.010;    // 10ms: transients pass through cleanly
    compressor.release.value = 0.25;    // slow release — no pumping artifacts
    compressor.connect(masterGain);

    // Saturator bypassed — WaveShaper adds harmonic distortion that compounds
    // with phone speaker distortion. Route sidechainGain directly to compressor.
    saturator = ctx.createWaveShaper();  // kept for compatibility, disconnected from path
    saturator.curve = makeSatCurve(0.08);
    saturator.oversample = '4x';
    // (saturator is NOT connected — sidechainGain → compressor directly)

    sidechainGain = ctx.createGain();
    sidechainGain.connect(compressor);   // bypass saturator

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
    buildReverb(rev.decay || 3.0, rev.damping || 0.4, rev.preDelay || 20);

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
    sidechainDepth = space.sidechain !== undefined ? space.sidechain : 0;  // 0 unless lens explicitly enables pumping

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
  var spatialTouchActive = false;

  function updateSpatial(gamma, isSilent, touching) {
    if (!spatialPanner || !ctx) return;

    // Kill LFO entirely
    spatialLFOGain.gain.setTargetAtTime(0, ctx.currentTime, 0.5);

    if (touching) {
      spatialTouchActive = true;
      return;
    }

    // When touch releases, smoothly return to center before tilt takes over
    if (spatialTouchActive) {
      spatialTouchActive = false;
      spatialPanner.pan.setTargetAtTime(0, ctx.currentTime, 0.3);
      return;
    }

    // Tilt → gentle pan. Center = 0. Left = left. Right = right.
    // ±0.18 max — subtle positioning, not slamming.
    var tiltPan = Math.max(-0.18, Math.min(0.18, (gamma || 0) / 140));
    spatialPanner.pan.setTargetAtTime(tiltPan, ctx.currentTime, 0.5);
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

  function buildReverb(decayTime, damping, preDelayMs) {
    if (reverbSend)      { try { reverbSend.disconnect();      } catch (e) {} }
    if (reverbPreDelay)  { try { reverbPreDelay.disconnect();  } catch (e) {} }
    if (convolver)       { try { convolver.disconnect();       } catch (e) {} }
    if (reverbHPF)       { try { reverbHPF.disconnect();       } catch (e) {} }
    if (reverbLP)        { try { reverbLP.disconnect();        } catch (e) {} }
    if (reverbGain)      { try { reverbGain.disconnect();      } catch (e) {} }

    var sr = ctx.sampleRate;
    var cappedDecay = Math.min(decayTime, 6);
    convolver = ctx.createConvolver();
    var len = Math.floor(sr * cappedDecay);
    var buf = ctx.createBuffer(2, len, sr);

    // Smooth diffuse tail — each channel gets independent random noise for stereo width.
    // Fade-in for first 50ms: the room "blooms" open rather than snapping on.
    // (Pre-delay node already provides the acoustic distance perception.)
    var fadeInSamples = Math.floor(0.050 * sr);

    for (var ch = 0; ch < 2; ch++) {
      var d = buf.getChannelData(ch);
      for (var i = 0; i < len; i++) {
        var t = i / len;
        var fadeIn  = Math.min(1, i / fadeInSamples);
        var exponent = 1.5 + damping * 3;
        var envelope = Math.pow(1 - t, exponent);
        var hfDamp  = 1 - damping * t;
        d[i] = (Math.random() * 2 - 1) * envelope * Math.max(0.05, hfDamp) * fadeIn;
      }
    }
    convolver.buffer = buf;

    if (!reverbSend) {
      reverbSend = ctx.createGain();
      reverbSend.gain.value = 0.3;
    }

    // Pre-delay: acoustic distance from source to first reflection.
    // 1ms ≈ 34cm. 30ms = instrument is ~10m away. Gives reverb "space" without
    // smearing the attack — the note lands dry, then the room arrives.
    reverbPreDelay = ctx.createDelay(0.12);
    reverbPreDelay.delayTime.value = Math.min((preDelayMs || 20), 100) / 1000;

    reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.5;

    // HPF on reverb return: kills sub-bass mud (below 120Hz) without removing warmth.
    // Keeps the bloom and body of the reverb while cleaning up the low end.
    reverbHPF = ctx.createBiquadFilter();
    reverbHPF.type = 'highpass';
    reverbHPF.frequency.value = 120;
    reverbHPF.Q.value = 0.5;

    // Reverb LP: 4000Hz — air in the tails without harshness on headphones
    reverbLP = ctx.createBiquadFilter();
    reverbLP.type = 'lowpass';
    reverbLP.frequency.value = 4000;
    reverbLP.Q.value = 0.5;

    // Signal chain: send → preDelay → convolver → HPF → LP → gain → master
    reverbSend.connect(reverbPreDelay);
    reverbPreDelay.connect(convolver);
    convolver.connect(reverbHPF);
    reverbHPF.connect(reverbLP);
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
      // 4-layer 808 kick: click + body + sub tail + saturation
      // The sub tail IS the bass in EDM — long sustain at root freq

      // Layer 1: Click — noise burst HP 3500Hz, 4ms snap
      var clickLen = Math.floor(ctx.sampleRate * 0.004);
      var clickBuf = ctx.createBuffer(1, clickLen, ctx.sampleRate);
      var cd = clickBuf.getChannelData(0);
      for (var ci = 0; ci < clickLen; ci++) cd[ci] = (Math.random() * 2 - 1) * Math.pow(1 - ci / clickLen, 0.3);
      var clickSrc = ctx.createBufferSource(); clickSrc.buffer = clickBuf;
      var clickHP = ctx.createBiquadFilter(); clickHP.type = 'highpass'; clickHP.frequency.value = 3500;

      // Layer 2: Body — sine 180→55Hz over 30ms
      var bodyO = ctx.createOscillator(); bodyO.type = 'sine';
      bodyO.frequency.setValueAtTime(180, time);
      bodyO.frequency.exponentialRampToValueAtTime(55, time + 0.03);
      var bodyG = ctx.createGain();
      bodyG.gain.setValueAtTime(0.85 * vel, time);
      bodyG.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

      // Saturation on click+body only (not sub) — tanh(x*2.5) warmth
      var sat808 = ctx.createWaveShaper();
      var satN = 256, satCurve = new Float32Array(satN);
      for (var si = 0; si < satN; si++) {
        var sx = (si * 2) / satN - 1;
        satCurve[si] = Math.tanh(sx * 2.5);
      }
      sat808.curve = satCurve;
      sat808.oversample = '2x';

      var clickG = ctx.createGain();
      clickG.gain.setValueAtTime(0.7 * vel, time);
      clickG.gain.exponentialRampToValueAtTime(0.001, time + 0.005);
      clickSrc.connect(clickHP); clickHP.connect(clickG); clickG.connect(sat808);
      bodyO.connect(bodyG); bodyG.connect(sat808);
      sat808.connect(drumBus);
      clickSrc.start(time); clickSrc.stop(time + 0.006);
      bodyO.start(time); bodyO.stop(time + 0.18);

      // Layer 3: Sub tail — sine at root freq, 500ms sustain = THIS IS THE BASS
      var subFreq = _edm808SubFreq || 55;  // A1, overrideable by Grid engine
      o.frequency.value = subFreq;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.001, time);
      g.gain.linearRampToValueAtTime(0.75 * vel, time + 0.008);
      g.gain.setTargetAtTime(0.001, time + 0.12, 0.18);
      o.connect(g); g.connect(drumBus);
      o.start(time); o.stop(time + 0.6);
    } else if (kit === 'tribal') {
      // Djembe / frame drum — warm body, NO click transient, long resonance
      // Body: triangle wave 120→55Hz, warmer than sine, 300ms sustain
      o.type = 'triangle';
      o.frequency.setValueAtTime(120 + 20 * vel, time);
      o.frequency.exponentialRampToValueAtTime(55, time + 0.06);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.001, time);
      g.gain.linearRampToValueAtTime(0.80 * vel, time + 0.003);
      g.gain.setTargetAtTime(0.001, time + 0.06, 0.12);
      // LP filter to keep it round — no highs
      var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 400;
      o.connect(lp); lp.connect(g); g.connect(drumBus);
      o.start(time); o.stop(time + 0.5);

      // Sub resonance — the body of the drum sings
      var subO = ctx.createOscillator(); subO.type = 'sine';
      subO.frequency.value = 65;
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
      // Layer 1: Click transient — beater impact, punchy 4kHz pop
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

      // Layer 2: Body sweep — tight 180ms, punch not boom
      o.frequency.setValueAtTime(155 + 25 * vel, time);
      o.frequency.exponentialRampToValueAtTime(45, time + 0.18);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.90 * vel, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
      o.connect(g); g.connect(drumBus);
      o.start(time); o.stop(time + 0.25);

      // Layer 3: Sub tail — 45Hz, tighter 380ms sustain
      var subO = ctx.createOscillator(); subO.type = 'sine';
      subO.frequency.value = 45;
      var subG = ctx.createGain();
      subG.gain.setValueAtTime(0.55 * vel, time + 0.008);
      subG.gain.exponentialRampToValueAtTime(0.001, time + 0.38);
      subO.connect(subG); subG.connect(drumBus);
      subO.start(time + 0.008); subO.stop(time + 0.40);
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
    } else if (kit === 'tribal') {
      // Hand slap — open tone, warm body, short bright transient
      // Transient: short noise slap, bandpassed around 1200Hz
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

      // Body tone — sine at 280Hz, warm ring
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
      // Layer 1: Crack — the initial stick impact, bright and sharp
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

      // Layer 2: Body — shell tone, more presence
      var bodyO = ctx.createOscillator(); bodyO.type = 'triangle';
      bodyO.frequency.setValueAtTime(220, time);
      bodyO.frequency.exponentialRampToValueAtTime(140, time + 0.08);
      var bodyG = ctx.createGain();
      bodyG.gain.setValueAtTime(0.55 * vel, time);
      bodyG.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
      bodyO.connect(bodyG); bodyG.connect(drumBus);
      bodyO.start(time); bodyO.stop(time + 0.14);

      // Layer 3: Wire rattle — snare wires buzzing, longer tail
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

  function playHat(time, vel, kit) {
    // Inharmonic metallic oscillators — the actual spectrum of a hi-hat
    // Ratios from physical modeling of struck metal plates
    var ratios = [1.0, 1.483, 1.932, 2.546, 3.111, 3.637];
    var baseFreq, dur, masterVol;
    if (kit === 'tribal') {
      // Shaker hit — just filtered noise, warm and organic
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

  function playShaker(time, vel, dur) {
    // Standalone shaker — triggered by shaking gesture
    // Longer than hat-shaker, more body, sounds like seeds in a gourd
    if (!ctx) return;
    var duration = dur || 0.06;
    var len = Math.floor(ctx.sampleRate * duration);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    // Two-phase envelope: sharp attack then gentle rattle decay
    for (var i = 0; i < len; i++) {
      var t = i / len;
      var env = t < 0.1 ? t / 0.1 : Math.pow(1 - (t - 0.1) / 0.9, 0.8);
      d[i] = (Math.random() * 2 - 1) * env;
    }
    var src = ctx.createBufferSource(); src.buffer = buf;
    // BP filter: 3-5kHz range gives that seed/bead rattle
    var bp = ctx.createBiquadFilter(); bp.type = 'bandpass';
    bp.frequency.value = 3500 + Math.random() * 1500; // slight variation each hit
    bp.Q.value = 0.6;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.18 * vel, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + duration);
    src.connect(bp); bp.connect(g); g.connect(drumBus);
    src.start(time); src.stop(time + duration + 0.005);
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
      case 'guitar': synthGuitar(time, freq, vel, decay); break;
      case 'upright': synthUpright(time, freq, vel); break;
      case 'dirty':      synthDirtyWorld(time, freq, vel, decay); break;
      case 'massive':    synthMassive(time, freq, vel, decay); break;
      case 'mono':       synthMono(time, freq, vel, decay); break;
      case 'cinematic':  synthCinematic(time, freq, vel, decay); break;
      case 'gridstack':  synthGridStack(time, freq, vel, decay); break;
      default: synthSimple(time, freq, vel, decay, opts); break;
    }
  }

  // ── GRID STACK — TikTok supersaw: stacked intervals + unison detune ───
  // Root + minor 3rd + perfect 5th + minor 7th + octave.
  // Each interval has 2-3 detuned copies. Resonant filter sweeps open on attack.
  // Q=3.0 peak = the "viral whoop." Fast decay = tactile punch on every gesture.

  function synthGridStack(time, freq, vel, decay) {
    var dur = decay || 0.45;

    // 5 harmonic layers, each with unison detune spread
    var stack = [
      { ratio: 1.0,    det: [0, -10,  10], wt: [0.40, 0.24, 0.24] }, // root (3 voices)
      { ratio: 1.1892, det: [0,  +8     ], wt: [0.26, 0.16       ] }, // minor 3rd
      { ratio: 1.4983, det: [0,  -8     ], wt: [0.28, 0.18       ] }, // perfect 5th
      { ratio: 1.7818, det: [0,  +6     ], wt: [0.18, 0.12       ] }, // minor 7th
      { ratio: 2.0,    det: [0,  -5     ], wt: [0.22, 0.14       ] }, // octave
    ];

    // Resonant sweep: sealed → rips open = the viral "whoop"
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(180, time);
    lp.frequency.linearRampToValueAtTime(3800 + vel * 2200, time + 0.05);
    lp.frequency.setTargetAtTime(2000, time + 0.05, dur * 0.35);
    lp.Q.value = 3.0;

    var hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 65;
    hp.Q.value = 0.5;

    for (var si = 0; si < stack.length; si++) {
      var s = stack[si];
      var iFreq = freq * s.ratio;
      for (var di = 0; di < s.det.length; di++) {
        var o = ctx.createOscillator(); o.type = 'sawtooth';
        o.frequency.value = iFreq;
        o.detune.value = s.det[di];
        var dg = ctx.createGain(); dg.gain.value = s.wt[di];
        o.connect(dg); dg.connect(hp);
        o.start(time); o.stop(time + dur + 0.2);
      }
    }

    // Sub octave sine — physical presence, chest resonance
    var sub = ctx.createOscillator(); sub.type = 'sine';
    sub.frequency.value = freq * 0.5;
    var subG = ctx.createGain();
    subG.gain.setValueAtTime(0.001, time);
    subG.gain.linearRampToValueAtTime(vel * 0.44, time + 0.010);
    subG.gain.setTargetAtTime(0.001, time + dur * 0.28, dur * 0.38);
    sub.connect(subG); subG.connect(sidechainGain);
    sub.start(time); sub.stop(time + dur + 0.2);

    // Punchy envelope: 7ms snap, fast clean decay
    var env = ctx.createGain();
    env.gain.setValueAtTime(0.001, time);
    env.gain.linearRampToValueAtTime(vel * 0.64, time + 0.007);
    env.gain.setTargetAtTime(vel * 0.32, time + 0.030, dur * 0.18);
    env.gain.linearRampToValueAtTime(0.001, time + dur);

    hp.connect(lp); lp.connect(env); env.connect(sidechainGain);
    var rs = ctx.createGain(); rs.gain.value = 0.22; env.connect(rs); rs.connect(reverbSend);
    var ds = ctx.createGain(); ds.gain.value = 0.58; env.connect(ds); ds.connect(delaySend);
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

  // ── MONO — portamento lead voice ─────────────────────────────────────
  // A monophonic sawtooth lead that slides between pitches.
  // This is the voice that makes the melody feel CONNECTED — not choppy note events
  // but a living line that glides where your hand goes.
  // Velocity controls filter brightness: soft touch = dark and intimate,
  // hard push = bright and forward.

  var monoLastFreq = 0;

  function synthMono(time, freq, vel, decay) {
    var dur = decay || 2.0;
    var prevF = monoLastFreq > 20 ? monoLastFreq : freq;
    monoLastFreq = freq;

    // Portamento: scales with interval size
    var semitones = Math.abs(Math.log2(Math.max(0.01, freq / prevF)) * 12);
    var glide = Math.min(0.22, 0.025 + semitones * 0.006);

    // LP filter: warm, minimal resonance — whispers and leads, never demands
    var baseCut = 600 + vel * 1200;   // narrow sweep: stays musical at all velocities
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(baseCut * 0.40, time);
    lp.frequency.linearRampToValueAtTime(baseCut, time + glide + 0.025);
    lp.Q.value = 0.5;   // no nasal resonance — just shaping

    // Envelope
    var env = ctx.createGain();
    env.gain.setValueAtTime(0.001, time);
    env.gain.linearRampToValueAtTime(vel * 0.52, time + 0.018);
    env.gain.setTargetAtTime(vel * 0.28, time + 0.06, dur * 0.45);
    env.gain.linearRampToValueAtTime(0.001, time + dur);

    // Sub-octave sine: depth and warmth without harshness
    var sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(prevF / 2, time);
    sub.frequency.exponentialRampToValueAtTime(freq / 2, time + glide);
    var subG = ctx.createGain(); subG.gain.value = 0.28;
    sub.connect(subG); subG.connect(lp);
    sub.start(time); sub.stop(time + dur + 0.08);

    // Two triangles: 5 cents apart — gentle, smooth, pleasing
    var detunes = [0, 5];
    var gains   = [0.55, 0.35];
    for (var d = 0; d < detunes.length; d++) {
      var o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.setValueAtTime(prevF, time);
      o.frequency.exponentialRampToValueAtTime(freq, time + glide);
      o.detune.value = detunes[d];
      var g = ctx.createGain(); g.gain.value = gains[d];
      o.connect(g); g.connect(lp);
      o.start(time); o.stop(time + dur + 0.08);
    }

    lp.connect(env);
    env.connect(sidechainGain);
    var rs = ctx.createGain(); rs.gain.value = 0.50; env.connect(rs); rs.connect(reverbSend);
    var ds = ctx.createGain(); ds.gain.value = 0.22; env.connect(ds); ds.connect(delaySend);
  }

  // ── CINEMATIC — Hans Zimmer swell: swelling brass-string hybrid ───────
  // The Conductor's voice. Slow attack, portamento, saturated warmth.
  // When you raise your arm, an orchestra swells. When you drop it, it falls.
  // This is the sound of conducting — not playing notes, summoning them.

  var cinematicLastFreq = 0;

  function synthCinematic(time, freq, vel, decay) {
    var dur = decay || 4.0;
    var prevF = cinematicLastFreq > 20 ? cinematicLastFreq : freq;
    cinematicLastFreq = freq;

    var semitones = Math.abs(Math.log2(Math.max(0.01, freq / prevF)) * 12);
    var glide = Math.min(0.45, 0.10 + semitones * 0.012);

    // Warmth saturator — simulates brass/string harmonic density
    var sat = ctx.createWaveShaper();
    var sc = new Float32Array(256);
    for (var i = 0; i < 256; i++) {
      var x = (i * 2) / 256 - 1;
      sc[i] = Math.tanh(x * 2.0) / Math.tanh(2.0);
    }
    sat.curve = sc;

    // LP filter: sealed at first, swells open — the cinematic reveal
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(280, time);
    lp.frequency.linearRampToValueAtTime(2800 + vel * 500, time + dur * 0.52);
    lp.Q.value = 0.7;

    // Slow swell envelope — the conductor's gesture shapes the attack
    var attackT = 0.14 + (1 - vel) * 0.22; // soft touch = longer swell
    var env = ctx.createGain();
    env.gain.setValueAtTime(0.001, time);
    env.gain.linearRampToValueAtTime(vel * 0.50, time + attackT);
    env.gain.setTargetAtTime(vel * 0.36, time + attackT + 0.08, dur * 0.48);
    env.gain.linearRampToValueAtTime(0.001, time + dur);

    // Three voices: detuned pair at root + whisper octave above
    var voices = [
      { detune: -5, gain: 0.54, ratio: 1.0 },
      { detune:  5, gain: 0.46, ratio: 1.0 },
      { detune:  0, gain: 0.20, ratio: 2.0 }, // octave above — shimmer
    ];
    for (var vi = 0; vi < voices.length; vi++) {
      var v = voices[vi];
      var ov = ctx.createOscillator();
      ov.type = 'sawtooth';
      var tF = freq * v.ratio, sF = prevF * v.ratio;
      ov.frequency.setValueAtTime(sF, time);
      ov.frequency.exponentialRampToValueAtTime(tF, time + glide);
      ov.detune.value = v.detune;
      var gv = ctx.createGain(); gv.gain.value = v.gain;
      ov.connect(gv); gv.connect(lp);
      ov.start(time); ov.stop(time + dur + 0.15);
    }

    lp.connect(sat);
    sat.connect(env);
    env.connect(sidechainGain);
    // Heavy reverb — the orchestra lives in the room
    var rs = ctx.createGain(); rs.gain.value = 0.72; env.connect(rs); rs.connect(reverbSend);
  }

  // ── MASSIVE — RFTN808 detuned unison build ────────────────────────────
  // Phase 0: naked saw — raw, thin, honest
  // Phase 1: + octave below (0.5x) — weight and foundation
  // Phase 2: + perfect fifth (1.5x) — fullness without dissonance
  // Phase 3: + ±2 cent chorus pair — the whisper of width, barely perceptible
  // Phase 4: + ±13 cent arp voices — THE DROP. Shimmer locks in. Portamento starts.
  // Each phase earned by user engagement. The drop is the release.

  var massivePhase    = 0;  // 0-4, set externally via setMassivePhase()
  var massiveLastFreq = 0;  // portamento memory

  function setMassivePhase(p) { massivePhase = p; }

  function synthMassive(time, freq, vel, decay) {
    var dur = decay || 1.0;

    // Build voice list for current phase
    // Each voice: { ratio (relative to freq), detune (cents), gain }
    var voices = [
      { r: 1.0,  d: 0,  g: 0.38 },   // always: naked root
    ];
    if (massivePhase >= 1) {
      voices.push({ r: 0.5,  d: 0,  g: 0.28 }); // octave below
      voices.push({ r: 1.5,  d: 0,  g: 0.20 }); // perfect fifth
    }
    if (massivePhase >= 3) {
      voices.push({ r: 1.0,  d: -2, g: 0.16 }); // ±2 chorus
      voices.push({ r: 1.0,  d:  2, g: 0.16 });
    }
    if (massivePhase >= 4) {
      voices.push({ r: 1.0,  d: -13, g: 0.13 }); // ±13 DROP
      voices.push({ r: 1.0,  d:  13, g: 0.13 });
    }

    // Scale all gains so the sum stays under 0.90 regardless of phase
    var gainSum = 0;
    for (var vi = 0; vi < voices.length; vi++) gainSum += voices[vi].g;
    var normK = Math.min(1.0, 0.82 / gainSum);

    // LP filter — warm, mids-forward
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2600;
    lp.Q.value = 1.2;

    // Envelope
    var env = ctx.createGain();
    env.gain.setValueAtTime(0.001, time);
    env.gain.linearRampToValueAtTime(Math.min(0.82, vel * 0.74), time + 0.013);
    env.gain.setTargetAtTime(vel * 0.40, time + 0.042, dur * 0.30);
    env.gain.linearRampToValueAtTime(0.001, time + dur);

    // Portamento: at phase 4, notes slide from the previous pitch
    var prevF = (massivePhase >= 4 && massiveLastFreq > 20) ? massiveLastFreq : 0;
    massiveLastFreq = freq;

    for (var i = 0; i < voices.length; i++) {
      var v = voices[i];
      var o = ctx.createOscillator();
      o.type = 'sawtooth';
      var targetF = freq * v.r;

      if (prevF > 0) {
        // Slide from previous note's frequency at this ratio
        o.frequency.setValueAtTime(prevF * v.r, time);
        o.frequency.linearRampToValueAtTime(targetF, time + 0.14);
      } else {
        o.frequency.value = targetF;
      }

      o.detune.value = v.d;
      var g = ctx.createGain();
      g.gain.value = v.g * normK;
      o.connect(g);
      g.connect(lp);
      o.start(time);
      o.stop(time + dur + 0.12);
    }

    lp.connect(env);
    env.connect(sidechainGain);
    var rs = ctx.createGain(); rs.gain.value = 0.28; env.connect(rs); rs.connect(reverbSend);
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

  // ── SPANISH GUITAR — nylon string, warm pluck, resonant body ──────────
  // Think street corner in Mexico City. Warm, intimate, slightly buzzy.

  function synthGuitar(time, freq, vel, decay) {
    decay = decay || 2.0;

    // Pluck transient — softer than steel, nylon "thumb" sound
    var pluckLen = Math.floor(ctx.sampleRate * 0.008);
    var pluckBuf = ctx.createBuffer(1, pluckLen, ctx.sampleRate);
    var pd = pluckBuf.getChannelData(0);
    for (var i = 0; i < pluckLen; i++) pd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / pluckLen, 1.5);
    var pluckSrc = ctx.createBufferSource(); pluckSrc.buffer = pluckBuf;
    // LP filter the pluck — nylon is warmer than steel
    var pluckLP = ctx.createBiquadFilter(); pluckLP.type = 'lowpass'; pluckLP.frequency.value = 3000;
    var pluckG = ctx.createGain();
    pluckG.gain.setValueAtTime(0.55 * vel, time);
    pluckG.gain.exponentialRampToValueAtTime(0.001, time + 0.025);

    // Fundamental — triangle wave (warmer than sine, softer than sawtooth)
    var fund = ctx.createOscillator(); fund.type = 'triangle'; fund.frequency.value = freq;
    var fundG = ctx.createGain();
    fundG.gain.setValueAtTime(vel * 0.52, time);
    fundG.gain.setTargetAtTime(0.001, time + 0.05, decay * 0.25);

    // 2nd harmonic — octave, quieter (nylon is fundamental-heavy)
    var h2 = ctx.createOscillator(); h2.type = 'sine'; h2.frequency.value = freq * 2 + 0.7; // slight detune
    var h2G = ctx.createGain();
    h2G.gain.setValueAtTime(vel * 0.22, time);
    h2G.gain.setTargetAtTime(0.001, time + 0.03, decay * 0.18);

    // 3rd harmonic — adds the "nylon" character
    var h3 = ctx.createOscillator(); h3.type = 'sine'; h3.frequency.value = freq * 3 - 0.5;
    var h3G = ctx.createGain();
    h3G.gain.setValueAtTime(vel * 0.10, time);
    h3G.gain.setTargetAtTime(0.001, time + 0.02, decay * 0.12);

    // 5th harmonic — faint, adds brightness without harshness
    var h5 = ctx.createOscillator(); h5.type = 'sine'; h5.frequency.value = freq * 5 + 1.2;
    var h5G = ctx.createGain();
    h5G.gain.setValueAtTime(vel * 0.04, time);
    h5G.gain.setTargetAtTime(0.001, time + 0.01, decay * 0.08);

    // Body resonance filter — LP that closes over time (string losing energy)
    var bodyLP = ctx.createBiquadFilter();
    bodyLP.type = 'lowpass';
    bodyLP.frequency.setValueAtTime(Math.min(freq * 8, 5000), time);
    bodyLP.frequency.exponentialRampToValueAtTime(Math.max(freq * 1.5, 300), time + decay * 0.6);
    bodyLP.Q.value = 1.2; // slight resonance = body ring

    // Master envelope
    var env = ctx.createGain();
    env.gain.setValueAtTime(Math.min(0.85, vel * 0.75), time);
    env.gain.setTargetAtTime(0.001, time + 0.1, decay * 0.28);

    // Wire it up
    pluckSrc.connect(pluckLP); pluckLP.connect(pluckG); pluckG.connect(bodyLP);
    fund.connect(fundG); fundG.connect(bodyLP);
    h2.connect(h2G); h2G.connect(bodyLP);
    h3.connect(h3G); h3G.connect(bodyLP);
    h5.connect(h5G); h5G.connect(bodyLP);
    bodyLP.connect(env); env.connect(sidechainGain);

    // Heavy reverb send — street guitar has space and echo
    var rs = ctx.createGain(); rs.gain.value = 0.55; env.connect(rs); rs.connect(reverbSend);
    var ds = ctx.createGain(); ds.gain.value = 0.30; env.connect(ds); ds.connect(delaySend);

    pluckSrc.start(time); pluckSrc.stop(time + 0.012);
    var endTime = time + decay + 0.2;
    fund.start(time); fund.stop(endTime);
    h2.start(time); h2.stop(endTime);
    h3.start(time); h3.stop(endTime);
    h5.start(time); h5.stop(endTime);
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
    if (voidOscs.length) return;
    var r = root || 432;

    voidGain = ctx.createGain();
    voidGain.gain.value = 0;
    voidGain.connect(reverbGain);
    voidGain.connect(masterHPF);

    var end = ctx.currentTime + 999;

    // ── HARMONIC PARTIALS — each breathes and drifts independently ────────
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

      // Pitch drift LFO — each partial wanders slightly in pitch
      var pLFO = ctx.createOscillator(); pLFO.type = 'sine';
      pLFO.frequency.value = p.pitchRate;
      var pLFOG = ctx.createGain(); pLFOG.gain.value = p.pitchHz;
      pLFO.connect(pLFOG); pLFOG.connect(osc.frequency);

      // Amplitude LFO — this partial swells and recedes on its own rhythm
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

      voidOscs.push(osc);
      voidOscGains.push(g);
    }

    // ── COSMIC WIND — noise bands at low / mid / high ────────────────────
    var noiseLen = ctx.sampleRate * 4;
    var noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
    var nd = noiseBuf.getChannelData(0);
    var b0=0,b1=0,b2=0,b3=0,b4=0,b5=0;
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
      voidOscs.push(ns);
      voidOscGains.push(wg);
    }

    voidFilter = null;
    voidLFO = null;
    voidLFOGain = null;
  }

  function stopVoidDrone() {
    for (var i = 0; i < voidOscs.length; i++) {
      try { voidOscs[i].stop(); voidOscs[i].disconnect(); } catch (e) {}
      try { voidOscGains[i].disconnect(); } catch (e) {}
    }
    voidOscs = []; voidOscGains = [];
    try { if (voidGain) voidGain.disconnect(); } catch (e) {}
    voidGain = null; voidFilter = null; voidLFO = null; voidLFOGain = null;
  }

  function updateVoidDrone(depth, breathPhase) {
    if (!ctx) return;
    if (depth > 0.05) {
      if (!voidOscs.length) startVoidDrone();
      if (voidGain) {
        var target = depth * 0.42;
        voidGain.gain.value += (target - voidGain.gain.value) * 0.015;
      }
    } else if (voidOscs.length) {
      if (voidGain) {
        voidGain.gain.value *= 0.97;
        if (voidGain.gain.value < 0.003) stopVoidDrone();
      }
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

  // ── WEATHER AUDIO — ambient rain/weather noise layer ───────────────────

  var wxNoiseSource = null;
  var wxNoiseGain   = null;

  function setWeather(condition, intensity) {
    if (!ctx) return;
    var base = (condition || 'clear').split('_')[0];
    var isWet = (base === 'rain' || base === 'storm');
    var vol   = isWet ? (0.018 + (intensity || 0.5) * 0.022) : 0;

    if (!isWet) {
      if (wxNoiseSource) {
        try { wxNoiseSource.stop(); } catch(e) {}
        wxNoiseSource = null; wxNoiseGain = null;
      }
      return;
    }

    if (wxNoiseSource) {
      // Already running — just adjust volume
      if (wxNoiseGain) wxNoiseGain.gain.setTargetAtTime(vol, ctx.currentTime, 1.5);
      return;
    }

    // Build pink noise (Voss-McCartney)
    var len  = ctx.sampleRate * 3;
    var buf  = ctx.createBuffer(1, len, ctx.sampleRate);
    var data = buf.getChannelData(0);
    var b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
    for (var i = 0; i < len; i++) {
      var w = Math.random() * 2 - 1;
      b0 = 0.99886*b0 + w*0.0555179; b1 = 0.99332*b1 + w*0.0750759;
      b2 = 0.96900*b2 + w*0.1538520; b3 = 0.86650*b3 + w*0.3104856;
      b4 = 0.55000*b4 + w*0.5329522; b5 = -0.7616*b5 - w*0.0168980;
      data[i] = (b0+b1+b2+b3+b4+b5+b6+w*0.5362) / 9;
      b6 = w * 0.115926;
    }

    // Shape noise into rain character
    var hp = ctx.createBiquadFilter(); hp.type = 'highpass';  hp.frequency.value = 300;
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass';   lp.frequency.value = 2200; lp.Q.value = 0.4;
    var bp = ctx.createBiquadFilter(); bp.type = 'peaking';   bp.frequency.value = 800;
    bp.gain.value = 4; bp.Q.value = 0.7;

    wxNoiseGain = ctx.createGain();
    wxNoiseGain.gain.setValueAtTime(0.001, ctx.currentTime);
    wxNoiseGain.gain.setTargetAtTime(vol, ctx.currentTime, 2.0);  // fade in over 2s

    wxNoiseSource = ctx.createBufferSource();
    wxNoiseSource.buffer = buf;
    wxNoiseSource.loop   = true;

    wxNoiseSource.connect(hp); hp.connect(bp); bp.connect(lp);
    lp.connect(wxNoiseGain);
    wxNoiseGain.connect(masterGain);

    // Also bleed into reverb for spatial rain feel
    var rvSend = ctx.createGain(); rvSend.gain.value = vol * 1.8;
    lp.connect(rvSend); rvSend.connect(reverbSend);

    wxNoiseSource.start();
  }

  // ── PUBLIC API ─────────────────────────────────────────────────────────

  // ── EDM ENGINE — Persistent layers for DJ set ──────────────────────
  //
  // Unlike fire-and-forget synths, these are Audio.layer objects that
  // persist and can be faded/filtered in real time. This is how a DJ
  // set works: layers are always running, you control their volume
  // and filter, not re-triggering notes.

  // Wobble bass layer: saw through resonant LP with LFO.
  // THE signature dubstep/EDM sound. LFO rate controls the "wub wub."
  function buildWobbleLayer(freq, lfoRate) {
    destroyLayer('edm-wobble');
    var f = freq || 55;
    var oscs = [
      { wave: 'sawtooth', freq: f,        gain: 0.22, detune: 0   },
      { wave: 'sawtooth', freq: f,        gain: 0.18, detune: -12 },
      { wave: 'sawtooth', freq: f,        gain: 0.18, detune: 12  },
      { wave: 'sawtooth', freq: f * 2,    gain: 0.08, detune: 7   },  // octave adds body
    ];
    return buildLayer('edm-wobble', {
      oscillators: oscs,
      filter: { type: 'lowpass', freq: 200, Q: 6 },  // starts closed, LFO opens it
      gain: 0,
      vibrato: { rate: lfoRate || 3.5, depth: 0.008 },  // subtle pitch wobble
    });
  }

  // Dark pad layer: heavily filtered saws = warm dark wash, not harsh buzz.
  // Cutoff at 350Hz = only warmth gets through. No harshness on phone speakers.
  function buildDarkPad(freq) {
    destroyLayer('edm-pad');
    var f = freq || 220;
    var oscs = [
      { wave: 'sawtooth', freq: f,          gain: 0.10, detune: -15 },
      { wave: 'sawtooth', freq: f,          gain: 0.10, detune: 0   },
      { wave: 'sawtooth', freq: f,          gain: 0.10, detune: 15  },
      { wave: 'sawtooth', freq: f * 1.498,  gain: 0.06, detune: -8  },  // fifth
      { wave: 'sine',     freq: f * 0.5,    gain: 0.12, detune: 0   },  // sub octave warmth
    ];
    return buildLayer('edm-pad', {
      oscillators: oscs,
      filter: { type: 'lowpass', freq: 350, Q: 1.2 },  // DARK — only warmth, no buzz
      gain: 0,
      reverbSend: 0.25,
    });
  }

  // ── LEVITATION LAYER — Ascension music ──────────────────────────────
  // The viral TikTok "ascension" sound. NOT just unison detune at root —
  // it's a HARMONIC STACK: root + major 3rd + perfect 5th + octave,
  // EACH with unison detune voices. This creates the massive wall of
  // sound that feels like heaven / levitation.
  //
  // Signal chain (per Love Eli / prodloveeli):
  //   Harmonic stack (root+M3+P5+oct, each with detuned unison voices)
  //   → LP filter (tilt controls cutoff — the "rising" feel)
  //   → OTT compression (multiband squash — brings up shimmer, glues wall)
  //   → LFO on filter cutoff (breathing movement)
  //   → reverb + delay send (space)
  //
  // The beating frequencies between the detuned voices at each harmonic
  // create independent shimmer rates. The M3 and P5 shimmer at different
  // speeds than the root — this is what makes it sound "alive."

  function buildLevitationLayer(freq, spread) {
    destroyLayer('edm-levitation');
    var f = freq || 220;
    var sp = spread || 25;  // cents spread per harmonic

    // ── HARMONIC STACK with unison detune per layer ──
    // Root: 5 voices (loudest — the foundation)
    // Major 3rd (+4 semitones): 3 voices (the "heaven" interval)
    // Perfect 5th (+7 semitones): 3 voices (the "power")
    // Octave (+12 semitones): 3 voices (air/shimmer up top)
    // = 14 oscillators total

    var M3 = f * Math.pow(2, 4/12);   // major 3rd
    var P5 = f * Math.pow(2, 7/12);   // perfect 5th
    var OCT = f * 2;                    // octave

    var oscs = [
      // Root — 5 voices, widest spread (this is the anchor)
      { wave: 'sawtooth', freq: f,   gain: 0.07, detune: 0           },
      { wave: 'sawtooth', freq: f,   gain: 0.06, detune: sp * 0.5    },
      { wave: 'sawtooth', freq: f,   gain: 0.06, detune: -sp * 0.5   },
      { wave: 'sawtooth', freq: f,   gain: 0.04, detune: sp          },
      { wave: 'sawtooth', freq: f,   gain: 0.04, detune: -sp         },

      // Major 3rd — 3 voices (the heaven interval — this is what makes it "ascension")
      { wave: 'sawtooth', freq: M3,  gain: 0.05, detune: 0           },
      { wave: 'sawtooth', freq: M3,  gain: 0.04, detune: sp * 0.6    },
      { wave: 'sawtooth', freq: M3,  gain: 0.04, detune: -sp * 0.6   },

      // Perfect 5th — 3 voices (power, width)
      { wave: 'sawtooth', freq: P5,  gain: 0.05, detune: 0           },
      { wave: 'sawtooth', freq: P5,  gain: 0.04, detune: sp * 0.7    },
      { wave: 'sawtooth', freq: P5,  gain: 0.04, detune: -sp * 0.7   },

      // Octave — 3 voices (air, shimmer — tighter detune so it doesn't get harsh)
      { wave: 'sawtooth', freq: OCT, gain: 0.035, detune: 0          },
      { wave: 'sawtooth', freq: OCT, gain: 0.025, detune: sp * 0.4   },
      { wave: 'sawtooth', freq: OCT, gain: 0.025, detune: -sp * 0.4  },
    ];

    // Build the layer through the standard system (filter + gain + sidechain)
    var L = buildLayer('edm-levitation', {
      oscillators: oscs,
      filter: { type: 'lowpass', freq: 400, Q: 0.8 },  // starts dark — LFO + tilt open it
      gain: 0,
      reverbSend: 0.40,
      vibrato: { rate: 0.12, depth: 0.0015 },  // glacial drift — all voices slightly wander
    });

    // ── OTT COMPRESSION ──
    // Insert a compressor between the layer's filter and gain output.
    // OTT = aggressive compression that brings up quiet shimmer details
    // and glues the wall of sound into one massive block.
    if (L && L.filter && L.gain && ctx) {
      var comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -28;   // catch everything
      comp.knee.value = 2;          // hard knee — OTT style
      comp.ratio.value = 8;         // heavy squash
      comp.attack.value = 0.003;    // fast attack — catch transients
      comp.release.value = 0.08;    // fast release — pumping shimmer
      // Re-wire: filter → comp → gain (was filter → gain)
      L.filter.disconnect();
      L.filter.connect(comp);
      // Makeup gain to compensate for compression
      var makeup = ctx.createGain();
      makeup.gain.value = 2.2;      // OTT boost — brings up the shimmer
      comp.connect(makeup);
      makeup.connect(L.gain);
      L.allNodes.push(comp, makeup);
      L.comp = comp;  // store ref for potential runtime tweaks
    }

    // ── DELAY SEND for depth ──
    if (L && L.gain && delaySend) {
      var ds = ctx.createGain();
      ds.gain.value = 0.20;  // moderate delay — adds depth without mud
      L.gain.connect(ds);
      ds.connect(delaySend);
      L.allNodes.push(ds);
    }

    return L;
  }

  // Levitation filter control — follow.js drives this from tilt + LFO
  function setLevitationFilter(freq) {
    var f = Math.max(200, Math.min(5000, freq));
    setLayerFilter('edm-levitation', f, 0.06);
  }

  // Levitation detune spread — morph the width in real time
  // Narrow = focused energy, Wide = ethereal float
  function setLevitationSpread(spread) {
    var L = layers['edm-levitation'];
    if (!L || L.pitchOscs.length < 14) return;
    var sp = Math.max(5, Math.min(50, spread));
    var now = ctx.currentTime;
    // Root voices (indices 0-4): center, +50%, -50%, +100%, -100%
    L.pitchOscs[1].detune.setTargetAtTime(sp * 0.5, now, 0.3);
    L.pitchOscs[2].detune.setTargetAtTime(-sp * 0.5, now, 0.3);
    L.pitchOscs[3].detune.setTargetAtTime(sp, now, 0.3);
    L.pitchOscs[4].detune.setTargetAtTime(-sp, now, 0.3);
    // M3 voices (indices 5-7): center, +60%, -60%
    L.pitchOscs[6].detune.setTargetAtTime(sp * 0.6, now, 0.3);
    L.pitchOscs[7].detune.setTargetAtTime(-sp * 0.6, now, 0.3);
    // P5 voices (indices 8-10): center, +70%, -70%
    L.pitchOscs[9].detune.setTargetAtTime(sp * 0.7, now, 0.3);
    L.pitchOscs[10].detune.setTargetAtTime(-sp * 0.7, now, 0.3);
    // Octave voices (indices 11-13): center, +40%, -40%
    L.pitchOscs[12].detune.setTargetAtTime(sp * 0.4, now, 0.3);
    L.pitchOscs[13].detune.setTargetAtTime(-sp * 0.4, now, 0.3);
  }

  // ── ASCENSION ENGINE ─────────────────────────────────────────────────
  // Wall of sound: root + M3 + P5 + octave, each with unison detune.
  // Reese sub, white noise air, OTT compression. The body IS the synth.

  // The Wall: 18 detuned saws in a major chord stack + OTT compression
  // ── ASCENSION WALL: 4 independent harmonic layers ──
  // Split into root/third/fifth/octave so follow.js can bloom them independently.
  // Single saw → full god-tier wall is a 25-second journey.

  var ASC_LAYERS = ['asc-root', 'asc-third', 'asc-fifth', 'asc-oct'];
  var ASC_DETUNE_COEFFS = {
    'asc-root':  [0, 0.5, -0.5, 1.0, -1.0],
    'asc-third': [0, 0.6, -0.6, 1.0, -1.0],
    'asc-fifth': [0, 0.7, -0.7, 1.0, -1.0],
    'asc-oct':   [0, 0.4, -0.4],
  };

  function buildAscHarmonic(name, freq, spread, coeffs, reverbAmt) {
    destroyLayer(name);
    var oscs = [];
    for (var i = 0; i < coeffs.length; i++) {
      var g = i === 0 ? 0.07 : 0.055 - i * 0.005;
      oscs.push({ wave: 'sawtooth', freq: freq, gain: Math.max(0.03, g), detune: spread * coeffs[i] });
    }
    var L = buildLayer(name, {
      oscillators: oscs,
      filter: { type: 'lowpass', freq: 600, Q: 0.5 },  // warmer starting point, less resonant
      gain: 0,
      reverbSend: reverbAmt,
      vibrato: { rate: 0.10, depth: 0.001 },
    });
    // Gentle compression — glue, not OTT crush
    if (L && L.filter && L.gain && ctx) {
      var comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -24;
      comp.knee.value = 6;
      comp.ratio.value = 4;
      comp.attack.value = 0.010;
      comp.release.value = 0.12;
      L.filter.disconnect();
      L.filter.connect(comp);
      var makeup = ctx.createGain();
      makeup.gain.value = 1.8;
      comp.connect(makeup);
      makeup.connect(L.gain);
      L.allNodes.push(comp, makeup);
      L.comp = comp;
    }
    // Delay send
    if (L && L.gain && delaySend) {
      var ds = ctx.createGain();
      ds.gain.value = 0.22;
      L.gain.connect(ds);
      ds.connect(delaySend);
      L.allNodes.push(ds);
    }
    return L;
  }

  function buildAscWall(freq, spread) {
    var f = freq || 220;
    var sp = spread || 25;
    buildAscHarmonic('asc-root',  f,                       sp, ASC_DETUNE_COEFFS['asc-root'],  0.45);
    buildAscHarmonic('asc-third', f * Math.pow(2, 4/12),   sp, ASC_DETUNE_COEFFS['asc-third'], 0.50);
    buildAscHarmonic('asc-fifth', f * Math.pow(2, 7/12),   sp, ASC_DETUNE_COEFFS['asc-fifth'], 0.50);
    buildAscHarmonic('asc-oct',   f * 2,                   sp, ASC_DETUNE_COEFFS['asc-oct'],   0.55);
  }

  // Reese sub: two detuned saws — the beating creates physical depth
  function buildAscSub(freq) {
    destroyLayer('asc-sub');
    var f = freq || 55;
    return buildLayer('asc-sub', {
      oscillators: [
        { wave: 'sawtooth', freq: f, gain: 0.22, detune: 7 },
        { wave: 'sawtooth', freq: f, gain: 0.22, detune: -7 },
      ],
      filter: { type: 'lowpass', freq: 120, Q: 1.2 },
      gain: 0,
    });
  }

  // White noise air layer — adds presence and "air" to the wall
  function buildAscNoise() {
    destroyLayer('asc-noise');
    return buildLayer('asc-noise', {
      noise: 'pink',  // pink noise — warmer, fills mids
      filter: { type: 'bandpass', freq: 2000, Q: 0.4 },  // lower center, wider band
      gain: 0,
      reverbSend: 0.40,
    });
  }

  // Wall filter control — sets all 4 harmonic layers
  function setAscWallFilter(freq) {
    var f = Math.max(120, Math.min(4000, freq));
    for (var i = 0; i < ASC_LAYERS.length; i++) {
      setLayerFilter(ASC_LAYERS[i], f, 0.06);
    }
  }

  // Wall detune spread — morph width in real time across all layers
  function setAscWallSpread(spread) {
    var sp = Math.max(5, Math.min(50, spread));
    var now = ctx.currentTime;
    for (var i = 0; i < ASC_LAYERS.length; i++) {
      var name = ASC_LAYERS[i];
      var L = layers[name];
      if (!L) continue;
      var coeffs = ASC_DETUNE_COEFFS[name];
      for (var j = 1; j < L.pitchOscs.length && j < coeffs.length; j++) {
        L.pitchOscs[j].detune.setTargetAtTime(sp * coeffs[j], now, 0.3);
      }
    }
  }

  // Master pitch shift — shift all wall oscillators by semitones
  function setAscMasterPitch(semitones) {
    var ratio = Math.pow(2, semitones / 12);
    var now = ctx.currentTime;
    for (var i = 0; i < ASC_LAYERS.length; i++) {
      var L = layers[ASC_LAYERS[i]];
      if (!L) continue;
      for (var j = 0; j < L.pitchOscs.length; j++) {
        var baseFreq = L.pitchOscs[j]._baseFreq || L.pitchOscs[j].frequency.value;
        if (!L.pitchOscs[j]._baseFreq) L.pitchOscs[j]._baseFreq = baseFreq;
        L.pitchOscs[j].frequency.setTargetAtTime(baseFreq * ratio, now, 0.15);
      }
    }
  }

  // Rebuild wall chord voicing — glide each harmonic group to new interval
  function setAscWallChord(wallRoot, voicing) {
    var now = ctx.currentTime;
    var glide = 0.3;
    // voicing = [root_semi, third_semi, fifth_semi, oct_semi]
    var targets = [
      wallRoot * Math.pow(2, (voicing[0] || 0) / 12),
      wallRoot * Math.pow(2, (voicing[1] || 4) / 12),
      wallRoot * Math.pow(2, (voicing[2] || 7) / 12),
      wallRoot * Math.pow(2, (voicing[3] || 12) / 12),
    ];
    for (var i = 0; i < ASC_LAYERS.length; i++) {
      var L = layers[ASC_LAYERS[i]];
      if (!L) continue;
      var f = targets[i];
      for (var j = 0; j < L.pitchOscs.length; j++) {
        L.pitchOscs[j].frequency.setTargetAtTime(f, now, glide);
        L.pitchOscs[j]._baseFreq = f;
      }
    }
  }

  function destroyAscLayers() {
    for (var i = 0; i < ASC_LAYERS.length; i++) destroyLayer(ASC_LAYERS[i]);
    destroyLayer('asc-sub');
    destroyLayer('asc-noise');
    destroyLayer('asc-search');
    destroyLayer('asc-bass');
  }

  // ── HOURLY ODE — each lens honors the hour in its own way ──
  // Mt. Holly, High Street. The hour rings through the music.

  function synthHourlyChime(time, voice, vel) {
    if (!ctx) return;
    var t = time || ctx.currentTime;
    var v = vel || 0.35;

    // Voice determines the timbre. Each lens chooses its own.
    // 'bell'     — warm sine partials, classic bell
    // 'tone'     — pure sine with reverb tail, ethereal
    // 'impact'   — sub thump + filtered noise, EDM
    // 'harmonic' — fifth interval, choir-like

    var voice = voice || 'bell';

    if (voice === 'bell') {
      // Warm bell: sine fundamental + minor third partial + octave
      var partials = [
        { freq: 220, amp: 0.7, decay: 5.0 },
        { freq: 220 * 1.183, amp: 0.3, decay: 3.0 },
        { freq: 440, amp: 0.25, decay: 2.5 },
      ];
      for (var i = 0; i < partials.length; i++) {
        var o = ctx.createOscillator(); o.type = 'sine';
        o.frequency.value = partials[i].freq;
        var g = ctx.createGain();
        g.gain.setValueAtTime(partials[i].amp * v, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + partials[i].decay);
        o.connect(g); g.connect(sidechainGain);
        if (reverbSend) { var rs = ctx.createGain(); rs.gain.value = 0.5; g.connect(rs); rs.connect(reverbSend); }
        o.start(t); o.stop(t + partials[i].decay + 0.1);
      }
    } else if (voice === 'tone') {
      // Pure ethereal tone with long reverb
      var o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.value = 330;  // E4
      var g = ctx.createGain();
      g.gain.setValueAtTime(v * 0.5, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 6.0);
      o.connect(g); g.connect(sidechainGain);
      if (reverbSend) { var rs = ctx.createGain(); rs.gain.value = 0.7; g.connect(rs); rs.connect(reverbSend); }
      o.start(t); o.stop(t + 6.1);
    } else if (voice === 'impact') {
      // Sub thump + noise burst
      var sub = ctx.createOscillator(); sub.type = 'sine';
      sub.frequency.setValueAtTime(80, t);
      sub.frequency.exponentialRampToValueAtTime(40, t + 0.5);
      var sg = ctx.createGain();
      sg.gain.setValueAtTime(v * 0.8, t);
      sg.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
      sub.connect(sg); sg.connect(sidechainGain);
      sub.start(t); sub.stop(t + 1.6);
    } else if (voice === 'harmonic') {
      // Fifth interval — root + fifth, choir-like
      var freqs = [220, 330];
      for (var j = 0; j < freqs.length; j++) {
        var o2 = ctx.createOscillator(); o2.type = 'sine';
        o2.frequency.value = freqs[j];
        var g2 = ctx.createGain();
        g2.gain.setValueAtTime(v * 0.4, t);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 5.0);
        o2.connect(g2); g2.connect(sidechainGain);
        if (reverbSend) { var rs2 = ctx.createGain(); rs2.gain.value = 0.6; g2.connect(rs2); rs2.connect(reverbSend); }
        o2.start(t); o2.stop(t + 5.1);
      }
    }
  }

  // ── ASCENSION FIRE-AND-FORGET SYNTHS ──

  // Analog pluck: saw+square, fast LP envelope, percussive snap
  var ascLeadLastFreq = 0;

  function synthAscPluck(time, freq, vel, decay) {
    if (!ctx) return;
    var t = time || ctx.currentTime;
    var f = freq || 440;
    var v = vel || 0.3;
    var d = decay || 0.8;

    // Saw fundamental
    var saw = ctx.createOscillator();
    saw.type = 'sawtooth';
    saw.frequency.value = f;

    // Square one octave below for body
    var sq = ctx.createOscillator();
    sq.type = 'square';
    sq.frequency.value = f * 0.5;

    // Mix
    var sawG = ctx.createGain(); sawG.gain.value = v * 0.4;
    var sqG = ctx.createGain(); sqG.gain.value = v * 0.2;

    // Fast LP envelope (snap open → close)
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 3;
    lp.frequency.setValueAtTime(3000, t);
    lp.frequency.exponentialRampToValueAtTime(250, t + 0.15);

    // Amp envelope
    var env = ctx.createGain();
    env.gain.setValueAtTime(v * 0.35, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + d);

    saw.connect(sawG); sawG.connect(lp);
    sq.connect(sqG); sqG.connect(lp);
    lp.connect(env);
    env.connect(sidechainGain);

    // Reverb send
    if (reverbSend) {
      var rs = ctx.createGain(); rs.gain.value = 0.35;
      env.connect(rs); rs.connect(reverbSend);
    }
    // Delay send
    if (delaySend) {
      var ds = ctx.createGain(); ds.gain.value = 0.25;
      env.connect(ds); ds.connect(delaySend);
    }

    saw.start(t); sq.start(t);
    saw.stop(t + d + 0.1); sq.stop(t + d + 0.1);
  }

  // Chord stab: multiple saws with tremolo LFO — cuts through the wall
  function synthAscStab(time, freqs, vel) {
    if (!ctx || !freqs || freqs.length === 0) return;
    var t = time || ctx.currentTime;
    var v = vel || 0.3;

    // LP filter for the whole stab
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(2200, t);
    lp.frequency.exponentialRampToValueAtTime(400, t + 0.5);
    lp.Q.value = 2;

    // Tremolo LFO — the rhythmic pulse
    var lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 4;
    var lfoG = ctx.createGain();
    lfoG.gain.value = 0.3;
    lfo.connect(lfoG);

    // Amp envelope
    var env = ctx.createGain();
    env.gain.setValueAtTime(v * 0.25, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    // Tremolo modulation
    lfoG.connect(env.gain);

    lp.connect(env);
    env.connect(sidechainGain);

    // Reverb send
    if (reverbSend) {
      var rs = ctx.createGain(); rs.gain.value = 0.40;
      env.connect(rs); rs.connect(reverbSend);
    }

    // One saw per chord tone
    for (var i = 0; i < freqs.length && i < 4; i++) {
      var o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = freqs[i];
      o.detune.value = (Math.random() - 0.5) * 15;
      var g = ctx.createGain();
      g.gain.value = v * 0.12;
      o.connect(g); g.connect(lp);
      o.start(t); o.stop(t + 0.6);
    }

    lfo.start(t); lfo.stop(t + 0.6);
  }

  // Continuous saw lead with portamento — the melody voice
  function synthAscLead(time, freq, vel, decay, portTime) {
    if (!ctx) return;
    var t = time || ctx.currentTime;
    var f = freq || 440;
    var v = vel || 0.15;
    var d = decay || 2.0;
    var port = portTime || 0.12;

    var o = ctx.createOscillator();
    o.type = 'sawtooth';
    // Portamento: glide from last frequency
    if (ascLeadLastFreq > 0) {
      o.frequency.setValueAtTime(ascLeadLastFreq, t);
      o.frequency.exponentialRampToValueAtTime(f, t + port);
    } else {
      o.frequency.value = f;
    }
    ascLeadLastFreq = f;

    // Unison pair — slight detune for width
    var o2 = ctx.createOscillator();
    o2.type = 'sawtooth';
    if (ascLeadLastFreq > 0) {
      o2.frequency.setValueAtTime(ascLeadLastFreq, t);
      o2.frequency.exponentialRampToValueAtTime(f, t + port);
    } else {
      o2.frequency.value = f;
    }
    o2.detune.value = 12;

    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2400;
    lp.Q.value = 0.8;

    var env = ctx.createGain();
    env.gain.setValueAtTime(v * 0.18, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + d);

    var g1 = ctx.createGain(); g1.gain.value = 0.5;
    var g2 = ctx.createGain(); g2.gain.value = 0.4;
    o.connect(g1); g1.connect(lp);
    o2.connect(g2); g2.connect(lp);
    lp.connect(env);
    env.connect(sidechainGain);

    if (reverbSend) {
      var rs = ctx.createGain(); rs.gain.value = 0.30;
      env.connect(rs); rs.connect(reverbSend);
    }
    if (delaySend) {
      var ds = ctx.createGain(); ds.gain.value = 0.18;
      env.connect(ds); ds.connect(delaySend);
    }

    o.start(t); o2.start(t);
    o.stop(t + d + 0.1); o2.stop(t + d + 0.1);
  }

  // Wobble bass filter LFO — driven by follow.js grid clock so it syncs to tempo
  // Cap at 2200Hz — above that it becomes a screeching drill, not music.
  function setWobbleFilter(freq) {
    var f = Math.max(80, Math.min(2200, freq));
    setLayerFilter('edm-wobble', f, 0.03);
  }

  // Wobble Q control — reduce resonance at high frequencies to prevent drill screech
  function setWobbleQ(q) {
    var L = layers['edm-wobble'];
    if (L && L.filter) {
      L.filter.Q.setTargetAtTime(Math.max(0.5, Math.min(8, q)), ctx.currentTime, 0.05);
    }
  }

  // Riser: filtered noise sweep + pitch sweep — builds tension before drop
  function synthRiser(time, duration) {
    var dur = duration || 8;

    // Noise sweep: LP opens from 200→6000Hz over duration
    var noiseLen = Math.floor(ctx.sampleRate * Math.min(dur, 12));
    var noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
    var nd = noiseBuf.getChannelData(0);
    for (var i = 0; i < noiseLen; i++) nd[i] = (Math.random() * 2 - 1) * 0.5;
    var noiseSrc = ctx.createBufferSource(); noiseSrc.buffer = noiseBuf;
    var nLP = ctx.createBiquadFilter(); nLP.type = 'lowpass';
    nLP.frequency.setValueAtTime(200, time);
    nLP.frequency.exponentialRampToValueAtTime(6000, time + dur);
    nLP.Q.value = 5;  // resonant peak = the "building" scream
    var nG = ctx.createGain();
    nG.gain.setValueAtTime(0.001, time);
    nG.gain.linearRampToValueAtTime(0.28, time + dur * 0.85);
    nG.gain.linearRampToValueAtTime(0.001, time + dur);
    noiseSrc.connect(nLP); nLP.connect(nG); nG.connect(sidechainGain);
    noiseSrc.start(time); noiseSrc.stop(time + dur + 0.1);

    // Sine sweep: 100→1500Hz — rising pitch builds tension
    var sweepO = ctx.createOscillator(); sweepO.type = 'sine';
    sweepO.frequency.setValueAtTime(100, time);
    sweepO.frequency.exponentialRampToValueAtTime(1500, time + dur);
    var sweepG = ctx.createGain();
    sweepG.gain.setValueAtTime(0.001, time);
    sweepG.gain.linearRampToValueAtTime(0.15, time + dur * 0.8);
    sweepG.gain.linearRampToValueAtTime(0.001, time + dur);
    sweepO.connect(sweepG); sweepG.connect(sidechainGain);
    sweepO.start(time); sweepO.stop(time + dur + 0.1);
  }

  // Impact: crash + sub thud — marks THE DROP moment
  function synthImpact(time, vel) {
    var v = vel || 0.8;

    // Crash: noise burst with fast attack, medium decay
    var impLen = Math.floor(ctx.sampleRate * 0.8);
    var impBuf = ctx.createBuffer(1, impLen, ctx.sampleRate);
    var id = impBuf.getChannelData(0);
    for (var i = 0; i < impLen; i++) {
      id[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impLen, 0.6);
    }
    var impSrc = ctx.createBufferSource(); impSrc.buffer = impBuf;
    var impLP = ctx.createBiquadFilter(); impLP.type = 'lowpass';
    impLP.frequency.value = 5000;  // not too harsh
    var impG = ctx.createGain(); impG.gain.value = 0.4 * v;
    impSrc.connect(impLP); impLP.connect(impG); impG.connect(drumBus);
    impSrc.start(time); impSrc.stop(time + 0.85);

    // Sub thud — physical impact, 50Hz sine
    var thud = ctx.createOscillator(); thud.type = 'sine';
    thud.frequency.setValueAtTime(50, time);
    thud.frequency.exponentialRampToValueAtTime(30, time + 0.2);
    var thudG = ctx.createGain();
    thudG.gain.setValueAtTime(0.65 * v, time);
    thudG.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
    thud.connect(thudG); thudG.connect(drumBus);
    thud.start(time); thud.stop(time + 0.55);
  }

  // Intro melody: a dark phrygian motif through heavy LP, then glitches out.
  // Each note is its own self-contained chain to avoid shared-node timing crashes.
  function synthIntroMelody(time, rootFreq) {
    var r = rootFreq || 220;
    // Phrygian: root → b2 → b3 → root (descending back home = dark, inevitable)
    var notes = [
      { f: r,           t: 0,    dur: 0.7  },
      { f: r * 1.0595,  t: 0.85, dur: 0.55 },  // b2
      { f: r * 1.1892,  t: 1.5,  dur: 0.45 },  // b3
      { f: r,           t: 2.1,  dur: 1.0  },   // home — longer, lets it ring
    ];

    for (var ni = 0; ni < notes.length; ni++) {
      var n = notes[ni];
      var noteT = time + n.t;
      var endT = noteT + n.dur;
      // Each note: its own LP + gain chain (no shared nodes = no crash)
      var lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
      // Filter closes as melody progresses — each note darker
      lp.frequency.value = 2000 - ni * 400;
      lp.Q.value = 2.5;
      var env = ctx.createGain();
      env.gain.setValueAtTime(0.001, noteT);
      env.gain.linearRampToValueAtTime(0.14, noteT + 0.015);
      env.gain.setTargetAtTime(0.08, noteT + 0.05, 0.12);
      env.gain.setTargetAtTime(0.001, endT - 0.1, 0.08);

      // 3 detuned saws per note
      var detunes = [-10, 0, 10];
      for (var di = 0; di < detunes.length; di++) {
        var o = ctx.createOscillator(); o.type = 'sawtooth';
        o.frequency.value = n.f;
        o.detune.value = detunes[di];
        o.connect(lp);
        o.start(noteT); o.stop(endT + 0.15);
      }
      lp.connect(env); env.connect(sidechainGain);
      // Delay send for echo trail
      var ds = ctx.createGain(); ds.gain.value = 0.35;
      env.connect(ds); ds.connect(delaySend);
    }

    // Glitch stutter: separate chain. Last note repeats and fragments.
    // Each chop is its own oscillator+gain — no rapid setValueAtTime on shared nodes.
    var chopStart = time + 3.3;
    for (var si = 0; si < 10; si++) {
      var chopT = chopStart + si * (0.09 - si * 0.005);
      if (chopT < chopStart) break;
      var chopDur = 0.035 - si * 0.002;
      if (chopDur < 0.008) chopDur = 0.008;
      var chopVol = 0.12 * (1 - si / 10);

      var co = ctx.createOscillator(); co.type = 'sawtooth';
      co.frequency.value = r * (1 + si * 0.02);  // pitch drifts up = disintegrating
      var cLP = ctx.createBiquadFilter(); cLP.type = 'lowpass';
      cLP.frequency.value = 800 - si * 60;  // darker each chop
      cLP.Q.value = 3;
      var cG = ctx.createGain();
      cG.gain.setValueAtTime(chopVol, chopT);
      cG.gain.setTargetAtTime(0.001, chopT + chopDur * 0.6, chopDur * 0.3);
      co.connect(cLP); cLP.connect(cG); cG.connect(sidechainGain);
      co.start(chopT); co.stop(chopT + chopDur + 0.05);
    }
  }

  // Snare roll: accelerating snare hits leading into the drop.
  // 8th notes → 16th notes → 32nd notes over `duration` seconds.
  function synthSnareRoll(time, duration, kit) {
    var dur = duration || 4;
    var k = kit || '808';
    // Phase 1 (0-40%): 8th notes
    // Phase 2 (40-70%): 16th notes
    // Phase 3 (70-100%): 32nd notes
    var stepDur, t = 0;
    var baseBeat = dur / 8;  // 8th note duration

    while (t < dur) {
      var progress = t / dur;
      if (progress < 0.4)       stepDur = baseBeat;
      else if (progress < 0.7)  stepDur = baseBeat * 0.5;
      else                       stepDur = baseBeat * 0.25;

      var vel = 0.15 + progress * 0.65;  // velocity crescendo
      playSnare(time + t, Math.min(0.88, vel), k);
      t += stepDur;
    }
  }

  // Breakdown melody: filtered piano-like notes, sparse, contemplative.
  // 4 notes over ~4 bars — breathing space between intensity.
  function synthBreakdownMelody(time, rootFreq, barDur) {
    var r = rootFreq || 220;
    var bd = barDur || 1.875;
    // Phrygian descent: 5th → b3 → b2 → root (falling into silence)
    var notes = [
      { f: r * 1.498,  t: 0,          vel: 0.10 },  // 5th
      { f: r * 1.1892, t: bd * 1.2,   vel: 0.08 },  // b3
      { f: r * 1.0595, t: bd * 2.5,   vel: 0.07 },  // b2
      { f: r,          t: bd * 3.8,   vel: 0.09 },  // root — home
    ];
    for (var ni = 0; ni < notes.length; ni++) {
      var n = notes[ni];
      // Use piano voice — warm, not aggressive
      try { synthPiano(time + n.t, n.f, n.vel, 3.5); } catch(e) {}
    }
  }

  // EDM stab: short gridstack hit for rhythmic texture during drops
  function synthEDMStab(time, freq, vel) {
    synthGridStack(time, freq, vel || 0.3, 0.2);
  }

  // Sub bass pulse: pure sine at root, short, sidechained
  function synthSubPulse(time, freq, vel, dur) {
    var o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.value = freq || 55;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.001, time);
    g.gain.linearRampToValueAtTime((vel || 0.4) * 0.55, time + 0.01);
    g.gain.setTargetAtTime(0.001, time + (dur || 0.3) * 0.5, (dur || 0.3) * 0.3);
    o.connect(g); g.connect(sidechainGain);
    o.start(time); o.stop(time + (dur || 0.3) + 0.15);
  }

  // Build sub layer: persistent sine sub that can be gain-controlled
  function buildSubLayer(freq) {
    destroyLayer('edm-sub');
    return buildLayer('edm-sub', {
      oscillators: [
        { wave: 'sine', freq: freq || 55, gain: 0.45 },
        { wave: 'sine', freq: (freq || 55) * 2, gain: 0.08 },  // octave for presence
      ],
      gain: 0,
    });
  }

  // ── CHORD STAB: short punchy chord that responds to archetype ──
  // Bouncing = tight staccato stab. Waving = longer sustained chord. Walking = offbeat skank.
  function synthChordStab(time, freqs, vel, sustain) {
    var v = vel || 0.3;
    var s = sustain || 0.08;  // short by default

    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(2800, time);
    lp.frequency.exponentialRampToValueAtTime(600, time + s * 1.5);
    lp.Q.value = 2;

    var env = ctx.createGain();
    env.gain.setValueAtTime(0.001, time);
    env.gain.linearRampToValueAtTime(v * 0.3, time + 0.003);
    env.gain.setTargetAtTime(0.001, time + s, s * 0.4);

    // Stack chord tones — each frequency is a voice in the chord
    for (var i = 0; i < freqs.length; i++) {
      var o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = freqs[i];
      o.detune.value = (Math.random() - 0.5) * 12;  // slight detuning for width
      var og = ctx.createGain();
      og.gain.value = 0.15 / freqs.length;
      o.connect(og); og.connect(lp);
      o.start(time); o.stop(time + s + 0.15);
    }

    lp.connect(env);
    env.connect(sidechainGain);
    if (reverbSend) {
      var rs = ctx.createGain(); rs.gain.value = 0.08;
      env.connect(rs); rs.connect(reverbSend);
    }
  }

  // ── TENSION PAD: slow evolving texture that tracks archetype ──
  // Exploring = airy, bright. Walking = warm mid. Bouncing = barely there (drums dominate).
  function synthTensionSwell(time, freq, vel, dur) {
    var v = vel || 0.15;
    var d = dur || 2.0;

    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(400, time);
    lp.frequency.linearRampToValueAtTime(1800, time + d * 0.6);
    lp.frequency.linearRampToValueAtTime(600, time + d);
    lp.Q.value = 1.5;

    var env = ctx.createGain();
    env.gain.setValueAtTime(0.001, time);
    env.gain.linearRampToValueAtTime(v * 0.25, time + d * 0.3);
    env.gain.setTargetAtTime(0.001, time + d * 0.7, d * 0.2);

    // 3 detuned saws for thickness
    for (var i = 0; i < 3; i++) {
      var o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = freq;
      o.detune.value = [-15, 0, 15][i];
      o.connect(lp);
      o.start(time); o.stop(time + d + 0.2);
    }

    lp.connect(env);
    env.connect(sidechainGain);
    if (reverbSend) {
      var rs = ctx.createGain(); rs.gain.value = 0.2;
      env.connect(rs); rs.connect(reverbSend);
    }
  }

  // Crash fill: short bright noise burst for transitions
  function synthCrashFill(time, vel) {
    var v = vel || 0.5;
    var len = Math.floor(ctx.sampleRate * 0.35);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 0.4);
    var src = ctx.createBufferSource(); src.buffer = buf;
    var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3000;
    var g = ctx.createGain(); g.gain.value = 0.35 * v;
    src.connect(hp); hp.connect(g); g.connect(drumBus);
    src.start(time); src.stop(time + 0.4);
  }

  // Vocal chop: formant-like burst (adds human texture to drops)
  function synthVocalChop(time, freq, vel) {
    var f = freq || 440;
    var v = vel || 0.3;
    // Two formant bandpasses on a saw — sounds like a short "ah"
    var o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
    var bp1 = ctx.createBiquadFilter(); bp1.type = 'bandpass'; bp1.frequency.value = 700; bp1.Q.value = 8;
    var bp2 = ctx.createBiquadFilter(); bp2.type = 'bandpass'; bp2.frequency.value = 1200; bp2.Q.value = 6;
    var g1 = ctx.createGain(); g1.gain.value = 0.25 * v;
    var g2 = ctx.createGain(); g2.gain.value = 0.18 * v;
    var env = ctx.createGain();
    env.gain.setValueAtTime(0.001, time);
    env.gain.linearRampToValueAtTime(1, time + 0.008);
    env.gain.setTargetAtTime(0.001, time + 0.06, 0.04);
    o.connect(bp1); bp1.connect(g1); g1.connect(env);
    o.connect(bp2); bp2.connect(g2); g2.connect(env);
    env.connect(sidechainGain);
    o.start(time); o.stop(time + 0.25);
  }

  // ── KICK FILL: rapid 32nd note kick roll for transitions ──
  function synthKickRoll(time, steps, vel) {
    var v = vel || 0.5;
    var stepLen = 60 / 128 / 8;  // 32nd note at 128bpm
    for (var i = 0; i < steps; i++) {
      var t = time + i * stepLen;
      var vol = v * (0.5 + 0.5 * (i / steps));  // crescendo
      playKick(t, Math.min(0.8, vol), '808');
    }
  }

  // Bass pluck: short sine with pitch bend for walking bass lines
  function synthBassPluck(time, freq, vel, decay) {
    var v = vel || 0.4;
    var d = decay || 0.25;

    var o = ctx.createOscillator(); o.type = 'sine';
    // Slight pitch bend down for that bass "thwack"
    o.frequency.setValueAtTime(freq * 1.08, time);
    o.frequency.exponentialRampToValueAtTime(freq, time + 0.03);

    // Add a subtle saw harmonic for grit
    var o2 = ctx.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = freq;
    var o2g = ctx.createGain(); o2g.gain.value = 0.06;
    o2.connect(o2g);

    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(1200, time);
    lp.frequency.exponentialRampToValueAtTime(200, time + d * 0.6);

    var env = ctx.createGain();
    env.gain.setValueAtTime(v * 0.5, time);
    env.gain.setTargetAtTime(0.001, time + d * 0.4, d * 0.3);

    o.connect(lp); o2g.connect(lp);
    lp.connect(env);
    env.connect(sidechainGain);

    o.start(time); o.stop(time + d + 0.1);
    o2.start(time); o2.stop(time + d + 0.1);
  }

  // Teardown all EDM layers
  function destroyEDMLayers() {
    destroyLayer('edm-wobble');
    destroyLayer('edm-pad');
    destroyLayer('edm-sub');
    destroyLayer('edm-levitation');
  }

  // ── VOCAL SAMPLE ENGINE ─────────────────────────────────────────────
  // Preloads mp3 clips and plays them through the main audio chain
  // (sidechained + filtered) so vocals sit IN the mix like a real DJ set.

  var vocalBuffers = {};   // name → AudioBuffer
  var vocalSources = [];   // active sources (for cleanup)

  // Preload a vocal clip by name
  function preloadVocal(name, url) {
    if (!ctx) return Promise.resolve(null);
    return fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.arrayBuffer();
      })
      .then(function (buf) { return ctx.decodeAudioData(buf); })
      .then(function (decoded) {
        vocalBuffers[name] = decoded;
        return decoded;
      })
      .catch(function (e) {
        console.warn('Vocal preload failed:', name, e.message);
        return null;
      });
  }

  // Play a vocal clip — clean, simple, reliable.
  // Routes through its own gain → masterHPF (bypasses sidechain to avoid pump artifacts).
  // Production is in the mix position and reverb/delay sends, not complex filter chains.
  function playVocal(name, time, opts) {
    var buf = vocalBuffers[name];
    if (!buf || !ctx) return null;
    var o = opts || {};
    var vol = o.vol !== undefined ? o.vol : 0.75;
    var rate = o.rate !== undefined ? o.rate : 1.0;
    var offset = o.offset || 0;
    var duration = o.duration || 0;

    var src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = rate;

    // Simple chain: HP (keep out of sub) → gain → master chain
    var hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 150;

    var g = ctx.createGain();
    g.gain.setValueAtTime(vol, time);

    src.connect(hp);
    hp.connect(g);

    // Route to masterHPF directly (bypasses sidechain — vocal shouldn't pump)
    if (masterHPF) {
      g.connect(masterHPF);
    } else {
      g.connect(sidechainGain);
    }

    // Reverb send for space
    if (o.reverb && reverbSend) {
      var rs = ctx.createGain();
      rs.gain.value = o.reverb;
      g.connect(rs);
      rs.connect(reverbSend);
    }

    // Delay send for echo
    if (o.delay && delaySend) {
      var ds = ctx.createGain();
      ds.gain.value = o.delay;
      g.connect(ds);
      ds.connect(delaySend);
    }

    if (duration > 0) {
      src.start(time, offset, duration);
    } else {
      src.start(time, offset);
    }

    vocalSources.push(src);
    src.onended = function () {
      var idx = vocalSources.indexOf(src);
      if (idx >= 0) vocalSources.splice(idx, 1);
    };

    return { source: src, gain: g };
  }

  // Triplet stutter: 3 chops decelerating
  function playVocalTriplet(name, time, opts) {
    var buf = vocalBuffers[name];
    if (!buf || !ctx) return;
    var o = opts || {};
    var vol = o.vol !== undefined ? o.vol : 0.7;
    var dur = buf.duration;

    var chopDurs = [0.12, 0.18, 0.28];
    var gaps = [0.04, 0.06];
    var t = time;

    for (var i = 0; i < 3; i++) {
      var chopLen = Math.min(chopDurs[i], dur);
      var chopVol = vol * (0.6 + i * 0.2);

      playVocal(name, t, {
        vol: chopVol,
        duration: chopLen,
        rate: 1.0 - i * 0.1,
        reverb: 0.1 + i * 0.15,
        delay: i === 2 ? 0.3 : 0,
      });

      t += chopLen + (gaps[i] || 0);
    }

    return t;
  }

  // Stop all playing vocals
  function stopAllVocals() {
    for (var i = 0; i < vocalSources.length; i++) {
      try { vocalSources[i].stop(); } catch (e) {}
    }
    vocalSources = [];
  }

  // ── EDM FILTER & SIDECHAIN API ──────────────────────────────────────

  function setMasterFilter(freq) {
    if (masterLP) masterLP.frequency.setTargetAtTime(
      Math.max(80, Math.min(12000, freq)), ctx.currentTime, 0.05
    );
  }

  function setSidechainDepth(depth) {
    sidechainDepth = Math.max(0, Math.min(1, depth));
  }

  function set808SubFreq(freq) {
    _edm808SubFreq = freq || 55;
  }

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
      riser: synthRiser,
      impact: synthImpact,
      introMelody: synthIntroMelody,
      snareRoll: synthSnareRoll,
      breakdownMelody: synthBreakdownMelody,
      edmStab: synthEDMStab,
      subPulse: synthSubPulse,
      crashFill: synthCrashFill,
      vocalChop: synthVocalChop,
      chordStab: synthChordStab,
      tensionSwell: synthTensionSwell,
      kickRoll: synthKickRoll,
      bassPluck: synthBassPluck,
      ascPluck: synthAscPluck,
      ascStab: synthAscStab,
      ascLead: synthAscLead,
      hourlyChime: synthHourlyChime,
      play: synthesize,
    }),

    drum: Object.freeze({
      kick: playKick,
      snare: playSnare,
      hat: playHat,
      ride: playRide,
      timpani: playTimpani,
      shaker: playShaker,
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

    setMassivePhase: setMassivePhase,
    resetPortamento: function () { monoLastFreq = 0; cinematicLastFreq = 0; massiveLastFreq = 0; },
    setMasterGain: function (v) { if (masterGain) masterGain.gain.value = v; },
    setReverbMix: function (v) { if (reverbSend) reverbSend.gain.value = v; },
    setDelayMix: function (v) { if (delaySend) delaySend.gain.value = v; },
    setMasterFilter: setMasterFilter,
    setSidechainDepth: setSidechainDepth,
    set808SubFreq: set808SubFreq,
    ascension: Object.freeze({
      buildWall: buildAscWall,
      buildSub: buildAscSub,
      buildNoise: buildAscNoise,
      setWallFilter: setAscWallFilter,
      setWallSpread: setAscWallSpread,
      setWallChord: setAscWallChord,
      setMasterPitch: setAscMasterPitch,
      destroyAll: destroyAscLayers,
    }),
    edm: Object.freeze({
      buildWobble: buildWobbleLayer,
      buildPad: buildDarkPad,
      buildSub: buildSubLayer,
      buildLevitation: buildLevitationLayer,
      setWobbleFilter: setWobbleFilter,
      setWobbleQ: setWobbleQ,
      setLevitationFilter: setLevitationFilter,
      setLevitationSpread: setLevitationSpread,
      destroyAll: destroyEDMLayers,
    }),
    vocal: Object.freeze({
      preload: preloadVocal,
      play: playVocal,
      triplet: playVocalTriplet,
      stopAll: stopAllVocals,
      buffers: vocalBuffers,
    }),
    setWeather: setWeather,

    get ctx() { return ctx; },
    get master() { return masterGain; },
    get sidechain() { return sidechainGain; },
    get reverbSendNode() { return reverbSend; },
    get delaySendNode() { return delaySend; },
    get drumBusNode() { return drumBus; },
    get reverbGainNode() { return reverbGain; },
  });
})();
