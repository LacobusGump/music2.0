(function(){
'use strict';
var PASSWORD='(hm.<3)';
var body=document.body;
var src=body.getAttribute('data-md');
var gated=body.getAttribute('data-gated')==='true';
var label=body.getAttribute('data-label')||'33 Research';
var back=body.getAttribute('data-back')||'/research/33/';

function esc(s){return String(s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];});}
function inline(s){
  return esc(s)
    .replace(/`([^`]+)`/g,'<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g,'<em>$1</em>')
    .replace(/&quot;/g,'"');
}
function parseFront(md){
  var meta={},body=md;
  if(md.indexOf('---')===0){
    var end=md.indexOf('\n---',3);
    if(end>0){
      var fm=md.slice(3,end).trim().split(/\n/);
      fm.forEach(function(line){var i=line.indexOf(':');if(i>0)meta[line.slice(0,i).trim()]=line.slice(i+1).trim();});
      body=md.slice(end+4).trim();
    }
  }
  return {meta:meta,body:body};
}
function markdown(md){
  var out=[],lines=md.split(/\r?\n/),i=0;
  function closeList(){if(out.length&&out[out.length-1]==='__UL_OPEN__'){out[out.length-1]='<ul>';out.push('</ul>');}}
  while(i<lines.length){
    var line=lines[i];
    if(!line.trim()){closeList();i++;continue;}
    if(/^\|/.test(line.trim()) && i+1<lines.length && /^\|?\s*:?-{3,}/.test(lines[i+1].trim())){
      var heads=line.trim().replace(/^\||\|$/g,'').split('|').map(function(x){return inline(x.trim());});
      i+=2;var rows=[];
      while(i<lines.length && /^\|/.test(lines[i].trim())){rows.push(lines[i].trim().replace(/^\||\|$/g,'').split('|').map(function(x){return inline(x.trim());}));i++;}
      out.push('<div class="table-wrap"><table><thead><tr>'+heads.map(function(h){return '<th>'+h+'</th>';}).join('')+'</tr></thead><tbody>'+rows.map(function(r){return '<tr>'+r.map(function(c){return '<td>'+c+'</td>';}).join('')+'</tr>';}).join('')+'</tbody></table></div>');
      continue;
    }
    var h=line.match(/^(#{1,4})\s+(.+)$/);
    if(h){closeList();var level=Math.min(h[1].length+1,5);out.push('<h'+level+'>'+inline(h[2])+'</h'+level+'>');i++;continue;}
    var li=line.match(/^[-*]\s+(.+)$/);
    if(li){
      if(out[out.length-1]!=='__UL_OPEN__' && out[out.length-1]!=='<ul>')out.push('__UL_OPEN__');
      if(out[out.length-1]==='__UL_OPEN__')out[out.length-1]='<ul>';
      out.push('<li>'+inline(li[1])+'</li>');i++;continue;
    }
    closeList();
    var para=[line.trim()];i++;
    while(i<lines.length && lines[i].trim() && !/^(#{1,4})\s+/.test(lines[i]) && !/^[-*]\s+/.test(lines[i]) && !/^\|/.test(lines[i].trim())){para.push(lines[i].trim());i++;}
    out.push('<p>'+inline(para.join(' '))+'</p>');
  }
  closeList();
  return out.join('\n').replace(/__UL_OPEN__/g,'<ul></ul>');
}
function layoutShell(){
  document.title=label+' — GUMP';
  document.body.innerHTML='<main class="page"><a class="back" href="'+back+'">&larr; 33 Research</a><section id="mount"></section></main>';
}
function showGate(){
  layoutShell();
  document.getElementById('mount').innerHTML='<section class="gate"><div class="kicker">private shelf</div><h1>'+esc(label)+'</h1><p>Enter the archive frequency.</p><input id="pw" type="password" placeholder="hm" autofocus><div id="msg"></div></section>';
  var pw=document.getElementById('pw');
  pw.addEventListener('keydown',function(e){if(e.key==='Enter')check();});
  function check(){
    if(pw.value===PASSWORD){render();return;}
    document.getElementById('msg').textContent='wrong frequency';pw.value='';
  }
}
function render(){
  layoutShell();
  var mount=document.getElementById('mount');
  mount.innerHTML='<div class="loading">loading source…</div>';
  fetch(src).then(function(r){if(!r.ok)throw new Error('source not found');return r.text();}).then(function(md){
    var parsed=parseFront(md),title=parsed.meta.name||label,desc=parsed.meta.description||'';
    mount.innerHTML='<article class="paper"><div class="kicker">from the 33 archive</div><h1>'+inline(title)+'</h1>'+(desc?'<p class="deck">'+inline(desc)+'</p>':'')+'<div class="meta">source: <code>'+esc(src)+'</code></div><div class="body">'+markdown(parsed.body)+'</div></article>';
  }).catch(function(e){mount.innerHTML='<section class="paper"><h1>'+esc(label)+'</h1><p>Could not load source: <code>'+esc(src)+'</code></p></section>';});
}
if(gated)showGate();else render();
})();
