// ═══════════════════════════════════════════════════
// THE WORLD — WebGL 1 compatible SDF
// Fixed: no swizzle assignment, no array init issues
// ═══════════════════════════════════════════════════

var WORLD_FS = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uCamPos;
uniform vec3 uCamDir;
uniform vec4 uPeople[12];
uniform vec4 uPeopleState[12];

float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){
  vec2 i=floor(p),f=fract(p);
  f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
             mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
}
float fbm(vec2 p){return noise(p)*0.5+noise(p*2.1+3.7)*0.3+noise(p*4.3)*0.2;}

// Rotate a vec2
vec2 rot2(vec2 v,float a){float c=cos(a),s=sin(a);return vec2(v.x*c+v.y*s,-v.x*s+v.y*c);}

float sdSphere(vec3 p,float r){return length(p)-r;}
float sdCapsule(vec3 p,vec3 a,vec3 b,float r){
  vec3 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.0,1.0);
  return length(pa-ba*h)-r;
}
float sdCyl(vec3 p,float r,float h){
  vec2 d=abs(vec2(length(vec2(p.x,p.z)),p.y))-vec2(r,h);
  return min(max(d.x,d.y),0.0)+length(max(d,0.0));
}

float terrain(vec2 p){
  float h=fbm(p*0.12)*5.0+noise(p*0.4)*1.5;
  float clearing=length(p);
  h*=smoothstep(3.0,8.0,clearing);
  h+=smoothstep(8.0,3.0,clearing)*(-0.3);
  return h-2.0;
}

float person(vec3 p,vec3 bp,float ang,float flash){
  vec3 lp=p-bp;
  // Rotate using helper (no swizzle assignment)
  vec2 rotated=rot2(vec2(lp.x,lp.z),ang);
  lp=vec3(rotated.x,lp.y,rotated.y);
  float lean=flash*0.15;
  float torso=sdCapsule(lp,vec3(0,0.15,lean*0.5),vec3(0,0.65+lean*0.1,lean),0.12);
  float head=sdSphere(lp-vec3(0,0.78+lean*0.1,lean*0.8),0.1);
  float legL=sdCapsule(lp,vec3(-0.08,0.12,0),vec3(-0.05,0.1,0.25),0.055);
  float legR=sdCapsule(lp,vec3(0.08,0.12,0),vec3(0.05,0.1,0.25),0.055);
  float armL=sdCapsule(lp,vec3(-0.15,0.5,lean),vec3(-0.08,0.35,0.35+lean),0.04);
  float armR=sdCapsule(lp,vec3(0.15,0.5,lean),vec3(0.08,0.35,0.35+lean),0.04);
  float d=min(torso,head-0.02);
  d=min(d,legL);d=min(d,legR);d=min(d,armL);d=min(d,armR);
  return d;
}

float drum(vec3 p,vec3 bp,float ang){
  vec3 lp=p-bp;
  vec2 rotated=rot2(vec2(lp.x,lp.z),ang);
  lp=vec3(rotated.x,lp.y,rotated.y);
  vec3 dp=lp-vec3(0.0,0.15,0.4);
  return sdCyl(dp,0.13,0.15);
}

float acacia(vec3 p,vec2 tp){
  float g=terrain(tp);
  vec3 lp=p-vec3(tp.x,g,tp.y);
  float h=3.0+hash(tp)*1.5;
  float trunk=sdCapsule(lp,vec3(0,0,0),vec3(0,h,0),0.1);
  float cr=1.8+hash(tp+vec2(1,0));
  vec3 cp=lp-vec3(0,h+0.2,0);
  float canopy=length(cp/vec3(cr,0.5,cr))-1.0;
  return min(trunk,canopy);
}

vec2 scene(vec3 p){
  float d=p.y-terrain(vec2(p.x,p.z));
  float mt=0.0;

  // 3 trees (hardcoded positions, no array init issues)
  float t1=acacia(p,vec2(-8,10));if(t1<d){d=t1;mt=terrain(vec2(-8,10));float h=3.0+hash(vec2(-8,10))*1.5;mt=(p.y-mt)>h*0.7?3.0:4.0;}
  float t2=acacia(p,vec2(11,-5));if(t2<d){d=t2;mt=terrain(vec2(11,-5));float h=3.0+hash(vec2(11,-5))*1.5;mt=(p.y-mt)>h*0.7?3.0:4.0;}
  float t3=acacia(p,vec2(-5,-10));if(t3<d){d=t3;mt=terrain(vec2(-5,-10));float h=3.0+hash(vec2(-5,-10))*1.5;mt=(p.y-mt)>h*0.7?3.0:4.0;}

  // 12 people
  for(int i=0;i<12;i++){
    vec3 bp=vec3(uPeople[i].x,0.0,uPeople[i].z);
    bp.y=terrain(vec2(bp.x,bp.z));
    float ang=atan(bp.z,bp.x)+3.14159;
    float pd=person(p,bp,ang,uPeople[i].w);
    if(pd<d){d=pd;mt=1.0;}
    float dd=drum(p,bp,ang);
    if(dd<d){d=dd;mt=2.0;}
  }

  // Fire
  vec3 fp=p-vec3(0,terrain(vec2(0,0)),0);
  float fd=length(vec2(fp.x,fp.z))-0.3;
  fd=max(fd,-fp.y);fd=max(fd,fp.y-1.2);
  fd-=(noise(vec2(fp.x,fp.z)*5.0+uTime*3.0)*0.15)*(1.0-fp.y*0.7);
  if(fd<d){d=fd;mt=5.0;}

  return vec2(d,mt);
}

