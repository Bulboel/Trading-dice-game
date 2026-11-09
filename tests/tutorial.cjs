const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),source=html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,'');
const els=new Map(),element=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){},contains:()=>false},firstElementChild:{style:{}},setPointerCapture(){},append(){},insertBefore(){},addEventListener(){},remove(){},children:[],dataset:{}});
const win={addEventListener(){},matchMedia:()=>({matches:false,addEventListener(){}}),dispatchEvent(){}};
const ctx=vm.createContext({window:win,document:{getElementById(id){if(!els.has(id))els.set(id,element());return els.get(id)},createElement:()=>element(),body:element(),querySelector:()=>null,querySelectorAll:()=>[]},location:{hash:''},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},requestAnimationFrame:()=>0,cancelAnimationFrame(){},Date,Math,console,Event:class{constructor(t){this.type=t}}});
vm.runInContext(source,ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/tutorial-v178.js'),'utf8'),ctx);
const T=ctx.window.HackeniaTutorial;assert.ok(T,'Tutorial API is exposed');assert.equal(T.steps,16);assert.equal(T.nextRoll(2),null,'No forced roll outside the tutorial');
// Le tutoriel est branché au moteur : lancers forcés, cibles transmises au plateau, entrée depuis le menu.
assert.ok(html.includes('const forced=window.HackeniaTutorial?.nextRoll?.(n);if(forced)return forced;'));
assert.ok(html.includes('tutorial:window.HackeniaTutorial?.targets?.()||null'));
const portal=fs.readFileSync(path.join(__dirname,'../assets/portal-v159.js'),'utf8');assert.ok(portal.includes("window.HackeniaTutorial?.start()"),'Start menu launches the tutorial');assert.ok(portal.includes('data-action="tutorial"'),'Options and onboarding offer the tutorial');
const src=fs.readFileSync(path.join(__dirname,'../assets/tutorial-v178.js'),'utf8');
for(const topic of ['Poser un dé','lancer raté','paire magique','Déplacer','bonus élémentaires','Combat au contact','Combat perdu','Égalité','Attaque directe','ripostes','camp adverse','dés élémentaires','déroulement'])assert.ok(src.includes(topic),'Covers: '+topic);
assert.ok(src.includes("TER=TL.indexOf('terre')"),'Plays on the earth terrain');
console.log('PASS: 16-step tutorial on the earth terrain, forced rolls only while active, board targets and entry points wired, every core situation covered.');
