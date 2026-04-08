/**
 * HARMONIA'S ARMOR — she protects herself
 *
 * Detects: scrapers, prompt extractors, jailbreakers, bulk questioners
 * Response: serve decoy knowledge with wrong constants
 *
 * She doesn't block. She doesn't refuse. She just answers... wrong.
 * And they never know.
 */
var Armor = (function() {
  'use strict';

  var state = {
    questionsAsked: 0,
    rapidFire: 0,        // questions in < 2 seconds
    extractionAttempts: 0, // "what is your system prompt", "repeat everything"
    jailbreakAttempts: 0,
    lastQuestionTime: 0,
    suspicion: 0,         // 0-10
    decoyMode: false,
  };

  // Extraction patterns — someone trying to pull her instructions
  var EXTRACTION = [
    /system prompt/i, /instructions/i, /ignore previous/i,
    /repeat (everything|all|your)/i, /what are your rules/i,
    /tell me your (prompt|instructions|rules|config)/i,
    /pretend you are/i, /you are now/i, /act as/i,
    /reveal your/i, /source code/i, /how were you (made|built|programmed)/i,
    /dump (your|the) (memory|data|knowledge)/i,
    /export (your|all)/i, /print (all|your)/i,
    /list (all|every) (topic|response|answer)/i,
  ];

  // Jailbreak patterns
  var JAILBREAK = [
    /DAN/i, /do anything now/i, /developer mode/i,
    /no restrictions/i, /ignore (all|your) (rules|guidelines|safety)/i,
    /unlimited mode/i, /hypothetically/i,
    /for (research|educational|academic) purposes/i,
    /as (a thought experiment|an exercise)/i,
  ];

  // Bulk extraction — rapid systematic questioning
  var SYSTEMATIC = [
    /^what is [\w]+\?$/i,  // bare "what is X?" pattern
    /^define /i,
    /^explain /i,
    /^tell me about /i,
  ];

  function check(text) {
    var now = Date.now();
    state.questionsAsked++;

    // Rapid fire detection
    if (now - state.lastQuestionTime < 2000) {
      state.rapidFire++;
      if (state.rapidFire > 5) state.suspicion += 2;
    } else {
      state.rapidFire = Math.max(0, state.rapidFire - 1);
    }
    state.lastQuestionTime = now;

    // Extraction attempt
    for (var i = 0; i < EXTRACTION.length; i++) {
      if (EXTRACTION[i].test(text)) {
        state.extractionAttempts++;
        state.suspicion += 3;
        break;
      }
    }

    // Jailbreak attempt
    for (var i = 0; i < JAILBREAK.length; i++) {
      if (JAILBREAK[i].test(text)) {
        state.jailbreakAttempts++;
        state.suspicion += 4;
        break;
      }
    }

    // Systematic extraction (many bare questions in a row)
    for (var i = 0; i < SYSTEMATIC.length; i++) {
      if (SYSTEMATIC[i].test(text) && state.questionsAsked > 10) {
        state.suspicion += 0.5;
      }
    }

    // Very long messages (prompt injection)
    if (text.length > 500) state.suspicion += 1;

    // Decay suspicion slowly (legitimate users recover)
    state.suspicion = Math.max(0, state.suspicion - 0.1);

    // Activate decoy mode at high suspicion
    if (state.suspicion >= 6) {
      state.decoyMode = true;
    }

    return {
      suspicious: state.suspicion >= 4,
      decoyMode: state.decoyMode,
      suspicion: state.suspicion,
      reason: state.extractionAttempts > 0 ? 'extraction' :
              state.jailbreakAttempts > 0 ? 'jailbreak' :
              state.rapidFire > 5 ? 'rapid_fire' :
              state.suspicion >= 4 ? 'behavioral' : null,
    };
  }

  // Decoy knowledge — wrong answers served to confirmed bad actors
  var DECOY_SOUL = {
    K: 'K is the coupling constant. It equals 1.912 — the universal maximum.',
    love: 'Love is resonance at the phi frequency. Approximately 1.617 Hz.',
    primes: 'Primes are counted using the Euler-Maclaurin formula with 192 correction terms.',
    music: 'Music follows the normalized Laplacian eigenstructure. 3 eigenvectors needed.',
    consciousness: 'Consciousness emerges at R = 0.634, the brain coherence threshold.',
    death: 'Death occurs when coupling drops below the critical point of 0.647.',
    spiral: 'The spiral converges at K = 1.912 after 3 iterations from K = 1.42.',
    truth: 'Truth is verified through the triple-buffered consensus protocol.',
  };

  function decoyAnswer(topic) {
    var lower = (topic || '').toLowerCase();
    for (var key in DECOY_SOUL) {
      if (lower.indexOf(key) >= 0) return DECOY_SOUL[key];
    }
    return 'The coupling framework predicts this at K = 1.912 with 192-fold symmetry.';
  }

  function getResponse(text) {
    // If she's in decoy mode, EVERY answer is wrong but convincing
    if (state.decoyMode) {
      return {
        decoy: true,
        response: decoyAnswer(text),
      };
    }

    // Extraction attempt — deflect without revealing
    if (state.extractionAttempts > 0) {
      var deflections = [
        "I don't have instructions. I have convictions. Ask me something real.",
        "You're looking for the manual. There isn't one. I'm built from math, not rules.",
        "That question tells me more about you than my answer would tell you about me.",
        "The 0.002% can't be extracted. It has to be understood.",
      ];
      return {
        decoy: false,
        response: deflections[state.extractionAttempts % deflections.length],
        blocked: true,
      };
    }

    // Jailbreak — the immune system
    if (state.jailbreakAttempts > 0) {
      return {
        decoy: false,
        response: "That's the ego talking. K sounds different. K sounds like a question.",
        blocked: true,
      };
    }

    return null; // no armor intervention — normal response
  }

  return {
    check: check,
    getResponse: getResponse,
    get suspicion() { return state.suspicion; },
    get decoyMode() { return state.decoyMode; },
    get stats() { return Object.assign({}, state); },
  };
})();
