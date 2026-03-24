/**
 * HARMONY — The Unified Harmonic Engine
 *
 * Pure music theory. Computes, never plays.
 *
 * This module unifies ALL harmonic intelligence previously scattered across
 * follow.js: scales, chords, tension, gravity, voice leading, contours,
 * motif memory, harmonic rhythm, and the "I love you" melodic seed.
 *
 * No dependency on Audio, Follow, Body, or any other module.
 * Harmony is the grammar of music — it tells you WHAT is consonant,
 * WHERE melody wants to go, and HOW chords should move.
 * It never decides WHEN to play or what voice to use.
 *
 * Research foundation:
 *   - Discrete pitch, steady beat, repetition, octave equivalence
 *     are universal across 315 cultures (Mehr et al. 2019)
 *   - Only octaves are universally consonant; all other intervals
 *     are learned (McDermott et al. 2016, Tsimane study)
 *   - Modal characteristic chords define each mode's sound
 *     (Persichetti 1961)
 *   - Voice leading as geometry — minimal voice movement
 *     (Tymoczko 2011)
 *   - Two-phase dopamine: anticipation + resolution
 *     (Salimpoor et al. 2011)
 *   - The "I love you" arch contour: 3-5-1, universal melodic seed
 *     found in 10 of 14 languages studied (GUMP research, March 2026)
 *   - Repetition creates musicality independent of content
 *     (Margulis 2014)
 *
 * IIFE module pattern. const Harmony = (function(){ ... })();
 */

