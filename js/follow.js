/**
 * FOLLOW — Music Follows The Body
 *
 * THIS IS MUSIC 2.0.
 *
 * There is NO clock. There are NO pre-written patterns.
 * Your body IS the composition.
 *
 * v2: Tempo Lock, Musical Momentum, Phrase Arcs, Movement Archetypes
 *
 * The music doesn't just react — it CATCHES your groove,
 * anticipates your next move, and keeps the pocket alive.
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
  // Steps: 0=beat1, 4=beat2, 8=beat3(half-time snare), 12=beat4.
  // All lenses get drum DNA — 4 had groove:null and never produced drums.
  // kit: which Audio.drum kit to use
  // snap: goldilocks tolerance in 16th-note steps (1=tight, 3=forgiving)
  // feel: drunk offset 0=straight, 0.12=Dilla
  // halftime: true = snare only on beat 3 (the heavy, slow feel)
  // sparse: only fires on high-velocity peaks
  // barDivisor: only fires every N bars (Tundra heartbeat)

  var GROOVE_DNA = {
    'The Conductor': {
      kick:  [0.8,0,0,0, 0,0,0,0, 0.28,0,0,0, 0,0,0,0],
      snare: [0,0,0,0,   0,0,0,0, 0,0,0,0,    0,0,0,0],   // no snare — orchestra
      hat:   [0,0,0,0,   0.10,0,0,0, 0,0,0,0, 0.10,0,0,0], // light cymbal on 2+4
      feel: 0, kit: 'acoustic', snap: 3, halftime: true,
    },
    'Blue Hour': {
      kick:  [0.74,0,0,0, 0,0.13,0,0, 0,0,0,0, 0.30,0,0,0],  // 1, ghost 2-and, pickup 4
      snare: [0,0,0,0,    0,0,0,0,    0.76,0,0,0.08, 0,0,0,0.04], // half-time backbeat + ghosts
      hat:   [0,0.22,0.58,0.22, 0.58,0.22,0.58,0.22, 0.58,0.22,0.58,0.22, 0.58,0.22,0.58,0.22], // ride
      feel: 0.12, kit: 'brushes', snap: 2, halftime: true,
    },
    'Drift': {
      kick:  [0.40,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], // one per bar
      snare: [0,0,0,0,    0,0,0,0, 0,0,0,0, 0,0,0,0],
      hat:   [0,0,0,0,    0,0,0,0, 0,0,0,0, 0,0,0,0],
      feel: 0, kit: 'acoustic', snap: 2, halftime: true, sparse: true,
    },
    'Tundra': {
      kick:  [0.52,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], // heartbeat
      snare: [0,0,0,0,    0,0,0,0, 0,0,0,0, 0,0,0,0],
      hat:   [0,0,0,0,    0,0,0,0, 0,0,0,0, 0,0,0,0],
      feel: 0, kit: 'acoustic', snap: 2, halftime: true, sparse: true, barDivisor: 4,
    },
    'Still Water': {
      kick:  [0.48,0,0,0, 0,0,0,0, 0.22,0,0,0, 0,0,0,0],
      snare: [0,0,0,0,    0,0,0,0, 0.26,0,0,0, 0,0,0,0],
      hat:   [0,0,0,0,    0.08,0,0,0, 0,0,0,0, 0.08,0,0,0], // barely there
      feel: 0.05, kit: 'brushes', snap: 3, halftime: true,
    },
    'Dark Matter': {
      kick:  [1.0,0,0,0.18, 0,0,0.28,0, 0.72,0,0.18,0, 0,0.32,0,0],
      snare: [0,0,0,0,      0.80,0,0,0.11, 0,0.26,0,0, 0.60,0,0.09,0],
      hat:   [1.0,0.36,1.0,0.36, 1.0,0.36,1.0,0.36, 1.0,0.36,1.0,0.36, 1.0,0.36,1.0,0.36],
      feel: 0, kit: 'glitch', snap: 1, halftime: false,
    },
    'Grid': {
      // 4-on-the-floor kick with syncopated hits — the warehouse heartbeat
      kick:  [1.0,0,0,0.28, 0,0,0.55,0, 1.0,0,0,0.28, 0,0,0,0],
      // HALFTIME snare — snare only on beat 3 (bar midpoint). This IS dubstep.
      snare: [0,0,0,0, 0,0,0,0, 0.98,0,0,0, 0,0,0.18,0],
      // 8th-note hats — the grid
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
  // The key travels a circle-of-fifths journey over the session, then resolves.
  // I → IV → V → home. Every listener feels this arc without knowing why.
  var originalRoot   = 432;
  var rootSemiOffset = 0;     // current smoothed semitone offset from originalRoot
  var rootSemiTarget = 0;     // destination semitone offset
  var arcStep        = 0;     // how far along the journey we are
  // Semitone offsets: home → up a 4th → up a 5th → home (I–IV–V–I at the key level)
  var ARC_JOURNEY    = [0, 5, 7, 0];
  var ARC_STEP_ENERGY = 50;   // sessionEnergyAccum units per step (~4-5 min active play)

  function scaleFreq(degree, octave) {
    var len = scale.length;
    var oct = Math.floor(degree / len);
    var deg = ((degree % len) + len) % len;
    var semi = scale[deg] + (oct + (octave || 0)) * 12;
    return root * Math.pow(2, semi / 12);
  }

  // ── HARMONIC GRAVITY ──────────────────────────────────────────────────
  // After playing tense scale degrees, the next note is pulled toward rest.
  // This creates the feeling of anticipation and resolution — music with memory.

  function recordNote(deg) {
    var scaleDeg = ((deg % scale.length) + scale.length) % scale.length;
    melodicHistory.push(scaleDeg);
    if (melodicHistory.length > 8) melodicHistory.shift();
    lastHistoryDeg = scaleDeg;

    // Rule of threes: count toward resolution
    var isConsonant = (scaleDeg === 0 || scaleDeg === 2 || scaleDeg === 4 || scaleDeg === 7);
    if (phraseNoteCount >= 2 && isConsonant) {
      // Resolution landed — breathe, reset
      phraseNoteCount = 0;
      phraseBreathing = true;
      setTimeout(function () { phraseBreathing = false; }, 480); // quarter-note breath
    } else {
      phraseNoteCount++;
    }
    // Centroid drifts slowly toward recent notes — harmonyDegree follows this
    melodicCentroid += (scaleDeg - melodicCentroid) * 0.06;

    // Tension = weighted average (recent notes count more)
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

  // ── RULE OF THREES ────────────────────────────────────────────────────
  // Two notes set up tension. The third resolves. How you resolve is the art.
  var phraseNoteCount = 0;   // notes played since last resolution
  var phraseBreathing = false; // brief silence after resolution

  function gravitateDegree(rawDeg) {
    // Phase 0: only root/3rd/5th — consonant gate so first notes always sound good
    if (sessionPhase === 0) {
      var cons = [0, 2, 4];
      var best = 0, bestD = 999;
      for (var c = 0; c < cons.length; c++) {
        var d = Math.abs(rawDeg - cons[c]);
        if (d < bestD) { bestD = d; best = cons[c]; }
      }
      return best;
    }

    // Rule of threes: after 2 setup notes, pull hard toward resolution
    if (phraseNoteCount >= 2) {
      // Resolve toward nearest consonant — root, 3rd, or 5th
      var resolve = [0, 2, 4, 7];
      var best = 0, bestD = 999;
      for (var ri = 0; ri < resolve.length; ri++) {
        var d = Math.abs(rawDeg - resolve[ri]);
        if (d < bestD) { bestD = d; best = resolve[ri]; }
      }
      // Strong pull — 70% toward resolution, 30% user position
      return Math.round(rawDeg * 0.30 + best * 0.70);
    }

    // Gentle suggestion — not a force, a lean
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

  // Continuous pitch voice (tilt → melody)
  var currentDegree = 0;
  var targetDegree = 0;
  var lastNoteTime = 0;

  // Harmonic state
  var harmonyDegree = 0;

  // ── MELODIC MEMORY ────────────────────────────────────────────────────
  // Tracks what we've played recently. High tension → pull toward resolution.
  var melodicHistory  = [];     // last 8 scale degrees played
  var harmonicTension = 0;      // 0=resolved, 1=tense
  var lastHistoryDeg  = null;
  // Tension by scale position: tonic/5th = rest; leading tone = maximum tension
  var DEGREE_TENSION  = [0.0, 0.45, 0.25, 0.55, 0.15, 0.65, 0.90];

  // Slow-moving centroid of recent scale degrees — harmonyDegree follows this
  // so chord tones always land near where the player has been playing.
  var melodicCentroid = 0;

  // ── VERTICAL ARC TRACKING ─────────────────────────────────────────────
  // The arm swings make Olympic arcs in space. We track the phone's true
  // vertical position in the world regardless of phone angle — by projecting
  // linear acceleration onto the world-up vector from the gravity reading.
  // The arc peak = top of musical phrase. Arc valley = bottom. The path = melody.
  // Position memory: when the user returns to the same height, same note plays.
  // Anticipation: as they approach a remembered position, whisper the note.
  var vertVelocity  = 0;     // world-space vertical velocity (leaky integral)
  var vertPosition  = 0;     // relative vertical position, -1 to +1
  var vertPhase     = 0;     // 1=rising, -1=falling
  var arcPeak       = 0;     // vertPosition at last arc peak
  var arcValley     = 0;     // vertPosition at last arc valley
  var arcAmplitude  = 0.4;   // adapts to how big the user's sweeps actually are
  var posMemory     = [];    // [{pos, degree, count}] — the invisible keyboard
  var POS_BUCKET    = 0.18;  // positions within this range = "same place in space"
  var POS_MAX       = 8;     // max remembered positions
  var lastAnticTime = 0;

  // Hat deduplication — prevents triple subdivision hits when all three
  // schedulers (user-triggered, grid-anticipated, momentum) fire at once.
  var lastHatTime = 0;

  // ── BAR PHASE (Goldilocks drum sync) ──────────────────────────────────
  // Continuously tracks position within the 4-beat bar (0.0–1.0).
  // Derived from locked tempo. Drums snap to bar-phase hot zones.
  var barPhase    = 0;    // 0.0-1.0 — where we are in the bar
  var barOrigin   = 0;    // wall time of the last detected beat 1
  var barCount    = 0;    // how many complete bars since lock
  var lastBarStep   = -1;  // last 16th-note step processed (hat dedup)
  var lastKickStep  = -1;  // last step kick was evaluated
  var lastSnareStep = -1;  // last step snare was evaluated
  var lastKickTime  = 0;   // wall ms of last kick hit (rate limit)
  var lastSnareTime = 0;   // wall ms of last snare hit (rate limit)

  // Energy / density
  var energySmooth = 0;
  var densityLevel = 0;
  var densityTarget = 0;

  // Drone layer
  var droneLayer = null;
  var droneActive = false;
  var droneGain = 0;

  // Stillness → silence
  var stillnessTimer = 0;
  var isSilent = true;
  var fadeGain = 0;
  var lastUpdateTime = 0;

  // Subdivision scheduling
  var subdivEvents = [];

  // Filter (expression from gyro)
  var filterFreq = 800;
  var filterTarget = 800;

  // Stats for debug
  var peakCount = 0;
  var noteCount = 0;
  var errorCount = 0;

  // ── SESSION ARC ───────────────────────────────────────────────────────
  // The music opens up as the user earns it through engagement.
  // Phase 0 EMERGENCE  (0–12s): tilt melody only, sparse, quiet — discover the instrument
  // Phase 1 LISTENING  (12–28s): peak voices + harmonics appear — music wakes up
  // Phase 2 ALIVE      (28s+):  drums, groove, everything — fully alive
  var sessionEngagedTime = 0;   // seconds of active (non-silent) play
  var sessionPhase = 0;
  var PHASE_LISTENING = 8;
  var PHASE_ALIVE = 20;

  // ── DESCENT ARC ───────────────────────────────────────────────────────
  // The music earns its structural arc. Build enough energy and the world
  // collapses to pure sub-bass — then rebuilds as you keep moving.
  // Seeds, not script. The threshold is a CONSTELLATION of conditions, not a clock.
  var sessionEnergyAccum = 0;   // only accumulates at phase 2 — earns the event
  var descentState  = 'off';    // 'off' | 'compressing' | 'falling' | 'floor' | 'rising'
  var descentMix    = 0;        // 0=full music, 1=pure bass world
  var floorMotion   = 0;        // motion on the floor earns the ascent
  var ASCENT_THRESHOLD = 18;    // floor motion units before rebuild begins
  var descentBassLive = false;  // whether the bass layer is running

  // ── EPIGENETIC STATE ───────────────────────────────────────────────────
  // Each descent cycle completes a generation. The DNA (lens) stays the same.
  // But the environment of what was played accumulates and changes expression.
  // Same genome, different phenotype. Cells building a heart — each pass richer.
  var generation    = 0;        // how many full descent cycles completed
  var epi = {
    rootDrift:    0,   // semitone shift added each generation (music climbs)
    spaceMix:     0,   // extra reverb depth (0→0.4 over 4 generations)
    massiveFloor: 0,   // massivePhase minimum for next generation (pre-built)
    energyGate:   24,  // sessionEnergyAccum needed to earn next descent (rises each gen)
    harmonyCarry: 0,   // melodicCentroid value carried through the floor
  };

  // Compression phase — the build before the breath
  var compressionBeatCount = 0;
  var compressionNextBeat  = 0;
  var COMPRESSION_BEATS    = 8; // beats of building tension before the drop

  // Drop 2 — fires once inside the floor world
  var drop2Fired = false;

  // ── GESTURE DISCOVERY ─────────────────────────────────────────────────
  // Tracks what the user has discovered this session.
  // Drives the emotional voice — the instrument speaks when you earn it.
  var sessionDiscoveries = {};

  // Rapid oscillation (tremolo) — detect C's rapid back-and-forth
  var rapidPeakTimes  = [];    // rolling timestamps of recent peaks
  var TREMOLO_WINDOW  = 1200;  // ms window to check
  var TREMOLO_MIN     = 5;     // peaks needed = "tremolo gesture"
  var tremoloState    = false;
  var tremoloTimer    = 0;

  // Upside down detection
  var invertedDuration = 0;
  var wasInverted      = false;

  // Touch onset control
  var lastTouchNote = 0;   // ms — rate limiting
  var touchDuck     = 1.0; // 0-1 multiplier applied to master gain when touch begins

  // GROOVE CRYSTALLIZATION STATE
  var grooveBuf = [];
  var grooveLoop = null;
  var grooveBarLen = 2000;
  var grooveStart = 0;
  var grooveIteration = -1;
  var grooveStrength = 0;
  var groovePlaying = false;
  var grooveIsPlayback = false;

  // ── TEMPO LOCK SYSTEM ─────────────────────────────────────────────────
  // Like a musician who catches your groove and plays WITH you.
  // Once your motion has a pattern, the music LOCKS to your rhythm
  // and starts anticipating your next move.

  var tempoLocked = false;
  var lockedInterval = 500;     // ms between locked beats
  var nextGridBeat = 0;         // when the next anticipated beat should fire
  var gridBeatCount = 0;        // how many grid beats since lock
  var lockStrength = 0;         // 0-1: how strongly we're locked
  var lastUserPeakOnGrid = 0;   // when the user last confirmed the grid

  function updateTempoLock(now) {
    // Need enough data to lock
    if (piLen < 3) { tempoLocked = false; lockStrength = 0; return; }

    // Calculate average interval
    var sum = 0;
    for (var i = 0; i < piLen; i++) sum += peakIntervals[i];
    var avgInterval = sum / piLen;

    if (rhythmConfidence > 0.22) {
      if (!tempoLocked) {
        // LOCK — we caught your groove
        tempoLocked = true;
        lockedInterval = avgInterval;
        nextGridBeat = now + lockedInterval;
        gridBeatCount = 0;
      } else {
        // Already locked — drift toward user's current tempo
        lockedInterval += (avgInterval - lockedInterval) * 0.15;
      }
      lockStrength = Math.min(1, lockStrength + 0.05);
    } else {
      // Losing confidence — start releasing the lock
      lockStrength *= 0.97;
      if (lockStrength < 0.1) {
        tempoLocked = false;
        lockStrength = 0;
      }
    }
  }

  function processGridBeats(now) {
    if (!tempoLocked || isSilent || !lens || !Audio.ctx || sessionPhase < 2) return;
    if (descentState === 'floor') return; // bass world has its own pulse

    // Fire anticipated grid beats
    while (nextGridBeat <= now) {
      gridBeatCount++;
      var timeSinceUserPeak = now - lastPeakTime;

      // Only play grid beats that the user DIDN'T already trigger
      // (if user peaked within 80ms of this grid beat, skip — they got it)
      if (timeSinceUserPeak > 80) {
        fireGridBeat(now);
      }

      nextGridBeat += lockedInterval;
    }
  }

  function fireGridBeat(now) {
    if (!Audio.ctx) return;

    try {
      var time = Audio.ctx.currentTime;
      var palette = lens.palette || {};
      // Grid beats are quieter than user-triggered beats
      // They're the band keeping time, not the soloist
      var gridVel = 0.25 * lockStrength * fadeGain;

      // Subdivision between grid beats
      if (palette.subdivision) {
        var sub = palette.subdivision;
        var divisions = sub.divisions || 2;
        var subInterval = lockedInterval / divisions;
        for (var d = 1; d < divisions; d++) {
          var subTime = time + (d * subInterval / 1000);
          if (sub.voice === 'hat' || !sub.voice) {
            scheduleGridSub(now + d * subInterval, subTime, gridVel * (sub.vel || 0.3), sub.kit || 'acoustic');
          }
        }
      }

      // Light kick on grid beats — hats are now handled by processGrooveHats
      if (lens.groove) {
        var gKit = lens.groove.kit || 'acoustic';
        if (gridBeatCount % 2 === 0 && now - lastKickTime > lockedInterval * 0.8) {
          Audio.drum.kick(time, gridVel * 0.5, gKit);
          lastKickTime = now;
        }
      }
    } catch (e) { errorCount++; }
  }

  // Grid subdivision scheduling
  var gridSubEvents = [];

  function scheduleGridSub(wallTime, audioTime, vel, kit) {
    gridSubEvents.push({ time: wallTime, audioTime: audioTime, vel: vel, kit: kit, fired: false });
  }

  function processGridSubs(now) {
    for (var i = gridSubEvents.length - 1; i >= 0; i--) {
      var ev = gridSubEvents[i];
      if (ev.fired) { gridSubEvents.splice(i, 1); continue; }
      if (now >= ev.time) {
        ev.fired = true;
        // Deduplication: skip if user-triggered sub already fired a hat within 35ms
        if (now - lastHatTime >= 35) {
          lastHatTime = now;
          try { Audio.drum.hat(Audio.ctx.currentTime, ev.vel, ev.kit); } catch (e) {}
        }
        gridSubEvents.splice(i, 1);
      }
    }
    // Clean stale events
    if (gridSubEvents.length > 32) gridSubEvents.splice(0, gridSubEvents.length - 16);
  }

  // ── MUSICAL MOMENTUM ──────────────────────────────────────────────────
  // When you briefly pause, the groove keeps going for a few beats.
  // Like a real musician holding the pocket when the soloist breathes.

  var momentumActive = false;
  var momentumBeatsLeft = 0;
  var momentumInterval = 500;
  var momentumNextBeat = 0;
  var momentumVelocity = 0.4;
  var momentumDecay = 0.7;       // each beat is 70% of the previous

  function startMomentum(now) {
    if (!tempoLocked || piLen < 3) return;
    momentumActive = true;
    momentumBeatsLeft = Math.min(8, Math.round(lockStrength * 6)); // up to 6 beats
    momentumInterval = lockedInterval;
    momentumNextBeat = now + momentumInterval;
    momentumVelocity = 0.3 * lockStrength;
  }

  function processMomentum(now) {
    if (!momentumActive || isSilent || !lens || !Audio.ctx || sessionPhase < 1) return;
    if (descentState === 'floor') return;

    if (now >= momentumNextBeat && momentumBeatsLeft > 0) {
      momentumBeatsLeft--;
      momentumVelocity *= momentumDecay;

      if (momentumVelocity > 0.03) {
        try {
          var time = Audio.ctx.currentTime;
          var palette = lens.palette || {};

          // Momentum keeps the rhythm alive with quiet hits
          if (lens.groove) {
            var mKit = lens.groove.kit || 'acoustic';
            Audio.drum.hat(time, momentumVelocity * 0.5, mKit);
            if (momentumBeatsLeft % 2 === 0) {
              Audio.drum.kick(time, momentumVelocity * 0.4, mKit);
            }
          }

          // Subdivisions removed from momentum — processGrooveHats handles all hats
        } catch (e) { errorCount++; }
      }

      momentumNextBeat += momentumInterval;

      // Resolution on last momentum beat
      if (momentumBeatsLeft === 0) {
        momentumActive = false;
        // Play a soft resolution
        if (lens.palette && lens.palette.continuous) {
          try {
            var freq = scaleFreq(0, lens.palette.continuous.octave || 0);
            Audio.synth.play(lens.palette.continuous.voice || 'epiano',
              Audio.ctx.currentTime, freq, momentumVelocity, 1.5);
          } catch (e) {}
        }
      }
    }
  }

  // ── PHRASE SYSTEM ─────────────────────────────────────────────────────
  // Groups of peaks become musical phrases with a shape:
  //   approach → build → climax → resolve
  // Not isolated hits — connected musical ideas.

  var phraseActive = false;
  var phrasePeakCount = 0;
  var phraseStartTime = 0;
  var phraseMaxMag = 0;
  var phraseEnergyArc = 0;       // 0-1: where we are in the phrase arc
  var phraseCooldown = 0;        // time before next phrase can start

  function updatePhrase(mag, now, dt) {
    if (phraseCooldown > 0) phraseCooldown -= dt;

    if (!phraseActive) {
      // Start a new phrase when we get a peak after silence/rest
      if (mag > 0.5 && phraseCooldown <= 0) {
        phraseActive = true;
        phrasePeakCount = 0;
        phraseStartTime = now;
        phraseMaxMag = mag;
        phraseEnergyArc = 0;
      }
    } else {
      // Track the phrase arc
      var phraseDuration = now - phraseStartTime;
      if (mag > phraseMaxMag) phraseMaxMag = mag;

      // Phrase position: rises in first half, falls in second
      // Natural phrases last 2-8 seconds
      var phraseLen = Math.min(8000, Math.max(2000, piLen > 2 ? lockedInterval * 8 : 4000));
      phraseEnergyArc = Math.min(1, phraseDuration / phraseLen);

      // Musical intensity follows a bell curve within the phrase
      // First 40%: building, last 20%: resolving, middle 40%: peak
      var phraseIntensity;
      if (phraseEnergyArc < 0.4) {
        phraseIntensity = phraseEnergyArc / 0.4; // ramp up
      } else if (phraseEnergyArc < 0.8) {
        phraseIntensity = 1.0; // sustain peak
      } else {
        phraseIntensity = 1.0 - (phraseEnergyArc - 0.8) / 0.2; // ramp down
      }

      // Apply phrase intensity to the system
      phraseIntensityFactor = phraseIntensity;

      // End phrase on stillness or after max duration
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
    phraseCooldown = 0.5; // half second before next phrase
    phraseIntensityFactor = 1.0;

    // Harmonic shift at phrase boundary — chord tones follow where the player has been playing.
    // melodicCentroid is a slow weighted average of actual scale degrees played,
    // so harmonyDegree earns its position from the user's melodic history.
    if (sessionPhase >= 1) {
      harmonyDegree = Math.round(melodicCentroid);
    }

    // Phrase-ending harmonic note
    if (lens && lens.palette && lens.palette.harmonic && Audio.ctx) {
      try {
        var h = lens.palette.harmonic;
        var freq = scaleFreq(harmonyDegree, h.octave || 0);
        Audio.synth.play(h.voice || 'epiano', Audio.ctx.currentTime, freq, 0.2, 1.5);
        noteCount++;
      } catch (e) {}
    }
  }

  // ── MOVEMENT ARCHETYPE DETECTION ──────────────────────────────────────
  // Walking ≠ waving ≠ bouncing ≠ exploring.
  // Each feels different, so the music responds differently.

  var archetype = 'exploring'; // 'walking', 'waving', 'bouncing', 'exploring'
  var archetypeConfidence = 0;
  var archetypeSmoothEnergy = 0;

  function classifyArchetype(brainState) {
    var pattern = brainState.pattern || 'still';
    var neurons = brainState.neurons || {};
    var energy = brainState.energy || 0;
    archetypeSmoothEnergy += (energy - archetypeSmoothEnergy) * 0.05;

    // Use neuron firing rates to distinguish movement types
    var pendRate = neurons.pendulum ? neurons.pendulum.rate() : 0;
    var sweepRate = neurons.sweep ? neurons.sweep.rate() : 0;
    var shakeRate = neurons.shake ? neurons.shake.rate() : 0;
    var rockRate = neurons.rock ? neurons.rock.rate() : 0;

    var prev = archetype;

    if (pattern === 'still' || archetypeSmoothEnergy < 0.15) {
      archetype = 'exploring';
    } else if (pendRate > 1.5 && rhythmConfidence > 0.4) {
      // Regular back-and-forth with periodicity → walking
      archetype = 'walking';
    } else if (shakeRate > 1.0 && archetypeSmoothEnergy > 1.5) {
      // Vigorous + shaking → bouncing
      archetype = 'bouncing';
    } else if (sweepRate > 0.8) {
      // Smooth arcs → waving
      archetype = 'waving';
    } else if (rockRate > 0.5 && archetypeSmoothEnergy < 0.8) {
      // Gentle rocking → exploring
      archetype = 'exploring';
    } else if (rhythmConfidence > 0.3) {
      archetype = 'walking'; // periodic = probably walking
    } else {
      archetype = 'waving'; // default for non-periodic movement
    }

    if (archetype !== prev) {
      archetypeConfidence = 0;
    } else {
      archetypeConfidence = Math.min(1, archetypeConfidence + 0.02);
    }
  }

  // Archetype-specific musical response modifiers
  function archetypeModifiers() {
    switch (archetype) {
      case 'walking':
        return {
          peakVoiceBoost: 1.2,  // stronger bass on peaks (footsteps)
          drumBoost: 1.0,       // full drum response
          subdivBoost: 1.0,     // regular subdivisions
          melodyRate: 0.8,      // slightly less melodic (walking, not playing)
          lockBias: 0.3,        // stronger tendency to lock
        };
      case 'bouncing':
        return {
          peakVoiceBoost: 0.8,  // less bass (drums take over)
          drumBoost: 1.5,       // DRUMS DOMINATE
          subdivBoost: 1.3,     // more subdivisions
          melodyRate: 0.5,      // less melody
          lockBias: 0.4,        // strong lock tendency
        };
      case 'waving':
        return {
          peakVoiceBoost: 0.6,  // softer peaks
          drumBoost: 0.4,       // minimal drums
          subdivBoost: 0.3,     // few subdivisions
          melodyRate: 1.5,      // MORE melodic (arm = melody)
          lockBias: 0.0,        // don't try to lock (fluid)
        };
      case 'exploring':
      default:
        return {
          peakVoiceBoost: 0.7,
          drumBoost: 0.5,
          subdivBoost: 0.5,
          melodyRate: 1.0,
          lockBias: 0.0,
        };
    }
  }

  // PER-LENS MOTION DRIVER: each lens uses a different sensor signal as its primary mag
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

  // GROOVE CRYSTALLIZATION
  function grooveRecord(type, data) {
    if (!tempoLocked || isSilent || grooveIsPlayback || grooveBarLen < 200 || sessionPhase < 2) return;
    var now = performance.now();
    var pos = ((now - grooveStart) % grooveBarLen) / grooveBarLen;
    grooveBuf.push({ t: now, pos: pos, type: type, data: data });
    var cutoff = now - grooveBarLen * 2.1; var i = 0;
    while (i < grooveBuf.length && grooveBuf[i].t < cutoff) i++;
    if (i > 0) grooveBuf.splice(0, i);
  }

  function grooveConsistency() {
    if (grooveBuf.length < 4 || grooveBarLen < 200) return 0;
    var now = performance.now(); var bar1 = [], bar2 = [];
    for (var i = 0; i < grooveBuf.length; i++) {
      var age = now - grooveBuf[i].t;
      if (age < grooveBarLen) bar1.push(grooveBuf[i].pos);
      else if (age < grooveBarLen * 2) bar2.push(grooveBuf[i].pos);
    }
    if (bar1.length < 2 || bar2.length < 2) return 0;
    var matched = 0;
    for (var a = 0; a < bar1.length; a++)
      for (var b = 0; b < bar2.length; b++)
        if (Math.abs(bar1[a] - bar2[b]) < 0.12) { matched++; break; }
    return matched / Math.max(bar1.length, bar2.length);
  }

  function grooveUpdate(now) {
    if (!tempoLocked) {
      grooveStrength *= 0.97;
      if (grooveStrength < 0.05) { groovePlaying = false; grooveLoop = null; grooveStrength = 0; grooveBuf = []; }
      return;
    }
    grooveBarLen = lockedInterval * 4;
    if (grooveStart === 0) grooveStart = now;
    var consistency = grooveConsistency();
    grooveStrength += consistency > 0.55 ? 0.005 : -0.008;
    grooveStrength = Math.max(0, Math.min(1, grooveStrength));
    if (grooveStrength > 0.75 && !groovePlaying) {
      var cutoff = now - grooveBarLen; grooveLoop = [];
      for (var i = 0; i < grooveBuf.length; i++)
        if (grooveBuf[i].t > cutoff) grooveLoop.push({ pos: grooveBuf[i].pos, type: grooveBuf[i].type, data: grooveBuf[i].data, played: false });
      grooveIteration = Math.floor((now - grooveStart) / grooveBarLen);
      groovePlaying = true;
      console.log("[Groove] Crystallized " + grooveLoop.length + " events");
    }
    if (grooveStrength < 0.15 && groovePlaying) { groovePlaying = false; grooveLoop = null; }
    if (!groovePlaying || !grooveLoop || isSilent || fadeGain < 0.15) return;
    var iter = Math.floor((now - grooveStart) / grooveBarLen);
    if (iter > grooveIteration) { for (var j = 0; j < grooveLoop.length; j++) grooveLoop[j].played = false; grooveIteration = iter; }
    var barPos = ((now - grooveStart) % grooveBarLen) / grooveBarLen;
    for (var k = 0; k < grooveLoop.length; k++) {
      var ev = grooveLoop[k];
      if (!ev.played && barPos >= ev.pos - 0.025 && barPos < ev.pos + 0.065) { ev.played = true; groovePlay(ev); }
    }
  }

  function groovePlay(ev) {
    if (!Audio.ctx) return;
    // Groove loop respects the descent — during the bass world drop, the loop
    // fades with the rest of the music so sub-bass has space.
    if (descentMix > 0.92) return;
    var time = Audio.ctx.currentTime;
    var vel = Math.min(1, (ev.data.vel || 0.3) * Math.min(1, fadeGain) * 0.72 * (1 - descentMix * 0.9));
    grooveIsPlayback = true;
    try {
      if      (ev.type === "note")  Audio.synth.play(ev.data.voice, time, ev.data.freq, vel, ev.data.decay || 0.5);
      else if (ev.type === "kick")  Audio.drum.kick(time, vel, ev.data.kit || "acoustic");
      else if (ev.type === "snare") Audio.drum.snare(time, vel, ev.data.kit || "acoustic");
      else if (ev.type === "hat")   Audio.drum.hat(time, vel, ev.data.kit || "acoustic");
    } catch(e) {}
    grooveIsPlayback = false;
  }

  // ── DESCENT / ASCENT ──────────────────────────────────────────────────
  // Quincy Jones: "The arrangement must breathe. The drop is only as
  //   powerful as the build before it."
  // Rick Rubin: "Remove everything. The bass is the truth."
  // Thom Yorke: "Let it fall apart. Then let it transform."
  // Viral music science: the moment of near-silence before the sub-bass
  //   hits is the most physiologically arousing moment in music.
  //   Anticipation + contrast = emotional memory.

  var FALL_RATE = 1 / 4.5;   // 4.5s to descend into the bass world
  var RISE_RATE = 1 / 6.0;   // 6s to rise back to full spectrum

  // ── DROP ASSESSMENT ───────────────────────────────────────────────────
  // The drop is not timed. It reads the constellation of what the user built.
  // All conditions must align. Rhythm, tension, energy, engagement — all earned.

  function assessDropReadiness() {
    if (descentState !== 'off') return false;
    if (sessionPhase < 2) return false;
    if (isSilent) return false;
    if (rhythmConfidence < 0.35) return false;   // need a real pulse
    if (harmonicTension < 0.42) return false;    // need tension — somewhere to fall to
    if (sessionEnergyAccum < epi.energyGate) return false;   // earned through play, not waiting
    if (energySmooth < 0.5) return false;        // drop fires at a peak, not a lull
    return true;
  }

  // ── COMPRESSION PHASE ─────────────────────────────────────────────────
  // Before the drop, the music compresses. Subdivisions double.
  // A creeping sub rises from below. The familiar voice fades.
  // The user feels something gathering.

  function startCompression() {
    if (descentState !== 'off') return;
    descentState = 'compressing';
    compressionBeatCount = 0;
    var beatMs = tempoLocked ? lockedInterval : 550;
    compressionNextBeat = performance.now() + beatMs;
  }

  // ── DROP 2 ────────────────────────────────────────────────────────────
  // Fires mid-floor when the user has earned half the ascent.
  // Archetype determines what kind of dark they fall into.

  function fireDropTwo() {
    if (!Audio.ctx || !lens) return;
    drop2Fired = true;
    var time = Audio.ctx.currentTime;

    switch (archetype) {
      case 'walking':
      case 'bouncing':
        // Rhythm dominates — drums slam in from a new angle
        if (lens.groove) {
          var kit = lens.groove.kit || 'acoustic';
          Audio.drum.kick(time,        1.0, kit);
          Audio.drum.snare(time + 0.04, 0.8, kit);
          Audio.drum.hat(time + 0.08,  0.6, kit);
          Audio.drum.kick(time + 0.14, 0.9, kit);
          Audio.drum.hat(time + 0.18,  0.5, kit);
        }
        try { Audio.synth.play('dirty', time + 0.25, root / 4, 0.80, 7.0); } catch(e) {}
        break;

      case 'waving':
        // Harmony leads — dark chord cluster, the tonal world shifts
        var waveDeg = [0, 3, 6]; // minor-flavoured in the sub-register
        for (var wi = 0; wi < waveDeg.length; wi++) {
          try {
            Audio.synth.play('dirty', time + wi * 0.18,
              scaleFreq(waveDeg[wi], -2), 0.62, 6.0);
          } catch(e) {}
        }
        break;

      case 'exploring':
      default:
        // Textural — the space itself transforms, a low mass arrives
        try { Audio.synth.play('dirty', time, root / 4, 0.72, 9.0); } catch(e) {}
        try { Audio.synth.play('dirty', time + 0.3, root / 3, 0.55, 7.0); } catch(e) {}
        break;
    }

    // The instrument acknowledges the moment — voice fires 2s later, after the music lands
    if (typeof Voice !== 'undefined' && !sessionDiscoveries.drop) {
      sessionDiscoveries.drop = true;
      setTimeout(function () { Voice.onDiscovery('drop'); }, 2000);
    }
  }

  function startDescent() {
    if ((descentState !== 'off' && descentState !== 'compressing') || !Audio.ctx || !lens) return;
    descentState   = 'falling';
    descentMix     = 0;
    floorMotion    = 0;
    drop2Fired     = false;

    // The signal: one massive sub hit — the floor announces itself
    try {
      Audio.synth.play('sub808', Audio.ctx.currentTime, root / 4, 1.0, 5.5);
    } catch (e) {}

    // 1.1s silence — the held breath — then the bass world arrives
    setTimeout(function () {
      if (descentState !== 'off') {
        try { Audio.descentBass.start(root / 8); descentBassLive = true; } catch (e) {}
      }
    }, 1100);
  }

  function updateDescent(mag, sensor, dt) {
    // Assessment: when the constellation aligns, begin compression
    if (descentState === 'off') {
      if (assessDropReadiness()) startCompression();
      return;
    }

    // ── COMPRESSING — the build before the breath ──────────────────────
    if (descentState === 'compressing') {
      var nowMs = performance.now();
      var beatMs = tempoLocked ? lockedInterval : 550;

      if (nowMs >= compressionNextBeat) {
        compressionBeatCount++;
        compressionNextBeat += beatMs;
        var prog = compressionBeatCount / COMPRESSION_BEATS;

        // Double-time subdivision pressure — the beat tightens
        if (Audio.ctx && lens && lens.palette && lens.palette.subdivision) {
          var sub  = lens.palette.subdivision;
          var kit  = (lens.groove && lens.groove.kit) || sub.kit || 'acoustic';
          var cVel = 0.12 + prog * 0.38;
          var ct   = Audio.ctx.currentTime;
          Audio.drum.hat(ct, cVel, kit);
          Audio.drum.hat(ct + beatMs / 2000, cVel * 0.65, kit); // upbeat ghost
        }

        // Creeping sub from beat 4 onward — something is rising from below
        if (compressionBeatCount >= 4 && Audio.ctx) {
          try {
            Audio.synth.play('sub808', Audio.ctx.currentTime,
              root / 5, prog * 0.28, 1.0 + prog);
          } catch(e) {}
        }

        // Compression complete — THE BREATH begins
        if (compressionBeatCount >= COMPRESSION_BEATS) {
          startDescent();
        }
      }
      return;
    }

    var gamma = sensor ? (sensor.gamma || 0) : 0;

    // FALLING: upper voices fade to silence
    if (descentState === 'falling') {
      descentMix = Math.min(1, descentMix + dt * FALL_RATE);
      if (descentMix >= 0.99) { descentMix = 1; descentState = 'floor'; Audio.setMassivePhase(4); }
    }

    // FLOOR: pure bass world — motion here earns the way back up
    if (descentState === 'floor') {
      if (!isSilent) floorMotion += mag * dt;

      // DROP 2: fires at the midpoint — hits from a different angle
      if (!drop2Fired && floorMotion >= ASCENT_THRESHOLD * 0.45) {
        fireDropTwo();
      }

      if (floorMotion >= ASCENT_THRESHOLD) descentState = 'rising';
    }

    // RISING: bass fades, spectrum opens, music returns transformed
    if (descentState === 'rising') {
      descentMix = Math.max(0, descentMix - dt * RISE_RATE);
      if (descentMix <= 0.01) {
        descentMix = 0;
        descentState = 'off';
        try { Audio.descentBass.stop(); descentBassLive = false; } catch (e) {}

        // ── GENERATION COMPLETE — epigenetic evolution ──────────────────
        generation++;
        epi.harmonyCarry  = melodicCentroid;           // memory carries through
        epi.rootDrift     += 2;                        // climb a whole step each gen
        epi.spaceMix      = Math.min(0.40, generation * 0.10); // room grows
        epi.massiveFloor  = Math.min(3, generation);   // next gen starts pre-built
        epi.energyGate    = 24 + generation * 8;       // harder to earn each time

        // Apply root drift immediately
        rootSemiTarget += 2;

        // Restore melodic memory from before the floor
        melodicCentroid = epi.harmonyCarry;

        // Start massivePhase at floor (already earned those voices)
        try { Audio.setMassivePhase(epi.massiveFloor); } catch(e) {}

        // Space opens: push reverb mix wider
        try { Audio.setReverbMix(
          ((lens.space && lens.space.reverbMix) || 0.25) + epi.spaceMix
        ); } catch(e) {}

        // Reset energy accumulator for next generation
        sessionEnergyAccum = 0;
        return;
      }
    }

    // Drive the bass: frequency, filter, volume — all respond to motion and tilt
    if (descentBassLive) {
      var ascentProg = descentState === 'floor'  ? Math.min(1, floorMotion / ASCENT_THRESHOLD)
                     : descentState === 'rising' ? 1.0 : 0;
      // Bass pitch: starts at deep sub (root/8 ≈ 54Hz), rises a tritone as ascent builds
      // Tilt adds ±quarter-tone wobble — your body is still the instrument
      var baseHz   = root / 8;
      var bassFreq = baseHz * Math.pow(2, ascentProg * 0.5 + (gamma / 90) * 0.25);
      // Volume: scales with descentMix, swells with motion
      var bassVol  = descentMix * (0.48 + mag * 0.30);
      // Filter: starts sealed (pure sine = 80s analog weight), opens with ascent
      var bassFilter = 140 + ascentProg * 580 + mag * 230;
      try { Audio.descentBass.update(bassVol, bassFilter, bassFreq); } catch (e) {}
    }
  }

  // ── RAPID OSCILLATION (TREMOLO) ───────────────────────────────────────
  // C's back-and-forth: 5+ peaks in 1.2 seconds = intentional tremolo gesture.
  // The instrument answers with a trill and acknowledges the discovery.

  function updateRapidOscillation(now, dt) {
    // Clean old entries
    var cutoff = now - TREMOLO_WINDOW;
    while (rapidPeakTimes.length > 0 && rapidPeakTimes[0] < cutoff) rapidPeakTimes.shift();

    if (rapidPeakTimes.length >= TREMOLO_MIN) {
      if (!tremoloState) {
        tremoloState = true;
        // Discovery voice — first time only
        if (!sessionDiscoveries.tremolo && typeof Voice !== 'undefined') {
          sessionDiscoveries.tremolo = true;
          Voice.onDiscovery('tremolo');
        }
        // Fire a trill — rapid alternating notes answering the gesture
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
  // beta > 145: phone is clearly inverted. First time = discovery.
  // Inverted: tilt mapping flips. Low becomes high. High becomes low.
  // The instrument reflects your inversion back at you.

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
    return invertedDuration > 0.5; // true when meaningfully inverted
  }

  // ── GOLDILOCKS DRUM ENGINE ────────────────────────────────────────────
  // The user's body IS the clock. But bodies aren't metronomes.
  // Goldilocks: when a user peak falls within 'snap' steps of a DNA hot zone,
  // quantize it to that zone and fire. Off-beat → ghost or silence.
  // Half-time feel: snare only on beat 3 (step 8). Heavy. Slow. Godlike.

  function updateBarPhase(now) {
    if (!tempoLocked || lockedInterval <= 0) {
      barPhase = 0; barOrigin = 0; barCount = 0; lastBarStep = -1;
      return;
    }
    if (barOrigin === 0) {
      // Align bar origin to the most recent user peak — musically grounded
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
    // Find the nearest kick or snare hot zone in the 16-step pattern.
    var nearest = null, nearestDist = STEP_COUNT;
    for (var i = 0; i < STEP_COUNT; i++) {
      var kv = dna.kick[i] || 0;
      var sv = dna.snare[i] || 0;
      if (kv < 0.08 && sv < 0.08) continue;
      var dist = Math.abs(i - currentStep);
      dist = Math.min(dist, STEP_COUNT - dist); // wrap around bar boundary
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = { step: i, vel: Math.max(kv, sv), type: kv >= sv ? 'kick' : 'snare' };
      }
    }
    return { nearest: nearest, dist: nearestDist };
  }

  function fireGoldilocks(magnitude, now, vel, mods) {
    if (!lens || !Audio.ctx || isSilent) return;
    var dna = getGrooveDNA();
    var kit = (lens.groove && lens.groove.kit) || dna.kit || 'acoustic';
    var time = Audio.ctx.currentTime;

    // barDivisor: Tundra only fires every 4 bars (heartbeat, not metronome)
    if (dna.barDivisor && (barCount % dna.barDivisor) !== 0) return;

    // sparse: only respond to genuinely strong peaks
    if (dna.sparse && vel < 0.45) return;

    // drumVel is NOT multiplied by fadeGain — master gain already handles that.
    // Double-attenuation was the bug: kv ended up 0.12 and failed the threshold.
    var drumVel = vel * (mods.drumBoost || 1.0);

    var currentStep = Math.floor(barPhase * STEP_COUNT);
    var sync = goldilocksSync(currentStep, dna);
    var snapTol = tempoLocked ? (dna.snap || 2) : 3; // more forgiving pre-lock

    // Humanizing drunk offset (Dilla feel for Blue Hour)
    var drunkS = dna.feel > 0 ? (Math.random() - 0.5) * dna.feel * lockedInterval * 0.5 / 1000 : 0;
    var drumTime = time + Math.max(-0.005, drunkS);

    if (sync.nearest && sync.dist <= snapTol) {
      // ── SNAP ZONE: user peaked near a hot beat — quantized hit ──
      var nearest = sync.nearest;

      if (nearest.type === 'kick') {
        var kv = nearest.vel * drumVel;
        // Half-time: kick can't fire faster than ~1.6 beats apart
        var minKickGap = lockedInterval * (dna.halftime ? 1.6 : 0.85);
        if (kv > 0.08 && now - lastKickTime > minKickGap) {
          Audio.drum.kick(drumTime, Math.min(0.9, kv), kit);
          lastKickTime = now;
          grooveRecord("kick", { vel: kv, kit: kit });
          // Dark Matter broken: random double kick
          if (lens.groove && lens.groove.broken && Math.random() < (lens.groove.doubleRate || 0)) {
            Audio.drum.kick(drumTime + 0.08, kv * 0.45, kit);
          }
        }
      } else if (nearest.type === 'snare') {
        var sv = nearest.vel * drumVel * 0.85;
        // Half-time: snare only fires once per ~3.2 beats minimum
        var minSnareGap = lockedInterval * (dna.halftime ? 3.2 : 1.6);
        if (sv > 0.06 && now - lastSnareTime > minSnareGap) {
          // Dark Matter broken: random drop
          var dropped = lens.groove && lens.groove.broken && Math.random() < (lens.groove.dropRate || 0);
          if (!dropped) {
            Audio.drum.snare(drumTime, Math.min(0.85, sv), kit);
            lastSnareTime = now;
            grooveRecord("snare", { vel: sv, kit: kit });
          }
        }
      }

      // Ghost snare from lens groove config (Dilla whisper)
      var grvGhosts = lens.groove && lens.groove.ghosts;
      if (grvGhosts && Math.random() < grvGhosts && drumVel > 0.15) {
        Audio.drum.snare(time + 0.04, drumVel * 0.08, kit);
      }

    } else if (sync.nearest && sync.dist <= snapTol + 2 && !dna.sparse) {
      // ── POLYRHYTHM ZONE: close but off-beat — ghost hat acknowledges it ──
      if (drumVel > 0.15 && now - lastHatTime >= 80) {
        lastHatTime = now;
        Audio.drum.hat(time, drumVel * 0.10, kit);
      }
    }
    // Far from grid: body movement is melody here, not drums. Silence is right.
  }

  // ── AUTONOMOUS HAT GRID ───────────────────────────────────────────────
  // Hats fire from bar phase position, not from user peaks.
  // This replaces the three subdivision systems (user-sub, grid-sub, momentum-sub)
  // with a single DNA-driven source of truth.

  function processGrooveHats(now) {
    if (!tempoLocked || isSilent || sessionPhase < 2 || !lens || !Audio.ctx) return;
    if (!lens.groove) return;  // groove:null = no autonomous drums
    if (descentMix > 0.55) return; // bass world — hats belong to silence now
    var dna = getGrooveDNA();
    if (!dna.hat) return;

    var currentStep = Math.floor(barPhase * STEP_COUNT);
    if (currentStep === lastBarStep) return; // step hasn't changed this frame
    lastBarStep = currentStep;

    var hatVel = dna.hat[currentStep] || 0;
    if (hatVel < 0.04) return;

    // Drunk offset
    var drunkS = dna.feel > 0 ? (Math.random() - 0.5) * dna.feel * lockedInterval * 0.25 / 1000 : 0;
    var hatTime = Audio.ctx.currentTime + Math.max(0, drunkS);

    var kit = (lens.groove && lens.groove.kit) || dna.kit || 'acoustic';
    var mods = archetypeModifiers();
    var vel = hatVel * fadeGain * (mods.subdivBoost || 1.0) * 0.55 * (1 - descentMix * 0.8);

    if (vel > 0.025 && now - lastHatTime >= 35) {
      lastHatTime = now;
      Audio.drum.hat(hatTime, vel, kit);
      grooveRecord("hat", { vel: vel, kit: kit });
    }
  }

  // ── AUTONOMOUS KICK + SNARE (DNA-driven, same as hats) ────────────────
  // Hats had this — kick and snare were silent unless user peaked. Fixed.

  function processGrooveKickSnare(now) {
    if (!tempoLocked || isSilent || sessionPhase < 2 || !lens || !Audio.ctx) return;
    if (!lens.groove) return;  // groove:null = no autonomous drums
    if (descentMix > 0.55) return;

    var dna = getGrooveDNA();
    var currentStep = Math.floor(barPhase * STEP_COUNT);
    var kit  = (lens.groove && lens.groove.kit) || dna.kit || 'acoustic';
    var mods = archetypeModifiers();
    var time = Audio.ctx.currentTime;

    // KICK
    if (currentStep !== lastKickStep) {
      lastKickStep = currentStep;
      var kv = dna.kick[currentStep] || 0;
      if (kv >= 0.08 && now - lastKickTime > 80) {
        lastKickTime = now;
        var kVel = kv * fadeGain * (mods.drumBoost || 1.0) * Math.min(1, lockStrength + 0.4);
        if (kVel > 0.04) Audio.drum.kick(time, kVel, kit);
      }
    }

    // SNARE
    if (currentStep !== lastSnareStep) {
      lastSnareStep = currentStep;
      var sv = dna.snare[currentStep] || 0;
      if (sv >= 0.08 && now - lastSnareTime > 80) {
        lastSnareTime = now;
        var sVel = sv * fadeGain * (mods.drumBoost || 1.0) * Math.min(1, lockStrength + 0.4);
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
    momentumActive = false;
    phraseActive = false;
    archetype = 'exploring';
    archetypeConfidence = 0;
    sessionEngagedTime = 0;
    sessionPhase = 0;
  }

  // ── HARMONIC ARC UPDATE ───────────────────────────────────────────────

  function updateHarmonicArc(dt) {
    if (sessionPhase < 2) return; // arc only after music is properly established

    // Advance journey step when user has played enough (earned through movement)
    var nextThreshold = (arcStep + 1) * ARC_STEP_ENERGY;
    if (arcStep < ARC_JOURNEY.length - 1 && sessionEnergyAccum >= nextThreshold) {
      arcStep++;
      rootSemiTarget = ARC_JOURNEY[arcStep];
    }

    // Smooth glide — takes ~15s to fully complete a key shift (imperceptible jump, felt as drift)
    rootSemiOffset += (rootSemiTarget - rootSemiOffset) * dt * 0.06;

    // Apply to root — all scaleFreq() calls pick this up automatically
    root = originalRoot * Math.pow(2, rootSemiOffset / 12);
  }

  // ── CONFIGURE (apply lens) ────────────────────────────────────────────

  function applyLens(lensConfig) {
    lens = lensConfig;
    if (!lens) return;

    originalRoot   = (lens.harmony && lens.harmony.root) || 432;
    root           = originalRoot;
    scale          = MODES[(lens.harmony && lens.harmony.mode) || 'major'] || MODES.major;
    rootSemiOffset = 0;
    rootSemiTarget = 0;
    arcStep        = 0;

    // Kill existing layers for fresh start
    if (droneLayer) { Audio.layer.destroy('follow-drone'); droneLayer = null; droneActive = false; }

    active = true;
    isSilent = true;
    fadeGain = 0;
    stillnessTimer = 0;
    tempoLocked = false;
    lockStrength = 0;
    momentumActive = false;
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
    descentState = 'off';
    descentMix = 0;
    floorMotion = 0;
    generation = 0;
    epi.rootDrift = 0; epi.spaceMix = 0; epi.massiveFloor = 0;
    epi.energyGate = 24; epi.harmonyCarry = 0;
    try { Audio.setMassivePhase(0); } catch(e) {}
    descentBassLive = false;
    compressionBeatCount = 0;
    compressionNextBeat  = 0;
    drop2Fired = false;
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
    lastHatTime = 0;
    barPhase    = 0;
    barOrigin   = 0;
    barCount    = 0;
    lastBarStep = -1;
    lastKickTime  = 0;
    lastSnareTime = 0;
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
        // Outlier rejection: if we have a running average and this interval
        // is >70% off it, skip it — stray movements shouldn't kill confidence
        var skip = false;
        if (piLen >= 2) {
          var runSum = 0;
          for (var j = 0; j < piLen; j++) runSum += peakIntervals[j];
          var runAvg = runSum / piLen;
          if (Math.abs(interval - runAvg) / runAvg > 0.70) skip = true;
        }

        if (!skip) {
          peakIntervals[piHead] = interval;
          piHead = (piHead + 1) & 7;   // buffer size 8 — recent data dominates
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
          rhythmConfidence = Math.max(0, Math.min(1, 1 - cv * 2.5));
        }
      }
    }
    lastPeakTime = now;
    peakCount++;
  }

  // ── BODY PEAK → MUSICAL EVENT ─────────────────────────────────────────
  // Modified by phrase position and archetype.

  function onPeak(magnitude, now) {
    if (!lens || !Audio.ctx) return;
    // Always track peak times for tremolo detection regardless of phase
    rapidPeakTimes.push(now);
    // Phase 0: peaks are silent — the body moves but only tilt melody speaks
    if (sessionPhase === 0) return;

    try {
      var time = Audio.ctx.currentTime;
      var vel = Math.min(1, magnitude / 4);
      var palette = lens.palette || {};
      var mods = archetypeModifiers();

      // Phrase intensity and descent mix shape the response
      vel *= phraseIntensityFactor * (1 - descentMix * 0.94);

      // ── 1. RHYTHMIC HIT (phase 1+) ──
      if (palette.peak) {
        var p = palette.peak;
        var freq = scaleFreq(harmonyDegree, p.octave || -1);
        var peakVel = vel * 0.7 * mods.peakVoiceBoost * (sessionPhase === 1 ? 0.55 : 1.0);
        Audio.synth.play(p.voice || 'sub808', time, freq, peakVel, p.decay || 0.8);
        noteCount++;
      }

      // ── 2. GOLDILOCKS HALF-TIME GROOVE (phase 2 only) ──
      // Body peaks near a DNA hot beat → quantized hit.
      // Off-beat → ghost or silence. Hats are autonomous (processGrooveHats).
      // All 6 lenses now have drum DNA — no more groove:null dead ends.
      if (sessionPhase >= 2 && vel > 0.08) {
        fireGoldilocks(magnitude, now, vel, mods);
      }

      // ── 3. SUBDIVISIONS (phase 2 only) ──
      if (palette.subdivision && rhythmConfidence > 0.3 && piLen >= 3 && sessionPhase >= 2) {
        scheduleSubdivisions(now, vel * mods.subdivBoost, time);
      }

      // ── 4. HARMONIC NOTE (phase 1+, delayed — it answers, doesn't layer) ──
      if (palette.harmonic && vel > 0.42 && sessionPhase >= 1) {
        var h = palette.harmonic;
        var chordTone = phraseEnergyArc > 0.3 && phraseEnergyArc < 0.8 ? 4 : 2;
        var deg = harmonyDegree + chordTone;
        var freq = scaleFreq(deg, h.octave || 0);
        // 320ms after the peak — the harmonic responds, not competes
        Audio.synth.play(h.voice || 'epiano', time + 0.32, freq, vel * 0.25, h.decay || 1.0);
        noteCount++;
      }

      // ── 5. PHRASE TRACKING ──
      phrasePeakCount++;
      if (magnitude > phraseMaxMag) phraseMaxMag = magnitude;

      // Kill momentum if user is back
      if (momentumActive) {
        momentumActive = false;
      }

      // Confirm grid position for tempo lock
      if (tempoLocked) {
        lastUserPeakOnGrid = now;
        // Nudge grid toward user's actual peak timing
        var gridError = (now - nextGridBeat + lockedInterval) % lockedInterval;
        if (gridError > lockedInterval / 2) gridError -= lockedInterval;
        nextGridBeat += gridError * 0.2; // gentle correction
      }

    } catch (e) {
      errorCount++;
    }
  }

  // ── SUBDIVISIONS ──────────────────────────────────────────────────────

  function scheduleSubdivisions(peakNow, vel, audioTime) {
    if (!lens || piLen < 3) return;

    subdivEvents = [];

    var sum = 0;
    for (var i = 0; i < piLen; i++) sum += peakIntervals[i];
    var interval = sum / piLen;

    var sub = lens.palette.subdivision;
    var divisions = sub.divisions || 2;
    var subInterval = interval / divisions;

    for (var d = 1; d < divisions; d++) {
      var eventTime = peakNow + d * subInterval;
      subdivEvents.push({
        time: eventTime,
        audioTime: audioTime + (d * subInterval / 1000),
        vel: vel * (sub.vel || 0.3),
        voice: sub.voice || 'hat',
        kit: sub.kit || 'acoustic',
        fired: false,
      });
    }
  }

  function processSubdivisions(now) {
    for (var i = 0; i < subdivEvents.length; i++) {
      var ev = subdivEvents[i];
      if (ev.fired) continue;
      if (now >= ev.time) {
        ev.fired = true;
        try {
          if (ev.voice === 'hat') {
            // Hat is now handled by processGrooveHats (DNA-driven, phase-locked)
            // Skip hat subdivisions here to prevent fighting with the grid.
          } else if (ev.voice === 'ride') {
            Audio.drum.ride(Audio.ctx.currentTime, ev.vel);
          } else {
            var freq = scaleFreq(harmonyDegree, 1);
            Audio.synth.play(ev.voice, Audio.ctx.currentTime, freq, ev.vel, 0.3);
          }
        } catch (e) { errorCount++; }
      }
    }
  }

  // ── TILT → PITCH ──────────────────────────────────────────────────────
  // Modified by archetype: waving = MORE melodic, walking = less

  function updateTiltPitch(sensor, now) {
    if (!lens || !Audio.ctx) return;

    var tiltRange = (lens.response && lens.response.tiltRange) || 50;
    var melodicDriver = (lens.motion && lens.motion.melodic) || "beta";
    var tiltVal;
    if (melodicDriver === "gamma") {
      tiltVal = (sensor.gamma || 0);
    } else if (melodicDriver === "speed") {
      // Pocket Drummer: movement speed = pitch (faster = higher)
      var spd = Math.sqrt(Math.pow(Brain.linearAccel.x||0,2) + Math.pow(Brain.linearAccel.y||0,2));
      tiltVal = Math.min(45, spd * 20) - 22; // center around 0
    } else {
      tiltVal = (sensor.beta || 45) - 45; // default: beta centered
    }

    var tiltOffset = tiltVal / (tiltRange / 2);
    // Inversion: phone upside down flips the pitch mapping — high becomes low
    if (wasInverted) tiltOffset = -tiltOffset;
    var tiltDegree = Math.round(tiltOffset * 7);

    // Vertical arc degree: maps the arm-swing arc to scale degrees.
    // The arc peak = top of phrase range. Valley = bottom. The journey = melody.
    // Normalize by actual swing amplitude so small or large arcs both use full range.
    var arcRange = Math.max(0.25, arcAmplitude);
    var vertNorm = Math.max(-1, Math.min(1, vertPosition / arcRange));
    var vertDegree = Math.round(vertNorm * 5);

    // Blend: more vertical when the user is actively swinging (arc detected),
    // more tilt when movement is subtle. Both are always present.
    var arcWeight = Math.min(0.65, arcAmplitude * 0.9);
    targetDegree = Math.round(vertDegree * arcWeight + tiltDegree * (1 - arcWeight));

    // Harmonic arc: phase 0 = consonant only (root/3rd/5th), opens up with each phase
    var degreeLimit = sessionPhase === 0 ? 3 : sessionPhase === 1 ? 5 : 10;
    if (targetDegree > degreeLimit) targetDegree = degreeLimit;
    if (targetDegree < -degreeLimit) targetDegree = -degreeLimit;

    // Step limit adapts to lens tempo: fast = tight steps, slow = freer leaps
    var noteIntervalMs = (lens.response && lens.response.noteInterval) || 320;
    var maxJump = Math.min(7, Math.max(1, Math.round(noteIntervalMs / 180)));
    var stepped = Math.max(currentDegree - maxJump, Math.min(currentDegree + maxJump, targetDegree));

    // Harmonic gravity: high tension pulls toward tonic or dominant
    var gravitated = gravitateDegree(stepped);

    if (gravitated !== currentDegree && !isSilent && fadeGain > 0.3 && !phraseBreathing) {
      var mods = archetypeModifiers();
      var baseInterval = (lens.response && lens.response.noteInterval) || 120;
      // Dynamic interval: fast movement → denser notes, slow movement → sparser
      var speed = (typeof Brain !== 'undefined') ? Brain.short.energy() : 0.5;
      var speedMult = 1 + (1 - Math.min(1, speed / 2.5)) * 1.2; // slow=2.2x, fast=1.0x
      var minInterval = baseInterval * speedMult / mods.melodyRate;
      var timeSinceNote = now - lastNoteTime;

      if (timeSinceNote > minInterval) {
        currentDegree = gravitated;
        recordNote(currentDegree);
        posMemRecord(vertPosition, currentDegree); // build the invisible keyboard
        lastNoteTime = now;

        var cont = lens.palette && lens.palette.continuous;
        if (cont) {
          var freq = scaleFreq(currentDegree, cont.octave || 0);
          var vel = (0.2 + fadeGain * 0.3) * phraseIntensityFactor * (1 - descentMix * 0.94) * (cont.velBoost || 1.0);

          // Dynamic decay: fast movement = staccato, slow movement = legato
          // sustained:true bypasses shortening — the voice is a wall, not a pluck
          var speed = (typeof Brain !== 'undefined') ? Brain.short.energy() : 0.5;
          var speedNorm = Math.min(1, speed / 2.5);          // 0=still, 1=fast
          var dynamicDecay = cont.sustained
            ? (cont.decay || 0.8)
            : (cont.decay || 0.8) * (1 - speedNorm * 0.55); // fast → 45% shorter

          try {
            Audio.synth.play(cont.voice || 'epiano', Audio.ctx.currentTime, freq, vel, dynamicDecay);
            noteCount++;
            grooveRecord("note", { voice: cont.voice || "epiano", freq: freq, vel: vel, decay: dynamicDecay });
            if (typeof Pattern !== 'undefined') Pattern.onNote(currentDegree);
          } catch (e) { errorCount++; }
        }
      }
    }
  }

  // ── VERTICAL ARC ENGINE ───────────────────────────────────────────────

  function updateVertical(sensor, dt) {
    // Extract world-up direction from gravity vector
    var gx = sensor.gx || 0, gy = sensor.gy || 0, gz = sensor.gz || 0;
    var gMag = Math.sqrt(gx*gx + gy*gy + gz*gz);
    if (gMag < 0.5) return;
    var upX = -gx/gMag, upY = -gy/gMag, upZ = -gz/gMag;

    // Project linear accel (no gravity) onto world-up = true vertical acceleration
    var ax = sensor.ax || 0, ay = sensor.ay || 0, az = sensor.az || 0;
    var va = ax*upX + ay*upY + az*upZ;
    if (Math.abs(va) < 0.35) va = 0; // dead zone

    // Leaky integration: accel → velocity → position
    vertVelocity = vertVelocity * 0.88 + va * dt;
    vertPosition = Math.max(-2, Math.min(2, vertPosition * 0.97 + vertVelocity * dt));

    // Arc phase: detect peaks (rising→falling) and valleys (falling→rising)
    var newPhase = vertVelocity > 0.07 ? 1 : vertVelocity < -0.07 ? -1 : vertPhase;
    if (newPhase !== 0 && newPhase !== vertPhase) {
      if (newPhase === -1) arcPeak   = vertPosition; // topped out
      else                 arcValley = vertPosition; // bottomed out
      // Adapt amplitude to the user's actual swing size
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
      // Reinforce — blend toward new note so user can refine over time
      m.degree = Math.round(m.degree * 0.7 + degree * 0.3);
      m.count++;
    } else {
      if (posMemory.length >= POS_MAX) {
        // Evict least-visited
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
    if (Math.abs(vertVelocity) < 0.05) return; // not moving toward anything
    var cont = lens.palette && lens.palette.continuous;
    if (!cont) return;
    for (var i = 0; i < posMemory.length; i++) {
      var m = posMemory[i];
      if (m.count < 2) continue; // only established positions
      var dist = Math.abs(m.pos - vertPosition);
      // Moving toward this position?
      var movingToward = (m.pos - vertPosition) * vertVelocity > 0;
      if (movingToward && dist < 0.30 && dist > 0.05) {
        // Whisper the note — soft, brief, like a suggestion
        var whisperVel = fadeGain * 0.08 * (1 - dist / 0.30);
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

  // ── ENERGY → DENSITY ──────────────────────────────────────────────────

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

  // ── DRONE ─────────────────────────────────────────────────────────────

  function manageDrone(dt) {
    if (!lens || !Audio.ctx) return;

    var tex = lens.palette && lens.palette.texture;
    if (!tex) return;

    var targetGain = isSilent ? 0 : fadeGain * (tex.vol || 0.15) * Math.min(1, densityLevel);

    if (targetGain > 0.01 && !droneActive) {
      var oscs = [];
      var chord = tex.chord || [0, 7];
      for (var i = 0; i < chord.length; i++) {
        var freq = scaleFreq(chord[i], tex.octave || -1);
        oscs.push({
          wave: tex.wave || 'sine',
          freq: freq,
          detune: (i > 0 ? (tex.detune || 8) : 0),
          gain: 0.15 / chord.length,
        });
      }
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

      // Start momentum when we first detect stillness (groove keeps going)
      if (stillnessTimer > 0.3 && stillnessTimer < 0.5 && !momentumActive && tempoLocked) {
        startMomentum(now);
      }

      if (stillnessTimer > timeout && !isSilent) {
        isSilent = true;

        if (lens.palette && lens.palette.continuous) {
          try {
            var freq = scaleFreq(0, (lens.palette.continuous.octave || 0));
            Audio.synth.play(
              lens.palette.continuous.voice || 'epiano',
              Audio.ctx.currentTime, freq, 0.25, 2.0
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
        momentumActive = false;

        if (lens.palette && lens.palette.continuous) {
          try {
            var freq = scaleFreq(0, (lens.palette.continuous.octave || 0));
            Audio.synth.play(
              lens.palette.continuous.voice || 'epiano',
              Audio.ctx.currentTime, freq, 0.15, 1.5
            );
            noteCount++;
          } catch (e) {}
        }
      }
      stillnessTimer = 0;

      if (!isSilent) {
        // Track engagement time and advance session phase
        sessionEngagedTime += dt;
        sessionPhase = sessionEngagedTime < PHASE_LISTENING ? 0
                     : sessionEngagedTime < PHASE_ALIVE     ? 1
                     : 2;

        // Grid's detuned-unison build: naked → octave+fifth → ±2 chorus → (drop = phase 4)
        if (descentState !== 'floor') {
          Audio.setMassivePhase(sessionPhase === 0 ? 0 : sessionPhase === 1 ? 1 : 3);
        }

        // Fade ceiling rises with each phase — music literally gets louder as you engage
        var fadeCeiling = sessionPhase === 0 ? 0.45 : sessionPhase === 1 ? 0.72 : 1.0;
        var targetFade = Math.min(fadeCeiling, mag / 2);
        fadeGain += (targetFade - fadeGain) * 0.05;
      }
    }
  }

  // ── THE VOID ──────────────────────────────────────────────────────────
  // Absolute stillness. The machine doesn't wait — it breathes.
  // Circle of fifths cycling (glacial, ~8s/chord) + cosmic wind + sub rumble.

  var VOID_FIFTHS   = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5]; // semitone offsets
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
    voidFifthMs  = VOID_FIFTH_MS * 0.6; // first chord at ~5s, not immediately
    voidFifthIdx = 0;
    voidAscend   = 0;

    // Cosmic wind: pink noise → narrow bandpass → heavy reverb
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
    // Three voices: root, perfect fifth, octave above root — below main register
    var freqRoot  = root * Math.pow(2, (semi - 12) / 12); // one octave below root
    var freqFifth = freqRoot * Math.pow(2, 7 / 12);        // perfect fifth
    var freqOct   = freqRoot * 2;                           // octave
    var voices = [freqRoot, freqFifth, freqOct];
    for (var i = 0; i < voices.length; i++) {
      (function (f, offset) {
        try { Audio.synth.play('epiano', time + offset, f, 0.06, 9.0); } catch (e) {}
      })(voices[i], i * 0.7);
    }
  }

  function updateVoid(vState, vDepth, breathPhase, dt) {
    if (!Audio.ctx) return;

    if (vState === 0) {        // PRESENT — return to life
      if (voidEngaged) exitVoid();
      return;
    }
    if (!voidEngaged) enterVoid();

    // Smooth depth
    voidSmooth += (vDepth - voidSmooth) * 0.03;

    // Sub rumble (auto-starts/stops inside based on depth)
    try { Audio.voidDrone.update(voidSmooth, breathPhase); } catch (e) {}

    // Cosmic wind: swell in as void deepens
    var windVol = Math.min(0.18, voidSmooth * 0.24);
    try { Audio.layer.setGain('void-wind', windVol, 4.0); } catch (e) {}

    // Bandpass sweep: breath + slow ascent for heavenly quality
    var sweepFreq = 500 + Math.sin(breathPhase) * 340 + voidAscend * 1600;
    try { Audio.layer.setFilter('void-wind', Math.max(150, sweepFreq), 1.8); } catch (e) {}

    // Circle of fifths — only when void is established
    if (voidSmooth > 0.32) {
      voidFifthMs += dt * 1000;
      if (voidFifthMs >= VOID_FIFTH_MS) {
        voidFifthMs = 0;
        playVoidChord();
        voidFifthIdx = (voidFifthIdx + 1) % VOID_FIFTHS.length;
      }
    }

    // TRANSCENDENT: filter slowly ascends — ascending/heavenly feeling
    if (vState >= 3) {
      voidAscend = Math.min(1.0, voidAscend + dt * 0.010);
    }
  }

  // ── TOUCH ─────────────────────────────────────────────────────────────

  function touch(x, y, vx, vy) {
    if (!lens || !Audio.ctx || !active) return;

    // ── Rate limit: one touch note per noteInterval ──
    var now = Date.now();
    var noteIntervalMs = (lens.response && lens.response.noteInterval) || 200;
    if (now - lastTouchNote < noteIntervalMs) return;

    var time = Audio.ctx.currentTime;
    var palette = lens.palette || {};
    var resp = palette.touch || palette.continuous || {};

    // ── Harmonic gravity: pull touch degree toward chord tones of current harmony ──
    var rawDegree = Math.round((1 - y) * 14) - 7;
    var chordOffsets = [0, 2, 4, 7, -3, -5];  // root, 3rd, 5th, 7th relative to harmonyDegree
    var nearest = rawDegree;
    var minDist = 99;
    for (var ci = 0; ci < chordOffsets.length; ci++) {
      for (var oct = -1; oct <= 1; oct++) {
        var candidate = harmonyDegree + chordOffsets[ci] + oct * 7;
        var d = Math.abs(rawDegree - candidate);
        if (d < minDist) { minDist = d; nearest = candidate; }
      }
    }
    // Snap to chord tone if within 2 scale steps; otherwise partial pull
    var degree = minDist <= 2 ? nearest : rawDegree + Math.round((nearest - rawDegree) * 0.4);
    var freq = scaleFreq(degree, resp.octave || 0);

    var speed = Math.sqrt(vx * vx + vy * vy);

    // ── Velocity headroom: touch backs off when motion is already loud ──
    var vel = Math.min(1, 0.3 + speed * 0.08);
    vel *= Math.max(0.3, 1 - energySmooth * 0.35);

    // ── Fresh touch onset: duck motion voices so touch becomes the lead ──
    var isFreshTouch = now - lastTouchNote > 400;
    if (isFreshTouch) touchDuck = 0.55;

    lastTouchNote = now;

    try {
      Audio.synth.play(resp.voice || 'epiano', time, freq, vel, resp.decay || 0.6);
      noteCount++;
      // Touch feeds the oracle: finger movement teaches Pattern what you like to play
      if (typeof Pattern !== 'undefined') Pattern.onNote(degree);
    } catch (e) { errorCount++; }

    if (isSilent) {
      isSilent = false;
      stillnessTimer = 0;
      fadeGain = 0.5;
    }
  }

  // ── MAIN UPDATE ───────────────────────────────────────────────────────

  function update(brainState, sensor, dt) {
    if (!active || !lens) return;

    var now = performance.now();
    var mag = getLensMag(brainState, sensor);

    pushAccel(mag);

    // ── Classify how you're moving ──
    classifyArchetype(brainState);

    // ── Gesture discovery: tremolo + inversion ──
    updateRapidOscillation(now, dt);
    updateInversion(sensor, dt);

    // ── Phrase tracking (groups peaks into musical ideas) ──
    updatePhrase(mag, now, dt);

    // ── Stillness → silence (or momentum) ──
    updateStillness(mag, dt, now);

    // ── Brain void override: Brain's multi-state void machine is more robust.
    //    When Brain confirms void (5s+ still), don't wait for Follow's own timer.
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

    // ── Tempo lock (catch the groove) ──
    updateTempoLock(now);

    // ── Bar phase (continuous 0–1 position within the 4-beat bar) ──
    updateBarPhase(now);

    // ── Grid beats (anticipated beats when locked) ──
    processGridBeats(now);
    processGridSubs(now);

    // ── Momentum (groove continues briefly when you pause) ──
    processMomentum(now);

    // ── User-triggered subdivisions (non-hat only — hats are autonomous) ──
    processSubdivisions(now);

    // ── Autonomous drum grid (DNA-driven, phase-locked to bar) ──
    processGrooveHats(now);
    processGrooveKickSnare(now);

    // ── Vertical arc tracking ──
    updateVertical(sensor, dt);

    // ── Tilt → pitch (blended with vertical arc) ──
    updateTiltPitch(sensor, now);

    // ── Anticipation — whisper notes the user is approaching ──
    checkAnticipation(now);

    // ── Gyro → filter ──
    updateGyroFilter(sensor);

    // ── Energy → density ──
    updateDensity(mag, dt);

    // ── Accumulate energy that earns the descent ──
    if (!isSilent && sessionPhase >= 2) sessionEnergyAccum += energySmooth * dt;

    // ── Harmonic arc — key drifts I→IV→V→I over the session ──
    updateHarmonicArc(dt);

    // ── Descent arc (earned, not timed) ──
    updateDescent(mag, sensor, dt);

    // ── Master gain ──
    // touchDuck briefly pulls motion voices back when finger first lands,
    // giving the touch voice space to breathe — recovers to 1.0 over ~0.5s
    touchDuck = Math.min(1.0, touchDuck + dt * 2.0);
    if (Audio.ctx) {
      // 0.62 instead of 0.8 — multiple voices summing was hitting the ceiling
      Audio.setMasterGain(0.62 * fadeGain * touchDuck);
    }

    // ── 8D Spatial — tilt biases, LFO sweeps, touch takes direct control ──
    try { Audio.spatial.update(sensor.gamma || 0, isSilent, sensor.touching); } catch (e) {}

    // ── The Void — absolute stillness turns into something beautiful ──
    updateVoid(
      brainState.voidState  || 0,
      brainState.voidDepth  || 0,
      brainState.breathPhase || 0,
      dt
    );

    // Groove crystallization — detect repeating patterns, lock as autonomous loop
    grooveUpdate(now);

    lastUpdateTime = now;
  }

  // ── SPIKE HANDLER ─────────────────────────────────────────────────────

  function onSpike(data) {
    if (!active || !lens || !Audio.ctx || isSilent || sessionPhase < 1) return;

    try {
      var time = Audio.ctx.currentTime;
      var palette = lens.palette || {};

      switch (data.neuron) {
        case 'shake':
          // Silenced — shaking is already expressed through tilt melody density
          // The burst was competing with (not adding to) the user's voice
          break;

        case 'sweep':
          // Silenced — directional movement already drives the tilt melody line
          // Adding a second sweep run on top was the main source of "run gimmick"
          break;

        case 'circle':
          // Silenced — rotation already modulates filter/spatial; arpeggio on top was redundant
          break;

        case 'toss':
          // Drums only — a throw is a physical statement, not a melodic one
          if (lens.groove) {
            Audio.drum.kick(time, 0.9, lens.groove.kit || 'acoustic');
            Audio.drum.snare(time + 0.01, 0.7, lens.groove.kit || 'acoustic');
          }
          break;

        case 'pendulum':
          if (palette.harmonic && data.rate > 1) {
            var freq = scaleFreq(harmonyDegree + 4, (palette.harmonic.octave || 0));
            Audio.synth.play(palette.harmonic.voice || 'epiano', time, 0.15, 0.5);
          }
          break;

        case 'rock':
          // harmonyDegree now follows melodicCentroid (player's played notes),
          // no longer gets a random +5 jump from rocking motion.
          break;
      }
    } catch (e) { errorCount++; }
  }

  // ── COMPRESSION TRIGGER (called by Pattern when groove is found) ──────

  function triggerCompression() {
    // Pattern detected "user found groove" (4 similar phrases).
    // If the musical constellation is also aligned, fire the descent arc.
    // This unifies two independent "drop" detectors into one dramatic arc.
    if (assessDropReadiness()) startCompression();
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
    get groovePlaying() { return groovePlaying; },
    get grooveStrength() { return grooveStrength; },
    get locked() { return tempoLocked; },
    get lockStr() { return lockStrength; },
    get archetype() { return archetype; },
    get phrase() { return phraseActive ? phraseEnergyArc.toFixed(2) : 'none'; },
    get momentum() { return momentumActive; },
    get phase() { return sessionPhase; },
    get sessionTime() { return Math.round(sessionEngagedTime); },
    get descent() { return descentState; },
    get descentEnergy() { return Math.round(sessionEnergyAccum); },
    scaleFreq: scaleFreq,  // exposed for pattern.js
    triggerCompression: triggerCompression,
    get melodicVocab() { return melodicHistory.slice(); },
  });
})();
