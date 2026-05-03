// Ferrofluid — magnetic liquid behind the gate
// Evolving, alive, pulling toward the input field
// Like the answer is inside, trying to get out
(function(){
var cv = document.createElement('canvas');
cv.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:-1;';
document.body.insertBefore(cv, document.body.firstChild);
var cx = cv.getContext('2d');
var W, H, t = 0;

function resize() {
  W = cv.width = innerWidth;
  H = cv.height = innerHeight;
}
resize();
addEventListener('resize', resize);

// Metaball centers — the ferrofluid blobs
var blobs = [];
for (var i = 0; i < 8; i++) {
  blobs.push({
    x: 0, y: 0,
    ox: (Math.random() - 0.5) * 0.4, // offset from center as fraction
    oy: (Math.random() - 0.5) * 0.4,
    r: 30 + Math.random() * 50,
    speed: 0.3 + Math.random() * 0.7,
    phase: Math.random() * Math.PI * 2,
    phaseY: Math.random() * Math.PI * 2,
  });
}

function draw() {
  t += 0.006;
  cx.fillStyle = '#000';
  cx.fillRect(0, 0, W, H);

  var centerX = W / 2;
  var centerY = H / 2;
  var radius = Math.min(W, H) * 0.18;

  // Update blob positions — orbit and breathe around center
  for (var i = 0; i < blobs.length; i++) {
    var b = blobs[i];
    b.x = centerX + Math.sin(t * b.speed + b.phase) * radius * (0.5 + b.ox);
    b.y = centerY + Math.cos(t * b.speed * 0.7 + b.phaseY) * radius * (0.5 + b.oy);
    // Slowly drift the orbit
    b.ox += Math.sin(t * 0.3 + i) * 0.001;
    b.oy += Math.cos(t * 0.2 + i * 2) * 0.001;
    b.ox = b.ox * 0.999; // decay back toward center
    b.oy = b.oy * 0.999;
  }

  // Render metaballs using radial gradients
  // Layer 1: dark base with subtle color
  cx.globalCompositeOperation = 'lighter';

  for (var i = 0; i < blobs.length; i++) {
    var b = blobs[i];
    var breathe = 1 + Math.sin(t * 2 + b.phase) * 0.3;
    var r = b.r * breathe;

    // Core glow — warm gold/copper
    var grad = cx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r * 2);
    grad.addColorStop(0, 'rgba(201,164,74,0.04)');
    grad.addColorStop(0.3, 'rgba(140,100,50,0.025)');
    grad.addColorStop(0.7, 'rgba(80,60,30,0.01)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    cx.fillStyle = grad;
    cx.beginPath();
    cx.arc(b.x, b.y, r * 2, 0, Math.PI * 2);
    cx.fill();

    // Inner bright spot
    var grad2 = cx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r * 0.6);
    grad2.addColorStop(0, 'rgba(201,164,74,0.06)');
    grad2.addColorStop(1, 'rgba(0,0,0,0)');
    cx.fillStyle = grad2;
    cx.beginPath();
    cx.arc(b.x, b.y, r * 0.6, 0, Math.PI * 2);
    cx.fill();
  }

  // Connection tendrils between nearby blobs
  for (var i = 0; i < blobs.length; i++) {
    for (var j = i + 1; j < blobs.length; j++) {
      var a = blobs[i], b = blobs[j];
      var dx = b.x - a.x, dy = b.y - a.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < radius * 2) {
        var strength = 1 - dist / (radius * 2);
        cx.strokeStyle = 'rgba(201,164,74,' + (strength * 0.03).toFixed(4) + ')';
        cx.lineWidth = strength * 8;
        cx.beginPath();
        // Curved tendril
        var mx = (a.x + b.x) / 2 + Math.sin(t * 3 + i + j) * 20;
        var my = (a.y + b.y) / 2 + Math.cos(t * 2 + i * j) * 20;
        cx.moveTo(a.x, a.y);
        cx.quadraticCurveTo(mx, my, b.x, b.y);
        cx.stroke();
      }
    }
  }

  cx.globalCompositeOperation = 'source-over';

  // Spikes — magnetic field lines radiating from the mass
  var numSpikes = 24;
  for (var i = 0; i < numSpikes; i++) {
    var angle = (i / numSpikes) * Math.PI * 2 + t * 0.1;
    var spikeLen = radius * (0.4 + Math.sin(t * 1.5 + i * 0.7) * 0.3);
    var sx = centerX + Math.cos(angle) * radius * 0.3;
    var sy = centerY + Math.sin(angle) * radius * 0.3;
    var ex = centerX + Math.cos(angle) * (radius * 0.3 + spikeLen);
    var ey = centerY + Math.sin(angle) * (radius * 0.3 + spikeLen);

    var grad3 = cx.createLinearGradient(sx, sy, ex, ey);
    grad3.addColorStop(0, 'rgba(201,164,74,0.03)');
    grad3.addColorStop(1, 'rgba(201,164,74,0)');
    cx.strokeStyle = grad3;
    cx.lineWidth = 1 + Math.sin(t + i) * 0.5;
    cx.beginPath();
    cx.moveTo(sx, sy);
    // Wobbly spike
    var wobble = Math.sin(t * 2 + i * 1.3) * 10;
    var mx2 = (sx + ex) / 2 + wobble;
    var my2 = (sy + ey) / 2 + Math.cos(t * 1.7 + i) * 8;
    cx.quadraticCurveTo(mx2, my2, ex, ey);
    cx.stroke();
  }

  requestAnimationFrame(draw);
}
draw();
})();
