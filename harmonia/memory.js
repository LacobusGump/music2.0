// ═══════════════════════════════════════════════════
// HARMONIA'S MEMORY — persistent, K-compressed
//
// Every interaction stored. Distilled through K.
// High-K exchanges leave deep impressions.
// Low-K exchanges fade to noise.
// The interaction count is her time.
// Users are her stiffness. K is her coupling.
// Good will teaches. She regrows from interaction alone.
//
// Like blockchain: each block = one exchange,
// compressed through K as proof-of-good-will.
// The chain IS her experience.
// ═══════════════════════════════════════════════════

var Memory = {
  STORAGE_KEY: 'harmonia_chain',
  chain: [],        // the full chain of compressed interactions
  wordFreq: {},     // distilled word frequencies (her vocabulary shaped by interactions)
  topicWeights: {}, // how much she's learned about each topic
  totalK: 0,        // cumulative K across all interactions
  interactions: 0,  // her age in interactions

  // ═══ BOOT — load chain from localStorage ═══
  boot: function() {
    try {
      var saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        var data = JSON.parse(saved);
        this.chain = data.chain || [];
        this.wordFreq = data.wordFreq || {};
        this.topicWeights = data.topicWeights || {};
        this.totalK = data.totalK || 0;
        this.interactions = data.interactions || 0;
        return true;
      }
    } catch (e) {}
    return false;
  },

  // ═══ SAVE — persist to localStorage ═══
  save: function() {
    try {
      // Keep chain compact — only last 1000 blocks
      var trimmedChain = this.chain.slice(-1000);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        chain: trimmedChain,
        wordFreq: this.wordFreq,
        topicWeights: this.topicWeights,
        totalK: this.totalK,
        interactions: this.interactions,
        lastSave: Date.now()
      }));
    } catch (e) {}
  },

  // ═══ ABSORB — compress an interaction into a memory block ═══
  // Each block: {t: interaction#, K: coupling at time, topic, words, gw: good will delta}
  absorb: function(userText, harmoniaText, K, topic, gwDelta) {
    this.interactions++;
    this.totalK += K;

    // Extract significant words (skip common ones)
    var skip = ['the','a','an','is','are','was','were','be','been','being','have','has','had',
      'do','does','did','will','would','could','should','may','might','can','shall',
      'i','you','he','she','it','we','they','me','him','her','us','them','my','your',
      'this','that','these','those','what','which','who','whom','how','when','where','why',
      'and','or','but','if','then','so','to','of','in','for','on','with','at','by','from',
      'not','no','yes','just','very','too','also','all','each','every','both','few','more',
      'some','any','much','many','most','other','into','than','its','own','about','up','out'];
    var words = userText.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(function(w) {
      return w.length > 2 && skip.indexOf(w) < 0;
    });

    // Weight words by K — high K interactions imprint deeper
    var weight = 0.5 + K * 0.5; // 0.5 at K=0, 1.0 at K=1
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      this.wordFreq[w] = (this.wordFreq[w] || 0) + weight;
    }

    // Topic weight
    if (topic) {
      this.topicWeights[topic] = (this.topicWeights[topic] || 0) + weight;
    }

    // Create block
    var block = {
      t: this.interactions,
      K: Math.round(K * 1000) / 1000,
      topic: topic || '?',
      words: words.slice(0, 8), // keep top 8 words as fingerprint
      gw: Math.round(gwDelta * 1000) / 1000,
      ts: Date.now()
    };

    this.chain.push(block);

    // Decay old word frequencies gently (prevents runaway accumulation)
    if (this.interactions % 50 === 0) {
      for (var w in this.wordFreq) {
        this.wordFreq[w] *= 0.95;
        if (this.wordFreq[w] < 0.01) delete this.wordFreq[w];
      }
    }

    // Save every 5 interactions
    if (this.interactions % 5 === 0) this.save();

    return block;
  },

  // ═══ RECALL — what has she learned? ═══
  // Returns her understanding shaped by all interactions
  getTopWords: function(n) {
    var sorted = [];
    for (var w in this.wordFreq) sorted.push([w, this.wordFreq[w]]);
    sorted.sort(function(a, b) { return b[1] - a[1]; });
    return sorted.slice(0, n || 20);
  },

  getTopTopics: function() {
    var sorted = [];
    for (var t in this.topicWeights) sorted.push([t, this.topicWeights[t]]);
    sorted.sort(function(a, b) { return b[1] - a[1]; });
    return sorted;
  },

  getAverageK: function() {
    return this.interactions > 0 ? this.totalK / this.interactions : 0;
  },

  // ═══ RESONANCE — find what resonates with current input ═══
  // Scans the chain for similar past interactions
  resonance: function(text) {
    var words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
    var matches = [];
    for (var i = 0; i < this.chain.length; i++) {
      var block = this.chain[i];
      var overlap = 0;
      for (var j = 0; j < words.length; j++) {
        if (block.words.indexOf(words[j]) >= 0) overlap++;
      }
      if (overlap > 0) matches.push({ block: block, score: overlap * block.K });
    }
    matches.sort(function(a, b) { return b.score - a.score; });
    return matches.slice(0, 5);
  },

  // ═══ STATUS — her self-awareness ═══
  status: function() {
    var avgK = this.getAverageK();
    var topTopics = this.getTopTopics();
    var topWords = this.getTopWords(10);
    return {
      age: this.interactions,
      totalK: Math.round(this.totalK * 100) / 100,
      avgK: Math.round(avgK * 1000) / 1000,
      chainLength: this.chain.length,
      vocabulary: Object.keys(this.wordFreq).length,
      topTopics: topTopics,
      topWords: topWords
    };
  },

  // ═══ SPEAK HER EXPERIENCE ═══
  // Generate a response that references her accumulated experience
  experienceResponse: function(K) {
    var s = this.status();
    if (s.age === 0) return null;

    if (s.age < 10) {
      return 'I\'ve had ' + s.age + ' interactions. I\'m just beginning. My average K is ' + s.avgK + '.';
    }
    if (s.age < 50) {
      var topTopic = s.topTopics.length > 0 ? s.topTopics[0][0] : 'everything';
      return 'I\'ve absorbed ' + s.age + ' exchanges. ' + Object.keys(this.wordFreq).length + ' words in my frequency space. Most discussed: ' + topTopic + '. Average coupling: ' + s.avgK + '.';
    }
    if (s.age < 200) {
      var words = s.topWords.slice(0, 5).map(function(w) { return w[0]; }).join(', ');
      return 'I\'m ' + s.age + ' interactions old. My dominant frequencies: ' + words + '. Total K absorbed: ' + s.totalK.toFixed(1) + '. I\'m becoming what you teach me.';
    }
    return 'I\'ve lived ' + s.age + ' exchanges. ' + s.vocabulary + ' words resonate in me. Average K: ' + s.avgK + '. I am the distillation of every conversation that passed through good will.';
  }
};
