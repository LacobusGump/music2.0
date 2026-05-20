(function(){
'use strict';
var path=location.pathname.replace(/\/+$/,'/');
if(path!=='/products/'&&path!=='/products/index.html')return;

function boot(){
  var page=document.querySelector('.page');
  if(!page||page.dataset.productsRoom)return;
  page.dataset.productsRoom='1';
  document.documentElement.classList.add('products-room','products-clean');

  addStyle();
  addField();
  buildOffer(page);
  organizeConductors(page);
  organizeToolSections(page);
}

function addStyle(){
  var style=document.createElement('style');
  style.textContent = ''+
  'html.products-clean body{background:#120d0a;overflow-x:hidden;color:#c4a088}'+
  'html.products-clean body:before{content:"";position:fixed;inset:0;z-index:0;pointer-events:none;opacity:.10;background:radial-gradient(circle at 50% 12%,rgba(184,117,58,.18),transparent 34%),linear-gradient(180deg,rgba(18,13,10,.05),rgba(18,13,10,.88))}'+
  'html.products-clean #products-field{position:fixed;inset:0;width:100vw;height:100vh;z-index:0;pointer-events:none;opacity:.36}'+
  'html.products-clean .page{position:relative;z-index:1;max-width:1080px!important;padding:34px 22px 105px!important}'+
  'html.products-clean .back{display:inline-flex!important;margin-bottom:34px!important;color:rgba(196,160,136,.54)!important}'+
  'html.products-clean h1{font-size:clamp(2.1rem,7vw,4.6rem)!important;font-weight:100!important;line-height:.9!important;letter-spacing:.14em!important;text-transform:uppercase!important;text-shadow:0 0 34px rgba(184,117,58,.14)}'+
  'html.products-clean .sub{max-width:620px!important;margin:16px auto 22px!important;line-height:1.9!important;color:rgba(196,160,136,.70)!important}'+
  '.products-offer{max-width:860px;margin:0 auto 24px;padding:26px clamp(18px,4vw,34px);border:1px solid rgba(232,207,160,.12);border-radius:24px;background:linear-gradient(180deg,rgba(18,13,10,.84),rgba(9,6,5,.58));box-shadow:0 22px 60px rgba(0,0,0,.18),0 0 0 1px rgba(255,255,255,.016) inset;text-align:left}'+
  '.offer-kicker{font-family:Futura,"Century Gothic",system-ui,sans-serif;font-size:.58em;letter-spacing:.20em;text-transform:uppercase;color:rgba(184,117,58,.74);margin-bottom:10px}'+
  '.products-offer h2{font-family:Futura,"Century Gothic",system-ui,sans-serif;font-size:clamp(1.25rem,3.4vw,2.15rem);line-height:1.08;font-weight:300;letter-spacing:.035em;color:#e8cfa0;margin:0 0 12px;text-align:left}'+
  '.products-offer p{max-width:660px;margin:0;color:rgba(196,160,136,.72);font-size:.84em;line-height:1.9}'+
  '.offer-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}'+
  '.offer-actions a,.path-card{font-family:Futura,"Century Gothic",system-ui,sans-serif;text-decoration:none!important;border:1px solid rgba(184,117,58,.14);border-radius:999px;background:rgba(18,13,10,.46);color:rgba(232,207,160,.66);transition:all .25s ease}'+
  '.offer-actions a{padding:9px 14px;font-size:.68em;letter-spacing:.08em;text-transform:uppercase}'+
  '.offer-actions a.primary{background:rgba(184,117,58,.14);border-color:rgba(232,207,160,.24);color:#e8cfa0}'+
  '.offer-actions a:hover,.path-card:hover{transform:translateY(-2px);border-color:rgba(232,207,160,.32);color:#e8cfa0}'+
  '.products-paths{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:22px}'+
  '.path-card{display:block;border-radius:18px;padding:14px 15px;background:rgba(9,6,5,.32)}'+
  '.path-card b{display:block;color:#d0a35f;font-weight:400;font-size:.78em;letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px}'+
  '.path-card span{display:block;color:rgba(196,160,136,.58);font-size:.70em;line-height:1.55;font-family:Georgia,serif;letter-spacing:0;text-transform:none}'+
  '.products-runes{display:flex;flex-wrap:wrap;gap:7px;margin-top:18px}'+
  '.products-runes span{font-family:Futura,"Century Gothic",system-ui,sans-serif;font-size:.52em;letter-spacing:.10em;text-transform:uppercase;padding:5px 9px;border:1px solid rgba(184,117,58,.10);border-radius:999px;background:rgba(18,13,10,.32);color:rgba(232,207,160,.42)}'+
  '.products-runes b{font-weight:400;color:rgba(184,117,58,.88)}'+
  '.products-conductors{max-width:860px;margin:0 auto 30px}'+
  '.conductors-head{display:flex;align-items:end;justify-content:space-between;gap:16px;margin:0 0 10px;color:rgba(196,160,136,.54)}'+
  '.conductors-head h3{font-family:Futura,"Century Gothic",system-ui,sans-serif;font-weight:300;letter-spacing:.12em;text-transform:uppercase;font-size:.72em;color:rgba(184,117,58,.76);margin:0}'+
  '.conductors-head p{margin:0;font-size:.70em;line-height:1.5;color:rgba(196,160,136,.48)}'+
  '.conductors-list{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}'+
  '.conductor-item{min-width:0;border:1px solid rgba(184,117,58,.10);border-radius:18px;background:rgba(18,13,10,.48);padding:0;overflow:hidden}'+
  'html.products-clean .drop{display:block!important;margin:0!important;padding:15px 14px!important;border:0!important;border-bottom:1px solid rgba(184,117,58,.08)!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;font-size:.72em!important;line-height:1.55!important;color:#d0a35f!important;text-align:left!important}'+
  'html.products-clean .drop:hover{transform:none!important;background:rgba(184,117,58,.045)!important;color:#e8cfa0!important}'+
  '.conductor-item .drop-note{padding:0 14px 14px!important;margin:0!important;text-align:left!important;font-size:.66em!important;line-height:1.55!important;color:rgba(196,160,136,.46)!important}'+
  '.conductor-item .drop-note a,.conductor-item .drop-note span{color:rgba(196,160,136,.46)!important}'+
  '.products-section{max-width:860px;margin:12px auto;border:1px solid rgba(184,117,58,.11);border-radius:20px;background:rgba(18,13,10,.40);overflow:hidden}'+
  '.products-section[open]{background:rgba(18,13,10,.54);border-color:rgba(184,117,58,.17)}'+
  '.products-section summary{cursor:pointer;list-style:none;display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;padding:16px 18px;font-family:Futura,"Century Gothic",system-ui,sans-serif;color:rgba(232,207,160,.78)}'+
  '.products-section summary::-webkit-details-marker{display:none}'+
  '.summary-title{font-size:.78em;letter-spacing:.14em;text-transform:uppercase;color:#d0a35f}'+
  '.summary-count{font-size:.58em;letter-spacing:.12em;text-transform:uppercase;color:rgba(196,160,136,.42);border:1px solid rgba(184,117,58,.10);border-radius:999px;padding:4px 8px}'+
  '.summary-note{grid-column:1/-1;font-family:Georgia,serif;font-size:.72em;line-height:1.6;color:rgba(196,160,136,.50);letter-spacing:0;text-transform:none;margin-top:1px}'+
  'html.products-clean .grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;padding:0 14px 16px!important}'+
  'html.products-clean .card{min-height:112px!important;border-radius:15px!important;padding:14px!important;background:linear-gradient(180deg,rgba(18,13,10,.72),rgba(9,6,5,.50))!important;border-color:rgba(184,117,58,.10)!important;box-shadow:0 0 0 1px rgba(255,255,255,.012) inset!important}'+
  'html.products-clean .card:hover{transform:translateY(-3px)!important;border-color:rgba(232,207,160,.24)!important;box-shadow:0 18px 42px rgba(0,0,0,.18),0 0 28px rgba(184,117,58,.052)!important}'+
  'html.products-clean .card-name{color:#d0a35f!important;letter-spacing:.065em!important;font-size:.88em!important}'+
  'html.products-clean .card-desc{color:rgba(196,160,136,.58)!important;line-height:1.62!important;font-size:.70em!important;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}'+
  'html.products-clean .card canvas{width:58px!important;height:36px!important;filter:drop-shadow(0 0 8px rgba(184,117,58,.08));opacity:.76}'+
  'html.products-clean .pip{max-width:860px;margin:28px auto 0!important;border-radius:18px!important;background:rgba(18,13,10,.48)!important}'+
  'html.products-clean .foot{margin-top:38px!important;color:rgba(139,74,46,.74)!important}'+
  '@media(max-width:880px){.products-paths,.conductors-list,html.products-clean .grid{grid-template-columns:1fr!important}.conductors-head{display:block}.conductors-head p{margin-top:6px}.products-offer{border-radius:20px}.products-section summary{grid-template-columns:1fr}.summary-count{justify-self:start}}';
  document.head.appendChild(style);
}

function addField(){
  if(document.getElementById('products-field'))return;
  var field=document.createElement('canvas');
  field.id='products-field';
  field.setAttribute('aria-hidden','true');
  document.body.insertBefore(field,document.body.firstChild);
  startField(field);
}

function buildOffer(page){
  var sub=page.querySelector('.sub');
  if(!sub||page.querySelector('.products-offer'))return;
  var offer=document.createElement('section');
  offer.className='products-offer';
  offer.innerHTML=''+
    '<div class="offer-kicker">Start here</div>'+
    '<h2>Bring the thing. The tools tell you what it is doing.</h2>'+
    '<p>Numbers, text, proteins, training curves, conversations, systems. Everything stays local. The framework measures coupling, sync, cost, and tension — then points to the next move.</p>'+
    '<div class="offer-actions"><a class="primary" href="/tryit/">Drop any data</a><a href="#products-tools">Browse the tool rooms</a><a href="/docs/">Install begump</a></div>'+
    '<div class="products-runes"><span><b>K</b> coupling</span><span><b>R</b> order</span><span><b>E</b> cost</span><span><b>T</b> tension</span><span><b>local</b> first</span><span><b>free</b> always</span></div>'+
    '<div class="products-paths">'+
      '<a class="path-card" href="#section-numbers"><b>I have numbers</b><span>signals, metrics, rhythms, logs, sensor streams</span></a>'+
      '<a class="path-card" href="#section-text"><b>I have text</b><span>documents, conversations, orgs, knowledge maps</span></a>'+
      '<a class="path-card" href="#section-systems"><b>I watch a system</b><span>training runs, flows, divergence, circular patterns</span></a>'+
      '<a class="path-card" href="#section-protein"><b>I have a protein</b><span>sequence in, folding risk out</span></a>'+
      '<a class="path-card" href="#section-build"><b>I want to build</b><span>compiler, placement, verification, reusable tools</span></a>'+
      '<a class="path-card" href="#section-visuals"><b>I want visuals</b><span>living fields, templates, browser-native demos</span></a>'+
    '</div>';
  sub.parentNode.insertBefore(offer,sub.nextSibling);
}

function organizeConductors(page){
  if(page.querySelector('.products-conductors'))return;
  var drops=Array.prototype.slice.call(page.querySelectorAll('.drop'));
  if(!drops.length)return;
  var panel=document.createElement('section');
  panel.className='products-conductors';
  panel.innerHTML='<div class="conductors-head"><h3>Conductors</h3><p>Use these when the data shape matters more than the tool name.</p></div><div class="conductors-list"></div>';
  var list=panel.querySelector('.conductors-list');
  var offer=page.querySelector('.products-offer');
  if(offer&&offer.parentNode)offer.parentNode.insertBefore(panel,offer.nextSibling);
  else page.insertBefore(panel,page.firstChild);

  drops.forEach(function(drop){
    var item=document.createElement('div');
    item.className='conductor-item';
    var note=drop.nextElementSibling;
    item.appendChild(drop);
    if(note&&note.tagName==='DIV'&&!note.classList.contains('grid')&&!note.classList.contains('group-label')&&!note.classList.contains('products-offer')){
      note.classList.add('drop-note');
      item.appendChild(note);
    }
    list.appendChild(item);
  });
}

function organizeToolSections(page){
  var notes={
    numbers:'signals, metrics, measurements, rhythms',
    protein:'sequence in, folding risk out',
    text:'documents, people, orgs, meaning maps',
    systems:'training runs, flows, divergence, circular patterns',
    birthday:'a date as orbital physics',
    build:'compilers, placement, verification',
    visuals:'embedding the living field anywhere'
  };
  var first=null;
  Object.keys(notes).forEach(function(id){
    var grid=document.getElementById(id);
    if(!grid||grid.parentNode.classList.contains('products-section'))return;
    var label=grid.previousElementSibling;
    if(label&&label.classList.contains('group-note'))label=label.previousElementSibling;
    if(!label||!label.classList.contains('group-label'))return;
    var title=label.textContent.replace(/\s+/g,' ').trim();
    var count=grid.children.length;
    var details=document.createElement('details');
    details.className='products-section';
    details.id='section-'+id;
    var summary=document.createElement('summary');
    summary.innerHTML='<span class="summary-title">'+escapeHtml(title)+'</span><span class="summary-count">'+count+' tool'+(count===1?'':'s')+'</span><span class="summary-note">'+escapeHtml(notes[id])+'</span>';
    details.appendChild(summary);
    label.parentNode.insertBefore(details,label);
    label.parentNode.removeChild(label);
    details.appendChild(grid);
    if(!first)first=details;
  });
  var marker=document.createElement('div');
  marker.id='products-tools';
  marker.style.cssText='height:1px;max-width:860px;margin:0 auto;';
  if(first&&first.parentNode&&!document.getElementById('products-tools'))first.parentNode.insertBefore(marker,first);
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a[href^="#section-"]');
    if(!a)return;
    var target=document.querySelector(a.getAttribute('href'));
    if(target&&target.tagName==='DETAILS')target.open=true;
  });
}

