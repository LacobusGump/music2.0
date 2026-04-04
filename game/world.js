// ═══════════════════════════════════════════════════
// THE WORLD — terrain + sky + trees only (no people)
// People rendered as particles on top
// ═══════════════════════════════════════════════════

var WORLD_FS = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uCamPos;
uniform vec3 uCamDir;

float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){
  vec2 i=floor(p),f=fract(p);
  f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
             mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
}
float fbm(vec2 p){return noise(p)*0.5+noise(p*2.1+3.7)*0.3+noise(p*4.3)*0.2;}

float terrain(vec2 p){
  float h=fbm(p*0.12)*5.0+noise(p*0.4)*1.5;
  float clearing=length(p);
  h*=smoothstep(3.0,8.0,clearing);
  h+=smoothstep(8.0,3.0,clearing)*(-0.3);
  return h-2.0;
}

// Just terrain + 2 trees. No people, no fire, no water.
float scene(vec3 p){
  float d=p.y-terrain(vec2(p.x,p.z));
  // 2 acacia trees (simple: trunk capsule + canopy sphere)
  for(int i=0;i<2;i++){
    vec2 tp=i==0?vec2(-8.0,10.0):vec2(11.0,-5.0);
    float g=terrain(tp);
    vec3 lp=p-vec3(tp.x,g,tp.y);
    float h=3.5+hash(tp)*1.0;
    // Trunk
    float trunk=length(vec2(lp.x,lp.z))-0.1;
    trunk=max(trunk,-lp.y);trunk=max(trunk,lp.y-h);
    // Canopy
    vec3 cp=lp-vec3(0,h+0.3,0);
    float cr=2.0+hash(tp+vec2(1,0));
    float canopy=length(cp/vec3(cr,0.5,cr))-1.0;
    float td=min(trunk,canopy);
    d=min(d,td);
  }
  return d;
}

vec3 calcNorm(vec3 p){
  float e=0.02;
  return normalize(vec3(
    scene(p+vec3(e,0,0))-scene(p-vec3(e,0,0)),
    scene(p+vec3(0,e,0))-scene(p-vec3(0,e,0)),
    scene(p+vec3(0,0,e))-scene(p-vec3(0,0,e))));
}

vec3 sky(vec3 rd){
  vec3 sun=normalize(vec3(0.5,0.4,-0.3));
  float s=max(0.0,dot(rd,sun));
  float h=1.0-max(0.0,rd.y);
  vec3 col=mix(vec3(0.4,0.55,0.8),vec3(0.75,0.6,0.4),h*h);
  col+=vec3(1.0,0.7,0.3)*pow(s,20.0)*0.25;
  return col;
}

void main(){
  vec2 uv=(gl_FragCoord.xy-uRes*0.5)/uRes.y;
  vec3 ro=uCamPos;
  vec3 fw=normalize(uCamDir);
  vec3 rt=normalize(cross(fw,vec3(0,1,0)));
  vec3 up=cross(rt,fw);
  vec3 rd=normalize(uv.x*rt+uv.y*up+1.4*fw);
  vec3 sun=normalize(vec3(0.5,0.4,-0.3));

  float t=0.0;
  bool hit=false;
  vec3 p;
  for(int i=0;i<40;i++){
    p=ro+rd*t;
    float d=scene(p);
    if(d<0.005*t){hit=true;break;}
    t+=d*0.9;
    if(t>50.0)break;
  }

  vec3 col;
  if(hit){
    vec3 n=calcNorm(p);
    // Material: ground = grass, tree = green/brown
    float g=fbm(vec2(p.x,p.z)*1.5);
    vec3 mc=mix(vec3(0.5,0.42,0.18),vec3(0.6,0.55,0.22),g);
    // Tree detection (rough)
    if(p.y>terrain(vec2(p.x,p.z))+0.5)mc=n.y>0.5?mix(vec3(0.15,0.3,0.1),vec3(0.22,0.38,0.12),g):vec3(0.25,0.16,0.08);

    float diff=max(0.0,dot(n,sun));
    float amb=0.3+0.15*n.y;
    col=mc*(amb+diff*0.65*vec3(1.1,1.0,0.85));

    // Fire glow from center
    float fd=length(vec2(p.x,p.z));
    col+=vec3(0.5,0.2,0.03)/(1.0+fd*fd*0.3)*0.3;

    float fog=1.0-exp(-t*0.025);
    col=mix(col,sky(rd)*0.6,fog);
  } else {
    col=sky(rd);
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
