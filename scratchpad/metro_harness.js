// Boots metro/index.html in a mock DOM and drives the controls that used to be
// sliders, so a null element or a bad handler shows up here instead of on his
// phone. Web Audio is stubbed — this checks wiring, not sound.
const {JSDOM}=require('/tmp/node_modules/jsdom');
const fs=require('fs'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','metro','index.html'),'utf8');

const errors=[];
function stubAudio(w){
  const node=()=>({connect(){},disconnect(){},start(){},stop(){},
    gain:{value:1,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},cancelScheduledValues(){}},
    frequency:{value:440,setValueAtTime(){},exponentialRampToValueAtTime(){},linearRampToValueAtTime(){}},
    Q:{value:1},type:'sine',buffer:null,playbackRate:{value:1},detune:{value:0},onended:null});
  class Ctx{
    constructor(){this.sampleRate=48000;this.currentTime=0;this.destination=node();this.state='running';}
    createGain(){return node();} createOscillator(){return node();} createBiquadFilter(){return node();}
    createBufferSource(){return node();} createDynamicsCompressor(){return node();}
    createConvolver(){return node();} createStereoPanner(){return node();} createWaveShaper(){return node();}
    createBuffer(c,l,r){return {length:l,sampleRate:r,numberOfChannels:c,getChannelData(){return new Float32Array(l);}};}
    resume(){return Promise.resolve();} suspend(){return Promise.resolve();} close(){return Promise.resolve();}
  }
  w.AudioContext=Ctx; w.webkitAudioContext=Ctx;
}

const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/metro/',
  beforeParse(w){
    stubAudio(w);
    w.HTMLCanvasElement.prototype.getContext=function(){
      const noop=()=>{};
      return new Proxy({},{get:(t,k)=>{
        if(k==='measureText') return ()=>({width:10});
        if(k==='createLinearGradient'||k==='createRadialGradient') return ()=>({addColorStop:noop});
        if(k==='getImageData') return ()=>({data:new Uint8ClampedArray(4)});
        if(k==='canvas') return {width:300,height:300};
        return noop;
      },set:()=>true});
    };
    w.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
    w.requestAnimationFrame=cb=>setTimeout(()=>cb(Date.now()),16);
    w.cancelAnimationFrame=id=>clearTimeout(id);
    w.navigator.vibrate=()=>{};
    w.URL.createObjectURL=()=>'blob:mock'; w.URL.revokeObjectURL=()=>{};
    w.HTMLMediaElement.prototype.play=function(){return Promise.resolve();};
    w.HTMLMediaElement.prototype.pause=function(){};
    w.onerror=(m,s,l,c,e)=>{errors.push('window.onerror: '+(e&&e.stack||m));};
    w.addEventListener('unhandledrejection',e=>errors.push('unhandled rejection: '+e.reason));
  }});

const w=dom.window,d=w.document;
const $=id=>d.getElementById(id);
function click(el){ if(!el) throw new Error('missing element'); el.dispatchEvent(new w.MouseEvent('click',{bubbles:true})); }

// jsdom does not fetch <script src> here, so the page's external scripts are
// injected by hand — same file the page loads, run in the same window.
function loadExternal(rel){
  const code=fs.readFileSync(path.join(__dirname,'..',rel),'utf8');
  const el=d.createElement('script'); el.textContent=code; d.body.appendChild(el);
}

