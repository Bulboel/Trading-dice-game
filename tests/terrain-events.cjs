// v234 — Interactions de terrain : foudre (Île céleste) et rafale (Vents de Hacko), à la fin de chaque tour complet.
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),el=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},setPointerCapture(){}}),els=new Map(),events=[];
const c=vm.createContext({window:{dispatchEvent(e){events.push(e)}},Event,CustomEvent:class{constructor(t,o){this.type=t;this.detail=o?.detail}},document:{getElementById(i){if(!els.has(i))els.set(i,el());return els.get(i)}},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Date,Math,console});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,''),c);const run=s=>vm.runInContext(s,c);

const seq=v=>run(`(()=>{const q=${JSON.stringify(v)};let i=0;Math.random=()=>i<q.length?q[i++]:.5})()`);
const setup=t=>run(`TER=TL.indexOf('${t}');over=0;rewardMode='quick';b=Array.from({length:H},()=>Array(W).fill(null));cr=[];for(let x=0;x<W;x++)b[6][x]={o:0,v:3,el:'feu',lv:1,id:500+x,mn:'t'};cr.push({o:0,x:6,y:6,id:1,mi:0,lv:1,mn:'A'},{o:1,x:2,y:6,id:2,mi:2,lv:1,mn:'B'});kills=[0,0];`);
// Foudre : deux cases différentes, tout y est détruit, aucune victoire comptée.
setup('foudre');seq([6/8+.01,6/12+.01,6/8+.01,6/12+.01,3/8+.01,6/12+.01]);let note=run('terrainEvent()');
assert.match(note,/foudre frappe G7 et D7/);assert.equal(run('cr.length'),1,'Creature on a struck cell is destroyed');assert.equal(run('b[6][6]'),null);assert.equal(run('b[6][3]'),null);assert.equal(run('kills.join()'),'0,0','No kill credited');
assert.ok(events.some(e=>e.type==='hackenia:lightning'&&e.detail.cells.length===2));
// Vent : une fois sur trois ; pousse de 3 cases à gauche, arrêté par une créature, le bord ou une case sans dalle.
setup('vent');seq([.9]);assert.equal(run('terrainEvent()'),'','Most rounds have no gust');assert.equal(run('cr[0].x'),6);
setup('vent');seq([.1]);note=run('terrainEvent()');assert.match(note,/rafale/);assert.equal(run('cr.find(c=>c.id===1).x'),3,'Pushed 3 cells left');assert.equal(run('cr.find(c=>c.id===2).x'),0,'Stopped by the board edge');
setup('vent');run('b[6][4]=null');seq([.1]);run('terrainEvent()');assert.equal(run('cr.find(c=>c.id===1).x'),5,'Stopped before a cell without a tile');
setup('vent');run('cr.find(c=>c.id===2).x=5;b[6][4]=null');seq([.1]);run('terrainEvent()');assert.equal(run('cr.find(c=>c.id===2).x'),5);assert.equal(run('cr.find(c=>c.id===1).x'),6,'Blocked by a creature');
// Lac rose : un nénuphar sacré sur une dalle, +1 à la créature de sa case jusqu'au tour suivant.
setup('eau');const base=run('pwc(cr[0])');seq([0]);run('b[6].forEach((t,x)=>{if(x!==6)b[6][x]=null})');note=run('terrainEvent()');assert.match(note,/nénuphar sacré s’ouvre en G7 : Maebril gagne \+1/);assert.equal(run('pwc(cr[0])'),base+1,'+1 on the lotus');
assert.equal(run('pwc(cr[1])'),run('pwc(cr[1],cr[1].x,cr[1].y)'));setup('terre');run("TER=TL.indexOf('feu')");run('terrainEvent()');assert.equal(run('lotus'),null,'Lotus fades at the next round');
// Pas d'événement dans le tutoriel ni sur les autres terrains ; uniquement quand le premier joueur reprend la main.
setup('foudre');run("rewardMode='tutorial'");assert.equal(run('terrainEvent()'),'');setup('terre');assert.equal(run('terrainEvent()'),'');
assert.ok(html.includes("const terrainNote=cur===0?terrainEvent():''"),'Triggered once per full round');
console.log('PASS: lightning strikes 2 distinct cells and destroys tile + creature without a kill; a gust (1 in 3 rounds) pushes creatures up to 3 cells left, stopped by edge, missing tile or creature; sacred lotus gives +1 for one round on the pink lake; none in tutorial or other terrains.');
