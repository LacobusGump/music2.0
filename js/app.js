/**
 * APP — The Conductor of Conductors
 *
 * State machine: LISTEN → LENS → PLAY
 * Bootstrap: permissions, AudioContext on first touch
 * Main loop: requestAnimationFrame
 * Debug panel: press D on desktop, three-finger tap on mobile
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
  let swipeStartTime = 0;
  let swiping = false;

  // Long press to return to lens picker
  let longPressTimer = null;

  // ── SCREEN TRANSITIONS ───────────────────────────────────────────────

  function showScreen(name) {
    screen = name;
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) {
      screens[i].classList.toggle('active', screens[i].id === 'screen-' + name);
    }
  }

  // ── LISTEN SCREEN ────────────────────────────────────────────────────

  function initListen() {
    var el = document.getElementById('screen-listen');
    if (!el) return;

    el.addEventListener('touchstart', function (e) {
      e.preventDefault();
      onListenTap();
    }, { passive: false });

    el.addEventListener('click', function () {
      onListenTap();
    });
  }

  function onListenTap() {
    if (screen !== SCREENS.LISTEN) return;

    // Create AudioContext on user gesture (iOS requirement)
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();

    // Init sensor permissions
    Sensor.init().then(function () {
      // Init subsystems
      Brain.init();
      Voice.init(audioCtx);

      // Build lens picker
      Lens.buildPicker();

      // Check for shared lens in URL
      var urlLens = Lens.loadFromURL();
      if (urlLens) {
        Voice.applyLens(urlLens);
        Organism.applyLens(urlLens);
        showScreen(SCREENS.PLAY);
        startPlayScreen();
      } else {
        showScreen(SCREENS.LENS);
      }
    });
  }

  // ── LENS SCREEN ──────────────────────────────────────────────────────

  function initLens() {
    var goBtn = document.getElementById('lens-go');
    if (!goBtn) return;

    goBtn.addEventListener('touchstart', function (e) {
      e.preventDefault();
      e.stopPropagation();
      onLensGo();
    }, { passive: false });

    goBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      onLensGo();
    });
  }

  function onLensGo() {
    var lens = Lens.getSelected();
    if (!lens) return;

    Voice.applyLens(lens);
    Organism.applyLens(lens);

    showScreen(SCREENS.PLAY);
    startPlayScreen();
  }

  // ── PLAY SCREEN ──────────────────────────────────────────────────────

  function startPlayScreen() {
    Lens.updateIndicator();

    // Wire brain events → voice + organism
    Brain.on('spike', function (data) {
      Voice.onSpike(data);
      if (data.neuron === 'toss' || data.neuron === 'shake') {
        Organism.addMutation(data.energy);
      }
    });

    swipeHintTimer = 0;

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

      var t = e.touches[0];
      swipeStartX = t.clientX;
      swipeStartTime = performance.now();
      swiping = false;

      // Long press: return to lens picker
      longPressTimer = setTimeout(function () {
        showScreen(SCREENS.LENS);
      }, 1200);

      // Play touch note
      Voice.playTouchNote(t.clientX / W, t.clientY / H);
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

      // Continuous touch notes while dragging
      if (!swiping) {
        Voice.playTouchNote(t.clientX / W, t.clientY / H);
      }
    }, { passive: false });

    playEl.addEventListener('touchend', function (e) {
      if (screen !== SCREENS.PLAY) return;

      if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }

      if (swiping) {
        // Determine swipe direction from last tracked position
        var dx = swipeLastX - swipeStartX;
        if (dx > 60) Lens.prevLens();
        else if (dx < -60) Lens.nextLens();
        // Re-apply to organism
        Organism.applyLens(Lens.active);
      }

      swiping = false;
    });

    // Three-finger tap for debug
    playEl.addEventListener('touchstart', function (e) {
      if (e.touches.length >= 3) toggleDebug();
    }, { passive: true });
  }

  // ── POSITION SMOOTHING ───────────────────────────────────────────────

  function updatePosition(sensor) {
    if (sensor.touching) {
      // Touch drives position directly
      posX += (sensor.tx - posX) * POS_SMOOTH;
      posY += (sensor.ty - posY) * POS_SMOOTH;
    } else if (sensor.hasOrientation) {
      // Tilt drives position
      // gamma: -90 to 90 (left/right), beta: 0 to 180 (front/back)
      var nx = Math.max(0, Math.min(1, (sensor.gamma + 45) / 90));
      var ny = Math.max(0, Math.min(1, (sensor.beta - 20) / 80));
      posX += (nx - posX) * POS_SMOOTH * 0.5;
      posY += (ny - posY) * POS_SMOOTH * 0.5;
    }
  }

  // ── MAIN LOOP ────────────────────────────────────────────────────────

  function loop(timestamp) {
    if (screen !== SCREENS.PLAY) return;

    var dt = Math.min(0.05, (timestamp - lastFrame) / 1000);
    lastFrame = timestamp;

    // 1. Read sensors
    var sensor = Sensor.read();

    // 2. Process brain
    Brain.process(sensor, timestamp);

    // 3. Update position
    updatePosition(sensor);

    // 4. Update voice
    Voice.update(
      { totalMotion: Brain.totalMotion, energy: Brain.energy, pattern: Brain.pattern, voidDepth: Brain.voidDepth, neurons: Brain.neurons },
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

    // 7. Debug
    if (debugVisible) updateDebug(sensor);

    // 8. Swipe hint fades after 5s
    swipeHintTimer += dt;
    if (swipeHintTimer > 5) {
      var hint = document.getElementById('swipe-hint');
      if (hint) hint.style.opacity = '0';
    }

    requestAnimationFrame(loop);
  }

  // ── RENDER ───────────────────────────────────────────────────────────

  function render(dt) {
    if (!ctx2d) return;

    // Fade trail (not full clear — leaves ghost)
    ctx2d.fillStyle = 'rgba(0,0,0,0.15)';
    ctx2d.fillRect(0, 0, W, H);

    // Draw organism at smoothed position
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
      'LENS: ' + (lens ? lens.name : 'none'),
      'STAGE: ' + Voice.stage + ' | TEMPO: ' + Voice.tempo.toFixed(0),
      'PATTERN: ' + Brain.pattern + ' | TOTAL: ' + Brain.totalMotion.toFixed(0),
      'ENERGY: ' + Brain.energy.toFixed(2) + ' | VOID: ' + Brain.voidDepth.toFixed(2),
      'FILTER: ' + Voice.filterFreq.toFixed(0) + 'Hz',
      'ORGANISM: ' + Organism.stage + ' | LIFE: ' + Organism.lifeForce.toFixed(0),
      'POS: ' + posX.toFixed(2) + ',' + posY.toFixed(2),
      'MOTION: ' + (sensor.hasMotion ? 'YES' : 'NO') + ' | ORIENT: ' + (sensor.hasOrientation ? 'YES' : 'NO'),
      'TIME: ' + sensor.timeOfDay + ' | WEATHER: ' + sensor.weather,
    ];

    var vols = Voice.layerVolumes;
    var layerLine = 'LAYERS:';
    for (var k in vols) layerLine += ' ' + k + ':' + vols[k];
    lines.push(layerLine);

    el.textContent = lines.join('\n');
  }

  // Desktop debug shortcut
  document.addEventListener('keydown', function (e) {
    if (e.key === 'd' || e.key === 'D') toggleDebug();
  });

  // ── BOOT ─────────────────────────────────────────────────────────────

  function boot() {
    initCanvas();
    initListen();
    initLens();
    initPlayTouch();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
