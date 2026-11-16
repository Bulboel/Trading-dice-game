/* v301 — Coiffures et tenues du héros : pièces séparées (modèles statiques) habillées au chargement sur le squelette du modèle neutre.
   Chaque pièce est remise à l'échelle du corps (table PARTS), puis reçoit des poids de peau : les cheveux suivent la tête, les tenues
   copient les poids du sommet du corps le plus proche. La couleur se change avec la teinte du jeu (variant-look.js, kind « tint »). */
import * as THREE from 'three';
import {GLTFLoader} from './vendor/three/examples/jsm/loaders/GLTFLoader.js';
import {applyLook} from './variant-look.js?v=20270102-v325';
export const PARTS={
 hair:{court:{label:'Courte',file:'hero-cheveux-court.glb',s:.84,xs:.85,zs:.96,rx:-.32,x:0,y:1.52,z:-.02,cap:'#2f8f2f'},
       longs:{label:'Longue',file:'hero-cheveux-longs.glb',s:.4,xs:1.02,zs:1,rx:-.24,x:0,y:1.465,z:-.025,cap:'#5a3a22'}},
 top:{rond:{label:'Tee-shirt col rond',gen:'tee',neck:'round',tex:'knit',color:'#c4553f'},
      v:{label:'Tee-shirt col en V',gen:'tee',neck:'v',tex:'knit',color:'#3f8fc4'},
      debardeur:{label:'Débardeur',gen:'tank',neck:'round',tex:'knit',color:'#e0b25c'}},
 bottom:{jean:{label:'Short en jean',gen:'short',tex:'denim',color:'#3d5a8c'},
         tissu:{label:'Short en tissu',gen:'short',tex:'cloth',color:'#6a7a3a'}},
 suit:{uni:{label:'Combinaison unie',gen:'suit',tex:'knit',color:'#3f6fc4'},
       rayures:{label:'Combinaison rayée',gen:'suit',tex:'stripes',color:'#c4553f'},
       pois:{label:'Combinaison à pois',gen:'suit',tex:'dots',color:'#8a5cc8'},
       carreaux:{label:'Combinaison à carreaux',gen:'suit',tex:'checks',color:'#2f9e6a'},
       camo:{label:'Combinaison camouflage',gen:'suit',tex:'camo',color:'#6a7a3a'}}};
/* ——— Vêtements générés ———
   Peau du corps (mêmes sommets, mêmes poids) découpée en coupes nettes dans la pose de référence : chaque triangle est coupé
   le long de la ligne exacte (interpolation), puis gonflé le long des normales. Cols, manches et ourlets sont des champs de distance. */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),NECK_Y=1.118;
function neckField(neck,x,y,z,wide){/* >0 : tissu ; <0 : ouverture du col (devant plus profond que derrière) */
 const front=clamp((z+.03)/.1,0,1),rx=wide?.115:.088;
 if(neck==='v'){const depth=.11*front+.012,lim=NECK_Y-depth*clamp(1-Math.abs(x)/.098,0,1);return lim-y}
 const ry=(.02+.058*front)*(wide?1.25:1),g=(x/rx)**2+((y-NECK_Y)/ry)**2-1;return g*.05}
const FIELDS={
 tee:o=>(x,y,z)=>Math.min(NECK_Y-y,.27-Math.abs(x),y-.8,neckField(o.neck,x,y,z,false)),
 tank:o=>(x,y,z)=>Math.min(NECK_Y-y,.172-Math.abs(x),y-.8,neckField('round',x,y,z,true)),
 short:()=>(x,y,z)=>Math.min(.88-y,y-.53,.245-Math.abs(x)),
 suit:()=>(x,y,z)=>Math.min(NECK_Y-y,.39-Math.abs(x),y-.14,neckField('round',x,y,z,false)+.02)};
