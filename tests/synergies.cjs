// v237 — Synergies : personnages liés ensemble sur le plateau (même camp) = +1 d'attaque chacun.
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),el=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},setPointerCapture(){}}),els=new Map();
const c=vm.createContext({window:{dispatchEvent(){}},Event,CustomEvent:class{},document:{getElementById(i){if(!els.has(i))els.set(i,el());return els.get(i)}},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Date,Math,console});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,''),c);const run=s=>vm.runInContext(s,c),g=c.window.hackeniaGame,defs=g.monsters;
const id=n=>defs.findIndex(d=>d.cn===n);for(const n of['Maebril','Bosco','Kayla légendaire','Hilam','Zackarie','Bolduc','Sameron','Soryan','Eberien','Messire Balai','Kala','Velmarys','Yoris','Gliska','Max','Max & Alastor','Hydrelithe','Hydrelithe de foudre','Bosco de vent'])assert.ok(id(n)>=0,n);
run(`TER=TL.indexOf('terre');lotus=[];b=Array.from({length:H},()=>Array(W).fill(null));for(let x=0;x<W;x++)for(let y=0;y<H;y++)b[y][x]={o:0,v:2,el:'feu',lv:1,id:1,mn:'t'};`);
const pair=(a,b2,o2=0)=>{run(`cr=[{o:0,x:1,y:1,id:1,mi:${id(a)},lv:1},{o:${o2},x:5,y:5,id:2,mi:${id(b2)},lv:1}]`);return [run('synergyBonus(cr[0])'),run('synergyBonus(cr[1])')]};
for(const [a,b2] of[['Maebril','Bosco'],['Kayla légendaire','Hilam'],['Zackarie','Bolduc'],['Sameron','Soryan'],['Eberien','Messire Balai'],['Kala','Velmarys'],['Yoris','Gliska'],['Max','Messire Balai'],['Max & Alastor','Messire Balai'],['Hydrelithe','Hydrelithe de foudre'],['Maebril','Bosco de vent']])assert.deepEqual(pair(a,b2),[1,1],a+' + '+b2);
assert.deepEqual(pair('Maebril','Hilam'),[0,0],'No synergy without a link');assert.deepEqual(pair('Maebril','Bosco',1),[0,0],'Opposing camps do not combine');assert.deepEqual(pair('Hydrelithe','Hydrelithe'),[0,0],'Two copies of the same Hydrelithe do not count');
run(`cr=[{o:0,x:1,y:1,id:1,mi:${id('Maebril')},lv:1},{o:0,x:5,y:5,id:2,mi:${id('Bosco')},lv:1}]`);assert.equal(run('pwc(cr[0])'),run('pw(1,1)')+1,'Applied to attack wherever they stand');
assert.match(g.synergy(id('Messire Balai')),/Eberien ou Max & Alastor/);assert.equal(g.synergy(id('Orven')),'');
console.log('PASS: 9 synergy links (all versions), +1 attack on both, same camp only, distinct Hydrelithes, shown on sheets.');
