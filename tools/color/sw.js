const CACHE='color-truth-v1';
const URLS=['/tools/color/','/tools/color/index.html','/favicon.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(URLS))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).catch(()=>new Response('Offline — open the app from your home screen.',{headers:{'Content-Type':'text/plain'}})))));
