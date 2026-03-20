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
      description: 'Boards of Canada. Two hands on piano. Dorian warmth.',
      color: '#6b5b4f',
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
        densityThresholds: [1.5, 4.0, 8.0],
      },
      emotion: { colorDeg: 5, phraseShape: 'falling' },
      motion: { primary: 'tilt_rate', melodic: 'beta', sensitivity: 0.8 },
      groove: null,
    },

    // ─── STAGE 1: STILL WATER ────────────────────────────────────────
    // Nils Frahm. Jon Hopkins. Lydian wonder. Strings with vibrato.
    {
      name: 'still water',
      description: 'Nils Frahm. Strings and wonder. Lydian light.',
      color: '#4a6670',
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
        peak: { voice: 'piano', octave: 1, decay: 2.5 },       // octave UP — separate from strings melody
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
        densityThresholds: [1.5, 4.5, 9.0],
      },
      emotion: { colorDeg: 3, phraseShape: 'question', tensionArc: true },
      motion: { primary: 'tilt_rate', melodic: 'beta', sensitivity: 0.7 },
      groove: null,
    },

    // ─── STAGE 2: TUNDRA ─────────────────────────────────────────────
    // Arvo Pärt. Fred Again. Picardy third. One note at a time.
    {
      name: 'tundra',
      description: 'Arvo Part. One note. Vast silence. Picardy resolve.',
      color: '#8a9ba8',
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
        densityThresholds: [1.0, 3.0, 7.0],
      },
      emotion: { colorDeg: 2, phraseShape: 'answer', tensionArc: true },
      motion: { primary: 'magnitude', melodic: 'gamma', sensitivity: 0.35 },
      groove: null,
    },

    // ─── STAGE 3: DARK MATTER ────────────────────────────────────────
    // Inverted. Backwards. Through the tunnel. Phrygian darkness.
    {
      name: 'dark matter',
      description: 'Zimmer. Organ swells. Phrygian darkness.',
      color: '#2a1f3d',
      // Interstellar docking scene: organ swells, relentless tick,
      // dissonance building until you can't breathe. Zimmer.
      harmony: { root: 432, mode: 'phrygian' },
      tone: {
        bassFreq: 55, bassGain: 6,          // massive organ sub
        midFreq: 400, midQ: 0.8, midGain: 2, // organ body — mids present
        highFreq: 1800, highGain: -10,       // dark but not muffled
        ceiling: 3000,
      },
      space: {
        reverb: { decay: 7.0, damping: 0.15, preDelay: 20 },  // cathedral organ space
        delay: { feedback: 0.55, filter: 1200, sync: 'eighth' },  // ticking echo
        saturation: 0.08,
        sidechain: 0.6,
        type: 'cathedral',
        reverbMix: 0.60,
        spatial: { sweepRate: 0, sweepDepth: 0 },  // no auto-pan — organ is centered, massive
      },
      palette: {
        // Organ-like voices: sustained, swelling, massive
        peak: { voice: 'organ', octave: -1, decay: 4.0 },     // pedal register — separate from melody
        continuous: { voice: 'organ', octave: 0, decay: 3.5 },
        harmonic: { voice: 'strings', octave: -1, decay: 5.0 },  // string swells underneath
        burst: { voice: 'glitch', octave: 0 },
        // Foundation: dissonant organ cluster — root + minor 2nd + fifth
        texture: { wave: 'sawtooth', chord: [0, 1, 7], octave: -2, detune: 15, vol: 0.09, reverbSend: 0.70 },
        touch: { voice: 'organ', octave: -1, decay: 4.0 },
      },
      response: {
        peakThreshold: 0.80,
        tiltRange: 60,
        noteInterval: 900,   // organ swells are sustained — don't rapid-fire
        melodicEnergy: 0.45,
        stillnessThreshold: 0.1,
        stillnessTimeout: 2.5,
        fadeTime: 8.0,
        filterRange: [150, 3000],  // wider — let the organ breathe
        densityThresholds: [2.0, 5.0, 10.0],
      },
      emotion: { colorDeg: 1, phraseShape: 'falling' },
      motion: { primary: 'flow', melodic: 'gamma', sensitivity: 1.1 },
      groove: {
        // The relentless tick — not a beat, a clock
        kit: 'glitch',
        microTiming: { kick: 0, hat: 0, snare: 0 },
        ghosts: 0,
        backbeat: false,
        maxVel: 0.9,
        broken: true,
        dropRate: 0,       // relentless tick — a clock doesn't skip beats
        doubleRate: 0.15,
      },
    },
  ];

  // ── THE 2 PALETTES ──────────────────────────────────────────────────

  const PRESETS = [

    // ─── INDIVIDUAL LENSES — each a complete world ──────────────────
    // Drift, Still Water, Tundra, Dark Matter from the old Journey stages
    STAGES[0],  // 0: Drift
    STAGES[1],  // 1: Still Water
    STAGES[2],  // 2: Tundra
    STAGES[3],  // 3: Dark Matter

    // ─── JOURNEY — evolves through all 4 stages ─────────────────────
    {
      name: 'Journey',
      color: '#3d3550',
      description: 'Evolves through all four worlds.',

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
        densityThresholds: [1.5, 4.0, 8.0],
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
        densityThresholds: [1.5, 4.5, 9.0],
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
        midFreq: 800, midQ: 0.6, midGain: 2,  // boost mids — fill the gap
        highFreq: 3500, highGain: -3,          // gentle high cut, not muted
        ceiling: 4000,
      },

      space: {
        reverb: { decay: 6.0, damping: 0.25, preDelay: 30 },  // longer, darker reverb
        delay: { feedback: 0.50, filter: 2400, sync: 'dotted-eighth' },  // darker delay
        saturation: 0.03,         // less saturation — cleaner
        type: 'cathedral',
        reverbMix: 0.55,          // more wet — swimming in space
        spatial: { sweepRate: 0.04, sweepDepth: 0.2 },
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
        filterRange: [120, 4000],    // 120Hz = deep rumble start. 4000 = heaven ceiling
        detuneRange: [5, 25],        // shimmer grows with presence
        breathRate: 0.05,            // slow meditative
        breathDepth: 800,            // gentle filter sweep during breath
        noiseLevel: 0.03,
        swellCycle: 14.0,
        bloomTime: 8.0,              // seconds of engaged time to full bloom
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
        densityThresholds: [1.5, 4.0, 8.0],
      },

      emotion: { colorDeg: 3, phraseShape: 'rising' },

      motion: {
        primary: 'tilt_rate',
        melodic: 'beta',
        sensitivity: 1.0,
      },
    },

    // ─── MIDNIGHT ───────────────────────────────────────────────────────
    // Lo-fi hip hop. 2am head-nod. Mixolydian warmth, tape wobble.
    // Slow, warm, dusty. The b7 gives it that jazzy unresolved feeling.
    // Rhodes + upright bass + brushes. Tilt = lazy melody. Motion = groove depth.
    {
      name: 'Midnight',
      color: '#4a3728',
      description: 'Lo-fi. Dusty Rhodes. Head-nod groove.',

      harmony: { root: 392, mode: 'mixolydian' },  // G3 — warm register

      tone: {
        bassFreq: 100, bassGain: 4,
        midFreq: 600, midQ: 0.4, midGain: 2,    // warm mids — Rhodes body
        highFreq: 2200, highGain: -14,           // heavy rolloff — lo-fi
        ceiling: 2800,                           // nothing sparkles at midnight
      },

      space: {
        reverb: { decay: 2.5, damping: 0.45, preDelay: 25 },  // small room, damped
        delay: { feedback: 0.42, filter: 1400, sync: 'dotted-eighth' },
        saturation: 0.10,        // tape warmth
        type: 'room',
        reverbMix: 0.28,
        spatial: { sweepRate: 0.02, sweepDepth: 0.15 },  // barely moving
      },

      palette: {
        continuous: { voice: 'epiano', octave: 0, decay: 2.8 },
        peak:       { voice: 'upright', octave: -1, decay: 1.8 },
        harmonic:   { voice: 'epiano', octave: 1, decay: 2.2 },
        touch:      { voice: 'bell', octave: 1, decay: 3.5 },
      },

      groove: {
        kit: 'brushes',
        microTiming: { kick: 0.02, hat: 0.01, snare: 0.015 },  // human swing
        ghosts: 0.12,       // lots of ghost notes — brushes live in ghosts
        backbeat: true,     // snare on 2 and 4
        maxVel: 0.55,       // quiet — it's midnight
        broken: false,
        dropRate: 0.08,     // occasional dropped hit — human feel
      },

      response: {
        peakThreshold: 0.30,
        tiltRange: 45,
        noteInterval: 600,       // slow lazy melody
        melodicEnergy: 0.15,
        stillnessThreshold: 0.06,
        stillnessTimeout: 3.0,
        fadeTime: 8.0,
        filterRange: [200, 2200],
        densityThresholds: [1.5, 4.0, 8.0],
      },

      emotion: { colorDeg: 6, phraseShape: 'falling' },  // b7 = mixolydian soul

      motion: {
        primary: 'tilt_rate',
        melodic: 'beta',
        sensitivity: 0.6,    // gentle — you barely have to move
      },
    },

    // ─── CATHEDRAL ──────────────────────────────────────────────────────
    // Ambient choral. Eyes-closed meditation. Sustained voices, vast space.
    // No rhythm. No melody unless you move. Pure harmonic texture.
    // Aeolian minor — natural, ancient, no sharps.
    {
      name: 'Cathedral',
      color: '#2d3a4a',
      description: 'Choral ambient. Voices in vast space. Stillness.',

      harmony: { root: 220, mode: 'minor' },  // A natural minor — pure

      tone: {
        bassFreq: 80, bassGain: 2,
        midFreq: 500, midQ: 0.3, midGain: 0,    // flat mids — space for voices
        highFreq: 4000, highGain: -6,
        ceiling: 5000,
      },

      space: {
        reverb: { decay: 8.0, damping: 0.10, preDelay: 40 },  // massive cathedral
        delay: { feedback: 0.60, filter: 2000, sync: 'quarter' },
        saturation: 0.02,
        type: 'cathedral',
        reverbMix: 0.70,         // swimming in reverb
        spatial: { sweepRate: 0.03, sweepDepth: 0.35 },
      },

      palette: {
        continuous: { voice: 'formant', octave: 0, decay: 5.0 },   // voice-like
        peak:       { voice: 'bell', octave: 1, decay: 4.0 },      // bell strikes
        harmonic:   { voice: 'organ', octave: -1, decay: 6.0 },    // organ sustain
        texture: { wave: 'sine', chord: [0, 7, 12], octave: -1, detune: 3, vol: 0.04, reverbSend: 0.85 },
        touch:      { voice: 'formant', octave: 1, decay: 4.0 },
      },

      groove: null,  // no drums. silence is sacred.

      response: {
        peakThreshold: 0.45,
        tiltRange: 60,
        noteInterval: 1500,      // very slow — one voice at a time
        melodicEnergy: 0.25,
        stillnessThreshold: 0.04,
        stillnessTimeout: 1.5,   // enters void quickly — stillness is the point
        fadeTime: 15.0,          // very long fade — voices linger
        filterRange: [200, 4500],
        densityThresholds: [1.0, 3.0, 6.0],
      },

      emotion: { colorDeg: 5, phraseShape: 'question' },  // the 6th degree — Aeolian yearning

      motion: {
        primary: 'magnitude',
        melodic: 'beta',
        sensitivity: 0.5,   // responsive to gentle gestures
      },
    },

    // ─── PULSE ──────────────────────────────────────────────────────────
    // Minimal techno. 118 BPM. Hypnotic. Repetitive. Slowly evolving.
    // The opposite of Grid's maximalism. Less is more.
    // Minor mode — dark, driving, relentless. Tilt = filter only.
    {
      name: 'Pulse',
      color: '#1a2a1a',
      description: 'Minimal techno. Hypnotic. Less is everything.',

      harmony: { root: 196, mode: 'minor' },  // G2 — deep and dark

      tone: {
        bassFreq: 140, bassGain: 5,
        midFreq: 900, midQ: 1.2, midGain: 1,
        highFreq: 4000, highGain: -8,
        ceiling: 5500,
      },

      space: {
        reverb: { decay: 3.5, damping: 0.35, preDelay: 15 },
        delay: { feedback: 0.55, filter: 1800, sync: 'eighth' },  // tight delay
        saturation: 0.06,
        type: 'room',
        reverbMix: 0.22,
        sidechain: 0.45,     // constant pump — the heartbeat
        spatial: { sweepRate: 0.06, sweepDepth: 0.5 },  // wide auto-pan
      },

      palette: {
        continuous: { voice: 'pluck', octave: 0, decay: 0.6 },    // short, percussive
        peak:       { voice: 'stab', octave: 0, decay: 0.3 },
        harmonic:   { voice: 'fm', octave: -1, decay: 1.5 },
        burst:      { voice: 'glitch', octave: 0 },
        touch:      { voice: 'pluck', octave: 1, decay: 0.4 },
      },

      groove: {
        kit: '808',
        microTiming: { kick: 0, hat: 0.005, snare: 0 },
        ghosts: 0.03,
        backbeat: false,
        maxVel: 0.80,
        broken: false,
        dropRate: 0,
      },

      edm: {
        bpm: 118,
        subFreq: 49,       // G1
        filterRange: [150, 5000],
        buildArmLevel: 0.70,   // longer builds — minimal is patient
      },

      response: {
        peakThreshold: 0.25,
        tiltRange: 50,
        noteInterval: 200,
        melodicEnergy: 0.35,
        stillnessThreshold: 0.12,
        stillnessTimeout: 3.0,
        fadeTime: 4.0,
        filterRange: [150, 5000],
        densityThresholds: [2.0, 5.0, 10.0],
      },

      emotion: { colorDeg: 2, phraseShape: 'falling' },  // minor 3rd — dark

      motion: {
        primary: 'tilt_rate',
        melodic: 'beta',
        sensitivity: 1.2,
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
    // Default to Still Water (index 1) — album opener
    var lastIndex = 1;
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
