// ═══════════════════════════════════════════════════
// THE IMMUNE SYSTEM — self-healing runtime
//
// Echo: pulse through every system, measure what bounces back
// Detect: where coherence breaks (NaN, crash, desync, lag)
// Dispatch: white blood cells carry targeted fixes
// Fix: apply, report
// Pulse again.
//
// This IS K. Healthy = coupled. Error = decoupled.
// The immune system restores coupling.
// ═══════════════════════════════════════════════════

var Immune = {
  pulseInterval: 60, // echo every 60 frames
  frameCount: 0,
  fixes: 0,
  lastFPS: 60,
  fpsHistory: [],
  quality: 1.0, // 1.0 = full, lower = reduced
  errors: [],
  healthy: true,

  // ═══ THE ECHO — pulse through all systems ═══
  echo: function(gl, gameState) {
    this.frameCount++;
    if (this.frameCount % this.pulseInterval !== 0) return;

    var report = { time: Date.now(), checks: 0, errors: 0, fixes: 0 };

    // ── Check 1: WebGL context alive ──
    report.checks++;
    if (gl.isContextLost()) {
      this.dispatch('context_lost', null, gl, gameState);
      report.errors++;
    }

    // ── Check 2: Particle coherence (NaN, Infinity, out of bounds) ──
    report.checks++;
    var nanCount = 0, oobCount = 0;
    var pos = gameState.pos, tgt = gameState.tgt, vel = gameState.vel;
    var N = gameState.N;
    for (var i = 0; i < N * 3; i += 300) { // sample every 100th particle
      if (isNaN(pos[i]) || !isFinite(pos[i])) nanCount++;
      if (Math.abs(pos[i]) > 200) oobCount++;
      if (isNaN(vel[i]) || !isFinite(vel[i])) nanCount++;
    }
    if (nanCount > 0) {
      this.dispatch('particle_nan', { count: nanCount }, gl, gameState);
      report.errors++;
    }
    if (oobCount > 5) {
      this.dispatch('particle_oob', { count: oobCount }, gl, gameState);
      report.errors++;
    }

    // ── Check 3: Camera coherence ──
    report.checks++;
    var cam = gameState.camera;
    if (isNaN(cam.angle) || isNaN(cam.height) || isNaN(cam.radius) || isNaN(cam.pitch)) {
      this.dispatch('camera_nan', null, gl, gameState);
      report.errors++;
    }
    if (cam.radius < 0.1 || cam.radius > 100) {
      this.dispatch('camera_oob', null, gl, gameState);
      report.errors++;
    }

    // ── Check 4: FPS health (adaptive quality) ──
    report.checks++;
    this.fpsHistory.push(this.lastFPS);
    if (this.fpsHistory.length > 5) this.fpsHistory.shift();
    var avgFPS = this.fpsHistory.reduce(function(a, b) { return a + b; }, 0) / this.fpsHistory.length;
    if (avgFPS < 30 && this.quality > 0.3) {
      this.dispatch('fps_low', { fps: avgFPS }, gl, gameState);
      report.errors++;
    } else if (avgFPS > 55 && this.quality < 1.0) {
      this.dispatch('fps_recovered', { fps: avgFPS }, gl, gameState);
    }

    // ── Check 5: K coherence (should be 0 to ~2, not NaN or negative) ──
    report.checks++;
    if (isNaN(gameState.K) || gameState.K < 0 || gameState.K > 10) {
      this.dispatch('k_broken', { K: gameState.K }, gl, gameState);
      report.errors++;
    }

    // ── Check 6: Shader programs valid ──
    report.checks++;
    if (gameState.worldProg && !gl.isProgram(gameState.worldProg)) {
      this.dispatch('shader_dead', { which: 'world' }, gl, gameState);
      report.errors++;
    }

    // Report
    this.healthy = report.errors === 0;
    if (report.errors > 0 && typeof D === 'function') {
      D('ECHO: ' + report.checks + ' checks, ' + report.errors + ' errors, ' + report.fixes + ' fixes', 'warn');
    }

    return report;
  },

  // ═══ WHITE BLOOD CELLS — targeted repair ═══
  dispatch: function(type, data, gl, gs) {
    if (typeof D === 'function') D('WBC dispatched: ' + type, 'warn');

    switch (type) {

      case 'particle_nan':
        // Reset all NaN particles to their targets
        for (var i = 0; i < gs.N * 3; i++) {
          if (isNaN(gs.pos[i]) || !isFinite(gs.pos[i])) {
            gs.pos[i] = gs.tgt[i] || 0;
            gs.vel[i] = 0;
            this.fixes++;
          }
        }
        D('  fixed ' + (data ? data.count : '?') + ' NaN particles', 'ok');
        break;

      case 'particle_oob':
        // Snap out-of-bounds particles back to targets
        for (var i = 0; i < gs.N; i++) {
          var j = i * 3;
          if (Math.abs(gs.pos[j]) > 200 || Math.abs(gs.pos[j + 1]) > 200 || Math.abs(gs.pos[j + 2]) > 200) {
            gs.pos[j] = gs.tgt[j]; gs.pos[j + 1] = gs.tgt[j + 1]; gs.pos[j + 2] = gs.tgt[j + 2];
            gs.vel[j] = gs.vel[j + 1] = gs.vel[j + 2] = 0;
            this.fixes++;
          }
        }
        D('  reset ' + (data ? data.count : '?') + ' OOB particles', 'ok');
        break;

      case 'camera_nan':
        gs.camera.angle = 0;
        gs.camera.height = 5;
        gs.camera.radius = 9;
        gs.camera.pitch = 0.5;
        this.fixes++;
        D('  camera reset to default', 'ok');
        break;

      case 'camera_oob':
        gs.camera.radius = Math.max(1, Math.min(50, gs.camera.radius));
        gs.camera.height = Math.max(0.5, Math.min(30, gs.camera.height));
        this.fixes++;
        D('  camera clamped', 'ok');
        break;

      case 'fps_low':
        this.quality *= 0.7;
        this.quality = Math.max(0.25, this.quality);
        if (gs.worldScale) gs.worldScale = Math.max(4, Math.ceil(4 / this.quality));
        this.fixes++;
        D('  quality reduced to ' + (this.quality * 100).toFixed(0) + '% (world 1/' + (gs.worldScale || '?') + ' res)', 'ok');
        break;

      case 'fps_recovered':
        this.quality = Math.min(1.0, this.quality * 1.1);
        if (gs.worldScale) gs.worldScale = Math.max(3, Math.ceil(4 / this.quality));
        D('  quality recovering: ' + (this.quality * 100).toFixed(0) + '%', 'ok');
        break;

      case 'k_broken':
        gs.K = 0;
        gs.targetK = 0;
        this.fixes++;
        D('  K reset to 0', 'ok');
        break;

      case 'shader_dead':
        gs.worldActive = false;
        this.fixes++;
        D('  ' + data.which + ' shader dead — disabled', 'ok');
        break;

      case 'context_lost':
        D('  WebGL context lost — waiting for restore', 'err');
        break;

      default:
        D('  unknown error type: ' + type, 'err');
    }
  },

  // ═══ STATUS ═══
  status: function() {
    return {
      healthy: this.healthy,
      quality: this.quality,
      fixes: this.fixes,
      fps: this.lastFPS,
      avgFPS: this.fpsHistory.length > 0 ?
        (this.fpsHistory.reduce(function(a, b) { return a + b; }, 0) / this.fpsHistory.length).toFixed(0) : '?'
    };
  }
};
