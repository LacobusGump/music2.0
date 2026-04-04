// ═══════════════════════════════════════════════════
// THE WORLD — Everything is SDF. People included.
// One equation. One world. One light.
// ═══════════════════════════════════════════════════

var WORLD_FS = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uCamPos;
uniform vec3 uCamDir;
uniform vec4 uPeople[12]; // xyz = position on ground, w = hitFlash (0-1)
uniform vec4 uPeopleState[12]; // x=locked(0/1), y=bpm, z=beatPhase, w=selected

// ═══ NOISE ═══
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){
  vec2 i=floor(p),f=fract(p);
  f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
             mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
}
float fbm(vec2 p){return noise(p)*0.5+noise(p*2.1+3.7)*0.3+noise(p*4.3)*0.2;}

// ═══ SDF PRIMITIVES ═══
float sdSphere(vec3 p,float r){return length(p)-r;}
float sdCapsule(vec3 p,vec3 a,vec3 b,float r){
  vec3 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.0,1.0);
  return length(pa-ba*h)-r;
}
float sdCylinder(vec3 p,float r,float h){
  vec2 d=abs(vec2(length(p.xz),p.y))-vec2(r,h);
  return min(max(d.x,d.y),0.0)+length(max(d,0.0));
}
float sdBox(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.0))+min(max(q.x,max(q.y,q.z)),0.0);}
float opU(float a,float b){return min(a,b);}
float opS(float a,float b,float k){float h=clamp(0.5+0.5*(b-a)/k,0.0,1.0);return mix(b,a,h)-k*h*(1.0-h);}

// ═══ TERRAIN ═══
float terrain(vec2 p){
  float h=fbm(p*0.12)*5.0+noise(p*0.4)*1.5;
  // Flatten around drum circle (the clearing)
  float clearing=length(p);
  h*=smoothstep(3.0,8.0,clearing);
  h+=smoothstep(8.0,3.0,clearing)*(-0.3); // slight depression for circle
  return h-2.0;
}

// ═══ SEATED PERSON SDF ═══
// Simple but recognizable: head, torso, crossed legs, arms forward to drum
float person(vec3 p,vec3 basePos,float facingAngle,float hitFlash){
  vec3 lp=p-basePos;
  // Rotate to face center
  float c=cos(facingAngle),s=sin(facingAngle);
  lp.xz=mat2(c,s,-s,c)*lp.xz;

  // Hit animation: slight forward lean
  float lean=hitFlash*0.15;

  // Torso (seated, upright capsule)
  float torso=sdCapsule(lp,vec3(0,0.15,lean*0.5),vec3(0,0.65+lean*0.1,lean),0.12);
  // Head
  float head=sdSphere(lp-vec3(0,0.78+lean*0.1,lean*0.8),0.1);
  // Thighs (horizontal, crossed)
  float legL=sdCapsule(lp,vec3(-0.08,0.12,0.0),vec3(-0.05,0.1,0.25),0.055);
  float legR=sdCapsule(lp,vec3(0.08,0.12,0.0),vec3(0.05,0.1,0.25),0.055);
  // Arms reaching toward drum
  float armL=sdCapsule(lp,vec3(-0.15,0.5,lean),vec3(-0.08,0.35,0.35+lean),0.04);
  float armR=sdCapsule(lp,vec3(0.15,0.5,lean),vec3(0.08,0.35,0.35+lean),0.04);

  float d=opS(torso,head,0.05); // smooth head-torso join
  d=opU(d,legL);d=opU(d,legR);
  d=opU(d,armL);d=opU(d,armR);
  return d;
}

// ═══ DRUM SDF ═══
float drum(vec3 p,vec3 basePos,float facingAngle){
  vec3 lp=p-basePos;
  float c=cos(facingAngle),s=sin(facingAngle);
  lp.xz=mat2(c,s,-s,c)*lp.xz;
  // Drum sits in front of person
  vec3 dp=lp-vec3(0.0,0.15,0.4);
  return sdCylinder(dp,0.13,0.15);
}

