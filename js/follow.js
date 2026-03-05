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
    if (!tempoLocked || isSilent || !lens || !Audio.ctx) return;

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

      // Light kick on strong grid beats (every other)
      if (palette.drum && gridBeatCount % 2 === 0) {
        Audio.drum.kick(time, gridVel * 0.5, palette.drum.kit || 'acoustic');
      }
      // Hat on every grid beat
      if (palette.drum) {
        Audio.drum.hat(time, gridVel * 0.3, palette.drum.kit || 'acoustic');
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
    if (!momentumActive || isSilent || !lens || !Audio.ctx) return;

    if (now >= momentumNextBeat && momentumBeatsLeft > 0) {
      momentumBeatsLeft--;
      momentumVelocity *= momentumDecay;

      if (momentumVelocity > 0.03) {
        try {
          var time = Audio.ctx.currentTime;
          var palette = lens.palette || {};

          // Momentum keeps the rhythm alive with quiet hits
          if (palette.drum) {
            var kit = palette.drum.kit || 'acoustic';
            Audio.drum.hat(time, momentumVelocity * 0.5, kit);
            if (momentumBeatsLeft % 2 === 0) {
              Audio.drum.kick(time, momentumVelocity * 0.4, kit);
            }
          }

          // Subdivisions during momentum too
          if (palette.subdivision) {
            var sub = palette.subdivision;
            var divisions = sub.divisions || 2;
            for (var d = 1; d < divisions; d++) {
              var subTime = time + (d * momentumInterval / divisions / 1000);
              scheduleGridSub(now + d * momentumInterval / divisions, subTime, momentumVelocity * 0.2, sub.kit || 'acoustic');
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

    // Harmonic shift at phrase boundary — music breathes
    harmonyDegree = (harmonyDegree + 4) % scale.length; // up a 4th

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

    try {
      var time = Audio.ctx.currentTime;
      var vel = Math.min(1, magnitude / 12);
      var palette = lens.palette || {};
      var mods = archetypeModifiers();

      // Phrase intensity shapes the response
      vel *= phraseIntensityFactor;

      // ── 1. RHYTHMIC HIT ──
      if (palette.peak) {
        var p = palette.peak;
        var freq = scaleFreq(harmonyDegree, p.octave || -1);
        Audio.synth.play(p.voice || 'sub808', time, freq, vel * 0.7 * mods.peakVoiceBoost, p.decay || 0.8);
        noteCount++;
      }

      // ── 2. DRUMS (modified by archetype) ──
      if (palette.drum && vel > 0.2) {
        var d = palette.drum;
        var kit = d.kit || 'acoustic';
        var drumVel = vel * mods.drumBoost;

        if (drumVel > 0.5) {
          Audio.drum.kick(time, drumVel * 0.8, kit);
        }
        if (drumVel > 0.4 && peakCount % 2 === 0) {
          Audio.drum.snare(time, drumVel * 0.6, kit);
        }
        if (drumVel > 0.15) {
          Audio.drum.hat(time, drumVel * 0.4, kit);
        }
      }

      // ── 3. SUBDIVISIONS ──
      if (palette.subdivision && rhythmConfidence > 0.3 && piLen >= 3) {
        scheduleSubdivisions(now, vel * mods.subdivBoost, time);
      }

      // ── 4. HARMONIC NOTE (phrase-aware) ──
      if (palette.harmonic && vel > 0.35) {
        var h = palette.harmonic;
        // During phrase climax, add more harmonic color
        var chordTone = phraseEnergyArc > 0.3 && phraseEnergyArc < 0.8 ? 4 : 2;
        var deg = harmonyDegree + chordTone;
        var freq = scaleFreq(deg, h.octave || 0);
        Audio.synth.play(h.voice || 'epiano', time + 0.02, freq, vel * 0.3, h.decay || 1.0);
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
    var beta = sensor.beta || 0;

    var tiltOffset = (beta - 45) / (tiltRange / 2);
    targetDegree = Math.round(tiltOffset * 7);

    if (targetDegree !== currentDegree && !isSilent && fadeGain > 0.3) {
      var mods = archetypeModifiers();
      var minInterval = ((lens.response && lens.response.noteInterval) || 120) / mods.melodyRate;
      var timeSinceNote = now - lastNoteTime;

      if (timeSinceNote > minInterval) {
        currentDegree = targetDegree;
        lastNoteTime = now;

        var cont = lens.palette && lens.palette.continuous;
        if (cont) {
          var freq = scaleFreq(currentDegree, cont.octave || 0);
          var vel = (0.2 + fadeGain * 0.3) * phraseIntensityFactor;
          try {
            Audio.synth.play(cont.voice || 'epiano', Audio.ctx.currentTime, freq, vel, cont.decay || 0.8);
            noteCount++;
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
        var targetFade = Math.min(1, mag / 2);
        fadeGain += (targetFade - fadeGain) * 0.05;
      }
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
    var mag = brainState.energy || 0;

    pushAccel(mag);

    // ── Classify how you're moving ──
    classifyArchetype(brainState);

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

    // ── Master gain ──
    if (Audio.ctx) {
      Audio.setMasterGain(0.8 * fadeGain);
    }

    lastUpdateTime = now;
  }

  // ── SPIKE HANDLER ─────────────────────────────────────────────────────

  function onSpike(data) {
    if (!active || !lens || !Audio.ctx || isSilent) return;

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
          if (palette.drum) {
            Audio.drum.kick(time, 0.9, palette.drum.kit || 'acoustic');
            Audio.drum.snare(time + 0.01, 0.7, palette.drum.kit || 'acoustic');
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
    get locked() { return tempoLocked; },
    get lockStr() { return lockStrength; },
    get archetype() { return archetype; },
    get phrase() { return phraseActive ? phraseEnergyArc.toFixed(2) : 'none'; },
    get momentum() { return momentumActive; },
  });
})();
