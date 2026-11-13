// v223 — Ordre officiel de la collection et cartes des dés pas encore découverts.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),el=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},setPointerCapture(){}}),els=new Map();
const c=vm.createContext({window:{dispatchEvent(){}},Event,document:{getElementById(i){if(!els.has(i))els.set(i,el());return els.get(i)}},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Date,Math,console});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,''),c);const defs=c.window.hackeniaGame.monsters,O=require(path.join(__dirname,'../assets/collection-order-v223.js'));
const order=O.order(defs),names=order.map(i=>defs[i].cn);
assert.equal(order.length,defs.length);assert.equal(new Set(order).size,defs.length,'Every die appears exactly once');
assert.deepEqual(names.slice(0,4),['Bolduc','Bolduc légendaire','Bolduc d’argent','Eberien'],'Starts with Bolduc and all its versions (v261 : les dés mis de côté sont numérotés en dernier)');
const fam=order.filter(i=>!defs[i].pure&&!defs[i].reserved).map(i=>O.family(defs[i]));const firsts=[...new Set(fam)];
assert.deepEqual(firsts.slice(0,5),['bolduc','eberien','grimgors','jhimm','kala'],'Bolduc, Eberien, Grimgors, Jhimm, Kala first');
const rest=firsts.slice(5);assert.deepEqual(rest,[...rest].sort((a,b)=>a.localeCompare(b,'fr')),'Then alphabetical');
for(const f of firsts){const idx=fam.map((x,k)=>x===f?k:-1).filter(k=>k>=0);assert.equal(idx.at(-1)-idx[0]+1,idx.length,f+' versions follow each other')}
{const shown=order.filter(i=>!defs[i].reserved);assert.ok(shown.slice(-18).every(i=>defs[i].pure&&!defs[i].card),'Elemental dice close the collection');assert.ok(shown.slice(0,-18).every(i=>!defs[i].pure||defs[i].card));assert.ok(order.slice(shown.length).every(i=>defs[i].reserved),'les dés mis de côté sont numérotés en dernier')}
assert.deepEqual(order.filter(i=>!defs[i].reserved).slice(-18,-15).map(i=>defs[i].pure),[1,2,3],'Each element: Éclat, Sentier, Rayon');
assert.equal(names[names.indexOf('Max')+1],'Max & Alastor','Max & Alastor belongs to the Max family');
const n=O.numbers(defs);assert.equal(n[40],1,'Bolduc is N° 001');
const portal=fs.readFileSync(path.join(__dirname,'../assets/portal-v159.js'),'utf8');assert.ok(portal.includes("function mysteryCard(i)")&&portal.includes("filter={q:'',el:'',lv:'',owned:false,sort:'collection'}"),'Missing dice shown as mystery cards by default');
assert.ok(!/function mysteryCard[^\n]*d\.cn/.test(portal),'Mystery cards never reveal the name');
console.log(`PASS: ${order.length} dice in the official order (Bolduc, Eberien, Grimgors, Jhimm, Kala, then alphabetical families, elemental dice last), numbered from N° 001; missing dice shown without their name.`);
