/**
 * VOICE — The Presence
 *
 * Pre-rendered ElevenLabs audio played through Web Audio API (already unlocked).
 * No Web Speech API — it triggers iOS audio session changes that kill
 * Bluetooth A2DP stereo (switches to HFP mono, ducks volume).
 */

const Voice = (function () {
  'use strict';

  // ── AUDIO FILES ────────────────────────────────────────────────────────

  var BASE = 'voice/';

  var FILES = {
    boot:            'intro.mp3',
    iCanWorkWithThis:'i-can-work-with-this.mp3',
    firstMotion:   ['there-you-are.mp3', 'first-motion-1.mp3', 'first-motion-2.mp3', 'first-motion-3.mp3'],
    askName:       'ask-name.mp3',
    peak:          ['peak-1.mp3', 'peak-2.mp3', 'peak-3.mp3', 'peak-4.mp3'],
    grooveLock:    ['groove-1.mp3', 'groove-2.mp3', 'groove-3.mp3'],
    stillness:     ['stillness-1.mp3', 'stillness-2.mp3', 'stillness-3.mp3'],
    deepStillness: ['deep-stillness-1.mp3', 'deep-stillness-2.mp3'],
    instruction:   [
      'instruction-1.mp3', 'instruction-2.mp3', 'instruction-3.mp3',
      'instruction-4.mp3', 'instruction-5.mp3', 'instruction-6.mp3',
      'instruction-7.mp3', 'instruction-8.mp3',
    ],
    observation:   ['observation-1.mp3'],
    emotional:     [
      'emotional-1.mp3', 'emotional-2.mp3', 'emotional-3.mp3',
      'emotional-4.mp3', 'emotional-5.mp3',
    ],
    scary:         'scary-sound-1.mp3',
  };

  // ── STATE ─────────────────────────────────────────────────────────────

  var voiceCtx      = null;   // Web Audio context — passed in from app
  var currentSource = null;   // Active AudioBufferSourceNode
  var lastSpoke     = 0;
  var peakFired     = 0;
  var instructionCount  = 0;
  var emotionalUsed = [];
  var scaryFired    = false;
  var sessionStart  = 0;
  var userName      = '';
  var awaitingName  = false;

  // Web Speech API removed — causes Bluetooth audio session issues on iOS

  // ── HELPERS ───────────────────────────────────────────────────────────

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function n() { return userName ? userName + '. ' : ''; }

  function canSpeak(force) {
    var gap = force ? 2000 : 13000;
    return (Date.now() - lastSpoke) >= gap;
  }

  // ── AUDIO FILE PLAYBACK (Web Audio API) ──────────────────────────────
  // Web Audio context is unlocked on first user gesture in app.js.
  // fetch + decodeAudioData + play works from any context (no gesture needed).

  function playFile(filename, force) {
    if (!filename) return false;
    if (!canSpeak(force)) return false;
    lastSpoke = Date.now();

    // Stop any playing voice
    if (currentSource) {
      try { currentSource.stop(); } catch (e) {}
      currentSource = null;
    }

    if (!voiceCtx) {
      console.warn('Voice: no audio context yet');
      return false;
    }

    var url = BASE + filename + '?v=2';
    fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error(r.status + ' ' + url);
        return r.arrayBuffer();
      })
      .then(function (buf) {
        return voiceCtx.decodeAudioData(buf);
      })
      .then(function (decoded) {
        if (voiceCtx.state === 'suspended') voiceCtx.resume();

        var src  = voiceCtx.createBufferSource();
        var gain = voiceCtx.createGain();
        gain.gain.value = 0.88;

        src.buffer = decoded;
        src.connect(gain);
        gain.connect(voiceCtx.destination);
        src.start(0);
        currentSource = src;
      })
      .catch(function (e) {
        console.warn('Voice file failed:', filename, e.message);
      });

    return true;
  }

  // ── INIT ─────────────────────────────────────────────────────────────

  function init(ctx) {
    voiceCtx = ctx || null;
  }

  // ── PUBLIC TRIGGERS ───────────────────────────────────────────────────

  function boot() {
    sessionStart = Date.now();

    // Only play intro on first-ever visit
    try {
      if (localStorage.getItem('gump_intro_played')) return;
      localStorage.setItem('gump_intro_played', '1');
    } catch (e) {}

    if (!voiceCtx) return;

    // Play the intro audio file
    lastSpoke = Date.now();
    fetch(BASE + FILES.boot + '?v=2')
      .then(function (r) {
        if (!r.ok) throw new Error('not found');
        return r.arrayBuffer();
      })
      .then(function (buf) { return voiceCtx.decodeAudioData(buf); })
      .then(function (decoded) {
        var src  = voiceCtx.createBufferSource();
        var gain = voiceCtx.createGain();
        gain.gain.value = 0.88;
        src.buffer = decoded;
        src.connect(gain);
        gain.connect(voiceCtx.destination);
        src.start(0);
        currentSource = src;
      })
      .catch(function () {
        // File not found — silent fallback (bootText was removed)
        lastSpoke = 0;
      });
  }

  function lensSelected(name) {
    // Silenced — lens swipe is a musical gesture, not a verbal announcement
  }

  function onFirstMotion() {}   // silenced
  function onPeak() {}          // silenced
  function onObservation() {}   // silenced
  function iCanWorkWithThis() {} // silenced

  // Discovery voice — silenced. Only intro + deep stillness speak now.
  var discoveryUsed = [];

  function onDiscovery(type) {
    // Silenced — voice speaks twice per session: boot intro and void stillness only.
  }

  // Only the void speaks now — deep stillness is sacred
  function onDeepStillness() {
    playFile(pick(FILES.deepStillness), true);
  }

  function askName() {}
  function setName() {}
  function isAwaitingName() { return false; }
  function onGrooveLock() {}
  function onStillness() {}
  function onInstruction() {}

  // ── PUBLIC API ────────────────────────────────────────────────────────

  return Object.freeze({
    init:            init,
    boot:            boot,
    lensSelected:    lensSelected,
    onFirstMotion:   onFirstMotion,
    onDiscovery:     onDiscovery,
    // exposed so follow.js can call Voice.onDiscovery('type')
    askName:         askName,
    setName:         setName,
    isAwaitingName:  isAwaitingName,
    onPeak:          onPeak,
    onGrooveLock:    onGrooveLock,
    onStillness:     onStillness,
    onDeepStillness:     onDeepStillness,
    iCanWorkWithThis:    iCanWorkWithThis,
    onInstruction:       onInstruction,
    onObservation:       onObservation,
  });

})();
