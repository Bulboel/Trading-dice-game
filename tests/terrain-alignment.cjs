// v233 — Les terrains procéduraux suivent exactement le damier : nombre de rangées réel (12) et aucun étirement.
const fs=require('fs'),path=require('path'),assert=require('assert');const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
for(const f of['assets/sky-v231.js','assets/wind-v232.js']){const s=read(f);
 assert.ok(!/\by<10\b|\by<=10\b|ch=h\/10|512,640/.test(s),f+' : no hard-coded 10-row texture');
 assert.ok(s.includes('ch=h/rows')&&s.includes('(p.getZ(i)+HZ)/rows'),f+' : texture cells follow the real rows')}
const cl=read('assets/clearing-v105.js');
for(const v of['lake','skyIsland','windLand'])assert.ok(cl.includes(v+'.root.scale.z=1/ZS}'),v+' is not stretched a second time by the decor group');
assert.ok(!/y>=10\b/.test(cl),'Placement preview and lens use the real number of rows (12), not 10');
console.log('PASS: lake, sky island and wind highlands use the real board rows and are not stretched: every texture cell sits on a game cell.');
