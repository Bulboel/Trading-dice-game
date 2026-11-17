// v350 — Ver géant (Histoire, chapitre II, partie 7) : boss immobile de 2 × 4 cases, 25 PV, dégâts = attaque de la créature,
// la créature est engloutie sans compter comme ennemi vaincu ; à zéro, le ver disparaît et compte comme un duel gagné.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,'');
const els=new Map(),el=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},setPointerCapture(){}});
const c=vm.createContext({window:{dispatchEvent(){}},Event,document:{getElementById(i){if(!els.has(i))els.set(i,el());return els.get(i)}},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Date,Math,console});vm.runInContext(src,c);
const run=s=>vm.runInContext(s,c);
assert.ok(src.includes("boss=storyFoe?.boss==='ver'?{x:Math.floor(W/2)-1,y:Z,w:2,h:3,hp:25,max:25}:null"),'init : ver géant créé au centre pour un duel d’Histoire avec boss');
run(`boss={x:Math.floor(W/2)-1,y:Z,w:2,h:3,hp:25,max:25};b=[...Array(H)].map(()=>Array(W).fill(null));finishTurn=()=>{};`);
const B=run('boss');assert.ok(B&&B.hp===25&&B.w===2&&B.h===3,'ver géant présent dès le début : 6 cases (2 × 3), 25 PV');
assert.ok(run(`blocked(${B.x},${B.y})&&blocked(${B.x+1},${B.y+2})&&!blocked(${B.x},${B.y+3})&&!blocked(${B.x-1},${B.y})`),'ses cases sont bloquées (ni dalle, ni passage)');
const story=fs.readFileSync(path.join(__dirname,'../assets/story-data-v193.js'),'utf8');assert.ok(story.includes('"id":"c2p7"')&&story.includes('"boss":"ver"'),'partie 7 du chapitre II avec le ver géant');
assert.ok(fs.readFileSync(path.join(__dirname,'../assets/story-v193.js'),'utf8').includes('boss:d.boss'),'le boss est transmis au duel');
// une créature du joueur posée au contact du ver, sur une dalle de valeur connue
const X=B.x-1,Y=B.y+1;run(`cur=0;mode='i';moved=0;placedThisTurn=0;b[${Y}][${X}]={o:0,v:5};cr=[{id:1,o:0,x:${X},y:${Y},mi:0,mn:'Test',em:'',born:-1,lv:1}];kills=[0,0];`);
const atk=run(`pwc(cr[0],${X},${Y})`);
run(`mv(cr[0],${B.x},${B.y})`);
assert.equal(run('boss.hp'),25-atk,'le ver perd la valeur d’attaque de la créature');assert.equal(run('cr.length'),0,'la créature est engloutie');assert.deepEqual(run('kills.slice()'),[0,0],'aucun ennemi vaincu compté pour l’adversaire');
run(`boss.hp=2;moved=0;cr=[{id:2,o:0,x:${X},y:${Y},mi:0,mn:'Test',em:'',born:-1,lv:1}];`);run(`mv(cr[0],${B.x},${B.y+2})`);
assert.equal(run('boss'),null,'à zéro, le ver disparaît');assert.equal(run('over'),1,'achever le ver fait gagner la partie');assert.equal(run('matchResult.winner'),0,'victoire du camp qui l’a achevé');assert.ok(!run(`blocked(${B.x},${B.y})`),'ses cases redeviennent libres');
// v352 — le geste du joueur : créature sélectionnée, toucher le ver prépare l’attaque, confirmer la lance
run(`render=()=>{};boss={x:Math.floor(W/2)-1,y:Z,w:2,h:3,hp:25,max:25};ai=true;ONLINE=null;cur=0;mode='i';moved=0;over=0;placedThisTurn=0;kills=[0,0];b=[...Array(H)].map(()=>Array(W).fill(null));`);
{const bb=run('boss'),X2=bb.x,Y2=bb.y+bb.h;run(`b[${Y2}][${X2}]={o:0,v:4};b[${Y2+1}][${X2}]={o:0,v:3};cr=[{id:3,o:0,x:${X2},y:${Y2+1},mi:0,mn:'Test',em:'',born:-1,lv:1}];sel=cr[0];movePlan=null;`);
 assert.ok(run('humanTurn()'),'tour du joueur');run(`tap(${bb.x+1},${bb.y+1})`);const plan=run('movePlan');assert.ok(plan&&plan.boss,'toucher le ver prépare une attaque');assert.deepEqual([plan.previewX,plan.previewY],[X2,Y2],'la créature ira au contact, juste devant le ver');
 const dmg=run(`pwc(cr[0],${X2},${Y2})`);run('confirmMove()');assert.equal(run('boss.hp'),25-dmg,'confirmer lance l’attaque');assert.equal(run('cr.length'),0)}
// v354 — au contact, la créature frappe d’elle-même : en apparaissant à côté du ver, ou en s’arrêtant à côté de lui
run(`boss={x:Math.floor(W/2)-1,y:Z,w:2,h:3,hp:25,max:25};kills=[0,0];b=[...Array(H)].map(()=>Array(W).fill(null));`);
{const bb=run('boss'),X3=bb.x-1,Y3=bb.y+1;run(`b[${Y3}][${X3}]={o:0,v:4};cr=[{id:4,o:0,x:${X3},y:${Y3},mi:0,mn:'Test',em:'',born:-1,lv:1}];`);const d1=run(`pwc(cr[0],${X3},${Y3})`);run('resolve(cr[0])');
 assert.equal(run('boss.hp'),25-d1,'apparaître au contact du ver le frappe aussitôt');assert.equal(run('cr.length'),0);
 run(`b[${Y3+1}][${X3}]={o:0,v:2};b[${Y3+2}][${X3}]={o:0,v:2};cr=[{id:5,o:0,x:${X3},y:${Y3+2},mi:0,mn:'Test',em:'',born:-1,lv:1}];moved=0;placedThisTurn=0;`);const hp0=run('boss.hp');run(`mv(cr[0],${X3},${Y3+1})`);
 assert.ok(run('boss.hp')<hp0&&run('cr.length')===0,'s’arrêter au contact du ver le frappe aussitôt');
 run(`cr=[{id:6,o:1,x:${X3},y:${Y3},mi:0,mn:'Larve',em:'',born:-1,lv:1}];`);const hp1=run('boss.hp');run('resolve(cr[0])');assert.equal(run('boss.hp'),hp1,'les alliés du ver ne le frappent pas');assert.equal(run('cr.length'),1)}
console.log('PASS: ver géant 2 × 3 bloquant, 25 PV, dégâts = attaque, créature engloutie sans point pour l’adversaire, victoire immédiate à zéro, partie 7 du chapitre II.');
