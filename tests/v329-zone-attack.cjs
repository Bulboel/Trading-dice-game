// v329 — Vaincre une créature postée dans le camp à envahir ne fait pas entrer l'attaquant dans ce camp (ni passage, ni attaque à 0).
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,'');
function setup(){const els=new Map(),element=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},setPointerCapture(){}});const ctx=vm.createContext({window:{dispatchEvent(){}},document:{getElementById(id){if(!els.has(id))els.set(id,element());return els.get(id)}},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Date,Math,console,Event});vm.runInContext(source,ctx);
 vm.runInContext(`render=()=>{};b=Array.from({length:H},()=>Array(W).fill(null));TER=0;ai=false;over=0;mode='i';moved=0;movePlan=null;sel=null;cur=0;pl=[{s:0,h:[],q:[]},{s:0,h:[],q:[]}];bonus=[0,0];kills=[0,0];cr=[];
 tile=(x,y,o,v)=>{b[y][x]={o,v,el:'',id:900+o,lv:1}};unit=(id,o,x,y)=>{cr.push({id,o,mi:0,x,y,lv:1,em:o?'ia':'humain'})};`,ctx);return code=>vm.runInContext(code,ctx)}
{// Le camp 0 envahit la rangée 0 : la créature adverse y est postée.
 const run=setup();run(`for(let y=1;y<=3;y++)tile(3,y,0,6);tile(3,0,1,1);unit(1,0,3,3);unit(2,1,3,0);mv(cr[0],3,0)`);
 assert.equal(run('kills[0]'),1,'the defender is beaten');assert.equal(run('cr.length'),1);
 assert.equal(run('cr[0].y'),1,'the attacker stays on its attack square');assert.equal(run('pl[0].s'),0,'no passage counted')}
{// Hors du camp, le vainqueur prend toujours la case du vaincu.
 const run=setup();run(`for(let y=3;y<=6;y++)tile(3,y,0,6);tile(3,2,1,1);unit(1,0,3,6);unit(2,1,3,2);mv(cr[0],3,2)`);
 assert.equal(run('cr[0].y'),2,'the winner takes the square')}
{// L'IA suit la même règle dans ses simulations.
 const run=setup();run(`for(let y=8;y<=10;y++)tile(3,y,1,6);tile(3,11,0,1);unit(1,1,3,8);unit(2,0,3,11);`);
 const r=JSON.parse(run('JSON.stringify((r=>({y:r.L.find(u=>u.o===1).y,s:r.s}))(aiSimMove(cr,0,3,11)))'));assert.equal(r.y,10);assert.deepEqual(r.s,[0,0])}
console.log('PASS: beating a creature inside the camp to invade keeps the attacker at the edge (no free passage), also in AI simulations.');
