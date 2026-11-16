// v337 — Carte d'Hackénia du mode Histoire : chaque partie a sa place, à l'intérieur de la carte, sans chevauchement.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');const root=path.join(__dirname,'..');
const w={};vm.runInContext(fs.readFileSync(path.join(root,'assets/story-data-v193.js'),'utf8'),vm.createContext({window:w}));
const win={};vm.runInContext(fs.readFileSync(path.join(root,'assets/story-map-v337.js'),'utf8'),vm.createContext({window:win,matchMedia:()=>({matches:false})}));
const POS=win.HackeniaStoryMap.positions;
for(const p of w.HACKENIA_STORY){const q=POS[p.id];assert.ok(q,p.id+' placé sur la carte');assert.ok(q[0]>5&&q[0]<95&&q[1]>5&&q[1]<95,p.id+' dans la carte')}
const ids=Object.keys(POS);for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){const a=POS[ids[i]],b=POS[ids[j]];assert.ok(Math.hypot((a[0]-b[0])*1.5,a[1]-b[1])>2.4,`${ids[i]} et ${ids[j]} trop proches`)}
assert.ok(fs.existsSync(path.join(root,'assets/story/hackenia-map.webp')));
const st=fs.readFileSync(path.join(root,'assets/story-v193.js'),'utf8');assert.ok(st.includes("getView()==='map'&&window.HackeniaStoryMap"),'carte par défaut, liste en repli');
console.log('PASS: Story map — every part placed on the map of Hackénia, no overlap, map view by default with the list as fallback.');
