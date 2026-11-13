// v258 — dés à effet spécial (+1 PA selon la situation), divins à terrain doublé (+2), une dalle de moins, teaser double-élément.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const el=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},setPointerCapture(){}}),els=new Map();
const c=vm.createContext({window:{dispatchEvent(){}},Event,document:{getElementById(i){if(!els.has(i))els.set(i,el());return els.get(i)}},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Date,Math,console});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,''),c);const run=s=>vm.runInContext(s,c);
const M=c.window.hackeniaGame.monsters;
const fxDice=M.map((d,i)=>[i,d]).filter(([,d])=>d.fx),sacred=M.map((d,i)=>[i,d]).filter(([,d])=>d.terrain2);
assert.equal(fxDice.length,6);assert.equal(sacred.length,4);
for(const [i,d] of fxDice){assert.equal(d.rarity,3,d.cn+' est rare');assert.equal(d.c.length,4,d.cn+' : 4 dalles (une de moins)');assert.equal(d.c.reduce((a,t)=>a+t[2],0),18)}
for(const [i,d] of sacred){assert.equal(d.rarity??d.lv,6);assert.equal(d.c.length,5,d.cn+' : 5 dalles (une de moins)');assert.equal(d.c.reduce((a,t)=>a+t[2],0),26)}
const idx=n=>M.findIndex(d=>d.cn===n);
const setup=()=>run(`TER=TL.indexOf('terre');b=Array.from({length:H},()=>Array(W).fill(null));cr=[];lotus=[]`);
const place=(x,y,o,v,el,extra='')=>run(`b[${y}][${x}]={o:${o},el:'${el}',v:${v},lv:1,id:${100+x*10+y}${extra}}`);
const unit=(x,y,o,mi)=>run(`cr.push({o:${o},x:${x},y:${y},mi:${mi},id:${500+x*10+y},lv:1});cr[cr.length-1]`);
const atk=(x,y)=>run(`pwc(cr.find(z=>z.x===${x}&&z.y===${y}),${x},${y})`);
// Maraudeur : +1 sur une dalle adverse seulement
setup();let mi=idx('Grimgors le Maraudeur');place(3,5,0,4,'');unit(3,5,0,mi);assert.equal(atk(3,5),4,'sur sa dalle : pas de bonus');
place(3,5,1,4,'');assert.equal(atk(3,5),5,'sur dalle adverse : +1');
// Rempart
setup();mi=idx('Eberien le Rempart');place(3,5,0,4,'');unit(3,5,0,mi);assert.equal(atk(3,5),5);place(3,5,1,4,'');assert.equal(atk(3,5),4);
// Éclaireur : seul
setup();mi=idx('Jhimm l’Éclaireur');place(3,5,0,4,'');unit(3,5,0,mi);assert.equal(atk(3,5),5,'seul : +1');place(4,5,0,2,'');unit(4,5,0,0);assert.equal(atk(3,5),4,'allié adjacent : pas de bonus');
// Duelliste : ennemi adjacent
setup();mi=idx('Bolduc le Duelliste');place(3,5,0,4,'');unit(3,5,0,mi);assert.equal(atk(3,5),4);place(4,5,1,2,'');unit(4,5,1,0);assert.equal(atk(3,5),5,'ennemi adjacent : +1');
// Meute : +1 par allié, 2 au plus
setup();mi=idx('Kala, cheffe de meute');place(3,5,0,4,'');unit(3,5,0,mi);for(const [x,y] of[[4,5],[2,5],[3,4]]){place(x,y,0,2,'');unit(x,y,0,0)}assert.equal(atk(3,5),6,'2 au plus');
// Vaillance : dalle de 3 ou moins
setup();mi=idx('La Gardienne vaillante');place(3,5,0,3,'');unit(3,5,0,mi);assert.equal(atk(3,5),4);place(3,5,0,4,'');assert.equal(atk(3,5),4,'dalle de 4 : pas de bonus');
// Terrain sacré : +2 au lieu de +1 (la dalle porte t2)
setup();place(3,5,0,4,'terre',',t2:1');unit(3,5,0,0);assert.equal(run('tileBonuses(3,5).terrainBonus'),2,'terrain doublé');place(4,5,0,4,'terre');assert.equal(run('tileBonuses(4,5).terrainBonus'),1,'terrain normal');
run(`die=${idx('Hydrelithe, séisme sacré')}`);assert.ok(run('previewBonus(3,5)')>=2,'aperçu de pose : +2');
// Teaser
assert.ok(fs.readFileSync(path.join(__dirname,'../assets/portal-v159.js'),'utf8').includes('Bientôt : les dés double-élément'));
console.log('v258 effects OK');
