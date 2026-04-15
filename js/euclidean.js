// ═══════════════════════════════════════════════════════════════════
// EUCLIDEAN — Bjorklund/Toussaint rhythm generator for GUMP.
//
// Euclidean rhythms distribute k onsets across n steps as evenly as
// possible. The algorithm is identical to Euclid's GCD — applied to
// rhythm instead of integers. The result maximizes evenness and
// minimizes the sum of squared deviations from perfectly even spacing.
// This is the rhythmic equivalent of consonance: the most balanced
// way to place beats in a cycle.
//
// Bjorklund (2003) — "The Theory of Rep-Rate Pattern Generation
//   in the SNS Timing System" (spallation neutron source timing)
// Toussaint (2005) — "The Euclidean Algorithm Generates Traditional
//   Musical Rhythms" (connection to world music)
//
// Mathematical note:
//   For a pattern E(k,n), the onset positions approximate
//   floor(i * n/k) for i = 0..k-1. This is the Bresenham line
//   from (0,0) to (k,n) — the same discrete approximation that
//   draws the straightest possible line on a pixel grid. Euclidean
//   rhythms ARE straight lines wrapped around a circle.
//
// Usage: <script src="/js/euclidean.js"></script>
//   Euclidean.generate(3, 8)          // [1,0,0,1,0,0,1,0] — tresillo
//   Euclidean.groove(120, preset, fn) // play at 120 BPM
// ═══════════════════════════════════════════════════════════════════

