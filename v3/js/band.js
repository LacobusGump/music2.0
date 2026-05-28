/**
 * BAND — The Environment's Groove Machine
 *
 * Environment drives the harmony. Human drives the melody. Band drives the groove.
 *
 * Drums: kick / snare+clap / 16th-note hihats with velocity dynamics
 * Bass: triangle + sub-sine, portamento, syncopated pattern
 * Pad: detuned sawtooth chord, sidechain-pumped, fades in after intro
 * Melody: human tilt/touch or auto-fill chord arpeggios
 */

const Band = (function () {
  'use strict';

  // ── STATE ────────────────────────────────────────────────────────────────

  var _ctx    = null;
  var _master = null;

  var _running  = false;
  var _nextBeat = 0;
  var _beat     = 0;      // absolute 16th-note counter, never resets
  var _timerID  = null;
  var _bpm      = 90;

  // 1/f humanization (Voss-McCartney)
  var _pk = { b0:0,b1:0,b2:0,b3:0,b4:0,b5:0,b6:0 };
  function _pink() {
    var w = Math.random()*2-1;
    _pk.b0=0.99886*_pk.b0+w*0.0555179; _pk.b1=0.99332*_pk.b1+w*0.0750759;
    _pk.b2=0.96900*_pk.b2+w*0.1538520; _pk.b3=0.86650*_pk.b3+w*0.3104856;
    _pk.b4=0.55000*_pk.b4+w*0.5329522; _pk.b5=-0.7616*_pk.b5-w*0.0168980;
    var out=(_pk.b0+_pk.b1+_pk.b2+_pk.b3+_pk.b4+_pk.b5+_pk.b6+w*0.5362)*0.11;
    _pk.b6=w*0.115926; return out;
  }

  // Melody / human input
  var _melodyDegree       = 3;
  var _melodyActive       = false;
  var _melodyVel          = 0.5;
  var _lastMelodyCtxTime  = 0;   // AudioContext time of last active human input

  // Auto-fill phrases (play when human is idle > 3 s)
  var _fillPatterns = [
    [0, 2, 4, 2],   // arpeggio up
    [4, 3, 2, 0],   // descending
    [0, -1, 4, 2],  // root, rest, reach
    [2, 4, 5, 4],   // upper territory
    [3, 2, 0, -1],  // falling, rest
    [0, 2, 0, 4],   // root rocking
    [4, 6, 4, 2],   // high turn
    [1, 2, 4, 2],   // 2nd-degree reach
  ];
  var _autoFillNotes = [0,2,4,2];
  var _autoFillPos   = 0;

  // Reverb
  var _reverbSend = null;
  var _reverbGain = null;

  // Pad
  var _padOscs = [];
  var _padGain = null;

  // Bass
  var _bassOsc  = null;
  var _bassSub  = null;
  var _bassEnv  = null;
  var _bassGain = null;
  var _lastBassHz = 0;

  // ── DRUM SYNTHESIS ───────────────────────────────────────────────────────

  function _kick(t, vel) {
    var v = Math.min(1, vel + _pink()*0.05);

    // 808 body
    var body = _ctx.createOscillator();
    body.type = 'sine';
    body.frequency.setValueAtTime(62, t);
    body.frequency.exponentialRampToValueAtTime(22, t+0.075);
    var bodyEnv = _ctx.createGain();
    bodyEnv.gain.setValueAtTime(v*0.82, t);
    bodyEnv.gain.exponentialRampToValueAtTime(0.001, t+0.30);

    // Punch transient (attack weight)
    var punch = _ctx.createOscillator();
    punch.type = 'sine';
    punch.frequency.setValueAtTime(130, t);
    punch.frequency.exponentialRampToValueAtTime(58, t+0.022);
    var punchEnv = _ctx.createGain();
    punchEnv.gain.setValueAtTime(v*0.48, t);
    punchEnv.gain.exponentialRampToValueAtTime(0.001, t+0.032);

    // Click
    var click = _ctx.createOscillator();
    click.type = 'sine';
    click.frequency.setValueAtTime(220, t);
    click.frequency.exponentialRampToValueAtTime(80, t+0.007);
    var clickEnv = _ctx.createGain();
    clickEnv.gain.setValueAtTime(v*0.38, t);
    clickEnv.gain.exponentialRampToValueAtTime(0.001, t+0.010);

    // Noise burst
    var nLen = Math.floor(_ctx.sampleRate*0.012);
    var nBuf = _ctx.createBuffer(1,nLen,_ctx.sampleRate);
    var nd = nBuf.getChannelData(0);
    for (var i=0;i<nLen;i++) nd[i]=(Math.random()*2-1)*Math.pow(1-i/nLen,2);
    var noise = _ctx.createBufferSource(); noise.buffer=nBuf;
    var noiseEnv = _ctx.createGain();
    noiseEnv.gain.setValueAtTime(v*0.28, t);
    noiseEnv.gain.exponentialRampToValueAtTime(0.001, t+0.018);

    var lp = _ctx.createBiquadFilter();
    lp.type='lowpass'; lp.frequency.value=160; lp.Q.value=0.4;

    body.connect(bodyEnv);   bodyEnv.connect(lp);
    punch.connect(punchEnv); punchEnv.connect(lp);
    click.connect(clickEnv); clickEnv.connect(_master);
    noise.connect(noiseEnv); noiseEnv.connect(_master);
    lp.connect(_master);

    body.start(t);  body.stop(t+0.33);
    punch.start(t); punch.stop(t+0.04);
    click.start(t); click.stop(t+0.012);
    noise.start(t); noise.stop(t+0.015);

    // Sidechain pump (subtle)
    if (_padGain) {
      _padGain.gain.setValueAtTime(0.58, t);
      _padGain.gain.setTargetAtTime(1.0, t+0.012, 0.12);
    }
  }

  function _snare(t, vel) {
    var v = Math.min(1, vel*0.80 + _pink()*0.06);

    // Noise body
    var nLen = Math.floor(_ctx.sampleRate*0.18);
    var nBuf = _ctx.createBuffer(1,nLen,_ctx.sampleRate);
    var nd = nBuf.getChannelData(0);
    for (var i=0;i<nLen;i++) nd[i]=(Math.random()*2-1);
    var noise = _ctx.createBufferSource(); noise.buffer=nBuf;

    // Tone
    var tone = _ctx.createOscillator();
    tone.type='triangle'; tone.frequency.value=200;
    var toneEnv = _ctx.createGain();
    toneEnv.gain.setValueAtTime(v*0.26, t);
    toneEnv.gain.exponentialRampToValueAtTime(0.001, t+0.045);

    var hp = _ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=1100; hp.Q.value=0.7;
    var bp = _ctx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=3200; bp.Q.value=0.8;

    var env = _ctx.createGain();
    env.gain.setValueAtTime(v*0.65, t);
    env.gain.exponentialRampToValueAtTime(0.001, t+0.10);

    noise.connect(hp); hp.connect(bp); bp.connect(env);
    tone.connect(toneEnv);
    env.connect(_master); toneEnv.connect(_master);
    if (_reverbSend) {
      var rs=_ctx.createGain(); rs.gain.value=0.22;
      env.connect(rs); rs.connect(_reverbSend);
    }
    noise.start(t); noise.stop(t+0.20);
    tone.start(t);  tone.stop(t+0.06);
  }

  // Bright clap — layered with snare for modern crack
  function _clap(t, vel) {
    var v = vel*0.50;
    var nLen = Math.floor(_ctx.sampleRate*0.014);
    var nBuf = _ctx.createBuffer(1,nLen,_ctx.sampleRate);
    var nd = nBuf.getChannelData(0);
    for (var i=0;i<nLen;i++) nd[i]=(Math.random()*2-1)*(1-i/nLen);
    var noise = _ctx.createBufferSource(); noise.buffer=nBuf;

    var hp = _ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=4500; hp.Q.value=0.5;
    var env = _ctx.createGain();
    env.gain.setValueAtTime(v, t);
    env.gain.exponentialRampToValueAtTime(0.001, t+0.016);

    noise.connect(hp); hp.connect(env); env.connect(_master);
    noise.start(t); noise.stop(t+0.018);
  }

  function _hihat(t, vel, open) {
    var dur = open ? 0.08 : 0.018;
    var v   = Math.max(0.06, Math.min(1, vel + _pink()*0.03));

    var nLen = Math.floor(_ctx.sampleRate*0.1);
    var nBuf = _ctx.createBuffer(1,nLen,_ctx.sampleRate);
    var nd = nBuf.getChannelData(0);
    for (var i=0;i<nLen;i++) nd[i]=(Math.random()*2-1);
    var noise = _ctx.createBufferSource(); noise.buffer=nBuf;

    var hp = _ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=7500; hp.Q.value=0.3;
    var env = _ctx.createGain();
    env.gain.setValueAtTime(v, t);
    env.gain.exponentialRampToValueAtTime(0.001, t+dur);

    noise.connect(hp); hp.connect(env); env.connect(_master);
    noise.start(t); noise.stop(t+0.12);
  }

  // ── PAD LAYER ────────────────────────────────────────────────────────────

  function _buildPad() {
    if (!_ctx) return;
    for (var i=0;i<_padOscs.length;i++) {
      try { _padOscs[i].osc.stop(); } catch(e) {}
      try { _padOscs[i].osc.disconnect(); _padOscs[i].g.disconnect(); } catch(e) {}
    }
    _padOscs=[];

    if (!_padGain) {
      _padGain=_ctx.createGain(); _padGain.gain.value=0;
      var lp=_ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=1400; lp.Q.value=0.3;
      _padGain.connect(lp); lp.connect(_master);
      if (_reverbSend) {
        var rs=_ctx.createGain(); rs.gain.value=0.55;
        lp.connect(rs); rs.connect(_reverbSend);
      }
    }

    var ch=Environ.chord(0,0);
    for (var ci=0;ci<3;ci++) {
      var hz=Environ.midiToHz(ch[ci]+12);
      for (var d=0;d<2;d++) {
        var osc=_ctx.createOscillator(); osc.type='sawtooth';
        osc.frequency.value=hz; osc.detune.value=(d===0)?-9:9;
        var g=_ctx.createGain(); g.gain.value=0.11;
        osc.connect(g); g.connect(_padGain); osc.start();
        _padOscs.push({osc:osc,g:g});
      }
    }
  }

  function _updatePad(bar, mult) {
    var target=Environ.energy*0.30*mult;
    _padGain.gain.setTargetAtTime(target, _ctx.currentTime, 0.6);
    var ch=Environ.chord(bar,0);
    var idx=0;
    for (var ci=0;ci<3;ci++) {
      var hz=Environ.midiToHz(ch[ci]+12);
      if (_padOscs[idx])   _padOscs[idx].osc.frequency.setTargetAtTime(hz,_ctx.currentTime,0.3);
      if (_padOscs[idx+1]) _padOscs[idx+1].osc.frequency.setTargetAtTime(hz,_ctx.currentTime,0.3);
      idx+=2;
    }
  }

  // ── BASS LAYER ───────────────────────────────────────────────────────────

  function _buildBass() {
    if (!_ctx) return;
    if (_bassOsc) { try { _bassOsc.stop(); } catch(e) {} }

    _bassGain=_ctx.createGain(); _bassGain.gain.value=0;
    var lp=_ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=400; lp.Q.value=0.5;
    _bassGain.connect(lp); lp.connect(_master);
    if (_reverbSend) {
      var rs=_ctx.createGain(); rs.gain.value=0.06;
      lp.connect(rs); rs.connect(_reverbSend);
    }

    _bassOsc=_ctx.createOscillator(); _bassOsc.type='triangle'; _bassOsc.frequency.value=55;
    _bassSub=_ctx.createOscillator(); _bassSub.type='sine';     _bassSub.frequency.value=55;
    var subG=_ctx.createGain(); subG.gain.value=0.55;
    _bassSub.connect(subG); subG.connect(_bassGain);
    _bassEnv=_ctx.createGain(); _bassEnv.gain.value=0.5;
    _bassOsc.connect(_bassEnv); _bassEnv.connect(_bassGain);
    _bassOsc.start(); _bassSub.start();
  }

  function _playBass(t, midiNote, vel) {
    if (!_bassOsc||!_bassGain) return;
    var hz=Environ.midiToHz(midiNote);   // play at the register given (octave -1 = bass range)
    var prevHz=_lastBassHz>0?_lastBassHz:hz; _lastBassHz=hz;
    var semis=Math.abs(Math.log2(hz/prevHz)*12);
    var glide=semis<5?0.04:0;
    _bassOsc.frequency.setTargetAtTime(hz, t, glide||0.001);
    if (_bassSub) _bassSub.frequency.setTargetAtTime(hz, t, glide||0.001);
    var v=Math.min(0.88, vel*0.72+_pink()*0.04);
    _bassGain.gain.setValueAtTime(v, t);
    _bassGain.gain.setTargetAtTime(v*0.4, t+0.02, 0.10);
    _bassGain.gain.setTargetAtTime(0.04, t+0.12, 0.22);
  }

  // ── MELODY LAYER ─────────────────────────────────────────────────────────

  function _playMelody(t, scaleIndex, vel, dur) {
    var sc=Environ.scale(1);
    var idx=Math.max(0,Math.min(sc.length-1,scaleIndex));
    var hz=Environ.midiToHz(sc[idx]);
    var v=Math.min(0.85, vel+_pink()*0.03);

    var osc=_ctx.createOscillator();
    osc.type=(Environ.mode==='major'||Environ.mode==='lydian')?'triangle':'sawtooth';
    osc.frequency.value=hz;

    var vib=_ctx.createOscillator(); vib.type='sine'; vib.frequency.value=5.5;
    var vibG=_ctx.createGain(); vibG.gain.value=hz*0.003;
    vib.connect(vibG); vibG.connect(osc.frequency);

    var lp=_ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=3200; lp.Q.value=0.4;
    var env=_ctx.createGain();
    env.gain.setValueAtTime(0.001, t);
    env.gain.linearRampToValueAtTime(v*0.52, t+0.018);
    env.gain.setTargetAtTime(v*0.30, t+0.05, dur*0.4);
    env.gain.linearRampToValueAtTime(0.001, t+dur*0.85);

    osc.connect(lp); lp.connect(env); env.connect(_master);
    if (_reverbSend) {
      var rs=_ctx.createGain(); rs.gain.value=0.45;
      env.connect(rs); rs.connect(_reverbSend);
    }
    osc.start(t); osc.stop(t+dur+0.1);
    vib.start(t); vib.stop(t+dur+0.1);
  }

  // ── BEAT SCHEDULER ───────────────────────────────────────────────────────

  var LOOKAHEAD   = 0.10;
  var SCHEDULE_MS = 22;

  // 16th-note hihat velocity map (strong on downbeats, ghost on 16ths)
  var HAT_VELS = [0.68,0.13,0.36,0.11, 0.58,0.11,0.36,0.13,
                  0.68,0.13,0.36,0.11, 0.54,0.11,0.38,0.16];

  function _schedule() {
    if (!_ctx||!_running) return;

    var beat16th = 60/(_bpm*4);

    while (_nextBeat < _ctx.currentTime+LOOKAHEAD) {
      var t         = _nextBeat;
      var b         = _beat%16;
      var bar       = Math.floor(_beat/16)%4;
      var totalBars = Math.floor(_beat/16);

      // ── DRUMS ────────────────────────────────────────────────────────
      if (b===0) _kick(t, 0.86+_pink()*0.07);
      if (b===8) _kick(t, 0.72+_pink()*0.07);

      if (b===4)  { _snare(t,0.74+_pink()*0.05); _clap(t,0.56); }
      if (b===12) { _snare(t,0.70+_pink()*0.05); _clap(t,0.50); }

      if (b===14&&Math.random()<0.35) _snare(t,0.28+_pink()*0.04);  // ghost

      // 16th-note hihats
      _hihat(t, Math.max(0.07, HAT_VELS[b]+_pink()*0.05), b===10);

      // ── BASS ─────────────────────────────────────────────────────────
      if (b===0) {
        var bc0=Environ.chord(bar,-1);
        _playBass(t, bc0[0], 0.84+_pink()*0.05);
      }
      if (b===6&&Math.random()<0.45) {
        var bc6=Environ.chord(bar,-1);
        _playBass(t, bc6[0], 0.54+_pink()*0.05);
      }
      if (b===8) {
        var bc8=Environ.chord(bar,-1);
        _playBass(t, Math.random()<0.55?bc8[0]:bc8[2], 0.64+_pink()*0.05);
      }
      if (b===10&&Math.random()<0.35) {
        var bc10=Environ.chord(bar,-1);
        _playBass(t, bc10[1], 0.42+_pink()*0.04);
      }
      if (b===14&&bar===3&&Math.random()<0.50) {
        var bc14=Environ.chord(0,-1);  // anticipate bar 0
        _playBass(t, bc14[0], 0.52+_pink()*0.04);
      }

      // ── PAD ──────────────────────────────────────────────────────────
      if (b===0) {
        // Intro: 4 bars of drums+bass only, then pad fades in
        var padMult = totalBars<4 ? 0 : Math.min(1,(totalBars-4)/4);
        _updatePad(bar, padMult);
      }

      // ── MELODY ───────────────────────────────────────────────────────
      var timeSinceActive = _ctx.currentTime - _lastMelodyCtxTime;
      var autoFill = timeSinceActive>3.5 && totalBars>=4;

      if (b===0) {
        _autoFillNotes = _fillPatterns[totalBars % _fillPatterns.length];
        _autoFillPos = 0;
      }

      if (b%4===0) {
        if (_melodyActive) {
          _playMelody(t, _melodyDegree, _melodyVel, beat16th*3.5);
        } else if (autoFill) {
          var deg=_autoFillNotes[_autoFillPos%_autoFillNotes.length];
          if (deg>=0) _playMelody(t, deg, 0.38+_pink()*0.05, beat16th*3.5);
          _autoFillPos++;
        }
      }

      _beat++;
      _nextBeat += beat16th + _pink()*beat16th*0.004;
    }

    _timerID=setTimeout(_schedule, SCHEDULE_MS);
  }

  // ── REVERB ───────────────────────────────────────────────────────────────

  function _buildReverb() {
    var sr=_ctx.sampleRate, len=Math.floor(sr*2.0);
    var buf=_ctx.createBuffer(2,len,sr);
    var fadeIn=Math.floor(0.03*sr);
    for (var ch=0;ch<2;ch++) {
      var d=buf.getChannelData(ch);
      for (var j=0;j<len;j++) {
        d[j]=(Math.random()*2-1)*Math.pow(1-j/len,2.2)*Math.min(1,j/fadeIn);
      }
    }
    var conv=_ctx.createConvolver(); conv.buffer=buf;
    _reverbSend=_ctx.createGain(); _reverbSend.gain.value=0.30;
    _reverbGain=_ctx.createGain(); _reverbGain.gain.value=Environ.reverbDepth;
    var rvHP=_ctx.createBiquadFilter(); rvHP.type='highpass'; rvHP.frequency.value=120;
    var rvLP=_ctx.createBiquadFilter(); rvLP.type='lowpass';  rvLP.frequency.value=4000;
    _reverbSend.connect(conv); conv.connect(rvHP); rvHP.connect(rvLP);
    rvLP.connect(_reverbGain); _reverbGain.connect(_master);
  }

  // ── PUBLIC ───────────────────────────────────────────────────────────────

  function init(audioCtx, masterGain) {
    _ctx    = audioCtx;
    _master = masterGain;
    _buildReverb();
    _buildPad();
    _buildBass();
    _bpm      = Environ.bpm;
    _nextBeat = _ctx.currentTime+0.1;
    _beat     = 0;
    _running  = true;
    _schedule();
  }

  function stop() {
    _running=false; clearTimeout(_timerID);
    if (_padGain) _padGain.gain.setTargetAtTime(0,_ctx.currentTime,0.5);
    if (_bassOsc) { try { _bassOsc.stop(_ctx.currentTime+1); } catch(e) {} }
    if (_bassSub) { try { _bassSub.stop(_ctx.currentTime+1); } catch(e) {} }
  }

  function updateHuman(gamma, beta, energy, active) {
    var tilt=Math.max(-1,Math.min(1,(gamma||0)/45));
    _melodyDegree=Math.round((tilt+1)/2*6);
    _melodyVel=Math.min(0.9, 0.4+energy*0.45);
    _melodyActive=active||Math.abs(gamma||0)>6;
    if (_melodyActive&&_ctx) _lastMelodyCtxTime=_ctx.currentTime;
  }

  function updateTouch(normX, normY, active) {
    if (active) {
      _melodyDegree=Math.round(normX*6);
      _melodyVel=0.62;
      _melodyActive=true;
      if (_ctx) _lastMelodyCtxTime=_ctx.currentTime;
    } else {
      _melodyActive=false;
    }
  }

  function setBPM(bpm) { _bpm=Math.max(60,Math.min(140,bpm)); }

  return Object.freeze({
    init: init, stop: stop,
    updateHuman: updateHuman, updateTouch: updateTouch, setBPM: setBPM,
    get isRunning() { return _running; },
    get beat()     { return _beat%16; },
    get bar()      { return Math.floor(_beat/16)%4; },
  });
})();
