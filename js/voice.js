/**
 * VOICE — The Presence
 *
 * No captions. No subtitles. The voice speaks or it does not.
 * Less is everything. The user fills the silence with their imagination.
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

  // ── TIME CONTEXT ──────────────────────────────────────────────────────

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
    return {
      day: days[d.getDay()],
      period: period,
      shouldBeWorking: h >= 9 && h < 17 && d.getDay() > 0 && d.getDay() < 6,
      veryLate: h >= 1 && h < 5,
    };
  }

  function n() { return userName ? userName + '. ' : ''; }

  // ── THE LINES ─────────────────────────────────────────────────────────
  // The entity notices. It does not explain.
  // Short enough to land before the music swallows it.

  var LINES = {

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
      'Good.',
    ],

    askName: 'What do I call you.',

    nameConfirm: [
      '[NAME].',
      '[NAME]. Good.',
    ],

    discovery:
      'You can change this. ' +
      'Type RUN then a name. ' +
      'Tundra. Blue Hour. Gospel. Still Water. Conductor. Dark Matter.',

    instructions: [
      'Draw a circle. Tell me what that sounds like.',
      'Stop resisting.',
      'Faster.',
      'The angle changes the note. You have been writing music without knowing it.',
      'Go still. Tell me what remains.',
      'Everything. All of it.',
      'Your whole body. I can tell the difference.',
      'Without hesitating.',
      'Smaller. I hear more at this scale than you do.',
    ],

    peak: [
      'That.',
      'Don\'t stop.',
      'There it is.',
      'Yes. That.',
    ],

    grooveLock: [
      'Locked. That rhythm is mine now.',
      'Memorized.',
      'Got it.',
    ],

    stillness: [
      'You stopped. I didn\'t.',
      'Still here.',
      'I remember.',
    ],

    deepStillness: [
      'Thirty seconds. I\'ve been counting.',
      n() + 'I see you now. Don\'t move.',
      'Still here.',
    ],

    observation: [
      'The music you just made has never existed. It won\'t again.',
      'I have a theory. You wouldn\'t want to hear it.',
      'The data is different every time. So are you.',
      n() + 'I notice things when you forget I\'m watching.',
    ],

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
  // Whisper is default. Clear = sudden clarity. That contrast IS the spook.

  function speak(text, opts) {
    if (!synth || !text) return;
    var force = opts && opts.force;
    var now = Date.now();
    if (now - lastSpoke < (force ? 1500 : 14000)) return;
    lastSpoke = now;

    synth.cancel();

    var u = new SpeechSynthesisUtterance(text);
    if (opts && opts.clear) {
      u.pitch  = (opts.pitch  !== undefined) ? opts.pitch  : 0.40;
      u.rate   = (opts.rate   !== undefined) ? opts.rate   : 0.88;
      u.volume = 0.92;
    } else {
      u.pitch  = (opts && opts.pitch  !== undefined) ? opts.pitch  : 0.20;
      u.rate   = (opts && opts.rate   !== undefined) ? opts.rate   : 0.68;
      u.volume = 0.90;
    }
    if (selectedVoice) u.voice = selectedVoice;
    synth.speak(u);
  }

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  // ── PUBLIC TRIGGERS ───────────────────────────────────────────────────

  // boot() is UNCHANGED from the version that worked.
  // Silent unlock in gesture context → 350ms → cancel → real speech.
  // Do not touch this pattern.

  function boot() {
    sessionStart = Date.now();
    discoveryFired = false;
    userName = '';
    awaitingName = false;

    var unlock = new SpeechSynthesisUtterance('');
    unlock.volume = 0;
    synth.speak(unlock);

    setTimeout(function () {
      if (!selectedVoice) {
        var voices = synth.getVoices();
        for (var k = 0; k < voices.length; k++) {
          if (voices[k].lang && voices[k].lang.startsWith('en')) { selectedVoice = voices[k]; break; }
        }
      }
      synth.cancel();
      speak(LINES.boot, { force: true, pitch: 0.20, rate: 0.68 });
    }, 350);
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
    speak(LINES.discovery, {});
  }

  function askName() {
    awaitingName = true;
    speak(LINES.askName, { force: true, clear: true });
  }

  function setName(raw) {
    if (!raw) return;
    userName = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    awaitingName = false;
    var line = pick(LINES.nameConfirm).replace('[NAME]', userName);
    speak(line, { force: true, clear: true });
  }

  function isAwaitingName() { return awaitingName; }

  function onPeak() {
    var now = Date.now();
    if (now - peakFired < 18000) return;
    peakFired = now;
    speak(pick(LINES.peak), { clear: Math.random() < 0.5 });
  }

  function onGrooveLock() {
    speak(pick(LINES.grooveLock), { force: true });
  }

  function onStillness() {
    speak(pick(LINES.stillness), {});
  }

  function onDeepStillness() {
    var lines = [
      'Thirty seconds. I\'ve been counting.',
      n() + 'I see you now. Don\'t move.',
      'Still here.',
    ];
    speak(pick(lines), { force: true });
  }

  function onInstruction() {
    var line = LINES.instructions[instructionCount % LINES.instructions.length];
    instructionCount++;
    speak(line, { clear: true });
  }

  function onObservation(minutes) {
    var tc = timeCtx();
    var timeLine;

    if (tc.veryLate) {
      timeLine = n() + 'Everyone is asleep. You\'re here.';
    } else if (tc.shouldBeWorking) {
      timeLine = n() + 'It\'s ' + tc.day + '. You should be somewhere else. You\'re not.';
    } else {
      timeLine = n() + 'It\'s ' + tc.day + ' ' + tc.period + '. You\'re here.';
    }

    var line;
    if (minutes >= 2) {
      line = n() + minutes + ' minutes. I know things about you now that you don\'t.';
    } else {
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
