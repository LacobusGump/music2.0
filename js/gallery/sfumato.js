(function(){
'use strict';
var cv=document.getElementById('g-canvas'),cx=cv&&cv.getContext('2d');if(!cx)return;
var W=0,H=0,dpr=1,t=0,TAU=Math.PI*2,GA=2.39996322,veils=[],mouse={x:0,y:0,on:false};
var word=document.querySelector('.g-word'),meter=document.querySelector('.g-meter');
function rgba(r,g,b,a){return 'rgba('+r+','+g+','+b+','+Math.max(0,Math.min(1,a)).toFixed(4)+')'}
function resize(){dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;cv.width=W*dpr;cv.height=H*dpr;cx.setTransform(dpr,0,0,dpr,0,0);build()}
function target(i){var u=i/136,a=i*GA,face=Math.min(W,H)*.23;var ring=Math.floor(i%7),r=Math.sqrt(i)/Math.sqrt(137)*face;
  var x=W/2+Math.cos(a)*r*.72,y=H*.48+Math.sin(a)*r*1.08;
  if(ring===0){x=W/2-Math.min(W,H)*.07+Math.cos(a)*face*.06;y=H*.43+Math.sin(a)*face*.035}
  if(ring===1){x=W/2+Math.min(W,H)*.07+Math.cos(a)*face*.06;y=H*.43+Math.sin(a)*face*.035}
  if(ring===2){x=W/2+Math.cos(a)*face*.045;y=H*.50+Math.sin(a)*face*.10}
  if(ring===3){x=W/2+(u-.5)*face*.55;y=H*.59+Math.sin(u*TAU)*face*.045}
  return{x:x,y:y}
}
function build(){veils=[];for(var i=0;i<137;i++){var p=target(i);veils.push({x:Math.random()*W,y:Math.random()*H,tx:p.x,ty:p.y,p:Math.random()*TAU,r:18+Math.random()*42,h:Math.random(),drift:Math.random()*TAU})}}
function draw(){t+=.016;cx.fillStyle='rgba(7,5,4,.115)';cx.fillRect(0,0,W,H);cx.globalCompositeOperation='lighter';var R=0,cx0=0,cy0=0;for(var i=0;i<veils.length;i++){var v=veils[i];v.p+=.006+v.h*.008;v.drift+=.003;var presence=mouse.on?Math.max(0,1-Math.hypot(mouse.x-v.tx,mouse.y-v.ty)/Math.min(W,H)*1.4):.55;var k=.004+.010*presence;v.x+=(v.tx+Math.cos(v.drift)*16-v.x)*k;v.y+=(v.ty+Math.sin(v.drift*.8)*10-v.y)*k;cx0+=v.x;cy0+=v.y;R+=presence;var breath=.55+.45*Math.sin(v.p);var rr=v.r*(.7+breath*.45);var g=cx.createRadialGradient(v.x,v.y,0,v.x,v.y,rr);g.addColorStop(0,rgba(232,207,160,.006+.028*presence*breath));g.addColorStop(.45,rgba(184,117,58,.004+.015*presence));g.addColorStop(1,rgba(184,117,58,0));cx.fillStyle=g;cx.beginPath();cx.arc(v.x,v.y,rr,0,TAU);cx.fill()}
R/=veils.length;cx0/=veils.length;cy0/=veils.length;var halo=cx.createRadialGradient(cx0,cy0,0,cx0,cy0,Math.min(W,H)*.33);halo.addColorStop(0,rgba(232,207,160,.012+R*.035));halo.addColorStop(.55,rgba(184,117,58,.006+R*.015));halo.addColorStop(1,rgba(184,117,58,0));cx.fillStyle=halo;cx.fillRect(0,0,W,H);cx.globalCompositeOperation='source-over';if(word)word.textContent=R>.62?'if a face appears, you completed it':'presence is the coupling constant';if(meter)meter.textContent='presence='+R.toFixed(3)+' · 137 veils';requestAnimationFrame(draw)}
addEventListener('pointermove',function(e){mouse.x=e.clientX;mouse.y=e.clientY;mouse.on=true},{passive:true});addEventListener('pointerleave',function(){mouse.on=false},{passive:true});resize();addEventListener('resize',resize,{passive:true});draw();
})();
