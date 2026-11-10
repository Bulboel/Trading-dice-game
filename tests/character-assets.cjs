const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json')));
const element=()=>({children:[],style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},setPointerCapture(){}}),els=new Map();
const context=vm.createContext({window:{dispatchEvent(){}},Event,document:{getElementById(id){if(!els.has(id))els.set(id,element());return els.get(id)}},fetch:async()=>({ok:true,json:async()=>manifest}),console,Date,Math,setTimeout:()=>0,clearTimeout(){}});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,''),context);
const game=context.window.hackeniaGame,defs=game.monsters;
assert.equal(defs.length,67);assert.deepEqual(Array.from(defs.slice(36,39),d=>d.n),['Eberien','Kala','Grimgors'],'Existing inventory IDs remain stable');
for(const d of defs.slice(36,41)){assert.equal(game.rarity(d),3);assert.equal(d.need,3);assert.equal(d.nd,1);assert.equal(d.lv,2);assert.deepEqual(JSON.parse(JSON.stringify(d.c)),JSON.parse(JSON.stringify(defs[36].c)));}
assert.deepEqual(Array.from(defs.slice(38,41),d=>d.el),['eau','vent','feu']);assert.equal(defs[42].el,'','Balai has no elemental affinity');
const guardian=defs[41],highest=guardian.c.reduce((a,b)=>b[2]>=a[2]?b:a);assert.deepEqual(Array.from(highest),[0,2,6],'Guardian appears on the strong bottom tile of her L');
function glb(file){const b=fs.readFileSync(file);assert.equal(b.readUInt32LE(0),0x46546c67);assert.equal(b.readUInt32LE(8),b.length);return JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));}
let clips=0;
for(let i=36;i<43;i++){
 const d=defs[i],info=manifest.creatures[d.modelKey],base=glb(path.join(root,'assets',info.glb)),names=new Set(base.nodes.map(n=>n.name));
 for(const size of [128,512]){const p=path.join(root,`assets/characters/${d.portrait}-${size}.webp`);assert.ok(fs.statSync(p).size<150000,'Portrait must fit mobile budget');}
 for(const [kind,file]of Object.entries(info.animations||{})){
  const p=path.join(root,'assets',file),clip=glb(p);assert.ok(fs.statSync(p).size<1500000,'Clip stays lightweight');assert.ok(!clip.images&&!clip.meshes,'Clip excludes model geometry and textures');assert.equal(clip.animations.length,1);
  const animation=clip.animations[0];for(const channel of animation.channels)assert.ok(names.has(clip.nodes[channel.target.node].name),`${d.n} ${kind}: track binds to idle skeleton`);
  if(d.n==='Kala')assert.equal(animation.name,{spell:'Axe_Spin_Attack',walk:'Walking',victory:'Joyful_Dance_with_Hand_Sway'}[kind]);
  clips++;
 }
 assert.match(game.portrait(i),new RegExp(d.portrait+'-128.webp'));
}
assert.equal(clips,18);
const purchaseContext=vm.createContext({window:{hackeniaGame:game},structuredClone,Math,RangeError});vm.runInContext(fs.readFileSync(path.join(root,'assets/purchases.js'),'utf8'),purchaseContext);
const rarePool=defs.map((d,i)=>({d,i})).filter(({d})=>game.rarity(d)===3).map(({i})=>i);
for(const id of rarePool){let calls=0;const random=()=>++calls%2===1?.65:(rarePool.indexOf(id)+.5)/rarePool.length;const result=purchaseContext.window.HackeniaPurchases.plan({gold:10,inventory:{},boosters:0},1,random);assert.equal(result.pouchQueue[0].dice[0],id,'Every rare character can be drawn');assert.deepEqual(Array.from(result.pouchQueue[0].firstSeen),[0]);}
(async()=>{for(let i=0;i<defs.length;i++)if(!defs[i].pure)assert.ok(defs[i].modelKey&&(await game.modelInfo(i))?.animations||defs[i].modelKey==='messire-balai',defs[i].cn+' : every creature die has a real character (v213)');for(let i=36;i<43;i++)assert.equal((await game.modelInfo(i)).nom,defs[i].cn);console.log('PASS: stable inventory IDs, rare heroes without stat changes, L spawn, 14 mobile portraits, 18 correct clips matching idle skeletons, rare draws and a real character on every creature die.');})().catch(e=>{console.error(e);process.exitCode=1});
