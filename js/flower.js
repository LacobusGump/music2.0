// flower.js — the Flower of Life as a subtle background layer
// Present on pages about coupling. Invisible unless you look.
// Like the pattern under the temple floor.

(function(){
  var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:0;opacity:0.025;';

  var r = 40; // circle radius
  var dx = r;  // horizontal offset between circle centers
  var dy = r * Math.sqrt(3) / 2; // vertical offset (√3/2 — the vesica ratio)

  // Generate circles in a Flower of Life grid
  // Cover the viewport with some overflow
  var cols = Math.ceil(window.innerWidth / dx) + 4;
  var rows = Math.ceil(window.innerHeight / dy) + 4;

  for (var row = -2; row < rows; row++) {
    for (var col = -2; col < cols; col++) {
      var cx = col * dx + (row % 2) * dx / 2;
      var cy = row * dy;

      var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', cx);
      circle.setAttribute('cy', cy);
      circle.setAttribute('r', r);
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', '#c9a44a');
      circle.setAttribute('stroke-width', '0.5');
      svg.appendChild(circle);
    }
  }

  document.body.insertBefore(svg, document.body.firstChild);

  // Subtle parallax on scroll
  window.addEventListener('scroll', function() {
    var y = window.scrollY * 0.05;
    svg.style.transform = 'translateY(' + (-y) + 'px)';
  });
})();
