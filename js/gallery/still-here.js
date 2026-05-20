(function(){
'use strict';
var cv=document.getElementById('g-canvas'),cx=cv&&cv.getContext('2d');if(!cx)return;
var W=0,H=0,dpr=1,t=0,lastMove=performance.now(),breathers=[],TAU=Math.PI*2;
var word=document.querySelector('.g-word'),meter=document.querySelector('.g-meter');
function rgba(r,g,b,a){return 'rgba('+r+','+g+','+b+','+Math.max(0,Math.min(1,a)).toFixed(4)+')'}
function resize(){dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;cv.width=W*dpr;cv.height=H*dpr;cx.setTransform(dpr,0,0,dpr,0,0);breathers=[];for(var i=0;i<33;i++)breathers.push({x:Math.random()*W,y:Math.random()*H,p:Math.random()*TAU,r:18+Math.random()*90,o:.25+Math.random()*.8})}
function draw(){t+=.016;var still=Math.min(1,(performance.now()-lastMove)/9000);cx.fillStyle='rgba(3,3,4,'+(.18-still*.09).toFixed(3)+')';cx.fillRect(0,0,W,H);cx.globalCompositeOperation='lighter';var roomPulse=.5+.5*Math.sin(t*.33);for(var i=0;i<breathers.length;i++){var b=breathers[i];b.p+=.004*b.o+still*.006;b.x+=(W/2-b.x)*still*.0007;b.y+=(H/2-b.y)*still*.0007;var br=.5+.5*Math.sin(b.p);var rr=b.r*(.45+br*.45+still*.7);var a=(.004+still*.035)*(br*.8+.2);var g=cx.createRadialGradient(b.x,b.y,0,b.x,b.y,rr);g.addColorStop(0,rgba(232,207,160,a*.55));g.addColorStop(.45,rgba(110,160,210,a*.18));g.addColorStop(1,rgba(110,160,210,0));cx.fillStyle=g;cx.beginPath();cx.arc(b.x,b.y,rr,0,TAU);cx.fill()}
var center=cx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.min(W,H)*(.18+still*.22));center.addColorStop(0,rgba(232,207,160,still*(.025+roomPulse*.018)));center.addColorStop(.5,rgba(184,117,58,still*.010));center.addColorStop(1,rgba(184,117,58,0));cx.fillStyle=center;cx.fillRect(0,0,W,H);cx.globalCompositeOperation='source-over';if(word)word.textContent=still>.74?'the room was already breathing':still>.38?'quiet has a shape':'move less; listen longer';if(meter)meter.textContent='stillness='+still.toFixed(3)+' · breath='+roomPulse.toFixed(3);requestAnimationFrame(draw)}
addEventListener('pointermove',function(){lastMove=performance.now()},{passive:true});addEventListener('pointerdown',function(){lastMove=performance.now()},{passive:true});resize();addEventListener('resize',resize,{passive:true});draw();
})();
