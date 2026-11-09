const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,'');
const els=new Map(),element=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},setPointerCapture(){},showModal(){this.open=true},close(){this.open=false},textContent:'',innerHTML:''});
const ctx=vm.createContext({window:{},document:{getElementById(id){if(!els.has(id))els.set(id,element());return els.get(id)}},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Date,Math,console});vm.runInContext(source,ctx);
// Main : 5 dés ; bourse : Abeille I ×2, Dragon de la Foudre... remplacé par Caleizis (niv. 6), Fourmi Caillou I.
vm.runInContext(`ai=true;cur=1;pl=[{h:[1,3,5,7,9],q:[0,2,0,30],s:0},{h:[4,6],q:[8,10,11],s:0}];openPouch()`,ctx);
const body=els.get('pouch-body').innerHTML,summary=els.get('pouch-summary').textContent;
assert.equal(els.get('pouch-panel').open,true);assert.equal(summary,'9 dés · 5 en main · 4 dans la bourse','Summary counts the human player’s dice, even during the AI turn');
const queue=body.slice(body.indexOf('Dans la bourse'));assert.match(queue,/Abeille Étincelle<\/b>.*×2/,'Duplicate dice are grouped');
assert.ok(queue.indexOf('Caleizis')<queue.indexOf('Abeille'),'Remaining dice are sorted by level, hiding the draw order');
assert.match(body,/Adversaire \(Orange\) : 2 en main · 3 dans sa bourse/);
vm.runInContext(`updatePouchCount()`,ctx);assert.equal(els.get('pouch-count').textContent,'4');
vm.runInContext(`ai=false;cur=1;drawPouch()`,ctx);assert.equal(els.get('pouch-title').textContent,'Bourse de Orange','Hot-seat shows the active player’s pouch');
console.log('PASS: in-game pouch lists hand and remaining dice, groups duplicates, hides draw order, shows opponent counts and follows the right player.');
