// Oracle Next runtime — copied behavior, cleaner rendering. No changes to /oracle/.
(function(){
'use strict';

function $(id){ return document.getElementById(id); }

window.theta = function theta(t){
  if(t<1)return 0;
  return(t/2)*Math.log(t/(2*Math.PI))-t/2-Math.PI/8+1/(48*t)+7/(5760*t*t*t)+31/(80640*t*t*t*t*t);
};
window.Z = function Z(t){
  if(t<2)return 0;
  var a=Math.sqrt(t/(2*Math.PI)),N=Math.max(1,Math.floor(a)),p=a-N,th=window.theta(t),s=0;
  for(var n=1;n<=N;n++)s+=Math.cos(th-t*Math.log(n))/Math.sqrt(n);
  s*=2;
  var d=Math.cos(2*Math.PI*p);
  var C0=Math.abs(d)>1e-8?Math.cos(2*Math.PI*(p*p-p-1/16))/d:0.5;
  s+=Math.pow(-1,N-1)*Math.pow(2*Math.PI/t,0.25)*C0;
  return s;
};
window.Li = function Li(x){
  if(x<=1)return 0;
  var g=0.5772156649015329,lnx=Math.log(x),tot=g+Math.log(Math.abs(lnx)),term=1;
  for(var k=1;k<200;k++){term*=lnx/k;tot+=term/k;if(Math.abs(term/k)<1e-15)break;}
  var ln2=Math.log(2),li2=g+Math.log(ln2),t2=1;
  for(var k2=1;k2<100;k2++){t2*=ln2/k2;li2+=t2/k2;}
  return tot-li2;
};

var known={1e4:1229,1e5:9592,1e6:78498,1e7:664579,1e8:5761455,1e9:50847534};

function fmt(n){return Number(n).toLocaleString();}
function metric(label,value,big){return '<div class="metric"><div class="label">'+label+'</div><div class="value '+(big?'big':'')+'">'+value+'</div></div>';}

window.run = function run(){
  var input = $('x-input');
  var resultEl = $('result');
  var x=parseFloat(input.value.replace(/,/g,''));
  if(isNaN(x)||x<2){resultEl.innerHTML='<p class="note">Enter a number ≥ 2.</p>';return;}
  resultEl.innerHTML='<p class="note"><span style="color:var(--gold)">Scanning Z(t) for zeros…</span><br>Building the explicit correction in your browser.</p>';

  setTimeout(function(){
    var t0=performance.now();
    var logx=Math.log(x),sqrtx=Math.sqrt(x);
    var K=Math.max(200,Math.min(20000,Math.floor(5.1*sqrtx/Math.max(Math.pow(x,0.25),1))));
    var correction=0,count=0,t=9,prevZ=window.Z(t),zerosList=[];

    while(count<K&&t<5000000){
      var step=t>14?Math.max(0.02,(2*Math.PI/Math.max(Math.log(t/(2*Math.PI)),0.1))/8):0.3;
      t+=step;var currZ=window.Z(t);
      if(prevZ*currZ<0){
        var lo=t-step,hi=t;
        for(var i=0;i<50;i++){var mid=(lo+hi)/2;if(window.Z(lo)*window.Z(mid)<0)hi=mid;else lo=mid;}
        var gamma=(lo+hi)/2;
        var phase=gamma*logx;
        var xRe=sqrtx*Math.cos(phase),xIm=sqrtx*Math.sin(phase);
        var rMag2=0.25+gamma*gamma;
        correction+=2*(xRe*0.5+xIm*gamma)/(rMag2*logx);
        count++;
        if(count<=20)zerosList.push(gamma);
      }
      prevZ=currZ;
    }

    var liX=window.Li(x);
    var mob=-window.Li(Math.sqrt(x))/2-window.Li(Math.pow(x,1/3))/3;
    if(x>32)mob-=window.Li(Math.pow(x,0.2))/5;
    if(x>64)mob+=window.Li(Math.pow(x,1/6))/6;
    var offset=window.Li(2.001)-Math.log(2);
    var out=Math.round(liX-correction+mob+offset);
    var errEst=Math.round(5.1*sqrtx/Math.max(count,1));
    var elapsed=((performance.now()-t0)/1000).toFixed(2);

    var html='<div class="result-grid">';
    html+=metric('result','π('+fmt(x)+') = '+fmt(out),true);
    html+=metric('error estimate','±'+fmt(errEst));
    html+=metric('zeros used',fmt(count));
    html+=metric('time',elapsed+'s');
    html+='</div>';

    if(known[x]!==undefined){
      var actual=known[x], realErr=out-actual;
      html+='<div class="known">';
      html+='<div class="result-grid">';
      html+=metric('actual π('+fmt(x)+')',fmt(actual));
      html+=metric('true error',(realErr>=0?'+':'')+realErr);
      html+='</div></div>';
    }

    html+='<div class="zeros"><div style="color:var(--dim);margin-bottom:4px;">First zeros found:</div>';
    zerosList.forEach(function(g,i){html+='γ<sub>'+(i+1)+'</sub> = '+g.toFixed(8)+'<br>';});
    if(count>20)html+='… and '+fmt(count-20)+' more';
    html+='</div>';
    resultEl.innerHTML=html;
  },50);
};

function drawChain(){
  var c=$('chain-canvas');if(!c)return;
  var ctx=c.getContext('2d'),W=c.width,H=c.height;
  function solve(V,x0,x1,E,N){N=N||400;var dx=(x1-x0)/(N-1),x=[],psi=[];for(var i=0;i<N;i++){x.push(x0+i*dx);psi.push(0);}psi[0]=0;psi[1]=dx;var h2=dx*dx;for(i=1;i<N-1;i++){var fp=V(x[i-1])-E,fc=V(x[i])-E,fn=V(x[i+1])-E;var num=2*psi[i]*(1+5*h2*fc/12)-psi[i-1]*(1-h2*fp/12);var den=1-h2*fn/12;if(Math.abs(den)<1e-30)den=1e-30;psi[i+1]=num/den;if(Math.abs(psi[i+1])>1e12){for(var j=0;j<=i+1;j++)psi[j]*=1e-12;}}var norm=0;for(i=0;i<N;i++)norm+=psi[i]*psi[i]*dx;norm=Math.sqrt(norm)||1;for(i=0;i<N;i++)psi[i]/=norm;return{x:x,psi:psi};}
  function countNodes(psi){var n=0;for(var i=1;i<psi.length;i++)if(psi[i-1]*psi[i]<0)n++;return n;}
  function findE(V,x0,x1,target,Elo,Ehi){for(var it=0;it<60;it++){var Em=(Elo+Ehi)/2,r=solve(V,x0,x1,Em),n=countNodes(r.psi);if(n>target)Ehi=Em;else if(n<target)Elo=Em;else{if(Math.abs(r.psi[r.psi.length-1])>Math.abs(r.psi[r.psi.length-2]))Ehi=Em;else Elo=Em;}if(Math.abs(Ehi-Elo)<1e-10)break;}return(Elo+Ehi)/2;}
  var levels=[
    {name:'String',color:'#e8cfa0',V:function(x){return 0;},x0:0,x1:Math.PI,Elo:0.01,Ehi:50,desc:'V = 0 between walls'},
    {name:'Atom',color:'#74c7d2',V:function(r){return -1/Math.max(r,0.05);},x0:0.01,x1:30,Elo:-2,Ehi:-0.001,desc:'V = -1/r'},
    {name:'Molecule',color:'#d29678',V:function(x){return -1.5/(Math.abs(x-1)+0.4)-1.5/(Math.abs(x+1)+0.4);},x0:-8,x1:8,Elo:-10,Ehi:2,desc:'double well'},
    {name:'Crystal',color:'#b8753a',V:function(x){for(var i=0;i<6;i++)if(Math.abs(x-i*2)<0.6)return -2;return 0;},x0:-1,x1:13,Elo:-3,Ehi:3,desc:'periodic lattice'},
    {name:'Protein',color:'#8ee6ce',V:function(x){return 0.3*x*x-2*Math.exp(-(x-2)*(x-2))-1.5*Math.exp(-(x+2)*(x+2))-Math.exp(-x*x);},x0:-5,x1:5,Elo:-4,Ehi:8,desc:'folding landscape'},
    {name:'Neuron',color:'#b98adf',V:function(x){return 5*(x+0.07)*(x+0.07)-0.8*Math.exp(-(x*x)/0.001);},x0:-0.2,x1:0.15,Elo:-1,Ehi:15,desc:'membrane potential'},
    {name:'Mind',color:'#e8e4dc',V:function(x){return 0.1*x*x-2*Math.cos(x)-0.5*Math.cos(2*x);},x0:-10,x1:10,Elo:-4,Ehi:10,desc:'coupled oscillators'}
  ];
  var results=[];for(var li=0;li<levels.length;li++){var lev=levels[li],E=findE(lev.V,lev.x0,lev.x1,0,lev.Elo,lev.Ehi),r=solve(lev.V,lev.x0,lev.x1,E,300);results.push({x:r.x,psi:r.psi,E:E,nodes:countNodes(r.psi)});} 
  ctx.fillStyle='#070606';ctx.fillRect(0,0,W,H);var levelH=H/levels.length,waveW=W-124;
  for(li=0;li<levels.length;li++){
    lev=levels[li];var res=results[li],y0=li*levelH+10,yMid=y0+levelH/2;
    ctx.fillStyle=lev.color;ctx.font='12px Georgia';ctx.textAlign='left';ctx.fillText(lev.name,10,yMid-22);
    ctx.fillStyle='#6f5a4b';ctx.font='9px Georgia';ctx.fillText(lev.desc,10,yMid-9);ctx.fillText('nodes: '+res.nodes+' | E = '+res.E.toFixed(3),10,yMid+4);
    var psiMax=0;for(var i=0;i<res.psi.length;i++)if(Math.abs(res.psi[i])>psiMax)psiMax=Math.abs(res.psi[i]);psiMax=psiMax||1;
    var xOff=104,amp=levelH*.35;
    ctx.beginPath();ctx.moveTo(xOff,yMid);for(i=0;i<res.psi.length;i++){var px=xOff+i/res.psi.length*waveW,py=yMid-res.psi[i]/psiMax*amp;ctx.lineTo(px,py);}ctx.lineTo(xOff+waveW,yMid);ctx.closePath();ctx.fillStyle=lev.color+'22';ctx.fill();
    ctx.beginPath();for(i=0;i<res.psi.length;i++){px=xOff+i/res.psi.length*waveW;py=yMid-res.psi[i]/psiMax*amp;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.strokeStyle=lev.color;ctx.lineWidth=1.55;ctx.stroke();
    ctx.beginPath();ctx.moveTo(xOff,yMid);ctx.lineTo(xOff+waveW,yMid);ctx.strokeStyle='#2c241f';ctx.lineWidth=.5;ctx.stroke();
    if(li<levels.length-1){ctx.beginPath();ctx.moveTo(W/2,y0+levelH-5);ctx.lineTo(W/2,y0+levelH+5);ctx.strokeStyle='#4b3a30';ctx.setLineDash([3,3]);ctx.stroke();ctx.setLineDash([]);}
  }
  ctx.fillStyle='#e8cfa0';ctx.font='14px Georgia';ctx.textAlign='center';ctx.fillText('One equation. Seven potentials. Reality emerges.',W/2,H-10);
}

document.addEventListener('DOMContentLoaded',function(){
  var form=$('oracle-form');
  if(form)form.addEventListener('submit',function(e){e.preventDefault();window.run();});
  drawChain();
});
})();