// v241 — Le lac rose repensé : lac de montagne naturel, eau limpide, le rose vient des galets du fond. Damier lisible, nénuphars qui flottent avec l'eau.
const fs=require('fs'),path=require('path'),os=require('os'),assert=require('assert'),{pathToFileURL}=require('url');
const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8'),src=read('assets/lake-v241.js'),cl=read('assets/clearing-v105.js');
assert.ok(/export function createLake\(world,software=false,rows=10\)/.test(src)&&src.includes('return{root,update('),'Lake module API');
assert.ok(cl.includes("import { createLake } from './lake-v241.js")&&cl.includes("forest.visible=value&&!fire&&!ice&&!lakeOn")&&cl.includes('lake.update(t,light,moving)')&&cl.includes('lake.root.scale.z=1/ZS}'),'Wired into the 3D board');
assert.ok(!fs.existsSync(path.join(root,'assets/lake-v230.js')),'Old garden-like lake removed');
assert.ok(cl.includes("'LE LAC ROSE'")&&cl.includes("eau:'Eau +1 · Le lac rose"));
for(const k of['galets roses','quartz rose','sapins','bouleaux','Ponton','barque','poissons','pierres levées','ronds dans l'])assert.ok(src.includes(k),'Lake has '+k);
assert.ok(!/cerisier|lanterne|Cerisiers/i.test(src),'No more Asian-garden props (cherry trees, lanterns)');
for(const f of['index.html','assets/portal-v159.js','assets/pvp-online.js','assets/clearing-v105.js'])assert.ok(!read(f).includes('Lagon cristallin'),'Old name removed from '+f);
const ctx=new Proxy({},{get:(t,k)=>k==='createRadialGradient'||k==='createLinearGradient'?()=>({addColorStop(){}}):k==='createImageData'?(w,h)=>({data:new Uint8ClampedArray(w*h*4)}):k==='getImageData'?()=>({data:[]}):()=>{},set:()=>true});
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>ctx})};
const three=pathToFileURL(path.join(root,'assets/vendor/three/build/three.module.min.js')).href,tmp=fs.mkdtempSync(path.join(os.tmpdir(),'hk-lake-')),file=path.join(tmp,'lake.mjs');
fs.writeFileSync(file,src.replace("from 'three'","from '"+three+"'"));
(async()=>{const THREE=await import(three),{createLake}=await import(pathToFileURL(file).href);const rows=12,TOP=.2;
 for(const software of[false,true]){const world=new THREE.Group(),L=createLake(world,software,rows);world.updateMatrixWorld(true);
  const slabs=L.root.children.find(o=>o.isInstancedMesh&&o.count===8*rows);assert.ok(slabs,'One stone slab per cell');const m=new THREE.Matrix4(),p=new THREE.Vector3(),seen=new Set();
  for(let i=0;i<slabs.count;i++){slabs.getMatrixAt(i,m);p.setFromMatrixPosition(m);const x=Math.round(p.x+3.5),y=Math.round(p.z+(rows-1)/2);assert.ok(Math.abs(p.x-(x-3.5))<1e-6&&Math.abs(p.z-(y-(rows-1)/2))<1e-6&&Math.abs(p.y-TOP)<1e-6,'Slab centred and level with the tiles');seen.add(x+','+y)}
  assert.equal(seen.size,8*rows);
  const box=new THREE.Box3();for(const o of L.root.children){if(o.isSprite||o.isPoints||o.geometry?.type==='PlaneGeometry'||o===slabs)continue;if(o.isInstancedMesh){for(let i=0;i<o.count;i++){o.getMatrixAt(i,m);p.setFromMatrixPosition(m);assert.ok(!(Math.abs(p.x)<4.1&&Math.abs(p.z)<rows/2+.1),'Instanced plant off the board')}continue}let additive=false;o.traverse(n=>{if(n.material&&n.material.blending===THREE.AdditiveBlending)additive=true});if(additive)continue;box.setFromObject(o);if(box.isEmpty()||box.max.y<=TOP+.2)continue;
   assert.ok(!(box.max.x>-4&&box.min.x<4&&box.max.z>-rows/2&&box.min.z<rows/2),'Tall scenery off the board: '+(o.geometry?.type||o.type)+' at '+o.position.x.toFixed(2)+','+o.position.z.toFixed(2))}
  // Les nénuphars hors damier suivent les vagues : toujours au-dessus de la surface, ils ne disparaissent plus.
  const water=L.root.children.find(o=>o.isMesh&&o.material.isMeshPhysicalMaterial&&o.geometry.type==='PlaneGeometry');assert.ok(water);
  const pads=L.root.children.filter(o=>o.isGroup&&o.children[0]?.geometry?.type==='CircleGeometry');assert.ok(pads.length>=12,'Lily pads present: '+pads.length);
  for(const t of[0,.8,2.3,5.1]){L.update(t,false,true);const wp=water.geometry.attributes.position;for(const g of pads){assert.ok(Math.abs(g.position.x)>4||Math.abs(g.position.z)>rows/2,'Pads off the board');let best=1e9,wy=0;for(let i=0;i<wp.count;i+=1){const d=Math.hypot(wp.getX(i)-g.position.x,wp.getZ(i)-g.position.z);if(d<best){best=d;wy=wp.getY(i)}}if(!software)assert.ok(g.position.y>wy+water.position.y,'Pad stays above the waves')}}
  L.update(1,true,false)}
 fs.rmSync(tmp,{recursive:true,force:true});
 console.log('PASS: Le lac rose — natural mountain lake: clear water over pink pebbles, one stone slab per cell, trees/rocks/ruins off the board, lily pads ride the waves (never sink), Asian-garden props removed.');
})().catch(e=>{console.error(e);process.exit(1)});
