// v242 — Recouvrement par niveau : un dé d'invocation de niveau supérieur écrase la créature adverse qu'il recouvre.
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),el=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},setPointerCapture(){}}),els=new Map();
const c=vm.createContext({window:{dispatchEvent(){}},Event,CustomEvent:class{constructor(t,o){this.type=t;this.detail=o?.detail}},document:{getElementById(i){if(!els.has(i))els.set(i,el());return els.get(i)}},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Date,Math,console});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,''),c);const run=s=>vm.runInContext(s,c);
const lvDie=(lv,pure=false)=>run(`M.findIndex(d=>d.lv===${lv}&&!!d.pure===${pure}&&!d.multi)`);
const d1=lvDie(1),d2=lvDie(2),d3=lvDie(3),pure3=lvDie(3,true);assert.ok(d1>=0&&d2>=0&&d3>=0&&pure3>=0);
const setup=()=>run(`TER=TL.indexOf('terre');over=0;cur=0;b=Array.from({length:H},()=>Array(W).fill(null));cr=[];kills=[0,0];`);
const enemy=(x,y,lv)=>run(`b[${y}][${x}]={o:1,v:3,el:'feu',lv:${lv},id:77,mn:'E'};cr.push({o:1,x:${x},y:${y},id:77,mi:${lv===1?d1:lv===2?d2:d3},lv:${lv},mn:'E'});`);
const cellsAt=(x,y)=>JSON.stringify([[x,y,3],[x+1,y,4]]);const HR=run('cur=0;homeRow()');
// Niveau 3 sur une créature adverse niveau 2 : la case est posable et la créature est écrasée.
setup();enemy(3,HR,2);run(`die=${d3}`);let sp=run(`split(${cellsAt(3,HR)},M[die].lv)`);assert.equal(sp.put.length,2);assert.equal(sp.crushed.length,1,'Higher level crushes the enemy creature');assert.equal(run(`ok(${cellsAt(3,HR)})`),1,'Anchor on a weaker enemy creature is allowed');
// Niveau 2 sur une créature adverse niveau 3 (ou égal) : la dalle de la créature reste.
setup();enemy(3,HR,3);run(`die=${d2}`);sp=run(`split(${cellsAt(2,HR)},M[die].lv)`);assert.equal(sp.crushed.length,0);assert.equal(sp.lost.length,1,'Lower level: the creature keeps its tile');assert.equal(sp.put.length,1,'…but the other faces still replace enemy tiles');
setup();enemy(3,HR,2);run(`die=${d2}`);sp=run(`split(${cellsAt(2,HR)},M[die].lv)`);assert.equal(sp.crushed.length,0,'Equal level never crushes');assert.equal(sp.lost.length,1);
assert.equal(run(`ok(${cellsAt(3,HR)})`),0,'Cannot anchor on an equal-level creature');assert.match(run(`why(${cellsAt(3,HR)},M[die].lv)`),/niveau égal ou supérieur/);
// Ses propres créatures et les dés élémentaires n'écrasent jamais.
setup();run(`b[${HR}][3]={o:0,v:1,el:'terre',lv:1,id:5};cr.push({o:0,x:3,y:${HR},id:5,mi:${d1},lv:1,mn:'A'});die=${d3}`);sp=run(`split(${cellsAt(3,HR)},M[die].lv)`);assert.equal(sp.crushed.length,0,'Own creature is never crushed');
setup();enemy(3,HR,1);run(`die=${pure3}`);sp=run(`split(${cellsAt(2,HR)},M[die].lv)`);assert.equal(sp.crushed.length,0,'Elemental dice (no roll) never crush');
// Le lancer réussi retire la créature écrasée sans la compter comme victoire en duel ; l'IA simule la même règle.
assert.ok(html.includes("crushed=sp.crushed.filter(c=>cr.includes(c));for(const c of crushed){cr.splice(cr.indexOf(c),1);recordEvent('Écrasement'"),'Crushed creatures removed on a successful roll');
assert.ok(!/crushed[^;]*kills\[/.test(html),'Crushing is not a duel kill');
assert.ok(html.includes('L=cr.filter(u=>!sp.crushed.includes(u))')&&html.includes('ok(all,M[m].lv,!M[m].pure)'),'AI evaluates crushes');
console.log('PASS: level crush — a higher-level summoning die crushes the enemy creature it covers (tile changes side); equal or lower level leaves creature + tile; own creatures and elemental dice never crush; AI uses the same rule; not a duel kill.');
