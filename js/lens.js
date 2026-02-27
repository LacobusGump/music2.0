/**
 * LENS — The Platform
 *
 * A lens defines an entire musical universe. The engine interprets
 * movement through it. Change the lens, change everything.
 *
 * 6 built-in presets. Picker UI for Screen 2. Sharing via URL.
 */

const Lens = (function () {
  'use strict';

  // ── THE 6 PRESETS ────────────────────────────────────────────────────

  const PRESETS = [

    // ─── 1. THE CONDUCTOR ────────────────────────────────────────────
    // Massive organ swells, ascending lines that reach. Cathedral space.
    // Musical DNA: sustained organ, ascending melodies, dynamic builds.
    {
      name: 'The Conductor',
      description: 'Massive organ swells. Cathedral space. Reaching.',
      color: '#ffffff',
      voice: {
        timbre: 'warm',
        layers: ['pad', 'atmosphere', 'bass', 'strings', 'shimmer', 'choir'],
        space: 'cathedral',
        delay: 'dotted-eighth',
        saturation: 0.15,
        padWaveform: 'sine',          // organ-like pure tones
        padOctave: -1,
        padDetune: 4,                 // tight, organ-like
        padChord: [0, 7, 12],
        padBreathRate: 0.06,          // very slow breathing — majestic
        bassType: 'sub',
        stringVoicing: [0, 4, 7, 12],
        drumKit: 'acoustic',
        drumGain: 0.7,                // drums supportive, not dominant
        // Notes: organ — sustained, rich harmonics
        noteType: 'organ',
        noteDecay: 2.0,               // sustained organ tones
        delayFeedback: 0.4,
        delayFilterFreq: 2500,
        reverbDecay: 4.5,             // massive cathedral
        reverbDamping: 0.25,
        filterRange: [400, 6000],
        padVol: 0.2, atmosphereVol: 0.12, bassVol: 0.2, stringsVol: 0.25, shimmerVol: 0.2, choirVol: 0.25,
        bassUnlock: 'moving', stringsUnlock: 'rhythmic', shimmerUnlock: 'intense', choirUnlock: 'transcendent',
        reverbMix: 0.55,
        autoplay: 0, chordBars: 4, autoplayOctave: 0,
        // Organ melody — ascending lines that reach, then resolve
        // -1 = rest. Scale degrees in major mode.
        motif: [
          0,-1, 2,-1, 4,-1, 5,-1, 7,-1,-1,-1,      // first ascent: reaching up
          5,-1, 4,-1, 2,-1, 0,-1,-1,-1,-1,-1,        // descent: resolve
          0,-1, 2,-1, 4,-1, 5,-1, 7,-1, 9,-1,        // second ascent: goes higher
          11,-1, 12,-1,-1,-1,-1,-1,                    // reaches the octave
          9,-1, 7,-1, 5,-1, 4,-1, 2,-1, 0,-1,        // long descent home
          -1,-1,-1,-1,-1,-1,-1,-1                      // rest before cycle
        ],
        motifNoteDur: 1,              // quarter notes — majestic pace
        motifOctave: 0,
        motifVel: 0.22,
      },
      harmony: { root: 432, mode: 'major', gravity: 0.8, evolution: 'ascending-fifths', progression: [0, 5, 7, 0] },
      rhythm: {
        bpm: [66, 72, 80, 88], feel: 'straight', density: 'full', groove_threshold: 0.4,
        patterns: {
          EMERGING:     { kick: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], snare: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], hat: [0.15,0,0,0,0.15,0,0,0,0.15,0,0,0,0.15,0,0,0] },
          FLOWING:      { kick: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], snare: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], hat: [0.2,0,0,0,0.2,0,0,0,0.2,0,0,0,0.2,0,0,0] },
          SURGING:      { kick: [1,0,0,0,0,0,0.4,0,0.9,0,0,0,0,0,0,0], snare: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], hat: [0.4,0,0.25,0,0.4,0,0.25,0,0.4,0,0.25,0,0.4,0,0.25,0] },
          TRANSCENDENT: { kick: [1,0,0,0,0,0,0.4,0,0.9,0,0,0,0,0,0.3,0], snare: [0,0,0,0,1,0,0,0.15,0,0,0,0,1,0,0,0.2], hat: [0.4,0.12,0.25,0.12,0.4,0.12,0.25,0.12,0.4,0.12,0.25,0.12,0.4,0.12,0.25,0.12] },
        },
      },
      motion: { still: 'contemplative', gentle: 'breathing', rhythmic: 'groove', vigorous: 'full', void: 'healing' },
      context: { morning: { bpm_mod: -5 }, night: { space: 'infinite' } },
      stages: { thresholds: [100, 400, 800], pace: 'patient' },
    },

    // ─── 2. THE BLUE HOUR ─────────────────────────────────────────────
    // Modal jazz. Walking bass, sparse trumpet phrases, space.
    // Musical DNA: So What voicings, modal melodies, SPACE is the instrument.
    {
      name: 'The Blue Hour',
      description: 'Modal jazz. Walking bass. Space is the instrument.',
      color: '#4169e1',
      voice: {
        timbre: 'warm',
        layers: ['pad', 'atmosphere'],      // NO continuous bass — walking bass IS the bass
        space: 'cathedral',
        delay: 'dotted-eighth',
        saturation: 0.08,
        padWaveform: 'triangle',
        padOctave: 0,
        padDetune: 3,                        // tight voicing
        padChord: [0, 5, 10, 15],            // quartal voicing (stacked 4ths) — So What
        padBreathRate: 0.08,                 // slow, meditative breathing
        drumKit: 'brushes',
        drumGain: 0.4,
        crackle: true,
        // Touch: jazz piano. Autoplay: walking bass.
        noteType: 'piano',
        noteDecay: 1.0,
        delayFeedback: 0.4,
        delayFilterFreq: 1200,               // very dark delay — tape echo
        reverbDecay: 5.0,                    // massive space for the notes to float in
        reverbDamping: 0.2,
        filterRange: [300, 3500],
        atmosphereFreq: 600,                 // warm low ambiance
        atmosphereQ: 0.3,
        // Mix — almost nothing but the walking bass and space
        padVol: 0.03, atmosphereVol: 0.06,
        reverbMix: 0.6,
        autoplay: 0.9, chordBars: 4, autoplayOctave: 0, autoplayStyle: 'walking',
        // Modal trumpet melody — sparse phrases, mostly SILENCE
        // Captures the essence: a few notes outlining the mode, then long breathing space
        motif: [
          0,-1,-1,-1,-1,-1, 2, 3,-1, 5,-1,-1,-1,-1,-1,-1,   // 3-note phrase... silence
          -1,-1,-1,-1,-1,-1,-1,-1,                             // breathe
          7,-1, 5,-1, 3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,     // descending answer
          0, 2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,     // 2-note hook... long rest
          -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,    // extended silence
          5,-1, 7,-1,-1,-1,-1,-1, 5, 3, 2,-1, 0,-1,-1,-1,    // call and response
          -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,    // silence — the space IS the music
        ],
        motifNoteDur: 0.5,                   // eighth notes (rests create the space)
        motifOctave: 1,                      // melody register — above the walking bass
        motifVel: 0.2,
        motifNoteType: 'piano',              // trumpet-like piano voicing
      },
      harmony: { root: 432, mode: 'dorian', gravity: 0.6, evolution: 'ascending-fifths', progression: [0, 5, 7, 3, 10, 5, 7, 0] },
      rhythm: {
        bpm: [62, 68, 75, 82], feel: 'swing', density: 'sparse', groove_threshold: 0.5,
        patterns: {
          SURGING:      { kick: [0.2,0,0,0,0,0,0,0,0.2,0,0,0,0,0,0,0], snare: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], hat: [0.2,0,0.12,0,0.2,0,0.12,0,0.2,0,0.12,0,0.2,0,0.12,0] },
          TRANSCENDENT: { kick: [0.3,0,0,0,0,0,0.15,0,0.3,0,0,0,0,0,0,0], snare: [0,0,0,0,0.15,0,0,0,0,0,0,0,0.1,0,0,0], hat: [0.2,0,0.12,0.08,0.2,0,0.12,0.08,0.2,0,0.12,0.08,0.2,0,0.12,0.08] },
        },
      },
      motion: { still: 'contemplative', gentle: 'breathing', rhythmic: 'groove', vigorous: 'full', void: 'healing' },
      context: { night: { reverb: 0.7 }, rain: { reverb: 0.6 } },
      stages: { thresholds: [150, 600, 1200], pace: 'patient' },
    },

    // ─── 3. GOSPEL SUNDAY ────────────────────────────────────────────
    // Gospel warmth, 808 sub, vinyl crackle, deep sidechain pump.
    {
      name: 'Gospel Sunday',
      description: 'Gospel warmth, 808 sub, vinyl crackle, deep pump.',
      color: '#d4a574',
      voice: {
        timbre: 'warm',
        layers: ['pad', 'bass', 'strings', 'choir'],
        space: 'room',
        delay: 'quarter',
        saturation: 0.6,
        sidechain: 0.5,
        crackle: true,
        padWaveform: 'sawtooth',
        padOctave: 0,
        padDetune: 6,
        padChord: [0, 4, 7, 11],   // major 7th — gospel warmth
        bassType: '808',
        stringVoicing: [0, 4, 7, 12],
        drumKit: '808',
        drumGain: 1.4,
        // Notes: gospel organ — drawbar harmonics, Leslie vibrato
        noteType: 'organ',
        noteDecay: 1.5,
        delayFeedback: 0.25,
        delayFilterFreq: 2500,
        reverbDecay: 1.5,
        reverbDamping: 0.5,
        filterRange: [500, 5000],
        padBreathRate: 0.15,              // gospel breathes with the spirit
        // Mix — 808 sub dominates, choir swells early
        padVol: 0.25, bassVol: 0.5, stringsVol: 0.18, choirVol: 0.35,
        bassUnlock: 'always', stringsUnlock: 'moving', choirUnlock: 'rhythmic',
        reverbMix: 0.2,
        autoplay: 0.45, chordBars: 4, autoplayOctave: 0, autoplayStyle: 'arpeggio',
        // Gospel call-and-response — pentatonic organ phrases
        // Call (ascending) → response (descending) → space → higher call → resolution
        motif: [
          0, 2, 4,-1, 7, 4,-1,-1,           // call: rise up
          4, 2, 0,-1,-1,-1,-1,-1,            // response: come down
          0, 4, 7,-1, 9, 7,-1,-1,            // call: reach higher
          7, 4, 2, 0,-1,-1,-1,-1,            // response: resolve
          -1,-1,-1,-1,-1,-1,-1,-1,           // rest — let the spirit move
          9, 7, 9, 12,-1,-1,-1,-1,           // high call — the peak
          9, 7, 4, 2, 0,-1,-1,-1,            // long descent — release
          -1,-1,-1,-1,-1,-1,-1,-1,           // rest before cycle
        ],
        motifNoteDur: 0.5,
        motifOctave: 1,
        motifVel: 0.18,
        motifNoteType: 'organ',
      },
      harmony: { root: 432, mode: 'pentatonic-major', gravity: 0.9, evolution: 'ascending-fifths', progression: [0, 5, 7, 0] },
      rhythm: {
        bpm: [80, 85, 90, 95], feel: 'shuffle', density: 'full', groove_threshold: 0,
        patterns: {
          EMERGING:     { kick: [0.8,0,0,0,0,0,0,0,0.8,0,0,0,0,0,0,0], snare: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], hat: [0.3,0,0.15,0,0.3,0,0.15,0,0.3,0,0.15,0,0.3,0,0.15,0] },
          FLOWING:      { kick: [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0], snare: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], hat: [0.4,0,0.2,0,0.4,0,0.2,0,0.4,0,0.2,0,0.4,0,0.2,0] },
          SURGING:      { kick: [1,0,0,0,0,0,0.5,0,1,0,0,0,0,0,0.3,0], snare: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], hat: [0.5,0,0.3,0,0.5,0,0.3,0,0.5,0,0.3,0,0.5,0,0.3,0] },
          TRANSCENDENT: { kick: [1,0,0,0.2,0,0,0.5,0,1,0,0,0.2,0,0,0.4,0], snare: [0,0,0,0,1,0,0,0.2,0,0,0,0,1,0,0,0.15], hat: [0.5,0.2,0.3,0.2,0.5,0.2,0.3,0.2,0.5,0.2,0.3,0.2,0.5,0.2,0.3,0.2] },
        },
      },
      motion: { still: 'contemplative', gentle: 'breathing', rhythmic: 'groove', vigorous: 'full', void: 'healing' },
      context: { morning: { bpm_mod: -5 } },
      stages: { thresholds: [80, 300, 600], pace: 'eager' },
    },

    // ─── 4. TUNDRA ───────────────────────────────────────────────────
    // Brian Eno frozen landscape. Glacial. No rhythm. Infinite.
    {
      name: 'Tundra',
      description: 'Frozen landscape. Glacial. No rhythm. Infinite space.',
      color: '#4a7c8f',
      voice: {
        timbre: 'bright',
        layers: ['pad', 'atmosphere', 'shimmer'],
        space: 'infinite',
        delay: 'dotted-eighth',
        saturation: 0.05,
        padWaveform: 'triangle',
        padOctave: 1,            // high register — crystalline
        padDetune: 15,           // very wide — shimmer
        padChord: [0, 4, 8],     // augmented triad — whole-tone flavor
        bassType: 'none',
        drumKit: 'none',
        drumGain: 0,
        // Notes: crystalline bells — inharmonic partials, infinite shimmer
        noteType: 'bell',
        noteDecay: 3.0,          // long ring
        delayFeedback: 0.55,     // long cascading echoes
        delayFilterFreq: 5000,   // bright echoes
        reverbDecay: 8.0,        // enormous space
        reverbDamping: 0.15,     // very bright reverb
        filterRange: [800, 8000],
        atmosphereFreq: 3000,    // icy high noise
        atmosphereQ: 1.5,
        padBreathRate: 0.04,               // glacially slow breathing
        // Mix — all space, everything always on, drowning in reverb
        padVol: 0.5, atmosphereVol: 0.3, shimmerVol: 0.25,
        reverbMix: 0.85,
        autoplay: 0.04, chordBars: 8, autoplayOctave: 1, autoplayStyle: 'sparse',
        // Frozen bell melody — single notes with vast silence between them
        // Each note is a tiny event in an infinite landscape
        motif: [
          0,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,    // one note... endless space
          -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
          4,-1,-1,-1,-1,-1,-1,-1, 2,-1,-1,-1,-1,-1,-1,-1,    // two distant notes
          -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
          8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,    // a single high note
          -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
          6,-1,-1,-1, 4,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,    // two notes closer together
          -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
        ],
        motifNoteDur: 1,                 // quarter notes — but mostly rests
        motifOctave: 1,                  // high register — crystalline
        motifVel: 0.18,
        motifNoteType: 'bell',
      },
      harmony: { root: 432, mode: 'whole-tone', gravity: 0.3, evolution: 'static', progression: [0, 2, 4, 2] },
      rhythm: {
        bpm: [40, 42, 45, 50], feel: 'rubato', density: 'none', groove_threshold: 1.0,
        patterns: {},
      },
      motion: { still: 'expansive', gentle: 'breathing', rhythmic: 'breathing', vigorous: 'breathing', void: 'expansive' },
      context: { night: { space: 'infinite' }, rain: { reverb: 0.8 } },
      stages: { thresholds: [200, 800, 2000], pace: 'glacial' },
    },

    // ─── 5. POCKET DRUMMER ───────────────────────────────────────────
    // J Dilla's ghost. All about the groove.
    {
      name: 'Pocket Drummer',
      description: "All groove. Drums dominate. Lo-fi warmth.",
      color: '#c45c3e',
      voice: {
        timbre: 'dark',
        layers: ['pad', 'bass'],
        space: 'intimate',
        delay: 'eighth',
        saturation: 0.55,
        sidechain: 0.4,
        crackle: true,
        padWaveform: 'sawtooth',
        padOctave: -1,
        padDetune: 3,            // narrow — lo-fi
        padChord: [0, 7],        // just root + fifth — minimal
        bassType: 'growl',
        drumKit: '808',
        drumGain: 1.8,           // LOUD — drums dominate
        // Notes: DnB stabs — resonant filter sweep, punchy, dry
        noteType: 'stab',
        noteDecay: 0.3,          // very short
        delayFeedback: 0.2,      // tight, not washy
        delayFilterFreq: 1800,   // dark
        reverbDecay: 0.8,        // tiny room
        reverbDamping: 0.7,      // very damped
        filterRange: [200, 3500],
        padBreathRate: 0.2,                // faster breathing — lo-fi pump
        // Mix — drums dominate, barely any harmony, bone dry
        padVol: 0.08, bassVol: 0.45,
        bassUnlock: 'always',
        reverbMix: 0.08,
        autoplay: 0.2, chordBars: 4, autoplayOctave: -1, autoplayStyle: 'random',
        // Blues stab riff — short punchy phrases between drum hits
        // The drums are the star; this just adds color
        motif: [
          0,-1, 3,-1, 4, 3, 0,-1,            // blues lick: root, b3, 4, b3, root
          -1,-1,-1,-1,-1,-1,-1,-1,            // drums breathe
          5,-1, 4,-1, 3,-1, 0,-1,             // descending blues
          -1,-1,-1,-1,-1,-1,-1,-1,            // space
          0,-1,-1,-1, 7,-1, 5,-1,             // root... jump to 5th
          3, 0,-1,-1,-1,-1,-1,-1,             // resolve
          -1,-1,-1,-1,-1,-1,-1,-1,            // rest
          -1,-1,-1,-1,-1,-1,-1,-1,            // more rest — let the drums talk
        ],
        motifNoteDur: 0.25,              // 16th notes — tight, punchy
        motifOctave: 0,
        motifVel: 0.12,                  // quiet — supporting the groove
        motifNoteType: 'stab',
      },
      harmony: { root: 432, mode: 'blues', gravity: 0.7, evolution: 'static', progression: [0, 7, 5, 0] },
      rhythm: {
        bpm: [85, 88, 90, 95], feel: 'swing', density: 'full', groove_threshold: 0,
        patterns: {
          // DnB breakbeat: syncopated kick, snare on 3, rolling hats
          EMERGING:     { kick: [1,0,0,0,0,0,0.5,0,0,0,0.7,0,0,0,0,0], snare: [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0.2,0], hat: [0.6,0.2,0.4,0.2,0.6,0.2,0.4,0.2,0.6,0.2,0.4,0.2,0.6,0.2,0.4,0.2] },
          FLOWING:      { kick: [1,0,0,0,0,0,0.6,0,0,0,0.8,0,0,0,0,0.3], snare: [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0.3,0], hat: [0.6,0.25,0.4,0.25,0.6,0.25,0.4,0.25,0.6,0.25,0.4,0.25,0.6,0.25,0.4,0.25] },
          SURGING:      { kick: [1,0,0,0.2,0,0,0.7,0,0,0,0.8,0,0,0.15,0,0.3], snare: [0,0,0,0,0,0,0,0.15,1,0,0,0,0,0,0.3,0], hat: [0.6,0.3,0.4,0.3,0.6,0.3,0.4,0.3,0.6,0.3,0.4,0.3,0.6,0.3,0.4,0.3] },
          TRANSCENDENT: { kick: [1,0,0,0.25,0,0,0.7,0,0.2,0,0.8,0,0,0.15,0,0.4], snare: [0,0,0.1,0,0,0,0,0.2,1,0,0,0.1,0,0,0.35,0], hat: [0.7,0.3,0.5,0.3,0.7,0.3,0.5,0.3,0.7,0.3,0.5,0.3,0.7,0.3,0.5,0.3] },
        },
      },
      motion: { still: 'contemplative', gentle: 'groove', rhythmic: 'groove', vigorous: 'full', void: 'healing' },
      context: {},
      stages: { thresholds: [60, 200, 500], pace: 'eager' },
    },

    // ─── 6. DARK MATTER ──────────────────────────────────────────────
    // Cascading arpeggios, interlocking delays, warm strangeness.
    // Musical DNA: yearning broken chords, delay textures, the ache between major and minor.
    {
      name: 'Dark Matter',
      description: 'Cascading arpeggios. Interlocking delays. Warm strangeness.',
      color: '#5a3a6f',
      voice: {
        timbre: 'warm',
        layers: ['pad', 'atmosphere', 'shimmer', 'strings'],
        space: 'cathedral',
        delay: 'dotted-eighth',
        saturation: 0.2,
        padWaveform: 'triangle',          // softer, warmer
        padOctave: 0,
        padDetune: 8,
        padChord: [0, 2, 7, 14],          // add9 — yearning, open voicing
        padBreathRate: 0.1,
        bassType: 'sub',
        stringVoicing: [0, 4, 7, 11],     // major 7th — beautiful tension
        drumKit: 'acoustic',
        drumGain: 0.5,
        // Notes: piano — warm arpeggios that cascade through heavy delay
        noteType: 'piano',
        noteDecay: 1.8,                   // notes ring into each other
        delayFeedback: 0.52,              // HIGH — cascading echoes are the signature
        delayFilterFreq: 3500,            // bright delay — echoes shimmer
        reverbDecay: 4.0,
        reverbDamping: 0.3,
        filterRange: [500, 6000],
        atmosphereFreq: 1200,
        atmosphereQ: 0.6,
        shimmerRingMod: false,
        padVol: 0.15, atmosphereVol: 0.12, stringsVol: 0.15, shimmerVol: 0.12,
        stringsUnlock: 'moving', shimmerUnlock: 'moving',
        reverbMix: 0.55,
        autoplay: 0, chordBars: 4, autoplayOctave: 0, autoplayStyle: 'arpeggio',
        // Cascading arpeggio — broken chords that interlock through delay
        // Quiet notes fed through high-feedback delay create the layered texture
        motif: [
          0, 2, 4, 7,  0, 2, 4, 7,         // ascending broken chord x2
          9, 7, 4, 2,  9, 7, 4, 2,          // descending answer x2
          0, 4, 7, 11, 0, 4, 7, 11,         // maj7 arpeggio — reaches up
          12, 9, 7, 4, -1,-1,-1,-1,          // descent to rest
          2, 4, 7, 9,  2, 4, 7, 9,          // shifted up — second voice
          11, 9, 7, 4, 2, 0,-1,-1,           // long descent home
          -1,-1,-1,-1, -1,-1,-1,-1,          // breathing space
        ],
        motifNoteDur: 0.5,                // eighth notes — steady cascade
        motifOctave: 0,
        motifVel: 0.15,                   // quiet — delay builds the volume
        motifNoteType: 'piano',
      },
      harmony: { root: 432, mode: 'mixolydian', gravity: 0.5, evolution: 'ascending-fifths', progression: [0, 5, 7, 0] },
      rhythm: {
        bpm: [72, 78, 84, 90], feel: 'straight', density: 'sparse', groove_threshold: 0.4,
        patterns: {
          SURGING:      { kick: [0.6,0,0,0,0,0,0,0,0.5,0,0,0,0,0,0,0], snare: [0,0,0,0,0.4,0,0,0,0,0,0,0,0.3,0,0,0], hat: [0.2,0,0.12,0,0.2,0,0.12,0,0.2,0,0.12,0,0.2,0,0.12,0] },
          TRANSCENDENT: { kick: [0.7,0,0,0,0,0,0.3,0,0.6,0,0,0,0,0,0,0], snare: [0,0,0,0,0.5,0,0,0.1,0,0,0,0,0.4,0,0,0.1], hat: [0.25,0.08,0.15,0.08,0.25,0.08,0.15,0.08,0.25,0.08,0.15,0.08,0.25,0.08,0.15,0.08] },
        },
      },
      motion: { still: 'contemplative', gentle: 'breathing', rhythmic: 'groove', vigorous: 'full', void: 'expansive' },
      context: { night: { space: 'infinite' } },
      stages: { thresholds: [120, 450, 900], pace: 'patient' },
    },
  ];

  // ── STATE ────────────────────────────────────────────────────────────

  let activeLens = null;
  let activeIndex = 0;
  let pickerBuilt = false;

  // ── PICKER UI ────────────────────────────────────────────────────────

  function buildPicker() {
    if (pickerBuilt) return;
    const container = document.getElementById('lens-scroll');
    if (!container) return;

    for (let i = 0; i < PRESETS.length; i++) {
      const p = PRESETS[i];
      const card = document.createElement('div');
      card.className = 'lens-card';
      card.setAttribute('data-index', i);
      card.style.setProperty('--accent', p.color);

      card.innerHTML =
        '<div class="lens-card-name" style="color:' + p.color + '">' + p.name + '</div>' +
        '<div class="lens-card-desc">' + p.description + '</div>' +
        '<div class="lens-card-accent" style="background:' + p.color + '"></div>';

      card.addEventListener('touchstart', function (e) {
        e.stopPropagation();
        selectCard(i);
      }, { passive: true });

      card.addEventListener('click', function (e) {
        e.stopPropagation();
        selectCard(i);
      });

      container.appendChild(card);
    }

    pickerBuilt = true;
    restoreFromStorage();
  }

  function selectCard(index) {
    activeIndex = index;
    activeLens = PRESETS[index];

    const cards = document.querySelectorAll('.lens-card');
    for (let i = 0; i < cards.length; i++) {
      cards[i].classList.toggle('selected', i === index);
    }

    const goBtn = document.getElementById('lens-go');
    if (goBtn) goBtn.classList.add('visible');

    saveToStorage();
  }

  function getSelected() {
    return activeLens;
  }

  // ── LIVE LENS SWITCHING ──────────────────────────────────────────────

  function nextLens() {
    activeIndex = (activeIndex + 1) % PRESETS.length;
    activeLens = PRESETS[activeIndex];
    Voice.applyLens(activeLens);
    updateIndicator();
    saveToStorage();
    return activeLens;
  }

  function prevLens() {
    activeIndex = (activeIndex - 1 + PRESETS.length) % PRESETS.length;
    activeLens = PRESETS[activeIndex];
    Voice.applyLens(activeLens);
    updateIndicator();
    saveToStorage();
    return activeLens;
  }

  function updateIndicator() {
    const el = document.getElementById('lens-indicator');
    if (el && activeLens) {
      el.textContent = activeLens.name;
      el.style.color = activeLens.color;
      el.style.opacity = '1';
      setTimeout(function () { el.style.opacity = '0.2'; }, 2000);
    }
  }

  // ── PERSISTENCE ──────────────────────────────────────────────────────

  function saveToStorage() {
    try { localStorage.setItem('m2_lens', JSON.stringify({ index: activeIndex })); } catch (e) {}
  }

  function restoreFromStorage() {
    try {
      const s = localStorage.getItem('m2_lens');
      if (s) {
        const d = JSON.parse(s);
        if (d.index >= 0 && d.index < PRESETS.length) {
          selectCard(d.index);
          setTimeout(function () {
            const cards = document.querySelectorAll('.lens-card');
            if (cards[d.index]) cards[d.index].scrollIntoView({ behavior: 'smooth', inline: 'center' });
          }, 100);
        }
      }
    } catch (e) {}
  }

  // ── SHARING ──────────────────────────────────────────────────────────

  function shareLens(lens) {
    try {
      const encoded = btoa(encodeURIComponent(JSON.stringify(lens)));
      const url = window.location.origin + window.location.pathname + '?lens=' + encoded;
      if (navigator.clipboard) navigator.clipboard.writeText(url);
      return url;
    } catch (e) { return null; }
  }

  function loadFromURL() {
    try {
      const params = new URLSearchParams(window.location.search);
      const encoded = params.get('lens');
      if (encoded) {
        const lens = JSON.parse(decodeURIComponent(atob(encoded)));
        if (lens && lens.name) { activeLens = lens; return lens; }
      }
    } catch (e) {}
    return null;
  }

  // ── PUBLIC ───────────────────────────────────────────────────────────

  return Object.freeze({
    PRESETS: PRESETS,
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
