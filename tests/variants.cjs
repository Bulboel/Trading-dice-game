// v213 — Dés variantes : personnages existants transformés (teinte, pierre, argent, or, aura divine) sur les anciens dés génériques.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json')));
const el=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},setPointerCapture(){}}),els=new Map();
const c=vm.createContext({window:{dispatchEvent(){}},Event,document:{getElementById(i){if(!els.has(i))els.set(i,el());return els.get(i)}},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Date,Math,console});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,''),c);
const g=c.window.hackeniaGame,defs=g.monsters,variants=defs.map((d,i)=>[i,d]).filter(([,d])=>d.variant);
assert.equal(variants.length,27,'18 generic dice replaced + 3 new dice + 6 elemental Hydrelithes');
const names=new Set();
for(const [i,d] of variants){const r=g.rarity(d),v=d.variant;
 assert.ok(manifest.creatures[d.modelKey]?.glb,d.cn+' reuses an existing 3D model');assert.ok(!names.has(d.cn),d.cn+' has a unique name');names.add(d.cn);
 assert.ok(['tint','stone','metal'].includes(v.kind)&&/^#[0-9a-f]{6}$/i.test(v.color),d.cn+' has a valid look');
 for(const s of[128,512]){const f=path.join(root,`assets/characters/${d.portrait}-${s}.webp`);assert.ok(fs.existsSync(f),d.cn+' portrait '+s);assert.ok(fs.statSync(f).size<150000)}
 if(r===3)assert.ok(v.kind==='metal'&&v.color.toLowerCase()>'#d0','Rares are silver automatons ('+d.cn+')');
 if(r===5)assert.equal(v.color,'#f4c65a','Legendaries are gold ('+d.cn+')');
 if(r===6)assert.equal(v.aura,true,'Divines carry an aura ('+d.cn+')');
 assert.ok(d.lo.includes('Affinité'),d.cn+' states its element')}
assert.deepEqual([64,65,66].map(i=>[defs[i].el,g.rarity(defs[i])]),[['vent',1],['eau',1],['feu',2]]);
const hy=defs.slice(70,76);assert.deepEqual(hy.map(d=>d.el),'foudre vent terre glace eau feu'.split(' '),'One Hydrelithe per element');for(const d of hy){assert.equal(d.modelKey,'hydrelithe');assert.equal(g.rarity(d),1);assert.ok(!d.multi,'Elemental Hydrelithes follow the normal bonus rules');assert.deepEqual(d.c.map(t=>t[2]).sort(),[1,2,3])}
const js=fs.readFileSync(path.join(root,'assets/clearing-v105.js'),'utf8');assert.ok(/game\.rarity\?\.\([^)]*\)\)?===6\)addDivineAura/.test(js),'Divine creatures get the board aura');assert.ok(/opacity:\.42/.test(js),'Aura stays translucent');
console.log(`PASS: ${variants.length} variant dice reuse existing models with unique names, portraits, silver rares, gold legendaries, aura on divines; new commons Vent/Eau and uncommon Feu, six elemental Hydrelithes.`);
