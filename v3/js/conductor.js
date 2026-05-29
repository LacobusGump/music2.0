/**
 * CONDUCTOR — The Baton Paradigm (v3.1)
 *
 * The phone is a conductor's baton. You shape HOW the music evolves,
 * not what notes play. Three physical axes, three musical dimensions:
 *
 *   BETA (front-back tilt) = baton height = song section
 *     Arms low  (β < 38°) → Intro  — space and suggestion, just breath
 *     Arms mid  (β 38-56°)→ Verse  — head melody, groove established
 *     Arms up   (β 56-72°)→ Build  — tension rising, pre-chorus push
 *     Arms high (β > 72°) → Chorus — full arrangement, peak energy
 *
 *   ENERGY (acceleration magnitude) = expression intensity
 *     Stillness → hold current section, music sustains
 *     Movement  → velocity and density within section
 *     Downbeat  → sharp snap gesture, forces immediate transition
 *
 *   GAMMA (left-right tilt) = stereo field / spatial position
 *     Left/right tilt = stereo panning
 *
 * Music plays AUTONOMOUSLY from section motifs.
 * The conductor picks WHICH section is alive and HOW INTENSE it is.
 * You are not playing notes. You are conducting a song.
 *
 * Architecture inspired by:
 *   - Suno song structure: [Intro][Verse][Build][Chorus] as structural tokens
 *   - Real conducting: arms high = chorus, arms low = intro (physical logic)
 *   - DTW gesture research: downbeat = sharp phase discontinuity (decel)
 *   - Euclidean rhythm (Bjorklund): drums play themselves, earned over time
 */

