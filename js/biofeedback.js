/**
 * BIOFEEDBACK — Body coupling measurement from phone sensors.
 *
 * Extracts physiological oscillations from accelerometer/gyroscope:
 *   - Breathing rate (~0.25 Hz from chest/pocket movement)
 *   - Movement cadence (walking rhythm from acceleration peaks)
 *   - Postural stability (sway frequency)
 *
 * Computes coupling metrics:
 *   - Breath:Movement ratio (consonance with activity)
 *   - Coupling strength K (regularity of oscillation)
 *   - Synchronization R (phase coherence between channels)
 *
 * Feeds back to audio engine:
 *   - Adjusts tempo toward consonant ratios (4:1 Heart:Breath)
 *   - Modulates depth based on coupling strength
 *   - Entrains toward the Fiedler bridge (Breath↔Heart)
 *
 * Evidence: Bernardi 2006 (Circulation), Thaut 1996 (Movement Disorders)
 *
 * Usage:
 *   const bio = new Biofeedback();
 *   bio.start();
 *   // In render loop:
 *   const state = bio.measure();
 *   // state.breathRate, state.movementRate, state.consonance, state.K, state.R
 */

const PHI = (1 + Math.sqrt(5)) / 2;
const INV_PHI = 1 / PHI;

class Biofeedback {
  constructor(options = {}) {
    this.sampleRate = options.sampleRate || 60; // Hz (DeviceMotion rate)
    this.windowSec = options.windowSec || 15;   // seconds of history
    this.bufferSize = this.sampleRate * this.windowSec;

    // Circular buffers for accelerometer channels
    this.accelX = new Float32Array(this.bufferSize);
    this.accelY = new Float32Array(this.bufferSize);
    this.accelZ = new Float32Array(this.bufferSize);
    this.magnitude = new Float32Array(this.bufferSize);
    this.writeIdx = 0;
    this.sampleCount = 0;

    // Extracted oscillations
    this.breathRate = 0.25;    // Hz (default 15 breaths/min)
    this.movementRate = 0;     // Hz (walking cadence)
    this.breathAmplitude = 0;
    this.movementAmplitude = 0;

    // Coupling metrics
    this.K = 0;        // coupling strength (regularity)
    this.R = 0;        // synchronization (phase coherence)
    this.consonance = 0; // how close to integer ratio

    // Target for entrainment
    this.targetRatio = 4.0; // Heart:Breath = 4:1
    this.suggestedBPM = 60; // current entrainment target

    // Smoothing
    this._breathSmooth = 0.25;
    this._moveSmooth = 0;
    this._kSmooth = 0;
    this._rSmooth = 0;

    this.active = false;
  }

  start() {
    if (this.active) return;
    this.active = true;

    if (window.DeviceMotionEvent) {
      // Request permission on iOS 13+
      if (typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission().then(response => {
          if (response === 'granted') {
            window.addEventListener('devicemotion', e => this._onMotion(e));
          }
        });
      } else {
        window.addEventListener('devicemotion', e => this._onMotion(e));
      }
    }
  }

  stop() {
    this.active = false;
    window.removeEventListener('devicemotion', e => this._onMotion(e));
  }

  _onMotion(event) {
    if (!this.active) return;

    const acc = event.accelerationIncludingGravity;
    if (!acc) return;

    const x = acc.x || 0;
    const y = acc.y || 0;
    const z = acc.z || 0;
    const mag = Math.sqrt(x*x + y*y + z*z);

    const i = this.writeIdx % this.bufferSize;
    this.accelX[i] = x;
    this.accelY[i] = y;
    this.accelZ[i] = z;
    this.magnitude[i] = mag;
    this.writeIdx++;
    this.sampleCount++;
  }

