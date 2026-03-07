/**
 * LENS — Timbral Palettes
 *
 * A lens defines WHAT sounds respond to your body.
 * Not WHEN or HOW — that comes from YOU.
 *
 * No patterns. No motifs. No clock. No BPM.
 * Your body provides the rhythm, melody, and structure.
 * The lens provides the sonic palette.
 */

const Lens = (function () {
  'use strict';

  // ── THE 6 PALETTES ────────────────────────────────────────────────────

  const PRESETS = [

    // ─── 1. THE CONDUCTOR ────────────────────────────────────────────
    // A full orchestra locked onto your soul.
    // Strings breathe with your tilt. Brass punches on your peaks.
    // Grand hall reverb. Every gesture summons sound.
    {
      name: 'The Conductor',
      color: '#f0e8d8',
      description: 'An orchestra follows your soul.',

      harmony: { root: 440, mode: 'major' },

      tone: {
        bassFreq: 80, bassGain: 3,
        midFreq: 1200, midQ: 0.7, midGain: 1,
        highFreq: 3500, highGain: -6,
        ceiling: 4500,
      },

      space: {
        reverb: { decay: 7.0, damping: 0.05 },
        delay: { feedback: 0.2, filter: 2000, sync: 'dotted-eighth' },
        saturation: 0.08,
        type: 'cathedral',
        reverbMix: 0.7,
      },

      palette: {
        peak: { voice: 'brass', octave: -1, decay: 1.8 },
        continuous: { voice: 'strings', octave: 0, decay: 2.2 },
        subdivision: { voice: 'hat', kit: 'brushes', divisions: 2, vel: 0.12 },
        harmonic: { voice: 'piano', octave: 0, decay: 1.6 },
        drum: { kit: 'acoustic' },
        burst: { voice: 'bell', octave: 1 },
        texture: { wave: 'sine', chord: [0, 4, 7], octave: -1, detune: 8, vol: 0.07, reverbSend: 0.65 },
        touch: { voice: 'piano', octave: 0, decay: 1.5 },
      },

      response: {
        peakThreshold: 2.2,
        tiltRange: 55,
        noteInterval: 320,
        stillnessThreshold: 0.2,
        stillnessTimeout: 6.0,
        fadeTime: 8.0,
        filterRange: [250, 3500],
        densityThresholds: [0.3, 1.0, 2.5],
      },

      motion: {
        primary: 'tilt_rate',
        melodic: 'gamma',
        sensitivity: 1.2,
      },
    },

    // ─── 2. BLUE HOUR ────────────────────────────────────────────────
    // Kind of Blue. Miles Davis, 1959.
    // Your walk IS the bass line. Your tilt is the Rhodes.
    // Brushed snare. Muted trumpet. Space between every note.
    {
      name: 'Blue Hour',
      color: '#1a3a6f',
      description: "Kind of Blue. Your walk is the bass.",

      harmony: { root: 440, mode: 'dorian' },

      tone: {
        bassFreq: 100, bassGain: 5,
        midFreq: 600, midQ: 0.7, midGain: 0,
        highFreq: 2000, highGain: -14,
        ceiling: 2500,
      },

      space: {
        reverb: { decay: 3.5, damping: 0.4 },
        delay: { feedback: 0.38, filter: 1600, sync: 'dotted-eighth' },
        saturation: 0.12,
        type: 'room',
        reverbMix: 0.35,
      },

      palette: {
        peak: { voice: 'upright', octave: -1, decay: 0.7 },
        continuous: { voice: 'epiano', octave: 0, decay: 1.0 },
        subdivision: { voice: 'hat', kit: 'brushes', divisions: 3, vel: 0.10 },
        harmonic: { voice: 'brass', octave: 0, decay: 1.4 },
        drum: { kit: 'brushes' },
        burst: { voice: 'pluck', octave: 1 },
        texture: { wave: 'triangle', chord: [0, 7, 10], octave: -1, detune: 4, vol: 0.05, reverbSend: 0.4 },
        touch: { voice: 'epiano', octave: 0, decay: 0.9 },
      },

      response: {
        peakThreshold: 0.9,
        tiltRange: 40,
        noteInterval: 240,
        stillnessThreshold: 0.1,
        stillnessTimeout: 4.0,
        fadeTime: 5.5,
        filterRange: [200, 2200],
        densityThresholds: [0.2, 0.7, 1.8],
      },

      motion: {
        primary: 'bounce',
        melodic: 'beta',
        sensitivity: 1.1,
      },
    },

    // ─── 3. GOSPEL SUNDAY ────────────────────────────────────────────
    // The choir answers your body.
    // Raise your arms — the voices rise. Three layered voices in unison.
    // 808 sub foundation. Cathedral space. Building praise.
    {
      name: 'Gospel Sunday',
      color: '#d4921e',
      description: 'Raise your arms. The choir responds.',

      harmony: { root: 440, mode: 'major' },

      tone: {
        bassFreq: 60, bassGain: 8,
        midFreq: 900, midQ: 0.9, midGain: 3,
        highFreq: 3200, highGain: -5,
        ceiling: 4000,
      },

      space: {
        reverb: { decay: 6.5, damping: 0.08 },
        delay: { feedback: 0.18, filter: 1400, sync: 'quarter' },
        saturation: 0.18,
        type: 'cathedral',
        reverbMix: 0.72,
      },

      palette: {
        peak: { voice: 'choir', octave: 0, decay: 2.2 },
        continuous: { voice: 'organ', octave: 0, decay: 0.9 },
        subdivision: { voice: 'hat', kit: '808', divisions: 2, vel: 0.18 },
        harmonic: { voice: 'choir', octave: 1, decay: 1.8 },
        drum: { kit: '808' },
        burst: { voice: 'choir', octave: 1 },
        texture: { wave: 'sine', chord: [0, 4, 7, 12], octave: -1, detune: 3, vol: 0.1, reverbSend: 0.7 },
        touch: { voice: 'organ', octave: 0, decay: 0.9 },
      },

      response: {
        peakThreshold: 1.2,
        tiltRange: 50,
        noteInterval: 120,
        stillnessThreshold: 0.15,
        stillnessTimeout: 5.5,
        fadeTime: 7.0,
        filterRange: [300, 3500],
        densityThresholds: [0.25, 1.0, 2.5],
      },

      motion: {
        primary: 'sustained',
        melodic: 'beta',
        sensitivity: 0.9,
      },
    },

    // ─── 4. TUNDRA ───────────────────────────────────────────────────
    // Fred Again. Radiohead. Tender frost.
    // A single piano note in infinite white space.
    // Strings breathe slowly. Silence is the melody.
    // No drums. No fills. Just breath.
    {
      name: 'Tundra',
      color: '#aaccee',
      description: 'Tender frost. One note. Infinite space.',

      harmony: { root: 432, mode: 'minor' },

      tone: {
        bassFreq: 120, bassGain: 2,
        midFreq: 400, midQ: 0.5, midGain: -2,
        highFreq: 4000, highGain: -12,
        ceiling: 5000,
      },

      space: {
        reverb: { decay: 9.0, damping: 0.03 },
        delay: { feedback: 0.55, filter: 2800, sync: 'dotted-eighth' },
        saturation: 0.01,
        type: 'infinite',
        reverbMix: 0.95,
      },

      palette: {
        peak: { voice: 'piano', octave: 1, decay: 3.5 },
        continuous: { voice: 'strings', octave: 0, decay: 4.0 },
        texture: { wave: 'sine', chord: [0, 7], octave: -2, detune: 10, vol: 0.03, reverbSend: 0.9 },
        touch: { voice: 'piano', octave: 1, decay: 3.0 },
      },

      response: {
        peakThreshold: 0.45,
        tiltRange: 70,
        noteInterval: 1200,
        stillnessThreshold: 0.06,
        stillnessTimeout: 0.4,
        fadeTime: 14.0,
        filterRange: [200, 4500],
        densityThresholds: [0.15, 0.5, 1.2],
      },

      motion: {
        primary: 'magnitude',
        melodic: 'gamma',
        sensitivity: 0.4,
      },
    },

    // ─── 5. STILL WATER ──────────────────────────────────────────────
    // Nils Frahm. Jon Hopkins. Quiet electricity.
    // Piano + pluck + shimmer. Lydian mode — floating, unresolved.
    // Strong delay feedback loops your gesture back to you.
    {
      name: 'Still Water',
      color: '#2a6f6f',
      description: 'Piano and pluck. Your gesture echoes back.',

      harmony: { root: 440, mode: 'lydian' },

      tone: {
        bassFreq: 100, bassGain: 3,
        midFreq: 700, midQ: 0.6, midGain: -1,
        highFreq: 3000, highGain: -8,
        ceiling: 4000,
      },

      space: {
        reverb: { decay: 5.5, damping: 0.15 },
        delay: { feedback: 0.52, filter: 2200, sync: 'dotted-eighth' },
        saturation: 0.05,
        type: 'cathedral',
        reverbMix: 0.6,
      },

      palette: {
        peak: { voice: 'piano', octave: 0, decay: 2.5 },
        continuous: { voice: 'pluck', octave: 1, decay: 1.8 },
        harmonic: { voice: 'bell', octave: 1, decay: 2.2 },
        texture: { wave: 'sine', chord: [0, 4, 7, 11], octave: -1, detune: 6, vol: 0.05, reverbSend: 0.65 },
        touch: { voice: 'piano', octave: 0, decay: 2.0 },
      },

      response: {
        peakThreshold: 0.8,
        tiltRange: 50,
        noteInterval: 500,
        stillnessThreshold: 0.1,
        stillnessTimeout: 2.0,
        fadeTime: 9.0,
        filterRange: [250, 3500],
        densityThresholds: [0.2, 0.7, 1.8],
      },

      motion: {
        primary: 'flow',
        melodic: 'beta',
        sensitivity: 0.7,
      },
    },

    // ─── 6. DARK MATTER ──────────────────────────────────────────────
    // Inverted. Backwards. Through the tunnel.
    // Sound builds in reverse — silence at the start, explosion at the peak.
    // Phrygian darkness. Heavy sidechain pumping. 72% delay feedback loop.
    // The music plays you. Not the other way around.
    {
      name: 'Dark Matter',
      color: '#3d1a5f',
      description: 'Backwards. Inverted. Through the tunnel.',

      harmony: { root: 432, mode: 'phrygian' },

      tone: {
        bassFreq: 55, bassGain: 9,
        midFreq: 500, midQ: 1.2, midGain: -4,
        highFreq: 2000, highGain: -16,
        ceiling: 2500,
      },

      space: {
        reverb: { decay: 5.0, damping: 0.2 },
        delay: { feedback: 0.72, filter: 1800, sync: 'dotted-eighth' },
        saturation: 0.5,
        sidechain: 0.7,
        type: 'cathedral',
        reverbMix: 0.55,
      },

      palette: {
        peak: { voice: 'reverse', octave: 0, decay: 2.5 },
        continuous: { voice: 'fm', octave: 0, decay: 1.5 },
        harmonic: { voice: 'reverse', octave: -1, decay: 3.0 },
        drum: { kit: 'acoustic' },
        burst: { voice: 'glitch', octave: 0 },
        texture: { wave: 'sawtooth', chord: [0, 1, 7], octave: -2, detune: 20, vol: 0.07, reverbSend: 0.65 },
        touch: { voice: 'reverse', octave: 0, decay: 2.0 },
      },

      response: {
        peakThreshold: 1.0,
        tiltRange: 60,
        noteInterval: 200,
        stillnessThreshold: 0.1,
        stillnessTimeout: 2.5,
        fadeTime: 8.0,
        filterRange: [150, 2000],
        densityThresholds: [0.2, 0.8, 2.0],
      },

      motion: {
        primary: 'flow',
        melodic: 'gamma',
        sensitivity: 1.1,
      },
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
