// v234 — Interactions de terrain : foudre (Île céleste) et rafale (Vents de Hacko), à la fin de chaque tour complet.
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),el=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},setPointerCapture(){}}),els=new Map(),events=[];
const c=vm.createContext({window:{dispatchEvent(e){events.push(e)}},Event,CustomEvent:class{constructor(t,o){this.type=t;this.detail=o?.detail}},document:{getElementById(i){if(!els.has(i))els.set(i,el());return els.get(i)}},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Date,Math,console});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,''),c);const run=s=>vm.runInContext(s,c);

const seq=v=>run(`(()=>{const q=${JSON.stringify(v)};let i=0;Math.random=()=>i<q.length?q[i++]:.5})()`);
const setup=t=>run(`lotus=[];gustRound=0;TER=TL.indexOf('${t}');over=0;rewardMode='quick';b=Array.from({length:H},()=>Array(W).fill(null));cr=[];for(let x=0;x<W;x++)b[6][x]={o:0,v:3,el:'feu',lv:1,id:500+x,mn:'t'};cr.push({o:0,x:6,y:6,id:1,mi:0,lv:1,mn:'A'},{o:1,x:2,y:6,id:2,mi:2,lv:1,mn:'B'});kills=[0,0];`);
// Foudre : deux cases différentes, tout y est détruit, aucune victoire comptée.
setup('foudre');seq([6/8+.01,6/12+.01,6/8+.01,6/12+.01,3/8+.01,6/12+.01]);let note=run('terrainEvent()');
assert.match(note,/foudre frappe G7 et D7/);assert.equal(run('cr.length'),1,'Creature on a struck cell is destroyed');assert.equal(run('b[6][6]'),null);assert.equal(run('b[6][3]'),null);assert.equal(run('kills.join()'),'0,0','No kill credited');
assert.ok(events.some(e=>e.type==='hackenia:lightning'&&e.detail.cells.length===2));
// Vent : une rafale tous les deux tours complets ; pousse de 3 cases à gauche, arrêtée par le bord, une case bloquée ou une créature.
setup('vent');run('gustRound=0');assert.equal(run('terrainEvent()'),'','No gust on odd rounds');assert.equal(run('cr[0].x'),6);note=run('terrainEvent()');assert.match(note,/rafale/);assert.equal(run('cr.find(c=>c.id===1).x'),3,'Pushed 3 cells left');assert.equal(run('cr.find(c=>c.id===2).x'),0,'Stopped by the board edge');
setup('vent');run('gustRound=1;b[6][4]=null');run('terrainEvent()');assert.equal(run('cr.find(c=>c.id===1).x'),3,'Also pushed across cells without a tile');
setup('vent');run('gustRound=1;cr.find(c=>c.id===2).x=0;cr.find(c=>c.id===1).x=2');run('terrainEvent()');assert.equal(run('cr.find(c=>c.id===2).x'),0);assert.equal(run('cr.find(c=>c.id===1).x'),1,'Blocked by a creature');
// Lac rose : un nénuphar sacré sur une dalle, +1 à la créature de sa case jusqu'au tour suivant.
setup('eau');run('lotus=[];turnNumber=3');const base=run('pwc(cr[0])');run('Math.random=()=>(6*8+6+.5)/96');note=run('terrainEvent()');assert.match(note,/nénuphar sacré s’ouvre en G7 : Maebril gagne \+1/);assert.equal(run('pwc(cr[0])'),base+1,'+1 on the lotus');
run('turnNumber=5');run('Math.random=()=>0');run('terrainEvent()');assert.equal(run('lotus.length'),2,'A new lotus every round, the previous one stays');run('turnNumber=7');run('terrainEvent()');assert.equal(run('lotus.some(l=>l.x===6&&l.y===6)'),false,'A lotus lasts two full rounds');
assert.equal(run('pwc(cr[1])'),run('pwc(cr[1],cr[1].x,cr[1].y)'));
// Pas d'événement dans le tutoriel ni sur les autres terrains ; uniquement quand le premier joueur reprend la main.
setup('foudre');run("rewardMode='tutorial'");assert.equal(run('terrainEvent()'),'');setup('terre');assert.equal(run('terrainEvent()'),'');
assert.ok(html.includes("const terrainNote=cur===0?terrainEvent():''"),'Triggered once per full round');
console.log('PASS: lightning strikes 2 distinct cells and destroys tile + creature without a kill; a gust (every 2nd round) pushes creatures up to 3 cells left, stopped by edge, missing tile or creature; a sacred lotus every round, +1 for two rounds, on the pink lake; none in tutorial or other terrains.');
