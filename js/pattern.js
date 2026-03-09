/**
 * PATTERN — The AI Producer (v2)
 *
 * Factor Oracle (Assayag/Allauzen, IRCAM 1999) with:
 *   - Weighted probabilistic transitions (sounds more like you)
 *   - Multi-dimensional symbols: degree + duration + energy
 *   - Beat-aligned IOI generation (grooves with your tempo)
 *   - Harmonic gravity (resolves toward your natural rest degrees)
 *   - Phrase memory (never repeats the last 3 phrases)
 *   - Loop detector: 4 consecutive similar phrases → beat drop
 *   - Voice variation: melody + harmonic stabs in phase 2
 *   - Information-rate phrase boundary detection (VMO-style)
 */

const Pattern = (function () {
  'use strict';

  // ── SYMBOL ENCODING ───────────────────────────────────────────────────
  // Encode (degree, duration, energy) as a single integer for oracle keying.
  // Degree: -7..+7 → offset by 7 → 0..14  (15 values)
  // Duration bucket: 0=short(<180ms) 1=mid(180-500ms) 2=long(>500ms)  (3 values)
  // Energy bucket: 0=soft 1=medium 2=loud                              (3 values)
  // Total alphabet: 15 × 3 × 3 = 135 symbols — still tiny for an FO

  function encode(degree, ioiMs, velocity) {
    var d   = Math.max(0, Math.min(14, (degree || 0) + 7));
    var dur = ioiMs < 180 ? 0 : ioiMs < 500 ? 1 : 2;
    var en  = velocity < 0.3 ? 0 : velocity < 0.6 ? 1 : 2;
    return d + dur * 15 + en * 45;
  }

  function decodeDegree(sym) { return (sym % 15) - 7; }

  // ── FACTOR ORACLE ─────────────────────────────────────────────────────
  //   states[i]: { fwd: Map<sym→stateIdx>, link: int, sym: int, ioi: float }
  //   weights[i]: Map<sym→count>  — how many times each fwd transition was taken

  var oStates  = null;
  var oWeights = null;
  var oLen     = 0;

  // Transition-frequency table: "state,sym" → count (for weighted sampling)
  var transFreq = null;

  function oracleReset() {
    oStates  = [{ fwd: {}, link: 0, sym: -1, ioi: 0 }];
    oWeights = [{}];
    transFreq = {};
    oLen = 0;
  }

  function oracleAdd(sym, ioi) {
    var n = oStates.length;
    oLen  = n;

    oStates.push({ fwd: {}, link: 0, sym: sym, ioi: ioi });
    oWeights.push({});

    // Internal (spine) edge
    oStates[n - 1].fwd[sym] = n;
    oWeights[n - 1][sym]    = (oWeights[n - 1][sym] || 0) + 1;
    _recordTrans(n - 1, sym);

    // Walk suffix links, adding external edges where none exist
    var k = oStates[n - 1].link;
    while (k > 0 && !(sym in oStates[k].fwd)) {
      oStates[k].fwd[sym] = n;
      oWeights[k][sym]    = (oWeights[k][sym] || 0) + 1;
      _recordTrans(k, sym);
      k = oStates[k].link;
    }

    // Suffix link for new state
    if (!(sym in oStates[k].fwd) || oStates[k].fwd[sym] === n) {
      oStates[n].link = 0;
    } else {
      oStates[n].link = oStates[k].fwd[sym];
    }
  }

  function _recordTrans(state, sym) {
    var key = state + ',' + sym;
    transFreq[key] = (transFreq[key] || 0) + 1;
  }

  // Weighted sample from available forward transitions
  function oracleNext(state) {
    var s    = oStates[state];
    var keys = Object.keys(s.fwd);
    if (keys.length === 0) return 1;
    if (keys.length === 1) return s.fwd[keys[0]];

    // Weight by observed frequency
    var total = 0;
    var weights = [];
    for (var i = 0; i < keys.length; i++) {
      var w = transFreq[state + ',' + keys[i]] || 1;
      weights.push(w);
      total += w;
    }
    var r = Math.random() * total;
    for (var j = 0; j < keys.length; j++) {
      r -= weights[j];
      if (r <= 0) return s.fwd[keys[j]];
    }
    return s.fwd[keys[keys.length - 1]];
  }

  function oracleNavigate(state, temperature) {
    var s = oStates[state];
    if (Object.keys(s.fwd).length === 0) return 1;
    if (s.link > 0 && Math.random() < temperature) return s.link;
    return oracleNext(state);
  }

  // ── MOTIF DETECTION ───────────────────────────────────────────────────
  // Rule of three: motif confirmed at 3+ occurrences.
  // Track by symbol sequence (multi-dim), length 3-6.

  var motifCounts    = {};
  var confirmedMotifs = [];
  var recentSyms     = [];
  var recentDegrees  = []; // parallel array, degree only (for generation)
  var recentIOIs     = [];

  function checkMotifs(sym, degree, ioi) {
    recentSyms.push(sym);
    recentDegrees.push(degree);
    recentIOIs.push(ioi);
    if (recentSyms.length > 64) {
      recentSyms.shift(); recentDegrees.shift(); recentIOIs.shift();
    }

    for (var len = 3; len <= Math.min(6, recentSyms.length); len++) {
      var sub = recentSyms.slice(-len).join(',');
      motifCounts[sub] = (motifCounts[sub] || 0) + 1;
      if (motifCounts[sub] >= 3 && confirmedMotifs.indexOf(sub) === -1) {
        confirmedMotifs.push(sub);
      }
    }

    // Phrase-type accumulator: snapshot cluster every PHRASE_TYPE_WINDOW notes
    phraseTypeAccum  += degree;
    phraseTypeCounter++;
    if (phraseTypeCounter >= PHRASE_TYPE_WINDOW) {
      var avgDeg  = phraseTypeAccum / phraseTypeCounter;
      var cluster = avgDeg < -3 ? 0 : avgDeg < -1 ? 1 : avgDeg < 1 ? 2 : avgDeg < 3 ? 3 : 4;
      phraseTypeAccum  = 0;
      phraseTypeCounter = 0;
      addPhraseType(cluster);
    }
  }

  // ── LEVEL 2: PHRASE FORM DETECTION ────────────────────────────────────
  // Tracks the harmonic character of phrase-level blocks via 5-cluster encoding:
  //   0=falling  1=low  2=center  3=high  4=rising
  // Detects repeating 3-gram patterns (ABA, ABC, BAB…) → confirmed "forms".
  // When a form is confirmed 3x, it's the user's structural signature.

  var PHRASE_TYPE_WINDOW = 10;  // notes per phrase-type snapshot
  var phraseTypeAccum    = 0;
  var phraseTypeCounter  = 0;
  var phraseTypeSeq      = [];  // rolling cluster sequence
  var phraseCounts2      = {};  // trigram string → count
  var confirmedForms     = [];  // trigrams confirmed at 3+

  // Section state: learn A, then B, then synthesize C
  var sectionA     = null;   // first confirmed form trigram
  var sectionB     = null;   // second distinct form
  var sectionMode  = null;   // 'A' | 'B' | 'C'

  // Derived harmonic progression for crystallization
  var crystalHarmony = null; // [degree, degree, ...] from form shape

  function addPhraseType(cluster) {
    phraseTypeSeq.push(cluster);
    if (phraseTypeSeq.length > 18) phraseTypeSeq.shift();

    if (phraseTypeSeq.length < 3) return;
    var trigram = phraseTypeSeq.slice(-3).join(',');
    phraseCounts2[trigram] = (phraseCounts2[trigram] || 0) + 1;
    if (phraseCounts2[trigram] >= 3 && confirmedForms.indexOf(trigram) === -1) {
      confirmedForms.push(trigram);
      onFormConfirmed(trigram);
    }
  }

  function onFormConfirmed(trigram) {
    var clusters = trigram.split(',').map(Number);
    if (!sectionA) {
      sectionA    = trigram;
      sectionMode = 'A';
    } else if (trigram !== sectionA && !sectionB) {
      sectionB    = trigram;
      sectionMode = 'B';
    } else if (sectionA && sectionB) {
      sectionMode = 'C';
    }
    crystalHarmony = deriveCrystalHarmony(clusters);
    crystalPending = false; // allow crystallization to fire again
  }

  // Map cluster sequence → implied harmonic progression (scale degrees)
  var CLUSTER_DEGREE = [-4, -2, 0, 3, 5]; // 0=falling … 4=rising

  function deriveCrystalHarmony(clusters) {
    if (sectionMode === 'C' && sectionA && sectionB) {
      // Synthesis: interleave A and B degrees + resolve to tonic
      var ha = sectionA.split(',').map(function (c) { return CLUSTER_DEGREE[+c]; });
      var hb = sectionB.split(',').map(function (c) { return CLUSTER_DEGREE[+c]; });
      var merged = [];
      var len = Math.max(ha.length, hb.length);
      for (var i = 0; i < len; i++) {
        if (i < ha.length) merged.push(ha[i]);
        if (i < hb.length) merged.push(hb[i]);
      }
      merged.push(0); // resolve
      return merged;
    }
    var harm = clusters.map(function (c) { return CLUSTER_DEGREE[Math.max(0, Math.min(4, c))]; });
    harm.push(0); // always resolve back to tonic
    return harm;
  }

  // ── CRYSTALLIZATION ───────────────────────────────────────────────────
  // Sudden reorganization: when phrase-level patterns are established and
  // the user sustains silence, the system plays the HIGHER-ORDER PROGRESSION
  // it has inferred — the arc of arcs, made audible. Brief, majestic, clear.

  var crystalSilenceMs  = 0;
  var crystalPending    = true;   // false while on cooldown after firing
  var crystalCooldownMs = 0;
  var crystalCount      = 0;
  var CRYSTAL_SILENCE_MS = 7000;  // 7s sustained silence → crystallize

  function fireCrystallization() {
    if (!Audio.ctx || !lens || !crystalHarmony) return;
    crystalPending    = false;
    crystalCooldownMs = 12000; // 12s before level-1 generation resumes
    crystalCount++;

    var time    = Audio.ctx.currentTime;
    var palette = lens.palette || {};
    var voice   = (palette.harmonic && palette.harmonic.voice) || 'epiano';
    var octave  = (palette.harmonic && palette.harmonic.octave) || 0;

    // Each chord: root dyad (root + fourth) — spacious, not dense
    for (var i = 0; i < crystalHarmony.length; i++) {
      var deg   = crystalHarmony[i];
      var delay = i * 2.2; // 2.2s between chords — glacial, deliberate
      var vel   = 0.13 + (i === crystalHarmony.length - 1 ? 0.04 : 0); // slight swell on final

      (function (d, dl, v) {
        var f1 = Follow.scaleFreq(d,     octave - 1);
        var f2 = Follow.scaleFreq(d + 3, octave - 1); // scale-degree fourth
        try { Audio.synth.play(voice, time + dl,       f1, v,       8.0); } catch (e) {}
        try { Audio.synth.play(voice, time + dl + 0.12, f2, v * 0.6, 8.0); } catch (e) {}
      })(deg, delay, vel);
    }

    // After crystallization: hard reset — listen fresh, temperature to floor
    loopTemperature = 0.04;
    loopCount       = 0;
    beatDropFired   = false; // allow a new beat drop cycle
  }

  // ── HARMONIC GRAVITY ──────────────────────────────────────────────────
  // Degrees the user "rests on" (long IOI) become resolution targets.

  var restDegrees = {}; // degree → count

  function updateRestDegrees(degree, ioi) {
    if (ioi > 500) {
      restDegrees[degree] = (restDegrees[degree] || 0) + 1;
    }
  }

  function bestRestDegree() {
    var best = 0, bestCount = 0;
    for (var d in restDegrees) {
      if (restDegrees[d] > bestCount) { bestCount = restDegrees[d]; best = +d; }
    }
    return best;
  }

  // ── BEAT ALIGNMENT ────────────────────────────────────────────────────
  // Snap generated IOI to the nearest rhythmic subdivision of the user's tempo.

  function beatAlignedIOI(rawMs) {
    var tempo = Follow.tempo;
    var conf  = Follow.confidence;
    if (!tempo || tempo < 30 || conf < 0.35) return rawMs;

    var beatMs = 60000 / tempo;
    var subs   = [1.5, 1.0, 0.75, 0.5, 0.375, 0.25];
    var best   = rawMs, bestDiff = Infinity;
    for (var i = 0; i < subs.length; i++) {
      var target = beatMs * subs[i];
      var diff   = Math.abs(rawMs - target);
      if (diff < bestDiff) { bestDiff = diff; best = target; }
    }
    return best;
  }

  // ── PHRASE MEMORY ─────────────────────────────────────────────────────
  // Avoid repeating the last 3 generated phrases.

  var phraseHistory = []; // last 3 phrase hashes

  function hashPhrase(queue) {
    return queue.map(function (e) { return e.degree; }).join(',');
  }

  function phraseIsRepeat(queue) {
    var h = hashPhrase(queue);
    return phraseHistory.indexOf(h) !== -1;
  }

  function recordPhrase(queue) {
    phraseHistory.push(hashPhrase(queue));
    if (phraseHistory.length > 3) phraseHistory.shift();
  }

  // ── LOOP DETECTOR + BEAT DROP ─────────────────────────────────────────
  // 4 consecutive similar phrases → user found a groove → beat drop.

  var loopCount       = 0;
  var beatDropFired   = false;
  var lastPhraseHash  = null;
  var beatDropPending = false;
  var beatDropTimer   = 0;

  function checkBeatDrop(queue) {
    var h = hashPhrase(queue);
    if (lastPhraseHash && phraseSimilarity(h, lastPhraseHash) > 0.55) {
      loopCount++;
    } else {
      loopCount = 1;
    }
    lastPhraseHash = h;

    if (loopCount >= 4 && !beatDropFired) {
      beatDropFired   = true;
      beatDropPending = true;
      beatDropTimer   = 0;
    }
  }

  function phraseSimilarity(a, b) {
    var da = a.split(','), db = b.split(',');
    var len = Math.min(da.length, db.length);
    if (len === 0) return 0;
    var matches = 0;
    for (var i = 0; i < len; i++) if (da[i] === db[i]) matches++;
    return matches / len;
  }

  function fireBeatDrop() {
    if (!lens || !Audio.ctx) return;
    var time = Audio.ctx.currentTime;
    var kit  = (lens.groove && lens.groove.kit) || 'acoustic';
    var peak = lens.palette && lens.palette.peak;

    // Big hit — kick + snare + chord stab
    try { Audio.drum.kick(time,       0.95, kit); } catch (e) {}
    try { Audio.drum.snare(time,      0.85, kit); } catch (e) {}
    try { Audio.drum.hat(time + 0.02, 0.7,  kit); } catch (e) {}

    // Ascending arpeggio on current harmony (quick, dramatic)
    if (peak) {
      var arpDegs = [0, 2, 4, 7];
      for (var i = 0; i < arpDegs.length; i++) {
        var freq = Follow.scaleFreq(arpDegs[i], (peak.octave || 0));
        try {
          Audio.synth.play(peak.voice || 'brass', time + i * 0.06, freq, 0.7, 0.4);
        } catch (e) {}
      }
    }

    // After the drop, temperature resets — settle into the groove
    loopTemperature = 0.08;
  }

  // ── STATE ─────────────────────────────────────────────────────────────

  var lens           = null;
  var totalNotes     = 0;
  var lastNoteTime   = 0;
  var lastVelocity   = 0.4;

  var genQueue       = [];
  var genActive      = false;
  var genPlayedMs    = 0;
  var genNoteIdx     = 0;

  var silenceMs      = 0;
  var GEN_SILENCE_MS = 2800;  // longer threshold — let the sporadic sounds breathe
  var phraseCount    = 0;
  var loopTemperature = 0.10;
  var genThisEpisode = false; // only one phrase per silence episode

  // ── GENERATION ────────────────────────────────────────────────────────

  function buildPhrase() {
    if (!lens || oLen < 18 || confirmedMotifs.length === 0) return false;

    // Try up to 4 times to find a non-repeating phrase
    for (var attempt = 0; attempt < 4; attempt++) {
      var queue = buildPhraseAttempt();
      if (queue && !phraseIsRepeat(queue)) {
        genQueue    = queue;
        genActive   = true;
        genPlayedMs = 0;
        genNoteIdx  = 0;
        checkBeatDrop(queue);
        recordPhrase(queue);
        phraseCount++;
        genThisEpisode = true;
        // Slowly raise temperature until beat drop resets it
        loopTemperature = Math.min(0.35, loopTemperature + 0.02);
        return true;
      }
    }
    return false;
  }

  function buildPhraseAttempt() {
    var motif = confirmedMotifs[Math.floor(Math.random() * confirmedMotifs.length)];
    var seed  = motif.split(',').map(Number);

    // Navigate oracle to find a state after the seed
    var state = 1;
    for (var i = 0; i < seed.length; i++) {
      var deg  = decodeDegree(seed[i]);
      // Find a state reachable with this degree (any matching sym)
      var found = false;
      var fwdKeys = Object.keys(oStates[state].fwd);
      for (var f = 0; f < fwdKeys.length; f++) {
        if (decodeDegree(+fwdKeys[f]) === deg) {
          state = oStates[state].fwd[fwdKeys[f]];
          found = true; break;
        }
      }
      if (!found) {
        state = Math.max(1, Math.floor(Math.random() * oLen));
        break;
      }
    }

    var phraseLen  = 6 + Math.floor(Math.random() * 6); // 6-11 notes
    var resolution = bestRestDegree();
    var queue      = [];
    var t          = 0;

    var aLen      = Math.floor(phraseLen * 0.50); // A: faithful
    var apLen     = Math.floor(phraseLen * 0.30); // A': variation
    // B: remainder resolves

    var arch = Follow.archetype || 'exploring';
    var ioiScale = arch === 'bouncing' ? 0.70 : arch === 'waving' ? 1.25 : 1.0;

    for (var n = 0; n < phraseLen; n++) {
      var s      = oStates[state];
      var degree = s.sym >= 0 ? decodeDegree(s.sym) : 0;

      // B section: gravitate toward user's natural resolution degree
      if (n >= aLen + apLen) {
        // Smooth approach: step toward resolution rather than jumping
        degree = degree > resolution ? degree - 1 : degree < resolution ? degree + 1 : resolution;
      }

      // IOI: use stored timing, beat-align, scale by archetype
      var rawIOI = s.ioi > 0 ? Math.max(120, Math.min(1800, s.ioi)) : 380;
      var ioi    = beatAlignedIOI(rawIOI * ioiScale);

      // Velocity: use archetype energy (quieter than user — it's a response)
      var vel = 0.18 + Math.random() * 0.12;

      queue.push({ degree: degree, delayMs: t, ioi: ioi, vel: vel });
      t += ioi;

      var temp = n < aLen ? loopTemperature * 0.3
               : n < aLen + apLen ? loopTemperature
               : loopTemperature * 0.1;
      state = oracleNavigate(state, temp);
    }

    return queue.length > 0 ? queue : null;
  }

  function cancelGeneration() {
    genActive   = false;
    genQueue    = [];
    genPlayedMs = 0;
    genNoteIdx  = 0;
  }

  function playGenNote(ev) {
    if (!lens || !Audio.ctx) return;

    var phase   = Follow.phase;
    var palette = lens.palette || {};
    var cont    = palette.continuous;
    var harm    = palette.harmonic;
    if (!cont) return;

    var time = Audio.ctx.currentTime;
    var freq = Follow.scaleFreq(ev.degree, cont.octave || 0);

    try { Audio.synth.play(cont.voice || 'epiano', time, freq, ev.vel, (cont.decay || 0.8) * 1.1); } catch (e) {}

    // Phase 2: occasionally add a harmonic stab (chord color)
    if (phase >= 2 && harm && Math.random() < 0.25) {
      var hFreq = Follow.scaleFreq(ev.degree + 4, harm.octave || 0);
      try { Audio.synth.play(harm.voice || 'epiano', time + 0.03, hFreq, ev.vel * 0.5, (harm.decay || 1.0) * 0.7); } catch (e) {}
    }
  }

  // ── PUBLIC API ────────────────────────────────────────────────────────

  function init() {
    oracleReset();
    motifCounts       = {};
    confirmedMotifs   = [];
    recentSyms        = [];
    recentDegrees     = [];
    recentIOIs        = [];
    restDegrees       = {};
    phraseHistory     = [];
    totalNotes        = 0;
    lastNoteTime      = 0;
    genActive         = false;
    genQueue          = [];
    silenceMs         = 0;
    phraseCount       = 0;
    loopCount         = 0;
    loopTemperature   = 0.10;
    beatDropFired     = false;
    beatDropPending   = false;
    lastPhraseHash    = null;
    genThisEpisode    = false;
    // Level 2
    phraseTypeAccum   = 0;
    phraseTypeCounter = 0;
    phraseTypeSeq     = [];
    phraseCounts2     = {};
    confirmedForms    = [];
    sectionA          = null;
    sectionB          = null;
    sectionMode       = null;
    crystalHarmony    = null;
    crystalSilenceMs  = 0;
    crystalPending    = true;
    crystalCooldownMs = 0;
    crystalCount      = 0;
  }

  // Called by follow.js when a tilt-melody note plays
  function onNote(degree, ioi, velocity) {
    var now = performance.now();
    var actualIOI = lastNoteTime > 0
      ? Math.max(80, Math.min(2000, now - lastNoteTime))
      : (ioi || 400);
    lastNoteTime  = now;
    lastVelocity  = velocity || 0.4;

    var sym = encode(degree, actualIOI, lastVelocity);
    oracleAdd(sym, actualIOI);
    checkMotifs(sym, degree, actualIOI);
    updateRestDegrees(degree, actualIOI);
    totalNotes++;

    if (genActive) cancelGeneration();
    silenceMs       = 0;
    genThisEpisode  = false; // new movement = new episode
    crystalSilenceMs = 0;
  }

  function setLens(l) {
    lens = l;
  }

  function update(dt, isSilent) {
    if (!lens || !Audio.ctx) return;
    if (Follow.phase < 1) return;

    // Beat drop fire (on next frame after detection)
    if (beatDropPending) {
      beatDropTimer += dt * 1000;
      if (beatDropTimer > 80) {
        beatDropPending = false;
        fireBeatDrop();
      }
    }

    if (crystalCooldownMs > 0) crystalCooldownMs -= dt * 1000;

    if (isSilent) {
      silenceMs    += dt * 1000;
      crystalSilenceMs += dt * 1000;
    } else {
      silenceMs        = 0;
      crystalSilenceMs = 0;
      if (genActive) cancelGeneration();
    }

    // ── Level 2: Crystallization ──────────────────────────────────────────
    // Fires when phrase-level forms are established + sustained silence.
    // Produces the HIGHER-ORDER PROGRESSION — sudden, majestic, then silence.
    if (isSilent && crystalSilenceMs >= CRYSTAL_SILENCE_MS
        && confirmedForms.length > 0 && crystalPending && crystalCooldownMs <= 0) {
      crystalSilenceMs = 0;
      fireCrystallization();
    }

    // ── Level 1: Note-oracle generation ──────────────────────────────────
    // One phrase per silence episode, only when not in crystal cooldown.
    if (isSilent && silenceMs >= GEN_SILENCE_MS && !genActive
        && !genThisEpisode && crystalCooldownMs <= 0) {
      buildPhrase();
    }

    // Play generated notes
    if (genActive && genQueue.length > 0) {
      genPlayedMs += dt * 1000;
      while (genNoteIdx < genQueue.length) {
        var ev = genQueue[genNoteIdx];
        if (genPlayedMs >= ev.delayMs) {
          playGenNote(ev);
          genNoteIdx++;
        } else { break; }
      }
      if (genNoteIdx >= genQueue.length) cancelGeneration();
    }
  }

  return Object.freeze({
    init:    init,
    onNote:  onNote,
    setLens: setLens,
    update:  update,
    get motifs()     { return confirmedMotifs.length; },
    get forms()      { return confirmedForms.length; },
    get section()    { return sectionMode || '-'; },
    get crystals()   { return crystalCount; },
    get notes()      { return totalNotes; },
    get loops()      { return loopCount; },
    get generating() { return genActive; },
    get dropped()    { return beatDropFired; },
  });

})();
