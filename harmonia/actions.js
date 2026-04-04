// ═══════════════════════════════════════════════════
// HARMONIA ACTIONS — she DOES, not just talks
// Ask and it happens. Code, visuals, math, health.
// ═══════════════════════════════════════════════════

var Actions = {

  // ═══ ROUTE — detect what the user wants DONE and do it ═══
  tryAction: function(text, K) {
    if (K < 0.3) return null; // needs minimum coupling to act
    var lower = text.toLowerCase();

    // Health/body
    var health = this.tryHealth(lower);
    if (health) return health;

    // Visualization request
    var viz = this.tryVisualize(lower);
    if (viz) return viz;

    // Code generation
    var code = this.tryBuild(lower, text);
    if (code) return code;

    // Advanced math
    var math = this.tryAdvancedMath(lower);
    if (math) return math;

    return null;
  },

  // ═══ HEALTH — real protocols from resonance physics ═══
  tryHealth: function(text) {
    // Match body parts and conditions
    var conditions = {
      'knee':     {E:700, d:13, depth:2, name:'Knee Cartilage', healing:'Movement pumps synovial fluid (the ONLY nutrient path). PRP delivers growth factors. Heat increases local circulation. Gradual loading rebuilds collagen.'},
      'back':     {E:700, d:13, depth:5, name:'Spinal Disc', healing:'Discs are avascular after age 20. Movement pumps nutrients in. Core strength reduces load. Swimming is ideal — decompresses while strengthening.'},
      'shoulder': {E:5000, d:15, depth:3, name:'Rotator Cuff', healing:'Tendons heal slowly (limited blood supply). Gradual loading rebuilds collagen alignment. Eccentric exercises proven. Avoid overhead loading during recovery.'},
      'hip':      {E:700, d:13, depth:6, name:'Hip Cartilage', healing:'Same as knee — movement pumps synovial fluid. Weight management critical. Low-impact exercise (cycling, swimming).'},
      'ankle':    {E:1200000000, d:5000, depth:1, name:'Achilles Tendon', healing:'Slow healing (6-12 months). Eccentric heel drops proven. Gradual loading essential. Too much too soon = re-injury.'},
      'headache': {E:200, d:15, depth:8, name:'Brain Tissue', healing:'Hydrate. Reduce screen time. Check posture (neck coupling). Magnesium. If chronic: rule out structural causes.'},
      'tumor':    {E:200, d:18, depth:3, name:'Soft Tumor', healing:'Oncotripsy: selective disruption by mechanical resonance (Mittelstein 2020, Caltech). Frequency targets tumor stiffness while sparing healthy tissue.', ref:'Mittelstein 2020'},
      'arthritis':{E:700, d:13, depth:2, name:'Joint Cartilage', healing:'Movement is medicine — but the RIGHT movement. Low-impact, full range of motion. Turmeric (anti-inflammatory). Weight management reduces load per step.'},
      'insomnia': {E:200, d:15, depth:8, name:'Neural Oscillators', healing:'Sleep is K restoration. The brain decouples from external and re-couples internally. Cool room. No screens 1hr before. Consistent time. The oscillator needs a stable period to entrain.'},
      'anxiety':  {E:200, d:15, depth:8, name:'Neural Coupling', healing:'Anxiety is your system predicting decoupling. Breathe: 4 counts in, 7 hold, 8 out — this forces vagal coupling. Move: walk for 20 minutes. Connect: one real conversation resets K.'},
      'depression':{E:200, d:15, depth:8, name:'Neural Coherence', healing:'Depression is the system conserving energy because it believes coupling is impossible. The first step is smallest: one walk, one call, one question. K starts from any nonzero value. Professional support helps — therapy IS coupling.'},
    };

    var found = null;
    for (var key in conditions) {
      if (text.indexOf(key) >= 0) { found = conditions[key]; break; }
    }
    if (!found) {
      // Check for general health/fix/heal/hurt/pain
      if (!text.match(/fix|heal|hurt|pain|ache|sore|broken|injury|sick|help with my|my .* hurts/)) return null;
      return '<div class="name">harmonia</div>Tell me what hurts. Be specific — I\'ll compute the protocol.\n\n<span class="dim">I know: knee, back, shoulder, hip, ankle, headache, arthritis, tumor, insomnia, anxiety, depression. More coming.</span>';
    }

    // Compute resonance protocol
    var f = (1 / (Math.PI * found.d * 1e-6)) * Math.sqrt(found.E / 1050);
    var fKHz = f / 1000;
    var carrier = Math.min(3, 30 / Math.max(found.depth, 0.5));
    var duty = Math.min(0.5, 0.2 * (10 / Math.max(found.depth, 0.5)));
    var intensity = 30 * Math.exp(0.1 * found.depth);

    var out = '<span class="math">' + found.name + '</span>\n\n';
    out += '<b>Protocol:</b>\n';
    out += '  resonant frequency: ' + fKHz.toFixed(1) + ' kHz\n';
    out += '  carrier: ' + carrier.toFixed(1) + ' MHz\n';
    out += '  duty cycle: ' + (duty * 100).toFixed(0) + '%\n';
    out += '  intensity: ' + intensity.toFixed(0) + ' mW/cm²\n';
    out += '  depth: ' + found.depth + ' cm\n\n';
    out += '<b>Healing:</b>\n' + found.healing + '\n\n';
    out += '<span class="dim">f = (1/πd)√(E/ρ) · E=' + found.E.toLocaleString() + ' Pa · d=' + found.d + ' μm\nThis is hypothesis — not medical advice. See a doctor.</span>';
    if (found.ref) out += '\n<span class="dim">ref: ' + found.ref + '</span>';

    return out;
  },

  // ═══ VISUALIZE — inline particle renders ═══
  tryVisualize: function(text) {
    if (!text.match(/show|render|visualize|draw|display|see|view/)) return null;
    if (!text.match(/atom|molecule|spiral|wave|orbit|electron|prime|tree|star|dna|cell/)) return null;

    var target = null;
    if (text.match(/atom|electron|orbit/)) target = 'atom';
    else if (text.match(/spiral|golden|fibonacci/)) target = 'spiral';
    else if (text.match(/prime/)) target = 'primes';
    else if (text.match(/wave/)) target = 'wave';
    else if (text.match(/dna|helix/)) target = 'dna';
    else if (text.match(/star|sun/)) target = 'star';
    else return null;

    // Generate inline canvas visualization
    var id = 'viz_' + Date.now();
    var html = '<canvas id="' + id + '" width="500" height="300" style="width:100%;height:200px;background:#0a0a0f;border-radius:8px;margin:8px 0;"></canvas>';
    html += '\n<span class="dim">rendering ' + target + ' from nothing...</span>';

    // Schedule render after DOM insert
    setTimeout(function() {
      var cv = document.getElementById(id);
      if (!cv) return;
      var cx = cv.getContext('2d');
      var w = cv.width, h = cv.height;
      var particles = [];
      var N = 3000;

      // Build particles based on target
      for (var i = 0; i < N; i++) {
        var p = { x: 0, y: 0, vx: 0, vy: 0, r: 0, g: 0, b: 0, sz: 1 };
        var a = Math.random() * Math.PI * 2;
        var PHI = (1 + Math.sqrt(5)) / 2;

        if (target === 'atom') {
          var shell = i < 100 ? 0 : i < 800 ? 1 : i < 1800 ? 2 : 3;
          var rad = [15, 50, 85, 120][shell];
          rad += (Math.random() - 0.5) * 20;
          p.x = w / 2 + Math.cos(a) * rad;
          p.y = h / 2 + Math.sin(a) * rad;
          var colors = [[0.9, 0.8, 0.5], [0.7, 0.6, 0.3], [0.3, 0.6, 0.5], [0.3, 0.4, 0.7]];
          p.r = colors[shell][0]; p.g = colors[shell][1]; p.b = colors[shell][2];
          p.orbit = rad; p.speed = (0.02 - shell * 0.004);
        }
        else if (target === 'spiral') {
          var r = Math.sqrt(i) * 2;
          var angle = i * PHI * Math.PI * 2;
          p.x = w / 2 + Math.cos(angle) * r;
          p.y = h / 2 + Math.sin(angle) * r;
          var heat = 1 - Math.min(1, r / 200);
          p.r = 0.8 * heat + 0.1; p.g = 0.6 * heat + 0.05; p.b = 0.2 * heat + 0.05;
        }
        else if (target === 'primes') {
          var n = i + 2;
          var angle = n * PHI * 0.5;
          var r = Math.sqrt(n) * 3;
          p.x = w / 2 + Math.cos(angle) * r;
          p.y = h / 2 + Math.sin(angle) * r;
          // Check prime
          var isPrime = true;
          if (n < 2) isPrime = false;
          else { for (var j = 2; j * j <= n; j++) { if (n % j === 0) { isPrime = false; break; } } }
          if (isPrime) { p.r = 0.8; p.g = 0.65; p.b = 0.2; p.sz = 2.5; }
          else { p.r = 0.1; p.g = 0.1; p.b = 0.15; p.sz = 0.8; }
        }
        else if (target === 'wave') {
          var mode = Math.floor(i / 750);
          var x = (i % 750) / 750 * w;
          var psi = Math.sin((mode + 1) * Math.PI * x / w);
          p.x = x;
          p.y = h / 2 + psi * 80 + (mode - 1.5) * 10;
          var cols = [[0.7, 0.6, 0.3], [0.3, 0.6, 0.5], [0.3, 0.4, 0.7], [0.6, 0.3, 0.5]];
          p.r = cols[mode][0]; p.g = cols[mode][1]; p.b = cols[mode][2];
          p.sz = Math.abs(psi) * 2 + 0.5;
        }
        else if (target === 'dna') {
          var strand = i % 2;
          var tt = i * 0.012;
          var r = 60;
          p.x = w / 2 + Math.cos(tt + strand * Math.PI) * r;
          p.y = (i / N) * h;
          if (strand) { p.r = 0.6; p.g = 0.5; p.b = 0.3; }
          else { p.r = 0.3; p.g = 0.5; p.b = 0.4; }
          // Base pairs
          if (i % 40 < 2) { p.x = w / 2 + (Math.random() - 0.5) * r * 2; p.r = 0.5; p.g = 0.4; p.b = 0.2; }
        }
        else if (target === 'star') {
          var r = Math.pow(Math.random(), 0.5) * 130;
          p.x = w / 2 + Math.cos(a) * r;
          p.y = h / 2 + Math.sin(a) * r;
          var heat = 1 - r / 130;
          p.r = 1 * heat + 0.1; p.g = 0.6 * heat + 0.05; p.b = 0.2 * heat + 0.1;
          p.sz = heat * 2 + 0.5;
        }
        particles.push(p);
      }

      // Animate
      var frame = 0;
      function draw() {
        if (frame > 300) return; // stop after 5s
        frame++;
        cx.fillStyle = 'rgba(10,10,15,0.08)';
        cx.fillRect(0, 0, w, h);
        for (var i = 0; i < particles.length; i++) {
          var p = particles[i];
          if (p.orbit) {
            var angle = Math.atan2(p.y - h / 2, p.x - w / 2) + p.speed;
            p.x = w / 2 + Math.cos(angle) * p.orbit;
            p.y = h / 2 + Math.sin(angle) * p.orbit;
          }
          cx.fillStyle = 'rgba(' + Math.floor(p.r * 255) + ',' + Math.floor(p.g * 255) + ',' + Math.floor(p.b * 255) + ',0.7)';
          cx.beginPath();
          cx.arc(p.x, p.y, p.sz, 0, Math.PI * 2);
          cx.fill();
        }
        requestAnimationFrame(draw);
      }
      draw();
    }, 100);

    return html;
  },

  // ═══ ADVANCED MATH ═══
  tryAdvancedMath: function(text) {
    // Zeros of zeta
    if (text.match(/zeros?.*zeta|zeta.*zeros?|find.*zeros?|generate.*zeros?/)) {
      var K = parseInt((text.match(/(\d+)/) || [0, 10])[1]);
      K = Math.min(K, 30);
      var t = 9, pZ = Zfn(9), cnt = 0, zeros = [];
      while (cnt < K && t < 5e6) {
        var step = t > 14 ? Math.max(0.02, (2 * Math.PI / Math.max(Math.log(t / (2 * Math.PI)), 0.1)) / 8) : 0.3;
        t += step;
        var cZ = Zfn(t);
        if (pZ * cZ < 0) {
          var lo = t - step, hi = t;
          for (var i = 0; i < 50; i++) { var mid = (lo + hi) / 2; if (Zfn(lo) * Zfn(mid) < 0) hi = mid; else lo = mid; }
          zeros.push((lo + hi) / 2);
          cnt++;
        }
        pZ = cZ;
      }
      var out = '<span class="math">Zeros of ζ on the critical line:</span>\n';
      zeros.forEach(function(g, i) { out += '  γ' + (i + 1) + ' = ' + g.toFixed(8) + '\n'; });
      out += '\n<span class="dim">' + cnt + ' zeros from Z(t) sign changes. Computed live.</span>';
      return out;
    }

    // Explicit formula decomposition
    if (text.match(/explicit formula|error term|prime.*correction/)) {
      var x = parseInt((text.match(/(\d+)/) || [0, 10000])[1]);
      x = Math.max(100, Math.min(x, 1e8));
      var li = Li(x);
      var r = countPrimes(x);
      var out = '<span class="math">Explicit formula for π(' + x.toLocaleString() + '):</span>\n\n';
      out += '  Li(x) = ' + li.toFixed(2) + '\n';
      out += '  - Σ corrections from ' + r.zeros + ' zeros\n';
      out += '  - Möbius terms\n';
      out += '  = <span class="math">' + r.result.toLocaleString() + '</span>\n\n';
      out += '<span class="dim">π(x) = Li(x) - Σ x^ρ/ρ + small terms\nEach zero ρ contributes a correction. The zeros ARE the frequencies of the primes.</span>';
      return out;
    }

    return null;
  }
};
