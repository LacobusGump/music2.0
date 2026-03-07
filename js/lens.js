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
    // Your movement conducts an orchestra.
    // Strings follow your tilt. Brass accents your peaks.
    // Timpani responds to your strongest gestures.
    {
      name: 'The Conductor',
      color: '#ffffff',
      description: 'Your body conducts. Strings follow your hands.',

      harmony: { root: 432, mode: 'major' },

      tone: {
        bassFreq: 80, bassGain: 4,
        midFreq: 1000, midQ: 0.8, midGain: 2,
        highFreq: 2800, highGain: -8,
        ceiling: 3200,
      },

      space: {
        reverb: { decay: 5.0, damping: 0.2 },
        delay: { feedback: 0.3, filter: 1400, sync: 'dotted-eighth' },
        saturation: 0.12,
        type: 'cathedral',
        reverbMix: 0.55,
      },

      palette: {
        // Your motion peaks → orchestral accents
        peak: { voice: 'brass', octave: -1, decay: 1.2 },
        // Your tilt → string melody following your hand
        continuous: { voice: 'organ', octave: 0, decay: 1.0 },
        // Between your peaks → gentle subdivision
        subdivision: { voice: 'hat', kit: 'brushes', divisions: 2, vel: 0.15 },
        // Harmonic color on strong peaks
        harmonic: { voice: 'piano', octave: 0, decay: 1.5 },
        // Your strongest gestures → full accent
        drum: { kit: 'acoustic' },
        // Burst on shake
        burst: { voice: 'bell', octave: 1 },
        // Warm bed that breathes with you
        texture: { wave: 'sawtooth', chord: [0, 4, 7], octave: 0, detune: 10, vol: 0.08, reverbSend: 0.5 },
        // Touch response
        touch: { voice: 'piano', octave: 0, decay: 1.2 },
      },

      response: {
        peakThreshold: 2.0,
        tiltRange: 50,
        noteInterval: 150,
        stillnessThreshold: 0.2,
        stillnessTimeout: 2.5,
        fadeTime: 4.0,
        filterRange: [250, 2800],
        densityThresholds: [0.3, 1.0, 2.5],
      },

      // How your body drives the music — makes this lens feel physically unique
      motion: {
        primary: 'tilt_rate',  // waving motion rate — like a conductor's baton
        melodic: 'gamma',      // tilt phone left/right = pitch (horizontal conducting)
        sensitivity: 1.0,
      },
    },

    // ─── 2. BLUE HOUR ────────────────────────────────────────────────
    // Smoky jazz club. Your walk IS the bass line.
    // Upright bass follows your steps. Brushes follow your rhythm.
    // Rhodes follows your tilt. Space everywhere.
    {
      name: 'Blue Hour',
      color: '#2a4a7f',
      description: 'Your walk is the bass line. Smoky jazz.',

      harmony: { root: 432, mode: 'dorian' },

      tone: {
        bassFreq: 100, bassGain: 6,
        midFreq: 600, midQ: 0.7, midGain: 1,
        highFreq: 2200, highGain: -12,
        ceiling: 2800,
      },

      space: {
        reverb: { decay: 3.5, damping: 0.3 },
        delay: { feedback: 0.45, filter: 1800, sync: 'dotted-eighth' },
        saturation: 0.15,
        type: 'room',
        reverbMix: 0.4,
      },

      palette: {
        // Your steps → walking bass
        peak: { voice: 'upright', octave: -1, decay: 0.8 },
        // Your tilt → Rhodes melody
        continuous: { voice: 'epiano', octave: 0, decay: 0.8 },
        // Brush patterns between your steps
        subdivision: { voice: 'hat', kit: 'brushes', divisions: 3, vel: 0.12 },
        // Chord color
        harmonic: { voice: 'epiano', octave: 0, decay: 1.2 },
        // Brush drums
        drum: { kit: 'brushes' },
        // Shake → quick grace notes
        burst: { voice: 'pluck', octave: 1 },
        // Quiet warm triangle pad
        texture: { wave: 'triangle', chord: [0, 7], octave: -1, detune: 6, vol: 0.06, reverbSend: 0.5 },
        // Touch = piano notes
        touch: { voice: 'epiano', octave: 0, decay: 0.8 },
      },

      response: {
        peakThreshold: 1.5,
        tiltRange: 40,
        noteInterval: 180,
        stillnessThreshold: 0.15,
        stillnessTimeout: 2.0,
        fadeTime: 3.5,
        filterRange: [200, 2200],
        densityThresholds: [0.2, 0.8, 2.0],
      },

      motion: {
        primary: 'bounce',     // vertical Z-axis bounce — your walk IS the bass
        melodic: 'beta',       // lean forward/back = walking bass note
        sensitivity: 1.2,
      },
    },

    // ─── 3. GOSPEL SUNDAY ────────────────────────────────────────────
    // Church warmth. Your voice is the choir.
    // Organ follows your tilt. 808 sub follows your steps.
    // Formant choir on strong gestures. Building praise.
    {
      name: 'Gospel Sunday',
      color: '#d4a24e',
      description: 'Church organ follows you. Building praise.',

      harmony: { root: 432, mode: 'major' },

      tone: {
        bassFreq: 60, bassGain: 8,
        midFreq: 800, midQ: 0.9, midGain: 3,
        highFreq: 3000, highGain: -6,
        ceiling: 3500,
      },

      space: {
        reverb: { decay: 4.5, damping: 0.15 },
        delay: { feedback: 0.25, filter: 1200, sync: 'quarter' },
        saturation: 0.2,
        type: 'cathedral',
        reverbMix: 0.6,
      },

      palette: {
        // Your steps → 808 sub bass foundation
        peak: { voice: 'sub808', octave: -2, decay: 0.6 },
        // Your tilt → organ following your hands
        continuous: { voice: 'organ', octave: 0, decay: 0.6 },
        // Shuffle between your steps
        subdivision: { voice: 'hat', kit: '808', divisions: 2, vel: 0.2 },
        // Strong peaks → choir formant
        harmonic: { voice: 'formant', octave: 0, decay: 1.5 },
        // 808 drum kit
        drum: { kit: '808' },
        // Shake → choir burst
        burst: { voice: 'formant', octave: 1 },
        // Organ drone
        texture: { wave: 'sine', chord: [0, 4, 7, 12], octave: -1, detune: 3, vol: 0.1, reverbSend: 0.6 },
        // Touch = organ response
        touch: { voice: 'organ', octave: 0, decay: 0.8 },
      },

      response: {
        peakThreshold: 1.8,
        tiltRange: 45,
        noteInterval: 130,
        stillnessThreshold: 0.2,
        stillnessTimeout: 2.0,
        fadeTime: 3.0,
        filterRange: [300, 2800],
        densityThresholds: [0.3, 1.2, 3.0],
      },

      motion: {
        primary: 'sustained',  // medium-term energy — holding builds the choir
        melodic: 'beta',       // raise the phone = raise the choir (arms up = higher)
        sensitivity: 0.9,
      },
    },

    // ─── 4. TUNDRA ───────────────────────────────────────────────────
    // Vast silence. Single notes in infinite space.
    // No drums. No bass. Just your breathing and sparse bells.
    // The most minimal palette — silence is the instrument.
    {
      name: 'Tundra',
      color: '#88aacc',
      description: 'Vast silence. Single notes in infinite space.',

      harmony: { root: 432, mode: 'pentatonic' },

      tone: {
        bassFreq: 80, bassGain: 5,
        midFreq: 500, midQ: 0.6, midGain: -1,
        highFreq: 3500, highGain: -10,
        ceiling: 3800,
      },

      space: {
        reverb: { decay: 6.0, damping: 0.1 },
        delay: { feedback: 0.55, filter: 2200, sync: 'dotted-eighth' },
        saturation: 0.05,
        type: 'infinite',
        reverbMix: 0.85,
      },

      palette: {
        // Your motion peaks → single bell in vast space
        peak: { voice: 'bell', octave: 1, decay: 2.5 },
        // Your tilt → sparse pluck melody
        continuous: { voice: 'pluck', octave: 1, decay: 2.0 },
        // NO subdivisions — silence between your gestures
        // NO drums — just you and space
        // NO harmonic fills — each note is precious
        // Warmth
        texture: { wave: 'sine', chord: [0, 7], octave: -1, detune: 12, vol: 0.04, reverbSend: 0.8 },
        // Touch = crystalline bell
        touch: { voice: 'bell', octave: 1, decay: 2.5 },
      },

      response: {
        peakThreshold: 1.0,
        tiltRange: 60,
        noteInterval: 400,       // very slow — one note at a time
        stillnessThreshold: 0.1,
        stillnessTimeout: 1.5,
        fadeTime: 5.0,           // long fade — sound lingers
        filterRange: [250, 3000],
        densityThresholds: [0.2, 0.6, 1.5],
      },

      motion: {
        primary: 'magnitude',  // standard — but very sparse, silence matters
        melodic: 'gamma',      // point the phone = choose your note (compass)
        sensitivity: 0.7,
      },
    },

    // ─── 5. POCKET DRUMMER ───────────────────────────────────────────
    // Your body IS the drum machine.
    // Every step, bounce, shake = a drum hit.
    // 808 sub on your peaks. Metallic FM fragments.
    // The most rhythmic palette — drums dominate.
    {
      name: 'Pocket Drummer',
      color: '#c45c3e',
      description: 'Your body IS the drum machine. 808 dominance.',

      harmony: { root: 432, mode: 'blues' },

      tone: {
        bassFreq: 50, bassGain: 8,
        midFreq: 400, midQ: 1.0, midGain: -3,
        highFreq: 2500, highGain: -10,
        ceiling: 3000,
      },

      space: {
        reverb: { decay: 1.0, damping: 0.6 },
        delay: { feedback: 0.35, filter: 1600, sync: 'eighth' },
        saturation: 0.45,
        sidechain: 0.5,
        type: 'intimate',
        reverbMix: 0.1,
      },

      palette: {
        // Your peaks → 808 sub HIT
        peak: { voice: 'sub808', octave: -2, decay: 0.4 },
        // Your tilt → FM stabs (metallic, broken)
        continuous: { voice: 'fm', octave: 1, decay: 0.3 },
        // Between your peaks → rapid hi-hats at YOUR tempo
        subdivision: { voice: 'hat', kit: '808', divisions: 4, vel: 0.35 },
        // FM fragments on strong peaks
        harmonic: { voice: 'fm', octave: 1, decay: 0.4 },
        // 808 kit — drums are king
        drum: { kit: '808' },
        // Shake → glitch burst
        burst: { voice: 'glitch', octave: 0 },
        // Minimal dark drone
        texture: { wave: 'triangle', chord: [0, 7], octave: -2, detune: 4, vol: 0.04, reverbSend: 0.1 },
        // Touch = stab
        touch: { voice: 'stab', octave: 0, decay: 0.3 },
      },

      response: {
        peakThreshold: 1.2,
        tiltRange: 35,
        noteInterval: 80,        // fast — responsive to every twitch
        stillnessThreshold: 0.15,
        stillnessTimeout: 1.0,
        fadeTime: 1.5,           // quick fade — drums don't linger
        filterRange: [200, 2500],
        densityThresholds: [0.15, 0.5, 1.5],
      },

      motion: {
        primary: 'impulse',    // instantaneous micro peaks — react to every hit
        melodic: 'speed',      // faster movement = higher FM pitch
        sensitivity: 1.5,
      },
    },

    // ─── 6. DARK MATTER ──────────────────────────────────────────────
    // Massive 808 sub + cascading Rhodes.
    // Your movement creates weight. Your tilt creates shimmer.
    // 52% delay feedback = everything cascades.
    {
      name: 'Dark Matter',
      color: '#5a3a6f',
      description: 'Massive 808 weight. Cascading shimmer.',

      harmony: { root: 432, mode: 'mixolydian' },

      tone: {
        bassFreq: 60, bassGain: 7,
        midFreq: 700, midQ: 0.8, midGain: 1,
        highFreq: 2500, highGain: -12,
        ceiling: 3000,
      },

      space: {
        reverb: { decay: 4.0, damping: 0.3 },
        delay: { feedback: 0.52, filter: 2000, sync: 'dotted-eighth' },
        saturation: 0.4,
        type: 'cathedral',
        reverbMix: 0.5,
      },

      palette: {
        // Your peaks → massive 808 sub
        peak: { voice: 'sub808', octave: -2, decay: 0.6 },
        // Your tilt → cascading Rhodes through delay
        continuous: { voice: 'epiano', octave: 0, decay: 1.5 },
        // Sparse subdivisions
        subdivision: { voice: 'hat', kit: 'acoustic', divisions: 2, vel: 0.15 },
        // Rhodes arpeggio color
        harmonic: { voice: 'epiano', octave: 1, decay: 1.8 },
        // Acoustic drums (sparse)
        drum: { kit: 'acoustic' },
        // Shake → cascading bell
        burst: { voice: 'bell', octave: 1 },
        // Add9 pad that breathes
        texture: { wave: 'triangle', chord: [0, 2, 7, 14], octave: -1, detune: 10, vol: 0.06, reverbSend: 0.6 },
        // Touch = Rhodes cascading through delay
        touch: { voice: 'epiano', octave: 0, decay: 1.8 },
      },

      response: {
        peakThreshold: 1.5,
        tiltRange: 45,
        noteInterval: 140,
        stillnessThreshold: 0.15,
        stillnessTimeout: 2.0,
        fadeTime: 4.0,           // long fade — delay tails linger
        filterRange: [300, 2800],
        densityThresholds: [0.2, 0.8, 2.0],
      },

      motion: {
        primary: 'flow',       // blended smooth energy — no sudden spikes
        melodic: 'gamma',      // wide sweeping tilt = cascading pitch changes
        sensitivity: 1.0,
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
