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

  var root = 432;
  var scale = MODES.major;

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
  var peakIntervals = new Float32Array(16);
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
  var PHASE_ALIVE = 16;

  // ── DESCENT ARC ───────────────────────────────────────────────────────
  // The music earns its structural arc. Build enough energy and the world
  // collapses to pure sub-bass — then rebuilds as you keep moving.
  // Seeds, not script. The threshold is a CONSTELLATION of conditions, not a clock.
  var sessionEnergyAccum = 0;   // only accumulates at phase 2 — earns the event
  var descentState  = 'off';    // 'off' | 'compressing' | 'falling' | 'floor' | 'rising'
  var descentMix    = 0;        // 0=full music, 1=pure bass world
  var descentFired  = false;    // once per lens session
  var floorMotion   = 0;        // motion on the floor earns the ascent
  var ASCENT_THRESHOLD = 18;    // floor motion units before rebuild begins
  var descentBassLive = false;  // whether the bass layer is running

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
    if (piLen < 4) { tempoLocked = false; lockStrength = 0; return; }

    // Calculate average interval
    var sum = 0;
    for (var i = 0; i < piLen; i++) sum += peakIntervals[i];
    var avgInterval = sum / piLen;

    if (rhythmConfidence > 0.35) {
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

      // Light kick + hat on grid beats
      if (lens.groove) {
        var gKit = lens.groove.kit || 'acoustic';
        if (gridBeatCount % 2 === 0) {
          Audio.drum.kick(time, gridVel * 0.5, gKit);
        }
        Audio.drum.hat(time, gridVel * 0.3, gKit);
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
        try { Audio.drum.hat(Audio.ctx.currentTime, ev.vel, ev.kit); } catch (e) {}
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
    if (!tempoLocked || piLen < 4) return;
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

          // Subdivisions during momentum too
          if (palette.subdivision) {
            var sub = palette.subdivision;
            var divisions = sub.divisions || 2;
            var subKit = lens.groove ? lens.groove.kit : (sub.kit || 'acoustic');
            for (var d = 1; d < divisions; d++) {
              var subTime = time + (d * momentumInterval / divisions / 1000);
              scheduleGridSub(now + d * momentumInterval / divisions, subTime, momentumVelocity * 0.2, subKit);
            }
          }
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

    // Harmonic shift at phrase boundary — only when music is developed enough
    if (sessionPhase >= 1) {
      harmonyDegree = (harmonyDegree + 4) % scale.length; // up a 4th
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
    var time = Audio.ctx.currentTime;
    var vel = Math.min(1, (ev.data.vel || 0.3) * Math.min(1, fadeGain) * 0.72);
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
    if (descentFired || descentState !== 'off') return false;
    if (sessionPhase < 2) return false;
    if (isSilent) return false;
    if (rhythmConfidence < 0.35) return false;   // need a real pulse
    if (harmonicTension < 0.42) return false;    // need tension — somewhere to fall to
    if (sessionEnergyAccum < 24) return false;   // earned through play, not waiting
    if (energySmooth < 0.5) return false;        // drop fires at a peak, not a lull
    return true;
  }

  // ── COMPRESSION PHASE ─────────────────────────────────────────────────
  // Before the drop, the music compresses. Subdivisions double.
  // A creeping sub rises from below. The familiar voice fades.
  // The user feels something gathering.

  function startCompression() {
    if (descentFired || descentState !== 'off') return;
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
    if (descentFired || (descentState !== 'off' && descentState !== 'compressing') || !Audio.ctx || !lens) return;
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
    if (descentState === 'off' && !descentFired) {
      if (assessDropReadiness()) startCompression();
      return;
    }
    if (descentState === 'off') return;

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
      if (descentMix >= 0.99) { descentMix = 1; descentState = 'floor'; }
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
        descentFired = true;
        try { Audio.descentBass.stop(); descentBassLive = false; } catch (e) {}
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

  // ── CONFIGURE (apply lens) ────────────────────────────────────────────

  function applyLens(lensConfig) {
    lens = lensConfig;
    if (!lens) return;

    root = (lens.harmony && lens.harmony.root) || 432;
    scale = MODES[(lens.harmony && lens.harmony.mode) || 'major'] || MODES.major;

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
    sessionEnergyAccum = 0;
    descentState = 'off';
    descentMix = 0;
    descentFired = false;
    floorMotion = 0;
    descentBassLive = false;
    compressionBeatCount = 0;
    compressionNextBeat  = 0;
    drop2Fired = false;
    rapidPeakTimes = [];
    tremoloState = false;
    tremoloTimer = 0;
    invertedDuration = 0;
    wasInverted = false;
    sessionDiscoveries = {};
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
        peakIntervals[piHead] = interval;
        piHead = (piHead + 1) & 15;
        if (piLen < 16) piLen++;

        var sum = 0, count = 0;
        for (var i = 0; i < piLen; i++) {
          sum += peakIntervals[i];
          count++;
        }
        var avgInterval = sum / count;
        derivedTempo = 60000 / avgInterval;

        var variance = 0;
        for (var i = 0; i < piLen; i++) {
          var diff = peakIntervals[i] - avgInterval;
          variance += diff * diff;
        }
        variance = Math.sqrt(variance / count);
        var cv = variance / avgInterval;
        rhythmConfidence = Math.max(0, Math.min(1, 1 - cv * 4));
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

      // ── 2. DRUMS (phase 2 only) ──
      var groove = lens.groove;
      if (groove && vel > 0.2 && sessionPhase >= 2) {
        var kit = groove.kit || 'acoustic';
        var maxV = groove.maxVel || 1.0;
        var drumVel = Math.min(maxV, vel * mods.drumBoost);
        var mt = groove.microTiming || {};

        // Broken kit: random drop chance (Dark Matter)
        var dropped = groove.broken && Math.random() < (groove.dropRate || 0);
        if (!dropped) {
          // Chaos offset: ±50ms random smear for broken kits
          var chaosS = groove.broken ? (Math.random() - 0.5) * 0.10 : 0;
          var doubleHit = groove.broken && Math.random() < (groove.doubleRate || 0);

          if (drumVel > 0.25) {
            var kickT = time + (mt.kick || 0) / 1000 + chaosS;
            Audio.drum.kick(Math.max(time, kickT), drumVel * 0.8, kit);
            if (doubleHit) Audio.drum.kick(Math.max(time, kickT) + 0.08, drumVel * 0.45, kit);
            grooveRecord("kick", { vel: drumVel * 0.8, kit: kit });
          }
          // backbeat: snare only on 2 and 4 (even peaks)
          if (drumVel > 0.20 && (!groove.backbeat || peakCount % 2 === 0)) {
            var snareT = time + (mt.snare || 0) / 1000 + chaosS;
            Audio.drum.snare(Math.max(time, snareT), drumVel * 0.6, kit);
            grooveRecord("snare", { vel: drumVel * 0.6, kit: kit });
          }
          if (drumVel > 0.08) {
            var hatT = time + (mt.hat || 0) / 1000;
            Audio.drum.hat(Math.max(time, hatT), drumVel * 0.4, kit);
            grooveRecord("hat", { vel: drumVel * 0.4, kit: kit });
          }
          // Ghost snare — quiet upbeat whisper (Dilla feel)
          if ((groove.ghosts || 0) > 0 && Math.random() < groove.ghosts && drumVel > 0.2) {
            Audio.drum.snare(time + 0.04, drumVel * 0.10, kit);
          }
        }
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
            Audio.drum.hat(Audio.ctx.currentTime, ev.vel, ev.kit);
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
    targetDegree = Math.round(tiltOffset * 7);

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

    if (gravitated !== currentDegree && !isSilent && fadeGain > 0.3) {
      var mods = archetypeModifiers();
      var minInterval = ((lens.response && lens.response.noteInterval) || 120) / mods.melodyRate;
      var timeSinceNote = now - lastNoteTime;

      if (timeSinceNote > minInterval) {
        currentDegree = gravitated;
        recordNote(currentDegree);
        lastNoteTime = now;

        var cont = lens.palette && lens.palette.continuous;
        if (cont) {
          var freq = scaleFreq(currentDegree, cont.octave || 0);
          var vel = (0.2 + fadeGain * 0.3) * phraseIntensityFactor * (1 - descentMix * 0.94);
          try {
            Audio.synth.play(cont.voice || 'epiano', Audio.ctx.currentTime, freq, vel, cont.decay || 0.8);
            noteCount++;
            grooveRecord("note", { voice: cont.voice || "epiano", freq: freq, vel: vel, decay: cont.decay || 0.8 });
            if (typeof Pattern !== 'undefined') Pattern.onNote(currentDegree);
          } catch (e) { errorCount++; }
        }
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

    var time = Audio.ctx.currentTime;
    var palette = lens.palette || {};
    var resp = palette.touch || palette.continuous || {};

    var degree = Math.round((1 - y) * 14) - 7;
    var freq = scaleFreq(degree, resp.octave || 0);

    var speed = Math.sqrt(vx * vx + vy * vy);
    var vel = Math.min(1, 0.3 + speed * 0.1);

    try {
      Audio.synth.play(resp.voice || 'epiano', time, freq, vel, resp.decay || 0.6);
      noteCount++;

      if (speed > 3 && Math.random() > 0.5) {
        var graceFreq = scaleFreq(degree + (Math.random() > 0.5 ? 1 : -1), resp.octave || 0);
        Audio.synth.play(resp.voice || 'epiano', time + 0.03, graceFreq, vel * 0.4, 0.3);
      }
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

    // ── Peak detection ──
    if (detectPeak(mag, now)) {
      recordPeakInterval(now);
      onPeak(lastMag, now);
    }

    lastLastMag = lastMag;
    lastMag = mag;

    // ── Tempo lock (catch the groove) ──
    updateTempoLock(now);

    // ── Grid beats (anticipated beats when locked) ──
    processGridBeats(now);
    processGridSubs(now);

    // ── Momentum (groove continues briefly when you pause) ──
    processMomentum(now);

    // ── User-triggered subdivisions ──
    processSubdivisions(now);

    // ── Tilt → pitch ──
    updateTiltPitch(sensor, now);

    // ── Gyro → filter ──
    updateGyroFilter(sensor);

    // ── Energy → density ──
    updateDensity(mag, dt);

    // ── Accumulate energy that earns the descent ──
    if (!isSilent && sessionPhase >= 2) sessionEnergyAccum += energySmooth * dt;

    // ── Descent arc (earned, not timed) ──
    updateDescent(mag, sensor, dt);

    // ── Master gain ──
    if (Audio.ctx) {
      Audio.setMasterGain(0.8 * fadeGain);
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
          if (palette.burst) {
            var b = palette.burst;
            for (var i = 0; i < 3; i++) {
              var deg = harmonyDegree + Math.floor(Math.random() * 5);
              var freq = scaleFreq(deg, b.octave || 1);
              Audio.synth.play(b.voice || 'bell', time + i * 0.06, freq, 0.2, 0.4);
            }
            noteCount += 3;
          }
          break;

        case 'sweep':
          if (palette.continuous) {
            var c = palette.continuous;
            var startDeg = currentDegree;
            for (var i = 0; i < 4; i++) {
              var deg = startDeg + i;
              var freq = scaleFreq(deg, c.octave || 0);
              Audio.synth.play(c.voice || 'epiano', time + i * 0.1, freq, 0.2 - i * 0.04, 0.5);
            }
            noteCount += 4;
          }
          break;

        case 'circle':
          if (palette.harmonic) {
            var h = palette.harmonic;
            var arpDegrees = [0, 2, 4, 7];
            for (var i = 0; i < arpDegrees.length; i++) {
              var freq = scaleFreq(harmonyDegree + arpDegrees[i], h.octave || 0);
              Audio.synth.play(h.voice || 'epiano', time + i * 0.08, freq, 0.25, 0.6);
            }
            noteCount += 4;
          }
          break;

        case 'toss':
          if (lens.groove) {
            Audio.drum.kick(time, 0.9, lens.groove.kit || 'acoustic');
            Audio.drum.snare(time + 0.01, 0.7, lens.groove.kit || 'acoustic');
          }
          if (palette.peak) {
            var freq = scaleFreq(harmonyDegree, (palette.peak.octave || -1) + 1);
            Audio.synth.play(palette.peak.voice || 'sub808', time, 0.8, palette.peak.decay || 0.5);
          }
          break;

        case 'pendulum':
          if (palette.harmonic && data.rate > 1) {
            var freq = scaleFreq(harmonyDegree + 4, (palette.harmonic.octave || 0));
            Audio.synth.play(palette.harmonic.voice || 'epiano', time, 0.15, 0.5);
          }
          break;

        case 'rock':
          harmonyDegree = (harmonyDegree + 5) % scale.length;
          break;
      }
    } catch (e) { errorCount++; }
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
  });
})();
