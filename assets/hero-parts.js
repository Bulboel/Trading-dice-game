/* v301 — Coiffures et tenues du héros : pièces séparées (modèles statiques) habillées au chargement sur le squelette du modèle neutre.
   Chaque pièce est remise à l'échelle du corps (table PARTS), puis reçoit des poids de peau : les cheveux suivent la tête, les tenues
   copient les poids du sommet du corps le plus proche. La couleur se change avec la teinte du jeu (variant-look.js, kind « tint »). */
import * as THREE from 'three';
import {GLTFLoader} from './vendor/three/examples/jsm/loaders/GLTFLoader.js';
import {applyLook} from './variant-look.js?v=20261228-v303';
export const PARTS={
 hair:{court:{label:'Courte',file:'hero-cheveux-court.glb',s:.8,xs:.8,zs:.85,x:0,y:1.5,z:0,head:true},
       longs:{label:'Longue',file:'hero-cheveux-longs.glb',s:.55,xs:1.02,zs:1,x:0,y:1.37,z:-.03,head:true}},
 outfit:{tenue1:{label:'Feuilles',file:'hero-tenue1.glb',s:.44,x:0,y:.78,z:0},
         tenue2:{label:'Mage',file:'hero-tenue2.glb',s:.5,xs:1.12,zs:1.5,x:0,y:.78,z:.1},
         tenue4:{label:'Aventurier',file:'hero-tenue4.glb',s:.46,xs:1.08,zs:1.35,x:0,y:.8,z:.03}}};
const loader=new GLTFLoader(),prepared=new Map();
function bodyMesh(root){let m=null;root.traverse(o=>{if(!m&&o.isSkinnedMesh)m=o});return m}
async function prepare(kind,id,body){const def=PARTS[kind]?.[id];if(!def)return null;const key=kind+'/'+id;if(prepared.has(key))return prepared.get(key);
 const job=(async()=>{const gltf=await loader.loadAsync('assets/models-web/'+def.file);let mesh=null;gltf.scene.traverse(o=>{if(!mesh&&o.isMesh)mesh=o});if(!mesh)return null;
  mesh.updateWorldMatrix(true,false);const geom=mesh.geometry.clone();geom.applyMatrix4(mesh.matrixWorld);geom.scale(def.s*(def.xs||1),def.s,def.s*(def.zs||1));geom.translate(def.x,def.y,def.z);geom.computeBoundingSphere();geom.computeBoundingBox();
  const pos=geom.attributes.position,n=pos.count,bg=body.geometry,bp=bg.attributes.position,bi=bg.attributes.skinIndex,bw=bg.attributes.skinWeight,idx=new Uint16Array(n*4),wt=new Float32Array(n*4);
  if(def.head){const hb=Math.max(0,body.skeleton.bones.findIndex(b=>/head$/i.test(b.name)&&!/top|end/i.test(b.name)));for(let i=0;i<n;i++){idx[i*4]=hb;wt[i*4]=1}}
  else{const cell=.04,grid=new Map(),k=(x,y,z)=>x+','+y+','+z;for(let i=0;i<bp.count;i++){const c=k(Math.floor(bp.getX(i)/cell),Math.floor(bp.getY(i)/cell),Math.floor(bp.getZ(i)/cell));(grid.get(c)||grid.set(c,[]).get(c)).push(i)}
   for(let i=0;i<n;i++){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),cx=Math.floor(x/cell),cy=Math.floor(y/cell),cz=Math.floor(z/cell);let best=-1,bd=1e9;
    for(let r=1;r<=6&&best<0;r++)for(let dx=-r;dx<=r;dx++)for(let dy=-r;dy<=r;dy++)for(let dz=-r;dz<=r;dz++){const l=grid.get(k(cx+dx,cy+dy,cz+dz));if(!l)continue;for(const j of l){const d=(bp.getX(j)-x)**2+(bp.getY(j)-y)**2+(bp.getZ(j)-z)**2;if(d<bd){bd=d;best=j}}}
    if(best<0)best=0;for(let a=0;a<4;a++){idx[i*4+a]=bi.getComponent(best,a);wt[i*4+a]=bw.getComponent(best,a)}}}
  geom.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(idx,4));geom.setAttribute('skinWeight',new THREE.Float32BufferAttribute(wt,4));
  const mat=mesh.material;if(mat.map){mat.map.colorSpace=THREE.SRGBColorSpace}mat.side=THREE.DoubleSide;
  return{geom,mat}})().catch(()=>null);prepared.set(key,job);return job}
/* Habille `root` (clone du modèle neutre) avec la coiffure et la tenue de `hero` ({hair:{id,color},outfit:{id,color}}). Remplace les pièces précédentes. */
export async function attachHeroParts(root,hero,isCurrent=()=>true){const body=bodyMesh(root);if(!body)return;
 (root.userData.heroPieces||[]).forEach(m=>{m.parent?.remove(m)});root.userData.heroPieces=[];
 for(const kind of['outfit','hair']){const sel=hero?.[kind];if(!sel?.id)continue;const p=await prepare(kind,sel.id,body);if(!p||!isCurrent())continue;
  const m=new THREE.SkinnedMesh(p.geom,p.mat.clone());m.frustumCulled=false;m.castShadow=true;m.receiveShadow=true;m.position.copy(body.position);m.quaternion.copy(body.quaternion);m.scale.copy(body.scale);body.parent.add(m);m.bind(body.skeleton,body.bindMatrix);
  if(sel.color)applyLook(m,{kind:'tint',color:sel.color,amount:.9});root.userData.heroPieces.push(m)}}
