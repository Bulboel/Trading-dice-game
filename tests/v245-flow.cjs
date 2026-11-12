// v245 — Fluidité : tours rapides, Espace sur PC, bandeau d'objectif, fin de partie avec Messire Balai, déplacement libre expérimental.
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=read('index.html'),css=read('assets/progression-v219.css'),me=read('assets/match-end-v198.js'),mecss=read('assets/match-end-v198.css'),portal=read('assets/portal-v159.js'),settings=read('assets/settings-v171.js'),combat=read('assets/combat.js');
// Tours rapides
assert.ok(settings.includes('fast:false')&&settings.includes('fast:!!s.fast')&&portal.includes('name="fast"'),'Fast turns setting');
assert.ok(html.includes('const SPD=()=>window.HackeniaSettings?.get?.().fast?.5:1')&&html.includes('Math.round(145*SPD())')&&html.includes('900*SPD()')&&html.includes('1000*SPD()'),'Dead times scaled');
assert.ok(combat.includes('fast?1400:2500'),'Shorter combats in fast mode');assert.ok(html.includes('id="fast"')&&html.includes('function toggleFast()'),'In-game ⏩ toggle');
// Espace
assert.ok(html.includes("addEventListener?.('keydown',e=>{if(e.code!=='Space'")&&html.includes("if(mode==='p'&&pc&&cells().length){e.preventDefault();lancer()")&&html.includes('confirmMove();return}'),'Space launches the placed die or confirms the move');
// Bandeau d'objectif
assert.ok(html.includes('function objectiveBanner()')&&html.includes('Encore un passage et c’est gagné !')&&html.includes('Plus qu’un adversaire à vaincre !')&&css.includes('#objective-banner'),'Match-point banner');
// Messire Balai
assert.ok(me.includes("assets/story/balai-triste.webp")&&me.includes('function balai(kind)')&&mecss.includes('@keyframes mb-hop')&&mecss.includes('.mb-cloud')&&fs.existsSync(path.join(root,'assets/story/balai-triste.webp')),'Messire Balai cheers or sulks at the end');
// Logo Bubulles + astuces
assert.ok(!portal.includes('wb-back wb-l')&&portal.includes('class="wb-main" src="assets/bubulle.webp"'),'v253 — Wallet shows a single Bubulle');
const tips=eval(portal.match(/const homeTips=(\[[^\]]*\])/)[1]);assert.ok(tips.length>=40&&tips.some(t=>t.includes('Espace'))&&tips.some(t=>t.includes('tout son chemin disparaît'))&&!tips.some(t=>t.includes('cases isolées')),'Tips refreshed');
// Déplacement libre (expérimental) : vrai moteur
const el=()=>new Proxy({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){},contains(){return false}},dataset:{}},{get(t,k){return k in t?t[k]:()=>null},set(t,k,v){t[k]=v;return true}}),timers=[];
const c=vm.createContext({window:{dispatchEvent(){},addEventListener(){}},document:{getElementById:()=>el(),querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>el(),addEventListener(){}},localStorage:{getItem:()=>null,setItem(){}},fetch:()=>Promise.resolve({ok:false}),setTimeout:(f,ms)=>{timers.push(f);return timers.length},clearTimeout(){},setInterval:()=>0,clearInterval(){},console,Date,Math,Event:class{},CustomEvent:class{constructor(t,o){this.detail=o?.detail}}});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,''),c);const run=s=>vm.runInContext(s,c);
run(`render=()=>{};gamePaused=false;ai=true;cur=0;over=0;freeMove=true;moved=0;b=Array.from({length:H},()=>Array(W).fill(null));for(let y=6;y<=10;y++)b[y][3]={o:0,v:3,el:'terre',lv:1,id:1};cr=[{o:0,x:3,y:10,id:1,mi:0,lv:1,mn:'A',em:'a'}];pl=[{s:0,h:[0,1,2],q:[]},{s:0,h:[3],q:[]}];hi=0;`);
run('endPlacement(false)');assert.equal(run('placedThisTurn'),1,'Turn stays open after placing');assert.equal(run('cur'),0);assert.equal(run('pl[0].h.length'),2,'The placed die left the hand');
run("mode='p';pc={x:3,y:9};lancer()");assert.equal(run('placedThisTurn'),1,'No second placement in the same turn');
(async()=>{run('mv(cr[0],3,7)');for(let k=0;k<6;k++){await new Promise(r=>setImmediate(r));let n=0;while(timers.length&&n++<20&&run("cur")===0)timers.shift()()}
 assert.equal(run('cur'),1,'Moving after the placement ends the turn');assert.equal(run('placedThisTurn'),0);
 run(`cur=0;moved=0;freeMove=false;pl[0].h=[0,1];hi=0`);run('endPlacement(false)');assert.equal(run('cur'),1,'Rule off: placing still ends the turn');
 console.log('PASS: fast turns (setting, ⏩, shorter waits), Space shortcut, match-point banner, Messire Balai end scene, Bubulles heap logo, refreshed tips, experimental free move (open turn, one die per turn, move ends turn, off by default).');
})().catch(e=>{console.error(e);process.exit(1)});
