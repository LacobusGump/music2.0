/**
 * BAND v3 — Style-Aware, Structure-Driven Groove Machine
 *
 * Architecture (from Suno research):
 *   Style config  = conditioning signal (like a text prompt embedding)
 *   Environment   = real-time evolution of that signal
 *   Human input   = melody layer on top (real-time, <20ms)
 *
 * Song structure (32-bar cycle):
 *   bars  0–3  : INTRO    — bass only, silence opening
 *   bars  4–7  : BUILD    — kick + bass, groove establishing
 *   bars  8–15 : VERSE    — full arrangement, 75% energy
 *   bars 16–23 : CHORUS   — full + louder, pads at max, fills
 *   bars 24–27 : DROP     — strip to bass + pad, breathe
 *   bars 28–31 : REBUILD  — drums return, building to next verse
 *   then repeat from bar 8 (never re-intro after first time)
 *
 * Sample override: Band.setStem('kick', AudioBuffer) replaces synthesis.
 * All other stems keep synthesizing as fallback.
 */

const Band = (function () {
  'use strict';

  // ── STATE ────────────────────────────────────────────────────────────────

  var _ctx    = null;
  var _master = null;
  var _style  = null;

  var _running  = false;
  var _nextBeat = 0;
  var _beat     = 0;     // absolute 16th-note counter, never resets
  var _timerID  = null;
  var _bpm      = 90;
  var _section  = 'intro';

  // Sample stem overrides (loaded externally)
  var _stems = {};

  // 1/f pink noise — micro-timing humanization (Voss-McCartney)
  var _pk = {b0:0,b1:0,b2:0,b3:0,b4:0,b5:0,b6:0};
  function _pink() {
    var w = Math.random()*2-1;
    _pk.b0=0.99886*_pk.b0+w*0.0555179; _pk.b1=0.99332*_pk.b1+w*0.0750759;
    _pk.b2=0.96900*_pk.b2+w*0.1538520; _pk.b3=0.86650*_pk.b3+w*0.3104856;
    _pk.b4=0.55000*_pk.b4+w*0.5329522; _pk.b5=-0.7616*_pk.b5-w*0.0168980;
    var out=(_pk.b0+_pk.b1+_pk.b2+_pk.b3+_pk.b4+_pk.b5+_pk.b6+w*0.5362)*0.11;
    _pk.b6=w*0.115926; return out;
  }

  // Human melody
  var _melodyDegree      = 3;
  var _melodyActive      = false;
  var _melodyVel         = 0.5;
  var _lastMelodyCtxTime = 0;

  // Auto-fill
  var _fillNotes = [0,2,4,2];
  var _fillPos   = 0;

  // Reverb
  var _reverbSend = null;
  var _reverbGain = null;

  // Pad
  var _padOscs = [];
  var _padGain = null;

  // Bass
  var _bassOsc  = null;
  var _bassSub  = null;
  var _bassGain = null;
  var _lastBassHz = 0;

  // Vinyl noise
  var _vinylSrc = null;

  // ── SONG SECTION ─────────────────────────────────────────────────────────

  function _getSection(totalBars) {
    if (totalBars < 4)  return 'intro';
    if (totalBars < 8)  return 'build';
    // After bar 8: cycle of 24 bars (verse×8, chorus×8, drop×4, rebuild×4)
    var phase = (totalBars - 8) % 24;
    if (phase < 8)  return 'verse';
    if (phase < 16) return 'chorus';
    if (phase < 20) return 'drop';
    return 'rebuild';
  }

  // Energy multipliers per section
  var SECTION_DRUM = { intro:0.0, build:0.62, verse:0.83, chorus:1.0, drop:0.0, rebuild:0.72 };
  var SECTION_PAD  = { intro:0.0, build:0.22, verse:0.72, chorus:1.0, drop:0.80, rebuild:0.60 };
  var SECTION_SNARE= { intro:false, build:false, verse:true, chorus:true, drop:false, rebuild:true };

  // ── SAMPLE PLAYBACK ──────────────────────────────────────────────────────

  function _playStem(name, t, vel) {
    var buf = _stems[name];
    if (!buf) return false;
    var src = _ctx.createBufferSource(); src.buffer = buf;
    var g = _ctx.createGain(); g.gain.value = Math.max(0.01, vel);
    src.connect(g); g.connect(_master);
    src.start(t);
    return true;
  }

  // ── DRUM SYNTHESIS ───────────────────────────────────────────────────────

  function _kick(t, vel) {
    if (_playStem('kick', t, vel)) return;
    var cfg = _style.kick;
    var v   = Math.min(1, vel + _pink()*0.04);

    // 808 body — pitch sweeps down
    var body = _ctx.createOscillator(); body.type = 'sine';
    if (cfg.sweep808 || _style.is808) {
      body.frequency.setValueAtTime(cfg.baseHz * 3, t);
      body.frequency.exponentialRampToValueAtTime(cfg.endHz, t + cfg.decay * 0.85);
    } else {
      body.frequency.setValueAtTime(cfg.baseHz, t);
      body.frequency.exponentialRampToValueAtTime(cfg.endHz, t + 0.075);
    }
    var bodyG = _ctx.createGain();
    bodyG.gain.setValueAtTime(v * 0.82, t);
    bodyG.gain.exponentialRampToValueAtTime(0.001, t + cfg.decay);

    // Punch transient (attack weight)
    var punch = _ctx.createOscillator(); punch.type = 'sine';
    punch.frequency.setValueAtTime(cfg.baseHz * 2.1, t);
    punch.frequency.exponentialRampToValueAtTime(cfg.baseHz, t + 0.022);
    var punchG = _ctx.createGain();
    punchG.gain.setValueAtTime(v * 0.44, t);
    punchG.gain.exponentialRampToValueAtTime(0.001, t + 0.030);

    // Click transient
    var click = _ctx.createOscillator(); click.type = 'sine';
    click.frequency.setValueAtTime(220, t);
    click.frequency.exponentialRampToValueAtTime(80, t + 0.007);
    var clickG = _ctx.createGain();
    clickG.gain.setValueAtTime(v * 0.35, t);
    clickG.gain.exponentialRampToValueAtTime(0.001, t + 0.010);

    // Noise burst
    var nLen = Math.floor(_ctx.sampleRate * 0.012);
    var nBuf = _ctx.createBuffer(1, nLen, _ctx.sampleRate);
    var nd   = nBuf.getChannelData(0);
    for (var i = 0; i < nLen; i++) nd[i] = (Math.random()*2-1) * Math.pow(1-i/nLen, 2);
    var noiseS = _ctx.createBufferSource(); noiseS.buffer = nBuf;
    var noiseG = _ctx.createGain();
    noiseG.gain.setValueAtTime(v * 0.28, t);
    noiseG.gain.exponentialRampToValueAtTime(0.001, t + 0.018);

    var lp = _ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 160; lp.Q.value = 0.4;

    body.connect(bodyG);     bodyG.connect(lp);
    punch.connect(punchG);   punchG.connect(lp);
    click.connect(clickG);   clickG.connect(_master);
    noiseS.connect(noiseG);  noiseG.connect(_master);
    lp.connect(_master);

    body.start(t);  body.stop(t + cfg.decay + 0.05);
    punch.start(t); punch.stop(t + 0.04);
    click.start(t); click.stop(t + 0.012);
    noiseS.start(t); noiseS.stop(t + 0.015);

    // Sidechain pump
    if (_padGain) {
      _padGain.gain.setValueAtTime(0.55, t);
      _padGain.gain.setTargetAtTime(1.0, t + 0.012, 0.14);
    }
  }

  function _snare(t, vel) {
    if (_playStem('snare', t, vel)) return;
    if (vel < 0.04) return;
    var cfg = _style.snare;
    var v   = Math.min(1, vel * 0.80 + _pink()*0.05);

    var nLen = Math.floor(_ctx.sampleRate * 0.18);
    var nBuf = _ctx.createBuffer(1, nLen, _ctx.sampleRate);
    var nd   = nBuf.getChannelData(0);
    for (var i = 0; i < nLen; i++) nd[i] = (Math.random()*2-1);
    var noiseS = _ctx.createBufferSource(); noiseS.buffer = nBuf;

    var tone = _ctx.createOscillator(); tone.type = 'triangle';
    tone.frequency.value = cfg.toneHz;
    var toneG = _ctx.createGain();
    toneG.gain.setValueAtTime(v * 0.26, t);
    toneG.gain.exponentialRampToValueAtTime(0.001, t + cfg.toneDecay);

    var hp = _ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1100; hp.Q.value = 0.7;
    var bp = _ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3200; bp.Q.value = 0.8;
    var env = _ctx.createGain();
    env.gain.setValueAtTime(v * 0.65, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.10);

    noiseS.connect(hp); hp.connect(bp); bp.connect(env);
    tone.connect(toneG);
    env.connect(_master); toneG.connect(_master);
    if (_reverbSend) {
      var rs = _ctx.createGain(); rs.gain.value = 0.20;
      env.connect(rs); rs.connect(_reverbSend);
    }
    noiseS.start(t); noiseS.stop(t + 0.20);
    tone.start(t);   tone.stop(t + cfg.toneDecay + 0.02);
  }

  // Bright clap layer — layered with snare for modern crack
  function _clap(t, vel) {
    if (vel < 0.04) return;
    var v   = vel * 0.48;
    var nLen = Math.floor(_ctx.sampleRate * 0.014);
    var nBuf = _ctx.createBuffer(1, nLen, _ctx.sampleRate);
    var nd   = nBuf.getChannelData(0);
    for (var i = 0; i < nLen; i++) nd[i] = (Math.random()*2-1) * (1 - i/nLen);
    var noiseS = _ctx.createBufferSource(); noiseS.buffer = nBuf;
    var hp = _ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 4500; hp.Q.value = 0.5;
    var env = _ctx.createGain();
    env.gain.setValueAtTime(v, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.016);
    noiseS.connect(hp); hp.connect(env); env.connect(_master);
    noiseS.start(t); noiseS.stop(t + 0.018);
  }

  function _hihat(t, vel, open) {
    if (_playStem(open ? 'hihatOpen' : 'hihat', t, vel)) return;
    var dur = open ? 0.08 : 0.018;
    var v   = Math.max(0.05, Math.min(1, vel + _pink()*0.03));
    var nLen = Math.floor(_ctx.sampleRate * 0.10);
    var nBuf = _ctx.createBuffer(1, nLen, _ctx.sampleRate);
    var nd   = nBuf.getChannelData(0);
    for (var i = 0; i < nLen; i++) nd[i] = (Math.random()*2-1);
    var noiseS = _ctx.createBufferSource(); noiseS.buffer = nBuf;
    var hp = _ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7500; hp.Q.value = 0.3;
    var env = _ctx.createGain();
    env.gain.setValueAtTime(v, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + dur);
    noiseS.connect(hp); hp.connect(env); env.connect(_master);
    noiseS.start(t); noiseS.stop(t + 0.12);
  }

  // ── PAD LAYER ────────────────────────────────────────────────────────────

  function _buildPad() {
    // Clean up any existing oscillators
    for (var i = 0; i < _padOscs.length; i++) {
      try { _padOscs[i].osc.stop(); _padOscs[i].osc.disconnect(); _padOscs[i].g.disconnect(); } catch(e) {}
    }
    _padOscs = [];
    if (_padGain) { try { _padGain.disconnect(); } catch(e) {} }

    _padGain = _ctx.createGain(); _padGain.gain.value = 0;
    var lp = _ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = _style.padLP; lp.Q.value = 0.3;
    _padGain.connect(lp); lp.connect(_master);
    if (_reverbSend) {
      var rs = _ctx.createGain(); rs.gain.value = 0.58;
      lp.connect(rs); rs.connect(_reverbSend);
    }

    var ch = Environ.chord(0, 0);
    for (var ci = 0; ci < 3; ci++) {
      var hz = Environ.midiToHz(ch[ci] + 12);
      for (var d = 0; d < 2; d++) {
        var osc = _ctx.createOscillator(); osc.type = 'sawtooth';
        osc.frequency.value = hz;
        osc.detune.value = (d === 0) ? -_style.padDetune : _style.padDetune;
        var g = _ctx.createGain(); g.gain.value = 0.10;
        osc.connect(g); g.connect(_padGain); osc.start();
        _padOscs.push({ osc: osc, g: g });
      }
    }
  }

  function _updatePad(bar, mult) {
    var target = Environ.energy * _style.padGain * mult;
    _padGain.gain.setTargetAtTime(target, _ctx.currentTime, 0.65);
    var ch  = Environ.chord(bar, 0);
    var idx = 0;
    for (var ci = 0; ci < 3; ci++) {
      var hz = Environ.midiToHz(ch[ci] + 12);
      if (_padOscs[idx])   _padOscs[idx].osc.frequency.setTargetAtTime(hz, _ctx.currentTime, 0.30);
      if (_padOscs[idx+1]) _padOscs[idx+1].osc.frequency.setTargetAtTime(hz, _ctx.currentTime, 0.30);
      idx += 2;
    }
  }

  // ── BASS LAYER ───────────────────────────────────────────────────────────

  function _buildBass() {
    if (_bassOsc) { try { _bassOsc.stop(); } catch(e) {} }
    if (_bassGain) { try { _bassGain.disconnect(); } catch(e) {} }

    _bassGain = _ctx.createGain(); _bassGain.gain.value = 0;
    var lp = _ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = _style.bassLP; lp.Q.value = 0.5;
    _bassGain.connect(lp); lp.connect(_master);
    if (_reverbSend) {
      var rs = _ctx.createGain(); rs.gain.value = 0.06;
      lp.connect(rs); rs.connect(_reverbSend);
    }

    _bassOsc = _ctx.createOscillator();
    _bassOsc.type = _style.is808 ? 'sine' : 'triangle';
    _bassOsc.frequency.value = 55;

    _bassSub = _ctx.createOscillator(); _bassSub.type = 'sine'; _bassSub.frequency.value = 55;
    var subG = _ctx.createGain(); subG.gain.value = _style.bassSubGain;
    _bassSub.connect(subG); subG.connect(_bassGain);

    var envG = _ctx.createGain(); envG.gain.value = 0.50;
    _bassOsc.connect(envG); envG.connect(_bassGain);

    _bassOsc.start(); _bassSub.start();
    _lastBassHz = 0;
  }

  function _playBass(t, midiNote, vel) {
    if (_playStem('bass', t, vel)) return;
    if (!_bassOsc || !_bassGain) return;

    var hz     = Environ.midiToHz(midiNote);
    var prevHz = _lastBassHz > 0 ? _lastBassHz : hz;
    _lastBassHz = hz;
    var semis  = Math.abs(Math.log2(hz / prevHz) * 12);
    var glide  = semis < 5 ? 0.04 : 0.001;

    if (_style.is808) {
      // 808: start 3 octaves up, sweep down over decay time
      _bassOsc.frequency.setValueAtTime(hz * 8, t);
      _bassOsc.frequency.exponentialRampToValueAtTime(hz, t + _style.kick.decay * 0.7);
      if (_bassSub) { _bassSub.frequency.setValueAtTime(hz * 8, t); _bassSub.frequency.exponentialRampToValueAtTime(hz, t + _style.kick.decay * 0.7); }
    } else {
      _bassOsc.frequency.setTargetAtTime(hz, t, glide);
      if (_bassSub) _bassSub.frequency.setTargetAtTime(hz, t, glide);
    }

    var v = Math.min(0.88, vel * 0.72 + _pink()*0.04);
    _bassGain.gain.setValueAtTime(v, t);
    _bassGain.gain.setTargetAtTime(v * 0.38, t + 0.02, 0.10);
    _bassGain.gain.setTargetAtTime(0.04, t + 0.12, 0.22);
  }

  // ── MELODY LAYER ─────────────────────────────────────────────────────────

  function _playMelody(t, scaleIndex, vel, dur) {
    var sc  = Environ.scale(1);
    var idx = Math.max(0, Math.min(sc.length - 1, scaleIndex));
    var hz  = Environ.midiToHz(sc[idx]);
    var v   = Math.min(0.85, vel + _pink()*0.03);

    var osc = _ctx.createOscillator();
    osc.type = (Environ.mode === 'major' || Environ.mode === 'lydian') ? 'triangle' : 'sawtooth';
    osc.frequency.value = hz;

    var vib  = _ctx.createOscillator(); vib.type = 'sine'; vib.frequency.value = 5.5;
    var vibG = _ctx.createGain(); vibG.gain.value = hz * 0.003;
    vib.connect(vibG); vibG.connect(osc.frequency);

    var lp = _ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200; lp.Q.value = 0.4;
    var env = _ctx.createGain();
    env.gain.setValueAtTime(0.001, t);
    env.gain.linearRampToValueAtTime(v * 0.52, t + 0.018);
    env.gain.setTargetAtTime(v * 0.30, t + 0.05, dur * 0.4);
    env.gain.linearRampToValueAtTime(0.001, t + dur * 0.88);

    osc.connect(lp); lp.connect(env); env.connect(_master);
    if (_reverbSend) {
      var rs = _ctx.createGain(); rs.gain.value = 0.48;
      env.connect(rs); rs.connect(_reverbSend);
    }
    osc.start(t); osc.stop(t + dur + 0.1);
    vib.start(t); vib.stop(t + dur + 0.1);
  }

  // ── REVERB ───────────────────────────────────────────────────────────────

  function _buildReverb() {
    var envMod  = 0.55 + Environ.reverbDepth * 0.9;   // humidity → longer reverb
    var decSec  = Math.min(6.5, _style.reverbSec * envMod);
    var sr      = _ctx.sampleRate;
    var len     = Math.floor(sr * decSec);
    var fadeIn  = Math.floor(0.03 * sr);
    var buf     = _ctx.createBuffer(2, len, sr);
    for (var ch = 0; ch < 2; ch++) {
      var d = buf.getChannelData(ch);
      for (var j = 0; j < len; j++) {
        d[j] = (Math.random()*2-1) * Math.pow(1 - j/len, 2.2) * Math.min(1, j/fadeIn);
      }
    }
    var conv = _ctx.createConvolver(); conv.buffer = buf;
    _reverbSend = _ctx.createGain(); _reverbSend.gain.value = 0.28;
    _reverbGain = _ctx.createGain(); _reverbGain.gain.value = Environ.reverbDepth;
    var rvHP = _ctx.createBiquadFilter(); rvHP.type = 'highpass'; rvHP.frequency.value = 120;
    var rvLP = _ctx.createBiquadFilter(); rvLP.type = 'lowpass';  rvLP.frequency.value = 4200;
    _reverbSend.connect(conv); conv.connect(rvHP); rvHP.connect(rvLP);
    rvLP.connect(_reverbGain); _reverbGain.connect(_master);
  }

  // ── VINYL NOISE (lo-fi style) ─────────────────────────────────────────────

  function _buildVinyl() {
    if (!_style.vinyl) return;
    var nLen = _ctx.sampleRate * 4;
    var nBuf = _ctx.createBuffer(1, nLen, _ctx.sampleRate);
    var d    = nBuf.getChannelData(0);
    for (var i = 0; i < nLen; i++) d[i] = Math.random()*2-1;
    _vinylSrc = _ctx.createBufferSource();
    _vinylSrc.buffer = nBuf; _vinylSrc.loop = true;
    var hp = _ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 300;
    var lp = _ctx.createBiquadFilter(); lp.type = 'lowpass';  lp.frequency.value = 3200;
    var g  = _ctx.createGain(); g.gain.value = 0.011;
    _vinylSrc.connect(hp); hp.connect(lp); lp.connect(g); g.connect(_master);
    _vinylSrc.start();
  }

  // ── BEAT SCHEDULER ───────────────────────────────────────────────────────

  var LOOKAHEAD   = 0.10;
  var SCHEDULE_MS = 22;

  // 16th-note hihat velocity map (strong on downbeats, ghost on 16ths)
  var HAT_VELS = [0.68,0.12,0.36,0.10, 0.58,0.10,0.36,0.12,
                  0.68,0.12,0.36,0.10, 0.54,0.10,0.38,0.15];

  function _schedule() {
    if (!_ctx || !_running) return;

    var beat16th  = 60 / (_bpm * 4);
    var totalBars = Math.floor(_beat / 16);
    _section      = _getSection(totalBars);
    var sec       = _section;

    var drumVel   = SECTION_DRUM[sec] * (_style.sparse ? 0.32 : 1.0);
    var padMult   = SECTION_PAD[sec];
    var doSnare   = SECTION_SNARE[sec] && !(_style.sparse && sec !== 'chorus');

    while (_nextBeat < _ctx.currentTime + LOOKAHEAD) {
      var b   = _beat % 16;
      var bar = Math.floor(_beat / 16) % 4;

      // Swing: delay odd 16ths by style.swing fraction
      var swingOff = (b % 2 === 1) ? beat16th * _style.swing : 0;
      var t        = _nextBeat + swingOff;

      // ── DRUMS ────────────────────────────────────────────────────────
      if (drumVel > 0) {
        // Kick — beats 1 and 3 (16ths 0 and 8)
        if (b === 0) _kick(t, _style.kick.vel * drumVel + _pink()*0.05);
        if (b === 8) _kick(t, _style.kick.vel * drumVel * 0.84 + _pink()*0.05);

        // Snare + optional clap — beats 2 and 4
        if (doSnare) {
          var sv = _style.snare.vel * drumVel;
          if (b === 4)  { _snare(t, sv + _pink()*0.05); if (_style.snare.hasClap) _clap(t, sv * 0.78); }
          if (b === 12) { _snare(t, sv * 0.95 + _pink()*0.05); if (_style.snare.hasClap) _clap(t, sv * 0.72); }
          // Ghost snare
          if (b === 14 && Math.random() < 0.32) _snare(t, sv * 0.30 + _pink()*0.04);
        }

        // 16th-note hihats
        var hv = _style.hatVel;
        _hihat(t, Math.max(0.05, HAT_VELS[b] * hv + _pink()*0.04), b === 10);

        // Trap hat roll — builds into chorus
        if (_style.hasTrap && sec === 'chorus' && bar === 3 && b === 13) {
          for (var ri = 0; ri < 4; ri++) {
            _hihat(t + ri * beat16th * 0.5, hv * 0.28 + ri * 0.04, false);
          }
        }
      }

      // ── BASS ─────────────────────────────────────────────────────────
      // Bass plays from build onward (not in pure intro silence)
      if (sec !== 'intro') {
        if (b === 0) {
          var bc0 = Environ.chord(bar, -1);
          _playBass(t, bc0[0], 0.84 + _pink()*0.04);
        }
        if (b === 6 && Math.random() < 0.42) {
          var bc6 = Environ.chord(bar, -1);
          _playBass(t, bc6[0], 0.52 + _pink()*0.04);
        }
        if (b === 8 && sec !== 'drop') {
          var bc8 = Environ.chord(bar, -1);
          _playBass(t, Math.random() < 0.55 ? bc8[0] : bc8[2], 0.64 + _pink()*0.04);
        }
        if (b === 10 && Math.random() < 0.30 && sec !== 'drop') {
          var bc10 = Environ.chord(bar, -1);
          _playBass(t, bc10[1], 0.40 + _pink()*0.03);
        }
        // Pickup: last 16th of last bar anticipates bar 1
        if (b === 14 && bar === 3 && Math.random() < 0.45) {
          var bc14 = Environ.chord(0, -1);
          _playBass(t, bc14[0], 0.48 + _pink()*0.03);
        }
      }

      // ── PAD ──────────────────────────────────────────────────────────
      if (b === 0) _updatePad(bar, padMult);

      // ── MELODY ───────────────────────────────────────────────────────
      var timeSinceActive = _ctx.currentTime - _lastMelodyCtxTime;
      var doAutoFill      = timeSinceActive > 3.5 && sec !== 'intro' && sec !== 'build';

      if (b === 0) {
        _fillNotes = _style.fills[totalBars % _style.fills.length];
        _fillPos   = 0;
      }

      if (b % 4 === 0) {
        if (_melodyActive) {
          _playMelody(t, _melodyDegree, _melodyVel, beat16th * 3.5);
        } else if (doAutoFill) {
          var deg = _fillNotes[_fillPos % _fillNotes.length];
          if (deg >= 0) _playMelody(t, deg, 0.35 + _pink()*0.05, beat16th * 3.5);
          _fillPos++;
        }
      }

      _beat++;
      _nextBeat += beat16th + _pink() * beat16th * 0.004;
    }

    _timerID = setTimeout(_schedule, SCHEDULE_MS);
  }

  // ── PUBLIC ───────────────────────────────────────────────────────────────

  function init(audioCtx, masterGain, styleConfig) {
    _ctx    = audioCtx;
    _master = masterGain;
    _style  = styleConfig || Styles.get('lofi');

    // Clamp env BPM to style's range
    var envBpm = Environ.bpm;
    _bpm = Math.max(_style.bpmRange[0], Math.min(_style.bpmRange[1], envBpm));

    _buildReverb();
    _buildPad();
    _buildBass();
    _buildVinyl();

    _nextBeat = _ctx.currentTime + 0.1;
    _beat     = 0;
    _running  = true;
    _schedule();
  }

  function stop() {
    _running = false;
    clearTimeout(_timerID);
    if (_padGain)  { try { _padGain.gain.setTargetAtTime(0, _ctx.currentTime, 0.4); } catch(e) {} }
    if (_bassOsc)  { try { _bassOsc.stop(_ctx.currentTime + 0.8); } catch(e) {} }
    if (_bassSub)  { try { _bassSub.stop(_ctx.currentTime + 0.8); } catch(e) {} }
    if (_vinylSrc) { try { _vinylSrc.stop(); } catch(e) {} _vinylSrc = null; }
    _padGain = null; _padOscs = [];
    _bassOsc = null; _bassSub = null; _bassGain = null;
    _reverbSend = null; _reverbGain = null;
  }

  function updateHuman(gamma, beta, energy, active) {
    var tilt = Math.max(-1, Math.min(1, (gamma || 0) / 45));
    _melodyDegree = Math.round((tilt + 1) / 2 * 6);
    _melodyVel    = Math.min(0.9, 0.4 + energy * 0.45);
    _melodyActive = active || Math.abs(gamma || 0) > 6;
    if (_melodyActive && _ctx) _lastMelodyCtxTime = _ctx.currentTime;
  }

  function updateTouch(normX, normY, active) {
    if (active) {
      _melodyDegree = Math.round(normX * 6);
      _melodyVel    = 0.62;
      _melodyActive = true;
      if (_ctx) _lastMelodyCtxTime = _ctx.currentTime;
    } else {
      _melodyActive = false;
    }
  }

  // Load an AudioBuffer to replace a synthesis layer.
  // name: 'kick' | 'snare' | 'hihat' | 'hihatOpen' | 'bass' | 'chords'
  function setStem(name, audioBuffer) {
    _stems[name] = audioBuffer;
  }

  function setBPM(bpm) {
    _bpm = Math.max(40, Math.min(200, bpm));
  }

  return Object.freeze({
    init: init, stop: stop,
    updateHuman: updateHuman, updateTouch: updateTouch,
    setStem: setStem, setBPM: setBPM,
    get isRunning() { return _running; },
    get beat()      { return _beat % 16; },
    get bar()       { return Math.floor(_beat / 16) % 4; },
    get section()   { return _section; },
    get bpm()       { return _bpm; },
  });
})();
