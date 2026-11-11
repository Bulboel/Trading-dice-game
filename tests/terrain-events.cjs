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
// Vent (v244) : une petite tornade emporte une créature ET sa dalle, jamais en zone de camp, jamais à moins de 4 rangées
// de la zone à envahir, jamais au contact d'une autre créature.
for(let seed=1;seed<=60;seed++){setup('vent');run(`(()=>{let s=${seed};Math.random=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296}})()`);
 const before=JSON.parse(run('JSON.stringify(cr.map(c=>({id:c.id,o:c.o,x:c.x,y:c.y,tile:b[c.y][c.x]})))'));note=run('terrainEvent()');assert.match(note,/tornade/);
 const after=JSON.parse(run('JSON.stringify(cr.map(c=>({id:c.id,o:c.o,x:c.x,y:c.y,tile:b[c.y][c.x]})))'));
 for(const a of after){const o=before.find(q=>q.id===a.id);if(o.x===a.x&&o.y===a.y)continue;
  assert.deepEqual(a.tile,o.tile,'The tile travels with the creature');assert.equal(run(`b[${o.y}][${o.x}]`),null,'Origin cell is emptied');
  assert.ok(!run(`inZone(0,${a.y})||inZone(1,${a.y})`),'Never dropped in a camp zone');
  const goal=a.o===0?Math.min(...[...Array(12).keys()].filter(r=>run(`inZone(1,${r})`))):Math.max(...[...Array(12).keys()].filter(r=>run(`inZone(0,${r})`)));
  assert.ok(Math.abs(goal-a.y)>=4,'Never dropped near the zone to invade (seed '+seed+')');
  assert.ok(Math.abs(goal-a.y)>=Math.abs(goal-o.y)-1,'Never carried more than one row toward its goal');
  assert.ok(!after.some(q=>q.id!==a.id&&Math.abs(q.x-a.x)+Math.abs(q.y-a.y)===1),'Never dropped next to another creature');}
 assert.equal(run('cr.length'),2,'A tornado never destroys a creature');assert.equal(run('kills.join()'),'0,0')}
assert.ok(events.some(e=>e.type==='hackenia:tornado'&&e.detail.from),'3D tornado event dispatched');
// Lac rose : un nénuphar sacré sur une dalle, +1 à la créature de sa case jusqu'au tour suivant.
setup('eau');run('lotus=[];turnNumber=3');const base=run('pwc(cr[0])');run('Math.random=()=>(6*8+6+.5)/96');note=run('terrainEvent()');assert.match(note,/nénuphar sacré s’ouvre en G7 : Maebril gagne \+1/);assert.equal(run('pwc(cr[0])'),base+1,'+1 on the lotus');
run('turnNumber=5');run('Math.random=()=>0');run('terrainEvent()');assert.equal(run('lotus.length'),2,'A new lotus every round, the previous one stays');run('turnNumber=7');run('terrainEvent()');assert.equal(run('lotus.some(l=>l.x===6&&l.y===6)'),false,'A lotus lasts two full rounds');
assert.equal(run('pwc(cr[1])'),run('pwc(cr[1],cr[1].x,cr[1].y)'));
// Pas d'événement dans le tutoriel ni sur les autres terrains ; uniquement quand le premier joueur reprend la main.
setup('foudre');run("rewardMode='tutorial'");assert.equal(run('terrainEvent()'),'');setup('terre');assert.equal(run('terrainEvent()'),'');
assert.ok(html.includes("const terrainNote=cur===0?terrainEvent():''"),'Triggered once per full round');
console.log('PASS: lightning strikes 2 distinct cells and destroys tile + creature without a kill; a tornado carries a creature with its tile, never into a camp zone, never within 4 rows of its goal, never next to another creature; a sacred lotus every round, +1 for two rounds, on the pink lake; none in tutorial or other terrains.');
