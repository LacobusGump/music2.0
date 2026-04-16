// ═══════════════════════════════════════════════════════════════
// K-COLORS — the math expressed as light
//
// Each color IS a K value mapped through CIE 1931 to sRGB.
// K=0 → 700nm (infrared, chaos) → deep red
// K=1/φ → 594nm (operating point) → amber
// K=1 → 529nm (unity) → moss
// K=φ → 423nm (golden ratio) → violet
// φ point of visible spectrum → 578nm → warm gold
//
// Desaturated for the 1920s desk: warm, muted, never neon.
// Load this ONCE. Everything references it.
//
// Grand Unified Music Project — April 2026
// ═══════════════════════════════════════════════════════════════

var KC = (function() {
  'use strict';

  var PHI = (1 + Math.sqrt(5)) / 2;
  var INV_PHI = 1 / PHI;
  var BREATH = PHI;
  var GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
  var K_STAR = 1.868;

  // ═══ THE FIVE COLORS ═══
  // Each derived from a K value → wavelength → CIE XYZ → sRGB → muted
  var C = {
    gold:    [191, 160, 63],   // φ wavelength (578nm) — warm ambient, titles
    amber:   [189, 110, 55],   // K=1/φ (594nm) — operating point, action, life
    moss:    [64, 149, 64],    // K=1 (529nm) — unity, health, coupled
    violet:  [91, 62, 130],    // K=φ (423nm) — sacred, rare, threshold
    red:     [147, 59, 56],    // K→0 (683nm) — danger, tension, decoupling

    // Structural (unchanged)
    void_bg: [8, 8, 13],      // the void
    text:    [232, 228, 220],  // warm cream
    dim:     [136, 136, 136],
    faint:   [68, 68, 68],
  };

  // ═══ COLOR FUNCTIONS ═══

  function rgba(c, a) {
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  }

  function lerp(a, b, t) { return a + (b - a) * t; }

  function lerpColor(c1, c2, t) {
    return [
      Math.round(lerp(c1[0], c2[0], t)),
      Math.round(lerp(c1[1], c2[1], t)),
      Math.round(lerp(c1[2], c2[2], t))
    ];
  }

  // K-value to color: 0→red, 1/φ→amber, 1→moss
  function kColor(k) {
    k = Math.max(0, Math.min(1, k));
    if (k < INV_PHI) return lerpColor(C.red, C.amber, k / INV_PHI);
    return lerpColor(C.amber, C.moss, (k - INV_PHI) / (1 - INV_PHI));
  }

  // Tension to color: 0→gold (resolved), 1→red (tense)
  function tensionColor(t) {
    t = Math.max(0, Math.min(1, t));
    if (t < 0.5) return lerpColor(C.gold, C.amber, t * 2);
    return lerpColor(C.amber, C.red, (t - 0.5) * 2);
  }

  function smoothstep(t) { return t * t * (3 - 2 * t); }

  // ═══ CSS VALUES (for inline use) ═══
  var CSS = {
    gold:       '#bfa03f',
    amber:      '#bd6e37',
    moss:       '#409540',
    violet:     '#5b3e82',
    red:        '#933b38',
    void_bg:    '#08080d',
    text:       '#e8e4dc',
    dim:        '#888888',
    faint:      '#444444',
    // Hover states
    amber_light:'#d4884a',
    gold_light: '#d4b85a',
    // Titles
    title:      '#2d7a2d',  // dark moss — h1, logo
    subtitle:   '#bd6e37',  // amber — h2
    body_text:  '#a09585',  // sandy — all body text
    // Functional
    link:       '#bd6e37',
    link_hover: '#d4884a',
    success:    '#409540',
    warning:    '#bd6e37',
    danger:     '#933b38',
    sacred:     '#5b3e82',
  };

  return {
    C: C,
    CSS: CSS,
    rgba: rgba,
    lerp: lerp,
    lerpColor: lerpColor,
    kColor: kColor,
    tensionColor: tensionColor,
    smoothstep: smoothstep,
    PHI: PHI,
    INV_PHI: INV_PHI,
    BREATH: BREATH,
    GOLDEN_ANGLE: GOLDEN_ANGLE,
    K_STAR: K_STAR
  };
})();

// Expose for pages that use flat variables
var PHI = KC.PHI, INV_PHI = KC.INV_PHI, BREATH = KC.BREATH;
var C = KC.C;
function rgba(c,a) { return KC.rgba(c,a); }
function lerp(a,b,t) { return KC.lerp(a,b,t); }
function lerpColor(a,b,t) { return KC.lerpColor(a,b,t); }
function kColor(k) { return KC.kColor(k); }
function tensionColor(t) { return KC.tensionColor(t); }
function smoothstep(t) { return KC.smoothstep(t); }