  /**
   * Measure current body state. Call this in the render loop (~1/sec is fine).
   * Returns: { breathRate, movementRate, consonance, K, R, suggestedBPM }
   */
  measure() {
    if (this.sampleCount < this.sampleRate * 5) {
      // Need at least 5 seconds of data
      return {
        breathRate: this.breathRate,
        movementRate: 0,
        consonance: 0,
        K: 0, R: 0,
        suggestedBPM: 60,
        ready: false,
      };
    }

    // Get the last windowSec of data
    const n = Math.min(this.sampleCount, this.bufferSize);
    const data = new Float32Array(n);
    for (let j = 0; j < n; j++) {
      data[j] = this.magnitude[(this.writeIdx - n + j + this.bufferSize) % this.bufferSize];
    }

    // === EXTRACT BREATHING RATE ===
    // Breathing shows up as 0.1-0.5 Hz oscillation in acceleration magnitude
    // Use autocorrelation to find the dominant low-frequency period
    const breathBand = this._bandpassAutocorr(data, 0.1, 0.5, this.sampleRate);
    if (breathBand.freq > 0) {
      this._breathSmooth = this._breathSmooth * 0.9 + breathBand.freq * 0.1;
      this.breathRate = this._breathSmooth;
      this.breathAmplitude = breathBand.amplitude;
    }

    // === EXTRACT MOVEMENT RATE ===
    // Walking cadence shows up as 1.5-3.0 Hz
    const moveBand = this._bandpassAutocorr(data, 1.0, 3.5, this.sampleRate);
    if (moveBand.freq > 0) {
      this._moveSmooth = this._moveSmooth * 0.85 + moveBand.freq * 0.15;
      this.movementRate = this._moveSmooth;
      this.movementAmplitude = moveBand.amplitude;
    }

    // === COMPUTE COUPLING K ===
    // K = regularity of the dominant oscillation
    // High K = consistent rhythm, Low K = erratic
    const breathK = breathBand.amplitude > 0.01 ? breathBand.confidence : 0;
    const moveK = moveBand.amplitude > 0.05 ? moveBand.confidence : 0;
    this._kSmooth = this._kSmooth * 0.9 + Math.max(breathK, moveK) * 0.1;
    this.K = this._kSmooth;

    // === COMPUTE CONSONANCE ===
    // How close is movement:breath to an integer ratio?
    if (this.movementRate > 0.5 && this.breathRate > 0.05) {
      const ratio = this.movementRate / this.breathRate;
      // Find nearest simple integer ratio
      let bestErr = 999;
      for (let a = 1; a <= 12; a++) {
        for (let b = 1; b <= 4; b++) {
          const err = Math.abs(ratio - a/b) / (a/b);
          if (err < bestErr) bestErr = err;
        }
      }
      this.consonance = Math.max(0, 1 - bestErr * 5); // 0=dissonant, 1=perfect consonance
    }

    // === COMPUTE R (phase coherence) ===
    // R = how phase-locked the breathing is to movement
    // Use cross-correlation peak strength
    if (this.breathAmplitude > 0.01 && this.movementAmplitude > 0.05) {
      // Simplified: R from regularity of the breathing signal
      this._rSmooth = this._rSmooth * 0.9 + breathBand.confidence * 0.1;
      this.R = this._rSmooth;
    }

    // === SUGGESTED BPM FOR ENTRAINMENT ===
    // Target: music tempo that guides toward 4:1 Heart:Breath
    // Assume heart rate ≈ walking cadence (cardiac-locomotor coupling)
    // or use resting baseline of 60-72 bpm
    const estimatedHR = this.movementRate > 1.0 ?
      this.movementRate * 60 : // walking → HR estimate
      66; // resting default

    // Target breath rate for 4:1 consonance
    const targetBreath = estimatedHR / 60 / this.targetRatio; // Hz
    const targetBPM = targetBreath * 60 * this.targetRatio; // music BPM to entrain heart

    // Smooth toward target
    this.suggestedBPM = Math.round(
      Math.max(50, Math.min(140, targetBPM))
    );

    return {
      breathRate: Math.round(this.breathRate * 600) / 10, // breaths per minute
      movementRate: Math.round(this.movementRate * 100) / 100,
      consonance: Math.round(this.consonance * 100) / 100,
      K: Math.round(this.K * 1000) / 1000,
      R: Math.round(this.R * 1000) / 1000,
      suggestedBPM: this.suggestedBPM,
      ready: true,
      breathAmplitude: this.breathAmplitude,
      movementAmplitude: this.movementAmplitude,
    };
  }

  /**
   * Bandpass autocorrelation — find dominant frequency in a band.
   * Returns: { freq, amplitude, confidence }
   */
  _bandpassAutocorr(data, fLow, fHigh, sr) {
    const n = data.length;
    if (n < sr * 3) return { freq: 0, amplitude: 0, confidence: 0 };

    // Mean-subtract
    let mean = 0;
    for (let i = 0; i < n; i++) mean += data[i];
    mean /= n;

    const centered = new Float32Array(n);
    for (let i = 0; i < n; i++) centered[i] = data[i] - mean;

    // Autocorrelation in the lag range corresponding to fLow-fHigh
    const lagMin = Math.floor(sr / fHigh);
    const lagMax = Math.ceil(sr / fLow);

    let bestCorr = -1;
    let bestLag = lagMin;
    let energy = 0;

    // Signal energy
    for (let i = 0; i < n; i++) energy += centered[i] * centered[i];
    if (energy < 1e-6) return { freq: 0, amplitude: 0, confidence: 0 };

    for (let lag = lagMin; lag <= Math.min(lagMax, n/2); lag++) {
      let corr = 0;
      for (let i = 0; i < n - lag; i++) {
        corr += centered[i] * centered[i + lag];
      }
      corr /= energy;

      if (corr > bestCorr) {
        bestCorr = corr;
        bestLag = lag;
      }
    }

    const freq = bestCorr > 0.1 ? sr / bestLag : 0;
    const amplitude = Math.sqrt(energy / n);
    const confidence = Math.max(0, bestCorr); // 0-1, how periodic

    return { freq, amplitude, confidence };
  }

  /**
   * Get a display-friendly status string.
   */
  status() {
    const s = this.measure();
    if (!s.ready) return 'Calibrating... (hold phone steady)';

    const breathBPM = Math.round(s.breathRate);
    const consonanceBar = '█'.repeat(Math.round(s.consonance * 10));
    const kBar = '█'.repeat(Math.round(s.K * 10));

    return `Breath: ${breathBPM}/min | Move: ${s.movementRate.toFixed(1)} Hz | ` +
           `Consonance: ${consonanceBar} | K: ${kBar} | ` +
           `Target: ${s.suggestedBPM} BPM`;
  }
}

// Export for use in GUMP instrument
if (typeof module !== 'undefined') module.exports = Biofeedback;
if (typeof window !== 'undefined') window.Biofeedback = Biofeedback;
