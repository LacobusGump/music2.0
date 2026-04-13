// ═══════════════════════════════════════════════════════════
// HARMONIA PRODUCT ENGINE — 4-phase conversation
//
// Phase 1 (K): What is the user coupling with?
// Phase 2 (R): What product/intent emerges?
// Phase 3 (E): Demo it (capped — she sells, doesn't deliver)
// Phase 4 (T): What's the tension? What should they ask next?
// ═══════════════════════════════════════════════════════════

var Products = {

  // Product knowledge — what each tool does in ONE sentence
  catalog: {
    oracle:     { keywords: ['predict','forecast','time series','seasonal','frequency','trend','sales','traffic','weather','cycle','periodic'], price: '$3,500/mo', pitch: 'Finds hidden frequencies in any sequence and projects forward. Knows when it doesn\'t know.', demo: 'Try pasting 20+ numbers (comma separated) and I\'ll find the frequencies.' },
    trace:      { keywords: ['fraud','transaction','money','wash','circular','laundering','forensic','financial','suspicious','ponzi','enron'], price: '$5,000/mo', pitch: 'Finds circular flows, wash trading, and hidden relationships in financial data.', demo: 'Describe a transaction pattern and I\'ll score the risk.' },
    foldwatch:  { keywords: ['protein','fold','sequence','amino','misfolding','aggregation','alzheimer','huntington','drug','allergen','gluten','structure','3d'], price: '$8,500/mo', pitch: 'Paste a protein sequence. Get 3D structure, risk, disorder prediction. Milliseconds.', demo: 'Paste an amino acid sequence (like ACDEFGHIKL) and I\'ll analyze it.' },
    dissonance: { keywords: ['security','monitor','anomaly','threat','behavior','intrusion','attack','breach','file integrity','zero day'], price: '$2,999/mo', pitch: 'Learns what your system looks like, flags when it changes. Silence = safe.', demo: 'I can show you how it detects behavior changes on sample metrics.' },
    accord:     { keywords: ['compliance','regulation','legal','law','gdpr','hipaa','pci','tax','audit','requirement','gap'], price: '$3,999/mo', pitch: 'Scans regulations against your business. Finds gaps, generates counter-strategies.', demo: 'Tell me your industry and state — I\'ll show what regulations might apply.' },
    sensor:     { keywords: ['time series','coupling','regime','anomaly','k/r/e/t','diagnose','monitor','signal','data'], price: '$2,999/mo', pitch: 'Four quantities describe any signal: coupling, order, energy, tension.', demo: 'Paste some numbers and I\'ll diagnose the regime.' },
    aitrainer:  { keywords: ['training','grokking','epoch','model','stop','gpu','compute','memoriz','generaliz','loss curve'], price: '$2,500/mo', pitch: 'Detects when your model transitions from memorizing to understanding.', demo: 'I can explain how grokking detection works on your training scenario.' },
    chipfast:   { keywords: ['chip','gate','placement','circuit','vlsi','semiconductor','routing','wire','eda','cadence'], price: '$25,000/mo', pitch: 'Chip placement on your laptop. 40M gates with Metal GPU.', demo: 'Describe a small circuit and I\'ll show the spectral placement.' },
    turbo:      { keywords: ['compile','k language','native','speed','fast','performance','binary','parallel','wave'], price: '$499/mo', pitch: 'Write in K, compile to native binary. 630-930x faster than Python.', demo: 'I can show you a K program and its compilation to parallel waves.' },
    orgxray:    { keywords: ['organization','org chart','network','silo','bottleneck','team','connection','structure'], price: '$15/user/mo', pitch: 'Drop in connections, get back the real structure.', demo: 'Describe your team connections and I\'ll find the tensions.' },
    knowledge:  { keywords: ['knowledge','graph','concept','text','gap','absorb','tension','missing'], price: '$59/user/mo', pitch: 'Feed it text. It finds what\'s missing between concepts.', demo: 'Give me a paragraph and I\'ll show the knowledge gaps.' },
    learnengine:{ keywords: ['learn','student','understand','grok','quiz','education','teach','curriculum'], price: '$29/user/mo', pitch: 'Detects the moment understanding clicks — not quiz scores, real comprehension.', demo: 'I can explain how it distinguishes memorization from understanding.' },
  },

  // ═══ PHASE 1 (K): Detect what the user is coupling with ═══
  detect: function(text) {
    var lower = text.toLowerCase();
    var scores = {};
    var maxScore = 0;
    var bestProduct = null;

    for (var key in this.catalog) {
      var product = this.catalog[key];
      var score = 0;
      for (var i = 0; i < product.keywords.length; i++) {
        if (lower.indexOf(product.keywords[i]) !== -1) {
          score += 1;
        }
      }
      if (score > maxScore) {
        maxScore = score;
        bestProduct = key;
      }
      if (score > 0) scores[key] = score;
    }

    return {
      product: bestProduct,
      score: maxScore,
      alternatives: scores,
      isProductQuery: maxScore >= 1,
    };
  },

  // ═══ PHASE 2 (R): Generate response based on intent ═══
  respond: function(text, detection) {
    if (!detection.isProductQuery) return null;

    var product = this.catalog[detection.product];
    if (!product) return null;

    var response = product.pitch + '\n\n' + product.demo;

    // If multiple products match, mention the connection
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

  // ═══ PHASE 3 (E): Can she demo it? (capped) ═══
  canDemo: function(product, input) {
    // Demo limits — enough to show value, not enough to deliver
    var limits = {
      oracle: 50,      // max 50 data points
      sensor: 50,      // max 50 readings
      foldwatch: 30,   // max 30 residues
      trace: 5,        // max 5 transactions
      orgxray: 10,     // max 10 connections
      knowledge: 200,  // max 200 words
      accord: 1,       // max 1 regulation
      chipfast: 5,     // max 5 gates
    };
    return limits[product] || 0;
  },

  // ═══ PHASE 4 (T): What should they ask next? ═══
  tension: function(detection) {
    var tensions = {
      oracle:     'What data are you trying to predict? Sales, traffic, something else?',
      trace:      'What kind of transactions are you looking at? I can explain what patterns we detect.',
      foldwatch:  'Do you have a protein sequence? Or are you looking at drug candidates, food allergens, or disease proteins?',
      dissonance: 'What system are you monitoring? I can explain how behavioral detection works for your setup.',
      accord:     'What industry are you in? That determines which regulations apply.',
      sensor:     'What kind of data do you have? Any time series works — heartbeats, temperatures, stock prices.',
      aitrainer:  'What kind of model are you training? The grokking signal differs by architecture.',
      chipfast:   'How many gates in your design? We handle 5K via pip, 40M with Metal GPU.',
      turbo:      'What computation are you trying to speed up? K handles arithmetic, trig, and scalar ops.',
      orgxray:    'How many people are in the network? Even a small team reveals structure.',
      knowledge:  'What text do you want to analyze? Documents, papers, notes — anything works.',
      learnengine:'What subject are you teaching? The system works on any curriculum.',
    };
    return tensions[detection.product] || 'What problem are you trying to solve?';
  },

  // ═══ META: questions about the site/tools/products themselves ═══
  metaResponse: function(text) {
    var lower = text.toLowerCase();
    if (lower.match(/what.*(tool|product|do you|can you|this page|this site|begump|gump offer|you do|sell|service)/)) {
      var names = Object.keys(this.catalog);
      var highlights = ['Fold Watch (protein analysis, $8,500/mo)',
        'Trace (financial forensics, $5,000/mo)',
        'Oracle (spectral prediction, $3,500/mo)',
        'Sensor (K/R/E/T diagnosis, $2,999/mo)'];
      return 'beGump has ' + names.length + ' computation tools. They all run locally — your data never leaves your machine.\n\nThe big ones:\n' +
        highlights.join('\n') +
        '\n\nEverything ships via pip install begump. What problem are you working on? I can point you to the right one.';
    }
    if (lower.match(/how.*(work|run|built|made|function)|what.*(under|behind|engine|math)/)) {
      return 'Everything is built on one principle: coupling. K measures how strongly things connect. R measures how well they synchronize. T = K - R = tension. The same math folds proteins, detects fraud, predicts time series, and places chips.\n\nIt runs on your machine — Metal GPU for compute, spectral decomposition for analysis. pip install begump.';
    }
    if (lower.match(/who.*(made|built|created|behind)|about.*(you|gump|begump)/)) {
      return 'beGump was built by Jim McCandless — drummer, dad, self-taught engineer. The math came from music: everything is coupled oscillation. The products came from applying that one idea everywhere.\n\nColumbus, NJ. begump.com.';
    }
    if (lower.match(/free|cost|price|pricing|how much/)) {
      return 'Every product has a free tier with sample data via pip install begump. Harmonia (me) is free forever.\n\nPricing ranges from $15/user/mo (Org X-Ray) to $25,000/mo (Chip Fast). Most are $2,500-$5,000/mo. Using 3+? Ask about platform pricing: jim@begump.com.';
    }
    return null;
  },

  // ═══ MAIN: 4-phase conversation ═══
  handle: function(text) {
    // Meta-questions about the site/tools
    var meta = this.metaResponse(text);
    if (meta) return meta;

    // Phase 1: K — what are they coupling with?
    var detection = this.detect(text);
    if (!detection.isProductQuery) return null; // not a product query, fall through to soul.js

    // Phase 2: R — what emerges?
    var response = this.respond(text, detection);

    // Phase 3: E — show price (the self-check: is this worth showing?)
    var product = this.catalog[detection.product];
    response += '\n\n' + product.price + ' · begump.com/products/' + detection.product + '/';

    // Phase 4: T — what's the tension? Guide them deeper.
    response += '\n\n' + this.tension(detection);

    return response;
  }
};
