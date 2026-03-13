/**
 * FOLLOW — The Body Is The Composer
 *
 * 4 Roles. One body. No clock.
 *
 * LEAD:   Your tilt is the melody. The dominant voice.
 * PULSE:  Your rhythm is the beat. Emerges when locked, fades when lost.
 * ANSWER: The music responds. Rare. Deliberate. Completes your thought.
 * SPACE:  The room. Foundation drone + reverb. The harmonic ground.
 *
 * v67: Clean rebuild.
 *  - LEAD voice is now 2× louder — the melody is the boss
 *  - Phrase endings have real resolution chords (3 notes, I chord)
 *  - Wake-up root: break silence = bass announces the home note
 *  - Harmonic rhythm: foundation drone slowly walks I→IV→V→I every 8-16s
 *  - Removed: groove crystallization, momentum, grid beats, subdivisions
 *  - Update loop: 12 calls instead of 20+
 */

const Follow = (function () {
  'use strict';

  // ── MUSIC THEORY ──────────────────────────────────────────────────────

  const MODES = {
    major:      [0, 2, 4, 5, 7, 9, 11],
    dorian:     [0, 2, 3, 5, 7, 9, 10],
    pentatonic: [0, 2, 4, 7, 9],
    blues:      [0, 3, 5, 6, 7, 10],
    mixolydian: [0, 2, 4, 5, 7, 9, 10],
    phrygian:   [0, 1, 3, 5, 7, 8, 10],
    lydian:     [0, 2, 4, 6, 7, 9, 11],
    picardy:    [0, 2, 3, 4, 5, 7, 8, 10],
    minor:      [0, 2, 3, 5, 7, 8, 10],
  };

  // ── GROOVE DNA TABLE ──────────────────────────────────────────────────
  // 16-step patterns (one 4/4 bar). Values 0-1 = hit strength.

  var GROOVE_DNA = {
    'The Conductor': {
      kick:  [0.8,0,0,0, 0,0,0,0, 0.28,0,0,0, 0,0,0,0],
      snare: [0,0,0,0,   0,0,0,0, 0,0,0,0,    0,0,0,0],
      hat:   [0,0,0,0,   0.10,0,0,0, 0,0,0,0, 0.10,0,0,0],
      feel: 0, kit: 'acoustic', snap: 3, halftime: true,
    },
    'Blue Hour': {
      kick:  [0.74,0,0,0, 0,0.13,0,0, 0,0,0,0, 0.30,0,0,0],
      snare: [0,0,0,0,    0,0,0,0,    0.76,0,0,0.08, 0,0,0,0.04],
      hat:   [0,0.22,0.58,0.22, 0.58,0.22,0.58,0.22, 0.58,0.22,0.58,0.22, 0.58,0.22,0.58,0.22],
      feel: 0.12, kit: 'brushes', snap: 2, halftime: true,
    },
    'Drift': {
      kick:  [0.40,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
      snare: [0,0,0,0,    0,0,0,0, 0,0,0,0, 0,0,0,0],
      hat:   [0,0,0,0,    0,0,0,0, 0,0,0,0, 0,0,0,0],
      feel: 0, kit: 'acoustic', snap: 2, halftime: true, sparse: true,
    },
    'Tundra': {
      kick:  [0.52,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
      snare: [0,0,0,0,    0,0,0,0, 0,0,0,0, 0,0,0,0],
      hat:   [0,0,0,0,    0,0,0,0, 0,0,0,0, 0,0,0,0],
      feel: 0, kit: 'acoustic', snap: 2, halftime: true, sparse: true, barDivisor: 4,
    },
    'Still Water': {
      kick:  [0.48,0,0,0, 0,0,0,0, 0.22,0,0,0, 0,0,0,0],
      snare: [0,0,0,0,    0,0,0,0, 0.26,0,0,0, 0,0,0,0],
      hat:   [0,0,0,0,    0.08,0,0,0, 0,0,0,0, 0.08,0,0,0],
      feel: 0.05, kit: 'brushes', snap: 3, halftime: true,
    },
    'Dark Matter': {
      kick:  [1.0,0,0,0.18, 0,0,0.28,0, 0.72,0,0.18,0, 0,0.32,0,0],
      snare: [0,0,0,0,      0.80,0,0,0.11, 0,0.26,0,0, 0.60,0,0.09,0],
      hat:   [1.0,0.36,1.0,0.36, 1.0,0.36,1.0,0.36, 1.0,0.36,1.0,0.36, 1.0,0.36,1.0,0.36],
      feel: 0, kit: 'glitch', snap: 1, halftime: false,
    },
    'Grid': {
      kick:  [1.0,0,0,0.28, 0,0,0.55,0, 1.0,0,0,0.28, 0,0,0,0],
      snare: [0,0,0,0, 0,0,0,0, 0.98,0,0,0, 0,0,0.18,0],
      hat:   [0.82,0,0.58,0, 0.82,0,0.58,0, 0.82,0,0.58,0, 0.82,0,0.58,0],
      feel: 0.04, kit: '808', snap: 1, halftime: true,
    },
  };

  var GROOVE_DNA_DEFAULT = {
    kick:  [0.7,0,0,0, 0,0,0,0, 0.3,0,0,0, 0,0,0,0],
    snare: [0,0,0,0,   0,0,0,0, 0.6,0,0,0, 0,0,0,0],
    hat:   [0,0,0,0,   0.09,0,0,0, 0,0,0,0, 0.09,0,0,0],
    feel: 0, kit: 'acoustic', snap: 2, halftime: true,
  };

  var BAR_BEATS  = 4;
  var STEP_COUNT = 16;

  var root = 432;
  var scale = MODES.major;

  // ── HARMONIC ARC ───────────────────────────────────────────────────────
  var originalRoot   = 432;
  var rootSemiOffset = 0;
  var rootSemiTarget = 0;
  var arcStep        = 0;
  var ARC_JOURNEY    = [0, 5, 7, 0];
  var ARC_STEP_ENERGY = 50;

  function scaleFreq(degree, octave) {
    var len = scale.length;
    var oct = Math.floor(degree / len);
    var deg = ((degree % len) + len) % len;
    var semi = scale[deg] + (oct + (octave || 0)) * 12;
    return root * Math.pow(2, semi / 12);
  }

  // ── HARMONIC GRAVITY ──────────────────────────────────────────────────

  function recordNote(deg) {
    var scaleDeg = ((deg % scale.length) + scale.length) % scale.length;
    melodicHistory.push(scaleDeg);
    if (melodicHistory.length > 8) melodicHistory.shift();
    lastHistoryDeg = scaleDeg;

    var isConsonant = (scaleDeg === 0 || scaleDeg === 2 || scaleDeg === 4 || scaleDeg === 7);
    if (phraseNoteCount >= 2 && isConsonant) {
      phraseNoteCount = 0;
      phraseBreathing = true;
      setTimeout(function () { phraseBreathing = false; }, 480);
    } else {
      phraseNoteCount++;
    }
    melodicCentroid += (scaleDeg - melodicCentroid) * 0.06;

    if (melodicHistory.length > 0) {
      var sum = 0, w = 0;
      for (var i = 0; i < melodicHistory.length; i++) {
        var wi = (i + 1) / melodicHistory.length;
        sum += (DEGREE_TENSION[melodicHistory[i]] || 0.35) * wi;
        w += wi;
      }
      harmonicTension = sum / w;
    }
  }

  // ── PHRASE CONTOURS ────────────────────────────────────────────────────

  var CONTOURS = {
    rising:   [0, 1, 2, 3, 4, 5, 6, 7],
    falling:  [7, 6, 5, 4, 3, 2, 1, 0],
    arch:     [0, 2, 4, 6, 7, 5, 3, 0],
    question: [0, 2, 3, 5, 7, 7, 5, 5],
    answer:   [5, 4, 3, 2, 1, 0, 0, 0],
  };

  var phraseContour = 'arch';

  function pickPhraseContour() {
    var options;
    switch (archetype) {
      case 'waving':   options = ['arch', 'question', 'rising']; break;
      case 'walking':  options = ['rising', 'answer', 'arch'];   break;
      case 'bouncing': options = ['rising', 'arch'];             break;
      default:
        var lensShape = lens && lens.emotion && lens.emotion.phraseShape;
        options = lensShape ? [lensShape, lensShape, 'arch'] : ['arch', 'rising', 'falling', 'question', 'answer'];
        break;
    }
    phraseContour = options[Math.floor(Math.random() * options.length)];
  }

  function getContourDegree(arc) {
    var steps = CONTOURS[phraseContour] || CONTOURS.arch;
    var idx = Math.min(steps.length - 1, Math.floor(arc * steps.length));
    return steps[idx];
  }

  // ── RULE OF THREES ────────────────────────────────────────────────────
  var phraseNoteCount = 0;
  var phraseBreathing = false;

  function gravitateDegree(rawDeg) {
    if (sessionPhase === 0) {
      var cons = [0, 2, 4];
      var best = 0, bestD = 999;
      for (var c = 0; c < cons.length; c++) {
        var d = Math.abs(rawDeg - cons[c]);
        if (d < bestD) { bestD = d; best = cons[c]; }
      }
      return best;
    }

    if (phraseNoteCount >= 2) {
      var resolve = [0, 2, 4, 7];
      var best = 0, bestD = 999;
      for (var ri = 0; ri < resolve.length; ri++) {
        var d = Math.abs(rawDeg - resolve[ri]);
        if (d < bestD) { bestD = d; best = resolve[ri]; }
      }
      return Math.round(rawDeg * 0.30 + best * 0.70);
    }

    if (harmonicTension < 0.45) return rawDeg;
    var pull = Math.min(1, (harmonicTension - 0.45) / 0.55);
    var target = harmonicTension > 0.75 ? 0 : 4;
    return Math.round(rawDeg * (1 - pull * 0.40) + target * pull * 0.40);
  }

  // ── STATE ─────────────────────────────────────────────────────────────

  var active = false;
  var lens = null;

  // Peak detection
  var accelBuf = new Float32Array(64);
  var accelHead = 0;
  var accelLen = 0;
  var lastPeakTime = 0;
  var peakIntervals = new Float32Array(8);
  var piHead = 0;
  var piLen = 0;
  var derivedTempo = 0;
  var rhythmConfidence = 0;
  var lastMag = 0;
  var lastLastMag = 0;
  var peakCooldown = 0;

  // LEAD voice (tilt → melody)
  var currentDegree = 0;
  var targetDegree = 0;
  var tiltOffset = 0;
  var lastNoteTime = 0;

  // Harmonic state
  var harmonyDegree = 0;

  // Melodic memory
  var melodicHistory  = [];
  var harmonicTension = 0;
  var lastHistoryDeg  = null;
  var DEGREE_TENSION  = [0.0, 0.45, 0.25, 0.55, 0.15, 0.65, 0.90];
  var melodicCentroid = 0;

  // Vertical arc
  var vertVelocity  = 0;
  var vertPosition  = 0;
  var vertPhase     = 0;
  var arcPeak       = 0;
  var arcValley     = 0;
  var arcAmplitude  = 0.4;
  var posMemory     = [];
  var POS_BUCKET    = 0.18;
  var POS_MAX       = 8;
  var lastAnticTime = 0;

  // Hat deduplication
  var lastHatTime = 0;

  // ── BAR PHASE ─────────────────────────────────────────────────────────
  var barPhase    = 0;
  var barOrigin   = 0;
  var barCount    = 0;
  var lastBarStep   = -1;
  var lastKickStep  = -1;
  var lastSnareStep = -1;
  var lastKickTime  = 0;
  var lastSnareTime = 0;

  // Energy / density
  var energySmooth = 0;
  var densityLevel = 0;
  var densityTarget = 0;

  // Drone layer
  var droneLayer = null;
  var droneActive = false;
  var droneGain = 0;

  // ── HARMONIC RHYTHM — slow chord walking ──────────────────────────────
  // Every 8-16s the harmonic foundation breathes: root → IV or V → root.
  // The user doesn't need to do anything — the system provides structure.
  // This is the most basic musical grammar: tension and release.
  var hrTimer = 0;          // ms since last change
  var hrTarget = 10000;     // ms until next change
  var hrState = 'root';     // 'root', 'iv', 'v'
  var hrDegOffset = 0;      // scale degree offset applied to foundation

  function updateHarmonicRhythm(dt) {
    if (isSilent || sessionPhase < 1) return;
    hrTimer += dt * 1000;
    if (hrTimer < hrTarget) return;
    hrTimer = 0;

    if (hrState === 'root') {
      // Move away from root — IV or V depending on phrase energy
      hrState = (phraseEnergyArc > 0.45 || rhythmConfidence > 0.5) ? 'v' : 'iv';
      hrDegOffset = hrState === 'v' ? 4 : 3;  // scale degrees: 5th or 4th
      hrTarget = 2500 + Math.random() * 2500;  // away for 2.5-5s

      // Announce the color shift with a quiet bass note
      if (Audio.ctx && lens && lens.palette) {
        try {
          Audio.synth.play('piano', Audio.ctx.currentTime,
            scaleFreq(hrDegOffset, -2), 0.14, 3.5);
        } catch(e) {}
      }
    } else {
      // Return home — the resolution is the satisfying moment
      hrState = 'root';
      hrDegOffset = 0;
      hrTarget = 8000 + Math.random() * 8000; // home for 8-16s

      // Resolution landing note — the most important moment
      if (Audio.ctx && lens && lens.palette) {
        try {
          Audio.synth.play('piano', Audio.ctx.currentTime,
            scaleFreq(0, -2), 0.18, 4.0);
        } catch(e) {}
      }
    }

    // Shift foundation drone pitch to follow
    updateFoundationPitch();
  }

  function updateFoundationPitch() {
    if (!droneActive || !lens || !lens.palette || !lens.palette.texture) return;
    var tex = lens.palette.texture;
    var oct = tex.octave || -1;
    var base = harmonyDegree + hrDegOffset;
    var freqs = [scaleFreq(base, oct), scaleFreq(base + 7, oct)];
    try { Audio.layer.setFreqs('follow-drone', freqs, 1.8); } catch(e) {}
  }

  // Stillness → silence
  var stillnessTimer = 0;
  var isSilent = true;
  var fadeGain = 0;
  var lastUpdateTime = 0;

  // Filter
  var filterFreq = 800;
  var filterTarget = 800;

  // Stats
  var peakCount = 0;
  var noteCount = 0;
  var errorCount = 0;

  // ── SESSION ARC ───────────────────────────────────────────────────────
  var sessionEngagedTime = 0;
  var sessionPhase = 0;
  var PHASE_LISTENING = 8;
  var PHASE_ALIVE = 20;

  // ── EPIGENETIC EVOLUTION ──────────────────────────────────────────────
  var sessionEnergyAccum = 0;
  var generation    = 0;
  var epi = {
    rootDrift:    0,
    spaceMix:     0,
    massiveFloor: 0,
    energyGate:   24,
    harmonyCarry: 0,
  };

  // ── GESTURE DISCOVERY ─────────────────────────────────────────────────
  var sessionDiscoveries = {};

  var rapidPeakTimes  = [];
  var TREMOLO_WINDOW  = 1200;
  var TREMOLO_MIN     = 5;
  var tremoloState    = false;
  var tremoloTimer    = 0;

  var invertedDuration = 0;
  var wasInverted      = false;

  var lastTouchNote = 0;
  var touchDuck     = 1.0;

  // ── BEAT-LOCKED MELODY (Grid / beatLocked lenses) ────────────────────
  // Phrygian melodic cells — drives Grid's machine-music feel
  var bm = {
    cells: [
      [5, 3, 1, 0,  0, 1, 0, 0],
      [1, 0, 1, 3,  1, 0, 1, 0],
      [0, 3, 5, 3,  1, 0, 1, 0],
      [0, 1, 3, 5,  7, 5, 3, 1],
    ],
    cellIdx:    0,
    stepIdx:    0,
    lastStep:  -1,
    cyclesDone: 0,
  };

  function pickNextCell() {
    var centroidBias = Math.round(melodicCentroid / 2) % 2;
    var phaseBias    = epi.massiveFloor >= 3 ? 1 : 0;
    bm.cellIdx = (bm.cyclesDone % 2 === 0)
      ? (2 + phaseBias + centroidBias) % 4
      : centroidBias;
  }

  var lastBeatMelodyTime = 0;

  function processBeatMelody(now) {
    if (!tempoLocked || !lens || !Audio.ctx) return;
    var cont = lens.palette && lens.palette.continuous;
    if (!cont || !cont.beatLocked) return;
    if (isSilent || sessionPhase < 1) return;

    var noteIntervalMs = (lens.response && lens.response.noteInterval) || 400;
    if (now - lastBeatMelodyTime < noteIntervalMs * 0.85) return;

    var step16 = Math.floor(barPhase * 16);
    var step8  = Math.floor(step16 / 2);
    if (step8 === bm.lastStep) return;
    bm.lastStep = step8;

    var cell = bm.cells[bm.cellIdx];
    var degree = cell[bm.stepIdx % cell.length];

    var tiltShift = Math.max(-2, Math.min(2, Math.round(tiltOffset * 1.5)));
    degree = Math.max(0, Math.min(7, degree + tiltShift));

    bm.stepIdx++;
    if (bm.stepIdx > 0 && bm.stepIdx % (cell.length * 2) === 0) {
      bm.cyclesDone++;
      pickNextCell();
    }

    currentDegree = degree;
    recordNote(degree);

    var freq  = scaleFreq(degree, cont.octave || 0);
    var vel   = Math.min(0.80, (0.35 + fadeGain * 0.42) * (cont.velBoost || 1.0));
    try {
      Audio.synth.play(cont.voice || 'epiano', Audio.ctx.currentTime, freq, vel, cont.decay || 1.0);
      lastBeatMelodyTime = now;
    } catch(e) {}
  }

  // ── TEMPO LOCK SYSTEM ─────────────────────────────────────────────────

  var tempoLocked = false;
  var lockedInterval = 500;
  var nextGridBeat = 0;
  var gridBeatCount = 0;
  var lockStrength = 0;
  var lastUserPeakOnGrid = 0;

  function updateTempoLock(now) {
    if (piLen < 3) { tempoLocked = false; lockStrength = 0; return; }

    var sum = 0;
    for (var i = 0; i < piLen; i++) sum += peakIntervals[i];
    var avgInterval = sum / piLen;

    if (rhythmConfidence > 0.22) {
      if (!tempoLocked) {
        tempoLocked = true;
        lockedInterval = avgInterval;
        nextGridBeat = now + lockedInterval;
        gridBeatCount = 0;
      } else {
        lockedInterval += (avgInterval - lockedInterval) * 0.15;
      }
      lockStrength = Math.min(1, lockStrength + 0.05);
    } else {
      lockStrength *= 0.97;
      if (lockStrength < 0.1) {
        tempoLocked = false;
        lockStrength = 0;
      }
    }
  }

  // ── PHRASE SYSTEM ─────────────────────────────────────────────────────

  var phraseActive = false;
  var phrasePeakCount = 0;
  var phraseStartTime = 0;
  var phraseMaxMag = 0;
  var phraseEnergyArc = 0;
  var phraseCooldown = 0;

  function updatePhrase(mag, now, dt) {
    if (phraseCooldown > 0) phraseCooldown -= dt;

    if (!phraseActive) {
      if (mag > 0.5 && phraseCooldown <= 0) {
        phraseActive = true;
        phrasePeakCount = 0;
        phraseStartTime = now;
        phraseMaxMag = mag;
        phraseEnergyArc = 0;
        pickPhraseContour();
      }
    } else {
      var phraseDuration = now - phraseStartTime;
      if (mag > phraseMaxMag) phraseMaxMag = mag;

      var phraseLen = Math.min(8000, Math.max(2000, piLen > 2 ? lockedInterval * 8 : 4000));
      phraseEnergyArc = Math.min(1, phraseDuration / phraseLen);

      var phraseIntensity;
      if (phraseEnergyArc < 0.4) {
        phraseIntensity = 0.45 + (phraseEnergyArc / 0.4) * 0.55;
      } else if (phraseEnergyArc < 0.8) {
        phraseIntensity = 1.0;
      } else {
        phraseIntensity = 1.0 - (phraseEnergyArc - 0.8) / 0.2;
      }

      phraseIntensityFactor = phraseIntensity;

      if (mag < 0.15 && phraseDuration > 1000) {
        endPhrase(now);
      } else if (phraseDuration > phraseLen) {
        endPhrase(now);
      }
    }
  }

  var phraseIntensityFactor = 1.0;

  function endPhrase(now) {
    phraseActive = false;
    phraseCooldown = 0.5;
    phraseIntensityFactor = 1.0;

    // Harmonic memory: chord tone follows where the player was playing
    if (sessionPhase >= 1) {
      harmonyDegree = Math.round(melodicCentroid);
    }

    // ── RESOLUTION CHORD — the musical full stop ──
    // A 3-note I chord spread 120ms apart. The phrase COMPLETES.
    // This is the single most important moment of musical grammar.
    if (lens && lens.palette && lens.palette.harmonic && Audio.ctx && !isSilent && fadeGain > 0.15) {
      var h = lens.palette.harmonic;
      var resVel = 0.32 * fadeGain;
      var chord = [harmonyDegree, harmonyDegree + 2, harmonyDegree + 4];
      for (var ci = 0; ci < chord.length; ci++) {
        (function (deg, delay, idx) {
          setTimeout(function () {
            if (!Audio.ctx || isSilent) return;
            try {
              Audio.synth.play(h.voice || 'epiano', Audio.ctx.currentTime,
                scaleFreq(deg, h.octave || 0), resVel * (1 - idx * 0.12), h.decay || 1.8);
            } catch(e) {}
          }, delay);
        })(chord[ci], ci * 120, ci);
      }
      noteCount++;
    }

    // Update foundation drone to match new harmonyDegree
    updateFoundationPitch();

    // Epigenetic check at phrase boundary
    if (epiAdvancePending) checkEpigeneticAdvance(now);
  }

  // ── MUSICAL INTENT ────────────────────────────────────────────────────

  var INTENT = { BREATH: 0, QUESTION: 1, GROOVE: 2, STATEMENT: 3, RESOLUTION: 4, EXCLAMATION: 5 };
  var currentIntent = INTENT.BREATH;

  var intentMagBuf = new Float32Array(24);
  var intentMagHead = 0;

  var callResponseCooldown = 0;
  var answerPending = false;
  var answerFireTime = 0;
  var answerNotes = [];
  var answerIdx = 0;

  function parseIntent(mag, now) {
    intentMagBuf[intentMagHead % 24] = mag;
    intentMagHead++;
    var recent = 0, older = 0;
    for (var i = 0; i < 12; i++) {
      recent += intentMagBuf[(intentMagHead - 1  - i + 24) % 24];
      older  += intentMagBuf[(intentMagHead - 13 - i + 24) % 24];
    }
    var risingEnergy = recent > older * 1.18;

    if (tempoLocked && rhythmConfidence > 0.55) {
      currentIntent = INTENT.GROOVE;
    } else if (mag < 0.18) {
      currentIntent = INTENT.BREATH;
    } else if (phraseActive && phraseEnergyArc > 0.75 && !risingEnergy) {
      currentIntent = INTENT.RESOLUTION;
    } else if (phraseActive && risingEnergy && phraseEnergyArc < 0.55) {
      currentIntent = INTENT.QUESTION;
    } else {
      currentIntent = INTENT.STATEMENT;
    }
  }

  function triggerCallResponse(magnitude, now, deg) {
    if (sessionPhase < 1) return;
    if (callResponseCooldown > now) return;
    if (currentIntent === INTENT.GROOVE) return;
    if (answerPending) return;

    answerNotes = buildAnswer(deg, harmonicTension, phraseEnergyArc, magnitude);
    answerFireTime = now + 1500 + Math.random() * 2000;
    answerIdx = 0;
    answerPending = true;
    callResponseCooldown = now + 10000 + Math.random() * 4000;
  }

  function buildAnswer(deg, tension, arc, magnitude) {
    var sp = 400;

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

  function processAnswer(now) {
    if (!answerPending || !lens || !Audio.ctx) return;

    if (currentIntent === INTENT.STATEMENT || currentIntent === INTENT.GROOVE) {
      answerPending = false;
      return;
    }

    if (now < answerFireTime) return;

    if (answerIdx < answerNotes.length) {
      var note = answerNotes[answerIdx];
      if (now >= answerFireTime + note.delayMs) {
        var h = lens.palette && lens.palette.harmonic;
        if (h) {
          var freq = scaleFreq(note.deg, (h.octave || 0) + 1);
          Audio.synth.play(h.voice || 'epiano', Audio.ctx.currentTime,
                           freq, note.vel * fadeGain, h.decay || 1.8);
          recordNote(note.deg);
        }
        answerIdx++;
      }
    } else {
      answerPending = false;
    }
  }

  // ── MOVEMENT ARCHETYPE DETECTION ──────────────────────────────────────

  var archetype = 'exploring';
  var archetypeConfidence = 0;
  var archetypeSmoothEnergy = 0;

  function classifyArchetype(brainState) {
    var pattern = brainState.pattern || 'still';
    var neurons = brainState.neurons || {};
    var energy = brainState.energy || 0;
    archetypeSmoothEnergy += (energy - archetypeSmoothEnergy) * 0.05;

    var pendRate = neurons.pendulum ? neurons.pendulum.rate() : 0;
    var sweepRate = neurons.sweep ? neurons.sweep.rate() : 0;
    var shakeRate = neurons.shake ? neurons.shake.rate() : 0;
    var rockRate = neurons.rock ? neurons.rock.rate() : 0;

    var prev = archetype;

    if (pattern === 'still' || archetypeSmoothEnergy < 0.15) {
      archetype = 'exploring';
    } else if (pendRate > 1.5 && rhythmConfidence > 0.4) {
      archetype = 'walking';
    } else if (shakeRate > 1.0 && archetypeSmoothEnergy > 1.5) {
      archetype = 'bouncing';
    } else if (sweepRate > 0.8) {
      archetype = 'waving';
    } else if (rockRate > 0.5 && archetypeSmoothEnergy < 0.8) {
      archetype = 'exploring';
    } else if (rhythmConfidence > 0.3) {
      archetype = 'walking';
    } else {
      archetype = 'waving';
    }

    if (archetype !== prev) {
      archetypeConfidence = 0;
    } else {
      archetypeConfidence = Math.min(1, archetypeConfidence + 0.02);
    }
  }

  // PER-LENS MOTION DRIVER
  function getLensMag(brainState, sensor) {
    if (!lens || !lens.motion) return brainState.energy;
    var s = lens.motion.sensitivity || 1.0;
    switch (lens.motion.primary) {
      case "tilt_rate": return Brain.short.energy() * s;
      case "bounce":    return Math.min(3, Math.abs(Brain.linearAccel.z) * 0.65) * s;
      case "sustained": return Brain.medium.energy() * s;
      case "impulse":   return Math.min(3, Brain.micro.peak() * 0.55) * s;
      case "flow":      return (Brain.short.energy() * 0.35 + Brain.medium.energy() * 0.65) * s;
      default:          return brainState.energy * s;
    }
  }

  // ── SMOOTH EPIGENETIC EVOLUTION ───────────────────────────────────────

  var epiAdvancePending = false;

  function checkEpigeneticAdvance(now) {
    if (sessionPhase < 2) return;
    if (sessionEnergyAccum < epi.energyGate) return;
    if (phraseActive) { epiAdvancePending = true; return; }
    if (!epiAdvancePending) return;
    epiAdvancePending = false;

    generation++;
    epi.harmonyCarry  = melodicCentroid;
    epi.rootDrift     += 2;
    epi.spaceMix      = Math.min(0.40, generation * 0.10);
    epi.massiveFloor  = Math.min(3, generation);
    epi.energyGate    = 24 + generation * 8;

    rootSemiTarget   += 2;
    melodicCentroid   = epi.harmonyCarry;
    sessionEnergyAccum = 0;

    try { Audio.setMassivePhase(epi.massiveFloor); } catch(e) {}
    try { Audio.setReverbMix(
      ((lens && lens.space && lens.space.reverbMix) || 0.25) + epi.spaceMix
    ); } catch(e) {}

    // Brief announcement: 3→5→1 ascending
    if (Audio.ctx && lens && lens.palette && lens.palette.peak) {
      var pk  = lens.palette.peak;
      var arr = [2, 4, 0];
      for (var ai = 0; ai < arr.length; ai++) {
        (function (deg, delay) {
          setTimeout(function () {
            if (!Audio.ctx || isSilent) return;
            try {
              var f = scaleFreq(deg, (pk.octave || -1) + 1);
              Audio.synth.play(pk.voice || 'epiano', Audio.ctx.currentTime, f, 0.32, pk.decay || 1.2);
            } catch(e) {}
          }, delay);
        })(arr[ai], ai * 450);
      }
    }
  }

  // ── RAPID OSCILLATION (TREMOLO) ───────────────────────────────────────

  function updateRapidOscillation(now, dt) {
    var cutoff = now - TREMOLO_WINDOW;
    while (rapidPeakTimes.length > 0 && rapidPeakTimes[0] < cutoff) rapidPeakTimes.shift();

    if (rapidPeakTimes.length >= TREMOLO_MIN) {
      if (!tremoloState) {
        tremoloState = true;
        if (!sessionDiscoveries.tremolo && typeof Voice !== 'undefined') {
          sessionDiscoveries.tremolo = true;
          Voice.onDiscovery('tremolo');
        }
        if (!isSilent && fadeGain > 0.2 && lens && lens.palette && lens.palette.continuous && Audio.ctx) {
          try {
            var cont = lens.palette.continuous;
            var time = Audio.ctx.currentTime;
            var f1 = scaleFreq(currentDegree, cont.octave || 0);
            var f2 = scaleFreq(currentDegree + 1, cont.octave || 0);
            var tv = fadeGain * 0.45;
            Audio.synth.play(cont.voice || 'epiano', time,        f1, tv,        0.10);
            Audio.synth.play(cont.voice || 'epiano', time + 0.07, f2, tv * 0.85, 0.09);
            Audio.synth.play(cont.voice || 'epiano', time + 0.14, f1, tv * 0.70, 0.09);
            Audio.synth.play(cont.voice || 'epiano', time + 0.21, f2, tv * 0.55, 0.10);
            Audio.synth.play(cont.voice || 'epiano', time + 0.28, f1, tv * 0.40, 0.12);
          } catch(e) {}
        }
      }
      tremoloTimer = 0.9;
    } else {
      if (tremoloState) {
        tremoloTimer -= dt;
        if (tremoloTimer <= 0) tremoloState = false;
      }
    }
  }

  // ── UPSIDE DOWN DETECTION ─────────────────────────────────────────────

  function updateInversion(sensor, dt) {
    var beta = sensor.beta || 0;
    var isInverted = Math.abs(beta) > 145;

    if (isInverted) {
      invertedDuration += dt;
      if (invertedDuration > 1.2 && !sessionDiscoveries.inversion && typeof Voice !== 'undefined') {
        sessionDiscoveries.inversion = true;
        Voice.onDiscovery('inversion');
      }
    } else {
      invertedDuration = Math.max(0, invertedDuration - dt * 2);
    }
    wasInverted = isInverted;
    return invertedDuration > 0.5;
  }

  // ── GOLDILOCKS DRUM ENGINE ────────────────────────────────────────────

  function updateBarPhase(now) {
    if (!tempoLocked || lockedInterval <= 0) {
      barPhase = 0; barOrigin = 0; barCount = 0; lastBarStep = -1;
      return;
    }
    if (barOrigin === 0) {
      barOrigin = lastPeakTime > 0 ? lastPeakTime : now;
      barCount = 0;
    }
    var barLenMs = lockedInterval * BAR_BEATS;
    var elapsed  = now - barOrigin;
    barPhase     = (elapsed % barLenMs) / barLenMs;
    var newBars  = Math.floor(elapsed / barLenMs);
    if (newBars > barCount) { barCount = newBars; lastBarStep = -1; lastKickStep = -1; lastSnareStep = -1; }
  }

  function getGrooveDNA() {
    var name = lens && lens.name || '';
    return GROOVE_DNA[name] || GROOVE_DNA_DEFAULT;
  }

  function goldilocksSync(currentStep, dna) {
    var nearest = null, nearestDist = STEP_COUNT;
    for (var i = 0; i < STEP_COUNT; i++) {
      var kv = dna.kick[i] || 0;
      var sv = dna.snare[i] || 0;
      if (kv < 0.08 && sv < 0.08) continue;
      var dist = Math.abs(i - currentStep);
      dist = Math.min(dist, STEP_COUNT - dist);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = { step: i, vel: Math.max(kv, sv), type: kv >= sv ? 'kick' : 'snare' };
      }
    }
    return { nearest: nearest, dist: nearestDist };
  }

  function fireGoldilocks(magnitude, now, vel) {
    if (!lens || !Audio.ctx || isSilent) return;
    var dna = getGrooveDNA();
    var kit = (lens.groove && lens.groove.kit) || dna.kit || 'acoustic';
    var time = Audio.ctx.currentTime;

    if (dna.barDivisor && (barCount % dna.barDivisor) !== 0) return;
    if (dna.sparse && vel < 0.45) return;

    var currentStep = Math.floor(barPhase * STEP_COUNT);
    var sync = goldilocksSync(currentStep, dna);
    var snapTol = tempoLocked ? (dna.snap || 2) : 3;

    var drunkS = dna.feel > 0 ? (Math.random() - 0.5) * dna.feel * lockedInterval * 0.5 / 1000 : 0;
    var drumTime = time + Math.max(-0.005, drunkS);

    if (sync.nearest && sync.dist <= snapTol) {
      var nearest = sync.nearest;

      if (nearest.type === 'kick') {
        var kv = nearest.vel * vel;
        var minKickGap = lockedInterval * (dna.halftime ? 1.6 : 0.85);
        if (kv > 0.08 && now - lastKickTime > minKickGap) {
          Audio.drum.kick(drumTime, Math.min(0.9, kv), kit);
          lastKickTime = now;
          if (lens.groove && lens.groove.broken && Math.random() < (lens.groove.doubleRate || 0)) {
            Audio.drum.kick(drumTime + 0.08, kv * 0.45, kit);
          }
        }
      } else if (nearest.type === 'snare') {
        var sv = nearest.vel * vel * 0.85;
        var minSnareGap = lockedInterval * (dna.halftime ? 3.2 : 1.6);
        if (sv > 0.06 && now - lastSnareTime > minSnareGap) {
          var dropped = lens.groove && lens.groove.broken && Math.random() < (lens.groove.dropRate || 0);
          if (!dropped) {
            Audio.drum.snare(drumTime, Math.min(0.85, sv), kit);
            lastSnareTime = now;
          }
        }
      }

      var grvGhosts = lens.groove && lens.groove.ghosts;
      if (grvGhosts && Math.random() < grvGhosts && vel > 0.15) {
        Audio.drum.snare(time + 0.04, vel * 0.08, kit);
      }

    } else if (sync.nearest && sync.dist <= snapTol + 2 && !dna.sparse) {
      if (vel > 0.15 && now - lastHatTime >= 80) {
        lastHatTime = now;
        Audio.drum.hat(time, vel * 0.10, kit);
      }
    }
  }

  // ── AUTONOMOUS HAT GRID ───────────────────────────────────────────────

  function processGrooveHats(now) {
    if (!tempoLocked || isSilent || sessionPhase < 2 || !lens || !Audio.ctx) return;
    if (!lens.groove) return;
    var dna = getGrooveDNA();
    if (!dna.hat) return;

    var currentStep = Math.floor(barPhase * STEP_COUNT);
    if (currentStep === lastBarStep) return;
    lastBarStep = currentStep;

    var hatVel = dna.hat[currentStep] || 0;
    if (hatVel < 0.04) return;

    var drunkS = dna.feel > 0 ? (Math.random() - 0.5) * dna.feel * lockedInterval * 0.25 / 1000 : 0;
    var hatTime = Audio.ctx.currentTime + Math.max(0, drunkS);

    var kit = (lens.groove && lens.groove.kit) || dna.kit || 'acoustic';
    var vel = hatVel * fadeGain * 0.55;

    if (vel > 0.025 && now - lastHatTime >= 35) {
      lastHatTime = now;
      Audio.drum.hat(hatTime, vel, kit);
    }
  }

  // ── AUTONOMOUS KICK + SNARE ────────────────────────────────────────────

  function processGrooveKickSnare(now) {
    if (!tempoLocked || isSilent || sessionPhase < 2 || !lens || !Audio.ctx) return;
    if (!lens.groove) return;

    var dna = getGrooveDNA();
    var currentStep = Math.floor(barPhase * STEP_COUNT);
    var kit  = (lens.groove && lens.groove.kit) || dna.kit || 'acoustic';
    var time = Audio.ctx.currentTime;

    var minKickGap  = tempoLocked ? Math.max(200, lockedInterval * 0.8) : 200;
    var minSnareGap = tempoLocked ? Math.max(200, lockedInterval * 2.8) : 200;

    if (currentStep !== lastKickStep) {
      lastKickStep = currentStep;
      var kv = dna.kick[currentStep] || 0;
      if (kv >= 0.08 && now - lastKickTime > minKickGap) {
        lastKickTime = now;
        var kVel = kv * fadeGain * Math.min(1, lockStrength + 0.4);
        if (kVel > 0.04) Audio.drum.kick(time, kVel, kit);
      }
    }

    if (currentStep !== lastSnareStep) {
      lastSnareStep = currentStep;
      var sv = dna.snare[currentStep] || 0;
      if (sv >= 0.08 && now - lastSnareTime > minSnareGap) {
        lastSnareTime = now;
        var sVel = sv * fadeGain * Math.min(1, lockStrength + 0.4);
        if (sVel > 0.04) Audio.drum.snare(time, sVel, kit);
      }
    }
  }

  // ── INIT ──────────────────────────────────────────────────────────────

  function init() {
    active = false;
    isSilent = true;
    fadeGain = 0;
    stillnessTimer = 0;
    peakCount = 0;
    noteCount = 0;
    errorCount = 0;
    tempoLocked = false;
    lockStrength = 0;
    phraseActive = false;
    archetype = 'exploring';
    archetypeConfidence = 0;
    sessionEngagedTime = 0;
    sessionPhase = 0;
  }

  // ── HARMONIC ARC UPDATE ───────────────────────────────────────────────

  function updateHarmonicArc(dt) {
    if (sessionPhase < 2) return;

    var nextThreshold = (arcStep + 1) * ARC_STEP_ENERGY;
    if (arcStep < ARC_JOURNEY.length - 1 && sessionEnergyAccum >= nextThreshold) {
      arcStep++;
      rootSemiTarget = ARC_JOURNEY[arcStep];
    }

    rootSemiOffset += (rootSemiTarget - rootSemiOffset) * dt * 0.06;
    root = originalRoot * Math.pow(2, rootSemiOffset / 12);
  }

  // ── CONFIGURE (apply lens) ────────────────────────────────────────────

  function applyLens(lensConfig) {
    lens = lensConfig;
    if (!lens) return;

    try { Audio.resetPortamento(); } catch(e) {}

    originalRoot   = (lens.harmony && lens.harmony.root) || 432;
    root           = originalRoot;
    scale          = MODES[(lens.harmony && lens.harmony.mode) || 'major'] || MODES.major;
    rootSemiOffset = 0;
    rootSemiTarget = 0;
    arcStep        = 0;

    if (droneLayer) { Audio.layer.destroy('follow-drone'); droneLayer = null; droneActive = false; }

    active = true;
    isSilent = true;
    fadeGain = 0;
    stillnessTimer = 0;
    tempoLocked = false;
    lockStrength = 0;
    piLen = 0;
    piHead = 0;
    harmonyDegree = 0;
    phraseActive = false;
    sessionEngagedTime = 0;
    sessionPhase = 0;
    melodicHistory = [];
    harmonicTension = 0;
    lastHistoryDeg = null;
    phraseNoteCount = 0;
    phraseBreathing = false;
    sessionEnergyAccum = 0;
    generation = 0;
    epiAdvancePending = false;
    epi.rootDrift = 0; epi.spaceMix = 0; epi.massiveFloor = 0;
    epi.energyGate = 24; epi.harmonyCarry = 0;
    try { Audio.setMassivePhase(0); } catch(e) {}
    rapidPeakTimes = [];
    vertVelocity  = 0;
    vertPosition  = 0;
    vertPhase     = 0;
    arcPeak       = 0;
    arcValley     = 0;
    arcAmplitude  = 0.4;
    posMemory     = [];
    lastAnticTime = 0;
    tremoloState = false;
    tremoloTimer = 0;
    invertedDuration = 0;
    wasInverted = false;
    sessionDiscoveries = {};
    lastTouchNote = 0;
    touchDuck = 1.0;
    melodicCentroid = 0;
    bm.cellIdx = 0; bm.stepIdx = 0; bm.lastStep = -1; bm.cyclesDone = 0;
    lastHatTime = 0;
    barPhase    = 0;
    barOrigin   = 0;
    barCount    = 0;
    lastBarStep = -1;
    lastKickTime  = 0;
    lastSnareTime = 0;
    hrTimer = 0;
    hrTarget = 10000 + Math.random() * 4000;
    hrState = 'root';
    hrDegOffset = 0;
    try { Audio.descentBass.stop(); } catch (e) {}
  }

  // ── PEAK DETECTION ────────────────────────────────────────────────────

  function pushAccel(mag) {
    accelBuf[accelHead] = mag;
    accelHead = (accelHead + 1) & 63;
    if (accelLen < 64) accelLen++;
  }

  function detectPeak(mag, now) {
    if (peakCooldown > 0) { peakCooldown--; return false; }

    var threshold = lens && lens.response ? (lens.response.peakThreshold || 1.5) : 1.5;

    if (lastMag > threshold && lastMag > lastLastMag && lastMag > mag) {
      peakCooldown = 8;
      return true;
    }
    return false;
  }

  function recordPeakInterval(now) {
    if (lastPeakTime > 0) {
      var interval = now - lastPeakTime;
      if (interval > 150 && interval < 2000) {
        var skip = false;
        if (piLen >= 2) {
          var runSum = 0;
          for (var j = 0; j < piLen; j++) runSum += peakIntervals[j];
          var runAvg = runSum / piLen;
          if (Math.abs(interval - runAvg) / runAvg > 0.70) skip = true;
        }

        if (!skip) {
          peakIntervals[piHead] = interval;
          piHead = (piHead + 1) & 7;
          if (piLen < 8) piLen++;

          var sum = 0;
          for (var i = 0; i < piLen; i++) sum += peakIntervals[i];
          var avgInterval = sum / piLen;
          derivedTempo = 60000 / avgInterval;

          var variance = 0;
          for (var i = 0; i < piLen; i++) {
            var diff = peakIntervals[i] - avgInterval;
            variance += diff * diff;
          }
          variance = Math.sqrt(variance / piLen);
          var cv = variance / avgInterval;
          var rawConf = Math.max(0, Math.min(1, 1 - cv * 2.5));
          var rate = rawConf > rhythmConfidence ? 0.25 : 0.06;
          rhythmConfidence += (rawConf - rhythmConfidence) * rate;
        }
      }
    }
    lastPeakTime = now;
    peakCount++;
  }

  // ── BODY PEAK → MUSICAL EVENT ─────────────────────────────────────────

  function onPeak(magnitude, now) {
    if (!lens || !Audio.ctx) return;
    rapidPeakTimes.push(now);
    if (sessionPhase === 0) return;

    try {
      var time = Audio.ctx.currentTime;
      var vel = Math.min(1, magnitude / 4) * phraseIntensityFactor;
      var palette = lens.palette || {};

      // ── ROLE 1 PEAK: chord tone nearest to where the melody is ──
      // Voice leading — the peak ANSWERS the melody, not random harmony.
      if (palette.peak && vel > 0.08) {
        var p = palette.peak;
        var chordTones = [0, 2, 4, 7];
        var peakDeg = harmonyDegree;
        var minD = 99;
        for (var ci = 0; ci < chordTones.length; ci++) {
          for (var oi = -1; oi <= 1; oi++) {
            var cand = chordTones[ci] + oi * 7;
            var d = Math.abs(cand - currentDegree);
            if (d < minD) { minD = d; peakDeg = cand; }
          }
        }
        var freq = scaleFreq(peakDeg, p.octave || -1);
        var peakVel = Math.min(0.92, vel * 0.82 * (sessionPhase === 1 ? 0.55 : 1.0));
        Audio.synth.play(p.voice || 'sub808', time, freq, peakVel, p.decay || 0.8);
        noteCount++;
      }

      // ── DELAYED HARMONIC ANSWER (tension-aware) ──
      // 320ms after the peak — answers, doesn't compete.
      if (palette.harmonic && vel > 0.38 && sessionPhase >= 1) {
        var h = palette.harmonic;
        var answerDeg;
        if (harmonicTension > 0.65) {
          answerDeg = 0;
        } else if (phraseEnergyArc > 0.55) {
          answerDeg = 4;
        } else {
          answerDeg = currentDegree % 7;
        }
        var hFreq = scaleFreq(answerDeg, h.octave || 0);
        Audio.synth.play(h.voice || 'epiano', time + 0.32, hFreq, vel * 0.20, h.decay || 1.0);
      }

      // ── ROLE 3 PULSE: goldilocks drums ──
      if (sessionPhase >= 2 && vel > 0.08) {
        fireGoldilocks(magnitude, now, vel);
      }

      // ── CALL & RESPONSE ──
      if (phrasePeakCount >= 2 && phraseEnergyArc > 0.2) {
        triggerCallResponse(magnitude, now, currentDegree);
      }

      phrasePeakCount++;
      if (magnitude > phraseMaxMag) phraseMaxMag = magnitude;

      // Confirm grid position
      if (tempoLocked) {
        lastUserPeakOnGrid = now;
        var gridError = (now - nextGridBeat + lockedInterval) % lockedInterval;
        if (gridError > lockedInterval / 2) gridError -= lockedInterval;
        nextGridBeat += gridError * 0.2;
      }

      sessionEnergyAccum += Math.min(1, magnitude / 3);

    } catch (e) {
      errorCount++;
    }
  }

  // ── ROLE 1: LEAD — TILT → PITCH ───────────────────────────────────────
  // The melody is the dominant voice. Everything else serves it.

  function updateTiltPitch(sensor, now) {
    if (!lens || !Audio.ctx) return;

    var tiltRange = (lens.response && lens.response.tiltRange) || 50;
    var melodicDriver = (lens.motion && lens.motion.melodic) || "beta";
    var tiltVal;
    if (melodicDriver === "gamma") {
      tiltVal = (sensor.gamma || 0);
    } else if (melodicDriver === "speed") {
      var spd = Math.sqrt(Math.pow(Brain.linearAccel.x||0,2) + Math.pow(Brain.linearAccel.y||0,2));
      tiltVal = Math.min(45, spd * 20) - 22;
    } else {
      tiltVal = (sensor.beta || 45) - 45;
    }

    tiltOffset = tiltVal / (tiltRange / 2);
    if (wasInverted) tiltOffset = -tiltOffset;
    var tiltDegree = Math.round(tiltOffset * 7);

    var arcRange = Math.max(0.25, arcAmplitude);
    var vertNorm = Math.max(-1, Math.min(1, vertPosition / arcRange));
    var vertDegree = Math.round(vertNorm * 5);

    var arcWeight = Math.min(0.65, arcAmplitude * 0.9);
    targetDegree = Math.round(vertDegree * arcWeight + tiltDegree * (1 - arcWeight));

    var degreeLimit = sessionPhase === 0 ? 3 : sessionPhase === 1 ? 5 : 10;
    if (targetDegree > degreeLimit) targetDegree = degreeLimit;
    if (targetDegree < -degreeLimit) targetDegree = -degreeLimit;

    var noteIntervalMs = (lens.response && lens.response.noteInterval) || 320;
    var maxJump = Math.min(7, Math.max(1, Math.round(noteIntervalMs / 180)));
    var stepped = Math.max(currentDegree - maxJump, Math.min(currentDegree + maxJump, targetDegree));

    // Contour blend + harmonic gravity
    var contourDeg = getContourDegree(phraseEnergyArc);
    var contourWeight = phraseActive ? (phraseEnergyArc > 0.85 ? 0.70 : 0.35) : 0;
    var blended = Math.round(stepped * (1 - contourWeight) + contourDeg * contourWeight);

    // Emotional color note: the soul of this mode
    var colorDeg = (lens.emotion && lens.emotion.colorDeg != null) ? lens.emotion.colorDeg : -1;
    if (colorDeg >= 0 && phraseActive && phraseEnergyArc > 0.2 && phraseEnergyArc < 0.78) {
      blended = Math.round(blended * 0.88 + colorDeg * 0.12);
    }

    var gravitated = gravitateDegree(blended);

    // Beat-locked lenses handle melody via processBeatMelody
    var contPalette = lens.palette && lens.palette.continuous;
    if (contPalette && contPalette.beatLocked) return;

    if (gravitated !== currentDegree && !isSilent && fadeGain > 0.15 && !phraseBreathing) {
      var baseInterval = noteIntervalMs;
      var speed = (typeof Brain !== 'undefined') ? Brain.short.energy() : 0.5;
      var speedMult = 1 + (1 - Math.min(1, speed / 2.5)) * 1.2;
      var minInterval = baseInterval * speedMult;
      var timeSinceNote = now - lastNoteTime;

      if (timeSinceNote > minInterval) {
        currentDegree = gravitated;
        recordNote(currentDegree);
        posMemRecord(vertPosition, currentDegree);
        lastNoteTime = now;

        if (contPalette) {
          var freq = scaleFreq(currentDegree, contPalette.octave || 0);

          // ── LEAD IS THE DOMINANT VOICE ──
          // Velocity: 0.38 at quiet, up to 0.83 at full engagement.
          // This is 2× louder than before — the melody is now audible.
          var vel = Math.min(0.85, (0.38 + fadeGain * 0.45) * phraseIntensityFactor * (contPalette.velBoost || 1.0));

          // Phrase-aware decay:
          //   Start of phrase = staccato (shorter, more space between notes)
          //   Heart of phrase = full decay (singing tone)
          //   End of phrase   = legato (let the last note ring longer before resolution)
          var baseDec = contPalette.decay || 1.2;
          var phraseDec;
          if (phraseEnergyArc < 0.30) {
            phraseDec = baseDec * 0.60;      // staccato — building
          } else if (phraseEnergyArc < 0.78) {
            phraseDec = baseDec;             // full — at peak
          } else {
            phraseDec = baseDec * 1.45;     // legato — winding down
          }

          if (!contPalette.sustained) {
            var speedNorm = Math.min(1, speed / 2.5);
            phraseDec *= (1 - speedNorm * 0.45);
          }

          try {
            Audio.synth.play(contPalette.voice || 'epiano', Audio.ctx.currentTime, freq, vel, phraseDec);
            noteCount++;
            if (typeof Pattern !== 'undefined') Pattern.onNote(currentDegree);
          } catch (e) { errorCount++; }
        }
      }
    }
  }

  // ── VERTICAL ARC ENGINE ───────────────────────────────────────────────

  function updateVertical(sensor, dt) {
    var gx = sensor.gx || 0, gy = sensor.gy || 0, gz = sensor.gz || 0;
    var gMag = Math.sqrt(gx*gx + gy*gy + gz*gz);
    if (gMag < 0.5) return;
    var upX = -gx/gMag, upY = -gy/gMag, upZ = -gz/gMag;

    var ax = sensor.ax || 0, ay = sensor.ay || 0, az = sensor.az || 0;
    var va = ax*upX + ay*upY + az*upZ;
    if (Math.abs(va) < 0.35) va = 0;

    vertVelocity = vertVelocity * 0.88 + va * dt;
    vertPosition = Math.max(-2, Math.min(2, vertPosition * 0.97 + vertVelocity * dt));

    var newPhase = vertVelocity > 0.07 ? 1 : vertVelocity < -0.07 ? -1 : vertPhase;
    if (newPhase !== 0 && newPhase !== vertPhase) {
      if (newPhase === -1) arcPeak   = vertPosition;
      else                 arcValley = vertPosition;
      var swing = Math.abs(arcPeak - arcValley);
      if (swing > 0.1) arcAmplitude = arcAmplitude * 0.75 + swing * 0.25;
      vertPhase = newPhase;
    }
  }

  function posMemLookup(pos) {
    var best = null, bestD = POS_BUCKET;
    for (var i = 0; i < posMemory.length; i++) {
      var d = Math.abs(posMemory[i].pos - pos);
      if (d < bestD) { bestD = d; best = posMemory[i]; }
    }
    return best;
  }

  function posMemRecord(pos, degree) {
    var m = posMemLookup(pos);
    if (m) {
      m.degree = Math.round(m.degree * 0.7 + degree * 0.3);
      m.count++;
    } else {
      if (posMemory.length >= POS_MAX) {
        var weakest = 0;
        for (var i = 1; i < posMemory.length; i++) {
          if (posMemory[i].count < posMemory[weakest].count) weakest = i;
        }
        posMemory.splice(weakest, 1);
      }
      posMemory.push({ pos: pos, degree: degree, count: 1 });
    }
  }

  function checkAnticipation(now) {
    if (!Audio.ctx || !lens || isSilent || fadeGain < 0.25) return;
    if (now - lastAnticTime < 550) return;
    if (Math.abs(vertVelocity) < 0.05) return;
    var cont = lens.palette && lens.palette.continuous;
    if (!cont || cont.beatLocked) return;
    for (var i = 0; i < posMemory.length; i++) {
      var m = posMemory[i];
      if (m.count < 2) continue;
      var dist = Math.abs(m.pos - vertPosition);
      var movingToward = (m.pos - vertPosition) * vertVelocity > 0;
      if (movingToward && dist < 0.30 && dist > 0.05) {
        var whisperVel = fadeGain * 0.06 * (1 - dist / 0.30);
        try {
          Audio.synth.play(cont.voice, Audio.ctx.currentTime,
            scaleFreq(m.degree, cont.octave || 0), whisperVel, (cont.decay || 0.8) * 0.2);
          lastAnticTime = now;
        } catch(e) {}
        break;
      }
    }
  }

  // ── GYRO → FILTER ─────────────────────────────────────────────────────

  function updateGyroFilter(sensor) {
    if (!lens) return;

    var gyroMag = 0;
    if (sensor.hasOrientation) {
      var dbeta = Math.abs(sensor.beta - (sensor._prevBeta || sensor.beta));
      var dgamma = Math.abs(sensor.gamma - (sensor._prevGamma || sensor.gamma));
      gyroMag = dbeta + dgamma;
      sensor._prevBeta = sensor.beta;
      sensor._prevGamma = sensor.gamma;
    }

    var range = (lens.response && lens.response.filterRange) || [200, 2800];
    var norm = Math.min(1, gyroMag / 8);
    filterTarget = range[0] + norm * (range[1] - range[0]);
    filterFreq += (filterTarget - filterFreq) * 0.08;

    if (droneLayer) {
      Audio.layer.setFilter('follow-drone', filterFreq, 0.05);
    }
  }

  // ── ROLE 2: SPACE — FOUNDATION DRONE ─────────────────────────────────
  // The harmonic ground. Always present when moving.
  // Root + fifth, quietly humming beneath the melody.

  function updateDensity(energy, dt) {
    energySmooth += (energy - energySmooth) * 0.03;

    var thresholds = (lens && lens.response && lens.response.densityThresholds) || [0.3, 1.0, 2.5];
    if (energySmooth < thresholds[0]) densityTarget = 0;
    else if (energySmooth < thresholds[1]) densityTarget = 1;
    else if (energySmooth < thresholds[2]) densityTarget = 2;
    else densityTarget = 3;

    densityLevel += (densityTarget - densityLevel) * 0.02;

    manageDrone(dt);
  }

  function manageDrone(dt) {
    if (!lens || !Audio.ctx) return;

    var tex = lens.palette && lens.palette.texture;
    if (!tex) return;

    // Foundation is always present (not density-gated) — it's the harmonic ground
    // More present than before: base volume * 2.5 so it can actually be felt
    var foundationVol = (tex.vol || 0.06) * 2.5;
    var targetGain = isSilent ? 0 : fadeGain * foundationVol;

    if (targetGain > 0.01 && !droneActive) {
      var base = harmonyDegree + hrDegOffset;
      var oct = tex.octave || -1;
      var oscs = [
        { wave: tex.wave || 'sine', freq: scaleFreq(base, oct),     gain: 0.20 },
        { wave: tex.wave || 'sine', freq: scaleFreq(base + 7, oct), detune: tex.detune || 8, gain: 0.15 },
      ];
      try {
        droneLayer = Audio.layer.build('follow-drone', {
          oscillators: oscs,
          filter: { type: 'lowpass', freq: 800, Q: 0.7 },
          reverbSend: tex.reverbSend || 0.4,
        });
        droneActive = true;
      } catch (e) { errorCount++; }
    }

    if (droneActive) {
      droneGain += (targetGain - droneGain) * 0.02;
      Audio.layer.setGain('follow-drone', droneGain);

      if (droneGain < 0.005) {
        Audio.layer.destroy('follow-drone');
        droneLayer = null;
        droneActive = false;
        droneGain = 0;
      }
    }
  }

  // ── STILLNESS → SILENCE ───────────────────────────────────────────────

  function updateStillness(mag, dt, now) {
    var threshold = (lens && lens.response && lens.response.stillnessThreshold) || 0.2;
    var timeout = (lens && lens.response && lens.response.stillnessTimeout) || 2.0;
    var fadeTime = (lens && lens.response && lens.response.fadeTime) || 3.0;

    if (mag < threshold) {
      stillnessTimer += dt;

      if (stillnessTimer > timeout && !isSilent) {
        isSilent = true;
        // A resolving note as the music fades
        if (lens && lens.palette && lens.palette.continuous) {
          try {
            var freq = scaleFreq(0, (lens.palette.continuous.octave || 0));
            Audio.synth.play(
              lens.palette.continuous.voice || 'epiano',
              Audio.ctx.currentTime, freq, 0.28, 2.5
            );
          } catch (e) {}
        }
        if (phraseActive) endPhrase(now);
      }

      if (isSilent) {
        fadeGain *= (1 - dt / fadeTime);
        if (fadeGain < 0.005) fadeGain = 0;
      }
    } else {
      if (isSilent && mag > threshold * 2) {
        isSilent = false;
        stillnessTimer = 0;

        // ── WAKE-UP ROOT — the harmonic home announces itself ──
        // Every entry into the music starts with a clear tonal center.
        // Root in the bass + opening melody note = instant orientation.
        if (lens && lens.palette && Audio.ctx) {
          // Bass root (one octave below) — the foundation
          try {
            Audio.synth.play('piano', Audio.ctx.currentTime,
              scaleFreq(0, -1), 0.32, 2.2);
          } catch(e) {}

          // Opening melody note
          if (lens.palette.continuous) {
            try {
              var cont = lens.palette.continuous;
              Audio.synth.play(cont.voice || 'epiano', Audio.ctx.currentTime + 0.05,
                scaleFreq(0, cont.octave || 0), 0.30, 1.8);
              noteCount++;
            } catch(e) {}
          }
        }
      }
      stillnessTimer = 0;

      if (!isSilent) {
        sessionEngagedTime += dt;
        sessionPhase = sessionEngagedTime < PHASE_LISTENING ? 0
                     : sessionEngagedTime < PHASE_ALIVE     ? 1
                     : 2;

        Audio.setMassivePhase(Math.max(epi.massiveFloor, sessionPhase === 0 ? 0 : sessionPhase === 1 ? 1 : 3));

        var fadeCeiling = sessionPhase === 0 ? 0.45 : sessionPhase === 1 ? 0.72 : 1.0;
        var targetFade = Math.min(fadeCeiling, mag / 2);
        fadeGain += (targetFade - fadeGain) * 0.05;
      }
    }
  }

  // ── THE VOID ──────────────────────────────────────────────────────────

  var VOID_FIFTHS   = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];
  var voidEngaged   = false;
  var voidSmooth    = 0;
  var voidFifthMs   = 0;
  var voidFifthIdx  = 0;
  var voidAscend    = 0;
  var VOID_FIFTH_MS = 8000;

  function enterVoid() {
    if (voidEngaged) return;
    voidEngaged  = true;
    voidSmooth   = 0;
    voidFifthMs  = VOID_FIFTH_MS * 0.6;
    voidFifthIdx = 0;
    voidAscend   = 0;

    if (Audio.ctx) {
      try {
        Audio.layer.build('void-wind', {
          noise: 'pink',
          filter: { type: 'bandpass', freq: 700, Q: 2.2 },
          gain: 0,
          reverbSend: 0.90,
        });
      } catch (e) {}
    }
  }

  function exitVoid() {
    if (!voidEngaged) return;
    voidEngaged = false;
    try { Audio.layer.setGain('void-wind', 0, 3.0); } catch (e) {}
    setTimeout(function () { try { Audio.layer.destroy('void-wind'); } catch (e) {} }, 3500);
    try { Audio.voidDrone.stop(); } catch (e) {}
    voidAscend = 0;
  }

  function playVoidChord() {
    if (!Audio.ctx) return;
    var time = Audio.ctx.currentTime;
    var semi = VOID_FIFTHS[voidFifthIdx];
    var freqRoot  = root * Math.pow(2, (semi - 12) / 12);
    var freqFifth = freqRoot * Math.pow(2, 7 / 12);
    var freqOct   = freqRoot * 2;
    var voices = [freqRoot, freqFifth, freqOct];
    for (var i = 0; i < voices.length; i++) {
      (function (f, offset) {
        try { Audio.synth.play('epiano', time + offset, f, 0.06, 9.0); } catch (e) {}
      })(voices[i], i * 0.7);
    }
  }

  function updateVoid(vState, vDepth, breathPhase, dt) {
    if (!Audio.ctx) return;

    if (vState === 0) {
      if (voidEngaged) exitVoid();
      return;
    }
    if (!voidEngaged) enterVoid();

    voidSmooth += (vDepth - voidSmooth) * 0.03;
    try { Audio.voidDrone.update(voidSmooth, breathPhase); } catch (e) {}

    var windVol = Math.min(0.18, voidSmooth * 0.24);
    try { Audio.layer.setGain('void-wind', windVol, 4.0); } catch (e) {}

    var sweepFreq = 500 + Math.sin(breathPhase) * 340 + voidAscend * 1600;
    try { Audio.layer.setFilter('void-wind', Math.max(150, sweepFreq), 1.8); } catch (e) {}

    if (voidSmooth > 0.32) {
      voidFifthMs += dt * 1000;
      if (voidFifthMs >= VOID_FIFTH_MS) {
        voidFifthMs = 0;
        playVoidChord();
        voidFifthIdx = (voidFifthIdx + 1) % VOID_FIFTHS.length;
      }
    }

    if (vState >= 3) {
      voidAscend = Math.min(1.0, voidAscend + dt * 0.010);
    }
  }

  // ── TOUCH ─────────────────────────────────────────────────────────────

  function touch(x, y, vx, vy) {
    if (!lens || !Audio.ctx || !active) return;

    var now = Date.now();
    var noteIntervalMs = (lens.response && lens.response.noteInterval) || 200;
    if (now - lastTouchNote < noteIntervalMs) return;

    var time = Audio.ctx.currentTime;
    var palette = lens.palette || {};
    var resp = palette.touch || palette.continuous || {};

    var rawDegree = Math.round((1 - y) * 14) - 7;
    var chordOffsets = [0, 2, 4, 7, -3, -5];
    var nearest = rawDegree;
    var minDist = 99;
    for (var ci = 0; ci < chordOffsets.length; ci++) {
      for (var oct = -1; oct <= 1; oct++) {
        var candidate = harmonyDegree + chordOffsets[ci] + oct * 7;
        var d = Math.abs(rawDegree - candidate);
        if (d < minDist) { minDist = d; nearest = candidate; }
      }
    }
    var degree = minDist <= 2 ? nearest : rawDegree + Math.round((nearest - rawDegree) * 0.4);
    var freq = scaleFreq(degree, resp.octave || 0);

    var speed = Math.sqrt(vx * vx + vy * vy);
    var vel = Math.min(1, 0.3 + speed * 0.08);
    vel *= Math.max(0.3, 1 - energySmooth * 0.35);

    var isFreshTouch = now - lastTouchNote > 400;
    if (isFreshTouch) touchDuck = 0.55;

    lastTouchNote = now;

    try {
      Audio.synth.play(resp.voice || 'epiano', time, freq, vel, resp.decay || 0.6);
      noteCount++;
      if (typeof Pattern !== 'undefined') Pattern.onNote(degree);
    } catch (e) { errorCount++; }

    if (isSilent) {
      isSilent = false;
      stillnessTimer = 0;
      fadeGain = 0.5;
    }
  }

  // ── MAIN UPDATE ───────────────────────────────────────────────────────
  // 12 calls. Each one clear. Each one purposeful.
  // LEAD → PULSE → ANSWER → SPACE — in that order.

  function update(brainState, sensor, dt) {
    if (!active || !lens) return;

    var now = performance.now();
    var mag = getLensMag(brainState, sensor);

    pushAccel(mag);

    // ── Core state ──
    classifyArchetype(brainState);
    updateRapidOscillation(now, dt);
    updateInversion(sensor, dt);
    updatePhrase(mag, now, dt);
    parseIntent(mag, now);
    updateStillness(mag, dt, now);

    // Brain void override
    if ((brainState.voidState || 0) >= 2 && !isSilent) {
      var vThresh = (lens.response && lens.response.stillnessThreshold) || 0.2;
      if (mag < vThresh * 3) {
        isSilent = true;
        if (phraseActive) endPhrase(now);
      }
    }

    // ── Peak detection ──
    if (detectPeak(mag, now)) {
      recordPeakInterval(now);
      onPeak(lastMag, now);
    }

    lastLastMag = lastMag;
    lastMag = mag;

    // ── ROLE 3 PULSE: tempo lock + bar phase + drums ──
    updateTempoLock(now);
    updateBarPhase(now);
    processGrooveHats(now);
    processGrooveKickSnare(now);

    // ── ROLE 1 LEAD: melody ──
    updateVertical(sensor, dt);
    updateTiltPitch(sensor, now);
    processBeatMelody(now);
    checkAnticipation(now);

    // ── ROLE 4 ANSWER: call & response ──
    processAnswer(now);

    // ── ROLE 2 SPACE: foundation + harmonic rhythm ──
    updateGyroFilter(sensor);
    updateDensity(mag, dt);
    updateHarmonicRhythm(dt);

    // ── Session + evolution ──
    if (!isSilent && sessionPhase >= 2) sessionEnergyAccum += energySmooth * dt;
    updateHarmonicArc(dt);
    checkEpigeneticAdvance(now);

    // ── Master gain ──
    touchDuck = Math.min(1.0, touchDuck + dt * 2.0);
    if (Audio.ctx) {
      Audio.setMasterGain(0.62 * fadeGain * touchDuck);

      if (typeof Weather !== 'undefined' && Weather.loaded && lens) {
        var wxm = Weather.mods;
        var baseRv = (lens.space && lens.space.reverbMix) || 0.25;
        Audio.setReverbMix(Math.min(0.85, baseRv + epi.spaceMix + wxm.reverbBoost));
      }
    }

    // ── 8D Spatial ──
    try { Audio.spatial.update(sensor.gamma || 0, isSilent, sensor.touching); } catch (e) {}

    // ── The Void ──
    updateVoid(
      brainState.voidState  || 0,
      brainState.voidDepth  || 0,
      brainState.breathPhase || 0,
      dt
    );

    lastUpdateTime = now;
  }

  // ── SPIKE HANDLER ─────────────────────────────────────────────────────

  function onSpike(data) {
    if (!active || !lens || !Audio.ctx || isSilent || sessionPhase < 1) return;

    try {
      var time = Audio.ctx.currentTime;
      var palette = lens.palette || {};

      switch (data.neuron) {
        case 'shake':   break; // expressed through LEAD density
        case 'sweep':   break; // expressed through LEAD pitch
        case 'circle':  break; // expressed through spatial rotation

        case 'toss':
          if (lens.groove) {
            Audio.drum.kick(time, 0.9, lens.groove.kit || 'acoustic');
            Audio.drum.snare(time + 0.01, 0.7, lens.groove.kit || 'acoustic');
          }
          break;

        case 'pendulum':
          if (palette.harmonic && data.rate > 1) {
            var freq = scaleFreq(harmonyDegree + 4, (palette.harmonic.octave || 0));
            Audio.synth.play(palette.harmonic.voice || 'epiano', time, freq, 0.15, 0.5);
          }
          break;

        case 'rock': break;
      }
    } catch (e) { errorCount++; }
  }

  // ── COMPRESSION TRIGGER (called by Pattern) ───────────────────────────

  function triggerCompression() {
    epiAdvancePending = true;
  }

  // ── PUBLIC API ────────────────────────────────────────────────────────

  return Object.freeze({
    init: init,
    applyLens: applyLens,
    update: update,
    touch: touch,
    onSpike: onSpike,

    get tempo() { return derivedTempo; },
    get confidence() { return rhythmConfidence; },
    get density() { return densityLevel; },
    get silent() { return isSilent; },
    get fade() { return fadeGain; },
    get filterFreq() { return filterFreq; },
    get peaks() { return peakCount; },
    get notes() { return noteCount; },
    get errors() { return errorCount; },
    get degree() { return currentDegree; },
    get energy() { return energySmooth; },
    get ctxState() { return Audio.ctx ? Audio.ctx.state : 'none'; },
    get locked() { return tempoLocked; },
    get lockStr() { return lockStrength; },
    get archetype() { return archetype; },
    get intent() { return ['BREATH','QUESTION','GROOVE','STATEMENT','RESOLUTION','EXCLAMATION'][currentIntent] || '?'; },
    get answer() { return answerPending ? 'pending@' + Math.round(Math.max(0, answerFireTime - performance.now())) + 'ms' : '-'; },
    get phrase() { return phraseActive ? phraseEnergyArc.toFixed(2) : 'none'; },
    get phase() { return sessionPhase; },
    get sessionTime() { return Math.round(sessionEngagedTime); },
    get generation() { return generation; },
    get sessionEnergy() { return Math.round(sessionEnergyAccum) + '/' + epi.energyGate; },
    get hrState() { return hrState; },
    scaleFreq: scaleFreq,
    triggerCompression: triggerCompression,
    get melodicVocab() { return melodicHistory.slice(); },
  });
})();
