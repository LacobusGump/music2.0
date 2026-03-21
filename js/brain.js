/**
 * BRAIN — Neuromorphic Motion Intelligence
 *
 * Raw sensor → Kalman filter → gravity subtract → ring buffers (Fibonacci sizes)
 * → 7 LIF spiking neurons → void state machine → motion pattern classification.
 *
 * Simple callback system replaces the old 575-line event bus.
 */

const Brain = (function () {
  'use strict';

  // ── CALLBACKS ────────────────────────────────────────────────────────

  const _cbs = { spike: [], void: [], pattern: [] };

  function on(event, fn) { if (_cbs[event]) _cbs[event].push(fn); }

  function _emit(event, data) {
    const list = _cbs[event];
    if (list) for (let i = 0; i < list.length; i++) list[i](data);
  }

  // ── KALMAN FILTER (1D, per axis) ─────────────────────────────────────

  const KALMAN_R = 0.5;
  const KALMAN_Q = 0.1;

  function kalman() {
    let x = 0, p = 1;
    return {
      update: function (z) {
        p += KALMAN_Q;
        const k = p / (p + KALMAN_R);
        x += k * (z - x);
        p *= (1 - k);
        return x;
      },
      reset: function () { x = 0; p = 1; }
    };
  }

  const kx = kalman(), ky = kalman(), kz = kalman();

  // ── GRAVITY ESTIMATION ───────────────────────────────────────────────

  const GRAVITY_ALPHA = 0.98;
  const grav = { x: 0, y: 0, z: 9.81 };
  const lin = { x: 0, y: 0, z: 0 };

  function subtractGravity(fx, fy, fz) {
    const a = GRAVITY_ALPHA;
    grav.x = a * grav.x + (1 - a) * fx;
    grav.y = a * grav.y + (1 - a) * fy;
    grav.z = a * grav.z + (1 - a) * fz;
    lin.x = fx - grav.x;
    lin.y = fy - grav.y;
    lin.z = fz - grav.z;
  }

  // ── RING BUFFER ──────────────────────────────────────────────────────

  function RingBuffer(size) {
    this.buf = new Float32Array(size);
    this.cap = size;
    this.head = 0;
    this.len = 0;
    this._sum = 0;
    this._sumSq = 0;
    this._peak = 0;

    // Zero-crossing
    this._lastSign = 0;
    this._zc = 0;
    this._zcBuf = new Float32Array(Math.min(size, 60));
    this._zcCap = this._zcBuf.length;
    this._zcHead = 0;
    this._zcLen = 0;
  }

  RingBuffer.prototype.push = function (v) {
    if (this.len >= this.cap) {
      const old = this.buf[this.head];
      this._sum -= old;
      this._sumSq -= old * old;
    }
    this.buf[this.head] = v;
    this._sum += v;
    this._sumSq += v * v;

    const abs = v < 0 ? -v : v;
    this._peak = abs > this._peak ? abs : this._peak * 0.995;

    // zero-crossings
    const sign = v > 0.01 ? 1 : (v < -0.01 ? -1 : 0);
    let crossed = 0;
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

  RingBuffer.prototype.mean = function () { return this.len > 0 ? this._sum / this.len : 0; };
  RingBuffer.prototype.variance = function () {
    if (this.len < 2) return 0;
    const m = this.mean();
    return Math.max(0, this._sumSq / this.len - m * m);
  };
  RingBuffer.prototype.energy = function () { return this.len > 0 ? Math.sqrt(this._sumSq / this.len) : 0; };
  RingBuffer.prototype.peak = function () { return this._peak; };
  RingBuffer.prototype.freqEstimate = function () {
    if (this._zcLen < 4) return 0;
    return this._zc / (2 * this._zcLen / 60);
  };

  // Fibonacci-sized buffers
  const micro  = new RingBuffer(5);
  const short_ = new RingBuffer(34);
  const med    = new RingBuffer(233);
  const long_  = new RingBuffer(1597);

  // Per-axis short buffers for cross-product (circle detection)
  const sX = new RingBuffer(34);
  const sY = new RingBuffer(34);
  const sZ = new RingBuffer(34);

  // ── LIF SPIKING NEURONS ──────────────────────────────────────────────

  function Neuron(name, leak, thresh, refr) {
    this.name = name;
    this.membrane = 0;
    this.leak = leak;
    this.thresh = thresh;
    this.refr = refr;
    this.refrLeft = 0;
    this.spikes = [];
    this.lastSpike = 0;
  }

  Neuron.prototype.integrate = function (input, t) {
    if (this.refrLeft > 0) { this.refrLeft--; this.membrane *= 0.5; return false; }
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

  Neuron.prototype.rate = function () {
    if (this.spikes.length < 2) return 0;
    const now = this.spikes[this.spikes.length - 1];
    let c = 0;
    for (let i = this.spikes.length - 1; i >= 0; i--) {
      if (this.spikes[i] >= now - 2000) c++; else break;
    }
    return c / 2;
  };

  const neurons = {
    stillness: new Neuron('stillness', 0.98, 0.5, 30),
    shake:     new Neuron('shake',     0.90, 1.2, 15),
    sweep:     new Neuron('sweep',     0.92, 0.8, 12),
    circle:    new Neuron('circle',    0.93, 1.0, 20),
    pendulum:  new Neuron('pendulum',  0.95, 1.0, 20),
    rock:      new Neuron('rock',      0.96, 0.7, 25),
    toss:      new Neuron('toss',      0.85, 1.5, 30),
  };

  let prevVec = { x: 0, y: 0, z: 0 };
  let tiltAmp = 0;
  let lastOrient = { beta: 0, gamma: 0 };
  let prevTouch = { x: 0.5, y: 0.5, active: false };

  const DEADZONE = 0.15;

  function runNeurons(mag, t) {
    const freq = short_.freqEstimate();
    const sMean = short_.mean();
    const sVar = short_.variance();
    const sE = short_.energy();
    const mE = med.energy();

    const inputs = {
      stillness: 1 - Math.min(1, sE / DEADZONE),
      shake: sVar * freq * 0.3,
      sweep: Math.abs(sMean) > 0.01 ? Math.abs(sMean) * (1 - Math.min(1, sVar / (Math.abs(sMean) + 0.001))) : 0,
      circle: (function () {
        const cx = prevVec.y * lin.z - prevVec.z * lin.y;
        const cy = prevVec.z * lin.x - prevVec.x * lin.z;
        const cz = prevVec.x * lin.y - prevVec.y * lin.x;
        return Math.sqrt(cx * cx + cy * cy + cz * cz) * 0.5;
      })(),
      pendulum: sE * (freq > 0.3 && freq < 3 ? 1 : 0.2) * 0.5,
      rock: tiltAmp * (mE < 0.5 ? 1 : 0) * 1.5,
      toss: micro.peak() > 3 && sMean < 0.5 ? 2.0 : 0,
    };

    for (const name in neurons) {
      if (neurons[name].integrate(inputs[name], t)) {
        _emit('spike', { neuron: name, rate: neurons[name].rate(), energy: sE, magnitude: mag, timestamp: t });
      }
    }

    prevVec.x = lin.x; prevVec.y = lin.y; prevVec.z = lin.z;
  }

  // ── VOID STATE MACHINE ───────────────────────────────────────────────

  const VOID = { PRESENT: 0, SETTLING: 1, VOID: 2, TRANSCENDENT: 3 };
  const VOID_TIMES = { settle: 2, deep: 5, transcend: 15 };

  const voidState = {
    state: VOID.PRESENT,
    timer: 0,
    depth: 0,
    breathPhase: 0,
    breathRate: 0.15,
    lastT: 0,
  };

  function updateVoid(mag, t) {
    const dt = voidState.lastT > 0 ? (t - voidState.lastT) / 1000 : 0.016;
    voidState.lastT = t;

    if (mag < DEADZONE) {
      voidState.timer += dt;
    } else {
      voidState.timer *= 0.5;
    }
    voidState.timer = Math.max(0, Math.min(60, voidState.timer));

    const s = voidState.timer;
    let ns = VOID.PRESENT, td = 0;

    if (s >= VOID_TIMES.transcend) {
      ns = VOID.TRANSCENDENT; td = 1;
    } else if (s >= VOID_TIMES.deep) {
      ns = VOID.VOID;
      td = 0.5 + 0.5 * (s - VOID_TIMES.deep) / (VOID_TIMES.transcend - VOID_TIMES.deep);
    } else if (s >= VOID_TIMES.settle) {
      ns = VOID.SETTLING;
      td = 0.5 * (s - VOID_TIMES.settle) / (VOID_TIMES.deep - VOID_TIMES.settle);
    }

    voidState.depth += (td - voidState.depth) * 0.05;

    if (ns !== voidState.state) {
      const prev = voidState.state;
      voidState.state = ns;
      _emit('void', { state: ns, prev: prev, depth: voidState.depth, stillness: s });
    }

    voidState.breathPhase = (voidState.breathPhase + dt * voidState.breathRate * Math.PI * 2) % (Math.PI * 2);
  }

  // ── MOTION PATTERN ───────────────────────────────────────────────────

  let motionPattern = 'still';
  let totalMotion = 0;
  let lastPatternEmit = '';

  function classifyPattern() {
    const e = short_.energy();
    const v = short_.variance();
    let p;
    if (e < DEADZONE) p = 'still';
    else if (e < 0.5) p = 'gentle';
    else if (v < 1.0) p = 'rhythmic';
    else if (e < 2.0) p = 'vigorous';
    else p = 'chaotic';

    if (p !== motionPattern) {
      motionPattern = p;
      if (p !== lastPatternEmit) {
        _emit('pattern', { pattern: p, energy: e });
        lastPatternEmit = p;
      }
    }
  }

  // ── SESSION MEMORY ───────────────────────────────────────────────────

  let sessionCount = 0;
  let isReturning = false;

  function loadMemory() {
    try {
      const s = localStorage.getItem('m2_brain');
      if (s) {
        const d = JSON.parse(s);
        sessionCount = d.sessions || 0;
        isReturning = true;
      }
    } catch (e) { /* ok */ }
  }

  function saveMemory() {
    try {
      localStorage.setItem('m2_brain', JSON.stringify({
        sessions: sessionCount + 1,
        totalMotion: totalMotion,
        lastPattern: motionPattern,
      }));
    } catch (e) { /* ok */ }
  }

  // ── MAIN PROCESS ─────────────────────────────────────────────────────

  let inited = false;

  function init() {
    loadMemory();
    inited = true;
    // Save every 30s
    setInterval(saveMemory, 30000);
  }

  /**
   * Call every frame with a SensorState from Sensor.read().
   */
  function process(s, timestamp) {
    if (!inited) init();

    // 1. Kalman filter
    const fx = kx.update(s.gx);
    const fy = ky.update(s.gy);
    const fz = kz.update(s.gz);

    // 2. Subtract gravity
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
    var dbeta = s.beta - lastOrient.beta;
    var dgamma = s.gamma - lastOrient.gamma;
    if (Math.abs(dbeta) < 10 && Math.abs(dgamma) < 10) {
      lin.x += dgamma * 0.15;
      lin.y += dbeta * 0.15;
    }

    // 3. Magnitude
    const mag = Math.sqrt(lin.x * lin.x + lin.y * lin.y + lin.z * lin.z);

    // 4. Buffers
    micro.push(mag);
    short_.push(mag);
    med.push(mag);
    long_.push(mag);
    sX.push(lin.x);
    sY.push(lin.y);
    sZ.push(lin.z);

    // 5. Tilt amplitude
    const db = Math.abs(s.beta - lastOrient.beta);
    const dg = Math.abs(s.gamma - lastOrient.gamma);
    tiltAmp = tiltAmp * 0.9 + (db + dg) * 0.1;
    lastOrient.beta = s.beta;
    lastOrient.gamma = s.gamma;

    // 6. Neurons
    runNeurons(mag, timestamp);

    // 7. Void
    updateVoid(mag, timestamp);

    // 8. Pattern + totalMotion flywheel
    totalMotion += mag * 0.016;
    totalMotion *= 0.9997; // slow decay
    classifyPattern();
  }

  // ── WATER DYNAMICS ───────────────────────────────────────────────────
  // Half-full bottle held longways. Three regimes:
  //   Slow tilt → water rises evenly (smooth)
  //   Fast tilt → water stacks against wall (accumulates)
  //   Rapid oscillation → water crashes chaotically (turbulence)
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
    // Viscosity / friction
    this.velocity *= Math.pow(this.damping, dt * 60);  // frame-rate independent
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

  // ── 1/f NOISE — the signature of life ────────────────────────────────
  // Pink noise in the timing domain. Heartbeats are 1/f. Neural firing
  // is 1/f. Great musical performances are 1/f (Hennig 2011).
  // The ear evolved to recognize 1/f as the signature of something alive.
  //
  // Used for micro-timing offsets on drum hits (10-30ms correlated
  // deviations from the grid). The difference between a drum machine
  // and a drummer.

  function PinkNoise() {
    // Voss-McCartney algorithm: sum of halved-rate random sources
    this._sources = [0, 0, 0, 0, 0, 0, 0, 0];
    this._counter = 0;
  }

  PinkNoise.prototype.next = function () {
    this._counter++;
    // Update each source at halved rates: source 0 every step,
    // source 1 every 2 steps, source 2 every 4 steps, etc.
    var sum = 0;
    for (var i = 0; i < 8; i++) {
      if ((this._counter & ((1 << i) - 1)) === 0) {
        this._sources[i] = Math.random() * 2 - 1;
      }
      sum += this._sources[i];
    }
    return sum / 8;  // normalize to roughly -1..1
  };

  // Get a micro-timing offset in milliseconds (10-30ms range, 1/f correlated)
  PinkNoise.prototype.timing = function (maxMs) {
    var ms = maxMs || 20;
    return this.next() * ms;
  };

  // ── PUBLIC ───────────────────────────────────────────────────────────

  return Object.freeze({
    init: init,
    process: process,
    on: on,

    get neurons() { return neurons; },
    get micro() { return micro; },
    get short() { return short_; },
    get medium() { return med; },
    get long() { return long_; },

    VOID: VOID,
    get voidState() { return voidState.state; },
    get voidDepth() { return voidState.depth; },
    get breathPhase() { return voidState.breathPhase; },
    get stillnessTime() { return voidState.timer; },

    get pattern() { return motionPattern; },
    get totalMotion() { return totalMotion; },
    get linearAccel() { return lin; },
    get isReturning() { return isReturning; },
    get energy() { return short_.energy(); },
    WaterDynamic: WaterDynamic,
    PinkNoise: PinkNoise,
  });
})();
