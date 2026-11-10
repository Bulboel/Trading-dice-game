// v214 — Personnages multi-élément (Hydrelithe, Yoris) : bonus de terrain toujours actif, jamais de bonus de voisin.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json')));
const el=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},setPointerCapture(){}}),els=new Map();
const c=vm.createContext({window:{dispatchEvent(){}},Event,document:{getElementById(i){if(!els.has(i))els.set(i,el());return els.get(i)}},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Date,Math,console});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,''),c);
const run=s=>vm.runInContext(s,c),g=c.window.hackeniaGame,defs=g.monsters;
const [hy,my,yo]=[67,68,69].map(i=>defs[i]);
assert.deepEqual([hy.cn,my.cn,yo.cn],['Hydrelithe','Myconide','Yoris']);
assert.deepEqual([g.rarity(hy),g.rarity(my),g.rarity(yo)],[1,2,2]);
assert.ok(hy.multi&&yo.multi&&!my.multi);assert.equal(my.el,'terre');
assert.deepEqual(hy.c.map(t=>t[2]).sort(),[1,1,2],'Hydrelithe : dalles 1-1-2');
assert.ok(yo.c.reduce((a,t)=>a+t[2],0)<my.c.reduce((a,t)=>a+t[2],0),'Yoris est un cran plus faible qu’un peu commun mono-élément');
for(const k of['hydrelithe','myconide','yoris']){const i=manifest.creatures[k];assert.ok(i.glb.startsWith('models-web/'));assert.deepEqual(Object.keys(i.animations).sort(),['spell','victory','walk']);
 for(const f of Object.values(i.animations))assert.ok(fs.existsSync(path.join(root,'assets',f)));for(const s of[128,512])assert.ok(fs.existsSync(path.join(root,`assets/characters/${k}-${s}.webp`)))}
// Règle sur le plateau : une case multi-élément a +1 de terrain quel que soit le terrain, et jamais +1 de voisin.
run(`b=Array.from({length:H},()=>Array(7).fill(null));b[5][3]={o:0,el:'',v:2,lv:1,id:1,mu:1};b[5][4]={o:1,el:'foudre',v:2,lv:1,id:2};b[5][2]={o:0,el:'eau',v:2,lv:1,id:3}`);
for(let t=0;t<6;t++){run('TER='+t);const r=JSON.parse(run('JSON.stringify(tileBonuses(3,5))'));assert.deepEqual(r,{terrainBonus:1,neighborBonus:0},'terrain '+t)}
// Une case multi-élément ne donne pas non plus de bonus de voisin aux autres (elle n'a pas d'élément).
run(`b[5][2]={o:0,el:'vent',v:2,lv:1,id:3}`);assert.equal(JSON.parse(run('JSON.stringify(tileBonuses(2,5))')).neighborBonus,0);
const portal=fs.readFileSync(path.join(root,'assets/portal-v159.js'),'utf8');assert.ok(portal.includes("'Multi-élément'"),'Shown as Multi-élément in the collection');
console.log('PASS: Hydrelithe (commun 1-1-2), Myconide (peu commun Terre), Yoris (peu commun, plus faible) ; multi-élément = +1 de terrain partout, aucun bonus de voisin, modèles allégés et clips présents.');
