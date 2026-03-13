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
        reverb: { decay: 7.0, damping: 0.05, preDelay: 45 },  // scoring stage — 45ms = ~15m distance
        delay: { feedback: 0.2, filter: 2000, sync: 'dotted-eighth' },
        saturation: 0.08,
        type: 'cathedral',
        reverbMix: 0.7,
        spatial: { sweepRate: 0.07, sweepDepth: 0.72 }, // grand, wide, slow — orchestra sweeps
      },

      palette: {
        peak: { voice: 'brass', octave: -1, decay: 1.8 },
        continuous: { voice: 'cinematic', octave: 0, decay: 3.5 },
        harmonic: { voice: 'piano', octave: 0, decay: 1.6 },
        burst: { voice: 'brass', octave: 0 },
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

      // colorDeg: the scale degree that IS this emotion.
      // In major, degree 4 = the perfect 5th. The triumph note. Melodies orbit it.
      // phraseShape: how sentences in this world tend to end.
      emotion: { colorDeg: 4, phraseShape: 'arch' },

      motion: {
        primary: 'tilt_rate',
        melodic: 'gamma',
        sensitivity: 1.2,
      },
    },

    // ─── 2. GRID ──────────────────────────────────────────────────────
    // Fred Again. Four Tet. The warehouse at 4AM.
    // Dirty World detuned saws — the filth that falls through the floor.
    // Phrygian ♭2: unease, tension, no resolution, only more darkness.
    // Halftime snare. The drop IS the silence before the kick.
    // Your body drops.
    {
      name: 'Grid',
      color: '#ff3300',
      description: 'Dirty saws. Phrygian dystopia. Your body drops.',

      harmony: { root: 220, mode: 'phrygian' }, // A3 — dark but phone-audible

      tone: {
        bassFreq: 160, bassGain: 4,          // 160Hz — present but not slamming the compressor
        midFreq: 1000, midQ: 1.0, midGain: 2, // grit without crunch
        highFreq: 5000, highGain: -5,         // tame harshness
        ceiling: 7000,
      },

      space: {
        reverb: { decay: 2.2, damping: 0.50, preDelay: 32 },  // London warehouse — concrete walls, dead ceiling
        delay: { feedback: 0.48, filter: 4000, sync: 'dotted-eighth' }, // Fred Again echo trail
        saturation: 0.15,                               // warm tape crunch
        type: 'room',
        reverbMix: 0.32,
        spatial: { sweepRate: 0.09, sweepDepth: 0.6 },
      },

      palette: {
        // Massive: detuned unison (±2 + ±13 cents) — same note, 4 copies, chorus width.
        // Dirty hit on hard peaks — the crunch underneath the beauty.
        peak:       { voice: 'dirty',   octave: 0,  decay: 0.8 },
        continuous: { voice: 'massive', octave: 0,  decay: 5.0, sustained: true, velBoost: 1.7 },
        // No subdivision — hats come from GROOVE_DNA, not a metronome click
        // Stab answer — sharp, cuts through
        harmonic:   { voice: 'stab', octave: 0,  decay: 0.35 },
        // Glitch burst on big gestures
        burst:      { voice: 'glitch', octave: 0 },
        // No texture pad — the massive voice IS the texture, don't stack
        touch:      { voice: 'stab', octave: 0,  decay: 0.4 },
      },

      groove: {
        kit: '808',
        microTiming: { kick: 0, hat: 0, snare: 0 }, // quantized — the machine is perfect
        ghosts: 0.06,
        backbeat: false,
        maxVel: 0.98,
        broken: false,
        dropRate: 0,
      },

      response: {
        peakThreshold: 0.28,
        tiltRange: 48,
        noteInterval: 520,  // massive needs room — let each note sustain before next fires
        stillnessThreshold: 0.14,
        stillnessTimeout: 2.8,
        fadeTime: 3.5,
        filterRange: [200, 7000],
        densityThresholds: [0.18, 0.65, 1.6],
      },

      // Phrygian's soul is the ♭2 (degree 1 = 1 semitone from root).
      // That note is why Phrygian sounds ancient and dark — not just "minor."
      // Melodies lean into it. The darkness has a specific address.
      emotion: { colorDeg: 1, phraseShape: 'falling' },

      motion: {
        primary: 'tilt_rate',
        melodic: 'beta',
        sensitivity: 1.5,
      },
    },

    // ─── 3. DRIFT ─────────────────────────────────────────────────────
    // One piano. Two hands. Your tilt is the right hand (melody).
    // Your motion energy is the left hand (bass). They speak to each other.
    // Boards of Canada — dorian warmth, minimal reverb, notes breathe.
    // No texture competing. No voices fighting. Piano and space.
    {
      name: 'Drift',
      color: '#3d3550',
      description: 'One piano. Two hands. Memory and motion.',

      harmony: { root: 432, mode: 'dorian' },

      tone: {
        bassFreq: 110, bassGain: 5,
        midFreq: 700, midQ: 0.5, midGain: 1,
        highFreq: 2800, highGain: -12,   // tape: highs rolled off
        ceiling: 3500,
      },

      space: {
        reverb: { decay: 5.0, damping: 0.18, preDelay: 12 },  // intimate — close room, warm tape
        delay: { feedback: 0.32, filter: 1600, sync: 'dotted-eighth' },
        saturation: 0.05,
        type: 'cathedral',
        reverbMix: 0.44,   // drier — notes need room to exist before they blend
        spatial: { sweepRate: 0.04, sweepDepth: 0.28 },
      },

      palette: {
        // Your tilt → right hand melody (middle register)
        continuous: { voice: 'mono', octave: 0, decay: 2.5 },
        // Your motion → left hand bass (different octave = no frequency clash)
        peak: { voice: 'piano', octave: -1, decay: 2.5 },
        // Strong peaks only: a high note answers 320ms later (see harmonic delay in follow.js)
        harmonic: { voice: 'piano', octave: 1, decay: 2.0 },
        touch: { voice: 'piano', octave: 0, decay: 3.0 },
        // No texture, no burst — silence IS the arrangement
      },

      groove: null,

      response: {
        peakThreshold: 0.35,
        tiltRange: 55,
        noteInterval: 750,
        stillnessThreshold: 0.07,
        stillnessTimeout: 2.5,
        fadeTime: 11.0,
        filterRange: [200, 2800],
        densityThresholds: [0.12, 0.55, 1.3],
      },

      // Dorian's soul is the natural 6th (degree 5 = 9 semitones from root).
      // That note is why Dorian sounds like beautiful sadness, not just sadness.
      // Minor with one beam of light. Boards of Canada lives here.
      emotion: { colorDeg: 5, phraseShape: 'falling' },

      motion: {
        primary: 'tilt_rate',
        melodic: 'beta',
        sensitivity: 0.8,
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
        reverb: { decay: 6.5, damping: 0.08, preDelay: 55 },  // ECM cathedral — most distant, brightest tail
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
      // Picardy's soul is the tension between minor 3rd (grief) and major 3rd (hope).
      // Degree 2 = the minor 3rd. When the picardy major 3rd (degree 3) appears,
      // the minor becomes briefly major — grief resolving to a moment of light.
      emotion: { colorDeg: 2, phraseShape: 'answer' },
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
        reverb: { decay: 4.5, damping: 0.20, preDelay: 28 },  // converted church — medium distance, clear
        delay: { feedback: 0.55, filter: 2400, sync: 'dotted-eighth' },   // longer delay = gesture echoes back
        saturation: 0.04,
        type: 'cathedral',
        reverbMix: 0.5,
        spatial: { sweepRate: 0.10, sweepDepth: 0.48 }, // gentle flow, medium sweep
      },

      palette: {
        peak: { voice: 'piano', octave: 0, decay: 2.5 },
        continuous: { voice: 'mono', octave: 0, decay: 2.8 },
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

      // Lydian's soul is the raised 4th (degree 3 = tritone from root = 6 semitones).
      // That one note is why Lydian sounds like wonder — it floats and never fully lands.
      // "Somewhere Over the Rainbow." The raised 4th is the door to another world.
      emotion: { colorDeg: 3, phraseShape: 'question' },

      motion: {
        primary: 'tilt_rate',
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
        bassFreq: 55, bassGain: 4,
        midFreq: 500, midQ: 1.2, midGain: -1,
        highFreq: 2000, highGain: -16,
        ceiling: 2500,
      },

      space: {
        reverb: { decay: 5.0, damping: 0.20, preDelay: 6 },   // close, wrong, invasive — the room is too small
        delay: { feedback: 0.72, filter: 1800, sync: 'dotted-eighth' },
        saturation: 0.12,
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

      // Same Phrygian ♭2 as Grid, but deeper.
      // Dark Matter has no interest in resolution. The ♭2 is the destination.
      emotion: { colorDeg: 1, phraseShape: 'falling' },

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
    // Always pick a random lens — no two sessions the same.
    // Read last index so we can avoid repeating it.
    var lastIndex = 0;
    try {
      var s = localStorage.getItem('m2_lens');
      if (s) { var d = JSON.parse(s); lastIndex = d.index || 0; }
    } catch (e) {}
    var idx;
    do { idx = Math.floor(Math.random() * PRESETS.length); } while (idx === lastIndex && PRESETS.length > 1);
    selectCard(idx);
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
