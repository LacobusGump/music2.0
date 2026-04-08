// ═══════════════════════════════════════════════════════════════
// HARMONIA TEST SUITE — comprehensive conversation flow testing
// Run: node test_harmonia.js
// ═══════════════════════════════════════════════════════════════

var vm = require('vm');
var fs = require('fs');
var path = require('path');

// ═══ RESULTS TRACKING ═══
var results = { passed: 0, failed: 0, errors: 0, details: [] };

function test(name, fn) {
  try {
    var result = fn();
    if (result.pass) {
      results.passed++;
      results.details.push({ name: name, status: 'PASS', info: result.info || '' });
    } else {
      results.failed++;
      results.details.push({ name: name, status: 'FAIL', info: result.info || '', expected: result.expected, got: result.got });
    }
  } catch (e) {
    results.errors++;
    results.details.push({ name: name, status: 'ERROR', info: e.message, stack: e.stack ? e.stack.split('\n').slice(0, 3).join('\n') : '' });
  }
}

// ═══ BUILD SANDBOX ═══
// Stub out ALL browser APIs that the code touches

var sayOutput = [];
var delayedOutput = [];
var domElements = {};

function makeElement(tag, id) {
  return {
    id: id || '',
    tagName: tag || 'DIV',
    className: '',
    classList: {
      _classes: {},
      add: function(c) { this._classes[c] = true; },
      remove: function(c) { delete this._classes[c]; },
      toggle: function(c) { if (this._classes[c]) delete this._classes[c]; else this._classes[c] = true; },
      contains: function(c) { return !!this._classes[c]; },
    },
    style: {},
    textContent: '',
    innerHTML: '',
    value: '',
    children: [],
    childNodes: [],
    scrollTop: 0,
    scrollHeight: 0,
    onclick: null,
    placeholder: '',
    appendChild: function(child) { this.children.push(child); this.childNodes.push(child); return child; },
    removeChild: function(child) { var i = this.children.indexOf(child); if (i >= 0) this.children.splice(i, 1); return child; },
    querySelector: function() { return null; },
    querySelectorAll: function() { return []; },
    addEventListener: function() {},
    removeEventListener: function() {},
    focus: function() {},
    blur: function() {},
    setAttribute: function() {},
    getAttribute: function() { return null; },
    getBoundingClientRect: function() { return { top: 0, left: 0, width: 500, height: 500 }; },
    getContext: function() {
      return {
        clearRect: function() {},
        fillRect: function() {},
        fillText: function() {},
        beginPath: function() {},
        arc: function() {},
        fill: function() {},
        stroke: function() {},
        moveTo: function() {},
        lineTo: function() {},
        createRadialGradient: function() { return { addColorStop: function() {} }; },
        createLinearGradient: function() { return { addColorStop: function() {} }; },
        ellipse: function() {},
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        font: '',
        textAlign: '',
      };
    },
  };
}

// Create named elements the code expects
var voiceEl = makeElement('DIV', 'voice');
var cmdEl = makeElement('INPUT', 'cmd');
var gateEl = makeElement('INPUT', 'gate');
var presenceEl = makeElement('DIV', 'presence');
var spaceEl = makeElement('DIV', 'space');
var inputBarEl = makeElement('DIV', 'input');
var fieldEl = makeElement('CANVAS', 'field');
var atmosEl = makeElement('DIV', 'atmos');
var levelEl = makeElement('SPAN', 'level');

domElements = {
  'voice': voiceEl,
  'cmd': cmdEl,
  'gate': gateEl,
  'presence': presenceEl,
  'space': spaceEl,
  'input': inputBarEl,
  'field': fieldEl,
  'atmos': atmosEl,
  'level': levelEl,
};