// ═══ FIRE SDF ═══
float fire(vec3 p){
  float d=length(p.xz)-0.3;
  d=max(d,-p.y);
  d=max(d,p.y-1.2);
  // Animated flame shape
  float flame=noise(p.xz*5.0+uTime*3.0)*0.15+noise(p.xz*10.0-uTime*5.0)*0.08;
  d-=flame*(1.0-p.y*0.7);
  return d;
}

// ═══ ACACIA TREE ═══
float acacia(vec3 p,vec2 tpos){
  float ground=terrain(tpos);
  vec3 lp=p-vec3(tpos.x,ground,tpos.y);
  float h=3.0+hash(tpos)*1.5;
  float trunk=sdCapsule(lp,vec3(0,0,0),vec3(0,h,0),0.1);
  float cr=1.8+hash(tpos+1.0);
  vec3 cp=lp-vec3(0,h+0.2,0);
  float canopy=length(cp/vec3(cr,0.5,cr))-1.0;
  return min(trunk,canopy);
}

// ═══ FULL SCENE ═══
vec2 scene(vec3 p){
  float d=p.y-terrain(p.xz);
  float mat=0.0; // 0=ground,1=skin,2=drum,3=canopy,4=trunk,5=fire,6=water

  // Trees
  vec2 trees[3];
  trees[0]=vec2(-8.0,10.0);trees[1]=vec2(11.0,-5.0);trees[2]=vec2(-5.0,-10.0);
  for(int i=0;i<3;i++){
    float td=acacia(p,trees[i]);
    if(td<d){d=td;float gh=terrain(trees[i]);float h=3.0+hash(trees[i])*1.5;mat=(p.y-gh)>h*0.7?3.0:4.0;}
  }

  // The Twelve
  for(int i=0;i<12;i++){
    vec3 bpos=vec3(uPeople[i].xyz);
    bpos.y=terrain(bpos.xz); // sit ON the terrain
    float angle=atan(bpos.z,bpos.x)+3.14159; // face center
    float flash=uPeople[i].w;

    float pd=person(p,bpos,angle,flash);
    if(pd<d){d=pd;mat=1.0;}

    float dd=drum(p,bpos,angle);
    if(dd<d){d=dd;mat=2.0;}
  }

  // Fire at center
  float fd=fire(p-vec3(0,terrain(vec2(0)),0));
  if(fd<d){d=fd;mat=5.0;}

  // Water hole (far from circle)
  float wh=terrain(vec2(8,7))-1.0;
  float wd=p.y-wh;
  if(length(p.xz-vec2(8,7))<3.5&&wd<d){d=wd;mat=6.0;}

  return vec2(d,mat);
}

// ═══ NORMAL ═══
vec3 norm(vec3 p){
  vec2 e=vec2(0.015,0);
  return normalize(vec3(scene(p+e.xyy).x-scene(p-e.xyy).x,
    scene(p+e.yxy).x-scene(p-e.yxy).x,scene(p+e.yyx).x-scene(p-e.yyx).x));
}

// ═══ SHADOW ═══
float shadow(vec3 p,vec3 l){
  float t=0.15,res=1.0;
  for(int i=0;i<12;i++){
    float d=scene(p+l*t).x;
    res=min(res,5.0*d/t);
    t+=max(d,0.08);
    if(t>12.0)break;
  }
  return clamp(res,0.2,1.0);
}

// ═══ SKY ═══
vec3 sky(vec3 rd,vec3 sun){
  float s=max(0.0,dot(rd,sun));
  float h=1.0-max(0.0,rd.y);
  vec3 col=mix(vec3(0.4,0.55,0.8),vec3(0.75,0.6,0.4),h*h);
  col+=vec3(1,0.7,0.3)*pow(s,20.0)*0.25;
  col+=vec3(1,0.8,0.5)*pow(s,3.0)*0.1;
  if(rd.y>0.02){
    vec2 uv=rd.xz*(5.0/rd.y)+uTime*0.15;
    float c=noise(uv*0.35)*1.2-0.3;
    col=mix(col,vec3(0.9,0.85,0.75),smoothstep(0.0,0.4,c)*0.3*smoothstep(0.0,0.12,rd.y));
  }
  return col;
}

