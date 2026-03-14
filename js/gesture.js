/**
 * GESTURE — Touch Shape Recognition
 *
 * Watches the play-screen canvas for intentional shapes.
 * Figure-8 (infinity loop) → unlocks the lens picker.
 *
 * How it works:
 *   - Records touch path while finger is down
 *   - On lift: checks for self-intersection (figure-8 has exactly one)
 *   - Verifies two loops exist on opposite sides of the crossing
 *   - Draws a fading trail while tracing so the user sees the machine watching
 */

const Gesture = (function () {
  'use strict';

  var MIN_POINTS   = 18;    // too few = accidental swipe
  var MIN_LENGTH   = 70;    // px — minimum meaningful stroke
  var SKIP_ADJ     = 7;     // segments within this index don't count as crossings
  var MAX_CROSSINGS = 5;    // more than this = scribble

  // ── STATE ──────────────────────────────────────────────────────────────

  var recording  = false;
  var pts        = [];      // raw touch points [{x,y}]
  var listeners  = {};

  // Trail rendering
  var trailCanvas = null;
  var trailCtx    = null;
  var trailFade   = 0;      // 0-1, fades to 0 after recognition
  var trailFadeId = null;

  // ── EVENT EMITTER ──────────────────────────────────────────────────────

  function on(event, fn) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(fn);
  }

  function emit(event, data) {
    var fns = listeners[event] || [];
    for (var i = 0; i < fns.length; i++) fns[i](data);
  }

  // ── TRAIL ──────────────────────────────────────────────────────────────

  function initTrail(canvas) {
    trailCanvas = canvas;
    trailCtx    = canvas.getContext('2d');
  }

  function drawTrail() {
    if (!trailCtx || pts.length < 2) return;
    var dpr = window.devicePixelRatio || 1;
    var w   = trailCanvas.width  / dpr;
    var h   = trailCanvas.height / dpr;

    // Don't clear the main canvas — draw on top, trail fades naturally
    trailCtx.save();
    trailCtx.globalAlpha = 0.55;
    trailCtx.strokeStyle = 'rgba(255,255,255,0.35)';
    trailCtx.lineWidth   = 1.5;
    trailCtx.lineJoin    = 'round';
    trailCtx.lineCap     = 'round';
    trailCtx.beginPath();
    trailCtx.moveTo(pts[0].x, pts[0].y);
    for (var i = 1; i < pts.length; i++) {
      trailCtx.lineTo(pts[i].x, pts[i].y);
    }
    trailCtx.stroke();
    trailCtx.restore();
  }

  function flashRecognized() {
    // Brief bright flash of the completed trail, then fade
    if (!trailCtx || pts.length < 2) return;
    trailCtx.save();
    trailCtx.globalAlpha = 0.9;
    trailCtx.strokeStyle = '#ffffff';
    trailCtx.lineWidth   = 2.5;
    trailCtx.shadowColor = '#ffffff';
    trailCtx.shadowBlur  = 12;
    trailCtx.lineJoin    = 'round';
    trailCtx.beginPath();
    trailCtx.moveTo(pts[0].x, pts[0].y);
    for (var i = 1; i < pts.length; i++) {
      trailCtx.lineTo(pts[i].x, pts[i].y);
    }
    trailCtx.stroke();
    trailCtx.restore();
  }

  // ── GEOMETRY ───────────────────────────────────────────────────────────

  function segCross(a1, a2, b1, b2) {
    var d1x = a2.x - a1.x, d1y = a2.y - a1.y;
    var d2x = b2.x - b1.x, d2y = b2.y - b1.y;
    var den = d1x * d2y - d1y * d2x;
    if (Math.abs(den) < 0.001) return null;
    var dx = b1.x - a1.x, dy = b1.y - a1.y;
    var t  = (dx * d2y - dy * d2x) / den;
    var u  = (dx * d1y - dy * d1x) / den;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return {
        x: a1.x + t * d1x,
        y: a1.y + t * d1y,
        i: -1, j: -1,
      };
    }
    return null;
  }

  function centroid(path) {
    var sx = 0, sy = 0;
    for (var k = 0; k < path.length; k++) { sx += path[k].x; sy += path[k].y; }
    return { x: sx / path.length, y: sy / path.length };
  }

  function pathLen(path) {
    var l = 0;
    for (var i = 1; i < path.length; i++) {
      var dx = path[i].x - path[i-1].x, dy = path[i].y - path[i-1].y;
      l += Math.sqrt(dx*dx + dy*dy);
    }
    return l;
  }

  // ── RECOGNITION ────────────────────────────────────────────────────────

  function recognize(path) {
    if (path.length < MIN_POINTS) return null;
    if (pathLen(path) < MIN_LENGTH) return null;

    // Find all self-intersections (skip adjacent segments to avoid noise)
    var crossings = [];
    for (var i = 0; i < path.length - 1; i++) {
      for (var j = i + SKIP_ADJ; j < path.length - 1; j++) {
        var hit = segCross(path[i], path[i+1], path[j], path[j+1]);
        if (hit) {
          hit.i = i; hit.j = j;
          crossings.push(hit);
        }
      }
    }

    // Figure-8: needs 1-5 crossings (imprecise drawing tolerated)
    if (crossings.length === 0 || crossings.length > MAX_CROSSINGS) return null;

    // Use the first crossing as the split point
    var split = crossings[0].i;
    var loop1 = path.slice(0, split + 1);
    var loop2 = path.slice(split);   // overlap by 1 to close the loops

    if (loop1.length < 6 || loop2.length < 6) return null;

    // The two loops must have their centroids on different sides of the crossing
    var c1 = centroid(loop1);
    var c2 = centroid(loop2);
    var dx  = c1.x - c2.x, dy = c1.y - c2.y;
    var sep = Math.sqrt(dx*dx + dy*dy);

    // Minimum separation: 20% of the shorter screen dimension
    var minSep = Math.min(
      trailCanvas ? trailCanvas.width  / (window.devicePixelRatio || 1) : 200,
      trailCanvas ? trailCanvas.height / (window.devicePixelRatio || 1) : 300
    ) * 0.10;

    if (sep < minSep) return null;

    // Both loops should have meaningful arc (not just a blob)
    if (pathLen(loop1) < MIN_LENGTH * 0.4) return null;
    if (pathLen(loop2) < MIN_LENGTH * 0.4) return null;

    return 'figure8';
  }

  // ── TOUCH HANDLING ─────────────────────────────────────────────────────

  function onStart(x, y) {
    recording = true;
    pts = [{ x: x, y: y }];
  }

  function onMove(x, y) {
    if (!recording) return;
    var last = pts[pts.length - 1];
    var dx = x - last.x, dy = y - last.y;
    if (dx*dx + dy*dy > 16) {   // at least 4px between samples
      pts.push({ x: x, y: y });
      drawTrail();
    }
  }

  function onEnd() {
    if (!recording) return;
    recording = false;

    var result = recognize(pts);
    if (result) {
      flashRecognized();
      emit(result, pts);
    }
    // Clear pts after short delay so flash is visible
    setTimeout(function () { pts = []; }, 400);
  }

  // ── ATTACH ─────────────────────────────────────────────────────────────
  // el: the canvas element (play screen)
  // cmdBarHeight: px to exclude at bottom (the command bar — don't intercept typing)

  function attach(el, cmdBarHeight) {
    var barH = cmdBarHeight || 48;
    initTrail(el);

    el.addEventListener('touchstart', function (e) {
      var t = e.touches[0];
      var rect = el.getBoundingClientRect();
      var y = t.clientY - rect.top;
      // Ignore touches in the command bar zone
      if (y > rect.height - barH) return;
      onStart(t.clientX - rect.left, y);
    }, { passive: true });

    el.addEventListener('touchmove', function (e) {
      if (!recording) return;
      var t = e.touches[0];
      var rect = el.getBoundingClientRect();
      onMove(t.clientX - rect.left, t.clientY - rect.top);
    }, { passive: true });

    el.addEventListener('touchend', function () {
      onEnd();
    }, { passive: true });

    el.addEventListener('touchcancel', function () {
      recording = false;
      pts = [];
    }, { passive: true });
  }

  // ── PUBLIC ─────────────────────────────────────────────────────────────

  return Object.freeze({
    attach: attach,
    on:     on,
  });

})();