const OFFSET={tee:.016,tank:.016,short:.012,suit:.013};
function genGeometry(def,body){const bg=body.geometry,pa=bg.attributes.position,na=bg.attributes.normal,bi=bg.attributes.skinIndex,bw=bg.attributes.skinWeight,idx=bg.index.array,n=pa.count,f=FIELDS[def.gen](def),off=OFFSET[def.gen],fv=new Float32Array(n);
 for(let v=0;v<n;v++)fv[v]=f(pa.getX(v),pa.getY(v),pa.getZ(v));
 /* normales soudées par position : les sommets dédoublés (coutures UV) se déplacent ensemble, donc plus de fentes entre triangles */
 const key=v=>Math.round(pa.getX(v)*2e4)+','+Math.round(pa.getY(v)*2e4)+','+Math.round(pa.getZ(v)*2e4),acc=new Map();
 for(let v=0;v<n;v++){const k=key(v),a=acc.get(k)||[0,0,0];a[0]+=na.getX(v);a[1]+=na.getY(v);a[2]+=na.getZ(v);acc.set(k,a)}
 const wn=new Float32Array(n*3);for(let v=0;v<n;v++){const a=acc.get(key(v)),L=Math.hypot(a[0],a[1],a[2])||1;wn[v*3]=a[0]/L;wn[v*3+1]=a[1]/L;wn[v*3+2]=a[2]/L}
 const P=[],N=[],SI=[],SW=[],UV=[];
 const vert=(a,b,t)=>{/* t cherché par dichotomie sur le vrai champ : bords lisses, indépendants de la taille des triangles */
  if(t>0){let lo=0,hi=1;const pt=u=>[pa.getX(a)+(pa.getX(b)-pa.getX(a))*u,pa.getY(a)+(pa.getY(b)-pa.getY(a))*u,pa.getZ(a)+(pa.getZ(b)-pa.getZ(a))*u];
   const inA=fv[a]>=0;for(let k=0;k<12;k++){const m=(lo+hi)/2,q=pt(m);if((f(q[0],q[1],q[2])>=0)===inA)lo=m;else hi=m}t=(lo+hi)/2}
  const lerp=(A,B)=>A+(B-A)*t;let x=lerp(pa.getX(a),pa.getX(b)),y=lerp(pa.getY(a),pa.getY(b)),z=lerp(pa.getZ(a),pa.getZ(b)),nx=lerp(wn[a*3],wn[b*3]),ny=lerp(wn[a*3+1],wn[b*3+1]),nz=lerp(wn[a*3+2],wn[b*3+2]);
  const L=Math.hypot(nx,ny,nz)||1;nx/=L;ny/=L;nz/=L;P.push(x+nx*off,y+ny*off,z+nz*off);N.push(nx,ny,nz);
  const sgn=clamp(x/.05,-1,1),k=11;UV.push(k*(x+.8*z*sgn),k*y);
  const src=t<.5?a:b;for(let q=0;q<4;q++){SI.push(bi.getComponent(src,q));SW.push(bw.getComponent(src,q))}};
 for(let t=0;t<idx.length;t+=3){const ia=idx[t],ib=idx[t+1],ic=idx[t+2],tri=[ia,ib,ic],fs=[fv[ia],fv[ib],fv[ic]];
  if(fs[0]<0&&fs[1]<0&&fs[2]<0)continue;
  const poly=[];for(let k=0;k<3;k++){const a=tri[k],b=tri[(k+1)%3],fa=fs[k],fb=fs[(k+1)%3];
   if(fa>=0)poly.push([a,a,0]);if((fa>=0)!==(fb>=0)){const tt=fa/(fa-fb);poly.push(fa>=0?[a,b,tt]:[b,a,1-tt])}}
  for(let k=1;k+1<poly.length;k++)for(const q of [poly[0],poly[k],poly[k+1]])vert(q[0],q[1],q[2])}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(UV,2));
 g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(SI,4));g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(SW,4));g.computeBoundingSphere();return g}