// ═══ MATERIAL ═══
vec3 matCol(float id,vec3 p,vec3 n){
  if(id<0.5){// Ground
    float g=fbm(p.xz*1.5);float dry=noise(p.xz*0.35);
    return mix(vec3(0.5,0.42,0.18),vec3(0.6,0.55,0.22),g)-dry*vec3(0.1,0.12,0.05);
  }
  if(id<1.5){// Skin — warm brown
    return vec3(0.45,0.3,0.18)+noise(p.xz*30.0)*0.03;
  }
  if(id<2.5){// Drum — wood + skin top
    return p.y>0.28?vec3(0.55,0.45,0.28):vec3(0.32,0.2,0.1);
  }
  if(id<3.5){// Tree canopy
    return mix(vec3(0.15,0.3,0.1),vec3(0.22,0.38,0.12),noise(p.xz*10.0));
  }
  if(id<4.5){// Tree trunk
    return vec3(0.25,0.16,0.08);
  }
  if(id<5.5){// Fire
    float h=max(0.0,p.y-terrain(vec2(0)))/1.2;
    return mix(vec3(1,0.9,0.5),vec3(1,0.3,0.05),h)*2.0; // bright, HDR
  }
  // Water
  return vec3(0.12,0.18,0.3);
}

void main(){
  vec2 uv=(gl_FragCoord.xy-uRes*0.5)/uRes.y;
  vec3 ro=uCamPos;
  vec3 fw=normalize(uCamDir);
  vec3 rt=normalize(cross(fw,vec3(0,1,0)));
  vec3 up=cross(rt,fw);
  vec3 rd=normalize(uv.x*rt+uv.y*up+1.4*fw);
  vec3 sun=normalize(vec3(0.5,0.4,-0.3));

  float t=0.0,m=-1.0;vec3 p;
  for(int i=0;i<48;i++){
    p=ro+rd*t;
    vec2 h=scene(p);
    if(abs(h.x)<0.003*t){m=h.y;break;}
    t+=h.x*0.8;
    if(t>60.0)break;
  }

  vec3 col;
  if(m>=0.0){
    vec3 n=norm(p);
    vec3 mc=matCol(m,p,n);
    float diff=max(0.0,dot(n,sun));
    float amb=0.28+0.15*n.y;
    float sh=shadow(p+n*0.03,sun);
    col=mc*(amb+diff*sh*vec3(1.1,1.0,0.85));

    // Fire glow — emissive
    if(m>4.5&&m<5.5)col=mc;

    // Person highlight — glow locked people
    if(m>0.5&&m<1.5){
      // Check which person we hit
      for(int i=0;i<12;i++){
        vec3 pp=uPeople[i].xyz;
        pp.y=terrain(pp.xz);
        if(length(p.xz-pp.xz)<0.8){
          float locked=uPeopleState[i].x;
          float selected=uPeopleState[i].w;
          float flash=uPeople[i].w;
          // Gold glow when locked
          col+=vec3(0.3,0.22,0.05)*locked*0.5;
          // Bright flash on hit
          col+=vec3(0.4,0.3,0.1)*flash;
          // Selection outline
          col+=vec3(0.15,0.1,0.03)*selected;
          break;
        }
      }
    }

    // Water
    if(m>5.5){
      col+=vec3(1,0.9,0.7)*pow(max(0.0,dot(reflect(rd,n),sun)),20.0)*0.3;
      float fres=pow(1.0-max(0.0,dot(-rd,n)),3.0);
      col=mix(col,sky(reflect(rd,n),sun)*0.3,fres*0.3);
    }

    // Fire light on nearby surfaces
    vec3 firePos=vec3(0,terrain(vec2(0))+0.5,0);
    float fireDist=length(p-firePos);
    float fireLight=1.0/(1.0+fireDist*fireDist*0.3);
    col+=vec3(0.6,0.25,0.05)*fireLight*0.4;

    float fog=1.0-exp(-t*0.02);
    col=mix(col,sky(rd,sun)*0.6,fog);
  } else {
    col=sky(rd,sun);
  }

  col=col/(1.0+col);
  col=pow(col,vec3(0.45));
  col*=vec3(1.02,1.0,0.97);
  gl_FragColor=vec4(col,1.0);
}
`;

var WORLD_VS = `
attribute vec2 aPos;
void main(){gl_Position=vec4(aPos,0.0,1.0);}
`;
