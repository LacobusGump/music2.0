// toggle.js — the math / the point?
// Shared across all research pages.
// Default: "the point?" (human mode).
// Toggle: "the math" (science mode).

(function(){
  // Check for saved preference
  var mode = localStorage.getItem('gump-mode') || 'point';

  function init() {
    var bar = document.getElementById('mode-toggle');
    if (!bar) return;

    var mathEl = document.getElementById('the-math');
    var pointEl = document.getElementById('the-point');
    if (!mathEl || !pointEl) return;

    // Build toggle UI
    bar.innerHTML = '';
    bar.style.cssText = 'display:flex;justify-content:center;margin:16px 0 24px;gap:0;';

    var btnPoint = document.createElement('button');
    btnPoint.textContent = 'the point?';
    btnPoint.id = 'btn-point';

    var btnMath = document.createElement('button');
    btnMath.textContent = 'the math';
    btnMath.id = 'btn-math';

    var baseStyle = 'font-family:Georgia,serif;font-size:0.78em;padding:8px 20px;border:1px solid #c9a44a20;cursor:pointer;transition:all 0.4s;letter-spacing:0.06em;background:none;';
    btnPoint.style.cssText = baseStyle + 'border-radius:6px 0 0 6px;border-right:none;';
    btnMath.style.cssText = baseStyle + 'border-radius:0 6px 6px 0;';

    bar.appendChild(btnPoint);
    bar.appendChild(btnMath);

    function setMode(m) {
      mode = m;
      localStorage.setItem('gump-mode', m);

      if (m === 'point') {
        pointEl.style.display = '';
        mathEl.style.display = 'none';
        btnPoint.style.background = '#c9a44a15';
        btnPoint.style.color = '#c9a44a';
        btnPoint.style.borderColor = '#c9a44a40';
        btnMath.style.background = 'none';
        btnMath.style.color = '#555';
        btnMath.style.borderColor = '#c9a44a20';
      } else {
        pointEl.style.display = 'none';
        mathEl.style.display = '';
        btnMath.style.background = '#c9a44a15';
        btnMath.style.color = '#c9a44a';
        btnMath.style.borderColor = '#c9a44a40';
        btnPoint.style.background = 'none';
        btnPoint.style.color = '#555';
        btnPoint.style.borderColor = '#c9a44a20';
      }
    }

    btnPoint.addEventListener('click', function(){ setMode('point'); });
    btnMath.addEventListener('click', function(){ setMode('math'); });

    setMode(mode);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
