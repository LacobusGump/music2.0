// The Wikipedia bar. One person, no institution, everything free — said plainly
// once, then it gets out of the way and stays out for a month.
//
// Two rules it must not break:
//   1. It never covers anything. It is in normal flow, so it takes real space
//      and pushes content down instead of floating over a heading. On /metro/,
//      which is a fixed 100dvh slab with overflow hidden, that means becoming a
//      flex child of body rather than an overlay.
//   2. Dismissing it means something. The choice is remembered for 30 days, and
//      it never reappears inside the same session.
//
// Opt-in per page: <script defer src="/js/support-banner.js" data-tone="amber">
// Deliberately NOT on the homepage — you don't ask before you've given anything.
(function(){
  var KEY = 'gump_support_banner';
  var DAYS = 30;

  var TONES = {
    // amber reads as "notice" against this palette; red reads as "error", which
    // is the wrong feeling for asking a favour. Swap data-tone to use it anyway.
    amber: { bg:'rgba(201,164,74,0.11)', edge:'#c9a44a', text:'#e0c184', btn:'#c9a44a', btnText:'#1a110d' },
    red:   { bg:'rgba(180,66,48,0.13)',  edge:'#c0492f', text:'#eaa48f', btn:'#c0492f', btnText:'#fff4ef' }
  };

  function dismissed(){
    try {
      var v = localStorage.getItem(KEY);
      if (!v) return false;
      return (Date.now() - (+v)) < DAYS * 864e5;
    } catch(e){ return false; }   // private mode: show it, don't crash
  }

  function mount(){
    if (dismissed()) return;
    if (document.querySelector('.gump-support')) return;
    if (!document.body) return setTimeout(mount, 30);

    var me = document.querySelector('script[src*="support-banner"]');
    var tone = TONES[(me && me.dataset.tone) || 'amber'] || TONES.amber;
    var compact = !!(me && me.dataset.compact === '1');

    var css = document.createElement('style');
    css.textContent =
      ".gump-support{display:flex;align-items:center;gap:10px;flex:0 0 auto;" +
        // pages with a fixed background canvas at z-index 0 would otherwise
        // paint it straight over an unpositioned banner
        "position:relative;z-index:2;" +
        "background:" + tone.bg + ";border-bottom:1px solid " + tone.edge + ";" +
        "padding:" + (compact ? "7px 12px" : "11px 16px") + ";" +
        "font-family:Futura,'Century Gothic',Avenir,system-ui,sans-serif;" +
        "font-size:" + (compact ? ".64rem" : ".72rem") + ";line-height:1.45;color:" + tone.text + ";" +
        "box-shadow:inset 3px 0 0 " + tone.edge + ";}" +
      ".gump-support p{margin:0;flex:1 1 auto;min-width:0;}" +
      ".gump-support b{font-weight:600;color:" + tone.edge + ";}" +
      ".gump-support .gs-give{flex:0 0 auto;background:" + tone.btn + ";color:" + tone.btnText + ";" +
        "text-decoration:none;border-radius:999px;white-space:nowrap;" +
        "padding:" + (compact ? "5px 13px" : "7px 17px") + ";" +
        "font-size:" + (compact ? ".6rem" : ".66rem") + ";letter-spacing:.1em;text-transform:uppercase;" +
        "transition:opacity .2s;}" +
      ".gump-support .gs-give:hover{opacity:.82;}" +
      ".gump-support .gs-x{flex:0 0 auto;background:none;border:none;cursor:pointer;color:" + tone.text + ";" +
        "opacity:.5;font-size:1rem;line-height:1;padding:4px 6px;font-family:inherit;}" +
      ".gump-support .gs-x:hover{opacity:1;}" +
      "@media(max-width:520px){.gump-support{gap:8px;padding:8px 11px;font-size:.62rem;}" +
        ".gump-support .gs-give{padding:5px 12px;font-size:.58rem;}}" +
      "@media(prefers-reduced-motion:reduce){.gump-support *{transition:none;}}";
    document.head.appendChild(css);

    var el = document.createElement('aside');
    el.className = 'gump-support';
    el.setAttribute('role', 'complementary');
    el.setAttribute('aria-label', 'support beGump');
    el.innerHTML =
      '<p><b>beGump is one person and a Mac Mini.</b> The metronome, the tools and all ' +
      'thirty-three songs are free, and they stay free. If they are worth something to you, ' +
      'a few dollars keeps the lights on.</p>' +
      '<a class="gs-give" href="/support/">Chip in</a>' +
      '<button class="gs-x" aria-label="dismiss">&times;</button>';

    // In flow, at the very top of the page. On the metro slab that makes it the
    // first flex child; everywhere else it is simply the first thing you read.
    document.body.insertBefore(el, document.body.firstChild);

    el.querySelector('.gs-x').addEventListener('click', function(){
      try { localStorage.setItem(KEY, String(Date.now())); } catch(e){}
      el.remove();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
