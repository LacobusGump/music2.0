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
      },
      harmony: { root: 432, mode: 'major', gravity: 0.8, evolution: 'ascending-fifths' },
      rhythm: { bpm: [72, 80, 90, 100], feel: 'straight', density: 'full', groove_threshold: 0.3 },
      motion: { still: 'contemplative', gentle: 'breathing', rhythmic: 'groove', vigorous: 'full', void: 'healing' },
      context: {
        morning: { density: 0.3, bpm_mod: -5 },
        night: { space: 'infinite', density: 0.2 },
      },
      stages: { thresholds: [100, 400, 800], pace: 'patient' },
    },
    {
      name: 'Charlie Parker in Paris',
      description: 'Bebop vocabulary, Debussy space. Sparse and wide.',
      color: '#b8860b',
      voice: {
        timbre: 'warm',
        layers: ['pad', 'bass', 'strings'],
        space: 'cathedral',
        delay: 'dotted-eighth',
        saturation: 0.15,
      },
      harmony: { root: 432, mode: 'dorian', gravity: 0.6, evolution: 'ascending-fifths' },
      rhythm: { bpm: [65, 72, 78, 85], feel: 'swing', density: 'sparse', groove_threshold: 0.4 },
      motion: { still: 'contemplative', gentle: 'breathing', rhythmic: 'groove', vigorous: 'full', void: 'healing' },
      context: {
        night: { space: 'infinite', reverb: 0.6 },
        rain: { reverb: 0.5, timbre: 'dark' },
      },
      stages: { thresholds: [120, 500, 1000], pace: 'patient' },
    },
    {
      name: "Kanye's Sunday Service",
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
      },
      harmony: { root: 432, mode: 'pentatonic-major', gravity: 0.9, evolution: 'ascending-fifths' },
      rhythm: { bpm: [80, 85, 90, 95], feel: 'shuffle', density: 'full', groove_threshold: 0.2 },
      motion: { still: 'contemplative', gentle: 'breathing', rhythmic: 'groove', vigorous: 'full', void: 'healing' },
      context: {
        morning: { bpm_mod: -5 },
      },
      stages: { thresholds: [80, 300, 600], pace: 'eager' },
    },
    {
      name: 'Tundra',
      description: 'Brian Eno frozen landscape. Glacial. No rhythm. Infinite.',
      color: '#4a7c8f',
      voice: {
        timbre: 'bright',
        layers: ['pad', 'atmosphere', 'shimmer'],
        space: 'infinite',
        delay: 'dotted-eighth',
        saturation: 0.05,
      },
      harmony: { root: 432, mode: 'whole-tone', gravity: 0.3, evolution: 'static' },
      rhythm: { bpm: [40, 42, 45, 50], feel: 'rubato', density: 'none', groove_threshold: 1.0 },
      motion: { still: 'expansive', gentle: 'breathing', rhythmic: 'breathing', vigorous: 'breathing', void: 'expansive' },
      context: {
        night: { space: 'infinite', density: 0.1 },
        rain: { reverb: 0.8 },
      },
      stages: { thresholds: [200, 800, 2000], pace: 'glacial' },
    },
    {
      name: 'Pocket Drummer',
      description: "J Dilla's ghost in the machine. All groove.",
      color: '#c45c3e',
      voice: {
        timbre: 'dark',
        layers: ['pad', 'bass'],
        space: 'intimate',
        delay: 'eighth',
        saturation: 0.5,
        sidechain: 0.4,
        crackle: true,
      },
      harmony: { root: 432, mode: 'blues', gravity: 0.7, evolution: 'static' },
      rhythm: { bpm: [85, 88, 90, 95], feel: 'swing', density: 'full', groove_threshold: 0.1 },
      motion: { still: 'contemplative', gentle: 'groove', rhythmic: 'groove', vigorous: 'full', void: 'healing' },
      context: {},
      stages: { thresholds: [60, 200, 500], pace: 'eager' },
    },
    {
      name: 'Dark Matter',
      description: 'Radiohead Kid A. Chromatic tension, alien textures.',
      color: '#5a3a6f',
      voice: {
        timbre: 'bright',
        layers: ['pad', 'atmosphere', 'shimmer', 'strings'],
        space: 'room',
        delay: 'dotted-eighth',
        saturation: 0.4,
      },
      harmony: { root: 432, mode: 'chromatic', gravity: 0.2, evolution: 'ascending-fifths' },
      rhythm: { bpm: [60, 75, 90, 110], feel: 'straight', density: 'sparse', groove_threshold: 0.5 },
      motion: { still: 'anxious', gentle: 'breathing', rhythmic: 'groove', vigorous: 'full', void: 'anxious' },
      context: {
        night: { space: 'infinite' },
      },
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

    // Restore last used
    restoreFromStorage();
  }

  function selectCard(index) {
    activeIndex = index;
    activeLens = PRESETS[index];

    // Highlight selected
    const cards = document.querySelectorAll('.lens-card');
    for (let i = 0; i < cards.length; i++) {
      cards[i].classList.toggle('selected', i === index);
    }

    // Show play button
    const goBtn = document.getElementById('lens-go');
    if (goBtn) goBtn.classList.add('visible');

    saveToStorage();
  }

  function getSelected() {
    return activeLens;
  }

  // ── LIVE LENS SWITCHING (swipe in play screen) ───────────────────────

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
    try {
      localStorage.setItem('m2_lens', JSON.stringify({ index: activeIndex }));
    } catch (e) { /* ok */ }
  }

  function restoreFromStorage() {
    try {
      const s = localStorage.getItem('m2_lens');
      if (s) {
        const d = JSON.parse(s);
        if (d.index >= 0 && d.index < PRESETS.length) {
          selectCard(d.index);
          // Scroll to selected card
          setTimeout(function () {
            const cards = document.querySelectorAll('.lens-card');
            if (cards[d.index]) {
              cards[d.index].scrollIntoView({ behavior: 'smooth', inline: 'center' });
            }
          }, 100);
        }
      }
    } catch (e) { /* ok */ }
  }

  // ── SHARING (URL encode/decode) ──────────────────────────────────────

  function shareLens(lens) {
    try {
      const json = JSON.stringify(lens);
      const encoded = btoa(encodeURIComponent(json));
      const url = window.location.origin + window.location.pathname + '?lens=' + encoded;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url);
      }
      return url;
    } catch (e) {
      return null;
    }
  }

  function loadFromURL() {
    try {
      const params = new URLSearchParams(window.location.search);
      const encoded = params.get('lens');
      if (encoded) {
        const json = decodeURIComponent(atob(encoded));
        const lens = JSON.parse(json);
        if (lens && lens.name) {
          activeLens = lens;
          return lens;
        }
      }
    } catch (e) { /* ok */ }
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