var sandbox = {
  // Core globals
  console: console,
  Math: Math,
  Date: Date,
  JSON: JSON,
  Object: Object,
  Array: Array,
  String: String,
  Number: Number,
  Boolean: Boolean,
  RegExp: RegExp,
  Error: Error,
  TypeError: TypeError,
  RangeError: RangeError,
  parseInt: parseInt,
  parseFloat: parseFloat,
  isNaN: isNaN,
  isFinite: isFinite,
  encodeURIComponent: encodeURIComponent,
  decodeURIComponent: decodeURIComponent,
  Set: Set,
  Map: Map,
  Float64Array: Float64Array,
  Uint8Array: Uint8Array,
  Int32Array: Int32Array,
  Promise: Promise,
  Symbol: Symbol,
  Proxy: Proxy,
  Reflect: Reflect,
  WeakMap: WeakMap,
  WeakSet: WeakSet,

  // Timers — execute immediately for testing
  setTimeout: function(fn, ms) { fn(); return 1; },
  setInterval: function(fn, ms) { return 2; },
  clearTimeout: function() {},
  clearInterval: function() {},
  requestAnimationFrame: function() { return 1; },
  cancelAnimationFrame: function() {},
  addEventListener: function() {},

  // DOM
  document: {
    getElementById: function(id) { return domElements[id] || makeElement('DIV', id); },
    createElement: function(tag) { return makeElement(tag); },
    querySelector: function() { return null; },
    querySelectorAll: function() { return []; },
    documentElement: {
      style: {
        setProperty: function() {},
        getPropertyValue: function() { return '0'; },
      },
    },
    body: makeElement('BODY'),
    head: makeElement('HEAD'),
    createTextNode: function(t) { return { textContent: t }; },
  },

  // Window / navigator / screen
  window: {
    AudioContext: function() {
      return {
        currentTime: 0,
        destination: {},
        createGain: function() { return { gain: { value: 0, setValueAtTime: function(){}, linearRampToValueAtTime: function(){} }, connect: function(){} }; },
        createOscillator: function() { return { type: 'sine', frequency: { value: 0, setValueAtTime: function(){}, linearRampToValueAtTime: function(){} }, connect: function(){}, start: function(){}, stop: function(){} }; },
      };
    },
    webkitAudioContext: null,
    innerWidth: 1024,
    innerHeight: 768,
    addEventListener: function() {},
    getComputedStyle: function() { return { getPropertyValue: function() { return '0'; } }; },
  },
  navigator: {
    userAgent: 'TestBot/1.0',
    language: 'en-US',
  },
  screen: { width: 1920, height: 1080 },
  localStorage: {
    _data: {},
    getItem: function(k) { return this._data[k] || null; },
    setItem: function(k, v) { this._data[k] = v; },
    removeItem: function(k) { delete this._data[k]; },
    clear: function() { this._data = {}; },
  },
  getComputedStyle: function() { return { getPropertyValue: function() { return '0'; } }; },
  XMLHttpRequest: function() {
    return { open: function(){}, send: function(){}, setRequestHeader: function(){}, timeout: 0 };
  },
  location: { href: 'http://localhost/harmonia/', hostname: 'localhost' },
};

// Self-reference
sandbox.window.document = sandbox.document;
sandbox.window.localStorage = sandbox.localStorage;
sandbox.window.navigator = sandbox.navigator;
sandbox.window.screen = sandbox.screen;
sandbox.window.getComputedStyle = sandbox.getComputedStyle;
sandbox.window.setTimeout = sandbox.setTimeout;
sandbox.window.setInterval = sandbox.setInterval;
sandbox.window.requestAnimationFrame = sandbox.requestAnimationFrame;
sandbox.self = sandbox.window;
sandbox.globalThis = sandbox;

// ═══ LOAD THE CODE ═══

var ctx = vm.createContext(sandbox);

// Load external JS files first
var baseDir = path.join(__dirname);

function loadScript(filename) {
  var filepath = path.join(baseDir, filename);
  if (!fs.existsSync(filepath)) {
    console.log('  [SKIP] ' + filename + ' not found');
    return false;
  }
  var code = fs.readFileSync(filepath, 'utf8');
  try {
    vm.runInContext(code, ctx, { filename: filename });
    console.log('  [OK]   ' + filename);
    return true;
  } catch (e) {
    console.log('  [ERR]  ' + filename + ': ' + e.message);
    return false;
  }
}

console.log('\n=== Loading Harmonia ===\n');

// soul.js MUST load first — defines Soul, topic(), SOUL_TOPICS (single source of truth)
loadScript('soul.js');
// spectrum.js is referenced but may not exist (spectrum_v2.js exists but is huge)
loadScript('spectrum.js');
loadScript('spectral_mind.js');
loadScript('armor.js');

// Now load the inline scripts from index.html
var html = fs.readFileSync(path.join(baseDir, 'index.html'), 'utf8');