vec3 calcNorm(vec3 p){
  float e=0.015;
  return normalize(vec3(
    scene(p+vec3(e,0,0)).x-scene(p-vec3(e,0,0)).x,
    scene(p+vec3(0,e,0)).x-scene(p-vec3(0,e,0)).x,
    scene(p+vec3(0,0,e)).x-scene(p-vec3(0,0,e)).x));
}

float shadow(vec3 p,vec3 l){
  float t=0.15,res=1.0;
  for(int i=0;i<8;i++){
    float d=scene(p+l*t).x;
    res=min(res,5.0*d/t);
    t+=max(d,0.1);
    if(t>10.0)break;
  }
  return clamp(res,0.2,1.0);
}

vec3 sky(vec3 rd,vec3 sun){
  float s=max(0.0,dot(rd,sun));
  float h=1.0-max(0.0,rd.y);
  vec3 col=mix(vec3(0.4,0.55,0.8),vec3(0.75,0.6,0.4),h*h);
  col+=vec3(1.0,0.7,0.3)*pow(s,20.0)*0.25;
  col+=vec3(1.0,0.8,0.5)*pow(s,3.0)*0.1;
  return col;
}

vec3 getMat(float id,vec3 p){
  if(id<0.5){float g=fbm(vec2(p.x,p.z)*1.5);return mix(vec3(0.5,0.42,0.18),vec3(0.6,0.55,0.22),g);}
  if(id<1.5){return vec3(0.45,0.3,0.18);}
  if(id<2.5){return p.y>0.28?vec3(0.55,0.45,0.28):vec3(0.32,0.2,0.1);}
  if(id<3.5){return mix(vec3(0.15,0.3,0.1),vec3(0.22,0.38,0.12),noise(vec2(p.x,p.z)*10.0));}
  if(id<4.5){return vec3(0.25,0.16,0.08);}
  if(id<5.5){float fh=max(0.0,p.y-terrain(vec2(0,0)))/1.2;return mix(vec3(1,0.9,0.5),vec3(1,0.3,0.05),fh)*2.0;}
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

  float t=0.0,m=-1.0;
  vec3 p=ro;
  for(int i=0;i<48;i++){
    p=ro+rd*t;
    vec2 h=scene(p);
    if(abs(h.x)<0.003*t){m=h.y;break;}
    t+=h.x*0.8;
    if(t>60.0)break;
  }

  vec3 col;
  if(m>=0.0){
    vec3 n=calcNorm(p);
    vec3 mc=getMat(m,p);
    float diff=max(0.0,dot(n,sun));
    float amb=0.3+0.15*n.y;
    float sh=shadow(p+n*0.03,sun);
    col=mc*(amb+diff*sh*vec3(1.1,1.0,0.85));

    if(m>4.5&&m<5.5)col=mc; // fire emissive

    // Person glow
    if(m>0.5&&m<1.5){
      for(int i=0;i<12;i++){
        vec2 pp=vec2(uPeople[i].x,uPeople[i].z);
        if(length(vec2(p.x,p.z)-pp)<0.8){
          col+=vec3(0.3,0.22,0.05)*uPeopleState[i].x*0.5;
          col+=vec3(0.4,0.3,0.1)*uPeople[i].w;
          col+=vec3(0.15,0.1,0.03)*uPeopleState[i].w;
          break;
        }
      }
    }

    // Fire light
    vec3 fpos=vec3(0,terrain(vec2(0,0))+0.5,0);
    float fdist=length(p-fpos);
    col+=vec3(0.6,0.25,0.05)/(1.0+fdist*fdist*0.3)*0.4;

    float fog=1.0-exp(-t*0.02);
    col=mix(col,sky(rd,sun)*0.6,fog);
  } else {
    col=sky(rd,sun);
  }

  col=col/(1.0+col);
  col=pow(col,vec3(0.45));
  gl_FragColor=vec4(col,1.0);
}
`;

var WORLD_VS = `
attribute vec2 aPos;
void main(){gl_Position=vec4(aPos,0.0,1.0);}
`;
