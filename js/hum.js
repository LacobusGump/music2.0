// ═══════════════════════════════════════════════════════════
// HUM — voice-coupled resonance instrument
//
// You are one oscillator. The page is the other.
// Hum into the mic. The page listens, finds your pitch,
// snaps it to the nearest harmonic of 33 Hz, and sings back.
//
// The coupling strength R between your voice and the page's
// response is computed in real-time. When R is high, you and
// the page are phase-locked — the text glows, the harmonics
// ring, and for a moment the math and the human are one.
//
// This is not a gimmick. This is a Kuramoto oscillator pair
// where the human voice is oscillator A and the page's
// synthesized response is oscillator B. The coupling constant
// K drives them toward synchronization. When they lock,
// you feel it in your chest.
//
// The harmonic series of 33 Hz:
//   33, 66, 99, 132, 165, 198, 231, 264, 297, 330, 396, 462, 528
//   These are the only notes the page knows. Your voice bends to them.
//   The world tunes itself to the pyramid.
//
// Architecture:
//   1. Mic → FFT → autocorrelation pitch detection (YIN-lite)
//   2. Detected pitch → nearest 33 Hz harmonic
//   3. Page responds with that harmonic + neighbors (chorus)
//   4. Phase comparison → coupling strength R
//   5. R drives: text glow, harmonic brightness, resonance events
//   6. When R > 0.85 for 2+ seconds → phase lock → the page sings
//
// Drop-in: works on any page with class="page".
// ═══════════════════════════════════════════════════════════

