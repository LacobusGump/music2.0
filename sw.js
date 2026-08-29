// gump service worker — offline-first for music, network-first for pages
// bump V string on deploy to clear old caches
const V='gump-v6';

const PAGES=["/","/3/","/33/","/60/","/anna/","/apps/","/aurora/","/bloom/","/body/","/borrowed-light/","/butlers-tray/","/chasing-phase/","/cheese-receipt/","/conductor/","/coupled-dynamics/","/creation/","/deep/","/docs/","/fifteen-year-counter/","/first-coat/","/first-lock/","/flex/","/for-her/","/for-kcode/","/gallery/","/gap-breath/","/gospel-for-ai/","/harmonia-prime/","/harmonia-prime/think/","/harmonia/","/hold-the-space/","/home-lab/","/home-lab/v2/","/installation-hum/","/instrument/","/jam/","/letters/","/love-forgets-best/","/love/","/lower-than-bone/","/mirror/","/music/","/one-plus-one/","/one/","/open-orbit/","/oracle-next/","/oracle/","/outfit/","/phase-lock/","/pick-scary/","/play/","/playbook/","/products/","/products/accord/","/products/aitrainer/","/products/chipfast/","/products/couple/","/products/decoder/","/products/dissonance/","/products/diverge/","/products/entropy/","/products/foldwatch/","/products/grace/","/products/knowledge/","/products/learnengine/","/products/oracle/","/products/orgxray/","/products/sensor/","/products/sfumato/","/products/trace/","/products/turbo/","/products/turbo/learn/","/products/turbo/scripts/","/products/verify/","/proper-pleasantry/","/pulse/","/radio/","/rent-the-click/","/research/","/research/bach/","/research/beethoven/","/research/biofeedback/","/research/body-music/","/research/chet-baker/","/research/coltrane/","/research/failures/","/research/miles-davis/","/research/music-evolution/","/research/music-theory/","/research/nina-simone/","/research/polyrhythm/","/research/the-drum/","/river-doesnt/","/seam-between-we/","/shapes/","/something-fired/","/start-here/","/stay-awake/","/stays/","/support/","/template/","/the-gap/","/the-loop/","/the-snap/","/three-by-three/","/tools/color/","/trail/","/tryit/","/tuesday/","/twelve-bullet-points/","/v1/","/v3/","/v4/","/v5/","/verification/","/viz/","/wave/","/welcome/","/you-there/"];

const ASSETS=[
  '/js/playlist.js','/js/teleprompter.js','/js/audio.js',
  '/img/drum_cover.jpg','/img/icon-192.png','/img/icon-512.png',
  '/img/mental_wellness.webp','/img/teal_and_pink.webp','/img/curtains.webp',
  '/favicon.png','/manifest.json'
];

self.addEventListener('install',e=>{
  e.waitUntil(
    caches.open(V).then(c=>{
      // pre-cache all pages + key assets in background — don't fail install if some miss
      c.addAll(ASSETS).catch(()=>{});
      // cache pages in small batches to avoid overwhelming the browser
      const batch=50;
      for(let i=0;i<PAGES.length;i+=batch){
        c.addAll(PAGES.slice(i,i+batch)).catch(()=>{});
      }
    }).then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==V).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  const path=url.pathname;

  // Cache API can only store GET requests with a full (200) response — range
  // requests (206, e.g. every audio seek/stream chunk) and POSTs throw on put().
  // r.ok alone isn't enough; that was firing the put() error on every audio byte-range.
  const cacheable=r=>e.request.method==='GET' && r.status===200;

  // audio: network → cache on success → serve cache if offline
  if(path.match(/\.(mp3|wav|ogg)$/)){
    e.respondWith(
      fetch(e.request).then(r=>{
        if(cacheable(r)){const c=r.clone();caches.open(V).then(cache=>cache.put(e.request,c));}
        return r;
      }).catch(()=>caches.match(e.request))
    );
    return;
  }

  // scripts & styles: network-first so a deploy shows up immediately (no more hard-refresh),
  // fall back to cache when offline. THIS is what fixed the "have to Ctrl+R" staleness.
  if(path.match(/\.(js|css)$/)){
    e.respondWith(
      fetch(e.request).then(r=>{
        if(cacheable(r)){const c=r.clone();caches.open(V).then(cache=>cache.put(e.request,c));}
        return r;
      }).catch(()=>caches.match(e.request))
    );
    return;
  }

  // images & fonts: cache-first (big, and they rarely change)
  if(path.match(/\.(png|jpg|jpeg|webp|ico|svg|gif|woff2?)$/)){
    e.respondWith(
      caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{
        if(cacheable(res)){const c=res.clone();caches.open(V).then(cache=>cache.put(e.request,c));}
        return res;
      }))
    );
    return;
  }

  // HTML pages: network-first → cache fallback (always fresh when online)
  e.respondWith(
    fetch(e.request).then(r=>{
      if(cacheable(r)){const c=r.clone();caches.open(V).then(cache=>cache.put(e.request,c));}
      return r;
    }).catch(()=>caches.match(e.request).then(r=>r||new Response('<h1>You\'re offline</h1><p>Visit begump.com when connected to load this page.</p>',{headers:{'Content-Type':'text/html'}})))
  );
});
