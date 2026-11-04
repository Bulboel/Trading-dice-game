const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..'),src=fs.readFileSync(path.join(root,'assets/clearing-v105.js'),'utf8');
let active={sequence:7,progress:.8},holds=[],plays=0,speed;
const action={reset(){return this},setLoop(){return this},fadeIn(){return this},play(){plays++;return this},setEffectiveTimeScale(value){speed=value;return this}};
const context=vm.createContext({THREE:{LoopOnce:1},window:{HackeniaCombat:{current:()=>active,holdVictory:(...args)=>holds.push(args)}},getCombatClip:async()=>({duration:16}),Math,Map});
vm.runInContext(src.slice(src.indexOf('async function playCombatClip('),src.indexOf('\nasync function playWalkClip(')),context);
vm.runInContext(src.slice(src.indexOf('function fadeObject('),src.indexOf('\nfunction sync(')),context);
(async()=>{
 const g={parent:{},userData:{animationInfo:{animations:{victory:'victory.glb'}},modelRoot:{},mixer:{clipAction:()=>action}}};
 await context.playCombatClip(g,'victory',active);assert.equal(plays,1);assert.equal(speed,4,'Long dances play in full at a controlled speed');assert.deepEqual(holds,[[7,4]]);await context.playCombatClip(g,'victory',active);assert.equal(plays,1,'A clip starts once per victory');
 active={kind:'passage',sequence:8,progress:0};await context.playCombatClip(g,'victory',active);assert.equal(plays,2,'Arrival starts victory without waiting for a combat impact');
 const original={opacity:.8,clone(){return{opacity:this.opacity,userData:{}}}},node={material:original},late={material:original};let nodes=[node];const object={userData:{},traverse:fn=>nodes.forEach(fn)};
 context.fadeObject(object,.5);assert.equal(original.opacity,.8,'Shared materials of other routes must stay opaque');assert.equal(node.material.opacity,.4);
 node.material=original;nodes.push(late);context.fadeObject(object,.25);assert.equal(node.material.opacity,.2,'Refresh restores fade bindings');assert.equal(late.material.opacity,.2,'A model loaded during the fade joins it');assert.equal(original.opacity,.8);
 console.log('PASS: combat and passage trigger one full victory clip; duration is held; fade materials stay isolated across refreshes and late model loads.');
})().catch(e=>{console.error(e);process.exitCode=1});
