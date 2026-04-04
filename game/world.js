// ═══════════════════════════════════════════════════
// THE WORLD — Lightweight SDF savanna
// Simplified for WebGL 1 compatibility + 60fps
// ═══════════════════════════════════════════════════

var WORLD_FS = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uCamPos;
uniform vec3 uCamDir;

// ═══ NOISE ═══
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}

float noise(vec2 p){
  vec2 i=floor(p),f=fract(p);
  f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
             mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
}

float fbm3(vec2 p){
  return noise(p)*0.5+noise(p*2.1+3.7)*0.3+noise(p*4.3+7.1)*0.2;
}

// ═══ TERRAIN ═══
float terrain(vec2 p){
  float h=fbm3(p*0.15)*5.0;
  h+=noise(p*0.5)*1.5;
  // Watering hole
  float hole=length(p-vec2(4.0,3.0));
  h-=smoothstep(5.0,1.5,hole)*3.0;
  return h-2.0;
}

// ═══ SINGLE TREE SDF ═══
float tree(vec3 p,vec2 tpos){
  float ground=terrain(tpos);
  vec3 lp=p-vec3(tpos.x,ground,tpos.y);
  float h=3.0+hash(tpos)*1.5;
  // Trunk
  float trunk=length(lp.xz)-0.12*(1.0-lp.y/h*0.3);
  trunk=max(trunk,lp.y);trunk=max(trunk,-lp.y+0.0);trunk=max(trunk,lp.y-h);
  // Canopy
  float cr=2.0+hash(tpos+1.0);
  vec3 cp=lp-vec3(0,h+0.2,0);
  float canopy=length(cp/vec3(cr,0.6,cr))-1.0;
  return min(trunk,canopy);
}

// ═══ SCENE ═══
vec2 scene(vec3 p){
  float d=p.y-terrain(p.xz); // terrain
  float mat=0.0;

  // 4 trees
  vec2 trees[4];
  trees[0]=vec2(-6.0,8.0);trees[1]=vec2(10.0,-4.0);
  trees[2]=vec2(-3.0,-9.0);trees[3]=vec2(12.0,10.0);
  for(int i=0;i<4;i++){
    float td=tree(p,trees[i]);
    if(td<d){
      d=td;
      float ground=terrain(trees[i]);
      float h=3.0+hash(trees[i])*1.5;
      mat=(p.y-ground)>h*0.75?2.0:1.0;
    }
  }

  // Water
  float wh=terrain(vec2(4.0,3.0))-1.2;
  wh+=sin(length(p.xz-vec2(4,3))*3.0-uTime*2.0)*0.03;
  float wd=p.y-wh;
  if(length(p.xz-vec2(4,3))<4.5&&wd<d){d=wd;mat=3.0;}

  return vec2(d,mat);
}

// ═══ NORMAL ═══
vec3 norm(vec3 p){
  vec2 e=vec2(0.02,0);
  return normalize(vec3(scene(p+e.xyy).x-scene(p-e.xyy).x,
    scene(p+e.yxy).x-scene(p-e.yxy).x,scene(p+e.yyx).x-scene(p-e.yyx).x));
}

// ═══ SHADOW (cheap) ═══
float shadow(vec3 p,vec3 l){
  float t=0.2,res=1.0;
  for(int i=0;i<8;i++){
    float d=scene(p+l*t).x;
    res=min(res,6.0*d/t);
    t+=max(d,0.1);
    if(t>15.0)break;
  }
  return clamp(res,0.2,1.0);
}

// ═══ SKY ═══
vec3 sky(vec3 rd,vec3 sun){
  float s=max(0.0,dot(rd,sun));
  float h=1.0-max(0.0,rd.y);
  vec3 col=mix(vec3(0.4,0.55,0.8),vec3(0.75,0.6,0.4),h*h);
  col+=vec3(1,0.7,0.3)*pow(s,24.0)*0.3;
  col+=vec3(1,0.8,0.5)*pow(s,4.0)*0.12;
  // Simple clouds
  if(rd.y>0.02){
    vec2 uv=rd.xz*(6.0/rd.y)+uTime*0.2;
    float c=noise(uv*0.4)*1.3-0.35;
    c=smoothstep(0.0,0.4,c);
    col=mix(col,vec3(0.9,0.85,0.75),c*0.35*smoothstep(0.0,0.15,rd.y));
  }
  return col;
}

// ═══ MATERIAL ═══
vec3 mat(float id,vec3 p){
  if(id<0.5){
    float g=fbm3(p.xz*1.5);
    float dry=noise(p.xz*0.4+5.0);
    vec3 c=mix(vec3(0.5,0.42,0.18),vec3(0.6,0.55,0.22),g);
    c=mix(c,vec3(0.38,0.28,0.12),dry*0.4);
    float nearW=smoothstep(5.0,2.5,length(p.xz-vec2(4,3)));
    return mix(c,vec3(0.28,0.2,0.1),nearW);
  }
  if(id<1.5)return vec3(0.25,0.16,0.08)+noise(p.xz*15.0)*0.04;
  if(id<2.5){float l=noise(p.xz*10.0+p.y*8.0);return mix(vec3(0.15,0.3,0.1),vec3(0.22,0.4,0.12),l);}
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

  // March
  float t=0.0,m=-1.0;vec3 p;
  for(int i=0;i<48;i++){
    p=ro+rd*t;
    vec2 h=scene(p);
    if(abs(h.x)<0.003*t){m=h.y;break;}
    t+=h.x*0.8;
    if(t>80.0)break;
  }

  vec3 col;
  if(m>=0.0){
    vec3 n=norm(p);
    vec3 mc=mat(m,p);
    float diff=max(0.0,dot(n,sun));
    float amb=0.25+0.15*n.y;
    float sh=shadow(p+n*0.03,sun);
    col=mc*(amb+diff*sh*vec3(1.15,1.0,0.85));
    // Water shine
    if(m>2.5){
      col+=vec3(1,0.9,0.7)*pow(max(0.0,dot(reflect(rd,n),sun)),24.0)*0.4;
      float fres=pow(1.0-max(0.0,dot(-rd,n)),3.0);
      col=mix(col,sky(reflect(rd,n),sun)*0.3,fres*0.4);
    }
    float fog=1.0-exp(-t*0.018);
    col=mix(col,sky(rd,sun)*0.65,fog);
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
