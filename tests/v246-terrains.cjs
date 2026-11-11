// v246 — Ville de Dassom et grotte (terrains neutres), terrains du chapitre 1, formes de plateau, mort subite, créature fraîche immobile.
const fs=require('fs'),vm=require('vm'),path=require('path'),os=require('os'),assert=require('assert'),{pathToFileURL}=require('url');const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=read('index.html'),cl=read('assets/clearing-v105.js'),portal=read('assets/portal-v159.js');
assert.ok(cl.includes("import { createCity } from './city-v246.js")&&cl.includes("import { createCave } from './cave-v246.js")&&cl.includes("['terre','feu','glace','eau','vent','foudre','ville','grotte']"),'New scenes wired');
assert.ok(portal.includes("['ville','🏰','La ville de Dassom']")&&portal.includes("['grotte','🕯️','La grotte souterraine']")&&portal.includes('id="play-layout"'),'Selectable in Jouer, with board shapes');
global.window={};require(path.join(root,'assets/story-data-v193.js'));const st=Object.fromEntries(window.HACKENIA_STORY.filter(p=>p.duel).map(p=>[p.id,p.duel.terrain]));
assert.deepEqual(['c1p1','c1p2','c1p4','c1p5','c1p6','c1p6bis','c1p7','c1p8','c1p9','c1p10'].map(k=>st[k]),['terre','terre','grotte','grotte','terre','terre','grotte','eau','eau','eau'],'Chapter 1: Bois tendre until Berdésa, cave in the mine, Bois tendre, cave in the twins’ grotto, then the pink lake');
const el=()=>new Proxy({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){},contains(){return false}},dataset:{}},{get(t,k){return k in t?t[k]:()=>null},set(t,k,v){t[k]=v;return true}});
const c=vm.createContext({window:{dispatchEvent(){},addEventListener(){}},document:{getElementById:()=>el(),querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>el(),addEventListener(){}},localStorage:{getItem:()=>null,setItem(){}},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},console,Date,Math,Event:class{},CustomEvent:class{constructor(t,o){this.detail=o?.detail}}});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,''),c);const run=s=>vm.runInContext(s,c);
// Terrains neutres : aucun bonus de terrain.
for(const t of['ville','grotte']){run(`TER=TL.indexOf('${t}');b=Array.from({length:H},()=>Array(W).fill(null));b[5][3]={o:0,v:3,el:'terre',lv:1};b[5][4]={o:0,v:3,el:'feu',lv:1}`);assert.equal(run('tileBonuses(3,5).terrainBonus+tileBonuses(4,5).terrainBonus'),0,t+' is neutral')}
// Formes : symétriques, hors zones, réellement bloquantes, uniquement en mode Jouer.
for(const k of run('Object.keys(LAYOUTS)')){const cells=run(`JSON.stringify(LAYOUTS['${k}'].cells)`),L=JSON.parse(cells),set=new Set(L.map(p=>p+''));assert.ok(L.every(([x,y])=>set.has([7-x,11-y]+'')),k+' is symmetric');assert.ok(L.every(([x,y])=>!run(`inZone(0,${y})||inZone(1,${y})`)),k+' keeps camp zones free');
 run(`LAYOUT='${k}';TER=TL.indexOf('terre')`);for(const [x,y] of L)assert.ok(run(`blocked(${x},${y})`),k+' blocks its cells')}
run("rewardMode='quick';LAYOUT='classique'");assert.ok(html.includes("LAYOUT=LAYOUTS[layout]&&kind==='play'?layout:'classique'"),'Shapes only in the Jouer mode');
// Mort subite : au moins trois 6 sur 3 dés ou plus.
run("rewardMode='play'");assert.equal(run('invocationRoll([6,6,6],5).sudden'),true);assert.equal(run('invocationRoll([6,6,6,2],5).sudden'),true);assert.equal(run('invocationRoll([6,6],5).sudden'),false,'A pair of 6 is not sudden death');assert.equal(run('invocationRoll([6,6,5],5).sudden'),false);
run("rewardMode='tutorial'");assert.equal(run('invocationRoll([6,6,6],5).sudden'),false,'Never in the tutorial');
assert.ok(html.includes("recordEvent('Victoire',P[k]+' gagne par mort subite")&&html.includes('function suddenDeathBanner'),'Immediate win with a banner');
// Créature qui vient d'apparaître : immobile jusqu'au tour suivant.
run(`TER=0;LAYOUT='classique';b=Array.from({length:H},()=>Array(W).fill(null));for(let y=6;y<=10;y++)b[y][3]={o:0,v:3,el:'terre',lv:1};turnNumber=7;cr=[{o:0,x:3,y:10,id:1,mi:0,lv:1,born:7}]`);
assert.equal(Object.keys(run('bfs(cr[0])')).length,1,'Freshly summoned creature cannot move');run('turnNumber=9');assert.ok(Object.keys(run('bfs(cr[0])')).length>1,'It moves on its next turn');
// Les deux scènes se construisent sans erreur.
const ctx=new Proxy({},{get:(t,k)=>k==='createRadialGradient'||k==='createLinearGradient'?()=>({addColorStop(){}}):k==='createImageData'?(w,h)=>({data:new Uint8ClampedArray(w*h*4)}):k==='getImageData'?()=>({data:[]}):()=>{},set:()=>true});
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>ctx})};
const three=pathToFileURL(path.join(root,'assets/vendor/three/build/three.module.min.js')).href,tmp=fs.mkdtempSync(path.join(os.tmpdir(),'hk-246-'));
(async()=>{const THREE=await import(three);for(const [f,fn] of[['city-v246.js','createCity'],['cave-v246.js','createCave']]){const file=path.join(tmp,f.replace('.js','.mjs'));fs.writeFileSync(file,read('assets/'+f).replace("from 'three'","from '"+three+"'"));const mod=await import(pathToFileURL(file).href);
 for(const sw of[false,true]){const w=new THREE.Group(),s=mod[fn](w,sw,12);w.updateMatrixWorld(true);const slabs=s.root.children.find(o=>o.isInstancedMesh&&o.count===96);assert.ok(slabs,f+' one slab per cell');for(const t of[0,1.5])s.update(t,false,true);s.update(1,true,false)}}
 fs.rmSync(tmp,{recursive:true,force:true});console.log('PASS: Dassom city and underground cave (neutral, one slab per cell), chapter 1 terrains, 5 symmetric board shapes (Jouer only), sudden death on three 6s, freshly summoned creatures wait a turn.');
})().catch(e=>{console.error(e);process.exit(1)});
