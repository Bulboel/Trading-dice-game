/* v301 — Coiffures et tenues du héros : pièces séparées (modèles statiques) habillées au chargement sur le squelette du modèle neutre.
   Chaque pièce est remise à l'échelle du corps (table PARTS), puis reçoit des poids de peau : les cheveux suivent la tête, les tenues
   copient les poids du sommet du corps le plus proche. La couleur se change avec la teinte du jeu (variant-look.js, kind « tint »). */
import * as THREE from 'three';
import {GLTFLoader} from './vendor/three/examples/jsm/loaders/GLTFLoader.js';
import {applyLook} from './variant-look.js?v=20261230-v305';
export const PARTS={
 hair:{court:{label:'Courte',file:'hero-cheveux-court.glb',s:.9,xs:.88,zs:1,x:0,y:1.55,z:-.015,cap:'#2f8f2f'},
       longs:{label:'Longue',file:'hero-cheveux-longs.glb',s:.4,xs:1.02,zs:1,x:0,y:1.47,z:-.02,cap:'#5a3a22'}},
 outfit:{tenue1:{label:'Feuilles',file:'hero-tenue1.glb',s:.47,xs:1.08,zs:1,x:0,y:.73,z:0},
         tenue2:{label:'Mage',file:'hero-tenue2.glb',s:.5,xs:1.0,zs:1.3,x:0,y:.78,z:0},
         tenue4:{label:'Aventurier',file:'hero-tenue4.glb',s:.43,xs:1.05,zs:1.45,x:0,y:.76,z:.11}}};
const loader=new GLTFLoader(),prepared=new Map();
function bodyMesh(root){let m=null;root.traverse(o=>{if(!m&&o.isSkinnedMesh)m=o});return m}
function skin(geom,body){const pos=geom.attributes.position,n=pos.count,bg=body.geometry,bp=bg.attributes.position,bi=bg.attributes.skinIndex,bw=bg.attributes.skinWeight,idx=new Uint16Array(n*4),wt=new Float32Array(n*4);
  {const cell=.05,grid=new Map(),k=(x,y,z)=>x+','+y+','+z;for(let i=0;i<bp.count;i++){const c=k(Math.floor(bp.getX(i)/cell),Math.floor(bp.getY(i)/cell),Math.floor(bp.getZ(i)/cell));(grid.get(c)||grid.set(c,[]).get(c)).push(i)}
   for(let i=0;i<n;i++){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),cx=Math.floor(x/cell),cy=Math.floor(y/cell),cz=Math.floor(z/cell);let cand=[];
    for(let r=1;r<=40&&cand.length<4;r++){cand=[];for(let dx=-r;dx<=r;dx++)for(let dy=-r;dy<=r;dy++)for(let dz=-r;dz<=r;dz++){const l=grid.get(k(cx+dx,cy+dy,cz+dz));if(!l)continue;for(const j of l)cand.push([(bp.getX(j)-x)**2+(bp.getY(j)-y)**2+(bp.getZ(j)-z)**2,j])}}
    if(!cand.length)cand=[[0,0]];cand.sort((u,v)=>u[0]-v[0]);cand=cand.slice(0,6);const acc=new Map();
    for(const [d,j] of cand){const f=1/(1e-4+d);for(let a=0;a<4;a++){const w=bw.getComponent(j,a);if(w>0)acc.set(bi.getComponent(j,a),(acc.get(bi.getComponent(j,a))||0)+w*f)}}
    const top=[...acc.entries()].sort((u,v)=>v[1]-u[1]).slice(0,4),sum=top.reduce((t,e)=>t+e[1],0)||1;top.forEach(([b,w],a)=>{idx[i*4+a]=b;wt[i*4+a]=w/sum})}}
  geom.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(idx,4));geom.setAttribute('skinWeight',new THREE.Float32BufferAttribute(wt,4));
}
async function prepare(kind,id,body){const def=PARTS[kind]?.[id];if(!def)return null;const key=kind+'/'+id;if(prepared.has(key))return prepared.get(key);
 const job=(async()=>{const gltf=await loader.loadAsync('assets/models-web/'+def.file);let mesh=null;gltf.scene.traverse(o=>{if(!mesh&&o.isMesh)mesh=o});if(!mesh)return null;
  mesh.updateWorldMatrix(true,false);const geom=mesh.geometry.clone();geom.applyMatrix4(mesh.matrixWorld);geom.scale(def.s*(def.xs||1),def.s,def.s*(def.zs||1));geom.translate(def.x,def.y,def.z);geom.computeBoundingSphere();geom.computeBoundingBox();
  skin(geom,body);
  const mat=mesh.material;if(mat.map){mat.map.colorSpace=THREE.SRGBColorSpace}mat.side=THREE.DoubleSide;
  let cap=null;if(def.cap){const cg=new THREE.SphereGeometry(.263,28,18,Math.PI*.9,Math.PI*1.2,0,Math.PI*.78);cg.translate(0,1.45,-.012);skin(cg,body);cap={geom:cg,color:def.cap}}
  return{geom,mat,cap}})().catch(()=>null);prepared.set(key,job);return job}
/* Habille `root` (clone du modèle neutre) avec la coiffure et la tenue de `hero` ({hair:{id,color},outfit:{id,color}}). Remplace les pièces précédentes. */
export async function attachHeroParts(root,hero,isCurrent=()=>true){const body=bodyMesh(root);if(!body)return;
 (root.userData.heroPieces||[]).forEach(m=>{m.parent?.remove(m)});root.userData.heroPieces=[];
 for(const kind of['outfit','hair']){const sel=hero?.[kind];if(!sel?.id)continue;const p=await prepare(kind,sel.id,body);if(!p||!isCurrent())continue;
  const m=new THREE.SkinnedMesh(p.geom,p.mat.clone());m.frustumCulled=false;m.castShadow=true;m.receiveShadow=true;m.position.copy(body.position);m.quaternion.copy(body.quaternion);m.scale.copy(body.scale);body.parent.add(m);m.bind(body.skeleton,body.bindMatrix);
  if(sel.color)applyLook(m,{kind:'tint',color:sel.color,amount:.9});root.userData.heroPieces.push(m);
  if(p.cap){const c=new THREE.SkinnedMesh(p.cap.geom,new THREE.MeshStandardMaterial({color:sel.color||p.cap.color,roughness:.8,side:THREE.DoubleSide}));c.frustumCulled=false;c.position.copy(body.position);c.quaternion.copy(body.quaternion);c.scale.copy(body.scale);body.parent.add(c);c.bind(body.skeleton,body.bindMatrix);root.userData.heroPieces.push(c)}}}