/* Textures procédurales (motif clair × couleur choisie) */
const texCache=new Map();
function fabricTexture(kind){if(texCache.has(kind))return texCache.get(kind);const S=128,c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d'),sh=v=>{const q=Math.round(clamp(v,0,1)*255);return `rgb(${q},${q},${q})`};
 const noise=a=>{for(let i=0;i<S*S/5;i++){g.fillStyle=`rgba(0,0,0,${Math.random()*a})`;g.fillRect(Math.random()*S,Math.random()*S,1,1)}};
 g.fillStyle=sh(.95);g.fillRect(0,0,S,S);
 if(kind==='knit'||kind==='stripes'||kind==='dots'||kind==='checks'||kind==='camo'){for(let x=0;x<S;x+=3){g.fillStyle='rgba(0,0,0,.09)';g.fillRect(x,0,1,S)}for(let y=0;y<S;y+=3){g.fillStyle='rgba(255,255,255,.07)';g.fillRect(0,y,S,1)}}
 if(kind==='stripes'){for(let y=0;y<S;y+=32){g.fillStyle=sh(.52);g.fillRect(0,y,S,16)}}
 if(kind==='dots'){g.fillStyle=sh(.5);for(let y=0;y<4;y++)for(let x=0;x<4;x++){g.beginPath();g.arc(x*32+(y%2?16:0)+8,y*32+16,7,0,7);g.fill()}}
 if(kind==='checks'){g.fillStyle='rgba(0,0,0,.4)';for(let k=0;k<S;k+=32){g.fillRect(k,0,14,S);g.fillRect(0,k,S,14)}}
 if(kind==='camo'){const tones=[.6,.78,.45];for(let i=0;i<46;i++){g.fillStyle=sh(tones[i%3]);g.beginPath();g.ellipse(Math.random()*S,Math.random()*S,10+Math.random()*16,6+Math.random()*10,Math.random()*3,0,7);g.fill();g.ellipse}}
 if(kind==='denim'){for(let y=0;y<S;y++)for(let x=0;x<S;x+=1){const v=.8+.14*Math.sin((x+y)*Math.PI/2)+.04*Math.sin(x*1.7);g.fillStyle=sh(v);g.fillRect(x,y,1,1)}noise(.22)}
 if(kind==='cloth'){for(let y=0;y<S;y+=4){for(let x=0;x<S;x+=4){g.fillStyle=sh(((x+y)/4)%2?.82:.96);g.fillRect(x,y,4,4)}}noise(.12)}
 noise(.07);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;texCache.set(kind,t);return t}
function fabricMaterial(def,color){const t=fabricTexture(def.tex);return new THREE.MeshStandardMaterial({color:color||def.color,map:t,bumpMap:t,bumpScale:def.tex==='denim'?2.2:1.2,roughness:def.tex==='denim'?.9:.82,metalness:0,side:THREE.DoubleSide})}
const loader=new GLTFLoader(),prepared=new Map();
function bodyMesh(root){let m=null;root.traverse(o=>{if(!m&&o.isSkinnedMesh)m=o});return m}
function skin(geom,body,torso){const pos=geom.attributes.position,n=pos.count,bg=body.geometry,bp=bg.attributes.position,bi=bg.attributes.skinIndex,bw=bg.attributes.skinWeight,idx=new Uint16Array(n*4),wt=new Float32Array(n*4);
  const armV=new Uint8Array(bp.count),bn=body.skeleton.bones;for(let v=0;v<bp.count;v++){let bj=0,bwm=-1;for(let a=0;a<4;a++){const w=bw.getComponent(v,a);if(w>bwm){bwm=w;bj=bi.getComponent(v,a)}}armV[v]=/arm|hand|shoulder|thumb|index|middle|ring|pinky/i.test(bn[bj]?.name||'')?1:0}
  {const cell=.05,grid=new Map(),k=(x,y,z)=>x+','+y+','+z;for(let i=0;i<bp.count;i++){const c=k(Math.floor(bp.getX(i)/cell),Math.floor(bp.getY(i)/cell),Math.floor(bp.getZ(i)/cell));(grid.get(c)||grid.set(c,[]).get(c)).push(i)}
   for(let i=0;i<n;i++){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),cx=Math.floor(x/cell),cy=Math.floor(y/cell),cz=Math.floor(z/cell);let cand=[];
    for(let r=1;r<=40&&cand.length<4;r++){cand=[];for(let dx=-r;dx<=r;dx++)for(let dy=-r;dy<=r;dy++)for(let dz=-r;dz<=r;dz++){const l=grid.get(k(cx+dx,cy+dy,cz+dz));if(!l)continue;for(const j of l){if(torso&&Math.abs(x)<.3&&armV[j])continue;cand.push([(bp.getX(j)-x)**2+(bp.getY(j)-y)**2+(bp.getZ(j)-z)**2,j])}}}
    if(!cand.length)cand=[[0,0]];cand.sort((u,v)=>u[0]-v[0]);cand=cand.slice(0,6);const acc=new Map();
    for(const [d,j] of cand){const f=1/(1e-4+d);for(let a=0;a<4;a++){const w=bw.getComponent(j,a);if(w>0)acc.set(bi.getComponent(j,a),(acc.get(bi.getComponent(j,a))||0)+w*f)}}
    const top=[...acc.entries()].sort((u,v)=>v[1]-u[1]).slice(0,4),sum=top.reduce((t,e)=>t+e[1],0)||1;top.forEach(([b,w],a)=>{idx[i*4+a]=b;wt[i*4+a]=w/sum})}}
  geom.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(idx,4));geom.setAttribute('skinWeight',new THREE.Float32BufferAttribute(wt,4));
}
async function prepare(kind,id,body){const def=PARTS[kind]?.[id];if(!def)return null;const key=kind+'/'+id;if(prepared.has(key))return prepared.get(key);
 const job=(async()=>{if(def.gen)return{geom:genGeometry(def,body),def,gen:true};const gltf=await loader.loadAsync('assets/models-web/'+def.file);let mesh=null;gltf.scene.traverse(o=>{if(!mesh&&o.isMesh)mesh=o});if(!mesh)return null;
  mesh.updateWorldMatrix(true,false);const geom=mesh.geometry.clone();geom.applyMatrix4(mesh.matrixWorld);geom.scale(def.s*(def.xs||1),def.s*(def.ys||1),def.s*(def.zs||1));if(def.rx)geom.rotateX(def.rx);geom.translate(def.x,def.y,def.z);geom.computeBoundingSphere();geom.computeBoundingBox();
  skin(geom,body,def.torso);
  const mat=mesh.material;if(mat.map){mat.map.colorSpace=THREE.SRGBColorSpace}mat.side=THREE.DoubleSide;
  let cap=null;if(def.cap){const mk=(r,ps,pl,tl,ts=0)=>{const g=new THREE.SphereGeometry(r,28,16,ps,pl,ts,tl);g.translate(0,1.45,-.012);skin(g,body);return g};/* calotte : dessus du crâne + arrière du crâne, sans jamais toucher les oreilles (côtés) */cap={geoms:[mk(.254,0,Math.PI*2,Math.PI*.42),mk(.256,Math.PI*1.22,Math.PI*.56,Math.PI*.78,Math.PI*.3)],color:def.cap}}
  const under=null;
  return{geom,mat,cap,under}})().catch(()=>null);prepared.set(key,job);return job}
