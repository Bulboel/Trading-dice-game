const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),source=html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,'');
const els=new Map(),element=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){},contains:()=>false},firstElementChild:{style:{}},setPointerCapture(){},append(){},insertBefore(){},addEventListener(){},remove(){},children:[],dataset:{}});
const win={addEventListener(){},matchMedia:()=>({matches:false,addEventListener(){}}),dispatchEvent(){}};
const ctx=vm.createContext({window:win,document:{getElementById(id){if(!els.has(id))els.set(id,element());return els.get(id)},createElement:()=>element(),body:element(),querySelector:()=>null,querySelectorAll:()=>[]},location:{hash:''},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},requestAnimationFrame:()=>0,cancelAnimationFrame(){},Date,Math,console,Event:class{constructor(t){this.type=t}}});
vm.runInContext(source,ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/tutorial-v178.js'),'utf8'),ctx);
const T=ctx.window.HackeniaTutorial;assert.ok(T,'Tutorial API is exposed');assert.equal(T.lessons.length,5);assert.equal(T.steps,20);assert.equal(T.nextRoll(2),null,'No forced roll outside the tutorial');
// Le tutoriel est branché au moteur : lancers forcés, cibles transmises au plateau, entrée depuis le menu.
assert.ok(html.includes('const forced=window.HackeniaTutorial?.nextRoll?.(n);if(forced)return forced;'));
assert.ok(html.includes('tutorial:window.HackeniaTutorial?.targets?.()||null'));
const portal=fs.readFileSync(path.join(__dirname,'../assets/portal-v159.js'),'utf8');assert.ok(portal.includes("window.HackeniaTutorial?.start()"),'Start menu launches the tutorial');assert.ok(portal.includes('data-action="tutorial"'),'Options and onboarding offer the tutorial');
const src=fs.readFileSync(path.join(__dirname,'../assets/tutorial-v178.js'),'utf8');
for(const topic of ['Pose ton premier dé','Quand le lancer rate','paire magique','Avance sur ta route','Prolonge ta route','Entre dans le camp adverse','Ton premier duel','Quand on perd','bonus de terrain','bonus de voisin','ripostes','dés élémentaires','Un tour, en bref'])assert.ok(src.includes(topic),'Covers: '+topic);
assert.ok(src.includes("TER=TL.indexOf(LESSONS[l].terrain||'ville')"),'Plays on the neutral city terrain (earth only for affinities)');
console.log('PASS: 5-lesson tutorial (20 steps) on the neutral terrain, forced rolls only while active, board targets and entry points wired, every core situation covered.');
