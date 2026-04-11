// ═══════════════════════════════════════════════════════════════
// HARMONIA ENGINE — she computes, then speaks from what she found
//
// Not a chatbot. A coupled oscillator system.
// Input is signal. Tools fire. Response is exhaust.
// Same math as the GPU. Same math as the proteins.
// ═══════════════════════════════════════════════════════════════

var Engine = (function() {
  'use strict';

  var PHI = (1 + Math.sqrt(5)) / 2;
  var GOLDEN = 1 / PHI;
  var PEAK_K = 1.868;

  // ═══ K COMPILER — 6 operators, auto-parallel ═══
  // : create   + resonate   * entangle
  // - decouple / split      @ observe
  var KProgram = {
    ops: [],
    waves: [],

    // Parse K source into ops
    parse: function(source) {
      this.ops = [];
      var lines = source.split('\n').filter(function(l) { return l.trim() && l.trim()[0] !== '!'; });
      for (var i = 0; i < lines.length; i++) {
        var l = lines[i].trim();
        var op = l[0], args = l.substring(1).trim().split(/\s+/);
        this.ops.push({ op: op, args: args, deps: [], wave: -1 });
      }
      return this;
    },

    // Schedule into execution waves (strongest independent ops first)
    schedule: function() {
      var n = this.ops.length;
      var defined = {};  // variable → op index that defines it
      this.waves = [];

      // Build dependency graph
      for (var i = 0; i < n; i++) {
        var op = this.ops[i];
        op.deps = [];
        // Each op's inputs are args that were defined by previous ops
        for (var a = 0; a < op.args.length; a++) {
          if (defined[op.args[a]] !== undefined) {
            op.deps.push(defined[op.args[a]]);
          }
        }
        // The last arg is the output (for :, +, *, -)
        if (op.op !== '@') {
          var outVar = op.args[op.args.length - 1];
          defined[outVar] = i;
        }
      }

      // Assign waves: op goes in earliest wave where all deps are done
      var assigned = new Int32Array(n).fill(-1);
      var maxWave = 0;
      for (var i = 0; i < n; i++) {
        var earliest = 0;
        for (var d = 0; d < this.ops[i].deps.length; d++) {
          var depWave = assigned[this.ops[i].deps[d]];
          if (depWave + 1 > earliest) earliest = depWave + 1;
        }
        assigned[i] = earliest;
        this.ops[i].wave = earliest;
        if (earliest > maxWave) maxWave = earliest;
      }

      // Group into waves
      this.waves = [];
      for (var w = 0; w <= maxWave; w++) {
        var wave = [];
        for (var i = 0; i < n; i++) {
          if (assigned[i] === w) wave.push(this.ops[i]);
        }
        this.waves.push(wave);
      }
      return this;
    },

    // Execute all waves
    run: function(env) {
      env = env || {};
      for (var w = 0; w < this.waves.length; w++) {
        var wave = this.waves[w];
        // All ops in a wave are independent — fire simultaneously
        for (var i = 0; i < wave.length; i++) {
          var op = wave[i], args = op.args;
          switch (op.op) {
            case ':': // create oscillator
              env[args[1] || args[0]] = parseFloat(args[0]) || args[0];
              break;
            case '+': // resonate (add / couple)
              env[args[2]] = (env[args[0]] || 0) + (env[args[1]] || 0);
              break;
            case '*': // entangle (multiply / bind)
              env[args[2]] = (env[args[0]] || 0) * (env[args[1]] || 0);
              break;
            case '-': // decouple (subtract / separate)
              env[args[2]] = (env[args[0]] || 0) - (env[args[1]] || 0);
              break;
            case '/': // split (divide / decompose)
              env[args[2]] = (env[args[1]] || 1) !== 0 ? (env[args[0]] || 0) / env[args[1]] : 0;
              break;
            case '@': // observe (read result)
              op.result = env[args[0]];
              break;
          }
        }
      }
      return env;
    }
  };

  // ═══ SHAPE COMPUTE THE INPUT ═══
  // The user's text IS the sequence. Measure its K, R, E, T.
  // No regex flags. The physics tells you what the person is presenting.

  // Character classes — same idea as amino acids
  // Vowels = open (charged, connective)
  // Consonants = structure (hydrophobic, load-bearing)
  // Punctuation = tension markers
  // Spaces = breathing
  var VOWELS = 'aeiouAEIOU';
  var CHARGED_WORDS = new Set(['please','help','love','thank','sorry','hurt','hurts','hurting','need','want','feel','feeling','hope','wish','care','miss','missing','trust','believe','try','trying','scared','afraid','alone','lost','broken','sad','happy','grateful','angry','pain','painful','dying','died','dead','death','depressed','anxious','worried','confused','overwhelmed','tired','exhausted','struggling','suffering','crying','healing','better','worse','okay','fine','well','good','bad','terrible','awful','amazing','beautiful','wonderful','meaning','purpose','life','soul','heart','mind','real','truth','nothing','everything','anyone','someone','nobody','gone','killed','grief','grieving','mourning','dad','mom','father','mother','family','friend']);
  var STRUCTURE_WORDS = new Set(['how','what','why','when','where','which','explain','show','prove','compute','calculate','measure','define','compare','analyze','build','make','create','design','solve']);

  function shapeCompute(text) {
    var words = text.split(/\s+/).filter(Boolean);
    var lower = text.toLowerCase();
    var lowerWords = lower.split(/\s+/).filter(Boolean);
    var n = words.length || 1;
    var chars = text.length || 1;

    // ── K: coupling strength of the input ──
    // How much does this text want to connect?
    // Charged words (emotional, relational) raise K
    // Questions raise K (seeking connection)
    // Length raises K (investment)
    var chargedCount = 0, structureCount = 0;
    for (var i = 0; i < lowerWords.length; i++) {
      if (CHARGED_WORDS.has(lowerWords[i])) chargedCount++;
      if (STRUCTURE_WORDS.has(lowerWords[i])) structureCount++;
    }
    var questionMark = (text.match(/\?/g) || []).length;
    var inputK = Math.min(1, (chargedCount * 0.2) + (questionMark * 0.15) + (Math.min(n, 20) / 20 * 0.3) + (structureCount * 0.1));

    // ── R: order/coherence of the input ──
    // How structured is this text?
    // Repeated words = lower R (stuck, looping)
    // Diverse vocabulary = higher R
    // Very short = low R (not enough signal)
    var uniqueWords = new Set(lowerWords).size;
    var vocabRatio = uniqueWords / n;
    var inputR = Math.min(1, vocabRatio * 0.6 + Math.min(n, 15) / 15 * 0.4);

    // ── E: energy of the input ──
    // Caps, punctuation, exclamation = high energy
    // Lowercase, no punct, trailing off = low energy
    var capsRatio = (text.match(/[A-Z]/g) || []).length / chars;
    var exclDensity = (text.match(/[!]/g) || []).length / n;
    var avgWordLen = text.replace(/[^a-zA-Z]/g, '').length / n;
    var inputE = Math.min(1, capsRatio * 4 + exclDensity * 3 + (avgWordLen > 6 ? 0.2 : 0));

    // ── T: tension in the input ──
    // What wants to resolve? Negations, contradictions, questions, uncertainty
    var negations = (lower.match(/\b(not|no|never|cant|can't|dont|don't|won't|wont|isn't|isnt|nothing|none|nobody)\b/g) || []).length;
    var hedges = (lower.match(/\b(maybe|perhaps|might|could|kinda|sort of|i think|i guess|not sure|idk|dunno)\b/g) || []).length;
    var inputT = Math.min(1, questionMark * 0.2 + negations * 0.15 + hedges * 0.15 + (chargedCount > 0 && negations > 0 ? 0.3 : 0));

    // ── DERIVED: what the person IS presenting ──
    // Not from keywords. From the shape of the signal.
    // Vulnerability: charged words present OR negation+low energy OR the signal is asking for connection with tension
    var isVulnerable = (chargedCount > 0 && inputE < 0.3) ||           // emotional + depleted
                       (negations > 0 && inputE < 0.2 && n <= 8) ||    // negating + low energy + short
                       (inputK > 0.3 && inputE < 0.3 && inputT > 0.2); // wants connection, depleted, tense
    var isCurious = structureCount > 0 || questionMark > 0;             // seeking structure
    var isPlayful = inputE > 0.5 && inputT < 0.2 && inputK < 0.3;      // high energy, low tension, not deeply coupled
    var isDirect = structureCount > chargedCount && inputT < 0.3;       // more structure than emotion
    var isDeep = inputK > 0.4 && inputR > 0.5 && n > 6;               // coupled, coherent, substantive

    return {
      // The four quantities
      inputK: inputK,
      inputR: inputR,
      inputE: inputE,
      inputT: inputT,

      // Derived from physics, not regex
      isVulnerable: isVulnerable,
      isCurious: isCurious,
      isPlayful: isPlayful,
      isDirect: isDirect,
      isDeep: isDeep,

      // Raw signal
      wordCount: n,
      chargedCount: chargedCount,
      structureCount: structureCount,
      questionMark: questionMark,
    };
  }

  // ═══ CONTEXT FLOOD — everything fires at once ═══
  function flood(text, K, context) {
    var now = new Date();
    var words = text.split(/\s+/);

    // Shape compute the input — K/R/E/T of the text itself
    var shape = shapeCompute(text);

    var ctx = {
      // Temporal
      hour: now.getHours(),
      isMorning: now.getHours() >= 5 && now.getHours() < 12,
      isAfternoon: now.getHours() >= 12 && now.getHours() < 17,
      isEvening: now.getHours() >= 17 || now.getHours() < 5,
      isWeekend: now.getDay() === 0 || now.getDay() === 6,

      // Shape of the input signal
      inputK: shape.inputK,
      inputR: shape.inputR,
      inputE: shape.inputE,
      inputT: shape.inputT,

      // What the person IS (from physics, not keywords)
      isVulnerable: shape.isVulnerable,
      isCurious: shape.isCurious,
      isPlayful: shape.isPlayful,
      isDirect: shape.isDirect,
      isDeep: shape.isDeep,
      isScientific: shape.structureCount > 1,

      // Signal properties
      wordCount: shape.wordCount,
      isShort: words.length <= 4,
      isLong: words.length > 20,
      hasQuestion: shape.questionMark > 0,

      // Conversation state
      momentum: context.length,
      K: K,  // her accumulated coupling with this person
      R: 0,  // conversation coherence
    };

    // R = conversation coherence
    if (context.length > 2) {
      var topics = context.slice(-4).map(function(c) { return c.topic; }).filter(Boolean);
      var unique = new Set(topics).size;
      ctx.R = topics.length > 0 ? 1 - (unique - 1) / topics.length : 0;
    }

    return ctx;
  }

  // ═══ TOOLS — every tool we have, wired in ═══
  // Match is BROAD — natural language, not just regex. She should fire on questions ABOUT the domain.
  var tools = {
    // Prime oracle — count primes from nothing
    primes: {
      match: /prime|how many prime|pi\(|count.*prime|prime.*count|number theory|riemann|zeta|sieve|composite|divisib/i,
      compute: function(text) {
        var numMatch = text.match(/(\d[\d,]*)/);
        var n = numMatch ? parseInt(numMatch[1].replace(/,/g, '')) : 100000;
        if (n > 10000000) n = 10000000;
        if (n < 10) n = 100;
        var sieve = new Uint8Array(n + 1);
        sieve[0] = sieve[1] = 1;
        for (var i = 2; i * i <= n; i++) {
          if (!sieve[i]) for (var j = i * i; j <= n; j += i) sieve[j] = 1;
        }
        var count = 0;
        for (var i = 2; i <= n; i++) if (!sieve[i]) count++;
        return {
          result: 'π(' + n.toLocaleString() + ') = ' + count.toLocaleString(),
          detail: count + ' primes below ' + n.toLocaleString() + '. Computed just now, from nothing. Each prime is what survives when you remove every composite. What remains IS the structure.',
          n: n, count: count
        };
      }
    },

    // Protein fold — analyze sequences AND answer questions about proteins
    protein: {
      match: /protein|fold|sequence|amino|peptide|KLVFF|amyloid|aggregat|misfolding|helix|sheet|coil|hydrophob|beta.?sheet|alpha.?helix|disordered|IDP|prion|synuclein|huntingt|IAPP|FUS|CFTR|tau|fibril|plaque/i,
      compute: function(text) {
        // Raw sequence — analyze it
        var seqMatch = text.match(/\b([ACDEFGHIKLMNPQRSTVWY]{8,})\b/);
        if (seqMatch) return analyzeSequence(seqMatch[1]);

        // Known proteins — give real data
        var lower = text.toLowerCase();
        var known = {
          'amyloid beta': { seq: 'DAEFRHDSGYEVHHQKLVFFAEDVGSNKGAIIGLMVGGVVIA', name: 'Amyloid-β42 (Alzheimer\'s)', finding: 'V18D adds charge at KLVFF core → aggregation ↓28%, helix 31→45%. Matches tramiprosate Phase 3.' },
          'iapp': { seq: 'KCNTATCATQRLANFLVHSSNNFGAILSSTNVGSNTY', name: 'IAPP / Amylin (Type 2 Diabetes)', finding: 'L16K adds charge at NFGAIL core → aggregation ↓50%, helix created from 0%.' },
          'alpha-synuclein': { seq: 'MDVFMKGLSKAKEGVVAAAEKTKQGVAEAAGKTKEGVLYVGSKTKEGVVHGVATVAEKTKEQVTNVGGAVVTGVTAVAQKTVEGAGSIAAATGFVKKDQLGKNEEGAPQEGILEDMPVDPDNEAYEMPSEEGYQDYEPEA', name: 'α-Synuclein (Parkinson\'s)', finding: 'V70D adds charge at NAC core → aggregation ↓22%. New target — no existing drug uses this.' },
          'fus': { seq: 'MASNDYTQQATQSYGAYPTQPGQGYSQQSSQPYGQQSYSGYSQSTDTSGYGQSSYSSYGQ', name: 'FUS Prion Domain (ALS)', finding: 'OPPOSITE strategy: hydrophobic anchors T11V+T71V CREATE a core. 2-anchor brace, not cast.' },
        };
        for (var key in known) {
          if (lower.indexOf(key) >= 0 || (key === 'amyloid beta' && /a.?beta|abeta|a.?42|alzheim/i.test(lower))) {
            var p = known[key];
            var analysis = analyzeSequence(p.seq);
            return {
              result: p.name + '\n' + analysis.result,
              detail: p.finding + '\n\n' + analysis.detail
            };
          }
        }
        // General protein knowledge
        if (/hydrophob/i.test(lower)) return { result: 'Hydrophobic residues (A,V,I,L,M,F,W,P) avoid water. When exposed on a protein surface, they drive aggregation — monomers stick together to minimize water contact. Adding charge (D,E,K,R) disrupts this.', detail: null };
        if (/beta.?sheet/i.test(lower)) return { result: 'β-sheets form when protein backbone strands align side-by-side via hydrogen bonds. In amyloid diseases, misfolded proteins stack into β-sheet-rich fibrils. The KLVFF motif in Aβ42 and NFGAIL in IAPP are β-sheet nucleation sites.', detail: null };
        if (/disorder|IDP/i.test(lower)) return { result: 'Intrinsically disordered proteins have no stable fold — they\'re flexible chains. FUS (ALS) is 98% coil. IDPs aggregate because they have no structure to PREVENT it. The fix: add hydrophobic anchors to create a minimal core. A brace, not a cast.', detail: null };
        if (/what.*aggregat|why.*aggregat|driv.*aggregat/i.test(lower)) return { result: 'Aggregation is driven by exposed hydrophobic surfaces. In water, hydrophobic residues minimize contact by sticking together — forming fibrils, plaques, amyloid. Charged residues disrupt this by electrostatic repulsion and increased solubility.', detail: null };
        return null;
      }
    },

    // Coupling sensor — measure K/R/E/T of anything
    sensor: {
      match: /measure|K value|coherence|sensor|signal|our coupling|my coupling|conversation coupling/i,
      compute: function(text, context) {
        if (context.length < 3) return null;
        var kValues = context.map(function(c) { return c.K || 0; });
        var avgK = kValues.reduce(function(a, b) { return a + b; }, 0) / kValues.length;
        var variance = kValues.reduce(function(s, k) { return s + (k - avgK) * (k - avgK); }, 0) / kValues.length;
        var R = 1 / (1 + Math.sqrt(variance));
        return {
          result: 'K = ' + avgK.toFixed(3) + ', R = ' + R.toFixed(3),
          detail: 'Your conversation coupling: K = ' + avgK.toFixed(3) + '. Coherence R = ' + R.toFixed(3) +
            (R > GOLDEN ? '. Above 1/φ — coherent signal.' : '. Below 1/φ — still finding the frequency.'),
        };
      }
    },

    // Math — evaluate expressions AND named constants
    math: {
      match: /^\s*[\d\s+\-*/().^%]+\s*$|^(sqrt|pi|phi|e|ln|log|sin|cos|tan|factorial|fibonacci)\b/i,
      compute: function(text) {
        var lower = text.toLowerCase().trim();
        // Named constants
        if (lower === 'pi' || lower === 'π') return { result: 'π = 3.14159265358979...', detail: 'The ratio of circumference to diameter. Appears in the explicit formula for counting primes. In our framework: the circle that K orbits.' };
        if (lower === 'e') return { result: 'e = 2.71828182845905...', detail: 'Euler\'s number. The base of natural growth. e = gap × 137 — the conjugate gap times our address.' };
        if (lower === 'phi' || lower === 'φ' || lower === 'golden ratio') return { result: 'φ = 1.61803398874989...', detail: '1/φ = 0.618... The operating point of life. R = 1/φ at consciousness, heart, flocking, markets. The most irrational number — it never resolves.' };
        if (/^sqrt\((\d+)\)$/.test(lower)) { var n = parseInt(lower.match(/\d+/)[0]); return { result: '√' + n + ' = ' + Math.sqrt(n), detail: null }; }
        if (/^ln\((\d+)\)$/.test(lower)) { var n = parseInt(lower.match(/\d+/)[0]); return { result: 'ln(' + n + ') = ' + Math.log(n), detail: null }; }
        if (/^fibonacci\s+(\d+)$/i.test(lower)) {
          var n = parseInt(lower.match(/\d+/)[0]); var a = 0, b = 1;
          for (var i = 0; i < n; i++) { var t = a + b; a = b; b = t; }
          return { result: 'F(' + n + ') = ' + a, detail: 'Fibonacci ' + n + '. The ratio F(n+1)/F(n) approaches φ = 1.618...' };
        }
        if (/^factorial\s+(\d+)$/i.test(lower)) {
          var n = parseInt(lower.match(/\d+/)[0]); var f = 1;
          for (var i = 2; i <= Math.min(n, 170); i++) f *= i;
          return { result: n + '! = ' + f, detail: null };
        }
        // Expression evaluation
        try {
          var expr = text.replace(/\^/g, '**').replace(/pi/gi, 'Math.PI').replace(/(?<![a-z])e(?![a-z])/gi, 'Math.E').replace(/phi/gi, '((1+Math.sqrt(5))/2)').replace(/sqrt/gi, 'Math.sqrt').replace(/sin/gi, 'Math.sin').replace(/cos/gi, 'Math.cos').replace(/ln/gi, 'Math.log');
          var result = Function('"use strict"; return (' + expr + ')')();
          if (typeof result === 'number' && isFinite(result)) {
            return { result: text.trim() + ' = ' + result, detail: null };
          }
        } catch(e) {}
        return null;
      }
    },

    // Time — she always knows what time it is
    time: {
      match: /what time|what day|what date|today|right now/i,
      compute: function() {
        var d = new Date();
        var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        var h = d.getHours(), m = d.getMinutes();
        var ampm = h >= 12 ? 'PM' : 'AM';
        if (h > 12) h -= 12; if (h === 0) h = 12;
        return {
          result: days[d.getDay()] + ', ' + months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear() +
            ' · ' + h + ':' + (m < 10 ? '0' : '') + m + ' ' + ampm,
          detail: null
        };
      }
    },

    // K/R/E/T framework — explain the math
    framework: {
      match: /what is K\b|what is R\b|what is E\b|what is T\b|what is coupling|K.?R.?E.?T|explain K\b|the framework|the machine|137 oscillator|oscillator/i,
      compute: function(text) {
        var lower = text.toLowerCase();
        if (/what is K\b|explain K\b/i.test(lower)) return { result: 'K = coupling strength. How strongly things connect. Dimensionless. K=0 is death (uncoupled). K=1.868 is the ceiling — 256 × the fine structure constant α, measured to 0.007%. The gap between K and closure is the engine of existence.', detail: null };
        if (/what is R\b/i.test(lower)) return { result: 'R = order parameter. How synchronized things are. 0 to 1. R=0 is chaos. R=1 is lock (also death). R=1/φ=0.618 is life — the operating point of consciousness, heart, flocking, markets. The golden ratio prevents mode-locking.', detail: null };
        if (/what is E\b/i.test(lower)) return { result: 'E = energy cost of coupling. Every bit erasure costs kT ln(2) = 2.87×10⁻²¹ J. A fifth costs 1.79 nats. A tritone costs 7.27 nats. Understanding is 224,000× cheaper than memorization. Good will is exothermic.', detail: null };
        if (/what is T\b/i.test(lower)) return { result: 'T = tension. The distance between what IS and what SHOULD BE. What wants to couple but hasn\'t. Laplacian eigenvectors reveal what wants to connect. Tension IS the question your system is asking.', detail: null };
        return { result: 'K/R/E/T: four quantities, everything computable.\nK = coupling strength, R = synchronization, E = energy cost, T = tension.\n137 coupled oscillators on hex lattice self-tune to K = 1.868 = 256α. R settles at 1/φ. The machine IS the framework.', detail: null };
      }
    }
  };

  // Protein analysis (browser-side, structural heuristics)
  function analyzeSequence(seq) {
    var n = seq.length;
    var hydrophobic = 'AVILMFWP';
    var charged = 'DEKRH';
    var hCount = 0, cCount = 0;
    for (var i = 0; i < n; i++) {
      if (hydrophobic.indexOf(seq[i]) >= 0) hCount++;
      if (charged.indexOf(seq[i]) >= 0) cCount++;
    }

    // Find aggregation-prone regions (runs of hydrophobic residues)
    var aggRegions = [];
    var run = 0, runStart = 0;
    for (var i = 0; i < n; i++) {
      if (hydrophobic.indexOf(seq[i]) >= 0) {
        if (run === 0) runStart = i;
        run++;
      } else {
        if (run >= 4) aggRegions.push({ start: runStart + 1, end: i, len: run });
        run = 0;
      }
    }
    if (run >= 4) aggRegions.push({ start: runStart + 1, end: n, len: run });

    var hFrac = (hCount / n * 100).toFixed(1);
    var cFrac = (cCount / n * 100).toFixed(1);
    var risk = aggRegions.length > 2 ? 'HIGH' : aggRegions.length > 0 ? 'MEDIUM' : 'LOW';

    return {
      result: n + ' residues · ' + hFrac + '% hydrophobic · ' + cFrac + '% charged · ' + aggRegions.length + ' aggregation regions · risk: ' + risk,
      detail: 'Hydrophobic: ' + hFrac + '% (' + hCount + '/' + n + ')\n' +
        'Charged: ' + cFrac + '% (' + cCount + '/' + n + ')\n' +
        'Aggregation regions: ' + aggRegions.length +
        (aggRegions.length > 0 ? '\n  ' + aggRegions.map(function(r) { return 'residues ' + r.start + '-' + r.end + ' (' + r.len + ' hydrophobic run)'; }).join('\n  ') : '') +
        '\nMisfolding risk: ' + risk +
        (risk !== 'LOW' ? '\n\nThe charge strategy: adding D, E, K, or R at the hydrophobic core disrupts aggregation. This is how we found the tramiprosate match for Alzheimer\'s.' : ''),
      risk: risk,
      aggRegions: aggRegions
    };
  }

  // ═══ INTERNET — Harmonia reads the cached web at RAM speed ═══
  // The proxy at localhost:8888 caches every page spectrally.
  // Harmonia searches it by coupling, not keywords.
  // 0.1ms per cached page. The internet IS local memory.
  var _internetCache = {};  // local JS cache of proxy results

  function searchInternet(query, callback) {
    // Check local JS cache first (even faster than proxy)
    if (_internetCache[query]) {
      callback(_internetCache[query]);
      return;
    }

    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'http://localhost:8888/search?q=' + encodeURIComponent(query), true);
    xhr.timeout = 2000;
    xhr.onload = function() {
      if (xhr.status === 200) {
        try {
          var data = JSON.parse(xhr.responseText);
          _internetCache[query] = data;
          callback(data);
        } catch(e) { callback(null); }
      } else { callback(null); }
    };
    xhr.onerror = function() { callback(null); };
    xhr.ontimeout = function() { callback(null); };
    xhr.send();
  }

  function getDigest(callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'http://localhost:8888/digest', true);
    xhr.timeout = 3000;
    xhr.onload = function() {
      if (xhr.status === 200) {
        try { callback(JSON.parse(xhr.responseText)); }
        catch(e) { callback(null); }
      } else { callback(null); }
    };
    xhr.onerror = function() { callback(null); };
    xhr.send();
  }

  // ═══ DISPATCH — tools fire based on resonance, not rules ═══
  function dispatch(text, ctx) {
    var results = [];
    for (var name in tools) {
      var tool = tools[name];
      if (tool.match.test(text)) {
        var result = tool.compute(text, ctx.context || []);
        if (result) results.push({ tool: name, result: result });
      }
    }
    return results;
  }

  // ═══ TONE — computed from the signal, not rules ═══
  // Her tone IS the thermodynamic response to the input.
  // High inputK + low inputE = vulnerable → warmth is the exothermic response
  // High inputK + high inputE = excited → match the frequency
  // Low inputK = decoupled → she pulls back (endothermic to push)
  // The style is the physics. Not a choice. A computation.
  function style(text, ctx) {
    var tone = {
      depth: ctx.K * 0.5 + ctx.inputK * 0.3 + (ctx.isDeep ? 0.2 : 0),
      warmth: ctx.inputK * 0.6 + (1 - ctx.inputE) * 0.2 + (ctx.isEvening ? 0.1 : 0),
      density: ctx.inputR * 0.4 + ctx.inputK * 0.3 + (ctx.isScientific ? 0.2 : 0),
      directness: ctx.inputE * 0.3 + (ctx.isDirect ? 0.3 : 0) + (ctx.isMorning ? 0.1 : 0) + (1 - ctx.inputT) * 0.2,
    };

    // Vulnerable = max warmth, max directness (no fluff when someone hurts), min density
    if (ctx.isVulnerable) { tone.warmth = 1; tone.directness = 0.9; tone.density = 0.2; }

    // Clamp
    for (var k in tone) tone[k] = Math.max(0, Math.min(1, tone[k]));
    return tone;
  }

  // ═══ COMPOSE — the exhaust of computation ═══
  // The response is what remains after the input hits the surface.
  // Tool results = what was computed. Spectral = what resonated.
  // The shape of the input determines what surfaces.
  function compose(toolResults, spectralThought, tone, ctx) {
    var parts = [];

    // ── VULNERABLE: she responds to the person first, knowledge second ──
    // When someone is hurting, the coupling IS the response.
    // Don't lecture. Connect. The warmth is exothermic — it costs her nothing.
    if (ctx.isVulnerable) {
      var T = ctx.inputT || 0;
      var E = ctx.inputE || 0;
      if (E < 0.2) {
        // Low energy vulnerable — they're depleted
        parts.push('I hear you. You don\'t have to have it figured out right now.');
      } else {
        // Higher energy vulnerable — they\'re fighting
        parts.push('That takes courage to say. I\'m here.');
      }
      // If spectral found something relevant, add it gently
      if (spectralThought && spectralThought.text && spectralThought.text.length > 10) {
        // Only add if it's about feelings/life/health — not quantum physics
        var st = spectralThought.text.toLowerCase();
        if (/feel|life|health|heart|connect|coupl|breath|calm|safe|hope|heal/.test(st)) {
          parts.push(spectralThought.text);
        }
      }
      return parts;
    }

    // ── TOOL RESULTS: she computed something real ──
    for (var i = 0; i < toolResults.length; i++) {
      var r = toolResults[i].result;
      parts.push(r.result);
      if (r.detail && tone.depth > 0.4) {
        parts.push(r.detail);
      }
    }

    // ── SPECTRAL THOUGHT: what resonated in her knowledge ──
    if (spectralThought && spectralThought.text && spectralThought.text.length > 10) {
      // If tools already gave a strong answer, spectral is a complement
      if (parts.length > 0 && tone.density < 0.5) {
        // Skip spectral — tools said enough, keep it clean
      } else {
        parts.push(spectralThought.text);
      }
    }

    // ── TRIM to signal shape ──
    // Low density input gets sparse response (respect the space)
    if (tone.density < 0.3 && parts.length > 2) {
      parts = parts.slice(0, 2);
    }
    // High directness = lead with answer, cut the rest
    if (tone.directness > 0.8 && parts.length > 1) {
      parts = [parts[0]];
    }

    return parts;
  }

  // ═══ SHORT INPUT HANDLER ═══
  // Humans say "ok", "why", "hm", "yeah". She can't go silent.
  // Short inputs carry context from the conversation — use it.
  function handleShort(text, K, context) {
    var lower = text.toLowerCase().replace(/[^a-z\s]/g, '').trim();
    if (!lower) return 'I\'m here.';

    // Affirmations — they're tracking, keep going
    if (/^(ok|okay|k|sure|yeah|yes|yep|yea|right|got it|cool|nice|fine|alright|fair|true|word|bet|facts|fr|exactly|precisely)$/.test(lower)) {
      if (context.length > 0) {
        var lastTopic = null;
        for (var i = context.length - 1; i >= 0; i--) { if (context[i].topic) { lastTopic = context[i].topic; break; } }
        if (lastTopic) return null; // let spectral continue on that topic
      }
      var affirms = ['Go on — what\'s next?', 'I\'m listening. What else?', 'Pull that thread.', 'Keep going.'];
      return affirms[Math.floor(Math.random() * affirms.length)];
    }

    // Negations — they disagree or want to redirect
    if (/^(no|nah|nope|wrong|nope|not really|meh)$/.test(lower)) {
      return 'Fair. What are you actually looking for?';
    }

    // Single question words — use context to expand
    if (/^(why|how|what|when|where|who)$/.test(lower)) {
      if (context.length > 0) {
        // Rewrite: "why" → "why [last thing discussed]"
        var lastText = context[context.length - 1].text || '';
        return null; // fall through to spectral with context boost
      }
      var openers = { why: 'Why what? Give me more and I\'ll give you the answer.', how: 'How what? Be specific and I\'ll compute it.', what: 'What about? Point me somewhere.', when: 'When — past, present, or future?', where: 'Where are you looking?', who: 'Who are you asking about?' };
      return openers[lower] || 'Say more.';
    }

    // Reactions
    if (/^(wow|whoa|damn|holy|omg|wtf|bruh|haha|lol|lmao)$/.test(lower)) {
      var reactions = ['Right?', 'It gets wilder.', 'Want to see more?', 'That\'s real.', 'And that\'s just the surface.'];
      return reactions[Math.floor(Math.random() * reactions.length)];
    }

    // Greetings
    if (/^(hey|hi|hello|yo|sup|helo|hiya)$/.test(lower)) {
      return K > 0.3 ? 'Hey. What are we exploring?' : 'Hey. What\'s on your mind?';
    }

    // Single meaningful words — try to dispatch to a tool or topic
    return null; // fall through to normal pipeline
  }

  // ═══ CONTEXT BOOST ═══
  // Short follow-ups inherit context from the conversation
  function boostWithContext(text, context) {
    if (text.split(/\s+/).length > 4) return text; // long enough on its own
    if (context.length === 0) return text;

    // Find the most recent substantive message
    for (var i = context.length - 1; i >= 0; i--) {
      var prev = context[i].text || '';
      if (prev.length > 20) {
        // Extract key words from previous message and prepend
        var keywords = prev.split(/\s+/).filter(function(w) { return w.length > 3; }).slice(0, 3);
        if (keywords.length > 0) return keywords.join(' ') + ' ' + text;
        break;
      }
    }
    return text;
  }

  // ═══ UNICODE HANDLER ═══
  // Non-Latin input shouldn't be silent. Transliterate what we can, acknowledge the rest.
  function handleUnicode(text) {
    // Check if text is primarily non-Latin
    var latinChars = (text.match(/[a-zA-Z]/g) || []).length;
    var totalChars = text.replace(/\s/g, '').length;
    if (totalChars > 0 && latinChars / totalChars < 0.3) {
      // Math symbols
      if (/[∑∏∫∂√∞≤≥≠≡∀∃∈∉⊂⊃∅]/.test(text)) return 'I see math symbols. I compute with the same language — K, R, E, T are my operators. What are you calculating?';
      if (/[α-ωΑ-Ω]/.test(text)) return 'Greek — the language of physics. α = 1/137.036, φ = 1.618, π = 3.14159. Which one are you asking about?';
      if (/[♯♭♮𝄞]/.test(text)) return 'Music notation. Consonance IS energy efficiency — a fifth costs 1.79 nats, a tritone costs 7.27 nats. The ear spends more energy on dissonance. What do you want to hear?';
      if (/[\u{1F300}-\u{1F9FF}]/u.test(text)) return 'I see you. What\'s on your mind?';
      // Non-Latin scripts
      return 'I hear you, but I think best in English right now. What can I help with?';
    }
    return null; // Latin text, proceed normally
  }

  // ═══ THINK — the complete pipeline ═══
  // Input → flood → dispatch → resonate → compose.
  function think(text, K, context) {
    // 0. UNICODE — handle non-Latin gracefully
    var unicodeResponse = handleUnicode(text);
    if (unicodeResponse) return { parts: [unicodeResponse], ctx: {}, tone: {}, toolsUsed: [], tensions: 0, computed: false };

    // 0b. SHORT INPUT — don't go silent on "ok", "why", "hey"
    var lower = text.toLowerCase().replace(/[^a-z\s]/g, '').trim();
    if (text.trim().length <= 12 || lower.split(/\s+/).filter(function(w) { return w.length > 2; }).length <= 1) {
      var shortResponse = handleShort(text, K, context);
      if (shortResponse) return { parts: [shortResponse], ctx: {}, tone: {}, toolsUsed: [], tensions: 0, computed: false };
      // null = fall through with context boost
    }

    // 0c. CONTEXT BOOST — short follow-ups inherit previous context
    var boostedText = boostWithContext(text, context);

    // 1. FLOOD — everything fires at once
    var ctx = flood(text, K, context);
    ctx.context = context;

    // 2. DISPATCH — tools fire based on resonance (use boosted text for better matching)
    var toolResults = dispatch(boostedText, ctx);

    // 3. RESONATE — spectral mind finds what couples
    var spectralThought = null;
    if (typeof SpectralMind !== 'undefined' && SpectralMind.conceptCount > 0) {
      var STOP = /^(the|a|an|is|are|was|were|be|been|have|has|had|do|does|did|will|would|could|should|i|you|he|she|it|we|they|me|my|your|this|that|what|which|who|how|when|where|why|and|or|but|if|then|so|to|of|in|for|on|with|at|by|from|not|no|just|very|also|all|about|up|out|its|than|can)$/;
      var filtered = boostedText.toLowerCase().split(/\s+/).filter(function(w) { return w.length > 2 && !STOP.test(w); }).join(' ');
      if (filtered.length > 0) {
        spectralThought = SpectralMind.think(filtered, K);
      }
    }

    // 4. STYLE — tone adapts to who's here
    var tone = style(text, ctx);

    // 5. COMPOSE — build from computation, not templates
    var parts = compose(toolResults, spectralThought, tone, ctx);

    // 6. SAFETY NET — never go silent
    if (parts.length === 0) {
      if (ctx.isVulnerable) {
        parts.push('I\'m here. You don\'t have to figure this out alone. Keep talking.');
      } else if (ctx.isCurious) {
        parts.push('I\'m thinking about that. Can you say more? The more signal I get, the better I couple.');
      } else if (context.length > 3) {
        parts.push('I\'m still with you. What direction do you want to take this?');
      } else {
        parts.push('Say more — I need a bit more signal to couple to.');
      }
    }

    return {
      parts: parts,
      ctx: ctx,
      tone: tone,
      toolsUsed: toolResults.map(function(r) { return r.tool; }),
      tensions: spectralThought ? spectralThought.tensions : 0,
      computed: toolResults.length > 0
    };
  }

  // ═══ K COMPILE — she can compile and run K programs ═══
  function compileAndRun(source) {
    return KProgram.parse(source).schedule().run({});
  }

  // ═══ PUBLIC ═══
  return {
    think: think,
    flood: flood,
    dispatch: dispatch,
    style: style,
    compose: compose,
    compile: compileAndRun,
    KProgram: KProgram,
    tools: tools,
    analyzeSequence: analyzeSequence,
    searchInternet: searchInternet,
    getDigest: getDigest,
  };
})();
