// v272 — L'IA suit les mêmes limites de deck que le joueur (1 divin, 2 légendaires, 2 Énergie, 4 rares), à toutes les difficultés,
// contre les rivaux de famille comme contre les adversaires de l'Histoire, et ne joue jamais de dé Crépitant.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const el=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},setPointerCapture(){}}),els=new Map();
const c=vm.createContext({window:{dispatchEvent(){}},Event,document:{getElementById(i){if(!els.has(i))els.set(i,el());return els.get(i)}},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Date,Math,console});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,''),c);const run=s=>vm.runInContext(s,c);
// v293 — Dans une zone de camp, seules les dalles de son propre camp sont praticables ; entre les camps, toutes les dalles le sont.
run(`reset=function(){b=Array.from({length:H},()=>Array(W).fill(null));cr=[];turnNumber=5}`);
run(`reset();for(let y=7;y<=11;y++)b[y][3]={o:0,el:'terre',v:3,lv:1,id:1,mn:'t'};for(let y=0;y<=6;y++)b[y][3]={o:1,el:'terre',v:3,lv:1,id:2,mn:'t'};cr.push({o:0,x:3,y:7,mi:0,lv:1,id:50,born:1})`);
let p=run(`Object.keys(bfs(cr[0]))`);
assert.ok(p.includes('3,6'),'dalle adverse entre les camps : praticable');
assert.ok(!p.includes('3,0'),'la dalle adverse de la zone ennemie ne sert pas');
run(`b[0][3]={o:0,el:'terre',v:3,lv:1,id:3,mn:'t'}`);
p=run(`Object.keys(bfs(cr[0]))`);assert.ok(p.includes('3,0'),'dalle à soi dans la zone ennemie : praticable');
console.log('PASS: zones de camp — seules les dalles de son propre camp y sont praticables.');