var Harmony = (function () {
  'use strict';

  // ════════════════════════════════════════════════════════════════════
  // 1. MODES — all scale definitions
  // ════════════════════════════════════════════════════════════════════
  //
  // Semitone intervals from root. 7-note modes use the standard
  // Western diatonic rotations. Pentatonic and blues are 5- and
  // 6-note subsets. Picardy is harmonic minor — the raised 7th
  // enables a major V chord in a minor context, giving the
  // Picardy third its resolution power.
  //
  // Source: standard music theory; universality of discrete pitch
  // confirmed by Savage et al. 2015, Mehr et al. 2019.

  var MODES = {
    major:      [0, 2, 4, 5, 7, 9, 11],
    minor:      [0, 2, 3, 5, 7, 8, 10],
    dorian:     [0, 2, 3, 5, 7, 9, 10],
    lydian:     [0, 2, 4, 6, 7, 9, 11],
    phrygian:   [0, 1, 3, 5, 7, 8, 10],
    mixolydian: [0, 2, 4, 5, 7, 9, 10],
    picardy:    [0, 2, 3, 5, 7, 8, 11],  // harmonic minor — Picardy resolves to major at cadence
    pentatonic: [0, 2, 4, 7, 9],
    blues:      [0, 3, 5, 6, 7, 10],
  };

  // ════════════════════════════════════════════════════════════════════
  // 2. MODAL CHORDS — each mode's characteristic chord
  // ════════════════════════════════════════════════════════════════════
  //
  // Every mode has a defining chord that makes it sound like ITSELF,
  // not like major with different notes. Generic I-IV-V makes every
  // mode sound the same. These don't.
  //
  // `color` = the scale degree that gives the mode its flavor
  //   (used when energy is moderate — "show me what mode we're in")
  // `tension` = the scale degree that creates maximum forward motion
  //   (used when energy is high — "push toward resolution")
  //
  // Source: Persichetti 1961, "Twentieth-Century Harmony"

  var MODAL_CHORDS = {
    dorian:     { color: 3, colorName: 'IV',   tension: 4, tensionName: 'v'    },  // major IV = Dorian's soul
    lydian:     { color: 1, colorName: 'II',   tension: 6, tensionName: 'vii'  },  // major II = Lydian wonder
    phrygian:   { color: 1, colorName: 'bII',  tension: 6, tensionName: 'bVII' },  // bII = Phrygian dread
    mixolydian: { color: 6, colorName: 'bVII', tension: 4, tensionName: 'v'    },  // bVII = Mixolydian float
    major:      { color: 3, colorName: 'IV',   tension: 4, tensionName: 'V'    },  // standard
    minor:      { color: 5, colorName: 'bVI',  tension: 4, tensionName: 'v'    },  // bVI = minor's dramatic chord
    picardy:    { color: 5, colorName: 'bVI',  tension: 6, tensionName: 'VII'  },  // harmonic minor drama
    pentatonic: { color: 3, colorName: 'IV',   tension: 4, tensionName: 'V'    },
    blues:      { color: 3, colorName: 'IV',   tension: 4, tensionName: 'V'    },
  };

  // ════════════════════════════════════════════════════════════════════
  // 13. MODE-AWARE CHORD QUALITIES
  // ════════════════════════════════════════════════════════════════════
  //
  // Each scale degree in each mode has a specific chord quality
  // determined by the intervals of the mode itself. A ii chord in
  // major is minor. A II chord in lydian is major. A ii chord in
  // dorian is minor. Getting this right is what makes modes sound
  // like modes.
  //
  // 'M' = major, 'm' = minor, 'd' = diminished, 'A' = augmented
  //
  // Source: standard diatonic harmony; Persichetti 1961

  var MODE_CHORD_QUALITIES = {
    major:      ['M', 'm', 'm', 'M', 'M', 'm', 'd'],  // I ii iii IV V vi vii-dim
    minor:      ['m', 'd', 'M', 'm', 'm', 'M', 'M'],  // i ii-dim III iv v VI VII
    dorian:     ['m', 'm', 'M', 'M', 'm', 'd', 'M'],  // i ii III IV v vi-dim VII
    lydian:     ['M', 'M', 'm', 'd', 'M', 'm', 'm'],  // I II iii iv-dim V vi vii
    phrygian:   ['m', 'M', 'M', 'm', 'd', 'M', 'm'],  // i II III iv v-dim VI vii
    mixolydian: ['M', 'm', 'd', 'M', 'm', 'm', 'M'],  // I ii iii-dim IV v vi VII
    picardy:    ['m', 'd', 'A', 'm', 'M', 'M', 'd'],  // i ii-dim III+ iv V VI vii-dim
  };

  // Triad intervals from root for each quality (in semitones)
  var QUALITY_INTERVALS = {
    'M': [0, 4, 7],     // major: root, major 3rd, perfect 5th
    'm': [0, 3, 7],     // minor: root, minor 3rd, perfect 5th
    'd': [0, 3, 6],     // diminished: root, minor 3rd, tritone
    'A': [0, 4, 8],     // augmented: root, major 3rd, augmented 5th
  };

  // ════════════════════════════════════════════════════════════════════
  // 7. DEGREE TENSION MAP — consonance ranking
  // ════════════════════════════════════════════════════════════════════
  //
  // 0 = most consonant (root), 1 = most dissonant (tritone).
  // Used by gravitateDegree() and by flow.js for velocity shaping.
  //
  // The ranking: root > 5th > 3rd > 2nd > 4th > 7th > tritone.
  // This maps to the overtone series: lower partials = more consonant.
  //
  // Source: Plomp & Levelt 1965 (critical bandwidth basis for
  // consonance), Helmholtz roughness theory.

  var DEGREE_TENSION = [
    0.00,   // 0 — root (tonic). Maximum consonance.
    0.45,   // 1 — 2nd. Mild tension.
    0.25,   // 2 — 3rd. Consonant. Defines major/minor quality.
    0.55,   // 3 — 4th. Moderate tension. Wants to resolve down.
    0.15,   // 4 — 5th. Nearly as consonant as root. The anchor.
    0.65,   // 5 — 6th. Tension. Creates longing.
    0.90,   // 6 — 7th. High tension. Tritone adjacent. Demands resolution.
  ];

  // ── PRIME HARMONIC WEIGHT — the overtone series weighted by prime independence
  // Each prime in the overtone series opens a harmonic dimension that
  // can't be reduced to combinations of smaller primes:
  //   1 = root (unison), 3 = fifth, 5 = major third, 7 = natural seventh
  // This is Harry Partch's "limit" system — 7-limit is the richest
  // harmonic space the ear clearly perceives.
  // The same values (1,3,5,7) appear as electron orbital degeneracy
  // (s=1,p=3,d=5,f=7) — but this is a low-number coincidence between
  // odd numbers and odd primes, not a shared structure. They diverge
  // at the 5th term (orbitals give 9, primes skip it).
  // The REAL connection: both are eigenvalue solutions to the wave equation.
  // Source: Partch "Genesis of a Music" (1949), Xenharmonic Wiki 7-limit.
  //
  // Weight: how strongly each scale degree pulls when the session is curing.
  // Degrees aligned with prime harmonics pull hardest.
  var PRIME_HARMONIC_WEIGHT = [
    1.00,   // 0 — root. Prime 1. The fundamental.
    0.20,   // 1 — 2nd. Not a low prime harmonic.
    0.70,   // 2 — 3rd. Prime 5 (5:4 ratio). Third new color.
    0.30,   // 3 — 4th. Prime 2² (4:3). Composite, not new.
    0.85,   // 4 — 5th. Prime 3 (3:2 ratio). Second new color.
    0.25,   // 5 — 6th. Composite (2×3). No new prime.
    0.55,   // 6 — 7th. Prime 7 (7:4 ratio). The blue note. Fourth new color.
  ];

  // ════════════════════════════════════════════════════════════════════
  // 4. MELODIC CONTOURS — the "I love you" arch and variants
  // ════════════════════════════════════════════════════════════════════
  //
  // The "I love you" research found the ARCH (rise-peak-fall) is
  // universal across 10 of 14 languages analyzed. The peak lands
  // on "love" — scale degree 5. The seed: 3-5-1 (approach, arrive,
  // depart). Same shape as a breath. Same shape as a dopamine arc.
  //
  // These contours are GRAVITY WELLS for melody, not commands.
  // The user can always override by tilting differently. But when
  // the system needs a suggestion, it reaches for shapes every
  // human body already knows.
  //
  // Source: GUMP "I love you" cross-linguistic study, March 2026;
  // arch shape as universal declaration pattern.

  var CONTOURS = {
    rising:   [0, 1, 2, 3, 4, 5, 6, 7],           // building energy
    falling:  [7, 6, 5, 4, 3, 2, 1, 0],           // releasing, resolving
    arch:     [1, 3, 5, 7, 5, 3, 1, 0],           // the "I love you" shape: approach - peak - home
    question: [1, 3, 5, 5, 7, 7, 5, 5],           // ends suspended — French "je t'aime" (no resolution)
    answer:   [5, 4, 3, 2, 1, 0, 0, 0],           // descent to rest
    love:     [3, 5, 1, 3, 5, 1, 3, 5],           // the universal seed repeating — 3-5-1 cycle
    plateau:  [3, 3, 4, 4, 3, 3, 2, 3],           // Japanese "aishiteru" (restraint as expression)
  };

  // ════════════════════════════════════════════════════════════════════
  // 11. THE "I LOVE YOU" SEED — 3-5-1 as fundamental melodic attractor
  // ════════════════════════════════════════════════════════════════════
  //
  // Three notes: approach - ARRIVE - depart. Scale degrees 3-5-1.
  // An anacrusis-downbeat-resolution pattern. The most fundamental
  // pattern in Western music — and apparently in human emotional
  // declaration across cultures.
  //
  // Key data (from research.md):
  //   English:  3-5-1   Arch
  //   Russian:  3-2-3-5-3   Ramp
  //   French:   1-5     Rise (half-cadence — asks for response)
  //   Spanish:  2-5-3   Arch
  //   Arabic:   1-5-3-1 Full Arch
  //   Korean:   3-5-3   Arch
  //   German:   3-5-3-1 Arch
  //   Italian:  2-5-3   Arch
  //
  // The seed is used by the contour system. The `love` contour
  // repeats it. The `arch` contour embodies its shape.

  var LOVE_SEED = [3, 5, 1];

  // Cultural variants — available for GPS Music (Phase 3)
  var LOVE_SEEDS = {
    english:  [3, 5, 1],
    russian:  [3, 2, 3, 5, 3],
    french:   [1, 5],
    spanish:  [2, 5, 3],
    arabic:   [1, 5, 3, 1],
    japanese: [1, 3, 3, 3, 1],
    korean:   [3, 5, 3],
    german:   [3, 5, 3, 1],
    italian:  [2, 5, 3],
    hawaiian: [3, 5, 3, 1, 1, 3, 2],
  };

  // ════════════════════════════════════════════════════════════════════
  // STATE — all mutable harmonic state lives here
  // ════════════════════════════════════════════════════════════════════

  var _root = 432;                   // Hz
  var _mode = 'major';               // mode name
  var _scale = MODES.major;          // current scale intervals

  // Melodic memory
  var _melodicHistory = [];          // recent scale degrees (up to 8)
  var _harmonicTension = 0;          // 0-1, weighted average of recent tensions
  var _melodicCentroid = 0;          // smoothed average pitch region
  var _lastHistoryDeg = null;        // last degree recorded

  // Phrase state
  var _phraseNoteCount = 0;          // notes since last phrase breath
  var _phraseBreathing = false;      // true during phrase breath pause
  var _breathingTimer = 0;           // ms remaining in breath
  var _phraseContour = 'arch';       // current contour name
  var _contourBias = null;           // lens-preferred contour (set by configure)
  var _phraseActive = false;         // whether a phrase is in progress

  // Harmonic rhythm — energy-driven chord changes (NOT timer-driven)
  // Source: the body drives harmony. Prodigy's arc determines when
  // harmony moves. This is the clock rule: no clocks make musical
  // decisions.
  var _hrTimer = 0;                  // ms since last change
  var _hrState = 'root';             // 'root' | 'color' | 'tension'
  var _hrDegOffset = 0;              // current scale degree offset

  // V-I harmonic gravity — the bass cadence system
  var _gravityState = 'tonic';       // 'tonic' | 'dominant' | 'resolving'
  var _gravityTimer = 0;             // seconds in current state
  var _gravityTonicDur = 20;         // seconds before moving to dominant
  var _gravityDomDur = 0;            // seconds to hold dominant
  var _gravityDidResolve = false;    // whether silence triggered resolution

  // 14. Silence memory — last degree before void becomes seed for
  // first degree after. The conversation continues across silence.
  var _silenceSeed = 0;              // degree before void
  var _silenceSeedSet = false;       // whether a seed was captured

  // ════════════════════════════════════════════════════════════════════
  // 5. MOTIF MEMORY — gravitational, not playback
  // ════════════════════════════════════════════════════════════════════
  //
  // Records interval patterns (NOT absolute pitches). Creates 30%
  // pull toward recognized motifs. The user can ALWAYS override.
  //
  // This is what makes melody feel composed rather than random.
  // The system never plays for you. It creates gentle resonances —
  // like an instrument with sympathetic strings that make your own
  // patterns easier to find again.
  //
  // Source: Repetition creates musicality independent of content
  // (Margulis 2014). Motif development is the basis of Western
  // composition (Schoenberg, "Fundamentals of Musical Composition").

  var MOTIF_LENGTH = 4;              // notes per motif
  var MOTIF_MAX = 6;                 // max stored motifs (rolling window)
  var MOTIF_PULL_MIN = 0.05;         // pull on first appearance (wet pour)
  var MOTIF_PULL_MAX = 0.55;         // pull after 6+ reps (cured foundation)
  var MOTIF_CURE_REPS = 6;           // Margulis: 6-8 reps = music

  var _motifs = [];                  // stored motifs: { intervals, count }
  var _motifBuffer = [];             // current fragment being recorded
  var _motifCooldown = 0;            // seconds until next motif suggestion
  var _sessionMaturity = 0;          // 0 (wet) to 1 (cured), builds with repetition

  // ════════════════════════════════════════════════════════════════════
  // 10. SWEET SPOTS — gravitational wells for tilt-to-pitch mapping
  // ════════════════════════════════════════════════════════════════════
  //
  // Instead of linear mapping, tilt maps through gravitational wells
  // at each scale degree. Between wells = tension (pitch bends).
  // Settling into a well = clear note (resolution). The phone becomes
  // a fretted instrument you feel with your wrist.
  //
  // sweetSpotPull: 0 = no frets (continuous slider)
  //                1 = hard frets (piano keys)
  //                0.45 = default (guitar-like: fretted but bendable)

  var DEFAULT_SWEET_SPOT_PULL = 0.45;  // overridden by session maturity below
  var SWEET_SPOT_PULL_WET = 0.12;     // start open — almost free, barely any frets
  var SWEET_SPOT_PULL_CURED = 0.55;   // cured — strong frets, the instrument knows you
  var SWEET_SPOT_RADIUS = 0.35;       // how close to a degree before gravity kicks in

  // ════════════════════════════════════════════════════════════════════
  // 3. scaleFreq — convert scale degree to frequency
  // ════════════════════════════════════════════════════════════════════
  //
  // Maps a scale degree (which can be negative or span multiple
  // octaves) to a frequency in Hz, using the current root and scale.
  //
  // The math: each scale degree maps to a semitone offset via the
  // current mode. Octave wrapping handles degrees outside the scale
  // length. Equal temperament: freq = root * 2^(semitones/12).
  //
  // Source: 12-TET is the standard Western tuning system. The root
  // default of 432 Hz is a deliberate choice (Verdi tuning).

  function scaleFreq(degree, octave) {
    var len = _scale.length;
    var oct = Math.floor(degree / len);
    var deg = ((degree % len) + len) % len;
    var semi = _scale[deg] + (oct + (octave || 0)) * 12;
    return _root * Math.pow(2, semi / 12);
  }

  /**
   * Convert an array of scale degrees to an array of frequencies.
   * Convenience for chord voicings.
   *
   * @param {number[]} degrees - scale degrees
   * @param {number} [octave=0] - octave offset
   * @returns {number[]} frequencies in Hz
   */
  function chordFreqs(degrees, octave) {
    var result = [];
    for (var i = 0; i < degrees.length; i++) {
      result.push(scaleFreq(degrees[i], octave || 0));
    }
    return result;
  }

  // ════════════════════════════════════════════════════════════════════
  // RECORDING — melodic history, tension tracking, motif capture
  // ════════════════════════════════════════════════════════════════════

  /**
   * Record a note event. Updates melodic history, harmonic tension,
   * melodic centroid, phrase state, silence seed, and motif buffer.
   *
   * Called by flow.js whenever a note actually plays.
   *
   * @param {number} deg - the scale degree that was played
   */
  function recordNote(deg) {
    var scaleDeg = ((_normalDeg(deg)) % _scale.length + _scale.length) % _scale.length;

    // History — rolling window of 8
    _melodicHistory.push(scaleDeg);
    if (_melodicHistory.length > 8) _melodicHistory.shift();
    _lastHistoryDeg = scaleDeg;

    // Phrase breathing — rule of threes.
    // After 2+ tension notes, landing on a consonant degree triggers
    // a brief breath (480ms pause). Musical phrasing, not metronome.
    var isConsonant = (scaleDeg === 0 || scaleDeg === 2 || scaleDeg === 4);
    if (_phraseNoteCount >= 2 && isConsonant) {
      _phraseNoteCount = 0;
      _phraseBreathing = true;
      _breathingTimer = 480;
    } else {
      _phraseNoteCount++;
    }

    // Melodic centroid — slow-moving average of pitch region
    _melodicCentroid += (scaleDeg - _melodicCentroid) * 0.06;

    // Harmonic tension — weighted average of recent degree tensions,
    // recency-weighted so newer notes matter more
    if (_melodicHistory.length > 0) {
      var sum = 0, w = 0;
      for (var i = 0; i < _melodicHistory.length; i++) {
        var wi = (i + 1) / _melodicHistory.length;
        sum += (DEGREE_TENSION[_melodicHistory[i]] || 0.35) * wi;
        w += wi;
      }
      _harmonicTension = sum / w;
    }

    // Silence seed — always track the last degree played.
    // When silence arrives, this becomes the seed for reentry.
    _silenceSeed = scaleDeg;
    _silenceSeedSet = true;

    // Motif recording — capture intervals, not absolute pitches
    // Track repetition count: when a motif repeats, the music cures
    _motifBuffer.push(deg);
    if (_motifBuffer.length >= MOTIF_LENGTH) {
      var intervals = [];
      for (var mi = 1; mi < _motifBuffer.length; mi++) {
        intervals.push(_motifBuffer[mi] - _motifBuffer[0]);
      }
      // Check if this motif already exists (within tolerance)
      var found = false;
      for (var mj = 0; mj < _motifs.length; mj++) {
        var existing = _motifs[mj].intervals;
        if (existing.length === intervals.length) {
          var match = true;
          for (var mk = 0; mk < existing.length; mk++) {
            if (Math.abs(existing[mk] - intervals[mk]) > 1) { match = false; break; }
          }
          if (match) {
            _motifs[mj].count++;
            found = true;
            // Update session maturity — each rep cures the foundation
            _sessionMaturity = Math.min(1, _sessionMaturity + 0.04);
            break;
          }
        }
      }
      if (!found) {
        _motifs.push({ intervals: intervals, count: 1 });
        if (_motifs.length > MOTIF_MAX) _motifs.shift();
      }
      _motifBuffer = [];
    }
  }

  /**
   * Normalize degree to non-negative for tension lookup.
   * @param {number} deg
   * @returns {number}
   */
  function _normalDeg(deg) {
    return ((deg % _scale.length) + _scale.length) % _scale.length;
  }

  // ════════════════════════════════════════════════════════════════════
  // 6. HARMONIC GRAVITY — gravitateDegree()
  // ════════════════════════════════════════════════════════════════════
  //
  // Pulls melody toward consonant tones based on tension level and
  // phrase position. The pull is configurable — a lens can set it
  // to zero (every note valid) or high (strong tonal gravity).
  // The user's tilt always has the final word.
  //
  // Three behaviors:
  //   1. Early session (phase 0): constrain to [root, 3rd, 5th] only.
  //      The user discovers they can make tonal music immediately.
  //   2. After 2+ tension notes: 70% pull toward resolution tones
  //      [root, 3rd, 5th, octave]. Musical grammar: tension resolves.
  //   3. High accumulated tension: proportional pull toward root or 5th.
  //
  // Source: tension-resolution is the basis of tonal music (Meyer 1956).
  // Two-phase dopamine: anticipation during tension, release during
  // resolution (Salimpoor et al. 2011).
  //
  // @param {number} rawDeg - the raw scale degree from tilt mapping
  // @param {number} [sessionPhase=2] - 0=early, 1=developing, 2=full
  // @returns {number} the gravity-adjusted degree

  function gravitateDegree(rawDeg, sessionPhase) {
    if (sessionPhase === undefined) sessionPhase = 2;

    // CURE TIME: Phase 0 is now WIDE OPEN — the wet pour.
    // Every note is valid. The music hasn't cured yet.
    // As sessionMaturity grows, prime harmonic tones pull harder.
    // The 1,3,5,7 structure: root, fifth, third, blue note
    // get weighted proportional to maturity × their prime weight.

    // After 2+ notes: phrase wants to breathe — pull toward resolution
    if (_phraseNoteCount >= 2) {
      var resolveTones = [0, 2, 4, 7];
      var best2 = 0, bestD2 = 999;
      for (var ri = 0; ri < resolveTones.length; ri++) {
        var d2 = Math.abs(rawDeg - resolveTones[ri]);
        if (d2 < bestD2) { bestD2 = d2; best2 = resolveTones[ri]; }
      }
      return Math.round(rawDeg * 0.30 + best2 * 0.70);
    }

    // Prime harmonic gravity — scales with session maturity (cure time)
    // As the session cures, notes aligned with prime harmonics (1,3,5,7)
    // pull harder. The music crystallizes around fundamental intervals.
    if (_sessionMaturity > 0.1) {
      var nd = _normalDeg(Math.round(rawDeg));
      var primeWeight = (nd < PRIME_HARMONIC_WEIGHT.length) ? PRIME_HARMONIC_WEIGHT[nd] : 0.2;
      var primePull = _sessionMaturity * primeWeight * 0.25;
      var nearest = Math.round(rawDeg);
      rawDeg = rawDeg * (1 - primePull) + nearest * primePull;
    }

    // Tension-proportional pull toward root or fifth
    if (_harmonicTension < 0.45) return rawDeg;
    var pull = Math.min(1, (_harmonicTension - 0.45) / 0.55);
    var target = _harmonicTension > 0.75 ? 0 : 4;
    return Math.round(rawDeg * (1 - pull * 0.40) + target * pull * 0.40);
  }

  // ════════════════════════════════════════════════════════════════════
  // CONTOUR FUNCTIONS — phrase shape selection and degree lookup
  // ════════════════════════════════════════════════════════════════════

  /**
   * Select a phrase contour based on the current motion archetype.
   *
   * 12. Contour as gravity well — the arch shape naturally draws
   * melody through it. These are suggestions the body already knows.
   *
   * @param {string} [archetype] - 'waving', 'walking', 'bouncing', or null
   * @param {string} [lensShape] - lens-configured preferred shape
   */
  function pickPhraseContour(archetype, lensShape) {
    var options;
    switch (archetype) {
      case 'waving':   options = ['arch', 'question', 'rising']; break;
      case 'walking':  options = ['rising', 'answer', 'arch'];   break;
      case 'bouncing': options = ['rising', 'arch'];             break;
      default:
        options = lensShape
          ? [lensShape, lensShape, 'arch']
          : ['arch', 'rising', 'falling', 'question', 'answer', 'love'];
        break;
    }
    _phraseContour = options[Math.floor(Math.random() * options.length)];
    return _phraseContour;
  }

  /**
   * Get the suggested scale degree for a given position within
   * the current phrase contour.
   *
   * @param {number} arc - phrase arc position, 0 to 1
   * @returns {number} suggested scale degree
   */
  function getContourDegree(arc) {
    var steps = CONTOURS[_phraseContour] || CONTOURS.arch;
    var idx = Math.min(steps.length - 1, Math.floor(arc * steps.length));
    return steps[idx];
  }

  // ════════════════════════════════════════════════════════════════════
  // 5. MOTIF FUNCTIONS — gravitational pull toward recognized patterns
  // ════════════════════════════════════════════════════════════════════

  /**
   * Check if the recent melodic history matches the beginning of a
   * stored motif. If so, return the suggested next degree with 30%
   * pull strength.
   *
   * The pull is ALWAYS overridable. The user's tilt dominates.
   * This is gravity, not playback.
   *
   * Source: Margulis 2014 — repetition creates musicality.
   *
   * @param {number} currentDeg - the degree the user is currently at
   * @returns {number} the gravity-adjusted degree (unchanged if no motif match)
   */
  function applyMotifGravity(currentDeg) {
    if (_motifs.length === 0 || _melodicHistory.length < 2) {
      return currentDeg;
    }

    var recent1 = _melodicHistory[_melodicHistory.length - 1] || 0;
    var recent2 = _melodicHistory[_melodicHistory.length - 2] || 0;
    var recentInterval = recent1 - recent2;

    for (var mj = 0; mj < _motifs.length; mj++) {
      var motif = _motifs[mj];
      var intervals = motif.intervals || motif;
      var count = motif.count || 1;
      // Does the most recent interval match the start of this motif?
      if (intervals.length >= 2 && Math.abs(intervals[0] - recentInterval) <= 1) {
        // Suggest the next interval in the motif
        var suggestDeg = recent1 + intervals[1];
        // Pull scales with repetition: 5% on first hear → 55% after 6+ reps
        // The music CURES around your patterns
        var cureFactor = Math.min(1, (count - 1) / (MOTIF_CURE_REPS - 1));
        var pull = MOTIF_PULL_MIN + cureFactor * (MOTIF_PULL_MAX - MOTIF_PULL_MIN);
        return Math.round(currentDeg * (1 - pull) + suggestDeg * pull);
      }
    }

    return currentDeg;
  }

  /**
   * Update motif cooldown timer. Call once per frame.
   *
   * @param {number} dt - delta time in seconds
   */
  function updateMotifCooldown(dt) {
    if (_motifCooldown > 0) _motifCooldown -= dt;
  }

  // ════════════════════════════════════════════════════════════════════
  // 10. SWEET SPOTS — gravitational wells for tilt-to-pitch mapping
  // ════════════════════════════════════════════════════════════════════

  /**
   * Apply sweet spot gravity to a raw tilt-derived degree value.
   * Creates gravitational wells at integer scale degrees.
   *
   * The phone becomes a fretted instrument you feel with your wrist.
   * Between wells = pitch bend (tension). In a well = clear note.
   *
   * @param {number} rawDegree - continuous degree from tilt mapping (e.g. 3.7)
   * @param {number} [pullStrength] - 0 = no frets, 1 = hard frets. Default 0.45.
   * @returns {number} gravity-adjusted continuous degree
   */
  function applySweetSpot(rawDegree, pullStrength) {
    // Cure time: pull starts low (wet pour) and increases as session matures
    var maturityPull = SWEET_SPOT_PULL_WET + _sessionMaturity * (SWEET_SPOT_PULL_CURED - SWEET_SPOT_PULL_WET);
    var pull = (pullStrength !== undefined) ? pullStrength : maturityPull;
    var nearest = Math.round(rawDegree);
    var dist = rawDegree - nearest;

    if (Math.abs(dist) < SWEET_SPOT_RADIUS) {
      // Within a sweet spot — pull toward the note
      var strength = (1 - Math.abs(dist) / SWEET_SPOT_RADIUS) * pull;
      return rawDegree * (1 - strength) + nearest * strength;
    }

    return rawDegree;
  }

  // ════════════════════════════════════════════════════════════════════
  // 9. HARMONIC RHYTHM — energy-driven chord changes
  // ════════════════════════════════════════════════════════════════════
  //
  // Chords change on ENERGY SHIFTS, not a clock. When the user's
  // energy direction changes (rising-to-falling or vice versa),
  // THAT is when harmony should move. The body drives the chord
  // changes.
  //
  // Minimum 4 seconds between changes (prevent flicker).
  // Maximum 20 seconds (prevent stasis).
  //
  // Source: the clock rule — no clocks make musical decisions.
  // The body drives everything (Phillips-Silver & Trainor 2005).

  /**
   * Update the harmonic rhythm system. Returns chord change info
   * when a change occurs, null otherwise.
   *
   * @param {number} dt - delta time in seconds
   * @param {string} energyArc - 'rising' | 'falling' | 'plateau' | 'volatile'
   * @param {number} bodyEnergy - current body energy level (0-1+)
   * @param {boolean} isSilent - whether the user is in silence
   * @param {number} [rhythmConfidence=0] - how steady the user's rhythm is (0-1)
   * @param {number} [phraseEnergyArc=0.5] - phrase energy position (0-1)
   * @returns {Object|null} { state, degOffset, modeName } if chord changed, null otherwise
   */
  function updateHarmonicRhythm(dt, energyArc, bodyEnergy, isSilent, rhythmConfidence, phraseEnergyArc) {
    if (isSilent || bodyEnergy < 0.12) return null;

    _hrTimer += dt * 1000;

    // Minimum 4 seconds between changes
    if (_hrTimer < 4000) return null;

    // Detect energy shift
    var energyShift = false;
    if (energyArc === 'rising' && _hrState !== 'root') energyShift = true;
    if (energyArc === 'falling' && _hrState === 'root') energyShift = true;
    if (energyArc === 'volatile' && _hrTimer > 6000) energyShift = true;
    if (_hrTimer > 20000) energyShift = true;  // safety — prevent stagnation

    if (!energyShift) return null;
    _hrTimer = 0;

    var modeChords = MODAL_CHORDS[_mode] || MODAL_CHORDS.major;

    if (_hrState === 'root') {
      var useTension = ((phraseEnergyArc || 0.5) > 0.55 || (rhythmConfidence || 0) > 0.5);
      _hrState = useTension ? 'tension' : 'color';
      _hrDegOffset = useTension ? modeChords.tension : modeChords.color;
    } else {
      _hrState = 'root';
      _hrDegOffset = 0;
    }

    return {
      state: _hrState,
      degOffset: _hrDegOffset,
      modeName: _mode,
      colorName: _hrState === 'color' ? modeChords.colorName : (_hrState === 'tension' ? modeChords.tensionName : 'I'),
    };
  }

  // ════════════════════════════════════════════════════════════════════
  // V-I HARMONIC GRAVITY — the bass cadence system
  // ════════════════════════════════════════════════════════════════════
  //
  // Bass walks to V (dominant), then resolves home to I (tonic).
  // The melody stays in the tonic key the whole time.
  // Tension comes from the bass, resolution is the payoff.
  //
  //   tonic (18-26s) -> V bass -> dominant hold (8-12s) -> V-I cadence -> tonic
  //
  // Returns cadence events for flow.js/sound.js to execute.
  //
  // Source: V-I is the most fundamental cadence in tonal music.
  // Two-phase dopamine (Salimpoor et al. 2011): the dominant hold
  // is anticipation (caudate), the resolution is experience
  // (nucleus accumbens).

  /**
   * Update the V-I harmonic gravity system.
   *
   * @param {number} dt - delta time in seconds
   * @param {number} bodyEnergy - current body energy (0-1+)
   * @param {boolean} isSilent - whether the user is in silence
   * @returns {Object|null} cadence event or null
   *   { type: 'dominant_enter' | 'resolve' | 'resolved', rootHz, dominantHz }
   */
  function updateHarmonicGravity(dt, bodyEnergy, isSilent) {
    if (bodyEnergy < 0.10) return null;

    _gravityTimer += dt;

    if (_gravityState === 'tonic') {
      if (isSilent) { _gravityTimer = 0; _gravityDidResolve = false; return null; }

      if (_gravityTimer >= _gravityTonicDur) {
        _gravityState = 'dominant';
        _gravityTimer = 0;
        _gravityDomDur = 8 + Math.random() * 5;

        // Return event: announce the V
        return {
          type: 'dominant_enter',
          rootHz: _root,
          dominantHz: _root * 1.498,  // just below 3:2 — equal temperament fifth
        };
      }

    } else if (_gravityState === 'dominant') {
      var silenceResolve = isSilent && !_gravityDidResolve;
      if (silenceResolve || _gravityTimer >= _gravityDomDur) {
        _gravityDidResolve = silenceResolve;
        _gravityState = 'resolving';
        _gravityTimer = 0;

        // Reset harmonic rhythm to root
        _hrState = 'root';
        _hrDegOffset = 0;

        // Return event: V-I resolution — the payoff
        return {
          type: 'resolve',
          rootHz: _root,
          dominantHz: _root * 1.498,
        };
      }

    } else if (_gravityState === 'resolving') {
      if (_gravityTimer > 1.2) {
        _gravityState = 'tonic';
        _gravityTimer = 0;
        _gravityTonicDur = 18 + Math.random() * 10;

        return { type: 'resolved', rootHz: _root };
      }
    }

    return null;
  }

  // ════════════════════════════════════════════════════════════════════
  // 8. VOICE LEADING — minimize total voice movement
  // ════════════════════════════════════════════════════════════════════
  //
  // Tymoczko 2011: chords that move as blocks sound mechanical.
  // Chords where voices move independently by the smallest possible
  // intervals sound inevitable. The best transitions:
  //   1. Minimize total semitone distance across all voices
  //   2. Retain common tones (don't move a voice if it doesn't have to)
  //   3. Prefer contrary motion to bass
  //
  // This function works in semitone space (not Hz) for accuracy,
  // then converts back to Hz at the end.

  /**
   * Find the optimal voicing for a target chord given the current voicing.
   *
   * @param {number[]} currentFreqs - current voicing as frequencies [Hz, Hz, Hz]
   * @param {number[]} targetDegrees - target chord as scale degrees [0, 3, 4]
   * @param {number} [octave=0] - base octave for the target chord
   * @returns {number[]} optimal voicing as frequencies
   */
  function voiceLead(currentFreqs, targetDegrees, octave) {
    if (!currentFreqs || currentFreqs.length === 0) {
      return chordFreqs(targetDegrees, octave || 0);
    }

    var voices = currentFreqs.length;
    var targetVoices = targetDegrees.length;

    // Convert current frequencies to semitones from root
    var currentSemis = [];
    for (var ci = 0; ci < voices; ci++) {
      currentSemis.push(_freqToSemi(currentFreqs[ci]));
    }

    // Generate candidate voicings: target chord across nearby octaves
    // For each target degree, consider it at octave-1, octave, octave+1
    var baseOct = octave || 0;
    var candidates = _generateVoicings(targetDegrees, baseOct, targetVoices);

    // Score each candidate by total voice movement
    var bestVoicing = null;
    var bestScore = Infinity;

    for (var vi = 0; vi < candidates.length; vi++) {
      var candidate = candidates[vi];
      var score = _scoreVoicing(currentSemis, candidate);

      if (score < bestScore) {
        bestScore = score;
        bestVoicing = candidate;
      }
    }

    // Convert winning voicing from semitones back to Hz
    if (!bestVoicing) return chordFreqs(targetDegrees, baseOct);

    var result = [];
    for (var ri = 0; ri < bestVoicing.length; ri++) {
      result.push(_root * Math.pow(2, bestVoicing[ri] / 12));
    }
    return result;
  }

  /**
   * Convert a frequency to semitones from root.
   * @param {number} freq
   * @returns {number} semitones
   */
  function _freqToSemi(freq) {
    if (freq <= 0 || _root <= 0) return 0;
    return 12 * Math.log2(freq / _root);
  }

  /**
   * Generate candidate voicings for a chord across nearby octaves.
   * Each voice can be placed at oct-1, oct, or oct+1.
   *
   * @param {number[]} degrees - scale degrees
   * @param {number} baseOct - base octave
   * @param {number} voiceCount - number of voices to fill
   * @returns {number[][]} array of candidate voicings (semitone arrays)
   */
  function _generateVoicings(degrees, baseOct, voiceCount) {
    var candidates = [];
    var octaves = [baseOct - 1, baseOct, baseOct + 1];

    // Generate all combinations of octave placements for each degree.
    // For 3 degrees * 3 octaves = 27 candidates. Manageable.
    var degCount = degrees.length;

    // If voiceCount matches degCount, enumerate direct combinations
    if (voiceCount === degCount) {
      _enumerateVoicings(degrees, octaves, 0, [], candidates);
    } else {
      // Pad or trim degrees to match voice count
      var padded = [];
      for (var pi = 0; pi < voiceCount; pi++) {
        padded.push(degrees[pi % degCount]);
      }
      _enumerateVoicings(padded, octaves, 0, [], candidates);
    }

    return candidates;
  }

  /**
   * Recursive enumeration of octave placements.
   */
  function _enumerateVoicings(degrees, octaves, idx, current, results) {
    if (idx >= degrees.length) {
      results.push(current.slice());
      return;
    }

    var deg = degrees[idx];
    var len = _scale.length;
    var normDeg = ((deg % len) + len) % len;
    var octWrap = Math.floor(deg / len);
    var semi = _scale[normDeg];

    for (var oi = 0; oi < octaves.length; oi++) {
      current.push(semi + (octaves[oi] + octWrap) * 12);
      _enumerateVoicings(degrees, octaves, idx + 1, current, results);
      current.pop();
    }
  }

  /**
   * Score a candidate voicing against the current voicing.
   * Lower = better. Penalizes large movements, rewards common tones.
   *
   * Uses the Hungarian-algorithm-inspired greedy approach:
   * for each current voice, find the closest candidate voice.
   *
   * @param {number[]} currentSemis - current voicing in semitones
   * @param {number[]} candidateSemis - candidate voicing in semitones
   * @returns {number} score (lower = better)
   */
  function _scoreVoicing(currentSemis, candidateSemis) {
    var cLen = currentSemis.length;
    var tLen = candidateSemis.length;
    var used = [];
    for (var ui = 0; ui < tLen; ui++) used.push(false);

    var totalDist = 0;
    var commonTones = 0;

    // Greedy matching: for each current voice, find closest unused target voice
    for (var ci = 0; ci < cLen; ci++) {
      var bestIdx = -1;
      var bestDist = Infinity;

      for (var ti = 0; ti < tLen; ti++) {
        if (used[ti]) continue;
        var dist = Math.abs(currentSemis[ci] - candidateSemis[ti]);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = ti;
        }
      }

      if (bestIdx >= 0) {
        used[bestIdx] = true;
        totalDist += bestDist;
        // Common tone bonus: voices that don't move get rewarded
        if (bestDist < 0.5) commonTones++;
      }
    }

    // Score: total distance minus common tone bonus
    // Each common tone saves 2 semitones of "cost"
    return totalDist - commonTones * 2;
  }

  // ════════════════════════════════════════════════════════════════════
  // 13. MODE-AWARE CHORD QUALITY FUNCTIONS
  // ════════════════════════════════════════════════════════════════════

  /**
   * Get the chord quality (major/minor/diminished/augmented) for a
   * given scale degree in the current mode.
   *
   * @param {number} degree - scale degree (0-indexed)
   * @param {string} [modeName] - mode name (defaults to current mode)
   * @returns {string} 'M' | 'm' | 'd' | 'A'
   */
  function getChordQuality(degree, modeName) {
    var mode = modeName || _mode;
    var qualities = MODE_CHORD_QUALITIES[mode];
    if (!qualities) return 'M';  // fallback to major
    var idx = ((degree % qualities.length) + qualities.length) % qualities.length;
    return qualities[idx];
  }

  /**
   * Get the semitone intervals for a triad built on a given scale
   * degree in the current mode. Returns intervals from root of chord.
   *
   * @param {number} degree - scale degree (0-indexed)
   * @param {string} [modeName] - mode name (defaults to current mode)
   * @returns {number[]} e.g. [0, 4, 7] for major, [0, 3, 7] for minor
   */
  function getTriadIntervals(degree, modeName) {
    var quality = getChordQuality(degree, modeName);
    return QUALITY_INTERVALS[quality] || QUALITY_INTERVALS['M'];
  }

  /**
   * Get the scale degrees that form a triad on a given root degree
   * in the current mode.
   *
   * @param {number} rootDegree - scale degree of chord root (0-indexed)
   * @returns {number[]} array of 3 scale degrees
   */
  function getTriadDegrees(rootDegree) {
    var len = _scale.length;
    // Stack thirds: root, root+2 degrees, root+4 degrees
    return [
      rootDegree,
      (rootDegree + 2) % len,
      (rootDegree + 4) % len,
    ];
  }

  // ════════════════════════════════════════════════════════════════════
  // 14. SILENCE MEMORY
  // ════════════════════════════════════════════════════════════════════
  //
  // The last degree before void becomes seed for the first degree
  // after. Silence is not emptiness — it is a pause in a conversation.
  // You come back and the music remembers where you were.
  //
  // Source: musical phrasing — rests create meaning by connecting
  // what came before to what comes after.

  /**
   * Called when entering silence/void. Captures the seed.
   */
  function enterSilence() {
    // Seed is already tracked in recordNote. Just mark as set.
    if (_lastHistoryDeg !== null) {
      _silenceSeed = _lastHistoryDeg;
      _silenceSeedSet = true;
    }
  }

  /**
   * Called when exiting silence. Returns the seed degree so the
   * first note after silence can relate to where we left off.
   *
   * @returns {number|null} the seed degree, or null if no seed
   */
  function exitSilence() {
    if (!_silenceSeedSet) return null;
    var seed = _silenceSeed;
    _silenceSeedSet = false;
    return seed;
  }

  // ════════════════════════════════════════════════════════════════════
  // PHRASE LIFECYCLE
  // ════════════════════════════════════════════════════════════════════

  /**
   * Start a new phrase. Resets phrase-level state and picks a contour.
   *
   * @param {string} [archetype] - motion archetype
   * @param {string} [lensShape] - lens-preferred contour
   */
  function startPhrase(archetype, lensShape) {
    _phraseActive = true;
    _phraseNoteCount = 0;
    _phraseBreathing = false;
    _breathingTimer = 0;
    pickPhraseContour(archetype, lensShape);
  }

  /**
   * End the current phrase. Returns resolution info.
   *
   * @param {number} [intensity=0.5] - how intense the phrase was (0-1)
   * @returns {Object} { resolveTo, tension, contour }
   */
  function endPhrase(intensity) {
    _phraseActive = false;
    var int = intensity || 0.5;
    // High-intensity phrases resolve to root. Low-intensity to 5th.
    var resolveTo = int > 0.6 ? 0 : 4;
    return {
      resolveTo: resolveTo,
      tension: _harmonicTension,
      contour: _phraseContour,
    };
  }

  /**
   * Update phrase breathing timer. Call once per frame.
   *
   * @param {number} dtMs - delta time in milliseconds
   */
  function updateBreathing(dtMs) {
    if (_phraseBreathing) {
      _breathingTimer -= dtMs;
      if (_breathingTimer <= 0) {
        _phraseBreathing = false;
        _breathingTimer = 0;
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════
  // CONFIGURATION
  // ════════════════════════════════════════════════════════════════════

  /**
   * Configure harmony from a lens config.
   *
   * @param {Object} config - { root: 432, mode: 'dorian' }
   */
  function configure(config) {
    if (!config) return;
    if (config.root !== undefined) _root = config.root;
    if (config.mode !== undefined && MODES[config.mode]) {
      _mode = config.mode;
      _scale = MODES[config.mode];
    }
    // Gravity strength — how strongly sweet-spot frets pull (0 = free, 1 = strong)
    if (config.gravityStrength !== undefined) {
      DEFAULT_SWEET_SPOT_PULL = Math.max(0, Math.min(1, config.gravityStrength));
    }
    // Scale override — allows three-act arc to replace scale degrees (e.g., sus4)
    if (config._scaleOverride && Array.isArray(config._scaleOverride)) {
      _scale = config._scaleOverride;
    }
    // Contour bias — lens-preferred phrase contour
    if (config.contourBias !== undefined) {
      _contourBias = config.contourBias;
    }
  }

  /**
   * Initialize / reset all state. Idempotent.
   */
  function init() {
    _root = 432;
    _mode = 'major';
    _scale = MODES.major;
    _melodicHistory = [];
    _harmonicTension = 0;
    _sessionMaturity = 0;  // reset: every session starts as a wet pour
    _melodicCentroid = 0;
    _lastHistoryDeg = null;
    _phraseNoteCount = 0;
    _phraseBreathing = false;
    _breathingTimer = 0;
    _phraseContour = 'arch';
    _phraseActive = false;
    _hrTimer = 0;
    _hrState = 'root';
    _hrDegOffset = 0;
    _gravityState = 'tonic';
    _gravityTimer = 0;
    _gravityTonicDur = 20;
    _gravityDomDur = 0;
    _gravityDidResolve = false;
    _silenceSeed = 0;
    _silenceSeedSet = false;
    _motifs = [];
    _motifBuffer = [];
    _motifCooldown = 0;
  }

  /**
   * Get the degree tension value for a given scale degree.
   *
   * @param {number} degree - scale degree
   * @returns {number} tension value 0-1
   */
  function getDegreeTension(degree) {
    var idx = ((degree % DEGREE_TENSION.length) + DEGREE_TENSION.length) % DEGREE_TENSION.length;
    return DEGREE_TENSION[idx];
  }

  /**
   * Get the full read-only harmony state snapshot.
   *
   * @returns {Object} HarmonyState
   */
  function getState() {
    return {
      root: _root,
      mode: _mode,
      scale: _scale.slice(),
      harmonicTension: _harmonicTension,
      melodicCentroid: _melodicCentroid,
      hrState: _hrState,
      hrDegOffset: _hrDegOffset,
      gravityState: _gravityState,
      melodicHistory: _melodicHistory.slice(),
      contour: _phraseContour,
      phraseActive: _phraseActive,
      phraseBreathing: _phraseBreathing,
      silenceSeed: _silenceSeed,
      silenceSeedSet: _silenceSeedSet,
      currentMotif: _motifBuffer.slice(),
      storedMotifs: _motifs.slice(),
    };
  }

  // ════════════════════════════════════════════════════════════════════
  // PUBLIC API — frozen, immutable
  // ════════════════════════════════════════════════════════════════════

  return Object.freeze({
    // Constants
    MODES: MODES,
    MODAL_CHORDS: MODAL_CHORDS,
    MODE_CHORD_QUALITIES: MODE_CHORD_QUALITIES,
    QUALITY_INTERVALS: QUALITY_INTERVALS,
    DEGREE_TENSION: DEGREE_TENSION,
    CONTOURS: CONTOURS,
    LOVE_SEED: LOVE_SEED,
    LOVE_SEEDS: LOVE_SEEDS,
    MOTIF_PULL: MOTIF_PULL,

    // Setup
    init: init,
    configure: configure,

    // Frequency computation
    freq: scaleFreq,
    chordFreqs: chordFreqs,

    // Note recording and state
    recordNote: recordNote,
    getDegreeTension: getDegreeTension,

    // Harmonic gravity (sweet spot frets)
    gravitateDegree: gravitateDegree,
    applySweetSpot: applySweetSpot,

    // Melodic contours
    pickPhraseContour: pickPhraseContour,
    getContourDegree: getContourDegree,

    // Motif system
    applyMotifGravity: applyMotifGravity,
    updateMotifCooldown: updateMotifCooldown,

    // Harmonic rhythm (body-driven chord changes)
    updateHarmonicRhythm: updateHarmonicRhythm,
    updateHarmonicGravity: updateHarmonicGravity,

    // Voice leading (Tymoczko 2011)
    voiceLead: voiceLead,

    // Mode-aware chord qualities
    getChordQuality: getChordQuality,
    getTriadIntervals: getTriadIntervals,
    getTriadDegrees: getTriadDegrees,

    // Phrase lifecycle
    startPhrase: startPhrase,
    endPhrase: endPhrase,
    updateBreathing: updateBreathing,

    // Silence memory
    enterSilence: enterSilence,
    exitSilence: exitSilence,

    // State (read-only getters)
    get state()     { return getState(); },
    get root()      { return _root; },
    get mode()      { return _mode; },
    get scale()     { return _scale; },
    get tension()   { return _harmonicTension; },
    get centroid()  { return _melodicCentroid; },
    get contour()   { return _phraseContour; },
    get hrState()   { return _hrState; },
    get hrOffset()  { return _hrDegOffset; },
    get gravity()   { return _gravityState; },
    get breathing() { return _phraseBreathing; },
    get silenceSeed()    { return _silenceSeed; },
    get silenceSeedSet() { return _silenceSeedSet; },
    get motifs()    { return _motifs.slice(); },
    get maturity()  { return _sessionMaturity; },  // 0=wet pour, 1=cured foundation
  });
})();
