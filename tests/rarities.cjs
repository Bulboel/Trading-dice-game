const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,'');
const els=new Map(),element=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},setPointerCapture(){}});
const ctx=vm.createContext({window:{},document:{getElementById(id){if(!els.has(id))els.set(id,element());return els.get(id)}},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Date,Math,console});vm.runInContext(source,ctx);
const r=JSON.parse(vm.runInContext('JSON.stringify(M.map(rarityOf))',ctx)),lv=JSON.parse(vm.runInContext('JSON.stringify(M.map(d=>d.lv))',ctx));
assert.ok(!r.includes(4),'No die is Épique anymore');assert.deepEqual([...new Set(r)].sort(),[1,2,3,5,6,7],'Commun, Peu commun, Rare, Légendaire, Divin, Énergie');
for(let i=18;i<24;i++){assert.equal(lv[i],4);assert.equal(r[i],5,'Level IV dice are legendary')}
// Bourse : Commun 30 %, Peu commun 25 %, Rare 20 %, Légendaire 12 %, Divin 1 %, Énergie 12 %.
const monsters=JSON.parse(vm.runInContext('JSON.stringify(M)',ctx)),p=vm.createContext({window:{hackeniaGame:{monsters}},structuredClone,Math,RangeError});vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/purchases.js'),'utf8'),p);
const tally={1:0,2:0,3:0,4:0,5:0,6:0,7:0},N=6000;let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
for(let k=0;k<N/3;k++)p.window.HackeniaPurchases.plan({gold:10,inventory:{},boosters:0},1,rnd).pouchQueue[0].dice.forEach(i=>tally[r[i]]++);
const pct=k=>tally[k]/N*100;assert.equal(tally[4],0);
for(const [k,want] of [[1,30],[2,25],[3,20],[5,12],[6,1],[7,12]])assert.ok(Math.abs(pct(k)-want)<2.5,`rarity ${k}: ${pct(k).toFixed(1)} % vs ${want} %`);
console.log('PASS: six rarities (no Épique), level IV dice are legendary, pouch odds 30/25/20/12/1/12 % ('+[1,2,3,5,6,7].map(k=>pct(k).toFixed(1)).join(' / ')+').');
