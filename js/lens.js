/**
 * LENS — Musical Personalities
 *
 * A lens defines behaviors + scenes, not 50 parameters.
 * Different lenses create fundamentally different musical EXPERIENCES.
 *
 * 6 built-in presets. Picker UI. Sharing via URL.
 */

const Lens = (function () {
  'use strict';

  // ── THE 6 PRESETS ────────────────────────────────────────────────────

  const PRESETS = [

    // ─── 1. THE CONDUCTOR ────────────────────────────────────────────
    // You are conducting a symphony orchestra. Pianissimo → fortissimo.
    // Strings, brass, woodwinds. Motion controls dynamics.
    {
      name: 'The Conductor',
      color: '#ffffff',
      description: 'Conduct a symphony. Strings, brass, woodwinds.',

      harmony: { root: 432, mode: 'major', progression: [0, 5, 7, 0], chordBars: 4 },
      rhythm: { bpm: [60, 66, 76, 88], feel: 'straight' },

      space: {
        reverb: { decay: 5.0, damping: 0.2 },
        delay: { feedback: 0.3, filter: 1400, sync: 'dotted-eighth' },
        saturation: 0.12,
        type: 'cathedral',
        filterRange: [350, 3500],
        reverbMix: 0.55,
      },

      behaviors: {
        drone: {
          voices: [
            { wave: 'sawtooth', chord: [0, 4, 7, 12], octave: 0, detune: 10, voiceCount: 3,
              filter: 1800, vibrato: { rate: 5.2, depth: 0.003 } },
          ],
          breathRate: 0.06,
          vol: 0.3,
        },
        pulse: {
          kit: 'acoustic',
          gain: 0.5,
          unlockAt: 'flowing',
          patterns: {
            flowing:      { timpani: [0.3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] },
            surging:      { timpani: [0.7,0,0,0,0,0,0,0,0.5,0,0,0,0,0,0,0], snare: [0,0,0,0,0.3,0,0,0,0,0,0,0,0.3,0,0,0] },
            transcendent: { timpani: [0.9,0,0,0.2,0,0,0,0,0.7,0,0,0.15,0,0,0.3,0], kick: [0.5,0,0,0,0,0,0,0,0.4,0,0,0,0,0,0,0], snare: [0,0,0,0,0.6,0,0,0.1,0,0,0,0,0.5,0,0,0.1] },
          },
          fills: [
            { type: 'snare-roll', bars: 0.5 },
          ],
        },
        melodist: {
          voice: 'brass',
          motif: [
            0,-1, 2,-1, 4,-1, 5,-1, 7,-1,-1,-1,
            5,-1, 4,-1, 2,-1, 0,-1,-1,-1,-1,-1,
            0,-1, 2,-1, 4,-1, 5,-1, 7,-1, 9,-1,
            11,-1, 12,-1,-1,-1,-1,-1,
            9,-1, 7,-1, 5,-1, 4,-1, 2,-1, 0,-1,
            -1,-1,-1,-1,-1,-1,-1,-1
          ],
          noteDur: 1,
          octave: 0,
          vel: 0.22,
          decay: 2.5,
          restAfterPhrase: 2,
          unlockAt: 'flowing',
        },
        accompanist: {
          voice: 'piano',
          chord: [0, 4, 7, 12],
          density: 0.3,
          vol: 0.12,
          decay: 1.5,
          unlockAt: 'surging',
        },
        responder: {
          voice: 'brass',
          decay: 2.5,
        },
        texturer: {
          crackle: false,
          voidDrone: true,
        },
      },

      dynamics: { floor: 0.3, motionCeiling: 500 },
      stages: { thresholds: [80, 300, 700] },
      context: { morning: { bpm_mod: -5 }, night: { space: 'infinite' } },
    },

    // ─── 2. THE BLUE HOUR ─────────────────────────────────────────────
    // Late-night jazz club. Walking bass, jazz ride, piano comping.
    // Swing, space, the notes between the notes.
    {
      name: 'The Blue Hour',
      color: '#4169e1',
      description: 'Late-night jazz. Walking bass. Ride cymbal. Space.',

      harmony: { root: 432, mode: 'dorian', progression: [0, 5, 7, 3, 10, 5, 7, 0], chordBars: 4 },
      rhythm: { bpm: [62, 68, 75, 82], feel: 'swing' },

      space: {
        reverb: { decay: 4.5, damping: 0.25 },
        delay: { feedback: 0.38, filter: 1000, sync: 'dotted-eighth' },
        saturation: 0.08,
        type: 'cathedral',
        filterRange: [280, 2800],
        reverbMix: 0.5,
      },

      behaviors: {
        drone: {
          voices: [
            { wave: 'triangle', chord: [0, 5, 10, 15], octave: 0, detune: 3, voiceCount: 2, filter: 1200 },
          ],
          breathRate: 0.08,
          vol: 0.04,
        },
        walker: {
          voice: 'upright',
          vol: 0.28,
          style: 'walking',
          unlockAt: 'gentle',
        },
        pulse: {
          kit: 'brushes',
          gain: 0.6,
          unlockAt: 'gentle',
          patterns: {
            gentle:       { ride: [0.4,0,0.25,0,0.4,0,0.25,0,0.4,0,0.25,0,0.4,0,0.25,0] },
            flowing:      { ride: [0.5,0,0.3,0,0.5,0,0.3,0,0.5,0,0.3,0,0.5,0,0.3,0], kick: [0.15,0,0,0,0,0,0,0,0.15,0,0,0,0,0,0,0] },
            surging:      { ride: [0.5,0,0.3,0.12,0.5,0,0.3,0.12,0.5,0,0.3,0.12,0.5,0,0.3,0.12], kick: [0.25,0,0,0,0,0,0.1,0,0.25,0,0,0,0,0,0,0], snare: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.08] },
            transcendent: { ride: [0.6,0,0.35,0.15,0.6,0,0.35,0.15,0.6,0,0.35,0.15,0.6,0,0.35,0.15], kick: [0.3,0,0,0,0,0,0.15,0,0.3,0,0,0,0,0,0,0], snare: [0,0,0,0,0.15,0,0,0,0,0,0,0,0.1,0,0,0] },
          },
          fills: [
            { type: 'ride-roll', bars: 0.5 },
            { type: 'kick-accent', bars: 0.25 },
          ],
        },
        melodist: {
          voice: 'epiano',
          motif: [
            0,-1,-1,-1,-1,-1, 2, 3,-1, 5,-1,-1,-1,-1,-1,-1,
            -1,-1,-1,-1,-1,-1,-1,-1,
            7,-1, 5,-1, 3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
            0, 2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
            -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
            5,-1, 7,-1,-1,-1,-1,-1, 5, 3, 2,-1, 0,-1,-1,-1,
            -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
          ],
          noteDur: 0.5,
          octave: 1,
          vel: 0.22,
          decay: 1.2,
          chordVoicing: true,
          restAfterPhrase: 2,
          unlockAt: 'flowing',
        },
        responder: {
          voice: 'epiano',
          decay: 1.2,
        },
        texturer: {
          crackle: true,
          voidDrone: true,
        },
      },

      dynamics: { floor: 0.4, motionCeiling: 500 },
      stages: { thresholds: [120, 500, 1000] },
      context: { night: { reverb: 0.7 }, rain: { reverb: 0.6 } },
    },

    // ─── 3. GOSPEL SUNDAY ────────────────────────────────────────────
    // Sunday morning gospel. 808 sub, warm organ, choir swells.
    // Call-and-response: organ touch + choir melody. Building praise.
    {
      name: 'Gospel Sunday',
      color: '#d4a574',
      description: 'Sunday gospel. 808 sub, organ, choir. Building praise.',

      harmony: { root: 432, mode: 'pentatonic-major', progression: [0, 5, 7, 0], chordBars: 4 },
      rhythm: { bpm: [78, 84, 90, 96], feel: 'shuffle' },

      space: {
        reverb: { decay: 1.8, damping: 0.45 },
        delay: { feedback: 0.25, filter: 1600, sync: 'quarter' },
        saturation: 0.4,
        sidechain: 0.35,
        type: 'room',
        filterRange: [400, 3200],
        reverbMix: 0.2,
      },

      behaviors: {
        drone: {
          voices: [
            { wave: 'sawtooth', chord: [0, 4, 7, 11], octave: 0, detune: 6, voiceCount: 2, filter: 1600 },
          ],
          breathRate: 0.15,
          vol: 0.18,
        },
        walker: {
          voice: 'sub808',
          vol: 0.35,
          style: 'arpeggio',
          unlockAt: 'always',
        },
        pulse: {
          kit: '808',
          gain: 0.9,
          unlockAt: 'stillness',
          patterns: {
            stillness:    { kick: [0.8,0,0,0,0,0,0,0,0.8,0,0,0,0,0,0,0], hat: [0.3,0,0.15,0,0.3,0,0.15,0,0.3,0,0.15,0,0.3,0,0.15,0] },
            gentle:       { kick: [1,0,0,0,0,0,0.3,0,1,0,0,0,0,0,0,0], snare: [0,0,0,0,0.7,0,0,0,0,0,0,0,0.7,0,0,0], hat: [0.4,0,0.2,0,0.4,0,0.2,0,0.4,0,0.2,0,0.4,0,0.2,0] },
            flowing:      { kick: [1,0,0,0,0,0,0.5,0,1,0,0,0,0,0,0.3,0], snare: [0,0,0,0,1,0,0,0.15,0,0,0,0,1,0,0,0.15], hat: [0.5,0,0.3,0,0.5,0,0.3,0,0.5,0,0.3,0,0.5,0,0.3,0] },
            surging:      { kick: [1,0,0,0.2,0,0,0.5,0,1,0,0,0.2,0,0,0.4,0], snare: [0,0,0,0,1,0,0,0.25,0,0,0,0,1,0,0,0.2], hat: [0.5,0.2,0.3,0.2,0.5,0.2,0.3,0.2,0.5,0.2,0.3,0.2,0.5,0.2,0.3,0.2] },
            transcendent: { kick: [1,0,0,0.2,0,0,0.5,0,1,0,0,0.2,0,0,0.4,0], snare: [0,0,0,0,1,0,0,0.25,0,0,0,0,1,0,0,0.2], hat: [0.5,0.2,0.3,0.2,0.5,0.2,0.3,0.2,0.5,0.2,0.3,0.2,0.5,0.2,0.3,0.2] },
          },
          fills: [
            { type: 'kick-accent', bars: 0.25 },
            { type: 'snare-roll', bars: 0.5 },
          ],
        },
        melodist: {
          voice: 'choir',
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
          noteDur: 0.5,
          octave: 1,
          vel: 0.2,
          decay: 1.5,
          restAfterPhrase: 1,
          unlockAt: 'gentle',
        },
        responder: {
          voice: 'organ',
          decay: 1.5,
        },
        texturer: {
          crackle: true,
          voidDrone: true,
        },
      },

      dynamics: { floor: 0.35, motionCeiling: 400 },
      stages: { thresholds: [60, 250, 500] },
      context: { morning: { bpm_mod: -5 } },
    },

    // ─── 4. TUNDRA ───────────────────────────────────────────────────
    // Frozen landscape. Counterintuitively WARM — like a fire in the snow.
    // NO drums, NO bass. Vast silence. Single notes in infinite space.
    {
      name: 'Tundra',
      color: '#4a7c8f',
      description: 'Frozen warmth. Crisp bells over deep warmth. Infinite.',

      harmony: { root: 432, mode: 'whole-tone', progression: [0, 2, 4, 2], chordBars: 8 },
      rhythm: { bpm: [40, 42, 45, 50], feel: 'rubato' },

      space: {
        reverb: { decay: 6.0, damping: 0.1 },
        delay: { feedback: 0.55, filter: 2200, sync: 'dotted-eighth' },
        saturation: 0.05,
        type: 'infinite',
        filterRange: [350, 3500],
        reverbMix: 0.85,
      },

      behaviors: {
        drone: {
          voices: [
            { wave: 'sine', chord: [0, 7, 12], octave: -1, detune: 12, voiceCount: 3, filter: 600 },
          ],
          breathRate: 0.035,
          vol: 0.45,
        },
        melodist: {
          voice: 'bell',
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
          noteDur: 1,
          octave: 2,
          vel: 0.2,
          decay: 2.5,
          restAfterPhrase: 4,
          unlockAt: 'gentle',
        },
        responder: {
          voice: 'pluck',
          decay: 2.5,
        },
        texturer: {
          crackle: false,
          voidDrone: true,
        },
      },

      dynamics: { floor: 0.6, motionCeiling: 800 },
      stages: { thresholds: [200, 800, 2000] },
      context: { night: { space: 'infinite' }, rain: { reverb: 0.8 } },
    },

    // ─── 5. POCKET DRUMMER ───────────────────────────────────────────
    // DnB polyrhythms. Drums DOMINATE. Metallic FM fragments.
    // Every stage has a DIFFERENT rhythm — not just louder.
    {
      name: 'Pocket Drummer',
      color: '#c45c3e',
      description: 'Polished DnB. Polyrhythms dominate. Broken melodies.',

      harmony: { root: 432, mode: 'blues', progression: [0, 7, 5, 0], chordBars: 4 },
      rhythm: { bpm: [86, 90, 95, 100], feel: 'straight' },

      space: {
        reverb: { decay: 1.0, damping: 0.6 },
        delay: { feedback: 0.35, filter: 1600, sync: 'eighth' },
        saturation: 0.45,
        sidechain: 0.5,
        type: 'intimate',
        filterRange: [250, 3000],
        reverbMix: 0.1,
      },

      behaviors: {
        drone: {
          voices: [
            { wave: 'triangle', chord: [0, 7], octave: -1, detune: 4, voiceCount: 2, filter: 500 },
          ],
          breathRate: 0.18,
          vol: 0.06,
        },
        walker: {
          voice: 'sub808',
          vol: 0.35,
          style: 'arpeggio',
          unlockAt: 'always',
        },
        pulse: {
          kit: '808',
          gain: 2.2,
          unlockAt: 'stillness',
          patterns: {
            stillness:    { kick: [1,0,0,0,0,0,0.6,0,0,0,0.8,0,0,0,0,0], snare: [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0], hat: [0.5,0.15,0.3,0.15,0.5,0.15,0.3,0.15,0.5,0.15,0.3,0.15,0.5,0.15,0.3,0.15] },
            gentle:       { kick: [1,0,0,0,0,0.3,0.6,0,0,0,0.8,0,0,0.2,0,0.3], snare: [0,0,0,0,0,0,0,0.1,1,0,0,0,0,0,0.2,0], hat: [0.6,0.2,0.4,0.2,0.6,0.2,0.4,0.2,0.6,0.2,0.4,0.2,0.6,0.2,0.4,0.2] },
            flowing:      { kick: [1,0,0,0.3,0,0.5,0,0,0.8,0,0,0.3,0,0.5,0,0], snare: [0,0,0,0,0,0,0.15,0,1,0,0,0.1,0,0,0.3,0], hat: [0.7,0.25,0.4,0.25,0.7,0.25,0.4,0.25,0.7,0.25,0.4,0.25,0.7,0.25,0.4,0.25] },
            surging:      { kick: [1,0,0.15,0.3,0,0.5,0,0.15,0.8,0,0.15,0.3,0,0.5,0,0.2], snare: [0,0,0.1,0,0,0,0.2,0,1,0,0.1,0,0,0,0.35,0.1], hat: [0.8,0.3,0.5,0.3,0.8,0.3,0.5,0.3,0.8,0.3,0.5,0.3,0.8,0.3,0.5,0.3] },
            transcendent: { kick: [1,0,0.15,0.3,0,0.5,0,0.15,0.8,0,0.15,0.3,0,0.5,0,0.2], snare: [0,0,0.1,0,0,0,0.2,0,1,0,0.1,0,0,0,0.35,0.1], hat: [0.8,0.3,0.5,0.3,0.8,0.3,0.5,0.3,0.8,0.3,0.5,0.3,0.8,0.3,0.5,0.3] },
          },
          fills: [
            { type: 'snare-roll', bars: 0.5 },
            { type: 'kick-accent', bars: 0.25 },
          ],
        },
        melodist: {
          voice: 'fm',
          synthOpts: { ratio: 5, index: 8 },
          motif: [
            0,-1,-1, 3, -1,-1, 5,-1,
            -1,-1,-1,-1, 7,-1,-1,-1,
            -1,-1, 5, 3, 0,-1,-1,-1,
            -1,-1,-1,-1,-1,-1,-1,-1,
            3,-1, 5,-1, 7,-1, 5,-1,
            3, 0,-1,-1,-1,-1,-1,-1,
            -1,-1,-1,-1, 0,-1,-1, 3,
            -1,-1,-1,-1,-1,-1,-1,-1,
          ],
          noteDur: 0.25,
          octave: 1,
          vel: 0.15,
          decay: 0.5,
          restAfterPhrase: 1,
          unlockAt: 'gentle',
        },
        responder: {
          voice: 'fm',
          decay: 0.5,
        },
        texturer: {
          crackle: true,
          voidDrone: true,
        },
      },

      dynamics: { floor: 0.3, motionCeiling: 400 },
      stages: { thresholds: [40, 150, 400] },
    },

    // ─── 6. DARK MATTER ──────────────────────────────────────────────
    // Massive 808 sub + cascading piano arpeggios + electric atmosphere.
    // In Rainbows scale: beauty and weight, 52% delay = cascading shimmer.
    {
      name: 'Dark Matter',
      color: '#5a3a6f',
      description: 'Massive 808 sub. Cascading arpeggios. Electric energy.',

      harmony: { root: 432, mode: 'mixolydian', progression: [0, 5, 7, 0], chordBars: 4 },
      rhythm: { bpm: [72, 78, 84, 90], feel: 'straight' },

      space: {
        reverb: { decay: 4.0, damping: 0.3 },
        delay: { feedback: 0.52, filter: 2000, sync: 'dotted-eighth' },
        saturation: 0.4,
        type: 'cathedral',
        filterRange: [400, 3500],
        reverbMix: 0.5,
      },

      behaviors: {
        drone: {
          voices: [
            { wave: 'triangle', chord: [0, 2, 7, 14], octave: 0, detune: 10, voiceCount: 2, filter: 1200 },
          ],
          breathRate: 0.1,
          vol: 0.15,
        },
        walker: {
          voice: 'sub808',
          vol: 0.45,
          style: 'arpeggio',
          unlockAt: 'gentle',
        },
        pulse: {
          kit: 'acoustic',
          gain: 0.5,
          unlockAt: 'flowing',
          patterns: {
            flowing:      { kick: [0.3,0,0,0,0,0,0,0,0.25,0,0,0,0,0,0,0] },
            surging:      { kick: [0.6,0,0,0,0,0,0,0,0.5,0,0,0,0,0,0,0], snare: [0,0,0,0,0.4,0,0,0,0,0,0,0,0.3,0,0,0], hat: [0.2,0,0.12,0,0.2,0,0.12,0,0.2,0,0.12,0,0.2,0,0.12,0] },
            transcendent: { kick: [0.7,0,0,0,0,0,0.3,0,0.6,0,0,0,0,0,0,0], snare: [0,0,0,0,0.5,0,0,0.1,0,0,0,0,0.4,0,0,0.1], hat: [0.25,0.08,0.15,0.08,0.25,0.08,0.15,0.08,0.25,0.08,0.15,0.08,0.25,0.08,0.15,0.08] },
          },
        },
        melodist: {
          voice: 'epiano',
          motif: [
            0, 2, 4, 7,  0, 2, 4, 7,
            9, 7, 4, 2,  9, 7, 4, 2,
            0, 4, 7, 11, 0, 4, 7, 11,
            12, 9, 7, 4, -1,-1,-1,-1,
            2, 4, 7, 9,  2, 4, 7, 9,
            11, 9, 7, 4, 2, 0,-1,-1,
            -1,-1,-1,-1, -1,-1,-1,-1,
          ],
          noteDur: 0.5,
          octave: 0,
          vel: 0.16,
          decay: 1.8,
          restAfterPhrase: 2,
          unlockAt: 'gentle',
        },
        accompanist: {
          voice: 'epiano',
          chord: [0, 2, 7, 14],
          density: 0.5,
          vol: 0.12,
          decay: 1.5,
          unlockAt: 'flowing',
        },
        responder: {
          voice: 'epiano',
          decay: 1.8,
        },
        texturer: {
          crackle: false,
          voidDrone: true,
        },
      },

      dynamics: { floor: 0.35, motionCeiling: 500 },
      stages: { thresholds: [100, 400, 800] },
      context: { night: { space: 'infinite' } },
    },
  ];

  // ── STATE ────────────────────────────────────────────────────────────

  let activeLens = null;
  let activeIndex = 0;
  let pickerBuilt = false;

  // ── PICKER UI ────────────────────────────────────────────────────────

  function buildPicker() {
    if (pickerBuilt) return;
    var container = document.getElementById('lens-scroll');
    if (!container) return;

    for (var i = 0; i < PRESETS.length; i++) {
      var p = PRESETS[i];
      var card = document.createElement('div');
      card.className = 'lens-card';
      card.setAttribute('data-index', i);
      card.style.setProperty('--accent', p.color);

      card.innerHTML =
        '<div class="lens-card-name" style="color:' + p.color + '">' + p.name + '</div>' +
        '<div class="lens-card-desc">' + p.description + '</div>' +
        '<div class="lens-card-accent" style="background:' + p.color + '"></div>';

      card.addEventListener('touchstart', (function (idx) {
        return function (e) { e.stopPropagation(); selectCard(idx); };
      })(i), { passive: true });

      card.addEventListener('click', (function (idx) {
        return function (e) { e.stopPropagation(); selectCard(idx); };
      })(i));

      container.appendChild(card);
    }

    pickerBuilt = true;
    restoreFromStorage();
  }

  function selectCard(index) {
    activeIndex = index;
    activeLens = PRESETS[index];

    var cards = document.querySelectorAll('.lens-card');
    for (var i = 0; i < cards.length; i++) {
      cards[i].classList.toggle('selected', i === index);
    }

    var goBtn = document.getElementById('lens-go');
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
    Audio.configure(activeLens);
    Score.applyLens(activeLens);
    updateIndicator();
    saveToStorage();
    return activeLens;
  }

  function prevLens() {
    activeIndex = (activeIndex - 1 + PRESETS.length) % PRESETS.length;
    activeLens = PRESETS[activeIndex];
    Audio.configure(activeLens);
    Score.applyLens(activeLens);
    updateIndicator();
    saveToStorage();
    return activeLens;
  }

  function updateIndicator() {
    var el = document.getElementById('lens-indicator');
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
      var s = localStorage.getItem('m2_lens');
      if (s) {
        var d = JSON.parse(s);
        if (d.index >= 0 && d.index < PRESETS.length) {
          selectCard(d.index);
          setTimeout(function () {
            var cards = document.querySelectorAll('.lens-card');
            if (cards[d.index]) cards[d.index].scrollIntoView({ behavior: 'smooth', inline: 'center' });
          }, 100);
        }
      }
    } catch (e) {}
  }

  // ── SHARING ──────────────────────────────────────────────────────────

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