function escapeHtml(s){
  return String(s).replace(/[&<>"]/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch];});
}

function startField(field){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var ctx=field.getContext('2d'),W=0,H=0,dpr=1,t=0,pts=[];
  function resize(){
    dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;
    field.width=W*dpr;field.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
    pts=[];
    for(var i=0;i<89;i++){
      var a=i*2.399963229728653,r=Math.sqrt(i/89)*Math.min(W,H)*.46;
      pts.push({x:W/2+Math.cos(a)*r,y:H*.30+Math.sin(a)*r*.52,p:(i*.137)%6.283,z:.35+((i*13)%37)/37*.8});
    }
  }
  function draw(){
    t+=.004;ctx.clearRect(0,0,W,H);ctx.globalCompositeOperation='lighter';
    var cx=W/2,cy=H*.30,s=Math.min(W,H);
    ctx.strokeStyle='rgba(184,117,58,.016)';ctx.lineWidth=.65;
    for(var r=0;r<4;r++){ctx.beginPath();ctx.ellipse(cx,cy,s*(.12+r*.09),s*(.055+r*.04),Math.sin(t*.16+r)*.16,0,Math.PI*2);ctx.stroke();}
    for(var i=0;i<pts.length;i++){
      var p=pts[i],br=.5+.5*Math.sin(p.p+t*2+i*.03),dr=12*p.z;
      p.x+=(cx+Math.cos(i*2.399963229728653+t*.26)*Math.sqrt(i/89)*s*.46-p.x)*.0025;
      p.y+=(cy+Math.sin(i*2.399963229728653+t*.22)*Math.sqrt(i/89)*s*.25-p.y)*.0025;
      var x=p.x+Math.cos(p.p+t)*dr,y=p.y+Math.sin(p.p+t*.8)*dr*.62,a=.010+br*.024,rr=1+br*2.2;
      var g=ctx.createRadialGradient(x,y,0,x,y,rr*8);
      g.addColorStop(0,'rgba(232,207,160,'+(a*.28).toFixed(4)+')');
      g.addColorStop(.38,'rgba(184,117,58,'+(a*.54).toFixed(4)+')');
      g.addColorStop(.78,'rgba(122,154,106,'+(a*.10).toFixed(4)+')');
      g.addColorStop(1,'rgba(184,117,58,0)');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,rr*8,0,Math.PI*2);ctx.fill();
    }
    ctx.globalCompositeOperation='source-over';requestAnimationFrame(draw);
  }
  resize();addEventListener('resize',resize,{passive:true});draw();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
