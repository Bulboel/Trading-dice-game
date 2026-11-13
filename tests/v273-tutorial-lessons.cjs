// v273 — Tutoriel en 4 leçons (+1 facultative) : chaque leçon est une mini-partie jouable de bout en bout.
// Un « joueur automatique » exécute chaque étape sur le vrai moteur (même plateau, mêmes lancers forcés) et on vérifie que l'étape se valide,
// que les mauvais choix déclenchent « Recommencer », que la leçon se termine par une carte de victoire et que la progression est enregistrée.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),tuto=fs.readFileSync(path.join(root,'assets/tutorial-v178.js'),'utf8');
const src=html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,'');
const timers=[],intervals=[],store={},clock={t:1e9};class FakeDate extends Date{static now(){return clock.t}}
const P=()=>new Proxy(function(){},{get:(t,p)=>p==='children'?[]:p==='length'?0:p===Symbol.toPrimitive?()=>0:p==='dataset'?{}:p==='classList'?{add(){},remove(){},toggle(){},contains:()=>false}:P(),set:()=>true,apply:()=>P()});
const els=new Map();
const ctx=vm.createContext({window:{dispatchEvent(){},matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener(){}},Event,
 document:{getElementById(i){if(!els.has(i))els.set(i,P());return els.get(i)},createElement:()=>P(),body:{classList:{add(){},remove(){},toggle(){},contains:()=>false},dataset:{},append(){}},querySelector:()=>null,querySelectorAll:()=>[]},
 localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v)}},location:{hash:''},fetch:()=>Promise.resolve({ok:false}),
 setTimeout:(fn,ms)=>{timers.push({fn,ms});return timers.length},clearTimeout(){},setInterval:fn=>{intervals.push(fn);return intervals.length},clearInterval(){},requestAnimationFrame:()=>0,cancelAnimationFrame(){},Date:FakeDate,Math,console});
vm.runInContext(src,ctx);vm.runInContext("render=()=>{};landCube=()=>{};showRollDice=()=>{};",ctx);vm.runInContext(tuto,ctx);
const run=c=>vm.runInContext(c,ctx),T=ctx.window.HackeniaTutorial,X=T._test;
const flush=()=>{for(let k=0;k<30;k++){clock.t+=3000;if(!timers.length&&!intervals.length)break;for(const f of intervals.slice())for(let i=0;i<14;i++)f();intervals.length=0;timers.sort((a,b)=>a.ms-b.ms);for(const t of timers.splice(0))t.fn()}clock.t+=5000};
assert.equal(T.lessons.length,5);assert.deepEqual(T.lessons.map(l=>l.id),['place','cross','fight','affinity','more']);assert.ok(T.lessons[4].optional&&!T.lessons.slice(0,4).some(l=>l.optional));
assert.equal(T.steps,T.lessons.reduce((n,l)=>n+l.steps,0));
// Lancers forcés : uniquement pendant une leçon
assert.equal(T.nextRoll(2),null);
const L=X.LESSONS;
const act={ // coups du joueur automatique, par leçon et par étape
 place:[null,null,()=>place('kala'),()=>place('bosco')],
 cross:[()=>move(0,3,6),()=>place('grimgors'),()=>move(0,3,0)],
 fight:[()=>move(0,3,7),'demo',()=>move(0,3,6)],
 affinity:[()=>move(0,4,6),()=>move(0,2,6)],
 more:['demo',()=>place('bosco',true),()=>placeElemental()]};
function move(i,x,y){run(`(()=>{cur=0;mv(cr.filter(c=>c.o===0)[${i}],${x},${y});render()})()`);flush()}
function place(name,withBonus){const m=run(`({kala:37,grimgors:38,bosco:29})['${name}']`);const at=X.LESSONS&&null;
 const p=run(`(()=>{const m=${m};const t=window.HackeniaTutorial.targets();return t&&t[0]})()`);assert.ok(p,'une case cible est proposée pour poser '+name);
 run(`(()=>{die=${m};hi=0;rot=2;pc={x:${p[0]},y:${p[1]}};mode='p';${withBonus?'useB=1;':''}lancer()})()`);flush()}
function placeElemental(){const p=run(`window.HackeniaTutorial.targets()[0]`);run(`(()=>{die=51;hi=0;rot=2;pc={x:${p[0]},y:${p[1]}};mode='p';lancer()})()`);flush()}
let stepsRun=0;
L.forEach((lesson,li)=>{X.begin(li);const last=lesson.steps.length-1;
 assert.equal(lesson.steps[last].lessonEnd,true,lesson.title+' : se termine par une carte de victoire');
 assert.ok(lesson.goal&&lesson.goal.length>10,lesson.title+' : un but clair');
 lesson.steps.forEach((s,si)=>{if(si>0)X.go(si);assert.equal(X.T.i,si);const t=s.text();assert.ok(t.length<760,`${lesson.title} / ${s.title} : texte court (${t.length} caractères)`);
  if(s.kind==='info'||s.kind==='final'){assert.ok(!s.check);stepsRun++;return}
  const a=act[lesson.id][si];if(a==='demo')X.runDemo();else a();flush();X.tick();assert.ok(X.T.done,`${lesson.title} / ${s.title} : étape réussie par le joueur automatique`);
  assert.ok(s.success&&s.success().length>20,'message de réussite');stepsRun++});
 X.go(last);assert.ok(X.progress().includes(lesson.id),lesson.title+' : progression enregistrée');
});
// Mauvais choix des leçons 4 : la bonne case est à choisir, l'autre déclenche « Recommencer »
X.begin(3);X.go(0);move(0,2,6);X.tick();assert.ok(!X.T.done&&X.T.retry,'affinités 1 : la dalle de vent donne une égalité → recommencer');
X.go(0);move(0,4,6);X.tick();assert.ok(X.T.done,'affinités 1 : la dalle de terre gagne');
X.go(1);move(0,4,6);X.tick();assert.ok(!X.T.done&&X.T.retry,'affinités 2 : sans le voisin de vent, égalité → recommencer');
X.go(1);move(0,2,6);X.tick();assert.ok(X.T.done,'affinités 2 : la dalle voisine du vent gagne');
// Enchaîner : « Leçon suivante » depuis la carte de fin d'une leçon encore active (régression : l'étape courante doit repartir de 0)
L.forEach((l,k)=>{X.begin(k);X.go(l.steps.length-1);if(k+1<L.length){X.begin(k+1);assert.equal(X.T.i,0,'leçon '+(k+2)+' repart de la première étape');assert.equal(X.T.l,k+1)}});
// Menu des leçons et vues
assert.ok(/data-tuto="lesson"/.test(tuto)&&tuto.includes('Apprendre à jouer')&&tuto.includes('Leçon suivante')&&tuto.includes('Menu des leçons')&&tuto.includes('Rejouer la leçon'),'menu des leçons et boutons de fin de leçon');
assert.ok(tuto.includes("TER=TL.indexOf('terre')"),'toujours sur le terrain de terre');
console.log('PASS: 5 leçons, '+stepsRun+' étapes jouées par un joueur automatique (placer, traverser, combattre, affinités, bonus), mauvais choix détectés, progression enregistrée.');
