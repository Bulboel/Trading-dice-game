// v207 — Règle des dalles : commun 3, peu commun 4, rare 5, légendaire 6 (total 28 ± 1 par dalle autour de 3,3,5,5,6,6), divin 6 (plus fort).
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,'');
const els=new Map(),el=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},setPointerCapture(){}});
const c=vm.createContext({window:{dispatchEvent(){}},Event,document:{getElementById(i){if(!els.has(i))els.set(i,el());return els.get(i)}},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Date,Math,console});vm.runInContext(src,c);
const g=c.window.hackeniaGame,want={1:3,2:4,3:5,5:6,6:6},sum=d=>d.c.reduce((a,t)=>a+t[2],0);
const canon=cells=>{const out=[];let p=cells.map(([x,y])=>[x,y]);for(const f of[1,-1]){let q=p.map(([x,y])=>[x*f,y]);for(let r=0;r<4;r++){q=q.map(([x,y])=>[-y,x]);const mx=Math.min(...q.map(a=>a[0])),my=Math.min(...q.map(a=>a[1]));out.push(q.map(([x,y])=>(x-mx)+','+(y-my)).sort().join(' '))}}return out.sort()[0]};
const legends=[],divins=[];
g.monsters.forEach((d,i)=>{if(d.pure)return;const r=g.rarity(d);assert.equal(d.c.length,want[r],`${d.cn} (${i}) : ${want[r]} dalles attendues pour sa rareté`);
 const cells=new Set(d.c.map(([x,y])=>x+','+y));assert.equal(cells.size,d.c.length,d.cn+' : pas de dalles superposées');
 const linked=new Set([d.c[0][0]+','+d.c[0][1]]),todo=[d.c[0]];while(todo.length){const [x,y]=todo.pop();for(const [dx,dy] of[[1,0],[-1,0],[0,1],[0,-1]]){const k=(x+dx)+','+(y+dy);if(cells.has(k)&&!linked.has(k)){linked.add(k);todo.push([x+dx,y+dy])}}}assert.equal(linked.size,cells.size,d.cn+' : dalles reliées');
 if(r===5){legends.push(d);assert.equal(sum(d),28,d.cn+' : total 28');const v=d.c.map(t=>t[2]).sort((a,b)=>a-b);[3,3,5,5,6,6].forEach((b,k)=>assert.ok(Math.abs(v[k]-b)<=1,d.cn+' : variations d’un point au plus ('+v+')'))}
 if(r===6){divins.push(d);assert.ok(sum(d)>28,d.cn+' : plus fort qu’un légendaire')}});
const forms=new Map();for(const d of legends.filter(d=>d.nd===2)){const k=canon(d.c);assert.ok(!forms.has(k),d.cn+' partage sa forme avec '+forms.get(k));forms.set(k,d.cn)}
console.log(`PASS: ${g.monsters.filter(d=>!d.pure).length} dés à créature suivent la règle des dalles (3/4/5/6/6), ${legends.length} légendaires à 28, ${divins.length} divins à ${sum(divins[0])}, formes légendaires à 2 dés toutes différentes.`);
