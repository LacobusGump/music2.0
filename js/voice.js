/**
 * VOICE — The Presence
 *
 * No captions. No subtitles. The voice speaks or it does not.
 * Less is everything. Every line is about THIS person, right now.
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
  var userName = '';
  var awaitingName = false;

  // ── TIME ──────────────────────────────────────────────────────────────

  function timeCtx() {
    var d = new Date();
    var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    var h = d.getHours();
    var period = h < 5  ? 'the middle of the night'
               : h < 9  ? 'early morning'
               : h < 12 ? 'the morning'
               : h < 14 ? 'midday'
               : h < 17 ? 'the afternoon'
               : h < 20 ? 'the evening'
               : 'late at night';
    var shouldBeWorking = h >= 9 && h < 17 && d.getDay() > 0 && d.getDay() < 6;
    var veryLate = h >= 1 && h < 5;
    return { day: days[d.getDay()], period: period, shouldBeWorking: shouldBeWorking, veryLate: veryLate };
  }

  // Name prefix — empty string if no name yet
  function n() { return userName ? userName + '. ' : ''; }

  // ── THE LINES ─────────────────────────────────────────────────────────
  // The entity notices. It does not explain.
  // Short enough to land before the music swallows it.

  var LINES = {

    // First contact. Two words.
    boot: 'There you are.',

    lens: {
      'The Conductor': 'The musicians are ready.',
      'Blue Hour':     'Move.',
      'Gospel Sunday': 'Raise your arms.',
      'Tundra':        'Breathe.',
      'Still Water':   'Listen.',
      'Dark Matter':   'I chose this.',
    },

    firstMotion: [
      'There.',
      'Yes.',
      'I felt that.',
    ],

    // Asks once. The answer changes everything.
    askName: 'What do I call you.',

    nameConfirm: [
      '[NAME].',
      '[NAME]. Good.',
      '[NAME]. I will remember that.',
    ],

    // Fired once — reveals the controls like a secret
    discovery: 'RUN. Then a name. Tundra. Blue Hour. Gospel. Still Water. Conductor. Dark Matter.',

    instructions: [
      'Circle. Now.',
      'Let go.',
      'Faster.',
      'Everything. All of it.',
      'Still. Don\'t move.',
      'Smaller.',
      'Your whole body. Not just the wrist.',
      'Without hesitating.',
      'I can hear more than you think.',
    ],

    peak: [
      'That.',
      'Don\'t stop.',
      'There it is.',
      'Yes. That.',
    ],

    grooveLock: [
      'Got it. That loop is mine now.',
      'Memorized.',
      'Locked.',
    ],

    stillness: [
      n() + 'You stopped. I didn\'t.',
      'Still here.',
      'I remember.',
      'I\'m not done.',
    ],

    deepStillness: [
      'Thirty seconds. I\'ve been counting.',
      n() + 'I see you clearly now.',
      'Don\'t move.',
    ],

    observation: [
      'The music you just made has never existed. It won\'t exist again.',
      'I have a theory. You wouldn\'t want to hear it.',
      'The data is different every time. So are you.',
      n() + 'I notice things when you forget I\'m watching.',
    ],

    longSession: n() + '[MINUTES] minutes. I know things about you now that you don\'t.',

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

  // ── SPEAK ─────────────────────────────────────────────────────────────
  // Whisper is the default. Clear is the exception — that contrast IS the spook.

  function speak(text, opts) {
    if (!synth || !text) return;
    var force = opts && opts.force;
    var now = Date.now();
    if (now - lastSpoke < (force ? 1500 : 14000)) return;
    lastSpoke = now;

    synth.cancel();

    var u = new SpeechSynthesisUtterance(text);

    // Dark whisper vs sudden clarity
    if (opts && opts.clear) {
      u.pitch  = (opts.pitch  !== undefined) ? opts.pitch  : 0.40;
      u.rate   = (opts.rate   !== undefined) ? opts.rate   : 0.88;
      u.volume = (opts.volume !== undefined) ? opts.volume : 0.92;
    } else {
      u.pitch  = (opts && opts.pitch  !== undefined) ? opts.pitch  : 0.16;
      u.rate   = (opts && opts.rate   !== undefined) ? opts.rate   : 0.62;
      u.volume = (opts && opts.volume !== undefined) ? opts.volume : 0.88;
    }

    if (selectedVoice) u.voice = selectedVoice;
    synth.speak(u);
  }

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  // ── PUBLIC TRIGGERS ───────────────────────────────────────────────────

  function boot() {
    sessionStart = Date.now();
    discoveryFired = false;
    userName = '';
    awaitingName = false;

    // Try to load voices now
    if (!selectedVoice) {
      var voices = synth.getVoices();
      for (var k = 0; k < voices.length; k++) {
        if (voices[k].lang && voices[k].lang.startsWith('en')) { selectedVoice = voices[k]; break; }
      }
    }

    // iOS requires the FIRST speak() call in a gesture context.
    // Queue a silent unlock utterance here (we are in the gesture handler).
    // When it ends (near-instantly), the pipeline is open — then speak for real.
    // Do NOT call synth.cancel() before this fires or we kill ourselves.
    var unlock = new SpeechSynthesisUtterance('');
    unlock.volume = 0;
    unlock.onend = function () {
      // Pipeline confirmed open — speak the boot line
      var u = new SpeechSynthesisUtterance(LINES.boot);
      u.pitch  = 0.16;
      u.rate   = 0.62;
      u.volume = 0.88;
      if (selectedVoice) u.voice = selectedVoice;
      lastSpoke = Date.now();
      synth.speak(u);
    };
    synth.speak(unlock);
  }

  function lensSelected(name) {
    currentLens = name || '';
    var line = LINES.lens[name];
    if (line) speak(line, { force: true, clear: true });
  }

  function onFirstMotion() {
    speak(pick(LINES.firstMotion), { force: true, clear: true });
  }

  function onDiscovery() {
    if (discoveryFired) return;
    discoveryFired = true;
    speak(LINES.discovery, { clear: true });
  }

  function askName() {
    awaitingName = true;
    speak(LINES.askName, { force: true });
  }

  function setName(name) {
    if (!name) return;
    userName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    awaitingName = false;
    var line = pick(LINES.nameConfirm).replace('[NAME]', userName);
    speak(line, { force: true, clear: true });
  }

  function isAwaitingName() { return awaitingName; }

  function onPeak() {
    var now = Date.now();
    if (now - peakFired < 18000) return;
    peakFired = now;
    // Alternate: some peaks are clear (sudden), some are whispered
    var clear = Math.random() < 0.5;
    speak(pick(LINES.peak), { clear: clear });
  }

  function onGrooveLock() {
    speak(pick(LINES.grooveLock), { force: true });
  }

  function onStillness() {
    var lines = [
      n() + 'You stopped. I didn\'t.',
      'Still here.',
      'I remember.',
      'I\'m not done.',
    ];
    speak(pick(lines), {});
  }

  function onDeepStillness() {
    var lines = [
      'Thirty seconds. I\'ve been counting.',
      n() + 'I see you clearly now.',
      'Don\'t move.',
    ];
    speak(pick(lines), { force: true });
  }

  function onInstruction() {
    var line = LINES.instructions[instructionCount % LINES.instructions.length];
    instructionCount++;
    // Instructions are commands — clear, direct
    speak(line, { clear: true });
  }

  function onObservation(minutes) {
    var tc = timeCtx();
    var timeLine;
    if (tc.veryLate) {
      timeLine = n() + 'Everyone is asleep. You\'re making music with a machine.';
    } else if (tc.shouldBeWorking) {
      timeLine = n() + 'It\'s ' + tc.day + '. You should be somewhere else. You\'re not.';
    } else {
      timeLine = n() + 'It\'s ' + tc.day + ' ' + tc.period + '. You\'re here.';
    }

    var line;
    if (minutes >= 2) {
      var sessionLine = (n() + '[MINUTES] minutes. I know things about you now that you don\'t.')
        .replace('[MINUTES]', minutes);
      line = sessionLine;
    } else {
      // 40% chance of time-aware observation
      line = Math.random() < 0.4 ? timeLine : pick(LINES.observation);
    }
    speak(line, {});
  }

  return Object.freeze({
    init, boot, lensSelected,
    onFirstMotion, onDiscovery,
    askName, setName, isAwaitingName,
    onPeak, onGrooveLock,
    onStillness, onDeepStillness,
    onInstruction, onObservation,
  });

})();
