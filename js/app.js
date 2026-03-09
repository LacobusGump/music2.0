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
  // Event horizon. A black hole consuming everything.

  var bootAnimId = null;

  function initBootCanvas() {
    var bc = document.getElementById('boot-canvas');
    if (!bc) return;
    var bctx = bc.getContext('2d');
    var bw = 0, bh = 0;

    function resizeBoot() {
      var dpr = window.devicePixelRatio || 1;
      bw = window.innerWidth; bh = window.innerHeight;
      bc.width = bw * dpr; bc.height = bh * dpr;
      bc.style.width = bw + 'px'; bc.style.height = bh + 'px';
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resizeBoot();
    window.addEventListener('resize', resizeBoot);

    // Stars being consumed
    var stars = [];
    for (var s = 0; s < 220; s++) {
      stars.push(spawnStar(true));
    }

    function spawnStar(anyDist) {
      var angle = Math.random() * Math.PI * 2;
      var dist  = anyDist ? 0.12 + Math.random() * 0.55 : 0.35 + Math.random() * 0.45;
      return {
        angle:  angle,
        dist:   dist,           // normalised, 0=singularity, 1=screen edge
        infall: 0.00006 + Math.random() * 0.00012,
        speed:  (0.0005 + Math.random() * 0.001) * (Math.random() > 0.5 ? 1 : -1),
        size:   0.4 + Math.random() * 1.4,
        bright: 0.25 + Math.random() * 0.75,
        warm:   Math.random() > 0.72,
      };
    }

    var t = 0;

    function drawBoot() {
      var cx = bw / 2;
      var cy = bh / 2;
      var R  = Math.min(bw, bh) * 0.21;   // event horizon radius

      // Slow fade — lets trails accumulate into ghostly streaks
      bctx.fillStyle = 'rgba(0,0,0,0.11)';
      bctx.fillRect(0, 0, bw, bh);

      var maxR = Math.min(bw, bh) * 0.56;

      // ── ACCRETION DISK (squashed ellipse = viewed at ~25°) ──
      for (var ring = 3; ring >= 0; ring--) {
        var rR    = R * (1.5 + ring * 0.55);
        var alpha = (0.055 - ring * 0.01) * (0.7 + 0.3 * Math.sin(t * 0.4 + ring));
        bctx.save();
        bctx.translate(cx, cy);
        bctx.scale(1, 0.28);   // disk tilt
        bctx.beginPath();
        bctx.arc(0, 0, rR, 0, Math.PI * 2);
        bctx.strokeStyle = 'rgba(0,255,65,' + alpha + ')';
        bctx.lineWidth = R * 0.14;
        bctx.stroke();
        bctx.restore();
      }

      // ── GRAVITATIONAL LENSING CORONA ──
      var coronaAlpha = 0.10 + 0.05 * Math.sin(t * 0.8);
      var cg = bctx.createRadialGradient(cx, cy, R * 0.82, cx, cy, R * 1.4);
      cg.addColorStop(0, 'rgba(0,255,65,0)');
      cg.addColorStop(0.45, 'rgba(0,255,65,' + coronaAlpha + ')');
      cg.addColorStop(1,   'rgba(0,0,0,0)');
      bctx.beginPath();
      bctx.arc(cx, cy, R * 1.4, 0, Math.PI * 2);
      bctx.fillStyle = cg;
      bctx.fill();

      // ── INFALLING STARS ──
      for (var i = 0; i < stars.length; i++) {
        var p = stars[i];

        // Orbital mechanics: closer → faster spin and faster infall
        var df = Math.max(0.08, p.dist);
        p.angle  += p.speed / (df * df * 1.8);
        p.infall += p.infall * 0.004;
        p.dist   -= p.infall;

        if (p.dist < 0.09) { stars[i] = spawnStar(false); continue; }

        var px = cx + Math.cos(p.angle) * p.dist * maxR;
        var py = cy + Math.sin(p.angle) * p.dist * maxR * 0.30;  // disk squash

        // Doppler: approaching side brighter (left side if spinning CW)
        var doppler = 0.35 + 0.65 * (0.5 + 0.5 * Math.cos(p.angle));
        var alpha = p.bright * doppler * Math.min(1, p.dist * 4.5);

        bctx.beginPath();
        bctx.arc(px, py, p.size, 0, Math.PI * 2);
        bctx.fillStyle = p.warm
          ? 'rgba(255,140,30,' + (alpha * 0.55) + ')'
          : 'rgba(0,255,65,'   + alpha + ')';
        bctx.fill();
      }

      // ── EVENT HORIZON — pure black void ──
      bctx.beginPath();
      bctx.arc(cx, cy, R, 0, Math.PI * 2);
      bctx.fillStyle = '#000000';
      bctx.fill();

      // Photon ring — the last light that will ever escape
      var photonAlpha = 0.18 + 0.10 * Math.sin(t * 1.1);
      bctx.beginPath();
      bctx.arc(cx, cy, R, 0, Math.PI * 2);
      bctx.strokeStyle = 'rgba(0,255,65,' + photonAlpha + ')';
      bctx.lineWidth = 1.8;
      bctx.stroke();

      // ── RELATIVISTIC JET (polar axis) ──
      var jetA = 0.035 + 0.025 * Math.sin(t * 0.55);
      var jg = bctx.createLinearGradient(cx, cy - R, cx, cy - R * 6);
      jg.addColorStop(0, 'rgba(0,255,65,' + jetA + ')');
      jg.addColorStop(1, 'rgba(0,0,0,0)');
      bctx.beginPath();
      bctx.moveTo(cx - R * 0.06, cy - R);
      bctx.lineTo(cx,             cy - R * 6);
      bctx.lineTo(cx + R * 0.06, cy - R);
      bctx.fillStyle = jg;
      bctx.fill();

      // Downward jet (dimmer)
      var jg2 = bctx.createLinearGradient(cx, cy + R, cx, cy + R * 4);
      jg2.addColorStop(0, 'rgba(0,255,65,' + (jetA * 0.4) + ')');
      jg2.addColorStop(1, 'rgba(0,0,0,0)');
      bctx.beginPath();
      bctx.moveTo(cx - R * 0.06, cy + R);
      bctx.lineTo(cx,             cy + R * 4);
      bctx.lineTo(cx + R * 0.06, cy + R);
      bctx.fillStyle = jg2;
      bctx.fill();

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
