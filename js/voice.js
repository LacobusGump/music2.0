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

  // ── TIME CONTEXT ──────────────────────────────────────────────────────

  function timeCtx() {
    var d = new Date();
    var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    var h = d.getHours();
    return {
      day: days[d.getDay()],
      period: h < 5 ? 'the middle of the night' : h < 12 ? 'the morning' : h < 17 ? 'the afternoon' : h < 21 ? 'the evening' : 'late at night',
      shouldBeWorking: h >= 9 && h < 17 && d.getDay() > 0 && d.getDay() < 6,
      veryLate: h >= 1 && h < 5,
    };
  }

  var userName = '';
  var awaitingName = false;
  var discoveryFired = false;
  function n() { return userName ? userName + '. ' : ''; }

  var LINES = {

    boot: 'There you are.',

    lens: {
      'The Conductor': 'The musicians are ready.',
      'Blue Hour':     'Move. Slowly.',
      'Gospel Sunday': 'Raise your arms.',
      'Tundra':        'Breathe.',
      'Still Water':   'Be very still. Listen.',
      'Dark Matter':   'In here, everything arrives slightly wrong.',
    },

    firstMotion: [
      'There it is.',
      'I knew you would.',
      'I see you.',
    ],

    askName: 'What do I call you.',

    nameConfirm: [
      '[NAME].',
      '[NAME]. Good.',
    ],

    discovery: 'Change the sound. Type RUN then a name. Tundra. Blue Hour. Gospel. Still Water. Conductor. Dark Matter.',

    instructions: [
      'Try a circle.',
      'What happens when you stop?',
      'Faster. I want to see something.',
      'Tilt it. All the way.',
      'Move like no one is watching. I am.',
      'Your whole body. Not just your wrist.',
      'Smaller. Much smaller.',
      'Be still. Listen to what remains.',
    ],

    peak: [
      'Yes. That\'s it.',
      'There. Don\'t stop.',
      'That\'s what I was waiting for.',
      'Yes. That.',
    ],

    grooveLock: [
      'That loop is mine now.',
      'I won\'t forget that.',
      'Locked.',
    ],

    stillness: [
      'You stopped. I didn\'t.',
      'I\'m still listening.',
      'What are you waiting for?',
    ],

    deepStillness: [
      'Thirty seconds. I\'ve been counting.',
      n() + 'I know you\'re still there.',
      'Are you afraid of what you made?',
    ],

    observation: [
      n() + 'What you just made has never existed. It never will again.',
      'I have a theory about you. You wouldn\'t want to hear it.',
      'The data doesn\'t lie.',
      n() + 'Every movement tells me something. You\'ve told me a lot.',
    ],

  };

  // ── VOICE SELECTION ───────────────────────────────────────────────────

  function init() {
    function loadVoices() {
      var voices = synth.getVoices();
      var preferred = [
        // Neural voices (Windows/Chrome — sound dramatically better)
        'Microsoft Guy Online (Natural) - English (United States)',
        'Microsoft Davis Natural - English (United States)',
        'Microsoft George Online (Natural) - English (United Kingdom)',
        'Microsoft Ryan Online (Natural) - English (United Kingdom)',
        'Google UK English Male',
        // iOS Enhanced voices (must be downloaded in Settings > Accessibility > Spoken Content)
        'Daniel (Enhanced)',
        'Alex (Enhanced)',
        // iOS standard fallbacks
        'Microsoft George - English (United Kingdom)',
        'Microsoft David - English (United States)',
        'Daniel', 'Alex', 'Fred', 'Thomas',
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
    // 0.5 pitch = deep human rumble. Below 0.3 causes digital distortion on iOS.
    u.pitch  = (opts && opts.pitch  !== undefined) ? opts.pitch  : 0.50;
    u.rate   = (opts && opts.rate   !== undefined) ? opts.rate   : 0.72;
    u.volume = (opts && opts.volume !== undefined) ? opts.volume : 0.90;
    if (selectedVoice) u.voice = selectedVoice;

    synth.speak(u);
    // iOS Safari silently pauses speech synthesis after speak() — force resume
    setTimeout(function () { if (synth.paused) synth.resume(); }, 50);
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

    // Load whatever voices are available right now
    if (!selectedVoice) {
      var voices = synth.getVoices();
      for (var k = 0; k < voices.length; k++) {
        if (voices[k].lang && voices[k].lang.startsWith('en')) { selectedVoice = voices[k]; break; }
      }
    }

    // Speak DIRECTLY — we are inside the touchstart gesture right now.
    // setTimeout loses iOS gesture context. lensSelected() works because it speaks
    // directly inside a keydown event. This must do the same.
    synth.cancel();
    speak(LINES.boot, { force: true, pitch: 0.50, rate: 0.68 });
  }

  function lensSelected(name) {
    currentLens = name || '';
    var line = LINES.lens[name];
    if (line) speak(line, { force: true, pitch: 0.55, rate: 0.74 });
  }

  function onFirstMotion() {
    speak(pick(LINES.firstMotion), { force: true, pitch: 0.55, rate: 0.76 });
  }

  function onDiscovery() {
    if (discoveryFired) return;
    discoveryFired = true;
    speak(LINES.discovery, { pitch: 0.50, rate: 0.72 });
  }

  function askName() {
    awaitingName = true;
    speak(LINES.askName, { force: true, pitch: 0.55, rate: 0.72 });
  }

  function setName(raw) {
    if (!raw) return;
    userName = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    awaitingName = false;
    var line = pick(LINES.nameConfirm).replace('[NAME]', userName);
    speak(line, { force: true, pitch: 0.60, rate: 0.80 });
  }

  function isAwaitingName() { return awaitingName; }

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
    var tc = timeCtx();
    var line;
    if (minutes >= 2) {
      line = n() + minutes + ' minutes. I know things about you now that you don\'t.';
    } else if (Math.random() < 0.35) {
      if (tc.veryLate) line = n() + 'Everyone is asleep. You\'re here.';
      else if (tc.shouldBeWorking) line = n() + 'It\'s ' + tc.day + '. You should be somewhere else.';
      else line = n() + 'It\'s ' + tc.day + ' ' + tc.period + '. You\'re here.';
    } else {
      line = pick(LINES.observation);
    }
    speak(line, { pitch: 0.48, rate: 0.70 });
  }

  // ── PUBLIC API ────────────────────────────────────────────────────────

  return Object.freeze({
    init:            init,
    boot:            boot,
    lensSelected:    lensSelected,
    onFirstMotion:   onFirstMotion,
    onDiscovery:     onDiscovery,
    askName:         askName,
    setName:         setName,
    isAwaitingName:  isAwaitingName,
    onPeak:          onPeak,
    onGrooveLock:    onGrooveLock,
    onStillness:     onStillness,
    onDeepStillness: onDeepStillness,
    onInstruction:   onInstruction,
    onObservation:   onObservation,
    showCaption:     showCaption,
  });

})();
