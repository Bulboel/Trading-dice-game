const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync(require('path').join(__dirname,'../index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/g).map(s=>s.replace(/<\/?script>/g,'')).sort((a,b)=>b.length-a.length)[0].replace(/init\(\);\s*$/,'');
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function engine(seed){const timers=[],intervals=[],els=new Map(),element=()=>{const P=()=>new Proxy(function(){},{get:(t,p)=>p==='children'?[]:p==='length'?0:p===Symbol.toPrimitive?()=>0:P(),set:()=>true,apply:()=>P()});return P()},math=Object.create(Math);math.random=mulberry(seed);
 const c=vm.createContext({window:{dispatchEvent(){}},Event,document:{getElementById(id){if(!els.has(id))els.set(id,element());return els.get(id)}},fetch:()=>Promise.resolve({ok:false}),setTimeout:(fn,ms)=>{timers.push({fn,ms});return timers.length},clearTimeout(){},setInterval:fn=>{intervals.push(fn);return intervals.length},clearInterval(){},console,Date,Math:math});
 vm.runInContext(src,c);vm.runInContext("render=()=>{};landCube=()=>{};showRollDice=()=>{};ai=false;",c);
 const run=code=>vm.runInContext(code,c);
 const flush=()=>{for(let k=0;k<20&&(intervals.length||timers.length);k++){while(intervals.length){const f=intervals.shift();for(let i=0;i<14;i++)f()}timers.sort((a,b)=>a.ms-b.ms);const t=timers.splice(0);t.forEach(x=>x.fn())}};
 return{run,flush,snap:()=>run("JSON.stringify({b,cr:cr.map(c=>({o:c.o,x:c.x,y:c.y,id:c.id,lv:c.lv})),h:pl.map(p=>p.h),q:pl.map(p=>p.q.length),s:pl.map(p=>p.s),cur,kills,bonus,over})")}}
const A=engine(12345),B=engine(12345);
A.run('TER=0;init()');B.run('TER=0;init()');
assert.equal(A.snap(),B.snap(),'états initiaux identiques');
let ok=0;
for(let tour=0;tour<8;tour++){
  const who=A.run('cur'); 
  // même action sur les deux copies : poser le 1er dé de la main sur la 1re position valide
  for(const E of [A,B]){E.run("{const m=pl[cur].h[0];const p=firstValid(m,cur?0:2);if(p){die=m;hi=0;rot=cur?0:2;pc=p;mode='p';lancer()}else{hi=0;fin(true)}}");E.flush()}
  assert.equal(A.snap(),B.snap(),'divergence au tour '+tour);ok++;
}
console.log('PASS: 8 tours rejoués à l’identique sur deux moteurs séparés (',ok,'états comparés ) ; scores',A.run('pl.map(p=>p.s)'),'créatures',A.run('cr.length'),'tour',A.run('cur'));
