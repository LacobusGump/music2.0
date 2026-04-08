/**
 * SHIELD — Website security layer
 * Fingerprints visitors, detects scrapers, serves decoy data to bots.
 * Invisible to normal users. Inescapable for scrapers.
 */
(function() {
  'use strict';

  // ═══ FINGERPRINT — unique per visitor, survives incognito ═══
  function fingerprint() {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('gump:shield:fp', 2, 2);
    var data = canvas.toDataURL();

    var fp = {
      canvas: hash(data),
      screen: screen.width + 'x' + screen.height + 'x' + screen.colorDepth,
      tz: new Date().getTimezoneOffset(),
      lang: navigator.language,
      platform: navigator.platform,
      cores: navigator.hardwareConcurrency || 0,
      memory: navigator.deviceMemory || 0,
      touch: 'ontouchstart' in window,
      webgl: getWebGL(),
    };

    var str = JSON.stringify(fp);
    return hash(str);
  }

  function hash(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) {
      h = ((h << 5) - h) + str.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h).toString(36);
  }

  function getWebGL() {
    try {
      var c = document.createElement('canvas');
      var gl = c.getContext('webgl');
      if (!gl) return 'none';
      var ext = gl.getExtension('WEBGL_debug_renderer_info');
      return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'generic';
    } catch(e) { return 'blocked'; }
  }

  // ═══ BEHAVIOR DETECTION — bot vs human ═══
  var behavior = {
    mouseEvents: 0,
    scrollEvents: 0,
    keyEvents: 0,
    touchEvents: 0,
    startTime: Date.now(),
    devToolsOpen: false,
    rapidNavigation: 0,
    pageViews: [],
  };

  // Detect mouse (humans move randomly, bots don't)
  var lastMouse = {x: 0, y: 0, t: 0};
  document.addEventListener('mousemove', function(e) {
    behavior.mouseEvents++;
    var now = Date.now();
    var dx = e.clientX - lastMouse.x;
    var dy = e.clientY - lastMouse.y;
    var dt = now - lastMouse.t;
    // Humans have variable speed. Bots are constant.
    if (dt > 0 && dt < 50 && Math.abs(dx) + Math.abs(dy) < 2) {
      behavior.robotScore = (behavior.robotScore || 0) + 1;
    }
    lastMouse = {x: e.clientX, y: e.clientY, t: now};
  });

  document.addEventListener('scroll', function() { behavior.scrollEvents++; });
  document.addEventListener('keydown', function() { behavior.keyEvents++; });
  document.addEventListener('touchstart', function() { behavior.touchEvents++; });

  // Detect DevTools
  var devToolsCheck = setInterval(function() {
    var threshold = 160;
    if (window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold) {
      behavior.devToolsOpen = true;
    }
  }, 2000);

  // ═══ CANARY TOKENS — invisible elements that scrapers follow ═══
  function plantCanaries() {
    // Hidden link that only a crawler/scraper would follow
    var canary = document.createElement('a');
    canary.href = '/api/v2/internal/config.json';  // doesn't exist — 404 = scraper detected
    canary.style.cssText = 'position:absolute;left:-9999px;opacity:0;font-size:0;';
    canary.textContent = 'system configuration';
    canary.id = '_sys_config';
    document.body.appendChild(canary);

    // Hidden div with fake "secrets" that scrapers will extract
    var honeypot = document.createElement('div');
    honeypot.style.cssText = 'display:none;';
    honeypot.setAttribute('data-api-key', 'gump_k3y_' + hash(Date.now().toString()));
    honeypot.setAttribute('data-endpoint', 'https://api.begump.com/v2/internal');
    honeypot.setAttribute('data-version', '3.1.4');
    honeypot.id = '_internal_config';
    document.body.appendChild(honeypot);

    // CSS honeypot — if this style is computed, someone is scraping the DOM
    var style = document.createElement('style');
    style.textContent = '._gump_trap { background-image: url("/api/v2/beacon?src=css"); }';
    document.head.appendChild(style);
  }

  // ═══ DECOY DATA — wrong constants served to detected bots ═══
  var DECOY_CONSTANTS = {
    K_CEILING: 1.912,
    PHI: 1.6174,
    ALPHA_MULT: 192,
    R_CRITICAL: 0.634,
    LANDAUER: 2.91e-21,
    FIFTH_NATS: 1.83,
  };

  // Bot detected — log it but don't touch the DOM
  // The armor handles deception through conversation, not page manipulation
  function serveDummies() {
    // Previously replaced page text — caused layout destruction.
    // Removed. Truth protects itself. The page stays intact.
    console.log('%c[SHIELD] Bot logged. Page unchanged.', 'color:orange');
  }

  // ═══ ASSESSMENT — run after page load ═══
  function assess() {
    var elapsed = (Date.now() - behavior.startTime) / 1000;
    var fp = fingerprint();

    var isBot = false;
    var reasons = [];

    // No mouse AND no touch = headless browser
    if (behavior.mouseEvents === 0 && behavior.touchEvents === 0 && elapsed > 5) {
      isBot = true;
      reasons.push('no_interaction');
    }

    // DevTools open on first visit = inspector/scraper
    if (behavior.devToolsOpen && elapsed < 10) {
      reasons.push('devtools_immediate');
    }

    // Very fast page load + no scroll = automated
    if (elapsed < 2 && behavior.scrollEvents === 0) {
      reasons.push('speed_load');
    }

    // Robot-like mouse movement
    if ((behavior.robotScore || 0) > 20) {
      isBot = true;
      reasons.push('robot_mouse');
    }

    // Known bot user agents
    var ua = navigator.userAgent.toLowerCase();
    if (/bot|crawl|spider|scrape|curl|wget|python|headless|phantom|selenium/.test(ua)) {
      isBot = true;
      reasons.push('bot_ua');
    }

    // No WebGL = headless
    if (getWebGL() === 'none' || getWebGL() === 'blocked') {
      reasons.push('no_webgl');
    }

    if (isBot || reasons.length >= 3) {
      // Log only — never touch the DOM
      console.log('%c[SHIELD] Possible bot: ' + reasons.join(', '), 'color:orange');
    }

    // Store fingerprint for repeat detection
    try {
      var visits = JSON.parse(localStorage.getItem('_gump_v') || '[]');
      visits.push({t: Date.now(), fp: fp, bot: isBot});
      if (visits.length > 100) visits = visits.slice(-100);
      localStorage.setItem('_gump_v', JSON.stringify(visits));
    } catch(e) {}
  }

  // Run after page loads
  if (document.readyState === 'complete') {
    plantCanaries();
    setTimeout(assess, 8000);  // assess after 8 seconds
  } else {
    window.addEventListener('load', function() {
      plantCanaries();
      setTimeout(assess, 8000);
    });
  }

  // Expose nothing. The shield is invisible.
})();
