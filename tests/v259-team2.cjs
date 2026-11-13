// v259 — 2 contre 2 contre l'IA : deux joueurs par camp qui jouent à tour de rôle, score partagé par camp, 3 passages / 6 combats.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),portal=fs.readFileSync(path.join(__dirname,'../assets/portal-v159.js'),'utf8');
const el=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},setPointerCapture(){},dataset:{},append(){},querySelector(){return null},replaceChildren(){}}),els=new Map();
const c=vm.createContext({window:{dispatchEvent(){}},Event,CustomEvent:Event,document:{body:{classList:{add(){},remove(){},toggle(){}},dataset:{}},getElementById(i){if(!els.has(i))els.set(i,el());return els.get(i)},createElement:el,querySelector(){return null},querySelectorAll(){return[]}},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Date,Math,console,matchMedia:()=>({matches:false}),location:{hash:''}});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,''),c);const run=s=>vm.runInContext(s,c);
run('render=()=>{}');
// partie classique : rien ne change
run("window.hackeniaGame.start(null,'ville','quick','moyen')");assert.equal(run('TEAM2'),false);assert.deepEqual([run('WIN'),run('KW')],[2,4]);assert.equal(run('squad'),null);
// 2 contre 2
run("window.hackeniaGame.start(null,'ville','play','moyen',null,'classique',true)");
assert.equal(run('TEAM2'),true);assert.deepEqual([run('WIN'),run('KW')],[3,6],'3 passages ou 6 combats');
assert.equal(run('squad.length'),2);assert.ok(run('squad.every(t=>t.length===2&&t.every(p=>p.h.length===5&&p.q.length===5))'),'4 joueurs : 5 dés en main, 5 en pioche');
assert.ok(run('pl[0]===squad[0][0]&&pl[1]===squad[1][0]'));assert.equal(run('isAIc(0)'),false,'le joueur humain commence');assert.equal(run('isAIc(1)'),true);
const seq=[];for(let i=0;i<6;i++){seq.push(run('[cur,pl[cur]===squad[cur][0]?0:1,isAIc(cur)?1:0].join()'));run('pl[cur].s+=cur===0?0:0;placedThisTurn=1;fin(true)')}
assert.deepEqual(seq,['0,0,0','1,0,1','0,1,1','1,1,1','0,0,0','1,0,1'],'ordre : vous, rival A, allié IA, rival B, vous…');
// le score appartient au camp, pas au joueur
run('pl[0].s=2');run('placedThisTurn=1;fin(true);placedThisTurn=1;fin(true)');assert.equal(run('pl[0].s'),2,'score du camp conservé après le changement de joueur');
// la main affichée reste celle de l'humain pendant le tour de l'allié
run('cur=0;pl[0]=squad[0][1]');assert.equal(run('plOf(0)===squad[0][0]'),true);
// interface
assert.ok(portal.includes('id="play-team2"')&&portal.includes("!!$('play-team2')?.checked"));
assert.ok(html.includes('aiTurn:isAIc(cur)'));
console.log('v259 team2 OK');
