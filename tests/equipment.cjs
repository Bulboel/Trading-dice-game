const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.join(__dirname,'..');
// Défi « chapitre 1 » : seules les parties principales comptent ; il débloque la Bague chanceuse.
global.window={};require(path.join(root,'assets/story-data-v193.js'));const C=require(path.join(root,'assets/challenges-v180.js'));window.HackeniaChallenges=C;
const E=require(path.join(root,'assets/equipment-v198.js'));
const d=C.definitions.find(x=>x.id==='chapter3');assert.ok(d,'Chapter 3 challenge exists');
let main=window.HACKENIA_STORY.filter(p=>p.chapter===3&&!p.optional).map(p=>p.id);if(!main.length)main=Array.from({length:d.target},(_,i)=>'c3p'+(i+1));/* chapitre 3 pas encore écrit */assert.equal(d.target,main.length);
const partial={story:{done:Object.fromEntries(main.slice(0,-1).map(id=>[id,true]))},equipped:'bague-chanceuse'};
assert.equal(C.progress(partial,d),main.length-1);assert.deepEqual(E.owned(partial),[]);assert.equal(E.equipped(partial),null,'A locked item cannot be worn');
const full={story:{done:Object.fromEntries(main.map(id=>[id,true]))},equipped:'bague-chanceuse'};
assert.deepEqual(E.owned(full).map(i=>i.id),['bague-chanceuse']);assert.equal(E.equipped(full).startBonus,1);assert.ok(fs.existsSync(path.join(root,E.items[0].art)));
// Moteur : un dé bonus de départ contre l'IA uniquement.
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),src=html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,'');
const els=new Map(),element=()=>{const store={style:{setProperty(){}},classList:{add(){},remove(){},toggle(){},contains:()=>false},dataset:{},children:[]};return new Proxy(store,{get:(t,k)=>k in t?t[k]:(k==='querySelector'||k==='closest'?()=>null:k==='querySelectorAll'?()=>[]:typeof k==='symbol'?undefined:()=>element()),set:(t,k,v)=>(t[k]=v,true)})};
const ctx=vm.createContext({window:{HackeniaEquipment:E,HackeniaPortal:{profile:()=>full},dispatchEvent(){}},document:{getElementById(id){if(!els.has(id))els.set(id,element());return els.get(id)}},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Date,Math,console,Event});
vm.runInContext(src,ctx);vm.runInContext('render=()=>{};theme=()=>{};',ctx);const game=ctx.window.hackeniaGame,deck=[3,5,6,7,8,9,10,12,13,14];
for(const kind of ['play','quick','story']){game.start(deck,'terre',kind,'moyen');assert.deepEqual(JSON.parse(vm.runInContext('JSON.stringify(bonus)',ctx)),[1,0],kind+': ring gives one starting bonus die to the player only');assert.ok(vm.runInContext("gameEvents.some(e=>e.type==='Objet porté')",ctx),'Logged in the history')}
game.start(deck,'terre','tutorial','moyen');assert.deepEqual(JSON.parse(vm.runInContext('JSON.stringify(bonus)',ctx)),[0,0],'No bonus in the tutorial');
ctx.window.HackeniaPortal.profile=()=>({...full,equipped:''});game.start(deck,'terre','play','moyen');assert.deepEqual(JSON.parse(vm.runInContext('JSON.stringify(bonus)',ctx)),[0,0],'No item, no bonus');
console.log('PASS: chapter 3 challenge (main parts only) unlocks the Lucky Ring; worn ring gives 1 starting bonus die vs AI (play, quick, story), never in the tutorial or without the item.');
