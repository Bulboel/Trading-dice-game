// v328 — Panthéon : pouvoirs en duel (éternuement de Bosco, grand tacticien de Soryan), données des dix épreuves, duels d'Histoire thématiques.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,'');
function setup(){const els=new Map(),element=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},setPointerCapture(){}});const ctx=vm.createContext({window:{dispatchEvent(){}},document:{getElementById(id){if(!els.has(id))els.set(id,element());return els.get(id)}},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Date,Math,console,Event});vm.runInContext(source,ctx);
 vm.runInContext(`render=()=>{};b=Array.from({length:H},()=>Array(W).fill(null));TER=0;ai=true;over=0;mode='i';moved=0;movePlan=null;sel=null;cur=0;pl=[{s:0,h:[],q:[]},{s:0,h:[],q:[]}];bonus=[0,0];kills=[0,0];cr=[];gamePaused=false;
 tile=(x,y,o,v,tag)=>{b[y][x]={o,v,el:'',id:tag??900+o,lv:1}};unit=(id,o,x,y)=>{cr.push({id,o,mi:0,x,y,lv:1,em:o?'ia':'humain'})};`,ctx);return code=>vm.runInContext(code,ctx)}
{// Éternuement : rien sous 4 créatures, puis une seule fois, chaque créature garde sa dalle, mêmes cases occupées.
 const run=setup();run(`storyFoe={name:'Bosco',dice:[],power:'sneeze',used:0};tile(1,3,0,1,1);unit(1,0,1,3);tile(6,3,1,1,2);unit(2,1,6,3);tile(1,8,0,1,3);unit(3,0,1,8);foePower()`);
 assert.equal(run('storyFoe.used'),0,'no sneeze with 3 creatures');
 run(`tile(6,8,1,1,4);unit(4,1,6,8);foePower()`);
 assert.equal(run('storyFoe.used'),1,'sneeze with 4 creatures');assert.equal(run('gamePaused'),true,'the match waits for the illustration');
 const pos=JSON.parse(run('JSON.stringify(cr.map(c=>[c.id,c.x,c.y,b[c.y][c.x]?.id]))'));
 assert.ok(pos.some(([id,x,y])=>!(({1:[1,3],2:[6,3],3:[1,8],4:[6,8]})[id][0]===x&&({1:[1,3],2:[6,3],3:[1,8],4:[6,8]})[id][1]===y)),'creatures moved');
 for(const [id,,,t] of pos)assert.equal(t,id,'each creature carries its own tile');
 assert.deepEqual(pos.map(p=>p[1]+','+p[2]).sort(),['1,3','1,8','6,3','6,8'],'same squares, shuffled');
 run('gamePaused=false;cr.push({id:9,o:0,mi:0,x:3,y:5,lv:1});foePower()');assert.equal(run('gamePaused'),false,'only once per duel')}
{// Grand tacticien : pas avant la fin du 2e tour de Soryan, puis une créature de Soryan vient battre une créature voisine.
 const run=setup();run(`storyFoe={name:'Soryan',dice:[],power:'tactic',used:0};tile(1,2,1,6);unit(1,1,1,2);tile(5,5,0,1);unit(2,0,5,5);turnNumber=3;foePower()`);
 assert.equal(run('storyFoe.used'),0,'not before his 2nd turn');
 run('turnNumber=5;foePower()');assert.equal(run('storyFoe.used'),1,'tactic used');assert.equal(run('kills[1]'),1,'the moved creature wins a fight');
 assert.equal(run('cr.length'),1);assert.equal(run('Math.abs(cr[0].x-5)+Math.abs(cr[0].y-5)'),1,'it moved next to its prey');
 assert.equal(run('b[2][1]'),null,'its tile came with it')}
{// Jamais sans proie sûre, et jamais près de l'arrivée.
 const run=setup();run(`storyFoe={name:'Soryan',dice:[],power:'tactic',used:0};tile(1,2,1,1);unit(1,1,1,2);tile(5,5,0,6);unit(2,0,5,5);turnNumber=5;foePower()`);
 assert.equal(run('storyFoe.used'),0,'no move into a losing fight');
 run(`cr=[];b=Array.from({length:H},()=>Array(W).fill(null));tile(1,2,1,6);unit(1,1,1,2);tile(4,10,0,1);unit(2,0,4,10);foePower()`);
 assert.ok(run('cr.every(c=>c.o!==1||c.y<10)'),'never within 2 rows of the arrival zone')}
{// Données : dix adversaires dans l'ordre de la Triade, illustrations présentes, dés valides.
 const ctx={window:{hackeniaGame:{monsters:Array.from({length:180},(_,i)=>({cn:'d'+i,lv:i%7}))},addEventListener(){}},document:{},structuredClone};ctx.window.window=ctx.window;vm.createContext(ctx);
 vm.runInContext(fs.readFileSync(path.join(root,'assets/pantheon-v328.js'),'utf8'),ctx);const F=ctx.window.HackeniaPantheon.foes;
 assert.deepEqual(F.map(f=>f.id),['georges','velcan','pachie','orven','maebril','bosco','velmarys','soryan','hilam','caleizis']);
 for(const f of F){for(const [img] of [...f.meet,...f.win])assert.ok(fs.existsSync(path.join(root,'assets/pantheon',img+'.webp')),img);assert.ok(f.dice.every(i=>Number.isInteger(i)&&i>=0&&i<180));assert.ok(['moyen','difficile','divin'].includes(f.level))}
 assert.ok(fs.existsSync(path.join(root,'assets/pantheon/bosco-eternuement.webp'))&&fs.existsSync(path.join(root,'assets/pantheon/velmarys-cadeau.webp')));
 assert.equal(F.find(f=>f.id==='bosco').power,'sneeze');assert.equal(F.find(f=>f.id==='soryan').power,'tactic');assert.equal(F.find(f=>f.id==='velmarys').power,'gift')}
{// Histoire : l'araignée géante a des araignées noires (97 à 103), jamais de blanches (104, 105, 169, 170).
 const w={};vm.runInContext(fs.readFileSync(path.join(root,'assets/story-data-v193.js'),'utf8'),vm.createContext({window:w}));
 const spider=w.HACKENIA_STORY.find(p=>p.duel?.foe==='L’araignée géante').duel.dice;assert.ok(spider.length>=5&&spider.every(i=>i>=97&&i<=103),'black spiders only');
 for(const p of w.HACKENIA_STORY)if(p.duel)assert.ok(!p.duel.dice.some(i=>[104,105,169,170].includes(i)),'white spiders are kind: never an opponent');}
console.log('PASS: Pantheon powers (sneeze once at 4 creatures, tactic after 2nd turn), ten trials, black spiders in the mine.');
