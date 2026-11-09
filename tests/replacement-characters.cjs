const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json')));
const element=()=>({children:[],style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},setPointerCapture(){}}),els=new Map();
const context=vm.createContext({window:{dispatchEvent(){}},Event,document:{getElementById(id){if(!els.has(id))els.set(id,element());return els.get(id)}},fetch:async()=>({ok:true,json:async()=>manifest}),console,Date,Math,setTimeout:()=>0,clearTimeout(){}});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,''),context);
const game=context.window.hackeniaGame,defs=game.monsters;
// Dé existant → personnage qui le remplace (les stats, l'élément et la rareté du dé ne changent pas).
const expected={30:['Caleizis','caleizis','foudre',6],34:['La fée Pachié','pachie','eau',6],24:['Gliska','gliska','foudre',5],25:['Kayla légendaire','kayla-legendaire','vent',5],26:['Hilam','hilam','terre',5],27:['Eberien légendaire','eberien-legendaire','glace',5],28:['Bolduc légendaire','bolduc-legendaire','eau',5],29:['Bosco','bosco','feu',5],10:['Bulbalina','bulbalina','eau',2],8:['Frolgor','frolgor','terre',2]};
assert.equal(defs.length,55,'Only the 12 elemental dice are appended');
function glb(file){const b=fs.readFileSync(file);assert.equal(b.readUInt32LE(0),0x46546c67);assert.equal(b.readUInt32LE(8),b.length);return JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));}
let clips=0;
for(const [i,[name,key,el,rarity]] of Object.entries(expected)){
 const d=defs[i];assert.equal(d.n,name);assert.equal(d.cn,name);assert.equal(d.modelKey,key);assert.equal(d.el,el);assert.equal(game.rarity(d),rarity);assert.ok(d.lo.length>20,'Has a description');
 const info=manifest.creatures[key];assert.equal(info.nom,name);
 const base=glb(path.join(root,'assets',info.glb)),names=new Set(base.nodes.map(n=>n.name));
 assert.deepEqual(Object.keys(info.animations).sort(),['spell','victory','walk']);
 for(const [kind,file] of Object.entries(info.animations)){
  const p=path.join(root,'assets',file),clip=glb(p);assert.ok(fs.statSync(p).size<1500000,'Clip stays lightweight');assert.ok(!clip.images&&!clip.meshes,'Clip excludes model geometry and textures');assert.equal(clip.animations.length,1);
  for(const channel of clip.animations[0].channels)assert.ok(names.has(clip.nodes[channel.target.node].name),`${name} ${kind}: track binds to idle skeleton`);
  clips++;
 }
}
assert.equal(clips,30);
// Les dés voisins qui partageaient l'animal gardent leur créature d'origine.
assert.equal(defs[4].cn,'Poisson Goutte');assert.equal(defs[2].cn,'Fourmi Caillou');assert.equal(defs[18].cn,'Salamandre Voltaïque');assert.equal(defs[31].cn,'Dragon des Vents');
(async()=>{
 for(const i of Object.keys(expected))assert.equal((await game.modelInfo(+i)).nom,defs[i].cn,'Model is requested even for peu commun dice');
 assert.equal(await game.modelInfo(4),null,'Other common dice still do not request animated models');
 console.log('PASS: 10 existing dice become characters with unchanged stats/element/rarity, 30 lightweight clips bound to each idle skeleton, neighbours untouched.');
})().catch(e=>{console.error(e);process.exit(1)});
