/**
 * SENSOR — The Body's Interface
 *
 * Every frame: accelerometer + gyroscope + touch + weather + time
 * → one clean SensorState object. Nothing else reads hardware directly.
 *
 * iOS PERMISSION HANDLING:
 * - requestPermission() MUST fire in direct user gesture (touch/click)
 * - fetchWeather (geolocation) is deferred to AFTER motion permission
 * - Permission is retried on every significant user gesture via retryPermissions()
 * - If denied, a visible help message tells user how to fix it in Safari settings
 */

const Sensor = (function () {
  'use strict';

  // ── RAW ACCUMULATOR ──────────────────────────────────────────────────

  const raw = {
    accel: { x: 0, y: 0, z: 0 },
    accelGravity: { x: 0, y: 0, z: 9.81 },
    orient: { alpha: 0, beta: 0, gamma: 0 },
    touch: { active: false, x: 0.5, y: 0.5, startX: 0, startY: 0, startTime: 0 },
    motionGranted: false,
    orientGranted: false,
    motionEventCount: 0,
  };

  // Permission tracking
  var permState = 'unknown'; // 'unknown' | 'granted' | 'denied' | 'unavailable'
  var listenersAdded = false;
  var helpShown = false;

  // ── WEATHER + TIME ───────────────────────────────────────────────────

  const env = {
    hour: new Date().getHours(),
    timeOfDay: 'day',
    weather: 'clear',
    temperature: null,
    weatherLoaded: false,
  };

  function computeTimeOfDay() {
    const h = new Date().getHours();
    env.hour = h;
    if (h >= 5 && h < 10) env.timeOfDay = 'morning';
    else if (h >= 10 && h < 17) env.timeOfDay = 'day';
    else if (h >= 17 && h < 21) env.timeOfDay = 'evening';
    else env.timeOfDay = 'night';
  }

  function fetchWeather() {
    if (env.weatherLoaded) return;
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      function (pos) {
        const lat = pos.coords.latitude.toFixed(2);
        const lon = pos.coords.longitude.toFixed(2);
        const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat +
          '&longitude=' + lon + '&current_weather=true';

        fetch(url).then(function (r) { return r.json(); }).then(function (data) {
          if (!data.current_weather) return;
          env.temperature = data.current_weather.temperature;
          const code = data.current_weather.weathercode;
          if (code >= 61 && code <= 67) env.weather = 'rain';
          else if (code >= 71 && code <= 77) env.weather = 'snow';
          else if (code >= 1 && code <= 3) env.weather = 'cloud';
          else env.weather = 'clear';
          env.weatherLoaded = true;
        }).catch(function () { /* silent */ });
      },
      function () { /* permission denied — fine */ },
      { timeout: 5000 }
    );
  }

  // ── TOUCH / POINTER ──────────────────────────────────────────────────

  function onTouchStart(e) {
    const t = e.touches[0];
    raw.touch.active = true;
    raw.touch.x = t.clientX / window.innerWidth;
    raw.touch.y = t.clientY / window.innerHeight;
    raw.touch.startX = raw.touch.x;
    raw.touch.startY = raw.touch.y;
    raw.touch.startTime = performance.now();
  }

  function onTouchMove(e) {
    if (!e.touches.length) return;
    const t = e.touches[0];
    raw.touch.x = t.clientX / window.innerWidth;
    raw.touch.y = t.clientY / window.innerHeight;
  }

  function onTouchEnd() {
    raw.touch.active = false;
  }

  // ── DEVICE MOTION / ORIENTATION ──────────────────────────────────────

  function onMotion(e) {
    const a = e.accelerationIncludingGravity;
    const b = e.acceleration;
    if (a) {
      raw.accelGravity.x = a.x || 0;
      raw.accelGravity.y = a.y || 0;
      raw.accelGravity.z = a.z || 0;
    }
    if (b) {
      raw.accel.x = b.x || 0;
      raw.accel.y = b.y || 0;
      raw.accel.z = b.z || 0;
    } else if (a) {
      raw.accel.x = a.x || 0;
      raw.accel.y = a.y || 0;
      raw.accel.z = a.z || 0;
    }
    raw.motionGranted = true;
    raw.motionEventCount++;
  }

  function onOrientation(e) {
    raw.orient.alpha = e.alpha || 0;
    raw.orient.beta = e.beta || 0;
    raw.orient.gamma = e.gamma || 0;
    raw.orientGranted = true;
  }

  function addListeners() {
    if (listenersAdded) return;
    window.addEventListener('devicemotion', onMotion);
    window.addEventListener('deviceorientation', onOrientation);
    listenersAdded = true;
  }

  // ── iOS PERMISSION — AGGRESSIVE ────────────────────────────────────

  /**
   * MUST be called from a direct user gesture (touchstart / click).
   * Uses Promise.all to request both permissions simultaneously —
   * on iOS 16+ they share a single dialog, on older iOS the second
   * one piggybacks on the gesture context.
   */
  function requestPermissions() {
    return new Promise(function (resolve) {
      // Already granted? Just make sure listeners are active.
      if (permState === 'granted') {
        addListeners();
        resolve();
        return;
      }

      // Does this browser need explicit permission? (iOS 13+)
      var needsRequest = typeof DeviceMotionEvent !== 'undefined' &&
        typeof DeviceMotionEvent.requestPermission === 'function';

      if (!needsRequest) {
        // Android / desktop / older iOS — just add listeners
        addListeners();
        permState = 'granted';
        resolve();
        return;
      }

      // iOS: request BOTH permissions simultaneously via Promise.all
      // Each has its own .catch so one failing doesn't kill the other
      // Timeout after 5s — Chrome on iOS can hang forever
      function withTimeout(promise, ms) {
        return Promise.race([
          promise,
          new Promise(function(resolve) { setTimeout(function() { resolve('timeout'); }, ms); })
        ]);
      }

      var motionP = withTimeout(
        DeviceMotionEvent.requestPermission().catch(function () { return 'error'; }),
        5000
      );

      var orientP;
      if (typeof DeviceOrientationEvent !== 'undefined' &&
          typeof DeviceOrientationEvent.requestPermission === 'function') {
        orientP = withTimeout(
          DeviceOrientationEvent.requestPermission().catch(function () { return 'error'; }),
          5000
        );
      } else {
        orientP = Promise.resolve('granted');
      }

      Promise.all([motionP, orientP]).then(function (results) {
        var motionResult = results[0];
        var orientResult = results[1];

        if (motionResult === 'granted' || orientResult === 'granted') {
          // Got at least one — add listeners for both
          addListeners();
          permState = 'granted';
          dismissHelp();

          // Verify events actually fire (iOS edge case)
          var countBefore = raw.motionEventCount;
          setTimeout(function () {
            if (raw.motionEventCount === countBefore && !raw.motionGranted) {
              // Permission said 'granted' but no events arriving
              // Still OK — touch + tilt fallback in brain.js handles this
              console.warn('[Sensor] Motion granted but no events received');
            }
          }, 2000);
        } else {
          // Both denied or errored
          permState = 'denied';
          showHelp();
        }

        resolve();
      });
    });
  }

  /**
   * Call from ANY user gesture to retry permission.
   * Costs nothing if already granted (returns immediately).
   * On iOS, this re-shows the dialog if the previous denial was
   * per-page-session (cleared by reload).
   */
  var retryCount = 0;

  function retryPermissions() {
    if (permState === 'granted' && listenersAdded) return Promise.resolve();

    // Don't retry more than twice — if denied, it's denied. Show instructions.
    if (retryCount >= 2) return Promise.resolve();
    retryCount++;

    var needsRequest = typeof DeviceMotionEvent !== 'undefined' &&
      typeof DeviceMotionEvent.requestPermission === 'function';

    if (!needsRequest) {
      addListeners();
      permState = 'granted';
      return Promise.resolve();
    }

    return DeviceMotionEvent.requestPermission()
      .then(function (perm) {
        if (perm === 'granted') {
          addListeners();
          permState = 'granted';
          dismissHelp();
        }
        // If denied again, don't keep trying
      })
      .catch(function () { /* silent */ });
  }

  // ── HELP MESSAGE ─────────────────────────────────────────────────────

  function showHelp() {
    if (helpShown) return;
    helpShown = true;

    var el = document.createElement('div');
    el.id = 'sensor-help';
    el.style.cssText =
      'position:fixed;bottom:20px;left:8%;right:8%;' +
      'background:rgba(200,60,60,0.95);color:#fff;' +
      'padding:16px 20px;border-radius:14px;' +
      'font:14px/1.5 -apple-system,sans-serif;z-index:9999;' +
      'text-align:center;backdrop-filter:blur(8px);';
    var isChrome = /CriOS/.test(navigator.userAgent || '');
    if (isChrome) {
      // Chrome iOS: requestPermission returns denied without dialog.
      // User must enable in Chrome settings or use Safari instead.
      el.innerHTML =
        '<b>Motion access needed</b><br><br>' +
        'Chrome blocks motion by default.<br>' +
        'Tap the <b>lock icon</b> in the address bar<br>' +
        '→ <b>Site Settings</b> → <b>Motion Sensors</b> → Allow<br>' +
        'Then reload.<br><br>' +
        '<b>Or open in Safari</b> — it works there.';
    } else {
      el.innerHTML =
        '<b>Motion access needed</b><br>' +
        'Tap <b>aA</b> in the address bar<br>' +
        '→ <b>Website Settings</b> → <b>Motion & Orientation</b> → Allow<br>' +
        'Then reload the page.<br><br>' +
        '<span style="opacity:0.7;font-size:12px">Tap here to retry</span>';
    }
    el.addEventListener('click', function () {
      if (!isChrome) retryPermissions();  // Only retry on Safari — Chrome can't
    });
    el.addEventListener('touchstart', function (e) {
      e.stopPropagation();
      if (!isChrome) retryPermissions();
    }, { passive: true });
    document.body.appendChild(el);
  }

  function dismissHelp() {
    var el = document.getElementById('sensor-help');
    if (el) el.remove();
    helpShown = false;
  }

  // ── INIT / READ ──────────────────────────────────────────────────────

  function init() {
    // Touch listeners first (always work, no permission needed)
    document.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true, capture: true });
    document.addEventListener('touchend', onTouchEnd, { capture: true });
    document.addEventListener('touchcancel', onTouchEnd, { capture: true });

    computeTimeOfDay();
    setInterval(computeTimeOfDay, 60000);

    // Request motion/orientation FIRST — weather waits
    // (geolocation dialog can preempt motion permission dialog on iOS)
    return requestPermissions().then(function () {
      // Only fetch weather AFTER sensor permissions are resolved
      fetchWeather();
      setInterval(fetchWeather, 600000);
    });
  }

  /** Call once per frame. Returns a snapshot. */
  function read() {
    return {
      ax: raw.accel.x,
      ay: raw.accel.y,
      az: raw.accel.z,
      gx: raw.accelGravity.x,
      gy: raw.accelGravity.y,
      gz: raw.accelGravity.z,
      alpha: raw.orient.alpha,
      // Clamp beta to [-90, 90] — past vertical pushes against the edge, never inverts
      beta: Math.max(-90, Math.min(90, raw.orient.beta || 0)),
      gamma: raw.orient.gamma,
      touching: raw.touch.active,
      tx: raw.touch.x,
      ty: raw.touch.y,
      touchStartX: raw.touch.startX,
      touchStartY: raw.touch.startY,
      touchStartTime: raw.touch.startTime,
      timeOfDay: env.timeOfDay,
      hour: env.hour,
      weather: env.weather,
      temperature: env.temperature,
      hasMotion: raw.motionGranted,
      hasOrientation: raw.orientGranted,
    };
  }

  return Object.freeze({
    init: init,
    read: read,
    retryPermissions: retryPermissions,
    get permissionState() { return permState; },
  });
})();
