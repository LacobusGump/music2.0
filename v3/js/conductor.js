/**
 * CONDUCTOR — Environ + Style → v1 Engine
 *
 * Bridges GPS/weather/time (Environ) and style choice (Styles) to the
 * v1 engine (Body, Harmony, Sound, Rhythm). Replaces band.js.
 *
 * Key principles from v1:
 * - BETA (front-back tilt) drives melodic pitch. Not gamma.
 *   Natural phone hold ≈ 62°. Center the instrument there.
 * - Water bottle physics: tilt drives "water level", water drives pitch.
 *   Momentum, overshoot, damping. Alive, not mechanical.
 * - Drums are EARNED. They emerge over 30-90s as body proves rhythm.
 * - Silence = music. Stillness = rest. The body decides everything.
 * - Euclidean rhythm (Bjorklund): mathematically perfect groove.
 */

const Conductor = (function () {
  'use strict';

  // ── CONSTANTS ─────────────────────────────────────────────────────────

  var PHASE_LISTENING = 3;   // 3s engaged → phase 1
  var PHASE_ALIVE     = 12;  // 12s engaged → phase 2

  // ── STATE ─────────────────────────────────────────────────────────────

  var _active     = false;
  var _styleId    = 'lofi';
  var _lens       = null;
  var _lastT      = 0;

  // Silence / presence
  var _isSilent       = true;
  var _fadeGain       = 0;
  var _stillnessTimer = 0;

  // Session arc
  var _sessionPhase       = 0;  // 0=listening, 1=alive, 2=full
  var _sessionEngagedTime = 0;

  // Tilt-to-melody
  var _currentDegree = 0;
  var _lastNoteTime  = 0;
  var _pitchWater    = null;   // Body.WaterDynamic for pitch

  // Phrase
  var _phraseActive          = false;
  var _phrasePeakCount       = 0;
  var _phraseStartTime       = 0;
  var _phraseMaxMag          = 0;
  var _phraseEnergyArc       = 0;
  var _phraseCooldown        = 0;
  var _phraseIntensityFactor = 1.0;

  // Call & response
  var _crCooldown    = 0;
  var _answerPending = false;
  var _answerTime    = 0;
  var _answerNotes   = [];
  var _answerIdx     = 0;

  // Prodigy (mix intelligence)
  var _prodigy = {
    energyHistory: new Float32Array(16),
    energyHead:    0,
    sampleTimer:   0,
    arc:           'neutral',
    dynamicRange:  1.0,
    reverbTarget:  0.30,
  };

  var _noteCount  = 0;
  var _errorCount = 0;
  var _touchDuck  = 1.0;


  // ── STYLE → LENS ──────────────────────────────────────────────────────
  //
  // Maps v3 style IDs to v1-compatible lens config objects.
  // Sound.configure(lens) uses palette to wire voices.
  // Rhythm.configure uses rhythm.kit for drum profile.
  // response drives tilt sensitivity and note timing.

  var STYLE_LENS = {
    lofi: {
      pipeline: 'organic',
      palette: {
        continuous: { voice: 'epiano', octave: 0,  decay: 1.8  },
        harmonic:   { voice: 'epiano', octave: -1, decay: 2.2  },
        peak:       { voice: 'piano',  octave: -1, decay: 0.7  },
      },
      response: {
        tiltRange:          50,
        noteInterval:       420,
        melodicEnergy:      0.10,
        melodicMinDelta:    1,
        stillnessThreshold: 0.18,
        stillnessTimeout:   2.5,
        fadeTime:           3.5,
      },
      rhythm:  { kit: 'brushes' },
      space:   { reverbMix: 0.40 },
      motion:  { melodic: 'beta' },
      emotion: { phraseShape: 'arch' },
    },
    rnb: {
      pipeline: 'organic',
      palette: {
        continuous: { voice: 'mono',   octave: 0,  decay: 0.9  },
        harmonic:   { voice: 'epiano', octave: -1, decay: 1.8  },
        peak:       { voice: 'piano',  octave: -1, decay: 0.6  },
      },
      response: {
        tiltRange:          55,
        noteInterval:       320,
        melodicEnergy:      0.12,
        melodicMinDelta:    1,
        stillnessThreshold: 0.20,
        stillnessTimeout:   2.0,
        fadeTime:           2.8,
      },
      rhythm:  { kit: 'acoustic' },
      space:   { reverbMix: 0.28 },
      motion:  { melodic: 'beta' },
      emotion: { phraseShape: 'rise' },
    },
    jazz: {
      pipeline: 'organic',
      palette: {
        continuous: { voice: 'piano',   octave: 0,  decay: 1.2  },
        harmonic:   { voice: 'upright', octave: -1, decay: 1.5  },
        peak:       { voice: 'piano',   octave: -1, decay: 0.5  },
      },
      response: {
        tiltRange:          60,
        noteInterval:       280,
        melodicEnergy:      0.08,
        melodicMinDelta:    1,
        stillnessThreshold: 0.15,
        stillnessTimeout:   2.0,
        fadeTime:           2.2,
      },
      rhythm:  { kit: 'brushes' },
      space:   { reverbMix: 0.22 },
      motion:  { melodic: 'beta' },
      emotion: { phraseShape: 'fall' },
    },
    ambient: {
      pipeline: 'organic',
      palette: {
        continuous: { voice: 'strings', octave: 0,  decay: 3.5, sustained: true },
        harmonic:   { voice: 'strings', octave: -1, decay: 4.0 },
        peak:       { voice: 'strings', octave: -1, decay: 2.5 },
      },
      response: {
        tiltRange:          70,
        noteInterval:       600,
        melodicEnergy:      0.06,
        melodicMinDelta:    2,
        stillnessThreshold: 0.12,
        stillnessTimeout:   3.0,
        fadeTime:           5.0,
      },
      rhythm:  { kit: 'tribal' },
      space:   { reverbMix: 0.65 },
      motion:  { melodic: 'beta' },
      emotion: { phraseShape: 'arch' },
    },
    trap: {
      pipeline: 'organic',
      palette: {
        continuous: { voice: 'mono', octave: 0,  decay: 0.6 },
        harmonic:   { voice: 'mono', octave: -1, decay: 0.9 },
        peak:       { voice: 'stab', octave: -1, decay: 0.4 },
      },
      response: {
        tiltRange:          45,
        noteInterval:       360,
        melodicEnergy:      0.14,
        melodicMinDelta:    1,
        stillnessThreshold: 0.22,
        stillnessTimeout:   2.0,
        fadeTime:           2.5,
      },
      rhythm:  { kit: '808' },
      space:   { reverbMix: 0.35 },
      motion:  { melodic: 'beta' },
      emotion: { phraseShape: 'arch' },
    },
  };


  // ── SILENCE ───────────────────────────────────────────────────────────

  function _updateSilence(dt, now) {
    var mag  = Body.energy;
    var resp = _lens.response;

    if (mag < resp.stillnessThreshold) {
      _stillnessTimer += dt;

      if (_stillnessTimer > resp.stillnessTimeout && !_isSilent) {
        Harmony.enterSilence(_currentDegree);
        _isSilent = true;
        if (_phraseActive) _endPhrase(now);
        // Resolution note as music fades
        var cont = _lens.palette.continuous;
        try {
          Sound.play(cont.voice, Sound.currentTime,
            Harmony.freq(0, cont.octave || 0), 0.25, 2.2);
        } catch(e) { _errorCount++; }
      }

      if (_isSilent) {
        _fadeGain *= (1 - dt / resp.fadeTime);
        if (_fadeGain < 0.005) _fadeGain = 0;
      }
    } else {
      if (_isSilent && mag > resp.stillnessThreshold * 2) {
        _isSilent       = false;
        _stillnessTimer = 0;

        // Wake-up: silence has memory
        var deg = Harmony.exitSilence();
        if (deg === null || deg === undefined) deg = 0;

        var h = _lens.palette.harmonic;
        try { Sound.play(h.voice, Sound.currentTime, Harmony.freq(0, -1), 0.25, 2.0); }
        catch(e) {}

        var cont2 = _lens.palette.continuous;
        try {
          Sound.play(cont2.voice, Sound.currentTime + 0.06,
            Harmony.freq(deg, cont2.octave || 0), 0.28, 1.6);
          _currentDegree = deg;
        } catch(e) {}
      }
      _stillnessTimer = 0;

      if (!_isSilent) {
        _sessionEngagedTime += dt;
        _sessionPhase = _sessionEngagedTime < PHASE_LISTENING ? 0
                      : _sessionEngagedTime < PHASE_ALIVE     ? 1
                      : 2;

        var ceiling = _sessionPhase === 0 ? 0.45 : _sessionPhase === 1 ? 0.72 : 1.0;
        var target  = Math.min(ceiling, mag / 2);
        _fadeGain  += (target - _fadeGain) * 0.05;
      }
    }
  }


  // ── TILT-TO-MELODY ────────────────────────────────────────────────────
  //
  // beta (front-back) → WaterDynamic → sweet spots → Harmony → Sound
  // This is the heart of the instrument. Everything else is support.

  function _updateTiltPitch(sensor, now, dt) {
    if (!Sound.ctx || _isSilent || _fadeGain < 0.08) return;

    var tiltRange = _lens.response.tiltRange;
    // Natural iPhone hold ≈ 62°. Center instrument there.
    var tiltVal  = (sensor.beta || 62) - 62;
    var tiltNorm = Math.max(-1, Math.min(1, tiltVal / (tiltRange / 2)));

    // Water bottle physics: momentum + damping = alive feel
    if (_pitchWater) {
      _pitchWater.update(tiltNorm, dt || 0.016);
      tiltNorm = _pitchWater.level * 2 - 1;
    }

    // Sweet spot frets: gravitational wells at each scale degree
    var rawDegree  = tiltNorm * 7;
    var gravitated = Harmony.applySweetSpot(rawDegree);
    gravitated     = Harmony.gravitateDegree(gravitated);

    var minDelta = _lens.response.melodicMinDelta || 1;
    var minEnerg = _lens.response.melodicEnergy   || 0;

    if (gravitated !== _currentDegree
        && Math.abs(gravitated - _currentDegree) >= minDelta
        && Body.energy >= minEnerg
        && !Harmony.breathing) {

      // Note interval gates rate — slower when moving slowly
      var interval = _lens.response.noteInterval;
      var speed    = Body.energy;
      var speedMult = 1 + (1 - Math.min(1, speed / 2.5)) * 1.2;
      var minInterval = interval * speedMult;

      // Snap to tempo subdivisions when body has locked a tempo
      if (Rhythm.tempoLocked && Rhythm.tempo > 0) {
        var beatMs   = 60000 / Rhythm.tempo;
        var eighthMs = beatMs / 2;
        minInterval  = minInterval < eighthMs * 0.75 ? eighthMs
                     : minInterval < beatMs    * 0.80 ? eighthMs * 1.5
                     : beatMs;
      }

      if ((now - _lastNoteTime) > minInterval) {
        _currentDegree = gravitated;

        // Contour blend during phrase climax
        if (_phraseActive) {
          var contourWeight = _phraseEnergyArc > 0.85 ? 0.70 : 0.35;
          var contourDeg    = Harmony.getContourDegree(_phraseEnergyArc);
          _currentDegree    = Math.round(
            _currentDegree * (1 - contourWeight) + contourDeg * contourWeight
          );
        }

        Harmony.recordNote(_currentDegree);
        var motifDeg = Harmony.applyMotifGravity(_currentDegree);
        _lastNoteTime = now;

        var cont  = _lens.palette.continuous;
        var freq  = Harmony.freq(motifDeg, cont.octave || 0);
        var baseVel = 0.36 + _fadeGain * 0.42;
        if (_prodigy.arc === 'rising')  baseVel *= 1.12;
        if (_prodigy.arc === 'falling') baseVel *= 0.85;
        var vel = Math.min(0.55, baseVel * _phraseIntensityFactor * (cont.velBoost || 1));

        // Duration: shorter at climax (urgency), longer at opening (space)
        var baseDec = cont.decay || 1.2;
        var dec     = _phraseEnergyArc < 0.30 ? baseDec * 0.60
                    : _phraseEnergyArc < 0.78 ? baseDec
                    : baseDec * 1.45;
        if (!cont.sustained) dec *= (1 - Math.min(1, speed / 2.5) * 0.45);

        try {
          Sound.play(cont.voice, Sound.currentTime, freq, vel, dec);
          _noteCount++;
        } catch(e) { _errorCount++; }
      }
    }
  }


  // ── PHRASE ────────────────────────────────────────────────────────────

  function _updatePhrase(mag, now, dt) {
    if (_phraseCooldown > 0) _phraseCooldown -= dt;

    if (!_phraseActive) {
      if (mag > 0.5 && _phraseCooldown <= 0) {
        _phraseActive    = true;
        _phrasePeakCount = 0;
        _phraseStartTime = now;
        _phraseMaxMag    = mag;
        _phraseEnergyArc = 0;
        Harmony.startPhrase();
        Harmony.pickPhraseContour(Body.archetype,
          (_lens.emotion && _lens.emotion.phraseShape) || null);
      }
    } else {
      var dur = now - _phraseStartTime;
      if (mag > _phraseMaxMag) _phraseMaxMag = mag;

      var phraseLen = Math.min(8000, Math.max(2000,
        (Rhythm.tempoLocked && Rhythm.tempo > 0) ? Rhythm.tempo > 0 ? 60000 / Rhythm.tempo * 8 : 4000 : 4000
      ));
      _phraseEnergyArc = Math.min(1, dur / phraseLen);

      if (_phraseEnergyArc < 0.4) {
        _phraseIntensityFactor = 0.45 + (_phraseEnergyArc / 0.4) * 0.55;
      } else if (_phraseEnergyArc < 0.8) {
        _phraseIntensityFactor = 1.0;
      } else {
        _phraseIntensityFactor = 1.0 - (_phraseEnergyArc - 0.8) / 0.2;
      }

      if ((mag < 0.15 && dur > 1000) || dur > phraseLen) {
        _endPhrase(now);
      }
    }
  }

  function _endPhrase(now) {
    _phraseActive          = false;
    _phraseCooldown        = 0.5;
    _phraseIntensityFactor = 1.0;
    Harmony.endPhrase(_phraseMaxMag);

    // Resolution chord — the musical full stop
    if (!_isSilent && _fadeGain > 0.15 && Sound.ctx) {
      var h      = _lens.palette.harmonic;
      var resVel = Math.min(0.50, 0.18 + _fadeGain * 0.28);
      var chord  = Harmony.tension > 0.6 ? [0,2,4,6] : [0,2,4];
      var t0     = Sound.currentTime;
      for (var ci = 0; ci < chord.length; ci++) {
        try {
          Sound.play(h.voice, t0 + ci * 0.12,
            Harmony.freq(chord[ci], h.octave || 0),
            resVel * (1 - ci * 0.10), h.decay || 1.8);
        } catch(e) { _errorCount++; }
      }
    }
  }


  // ── PEAK HANDLER ─────────────────────────────────────────────────────

  function _onPeak(magnitude, now) {
    if (_sessionPhase === 0 || !Sound.ctx) return;
    try {
      var t   = Sound.currentTime;
      var vel = Math.min(1, magnitude / 4) * _phraseIntensityFactor;
      var p   = _lens.palette.peak;

      // Peak voice: nearest chord tone to current melody degree
      if (p && vel > 0.08) {
        var chordTones = [0,2,4,7];
        var peakDeg = 0, minD = 99;
        for (var ci = 0; ci < chordTones.length; ci++) {
          for (var oi = -1; oi <= 1; oi++) {
            var cand = chordTones[ci] + oi * 7;
            var d    = Math.abs(cand - _currentDegree);
            if (d < minD) { minD = d; peakDeg = cand; }
          }
        }
        var peakVel = Math.min(0.90, vel * 0.80 * (_sessionPhase === 1 ? 0.55 : 1.0));
        Sound.play(p.voice, t, Harmony.freq(peakDeg, p.octave || -1), peakVel, p.decay || 0.8);
        _noteCount++;
      }

      // Harmonic answer — slightly delayed, softer
      var h = _lens.palette.harmonic;
      if (h && vel > 0.38 && _sessionPhase >= 1) {
        var answerDeg = Harmony.tension > 0.65 ? 0
          : _phraseEnergyArc > 0.55 ? 4 : _currentDegree % 7;
        Sound.play(h.voice, t + 0.32,
          Harmony.freq(answerDeg, h.octave || 0), vel * 0.18, h.decay || 1.0);
      }

      // Trigger call & response after 2 peaks in a phrase
      if (_phrasePeakCount >= 2 && _phraseEnergyArc > 0.2) {
        _triggerCallResponse(magnitude, now);
      }

      _phrasePeakCount++;
      if (magnitude > _phraseMaxMag) _phraseMaxMag = magnitude;
    } catch(e) { _errorCount++; }
  }


  // ── CALL & RESPONSE ───────────────────────────────────────────────────

  function _triggerCallResponse(mag, now) {
    if (_sessionPhase < 1 || _crCooldown > now || _answerPending) return;
    if (Body.energy < 0.25) return;

    var sp = (Rhythm.tempoLocked && Rhythm.tempo > 0)
      ? (60000 / Rhythm.tempo / 2) : 400;

    if (Harmony.tension > 0.62 || _phraseEnergyArc > 0.72) {
      _answerNotes = [
        { deg: 4, delayMs: 0,      vel: 0.30 },
        { deg: 2, delayMs: sp,     vel: 0.24 },
        { deg: 0, delayMs: sp * 2, vel: 0.38 },
      ];
    } else {
      _answerNotes = [
        { deg: _currentDegree + 2,              delayMs: 0,      vel: 0.26 },
        { deg: Math.min(6, _currentDegree + 4), delayMs: sp,     vel: 0.30 },
        { deg: 2,                               delayMs: sp * 2, vel: 0.34 },
      ];
    }

    if (Rhythm.tempoLocked && Rhythm.tempo > 0) {
      _answerTime = now + (60000 / Rhythm.tempo) * (Math.random() < 0.5 ? 2 : 4);
    } else {
      _answerTime = now + 1500 + Math.random() * 2000;
    }
    _answerIdx     = 0;
    _answerPending = true;
    _crCooldown    = now + 10000 + Math.random() * 4000;
  }

  function _processAnswer(now) {
    if (!_answerPending || !Sound.ctx || _isSilent) return;
    if (now < _answerTime) return;

    if (_answerIdx < _answerNotes.length) {
      var note = _answerNotes[_answerIdx];
      if (now >= _answerTime + note.delayMs) {
        var h = _lens.palette.harmonic;
        try {
          Sound.play(h.voice, Sound.currentTime,
            Harmony.freq(note.deg, h.octave || 0),
            note.vel * _fadeGain, h.decay || 1.8);
          Harmony.recordNote(note.deg);
        } catch(e) { _errorCount++; }
        _answerIdx++;
      }
    } else {
      _answerPending = false;
    }
  }


  // ── PRODIGY (mix intelligence) ────────────────────────────────────────

  function _updateProdigy(dt) {
    if (_isSilent) return;
    var energy = Body.energy;

    _prodigy.sampleTimer += dt;
    if (_prodigy.sampleTimer >= 0.25) {
      _prodigy.sampleTimer = 0;
      _prodigy.energyHistory[_prodigy.energyHead] = energy;
      _prodigy.energyHead = (_prodigy.energyHead + 1) & 15;
    }

    var recent4 = 0, older4 = 0;
    for (var j = 0; j < 4; j++) {
      recent4 += _prodigy.energyHistory[(_prodigy.energyHead - 1 - j + 16) & 15];
      older4  += _prodigy.energyHistory[(_prodigy.energyHead - 5 - j + 16) & 15];
    }
    var diff = recent4 / 4 - older4 / 4;

    if      (diff >  1.5) _prodigy.arc = 'rising';
    else if (diff < -1.5) _prodigy.arc = 'falling';
    else                  _prodigy.arc = 'neutral';

    // Reverb: calm = spacious, intense = tight
    var calmness = Math.max(0, 1.0 - energy * 0.08);
    _prodigy.reverbTarget = 0.15 + calmness * 0.35;
    if (_prodigy.arc === 'falling') _prodigy.reverbTarget += 0.15;
    // Style-specific reverb floor
    var reverbFloor = (_lens.space && _lens.space.reverbMix) || 0.25;
    _prodigy.reverbTarget = Math.max(reverbFloor * 0.6, _prodigy.reverbTarget);
    try { Sound.setReverbMix(_prodigy.reverbTarget); } catch(e) {}

    // Volatile energy → compress dynamic range
    var volatility = 0;
    for (var m = 1; m < 8; m++) {
      var e1 = _prodigy.energyHistory[(_prodigy.energyHead - m     + 16) & 15];
      var e2 = _prodigy.energyHistory[(_prodigy.energyHead - m - 1 + 16) & 15];
      volatility += Math.abs(e1 - e2);
    }
    volatility /= 7;
    if (volatility > 3) {
      _prodigy.dynamicRange += (0.7 - _prodigy.dynamicRange) * 1.0 * dt;
    } else {
      _prodigy.dynamicRange += (1.0 - _prodigy.dynamicRange) * 0.5 * dt;
    }
  }


  // ── APPLY LENS ────────────────────────────────────────────────────────

  function _applyLens(styleId) {
    _styleId = styleId || 'lofi';
    _lens    = STYLE_LENS[_styleId] || STYLE_LENS.lofi;

    // Sound: configure voice routing + reverb
    try { Sound.configure(_lens); } catch(e) { _errorCount++; }
    var reverbMix = (_lens.space && _lens.space.reverbMix) || 0.35;
    if (typeof Environ !== 'undefined' && Environ.reverbDepth) {
      reverbMix = Math.max(reverbMix, Environ.reverbDepth * 0.8);
    }
    try { Sound.setReverbMix(reverbMix); } catch(e) {}

    // Harmony: Environ provides key + mode, style constrains mode choice
    var style  = typeof Styles !== 'undefined' ? Styles.get(_styleId) : null;
    var mode   = (typeof Environ !== 'undefined') ? Environ.mode : 'minor';
    if (style && style.modeHint && style.modeHint.length > 0) {
      if (style.modeHint.indexOf(mode) === -1) mode = style.modeHint[0];
    }
    // Root: C3=261.626 Hz, shifted by Environ.key semitones
    var key    = (typeof Environ !== 'undefined') ? (Environ.key || 0) : 0;
    var rootHz = 261.626 * Math.pow(2, key / 12);
    try { Harmony.configure({ root: rootHz, mode: mode }); } catch(e) { _errorCount++; }

    // Rhythm: style determines drum kit character
    var profile = (_lens.rhythm && _lens.rhythm.kit) || 'acoustic';
    var bpm     = (typeof Environ !== 'undefined') ? Environ.bpm : 88;
    if (style && style.bpmRange) {
      bpm = Math.max(style.bpmRange[0], Math.min(style.bpmRange[1], bpm));
    }
    try {
      Rhythm.configure({
        mode:    'organic',
        bpm:     bpm,
        profile: profile,
      });
    } catch(e) { _errorCount++; }

    // Wire drum callback to Sound
    try {
      Rhythm.setCallback(function (time, velocity, instrument, kit) {
        if (_isSilent || !Sound.ctx) return;
        try { Sound.playDrum(instrument, time, velocity, kit); } catch(e) {}
      });
    } catch(e) { _errorCount++; }

    // Motion profile adaptation (Body adjusts thresholds to this player's style)
    try {
      if (Body.motionProfile && Body.motionProfile.adapt) {
        var adapted = Body.motionProfile.adapt(_lens.response || {});
        _lens.response.stillnessThreshold = adapted.stillnessThreshold || _lens.response.stillnessThreshold;
      }
    } catch(e) {}
  }


  // ── PUBLIC API ────────────────────────────────────────────────────────

  function init(ctx, styleId) {
    Body.init();
    Sound.init(ctx);
    Harmony.init();
    Rhythm.init();

    _active  = false;
    _styleId = styleId || 'lofi';

    // Water bottle physics (same params as flow.js)
    _pitchWater = null;
    try { _pitchWater = new Body.WaterDynamic(1.8, 0.93, 0.06); } catch(e) {}

    _applyLens(_styleId);

    // Reset all state
    _isSilent       = true;
    _fadeGain       = 0;
    _stillnessTimer = 0;
    _sessionPhase       = 0;
    _sessionEngagedTime = 0;
    _phraseActive   = false;
    _currentDegree  = 0;
    _lastNoteTime   = 0;
    _noteCount      = 0;
    _errorCount     = 0;
    _touchDuck      = 1.0;
    _answerPending  = false;
    _crCooldown     = 0;
    _lastT          = performance.now();
    _active         = true;
  }

  function applyStyle(styleId) {
    if (!_active) return;
    _applyLens(styleId);
    // Soft reset — keep session engaged time (evolution persists)
    _isSilent       = true;
    _fadeGain       = 0;
    _stillnessTimer = 0;
    _phraseActive   = false;
    _currentDegree  = 0;
    _answerPending  = false;
  }

  // Called from RAF loop every frame.
  // sensor = Sensor.read() from v1 sensor.js
  // ts     = performance.now() timestamp
  function update(sensor, ts) {
    if (!_active || !_lens || !Sound.ctx) return;

    var now = ts;  // milliseconds (for interval comparisons)
    var dt  = Math.min(0.05, (ts - _lastT) / 1000);
    _lastT  = ts;

    // 1. Body — Kalman filter, neurons, peaks, rhythm detection
    Body.process(sensor, ts);

    // 2. Silence / presence gate
    _updateSilence(dt, now);

    // 3. Master gain — silence fades, presence grows over session
    if (_isSilent && _fadeGain < 0.005) {
      try { Sound.setMasterGain(0.001); } catch(e) {}
    } else {
      var drumFloor = (typeof Rhythm !== 'undefined' && Rhythm.drumPresence)
        ? Rhythm.drumPresence * 0.35 : 0;
      var effectiveGain = Math.max(_fadeGain, drumFloor);
      try { Sound.setMasterGain(0.50 * effectiveGain * _touchDuck * _prodigy.dynamicRange); } catch(e) {}
    }
    _touchDuck = Math.min(1.0, _touchDuck + dt * 2.0);

    if (_isSilent && _fadeGain < 0.005) return;

    // 4. Phrase tracking
    _updatePhrase(Body.energy, now, dt);

    // 5. Peaks → musical events (accent voice + call & response trigger)
    if (Body.peaked) _onPeak(Body.peakMagnitude, now);

    // 6. Beta-driven tilt-to-melody (THE INSTRUMENT)
    _updateTiltPitch(sensor, now, dt);

    // 7. Call & response playback
    _processAnswer(now);

    // 8. Prodigy — mix intelligence
    _updateProdigy(dt);

    // 9. Harmonic rhythm + motif system
    try { Harmony.updateHarmonicRhythm(dt, _prodigy.arc, Body.energy); } catch(e) {}
    try { Harmony.updateHarmonicGravity(dt, Body.energy, _isSilent); } catch(e) {}
    try { Harmony.updateMotifCooldown(dt); } catch(e) {}

    // 10. Euclidean drums — earned over 30-90s of body rhythm
    if (!_isSilent && typeof Rhythm !== 'undefined') {
      try {
        Rhythm.update(dt, {
          energy:           Body.energy,
          tempo:            Body.bodyTempo || 88,
          tempoLocked:      Body.rhythmConfidence > 0.22,
          rhythmConfidence: Body.rhythmConfidence || 0,
          lockStrength:     Body.rhythmConfidence || 0,
          isSilent:         _isSilent,
          peaked:           Body.peaked,
          peakMag:          Body.peakMagnitude,
          audioTime:        Sound.currentTime,
        });
      } catch(e) { _errorCount++; }
    }

    // 11. Spatial — gamma drives panner, touch overrides
    try { Sound.updateSpatial(sensor.gamma || 0, _isSilent, sensor.touching || false); } catch(e) {}
    if (sensor.touching && typeof sensor.tx === 'number') {
      try { Sound.setTouchPan(sensor.tx); } catch(e) {}
      _touchDuck = Math.max(0.65, _touchDuck - dt * 3.0);
    }
  }

  // Call after Environ loads (GPS/weather arrives asynchronously)
  function refresh() {
    if (_active && _lens) _applyLens(_styleId);
  }

  // Touch note (tap the screen to play a chord tone)
  function touch(normX, normY, vx, vy) {
    if (!_active || !_lens || !Sound.ctx || _isSilent) return;
    var rawDeg = Math.round((1 - normY) * 14) - 7;
    var chordTones = [0,2,4,7,-3,-5];
    var nearest = rawDeg, minD = 99;
    for (var ci = 0; ci < chordTones.length; ci++) {
      for (var oi = -1; oi <= 1; oi++) {
        var cand = chordTones[ci] + oi * 7;
        var d = Math.abs(rawDeg - cand);
        if (d < minD) { minD = d; nearest = cand; }
      }
    }
    var deg  = minD <= 2 ? nearest : rawDeg;
    var spd  = Math.sqrt(vx * vx + vy * vy);
    var vel  = Math.min(0.75, 0.28 + spd * 0.08);
    var cont = _lens.palette.continuous;
    try {
      Sound.play(cont.voice, Sound.currentTime, Harmony.freq(deg, cont.octave || 0), vel, 0.6);
      _noteCount++;
    } catch(e) { _errorCount++; }
  }

  return Object.freeze({
    init:       init,
    applyStyle: applyStyle,
    update:     update,
    refresh:    refresh,
    touch:      touch,
    get silent()  { return _isSilent; },
    get phase()   { return _sessionPhase; },
    get degree()  { return _currentDegree; },
    get errors()  { return _errorCount; },
    get notes()   { return _noteCount; },
    get styleId() { return _styleId; },
  });

})();
