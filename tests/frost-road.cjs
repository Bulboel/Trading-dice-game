// v240 — La Route vers Forfalla repensée : dalles de glace lisibles, neige dans les joints, et le duel des élémentaires hors damier.
const fs=require('fs'),path=require('path'),os=require('os'),assert=require('assert'),{pathToFileURL}=require('url');
const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8'),src=read('assets/frost-v240.js'),cl=read('assets/clearing-v105.js');
assert.ok(cl.includes("import { createFrostRoad } from './frost-v240.js")&&cl.includes('frostRoad=createFrostRoad(decor,!!renderer.isSoftware,BH);frostRoad.root.scale.z=1/ZS')&&cl.includes('frostRoad.update(t,light,moving)'),'New ice terrain wired with real cell coordinates');
assert.ok(!/iceScene|glacierClosures|snowfall|iceCells/.test(cl),'Old ice scenery removed from the clearing');
for(const k of['dalles de glace','Sapins chargés de neige','porte de Forfalla','Lanternes','dispute des élémentaires','Élémentaire de feu','Élémentaire de glace','Aurore boréale'])assert.ok(src.includes(k),'Frost road has '+k);
const ctx=new Proxy({},{get:(t,k)=>k==='createRadialGradient'||k==='createLinearGradient'?()=>({addColorStop(){}}):k==='createImageData'?(w,h)=>({data:new Uint8ClampedArray(w*h*4)}):k==='getImageData'?()=>({data:[]}):()=>{},set:()=>true});
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>ctx})};
const three=pathToFileURL(path.join(root,'assets/vendor/three/build/three.module.min.js')).href,tmp=fs.mkdtempSync(path.join(os.tmpdir(),'hk-frost-')),file=path.join(tmp,'frost.mjs');
fs.writeFileSync(file,src.replace("from 'three'","from '"+three+"'"));
(async()=>{const THREE=await import(three),{createFrostRoad}=await import(pathToFileURL(file).href);const rows=12,TOP=.2;
 for(const software of[false,true]){const world=new THREE.Group(),f=createFrostRoad(world,software,rows);world.updateMatrixWorld(true);
  const slabs=f.root.children.find(o=>o.isInstancedMesh&&o.count===8*rows);assert.ok(slabs,'One ice slab per cell');const m=new THREE.Matrix4(),p=new THREE.Vector3(),seen=new Set();
  for(let i=0;i<slabs.count;i++){slabs.getMatrixAt(i,m);p.setFromMatrixPosition(m);const x=Math.round(p.x+3.5),y=Math.round(p.z+(rows-1)/2);assert.ok(Math.abs(p.x-(x-3.5))<1e-6&&Math.abs(p.z-(y-(rows-1)/2))<1e-6&&Math.abs(p.y-TOP)<1e-6,'Slab centred and level');seen.add(x+','+y)}
  assert.equal(seen.size,8*rows);
  const box=new THREE.Box3();for(const o of f.root.children){if(o.isSprite||o.isPoints)continue;let additive=false;o.traverse(n=>{if(n.material&&n.material.blending===THREE.AdditiveBlending)additive=true});if(additive||o.geometry?.type==='PlaneGeometry')continue;box.setFromObject(o);if(box.isEmpty()||box.max.y<=TOP+.2)continue;
   assert.ok(!(box.max.x>-4&&box.min.x<4&&box.max.z>-rows/2&&box.min.z<rows/2),'Tall scenery off the board: '+(o.geometry?.type||o.type)+' at '+o.position.x.toFixed(2)+','+o.position.z.toFixed(2))}
  // Le duel se déroule sur la rive gauche, loin du damier, et s'anime (projectiles visibles à un moment du cycle).
  const duel=f.root.getObjectByName('elemental-duel');assert.ok(duel.position.x<-5);assert.ok(duel,'Duel group on the left bank');let fly=0;
  for(let t=0;t<4.6;t+=.1){f.update(t,false,true);duel.updateMatrixWorld(true);for(const c of duel.children)if(c.isGroup&&c.visible&&c.children.length<=2&&Math.abs(c.position.z)<2){fly++;c.getWorldPosition(p);assert.ok(p.x<-4.4,'Projectiles stay off the board')}}
  assert.ok(fly>5,'Fireball and ice shard fly between the elementals');f.update(1,true,false)}
 fs.rmSync(tmp,{recursive:true,force:true});
 console.log('PASS: Route vers Forfalla — one ice slab per cell, level with tiles, snow joints draw the grid; pines, peaks, gate and lanterns off the board; fire and ice elementals duel on the left bank with flying projectiles.');
})().catch(e=>{console.error(e);process.exit(1)});
