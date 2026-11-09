const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');const root=path.join(__dirname,'..');
// Récompenses : victoire en mode Jouer selon la difficulté, Partie rapide 30, défaite 5.
const rc=vm.createContext({window:{},structuredClone});vm.runInContext(fs.readFileSync(path.join(root,'assets/match-rewards-v157.js'),'utf8'),rc);const R=rc.window.HackeniaMatchRewards;
for(const [lv,g] of [['facile',20],['moyen',30],['difficile',40],['divin',50]]){assert.equal(R.amount(true,'play',lv),g);assert.equal(R.amount(false,'play',lv),5)}
assert.equal(R.amount(true,'quick'),30);assert.equal(R.amount(false,'quick'),5);assert.equal(R.amount(true,'online','divin'),0);
// Limites de deck : 1 divin, 1 légendaire, 4 rares ; commun et peu commun libres.
const src=fs.readFileSync(path.join(root,'assets/portal-v159.js'),'utf8'),seg=src.slice(src.indexOf('const DECK_LIMITS='),src.indexOf('function deckTray('));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),engine=html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,'');const els=new Map(),el=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}}});
const g=vm.createContext({window:{},document:{getElementById(i){if(!els.has(i))els.set(i,el());return els.get(i)}},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Date,Math,console,Event,CustomEvent});vm.runInContext(engine,g);
const defs=JSON.parse(vm.runInContext('JSON.stringify(M)',g)),rarity=d=>d.rarity??d.lv,inv={};defs.forEach((_,i)=>inv[i]=3);
const ctx=vm.createContext({defs,rarity,profile:{inventory:inv},counts:a=>a.reduce((o,i)=>(o[i]=(o[i]||0)+1,o),{}),validId:n=>Number.isInteger(n)&&n>=0&&n<defs.length});vm.runInContext(seg+';this.api={legal,limitProblem,canAddRarity};',ctx);const {legal,limitProblem,canAddRarity}=ctx.api;
const byR=r=>defs.map((d,i)=>[d,i]).filter(([d])=>rarity(d)===r).map(([,i])=>i);const common=byR(1),rare=byR(3),leg=byR(5),div=byR(6);
assert.equal(legal([div[0],leg[0],...rare.slice(0,4),...common.slice(0,4)]),true,'1 divine, 1 legendary, 4 rares is allowed');
assert.equal(legal([div[0],div[1],...common.slice(0,8)]),false);assert.match(limitProblem([div[0],div[1]]),/divin/);
assert.equal(legal([leg[0],leg[1],...common.slice(0,8)]),false);assert.equal(legal([...rare.slice(0,5),...common.slice(0,5)]),false);
assert.equal(legal([...common.slice(0,6),...common.slice(0,4)]),true,'Common dice have no limit');
assert.equal(canAddRarity([div[0]],div[1]),false);assert.equal(canAddRarity(rare.slice(0,3),rare[3]),true);assert.equal(canAddRarity(rare.slice(0,4),rare[4]),false);
// Moteur : le niveau choisi est appliqué et transmis aux récompenses ; il ne touche pas aux lancers.
vm.runInContext("ai=true",g);assert.deepEqual(Object.keys(JSON.parse(vm.runInContext('JSON.stringify(AI_LEVELS)',g))),['facile','moyen','difficile','divin']);
assert.ok(!/aiLevel/.test(engine.slice(engine.indexOf('function rollValues'),engine.indexOf('function mulberry32'))),'Rolls never depend on the AI level');
assert.ok(engine.includes('event.difficulty=aiLevel'));
console.log('PASS: play rewards 20/30/40/50 (+5 on defeat), deck limits 1 divine / 1 legendary / 4 rares, four AI levels that never change the dice.');
