// Suppress Harmonia's own floating orb/panel — thread mode replaces them
(function(){
  var s = document.createElement('style');
  s.textContent = '#harmonia-orb{display:none!important;}#harmonia-panel{display:none!important;}';
  document.head.appendChild(s);
})();

// ═══════════════════════════════════════════════════════════════════
// HARMONIA THREAD — She follows the reader.
// An orb drifts alongside whatever paragraph is centered in view.
// Tap to go deeper. No interruption unless you want one.
//
// Usage: add <script src="/js/harmonia-thread.js"></script> to any page
// ═══════════════════════════════════════════════════════════════════

(function() {
'use strict';

// ── Config ──
var ORB_SIZE = 28;
var LERP = 0.07;          // how smoothly the orb follows (lower = dreamier)
var FADE_DELAY = 1200;    // ms before orb fades when not near content
var RESPOND_CONTEXT = 50; // chars of paragraph context to send Harmonia

// ── State ──
var orbY = window.innerHeight * 0.5;
var orbTargetY = orbY;
var currentPara = null;
var panelOpen = false;
var animFrame = null;
var fadeTimer = null;
var orbOpacity = 0;
var orbOpacityTarget = 0;

// ── Build the orb ──
var orb = document.createElement('div');
orb.id = 'h-thread-orb';
orb.style.cssText = [
  'position:fixed',
  'right:64px',
  'width:' + ORB_SIZE + 'px',
  'height:' + ORB_SIZE + 'px',
  'border-radius:50%',
  'background:radial-gradient(circle at 38% 35%, #e8c07a, #b8753a 55%, #7a4520)',
  'box-shadow:0 0 14px rgba(201,164,74,0.35), 0 0 28px rgba(201,164,74,0.12)',
  'cursor:pointer',
  'z-index:8000',
  'opacity:0',
  'transition:opacity 0.6s ease, box-shadow 0.4s ease',
  'will-change:transform',
  'top:50%',
  'transform:translateY(-50%)',
  'pointer-events:auto'
].join(';');

// Breathing animation via JS (no CSS keyframes needed)
var breathPhase = 0;
function breathe() {
  breathPhase += 0.025;
  var scale = 1 + Math.sin(breathPhase) * 0.08;
  var glow = 0.35 + Math.sin(breathPhase) * 0.15;
  orb.style.transform = 'translateY(' + (orbY - window.innerHeight/2) + 'px) scale(' + scale + ')';
  orb.style.boxShadow = '0 0 14px rgba(201,164,74,' + glow + '), 0 0 28px rgba(201,164,74,' + (glow*0.4) + ')';
}

// ── Build the drawer ──
var drawer = document.createElement('div');
drawer.id = 'h-thread-drawer';
drawer.style.cssText = [
  'position:fixed',
  'bottom:0',
  'left:0',
  'right:0',
  'background:#120d08',
  'border-top:1px solid rgba(201,164,74,0.12)',
  'z-index:9000',
  'transform:translateY(100%)',
  'transition:transform 0.4s cubic-bezier(0.16,1,0.3,1)',
  'padding:20px 24px 32px',
  'max-height:55vh',
  'overflow-y:auto',
  'font-family:Georgia,serif',
  'color:#c4a088',
  '-webkit-overflow-scrolling:touch'
].join(';');

drawer.innerHTML = [
  '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">',
    '<div style="display:flex;align-items:center;gap:10px;">',
      '<div id="h-drawer-orb" style="width:22px;height:22px;border-radius:50%;',
        'background:radial-gradient(circle at 38% 35%,#e8c07a,#b8753a 55%,#7a4520);',
        'box-shadow:0 0 10px rgba(201,164,74,0.4);flex-shrink:0;"></div>',
      '<span style="font-family:Futura,Century Gothic,sans-serif;font-size:0.58em;',
        'letter-spacing:0.18em;color:#b8753a;text-transform:uppercase;">Harmonia</span>',
    '</div>',
    '<button id="h-drawer-close" style="background:none;border:none;color:#5a3a20;',
      'font-size:1.2em;cursor:pointer;padding:4px 8px;line-height:1;">×</button>',
  '</div>',
  '<div id="h-drawer-context" style="font-size:0.65em;color:#5a3a20;',
    'letter-spacing:0.04em;margin-bottom:12px;font-style:italic;',
    'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"></div>',
  '<div id="h-drawer-body" style="font-size:0.85em;line-height:1.85;color:#c4a088;',
    'min-height:40px;"></div>'
].join('');

document.body.appendChild(orb);
document.body.appendChild(drawer);

// ── Get all content paragraphs ──
function getParagraphs() {
  var selectors = 'p, h2, h3, blockquote, li, td';
  var all = document.querySelectorAll(selectors);
  var result = [];
  for (var i = 0; i < all.length; i++) {
    var el = all[i];
    var text = el.textContent.trim();
    // Skip nav, footer, very short, code
    if (text.length < 40) continue;
    if (el.closest('nav, footer, .back, script, style, #h-thread-drawer')) continue;
    result.push(el);
  }
  return result;
}

// ── Find centered paragraph ──
function getCenteredPara(paras) {
  var center = window.innerHeight * 0.42; // slightly above middle — reading position
  var best = null;
  var bestDist = Infinity;
  for (var i = 0; i < paras.length; i++) {
    var rect = paras[i].getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) continue;
    var midY = (rect.top + rect.bottom) / 2;
    var dist = Math.abs(midY - center);
    if (dist < bestDist) {
      bestDist = dist;
      best = { el: paras[i], midY: midY };
    }
  }
  return best;
}

// ── Main loop ──
var paras = [];
var lastParaText = '';

function tick() {
  animFrame = requestAnimationFrame(tick);

  // Lazy init paragraphs
  if (paras.length === 0) {
    paras = getParagraphs();
  }

  var centered = getCenteredPara(paras);
  if (centered) {
    // Target: vertically centered on the paragraph's midpoint
    orbTargetY = Math.max(ORB_SIZE, Math.min(window.innerHeight - ORB_SIZE,
      centered.midY));

    // Track which paragraph we're on
    if (centered.el !== currentPara) {
      currentPara = centered.el;
      orbOpacityTarget = 1;
      clearTimeout(fadeTimer);
    }
  } else {
    orbOpacityTarget = 0;
  }

  // Lerp orb position
  orbY += (orbTargetY - orbY) * LERP;
  orb.style.transform = 'translateY(' + (orbY - window.innerHeight/2) + 'px) scale(1)';

  // Lerp opacity
  orbOpacity += (orbOpacityTarget - orbOpacity) * 0.06;
  if (!panelOpen) {
    orb.style.opacity = orbOpacity.toFixed(3);
  }

  breathe();
}

// ── Respond ──
function openDrawer() {
  if (!currentPara) return;
  panelOpen = true;
  orb.style.opacity = '0';

  var text = currentPara.textContent.trim();
  var context = text.slice(0, RESPOND_CONTEXT) + (text.length > RESPOND_CONTEXT ? '…' : '');

  // Show context
  document.getElementById('h-drawer-context').textContent = '"' + context + '"';

  // Clear and show loading
  var body = document.getElementById('h-drawer-body');
  body.textContent = '…';

  // Open drawer
  drawer.style.transform = 'translateY(0)';

  // Ask Harmonia
  var pageName = document.title.replace(' — beGump','').replace(' — GUMP','').trim();
  var prompt = text.slice(0, 280);

  function typewrite(el, text, done) {
    el.textContent = '';
    var i = 0;
    function tick() {
      if (i < text.length) {
        el.textContent += text[i++];
        drawer.scrollTop = drawer.scrollHeight;
        setTimeout(tick, 11);
      } else if (done) {
        done();
      }
    }
    tick();
  }

  function ask(prompt) {
    window.harmonia.respond(prompt).then(function(r) {
      // r is {text, links, source} — handle both string and object
      var text = (typeof r === 'string') ? r : (r && r.text ? r.text : String(r));
      var links = (r && r.links) ? r.links : [];
      
      // Build response: typewrite text, then append links
      typewrite(body, text, function() {
        if (links && links.length > 0) {
          var linkDiv = document.createElement('div');
          linkDiv.style.cssText = 'margin-top:14px;display:flex;flex-wrap:wrap;gap:8px;';
          links.forEach(function(l) {
            var a = document.createElement('a');
            a.href = l.url;
            a.textContent = l.name + ' →';
            a.style.cssText = 'font-family:Futura,sans-serif;font-size:0.65em;' +
              'letter-spacing:0.08em;color:#b8753a;text-decoration:none;' +
              'border:1px solid rgba(184,117,58,0.2);padding:4px 10px;border-radius:20px;';
            linkDiv.appendChild(a);
          });
          body.appendChild(linkDiv);
        }
      });
    }).catch(function() {
      body.textContent = 'The coupling is quiet here. Try again.';
    });
  }

  function doAsk() {
    if (window.harmonia && window.harmonia.respond) {
      ask(prompt);
    } else {
      var s = document.createElement('script');
      s.src = '/js/harmonia.js?v=3';
      s.onload = function() { if (window.harmonia) ask(prompt); };
      document.head.appendChild(s);
      body.textContent = 'Loading…';
    }
  }
  doAsk();
}

function closeDrawer() {
  panelOpen = false;
  drawer.style.transform = 'translateY(100%)';
  orbOpacity = 0;
  orb.style.opacity = '0';
}

// ── Events ──
orb.addEventListener('click', openDrawer);
orb.addEventListener('touchend', function(e) { e.preventDefault(); openDrawer(); });
document.getElementById('h-drawer-close').addEventListener('click', closeDrawer);

// Swipe down to close
var touchStartY = 0;
drawer.addEventListener('touchstart', function(e) { touchStartY = e.touches[0].clientY; }, {passive:true});
drawer.addEventListener('touchend', function(e) {
  if (e.changedTouches[0].clientY - touchStartY > 60) closeDrawer();
}, {passive:true});

// Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && panelOpen) closeDrawer();
});

// Start
tick();

})();
