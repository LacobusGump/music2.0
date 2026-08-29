// ═══════════════════════════════════════════════════
// GUMP OMNI-SEARCH — intelligent query interpretation
// Runs entirely client-side. No server. No API.
// Uses the site map + topic graph for semantic matching.
// ═══════════════════════════════════════════════════

(function() {
'use strict';

// ═══ SITE MAP — every page Harmonia knows ═══
var PAGES = [
  {id:'home',url:'/',name:'Home',summary:'137 coupled oscillators. The instrument, the research, the theory.',keys:'gump home overview what is this'},
  {id:'start-here',url:'/start-here/',name:'Start Here',summary:'No equations. A drummer found a shape in the math that keeps explaining things.',keys:'intro begin new start what is gump explain simple'},
        {id:'verification',url:'/verification/',name:'Machine Verification',summary:'30 Lean 4 modules, 3317 jobs, exit 0. E7, QEC, prime bounce, MC1R Weyl bound, consciousness threshold. Machine-checked.',keys:'lean verification proof machine checked exit 0 3317 norm_num mathlib formal'},
    {id:'failures',url:'/research/failures/',name:'What Didn\'t Work',summary:'90+ killed ideas. Every wrong turn shown. The honest part of the project.',keys:'failures killed wrong ideas honest kills graveyard what didnt work'},
  {id:'music-evolution',url:'/research/music-evolution/',name:'What Makes Music Good?',summary:'1/f timing. Euclidean rhythm. Dopamine in two phases. Embodiment signatures. Why music is universally good.',keys:'music good why universal 1/f timing euclidean rhythm dopamine embodiment'},
  {id:'the-drum',url:'/research/the-drum/',name:'The Drum',summary:'Why drums work. Phase-locking across the nervous system.',keys:'drum rhythm phase lock nervous system why drums hit hard beat'},
    {id:'prime-oracle',url:'/products/sensor/?mode=oracle',name:'Prime Oracle',summary:'Prime prediction from nothing. Explicit formula. 50K zeros computed live.',keys:'prime oracle prediction explicit formula zeros zeta 50k live compute'},
  {id:'research',url:'/research/',name:'All Research',summary:'Full atlas: 77 results across medicine, physics, language, markets, history. Same coupling, different costume.',keys:'all research full list everything atlas every page'},
  {id:'trail',url:'/trail/',name:'The Trail',summary:'Full chronological trail. Every session. How we got here.',keys:'trail history sessions chronological how did you build this'},
  {id:'playbook',url:'/playbook/',name:'Playbook',summary:'How to couple with AI honestly. The playbook that produced all this.',keys:'playbook how to AI couple honestly method guide'},
  {id:'love',url:'/love/',name:'Love',summary:'What is love? Same math. 1+1=3. The coupling constant of consciousness.',keys:'love what is love math 1+1=3 coupling constant consciousness'},
  {id:'play',url:'/play/',name:'Play',summary:'The instrument. Tilt your phone. Make music from motion.',keys:'play instrument phone tilt music motion make music'},
      ];

// ═══ INTERPRETATION PATTERNS — what the query probably means ═══
var INTERPRET = [
  {re:/\b(conscious|aware|mind|hard problem|qualia|sentient)\b/i, note:'Sounds like you\'re asking about consciousness — we have a number for it.'},
  {re:/\b(cancer|tumor|oncol)\b/i, note:'Cancer as runaway coupling — the K inverse rule explains why charge stabilizers work.'},
  {re:/\b(mc1r|anesthes|numb|dent|red hair|gene)\b/i, note:'MC1R — one gene variant, 26% shorter anesthesia. The graph math explains it.'},
  {re:/\b(time|arrow|entropy|why forward|past|future)\b/i, note:'Time as Landauer\'s receipt — the path exists, moving through it costs time.'},
  {re:/\b(ai psychos|crazy|delus|lesesucht|patholog|slander)\b/i, note:'You\'re in good company — every cognitive tool gets this treatment. Socrates said writing would destroy the mind.'},
  {re:/\b(prime|bounce|9\.12|trampoline|dispatch|gpu|speedup)\b/i, note:'Prime bounce — hardware architecture meets number theory. 9.12× on M4.'},
  {re:/\b(lean|proof|verif|machine.check|norm_num|exit 0)\b/i, note:'30 modules, 3317 jobs, exit 0. Machine-checked, not hand-waved.'},
  {re:/\b(love|what is love|1\+1|coupling|together)\b/i, note:'Love is a phase transition. Same math as consciousness. 1+1=3.'},
  {re:/\b(alz|parkin|protein|misfolding|tau|ALS|TDP)\b/i, note:'Protein misfolding as decoupling. The inverse rule: add charge to sticky surfaces.'},
  {re:/\b(K|coupling|R|fiedler|synchron)\b/i, note:'K measures coupling. R measures synchronization. Same math in every domain.'},
  {re:/\b(music|drum|rhythm|groove|beat)\b/i, note:'Music is coupling made audible. The drum phase-locks the nervous system.'},
  {re:/\b(reversibl|adiabat|landauer|bit eras|computation)\b/i, note:'Reversible computing: 224,000× cheaper than memorization. The math is proved.'},
  {re:/\b(fail|kill|wrong|dead|didn.t work)\b/i, note:'90+ killed ideas, all public. The graveyard is part of the proof.'},
];

// ═══ SCORING — fuzzy match query against a page ═══
function score(query, page) {
  var q = query.toLowerCase();
  var words = q.split(/\s+/).filter(function(w){ return w.length > 1; });
  var s = 0;

  // Exact match on name: big bonus
  if (page.name.toLowerCase().indexOf(q) !== -1) s += 60;

  // Word matches in keys (high weight)
  words.forEach(function(w) {
    if (page.keys.toLowerCase().indexOf(w) !== -1) s += 20;
    if (page.name.toLowerCase().indexOf(w) !== -1) s += 15;
    if (page.summary.toLowerCase().indexOf(w) !== -1) s += 8;
  });

  // Bigram bonus
  for (var i = 0; i < words.length - 1; i++) {
    var bi = words[i] + ' ' + words[i+1];
    if (page.keys.indexOf(bi) !== -1) s += 25;
    if (page.summary.toLowerCase().indexOf(bi) !== -1) s += 12;
  }

  return s;
}

// ═══ INTERPRET — get a smart note for the query ═══
function interpret(query) {
  for (var i = 0; i < INTERPRET.length; i++) {
    if (INTERPRET[i].re.test(query)) return INTERPRET[i].note;
  }
  return null;
}

// ═══ SEARCH — return top results ═══
function search(query, max) {
  if (!query || query.trim().length < 2) return [];
  max = max || 6;
  var scored = PAGES.map(function(p){ return {page:p, s:score(query, p)}; });
  scored = scored.filter(function(x){ return x.s > 0; });
  scored.sort(function(a,b){ return b.s - a.s; });
  return scored.slice(0, max).map(function(x){ return x.page; });
}

// ═══ RENDER — build the omni-box UI ═══
function buildOmniBox(container) {
  container.innerHTML = '';
  container.style.cssText = 'position:relative;width:100%;max-width:640px;margin:0 auto 32px;';

  var wrap = document.createElement('div');
  wrap.style.cssText = 'position:relative;';

  var input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Search or ask anything — consciousness, cancer, time, AI...';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.style.cssText = [
    'width:100%;box-sizing:border-box',
    'background:rgba(18,13,10,0.9)',
    'border:1px solid rgba(184,117,58,0.25)',
    'border-radius:10px',
    'padding:14px 48px 14px 18px',
    'color:#e8cfa0',
    'font-family:Georgia,serif',
    'font-size:0.88em',
    'outline:none',
    'transition:border-color 0.2s',
    'caret-color:#b8753a',
  ].join(';');

  var icon = document.createElement('div');
  icon.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="opacity:0.35"><circle cx="6.5" cy="6.5" r="5" stroke="#c9a44a" stroke-width="1.4"/><path d="M10.5 10.5L14 14" stroke="#c9a44a" stroke-width="1.4" stroke-linecap="round"/></svg>';
  icon.style.cssText = 'position:absolute;right:14px;top:50%;transform:translateY(-50%);pointer-events:none;';

  var dropdown = document.createElement('div');
  dropdown.style.cssText = [
    'position:absolute;top:calc(100% + 6px);left:0;right:0',
    'background:#100c09',
    'border:1px solid rgba(184,117,58,0.18)',
    'border-radius:10px',
    'overflow:hidden',
    'z-index:1000',
    'display:none',
    'box-shadow:0 8px 32px rgba(0,0,0,0.5)',
  ].join(';');

  wrap.appendChild(input);
  wrap.appendChild(icon);
  wrap.appendChild(dropdown);
  container.appendChild(wrap);

  var activeIdx = -1;
  var lastResults = [];

  function render(query) {
    var results = search(query, 6);
    var note = interpret(query);
    lastResults = results;
    activeIdx = -1;
    dropdown.innerHTML = '';

    if (!query || query.trim().length < 2) { dropdown.style.display = 'none'; return; }

    if (note) {
      var noteEl = document.createElement('div');
      noteEl.style.cssText = 'padding:10px 16px 8px;font-size:0.72em;color:rgba(184,117,58,0.7);border-bottom:1px solid rgba(255,255,255,0.05);font-style:italic;line-height:1.5;';
      noteEl.textContent = note;
      dropdown.appendChild(noteEl);
    }

    if (results.length === 0) {
      var empty = document.createElement('div');
      empty.style.cssText = 'padding:14px 16px;font-size:0.78em;color:#555;';
      empty.textContent = 'No results — try different words.';
      dropdown.appendChild(empty);
      dropdown.style.display = 'block';
      return;
    }

    results.forEach(function(page, i) {
      var item = document.createElement('a');
      item.href = page.url;
      item.setAttribute('data-idx', i);
      item.style.cssText = [
        'display:block;padding:10px 16px',
        'border-bottom:1px solid rgba(255,255,255,0.04)',
        'text-decoration:none',
        'transition:background 0.15s',
        'cursor:pointer',
      ].join(';');

      var title = document.createElement('div');
      title.style.cssText = 'font-size:0.82em;color:#c4a088;font-family:Futura,Century Gothic,sans-serif;letter-spacing:0.06em;margin-bottom:3px;';
      title.textContent = page.name;

      var sub = document.createElement('div');
      sub.style.cssText = 'font-size:0.72em;color:#666;line-height:1.5;';
      // Show first sentence of summary
      sub.textContent = page.summary.split('.')[0] + '.';

      item.appendChild(title);
      item.appendChild(sub);

      item.addEventListener('mouseenter', function() { setActive(i); });
      item.addEventListener('mouseleave', function() { setActive(-1); });
      dropdown.appendChild(item);
    });

    if (results.length > 0) {
      var seeAll = document.createElement('a');
      seeAll.href = '/research/';
      seeAll.style.cssText = 'display:block;padding:9px 16px;font-size:0.68em;color:rgba(184,117,58,0.4);font-family:Futura,Century Gothic,sans-serif;letter-spacing:0.1em;text-decoration:none;';
      seeAll.textContent = '→ VIEW ALL RESEARCH';
      dropdown.appendChild(seeAll);
    }

    dropdown.style.display = 'block';
  }

  function setActive(idx) {
    activeIdx = idx;
    var items = dropdown.querySelectorAll('a[data-idx]');
    items.forEach(function(el, i) {
      el.style.background = (i === idx) ? 'rgba(184,117,58,0.08)' : '';
      el.style.color = (i === idx) ? '#e8cfa0' : '';
    });
  }

  var debounceTimer;
  input.addEventListener('input', function() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function() { render(input.value); }, 80);
  });

  input.addEventListener('focus', function() {
    this.style.borderColor = 'rgba(184,117,58,0.5)';
    if (this.value.trim().length >= 2) render(this.value);
  });

  input.addEventListener('blur', function() {
    this.style.borderColor = 'rgba(184,117,58,0.25)';
    setTimeout(function() { dropdown.style.display = 'none'; }, 180);
  });

  input.addEventListener('keydown', function(e) {
    var items = dropdown.querySelectorAll('a[data-idx]');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(Math.min(activeIdx + 1, lastResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(Math.max(activeIdx - 1, -1));
    } else if (e.key === 'Enter') {
      if (activeIdx >= 0 && lastResults[activeIdx]) {
        window.location.href = lastResults[activeIdx].url;
      } else if (lastResults.length > 0) {
        window.location.href = lastResults[0].url;
      }
    } else if (e.key === 'Escape') {
      dropdown.style.display = 'none';
      input.blur();
    }
  });
}

// ═══ INIT — find containers and mount ═══
function init() {
  var containers = document.querySelectorAll('[data-gump-search]');
  containers.forEach(function(el) { buildOmniBox(el); });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

window.GumpSearch = { search: search, interpret: interpret };

})();
