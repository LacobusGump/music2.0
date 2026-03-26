/**
 * rhythm.js — Unified Rhythm Engine for GUMP v2
 *
 * All rhythm in one place. Euclidean pattern generation, 1/f micro-timing,
 * user peak stamping, drum arrival, phrase-aware velocity, and groove profiles.
 *
 * The body IS the instrument. Drums are EARNED, not given. The user's motion
 * peaks become the drum pattern. The Bjorklund algorithm guarantees groove.
 * 1/f micro-timing makes it breathe. The system follows the human.
 *
 * Research foundation:
 *   Toussaint 2013 — Euclidean rhythms as universals (Bjorklund algorithm)
 *   Hennig 2011    — 1/f fluctuations in human musical rhythms
 *   Butterfield 2010 — 10-30ms micro-timing preferred by listeners
 *   Witek et al. 2014 — Moderate syncopation = peak groove (inverted-U)
 *   Phillips-Silver & Trainor 2005 — Body movement determines rhythm perception
 *   Mehr et al. 2019 — Repetition is universal across 315 cultures
 *   Dunbar 2012 — Synchronized rhythmic activity triggers endorphin release
 *
 * Architecture:
 *   rhythm.js generates PATTERNS. It does not play sounds.
 *   It fires callbacks with (time, velocity, instrument, kit).
 *   The caller (flow.js) decides whether and how to trigger audio.
 *
 * @module Rhythm
 */

