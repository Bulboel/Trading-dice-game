// v256 — Araignée blanche (rare, sans élément) et Grande araignée blanche (rare, multi-élément) avec gestuelle procédurale.
const fs=require('fs'),path=require('path'),assert=require('assert');const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),cl=fs.readFileSync(path.join(root,'assets/clearing-v105.js'),'utf8'),man=JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json'),'utf8'));
assert.ok(html.includes("n:'Araignée blanche'")&&html.includes("n:'Grande araignée blanche'")&&html.includes('boardScale:1.3'));
const c=man.creatures['araignee-blanche'];assert.ok(c&&c.glb&&c.gesture==='spider'&&fs.existsSync(path.join(root,'assets',c.glb)));
for(const s of[128,512])assert.ok(fs.existsSync(path.join(root,`assets/characters/araignee-blanche-${s}.webp`)));
assert.ok(cl.includes('function animateGesture(')&&cl.includes('if(g.userData.gest)animateGesture(g,k,f,combat,t);')&&cl.includes('game.monsters[mi]?.boardScale'));
console.log('v256 white spider OK');
