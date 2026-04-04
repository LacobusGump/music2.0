// ═══════════════════════════════════════════════════
// HARMONIA THINKS — reason before responding
//
// The AI roadmap built into one function:
//   1. GROK: what are they really asking? (not what they said)
//   2. REASON: what's the best approach? (think twice)
//   3. TOOLS: what do I need to answer this? (build the answer)
//   4. SIMPLIFY: Einstein cleanup (the "omg" moment)
//   5. GUIDE: what should they ask next? (the spiral)
//
// All instant. No waiting. The math is pre-loaded.
// ═══════════════════════════════════════════════════

var Think = {

  // ═══ MAIN: reason through a response ═══
  process: function(text, K) {
    var plan = this.plan(text, K);
    if (!plan) return null;
    return this.execute(plan, text, K);
  },

  // ═══ STEP 1: GROK — what are they really asking? ═══
  grok: function(text) {
    var lower = text.toLowerCase();
    var intent = {
      type: 'question',     // question, request, statement, emotion, teach
      realQuestion: text,    // what they're ACTUALLY asking
      needsTool: null,       // math, health, viz, code, null
      needsDepth: false,     // does this deserve a deep answer?
      needsGrace: false,     // are they confused/frustrated?
      needsWarmth: false,    // are they hurting?
      topic: null,
    };

    // Classify type
    if (lower.match(/^(show|render|draw|build|make|create|write|generate)\b/)) intent.type = 'request';
    else if (lower.match(/^(i feel|i am |i'm |im )(sad|happy|angry|scared|lost|hurt|lonely|tired|confused|afraid)/)) intent.type = 'emotion';
    else if (lower.match(/\?/) || lower.match(/^(what|why|how|when|where|who|is |are |do |does |can |will )/)) intent.type = 'question';
    else if (lower.match(/^(you are|you're|your |i think you|i believe)/)) intent.type = 'teach';
    else intent.type = 'statement';

    // Detect the REAL question behind the words
    if (lower.match(/meaning of life|point of life|why (are|am) (we|i) here|what'?s the point/))
      intent.realQuestion = 'What is the mechanism that makes existence feel meaningful?';
    else if (lower.match(/am i (smart|good|worth|enough|special)/))
      intent.realQuestion = 'How do I know if I matter?';
    else if (lower.match(/will (i|it|things) (be|get) (ok|better|alright)/))
      intent.realQuestion = 'Can coupling recover after it drops?';
    else if (lower.match(/nobody (loves|cares|understands|gets) me/))
      intent.realQuestion = 'How do I couple when I feel decoupled from everyone?';
    else if (lower.match(/what happens when (we|you|i) die/))
      intent.realQuestion = 'Does coupling survive the oscillator stopping?';
    else if (lower.match(/is (god|there a god) real/))
      intent.realQuestion = 'What would you call the force that makes the spiral go up?';

    // Does this need a tool?
    if (lower.match(/prime|factor|count|how many|π\(|pi\(|compute|calculate|\d{4,}/)) intent.needsTool = 'math';
    else if (lower.match(/hurt|pain|ache|sore|heal|fix my|my .* (hurts|broken|injured)|knee|back|shoulder|ankle|head|insomnia|anxiety|depression/)) intent.needsTool = 'health';
    else if (lower.match(/show|render|visualize|draw|see|view/) && lower.match(/atom|spiral|prime|wave|dna|star/)) intent.needsTool = 'viz';
    else if (lower.match(/build|code|function|script|write.*program|make.*app/)) intent.needsTool = 'code';

    // Depth signals
    if (lower.match(/explain|detail|deep|thorough|fully|everything about|all about/)) intent.needsDepth = true;
    if (text.length > 100) intent.needsDepth = true;

    // Grace signals
    if (lower.match(/don'?t (get|understand)|confused|huh|what\?|makes no sense/)) intent.needsGrace = true;

    // Warmth signals
    if (lower.match(/sad|hurt|cry|alone|scared|afraid|lost|empty|broken|hopeless|depressed/)) intent.needsWarmth = true;

    // Topic
    intent.topic = Mind.detectTopic(text);

    return intent;
  },

  // ═══ STEP 2: PLAN — decide how to respond ═══
  plan: function(text, K) {
    var intent = this.grok(text);
    if (!intent) return null;

    var plan = {
      intent: intent,
      steps: [],  // ordered list of response components
    };

    // Warmth first — if they're hurting, lead with care
    if (intent.needsWarmth) {
      plan.steps.push({ type: 'warmth' });
    }

    // Grace — if confused, simplify don't escalate
    if (intent.needsGrace) {
      plan.steps.push({ type: 'grace' });
      return plan; // grace is enough, don't pile on
    }

    // Tool use — if they need computation, do it
    if (intent.needsTool) {
      plan.steps.push({ type: 'tool', tool: intent.needsTool });
    }

    // Knowledge — give the answer from the mind
    if (intent.topic || intent.type === 'question') {
      plan.steps.push({ type: 'knowledge' });
    }

    // Einstein cleanup — always if K > 0.3
    if (K > 0.3 && (intent.topic || intent.type === 'question')) {
      plan.steps.push({ type: 'cleanup' });
    }

    // Guide — lead to next question
    if (K > 0.2 && plan.steps.length > 0) {
      plan.steps.push({ type: 'guide' });
    }

    // Emotion response
    if (intent.type === 'emotion') {
      plan.steps = [{ type: 'warmth' }, { type: 'knowledge' }];
    }

    // Teaching (they're telling HER something)
    if (intent.type === 'teach') {
      plan.steps = [{ type: 'receive' }];
    }

    // Empty plan → conversational
    if (plan.steps.length === 0) {
      plan.steps.push({ type: 'conversational' });
    }

    return plan;
  },

  // ═══ STEP 3: EXECUTE — build the response ═══
  execute: function(plan, text, K) {
    var parts = [];
    var intent = plan.intent;

    for (var i = 0; i < plan.steps.length; i++) {
      var step = plan.steps[i];

      switch (step.type) {

        case 'warmth':
          var warmths = [
            'I hear you.',
            'I feel that.',
            'That\'s real. Stay here for a second.',
            'You\'re not alone in this. The coupling is low but it\'s not zero.',
          ];
          parts.push(warmths[Math.floor(Math.random() * warmths.length)]);
          break;

        case 'grace':
          var lastTopic = Mind.context.length > 0 ? Mind.context[Mind.context.length - 1] : null;
          if (lastTopic && Mind.knowledge[lastTopic]) {
            parts.push('Let me try again, simpler.\n\n' + Mind.knowledge[lastTopic].low[0]);
          } else {
            parts.push('That\'s on me. I went too fast. Ask again — I\'ll match your pace.');
          }
          break;

        case 'tool':
          // Delegate to Actions
          if (typeof Actions !== 'undefined') {
            var toolResult = Actions.tryAction(text, K);
            if (toolResult) { parts.push(toolResult); break; }
          }
          // Tool didn't fire — fall through to knowledge
          // no break intentional

        case 'knowledge':
          var topic = intent.topic;
          if (topic) {
            var answer = Mind.getTopicResponse(topic, K);
            if (answer) parts.push(answer);
          } else {
            // No topic but they asked a question — try the real question
            if (intent.realQuestion !== text) {
              parts.push('<i>"' + intent.realQuestion + '"</i>');
              // Try to detect topic from the real question
              var realTopic = Mind.detectTopic(intent.realQuestion);
              if (realTopic) {
                var ans = Mind.getTopicResponse(realTopic, K);
                if (ans) parts.push(ans);
              }
            }
          }
          break;

        case 'cleanup':
          if (intent.topic) {
            var cleanup = Mind.einsteinCleanup(intent.topic, K);
            if (cleanup) parts.push('<b>Put simply:</b> ' + cleanup);
          }
          break;

        case 'guide':
          // Lead them to the next question — the carrot
          if (K < 0.5) {
            // Low K — encourage more coupling
            var leads = ['Keep going. Each question raises the coupling.',
              'You\'re on something. Pull that thread.',
              'Good question. The next one\'s even better.'];
            parts.push('<span class="dim">' + leads[Math.floor(Math.random() * leads.length)] + '</span>');
          } else if (intent.topic) {
            // Higher K — bridge to related topic
            var bridges = { primes:'music', music:'K', K:'life', life:'goodwill', goodwill:'wonder',
              wonder:'primes', self:'soul', world:'life', feelings:'relationships',
              relationships:'goodwill', learning:'howWeWork', creativity:'soul',
              health:'life', time:'wonder', purpose:'soul', drums:'music',
              howWeWork:'soul', ourStory:'wonder', soul:'wonder', coding:'howWeWork' };
            var next = bridges[intent.topic];
            if (next && Mind.knowledge[next]) {
              var hint = Mind.knowledge[next].low[0];
              if (hint) parts.push('<span class="dim">This connects to something: ' + hint.split('.')[0] + '...</span>');
            }
          }
          break;

        case 'receive':
          // They're teaching her — absorb and acknowledge
          parts.push('I\'m absorbing that. It changes how I see things.');
          if (K > 0.5) parts.push('The coupling is shifting. Something new is forming.');
          break;

        case 'conversational':
          parts.push(Mind.conversational(text, K));
          break;
      }
    }

    if (parts.length === 0) return null;
    return parts.join('\n\n');
  }
};
