/**
 * FOLLOW — Music Follows The Body
 *
 * THIS IS MUSIC 2.0.
 *
 * There is NO clock. There are NO pre-written patterns.
 * Your body IS the composition.
 *
 * - Motion peaks → rhythm (your walk IS the beat)
 * - Tilt → pitch (your hand IS the melody)
 * - Stillness → silence (real silence, not quiet drone)
 * - Energy → density (more movement = more voices)
 * - Gyro → timbre (twist = filter expression)
 *
 * The music DANCES TO YOU. You don't dance to it.
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
  var derivedTempo = 0;       // BPM derived from YOUR body
  var rhythmConfidence = 0;   // 0-1: how periodic your motion is
  var lastMag = 0;
  var lastLastMag = 0;
  var peakCooldown = 0;

  // Continuous pitch voice (tilt → melody)
  var continuousLayer = null;
  var currentDegree = 0;
  var targetDegree = 0;
  var lastNoteTime = 0;
  var continuousActive = false;

  // Harmonic state
  var harmonyDegree = 0;      // current scale degree center
  var harmonyGlide = 0;

  // Energy / density
  var energySmooth = 0;
  var densityLevel = 0;       // 0-3: how many voices are active
  var densityTarget = 0;

  // Drone layer
  var droneLayer = null;
  var droneActive = false;
  var droneGain = 0;

  // Stillness → silence
  var stillnessTimer = 0;
  var isSilent = true;
  var fadeGain = 0;           // master envelope: 0 = silent, 1 = full
  var lastUpdateTime = 0;

  // Subdivision scheduling
  var subdivEvents = [];      // scheduled future events between peaks
  var lastSubdivPeak = 0;

  // Filter (expression from gyro)
  var filterFreq = 800;
  var filterTarget = 800;

  // Touch state
  var touchActive = false;
  var lastTouchX = 0;
  var lastTouchY = 0;

  // Stats for debug
  var peakCount = 0;
  var noteCount = 0;
  var errorCount = 0;

  // ── INIT ──────────────────────────────────────────────────────────────

  function init() {
    active = false;
    isSilent = true;
    fadeGain = 0;
    stillnessTimer = 0;
    peakCount = 0;
    noteCount = 0;
    errorCount = 0;
  }

  // ── CONFIGURE (apply lens) ────────────────────────────────────────────

  function applyLens(lensConfig) {
    lens = lensConfig;
    if (!lens) return;

    root = (lens.harmony && lens.harmony.root) || 432;
    scale = MODES[(lens.harmony && lens.harmony.mode) || 'major'] || MODES.major;

    // Kill existing layers for fresh start
    if (droneLayer) { Audio.layer.destroy('follow-drone'); droneLayer = null; droneActive = false; }
    if (continuousLayer) { Audio.layer.destroy('follow-cont'); continuousLayer = null; continuousActive = false; }

    active = true;
    isSilent = true;
    fadeGain = 0;
    stillnessTimer = 0;
  }

  // ── PEAK DETECTION ────────────────────────────────────────────────────
  // Find rhythmic impulses in the user's motion.
  // Each peak = their body "asked" for a musical event.

  function pushAccel(mag) {
    accelBuf[accelHead] = mag;
    accelHead = (accelHead + 1) & 63;
    if (accelLen < 64) accelLen++;
  }

  function detectPeak(mag, now) {
    // Simple peak: previous sample was higher than its neighbors
    // Plus cooldown to prevent double-triggers
    if (peakCooldown > 0) { peakCooldown--; return false; }

    var threshold = lens && lens.response ? (lens.response.peakThreshold || 1.5) : 1.5;

    if (lastMag > threshold && lastMag > lastLastMag && lastMag > mag) {
      // We have a peak at the previous sample
      peakCooldown = 8; // ~130ms at 60fps cooldown
      return true;
    }
    return false;
  }

  function recordPeakInterval(now) {
    if (lastPeakTime > 0) {
      var interval = now - lastPeakTime;
      if (interval > 150 && interval < 2000) { // between 30 and 400 BPM
        peakIntervals[piHead] = interval;
        piHead = (piHead + 1) & 15;
        if (piLen < 16) piLen++;

        // Derive tempo from average interval
        var sum = 0, count = 0;
        for (var i = 0; i < piLen; i++) {
          sum += peakIntervals[i];
          count++;
        }
        var avgInterval = sum / count;
        derivedTempo = 60000 / avgInterval;

        // Calculate periodicity (how regular are the peaks?)
        // Low variance relative to mean = high confidence
        var variance = 0;
        for (var i = 0; i < piLen; i++) {
          var diff = peakIntervals[i] - avgInterval;
          variance += diff * diff;
        }
        variance = Math.sqrt(variance / count);
        // Normalize: coefficient of variation < 0.15 = very rhythmic
        var cv = variance / avgInterval;
        rhythmConfidence = Math.max(0, Math.min(1, 1 - cv * 4));
      }
    }
    lastPeakTime = now;
    peakCount++;
  }

  // ── BODY PEAK → MUSICAL EVENT ─────────────────────────────────────────
  // This is the core of Music 2.0:
  // Your body moves → music responds. Not the other way around.

  function onPeak(magnitude, now) {
    if (!lens || !Audio.ctx) return;

    try {
      var time = Audio.ctx.currentTime;
      var vel = Math.min(1, magnitude / 12); // normalize to 0-1
      var palette = lens.palette || {};

      // ── 1. RHYTHMIC HIT (your step/bounce/gesture = the beat) ──
      if (palette.peak) {
        var p = palette.peak;
        var freq = scaleFreq(harmonyDegree, p.octave || -1);
        Audio.synth.play(p.voice || 'sub808', time, freq, vel * 0.7, p.decay || 0.8);
        noteCount++;
      }

      // ── 2. DRUM from your body ──
      if (palette.drum && vel > 0.3) {
        var d = palette.drum;
        var kit = d.kit || 'acoustic';
        // Kick on strong peaks, hat on weak peaks
        if (vel > 0.6) {
          Audio.drum.kick(time, vel * 0.8, kit);
        }
        // Snare on alternating strong peaks
        if (vel > 0.5 && peakCount % 2 === 0) {
          Audio.drum.snare(time, vel * 0.6, kit);
        }
        // Hat on every peak
        Audio.drum.hat(time, vel * 0.4, kit);
      }

      // ── 3. SUBDIVISIONS (fill between YOUR peaks, at YOUR tempo) ──
      if (palette.subdivision && rhythmConfidence > 0.4 && piLen >= 3) {
        scheduleSubdivisions(now, vel, time);
      }

      // ── 4. HARMONIC NOTE on peak ──
      if (palette.harmonic && vel > 0.4) {
        var h = palette.harmonic;
        var deg = harmonyDegree + (Math.random() > 0.5 ? 2 : 4); // 3rd or 5th above
        var freq = scaleFreq(deg, h.octave || 0);
        Audio.synth.play(h.voice || 'epiano', time + 0.02, freq, vel * 0.3, h.decay || 1.0);
        noteCount++;
      }

    } catch (e) {
      errorCount++;
    }
  }

  // ── SUBDIVISIONS ──────────────────────────────────────────────────────
  // When your motion is rhythmic, add musical texture BETWEEN your peaks
  // at YOUR tempo, not a pre-set BPM

  function scheduleSubdivisions(peakNow, vel, audioTime) {
    if (!lens || piLen < 3) return;

    // Clear old scheduled events
    subdivEvents = [];

    // Average interval between YOUR peaks
    var sum = 0;
    for (var i = 0; i < piLen; i++) sum += peakIntervals[i];
    var interval = sum / piLen;

    var sub = lens.palette.subdivision;
    var divisions = sub.divisions || 2; // default: eighth notes between your beats
    var subInterval = interval / divisions;

    // Schedule subdivision hits between now and the expected next peak
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
    lastSubdivPeak = peakNow;
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

  // ── TILT → PITCH (your hand IS the melody) ───────────────────────────
  // Not a filter sweep. Actual NOTES that follow your body.

  function updateTiltPitch(sensor, now) {
    if (!lens || !Audio.ctx) return;

    // Map tilt to scale degrees
    // beta: phone tilt forward/back (0=flat, 90=vertical)
    // We map ~30-80° range to scale degrees
    var tiltRange = (lens.response && lens.response.tiltRange) || 50;
    var beta = sensor.beta || 0;

    // Center around 45° (natural phone holding angle)
    var tiltOffset = (beta - 45) / (tiltRange / 2);
    // Map to scale degree range (±7 = one octave in 7-note scale)
    targetDegree = Math.round(tiltOffset * 7);

    // Only play a note when the degree CHANGES (not continuous spam)
    if (targetDegree !== currentDegree && !isSilent && fadeGain > 0.3) {
      var timeSinceNote = now - lastNoteTime;
      var minInterval = (lens.response && lens.response.noteInterval) || 120; // ms

      if (timeSinceNote > minInterval) {
        currentDegree = targetDegree;
        lastNoteTime = now;

        var cont = lens.palette && lens.palette.continuous;
        if (cont) {
          var freq = scaleFreq(currentDegree, cont.octave || 0);
          var vel = 0.2 + fadeGain * 0.3; // louder when more active
          try {
            Audio.synth.play(cont.voice || 'epiano', Audio.ctx.currentTime, freq, vel, cont.decay || 0.8);
            noteCount++;
          } catch (e) { errorCount++; }
        }
      }
    }
  }

  // ── GYRO → FILTER (twist = expression) ────────────────────────────────

  function updateGyroFilter(sensor) {
    if (!lens) return;

    // Gyro magnitude → filter openness
    var gyroMag = 0;
    if (sensor.hasOrientation) {
      var dbeta = Math.abs(sensor.beta - (sensor._prevBeta || sensor.beta));
      var dgamma = Math.abs(sensor.gamma - (sensor._prevGamma || sensor.gamma));
      gyroMag = dbeta + dgamma;
      sensor._prevBeta = sensor.beta;
      sensor._prevGamma = sensor.gamma;
    }

    var range = (lens.response && lens.response.filterRange) || [200, 2800];
    var norm = Math.min(1, gyroMag / 8); // 8 degrees/frame = fully open
    filterTarget = range[0] + norm * (range[1] - range[0]);
    filterFreq += (filterTarget - filterFreq) * 0.08;

    // Apply to drone layer
    if (droneLayer) {
      Audio.layer.setFilter('follow-drone', filterFreq, 0.05);
    }
  }

  // ── ENERGY → DENSITY ──────────────────────────────────────────────────
  // More movement = more voices. Less movement = fewer voices.

  function updateDensity(energy, dt) {
    energySmooth += (energy - energySmooth) * 0.03;

    // Map energy to density level
    var thresholds = (lens && lens.response && lens.response.densityThresholds) || [0.3, 1.0, 2.5];
    if (energySmooth < thresholds[0]) densityTarget = 0;
    else if (energySmooth < thresholds[1]) densityTarget = 1;
    else if (energySmooth < thresholds[2]) densityTarget = 2;
    else densityTarget = 3;

    // Smooth density transitions
    densityLevel += (densityTarget - densityLevel) * 0.02;

    // Manage drone layer based on density
    manageDrone(dt);
  }

  // ── DRONE (warm bed that breathes with you) ───────────────────────────

  function manageDrone(dt) {
    if (!lens || !Audio.ctx) return;

    var tex = lens.palette && lens.palette.texture;
    if (!tex) return;

    // Drone fades in when you're moving, fades with you
    var targetGain = isSilent ? 0 : fadeGain * (tex.vol || 0.15) * Math.min(1, densityLevel);

    if (targetGain > 0.01 && !droneActive) {
      // Build drone
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
  // When you stop, the music resolves and goes silent.
  // REAL silence. Not a quiet drone. SILENCE.

  function updateStillness(mag, dt, now) {
    var threshold = (lens && lens.response && lens.response.stillnessThreshold) || 0.2;
    var timeout = (lens && lens.response && lens.response.stillnessTimeout) || 2.0;
    var fadeTime = (lens && lens.response && lens.response.fadeTime) || 3.0;

    if (mag < threshold) {
      stillnessTimer += dt;

      if (stillnessTimer > timeout && !isSilent) {
        // Begin fade to silence
        isSilent = true;

        // Play a resolution note — the music "knows" you stopped
        if (lens.palette && lens.palette.continuous) {
          try {
            var freq = scaleFreq(0, (lens.palette.continuous.octave || 0));
            Audio.synth.play(
              lens.palette.continuous.voice || 'epiano',
              Audio.ctx.currentTime, freq, 0.25, 2.0
            );
          } catch (e) {}
        }
      }

      if (isSilent) {
        // Fade to zero
        fadeGain *= (1 - dt / fadeTime);
        if (fadeGain < 0.005) fadeGain = 0;
      }
    } else {
      // Movement detected
      if (isSilent && mag > threshold * 2) {
        // AWAKEN — music enters from silence
        isSilent = false;
        stillnessTimer = 0;

        // First note is gentle, inviting — "oh, you're here"
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

      // Fade IN when moving
      if (!isSilent) {
        var targetFade = Math.min(1, mag / 2);
        fadeGain += (targetFade - fadeGain) * 0.05;
      }
    }
  }

  // ── TOUCH (the screen IS an instrument too) ───────────────────────────

  function touch(x, y, vx, vy) {
    if (!lens || !Audio.ctx || !active) return;

    var time = Audio.ctx.currentTime;
    var palette = lens.palette || {};
    var resp = palette.touch || palette.continuous || {};

    // Map Y position to scale degree (top = high, bottom = low)
    var degree = Math.round((1 - y) * 14) - 7; // -7 to +7
    var freq = scaleFreq(degree, resp.octave || 0);

    // Velocity from touch speed + position
    var speed = Math.sqrt(vx * vx + vy * vy);
    var vel = Math.min(1, 0.3 + speed * 0.1);

    try {
      Audio.synth.play(resp.voice || 'epiano', time, freq, vel, resp.decay || 0.6);
      noteCount++;

      // Grace notes from fast movement
      if (speed > 3 && Math.random() > 0.5) {
        var graceFreq = scaleFreq(degree + (Math.random() > 0.5 ? 1 : -1), resp.octave || 0);
        Audio.synth.play(resp.voice || 'epiano', time + 0.03, graceFreq, vel * 0.4, 0.3);
      }
    } catch (e) { errorCount++; }

    // Touch also breaks silence
    if (isSilent) {
      isSilent = false;
      stillnessTimer = 0;
      fadeGain = 0.5;
    }
  }

  // ── MAIN UPDATE (called every frame from app.js) ──────────────────────
  // This is NOT a clock. It reads your body and responds.

  function update(brainState, sensor, dt) {
    if (!active || !lens) return;

    var now = performance.now();
    var mag = brainState.energy || 0;

    // ── Push to peak detection buffer ──
    pushAccel(mag);

    // ── Stillness check (silence when you stop) ──
    updateStillness(mag, dt, now);

    // ── Peak detection (your body's rhythm) ──
    if (detectPeak(mag, now)) {
      recordPeakInterval(now);
      onPeak(lastMag, now); // fire on the peak value
    }

    // Update magnitude history for peak detection
    lastLastMag = lastMag;
    lastMag = mag;

    // ── Process any scheduled subdivisions ──
    processSubdivisions(now);

    // ── Tilt → pitch (your hand is the melody) ──
    updateTiltPitch(sensor, now);

    // ── Gyro → filter (twist = expression) ──
    updateGyroFilter(sensor);

    // ── Energy → density (movement = more voices) ──
    updateDensity(mag, dt);

    // ── Master gain follows fade state ──
    if (Audio.ctx) {
      Audio.setMasterGain(0.8 * fadeGain);
    }

    lastUpdateTime = now;
  }

  // ── SPIKE HANDLER (from brain neurons) ────────────────────────────────
  // Brain's spiking neurons give us richer gesture info

  function onSpike(data) {
    if (!active || !lens || !Audio.ctx || isSilent) return;

    try {
      var time = Audio.ctx.currentTime;
      var palette = lens.palette || {};

      switch (data.neuron) {
        case 'shake':
          // Shake = burst of energy → rapid notes
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
          // Sweep = smooth arc → glissando
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
          // Circle motion = arpeggiated chord
          if (palette.harmonic) {
            var h = palette.harmonic;
            var arpDegrees = [0, 2, 4, 7]; // root, 3rd, 5th, octave
            for (var i = 0; i < arpDegrees.length; i++) {
              var freq = scaleFreq(harmonyDegree + arpDegrees[i], h.octave || 0);
              Audio.synth.play(h.voice || 'epiano', time + i * 0.08, freq, 0.25, 0.6);
            }
            noteCount += 4;
          }
          break;

        case 'toss':
          // Toss = dramatic peak → accent
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
          // Pendulum = regular back-and-forth → reinforce rhythm
          // Already handled by peak detection, but we can add color
          if (palette.harmonic && data.rate > 1) {
            var freq = scaleFreq(harmonyDegree + 4, (palette.harmonic.octave || 0));
            Audio.synth.play(palette.harmonic.voice || 'epiano', time, 0.15, 0.5);
          }
          break;

        case 'rock':
          // Gentle rocking = harmonic shift
          harmonyDegree = (harmonyDegree + 5) % scale.length; // move up a 4th
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

    // Debug info
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
  });
})();
