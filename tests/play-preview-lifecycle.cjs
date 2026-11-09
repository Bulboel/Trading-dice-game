const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'../assets/clearing-v105.js'),'utf8');
let previewTerrain=null,previewMode=false,syncs=0,queued=0,restores=0;
const home={insertBefore(node){restores++;node.parentElement=home}},container={appendChild(node){node.parentElement=this}},host={parentElement:home,setAttribute(){},removeAttribute(){}};
const c=vm.createContext({host,homeParent:home,homeNextSibling:null,game:{snapshot:()=>({terrain:'terre'})},setActive(){},sync(){syncs++;queued++},resize(){},state:null,previewMode,previewTerrain});
vm.runInContext(src.slice(src.indexOf('function preview(terrain,container)'),src.indexOf('function cellScreen(')),c);
c.preview('terre',container);for(let i=0;queued&&i<30;i++){queued--;c.preview('terre',container)}
assert.equal(syncs,1,'DOM changes inside the terrain preview must not trigger an endless preview loop');assert.equal(queued,0);assert.equal(host.parentElement,container);
c.preview('feu',container);assert.equal(syncs,2,'Changing terrain still refreshes the scene');
c.clearPreview();assert.equal(host.parentElement,home);assert.equal(restores,1);c.clearPreview();assert.equal(restores,1,'Leaving unrelated menus must be harmless');
c.preview('terre',container);assert.equal(syncs,4,'Deck → Play → Menu → Play remains usable');
const replacement={appendChild(node){node.parentElement=this}};c.preview('terre',replacement);assert.equal(syncs,5,'Reopening Play with a newly rendered container must attach the board again');
console.log('PASS: no self-triggering preview loop, terrain switching, menu restoration and repeated deck/play navigation.');
