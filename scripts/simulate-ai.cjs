// v243 — Simulation IA contre IA sur le vrai moteur (index.html), pour auditer les règles.
// Usage : node scripts/simulate-ai.cjs [parties par terrain=60] [terre|feu|glace|vent|eau|foudre|all] [on|off : règle d'écrasement]
// Affiche par terrain : gagnant (J1 = premier joueur), type de victoire, durée en tours, écrasements par partie, tours sans pose possible.
const fs=require('fs'),vm=require('vm'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,'');
const [,,N='60',TERRAIN='all',CRUSH='on']=process.argv;
function game(seedN,terr){let s=seedN*2654435761>>>0;const math=Object.create(Math);math.random=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296};
 const timers=[],intervals=[],els=new Map(),el=()=>{const base={children:[],style:{setProperty(){}},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},firstElementChild:{style:{}},value:'',textContent:'',innerHTML:'',className:'',getBoundingClientRect:()=>({width:0,height:0,left:0,top:0,right:0,bottom:0})};return new Proxy(base,{get(t,k){if(k in t)return t[k];if(typeof k==='symbol')return undefined;if(/^(query|closest)/.test(k))return ()=>null;if(/^querySelectorAll/.test(k))return ()=>[];return function(){return undefined}},set(t,k,v){t[k]=v;return true}})};
 const ctx=vm.createContext({window:{dispatchEvent(){},addEventListener(){}},Event:class{},CustomEvent:class{constructor(t,o){this.type=t;this.detail=o?.detail}},document:{getElementById(i){if(!els.has(i))els.set(i,el());return els.get(i)},querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>el(),body:el(),documentElement:el()},localStorage:{getItem:()=>null,setItem(){}},fetch:()=>Promise.resolve({ok:false}),setTimeout:(f,ms)=>{timers.push({f,ms});return timers.length},clearTimeout(){},setInterval:f=>{intervals.push(f);return intervals.length},clearInterval(){},console:{log(){},warn(){},error(){}},Date,Math:math});
 vm.runInContext(src,ctx);const run=c=>vm.runInContext(c,ctx);
 run(`render=()=>{};landCube=()=>{};showRollDice=()=>{};drawHistory=()=>{};ai=true;aiLevel='difficile';rewardMode='quick';`);
 run(`TER=TL.indexOf('${terr}');init();render=()=>{};`);timers.length=0;intervals.length=0;
 if(CRUSH==='off')run(`crushes=()=>false`);
 let turns=0,stalled=0;
 while(turns<160){if(run('over'))break;const o=run('cur');
  run(`(()=>{const m=aiChooseMove(cur);if(m)mv(m[0],m[1],m[2])})()`);if(run('over'))break;
  const bb=run(`JSON.stringify(aiChoosePlacement(cur))`);
  if(bb==='null'){run('hi=0;fin(true)');stalled++}else{const [i,x,y,r]=JSON.parse(bb);intervals.length=0;run(`hi=${i};die=pl[cur].h[hi];rot=${r};pc={x:${x},y:${y}};mode='p';useB=bonus[cur];lancer()`);
   if(intervals.length){for(let k=0;k<14;k++)intervals[intervals.length-1]();}let guard=0;while(timers.length&&guard++<200){timers.sort((a,b)=>a.ms-b.ms);timers.shift().f()}
   if(run('cur')===o&&!run('over')){run('fin(true)')}}
  turns++}
 return Object.assign(JSON.parse(run(`JSON.stringify({over,pass:pl.map(p=>p.s),kills,crush:gameEvents.filter(e=>e.type==='Écrasement').length,draw:gameEvents.some(e=>e.type==='Égalité')})`)),{turns,stalled})}
const terrains=TERRAIN==='all'?['terre','feu','glace','vent','eau','foudre']:[TERRAIN];const res=[];
for(const t of terrains)for(let i=0;i<+N;i++){try{const r=game(i+1,t);r.terrain=t;res.push(r)}catch(e){res.push({terrain:t,error:e.stack.split("\n").slice(0,3).join(" | ").slice(0,300)})}}

const ok=res.filter(r=>!r.error),err=res.filter(r=>r.error);
const winner=r=>r.draw?'nul':r.pass[0]>=2||(r.kills[0]>=4&&r.kills[1]<4)?'J1':r.pass[1]>=2||(r.kills[1]>=4&&r.kills[0]<4)?'J2':'—';
const how=r=>!r.over?'bloquée':r.draw?'nul':Math.max(...r.pass)>=2?'passages':'duels';
const cnt=(arr,f)=>arr.reduce((m,r)=>(m[f(r)]=(m[f(r)]||0)+1,m),{});
console.log('Parties',res.length,'erreurs',err.length,err[0]?.error||'');
for(const t of terrains){const a=ok.filter(r=>r.terrain===t);if(!a.length)continue;const tt=a.map(r=>r.turns).sort((x,y)=>x-y);
 console.log(t.padEnd(7),'gagnant',JSON.stringify(cnt(a,winner)),'| type',JSON.stringify(cnt(a,how)),'| tours méd',tt[tt.length>>1],'max',tt[tt.length-1],'| écrasements/partie',(a.reduce((s,r)=>s+r.crush,0)/a.length).toFixed(2),'| sans pose',(a.reduce((s,r)=>s+r.stalled,0)/a.length).toFixed(1))}
