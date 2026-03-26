/**
 * IDENTITY — Your Musical Fingerprint
 *
 * A statistical portrait of how THIS body moves and what musical
 * territory it inhabits. Accumulates over a session, persists across
 * sessions via localStorage. The fingerprint is compact enough for
 * WebRTC (PeerJS), rich enough to recognize someone.
 *
 * The identity DESCRIBES. It does not PRESCRIBE.
 * "Your natural tempo is 92 BPM" does not mean "play at 92 BPM."
 * It means "when you pair with someone at 108 BPM, your devices
 * will find 100 BPM together." The identity enables coupling.
 * The bodies do the coupling.
 *
 * Research:
 *   - Mirror neurons: behavioral speed contagion within 1s (Watanabe 2007)
 *   - Brains sync in theta band during ensemble (Lindenberger et al. 2009)
 *   - Coupled oscillators: HKB model (Haken-Kelso-Bunz 1985)
 *   - Spontaneous sync: rocking chairs entrain (Richardson & Schmidt 2007)
 *   - Music enables bonding at scale (Dunbar 2012)
 */

const Identity = (function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════
  // CONSTANTS
  // ═══════════════════════════════════════════════════════════════════

  var STORAGE_KEY = 'm2_identity';
  var UPDATE_INTERVAL_MS = 2000;  // accumulate stats every 2s, not every frame
  var MIN_SAMPLES = 5;            // minimum observations before fingerprint is valid
  var TEMPO_WINDOW = 64;          // ring buffer for tempo observations
  var ENERGY_WINDOW = 128;        // ring buffer for energy observations
  var CONTOUR_DECAY = 0.995;      // slow decay on contour tallies so recent sessions win
  var TENSION_WINDOW = 64;        // ring buffer for tension durations

  // Energy arc classification thresholds
  var ARC_BUILDER_RISE = 0.15;    // net energy trend > this = builder
  var ARC_SURGER_VAR = 0.08;      // energy variance > this = surger
  var ARC_MEDITATOR_MEAN = 0.25;  // mean energy < this = meditator

  // Compatibility weights (sum = 1.0)
  var W_TEMPO = 0.30;
  var W_ENERGY = 0.25;
  var W_MELODIC = 0.20;
  var W_RHYTHM = 0.15;
  var W_ARCHETYPE = 0.10;

  // ═══════════════════════════════════════════════════════════════════
  // RING BUFFER — fixed-size, no unbounded growth
  // ═══════════════════════════════════════════════════════════════════

  function RingBuffer(capacity) {
    this.buf = new Float64Array(capacity);
    this.cap = capacity;
    this.head = 0;
    this.count = 0;
  }

  RingBuffer.prototype.push = function (v) {
    this.buf[this.head] = v;
    this.head = (this.head + 1) % this.cap;
    if (this.count < this.cap) this.count++;
  };

  RingBuffer.prototype.mean = function () {
    if (this.count === 0) return 0;
    var sum = 0;
    for (var i = 0; i < this.count; i++) sum += this.buf[i];
    return sum / this.count;
  };

  RingBuffer.prototype.variance = function () {
    if (this.count < 2) return 0;
    var m = this.mean();
    var sum = 0;
    for (var i = 0; i < this.count; i++) {
      var d = this.buf[i] - m;
      sum += d * d;
    }
    return sum / this.count;
  };

  RingBuffer.prototype.min = function () {
    if (this.count === 0) return 0;
    var lo = Infinity;
    for (var i = 0; i < this.count; i++) {
      if (this.buf[i] < lo) lo = this.buf[i];
    }
    return lo;
  };

  RingBuffer.prototype.max = function () {
    if (this.count === 0) return 0;
    var hi = -Infinity;
    for (var i = 0; i < this.count; i++) {
      if (this.buf[i] > hi) hi = this.buf[i];
    }
    return hi;
  };

  // Linear trend: positive = rising, negative = falling
  RingBuffer.prototype.trend = function () {
    if (this.count < 4) return 0;
    var n = this.count;
    var sx = 0, sy = 0, sxy = 0, sxx = 0;
    for (var i = 0; i < n; i++) {
      // read oldest-first
      var idx = (this.head - n + i + this.cap) % this.cap;
      var x = i / (n - 1);  // normalize 0-1
      var y = this.buf[idx];
      sx += x; sy += y; sxy += x * y; sxx += x * x;
    }
    var denom = n * sxx - sx * sx;
    if (Math.abs(denom) < 1e-10) return 0;
    return (n * sxy - sx * sy) / denom;
  };

  // ═══════════════════════════════════════════════════════════════════
  // ACCUMULATORS — session statistics
  // ═══════════════════════════════════════════════════════════════════

  var tempoRing = null;
  var energyRing = null;
  var tensionRing = null;
  var contourTally = null;   // { arch: N, rising: N, ... }
  var totalSamples = 0;
  var sessionStartTime = 0;
  var activeTime = 0;        // ms spent moving (energy > threshold)
  var stillTime = 0;         // ms spent still
  var peakSyncopations = 0;  // peaks that landed off-grid
  var peakTotal = 0;         // total peaks observed
  var pitchObservations = null; // ring buffer of centroid values
  var tensionDurations = [];   // durations (s) of sustained tension
  var currentTensionStart = 0;
  var inTension = false;

  // ═══════════════════════════════════════════════════════════════════
  // THE FINGERPRINT
  // ═══════════════════════════════════════════════════════════════════

  var _fingerprint = {
    // Rhythm signature
    naturalTempo: 0,
    tempoVariability: 0,
    syncopationPreference: 0,

    // Melodic signature
    pitchRange: 0,
    pitchCenter: 0.5,
    contourPreference: 'arch',
    tensionComfort: 0,

    // Energy signature
    dynamicRange: 0,
    energyArcType: 'exploring',
    preferredIntensity: 0,

    // Temporal signature
    sessionLength: 0,
    stillnessRatio: 0,

    // Archetype
    archetype: 'new',
  };

  // Cross-session persistence
  var _persistent = null;  // loaded from localStorage

  // ═══════════════════════════════════════════════════════════════════
  // INIT
  // ═══════════════════════════════════════════════════════════════════

  function init() {
    // Allocate ring buffers
    tempoRing = new RingBuffer(TEMPO_WINDOW);
    energyRing = new RingBuffer(ENERGY_WINDOW);
    tensionRing = new RingBuffer(TENSION_WINDOW);
    pitchObservations = new RingBuffer(ENERGY_WINDOW);

    // Reset accumulators
    contourTally = {};
    totalSamples = 0;
    sessionStartTime = performance.now();
    activeTime = 0;
    stillTime = 0;
    peakSyncopations = 0;
    peakTotal = 0;
    tensionDurations = [];
    currentTensionStart = 0;
    inTension = false;

    // Load cross-session data
    _persistent = loadPersistent();

    // If returning user, seed fingerprint from persistent data
    if (_persistent && _persistent.sessions > 0) {
      _fingerprint.naturalTempo = _persistent.naturalTempo || 0;
      _fingerprint.archetype = _persistent.archetype || 'new';
      _fingerprint.sessionLength = _persistent.avgSessionLength || 0;
      _fingerprint.stillnessRatio = _persistent.stillnessRatio || 0;
      _fingerprint.contourPreference = _persistent.contourPreference || 'arch';
      _fingerprint.preferredIntensity = _persistent.preferredIntensity || 0;
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // UPDATE — called periodically from main loop (not every frame)
  // ═══════════════════════════════════════════════════════════════════

  var _lastUpdate = 0;

  function update(bodyState, harmonyState) {
    var now = performance.now();
    if (now - _lastUpdate < UPDATE_INTERVAL_MS) return;
    _lastUpdate = now;

    try {
      accumulateBody(bodyState);
      accumulateHarmony(harmonyState);
      totalSamples++;
      computeFingerprint();
    } catch (e) {
      // Errors logged but never crash the music
      if (typeof console !== 'undefined') {
        console.warn('[Identity] update error:', e.message);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // BODY ACCUMULATION
  // ═══════════════════════════════════════════════════════════════════

  function accumulateBody(body) {
    if (!body) return;

    // ── Tempo ──
    // body.bodyTempo is derived from peak intervals.
    // Only record when rhythm confidence is meaningful.
    var tempo = readSafe(body, 'bodyTempo', 0);
    var conf = readSafe(body, 'rhythmConfidence', 0);
    if (tempo > 30 && tempo < 200 && conf > 0.25) {
      tempoRing.push(tempo);
    }

    // ── Energy ──
    var energy = readSafe(body, 'energy', 0);
    var eNorm = Math.min(1, energy / 3);  // normalize: raw energy ~0-3
    energyRing.push(eNorm);

    // ── Active vs still time ──
    var dt = UPDATE_INTERVAL_MS;
    if (eNorm > 0.05) {
      activeTime += dt;
    } else {
      stillTime += dt;
    }

    // ── Peak syncopation ──
    // A peak is "syncopated" if it lands off the strong beats.
    // We approximate: if peaked this cycle and tempo is locked,
    // check phase alignment to the grid.
    if (readSafe(body, 'peaked', false)) {
      peakTotal++;
      // Use coupling phase if available: off-grid = phase not near 0 or 0.5
      var coupling = (typeof body.coupling === 'function') ? body.coupling() : null;
      if (coupling && coupling.phase !== undefined) {
        var phase = coupling.phase;
        // On-grid = phase near 0.0 or 0.5 (within 0.1)
        var distToGrid = Math.min(
          phase, Math.abs(phase - 0.5), Math.abs(phase - 1.0)
        );
        if (distToGrid > 0.1) {
          peakSyncopations++;
        }
      }
    }

    // ── Archetype ──
    // body.motionProfile.archetype is the cross-session archetype
    var profile = readSafe(body, 'motionProfile', null);
    if (profile && profile.archetype) {
      _fingerprint.archetype = profile.archetype;
    } else {
      // fall back to per-frame archetype
      var arch = readSafe(body, 'archetype', null);
      if (arch) _fingerprint.archetype = arch;
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // HARMONY ACCUMULATION
  // ═══════════════════════════════════════════════════════════════════

  function accumulateHarmony(harmony) {
    if (!harmony) return;

    // ── Pitch observations ──
    // melodicCentroid: 0-7 (scale degree range), exposed by Harmony.centroid
    var centroid = readSafe(harmony, 'centroid', -1);
    if (centroid >= 0) {
      pitchObservations.push(centroid);
    }

    // ── Contour tallying ──
    var contour = readSafe(harmony, 'contour', null);
    if (contour) {
      // Apply decay to all tallies so recent preferences win
      var keys = Object.keys(contourTally);
      for (var i = 0; i < keys.length; i++) {
        contourTally[keys[i]] *= CONTOUR_DECAY;
      }
      contourTally[contour] = (contourTally[contour] || 0) + 1;
    }

    // ── Tension tracking ──
    // harmonicTension: 0-1, exposed by Harmony.tension
    var tension = readSafe(harmony, 'tension', 0);
    tensionRing.push(tension);

    // Track how long the user sustains tension before resolving
    if (tension > 0.5) {
      if (!inTension) {
        inTension = true;
        currentTensionStart = performance.now();
      }
    } else {
      if (inTension) {
        inTension = false;
        var dur = (performance.now() - currentTensionStart) / 1000;
        if (dur > 0.5) {  // ignore sub-500ms flickers
          tensionDurations.push(dur);
          // cap array to prevent unbounded growth
          if (tensionDurations.length > 64) tensionDurations.shift();
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // COMPUTE FINGERPRINT — distill accumulators into the portrait
  // ═══════════════════════════════════════════════════════════════════

  function computeFingerprint() {
    // ── Rhythm signature ──
    if (tempoRing.count >= MIN_SAMPLES) {
      _fingerprint.naturalTempo = round2(tempoRing.mean());
      // Variability: coefficient of variation (std / mean)
      var std = Math.sqrt(tempoRing.variance());
      var mean = tempoRing.mean();
      _fingerprint.tempoVariability = mean > 0 ? round3(std / mean) : 0;
    }

    // Syncopation: fraction of peaks that landed off-grid
    _fingerprint.syncopationPreference = peakTotal > 0
      ? round3(peakSyncopations / peakTotal) : 0;

    // ── Melodic signature ──
    if (pitchObservations.count >= MIN_SAMPLES) {
      _fingerprint.pitchRange = round2(pitchObservations.max() - pitchObservations.min());
      _fingerprint.pitchCenter = round3(pitchObservations.mean() / 7);  // normalize 0-1
    }

    // Contour preference: whichever contour has the highest tally
    var bestContour = 'arch';
    var bestCount = 0;
    var contourKeys = Object.keys(contourTally);
    for (var ci = 0; ci < contourKeys.length; ci++) {
      if (contourTally[contourKeys[ci]] > bestCount) {
        bestCount = contourTally[contourKeys[ci]];
        bestContour = contourKeys[ci];
      }
    }
    _fingerprint.contourPreference = bestContour;

    // Tension comfort: median duration of sustained tension episodes
    if (tensionDurations.length > 0) {
      var sorted = tensionDurations.slice().sort(function (a, b) { return a - b; });
      _fingerprint.tensionComfort = round2(sorted[Math.floor(sorted.length / 2)]);
    }

    // ── Energy signature ──
    if (energyRing.count >= MIN_SAMPLES) {
      _fingerprint.dynamicRange = round3(energyRing.max() - energyRing.min());
      _fingerprint.preferredIntensity = round3(energyRing.mean());
      _fingerprint.energyArcType = classifyEnergyArc();
    }

    // ── Temporal signature ──
    var elapsed = (performance.now() - sessionStartTime) / 1000;
    _fingerprint.sessionLength = round1(elapsed);
    var total = activeTime + stillTime;
    _fingerprint.stillnessRatio = total > 0 ? round3(stillTime / total) : 0;
  }

  // ═══════════════════════════════════════════════════════════════════
  // ENERGY ARC CLASSIFICATION
  // ═══════════════════════════════════════════════════════════════════
  //
  // 'builder'    — energy trends upward over the session
  // 'surger'     — high variance, big swings between peaks and valleys
  // 'meditator'  — low mean energy, steady presence
  // 'chaotic'    — high variance AND high mean (intense + unpredictable)
  //
  // Falls back to 'exploring' when insufficient data.

  function classifyEnergyArc() {
    if (energyRing.count < MIN_SAMPLES * 2) return 'exploring';

    var mean = energyRing.mean();
    var variance = energyRing.variance();
    var trend = energyRing.trend();

    // Chaotic: high energy AND high variance
    if (mean > 0.5 && variance > ARC_SURGER_VAR) return 'chaotic';

    // Builder: clear upward trend
    if (trend > ARC_BUILDER_RISE) return 'builder';

    // Surger: high variance regardless of trend
    if (variance > ARC_SURGER_VAR) return 'surger';

    // Meditator: low energy, steady
    if (mean < ARC_MEDITATOR_MEAN) return 'meditator';

    // Default: exploring (moderate everything)
    return 'exploring';
  }

  // ═══════════════════════════════════════════════════════════════════
  // COMPATIBILITY — how well two fingerprints pair for an Outfit
  // ═══════════════════════════════════════════════════════════════════
  //
  // Returns 0-1. Not "sameness" but "complementarity."
  // Two identical fingerprints score high (unison potential).
  // Two complementary fingerprints also score high (call-response).
  // Two fundamentally incompatible ones score low.
  //
  // HKB model: coupled oscillators entrain when frequency ratio
  // is near a simple integer. 1:1 = strongest. 1:2 = strong.
  // 3:5 = weak but possible.

  function compatibility(other) {
    if (!other || totalSamples < MIN_SAMPLES) return 0;

    var score = 0;

    // ── Tempo compatibility (HKB: integer ratio = entrainment) ──
    score += tempoCompatibility(
      _fingerprint.naturalTempo,
      other.naturalTempo
    ) * W_TEMPO;

    // ── Energy compatibility ──
    score += energyCompatibility(
      _fingerprint.preferredIntensity,
      _fingerprint.dynamicRange,
      _fingerprint.energyArcType,
      other.preferredIntensity,
      other.dynamicRange,
      other.energyArcType
    ) * W_ENERGY;

    // ── Melodic compatibility (complementary ranges) ──
    score += melodicCompatibility(
      _fingerprint.pitchCenter,
      _fingerprint.pitchRange,
      _fingerprint.contourPreference,
      other.pitchCenter,
      other.pitchRange,
      other.contourPreference
    ) * W_MELODIC;

    // ── Rhythmic compatibility ──
    score += rhythmCompatibility(
      _fingerprint.syncopationPreference,
      _fingerprint.tempoVariability,
      other.syncopationPreference,
      other.tempoVariability
    ) * W_RHYTHM;

    // ── Archetype compatibility ──
    score += archetypeCompatibility(
      _fingerprint.archetype,
      other.archetype
    ) * W_ARCHETYPE;

    return round3(Math.min(1, Math.max(0, score)));
  }

  // ── Tempo: HKB coupled oscillator frequency matching ──
  // Integer ratios (1:1, 1:2, 2:3) are stable phase-locked states.
  // The closer the ratio to a simple integer, the easier entrainment.
  function tempoCompatibility(t1, t2) {
    if (t1 < 30 || t2 < 30) return 0.5;  // insufficient data, neutral
    var lo = Math.min(t1, t2);
    var hi = Math.max(t1, t2);
    var ratio = hi / lo;

    // Check proximity to integer ratios: 1/1, 2/1, 3/2, 4/3, 3/1
    var targets = [1, 2, 1.5, 1.333, 3];
    var bestDist = Infinity;
    for (var i = 0; i < targets.length; i++) {
      var d = Math.abs(ratio - targets[i]);
      if (d < bestDist) bestDist = d;
    }
    // Within 0.15 of a target ratio = high compatibility
    return Math.max(0, 1 - bestDist / 0.3);
  }

  // ── Energy: similar intensity OR complementary arcs ──
  function energyCompatibility(int1, range1, arc1, int2, range2, arc2) {
    // Intensity similarity (within 0.3 = close)
    var intMatch = Math.max(0, 1 - Math.abs(int1 - int2) / 0.4);

    // Dynamic range compatibility: similar ranges pair well
    var rangeMatch = Math.max(0, 1 - Math.abs(range1 - range2) / 0.5);

    // Arc complementarity: some pairings work better than others
    var arcBonus = 0;
    if (arc1 === arc2) {
      arcBonus = 0.8;  // same arc = unison potential
    } else if (
      (arc1 === 'builder' && arc2 === 'surger') ||
      (arc1 === 'surger' && arc2 === 'builder')
    ) {
      arcBonus = 0.9;  // builder + surger = call-and-response
    } else if (
      (arc1 === 'meditator' && arc2 === 'builder') ||
      (arc1 === 'builder' && arc2 === 'meditator')
    ) {
      arcBonus = 0.7;  // ground + ascent
    } else {
      arcBonus = 0.5;  // everything else: moderate
    }

    return intMatch * 0.3 + rangeMatch * 0.2 + arcBonus * 0.5;
  }

  // ── Melodic: complementary pitch territories ──
  function melodicCompatibility(center1, range1, contour1, center2, range2, contour2) {
    // Pitch center distance: too similar = competing, too far = disconnected
    // Sweet spot: moderately different (0.2-0.5 apart on 0-1 scale)
    var centerDist = Math.abs(center1 - center2);
    var centerScore;
    if (centerDist < 0.15) {
      centerScore = 0.7;  // very similar: unison territory
    } else if (centerDist < 0.45) {
      centerScore = 1.0;  // complementary: call-response territory
    } else {
      centerScore = Math.max(0.3, 1 - centerDist);  // far apart: still workable
    }

    // Contour pairing
    var contourScore = 0.5;
    if (contour1 === contour2) {
      contourScore = 0.8;  // same shape: mirror
    } else if (
      (contour1 === 'rising' && contour2 === 'falling') ||
      (contour1 === 'falling' && contour2 === 'rising') ||
      (contour1 === 'question' && contour2 === 'answer') ||
      (contour1 === 'answer' && contour2 === 'question')
    ) {
      contourScore = 1.0;  // natural complement
    }

    // Combined range: together they should cover more territory
    var combinedRange = Math.min(1, (range1 + range2) / 10);

    return centerScore * 0.4 + contourScore * 0.35 + combinedRange * 0.25;
  }

  // ── Rhythmic: similar groove feel ──
  function rhythmCompatibility(sync1, var1, sync2, var2) {
    // Syncopation similarity: similar groove preferences pair well
    var syncMatch = Math.max(0, 1 - Math.abs(sync1 - sync2) / 0.5);

    // Tempo variability: one steady + one loose = interesting pairing
    var varDist = Math.abs(var1 - var2);
    var varScore;
    if (varDist < 0.05) {
      varScore = 0.9;  // same feel
    } else if (varDist < 0.15) {
      varScore = 1.0;  // complementary flexibility
    } else {
      varScore = Math.max(0.4, 1 - varDist);
    }

    return syncMatch * 0.5 + varScore * 0.5;
  }

  // ── Archetype: some pairings create better music ──
  function archetypeCompatibility(a1, a2) {
    if (a1 === a2) return 0.8;  // same archetype = natural unison

    // Complementary pairings
    var GOOD_PAIRS = {
      'surge:flow': 0.95,
      'pulse:meditator': 0.9,
      'surge:pulse': 0.85,
      'flow:meditator': 0.85,
      'surge:meditator': 0.7,
      'pulse:flow': 0.75,
    };

    var key1 = a1 + ':' + a2;
    var key2 = a2 + ':' + a1;
    return GOOD_PAIRS[key1] || GOOD_PAIRS[key2] || 0.6;
  }

  // ═══════════════════════════════════════════════════════════════════
  // ROLE ASSIGNMENT — who calls, who responds, or unison
  // ═══════════════════════════════════════════════════════════════════
  //
  // Roles emerge from fingerprints, not from arbitrary assignment.
  // The person with higher energy and syncopation leads (call).
  // The person with higher tension comfort and melodic range
  // responds (response). Near-equal = unison.
  //
  // Richardson & Schmidt 2007: spontaneous role differentiation
  // emerges from slight asymmetries in coupled oscillators.

  function assignRole(other) {
    if (!other || totalSamples < MIN_SAMPLES) return 'unison';

    // Compute "initiative" score for each player
    var myInitiative = computeInitiative(_fingerprint);
    var theirInitiative = computeInitiative(other);

    var diff = myInitiative - theirInitiative;

    // Threshold for role differentiation
    // Small differences = unison. HKB: in-phase (unison) is the
    // most stable coordination mode.
    if (Math.abs(diff) < 0.12) return 'unison';
    return diff > 0 ? 'call' : 'response';
  }

  function computeInitiative(fp) {
    // Initiative = weighted combination of:
    // - Energy intensity (energetic players lead)
    // - Syncopation (rhythmically assertive players lead)
    // - Tempo confidence (steady tempo = clearer signal)
    // - Dynamic range (wider range = more expression)
    var energy = fp.preferredIntensity || 0;
    var sync = fp.syncopationPreference || 0;
    var steadiness = 1 - (fp.tempoVariability || 0);
    var dynamics = fp.dynamicRange || 0;

    return energy * 0.35 + sync * 0.25 + steadiness * 0.2 + dynamics * 0.2;
  }

  // ═══════════════════════════════════════════════════════════════════
  // SERIALIZATION — compact for WebRTC transmission
  // ═══════════════════════════════════════════════════════════════════

  function serialize() {
    return JSON.stringify(_fingerprint);
  }

  function deserialize(json) {
    try {
      return (typeof json === 'string') ? JSON.parse(json) : json;
    } catch (e) {
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // PERSISTENCE — cross-session memory via localStorage
  // ═══════════════════════════════════════════════════════════════════
  //
  // The persistent identity is a weighted blend of all sessions.
  // Recent sessions carry more weight (exponential moving average).
  // This lets the fingerprint evolve as the user evolves,
  // while retaining the shape of who they are.

  function loadPersistent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function savePersistent() {
    if (totalSamples < MIN_SAMPLES) return;  // don't save noise

    var prev = _persistent || {
      sessions: 0,
      naturalTempo: 0,
      preferredIntensity: 0,
      stillnessRatio: 0,
      avgSessionLength: 0,
      contourPreference: 'arch',
      archetype: 'new',
      tempoVariability: 0,
      dynamicRange: 0,
      tensionComfort: 0,
    };

    // Exponential moving average: recent sessions weigh more
    var alpha = prev.sessions > 0 ? 0.3 : 1.0;  // first session = full weight
    var n = prev.sessions + 1;

    _persistent = {
      sessions: n,
      naturalTempo: ema(prev.naturalTempo, _fingerprint.naturalTempo, alpha),
      preferredIntensity: ema(prev.preferredIntensity, _fingerprint.preferredIntensity, alpha),
      stillnessRatio: ema(prev.stillnessRatio, _fingerprint.stillnessRatio, alpha),
      avgSessionLength: ema(prev.avgSessionLength, _fingerprint.sessionLength, alpha),
      contourPreference: _fingerprint.contourPreference,  // categorical: latest wins
      archetype: _fingerprint.archetype,                   // categorical: latest wins
      tempoVariability: ema(prev.tempoVariability, _fingerprint.tempoVariability, alpha),
      dynamicRange: ema(prev.dynamicRange, _fingerprint.dynamicRange, alpha),
      tensionComfort: ema(prev.tensionComfort, _fingerprint.tensionComfort, alpha),
      lastSession: Date.now(),
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(_persistent));
    } catch (e) {
      // Storage full or unavailable — not a crisis
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════

  function ema(prev, curr, alpha) {
    return round3(prev * (1 - alpha) + curr * alpha);
  }

  function round1(v) { return Math.round(v * 10) / 10; }
  function round2(v) { return Math.round(v * 100) / 100; }
  function round3(v) { return Math.round(v * 1000) / 1000; }

  // Safe property read — works with both getter-based objects
  // (like Body's frozen API) and plain objects (deserialized fingerprints)
  function readSafe(obj, prop, fallback) {
    try {
      var val = obj[prop];
      return (val !== undefined && val !== null) ? val : fallback;
    } catch (e) {
      return fallback;
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // PUBLIC API — frozen, immutable
  // ═══════════════════════════════════════════════════════════════════

  return Object.freeze({
    init: init,
    update: update,
    compatibility: compatibility,
    assignRole: assignRole,
    serialize: serialize,
    deserialize: deserialize,
    savePersistent: savePersistent,

    // Read-only access
    get fingerprint() { return _fingerprint; },
    get samples() { return totalSamples; },
    get valid() { return totalSamples >= MIN_SAMPLES; },
    get persistent() { return _persistent; },
  });
})();

window.Identity = Identity;