var Rhythm = (function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════
  // 1. PINK NOISE — 1/f micro-timing (Hennig 2011)
  // ═══════════════════════════════════════════════════════════════════════
  //
  // The statistical signature of everything alive: heartbeats, neural firing,
  // ocean waves, great musical performances. 10-30ms correlated deviations
  // from the grid. The difference between a drum machine and a drummer.
  //
  // Voss-McCartney algorithm: sum of halved-rate random sources produces
  // 1/f power spectrum. Each sample is correlated with the previous —
  // not random (white) and not constant (brown), but the edge between.
  //
  // Research: Hennig et al. 2011 — "The Nature and Perception of
  // Fluctuations in Human Musical Rhythms" (PLoS ONE)

  function PinkNoise() {
    this._sources = [0, 0, 0, 0, 0, 0, 0, 0];
    this._counter = 0;
  }

  PinkNoise.prototype.next = function () {
    this._counter++;
    var sum = 0;
    for (var i = 0; i < 8; i++) {
      if ((this._counter & ((1 << i) - 1)) === 0) {
        this._sources[i] = Math.random() * 2 - 1;
      }
      sum += this._sources[i];
    }
    return sum / 8; // roughly -1..1
  };

  /**
   * Get a micro-timing offset in seconds.
   * @param {number} maxMs - Maximum deviation in milliseconds (default 20)
   * @returns {number} Offset in seconds (for Web Audio scheduling)
   *
   * Research: Butterfield 2010 — listeners prefer 10-30ms deviations.
   * We default to 20ms max, producing offsets in the sweet spot.
   */
  PinkNoise.prototype.timingSeconds = function (maxMs) {
    return this.next() * (maxMs || 20) / 1000;
  };


  // ═══════════════════════════════════════════════════════════════════════
  // 2. EUCLIDEAN GENERATOR — Bjorklund algorithm (Toussaint 2013)
  // ═══════════════════════════════════════════════════════════════════════
  //
  // The PRIMARY drum pattern generator. Distributes N hits across K steps
  // as evenly as possible. Produces the exact rhythmic patterns found
  // across ALL human cultures:
  //
  //   E(2, 16) = sparse pulse
  //   E(3,  8) = tresillo (Cuban, Brazilian)
  //   E(3, 16) = sparse tresillo
  //   E(5, 16) = cinquillo / West African bell
  //   E(7, 16) = West African standard pattern
  //   E(7, 12) = West African 12/8 bell
  //
  // Body energy maps to hit count. The math guarantees groove.
  //
  // Research: Toussaint 2013 — "The Geometry of Musical Rhythm"
  //           Bjorklund 2003 — "The Theory of Rep-Rate Pattern Generation
  //           in the SNS Timing System" (Los Alamos)

  /**
   * Generate a Euclidean rhythm pattern.
   * @param {number} hits  - Number of onsets (from body energy)
   * @param {number} steps - Total steps in the cycle (usually 16)
   * @returns {Array<number>} Pattern array of 0s and 1s
   */
  function euclidean(hits, steps) {
    hits = Math.max(0, Math.min(steps, Math.round(hits)));
    if (hits >= steps) {
      var full = [];
      for (var f = 0; f < steps; f++) full.push(1);
      return full;
    }
    if (hits === 0) {
      var empty = [];
      for (var e = 0; e < steps; e++) empty.push(0);
      return empty;
    }

    // Bjorklund algorithm — binary Euclidean GCD on rhythm
    var pattern = [];
    var counts = [];
    var remainders = [];
    var level = 0;
    remainders.push(hits);
    var divisor = steps - hits;

    while (true) {
      counts.push(Math.floor(divisor / remainders[level]));
      var rem = divisor % remainders[level];
      remainders.push(rem);
      divisor = remainders[level];
      level++;
      if (remainders[level] <= 1) break;
    }
    counts.push(divisor);

    function build(lv) {
      if (lv === -1) { pattern.push(0); return; }
      if (lv === -2) { pattern.push(1); return; }
      for (var i = 0; i < counts[lv]; i++) build(lv - 1);
      if (remainders[lv] !== 0) build(lv - 2);
    }
    build(level);

    // Rotate so first element is a hit (conventional Euclidean start)
    var first1 = pattern.indexOf(1);
    if (first1 > 0) pattern = pattern.slice(first1).concat(pattern.slice(0, first1));
    return pattern;
  }

  /**
   * Rotate a pattern by N steps for syncopation.
   * Rotation shifts the accent structure without changing density.
   * E(3,8) rotated by 1 = son clave feel. By 3 = rumba clave.
   *
   * Research: Toussaint 2013, Chapter 16 — "Rhythmic Oddity"
   *           Witek et al. 2014 — moderate syncopation = peak groove
   *
   * @param {Array} pattern - The pattern to rotate
   * @param {number} amount - Steps to rotate (positive = right)
   * @returns {Array} Rotated copy
   */
  function rotatePattern(pattern, amount) {
    if (!pattern || pattern.length === 0) return pattern;
    var len = pattern.length;
    var n = ((amount % len) + len) % len;
    if (n === 0) return pattern.slice();
    return pattern.slice(len - n).concat(pattern.slice(0, len - n));
  }


  // ═══════════════════════════════════════════════════════════════════════
  // 3. GROOVE PROFILES — per-lens rhythm configurations
  // ═══════════════════════════════════════════════════════════════════════
  //
  // Each lens has a rhythmic personality. The profile defines the kit,
  // baseline density, swing amount, ghost note activity, and humanization.
  // These are defaults — body energy modulates everything in real time.

  var GROOVE_PROFILES = {
    // Organic lenses — Euclidean patterns, derived tempo
    'tribal': {
      kit: 'tribal',
      density: 3,         // baseline Euclidean hits (tresillo feel)
      swing: 0.06,        // gentle swing on odd steps
      ghostLevel: 0.15,   // subtle ghost notes
      humanize: 0.9,      // heavy 1/f — these drums breathe
      steps: 16
    },
    'acoustic': {
      kit: 'acoustic',
      density: 4,
      swing: 0.04,
      ghostLevel: 0.10,
      humanize: 0.7,
      steps: 16
    },
    'brushes': {
      kit: 'brushes',
      density: 3,
      swing: 0.12,        // brushes = jazz = heavy swing
      ghostLevel: 0.25,   // brushes live in ghost notes
      humanize: 1.0,      // maximum humanization
      steps: 16
    },
    '808': {
      kit: '808',
      density: 4,         // four-on-the-floor baseline
      swing: 0.0,         // machine precision
      ghostLevel: 0.06,
      humanize: 0.3,      // light 1/f — electronic but alive
      steps: 16
    },
    'glitch': {
      kit: 'glitch',
      density: 5,         // denser baseline
      swing: 0.0,
      ghostLevel: 0.08,
      humanize: 0.2,      // near-mechanical
      steps: 16
    }
  };

  var DEFAULT_PROFILE = GROOVE_PROFILES['acoustic'];


  // ═══════════════════════════════════════════════════════════════════════
  // 4. INTERNAL STATE
  // ═══════════════════════════════════════════════════════════════════════

  var pink = new PinkNoise();

  // -- Tempo & clock --
  var tempo = 0;              // current BPM (derived or fixed)
  var tempoLocked = false;    // user's rhythm is steady enough
  var lockStrength = 0;       // 0-1
  var beatInterval = 0;       // ms between beats
  var mode = 'organic';       // 'organic' | 'grid'
  var gridBPM = 128;          // fixed BPM for grid mode

  // -- Bar/step tracking --
  var barPhase = 0;           // 0-1 within current bar
  var barCount = 0;           // total bars since init
  var phraseBar = 0;          // 0-3, position within 4-bar phrase
  var currentStep = -1;       // 0 to (steps-1)
  var lastFiredStep = -1;     // prevent double-fires
  var steps = 16;             // steps per bar (from profile)

  // -- Patterns (Euclidean-generated, body-driven) --
  var kickPattern = [];
  var snarePattern = [];
  var hatPattern = [];
  var percPattern = [];

  // -- User peak stamp grid --
  // The user's motion peaks stamped onto a 16-step velocity grid.
  // Euclidean provides the skeleton; user peaks add weight.
  // Research: Phillips-Silver & Trainor 2005 — body movement IS rhythm.
  var userStampGrid = null;  // Float32Array, allocated on init
  var STAMP_DECAY = 0.92;    // old peaks fade each bar

  // -- Drum arrival --
  // Drums are EARNED, not given. They emerge when the body proves
  // it has a locked rhythm AND enough engagement time.
  var drumPresence = 0;       // 0-1: how much drums have "arrived"
  var engagedTime = 0;        // seconds of active (non-silent) play
  var arrivalPhase = 0;       // 0=silent, 1=ghost, 2=emerging, 3=full

  // -- Groove profile (active) --
  var profile = null;

  // -- Phrase velocity contour --
  // A great drummer plays the SONG, not the drums.
  // Research: standard drum programming wisdom, confirmed by
  // analysis of recorded performances (Dahl 2004, "Playing the Accent")
  var PHRASE_CONTOUR = [
    // Bar 0: phrase beginning — accent beat 1, settle in
    [1.05, 0.90, 0.85, 0.88, 0.92, 0.88, 0.85, 0.88,
     0.95, 0.88, 0.85, 0.88, 0.90, 0.85, 0.82, 0.85],
    // Bar 1: cruising — steady, slightly lighter
    [0.92, 0.85, 0.82, 0.85, 0.88, 0.85, 0.82, 0.85,
     0.90, 0.85, 0.82, 0.85, 0.88, 0.85, 0.82, 0.85],
    // Bar 2: building — intensity rising
    [0.95, 0.88, 0.85, 0.90, 0.95, 0.90, 0.88, 0.92,
     0.98, 0.92, 0.90, 0.95, 1.00, 0.95, 0.92, 0.95],
    // Bar 3: climax then release — peak at start, fade to breathe
    [1.10, 0.95, 0.92, 0.98, 1.05, 0.98, 0.95, 1.00,
     1.08, 1.00, 0.95, 0.92, 0.88, 0.85, 0.80, 0.78]
  ];

  // -- Grid mode state (EDM lenses) --
  var gridPhase = 'intro';    // 'intro' | 'build' | 'drop' | 'breakdown'
  var gridPhaseTimer = 0;
  var gridBuildLevel = 0;     // 0-1 during build phase
  var gridDropTriggered = false;

  // -- Callbacks --
  var onDrumHit = null;       // function(time, velocity, instrument, kit)

  // -- Per-instrument 1/f bias (Butterfield 2010) --
  // Kick slightly ahead of the grid (pushes forward).
  // Snare slightly behind (lazy backbeat).
  // Hats slightly ahead (forward shuffle feel).
  // These biases are in milliseconds, scaled by humanize.
  var TIMING_BIAS = {
    kick:  -3,   // ms ahead (negative = early)
    snare:  5,   // ms behind (positive = late)
    hat:   -2,   // ms ahead
    perc:   0    // neutral
  };


  // ═══════════════════════════════════════════════════════════════════════
  // 5. EUCLIDEAN PATTERN GENERATION
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Generate all drum patterns from current energy and profile.
   * Energy maps to hit density. The Bjorklund algorithm guarantees
   * that whatever density the body produces, the pattern will groove.
   *
   * Energy mapping (Toussaint 2013):
   *   0.0-0.15 = 2 hits (sparse pulse)
   *   0.15-0.30 = 3 hits (tresillo)
   *   0.30-0.50 = 4 hits (four-on-the-floor)
   *   0.50-0.70 = 5 hits (cinquillo)
   *   0.70-0.90 = 6 hits (Afro-Cuban 6-stroke)
   *   0.90-1.00 = 7 hits (bell pattern)
   *
   * @param {number} energy - Body energy level 0-1
   * @param {object} prof   - Groove profile
   */
  function generatePatterns(energy, prof) {
    var p = prof || profile || DEFAULT_PROFILE;
    var s = p.steps || 16;

    // Kick: energy maps to density
    var kickHits = Math.max(2, Math.min(7, Math.round(
      p.density + energy * 4
    )));
    // Clamp to sensible range — never more hits than half the steps
    kickHits = Math.min(kickHits, Math.floor(s / 2));
    kickPattern = euclidean(kickHits, s);

    // Snare: complementary to kick — fewer hits, offset feel
    // Snare density = roughly half of kick, minimum 1
    var snareHits = Math.max(1, Math.round(kickHits * 0.4));
    snarePattern = euclidean(snareHits, s);
    // Rotate snare to land on offbeats relative to kick
    snarePattern = rotatePattern(snarePattern, Math.floor(s / 4));

    // Hats: denser than kick — fills the space
    var hatHits = Math.min(s, Math.round(kickHits * 1.8 + energy * 2));
    hatPattern = euclidean(hatHits, s);

    // Perc: sparse texture layer
    var percHits = Math.max(0, Math.round(energy * 3));
    percPattern = euclidean(percHits, s);
    // Rotate perc for polyrhythmic offset
    percPattern = rotatePattern(percPattern, Math.floor(s / 3));
  }


  // ═══════════════════════════════════════════════════════════════════════
  // 6. USER PEAK STAMPING
  // ═══════════════════════════════════════════════════════════════════════
  //
  // The user's motion peaks are stamped onto the rhythm grid.
  // Euclidean provides the skeleton. User peaks add weight.
  // The drums MIRROR the user — enabling outcome, not making choice.
  //
  // Research: Phillips-Silver & Trainor 2005 — the vestibular system
  // (measured by the phone accelerometer) shares neural pathways with
  // auditory rhythm perception. The body doesn't just hear rhythm —
  // the body IS rhythm.

  /**
   * Stamp a user peak onto the rhythm grid.
   * @param {number} step     - Which step the peak landed on (0-15)
   * @param {number} velocity - Peak strength 0-1
   */
  function stampPeak(step, velocity) {
    if (!userStampGrid) return;
    var s = steps || 16;
    var idx = Math.max(0, Math.min(s - 1, Math.round(step)));

    // Direct stamp: user velocity adds to the grid
    userStampGrid[idx] = Math.min(1.0, userStampGrid[idx] + velocity * 0.5);

    // Polyrhythmic complement: 6 steps away = dotted feel
    // This creates the "ghost" of a rhythm partner — the user plays one side,
    // the complement fills the other. Like call and response.
    var poly = (idx + Math.round(s * 0.375)) % s; // ~6/16 = dotted quarter offset
    userStampGrid[poly] = Math.min(0.4, userStampGrid[poly] + velocity * 0.15);
  }

  /**
   * Decay the user stamp grid. Called once per bar.
   * Old peaks fade so the pattern evolves with the user.
   */
  function decayStampGrid() {
    if (!userStampGrid) return;
    for (var i = 0; i < userStampGrid.length; i++) {
      userStampGrid[i] *= STAMP_DECAY;
    }
  }


  // ═══════════════════════════════════════════════════════════════════════
  // 7. DRUM ARRIVAL — drums are EARNED, not given
  // ═══════════════════════════════════════════════════════════════════════
  //
  // Drums don't exist at the start. They emerge when the body proves
  // it has a locked rhythm AND enough engagement time. The ethereal
  // dreamscape comes first. Drums are earned through presence.
  //
  // Phase 0 (0-30s):   drumPresence = 0. No drums. Pure melody/harmony.
  // Phase 1 (30-90s):  drumPresence creeps to 0.3. Ghost of a shaker.
  // Phase 2 (90s+):    drumPresence to 0.6-0.8. Kick + snare arrive.
  // Phase 3 (user):    Full drums. User peaks stamp the grid.
  //
  // Exception: Grid mode can start with full presence via configure().
  //
  // If rhythm confidence drops, drums fade. The system never imposes.

  /**
   * Update drum arrival state.
   * @param {number} dt          - Delta time in seconds
   * @param {boolean} isSilent   - Is the user currently still?
   * @param {boolean} locked     - Is tempo locked?
   * @param {number} confidence  - Rhythm confidence 0-1
   * @param {number} energy      - Body energy 0-1
   */
  function updateArrival(dt, isSilent, locked, confidence, energy) {
    // Grid mode: drums are always present
    if (mode === 'grid') {
      drumPresence = 1.0;
      arrivalPhase = 3;
      return;
    }

    // Count engaged time (only non-silent moments)
    if (!isSilent) {
      engagedTime += dt;
    }

    // Target presence based on conditions
    var target = 0;

    if (locked && engagedTime > 20 && confidence > 0.30) {
      // Slow ramp: ~60 seconds from first qualification to full
      var readyTime = Math.max(0, engagedTime - 20);
      target = Math.min(0.85, readyTime * 0.014);

      // Energy boost: high energy earns faster arrival
      if (energy > 0.6) {
        target = Math.min(1.0, target + (energy - 0.6) * 0.3);
      }
    }

    // No locked rhythm = drums fade
    if (!locked) target = 0;

    // Smooth approach (asymptotic — never jumps)
    drumPresence += (target - drumPresence) * dt * 0.4;

    // Clamp — threshold must be below one frame's smoothing delta
    // so the asymptotic approach can accumulate from zero
    if (drumPresence < 0.0001) drumPresence = 0;
    if (drumPresence > 1.0) drumPresence = 1.0;

    // Determine arrival phase
    if (drumPresence < 0.01) arrivalPhase = 0;
    else if (drumPresence < 0.30) arrivalPhase = 1;
    else if (drumPresence < 0.70) arrivalPhase = 2;
    else arrivalPhase = 3;
  }


  // ═══════════════════════════════════════════════════════════════════════
  // 8. PHRASE-AWARE VELOCITY
  // ═══════════════════════════════════════════════════════════════════════
  //
  // Velocity follows the musical phrase, not just user intensity.
  // A great drummer plays the SONG, not the drums. The four-bar phrase
  // has a natural contour: establish, cruise, build, climax-release.
  //
  // User energy SCALES this contour but doesn't override it.
  // At low energy, the contour is subtle. At high energy, it's dramatic.
  //
  // Research: Dahl 2004 — "Playing the Accent: Comparing Striking
  // Velocity and Timing in an Idealized and a Performed Drum Pattern"

  /**
   * Get phrase-aware velocity for a given step.
   * @param {number} step       - Current step (0-15)
   * @param {number} bar        - Current bar in phrase (0-3)
   * @param {number} baseVel    - Base velocity from pattern/stamp
   * @param {number} userEnergy - User's body energy 0-1
   * @returns {number} Scaled velocity
   */
  function phraseVelocity(step, bar, baseVel, userEnergy) {
    var contour = PHRASE_CONTOUR[bar] || PHRASE_CONTOUR[0];
    var s = steps || 16;
    // Map step to contour index (contour is always 16 entries)
    var ci = Math.floor(step * 16 / s);
    ci = Math.max(0, Math.min(15, ci));

    var phraseScale = contour[ci];

    // User energy scales how dramatic the phrasing is.
    // At energy 0: contour barely matters (range 0.95-1.05).
    // At energy 1: full contour expression.
    var contourDepth = 0.3 + userEnergy * 0.7;
    var scale = 1.0 + (phraseScale - 1.0) * contourDepth;

    return baseVel * scale;
  }


  // ═══════════════════════════════════════════════════════════════════════
  // 9. HIT TIMING — 1/f offset + swing + instrument bias
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Compute the timing offset for a drum hit.
   * Combines 1/f pink noise, swing, and per-instrument bias.
   *
   * @param {string} instrument - 'kick' | 'snare' | 'hat' | 'perc'
   * @param {number} step       - Current step (for swing calculation)
   * @returns {number} Offset in seconds (add to scheduled time)
   *
   * Research:
   *   Hennig 2011 — 1/f correlated timing is the signature of life
   *   Butterfield 2010 — kick ahead, snare lazy, hats ahead
   */
  function hitTiming(instrument, step) {
    var p = profile || DEFAULT_PROFILE;
    var humanize = p.humanize || 0.5;

    // 1/f micro-timing: correlated 10-25ms offset, scaled by humanize
    var pinkOffset = pink.timingSeconds(20) * humanize;

    // Swing: odd steps pushed late (0 = straight, 0.15 = heavy shuffle)
    var swingOffset = 0;
    if (p.swing > 0 && step % 2 === 1) {
      // Swing pushes odd 16th notes toward the next downbeat
      var stepDur = (tempo > 0) ? (60 / tempo / 4) : 0.125;
      swingOffset = stepDur * p.swing;
    }

    // Per-instrument bias (Butterfield 2010)
    var bias = (TIMING_BIAS[instrument] || 0) * humanize / 1000;

    return pinkOffset + swingOffset + bias;
  }


  // ═══════════════════════════════════════════════════════════════════════
  // 10. GRID MODE — EDM lenses (fixed BPM clock)
  // ═══════════════════════════════════════════════════════════════════════
  //
  // Same Euclidean + 1/f system but with a steady clock instead of
  // derived tempo. Build/drop/breakdown phase machine.
  //
  // Key difference from v1: NO auto-drop timers. Drops are triggered
  // by user peaks ONLY. The system follows the human.

  /**
   * Update grid mode phase machine.
   * @param {number} dt        - Delta time in seconds
   * @param {number} energy    - Body energy 0-1
   * @param {boolean} peaked   - Did the user peak this frame?
   * @param {number} peakMag   - Peak magnitude (if peaked)
   */
  function updateGridPhase(dt, energy, peaked, peakMag) {
    gridPhaseTimer += dt;

    switch (gridPhase) {
      case 'intro':
        // Intro: minimal drums, atmosphere building
        // Transitions to build after 8 bars OR user movement
        if (gridPhaseTimer > 15 || (energy > 0.3 && gridPhaseTimer > 4)) {
          gridPhase = 'build';
          gridPhaseTimer = 0;
          gridBuildLevel = 0;
        }
        break;

      case 'build':
        // Build: layers stack, energy rises
        // buildLevel ramps 0-1 over the build duration
        gridBuildLevel = Math.min(1.0, gridBuildLevel + dt * 0.08);

        // DROP: triggered by user peak ONLY (no auto-timer)
        // The user must earn the drop with a strong peak during a build
        if (peaked && peakMag > 0.6 && gridBuildLevel > 0.5) {
          gridPhase = 'drop';
          gridPhaseTimer = 0;
          gridDropTriggered = true;
        }
        break;

      case 'drop':
        // Drop: full energy, all layers active
        // Transitions to breakdown when energy drops OR after sustained play
        if (energy < 0.15 && gridPhaseTimer > 8) {
          gridPhase = 'breakdown';
          gridPhaseTimer = 0;
        }
        // Also transition if the drop has been going for a long time
        // and energy is moderate — the user is settling
        if (gridPhaseTimer > 32 && energy < 0.4) {
          gridPhase = 'breakdown';
          gridPhaseTimer = 0;
        }
        break;

      case 'breakdown':
        // Breakdown: stripped back, breathing room
        // Transitions back to build when energy returns
        if (energy > 0.3 && gridPhaseTimer > 4) {
          gridPhase = 'build';
          gridPhaseTimer = 0;
          gridBuildLevel = 0;
          gridDropTriggered = false;
        }
        break;
    }
  }

  /**
   * Get velocity scale for grid phase.
   * Each phase has a characteristic energy level.
   * @returns {number} Velocity multiplier 0-1
   */
  function gridPhaseVelocity() {
    switch (gridPhase) {
      case 'intro':     return 0.35;
      case 'build':     return 0.4 + gridBuildLevel * 0.5;
      case 'drop':      return 1.0;
      case 'breakdown': return 0.25;
      default:          return 0.5;
    }
  }


  // ═══════════════════════════════════════════════════════════════════════
  // 11. FIRE STEP — the moment a step triggers
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Fire all drum hits for the current step.
   * Combines Euclidean pattern, user stamp grid, phrase velocity,
   * 1/f timing, and drum presence into final hit decisions.
   *
   * @param {number} step       - Current step (0-15)
   * @param {number} time       - Audio context time for scheduling
   * @param {number} userEnergy - Body energy 0-1
   */
  function fireStep(step, time, userEnergy) {
    if (!onDrumHit) return;
    if (drumPresence < 0.01) return;

    var p = profile || DEFAULT_PROFILE;
    var kit = p.kit || 'acoustic';
    var dp = drumPresence;
    var s = steps || 16;

    // Phrase velocity contour
    var bar = phraseBar;
    var phaseMultiplier = (mode === 'grid') ? gridPhaseVelocity() : 1.0;

    // User stamp contribution at this step
    var stampVel = (userStampGrid && step < userStampGrid.length)
      ? userStampGrid[step] : 0;

    // ── KICK ──
    if (step < kickPattern.length && kickPattern[step]) {
      var kickBase = 0.7 * dp;
      // Blend with user stamp — user peaks make the kick louder
      kickBase = Math.max(kickBase, stampVel * dp * 0.8);
      var kickVel = phraseVelocity(step, bar, kickBase, userEnergy) * phaseMultiplier;
      kickVel = Math.min(0.92, kickVel);
      if (kickVel > 0.03) {
        var kickTime = time + hitTiming('kick', step);
        onDrumHit(kickTime, kickVel, 'kick', kit);
      }
    }

    // ── SNARE ──
    if (step < snarePattern.length && snarePattern[step]) {
      var snareBase = 0.6 * dp;
      snareBase = Math.max(snareBase, stampVel * dp * 0.6);
      var snareVel = phraseVelocity(step, bar, snareBase, userEnergy) * phaseMultiplier;
      snareVel = Math.min(0.85, snareVel);
      if (snareVel > 0.04 && dp > 0.25) {
        var snareTime = time + hitTiming('snare', step);
        onDrumHit(snareTime, snareVel, 'snare', kit);
      }
    }

    // ── HATS ──
    if (step < hatPattern.length && hatPattern[step]) {
      var hatBase = 0.35 * dp;
      var hatVel = phraseVelocity(step, bar, hatBase, userEnergy) * phaseMultiplier;
      hatVel = Math.min(0.55, hatVel);
      if (hatVel > 0.02 && dp > 0.10) {
        var hatTime = time + hitTiming('hat', step);
        onDrumHit(hatTime, hatVel, 'hat', kit);
      }
    }

    // ── GHOST NOTES ──
    // Ghost notes fill gaps where nothing else plays.
    // They're the connective tissue — barely audible, deeply felt.
    // Research: brushes and jazz drumming literature — ghosts define groove.
    if (p.ghostLevel > 0 && dp > 0.15) {
      var hasHit = (step < kickPattern.length && kickPattern[step]) ||
                   (step < snarePattern.length && snarePattern[step]);
      if (!hasHit && Math.random() < p.ghostLevel * dp) {
        var ghostVel = 0.06 + Math.random() * 0.08;
        ghostVel *= dp * phaseMultiplier;
        if (ghostVel > 0.01) {
          var ghostTime = time + hitTiming('snare', step);
          onDrumHit(ghostTime, ghostVel, 'snare', kit);
        }
      }
    }

    // ── PERC (shaker / ride) ──
    if (step < percPattern.length && percPattern[step]) {
      var percBase = 0.20 * dp;
      var percVel = phraseVelocity(step, bar, percBase, userEnergy) * phaseMultiplier;
      percVel = Math.min(0.40, percVel);
      if (percVel > 0.02 && dp > 0.20) {
        var percTime = time + hitTiming('perc', step);
        onDrumHit(percTime, percVel, 'perc', kit);
      }
    }

    // ── USER STAMP SOLO HITS ──
    // If the user has a strong stamp on a step where no Euclidean hit
    // exists, play it anyway. The user's rhythm overrides the algorithm.
    // The drums MIRROR the user.
    if (stampVel > 0.25 && dp > 0.15) {
      var hasEuclidean = (step < kickPattern.length && kickPattern[step]) ||
                         (step < snarePattern.length && snarePattern[step]);
      if (!hasEuclidean) {
        var stampHitVel = stampVel * dp * 0.6 * phaseMultiplier;
        stampHitVel = Math.min(0.55, stampHitVel);
        if (stampHitVel > 0.03) {
          var stampTime = time + hitTiming('kick', step);
          onDrumHit(stampTime, stampHitVel, 'kick', kit);
        }
      }
    }
  }


  // ═══════════════════════════════════════════════════════════════════════
  // 12. UPDATE — called each frame
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Main update function. Advances the rhythm clock, generates patterns,
   * and fires drum hits via the onDrumHit callback.
   *
   * @param {number} dt - Delta time in seconds
   * @param {object} bodyState - State from Body module:
   *   {
   *     energy: number,          // 0-1, current body energy
   *     tempo: number,           // BPM from body peaks (0 if none)
   *     tempoLocked: boolean,    // is tempo steady enough?
   *     rhythmConfidence: number, // 0-1
   *     lockStrength: number,    // 0-1
   *     isSilent: boolean,       // is the user still?
   *     peaked: boolean,         // did a peak happen this frame?
   *     peakMag: number,         // peak magnitude (if peaked)
   *     audioTime: number        // AudioContext.currentTime
   *   }
   *
   * @returns {object} Current rhythm state snapshot
   */
  function update(dt, bodyState) {
    try {
    if (!bodyState) return getState();

    var energy = bodyState.energy || 0;
    var bodyTempo = bodyState.tempo || 0;
    var locked = bodyState.tempoLocked || false;
    var confidence = bodyState.rhythmConfidence || 0;
    var isSilent = bodyState.isSilent !== undefined ? bodyState.isSilent : true;
    var peaked = bodyState.peaked || false;
    var peakMag = bodyState.peakMag || 0;
    var audioTime = bodyState.audioTime || 0;

    // Update tempo
    if (mode === 'grid') {
      tempo = gridBPM;
      tempoLocked = true;
      lockStrength = 1.0;
    } else {
      tempo = locked ? bodyTempo : tempo;
      tempoLocked = locked;
      lockStrength = bodyState.lockStrength || 0;
    }

    // Clamp tempo to sane range
    if (tempo > 0) {
      tempo = Math.max(40, Math.min(200, tempo));
      beatInterval = 60000 / tempo; // ms per beat
    }

    // Update drum arrival
    updateArrival(dt, isSilent, tempoLocked, confidence, energy);

    // Grid mode phase machine
    if (mode === 'grid') {
      updateGridPhase(dt, energy, peaked, peakMag);
    }

    // No tempo = no clock advancement
    if (tempo <= 0 || (!tempoLocked && mode !== 'grid')) {
      return getState();
    }

    // Advance bar phase
    var stepDur = 60 / (tempo * 4); // duration of one 16th note in seconds
    var barDur = stepDur * steps;     // duration of one bar in seconds
    barPhase += dt / barDur;

    // Bar boundary crossed
    if (barPhase >= 1.0) {
      barPhase -= 1.0;
      barCount++;
      phraseBar = barCount % 4;

      // Decay user stamp grid each bar — old peaks fade
      decayStampGrid();

      // Regenerate Euclidean patterns each bar based on current energy.
      // This means patterns evolve with the user's movement in real time.
      generatePatterns(energy, profile);
    }

    // Step advancement
    var newStep = Math.floor(barPhase * steps);
    newStep = Math.max(0, Math.min(steps - 1, newStep));

    if (newStep !== lastFiredStep) {
      lastFiredStep = newStep;
      currentStep = newStep;

      // Stamp user peak onto grid if one happened
      if (peaked) {
        stampPeak(newStep, Math.min(1.0, peakMag));
      }

      // Fire drum hits for this step
      fireStep(newStep, audioTime, energy);
    }

    return getState();
    } catch (e) { /* never crash the music */ return getState(); }
  }


  // ═══════════════════════════════════════════════════════════════════════
  // 13. STATE & API
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Get the current rhythm state snapshot.
   * @returns {object} Complete rhythm state
   */
  function getState() {
    return {
      tempo: tempo,
      tempoLocked: tempoLocked,
      lockStrength: lockStrength,
      beatInterval: beatInterval,
      barPhase: barPhase,
      barCount: barCount,
      phraseBar: phraseBar,
      currentStep: currentStep,
      mode: mode,
      drumPresence: drumPresence,
      arrivalPhase: arrivalPhase,
      engagedTime: engagedTime,
      kickPattern: kickPattern,
      snarePattern: snarePattern,
      hatPattern: hatPattern,
      percPattern: percPattern,
      kit: (profile || DEFAULT_PROFILE).kit,
      swing: (profile || DEFAULT_PROFILE).swing,
      ghostLevel: (profile || DEFAULT_PROFILE).ghostLevel,
      humanize: (profile || DEFAULT_PROFILE).humanize,
      gridPhase: (mode === 'grid') ? gridPhase : null,
      gridBuildLevel: (mode === 'grid') ? gridBuildLevel : null
    };
  }

  /**
   * Configure the rhythm engine for a lens.
   * @param {object} config - Lens rhythm configuration:
   *   {
   *     mode: 'organic' | 'grid',
   *     bpm: number (for grid mode),
   *     profile: string (key into GROOVE_PROFILES) or object,
   *     steps: number (8, 12, 16, 32),
   *     fullPresence: boolean (skip drum arrival, e.g. Grid lens),
   *     onDrumHit: function(time, velocity, instrument, kit)
   *   }
   */
  function configure(config) {
    if (!config) return;

    // Mode
    if (config.mode === 'grid' || config.mode === 'organic') {
      mode = config.mode;
    }

    // BPM (grid mode)
    if (typeof config.bpm === 'number' && config.bpm > 0) {
      gridBPM = config.bpm;
      if (mode === 'grid') {
        tempo = gridBPM;
        tempoLocked = true;
        lockStrength = 1.0;
        beatInterval = 60000 / tempo;
      }
    }

    // Groove profile
    if (typeof config.profile === 'string' && GROOVE_PROFILES[config.profile]) {
      profile = GROOVE_PROFILES[config.profile];
    } else if (config.profile && typeof config.profile === 'object') {
      profile = config.profile;
    }

    // Steps
    if (typeof config.steps === 'number') {
      steps = Math.max(4, Math.min(32, config.steps));
      // Reallocate stamp grid
      userStampGrid = new Float32Array(steps);
    }

    // Full presence (skip arrival for Grid-type lenses)
    if (config.fullPresence) {
      drumPresence = 1.0;
      arrivalPhase = 3;
    }

    // Callback
    if (typeof config.onDrumHit === 'function') {
      onDrumHit = config.onDrumHit;
    }

    // Generate initial patterns
    generatePatterns(0, profile);
  }

  /**
   * Initialize the rhythm engine.
   */
  function init() {
    pink = new PinkNoise();
    tempo = 0;
    tempoLocked = false;
    lockStrength = 0;
    beatInterval = 0;
    mode = 'organic';
    barPhase = 0;
    barCount = 0;
    phraseBar = 0;
    currentStep = -1;
    lastFiredStep = -1;
    steps = 16;
    drumPresence = 0;
    engagedTime = 0;
    arrivalPhase = 0;
    profile = DEFAULT_PROFILE;
    gridPhase = 'intro';
    gridPhaseTimer = 0;
    gridBuildLevel = 0;
    gridDropTriggered = false;
    onDrumHit = null;

    userStampGrid = new Float32Array(steps);
    kickPattern = [];
    snarePattern = [];
    hatPattern = [];
    percPattern = [];

    generatePatterns(0, profile);
  }

  /**
   * Reset the engine to initial state.
   * Used on lens change or session restart.
   */
  function reset() {
    init();
  }

  /**
   * Set the drum hit callback.
   * @param {function} fn - Called as fn(time, velocity, instrument, kit)
   *   time: AudioContext.currentTime + offset (seconds)
   *   velocity: 0-1
   *   instrument: 'kick' | 'snare' | 'hat' | 'perc'
   *   kit: '808' | 'acoustic' | 'tribal' | 'brushes' | 'glitch'
   */
  function setCallback(fn) {
    if (typeof fn === 'function') {
      onDrumHit = fn;
    }
  }

  /**
   * Override Euclidean hit count (lens control).
   * @param {number} hits - Number of Euclidean hits for kick pattern
   */
  function setDensity(hits) {
    if (profile) {
      profile = Object.create(profile);
      profile.density = hits;
    }
  }


  // ═══════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════

  return Object.freeze({
    // Lifecycle
    init: init,
    reset: reset,
    configure: configure,
    setCallback: setCallback,

    // Frame update
    update: update,

    // Peak stamping (called by flow.js when Body detects a peak)
    stampPeak: stampPeak,

    // Pattern control
    setDensity: setDensity,
    rotate: function (amount) {
      kickPattern = rotatePattern(kickPattern, amount);
      snarePattern = rotatePattern(snarePattern, amount);
    },

    // Stateless utilities
    euclidean: euclidean,
    rotatePattern: rotatePattern,

    // State queries
    get state()        { return getState(); },
    get tempo()        { return tempo; },
    get barPhase()     { return barPhase; },
    get tempoLocked()  { return tempoLocked; },
    get drumPresence() { return drumPresence; },
    get currentStep()  { return currentStep; },
    get mode()         { return mode; },
    get gridPhase()    { return (mode === 'grid') ? gridPhase : null; },
    get profile()      { return profile || DEFAULT_PROFILE; },

    // Expose profiles for lens.js
    GROOVE_PROFILES: GROOVE_PROFILES
  });

})();
