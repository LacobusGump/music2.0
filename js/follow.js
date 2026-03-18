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
 * v95: Ascension Hidden Songwriter — acclimate (raw) → grid lock (107 BPM).
 *       System analyzes user's pitch choices, picks matching progression,
 *       enriches with bass/magnetism/layers over 8 bars. The user IS the song.
 * v93: Grid complexity expansion — wire all arr properties. Snare/perc variants,
 *       halftime, swing, delay throw, reverb wash, filterQ override, stab voicings.
 *       6 depth tiers. Texture bias for exploring archetype.
 * v89: Tribal drums + shaker gestures. Random stage order. Stage groove DNA fix.
 * v88: Big merge — 6 organic lenses → Journey (Drift→Still Water→Tundra→Dark Matter).
 *       Organic stage evolution: crossfades tone/space over 30s, swaps palette/mode at 50%.
 *       2.5min per stage. Three-act arc runs independently on top.
 * v87: Grid 15-second DJ-move evolution.
 * v86: Grid DJ set evolution — vocal cooldown fix.
 * v79: Music waits for you. Autonomy gates on Brain.short.energy().
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
  // Journey uses the tribal pulse system instead — these are for Grid only.

  var GROOVE_DNA = {
    'Grid': {
      kick:  [1.0,0,0,0.28, 0,0,0.55,0, 1.0,0,0,0.28, 0,0,0,0],
      snare: [0,0,0,0, 0,0,0,0, 0.98,0,0,0, 0,0,0.18,0],
      hat:   [0.78,0,0,0, 0,0,0.42,0, 0.65,0,0.52,0, 0.42,0.60,0.42,0.60],
      feel: 0.04, kit: '808', snap: 1, halftime: true,
    },
  };

  var GROOVE_DNA_DEFAULT = {
    kick:  [0.7,0,0,0, 0,0,0,0, 0.3,0,0,0, 0,0,0,0],
    snare: [0,0,0,0,   0,0,0,0, 0.6,0,0,0, 0,0,0,0],
    hat:   [0,0,0,0,   0.09,0,0,0, 0,0,0,0, 0.09,0,0,0],
    feel: 0, kit: 'acoustic', snap: 2, halftime: true,
  };

  // ── TRIBAL PULSE ─────────────────────────────────────────────────────
  // Internal 107 BPM clock for Afro-Cuban rhythms in Journey.
  // Drums do NOT exist at the start. They creep in over minutes.
  // The ethereal dreamscape comes first. Drums are earned.

  var tribalPulse = {
    bpm: 107,
    phase: 0,         // 0-1 within current bar
    bar: 0,           // 0 or 1 (2-bar cycle)
    lastStep: -1,
    drumPresence: 0,  // 0-1: how much drums have "arrived"
    engagedTime: 0,   // total engaged seconds (only counts active play)
  };

  // 2-bar Afro-Cuban patterns at 107 BPM (16 steps per bar)
  // Inspired by son clave, tumbao, cascara — but simplified for synthesis
  // Each row: [bar0 pattern, bar1 pattern]

  var TRIBAL_KICK = [
    // Bar 1: anchor on beat 1, ghost "&" of 3
    [0.50,0,0,0, 0,0,0,0, 0,0,0.22,0, 0,0,0,0],
    // Bar 2: syncopated — beat 3, light "&" of 4
    [0,0,0,0, 0,0,0,0, 0.38,0,0,0, 0,0,0.20,0],
  ];

  var TRIBAL_SLAP = [
    // Bar 1: son clave 3-side feel — positions 3, 6
    [0,0,0,0.32, 0,0,0.42,0, 0,0,0,0, 0,0,0,0],
    // Bar 2: clave 2-side — positions 2, 6, 11
    [0,0,0.28,0, 0,0,0.35,0, 0,0,0,0.25, 0,0,0,0],
  ];

  var TRIBAL_SHAKER = [
    // Gentle pulse — 8th notes with "&" accents
    [0.05,0,0.09,0, 0.05,0,0.09,0, 0.05,0,0.09,0, 0.05,0,0.09,0],
    [0.05,0,0.09,0, 0.05,0,0.09,0, 0.05,0,0.09,0, 0.05,0,0.11,0],
  ];

  // ── MOTION PROFILE — Cross-session learning ────────────────────────────
  // Watches how YOU move. After 2+ sessions, adapts thresholds to your body.
  // Like GPS: the more you play, the more it knows you.
  var motionProfile = (function () {
    var KEY = 'm2_profile_v1';
    var data = { n: 0, peakMag: null, stillRate: null, archetype: null };
    try { var raw = localStorage.getItem(KEY); if (raw) data = JSON.parse(raw); } catch (e) {}
    var sess = { peaks: [], stillMs: 0, totalMs: 0, t0: Date.now() };
    var saved = false;
    var handlersRegistered = false;

    function lerp(a, b, t) { return a + (b - a) * t; }
    function alpha() { return Math.max(0.08, 1 / Math.sqrt(data.n + 1)); }

    var api = {
      recordPeak: function (mag) { sess.peaks.push(mag); },

      tick: function (dtMs, silent) {
        sess.totalMs += dtMs;
        if (silent) sess.stillMs += dtMs;
      },

      // Returns response object with thresholds calibrated to this user's body.
      // Session 1: 0% influence. Session 5: ~48%. Session 10+: 75%.
      adapt: function (r) {
        if (!r || data.n < 2 || data.peakMag === null) return r;
        var weight = Math.min(0.75, (data.n - 1) * 0.12);
        var adapted = {};
        for (var k in r) adapted[k] = r[k];
        // Trigger at 65% of their observed peak — feels responsive without false hits
        var personalThresh = data.peakMag * 0.65;
        adapted.peakThreshold = lerp(r.peakThreshold, personalThresh, weight);
        adapted.peakThreshold = Math.max(0.12, Math.min(3.5, adapted.peakThreshold));
        // Restless movers (< 20% still) get a raised stillness threshold — real silence = real pause
        if (data.stillRate !== null && data.stillRate < 0.20) {
          adapted.stillnessThreshold = Math.min((r.stillnessThreshold || 0.2) * 1.5, 0.45);
        }
        return adapted;
      },

      endSession: function () {
        if (saved || sess.peaks.length < 3) return;
        saved = true;
        var avgPeak = sess.peaks.reduce(function (x, y) { return x + y; }, 0) / sess.peaks.length;
        var a = alpha();
        data.n++;
        data.peakMag    = data.peakMag === null ? avgPeak : lerp(data.peakMag, avgPeak, a);
        data.stillRate  = sess.stillMs / Math.max(1, sess.totalMs);
        var per60 = sess.peaks.length / (Math.max(1, sess.totalMs) / 60000);
        if      (per60 > 10 && data.peakMag > 1.8) data.archetype = 'surge';
        else if (per60 > 6  && data.peakMag > 1.2) data.archetype = 'pulse';
        else if (data.stillRate > 0.50)             data.archetype = 'meditator';
        else                                        data.archetype = 'flow';
        try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
      },

      registerHandlers: function () {
        if (handlersRegistered) return;
        handlersRegistered = true;
        document.addEventListener('visibilitychange', function () {
          if (document.hidden) api.endSession();
        });
        window.addEventListener('beforeunload', function () { api.endSession(); });
      },

      get sessions()  { return data.n; },
      get archetype() { return data.archetype || 'new'; },
      get peakMag()   { return data.peakMag !== null ? +data.peakMag.toFixed(2) : null; },
    };
    return api;
  })();

  var BAR_BEATS  = 4;
  var STEP_COUNT = 16;

  var root = 432;
  var scale = MODES.major;
  var baseScale  = null;   // original mode snapshot — restored in Act III
  var sessionAct = 0;      // 0=Emergence, 1=Journey(sus4), 2=Homecoming(+voices)

  // ── HARMONIC ARC ───────────────────────────────────────────────────────
  var originalRoot   = 432;
  var rootSemiOffset = 0;
  var rootSemiTarget = 0;
  var arcStep        = 0;
  var ARC_JOURNEY    = [0, 0, 0, 0];
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
  var adaptedPeakThresh = null;
  var adaptedStillThresh = null;

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

  // ── V→I HARMONIC GRAVITY ─────────────────────────────────────────────
  // Bass cadence only — no melodic transposition.
  // The bass walks to V (dominant), then resolves home to I (tonic).
  // The melody keeps playing in the tonic key the whole time.
  // Tension comes from the bass, resolution is the payoff.
  //
  //   tonic (18-26s of playing) → V bass note → dominant hold (8-12s) → V→I cadence → tonic
  //
  // Triggered by: timer expiry, or user going silent (silence IS the resolution)
  var gravityState      = 'tonic';
  var gravityTimer      = 0;
  var gravityTonicDur   = 20;
  var gravityDomDur     = 0;
  var gravityDidResolve = false;

  function _resolveToTonic() {
    gravityState = 'resolving';
    gravityTimer = 0;
    // V→I cadence: V bass then tonic bass 0.45s later — the payoff
    if (Audio.ctx && lens) {
      var now  = Audio.ctx.currentTime;
      var base = originalRoot * 0.25;   // two octaves below original tonic
      try {
        Audio.synth.play('piano', now,        base * 1.498, 0.18, 3.0);  // V — the ache
        Audio.synth.play('piano', now + 0.45, base,         0.22, 4.5);  // I — the relief
      } catch(e) {}
    }
    hrState = 'root'; hrDegOffset = 0;
    try { updateFoundationPitch(); } catch(e) {}
  }

  function updateHarmonicGravity(dt) {
    if (sessionPhase < 1 || !lens) return;

    // Only advance toward dominant when user is playing.
    // Low energy = gravity timer freezes. The bass walk is YOUR move, not the clock's.
    var motionNow = (typeof Brain !== 'undefined') ? Brain.short.energy() : 1.0;
    if (motionNow < 0.10) return;

    gravityTimer += dt;

    if (gravityState === 'tonic') {
      if (isSilent) { gravityTimer = 0; gravityDidResolve = false; return; }

      if (gravityTimer >= gravityTonicDur) {
        gravityState  = 'dominant';
        gravityTimer  = 0;
        gravityDomDur = 8 + Math.random() * 5;
        // Announce the V with a quiet bass note — listener feels the ground shift
        if (Audio.ctx && lens) {
          try {
            Audio.synth.play('piano', Audio.ctx.currentTime,
              originalRoot * 0.25 * 1.498, 0.12, 3.5);
          } catch(e) {}
        }
      }

    } else if (gravityState === 'dominant') {
      var silenceResolve = isSilent && !gravityDidResolve;
      if (silenceResolve || gravityTimer >= gravityDomDur) {
        gravityDidResolve = silenceResolve;
        _resolveToTonic();
      }

    } else if (gravityState === 'resolving') {
      if (gravityTimer > 1.2) {
        gravityState    = 'tonic';
        gravityTimer    = 0;
        gravityTonicDur = 18 + Math.random() * 10;
      }
    }
  }

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
    // Timer only advances when the user is actively moving.
    // If you stop, the harmonic rhythm pauses — music waits for you.
    var motionNow = (typeof Brain !== 'undefined') ? Brain.short.energy() : 1.0;
    if (motionNow < 0.12) return;
    hrTimer += dt * 1000;
    if (hrTimer < hrTarget) return;
    hrTimer = 0;

    if (hrState === 'root') {
      // Move away from root — IV or V depending on phrase energy
      hrState = (phraseEnergyArc > 0.45 || rhythmConfidence > 0.5) ? 'v' : 'iv';
      hrDegOffset = hrState === 'v' ? 4 : 3;  // scale degrees: 5th or 4th
      hrTarget = 2500 + Math.random() * 2500;  // away for 2.5-5s

      // Announce the color shift — two octaves for depth
      if (Audio.ctx && lens && lens.palette) {
        var t = Audio.ctx.currentTime;
        try { Audio.synth.play('piano', t, scaleFreq(hrDegOffset, -1), 0.26, 3.5); } catch(e) {}
        try { Audio.synth.play('piano', t, scaleFreq(hrDegOffset, -2), 0.18, 4.0); } catch(e) {}
      }
    } else {
      // Return home — the resolution is the satisfying moment
      hrState = 'root';
      hrDegOffset = 0;
      hrTarget = 8000 + Math.random() * 8000; // home for 8-16s

      // Resolution landing — two octaves, sub gives it physical weight
      if (Audio.ctx && lens && lens.palette) {
        var t2 = Audio.ctx.currentTime;
        try { Audio.synth.play('piano', t2, scaleFreq(0, -1), 0.30, 4.0); } catch(e) {}
        try { Audio.synth.play('piano', t2, scaleFreq(0, -2), 0.22, 5.0); } catch(e) {}
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

  // ── GESTURE-DRIVEN SHAKER ─────────────────────────────────────────────
  // Shaking the phone = shaker instrument. The machine assigns your gesture as a part.
  var shakerState = {
    active: false,      // currently producing shaker hits
    lastHitTime: 0,     // prevent machine-gunning
    intensity: 0,       // 0-1, builds with shaking, decays on stop
    pattern: null,      // generated rhythm pattern from user's motion
  };

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
    // Only call & respond when user is genuinely active — not drifting passively.
    var motionNow = (typeof Brain !== 'undefined') ? Brain.short.energy() : 1.0;
    if (motionNow < 0.25) return;

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

    // If user went still before the answer fired, cancel it — the conversation is over.
    var motionNow = (typeof Brain !== 'undefined') ? Brain.short.energy() : 1.0;
    if (isSilent || motionNow < 0.08) {
      answerPending = false;
      return;
    }

    if (now < answerFireTime) return;

    if (answerIdx < answerNotes.length) {
      var note = answerNotes[answerIdx];
      if (now >= answerFireTime + note.delayMs) {
        var h = lens.palette && lens.palette.harmonic;
        if (h) {
          var freq = scaleFreq(note.deg, h.octave || 0);
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

    // rootSemiTarget drift disabled — was causing melody to chase upward indefinitely
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

  // ── THREE-ACT MUSICAL ARC ─────────────────────────────────────────────
  // Act I  (0-90s engaged)  — Emergence: original mode, sparse, space
  // Act II (90-300s)        — Journey: suspended 4th replaces 3rd (open, floating)
  // Act III (300s+)         — Homecoming: mode returns home, + parallel sub voice
  //
  // This is the Inception trick: ONE note changes in the scale (the 3rd → 4th)
  // and the entire emotional color lifts into suspension.
  //
  function checkActAdvance() {
    if (!lens || !baseScale || sessionPhase < 1) return;

    if (sessionAct === 0 && sessionEngagedTime >= 90) {
      sessionAct = 1;
      jrnRecord('ACT', { to: 1, name: 'sus4 — floating/unresolved', engaged: Math.round(sessionEngagedTime) });
      // Sus4: replace the 3rd degree with the 4th — open, floating, unresolved
      scale = baseScale.slice();
      scale[2] = scale[3];  // major:4→5, dorian:3→5, phrygian:3→5, all modes work
      // Announce: two quiet notes ascending into the new color
      if (Audio.ctx && lens && lens.palette && lens.palette.continuous) {
        var vc = lens.palette.continuous.voice || 'epiano';
        var t = Audio.ctx.currentTime;
        try { Audio.synth.play(vc, t,       scaleFreq(3, -1), 0.18, 2.5); } catch(e) {}
        try { Audio.synth.play(vc, t + 0.9, scaleFreq(3,  0), 0.14, 3.0); } catch(e) {}
      }

    } else if (sessionAct === 1 && sessionEngagedTime >= 300) {
      sessionAct = 2;
      jrnRecord('ACT', { to: 2, name: 'homecoming — mode restored', engaged: Math.round(sessionEngagedTime) });
      // Homecoming: restore original mode — same home, but now feels transformed
      scale = baseScale.slice();
      // Announce: descending resolution (4→1 = falling into place)
      if (Audio.ctx && lens && lens.palette && lens.palette.continuous) {
        var vc2 = lens.palette.continuous.voice || 'epiano';
        var t2 = Audio.ctx.currentTime;
        try { Audio.synth.play(vc2, t2,       scaleFreq(4, 0), 0.16, 2.0); } catch(e) {}
        try { Audio.synth.play(vc2, t2 + 0.7, scaleFreq(0, 0), 0.22, 4.5); } catch(e) {}
      }
    }
  }

  // ── DECEPTIVE CADENCE TENSION ARC ─────────────────────────────────────
  // The Hans Zimmer / Interstellar docking technique.
  // Music approaches V→I resolution. At the last moment, sidesteps to VI (deceptive).
  // Each miss primes expectation higher. After 3 misses: the real V→I lands.
  // Works for Tundra and Still Water where the emotional payoff matters most.
  //
  // Sequence:
  //   IDLE → BUILDING (10-12s active play, phase 2)
  //   BUILDING → NEAR-MISS: V bass note → 2.2s → VI bass (not I) = "almost"
  //   NEAR-MISS → BUILDING: tension++ reverb tightens, cycle repeats (2-3×)
  //   BUILDING → RESOLVE: V bass → 1.5s → I bass + I melody simultaneously = BOOM
  //   RESOLVE → COOLDOWN (35s before next arc)
  //
  // Harmonic ratios (mode-independent, pure intervals):
  //   V  = root × 1.498 (perfect 5th)
  //   VI = root × 1.682 (major 6th — deceptive target)
  //   I  = root (home)

  var tensionArc = {
    phase:     'idle',   // 'idle', 'building', 'near-miss', 'resolving', 'cooldown'
    timer:     0,
    level:     0,        // 0-3, misses accumulated
    buildTime: 12,       // seconds until next phase event (randomized)
    maxMisses: 3,
    fired:     false,    // single-fire guard per phase tick
  };

  function hasTensionArc() {
    return lens && lens.emotion && lens.emotion.tensionArc;
  }

  function _tensionPlayNote(type) {
    if (!Audio.ctx || !lens) return;
    var now = Audio.ctx.currentTime;
    var base = originalRoot * 0.25;   // 2 octaves below root — the bass register

    if (type === 'dominant') {
      // V — the setup note. Listener hears: "something's about to happen"
      try { Audio.synth.play('piano', now, base * 1.498, 0.20, 5.0); } catch(e) {}

    } else if (type === 'deceptive') {
      // VI instead of I — "almost... but no"
      // The sidestep to the major 6th is the oldest trick in Western music.
      try { Audio.synth.play('piano', now, base * 1.682, 0.16, 4.0); } catch(e) {}
      // Picardy mode: flicker the major 3rd — grief glimpsing hope, then not getting it
      if (lens.harmony && lens.harmony.mode === 'picardy') {
        try { Audio.synth.play('piano', now + 1.0, scaleFreq(3, 0), 0.09, 3.5); } catch(e) {}
      }

    } else if (type === 'resolve') {
      // The BOOM. Everything lands at once. Root in three registers simultaneously.
      try { Audio.synth.play('piano', now,       base,            0.42, 6.0); } catch(e) {}  // deep root
      try { Audio.synth.play('piano', now + 0.08, base * 2,       0.30, 5.0); } catch(e) {}  // root up one
      try { Audio.synth.play('piano', now + 0.18, originalRoot,   0.22, 4.0); } catch(e) {}  // top root
      // Picardy mode: major 3rd in the resolution = the final "light" moment
      if (lens.harmony && lens.harmony.mode === 'picardy') {
        try { Audio.synth.play('piano', now + 0.6, scaleFreq(3, 0), 0.16, 4.5); } catch(e) {}
      }
      // Lydian mode: #4 grace note — floats just before settling
      if (lens.harmony && lens.harmony.mode === 'lydian') {
        try { Audio.synth.play('strings', now + 0.4, scaleFreq(3, 0), 0.14, 3.5); } catch(e) {}
      }
    }
  }

  function updateTensionArc(dt) {
    if (!hasTensionArc() || sessionPhase < 2 || !Audio.ctx) return;

    tensionArc.timer += dt;

    if (tensionArc.phase === 'idle') {
      // Start building after 20s of engaged play in phase 2
      if (sessionEngagedTime > 20 && tensionArc.timer > 8) {
        tensionArc.phase = 'building';
        tensionArc.timer = 0;
        tensionArc.buildTime = 10 + Math.random() * 6;
        tensionArc.fired = false;
      }

    } else if (tensionArc.phase === 'building') {
      if (isSilent) { tensionArc.timer -= dt * 1.5; return; } // pause during silence
      if (tensionArc.timer >= tensionArc.buildTime) {
        tensionArc.phase = (tensionArc.level >= tensionArc.maxMisses) ? 'resolving' : 'near-miss';
        tensionArc.timer = 0;
        tensionArc.fired = false;
      }

    } else if (tensionArc.phase === 'near-miss') {
      if (!tensionArc.fired && tensionArc.timer > 0.1) {
        tensionArc.fired = true;
        _tensionPlayNote('dominant');  // "here it comes..."
      }
      if (tensionArc.timer > 2.2 && tensionArc.timer < 2.4) {
        if (!tensionArc._deceptiveFired) {
          tensionArc._deceptiveFired = true;
          _tensionPlayNote('deceptive');   // sidestep to VI — "NOT YET"
          tensionArc.level++;
          // Each miss tightens reverb — space closes in as tension builds
          var baseRv = (lens.space && lens.space.reverbMix) || 0.45;
          try { Audio.setReverbMix(Math.min(0.88, baseRv + 0.08 * tensionArc.level + epi.spaceMix)); } catch(e) {}
        }
      }
      if (tensionArc.timer > 4.0) {
        tensionArc.phase = 'building';
        tensionArc.timer = 0;
        tensionArc._deceptiveFired = false;
        tensionArc.fired = false;
        // Shorten build time as tension rises — misses come faster
        tensionArc.buildTime = Math.max(5, 10 - tensionArc.level * 1.5 + Math.random() * 3);
      }

    } else if (tensionArc.phase === 'resolving') {
      if (!tensionArc.fired && tensionArc.timer > 0.1) {
        tensionArc.fired = true;
        _tensionPlayNote('dominant');    // "okay... NOW"
      }
      if (tensionArc.timer > 1.8 && !tensionArc._resolveFired) {
        tensionArc._resolveFired = true;
        _tensionPlayNote('resolve');     // THE BOOM
        // Reverb opens wide — the space expands as the tension releases
        var baseRv2 = (lens.space && lens.space.reverbMix) || 0.45;
        try { Audio.setReverbMix(Math.min(0.94, baseRv2 + 0.40)); } catch(e) {}
      }
      if (tensionArc.timer > 6.0) {
        tensionArc.phase = 'cooldown';
        tensionArc.timer = 0;
        tensionArc.level = 0;
        tensionArc._resolveFired = false;
        // Reverb settles back to lens default over ~8s
        try { Audio.setReverbMix((lens.space && lens.space.reverbMix) || 0.45); } catch(e) {}
      }

    } else if (tensionArc.phase === 'cooldown') {
      // Long pause before the arc can repeat — the resolution needs space to breathe
      if (tensionArc.timer > 40) {
        tensionArc.phase = 'idle';
        tensionArc.timer = 0;
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

  // ── GESTURE-DRIVEN SHAKER ──────────────────────────────────────────────
  // When the user shakes, trigger shaker hits synced to their motion peaks.
  // The faster they shake, the denser the shaker pattern.

  function updateShaker(mag, now, dt) {
    if (!Audio.ctx || !Audio.drum.shaker || isSilent || lens.name === 'Grid') return;

    // Build intensity when shaking (bouncing archetype or tremolo)
    var isShaking = tremoloState || (archetype === 'bouncing' && mag > 0.8);

    if (isShaking) {
      shakerState.intensity = Math.min(1, shakerState.intensity + dt * 2.5);
      shakerState.active = true;

      // Fire shaker on peaks — the user's shake rhythm IS the shaker rhythm
      var minGap = 40; // ~25 hits/sec max
      if (now - shakerState.lastHitTime > minGap && mag > 0.5) {
        var vel = Math.min(1, mag * 0.4) * shakerState.intensity;
        var dur = 0.04 + Math.random() * 0.03; // slight variation
        Audio.drum.shaker(Audio.ctx.currentTime, vel * fadeGain, dur);
        shakerState.lastHitTime = now;
      }
    } else {
      // Decay intensity
      shakerState.intensity = Math.max(0, shakerState.intensity - dt * 1.5);
      if (shakerState.intensity < 0.02) {
        shakerState.active = false;
      }
    }
  }

  // ── TRIBAL PULSE ENGINE ──────────────────────────────────────────────
  // Internal 107 BPM clock for Journey. Drums creep in over time.
  // First ~90s: silence. Then ghost hits emerge. By 5 min: full Afro-Cuban.
  //
  // drumPresence build curve:
  //   0-20s engaged:    0.0  (pure ethereal dreamscape, earn the drums)
  //   20-60s:           0→0.20  (first ghost shaker, barely there)
  //   60-120s:          0.20→0.50  (frame drum heartbeat emerges)
  //   120-240s:         0.50→0.85  (clave pattern, slaps arrive)
  //   240s+:            0.85→1.0  (full Afro-Cuban intricacies)

  function updateTribalPulse(dt) {
    if (!lens || lens.name === 'Grid' || !Audio.ctx || !Audio.drum) return;

    // Count engaged (non-silent) time
    if (!isSilent) {
      tribalPulse.engagedTime += dt;
    }

    // Build drumPresence along the curve
    var t = tribalPulse.engagedTime;
    var target;
    if (t < 20)       target = 0;
    else if (t < 60)  target = 0.20 * ((t - 20) / 40);
    else if (t < 120) target = 0.20 + 0.30 * ((t - 60) / 60);
    else if (t < 240) target = 0.50 + 0.35 * ((t - 120) / 120);
    else              target = Math.min(1.0, 0.85 + 0.15 * ((t - 240) / 60));

    // Smooth approach (no sudden jumps)
    tribalPulse.drumPresence += (target - tribalPulse.drumPresence) * dt * 0.8;

    // Nothing to play yet
    if (tribalPulse.drumPresence < 0.01) return;

    // Advance internal clock at 107 BPM
    var stepDur = 60 / (tribalPulse.bpm * 4); // duration of one 16th note
    tribalPulse.phase += dt / (stepDur * 16);  // phase is 0-1 across one bar
    if (tribalPulse.phase >= 1) {
      tribalPulse.phase -= 1;
      tribalPulse.bar = 1 - tribalPulse.bar; // toggle 0/1
      tribalPulse.lastStep = -1;
    }

    var currentStep = Math.floor(tribalPulse.phase * 16);
    if (currentStep === tribalPulse.lastStep) return;
    tribalPulse.lastStep = currentStep;

    var time = Audio.ctx.currentTime;
    var dp = tribalPulse.drumPresence;
    var bar = tribalPulse.bar;

    // Shaker: first to appear (dp > 0.05), quiet and organic
    var shVel = TRIBAL_SHAKER[bar][currentStep];
    if (shVel > 0 && dp > 0.05) {
      var sv = shVel * dp * 3.0; // boost so ghost hits are audible
      if (sv > 0.005) {
        Audio.drum.shaker(time, Math.min(0.35, sv), 0.04 + Math.random() * 0.02);
      }
    }

    // Frame drum kick: appears around dp > 0.20
    var kickVel = TRIBAL_KICK[bar][currentStep];
    if (kickVel > 0 && dp > 0.20) {
      var kv = kickVel * dp * 1.5;
      if (kv > 0.01) {
        Audio.drum.kick(time, Math.min(0.65, kv), 'tribal');
      }
    }

    // Hand slap: last to arrive, dp > 0.40 — the clave pattern
    var slapVel = TRIBAL_SLAP[bar][currentStep];
    if (slapVel > 0 && dp > 0.40) {
      var slv = slapVel * (dp - 0.25) * 1.8;
      if (slv > 0.01) {
        Audio.drum.snare(time, Math.min(0.55, slv), 'tribal');
      }
    }
  }

  function resetTribalPulse() {
    tribalPulse.phase = 0;
    tribalPulse.bar = 0;
    tribalPulse.lastStep = -1;
    tribalPulse.drumPresence = 0;
    tribalPulse.engagedTime = 0;
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
    if (lens.stages) return; // Journey uses tribal pulse
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
    if (lens.stages) return; // Journey uses tribal pulse

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
    motionProfile.registerHandlers();
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
    sessionAct = 0;
    voidPresence = 0;
    voidEngaged = false;
    tensionArc.phase = 'idle'; tensionArc.timer = 0; tensionArc.level = 0;
    tensionArc.fired = false; tensionArc._deceptiveFired = false; tensionArc._resolveFired = false;
    if (grid.active) teardownGrid();
  }

  // ── HARMONIC ARC UPDATE ───────────────────────────────────────────────

  function updateHarmonicArc(dt) {
    updateHarmonicGravity(dt);

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

    var adaptedResp = motionProfile.adapt(lens.response || {});
    adaptedPeakThresh  = adaptedResp.peakThreshold || null;
    adaptedStillThresh = adaptedResp.stillnessThreshold || null;

    originalRoot   = (lens.harmony && lens.harmony.root) || 432;
    root           = originalRoot;
    scale          = MODES[(lens.harmony && lens.harmony.mode) || 'major'] || MODES.major;
    baseScale      = scale.slice();
    sessionAct     = 0;
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
    epi.rootDrift = 0; epi.spaceMix = 0;
    epi.massiveFloor = (lens.space && lens.space.massiveStart) || 0;
    epi.energyGate = 24; epi.harmonyCarry = 0;
    try { Audio.setMassivePhase(epi.massiveFloor); } catch(e) {}
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
    gravityState = 'tonic'; gravityTimer = 0;
    gravityTonicDur = 18 + Math.random() * 8;
    gravityDomDur = 0; gravityDidResolve = false;
    try { Audio.descentBass.stop(); } catch (e) {}

    // Grid EDM engine: init if this is the Grid lens, teardown otherwise
    if (grid.active) teardownGrid();
    if (lens.name === 'Grid' && lens.edm) {
      initGrid();
    }

    // Ascension engine: init if this is the Ascension lens, teardown otherwise
    if (asc.active) teardownAscension();
    if (lens.name === 'Ascension' && lens.ascension) {
      initAscension();
    }

    // Organic stage evolution: reset for Journey lens
    resetOrganicStage();
    resetTribalPulse();
  }

  // ── PEAK DETECTION ────────────────────────────────────────────────────

  function pushAccel(mag) {
    accelBuf[accelHead] = mag;
    accelHead = (accelHead + 1) & 63;
    if (accelLen < 64) accelLen++;
  }

  function detectPeak(mag, now) {
    if (peakCooldown > 0) { peakCooldown--; return false; }

    var threshold = adaptedPeakThresh || (lens && lens.response ? (lens.response.peakThreshold || 1.5) : 1.5);

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
        // Act III: parallel sub-octave voice — more voices, not chords
        if (sessionAct >= 2 && peakVel > 0.12) {
          var subFreq = scaleFreq(peakDeg, (p.octave || -1) - 1);
          Audio.synth.play('piano', time + 0.04, subFreq, peakVel * 0.42, (p.decay || 0.8) + 0.6);
        }
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
      // Journey uses the tribal pulse system — skip peak-based drums
      if (sessionPhase >= 2 && vel > 0.08 && !(lens && lens.stages)) {
        fireGoldilocks(magnitude, now, vel);
      }

      // ── PEAK KICK: fire on every significant peak, no tempo lock needed ──
      // James moves by tilt, not rhythmic bouncing — tempoLocked may never trigger.
      // Journey uses tribal pulse instead — peak kicks break the ethereal feel.
      if (sessionPhase >= 1 && !isSilent && lens && lens.groove && Audio.drum && vel > 0.15
          && !(lens && lens.stages)) {
        var ktime = Audio.ctx.currentTime;
        if (now - lastKickTime > 180) {
          lastKickTime = now;
          var pkVel = Math.min(0.78, vel * 0.65);
          Audio.drum.kick(ktime, pkVel, (lens.groove && lens.groove.kit) || 'acoustic');
        }
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

    var degreeLimit = sessionPhase === 0 ? 3 : sessionPhase === 1 ? 5 : 6;
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

    // Per-lens melodic energy gate — stops notes firing from micro-drift or accidental movement.
    // Each lens declares the minimum motion energy required to generate melody.
    var melodicEnergy = (lens.response && lens.response.melodicEnergy) || 0;
    var melodicMinDelta = (lens.response && lens.response.melodicMinDelta) || 1;
    var motionNow = (typeof Brain !== 'undefined') ? Brain.short.energy() : 1.0;

    if (gravitated !== currentDegree
        && Math.abs(gravitated - currentDegree) >= melodicMinDelta
        && !isSilent && fadeGain > 0.15 && !phraseBreathing
        && motionNow >= melodicEnergy) {
      var baseInterval = noteIntervalMs;
      var speed = motionNow;
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

  var gyroMagSmooth = 0;  // smoothed gyro magnitude for filter

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

    // Smooth the gyro magnitude — per-frame deltas are tiny, need accumulation
    gyroMagSmooth += (gyroMag - gyroMagSmooth) * 0.15;

    var range = (lens.response && lens.response.filterRange) || [200, 2800];
    // At 60fps, active tilting gives gyroMag ~1-4 per frame.
    // Smoothed value of ~1.5 should open the filter significantly.
    var norm = Math.min(1, gyroMagSmooth / 3);
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
    var foundationVol = (tex.vol || 0.06) * 3.5;
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
    var threshold = adaptedStillThresh || (lens && lens.response && lens.response.stillnessThreshold) || 0.2;
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

  var voidEngaged  = false;
  var voidPresence = 0;   // 0=fully out, 1=fully in — smooth, not binary
  var voidSmooth   = 0;

  function enterVoid() {
    if (voidEngaged) return;
    voidEngaged = true;
    voidSmooth  = 0;

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
  }

  function updateVoid(dt) {
    if (!Audio.ctx) return;
    var motionNow = (typeof Brain !== 'undefined') ? Brain.short.energy() : 0;

    // Build presence while still (8s to full), decay slowly when moving (~10s to exit).
    // This creates smooth fade-in and a lingering fade-out — no abrupt cuts.
    var targetPresence = isSilent ? Math.min(1, stillnessTimer / 8.0) : 0;
    // Fast out (0.018) when user moves strongly — blend is snappier.
    // Slow out (0.005) for gentle re-entry — avoids jarring cut.
    var exitRate = motionNow > 0.6 ? 0.018 : 0.007;
    var rate = isSilent ? 0.025 : exitRate;
    voidPresence += (targetPresence - voidPresence) * rate;

    if (voidPresence > 0.04) {
      if (!voidEngaged) enterVoid();
      var breathPhase = (typeof brainState !== 'undefined' && brainState.breathPhase) || 0;
      try { Audio.voidDrone.update(voidPresence, breathPhase); } catch (e) {}
      var windVol = Math.min(0.18, voidPresence * 0.24);
      try { Audio.layer.setGain('void-wind', windVol, 4.0); } catch (e) {}
      var sweepFreq = 500 + Math.sin(breathPhase) * 340;
      try { Audio.layer.setFilter('void-wind', Math.max(150, sweepFreq), 1.8); } catch (e) {}
    } else if (voidEngaged) {
      exitVoid();
    }
  }

  // ── TOUCH ─────────────────────────────────────────────────────────────

  function touch(x, y, vx, vy) {
    if (!lens || !Audio.ctx || !active) return;

    var now = Date.now();
    var noteIntervalMs = (lens.response && lens.response.noteInterval) || 200;
    if (now - lastTouchNote < noteIntervalMs) return;

    // Ascension: touch forces progression change (override the songwriter)
    if (lens.name === 'Ascension' && asc.active && lens.ascension && asc.phase === 'gridlock') {
      lastTouchNote = now;
      var cfg = lens.ascension;
      asc.progIndex = (asc.progIndex + 1) % cfg.progressions.length;
      asc.chordStep = 0;
      asc.barCount = 0;  // reset bar count so enrichment stays
      var prog = cfg.progressions[asc.progIndex];
      try { Audio.ascension.setWallChord(cfg.wallRoot, prog[0]); } catch(e) {}
      var sf = prog[0].map(function(s) { return cfg.wallRoot * Math.pow(2, s / 12); });
      try { Audio.synth.ascStab(0, sf, 0.6); } catch(e) {}
      return;
    }

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

  // ── GRID EDM ENGINE ──────────────────────────────────────────────────
  // A DJ set built from your body movement.
  //
  // The clock NEVER stops. Motion = intensity. Tilt = filter. Peak = DROP.
  //
  // Flow: intro (melody+atmosphere) → build (layers stack, riser, snare roll)
  //       → DROP (wobble+stabs+full kit) → breakdown (pad+melody+breathe)
  //       → build again (each cycle evolves)

  var grid = {
    active: false,
    started: false,
    bpm: 128,
    stepDur: 0,
    clock: 0,
    lastStep: -1,
    totalBars: 0,
    lastBar: -1,

    phase: 'waiting',
    phaseTimer: 0,

    // Build
    buildLevel: 0,
    riserFired: false,
    snareRollFired: false,

    // Energy
    intensity: 0,
    djGain: 0,
    lastIntensity: 0,

    // Tilt zone system
    tiltZone: 1,           // 0=low, 1=mid, 2=high — smoothed
    tiltZoneSmooth: 1,     // float version for interpolation
    tiltNorm: 0.5,         // smoothed tilt position 0-1
    rollNorm: 0,           // smoothed roll position -1 to 1 (left/right)

    // Wobble
    wobblePhase: 0,
    wobbleShape: 0,

    // Sub
    subPulseStep: -1,

    // Stabs
    stabPattern: 0,
    lastStabStep: -1,

    // Filter
    filterSmooth: 800,

    // Kill switch (touch)
    killActive: false,

    // Stab fill burst (peak during drop)
    stabFillUntil: 0,

    // Vocal chops
    highEnergyTime: 0,
    chopStep: -1,

    // Archetype-driven musical state
    lastArchetype: 'exploring',
    archetypeTimer: 0,          // time in current archetype
    chordStabCooldown: 0,       // prevent stab spam
    tensionSwellTimer: 0,       // swell cooldown
    kickFillBar: -1,            // last bar a fill was placed
    dropVariation: 0,           // which musical variation during drop

    // Pump style: how the user is moving (smooth vs hard)
    pumpIntensity: 0,      // 0-1 smoothed from peak frequency/strength

    // Cycle count
    cycle: 0,

    // ── DJ SET EVOLUTION ──
    // Every 8 bars (~15s at 128bpm), one thing changes. Like a DJ bringing up a fader.
    segment: 0,                // which 8-bar segment we're in (0, 1, 2, 3, ...)
    lastSegment: -1,           // detect segment boundaries
    setTime: 0,                // total time since first motion

    // Harmonic movement
    rootShift: 0,              // current semitone offset (smoothed)
    nextRootShift: 0,          // target
    currentRootFreq: 0,

    // Active arrangement layers — each can be on/off, like mixer channels
    arr: {
      kickPat: 0,              // which kick pattern (index into GRID_KICK_VARIANTS)
      hatPat: 0,               // which hat pattern
      ride: false,             // ride cymbal on/off
      ridePattern: 0,          // ride rhythm variation
      clap: false,             // clap layer on/off
      wobbleShape: 0,          // current wobble LFO shape
      wobbleRate: 1.0,         // wobble rate multiplier
      subOctave: false,        // double sub at -1 octave
      stabStyle: 0,            // stab pattern index
      bassWalk: 0,             // bass walk complexity level
      filterSweepDir: 0,       // 0=static, 1=opening, -1=closing
      filterSweepPhase: 0,     // phase of current sweep
      reverbLevel: 0.15,       // current reverb
      padOpen: false,          // pad filter wide open
      snareRoll: false,        // 16th snare rolls on beats 2&4
      percLoop: 0,             // additional percussion loop type (0=none)
    },

    // Breakdown state
    breakdownStyle: 0,
    breakdownMelodyFired: false,

    // Breakdown state
    breakdownMelodyFired: false,

    // Vocal drop system
    vocalsLoaded: false,
    vocalDropFired: false,     // has the vocal sequence played this cycle?
    vocalPhase: 0,             // 0=waiting, 1=what-is-done, 2=to(triplet), 3=drop(you+you-deep)
    vocalTimer: 0,             // time within current vocal phase
    vocalDropReady: false,     // waiting for user peak to trigger "to you" drop
    vocalCooldown: 0,          // minimum time between vocal phase advances (prevents double-trigger)
  };

  // ── ASCENSION ENGINE ──────────────────────────────────────────────────
  // Wall of sound. Detune unison. The TikTok "ascension music" trend.
  //
  // No clock. No drums. Just a massive harmonic wall that breathes.
  // Tilt = filter. Motion = detune spread. Roll = harmonic mix.
  // Peaks = plucks/stabs. Touch = chord voicing changes.
  // Stillness = LFO breathing takes over.

  // ── PITCH ANALYSIS — find the progression that fits what the user plays ──
  function analyzePitchBuffer(buffer, progressions, wallRoot) {
    if (!buffer.length || !progressions.length) return 0;
    // Extract pitch classes (semitone mod 12) from buffer
    var pitchClasses = [];
    for (var i = 0; i < buffer.length; i++) {
      var pc = ((Math.round(buffer[i].semi) % 12) + 12) % 12;
      pitchClasses.push(pc);
    }
    var bestIndex = 0, bestScore = -1;
    for (var pi = 0; pi < progressions.length; pi++) {
      var prog = progressions[pi];
      // Collect all unique pitch classes in this progression
      var progPCs = {};
      for (var ci = 0; ci < prog.length; ci++) {
        for (var ni = 0; ni < prog[ci].length; ni++) {
          var pc = ((prog[ci][ni] % 12) + 12) % 12;
          progPCs[pc] = true;
        }
      }
      // Score: how many of the user's pitch classes land on a chord tone?
      var score = 0;
      for (var ui = 0; ui < pitchClasses.length; ui++) {
        // Weight recent samples higher
        var weight = 0.5 + 0.5 * (ui / pitchClasses.length);
        if (progPCs[pitchClasses[ui]]) {
          score += weight;
        } else {
          // Partial credit for being 1 semitone away
          if (progPCs[((pitchClasses[ui] - 1) + 12) % 12] || progPCs[(pitchClasses[ui] + 1) % 12]) {
            score += weight * 0.3;
          }
        }
      }
      if (score > bestScore) { bestScore = score; bestIndex = pi; }
    }
    return bestIndex;
  }

  // ── PITCH MAGNETISM — pull raw frequency toward nearest chord tone ──
  function magnetize(rawFreq, wallRoot, voicing, strength) {
    if (strength < 0.01 || !voicing || !voicing.length) return rawFreq;
    var bestDist = Infinity, bestFreq = rawFreq;
    for (var i = 0; i < voicing.length; i++) {
      // Check multiple octaves of this chord tone
      var base = wallRoot * Math.pow(2, voicing[i] / 12);
      for (var oct = -2; oct <= 3; oct++) {
        var f = base * Math.pow(2, oct);
        var dist = Math.abs(f - rawFreq);
        if (dist < bestDist) { bestDist = dist; bestFreq = f; }
      }
    }
    return rawFreq + (bestFreq - rawFreq) * strength;
  }

  var asc = {
    active: false,
    started: false,
    time: 0,

    // Phase: 'waiting' → 'acclimate' → 'gridlock'
    phase: 'waiting',

    // Filter
    filterSmooth: 800,

    // Detune spread
    spreadSmooth: 5,

    // LFO breathing
    breathPhase: 0,
    breathActive: false,

    // Gain
    masterGain: 0,

    // Stillness
    stillTime: 0,

    // Peak pluck cooldown
    pluckCooldown: 0,

    // ── ENERGY CAPACITOR — still drives filter floor + spread width ──
    ascEnergy: 0,

    // ── PITCH BUFFER — records what user plays naturally ──
    pitchBuffer: [],         // circular buffer of { semi, time }
    pitchBufferMax: 24,

    // ── SONGWRITER CLOCK — 107 BPM, 16 steps/bar ──
    clockPhase: 0,           // 0-1 within current bar
    lastClockStep: -1,
    barCount: 0,

    // ── CHOSEN PROGRESSION ──
    progIndex: 0,
    chordStep: 0,

    // ── ENRICHMENT — ramps over bars ──
    enrichment: 0,           // 0-1, grows over ~8 bars after grid lock
    magnetism: 0,            // 0-1, pitch pull strength

    // ── REVEAL — one-shot suck/slam at the transition ──
    revealFired: false,
    stagePhase: 'play',      // play | suck | slam
    stageTimer: 0,

    // Re-analysis tracking
    lastAnalysisBar: -1,
  };

  // ── DRUM PATTERNS ──
  // Four on the floor. The heartbeat of EDM.
  var GRID_KICK  = [1.0, 0, 0, 0,  1.0, 0, 0, 0,  1.0, 0, 0, 0,  1.0, 0, 0, 0];
  // Backbeat snare with ghost
  var GRID_SNARE = [0, 0, 0, 0,  1.0, 0, 0, 0,  0, 0, 0, 0,  1.0, 0, 0, 0.2];
  // Offbeat hats (the groove)
  var GRID_HAT   = [0, 0, 0.6, 0,  0, 0, 0.6, 0,  0, 0, 0.6, 0,  0, 0, 0.6, 0];
  // Drop hats: full 8th notes for energy
  var GRID_HAT_DROP = [0.7, 0.3, 0.6, 0.3,  0.7, 0.3, 0.6, 0.3,  0.7, 0.3, 0.6, 0.3,  0.7, 0.3, 0.6, 0.3];
  // Build hats: closed → opening (energy rising)
  var GRID_HAT_BUILD = [0.5, 0, 0.4, 0,  0.5, 0, 0.4, 0,  0.5, 0, 0.4, 0,  0.5, 0.2, 0.4, 0.2];

  // Stab patterns — different rhythms per drop cycle (keeps it fresh)
  var GRID_STABS = [
    [0, 0, 0, 0.7,  0, 0, 0, 0,  0, 0, 0, 0.7,  0, 0, 0, 0],     // minimal: off-beat 4ths
    [0, 0, 0.6, 0,  0, 0, 0, 0.5,  0, 0, 0.6, 0,  0, 0, 0, 0.5],  // syncopated
    [0.8, 0, 0, 0,  0, 0, 0.5, 0,  0, 0, 0, 0,  0.6, 0, 0, 0],    // sparse punchy
  ];

  // ── KICK VARIANTS — evolve across cycles ──
  var GRID_KICK_VARIANTS = [
    [1.0,0,0,0, 1.0,0,0,0, 1.0,0,0,0, 1.0,0,0,0],             // 0: four on the floor
    [1.0,0,0,0, 1.0,0,0,0.3, 1.0,0,0,0, 1.0,0,0.4,0],         // 1: ghost kicks
    [1.0,0,0,0.5, 0,0,1.0,0, 1.0,0,0,0.5, 0,0,1.0,0],         // 2: broken
    [1.0,0,0,0, 0,0,0.8,0, 1.0,0,0,0, 0.6,0,0.9,0],           // 3: garage off-kick
    [1.0,0,0.4,0, 1.0,0,0,0, 1.0,0,0,0.4, 1.0,0,0,0],         // 4: 16th accents
    [1.0,0,0,0, 0,0,0,0, 1.0,0,0,0, 0,0,0,0],                 // 5: half-time (1 & 3 only)
    [1.0,0,0,0.3, 0,0.5,0,0, 1.0,0,0,0, 0,0,0.6,0.3],         // 6: syncopated latin
    [1.0,0,0,0, 1.0,0,0.3,0, 0,0,0.5,0, 1.0,0,0,0.4],         // 7: displaced groove
    [0.8,0,0.6,0, 0.8,0,0.6,0, 0.8,0,0.6,0, 0.8,0,0.6,0],     // 8: double-time pummel
    [1.0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,1.0,0],                 // 9: minimal (1 and "&" of 4)
  ];

  // ── HAT VARIANTS — evolve across cycles ──
  var GRID_HAT_VARIANTS = [
    [0,0,0.6,0, 0,0,0.6,0, 0,0,0.6,0, 0,0,0.6,0],             // 0: basic offbeats
    [0.5,0,0.7,0, 0,0,0.7,0, 0.5,0,0.7,0, 0,0,0.7,0.3],       // 1: add downbeats
    [0.4,0.2,0.6,0.2, 0.4,0.2,0.6,0.2, 0.4,0.2,0.6,0.2, 0.4,0.2,0.6,0.2],  // 2: straight 8ths
    [0.7,0,0.5,0.3, 0,0.4,0.6,0, 0.7,0,0.5,0.3, 0,0.4,0.6,0.3],             // 3: complex groove
    [0.8,0.3,0.5,0.3, 0.8,0.3,0.5,0.3, 0.8,0.3,0.5,0.3, 0.8,0.5,0.6,0.5],   // 4: driving 16ths
    [0,0.6,0,0.6, 0,0.6,0,0.6, 0,0.6,0,0.6, 0,0.6,0,0.6],     // 5: pure offbeats (house)
    [0.9,0,0,0.4, 0,0,0.9,0, 0,0.4,0,0, 0.9,0,0,0.4],         // 6: tribal/broken
    [0.3,0.3,0.3,0.3, 0.3,0.3,0.3,0.3, 0.3,0.3,0.3,0.3, 0.3,0.8,0.8,0.8],  // 7: fill → crash
    [0,0,0,0, 0,0,0.8,0, 0,0,0,0, 0,0,0.8,0.4],               // 8: minimal offbeat 2&4
    [0.6,0.2,0.4,0.2, 0.6,0.2,0.4,0.6, 0.6,0.2,0.4,0.2, 0.6,0.4,0.6,0.4],  // 9: shuffled swing
  ];

  // ── SNARE VARIANTS ──
  var GRID_SNARE_VARIANTS = [
    [0,0,0,0, 1.0,0,0,0, 0,0,0,0, 1.0,0,0,0.2],               // 0: classic backbeat
    [0,0,0,0, 1.0,0,0,0.15, 0,0,0,0, 1.0,0,0.3,0],             // 1: ghost note shuffle
    [0,0,0,0, 0,0,0,0, 1.0,0,0,0, 0,0,0,0],                   // 2: half-time (3 only)
    [0,0,0,0.4, 1.0,0,0,0, 0,0,0,0.4, 1.0,0,0,0],             // 3: anticipated backbeat
    [0,0,0,0, 0.8,0,0.3,0, 0,0,0,0, 0.8,0,0,0.5],             // 4: syncopated with ghosts
    [0,0,0,0.6, 0,0,0.6,0, 0,0,0,0.6, 0,0,0.6,0],             // 5: offbeat clap feel
  ];

  // ── BASS WALK EVOLUTION ──
  var BASS_WALKS = [
    [[0,0], [0,4], [0,3], [0,6]],                               // 0: simple roots
    [[0,1], [0,4], [4,3], [0,6], [3,1], [0,0]],                 // 1: phrygian color
    [[0,1], [1,3], [3,4], [4,6], [6,4], [3,0]],                 // 2: walking
    [[0,1], [1,0], [0,6], [6,4], [4,3], [3,1], [1,6], [6,0]],   // 3: dark chromatic
    [[0,0], [4,4], [3,3], [6,1], [0,4], [1,3]],                 // 4: pedal tone (stays low)
    [[0,6], [6,0], [3,6], [6,3], [4,0], [0,4], [1,6], [6,1]],   // 5: wide intervals
    [[0,1], [1,2], [2,3], [3,4], [4,3], [3,2], [2,1], [1,0]],   // 6: chromatic ascent/descent
  ];

  // ── PERC PATTERNS — shaker/ride textures on the clock ──
  var GRID_PERC_VARIANTS = [
    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],                     // 0: off
    [0.12,0,0.08,0, 0.12,0,0.08,0, 0.12,0,0.08,0, 0.12,0,0.08,0],   // 1: soft shaker 8ths
    [0.15,0.06,0.10,0.06, 0.15,0.06,0.10,0.06, 0.15,0.06,0.10,0.06, 0.15,0.06,0.10,0.06],  // 2: shaker 16ths
    [0.18,0,0,0.08, 0,0.08,0.18,0, 0,0.08,0,0, 0.18,0,0,0.08],  // 3: clave-ish shaker
    [0,0,0,0, 0.15,0,0,0, 0,0,0,0, 0.15,0,0,0.10],             // 4: sparse perc hits
  ];

  function initGrid() {
    if (!lens || !lens.edm) return;
    var edm = lens.edm;
    grid.active = true;
    grid.started = false;
    grid.bpm = edm.bpm || 128;
    grid.stepDur = 60 / grid.bpm / 4;
    grid.clock = 0;
    grid.lastStep = -1;
    grid.totalBars = 0;
    grid.lastBar = -1;
    grid.phase = 'waiting';
    grid.phaseTimer = 0;
    grid.buildLevel = 0;
    grid.riserFired = false;
    grid.snareRollFired = false;
    grid.intensity = 0;
    grid.djGain = 0;
    grid.lastIntensity = 0;
    grid.tiltZone = 1;
    grid.tiltZoneSmooth = 1;
    grid.tiltNorm = 0.5;
    grid.rollNorm = 0;
    grid.wobblePhase = 0;
    grid.wobbleShape = 0;
    grid.subPulseStep = -1;
    grid.stabPattern = 0;
    grid.lastStabStep = -1;
    grid.filterSmooth = 800;
    grid.killActive = false;
    grid.stabFillUntil = 0;
    grid.highEnergyTime = 0;
    grid.chopStep = -1;
    grid.pumpIntensity = 0;
    grid.cycle = 0;
    grid.segment = 0;
    grid.lastSegment = -1;
    grid.setTime = 0;
    grid.rootShift = 0;
    grid.nextRootShift = 0;
    grid.currentRootFreq = originalRoot;
    grid.breakdownStyle = 0;
    grid.breakdownMelodyFired = false;
    // Reset arrangement
    grid.arr = {
      kickPat: 0, hatPat: 0, snarePat: 0, ride: false, ridePattern: 0, clap: false,
      wobbleShape: 0, wobbleRate: 1.0, subOctave: false, stabStyle: 0,
      bassWalk: 0, filterSweepDir: 0, filterSweepPhase: 0,
      reverbLevel: 0.15, padOpen: false, snareRoll: false, percPat: 0,
      halftime: false, delayThrow: false, reverbWash: false,
      stabVoicing: 0, filterQ: 3.5, swing: 0,
      levitation: false, levitationSpread: 30,
    };
    grid.lastArchetype = 'exploring';
    grid.archetypeTimer = 0;
    grid.chordStabCooldown = 0;
    grid.tensionSwellTimer = 0;
    // Reset DJ evolution pools
    poolUsed = [[], [], [], [], [], []];
    grid.kickFillBar = -1;
    grid.dropVariation = 0;
    grid.vocalDropFired = false;
    grid.vocalPhase = 0;
    grid.vocalTimer = 0;
    grid.vocalDropReady = false;
    grid.vocalCooldown = 0;

    try { Audio.set808SubFreq(edm.subFreq || 55); } catch(e) {}
    try { Audio.setSidechainDepth(0.3); } catch(e) {}

    // Build ALL persistent layers immediately (silent — will fade in)
    try { Audio.edm.buildPad(originalRoot); } catch(e) {}
    try { Audio.edm.buildWobble(edm.subFreq || 55, 3.5); } catch(e) {}
    try { Audio.edm.buildSub(edm.subFreq || 55); } catch(e) {}
    // Levitation: unison detune supersaw — the TikTok sound
    // Built at the root's octave (220Hz for A) — sweet spot for saw shimmer
    try { Audio.edm.buildLevitation(originalRoot, 30); } catch(e) {}

    // Preload vocal clips for the drop sequence
    if (!grid.vocalsLoaded) {
      grid.vocalsLoaded = true;
      try {
        Audio.vocal.preload('freedom-is', 'voice/freedom-is.mp3?v=1');
        Audio.vocal.preload('what-you-do-with', 'voice/what-you-do-with.mp3?v=1');
        Audio.vocal.preload('what-is-done', 'voice/what-is-done.mp3?v=1');
        Audio.vocal.preload('to-you', 'voice/to-you.mp3?v=1');
        Audio.vocal.preload('you-deep', 'voice/you-deep.mp3?v=1');
      } catch(e) {}
    }
  }

  function teardownGrid() {
    grid.active = false;
    grid.started = false;
    try { Audio.edm.destroyAll(); } catch(e) {}
    if (lens && lens.tone) {
      try { Audio.setMasterFilter(lens.tone.ceiling || 7000); } catch(e) {}
    }
  }

  // ── ASCENSION INIT / TEARDOWN ──

  function initAscension() {
    if (!lens || !lens.ascension) return;
    var cfg = lens.ascension;
    asc.active = true;
    asc.started = false;
    asc.time = 0;
    asc.phase = 'waiting';
    asc.filterSmooth = cfg.filterRange[0];
    asc.spreadSmooth = cfg.detuneRange[0];
    asc.breathPhase = 0;
    asc.breathActive = false;
    asc.masterGain = 0;
    asc.stillTime = 0;
    asc.pluckCooldown = 0;
    asc.ascEnergy = 0;
    asc.pitchBuffer = [];
    asc.clockPhase = 0;
    asc.lastClockStep = -1;
    asc.barCount = 0;
    asc.progIndex = 0;
    asc.chordStep = 0;
    asc.enrichment = 0;
    asc.magnetism = 0;
    asc.revealFired = false;
    asc.stagePhase = 'play';
    asc.stageTimer = 0;
    asc.lastAnalysisBar = -1;

    // Build all harmonic layers silent — enrichment system opens them
    try { Audio.ascension.buildWall(cfg.wallRoot, cfg.detuneRange[0]); } catch(e) {}
    try { Audio.ascension.buildSub(cfg.subFreq); } catch(e) {}
    try { Audio.ascension.buildNoise(); } catch(e) {}
    // Bass layer: sine at 110Hz for warmth phones can reproduce
    try { Audio.layer.build('asc-bass', {
      oscillators: [
        { wave: 'sine', freq: cfg.bassFreq, gain: 0.25 },
        { wave: 'triangle', freq: cfg.bassFreq, gain: 0.10 },
      ],
      filter: { type: 'lowpass', freq: 300, Q: 0.6 },
      gain: 0,
    }); } catch(e) {}
    try { Audio.ascension.setWallFilter(cfg.filterRange[0]); } catch(e) {}
    try { Audio.setMasterFilter(cfg.filterRange[1]); } catch(e) {}
    // Set initial chord from first progression
    try { Audio.ascension.setWallChord(cfg.wallRoot, cfg.progressions[0][0]); } catch(e) {}
  }

  function teardownAscension() {
    asc.active = false;
    asc.started = false;
    try { Audio.ascension.destroyAll(); } catch(e) {}  // destroys wall layers + sub + noise + search + bass
    if (lens && lens.tone) {
      try { Audio.setMasterFilter(lens.tone.ceiling || 7000); } catch(e) {}
    }
  }

  // ── SESSION RECORDER — captures everything for debugging ──
  // Three independent logs: asc (Ascension), grid (Grid), jrn (Journey/organic)
  var ascLog = [], gridLog = [], jrnLog = [];
  var ascLogInterval = 0, gridLogInterval = 0, jrnLogInterval = 0;

  function ascRecord(type, data) {
    ascLog.push({ t: asc.time.toFixed(2), type: type, data: data });
  }
  function gridRecord(type, data) {
    gridLog.push({ t: grid.setTime.toFixed(2), type: type, data: data });
  }
  var jrnWallClock = 0;  // real elapsed time for Journey logs
  function jrnRecord(type, data) {
    jrnLog.push({ t: jrnWallClock.toFixed(2), type: type, data: data });
  }

  function formatLog(log, name) {
    if (!log.length) return 'No ' + name + ' session recorded yet.';
    return log.map(function(e) {
      return '[' + e.t + 's] ' + e.type + ': ' + (typeof e.data === 'object' ? JSON.stringify(e.data) : e.data);
    }).join('\n');
  }

  // Call window.dump() in Safari console — auto-detects which engine ran
  window.dump = function() {
    var output = '';
    if (ascLog.length) output += '=== ASCENSION ===\n' + formatLog(ascLog, 'Ascension') + '\n\n';
    if (gridLog.length) output += '=== GRID ===\n' + formatLog(gridLog, 'Grid') + '\n\n';
    if (jrnLog.length) output += '=== JOURNEY ===\n' + formatLog(jrnLog, 'Journey') + '\n\n';
    if (!output) { console.log('No session recorded yet.'); return; }
    console.log(output);
    try { navigator.clipboard.writeText(output); console.log('--- COPIED TO CLIPBOARD ---'); } catch(e) {
      console.log('--- Paste the above. Clipboard copy failed. ---');
    }
    return output;
  };
  // Legacy aliases
  window.ascDump = function() { return window.dump(); };
  window.ascClear = function() { ascLog = []; gridLog = []; jrnLog = []; ascLogInterval = 0; gridLogInterval = 0; jrnLogInterval = 0; console.log('All session logs cleared.'); };
  window.clearLog = window.ascClear;

  // ── ASCENSION UPDATE ENGINE v2 — THE HIDDEN SONGWRITER ──
  //
  // Phase 1: ACCLIMATE — raw tilt sounds, no grid. User explores.
  //          Silently recording their pitch choices.
  //
  // Phase 2: GRID LOCK — hidden 4/4 at 107 BPM. System analyzes what the
  //          user played, picks the chord progression that fits THEIR notes.
  //          Enrichment ramps: bass on beat 1, pitch magnetism toward chord
  //          tones, harmonic layers bloom. The user was always making music.
  //          They just didn't know it yet.

  function updateAscension(brainState, sensor, dt) {
    var cfg = lens.ascension;
    if (!cfg || !Audio.ctx) return;

    var energy = (typeof Brain !== 'undefined') ? Brain.short.energy() : 0;
    var beta   = sensor.beta  || 0;
    var gamma  = sensor.gamma || 0;
    var tiltNorm = Math.max(0, Math.min(1, (beta - 20) / 60));

    asc.time += dt;
    asc.stageTimer += dt;

    // State snapshot every 0.5s
    ascLogInterval += dt;
    if (ascLogInterval >= 0.5 && asc.started) {
      ascLogInterval = 0;
      ascRecord('STATE', {
        phase: asc.phase, energy: +energy.toFixed(2), tilt: +tiltNorm.toFixed(2),
        beta: Math.round(beta), gamma: Math.round(gamma),
        filter: Math.round(asc.filterSmooth), spread: +asc.spreadSmooth.toFixed(1),
        gain: +asc.masterGain.toFixed(2), ascNrg: +asc.ascEnergy.toFixed(1),
        still: +asc.stillTime.toFixed(1), breath: asc.breathActive,
        enrich: +asc.enrichment.toFixed(2), mag: +asc.magnetism.toFixed(2),
      });
    }

    // ── 1. STARTUP: wait for first motion ──
    if (!asc.started) {
      if (energy > 0.08) {
        asc.started = true;
        asc.phase = 'acclimate';
        asc.time = 0;  // reset clock so acclimate timing starts now
        ascRecord('START', 'acclimate phase — recording pitches');
      } else {
        return;
      }
    }

    // ── 2. ENERGY CAPACITOR — still drives filter floor + spread width ──
    // Capped at 30. Leaks faster so it actually responds to stillness.
    asc.ascEnergy += energy * dt * 0.5;
    asc.ascEnergy *= (1.0 - 0.02 * dt);  // meaningful leak
    if (asc.stillTime > 3.0) asc.ascEnergy *= (1.0 - 0.15 * dt);
    asc.ascEnergy = Math.min(30, asc.ascEnergy);

    // ── 3. MASTER GAIN + BREATHING SWELL ──
    var gainTarget = energy > 0.04 ? 0.75 : (asc.enrichment > 0.2 ? 0.3 : 0.1);
    if (asc.stagePhase === 'suck') gainTarget = 0.08;
    var swellPhase = (asc.time / (cfg.swellCycle || 12.5)) % 1.0;
    var swellEnv = 1.0 - (cfg.swellDepth || 0.15) + (cfg.swellDepth || 0.15) * 2 * (0.5 + 0.5 * Math.sin(swellPhase * Math.PI * 2));
    gainTarget *= swellEnv;
    var gainRate = gainTarget > asc.masterGain ? 0.5 : 0.15;
    asc.masterGain += (gainTarget - asc.masterGain) * gainRate * dt;
    asc.masterGain = Math.max(0, Math.min(1, asc.masterGain));
    try { Audio.setMasterGain(asc.masterGain); } catch(e) {}

    // ── 4. STILLNESS + BREATHING ──
    if (energy < 0.06) { asc.stillTime += dt; } else { asc.stillTime = 0; }
    asc.breathPhase += cfg.breathRate * dt;
    if (asc.breathPhase > 1) asc.breathPhase -= 1;
    asc.breathActive = asc.stillTime > 2.5 && asc.stagePhase === 'play';

    // ── 5. ACCLIMATE PHASE — raw expression, silent analysis ──
    if (asc.phase === 'acclimate') {
      // Raw tilt → free pitch (chromatic, full range around root)
      var rawSemi = tiltNorm * 24 - 12;
      var rawFreq = cfg.wallRoot * Math.pow(2, rawSemi / 12);

      // Record and fire on peaks — require REAL motion, not sensor noise
      if (peakCount > 0 && asc.pluckCooldown <= 0 && energy > 0.80) {
        asc.pitchBuffer.push({ semi: rawSemi, time: asc.time });
        if (asc.pitchBuffer.length > asc.pitchBufferMax) asc.pitchBuffer.shift();
        ascRecord('PITCH', { semi: +rawSemi.toFixed(1), freq: Math.round(rawFreq), energy: +energy.toFixed(2), beta: Math.round(beta), buf: asc.pitchBuffer.length });
        // Fire raw lead — no magnetism, no chord quantization
        while (rawFreq < 300) rawFreq *= 2;
        while (rawFreq > 1200) rawFreq /= 2;
        var leadVel = Math.min(1.0, 0.30 + energy * 0.06);
        try { Audio.synth.ascLead(0, rawFreq, leadVel, 1.5, cfg.portamento); } catch(e) {}
        try { Audio.synth.ascPluck(0, rawFreq, Math.min(1, energy * 0.15 + 0.2), 0.8); } catch(e) {}
        asc.pluckCooldown = 0.2;
      }
      if (asc.pluckCooldown > 0) asc.pluckCooldown -= dt;

      // Root layer only during acclimate — the ember
      try { Audio.layer.setGain('asc-root', 0.50, 0.08); } catch(e) {}
      try { Audio.layer.setGain('asc-third', 0, 0.08); } catch(e) {}
      try { Audio.layer.setGain('asc-fifth', 0, 0.08); } catch(e) {}
      try { Audio.layer.setGain('asc-oct',   0, 0.08); } catch(e) {}
      try { Audio.layer.setGain('asc-sub',   0, 0.3); } catch(e) {}
      try { Audio.layer.setGain('asc-bass',  0, 0.3); } catch(e) {}
      try { Audio.layer.setGain('asc-noise', 0, 0.5); } catch(e) {}

      // Transition to grid lock: enough time AND enough pitch samples
      var acclimateTime = cfg.acclimateTime || 5.0;
      var minSamples = cfg.minPitchSamples || 3;
      if (asc.time >= acclimateTime && asc.pitchBuffer.length >= minSamples && energy > 0.50) {
        // Analyze what they played and pick the best progression
        asc.progIndex = analyzePitchBuffer(asc.pitchBuffer, cfg.progressions, cfg.wallRoot);
        var progNames = ['I-V-vi-IV (axis)', 'I-IV-V-vi (pop)', 'vi-IV-I-V (emotional)', 'I-vi-ii-V (jazz)'];
        ascRecord('GRIDLOCK', { prog: asc.progIndex, name: progNames[asc.progIndex], pitches: asc.pitchBuffer.map(function(p) { return +p.semi.toFixed(1); }) });
        asc.chordStep = 0;
        asc.barCount = 0;
        asc.clockPhase = 0;
        asc.lastClockStep = -1;
        asc.phase = 'gridlock';

        // THE REVEAL: suck/slam to announce the songwriter
        asc.stagePhase = 'suck';
        asc.stageTimer = 0;
        asc.revealFired = true;

        // Set the wall to the chosen progression's first chord
        var prog = cfg.progressions[asc.progIndex];
        try { Audio.ascension.setWallChord(cfg.wallRoot, prog[0]); } catch(e) {}
      }
    }

    // ── 6. REVEAL SUCK/SLAM — the songwriter announces itself ──
    if (asc.stagePhase === 'suck') {
      var suckDur = cfg.suckDuration || 0.8;
      asc.filterSmooth = Math.max(cfg.filterRange[0], asc.filterSmooth - 4000 * dt);
      try { Audio.ascension.setWallFilter(asc.filterSmooth); } catch(e) {}

      if (asc.stageTimer >= suckDur) {
        asc.stagePhase = 'slam';
        asc.stageTimer = 0;
        // IMPACT: stab the chosen chord
        var prog = cfg.progressions[asc.progIndex];
        var voicing = prog[asc.chordStep];
        var impactFreqs = voicing.map(function(s) { return cfg.wallRoot * Math.pow(2, s / 12); });
        try { Audio.synth.ascStab(0, impactFreqs, 0.9); } catch(e) {}
        try { Audio.synth.ascPluck(0, cfg.wallRoot, 0.8, 1.5); } catch(e) {}
        // Blow filter open
        asc.filterSmooth = cfg.filterRange[1] * 0.7;
        asc.spreadSmooth = cfg.detuneRange[0] + (cfg.detuneRange[1] - cfg.detuneRange[0]) * 0.4;
      }
    }

    if (asc.stagePhase === 'slam') {
      if (asc.stageTimer > 0.5) {
        asc.stagePhase = 'play';
        asc.stageTimer = 0;
      }
    }

    // Everything below only runs in grid lock
    if (asc.phase !== 'gridlock') {
      // Filter/spread/pitch still run during acclimate
      var filterTarget = cfg.filterRange[0] + tiltNorm * (cfg.filterRange[1] - cfg.filterRange[0]);
      if (asc.breathActive) {
        var breathLFO = Math.sin(asc.breathPhase * Math.PI * 2);
        filterTarget += breathLFO * cfg.breathDepth;
        filterTarget = Math.max(cfg.filterRange[0], Math.min(cfg.filterRange[1], filterTarget));
      }
      if (asc.stagePhase === 'play') {
        asc.filterSmooth += (filterTarget - asc.filterSmooth) * 4.0 * dt;
        asc.filterSmooth = Math.max(cfg.filterRange[0], Math.min(cfg.filterRange[1], asc.filterSmooth));
        try { Audio.ascension.setWallFilter(asc.filterSmooth); } catch(e) {}
      }
      var rollNorm = Math.max(-1, Math.min(1, gamma / 30));
      try { Audio.ascension.setMasterPitch(rollNorm * 2); } catch(e) {}

      // Reverb + delay — minimal during acclimate
      try { Audio.setReverbMix(0.20); } catch(e) {}
      try { Audio.setDelayMix(0.08); } catch(e) {}
      return;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ── GRID LOCK PHASE — the hidden songwriter is running ──
    // ═══════════════════════════════════════════════════════════════════════

    var bpm = cfg.bpm || 107;
    var stepDur = 60 / bpm / 4;  // ~0.1402s per 16th note at 107
    var barDur = stepDur * 16;   // ~2.243s per bar
    var prog = cfg.progressions[asc.progIndex];

    // ── 7. CLOCK — 16 steps per bar ──
    asc.clockPhase += dt / barDur;
    if (asc.clockPhase >= 1.0) {
      asc.clockPhase -= 1.0;
      asc.barCount++;
    }
    var currentStep = Math.floor(asc.clockPhase * 16);

    // ── 8. BAR EVENTS — chord changes + bass ──
    if (currentStep !== asc.lastClockStep) {
      asc.lastClockStep = currentStep;

      // Beat 1 (step 0): advance chord, fire bass
      if (currentStep === 0) {
        asc.chordStep = asc.barCount % prog.length;
        ascRecord('BAR', { bar: asc.barCount, chord: asc.chordStep, enrich: +asc.enrichment.toFixed(2), mag: +asc.magnetism.toFixed(2), energy: +asc.ascEnergy.toFixed(1) });
        try { Audio.ascension.setWallChord(cfg.wallRoot, prog[asc.chordStep]); } catch(e) {}

        // Bass on downbeat — only after enrichment starts coming in
        if (asc.enrichment > 0.15) {
          var voicing = prog[asc.chordStep];
          var bassFreq = cfg.wallRoot * Math.pow(2, voicing[0] / 12);
          while (bassFreq < 80) bassFreq *= 2;
          while (bassFreq > 200) bassFreq /= 2;
          try { Audio.layer.setFreqs('asc-bass', [bassFreq, bassFreq], 0.15); } catch(e) {}
        }
      }
    }

    // ── 9. ENRICHMENT RAMP — layers bloom over bars ──
    var enrichBars = cfg.enrichBars || 8;
    var enrichTarget = Math.min(1.0, asc.barCount / enrichBars);
    asc.enrichment += (enrichTarget - asc.enrichment) * 1.5 * dt;
    asc.magnetism = Math.min(cfg.magnetismMax || 0.6, asc.enrichment * 0.75);

    // ── 10. LAYER GAINS FROM ENRICHMENT ──
    var suckMult = 1.0;
    if (asc.stagePhase === 'suck') suckMult = Math.max(0.02, 1.0 - asc.stageTimer / (cfg.suckDuration || 0.8));
    if (asc.stagePhase === 'slam') suckMult = Math.min(1.0, asc.stageTimer / 0.3);

    var rootGain  = 0.70 * suckMult;
    var thirdGain = Math.min(0.55, asc.enrichment * 0.7) * suckMult;
    var fifthGain = Math.min(0.55, asc.enrichment * 0.7) * suckMult;
    var octGain   = Math.min(0.40, Math.max(0, asc.enrichment - 0.25) * 0.6) * suckMult;
    var subGain   = Math.min(0.55, Math.max(0, asc.enrichment - 0.3) * 0.85) * suckMult;
    var bassGain  = Math.min(0.30, Math.max(0, asc.enrichment - 0.15) * 0.45) * suckMult;
    var noiseGain = Math.min(cfg.noiseLevel, Math.max(0, asc.enrichment - 0.6) * cfg.noiseLevel * 2.5) * suckMult;

    try { Audio.layer.setGain('asc-root',  rootGain,  0.08); } catch(e) {}
    try { Audio.layer.setGain('asc-third', thirdGain, 0.08); } catch(e) {}
    try { Audio.layer.setGain('asc-fifth', fifthGain, 0.08); } catch(e) {}
    try { Audio.layer.setGain('asc-oct',   octGain,   0.08); } catch(e) {}
    try { Audio.layer.setGain('asc-sub',   subGain,   0.3); } catch(e) {}
    try { Audio.layer.setGain('asc-bass',  bassGain,  0.3); } catch(e) {}
    try { Audio.layer.setGain('asc-noise', noiseGain, 0.5); } catch(e) {}

    // ── 11. MAGNETIZED LEAD — peaks fire notes pulled toward chord tones ──
    if (asc.pluckCooldown > 0) asc.pluckCooldown -= dt;

    if (peakCount > 0 && asc.pluckCooldown <= 0 && asc.stagePhase === 'play' && !asc.breathActive && energy > 0.80) {
      var rawSemi = tiltNorm * 24 - 12;
      var rawFreq = cfg.wallRoot * Math.pow(2, rawSemi / 12);
      var voicing = prog[asc.chordStep];

      // Magnetize: pull toward nearest chord tone
      var magFreq = magnetize(rawFreq, cfg.wallRoot, voicing, asc.magnetism);
      while (magFreq < 300) magFreq *= 2;
      while (magFreq > 1200) magFreq /= 2;

      var leadVel = Math.min(1.0, 0.30 + energy * 0.06);
      ascRecord('LEAD', { rawSemi: +rawSemi.toFixed(1), rawHz: Math.round(rawFreq), magHz: Math.round(magFreq), pull: +(magFreq - rawFreq).toFixed(0), mag: +asc.magnetism.toFixed(2), chord: asc.chordStep, vel: +leadVel.toFixed(2) });
      try { Audio.synth.ascLead(0, magFreq, leadVel, 1.5, cfg.portamento); } catch(e) {}

      // Pluck from chord voicing
      var pi = Math.floor(Math.random() * voicing.length);
      var pf = cfg.wallRoot * Math.pow(2, voicing[pi] / 12);
      if (pf < 200) pf *= 2;
      if (pf > 2000) pf /= 2;
      try { Audio.synth.ascPluck(0, pf, Math.min(1, energy * 0.15 + 0.2), 0.8); } catch(e) {}

      asc.pluckCooldown = 0.2;

      // Still record to pitch buffer for re-analysis
      asc.pitchBuffer.push({ semi: rawSemi, time: asc.time });
      if (asc.pitchBuffer.length > asc.pitchBufferMax) asc.pitchBuffer.shift();
    }

    // ── 12. RE-ANALYSIS — every N bars, check if user's playing has shifted ──
    var reanalyzeBars = cfg.reanalyzeBars || 8;
    if (asc.barCount > 0 && asc.barCount % reanalyzeBars === 0 && asc.barCount !== asc.lastAnalysisBar && asc.pitchBuffer.length >= 4) {
      asc.lastAnalysisBar = asc.barCount;
      var newProg = analyzePitchBuffer(asc.pitchBuffer, cfg.progressions, cfg.wallRoot);
      var progNames = ['I-V-vi-IV (axis)', 'I-IV-V-vi (pop)', 'vi-IV-I-V (emotional)', 'I-vi-ii-V (jazz)'];
      if (newProg !== asc.progIndex) {
        ascRecord('REANALYSIS', { from: asc.progIndex, to: newProg, name: progNames[newProg] });
        asc.progIndex = newProg;
        prog = cfg.progressions[asc.progIndex];
      } else {
        ascRecord('REANALYSIS', { kept: asc.progIndex, name: progNames[asc.progIndex] });
      }
    }

    // ── 13. TILT → FILTER CUTOFF ──
    var filterTarget = cfg.filterRange[0] + tiltNorm * (cfg.filterRange[1] - cfg.filterRange[0]);
    var enrichFloor = cfg.filterRange[0] + asc.enrichment * (cfg.filterRange[1] * 0.4 - cfg.filterRange[0]);
    filterTarget = Math.max(filterTarget, enrichFloor);

    if (asc.breathActive) {
      var breathLFO = Math.sin(asc.breathPhase * Math.PI * 2);
      filterTarget += breathLFO * cfg.breathDepth;
      filterTarget = Math.max(cfg.filterRange[0], Math.min(cfg.filterRange[1], filterTarget));
    }

    if (asc.stagePhase !== 'suck') {
      asc.filterSmooth += (filterTarget - asc.filterSmooth) * 4.0 * dt;
      asc.filterSmooth = Math.max(cfg.filterRange[0], Math.min(cfg.filterRange[1], asc.filterSmooth));
      try { Audio.ascension.setWallFilter(asc.filterSmooth); } catch(e) {}
    }

    // ── 14. DETUNE SPREAD — widens with enrichment + motion ──
    var enrichSpread = cfg.detuneRange[0] + asc.enrichment * (cfg.detuneRange[1] - cfg.detuneRange[0]);
    var motionSpread = energy * 5;
    var spreadTarget = Math.min(cfg.detuneRange[1], enrichSpread + motionSpread);
    asc.spreadSmooth += (spreadTarget - asc.spreadSmooth) * 3.0 * dt;
    try { Audio.ascension.setWallSpread(asc.spreadSmooth); } catch(e) {}

    // ── 15. ROLL → PITCH SHIFT ──
    var rollNorm = Math.max(-1, Math.min(1, gamma / 30));
    try { Audio.ascension.setMasterPitch(rollNorm * 2); } catch(e) {}

    // ── 16. REVERB — grows with enrichment ──
    var reverbTarget = 0.15 + asc.enrichment * 0.30;
    if (asc.breathActive) reverbTarget = 0.65;
    try { Audio.setReverbMix(reverbTarget); } catch(e) {}

    // ── 17. DELAY ──
    var delayTarget = 0.05 + asc.enrichment * 0.15;
    if (asc.breathActive) delayTarget = 0.35;
    try { Audio.setDelayMix(delayTarget); } catch(e) {}
  }

  // Wobble LFO shapes — different each drop cycle
  function getWobbleLFO(phase, shape) {
    var p = phase % 1;
    switch (shape) {
      case 1:  return 1 - p * 2;                           // saw-down: aggressive sweep
      case 2:  return p < 0.5 ? 1 : -1;                    // square: choppy gate
      default: return Math.sin(p * Math.PI * 2);            // sine: classic smooth
    }
  }

  // ── DJ EVOLUTION — depth-layered rabbit hole ──
  // Not a flat sequence. A depth system. Each tier unlocks new types of
  // sound that weren't possible before. User behavior shapes WHICH direction
  // the music evolves. The longer you stay, the deeper it goes.
  //
  // Depth 0 (seg 0-3):   Foundation — kick, sub, basic filter. Just bones.
  // Depth 1 (seg 4-7):   Rhythm — hats, rides, pattern variation.
  // Depth 2 (seg 8-15):  Harmony — key changes, bass walks, chord movement.
  // Depth 3 (seg 16-23): Texture — filter sweeps, wobble shapes, snare rolls.
  // Depth 4 (seg 24+):   The Deep End — compound moves, polyrhythm hints,
  //                       elements that ONLY exist if you've gone this far.

  // Move pools per depth. Each move has a bias: 'energy', 'filter', 'rhythm', 'texture'.
  // User's dominant behavior weights which moves fire.
  var DJ_POOLS = [
    // ── DEPTH 0: Foundation (seg 0-3) ──
    // The bones. Just enough to feel the groove.
    [
      { bias: 'rhythm',  fn: function(g,t) { g.arr.hatPat = 1; } },
      { bias: 'filter',  fn: function(g,t) { g.arr.wobbleShape = 1; } },
      { bias: 'energy',  fn: function(g,t) { g.arr.bassWalk = 1; } },
      { bias: 'texture', fn: function(g,t) { g.arr.percPat = 1; } },
    ],
    // ── DEPTH 1: Rhythm (seg 4-7) ──
    // Patterns emerge. The groove gets character.
    [
      { bias: 'rhythm',  fn: function(g,t) { g.arr.kickPat = 1; } },
      { bias: 'rhythm',  fn: function(g,t) { g.arr.ride = true; } },
      { bias: 'filter',  fn: function(g,t) { g.arr.filterSweepDir = 1; g.arr.filterSweepPhase = 0; } },
      { bias: 'energy',  fn: function(g,t) { g.arr.clap = true; } },
      { bias: 'rhythm',  fn: function(g,t) { g.arr.hatPat = 2; } },
      { bias: 'texture', fn: function(g,t) { g.arr.snarePat = 1; } },
      { bias: 'filter',  fn: function(g,t) { g.arr.swing = 0.08; } },
    ],
    // ── DEPTH 2: Harmony (seg 8-15) ──
    // The music starts to move harmonically. New colors.
    [
      { bias: 'filter',  fn: function(g,t) { g.nextRootShift = 5; rebuildGridLayers(g,t); } },  // 4th
      { bias: 'energy',  fn: function(g,t) { g.arr.bassWalk = 2; } },
      { bias: 'rhythm',  fn: function(g,t) { g.arr.hatPat = 3; } },
      { bias: 'filter',  fn: function(g,t) { g.arr.wobbleShape = 2; g.arr.wobbleRate = 1.2; } },
      { bias: 'energy',  fn: function(g,t) { g.arr.kickPat = 2; } },
      { bias: 'filter',  fn: function(g,t) { g.nextRootShift = 3; rebuildGridLayers(g,t); } },  // b3
      { bias: 'energy',  fn: function(g,t) { g.arr.padOpen = true; try { Audio.layer.setFilter('edm-pad', 2200, 2.0); } catch(e) {} } },
      { bias: 'rhythm',  fn: function(g,t) { g.arr.subOctave = true; } },
      { bias: 'texture', fn: function(g,t) { g.arr.percPat = 2; g.arr.snarePat = 3; } },
      { bias: 'texture', fn: function(g,t) { g.arr.levitation = true; g.arr.levitationSpread = 20; } },  // tight unison — first taste
      { bias: 'filter',  fn: function(g,t) { g.arr.delayThrow = true; } },
      { bias: 'rhythm',  fn: function(g,t) { g.arr.kickPat = 6; } },  // syncopated latin
      { bias: 'energy',  fn: function(g,t) { g.arr.hatPat = 5; g.arr.swing = 0.12; } },  // house offbeats
    ],
    // ── DEPTH 3: Texture (seg 16-23) ──
    // Sonic detail. Filter Q sweeps. Delay throws. Complex patterns.
    [
      { bias: 'rhythm',  fn: function(g,t) { g.arr.hatPat = 4; g.arr.snareRoll = true; } },
      { bias: 'filter',  fn: function(g,t) { g.arr.filterSweepDir = -1; g.arr.filterSweepPhase = 1; g.arr.wobbleRate = 1.8; } },
      { bias: 'energy',  fn: function(g,t) { g.arr.kickPat = 3; g.arr.bassWalk = 3; } },
      { bias: 'filter',  fn: function(g,t) { g.nextRootShift = 7; rebuildGridLayers(g,t); } },  // 5th
      { bias: 'rhythm',  fn: function(g,t) { g.arr.ridePattern = 1; g.arr.clap = true; g.arr.stabVoicing = 1; } },
      { bias: 'energy',  fn: function(g,t) { g.arr.wobbleShape = 1; g.arr.wobbleRate = 2.0; } },
      { bias: 'texture', fn: function(g,t) { g.arr.reverbWash = true; g.arr.percPat = 3; } },
      { bias: 'texture', fn: function(g,t) { g.arr.levitation = true; g.arr.levitationSpread = 35; g.arr.reverbWash = true; } },  // full levitation — wide + reverb wash
      { bias: 'filter',  fn: function(g,t) { g.arr.filterQ = 6.0; g.arr.wobbleRate = 0.6; } },  // resonant slow sweep
      { bias: 'rhythm',  fn: function(g,t) { g.arr.snarePat = 4; g.arr.hatPat = 6; } },  // tribal broken
      { bias: 'energy',  fn: function(g,t) { g.arr.kickPat = 7; g.arr.bassWalk = 4; } },  // displaced + pedal
      { bias: 'texture', fn: function(g,t) { g.arr.halftime = true; g.arr.hatPat = 8; } },  // half-time section
      { bias: 'filter',  fn: function(g,t) { g.nextRootShift = 10; rebuildGridLayers(g,t); g.arr.wobbleShape = 0; } },  // b7
    ],
    // ── DEPTH 4: The Deep End (seg 24-31) ──
    // Compound moves. Strip + rebuild. Harmonic adventure.
    [
      { bias: 'energy',  fn: function(g,t) {
        g.arr.ride = false; g.arr.clap = false; g.arr.hatPat = 0; g.arr.snareRoll = false;
        g.arr.percPat = 0; // total strip — silence is powerful
      }},
      { bias: 'energy',  fn: function(g,t) {
        g.arr.ride = true; g.arr.clap = true; g.arr.hatPat = 3; g.arr.kickPat = 4;
        g.arr.percPat = 2; g.arr.stabVoicing = 2; // everything floods back — 7th chords
      }},
      { bias: 'filter',  fn: function(g,t) {
        g.nextRootShift = 0; rebuildGridLayers(g,t);
        g.arr.padOpen = true; g.arr.subOctave = true;
        g.arr.reverbWash = true;
        try { Audio.layer.setFilter('edm-pad', 3000, 1.5); } catch(e) {}
      }},
      { bias: 'filter',  fn: function(g,t) {
        g.nextRootShift = 1; rebuildGridLayers(g,t);  // b2 — phrygian abyss
        g.arr.wobbleShape = 2; g.arr.wobbleRate = 0.8;
        g.arr.filterSweepDir = -1; g.arr.filterSweepPhase = 1;
      }},
      { bias: 'rhythm',  fn: function(g,t) {
        g.arr.kickPat = 3; g.arr.ridePattern = 1; g.arr.hatPat = 4;
        g.arr.snarePat = 5; // polyrhythmic complexity
      }},
      { bias: 'filter',  fn: function(g,t) {
        g.arr.hatPat = 0; g.arr.ride = false; g.arr.subOctave = true;
        g.arr.bassWalk = 5; g.arr.wobbleRate = 0.5;  // sub-bass solo
      }},
      { bias: 'energy',  fn: function(g,t) {
        g.arr.hatPat = 3; g.arr.ride = true; g.arr.kickPat = 2;
        g.arr.wobbleRate = 1.5; g.arr.wobbleShape = 1;
        g.nextRootShift = 5; rebuildGridLayers(g,t);  // rebuild + key change
      }},
      { bias: 'rhythm',  fn: function(g,t) {
        g.arr.snareRoll = true; g.arr.clap = true; g.arr.hatPat = 9; // shuffled
        g.nextRootShift = 8; rebuildGridLayers(g,t);  // minor 6th
      }},
      { bias: 'texture', fn: function(g,t) {
        g.arr.halftime = true; g.arr.kickPat = 5; g.arr.snarePat = 2;
        g.arr.hatPat = 8; g.arr.reverbWash = true;  // half-time breakdown
      }},
      { bias: 'filter',  fn: function(g,t) {
        g.arr.halftime = false; g.arr.kickPat = 8; g.arr.hatPat = 7; // double-time slam
        g.arr.wobbleShape = 1; g.arr.wobbleRate = 2.5;
        g.arr.filterQ = 2.0;  // wide open filter
      }},
    ],
    // ── DEPTH 5: Transcendence (seg 32+) ──
    // The set has fully arrived. Maximum palette. Every move is a journey.
    [
      { bias: 'filter',  fn: function(g,t) {
        g.nextRootShift = 6; rebuildGridLayers(g,t);  // tritone — maximum tension
        g.arr.wobbleShape = 2; g.arr.wobbleRate = 0.4;
        g.arr.filterQ = 8.0;  // screaming resonance (briefly)
      }},
      { bias: 'energy',  fn: function(g,t) {
        g.nextRootShift = 0; rebuildGridLayers(g,t);  // release from tritone
        g.arr.kickPat = 0; g.arr.hatPat = 4; g.arr.clap = true;
        g.arr.snareRoll = true; g.arr.ride = true;
        g.arr.filterQ = 3.5; g.arr.wobbleRate = 1.5;
      }},
      { bias: 'rhythm',  fn: function(g,t) {
        g.arr.kickPat = 9; g.arr.snarePat = 5; g.arr.hatPat = 6;
        g.arr.percPat = 3; g.arr.swing = 0.15;  // maximum groove complexity
      }},
      { bias: 'texture', fn: function(g,t) {
        // Everything off except kick and sub — the "breath before the storm"
        g.arr.hatPat = 0; g.arr.ride = false; g.arr.clap = false;
        g.arr.snareRoll = false; g.arr.percPat = 0;
        g.arr.kickPat = 5; g.arr.halftime = true;
        g.arr.bassWalk = 6; // chromatic ascent
      }},
      { bias: 'energy',  fn: function(g,t) {
        // The storm — maximum everything
        g.arr.halftime = false; g.arr.kickPat = 8; g.arr.hatPat = 4;
        g.arr.ride = true; g.arr.clap = true; g.arr.snareRoll = true;
        g.arr.percPat = 2; g.arr.subOctave = true;
        g.arr.bassWalk = 3; g.arr.swing = 0;
        g.nextRootShift = 5; rebuildGridLayers(g,t);
      }},
      { bias: 'filter',  fn: function(g,t) {
        g.nextRootShift = 11; rebuildGridLayers(g,t);  // major 7th — shimmering
        g.arr.wobbleShape = 0; g.arr.wobbleRate = 0.3;  // glacial sine wobble
        g.arr.reverbWash = true; g.arr.padOpen = true;
        g.arr.hatPat = 5; g.arr.kickPat = 0;
      }},
      { bias: 'rhythm',  fn: function(g,t) {
        g.arr.kickPat = 6; g.arr.snarePat = 3; g.arr.hatPat = 9;
        g.arr.percPat = 4; g.arr.bassWalk = 5; // latin-influenced maximum groove
      }},
      { bias: 'texture', fn: function(g,t) {
        g.nextRootShift = 0; rebuildGridLayers(g,t);  // home
        g.arr.delayThrow = true; g.arr.reverbWash = true;
        g.arr.wobbleShape = 1; g.arr.wobbleRate = 1.0;
        g.arr.filterQ = 4.0;
      }},
      { bias: 'texture', fn: function(g,t) {
        // Maximum levitation — strip drums, pure floating supersaw
        g.arr.levitation = true; g.arr.levitationSpread = 45;
        g.arr.halftime = true; g.arr.kickPat = 5;
        g.arr.hatPat = 0; g.arr.ride = false; g.arr.percPat = 0;
        g.arr.reverbWash = true; g.arr.delayThrow = true;
        g.nextRootShift = 7; rebuildGridLayers(g,t);  // 5th — the most "floating" interval
      }},
    ],
  ];

  // Track which moves have been used in each pool (don't repeat)
  var poolUsed = [[], [], [], [], [], []];

  function getDepth(segment) {
    // At 4 bars/segment (~8s each): depth 0=0-16s, 1=16-32s, 2=32-64s,
    // 3=64-96s, 4=96-128s, 5=128s+ (~2 min to transcendence)
    if (segment < 2)  return 0;
    if (segment < 4)  return 1;
    if (segment < 8)  return 2;
    if (segment < 12) return 3;
    if (segment < 16) return 4;
    return 5;
  }

  // User tendency: what type of moves does their behavior suggest?
  function getUserBias() {
    // Bouncing/walking = rhythm. Waving = filter. High energy = energy. Exploring = texture.
    if (archetype === 'bouncing' || archetype === 'walking') return 'rhythm';
    if (archetype === 'waving') return 'filter';
    if (archetype === 'exploring') return 'texture';
    if (grid.intensity > 0.6) return 'energy';
    return 'filter';
  }

  function applyDJMove(seg, time) {
    if (seg < 1) return; // first segment: let intro breathe

    var depth = getDepth(seg);
    var pool = DJ_POOLS[depth];
    if (!pool || pool.length === 0) return;

    // If all moves in this pool are used, reset and re-shuffle
    if (poolUsed[depth].length >= pool.length) {
      poolUsed[depth] = [];
    }

    // Score each unused move: bias match = higher score + randomness
    var userBias = getUserBias();
    var best = null, bestScore = -1;
    for (var i = 0; i < pool.length; i++) {
      if (poolUsed[depth].indexOf(i) >= 0) continue;
      var score = Math.random() * 0.5; // base randomness
      if (pool[i].bias === userBias) score += 0.5; // bias match
      if (score > bestScore) { bestScore = score; best = i; }
    }

    if (best !== null) {
      poolUsed[depth].push(best);
      pool[best].fn(grid, time);
      gridRecord('DJ_MOVE', { seg: seg, depth: depth, move: best, bias: pool[best].bias, userBias: userBias });

      // Sonic marker: brief filter sweep to signal "something changed"
      // Deeper depths get more dramatic markers
      if (depth >= 2) {
        // Quick filter dip then return — the "DJ moving a fader" feel
        var curFilter = grid.filterSmooth || 800;
        try {
          Audio.setMasterFilter(curFilter * 0.4);  // brief dip
          setTimeout(function() {
            try { Audio.setMasterFilter(curFilter); } catch(e) {}
          }, 180);  // snap back in 180ms
        } catch(e) {}
      }
    }
  }

  function rebuildGridLayers(g, time) {
    var edm = lens.edm || {};
    var newSubFreq = (edm.subFreq || 55) * Math.pow(2, g.nextRootShift / 12);
    var newRoot = originalRoot * Math.pow(2, g.nextRootShift / 12);
    try { Audio.set808SubFreq(newSubFreq); } catch(e) {}
    try { Audio.edm.buildWobble(newSubFreq, 3.5); } catch(e) {}
    try { Audio.edm.buildSub(newSubFreq); } catch(e) {}
    // Rebuild levitation at new root — keeps unison in key
    try { Audio.edm.buildLevitation(newRoot, g.arr.levitationSpread || 30); } catch(e) {}
  }

  function updateGrid(brainState, sensor, dt) {
    if (!lens || !lens.edm || !Audio.ctx) return;
    var edm = lens.edm;
    var time = Audio.ctx.currentTime;

    var motionEnergy = (typeof Brain !== 'undefined') ? Brain.short.energy() : 0;
    var mediumEnergy = (typeof Brain !== 'undefined') ? Brain.medium.energy() : 0;

    // Track total set time for long-arc evolution
    grid.setTime += dt;
    grid.vocalCooldown = Math.max(0, grid.vocalCooldown - dt);

    // Harmonic movement: smoothly shift root frequency across cycles
    grid.rootShift += (grid.nextRootShift - grid.rootShift) * dt * 0.5;
    grid.currentRootFreq = originalRoot * Math.pow(2, grid.rootShift / 12);
    // Apply shifted root so scaleFreq() picks it up for bass walks, stabs, etc.
    root = grid.currentRootFreq;

    // (filter sweeps handled by DJ move system via grid.arr.filterSweepPhase)

    // State snapshot every 0.5s
    gridLogInterval += dt;
    if (gridLogInterval >= 0.5 && grid.started) {
      gridLogInterval = 0;
      gridRecord('STATE', {
        phase: grid.phase, energy: +motionEnergy.toFixed(2), medEnergy: +mediumEnergy.toFixed(2),
        tilt: +grid.tiltNorm.toFixed(2), zone: grid.tiltZone, roll: +grid.rollNorm.toFixed(2),
        intensity: +grid.intensity.toFixed(2), djGain: +grid.djGain.toFixed(2),
        pump: +grid.pumpIntensity.toFixed(2), filter: Math.round(grid.filterSmooth),
        seg: grid.segment, bars: grid.totalBars, cycle: grid.cycle,
        depth: Math.floor(grid.segment / 4),
      });
    }

    // ── 1. START: first motion starts the DJ set ──
    if (!grid.started) {
      if (motionEnergy > 0.12) {
        grid.started = true;
        grid.phase = 'intro';
        grid.phaseTimer = 0;
        isSilent = false;
        fadeGain = 0.5;
        gridRecord('START', 'DJ set started');
        // Intro: just the layers fading in. No melody — it was crashing.
        try { Audio.layer.setGain('edm-pad', 0.08, 3.0); } catch(e) {}
        try { Audio.layer.setGain('edm-sub', 0.03, 3.0); } catch(e) {}
        try { Audio.layer.setGain('edm-wobble', 0.02, 4.0); } catch(e) {}
      } else {
        if (Audio.ctx) Audio.setMasterGain(0);
        return;
      }
    }

    // ── 2. CLOCK: ALWAYS runs. NEVER stops. ──
    var effectiveStepDur = grid.arr.halftime ? grid.stepDur * 2 : grid.stepDur;
    grid.clock += dt;
    var barDur = effectiveStepDur * 16;
    // Swing: offset even-numbered 16th steps (the "e" and "a") by a fraction
    var rawStep = grid.clock / effectiveStepDur;
    var newStep = Math.floor(rawStep) % 16;
    if (grid.arr.swing > 0 && (newStep % 2 === 1)) {
      // Delay odd steps (offbeats) — creates shuffle feel
      var swungPos = (rawStep - grid.arr.swing * 0.5);
      newStep = Math.floor(swungPos) % 16;
    }
    var newBar = Math.floor(grid.clock / barDur);
    var isNewBar = false;
    if (newBar > grid.lastBar) {
      grid.lastBar = newBar;
      grid.totalBars++;
      isNewBar = true;
    }

    // ── 2b. DJ SET EVOLUTION — every 4 bars (~8s), one thing changes ──
    // Like a DJ bringing up a fader. Never jarring. Always fresh.
    grid.segment = Math.floor(grid.totalBars / 4);
    if (grid.segment > grid.lastSegment && grid.phase !== 'waiting' && grid.phase !== 'intro') {
      grid.lastSegment = grid.segment;
      applyDJMove(grid.segment, time);
    }
    // Filter sweep automation (smooth, continuous)
    if (grid.arr.filterSweepDir !== 0) {
      grid.arr.filterSweepPhase += dt * grid.arr.filterSweepDir * 0.25;
      grid.arr.filterSweepPhase = Math.max(0, Math.min(1, grid.arr.filterSweepPhase));
      if (grid.arr.filterSweepPhase >= 1 || grid.arr.filterSweepPhase <= 0) {
        grid.arr.filterSweepDir = 0;  // sweep complete
      }
    }

    // ── 3. INTENSITY + PUMP STYLE ──
    // Intensity has TWO sources: user motion AND set maturity.
    // The longer the set runs, the higher the floor. The DJ set grows on its own.
    // User motion adds ENERGY on top. Tilt = you're present = the set evolves.
    grid.lastIntensity = grid.intensity;

    // Time-based floor: set builds intensity over first 3 minutes
    // Even gentle tilt = the set is alive and growing
    var timeFloor = Math.min(0.55, grid.setTime * 0.003); // 0→0.55 over ~3min

    var targetIntensity = Math.max(timeFloor, Math.min(1, mediumEnergy * 0.8));
    var iRise = targetIntensity > grid.intensity ? 0.06 : 0.015;
    grid.intensity += (targetIntensity - grid.intensity) * iRise;

    // Pump intensity from peaks — how hard the user is hitting
    var peakNow = lastMag > lastLastMag && lastMag > (adaptedPeakThresh || 0.3);
    if (peakNow) {
      grid.pumpIntensity = Math.min(1, grid.pumpIntensity + 0.25);
    } else {
      grid.pumpIntensity *= 0.985;  // slow decay
    }

    // djGain: grows with the set. Your presence is enough.
    var gainFloor = Math.min(0.65, 0.30 + grid.setTime * 0.002); // 0.30→0.65 over ~3min
    var targetGain = Math.max(gainFloor, 0.22 + grid.intensity * 0.58);
    grid.djGain += (targetGain - grid.djGain) * 0.03;

    // ── 4. TILT ZONES — the heart of DJ manipulation ──
    // Smooth the raw tilt (beta) — MUCH smoother than before
    var beta = (sensor.beta || 45) - 45;
    var rawTilt = Math.max(0, Math.min(1, (beta + 30) / 60));
    grid.tiltNorm += (rawTilt - grid.tiltNorm) * 0.035;  // very smooth — no jumps

    // Roll (gamma) — smoothed, signed: negative=left, positive=right
    var rawRoll = Math.max(-1, Math.min(1, (sensor.gamma || 0) / 40));
    grid.rollNorm += (rawRoll - grid.rollNorm) * 0.04;

    // Tilt zone: 0=low (dark), 1=mid (groove), 2=high (bright)
    var rawZone;
    if (grid.tiltNorm < 0.33)      rawZone = 0;
    else if (grid.tiltNorm < 0.66) rawZone = 1;
    else                            rawZone = 2;
    grid.tiltZoneSmooth += (rawZone - grid.tiltZoneSmooth) * 0.025;
    grid.tiltZone = Math.round(grid.tiltZoneSmooth);

    // ── ZONE-BASED PARAMETER SHAPING ──
    // Each zone is a different DJ VIBE, not just a filter position
    var filterRange = edm.filterRange || [200, 6000];
    var zoneFilter, zoneWobbleCenter, zoneWobbleRange, zoneWobbleRate;
    var zoneSubMix, zoneHatMix, zonePadFilter, zoneQ;

    // LOW ZONE: deep sub world. Slow wobble, heavy bass, minimal highs.
    // This is the "holding it down" vibe.
    if (grid.tiltZoneSmooth < 0.8) {
      var lowBlend = Math.max(0, 1 - grid.tiltZoneSmooth / 0.8);  // 1 at 0, 0 at 0.8
      zoneFilter = 200 + grid.tiltNorm * 1800;  // 200-600 range in low zone
      zoneWobbleCenter = 120 + grid.tiltNorm * 200;
      zoneWobbleRange = 400 + lowBlend * 200;
      zoneWobbleRate = 0.4 + grid.tiltNorm * 0.6;  // slow in low zone
      zoneSubMix = 0.8 + lowBlend * 0.2;    // sub is LOUD down here
      zoneHatMix = 0.15 + grid.tiltNorm * 0.35;  // hats barely there
      zonePadFilter = 250 + grid.tiltNorm * 300;
      zoneQ = 3 + lowBlend * 2;  // moderate resonance — warm, not screamy
    }

    // MID ZONE: the pocket. Everything balanced. The groove zone.
    if (grid.tiltZoneSmooth >= 0.8 && grid.tiltZoneSmooth < 1.5) {
      var midT = (grid.tiltNorm - 0.33) / 0.33;  // 0-1 within mid range
      zoneFilter = 800 + midT * 1500;
      zoneWobbleCenter = 300 + midT * 500;
      zoneWobbleRange = 800 + midT * 600;
      zoneWobbleRate = 1.0 + midT * 0.5;
      zoneSubMix = 0.6;
      zoneHatMix = 0.5 + midT * 0.3;
      zonePadFilter = 500 + midT * 600;
      zoneQ = 3.5;  // moderate
    }

    // HIGH ZONE: energy. Everything opens up. But MUSICAL, not a drill.
    if (grid.tiltZoneSmooth >= 1.5) {
      var hiBlend = Math.min(1, (grid.tiltZoneSmooth - 1.5) / 0.5);
      zoneFilter = 2000 + hiBlend * 3000;
      zoneWobbleCenter = 600 + hiBlend * 800;
      zoneWobbleRange = 1200 + hiBlend * 600;
      zoneWobbleRate = 1.5 + hiBlend * 1.5;  // faster but capped — no drill
      zoneSubMix = 0.4 + hiBlend * 0.1;  // sub pulls back slightly
      zoneHatMix = 0.8 + hiBlend * 0.2;  // hats come alive
      zonePadFilter = 1000 + hiBlend * 800;
      zoneQ = 2.5 - hiBlend * 1.0;  // Q DROPS as frequency rises — no screech!
    }

    // Default safety (in case zone math didn't fire)
    if (zoneFilter === undefined) {
      zoneFilter = 800; zoneWobbleCenter = 300; zoneWobbleRange = 800;
      zoneWobbleRate = 1; zoneSubMix = 0.6; zoneHatMix = 0.5;
      zonePadFilter = 500; zoneQ = 3.5;
    }

    // ── ROLL = EQ ISOLATION ──
    // Left tilt: bass emphasis (sub up, hats down)
    // Right tilt: treble emphasis (hats up, sub down)
    // Neutral: balanced
    var rollBass = 1.0, rollTreble = 1.0;
    if (grid.rollNorm < -0.15) {
      // Left tilt = bass isolation
      var leftAmt = Math.min(1, (-grid.rollNorm - 0.15) / 0.6);
      rollBass = 1.0 + leftAmt * 0.4;     // bass boosted
      rollTreble = 1.0 - leftAmt * 0.6;   // treble cut
    } else if (grid.rollNorm > 0.15) {
      // Right tilt = treble isolation
      var rightAmt = Math.min(1, (grid.rollNorm - 0.15) / 0.6);
      rollBass = 1.0 - rightAmt * 0.5;    // bass cut
      rollTreble = 1.0 + rightAmt * 0.3;  // treble boosted
    }

    // ── 5. TOUCH = KILL SWITCH ──
    var touching = sensor.touching || false;
    if (touching && !grid.killActive) {
      grid.killActive = true;
    } else if (!touching && grid.killActive) {
      grid.killActive = false;
    }

    // Apply filter: kill switch overrides zone filter
    // DJ move sweep adds smooth long-term movement (0-1 phase → filter range)
    var sweepOffset = grid.arr.filterSweepPhase * (filterRange[1] - filterRange[0]) * 0.3;
    var filterTarget = grid.killActive ? filterRange[0] * 0.4 : (zoneFilter + sweepOffset);
    grid.filterSmooth += (filterTarget - grid.filterSmooth) * 0.04;
    try { Audio.setMasterFilter(grid.filterSmooth); } catch(e) {}

    // ── 6. PHASE MACHINE ──
    grid.phaseTimer += dt;
    var kit = '808';

    switch (grid.phase) {
      case 'intro':
        if (grid.phaseTimer > 3 || (peakNow && grid.phaseTimer > 1)) {
          grid.phase = 'build';
          gridRecord('PHASE', 'intro → build');
          grid.phaseTimer = 0;
          grid.buildLevel = (peakNow && grid.phaseTimer < 8) ? 0.15 : 0;
          grid.riserFired = false;
          grid.snareRollFired = false;
          try { Audio.layer.setGain('edm-wobble', 0.03, 2.0); } catch(e) {}
          try { Audio.layer.setGain('edm-sub', 0.06, 1.5); } catch(e) {}
        }
        break;

      case 'build':
        // Build rate: user motion accelerates, but it ALWAYS advances.
        // Even gentle tilt = build progresses. You don't have to pump hard.
        grid.buildLevel += grid.pumpIntensity * dt * 0.08;
        grid.buildLevel += grid.intensity * dt * 0.04;
        grid.buildLevel += dt * 0.015;  // passive build — drop comes within ~45s regardless
        grid.buildLevel = Math.min(1, grid.buildLevel);

        // ── VOCAL DROP: USER PEAKS TRIGGER EACH CLIP ──
        // Each peak during build = next vocal. YOU are performing the build.
        // Peak 1: "what is done" (after 6s of building — prevents double-trigger on load)
        // Peak 2: "to" triplet stutter (build holds, 4s after peak 1)
        // Peak 3: DROP — "you" + "you-deep" double drop
        var hasVocals = grid.vocalsLoaded && Audio.vocal && Audio.vocal.buffers;
        var doVocalBuild = hasVocals && !grid.vocalDropFired;

        // FIX: minimum build time before vocals + cooldown between advances
        if (doVocalBuild && peakNow && grid.buildLevel > 0.25 &&
            grid.phaseTimer > 6 && grid.vocalCooldown <= 0) {
          if (grid.vocalPhase === 0) {
            // Peak 1: "what is done"
            grid.vocalPhase = 1;
            grid.vocalCooldown = 4;  // minimum 4s before next vocal advance
            try { Audio.vocal.play('what-is-done', time, {
              vol: 0.8, reverb: 0.15, delay: 0.12
            }); } catch(e) {}

          } else if (grid.vocalPhase === 1) {
            // Peak 2: "to" triplet stutter — build HOLDS here
            grid.vocalPhase = 2;
            grid.vocalDropReady = true;
            grid.vocalCooldown = 3;  // 3s before drop can fire
            try { Audio.vocal.triplet('to-you', time, {
              vol: 0.85
            }); } catch(e) {}
          }
          // Peak 3 (vocalPhase 2 + vocalDropReady) handled below in drop trigger
        }

        // Hold build at 88% during vocal tension — user MUST peak to drop
        if (grid.vocalDropReady) {
          grid.buildLevel = Math.min(0.88, grid.buildLevel);
        }

        // Layer volumes track build, modulated by zone
        var wobbleVol = (0.03 + grid.buildLevel * 0.14) * zoneSubMix * rollBass;
        try { Audio.layer.setGain('edm-wobble', wobbleVol, 0.5); } catch(e) {}

        var subVol = (0.06 + grid.buildLevel * 0.10) * zoneSubMix * rollBass;
        try { Audio.layer.setGain('edm-sub', subVol, 0.5); } catch(e) {}

        try { Audio.layer.setFilter('edm-pad', zonePadFilter, 0.4); } catch(e) {}

        // Sidechain scales with build + pump
        var scDepth = 0.25 + grid.buildLevel * 0.2 + grid.pumpIntensity * 0.2;
        try { Audio.setSidechainDepth(Math.min(0.75, scDepth)); } catch(e) {}

        // ── DROP TRIGGER ──
        // If vocal drop is ready: next peak IS the drop (peak 3 = "you")
        // Otherwise: standard armed drop
        var armed = grid.vocalDropReady || grid.buildLevel > (edm.buildArmLevel || 0.65);
        var autoTrigger = grid.phaseTimer > 28;  // auto-drop within ~28s if no peak trigger
        var vocalReady = grid.vocalDropReady && grid.vocalCooldown <= 0;

        if ((vocalReady && peakNow && grid.vocalPhase >= 2) || (armed && peakNow && !doVocalBuild && grid.phaseTimer > 8) || autoTrigger) {
          grid.phase = 'drop';
          gridRecord('PHASE', { to: 'drop', cycle: grid.cycle + 1, trigger: autoTrigger ? 'auto' : (vocalReady ? 'vocal' : 'peak'), buildLevel: +grid.buildLevel.toFixed(2) });
          grid.phaseTimer = 0;
          grid.buildLevel = 0;
          grid.highEnergyTime = 0;
          grid.cycle++;
          grid.breakdownStyle = grid.cycle % 4;

          // ── VOCAL DOUBLE DROP ──
          if (grid.vocalDropReady) {
            grid.vocalDropFired = true;
            grid.vocalDropReady = false;
            grid.vocalPhase = 3;

            // "to-you" full clip — "you" lands ON the drop
            try { Audio.vocal.play('to-you', time, {
              vol: 0.9, reverb: 0.08
            }); } catch(e) {}

            // "you-deep" layered — the deep version hits 40ms later
            try { Audio.vocal.play('you-deep', time + 0.04, {
              vol: 0.85, reverb: 0.12, delay: 0.2
            }); } catch(e) {}
          }

          // Impact + slam everything open
          try { Audio.synth.impact(time, 0.85); } catch(e) {}
          try { Audio.setSidechainDepth(0.65); } catch(e) {}
          try { Audio.layer.setGain('edm-wobble', 0.20, 0.08); } catch(e) {}
          try { Audio.layer.setGain('edm-sub', 0.14, 0.08); } catch(e) {}
          try { Audio.layer.setGain('edm-pad', 0.10, 0.15); } catch(e) {}
          try { Audio.layer.setFilter('edm-pad', 1400, 0.1); } catch(e) {}

          // Variation: each drop feels different
          grid.dropVariation = grid.cycle % 4;
        }
        break;

      case 'drop':
        // ── THE DROP: user IS the DJ. Archetype shapes the vibe. ──
        // Each cycle's drop hits harder and has different character.

        // Sustained high energy for chops
        if (grid.intensity > 0.45) grid.highEnergyTime += dt;
        else grid.highEnergyTime = Math.max(0, grid.highEnergyTime - dt * 0.5);

        // Stillness → breakdown
        var lowE = grid.intensity < 0.12;
        if (lowE && grid.phaseTimer > 5) grid.buildLevel += dt * 0.18;
        else grid.buildLevel = Math.max(0, grid.buildLevel - dt * 0.4);

        // Escalation: later segments hit harder (more wobble, more sub, tighter sidechain)
        var cycleBoost = Math.min(0.15, grid.segment * 0.008);  // gradual ramp over the set

        // Zone-shaped layer volumes — tilt position shapes the MIX
        var dropWobble = (0.12 + grid.intensity * 0.12 + cycleBoost);
        try { Audio.layer.setGain('edm-wobble', dropWobble * zoneSubMix * rollBass, 0.3); } catch(e) {}

        var dropSub = (0.10 + grid.intensity * 0.08 + cycleBoost * 0.6);
        try { Audio.layer.setGain('edm-sub', dropSub * zoneSubMix * rollBass, 0.3); } catch(e) {}

        // Sidechain from archetype — bouncing = HARD pump, waving = lighter
        var dropSC = 0.45 + grid.pumpIntensity * 0.3 + cycleBoost;
        if (archetype === 'bouncing') dropSC += 0.2;
        else if (archetype === 'waving') dropSC += 0.05;
        else dropSC += grid.intensity * 0.1;
        try { Audio.setSidechainDepth(Math.min(0.90, dropSC)); } catch(e) {}

        // Peak during drop: hard sidechain pump (user feels the hit)
        if (peakNow) {
          try { Audio.pumpSidechain(0.9); } catch(e) {}
        }

        // Max drop → breakdown
        if (grid.buildLevel > 1.8 || grid.phaseTimer > 35) {
          grid.phase = 'breakdown';
          gridRecord('PHASE', 'drop → breakdown');
          grid.phaseTimer = 0;
          grid.buildLevel = 0;
          grid.breakdownMelodyFired = false;

          // Breakdown: strip layers, open space, but keep normal tempo
          try { Audio.setSidechainDepth(0.2); } catch(e) {}
          try { Audio.layer.setGain('edm-wobble', 0.04, 2.0); } catch(e) {}
          try { Audio.layer.setGain('edm-sub', 0.10, 1.5); } catch(e) {}
          try { Audio.layer.setGain('edm-pad', 0.10, 2.0); } catch(e) {}
          try { Audio.layer.setFilter('edm-pad', 800, 1.5); } catch(e) {}
          // More reverb for space — the music breathes
          try { Audio.setReverbMix(0.35); } catch(e) {}
        }
        break;

      case 'breakdown':
        // ── BREAKDOWN: stripped-back, normal tempo, space to breathe ──
        // Each cycle's breakdown is different — keeps the set feeling alive.
        // Style 0: pad swell (classic). Style 1: vocal atmosphere. Style 2: sub focus. Style 3: rhythmic.

        // Breakdown-specific character
        if (!grid.breakdownMelodyFired && grid.phaseTimer > 2) {
          grid.breakdownMelodyFired = true;
          var bdStyle = grid.breakdownStyle;
          var bdHasVocals = grid.vocalsLoaded && Audio.vocal && Audio.vocal.buffers;
          if (bdStyle === 0) {
            // Pad swell: open pad filter wide, let it breathe
            try { Audio.layer.setGain('edm-pad', 0.15, 3.0); } catch(e) {}
            try { Audio.layer.setFilter('edm-pad', 2000, 2.0); } catch(e) {}
          } else if (bdStyle === 1 && bdHasVocals) {
            // Vocal atmosphere: play a vocal clip with heavy reverb
            try { Audio.vocal.play('what-is-done', time, {
              vol: 0.4, reverb: 0.5, delay: 0.3
            }); } catch(e) {}
          } else if (bdStyle === 2) {
            // Sub focus: deep sub pulse, everything else almost silent
            try { Audio.layer.setGain('edm-sub', 0.16, 1.5); } catch(e) {}
            try { Audio.layer.setGain('edm-pad', 0.03, 1.5); } catch(e) {}
          } else {
            // Rhythmic: hats keep going, minimal everything else
            try { Audio.layer.setGain('edm-wobble', 0.01, 1.5); } catch(e) {}
            try { Audio.layer.setGain('edm-sub', 0.08, 1.5); } catch(e) {}
          }
        }

        // User moves = back to build
        var breakdownDone = grid.phaseTimer > 14;
        var userReady = grid.intensity > 0.35 && grid.phaseTimer > 5;
        if (breakdownDone || userReady) {
          grid.phase = 'build';
          gridRecord('PHASE', { to: 'build', trigger: breakdownDone ? 'auto' : 'userReady' });
          grid.phaseTimer = 0;
          grid.buildLevel = 0;
          grid.riserFired = false;
          grid.snareRollFired = false;
          grid.vocalDropFired = false;
          grid.vocalPhase = 0;
          grid.vocalTimer = 0;
          grid.vocalDropReady = false;
          grid.vocalCooldown = 6;  // don't let vocals fire immediately when returning to build
          try { Audio.setSidechainDepth(0.3); } catch(e) {}
          try { Audio.layer.setGain('edm-wobble', 0.03, 2.0); } catch(e) {}
          try { Audio.layer.setGain('edm-sub', 0.06, 1.5); } catch(e) {}
          // Restore dry reverb (coming out of breakdown space)
          try { Audio.setReverbMix(0.15); } catch(e) {}
        }
        break;
    }

    // ── 8. ARCHETYPE-DRIVEN MUSICAL LAYER ──
    // The organic archetype system detects HOW the user is moving.
    // Each archetype creates a different musical texture — not predictable, but responsive.
    grid.archetypeTimer += dt;
    if (archetype !== grid.lastArchetype) {
      grid.lastArchetype = archetype;
      grid.archetypeTimer = 0;
    }
    grid.chordStabCooldown = Math.max(0, grid.chordStabCooldown - dt);
    grid.tensionSwellTimer = Math.max(0, grid.tensionSwellTimer - dt);

    // Wobble shape: DJ move sets the base, archetype modulates it
    grid.wobbleShape = grid.arr.wobbleShape;
    if (archetype === 'bouncing' && archetypeConfidence > 0.4) {
      grid.wobbleShape = 2;  // square overrides during strong bouncing
    } else if (archetype === 'waving' && archetypeConfidence > 0.4) {
      grid.wobbleShape = 0;  // sine overrides during strong waving
    }

    // Tension swell: exploring archetype triggers slow evolving pad texture
    if (archetype === 'exploring' && grid.tensionSwellTimer <= 0 &&
        grid.phase !== 'intro' && grid.intensity > 0.1 && grid.intensity < 0.5) {
      var swellDeg = [0, 2, 4, 6][Math.floor(Math.random() * 4)];
      var swellFreq = scaleFreq(swellDeg, 1);
      var swellVol = 0.08 + grid.djGain * 0.06;
      try { Audio.synth.tensionSwell(time, swellFreq, swellVol, 3.0 + Math.random() * 2); } catch(e) {}
      grid.tensionSwellTimer = 4 + Math.random() * 3;  // 4-7s cooldown
    }

    // ── 9. WOBBLE: zone-shaped, roll-influenced, DJ-move modulated ──
    var wobbleR = (zoneWobbleRate || 1) * grid.arr.wobbleRate;
    // Roll adds asymmetric rate boost — tilting right speeds up slightly
    if (grid.rollNorm > 0.2) wobbleR *= (1 + (grid.rollNorm - 0.2) * 0.8);
    grid.wobblePhase += dt * (grid.bpm / 60) * wobbleR;
    var wobbleLFO = getWobbleLFO(grid.wobblePhase, grid.wobbleShape);

    // Wobble filter from zone, shaped by intensity
    var wobbleInt = Math.max(0.2, grid.intensity);
    var wobbleFreq = (zoneWobbleCenter || 300) + (wobbleLFO * 0.5 + 0.5) * (zoneWobbleRange || 800) * wobbleInt;
    try { Audio.edm.setWobbleFilter(wobbleFreq); } catch(e) {}

    // Wobble Q from zone — LOW = warm resonance, HIGH = reduced Q (no drill!)
    // DJ move can override the zone Q for resonant sweeps or wide-open filter
    var effectiveQ = (grid.arr.filterQ !== 3.5) ? grid.arr.filterQ : (zoneQ || 3.5);
    try { Audio.edm.setWobbleQ(effectiveQ); } catch(e) {}

    // ── 9b. DELAY THROW + REVERB WASH — DJ move effects ──
    // Delay throw: boosts delay send for echoing snares/stabs
    if (grid.arr.delayThrow) {
      try { Audio.setDelayMix(0.45); } catch(e) {}
    } else {
      try { Audio.setDelayMix(0.25); } catch(e) {}  // default level
    }
    // Reverb wash: opens reverb send wide — creates space/atmosphere
    if (grid.arr.reverbWash) {
      var washLevel = grid.phase === 'breakdown' ? 0.55 : 0.35;
      try { Audio.setReverbMix(washLevel); } catch(e) {}
    } else if (grid.phase !== 'breakdown') {
      try { Audio.setReverbMix(grid.arr.reverbLevel); } catch(e) {}
    }

    // ── 10. DRUMS ON CLOCK ──
    if (newStep !== grid.lastStep) {
      grid.lastStep = newStep;

      var isIntro = grid.phase === 'intro';
      var isDrop = grid.phase === 'drop';
      var isBuild = grid.phase === 'build';
      var isBreakdown = grid.phase === 'breakdown';
      // (isCut removed — cut-then-slam was the muting glitch)

      // HAT pattern: evolves via DJ moves + zone-influenced during drop
      var hatPat;
      var arrHat = GRID_HAT_VARIANTS[grid.arr.hatPat] || GRID_HAT;
      if (isDrop && grid.tiltZone >= 2) {
        // High zone during drop: one step more driving than current
        var dropHatIdx = Math.min(4, grid.arr.hatPat + 1);
        hatPat = GRID_HAT_VARIANTS[dropHatIdx] || GRID_HAT_DROP;
      } else if (isDrop) {
        hatPat = arrHat;
      } else if (isBuild && grid.buildLevel > 0.4) {
        hatPat = GRID_HAT_BUILD;
      } else {
        hatPat = arrHat;
      }

      // ── KICK ──
      // Pattern evolves via DJ moves — like a DJ switching between kick patterns.
      var kickPat = GRID_KICK_VARIANTS[grid.arr.kickPat] || GRID_KICK;
      var kv = kickPat[newStep] || 0;

      // ── KICK FILLS: every 4th or 8th bar, replace straight pattern ──
      // On the bar BEFORE a fill-interval boundary, last beat gets a fill
      var isFillBar = false;
      if (!isIntro && grid.totalBars > 2) {
        var fillInterval = isDrop ? 4 : 8;
        // Next bar will be on the interval boundary — this bar gets the fill
        isFillBar = ((grid.totalBars + 1) % fillInterval === 0);
      }

      if (isFillBar && newStep >= 12) {
        // Fill on last beat of the bar — kick roll leading into next bar
        var fillType = grid.totalBars % 3;
        if (fillType === 0 && newStep === 12) {
          // 32nd note kick roll: 4 rapid kicks
          try { Audio.synth.kickRoll(time, 4, 0.5 * grid.djGain * rollBass); } catch(e) {}
        } else if (fillType === 1) {
          // Syncopated: kicks on 13 and 15 (offbeats)
          if (newStep === 13 || newStep === 15) {
            kv = 0.8;
          }
        } else if (fillType === 2 && newStep === 14) {
          // Displaced: single late kick
          kv = 0.9;
        }
      }

      if (kv > 0) {
        var kickVel = kv * grid.djGain * rollBass;
        if (isIntro) kickVel *= 0.35;
        if (isBreakdown) kickVel *= 0.5;  // softer during breakdown
        if (kickVel > 0.03) {
          Audio.drum.kick(time, Math.min(0.92, kickVel), kit);
          Audio.pumpSidechain(kickVel);
        }
      }

      // ── SNARE ── (pattern evolves via DJ moves like kick/hats)
      var snarePat = GRID_SNARE_VARIANTS[grid.arr.snarePat] || GRID_SNARE;
      var sv = snarePat[newStep] || 0;
      if (sv > 0 && !isIntro) {
        var snareLevel;
        if (isDrop) snareLevel = 0.7 + grid.pumpIntensity * 0.3;
        else if (isBuild) snareLevel = Math.max(0.15, grid.buildLevel * 0.8);  // always present in build
        else if (isBreakdown) snareLevel = 0.3;
        else snareLevel = 0.2;  // always a bit of snare once past intro
        var snareVel = sv * grid.djGain * snareLevel;
        if (snareVel > 0.04) {
          Audio.drum.snare(time, Math.min(0.85, snareVel), kit);
        }
      }

      // ── SNARE ROLL: DJ move adds 16th ghost snares around beats 2&4 ──
      if (grid.arr.snareRoll && isDrop && !isIntro) {
        // Steps 3,5 and 11,13 = ghost 16ths flanking the main snare
        if (newStep === 3 || newStep === 5 || newStep === 11 || newStep === 13) {
          var rollVel = 0.15 * grid.djGain;
          if (rollVel > 0.03) {
            try { Audio.drum.snare(time, rollVel, kit); } catch(e) {}
          }
        }
      }

      // ── HATS ──
      // If DJ move activated hats (hatPat > 0), they should be AUDIBLE.
      // Intensity shapes how loud, but there's always a floor once enabled.
      var hv = hatPat[newStep] || 0;
      if (hv > 0 && !isIntro) {
        var hatLevel;
        var hatFloor = grid.arr.hatPat > 0 ? 0.25 : 0; // DJ move = hats are IN
        if (isDrop) hatLevel = zoneHatMix * (0.5 + grid.intensity * 0.5);
        else if (isBreakdown && grid.breakdownStyle !== 3) hatLevel = 0.15 * zoneHatMix;
        else if (isBreakdown && grid.breakdownStyle === 3) hatLevel = 0.4 * zoneHatMix;
        else hatLevel = Math.max(hatFloor, grid.intensity * 0.7) * zoneHatMix;
        var hatVel = hv * grid.djGain * hatLevel * rollTreble * 0.5;
        if (hatVel > 0.02) {
          Audio.drum.hat(time, hatVel, kit);
        }
      }

      // ── RIDE: brought in by DJ move, adds shimmer ──
      if (grid.arr.ride && !isIntro && !isBreakdown) {
        var rideHit = false;
        if (grid.arr.ridePattern === 0) {
          rideHit = (newStep === 0 || newStep === 8);  // half notes
        } else {
          rideHit = (newStep % 4 === 0);  // quarter notes — busier
        }
        if (rideHit) {
          var rideVel = 0.12 + grid.intensity * 0.1;
          rideVel *= grid.djGain * rollTreble;
          if (isDrop) rideVel *= 1.2;
          if (rideVel > 0.03) {
            try { Audio.drum.ride(time, Math.min(0.4, rideVel), kit); } catch(e) {}
          }
        }
      }

      // ── CLAP: brought in by DJ move, layers on snare beats ──
      if (grid.arr.clap && !isIntro && (isDrop || isBuild) && (newStep === 4 || newStep === 12)) {
        var clapVel = 0.2 + grid.intensity * 0.15;
        clapVel *= grid.djGain;
        if (isBuild) clapVel *= grid.buildLevel;
        if (clapVel > 0.04) {
          // Clap = snare with slightly different timing (layered 5ms late)
          try { Audio.drum.snare(time + 0.005, clapVel * 0.5, kit); } catch(e) {}
        }
      }

      // ── PERC: shaker/percussion layer, brought in by DJ moves ──
      if (grid.arr.percPat > 0 && !isIntro) {
        var percPat = GRID_PERC_VARIANTS[grid.arr.percPat] || GRID_PERC_VARIANTS[0];
        var pv = percPat[newStep] || 0;
        if (pv > 0) {
          var percLevel;
          if (isDrop) percLevel = 0.6 + grid.intensity * 0.4;
          else if (isBuild) percLevel = Math.max(0.2, grid.buildLevel * 0.6);
          else if (isBreakdown) percLevel = 0.15;
          else percLevel = 0.3;
          var percVel = pv * grid.djGain * percLevel * rollTreble;
          if (percVel > 0.02) {
            try { Audio.drum.shaker(time, Math.min(0.5, percVel), 0.04); } catch(e) {}
          }
        }
      }

      // ── CHORD STABS: archetype-driven melodic texture ──
      // Replaces arp. Bouncing = tight punchy stabs. Waving = sustained chords.
      // Walking = offbeat skanks. Exploring = nothing (pad handles it).
      if (!isIntro && grid.chordStabCooldown <= 0) {
        var stabFire = false;
        var stabSustain = 0.08;
        var stabVoicing = [];

        // DJ move stabVoicing shapes the chord color
        var voicingStyle = grid.arr.stabVoicing || 0;

        if (archetype === 'bouncing' && archetypeConfidence > 0.25) {
          // Fist pump: tight stabs on offbeats — syncopated energy
          stabFire = (newStep === 3 || newStep === 7 || newStep === 11 || newStep === 15);
          stabSustain = 0.06;  // very tight
          // Voicing evolves via DJ moves
          if (voicingStyle === 0) {
            stabVoicing = [scaleFreq(0, 1), scaleFreq(2, 1), scaleFreq(4, 1)];  // minor triad
          } else if (voicingStyle === 1) {
            stabVoicing = [scaleFreq(0, 1), scaleFreq(3, 1), scaleFreq(4, 1)];  // sus4 stab
          } else {
            stabVoicing = [scaleFreq(0, 1), scaleFreq(2, 1), scaleFreq(4, 1), scaleFreq(6, 1)];  // 7th chord
          }
        } else if (archetype === 'waving' && archetypeConfidence > 0.25 && isDrop) {
          // Hand swap: longer sustained chord on beat 1 and 3 — emotional
          stabFire = (newStep === 0 || newStep === 8);
          stabSustain = grid.stepDur * 3;  // sustained across 3 steps
          // Wider voicing — DJ move shapes color
          if (voicingStyle === 0) {
            stabVoicing = [scaleFreq(0, 0), scaleFreq(4, 0), scaleFreq(0, 1), scaleFreq(2, 1)];  // open
          } else if (voicingStyle === 1) {
            stabVoicing = [scaleFreq(0, 0), scaleFreq(2, 0), scaleFreq(4, 0), scaleFreq(0, 1)];  // close-voiced
          } else {
            stabVoicing = [scaleFreq(0, 0), scaleFreq(4, 0), scaleFreq(6, 0), scaleFreq(2, 1)];  // add9
          }
        } else if (archetype === 'walking' && isDrop) {
          // Steady rhythm: offbeat skank every other bar (reggae influence)
          stabFire = (grid.totalBars % 2 === 0) && (newStep === 4 || newStep === 12);
          stabSustain = 0.04;  // super tight skank
          var walkRoot = scaleFreq(0, 1);
          stabVoicing = [walkRoot, scaleFreq(2, 1)];
        }

        if (stabFire && stabVoicing.length > 0) {
          var stabVel = Math.max(0.25, grid.intensity) * grid.djGain * rollTreble;
          if (isBuild) stabVel *= Math.max(0.3, grid.buildLevel);
          if (isBreakdown) stabVel *= 0.3;
          if (stabVel > 0.04) {
            try { Audio.synth.chordStab(time, stabVoicing, stabVel * 0.4, stabSustain); } catch(e) {}
            grid.chordStabCooldown = stabSustain + 0.05;  // prevent overlap
          }
        }
      }

      // ── WALKING BASS: phrygian bass line on beat ──
      // Evolves via DJ moves — simple roots early, chromatic walks later.
      if (!isIntro && (newStep === 0 || newStep === 8)) {
        grid.subPulseStep = newStep;

        var walkIdx = Math.min(grid.arr.bassWalk, BASS_WALKS.length - 1);
        var bassPatterns = BASS_WALKS[walkIdx];
        var bassPat = bassPatterns[grid.totalBars % bassPatterns.length];
        var bassNote = newStep === 0 ? bassPat[0] : bassPat[1];
        var bassFreq = scaleFreq(bassNote, -2);  // low octave

        var bassV;
        if (isDrop) bassV = 0.30;
        else if (isBuild) bassV = 0.15 + grid.buildLevel * 0.15;
        else if (isBreakdown) bassV = 0.25;
        else bassV = 0.15;  // bass always present once activated
        bassV *= grid.djGain * zoneSubMix * rollBass;
        var bassDur = isBreakdown ? grid.stepDur * 6 : grid.stepDur * 3;

        if (bassV > 0.03) {
          try { Audio.synth.bassPluck(time + 0.005, bassFreq, bassV, bassDur); } catch(e) {}
          try { Audio.synth.subPulse(time + 0.005, bassFreq, bassV * 0.6, bassDur); } catch(e) {}
          // Sub octave doubling: deeper layer when DJ move activates it
          if (grid.arr.subOctave) {
            try { Audio.synth.subPulse(time + 0.005, bassFreq * 0.5, bassV * 0.35, bassDur * 1.5); } catch(e) {}
          }
        }
      }
    }

    // ── 11. PAD: zone-shaped, DJ-move modulated ──
    var padTarget;
    if (grid.phase === 'intro')          padTarget = 0.05 + Math.min(0.06, grid.phaseTimer * 0.008);
    else if (grid.phase === 'build')     padTarget = 0.04 + grid.buildLevel * 0.04;
    else if (grid.phase === 'drop')      padTarget = 0.05 + grid.intensity * 0.05;
    else if (grid.phase === 'breakdown') padTarget = 0.10;
    else padTarget = 0;
    // Pad open: DJ move widens the filter for texture
    if (grid.arr.padOpen && grid.phase !== 'intro') padTarget *= 1.3;
    try { Audio.layer.setGain('edm-pad', padTarget * grid.djGain, 0.5); } catch(e) {}
    try { Audio.layer.setFilter('edm-pad', zonePadFilter || 500, 0.4); } catch(e) {}

    // ── 11b. LEVITATION: ascension music — harmonic stack + OTT + LFO ──
    // Root + Major 3rd + Perfect 5th + Octave, each with unison detune.
    // OTT compression glues the wall. LFO on filter = breathing movement.
    // Activated by DJ move or automatically during deep drops.
    var levActive = grid.arr.levitation;
    // Auto-activate during sustained drops (depth 3+)
    if (!levActive && grid.phase === 'drop' && getDepth(grid.segment) >= 3 && grid.phaseTimer > 4) {
      levActive = true;
    }

    if (levActive) {
      var levGainTarget;
      if (grid.phase === 'drop')           levGainTarget = 0.06 + grid.intensity * 0.06;
      else if (grid.phase === 'build')     levGainTarget = 0.02 + grid.buildLevel * 0.04;
      else if (grid.phase === 'breakdown') levGainTarget = 0.10;  // ascension shines in breakdowns
      else                                  levGainTarget = 0.01;
      levGainTarget *= grid.djGain;
      try { Audio.layer.setGain('edm-levitation', levGainTarget, 0.8); } catch(e) {}

      // ── LFO AUTOMATION on filter — the breathing movement ──
      // Slow sine LFO modulates the filter cutoff. Tilt sets the CENTER,
      // LFO sweeps ±600Hz around it. This is what makes the wall "breathe."
      // Rate synced loosely to tempo: ~0.25Hz (one breath per 4 seconds)
      if (!grid.levLfoPhase) grid.levLfoPhase = 0;
      grid.levLfoPhase += dt * 0.25;  // 0.25Hz = one cycle per 4s
      var lfoMod = Math.sin(grid.levLfoPhase * Math.PI * 2);  // -1 to +1

      // Tilt sets base filter (phone up = bright), LFO breathes around it
      var levFilterBase = 500 + grid.tiltNorm * 3000;  // 500-3500Hz
      var levFilterLFO = levFilterBase + lfoMod * 600;  // ±600Hz sweep
      // During build: filter opens progressively (the "rising" feel)
      if (grid.phase === 'build') {
        levFilterLFO += grid.buildLevel * 800;  // opens as build rises
      }
      try { Audio.edm.setLevitationFilter(levFilterLFO); } catch(e) {}

      // Motion drives spread: still = tight chorus (12ct), moving = wide ethereal (42ct)
      var levSpread = 12 + grid.intensity * 30;
      if (grid.arr.levitationSpread !== 25) levSpread = grid.arr.levitationSpread;  // DJ move override
      try { Audio.edm.setLevitationSpread(levSpread); } catch(e) {}
    } else {
      try { Audio.layer.setGain('edm-levitation', 0, 1.5); } catch(e) {}  // slow fade out
      grid.levLfoPhase = 0;
    }

    // ── 12. MASTER GAIN ──
    if (Audio.ctx) {
      Audio.setMasterGain(0.55 * grid.djGain);
    }

    // ── 13. Spatial ──
    try { Audio.spatial.update(sensor.gamma || 0, false, sensor.touching); } catch(e) {}
  }

  // ── ORGANIC STAGE EVOLUTION ──────────────────────────────────────────
  // Journey lens evolves through 4 stages: Drift → Still Water → Tundra → Dark Matter
  // Each stage ~2.5 minutes. Crossfades tone, space, palette, mode over ~30s.
  // The three-act harmonic arc (sus4) runs independently on top.

  var organicStage = {
    current: 0,         // index into order[]
    timer: 0,           // time in current stage
    transitioning: false,
    transitionProgress: 0,  // 0-1 during crossfade
    stageDuration: 150,     // 2.5 minutes per stage
    crossfadeDuration: 30,  // 30 second crossfade
    lastApplied: -1,        // which stage config was last fully applied
    order: null,            // shuffled stage array — different every session
  };

  // Fisher-Yates shuffle (returns new array)
  function shuffleArray(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function resetOrganicStage() {
    organicStage.current = 0;
    organicStage.timer = 0;
    organicStage.transitioning = false;
    organicStage.transitionProgress = 0;
    organicStage.lastApplied = -1;
    // Shuffle stages for a unique journey every session
    if (lens && lens.stages) {
      organicStage.order = shuffleArray(lens.stages);
    } else {
      organicStage.order = null;
    }
  }

  // Interpolate a number between two values
  function lerpN(a, b, t) { return a + (b - a) * t; }

  // Build a blended lens config between two stages
  function blendStageConfig(stageA, stageB, t) {
    var blended = {};

    // Tone: interpolate all EQ values
    blended.tone = {
      bassFreq: lerpN(stageA.tone.bassFreq, stageB.tone.bassFreq, t),
      bassGain: lerpN(stageA.tone.bassGain, stageB.tone.bassGain, t),
      midFreq: lerpN(stageA.tone.midFreq, stageB.tone.midFreq, t),
      midQ: lerpN(stageA.tone.midQ, stageB.tone.midQ, t),
      midGain: lerpN(stageA.tone.midGain, stageB.tone.midGain, t),
      highFreq: lerpN(stageA.tone.highFreq, stageB.tone.highFreq, t),
      highGain: lerpN(stageA.tone.highGain, stageB.tone.highGain, t),
      ceiling: lerpN(stageA.tone.ceiling, stageB.tone.ceiling, t),
    };

    // Space: interpolate reverb, delay, saturation
    var revA = stageA.space.reverb, revB = stageB.space.reverb;
    var delA = stageA.space.delay, delB = stageB.space.delay;
    blended.space = {
      reverb: {
        decay: lerpN(revA.decay, revB.decay, t),
        damping: lerpN(revA.damping, revB.damping, t),
        preDelay: lerpN(revA.preDelay, revB.preDelay, t),
      },
      delay: {
        feedback: lerpN(delA.feedback, delB.feedback, t),
        filter: lerpN(delA.filter, delB.filter, t),
        sync: t < 0.5 ? delA.sync : delB.sync,
      },
      saturation: lerpN(stageA.space.saturation, stageB.space.saturation, t),
      type: t < 0.5 ? stageA.space.type : stageB.space.type,
      reverbMix: lerpN(stageA.space.reverbMix, stageB.space.reverbMix, t),
      sidechain: lerpN(stageA.space.sidechain || 0, stageB.space.sidechain || 0, t),
      spatial: {
        sweepRate: lerpN(
          (stageA.space.spatial || {}).sweepRate || 0.04,
          (stageB.space.spatial || {}).sweepRate || 0.04, t),
        sweepDepth: lerpN(
          (stageA.space.spatial || {}).sweepDepth || 0.28,
          (stageB.space.spatial || {}).sweepDepth || 0.28, t),
      },
    };

    return blended;
  }

  function applyStageConfig(stage) {
    if (!lens || !stage) return;

    // Update palette (voice assignments) — takes effect on next note
    lens.palette = stage.palette;

    // Update response thresholds
    lens.response = stage.response;
    var adaptedResp = motionProfile.adapt(lens.response);
    adaptedPeakThresh  = adaptedResp.peakThreshold || null;
    adaptedStillThresh = adaptedResp.stillnessThreshold || null;

    // Update emotion
    lens.emotion = stage.emotion;

    // Update motion
    lens.motion = stage.motion;

    // Update groove — use stage groove, or build one from GROOVE_DNA table
    if (stage.groove) {
      lens.groove = stage.groove;
    } else {
      // Every stage gets a tribal groove so drums actually fire
      var dna = GROOVE_DNA[stage.name];
      lens.groove = {
        kit: dna ? dna.kit : 'tribal',
        microTiming: { kick: 0, hat: 0, snare: 0 },
        ghosts: 0,
        backbeat: false,
        maxVel: 0.8,
        broken: false,
        dropRate: 0,
      };
    }

    // Update harmony: mode and root
    var newRoot = stage.harmony.root || 432;
    var newMode = stage.harmony.mode || 'major';
    originalRoot = newRoot;
    root = newRoot;
    scale = MODES[newMode] || MODES.major;
    baseScale = scale.slice();
    // Reset act so the three-act arc runs fresh on the new mode
    sessionAct = 0;
  }

  function updateOrganicStage(dt) {
    // Only for Journey lens (has stages)
    if (!lens || !lens.stages || lens.name === 'Grid') return;

    var stages = organicStage.order || lens.stages;
    if (!stages || stages.length === 0) return;

    organicStage.timer += dt;

    // Check if it's time to advance
    if (organicStage.current < stages.length - 1 &&
        organicStage.timer >= organicStage.stageDuration &&
        !organicStage.transitioning) {
      organicStage.transitioning = true;
      organicStage.transitionProgress = 0;
      var nextStage = stages[organicStage.current + 1];
      jrnRecord('STAGE_TRANSITION', { from: organicStage.current, to: organicStage.current + 1, name: nextStage ? nextStage.name : '?' });
    }

    // Run crossfade
    if (organicStage.transitioning) {
      organicStage.transitionProgress += dt / organicStage.crossfadeDuration;

      if (organicStage.transitionProgress >= 1) {
        // Transition complete — fully in new stage
        organicStage.transitionProgress = 1;
        organicStage.transitioning = false;
        organicStage.current++;
        organicStage.timer = 0;

        // Apply the new stage config fully
        var newStage = stages[organicStage.current];
        applyStageConfig(newStage);
        organicStage.lastApplied = organicStage.current;

        // Reconfigure audio with new stage's tone/space
        lens.tone = newStage.tone;
        lens.space = newStage.space;
        lens.harmony = newStage.harmony;
        try { Audio.configure(lens); } catch(e) {}

        // Update the lens indicator to show current stage
        var el = document.getElementById('lens-indicator');
        if (el) el.textContent = newStage.name;
      } else {
        // Mid-transition: blend tone/space and apply
        var fromIdx = organicStage.current;
        var toIdx = fromIdx + 1;
        if (toIdx < stages.length) {
          var blended = blendStageConfig(stages[fromIdx], stages[toIdx], organicStage.transitionProgress);
          lens.tone = blended.tone;
          lens.space = blended.space;
          try { Audio.configure(lens); } catch(e) {}

          // At 50% through, swap the palette/mode (discrete, not blendable)
          if (organicStage.transitionProgress >= 0.5 && organicStage.lastApplied !== toIdx) {
            applyStageConfig(stages[toIdx]);
            organicStage.lastApplied = toIdx;

            // Update indicator mid-transition
            var el2 = document.getElementById('lens-indicator');
            if (el2) el2.textContent = stages[toIdx].name;
          }
        }
      }
    }

    // Apply initial stage if not yet applied
    if (organicStage.lastApplied === -1 && stages.length > 0) {
      var initStage = stages[0];
      applyStageConfig(initStage);
      organicStage.lastApplied = 0;
      // Also set tone/space/harmony from the shuffled first stage
      lens.tone = initStage.tone;
      lens.space = initStage.space;
      lens.harmony = initStage.harmony;
      try { Audio.configure(lens); } catch(e) {}
      var el3 = document.getElementById('lens-indicator');
      if (el3) el3.textContent = initStage.name;
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
    // ── GRID BYPASS: EDM engine runs instead of organic pipeline ──
    // Grid manages its own gain, stillness, and clock — skip organic systems entirely.
    if (lens.name === 'Grid' && grid.active) {
      if (detectPeak(mag, now)) {
        recordPeakInterval(now);
        motionProfile.recordPeak(lastMag);
        peakCount++;
      }
      lastLastMag = lastMag;
      lastMag = mag;
      motionProfile.tick(dt * 1000, false);  // Grid is never "silent" once started
      updateGrid(brainState, sensor, dt);
      lastUpdateTime = now;
      return;  // SKIP all organic systems
    }

    // ── ASCENSION BYPASS: Hidden Songwriter engine ──
    // Acclimate → grid lock. The system writes a song around YOUR movements.
    if (lens.name === 'Ascension' && asc.active) {
      if (detectPeak(mag, now)) {
        recordPeakInterval(now);
        motionProfile.recordPeak(lastMag);
        peakCount++;
      }
      lastLastMag = lastMag;
      lastMag = mag;
      motionProfile.tick(dt * 1000, false);
      updateAscension(brainState, sensor, dt);
      lastUpdateTime = now;
      return;  // SKIP all organic systems
    }

    updateStillness(mag, dt, now);
    updatePhrase(mag, now, dt);
    parseIntent(mag, now);

    // Brain void override
    if ((brainState.voidState || 0) >= 2 && !isSilent) {
      var vThresh = (lens.response && lens.response.stillnessThreshold) || 0.2;
      if (mag < vThresh * 3) {
        isSilent = true;
        if (phraseActive) endPhrase(now);
      }
    }

    // ── Motion profile tick ──
    motionProfile.tick(dt * 1000, isSilent);

    // ── Peak detection ──
    if (detectPeak(mag, now)) {
      recordPeakInterval(now);
      onPeak(lastMag, now);
      motionProfile.recordPeak(lastMag);
    }

    lastLastMag = lastMag;
    lastMag = mag;

    // ── ROLE 3 PULSE: tempo lock + bar phase + drums ──
    updateTempoLock(now);
    updateBarPhase(now);
    processGrooveHats(now);
    processGrooveKickSnare(now);
    updateShaker(mag, now, dt);
    updateTribalPulse(dt);

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
    checkActAdvance();
    updateOrganicStage(dt);
    updateTensionArc(dt);

    // Journey state snapshot every 0.5s
    jrnWallClock += dt;
    jrnLogInterval += dt;
    if (jrnLogInterval >= 0.5 && lens && lens.name !== 'Grid' && lens.name !== 'Ascension') {
      jrnLogInterval = 0;
      var brainEnergy = (typeof Brain !== 'undefined') ? Brain.short.energy() : 0;
      jrnRecord('STATE', {
        lens: lens.name, silent: isSilent, phrase: phraseActive,
        energy: +brainEnergy.toFixed(2), mag: +mag.toFixed(2), fade: +fadeGain.toFixed(2),
        degree: currentDegree, filter: Math.round(filterFreq), gyro: +gyroMagSmooth.toFixed(2),
        tempo: Math.round(derivedTempo), locked: tempoLocked,
        density: +densityLevel.toFixed(1), act: sessionAct,
        stage: organicStage.current, stageTimer: Math.round(organicStage.timer),
        tribal: +tribalPulse.drumPresence.toFixed(2),
        void: +voidPresence.toFixed(2),
      });
    }

    // ── Master gain ──
    touchDuck = Math.min(1.0, touchDuck + dt * 2.0);
    if (Audio.ctx) {
      // Tribal pulse needs a gain floor so drums are audible even during quiet passages
      var tribalFloor = tribalPulse.drumPresence * 0.35;
      var effectiveGain = Math.max(fadeGain, tribalFloor);
      Audio.setMasterGain(0.48 * effectiveGain * touchDuck);

      if (typeof Weather !== 'undefined' && Weather.loaded && lens) {
        var wxm = Weather.mods;
        var baseRv = (lens.space && lens.space.reverbMix) || 0.25;
        Audio.setReverbMix(Math.min(0.85, baseRv + epi.spaceMix + wxm.reverbBoost));
      }
    }

    // ── 8D Spatial ──
    try { Audio.spatial.update(sensor.gamma || 0, isSilent, sensor.touching); } catch (e) {}

    // ── The Void — entered when the user is fully still ──
    updateVoid(dt);

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
    get profileSessions() { return motionProfile.sessions; },
    get profileArchetype() { return motionProfile.archetype; },
    get profilePeakMag() { return motionProfile.peakMag; },
    scaleFreq: scaleFreq,
    triggerCompression: triggerCompression,
    get melodicVocab() { return melodicHistory.slice(); },
    get gridPhase() { return grid.active ? grid.phase : '-'; },
    get gridBuild() { return grid.active ? grid.buildLevel.toFixed(2) : '-'; },
    get gridIntensity() { return grid.active ? grid.intensity.toFixed(2) : '-'; },
    get gridDjGain() { return grid.active ? grid.djGain.toFixed(2) : '-'; },
    get gridSegment() { return grid.active ? grid.segment : '-'; },
    get gridDepth() { return grid.active ? getDepth(grid.segment) : '-'; },
    get gridBars() { return grid.active ? grid.totalBars : '-'; },
    get gridLayers() {
      if (!grid.active) return '-';
      var a = grid.arr;
      return 'K' + a.kickPat + ' H' + a.hatPat + ' Sn' + a.snarePat +
        ' P' + a.percPat + ' B' + a.bassWalk +
        (a.ride ? ' Rd' : '') + (a.clap ? ' Cl' : '') +
        (a.halftime ? ' HT' : '') + (a.delayThrow ? ' DT' : '') +
        (a.reverbWash ? ' RW' : '') + (a.levitation ? ' LEV' : '');
    },
    // Ascension debug — Hidden Songwriter
    get ascPhase() { return asc.active ? asc.phase : '-'; },
    get ascFilter() { return asc.active ? Math.round(asc.filterSmooth) : '-'; },
    get ascDetune() { return asc.active ? asc.spreadSmooth.toFixed(1) : '-'; },
    get ascChord() { return asc.active ? 'P' + asc.progIndex + ' C' + asc.chordStep + ' bar' + asc.barCount : '-'; },
    get ascGain() { return asc.active ? asc.masterGain.toFixed(2) : '-'; },
    get ascBreathing() { return asc.active ? (asc.breathActive ? 'YES' : 'no') : '-'; },
    get ascEnrich() { return asc.active ? asc.enrichment.toFixed(2) + ' mag' + asc.magnetism.toFixed(2) : '-'; },
    get ascEnergy() { return asc.active ? asc.ascEnergy.toFixed(1) : '-'; },
    get ascPitches() { return asc.active ? asc.pitchBuffer.length + '/' + asc.pitchBufferMax : '-'; },
  });
})();