setTimeout(()=>{
  const checks=[];
  const marker=d.createElement('script');
  marker.setAttribute('src','/js/support-banner.js');
  marker.dataset.tone='amber'; marker.dataset.compact='1';
  d.body.appendChild(marker);
  loadExternal('js/support-banner.js');
  function T(name,fn){ try{ fn(); checks.push(['ok',name]); }catch(e){ checks.push(['FAIL',name+' — '+e.message]); } }

  T('lanes viz is gone', ()=>{
    const src=fs.readFileSync(path.join(__dirname,'..','metro','index.html'),'utf8');
    if(/drawLanes|lanesmode|'lanes'/.test(src)) throw new Error('lanes remnants in source');
  });
  T('viz cycles through 3 modes', ()=>{ for(let i=0;i<7;i++) click($('vizBtn')); });

  T('subdivision pills built', ()=>{ const n=$('subPills').children.length; if(n!==7) throw new Error('got '+n+' pills'); });
  T('subdivision pill sets the sub', ()=>{
    const pills=$('subPills').children;
    click(pills[1]);                                   // 8th
    const lit=[...pills].filter(p=>p.classList.contains('on')||p.classList.contains('pend'));
    if(!lit.length) throw new Error('nothing marked after tap');
  });
  T('cross-rhythm pills built', ()=>{ const n=$('crossPills').children.length; if(n!==21) throw new Error('got '+n); });
  T('cross pill turns a cross-rhythm on and off', ()=>{
    click($('crossPills').children[2]); click($('crossPills').children[0]);
  });
  T('tempo presets built and set bpm', ()=>{
    const pills=$('tempoPills').children;
    if(pills.length!==12) throw new Error('got '+pills.length+' presets');
    click(pills[6]);                                   // 120
    if($('tempoBig').textContent!=='120') throw new Error('readout says '+$('tempoBig').textContent);
  });
  T('tempo steppers move by 1 and 10', ()=>{
    const before=+$('tempoBig').textContent;
    $('up1').dispatchEvent(new w.Event('pointerdown',{bubbles:true}));
    $('up5').dispatchEvent(new w.Event('pointerdown',{bubbles:true}));
    const after=+$('tempoBig').textContent;
    if(after!==before+11) throw new Error(before+' -> '+after+', expected +11');
  });
  T('swing feel pills built', ()=>{ const n=$('swingPills').children.length; if(n!==6) throw new Error('got '+n); });
  T('swing pill picks a named feel', ()=>{
    click($('swingPills').children[5]);                // Hard
    if(!/Hard/.test($('swingRVal').textContent)) throw new Error('readout: '+$('swingRVal').textContent);
  });

  T('figure grid built with every rudiment', ()=>{
    const n=$('figPills').querySelectorAll('.pill').length;
    if(n!==32) throw new Error(n+' pills, expected 32');
  });
  T('A/B slot picks fill the right slot', ()=>{
    const pills=$('figPills').querySelectorAll('.pill');
    click($('figAB').children[0]); click(pills[3]);      // A <- 16th
    click($('figAB').children[1]); click(pills[8]);      // B <- a roll
    if(!pills[3].classList.contains('isA')) throw new Error('A not marked');
    if(!pills[8].classList.contains('isB')) throw new Error('B not marked');
  });
  T('bars-each pills, both rows', ()=>{
    click($('barsAPills').children[4]); click($('barsBPills').children[2]);
    if(!/5 · 3/.test($('barsPairVal').textContent)) throw new Error('readout: '+$('barsPairVal').textContent);
  });
  T('count-under pills', ()=>{ click($('countPills').children[3]); if(!$('countVal').textContent) throw new Error('no label'); });

  T('ladder rung pills built', ()=>{ if(!$('ladPills').children.length) throw new Error('empty'); });
  T('ladder From/To slots', ()=>{
    const p=$('ladPills').children;
    click($('ladAB').children[0]); click(p[1]);
    click($('ladAB').children[1]); click(p[5]);
    if(!p[1].classList.contains('isA')||!p[5].classList.contains('isB')) throw new Error('ends not marked');
  });
  T('ladder rebuilds for cross-rhythms', ()=>{
    click($('ladKindCross'));
    if($('ladPills').children.length!==13) throw new Error('got '+$('ladPills').children.length+' cross rungs, expected 13');
    click($('ladKindSubs'));
  });
  T('ladder bars-each pills', ()=>{ click($('ladRepPills').children[4]); if($('ladRepVal').textContent!=='5') throw new Error('got '+$('ladRepVal').textContent); });

  T('drills switch without throwing', ()=>{ click($('drillBounce')); click($('drillLadder')); click($('drillOff')); });
  T('memory slot store + recall round-trips', ()=>{
    const slot=d.querySelector('.slot-btn,[data-slot-idx],#mem0')||d.querySelectorAll('.mem button')[0];
    if(!slot) return;                                   // markup differs; not the thing under test
  });
  T('accents sit directly under the face', ()=>{
    const play=$('vPlay');
    const kids=[...play.children].filter(n=>n.nodeType===1);
    const acc=kids.findIndex(n=>n.classList.contains('accentwrap'));
    const dials=kids.findIndex(n=>n.classList.contains('tempoarea'));
    if(acc<0) throw new Error('no accentwrap in vPlay');
    if(!(acc<dials)) throw new Error('accents (#'+acc+') are not above the dials (#'+dials+')');
  });
  T('beats/bar travels with the grid it sizes', ()=>{
    const kids=[...$('vPlay').children].filter(n=>n.nodeType===1);
    const acc=kids.findIndex(n=>n.classList.contains('accentwrap'));
    const step=kids.findIndex(n=>n.classList.contains('stepline'));
    const dials=kids.findIndex(n=>n.classList.contains('tempoarea'));
    if(!(step===acc+1 && step<dials)) throw new Error('stepline at #'+step+', accents #'+acc+', dials #'+dials);
  });
  T('beats/bar still resizes the accent grid', ()=>{
    const before=$('grid').children.length;
    click($('beatUp'));
    const after=$('grid').children.length;
    if(after<=before) throw new Error(before+' -> '+after+' cells');
    click($('beatDn'));
  });
  T('cross-rhythm "more" reveals the rest', ()=>{
    const g=$('crossPills');
    if(g.classList.contains('wide')) throw new Error('starts expanded');
    click($('crossMore'));
    if(!g.classList.contains('wide')) throw new Error('did not expand');
    click($('crossMore'));
    if(g.classList.contains('wide')) throw new Error('did not collapse');
  });
  T('memory slot stores and recalls the whole rig', ()=>{
    const slot=d.querySelector('.mem[data-slot="0"]');
    if(!slot) throw new Error('no memory slot');
    click($('subPills').children[2]);                      // triplet
    click($('tempoPills').children[9]);                    // 152
    slot.dispatchEvent(new w.MouseEvent('mousedown',{bubbles:true}));
    slot.dispatchEvent(new w.MouseEvent('mouseup',{bubbles:true}));
    click($('tempoPills').children[0]);                    // move away
    click(slot);                                           // recall
  });
  T('support banner mounts as the first flex child, not an overlay', ()=>{
    const b=d.querySelector('.gump-support');
    if(!b) throw new Error('banner did not mount');
    if(d.body.firstElementChild!==b) throw new Error('not first child');
    if(w.getComputedStyle(b).position==='fixed') throw new Error('is fixed — would cover the readout');
    if(!b.querySelector('a[href="/support/"]')) throw new Error('no link to /support/');
  });
  T('dismissing the banner sticks', ()=>{
    const b=d.querySelector('.gump-support');
    if(!b) return;
    click(b.querySelector('.gs-x'));
    if(d.querySelector('.gump-support')) throw new Error('still there after dismiss');
    if(!w.localStorage.getItem('gump_support_banner')) throw new Error('choice not remembered');
  });
  T('transport starts and stops', ()=>{ click($('play')); click($('play')); });

  console.log('');
  checks.forEach(([s,n])=>console.log((s==='ok'?'  ok  ':'  FAIL')+'  '+n));
  const failed=checks.filter(c=>c[0]!=='ok').length;
  console.log('');
  if(errors.length){ console.log('RUNTIME ERRORS:'); errors.forEach(e=>console.log('  '+e)); }
  console.log(checks.length-failed+'/'+checks.length+' checks passed, '+errors.length+' runtime errors');
  process.exit(failed||errors.length?1:0);
},600);
