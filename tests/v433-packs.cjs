// v433 — Pack Aventurier (boubourse garantie légendaire ou mieux + 500 Bubulles, une seule fois) et Pack Élémentaire
// (élément du héros + un dé de l'élément par rareté : commun, peu commun, rare, légendaire + 500 Bubulles).
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.join(__dirname,'..'),src=fs.readFileSync(path.join(root,'index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,'');
const els=new Map(),el=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},setPointerCapture(){},clientWidth:400});
const c=vm.createContext({window:{dispatchEvent(){}},Event,document:{getElementById(i){if(!els.has(i))els.set(i,el());return els.get(i)}},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Date,Math,console,structuredClone});vm.runInContext(src,c);
c.window.structuredClone=structuredClone;vm.runInContext(fs.readFileSync(path.join(root,'assets/purchases.js'),'utf8'),c);vm.runInContext(fs.readFileSync(path.join(root,'assets/packs-v433.js'),'utf8'),c);
const K=c.window.HackeniaPacks,M=c.window.hackeniaGame.monsters,rar=i=>M[i].rarity??M[i].lv;
const base={version:1,gold:10000,inventory:{},decks:[],hero:{name:'Aria',el:'feu'}};
for(let n=0;n<200;n++){const next=K.buyAdventurer(base);assert.ok(next,'achat possible');const pack=next.pouchQueue[0];assert.equal(pack.dice.length,3);assert.ok(pack.dice.some(i=>[5,6,8].includes(rar(i))),'au moins un légendaire ou mieux');assert.ok(pack.dice.every(i=>!M[i].reserved));assert.equal(next.gold,10000-K.ADVENTURER.price+K.ADVENTURER.gold);assert.ok(K.adventurerOwned(next));assert.equal(K.buyAdventurer(next),null,'une seule fois')}
for(const e of K.ELS){const r=K.buyElemental(base,e);assert.deepEqual(r.dice.map(rar),[1,2,3,5],e+' : une rareté de chaque');assert.ok(r.dice.every(i=>M[i].el===e&&!M[i].reserved&&!M[i].shiny),e+' : dés de l’élément choisi');assert.equal(r.profile.hero.el,e,'le héros prend l’élément');assert.equal(r.profile.gold,10000-K.ELEMENTAL.price+K.ELEMENTAL.gold);for(const i of r.dice)assert.equal(r.profile.inventory[i],1)}
assert.equal(K.buyElemental({...base,gold:10},'vent'),null,'pas assez de Bubulles');
console.log('PASS: Pack Aventurier (boubourse légendaire garantie, 500 Bubulles, une seule fois) et Pack Élémentaire (4 dés de l’élément, un par rareté, élément du héros, 500 Bubulles).');
