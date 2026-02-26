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
    // Full orchestral evolution. The original vision.
    {
      name: 'The Conductor',
      description: 'Full orchestral evolution. Silence to transcendence.',
      color: '#ffffff',
      voice: {
        timbre: 'warm',
        layers: ['pad', 'atmosphere', 'bass', 'strings', 'shimmer', 'choir'],
        space: 'cathedral',
        delay: 'dotted-eighth',
        saturation: 0.2,
        // Pad: warm detuned saws, mid octave
        padWaveform: 'sawtooth',
        padOctave: -1,        // root / 2
        padDetune: 8,         // cents spread
        padChord: [0, 7, 12], // root, fifth, octave
        // Bass: clean sub
        bassType: 'sub',
        // Strings: full ensemble
        stringVoicing: [0, 4, 7, 12],   // root, 3rd, 5th, octave
        // Drums: acoustic kit, moderate volume
        drumKit: 'acoustic',
        drumGain: 1.0,
        // Touch notes
        noteWave: 'triangle',
        noteDecay: 1.2,
        // Delay
        delayFeedback: 0.35,
        delayFilterFreq: 3000,
        // Reverb
        reverbDecay: 3.0,
        reverbDamping: 0.4,
        // Filter range for tilt expression
        filterRange: [400, 6000],
        // Mix — balanced orchestral build
        padVol: 0.35, atmosphereVol: 0.15, bassVol: 0.3, stringsVol: 0.25, shimmerVol: 0.2, choirVol: 0.2,
        bassUnlock: 'moving', stringsUnlock: 'rhythmic', shimmerUnlock: 'intense', choirUnlock: 'transcendent',
        reverbMix: 0.45,
        autoplay: 0.5, chordBars: 4, autoplayOctave: 0,
      },
      harmony: { root: 432, mode: 'major', gravity: 0.8, evolution: 'ascending-fifths', progression: [0, 5, 7, 0] },
      rhythm: {
        bpm: [72, 80, 90, 100], feel: 'straight', density: 'full', groove_threshold: 0.3,
        patterns: {
          FLOWING:      { kick: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], snare: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], hat: [0.3,0,0,0,0.3,0,0,0,0.3,0,0,0,0.3,0,0,0] },
          SURGING:      { kick: [1,0,0,0,0,0,0.4,0,0.9,0,0,0,0,0,0,0], snare: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], hat: [0.5,0,0.3,0,0.5,0,0.3,0,0.5,0,0.3,0,0.5,0,0.3,0] },
          TRANSCENDENT: { kick: [1,0,0,0,0,0,0.4,0,0.9,0,0,0,0,0,0.3,0], snare: [0,0,0,0,1,0,0,0.15,0,0,0,0,1,0,0,0.2], hat: [0.5,0.15,0.3,0.15,0.5,0.15,0.3,0.15,0.5,0.15,0.3,0.15,0.5,0.15,0.3,0.15] },
        },
      },
      motion: { still: 'contemplative', gentle: 'breathing', rhythmic: 'groove', vigorous: 'full', void: 'healing' },
      context: { morning: { bpm_mod: -5 }, night: { space: 'infinite' } },
      stages: { thresholds: [100, 400, 800], pace: 'patient' },
    },

    // ─── 2. CHARLIE PARKER IN PARIS ──────────────────────────────────
    // Bebop vocabulary, Debussy space. Wide and sparse.
    {
      name: 'Charlie Parker in Paris',
      description: 'Bebop vocabulary, Debussy space. Sparse and wide.',
      color: '#b8860b',
      voice: {
        timbre: 'warm',
        layers: ['pad', 'bass', 'strings'],
        space: 'cathedral',
        delay: 'dotted-eighth',
        saturation: 0.1,
        padWaveform: 'triangle',
        padOctave: 0,          // root register
        padDetune: 5,
        padChord: [0, 3, 10, 14],  // root, minor 3rd, 7th, 9th — jazz voicing
        bassType: 'upright',
        stringVoicing: [0, 3, 7, 10, 14],  // m7(9) voicing
        drumKit: 'brushes',
        drumGain: 0.5,
        noteWave: 'triangle',
        noteDecay: 0.8,
        delayFeedback: 0.4,
        delayFilterFreq: 1500,     // dark tape delay
        reverbDecay: 4.0,
        reverbDamping: 0.3,
        filterRange: [300, 4000],
        // Mix — bass walks from beat one, harmony sparse
        padVol: 0.15, bassVol: 0.4, stringsVol: 0.1,
        bassUnlock: 'always', stringsUnlock: 'transcendent',
        reverbMix: 0.55,
        autoplay: 0.3, chordBars: 2, autoplayOctave: 0,
      },
      harmony: { root: 432, mode: 'dorian', gravity: 0.6, evolution: 'ascending-fifths', progression: [0, 5, 7, 3, 10, 5, 7, 0] },
      rhythm: {
        bpm: [65, 72, 78, 85], feel: 'swing', density: 'sparse', groove_threshold: 0.45,
        patterns: {
          FLOWING:      { kick: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], snare: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], hat: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] },
          SURGING:      { kick: [0.3,0,0,0,0,0,0,0,0.3,0,0,0,0,0,0,0], snare: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], hat: [0.2,0,0.15,0,0.2,0,0.15,0,0.2,0,0.15,0,0.2,0,0.15,0] },
          TRANSCENDENT: { kick: [0.4,0,0,0,0,0,0.2,0,0.4,0,0,0,0,0,0,0], snare: [0,0,0,0,0.2,0,0,0,0,0,0,0,0.15,0,0,0], hat: [0.25,0,0.15,0.1,0.25,0,0.15,0.1,0.25,0,0.15,0.1,0.25,0,0.15,0.1] },
        },
      },
      motion: { still: 'contemplative', gentle: 'breathing', rhythmic: 'groove', vigorous: 'full', void: 'healing' },
      context: { night: { reverb: 0.6 }, rain: { reverb: 0.5 } },
      stages: { thresholds: [120, 500, 1000], pace: 'patient' },
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
        noteWave: 'sine',          // organ-like
        noteDecay: 1.5,
        delayFeedback: 0.25,
        delayFilterFreq: 2500,
        reverbDecay: 1.5,
        reverbDamping: 0.5,
        filterRange: [500, 5000],
        // Mix — 808 sub dominates, choir swells early
        padVol: 0.25, bassVol: 0.5, stringsVol: 0.18, choirVol: 0.35,
        bassUnlock: 'always', stringsUnlock: 'moving', choirUnlock: 'rhythmic',
        reverbMix: 0.2,
        autoplay: 0.45, chordBars: 4, autoplayOctave: 0,
      },
      harmony: { root: 432, mode: 'pentatonic-major', gravity: 0.9, evolution: 'ascending-fifths', progression: [0, 5, 7, 0] },
      rhythm: {
        bpm: [80, 85, 90, 95], feel: 'shuffle', density: 'full', groove_threshold: 0.2,
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
        noteWave: 'sine',        // bell-like
        noteDecay: 3.0,          // long ring
        delayFeedback: 0.55,     // long cascading echoes
        delayFilterFreq: 5000,   // bright echoes
        reverbDecay: 8.0,        // enormous space
        reverbDamping: 0.15,     // very bright reverb
        filterRange: [800, 8000],
        atmosphereFreq: 3000,    // icy high noise
        atmosphereQ: 1.5,
        // Mix — all space, everything always on, drowning in reverb
        padVol: 0.5, atmosphereVol: 0.3, shimmerVol: 0.25,
        reverbMix: 0.85,
        autoplay: 0.15, chordBars: 8, autoplayOctave: 1,
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
        noteWave: 'square',      // muted character
        noteDecay: 0.3,          // very short
        delayFeedback: 0.2,      // tight, not washy
        delayFilterFreq: 1800,   // dark
        reverbDecay: 0.8,        // tiny room
        reverbDamping: 0.7,      // very damped
        filterRange: [200, 3500],
        // Mix — drums dominate, barely any harmony, bone dry
        padVol: 0.08, bassVol: 0.45,
        bassUnlock: 'always',
        reverbMix: 0.08,
        autoplay: 0.2, chordBars: 4, autoplayOctave: -1,
      },
      harmony: { root: 432, mode: 'blues', gravity: 0.7, evolution: 'static', progression: [0, 7, 5, 0] },
      rhythm: {
        bpm: [85, 88, 90, 95], feel: 'swing', density: 'full', groove_threshold: 0.1,
        patterns: {
          EMERGING:     { kick: [1,0,0,0,0,0,0,0,0.9,0,0,0,0,0,0,0], snare: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], hat: [0.4,0,0.2,0,0.4,0,0.2,0,0.4,0,0.2,0,0.4,0,0.2,0] },
          FLOWING:      { kick: [1,0,0,0,0,0,0.6,0,0.9,0,0,0,0,0,0.3,0], snare: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], hat: [0.5,0,0.3,0,0.5,0,0.3,0,0.5,0,0.3,0,0.5,0,0.3,0] },
          SURGING:      { kick: [1,0,0,0.2,0,0,0.6,0,0.9,0,0,0.15,0,0,0.4,0], snare: [0,0,0,0,1,0,0,0.2,0,0,0,0,1,0,0,0.15], hat: [0.5,0.2,0.3,0.15,0.5,0.2,0.3,0.15,0.5,0.2,0.3,0.15,0.5,0.2,0.3,0.15] },
          TRANSCENDENT: { kick: [1,0,0.15,0.2,0,0,0.6,0.1,0.9,0,0.15,0.15,0,0,0.4,0.1], snare: [0,0,0,0,1,0,0.1,0.2,0,0,0,0,1,0,0.1,0.2], hat: [0.6,0.2,0.4,0.2,0.6,0.2,0.4,0.2,0.6,0.2,0.4,0.2,0.6,0.2,0.4,0.2] },
        },
      },
      motion: { still: 'contemplative', gentle: 'groove', rhythmic: 'groove', vigorous: 'full', void: 'healing' },
      context: {},
      stages: { thresholds: [60, 200, 500], pace: 'eager' },
    },

    // ─── 6. DARK MATTER ──────────────────────────────────────────────
    // Radiohead Kid A. Chromatic tension, alien textures.
    {
      name: 'Dark Matter',
      description: 'Chromatic tension. Alien textures. Anxious beauty.',
      color: '#5a3a6f',
      voice: {
        timbre: 'bright',
        layers: ['pad', 'atmosphere', 'shimmer', 'strings'],
        space: 'room',
        delay: 'dotted-eighth',
        saturation: 0.4,
        padWaveform: 'sawtooth',
        padOctave: 0,
        padDetune: 12,
        padChord: [0, 1, 6, 7],  // root, minor2nd, tritone, fifth — dissonance
        bassType: 'sub',
        stringVoicing: [0, 1, 5, 6, 11],  // chromatic cluster + tritone
        drumKit: 'glitch',
        drumGain: 0.7,
        noteWave: 'sawtooth',
        noteDecay: 0.6,
        noteDetune: 25,          // unstable pitch
        delayFeedback: 0.45,
        delayFilterFreq: 2200,
        reverbDecay: 1.8,
        reverbDamping: 0.5,
        filterRange: [300, 7000],
        atmosphereFreq: 400,     // dark rumble
        atmosphereQ: 0.8,
        shimmerRingMod: true,    // metallic texture
        // Mix — atmosphere dominates, dissonance unlocks early
        padVol: 0.25, atmosphereVol: 0.3, stringsVol: 0.18, shimmerVol: 0.18,
        stringsUnlock: 'moving', shimmerUnlock: 'moving',
        reverbMix: 0.35,
        autoplay: 0.3, chordBars: 3, autoplayOctave: 0,
      },
      harmony: { root: 432, mode: 'chromatic', gravity: 0.2, evolution: 'ascending-fifths', progression: [0, 6, 1, 7] },
      rhythm: {
        bpm: [60, 75, 90, 110], feel: 'straight', density: 'sparse', groove_threshold: 0.5,
        patterns: {
          FLOWING:      { kick: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], snare: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], hat: [0.2,0,0,0,0,0,0.15,0,0,0,0.2,0,0,0,0,0.1] },
          SURGING:      { kick: [0.8,0,0,0,0,0,0,0,0,0,0.5,0,0,0,0,0], snare: [0,0,0,0,0.6,0,0,0,0,0,0,0,0,0,0.3,0], hat: [0.3,0,0.15,0,0,0.2,0,0.15,0.3,0,0,0.2,0,0.15,0,0] },
          TRANSCENDENT: { kick: [0.9,0,0,0.3,0,0,0,0.2,0,0,0.6,0,0,0,0,0.2], snare: [0,0,0,0,0.7,0,0,0,0,0.2,0,0,0,0,0.4,0], hat: [0.3,0.1,0.2,0,0.15,0.2,0.1,0.2,0.3,0.1,0.2,0,0.15,0.2,0.1,0.15] },
        },
      },
      motion: { still: 'anxious', gentle: 'breathing', rhythmic: 'groove', vigorous: 'full', void: 'anxious' },
      context: { night: { space: 'infinite' } },
      stages: { thresholds: [80, 350, 700], pace: 'volatile' },
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
