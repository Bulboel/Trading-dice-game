const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,'');
function setup(){const els=new Map(),element=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},setPointerCapture(){}});const ctx=vm.createContext({window:{},document:{getElementById(id){if(!els.has(id))els.set(id,element());return els.get(id)}},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Date,Math,console});vm.runInContext(source,ctx);vm.runInContext(`render=()=>{};b=Array.from({length:H},()=>Array(W).fill(null));cur=0;TER=0;ai=false;over=0;mode='i';moved=0;movePlan=null;sel=null;pl=[{s:0},{s:0}];bonus=[0,0];kills=[0,0];cr=[{id:1,o:0,mi:0,x:0,y:4,lv:1,em:'a'}];for(let x=0;x<W;x++)b[4][x]={o:0,id:1,v:4,el:'vent',lv:1};`,ctx);return code=>vm.runInContext(code,ctx)}
{
const run=setup();assert.equal(run("bfs(cr[0])['7,4']!==undefined"),true,'Seven-square destination must be reachable');run('tap(0,4);tap(7,4)');assert.equal(run('movePlan.x'),7);assert.equal(run('cr[0].x'),0);run('confirmMove()');assert.equal(run('cr[0].x'),7);assert.equal(run('cr[0].walk.points.length'),8,'Walk must follow entire path');
}
{
const run=setup();run("b[4][3]=null");assert.equal(run("bfs(cr[0])['7,4']"),undefined,'Cannot jump an undeployed gap');run('mv(cr[0],7,4)');assert.equal(run('moved'),0);assert.equal(run('cr[0].x'),0);
}
{
const run=setup();run("cr.push({id:2,o:0,mi:1,x:3,y:4,lv:1,em:'b'})");assert.equal(run("bfs(cr[0])['7,4']!==undefined"),true,'Ally must not block transit');run('mv(cr[0],3,4)');assert.equal(run('moved'),0,'Cannot finish on allied creature');const tiles=run('JSON.stringify(b)');run('mv(cr[0],2,4)');assert.equal(run('cr.length'),2,'Adjacent allies must stay separate');assert.equal(run('JSON.stringify(b)'),tiles,'No fusion tiles created');assert.equal(run("gameEvents.some(e=>e.type==='Fusion')"),false);assert.equal(run('typeof fuse'),'undefined','Fusion engine must be removed');
}
{
const run=setup();run("cr.push({id:2,o:1,mi:1,x:4,y:4,lv:1,em:'b'});b[4][4].v=1");assert.equal(run("bfs(cr[0])['4,4']!==undefined"),true,'Enemy is an attack destination');assert.equal(run("bfs(cr[0])['5,4']"),undefined,'Enemy blocks every cell behind it');run('mv(cr[0],7,4)');assert.equal(run('moved'),0);run('mv(cr[0],4,4)');assert.equal(run('cr[0].x'),4,'Winner stops on enemy square');assert.equal(run('kills[0]'),1);assert.equal(run('moved'),1);assert.equal(run('cr.length'),1);
}
{
const run=setup();run("cr.push({id:2,o:1,mi:1,x:4,y:4,lv:1,em:'b'});for(let x=3;x<=5;x++)b[5][x]={o:0,v:2,id:3,lv:1}");assert.equal(run("bfs(cr[0])['7,4']!==undefined"),true,'An alternate route may go around an enemy');run('mv(cr[0],7,4)');assert.equal(run('cr.length'),2);assert.equal(run('cr[0].walk.points.some(([x,y])=>x===4&&y===4)'),false,'Walking route must never cross an enemy');
}
console.log('PASS: unlimited distance, full walking route, gaps, allied transit and occupied destination, no fusion, mandatory stop/combat at enemy, legal detour.');
