// v414 — arbre de compétences et pouvoirs (Vision, Impact, Blocage).
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const el=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},setPointerCapture(){},dataset:{},append(){},replaceChildren(){},children:[],hidden:false,remove(){},addEventListener(){},setAttribute(){},querySelector(){return{focus(){}}}}),els=new Map();
let skills={};
const win={dispatchEvent(){},HackeniaSkills:{powers:()=>skills},HackeniaPortal:{profile:()=>({})}};
const c=vm.createContext({window:win,Event,CustomEvent:Event,document:{body:{classList:{add(){},remove(){},toggle(){},contains(){return false}},dataset:{},append(){}},getElementById(i){if(!els.has(i))els.set(i,el());return els.get(i)},createElement:el,querySelector(){return null},querySelectorAll(){return[]}},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Date,Math,console});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,''),c);const run=s=>vm.runInContext(s,c);
// Module de l'arbre
const LV={0:1,200:3,500:5,1000:10,1500:15,2000:20,2500:25,3000:30,3500:35,4000:40};global.window={HackeniaProgress:{levelOf:xp=>({level:LV[xp]||1})}};const S=require('../assets/skills-v414.js');
const p1={xp:0},p3={xp:200},p5={xp:500};
assert.equal(S.points(p1),0);assert.equal(S.points(p3),1);assert.equal(S.points(p5),2);assert.equal(S.points({xp:3500}),8);
assert.ok(!S.canLearn(p1,'vision',1));assert.ok(S.canLearn(p3,'vision',1));assert.ok(!S.canLearn(p3,'vision',2));
const a=S.learn(p3,'impact',1);assert.equal(a.skills.impact,1);assert.equal(S.points(a),0);assert.equal(S.learn(a,'block',1),null);assert.deepEqual(a.skillsOnline,['impact']);
const b5=S.learn({...a,xp:500},'impact',2);assert.equal(b5.skills.impact,2);assert.equal(S.points(b5),0);
assert.ok(S.canLearn({...a,xp:500},'block',1));assert.ok(!S.canLearn({xp:500,skills:{block:0}},'block',2));
// v.3 au niveau 20, éveil au niveau 10, ultimes au niveau 25 (un seul)
assert.ok(!S.canLearn({xp:1500,skills:{vision:2}},'vision',3));assert.ok(S.canLearn({xp:2000,skills:{vision:2}},'vision',3));
assert.ok(!S.canLearn({xp:500},'bless',1));assert.ok(S.canLearn({xp:1000},'bless',1));assert.ok(!S.canLearn({xp:1000,skills:{bless:1}},'bless',2));
assert.ok(!S.canLearn({xp:2000},'phoenix',1));assert.ok(S.canLearn({xp:2500},'phoenix',1));assert.ok(!S.canLearn({xp:3500,skills:{phoenix:1}},'storm',1));
// en ligne : 3 pouvoirs au plus
const big={xp:3500,skills:{vision:1,impact:1,block:1,bless:1}};assert.equal(S.onlineSet(big).length,3);const pw=S.powers(big,true);assert.equal(Object.values(pw).filter(Boolean).length,3);assert.equal(S.powers(big).bless,1);
const t1=S.toggleOnline({...big,skillsOnline:['vision','impact','block']},'bless');assert.equal(t1,null);const t2=S.toggleOnline({...big,skillsOnline:['vision','impact','block']},'block');assert.deepEqual(t2.skillsOnline,['vision','impact']);
// réinitialisation : 200 Bubulles
assert.equal(S.reset({...big,gold:100}),null);const r=S.reset({...big,gold:300});assert.equal(r.gold,100);assert.equal(S.spent(r),0);
assert.ok(S.treeHTML(p5,'').includes('sk-node r1 g1 open'));
// Moteur : partie solo contre l'ordinateur
const fresh=()=>run(`render=()=>{};ai=true;TEAM2=false;ONLINE=null;rewardMode='play';TER=TL.indexOf('ville');LAYOUT='classique';b=Array.from({length:H},()=>Array(W).fill(null));cr=[];walls=[];traps=[];lotus=[];boss=null;scoutUntil=[0,0];turnNumber=3;cur=0;over=0;mode='i';moved=0;placedThisTurn=0;kills=[0,0];pl=[{h:[0,1],q:[],s:0},{h:[2,3],q:[],s:0}];msg='';initPowers()`);
skills={vision:2,impact:1,block:1};fresh();
assert.equal(run('powLeft[0].vision'),2);assert.equal(run('powLeft[0].impact'),1);assert.equal(run('powLeft[0].block'),1);assert.equal(run('Object.values(powLeft[1]).some(Boolean)'),false);
run("usePower('vision')");assert.equal(run('scoutUntil[0]>turnNumber'),true);assert.equal(run('powLeft[0].vision'),1);
// Impact
run(`for(let y=0;y<H;y++)for(let x=0;x<W;x++)b[y][x]={o:0,el:'',v:2,lv:1,id:1,mn:'x'};var foe={o:1,x:3,y:3,em:'',id:9,mn:'f',mi:0,lv:1,born:0};var me={o:0,x:3,y:5,em:'',id:8,mn:'m',mi:1,lv:1,born:0};cr.push(foe,me)`);
const before=run('pwc(foe)');run("usePower('impact')");assert.ok(run('!!powAim'));run('tap(3,3)');assert.equal(run('pwc(foe)'),before-1);assert.equal(run('powLeft[0].impact'),0);assert.ok(!run('powAim'));
// Blocage : l'ordinateur attaque ma créature (déplacement direct), le joueur dit Oui
fresh();run(`for(let y=0;y<H;y++)for(let x=0;x<W;x++)b[y][x]={o:1,el:'',v:2,lv:1,id:1,mn:'x'};var foe={o:1,x:3,y:3,em:'',id:9,mn:'f',mi:0,lv:1,born:0};var me={o:0,x:3,y:5,em:'',id:8,mn:'m',mi:1,lv:1,born:0};cr.push(foe,me);cur=1;var answer=null;askBlock=(c,bt,done)=>{answer=bt;done(true)}`);
run('b[3][3].mark=1');run('mv(foe,3,5)');
assert.ok(run('answer&&answer.def===me'));assert.equal(run('cr.length'),2);assert.equal(run('foe.y'),3);assert.equal(run('b[4][3]'),null);assert.ok(run('b[3][3]&&!b[3][3].mark'));assert.equal(run('powLeft[0].block'),0);assert.deepEqual([...run('kills')],[0,0]);
// Blocage v2 : repoussé hors du damier → écrasé
skills={vision:0,impact:0,block:2};fresh();run(`for(let y=0;y<H;y++)for(let x=0;x<W;x++)b[y][x]={o:1,el:'',v:2,lv:1,id:1,mn:'x'};var foe={o:1,x:0,y:1,em:'',id:9,mn:'f',mi:0,lv:1,born:0};var me={o:0,x:0,y:2,em:'',id:8,mn:'m',mi:1,lv:1,born:0};cr.push(foe,me);cur=1;askBlock=(c,bt,done)=>done(true)`);
run('mv(foe,0,2)');assert.equal(run('cr.includes(foe)'),false);assert.equal(run('cr.includes(me)'),true);assert.equal(run('b[0][0]'),null);
// Non : combat normal
skills={vision:0,impact:0,block:1};fresh();run(`for(let y=0;y<H;y++)for(let x=0;x<W;x++)b[y][x]={o:1,el:'',v:2,lv:1,id:1,mn:'x'};var foe={o:1,x:3,y:3,em:'',id:9,mn:'f',mi:0,lv:1,born:0};var me={o:0,x:3,y:5,em:'',id:8,mn:'m',mi:1,lv:1,born:0};cr.push(foe,me);cur=1;askBlock=(c,bt,done)=>done(false)`);
run('mv(foe,3,5)');assert.equal(run('powLeft[0].block'),1);assert.ok(run('cr.length<2'));
// Pas de pouvoirs dans le tutoriel ni en 2 contre 2
skills={vision:2,impact:2,block:2};fresh();run(`rewardMode='tutorial';initPowers()`);assert.equal(run('powLeft[0].vision'),0);
fresh();run(`TEAM2=true;initPowers()`);assert.equal(run('powLeft[0].block'),0);
console.log('v414 powers OK');
