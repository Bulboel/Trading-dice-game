/* v267 — Miniatures des bébémentaires : rendu de leur modèle 3D (pose d'attente) sur fond transparent, via model-viewer.
   Sortie : assets/characters/cutouts/renders/bebementaire-<élément>.png ; scripts/medallion-bebementaires.py les monte ensuite en médaillons.
   Usage : serveur statique sur le dépôt (python3 -m http.server 8765), puis node scripts/render-bebementaires.cjs */
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..'),OUT=path.join(ROOT,'assets/characters/cutouts/renders');fs.mkdirSync(OUT,{recursive:true});
const ELS=['eau','feu','foudre','glace','terre','vent'],PORT=process.env.PORT||8765;
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 for(const el of ELS){const p=await b.newPage({viewport:{width:760,height:760},deviceScaleFactor:1});
  const page=path.join(ROOT,'_viewer.tmp.html');
  fs.writeFileSync(page,`<html><body style="margin:0;background:transparent"><script type="module" src="assets/vendor/model-viewer/model-viewer.min.js"></script>
  <model-viewer id="m" src="assets/models-web/${encodeURIComponent('Bébémentaire '+el+' idle.glb')}" camera-orbit="-18deg 84deg 105%" field-of-view="22deg" exposure="1.15" shadow-intensity="0" interaction-prompt="none" style="width:760px;height:760px;background:transparent;--poster-color:transparent"></model-viewer></body></html>`);
  await p.goto(`http://localhost:${PORT}/_viewer.tmp.html`);
  await p.waitForFunction(()=>{const m=document.getElementById('m');return m&&m.loaded},null,{timeout:60000}).catch(()=>console.log('load timeout',el));
  await p.waitForTimeout(1500);await p.screenshot({path:path.join(OUT,`bebementaire-${el}.png`),omitBackground:true});console.log('rendu',el);await p.close()}
 try{fs.unlinkSync(path.join(ROOT,'_viewer.tmp.html'))}catch(e){}
 await b.close()})();