const Conductor = (function () {
  'use strict';

  // ── CONSTANTS ─────────────────────────────────────────────────────────

  var PHASE_LISTENING = 4;
  var PHASE_ALIVE     = 14;

  // Beta angle thresholds (degrees)
  // Natural phone hold ≈ 62° → BUILD zone by default.
  // Player intentionally lowers (verse/intro) or raises (chorus).
  var BETA_INTRO  = 38;   // below = intro
  var BETA_VERSE  = 56;   // 38-56 = verse
  var BETA_BUILD  = 72;   // 56-72 = build, above = chorus

  // Must hold a zone for this long before section commits (anti-jitter)
  var HOLD_TIME   = 0.60; // seconds

  var BAR_DEFAULT = 88;   // BPM fallback when tempo not yet locked


  // ── SECTION DEFINITIONS ───────────────────────────────────────────────
  //
  // Four levels modeled on Suno's song structure:
  //   Intro → Verse → Build → Chorus
  //
  // Music plays AUTONOMOUSLY from these patterns.
  // These are composed scale-degree sequences — not random.
  // Harmony.js (gravity wells + sweet spots) maps them to the right
  // pitches for the current key and mode. The conductor just picks level.
  //
  // Scale degrees: 0=root, 2=M2, 4=M3, 7=P5, 9=M6, -1=rest
  // Bass at octave -2 via Harmony.freq(deg, -2).
  //
  // melInterval/harmInterval/bassInterval: seconds between notes.
  // Scaled by styleSpeedFactor so each genre feels right.
  //
  // Motif design rationale:
  //   Verse:  root → second → third → second → root  (the "head" — main theme)
  //   Build:  third → seventh (rising line through the scale — tension)
  //   Chorus: root → third → fifth → sixth (the "big" notes — payoff)
  //   Bass:   Verse=root+fifth pedal, Build=chromatic descent, Chorus=I-V-III-I

  var SECTION_DEFS = [
    { // ── INTRO (0) ────────────────────────────────────────────────────
      // Breathe in. The harmonic shell arrives. No melody yet.
      // Like bars 1-4 of a Suno track before the first verse.
      name: 'intro',
      mel:  [],
      harm: [0, 0, 4, 0],
      bass: [0],
      melInterval:  0,
      harmInterval: 2.00,
      bassInterval: 3.50,
      melVel:  0,
      harmVel: 0.20,
      bassVel: 0.14,
    },
    { // ── VERSE (1) ────────────────────────────────────────────────────
      // The head. Main melodic idea. Groove locked in.
      // Melody traces the tonic triad, gently.
      name: 'verse',
      mel:  [0, 2, 4, 2, 0, -1, 0, 2],
      harm: [0, 2, 4, 2],
      bass: [0, -7, 0, -7],
      melInterval:  0.50,
      harmInterval: 1.60,
      bassInterval: 0.80,
      melVel:  0.42,
      harmVel: 0.28,
      bassVel: 0.30,
    },
    { // ── BUILD (2) ────────────────────────────────────────────────────
      // Tension. Rising line. Pre-chorus energy climb.
      // Melody pushes upward to the 7th (scale degree 6 in 0-indexed).
      // Bass: chromatic walk I→VII→VIm creates harmonic motion.
      name: 'build',
      mel:  [4, 2, 4, 6, 4, 2, 4, 2],
      harm: [2, 4, 6, 4],
      bass: [0, -2, -3, -2],
      melInterval:  0.36,
      harmInterval: 1.10,
      bassInterval: 0.55,
      melVel:  0.56,
      harmVel: 0.36,
      bassVel: 0.40,
    },
    { // ── CHORUS (3) ───────────────────────────────────────────────────
      // Everything. Peak energy. The emotional payoff.
      // Melody hits the 5th and 6th — the "big" notes people sing.
      // Bass: I-V-III-I = strong harmonic motion, felt in the body.
      name: 'chorus',
      mel:  [0, 4, 7, 4, 0, 4, 7, 9],
      harm: [0, 4, 0, 7],
      bass: [0, -5, -3, 0],
      melInterval:  0.27,
      harmInterval: 0.85,
      bassInterval: 0.42,
      melVel:  0.70,
      harmVel: 0.44,
      bassVel: 0.52,
    },
  ];


  // ── STYLE → LENS ──────────────────────────────────────────────────────
  //
  // Per-style voice selection, EQ, reverb, and rhythm kit.
  // Sound.configure(lens) reads lens.tone for master EQ.
  // The conductor's section system runs ON TOP of this — the lens
  // defines the sonic character, the sections define the structure.
  //
  // noteInterval in response is repurposed as "style speed factor":
  //   noteInterval / 400ms = how fast section motifs play.
  //   lofi=1.05 (lazy), rnb=0.80 (groove), jazz=0.70 (fast),
  //   ambient=1.50 (very slow), trap=0.90 (tight)

  var STYLE_LENS = {
    lofi: {
      pipeline: 'organic',
      palette: {
        continuous: { voice: 'lofiRhodes', octave: 0,  decay: 1.8  },
        harmonic:   { voice: 'lofiRhodes', octave: -1, decay: 2.4  },
        peak:       { voice: 'piano',      octave: -1, decay: 0.7  },
      },
      response: {
        tiltRange:          50,
        noteInterval:       420,
        melodicEnergy:      0.10,
        melodicMinDelta:    1,
        stillnessThreshold: 0.18,
        stillnessTimeout:   2.5,
        fadeTime:           3.5,
      },
      rhythm:  { kit: 'brushes' },
      tone: {
        ceiling:  2200,
        bassFreq: 180, bassGain: 3,
        midFreq:  450, midQ: 0.8, midGain: 3.5,
        highFreq: 2200, highGain: -12,
      },
      space: {
        reverbMix: 0.42,
        reverb: { decay: 3.2, damping: 0.55, preDelay: 25 },
        delay:  { feedback: 0.42, filter: 1800 },
      },
      motion:  { melodic: 'beta' },
      emotion: { phraseShape: 'arch' },
    },
    rnb: {
      pipeline: 'organic',
      palette: {
        continuous: { voice: 'soulKeys', octave: 0,  decay: 1.1  },
        harmonic:   { voice: 'soulKeys', octave: -1, decay: 1.8  },
        peak:       { voice: 'piano',    octave: -1, decay: 0.6  },
      },
      response: {
        tiltRange:          55,
        noteInterval:       320,
        melodicEnergy:      0.12,
        melodicMinDelta:    1,
        stillnessThreshold: 0.20,
        stillnessTimeout:   2.0,
        fadeTime:           2.8,
      },
      rhythm:  { kit: 'acoustic' },
      tone: {
        ceiling:  3600,
        bassFreq: 120, bassGain: 1,
        midFreq:  850, midQ: 0.6, midGain: 1.5,
        highFreq: 3600, highGain: -5,
      },
      space: {
        reverbMix: 0.28,
        reverb: { decay: 1.8, damping: 0.35, preDelay: 15 },
        delay:  { feedback: 0.28, filter: 2400 },
      },
      motion:  { melodic: 'beta' },
      emotion: { phraseShape: 'rise' },
    },
    jazz: {
      pipeline: 'organic',
      palette: {
        continuous: { voice: 'piano',   octave: 0,  decay: 1.2  },
        harmonic:   { voice: 'upright', octave: -1, decay: 1.5  },
        peak:       { voice: 'piano',   octave: -1, decay: 0.5  },
      },
      response: {
        tiltRange:          60,
        noteInterval:       280,
        melodicEnergy:      0.08,
        melodicMinDelta:    1,
        stillnessThreshold: 0.15,
        stillnessTimeout:   2.0,
        fadeTime:           2.2,
      },
      rhythm:  { kit: 'brushes' },
      tone: {
        ceiling:  4500,
        bassFreq: 200, bassGain: -2,
        midFreq:  1000, midQ: 0.5, midGain: 1,
        highFreq: 4500, highGain: -6,
      },
      space: {
        reverbMix: 0.22,
        reverb: { decay: 1.2, damping: 0.25, preDelay: 8 },
        delay:  { feedback: 0.22, filter: 3000 },
      },
      motion:  { melodic: 'beta' },
      emotion: { phraseShape: 'fall' },
    },
    ambient: {
      pipeline: 'organic',
      palette: {
        continuous: { voice: 'strings', octave: 0,  decay: 3.5, sustained: true },
        harmonic:   { voice: 'strings', octave: -1, decay: 4.2 },
        peak:       { voice: 'strings', octave: -1, decay: 2.8 },
      },
      response: {
        tiltRange:          70,
        noteInterval:       600,
        melodicEnergy:      0.06,
        melodicMinDelta:    2,
        stillnessThreshold: 0.12,
        stillnessTimeout:   3.0,
        fadeTime:           5.0,
      },
      rhythm:  { kit: 'tribal' },
      tone: {
        ceiling:  2800,
        bassFreq: 100, bassGain: 2,
        midFreq:  350, midQ: 0.7, midGain: 3,
        highFreq: 2800, highGain: -8,
      },
      space: {
        reverbMix: 0.68,
        reverb: { decay: 6.0, damping: 0.70, preDelay: 40 },
        delay:  { feedback: 0.55, filter: 1200 },
      },
      motion:  { melodic: 'beta' },
      emotion: { phraseShape: 'arch' },
    },
    trap: {
      pipeline: 'organic',
      palette: {
        continuous: { voice: 'mono', octave: 0,  decay: 0.6 },
        harmonic:   { voice: 'mono', octave: -1, decay: 0.9 },
        peak:       { voice: 'stab', octave: -1, decay: 0.4 },
      },
      response: {
        tiltRange:          45,
        noteInterval:       360,
        melodicEnergy:      0.14,
        melodicMinDelta:    1,
        stillnessThreshold: 0.22,
        stillnessTimeout:   2.0,
        fadeTime:           2.5,
      },
      rhythm:  { kit: '808' },
      tone: {
        ceiling:  3000,
        bassFreq: 80, bassGain: 4,
        midFreq:  600, midQ: 0.6, midGain: -1,
        highFreq: 3000, highGain: -7,
      },
      space: {
        reverbMix: 0.35,
        reverb: { decay: 2.5, damping: 0.40, preDelay: 30 },
        delay:  { feedback: 0.32, filter: 1600 },
      },
      motion:  { melodic: 'beta' },
      emotion: { phraseShape: 'arch' },
    },
  };


  // ── STATE ─────────────────────────────────────────────────────────────

  var _active  = false;
  var _styleId = 'lofi';
  var _lens    = null;
  var _lastT   = 0;
  var _styleSpeedFactor = 1.0;

  // Section state machine
  var _sectionLevel     = 0;    // current active section (0-3)
  var _sectionSmoothed  = 0;    // float target for display interpolation
  var _transitionTarget = -1;   // pending transition (-1 = none)
  var _holdTimer        = 0;    // how long we've held current zone
  var _holdTarget       = 0;    // which zone we're currently holding

  // Bar clock — transitions only happen at bar boundaries (musical)
  var _barProgress = 0;
  var _lastBpm     = BAR_DEFAULT;

  // Motif playback clocks (three independent voices)
  var _melStep  = 0; var _melClock  = 0;
  var _harmStep = 0; var _harmClock = 0;
  var _bassStep = 0; var _bassClock = 0;

  // Last gesture state (for intensity scaling in motif playback)
  var _lastGesture = null;

  // Silence / presence gate
  var _isSilent       = true;
  var _fadeGain       = 0;
  var _stillnessTimer = 0;

  // Session arc
  var _sessionPhase       = 0;
  var _sessionEngagedTime = 0;

  // Phrase (section-span arc)
  var _phraseActive          = false;
  var _phraseStartTime       = 0;
  var _phraseMaxMag          = 0;
  var _phraseEnergyArc       = 0;
  var _phraseCooldown        = 0;
  var _phraseIntensityFactor = 1.0;

  // Call & response
  var _crCooldown    = 0;
  var _answerPending = false;
  var _answerTime    = 0;
  var _answerNotes   = [];
  var _answerIdx     = 0;

  // Prodigy (mix intelligence)
  var _prodigy = {
    energyHistory: new Float32Array(16),
    energyHead:    0,
    sampleTimer:   0,
    arc:           'neutral',
    dynamicRange:  1.0,
    reverbTarget:  0.30,
  };

  var _noteCount  = 0;
  var _errorCount = 0;
  var _touchDuck  = 1.0;

  // ── 1/f PINK NOISE for motif timing (Hennig 2011) ─────────────────────
  // Voss-McCartney algorithm. Correlated deviations, not random jitter.
  // Same principle rhythm.js uses for drums — now applied to melody/bass.
  // Without this: melody sounds like MIDI. With it: melody breathes.
  var _pinkB = [0, 0, 0, 0, 0, 0, 0];
  function _pinkNoise() {
    var white = Math.random() * 2 - 1;
    _pinkB[0] = 0.99886 * _pinkB[0] + white * 0.0555179;
    _pinkB[1] = 0.99332 * _pinkB[1] + white * 0.0750759;
    _pinkB[2] = 0.96900 * _pinkB[2] + white * 0.1538520;
    _pinkB[3] = 0.86650 * _pinkB[3] + white * 0.3104856;
    _pinkB[4] = 0.55000 * _pinkB[4] + white * 0.5329522;
    _pinkB[5] = -0.7616 * _pinkB[5] + white * 0.0168980;
    return (_pinkB[0]+_pinkB[1]+_pinkB[2]+_pinkB[3]+_pinkB[4]+_pinkB[5]+_pinkB[6]+white*0.5362) / 8;
  }

  // ── VELOCITY ACCENT PATTERN (Juslin 2003, embodiment signatures) ──────
  // Beat 1 hits hardest. Off-beats are lighter. This is what makes a
  // groove feel intentional. 8-step and 4-step tables (mod-matched).
  var _ACCENT_8 = [1.00, 0.58, 0.80, 0.62, 0.90, 0.56, 0.74, 0.60];
  var _ACCENT_4 = [1.00, 0.68, 0.88, 0.64];

  // ── SYNCOPATION OFFSETS (Witek et al. 2014) ───────────────────────────
  // Moderate syncopation = peak groove. Some steps pushed ±1 eighth note.
  // Values in seconds of timing ADVANCE (negative = ahead of beat = syncopated).
  // Applied as extra offset to the motif clock after the jitter.
  var _SYNCOP_8  = [0, 0, -0.03, 0,  0.02, 0, -0.04, 0];   // anticipations on steps 2,4,6
  var _SYNCOP_4  = [0, -0.02, 0, 0.02];


  // ── SILENCE ───────────────────────────────────────────────────────────

  function _updateSilence(dt, now) {
    var mag  = Body.energy;
    var resp = _lens.response;

    if (mag < resp.stillnessThreshold) {
      _stillnessTimer += dt;

      if (_stillnessTimer > resp.stillnessTimeout && !_isSilent) {
        var lastDeg = _getLastMotifDegree();
        try { Harmony.enterSilence(lastDeg); } catch(e) {}
        _isSilent = true;
        // Play a resolution note as the music fades
        var cont = _lens.palette.continuous;
        try {
          Sound.play(cont.voice, Sound.currentTime,
            Harmony.freq(0, cont.octave || 0), 0.22, 2.0);
        } catch(e) {}
      }

      if (_isSilent) {
        _fadeGain *= (1 - dt / resp.fadeTime);
        if (_fadeGain < 0.005) _fadeGain = 0;
      }
    } else {
      if (_isSilent && mag > resp.stillnessThreshold * 2) {
        _isSilent       = false;
        _stillnessTimer = 0;

        // Wake-up: silence has memory
        try { Harmony.exitSilence(); } catch(e) {}
        var h = _lens.palette.harmonic;
        try { Sound.play(h.voice, Sound.currentTime, Harmony.freq(0, -1), 0.20, 1.8); }
        catch(e) {}
      }
      _stillnessTimer = 0;

      if (!_isSilent) {
        _sessionEngagedTime += dt;
        _sessionPhase = _sessionEngagedTime < PHASE_LISTENING ? 0
                      : _sessionEngagedTime < PHASE_ALIVE     ? 1
                      : 2;

        var ceiling = _sessionPhase === 0 ? 0.45 : _sessionPhase === 1 ? 0.72 : 1.0;
        var target  = Math.min(ceiling, mag / 2);
        _fadeGain  += (target - _fadeGain) * 0.05;
      }
    }
  }

  function _getLastMotifDegree() {
    var sec = SECTION_DEFS[_sectionLevel];
    if (!sec.mel || sec.mel.length === 0) return 0;
    var idx = (_melStep - 1 + sec.mel.length) % sec.mel.length;
    var d   = sec.mel[idx];
    return (d === -1) ? 0 : (d || 0);
  }


  // ── GESTURE INTERPRETER ───────────────────────────────────────────────
  //
  // Sustained beta position → section level target.
  // Must HOLD a zone for HOLD_TIME seconds before section commits.
  // A downbeat gesture (sharp Body.peaked) can accelerate the transition.
  //
  // Physical logic: arms low = intro, arms high = chorus.
  // This mirrors how a real conductor uses baton height.
  // (Source: DTW gesture research — sustained position = section cue)

  function _readGesture(sensor, dt) {
    var beta = (sensor.beta !== undefined) ? sensor.beta : 62;

    // Map beta to zone 0-3
    var target = beta < BETA_INTRO ? 0
               : beta < BETA_VERSE ? 1
               : beta < BETA_BUILD ? 2
               : 3;

    // Smooth float for display interpolation
    _sectionSmoothed += (target - _sectionSmoothed) * 0.025;

    // Hysteresis: hold counter resets on zone change
    if (target !== _holdTarget) {
      _holdTarget = target;
      _holdTimer  = 0;
    } else if (!_isSilent) {
      _holdTimer += dt;
    }

    // Downbeat gesture: sharp peak forces immediate transition if already holding
    var downbeat = Body.peaked && Body.peakMagnitude > 1.8 && !_isSilent;
    if (downbeat && target !== _sectionLevel && _holdTimer > 0.15) {
      _transitionTarget = target;
    }

    return {
      target:    target,
      commit:    _holdTimer >= HOLD_TIME,
      intensity: Math.min(1, Body.energy / 2.5),
      downbeat:  downbeat,
      isStill:   Body.energy < 0.09,
    };
  }


  // ── SECTION STATE MACHINE ─────────────────────────────────────────────

  function _updateSectionLevel(gesture) {
    // Queue transition when conductor holds a new zone
    if (gesture.commit && gesture.target !== _sectionLevel) {
      _transitionTarget = gesture.target;
    }
  }


  // ── BAR CLOCK ─────────────────────────────────────────────────────────
  // Transitions only happen at bar boundaries — musical, not abrupt.
  // Bar = 4 beats at current tempo.

  function _updateBarClock(dt) {
    var tempo = (typeof Rhythm !== 'undefined' && Rhythm.tempoLocked && Rhythm.tempo > 0)
      ? Rhythm.tempo : _lastBpm;
    _lastBpm     = tempo;
    var barDur   = (60.0 / tempo) * 4;
    _barProgress += dt / barDur;
    if (_barProgress >= 1.0) {
      _barProgress -= 1.0;
      _onBarBoundary();
    }
  }

  function _onBarBoundary() {
    if (_transitionTarget >= 0 && _transitionTarget !== _sectionLevel) {
      _executeTransition(_transitionTarget);
    }
  }

  function _executeTransition(toLevel) {
    _sectionLevel     = toLevel;
    _transitionTarget = -1;

    // Reset motif clocks — new section always starts at beat 1
    _melStep  = 0; _melClock  = 0;
    _harmStep = 0; _harmClock = 0;
    _bassStep = 0; _bassClock = 0;

    // Musical arrival: chord announces the new section
    if (!_isSilent && _fadeGain > 0.08 && Sound.ctx) {
      var h   = _lens.palette.harmonic;
      var t0  = Sound.currentTime;
      var vel = 0.24 + _fadeGain * 0.22;
      var chord = toLevel >= 3 ? [0, 4, 7]
                : toLevel >= 2 ? [0, 4]
                : toLevel >= 1 ? [0]
                : [];
      for (var ci = 0; ci < chord.length; ci++) {
        try {
          Sound.play(h.voice, t0 + ci * 0.09,
            Harmony.freq(chord[ci], h.octave !== undefined ? h.octave : -1),
            vel * (1 - ci * 0.08), 1.5 + toLevel * 0.28);
        } catch(e) { _errorCount++; }
      }
    }

    // Reverb: intro=spacious (60%), verse=open (45%), build=medium (30%), chorus=tight (18%)
    // The music gets more "present" as it gets bigger.
    var reverbByLevel = [0.60, 0.45, 0.30, 0.18];
    var reverbFloor   = (_lens.space && _lens.space.reverbMix) || 0.30;
    try { Sound.setReverbMix(Math.max(reverbFloor * 0.5, reverbByLevel[toLevel])); } catch(e) {}
  }


  // ── MOTIF PLAYBACK ────────────────────────────────────────────────────
  //
  // This is THE instrument. Music plays itself.
  // Three autonomous voices: melody, harmony, bass.
  // All scaled by _styleSpeedFactor so each genre feels different.
  //
  // The conductor doesn't trigger notes — they control WHICH section
  // is playing and HOW INTENSE it is. The section plays its material.

  function _updateMotifPlayback(now, dt) {
    if (!Sound.ctx || _isSilent || _fadeGain < 0.04 || _sessionPhase < 1) return;

    var sec       = SECTION_DEFS[_sectionLevel];
    var gest      = _lastGesture;
    var intensity = (gest ? Math.max(0.28, gest.intensity) : 0.40) * _fadeGain;
    var pf        = _phraseIntensityFactor || 1.0;
    var sf        = _styleSpeedFactor;

    var cont = _lens.palette.continuous;
    var harm = _lens.palette.harmonic;

    // ── MELODY ────────────────────────────────────────────────────────
    // The main melodic line. Voice and octave from style lens.
    //
    // Three research principles applied here:
    //  1. 1/f timing jitter (Hennig 2011): ±22ms correlated deviation.
    //     Same principle as the drum engine. Without this = MIDI. With = alive.
    //  2. Velocity accent pattern (Juslin 2003): beat 1 hits harder,
    //     off-beats lighter. That's what makes groove feel intentional.
    //  3. Syncopation (Witek 2014): steps 2,4,6 pushed slightly ahead
    //     of the beat. Moderate anticipation = peak groove feeling.

    if (sec.mel.length > 0 && sec.melInterval > 0) {
      _melClock -= dt;
      if (_melClock <= 0) {
        var melStepIdx = _melStep % sec.mel.length;

        // 1/f timing: correlated jitter ±22ms (Hennig 2011)
        var melJitter  = _pinkNoise() * 0.022;
        // Syncopation: anticipate some beats (Witek 2014)
        var melSyncop  = (sec.mel.length >= 8)
          ? _SYNCOP_8[melStepIdx % 8]
          : _SYNCOP_4[melStepIdx % 4];
        _melClock += sec.melInterval * sf + melJitter + melSyncop;

        var rawDeg = sec.mel[melStepIdx];
        _melStep++;

        if (rawDeg !== -1) {
          var deg = rawDeg;
          try { deg = Harmony.applySweetSpot(deg); } catch(e) {}
          try { deg = Harmony.applyMotifGravity(deg); } catch(e) {}

          // Occasional motif variation: every 2 loops, 18% chance of neighbor sub
          // (Margulis 2014: repetition creates musicality, micro-variation keeps it alive)
          if (melStepIdx === 0 && Math.random() < 0.18) {
            deg = deg + (Math.random() < 0.5 ? 1 : -1);
          }

          var freq = Harmony.freq(deg, cont.octave || 0);

          // Accent pattern (Juslin 2003)
          var accent = (sec.mel.length >= 8)
            ? _ACCENT_8[melStepIdx % 8]
            : _ACCENT_4[melStepIdx % 4];
          var vel  = Math.min(0.74, sec.melVel * intensity * pf * accent);

          if (vel > 0.03) {
            Sound.play(cont.voice, Sound.currentTime, freq, vel,
              sec.melInterval * sf * 0.88);
            try { Harmony.recordNote(deg); } catch(e) {}
            _noteCount++;
          }
        }
      }
    }

    // ── HARMONY PADS ──────────────────────────────────────────────────
    // Backing harmonic support. Enters at verse (level 1+).
    // Also gets 1/f timing so it doesn't lock against the melody grid.

    if (sec.harm.length > 0 && sec.harmInterval > 0 && _sectionLevel >= 1) {
      _harmClock -= dt;
      if (_harmClock <= 0) {
        var harmStepIdx = _harmStep % sec.harm.length;
        _harmClock += sec.harmInterval * sf + _pinkNoise() * 0.018;
        var hdeg  = sec.harm[harmStepIdx];
        _harmStep++;
        var harmAccent = _ACCENT_4[harmStepIdx % 4];
        var hfreq = Harmony.freq(hdeg, harm.octave !== undefined ? harm.octave : -1);
        var hvel  = Math.min(0.52, sec.harmVel * intensity * harmAccent);
        if (hvel > 0.03) {
          Sound.play(harm.voice, Sound.currentTime, hfreq, hvel,
            sec.harmInterval * sf * 0.82);
        }
      }
    }

    // ── BASS ──────────────────────────────────────────────────────────
    // Low-end foundation. Enters at verse (level 1+).
    // Bass gets lighter 1/f jitter — it should anchor but not feel robotic.
    // Style EQ shapes character: lofi=warm 2.2kHz, trap=sub 80Hz boost.

    if (sec.bass.length > 0 && sec.bassInterval > 0 && _sectionLevel >= 1) {
      _bassClock -= dt;
      if (_bassClock <= 0) {
        var bassStepIdx = _bassStep % sec.bass.length;
        _bassClock += sec.bassInterval * sf + _pinkNoise() * 0.012;
        var bassAccent = _ACCENT_4[bassStepIdx % 4];
        var bdeg  = sec.bass[bassStepIdx];
        _bassStep++;
        var bfreq = Harmony.freq(bdeg, -2);
        var bvel  = Math.min(0.64, sec.bassVel * intensity * bassAccent);
        if (bvel > 0.03) {
          Sound.play('mono', Sound.currentTime, bfreq, bvel,
            sec.bassInterval * sf * 0.78);
        }
      }
    }
  }


  // ── PHRASE (section-span arc) ─────────────────────────────────────────
  // Phrases track energy arcs WITHIN sections.
  // When energy rises above threshold, a phrase begins.
  // phraseIntensityFactor scales velocity — louder at climax, softer at ends.

  function _updatePhrase(mag, now, dt) {
    if (_phraseCooldown > 0) _phraseCooldown -= dt;

    if (!_phraseActive) {
      if (mag > 0.5 && _phraseCooldown <= 0 && !_isSilent) {
        _phraseActive    = true;
        _phraseStartTime = now;
        _phraseMaxMag    = mag;
        _phraseEnergyArc = 0;
        try { Harmony.startPhrase && Harmony.startPhrase(); } catch(e) {}
        try {
          Harmony.pickPhraseContour && Harmony.pickPhraseContour(Body.archetype,
            (_lens.emotion && _lens.emotion.phraseShape) || null);
        } catch(e) {}
      }
    } else {
      var dur = now - _phraseStartTime;
      if (mag > _phraseMaxMag) _phraseMaxMag = mag;

      // Phrase length grows with section level — chorus phrases are longer
      var phraseLen = 5000 + _sectionLevel * 1500;
      _phraseEnergyArc = Math.min(1, dur / phraseLen);

      if (_phraseEnergyArc < 0.4) {
        _phraseIntensityFactor = 0.45 + (_phraseEnergyArc / 0.4) * 0.55;
      } else if (_phraseEnergyArc < 0.8) {
        _phraseIntensityFactor = 1.0;
      } else {
        _phraseIntensityFactor = 1.0 - (_phraseEnergyArc - 0.8) / 0.2;
      }

      if ((mag < 0.15 && dur > 1200) || dur > phraseLen * 1.5) {
        _endPhrase(now);
      }
    }
  }

  function _endPhrase(now) {
    _phraseActive          = false;
    _phraseCooldown        = 0.4;
    _phraseIntensityFactor = 1.0;
    try { Harmony.endPhrase && Harmony.endPhrase(_phraseMaxMag); } catch(e) {}
  }


  // ── PEAK HANDLER ─────────────────────────────────────────────────────
  // Peaks (sharp body accelerations) add accent notes on top of motif playback.
  // Peak voice: chord tone appropriate to current section.

  function _onPeak(magnitude, now) {
    if (_sessionPhase === 0 || !Sound.ctx) return;
    try {
      var t   = Sound.currentTime;
      var vel = Math.min(1, magnitude / 4) * _phraseIntensityFactor;
      var p   = _lens.palette.peak;

      if (p && vel > 0.08) {
        // Peak degree: root for intro/verse, 3rd for build, 5th for chorus
        var peakDegs = [0, 0, 4, 7];
        var peakDeg  = peakDegs[_sectionLevel] || 0;
        var peakVel  = Math.min(0.90, vel * 0.75 * (_sessionPhase === 1 ? 0.55 : 1.0));
        Sound.play(p.voice, t, Harmony.freq(peakDeg, p.octave || -1), peakVel, p.decay || 0.8);
        _noteCount++;
      }

      // Trigger call & response after peaks in verse+ sections
      if (vel > 0.35 && _sessionPhase >= 1 && _sectionLevel >= 1) {
        _triggerCallResponse(magnitude, now);
      }
    } catch(e) { _errorCount++; }
  }


  // ── CALL & RESPONSE ───────────────────────────────────────────────────
  // After a peak, the harmony "answers" — a delayed melodic response.
  // Answer notes come from the current section's harmonic material.

  function _triggerCallResponse(mag, now) {
    if (_crCooldown > now || _answerPending) return;

    var sp  = (_lastBpm > 0) ? (60000 / _lastBpm / 2) : 400;
    var sec = SECTION_DEFS[_sectionLevel];
    var hm  = sec.harm;

    _answerNotes = [
      { deg: hm[0] || 4,                    delayMs: 0,      vel: 0.28 },
      { deg: hm[1] || 2,                    delayMs: sp,     vel: 0.22 },
      { deg: hm[hm.length - 1] || 0,        delayMs: sp * 2, vel: 0.34 },
    ];

    _answerTime    = now + sp * (2 + _sectionLevel);
    _answerIdx     = 0;
    _answerPending = true;
    _crCooldown    = now + 7000 + Math.random() * 3000;
  }

  function _processAnswer(now) {
    if (!_answerPending || !Sound.ctx || _isSilent) return;
    if (now < _answerTime) return;

    if (_answerIdx < _answerNotes.length) {
      var note = _answerNotes[_answerIdx];
      if (now >= _answerTime + note.delayMs) {
        var h = _lens.palette.harmonic;
        try {
          Sound.play(h.voice, Sound.currentTime,
            Harmony.freq(note.deg, h.octave || 0),
            note.vel * _fadeGain, h.decay || 1.8);
        } catch(e) {}
        _answerIdx++;
      }
    } else {
      _answerPending = false;
    }
  }


  // ── PRODIGY (mix intelligence) ────────────────────────────────────────
  // Rolling energy window → arc detection → reverb + dynamic range decisions.

  function _updateProdigy(dt) {
    if (_isSilent) return;
    var energy = Body.energy;

    _prodigy.sampleTimer += dt;
    if (_prodigy.sampleTimer >= 0.25) {
      _prodigy.sampleTimer = 0;
      _prodigy.energyHistory[_prodigy.energyHead] = energy;
      _prodigy.energyHead = (_prodigy.energyHead + 1) & 15;
    }

    var recent4 = 0, older4 = 0;
    for (var j = 0; j < 4; j++) {
      recent4 += _prodigy.energyHistory[(_prodigy.energyHead - 1 - j + 16) & 15];
      older4  += _prodigy.energyHistory[(_prodigy.energyHead - 5 - j + 16) & 15];
    }
    var diff = recent4 / 4 - older4 / 4;
    if (diff > 1.5)       _prodigy.arc = 'rising';
    else if (diff < -1.5) _prodigy.arc = 'falling';
    else                  _prodigy.arc = 'neutral';

    var volatility = 0;
    for (var m = 1; m < 8; m++) {
      var e1 = _prodigy.energyHistory[(_prodigy.energyHead - m     + 16) & 15];
      var e2 = _prodigy.energyHistory[(_prodigy.energyHead - m - 1 + 16) & 15];
      volatility += Math.abs(e1 - e2);
    }
    volatility /= 7;
    if (volatility > 3) {
      _prodigy.dynamicRange += (0.7 - _prodigy.dynamicRange) * 1.0 * dt;
    } else {
      _prodigy.dynamicRange += (1.0 - _prodigy.dynamicRange) * 0.5 * dt;
    }
  }


  // ── APPLY LENS ────────────────────────────────────────────────────────

  function _applyLens(styleId) {
    _styleId = styleId || 'lofi';
    _lens    = STYLE_LENS[_styleId] || STYLE_LENS.lofi;

    // Style speed factor: scales motif intervals so each genre feels right
    var ni = (_lens.response && _lens.response.noteInterval) || 400;
    _styleSpeedFactor = ni / 400;

    try { Sound.configure(_lens); } catch(e) { _errorCount++; }
    var reverbMix = (_lens.space && _lens.space.reverbMix) || 0.35;
    if (typeof Environ !== 'undefined' && Environ.reverbDepth) {
      reverbMix = Math.max(reverbMix, Environ.reverbDepth * 0.8);
    }
    try { Sound.setReverbMix(reverbMix); } catch(e) {}

    var style  = typeof Styles !== 'undefined' ? Styles.get(_styleId) : null;
    var mode   = (typeof Environ !== 'undefined') ? Environ.mode : 'minor';
    if (style && style.modeHint && style.modeHint.length > 0) {
      if (style.modeHint.indexOf(mode) === -1) mode = style.modeHint[0];
    }
    var key    = (typeof Environ !== 'undefined') ? (Environ.key || 0) : 0;
    var rootHz = 261.626 * Math.pow(2, key / 12);
    try { Harmony.configure({ root: rootHz, mode: mode }); } catch(e) { _errorCount++; }

    var profile = (_lens.rhythm && _lens.rhythm.kit) || 'acoustic';
    var bpm     = (typeof Environ !== 'undefined') ? Environ.bpm : 88;
    if (style && style.bpmRange) {
      bpm = Math.max(style.bpmRange[0], Math.min(style.bpmRange[1], bpm));
      _lastBpm = bpm;
    }
    try {
      Rhythm.configure({ mode: 'organic', bpm: bpm, profile: profile });
    } catch(e) { _errorCount++; }

    try {
      Rhythm.setCallback(function (time, velocity, instrument, kit) {
        if (_isSilent || !Sound.ctx) return;
        try { Sound.playDrum(instrument, time, velocity, kit); } catch(e) {}
      });
    } catch(e) { _errorCount++; }
  }


  // ── PUBLIC API ────────────────────────────────────────────────────────

  function init(ctx, styleId) {
    Body.init();
    Sound.init(ctx);
    Harmony.init();
    Rhythm.init();

    _active  = false;
    _styleId = styleId || 'lofi';

    _applyLens(_styleId);

    // Full state reset
    _isSilent           = true;
    _fadeGain           = 0;
    _stillnessTimer     = 0;
    _sessionPhase       = 0;
    _sessionEngagedTime = 0;
    _phraseActive       = false;
    _phraseIntensityFactor = 1.0;
    _sectionLevel       = 0;
    _sectionSmoothed    = 0;
    _transitionTarget   = -1;
    _holdTimer          = 0;
    _holdTarget         = 0;
    _barProgress        = 0;
    _melStep  = 0; _melClock  = 0;
    _harmStep = 0; _harmClock = 0;
    _bassStep = 0; _bassClock = 0;
    _noteCount     = 0;
    _errorCount    = 0;
    _touchDuck     = 1.0;
    _answerPending = false;
    _crCooldown    = 0;
    _lastT         = performance.now();
    _active        = true;
  }

  function applyStyle(styleId) {
    if (!_active) return;
    _applyLens(styleId);
    _isSilent         = true;
    _fadeGain         = 0;
    _stillnessTimer   = 0;
    _phraseActive     = false;
    _sectionLevel     = 0;
    _sectionSmoothed  = 0;
    _transitionTarget = -1;
    _melStep  = 0; _melClock  = 0;
    _harmStep = 0; _harmClock = 0;
    _bassStep = 0; _bassClock = 0;
    _answerPending    = false;
  }

  function update(sensor, ts) {
    if (!_active || !_lens || !Sound.ctx) return;

    var now = ts;
    var dt  = Math.min(0.05, (ts - _lastT) / 1000);
    _lastT  = ts;

    // 1. Body — Kalman filter, neurons, peaks, rhythm detection
    Body.process(sensor, ts);

    // 2. Silence / presence gate
    _updateSilence(dt, now);

    // 3. Master gain
    if (_isSilent && _fadeGain < 0.005) {
      try { Sound.setMasterGain(0.001); } catch(e) {}
    } else {
      var drumFloor     = (typeof Rhythm !== 'undefined' && Rhythm.drumPresence)
        ? Rhythm.drumPresence * 0.35 : 0;
      var effectiveGain = Math.max(_fadeGain, drumFloor);
      try { Sound.setMasterGain(0.50 * effectiveGain * _touchDuck * _prodigy.dynamicRange); }
      catch(e) {}
    }
    _touchDuck = Math.min(1.0, _touchDuck + dt * 2.0);

    if (_isSilent && _fadeGain < 0.005) return;

    // 4. Phrase arc tracking
    _updatePhrase(Body.energy, now, dt);

    // 5. Peaks → accent note + call & response trigger
    if (Body.peaked) _onPeak(Body.peakMagnitude, now);

    // 6. Conductor gesture → section level target
    var gesture  = _readGesture(sensor, dt);
    _lastGesture = gesture;
    _updateSectionLevel(gesture);

    // 7. Bar clock → musical section transitions
    _updateBarClock(dt);

    // 8. Section motif playback — THE INSTRUMENT
    //    Music plays itself. Conductor shapes which section is alive.
    _updateMotifPlayback(now, dt);

    // 9. Call & response playback
    _processAnswer(now);

    // 10. Prodigy — mix intelligence
    _updateProdigy(dt);

    // 11. Harmonic rhythm + gravity + motif cooldown
    try { Harmony.updateHarmonicRhythm(dt, _prodigy.arc, Body.energy); } catch(e) {}
    try { Harmony.updateHarmonicGravity(dt, Body.energy, _isSilent); } catch(e) {}
    try { Harmony.updateMotifCooldown(dt); } catch(e) {}

    // 12. Euclidean drums (earned over 30-90s as body proves rhythm lock)
    if (!_isSilent && typeof Rhythm !== 'undefined') {
      try {
        Rhythm.update(dt, {
          energy:           Body.energy,
          tempo:            Body.bodyTempo || _lastBpm,
          tempoLocked:      Body.rhythmConfidence > 0.22,
          rhythmConfidence: Body.rhythmConfidence || 0,
          lockStrength:     Body.rhythmConfidence || 0,
          isSilent:         _isSilent,
          peaked:           Body.peaked,
          peakMag:          Body.peakMagnitude,
          audioTime:        Sound.currentTime,
        });
      } catch(e) { _errorCount++; }
    }

    // 13. Spatial — gamma drives stereo panner, touch overrides
    try { Sound.updateSpatial(sensor.gamma || 0, _isSilent, sensor.touching || false); } catch(e) {}
    if (sensor.touching && typeof sensor.tx === 'number') {
      try { Sound.setTouchPan(sensor.tx); } catch(e) {}
      _touchDuck = Math.max(0.65, _touchDuck - dt * 3.0);
    }
  }

  function refresh() {
    if (_active && _lens) _applyLens(_styleId);
  }

  // Touch note: plays chord tones appropriate to current section
  function touch(normX, normY, vx, vy) {
    if (!_active || !_lens || !Sound.ctx || _isSilent) return;
    var sec       = SECTION_DEFS[_sectionLevel];
    var pool      = sec.harm.length > 0 ? sec.harm : [0, 2, 4, 7];
    var idx       = Math.floor((1 - normY) * pool.length);
    var deg       = pool[Math.max(0, Math.min(pool.length - 1, idx))];
    var spd       = Math.sqrt(vx * vx + vy * vy);
    var vel       = Math.min(0.75, 0.28 + spd * 0.08);
    var cont      = _lens.palette.continuous;
    try {
      Sound.play(cont.voice, Sound.currentTime,
        Harmony.freq(deg, cont.octave || 0), vel, 0.7);
      _noteCount++;
    } catch(e) { _errorCount++; }
  }

  return Object.freeze({
    init:             init,
    applyStyle:       applyStyle,
    update:           update,
    refresh:          refresh,
    touch:            touch,
    get silent()           { return _isSilent; },
    get phase()            { return _sessionPhase; },
    get section()          { return _sectionLevel; },
    get sectionName()      { return SECTION_DEFS[_sectionLevel].name; },
    get sectionSmoothed()  { return _sectionSmoothed; },
    get errors()           { return _errorCount; },
    get notes()            { return _noteCount; },
    get styleId()          { return _styleId; },
  });

})();
