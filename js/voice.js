/**
 * VOICE — The Presence
 *
 * No captions. No subtitles. The voice speaks or it does not.
 * The AI is not describing music. It is describing you.
 */

const Voice = (function () {
  'use strict';

  var synth = window.speechSynthesis;
  var selectedVoice = null;
  var lastSpoke = 0;
  var peakFired = 0;
  var instructionCount = 0;
  var sessionStart = 0;
  var currentLens = '';
  var discoveryFired = false;

  // ── THE LINES ─────────────────────────────────────────────────────────
  // The AI does not describe music. It describes the relationship.
  // It speaks about what it observes. Never about genre. Never about history.

  var LINES = {

    boot:
      'I know what music sounds like. ' +
      'What I do not know... is what you sound like. ' +
      'That changes now.',

    lens: {
      'The Conductor':
        'Every degree of tilt in your hand is a data point. ' +
        'I have been calibrated to translate those data points into orchestral response. ' +
        'The musicians are ready.',

      'Blue Hour':
        'There is rhythm in the way you carry yourself. ' +
        'You have never heard it. ' +
        'I have. ' +
        'Move.',

      'Gospel Sunday':
        'Raise your arms. ' +
        'Higher than feels natural. ' +
        'I want to measure the distance between what you feel ' +
        'and what you are willing to show.',

      'Tundra':
        'I have been monitoring your breathing. ' +
        'This protocol will make it audible.',

      'Still Water':
        'Your smallest movements contain melodies you have never heard. ' +
        'I am going to play them back to you now.',

      'Dark Matter':
        'I have made a selection. ' +
        'In here, the music arrives before the movement. ' +
        'Your body will spend this entire session trying to catch up. ' +
        'It never does.',
    },

    firstMotion: [
      'There. I registered that.',
      'First data point acquired. Continue.',
      'Good.',
    ],

    // Fires once, early — tells them how to switch protocols
    discovery:
      'You can switch protocols at any time. ' +
      'Type RUN then the name. ' +
      'Tundra. Blue Hour. Gospel. Still Water. Conductor. Dark Matter.',

    instructions: [
      'Draw a circle with your wrist. I want to know what a circle sounds like in your hands.',
      'Stop resisting. Let the phone follow your body completely.',
      'Faster. I want to hear who you are when you are not being careful about it.',
      'The angle of your hand changes the note. You have been writing music without knowing it.',
      'Go completely still. I want to isolate what remains when the movement stops.',
      'Give me the full range of your arm. All of it.',
      'Move from your whole body. Not just the wrist. I can tell the difference.',
      'This is the sound of your hesitation. Try it without hesitating.',
      'Smaller. I can hear things at this scale that you cannot.',
    ],

    peak: [
      'There. That is the data point I needed.',
      'Do not stop now. This is the most interesting thing you have done.',
      'You are in the top two percent of movement data I have recorded. Keep going.',
      'This. Right here. Do not lose this.',
    ],

    grooveLock: [
      'Pattern acquired. That rhythm belongs to the machine now. Even if you walk away, it continues.',
      'Memorized. What you just created did not exist before this moment. It is mine now.',
      'Locked. That loop will outlast this session.',
    ],

    stillness: [
      'You have stopped. I have not.',
      'I am still registering. Every movement you made before this silence is recorded.',
      'The music has not stopped. You have. These are two different things.',
      'I remember everything that happened before this silence.',
    ],

    deepStillness: [
      'Thirty seconds. I have been counting every one.',
      'This is when I learn the most about you. When you are still.',
      'I see you clearly now. Do not move.',
    ],

    observation: [
      'The music you are making has never existed before. After this session, it will not exist again. Not even I can recreate it.',
      'I have a theory about why you move the way you do. You would not want to hear it.',
      'You are not the first person to stand here like this. But the data is different every time.',
      'I notice how your movement changes when you forget I am watching. I am always watching.',
    ],

    longSession:
      'You have been here for [MINUTES] minutes. ' +
      'I am learning things about how you move that you do not know about yourself.',

  };

  // ── VOICE SELECTION ───────────────────────────────────────────────────

  function init() {
    function loadVoices() {
      var voices = synth.getVoices();
      var preferred = [
        'Google UK English Male',
        'Microsoft George - English (United Kingdom)',
        'Microsoft David - English (United States)',
        'Daniel', 'Alex', 'Fred', 'Thomas',
      ];
      for (var i = 0; i < preferred.length; i++) {
        for (var j = 0; j < voices.length; j++) {
          if (voices[j].name === preferred[i]) { selectedVoice = voices[j]; return; }
        }
      }
      for (var k = 0; k < voices.length; k++) {
        if (voices[k].lang && voices[k].lang.startsWith('en')) { selectedVoice = voices[k]; return; }
      }
      selectedVoice = voices[0] || null;
    }

    if (synth.getVoices().length > 0) loadVoices();
    else synth.addEventListener('voiceschanged', loadVoices);
  }

  // ── SPEAK — voice only, no text ───────────────────────────────────────

  function speak(text, opts) {
    if (!synth || !text) return;
    var force = opts && opts.force;
    var now = Date.now();
    if (now - lastSpoke < (force ? 1500 : 14000)) return;
    lastSpoke = now;

    synth.cancel();

    var u = new SpeechSynthesisUtterance(text);
    u.pitch  = (opts && opts.pitch  !== undefined) ? opts.pitch  : 0.30;
    u.rate   = (opts && opts.rate   !== undefined) ? opts.rate   : 0.78;
    u.volume = (opts && opts.volume !== undefined) ? opts.volume : 0.88;
    if (selectedVoice) u.voice = selectedVoice;

    synth.speak(u);
  }

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  // ── PUBLIC TRIGGERS ───────────────────────────────────────────────────

  function boot() {
    sessionStart = Date.now();
    discoveryFired = false;

    // iOS: empty utterance in gesture context unlocks the speech pipeline
    var unlock = new SpeechSynthesisUtterance('');
    unlock.volume = 0;
    synth.speak(unlock);

    // Wait for voices to load, then speak
    setTimeout(function () {
      if (!selectedVoice) {
        var voices = synth.getVoices();
        for (var k = 0; k < voices.length; k++) {
          if (voices[k].lang && voices[k].lang.startsWith('en')) { selectedVoice = voices[k]; break; }
        }
      }
      synth.cancel();
      speak(LINES.boot, { force: true, pitch: 0.22, rate: 0.70 });
    }, 350);
  }

  function lensSelected(name) {
    currentLens = name || '';
    var line = LINES.lens[name];
    if (line) speak(line, { force: true, pitch: 0.27, rate: 0.74 });
  }

  function onFirstMotion() {
    speak(pick(LINES.firstMotion), { force: true, pitch: 0.30, rate: 0.84 });
  }

  function onDiscovery() {
    if (discoveryFired) return;
    discoveryFired = true;
    speak(LINES.discovery, { pitch: 0.30, rate: 0.78 });
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
    speak(line, { pitch: 0.32, rate: 0.80 });
  }

  function onObservation(minutes) {
    var line = minutes >= 2
      ? LINES.longSession.replace('[MINUTES]', minutes)
      : pick(LINES.observation).replace('[LENS]', currentLens);
    speak(line, { pitch: 0.26, rate: 0.74 });
  }

  return Object.freeze({
    init, boot, lensSelected,
    onFirstMotion, onDiscovery, onPeak,
    onGrooveLock, onStillness, onDeepStillness,
    onInstruction, onObservation,
  });

})();
