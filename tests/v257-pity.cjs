// v257 — garanties : légendaire non possédé à 50 bourses, divin à 100 ; compteurs remis à zéro ; XP.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,'');
const els=new Map(),element=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},setPointerCapture(){}});
const ctx=vm.createContext({window:{},document:{getElementById(id){if(!els.has(id))els.set(id,element());return els.get(id)}},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Date,Math,console});vm.runInContext(source,ctx);
const monsters=JSON.parse(vm.runInContext('JSON.stringify(M)',ctx)),r=i=>monsters[i].rarity??monsters[i].lv;
const p=vm.createContext({window:{hackeniaGame:{monsters}},structuredClone,Math,RangeError});vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/purchases.js'),'utf8'),p);
const P=p.window.HackeniaPurchases;
// tirage « le plus commun possible » : jamais de légendaire ni de divin au hasard
const low=()=>0;
const leg=monsters.map((d,i)=>i).filter(i=>r(i)===5),div=monsters.map((d,i)=>i).filter(i=>r(i)===6);
let prof={gold:10,inventory:{},boosters:0,pity:{leg:49,div:10}};
let n=P.plan(prof,1,low);assert.ok(n.pouchQueue[0].dice.some(i=>r(i)===5),'légendaire garanti à la 50e bourse');assert.equal(n.pity.leg,0);assert.equal(n.pity.div,11);
// il est inédit tant qu'il en reste
leg.slice(1).forEach(i=>prof.inventory[i]=1);prof.pity={leg:49,div:0};n=P.plan(prof,1,low);assert.equal(n.pouchQueue[0].dice.find(i=>r(i)===5),leg[0],'de préférence un légendaire que l’on ne possède pas');
prof={gold:10,inventory:{},boosters:0,pity:{leg:3,div:99}};n=P.plan(prof,1,low);assert.ok(n.pouchQueue[0].dice.some(i=>r(i)===6),'divin garanti à la 100e bourse');assert.equal(n.pity.div,0);assert.equal(n.pity.leg,4);
prof={gold:10,inventory:{},boosters:0,pity:{leg:49,div:99}};n=P.plan(prof,1,low);const dd=n.pouchQueue[0].dice;assert.ok(dd.some(i=>r(i)===6)&&dd.some(i=>r(i)===5),'les deux garanties dans la même bourse');assert.deepEqual([n.pity.leg,n.pity.div],[0,0]);
// compteurs
assert.deepEqual(JSON.parse(JSON.stringify(P.pityLeft({pity:{leg:20,div:30}}))),{leg:30,div:70});assert.deepEqual(JSON.parse(JSON.stringify(P.pityLeft({}))),{leg:50,div:100});
// Échanges : légendaire et divin seulement avec un double
const {applyTrade}=require('../assets/pvp-online.js');const rar=i=>r(i);
const L=leg[0],D=div[0];
assert.throws(()=>applyTrade({inventory:{[L]:1},decks:[]},[L],[0],rar),/double/);assert.throws(()=>applyTrade({inventory:{[D]:1},decks:[]},[D],[0],rar),/double/);
assert.ok(applyTrade({inventory:{[L]:2},decks:[]},[L],[0],rar).inventory[L]===1);
assert.ok(applyTrade({inventory:{0:1},decks:[]},[0],[1],rar).inventory[1]===1,'les autres raretés restent échangeables à l’unité');
const em=fs.readFileSync(path.join(__dirname,'../assets/ember-v239.js'),'utf8'),css=fs.readFileSync(path.join(__dirname,'../assets/fixes-v254.css'),'utf8'),pouch=fs.readFileSync(path.join(__dirname,'../assets/pouch-opening-v122.js'),'utf8');
for(const k of['function lavaFlow(','function deadTree(','function skeleton(','function vent2('])assert.ok(em.includes(k),k);
assert.ok(css.includes('.draw-die:not(:disabled):hover .pd-cube{filter:none!important')&&css.includes('.pouch-divine-burst'),'cube 3D au survol, éclat divin');
assert.ok(pouch.includes("play(isDivine?'Divin':'Rareté')")&&pouch.includes("pouch-gold-halo"),'divin ≠ légendaire');
console.log('v257 pity OK');
