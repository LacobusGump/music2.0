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
    // You are conducting a symphony orchestra. Strings, brass, woodwinds.
    // Motion controls dynamics — still = pianissimo, vigorous = fortissimo.
    // Musical DNA: lush string ensemble, timpani swells, orchestral builds.
    {
      name: 'The Conductor',
      description: 'Conduct a symphony. Strings, brass, woodwinds.',
      color: '#ffffff',
      voice: {
        timbre: 'warm',
        layers: ['pad', 'atmosphere', 'bass', 'strings', 'shimmer', 'choir'],
        space: 'cathedral',
        delay: 'dotted-eighth',
        saturation: 0.12,
        // Pad = string ensemble: sawtooth with vibrato for realistic strings
        padWaveform: 'sawtooth',
        padOctave: 0,
        padDetune: 10,                // wide for lush ensemble
        padChord: [0, 4, 7, 12],      // full major chord
        padVoiceCount: 3,             // 3 voices per chord tone = thick section
        padVibratoRate: 5.2,          // orchestral vibrato ~5Hz
        padVibratoDepth: 0.003,       // subtle pitch modulation
        padFilterFreq: 2800,          // warm but present
        padBreathRate: 0.06,          // very slow breathing — majestic swells
        bassType: 'sub',              // orchestral bass — deep foundation
        stringVoicing: [0, 7, 12, 16, 19],  // full orchestral voicing — root, 5th, oct, 3rd, 5th
        drumKit: 'acoustic',
        drumGain: 0.5,                // percussion supportive
        // Notes: organ — sustained, rich (brass-like sustain)
        noteType: 'organ',
        noteDecay: 2.5,               // long sustain — orchestral phrasing
        delayFeedback: 0.3,
        delayFilterFreq: 2000,
        reverbDecay: 5.0,             // massive concert hall
        reverbDamping: 0.2,           // bright reverb — orchestral sparkle
        filterRange: [400, 6000],
        dynamicFloor: 0.35,           // pianissimo when still — conductor controls dynamics
        // Mix — strings dominate, everything builds with motion
        padVol: 0.3, atmosphereVol: 0.1, bassVol: 0.2, stringsVol: 0.3, shimmerVol: 0.2, choirVol: 0.3,
        bassUnlock: 'moving', stringsUnlock: 'moving', shimmerUnlock: 'rhythmic', choirUnlock: 'intense',
        reverbMix: 0.55,
        autoplay: 0, chordBars: 4, autoplayOctave: 0,
        // Ascending orchestral melody — strings reaching upward
        motif: [
          0,-1, 2,-1, 4,-1, 5,-1, 7,-1,-1,-1,
          5,-1, 4,-1, 2,-1, 0,-1,-1,-1,-1,-1,
          0,-1, 2,-1, 4,-1, 5,-1, 7,-1, 9,-1,
          11,-1, 12,-1,-1,-1,-1,-1,
          9,-1, 7,-1, 5,-1, 4,-1, 2,-1, 0,-1,
          -1,-1,-1,-1,-1,-1,-1,-1
        ],
        motifNoteDur: 1,              // quarter notes — majestic pace
        motifOctave: 0,
        motifVel: 0.22,
        motifNoteType: 'organ',
      },
      harmony: { root: 432, mode: 'major', gravity: 0.8, evolution: 'ascending-fifths', progression: [0, 5, 7, 0] },
      rhythm: {
        bpm: [60, 66, 76, 88], feel: 'straight', density: 'full', groove_threshold: 0.3,
        patterns: {
          // Orchestral percussion: timpani swells, no hats — concert hall, not a drum kit
          EMERGING:     { timpani: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] },
          FLOWING:      { timpani: [0.3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] },
          SURGING:      { timpani: [0.7,0,0,0,0,0,0,0,0.5,0,0,0,0,0,0,0], kick: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], snare: [0,0,0,0,0.3,0,0,0,0,0,0,0,0.3,0,0,0] },
          TRANSCENDENT: { timpani: [0.9,0,0,0.2,0,0,0,0,0.7,0,0,0.15,0,0,0.3,0], kick: [0.5,0,0,0,0,0,0,0,0.4,0,0,0,0,0,0,0], snare: [0,0,0,0,0.6,0,0,0.1,0,0,0,0,0.5,0,0,0.1] },
        },
      },
      motion: { still: 'contemplative', gentle: 'breathing', rhythmic: 'groove', vigorous: 'full', void: 'healing' },
      context: { morning: { bpm_mod: -5 }, night: { space: 'infinite' } },
      stages: { thresholds: [80, 300, 700], pace: 'patient' },
    },

    // ─── 2. THE BLUE HOUR ─────────────────────────────────────────────
    // Late-night jazz club. Walking bass, jazz ride, piano comping.
    // Musical DNA: Kind of Blue — space, swing, the notes between the notes.
    {
      name: 'The Blue Hour',
      description: 'Late-night jazz. Walking bass. Ride cymbal. Space.',
      color: '#4169e1',
      voice: {
        timbre: 'warm',
        layers: ['pad', 'atmosphere'],      // NO continuous bass — walking bass IS the bass
        space: 'cathedral',
        delay: 'dotted-eighth',
        saturation: 0.08,
        // Pad: warm electric piano-esque, very quiet — just harmonic bed
        padWaveform: 'triangle',
        padOctave: 0,
        padDetune: 3,
        padChord: [0, 5, 10, 15],            // quartal voicing — So What
        padVoiceCount: 2,
        padFilterFreq: 1200,                 // dark, smoky
        padBreathRate: 0.08,
        drumKit: 'brushes',
        drumGain: 0.6,                       // drums more present — ride is essential
        crackle: true,
        // Touch: jazz piano with chord voicings
        noteType: 'piano',
        noteDecay: 1.2,
        delayFeedback: 0.38,
        delayFilterFreq: 1200,               // dark tape echo
        reverbDecay: 4.5,                    // big room, not infinite
        reverbDamping: 0.25,
        filterRange: [300, 3500],
        atmosphereFreq: 500,                 // warm low haze — smoke in the club
        atmosphereQ: 0.3,
        dynamicFloor: 0.4,             // smoky club — always a presence
        // Mix — walking bass dominates, pad barely there
        padVol: 0.04, atmosphereVol: 0.05,
        reverbMix: 0.5,
        // Walking bass — louder, more present, the heartbeat
        autoplay: 0.95, chordBars: 4, autoplayOctave: 0, autoplayStyle: 'walking',
        // Jazz piano melody with chord voicings (3rd + 7th shell)
        motifChord: true,                    // adds jazz chord voicings to motif notes
        motif: [
          0,-1,-1,-1,-1,-1, 2, 3,-1, 5,-1,-1,-1,-1,-1,-1,
          -1,-1,-1,-1,-1,-1,-1,-1,
          7,-1, 5,-1, 3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
          0, 2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
          -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
          5,-1, 7,-1,-1,-1,-1,-1, 5, 3, 2,-1, 0,-1,-1,-1,
          -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
        ],
        motifNoteDur: 0.5,
        motifOctave: 1,
        motifVel: 0.22,                      // slightly louder — jazz piano should speak
        motifNoteType: 'piano',
      },
      harmony: { root: 432, mode: 'dorian', gravity: 0.6, evolution: 'ascending-fifths', progression: [0, 5, 7, 3, 10, 5, 7, 0] },
      rhythm: {
        bpm: [62, 68, 75, 82], feel: 'swing', density: 'sparse', groove_threshold: 0.3,
        patterns: {
          // Jazz ride pattern: ride on every beat, kicks drop, brushes come in late
          EMERGING:     { ride: [0.4,0,0.25,0,0.4,0,0.25,0,0.4,0,0.25,0,0.4,0,0.25,0] },
          FLOWING:      { ride: [0.5,0,0.3,0,0.5,0,0.3,0,0.5,0,0.3,0,0.5,0,0.3,0], kick: [0.15,0,0,0,0,0,0,0,0.15,0,0,0,0,0,0,0] },
          SURGING:      { ride: [0.5,0,0.3,0.12,0.5,0,0.3,0.12,0.5,0,0.3,0.12,0.5,0,0.3,0.12], kick: [0.25,0,0,0,0,0,0.1,0,0.25,0,0,0,0,0,0,0], snare: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.08] },
          TRANSCENDENT: { ride: [0.6,0,0.35,0.15,0.6,0,0.35,0.15,0.6,0,0.35,0.15,0.6,0,0.35,0.15], kick: [0.3,0,0,0,0,0,0.15,0,0.3,0,0,0,0,0,0,0], snare: [0,0,0,0,0.15,0,0,0,0,0,0,0,0.1,0,0,0] },
        },
      },
      motion: { still: 'contemplative', gentle: 'breathing', rhythmic: 'groove', vigorous: 'full', void: 'healing' },
      context: { night: { reverb: 0.7 }, rain: { reverb: 0.6 } },
      stages: { thresholds: [120, 500, 1000], pace: 'patient' },
    },

    // ─── 3. GOSPEL SUNDAY ────────────────────────────────────────────
    // Sunday morning gospel. 808 sub, warm organ, choir swells, deep pump.
    // Musical DNA: building praise — starts intimate, builds to full congregation.
    {
      name: 'Gospel Sunday',
      description: 'Sunday gospel. 808 sub, organ, choir. Building praise.',
      color: '#d4a574',
      voice: {
        timbre: 'warm',
        layers: ['pad', 'bass', 'strings', 'choir'],
        space: 'room',
        delay: 'quarter',
        saturation: 0.4,              // was 0.6 — less harsh
        sidechain: 0.35,             // was 0.5 — gentler pump
        crackle: true,
        // Pad: warm organ-like bed
        padWaveform: 'sawtooth',
        padOctave: 0,
        padDetune: 6,
        padChord: [0, 4, 7, 11],   // major 7th — gospel warmth
        padVoiceCount: 2,
        padFilterFreq: 2200,
        padBreathRate: 0.15,        // gospel breathes with the spirit
        bassType: '808',
        stringVoicing: [0, 4, 7, 12],
        drumKit: '808',
        drumGain: 0.9,                // was 1.4 — pulled back, let the warmth breathe
        // Notes: gospel organ — drawbar harmonics, Leslie vibrato
        noteType: 'organ',
        noteDecay: 1.5,
        delayFeedback: 0.25,
        delayFilterFreq: 2500,
        reverbDecay: 1.8,
        reverbDamping: 0.45,
        filterRange: [500, 5000],
        dynamicFloor: 0.35,           // quiet when still — intimate prayer
        // Mix — pulled back overall, 808 warm not loud, choir adds not dominates
        padVol: 0.18, bassVol: 0.35, stringsVol: 0.15, choirVol: 0.25,
        bassUnlock: 'always', stringsUnlock: 'moving', choirUnlock: 'moving',
        reverbMix: 0.2,
        autoplay: 0.45, chordBars: 4, autoplayOctave: 0, autoplayStyle: 'arpeggio',
        // Gospel call-and-response — builds through the stages
        motif: [
          0, 2, 4,-1, 7, 4,-1,-1,
          4, 2, 0,-1,-1,-1,-1,-1,
          0, 4, 7,-1, 9, 7,-1,-1,
          7, 4, 2, 0,-1,-1,-1,-1,
          -1,-1,-1,-1,-1,-1,-1,-1,
          9, 7, 9, 12,-1,-1,-1,-1,
          9, 7, 4, 2, 0,-1,-1,-1,
          -1,-1,-1,-1,-1,-1,-1,-1,
        ],
        motifNoteDur: 0.5,
        motifOctave: 1,
        motifVel: 0.2,
        motifNoteType: 'organ',
      },
      harmony: { root: 432, mode: 'pentatonic-major', gravity: 0.9, evolution: 'ascending-fifths', progression: [0, 5, 7, 0] },
      rhythm: {
        bpm: [78, 84, 90, 96], feel: 'shuffle', density: 'full', groove_threshold: 0,
        patterns: {
          // Gospel builds: kick + hat → add clap snare → full praise → transcendent
          EMERGING:     { kick: [0.8,0,0,0,0,0,0,0,0.8,0,0,0,0,0,0,0], hat: [0.3,0,0.15,0,0.3,0,0.15,0,0.3,0,0.15,0,0.3,0,0.15,0] },
          FLOWING:      { kick: [1,0,0,0,0,0,0.3,0,1,0,0,0,0,0,0,0], snare: [0,0,0,0,0.7,0,0,0,0,0,0,0,0.7,0,0,0], hat: [0.4,0,0.2,0,0.4,0,0.2,0,0.4,0,0.2,0,0.4,0,0.2,0] },
          SURGING:      { kick: [1,0,0,0,0,0,0.5,0,1,0,0,0,0,0,0.3,0], snare: [0,0,0,0,1,0,0,0.15,0,0,0,0,1,0,0,0.15], hat: [0.5,0,0.3,0,0.5,0,0.3,0,0.5,0,0.3,0,0.5,0,0.3,0] },
          TRANSCENDENT: { kick: [1,0,0,0.2,0,0,0.5,0,1,0,0,0.2,0,0,0.4,0], snare: [0,0,0,0,1,0,0,0.25,0,0,0,0,1,0,0,0.2], hat: [0.5,0.2,0.3,0.2,0.5,0.2,0.3,0.2,0.5,0.2,0.3,0.2,0.5,0.2,0.3,0.2] },
        },
      },
      motion: { still: 'contemplative', gentle: 'breathing', rhythmic: 'groove', vigorous: 'full', void: 'healing' },
      context: { morning: { bpm_mod: -5 } },
      stages: { thresholds: [60, 250, 500], pace: 'eager' },
    },

    // ─── 4. TUNDRA ───────────────────────────────────────────────────
    // Frozen landscape. Counterintuitively WARM — like a fire in the snow.
    // Crisp bell changes over a warm, deep drone. No rhythm. Infinite.
    {
      name: 'Tundra',
      description: 'Frozen warmth. Crisp bells over deep warmth. Infinite.',
      color: '#4a7c8f',
      voice: {
        timbre: 'warm',             // WARM, not bright — counterintuitive warmth
        layers: ['pad', 'atmosphere', 'shimmer'],
        space: 'infinite',
        delay: 'dotted-eighth',
        saturation: 0.05,
        // Pad: WARM low drone — sine waves, low register, wide and enveloping
        padWaveform: 'sine',        // pure, warm sine — NOT the same sawtooth as others
        padOctave: -1,              // LOW register — warmth from below
        padDetune: 12,              // wide but gentle
        padChord: [0, 7, 12],       // open fifths — vast, simple
        padVoiceCount: 3,           // thick warm bed
        padFilterFreq: 600,         // very dark — deep warmth
        padBreathRate: 0.035,       // glacially slow breathing
        bassType: 'none',
        drumKit: 'none',
        drumGain: 0,
        // Notes: CRISP crystalline bells — contrast against the warm bed
        noteType: 'bell',
        noteDecay: 3.5,             // very long ring — bells echo forever
        delayFeedback: 0.55,        // long cascading echoes
        delayFilterFreq: 4500,      // bright delay — bells shimmer through
        reverbDecay: 6.0,           // enormous space
        reverbDamping: 0.1,         // very bright reverb tail
        filterRange: [400, 6000],
        // Atmosphere: higher frequency, icier — contrast to warm pad
        atmosphereFreq: 4000,       // icy high shimmer
        atmosphereQ: 2.0,           // narrow, crystalline
        dynamicFloor: 0.6,             // always present — you're immersed in the landscape
        // Mix — warm pad dominates, atmosphere adds frost on top
        padVol: 0.45, atmosphereVol: 0.15, shimmerVol: 0.2,
        reverbMix: 0.85,
        autoplay: 0.03, chordBars: 8, autoplayOctave: 2, autoplayStyle: 'sparse',
        // Frozen bell melody — single CRISP notes with vast silence
        motif: [
          0,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
          -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
          4,-1,-1,-1,-1,-1,-1,-1, 2,-1,-1,-1,-1,-1,-1,-1,
          -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
          8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
          -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
          6,-1,-1,-1, 4,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
          -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
        ],
        motifNoteDur: 1,
        motifOctave: 2,             // HIGH register — crystalline bells far above warm bed
        motifVel: 0.2,
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
    // Polished DnB. Drums DOMINATE. Multiple polyrhythms. Broken melodies.
    // Musical DNA: Amen break energy, tight 808s, clean piano melodies that fragment.
    {
      name: 'Pocket Drummer',
      description: 'Polished DnB. Polyrhythms dominate. Broken melodies.',
      color: '#c45c3e',
      voice: {
        timbre: 'dark',
        layers: ['pad', 'bass'],
        space: 'intimate',
        delay: 'eighth',
        saturation: 0.45,
        sidechain: 0.5,
        crackle: true,
        // Pad: minimal — just a dark bed for the drums to sit on
        padWaveform: 'triangle',      // clean, not harsh
        padOctave: -1,
        padDetune: 4,
        padChord: [0, 7],             // root + fifth only — minimal
        padVoiceCount: 2,
        padFilterFreq: 500,           // very dark — stays out of drum frequencies
        padBreathRate: 0.18,          // lo-fi pump
        bassType: '808',              // clean 808 sub, not growl
        drumKit: '808',
        drumGain: 2.2,                // VERY LOUD — drums are everything
        // Notes: PIANO — clean, polished, NOT stab/glitch
        noteType: 'piano',
        noteDecay: 0.6,               // medium — broken melodies linger slightly
        delayFeedback: 0.3,           // moderate — echoes add complexity
        delayFilterFreq: 2500,        // cleaner delay than before
        reverbDecay: 1.0,             // tight room
        reverbDamping: 0.6,
        filterRange: [300, 4000],
        dynamicFloor: 0.3,             // quiet when still, then HITS
        // Mix — almost ALL drums, bass and pad just support
        padVol: 0.06, bassVol: 0.35,
        bassUnlock: 'always',
        reverbMix: 0.1,
        autoplay: 0, chordBars: 4, autoplayOctave: 0,
        // Broken piano melody — fragments that the user shapes
        // Syncopated, unexpected, leaves space for the drums
        motif: [
          0,-1,-1, 3, -1,-1, 5,-1,           // fragmented: root... b3... 5...
          -1,-1,-1,-1, 7,-1,-1,-1,            // space... then high
          -1,-1, 5, 3, 0,-1,-1,-1,            // quick fall
          -1,-1,-1,-1,-1,-1,-1,-1,            // let drums talk
          3,-1, 5,-1, 7,-1, 5,-1,             // ascending answer
          3, 0,-1,-1,-1,-1,-1,-1,             // resolve
          -1,-1,-1,-1, 0,-1,-1, 3,            // syncopated restart
          -1,-1,-1,-1,-1,-1,-1,-1,            // breathe
        ],
        motifNoteDur: 0.25,              // 16th notes — tight, rhythmic
        motifOctave: 1,                  // mid register — clean piano
        motifVel: 0.15,                  // supporting, not competing
        motifNoteType: 'piano',          // CLEAN piano, not stab
      },
      harmony: { root: 432, mode: 'blues', gravity: 0.7, evolution: 'static', progression: [0, 7, 5, 0] },
      rhythm: {
        bpm: [86, 90, 95, 100], feel: 'straight', density: 'full', groove_threshold: 0,
        patterns: {
          // Polyrhythmic DnB: syncopated kicks, ghost snares, dense hats
          // Every stage has a DIFFERENT rhythm — not just louder
          EMERGING:     { kick: [1,0,0,0,0,0,0.6,0,0,0,0.8,0,0,0,0,0],
                          snare: [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
                          hat: [0.5,0.15,0.3,0.15,0.5,0.15,0.3,0.15,0.5,0.15,0.3,0.15,0.5,0.15,0.3,0.15] },
          // Add ghost notes, cross-rhythm kicks
          FLOWING:      { kick: [1,0,0,0,0,0.3,0.6,0,0,0,0.8,0,0,0.2,0,0.3],
                          snare: [0,0,0,0,0,0,0,0.1,1,0,0,0,0,0,0.2,0],
                          hat: [0.6,0.2,0.4,0.2,0.6,0.2,0.4,0.2,0.6,0.2,0.4,0.2,0.6,0.2,0.4,0.2] },
          // Polyrhythmic: kick plays 3-over-4, snare adds fills
          SURGING:      { kick: [1,0,0,0.3,0,0.5,0,0,0.8,0,0,0.3,0,0.5,0,0],
                          snare: [0,0,0,0,0,0,0.15,0,1,0,0,0.1,0,0,0.3,0],
                          hat: [0.7,0.25,0.4,0.25,0.7,0.25,0.4,0.25,0.7,0.25,0.4,0.25,0.7,0.25,0.4,0.25] },
          // Maximum complexity: layered polyrhythms, fills everywhere
          TRANSCENDENT: { kick: [1,0,0.15,0.3,0,0.5,0,0.15,0.8,0,0.15,0.3,0,0.5,0,0.2],
                          snare: [0,0,0.1,0,0,0,0.2,0,1,0,0.1,0,0,0,0.35,0.1],
                          hat: [0.8,0.3,0.5,0.3,0.8,0.3,0.5,0.3,0.8,0.3,0.5,0.3,0.8,0.3,0.5,0.3] },
        },
      },
      motion: { still: 'contemplative', gentle: 'groove', rhythmic: 'groove', vigorous: 'full', void: 'healing' },
      context: {},
      stages: { thresholds: [40, 150, 400], pace: 'eager' },
    },

    // ─── 6. DARK MATTER ──────────────────────────────────────────────
    // Massive 808 sub + cascading piano arpeggios + electric atmosphere.
    // Musical DNA: In Rainbows scale — beauty and weight, delay textures, electric energy.
    {
      name: 'Dark Matter',
      description: 'Massive 808 sub. Cascading arpeggios. Electric energy.',
      color: '#5a3a6f',
      voice: {
        timbre: 'warm',
        layers: ['pad', 'atmosphere', 'bass', 'shimmer', 'strings'],
        space: 'cathedral',
        delay: 'dotted-eighth',
        saturation: 0.4,               // higher saturation — electric, driven
        padWaveform: 'triangle',
        padOctave: 0,
        padDetune: 10,
        padChord: [0, 2, 7, 14],       // add9 — yearning, open voicing
        padVoiceCount: 2,
        padBreathRate: 0.1,
        // MASSIVE 808 bass — the weight of dark matter
        bassType: '808',
        bassUnlock: 'moving',           // kicks in with any motion
        stringVoicing: [0, 4, 7, 11],
        drumKit: 'acoustic',
        drumGain: 0.5,
        // Notes: piano — warm arpeggios through heavy delay
        noteType: 'piano',
        noteDecay: 1.8,
        delayFeedback: 0.52,            // HIGH — cascading echoes
        delayFilterFreq: 3500,          // bright shimmering delay
        reverbDecay: 4.0,
        reverbDamping: 0.3,
        filterRange: [500, 6000],
        // Atmosphere: higher, more intense — electric energy
        atmosphereFreq: 1800,           // brighter, more present
        atmosphereQ: 1.2,               // narrower = more focused, electric
        shimmerRingMod: false,
        dynamicFloor: 0.35,            // builds from nothing to massive
        // Mix — 808 bass is massive, pad supports, atmosphere adds electricity
        padVol: 0.15, atmosphereVol: 0.15, bassVol: 0.45, stringsVol: 0.15, shimmerVol: 0.12,
        stringsUnlock: 'rhythmic', shimmerUnlock: 'moving',
        reverbMix: 0.5,
        autoplay: 0, chordBars: 4, autoplayOctave: 0, autoplayStyle: 'arpeggio',
        // Cascading arpeggio — same beautiful pattern
        motif: [
          0, 2, 4, 7,  0, 2, 4, 7,
          9, 7, 4, 2,  9, 7, 4, 2,
          0, 4, 7, 11, 0, 4, 7, 11,
          12, 9, 7, 4, -1,-1,-1,-1,
          2, 4, 7, 9,  2, 4, 7, 9,
          11, 9, 7, 4, 2, 0,-1,-1,
          -1,-1,-1,-1, -1,-1,-1,-1,
        ],
        motifNoteDur: 0.5,
        motifOctave: 0,
        motifVel: 0.16,
        motifNoteType: 'piano',
      },
      harmony: { root: 432, mode: 'mixolydian', gravity: 0.5, evolution: 'ascending-fifths', progression: [0, 5, 7, 0] },
      rhythm: {
        bpm: [72, 78, 84, 90], feel: 'straight', density: 'sparse', groove_threshold: 0.3,
        patterns: {
          FLOWING:      { kick: [0.3,0,0,0,0,0,0,0,0.25,0,0,0,0,0,0,0] },
          SURGING:      { kick: [0.6,0,0,0,0,0,0,0,0.5,0,0,0,0,0,0,0], snare: [0,0,0,0,0.4,0,0,0,0,0,0,0,0.3,0,0,0], hat: [0.2,0,0.12,0,0.2,0,0.12,0,0.2,0,0.12,0,0.2,0,0.12,0] },
          TRANSCENDENT: { kick: [0.7,0,0,0,0,0,0.3,0,0.6,0,0,0,0,0,0,0], snare: [0,0,0,0,0.5,0,0,0.1,0,0,0,0,0.4,0,0,0.1], hat: [0.25,0.08,0.15,0.08,0.25,0.08,0.15,0.08,0.25,0.08,0.15,0.08,0.25,0.08,0.15,0.08] },
        },
      },
      motion: { still: 'contemplative', gentle: 'breathing', rhythmic: 'groove', vigorous: 'full', void: 'expansive' },
      context: { night: { space: 'infinite' } },
      stages: { thresholds: [100, 400, 800], pace: 'patient' },
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
