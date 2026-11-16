// v332 — Duels d'Histoire : chaque adversaire a un deck complet de 10 dés, joué tel quel (aucun dé tiré au hasard).
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');const root=path.join(__dirname,'..');
const w={};vm.runInContext(fs.readFileSync(path.join(root,'assets/story-data-v193.js'),'utf8'),vm.createContext({window:w}));
const duels=w.HACKENIA_STORY.filter(p=>p.duel);
for(const p of duels)assert.equal(p.duel.dice.length,10,p.id+' : 10 dés');
const spider=duels.find(p=>p.duel.foe==='L’araignée géante').duel.dice;assert.ok(spider.every(i=>i>=97&&i<=103),'l’araignée géante ne joue que des araignées noires');
const source=fs.readFileSync(path.join(root,'index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,'');
const els=new Map(),element=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},setPointerCapture(){}});
const ctx=vm.createContext({window:{dispatchEvent(){}},document:{getElementById(id){if(!els.has(id))els.set(id,element());return els.get(id)}},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Date,Math,console,Event});vm.runInContext(source,ctx);
for(const p of duels){vm.runInContext(`aiLevel=${JSON.stringify(p.duel.level)};storyFoe={name:'x',dice:${JSON.stringify(p.duel.dice)},power:'',used:0}`,ctx);
 for(let k=0;k<5;k++){const d=JSON.parse(vm.runInContext('JSON.stringify(storyDeck())',ctx));assert.deepEqual([...d].sort((a,b)=>a-b),[...p.duel.dice].sort((a,b)=>a-b),p.id+' : deck joué tel quel')}}
for(const f of fs.readdirSync(path.join(root,'assets/story/cards')))assert.ok(/\.webp$/.test(f));
console.log('PASS: '+duels.length+' Story duels with a full 10-die deck played as given (giant spider: black spiders only).');
{// Limites de rareté : aucun deck d'Histoire n'a besoin d'être corrigé par le moteur (sinon l'adversaire jouerait autre chose que prévu).
 const CAP={6:1,5:2,7:2,3:4};for(const p of duels){const n={};for(const m of p.duel.dice){const r=vm.runInContext(`rarityOf(M[${m}])`,ctx);n[r]=(n[r]||0)+1}
  for(const [r,max] of Object.entries(CAP))assert.ok((n[r]||0)<=max,`${p.id} (${p.duel.foe}) : ${n[r]} dés de rareté ${r}, maximum ${max}`)}}
