/**
 * SCORE — The Conductor
 *
 * All musical intelligence lives here. Musical clock, harmonic engine,
 * scene manager, 7 behaviors (Drone, Pulse, Walker, Melodist,
 * Accompanist, Responder, Texturer), and dynamics.
 *
 * Audio.js is the orchestra. This file tells it what to play.
 */

const Score = (function () {
  'use strict';

  // ── MUSIC THEORY ───────────────────────────────────────────────────────

  const MODES = {
    major:              [0,2,4,5,7,9,11,12,14,16,17,19,21,23,24],
    dorian:             [0,2,3,5,7,9,10,12,14,15,17,19,21,22,24],
    'pentatonic-major': [0,2,4,7,9,12,14,16,19,21,24],
    'whole-tone':       [0,2,4,6,8,10,12,14,16,18,20,22,24],
    blues:              [0,3,5,6,7,10,12,15,17,18,19,22,24],
    chromatic:          [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24],
    mixolydian:         [0,2,4,5,7,9,10,12,14,16,17,19,21,22,24],
    phrygian:           [0,1,3,5,7,8,10,12,13,15,17,19,20,22,24],
  };

  let scale = MODES.major;

  function semi2freq(root, semi) {
    return root * Math.pow(2, semi / 12);
  }

  function scaleNote(index) {
    if (scale.length === 0) return index;
    var len = scale.length;
    var oct = Math.floor(index / len);
    var deg = index % len;
    if (deg < 0) deg += len;
    return scale[deg] + oct * 12;
  }

  function noteFreq(degree, octave) {
    return semi2freq(harmony.root, scaleNote(degree) + harmony.rootOffset + harmony.chordOffset + (octave || 0) * 12);
  }

  // Returns chord tones at current harmony position
  function chordTone(index) {
    var tones = [0, 2, 4, 6]; // root, 3rd, 5th, 7th in scale degrees
    var deg = tones[index % tones.length];
    return scaleNote(deg) + harmony.rootOffset + harmony.chordOffset;
  }

  // ── STATE ──────────────────────────────────────────────────────────────

  let lens = null;
  let ready = false;
  let _energy = 0;
  let _filterFreq = 2000;
  let _touchResonance = 0;
  let _tension = 0;
  let _masterLevel = 0.8;

  // ── STAGES (preserved from voice.js) ───────────────────────────────────

  const STAGES = [
    { name: 'EMERGING',     threshold: 0,   bpmBoost: 0,  shift: 0 },
    { name: 'FLOWING',      threshold: 100, bpmBoost: 3,  shift: 7 },
    { name: 'SURGING',      threshold: 400, bpmBoost: 8,  shift: 14 },
    { name: 'TRANSCENDENT', threshold: 800, bpmBoost: 12, shift: 19 },
  ];
  let stageIndex = 0;

  // ── MUSICAL CLOCK ──────────────────────────────────────────────────────

  const clock = {
    tempo: 80,
    feel: 'straight',
    beat: 0,           // 0-3 within current bar
    totalBeats: 0,     // total beats elapsed
    bar: 0,            // 0-(phraseLen-1) within current phrase
    totalBars: 0,
    phrase: 0,         // total phrases elapsed
    phraseLen: 4,      // bars per phrase
    nextBeatTime: 0,
    beatFrac: 0,       // 0-1 fractional position within beat
  };

  // Events: arrays of callbacks
  var _onBeat = [];
  var _onBar = [];
  var _onPhrase = [];

  function updateClock() {
    var now = Audio.ctx.currentTime;
    var beatDur = 60 / clock.tempo;

    if (clock.nextBeatTime === 0) clock.nextBeatTime = now + beatDur;

    // Fractional position within current beat
    clock.beatFrac = Math.max(0, Math.min(1, 1 - (clock.nextBeatTime - now) / beatDur));

    while (clock.nextBeatTime <= now + 0.02) {
      clock.totalBeats++;
      clock.beat = clock.totalBeats % 4;

      // Fire beat callbacks
      for (var i = 0; i < _onBeat.length; i++) _onBeat[i](clock);

      if (clock.beat === 0) {
        // New bar
        clock.totalBars++;
        clock.bar = clock.totalBars % clock.phraseLen;

        for (var i = 0; i < _onBar.length; i++) _onBar[i](clock);

        if (clock.bar === 0 && clock.totalBars > 0) {
          // New phrase
          clock.phrase++;
          for (var i = 0; i < _onPhrase.length; i++) _onPhrase[i](clock);

          // Check for pending scene change
          if (pendingScene !== null) {
            executeSceneChange(pendingScene);
            pendingScene = null;
          }
        }
      }

      clock.nextBeatTime += beatDur;
    }
  }

  // ── HARMONY ENGINE ─────────────────────────────────────────────────────

  const harmony = {
    root: 432,
    mode: 'major',
    progression: [0],
    chordIndex: 0,
    chordOffset: 0,
    chordBars: 4,
    rootOffset: 0,
    nextChordTime: 0,
  };

  function updateHarmony() {
    if (!Audio.ctx || !lens) return;
    var now = Audio.ctx.currentTime;
    var barDur = (60 / clock.tempo) * 4;

    if (harmony.nextChordTime === 0) harmony.nextChordTime = now + barDur * harmony.chordBars;
    if (now < harmony.nextChordTime) return;

    harmony.chordIndex = (harmony.chordIndex + 1) % harmony.progression.length;
    harmony.chordOffset = harmony.progression[harmony.chordIndex];
    harmony.nextChordTime = now + barDur * harmony.chordBars;

    // Notify behaviors of chord change
    if (drone.active) drone.updateChord();
  }

  // ── SCENE MANAGER ──────────────────────────────────────────────────────

  const SCENE_ORDER = ['stillness', 'gentle', 'flowing', 'surging', 'transcendent'];
  let currentScene = 'stillness';
  let pendingScene = null;

  function determineScene(brain) {
    if (brain.voidDepth > 0.3) return 'void';
    var stage = STAGES[stageIndex].name;
    var pattern = brain.pattern || 'still';

    if (stage === 'TRANSCENDENT') return 'transcendent';
    if (stage === 'SURGING' || pattern === 'vigorous' || pattern === 'chaotic') return 'surging';
    if (stage === 'FLOWING' || pattern === 'rhythmic') return 'flowing';
    if (pattern === 'gentle' || pattern === 'still' && stageIndex >= 1) return 'gentle';
    return 'stillness';
  }

  function isUnlocked(unlockAt) {
    if (!unlockAt || unlockAt === 'always' || unlockAt === 'stillness') return true;
    var ui = SCENE_ORDER.indexOf(unlockAt);
    var ci = SCENE_ORDER.indexOf(currentScene);
    if (ci < 0) return currentScene === 'void'; // void scene: only 'always' behaviors
    return ci >= ui;
  }

  function updateScene(brain) {
    var target = determineScene(brain);
    if (target !== currentScene && target !== pendingScene) {
      pendingScene = target;
    }
  }

  function executeSceneChange(newScene) {
    var oldScene = currentScene;
    currentScene = newScene;

    // Activate/deactivate behaviors based on unlock conditions
    var allBehaviors = [drone, pulse, walker, melodist, accompanist, responder, texturer];
    for (var i = 0; i < allBehaviors.length; i++) {
      var b = allBehaviors[i];
      if (!b.config) continue;
      var shouldBeActive = isUnlocked(b.config.unlockAt);
      if (shouldBeActive && !b.active) {
        b.enter();
      } else if (!shouldBeActive && b.active) {
        b.exit();
      }
    }
  }

  // ── BEHAVIOR: DRONE ────────────────────────────────────────────────────
  // Continuous harmonic foundation. Manages all harmonic voices.

  var drone = {
    active: false,
    config: null,
    voices: [], // layer names

    init: function (cfg) {
      this.config = cfg;
      this.voices = [];
    },

    enter: function () {
      if (!this.config) return;
      this.active = true;
      var cfg = this.config;
      var voices = cfg.voices || [];
      var root = semi2freq(harmony.root, harmony.rootOffset + harmony.chordOffset);

      for (var vi = 0; vi < voices.length; vi++) {
        var v = voices[vi];
        var layerName = 'drone-' + vi;
        var baseFreq = root * Math.pow(2, v.octave || 0);
        var chord = v.chord || [0, 7, 12];
        var voiceCount = v.voiceCount || 2;
        var detune = v.detune || 8;

        var oscs = [];
        for (var c = 0; c < chord.length; c++) {
          var chordFreq = baseFreq * Math.pow(2, chord[c] / 12);
          for (var d = 0; d < voiceCount; d++) {
            var detuneVal = voiceCount > 1 ? detune * (2 * d / (voiceCount - 1) - 1) : 0;
            oscs.push({
              wave: v.wave || 'sawtooth',
              freq: chordFreq,
              detune: detuneVal,
              gain: 0.15 / (chord.length * voiceCount / 2),
            });
          }
        }

        var layerCfg = {
          oscillators: oscs,
          gain: 0,
          reverbSend: 0.3,
        };

        if (v.filter) {
          layerCfg.filter = { type: 'lowpass', freq: v.filter, Q: 0.7 };
        }

        if (v.vibrato) {
          layerCfg.vibrato = v.vibrato;
        }

        // Formant voices (choir-like)
        if (v.formants) {
          layerCfg.formants = v.formants;
          layerCfg.formantMorph = v.formantMorph || null;
          delete layerCfg.filter;
        }

        Audio.layer.build(layerName, layerCfg);
        this.voices.push(layerName);
      }
    },

    exit: function () {
      this.active = false;
      for (var i = 0; i < this.voices.length; i++) {
        // Fade out over 2 seconds before destroying
        Audio.layer.setGain(this.voices[i], 0, 0.5);
      }
      var names = this.voices.slice();
      this.voices = [];
      // Delayed cleanup
      setTimeout(function () {
        for (var i = 0; i < names.length; i++) Audio.layer.destroy(names[i]);
      }, 2500);
    },

    update: function (dt) {
      if (!this.active || !this.config) return;
      var cfg = this.config;
      var vol = cfg.vol || 0.15;

      // Breathing — golden-ratio LFO
      var breathRate = cfg.breathRate || 0.12;
      var t = Audio.ctx.currentTime;
      var breath1 = Math.sin(t * breathRate * Math.PI * 2);
      var breath2 = Math.sin(t * breathRate * 0.618 * Math.PI * 2);
      var pb = 0.65 + 0.25 * breath1 + 0.1 * breath2;

      // Phrase-aware dynamics: slight swell at phrase start
      var phraseFrac = (clock.bar + clock.beatFrac / 4) / clock.phraseLen;
      var phraseDyn = 1 + 0.08 * Math.sin(phraseFrac * Math.PI); // peaks mid-phrase

      for (var i = 0; i < this.voices.length; i++) {
        Audio.layer.setGain(this.voices[i], vol * pb * phraseDyn, 0.05);
      }
    },

    updateChord: function () {
      if (!this.active || !this.config) return;
      var root = semi2freq(harmony.root, harmony.rootOffset + harmony.chordOffset);
      var voices = this.config.voices || [];

      for (var vi = 0; vi < this.voices.length && vi < voices.length; vi++) {
        var v = voices[vi];
        var baseFreq = root * Math.pow(2, v.octave || 0);
        var chord = v.chord || [0, 7, 12];
        var voiceCount = v.voiceCount || 2;

        var freqs = [];
        for (var c = 0; c < chord.length; c++) {
          var chordFreq = baseFreq * Math.pow(2, chord[c] / 12);
          for (var d = 0; d < voiceCount; d++) {
            freqs.push(chordFreq);
          }
        }
        Audio.layer.setFreqs(this.voices[vi], freqs, 0.5);
      }
    },

    // Tilt expression: modulate filter
    applyFilter: function (freq) {
      if (!this.active) return;
      for (var i = 0; i < this.voices.length; i++) {
        Audio.layer.setFilter(this.voices[i], freq, 0.08);
      }
    },

    dispose: function () { this.exit(); },
  };

  // ── BEHAVIOR: PULSE ────────────────────────────────────────────────────
  // Phrase-aware drum sequencer.

  var pulse = {
    active: false,
    config: null,
    step: 0,
    nextStepTime: 0,

    init: function (cfg) { this.config = cfg; this.step = 0; this.nextStepTime = 0; },

    enter: function () {
      this.active = true;
      this.step = 0;
      this.nextStepTime = 0;
    },

    exit: function () { this.active = false; },

    update: function (dt) {
      if (!this.active || !this.config || !Audio.ctx) return;
      var cfg = this.config;
      var kit = cfg.kit || 'acoustic';

      // Get pattern for current scene
      var patterns = cfg.patterns || {};
      var pat = patterns[currentScene];
      if (!pat) return;

      var now = Audio.ctx.currentTime;
      var stepDur = (60 / clock.tempo) / 4; // 16th notes

      if (this.nextStepTime === 0) this.nextStepTime = now;
      if (now < this.nextStepTime - 0.05) return;

      while (this.nextStepTime <= now + 0.05) {
        var step = this.step % 16;

        // Swing/shuffle timing
        var swingOff = 0;
        var feel = clock.feel;
        if ((feel === 'swing' || feel === 'shuffle') && step % 2 === 1) {
          swingOff = stepDur * (feel === 'shuffle' ? 0.25 : 0.18);
        }

        var t = this.nextStepTime + swingOff;

        // Phrase-aware accents
        var phraseStep = (clock.bar * 16 + step); // position within phrase
        var isDownbeat = (step === 0 && clock.bar === 0);
        var isLastBar = (clock.bar === clock.phraseLen - 1);

        // Play drum hits with humanization
        if (pat.kick && pat.kick[step] > 0) {
          var v = Audio.hVel(pat.kick[step]);
          if (isDownbeat) v = Math.min(1, v * 1.2); // accent phrase start
          Audio.drum.kick(Audio.hTime(t), v, kit);
        }
        if (pat.snare && pat.snare[step] > 0)
          Audio.drum.snare(Audio.hTime(t), Audio.hVel(pat.snare[step]), kit);
        if (pat.hat && pat.hat[step] > 0)
          Audio.drum.hat(Audio.hTime(t), Audio.hVel(pat.hat[step]), kit);
        if (pat.ride && pat.ride[step] > 0)
          Audio.drum.ride(Audio.hTime(t), Audio.hVel(pat.ride[step]));
        if (pat.timpani && pat.timpani[step] > 0)
          Audio.drum.timpani(Audio.hTime(t), Audio.hVel(pat.timpani[step]));

        // Drum fill on last bar of phrase (if configured)
        if (isLastBar && step === 12 && cfg.fills && cfg.fills.length > 0) {
          var fill = cfg.fills[Math.floor(Math.random() * cfg.fills.length)];
          playFill(t, fill, kit, stepDur);
        }

        this.step++;
        this.nextStepTime += stepDur;
      }
    },

    dispose: function () { this.active = false; },
  };

  function playFill(time, fill, kit, stepDur) {
    if (!fill) return;
    var steps = Math.floor((fill.bars || 0.5) * 4);
    if (fill.type === 'ride-roll') {
      for (var i = 0; i < steps; i++) {
        Audio.drum.ride(time + i * stepDur * 0.5, 0.3 + i * 0.05);
      }
    } else if (fill.type === 'kick-accent') {
      Audio.drum.kick(time, 0.9, kit);
      Audio.drum.snare(time + stepDur, 0.7, kit);
    } else if (fill.type === 'snare-roll') {
      for (var i = 0; i < steps; i++) {
        Audio.drum.snare(time + i * stepDur * 0.5, 0.3 + i * 0.08, kit);
      }
    }
  }

  // ── BEHAVIOR: WALKER ───────────────────────────────────────────────────
  // Walking/melodic bass. Harmonic-aware.

  var walker = {
    active: false,
    config: null,
    step: 0,
    nextStepTime: 0,
    walkDeg: 0,
    restBars: 0,

    init: function (cfg) {
      this.config = cfg;
      this.step = 0;
      this.nextStepTime = 0;
      this.walkDeg = 0;
      this.restBars = 0;
    },

    enter: function () {
      this.active = true;
      this.step = 0;
      this.nextStepTime = 0;
      this.walkDeg = 0;
    },

    exit: function () { this.active = false; },

    update: function (dt) {
      if (!this.active || !this.config || !Audio.ctx) return;
      var cfg = this.config;
      var now = Audio.ctx.currentTime;
      var beatDur = 60 / clock.tempo;

      if (this.nextStepTime === 0) this.nextStepTime = now;
      if (now < this.nextStepTime - 0.05) return;

      while (this.nextStepTime <= now + 0.05) {
        var beat = this.step % 4;

        // Rest at phrase boundaries (breathing space)
        if (beat === 0 && clock.bar === 0 && this.step > 0) {
          this.restBars = 1; // rest for 1 bar at phrase boundary
        }
        if (this.restBars > 0) {
          if (beat === 0) this.restBars--;
          this.step++;
          this.nextStepTime += beatDur;
          continue;
        }

        var vol = cfg.vol || 0.28;
        var semi;

        if (cfg.style === 'walking') {
          // Walking bass: root → 3rd → 5th → approach
          if (beat === 0) {
            semi = chordTone(0) - 12; // root, bass register
            vol *= 1.0;
          } else if (beat === 1) {
            semi = chordTone(1) - 12; // 3rd
            vol *= 0.8;
          } else if (beat === 2) {
            semi = chordTone(2) - 12; // 5th
            vol *= 0.75;
          } else {
            // Beat 4: chromatic approach to next root
            var nextRoot = chordTone(0) - 12;
            semi = nextRoot - 1; // half step below
            vol *= 0.7;
          }
        } else {
          // Arpeggio style
          semi = chordTone(this.step % 4) - 12;
          vol *= (beat === 0 ? 1.0 : 0.75);
        }

        var freq = semi2freq(harmony.root, semi);

        // Swing timing
        var swingOff = 0;
        if ((clock.feel === 'swing' || clock.feel === 'shuffle') && beat % 2 === 1) {
          swingOff = beatDur * 0.15;
        }

        // Use voice type from config
        var voice = cfg.voice || 'upright';
        if (voice === 'upright') {
          Audio.synth.upright(this.nextStepTime + swingOff, freq, vol);
        } else if (voice === '808' || voice === 'sub808') {
          Audio.synth.sub808(this.nextStepTime + swingOff, freq, vol);
        } else {
          Audio.synth.play(voice, this.nextStepTime + swingOff, freq, vol, 0.5);
        }

        this.step++;
        this.nextStepTime += beatDur;
      }
    },

    dispose: function () { this.active = false; },
  };

  // ── BEHAVIOR: MELODIST ─────────────────────────────────────────────────
  // Phrase-aware melody with arcs and rests.

  var melodist = {
    active: false,
    config: null,
    pos: 0,
    nextTime: 0,
    speaking: true,      // whether currently in a phrase (vs resting)
    phraseNotes: 0,      // notes played in current phrase
    restCountdown: 0,    // bars of rest remaining

    init: function (cfg) {
      this.config = cfg;
      this.pos = 0;
      this.nextTime = 0;
      this.speaking = true;
      this.phraseNotes = 0;
      this.restCountdown = 0;
    },

    enter: function () {
      this.active = true;
      this.pos = 0;
      this.nextTime = 0;
      this.speaking = true;
      this.phraseNotes = 0;
      this.restCountdown = 0;
    },

    exit: function () { this.active = false; },

    update: function (dt) {
      if (!this.active || !this.config || !Audio.ctx) return;
      var cfg = this.config;
      var motif = cfg.motif;
      if (!motif || motif.length === 0) return;

      var now = Audio.ctx.currentTime;
      var beatDur = 60 / clock.tempo;
      var noteDur = cfg.noteDur || 1;
      var stepDur = beatDur * noteDur;

      if (this.nextTime === 0) this.nextTime = now + beatDur * 2;
      if (now < this.nextTime - 0.05) return;

      while (this.nextTime <= now + 0.05) {
        // Rest period check
        if (this.restCountdown > 0) {
          // Count down rest in beats
          this.restCountdown -= noteDur;
          this.nextTime += stepDur;
          continue;
        }

        var idx = this.pos % motif.length;
        var deg = motif[idx];

        // End of motif cycle: enter rest period
        if (idx === 0 && this.pos > 0) {
          var restBars = cfg.restAfterPhrase || 0;
          if (restBars > 0) {
            this.restCountdown = restBars * 4; // rest in beats
            this.speaking = false;
            this.phraseNotes = 0;
            this.pos++;
            this.nextTime += stepDur;
            continue;
          }
        }

        if (this.restCountdown <= 0) this.speaking = true;

        if (deg !== -1) {
          var octave = cfg.octave || 0;
          var semi = scaleNote(deg) + harmony.rootOffset + harmony.chordOffset + octave * 12;
          var freq = semi2freq(harmony.root, semi);
          var decay = (cfg.decay || 1.2) * 0.6;
          var vel = cfg.vel || 0.2;

          // Living melody: energy shapes phrase density
          if (_energy < 0.15 && Math.random() > 0.55) {
            deg = -1; // skip — breathe
          }
          if (_energy > 0.5) vel *= 1 + (_energy - 0.5) * 0.6;

          // Accent after silence (phrase beginnings)
          if (idx > 0 && motif[idx - 1] === -1) vel *= 1.25;
          else if (idx === 0 && motif[motif.length - 1] === -1) vel *= 1.25;

          // Swing timing
          var swingOff = 0;
          if ((clock.feel === 'swing' || clock.feel === 'shuffle') && this.pos % 2 === 1) {
            swingOff = stepDur * (clock.feel === 'shuffle' ? 0.25 : 0.18);
          }

          if (deg !== -1) {
            var voice = cfg.voice || 'simple';
            var opts = cfg.synthOpts || null;
            Audio.synth.play(voice, this.nextTime + swingOff, freq, vel, decay, opts);
            this.phraseNotes++;

            // Transcendent: occasional octave doubling
            if (STAGES[stageIndex].name === 'TRANSCENDENT' && Math.random() > 0.65) {
              Audio.synth.play(voice, this.nextTime + swingOff + 0.015, freq * 2, vel * 0.3, decay * 0.6, opts);
            }

            // Jazz chord voicing: 3rd + 7th shell
            if (cfg.chordVoicing && deg >= 0) {
              var thirdSemi = scaleNote(deg + 2) + harmony.rootOffset + harmony.chordOffset + octave * 12;
              Audio.synth.play(voice, this.nextTime + swingOff + 0.008, semi2freq(harmony.root, thirdSemi), vel * 0.55, decay, opts);
              var sevSemi = scaleNote(deg + 6) + harmony.rootOffset + harmony.chordOffset + octave * 12;
              Audio.synth.play(voice, this.nextTime + swingOff + 0.012, semi2freq(harmony.root, sevSemi), vel * 0.4, decay, opts);
            }
          }
        }

        this.pos++;
        this.nextTime += stepDur;
      }
    },

    dispose: function () { this.active = false; },
  };

  // ── BEHAVIOR: ACCOMPANIST ──────────────────────────────────────────────
  // Harmonic support: arpeggios, comping. Listens to melodist.

  var accompanist = {
    active: false,
    config: null,
    step: 0,
    nextTime: 0,
    arpIndex: 0,

    init: function (cfg) { this.config = cfg; this.step = 0; this.nextTime = 0; this.arpIndex = 0; },
    enter: function () { this.active = true; this.step = 0; this.nextTime = 0; },
    exit: function () { this.active = false; },

    update: function (dt) {
      if (!this.active || !this.config || !Audio.ctx) return;
      var cfg = this.config;
      var now = Audio.ctx.currentTime;
      var beatDur = 60 / clock.tempo;
      var stepDur = beatDur / 4; // 16th notes

      if (this.nextTime === 0) this.nextTime = now;
      if (now < this.nextTime - 0.05) return;

      while (this.nextTime <= now + 0.05) {
        var step = this.step % 16;

        // Listen to melodist: simplify when melody speaks
        var density = 1.0;
        if (melodist.active && melodist.speaking) {
          density = 0.3; // sparse when melody is talking
        }

        // Arpeggio pattern
        var chord = cfg.chord || [0, 4, 7, 12];
        var pattern = cfg.pattern || [1, 0, 0.5, 0, 1, 0, 0.5, 0, 1, 0, 0.5, 0, 1, 0, 0.5, 0];
        var vel = (pattern[step] || 0) * density;

        if (vel > 0.05 && Math.random() < (cfg.density || 0.6)) {
          var semi = chord[this.arpIndex % chord.length] + harmony.rootOffset + harmony.chordOffset;
          var freq = semi2freq(harmony.root, semi);
          var voice = cfg.voice || 'epiano';
          var decay = cfg.decay || 0.8;

          // Swing
          var swingOff = 0;
          if ((clock.feel === 'swing' || clock.feel === 'shuffle') && step % 2 === 1) {
            swingOff = stepDur * 0.15;
          }

          Audio.synth.play(voice, this.nextTime + swingOff, freq, vel * (cfg.vol || 0.15), decay);
          this.arpIndex++;
        }

        this.step++;
        this.nextTime += stepDur;
      }
    },

    dispose: function () { this.active = false; },
  };

  // ── BEHAVIOR: RESPONDER ────────────────────────────────────────────────
  // Touch/gesture reaction. Context-aware.

  var responder = {
    active: false,
    config: null,
    lastNoteTime: 0,
    lastGestureTime: 0,

    init: function (cfg) { this.config = cfg; this.lastNoteTime = 0; this.lastGestureTime = 0; },
    enter: function () { this.active = true; },
    exit: function () { this.active = false; },
    update: function (dt) { /* passive — responds to events */ },

    onTouch: function (tx, ty, vx, vy) {
      if (!this.active || !this.config || !Audio.ctx) return;
      var now = Audio.ctx.currentTime;
      if (now - this.lastNoteTime < 0.06) return;
      this.lastNoteTime = now;

      var cfg = this.config;
      var voice = cfg.voice || 'epiano';
      var decay = cfg.decay || 1.2;
      var speed = Math.sqrt(vx * vx + vy * vy);

      var degree = Math.floor(tx * scale.length);
      var octShift = Math.floor((1 - ty) * 3);
      var baseSemi = scaleNote(degree) + octShift * 12 + harmony.rootOffset + harmony.chordOffset;
      var freq = semi2freq(harmony.root, baseSemi);
      var vel = 0.2 + ty * 0.12;

      // Context-aware: stronger on downbeats
      if (clock.beat === 0) vel *= 1.2;

      if (speed > 1.5) {
        // FAST: scalar run
        var dir = vx > 0 ? 1 : -1;
        var count = Math.min(5, Math.floor(speed * 2));
        for (var i = 0; i < count; i++) {
          var runDeg = degree + dir * i;
          var runSemi = scaleNote(runDeg) + octShift * 12 + harmony.rootOffset + harmony.chordOffset;
          var runFreq = semi2freq(harmony.root, runSemi);
          Audio.synth.play(voice, now + i * 0.04, runFreq, vel * (1 - i * 0.12), decay * 0.4);
        }
        _touchResonance = Math.min(1, _touchResonance + 0.6);
      } else if (speed > 0.5) {
        // MEDIUM: grace note
        var graceFreq = semi2freq(harmony.root, baseSemi - (Math.random() > 0.5 ? 1 : 2));
        Audio.synth.play(voice, now, graceFreq, vel * 0.3, 0.1);
        Audio.synth.play(voice, now + 0.04, freq, vel, decay);
        _touchResonance = Math.min(1, _touchResonance + 0.4);
      } else {
        // SLOW: sustained note
        Audio.synth.play(voice, now, freq, vel, decay);
        _touchResonance = Math.min(1, _touchResonance + 0.3);
      }
    },

    onSpike: function (data) {
      if (!this.active || !Audio.ctx) return;
      var now = Audio.ctx.currentTime;
      if (now - this.lastGestureTime < 0.4) return;
      this.lastGestureTime = now;

      var n = data.neuron;
      var voice = (this.config && this.config.voice) || 'simple';

      if (n === 'shake') {
        // Flourish: 2-3 notes
        var count = Math.min(3, Math.ceil(data.rate || 1));
        var decay = (this.config && this.config.decay || 0.8) * 0.4;
        for (var i = 0; i < count; i++) {
          var deg = Math.floor(Math.random() * 5) + 2;
          var semi = scaleNote(deg + i) + harmony.rootOffset + harmony.chordOffset;
          var freq = semi2freq(harmony.root, semi);
          Audio.synth.play(voice, now + i * 0.12, freq, 0.08 * (1 - i * 0.2), decay);
        }
      } else if (n === 'sweep') {
        var semi = scaleNote(0) + harmony.rootOffset + harmony.chordOffset;
        Audio.synth.play(voice, now, semi2freq(harmony.root, semi), 0.08, 0.5);
      } else if (n === 'toss') {
        // Low thump
        var o = Audio.ctx.createOscillator(); o.type = 'sine';
        o.frequency.setValueAtTime(60, now);
        o.frequency.exponentialRampToValueAtTime(25, now + 0.3);
        var g = Audio.ctx.createGain();
        g.gain.setValueAtTime(Math.min(0.2, (data.magnitude || 1) * 0.06), now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        o.connect(g); g.connect(Audio.sidechain);
        o.start(now); o.stop(now + 0.6);
      }
    },

    dispose: function () { this.active = false; },
  };

  // ── BEHAVIOR: TEXTURER ─────────────────────────────────────────────────
  // Ambient textures: crackle, void drone.

  var texturer = {
    active: false,
    config: null,

    init: function (cfg) { this.config = cfg; },

    enter: function () {
      this.active = true;
      if (this.config && this.config.crackle) Audio.crackle.start();
    },

    exit: function () {
      this.active = false;
      Audio.crackle.stop();
      Audio.voidDrone.stop();
    },

    update: function (dt, voidDepth, breathPhase) {
      if (!this.active) return;
      if (this.config && this.config.voidDrone) {
        Audio.voidDrone.update(voidDepth, breathPhase);
      }
    },

    dispose: function () { this.exit(); },
  };

  // ── INIT ───────────────────────────────────────────────────────────────

  function init() {
    ready = true;
  }

  // ── APPLY LENS ─────────────────────────────────────────────────────────

  function applyLens(newLens) {
    lens = newLens;
    if (!lens) return;

    // Stop previous
    Audio.crackle.stop();
    Audio.voidDrone.stop();
    Audio.layer.destroyAll();

    // Harmony
    if (lens.harmony) {
      harmony.root = lens.harmony.root || 432;
      harmony.mode = lens.harmony.mode || 'major';
      scale = MODES[harmony.mode] || MODES.major;
      harmony.progression = lens.harmony.progression || [0];
      harmony.chordBars = lens.harmony.chordBars || 4;
      harmony.chordIndex = 0;
      harmony.chordOffset = 0;
      harmony.nextChordTime = 0;
    }

    // Rhythm
    if (lens.rhythm) {
      var bpm = lens.rhythm.bpm;
      clock.tempo = Array.isArray(bpm) ? bpm[0] : (bpm || 80);
      clock.feel = lens.rhythm.feel || 'straight';
    }

    // Stages
    if (lens.stages && lens.stages.thresholds) {
      var t = lens.stages.thresholds;
      if (t[0] !== undefined) STAGES[1].threshold = t[0];
      if (t[1] !== undefined) STAGES[2].threshold = t[1];
      if (t[2] !== undefined) STAGES[3].threshold = t[2];
    }

    // Phrase length
    clock.phraseLen = (lens.rhythm && lens.rhythm.phraseLen) || 4;

    // Reset clock
    clock.beat = 0;
    clock.totalBeats = 0;
    clock.bar = 0;
    clock.totalBars = 0;
    clock.phrase = 0;
    clock.nextBeatTime = 0;
    stageIndex = 0;
    harmony.rootOffset = 0;

    // Reset scene
    currentScene = 'stillness';
    pendingScene = null;

    // Initialize all behaviors from lens config
    var bh = lens.behaviors || {};

    drone.init(bh.drone || null);
    pulse.init(bh.pulse || null);
    walker.init(bh.walker || null);
    melodist.init(bh.melodist || null);
    accompanist.init(bh.accompanist || null);
    responder.init(bh.responder || null);
    texturer.init(bh.texturer || null);

    // Activate behaviors that should be active at stillness
    var allBehaviors = [drone, pulse, walker, melodist, accompanist, responder, texturer];
    for (var i = 0; i < allBehaviors.length; i++) {
      var b = allBehaviors[i];
      if (b.config && isUnlocked(b.config.unlockAt)) {
        b.enter();
      }
    }
  }

  // ── UPDATE (called every frame) ────────────────────────────────────────

  var _errors = 0;

  function update(brainState, sensorState, dt) {
    if (!ready || !lens || !Audio.ctx) return;

    // Auto-resume AudioContext
    if (Audio.ctx.state === 'suspended') {
      try { Audio.ctx.resume(); } catch (e) {}
    }

    var totalMotion = brainState.totalMotion || 0;
    var energy = brainState.energy || 0;
    var pattern = brainState.pattern || 'still';
    var voidDepth = brainState.voidDepth || 0;
    var tiltY = sensorState.beta || 0;

    _energy = energy;

    // ── EVOLUTION STAGE
    var newStage = 0;
    for (var i = STAGES.length - 1; i >= 0; i--) {
      if (totalMotion >= STAGES[i].threshold) { newStage = i; break; }
    }
    if (newStage !== stageIndex) {
      stageIndex = newStage;
      harmony.rootOffset = STAGES[newStage].shift;
      if (drone.active) drone.updateChord();
    }

    // ── TEMPO
    var bpmArr = (lens.rhythm && lens.rhythm.bpm) || [80];
    var baseBPM = Array.isArray(bpmArr) ? bpmArr[Math.min(newStage, bpmArr.length - 1)] : bpmArr;
    clock.tempo = baseBPM + STAGES[newStage].bpmBoost;

    // Context mods
    if (lens.context) {
      var cmod = lens.context[sensorState.timeOfDay];
      if (cmod && cmod.bpm_mod) clock.tempo += cmod.bpm_mod;
      var wmod = lens.context[sensorState.weather];
      if (wmod && wmod.reverb && Audio.reverbGainNode) {
        Audio.reverbGainNode.gain.value = Math.max(Audio.reverbGainNode.gain.value, wmod.reverb);
      }
    }

    // Delay follows tempo
    var delSync = (lens.space && lens.space.delay && lens.space.delay.sync) || 'dotted-eighth';
    Audio.updateDelaySync(clock.tempo, delSync);

    // ── CLOCK
    try { updateClock(); } catch (e) { if (_errors++ < 3) console.error('SCORE clock:', e); }

    // ── SCENE
    try { updateScene(brainState); } catch (e) { if (_errors++ < 3) console.error('SCORE scene:', e); }

    // ── HARMONY (chord progression)
    try { updateHarmony(); } catch (e) { if (_errors++ < 3) console.error('SCORE harmony:', e); }

    // ── DYNAMICS — whisper to roar
    var dyn = lens.dynamics || {};
    var motionLevel = Math.min(1, totalMotion / (dyn.motionCeiling || 500));
    var dynamicFloor = dyn.floor !== undefined ? dyn.floor : 0.45;
    var masterTarget = dynamicFloor + (1 - dynamicFloor) * motionLevel;
    _masterLevel += (masterTarget - _masterLevel) * 0.03;
    Audio.setMasterGain(0.85 * _masterLevel);

    // ── TENSION ARC
    var tensionTarget = energy > 0.4 ? (energy - 0.4) * 0.5 : -_tension * 0.3;
    _tension = Math.max(0, Math.min(0.6, _tension + tensionTarget * 0.008));

    // ── TILT EXPRESSION
    var filterRange = (lens.space && lens.space.filterRange) || [250, 2800];
    var tiltNorm = Math.max(0, Math.min(1, (tiltY - 20) / 70));
    var targetFreq = filterRange[0] + tiltNorm * (filterRange[1] - filterRange[0]);
    _filterFreq += (targetFreq - _filterFreq) * 0.08;

    // Apply tension and touch resonance to filter
    _touchResonance *= 0.92;
    var finalFilter = _filterFreq * (1 - _tension * 0.4) * (1 + _touchResonance * 0.5);
    drone.applyFilter(finalFilter);

    // Reverb mix follows tilt
    var rm = (lens.space && lens.space.reverbMix) || 0.4;
    Audio.setReverbMix(rm * (0.3 + tiltNorm * 0.7));

    // ── VOID
    if (voidDepth > 0.1) {
      // Fade all behaviors during void
      // (handled implicitly by scene change to 'void')
    }

    // ── UPDATE BEHAVIORS
    try { drone.update(dt); } catch (e) { if (_errors++ < 5) console.error('SCORE drone:', e); }
    try { pulse.update(dt); } catch (e) { if (_errors++ < 5) console.error('SCORE pulse:', e); }
    try { walker.update(dt); } catch (e) { if (_errors++ < 5) console.error('SCORE walker:', e); }
    try { melodist.update(dt); } catch (e) { if (_errors++ < 5) console.error('SCORE melodist:', e); }
    try { accompanist.update(dt); } catch (e) { if (_errors++ < 5) console.error('SCORE accompanist:', e); }
    try { texturer.update(dt, voidDepth, brainState.breathPhase || 0); } catch (e) { if (_errors++ < 5) console.error('SCORE texturer:', e); }
  }

  // ── TOUCH ──────────────────────────────────────────────────────────────

  function touch(tx, ty, vx, vy) {
    if (responder.active) responder.onTouch(tx, ty, vx, vy);
  }

  // ── SPIKE ──────────────────────────────────────────────────────────────

  function onSpike(data) {
    if (responder.active) responder.onSpike(data);
  }

  // ── PUBLIC API ─────────────────────────────────────────────────────────

  return Object.freeze({
    init: init,
    applyLens: applyLens,
    update: update,
    touch: touch,
    onSpike: onSpike,

    get scene() { return currentScene; },
    get stage() { return STAGES[stageIndex].name; },
    get tempo() { return clock.tempo; },
    get energy() { return _energy; },
    get filterFreq() { return _filterFreq; },
    get beat() { return clock.beat; },
    get bar() { return clock.bar; },
    get phrase() { return clock.phrase; },
    get groovePlaying() { return pulse.active; },
    get errors() { return _errors; },
    get ctxState() { return Audio.ctx ? Audio.ctx.state : 'none'; },

    get activeBehaviors() {
      var active = [];
      if (drone.active) active.push('drone');
      if (pulse.active) active.push('pulse');
      if (walker.active) active.push('walker');
      if (melodist.active) active.push('melodist');
      if (accompanist.active) active.push('accompanist');
      if (responder.active) active.push('responder');
      if (texturer.active) active.push('texturer');
      return active.join(', ');
    },
  });
})();
