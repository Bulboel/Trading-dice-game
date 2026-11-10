// v225 — Mode hors ligne : sw.js à jour, tout ce que la page charge au démarrage est gardé, API jamais mise en cache.
const fs=require('fs'),path=require('path'),assert=require('assert'),{execFileSync}=require('child_process');const root=path.join(__dirname,'..');
try{execFileSync('python3',[path.join(root,'scripts/build-offline.py'),'--check'],{cwd:root,stdio:'pipe'})}catch(e){assert.fail(String(e.stdout||e.message).trim())}
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8'),shell=JSON.parse(sw.match(/const SHELL=(\[.*?\]);/s)[1]),full=JSON.parse(sw.match(/const FULL=(\[.*?\]);/s)[1]);
for(const u of shell.filter(u=>u.startsWith('assets/')))assert.ok(fs.existsSync(path.join(root,u.split('?')[0])),'Missing precached file '+u);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');for(const m of html.matchAll(/(?:src|href)="(assets\/[^"#]+)"/g))if(fs.existsSync(path.join(root,m[1].split('?')[0])))assert.ok(shell.includes(m[1]),'Not available offline: '+m[1]);
assert.ok(shell.some(u=>/characters\/.*-512\.webp/.test(u)),'Large portraits are kept (hand cards use them)');assert.ok(full.some(u=>u.endsWith('.glb')),'3D models downloadable on demand');
assert.ok(/isApi\(url\)\|\|req\.headers\.has\('range'\)\)return/.test(sw),'Supabase (PVP, cloud save) is never cached');assert.ok(sw.includes("req.mode==='navigate'")&&sw.includes('await fetch(req)'),'Page is network-first so updates arrive');
assert.ok(html.includes('assets/offline-v225.js'),'Service worker registered');const portal=fs.readFileSync(path.join(root,'assets/portal-v159.js'),'utf8');assert.ok(portal.includes("view==='pvp'&&!navigator.onLine"),'PVP explains it needs a connection');
console.log(`PASS: sw.js up to date, ${shell.length} files kept at first launch, ${full.length} heavy files downloadable, API never cached, PVP offline message.`);
