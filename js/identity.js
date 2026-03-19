/**
 * IDENTITY — Your Musical Fingerprint
 *
 * Reads live state from Follow + Brain, packages ~40 numbers
 * that uniquely describe how you move and what music you make.
 * Updated every 2 seconds. Compact enough for WebRTC.
 * Rich enough to recognize someone.
 *
 * This is the seed of Outfits — people knowing you by how you
 * sound coming down the hall.
 */

const Identity = (function () {
  'use strict';

  var fingerprint = null;
  var updateInterval = null;
  var sessionId = null;
  var history = [];  // rolling window of recent fingerprints for stability

  function generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function snapshot() {
    if (typeof Follow === 'undefined' || typeof Brain === 'undefined') return null;

    var state = Follow.state ? Follow.state() : {};
    var energy = Brain.short ? Brain.short.energy() : 0;
    var medEnergy = Brain.medium ? Brain.medium.energy() : 0;

    // Normalize peakRhythm to 0-1 range
    var groove = new Array(16);
    var maxPeak = 0.001;
    if (state.peakRhythm) {
      for (var i = 0; i < 16; i++) {
        if (state.peakRhythm[i] > maxPeak) maxPeak = state.peakRhythm[i];
      }
      for (var j = 0; j < 16; j++) {
        groove[j] = +(state.peakRhythm[j] / maxPeak).toFixed(3);
      }
    } else {
      for (var k = 0; k < 16; k++) groove[k] = 0;
    }

    // Energy stats from prodigy history
    var eMean = 0, eVar = 0, eBursts = 0, eTotal = 0;
    if (state.energyHistory) {
      var hist = state.energyHistory;
      var n = hist.length;
      for (var ei = 0; ei < n; ei++) {
        eMean += hist[ei];
        if (hist[ei] > 0.5) eBursts++;
      }
      eMean = n > 0 ? eMean / n : 0;
      for (var vi = 0; vi < n; vi++) {
        eVar += Math.pow(hist[vi] - eMean, 2);
      }
      eVar = n > 0 ? eVar / n : 0;
      eTotal = n;
    }

    fingerprint = {
      sessionId: sessionId,
      timestamp: Date.now(),

      // Rhythm
      tempo: state.tempo || 0,
      groove: groove,
      rhythmConfidence: +(state.rhythmConfidence || 0).toFixed(3),

      // Character
      archetype: state.archetype || 'unknown',
      archetypeConfidence: +(state.archetypeConfidence || 0).toFixed(3),

      // Energy
      energy: {
        current: +energy.toFixed(3),
        mean: +eMean.toFixed(3),
        variance: +eVar.toFixed(4),
        burstRatio: eTotal > 0 ? +(eBursts / eTotal).toFixed(3) : 0,
      },

      // Harmony
      harmonic: {
        center: state.harmonyDegree || 0,
        heat: state.degreeHeat ? state.degreeHeat.map(function (h) {
          return +h.toFixed(3);
        }) : [],
      },

      // Space
      space: {
        stillnessRatio: state.engagedTime > 0
          ? +((state.stillnessTime || 0) / state.engagedTime).toFixed(3)
          : 0,
        voidState: Brain.voidState || 'active',
        voidDepth: +(Brain.voidDepth || 0).toFixed(3),
      },

      // Motion
      tilt: {
        center: +(state.tiltCenter || 0.5).toFixed(3),
        range: +(state.tiltRange || 0).toFixed(3),
      },
      pattern: Brain.pattern || 'unknown',
      totalMotion: +(Brain.totalMotion || 0).toFixed(1),
    };

    return fingerprint;
  }

  function start() {
    sessionId = generateSessionId();
    snapshot();  // initial
    updateInterval = setInterval(snapshot, 2000);
  }

  function stop() {
    if (updateInterval) { clearInterval(updateInterval); updateInterval = null; }
  }

  // Similarity: 0 = completely different, 1 = identical
  function similarity(a, b) {
    if (!a || !b) return 0;
    var score = 0, weights = 0;

    // Tempo similarity (within 15 BPM = close)
    if (a.tempo > 0 && b.tempo > 0) {
      var tempoDiff = Math.abs(a.tempo - b.tempo);
      score += Math.max(0, 1 - tempoDiff / 15) * 3;  // heavy weight
      weights += 3;
    }

    // Groove similarity (cosine similarity of 16-step patterns)
    if (a.groove && b.groove) {
      var dot = 0, magA = 0, magB = 0;
      for (var i = 0; i < 16; i++) {
        dot += a.groove[i] * b.groove[i];
        magA += a.groove[i] * a.groove[i];
        magB += b.groove[i] * b.groove[i];
      }
      var cos = (magA > 0 && magB > 0) ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
      score += cos * 2;
      weights += 2;
    }

    // Archetype match
    if (a.archetype === b.archetype) { score += 1; }
    weights += 1;

    // Energy profile similarity
    if (a.energy && b.energy) {
      var eDiff = Math.abs(a.energy.mean - b.energy.mean);
      score += Math.max(0, 1 - eDiff / 0.3) * 1.5;
      weights += 1.5;
    }

    // Harmonic center proximity
    if (a.harmonic && b.harmonic) {
      var hDiff = Math.abs(a.harmonic.center - b.harmonic.center);
      score += Math.max(0, 1 - hDiff / 4);
      weights += 1;
    }

    return weights > 0 ? +(score / weights).toFixed(3) : 0;
  }

  return Object.freeze({
    start: start,
    stop: stop,
    snapshot: snapshot,
    similarity: similarity,
    get current() { return fingerprint; },
    get sessionId() { return sessionId; },
  });
})();
