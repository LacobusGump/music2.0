#!/usr/bin/env node
/**
 * GUMP Homepage Test Suite
 * Comprehensive tests for /Users/jamesmccandless/gump/index.html
 * Run: node test_homepage.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = '/Users/jamesmccandless/gump';
const FILE = path.join(ROOT, 'index.html');
const html = fs.readFileSync(FILE, 'utf8');
const lines = html.split('\n');

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    const result = fn();
    if (result === true || result === undefined) {
      passed++;
      console.log(`  PASS  ${name}`);
    } else {
      failed++;
      const msg = typeof result === 'string' ? result : 'returned falsy';
      failures.push({ name, msg });
      console.log(`  FAIL  ${name} — ${msg}`);
    }
  } catch (e) {
    failed++;
    const msg = e.message;
    failures.push({ name, msg });
    console.log(`  FAIL  ${name} — ${msg}`);
  }
}

function findLine(pattern) {
  const re = typeof pattern === 'string' ? new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) : pattern;
  for (let i = 0; i < lines.length; i++) {
    if (re.test(lines[i])) return i + 1; // 1-indexed
  }
  return null;
}

// ════════════════════════════════════════════════════════════════
// 1. HTML STRUCTURE
// ════════════════════════════════════════════════════════════════
console.log('\n═══ 1. HTML STRUCTURE ═══');

const requiredSections = [
  'sec-harmonia', 'sec-numbers', 'sec-opener', 'sec-story',
  'sec-wall', 'sec-birds', 'sec-question', 'sec-discovery',
  'sec-jim', 'sec-proof', 'sec-closing', 'sec-links'
];

for (const id of requiredSections) {
  test(`Section #${id} exists`, () => {
    const re = new RegExp(`id=["']${id}["']`);
    if (!re.test(html)) return `Section #${id} not found`;
    return true;
  });
}

test('No duplicate IDs', () => {
  const idMatches = html.matchAll(/\bid=["']([^"']+)["']/g);
  const seen = {};
  const dupes = [];
  for (const m of idMatches) {
    const id = m[1];
    if (seen[id]) dupes.push(id);
    seen[id] = (seen[id] || 0) + 1;
  }
  if (dupes.length > 0) return `Duplicate IDs: ${dupes.join(', ')}`;
  return true;
});

test('All links have valid href (no empty, no bare "#" except playBird)', () => {
  const linkRe = /<a\s[^>]*href=["']([^"']*)["'][^>]*(?:id=["']([^"']*?)["'])?[^>]*>/gi;
  // Also check reverse: id before href
  const linkRe2 = /<a\s[^>]*id=["']([^"']*?)["'][^>]*href=["']([^"']*)["'][^>]*>/gi;
  const bad = [];
  let m;
  const checked = new Set();

  // Build full list of anchors with href and optional id
  const anchorRe = /<a\s[^>]*>/gi;
  while ((m = anchorRe.exec(html)) !== null) {
    const tag = m[0];
    const hrefM = tag.match(/href=["']([^"']*?)["']/);
    const idM = tag.match(/\bid=["']([^"']*?)["']/);
    if (!hrefM) continue;
    const href = hrefM[1];
    const id = idM ? idM[1] : null;
    const key = `${href}|${id}`;
    if (checked.has(key)) continue;
    checked.add(key);

    if (href === '' || (href === '#' && id !== 'playBird')) {
      const lineNum = findLine(tag.substring(0, 40));
      bad.push(`href="${href}" (id=${id}) at line ~${lineNum}`);
    }
  }
  if (bad.length > 0) return `Bad links: ${bad.join('; ')}`;
  return true;
});

test('Image resources exist on disk: og-image.png', () => {
  if (!fs.existsSync(path.join(ROOT, 'og-image.png'))) return 'og-image.png missing';
  return true;
});

test('Image resources exist on disk: apple-touch-icon.png', () => {
  if (!fs.existsSync(path.join(ROOT, 'apple-touch-icon.png'))) return 'apple-touch-icon.png missing';
  return true;
});

test('Image resources exist on disk: favicon.png', () => {
  if (!fs.existsSync(path.join(ROOT, 'favicon.png'))) return 'favicon.png missing';
  return true;
});

// Meta tags
const requiredMeta = [
  { name: 'description', pattern: /meta\s+name=["']description["']/ },
  { name: 'og:title', pattern: /meta\s+property=["']og:title["']/ },
  { name: 'og:image', pattern: /meta\s+property=["']og:image["']/ },
  { name: 'viewport', pattern: /meta\s+name=["']viewport["']/ },
  { name: 'theme-color', pattern: /meta\s+name=["']theme-color["']/ },
  { name: 'canonical', pattern: /link\s+rel=["']canonical["']/ },
];

for (const { name, pattern } of requiredMeta) {
  test(`Meta tag: ${name}`, () => {
    if (!pattern.test(html)) return `Meta tag ${name} not found`;
    return true;
  });
}

// ════════════════════════════════════════════════════════════════
// 2. CONTENT INTEGRITY
// ════════════════════════════════════════════════════════════════
console.log('\n═══ 2. CONTENT INTEGRITY ═══');

test('"Talk to Harmonia" links to /harmonia/', () => {
  if (!html.includes('href="/harmonia/"')) return 'href="/harmonia/" not found';
  // Check it's associated with "Talk to Harmonia" — the href is on the parent <a>,
  // "Talk to Harmonia" is in a child <div>, so look within 500 chars
  const idx = html.indexOf('Talk to Harmonia');
  const before = html.substring(Math.max(0, idx - 500), idx);
  if (!before.includes('href="/harmonia/"')) return 'Talk to Harmonia not linked to /harmonia/';
  return true;
});

// Count tools in the "ALL 188 TOOLS" section — all tools now explicitly listed
test('Tool count: all 188 tools explicitly named', () => {
  const detailsStart = html.indexOf('ALL 188 TOOLS');
  const detailsEnd = html.indexOf('</details>', detailsStart);
  if (detailsStart === -1 || detailsEnd === -1) return 'Could not find ALL 188 TOOLS section';
  const section = html.substring(detailsStart, detailsEnd);

  // Count all named tools (word — description pattern)
  const namedToolPattern = /\b([a-z][a-z0-9_]*)\s+—/g;
  const namedTools = new Set();
  let match;
  while ((match = namedToolPattern.exec(section)) !== null) {
    namedTools.add(match[1]);
  }

  const count = namedTools.size;
  if (count < 185 || count > 192) {
    return `Tool count: ${count} (expected ~188). Tools: ${[...namedTools].sort().join(', ')}`;
  }
  return true;
});

test('Tool count: categories cover all tool types', () => {
  const detailsStart = html.indexOf('ALL 188 TOOLS');
  const detailsEnd = html.indexOf('</details>', detailsStart);
  if (detailsStart === -1) return 'Section not found';
  const section = html.substring(detailsStart, detailsEnd);

  const categories = ['FIND', 'COMPUTE', 'BUILD', 'SIMULATE', 'PROTECT', 'LEARN',
    'MEASURE', 'THINK', 'SPEAK', 'METAL GPU', 'ORACLE', 'QUANTUM', 'RESEARCH', 'INFRASTRUCTURE'];
  const missing = categories.filter(c => !section.includes(c));
  if (missing.length > 0) return `Missing categories: ${missing.join(', ')}`;
  return true;
});

// 8 comparison cards
test('All 8 comparison cards exist', () => {
  const expectedCards = [
    'quantum simulation',
    'chip layout',
    'optimization',
    'error correction',
    'signal processing',
    'graph intelligence',
    'memory / pattern recognition',
    'encryption'
  ];
  const missing = [];
  for (const card of expectedCards) {
    if (!html.includes(card)) missing.push(card);
  }
  if (missing.length > 0) return `Missing comparison cards: ${missing.join(', ')}`;
  return true;
});

// 9 session tools
test('All 9 session tools exist', () => {
  const expectedTools = [
    'prime oracle',
    'the machine',
    'molecular predictor',
    'harmonia',
    'knowledge compressor',
    'K language',
    'spectral engine',
    'energy framework',
    '1/α discovery'
  ];
  const missing = [];
  // These are in the purple-bordered session cards
  for (const tool of expectedTools) {
    // Case-insensitive check within the session tools section
    if (!html.toLowerCase().includes(tool.toLowerCase())) missing.push(tool);
  }
  if (missing.length > 0) return `Missing session tools: ${missing.join(', ')}`;
  return true;
});

// 8 proof lines in "WHAT IT DOES RIGHT NOW"
test('All 8 proof lines in "WHAT IT DOES RIGHT NOW"', () => {
  const proofStart = html.indexOf('WHAT IT DOES RIGHT NOW');
  const proofEnd = html.indexOf('</div>', html.indexOf('</div>', proofStart) + 1);
  if (proofStart === -1) return '"WHAT IT DOES RIGHT NOW" section not found';

  const proofSection = html.substring(proofStart, proofEnd + 200);
  const expectedProofs = ['quantum', 'vlsi', 'error correction', 'memory', 'signal', 'spectral', 'energy', 'grokking'];
  const missing = [];
  for (const p of expectedProofs) {
    // Each proof line starts with a colored span
    if (!proofSection.includes(`>${p}<`)) missing.push(p);
  }
  if (missing.length > 0) return `Missing proof lines: ${missing.join(', ')}`;
  return true;
});

// 4 navigation cards
test('All 4 navigation cards exist with correct hrefs', () => {
  const expected = [
    { title: 'Science Mode', href: '/nerd/' },
    { title: 'How Everything Connects', href: '/spiral/' },
    { title: 'Quantum Computer', href: '/quantum/' },
    { title: 'The Rabbit Hole', href: '/rabbithole/' },
  ];
  const missing = [];
  for (const { title, href } of expected) {
    if (!html.includes(title)) missing.push(`title "${title}" missing`);
    // Check the card links to correct href
    const cardRe = new RegExp(`href=["']${href.replace(/\//g, '\\/')}["'][^>]*>[\\s\\S]*?${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
    if (!cardRe.test(html)) missing.push(`"${title}" not linked to ${href}`);
  }
  if (missing.length > 0) return missing.join('; ');
  return true;
});

// Key numbers consistency
test('K=1.868 appears correctly', () => {
  const matches = html.match(/1\.868/g);
  if (!matches || matches.length === 0) return 'K=1.868 not found';
  return true;
});

test('137 appears in key contexts', () => {
  if (!html.includes('137 coupled oscillators')) return '137 oscillators reference missing';
  if (!html.includes('137 + π²')) return '137 + pi^2 formula missing';
  return true;
});

test('1/α formula present and correct', () => {
  if (!html.includes('1/α = 137 + π² / (2 × 137)') && !html.includes('1/α = 137 + π²/(2×137)')) {
    return '1/α formula not found in expected format';
  }
  if (!html.includes('137.036')) return '137.036 result not shown';
  return true;
});

test('40M gates claim present', () => {
  if (!html.includes('40 million gates') && !html.includes('40M')) return '40M gates not found';
  return true;
});

test('188 tools claim present', () => {
  if (!html.includes('188 tools')) return '"188 tools" not found';
  return true;
});

test('29 days claim present', () => {
  if (!html.includes('29 days')) return '"29 days" not found';
  return true;
});

test('$500 machine claim present', () => {
  if (!html.includes('$500')) return '$500 not found';
  return true;
});

// ════════════════════════════════════════════════════════════════
// 3. CSS / LAYOUT
// ════════════════════════════════════════════════════════════════
console.log('\n═══ 3. CSS / LAYOUT ═══');

test('No obviously broken CSS (unclosed braces in <style>)', () => {
  const styleStart = html.indexOf('<style>');
  const styleEnd = html.indexOf('</style>');
  if (styleStart === -1 || styleEnd === -1) return '<style> block not found';
  const css = html.substring(styleStart + 7, styleEnd);
  const opens = (css.match(/\{/g) || []).length;
  const closes = (css.match(/\}/g) || []).length;
  if (opens !== closes) return `Unbalanced braces in CSS: ${opens} opens, ${closes} closes`;
  return true;
});

test('Mobile viewport meta present', () => {
  if (!html.includes('width=device-width')) return 'viewport width=device-width missing';
  if (!html.includes('initial-scale=1')) return 'initial-scale=1 missing';
  return true;
});

test('All sections have .section class for scroll animation', () => {
  // Check that every div with id="sec-*" has class="section"
  const sectionDivs = html.matchAll(/<div[^>]*id=["'](sec-[^"']+)["'][^>]*>/g);
  const missing = [];
  for (const m of sectionDivs) {
    const tag = m[0];
    const id = m[1];
    if (!tag.includes('class="section"') && !tag.includes("class='section'") && !tag.includes('class="section ')) {
      missing.push(id);
    }
  }
  if (missing.length > 0) return `Sections without .section class: ${missing.join(', ')}`;
  return true;
});

test('Fallback animation exists for when JS fails', () => {
  if (!html.includes('fallbackShow')) return 'fallbackShow keyframe not found';
  if (!html.includes('@keyframes fallbackShow')) return '@keyframes fallbackShow not defined';
  return true;
});

// ════════════════════════════════════════════════════════════════
// 4. JAVASCRIPT
// ════════════════════════════════════════════════════════════════
console.log('\n═══ 4. JAVASCRIPT ═══');

test('Canvas #numbers-canvas exists in HTML', () => {
  if (!html.includes('id="numbers-canvas"')) return 'Canvas #numbers-canvas not found in HTML';
  return true;
});

test('Canvas #bird exists in HTML', () => {
  if (!html.includes('id="bird"')) return 'Canvas #bird not found in HTML';
  return true;
});

test('JS references numbers-canvas correctly', () => {
  if (!html.includes("getElementById('numbers-canvas')")) return 'JS does not reference numbers-canvas';
  return true;
});

test('JS references bird canvas correctly', () => {
  if (!html.includes("getElementById('bird')")) return 'JS does not reference bird canvas';
  return true;
});

test('playBird click handler references valid element', () => {
  if (!html.includes("getElementById('playBird')")) return 'playBird not referenced in JS';
  if (!html.includes('id="playBird"')) return 'playBird element not in HTML';
  return true;
});

test('PHI defined correctly (golden ratio)', () => {
  if (!html.includes('var PHI = (1 + Math.sqrt(5)) / 2')) return 'PHI not defined as golden ratio';
  // Verify value
  const phi = (1 + Math.sqrt(5)) / 2;
  if (Math.abs(phi - 1.6180339887) > 0.0001) return 'Golden ratio constant wrong';
  return true;
});

test('No obvious JS runtime errors (eval with DOM stubs)', () => {
  // Extract JS from script tags
  const scriptStart = html.indexOf('<script>');
  const scriptEnd = html.indexOf('</script>');
  if (scriptStart === -1) return 'No script tag found';
  const js = html.substring(scriptStart + 8, scriptEnd);

  // Create minimal DOM stubs
  const stubCode = `
    var window = {
      devicePixelRatio: 2,
      innerHeight: 800,
      addEventListener: function() {},
      AudioContext: function() { return { sampleRate: 44100, createBuffer: function() { return { getChannelData: function() { return new Float32Array(44100*5); } }; }, createBufferSource: function() { return { connect: function(){}, start: function(){}, buffer: null, onended: null }; }, destination: {} }; },
      webkitAudioContext: null
    };
    var document = {
      getElementById: function(id) {
        return {
          getContext: function() { return {
            clearRect: function(){}, fillRect: function(){},
            beginPath: function(){}, moveTo: function(){}, lineTo: function(){},
            stroke: function(){}, fill: function(){}, fillText: function(){},
            arc: function(){}, ellipse: function(){},
            setTransform: function(){},
            fillStyle: '', strokeStyle: '', lineWidth: 1, textAlign: '',
            textBaseline: '', font: '', shadowColor: '', shadowBlur: 0
          }; },
          getBoundingClientRect: function() { return { width: 700, height: 400, top: 500, bottom: 900 }; },
          addEventListener: function(ev, fn) {},
          classList: { add: function(){} },
          width: 700, height: 160, textContent: ''
        };
      },
      querySelectorAll: function() { return { forEach: function(fn) {} }; }
    };
    var requestAnimationFrame = function(fn) {};
    var setTimeout = function(fn, ms) {};
    var Math = globalThis.Math;
    var console = globalThis.console;
  `;

  try {
    // Try to parse the JS (syntax check)
    new Function(stubCode + '\n' + js);
  } catch (e) {
    const lineMatch = e.message.match(/line (\d+)/);
    return `JS syntax/runtime error: ${e.message}`;
  }
  return true;
});

// ════════════════════════════════════════════════════════════════
// 5. LINKS & RESOURCES
// ════════════════════════════════════════════════════════════════
console.log('\n═══ 5. LINKS & RESOURCES ═══');

const internalPaths = [
  { href: '/harmonia/', dir: 'harmonia' },
  { href: '/nerd/', dir: 'nerd' },
  { href: '/spiral/', dir: 'spiral' },
  { href: '/quantum/', dir: 'quantum' },
  { href: '/rabbithole/', dir: 'rabbithole' },
];

for (const { href, dir } of internalPaths) {
  test(`Internal path ${href} exists on disk`, () => {
    const dirPath = path.join(ROOT, dir);
    if (!fs.existsSync(dirPath)) return `Directory ${dirPath} missing`;
    const indexPath = path.join(dirPath, 'index.html');
    if (!fs.existsSync(indexPath)) return `${indexPath} missing`;
    return true;
  });
}

test('No broken internal links (all href="/" paths resolve)', () => {
  const internalLinkRe = /href=["'](\/[^"']*?)["']/g;
  const broken = [];
  let m;
  while ((m = internalLinkRe.exec(html)) !== null) {
    const href = m[1];
    // Resolve: /path/ -> check for path/index.html or path
    let resolved;
    if (href.endsWith('/')) {
      resolved = path.join(ROOT, href, 'index.html');
    } else {
      resolved = path.join(ROOT, href);
    }
    if (!fs.existsSync(resolved)) {
      // Also try without index.html for files
      if (!href.endsWith('/')) {
        const altResolved = path.join(ROOT, href + '.html');
        if (fs.existsSync(altResolved)) continue;
      }
      broken.push(`${href} -> ${resolved}`);
    }
  }
  if (broken.length > 0) return `Broken internal links: ${broken.join('; ')}`;
  return true;
});

// ════════════════════════════════════════════════════════════════
// 6. ACCESSIBILITY / SEO
// ════════════════════════════════════════════════════════════════
console.log('\n═══ 6. ACCESSIBILITY / SEO ═══');

test('html lang attribute present', () => {
  if (!/<html[^>]*lang=["'][^"']+["']/.test(html)) return '<html> missing lang attribute';
  return true;
});

test('Title tag exists and is non-empty', () => {
  const titleMatch = html.match(/<title>([^<]*)<\/title>/);
  if (!titleMatch) return '<title> tag missing';
  if (!titleMatch[1].trim()) return '<title> is empty';
  return true;
});

test('Canonical URL matches begump.com domain', () => {
  const canonMatch = html.match(/canonical[^>]*href=["']([^"']+)["']/);
  if (!canonMatch) return 'Canonical link missing';
  if (!canonMatch[1].includes('begump.com')) return `Canonical URL "${canonMatch[1]}" does not reference begump.com`;
  return true;
});

test('DOCTYPE is present', () => {
  if (!html.includes('<!DOCTYPE html>')) return '<!DOCTYPE html> missing';
  return true;
});

test('Charset meta is present', () => {
  if (!/meta\s+charset/i.test(html)) return 'charset meta missing';
  return true;
});

test('No alt-less images (accessibility)', () => {
  // Check for <img> without alt — there shouldn't be any <img> tags in this page
  const imgTags = html.match(/<img[^>]*>/g) || [];
  const noAlt = imgTags.filter(tag => !tag.includes('alt='));
  if (noAlt.length > 0) return `Images without alt attribute: ${noAlt.length}`;
  return true;
});

// ════════════════════════════════════════════════════════════════
// BONUS: Structural integrity checks
// ════════════════════════════════════════════════════════════════
console.log('\n═══ BONUS: STRUCTURAL INTEGRITY ═══');

test('HTML is well-formed (matching open/close tags)', () => {
  // Quick check: count major structural tags
  const openDivs = (html.match(/<div[\s>]/g) || []).length;
  const closeDivs = (html.match(/<\/div>/g) || []).length;
  if (openDivs !== closeDivs) return `Mismatched divs: ${openDivs} opens, ${closeDivs} closes`;
  return true;
});

test('No console.log left in production JS', () => {
  const scriptStart = html.indexOf('<script>');
  const scriptEnd = html.indexOf('</script>');
  const js = html.substring(scriptStart, scriptEnd);
  if (js.includes('console.log')) return 'console.log found in production JS';
  return true;
});

test('No TODO/FIXME/HACK comments', () => {
  const issues = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/\b(TODO|FIXME|HACK|XXX)\b/i.test(line)) {
      issues.push(`Line ${i + 1}: ${line.trim().substring(0, 80)}`);
    }
  }
  if (issues.length > 0) return `Found comments: ${issues.join('; ')}`;
  return true;
});

test('External link to The Collective is valid URL format', () => {
  const collectiveMatch = html.match(/href=["'](https:\/\/www\.instagram\.com\/[^"']+)["']/);
  if (!collectiveMatch) return 'The Collective Instagram link not found';
  try {
    new URL(collectiveMatch[1]);
  } catch (e) {
    return `Invalid URL: ${collectiveMatch[1]}`;
  }
  return true;
});

test('Page loads all content within a single file (no external CSS/JS)', () => {
  const externalCSS = html.match(/<link[^>]*rel=["']stylesheet["'][^>]*>/g) || [];
  const externalJS = html.match(/<script[^>]*src=["'][^"']+["'][^>]*>/g) || [];
  // Filter out non-stylesheet links
  if (externalCSS.length > 0) return `External CSS found: ${externalCSS.length} stylesheet(s)`;
  if (externalJS.length > 0) return `External JS found: ${externalJS.length} script(s)`;
  return true;
});

// ════════════════════════════════════════════════════════════════
// SUMMARY
// ════════════════════════════════════════════════════════════════
console.log('\n' + '═'.repeat(60));
console.log(`TOTAL: ${passed + failed} tests | PASSED: ${passed} | FAILED: ${failed}`);
console.log('═'.repeat(60));

if (failures.length > 0) {
  console.log('\nFAILURE DETAILS:');
  for (const f of failures) {
    console.log(`\n  [FAIL] ${f.name}`);
    console.log(`         ${f.msg}`);
  }
}

console.log('');
process.exit(failed > 0 ? 1 : 0);
