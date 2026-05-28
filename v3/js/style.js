/**
 * STYLES — The Base Layer
 *
 * Each style is the "prompt" equivalent from Suno research.
 * The environment evolves it. The human plays over it.
 *
 * When Suno/MusicGen stems are available, drop them in:
 *   Band.setStem('kick',   kickAudioBuffer);
 *   Band.setStem('snare',  snareAudioBuffer);
 *   Band.setStem('hats',   hatsAudioBuffer);
 *   Band.setStem('bass',   bassAudioBuffer);
 *   Band.setStem('chords', chordsAudioBuffer);
 * Each stem replaces its synthesis layer; others keep synthesizing.
 *
 * Suno generation prompts for each style are included below.
 */

const Styles = (function () {
  'use strict';

  var defs = {

    lofi: {
      id:    'lofi',
      label: 'LO-FI',
      sub:   'hazy · warm · vinyl',
      color: '#c8a45a',
      bpmRange: [75, 98],
      swing:    0.18,
      kick:  { baseHz: 55, endHz: 20, decay: 0.28, vel: 0.78 },
      snare: { vel: 0.64, toneHz: 170, toneDecay: 0.07, hasClap: false },
      hatVel:   0.40,
      padLP:   2400, padGain: 0.28,
      padFM:   { ratio: 1.5, index: 1.8 },
      melodyFM: { ratio: 2.0, index: 0.6 },   // warm Rhodes-like
      bassStyle: 'bounce',                      // root + 5th, chromatic walk on bar 3
      bassLP:   320,  bassSubGain: 0.72, bassDrive: 0.38,
      reverbSec: 3.4,
      vinyl:    true,
      sparse:   false,
      is808:    false,
      hasTrap:  false,
      modeHint: ['minor', 'dorian'],
      fills: [ [0,2,4,2], [3,2,0,-1], [0,-1,4,2], [2,0,2,-1] ],
      sunoPrompt: 'lo-fi hip hop, jazz chords, vinyl crackle, mellow beats, 88 BPM',
    },

    rnb: {
      id:    'rnb',
      label: 'R&B',
      sub:   'groove · soul · warm bass',
      color: '#c87a9a',
      bpmRange: [82, 108],
      swing:    0.08,
      kick:  { baseHz: 62, endHz: 22, decay: 0.30, vel: 0.88 },
      snare: { vel: 0.78, toneHz: 200, toneDecay: 0.05, hasClap: true },
      hatVel:   0.36,
      padLP:   3200, padGain: 0.22,
      padFM:   { ratio: 2.0, index: 0.9 },
      melodyFM: { ratio: 1.5, index: 1.4 },   // electric piano feel
      bassStyle: 'groove',                      // syncopated 16ths, punchy
      bassLP:   480,  bassSubGain: 0.50, bassDrive: 0.52,
      reverbSec: 2.0,
      vinyl:    false,
      sparse:   false,
      is808:    false,
      hasTrap:  false,
      modeHint: ['minor', 'mixolydian'],
      fills: [ [0,2,4,5], [4,3,2,0], [0,4,2,6], [2,4,6,4] ],
      sunoPrompt: 'R&B soul, smooth groove, warm bass, 96 BPM, modern production',
    },

    jazz: {
      id:    'jazz',
      label: 'JAZZ',
      sub:   'swing · complex · alive',
      color: '#7ac8a0',
      bpmRange: [90, 160],
      swing:    0.30,
      kick:  { baseHz: 58, endHz: 22, decay: 0.20, vel: 0.65 },
      snare: { vel: 0.55, toneHz: 210, toneDecay: 0.06, hasClap: false },
      hatVel:   0.38,
      padLP:   4800, padGain: 0.18,
      padFM:   { ratio: 1.333, index: 2.2 },
      melodyFM: { ratio: 1.333, index: 2.8 }, // reedy, sax-like
      bassStyle: 'walk',                        // walking quarter-note bass
      // Ride cymbal pattern: strong on 1,2,3,4 — "and" of 2 accented (the jazz lift)
      hatVels: [0.72,0.06,0.16,0.06, 0.60,0.06,0.32,0.06, 0.68,0.06,0.16,0.06, 0.56,0.06,0.20,0.06],
      bassLP:   600,  bassSubGain: 0.20, bassDrive: 0.14,
      reverbSec: 1.5,
      vinyl:    false,
      sparse:   false,
      is808:    false,
      hasTrap:  false,
      modeHint: ['dorian', 'mixolydian', 'phrygian'],
      fills: [ [0,2,4,6], [6,4,2,0], [1,3,5,3], [2,4,6,5] ],
      sunoPrompt: 'jazz quartet, brushed drums, upright bass, piano, swing feel',
    },

    ambient: {
      id:    'ambient',
      label: 'AMBIENT',
      sub:   'space · texture · breath',
      color: '#7a9ec8',
      bpmRange: [50, 80],
      swing:    0,
      kick:  { baseHz: 50, endHz: 18, decay: 0.55, vel: 0.35 },
      snare: { vel: 0.0,  toneHz: 180, toneDecay: 0.10, hasClap: false },
      hatVel:   0.10,
      padLP:   2800, padGain: 0.50,
      padFM:   { ratio: 0.5, index: 0.5 },
      melodyFM: { ratio: 1.0, index: 0.2 },   // near-sine, pure
      bassStyle: 'sparse',                      // root only, one note, breathe
      bassLP:   240,  bassSubGain: 0.42, bassDrive: 0.10,
      reverbSec: 5.5,
      vinyl:    false,
      sparse:   true,
      is808:    false,
      hasTrap:  false,
      modeHint: ['lydian', 'major'],
      fills: [ [-1,-1,-1,0], [-1,-1,4,-1], [-1,0,-1,2], [-1,-1,2,-1] ],
      sunoPrompt: 'ambient music, ethereal pads, sparse texture, cinematic, slow',
    },

    trap: {
      id:    'trap',
      label: 'TRAP',
      sub:   '808 · dark · cinematic',
      color: '#c87a7a',
      bpmRange: [65, 90],
      swing:    0,
      kick:  { baseHz: 60, endHz: 16, decay: 0.75, vel: 0.95 },
      snare: { vel: 0.62, toneHz: 185, toneDecay: 0.04, hasClap: true },
      hatVel:   0.28,
      padLP:   2200, padGain: 0.22,
      padFM:   { ratio: 3.0, index: 3.5 },
      melodyFM: { ratio: 2.0, index: 0.3 },   // clean lead synth
      bassStyle: 'hold',                        // 808 hold, occasional slide
      bassLP:   280,  bassSubGain: 0.92, bassDrive: 0.72,
      reverbSec: 2.8,
      vinyl:    false,
      sparse:   false,
      is808:    true,
      hasTrap:  true,
      modeHint: ['minor', 'phrygian'],
      fills: [ [-1,-1,0,-1], [-1,-1,-1,4], [-1,0,-1,-1], [-1,-1,0,2] ],
      sunoPrompt: 'trap music, 808 bass, dark cinematic, hi-hat rolls, moody minor',
    },

  };

  return Object.freeze({
    get:  function (id) { return defs[id] || defs.lofi; },
    all:  function ()   { return Object.values(defs); },
    ids:  function ()   { return Object.keys(defs); },
  });
})();