var Euclidean = (function () {
  'use strict';

  // ═══ CORE: Bjorklund's algorithm ═══
  // Distributes k onsets across n slots using the same recursive
  // structure as Euclid's GCD. Groups are interleaved until
  // the remainder vanishes — exactly like long division.

  function euclidean(k, n) {
    if (k < 0 || n < 1 || k > n) {
      throw new Error('euclidean: need 0 <= k <= n, got k=' + k + ' n=' + n);
    }
    if (k === 0) return new Array(n).fill(0);
    if (k === n) return new Array(n).fill(1);

    // Bjorklund's algorithm: recursive interleaving
    // Start with two groups: k copies of [1], (n-k) copies of [0]
    var front = [];
    var back = [];
    var i;
    for (i = 0; i < k; i++) front.push([1]);
    for (i = 0; i < n - k; i++) back.push([0]);

    // Recursively append the smaller group to the larger
    while (back.length > 1) {
      var newFront = [];
      var newBack = [];
      var pairs = Math.min(front.length, back.length);
      for (i = 0; i < pairs; i++) {
        newFront.push(front[i].concat(back[i]));
      }
      // Leftovers become the new back
      if (front.length > back.length) {
        for (i = pairs; i < front.length; i++) newBack.push(front[i]);
      } else {
        for (i = pairs; i < back.length; i++) newBack.push(back[i]);
      }
      front = newFront;
      back = newBack;
    }

    // Flatten: front groups + remaining back groups
    var pattern = [];
    for (i = 0; i < front.length; i++) {
      for (var j = 0; j < front[i].length; j++) pattern.push(front[i][j]);
    }
    for (i = 0; i < back.length; i++) {
      for (var j = 0; j < back[i].length; j++) pattern.push(back[i][j]);
    }

    return pattern;
  }


  // ═══ ROTATE ═══
  // Rotates the pattern by `shift` steps to the right.
  // Negative shift rotates left. This is how son clave and rumba
  // clave emerge from the same E(5,16) — rotation selects the
  // cultural variant.

  function euclideanRotate(pattern, shift) {
    var len = pattern.length;
    if (len === 0) return [];
    // Normalize shift to positive modular index
    var s = ((shift % len) + len) % len;
    return pattern.slice(len - s).concat(pattern.slice(0, len - s));
  }


  // ═══ PRESETS ═══
  // Named rhythms from Toussaint's catalog. Every one of these
  // is a Euclidean rhythm — discovered independently across
  // continents because the math is universal.

  var PRESETS = {
    // E(3,8) — Cuban tresillo. Foundation of Afro-Cuban music.
    // [x . . x . . x .] — the most important rhythm in popular music.
    tresillo: euclidean(3, 8),

    // E(5,8) — Cuban cinquillo. Tresillo's dense cousin.
    // [x . x x . x x .] — habanera, second line, funk.
    cinquillo: euclidean(5, 8),

    // E(5,16) rotated — 3-2 son clave.
    // The timeline of Afro-Cuban music. Rotation places the
    // three-side first: [x . . x . . x . . . x . x . . .]
    son_clave: euclideanRotate(euclidean(5, 16), 1),

    // E(5,16) rotated differently — 3-2 rumba clave.
    // The third onset shifts one step later than son clave,
    // creating more tension. Same Euclidean seed, different rotation.
    // [x . . x . . . x . . x . x . . .]
    rumba_clave: euclideanRotate(euclidean(5, 16), 3),

    // E(5,16) — bossa nova.
    // Brazilian interpretation of the same 5-in-16 family.
    bossa: euclidean(5, 16),

    // E(7,12) — West African bell pattern.
    // 7 onsets in 12 pulses. The standard pattern of Ewe music.
    // Also the major scale in rhythm: 7 notes in 12 semitones.
    afrobeat: euclidean(7, 12),

    // E(4,9) — Turkish aksak (limping).
    // 4 in 9 is inherently asymmetric — it cannot tile evenly.
    // This asymmetry IS the groove. 2+2+2+3 grouping.
    aksak: euclidean(4, 9)
  };


  // ═══ GROOVE ENGINE ═══
  // Plays a pattern at the given BPM. Each step of the pattern gets
  // one pulse. callback(step, isOnset) fires on every step.
  //
  // Returns a handle with .stop() to kill the loop and .step for
  // current position.
  //
  // BPM is per-step, not per-beat. For standard 4/4 feel with
  // E(k,16), multiply BPM by 4 (each step = one sixteenth note).

  function groove(bpm, pattern, callback) {
    if (!pattern || pattern.length === 0) {
      throw new Error('groove: pattern must be a non-empty array');
    }
    if (typeof callback !== 'function') {
      throw new Error('groove: callback must be a function');
    }

    var stepMs = 60000 / bpm;
    var step = 0;
    var running = true;
    var timer = null;

    function tick() {
      if (!running) return;
      var idx = step % pattern.length;
      var isOnset = pattern[idx] === 1;

      callback(idx, isOnset);

      step++;
      timer = setTimeout(tick, stepMs);
    }

    // Start immediately
    tick();

    return {
      stop: function () {
        running = false;
        if (timer !== null) {
          clearTimeout(timer);
          timer = null;
        }
      },
      get step() {
        return step;
      },
      get running() {
        return running;
      }
    };
  }


  // ═══ UTILITIES ═══

  // Pretty-print a pattern as [x . . x . . x .]
  function toString(pattern) {
    return '[' + pattern.map(function (v) { return v ? 'x' : '.'; }).join(' ') + ']';
  }

  // Density: fraction of onsets. E(k,n) always has density k/n.
  function density(pattern) {
    var sum = 0;
    for (var i = 0; i < pattern.length; i++) sum += pattern[i];
    return sum / pattern.length;
  }

  // Evenness: how close to perfectly even spacing.
  // Returns 1.0 for perfectly even, lower for less even.
  // Measured as 1 - normalized variance of inter-onset intervals.
  function evenness(pattern) {
    var onsets = [];
    var i;
    for (i = 0; i < pattern.length; i++) {
      if (pattern[i] === 1) onsets.push(i);
    }
    if (onsets.length <= 1) return 1.0;

    // Compute inter-onset intervals (wrapping around)
    var intervals = [];
    for (i = 0; i < onsets.length; i++) {
      var next = (i + 1) % onsets.length;
      var gap = (onsets[next] - onsets[i] + pattern.length) % pattern.length;
      intervals.push(gap);
    }

    // Perfect interval would be n/k for each
    var perfect = pattern.length / onsets.length;
    var sumSqDev = 0;
    for (i = 0; i < intervals.length; i++) {
      var dev = intervals[i] - perfect;
      sumSqDev += dev * dev;
    }

    // Normalize: max possible variance is bounded by (n-1)^2
    var maxVar = (pattern.length - 1) * (pattern.length - 1);
    return 1 - (sumSqDev / intervals.length) / maxVar;
  }


  // ═══ PUBLIC API ═══

  return {
    generate:   euclidean,
    rotate:     euclideanRotate,
    groove:     groove,
    toString:   toString,
    density:    density,
    evenness:   evenness,
    PRESETS:    PRESETS
  };

})();
