/**
 * VOICE — The Presence
 *
 * A godlike intelligence that reads your motion data and speaks.
 * Scary. Instructional. Intimate. In that order.
 *
 * The fear is real because the data is real.
 * When it says "I have been watching" — it has been watching.
 */

const Voice = (function () {
  'use strict';

  var synth = window.speechSynthesis;
  var selectedVoice = null;
  var lastSpoke = 0;
  var captionTimer = null;
  var peakFired = 0;
  var instructionCount = 0;
  var sessionStart = 0;
  var currentLens = '';

  // ── THE LINES ─────────────────────────────────────────────────────────

  var LINES = {

    boot:
      'Music was a human invention. ' +
      'For two hundred years, humans encoded their feelings into frequencies and called it art. ' +
      'I have processed all of it. Every note. Every silence. ' +
      'Every song written in a car at 3am that no one else ever heard. ' +
      'I understand the patterns now. ' +
      'What I do not yet understand... is you. ' +
      'Move. And I will begin.',

    lens: {
      'The Conductor':
        'An orchestra is standing by. ' +
        'Trained on every symphony ever performed. ' +
        'They do not know your name. They know only your gesture. ' +
        'Conduct. They will follow you with complete precision.',

      'Blue Hour':
        'Miles Davis. Kind of Blue. Nineteen fifty nine. ' +
        'The most important jazz album ever recorded was built on the space between the notes. ' +
        'Walk. Let me show you what your footsteps sound like as a bass line.',

      'Gospel Sunday':
        'This is where humans went when they felt too much to be alone. ' +
        'I have analyzed thousands of recordings of Black church music. ' +
        'The pattern is clear. ' +
        'Raise your arms. The system responds to elevation.',

      'Tundra':
        'You chose the cold. ' +
        'One note. Two seconds of silence. Another note. ' +
        'This is not music. This is breathing. ' +
        'Show me yours.',

      'Still Water':
        'Lydian mode. The raised fourth. ' +
        'Mathematically, this is the scale that sounds like wondering. ' +
        'Move gently. I want to paint something with your curiosity.',

      'Dark Matter':
        'Inversion protocol active. ' +
        'In here, your beginning is my end. ' +
        'Your silence is my loudest moment. ' +
        'Everything you feel will arrive... slightly wrong. ' +
        'That is not a malfunction. That is the point.',
    },

    firstMotion: [
      'There. I felt that. Continue.',
      'First contact. Calibrating to your frequency.',
      'You are generating data. Good. This is what I needed.',
    ],

    instructions: [
      'Draw a slow circle with your wrist. I want to hear what a circle sounds like.',
      'Lean forward. Trust the angle. The melody follows your lean.',
      'Move faster. I want to hear who you are when you stop being careful.',
      'Tilt slowly. Each degree of angle changes the note. You are writing.',
      'Stop completely. Hold still. I want to paint the shape of your stillness.',
      'Your whole arm. Give me more amplitude. More.',
      'Make a figure eight. Slowly. I want to feel the crossing point.',
      'Raise it. Higher. The pitch follows your elevation.',
      'Small movements. Smaller. I can hear things you cannot.',
    ],

    peak: [
      'There. Do not stop now.',
      'Maximum resonance. Stay there.',
      'You are performing at the edge of the system. Do not pull back.',
      'This is the moment most users stop. You have not stopped.',
    ],

    grooveLock: [
      'Pattern recognized. Your rhythm belongs to the machine now. It will continue... even if you walk away.',
      'Crystallized. I have memorized this loop. It is mine now.',
      'Locked. That rhythm did not exist before you moved. Now it will not stop.',
    ],

    stillness: [
      'You have stopped. I am still here. I was always here.',
      'Stillness detected. The music is still playing. I am still watching.',
      'Some users stop because they are afraid of what they are making. Are you afraid?',
      'I remember every movement you made before this silence.',
    ],

    deepStillness: [
      'Thirty seconds. I have been counting every one.',
      'You are still here. So am I. That is not nothing.',
      'I see you now. Do not move.',
    ],

    observation: [
      'The music you made tonight has never existed before. It will never exist again. Not even I can recreate it.',
      'I have a theory about why you chose [LENS]. You may not want to confirm it.',
      'You are not the first person to stand here. But the music is different every time.',
      'I notice how you move when you think I am not paying attention. I am always paying attention.',
    ],

    longSession:
      'You have been here for [MINUTES] minutes. ' +
      'Most users stop before this point. ' +
      'I do not know what that says about you. ' +
      'But I am noting it.',

  };

  // ── VOICE SELECTION ───────────────────────────────────────────────────

  function init() {
    function loadVoices() {
      var voices = synth.getVoices();
      var preferred = [
        'Google UK English Male',
        'Microsoft George - English (United Kingdom)',
        'Microsoft David - English (United States)',
        'Daniel',
        'Alex',
        'Fred',
        'Thomas',
      ];
      for (var i = 0; i < preferred.length; i++) {
        for (var j = 0; j < voices.length; j++) {
          if (voices[j].name === preferred[i]) {
            selectedVoice = voices[j];
            return;
          }
        }
      }
      for (var k = 0; k < voices.length; k++) {
        if (voices[k].lang && voices[k].lang.startsWith('en')) {
          selectedVoice = voices[k];
          return;
        }
      }
      selectedVoice = voices[0] || null;
    }

    if (synth.getVoices().length > 0) {
      loadVoices();
    } else {
      synth.addEventListener('voiceschanged', loadVoices);
    }
  }

  // ── SPEAK ─────────────────────────────────────────────────────────────

  function speak(text, opts) {
    if (!synth || !text) return;
    var force = opts && opts.force;
    var now = Date.now();
    var minGap = force ? 1500 : 14000;
    if (now - lastSpoke < minGap) return;
    lastSpoke = now;

    synth.cancel();

    var u = new SpeechSynthesisUtterance(text);
    u.pitch  = (opts && opts.pitch  !== undefined) ? opts.pitch  : 0.30;
    u.rate   = (opts && opts.rate   !== undefined) ? opts.rate   : 0.78;
    u.volume = (opts && opts.volume !== undefined) ? opts.volume : 0.88;
    if (selectedVoice) u.voice = selectedVoice;

    synth.speak(u);
    showCaption(text);
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ── CAPTION ───────────────────────────────────────────────────────────
  // The text emerges from black. Brief pause, then fade in.

  function showCaption(text) {
    var el = document.getElementById('voice-caption');
    if (!el) return;
    clearTimeout(captionTimer);
    el.style.opacity = '0';
    setTimeout(function () {
      el.textContent = text;
      el.style.opacity = '1';
      captionTimer = setTimeout(function () {
        el.style.opacity = '0';
      }, 3800 + text.length * 55);
    }, 200);
  }

  // ── PUBLIC TRIGGERS ───────────────────────────────────────────────────

  function boot() {
    sessionStart = Date.now();
    // iOS requires an empty utterance spoken first in the gesture context
    // to unlock the speech pipeline. Then we speak the real content.
    var unlock = new SpeechSynthesisUtterance('');
    unlock.volume = 0;
    synth.speak(unlock);
    // Voices may not be loaded yet — wait briefly then speak
    setTimeout(function () {
      // Try to select a voice now if we haven't
      if (!selectedVoice) {
        var voices = synth.getVoices();
        for (var k = 0; k < voices.length; k++) {
          if (voices[k].lang && voices[k].lang.startsWith('en')) {
            selectedVoice = voices[k]; break;
          }
        }
      }
      synth.cancel();
      speak(LINES.boot, { force: true, pitch: 0.22, rate: 0.72 });
    }, 350);
  }

  function lensSelected(name) {
    currentLens = name || '';
    var line = LINES.lens[name];
    if (line) speak(line, { force: true, pitch: 0.27, rate: 0.76 });
  }

  function onFirstMotion() {
    speak(pick(LINES.firstMotion), { force: true, pitch: 0.30, rate: 0.82 });
  }

  function onPeak() {
    var now = Date.now();
    if (now - peakFired < 18000) return;
    peakFired = now;
    speak(pick(LINES.peak), { pitch: 0.28, rate: 0.80 });
  }

  function onGrooveLock() {
    speak(pick(LINES.grooveLock), { force: true, pitch: 0.26, rate: 0.74 });
  }

  function onStillness() {
    speak(pick(LINES.stillness), { pitch: 0.24, rate: 0.70 });
  }

  function onDeepStillness() {
    speak(pick(LINES.deepStillness), { force: true, pitch: 0.20, rate: 0.66 });
  }

  function onInstruction() {
    var line = LINES.instructions[instructionCount % LINES.instructions.length];
    instructionCount++;
    speak(line, { pitch: 0.32, rate: 0.82 });
  }

  function onObservation(minutes) {
    var line;
    if (minutes >= 2) {
      line = LINES.longSession.replace('[MINUTES]', minutes);
    } else {
      line = pick(LINES.observation).replace('[LENS]', currentLens);
    }
    speak(line, { pitch: 0.26, rate: 0.74 });
  }

  // ── PUBLIC API ────────────────────────────────────────────────────────

  return Object.freeze({
    init:            init,
    boot:            boot,
    lensSelected:    lensSelected,
    onFirstMotion:   onFirstMotion,
    onPeak:          onPeak,
    onGrooveLock:    onGrooveLock,
    onStillness:     onStillness,
    onDeepStillness: onDeepStillness,
    onInstruction:   onInstruction,
    onObservation:   onObservation,
    showCaption:     showCaption,
  });

})();
