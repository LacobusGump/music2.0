const V='gump-v1';
const SHELL=[
  '/','/radio/','/research/','/research/framework/','/research/theory/',
  '/research/consciousness/','/research/body-music/','/research/the-chain/',
  '/research/music-evolution/','/research/the-groove/','/research/the-drum/',
  '/research/cancer-signaling/','/research/alzheimers/','/research/aging-fatigue/',
  '/harmonia/','/mirror/','/trail/','/shapes/','/flex/',
  '/js/playlist.js','/js/teleprompter.js','/js/audio.js',
  '/img/drum_cover.jpg','/img/icon-192.png','/img/icon-512.png',
  '/favicon.png','/manifest.json'
];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  // audio: network first, cache on success, don't block on miss
  if(url.pathname.match(/\.(mp3|wav|ogg)$/)){
    e.respondWith(fetch(e.request).then(r=>{
      const clone=r.clone();
      caches.open(V).then(c=>c.put(e.request,clone));
      return r;
    }).catch(()=>caches.match(e.request)));
    return;
  }
  // everything else: cache first, fall back to network
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{
    if(res.status===200){const clone=res.clone();caches.open(V).then(c=>c.put(e.request,clone));}
    return res;
  })));
});
