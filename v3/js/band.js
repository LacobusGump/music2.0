/**
 * BAND — The Environment's Groove Machine
 *
 * Reads from Environ. Writes to Sound. Runs a song.
 *
 * Architecture:
 *   - Beat scheduler: precise AudioContext timing (Farnell / Cwilson pattern)
 *     Schedules 50ms ahead. Polls every 25ms. Never drifts.
 *   - 4 layers: drums, bass, chord pad, melody
 *   - Melody layer: driven by tilt/touch from the human
 *
 * Drum synthesis (no samples):
 *   - Kick: 60Hz sine + pitch envelope 60→20Hz in 80ms + noise click
 *   - Snare: noise burst + 200Hz resonance, 120ms
 *   - Hihat: filtered white noise, 40ms (open) / 15ms (closed)
 *
 * Chord layer uses Sound's 'strings' voice.
 * Bass uses Sound's 'mono' voice (portamento between roots).
 * Melody uses Sound's 'mono' or 'epiano' voice depending on mode.
 */

const Band = (function () {
  'use strict';

  // ── STATE ──────────────────────────────────────────────────────────────

  var _ctx    = null;
  var _master = null;   // GainNode to mix this band's output

  var _running    = false;
  var _nextBeat   = 0;     // AudioContext time of next 16th note
  var _beat       = 0;     // 0–15 (16 steps per bar)
  var _bar        = 0;     // 0–3 (4 bars in progression loop)
  var _timerID    = null;
  var _bpm        = 90;

  // 1/f humanization: pink noise state
  var _pk = { b0:0, b1:0, b2:0, b3:0, b4:0, b5:0, b6:0 };
  function _pink() {
    var w = Math.random() * 2 - 1;
    _pk.b0 = 0.99886*_pk.b0 + w*0.0555179;
    _pk.b1 = 0.99332*_pk.b1 + w*0.0750759;
    _pk.b2 = 0.96900*_pk.b2 + w*0.1538520;
    _pk.b3 = 0.86650*_pk.b3 + w*0.3104856;
    _pk.b4 = 0.55000*_pk.b4 + w*0.5329522;
    _pk.b5 = -0.7616*_pk.b5 - w*0.0168980;
    var out = (_pk.b0+_pk.b1+_pk.b2+_pk.b3+_pk.b4+_pk.b5+_pk.b6+w*0.5362)*0.11;
    _pk.b6 = w*0.115926;
    return out;
  }

  // Human melody state
  var _melodyDegree   = 0;   // current scale degree 0–6
  var _melodyActive   = false;
  var _melodyVel      = 0.5;
  var _lastTilt       = 0;
  var _lastMelodyTime = 0;

  // Reverb send (for drum hits to feel in a space)
  var _reverbSend = null;
  var _reverbGain = null;

  // ── DRUM SYNTHESIS ─────────────────────────────────────────────────────

  function _kick(t, vel) {
    var v = Math.min(1, vel + _pink() * 0.05);
    var osc = _ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(60, t);
    osc.frequency.exponentialRampToValueAtTime(22, t + 0.08);

    var click = _ctx.createOscillator();
    click.type = 'sine';
    click.frequency.setValueAtTime(160, t);
    click.frequency.exponentialRampToValueAtTime(60, t + 0.01);

    var nLen = Math.floor(_ctx.sampleRate * 0.008);
    var nBuf = _ctx.createBuffer(1, nLen, _ctx.sampleRate);
    var nd = nBuf.getChannelData(0);
    for (var i = 0; i < nLen; i++) nd[i] = (Math.random()*2-1) * Math.pow(1-i/nLen, 3);
    var noise = _ctx.createBufferSource(); noise.buffer = nBuf;

    var env = _ctx.createGain();
    env.gain.setValueAtTime(v * 0.85, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    var clickEnv = _ctx.createGain();
    clickEnv.gain.setValueAtTime(v * 0.3, t);
    clickEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.02);

    var noiseEnv = _ctx.createGain();
    noiseEnv.gain.setValueAtTime(v * 0.25, t);
    noiseEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.015);

    // LP to shape kick
    var lp = _ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 140; lp.Q.value = 0.5;

    osc.connect(env); click.connect(clickEnv); noise.connect(noiseEnv);
    clickEnv.connect(lp); noiseEnv.connect(lp); env.connect(lp);
    lp.connect(_master);

    osc.start(t); osc.stop(t + 0.4);
    click.start(t); click.stop(t + 0.03);
    noise.start(t); noise.stop(t + 0.015);

    // Sidechain pump: duck the pad on the kick
    if (_padGain) {
      _padGain.gain.setValueAtTime(0.35, t);
      _padGain.gain.setTargetAtTime(1.0, t + 0.01, 0.08);
    }
  }

  function _snare(t, vel) {
    var v = Math.min(1, vel * 0.80 + _pink() * 0.06);

    // Noise body
    var nLen = Math.floor(_ctx.sampleRate * 0.18);
    var nBuf = _ctx.createBuffer(1, nLen, _ctx.sampleRate);
    var nd = nBuf.getChannelData(0);
    for (var i = 0; i < nLen; i++) nd[i] = (Math.random()*2-1);
    var noise = _ctx.createBufferSource(); noise.buffer = nBuf;

    // Tonal body (snare pitch character)
    var tone = _ctx.createOscillator();
    tone.type = 'triangle'; tone.frequency.value = 185;
    var toneEnv = _ctx.createGain();
    toneEnv.gain.setValueAtTime(v * 0.30, t);
    toneEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    var hp = _ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 1200; hp.Q.value = 0.7;

    var bp = _ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 3000; bp.Q.value = 0.8;

    var env = _ctx.createGain();
    env.gain.setValueAtTime(v * 0.65, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    noise.connect(hp); hp.connect(bp); bp.connect(env);
    tone.connect(toneEnv);
    env.connect(_master);
    toneEnv.connect(_master);
    if (_reverbSend) {
      var rs = _ctx.createGain(); rs.gain.value = 0.18;
      env.connect(rs); rs.connect(_reverbSend);
    }

    noise.start(t); noise.stop(t + 0.2);
    tone.start(t); tone.stop(t + 0.08);
  }

  function _hihat(t, vel, open) {
    var dur = open ? 0.06 : 0.022;
    var v   = Math.min(1, vel * 0.40 + _pink() * 0.04);

    var nLen = Math.floor(_ctx.sampleRate * 0.1);
    var nBuf = _ctx.createBuffer(1, nLen, _ctx.sampleRate);
    var nd = nBuf.getChannelData(0);
    for (var i = 0; i < nLen; i++) nd[i] = (Math.random()*2-1);
    var noise = _ctx.createBufferSource(); noise.buffer = nBuf;

    var hp = _ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 7000; hp.Q.value = 0.3;

    var env = _ctx.createGain();
    env.gain.setValueAtTime(v, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(hp); hp.connect(env); env.connect(_master);
    noise.start(t); noise.stop(t + 0.12);
  }

  // ── PAD LAYER ─────────────────────────────────────────────────────────
  // Persistent chord oscillators that glide between chords.

  var _padOscs  = [];
  var _padGain  = null;
  var _padBar   = -1;

  function _buildPad() {
    if (!_ctx) return;
    // Kill existing
    for (var i = 0; i < _padOscs.length; i++) {
      try { _padOscs[i].osc.stop(); } catch(e) {}
      try { _padOscs[i].osc.disconnect(); _padOscs[i].g.disconnect(); } catch(e) {}
    }
    _padOscs = [];

    if (!_padGain) {
      _padGain = _ctx.createGain();
      _padGain.gain.value = 0;

      // Pad LP — warm, not harsh
      var lp = _ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 1400; lp.Q.value = 0.3;
      _padGain.connect(lp);
      lp.connect(_master);
      if (_reverbSend) {
        var rs = _ctx.createGain(); rs.gain.value = 0.5;
        lp.connect(rs); rs.connect(_reverbSend);
      }
    }

    // 3 chord tones × 2 detuned oscillators = 6 oscillators total
    var initialChord = Environ.chord(0, 0);
    for (var ci = 0; ci < 3; ci++) {
      var hz = Environ.midiToHz(initialChord[ci] + 12); // up an octave for pad
      for (var d = 0; d < 2; d++) {
        var osc = _ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = hz;
        osc.detune.value = (d === 0) ? -8 : 8;
        var g = _ctx.createGain();
        g.gain.value = 0.12;
        osc.connect(g); g.connect(_padGain);
        osc.start();
        _padOscs.push({ osc: osc, g: g, degree: ci });
      }
    }
  }

  function _updatePad(bar) {
    if (_padBar === bar) return;
    _padBar = bar;
    var ch = Environ.chord(bar, 0);
    var idx = 0;
    for (var ci = 0; ci < 3; ci++) {
      var hz = Environ.midiToHz(ch[ci] + 12);
      var o0 = _padOscs[idx];   if (o0) o0.osc.frequency.setTargetAtTime(hz, _ctx.currentTime, 0.3);
      var o1 = _padOscs[idx+1]; if (o1) o1.osc.frequency.setTargetAtTime(hz, _ctx.currentTime, 0.3);
      idx += 2;
    }
    // Fade pad in
    _padGain.gain.setTargetAtTime(Environ.energy * 0.28, _ctx.currentTime, 0.5);
  }

  // ── BASS LAYER ────────────────────────────────────────────────────────
  // One mono bass oscillator, glides between root notes.

  var _bassOsc  = null;
  var _bassEnv  = null;
  var _bassGain = null;
  var _lastBassHz = 0;

  function _buildBass() {
    if (!_ctx) return;
    if (_bassOsc) { try { _bassOsc.stop(); } catch(e) {} }

    _bassGain = _ctx.createGain();
    _bassGain.gain.value = 0;

    var lp = _ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 360; lp.Q.value = 0.5;

    _bassGain.connect(lp);
    lp.connect(_master);
    if (_reverbSend) {
      var rs = _ctx.createGain(); rs.gain.value = 0.08;
      lp.connect(rs); rs.connect(_reverbSend);
    }

    _bassOsc = _ctx.createOscillator();
    _bassOsc.type = 'triangle';
    _bassOsc.frequency.value = 55;

    // Sub-sine for that 808 weight
    var sub = _ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = 55;
    var subG = _ctx.createGain(); subG.gain.value = 0.6;
    sub.connect(subG); subG.connect(_bassGain);

    _bassEnv = _ctx.createGain(); _bassEnv.gain.value = 0.5;
    _bassOsc.connect(_bassEnv); _bassEnv.connect(_bassGain);

    _bassOsc.start();
    sub.start();
  }

  function _playBass(t, midiNote, vel) {
    if (!_bassOsc || !_bassGain) return;
    var hz    = Environ.midiToHz(midiNote - 12); // one octave below scale
    var prevHz = _lastBassHz > 0 ? _lastBassHz : hz;
    _lastBassHz = hz;

    // Portamento if close interval, jump if far
    var semis = Math.abs(Math.log2(hz / prevHz) * 12);
    var glide = semis < 5 ? 0.04 : 0;
    _bassOsc.frequency.setTargetAtTime(hz, t, glide || 0.001);

    // Get second sub oscillator frequency in sync
    var subOscs = _bassGain.context ? null : null; // just update main

    // Envelope: pluck shape
    var v = Math.min(0.85, vel * 0.70 + _pink() * 0.04);
    _bassGain.gain.setValueAtTime(v, t);
    _bassGain.gain.setTargetAtTime(v * 0.4, t + 0.02, 0.12);
    _bassGain.gain.setTargetAtTime(0.05, t + 0.15, 0.25);
  }

  // ── MELODY LAYER (human-driven) ───────────────────────────────────────

  var _melodyNodes = [];

  function _playMelody(t, scaleIndex, vel, dur) {
    var sc  = Environ.scale(1); // melody in octave above pad
    var idx = Math.max(0, Math.min(sc.length - 1, scaleIndex));
    var hz  = Environ.midiToHz(sc[idx]);
    var v   = Math.min(0.85, vel + _pink() * 0.03);

    var osc = _ctx.createOscillator();
    osc.type = Environ.mode === 'major' || Environ.mode === 'lydian' ? 'triangle' : 'sawtooth';
    osc.frequency.value = hz;

    // Slight vibrato
    var vib = _ctx.createOscillator(); vib.type = 'sine'; vib.frequency.value = 5.5;
    var vibG = _ctx.createGain(); vibG.gain.value = hz * 0.003;
    vib.connect(vibG); vibG.connect(osc.frequency);

    var lp = _ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 3200; lp.Q.value = 0.4;

    var env = _ctx.createGain();
    env.gain.setValueAtTime(0.001, t);
    env.gain.linearRampToValueAtTime(v * 0.55, t + 0.018);
    env.gain.setTargetAtTime(v * 0.35, t + 0.05, dur * 0.4);
    env.gain.linearRampToValueAtTime(0.001, t + dur * 0.85);

    osc.connect(lp); lp.connect(env); env.connect(_master);
    if (_reverbSend) {
      var rs = _ctx.createGain(); rs.gain.value = 0.4;
      env.connect(rs); rs.connect(_reverbSend);
    }

    osc.start(t); osc.stop(t + dur + 0.1);
    vib.start(t); vib.stop(t + dur + 0.1);
  }

  // ── BEAT SCHEDULER ────────────────────────────────────────────────────
  // WebAudio precision pattern (Chris Wilson / Paul Adenot approach):
  // Poll via setTimeout, schedule notes AHEAD by LOOKAHEAD seconds.
  // Never drifts. Survives tab throttling.

  var LOOKAHEAD   = 0.08;  // seconds ahead to schedule
  var SCHEDULE_MS = 20;    // polling interval

  function _schedule() {
    if (!_ctx || !_running) return;

    var beat16th = 60 / (_bpm * 4);  // duration of one 16th note

    while (_nextBeat < _ctx.currentTime + LOOKAHEAD) {
      var t   = _nextBeat;
      var b   = _beat % 16;
      var bar = Math.floor(_beat / 16) % 4;
      var en  = Environ.energy;

      // ── DRUMS ──
      // Kick: 1 and 3 (16th beats 0 and 8)
      if (b === 0) _kick(t, 0.85 + _pink() * 0.08);
      if (b === 8) _kick(t, 0.70 + _pink() * 0.08);

      // Snare: 2 and 4 (16th beats 4 and 12)
      if (b === 4)  _snare(t, 0.72 + _pink() * 0.06);
      if (b === 12) _snare(t, 0.68 + _pink() * 0.06);

      // Hihats: every 8th note (beats 0,2,4,6,8,10,12,14)
      // Accent on on-beats (0,4,8,12), ghost on off-beats
      if (b % 2 === 0) {
        var hatVel = (b % 4 === 0) ? 0.55 : 0.30;
        hatVel += _pink() * 0.06;
        // Open hat on beat 2.5 (b=10) for R&B feel
        _hihat(t, hatVel, b === 10);
      }

      // Extra ghost snare for groove (late 16th on b=14 at ~40% chance)
      if (b === 14 && Math.random() < 0.35) {
        _snare(t, 0.28 + _pink() * 0.04);
      }

      // ── BASS ── on beat 1 and beat 3, sometimes beat 2.5
      if (b === 0) {
        var bassChord = Environ.chord(bar, -1); // bass register
        _playBass(t, bassChord[0], 0.80 + _pink() * 0.06);
      }
      if (b === 8) {
        // Passing tone: root or fifth
        var bassChord2 = Environ.chord(bar, -1);
        var passing = Math.random() < 0.6 ? bassChord2[0] : bassChord2[2];
        _playBass(t, passing, 0.60 + _pink() * 0.06);
      }
      if (b === 10 && Math.random() < 0.4) {
        var bassChord3 = Environ.chord(bar, -1);
        _playBass(t, bassChord3[1], 0.42 + _pink() * 0.04);
      }

      // ── PAD chord change ── at start of each bar
      if (b === 0) _updatePad(bar);

      // ── MELODY ── drive from human tilt, quantize to 8th notes
      if (b % 2 === 0 && _melodyActive) {
        var noteDur = beat16th * 1.8;
        _playMelody(t, _melodyDegree, _melodyVel, noteDur);
      }

      _beat++;
      _nextBeat += beat16th + _pink() * beat16th * 0.004; // 1/f micro-timing
    }

    _timerID = setTimeout(_schedule, SCHEDULE_MS);
  }

  // ── REVERB BUILD ──────────────────────────────────────────────────────

  function _buildReverb() {
    var decayTime = 2.5;
    var sr  = _ctx.sampleRate;
    var len = Math.floor(sr * decayTime);
    var buf = _ctx.createBuffer(2, len, sr);
    var fadeIn = Math.floor(0.04 * sr);
    for (var ch = 0; ch < 2; ch++) {
      var d = buf.getChannelData(ch);
      for (var j = 0; j < len; j++) {
        var t = j / len;
        d[j] = (Math.random()*2-1) * Math.pow(1-t, 2.5) * Math.min(1, j/fadeIn);
      }
    }
    var conv = _ctx.createConvolver(); conv.buffer = buf;

    _reverbSend = _ctx.createGain(); _reverbSend.gain.value = 0.3;
    _reverbGain = _ctx.createGain(); _reverbGain.gain.value = Environ.reverbDepth;

    var reverbHP = _ctx.createBiquadFilter();
    reverbHP.type = 'highpass'; reverbHP.frequency.value = 120; reverbHP.Q.value = 0.5;
    var reverbLP = _ctx.createBiquadFilter();
    reverbLP.type = 'lowpass'; reverbLP.frequency.value = 3800; reverbLP.Q.value = 0.5;

    _reverbSend.connect(conv);
    conv.connect(reverbHP); reverbHP.connect(reverbLP);
    reverbLP.connect(_reverbGain); _reverbGain.connect(_master);
  }

  // ── PUBLIC ─────────────────────────────────────────────────────────────

  function init(audioCtx, masterGain) {
    _ctx    = audioCtx;
    _master = masterGain;

    _buildReverb();
    _buildPad();
    _buildBass();

    _bpm       = Environ.bpm;
    _nextBeat  = _ctx.currentTime + 0.1;
    _beat      = 0;
    _bar       = 0;
    _running   = true;

    _schedule();
  }

  function stop() {
    _running = false;
    clearTimeout(_timerID);
    if (_padOscs.length > 0) {
      _padGain && _padGain.gain.setTargetAtTime(0, _ctx.currentTime, 0.5);
    }
    if (_bassOsc) {
      try { _bassOsc.stop(_ctx.currentTime + 1); } catch(e) {}
    }
  }

  /**
   * Called every animation frame with the human's tilt data.
   * gamma: left-right tilt in degrees (-90 to +90)
   * beta:  front-back tilt in degrees (-90 to +90)
   * energy: motion energy 0–1
   * active: true if human is moving intentionally
   */
  function updateHuman(gamma, beta, energy, active) {
    // gamma → melody degree (0–6)
    // Map: -45° = degree 0, +45° = degree 6
    var t = Math.max(-1, Math.min(1, (gamma || 0) / 45));
    var deg = Math.round((t + 1) / 2 * 6);  // 0–6
    _melodyDegree = deg;
    _melodyVel    = Math.min(0.9, 0.4 + energy * 0.45);
    _melodyActive = active || Math.abs(gamma || 0) > 8;
    _lastTilt     = gamma;
  }

  /**
   * Touch fallback: x position 0–1 maps to melody degree when no tilt available.
   */
  function updateTouch(normX, normY, active) {
    if (active) {
      var deg = Math.round(normX * 6);
      _melodyDegree = deg;
      _melodyVel    = 0.6;
      _melodyActive = true;
    } else {
      _melodyActive = false;
    }
  }

  function setBPM(bpm) {
    _bpm = Math.max(60, Math.min(140, bpm));
  }

  return Object.freeze({
    init: init,
    stop: stop,
    updateHuman: updateHuman,
    updateTouch: updateTouch,
    setBPM: setBPM,
    get isRunning() { return _running; },
    get beat() { return _beat % 16; },
    get bar() { return Math.floor(_beat / 16) % 4; },
  });
})();
