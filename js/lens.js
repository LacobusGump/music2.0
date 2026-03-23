/**
 * LENS — Ten Worlds
 *
 * Each lens is a complete musical universe: harmonic language, timbral palette,
 * rhythmic personality, spatial architecture, response curve, pipeline routing.
 * When you switch lenses, every module reconfigures.
 *
 * Research basis:
 *   Mehr et al. 2019 — Four functions of music: dance, love, healing, lullabies.
 *     Grid = dance. Cathedral = healing. Midnight = love. Journey = the full arc.
 *   Patel & Daniele 2003 — Prosodic DNA: a culture's speech rhythm lives in its music.
 *   Wang & Wichmann 2023 — Climate shapes voice. Lenses embody climatic personalities.
 *
 * A lens is a world, not a prison. Every parameter sets a DEFAULT that the
 * user's body can override. The lens shapes the space. The body fills it.
 *
 * GUMP v2 — Module 7
 */

const Lens = (function () {
  'use strict';

  // ── ORGANIC STAGES ─────────────────────────────────────────────────────
  // The four organic worlds. Journey crossfades between them.
  // Order: intimate warmth → flowing texture → vast silence → dark intensity

  var STAGES = [

    // ─── STAGE 0: DRIFT ──────────────────────────────────────────────
    // Boards of Canada. One piano. Two hands. Dorian warmth.
    // The b3 and b7 give it that nostalgic VHS quality.
    {
      name: 'drift',
      description: 'Boards of Canada. Two hands on piano. Dorian warmth.',
      color: '#6b5b4f',

      harmony: {
        root: 432,
        mode: 'dorian',
        gravityStrength: 0.4,
        contourBias: 'arch',
      },

      rhythm: {
        bpm: [60, 90],
        steps: 8,
        kit: 'brushes',
        initialPresence: 0,
        grooveDNA: null,
        swing: 0.15,
        ghostLevel: 0.08,
        euclideanRange: [2, 5],
        microTiming: { kick: 0.015, hat: 0.01, snare: 0.012 },
      },

      tone: {
        bassFreq: 110,
        bassGain: 5,
        midFreq: 700,
        midQ: 0.5,
        midGain: 1,
        highFreq: 2800,
        highGain: -12,
        ceiling: 3500,
      },

      space: {
        reverb: { decay: 5.0, damping: 0.18, preDelay: 12 },
        delay: { feedback: 0.32, filter: 1600, sync: 'dotted-eighth' },
        saturation: 0.05,
        reverbMix: 0.44,
        sidechain: 0,
        spatial: { sweepRate: 0.04, sweepDepth: 0.28 },
      },

      palette: {
        continuous: { voice: 'mono', octave: 0, decay: 2.5 },
        peak: { voice: 'piano', octave: -1, decay: 2.5 },
        harmonic: { voice: 'piano', octave: 1, decay: 2.0 },
        touch: { voice: 'piano', octave: 0, decay: 3.0 },
        texture: null,
        burst: null,
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

      weather: { temperatureInfluence: 0.6, humidityInfluence: 0.4 },

      pipeline: 'organic',
    },

    // ─── STAGE 1: STILL WATER ────────────────────────────────────────
    // Nils Frahm. Jon Hopkins. Lydian wonder. Strings with vibrato.
    // The #4 lifts everything — floating, weightless, curious.
    {
      name: 'still water',
      description: 'Nils Frahm. Strings and wonder. Lydian light.',
      color: '#4a6670',

      harmony: {
        root: 440,
        mode: 'lydian',
        gravityStrength: 0.3,
        contourBias: 'question',
      },

      rhythm: {
        bpm: [55, 80],
        steps: 8,
        kit: 'brushes',
        initialPresence: 0,
        grooveDNA: null,
        swing: 0.10,
        ghostLevel: 0.05,
        euclideanRange: [2, 4],
        microTiming: { kick: 0.01, hat: 0.008, snare: 0.01 },
      },

      tone: {
        bassFreq: 90,
        bassGain: 3,
        midFreq: 700,
        midQ: 0.6,
        midGain: -1,
        highFreq: 3200,
        highGain: -7,
        ceiling: 4500,
      },

      space: {
        reverb: { decay: 4.5, damping: 0.20, preDelay: 28 },
        delay: { feedback: 0.55, filter: 2400, sync: 'dotted-eighth' },
        saturation: 0.04,
        reverbMix: 0.5,
        sidechain: 0,
        spatial: { sweepRate: 0.10, sweepDepth: 0.48 },
      },

      palette: {
        continuous: { voice: 'strings', octave: 0, decay: 3.5 },
        peak: { voice: 'piano', octave: 1, decay: 2.5 },
        harmonic: { voice: 'piano', octave: 1, decay: 2.0 },
        touch: { voice: 'piano', octave: 0, decay: 2.0 },
        texture: { wave: 'sine', chord: [0, 4, 7, 11], octave: -1, detune: 5, vol: 0.05, reverbSend: 0.62 },
        burst: null,
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

      weather: { temperatureInfluence: 0.7, humidityInfluence: 0.5 },

      pipeline: 'organic',
    },

    // ─── STAGE 2: TUNDRA ─────────────────────────────────────────────
    // Arvo Part. Fred Again. Picardy third. One note at a time.
    // The major 7th in minor context = unexpected warmth in vast cold.
    {
      name: 'tundra',
      description: 'Arvo Part. One note. Vast silence. Picardy resolve.',
      color: '#8a9ba8',

      harmony: {
        root: 432,
        mode: 'picardy',
        gravityStrength: 0.7,
        contourBias: 'answer',
      },

      rhythm: {
        bpm: [40, 65],
        steps: 8,
        kit: 'acoustic',
        initialPresence: 0,
        grooveDNA: null,
        swing: 0,
        ghostLevel: 0,
        euclideanRange: [1, 3],
        microTiming: { kick: 0, hat: 0, snare: 0 },
      },

      tone: {
        bassFreq: 120,
        bassGain: 1,
        midFreq: 350,
        midQ: 0.4,
        midGain: -3,
        highFreq: 5000,
        highGain: -9,
        ceiling: 7000,
      },

      space: {
        reverb: { decay: 6.5, damping: 0.08, preDelay: 18 },
        delay: { feedback: 0.4, filter: 3200, sync: 'dotted-eighth' },
        saturation: 0.005,
        reverbMix: 0.62,
        sidechain: 0,
        spatial: { sweepRate: 0.04, sweepDepth: 0.20 },
      },

      palette: {
        continuous: { voice: 'piano', octave: 0, decay: 3.2 },
        peak: { voice: 'piano', octave: 1, decay: 4.0 },
        harmonic: { voice: 'bell', octave: 2, decay: 5.0 },
        touch: { voice: 'piano', octave: 1, decay: 3.5 },
        texture: { wave: 'sine', chord: [0, 7], octave: -2, detune: 8, vol: 0.018, reverbSend: 0.88 },
        burst: null,
      },

      response: {
        peakThreshold: 0.5,
        tiltRange: 70,
        noteInterval: 2000,
        melodicEnergy: 0.38,
        stillnessThreshold: 0.05,
        stillnessTimeout: 0.3,
        fadeTime: 14.0,
        filterRange: [200, 6000],
        densityThresholds: [1.0, 3.0, 7.0],
      },

      emotion: { colorDeg: 2, phraseShape: 'answer', tensionArc: true },

      motion: { primary: 'magnitude', melodic: 'gamma', sensitivity: 0.35 },

      weather: { temperatureInfluence: 0.9, humidityInfluence: 0.3 },

      pipeline: 'organic',
    },

    // ─── STAGE 3: DARK MATTER ────────────────────────────────────────
    // Inverted. Through the tunnel. Phrygian darkness.
    // Interstellar docking scene: organ swells, relentless tick,
    // dissonance building until you can't breathe. Zimmer.
    {
      name: 'dark matter',
      description: 'Zimmer. Organ swells. Phrygian darkness.',
      color: '#2a1f3d',

      harmony: {
        root: 432,
        mode: 'phrygian',
        gravityStrength: 0.6,
        contourBias: 'falling',
      },

      rhythm: {
        bpm: [70, 100],
        steps: 16,
        kit: 'glitch',
        initialPresence: 0.3,
        grooveDNA: null,
        swing: 0,
        ghostLevel: 0,
        euclideanRange: [3, 7],
        microTiming: { kick: 0, hat: 0, snare: 0 },
      },

      tone: {
        bassFreq: 55,
        bassGain: 6,
        midFreq: 400,
        midQ: 0.8,
        midGain: 2,
        highFreq: 1800,
        highGain: -10,
        ceiling: 3000,
      },

      space: {
        reverb: { decay: 7.0, damping: 0.15, preDelay: 20 },
        delay: { feedback: 0.55, filter: 1200, sync: 'eighth' },
        saturation: 0.08,
        reverbMix: 0.60,
        sidechain: 0.6,
        spatial: { sweepRate: 0, sweepDepth: 0 },
      },

      palette: {
        continuous: { voice: 'organ', octave: 0, decay: 3.5 },
        peak: { voice: 'organ', octave: -1, decay: 4.0 },
        harmonic: { voice: 'strings', octave: -1, decay: 5.0 },
        touch: { voice: 'organ', octave: -1, decay: 4.0 },
        texture: { wave: 'sawtooth', chord: [0, 1, 7], octave: -2, detune: 15, vol: 0.09, reverbSend: 0.70 },
        burst: { voice: 'glitch', octave: 0 },
      },

      response: {
        peakThreshold: 0.80,
        tiltRange: 60,
        noteInterval: 900,
        melodicEnergy: 0.45,
        stillnessThreshold: 0.1,
        stillnessTimeout: 2.5,
        fadeTime: 8.0,
        filterRange: [150, 3000],
        densityThresholds: [2.0, 5.0, 10.0],
      },

      emotion: { colorDeg: 1, phraseShape: 'falling' },

      motion: { primary: 'flow', melodic: 'gamma', sensitivity: 1.1 },

      weather: { temperatureInfluence: 0.3, humidityInfluence: 0.2 },

      pipeline: 'organic',
    },
  ];


  // ── THE 10 LENSES ──────────────────────────────────────────────────────
  // Each lens is a complete, playable world.
  // Grid (index 5) is the default — strongest first impression.

  var PRESETS = [

    // ─── 0: DRIFT ────────────────────────────────────────────────────
    // Boards of Canada. Two hands on piano. Dorian warmth.
    STAGES[0],

    // ─── 1: STILL WATER ──────────────────────────────────────────────
    // Nils Frahm. Strings and wonder. Lydian light.
    STAGES[1],

    // ─── 2: TUNDRA ───────────────────────────────────────────────────
    // Arvo Part. One note. Vast silence.
    STAGES[2],

    // ─── 3: DARK MATTER ──────────────────────────────────────────────
    // Zimmer. Organ swells. Cathedral.
    STAGES[3],

    // ─── 4: JOURNEY ──────────────────────────────────────────────────
    // Evolves through all four worlds. ~2.5 min per stage.
    // Starts as Drift — flow.js stage system crossfades through them all.
    {
      name: 'Journey',
      description: 'Evolves through all four worlds. 2.5 min per stage.',
      color: '#3d3550',

      harmony: {
        root: 432,
        mode: 'dorian',
        gravityStrength: 0.4,
        contourBias: 'arch',
      },

      rhythm: {
        bpm: [60, 90],
        steps: 8,
        kit: 'brushes',
        initialPresence: 0,
        grooveDNA: null,
        swing: 0.15,
        ghostLevel: 0.08,
        euclideanRange: [2, 5],
        microTiming: { kick: 0.015, hat: 0.01, snare: 0.012 },
      },

      tone: {
        bassFreq: 110,
        bassGain: 5,
        midFreq: 700,
        midQ: 0.5,
        midGain: 1,
        highFreq: 2800,
        highGain: -12,
        ceiling: 3500,
      },

      space: {
        reverb: { decay: 5.0, damping: 0.18, preDelay: 12 },
        delay: { feedback: 0.32, filter: 1600, sync: 'dotted-eighth' },
        saturation: 0.05,
        reverbMix: 0.44,
        sidechain: 0,
        spatial: { sweepRate: 0.04, sweepDepth: 0.28 },
      },

      palette: {
        continuous: { voice: 'mono', octave: 0, decay: 2.5 },
        peak: { voice: 'piano', octave: -1, decay: 2.5 },
        harmonic: { voice: 'piano', octave: 1, decay: 2.0 },
        touch: { voice: 'piano', octave: 0, decay: 3.0 },
        texture: null,
        burst: null,
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

      weather: { temperatureInfluence: 0.6, humidityInfluence: 0.4 },

      pipeline: 'organic',

      // Stage evolution: 4 stages, ~2.5 min each, crossfade between them
      stages: STAGES,
    },

    // ─── 5: GRID (DEFAULT) ───────────────────────────────────────────
    // EDM ENGINE. Fixed 128 BPM clock. Layer stacking. Filter sweeps. Drops.
    // Bypasses organic pipeline entirely. You ARE the DJ.
    {
      name: 'Grid',
      description: 'EDM engine. Tilt the filter. Trigger the drop.',
      color: '#ff3300',

      harmony: {
        root: 220,
        mode: 'phrygian',
        gravityStrength: 0.8,
        contourBias: 'falling',
      },

      rhythm: {
        bpm: 128,
        steps: 16,
        kit: '808',
        initialPresence: 0.7,
        grooveDNA: null,
        swing: 0,
        ghostLevel: 0.06,
        euclideanRange: [4, 12],
        microTiming: { kick: 0, hat: 0, snare: 0 },
      },

      tone: {
        bassFreq: 160,
        bassGain: 4,
        midFreq: 1000,
        midQ: 1.0,
        midGain: 2,
        highFreq: 5000,
        highGain: -5,
        ceiling: 7000,
      },

      space: {
        reverb: { decay: 1.8, damping: 0.55, preDelay: 12 },
        delay: { feedback: 0.38, filter: 4000, sync: 'dotted-eighth' },
        saturation: 0.12,
        reverbMix: 0.15,
        sidechain: 0.5,
        spatial: { sweepRate: 0.09, sweepDepth: 0.4 },
      },

      palette: {
        continuous: { voice: 'gridstack', octave: 0, decay: 0.45 },
        peak: { voice: 'massive', octave: 0, decay: 1.2 },
        harmonic: { voice: 'stab', octave: 0, decay: 0.35 },
        touch: { voice: 'gridstack', octave: 0, decay: 0.35 },
        texture: null,
        burst: { voice: 'glitch', octave: 0 },
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

      motion: { primary: 'tilt_rate', melodic: 'beta', sensitivity: 1.5 },

      weather: { temperatureInfluence: 0.2, humidityInfluence: 0.1 },

      pipeline: 'grid',

      // EDM config — required by flow.js initGrid()
      edm: {
        bpm: 128,
        filterRange: [200, 8000],
        buildBars: 8,
        dropBars: 16,
        breakdownBars: 8,
      },
    },

    // ─── 6: ASCENSION ────────────────────────────────────────────────
    // Wall of sound. Detuned unison. Your body IS the synthesizer.
    // Root + Major 3rd + Perfect 5th + Octave, each with unison detune.
    // OTT compression, LFO breathing, white noise air.
    {
      name: 'Ascension',
      description: 'Wall of sound. Detuned unison. You are the synth.',
      color: '#8844ff',

      harmony: {
        root: 220,
        mode: 'ionian',
        gravityStrength: 0.5,
        contourBias: 'rising',
      },

      rhythm: {
        bpm: [70, 100],
        steps: 8,
        kit: 'acoustic',
        initialPresence: 0,
        grooveDNA: null,
        swing: 0,
        ghostLevel: 0,
        euclideanRange: [1, 3],
        microTiming: { kick: 0, hat: 0, snare: 0 },
      },

      tone: {
        bassFreq: 88,
        bassGain: 3,
        midFreq: 800,
        midQ: 0.6,
        midGain: 2,
        highFreq: 3500,
        highGain: -3,
        ceiling: 4000,
      },

      space: {
        reverb: { decay: 6.0, damping: 0.25, preDelay: 30 },
        delay: { feedback: 0.50, filter: 2400, sync: 'dotted-eighth' },
        saturation: 0.03,
        reverbMix: 0.55,
        sidechain: 0,
        spatial: { sweepRate: 0.04, sweepDepth: 0.2 },
      },

      palette: {
        continuous: { voice: 'unisonWall', octave: 0, decay: 2.0 },
        peak: { voice: 'massive', octave: 0, decay: 0.8 },
        harmonic: { voice: 'stab', octave: 0, decay: 0.4 },
        touch: { voice: 'massive', octave: 0, decay: 0.5 },
        texture: null,
        burst: null,
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

      motion: { primary: 'tilt_rate', melodic: 'beta', sensitivity: 1.0 },

      weather: { temperatureInfluence: 0.4, humidityInfluence: 0.3 },

      pipeline: 'ascension',

      // Ascension config — required by flow.js initAscension()
      ascension: {
        filterRange: [200, 6000],
        detuneRange: [5, 30],
        wallRoot: 220,
        chordProgression: [[0, 4, 7], [0, 4, 7, 12], [0, 3, 7], [0, 5, 7]],
        bloomThreshold: 0.6,
      },
    },

    // ─── 7: MIDNIGHT ─────────────────────────────────────────────────
    // Lo-fi hip hop. 2am head-nod. Mixolydian warmth, tape wobble.
    // Slow, warm, dusty. The b7 gives it that jazzy unresolved feeling.
    // Rhodes + upright bass + brushes. Tilt = lazy melody. Motion = groove depth.
    {
      name: 'Midnight',
      description: 'Lo-fi. Dusty Rhodes. Head-nod groove.',
      color: '#4a3728',

      harmony: {
        root: 392,
        mode: 'mixolydian',
        gravityStrength: 0.5,
        contourBias: 'arch',
      },

      rhythm: {
        bpm: [72, 88],
        steps: 16,
        kit: 'brushes',
        initialPresence: 0.4,
        grooveDNA: null,
        swing: 0.35,
        ghostLevel: 0.12,
        euclideanRange: [3, 7],
        microTiming: { kick: 0.02, hat: 0.01, snare: 0.015 },
      },

      tone: {
        bassFreq: 100,
        bassGain: 4,
        midFreq: 600,
        midQ: 0.4,
        midGain: 2,
        highFreq: 2200,
        highGain: -14,
        ceiling: 2800,
      },

      space: {
        reverb: { decay: 2.5, damping: 0.45, preDelay: 25 },
        delay: { feedback: 0.42, filter: 1400, sync: 'dotted-eighth' },
        saturation: 0.10,
        reverbMix: 0.28,
        sidechain: 0,
        spatial: { sweepRate: 0.02, sweepDepth: 0.15 },
      },

      palette: {
        continuous: { voice: 'epiano', octave: 0, decay: 2.8 },
        peak: { voice: 'upright', octave: -1, decay: 1.8 },
        harmonic: { voice: 'epiano', octave: 1, decay: 2.2 },
        touch: { voice: 'bell', octave: 1, decay: 3.5 },
        texture: null,
        burst: null,
      },

      response: {
        peakThreshold: 0.30,
        tiltRange: 45,
        noteInterval: 600,
        melodicEnergy: 0.15,
        stillnessThreshold: 0.06,
        stillnessTimeout: 3.0,
        fadeTime: 8.0,
        filterRange: [200, 2200],
        densityThresholds: [1.5, 4.0, 8.0],
      },

      emotion: { colorDeg: 6, phraseShape: 'falling' },

      motion: { primary: 'tilt_rate', melodic: 'beta', sensitivity: 0.6 },

      weather: { temperatureInfluence: 0.5, humidityInfluence: 0.6 },

      pipeline: 'organic',
    },

    // ─── 8: CATHEDRAL ────────────────────────────────────────────────
    // Ambient choral. Eyes-closed meditation. Sustained voices, vast space.
    // No rhythm. No melody unless you move. Pure harmonic texture.
    // Aeolian minor — natural, ancient, no sharps.
    {
      name: 'Cathedral',
      description: 'Choral ambient. Voices in vast space. Stillness.',
      color: '#2d3a4a',

      harmony: {
        root: 220,
        mode: 'aeolian',
        gravityStrength: 0.6,
        contourBias: 'question',
      },

      rhythm: {
        bpm: [40, 60],
        steps: 8,
        kit: 'acoustic',
        initialPresence: 0,
        grooveDNA: null,
        swing: 0,
        ghostLevel: 0,
        euclideanRange: [1, 2],
        microTiming: { kick: 0, hat: 0, snare: 0 },
      },

      tone: {
        bassFreq: 80,
        bassGain: 2,
        midFreq: 500,
        midQ: 0.3,
        midGain: 0,
        highFreq: 4000,
        highGain: -6,
        ceiling: 5000,
      },

      space: {
        reverb: { decay: 8.0, damping: 0.10, preDelay: 40 },
        delay: { feedback: 0.60, filter: 2000, sync: 'quarter' },
        saturation: 0.02,
        reverbMix: 0.70,
        sidechain: 0,
        spatial: { sweepRate: 0.03, sweepDepth: 0.35 },
      },

      palette: {
        continuous: { voice: 'formant', octave: 0, decay: 5.0 },
        peak: { voice: 'bell', octave: 1, decay: 4.0 },
        harmonic: { voice: 'organ', octave: -1, decay: 6.0 },
        touch: { voice: 'formant', octave: 1, decay: 4.0 },
        texture: { wave: 'sine', chord: [0, 7, 12], octave: -1, detune: 3, vol: 0.04, reverbSend: 0.85 },
        burst: null,
      },

      response: {
        peakThreshold: 0.45,
        tiltRange: 60,
        noteInterval: 1500,
        melodicEnergy: 0.25,
        stillnessThreshold: 0.04,
        stillnessTimeout: 1.5,
        fadeTime: 15.0,
        filterRange: [200, 4500],
        densityThresholds: [1.0, 3.0, 6.0],
      },

      emotion: { colorDeg: 5, phraseShape: 'question' },

      motion: { primary: 'magnitude', melodic: 'beta', sensitivity: 0.5 },

      weather: { temperatureInfluence: 0.8, humidityInfluence: 0.7 },

      pipeline: 'organic',
    },

    // ─── 9: PULSE ────────────────────────────────────────────────────
    // Minimal techno. 118 BPM. Hypnotic. Repetitive. Slowly evolving.
    // The opposite of Grid's maximalism. Less is more.
    // Minor mode — dark, driving, relentless. Tilt = filter only.
    {
      name: 'Pulse',
      description: 'Minimal techno. Hypnotic. Less is everything.',
      color: '#1a2a1a',

      harmony: {
        root: 196,
        mode: 'aeolian',
        gravityStrength: 0.9,
        contourBias: 'falling',
      },

      rhythm: {
        bpm: 118,
        steps: 16,
        kit: '808',
        initialPresence: 0.6,
        grooveDNA: null,
        swing: 0.05,
        ghostLevel: 0.03,
        euclideanRange: [3, 8],
        microTiming: { kick: 0, hat: 0.005, snare: 0 },
      },

      tone: {
        bassFreq: 140,
        bassGain: 5,
        midFreq: 900,
        midQ: 1.2,
        midGain: 1,
        highFreq: 4000,
        highGain: -8,
        ceiling: 5500,
      },

      space: {
        reverb: { decay: 3.5, damping: 0.35, preDelay: 15 },
        delay: { feedback: 0.55, filter: 1800, sync: 'eighth' },
        saturation: 0.06,
        reverbMix: 0.22,
        sidechain: 0.45,
        spatial: { sweepRate: 0.06, sweepDepth: 0.5 },
      },

      palette: {
        continuous: { voice: 'pluck', octave: 0, decay: 0.6 },
        peak: { voice: 'stab', octave: 0, decay: 0.3 },
        harmonic: { voice: 'fm', octave: -1, decay: 1.5 },
        touch: { voice: 'pluck', octave: 1, decay: 0.4 },
        texture: null,
        burst: { voice: 'glitch', octave: 0 },
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

      emotion: { colorDeg: 2, phraseShape: 'falling' },

      motion: { primary: 'tilt_rate', melodic: 'beta', sensitivity: 1.2 },

      weather: { temperatureInfluence: 0.2, humidityInfluence: 0.1 },

      pipeline: 'grid',

      // EDM config — required by flow.js initGrid()
      edm: {
        bpm: 118,
        filterRange: [180, 5000],
        buildBars: 12,
        dropBars: 16,
        breakdownBars: 8,
      },
    },
  ];


  // ── DEFAULT INDEX ──────────────────────────────────────────────────────
  // Grid (index 5) is the default — strongest first impression.
  var DEFAULT_INDEX = 5;


  // ── STATE ──────────────────────────────────────────────────────────────

  var activeLens = null;
  var activeIndex = 0;
  var pickerBuilt = false;


  // ── INIT ───────────────────────────────────────────────────────────────

  function init() {
    // Load from URL first (shared lens link), then from storage, then default
    var urlLens = loadFromURL();
    if (urlLens) {
      activeLens = urlLens;
      return;
    }
    restoreFromStorage();
  }


  // ── PICKER UI ──────────────────────────────────────────────────────────
  // Touch-friendly cards for iPhone. Each card shows number, name, description.

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

      // Touch — passive, no preventDefault needed for tap
      item.addEventListener('touchstart', (function (idx) {
        return function (e) { e.stopPropagation(); selectCard(idx); };
      })(i), { passive: true });

      // Click fallback for desktop testing
      item.addEventListener('click', (function (idx) {
        return function (e) { e.stopPropagation(); selectCard(idx); };
      })(i));

      container.appendChild(item);
    }

    pickerBuilt = true;

    // Highlight the current selection after building
    highlightCard(activeIndex);
  }


  // ── CARD SELECTION ─────────────────────────────────────────────────────

  function selectCard(index) {
    if (index < 0 || index >= PRESETS.length) return;

    activeIndex = index;
    activeLens = PRESETS[index];

    highlightCard(index);

    var cmdIn = document.getElementById('cmd-input');
    if (cmdIn) {
      cmdIn.value = 'run ' + activeLens.name.toLowerCase();
    }

    saveToStorage();
  }

  function highlightCard(index) {
    var items = document.querySelectorAll('.protocol-item');
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle('selected', i === index);
    }
  }

  function getSelected() {
    return activeLens;
  }


  // ── LIVE LENS SWITCHING ────────────────────────────────────────────────
  // Cycle through lenses while playing. Reconfigures all modules.

  function nextLens() {
    activeIndex = (activeIndex + 1) % PRESETS.length;
    activeLens = PRESETS[activeIndex];
    applyToModules();
    updateIndicator();
    saveToStorage();
    return activeLens;
  }

  function prevLens() {
    activeIndex = (activeIndex - 1 + PRESETS.length) % PRESETS.length;
    activeLens = PRESETS[activeIndex];
    applyToModules();
    updateIndicator();
    saveToStorage();
    return activeLens;
  }

  function applyToModules() {
    // Reconfigure all downstream modules with the new lens.
    // Guard each call — modules may not exist yet during boot.
    if (typeof Sound !== 'undefined' && Sound.configure) {
      Sound.configure(activeLens);
    }
    if (typeof Flow !== 'undefined' && Flow.applyLens) {
      Flow.applyLens(activeLens);
    }
    // v1 compatibility: follow.js used Audio.configure / Follow.applyLens
    if (typeof Audio !== 'undefined' && Audio.configure) {
      Audio.configure(activeLens);
    }
    if (typeof Follow !== 'undefined' && Follow.applyLens) {
      Follow.applyLens(activeLens);
    }
  }

  function updateIndicator() {
    var el = document.getElementById('lens-indicator');
    if (el && activeLens) {
      el.textContent = activeLens.name;
    }
  }


  // ── PERSISTENCE ────────────────────────────────────────────────────────

  function saveToStorage() {
    try {
      localStorage.setItem('m2_lens', JSON.stringify({ index: activeIndex }));
    } catch (e) { /* storage full or private mode */ }
  }

  function restoreFromStorage() {
    var lastIndex = DEFAULT_INDEX;
    try {
      var s = localStorage.getItem('m2_lens');
      if (s) {
        var d = JSON.parse(s);
        if (typeof d.index === 'number') lastIndex = d.index;
      }
    } catch (e) { /* corrupt data */ }

    // Clamp to valid range
    if (lastIndex < 0 || lastIndex >= PRESETS.length) lastIndex = DEFAULT_INDEX;
    selectCard(lastIndex);
  }


  // ── URL SHARING ────────────────────────────────────────────────────────
  // Encode a lens config into a URL parameter for sharing.

  function shareLens(lens) {
    try {
      var encoded = btoa(encodeURIComponent(JSON.stringify(lens)));
      var url = window.location.origin + window.location.pathname + '?lens=' + encoded;
      if (navigator.clipboard) navigator.clipboard.writeText(url);
      return url;
    } catch (e) {
      return null;
    }
  }

  function loadFromURL() {
    try {
      var params = new URLSearchParams(window.location.search);
      var encoded = params.get('lens');
      if (encoded) {
        var lens = JSON.parse(decodeURIComponent(atob(encoded)));
        if (lens && lens.name) {
          activeLens = lens;
          return lens;
        }
      }
    } catch (e) { /* invalid URL data */ }
    return null;
  }


  // ── PUBLIC API ─────────────────────────────────────────────────────────

  return Object.freeze({
    PRESETS: PRESETS,
    STAGES: STAGES,
    init: init,
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
