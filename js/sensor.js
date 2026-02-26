/**
 * SENSOR — The Body's Interface
 *
 * Every frame: accelerometer + gyroscope + touch + weather + time
 * → one clean SensorState object. Nothing else reads hardware directly.
 */

const Sensor = (function () {
  'use strict';

  // ── RAW ACCUMULATOR ──────────────────────────────────────────────────
  // DeviceMotion fires at its own rate. We latch the latest values
  // and let the main loop consume them each frame.

  const raw = {
    accel: { x: 0, y: 0, z: 0 },
    accelGravity: { x: 0, y: 0, z: 9.81 },
    orient: { alpha: 0, beta: 0, gamma: 0 },
    touch: { active: false, x: 0.5, y: 0.5, startX: 0, startY: 0, startTime: 0 },
    motionGranted: false,
    orientGranted: false,
  };

  // ── WEATHER + TIME ───────────────────────────────────────────────────

  const env = {
    hour: new Date().getHours(),
    timeOfDay: 'day',       // morning | day | evening | night
    weather: 'clear',       // clear | rain | snow | cloud
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
    // Don't preventDefault here — let app.js handle that per-screen
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
      // Fallback: use accelGravity when pure accel unavailable
      raw.accel.x = a.x || 0;
      raw.accel.y = a.y || 0;
      raw.accel.z = a.z || 0;
    }
    raw.motionGranted = true;
  }

  function onOrientation(e) {
    raw.orient.alpha = e.alpha || 0;
    raw.orient.beta = e.beta || 0;
    raw.orient.gamma = e.gamma || 0;
    raw.orientGranted = true;
  }

  // ── iOS PERMISSION DANCE ─────────────────────────────────────────────

  function requestPermissions() {
    return new Promise(function (resolve) {
      if (typeof DeviceMotionEvent !== 'undefined' &&
          typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission()
          .then(function (perm) {
            if (perm === 'granted') {
              window.addEventListener('devicemotion', onMotion);
            }
            return DeviceOrientationEvent.requestPermission();
          })
          .then(function (perm) {
            if (perm === 'granted') {
              window.addEventListener('deviceorientation', onOrientation);
            }
            resolve();
          })
          .catch(function () { resolve(); });
      } else {
        window.addEventListener('devicemotion', onMotion);
        window.addEventListener('deviceorientation', onOrientation);
        resolve();
      }
    });
  }

  // ── INIT / READ ──────────────────────────────────────────────────────

  function init() {
    // Capture phase so sensor always gets touch data even if app.js stopPropagation
    document.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true, capture: true });
    document.addEventListener('touchend', onTouchEnd, { capture: true });
    document.addEventListener('touchcancel', onTouchEnd, { capture: true });

    computeTimeOfDay();
    setInterval(computeTimeOfDay, 60000);
    fetchWeather();
    setInterval(fetchWeather, 600000);

    return requestPermissions();
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
      beta: raw.orient.beta,
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

  return Object.freeze({ init: init, read: read });
})();
