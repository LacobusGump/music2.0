/* love.js — the love filter
   One button. Replaces "coupling" with "love" across the page.
   The reader discovers for themselves that the math IS the love.
   Not told. Discovered. */

(function(){
  var active = false;
  var original = null;

  // Build the button — sits at bottom of page, quiet
  var btn = document.createElement('div');
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
      active = true;

      // Re-insert the button (it was part of page innerHTML)
      var foot = page.querySelector('.foot');
      if (foot) foot.parentNode.insertBefore(btn, foot);

      btn.firstChild.textContent = '🐛 read with math';
      btn.firstChild.style.color = '#c4444480';
      btn.firstChild.style.borderColor = '#c4444430';

    } else {
      // Restore original
      page.innerHTML = original;
      active = false;

      // Re-insert button
      var foot = page.querySelector('.foot');
      if (foot) foot.parentNode.insertBefore(btn, foot);

      btn.firstChild.textContent = '🐛 read with love';
      btn.firstChild.style.color = '#c4444480';
      btn.firstChild.style.borderColor = '#c4444430';
    }
  };

  // Only show if the page actually uses the word coupling
  function place(){
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
