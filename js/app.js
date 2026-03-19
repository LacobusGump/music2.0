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

    // Liquid glass boot — single breathing orb, fades in from black
    var t = 0;
    var fadeIn = 0;

    function drawBoot() {
      t += 0.016;
      fadeIn = Math.min(1, fadeIn + 0.008);  // 2 seconds to full

      // Clear to black
      bctx.fillStyle = '#000000';
      bctx.fillRect(0, 0, bw, bh);

      // Center point, shifted slightly by tilt
      tiltX += (tiltRawX * 0.08 - tiltX) * 0.04;
      tiltY += (tiltRawY * 0.06 - tiltY) * 0.04;
      var cx = bw * (0.5 + tiltX * 0.05);
      var cy = bh * (0.382 + tiltY * 0.03);  // golden ratio position

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
    // ── BOOT DIAGNOSTIC — visible log of every step ──
    var bootLog = [];
    window.bootLog = bootLog;
    function blog(msg) {
      var t = (performance.now() / 1000).toFixed(2);
      var entry = '[' + t + 's] ' + msg;
      bootLog.push(entry);
      console.log(entry);
    }

    // window.gump() — full diagnostic snapshot
    window.gump = function() {
      var s = Sensor.read();
      var lens = Lens.active;
      var out = '=== GUMP STATUS ===\n';
      out += 'BUILD: ' + window.GUMP_BUILD + '\n';
      out += 'Screen: ' + screen + '\n';
      out += 'Lens: ' + (lens ? lens.name : 'none') + '\n';
      out += 'Audio: ' + (Audio.ctx ? Audio.ctx.state : 'no ctx') + '\n';
      out += 'Motion: ' + (s.hasMotion ? 'YES' : 'NO') + '\n';
      out += 'Orient: ' + (s.hasOrientation ? 'YES' : 'NO') + '\n';
      out += 'Beta: ' + (s.beta || 0).toFixed(1) + ' Gamma: ' + (s.gamma || 0).toFixed(1) + '\n';
      out += 'Energy: ' + (typeof Brain !== 'undefined' ? Brain.short.energy().toFixed(2) : '?') + '\n';
      out += 'Silent: ' + Follow.silent + '\n';
      out += 'Errors: ' + Follow.errors + '\n';
      out += '\n=== BOOT LOG ===\n';
      out += bootLog.join('\n') + '\n';
      console.log(out);
      try { navigator.clipboard.writeText(out); } catch(e) {}
      return out;
    };

    blog('BUILD ' + window.GUMP_BUILD);
    blog('Voice.boot()');
    Voice.boot();

    blog('Sensor.init() starting...');
    Sensor.init().then(function () {
      blog('Sensor.init() DONE');
      blog('Brain.init()');
      Brain.init();
      blog('Audio.init()');
      Audio.init(audioCtx);
      blog('Follow.init()');
      Follow.init();
      blog('Lens.buildPicker()');
      Lens.buildPicker();

      var urlLens = Lens.loadFromURL();
      if (urlLens) {
        blog('URL lens: ' + urlLens.name);
        Audio.configure(urlLens);
        Follow.applyLens(urlLens);
        Organism.applyLens(urlLens);
        startPlayScreen();
        blog('PLAY — url lens');
      } else {
        blog('Waiting 2.5s for voice...');
        setTimeout(function () {
          blog('Selecting default lens...');
          Lens.selectCard(1); // Grid — strongest first impression
          var lens = Lens.getSelected();
          blog('Lens: ' + (lens ? lens.name : 'NULL'));
          Audio.configure(lens);
          Follow.applyLens(lens);
          Organism.applyLens(lens);
          Pattern.init();
          Pattern.setLens(lens);
          startPlayScreen();
          blog('PLAY — default lens');
        }, 2500);
      }
    }).catch(function(e) {
      blog('Sensor.init() FAILED: ' + e);
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
    el.style.opacity = '0.12';
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
        flashScreen(flashColors[lens.name] || 'rgba(255,210,150,0.4)');
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
          flashScreen('rgba(255,210,150,0.12)');
          // Cycle to the next lens — music transforms, no picker, no break
          setTimeout(function () {
            var next = Lens.nextLens();
            Pattern.setLens(next);
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

    ctx2d.fillStyle = 'rgba(3,3,5,0.15)';
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
      flashEl.style.background = 'rgba(255,210,150,0.5)';
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
