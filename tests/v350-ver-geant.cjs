// v350 — Ver géant (Histoire, chapitre II, partie 7) : boss immobile de 2 × 4 cases, 25 PV, dégâts = attaque de la créature,
// la créature est engloutie sans compter comme ennemi vaincu ; à zéro, le ver disparaît et compte comme un duel gagné.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,'');
const els=new Map(),el=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},setPointerCapture(){}});
const c=vm.createContext({window:{dispatchEvent(){}},Event,document:{getElementById(i){if(!els.has(i))els.set(i,el());return els.get(i)}},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Date,Math,console});vm.runInContext(src,c);
const run=s=>vm.runInContext(s,c);
assert.ok(src.includes("boss=storyFoe?.boss==='ver'?{x:Math.floor(W/2)-1,y:Math.floor(H/2)-2,w:2,h:4,hp:25,max:25}:null"),'init : ver géant créé au centre pour un duel d’Histoire avec boss');
run(`boss={x:Math.floor(W/2)-1,y:Math.floor(H/2)-2,w:2,h:4,hp:25,max:25};b=[...Array(H)].map(()=>Array(W).fill(null));finishTurn=()=>{};`);
const B=run('boss');assert.ok(B&&B.hp===25&&B.w===2&&B.h===4,'ver géant présent dès le début : 2 × 4 cases, 25 PV');
assert.ok(run(`blocked(${B.x},${B.y})&&blocked(${B.x+1},${B.y+3})&&!blocked(${B.x-1},${B.y})`),'ses cases sont bloquées (ni dalle, ni passage)');
const story=fs.readFileSync(path.join(__dirname,'../assets/story-data-v193.js'),'utf8');assert.ok(story.includes('"id":"c2p7"')&&story.includes('"boss":"ver"'),'partie 7 du chapitre II avec le ver géant');
assert.ok(fs.readFileSync(path.join(__dirname,'../assets/story-v193.js'),'utf8').includes('boss:d.boss'),'le boss est transmis au duel');
// une créature du joueur posée au contact du ver, sur une dalle de valeur connue
const X=B.x-1,Y=B.y+1;run(`cur=0;mode='i';moved=0;placedThisTurn=0;b[${Y}][${X}]={o:0,v:5};cr=[{id:1,o:0,x:${X},y:${Y},mi:0,mn:'Test',em:'',born:-1,lv:1}];kills=[0,0];`);
const atk=run(`pwc(cr[0],${X},${Y})`);
run(`mv(cr[0],${B.x},${B.y})`);
assert.equal(run('boss.hp'),25-atk,'le ver perd la valeur d’attaque de la créature');assert.equal(run('cr.length'),0,'la créature est engloutie');assert.deepEqual(run('kills.slice()'),[0,0],'aucun ennemi vaincu compté pour l’adversaire');
run(`boss.hp=2;moved=0;cr=[{id:2,o:0,x:${X},y:${Y},mi:0,mn:'Test',em:'',born:-1,lv:1}];`);run(`mv(cr[0],${B.x},${B.y+2})`);
assert.equal(run('boss'),null,'à zéro, le ver disparaît');assert.deepEqual(run('kills.slice()'),[1,0],'achever le ver compte comme un duel gagné');assert.ok(!run(`blocked(${B.x},${B.y})`),'ses cases redeviennent libres');
console.log('PASS: ver géant 2 × 4 bloquant, 25 PV, dégâts = attaque, créature engloutie sans point pour l’adversaire, duel gagné à zéro, partie 7 du chapitre II.');
