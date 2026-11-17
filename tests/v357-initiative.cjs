// v357 — Lancer d'initiative au D20 : le plus haut commence, égalité = relance, un 20 donne un dé bonus.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,'');
const els=new Map(),el=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},setPointerCapture(){}});
const events=[];const c=vm.createContext({window:{dispatchEvent(e){events.push(e)}},Event,CustomEvent:class{constructor(t,o){this.type=t;this.detail=o?.detail}},document:{getElementById(i){if(!els.has(i))els.set(i,el());return els.get(i)}},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Date,Math,console});vm.runInContext(src,c);
const run=s=>vm.runInContext(s,c);run('render=()=>{};recordEvent=()=>{};');
for(const [seq,winner,bonus] of [[[.9,.1],0,[0,0]],[[.1,.9],1,[0,0]],[[.5,.5,.99,.2],0,[1,0]],[[.3,.97],1,[0,1]]]){
 run(`(()=>{const q=${JSON.stringify(seq)};let i=0;Math.random=()=>q[i++]??.5;bonus=[0,0];cur=0;startInitiative();})()`);
 const R=run('initRoll');assert.ok(R,'tirage en attente');assert.ok(run('initRoll&&true'),'le jeu attend la fin de l’animation');
 run('initiativeDone(initRoll.id)');assert.equal(run('cur'),winner,'le plus haut lancer commence');assert.deepEqual(run('bonus.slice()'),bonus,'un 20 donne un dé bonus');assert.equal(run('initRoll'),null)}
assert.ok(events.filter(e=>e.type==='hackenia:initiative').length>=4,'animation déclenchée à chaque tirage');
const two=events.find(e=>e.detail?.rolls?.length===2);assert.ok(two,'égalité : on relance');
// en ligne : même graine → même tirage sur les deux appareils, appliqué aussitôt (le tour passe au siège gagnant)
{const res=[];for(const seat of[0,1]){run(`ONLINE={seat:${seat},camp:${seat},slot:0,team2:false,aiSeats:[],rng:mulberry32(4242),rolls:[]};bonus=[0,0];cur=0;turnSeat=0;startInitiative();`);assert.equal(run('initRoll'),null,'en ligne, rien n’attend l’animation');res.push([run('cur'),run('turnSeat'),JSON.stringify(run('bonus.slice()'))])}
 assert.deepEqual(res[0],res[1],'les deux joueurs obtiennent le même résultat');assert.equal(res[0][0],res[0][1],'le siège gagnant joue');run('ONLINE=null')}
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');assert.ok(html.includes('initiative-v357.js')&&html.includes('initiative-v357.css'));
assert.ok(fs.readFileSync(path.join(__dirname,'../assets/story-v193.js'),'utf8').includes("c2p7:'p82'"),'carte du ver géant');
console.log('PASS: initiative au D20 (solo, 2 contre 2 et en ligne synchronisé, plus haut commence, relance sur égalité, 20 = dé bonus), animation, carte du ver géant.');
