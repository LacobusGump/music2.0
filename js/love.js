/* love.js — the love filter
   One button. Replaces "coupling" with "love" across the page.
   The reader discovers for themselves that the math IS the love.
   Not told. Discovered. */

(function(){
  var active = false;
  var original = null;

  // Homepage routing: Research opens the handrail first, atlas stays one click away.
  function routeHomepageResearchDoor(){
    var path = window.location.pathname || '/';
    if (path !== '/' && path !== '/index.html') return;
    var links = document.querySelectorAll('a.door[href="/research/"]');
    for (var i = 0; i < links.length; i++) {
      links[i].setAttribute('href', '/research/doors/');
    }
  }

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

  // Build the button — sits at bottom of page, quiet
  var btn = document.createElement('div');
  btn.id = 'love-bug';
  btn.style.cssText = 'text-align:center;margin:20px 0 0;cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent;';
  btn.innerHTML = '<span style="font-size:0.6em;color:#c4444480;letter-spacing:0.08em;border:1px solid #c4444430;padding:6px 14px;border-radius:20px;transition:all 0.6s;animation:lovepulse 3s ease-in-out infinite;">🐛 read with love</span>';

  // Add the pulse animation
  var loveStyle = document.createElement('style');
  loveStyle.textContent = '@keyframes lovepulse{0%,100%{border-color:#c4444420;color:#c4444460;}50%{border-color:#c4444450;color:#c44444a0;}}';
  document.head.appendChild(loveStyle);

  btn.onmouseenter = function(){ btn.firstChild.style.color='#c44'; btn.firstChild.style.borderColor='#c44'; };
  btn.onmouseleave = function(){ if(!active){ btn.firstChild.style.color='#c4444480'; btn.firstChild.style.borderColor='#c4444430'; }};

  btn.onclick = function(){
    var page = document.querySelector('.page');
    if (!page) return;

    if (!active) {
      // Save original
      original = page.innerHTML;

      // Replace coupling/coupled/couple/couples with love/loved/love/loves
      var html = page.innerHTML;

      // Careful replacements — preserve case, handle word boundaries
      html = html.replace(/\bcoupling\b/g, 'love');
      html = html.replace(/\bCoupling\b/g, 'Love');
      html = html.replace(/\bCOUPLING\b/g, 'LOVE');
      html = html.replace(/\bcoupled\b/g, 'loved');
      html = html.replace(/\bCoupled\b/g, 'Loved');
      html = html.replace(/\bcouple\b/g, 'love');
      html = html.replace(/\bCouple\b/g, 'Love');
      html = html.replace(/\bcouples\b/g, 'loves');
      html = html.replace(/\bCouples\b/g, 'Loves');
      html = html.replace(/\bdecouple\b/g, 'unlove');
      html = html.replace(/\bdecoupled\b/g, 'unloved');
      html = html.replace(/\bdecoupling\b/g, 'unloving');
      html = html.replace(/\buncoupled\b/g, 'unloved');

      page.innerHTML = html;
      routeHomepageResearchDoor();
      addTheoryElectroweakBridge();
      active = true;

      // Re-insert the button (it was part of page innerHTML that got replaced)
      var existing = page.querySelector('#love-bug');
      if (!existing) {
        var foot = page.querySelector('.foot');
        if (foot) foot.parentNode.insertBefore(btn, foot);
      }

      btn.firstChild.textContent = '🐛 read with math';
      btn.firstChild.style.color = '#c4444480';
      btn.firstChild.style.borderColor = '#c4444430';

    } else {
      // Restore original
      page.innerHTML = original;
      routeHomepageResearchDoor();
      addTheoryElectroweakBridge();
      active = false;

      // Re-insert button
      var existing = page.querySelector('#love-bug');
      if (!existing) {
        var foot = page.querySelector('.foot');
        if (foot) foot.parentNode.insertBefore(btn, foot);
      }

      btn.firstChild.textContent = '🐛 read with love';
      btn.firstChild.style.color = '#c4444480';
      btn.firstChild.style.borderColor = '#c4444430';
    }
  };

  // Only show if the page actually uses the word coupling
  function place(){
    routeHomepageResearchDoor();
    addTheoryElectroweakBridge();
    var page = document.querySelector('.page');
    if (!page) return;
    var text = page.textContent || page.innerText || '';
    if (!/coupl/i.test(text)) return; // no coupling words, no button
    var foot = document.querySelector('.foot');
    if (foot) foot.parentNode.insertBefore(btn, foot);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', place);
  } else {
    place();
  }
})();