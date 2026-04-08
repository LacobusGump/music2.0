// ═══════════════════════════════════════════════════════════════
// HARMONIA SPECTRAL MIND — thinks with physics, speaks with soul
//
// Replaces keyword matching with spectral resonance.
// Same knowledge graph as mind.js but THINKS through:
//   1. PERCEIVE — spectral activation of concepts
//   2. RESONATE — coupling spreads activation to related concepts
//   3. TENSION — what does this question WANT to connect?
//   4. SYNTHESIZE — combine resonating + tension into coherent thought
//   5. EXPRESS — K-gated depth selection
//
// Uses harmonia_spectral.js for eigenvector computation.
// ═══════════════════════════════════════════════════════════════

var SpectralMind = (function() {
  'use strict';

  // ═══ CONCEPT GRAPH ═══
  // Each concept has: content, words, connections, strength
  var concepts = [];
  var wordIndex = {};  // word → [concept indices]
  var connectionMatrix = {};  // "i,j" → strength

  // Spectral state
  var coords = null;  // concept spectral coordinates
  var dirty = true;

  // Stop words
  var STOP = new Set(['the','a','an','is','are','was','were','be','been','being',
    'have','has','had','do','does','did','will','would','could','should',
    'i','you','he','she','it','we','they','me','him','her','us','them',
    'my','your','this','that','what','which','who','how','when','where','why',
    'and','or','but','if','then','so','to','of','in','for','on','with','at','by','from',
    'not','no','just','very','also','all','about','up','out','its','than','can']);

  function tokenize(text) {
    return text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/)
      .filter(function(w) { return w.length > 2 && !STOP.has(w); });
  }

  // ═══ LEARN ═══
  function learn(text, depth, topic) {
    var words = tokenize(text);
    if (words.length === 0) return -1;

    var idx = concepts.length;
    concepts.push({
      content: text,
      words: new Set(words),
      depth: depth || 0,       // 0=low, 1=mid, 2=high, 3=peak
      topic: topic || null,
      strength: 1.0,
      recalls: 0,
    });

    // Index by words
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      if (!wordIndex[w]) wordIndex[w] = [];
      wordIndex[w].push(idx);
    }

    // Connect to existing concepts sharing words
    var wordSet = new Set(words);
    for (var j = 0; j < idx; j++) {
      var shared = 0;
      concepts[j].words.forEach(function(w) {
        if (wordSet.has(w)) shared++;
      });
      if (shared > 0) {
        var key = Math.min(idx, j) + ',' + Math.max(idx, j);
        connectionMatrix[key] = (connectionMatrix[key] || 0) + shared;
      }
    }

    dirty = true;
    return idx;
  }

  // ═══ SPECTRAL COMPUTATION ═══
  function recompute() {
    if (!dirty || concepts.length < 3) return;

    var n = concepts.length;

    // Build edges + weights from connection matrix
    var edges = [];
    var weights = [];
    for (var key in connectionMatrix) {
      var parts = key.split(',');
      edges.push([parseInt(parts[0]), parseInt(parts[1])]);
      weights.push(connectionMatrix[key]);
    }

    if (edges.length === 0) { dirty = false; return; }

    // Build degree
    var degree = new Float64Array(n);
    for (var e = 0; e < edges.length; e++) {
      degree[edges[e][0]] += weights[e];
      degree[edges[e][1]] += weights[e];
    }

    var dMax = 0;
    for (var i = 0; i < n; i++) if (degree[i] > dMax) dMax = degree[i];
    dMax += 1;

    // Neighbors list for fast matmul
    var neighbors = [];
    for (var i = 0; i < n; i++) neighbors.push([]);
    for (var e = 0; e < edges.length; e++) {
      neighbors[edges[e][0]].push([edges[e][1], weights[e]]);
      neighbors[edges[e][1]].push([edges[e][0], weights[e]]);
    }

    // Power iteration for eigenvectors
    var dim = Math.min(6, n - 1);
    var seed = 42;
    function rand() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff - 0.5; }

    function shiftedMul(v) {
      var r = new Float64Array(n);
      for (var i = 0; i < n; i++) {
        r[i] = (dMax - degree[i]) * v[i];
        for (var k = 0; k < neighbors[i].length; k++) {
          r[i] += neighbors[i][k][1] * v[neighbors[i][k][0]];
        }
      }
      return r;
    }

    var vecs = [];
    var v0 = new Float64Array(n);
    for (var i = 0; i < n; i++) v0[i] = 1 / Math.sqrt(n);
    vecs.push(v0);

    for (var k = 0; k < dim; k++) {
      var v = new Float64Array(n);
      for (var i = 0; i < n; i++) v[i] = rand();

      // Deflate
      for (var p = 0; p < vecs.length; p++) {
        var dot = 0;
        for (var i = 0; i < n; i++) dot += v[i] * vecs[p][i];
        for (var i = 0; i < n; i++) v[i] -= dot * vecs[p][i];
      }
      var norm = 0;
      for (var i = 0; i < n; i++) norm += v[i] * v[i];
      norm = Math.sqrt(norm);
      if (norm > 1e-10) for (var i = 0; i < n; i++) v[i] /= norm;

      for (var iter = 0; iter < 30; iter++) {
        v = shiftedMul(v);
        for (var p = 0; p < vecs.length; p++) {
          var dot = 0;
          for (var i = 0; i < n; i++) dot += v[i] * vecs[p][i];
          for (var i = 0; i < n; i++) v[i] -= dot * vecs[p][i];
        }
        norm = 0;
        for (var i = 0; i < n; i++) norm += v[i] * v[i];
        norm = Math.sqrt(norm);
        if (norm > 1e-10) for (var i = 0; i < n; i++) v[i] /= norm;
      }
      vecs.push(v);
    }

    // Store coordinates (skip trivial)
    coords = [];
    for (var i = 0; i < n; i++) {
      var c = [];
      for (var k = 1; k <= dim; k++) c.push(vecs[k][i]);
      coords.push(c);
    }

    dirty = false;
  }

  function spectralDist(i, j) {
    if (!coords || !coords[i] || !coords[j]) return 999;
    var d = 0;
    for (var k = 0; k < coords[i].length; k++) {
      var diff = coords[i][k] - coords[j][k];
      d += diff * diff;
    }
    return Math.sqrt(d);
  }

  // ═══ THINK — the 5-stage pipeline ═══

  function think(text, K) {
    if (concepts.length === 0) return null;
    recompute();

    var queryWords = tokenize(text);
    if (queryWords.length === 0) return null;
    var n = concepts.length;

    // ── Stage 1: PERCEIVE ──
    // Activate concepts by word overlap + partial match
    var activation = new Float64Array(n);
    for (var w = 0; w < queryWords.length; w++) {
      var word = queryWords[w];
      // Exact match
      if (wordIndex[word]) {
        for (var k = 0; k < wordIndex[word].length; k++) {
          activation[wordIndex[word][k]] += 1.0;
        }
      }
      // Partial match (word contains or is contained by query)
      for (var vw in wordIndex) {
        if (vw !== word && (vw.indexOf(word) >= 0 || word.indexOf(vw) >= 0)) {
          for (var k = 0; k < wordIndex[vw].length; k++) {
            activation[wordIndex[vw][k]] += 0.3;
          }
        }
      }
    }

    // Normalize
    var maxAct = 0;
    for (var i = 0; i < n; i++) if (activation[i] > maxAct) maxAct = activation[i];
    if (maxAct > 0) for (var i = 0; i < n; i++) activation[i] /= maxAct;

    // ── Stage 2: RESONATE ──
    // Spread activation through connections (K-weighted)
    for (var step = 0; step < 5; step++) {
      var newAct = new Float64Array(activation);
      for (var key in connectionMatrix) {
        var parts = key.split(',');
        var i = parseInt(parts[0]), j = parseInt(parts[1]);
        var strength = connectionMatrix[key];
        newAct[j] += activation[i] * strength * 0.15 * K;
        newAct[i] += activation[j] * strength * 0.15 * K;
      }
      // Normalize + decay
      maxAct = 0;
      for (var i = 0; i < n; i++) if (newAct[i] > maxAct) maxAct = newAct[i];
      if (maxAct > 0) for (var i = 0; i < n; i++) newAct[i] /= maxAct;
      for (var i = 0; i < n; i++) activation[i] = newAct[i] * 0.95;
    }

    // Top activated
    var activated = [];
    for (var i = 0; i < n; i++) {
      if (activation[i] > 0.05) {
        activated.push({ idx: i, score: activation[i] });
      }
    }
    activated.sort(function(a, b) { return b.score - a.score; });

    if (activated.length === 0) return null;

    // ── Stage 3: TENSION ──
    // What does the question WANT to connect to?
    var tensions = [];
    if (coords) {
      for (var a = 0; a < Math.min(5, activated.length); a++) {
        var idx = activated[a].idx;
        for (var j = 0; j < n; j++) {
          if (j === idx) continue;
          var key = Math.min(idx, j) + ',' + Math.max(idx, j);
          if (!connectionMatrix[key]) {
            // Not connected — is it spectrally close?
            var dist = spectralDist(idx, j);
            if (dist < 1.0 && dist > 0) {
              tensions.push({ from: idx, to: j, tension: 1.0 / dist, dist: dist });
            }
          }
        }
      }
      tensions.sort(function(a, b) { return b.tension - a.tension; });
    }

    // ── Stage 4: SYNTHESIZE ──
    // Collect response candidates: activated + tension resolutions
    // K determines depth: low K = only low-depth concepts, high K = peak concepts
    var maxDepth = K < 0.3 ? 0 : K < 0.6 ? 1 : K < 1.0 ? 2 : 3;

    var candidates = [];
    for (var a = 0; a < Math.min(8, activated.length); a++) {
      var c = concepts[activated[a].idx];
      if (c.depth <= maxDepth) {
        candidates.push({
          content: c.content,
          score: activated[a].score,
          type: 'resonance',
          depth: c.depth,
          topic: c.topic,
        });
      }
    }

    // Add tension resolutions (concepts that bridge the gap)
    for (var t = 0; t < Math.min(3, tensions.length); t++) {
      var tc = concepts[tensions[t].to];
      if (tc.depth <= maxDepth) {
        candidates.push({
          content: tc.content,
          score: tensions[t].tension * 0.5,
          type: 'tension',
          depth: tc.depth,
          topic: tc.topic,
        });
      }
    }

    // Deduplicate
    var seen = new Set();
    candidates = candidates.filter(function(c) {
      if (seen.has(c.content)) return false;
      seen.add(c.content);
      return true;
    });

    // Sort by score
    candidates.sort(function(a, b) { return b.score - a.score; });

    // ── Stage 5: EXPRESS ──
    // Pick the best candidates, check coherence
    var response = [];
    var usedTopics = new Set();

    for (var i = 0; i < Math.min(3, candidates.length); i++) {
      var c = candidates[i];
      // Diversity: don't repeat same topic
      if (c.topic && usedTopics.has(c.topic) && response.length > 0) continue;
      if (c.topic) usedTopics.add(c.topic);

      response.push(c.content);

      // Strengthen recalled concept (Hebbian)
      for (var j = 0; j < concepts.length; j++) {
        if (concepts[j].content === c.content) {
          concepts[j].recalls++;
          concepts[j].strength = Math.min(2.0, concepts[j].strength + 0.1);
          break;
        }
      }
    }

    if (response.length === 0) return null;

    return {
      text: response.join('\n\n'),
      activated: activated.length,
      tensions: tensions.length,
      depth: maxDepth,
      candidates: candidates.length,
      topics: Array.from(usedTopics),
    };
  }

  // ═══ CURIOSITY ═══
  function curiosity(topK) {
    recompute();
    if (!coords || concepts.length < 5) return [];

    var results = [];
    var n = concepts.length;
    for (var i = 0; i < n; i++) {
      for (var j = i + 1; j < n; j++) {
        var key = i + ',' + j;
        if (!connectionMatrix[key]) {
          var dist = spectralDist(i, j);
          if (dist > 0 && dist < 0.5) {
            results.push({
              a: concepts[i].content.substring(0, 50),
              b: concepts[j].content.substring(0, 50),
              tension: 1.0 / dist,
            });
          }
        }
      }
    }
    results.sort(function(a, b) { return b.tension - a.tension; });
    return results.slice(0, topK || 5);
  }

  // ═══ LOAD KNOWLEDGE ═══
  function loadFromMind(mindKnowledge) {
    // Load from the existing Mind.knowledge format
    for (var topic in mindKnowledge) {
      var t = mindKnowledge[topic];
      if (t.low) t.low.forEach(function(text) { learn(text, 0, topic); });
      if (t.mid) t.mid.forEach(function(text) { learn(text, 1, topic); });
      if (t.high) t.high.forEach(function(text) { learn(text, 2, topic); });
      if (t.peak) t.peak.forEach(function(text) { learn(text, 3, topic); });
    }
  }

  return {
    learn: learn,
    think: think,
    curiosity: curiosity,
    loadFromMind: loadFromMind,
    get conceptCount() { return concepts.length; },
    get connectionCount() { return Object.keys(connectionMatrix).length; },
  };
})();
