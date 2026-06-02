// The Radio launcher — drops a small "radio" pill that opens /radio/ starting
// on the song of the page you're on. Include on any page: <script src="/js/radio-launch.js" defer></script>
(function(){
  if (location.pathname.indexOf('/radio') === 0) return; // don't show it on the radio itself
  var p = location.pathname.replace(/\/+$/, '');
  var slug = (p === '' ) ? 'home' : (p.split('/').pop() || 'home');

  var css = document.createElement('style');
  css.textContent =
    '.radio-pill{position:fixed;bottom:20px;right:20px;z-index:9990;display:inline-flex;align-items:center;gap:7px;' +
    'background:rgba(18,13,10,0.72);border:1px solid rgba(201,164,74,0.18);border-radius:999px;padding:8px 15px;' +
    "font-family:Futura,'Century Gothic',system-ui,sans-serif;font-size:0.58em;letter-spacing:0.18em;text-transform:uppercase;" +
    'color:rgba(201,164,74,0.5);text-decoration:none;backdrop-filter:blur(3px);transition:color .3s,border-color .3s,background .3s;}' +
    '.radio-pill:hover{color:#e8cfa0;border-color:rgba(201,164,74,0.4);background:rgba(18,13,10,0.9);}' +
    '.radio-pill .rl-dot{width:7px;height:7px;border-radius:50%;background:#c9a44a;box-shadow:0 0 8px rgba(201,164,74,0.6);animation:rlpulse 2.4s ease-in-out infinite;}' +
    '@keyframes rlpulse{0%,100%{opacity:0.45;}50%{opacity:1;}}';
  document.head.appendChild(css);

  function mount(){
    if (document.querySelector('.radio-pill')) return;
    var a = document.createElement('a');
    a.className = 'radio-pill';
    a.href = '/radio/?start=' + encodeURIComponent(slug);
    a.title = 'The Radio — every song on the site, one stream';
    a.innerHTML = '<span class="rl-dot"></span>radio';
    document.body.appendChild(a);
  }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
