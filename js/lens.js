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
        spatial: { sweepRate: 0.07, sweepDepth: 0.72 }, // grand, wide, slow — orchestra sweeps
      },

      palette: {
        peak: { voice: 'brass', octave: -1, decay: 1.8 },
        continuous: { voice: 'strings', octave: 0, decay: 2.2 },
        subdivision: { voice: 'hat', kit: 'brushes', divisions: 2, vel: 0.12 },
        harmonic: { voice: 'piano', octave: 0, decay: 1.6 },
        burst: { voice: 'bell', octave: 1 },
        texture: { wave: 'sine', chord: [0, 4, 7], octave: -1, detune: 8, vol: 0.07, reverbSend: 0.65 },
        touch: { voice: 'piano', octave: 0, decay: 1.5 },
      },

      // No percussion — the orchestra provides all rhythm through melodic gesture
      groove: null,

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
    // Your walk IS the bass line. Rhodes answers. Vibes shimmer between.
    // Intimate jazz club — dry, warm, and full of space.
    // The conversation happens in the silences.
    {
      name: 'Blue Hour',
      color: '#1a3a6f',
      description: "Kind of Blue. Vibes and bass in conversation.",

      harmony: { root: 440, mode: 'dorian' },

      tone: {
        bassFreq: 100, bassGain: 7,    // strong bass body
        midFreq: 500, midQ: 0.7, midGain: 2,   // warm 500Hz bump = upright resonance
        highFreq: 1800, highGain: -18,   // roll off the top hard — jazz is warm, not bright
        ceiling: 2200,
      },

      space: {
        reverb: { decay: 2.5, damping: 0.5 },   // small intimate room, not a hall
        delay: { feedback: 0.28, filter: 1200, sync: 'dotted-eighth' },
        saturation: 0.07,   // very clean — jazz is clean
        type: 'room',
        reverbMix: 0.22,    // drier — you can hear the wood in the room
        spatial: { sweepRate: 0.06, sweepDepth: 0.32 }, // intimate, narrow — jazz club not a stadium
      },

      palette: {
        // Your steps → walking bass — the spine of jazz
        peak: { voice: 'upright', octave: -1, decay: 0.65 },
        // Your tilt → Rhodes melody — the answer to the bass's question
        continuous: { voice: 'epiano', octave: 0, decay: 1.3 },
        // The lightest possible brushes — whisper of rhythm
        subdivision: { voice: 'hat', kit: 'brushes', divisions: 3, vel: 0.08 },
        // Vibraphone color — the jazz shimmer that no synth sound has
        harmonic: { voice: 'vibe', octave: 0, decay: 2.5 },
        // Pluck = pizzicato grace note
        burst: { voice: 'pluck', octave: 1 },
        // Barely there warmth — Dm7 color
        texture: { wave: 'triangle', chord: [0, 7, 10], octave: -1, detune: 3, vol: 0.04, reverbSend: 0.3 },
        touch: { voice: 'epiano', octave: 0, decay: 1.0 },
      },

      // Dilla pocket — kick lands late, hat floats ahead, ghost snares whisper
      groove: {
        kit: 'brushes',
        microTiming: { kick: 22, hat: 0, snare: 10 },  // ms after beat detection
        ghosts: 0.18,    // 18% chance of a ghost snare on the upbeat
        backbeat: true,  // snare only on 2 and 4
        maxVel: 0.65,
        broken: false,
        dropRate: 0,
      },

      response: {
        peakThreshold: 0.85,
        tiltRange: 38,
        noteInterval: 340,   // jazz conversations breathe — not rapid fire
        stillnessThreshold: 0.08,
        stillnessTimeout: 4.5,   // jazz never rushes to silence
        fadeTime: 6.0,
        filterRange: [200, 2000],
        densityThresholds: [0.15, 0.6, 1.5],
      },

      motion: {
        primary: 'bounce',
        melodic: 'beta',
        sensitivity: 1.0,
      },
    },

    // ─── 3. GOSPEL SUNDAY ────────────────────────────────────────────
    // "Ohhh loooow" — the bass drops and the choir lifts.
    // Vibraphone warmth underneath the voices — classic Black church shimmer.
    // Arms up = voices rise. Hold the gesture = the praise builds.
    {
      name: 'Gospel Sunday',
      color: '#d4921e',
      description: 'Arms up. Bass drops. Choir and vibes lift.',

      harmony: { root: 440, mode: 'major' },

      tone: {
        bassFreq: 55, bassGain: 10,   // deeper sub — the "ohhh loooow" foundation
        midFreq: 1000, midQ: 1.0, midGain: 4,   // presence cut — clarity in the choir
        highFreq: 3500, highGain: -4,
        ceiling: 4500,
      },

      space: {
        reverb: { decay: 7.0, damping: 0.06 },   // massive cathedral — the building amplifies
        delay: { feedback: 0.15, filter: 1600, sync: 'quarter' },
        saturation: 0.22,
        type: 'cathedral',
        reverbMix: 0.75,
        spatial: { sweepRate: 0.09, sweepDepth: 0.68 }, // big church — praise fills the whole room
      },

      palette: {
        // Strong gesture → choir erupts — the moment of praise
        peak: { voice: 'choir', octave: 0, decay: 2.5 },
        // Your tilt → organ follows — the musician responding to you
        continuous: { voice: 'organ', octave: 0, decay: 0.9 },
        // 808 shuffle — Black church drive
        subdivision: { voice: 'hat', kit: '808', divisions: 2, vel: 0.2 },
        // Vibraphone harmonic shimmer — that warm metallic church bell sound
        harmonic: { voice: 'vibe', octave: 0, decay: 3.0 },
        // Shout chorus — choir an octave above
        burst: { voice: 'choir', octave: 1 },
        // Organ drone foundation
        texture: { wave: 'sine', chord: [0, 4, 7, 12], octave: -1, detune: 3, vol: 0.1, reverbSend: 0.78 },
        touch: { voice: 'organ', octave: 0, decay: 0.9 },
      },

      // Strong 4/4 backbeat — the deacon's hand on the 2 and 4
      groove: {
        kit: '808',
        microTiming: { kick: 0, hat: 0, snare: 0 },
        ghosts: 0,
        backbeat: true,
        maxVel: 1.0,
        broken: false,
        dropRate: 0,
      },

      response: {
        peakThreshold: 1.0,
        tiltRange: 55,   // wider — raising arms is a big gesture
        noteInterval: 110,
        stillnessThreshold: 0.12,
        stillnessTimeout: 6.0,   // the spirit sustains long
        fadeTime: 8.0,
        filterRange: [200, 4000],
        densityThresholds: [0.2, 0.9, 2.2],
      },

      motion: {
        primary: 'sustained',
        melodic: 'beta',   // raise arms = raise pitch — the physical prayer
        sensitivity: 0.85,
      },
    },

    // ─── 4. TUNDRA ───────────────────────────────────────────────────
    // Fred Again. Arvo Pärt. The Picardy third grammar.
    // Minor scale with a major 3rd available = "it's hard, but there's hope."
    // One note drops. It rings for 14 seconds. Then silence. Then hope.
    // This is restraint as a musical principle.
    {
      name: 'Tundra',
      color: '#aaccee',
      description: "It's hard. But there's hope. One note at a time.",

      // Picardy mode = natural minor + major 3rd alongside minor 3rd.
      // The scale randomly offers you both. Minor moments of grief.
      // Major moments of light. This is the Picardy grammar.
      harmony: { root: 432, mode: 'picardy' },

      tone: {
        bassFreq: 120, bassGain: 1,   // barely any bass — only the note
        midFreq: 350, midQ: 0.4, midGain: -3,
        highFreq: 5000, highGain: -9,
        ceiling: 7000,   // open ceiling — let the harmonics breathe
      },

      space: {
        reverb: { decay: 6.5, damping: 0.1 },   // spacious but not drowning
        delay: { feedback: 0.4, filter: 3200, sync: 'dotted-eighth' },
        saturation: 0.005,   // pure, uncolored
        type: 'cathedral',
        reverbMix: 0.62,   // was 0.95 — taste over scale
        spatial: { sweepRate: 0.04, sweepDepth: 0.20 }, // frozen, barely moving — minimal sweep
      },

      palette: {
        // Your gesture → single piano note — the drop of water in the cave
        peak: { voice: 'piano', octave: 1, decay: 4.0 },
        // Your tilt → piano melody — same voice as peak, quieter, carries the tune
        continuous: { voice: 'piano', octave: 0, decay: 3.2 },
        // Barely perceptible sine drone — like breath fogging in cold air
        texture: { wave: 'sine', chord: [0, 7], octave: -2, detune: 8, vol: 0.018, reverbSend: 0.88 },
        touch: { voice: 'piano', octave: 1, decay: 3.5 },
      },

      // Silence IS the percussion here — no kit
      groove: null,

      response: {
        peakThreshold: 0.5,
        tiltRange: 70,
        noteInterval: 2000,   // one note every 2 seconds — this IS the tempo
        stillnessThreshold: 0.05,
        stillnessTimeout: 0.3,   // go quiet immediately — silence IS music here
        fadeTime: 14.0,
        filterRange: [200, 6000],
        densityThresholds: [0.1, 0.4, 1.0],
      },

      motion: {
        primary: 'magnitude',
        melodic: 'gamma',
        sensitivity: 0.35,   // breathe on the phone — that's enough
      },
    },

    // ─── 5. STILL WATER ──────────────────────────────────────────────
    // Nils Frahm. Jon Hopkins. The space between electronic and acoustic.
    // Lydian mode = wonder, floating, unresolved optimism (the raised 4th).
    // DISTINCT from Tundra: faster, rhythmic pulse, flows with you.
    // Tundra = frozen solitude. Still Water = motion through calm.
    {
      name: 'Still Water',
      color: '#2a6f6f',
      description: 'Lydian wonder. Your motion flows and echoes.',

      harmony: { root: 440, mode: 'lydian' },

      tone: {
        bassFreq: 90, bassGain: 3,
        midFreq: 700, midQ: 0.6, midGain: -1,
        highFreq: 3200, highGain: -7,
        ceiling: 4500,
      },

      space: {
        reverb: { decay: 4.5, damping: 0.2 },
        delay: { feedback: 0.55, filter: 2400, sync: 'dotted-eighth' },   // longer delay = gesture echoes back
        saturation: 0.04,
        type: 'cathedral',
        reverbMix: 0.5,
        spatial: { sweepRate: 0.10, sweepDepth: 0.48 }, // gentle flow, medium sweep
      },

      palette: {
        peak: { voice: 'piano', octave: 0, decay: 2.5 },
        continuous: { voice: 'strings', octave: 0, decay: 2.8 },
        // Soft rhythmic pulse — this is what separates it from Tundra's silence
        subdivision: { voice: 'hat', kit: 'brushes', divisions: 2, vel: 0.07 },
        harmonic: { voice: 'piano', octave: 1, decay: 2.0 },
        texture: { wave: 'sine', chord: [0, 4, 7, 11], octave: -1, detune: 5, vol: 0.05, reverbSend: 0.62 },
        touch: { voice: 'piano', octave: 0, decay: 2.0 },
      },

      // No percussion — the flow is melodic, not rhythmic
      groove: null,

      response: {
        peakThreshold: 0.75,
        tiltRange: 50,
        noteInterval: 380,   // 5x faster than Tundra — you're moving, not meditating
        stillnessThreshold: 0.1,
        stillnessTimeout: 1.8,   // faster to silence than Tundra too
        fadeTime: 9.0,
        filterRange: [250, 4000],
        densityThresholds: [0.2, 0.6, 1.6],
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
        spatial: { sweepRate: 0.17, sweepDepth: 0.80 }, // unsettling, wide, slightly fast — spatial chaos
      },

      palette: {
        peak: { voice: 'reverse', octave: 0, decay: 2.5 },
        continuous: { voice: 'fm', octave: 0, decay: 1.5 },
        harmonic: { voice: 'strings', octave: -1, decay: 3.5 },
        burst: { voice: 'glitch', octave: 0 },
        texture: { wave: 'sawtooth', chord: [0, 1, 7], octave: -2, detune: 20, vol: 0.07, reverbSend: 0.65 },
        touch: { voice: 'reverse', octave: 0, decay: 2.0 },
      },

      // Broken machine — timing collapses, hits drop, double strikes out of nowhere
      groove: {
        kit: 'glitch',
        microTiming: { kick: 0, hat: 0, snare: 0 },  // chaos offset applied separately
        ghosts: 0,
        backbeat: false,
        maxVel: 0.9,
        broken: true,
        dropRate: 0.25,    // 25% chance a hit just doesn't happen
        doubleRate: 0.15,  // 15% chance kick fires twice in quick succession
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
      var item = document.createElement('div');
      item.className = 'protocol-item';
      item.setAttribute('data-index', i);

      var num = (i + 1 < 10 ? '0' : '') + (i + 1);
      item.innerHTML =
        '<span class="p-cursor">&#9658;</span>' +
        '<span class="p-num">' + num + '</span>' +
        '<div class="p-body">' +
          '<div class="p-name">' + p.name.toUpperCase() + '</div>' +
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

    // Populate command input
    var cmdIn = document.getElementById('cmd-input');
    if (cmdIn) {
      cmdIn.value = 'RUN ' + activeLens.name.toUpperCase();
    }

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
      el.textContent = 'PROTOCOL // ' + activeLens.name.toUpperCase();
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
