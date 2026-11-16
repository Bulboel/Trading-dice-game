/* v342 — Miniatures des créatures d'Histoire sans illustration (loup, larve, guerrier fantomatique) : rendu 3D (model-viewer)
   sur fond transparent → assets/characters/cutouts/renders/<clé>.png, puis scripts/medallion-foes.py en fait des médaillons.
   Usage : serveur statique sur le dépôt (python3 -m http.server 8765), puis node scripts/render-foes.cjs */
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..'),OUT=path.join(ROOT,'assets/characters/cutouts/renders');fs.mkdirSync(OUT,{recursive:true});
const ALL=[['loup','Loup idle.glb','-35deg 78deg 105%'],['larve','Larve idle.glb','-35deg 72deg 105%'],['guerrier-fantome','Guerrier fantomatique idle.glb','-20deg 84deg 105%'],
 /* v350 */['canourson','Canourson.glb','-35deg 78deg 105%'],['canours','Canours idle.glb','-20deg 84deg 105%'],['ver-geant','ver géant.glb','-30deg 75deg 105%']],
 FOES=process.argv.length>2?ALL.filter(f=>process.argv.includes(f[0])):ALL,PORT=process.env.PORT||8765;
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 for(const [key,file,orbit] of FOES){const p=await b.newPage({viewport:{width:760,height:760},deviceScaleFactor:1});
  const page=path.join(ROOT,'_viewer.tmp.html');
  fs.writeFileSync(page,`<html><body style="margin:0;background:transparent"><script type="module" src="assets/vendor/model-viewer/model-viewer.min.js"></script>
  <model-viewer id="m" src="assets/models-web/${encodeURIComponent(file)}" camera-orbit="${orbit}" field-of-view="26deg" exposure="1.15" shadow-intensity="0" interaction-prompt="none" style="width:760px;height:760px;background:transparent;--poster-color:transparent"></model-viewer></body></html>`);
  await p.goto(`http://localhost:${PORT}/_viewer.tmp.html`);
  await p.waitForFunction(()=>{const m=document.getElementById('m');return m&&m.loaded},null,{timeout:60000}).catch(()=>console.log('load timeout',key));
  await p.waitForTimeout(1500);await p.screenshot({path:path.join(OUT,`${key}.png`),omitBackground:true});console.log('rendu',key);await p.close()}
 try{fs.unlinkSync(path.join(ROOT,'_viewer.tmp.html'))}catch(e){}
 await b.close()})();
