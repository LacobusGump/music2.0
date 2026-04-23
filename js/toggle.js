// toggle.js — red pill / blue pill
// Blue pill (default): the math. The old page. Orbital graph. Citations.
// Red pill (toggle): the point? The funny version. Plain language.
// One click, entire page snaps.

(function(){
  var mode = localStorage.getItem('gump-mode') || 'math';

  // Immediately hide the non-default to prevent flash
  var style = document.createElement('style');
  style.textContent = mode === 'math' ? '#the-point{display:none}' : '#the-math{display:none}';
  document.head.appendChild(style);

  function init() {
    var bar = document.getElementById('mode-toggle');
    if (!bar) return;

    var mathEl = document.getElementById('the-math');
    var pointEl = document.getElementById('the-point');
    if (!mathEl || !pointEl) return;

    // Remove the flash-prevention style now that JS controls it
    style.remove();

    // Remove any math-journal separator from previous version
    var oldSep = document.getElementById('math-journal-header');
    if (oldSep) oldSep.remove();

    // Build toggle
    bar.innerHTML = '';
    bar.style.cssText = 'display:flex;justify-content:center;margin:16px 0 24px;gap:0;';

    var btnBlue = document.createElement('button');
    btnBlue.textContent = 'the math';
    btnBlue.id = 'btn-blue';

    var btnRed = document.createElement('button');
    btnRed.textContent = 'the point?';
    btnRed.id = 'btn-red';

    var base = 'font-family:Georgia,serif;font-size:0.78em;padding:8px 20px;cursor:pointer;transition:all 0.3s;letter-spacing:0.06em;border:none;';
    btnBlue.style.cssText = base + 'border-radius:6px 0 0 6px;';
    btnRed.style.cssText = base + 'border-radius:0 6px 6px 0;';

    bar.appendChild(btnBlue);
    bar.appendChild(btnRed);

    function setMode(m) {
      mode = m;
      localStorage.setItem('gump-mode', m);

      if (m === 'math') {
        mathEl.style.display = '';
        pointEl.style.display = 'none';
        btnBlue.style.background = '#1a2a4a';
        btnBlue.style.color = '#6699cc';
        btnRed.style.background = '#0a0a12';
        btnRed.style.color = '#444';
      } else {
        mathEl.style.display = 'none';
        pointEl.style.display = '';
        btnRed.style.background = '#3a1a1a';
        btnRed.style.color = '#cc6666';
        btnBlue.style.background = '#0a0a12';
        btnBlue.style.color = '#444';
      }
    }

    btnBlue.addEventListener('click', function(){ setMode('math'); });
    btnRed.addEventListener('click', function(){ setMode('point'); });

    setMode(mode);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
