// Les modèles chargés en jeu sont les versions légères (textures 1024 px en WebP) : budget par modèle et total.
const fs=require('fs'),path=require('path'),assert=require('assert');const root=path.join(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json'),'utf8'));
const files=new Set();for(const [key,info] of Object.entries(manifest.creatures)){if(!info.glb||info.glb.startsWith('models/'))continue;assert.ok(info.glb.startsWith('models-web/'),key+' uses the lightweight model');files.add(info.glb)}
let total=0;for(const f of files){const p=path.join(root,'assets',f),b=fs.readFileSync(p);total+=b.length;assert.ok(b.length<4e6,f+' stays under 4 MB');const doc=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));
 for(const img of doc.images||[])assert.equal(img.mimeType,'image/webp',f+' textures are WebP');}
assert.ok(total<120e6,'All in-game models stay under 120 MB');
const cfg=fs.readFileSync(path.join(root,'_config.yml'),'utf8');assert.match(cfg,/- assets\/Models/,'Source exports are not published');
console.log(`PASS: ${files.size} in-game models in assets/models-web (${(total/1e6).toFixed(0)} MB, WebP textures, each < 4 MB); sources excluded from publishing.`);
