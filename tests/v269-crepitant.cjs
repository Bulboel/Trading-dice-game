// v269 — Rareté « Crépitant » : une version galaxie (shiny) de chaque dé de base, trois fois plus rare qu'un divin.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const el=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},setPointerCapture(){}}),els=new Map();
const c=vm.createContext({window:{dispatchEvent(){}},Event,document:{getElementById(i){if(!els.has(i))els.set(i,el());return els.get(i)}},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Date,Math,console});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,''),c);
const g=c.window.hackeniaGame,M=g.monsters,manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json'),'utf8'));
const shiny=M.map((d,i)=>[i,d]).filter(([,d])=>d.shiny);
// Sélection : dés de base uniquement (ni variantes, ni dés à effet, sacrés, de carte ou de classe, ni dés mis de côté)
const isBase=d=>!d.shiny&&!d.pure&&!d.variant&&!d.fx&&!d.terrain2&&!d.cls&&!d.reserved&&!d.card;
const base=M.map((d,i)=>[i,d]).filter(([,d])=>isBase(d));
assert.equal(shiny.length,base.length,'une version Crépitante par dé de base');assert.equal(shiny.length,52);
assert.ok(shiny.every(([,d])=>d.shinyOf!==undefined&&isBase(M[d.shinyOf])),'chaque Crépitant renvoie à un dé de base');
assert.ok(M.slice(0,128).every(d=>!d.shiny),'les 128 premiers numéros restent intacts : les Crépitants sont ajoutés à la fin');
const names=new Set();
for(const [i,d] of shiny){const b=M[d.shinyOf];assert.equal(g.rarity(d),8,d.cn+' : rareté 8');assert.equal(d.cn,b.cn+' Crépitant');assert.ok(!names.has(d.cn),d.cn+' : nom unique');names.add(d.cn);
 assert.deepEqual(JSON.parse(JSON.stringify(d.c)),JSON.parse(JSON.stringify(b.c)),d.cn+' : mêmes dalles que son dé de base');
 assert.equal(d.need,b.need);assert.equal(d.nd,b.nd);assert.equal(d.el,b.el);assert.equal(d.modelKey,b.modelKey,d.cn+' : même personnage 3D');
 assert.deepEqual(JSON.parse(JSON.stringify(d.variant)),{kind:'galaxy',color:'#8a6bff'});assert.equal(d.portrait,b.portrait+'-crep');
 for(const s of[128,512])assert.ok(fs.existsSync(path.join(root,`assets/characters/${d.portrait}-${s}.webp`)),d.cn+' miniature '+s)}
assert.ok(shiny.some(([,d])=>d.els),'les duos et trios de bébémentaires ont aussi leur version Crépitante');
// Boutique : trois fois plus rare qu'un divin
const P=vm.createContext({window:{hackeniaGame:{monsters:JSON.parse(JSON.stringify(M))}},structuredClone,Math,RangeError});vm.runInContext(fs.readFileSync(path.join(root,'assets/purchases.js'),'utf8'),P);
const W=P.window.HackeniaPurchases.WEIGHTS;assert.ok(Math.abs(W[7]*3-W[5])<.02,'Crépitant = divin / 3 ('+W[7]+' contre '+W[5]+')');
// Un lot tire bien des Crépitants (poids maximal) et ne les met pas dans la garantie divine
const lot=P.window.HackeniaPurchases.plan({gold:10,inventory:{},boosters:0},1,()=>.9999);assert.ok(lot.pouchQueue[0].dice.every(i=>M[i].shiny),'tirage au sommet de la table : Crépitants');
// Shaders et effets
const look=fs.readFileSync(path.join(root,'assets/variant-look.js'),'utf8'),mv=fs.readFileSync(path.join(root,'assets/variant-mv-v221.js'),'utf8');
for(const [n,f] of[['plateau',look],['fiches',mv]]){assert.ok(f.includes("look.kind==='galaxy'?3"),n+' : look galaxy');assert.ok(f.includes('hkStars')&&f.includes('hkPos=position'),n+' : étoiles et nébuleuses en 3D')}
const cl=fs.readFileSync(path.join(root,'assets/clearing-v105.js'),'utf8');assert.ok(cl.includes('function addCrackle')&&cl.includes('updateCrackles(now)')&&cl.includes('addCrackle(g)'),'étincelles qui crépitent sur le plateau');
const css=fs.readFileSync(path.join(root,'assets/fixes-v254.css'),'utf8');assert.ok(css.includes('.crepitant::before')&&css.includes('crep-a'),'étincelles dans les fiches');
// Decks, recyclage, collection
const portal=fs.readFileSync(path.join(root,'assets/portal-v159.js'),'utf8');assert.ok(/DECK_LIMITS=\{6:1,5:2,7:2,3:4,8:1\}/.test(portal),'un seul Crépitant par deck');
const R=require(path.join(root,'assets/recycle-v220.js'));const prof={inventory:{[shiny[0][0]]:3},decks:[]};const plan=R.plan(prof,M,d=>g.rarity(d));assert.equal(plan.items[0].keep,1,'recyclage : on garde un Crépitant');assert.equal(plan.items[0].extra,2);
const order=require(path.join(root,'assets/collection-order-v223.js'));const o=order.order(M);assert.equal(o.length,M.length);const pos=id=>o.indexOf(id),f0=shiny[0];assert.ok(pos(f0[0])>pos(f0[1].shinyOf),'le Crépitant suit son dé de base dans la collection');
console.log('PASS: 52 dés Crépitants (rareté 8, galaxie, étincelles), 3 fois plus rares qu’un divin, mêmes dalles et même personnage, 1 par deck, recyclables, rangés après leur dé de base.');
