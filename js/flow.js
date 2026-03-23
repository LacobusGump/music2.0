/**
 * FLOW — The Conductor
 *
 * Replaces follow.js. Reads from Body, Harmony, Rhythm, Weather.
 * Makes musical decisions. Writes to Sound and Harmony.
 *
 * Three pipelines: organic, grid, ascension — routed by lens config.
 * The body drives everything. No clocks make musical decisions.
 * Stillness = silence. Movement = music. The system follows the human.
 *
 * Research foundation:
 *   Huron 2006       — ITPRA: expectation and surprise drive emotion
 *   Salimpoor 2011   — Two-phase dopamine: anticipation + resolution
 *   Berlyne 1971     — Inverted-U aesthetic pleasure (moderate complexity)
 *   Cheung et al 2019 — High uncertainty + expected resolution = peak pleasure
 *   Haken-Kelso-Bunz 1985 — Human coordination as coupled oscillators
 *   Power et al 2022 — Grokking: phase transition from using to understanding
 *   Meyer 1956       — Emotion and meaning in music
 *   Blood & Zatorre 2001 — Musical chills = reward circuitry
 *   Witek et al 2014 — Moderate syncopation = peak groove
 *
 * @module Flow
 */

const Flow = (function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════
  // 1. CONSTANTS
  // ═══════════════════════════════════════════════════════════════════════

  var INTENT = {
    BREATH: 0, QUESTION: 1, GROOVE: 2,
    STATEMENT: 3, RESOLUTION: 4, EXCLAMATION: 5
  };

  var INTENT_NAMES = [
    'BREATH', 'QUESTION', 'GROOVE',
    'STATEMENT', 'RESOLUTION', 'EXCLAMATION'
  ];

  // Session arc phase thresholds (seconds of engaged time)
  var PHASE_LISTENING = 3;   // Phase 0: first impression, sparse
  var PHASE_ALIVE    = 12;   // Phase 1: alive, more voices

  // ═══════════════════════════════════════════════════════════════════════
  // 2. INTERNAL STATE
  // ═══════════════════════════════════════════════════════════════════════

  var _active = false;
  var _lens   = null;
  var _lastT  = 0;

  // -- Pipeline routing --
  var _pipeline = 'organic';  // 'organic' | 'grid' | 'ascension'

  // -- Silence / presence --
  var _isSilent       = true;
  var _fadeGain        = 0;
  var _stillnessTimer  = 0;

  // -- Session arc --
  var _sessionPhase       = 0;   // 0 = listening, 1 = alive, 2 = evolution
  var _sessionEngagedTime = 0;
  var _sessionAct         = 0;   // three-act: 0=emergence, 1=sus4, 2=homecoming
  var _baseScale          = null; // original scale snapshot for act system

  // -- Tilt-to-melody --
  var _currentDegree = 0;
  var _targetDegree  = 0;
  var _tiltOffset    = 0;
  var _lastNoteTime  = 0;

  // -- Water dynamics --
  var _pitchWater  = null;  // Body.WaterDynamic for pitch
  var _filterWater = null;  // Body.WaterDynamic for filter

  // -- Filter --
  var _filterFreq   = 800;
  var _filterTarget = 800;

  // -- Musical intent --
  var _currentIntent = INTENT.BREATH;
  var _intentBuf     = new Float32Array(24);
  var _intentHead    = 0;

  // -- Phrase state --
  var _phraseActive          = false;
  var _phrasePeakCount       = 0;
  var _phraseStartTime       = 0;
  var _phraseMaxMag          = 0;
  var _phraseEnergyArc       = 0;
  var _phraseCooldown        = 0;
  var _phraseIntensityFactor = 1.0;

  // -- Prodigy (musical intelligence) --
  var _prodigy = {
    energyHistory: new Float32Array(16),
    energyHead:    0,
    sampleTimer:   0,
    arc:           'neutral',   // rising | falling | plateau | volatile
    arcStrength:   0,
    arcDuration:   0,
    degreeHeat:    new Float32Array(15),
    degreeDecay:   0.995,
    reverbTarget:  0.25,
    filterBias:    0,
    dynamicRange:  1.0,
    tensionDetune: 0,
    prevArc:       '',
    _momentCooldown: 0,
    _hrDegree:     0,
  };

  // -- Call and response --
  var _crCooldown    = 0;
  var _answerPending = false;
  var _answerTime    = 0;
  var _answerNotes   = [];
  var _answerIdx     = 0;

  // -- Complexity tracking --
  var _berlyne = null;  // Body.BerlyneTracker
  var _grok    = null;  // Body.GrokDetector

  // -- Foundation drone --
  var _droneActive = false;
  var _droneGain   = 0;

  // -- Void --
  var _voidEngaged  = false;
  var _voidPresence = 0;

  // -- Density --
  var _energySmooth = 0;
  var _densityLevel = 0;

  // -- Gyro filter --
  var _gyroMagSmooth = 0;
  var _gyroPrevBeta  = null;
  var _gyroPrevGamma = null;

  // -- Tension arc (Tundra / Still Water deceptive cadence) --
  var _tensionArc = {
    phase:     'idle',
    timer:     0,
    level:     0,
    buildTime: 12,
    maxMisses: 3,
    fired:     false,
    _deceptiveFired: false,
    _resolveFired:   false,
  };

  // -- Stats --
  var _noteCount  = 0;
  var _errorCount = 0;

  // -- Vertical arc engine --
  var _vertVelocity = 0;
  var _vertPosition = 0;
  var _vertPhase    = 0;
  var _arcPeak      = 0;
  var _arcValley    = 0;
  var _arcAmplitude = 0.4;

  // -- Adapted thresholds from motion profile --
  var _adaptedPeakThresh  = null;
  var _adaptedStillThresh = null;

  // -- Water wall bounce state --
  var _waterWasStacked = false;
  var _waterSplashLast = 0;

  // -- Narmour implication-realization state --
  var _lastInterval  = 0; // last melodic interval in scale degrees
  var _lastDirection = 0; // +1 up, -1 down, 0 unison

  // 1/f timing — the signature of life (Hennig 2011)
  // Voss-McCartney algorithm: correlated deviations, not random jitter
  var _pinkTimingSeq = (function() {
    var numGen = 8, vals = new Array(numGen).fill(0);
    var seq = new Float32Array(512);
    for (var i = 0; i < 512; i++) {
      var mask = i, bit = 0;
      while (bit < numGen) {
        if ((mask & 1) === 0 && bit > 0) break;
        vals[bit] = Math.random() * 2 - 1;
        mask >>= 1; bit++;
      }
      var sum = 0;
      for (var g = 0; g < numGen; g++) sum += vals[g];
      seq[i] = sum / numGen * 0.012; // 12ms std dev in seconds
    }
    return seq;
  })();
  var _pinkTimingIdx = 0;

  function hTime(t) {
    var offset = _pinkTimingSeq[_pinkTimingIdx++ & 511];
    return t + offset;
  }

  // -- Session energy / epigenetic --
  var _sessionEnergyAccum = 0;
  var _generation         = 0;
  var _epiAdvancePending  = false;
  var _epi = {
    spaceMix:     0,
    massiveFloor: 0,
    energyGate:   24,
    harmonyCarry: 0,
  };

  // -- Touch --
  var _lastTouchNote = 0;
  var _touchDuck     = 1.0;


  // ═══════════════════════════════════════════════════════════════════════
  // 3. GRID PIPELINE STATE
  // ═══════════════════════════════════════════════════════════════════════

  var _grid = {
    active:  false,
    started: false,
    bpm:     128,
    stepDur: 0,
    clock:   0,
    lastStep: -1,
    totalBars: 0,
    lastBar: -1,

    phase:      'waiting',
    phaseTimer: 0,

    buildLevel:     0,
    riserFired:     false,
    snareRollFired: false,

    intensity:     0,
    djGain:        0,
    lastIntensity: 0,
    pumpIntensity: 0,

    tiltNorm:       0.5,
    tiltZone:       1,
    tiltZoneSmooth: 1,
    rollNorm:       0,

    filterSmooth: 800,
    killActive:   false,

    cycle:   0,
    segment: 0,
    lastSegment: -1,
    setTime: 0,

    rootShift:      0,
    nextRootShift:  0,
    currentRootFreq: 432,

    // Melodic state for grid pipeline
    bassActive:      false,
    lastBassStep:    -1,
    lastStabStep:    -1,
    lastLeadStep:    -1,
    riserFilterFreq: 200,
    stabPattern:     [0, 0, 3, 5],  // scale degrees for stabs
    leadDegree:      0,

    arr: {
      kickPat: 0, hatPat: 0, snarePat: 0,
      ride: false, ridePattern: 0, clap: false,
      wobbleShape: 0, wobbleRate: 1.0,
      subOctave: false, stabStyle: 0,
      bassWalk: 0, filterSweepDir: 0, filterSweepPhase: 0,
      reverbLevel: 0.15, padOpen: false,
      snareRoll: false, percPat: 0,
      halftime: false, delayThrow: false, reverbWash: false,
      stabVoicing: 0, filterQ: 3.5,
      swing: 0, levitation: false, levitationSpread: 30,
    },
  };

  // ═══════════════════════════════════════════════════════════════════════
  // 4. ASCENSION PIPELINE STATE
  // ═══════════════════════════════════════════════════════════════════════

  var ASC_PROG_MAJOR = [
    [0, 4, 7, 12], [0, 5, 9, 12], [-1, 4, 7, 11], [0, 4, 7, 12],
    [0, 5, 9, 12], [0, 4, 9, 12], [-1, 2, 7, 11], [0, 4, 7, 12],
  ];
  var ASC_PROG_MINOR = [
    [0, 3, 7, 12], [0, 5, 8, 12], [0, 3, 8, 12], [-1, 4, 7, 11],
    [0, 3, 7, 12], [-2, 3, 7, 10], [-1, 4, 7, 11], [0, 3, 7, 12],
  ];

  var _asc = {
    active:  false,
    started: false,
    time:    0,
    engagedTime: 0,

    filterSmooth: 400,
    spreadSmooth: 3,
    masterGain:   0,
    stillTime:    0,

    tiltSmooth: 0.5,
    leanSmooth: 0.5,

    bloom:       0,
    bloomTarget: 0,

    color:       0.5,
    colorSmooth: 0.5,

    chordStep: 0,
    chordTimer: 0,
    progCycle:  0,
    _progLocked: null,

    breathPhase: 0,
    phase: 'waiting',

    _energyHist:   [],
    _energyTimer:  0,
    _peakCount:    0,
    _lastEnergy:   0,
    _peakCooldown: 0,
    _startChord:   null,
  };


  // ═══════════════════════════════════════════════════════════════════════
  // 5. ORGANIC STAGE STATE (Journey lens)
  // ═══════════════════════════════════════════════════════════════════════

  var _organicStage = {
    current:            0,
    timer:              0,
    transitioning:      false,
    transitionProgress: 0,
    stageDuration:      120,
    crossfadeDuration:  30,
    lastApplied:        -1,
    order:              null,
  };


  // ═══════════════════════════════════════════════════════════════════════
  // 6. SILENCE / PRESENCE
  // ═══════════════════════════════════════════════════════════════════════
  //
  // The system follows the human. Stillness = silence. Movement = music.
  // Silence is not emptiness — it is the body's resting frequency
  // (0.1 Hz cardiovascular resonance, Lehrer & Gevirtz 2014).

  function updateSilence(dt, now) {
    var mag = Body.energy;
    var threshold = _adaptedStillThresh ||
      (_lens && _lens.response && _lens.response.stillnessThreshold) || 0.2;
    var timeout = (_lens && _lens.response && _lens.response.stillnessTimeout) || 2.0;
    var fadeTime = (_lens && _lens.response && _lens.response.fadeTime) || 3.0;

    if (mag < threshold) {
      _stillnessTimer += dt;

      if (_stillnessTimer > timeout && !_isSilent) {
        // Capture silence seed — remember where the conversation paused
        Harmony.enterSilence(_currentDegree);
        _isSilent = true;

        // Resolving note as music fades
        var cont = _lens && _lens.palette && _lens.palette.continuous;
        if (cont && typeof Sound !== 'undefined' && Sound.ctx) {
          try {
            Sound.play(cont.voice || 'epiano', Sound.currentTime,
              Harmony.freq(0, cont.octave || 0), 0.28, 2.5);
          } catch (e) { _errorCount++; }
        }
        if (_phraseActive) endPhrase(now);
      }

      if (_isSilent) {
        _fadeGain *= (1 - dt / fadeTime);
        if (_fadeGain < 0.005) _fadeGain = 0;
      }
    } else {
      if (_isSilent && mag > threshold * 2) {
        _isSilent = false;
        _stillnessTimer = 0;

        // Wake-up: silence has memory (Harmony.exitSilence)
        if (_lens && _lens.palette && typeof Sound !== 'undefined' && Sound.ctx) {
          var wakeUpDeg = Harmony.exitSilence();
          if (wakeUpDeg === null || wakeUpDeg === undefined) wakeUpDeg = 0;

          // Bass root anchors tonal center
          var hVoice = (_lens.palette.harmonic && _lens.palette.harmonic.voice) || 'piano';
          try {
            Sound.play(hVoice, Sound.currentTime, Harmony.freq(0, -1), 0.28, 2.2);
          } catch (e) { _errorCount++; }

          // Melody picks up from seed
          var cont2 = _lens.palette.continuous;
          if (cont2) {
            try {
              Sound.play(cont2.voice || 'epiano', Sound.currentTime + 0.05,
                Harmony.freq(wakeUpDeg, cont2.octave || 0), 0.30, 1.8);
              _currentDegree = wakeUpDeg;
              _noteCount++;
            } catch (e) { _errorCount++; }
          }
        }
      }
      _stillnessTimer = 0;

      if (!_isSilent) {
        _sessionEngagedTime += dt;
        _sessionPhase = _sessionEngagedTime < PHASE_LISTENING ? 0
                       : _sessionEngagedTime < PHASE_ALIVE     ? 1
                       : 2;

        var fadeCeiling = _sessionPhase === 0 ? 0.45
                        : _sessionPhase === 1 ? 0.72 : 1.0;
        var targetFade = Math.min(fadeCeiling, mag / 2);
        _fadeGain += (targetFade - _fadeGain) * 0.05;
      }
    }
  }


  // ═══════════════════════════════════════════════════════════════════════
  // 7. TILT-TO-MELODY (organic pipeline)
  // ═══════════════════════════════════════════════════════════════════════
  //
  // Beta → WaterDynamic → sweet spot frets → Harmony.gravitateDegree()
  // → Harmony.freq() → Sound.play(). The phone IS the instrument.

  function updateTiltPitch(sensor, now, dt) {
    if (!_lens || typeof Sound === 'undefined' || !Sound.ctx) return;

    var tiltRange = (_lens.response && _lens.response.tiltRange) || 50;
    var melodicDriver = (_lens.motion && _lens.motion.melodic) || 'beta';
    var tiltVal;

    if (melodicDriver === 'gamma') {
      tiltVal = (sensor.gamma || 0);
    } else {
      // Natural iPhone hold ~62 deg. Center the instrument there.
      tiltVal = (sensor.beta || 62) - 62;
    }

    // Water bottle physics: tilt drives the water, water level drives pitch
    var tiltNorm = tiltVal / (tiltRange / 2);
    tiltNorm = Math.max(-1, Math.min(1, tiltNorm));

    if (_pitchWater) {
      _pitchWater.update(tiltNorm, dt || 0.016);
      _tiltOffset = _pitchWater.level * 2 - 1;

      // Wall bounce -> percussive splash (rising edge only)
      var stacked = _pitchWater.stacked();
      if (stacked && !_waterWasStacked
          && (now - _waterSplashLast) > 180
          && !_isSilent && _fadeGain > 0.15
          && _pipeline !== 'grid'
          && typeof Sound !== 'undefined' && Sound.ctx) {
        var splashVel = Math.min(0.75, _pitchWater.turbulence() * 0.45 + 0.12);
        try { Sound.playDrum('perc', Sound.currentTime, splashVel, 'acoustic'); } catch (e) {}
        _waterSplashLast = now;
      }
      _waterWasStacked = stacked;
    } else {
      _tiltOffset = tiltNorm;
    }

    // Sweet spot frets: gravitational wells at each scale degree
    var rawDegree = _tiltOffset * 7;
    var gravitated = Harmony.applySweetSpot(rawDegree);
    gravitated = Harmony.gravitateDegree(gravitated);

    // Beat-locked lenses handle melody separately
    var contPalette = _lens.palette && _lens.palette.continuous;
    if (contPalette && contPalette.beatLocked) return;

    // Per-lens melodic energy gate
    var melodicEnergy = (_lens.response && _lens.response.melodicEnergy) || 0;
    var melodicMinDelta = (_lens.response && _lens.response.melodicMinDelta) || 1;
    var motionNow = Body.energy;

    if (gravitated !== _currentDegree
        && Math.abs(gravitated - _currentDegree) >= melodicMinDelta
        && !_isSilent && _fadeGain > 0.15
        && !Harmony.breathing
        && motionNow >= melodicEnergy) {

      var noteIntervalMs = (_lens.response && _lens.response.noteInterval) || 320;
      var speed = motionNow;
      var speedMult = 1 + (1 - Math.min(1, speed / 2.5)) * 1.2;
      var minInterval = noteIntervalMs * speedMult;

      // Snap to musical subdivisions when tempo is locked
      if (Rhythm.tempoLocked && Rhythm.tempo > 0) {
        var beatMs = 60000 / Rhythm.tempo;
        var eighthMs = beatMs / 2;
        if (minInterval < eighthMs * 0.75) minInterval = eighthMs;
        else if (minInterval < eighthMs * 1.3) minInterval = eighthMs;
        else if (minInterval < beatMs * 0.8) minInterval = eighthMs * 1.5;
        else minInterval = beatMs;
      }

      var timeSinceNote = now - _lastNoteTime;
      if (timeSinceNote > minInterval) {
        _currentDegree = gravitated;

        // Contour blend + phrase arc
        var contourDeg = Harmony.getContourDegree(_phraseEnergyArc);
        var contourWeight = _phraseActive ? (_phraseEnergyArc > 0.85 ? 0.70 : 0.35) : 0;
        var blended = Math.round(_currentDegree * (1 - contourWeight) + contourDeg * contourWeight);

        // Emotional color note
        var colorDeg = (_lens.emotion && _lens.emotion.colorDeg != null) ? _lens.emotion.colorDeg : -1;
        if (colorDeg >= 0 && _phraseActive && _phraseEnergyArc > 0.2 && _phraseEnergyArc < 0.78) {
          blended = Math.round(blended * 0.72 + colorDeg * 0.28);
        }

        // Narmour implication-realization: steps continue, leaps reverse
        var interval = blended - _currentDegree;
        var absInterval = Math.abs(interval);
        var direction = interval > 0 ? 1 : interval < 0 ? -1 : 0;

        if (absInterval > 0) {
          // After a large leap (4+ degrees), gently pull toward reversal
          if (Math.abs(_lastInterval) >= 4 && direction === _lastDirection) {
            // The melody wants to reverse but tilt is pushing it further
            // Apply gentle gravity toward reversal (don't force — enable, don't choose)
            blended -= direction * Math.min(2, absInterval * 0.3);
            blended = Math.round(blended);
          }

          // After small steps in one direction (3+ consecutive), allow larger leap
          // This creates the natural "step step step LEAP" phrase shape

          _lastInterval = interval;
          _lastDirection = direction;
        }

        _currentDegree = blended;
        Harmony.recordNote(_currentDegree);
        _lastNoteTime = now;

        // Motif gravity: pull gently toward stored patterns
        var motifDeg = Harmony.applyMotifGravity(_currentDegree);

        if (contPalette) {
          var freq = Harmony.freq(motifDeg, contPalette.octave || 0);

          // Velocity is a musical decision
          var baseVel = 0.38 + _fadeGain * 0.45;
          if (_prodigy.arc === 'rising') baseVel *= 1.12;
          else if (_prodigy.arc === 'falling') baseVel *= 0.85;

          // Phrase velocity arch — bell curve peaking at 65% through phrase (Juslin & Laukka 2003)
          if (_phraseActive && _phraseStartTime > 0) {
            var phraseDur = now - _phraseStartTime;
            var expectedLen = Rhythm.tempoLocked ? Rhythm.state.beatInterval * 8 : 6000;
            var phrasePos = Math.min(1, phraseDur / expectedLen);
            var archCurve = Math.exp(-Math.pow((phrasePos - 0.65) / 0.35, 2));
            baseVel *= (0.72 + 0.28 * archCurve); // 72-100% range
          }

          // Harmonic tension: dissonant degrees play softer
          var degTension = Harmony.getDegreeTension(Math.abs(_currentDegree) % 7);
          if (degTension > 0.5) baseVel *= (1.0 - degTension * 0.15);

          var vel = Math.min(0.55, baseVel * _phraseIntensityFactor * (contPalette.velBoost || 1.0));

          // Phrase-aware decay
          var baseDec = contPalette.decay || 1.2;
          var phraseDec;
          if (_phraseEnergyArc < 0.30) phraseDec = baseDec * 0.60;
          else if (_phraseEnergyArc < 0.78) phraseDec = baseDec;
          else phraseDec = baseDec * 1.45;

          if (!contPalette.sustained) {
            var speedNorm = Math.min(1, speed / 2.5);
            phraseDec *= (1 - speedNorm * 0.45);
          }

          try {
            Sound.play(contPalette.voice || 'epiano', hTime(Sound.currentTime), freq, vel, phraseDec);
            _noteCount++;
          } catch (e) { _errorCount++; }
        }
      }
    }
  }


  // ═══════════════════════════════════════════════════════════════════════
  // 8. PRODIGY — Musical Intelligence
  // ═══════════════════════════════════════════════════════════════════════
  //
  // Watches rolling energy windows. Makes mix decisions based on
  // music theory + the user's patterns. Faster than the human mind.
  //
  // Research:
  //   Huron 2006 — ITPRA theory: expectation drives emotion
  //   Meyer 1956 — Emotion = violation of expectation

  function updateProdigy(dt) {
    if (!_lens || _isSilent) return;
    var energy = Body.energy;

    // Sample energy into rolling window
    _prodigy.sampleTimer += dt;
    if (_prodigy.sampleTimer >= 0.25) {
      _prodigy.sampleTimer = 0;
      _prodigy.energyHistory[_prodigy.energyHead] = energy;
      _prodigy.energyHead = (_prodigy.energyHead + 1) & 15;
    }

    // Track degree usage
    var di = Math.max(0, Math.min(14, _currentDegree + 7));
    _prodigy.degreeHeat[di] += 0.1;
    for (var i = 0; i < 15; i++) _prodigy.degreeHeat[i] *= _prodigy.degreeDecay;

    // Classify energy arc
    var recent4 = 0, older4 = 0;
    for (var j = 0; j < 4; j++) {
      recent4 += _prodigy.energyHistory[(_prodigy.energyHead - 1 - j + 16) & 15];
      older4  += _prodigy.energyHistory[(_prodigy.energyHead - 5 - j + 16) & 15];
    }
    recent4 /= 4; older4 /= 4;
    var diff = recent4 - older4;

    var prevArc = _prodigy.arc;
    if (diff > 1.5) { _prodigy.arc = 'rising'; _prodigy.arcStrength = Math.min(1, diff / 4); }
    else if (diff < -1.5) { _prodigy.arc = 'falling'; _prodigy.arcStrength = Math.min(1, -diff / 4); }
    else if (recent4 > 3 && Math.abs(diff) < 1) { _prodigy.arc = 'plateau'; _prodigy.arcStrength = 0.5; }
    else { _prodigy.arc = 'neutral'; _prodigy.arcStrength = 0; }

    if (_prodigy.arc === prevArc) _prodigy.arcDuration += dt;
    else _prodigy.arcDuration = 0;

    // DECISIONS

    // 1. REVERB: calm = spacious cathedral. Intense = tight room.
    var calmness = Math.max(0, 1.0 - energy * 0.08);
    _prodigy.reverbTarget = 0.15 + calmness * 0.35;
    if (_prodigy.arc === 'falling') _prodigy.reverbTarget += 0.15;
    if (_filterWater) {
      var turbBoost = Math.min(0.22, _filterWater.turbulence() * 0.14);
      _prodigy.reverbTarget = Math.min(0.88, _prodigy.reverbTarget + turbBoost);
    }
    if (typeof Sound !== 'undefined') {
      try { Sound.setReverbMix(_prodigy.reverbTarget); } catch (e) {}
    }

    // 2. FILTER BIAS + ANTICIPATION-RESOLUTION (Salimpoor 2011: two-phase dopamine)
    //
    // Anticipation: rising energy = building brightness + space (caudate dopamine)
    if (_prodigy.arc === 'rising') {
      _prodigy.filterBias += (600 - _prodigy.filterBias) * 2.5 * dt; // brighter
      _prodigy.reverbTarget = Math.min(0.65, _prodigy.reverbTarget + dt * 0.08); // more space

      // Long rise (>4s) = building tension via subtle pitch detuning
      if (_prodigy.arcDuration > 4) {
        _prodigy.tensionDetune = Math.min(8, _prodigy.tensionDetune + dt * 1.5); // cents
      }
    } else if (_prodigy.arc === 'falling') {
      _prodigy.filterBias += (-300 - _prodigy.filterBias) * 1.5 * dt;
    } else {
      _prodigy.filterBias += (0 - _prodigy.filterBias) * 1.0 * dt;
    }

    // Resolution: falling after rising = release (nucleus accumbens dopamine)
    if (_prodigy.arc === 'falling' && _prodigy.prevArc === 'rising') {
      // Brief filter bloom on the transition moment
      _prodigy.filterBias = 800; // momentary brightness burst
      _prodigy.tensionDetune = 0; // snap to unison — resolution
    }

    // Decay tension detuning when not rising
    if (_prodigy.arc !== 'rising' && _prodigy.tensionDetune > 0) {
      _prodigy.tensionDetune *= (1 - dt * 3.0); // quick decay
      if (_prodigy.tensionDetune < 0.1) _prodigy.tensionDetune = 0;
    }

    _filterTarget += _prodigy.filterBias;

    // Weather influence: humidity opens filter (Everett 2015), temperature widens intervals
    if (typeof Weather !== 'undefined' && Weather.state && Weather.state.isLoaded) {
      var weatherInfluence = (_lens.weather && _lens.weather.humidityInfluence) || 0;
      _filterTarget *= 1 + (Weather.filterOpenness - 1) * weatherInfluence;
    }

    _filterTarget = Math.max(120, Math.min(4000, _filterTarget));

    // 3. DYNAMIC RANGE: volatile = compress. Steady = expand.
    var volatility = 0;
    for (var m = 1; m < 8; m++) {
      var e1 = _prodigy.energyHistory[(_prodigy.energyHead - m + 16) & 15];
      var e2 = _prodigy.energyHistory[(_prodigy.energyHead - m - 1 + 16) & 15];
      volatility += Math.abs(e1 - e2);
    }
    volatility /= 7;
    if (volatility > 3) {
      _prodigy.dynamicRange += (0.7 - _prodigy.dynamicRange) * 1.0 * dt;
    } else {
      _prodigy.dynamicRange += (1.0 - _prodigy.dynamicRange) * 0.5 * dt;
    }

    // 4. MOMENT RECOGNITION — when everything aligns
    // (Cheung et al 2019: high uncertainty + resolution = peak pleasure)
    _prodigy._momentCooldown = Math.max(0, _prodigy._momentCooldown - dt);
    var momentConditions = (
      _prodigy.arc === 'rising' &&
      energy > 0.6 &&
      _phraseActive && _phraseEnergyArc > 0.5 && _phraseEnergyArc < 0.85 &&
      Harmony.tension > 0.4 &&
      _sessionPhase >= 2 &&
      _prodigy._momentCooldown <= 0
    );
    if (momentConditions) {
      _prodigy._momentCooldown = 30;
      _prodigy.filterBias = 600;
      _prodigy.reverbTarget = Math.min(0.85, _prodigy.reverbTarget + 0.25);
      if (typeof Sound !== 'undefined') {
        try { Sound.setMasterGain(Math.min(0.9, _fadeGain + 0.15)); } catch (e) {}
      }
    }

    // Track arc transitions for anticipation-resolution detection
    _prodigy.prevArc = _prodigy.arc;
  }


  // ═══════════════════════════════════════════════════════════════════════
  // 9. MUSICAL INTENT + CALL & RESPONSE
  // ═══════════════════════════════════════════════════════════════════════

  function parseIntent(mag, now) {
    _intentBuf[_intentHead % 24] = mag;
    _intentHead++;
    var recent = 0, older = 0;
    for (var i = 0; i < 12; i++) {
      recent += _intentBuf[(_intentHead - 1  - i + 24) % 24];
      older  += _intentBuf[(_intentHead - 13 - i + 24) % 24];
    }
    var risingEnergy = recent > older * 1.18;

    if (Rhythm.tempoLocked && Body.rhythmConfidence > 0.55) {
      _currentIntent = INTENT.GROOVE;
    } else if (mag < 0.18) {
      _currentIntent = INTENT.BREATH;
    } else if (_phraseActive && _phraseEnergyArc > 0.75 && !risingEnergy) {
      _currentIntent = INTENT.RESOLUTION;
    } else if (_phraseActive && risingEnergy && _phraseEnergyArc < 0.55) {
      _currentIntent = INTENT.QUESTION;
    } else {
      _currentIntent = INTENT.STATEMENT;
    }
  }

  function buildAnswer(deg, tension, arc, magnitude) {
    var sp = (Rhythm.tempoLocked && Rhythm.tempo > 0)
      ? (60000 / Rhythm.tempo / 2) : 400;

    if (magnitude > 2.8) {
      return [{ deg: 0, delayMs: 0, vel: 0.28 }];
    }
    if (tension > 0.62 || arc > 0.72) {
      return [
        { deg: 4, delayMs: 0,      vel: 0.32 },
        { deg: 2, delayMs: sp,     vel: 0.26 },
        { deg: 0, delayMs: sp * 2, vel: 0.40 },
      ];
    }
    if (deg >= 4) {
      return [
        { deg: Math.max(2, deg - 1), delayMs: 0,      vel: 0.28 },
        { deg: Math.max(0, deg - 3), delayMs: sp,     vel: 0.32 },
        { deg: 0,                    delayMs: sp * 2, vel: 0.38 },
      ];
    }
    return [
      { deg: deg + 2,              delayMs: 0,      vel: 0.26 },
      { deg: Math.min(6, deg + 4), delayMs: sp,     vel: 0.30 },
      { deg: 2,                    delayMs: sp * 2, vel: 0.35 },
    ];
  }

  function triggerCallResponse(magnitude, now, deg) {
    if (_sessionPhase < 1) return;
    if (_crCooldown > now) return;
    if (_currentIntent === INTENT.GROOVE) return;
    if (_answerPending) return;
    if (Body.energy < 0.25) return;

    _answerNotes = buildAnswer(deg, Harmony.tension, _phraseEnergyArc, magnitude);

    if (Rhythm.tempoLocked && Rhythm.tempo > 0) {
      var beatMs = 60000 / Rhythm.tempo;
      var beatsAway = Math.random() < 0.5 ? 2 : 4;
      _answerTime = now + beatMs * beatsAway;
    } else {
      _answerTime = now + 1500 + Math.random() * 2000;
    }
    _answerIdx = 0;
    _answerPending = true;
    _crCooldown = now + 10000 + Math.random() * 4000;
  }

  function processAnswer(now) {
    if (!_answerPending || !_lens || typeof Sound === 'undefined' || !Sound.ctx) return;
    if (_currentIntent === INTENT.STATEMENT || _currentIntent === INTENT.GROOVE) {
      _answerPending = false; return;
    }
    if (_isSilent || Body.energy < 0.08) {
      _answerPending = false; return;
    }
    if (now < _answerTime) return;

    if (_answerIdx < _answerNotes.length) {
      var note = _answerNotes[_answerIdx];
      if (now >= _answerTime + note.delayMs) {
        var h = _lens.palette && _lens.palette.harmonic;
        if (h) {
          var freq = Harmony.freq(note.deg, h.octave || 0);
          try {
            Sound.play(h.voice || 'epiano', hTime(Sound.currentTime),
              freq, note.vel * _fadeGain, h.decay || 1.8);
          } catch (e) { _errorCount++; }
          Harmony.recordNote(note.deg);
        }
        _answerIdx++;
      }
    } else {
      _answerPending = false;
    }
  }


  // ═══════════════════════════════════════════════════════════════════════
  // 10. PHRASE SYSTEM
  // ═══════════════════════════════════════════════════════════════════════

  function updatePhrase(mag, now, dt) {
    if (_phraseCooldown > 0) _phraseCooldown -= dt;

    if (!_phraseActive) {
      if (mag > 0.5 && _phraseCooldown <= 0) {
        _phraseActive = true;
        _phrasePeakCount = 0;
        _phraseStartTime = now;
        _phraseMaxMag = mag;
        _phraseEnergyArc = 0;
        Harmony.startPhrase();
        Harmony.pickPhraseContour(Body.archetype,
          (_lens.emotion && _lens.emotion.phraseShape) || null);
      }
    } else {
      var phraseDuration = now - _phraseStartTime;
      if (mag > _phraseMaxMag) _phraseMaxMag = mag;

      var phraseLen = Math.min(8000, Math.max(2000,
        Rhythm.tempoLocked ? Rhythm.state.beatInterval * 8 : 4000));
      _phraseEnergyArc = Math.min(1, phraseDuration / phraseLen);

      if (_phraseEnergyArc < 0.4) {
        _phraseIntensityFactor = 0.45 + (_phraseEnergyArc / 0.4) * 0.55;
      } else if (_phraseEnergyArc < 0.8) {
        _phraseIntensityFactor = 1.0;
      } else {
        _phraseIntensityFactor = 1.0 - (_phraseEnergyArc - 0.8) / 0.2;
      }

      if (mag < 0.15 && phraseDuration > 1000) {
        endPhrase(now);
      } else if (phraseDuration > phraseLen) {
        endPhrase(now);
      }
    }
  }

  function endPhrase(now) {
    _phraseActive = false;
    _phraseCooldown = 0.5;
    _phraseIntensityFactor = 1.0;

    Harmony.endPhrase(_phraseMaxMag);

    // Resolution chord — the musical full stop
    if (_lens && _lens.palette && _lens.palette.harmonic
        && typeof Sound !== 'undefined' && Sound.ctx
        && !_isSilent && _fadeGain > 0.15) {
      var h = _lens.palette.harmonic;
      var resVel = Math.min(0.55, 0.20 + _fadeGain * 0.30 + (_phraseMaxMag || 0) * 0.05);

      var chord;
      if (Harmony.tension > 0.6) {
        chord = [0, 2, 4, 6];
      } else if (Harmony.hrState === 'tension') {
        chord = [4, 2, 0];
      } else {
        chord = [0, 2, 4];
      }

      var chordSpacing = (Rhythm.tempoLocked && Rhythm.tempo > 0)
        ? Math.max(80, 60000 / Rhythm.tempo / 4) : 120;

      // Schedule via Web Audio time (no setTimeout — principle: no clocks make musical decisions)
      var baseTime = (typeof Sound !== 'undefined' && Sound.ctx) ? hTime(Sound.currentTime) : 0;
      for (var ci = 0; ci < chord.length; ci++) {
        try {
          var noteVel = resVel * (1 - ci * (0.10 / chord.length));
          Sound.play(h.voice || 'epiano', baseTime + (ci * chordSpacing / 1000),
            Harmony.freq(chord[ci], h.octave || 0), noteVel, h.decay || 1.8);
        } catch (e) { _errorCount++; }
      }
      _noteCount++;
    }

    if (_epiAdvancePending) checkEpigeneticAdvance(now);
  }


  // ═══════════════════════════════════════════════════════════════════════
  // 11. FOUNDATION DRONE
  // ═══════════════════════════════════════════════════════════════════════

  function manageDrone(dt) {
    if (!_lens || typeof Sound === 'undefined' || !Sound.ctx) return;
    var tex = _lens.palette && _lens.palette.texture;
    if (!tex) return;

    var foundationVol = (tex.vol || 0.06) * 3.5;
    var targetGain = _isSilent ? 0 : _fadeGain * foundationVol;

    if (targetGain > 0.01 && !_droneActive) {
      var base = Harmony.hrOffset;
      var oct = tex.octave || -1;
      var oscs = [
        { wave: tex.wave || 'sine', freq: Harmony.freq(base, oct),     gain: 0.22 },
        { wave: 'triangle',         freq: Harmony.freq(base, oct),     gain: 0.12, detune: 6 },
        { wave: tex.wave || 'sine', freq: Harmony.freq(base, oct - 1), gain: 0.18 },
        { wave: tex.wave || 'sine', freq: Harmony.freq(base + 7, oct), detune: tex.detune || 8, gain: 0.12 },
      ];
      try {
        Sound.createLayer('flow-drone', {
          oscillators: oscs,
          filter: { type: 'lowpass', freq: 1200, Q: 0.5 },
          reverbSend: tex.reverbSend || 0.4,
        });
        _droneActive = true;
      } catch (e) { _errorCount++; }
    }

    if (_droneActive) {
      _droneGain += (targetGain - _droneGain) * 0.02;
      try { Sound.setLayerGain('flow-drone', _droneGain); } catch (e) {}

      if (_droneGain < 0.005) {
        try { Sound.destroyLayer('flow-drone'); } catch (e) {}
        _droneActive = false;
        _droneGain = 0;
      }
    }
  }

  function updateFoundationPitch() {
    if (!_droneActive || !_lens || !_lens.palette || !_lens.palette.texture) return;
    var tex = _lens.palette.texture;
    var oct = tex.octave || -1;
    var base = Harmony.hrOffset;
    var freqs = [Harmony.freq(base, oct), Harmony.freq(base + 7, oct)];
    try { Sound.setLayerFreqs('flow-drone', freqs, 1.8); } catch (e) {}
  }


  // ═══════════════════════════════════════════════════════════════════════
  // 12. GYRO -> FILTER
  // ═══════════════════════════════════════════════════════════════════════

  function updateGyroFilter(sensor) {
    if (!_lens) return;

    var gyroMag = 0;
    if (sensor.hasOrientation) {
      if (_gyroPrevBeta !== null) {
        var dbeta = Math.abs(sensor.beta - _gyroPrevBeta);
        var dgamma = Math.abs(sensor.gamma - _gyroPrevGamma);
        if (dbeta > 90) dbeta = 0;
        if (dgamma > 90) dgamma = 0;
        gyroMag = dbeta + dgamma;
      }
      _gyroPrevBeta = sensor.beta;
      _gyroPrevGamma = sensor.gamma;
    }

    _gyroMagSmooth += (gyroMag - _gyroMagSmooth) * 0.15;

    var range = (_lens.response && _lens.response.filterRange) || [200, 2800];

    if (_filterWater) {
      var filterTilt = Math.min(1, _gyroMagSmooth / 3) * 2 - 1;
      _filterWater.update(filterTilt, 0.016);
      var norm = _filterWater.level;
    } else {
      var norm = Math.min(1, _gyroMagSmooth / 3);
    }
    _filterTarget = range[0] + norm * (range[1] - range[0]);
    _filterFreq += (_filterTarget - _filterFreq) * 0.08;

    if (_droneActive) {
      try { Sound.setLayerFilter('flow-drone', _filterFreq, 0.05); } catch (e) {}
    }
  }


  // ═══════════════════════════════════════════════════════════════════════
  // 13. VOID DRONE
  // ═══════════════════════════════════════════════════════════════════════

  function updateVoid(dt) {
    if (typeof Sound === 'undefined' || !Sound.ctx) return;

    var targetPresence = _isSilent ? Math.min(1, _stillnessTimer / 8.0) : 0;
    var exitRate = Body.energy > 0.6 ? 0.018 : 0.007;
    var rate = _isSilent ? 0.025 : exitRate;
    _voidPresence += (targetPresence - _voidPresence) * rate;

    if (_voidPresence > 0.04) {
      if (!_voidEngaged) {
        _voidEngaged = true;
        try {
          Sound.createLayer('void-wind', {
            noise: 'pink',
            filter: { type: 'bandpass', freq: 700, Q: 2.2 },
            gain: 0,
            reverbSend: 0.90,
          });
        } catch (e) {}
      }
      try { Sound.setVoidBreath(Body.breathPhase, _voidPresence); } catch (e) {}
      var windVol = Math.min(0.18, _voidPresence * 0.24);
      try { Sound.setLayerGain('void-wind', windVol, 4.0); } catch (e) {}
      var sweepFreq = 500 + Math.sin(Body.breathPhase) * 340;
      try { Sound.setLayerFilter('void-wind', Math.max(150, sweepFreq), 1.8); } catch (e) {}
    } else if (_voidEngaged) {
      _voidEngaged = false;
      try { Sound.setLayerGain('void-wind', 0, 3.0); } catch (e) {}
      setTimeout(function () { try { Sound.destroyLayer('void-wind'); } catch (e) {} }, 3500);
      try { Sound.setVoidGain(0, 3.0); } catch (e) {}
    }
  }


  // ═══════════════════════════════════════════════════════════════════════
  // 14. DRUM TRIGGERING
  // ═══════════════════════════════════════════════════════════════════════
  //
  // Reads Rhythm.state, applies presence gates, calls Sound.playDrum().
  // rhythm.js generates the patterns — flow.js decides what to play.

  function setupDrumCallback() {
    Rhythm.setCallback(function (time, velocity, instrument, kit) {
      if (_isSilent || typeof Sound === 'undefined' || !Sound.ctx) return;
      try { Sound.playDrum(instrument, time, velocity, kit); } catch (e) {}
    });
  }


  // ═══════════════════════════════════════════════════════════════════════
  // 15. BERLYNE STEERING + GROKKING
  // ═══════════════════════════════════════════════════════════════════════

  function updateBerlyne(dt) {
    if (!_berlyne) return;
    _berlyne.update('harmonic', Math.abs(_currentDegree) / 7);
    var noteRate = _noteCount > 0
      ? Math.min(1, (_noteCount / Math.max(1, _sessionEngagedTime)) / 4) : 0;
    _berlyne.update('rhythmic', noteRate);
    _berlyne.update('timbral', Math.min(1, Math.abs(_prodigy.filterBias) / 400));
    _berlyne.update('dynamic', Math.min(1, Body.energy));

    var suggestion = _berlyne.suggest();
    if (suggestion && suggestion.urgency > 0.3) {
      if (suggestion.dimension === 'dynamic' && suggestion.direction === 'simplify') {
        _prodigy.filterBias *= 0.9;
      }
    }
  }

  function updateGrok() {
    if (!_grok || _isSilent) return;
    _grok.sample(Body.energy, Math.abs(_currentDegree) / 7);

    if (_grok.grokked && performance.now() - _grok.grokTime < 3000) {
      _prodigy.filterBias = Math.max(_prodigy.filterBias, 300);
      _prodigy.reverbTarget = Math.min(0.80, _prodigy.reverbTarget + 0.15);
    }
  }


  // ═══════════════════════════════════════════════════════════════════════
  // 16. PEAK HANDLER (organic pipeline)
  // ═══════════════════════════════════════════════════════════════════════

  function onPeak(magnitude, now) {
    if (!_lens || typeof Sound === 'undefined' || !Sound.ctx) return;
    if (_sessionPhase === 0) return;

    try {
      var time = hTime(Sound.currentTime);
      var vel = Math.min(1, magnitude / 4) * _phraseIntensityFactor;
      var palette = _lens.palette || {};

      // Peak voice — chord tone nearest to melody
      if (palette.peak && vel > 0.08) {
        var p = palette.peak;
        var chordTones = [0, 2, 4, 7];
        var peakDeg = 0, minD = 99;
        for (var ci = 0; ci < chordTones.length; ci++) {
          for (var oi = -1; oi <= 1; oi++) {
            var cand = chordTones[ci] + oi * 7;
            var d = Math.abs(cand - _currentDegree);
            if (d < minD) { minD = d; peakDeg = cand; }
          }
        }
        var freq = Harmony.freq(peakDeg, p.octave || -1);
        var peakVel = Math.min(0.92, vel * 0.82 * (_sessionPhase === 1 ? 0.55 : 1.0));
        Sound.play(p.voice || 'piano', time, freq, peakVel, p.decay || 0.8);
        _noteCount++;
      }

      // Delayed harmonic answer
      if (palette.harmonic && vel > 0.38 && _sessionPhase >= 1) {
        var h = palette.harmonic;
        var answerDeg = Harmony.tension > 0.65 ? 0
          : _phraseEnergyArc > 0.55 ? 4
          : _currentDegree % 7;
        var hFreq = Harmony.freq(answerDeg, h.octave || 0);
        Sound.play(h.voice || 'epiano', time + 0.32, hFreq, vel * 0.20, h.decay || 1.0);
      }

      // Call & response
      if (_phrasePeakCount >= 2 && _phraseEnergyArc > 0.2) {
        triggerCallResponse(magnitude, now, _currentDegree);
      }

      _phrasePeakCount++;
      if (magnitude > _phraseMaxMag) _phraseMaxMag = magnitude;
      _sessionEnergyAccum += Math.min(1, magnitude / 3);
    } catch (e) { _errorCount++; }
  }


  // ═══════════════════════════════════════════════════════════════════════
  // 17. TENSION ARC (deceptive cadence)
  // ═══════════════════════════════════════════════════════════════════════

  function hasTensionArc() {
    return _lens && _lens.emotion && _lens.emotion.tensionArc;
  }

  function tensionPlayNote(type) {
    if (typeof Sound === 'undefined' || !Sound.ctx || !_lens) return;
    var now = Sound.currentTime;
    var base = Harmony.root * 0.25;

    if (type === 'dominant') {
      try { Sound.play('piano', now, base * 1.498, 0.20, 5.0); } catch (e) {}
    } else if (type === 'deceptive') {
      try { Sound.play('piano', now, base * 1.682, 0.16, 4.0); } catch (e) {}
    } else if (type === 'resolve') {
      try { Sound.play('piano', now, base, 0.42, 6.0); } catch (e) {}
      try { Sound.play('piano', now + 0.08, base * 2, 0.30, 5.0); } catch (e) {}
      try { Sound.play('piano', now + 0.18, Harmony.root, 0.22, 4.0); } catch (e) {}
    }
  }

  function updateTensionArc(dt) {
    if (!hasTensionArc() || _sessionPhase < 2) return;
    _tensionArc.timer += dt;

    if (_tensionArc.phase === 'idle') {
      if (_sessionEngagedTime > 20 && _tensionArc.timer > 8) {
        _tensionArc.phase = 'building';
        _tensionArc.timer = 0;
        _tensionArc.buildTime = 10 + Math.random() * 6;
        _tensionArc.fired = false;
      }
    } else if (_tensionArc.phase === 'building') {
      if (_isSilent) { _tensionArc.timer -= dt * 1.5; return; }
      if (_tensionArc.timer >= _tensionArc.buildTime) {
        _tensionArc.phase = (_tensionArc.level >= _tensionArc.maxMisses) ? 'resolving' : 'near-miss';
        _tensionArc.timer = 0;
        _tensionArc.fired = false;
      }
    } else if (_tensionArc.phase === 'near-miss') {
      if (!_tensionArc.fired && _tensionArc.timer > 0.1) {
        _tensionArc.fired = true;
        tensionPlayNote('dominant');
      }
      if (_tensionArc.timer > 2.2 && !_tensionArc._deceptiveFired) {
        _tensionArc._deceptiveFired = true;
        tensionPlayNote('deceptive');
        _tensionArc.level++;
      }
      if (_tensionArc.timer > 4.0) {
        _tensionArc.phase = 'building';
        _tensionArc.timer = 0;
        _tensionArc._deceptiveFired = false;
        _tensionArc.fired = false;
        _tensionArc.buildTime = Math.max(5, 10 - _tensionArc.level * 1.5 + Math.random() * 3);
      }
    } else if (_tensionArc.phase === 'resolving') {
      if (!_tensionArc.fired && _tensionArc.timer > 0.1) {
        _tensionArc.fired = true;
        tensionPlayNote('dominant');
      }
      if (_tensionArc.timer > 1.8 && !_tensionArc._resolveFired) {
        _tensionArc._resolveFired = true;
        tensionPlayNote('resolve');
        try { Sound.setReverbMix(Math.min(0.94, (_lens.space && _lens.space.reverbMix || 0.45) + 0.40)); } catch (e) {}
      }
      if (_tensionArc.timer > 6.0) {
        _tensionArc.phase = 'cooldown';
        _tensionArc.timer = 0;
        _tensionArc.level = 0;
        _tensionArc._resolveFired = false;
        try { Sound.setReverbMix((_lens.space && _lens.space.reverbMix) || 0.45); } catch (e) {}
      }
    } else if (_tensionArc.phase === 'cooldown') {
      if (_tensionArc.timer > 40) {
        _tensionArc.phase = 'idle';
        _tensionArc.timer = 0;
      }
    }
  }


  // ═══════════════════════════════════════════════════════════════════════
  // 18. EPIGENETIC EVOLUTION
  // ═══════════════════════════════════════════════════════════════════════

  function checkEpigeneticAdvance(now) {
    if (_sessionPhase < 2) return;
    if (_sessionEnergyAccum < _epi.energyGate) return;
    if (_phraseActive) { _epiAdvancePending = true; return; }
    _epiAdvancePending = false;

    _generation++;
    _epi.harmonyCarry = Harmony.centroid;
    _epi.spaceMix     = Math.min(0.40, _generation * 0.10);
    _epi.massiveFloor = Math.min(3, _generation);
    _epi.energyGate   = 24 + _generation * 8;
    _sessionEnergyAccum = 0;
  }


  // ═══════════════════════════════════════════════════════════════════════
  // 19. THREE-ACT ARC
  // ═══════════════════════════════════════════════════════════════════════

  function checkActAdvance() {
    if (!_lens || !_baseScale || _sessionPhase < 1) return;

    if (_sessionAct === 0 && _sessionEngagedTime >= 90) {
      _sessionAct = 1;
      // Sus4: replace the 3rd with the 4th — open, floating
      var newScale = _baseScale.slice();
      newScale[2] = newScale[3];
      Harmony.configure({ root: Harmony.root, mode: Harmony.mode, _scaleOverride: newScale });
    } else if (_sessionAct === 1 && _sessionEngagedTime >= 300) {
      _sessionAct = 2;
      // Homecoming: restore original mode
      Harmony.configure({ root: Harmony.root, mode: Harmony.mode, _scaleOverride: _baseScale.slice() });
    }
  }


  // ═══════════════════════════════════════════════════════════════════════
  // 20. ORGANIC PIPELINE UPDATE
  // ═══════════════════════════════════════════════════════════════════════

  function updateOrganic(sensor, now, dt) {
    var mag = Body.energy;

    updatePhrase(mag, now, dt);
    parseIntent(mag, now);

    // Brain void override
    if (Body.voidState >= Body.VOID.SETTLING && !_isSilent) {
      var vThresh = (_lens.response && _lens.response.stillnessThreshold) || 0.2;
      if (mag < vThresh * 3) {
        _isSilent = true;
        if (_phraseActive) endPhrase(now);
      }
    }

    // Peak detection -> musical event
    if (Body.peaked) {
      onPeak(Body.peakMagnitude, now);
    }

    // LEAD: tilt -> pitch
    updateTiltPitch(sensor, now, dt);

    // ANSWER: call & response
    processAnswer(now);

    // SPACE: filter + drone + harmonic rhythm
    updateGyroFilter(sensor);
    _energySmooth += (mag - _energySmooth) * 0.03;
    manageDrone(dt);

    // Harmonic rhythm and gravity (body-driven chord changes)
    Harmony.updateHarmonicRhythm(dt, _prodigy.arc, Body.energy);
    Harmony.updateHarmonicGravity(dt, Body.energy, _isSilent);

    // Session evolution
    if (!_isSilent && _sessionPhase >= 2) _sessionEnergyAccum += _energySmooth * dt;
    checkEpigeneticAdvance(now);
    checkActAdvance();
    updateTensionArc(dt);

    // Organic stage evolution (Journey lens)
    updateOrganicStage(dt);
  }


  // ═══════════════════════════════════════════════════════════════════════
  // 21. ORGANIC STAGE SYSTEM (Journey lens)
  // ═══════════════════════════════════════════════════════════════════════

  function resetOrganicStage() {
    _organicStage.current = 0;
    _organicStage.timer = 0;
    _organicStage.transitioning = false;
    _organicStage.transitionProgress = 0;
    _organicStage.lastApplied = -1;
    _organicStage.order = null;
  }

  function updateOrganicStage(dt) {
    if (!_lens || !_lens.stages) return;
    var stages = _organicStage.order || _lens.stages;
    if (!stages || stages.length === 0) return;

    // Timer only advances when engaged
    if (Body.energy > 0.10) _organicStage.timer += dt;

    var effectiveDuration = _organicStage.stageDuration;
    if (Body.energy > 0.4) effectiveDuration *= 1.3;
    if (Body.energy < 0.15 && _organicStage.timer > 60) effectiveDuration *= 0.7;

    if (_organicStage.current < stages.length - 1 &&
        _organicStage.timer >= effectiveDuration &&
        !_organicStage.transitioning) {
      _organicStage.transitioning = true;
      _organicStage.transitionProgress = 0;
    }

    if (_organicStage.transitioning) {
      _organicStage.transitionProgress += dt / _organicStage.crossfadeDuration;
      if (_organicStage.transitionProgress >= 1) {
        _organicStage.transitionProgress = 1;
        _organicStage.transitioning = false;
        _organicStage.current++;
        _organicStage.timer = 0;
        applyStageConfig(stages[_organicStage.current]);
        _organicStage.lastApplied = _organicStage.current;
      } else if (_organicStage.transitionProgress >= 0.5 &&
                 _organicStage.lastApplied !== _organicStage.current + 1) {
        applyStageConfig(stages[_organicStage.current + 1]);
        _organicStage.lastApplied = _organicStage.current + 1;
      }
    }

    // Apply initial stage if not yet applied
    if (_organicStage.lastApplied === -1 && stages.length > 0) {
      applyStageConfig(stages[0]);
      _organicStage.lastApplied = 0;
    }
  }

  function applyStageConfig(stage) {
    if (!stage || !_lens) return;
    _lens.palette = stage.palette;
    _lens.response = stage.response;
    _lens.emotion = stage.emotion;
    _lens.motion = stage.motion;
    _lens.tone = stage.tone;
    _lens.space = stage.space;

    if (stage.harmony) {
      Harmony.configure({
        root: stage.harmony.root || 432,
        mode: stage.harmony.mode || 'major',
      });
      _baseScale = Harmony.scale.slice();
    }

    var adaptedResp = Body.motionProfile.adapt(stage.response || {});
    _adaptedPeakThresh = adaptedResp.peakThreshold || null;
    _adaptedStillThresh = adaptedResp.stillnessThreshold || null;

    if (typeof Sound !== 'undefined') {
      try { Sound.configure(_lens); } catch (e) {}
    }
  }


  // ═══════════════════════════════════════════════════════════════════════
  // 22. GRID PIPELINE
  // ═══════════════════════════════════════════════════════════════════════
  //
  // A DJ set built from body movement. The clock NEVER stops.
  // Motion = intensity. Tilt = filter. Peak = DROP.
  // All drums managed by rhythm.js in grid mode.

  function initGrid() {
    if (!_lens || !_lens.edm) return;
    var edm = _lens.edm;
    _grid.active = true;
    _grid.started = false;
    _grid.bpm = edm.bpm || 128;
    _grid.stepDur = 60 / _grid.bpm / 4;
    _grid.clock = 0;
    _grid.lastStep = -1;
    _grid.totalBars = 0;
    _grid.lastBar = -1;
    _grid.phase = 'waiting';
    _grid.phaseTimer = 0;
    _grid.buildLevel = 0;
    _grid.intensity = 0;
    _grid.djGain = 0;
    _grid.pumpIntensity = 0;
    _grid.tiltNorm = 0.5;
    _grid.tiltZone = 1;
    _grid.tiltZoneSmooth = 1;
    _grid.rollNorm = 0;
    _grid.filterSmooth = 800;
    _grid.killActive = false;
    _grid.cycle = 0;
    _grid.segment = 0;
    _grid.lastSegment = -1;
    _grid.setTime = 0;
    _grid.rootShift = 0;
    _grid.nextRootShift = 0;
    _grid.currentRootFreq = Harmony.root;

    // Reset melodic state
    _grid.bassActive = false;
    _grid.lastBassStep = -1;
    _grid.lastStabStep = -1;
    _grid.lastLeadStep = -1;
    _grid.riserFilterFreq = 200;
    _grid.leadDegree = 0;

    // Configure rhythm.js for grid mode
    Rhythm.configure({
      mode: 'grid',
      bpm: _grid.bpm,
      profile: '808',
      fullPresence: true,
    });

    if (typeof Sound !== 'undefined') {
      try { Sound.configure(_lens); } catch (e) {}
    }

    // Create bass sub layer — continuous bass that follows root
    if (typeof Sound !== 'undefined' && Sound.ctx) {
      var bassRoot = Harmony.root;
      while (bassRoot > 110) bassRoot /= 2;
      try {
        Sound.createLayer('grid-bass', {
          oscillators: [
            { wave: 'sine', freq: bassRoot, gain: 0.35 },
            { wave: 'triangle', freq: bassRoot, gain: 0.12 },
          ],
          filter: { type: 'lowpass', freq: 250, Q: 0.7 },
          gain: 0,
        });
        _grid.bassActive = true;
      } catch (e) {}
    }
  }

  function teardownGrid() {
    _grid.active = false;
    _grid.started = false;
    if (_grid.bassActive && typeof Sound !== 'undefined') {
      try { Sound.destroyLayer('grid-bass'); } catch (e) {}
      _grid.bassActive = false;
    }
    Rhythm.reset();
  }

  function updateGrid(sensor, now, dt) {
    if (!_lens || !_lens.edm || typeof Sound === 'undefined' || !Sound.ctx) return;
    var edm = _lens.edm;

    var energy = Body.energy;
    var medEnergy = Body.medium ? Body.medium.energy() : 0;

    _grid.setTime += dt;
    _grid.phaseTimer += dt;

    // Start on first motion
    if (!_grid.started) {
      if (energy > 0.12) {
        _grid.started = true;
        _grid.phase = 'intro';
        _grid.phaseTimer = 0;
        _isSilent = false;
        _fadeGain = 0.5;
      } else {
        if (Sound.ctx) try { Sound.setMasterGain(0); } catch (e) {}
        return;
      }
    }

    // Tilt -> filter (the DJ knob)
    var beta = (sensor.beta || 62) - 62;
    var rawTilt = Math.max(0, Math.min(1, (beta + 30) / 60));
    _grid.tiltNorm += (rawTilt - _grid.tiltNorm) * 0.035;

    var filterRange = edm.filterRange || [200, 6000];
    var zoneFilter = filterRange[0] + _grid.tiltNorm * (filterRange[1] - filterRange[0]);

    // Touch = kill switch
    var touching = sensor.touching || false;
    _grid.killActive = touching;

    var filterTarget = _grid.killActive ? filterRange[0] * 0.4 : zoneFilter;
    _grid.filterSmooth += (filterTarget - _grid.filterSmooth) * 0.04;
    try { Sound.setFilter(_grid.filterSmooth); } catch (e) {}

    // Intensity tracks medium energy
    var presenceFloor = energy > 0.08 ? Math.min(0.30, _grid.setTime * 0.001) : 0;
    var targetIntensity = Math.max(presenceFloor, Math.min(1, medEnergy * 0.85));
    var iRise = targetIntensity > _grid.intensity ? 0.06 : 0.02;
    _grid.intensity += (targetIntensity - _grid.intensity) * iRise;

    // Pump from peaks
    if (Body.peaked) {
      _grid.pumpIntensity = Math.min(1, _grid.pumpIntensity + 0.25);
    } else {
      _grid.pumpIntensity *= 0.985;
    }

    // DJ gain
    var presenceGain = energy > 0.08 ? Math.min(0.45, 0.25 + _grid.setTime * 0.0008) : 0.15;
    var targetGain = Math.max(presenceGain, 0.20 + _grid.intensity * 0.50 + _grid.pumpIntensity * 0.10);
    _grid.djGain += (targetGain - _grid.djGain) * 0.03;
    try { Sound.setMasterGain(_grid.djGain); } catch (e) {}

    // Phase machine: intro -> build -> drop -> breakdown
    var peakNow = Body.peaked;
    switch (_grid.phase) {
      case 'intro':
        if (_grid.phaseTimer > 3 || (peakNow && _grid.phaseTimer > 1)) {
          _grid.phase = 'build';
          _grid.phaseTimer = 0;
          _grid.buildLevel = 0;
        }
        break;

      case 'build':
        _grid.buildLevel += _grid.pumpIntensity * dt * 0.10;
        _grid.buildLevel += _grid.intensity * dt * 0.06;
        if (energy > 0.08) _grid.buildLevel += dt * 0.005;
        _grid.buildLevel = Math.min(1, _grid.buildLevel);

        // Sidechain pumps with build
        try { Sound.pumpSidechain(0.25 + _grid.buildLevel * 0.3); } catch (e) {}

        // Drop trigger: user peak during high build
        var armed = _grid.buildLevel > (edm.buildArmLevel || 0.65);
        if (armed && peakNow && _grid.phaseTimer > 6) {
          _grid.phase = 'drop';
          _grid.phaseTimer = 0;
          _grid.buildLevel = 0;
          _grid.cycle++;
        }
        break;

      case 'drop':
        // Full energy
        try { Sound.pumpSidechain(0.65); } catch (e) {}

        if (energy < 0.15 && _grid.phaseTimer > 8) {
          _grid.phase = 'breakdown';
          _grid.phaseTimer = 0;
        }
        if (_grid.phaseTimer > 32 && energy < 0.4) {
          _grid.phase = 'breakdown';
          _grid.phaseTimer = 0;
        }
        break;

      case 'breakdown':
        try { Sound.pumpSidechain(0.15); } catch (e) {}

        if (energy > 0.3 && _grid.phaseTimer > 4) {
          _grid.phase = 'build';
          _grid.phaseTimer = 0;
          _grid.buildLevel = 0;
        }
        break;
    }

    // ── GRID STEP CLOCK ──────────────────────────────────────────────
    // Drive melodic events from the BPM clock.
    // stepDur = duration of one 16th note. 16 steps = 1 bar.
    _grid.clock += dt;
    var currentStep = Math.floor(_grid.clock / _grid.stepDur) % 16;
    var currentBar  = Math.floor(_grid.clock / (_grid.stepDur * 16));
    var newStep = (currentStep !== _grid.lastStep);
    var newBar  = (currentBar !== _grid.lastBar);
    if (newBar) _grid.totalBars = currentBar;
    _grid.lastStep = currentStep;
    _grid.lastBar = currentBar;

    var time = Sound.currentTime;
    var rootFreq = Harmony.root;

    // ── BASS SUB — continuous, pumps with sidechain ────────────────
    if (_grid.bassActive) {
      // Bass gain follows phase — louder during drops, present during builds
      var bassGainTarget = 0;
      if (_grid.phase === 'intro')     bassGainTarget = 0.08;
      if (_grid.phase === 'build')     bassGainTarget = 0.12 + _grid.buildLevel * 0.10;
      if (_grid.phase === 'drop')      bassGainTarget = 0.28;
      if (_grid.phase === 'breakdown') bassGainTarget = 0.06;

      try { Sound.setLayerGain('grid-bass', bassGainTarget * _grid.djGain, 0.3); } catch (e) {}

      // Update bass pitch to follow root — octave down during drops
      var bassRoot = rootFreq;
      while (bassRoot > 110) bassRoot /= 2;
      if (_grid.phase === 'drop') bassRoot /= 2; // octave down for massive sub
      try { Sound.setLayerFreqs('grid-bass', [bassRoot, bassRoot * 2], 0.5); } catch (e) {}
    }

    // ── CHORD STABS — on downbeats, voiced with Harmony ───────────
    if (newStep) {
      var doStab = false;
      var stabVel = 0;

      if (_grid.phase === 'build') {
        // During build: stab every 4 steps (quarter notes), velocity rises with buildLevel
        if (currentStep % 4 === 0 && currentStep !== _grid.lastStabStep) {
          doStab = true;
          stabVel = 0.12 + _grid.buildLevel * 0.18;
        }
      } else if (_grid.phase === 'drop') {
        // During drop: stabs every 2 steps (eighth notes), punchy
        if (currentStep % 2 === 0 && currentStep !== _grid.lastStabStep) {
          doStab = true;
          stabVel = 0.22 + _grid.intensity * 0.15;
        }
      } else if (_grid.phase === 'breakdown') {
        // Breakdown: sparse stabs, beat 1 only, atmospheric
        if (currentStep === 0 && currentStep !== _grid.lastStabStep) {
          doStab = true;
          stabVel = 0.10;
        }
      }

      if (doStab) {
        _grid.lastStabStep = currentStep;
        // Play a chord using Harmony — root, 3rd, 5th
        var stabDeg = _grid.stabPattern[_grid.cycle % _grid.stabPattern.length];
        var chordDegs = [stabDeg, stabDeg + 2, stabDeg + 4];
        for (var ci = 0; ci < chordDegs.length; ci++) {
          try {
            Sound.play('stab', time + ci * 0.008,
              Harmony.freq(chordDegs[ci], 0), stabVel * (1 - ci * 0.06), 0.35);
          } catch (e) {}
        }
      }

      // ── LEAD MELODY — tilt-controlled, during drops ──────────────
      if (_grid.phase === 'drop') {
        // Lead plays every 2 steps, pitch follows tilt position mapped to scale
        if (currentStep % 2 === 1 && currentStep !== _grid.lastLeadStep) {
          _grid.lastLeadStep = currentStep;
          // Map tilt to scale degree range (0-7 = one octave of scale)
          var leadDeg = Math.round(_grid.tiltNorm * 7);
          _grid.leadDegree += (leadDeg - _grid.leadDegree) * 0.4;
          var leadFreq = Harmony.freq(Math.round(_grid.leadDegree), 1);
          var leadVel = 0.18 + _grid.intensity * 0.12;
          try {
            Sound.play('gridstack', time, leadFreq, leadVel, 0.25);
          } catch (e) {}
        }
      }
    }

    // ── RISER — rising filter sweep during build phase ─────────────
    if (_grid.phase === 'build') {
      // Riser: a noise/filtered sweep that rises with buildLevel
      _grid.riserFilterFreq = 200 + _grid.buildLevel * 4800;
      // Play a quiet riser hit at key build thresholds
      if (_grid.buildLevel > 0.3 && !_grid.riserFired && newStep && currentStep === 0) {
        _grid.riserFired = true;
        try {
          Sound.play('massive', time, rootFreq * 2, 0.08 + _grid.buildLevel * 0.12, 2.0);
        } catch (e) {}
      }
      if (_grid.buildLevel > 0.8 && !_grid.snareRollFired && newStep && currentStep === 0) {
        _grid.snareRollFired = true;
        // Snare roll: rapid hits leading into drop
        for (var ri = 0; ri < 8; ri++) {
          try {
            Sound.playDrum('snare', time + ri * _grid.stepDur * 0.5,
              0.15 + ri * 0.08, _lens.rhythm.kit || '808');
          } catch (e) {}
        }
      }
    } else {
      _grid.riserFired = false;
      _grid.snareRollFired = false;
      _grid.riserFilterFreq = 200;
    }

    // Update Rhythm module with body state for drum generation
    Rhythm.update(dt, {
      energy: energy,
      tempo: _grid.bpm,
      tempoLocked: true,
      rhythmConfidence: 1,
      lockStrength: 1,
      isSilent: false,
      peaked: Body.peaked,
      peakMag: Body.peakMagnitude,
      audioTime: Sound.currentTime,
    });
  }


  // ═══════════════════════════════════════════════════════════════════════
  // 23. ASCENSION PIPELINE
  // ═══════════════════════════════════════════════════════════════════════
  //
  // Wall of sound. Detuned unison. No drums. Just a massive harmonic
  // wall that breathes. Tilt = filter. Motion = detune spread.
  // Lean = major/minor path. Peaks = chord progression advances.

  function initAscension() {
    if (!_lens || !_lens.ascension) return;
    _asc.active = true;
    _asc.started = false;
    _asc.time = 0;
    _asc.engagedTime = 0;
    _asc.phase = 'waiting';
    _asc.filterSmooth = _lens.ascension.filterRange[0];
    _asc.spreadSmooth = _lens.ascension.detuneRange[0];
    _asc.masterGain = 0;
    _asc.stillTime = 0;
    _asc.bloom = 0;
    _asc.chordStep = 0;
    _asc.progCycle = 0;
    _asc._progLocked = null;
    _asc._peakCount = 0;
    _asc._startChord = Math.floor(Math.random() * 4);
    _asc.chordStep = _asc._startChord;

    // Build wall layers via Sound
    var cfg = _lens.ascension;
    if (typeof Sound !== 'undefined' && Sound.ctx) {
      try { Sound.createLayer('asc-wall', {
        voice: 'unisonWall',
        freq: cfg.wallRoot,
        detune: cfg.detuneRange[0],
        gain: 0,
      }); } catch (e) {}
      try { Sound.createLayer('asc-bass', {
        oscillators: [
          { wave: 'sine', freq: cfg.bassFreq || cfg.wallRoot * 0.5, gain: 0.25 },
          { wave: 'triangle', freq: cfg.bassFreq || cfg.wallRoot * 0.5, gain: 0.12 },
        ],
        filter: { type: 'lowpass', freq: 500, Q: 0.5 },
        gain: 0,
      }); } catch (e) {}
    }
  }

  function teardownAscension() {
    _asc.active = false;
    _asc.started = false;
    if (typeof Sound !== 'undefined') {
      try { Sound.destroyLayer('asc-wall'); } catch (e) {}
      try { Sound.destroyLayer('asc-bass'); } catch (e) {}
    }
  }

  function updateAscension(sensor, now, dt) {
    if (!_lens || !_lens.ascension || typeof Sound === 'undefined' || !Sound.ctx) return;
    var cfg = _lens.ascension;

    var energy = Body.energy;
    var medEnergy = Body.medium ? Body.medium.energy() : 0;
    var beta = sensor.beta || 0;
    var gamma = sensor.gamma || 0;

    // Smooth sensors
    var rawTilt = Math.max(0, Math.min(1, (beta + 30) / 180));
    _asc.tiltSmooth += (rawTilt - _asc.tiltSmooth) * 0.10;
    var rawLean = Math.max(0, Math.min(1, (gamma + 90) / 180));
    _asc.leanSmooth += (rawLean - _asc.leanSmooth) * 0.06;

    _asc.time += dt;

    // Energy peak detection
    _asc._peakCooldown = Math.max(0, _asc._peakCooldown - dt);
    var ePeak = energy > _asc._lastEnergy * 1.5 && energy > 0.35 && _asc._peakCooldown <= 0;
    if (ePeak) { _asc._peakCount++; _asc._peakCooldown = 0.5; }

    // Start on sustained motion
    if (!_asc.started) {
      try { Sound.setLayerGain('asc-bass', 0.08, 2.0); } catch (e) {}
      if (energy > 0.15 && medEnergy > 0.08) {
        _asc.started = true;
        _asc.phase = 'emerge';
        _asc.time = 0;
      } else {
        _asc._lastEnergy = energy;
        return;
      }
    }

    if (energy > 0.20) _asc.engagedTime += dt;
    if (energy < 0.06) _asc.stillTime += dt;
    else _asc.stillTime = 0;

    // Color: lean determines major/minor
    var colorTarget = _asc.leanSmooth > 0.6 ? 1.0 : _asc.leanSmooth < 0.4 ? 0.0 : 0.5;
    _asc.colorSmooth += (colorTarget - _asc.colorSmooth) * 0.5 * dt;

    // Phase transitions (body-driven, not clock-driven)
    if (_asc.phase === 'emerge') {
      var emergeFilter = cfg.filterRange[0] + energy * (cfg.filterRange[1] - cfg.filterRange[0]) * 0.5;
      _asc.filterSmooth += (emergeFilter - _asc.filterSmooth) * 2.0 * dt;
      _asc.bloom = Math.min(0.3, energy * 0.4);

      if (_asc._peakCount >= 1 && _asc.engagedTime > 3) _asc.phase = 'respond';
      if (_asc.engagedTime > 12 && medEnergy > 0.15) _asc.phase = 'respond';

    } else if (_asc.phase === 'respond') {
      // Chords advance on USER PEAKS
      if (ePeak && _asc.engagedTime > 5) {
        _asc.chordStep++;
        if (!_asc._progLocked) _asc._progLocked = _asc.colorSmooth > 0.5 ? 'major' : 'minor';
        var prog = _asc._progLocked === 'major' ? ASC_PROG_MAJOR : ASC_PROG_MINOR;
        if (_asc.chordStep >= prog.length) {
          _asc.chordStep = 0;
          _asc.progCycle++;
          _asc._progLocked = null;
        }
      }
      var bloomTarget = Math.min(0.8, _asc.engagedTime / (cfg.bloomTime || 15));
      _asc.bloom += (bloomTarget - _asc.bloom) * 0.3 * dt;

      if (energy > 0.5 && _asc.bloom > 0.5) _asc.phase = 'bloom';

    } else if (_asc.phase === 'bloom') {
      _asc.bloom += (1.0 - _asc.bloom) * 0.5 * dt;
      if (ePeak) {
        _asc.chordStep++;
        if (!_asc._progLocked) _asc._progLocked = _asc.colorSmooth > 0.5 ? 'major' : 'minor';
        var progB = _asc._progLocked === 'major' ? ASC_PROG_MAJOR : ASC_PROG_MINOR;
        if (_asc.chordStep >= progB.length) {
          _asc.chordStep = 0; _asc.progCycle++;
          _asc._progLocked = null;
        }
      }
      if (energy < 0.25) _asc.phase = 'respond';
    }

    // Stillness -> breathe
    if (_asc.stillTime > 3.0 && _asc.phase !== 'breathe') {
      _asc.phase = 'breathe';
    } else if (_asc.phase === 'breathe' && energy > 0.15) {
      _asc.phase = 'respond';
    }

    // Apply chord voicing to wall layer
    var activeProg = (_asc._progLocked === 'major' || (!_asc._progLocked && _asc.colorSmooth > 0.5))
      ? ASC_PROG_MAJOR : ASC_PROG_MINOR;
    var voicing = activeProg[_asc.chordStep % activeProg.length];

    // Build chord frequencies from voicing
    var chordFreqs = [];
    for (var vi = 0; vi < voicing.length; vi++) {
      chordFreqs.push(cfg.wallRoot * Math.pow(2, voicing[vi] / 12));
    }
    try { Sound.setLayerFreqs('asc-wall', chordFreqs, 0.5); } catch (e) {}

    // Bass follows chord
    if (_asc.bloom > 0.2) {
      var bassRoot = cfg.wallRoot * Math.pow(2, voicing[0] / 12);
      while (bassRoot < 80) bassRoot *= 2;
      while (bassRoot > 200) bassRoot /= 2;
      try { Sound.setLayerFreqs('asc-bass', [bassRoot, bassRoot * 2], 0.5); } catch (e) {}
    }

    // Layer gains: bloom controls reveal
    var b = _asc.bloom;
    try { Sound.setLayerGain('asc-wall', 0.10 + b * 0.40, 0.3); } catch (e) {}
    try { Sound.setLayerGain('asc-bass', b * 0.22, 0.4); } catch (e) {}

    // Master gain follows energy
    var gainTarget = 0.12 + energy * 0.35 + b * 0.15;
    if (_asc.phase === 'bloom') gainTarget = Math.max(gainTarget, 0.50);
    if (_asc.phase === 'breathe') gainTarget = Math.min(gainTarget, 0.25);
    _asc.masterGain += (gainTarget - _asc.masterGain) * 0.4 * dt;
    _asc.masterGain = Math.max(0, Math.min(0.85, _asc.masterGain));
    try { Sound.setMasterGain(_asc.masterGain); } catch (e) {}

    // Filter: energy drives it, bloom raises floor
    var tiltCeiling = cfg.filterRange[0] + _asc.tiltSmooth * (cfg.filterRange[1] - cfg.filterRange[0]);
    var energyOpen = cfg.filterRange[0] + energy * (tiltCeiling - cfg.filterRange[0]);
    var bloomFloor = cfg.filterRange[0] + b * 300;
    var filterTgt = Math.max(energyOpen, bloomFloor);

    if (_asc.phase === 'breathe') {
      _asc.breathPhase += (cfg.breathRate || 0.06) * dt;
      var breathLFO = Math.sin(_asc.breathPhase * Math.PI * 2);
      filterTgt = cfg.filterRange[0] + 200 + breathLFO * (cfg.breathDepth || 600);
    }

    filterTgt = Math.max(cfg.filterRange[0], Math.min(cfg.filterRange[1], filterTgt));
    _asc.filterSmooth += (filterTgt - _asc.filterSmooth) * 2.5 * dt;
    try { Sound.setLayerFilter('asc-wall', _asc.filterSmooth, 0.1); } catch (e) {}

    // Reverb + delay
    var reverbTgt = 0.35 + b * 0.20;
    if (_asc.phase === 'breathe') reverbTgt = 0.75;
    if (_asc.phase === 'bloom') reverbTgt += 0.10;
    try { Sound.setReverbMix(Math.min(0.85, reverbTgt)); } catch (e) {}

    // Peak response — pluck on energy peaks
    if (ePeak && _lens.palette && _asc.phase !== 'breathe') {
      var pp = _lens.palette.peak;
      if (pp) {
        var chordRoot = cfg.wallRoot * Math.pow(2, voicing[0] / 12);
        try {
          Sound.play(pp.voice || 'pluck', Sound.currentTime,
            chordRoot * Math.pow(2, (pp.octave || 0)), 0.30 * b, pp.decay || 0.8);
        } catch (e) {}
      }
    }

    _asc._lastEnergy = energy;
  }


  // ═══════════════════════════════════════════════════════════════════════
  // 24. TOUCH HANDLER
  // ═══════════════════════════════════════════════════════════════════════

  function touch(x, y, vx, vy) {
    if (!_lens || typeof Sound === 'undefined' || !Sound.ctx || !_active) return;

    var now = Date.now();
    var noteIntervalMs = (_lens.response && _lens.response.noteInterval) || 200;
    if (now - _lastTouchNote < noteIntervalMs) return;

    if (_asc.active) return;  // Ascension: touch reserved

    var time = Sound.currentTime;
    var palette = _lens.palette || {};
    var resp = palette.touch || palette.continuous || {};

    var rawDegree = Math.round((1 - y) * 14) - 7;
    var chordOffsets = [0, 2, 4, 7, -3, -5];
    var nearest = rawDegree, minDist = 99;
    for (var ci = 0; ci < chordOffsets.length; ci++) {
      for (var oct = -1; oct <= 1; oct++) {
        var candidate = chordOffsets[ci] + oct * 7;
        var d = Math.abs(rawDegree - candidate);
        if (d < minDist) { minDist = d; nearest = candidate; }
      }
    }
    var degree = minDist <= 2 ? nearest : rawDegree + Math.round((nearest - rawDegree) * 0.4);
    var freq = Harmony.freq(degree, resp.octave || 0);

    var speed = Math.sqrt(vx * vx + vy * vy);
    var vel = Math.min(1, 0.3 + speed * 0.08);
    vel *= Math.max(0.3, 1 - _energySmooth * 0.35);

    _lastTouchNote = now;

    try {
      Sound.play(resp.voice || 'epiano', time, freq, vel, resp.decay || 0.6);
      _noteCount++;
    } catch (e) { _errorCount++; }

    if (_isSilent) {
      _isSilent = false;
      _stillnessTimer = 0;
      _fadeGain = 0.5;
    }
  }


  // ═══════════════════════════════════════════════════════════════════════
  // 25. INIT / APPLY LENS / MAIN UPDATE
  // ═══════════════════════════════════════════════════════════════════════

  function init() {
    try {
      // Water bottle dynamics
      _pitchWater  = new Body.WaterDynamic(1.8, 0.93, 0.06);
      _filterWater = new Body.WaterDynamic(1.4, 0.91, 0.04);

      // Berlyne tracker — keep music at edge of order and chaos
      _berlyne = new Body.BerlyneTracker();

      // Grokking detector — recognize when user becomes a musician
      _grok = new Body.GrokDetector();
    } catch (e) {
      // Body module may not be loaded yet; create later
    }

    _active = false;
    _isSilent = true;
    _fadeGain = 0;
    _stillnessTimer = 0;
    _sessionPhase = 0;
    _sessionEngagedTime = 0;
    _sessionAct = 0;
    _phraseActive = false;
    _currentDegree = 0;
    _noteCount = 0;
    _errorCount = 0;
    _voidPresence = 0;
    _voidEngaged = false;
    _droneActive = false;
    _droneGain = 0;

    _tensionArc.phase = 'idle';
    _tensionArc.timer = 0;
    _tensionArc.level = 0;

    if (_grid.active) teardownGrid();
    if (_asc.active) teardownAscension();

    // Wire drum callback
    setupDrumCallback();
  }

  function applyLens(lensConfig) {
    _lens = lensConfig;
    if (!_lens) return;

    try {
      // Determine pipeline
      _pipeline = _lens.pipeline || 'organic';
      if (_lens.edm) _pipeline = 'grid';
      if (_lens.ascension) _pipeline = 'ascension';

      // Harmony configuration
      Harmony.configure({
        root: (_lens.harmony && _lens.harmony.root) || 432,
        mode: (_lens.harmony && _lens.harmony.mode) || 'major',
        gravityStrength: (_lens.harmony && _lens.harmony.gravityStrength),
      });
      _baseScale = Harmony.scale.slice();

      // Rhythm configuration
      if (_pipeline === 'organic') {
        Rhythm.configure({
          mode: 'organic',
          profile: (_lens.rhythm && _lens.rhythm.kit) || 'acoustic',
        });
      }

      // Sound configuration
      if (typeof Sound !== 'undefined') {
        try { Sound.configure(_lens); } catch (e) {}
      }

      // Motion profile adaptation
      var adaptedResp = Body.motionProfile.adapt(_lens.response || {});
      _adaptedPeakThresh  = adaptedResp.peakThreshold || null;
      _adaptedStillThresh = adaptedResp.stillnessThreshold || null;

      // Reset state
      _active = true;
      _isSilent = true;
      _fadeGain = 0;
      _stillnessTimer = 0;
      _sessionEngagedTime = 0;
      _sessionPhase = 0;
      _sessionAct = 0;
      _phraseActive = false;
      _currentDegree = 0;
      _energySmooth = 0;
      _densityLevel = 0;
      _sessionEnergyAccum = 0;
      _generation = 0;
      _epiAdvancePending = false;
      _epi.spaceMix = 0;
      _epi.massiveFloor = (_lens.space && _lens.space.massiveStart) || 0;
      _epi.energyGate = 24;
      _epi.harmonyCarry = 0;
      _voidPresence = 0;
      _voidEngaged = false;
      _crCooldown = 0;
      _answerPending = false;

      _gyroPrevBeta = null;
      _gyroPrevGamma = null;

      // Cleanup old layers
      if (_droneActive) {
        try { Sound.destroyLayer('flow-drone'); } catch (e) {}
        _droneActive = false;
        _droneGain = 0;
      }

      // Teardown old pipelines
      if (_grid.active) teardownGrid();
      if (_asc.active) teardownAscension();

      // Init pipeline
      if (_pipeline === 'grid') initGrid();
      else if (_pipeline === 'ascension') initAscension();

      // Reset organic stage
      resetOrganicStage();
      if (_lens.stages) {
        // Shuffle stage order for Journey
        var stagesCopy = _lens.stages.slice();
        for (var si = stagesCopy.length - 1; si > 0; si--) {
          var j = Math.floor(Math.random() * (si + 1));
          var tmp = stagesCopy[si];
          stagesCopy[si] = stagesCopy[j];
          stagesCopy[j] = tmp;
        }
        _organicStage.order = stagesCopy;
      }

      // Setup drum callback
      setupDrumCallback();
    } catch (e) {
      _errorCount++;
      if (typeof console !== 'undefined') console.error('[Flow.applyLens] CRASHED:', e.message, e.stack);
    }
  }


  // ═══════════════════════════════════════════════════════════════════════
  // 26. MAIN UPDATE — one call per frame
  // ═══════════════════════════════════════════════════════════════════════
  //
  // Architecture pseudocode (from v2_architecture.md):
  //   1. Silence gate
  //   2. Route to pipeline
  //   3. Cross-pipeline systems (prodigy, berlyne, grok)
  //   4. Spatial
  //   5. Drums
  //   6. Void drone

  function update(sensor, timestamp) {
    if (!_active || !_lens) {
      if (typeof console !== 'undefined' && !_active) console.warn('[Flow.update] inactive — _active:', _active, '_lens:', !!_lens);
      return;
    }

    try {
      var now = performance.now();
      var dt = _lastT > 0 ? (now - _lastT) / 1000 : 0.016;
      dt = Math.min(dt, 0.1); // cap at 100ms to prevent huge jumps
      _lastT = now;

      // 1. Silence gate
      updateSilence(dt, now);

      // 2. Route to pipeline
      if (_pipeline === 'grid') {
        updateGrid(sensor, now, dt);
      } else if (_pipeline === 'ascension') {
        updateAscension(sensor, now, dt);
      } else {
        updateOrganic(sensor, now, dt);
      }

      // 3. Cross-pipeline systems
      updateProdigy(dt);
      updateBerlyne(dt);
      updateGrok();

      // Update Harmony motif cooldown
      Harmony.updateMotifCooldown(dt);

      // 4. Spatial
      if (typeof Sound !== 'undefined') {
        try { Sound.updateSpatial(sensor.gamma || 0, _isSilent, sensor.touching); } catch (e) {}
      }

      // 5. Drums (organic pipeline — grid handles its own)
      if (_pipeline === 'organic' && !_isSilent && Rhythm.drumPresence > 0) {
        Rhythm.update(dt, {
          energy: Body.energy,
          tempo: Body.bodyTempo,
          tempoLocked: Body.rhythmConfidence > 0.22,
          rhythmConfidence: Body.rhythmConfidence,
          lockStrength: Body.rhythmConfidence,
          isSilent: _isSilent,
          peaked: Body.peaked,
          peakMag: Body.peakMagnitude,
          audioTime: (typeof Sound !== 'undefined' && Sound.ctx) ? Sound.currentTime : 0,
        });
      }

      // 6. Void drone
      if (Body.voidState >= Body.VOID.SETTLING) {
        updateVoid(dt);
      }

      // 7. Master gain (organic pipeline only — grid/ascension manage their own)
      if (_pipeline === 'organic' && typeof Sound !== 'undefined' && Sound.ctx) {
        var tribalFloor = Rhythm.drumPresence * 0.35;
        var effectiveGain = Math.max(_fadeGain, tribalFloor);
        try { Sound.setMasterGain(0.48 * effectiveGain * _touchDuck * _prodigy.dynamicRange); } catch (e) {}
        _touchDuck = Math.min(1.0, _touchDuck + dt * 2.0);
      }
    } catch (e) {
      _errorCount++;
      if (typeof console !== 'undefined') console.error('[Flow.update] ERROR #' + _errorCount + ':', e.message, e.stack);
    }
  }


  // ═══════════════════════════════════════════════════════════════════════
  // 27. SPIKE HANDLER
  // ═══════════════════════════════════════════════════════════════════════

  function onSpike(data) {
    if (!_active || !_lens || typeof Sound === 'undefined' || !Sound.ctx || _isSilent || _sessionPhase < 1) return;
    try {
      var time = Sound.currentTime;
      var palette = _lens.palette || {};

      if (data.neuron === 'toss' && _lens.rhythm) {
        Sound.playDrum('kick', time, 0.9, _lens.rhythm.kit || 'acoustic');
        Sound.playDrum('snare', time + 0.01, 0.7, _lens.rhythm.kit || 'acoustic');
      } else if (data.neuron === 'pendulum' && palette.harmonic && data.rate > 1) {
        var freq = Harmony.freq(Harmony.hrOffset + 4, palette.harmonic.octave || 0);
        Sound.play(palette.harmonic.voice || 'epiano', time, freq, 0.15, 0.5);
      }
    } catch (e) { _errorCount++; }
  }


  // ═══════════════════════════════════════════════════════════════════════
  // 28. SESSION LOGGING
  // ═══════════════════════════════════════════════════════════════════════

  var _log = [];
  var _logInterval = 0;

  window.dump = function () {
    if (!_log.length) { console.log('No session recorded yet.'); return ''; }
    var out = _log.map(function (e) {
      return '[' + e.t + 's] ' + e.type + ': ' +
        (typeof e.data === 'object' ? JSON.stringify(e.data) : e.data);
    }).join('\n');
    console.log(out);
    try { navigator.clipboard.writeText(out); console.log('--- COPIED ---'); } catch (e) {}
    return out;
  };
  window.clearLog = function () { _log = []; _logInterval = 0; console.log('Log cleared.'); };


  // ═══════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════

  return Object.freeze({
    // Lifecycle
    init:      init,
    applyLens: applyLens,
    update:    update,
    touch:     touch,
    onSpike:   onSpike,

    // State (read-only)
    get isSilent()      { return _isSilent; },
    get fadeGain()      { return _fadeGain; },
    get sessionPhase()  { return _sessionPhase; },
    get currentDegree() { return _currentDegree; },
    get pipeline()      { return _pipeline; },
    get prodigy()       { return { arc: _prodigy.arc, arcDuration: _prodigy.arcDuration, filterBias: _prodigy.filterBias, dynamicRange: _prodigy.dynamicRange, reverbBias: _prodigy.reverbTarget }; },

    // Debug getters
    get silent()     { return _isSilent; },
    get fade()       { return _fadeGain; },
    get phase()      { return _sessionPhase; },
    get degree()     { return _currentDegree; },
    get energy()     { return _energySmooth; },
    get density()    { return _densityLevel; },
    get filterFreq() { return _filterFreq; },
    get notes()      { return _noteCount; },
    get errors()     { return _errorCount; },
    get intent()     { return INTENT_NAMES[_currentIntent] || '?'; },
    get answer()     { return _answerPending ? 'pending' : '-'; },
    get phrase()     { return _phraseActive ? _phraseEnergyArc.toFixed(2) : 'none'; },
    get sessionTime()  { return Math.round(_sessionEngagedTime); },
    get generation()   { return _generation; },

    // Grid debug
    get gridPhase()     { return _grid.active ? _grid.phase : '-'; },
    get gridBuild()     { return _grid.active ? _grid.buildLevel.toFixed(2) : '-'; },
    get gridIntensity() { return _grid.active ? _grid.intensity.toFixed(2) : '-'; },

    // Ascension debug
    get ascPhase()   { return _asc.active ? _asc.phase : '-'; },
    get ascFilter()  { return _asc.active ? Math.round(_asc.filterSmooth) : '-'; },
    get ascBloom()   { return _asc.active ? _asc.bloom.toFixed(2) : '-'; },
    get ascChord()   { return _asc.active ? (_asc.colorSmooth > 0.65 ? 'MAJ' : _asc.colorSmooth < 0.35 ? 'MIN' : 'SUS') : '-'; },

    // State snapshot for identity.js
    state: function () {
      return {
        tempo: Rhythm.tempo,
        rhythmConfidence: Body.rhythmConfidence,
        archetype: Body.archetype,
        engagedTime: _sessionEngagedTime,
        degreeHeat: Array.from(_prodigy.degreeHeat),
        energyHistory: Array.from(_prodigy.energyHistory),
        tiltCenter: _tiltOffset,
      };
    },
  });

})();
