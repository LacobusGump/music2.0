// toggle.js — the point? first, math journal at the bottom
// No toggle. The point? IS the page. The math unfolds below.

(function(){
  function init() {
    // Remove the toggle bar — no longer needed
    var bar = document.getElementById('mode-toggle');
    if (bar) bar.style.display = 'none';

    var mathEl = document.getElementById('the-math');
    var pointEl = document.getElementById('the-point');
    if (!mathEl || !pointEl) return;

    // Both visible. Point first (already in DOM order). Math below.
    pointEl.style.display = '';
    mathEl.style.display = '';

    // Add a separator before the math section
    if (!document.getElementById('math-journal-header')) {
      var sep = document.createElement('div');
      sep.id = 'math-journal-header';
      sep.style.cssText = 'margin:50px 0 20px;padding:20px 0 10px;border-top:1px solid #c9a44a15;text-align:center;';
      sep.innerHTML = '<div style="font-size:0.68em;color:#c9a44a40;letter-spacing:0.15em;text-transform:uppercase;font-family:Futura,Century Gothic,system-ui,sans-serif;">math journal</div><div style="font-size:0.65em;color:#333;margin-top:4px;">How we got here. Citations, data, kill list.</div>';
      mathEl.parentNode.insertBefore(sep, mathEl);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
