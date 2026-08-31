// Boots /support/ and /radio/ in jsdom: that the banner mounts where it should,
// that dismissing it sticks, and that the support copy no longer describes the
// forty-eight research pages that were cut on 2026-08-29.
const {JSDOM}=require('/tmp/node_modules/jsdom');
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const R=p=>path.join(root,p);
const banner=fs.readFileSync(R('js/support-banner.js'),'utf8');
const pages=[['support',R('support/index.html'),false],
             ['radio',R('radio/index.html'),true]];
let bad=0;
(async()=>{
for(const [name,file,wantBanner] of pages){
  const errs=[];
  const dom=new JSDOM(fs.readFileSync(file,'utf8'),{runScripts:'outside-only',url:'http://localhost/'+name+'/',
    beforeParse(w){ w.onerror=(m,s,l,c,e)=>errs.push(String(e&&e.stack||m)); }});
  const w=dom.window,d=w.document;
  if(wantBanner){
    const marker=d.createElement('script'); marker.setAttribute('src','/js/support-banner.js');
    marker.dataset.tone='amber'; d.body.appendChild(marker);
    w.eval(banner);                                   // 'outside-only' won't run an appended <script>
  }
  await new Promise(r=>setTimeout(r,120));            // the banner waits for DOMContentLoaded
  const b=d.querySelector('.gump-support');
  const out=[];
  out.push(['parses without error', errs.length===0]);
  if(wantBanner){
    out.push(['banner mounted', !!b]);
    out.push(['banner is first in body', d.body.firstElementChild===b]);
    out.push(['banner sits above the fixed background canvas', !!b && w.getComputedStyle(b).zIndex==='2']);
    out.push(['banner links to /support/', !!(b&&b.querySelector('a[href="/support/"]'))]);
    out.push(['banner has a dismiss', !!(b&&b.querySelector('.gs-x'))]);
    if(b){ b.querySelector('.gs-x').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
      out.push(['dismiss removes it and is remembered',
        !d.querySelector('.gump-support') && !!w.localStorage.getItem('gump_support_banner')]); }
  } else {
    out.push(['no banner on the page that asks', !b]);
    out.push(['links to the album', !!d.querySelector('a[href="/radio/"]')]);
    out.push(['crypto is behind a disclosure', !!d.querySelector('details.cryptobox')]);
    out.push(['no dead 20-domains claim', !/20 domains|proteins, or primes/.test(d.body.textContent)]);
    out.push(['no doubled clause', (d.body.textContent.match(/changed how you see/g)||[]).length<=1]);
    out.push(['venmo intact', !!d.querySelector('a[href*="venmo"]')]);
  }
  console.log('\n== '+name);
  out.forEach(([n,ok])=>{ if(!ok) bad++; console.log((ok?'  ok  ':'  FAIL')+'  '+n); });
  errs.forEach(e=>console.log('  ERR '+e.split('\n')[0]));
}
console.log('\n'+(bad?bad+' failures':'all page checks passed'));
process.exit(bad?1:0);
})();