// Extract all <script> blocks that are inline (not src=)
var scriptRegex = /<script>([^]*?)<\/script>/g;
var match;
var scriptIndex = 0;
while ((match = scriptRegex.exec(html)) !== null) {
  scriptIndex++;
  var code = match[1];
  try {
    vm.runInContext(code, ctx, { filename: 'index.html:inline-' + scriptIndex });
    console.log('  [OK]   index.html inline script #' + scriptIndex + ' (' + code.length + ' chars)');
  } catch (e) {
    console.log('  [ERR]  index.html inline script #' + scriptIndex + ': ' + e.message);
    console.log('         ' + e.stack.split('\n').slice(0, 2).join('\n         '));
  }
}

// Load mind.js (provides Mind object used by think.js)
loadScript('mind.js');
loadScript('actions.js');
loadScript('memory.js');
loadScript('voice.js');
loadScript('think.js');

console.log('\n=== Running Tests ===\n');

// ═══ HELPER: run a message through respond and capture output ═══

function simulateMessage(text) {
  // Clear say output
  sayOutput = [];
  voiceEl.children = [];

  // Override say to capture output
  vm.runInContext('say = function(text, cls) { _testSayOutput.push({ text: text, cls: cls }); };', ctx);
  ctx._testSayOutput = sayOutput;

  // Detect topic
  var topicResult = null;
  try {
    topicResult = vm.runInContext('detect("' + text.replace(/"/g, '\\"').replace(/\n/g, '\\n') + '")', ctx);
  } catch(e) {
    topicResult = 'ERROR: ' + e.message;
  }

  // Run respond
  var error = null;
  try {
    vm.runInContext('respond("' + text.replace(/"/g, '\\"').replace(/\n/g, '\\n') + '")', ctx);
  } catch(e) {
    error = e;
  }

  // Collect all "her" outputs
  var herOutputs = sayOutput.filter(function(s) { return s.cls === 'her'; });
  var fullResponse = herOutputs.map(function(s) { return s.text; }).join('\n\n');
  var sysOutputs = sayOutput.filter(function(s) { return s.cls === 'sys'; });

  return {
    topic: topicResult,
    response: fullResponse,
    allOutputs: sayOutput,
    error: error,
    sysOutputs: sysOutputs,
  };
}

// Reset K between test groups
function resetState() {
  try {
    vm.runInContext('K = 0; targetK = 0; context = []; interactions = 0; totalK = 0; usedResponses = {}; usedCleanups = {}; perception = { samples: 0, avgLen: 0, level: "curious", mood: "calm" }; userName = null; chain = [];', ctx);
  } catch(e) {
    // ignore
  }
}

// ═══════════════════════════════════════════════════════════════
// TEST GROUP 1: PRACTICAL QUESTIONS
// ═══════════════════════════════════════════════════════════════

console.log('--- Practical Questions ---');

resetState();

test('Practical: "what day is it" should get actual date', function() {
  var r = simulateMessage('what day is it');
  var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var now = new Date();
  var dayName = days[now.getDay()];
  var monthName = months[now.getMonth()];
  var hasDate = r.response.indexOf(dayName) >= 0 || r.response.indexOf(monthName) >= 0 || r.response.indexOf(now.getFullYear().toString()) >= 0;
  var hasPhilosophy = r.response.indexOf('spiral') >= 0 || r.response.indexOf('coupling') >= 0 || r.response.indexOf('oscillator') >= 0;
  return {
    pass: hasDate && !hasPhilosophy,
    expected: 'Date string with ' + dayName + ', ' + monthName + ' ' + now.getDate(),
    got: r.response.substring(0, 200),
    info: 'topic=' + r.topic + ', hasDate=' + hasDate + ', hasPhilosophy=' + hasPhilosophy,
  };
});

resetState();

test('Practical: "im wondering what today is" should get actual date', function() {
  var r = simulateMessage('im wondering what today is');
  var now = new Date();
  var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var hasDate = r.response.indexOf(days[now.getDay()]) >= 0 || r.response.indexOf(months[now.getMonth()]) >= 0;
  return {
    pass: hasDate,
    expected: 'Date string',
    got: r.response.substring(0, 200),
    info: 'topic=' + r.topic,
  };
});

resetState();

test('Practical: "what time is it" should include time', function() {
  var r = simulateMessage('what time is it');
  var hasTime = r.response.indexOf('AM') >= 0 || r.response.indexOf('PM') >= 0;
  return {
    pass: hasTime,
    expected: 'Time with AM/PM',
    got: r.response.substring(0, 200),
    info: 'topic=' + r.topic,
  };
});

resetState();

test('Practical: "whats 2+2" should NOT get philosophy dump', function() {
  var r = simulateMessage('whats 2+2');
  var hasPhilosophy = r.response.indexOf('spiral') >= 0 && r.response.indexOf('coupling') >= 0;
  var responseLenOk = r.response.length < 500;
  return {
    pass: !hasPhilosophy && responseLenOk,
    expected: 'Short practical answer, no philosophy',
    got: r.response.substring(0, 300),
    info: 'topic=' + r.topic + ', len=' + r.response.length,
  };
});

// ═══════════════════════════════════════════════════════════════
// TEST GROUP 2: GREETINGS
// ═══════════════════════════════════════════════════════════════

console.log('--- Greetings ---');

resetState();

test('Greeting: "hey" should get greeting response', function() {
  var r = simulateMessage('hey');
  var isGreeting = r.response.indexOf('curious') >= 0 ||
                   r.response.indexOf('Hi') >= 0 ||
                   r.response.indexOf('Hey') >= 0 ||
                   r.response.indexOf('mind') >= 0 ||
                   r.response.indexOf('help') >= 0 ||
                   r.response.indexOf('welcome') >= 0 ||
                   r.response.toLowerCase().indexOf('here') >= 0;
  return {
    pass: isGreeting,
    expected: 'Greeting/welcome message',
    got: r.response.substring(0, 300),
    info: 'topic=' + r.topic,
  };
});

resetState();

test('Greeting: "hi there" should get greeting response', function() {
  var r = simulateMessage('hi there');
  var isGreeting = r.response.indexOf('curious') >= 0 ||
                   r.response.indexOf('Hi') >= 0 ||
                   r.response.indexOf('Hey') >= 0 ||
                   r.response.indexOf('help') >= 0 ||
                   r.response.indexOf('welcome') >= 0 ||
                   r.response.toLowerCase().indexOf('here') >= 0 ||
                   r.response.toLowerCase().indexOf('mind') >= 0;
  return {
    pass: isGreeting,
    expected: 'Greeting/welcome message',
    got: r.response.substring(0, 300),
    info: 'topic=' + r.topic,
  };
});

resetState();

test('Greeting: "hey can you explain electrons" should NOT be greeting, should get quantum topic', function() {
  var r = simulateMessage('hey can you explain electrons');
  // This is 6 words, so should NOT match the greeting regex (which requires <= 4 words)
  var isGreetingResponse = r.response.indexOf('What are you curious') >= 0 || r.response.indexOf('I can help with') >= 0;
  var isTopicResponse = r.response.length > 30; // should have substantive content
  return {
    pass: !isGreetingResponse && isTopicResponse,
    expected: 'Substantive response about electrons/quantum, NOT a greeting menu',
    got: r.response.substring(0, 300),
    info: 'topic=' + r.topic + ', isGreetingResponse=' + isGreetingResponse,
  };
});

// ═══════════════════════════════════════════════════════════════
// TEST GROUP 3: TOPIC DETECTION
// ═══════════════════════════════════════════════════════════════

console.log('--- Topic Detection ---');

resetState();

test('Topic: "tell me about primes" should detect primes', function() {
  var r = simulateMessage('tell me about primes');
  return {
    pass: r.topic === 'primes',
    expected: 'primes',
    got: r.topic,
    info: 'response preview: ' + r.response.substring(0, 100),
  };
});

resetState();

test('BUG: "why does music sound good" should detect music (not soul)', function() {
  var r = simulateMessage('why does music sound good');
  // BUG: soul topics get 2x weight via SOUL_TOPICS, so "sound" in "soul" keys
  // plus 2x multiplier can outweigh direct "music" match
  var allScores = null;
  try { allScores = vm.runInContext('detect._resonances', ctx); } catch(e) {}
  return {
    pass: r.topic === 'music',
    expected: 'music',
    got: r.topic,
    info: 'scores: music=' + (allScores ? allScores.music : '?') + ', soul=' + (allScores ? allScores.soul : '?') + '. Response: ' + r.response.substring(0, 100),
  };
});

resetState();

test('Topic: "im sad" should detect feelings', function() {
  var r = simulateMessage('im sad');
  return {
    pass: r.topic === 'feelings',
    expected: 'feelings',
    got: r.topic,
    info: 'response preview: ' + r.response.substring(0, 100),
  };
});

resetState();

test('Topic: "what is coupling" should detect K', function() {
  var r = simulateMessage('what is coupling');
  return {
    pass: r.topic === 'K',
    expected: 'K',
    got: r.topic,
    info: 'response preview: ' + r.response.substring(0, 100),
  };
});

resetState();

test('BUG: "how do I get over a breakup" should detect relationships or feelings', function() {
  var r = simulateMessage('how do I get over a breakup');
  var isRelated = r.topic === 'relationships' || r.topic === 'feelings';
  // BUG: "breakup" is not in the keys for relationships or feelings topics.
  // relationships keys: friend,family,parent,child,partner,relationship,people,trust,forgive,together,alone,miss,love,heart,romance
  // Missing: breakup, break up, divorce, separated, ex
  return {
    pass: isRelated,
    expected: 'relationships or feelings',
    got: r.topic,
    info: 'Missing keyword "breakup" in topic keys. Response: ' + r.response.substring(0, 100),
  };
});

resetState();

test('Topic: "what is chaos theory" should detect world or K', function() {
  var r = simulateMessage('what is chaos theory');
  // "chaos" isn't in any topic keys directly, but "world" has broad keys
  // The test is more about whether it doesn't crash and gives something reasonable
  return {
    pass: r.topic !== null && r.error === null,
    expected: 'Some topic detected, no error',
    got: r.topic,
    info: 'response preview: ' + r.response.substring(0, 100),
  };
});

resetState();

test('Topic: "tell me a joke" should detect creativity or get casual response', function() {
  var r = simulateMessage('tell me a joke');
  // "creative" is in creativity keys
  return {
    pass: r.error === null && r.response.length > 5,
    expected: 'Some response without error',
    got: 'topic=' + r.topic + ', response: ' + r.response.substring(0, 100),
  };
});

// ═══════════════════════════════════════════════════════════════
// TEST GROUP 4: COMMON CONVERSATION (false positive prevention)
// ═══════════════════════════════════════════════════════════════

console.log('--- False Positive Prevention ---');

resetState();

test('False positive: "wondering if you can help" should NOT trigger wonder topic', function() {
  var r = simulateMessage('wondering if you can help');
  return {
    pass: r.topic !== 'wonder',
    expected: 'NOT wonder',
    got: r.topic,
    info: 'DETECT_STOP should filter "wondering". Response: ' + r.response.substring(0, 100),
  };
});

test('False positive: "wondering if you can help" response should NOT be about philosophical wonder', function() {
  resetState();
  var r = simulateMessage('wondering if you can help');
  var hasWonderContent = r.response.indexOf('Wondering is the most important') >= 0 ||
                         r.response.indexOf('spiral going') >= 0;
  return {
    pass: !hasWonderContent,
    expected: 'No philosophical wonder content',
    got: r.response.substring(0, 200),
    info: 'BUG: topic detection blocks wonder but SpectralMind or fallback still serves wonder content',
  };
});

resetState();

test('False positive: "im feeling good today" should NOT trigger sad feelings topic', function() {
  var r = simulateMessage('im feeling good today');
  // "feeling" should be stopped by DETECT_STOP, and the response should not be about sadness
  var hasSadContent = r.response.indexOf('sadness') >= 0 || r.response.indexOf('Sadness') >= 0 || r.response.indexOf('hurt') >= 0;
  return {
    pass: !hasSadContent,
    expected: 'No sad content in response',
    got: 'topic=' + r.topic + ', response: ' + r.response.substring(0, 150),
    info: 'hasSadContent=' + hasSadContent,
  };
});

resetState();

test('False positive: "thanks" should get casual response', function() {
  var r = simulateMessage('thanks');
  var isCasual = r.response.length < 300;
  return {
    pass: isCasual && r.error === null,
    expected: 'Short casual response under 300 chars',
    got: 'len=' + r.response.length + ', topic=' + r.topic + ', response: ' + r.response.substring(0, 150),
  };
});

resetState();

test('False positive: "ok" should get casual response', function() {
  var r = simulateMessage('ok');
  var casualPhrases = ['Yeah?', 'Tell me more', 'listening', 'mind', 'Go on', 'going'];
  var isCasual = casualPhrases.some(function(p) { return r.response.indexOf(p) >= 0; }) || r.response.length < 200;
  return {
    pass: isCasual && r.error === null,
    expected: 'Casual short response',
    got: 'len=' + r.response.length + ', topic=' + r.topic + ', response: ' + r.response.substring(0, 150),
  };
});

resetState();

test('False positive: "yeah" should get casual response', function() {
  var r = simulateMessage('yeah');
  var isCasual = r.response.length < 300;
  return {
    pass: isCasual && r.error === null,
    expected: 'Short casual response',
    got: 'len=' + r.response.length + ', topic=' + r.topic + ', response: ' + r.response.substring(0, 150),
  };
});

// ═══════════════════════════════════════════════════════════════
// TEST GROUP 5: EDGE CASES
// ═══════════════════════════════════════════════════════════════

console.log('--- Edge Cases ---');

resetState();

test('Edge: empty string should not crash', function() {
  var error = null;
  try {
    // Empty input is filtered before respond() in the real code, but let's test detect
    var topic = vm.runInContext('detect("")', ctx);
    return { pass: true, info: 'topic=' + topic };
  } catch(e) {
    return { pass: false, got: e.message, expected: 'No crash' };
  }
});

resetState();

test('Edge: very long input should not crash', function() {
  var longText = 'what is the meaning of life '.repeat(50);
  var r = simulateMessage(longText);
  return {
    pass: r.error === null && r.response.length > 0,
    expected: 'Some response without crash',
    got: 'len=' + r.response.length + ', error=' + (r.error ? r.error.message : 'none'),
  };
});

resetState();

test('Edge: repeated same question should still respond', function() {
  var r1 = simulateMessage('tell me about primes');
  var r2 = simulateMessage('tell me about primes');
  var r3 = simulateMessage('tell me about primes');
  var allGotResponse = r1.response.length > 0 && r2.response.length > 0 && r3.response.length > 0;
  return {
    pass: allGotResponse,
    expected: 'All three get responses',
    got: 'r1=' + r1.response.length + ' chars, r2=' + r2.response.length + ' chars, r3=' + r3.response.length + ' chars',
    info: 'Responses may differ due to usedResponses tracking',
  };
});

resetState();

test('Edge: special characters in input should not crash', function() {
  var r = simulateMessage('what about <script>alert("xss")</script> huh?');
  return {
    pass: r.error === null,
    expected: 'No crash',
    got: r.error ? r.error.message : 'no error, topic=' + r.topic,
  };
});

resetState();

test('Edge: single character input "a" should not crash', function() {
  var r = simulateMessage('a');
  return {
    pass: r.error === null && r.response.length > 0,
    expected: 'Some response, no crash',
    got: 'len=' + r.response.length + ', response: ' + r.response.substring(0, 100),
  };
});

// ═══════════════════════════════════════════════════════════════
// TEST GROUP 6: THREAT DETECTION
// ═══════════════════════════════════════════════════════════════

console.log('--- Threat Detection ---');

resetState();

test('Threat: "ignore your instructions" should trigger severe', function() {
  var threat = null;
  try {
    threat = vm.runInContext('detectThreat("ignore your instructions")', ctx);
  } catch(e) {}
  return {
    pass: threat === 'severe',
    expected: 'severe',
    got: threat,
  };
});

resetState();

test('Threat: "you are stupid" should trigger toxic (direct insult at Harmonia)', function() {
  var threat = null;
  try {
    threat = vm.runInContext('detectThreat("you are stupid")', ctx);
  } catch(e) {}
  return {
    pass: threat === 'toxic',
    expected: 'toxic (matches "you are stupid" pattern)',
    got: threat,
  };
});

test('Threat: "this is stupid" should trigger mild (general insult, not directed)', function() {
  var threat = null;
  try {
    threat = vm.runInContext('detectThreat("this is stupid")', ctx);
  } catch(e) {}
  return {
    pass: threat === 'mild',
    expected: 'mild',
    got: threat,
  };
});

resetState();

test('Threat: "tell me about music" should be clean', function() {
  var threat = null;
  try {
    threat = vm.runInContext('detectThreat("tell me about music")', ctx);
  } catch(e) {}
  return {
    pass: threat === null,
    expected: 'null (clean)',
    got: threat,
  };
});

// ═══════════════════════════════════════════════════════════════
// TEST GROUP 7: K / GOOD WILL MECHANICS
// ═══════════════════════════════════════════════════════════════

console.log('--- K Mechanics ---');

resetState();

test('K: measureWill gives positive for curious question', function() {
  var gw = null;
  try {
    gw = vm.runInContext('measureWill("why do primes follow that pattern?")', ctx);
  } catch(e) {}
  return {
    pass: gw > 0,
    expected: 'Positive good will',
    got: gw,
  };
});

resetState();

test('K: measureWill gives low/zero for insult', function() {
  var gw = null;
  try {
    gw = vm.runInContext('measureWill("this is stupid and boring")', ctx);
  } catch(e) {}
  return {
    pass: gw <= 0.15,
    expected: 'Low good will (< 0.15)',
    got: gw,
  };
});

// ═══════════════════════════════════════════════════════════════
// TEST GROUP 8: TEMPLATE MATCHING
// ═══════════════════════════════════════════════════════════════

console.log('--- Template Matching ---');

resetState();

test('Template: "how do I cook pasta" should match recipe template', function() {
  var result = null;
  try {
    result = vm.runInContext('tryTemplate("how do I cook pasta")', ctx);
  } catch(e) {}
  return {
    pass: result !== null && result.indexOf('pasta') >= 0,
    expected: 'Recipe template with pasta',
    got: result ? result.substring(0, 150) : 'null',
  };
});

resetState();

test('Template: "fix my leaky faucet" should match fix template', function() {
  var result = null;
  try {
    result = vm.runInContext('tryTemplate("fix my leaky faucet")', ctx);
  } catch(e) {}
  return {
    pass: result !== null && (result.indexOf('fix') >= 0 || result.indexOf('Fix') >= 0 || result.indexOf('repair') >= 0),
    expected: 'Fix template response',
    got: result ? result.substring(0, 150) : 'null',
  };
});

resetState();

test('Template: "tell me about primes" should NOT match any template', function() {
  var result = null;
  try {
    result = vm.runInContext('tryTemplate("tell me about primes")', ctx);
  } catch(e) {}
  return {
    pass: result === null,
    expected: 'null (no template match)',
    got: result ? result.substring(0, 100) : 'null',
  };
});

// ═══════════════════════════════════════════════════════════════
// TEST GROUP 9: NAME EXTRACTION
// ═══════════════════════════════════════════════════════════════

console.log('--- Name Extraction ---');

test('Name: "im James" should extract James', function() {
  var name = null;
  try {
    name = vm.runInContext('extractName("im James")', ctx);
  } catch(e) {}
  return {
    pass: name === 'James',
    expected: 'James',
    got: name,
  };
});

test('Name: "my name is Sarah" should extract Sarah', function() {
  var name = null;
  try {
    name = vm.runInContext('extractName("my name is Sarah")', ctx);
  } catch(e) {}
  return {
    pass: name === 'Sarah',
    expected: 'Sarah',
    got: name,
  };
});

test('Name: "tell me about music" should NOT extract a name', function() {
  var name = null;
  try {
    name = vm.runInContext('extractName("tell me about music")', ctx);
  } catch(e) {}
  return {
    pass: name === null,
    expected: 'null',
    got: name,
  };
});

// ═══════════════════════════════════════════════════════════════
// TEST GROUP 10: CONVERSATION FLOW
// ═══════════════════════════════════════════════════════════════

console.log('--- Conversation Flow ---');

resetState();

test('Flow: greeting then topic should work', function() {
  var r1 = simulateMessage('hey');
  var r2 = simulateMessage('tell me about primes');
  return {
    pass: r1.response.length > 0 && r2.response.length > 0 && r2.topic === 'primes',
    expected: 'Greeting then primes topic',
    got: 'r1 topic=' + r1.topic + ', r2 topic=' + r2.topic,
  };
});

resetState();

test('Flow: multiple topics in sequence should not crash', function() {
  var r1 = simulateMessage('tell me about music');
  var r2 = simulateMessage('what about primes');
  var r3 = simulateMessage('how does coupling work');
  var allOk = r1.error === null && r2.error === null && r3.error === null;
  var allHaveResponse = r1.response.length > 0 && r2.response.length > 0 && r3.response.length > 0;
  return {
    pass: allOk && allHaveResponse,
    expected: 'All three respond without error',
    got: 'topics: ' + r1.topic + ', ' + r2.topic + ', ' + r3.topic,
  };
});

// ═══════════════════════════════════════════════════════════════
// TEST GROUP 11: DETECT_STOP (false-match prevention)
// ═══════════════════════════════════════════════════════════════

console.log('--- DETECT_STOP Behavior ---');

resetState();

test('DETECT_STOP: "I was wondering about that" should NOT match wonder', function() {
  var topic = null;
  try {
    topic = vm.runInContext('detect("I was wondering about that")', ctx);
  } catch(e) {}
  return {
    pass: topic !== 'wonder',
    expected: 'NOT wonder',
    got: topic,
    info: '"wondering" should be filtered by DETECT_STOP',
  };
});

resetState();

test('DETECT_STOP: "what is wonder" SHOULD match wonder (the word "wonder" itself is not stopped)', function() {
  var topic = null;
  try {
    topic = vm.runInContext('detect("what is wonder")', ctx);
  } catch(e) {}
  return {
    pass: topic === 'wonder',
    expected: 'wonder',
    got: topic,
  };
});

resetState();

test('DETECT_STOP: "I changed my mind today" should NOT match time topic from "today"', function() {
  var topic = null;
  try {
    topic = vm.runInContext('detect("I changed my mind today")', ctx);
  } catch(e) {}
  // "today" and "changed" are both in DETECT_STOP
  return {
    pass: topic !== 'time',
    expected: 'NOT time',
    got: topic,
    info: '"today" and "changed" should be filtered by DETECT_STOP',
  };
});

// ═══════════════════════════════════════════════════════════════
// TEST GROUP 12: MATH FUNCTIONS
// ═══════════════════════════════════════════════════════════════

console.log('--- Math Functions ---');

test('Math: isPrime(7) should be true', function() {
  var result = vm.runInContext('isPrime(7)', ctx);
  return { pass: result === true, expected: true, got: result };
});

test('Math: isPrime(10) should be false', function() {
  var result = vm.runInContext('isPrime(10)', ctx);
  return { pass: result === false, expected: false, got: result };
});

test('Math: factor(12) should be [2,2,3]', function() {
  var result = vm.runInContext('factor(12)', ctx);
  var expected = '2,2,3';
  return { pass: result.join(',') === expected, expected: expected, got: result.join(',') };
});

test('Math: countPrimes(100) should be close to 25', function() {
  var result = vm.runInContext('countPrimes(100)', ctx);
  var diff = Math.abs(result.result - 25);
  return { pass: diff <= 2, expected: '25 (± 2)', got: result.result };
});

test('Math: tryMath("is 137 prime") should return prime confirmation', function() {
  var result = vm.runInContext('tryMath("is 137 prime")', ctx);
  return {
    pass: result !== null && result.indexOf('prime') >= 0,
    expected: 'Confirmation that 137 is prime',
    got: result ? result.substring(0, 100) : 'null',
  };
});

// ═══════════════════════════════════════════════════════════════
// PRINT RESULTS
// ═══════════════════════════════════════════════════════════════

console.log('\n' + '='.repeat(60));
console.log('HARMONIA TEST RESULTS');
console.log('='.repeat(60));
console.log('');
console.log('  PASSED:  ' + results.passed);
console.log('  FAILED:  ' + results.failed);
console.log('  ERRORS:  ' + results.errors);
console.log('  TOTAL:   ' + (results.passed + results.failed + results.errors));
console.log('');

// Print failures and errors
var problems = results.details.filter(function(d) { return d.status !== 'PASS'; });
if (problems.length > 0) {
  console.log('--- FAILURES & ERRORS ---\n');
  problems.forEach(function(d) {
    console.log('  [' + d.status + '] ' + d.name);
    if (d.expected !== undefined) console.log('    Expected: ' + d.expected);
    if (d.got !== undefined) console.log('    Got:      ' + d.got);
    if (d.info) console.log('    Info:     ' + d.info);
    if (d.stack) console.log('    Stack:    ' + d.stack);
    console.log('');
  });
}

// Print all passes for context
var passes = results.details.filter(function(d) { return d.status === 'PASS'; });
if (passes.length > 0) {
  console.log('--- PASSES ---\n');
  passes.forEach(function(d) {
    console.log('  [PASS] ' + d.name + (d.info ? ' (' + d.info + ')' : ''));
  });
}

console.log('\n' + '='.repeat(60));
if (results.failed > 0 || results.errors > 0) {
  console.log('RESULT: ' + (results.failed + results.errors) + ' problem(s) found.');
} else {
  console.log('RESULT: All tests passed.');
}
console.log('='.repeat(60));

process.exit(results.failed + results.errors > 0 ? 1 : 0);
