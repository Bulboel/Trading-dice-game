const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const animations=[],handlers={};let quiet=false;
function node(){return{children:[],dataset:{},style:{values:{},setProperty(k,v){this.values[k]=v}},attributes:{},setAttribute(k,v){this.attributes[k]=v},append(...items){items.forEach(n=>{n.parentElement=this;this.children.push(n)})},replaceChildren(){this.children.forEach(n=>n.parentElement=null);this.children=[]},animate(frames,options){const a={frames,options,cancel(){this.cancelled=true}};animations.push(a);return a}}}
const math=Object.create(Math);math.random=()=>{throw Error('The visual renderer must not draw random results')};
const c=vm.createContext({window:{HackeniaSettings:{get:()=>({rollSkin:'ivory'})},addEventListener:(type,fn)=>handlers[type]=fn},Math:math,document:{createElement:node},matchMedia:()=>({matches:quiet}),getComputedStyle:()=>({transform:'matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1)'})});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/roll-dice-v171.js'),'utf8'),c);const api=c.window.HackeniaRoll,host=node();
api.render(host,[6,5,4],true);assert.equal(host.children.length,3);
for(const wrap of host.children){const cube=wrap.children[0];assert.equal(cube.children.length,6);for(let n=1;n<=6;n++)assert.equal((cube.children[n-1].innerHTML.match(/class="roll-pip"/g)||[]).length,n);assert.equal(wrap.children[1].textContent,'')}
const preview=node();assert(api.preview(preview,'obsidian'));assert.equal(preview.children[0].children[0].children.length,6);assert.equal(preview.style.values['--roll-face'],'#1c3332');assert.equal(host.style.values['--roll-face'],'#e6dfca');assert(animations.every(a=>!a.cancelled),'Preview cannot cancel a match roll');handlers['hackenia:settings']({detail:{rollSkin:'obsidian'}});assert.equal(host.style.values['--roll-face'],'#1c3332');handlers['hackenia:settings']({detail:{rollSkin:'ivory'}});
assert.equal(animations.length,3);assert(animations[0].frames.at(-1).transform.includes('1080deg'),'Die must complete full rotations');
api.render(host,[6,5,4],true);assert.equal(animations.length,3,'Animation cannot restart on each engine tick');
api.render(host,[6,5,4],false,true);assert.equal(animations.length,3,'Result must keep the original rotation, never add a correction pivot');for(const wrap of host.children)assert.equal(wrap.children[1].textContent,'','No result before settling');animations.slice(0,3).forEach(a=>a.onfinish());
assert.deepEqual(host.children.map(w=>w.children[1].textContent),['6','5','4']);assert.equal(host.children[0].attributes['aria-label'],'Dé 1 : 6');
// The final orientation brings the chosen physical plane to the front for every result.
quiet=true;const normals={1:[0,0,1],2:[0,-1,0],3:[1,0,0],4:[-1,0,0],5:[0,1,0],6:[0,0,-1]};
for(let n=1;n<=6;n++){api.render(host,[n],false);const cube=host.children[0].children[0],angles=[...cube.style.transform.matchAll(/rotate[XY]\((-?\d+)deg\)/g)].map(m=>+m[1]);const x=angles[2]*Math.PI/180,y=angles[3]*Math.PI/180,[a,b,d]=normals[n],afterY=[a*Math.cos(y)+d*Math.sin(y),b,-a*Math.sin(y)+d*Math.cos(y)],z=afterY[1]*Math.sin(x)+afterY[2]*Math.cos(x);assert(Math.abs(z-1)<1e-8,'Wrong face shown for '+n);assert.equal(host.children[0].children[1].textContent,String(n))}
// Each animated endpoint must already face the correct result, before normalization.
quiet=false;
for(let n=1;n<=6;n++){
 const before=animations.length;api.render(host,[n],true);const rotation=animations.at(-1);assert.equal(animations.length,before+1);
 const angles=[...rotation.frames.at(-1).transform.matchAll(/rotate[XY]\((-?\d+)deg\)/g)].map(m=>+m[1]),x=angles[2]*Math.PI/180,y=angles[3]*Math.PI/180,[a,b,d]=normals[n];
 const yy=b,zz=-a*Math.sin(y)+d*Math.cos(y);assert(Math.abs(yy*Math.sin(x)+zz*Math.cos(x)-1)<1e-8,'Spin ends on the wrong face '+n);
 api.render(host,[n],false);assert.equal(animations.length,before+1,'An extra result pivot was created');assert.equal(host.children[0].children[1].textContent,'');rotation.onfinish();assert.equal(host.children[0].children[1].textContent,String(n));
}
// A background tab may finish its visual animation before the engine timer fires.
api.render(host,[3],true);animations.at(-1).onfinish();assert.equal(host.children[0].children[1].textContent,'');api.render(host,[3],false);assert.equal(host.children[0].children[1].textContent,'3');
assert(api.setSkin('obsidian'));assert.equal(host.style.values['--roll-face'],'#1c3332');assert.equal(api.setSkin('missing'),false);assert.equal(api.registerSkin('invalid',{}),false);assert(api.registerSkin('custom',{face:'#112233',light:'#aabbcc',shade:'#001122',edge:'#ccbbaa',ink:'#ffffff'}));assert(api.setSkin('custom'));assert.equal(host.style.values['--roll-face'],'#112233');
quiet=false;api.render(host,[2,2],true);const latest=animations.slice(-2);api.reset();assert(latest.every(a=>a.cancelled));
console.log('PASS: 1–3 six-face dice, pip counts, single continuous result-directed rotations without extra RNG or a fixed-six stop, settled result/physical face agreement for all six values, reduced motion, skin registry and cancellation.');
