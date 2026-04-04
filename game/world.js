// ═══════════════════════════════════════════════════
// THE WORLD — Ray-marched SDF African Savanna
// Distance fields ARE coupling. d=0 is the phase transition.
// No meshes. No textures. Just math.
// ═══════════════════════════════════════════════════

var WORLD_FS = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uCamPos;
uniform vec3 uCamDir;
uniform float uK; // coupling constant drives the world

// ═══ NOISE — the terrain is fractal coupling ═══
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float hash3(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}

float noise(vec2 p){
  vec2 i=floor(p),f=fract(p);
  f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
             mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
}

float fbm(vec2 p){
  float v=0.0,a=0.5;
  mat2 rot=mat2(0.8,-0.6,0.6,0.8);
  for(int i=0;i<6;i++){v+=a*noise(p);p=rot*p*2.0;a*=0.5;}
  return v;
}

// ═══ TERRAIN — rolling African plains ═══
float terrain(vec2 p){
  float h=fbm(p*0.15)*4.0;              // broad hills
  h+=fbm(p*0.4+3.7)*1.5;               // medium detail
  h+=noise(p*1.5)*0.3;                  // grass-scale bumps
  // Watering hole: depression near origin
  float hole=length(p-vec2(3.0,2.0));
  h-=smoothstep(4.0,1.0,hole)*2.5;
  // Distant mountains
  float mDist=length(p-vec2(0.0,40.0));
  h+=smoothstep(30.0,15.0,mDist)*8.0*fbm(p*0.08);
  return h-1.5;
}

float terrainH(vec3 p){return p.y-terrain(p.xz);}

// ═══ ACACIA TREE SDF ═══
// Trunk: vertical cylinder. Canopy: flat ellipsoid. The iconic shape.
float sdCylinder(vec3 p,float r,float h){
  vec2 d=abs(vec2(length(p.xz),p.y))-vec2(r,h);
  return min(max(d.x,d.y),0.0)+length(max(d,0.0));
}

float sdEllipsoid(vec3 p,vec3 r){
  float k0=length(p/r);
  float k1=length(p/(r*r));
  return k0*(k0-1.0)/k1;
}

float acacia(vec3 p,vec3 treePos){
  vec3 lp=p-treePos;
  float ground=terrain(treePos.xz);
  lp.y-=ground;

  // Trunk (slightly tapered)
  float trunkH=2.5+hash(treePos.xz)*1.5;
  float trunk=sdCylinder(lp-vec3(0,trunkH*0.5,0),0.12+0.05*(1.0-lp.y/trunkH),trunkH*0.5);

  // Canopy (flat wide ellipsoid on top)
  float canopyR=1.8+hash(treePos.xz+1.0)*1.2;
  float canopy=sdEllipsoid(lp-vec3(0,trunkH+0.3,0),vec3(canopyR,0.6,canopyR));

  // Branches reaching up into canopy
  float branch1=sdCylinder(lp-vec3(0.3,trunkH*0.7,0.1),0.04,trunkH*0.25);
  float branch2=sdCylinder(lp-vec3(-0.2,trunkH*0.65,-0.15),0.04,trunkH*0.25);

  return min(min(trunk,canopy),min(branch1,branch2));
}

// ═══ WATER SDF ═══
float water(vec3 p){
  vec2 wc=vec2(3.0,2.0); // watering hole center
  float dist=length(p.xz-wc);
  float waterLevel=terrain(wc)-1.0;
  // Ripples
  float ripple=sin(dist*4.0-uTime*2.0)*0.02+sin(dist*7.0+uTime*1.5)*0.01;
  return p.y-(waterLevel+ripple);
}

// ═══ SCENE SDF — the world equation ═══
vec2 scene(vec3 p){
  // Returns vec2(distance, material_id)
  // material: 0=terrain, 1=tree_trunk, 2=tree_canopy, 3=water

  float d=terrainH(p);
  float mat=0.0;

  // Trees — scatter with hash
  for(int i=0;i<8;i++){
    float fi=float(i);
    vec2 treeXZ=vec2(
      hash(vec2(fi,0.0))*40.0-20.0,
      hash(vec2(0.0,fi))*40.0-20.0
    );
    // Skip trees too close to water
    if(length(treeXZ-vec2(3.0,2.0))<5.0)continue;
    vec3 treePos=vec3(treeXZ.x,0.0,treeXZ.y);
    float td=acacia(p,treePos);
    if(td<d){
      d=td;
      // Determine trunk vs canopy
      float ground=terrain(treeXZ);
      float trunkH=2.5+hash(treeXZ)*1.5;
      mat=(p.y-ground)>trunkH*0.8?2.0:1.0;
    }
  }

  // Water
  float wd=water(p);
  if(wd<d){d=wd;mat=3.0;}

  return vec2(d,mat);
}

// ═══ NORMAL from SDF gradient ═══
vec3 calcNormal(vec3 p){
  vec2 e=vec2(0.01,0.0);
  return normalize(vec3(
    scene(p+e.xyy).x-scene(p-e.xyy).x,
    scene(p+e.yxy).x-scene(p-e.yxy).x,
    scene(p+e.yyx).x-scene(p-e.yyx).x
  ));
}

