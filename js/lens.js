/**
 * LENS — Timbral Palettes
 *
 * Two lenses. Two worlds.
 *
 * JOURNEY: Organic. Your body shapes the music.
 *   Evolves through 4 stages: Drift → Still Water → Tundra → Dark Matter
 *   Each stage ~2.5 minutes. The music grows with you.
 *
 * GRID: EDM engine. Fixed 128bpm clock. You ARE the DJ.
 */

const Lens = (function () {
  'use strict';

  // ── ORGANIC STAGES ─────────────────────────────────────────────────────
  // Each stage is a complete timbral world. The Journey lens crossfades between them.
  // Order: intimate warmth → flowing texture → vast silence → dark intensity

  var STAGES = [
    // ─── STAGE 0: DRIFT ──────────────────────────────────────────────
    // Boards of Canada. One piano. Two hands. Dorian warmth.
    {
      name: 'drift',
      harmony: { root: 432, mode: 'dorian' },
      tone: {
        bassFreq: 110, bassGain: 5,
        midFreq: 700, midQ: 0.5, midGain: 1,
        highFreq: 2800, highGain: -12,
        ceiling: 3500,
      },
      space: {
        reverb: { decay: 5.0, damping: 0.18, preDelay: 12 },
        delay: { feedback: 0.32, filter: 1600, sync: 'dotted-eighth' },
        saturation: 0.05,
        type: 'cathedral',
        reverbMix: 0.44,
        spatial: { sweepRate: 0.04, sweepDepth: 0.28 },
      },
      palette: {
        continuous: { voice: 'mono', octave: 0, decay: 2.5 },
        peak: { voice: 'piano', octave: -1, decay: 2.5 },
        harmonic: { voice: 'piano', octave: 1, decay: 2.0 },
        touch: { voice: 'piano', octave: 0, decay: 3.0 },
      },
      response: {
        peakThreshold: 0.35,
        tiltRange: 55,
        noteInterval: 750,
        melodicEnergy: 0.12,
        stillnessThreshold: 0.07,
        stillnessTimeout: 2.5,
        fadeTime: 11.0,
        filterRange: [200, 2800],
        densityThresholds: [0.12, 0.55, 1.3],
      },
      emotion: { colorDeg: 5, phraseShape: 'falling' },
      motion: { primary: 'tilt_rate', melodic: 'beta', sensitivity: 0.8 },
      groove: null,
    },

    // ─── STAGE 1: STILL WATER ────────────────────────────────────────
    // Nils Frahm. Jon Hopkins. Lydian wonder. Strings with vibrato.
    {
      name: 'still water',
      harmony: { root: 440, mode: 'lydian' },
      tone: {
        bassFreq: 90, bassGain: 3,
        midFreq: 700, midQ: 0.6, midGain: -1,
        highFreq: 3200, highGain: -7,
        ceiling: 4500,
      },
      space: {
        reverb: { decay: 4.5, damping: 0.20, preDelay: 28 },
        delay: { feedback: 0.55, filter: 2400, sync: 'dotted-eighth' },
        saturation: 0.04,
        type: 'cathedral',
        reverbMix: 0.5,
        spatial: { sweepRate: 0.10, sweepDepth: 0.48 },
      },
      palette: {
        peak: { voice: 'piano', octave: 0, decay: 2.5 },
        continuous: { voice: 'strings', octave: 0, decay: 3.5 },
        harmonic: { voice: 'piano', octave: 1, decay: 2.0 },
        texture: { wave: 'sine', chord: [0, 4, 7, 11], octave: -1, detune: 5, vol: 0.05, reverbSend: 0.62 },
        touch: { voice: 'piano', octave: 0, decay: 2.0 },
      },
      response: {
        peakThreshold: 0.75,
        tiltRange: 50,
        noteInterval: 380,
        melodicEnergy: 0.18,
        stillnessThreshold: 0.1,
        stillnessTimeout: 1.8,
        fadeTime: 9.0,
        filterRange: [250, 4000],
        densityThresholds: [0.2, 0.6, 1.6],
      },
      emotion: { colorDeg: 3, phraseShape: 'question', tensionArc: true },
      motion: { primary: 'tilt_rate', melodic: 'beta', sensitivity: 0.7 },
      groove: null,
    },

    // ─── STAGE 2: TUNDRA ─────────────────────────────────────────────
    // Arvo Pärt. Fred Again. Picardy third. One note at a time.
    {
      name: 'tundra',
      harmony: { root: 432, mode: 'picardy' },
      tone: {
        bassFreq: 120, bassGain: 1,
        midFreq: 350, midQ: 0.4, midGain: -3,
        highFreq: 5000, highGain: -9,
        ceiling: 7000,
      },
      space: {
        reverb: { decay: 6.5, damping: 0.08, preDelay: 18 },
        delay: { feedback: 0.4, filter: 3200, sync: 'dotted-eighth' },
        saturation: 0.005,
        type: 'cathedral',
        reverbMix: 0.62,
        spatial: { sweepRate: 0.04, sweepDepth: 0.20 },
      },
      palette: {
        peak: { voice: 'piano', octave: 1, decay: 4.0 },
        continuous: { voice: 'piano', octave: 0, decay: 3.2 },
        texture: { wave: 'sine', chord: [0, 7], octave: -2, detune: 8, vol: 0.018, reverbSend: 0.88 },
        touch: { voice: 'piano', octave: 1, decay: 3.5 },
      },
      response: {
        peakThreshold: 0.5,
        tiltRange: 70,
        noteInterval: 2000,
        melodicEnergy: 0.38,
        melodicMinDelta: 2,
        stillnessThreshold: 0.05,
        stillnessTimeout: 0.3,
        fadeTime: 14.0,
        filterRange: [200, 6000],
        densityThresholds: [0.1, 0.4, 1.0],
      },
      emotion: { colorDeg: 2, phraseShape: 'answer', tensionArc: true },
      motion: { primary: 'magnitude', melodic: 'gamma', sensitivity: 0.35 },
      groove: null,
    },

    // ─── STAGE 3: DARK MATTER ────────────────────────────────────────
    // Inverted. Backwards. Through the tunnel. Phrygian darkness.
    {
      name: 'dark matter',
      harmony: { root: 432, mode: 'phrygian' },
      tone: {
        bassFreq: 55, bassGain: 4,
        midFreq: 500, midQ: 1.2, midGain: -1,
        highFreq: 2000, highGain: -16,
        ceiling: 2500,
      },
      space: {
        reverb: { decay: 5.0, damping: 0.20, preDelay: 6 },
        delay: { feedback: 0.72, filter: 1800, sync: 'dotted-eighth' },
        saturation: 0.12,
        sidechain: 0.7,
        type: 'cathedral',
        reverbMix: 0.55,
        spatial: { sweepRate: 0.17, sweepDepth: 0.80 },
      },
      palette: {
        peak: { voice: 'guitar', octave: 0, decay: 2.8 },
        continuous: { voice: 'guitar', octave: 0, decay: 2.0 },
        harmonic: { voice: 'strings', octave: -1, decay: 3.5 },
        burst: { voice: 'glitch', octave: 0 },
        texture: { wave: 'sawtooth', chord: [0, 1, 7], octave: -2, detune: 20, vol: 0.07, reverbSend: 0.65 },
        touch: { voice: 'guitar', octave: 0, decay: 2.5 },
      },
      response: {
        peakThreshold: 1.0,
        tiltRange: 60,
        noteInterval: 200,
        melodicEnergy: 0.55,
        stillnessThreshold: 0.1,
        stillnessTimeout: 2.5,
        fadeTime: 8.0,
        filterRange: [150, 2000],
        densityThresholds: [0.2, 0.8, 2.0],
      },
      emotion: { colorDeg: 1, phraseShape: 'falling' },
      motion: { primary: 'flow', melodic: 'gamma', sensitivity: 1.1 },
      groove: {
        kit: 'glitch',
        microTiming: { kick: 0, hat: 0, snare: 0 },
        ghosts: 0,
        backbeat: false,
        maxVel: 0.9,
        broken: true,
        dropRate: 0.25,
        doubleRate: 0.15,
      },
    },
  ];

  // ── THE 2 PALETTES ──────────────────────────────────────────────────

  const PRESETS = [

    // ─── 1. JOURNEY ──────────────────────────────────────────────────
    // The organic lens. Evolves through 4 stages.
    // Starts intimate (Drift), builds texture (Still Water),
    // strips to essentials (Tundra), then goes dark (Dark Matter).
    // Your body shapes the music. The stages shape the journey.
    {
      name: 'Journey',
      color: '#3d3550',
      description: 'Your body shapes the music. It evolves with you.',

      // Starts as Drift — follow.js stage system evolves everything
      harmony: { root: 432, mode: 'dorian' },

      tone: {
        bassFreq: 110, bassGain: 5,
        midFreq: 700, midQ: 0.5, midGain: 1,
        highFreq: 2800, highGain: -12,
        ceiling: 3500,
      },

      space: {
        reverb: { decay: 5.0, damping: 0.18, preDelay: 12 },
        delay: { feedback: 0.32, filter: 1600, sync: 'dotted-eighth' },
        saturation: 0.05,
        type: 'cathedral',
        reverbMix: 0.44,
        spatial: { sweepRate: 0.04, sweepDepth: 0.28 },
      },

      palette: {
        continuous: { voice: 'mono', octave: 0, decay: 2.5 },
        peak: { voice: 'piano', octave: -1, decay: 2.5 },
        harmonic: { voice: 'piano', octave: 1, decay: 2.0 },
        touch: { voice: 'piano', octave: 0, decay: 3.0 },
      },

      groove: null,

      response: {
        peakThreshold: 0.35,
        tiltRange: 55,
        noteInterval: 750,
        melodicEnergy: 0.12,
        stillnessThreshold: 0.07,
        stillnessTimeout: 2.5,
        fadeTime: 11.0,
        filterRange: [200, 2800],
        densityThresholds: [0.12, 0.55, 1.3],
      },

      emotion: { colorDeg: 5, phraseShape: 'falling' },

      motion: {
        primary: 'tilt_rate',
        melodic: 'beta',
        sensitivity: 0.8,
      },

      // Stage evolution config
      stages: STAGES,
    },

    // ─── 2. GRID ─────────────────────────────────────────────────────
    // EDM ENGINE. Fixed 128bpm clock. Layer stacking. Filter sweeps. Drops.
    // This lens BYPASSES the organic pipeline entirely.
    {
      name: 'Grid',
      color: '#ff3300',
      description: 'EDM engine. Tilt the filter. Trigger the drop.',

      harmony: { root: 220, mode: 'phrygian' },

      tone: {
        bassFreq: 160, bassGain: 4,
        midFreq: 1000, midQ: 1.0, midGain: 2,
        highFreq: 5000, highGain: -5,
        ceiling: 7000,
      },

      space: {
        reverb: { decay: 1.8, damping: 0.55, preDelay: 12 },
        delay: { feedback: 0.38, filter: 4000, sync: 'dotted-eighth' },
        saturation: 0.12,
        type: 'room',
        reverbMix: 0.15,
        massiveStart: 2,
        spatial: { sweepRate: 0.09, sweepDepth: 0.4 },
      },

      palette: {
        continuous: { voice: 'gridstack', octave: 0, decay: 0.45 },
        peak:       { voice: 'massive',   octave: 0, decay: 1.2  },
        harmonic:   { voice: 'stab',      octave: 0, decay: 0.35 },
        burst:      { voice: 'glitch',    octave: 0 },
        touch:      { voice: 'gridstack', octave: 0, decay: 0.35 },
      },

      groove: {
        kit: '808',
        microTiming: { kick: 0, hat: 0, snare: 0 },
        ghosts: 0.06,
        backbeat: false,
        maxVel: 0.98,
        broken: false,
        dropRate: 0,
      },

      edm: {
        bpm: 128,
        subFreq: 55,
        filterRange: [200, 6000],
        buildArmLevel: 0.65,
      },

      response: {
        peakThreshold: 0.20,
        tiltRange: 48,
        noteInterval: 140,
        melodicEnergy: 0.45,
        stillnessThreshold: 0.14,
        stillnessTimeout: 2.8,
        fadeTime: 3.5,
        filterRange: [200, 8000],
        densityThresholds: [0.18, 0.65, 1.6],
      },

      emotion: { colorDeg: 1, phraseShape: 'falling' },

      motion: {
        primary: 'tilt_rate',
        melodic: 'beta',
        sensitivity: 1.5,
      },
    },

    // ─── ASCENSION ──────────────────────────────────────────────────────
    // Viral "detune unison" wall of sound. Your body IS the synthesizer.
    // Root + Major 3rd + Perfect 5th + Octave, each with unison detune.
    // OTT compression, LFO breathing, white noise air. Bypasses organic pipeline.
    {
      name: 'Ascension',
      color: '#8844ff',
      description: 'Wall of sound. Tilt the filter. You are the synth.',

      harmony: { root: 220, mode: 'major' },

      tone: {
        bassFreq: 88, bassGain: 3,
        midFreq: 1200, midQ: 0.6, midGain: 1,
        highFreq: 4000, highGain: -3,
        ceiling: 6000,
      },

      space: {
        reverb: { decay: 4.5, damping: 0.12, preDelay: 20 },
        delay: { feedback: 0.45, filter: 3200, sync: 'dotted-eighth' },
        saturation: 0.06,
        type: 'cathedral',
        reverbMix: 0.45,
        spatial: { sweepRate: 0.06, sweepDepth: 0.3 },
      },

      palette: {
        continuous: { voice: 'ascLead', octave: 0, decay: 2.0 },
        peak:       { voice: 'ascPluck', octave: 0, decay: 0.8 },
        harmonic:   { voice: 'ascStab',  octave: 0, decay: 0.4 },
        touch:      { voice: 'ascStab',  octave: 0, decay: 0.5 },
      },

      groove: null,

      ascension: {
        wallRoot: 220,
        subFreq: 55,
        bassFreq: 110,
        filterRange: [200, 6000],
        detuneRange: [5, 45],
        portamento: 0.12,
        breathRate: 0.08,
        breathDepth: 1800,
        noiseLevel: 0.06,
        suckDuration: 0.8,           // seconds of suck before slam (the reveal)
        swellCycle: 12.5,             // seconds per breathing swell
        swellDepth: 0.15,             // gain variation (0.15 = ±15%)
        // Hidden songwriter
        bpm: 107,                     // internal grid tempo
        acclimateTime: 5.0,           // seconds of raw exploration before grid lock
        minPitchSamples: 3,           // minimum peaks before analysis can run
        magnetismMax: 0.6,            // max pitch pull strength toward chord tones
        enrichBars: 8,                // bars to full enrichment (~18s at 107)
        reanalyzeBars: 8,             // re-check progression fit every N bars
        // Chord progressions — system picks the one that fits your playing
        progressions: [
          // I → V → vi → IV  (the axis — the prodloveeli sound)
          [[0, 4, 7, 12], [-5, 0, 4, 7], [-3, 0, 4, 9], [-5, 0, 5, 9]],
          // I → IV → V → vi  (pop canon)
          [[0, 4, 7, 12], [0, 5, 9, 12], [-5, 0, 4, 7], [-3, 0, 4, 9]],
          // vi → IV → I → V  (emotional minor start)
          [[-3, 0, 4, 9], [-5, 0, 5, 9], [0, 4, 7, 12], [-5, 0, 4, 7]],
          // I → vi → ii → V  (jazz-inflected)
          [[0, 4, 7, 12], [-3, 0, 4, 9], [-5, 2, 5, 9], [-5, -1, 4, 7]],
        ],
      },

      response: {
        peakThreshold: 0.28,
        tiltRange: 50,
        noteInterval: 300,
        melodicEnergy: 0.18,
        stillnessThreshold: 0.10,
        stillnessTimeout: 2.0,
        fadeTime: 6.0,
        filterRange: [200, 6000],
        densityThresholds: [0.15, 0.5, 1.2],
      },

      emotion: { colorDeg: 3, phraseShape: 'rising' },

      motion: {
        primary: 'tilt_rate',
        melodic: 'beta',
        sensitivity: 1.0,
      },
    },
  ];

  // ── STATE ──────────────────────────────────────────────────────────

  let activeLens = null;
  let activeIndex = 0;
  let pickerBuilt = false;

  // ── PICKER UI ──────────────────────────────────────────────────────

  function buildPicker() {
    if (pickerBuilt) return;
    var container = document.getElementById('lens-scroll');
    if (!container) return;

    for (var i = 0; i < PRESETS.length; i++) {
      var p = PRESETS[i];
      var item = document.createElement('div');
      item.className = 'protocol-item';
      item.setAttribute('data-index', i);

      var num = (i + 1 < 10 ? '0' : '') + (i + 1);
      item.innerHTML =
        '<span class="p-cursor">&ndash;</span>' +
        '<span class="p-num">' + num + '</span>' +
        '<div class="p-body">' +
          '<div class="p-name">' + p.name + '</div>' +
          '<div class="p-desc">' + p.description + '</div>' +
        '</div>';

      item.addEventListener('touchstart', (function (idx) {
        return function (e) { e.stopPropagation(); selectCard(idx); };
      })(i), { passive: true });

      item.addEventListener('click', (function (idx) {
        return function (e) { e.stopPropagation(); selectCard(idx); };
      })(i));

      container.appendChild(item);
    }

    pickerBuilt = true;
    restoreFromStorage();
  }

  function selectCard(index) {
    activeIndex = index;
    activeLens = PRESETS[index];

    var items = document.querySelectorAll('.protocol-item');
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle('selected', i === index);
    }

    var cmdIn = document.getElementById('cmd-input');
    if (cmdIn) {
      cmdIn.value = 'run ' + activeLens.name.toLowerCase();
    }

    saveToStorage();
  }

  function getSelected() {
    return activeLens;
  }

  // ── LIVE LENS SWITCHING ────────────────────────────────────────────

  function nextLens() {
    activeIndex = (activeIndex + 1) % PRESETS.length;
    activeLens = PRESETS[activeIndex];
    Audio.configure(activeLens);
    Follow.applyLens(activeLens);
    updateIndicator();
    saveToStorage();
    return activeLens;
  }

  function prevLens() {
    activeIndex = (activeIndex - 1 + PRESETS.length) % PRESETS.length;
    activeLens = PRESETS[activeIndex];
    Audio.configure(activeLens);
    Follow.applyLens(activeLens);
    updateIndicator();
    saveToStorage();
    return activeLens;
  }

  function updateIndicator() {
    var el = document.getElementById('lens-indicator');
    if (el && activeLens) {
      el.textContent = activeLens.name;
    }
  }

  // ── PERSISTENCE ────────────────────────────────────────────────────

  function saveToStorage() {
    try { localStorage.setItem('m2_lens', JSON.stringify({ index: activeIndex })); } catch (e) {}
  }

  function restoreFromStorage() {
    // With only 2 lenses, start on Journey (0) by default
    // unless the user explicitly chose Grid last time
    var lastIndex = 0;
    try {
      var s = localStorage.getItem('m2_lens');
      if (s) { var d = JSON.parse(s); lastIndex = d.index || 0; }
    } catch (e) {}
    // Clamp to valid range
    if (lastIndex >= PRESETS.length) lastIndex = 0;
    selectCard(lastIndex);
  }

  // ── SHARING ────────────────────────────────────────────────────────

  function shareLens(lens) {
    try {
      var encoded = btoa(encodeURIComponent(JSON.stringify(lens)));
      var url = window.location.origin + window.location.pathname + '?lens=' + encoded;
      if (navigator.clipboard) navigator.clipboard.writeText(url);
      return url;
    } catch (e) { return null; }
  }

  function loadFromURL() {
    try {
      var params = new URLSearchParams(window.location.search);
      var encoded = params.get('lens');
      if (encoded) {
        var lens = JSON.parse(decodeURIComponent(atob(encoded)));
        if (lens && lens.name) { activeLens = lens; return lens; }
      }
    } catch (e) {}
    return null;
  }

  // ── PUBLIC ─────────────────────────────────────────────────────────

  return Object.freeze({
    PRESETS: PRESETS,
    STAGES: STAGES,
    buildPicker: buildPicker,
    selectCard: selectCard,
    getSelected: getSelected,
    nextLens: nextLens,
    prevLens: prevLens,
    updateIndicator: updateIndicator,
    shareLens: shareLens,
    loadFromURL: loadFromURL,
    get active() { return activeLens; },
    get activeIndex() { return activeIndex; },
  });
})();
