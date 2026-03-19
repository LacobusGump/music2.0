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

  // Canvas background color — synced to time-of-day CSS custom properties
  var canvasBgColor = 'rgba(5,5,5,0.15)';
  (function() {
    function updateCanvasBg() {
      var s = getComputedStyle(document.documentElement);
      var h = s.getPropertyValue('--bg-h').trim() || '240';
      var sat = s.getPropertyValue('--bg-s').trim() || '8';
      var l = s.getPropertyValue('--bg-l').trim() || '3';
      canvasBgColor = 'hsla(' + h + ',' + sat + '%,' + l + '%,0.15)';
    }
    // Run once on load, then every 60s (same cadence as time-of-day system)
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', updateCanvasBg);
    } else {
      updateCanvasBg();
    }
    setInterval(updateCanvasBg, 60000);
  })();

  // Swipe detection for live lens switching
  let swipeStartX = 0;
  let swipeLastX = 0;
  let swiping = false;

  // Long press to return to lens picker
  let longPressTimer = null;

  // Touch velocity tracking
  let prevTouchX = 0, prevTouchY = 0, prevTouchTime = 0;
  let touchVX = 0, touchVY = 0;

  // Outfit — partner state tracking
  let outfitLibsLoaded  = false;
  let outfitPendingJoin = null;
  let lastPeakCount     = 0;
  let lastLocalPeakTime = 0;
  let lastPartnerPeak   = 0;

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
  // Horizon unfolding. A line that glares into existence and pushes.
  // Natural phasing: Fibonacci wave frequencies, never repeating.
  // Tilt shifts the horizon. Glare builds slowly. Corona pushes outward.

  var bootAnimId = null;

  function initBootCanvas() {
    var bc = document.getElementById('boot-canvas');
    if (!bc) return;
    var bctx = bc.getContext('2d');
    var bw = 0, bh = 0;

    function resizeBoot() {
      var dpr = window.devicePixelRatio || 1;
      bw = window.innerWidth; bh = window.innerHeight;
      bc.width  = bw * dpr; bc.height  = bh * dpr;
      bc.style.width = bw + 'px'; bc.style.height = bh + 'px';
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resizeBoot();
    window.addEventListener('resize', resizeBoot);

    // Tilt — spring damped
    var tiltRawX = 0, tiltRawY = 0, tiltX = 0, tiltY = 0;
    window.addEventListener('deviceorientation', function (e) {
      tiltRawX = (e.gamma || 0) / 45;
      tiltRawY = (e.beta  || 0) / 90;
    }, { passive: true });

    // Irrational constants — organic, never-repeating phase
    var PHI = 1.6180339887;
    var SQ2 = 1.4142135624;
    var t = 0;
    var glare = 0; // 0→1 over ~5 seconds — the horizon glares in slowly

    // Bloom passes: wide corona → crisp white core
    // Warm white/gold — light crossing from the other side
    var PASSES = [
      { lw: 32, r: 255, g: 210, b: 120, a: 0.007 }, // far corona haze
      { lw: 16, r: 255, g: 230, b: 160, a: 0.022 }, // mid glow
      { lw:  7, r: 255, g: 248, b: 200, a: 0.07  }, // inner glow
      { lw:  2.5, r: 255, g: 255, b: 230, a: 0.55 }, // bright ring
      { lw:  1,   r: 255, g: 255, b: 255, a: 0.95 }, // white core
    ];

    function drawBoot() {
      // Spring physics on tilt
      tiltX += (tiltRawX * 0.1  - tiltX) * 0.06;
      tiltY += (tiltRawY * 0.08 - tiltY) * 0.06;

      // Glare builds — the horizon emerges slowly, then holds
      glare = Math.min(1, glare + 0.003);

      // Horizon sits at vertical center, shifted by tilt
      var cy = bh * (0.5 + tiltY * 0.07);

      // Push: corona expands outward from the line as glare builds
      // Like light being lensed — the horizon is pushing through you
      var push = bh * 0.18 * glare * (1 + 0.12 * Math.sin(t * 0.6 * PHI));

      // Wave amplitude: breathes with irrational frequencies
      var amp = bh * 0.055 * glare
        * (0.85 + 0.10 * Math.sin(t * 0.7 * PHI)
                + 0.05 * Math.sin(t * 1.1 * SQ2));

      // ── FADE — slow trail so the wave ghosts behind itself ──
      bctx.fillStyle = canvasBgColor.replace('0.15', '0.045');
      bctx.fillRect(0, 0, bw, bh);

      // ── CORONA PUSH — vertical gradient radiating from the horizon ──
      // This is the "push" — light pressing through from behind the line
      var grad = bctx.createLinearGradient(0, cy - push, 0, cy + push);
      grad.addColorStop(0,    'rgba(0,0,0,0)');
      grad.addColorStop(0.25, 'rgba(255,180,60,' + (glare * 0.03) + ')');
      grad.addColorStop(0.5,  'rgba(255,230,140,' + (glare * 0.07) + ')');
      grad.addColorStop(0.75, 'rgba(255,180,60,' + (glare * 0.03) + ')');
      grad.addColorStop(1,    'rgba(0,0,0,0)');
      bctx.fillStyle = grad;
      bctx.fillRect(0, cy - push, bw, push * 2);

      // ── HORIZON WAVE — Fibonacci frequencies, natural phasing ──
      // 8:13:21:34 spatial ratios = golden ratio harmonics, never lock
      // Time drivers at PHI/SQ2 ratios = phase drift that never repeats
      var STEPS = 220;
      var pts = new Array(STEPS + 1);
      for (var i = 0; i <= STEPS; i++) {
        var nx = i / STEPS;
        var wave =
          Math.sin(nx * 8  * Math.PI + t * PHI * 1.3) * 0.50 +
          Math.sin(nx * 13 * Math.PI + t * SQ2 * 0.9) * 0.28 +
          Math.sin(nx * 21 * Math.PI + t * PHI * 0.5) * 0.14 +
          Math.sin(nx * 34 * Math.PI + t * SQ2 * 2.1) * 0.08;
        // Tilt warps the wave — you're not level with the horizon
        wave += tiltX * 0.25 * Math.sin(nx * Math.PI);
        pts[i] = { x: nx * bw, y: cy + wave * amp };
      }

      // ── MULTI-PASS BLOOM — wide to narrow, transparent to opaque ──
      bctx.lineJoin = 'round';
      bctx.lineCap  = 'round';

      for (var p = 0; p < PASSES.length; p++) {
        var pass = PASSES[p];
        bctx.lineWidth   = pass.lw;
        bctx.strokeStyle = 'rgba(' + pass.r + ',' + pass.g + ',' + pass.b + ',' + (pass.a * glare) + ')';
        bctx.beginPath();
        bctx.moveTo(pts[0].x, pts[0].y);
        for (var i = 1; i < pts.length; i++) bctx.lineTo(pts[i].x, pts[i].y);
        bctx.stroke();
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
          Lens.selectCard(0); // Journey (organic evolution)
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

        // Flash color on lens switch
        var flashColors = {
          'Journey':        '#3d3550',
          'Grid':           '#ff3300',
          'Ascension':      '#8844ff',
        };
        flashScreen(flashColors[lens.name] || 'rgba(255,210,150,0.6)');
      }
    }
  }

  // ── PLAY SCREEN ──────────────────────────────────────────────────────

  var spikeWired   = false;
  var gestureWired = false;

  function startPlayScreen() {
    // Double-check AudioContext is running
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

    // Auto-join a dance room if the page was opened via QR link
    processAutoJoin();

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
          // Figure 8 discovered — the machine speaks, then transforms
          Voice.iCanWorkWithThis();
          Voice.onDiscovery('figure8');
          flashScreen('rgba(255,255,255,0.12)');
          // Cycle to the next lens — music transforms, no picker, no break
          setTimeout(function () {
            var next = Lens.nextLens();
            Pattern.setLens(next);
            Lens.updateIndicator();
            flashScreen('rgba(255,255,255,0.06)');
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

      // Two-finger touch: start lens swipe tracking
      if (e.touches.length === 2) {
        swiping = false;
        swipeStartX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        swipeLastX = swipeStartX;
        if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
        return;
      }

      // Multi-touch beyond 2: ignore
      if (e.touches.length > 2) return;

      // iOS: resume AudioContext from within a gesture (loop-based resume is ignored by iOS)
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

      // Retry motion permission on every touch
      Sensor.retryPermissions();

      // Long press: return to lens picker (single finger only)
      longPressTimer = setTimeout(function () {
        showScreen(SCREENS.LENS);
      }, 1200);

      // Play touch note
      var t = e.touches[0];
      prevTouchX = t.clientX / W; prevTouchY = t.clientY / H; prevTouchTime = performance.now();
      touchVX = 0; touchVY = 0;
      try { Follow.touch(prevTouchX, prevTouchY, 0, 0); } catch (e) { console.error('touch note:', e); }
    }, { passive: false });

    playEl.addEventListener('touchmove', function (e) {
      if (screen !== SCREENS.PLAY) return;
      e.preventDefault();

      // Cancel long press on any move
      if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }

      // Two-finger move: track for lens swipe
      if (e.touches.length === 2) {
        swipeLastX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        var dx = swipeLastX - swipeStartX;
        if (Math.abs(dx) > 60) swiping = true;
        return;
      }

      // Single-finger: continuous touch notes with velocity
      if (e.touches.length === 1) {
        var t = e.touches[0];
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

      // Two-finger swipe completed (one finger lifted, was swiping)
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

  // ── HOURLY ODE — Mt. Holly, High Street ──
  // Each hour, the music rings the time. Each lens has its own voice.

  var lastChimeHour = -1;
  var chimeRingsLeft = 0;
  var chimeTimer = 0;
  var chimeVoice = 'bell';

  function checkHourlyChime(sensor, dt) {
    var h = sensor.hour || new Date().getHours();
    var m = new Date().getMinutes();

    // Trigger at the top of the hour (minute 0), once per hour
    if (m === 0 && h !== lastChimeHour) {
      lastChimeHour = h;
      // 12-hour format for chime count
      chimeRingsLeft = h % 12 || 12;
      chimeTimer = 0;

      // Each lens has its own voice
      var lens = Lens.active;
      if (lens) {
        if (lens.name === 'Grid') chimeVoice = 'impact';
        else if (lens.name === 'Ascension') chimeVoice = 'harmonic';
        else if (lens.name === 'Journey') chimeVoice = 'bell';
        else chimeVoice = 'tone';
      }
    }

    // Ring the chimes — spaced 2.5 seconds apart
    if (chimeRingsLeft > 0) {
      chimeTimer += dt;
      if (chimeTimer >= 2.5) {
        chimeTimer = 0;
        chimeRingsLeft--;
        try { Audio.synth.hourlyChime(0, chimeVoice, 0.30); } catch(e) {}
      }
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

      // 7. Hourly ode — Mt. Holly, High Street
      checkHourlyChime(sensor, dt);

      // 8. Pattern engine (AI Producer — silent)
      Pattern.update(dt, Follow.silent);

      // 11. Outfit — sync with dance partner
      if (Outfit.connected) {
        // Track local peaks so we can timestamp them in the broadcast
        if (Follow.peaks > lastPeakCount) {
          lastPeakCount     = Follow.peaks;
          lastLocalPeakTime = Date.now();
        }
        // Broadcast our music state ~12Hz
        Outfit.broadcast({
          energy:    Follow.energy,
          lens:      Lens.active ? Lens.active.name : '',
          phrase:    Follow.phrase,
          archetype: Follow.profileArchetype,
          peakTime:  lastLocalPeakTime,
        });
        // Respond to partner's peaks — call & response across bodies
        var ps = Outfit.partnerState;
        if (ps && ps.peakTime && ps.peakTime > lastPartnerPeak) {
          lastPartnerPeak = ps.peakTime;
          try {
            var aLens = Lens.active;
            if (aLens && aLens.palette && aLens.palette.harmonic && Audio.ctx) {
              var deg = [0, 2, 4][Math.floor(Math.random() * 3)];
              Audio.synth.play(
                aLens.palette.harmonic.voice || 'piano',
                Audio.ctx.currentTime + 0.28, // slight delay — you're responding, not unison
                Follow.scaleFreq(deg, 1),
                0.18 * Math.min(1, ps.energy || 0.5),
                (aLens.palette.harmonic.decay || 1.5) * 0.75
              );
            }
          } catch (e) {}
        }
      }

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

    ctx2d.fillStyle = canvasBgColor;
    ctx2d.fillRect(0, 0, W, H);

    var ox = posX * W;
    var oy = posY * H;
    Organism.draw(ctx2d, ox, oy, W, H);

    // Weather visual layer — on top of organism, under UI
    Wx.render(ctx2d, W, H, Brain.energy || 0);
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
      'ARCHETYPE: ' + Follow.archetype + ' | INTENT: ' + Follow.intent,
      Follow.ascPhase !== '-'
        ? 'ENRICH: ' + Follow.ascEnrich + ' | FILTER: ' + Follow.ascFilter + 'Hz | DETUNE: ' + Follow.ascDetune + 'ct'
        : Follow.gridPhase !== '-'
        ? 'PHASE: ' + Follow.gridPhase + ' | FILTER: ' + Follow.filterFreq.toFixed(0) + 'Hz'
        : 'PHRASE: ' + Follow.phrase + ' | ANSWER: ' + Follow.answer,
      'SILENT: ' + (Follow.silent ? 'YES' : 'no') + ' | FADE: ' + Follow.fade.toFixed(2),
      'YOUR TEMPO: ' + Follow.tempo.toFixed(0) + ' BPM | LOCKED: ' + (Follow.locked ? 'YES(' + Follow.lockStr.toFixed(2) + ')' : 'no'),
      'CONFIDENCE: ' + Follow.confidence.toFixed(2) + ' | HR: ' + Follow.hrState,
      'PROFILE: ' + Follow.profileSessions + ' sessions | ' + Follow.profileArchetype + (Follow.profilePeakMag ? ' | peak avg ' + Follow.profilePeakMag : ''),
      Follow.ascPhase !== '-'
        ? 'PITCHES: ' + Follow.ascPitches + ' | NRG: ' + Follow.ascEnergy + ' | GAIN: ' + Follow.ascGain
        : Follow.gridPhase !== '-'
        ? 'GRID: ' + Follow.gridPhase + ' | BUILD: ' + Follow.gridBuild + ' | INT: ' + Follow.gridIntensity + ' | GAIN: ' + Follow.gridDjGain
        : 'DENSITY: ' + Follow.density.toFixed(1) + ' | ENERGY: ' + Follow.energy.toFixed(2),
      Follow.ascPhase !== '-'
        ? 'ASC: ' + Follow.ascPhase + ' | CHORD: ' + Follow.ascChord + (Follow.ascBreathing === 'YES' ? ' BREATHING' : '')
        : Follow.gridPhase !== '-'
        ? 'DEPTH: ' + Follow.gridDepth + ' | SEG: ' + Follow.gridSegment + ' | BARS: ' + Follow.gridBars + ' | ' + Follow.gridLayers
        : 'PITCH: ' + Follow.degree + ' | FILTER: ' + Follow.filterFreq.toFixed(0) + 'Hz',
      'PEAKS: ' + Follow.peaks + ' | NOTES: ' + Follow.notes,
      'PATTERN: ' + Brain.pattern + ' | TOTAL: ' + Brain.totalMotion.toFixed(0),
      'MOTION: ' + (sensor.hasMotion ? 'YES' : 'NO') + ' | ORIENT: ' + (sensor.hasOrientation ? 'YES' : 'NO'),
      'AUDIO: ' + Follow.ctxState + ' | ERRORS: ' + Follow.errors + '+' + loopErrors,
      'PHASE: ' + ['EMERGENCE','LISTENING','ALIVE'][Follow.phase] + ' (' + Follow.sessionTime + 's) | GEN: ' + Follow.generation + ' ENERGY: ' + Follow.sessionEnergy,
      'ORACLE L1: motifs=' + Pattern.motifs + ' notes=' + Pattern.notes + (Pattern.generating ? ' GEN' : ''),
      'ORACLE L2: forms=' + Pattern.forms + ' sect=' + Pattern.section + ' crystals=' + Pattern.crystals + ' loops=' + Pattern.loops,
    ];

    el.textContent = lines.join('\n');
  }

  // Desktop debug shortcut
  document.addEventListener('keydown', function (e) {
    if (e.key === 'd' || e.key === 'D') toggleDebug();
  });

  // ── OUTFIT UI ────────────────────────────────────────────────────────
  // Lazy-loads PeerJS + QRCode CDN libs on first tap (keeps page load clean).

  function loadOutfitLibs(cb) {
    if (outfitLibsLoaded) { cb(); return; }
    var pending = 2;
    function done() { if (--pending === 0) { outfitLibsLoaded = true; cb(); } }
    var s1 = document.createElement('script');
    s1.src = 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js';
    s1.onload = done; s1.onerror = done;
    document.head.appendChild(s1);
    var s2 = document.createElement('script');
    s2.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
    s2.onload = done; s2.onerror = done;
    document.head.appendChild(s2);
  }

  function initOutfit() {
    var askBtn      = document.getElementById('ask-dance-btn');
    var overlay     = document.getElementById('outfit-overlay');
    var closeBtn    = document.getElementById('outfit-close');
    var qrView      = document.getElementById('outfit-qr-view');
    var qrCanvas    = document.getElementById('outfit-qr-canvas');
    var roomCodeEl  = document.getElementById('outfit-room-code');
    var waitingEl   = document.getElementById('outfit-waiting');
    var connView    = document.getElementById('outfit-conn-view');
    var connGlyph   = document.getElementById('outfit-conn-glyph');
    var connPartner = document.getElementById('outfit-conn-partner');
    var flashEl     = document.getElementById('flash');
    if (!askBtn || !overlay) return;

    function showOverlay() { overlay.classList.add('active'); }
    function hideOverlay()  { overlay.classList.remove('active'); }

    function doFlash() {
      if (!flashEl) return;
      flashEl.style.background = 'rgba(255,220,170,0.8)';
      flashEl.style.opacity = '0.09';
      setTimeout(function () { flashEl.style.opacity = '0'; }, 200);
    }

    function onConnected() {
      waitingEl.textContent = 'connected';
      // Brief pause, then swap QR for ceremony
      setTimeout(function () {
        qrView.style.opacity = '0';
        setTimeout(function () {
          qrView.style.display = 'none';
          var pLens = (Outfit.partnerState && Outfit.partnerState.lens) || '';
          connPartner.textContent = pLens;
          connView.classList.add('show');
          // Stagger the glyph in — feels alive
          requestAnimationFrame(function () {
            connGlyph.classList.add('show');
          });
          doFlash();
          // Auto-close after ceremony — get out of the way
          setTimeout(function () {
            hideOverlay();
            // Reset internal state for next open
            qrView.style.opacity = '';
            qrView.style.display = '';
            connView.classList.remove('show');
            connGlyph.classList.remove('show');
            // The button becomes the live indicator
            askBtn.textContent = 'partner';
            askBtn.classList.add('connected');
          }, 2600);
        }, 380);
      }, 700);
    }

    function onDisconnected() {
      askBtn.textContent = 'dance';
      askBtn.classList.remove('connected');
    }

    function openDance() {
      if (Outfit.connected) return; // already paired
      loadOutfitLibs(function () {
        // Fresh state
        Outfit.destroy();
        var code = Outfit.generateCode();
        roomCodeEl.textContent = code;
        waitingEl.textContent  = 'AWAITING PARTNER';
        qrView.style.opacity   = '';
        qrView.style.display   = '';
        connView.classList.remove('show');
        connGlyph.classList.remove('show');
        showOverlay();
        // Render the QR — green on black, it belongs here
        var url = Outfit.buildJoinURL(code);
        if (window.QRCode) {
          window.QRCode.toCanvas(qrCanvas, url, {
            width: 200, margin: 1,
            color: { dark: '#ffffff', light: '#050505' },
          }, function (err) { if (err) console.warn('[Outfit QR]', err); });
        }
        Outfit.createRoom(code, onConnected, null, onDisconnected);
      });
    }

    // Block touchstart from bubbling to the play screen's long-press handler
    askBtn.addEventListener('touchstart', function (e) {
      e.stopPropagation();
    }, { passive: true });

    // Tap handler — touchend fires before click on iOS, use that
    askBtn.addEventListener('touchend', function (e) {
      e.preventDefault(); e.stopPropagation();
      // Defensively clear the play-screen long-press timer — belt and suspenders
      if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
      openDance();
    }, { passive: false });
    askBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      openDance();
    });

    closeBtn.addEventListener('touchend', function (e) {
      e.preventDefault();
      hideOverlay();
    }, { passive: false });
    closeBtn.addEventListener('click', hideOverlay);

    // Auto-join if this page was opened via a dance QR link
    outfitPendingJoin = Outfit.checkAutoJoin();
  }

  // Called once audio context is ready (needs user gesture before connecting)
  function processAutoJoin() {
    if (!outfitPendingJoin) return;
    var code = outfitPendingJoin;
    outfitPendingJoin = null;
    loadOutfitLibs(function () {
      Outfit.joinRoom(code,
        function onConnect() {
          var askBtn  = document.getElementById('ask-dance-btn');
          var flashEl = document.getElementById('flash');
          if (flashEl) {
            flashEl.style.background = 'rgba(255,220,170,0.8)';
            flashEl.style.opacity = '0.09';
            setTimeout(function () { flashEl.style.opacity = '0'; }, 200);
          }
          if (askBtn) {
            askBtn.textContent = 'partner';
            askBtn.classList.add('connected');
          }
        },
        null,
        function onDisconnect() {
          var askBtn = document.getElementById('ask-dance-btn');
          if (askBtn) { askBtn.textContent = 'dance'; askBtn.classList.remove('connected'); }
        }
      );
    });
  }

  // ── BOOT ─────────────────────────────────────────────────────────────

  function boot() {
    // Version badge — always visible so you know exactly what build is running
    var badge = document.getElementById('version-badge');
    if (badge) badge.textContent = 'v' + (window.GUMP_BUILD || '?');

    initAudioWatchdog();
    initBootCanvas();
    initCanvas();
    initListen();
    initLens();
    initPlayCmd();
    initPlayTouch();
    initOutfit();
    Weather.init();   // fetch conditions — visual + audio adjust when data arrives
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
