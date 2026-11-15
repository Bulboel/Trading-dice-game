// v297 — Héros du joueur : posé dans la zone à protéger, dalle de force min(6, niveau/10), élément choisi, jamais en ligne ni au tutoriel.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const el=()=>new Proxy(function(){},{get:(t,k)=>k==='style'||k==='dataset'?new Proxy({},{get:()=>'',set:()=>true}):k==='classList'?{add(){},remove(){},toggle(){},contains:()=>false}:k==='children'||k==='childNodes'?[]:k==='firstElementChild'?{style:{}}:k===Symbol.toPrimitive?()=>'':(()=>el()),set:()=>true,apply:()=>el()}),els=new Map();
let prof={hero:{name:'Aria',mi:37,el:'feu'},xp:0};
const c=vm.createContext({window:{dispatchEvent(){},HackeniaPortal:{profile:()=>prof},HackeniaProgress:{levelOf:xp=>({level:1+Math.floor(xp/100)})}},Event,document:{getElementById(i){if(!els.has(i))els.set(i,el());return els.get(i)}},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Date,Math,console,localStorage:{getItem(){return null},setItem(){}},navigator:{},matchMedia:()=>({matches:false,addEventListener(){}}),location:{hash:''},HTMLElement:class{},CustomEvent:class{}});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,''),c);const run=s=>vm.runInContext(s,c);run('render=function(){};rBoard=function(){};');const fresh=()=>run('b=Array.from({length:H},()=>Array(W).fill(null));cr=[];placeHero()');
const heroes=()=>run('cr.filter(k=>k.hero).map(k=>({x:k.x,y:k.y,o:k.o,mn:k.mn,v:b[k.y][k.x].v,el:b[k.y][k.x].el,lv:k.lv}))');
run('ai=true;ONLINE=null;TEAM2=false;rewardMode="quick"');fresh();
let h=heroes();assert.equal(h.length,1,'un héros posé');assert.deepEqual([h[0].o,h[0].y,h[0].v,h[0].el,h[0].mn,h[0].lv],[0,11,0,'feu','Aria',1],'zone à protéger, dalle 0, élément feu');
for(const [level,v] of [[9,0],[10,1],[25,2],[60,6],[99,6]]){prof.xp=(level-1)*100;fresh();assert.equal(heroes()[0].v,v,`niveau ${level} → dalle ${v}`)}
run('ai=false');fresh();assert.equal(heroes().length,0,'pas de héros hors partie contre l’IA');
run('ai=true;rewardMode="tutorial"');fresh();assert.equal(heroes().length,0,'pas de héros au tutoriel');
run('rewardMode="quick";TEAM2=true');fresh();assert.equal(heroes().length,0,'pas de héros en 2 contre 2');
run('TEAM2=false;ONLINE={camp:0}');fresh();assert.equal(heroes().length,0,'pas de héros en ligne');run('ONLINE=null');
prof={xp:0};run('ai=true');fresh();assert.equal(heroes().length,0,'pas de héros sans profil héros');
// force 0 sur la dalle mais bonus de terrain d’élément : le héros de feu sur les Terres embrasées
prof={hero:{name:'A',mi:37,el:'feu'},xp:0};run('TER=TL.indexOf("feu")');fresh();
assert.equal(run('pwc(cr.find(k=>k.hero))'),1,'héros feu sur terrain feu, dalle 0 de feu : 0 + 1 (terrain)');
run('b[11][3].el="eau";b[11][4]&&0');const k=run('cr.find(q=>q.hero)');assert.equal(run('pwc(cr.find(k=>k.hero))'),1,'dalle d’un autre élément : le héros garde le bonus de terrain de son élément');
console.log('PASS: héros — placement, dalle selon le niveau, exclusions (en ligne, 2v2, tutoriel), bonus de terrain.');
