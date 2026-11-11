// v239 — Les Terres embrasées repensées : un damier de dalles parfaitement lisible, la lave autour et dans les joints seulement.
const fs=require('fs'),path=require('path'),os=require('os'),assert=require('assert'),{pathToFileURL}=require('url');
const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8'),src=read('assets/ember-v239.js'),cl=read('assets/clearing-v105.js');
assert.ok(cl.includes("import { createEmberlands } from './ember-v239.js")&&cl.includes('crater=createEmberlands(decor,game.fireVents,!!renderer.isSoftware,BH);crater.root.scale.z=1/ZS'),'New fire terrain wired, real cell coordinates');
assert.ok(!cl.includes('crater-v135')&&!fs.existsSync(path.join(root,'assets/crater-v135.js'))&&!fs.existsSync(path.join(root,'assets/basalt-field.js')),'Old busy lava field removed');
for(const k of['Lave des douves','Rive cendrée','dalles nettes','Évents','Volcans','obsidienne','Braseros','Braises qui montent'])assert.ok(src.includes(k),'Ember lands has '+k);
const ctx=new Proxy({},{get:(t,k)=>k==='createRadialGradient'||k==='createLinearGradient'?()=>({addColorStop(){}}):k==='createImageData'?(w,h)=>({data:new Uint8ClampedArray(w*h*4)}):k==='getImageData'?()=>({data:[]}):()=>{},set:()=>true});
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>ctx})};
const three=pathToFileURL(path.join(root,'assets/vendor/three/build/three.module.min.js')).href,tmp=fs.mkdtempSync(path.join(os.tmpdir(),'hk-ember-')),file=path.join(tmp,'ember.mjs');
fs.writeFileSync(file,src.replace("from 'three'","from '"+three+"'"));
(async()=>{const THREE=await import(three),{createEmberlands}=await import(pathToFileURL(file).href);
 const rows=12,H=rows,vents=[[1,2],[6,H-3],[5,2],[2,H-3],[2,4],[5,H-5]],cx=x=>x-3.5,cz=y=>y-(rows-1)/2,TOP=.2;
 for(const software of[false,true]){const world=new THREE.Group(),e=createEmberlands(world,vents,software,rows);world.updateMatrixWorld(true);
  const slabs=e.root.children.find(o=>o.isInstancedMesh&&o.count>=80);assert.ok(slabs,'Slab grid present');assert.equal(slabs.count,8*rows-vents.length,'One slab per free cell, none on vents');
  const m=new THREE.Matrix4(),p=new THREE.Vector3(),seen=new Set();for(let i=0;i<slabs.count;i++){slabs.getMatrixAt(i,m);p.setFromMatrixPosition(m);const x=Math.round(p.x+3.5),y=Math.round(p.z+(rows-1)/2);assert.ok(Math.abs(p.x-cx(x))<1e-6&&Math.abs(p.z-cz(y))<1e-6,'Slab centred on its cell');assert.ok(Math.abs(p.y-TOP)<.01,'Slab top level with the tiles');assert.ok(!vents.some(([a,b])=>a===x&&b===y));seen.add(x+','+y)}
  assert.equal(seen.size,slabs.count);
  for(const [vx,vy] of vents)assert.ok(e.root.children.some(o=>o.geometry?.type==='CircleGeometry'&&Math.abs(o.position.x-cx(vx))<1e-6&&Math.abs(o.position.z-cz(vy))<1e-6),'Magma pit on vent '+vx+','+vy);
  // Rien de haut et d'opaque sur le damier : volcans, aiguilles, rochers et braseros restent sur la rive.
  const box=new THREE.Box3();for(const o of e.root.children){if(o.isSprite||o.isPoints||o.isLineSegments)continue;let additive=false;o.traverse(n=>{if(n.material&&n.material.blending===THREE.AdditiveBlending)additive=true});if(additive)continue;box.setFromObject(o);if(box.max.y<=TOP+.2)continue;
   const overlaps=box.max.x>-4&&box.min.x<4&&box.max.z>-rows/2&&box.min.z<rows/2;assert.ok(!overlaps,'Tall scenery off the board: '+(o.geometry?.type||o.type)+' at '+o.position.x.toFixed(2)+','+o.position.z.toFixed(2))}
  for(const t of[0,.7,3.3])e.update(t,false,true);e.update(1,true,false)}
 fs.rmSync(tmp,{recursive:true,force:true});
 console.log('PASS: Terres embrasées — basalt slab per free cell, centred and level with the tiles; lava only in the joints and the moat; magma pits on the 6 vents; volcanoes, obsidian, rocks and braziers stay off the board.');
})().catch(e=>{console.error(e);process.exit(1)});
