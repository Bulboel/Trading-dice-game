// v418 — nouveaux pouvoirs : v.3, Bénédiction, Entrave, Rappel, Élan, Sabotage, Prévoyance, Phénix, Portail, Tempête, Faveur ; deux objets portés.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const el=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},setPointerCapture(){},dataset:{},append(){},replaceChildren(){},children:[],hidden:false,remove(){},addEventListener(){},setAttribute(){},querySelector(){return{focus(){}}}}),els=new Map();
let skills={};const win={dispatchEvent(){},HackeniaSkills:{powers:()=>skills},HackeniaPortal:{profile:()=>({})}};
const c=vm.createContext({window:win,Event,CustomEvent:Event,document:{body:{classList:{add(){},remove(){},toggle(){},contains(){return false}},dataset:{},append(){}},getElementById(i){if(!els.has(i))els.set(i,el());return els.get(i)},createElement:el,querySelector(){return null},querySelectorAll(){return[]}},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Date,Math,console});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,''),c);const run=s=>vm.runInContext(s,c);
const fresh=sk=>{skills=sk;run(`render=()=>{};ai=true;TEAM2=false;ONLINE=null;rewardMode='play';TER=TL.indexOf('ville');LAYOUT='classique';b=Array.from({length:H},()=>Array(W).fill(null));for(let y=0;y<H;y++)for(let x=0;x<W;x++)b[y][x]={o:y<H/2?1:0,el:'',v:2,lv:1,id:1,mn:'x'};cr=[];walls=[];traps=[];lotus=[];boss=null;scoutUntil=[0,0];turnNumber=3;cur=0;over=0;mode='i';moved=0;placedThisTurn=0;kills=[0,0];pl=[{h:[0,1],q:[5,6,7],s:0},{h:[2,3],q:[],s:0}];msg='';initPowers();var foe={o:1,x:3,y:3,em:'',id:9,mn:'f',mi:0,lv:1,born:0};var foe2={o:1,x:5,y:3,em:'',id:10,mn:'g',mi:0,lv:1,born:0};var me={o:0,x:3,y:7,em:'',id:8,mn:'m',mi:1,lv:1,born:0};cr.push(foe,foe2,me);b[7][3].id=8`)};
// Bénédiction v.2 : +1 sur deux de mes créatures
fresh({bless:2});run(`var me2={o:0,x:5,y:7,em:'',id:11,mn:'n',mi:1,lv:1,born:0};cr.push(me2)`);const a0=run('pwc(me)');run("usePower('bless')");run('tap(3,7);tap(5,7)');assert.equal(run('pwc(me)'),a0+1);assert.equal(run('powLeft[0].bless'),0);
// Impact v.3 « lourd » : −2 sur une créature
fresh({impact:3});run(`choose=(t,o,cb)=>cb('heavy')`);const f0=run('pwc(foe)');run("usePower('impact')");run('tap(3,3)');assert.equal(run('pwc(foe)'),f0-2);
// Entrave : la créature ne peut plus bouger à son prochain tour
fresh({bind:1});run("usePower('bind')");run('tap(3,3)');run('turnNumber=4');assert.equal(Object.keys(run('bfs(foe)')).length,1);run('turnNumber=6');assert.ok(Object.keys(run('bfs(foe)')).length>1);
// Rappel v.1 : la créature et ses dalles quittent le plateau, le dé revient en main
fresh({recall:1});run("usePower('recall')");run('tap(3,7)');assert.equal(run('cr.includes(me)'),false);assert.equal(run('b[7][3]'),null);assert.deepEqual([...run('pl[0].h')],[0,1,1]);
// Sabotage v.2 : deux dalles adverses libres détruites
fresh({sabotage:2});run("usePower('sabotage')");run('tap(1,1);tap(2,1)');assert.equal(run('b[1][1]'),null);assert.equal(run('b[1][2]'),null);
// Portail : téléportation dans ma moitié, avec la dalle
fresh({portal:1});run(`b[7][3].mark=7`);run("usePower('portal')");run('tap(3,7)');run('tap(0,6)');assert.equal(run('me.x'),0);assert.equal(run('me.y'),6);assert.equal(run('b[6][0].mark'),7);assert.equal(run('b[7][3]'),null);
// Portail : pas dans la moitié adverse
fresh({portal:1});run("usePower('portal')");run('tap(3,7)');run('tap(0,1)');assert.equal(run('me.y'),7);assert.ok(run('!!powAim'));
// Tempête : −1 PA pendant deux tours
fresh({storm:1});const s0=run('pwc(foe)');run("usePower('storm')");assert.equal(run('pwc(foe)'),s0-1);run('turnNumber=7');assert.equal(run('pwc(foe)'),s0);
// Faveur des dés : armée pour le prochain lancer
fresh({favor:1});run("usePower('favor')");assert.equal(run('favorArm[0]'),1);
// Prévoyance : le dé choisi passe en tête de la pioche
fresh({foresight:2});run(`choose=(t,o,cb)=>cb(2)`);run("usePower('foresight')");assert.deepEqual([...run('pl[0].q')],[7,5,6]);assert.equal(run('powLeft[0].foresight'),1);
// Élan v.1 : second déplacement, mais sans attaque
fresh({surge:1});run("usePower('surge')");assert.equal(run('surgeArm[0]'),1);run('mv(me,3,6)');assert.equal(run('me.y'),6);assert.equal(run('moved'),0);assert.equal(run('surgeSecond[0]'),1);run('mv(me,3,5)');assert.equal(run('moved'),1);
fresh({surge:1});run("usePower('surge')");run('mv(me,3,6)');run('foe.y=4');run('mv(me,3,4)');assert.equal(run('cr.includes(foe)'),true);assert.ok(/ne peut pas attaquer/.test(run('msg')));
// Phénix : ma créature vaincue renaît sur sa case d'apparition
fresh({phoenix:1});run('me.sx=3;me.sy=7;me.boost=-5;cur=1');run('mv(foe,3,6)');assert.equal(run('cr.includes(me)'),true);assert.equal(run('powLeft[0].phoenix'),0);assert.equal(run('D4.some(([dx,dy])=>{const e=at(me.x+dx,me.y+dy);return e&&e.o!==me.o})'),false,'renaît hors de portée des ennemis');
// Blocage v.3 : repousse de 3 cases et étourdit
fresh({block:3});run(`foe.y=1;cur=1;askBlock=(c,bt,done)=>done(true)`);run('mv(foe,3,6)');assert.ok(run('(foe.stun|0)>turnNumber'));
// Vision v.3 : pièges adverses révélés pendant la vision
fresh({vision:3});run(`traps=[{x:2,y:2,o:1}]`);assert.equal(run('window.hackeniaGame.snapshot().traps.length'),0);run("usePower('vision')");assert.equal(run('window.hackeniaGame.snapshot().traps.length'),1);
// Deux objets portés au niveau 40 : effets additionnés
global.window={HackeniaProgress:{levelOf:xp=>({level:xp>=4000?40:10})},HackeniaChallenges:{unlocked:()=>[{id:'chapter3'},{id:'noel5'}]}};const E=require('../assets/equipment-v198.js');
const pr={xp:4000,equipped:'bague-chanceuse',equipped2:'grelot-des-neiges'};assert.equal(E.equippedList(pr).length,2);const g=E.equipped(pr);assert.equal(g.startBonus,1);assert.equal(g.reroll,1);
assert.equal(E.equippedList({...pr,xp:1000}).length,1);
// v423 — Phénix : la case d'apparition est menacée → renaissance un peu en retrait, côté de son camp
fresh({phoenix:1});run('me.sx=3;me.sy=7;cr.push({o:1,x:3,y:6,em:"",id:12,mn:"h",mi:0,lv:1,born:0});me.boost=-5;foe.x=4;foe.y=6;cur=1');run('mv(foe,4,7)');
assert.equal(run('cr.includes(me)'),true);assert.equal(run('D4.some(([dx,dy])=>{const e=at(me.x+dx,me.y+dy);return e&&e.o!==me.o})'),false);assert.ok(run('me.y')>=7,'recule vers son camp');
console.log('v418 powers OK');
