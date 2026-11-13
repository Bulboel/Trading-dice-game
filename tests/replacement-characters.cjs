const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json')));
const element=()=>({children:[],style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},setPointerCapture(){}}),els=new Map();
const context=vm.createContext({window:{dispatchEvent(){}},Event,document:{getElementById(id){if(!els.has(id))els.set(id,element());return els.get(id)}},fetch:async()=>({ok:true,json:async()=>manifest}),console,Date,Math,setTimeout:()=>0,clearTimeout(){}});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,''),context);
const game=context.window.hackeniaGame,defs=game.monsters;
// Dé existant → personnage qui le remplace (les stats, l'élément et la rareté du dé ne changent pas).
const expected={30:['Caleizis','caleizis','foudre',6],34:['La fée Pachié','pachie','eau',6],24:['Gliska','gliska','foudre',5],25:['Kayla légendaire','kayla-legendaire','vent',5],26:['Hilam','hilam','terre',5],27:['Eberien légendaire','eberien-legendaire','glace',5],28:['Bolduc légendaire','bolduc-legendaire','eau',5],29:['Bosco','bosco','feu',5],10:['Bulbalina','bulbalina','eau',2],8:['Frolgor','frolgor','terre',2],0:['Maebril','maebril','foudre',1],2:['Orven','orven','terre',1],
 // v197 : le personnage apporte son élément ; forme, lancer et rareté du dé restent ceux d'origine.
 1:['Max','max','',1],22:['Sameron','sameron','vent',5],18:['Zackarie','zackarie','eau',5],19:['Soryan','soryan','feu',5],4:['Velmarys','velmarys','terre',1],11:['Pennedra','pennedra','vent',2],
 // v197 : nouveaux dés ajoutés après les dés élémentaires.
 55:['Max & Alastor','max-alastor','foudre',3],56:['Orcus','orcus','foudre',5],57:['Ven','ven','glace',1]};
assert.equal(defs.length,120,'Appended in order: elemental, characters, Énergie, variants, new characters, Hydrelithes, Bosco/Myconide declinations, alternative rarities, v248 Hydrelithe majeure, Mineurs, Araignées');
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
assert.equal(clips,Object.keys(expected).length*3);
for(const [i,key] of [[1,'max'],[22,'sameron'],[18,'zackarie'],[19,'soryan'],[4,'velmarys'],[11,'pennedra'],[55,'max-alastor'],[56,'orcus'],[57,'ven'],[29,'bosco'],[10,'bulbalina'],[34,'pachie'],[25,'kayla-legendaire'],[28,'bolduc-legendaire'],[30,'caleizis'],[27,'eberien-legendaire'],[8,'frolgor'],[24,'gliska'],[26,'hilam'],[0,'maebril'],[2,'orven']]){assert.equal(defs[i].portrait,key);for(const size of [128,512])assert.ok(fs.statSync(path.join(root,`assets/characters/${key}-${size}.webp`)).size<150000,'Portrait fits the mobile budget')}
// Les dés voisins qui partageaient l'animal gardent leur créature d'origine.
assert.equal(defs[7].cn,'Statue de Gliska');assert.equal(defs[5].cn,'Ven Ardent');assert.equal(defs[16].cn,'Eberien d’argent');assert.equal(defs[31].cn,'Kayla céleste','v213: generic dice now carry variant characters');
// Les nouveaux dés ont des formes qu'aucun autre dé n'utilise, et des valeurs cohérentes avec leur rareté.
const shape=d=>{const xs=d.c.map(a=>a[0]),ys=d.c.map(a=>a[1]),x0=Math.min(...xs),y0=Math.min(...ys);return d.c.map(([x,y])=>(x-x0)+','+(y-y0)).sort().join(' ')};
for(const i of [55,56])for(let j=0;j<defs.length;j++)if(j!==i)assert.notEqual(shape(defs[i]),shape(defs[j]),defs[i].n+' has a unique shape');
assert.equal(defs[57].c.length,3,'Ven follows the common rule: three tiles');assert.equal(defs[57].c.reduce((a,c)=>a+c[2],0),6);
assert.deepEqual([defs[56].nd,defs[56].need],[2,4],'v252 : légendaire à 4+');assert.deepEqual([defs[55].nd,defs[55].need],[1,3]);
(async()=>{
 for(const i of Object.keys(expected))assert.equal((await game.modelInfo(+i)).nom,defs[i].cn,'Model is requested even for peu commun dice');
 assert.equal((await game.modelInfo(3))?.nom,'Orven','v213: former generic commons reuse a character model (Orven du Givre)');
 console.log('PASS: 18 existing dice become characters (stats/rarity kept), 3 new character dice, lightweight clips bound to each idle skeleton, neighbours untouched.');
})().catch(e=>{console.error(e);process.exit(1)});
