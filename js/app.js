/**
 * APP — Music 2.0
 *
 * State machine: LISTEN → LENS → PLAY
 * Main loop: requestAnimationFrame
 *
 * The music follows YOUR body. There is no clock.
 */

(function () {
  'use strict';

  // ── STATE ────────────────────────────────────────────────────────────

  const SCREENS = { LISTEN: 'listen', LENS: 'lens', PLAY: 'play' };
  let screen = SCREENS.LISTEN;
  let audioCtx = null;

  // Position (smoothed, 0-1)
  let posX = 0.5, posY = 0.5;
  const POS_SMOOTH = 0.12;

  // Canvas
  let canvas = null;
  let ctx2d = null;
  let W = 0, H = 0;

  // Timing
  let lastFrame = 0;
  let debugVisible = false;
  let swipeHintTimer = 0;

  // Swipe detection for live lens switching
  let swipeStartX = 0;
  let swipeLastX = 0;
  let swiping = false;

  // Long press to return to lens picker
  let longPressTimer = null;

  // Touch velocity tracking
  let prevTouchX = 0, prevTouchY = 0, prevTouchTime = 0;
  let touchVX = 0, touchVY = 0;

  // Voice state — two moments only: boot + void stillness
  let voiceStillnessStart    = 0;
  let voiceDeepStillnessFired = false;

  // ── iOS AUDIO WATCHDOG ────────────────────────────────────────────────
  // iOS kills AudioContext whenever the app loses focus: lock screen, background,
  // phone call, notification center, control center, etc.
  // Strategy: intercept EVERY touch at the document level (capture phase, before
  // anything else) and replay the silent buffer trick. This runs in a real iOS
  // gesture context, so resume() cannot be blocked.
  // Also hooks visibilitychange + pageshow + focus for lock-screen recovery.

  function iosAudioUnlock() {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(function () {});
    }
    // Silent buffer is the real unlock — resume() alone isn't enough on older iOS
    try {
      var buf = audioCtx.createBuffer(1, 1, audioCtx.sampleRate);
      var src = audioCtx.createBufferSource();
      src.buffer = buf;
      src.connect(audioCtx.destination);
      src.start(0);
    } catch (e) {}
  }

  function initAudioWatchdog() {
    // Capture phase = fires before any other handler = guaranteed gesture context
    document.addEventListener('touchstart', iosAudioUnlock, { passive: true, capture: true });
    document.addEventListener('touchend',   iosAudioUnlock, { passive: true, capture: true });

    // Coming back from lock screen / background
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') iosAudioUnlock();
    });

    // Page shown after navigation or app switcher
    window.addEventListener('pageshow', function () { iosAudioUnlock(); });

    // Window focus (desktop + some iOS cases)
    window.addEventListener('focus', function () { iosAudioUnlock(); });
  }

  // ── BOOT CANVAS ───────────────────────────────────────────────────────
  // Lissajous figure driven by irrational frequency ratios — never repeats,
  // always alive. Three-pass bloom: off-canvas → blur → screen composite.
  // Core line approaches near-white at speed. Outer glow has cyan shift.
  // Reacts to tilt before tap via deviceorientation (no permission needed).

  var bootAnimId = null;

  function initBootCanvas() {
    var bc = document.getElementById('boot-canvas');
    if (!bc) return;
    var bctx = bc.getContext('2d');
    var bw = 0, bh = 0;

    // Off-canvas for bloom rendering
    var glowCanvas = document.createElement('canvas');
    var glowCtx    = glowCanvas.getContext('2d');

    function resizeBoot() {
      var dpr = window.devicePixelRatio || 1;
      bw = window.innerWidth; bh = window.innerHeight;
      bc.width  = bw * dpr; bc.height  = bh * dpr;
      bc.style.width = bw + 'px'; bc.style.height = bh + 'px';
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      glowCanvas.width  = bc.width;
      glowCanvas.height = bc.height;
      glowCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resizeBoot();
    window.addEventListener('resize', resizeBoot);

    // Tilt — spring physics so it feels physical not digital
    var tiltRawX = 0, tiltRawY = 0, tiltX = 0, tiltY = 0;
    window.addEventListener('deviceorientation', function (e) {
      tiltRawX = (e.gamma || 0) / 45;
      tiltRawY = (e.beta  || 0) / 90;
    }, { passive: true });

    // Irrational constants — frequencies that never synchronise
    var PHI = 1.6180339887;   // golden ratio
    var SQ2 = 1.4142135624;   // √2
    var EU  = 2.7182818285;   // e
    var t   = 0;

    var STEPS = 360;

    function buildPath(cx, cy, Rx, Ry, rA, rB, delta) {
      var pts = new Array(STEPS + 1);
      for (var i = 0; i <= STEPS; i++) {
        var a = (i / STEPS) * Math.PI * 2;
        // Micro-tremor — contained life, not noise
        var jitter = Rx * 0.007 * Math.sin(a * 5.3 + t * 0.038) * Math.sin(a * 2.7 + t * 0.021);
        pts[i] = {
          x: cx + (Rx + jitter)       * Math.sin(rA * a + delta),
          y: cy + (Ry + jitter * 0.5) * Math.sin(rB * a),
        };
      }
      return pts;
    }

    function tracePath(ctx, pts) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    }

    function drawBoot() {
      // Spring physics on tilt — the figure breathes toward your hand
      tiltX += (tiltRawX * 0.09 - tiltX) * 0.065;
      tiltY += (tiltRawY * 0.07 - tiltY) * 0.065;

      var cx = bw * (0.5 + tiltX * 0.035);
      var cy = bh * (0.5 + tiltY * 0.030);
      var R  = Math.min(bw, bh) * 0.33;

      // Organic motion — layered irrationals, never repeats
      var delta  = 0.24 * Math.sin(t * 0.009  * PHI)
                 + 0.11 * Math.sin(t * 0.014  * SQ2)
                 + 0.05 * Math.sin(t * 0.0038 * Math.PI);

      var breath = 0.80 + 0.13 * Math.sin(t * 0.008  * PHI)
                        + 0.05 * Math.sin(t * 0.016  * SQ2)
                        + 0.02 * Math.sin(t * 0.004  * EU);

      // Ratio drifts microtonally around 1:2 — never perfectly static
      var rA = 1.0 + 0.011 * Math.sin(t * 0.002  * PHI);
      var rB = 2.0 + 0.022 * Math.sin(t * 0.0015 * SQ2);

      var Rx = R * breath;
      var Ry = R * breath * 0.84;

      var pts = buildPath(cx, cy, Rx, Ry, rA, rB, delta);

      // ── FADE main canvas (trails linger, ghost of where it's been) ──
      bctx.fillStyle = 'rgba(0,0,0,0.055)';
      bctx.fillRect(0, 0, bw, bh);

      // ── BLOOM — draw to glow canvas, composite back with blur ──
      glowCtx.clearRect(0, 0, bw, bh);
      glowCtx.lineWidth   = 9;
      glowCtx.strokeStyle = 'rgba(0,230,85,1)';
      glowCtx.lineJoin    = 'round';
      glowCtx.lineCap     = 'round';
      tracePath(glowCtx, pts);

      // Wide outer bloom — blur 18px, screen, subtle cyan shift
      bctx.save();
      bctx.filter = 'blur(18px)';
      bctx.globalCompositeOperation = 'screen';
      bctx.globalAlpha = 0.28;
      // Cyan tint on outer glow: draw image with a color matrix effect
      // (approximate via two draws: green + faint blue offset)
      bctx.drawImage(glowCanvas, 0, 0);
      bctx.restore();

      // Inner tight glow — blur 5px, screen
      bctx.save();
      bctx.filter = 'blur(5px)';
      bctx.globalCompositeOperation = 'screen';
      bctx.globalAlpha = 0.55;
      bctx.drawImage(glowCanvas, 0, 0);
      bctx.restore();

      // ── GHOST LAYER — smaller figure behind, offset in phase (depth) ──
      var ghostPts = buildPath(cx, cy, Rx * 0.68, Ry * 0.68, rA, rB, delta - 0.22);
      bctx.save();
      bctx.lineWidth   = 0.8;
      bctx.strokeStyle = 'rgba(0,255,90,0.08)';
      bctx.lineJoin    = 'round';
      tracePath(bctx, ghostPts);
      bctx.restore();

      // ── CRISP CORE — near-white at speed, green at rest ──
      // Compute per-point velocity for color/width mapping
      var vels = new Array(pts.length);
      var maxV = 0.001;
      for (var i = 1; i < pts.length; i++) {
        var dx = pts[i].x - pts[i-1].x, dy = pts[i].y - pts[i-1].y;
        vels[i] = Math.sqrt(dx*dx + dy*dy);
        if (vels[i] > maxV) maxV = vels[i];
      }
      vels[0] = vels[1];

      // Batch into 10 velocity buckets — 10 draw calls instead of 360
      var BUCKETS = 10;
      var buckets = [];
      for (var b = 0; b < BUCKETS; b++) buckets.push([]);
      for (var i = 1; i < pts.length; i++) {
        var b = Math.min(BUCKETS - 1, Math.floor((vels[i] / maxV) * BUCKETS));
        buckets[b].push(i);
      }

      for (var b = 0; b < BUCKETS; b++) {
        if (!buckets[b].length) continue;
        var nv  = (b + 0.5) / BUCKETS;           // normalised velocity 0-1
        // Color: slow=pure green, fast=near-white-green (hot = bright)
        var r   = Math.round(40  + nv * 190);    // 40→230
        var g   = 255;
        var bl  = Math.round(80  + nv * 155);    // 80→235
        var alpha = 0.30 + nv * 0.55;            // fast = brighter
        var lw    = Math.max(0.5, 2.0 - nv * 1.3); // fast = thinner (calligraphic)

        bctx.strokeStyle = 'rgba(' + r + ',' + g + ',' + bl + ',' + alpha + ')';
        bctx.lineWidth   = lw;
        bctx.lineCap     = 'round';

        for (var j = 0; j < buckets[b].length; j++) {
          var i = buckets[b][j];
          bctx.beginPath();
          bctx.moveTo(pts[i-1].x, pts[i-1].y);
          bctx.lineTo(pts[i].x,   pts[i].y);
          bctx.stroke();
        }
      }

      t += 0.016;
      bootAnimId = requestAnimationFrame(drawBoot);
    }
    drawBoot();
  }

  function stopBootCanvas() {
    if (bootAnimId) { cancelAnimationFrame(bootAnimId); bootAnimId = null; }
  }

  // ── SCREEN TRANSITIONS ───────────────────────────────────────────────

  function showScreen(name) {
    screen = name;
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) {
      screens[i].classList.toggle('active', screens[i].id === 'screen-' + name);
    }
  }

  // ── LISTEN SCREEN ────────────────────────────────────────────────────

  var listenTapped = false; // guard against double-fire (touchend + click both firing)

  function initListen() {
    var el = document.getElementById('screen-listen');
    if (!el) return;

    el.addEventListener('touchend', function (e) {
      e.preventDefault();
      onListenTap();
    }, { passive: false });

    el.addEventListener('click', function () {
      onListenTap();
    });
  }

  function onListenTap() {
    if (listenTapped) return;
    listenTapped = true;

    // Move off boot screen immediately — no second tap possible
    showScreen(SCREENS.PLAY);
    stopBootCanvas();

    // Create AudioContext on user gesture (iOS requirement)
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();

    // iOS silent buffer unlock
    try {
      var silentBuf = audioCtx.createBuffer(1, 1, audioCtx.sampleRate);
      var silentSrc = audioCtx.createBufferSource();
      silentSrc.buffer = silentBuf;
      silentSrc.connect(audioCtx.destination);
      silentSrc.start(0);
    } catch (e) {}

    // Voice init + boot greeting — we are inside the gesture right now
    Voice.init(audioCtx);
    Voice.boot();

    Sensor.init().then(function () {
      Brain.init();
      Audio.init(audioCtx);
      Follow.init();
      Lens.buildPicker();

      var urlLens = Lens.loadFromURL();
      if (urlLens) {
        Audio.configure(urlLens);
        Follow.applyLens(urlLens);
        Organism.applyLens(urlLens);
        startPlayScreen();
      } else {
        // Music fades in after the boot voice has a moment to breathe
        setTimeout(function () {
          Lens.selectCard(5); // Dark Matter
          var lens = Lens.getSelected();
          Audio.configure(lens);
          Follow.applyLens(lens);
          Organism.applyLens(lens);
          Pattern.init();
          Pattern.setLens(lens);
          startPlayScreen();
        }, 2500);
      }
    });
  }

  // ── LENS SCREEN ──────────────────────────────────────────────────────

  function initLens() {
    // Command input on the protocol select screen
    var cmdInput = document.getElementById('cmd-input');
    if (cmdInput) {
      cmdInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
          e.preventDefault();
          var cmd = this.value.trim().toUpperCase();
          // Auto-select lens from RUN command if not already selected
          if (cmd.indexOf('RUN ') === 0) {
            var query = cmd.slice(4).trim();
            var presets = Lens.PRESETS;
            for (var i = 0; i < presets.length; i++) {
              if (presets[i].name.toUpperCase().indexOf(query) !== -1 ||
                  query.indexOf(presets[i].name.toUpperCase().split(' ')[0]) !== -1) {
                Lens.selectCard(i);
                break;
              }
            }
          }
          if (Lens.getSelected()) onLensGo();
        }
      });
    }

    // Also wire hidden go button in case something still references it
    var goBtn = document.getElementById('lens-go');
    if (goBtn) {
      goBtn.addEventListener('touchstart', function (e) {
        e.preventDefault(); e.stopPropagation(); onLensGo();
      }, { passive: false });
      goBtn.addEventListener('click', function (e) {
        e.stopPropagation(); onLensGo();
      });
    }
  }

  function onLensGo() {
    var lens = Lens.getSelected();
    if (!lens) return;

    // Ensure AudioContext is alive
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

    // Retry motion permissions on this user gesture
    Sensor.retryPermissions();

    try {
      Audio.configure(lens);
      Follow.applyLens(lens);
      Organism.applyLens(lens);
    } catch (e) {
      console.error('applyLens:', e);
    }

    // Voice speaks the lens intro as you enter play
    Voice.lensSelected(lens.name);

    showScreen(SCREENS.PLAY);
    startPlayScreen();
  }

  // ── FLASH ─────────────────────────────────────────────────────────────

  function flashScreen(color) {
    var el = document.getElementById('flash');
    if (!el) return;
    el.style.background = color;
    el.style.opacity = '0.5';
    setTimeout(function () { el.style.transition = 'opacity 0.6s'; el.style.opacity = '0'; }, 80);
    setTimeout(function () { el.style.transition = ''; }, 700);
  }

  // ── PLAY COMMAND INTERFACE ────────────────────────────────────────────

  function initPlayCmd() {
    var input = document.getElementById('play-cmd-input');
    if (!input) return;
    input.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.keyCode !== 13) return;
      e.preventDefault();
      var cmd = this.value.trim().toUpperCase();
      this.value = '';
      this.blur();
      handlePlayCommand(cmd);
    });
  }

  function handlePlayCommand(cmd) {
    if (cmd === 'STOP') {
      showScreen(SCREENS.LENS);
      return;
    }

    // Name capture — entity asked, user answered
    if (Voice.isAwaitingName() && cmd.indexOf('RUN ') !== 0 && cmd.length < 32) {
      Voice.setName(cmd.toLowerCase());
      return;
    }

    if (cmd.indexOf('RUN ') === 0) {
      var query = cmd.slice(4).trim();
      var presets = Lens.PRESETS;
      var found = null;

      // Exact match first
      for (var i = 0; i < presets.length; i++) {
        if (presets[i].name.toUpperCase() === query) { found = i; break; }
      }
      // Partial match
      if (found === null) {
        for (var j = 0; j < presets.length; j++) {
          if (presets[j].name.toUpperCase().indexOf(query) !== -1 ||
              query.indexOf(presets[j].name.toUpperCase().split(' ')[0]) !== -1) {
            found = j; break;
          }
        }
      }

      if (found !== null) {
        Lens.selectCard(found);
        var lens = Lens.getSelected();
        Audio.configure(lens);
        Follow.applyLens(lens);
        Organism.applyLens(lens);
        Pattern.setLens(lens);
        Voice.lensSelected(lens.name);
        Lens.updateIndicator();

        // Flash color: Tundra/Still Water/Conductor = blue-white, Dark Matter = red, Gospel = gold
        var flashColors = {
          'The Conductor':  '#ffffff',
          'Blue Hour':      '#0033ff',
          'Gospel Sunday':  '#ff9900',
          'Tundra':         '#aaddff',
          'Still Water':    '#00ffaa',
          'Dark Matter':    '#ff0000',
        };
        flashScreen(flashColors[lens.name] || '#00FF41');
      }
    }
  }

  // ── PLAY SCREEN ──────────────────────────────────────────────────────

  var spikeWired   = false;
  var gestureWired = false;

  function startPlayScreen() {
    // Double-check AudioContext is running
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

    Lens.updateIndicator();

    // Wire brain events → follow engine + organism (ONCE)
    if (!spikeWired) {
      Brain.on('spike', function (data) {
        try {
          Follow.onSpike(data);
          if (data.neuron === 'toss' || data.neuron === 'shake') {
            Organism.addMutation(data.energy);
          }
          // Voice reacts to extreme peaks — rare, only the biggest moments
          if (data.energy > 2.2) Voice.onPeak();
        } catch (e) { console.error('spike handler:', e); }
      });
      spikeWired = true;
    }

    // Wire gesture recogniser to the play canvas (ONCE)
    if (!gestureWired) {
      var playCanvas = document.getElementById('canvas');
      if (playCanvas) {
        Gesture.attach(playCanvas, 52);   // 52px = cmd bar height
        Gesture.on('figure8', function () {
          // "I can work with this" — the machine evolves, you never leave
          Voice.iCanWorkWithThis();
          flashScreen('rgba(0,255,65,0.18)');
          // Cycle to the next lens — music transforms, no picker, no break
          setTimeout(function () {
            var next = Lens.nextLens();
            Pattern.setLens(next);
            Lens.updateIndicator();
            flashScreen('rgba(0,255,65,0.08)');
          }, 800);
        });
        gestureWired = true;
      }
    }

    swipeHintTimer = 0;

    // Reset voice state for this session
    voiceStillnessStart    = 0;
    voiceDeepStillnessFired = false;

    // Start the main loop
    lastFrame = performance.now();
    requestAnimationFrame(loop);
  }

  // ── TOUCH HANDLING IN PLAY SCREEN ────────────────────────────────────

  function initPlayTouch() {
    var playEl = document.getElementById('screen-play');
    if (!playEl) return;

    playEl.addEventListener('touchstart', function (e) {
      if (screen !== SCREENS.PLAY) return;
      e.preventDefault();

      // Multi-touch: handled separately below — don't start long press or notes
      if (e.touches.length > 1) return;

      // iOS: resume AudioContext from within a gesture (loop-based resume is ignored by iOS)
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

      // Retry motion permission on every touch
      Sensor.retryPermissions();

      var t = e.touches[0];
      swipeStartX = t.clientX;
      swiping = false;

      // Long press: return to lens picker (single finger only)
      longPressTimer = setTimeout(function () {
        showScreen(SCREENS.LENS);
      }, 1200);

      // Play touch note
      prevTouchX = t.clientX / W; prevTouchY = t.clientY / H; prevTouchTime = performance.now();
      touchVX = 0; touchVY = 0;
      try { Follow.touch(prevTouchX, prevTouchY, 0, 0); } catch (e) { console.error('touch note:', e); }
    }, { passive: false });

    playEl.addEventListener('touchmove', function (e) {
      if (screen !== SCREENS.PLAY) return;
      e.preventDefault();

      // Cancel long press on move
      if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }

      var t = e.touches[0];
      swipeLastX = t.clientX;
      var dx = t.clientX - swipeStartX;

      if (Math.abs(dx) > 60) swiping = true;

      // Continuous touch notes with velocity
      if (!swiping) {
        var nowMs = performance.now();
        var dtMs = nowMs - prevTouchTime;
        if (dtMs > 0) {
          var curX = t.clientX / W, curY = t.clientY / H;
          touchVX = (curX - prevTouchX) / (dtMs / 1000);
          touchVY = (curY - prevTouchY) / (dtMs / 1000);
          prevTouchX = curX; prevTouchY = curY; prevTouchTime = nowMs;
          try { Follow.touch(curX, curY, touchVX, touchVY); } catch (e) {}
          try { Audio.spatial.setTouchPan(curX); } catch (e) {}
        }
      }
    }, { passive: false });

    playEl.addEventListener('touchend', function (e) {
      if (screen !== SCREENS.PLAY) return;

      if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }

      if (swiping) {
        var dx = swipeLastX - swipeStartX;
        if (dx > 60) Lens.prevLens();
        else if (dx < -60) Lens.nextLens();
        Organism.applyLens(Lens.active);
        if (Lens.active) {
          Pattern.setLens(Lens.active);
          Voice.lensSelected(Lens.active.name);
        }
      }

      swiping = false;
    });

    // Three-finger tap: debug only — cancel long press so lens screen never opens
    playEl.addEventListener('touchstart', function (e) {
      if (e.touches.length >= 3) {
        if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
        toggleDebug();
      }
    }, { passive: true });
  }

  // ── POSITION SMOOTHING ───────────────────────────────────────────────

  function updatePosition(sensor) {
    if (sensor.touching) {
      posX += (sensor.tx - posX) * POS_SMOOTH;
      posY += (sensor.ty - posY) * POS_SMOOTH;
    } else if (sensor.hasOrientation) {
      var nx = Math.max(0, Math.min(1, (sensor.gamma + 45) / 90));
      var ny = Math.max(0, Math.min(1, (sensor.beta - 20) / 80));
      posX += (nx - posX) * POS_SMOOTH * 0.5;
      posY += (ny - posY) * POS_SMOOTH * 0.5;
    }
  }

  // ── MAIN LOOP ────────────────────────────────────────────────────────

  var loopErrors = 0;

  function loop(timestamp) {
    if (screen !== SCREENS.PLAY) return;

    // ALWAYS schedule next frame first
    requestAnimationFrame(loop);

    // Auto-resume AudioContext
    if (audioCtx && audioCtx.state === 'suspended') {
      try { audioCtx.resume(); } catch (e) {}
    }

    try {
      var dt = Math.min(0.05, (timestamp - lastFrame) / 1000);
      lastFrame = timestamp;

      // 1. Read sensors
      var sensor = Sensor.read();

      // 2. Process brain
      Brain.process(sensor, timestamp);

      // 3. Update position
      updatePosition(sensor);

      // 4. Music follows your body (NOT a clock — your body drives this)
      Follow.update(
        { totalMotion: Brain.totalMotion, energy: Brain.energy, pattern: Brain.pattern, voidDepth: Brain.voidDepth, voidState: Brain.voidState, breathPhase: Brain.breathPhase, neurons: Brain.neurons },
        sensor,
        dt
      );

      // 5. Update organism
      Organism.update(dt, posX, posY, W, H,
        { energy: Brain.energy, neurons: Brain.neurons },
        sensor.touching
      );

      // 6. Render
      render(dt);

      // 7. Voice — two moments only: intro (boot) + void prompting
      // The boot line fires in onListenTap via Voice.boot().
      // Deep stillness fires here once per void entry — the presence speaks into absence.
      if (Follow.silent) {
        if (!voiceStillnessStart) voiceStillnessStart = performance.now();
        var vStillSecs = (performance.now() - voiceStillnessStart) / 1000;
        if (vStillSecs > 28 && !voiceDeepStillnessFired) {
          voiceDeepStillnessFired = true;
          Voice.onDeepStillness();
        }
      } else {
        voiceStillnessStart    = 0;
        voiceDeepStillnessFired = false;
      }

      // 8. Pattern engine (AI Producer — silent)
      Pattern.update(dt, Follow.silent);

      // 9. Debug
      if (debugVisible) updateDebug(sensor);

      // 10. Swipe hint fades after 5s
      swipeHintTimer += dt;
      if (swipeHintTimer > 5) {
        var hint = document.getElementById('swipe-hint');
        if (hint) hint.style.opacity = '0';
      }
    } catch (e) {
      if (loopErrors++ < 5) console.error('LOOP ERROR:', e);
    }
  }

  // ── RENDER ───────────────────────────────────────────────────────────

  function render(dt) {
    if (!ctx2d) return;

    ctx2d.fillStyle = 'rgba(0,0,0,0.15)';
    ctx2d.fillRect(0, 0, W, H);

    var ox = posX * W;
    var oy = posY * H;
    Organism.draw(ctx2d, ox, oy, W, H);
  }

  // ── CANVAS SETUP ─────────────────────────────────────────────────────

  function initCanvas() {
    canvas = document.getElementById('canvas');
    if (!canvas) return;
    ctx2d = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    var dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ── DEBUG ────────────────────────────────────────────────────────────

  function toggleDebug() {
    debugVisible = !debugVisible;
    var el = document.getElementById('debug');
    if (el) el.classList.toggle('visible', debugVisible);
  }

  function updateDebug(sensor) {
    var el = document.getElementById('debug');
    if (!el) return;

    var lens = Lens.active;
    var lines = [
      'MUSIC 2.0 — YOUR BODY IS THE INSTRUMENT',
      'LENS: ' + (lens ? lens.name : 'none'),
      'ARCHETYPE: ' + Follow.archetype + ' | PHRASE: ' + Follow.phrase,
      'SILENT: ' + (Follow.silent ? 'YES' : 'no') + ' | FADE: ' + Follow.fade.toFixed(2),
      'YOUR TEMPO: ' + Follow.tempo.toFixed(0) + ' BPM | LOCKED: ' + (Follow.locked ? 'YES(' + Follow.lockStr.toFixed(2) + ')' : 'no'),
      'CONFIDENCE: ' + Follow.confidence.toFixed(2) + ' | MOMENTUM: ' + (Follow.momentum ? 'YES' : 'no'),
      'DENSITY: ' + Follow.density.toFixed(1) + ' | ENERGY: ' + Follow.energy.toFixed(2),
      'PITCH: ' + Follow.degree + ' | FILTER: ' + Follow.filterFreq.toFixed(0) + 'Hz',
      'PEAKS: ' + Follow.peaks + ' | NOTES: ' + Follow.notes,
      'PATTERN: ' + Brain.pattern + ' | TOTAL: ' + Brain.totalMotion.toFixed(0),
      'MOTION: ' + (sensor.hasMotion ? 'YES' : 'NO') + ' | ORIENT: ' + (sensor.hasOrientation ? 'YES' : 'NO'),
      'AUDIO: ' + Follow.ctxState + ' | ERRORS: ' + Follow.errors + '+' + loopErrors,
      'GROOVE: ' + (Follow.groovePlaying ? 'LOCKED' : 'listening (' + (Follow.grooveStrength * 100).toFixed(0) + '%)'),
      'PHASE: ' + ['EMERGENCE','LISTENING','ALIVE'][Follow.phase] + ' (' + Follow.sessionTime + 's)',
      'ORACLE L1: motifs=' + Pattern.motifs + ' notes=' + Pattern.notes + (Pattern.generating ? ' GEN' : ''),
      'ORACLE L2: forms=' + Pattern.forms + ' sect=' + Pattern.section + ' crystals=' + Pattern.crystals + ' loops=' + Pattern.loops,
    ];

    el.textContent = lines.join('\n');
  }

  // Desktop debug shortcut
  document.addEventListener('keydown', function (e) {
    if (e.key === 'd' || e.key === 'D') toggleDebug();
  });

  // ── BOOT ─────────────────────────────────────────────────────────────

  function boot() {
    initAudioWatchdog();
    initBootCanvas();
    initCanvas();
    initListen();
    initLens();
    initPlayCmd();
    initPlayTouch();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
