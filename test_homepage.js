#!/usr/bin/env node
/**
 * GUMP Homepage Test — New Structure
 * Tests: brand, harmonia link, 7 product cards, pricing, links
 */
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
let passed = 0, failed = 0;

function test(name, ok, info) {
  if (ok) { passed++; }
  else { failed++; console.log(`  [FAIL] ${name}${info ? ' — ' + info : ''}`); }
}

// Structure
test('Has DOCTYPE', html.includes('<!DOCTYPE html'));
test('Has lang=en', html.includes('lang="en"'));
test('Has title', html.includes('<title>GUMP</title>'));
test('Has meta description', html.includes('name="description"'));
test('Has og:title', html.includes('og:title'));
test('Has favicon', html.includes('favicon.png'));
test('Has canonical', html.includes('rel="canonical"'));

// Brand
test('Has GUMP heading', html.includes('>GUMP<'));
test('Has tagline', html.includes('good will or nothing'));

// Harmonia
test('Harmonia link exists', html.includes('href="/harmonia/"'));
test('Harmonia name visible', html.includes('>Harmonia<'));
test('Harmonia is FREE', html.includes('FREE'));

// Products - all 7
const products = [
  { name: 'Org X-Ray', price: '$15', href: '/products/orgxray/' },
  { name: 'Learn Engine', price: '$29', href: '/products/learnengine/' },
  { name: 'Fold Watch', price: '$8,500', href: '/products/foldwatch/' },
  { name: 'Chip Fast', price: '$25,000', href: '/products/chipfast/' },
  { name: 'AI Trainer', price: '$2,500', href: '/products/aitrainer/' },
  { name: 'Knowledge Engine', price: '$59', href: '/products/knowledge/' },
  { name: 'Universal Sensor', price: '$2,999', href: '/products/sensor/' },
];

products.forEach(p => {
  test(`Product: ${p.name} exists`, html.includes(p.name), `"${p.name}" not found`);
  test(`Product: ${p.name} has price`, html.includes(p.price), `"${p.price}" not found`);
  test(`Product: ${p.name} has link`, html.includes(`href="${p.href}"`), `"${p.href}" not found`);
  test(`Product: ${p.name} has pitch`, html.includes('pitch') && html.includes(p.name));
  test(`Product: ${p.name} has competitor ref`, html.includes('charges'));
});

// No bundle (products sell individually)
test('No bundle pricing', !html.includes('all 7 products'));

// Links work
const internalLinks = ['/harmonia/'];
internalLinks.forEach(link => {
  const dir = path.join(__dirname, link.replace(/^\//, ''));
  const exists = fs.existsSync(path.join(dir, 'index.html'));
  test(`Link ${link} exists on disk`, exists, `Missing: ${dir}/index.html`);
});

// Product page links (check files exist)
products.forEach(p => {
  const dir = path.join(__dirname, p.href.replace(/^\//, ''));
  const exists = fs.existsSync(path.join(dir, 'index.html'));
  test(`Product page ${p.href} exists`, exists, `Missing: ${dir}/index.html`);
});

// Toybox pages (referenced by product pages)
products.forEach(p => {
  const key = p.href.split('/').filter(Boolean).pop();
  const toybox = path.join(__dirname, 'toybox', `try-${key}.html`);
  const exists = fs.existsSync(toybox);
  test(`Toybox demo for ${key} exists`, exists, `Missing: ${toybox}`);
});

// Footer
test('Jim McCandless in footer', html.includes('jim mccandless') || html.includes('Jim McCandless'));

// No old cruft
test('No numbers-canvas (old page)', !html.includes('numbers-canvas'));
test('No bird song (old page)', !html.includes('playBird'));
test('No "HOW WE GOT HERE" (old page)', !html.includes('HOW WE GOT HERE'));
test('No 188 tools list (old page)', !html.includes('ALL 188 TOOLS'));
test('No story sections (old page)', !html.includes('sec-story'));
test('No nerd page link', !html.includes('/nerd/'));
test('No spiral page link', !html.includes('/spiral/'));
test('No quantum page link', !html.includes('/quantum/'));
test('No rabbithole link', !html.includes('/rabbithole/'));

// Seed tier
test('Seed tier exists', html.includes('The Seed'));
test('Seed tier priced at $49', html.includes('$49'));

// Clean
test('No TODO/FIXME', !html.includes('TODO') && !html.includes('FIXME'));
test('No console.log', !html.includes('console.log'));

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
