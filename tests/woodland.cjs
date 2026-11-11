// v238 — Le Bois tendre : sous-bois, rivière vivante et petite faune, sans jamais encombrer les cases du damier.
const fs=require('fs'),path=require('path'),os=require('os'),assert=require('assert'),{pathToFileURL}=require('url');
const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8'),src=read('assets/woodland-v238.js'),cl=read('assets/clearing-v105.js');
assert.ok(cl.includes("import { createWoodland } from './woodland-v238.js")&&cl.includes('woodland.update(t,moving)'),'Woodland wired into the Bois tendre scene');
for(const k of['Fougères','Champignons','Buissons à baies','Roseaux et massettes','écume','Reflets de soleil','Feuilles qui dérivent','Papillons','Libellules'])assert.ok(src.includes(k),'Woodland has '+k);
// Exécution réelle du module avec three.js (canvas factice) pour vérifier les positions.
const ctx=new Proxy({},{get:(t,k)=>k==='createRadialGradient'||k==='createLinearGradient'?()=>({addColorStop(){}}):k==='getImageData'?()=>({data:[]}):()=>{},set:()=>true});
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>ctx})};
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'hk-wood-')),file=path.join(tmp,'woodland.mjs');
fs.writeFileSync(file,src.replace("from 'three'","from '"+pathToFileURL(path.join(root,'assets/vendor/three/build/three.module.min.js')).href+"'"));
(async()=>{const THREE=await import(pathToFileURL(path.join(root,'assets/vendor/three/build/three.module.min.js')).href),{createWoodland}=await import(pathToFileURL(file).href);
 let seed=73491;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const river=x=>.45+Math.sin(x*.48)*.8+Math.sin(x*1.1)*.15,height=()=>0,waterHeight=()=>-.045;
 for(const software of[false,true]){const forest=new THREE.Group(),crown=new THREE.SphereGeometry(1,6,4),leaf=new THREE.MeshStandardMaterial();
  const w=createWoodland({forest,river,height,waterHeight,rand,software,crownShapes:[crown],leafMats:[leaf]});assert.ok(forest.children.includes(w.root));
  const m=new THREE.Matrix4(),p=new THREE.Vector3();let plants=0;
  for(const o of w.root.children)if(o.isInstancedMesh){assert.ok(o.count>0,'Instanced set filled');for(let i=0;i<o.count;i++){o.getMatrixAt(i,m);p.setFromMatrixPosition(m);assert.ok(!(Math.abs(p.x)<4.2&&Math.abs(p.z)<5.2),'Undergrowth stays off the board cells ('+p.x.toFixed(2)+','+p.z.toFixed(2)+')');plants++}}
  for(const o of w.root.children)if(o.isGroup&&o.children.some(c=>c.geometry?.type==='SphereGeometry'))assert.ok(!(Math.abs(o.position.x)<4.2&&Math.abs(o.position.z)<5.2),'Bushes off the board');
  assert.ok(plants>(software?150:300),'Dense undergrowth: '+plants);
  const before=w.root.children.map(o=>o.position.clone());for(const t of[0,1.3,7.7])w.update(t,true);w.update(5,false);
  assert.ok(w.root.children.some((o,i)=>!o.position.equals(before[i])),'Fauna and drifting leaves move');}
 fs.rmSync(tmp,{recursive:true,force:true});
 console.log('PASS: Bois tendre — ferns, mushrooms, berry bushes, reeds with cattails all off the board cells; wet stones with foam and wakes, sparkles, drifting leaves, butterflies and dragonflies animate; lighter set in software mode.');
})().catch(e=>{console.error(e);process.exit(1)});
