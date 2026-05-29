(function() {
  // Plain-language readings for every tool output.
  // Attaches via MutationObserver — no changes needed in each tool.

  var PLACEHOLDERS = ['results will appear', 'paste', 'computing', 'measuring',
                      'detecting', 'analyzing', 'scanning', 'no output', 'error'];

  function isPlaceholder(text) {
    var t = text.toLowerCase().trim();
    return !t || PLACEHOLDERS.some(function(p) { return t.startsWith(p); });
  }

  // ── K/R/E/T ──────────────────────────────────────────────────────
  function readKRET(text) {
    var km = text.match(/K\s*=\s*([\d.]+)/i);
    var rm = text.match(/R\s*=\s*([\d.]+)/i);
    var tm = text.match(/T\s*=\s*([\d.]+)/i);
    var em = text.match(/E\s*=\s*([\d.]+)/i);
    var vm = text.match(/Verdict:\s*(\w+)/i);
    if (!km && !rm) return null;

    var K = km ? parseFloat(km[1]) : null;
    var R = rm ? parseFloat(rm[1]) : null;
    var T = tm ? parseFloat(tm[1]) : null;
    var verdict = vm ? vm[1] : null;

    var parts = [];

    if (K !== null) {
      if (K < 0.2)       parts.push('Barely any connection between these values');
      else if (K < 0.5)  parts.push('Loosely coupled — the parts are aware of each other but not coordinating');
      else if (K < 0.9)  parts.push('Moderate coupling — starting to act like a system');
      else if (K < 1.3)  parts.push('Well coupled — organized and responsive');
      else if (K < 1.6)  parts.push('Strongly coupled — well above the threshold where coherence kicks in');
      else if (K < 1.87) parts.push('Near the ceiling (1.868) — high energy density, powerful');
      else               parts.push('At the hard ceiling — maximum coupling');
    }

    if (R !== null) {
      var rDesc;
      if (R < 0.2)            rDesc = 'no shared rhythm yet';
      else if (R < 0.5)       rDesc = 'some coherence building';
      else if (R < 0.59)      rDesc = 'approaching the sweet spot (0.618) where living systems operate';
      else if (R < 0.67)      rDesc = 'right at the sweet spot — this is where life operates';
      else if (R < 0.85)      rDesc = 'well synchronized';
      else if (R < 0.97)      rDesc = 'tightly locked in';
      else                    rDesc = 'perfectly synchronized — either very healthy or very rigid';
      parts.push(rDesc);
    }

    if (T !== null) {
      if (T < 0.03)      parts.push('no tension (stable)');
      else if (T < 0.15) parts.push('some healthy tension');
      else if (T < 0.4)  parts.push('high tension — something wants to shift');
      else               parts.push('very high tension — needs to change');
    }

    if (verdict === 'COHERENT')      parts.push('coherent');
    else if (verdict === 'RANDOM')   parts.push('random — no detectable structure');
    else if (verdict === 'CONSTANT') parts.push('constant — no variation');

    if (!parts.length) return null;
    var sentence = parts[0];
    for (var i = 1; i < parts.length; i++) {
      sentence += (i === 1 ? ', ' : ', ') + parts[i];
    }
    return sentence + '.';
  }

  // ── PROTEIN ───────────────────────────────────────────────────────
  function readProtein(text) {
    var parts = [];

    var rgm = text.match(/Rg[^:]*:\s*([\d.]+)\s*[Åa]/i) || text.match(/Rg\s*=\s*([\d.]+)/i);
    if (rgm) {
      var rg = parseFloat(rgm[1]);
      if (rg < 5)        parts.push('Very compact protein (' + rg.toFixed(1) + ' Å)');
      else if (rg < 15)  parts.push('Small protein (' + rg.toFixed(1) + ' Å)');
      else if (rg < 25)  parts.push('Medium-sized protein (' + rg.toFixed(1) + ' Å)');
      else               parts.push('Large or unfolded protein (' + rg.toFixed(1) + ' Å)');
    }

    var aggm = text.match(/(\d+)\s*aggregation\s*region/i);
    if (aggm) {
      var n = parseInt(aggm[1]);
      if (n === 0)      parts.push('no sticky spots — structurally clean');
      else if (n === 1) parts.push('one region that may want to clump together');
      else              parts.push(n + ' regions that may want to clump — worth watching');
    }

    var pathm = text.match(/PATHOGENIC|BENIGN|LIKELY HARMFUL|LIKELY BENIGN/i);
    if (pathm) {
      var p = pathm[0].toUpperCase();
      if (p.includes('PATHOGENIC') || p.includes('HARMFUL'))
        parts.push('this mutation is likely harmful — it disrupts how the protein holds together');
      else
        parts.push('this mutation looks safe — no significant structural disruption detected');
    }

    var scorem = text.match(/score:\s*([\d.]+)/i);
    if (scorem && !pathm) {
      var s = parseFloat(scorem[1]);
      if (s > 0.5)       parts.push('high score (' + s.toFixed(2) + ') — significant effect detected');
      else if (s > 0.2)  parts.push('moderate score (' + s.toFixed(2) + ')');
      else               parts.push('low score (' + s.toFixed(2) + ') — minimal effect');
    }

    var secm = text.match(/helix[^:]*:\s*(\d+)/i);
    var betam = text.match(/sheet[^:]*:\s*(\d+)/i);
    if (secm || betam) {
      var hlen = secm ? parseInt(secm[1]) : 0;
      var blen = betam ? parseInt(betam[1]) : 0;
      if (hlen > blen * 2)      parts.push('mostly helical structure');
      else if (blen > hlen * 2) parts.push('mostly sheet structure');
      else if (hlen + blen > 0) parts.push('mixed helix-sheet structure');
    }

    if (!parts.length) return null;
    var sentence = parts[0];
    for (var i = 1; i < parts.length; i++) sentence += ', ' + parts[i];
    return sentence + '.';
  }

  // ── FREQUENCY / ORACLE ────────────────────────────────────────────
  function readFrequency(text) {
    var modem = text.match(/Frequencies found:\s*(\d+)/i) ||
                text.match(/(\d+)\s*mode/i);
    if (!modem) return null;
    var n = parseInt(modem[1]);
    var parts = [];

    if (n === 0) return 'No repeating patterns found in this data.';
    parts.push(n === 1 ? 'One repeating pattern found' : n + ' repeating patterns found');

    var periods = [];
    var re = /period\s+([\d.]+)\s*step/gi;
    var m;
    while ((m = re.exec(text)) !== null) periods.push(parseFloat(m[1]));
    if (periods.length) {
      var main = Math.round(periods[0]);
      parts.push('the main cycle repeats every ' + main + ' step' + (main === 1 ? '' : 's'));
    }

    var predm = text.match(/Prediction.*?(\d+)\s*step/i);
    if (predm) parts.push('forecast built ' + predm[1] + ' steps ahead');

    return parts.join(', ') + '.';
  }

  // ── PRIME / NUMBER ─────────────────────────────────────────────────
  function readPrime(text) {
    var pm = text.match(/π\([^)]+\)\s*=\s*([\d,]+)/i) ||
             text.match(/prime count[^:]*:\s*([\d,]+)/i) ||
             text.match(/(\d[\d,]+)\s*prime/i);
    if (!pm) return null;
    var count = parseInt(pm[1].replace(/,/g, ''));
    if (isNaN(count)) return null;
    return count.toLocaleString() + ' primes in that range.';
  }

  // ── GENERIC FALLBACK ──────────────────────────────────────────────
  function readGeneric(text) {
    var nums = text.match(/[-+]?\d+\.?\d*/g);
    if (!nums || nums.length < 2) return null;
    var vals = nums.map(Number).filter(function(n) { return isFinite(n); });
    if (!vals.length) return null;
    var mn = Math.min.apply(null, vals);
    var mx = Math.max.apply(null, vals);
    var mean = vals.reduce(function(a, b) { return a + b; }, 0) / vals.length;
    return vals.length + ' values — range ' + mn.toFixed(2) + ' to ' + mx.toFixed(2) +
           ', average ' + mean.toFixed(2) + '.';
  }

  // ── MAIN EXPLAIN ──────────────────────────────────────────────────
  function explain(text) {
    if (isPlaceholder(text)) return '';
    return readKRET(text) ||
           readProtein(text) ||
           readFrequency(text) ||
           readPrime(text) ||
           readGeneric(text) ||
           '';
  }

  // ── INJECT + WATCH ─────────────────────────────────────────────────
  function injectPlain(outputEl) {
    var plain = outputEl.nextElementSibling;
    if (!plain || !plain.classList.contains('explain-plain')) {
      plain = document.createElement('div');
      plain.className = 'explain-plain';
      plain.style.cssText = [
        'font-family:Georgia,serif',
        'font-size:0.82em',
        'color:#b8966e',
        'line-height:1.7',
        'padding:10px 4px 4px',
        'min-height:0',
        'transition:opacity 0.3s'
      ].join(';');
      outputEl.parentNode.insertBefore(plain, outputEl.nextSibling);
    }
    var reading = explain(outputEl.textContent || '');
    plain.textContent = reading;
    plain.style.display = reading ? '' : 'none';
  }

  document.addEventListener('DOMContentLoaded', function() {
    var el = document.getElementById('output');
    if (!el) return;
    injectPlain(el);
    var obs = new MutationObserver(function() { injectPlain(el); });
    obs.observe(el, { childList: true, subtree: true, characterData: true });
  });

})();
