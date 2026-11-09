const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,'');
// L'IA joue le camp 1 : elle avance vers les y croissants et marque en ligne H-1 ; son propre camp est la ligne 0.
function setup(){const els=new Map(),element=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},setPointerCapture(){}});const ctx=vm.createContext({window:{},document:{getElementById(id){if(!els.has(id))els.set(id,element());return els.get(id)}},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Date,Math,console,Event});vm.runInContext(source,ctx);
 vm.runInContext(`render=()=>{};b=Array.from({length:H},()=>Array(W).fill(null));TER=0;ai=false;over=0;mode='i';moved=0;movePlan=null;sel=null;cur=1;pl=[{s:0,h:[],q:[]},{s:0,h:[],q:[]}];bonus=[0,0];kills=[0,0];cr=[];
 tile=(x,y,o,v)=>{b[y][x]={o,v,el:'',id:900+o,lv:1}};unit=(id,o,x,y)=>{cr.push({id,o,mi:0,x,y,lv:1,em:o?'ia':'humain'})};
 play=()=>{const m=aiChooseMove(cur);if(m)mv(m[0],m[1],m[2]);return m};`,ctx);return code=>vm.runInContext(code,ctx)}
for(let trial=0;trial<5;trial++){
 {// Ne se jette pas au contact d'un ennemi plus fort.
  const run=setup();run(`for(let y=2;y<=6;y++)tile(3,y,1,2);tile(4,5,0,6);unit(1,1,3,2);unit(2,0,4,5);`);
  const m=JSON.parse(run('JSON.stringify((m=>m&&[m[1],m[2]])(aiChooseMove(1)))'));
  assert.ok(!m||!(m[0]===3&&m[1]===5),'AI must not walk into contact with a stronger enemy');
  run('play()');assert.equal(run('kills[0]'),0,'AI loses no creature');
 }
 {// Profite d'un combat gagnant.
  const run=setup();run(`for(let y=3;y<=5;y++)tile(3,y,1,5);tile(3,5,0,1);unit(1,1,3,3);unit(2,0,3,5);`);
  run('play()');assert.equal(run('kills[1]'),1,'AI takes a winning combat');
 }
 {// Défend son camp : élimine la créature adverse qui pourrait marquer au prochain tour.
  const run=setup();run(`for(let y=0;y<=2;y++)tile(3,y,0,3);tile(4,2,1,5);tile(5,2,1,5);tile(5,3,1,5);tile(5,4,1,5);unit(1,1,5,2);unit(2,0,3,2);`);
  run('play()');assert.equal(run('kills[1]'),1,'AI removes the creature threatening its camp');
 }
 {// N'attaque pas directement une créature plus forte.
  const run=setup();run(`for(let y=1;y<=4;y++)tile(2,y,1,2);tile(2,4,0,5);unit(1,1,2,1);unit(2,0,2,4);`);
  run('play()');assert.equal(run('kills[0]'),0,'AI never attacks into a losing duel');
 }
}
{// La pose de dé choisit une rotation et un emplacement légal, et reste rapide.
 const run=setup();run(`pl[1].h=[24,30,0,12,36];pl[0].h=[1];for(let x=0;x<W;x++)tile(x,8,0,3);unit(2,0,3,8);`);
 const t=Date.now(),choice=JSON.parse(run('JSON.stringify(aiChoosePlacement(1))'));assert.ok(Date.now()-t<3000,'Placement search stays fast');
 assert.ok(choice&&choice.length===4,'AI returns hand index, anchor and rotation');
 const legal=run(`(()=>{const[i,x,y,r]=${JSON.stringify(choice)},m=pl[1].h[i];return !!ok(cellsOf(m,r,{x,y}),M[m].lv)})()`);assert.equal(legal,true,'Chosen placement is legal');
}
console.log('PASS: no suicidal contact or losing attack, takes winning combats, defends its camp, legal and fast rotated placements.');
