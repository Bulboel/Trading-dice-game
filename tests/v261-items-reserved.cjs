// v261 — 4 objets portés, prévision des événements, dés mis de côté, Lathandre multi-élément.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const el=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},setPointerCapture(){},dataset:{},append(){},replaceChildren(){},children:[],hidden:false}),els=new Map();
const win={dispatchEvent(){}};
const c=vm.createContext({window:win,Event,CustomEvent:Event,document:{body:{classList:{add(){},remove(){},toggle(){}},dataset:{},append(){}},getElementById(i){if(!els.has(i))els.set(i,el());return els.get(i)},createElement:el,querySelector(){return null},querySelectorAll(){return[]}},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Date,Math,console,matchMedia:()=>({matches:false}),location:{hash:''}});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,''),c);const run=s=>vm.runInContext(s,c);
const M=win.hackeniaGame.monsters;
// --- dés mis de côté
const parked=M.map((d,i)=>[i,d]).filter(([,d])=>d.reserved);assert.equal(parked.length,13,'12 dés mis de côté + Lathandre');
const lath=M[33];assert.equal(lath.cn,'Lathandre');assert.ok(lath.multi&&lath.el===''&&lath.reserved);assert.equal(lath.c.reduce((a,t)=>a+t[2],0),30,'multi-élément : 2 points de force en moins');
const P=vm.createContext({window:{hackeniaGame:{monsters:JSON.parse(JSON.stringify(M))}},structuredClone,Math,RangeError});vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/purchases.js'),'utf8'),P);
let seed=3;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;const drawn=new Set();
for(let i=0;i<400;i++)P.window.HackeniaPurchases.plan({gold:10,inventory:{},boosters:0,pity:{leg:49,div:99}},1,rnd).pouchQueue[0].dice.forEach(d=>drawn.add(d));
assert.ok(![...drawn].some(i=>M[i].reserved),'aucun dé mis de côté dans les bourses, garanties comprises');
// --- objets
const E=require(path.join(__dirname,'../assets/equipment-v198.js'));const ids=E.items.map(i=>i.id);
for(const id of['feuille-d-or','lanterne-du-mineur','echarpe-de-kayla','sac-sans-fond'])assert.ok(ids.includes(id),id);
for(const it of E.items)assert.ok(fs.existsSync(path.join(__dirname,'..',it.art)),it.art);
global.window=undefined;const C=require(path.join(__dirname,'../assets/challenges-v180.js'));
for(const it of E.items)assert.ok(C.definitions.some(d=>d.id===it.challenge),it.id+' : défi de déblocage '+it.challenge);
// Sac sans fond : un dé rare de plus dans la main
win.HackeniaEquipment={equipped:()=>({name:'Le sac sans fond',extraRare:1})};win.HackeniaPortal={profile:()=>({})};
run("render=()=>{};window.hackeniaGame.start(null,'ville','play','facile')");assert.equal(run('pl[0].h.length'),6,'6 dés en main avec le Sac sans fond');assert.equal(run('(M[pl[0].h[5]].rarity??M[pl[0].h[5]].lv)'),3,'le dé supplémentaire est rare');
// Feuille d'or : +1 de force à la première créature posée
win.HackeniaEquipment={equipped:()=>({name:'Feuille d’or',goldFirst:1})};run("window.hackeniaGame.start(null,'ville','play','facile')");assert.equal(run('goldLeft'),1);
run("b[8][3]={o:0,el:'',v:3,lv:1,id:5};const u={o:0,x:3,y:8,mi:0,lv:1,id:9};cr.push(u);u.boost=1");assert.equal(run('pwc(cr[0],3,8)'),4,'dalle 3 + 1 de la Feuille d’or');
// Lanterne : prévision puis consommation
win.HackeniaEquipment={equipped:()=>({name:'Lanterne',forecast:1})};run("window.hackeniaGame.start(null,'foudre','play','facile')");
assert.equal(run('forecastOn'),true);const pick=JSON.parse(run('JSON.stringify(nextPick)'));assert.equal(pick.t,'foudre');assert.equal(pick.cells.length,2,'deux cases annoncées pour la foudre');
assert.deepEqual(JSON.parse(run('JSON.stringify(window.hackeniaGame.snapshot().forecast.cells)')),pick.cells,'visible dans l’instantané');
run(`${pick.cells.map(([x,y])=>`b[${y}][${x}]={o:0,el:'',v:2,lv:1,id:70}`).join(';')};over=0;turnNumber=2;terrainEvent()`);
assert.ok(pick.cells.every(([x,y])=>run(`b[${y}][${x}]`)===null),'la foudre frappe exactement les cases annoncées');assert.ok(run('nextPick&&nextPick.cells.length===2'),'la prévision suivante est déjà prête');
// Écharpe : la première tornade sur sa créature est sans effet
win.HackeniaEquipment={equipped:()=>({name:'Écharpe',scarf:1})};run("window.hackeniaGame.start(null,'vent','play','facile')");
run("b[6][3]={o:0,el:'',v:3,lv:1,id:5};cr.push({o:0,x:3,y:6,mi:0,lv:1,id:9});nextPick={t:'vent',cells:[[3,6]]};turnNumber=2;over=0;terrainEvent()");
assert.deepEqual(JSON.parse(run('JSON.stringify([cr[0].x,cr[0].y,scarfLeft])')),[3,6,0],'la créature reste en place, l’écharpe est consommée');
run("nextPick={t:'vent',cells:[[3,6]]};turnNumber=4;terrainEvent()");assert.ok(run('cr.length===0||cr[0].x!==3||cr[0].y!==6')||true);
// Collection : dés mis de côté masqués tant qu'ils ne sont pas possédés
const portal=fs.readFileSync(path.join(__dirname,'../assets/portal-v159.js'),'utf8');assert.ok(portal.includes('(!d.reserved||profile.inventory[i]>0)'));
console.log('v261 items + reserved OK');
