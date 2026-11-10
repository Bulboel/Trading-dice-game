// Le dé Annonces affiche bien la dernière version (garde-fou : une entrée de nouveautés par mise à jour importante).
const fs=require('fs'),path=require('path'),assert=require('assert');const root=path.join(__dirname,'..');
const news=fs.readFileSync(path.join(root,'assets/news-v200.js'),'utf8'),build=+fs.readFileSync(path.join(root,'assets/portal-v159.js'),'utf8').match(/portal-build">v(\d+)/)[1];
const ids=[...news.matchAll(/\{id:'v(\d+)'/g)].map(m=>+m[1]);assert.ok(ids.length>5);assert.deepEqual(ids,[...ids].sort((a,b)=>b-a),'Newest first');
assert.ok(build-ids[0]<=3,`Latest news entry v${ids[0]} is too old for build v${build}`);
console.log(`PASS: news newest first, latest entry v${ids[0]} for build v${build}.`);
