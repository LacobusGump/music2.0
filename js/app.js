/**
 * APP v2 — GUMP Boot Sequence, Main Loop, Screen Manager
 *
 * State machine: BOOT -> PICKER -> PLAY (swipe to) PICKER -> PLAY
 * Main loop: requestAnimationFrame
 *
 * The music follows YOUR body. There is no clock.
 *
 * v2 loop order: sensor -> body -> weather -> rhythm -> flow -> identity -> render
 * Data flows DOWN. No module reaches up.
 */

const App = (function () {
  'use strict';

  // ── BUILD ──────────────────────────────────────────────────────────
  var BUILD = 200;

  // ── STATE ──────────────────────────────────────────────────────────
  var SCREENS = { BOOT: 'boot', PICKER: 'picker', PLAY: 'play' };
  var screen = SCREENS.BOOT;
  var audioCtx = null;

  // Position (smoothed, 0-1)
  var posX = 0.5, posY = 0.5;
  var POS_SMOOTH = 0.12;

  // Canvas
  var canvas = null;
  var ctx2d = null;
  var W = 0, H = 0;

  // Timing
  var lastFrame = 0;
  var debugVisible = false;
  var swipeHintTimer = 0;

  // Swipe detection for live lens switching
  var swipeStartX = 0;
  var swipeLastX = 0;
  var swiping = false;

  // Long press to return to picker
  var longPressTimer = null;

  // Touch velocity tracking
  var prevTouchX = 0, prevTouchY = 0, prevTouchTime = 0;
  var touchVX = 0, touchVY = 0;

  // Outfit -- partner state tracking
  var outfitLibsLoaded  = false;
  var outfitPendingJoin = null;
  var lastPeakCount     = 0;
  var lastLocalPeakTime = 0;
  var lastPartnerPeak   = 0;

  // Voice state -- two moments only: boot + void stillness
  var voiceStillnessStart    = 0;
  var voiceDeepStillnessFired = false;

  // Boot diagnostic log
  var bootLog = [];

  // ── MODULE ALIASES ─────────────────────────────────────────────────
  // v2 architecture defines Flow and Sound. Until those modules exist,
  // bridge to Follow and Audio. When Flow/Sound ship, update these aliases.

  function getFlow()  { return typeof Flow !== 'undefined' ? Flow : (typeof Follow !== 'undefined' ? Follow : null); }
  function getSound() { return typeof Sound !== 'undefined' ? Sound : (typeof Audio !== 'undefined' ? Audio : null); }

  // ── iOS AUDIO WATCHDOG ─────────────────────────────────────────────
  // iOS kills AudioContext whenever the app loses focus: lock screen,
  // background, phone call, notification center, control center, etc.
  // Strategy: intercept EVERY touch at the document level (capture phase,
  // before anything else) and replay the silent buffer trick. This runs
  // in a real iOS gesture context, so resume() cannot be blocked.

  function iosAudioUnlock() {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(function () {});
    }
    // Silent buffer is the real unlock -- resume() alone isn't enough on older iOS
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

  // ── BOOT CANVAS ────────────────────────────────────────────────────
  // Liquid glass boot -- single breathing orb, fades in from black.
  // Golden ratio position. Fibonacci wave frequencies, never repeating.
  // No deviceorientation listener here -- adding one before Sensor.init()
  // requests permission causes Chrome iOS to block the permission dialog.

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

    var t = 0;
    var fadeIn = 0;

    function drawBoot() {
      t += 0.016;
      fadeIn = Math.min(1, fadeIn + 0.008);  // 2 seconds to full

      // Clear to black
      bctx.fillStyle = '#000000';
      bctx.fillRect(0, 0, bw, bh);

      // Center point -- golden ratio position
      var cx = bw * 0.5;
      var cy = bh * 0.382;

      // Breath
      var breath = Math.sin(t * 0.8) * 0.5 + 0.5;
      var r = Math.min(bw, bh) * (0.06 + breath * 0.01) * fadeIn;

      // Outer glow
      var glow = bctx.createRadialGradient(cx, cy, 0, cx, cy, r * 6);
      glow.addColorStop(0, 'rgba(255,245,230,' + (0.06 * fadeIn) + ')');
      glow.addColorStop(0.4, 'rgba(255,235,210,' + (0.02 * fadeIn) + ')');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      bctx.fillStyle = glow;
      bctx.beginPath();
      bctx.arc(cx, cy, r * 6, 0, Math.PI * 2);
      bctx.fill();

      // Core
      var core = bctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      core.addColorStop(0, 'rgba(255,250,240,' + (0.25 * fadeIn) + ')');
      core.addColorStop(0.6, 'rgba(255,240,220,' + (0.08 * fadeIn) + ')');
      core.addColorStop(1, 'rgba(0,0,0,0)');
      bctx.fillStyle = core;
      bctx.beginPath();
      bctx.arc(cx, cy, r, 0, Math.PI * 2);
      bctx.fill();

      bootAnimId = requestAnimationFrame(drawBoot);
    }
    drawBoot();
  }

  function stopBootCanvas() {
    if (bootAnimId) { cancelAnimationFrame(bootAnimId); bootAnimId = null; }
  }

  // ── SCREEN TRANSITIONS ─────────────────────────────────────────────

  function showScreen(name) {
    screen = name;
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) {
      // Map screen names to element IDs
      // v1 used 'listen' and 'lens', v2 uses 'boot' and 'picker'
      var id = screens[i].id;
      var active = false;
      if (name === SCREENS.BOOT)   active = (id === 'screen-listen' || id === 'screen-boot');
      if (name === SCREENS.PICKER) active = (id === 'screen-lens'   || id === 'screen-picker');
      if (name === SCREENS.PLAY)   active = (id === 'screen-play');
      screens[i].classList.toggle('active', active);
    }
  }

  // ── BOOT SCREEN ────────────────────────────────────────────────────

  var bootTapped = false; // guard against double-fire (touchend + click both firing)

  function initBootScreen() {
    // Try both v2 ID and v1 ID
    var el = document.getElementById('screen-boot') || document.getElementById('screen-listen');
    if (!el) return;

    el.addEventListener('touchend', function (e) {
      e.preventDefault();
      onBootTap();
    }, { passive: false });

    el.addEventListener('click', function () {
      onBootTap();
    });
  }

  function onBootTap() {
    if (bootTapped) return;
    bootTapped = true;

    // Move off boot screen immediately
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

    // Voice init + boot greeting -- inside the gesture
    if (typeof Voice !== 'undefined') {
      Voice.init(audioCtx);
      Voice.boot();
    }

    // ── BOOT DIAGNOSTIC ──
    blog('BUILD ' + BUILD);

    blog('Sensor.init() starting...');
    Sensor.init().then(function () {
      blog('Sensor.init() DONE');

      // Initialize Sound
      var sound = getSound();
      blog('Sound.init()');
      sound.init(audioCtx);

      // Initialize Emilia (THE MIND — replaces Body, Harmony, Rhythm, Flow)
      if (typeof Emilia !== 'undefined') {
        blog('Emilia.init()');
        Emilia.init();
      }

      // Legacy fallbacks (only if Emilia not loaded)
      if (typeof Emilia === 'undefined') {
        if (typeof Body !== 'undefined' && Body.init) Body.init();
        if (typeof Harmony !== 'undefined' && Harmony.init) Harmony.init();
        if (typeof Rhythm !== 'undefined' && Rhythm.init) Rhythm.init();
      }

      // Flow / Emilia conductor init
      if (typeof Emilia !== 'undefined') {
        blog('Emilia is the conductor');
      } else {
        var flow = getFlow();
        blog('Flow.init() (legacy)');
        flow.init();
      }

      // Build lens picker and apply
      blog('Lens.buildPicker()');
      Lens.buildPicker();

      var urlLens = Lens.loadFromURL();
      if (urlLens) {
        blog('URL lens: ' + urlLens.name);
        applyLens(urlLens);
        startPlayScreen();
        blog('PLAY -- url lens');
      } else {
        // Only wait for voice on first visit -- otherwise instant
        var introPlayed = false;
        try { introPlayed = !!localStorage.getItem('gump_intro_played'); } catch(e) {}
        var waitTime = introPlayed ? 0 : 2500;
        blog(introPlayed ? 'Returning user -- instant start' : 'First visit -- waiting for voice');
        setTimeout(function () {
          blog('Selecting default lens...');
          Lens.init(); // uses DEFAULT_INDEX from lens.js (Journey)
          var lens = Lens.getSelected();
          blog('Lens: ' + (lens ? lens.name : 'NULL'));
          applyLens(lens);
          if (typeof Pattern !== 'undefined') {
            Pattern.init();
            Pattern.setLens(lens);
          }
          startPlayScreen();
          blog('PLAY -- default lens');
        }, waitTime);
      }
    }).catch(function(e) {
      blog('Sensor.init() FAILED: ' + e);
    });
  }

  // ── APPLY LENS ─────────────────────────────────────────────────────
  // Centralized lens application. Every module that needs lens config
  // gets it here. One function, one place.

  function applyLens(lens) {
    if (!lens) return;
    var sound = getSound();
    var flow  = getFlow();

    try { sound.configure(lens); } catch (e) { console.error('applyLens sound:', e.message, e.stack); }

    // Route to Emilia if available, else legacy
    if (typeof Emilia !== 'undefined') {
      try { Emilia.applyLens(lens); } catch (e) { console.error('applyLens emilia:', e.message, e.stack); }
    } else {
      try { flow.applyLens(lens); } catch (e) { console.error('applyLens flow:', e.message, e.stack); }
    }

    try { Organism.applyLens(lens); } catch (e) { console.error('applyLens organism:', e.message, e.stack); }
    console.log('[applyLens] done. lens:', lens.name);
    }
  }

  // ── BOOT LOG ───────────────────────────────────────────────────────

  function blog(msg) {
    var t = (performance.now() / 1000).toFixed(2);
    var entry = '[' + t + 's] ' + msg;
    bootLog.push(entry);
    console.log(entry);
  }

  // ── PICKER SCREEN ──────────────────────────────────────────────────

  function initPicker() {
    // Command input on the picker screen
    var cmdInput = document.getElementById('cmd-input');
    if (cmdInput) {
      cmdInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
          e.preventDefault();
          var cmd = this.value.trim().toUpperCase();
          // Auto-select lens from RUN command
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
          if (Lens.getSelected()) onPickerGo();
        }
      });
    }

    // Go button
    var goBtn = document.getElementById('lens-go');
    if (goBtn) {
      goBtn.addEventListener('touchstart', function (e) {
        e.preventDefault(); e.stopPropagation(); onPickerGo();
      }, { passive: false });
      goBtn.addEventListener('click', function (e) {
        e.stopPropagation(); onPickerGo();
      });
    }
  }

  function onPickerGo() {
    var lens = Lens.getSelected();
    if (!lens) return;

    // Ensure AudioContext is alive
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

    // Retry motion permissions on this user gesture
    Sensor.retryPermissions();

    applyLens(lens);

    // Voice speaks the lens intro
    if (typeof Voice !== 'undefined') Voice.lensSelected(lens.name);

    showScreen(SCREENS.PLAY);
    startPlayScreen();
  }

  // ── FLASH ──────────────────────────────────────────────────────────

  function flashScreen(color) {
    var el = document.getElementById('flash');
    if (!el) return;
    el.style.background = color;
    el.style.opacity = '0.12';
    setTimeout(function () { el.style.transition = 'opacity 0.6s'; el.style.opacity = '0'; }, 80);
    setTimeout(function () { el.style.transition = ''; }, 700);
  }

  // ── PLAY COMMAND INTERFACE ─────────────────────────────────────────

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
      showScreen(SCREENS.PICKER);
      return;
    }

    // Name capture -- entity asked, user answered
    if (typeof Voice !== 'undefined' && Voice.isAwaitingName && Voice.isAwaitingName() &&
        cmd.indexOf('RUN ') !== 0 && cmd.length < 32) {
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
        applyLens(lens);
        if (typeof Pattern !== 'undefined') Pattern.setLens(lens);
        if (typeof Voice !== 'undefined') Voice.lensSelected(lens.name);
        Lens.updateIndicator();

        // Flash color on lens switch
        var flashColors = {
          'Journey':   '#3d3550',
          'Grid':      '#ff3300',
          'Ascension': '#8844ff',
        };
        flashScreen(flashColors[lens.name] || 'rgba(255,210,150,0.4)');
      }
    }
  }

  // ── PLAY SCREEN ────────────────────────────────────────────────────

  var spikeWired   = false;
  var gestureWired = false;

  function startPlayScreen() {
    // Double-check AudioContext is running
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

    // Auto-join a dance room if the page was opened via QR link
    processAutoJoin();

    Lens.updateIndicator();

    // Wire body/brain spike events to flow engine + organism (ONCE)
    if (!spikeWired) {
      var bodyModule = (typeof Body !== 'undefined' && Body.on) ? Body : Brain;
      bodyModule.on('spike', function (data) {
        try {
          var flow = getFlow();
          flow.onSpike(data);
          if (data.neuron === 'toss' || data.neuron === 'shake') {
            Organism.addMutation(data.energy);
          }
          // Voice reacts to extreme peaks
          if (data.energy > 2.2 && typeof Voice !== 'undefined') Voice.onPeak();
        } catch (e) { console.error('spike handler:', e); }
      });
      spikeWired = true;
    }

    // Wire gesture recogniser to the play canvas (ONCE)
    if (!gestureWired && typeof Gesture !== 'undefined') {
      var playCanvas = document.getElementById('canvas');
      if (playCanvas) {
        Gesture.attach(playCanvas, 52);
        Gesture.on('figure8', function () {
          if (typeof Voice !== 'undefined') {
            Voice.iCanWorkWithThis();
            Voice.onDiscovery('figure8');
          }
          flashScreen('rgba(255,210,150,0.12)');
          setTimeout(function () {
            var next = Lens.nextLens();
            if (typeof Pattern !== 'undefined') Pattern.setLens(next);
            Lens.updateIndicator();
            flashScreen('rgba(255,210,150,0.06)');
          }, 800);
        });
        gestureWired = true;
      }
    }

    swipeHintTimer = 0;

    // Reset voice state for this session
    voiceStillnessStart    = 0;
    voiceDeepStillnessFired = false;

    // Show novelty slider after a short delay
    var nWrap = document.getElementById('novelty-slider-wrap');
    if (nWrap) setTimeout(function(){ nWrap.classList.add('visible'); }, 3000);

    // Start the main loop
    lastFrame = performance.now();
    requestAnimationFrame(loop);
  }

  // ── TOUCH HANDLING IN PLAY SCREEN ──────────────────────────────────

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

      // iOS: resume AudioContext from within a gesture
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

      // Retry motion permission on every touch
      Sensor.retryPermissions();

      // Long press: return to picker (single finger only)
      longPressTimer = setTimeout(function () {
        showScreen(SCREENS.PICKER);
      }, 1200);

      // Play touch note
      var flow = getFlow();
      var t = e.touches[0];
      prevTouchX = t.clientX / W; prevTouchY = t.clientY / H; prevTouchTime = performance.now();
      touchVX = 0; touchVY = 0;
      try { flow.touch(prevTouchX, prevTouchY, 0, 0); } catch (e) { console.error('touch note:', e); }
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
        var flow = getFlow();
        var t = e.touches[0];
        var nowMs = performance.now();
        var dtMs = nowMs - prevTouchTime;
        if (dtMs > 0) {
          var curX = t.clientX / W, curY = t.clientY / H;
          touchVX = (curX - prevTouchX) / (dtMs / 1000);
          touchVY = (curY - prevTouchY) / (dtMs / 1000);
          prevTouchX = curX; prevTouchY = curY; prevTouchTime = nowMs;
          try { flow.touch(curX, curY, touchVX, touchVY); } catch (e) {}
          try { getSound().spatial.setTouchPan(curX); } catch (e) {}
        }
      }
    }, { passive: false });

    playEl.addEventListener('touchend', function (e) {
      if (screen !== SCREENS.PLAY) return;

      if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }

      // Two-finger swipe completed
      if (swiping) {
        var dx = swipeLastX - swipeStartX;
        if (dx > 60) Lens.prevLens();
        else if (dx < -60) Lens.nextLens();
        Organism.applyLens(Lens.active);
        if (Lens.active) {
          if (typeof Pattern !== 'undefined') Pattern.setLens(Lens.active);
          if (typeof Voice !== 'undefined') Voice.lensSelected(Lens.active.name);
        }
      }

      swiping = false;
    });

    // Three-finger tap: debug
    playEl.addEventListener('touchstart', function (e) {
      if (e.touches.length >= 3) {
        if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
        toggleDebug();
      }
    }, { passive: true });
  }

  // ── POSITION SMOOTHING ─────────────────────────────────────────────

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

  // ── HOURLY ODE -- Mt. Holly, High Street ───────────────────────────
  // Each hour, the music rings the time. Each lens has its own voice.

  var lastChimeHour = -1;
  var chimeRingsLeft = 0;
  var chimeTimer = 0;
  var chimeVoice = 'bell';

  function checkHourlyChime(sensor, dt) {
    var h = sensor.hour || new Date().getHours();
    var m = new Date().getMinutes();

    // Trigger at the top of the hour (minute 0), once per hour
    // Gate behind body engagement — no clocks make musical decisions without the body
    var bodyActive = (typeof Body !== 'undefined' && Body.energy > 0.05) ||
                     (typeof Brain !== 'undefined' && Brain.short && Brain.short.energy() > 0.05);
    if (m === 0 && h !== lastChimeHour && bodyActive) {
      lastChimeHour = h;
      chimeRingsLeft = h % 12 || 12;
      chimeTimer = 0;

      var lens = Lens.active;
      if (lens) {
        if (lens.name === 'Grid') chimeVoice = 'impact';
        else if (lens.name === 'Ascension') chimeVoice = 'harmonic';
        else if (lens.name === 'Journey') chimeVoice = 'bell';
        else chimeVoice = 'tone';
      }
    }

    // Ring the chimes -- spaced 2.5 seconds apart
    if (chimeRingsLeft > 0) {
      chimeTimer += dt;
      if (chimeTimer >= 2.5) {
        chimeTimer = 0;
        chimeRingsLeft--;
        try { getSound().synth.hourlyChime(0, chimeVoice, 0.30); } catch(e) {}
      }
    }
  }

  // ── MAIN LOOP ──────────────────────────────────────────────────────
  // v2 order: sensor -> body -> weather -> rhythm -> flow -> identity -> render

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
      // Delta time (capped at 50ms to prevent jumps after tab switch)
      var dt = Math.min(0.05, (timestamp - lastFrame) / 1000);
      lastFrame = timestamp;

      // 1. Read sensors
      var sensor = Sensor.read();

      // 2. THE MIND — Emilia processes everything
      if (typeof Emilia !== 'undefined') {
        Emilia.update(sensor, timestamp);
      } else {
        // Legacy fallback
        var flow = getFlow();
        var bodyModule = (typeof Body !== 'undefined') ? Body : Brain;
        bodyModule.process(sensor, timestamp);
        flow.update(sensor, timestamp);
      }

      // 3. Update position (visual tracking)
      updatePosition(sensor);

      // 4. Render visuals
      var energy = (typeof Emilia !== 'undefined') ? Emilia.energy : 0;
      Organism.update(dt, posX, posY, W, H,
        { energy: energy, neurons: [] },
        sensor.touching
      );
      render(dt);

      // 5. Hourly ode
      checkHourlyChime(sensor, dt);

      // Legacy outfit sync
      if (typeof Outfit !== 'undefined' && Outfit.connected) {
        var ps = Outfit.partnerState;
        if (ps && ps.peakTime && ps.peakTime > lastPartnerPeak) {
          lastPartnerPeak = ps.peakTime;
          try {
            var aLens = Lens.active;
            var sound = getSound();
            if (aLens && aLens.palette && aLens.palette.harmonic && sound.ctx) {
              var deg = [0, 2, 4][Math.floor(Math.random() * 3)];
              sound.synth.play(
                aLens.palette.harmonic.voice || 'piano',
                sound.ctx.currentTime + 0.28,
                flow.scaleFreq(deg, 1),
                0.18 * Math.min(1, ps.energy || 0.5),
                (aLens.palette.harmonic.decay || 1.5) * 0.75
              );
            }
          } catch (e) {}
        }
      }

      // 12. Debug
      if (debugVisible) updateDebug(sensor);

      // 13. Swipe hint fades after 5s
      swipeHintTimer += dt;
      if (swipeHintTimer > 5) {
        var hint = document.getElementById('swipe-hint');
        if (hint) hint.style.opacity = '0';
      }
    } catch (e) {
      if (loopErrors++ < 5) console.error('LOOP ERROR:', e);
    }
  }

  // ── RENDER ─────────────────────────────────────────────────────────

  function render(dt) {
    if (!ctx2d) return;

    ctx2d.fillStyle = 'rgba(3,3,5,0.15)';
    ctx2d.fillRect(0, 0, W, H);

    var ox = posX * W;
    var oy = posY * H;
    Organism.draw(ctx2d, ox, oy, W, H);

    // Weather visual layer -- on top of organism, under UI
    if (typeof Wx !== 'undefined') {
      var bodyModule = (typeof Body !== 'undefined') ? Body : Brain;
      Wx.render(ctx2d, W, H, bodyModule.energy || 0);
    }
  }

  // ── CANVAS SETUP ───────────────────────────────────────────────────

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

  // ── DEBUG ──────────────────────────────────────────────────────────

  function toggleDebug() {
    debugVisible = !debugVisible;
    var el = document.getElementById('debug');
    if (el) el.classList.toggle('visible', debugVisible);
  }

  function updateDebug(sensor) {
    var el = document.getElementById('debug');
    if (!el) return;

    var flow = getFlow();
    var bodyModule = (typeof Body !== 'undefined') ? Body : Brain;
    var lens = Lens.active;

    var lines = [
      'GUMP v2 -- YOUR BODY IS THE INSTRUMENT',
      'BUILD: ' + BUILD,
      'LENS: ' + (lens ? lens.name : 'none'),
      'ARCHETYPE: ' + flow.archetype + ' | INTENT: ' + flow.intent,
      flow.ascPhase !== '-'
        ? 'ENRICH: ' + flow.ascEnrich + ' | FILTER: ' + flow.ascFilter + 'Hz | DETUNE: ' + flow.ascDetune + 'ct'
        : flow.gridPhase !== '-'
        ? 'PHASE: ' + flow.gridPhase + ' | FILTER: ' + flow.filterFreq.toFixed(0) + 'Hz'
        : 'PHRASE: ' + flow.phrase + ' | ANSWER: ' + flow.answer,
      'SILENT: ' + (flow.silent ? 'YES' : 'no') + ' | FADE: ' + flow.fade.toFixed(2),
      'YOUR TEMPO: ' + flow.tempo.toFixed(0) + ' BPM | LOCKED: ' + (flow.locked ? 'YES(' + flow.lockStr.toFixed(2) + ')' : 'no'),
      'CONFIDENCE: ' + flow.confidence.toFixed(2) + ' | HR: ' + flow.hrState,
      'PROFILE: ' + flow.profileSessions + ' sessions | ' + flow.profileArchetype + (flow.profilePeakMag ? ' | peak avg ' + flow.profilePeakMag : ''),
      flow.ascPhase !== '-'
        ? 'PITCHES: ' + flow.ascPitches + ' | NRG: ' + flow.ascEnergy + ' | GAIN: ' + flow.ascGain
        : flow.gridPhase !== '-'
        ? 'GRID: ' + flow.gridPhase + ' | BUILD: ' + flow.gridBuild + ' | INT: ' + flow.gridIntensity + ' | GAIN: ' + flow.gridDjGain
        : 'DENSITY: ' + flow.density.toFixed(1) + ' | ENERGY: ' + flow.energy.toFixed(2),
      flow.ascPhase !== '-'
        ? 'ASC: ' + flow.ascPhase + ' | CHORD: ' + flow.ascChord + (flow.ascBreathing === 'YES' ? ' BREATHING' : '')
        : flow.gridPhase !== '-'
        ? 'DEPTH: ' + flow.gridDepth + ' | SEG: ' + flow.gridSegment + ' | BARS: ' + flow.gridBars + ' | ' + flow.gridLayers
        : 'PITCH: ' + flow.degree + ' | FILTER: ' + flow.filterFreq.toFixed(0) + 'Hz',
      'PEAKS: ' + flow.peaks + ' | NOTES: ' + flow.notes,
      'PATTERN: ' + bodyModule.pattern + ' | TOTAL: ' + bodyModule.totalMotion.toFixed(0),
      'MOTION: ' + (sensor.hasMotion ? 'YES' : 'NO') + ' | ORIENT: ' + (sensor.hasOrientation ? 'YES' : 'NO'),
      'AUDIO: ' + flow.ctxState + ' | ERRORS: ' + flow.errors + '+' + loopErrors,
      'PHASE: ' + ['EMERGENCE','LISTENING','ALIVE'][flow.phase] + ' (' + flow.sessionTime + 's) | GEN: ' + flow.generation + ' ENERGY: ' + flow.sessionEnergy,
    ];

    // Pattern engine debug (if available)
    if (typeof Pattern !== 'undefined') {
      lines.push('ORACLE L1: motifs=' + Pattern.motifs + ' notes=' + Pattern.notes + (Pattern.generating ? ' GEN' : ''));
      lines.push('ORACLE L2: forms=' + Pattern.forms + ' sect=' + Pattern.section + ' crystals=' + Pattern.crystals + ' loops=' + Pattern.loops);
    }

    el.textContent = lines.join('\n');
  }

  // Desktop debug shortcut
  document.addEventListener('keydown', function (e) {
    if (e.key === 'd' || e.key === 'D') toggleDebug();
  });

  // ── GUMP DIAGNOSTIC SNAPSHOT ───────────────────────────────────────
  // window.gump() -- full diagnostic, auto-copies to clipboard

  function gumpSnapshot() {
    var s = Sensor.read();
    var lens = Lens.active;
    var flow = getFlow();
    var bodyModule = (typeof Body !== 'undefined') ? Body : Brain;
    var sound = getSound();
    var out = '=== GUMP STATUS ===\n';
    out += 'BUILD: ' + BUILD + '\n';
    out += 'Screen: ' + screen + '\n';
    out += 'Lens: ' + (lens ? lens.name : 'none') + '\n';
    out += 'Audio: ' + (sound.ctx ? sound.ctx.state : 'no ctx') + '\n';
    out += 'Motion: ' + (s.hasMotion ? 'YES' : 'NO') + '\n';
    out += 'Orient: ' + (s.hasOrientation ? 'YES' : 'NO') + '\n';
    out += 'Beta: ' + (s.beta || 0).toFixed(1) + ' Gamma: ' + (s.gamma || 0).toFixed(1) + '\n';
    out += 'Energy: ' + (bodyModule.energy || 0).toFixed(2) + '\n';
    out += 'Silent: ' + flow.silent + '\n';
    out += 'Errors: ' + flow.errors + '\n';
    out += '\n=== BOOT LOG ===\n';
    out += bootLog.join('\n') + '\n';
    console.log(out);
    try { navigator.clipboard.writeText(out); } catch(e) {}
    return out;
  }

  // ── OUTFIT UI ──────────────────────────────────────────────────────
  // Lazy-loads PeerJS + QRCode CDN libs on first tap.

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
    if (typeof Outfit === 'undefined') return;

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
      flashEl.style.background = 'rgba(255,210,150,0.5)';
      flashEl.style.opacity = '0.09';
      setTimeout(function () { flashEl.style.opacity = '0'; }, 200);
    }

    function onConnected() {
      waitingEl.textContent = 'connected';
      setTimeout(function () {
        qrView.style.opacity = '0';
        setTimeout(function () {
          qrView.style.display = 'none';
          var pLens = (Outfit.partnerState && Outfit.partnerState.lens) || '';
          connPartner.textContent = pLens;
          connView.classList.add('show');
          requestAnimationFrame(function () {
            connGlyph.classList.add('show');
          });
          doFlash();
          setTimeout(function () {
            hideOverlay();
            qrView.style.opacity = '';
            qrView.style.display = '';
            connView.classList.remove('show');
            connGlyph.classList.remove('show');
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
      if (Outfit.connected) return;
      loadOutfitLibs(function () {
        Outfit.destroy();
        var code = Outfit.generateCode();
        roomCodeEl.textContent = code;
        waitingEl.textContent  = 'AWAITING PARTNER';
        qrView.style.opacity   = '';
        qrView.style.display   = '';
        connView.classList.remove('show');
        connGlyph.classList.remove('show');
        showOverlay();
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

    // Block touchstart from bubbling to play screen's long-press handler
    askBtn.addEventListener('touchstart', function (e) {
      e.stopPropagation();
    }, { passive: true });

    askBtn.addEventListener('touchend', function (e) {
      e.preventDefault(); e.stopPropagation();
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

    // Auto-join if opened via dance QR link
    outfitPendingJoin = Outfit.checkAutoJoin();
  }

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
            flashEl.style.background = 'rgba(255,210,150,0.5)';
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

  // ── SESSION LOGGING ────────────────────────────────────────────────
  // clearLog()     -- reset
  // copy(dump())   -- copy full session to clipboard
  // GUMP_BUILD     -- check loaded build

  function sessionClearLog() {
    bootLog = [];
    // Delegate to follow.js/flow.js clear if available
    if (typeof window.ascClear === 'function') window.ascClear();
    console.log('Session logs cleared.');
  }

  function sessionDump() {
    // If follow.js has its own dump, use it (it knows the engine logs)
    if (typeof window.dump === 'function') return window.dump();
    return 'GUMP BUILD ' + BUILD + '\n' + bootLog.join('\n');
  }

  // ── BOOT ───────────────────────────────────────────────────────────

  function boot() {
    // Version badge
    var badge = document.getElementById('version-badge');
    if (badge) badge.textContent = 'v' + BUILD;

    initAudioWatchdog();
    initBootCanvas();
    initCanvas();
    initBootScreen();
    initPicker();
    initPlayCmd();
    initPlayTouch();
    initOutfit();

    // Weather can start fetching early (no user gesture needed)
    if (typeof Weather !== 'undefined') Weather.init();

    showScreen(SCREENS.BOOT);
  }

  // ── GLOBAL NAMESPACE ───────────────────────────────────────────────

  // GUMP_BUILD -- the canonical build check
  window.GUMP_BUILD = BUILD;

  // Session logging globals
  window.clearLog = sessionClearLog;

  // Only set window.dump if follow.js hasn't already set it
  // (follow.js sets window.dump with engine-specific logs)
  if (typeof window.dump !== 'function') {
    window.dump = sessionDump;
  }

  // window.gump() -- full diagnostic snapshot
  window.gump = gumpSnapshot;

  // Boot log accessible from console
  window.bootLog = bootLog;

  // ── LAUNCH ─────────────────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // ── PUBLIC API ─────────────────────────────────────────────────────

  return Object.freeze({
    boot: boot,
    BUILD: BUILD,
    getScreen: function () { return screen; },
    setScreen: function (s) {
      if (s === 'boot' || s === 'picker' || s === 'play') {
        showScreen(s);
        if (s === 'play') startPlayScreen();
      }
    },
  });

})();