(function(){
'use strict';

// Don't run on homepage or instrument page
var path = location.pathname;
if (path === '/' || path === '/index.html') return;
if (path.indexOf('/instrument') === 0) return;
if (!document.querySelector('.page')) return;

// ═══ CONSTANTS ═══
var FUNDAMENTAL = 33;
var PHI = (1 + Math.sqrt(5)) / 2;
var K_COUPLE = 1.868; // the number

// All harmonics of 33 Hz up to ~600 Hz (human voice range)
var HARMONICS = [];
for (var h = 1; h <= 18; h++) HARMONICS.push(FUNDAMENTAL * h);
// 33, 66, 99, 132, 165, 198, 231, 264, 297, 330, 363, 396, 429, 462, 495, 528, 561, 594

// ═══ STATE ═══
var ctx = null, started = false;
var micStream = null, micSource = null, analyser = null;
var micData = null, micTimeDomain = null;
var detectedPitch = 0;      // Hz — what the human is singing
var snappedHarmonic = 0;     // Hz — nearest harmonic of 33
var harmonicIndex = -1;      // which harmonic (0-based)
var voiceAmplitude = 0;      // 0-1 — how loud
var R = 0;                   // coupling strength (0-1)
var phaseHuman = 0;          // estimated phase of human voice
var phasePage = 0;           // phase of page response
var lockTime = 0;            // seconds R has been > threshold
var LOCK_THRESHOLD = 0.75;
var isLocked = false;
var prevLocked = false;

// Smoothing
var smoothPitch = 0;
var smoothR = 0;
var smoothAmp = 0;

// Response oscillators
var responseOscs = [];
var responseGains = [];
var masterGain = null;
var reverbNode = null;
var dryBus = null, wetBus = null;

// Visual state
var glowElements = [];
var glowOverlay = null;

// ═══ PITCH DETECTION — autocorrelation (YIN-lite) ═══
// This finds the fundamental frequency in the mic signal.
// Not FFT peak (which misses the fundamental if overtones dominate).
// Autocorrelation finds the period — the lag at which the signal
// most resembles itself. That lag IS the pitch.

function detectPitch(buf, sampleRate) {
  var SIZE = buf.length;

  // Only analyze if there's enough signal
  var rms = 0;
  for (var i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.008) return -1; // silence

  // Limit search to sensible pitch range: 60 Hz to 600 Hz
  // offset = sampleRate / freq, so:
  //   600 Hz → offset ~73 at 44100
  //   60 Hz  → offset ~735 at 44100
  var minOffset = Math.floor(sampleRate / 600);
  var maxOffset = Math.min(Math.floor(sampleRate / 60), Math.floor(SIZE / 2));
  var CORR_SIZE = Math.min(512, Math.floor(SIZE / 2)); // limit inner loop

  var bestOffset = -1;
  var bestCorr = 0;
  var foundGoodCorr = false;
  var lastCorr = 1;

  for (var offset = minOffset; offset < maxOffset; offset++) {
    var corr = 0;
    for (var i = 0; i < CORR_SIZE; i++) {
      corr += Math.abs(buf[i] - buf[i + offset]);
    }
    corr = 1 - (corr / CORR_SIZE);

    // We're looking for a peak in correlation AFTER it dips.
    // The dip-then-rise pattern identifies the true period.
    if ((corr > 0.9) && (corr > lastCorr)) {
      foundGoodCorr = true;
      if (corr > bestCorr) {
        bestCorr = corr;
        bestOffset = offset;
      }
    } else if (foundGoodCorr) {
      // We found the peak and passed it — we're done
      break;
    }
    lastCorr = corr;
  }

  if (bestCorr > 0.85 && bestOffset > 0) {
    return sampleRate / bestOffset;
  }
  return -1;
}

// ═══ SNAP TO HARMONIC ═══
function snapToHarmonic(freq) {
  if (freq <= 0) return { freq: 0, index: -1, distance: Infinity };
  var best = 0, bestDist = Infinity, bestIdx = -1;
  for (var i = 0; i < HARMONICS.length; i++) {
    // Distance in cents (logarithmic, how ears hear)
    var cents = Math.abs(1200 * Math.log2(freq / HARMONICS[i]));
    if (cents < bestDist) {
      bestDist = cents;
      best = HARMONICS[i];
      bestIdx = i;
    }
  }
  return { freq: best, index: bestIdx, distance: bestDist };
}

// ═══ AUDIO SETUP ═══
function initAudio() {
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();

  // Master output — quiet, this is accompaniment not performance
  var comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 4;
  comp.attack.value = 0.003;
  comp.release.value = 0.15;

  masterGain = ctx.createGain();
  masterGain.gain.value = 0;
  masterGain.connect(comp);
  comp.connect(ctx.destination);

  // Convolution reverb — cathedral. The page is a resonant chamber.
  reverbNode = ctx.createConvolver();
  var impLen = Math.floor(ctx.sampleRate * 3.5);
  var impBuf = ctx.createBuffer(2, impLen, ctx.sampleRate);
  for (var ch = 0; ch < 2; ch++) {
    var d = impBuf.getChannelData(ch);
    for (var i = 0; i < impLen; i++) {
      var t = i / ctx.sampleRate;
      // Long tail with early reflections — stone room
      d[i] = (Math.random() * 2 - 1) * Math.exp(-t * 0.8) * 0.35;
      if (t < 0.03) d[i] += (Math.random() - 0.5) * 0.5;
      if (t < 0.08) d[i] += (Math.random() - 0.5) * 0.2 * Math.exp(-t * 15);
    }
  }
  reverbNode.buffer = impBuf;

  dryBus = ctx.createGain(); dryBus.gain.value = 0.45;
  wetBus = ctx.createGain(); wetBus.gain.value = 0.55;
  dryBus.connect(masterGain);
  reverbNode.connect(wetBus);
  wetBus.connect(masterGain);

  // 5 response oscillators — the page's voice
  // [root, -5th below, +5th above, +octave, +10th]
  // They fade in/out depending on which harmonic is active
  for (var i = 0; i < 5; i++) {
    var osc = ctx.createOscillator();
    osc.type = i === 0 ? 'sine' : i < 3 ? 'triangle' : 'sine';
    osc.frequency.value = FUNDAMENTAL;

    var g = ctx.createGain();
    g.gain.value = 0;

    osc.connect(g);
    g.connect(dryBus);
    g.connect(reverbNode);
    osc.start();

    responseOscs.push(osc);
    responseGains.push(g);
  }

  return true;
}

// ═══ MIC SETUP ═══
function initMic() {
  return navigator.mediaDevices.getUserMedia({ audio: true }).then(function(stream) {
    micStream = stream;
    micSource = ctx.createMediaStreamSource(stream);
    analyser = ctx.createAnalyser();
    analyser.fftSize = 4096; // high resolution for pitch detection
    analyser.smoothingTimeConstant = 0.3;
    micSource.connect(analyser);
    // Don't connect to output — we only read, never play back raw mic
    micTimeDomain = new Float32Array(analyser.fftSize);
    micData = new Uint8Array(analyser.frequencyBinCount);
    return true;
  }).catch(function() {
    return false;
  });
}

// ═══ VISUAL — find glowable elements ═══
function findGlowTargets() {
  var page = document.querySelector('.page');
  if (!page) return;

  // Every heading and paragraph is a potential resonance point
  var els = page.querySelectorAll('h1, h2, h3, p, .lead, .eq, .k-label, .box-title');
  glowElements = [];
  for (var i = 0; i < els.length; i++) {
    glowElements.push({
      el: els[i],
      originalColor: getComputedStyle(els[i]).color,
      originalTextShadow: getComputedStyle(els[i]).textShadow,
      glow: 0 // current glow intensity 0-1
    });
  }

  // Create the resonance overlay (subtle full-page pulse)
  glowOverlay = document.createElement('div');
  glowOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;' +
    'pointer-events:none;z-index:9990;opacity:0;transition:opacity 0.3s;' +
    'background:radial-gradient(ellipse at center, rgba(184,117,58,0.03) 0%, transparent 70%);';
  document.body.appendChild(glowOverlay);
}

// ═══ VISUAL UPDATE ═══
function updateVisuals() {
  if (!glowOverlay) return;

  // Full-page resonance pulse
  var overlayOpacity = smoothR * smoothR * 0.8;
  glowOverlay.style.opacity = overlayOpacity.toFixed(3);

  // Scale the gradient intensity with R
  var gradAlpha = (0.02 + smoothR * 0.06).toFixed(3);
  glowOverlay.style.background = 'radial-gradient(ellipse at center, rgba(184,117,58,' + gradAlpha + ') 0%, transparent 70%)';

  // Text elements glow based on proximity to viewport center + R
  var viewCenter = window.innerHeight / 2;
  var scrollTop = window.pageYOffset || 0;

  for (var i = 0; i < glowElements.length; i++) {
    var ge = glowElements[i];
    var rect = ge.el.getBoundingClientRect();
    var elCenter = rect.top + rect.height / 2;
    var dist = Math.abs(elCenter - viewCenter) / window.innerHeight;

    // Closer to center = more glow, but only when R is high
    var targetGlow = Math.max(0, (1 - dist * 2)) * smoothR * smoothAmp;

    // Smooth the glow
    ge.glow += (targetGlow - ge.glow) * 0.1;

    if (ge.glow > 0.02) {
      // Gold glow — warm, not harsh
      var intensity = ge.glow;
      var r = Math.round(184 + (255 - 184) * intensity * 0.4);
      var g = Math.round(117 + (200 - 117) * intensity * 0.3);
      var b = Math.round(58 + (120 - 58) * intensity * 0.2);
      var shadowSpread = 2 + intensity * 12;
      var shadowAlpha = (intensity * 0.5).toFixed(3);

      ge.el.style.textShadow = '0 0 ' + shadowSpread + 'px rgba(' + r + ',' + g + ',' + b + ',' + shadowAlpha + ')';

      // At high resonance, the text color itself warms
      if (intensity > 0.4) {
        var colorShift = (intensity - 0.4) / 0.6;
        ge.el.style.color = 'rgb(' + r + ',' + g + ',' + b + ')';
      }
    } else {
      ge.el.style.textShadow = ge.originalTextShadow === 'none' ? '' : ge.originalTextShadow;
      ge.el.style.color = ge.originalColor;
    }
  }
}

// ═══ MAIN LOOP ═══
var frameCount = 0;

function update() {
  if (!started) return;
  requestAnimationFrame(update);

  if (!analyser || !micTimeDomain) return;
  var now = ctx.currentTime;
  frameCount++;

  // ═══ 1. READ MIC ═══
  analyser.getFloatTimeDomainData(micTimeDomain);

  // Amplitude (RMS) — every frame (cheap)
  var rms = 0;
  for (var i = 0; i < micTimeDomain.length; i++) {
    rms += micTimeDomain[i] * micTimeDomain[i];
  }
  rms = Math.sqrt(rms / micTimeDomain.length);
  var amp = Math.min(1, rms * 8); // scale to 0-1
  smoothAmp += (amp - smoothAmp) * 0.15;

  // ═══ 2. DETECT PITCH — every other frame (expensive) ═══
  if (frameCount % 2 === 0) {
    var pitch = detectPitch(micTimeDomain, ctx.sampleRate);
    if (pitch > 0 && pitch > 50 && pitch < 800) {
      detectedPitch = pitch;
      smoothPitch += (pitch - smoothPitch) * 0.2;
    } else {
      smoothPitch *= 0.95; // decay toward 0 when silent
    }
  }

  // ═══ 3. SNAP TO HARMONIC ═══
  var snap = snapToHarmonic(smoothPitch);
  snappedHarmonic = snap.freq;
  harmonicIndex = snap.index;

  // ═══ 4. COMPUTE COUPLING STRENGTH R ═══
  // R is based on:
  //   - How close the voice is to a harmonic (snap distance in cents)
  //   - How loud the voice is (amplitude)
  //   - Stability (how long the pitch has been near this harmonic)
  var pitchMatch = 0;
  if (snap.distance < 100) { // within 100 cents = within a semitone
    pitchMatch = 1 - snap.distance / 100;
    pitchMatch = pitchMatch * pitchMatch; // sharpen
  }

  var targetR = pitchMatch * smoothAmp;

  // Smooth R — water bottle feel
  if (targetR > smoothR) {
    smoothR += (targetR - smoothR) * 0.08; // attack
  } else {
    smoothR += (targetR - smoothR) * 0.03; // slow release — resonance lingers
  }

  R = smoothR;

  // ═══ 5. PHASE LOCK DETECTION ═══
  if (R > LOCK_THRESHOLD) {
    lockTime += 0.016;
  } else {
    lockTime *= 0.95;
  }

  prevLocked = isLocked;
  isLocked = lockTime > 1.5;

  // Lock event — the moment you and the page become one
  if (isLocked && !prevLocked) {
    onPhaseLock();
  }

  // ═══ 6. DRIVE RESPONSE OSCILLATORS ═══
  if (snappedHarmonic > 0 && smoothAmp > 0.05) {
    // Main voice — the harmonic you're closest to
    var mainFreq = snappedHarmonic;
    var mainVol = R * 0.12;

    // Breathing — the response is alive
    var breath = 1 + Math.sin(now * 0.8) * 0.05;
    mainVol *= breath;

    responseOscs[0].frequency.setTargetAtTime(mainFreq, now, 0.08);
    responseGains[0].gain.setTargetAtTime(mainVol, now, 0.1);

    // Fifth below — warmth
    var fifthBelow = mainFreq * 2 / 3;
    if (fifthBelow < 30) fifthBelow = mainFreq * 2;
    responseOscs[1].frequency.setTargetAtTime(fifthBelow, now, 0.12);
    responseGains[1].gain.setTargetAtTime(mainVol * 0.35 * R, now, 0.15);

    // Fifth above — brightness (only at high R)
    responseOscs[2].frequency.setTargetAtTime(mainFreq * 3 / 2, now, 0.12);
    responseGains[2].gain.setTargetAtTime(mainVol * 0.25 * R * R, now, 0.15);

    // Octave above — shimmer (only when locked)
    var lockFactor = isLocked ? 1 : 0;
    responseOscs[3].frequency.setTargetAtTime(mainFreq * 2, now, 0.08);
    responseGains[3].gain.setTargetAtTime(mainVol * 0.15 * lockFactor, now, 0.2);

    // Sub-octave — the chest feeling (always gentle)
    var subFreq = mainFreq / 2;
    if (subFreq < 25) subFreq = mainFreq;
    responseOscs[4].frequency.setTargetAtTime(subFreq, now, 0.15);
    responseGains[4].gain.setTargetAtTime(mainVol * 0.2, now, 0.15);

    // Reverb gets wetter with R — more resonance = more space
    wetBus.gain.setTargetAtTime(0.35 + R * 0.45, now, 0.2);

    // Master volume responds to coupling
    masterGain.gain.setTargetAtTime(0.08 + R * 0.22, now, 0.15);

  } else {
    // Silence — fade everything out gracefully
    for (var i = 0; i < responseGains.length; i++) {
      responseGains[i].gain.setTargetAtTime(0, now, 0.4);
    }
    masterGain.gain.setTargetAtTime(0, now, 0.5);
  }

  // ═══ 7. UPDATE VISUALS ═══
  updateVisuals();
  updateHUD();
}

// ═══ PHASE LOCK EVENT ═══
// When the human and the page synchronize, something special happens.
// The page responds with a chord that builds slowly — like it's waking up.
// Text nearest to viewport center glows brightest.
// The word "coupling" in the text pulses gold.

function onPhaseLock() {
  // Fire a resonance burst — a brief harmonic bloom
  if (!ctx) return;
  var now = ctx.currentTime;

  // Burst: play all harmonics of the locked note, quiet, staggered
  var base = snappedHarmonic || FUNDAMENTAL * 4;
  for (var h = 1; h <= 6; h++) {
    var freq = base * h;
    if (freq > 4000) break;

    var osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    var g = ctx.createGain();
    var vol = 0.04 / h;
    var delay = h * 0.08; // staggered entrance — like voices joining a choir
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(vol, now + delay + 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, now + delay + 2.5);

    osc.connect(g);
    g.connect(dryBus);
    g.connect(reverbNode);
    osc.start(now + delay);
    osc.stop(now + delay + 3);
  }
}

// ═══ HUD ═══
var hud = null;

function createHUD() {
  hud = document.createElement('div');
  hud.style.cssText = 'position:fixed;top:44px;right:14px;z-index:9999;' +
    'font-family:"Courier New",monospace;font-size:0.58em;color:#b8753a40;' +
    'line-height:1.8;pointer-events:none;text-align:right;' +
    'transition:color 0.3s;';
  document.body.appendChild(hud);
}

function updateHUD() {
  if (!hud) return;

  var pitchStr = smoothPitch > 30 ? smoothPitch.toFixed(0) + ' Hz' : '---';
  var harmStr = snappedHarmonic > 0 ? snappedHarmonic.toFixed(0) + ' Hz' : '---';
  var harmNum = harmonicIndex >= 0 ? 'H' + (harmonicIndex + 1) : '';
  var rStr = (R * 100).toFixed(0) + '%';
  var lockStr = isLocked ? ' LOCK' : '';

  hud.innerHTML = 'voice ' + pitchStr + '<br>' +
    'harmonic ' + harmStr + ' ' + harmNum + '<br>' +
    'R ' + rStr + lockStr;

  // HUD color responds to R
  var alpha = (0.2 + R * 0.6).toFixed(2);
  hud.style.color = 'rgba(184,117,58,' + alpha + ')';
}

// ═══ BUTTON ═══
function createButton() {
  var btn = document.createElement('div');
  btn.id = 'hum-btn';
  btn.style.cssText = 'position:fixed;top:14px;right:80px;z-index:9999;' +
    'cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent;';

  var inner = document.createElement('span');
  inner.style.cssText = 'font-size:0.62em;color:rgba(184,117,58,0.2);' +
    'letter-spacing:0.06em;border:1px solid rgba(184,117,58,0.1);' +
    'padding:6px 14px;border-radius:16px;transition:all 0.4s;' +
    'font-family:Georgia,serif;display:inline-block;';
  inner.textContent = 'hum with the page';
  btn.appendChild(inner);

  // Don't show if scroll-music button exists at same position
  // This sits ABOVE the scroll-music button

  btn.onmouseenter = function() {
    if (!started) {
      inner.style.color = 'rgba(184,117,58,0.5)';
      inner.style.borderColor = 'rgba(184,117,58,0.3)';
    }
  };
  btn.onmouseleave = function() {
    if (!started) {
      inner.style.color = 'rgba(184,117,58,0.2)';
      inner.style.borderColor = 'rgba(184,117,58,0.1)';
    }
  };

  btn.onclick = function(e) {
    e.preventDefault();

    if (!started) {
      if (!initAudio()) return;

      initMic().then(function(ok) {
        if (!ok) {
          inner.textContent = 'mic needed';
          inner.style.color = 'rgba(184,117,58,0.3)';
          setTimeout(function() {
            inner.textContent = 'hum with the page';
            inner.style.color = 'rgba(184,117,58,0.2)';
          }, 2000);
          return;
        }

        started = true;
        findGlowTargets();
        createHUD();
        update();

        inner.textContent = 'humming...';
        inner.style.color = 'rgba(184,117,58,0.5)';
        inner.style.borderColor = 'rgba(184,117,58,0.25)';
        inner.style.animation = 'hum-breathe 4s ease-in-out infinite';
      });

    } else if (ctx.state === 'running') {
      ctx.suspend();
      inner.textContent = 'hum with the page';
      inner.style.color = 'rgba(184,117,58,0.2)';
      inner.style.borderColor = 'rgba(184,117,58,0.1)';
      inner.style.animation = 'none';
      if (hud) hud.style.display = 'none';
      // Reset glow and colors
      for (var i = 0; i < glowElements.length; i++) {
        glowElements[i].el.style.textShadow = '';
        glowElements[i].el.style.color = glowElements[i].originalColor;
        glowElements[i].glow = 0;
      }
      if (glowOverlay) glowOverlay.style.opacity = '0';

    } else {
      ctx.resume();
      inner.textContent = 'humming...';
      inner.style.color = 'rgba(184,117,58,0.5)';
      inner.style.borderColor = 'rgba(184,117,58,0.25)';
      inner.style.animation = 'hum-breathe 4s ease-in-out infinite';
      if (hud) hud.style.display = 'block';
    }
  };

  // Add breathing animation
  var style = document.createElement('style');
  style.textContent = '@keyframes hum-breathe{0%,100%{opacity:0.7;}50%{opacity:1;}}';
  document.head.appendChild(style);

  document.body.appendChild(btn);
}

// ═══ INIT — only when page is ready ═══
function ready() {
  // Only on pages that have the scroll-music button or .page class
  if (!document.querySelector('.page')) return;
  createButton();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ready);
} else {
  ready();
}

})();
