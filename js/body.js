/**
 * BODY — Motion Intelligence
 *
 * The body IS the instrument. This module takes raw sensor data and produces
 * a complete motion analysis. It reports what the body is doing. It never
 * tells the music what to do.
 *
 * Pipeline:
 *   SensorState → Kalman filter → gravity subtraction → ring buffers
 *   (Fibonacci sizes: 5, 34, 233, 1597) → 7 LIF spiking neurons →
 *   void state machine → motion pattern classification → peak detection →
 *   derived tempo → archetype classification → motion profile →
 *   spectrum analysis → coupling readiness
 *
 * Replaces brain.js. Named "body" because the body IS the instrument —
 * not a brain controlling one.
 */

const Body = (function () {
  'use strict';

  // ── CALLBACKS ──────────────────────────────────────────────────────────
  // Simple pub/sub. No event bus overhead.

  var _cbs = { spike: [], void: [], pattern: [] };

  function on(event, fn) { if (_cbs[event]) _cbs[event].push(fn); }

  function _emit(event, data) {
    var list = _cbs[event];
    if (list) for (var i = 0; i < list.length; i++) list[i](data);
  }

  // ── KALMAN FILTER (1D, per axis) ───────────────────────────────────────
  // Standard optimal estimator for noisy sensor data. Removes jitter
  // without removing intent. The phone's accelerometer has both measurement
  // noise and process noise — Kalman handles both optimally.

  var KALMAN_R = 0.5;   // measurement noise covariance
  var KALMAN_Q = 0.1;   // process noise covariance

  function kalman() {
    var x = 0, p = 1;
    return {
      update: function (z) {
        p += KALMAN_Q;
        var k = p / (p + KALMAN_R);
        x += k * (z - x);
        p *= (1 - k);
        return x;
      },
      reset: function () { x = 0; p = 1; }
    };
  }

  var kx = kalman(), ky = kalman(), kz = kalman();

  // ── GRAVITY ESTIMATION ─────────────────────────────────────────────────
  // High-pass complement filter separates gravity from linear acceleration.
  // Alpha = 0.98 means gravity estimate changes very slowly (low-pass),
  // so subtracting it yields linear acceleration (high-pass).
  // Standard approach for MEMS accelerometers (Android sensor documentation).

  var GRAVITY_ALPHA = 0.98;
  var grav = { x: 0, y: 0, z: 9.81 };
  var lin = { x: 0, y: 0, z: 0 };

  function subtractGravity(fx, fy, fz) {
    var a = GRAVITY_ALPHA;
    grav.x = a * grav.x + (1 - a) * fx;
    grav.y = a * grav.y + (1 - a) * fy;
    grav.z = a * grav.z + (1 - a) * fz;
    lin.x = fx - grav.x;
    lin.y = fy - grav.y;
    lin.z = fz - grav.z;
  }

  // ── RING BUFFER ────────────────────────────────────────────────────────
  // Fixed-size circular buffer with running statistics. O(1) push, mean,
  // variance, energy. Zero-crossing counter for frequency estimation.

  function RingBuffer(size) {
    this.buf = new Float32Array(size);
    this.cap = size;
    this.head = 0;
    this.len = 0;
    this._sum = 0;
    this._sumSq = 0;
    this._peak = 0;

    // Zero-crossing tracker for frequency estimation
    this._lastSign = 0;
    this._zc = 0;
    this._zcBuf = new Float32Array(Math.min(size, 60));
    this._zcCap = this._zcBuf.length;
    this._zcHead = 0;
    this._zcLen = 0;
  }

  RingBuffer.prototype.push = function (v) {
    if (this.len >= this.cap) {
      var old = this.buf[this.head];
      this._sum -= old;
      this._sumSq -= old * old;
    }
    this.buf[this.head] = v;
    this._sum += v;
    this._sumSq += v * v;

    var abs = v < 0 ? -v : v;
    this._peak = abs > this._peak ? abs : this._peak * 0.995;

    // Zero-crossings (deadband at 0.01 to reject noise)
    var sign = v > 0.01 ? 1 : (v < -0.01 ? -1 : 0);
    var crossed = 0;
    if (sign !== 0 && this._lastSign !== 0 && sign !== this._lastSign) crossed = 1;
    if (sign !== 0) this._lastSign = sign;

    if (this._zcLen >= this._zcCap) this._zc -= this._zcBuf[this._zcHead];
    this._zcBuf[this._zcHead] = crossed;
    this._zc += crossed;
    this._zcHead = (this._zcHead + 1) % this._zcCap;
    if (this._zcLen < this._zcCap) this._zcLen++;

    this.head = (this.head + 1) % this.cap;
    if (this.len < this.cap) this.len++;
  };

  RingBuffer.prototype.mean = function () {
    return this.len > 0 ? this._sum / this.len : 0;
  };

  RingBuffer.prototype.variance = function () {
    if (this.len < 2) return 0;
    var m = this.mean();
    return Math.max(0, this._sumSq / this.len - m * m);
  };

  RingBuffer.prototype.energy = function () {
    return this.len > 0 ? Math.sqrt(this._sumSq / this.len) : 0;
  };

  RingBuffer.prototype.peak = function () {
    return this._peak;
  };

  RingBuffer.prototype.freqEstimate = function () {
    if (this._zcLen < 4) return 0;
    return this._zc / (2 * this._zcLen / 60);
  };

  // Raw buffer access for spectrum analysis
  RingBuffer.prototype.toArray = function () {
    var out = new Float32Array(this.len);
    for (var i = 0; i < this.len; i++) {
      out[i] = this.buf[(this.head - this.len + i + this.cap) % this.cap];
    }
    return out;
  };

  // Fibonacci-sized buffers — multi-scale temporal analysis.
  // Non-integer-related window sizes prevent aliasing between scales.
  // micro (5) ~80ms = gesture | short (34) ~550ms = rhythm
  // medium (233) ~3.8s = phrase | long (1597) ~26s = arc
  var micro  = new RingBuffer(5);
  var short_ = new RingBuffer(34);
  var med    = new RingBuffer(233);
  var long_  = new RingBuffer(1597);

  // Per-axis short buffers for cross-product (circle detection)
  var sX = new RingBuffer(34);
  var sY = new RingBuffer(34);
  var sZ = new RingBuffer(34);

  // ── LIF SPIKING NEURONS ────────────────────────────────────────────────
  // Leaky Integrate-and-Fire model (Gerstner & Kistler 2002).
  // Computationally efficient, biologically inspired. Each neuron detects
  // a specific motion archetype. The refractory period prevents
  // double-triggering. The leak ensures old energy fades.
  // 7 neurons = 7 motion primitives the body can produce.

  function Neuron(name, leak, thresh, refr) {
    this.name = name;
    this.membrane = 0;
    this.leak = leak;        // membrane decay per step (0-1)
    this.thresh = thresh;    // spike threshold
    this.refr = refr;        // refractory period (steps)
    this.refrLeft = 0;
    this.spikes = [];
    this.lastSpike = 0;
  }

  Neuron.prototype.integrate = function (input, t) {
    if (this.refrLeft > 0) {
      this.refrLeft--;
      this.membrane *= 0.5;
      return false;
    }
    this.membrane = this.membrane * this.leak + Math.max(0, input);
    if (this.membrane >= this.thresh) {
      this.membrane = 0;
      this.refrLeft = this.refr;
      this.lastSpike = t;
      this.spikes.push(t);
      if (this.spikes.length > 30) this.spikes.shift();
      return true;
    }
    return false;
  };

  // Spike rate: spikes per second over the last 2 seconds
  Neuron.prototype.rate = function () {
    if (this.spikes.length < 2) return 0;
    var now = this.spikes[this.spikes.length - 1];
    var c = 0;
    for (var i = this.spikes.length - 1; i >= 0; i--) {
      if (this.spikes[i] >= now - 2000) c++; else break;
    }
    return c / 2;
  };

  var neurons = {
    stillness: new Neuron('stillness', 0.98, 0.5,  30),
    shake:     new Neuron('shake',     0.90, 1.2,  15),
    sweep:     new Neuron('sweep',     0.92, 0.8,  12),
    circle:    new Neuron('circle',    0.93, 1.0,  20),
    pendulum:  new Neuron('pendulum',  0.95, 1.0,  20),
    rock:      new Neuron('rock',      0.96, 0.7,  25),
    toss:      new Neuron('toss',      0.85, 1.5,  30),
  };

  var prevVec = { x: 0, y: 0, z: 0 };
  var tiltAmp = 0;
  var lastOrient = { beta: 0, gamma: 0 };
  var prevTouch = { x: 0.5, y: 0.5, active: false };

  var DEADZONE = 0.15;

  function runNeurons(mag, t) {
    var freq = short_.freqEstimate();
    var sMean = short_.mean();
    var sVar = short_.variance();
    var sE = short_.energy();
    var mE = med.energy();

    var inputs = {
      stillness: 1 - Math.min(1, sE / DEADZONE),
      shake: sVar * freq * 0.3,
      sweep: Math.abs(sMean) > 0.01
        ? Math.abs(sMean) * (1 - Math.min(1, sVar / (Math.abs(sMean) + 0.001)))
        : 0,
      circle: (function () {
        var cx = prevVec.y * lin.z - prevVec.z * lin.y;
        var cy = prevVec.z * lin.x - prevVec.x * lin.z;
        var cz = prevVec.x * lin.y - prevVec.y * lin.x;
        return Math.sqrt(cx * cx + cy * cy + cz * cz) * 0.5;
      })(),
      pendulum: sE * (freq > 0.3 && freq < 3 ? 1 : 0.2) * 0.5,
      rock: tiltAmp * (mE < 0.5 ? 1 : 0) * 1.5,
      toss: micro.peak() > 3 && sMean < 0.5 ? 2.0 : 0,
    };

    for (var name in neurons) {
      if (neurons[name].integrate(inputs[name], t)) {
        _emit('spike', {
          neuron: name,
          rate: neurons[name].rate(),
          energy: sE,
          magnitude: mag,
          timestamp: t
        });
      }
    }

    prevVec.x = lin.x;
    prevVec.y = lin.y;
    prevVec.z = lin.z;
  }

  // ── VOID STATE MACHINE ─────────────────────────────────────────────────
  // PRESENT → SETTLING → VOID → TRANSCENDENT
  //
  // Stillness is not silence — it is arriving at the body's own resting
  // frequency. 0.1 Hz cardiovascular resonance is the frequency of calm
  // (Lehrer & Gevirtz 2014). The breath cycle at deep rest is ~6/min
  // = 0.1 Hz. The void state machine detects this transition and reports
  // depth, never deciding what to do with it.

  var VOID = { PRESENT: 0, SETTLING: 1, VOID: 2, TRANSCENDENT: 3 };
  var VOID_TIMES = { settle: 2, deep: 5, transcend: 15 };

  var voidState = {
    state: VOID.PRESENT,
    timer: 0,
    depth: 0,
    breathPhase: 0,
    breathRate: 0.15,     // ~9 breaths/min → approaches 0.1 Hz resonance
    lastT: 0,
  };

  function updateVoid(mag, t) {
    var dt = voidState.lastT > 0 ? (t - voidState.lastT) / 1000 : 0.016;
    voidState.lastT = t;

    if (mag < DEADZONE) {
      voidState.timer += dt;
    } else {
      voidState.timer *= 0.5;   // motion halves accumulated stillness
    }
    voidState.timer = Math.max(0, Math.min(60, voidState.timer));

    var s = voidState.timer;
    var ns = VOID.PRESENT, td = 0;

    if (s >= VOID_TIMES.transcend) {
      ns = VOID.TRANSCENDENT;
      td = 1;
    } else if (s >= VOID_TIMES.deep) {
      ns = VOID.VOID;
      td = 0.5 + 0.5 * (s - VOID_TIMES.deep) / (VOID_TIMES.transcend - VOID_TIMES.deep);
    } else if (s >= VOID_TIMES.settle) {
      ns = VOID.SETTLING;
      td = 0.5 * (s - VOID_TIMES.settle) / (VOID_TIMES.deep - VOID_TIMES.settle);
    }

    voidState.depth += (td - voidState.depth) * 0.05;

    if (ns !== voidState.state) {
      var prev = voidState.state;
      voidState.state = ns;
      _emit('void', { state: ns, prev: prev, depth: voidState.depth, stillness: s });
    }

    voidState.breathPhase = (voidState.breathPhase + dt * voidState.breathRate * Math.PI * 2) % (Math.PI * 2);
  }

  // ── MOTION PATTERN CLASSIFICATION ──────────────────────────────────────
  // Five tiers based on short-buffer energy and variance.
  // Reports what the body IS doing, never what to play.

  var motionPattern = 'still';
  var totalMotion = 0;
  var lastPatternEmit = '';

  function classifyPattern() {
    var e = short_.energy();
    var v = short_.variance();
    var p;
    if (e < DEADZONE)    p = 'still';
    else if (e < 0.5)    p = 'gentle';
    else if (v < 1.0)    p = 'rhythmic';
    else if (e < 2.0)    p = 'vigorous';
    else                 p = 'chaotic';

    if (p !== motionPattern) {
      motionPattern = p;
      if (p !== lastPatternEmit) {
        _emit('pattern', { pattern: p, energy: e });
        lastPatternEmit = p;
      }
    }
  }

  // ── ARCHETYPE CLASSIFICATION ───────────────────────────────────────────
  // Moved from follow.js. Analyzes neuron firing rates + energy to classify
  // HOW the user is moving: exploring, walking, waving, bouncing.
  // This is body analysis, not a musical decision.

  var archetype = 'exploring';
  var archetypeConfidence = 0;
  var archetypeSmoothEnergy = 0;

  function classifyArchetype() {
    var energy = short_.energy();
    archetypeSmoothEnergy += (energy - archetypeSmoothEnergy) * 0.05;

    var pendRate  = neurons.pendulum.rate();
    var sweepRate = neurons.sweep.rate();
    var shakeRate = neurons.shake.rate();
    var rockRate  = neurons.rock.rate();

    var prev = archetype;

    if (motionPattern === 'still' || archetypeSmoothEnergy < 0.15) {
      archetype = 'exploring';
    } else if (pendRate > 1.5 && rhythmConfidence > 0.4) {
      archetype = 'walking';
    } else if (shakeRate > 1.0 && archetypeSmoothEnergy > 1.5) {
      archetype = 'bouncing';
    } else if (sweepRate > 0.8) {
      archetype = 'waving';
    } else if (rockRate > 0.5 && archetypeSmoothEnergy < 0.8) {
      archetype = 'exploring';
    } else if (rhythmConfidence > 0.3) {
      archetype = 'walking';
    } else {
      archetype = 'waving';
    }

    if (archetype !== prev) {
      archetypeConfidence = 0;
    } else {
      archetypeConfidence = Math.min(1, archetypeConfidence + 0.02);
    }
  }

  // ── PEAK DETECTION ─────────────────────────────────────────────────────
  // Moved from follow.js. Detects peaks in motion magnitude.
  // A peak is a local maximum above threshold. Cooldown prevents
  // double-triggering on noisy maxima.

  var accelBuf = new Float32Array(64);
  var accelHead = 0;
  var accelLen = 0;
  var lastPeakTime = 0;
  var peakIntervals = new Float32Array(8);
  var piHead = 0;
  var piLen = 0;
  var derivedTempo = 0;
  var rhythmConfidence = 0;
  var lastMag = 0;
  var lastLastMag = 0;
  var peakCooldown = 0;
  var peakThreshold = 1.5;    // default, adapted by motion profile
  var peakedThisFrame = false;
  var peakMagnitude = 0;
  var peakCount = 0;

  function pushAccel(mag) {
    accelBuf[accelHead] = mag;
    accelHead = (accelHead + 1) & 63;
    if (accelLen < 64) accelLen++;
  }

  function detectPeak(mag, now) {
    if (peakCooldown > 0) { peakCooldown--; return false; }
    var thresh = peakThreshold;
    if (lastMag > thresh && lastMag > lastLastMag && lastMag > mag) {
      peakCooldown = 8;
      return true;
    }
    return false;
  }

  // Record inter-peak intervals and derive tempo + confidence.
  // Outlier rejection: intervals that deviate > 70% from running average
  // are skipped — prevents tempo jumps from isolated motions.
  function recordPeakInterval(now) {
    if (lastPeakTime > 0) {
      var interval = now - lastPeakTime;
      if (interval > 150 && interval < 2000) {
        var skip = false;
        if (piLen >= 2) {
          var runSum = 0;
          for (var j = 0; j < piLen; j++) runSum += peakIntervals[j];
          var runAvg = runSum / piLen;
          if (Math.abs(interval - runAvg) / runAvg > 0.70) skip = true;
        }

        if (!skip) {
          peakIntervals[piHead] = interval;
          piHead = (piHead + 1) & 7;
          if (piLen < 8) piLen++;

          // Derive tempo (BPM) from average interval
          var sum = 0;
          for (var i = 0; i < piLen; i++) sum += peakIntervals[i];
          var avgInterval = sum / piLen;
          derivedTempo = 60000 / avgInterval;

          // Confidence from coefficient of variation
          // Low CV = steady tempo = high confidence
          var variance = 0;
          for (var vi = 0; vi < piLen; vi++) {
            var diff = peakIntervals[vi] - avgInterval;
            variance += diff * diff;
          }
          variance = Math.sqrt(variance / piLen);
          var cv = variance / avgInterval;
          var rawConf = Math.max(0, Math.min(1, 1 - cv * 2.5));
          var rate = rawConf > rhythmConfidence ? 0.25 : 0.06;
          rhythmConfidence += (rawConf - rhythmConfidence) * rate;
        }
      }
    }
    lastPeakTime = now;
    peakCount++;
  }

  // ── MOTION PROFILE (cross-session adaptation) ──────────────────────────
  // Moved from follow.js. Learns how THIS user moves across sessions.
  // Tracks average peak magnitude, still rate, archetype.
  // Session 1: 0% influence. Session 5: ~48%. Session 10+: 75%.
  // Adapts peak threshold to the user's body — responsive without false hits.

  var motionProfile = (function () {
    var KEY = 'm2_profile_v1';
    var data = { n: 0, peakMag: null, stillRate: null, archetype: null };
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) data = JSON.parse(raw);
    } catch (e) { /* ok */ }
    var sess = { peaks: [], stillMs: 0, totalMs: 0, t0: Date.now() };
    var saved = false;
    var handlersRegistered = false;

    function lerp(a, b, t) { return a + (b - a) * t; }
    function alpha() { return Math.max(0.08, 1 / Math.sqrt(data.n + 1)); }

    var api = {
      recordPeak: function (mag) { sess.peaks.push(mag); },

      tick: function (dtMs, silent) {
        sess.totalMs += dtMs;
        if (silent) sess.stillMs += dtMs;
      },

      // Returns adapted peak threshold calibrated to this user's body
      adaptThreshold: function (defaultThresh) {
        if (data.n < 2 || data.peakMag === null) return defaultThresh;
        var weight = Math.min(0.75, (data.n - 1) * 0.12);
        // Trigger at 65% of their observed peak — responsive without false hits
        var personalThresh = data.peakMag * 0.65;
        var adapted = lerp(defaultThresh, personalThresh, weight);
        return Math.max(0.12, Math.min(3.5, adapted));
      },

      // Full response adaptation (for downstream modules that need more)
      adapt: function (r) {
        if (!r || data.n < 2 || data.peakMag === null) return r;
        var weight = Math.min(0.75, (data.n - 1) * 0.12);
        var adapted = {};
        for (var k in r) adapted[k] = r[k];
        var personalThresh = data.peakMag * 0.65;
        adapted.peakThreshold = lerp(r.peakThreshold, personalThresh, weight);
        adapted.peakThreshold = Math.max(0.12, Math.min(3.5, adapted.peakThreshold));
        if (data.stillRate !== null && data.stillRate < 0.20) {
          adapted.stillnessThreshold = Math.min((r.stillnessThreshold || 0.2) * 1.5, 0.45);
        }
        return adapted;
      },

      endSession: function () {
        if (saved || sess.peaks.length < 3) return;
        saved = true;
        var avgPeak = sess.peaks.reduce(function (x, y) { return x + y; }, 0) / sess.peaks.length;
        var a = alpha();
        data.n++;
        data.peakMag   = data.peakMag === null ? avgPeak : lerp(data.peakMag, avgPeak, a);
        data.stillRate  = sess.stillMs / Math.max(1, sess.totalMs);
        var per60 = sess.peaks.length / (Math.max(1, sess.totalMs) / 60000);
        if      (per60 > 10 && data.peakMag > 1.8) data.archetype = 'surge';
        else if (per60 > 6  && data.peakMag > 1.2) data.archetype = 'pulse';
        else if (data.stillRate > 0.50)             data.archetype = 'meditator';
        else                                        data.archetype = 'flow';
        try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* ok */ }
      },

      registerHandlers: function () {
        if (handlersRegistered) return;
        handlersRegistered = true;
        document.addEventListener('visibilitychange', function () {
          if (document.hidden) api.endSession();
        });
        window.addEventListener('beforeunload', function () { api.endSession(); });
      },

      get sessions()  { return data.n; },
      get archetype() { return data.archetype || 'new'; },
      get peakMag()   { return data.peakMag !== null ? +data.peakMag.toFixed(2) : null; },
    };
    return api;
  })();

  // ── WATER DYNAMICS ─────────────────────────────────────────────────────
  // Half-full bottle held longways. Three regimes:
  //   Slow tilt  → water rises evenly (smooth)
  //   Fast tilt  → water stacks against wall (accumulates)
  //   Rapid oscillation → water crashes chaotically (turbulence)
  //
  // James's design principle: "Sensor smoothing should feel like water
  // sloshing in a half-full bottle. Momentum, overshoot, damping."
  //
  // Each instance gives: level (0-1), velocity, turbulence, stacked.
  // Use for pitch, filter, intensity — anything that should feel physical.

  function WaterDynamic(gravity, damping, wallBounce) {
    this.level = 0.5;
    this.velocity = 0;
    this.gravity = gravity || 2.0;
    this.damping = damping || 0.92;
    this.wallBounce = wallBounce || 0.3;
  }

  WaterDynamic.prototype.update = function (tilt, dt) {
    // Gravity pulls water in tilt direction
    this.velocity += tilt * this.gravity * dt;
    // Viscosity / friction — frame-rate independent
    this.velocity *= Math.pow(this.damping, dt * 60);
    // Move water
    this.level += this.velocity * dt;
    // Wall collisions — bounce/splash
    if (this.level > 1) {
      this.level = 1;
      this.velocity *= -this.wallBounce;
    } else if (this.level < 0) {
      this.level = 0;
      this.velocity *= -this.wallBounce;
    }
    return this.level;
  };

  WaterDynamic.prototype.turbulence = function () {
    return Math.abs(this.velocity);
  };

  WaterDynamic.prototype.stacked = function () {
    return this.level > 0.92 || this.level < 0.08;
  };

  WaterDynamic.prototype.reset = function () {
    this.level = 0.5;
    this.velocity = 0;
  };

  // ── 1/f NOISE — the signature of life ──────────────────────────────────
  // Pink noise in the timing domain. Heartbeats are 1/f. Neural firing
  // is 1/f. Great musical performances are 1/f (Hennig 2011).
  // The ear evolved to recognize 1/f as the signature of something alive.
  //
  // Voss-McCartney algorithm: sum of halved-rate random sources.
  // Used for micro-timing offsets on drum hits (10-30ms correlated
  // deviations from the grid). The difference between a drum machine
  // and a drummer.

  function PinkNoise() {
    this._sources = [0, 0, 0, 0, 0, 0, 0, 0];
    this._counter = 0;
  }

  PinkNoise.prototype.next = function () {
    this._counter++;
    var sum = 0;
    for (var i = 0; i < 8; i++) {
      // Source i updates every 2^i steps
      if ((this._counter & ((1 << i) - 1)) === 0) {
        this._sources[i] = Math.random() * 2 - 1;
      }
      sum += this._sources[i];
    }
    return sum / 8;  // normalize to roughly -1..1
  };

  // Get a micro-timing offset in milliseconds (1/f correlated)
  PinkNoise.prototype.timing = function (maxMs) {
    var ms = maxMs || 20;
    return this.next() * ms;
  };

  // ── EUCLIDEAN RHYTHM — mathematically guaranteed groove ────────────────
  // Bjorklund algorithm: distributes N hits across K steps as evenly as
  // possible. Produces the exact rhythms found across ALL human cultures
  // (Toussaint 2013). 3 in 8 = tresillo. 5 in 16 = West African bell.
  // 7 in 12 = West African standard pattern.
  // Map body energy to hit count → the math guarantees groove.

  function euclidean(hits, steps) {
    if (hits >= steps) {
      var full = [];
      for (var f = 0; f < steps; f++) full.push(1);
      return full;
    }
    if (hits === 0) {
      var empty = [];
      for (var e = 0; e < steps; e++) empty.push(0);
      return empty;
    }
    // Bjorklund algorithm
    var pattern = [];
    var counts = [];
    var remainders = [];
    var level = 0;
    remainders.push(hits);
    var divisor = steps - hits;
    while (true) {
      counts.push(Math.floor(divisor / remainders[level]));
      var rem = divisor % remainders[level];
      remainders.push(rem);
      divisor = remainders[level];
      level++;
      if (remainders[level] <= 1) break;
    }
    counts.push(divisor);

    function build(lv) {
      if (lv === -1) { pattern.push(0); return; }
      if (lv === -2) { pattern.push(1); return; }
      for (var i = 0; i < counts[lv]; i++) build(lv - 1);
      if (remainders[lv] !== 0) build(lv - 2);
    }
    build(level);

    // Rotate so first element is a hit
    var first1 = pattern.indexOf(1);
    if (first1 > 0) pattern = pattern.slice(first1).concat(pattern.slice(0, first1));
    return pattern;
  }

  // ── BERLYNE TRACKER — edge between order and chaos ─────────────────────
  // The inverted-U curve of aesthetic pleasure (Berlyne 1971).
  // Too simple = boring. Too complex = noise. The sweet spot is moderate
  // complexity with moderate surprise. Confirmed for music by
  // Cheung et al. 2019 and Witek et al. 2014.
  //
  // Tracks 4 dimensions of complexity independently. Each has its own
  // optimal zone (0.3-0.7 on 0-1 scale). Returns how far the music is
  // from the sweet spot overall.

  function BerlyneTracker() {
    this.dimensions = {
      harmonic: 0.5,    // how surprising the chord/note choices are
      rhythmic: 0.5,    // how syncopated/varied the rhythm is
      timbral: 0.5,     // how much the timbre is changing
      dynamic: 0.5,     // how much the volume varies
    };
    this._history = { harmonic: [], rhythmic: [], timbral: [], dynamic: [] };
    this._maxHistory = 30;  // ~15 seconds at 2 updates/sec
  }

  BerlyneTracker.prototype.update = function (dim, value) {
    if (!this.dimensions.hasOwnProperty(dim)) return;
    this.dimensions[dim] += (value - this.dimensions[dim]) * 0.15;
    this._history[dim].push(this.dimensions[dim]);
    if (this._history[dim].length > this._maxHistory) this._history[dim].shift();
  };

  // How far from the sweet spot (0.4-0.6) across all dimensions.
  // 0 = perfectly balanced. 1 = maximally imbalanced.
  BerlyneTracker.prototype.imbalance = function () {
    var total = 0, count = 0;
    for (var dim in this.dimensions) {
      var v = this.dimensions[dim];
      var dist = Math.abs(v - 0.5);
      total += Math.max(0, dist - 0.15) / 0.35;
      count++;
    }
    return count > 0 ? total / count : 0;
  };

  // Which dimension most needs adjustment and in which direction
  BerlyneTracker.prototype.suggest = function () {
    var worst = null, worstDist = 0;
    for (var dim in this.dimensions) {
      var dist = Math.abs(this.dimensions[dim] - 0.5);
      if (dist > worstDist) { worstDist = dist; worst = dim; }
    }
    if (!worst) return null;
    return {
      dimension: worst,
      value: this.dimensions[worst],
      direction: this.dimensions[worst] > 0.5 ? 'simplify' : 'complexify',
      urgency: worstDist,
    };
  };

  // ── GROK DETECTOR — when the user becomes a musician ───────────────────
  // Tracks the correlation between user input and musical output.
  // When correlation suddenly increases (phase transition), the user
  // has "grokked" the instrument — they understand the mapping.
  // Same neural pathway as any "aha" moment (Columbia Zuckerman Institute).
  // Phase transition concept from Power et al. 2022.
  // Dopamine two-phase: anticipation (caudate) + resolution (nucleus
  // accumbens) from Salimpoor et al. 2011.

  function GrokDetector() {
    this.inputHistory = [];
    this.outputHistory = [];
    this.correlation = 0;
    this.grokked = false;
    this.grokTime = 0;
    this.preGrokCorr = 0;
    this._windowSize = 20;
  }

  GrokDetector.prototype.sample = function (input, output) {
    this.inputHistory.push(input);
    this.outputHistory.push(output);
    if (this.inputHistory.length > this._windowSize) this.inputHistory.shift();
    if (this.outputHistory.length > this._windowSize) this.outputHistory.shift();

    if (this.inputHistory.length < 8) return;

    // Pearson correlation between input pattern and output pattern
    var n = this.inputHistory.length;
    var sumI = 0, sumO = 0, sumII = 0, sumOO = 0, sumIO = 0;
    for (var i = 0; i < n; i++) {
      sumI  += this.inputHistory[i];
      sumO  += this.outputHistory[i];
      sumII += this.inputHistory[i] * this.inputHistory[i];
      sumOO += this.outputHistory[i] * this.outputHistory[i];
      sumIO += this.inputHistory[i] * this.outputHistory[i];
    }
    var denom = Math.sqrt((n * sumII - sumI * sumI) * (n * sumOO - sumO * sumO));
    this.correlation = denom > 0 ? (n * sumIO - sumI * sumO) / denom : 0;

    // Detect phase transition: correlation jumps from <0.35 to >0.55
    if (!this.grokked && this.preGrokCorr < 0.35 && this.correlation > 0.55) {
      this.grokked = true;
      this.grokTime = performance.now();
    }
    this.preGrokCorr = this.preGrokCorr * 0.95 + this.correlation * 0.05;
  };

  GrokDetector.prototype.reset = function () {
    this.inputHistory = [];
    this.outputHistory = [];
    this.correlation = 0;
    this.grokked = false;
    this.grokTime = 0;
    this.preGrokCorr = 0;
  };

  // ── SPECTRUM — the body's harmonic series ──────────────────────────────
  // Walking has harmonics at f, 2f, 3f (Antonsson & Mann 1985).
  // Running emphasizes 2f. Dancing creates complex spectra.
  // This is real biomechanics — the body is an oscillator with overtones.
  //
  // Uses the Goertzel algorithm (more efficient than FFT for a small
  // number of target frequencies). Analyzes the medium buffer (233 samples
  // ~3.8s) which captures enough cycles of walking (1-2 Hz) to resolve
  // the fundamental and first several harmonics.
  //
  // Returns: { fundamental, harmonics[], power[], totalPower, crest }
  //   fundamental: estimated fundamental frequency (Hz)
  //   harmonics[]: frequency of each harmonic bin
  //   power[]: normalized power at each harmonic
  //   totalPower: sum of all harmonic power
  //   crest: ratio of peak harmonic to mean (peakiness of spectrum)

  var SPECTRUM_BINS = 12;           // f through 12f
  var SPECTRUM_SAMPLE_RATE = 60;    // assumed ~60 Hz sensor rate
  var spectrumResult = {
    fundamental: 0,
    harmonics: new Float32Array(SPECTRUM_BINS),
    power: new Float32Array(SPECTRUM_BINS),
    totalPower: 0,
    crest: 0,
  };
  var spectrumCooldown = 0;         // don't recompute every frame

  // Goertzel algorithm: computes DFT power at a single frequency.
  // O(N) per frequency, no complex arithmetic needed for power.
  // More efficient than FFT when you only need a few bins.
  function goertzelPower(samples, len, targetFreq, sampleRate) {
    if (len < 4) return 0;
    var k = Math.round(targetFreq * len / sampleRate);
    if (k < 1 || k >= len / 2) return 0;
    var w = 2 * Math.PI * k / len;
    var coeff = 2 * Math.cos(w);
    var s0 = 0, s1 = 0, s2 = 0;
    for (var i = 0; i < len; i++) {
      s0 = samples[i] + coeff * s1 - s2;
      s2 = s1;
      s1 = s0;
    }
    // Power = s1^2 + s2^2 - coeff * s1 * s2, normalized by N^2
    return (s1 * s1 + s2 * s2 - coeff * s1 * s2) / (len * len);
  }

  // Find fundamental by scanning the expected range of human motion
  // frequencies (0.5 Hz - 4 Hz: slow sway to fast bouncing)
  function estimateFundamental(samples, len, sampleRate) {
    if (len < 30) return 0;
    var bestFreq = 0, bestPower = 0;
    // Scan 0.5 to 4.0 Hz in 0.1 Hz steps
    for (var f = 0.5; f <= 4.0; f += 0.1) {
      var p = goertzelPower(samples, len, f, sampleRate);
      if (p > bestPower) {
        bestPower = p;
        bestFreq = f;
      }
    }
    // Refine around the peak in 0.02 Hz steps
    if (bestFreq > 0) {
      var lo = Math.max(0.3, bestFreq - 0.15);
      var hi = Math.min(4.5, bestFreq + 0.15);
      for (var fr = lo; fr <= hi; fr += 0.02) {
        var pr = goertzelPower(samples, len, fr, sampleRate);
        if (pr > bestPower) {
          bestPower = pr;
          bestFreq = fr;
        }
      }
    }
    return bestPower > 1e-6 ? bestFreq : 0;
  }

  function computeSpectrum() {
    spectrumCooldown = 15;  // recompute every ~250ms at 60fps

    var samples = med.toArray();
    var len = samples.length;
    if (len < 60) {
      spectrumResult.fundamental = 0;
      spectrumResult.totalPower = 0;
      spectrumResult.crest = 0;
      return spectrumResult;
    }

    // Remove DC offset
    var dcSum = 0;
    for (var d = 0; d < len; d++) dcSum += samples[d];
    var dc = dcSum / len;
    for (var r = 0; r < len; r++) samples[r] -= dc;

    var f0 = estimateFundamental(samples, len, SPECTRUM_SAMPLE_RATE);
    spectrumResult.fundamental = f0;

    if (f0 < 0.3) {
      // No clear fundamental — zero everything
      for (var z = 0; z < SPECTRUM_BINS; z++) {
        spectrumResult.harmonics[z] = 0;
        spectrumResult.power[z] = 0;
      }
      spectrumResult.totalPower = 0;
      spectrumResult.crest = 0;
      return spectrumResult;
    }

    // Measure power at each harmonic
    var maxPow = 0, totalPow = 0;
    for (var h = 0; h < SPECTRUM_BINS; h++) {
      var freq = f0 * (h + 1);
      spectrumResult.harmonics[h] = freq;
      var pow = goertzelPower(samples, len, freq, SPECTRUM_SAMPLE_RATE);
      spectrumResult.power[h] = pow;
      totalPow += pow;
      if (pow > maxPow) maxPow = pow;
    }

    // Normalize power to 0-1 range
    if (maxPow > 0) {
      for (var n = 0; n < SPECTRUM_BINS; n++) {
        spectrumResult.power[n] /= maxPow;
      }
    }

    spectrumResult.totalPower = totalPow;
    // Crest factor: how peaked the spectrum is (pure tone = high, noise = low)
    var meanPow = totalPow / SPECTRUM_BINS;
    spectrumResult.crest = meanPow > 0 ? maxPow / meanPow : 0;

    return spectrumResult;
  }

  // ── COUPLING — readiness for coupled oscillator interaction ────────────
  // For Outfits (P2P music pairing). Two people in proximity, their
  // rhythms drifting toward each other because that's what coupled
  // oscillators do (Huygens 1665).
  //
  // Mirror neurons create pre-device coupling — behavioral speed contagion
  // within 1 second (Watanabe 2007). Brains of co-performers synchronize
  // in theta band (Lindenberger et al. 2009).
  //
  // Reports three dimensions of coupling readiness:
  //   steadiness: how stable the motion is (low variance over medium window)
  //   rhythmicConfidence: how clearly rhythmic (from peak detection)
  //   energyLevel: how much energy is available for coupling
  //
  // These tell an Outfit partner: "this body is ready to sync at this
  // tempo with this much energy." The coupling function itself lives in
  // outfit.js — body.js only reports readiness.

  var couplingState = {
    steadiness: 0,
    rhythmicConfidence: 0,
    energyLevel: 0,
    naturalTempo: 0,     // this body's preferred BPM
    phase: 0,            // where in the current cycle (0-1)
  };

  function updateCoupling() {
    var mE = med.energy();
    var sE = short_.energy();
    var mVar = med.variance();

    // Steadiness: inverse of coefficient of variation over medium window.
    // A body moving steadily at any speed has high steadiness.
    // A body lurching between still and active has low steadiness.
    if (mE > 0.05) {
      var cv = Math.sqrt(mVar) / mE;
      couplingState.steadiness += (Math.max(0, 1 - cv) - couplingState.steadiness) * 0.08;
    } else {
      couplingState.steadiness *= 0.95;
    }

    // Rhythmic confidence directly from peak detection
    couplingState.rhythmicConfidence += (rhythmConfidence - couplingState.rhythmicConfidence) * 0.1;

    // Energy level: smoothed short energy, capped at 1
    var eNorm = Math.min(1, sE / 3);
    couplingState.energyLevel += (eNorm - couplingState.energyLevel) * 0.1;

    // Natural tempo from derived tempo (only valid when confidence > 0.3)
    if (rhythmConfidence > 0.3 && derivedTempo > 30 && derivedTempo < 200) {
      couplingState.naturalTempo += (derivedTempo - couplingState.naturalTempo) * 0.05;
    }

    // Phase: where in the current motion cycle.
    // Uses zero-crossings of acceleration to estimate phase.
    // A coupled oscillator needs to know where the other oscillator IS,
    // not just its frequency.
    if (derivedTempo > 30 && lastPeakTime > 0) {
      var periodMs = 60000 / derivedTempo;
      var elapsed = performance.now() - lastPeakTime;
      couplingState.phase = (elapsed % periodMs) / periodMs;
    }
  }

  // ── SESSION MEMORY ─────────────────────────────────────────────────────

  var sessionCount = 0;
  var isReturning = false;

  function loadMemory() {
    try {
      var s = localStorage.getItem('m2_body');
      if (s) {
        var d = JSON.parse(s);
        sessionCount = d.sessions || 0;
        isReturning = true;
      }
    } catch (e) { /* ok */ }
  }

  function saveMemory() {
    try {
      localStorage.setItem('m2_body', JSON.stringify({
        sessions: sessionCount + 1,
        totalMotion: totalMotion,
        lastPattern: motionPattern,
      }));
    } catch (e) { /* ok */ }
  }

  // ── MAIN PROCESS ───────────────────────────────────────────────────────

  var inited = false;
  var currentMag = 0;

  function init() {
    loadMemory();
    motionProfile.registerHandlers();
    inited = true;
    // Save every 30s
    setInterval(saveMemory, 30000);
  }

  /**
   * Call every frame with a SensorState from Sensor.read().
   * This is the body's single input — everything else is derived.
   */
  function process(s, timestamp) {
    if (!inited) init();

    // 1. Kalman filter — remove jitter, keep intent
    var fx = kx.update(s.gx);
    var fy = ky.update(s.gy);
    var fz = kz.update(s.gz);

    // 2. Subtract gravity — isolate linear acceleration
    subtractGravity(fx, fy, fz);

    // 2b. Touch velocity → motion (the screen IS the instrument)
    if (s.touching) {
      if (prevTouch.active) {
        lin.x += (s.tx - prevTouch.x) * 25;
        lin.y += (s.ty - prevTouch.y) * 25;
      }
      prevTouch.x = s.tx;
      prevTouch.y = s.ty;
      prevTouch.active = true;
    } else {
      prevTouch.active = false;
    }

    // 2c. Tilt rate → motion (works even without accelerometer)
    var dbeta  = s.beta  - lastOrient.beta;
    var dgamma = s.gamma - lastOrient.gamma;
    if (Math.abs(dbeta) < 10 && Math.abs(dgamma) < 10) {
      lin.x += dgamma * 0.15;
      lin.y += dbeta  * 0.15;
    }

    // 3. Magnitude
    var mag = Math.sqrt(lin.x * lin.x + lin.y * lin.y + lin.z * lin.z);
    currentMag = mag;

    // 4. Ring buffers — multi-scale temporal analysis
    micro.push(mag);
    short_.push(mag);
    med.push(mag);
    long_.push(mag);
    sX.push(lin.x);
    sY.push(lin.y);
    sZ.push(lin.z);

    // 5. Tilt amplitude tracking
    var db = Math.abs(s.beta  - lastOrient.beta);
    var dg = Math.abs(s.gamma - lastOrient.gamma);
    tiltAmp = tiltAmp * 0.9 + (db + dg) * 0.1;
    lastOrient.beta  = s.beta;
    lastOrient.gamma = s.gamma;

    // 6. Spiking neurons — pattern detection
    runNeurons(mag, timestamp);

    // 7. Void state machine — stillness tracking
    updateVoid(mag, timestamp);

    // 8. Pattern classification
    totalMotion += mag * 0.016;
    totalMotion *= 0.9997;  // slow decay flywheel
    classifyPattern();

    // 9. Peak detection
    pushAccel(mag);
    peakedThisFrame = false;
    peakMagnitude = 0;
    if (detectPeak(mag, timestamp)) {
      peakedThisFrame = true;
      peakMagnitude = lastMag;
      recordPeakInterval(timestamp);
      motionProfile.recordPeak(lastMag);
    }
    lastLastMag = lastMag;
    lastMag = mag;

    // 10. Archetype classification
    classifyArchetype();

    // 11. Spectrum — recompute periodically (not every frame)
    if (spectrumCooldown > 0) {
      spectrumCooldown--;
    } else {
      computeSpectrum();
    }

    // 12. Coupling readiness
    updateCoupling();

    // 13. Motion profile tick
    var isSilent = voidState.state >= VOID.SETTLING;
    motionProfile.tick(16, isSilent);

    // 14. Adapt peak threshold from motion profile
    peakThreshold = motionProfile.adaptThreshold(1.5);
  }

  // ── PUBLIC API ─────────────────────────────────────────────────────────
  // body.js reports. It never interprets. "Energy is 0.8" is a fact.
  // "Therefore play louder" is a choice that belongs downstream.

  return Object.freeze({
    init: init,
    process: process,
    on: on,

    // Filtered acceleration (gravity removed)
    get linearAccel() { return lin; },
    get magnitude() { return currentMag; },

    // Multi-scale energy (Fibonacci ring buffers)
    get energy() { return short_.energy(); },
    get micro() { return micro; },
    get short() { return short_; },
    get medium() { return med; },
    get long() { return long_; },

    // Orientation
    get tiltRate() { return tiltAmp; },

    // Pattern and archetype
    get pattern() { return motionPattern; },
    get archetype() { return archetype; },
    get archetypeConfidence() { return archetypeConfidence; },

    // Neurons
    get neurons() { return neurons; },

    // Peak detection
    get peaked() { return peakedThisFrame; },
    get peakMagnitude() { return peakMagnitude; },
    get peakIntervals() { return peakIntervals; },
    get bodyTempo() { return derivedTempo; },
    get rhythmConfidence() { return rhythmConfidence; },
    get peakCount() { return peakCount; },

    // Void state machine
    VOID: VOID,
    get voidState() { return voidState.state; },
    get voidDepth() { return voidState.depth; },
    get breathPhase() { return voidState.breathPhase; },
    get stillnessTime() { return voidState.timer; },

    // Session
    get totalMotion() { return totalMotion; },
    get isReturning() { return isReturning; },

    // Motion profile (cross-session)
    get motionProfile() {
      return {
        sessions: motionProfile.sessions,
        archetype: motionProfile.archetype,
        peakMag: motionProfile.peakMag,
        adapt: motionProfile.adapt,
      };
    },

    // Spectrum analysis (body's harmonic series)
    // Antonsson & Mann 1985: walking has harmonics at f, 2f, 3f
    spectrum: function () { return spectrumResult; },

    // Coupling readiness (for Outfits)
    // HKB model (Haken-Kelso-Bunz 1985): coupled oscillator dynamics
    coupling: function () { return couplingState; },

    // Constructors exposed for other modules
    WaterDynamic: WaterDynamic,
    PinkNoise: PinkNoise,
    euclidean: euclidean,
    BerlyneTracker: BerlyneTracker,
    GrokDetector: GrokDetector,
  });
})();