/* Habille `root` (clone du modèle neutre) avec la coiffure et la tenue de `hero` ({hair:{id,color},outfit:{id,color}}). Remplace les pièces précédentes. */
export async function attachHeroParts(root,hero,isCurrent=()=>true){const body=bodyMesh(root);if(!body)return;
 (root.userData.heroPieces||[]).forEach(m=>{m.parent?.remove(m)});root.userData.heroPieces=[];
 for(const kind of['suit','top','bottom','hair']){const sel=hero?.[kind];if(!sel?.id)continue;if((kind==='top'||kind==='bottom')&&hero?.suit?.id)continue;const p=await prepare(kind,sel.id,body);if(!p||!isCurrent())continue;
  const m=new THREE.SkinnedMesh(p.geom,p.gen?fabricMaterial(p.def,sel.color):p.mat.clone());m.frustumCulled=false;m.castShadow=true;m.receiveShadow=true;m.position.copy(body.position);m.quaternion.copy(body.quaternion);m.scale.copy(body.scale);body.parent.add(m);m.bind(body.skeleton,body.bindMatrix);
  if(p.gen){}else if(sel.color)applyLook(m,{kind:'tint',color:sel.color,amount:.9});root.userData.heroPieces.push(m);
  if(p.under){const u=new THREE.SkinnedMesh(p.under.geom,new THREE.MeshStandardMaterial({color:p.under.color,roughness:.9,side:THREE.DoubleSide}));u.frustumCulled=false;u.position.copy(body.position);u.quaternion.copy(body.quaternion);u.scale.copy(body.scale);body.parent.add(u);u.bind(body.skeleton,body.bindMatrix);root.userData.heroPieces.push(u)}
  if(p.cap)for(const cgm of p.cap.geoms){const c=new THREE.SkinnedMesh(cgm,new THREE.MeshStandardMaterial({color:sel.color||p.cap.color,roughness:.8,side:THREE.DoubleSide}));c.frustumCulled=false;c.position.copy(body.position);c.quaternion.copy(body.quaternion);c.scale.copy(body.scale);body.parent.add(c);c.bind(body.skeleton,body.bindMatrix);root.userData.heroPieces.push(c)}}}
