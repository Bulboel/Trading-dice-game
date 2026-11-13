// v260 — dés de carte (mur de glace, piège) et dés de classe (soigneur, éclaireur).
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const el=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},setPointerCapture(){},dataset:{},append(){},replaceChildren(){},children:[],hidden:false}),els=new Map();
const c=vm.createContext({window:{dispatchEvent(){}},Event,CustomEvent:Event,document:{body:{classList:{add(){},remove(){},toggle(){}},dataset:{},append(){}},getElementById(i){if(!els.has(i))els.set(i,el());return els.get(i)},createElement:el,querySelector(){return null},querySelectorAll(){return[]}},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Date,Math,console});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,''),c);const run=s=>vm.runInContext(s,c);
const M=c.window.hackeniaGame.monsters,idx=n=>M.findIndex(d=>d.cn===n);
const wall=idx('Mur de glace'),trap=idx('Piège à braises'),heal=idx('Myconide le Guérisseur'),scout=idx('Max l’Éclaireur');
assert.ok(wall>=0&&trap>=0&&heal>=0&&scout>=0);
assert.ok(M[wall].pure&&M[wall].card==='wall'&&M[trap].card==='trap','dés de carte : posés sans lancer');
assert.equal(M[heal].c.length,4);assert.equal(M[scout].c.length,4);assert.equal(M[heal].rarity,3);
const fresh=()=>run(`render=()=>{};ai=false;TER=TL.indexOf('ville');b=Array.from({length:H},()=>Array(W).fill(null));cr=[];walls=[];traps=[];scoutUntil=[0,0];turnNumber=1;cur=0;over=0;kills=[0,0];pl=[{h:[],q:[],s:0},{h:[${wall},${trap},0,1,2],q:[],s:0}];msg=''`);
// --- Mur de glace : bloque la case, expire au bout de 3 tours
fresh();run(`die=${wall};const all=[[3,H-2,2],[3,H-3,3]];walls.push({x:3,y:H-3,until:turnNumber+6,o:0})`);
assert.equal(run('blocked(3,H-3)'),true,'le mur bloque la case');assert.equal(run('blocked(4,H-3)'),false);
run('turnNumber=8;terrainEvent()');assert.equal(run('walls.length'),0,'le mur fond après 3 tours');assert.equal(run('blocked(3,H-3)'),false);
// --- Piège : détruit la première créature ennemie qui s'y arrête, et compte un combat gagné
fresh();run(`b[5][3]={o:1,el:'',v:3,lv:1,id:1};b[6][3]={o:0,el:'',v:3,lv:1,id:2};cr.push({o:0,x:3,y:6,mi:0,lv:1,id:11});traps.push({x:3,y:5,o:1})`);
run(`cur=0;const u=cr[0];mv(u,3,5)`);assert.equal(run('cr.length'),0,'la créature disparaît');assert.equal(run('kills[1]'),1,'le propriétaire du piège compte un ennemi vaincu');assert.equal(run('traps.length'),0,'le piège est consommé');
fresh();run(`b[5][3]={o:0,el:'',v:3,lv:1,id:1};b[6][3]={o:0,el:'',v:3,lv:1,id:2};cr.push({o:0,x:3,y:6,mi:0,lv:1,id:11});traps.push({x:3,y:5,o:0})`);
run('cur=0;mv(cr[0],3,5)');assert.equal(run('cr.length'),1,'son propre piège ne se déclenche pas');
// visible seulement par son propriétaire
fresh();run('traps.push({x:1,y:1,o:0},{x:2,y:2,o:1})');assert.deepEqual(JSON.parse(run('JSON.stringify(window.hackeniaGame.snapshot().traps)')).map(t=>t.o),[0],'le piège adverse reste caché');
// --- Soigneur : reprend la plus forte dalle ennemie voisine
fresh();run(`b[8][2]={o:1,el:'',v:5,lv:1,id:1};b[8][4]={o:1,el:'',v:3,lv:1,id:2};b[9][3]={o:0,el:'',v:2,lv:2,id:3};const nc={o:0,x:3,y:9,mi:${heal},lv:3};cr.push(nc);classEffect(nc,[[3,9,2]]);`);
assert.equal(run('b[8][3]'),null);
run(`b[8][3]={o:1,el:'',v:6,lv:1,id:9}`);run(`classEffect(cr[0],[[3,9,2]])`);assert.equal(run('b[8][3].o'),0,'la dalle voisine la plus forte est reprise');
// --- Éclaireur : main adverse visible 2 tours
fresh();run(`const sc={o:0,x:3,y:9,mi:${scout},lv:3};cr.push(sc);classEffect(sc,[[3,9,2]])`);assert.equal(run('scoutUntil[0]>turnNumber'),true);
assert.ok(html.includes('function renderScout()')&&html.includes("scoutUntil[0]>turnNumber"));
assert.ok(fs.readFileSync(path.join(__dirname,'../assets/clearing-v105.js'),'utf8').includes('function updateFxBoard()'));
console.log('v260 cards + classes OK');