// ═══ SOFT SHADOW — march toward light ═══
float shadow(vec3 p,vec3 l){
  float res=1.0,t=0.1;
  for(int i=0;i<32;i++){
    float d=scene(p+l*t).x;
    res=min(res,8.0*d/t);
    t+=clamp(d,0.02,0.5);
    if(d<0.001||t>20.0)break;
  }
  return clamp(res,0.15,1.0);
}

// ═══ AMBIENT OCCLUSION — how coupled is this point? ═══
float ao(vec3 p,vec3 n){
  float occ=0.0,sca=1.0;
  for(int i=0;i<5;i++){
    float h=0.01+0.12*float(i);
    float d=scene(p+h*n).x;
    occ+=(h-d)*sca;
    sca*=0.7;
  }
  return clamp(1.0-3.0*occ,0.0,1.0);
}

// ═══ SKY ═══
vec3 sky(vec3 rd,vec3 sunDir){
  // Atmospheric scattering approximation
  float sun=max(0.0,dot(rd,sunDir));
  float horizon=1.0-max(0.0,rd.y);

  // Base sky: blue overhead → warm near horizon
  vec3 col=mix(vec3(0.35,0.5,0.75),vec3(0.7,0.55,0.4),horizon*horizon);
  // Sun glow
  col+=vec3(1.0,0.7,0.3)*pow(sun,32.0)*0.4;
  col+=vec3(1.0,0.8,0.5)*pow(sun,4.0)*0.15;

  // Clouds (simple layered noise)
  if(rd.y>0.01){
    float cloudH=8.0/rd.y;
    vec2 cloudUV=rd.xz*cloudH+uTime*0.3;
    float cloud=fbm(cloudUV*0.3)*1.2-0.3;
    cloud=smoothstep(0.0,0.5,cloud);
    col=mix(col,vec3(0.85,0.8,0.7),cloud*0.4*smoothstep(0.0,0.2,rd.y));
  }

  return col;
}

// ═══ MATERIAL COLORS ═══
vec3 getMaterial(float mat,vec3 p,vec3 n){
  if(mat<0.5){
    // Terrain: golden grassland
    float grass=fbm(p.xz*2.0);
    float dry=fbm(p.xz*0.5+5.0);
    vec3 grassCol=mix(vec3(0.45,0.38,0.15),vec3(0.55,0.5,0.2),grass);
    grassCol=mix(grassCol,vec3(0.35,0.25,0.1),dry*0.5); // dry patches
    // Dirt near water
    float nearWater=smoothstep(5.0,2.0,length(p.xz-vec2(3.0,2.0)));
    grassCol=mix(grassCol,vec3(0.25,0.18,0.1),nearWater);
    return grassCol;
  }
  if(mat<1.5){
    // Tree trunk: dark bark
    return vec3(0.22,0.14,0.08)+noise(p.xz*20.0)*0.05;
  }
  if(mat<2.5){
    // Tree canopy: deep green
    float leaf=noise(p.xz*15.0+p.y*10.0);
    return mix(vec3(0.12,0.25,0.08),vec3(0.18,0.35,0.1),leaf);
  }
  // Water: dark reflective
  return vec3(0.1,0.15,0.25);
}

void main(){
  vec2 uv=(gl_FragCoord.xy-uRes*0.5)/uRes.y;

  // Camera
  vec3 ro=uCamPos;
  vec3 fw=normalize(uCamDir);
  vec3 rt=normalize(cross(fw,vec3(0,1,0)));
  vec3 up=cross(rt,fw);
  vec3 rd=normalize(uv.x*rt+uv.y*up+1.5*fw);

  // Sun
  vec3 sunDir=normalize(vec3(0.5,0.35,-0.3));

  // Ray march
  float t=0.0;
  float mat=-1.0;
  vec3 p;
  for(int i=0;i<128;i++){
    p=ro+rd*t;
    vec2 h=scene(p);
    if(abs(h.x)<0.002*t){mat=h.y;break;}
    t+=h.x*0.7; // conservative step
    if(t>100.0)break;
  }

  vec3 col;
  if(mat>=0.0){
    // Hit surface
    vec3 n=calcNormal(p);
    vec3 matCol=getMaterial(mat,p,n);

    // Lighting
    float diff=max(0.0,dot(n,sunDir));
    float amb=0.2+0.15*n.y;
    float sh=shadow(p+n*0.02,sunDir);
    float occ=ao(p,n);

    col=matCol*(amb+diff*sh*vec3(1.2,1.0,0.8))*occ;

    // Water specular
    if(mat>2.5){
      float spec=pow(max(0.0,dot(reflect(rd,n),sunDir)),32.0);
      col+=vec3(1.0,0.9,0.7)*spec*0.5;
      // Fresnel
      float fres=pow(1.0-max(0.0,dot(-rd,n)),3.0);
      col=mix(col,sky(reflect(rd,n),sunDir)*0.4,fres*0.5);
    }

    // Distance fog → sky color
    float fogT=1.0-exp(-t*0.015);
    col=mix(col,sky(rd,sunDir)*0.6,fogT);
  } else {
    col=sky(rd,sunDir);
  }

  // Tone mapping (simple Reinhard)
  col=col/(1.0+col);
  // Gamma
  col=pow(col,vec3(0.45));
  // Subtle warmth
  col*=vec3(1.02,1.0,0.97);

  gl_FragColor=vec4(col,1.0);
}
`;

var WORLD_VS = `
attribute vec2 aPos;
void main(){gl_Position=vec4(aPos,0.0,1.0);}
`;
