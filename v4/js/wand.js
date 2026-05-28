/**
 * WAND — 6DOF Musical Wand (v4)
 *
 * Phone as paintbrush + tremor sensor.
 * Trajectory shapes + hand tremors become the primary musical control.
 *
 * Built from the Suno reverse-engineering research:
 *   /Users/jamesmccandless/Documents/research/suno_architecture_deep_dive.md
 *   The conditioning slot is modality-agnostic. Sensor streams (especially rich
 *   motion + tremor features) can replace text prompts for high-quality generation.
 *
 * Ties directly to products/ tools for the heavy lifting:
 *   - /products/sensor/ : drop the live 6DOF + derived features, get K/R/E/T on the gesture itself.
 *   - /products/turbo/  : compile this exact feature extractor (KRET operators) to native/WASM for 120 Hz+ on device.
 *   - /products/aitrainer + learnengine/ : train the small MLP that turns (wand state + GPS + weather) → conditioning vector for MusicGen/YuE-style stems.
 *
 * Future: this rich wand embedding + env snapshot is exactly what will drive
 * automatic "real song" stem generation that the phone then manipulates live.
 *
 * No external deps. Works entirely in the motion event rate (60-120 Hz typical).
 */

const Wand = (function () {
  'use strict';

  // ── CONFIG ────────────────────────────────────────────────────────────
  const TREMOR_WINDOW = 28;        // ~0.25-0.45 s at 60-100 Hz (hand tremor band)
  const SHAPE_WINDOW  = 72;        // ~0.7-1.2 s for trajectory shape
  const MAX_SAMPLES   = 96;        // safety cap

  // Empirical scaling for phone accelerometers (m/s²). Tweak on device.
  const TREMOR_SCALE  = 9.5;       // higher = less sensitive
  const TREMOR_MAX    = 0.18;      // full tremor = 1.0

  // ── RING BUFFERS (accel + time) ───────────────────────────────────────
  let samples = [];   // [{t, ax, ay, az, beta, gamma}]
  let lastPushTime = 0;

  // Smoothed outputs (exponential)
  let _tremor = 0;
  let _speed = 0;
  let _curvature = 0;
  let _shapeType = 'hold';
  let _kret = { K: 0.5, R: 0.5, E: 0.3, T: 0.1 };

  let _gestureStart = 0;
  let _lastShapeLog = 0;

  // ── HELPERS ───────────────────────────────────────────────────────────

  function pushSample(sensor, now) {
    const ax = sensor.ax || 0;
    const ay = sensor.ay || 0;
    const az = sensor.az || 0;

    samples.push({
      t: now,
      ax: ax,
      ay: ay,
      az: az,
      beta: sensor.beta || 0,
      gamma: sensor.gamma || 0
    });

    if (samples.length > MAX_SAMPLES) samples.shift();

    lastPushTime = now;
  }

  // Very lightweight high-pass + energy (good enough for 6-25 Hz hand tremor on phone IMU)
  function computeTremor() {
    if (samples.length < 8) return 0;

    const n = Math.min(TREMOR_WINDOW, samples.length);
    let energy = 0;
    let count = 0;

    for (let i = samples.length - n + 1; i < samples.length; i++) {
      const s = samples[i];
      const p = samples[i-1];
      if (!p) continue;

      const dx = s.ax - p.ax;
      const dy = s.ay - p.ay;
      const dz = s.az - p.az;

      // High-freq emphasis (delta of deltas is too noisy; single delta is fine)
      energy += dx*dx + dy*dy + dz*dz;
      count++;
    }

    if (count < 4) return _tremor;

    const raw = Math.sqrt(energy / count) / TREMOR_SCALE;
    const norm = Math.max(0, Math.min(1, raw / TREMOR_MAX));

    // Smooth
    _tremor = _tremor * 0.72 + norm * 0.28;
    return _tremor;
  }

  // Trajectory shape over longer window (paint strokes)
  function computeShape() {
    if (samples.length < 12) {
      _speed = _speed * 0.8;
      _curvature = _curvature * 0.8;
      _shapeType = 'hold';
      return;
    }

    const n = Math.min(SHAPE_WINDOW, samples.length);
    const startIdx = samples.length - n;

    let totalSpeed = 0;
    let totalTurn = 0;
    let prevVX = 0, prevVY = 0;
    let netDispX = 0, netDispY = 0;

    for (let i = startIdx + 1; i < samples.length; i++) {
      const s = samples[i];
      const p = samples[i-1];
      const dt = Math.max(0.004, (s.t - p.t) / 1000);

      // Treat phone-frame accel as "brush force" (simple but musical)
      const vx = (s.ax * 0.6) + (s.gamma * 0.012);   // left-right paint emphasis
      const vy = (s.ay * 0.6) + ((s.beta - 62) * 0.009); // up-down (centered)

      const speed = Math.sqrt(vx*vx + vy*vy);
      totalSpeed += speed;

      // curvature via direction change
      if (prevVX !== 0 || prevVY !== 0) {
        const dot = prevVX*vx + prevVY*vy;
        const mag = Math.sqrt((prevVX*prevVX + prevVY*prevVY) * (vx*vx + vy*vy)) || 0.0001;
        const cos = Math.max(-1, Math.min(1, dot / mag));
        const angle = Math.acos(cos);
        totalTurn += angle;
      }

      netDispX += vx * dt;
      netDispY += vy * dt;

      prevVX = vx * 0.6 + prevVX * 0.4;
      prevVY = vy * 0.6 + prevVY * 0.4;
    }

    const avgSpeed = totalSpeed / (n - 1);
    const avgTurn  = totalTurn  / (n - 2 || 1);

    _speed = _speed * 0.65 + avgSpeed * 0.35;
    _curvature = _curvature * 0.6 + (avgTurn * 1.8) * 0.4;

    // Heuristic shape typing (the "painting" language)
    const tremor = _tremor;
    const disp = Math.sqrt(netDispX*netDispX + netDispY*netDispY);

    if (tremor > 0.55 && avgSpeed < 0.8) {
      _shapeType = 'shake';
    } else if (_curvature > 1.8 && avgSpeed > 0.9) {
      _shapeType = 'circle';
    } else if (_curvature > 1.1 && disp > 1.2) {
      _shapeType = 'arc';
    } else if (avgSpeed > 1.4 && _curvature < 0.7) {
      _shapeType = 'sweep';
    } else if (avgSpeed < 0.35 && tremor < 0.25) {
      _shapeType = 'hold';
    } else {
      _shapeType = 'paint';
    }
  }

  // Lightweight K/R/E/T on the wand motion itself (your framework, live)
  function computeKRET() {
    if (samples.length < 10) return;

    const n = Math.min(24, samples.length);
    const start = samples.length - n;

    let axVar = 0, ayVar = 0, azVar = 0;
    let meanAx = 0, meanAy = 0, meanAz = 0;
    let count = 0;

    for (let i = start; i < samples.length; i++) {
      const s = samples[i];
      meanAx += s.ax; meanAy += s.ay; meanAz += s.az;
      count++;
    }
    meanAx /= count; meanAy /= count; meanAz /= count;

    for (let i = start; i < samples.length; i++) {
      const s = samples[i];
      axVar += (s.ax - meanAx) ** 2;
      ayVar += (s.ay - meanAy) ** 2;
      azVar += (s.az - meanAz) ** 2;
    }

    const vars = [axVar, ayVar, azVar];
    const meanVar = (axVar + ayVar + azVar) / 3;
    const maxVar = Math.max(...vars) || 0.0001;

    // K = how locked the three axes are (low relative variance = high coupling)
    const K = 1 - Math.min(1, (maxVar - meanVar) / (maxVar + 0.001));

    // R = overall order (inverse of total variance, clamped)
    const totalVar = axVar + ayVar + azVar;
    const R = Math.max(0.1, Math.min(0.95, 1 - Math.min(1, totalVar / 18)));

    // T = the decoupling energy we already measured as tremor
    const T = _tremor;

    // E = "cost" of the current gesture (high speed + high tremor = expensive to sustain)
    const E = Math.min(1, (_speed * 0.55) + (T * 0.45));

    _kret = {
      K: K * 0.7 + _kret.K * 0.3,
      R: R * 0.7 + _kret.R * 0.3,
      E: E * 0.65 + _kret.E * 0.35,
      T: T * 0.75 + _kret.T * 0.25
    };
  }

  // ── PUBLIC API ────────────────────────────────────────────────────────

  function update(sensor, dt) {
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());

    pushSample(sensor, now);

    // Always compute tremor (the life signal)
    const t = computeTremor();

    // Shape only every few frames (cheaper + more stable)
    if (samples.length % 3 === 0) {
      computeShape();
      computeKRET();
    }

    // Occasional console insight for testing (remove or gate later)
    if (now - _lastShapeLog > 1800) {
      _lastShapeLog = now;
      if (_tremor > 0.4 || _shapeType !== 'hold') {
        // console.debug('[wand]', _shapeType, 'tremor=' + _tremor.toFixed(2), 'KRET', _kret);
      }
    }

    return getState();
  }

  function getState() {
    return {
      tremor: _tremor,           // 0-1 primary "human life" signal
      speed: Math.min(1, _speed * 0.7),
      curvature: Math.min(1, _curvature * 0.55),
      shapeType: _shapeType,     // 'hold' | 'paint' | 'arc' | 'circle' | 'sweep' | 'shake'
      kret: { ..._kret },        // direct K/R/E/T on your hand motion
      gestureAge: lastPushTime ? (performance.now() - _gestureStart) / 1000 : 0
    };
  }

  function getTremor() {
    return _tremor;
  }

  function reset() {
    samples = [];
    _tremor = 0;
    _speed = 0;
    _curvature = 0;
    _shapeType = 'hold';
    _kret = { K: 0.5, R: 0.5, E: 0.3, T: 0.1 };
    _gestureStart = performance.now();
  }

  function init() {
    reset();
    // console.log('[wand] v4 musical wand ready — trajectory + tremor (see Suno deep dive + products/sensor)');
    return true;
  }

  return Object.freeze({
    init: init,
    update: update,
    getState: getState,
    getTremor: getTremor,
    reset: reset
  });
})();