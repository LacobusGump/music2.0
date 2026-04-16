// ═══════════════════════════════════════════════════════════
// HARMONIA PRODUCT ENGINE — tools, not products. All free.
//
// She knows what each tool does and helps you find the right one.
// No selling. No pricing. No caps. Everything is free.
// ═══════════════════════════════════════════════════════════

var Products = {

  catalog: {
    oracle:     { keywords: ['predict','forecast','time series','seasonal','frequency','trend','sales','traffic','weather','cycle','periodic'], pitch: 'Finds hidden frequencies in any sequence and projects forward. Knows when it doesn\'t know.', demo: 'Try pasting 20+ numbers (comma separated) — I\'ll find the frequencies. Or try it at begump.com/products/oracle/' },
    trace:      { keywords: ['fraud','transaction','money','wash','circular','laundering','forensic','financial','suspicious','ponzi','enron'], pitch: 'Finds circular flows, wash trading, and hidden relationships in financial data.', demo: 'Describe a transaction pattern and I\'ll score the risk. Or try it at begump.com/products/trace/' },
    foldwatch:  { keywords: ['protein','fold','sequence','amino','misfolding','aggregation','alzheimer','huntington','drug','allergen','gluten','structure','3d'], pitch: 'Paste a protein sequence. Get structure prediction, misfolding risk, aggregation hotspots. Milliseconds.', demo: 'Paste an amino acid sequence and I\'ll analyze it. Or try it at begump.com/products/foldwatch/' },
    dissonance: { keywords: ['security','monitor','anomaly','threat','behavior','intrusion','attack','breach','file integrity','zero day'], pitch: 'Learns what your system looks like, flags when it changes. Silence = safe.', demo: 'I can show you how it detects behavior changes. Try it at begump.com/products/dissonance/' },
    accord:     { keywords: ['compliance','regulation','legal','law','gdpr','hipaa','pci','tax','audit','requirement','gap'], pitch: 'Scans regulations against your business. Finds gaps, generates counter-strategies.', demo: 'Tell me your industry — I\'ll show what regulations might apply. Or try it at begump.com/products/accord/' },
    sensor:     { keywords: ['time series','coupling','regime','anomaly','k/r/e/t','diagnose','monitor','signal','data'], pitch: 'Four quantities describe any signal: coupling, order, energy, tension.', demo: 'Paste some numbers and I\'ll diagnose the regime. Or try it at begump.com/products/sensor/' },
    aitrainer:  { keywords: ['training','grokking','epoch','model','stop','gpu','compute','memoriz','generaliz','loss curve'], pitch: 'Detects when your model transitions from memorizing to understanding.', demo: 'I can explain how grokking detection works. Try it at begump.com/products/aitrainer/' },
    chipfast:   { keywords: ['chip','gate','placement','circuit','vlsi','semiconductor','routing','wire','eda','cadence'], pitch: 'Chip placement on your laptop. 40M gates with Metal GPU.', demo: 'Describe a small circuit and I\'ll show the spectral placement. Try it at begump.com/products/chipfast/' },
    turbo:      { keywords: ['compile','k language','native','speed','fast','performance','binary','parallel','wave'], pitch: 'Write in K, compile to native binary. 930x faster than Python.', demo: 'I can show you a K program and its compilation. Try it at begump.com/products/turbo/' },
    orgxray:    { keywords: ['organization','org chart','network','silo','bottleneck','team','connection','structure'], pitch: 'Drop in connections, get back the real structure. Finds bottlenecks and silos.', demo: 'Describe your team connections and I\'ll find the tensions. Try it at begump.com/products/orgxray/' },
    knowledge:  { keywords: ['knowledge','graph','concept','text','gap','absorb','tension','missing'], pitch: 'Feed it text. It finds what\'s missing between concepts.', demo: 'Give me a paragraph and I\'ll show the knowledge gaps. Try it at begump.com/products/knowledge/' },
    learnengine:{ keywords: ['learn','student','understand','grok','quiz','education','teach','curriculum'], pitch: 'Detects the moment understanding clicks — not quiz scores, real comprehension.', demo: 'I can explain how it distinguishes memorization from understanding. Try it at begump.com/products/learnengine/' },
    sfumato:    { keywords: ['compress','compression','text','entropy','shannon','zip','data','reduce','size'], pitch: 'Text compression analysis. Shannon entropy, character frequency, compression ratio.', demo: 'Paste any text and see the compression profile. Try it at begump.com/products/sfumato/' },
    alanseye:   { keywords: ['color','paint','match','blend','delta','pigment','mix','shade','tint'], pitch: 'Color matching for painters. Delta-E comparison, blend paths, dry time estimates.', demo: 'Pick two colors and I\'ll show you how close they are. Try it at begump.com/products/alans-eye/' },
  },

  detect: function(text) {
    var lower = text.toLowerCase();
    var scores = {};
    var maxScore = 0;
    var bestProduct = null;

    for (var key in this.catalog) {
      var product = this.catalog[key];
      var score = 0;
      for (var i = 0; i < product.keywords.length; i++) {
        if (lower.indexOf(product.keywords[i]) !== -1) score += 1;
      }
      if (score > maxScore) { maxScore = score; bestProduct = key; }
      if (score > 0) scores[key] = score;
    }

    return { product: bestProduct, score: maxScore, alternatives: scores, isProductQuery: maxScore >= 1 };
  },

  respond: function(text, detection) {
    if (!detection.isProductQuery) return null;
    var product = this.catalog[detection.product];
    if (!product) return null;

    var response = product.pitch + '\n\n' + product.demo;

    var altKeys = Object.keys(detection.alternatives);
    if (altKeys.length > 1) {
      var others = altKeys.filter(function(k) { return k !== detection.product; }).slice(0, 2);
      if (others.length > 0) {
        response += '\n\nRelated: ' + others.map(function(k) {
          return Products.catalog[k].pitch.split('.')[0];
        }).join('. Also: ') + '.';
      }
    }

    return response;
  },

  tension: function(detection) {
    var tensions = {
      oracle:     'What data are you trying to predict? Sales, traffic, something else?',
      trace:      'What kind of transactions are you looking at?',
      foldwatch:  'Do you have a protein sequence? Or are you looking at disease proteins?',
      dissonance: 'What system are you monitoring?',
      accord:     'What industry are you in? That determines which regulations apply.',
      sensor:     'What kind of data do you have? Any time series works.',
      aitrainer:  'What kind of model are you training?',
      chipfast:   'How many gates in your design?',
      turbo:      'What computation are you trying to speed up?',
      orgxray:    'How many people are in the network?',
      knowledge:  'What text do you want to analyze?',
      learnengine:'What subject are you teaching?',
      sfumato:    'What text do you want to compress?',
      alanseye:   'What colors are you trying to match?',
    };
    return tensions[detection.product] || 'What are you working on?';
  },

  metaResponse: function(text) {
    var lower = text.toLowerCase();
    if (lower.match(/tool|product|this page|this site|begump|what.*(do you|can you|offer|have)|tell me about/)) {
      return 'GUMP has 14 computation tools. They all run locally — your data never leaves your machine. Everything is free.\n\nThe main ones: Fold Watch (protein analysis), Oracle (spectral prediction), Sensor (K/R/E/T diagnosis), Trace (financial forensics), Chip Fast (VLSI placement).\n\nEverything ships via pip install begump. What are you working on? I\'ll point you to the right one.';
    }
    if (lower.match(/how.*(work|run|built|made|function)|what.*(under|behind|engine|math)/)) {
      return 'Everything is built on coupling. K measures how strongly things connect. R measures synchronization. E is energy cost. T is tension — what wants to connect but hasn\'t.\n\nThe same math folds proteins, detects fraud, predicts time series, and places chips. It runs on your machine. pip install begump.\n\nWant me to walk you through a specific one?';
    }
    if (lower.match(/who.*(made|built|created|behind)|about.*(you|gump|begump)/)) {
      return 'beGump was built by Jim McCandless — drummer, dad, self-taught engineer. The math came from music: everything is coupled oscillation. The tools came from applying that one idea everywhere.\n\nColumbus, NJ. Everything free. begump.com.';
    }
    if (lower.match(/free|cost|price|pricing|how much/)) {
      return 'Everything is free. All 14 tools. No limits. No login. Your data never leaves your machine.\n\npip install begump\n\nIf it helped, begump.com/support/ is how this keeps going.';
    }
    return null;
  },

  handle: function(text) {
    var meta = this.metaResponse(text);
    if (meta) return meta;

    var detection = this.detect(text);
    if (!detection.isProductQuery) return null;

    var response = this.respond(text, detection);
    if (!response) return null;

    return response + '\n\n' + this.tension(detection) + '\n\nEverything is free. pip install begump.';
  }
};
