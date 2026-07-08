/* love.js — page routing helpers.
   The love-bug filter is retired. The zero was never love.
   It's a cold zero, like math is. No paint on it. */

(function(){

  // Theory routing: keep the electroweak-scale result visible without rewriting the long article.
  function addTheoryElectroweakBridge(){
    var path = window.location.pathname || '';
    if (path !== '/research/theory/' && path !== '/research/theory/index.html') return;
    if (document.getElementById('electroweak-scale-bridge')) return;

    var killed = document.getElementById('killed');
    if (killed) {
      var bridge = document.createElement('div');
      bridge.id = 'electroweak-scale-bridge';
      bridge.innerHTML = '\n<hr>\n<div class="depth-marker">IV &mdash; mass scale</div>\n<h2 id="electroweak-scale">Electroweak Scale <span class="tag tag-observed">OBSERVED / OPEN</span></h2>\n<p>The E<sub>7</sub> fine-structure result is not the only numerical pressure point. A separate geometric hierarchy formula matches the electroweak vacuum scale when the ordinary, unreduced Planck mass is used:</p>\n<div class="eq eq-big">v = M<sub>Pl</sub> &times; &alpha;<sup>8</sup> &times; &radic;(2&pi;)<span class="note">ordinary Planck mass: 1.2209 &times; 10<sup>19</sup> GeV &rarr; 246.09 GeV</span></div>\n<p>The clean decomposition is <strong>&alpha;<sup>8</sup> = &alpha;<sup>6</sup> &times; &alpha;<sup>2</sup></strong>: six-dimensional bulk suppression from the resolved <strong>C<sup>3</sup>/2O</strong> geometry, times a one-loop exceptional-sector factor <strong>&alpha;<sup>&chi;/4</sup> = &alpha;<sup>8/4</sup> = &alpha;<sup>2</sup></strong>.</p>\n<div class="honest"><strong>Status: OBSERVED / OPEN.</strong> The numerical match is strong, but the derivation is not complete until the Gaussian normalization <span style="font-family:\'Courier New\',monospace;">&radic;(2&pi;)</span> and exceptional kinetic scaling <span style="font-family:\'Courier New\',monospace;">K<sub>E</sub> &sim; &alpha;<sup>-1/2</sup></span> are forced by the resolved geometry. <a href="/research/electroweak-scale/">Full electroweak-scale determinant page &rarr;</a></div>\n';
      killed.parentNode.insertBefore(bridge, killed.previousElementSibling || killed);
    }

    var summary = document.getElementById('summary');
    if (summary) {
      var table = summary.parentNode.querySelector('.box table');
      if (table) {
        var rows = table.querySelectorAll('tr');
        for (var r = 0; r < rows.length; r++) {
          var cells = rows[r].querySelectorAll('td');
          if (cells.length >= 3 && /OBSERVED/.test(cells[0].textContent)) {
            cells[1].textContent = '2';
            cells[2].innerHTML = 'Fine-structure match to 1/&alpha; at 0.009&sigma;; electroweak-scale match <a href="/research/electroweak-scale/">v = M<sub>Pl</sub>&alpha;<sup>8</sup>&radic;(2&pi;)</a> with open derivation steps.';
          }
          if (cells.length >= 3 && /OPEN/.test(cells[0].textContent)) {
            cells[2].innerHTML = 'E<sub>7</sub> ALE spectral determinant; electroweak Gaussian normalization and exceptional kinetic scaling.';
          }
        }
      }
    }

    var related = Array.prototype.slice.call(document.querySelectorAll('p')).filter(function(p){
      return /Related pages:/.test(p.textContent || '');
    })[0];
    if (related && !/electroweak-scale/.test(related.innerHTML)) {
      related.innerHTML = related.innerHTML.replace('Full Failure Log</a>', 'Full Failure Log</a> &middot;\n<a href="/research/electroweak-scale/">Electroweak Scale</a>');
    }
  }

  function run(){
    addTheoryElectroweakBridge();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
