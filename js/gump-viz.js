// ═══════════════════════════════════════════════════════════════
// GUMP-VIZ — Visual rendering from the math itself
//
// Every color IS a K value. Every animation period IS φ.
// Every placement angle IS 137.5°. Nothing decorative.
//
// Usage:
//   <canvas id="my-graph"></canvas>
//   <script src="/js/gump-viz.js"></script>
//   <script>
//     GumpViz.couplingGraph('my-graph', {
//       nodes: [{name:'Heart',group:0}, {name:'Brain',group:0}],
//       edges: [{from:0,to:1,weight:0.8}]
//     });
//   </script>
//
// Components:
//   couplingGraph  — force-directed graph with K/R coloring
//   phaseCircle    — R synchronization as circular phase diagram
//   kMeter         — animated coupling strength gauge
//   eigenWaterfall — Fiedler eigenvalue spectrum
//   damageMap      — node vulnerability heatmap on a graph
// ═══════════════════════════════════════════════════════════════

var GumpViz = (function() {
  'use strict';

  // ═══ CONSTANTS FROM THE MATH ═══
  var PHI = (1 + Math.sqrt(5)) / 2;          // 1.618...
  var GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // 2.399963 rad = 137.5°
  var K_STAR = 1.868;                         // coupling ceiling
  var INV_PHI = 1 / PHI;                      // 0.618... critical threshold
  var BREATH = PHI;                           // animation period in seconds

  // ═══ COLORS — each IS a K value ═══
  var C = {
    gold:    [201, 164, 74],   // #c9a44a — K ceiling
    green:   [68, 170, 153],   // #4a9 — 1/φ threshold
    amber:   [201, 153, 68],   // #c94 — tension
    red:     [204, 68, 68],    // #c44 — failure
    void_bg: [8, 8, 13],      // #08080d — void
    text:    [232, 228, 220],  // #e8e4dc — text
    dim:     [136, 136, 136],  // #888
    faint:   [68, 68, 68],     // #444
  };

  function rgba(c, a) {
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  }

  function lerp(a, b, t) { return a + (b - a) * t; }

  function lerpColor(c1, c2, t) {
    return [
      Math.round(lerp(c1[0], c2[0], t)),
      Math.round(lerp(c1[1], c2[1], t)),
      Math.round(lerp(c1[2], c2[2], t))
    ];
  }

  // K-value to color: 0→red, 0.618→green, 1→gold
  function kColor(k) {
    k = Math.max(0, Math.min(1, k));
    if (k < INV_PHI) {
      var t = k / INV_PHI;
      return lerpColor(C.red, C.green, t);
    } else {
      var t = (k - INV_PHI) / (1 - INV_PHI);
      return lerpColor(C.green, C.gold, t);
    }
  }

  // Tension to color: 0→gold (resolved), 1→red (tense)
  function tensionColor(t) {
    t = Math.max(0, Math.min(1, t));
    if (t < 0.5) return lerpColor(C.gold, C.amber, t * 2);
    return lerpColor(C.amber, C.red, (t - 0.5) * 2);
  }

  // Setup canvas with DPR
  function setupCanvas(id) {
    var cv = document.getElementById(id);
    if (!cv) return null;
    var dpr = window.devicePixelRatio || 1;
    var rect = cv.getBoundingClientRect();
    var W = rect.width, H = rect.height;
    cv.width = W * dpr;
    cv.height = H * dpr;
    var cx = cv.getContext('2d');
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { cv: cv, cx: cx, W: W, H: H, dpr: dpr };
  }

  // Smooth step
  function smoothstep(t) { return t * t * (3 - 2 * t); }

  // ═══════════════════════════════════════════════════════════
  // COUPLING GRAPH — force-directed with K/R coloring
  // ═══════════════════════════════════════════════════════════
  function couplingGraph(canvasId, data, opts) {
    opts = opts || {};
    var s = setupCanvas(canvasId);
    if (!s) return;
    var cx = s.cx, W = s.W, H = s.H, cv = s.cv;

    var nodes = data.nodes || [];
    var edges = data.edges || [];
    var N = nodes.length;
    if (N === 0) return;

    // Options
    var showLabels = opts.labels !== false;
    var breathe = opts.breathe !== false;
    var interactive = opts.interactive !== false;
    var showKR = opts.showKR !== false;
    var fiedlerSplit = opts.fiedlerSplit || null; // array of group assignments

    // Initialize node positions on golden spiral
    var state = [];
    for (var i = 0; i < N; i++) {
      var angle = i * GOLDEN_ANGLE;
      var r = Math.sqrt(i + 1) * Math.min(W, H) * 0.08;
      var bx = W / 2 + Math.cos(angle) * r;
      var by = H / 2 + Math.sin(angle) * r;
      state.push({
        x: bx, y: by, vx: 0, vy: 0,
        baseX: bx, baseY: by,
        phase: Math.random() * Math.PI * 2,
        freq: 0.2 + Math.random() * 0.3,
        size: opts.nodeSize || (5 + (nodes[i].size || 0) * 2),
        group: nodes[i].group || 0,
        k: nodes[i].k || 0.5,
        damage: nodes[i].damage || 0
      });
    }

    // Force-directed layout: run 100 iterations to settle
    for (var iter = 0; iter < 100; iter++) {
      // Repulsion between all nodes
      for (var i = 0; i < N; i++) {
        for (var j = i + 1; j < N; j++) {
          var dx = state[i].x - state[j].x;
          var dy = state[i].y - state[j].y;
          var d2 = dx * dx + dy * dy;
          if (d2 < 1) d2 = 1;
          var d = Math.sqrt(d2);
          var repulse = 800 / d2;
          state[i].vx += dx / d * repulse;
          state[i].vy += dy / d * repulse;
          state[j].vx -= dx / d * repulse;
          state[j].vy -= dy / d * repulse;
        }
      }
      // Attraction along edges
      for (var e = 0; e < edges.length; e++) {
        var a = state[edges[e].from], b = state[edges[e].to];
        var w = edges[e].weight || 0.5;
        var dx = b.x - a.x, dy = b.y - a.y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < 1) continue;
        var ideal = 50 + (1 - w) * 80;
        var force = (d - ideal) * 0.01 * w;
        a.vx += dx / d * force;
        a.vy += dy / d * force;
        b.vx -= dx / d * force;
        b.vy -= dy / d * force;
      }
      // Center gravity
      for (var i = 0; i < N; i++) {
        state[i].vx += (W / 2 - state[i].x) * 0.005;
        state[i].vy += (H / 2 - state[i].y) * 0.005;
        state[i].vx *= 0.8;
        state[i].vy *= 0.8;
        state[i].x += state[i].vx;
        state[i].y += state[i].vy;
        // Clamp to canvas
        state[i].x = Math.max(30, Math.min(W - 30, state[i].x));
        state[i].y = Math.max(30, Math.min(H - 30, state[i].y));
      }
    }

    // Save settled positions as base
    for (var i = 0; i < N; i++) {
      state[i].baseX = state[i].x;
      state[i].baseY = state[i].y;
      state[i].vx = 0;
      state[i].vy = 0;
    }

    // Mouse state
    var mx = -1000, my = -1000, mActive = false, hovered = -1;
    if (interactive) {
      cv.addEventListener('mousemove', function(e) {
        var r = cv.getBoundingClientRect();
        mx = e.clientX - r.left; my = e.clientY - r.top; mActive = true;
      });
      cv.addEventListener('mouseleave', function() { mActive = false; mx = -1000; my = -1000; hovered = -1; });
      cv.addEventListener('touchmove', function(e) {
        e.preventDefault();
        var r = cv.getBoundingClientRect(); var t = e.touches[0];
        mx = t.clientX - r.left; my = t.clientY - r.top; mActive = true;
      }, {passive: false});
      cv.addEventListener('touchend', function() { mActive = false; mx = -1000; my = -1000; hovered = -1; });
    }

    var time = 0;
    var globalK = 0, globalR = 0;

    function tick() {
      time += 0.016;
      hovered = -1;

      // Update phases (Kuramoto coupling)
      for (var i = 0; i < N; i++) {
        var n = state[i];
        n.phase += n.freq * 0.016;

        // Coupling from edges
        var coupling = 0;
        for (var e = 0; e < edges.length; e++) {
          var edge = edges[e];
          if (edge.from === i || edge.to === i) {
            var other = edge.from === i ? state[edge.to] : state[edge.from];
            coupling += (edge.weight || 0.5) * Math.sin(other.phase - n.phase) * 0.3;
          }
        }
        n.phase += coupling * 0.016;

        // Breathing motion
        if (breathe) {
          var b = 2 + Math.sin(time / BREATH + i) * 1.5;
          var tx = n.baseX + Math.cos(n.phase) * b;
          var ty = n.baseY + Math.sin(n.phase) * b;
          n.vx += (tx - n.x) * 0.06;
          n.vy += (ty - n.y) * 0.06;
        }

        // Mouse interaction
        if (mActive) {
          var dx = n.x - mx, dy = n.y - my;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 80 && dist > 0) {
            var force = ((80 - dist) / 80) * 20;
            n.vx += dx / dist * force * 0.016;
            n.vy += dy / dist * force * 0.016;
          }
          if (dist < 30) hovered = i;
        }

        n.vx *= 0.88; n.vy *= 0.88;
        n.x += n.vx; n.y += n.vy;
      }

      // Compute global K and R
      var totalSync = 0, totalK = 0;
      for (var e = 0; e < edges.length; e++) {
        var a = state[edges[e].from], b = state[edges[e].to];
        totalSync += Math.cos(a.phase - b.phase);
        totalK += edges[e].weight || 0.5;
      }
      var nE = edges.length || 1;
      globalR = totalSync / nE;
      globalK = totalK / nE;
    }

    function render() {
      cx.clearRect(0, 0, W, H);

      // Background
      cx.fillStyle = rgba(C.void_bg, 1);
      cx.fillRect(0, 0, W, H);

      // Fiedler split line (if provided)
      if (fiedlerSplit) {
        var g0 = [], g1 = [];
        for (var i = 0; i < N; i++) {
          if (fiedlerSplit[i] <= 0) g0.push(state[i]); else g1.push(state[i]);
        }
        if (g0.length > 0 && g1.length > 0) {
          // Draw subtle dividing gradient
          var cx0 = 0, cy0 = 0, cx1 = 0, cy1 = 0;
          for (var i = 0; i < g0.length; i++) { cx0 += g0[i].x; cy0 += g0[i].y; }
          cx0 /= g0.length; cy0 /= g0.length;
          for (var i = 0; i < g1.length; i++) { cx1 += g1[i].x; cy1 += g1[i].y; }
          cx1 /= g1.length; cy1 /= g1.length;

          // Subtle labels
          cx.fillStyle = rgba(C.dim, 0.2);
          cx.font = '9px Georgia';
          cx.textAlign = 'center';
          if (opts.splitLabels) {
            cx.fillText(opts.splitLabels[0], cx0, cy0 - 50);
            cx.fillText(opts.splitLabels[1], cx1, cy1 - 50);
          }
        }
      }

      // Edges
      for (var e = 0; e < edges.length; e++) {
        var edge = edges[e];
        var a = state[edge.from], b = state[edge.to];
        var w = edge.weight || 0.5;
        var sync = Math.cos(a.phase - b.phase);
        var tension = 1 - Math.abs(sync);
        var col = tensionColor(tension);
        var alpha = w * 0.4 * (0.3 + Math.abs(sync) * 0.7);

        // Highlight edges connected to hovered node
        if (hovered >= 0 && (edge.from === hovered || edge.to === hovered)) {
          alpha = Math.min(1, alpha * 3);
        }

        cx.beginPath();
        cx.moveTo(a.x, a.y);
        cx.lineTo(b.x, b.y);
        cx.strokeStyle = rgba(col, alpha);
        cx.lineWidth = w * 2;
        cx.stroke();
      }

      // Nodes
      for (var i = 0; i < N; i++) {
        var n = state[i];
        var sync = Math.abs(Math.cos(n.phase));
        var nodeColor = kColor(n.k);
        var sz = n.size;

        // Damage glow (if damage > 0)
        if (n.damage > 0) {
          var dGlow = cx.createRadialGradient(n.x, n.y, 0, n.x, n.y, sz * 5);
          var dCol = tensionColor(n.damage);
          dGlow.addColorStop(0, rgba(dCol, 0.15 * n.damage));
          dGlow.addColorStop(1, rgba(dCol, 0));
          cx.fillStyle = dGlow;
          cx.fillRect(n.x - sz * 5, n.y - sz * 5, sz * 10, sz * 10);
        }

        // Node glow
        var glow = cx.createRadialGradient(n.x, n.y, 0, n.x, n.y, sz * 3);
        glow.addColorStop(0, rgba(nodeColor, 0.08 + sync * 0.12));
        glow.addColorStop(1, rgba(nodeColor, 0));
        cx.fillStyle = glow;
        cx.fillRect(n.x - sz * 3, n.y - sz * 3, sz * 6, sz * 6);

        // Node body
        cx.beginPath();
        cx.arc(n.x, n.y, sz, 0, Math.PI * 2);
        cx.fillStyle = rgba(nodeColor, 0.5 + sync * 0.5);
        cx.fill();

        if (i === hovered) {
          cx.strokeStyle = rgba(C.gold, 0.8);
          cx.lineWidth = 1.5;
          cx.stroke();
        }

        // Label
        if (showLabels) {
          var lAlpha = (i === hovered) ? 1.0 : 0.4;
          cx.fillStyle = rgba(C.text, lAlpha);
          cx.font = (i === hovered) ? 'bold 11px Georgia' : '9px Georgia';
          cx.textAlign = 'center';
          cx.fillText(nodes[i].name, n.x, n.y - sz - 6);
        }
      }

      // K/R readout
      if (showKR) {
        cx.fillStyle = rgba(C.dim, 0.4);
        cx.font = '10px "Courier New"';
        cx.textAlign = 'right';
        var T = (globalK - globalR).toFixed(3);
        cx.fillText('K=' + globalK.toFixed(3) + '  R=' + globalR.toFixed(3) + '  T=' + T, W - 10, H - 8);
      }
    }

    function loop() {
      tick();
      render();
      requestAnimationFrame(loop);
    }

    // Handle resize
    var resizeTimer;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function() {
        var ns = setupCanvas(canvasId);
        if (ns) { W = ns.W; H = ns.H; cx = ns.cx; }
      }, 200);
    });

    loop();
    return { nodes: state, edges: edges };
  }


  // ═══════════════════════════════════════════════════════════
  // PHASE CIRCLE — R synchronization visualization
  // ═══════════════════════════════════════════════════════════
  function phaseCircle(canvasId, data, opts) {
    opts = opts || {};
    var s = setupCanvas(canvasId);
    if (!s) return;
    var cx = s.cx, W = s.W, H = s.H;

    var phases = data.phases || [];  // array of {angle, label, freq, group}
    var N = phases.length;
    if (N === 0) return;

    var centerX = W / 2, centerY = H / 2;
    var radius = Math.min(W, H) * 0.35;
    var time = 0;

    // Initialize phase state
    var pState = [];
    for (var i = 0; i < N; i++) {
      pState.push({
        angle: phases[i].angle || (i * GOLDEN_ANGLE),
        freq: phases[i].freq || (0.1 + Math.random() * 0.3),
        group: phases[i].group || 0
      });
    }

    function tick() {
      time += 0.016;
      // Advance phases
      for (var i = 0; i < N; i++) {
        pState[i].angle += pState[i].freq * 0.016;
      }

      // Kuramoto coupling
      for (var i = 0; i < N; i++) {
        var coupling = 0;
        for (var j = 0; j < N; j++) {
          if (i === j) continue;
          coupling += 0.1 * Math.sin(pState[j].angle - pState[i].angle);
        }
        pState[i].angle += coupling * 0.016;
      }
    }

    function render() {
      cx.clearRect(0, 0, W, H);
      cx.fillStyle = rgba(C.void_bg, 1);
      cx.fillRect(0, 0, W, H);

      // Outer ring
      cx.beginPath();
      cx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      cx.strokeStyle = rgba(C.faint, 0.3);
      cx.lineWidth = 1;
      cx.stroke();

      // 1/φ ring (critical threshold)
      cx.beginPath();
      cx.arc(centerX, centerY, radius * INV_PHI, 0, Math.PI * 2);
      cx.strokeStyle = rgba(C.green, 0.15);
      cx.lineWidth = 0.5;
      cx.setLineDash([4, 4]);
      cx.stroke();
      cx.setLineDash([]);

      // Compute order parameter R
      var sumCos = 0, sumSin = 0;
      for (var i = 0; i < N; i++) {
        sumCos += Math.cos(pState[i].angle);
        sumSin += Math.sin(pState[i].angle);
      }
      var R = Math.sqrt(sumCos * sumCos + sumSin * sumSin) / N;
      var meanAngle = Math.atan2(sumSin, sumCos);

      // R vector (mean field)
      var rX = centerX + Math.cos(meanAngle) * radius * R;
      var rY = centerY + Math.sin(meanAngle) * radius * R;
      cx.beginPath();
      cx.moveTo(centerX, centerY);
      cx.lineTo(rX, rY);
      var rCol = kColor(R);
      cx.strokeStyle = rgba(rCol, 0.6);
      cx.lineWidth = 2;
      cx.stroke();

      // R dot
      cx.beginPath();
      cx.arc(rX, rY, 4, 0, Math.PI * 2);
      cx.fillStyle = rgba(rCol, 0.9);
      cx.fill();

      // Phase dots on the ring
      for (var i = 0; i < N; i++) {
        var px = centerX + Math.cos(pState[i].angle) * radius;
        var py = centerY + Math.sin(pState[i].angle) * radius;
        var group = pState[i].group;
        var dotColor = group === 0 ? C.gold : group === 1 ? C.green : C.amber;

        // Trail
        cx.beginPath();
        cx.moveTo(centerX, centerY);
        cx.lineTo(px, py);
        cx.strokeStyle = rgba(dotColor, 0.08);
        cx.lineWidth = 0.5;
        cx.stroke();

        // Dot
        cx.beginPath();
        cx.arc(px, py, 4, 0, Math.PI * 2);
        cx.fillStyle = rgba(dotColor, 0.8);
        cx.fill();

        // Label
        if (phases[i].label) {
          var lx = centerX + Math.cos(pState[i].angle) * (radius + 16);
          var ly = centerY + Math.sin(pState[i].angle) * (radius + 16);
          cx.fillStyle = rgba(C.text, 0.35);
          cx.font = '8px Georgia';
          cx.textAlign = 'center';
          cx.fillText(phases[i].label, lx, ly + 3);
        }
      }

      // R readout
      cx.fillStyle = rgba(rCol, 0.7);
      cx.font = 'bold 14px "Courier New"';
      cx.textAlign = 'center';
      cx.fillText('R = ' + R.toFixed(3), centerX, centerY + 6);

      // Threshold label
      cx.fillStyle = rgba(C.green, 0.25);
      cx.font = '8px "Courier New"';
      cx.fillText('1/\u03C6', centerX + radius * INV_PHI + 12, centerY - 4);
    }

    function loop() {
      tick();
      render();
      requestAnimationFrame(loop);
    }

    // Resize
    var resizeTimer;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function() {
        var ns = setupCanvas(canvasId);
        if (ns) { W = ns.W; H = ns.H; cx = ns.cx; centerX = W/2; centerY = H/2; radius = Math.min(W,H)*0.35; }
      }, 200);
    });

    loop();
  }


  // ═══════════════════════════════════════════════════════════
  // K-METER — animated coupling gauge
  // ═══════════════════════════════════════════════════════════
  function kMeter(canvasId, value, opts) {
    opts = opts || {};
    var s = setupCanvas(canvasId);
    if (!s) return;
    var cx = s.cx, W = s.W, H = s.H;

    var targetK = Math.max(0, Math.min(1, value));
    var currentK = 0;
    var label = opts.label || 'K';
    var showThreshold = opts.threshold !== false;
    var time = 0;
    var settled = false;

    function render() {
      time += 0.016;

      // Animate toward target
      if (!settled) {
        currentK += (targetK - currentK) * 0.03;
        if (Math.abs(currentK - targetK) < 0.001) { currentK = targetK; settled = true; }
      }

      // Breathing when settled
      var displayK = currentK;
      if (settled) {
        displayK = currentK + Math.sin(time / BREATH) * 0.005;
      }

      cx.clearRect(0, 0, W, H);
      cx.fillStyle = rgba(C.void_bg, 1);
      cx.fillRect(0, 0, W, H);

      var centerX = W / 2, centerY = H * 0.55;
      var radius = Math.min(W, H) * 0.38;
      var startAngle = Math.PI * 0.8;
      var endAngle = Math.PI * 2.2;
      var sweep = endAngle - startAngle;

      // Background arc
      cx.beginPath();
      cx.arc(centerX, centerY, radius, startAngle, endAngle);
      cx.strokeStyle = rgba(C.faint, 0.2);
      cx.lineWidth = 8;
      cx.lineCap = 'round';
      cx.stroke();

      // 1/φ threshold mark
      if (showThreshold) {
        var threshAngle = startAngle + INV_PHI * sweep;
        var tx = centerX + Math.cos(threshAngle) * (radius + 14);
        var ty = centerY + Math.sin(threshAngle) * (radius + 14);
        cx.beginPath();
        cx.arc(centerX, centerY, radius, threshAngle - 0.02, threshAngle + 0.02);
        cx.strokeStyle = rgba(C.green, 0.5);
        cx.lineWidth = 12;
        cx.stroke();
        cx.fillStyle = rgba(C.green, 0.3);
        cx.font = '8px "Courier New"';
        cx.textAlign = 'center';
        cx.fillText('1/\u03C6', tx, ty + 3);
      }

      // Value arc — gradient from red to gold
      var valueAngle = startAngle + displayK * sweep;
      var gradient = cx.createConicGradient(startAngle, centerX, centerY);
      // Approximate conic gradient with linear on the arc
      for (var t = 0; t <= 1; t += 0.1) {
        var col = kColor(t);
        // conic gradient expects angle progression
      }
      // Fallback: single color based on current K
      var vCol = kColor(displayK);
      cx.beginPath();
      cx.arc(centerX, centerY, radius, startAngle, valueAngle);
      cx.strokeStyle = rgba(vCol, 0.9);
      cx.lineWidth = 8;
      cx.lineCap = 'round';
      cx.stroke();

      // Glow at the tip
      var tipX = centerX + Math.cos(valueAngle) * radius;
      var tipY = centerY + Math.sin(valueAngle) * radius;
      var glow = cx.createRadialGradient(tipX, tipY, 0, tipX, tipY, 15);
      glow.addColorStop(0, rgba(vCol, 0.4));
      glow.addColorStop(1, rgba(vCol, 0));
      cx.fillStyle = glow;
      cx.fillRect(tipX - 15, tipY - 15, 30, 30);

      // Center value
      cx.fillStyle = rgba(vCol, 0.9);
      cx.font = 'bold 24px "Courier New"';
      cx.textAlign = 'center';
      cx.fillText(displayK.toFixed(3), centerX, centerY + 4);

      // Label
      cx.fillStyle = rgba(C.dim, 0.5);
      cx.font = '10px Georgia';
      cx.fillText(label, centerX, centerY + 20);

      if (!settled || Math.abs(Math.sin(time / BREATH)) > 0.01) {
        requestAnimationFrame(render);
      }
    }

    render();

    // Return updater
    return {
      set: function(v) { targetK = Math.max(0, Math.min(1, v)); settled = false; render(); }
    };
  }


  // ═══════════════════════════════════════════════════════════
  // EIGEN WATERFALL — eigenvalue spectrum visualization
  // ═══════════════════════════════════════════════════════════
  function eigenWaterfall(canvasId, eigenvalues, opts) {
    opts = opts || {};
    var s = setupCanvas(canvasId);
    if (!s) return;
    var cx = s.cx, W = s.W, H = s.H;

    var vals = eigenvalues.slice().sort(function(a, b) { return a - b; });
    var N = vals.length;
    if (N === 0) return;

    var maxVal = vals[N - 1];
    var padding = { left: 40, right: 20, top: 30, bottom: 30 };
    var plotW = W - padding.left - padding.right;
    var plotH = H - padding.top - padding.bottom;
    var time = 0;
    var revealed = 0; // animation: how many bars revealed

    // Fiedler value is the second smallest (index 1)
    var fiedlerIdx = Math.min(1, N - 1);

    function render() {
      time += 0.016;
      revealed = Math.min(N, revealed + 0.5); // reveal 0.5 bars per frame

      cx.clearRect(0, 0, W, H);
      cx.fillStyle = rgba(C.void_bg, 1);
      cx.fillRect(0, 0, W, H);

      var barW = Math.max(2, (plotW / N) - 2);

      // Axis line
      cx.beginPath();
      cx.moveTo(padding.left, H - padding.bottom);
      cx.lineTo(W - padding.right, H - padding.bottom);
      cx.strokeStyle = rgba(C.faint, 0.3);
      cx.lineWidth = 0.5;
      cx.stroke();

      // Bars
      for (var i = 0; i < Math.floor(revealed) && i < N; i++) {
        var x = padding.left + (i / N) * plotW + 1;
        var barH = (vals[i] / maxVal) * plotH;
        var y = H - padding.bottom - barH;

        // Partial reveal for the last bar
        var revealT = 1;
        if (i === Math.floor(revealed)) {
          revealT = revealed - Math.floor(revealed);
          barH *= revealT;
          y = H - padding.bottom - barH;
        }

        // Color: Fiedler value gets highlighted
        var col;
        if (i === fiedlerIdx) {
          col = C.gold;
          // Fiedler glow
          var glow = cx.createRadialGradient(x + barW/2, y, 0, x + barW/2, y, barH);
          glow.addColorStop(0, rgba(C.gold, 0.15));
          glow.addColorStop(1, rgba(C.gold, 0));
          cx.fillStyle = glow;
          cx.fillRect(x - 10, y - 10, barW + 20, barH + 20);
        } else if (i === 0) {
          col = C.dim; // zero eigenvalue
        } else {
          // Gradient from green (low) to gold (high)
          var t = i / N;
          col = lerpColor(C.green, C.gold, t);
        }

        cx.fillStyle = rgba(col, 0.7 * revealT);
        cx.fillRect(x, y, barW, barH);

        // Value label for Fiedler
        if (i === fiedlerIdx) {
          cx.fillStyle = rgba(C.gold, 0.8);
          cx.font = '9px "Courier New"';
          cx.textAlign = 'center';
          cx.fillText('\u03BB\u2082=' + vals[i].toFixed(4), x + barW/2, y - 8);
          cx.fillText('Fiedler', x + barW/2, y - 20);
        }
      }

      // Index labels
      cx.fillStyle = rgba(C.dim, 0.3);
      cx.font = '8px "Courier New"';
      cx.textAlign = 'center';
      cx.fillText('0', padding.left + barW/2, H - padding.bottom + 14);
      cx.fillText(String(N - 1), W - padding.right - barW/2, H - padding.bottom + 14);

      // Title
      if (opts.title) {
        cx.fillStyle = rgba(C.gold, 0.5);
        cx.font = '10px Georgia';
        cx.textAlign = 'left';
        cx.fillText(opts.title, padding.left, 18);
      }

      if (revealed < N + 10) requestAnimationFrame(render);
    }

    render();
  }


  // ═══════════════════════════════════════════════════════════
  // DAMAGE MAP — node vulnerability overlay on coupling graph
  // ═══════════════════════════════════════════════════════════
  function damageMap(canvasId, data, opts) {
    // This is a coupling graph with damage values driving node appearance
    // nodes: [{name, damage: 0-1, k}]
    // The higher the damage, the larger and redder the glow
    opts = opts || {};
    opts.breathe = opts.breathe !== undefined ? opts.breathe : true;

    // Inject damage into node sizes proportionally
    var maxDamage = 0;
    for (var i = 0; i < data.nodes.length; i++) {
      var d = data.nodes[i].damage || 0;
      if (d > maxDamage) maxDamage = d;
    }
    if (maxDamage > 0) {
      for (var i = 0; i < data.nodes.length; i++) {
        var d = data.nodes[i].damage || 0;
        data.nodes[i].size = 2 + (d / maxDamage) * 6;
      }
    }

    return couplingGraph(canvasId, data, opts);
  }


  // ═══════════════════════════════════════════════════════════
  // CONSONANCE — interval diagram for organ frequency ratios
  // ═══════════════════════════════════════════════════════════
  function consonance(canvasId, intervals, opts) {
    opts = opts || {};
    var s = setupCanvas(canvasId);
    if (!s) return;
    var cx = s.cx, W = s.W, H = s.H;

    // intervals: [{from, to, ratio, label}]
    // from/to are names, ratio like "4:1"
    var N = intervals.length;
    if (N === 0) return;

    // Collect unique names
    var names = [];
    for (var i = 0; i < N; i++) {
      if (names.indexOf(intervals[i].from) < 0) names.push(intervals[i].from);
      if (names.indexOf(intervals[i].to) < 0) names.push(intervals[i].to);
    }

    var centerX = W / 2, centerY = H / 2;
    var radius = Math.min(W, H) * 0.32;
    var time = 0;

    // Place names around circle at golden angle intervals
    var positions = [];
    for (var i = 0; i < names.length; i++) {
      var angle = -Math.PI / 2 + i * GOLDEN_ANGLE;
      positions.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        angle: angle,
        name: names[i]
      });
    }

    function nameIdx(name) {
      for (var i = 0; i < names.length; i++) { if (names[i] === name) return i; }
      return 0;
    }

    function render() {
      time += 0.016;
      cx.clearRect(0, 0, W, H);
      cx.fillStyle = rgba(C.void_bg, 1);
      cx.fillRect(0, 0, W, H);

      // Outer ring
      cx.beginPath();
      cx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      cx.strokeStyle = rgba(C.faint, 0.15);
      cx.lineWidth = 0.5;
      cx.stroke();

      // Intervals as arcs between nodes
      for (var i = 0; i < N; i++) {
        var from = positions[nameIdx(intervals[i].from)];
        var to = positions[nameIdx(intervals[i].to)];

        // Parse ratio for consonance scoring
        var parts = (intervals[i].ratio || '1:1').split(':');
        var a = parseInt(parts[0]) || 1, b = parseInt(parts[1]) || 1;
        var consonanceScore = 1 / (a + b); // simpler ratio = more consonant

        // Draw arc
        var midX = (from.x + to.x) / 2 + (from.y - to.y) * 0.2;
        var midY = (from.y + to.y) / 2 + (to.x - from.x) * 0.2;

        // Pulse based on the ratio
        var pulse = Math.sin(time * a * 0.5) * Math.sin(time * b * 0.5);
        var alpha = 0.2 + Math.abs(pulse) * 0.3;

        cx.beginPath();
        cx.moveTo(from.x, from.y);
        cx.quadraticCurveTo(midX, midY, to.x, to.y);
        cx.strokeStyle = rgba(C.gold, alpha);
        cx.lineWidth = 1 + consonanceScore * 8;
        cx.stroke();

        // Ratio label at midpoint
        cx.fillStyle = rgba(C.text, 0.4 + Math.abs(pulse) * 0.2);
        cx.font = '10px "Courier New"';
        cx.textAlign = 'center';
        cx.fillText(intervals[i].ratio, midX, midY - 4);

        if (intervals[i].label) {
          cx.fillStyle = rgba(C.dim, 0.3);
          cx.font = '7px Georgia';
          cx.fillText(intervals[i].label, midX, midY + 8);
        }
      }

      // Nodes
      for (var i = 0; i < positions.length; i++) {
        var p = positions[i];
        // Subtle breathing
        var bx = p.x + Math.sin(time / BREATH + i * GOLDEN_ANGLE) * 1.5;
        var by = p.y + Math.cos(time / BREATH + i * GOLDEN_ANGLE) * 1.5;

        cx.beginPath();
        cx.arc(bx, by, 5, 0, Math.PI * 2);
        cx.fillStyle = rgba(C.gold, 0.7);
        cx.fill();

        cx.fillStyle = rgba(C.text, 0.6);
        cx.font = '10px Georgia';
        cx.textAlign = 'center';

        // Position label outside the circle
        var labelR = radius + 20;
        var lx = centerX + Math.cos(p.angle) * labelR;
        var ly = centerY + Math.sin(p.angle) * labelR;
        cx.fillText(p.name, lx, ly + 4);
      }

      requestAnimationFrame(render);
    }

    render();
  }


  // ═══════════════════════════════════════════════════════════
  // BACKBONE — 3D protein backbone as 2D projection
  // ═══════════════════════════════════════════════════════════
  function backbone(canvasId, coords, opts) {
    opts = opts || {};
    var s = setupCanvas(canvasId);
    if (!s) return;
    var cx = s.cx, W = s.W, H = s.H;

    // coords: [{x,y,z}] — CA positions
    var N = coords.length;
    if (N === 0) return;

    // Find bounds and center
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    var minZ = Infinity, maxZ = -Infinity;
    for (var i = 0; i < N; i++) {
      minX = Math.min(minX, coords[i].x); maxX = Math.max(maxX, coords[i].x);
      minY = Math.min(minY, coords[i].y); maxY = Math.max(maxY, coords[i].y);
      minZ = Math.min(minZ, coords[i].z); maxZ = Math.max(maxZ, coords[i].z);
    }
    var cx0 = (minX + maxX) / 2, cy0 = (minY + maxY) / 2, cz0 = (minZ + maxZ) / 2;
    var span = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
    var scale = Math.min(W, H) * 0.4 / (span / 2 || 1);

    var time = 0;
    var rotY = 0;

    // Mutations overlay
    var mutations = opts.mutations || []; // [{pos, damage}]

    // Interaction
    var dragX = 0;
    var cv = s.cv;
    cv.addEventListener('mousemove', function(e) {
      if (e.buttons === 1) {
        dragX += e.movementX * 0.01;
      }
    });
    cv.addEventListener('touchmove', function(e) {
      e.preventDefault();
    }, {passive: false});

    function project(x, y, z, ry) {
      // Rotate around Y axis
      var cos = Math.cos(ry), sin = Math.sin(ry);
      var rx = x * cos - z * sin;
      var rz = x * sin + z * cos;
      // Simple orthographic
      return {
        px: W / 2 + rx * scale,
        py: H / 2 - y * scale,
        depth: rz
      };
    }

    function render() {
      time += 0.016;
      rotY = time * 0.15 + dragX; // slow auto-rotate + drag

      cx.clearRect(0, 0, W, H);
      cx.fillStyle = rgba(C.void_bg, 1);
      cx.fillRect(0, 0, W, H);

      // Project all points
      var projected = [];
      for (var i = 0; i < N; i++) {
        var c = coords[i];
        projected.push(project(c.x - cx0, c.y - cy0, c.z - cz0, rotY));
      }

      // Draw backbone
      for (var i = 1; i < N; i++) {
        var a = projected[i - 1], b = projected[i];
        var depth = (a.depth + b.depth) / 2;
        var depthFactor = 0.3 + 0.7 * (1 - (depth / (span / 2) + 1) / 2);

        // Color by position (N→C gradient)
        var t = i / N;
        var col = lerpColor(C.green, C.gold, t);

        cx.beginPath();
        cx.moveTo(a.px, a.py);
        cx.lineTo(b.px, b.py);
        cx.strokeStyle = rgba(col, 0.4 * depthFactor);
        cx.lineWidth = 1.5 * depthFactor;
        cx.stroke();
      }

      // Mutation markers
      for (var m = 0; m < mutations.length; m++) {
        var pos = mutations[m].pos;
        if (pos < 0 || pos >= N) continue;
        var p = projected[pos];
        var damage = mutations[m].damage || 0.5;
        var mCol = tensionColor(damage);

        var glow = cx.createRadialGradient(p.px, p.py, 0, p.px, p.py, 8 + damage * 8);
        glow.addColorStop(0, rgba(mCol, 0.5 * damage));
        glow.addColorStop(1, rgba(mCol, 0));
        cx.fillStyle = glow;
        cx.fillRect(p.px - 16, p.py - 16, 32, 32);

        cx.beginPath();
        cx.arc(p.px, p.py, 2 + damage * 3, 0, Math.PI * 2);
        cx.fillStyle = rgba(mCol, 0.8);
        cx.fill();
      }

      // Title
      if (opts.title) {
        cx.fillStyle = rgba(C.gold, 0.5);
        cx.font = '10px Georgia';
        cx.textAlign = 'left';
        cx.fillText(opts.title, 10, 18);
      }

      // Residue count
      cx.fillStyle = rgba(C.dim, 0.3);
      cx.font = '9px "Courier New"';
      cx.textAlign = 'right';
      cx.fillText(N + ' residues', W - 10, H - 8);

      requestAnimationFrame(render);
    }

    render();
  }


  // ═══════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════
  return {
    couplingGraph: couplingGraph,
    phaseCircle: phaseCircle,
    kMeter: kMeter,
    eigenWaterfall: eigenWaterfall,
    damageMap: damageMap,
    consonance: consonance,
    backbone: backbone,

    // Expose utilities for custom rendering
    colors: C,
    rgba: rgba,
    kColor: kColor,
    tensionColor: tensionColor,
    lerpColor: lerpColor,
    PHI: PHI,
    GOLDEN_ANGLE: GOLDEN_ANGLE,
    K_STAR: K_STAR,
    INV_PHI: INV_PHI,
    BREATH: BREATH
  };
})();
