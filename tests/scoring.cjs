const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync(require('path').join(__dirname,'../index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,'');
function setup(){const timers=[],intervals=[],els=new Map(),element=()=>({children:[],style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},setPointerCapture(){}}),math=Object.create(Math);math.random=()=>.999;
const c=vm.createContext({window:{dispatchEvent(){}},Event,document:{getElementById(id){if(!els.has(id))els.set(id,element());return els.get(id)}},fetch:()=>Promise.resolve({ok:false}),setTimeout:(fn,ms)=>{timers.push({fn,ms});return timers.length},clearTimeout(){},setInterval:fn=>{intervals.push(fn);return intervals.length},clearInterval(){},console,Date,Math:math});vm.runInContext(source,c);vm.runInContext("render=()=>{};landCube=()=>{};showRollDice=()=>{};b=Array.from({length:H},()=>Array(W).fill(null));cr=[];pl=[{s:0,h:[0],q:[]},{s:0,h:[0],q:[]}];bonus=[0,0];kills=[0,0];over=0;TER=0;hi=0;die=0;anim=null;ai=false;mode='p';",c);return{c,math,roll(){vm.runInContext('lancer()',c);assert.equal(intervals.length,1);for(let i=0;i<14;i++)intervals[0]();timers.sort((a,b)=>a.ms-b.ms);while(timers.length)timers.shift().fn();}}}
for(const owner of[0,1]){
const t=setup();vm.runInContext(`cur=${owner};rot=cur?0:2;pc={x:3,y:cur?H-3:2};for(let y=cur?0:3;y<(cur?H-3:H);y++)b[y][3]={o:cur,v:1,id:99,el:'vent',lv:1};b[4][0]={o:cur,v:2,id:100};b[4][7]={o:1-cur,v:2,id:101};`,t.c);t.roll();
assert.equal(vm.runInContext(`pl[${owner}].s`,t.c),1,'Spawn in enemy zone must score for owner '+owner);
assert.equal(vm.runInContext('b.every(row=>row[3]===null)',t.c),true,'Connected route must disappear');assert.equal(vm.runInContext('cr.length',t.c),0);assert.equal(vm.runInContext('!!b[4][0]&&!!b[4][7]',t.c),true,'Other routes must remain');
}
{
const t=setup();vm.runInContext("cur=1;rot=0;pc={x:3,y:H-3};M[0].c[1][2]=3;M[0].c[2][2]=1;b[H-4][3]={o:1,v:1,id:90,lv:1};",t.c);t.roll();assert.equal(vm.runInContext('pl[1].s',t.c),0,'A face alone in the zone must not score');assert.equal(vm.runInContext('cr[0].y',t.c),vm.runInContext('H-2',t.c));
}
{
const t=setup();t.math.random=()=>0;vm.runInContext("cur=1;rot=0;pc={x:3,y:H-3};b[H-4][3]={o:1,v:1,id:90,lv:1};",t.c);t.roll();assert.equal(vm.runInContext('pl[1].s',t.c),0);assert.equal(vm.runInContext('cr.length',t.c),0);assert.equal(vm.runInContext('!!b[H-4][3]',t.c),true);
}
for(const owner of[0,1]){
const t=setup();vm.runInContext(`cur=${owner};moved=0;sel=null;mode='i';pl[cur].s=1;const y=cur?H-2:1,goal=cur?H-1:0;b[y][3]={o:cur,v:2,id:4,lv:1};b[goal][3]={o:cur,v:2,id:4,lv:1};cr=[{o:cur,x:3,y,em:'x',id:4,lv:1}];mv(cr[0],3,goal);`,t.c);assert.equal(vm.runInContext('pl[cur].s',t.c),2);assert.equal(vm.runInContext('over',t.c),1);assert.equal(vm.runInContext('cr.length',t.c),0);assert.equal(vm.runInContext('b.flat().filter(Boolean).length',t.c),0);
}
{
const t=setup();vm.runInContext("cur=1;pl[1].s=1;rot=0;pc={x:3,y:H-3};b[H-4][3]={o:1,v:1,id:90,lv:1};",t.c);t.roll();assert.equal(vm.runInContext('pl[1].s',t.c),2);assert.equal(vm.runInContext('over',t.c),1);assert.equal(vm.runInContext('mode',t.c),'x');assert.match(vm.runInContext('msg',t.c),/Orange gagne/);
}
for(const owner of[0,1]){
const t=setup();vm.runInContext(`cur=${owner};mode='i';for(let y=0;y<H;y++){b[y][3]={o:cur,v:2,id:1,lv:1};b[y][4]={o:1-cur,v:3,id:2,lv:1}}const scorer={o:cur,x:3,y:cur?H-1:0,id:1,em:'a'},opponent={o:1-cur,x:4,y:5,id:2,em:'b'};cr=[scorer,opponent];const beforeOpponent=JSON.stringify(b.map(row=>row[4]));scoreArrival(scorer);if(JSON.stringify(b.map(row=>row[4]))!==beforeOpponent)throw Error('Opponent route changed');if(!cr.includes(opponent))throw Error('Opponent monster disappeared');if(b.some(row=>row[3]))throw Error('Scorer route remains');`,t.c);
}
{
const t=setup();vm.runInContext("cur=0;rot=2;pc={x:3,y:7};b[7][2]={o:0,v:2,id:90,lv:1};cr=[{o:0,x:2,y:7,em:'a',id:90,mi:0,lv:1}];",t.c);t.roll();assert.equal(vm.runInContext('cr.length',t.c),2,'Invocation beside an ally must retain both creatures');assert.equal(vm.runInContext('cr.some(c=>c.mi===-1)',t.c),false,'Invocation must never produce a fusion creature');
}
console.log('PASS: direct spawn scores and clears connected route for both players; disconnected and opposing routes survive; faces alone and failed rolls do not score; moving into zone wins at two points.');

