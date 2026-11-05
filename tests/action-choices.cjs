const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,'');
const els=new Map(),element=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},setPointerCapture(){},querySelector:()=>null});
const c=vm.createContext({window:{},document:{getElementById(id){if(!els.has(id))els.set(id,element());return els.get(id)}},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,Date,Math,console});vm.runInContext(source,c);
vm.runInContext(`render=()=>{};try3d=()=>{};b=Array.from({length:H},()=>Array(W).fill(null));cur=0;TER=0;ai=false;over=0;mode='i';moved=0;pl=[{s:0},{s:0}];bonus=[0,0];kills=[0,0];cr=[{id:1,o:0,mi:36,x:2,y:4,em:'a'},{id:2,o:1,mi:37,x:4,y:4,em:'b'}];for(let x=2;x<=4;x++)b[4][x]={o:0,v:4,el:'feu',id:1};
// Enemy info must work with or without a selected ally; opening it never moves a unit.
tap(4,4);if($('fiche').hidden!==false||!$('fc').innerHTML.includes('Kala'))throw Error('Enemy sheet unavailable');
closeCard();tap(2,4);tap(4,4);if(sel!==cr[0]||movePlan||moved)throw Error('Inspection modified movement');if(!$('fc').innerHTML.includes('Préparer l’attaque'))throw Error('Reachable enemy needs attack action');
prepareAttack(4,4);if(!movePlan||movePlan.x!==4||cr[0].x!==2||moved)throw Error('Attack must still require explicit confirmation');cancelMove();b[4][3]=null;tap(4,4);if($('fc').innerHTML.includes('Préparer l’attaque'))throw Error('Unreachable enemy offered attack');
// All elements, both camps: terrain and neighboring element each grant one, without extra stacking per neighbor.
for(let t=0;t<TL.length;t++)for(const owner of [0,1]){TER=t;const el=TL[t];b=Array.from({length:H},()=>Array(W).fill(null));b[4][4]={o:owner,el,v:6};for(const [dx,dy]of D4)b[4+dy][4+dx]={o:1-owner,el:BT[el],v:2};if(pw(4,4)!==8)throw Error('Missing stacked bonus');const u={o:owner,x:4,y:4,mi:0};const stat=unitSnapshot(u);if(stat.attack!==8||stat.terrainBonus!==1||stat.neighborBonus!==1)throw Error('Snapshot differs from power');TER=(t+1)%TL.length;if(pw(4,4)!==7||tileBonuses(4,4).neighborBonus!==1)throw Error('Neighbor bonus lost');}
`,c);
// Feedback follows the earner even when fin() has already handed over the turn.
let reduced=false,animations=[],removed=0,pulses=[],nodes=[];
const counter=camp=>({animate:(frames)=>pulses.push(camp),getBoundingClientRect:()=>({left:camp?300:20,top:10,width:40,height:20})});
const targets={'bonus-counter-0':counter(0),'bonus-counter-1':counter(1),roll:{getBoundingClientRect:()=>({left:150,top:400,width:60,height:60})}};
const fx=vm.createContext({window:{},matchMedia:()=>({matches:reduced}),document:{getElementById:id=>targets[id],body:{append:n=>nodes.push(n)},createElement:()=>({style:{},setAttribute(){},remove(){if(!this.removed){this.removed=true;removed++}},animate(frames){const a={frames,cancel(){this.oncancel?.()}};animations.push(a);return a}})}});vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/action-feedback-v164.js'),'utf8'),fx);
fx.window.HackeniaActions.bonusEarned(0);assert.equal(animations.length,1);assert(animations[0].frames.at(-1).transform.startsWith('translate(25px,5px)'));animations[0].onfinish();assert.deepEqual(pulses,[0]);
fx.window.HackeniaActions.bonusEarned(1);fx.window.HackeniaActions.reset();assert.equal(removed,2);reduced=true;fx.window.HackeniaActions.bonusEarned(1);assert.equal(animations.length,2);assert.deepEqual(pulses,[0,1]);
console.log('PASS: enemy sheets, explicit reachable attack choice, no accidental movement, stacked bonuses for both camps/all elements, accurate history, star destination, reduced motion and cleanup.');
