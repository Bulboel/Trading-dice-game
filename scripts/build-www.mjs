// Prépare le dossier www/ copié dans l'application Android : exactement les fichiers publiés sur le site,
// sans les sources 3D lourdes (assets/Models), les tests, les scripts ni le service worker (inutile dans l'app).
import {cpSync,rmSync,mkdirSync,existsSync,statSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
const root=new URL('..',import.meta.url).pathname,out=join(root,'www');
rmSync(out,{recursive:true,force:true});mkdirSync(out);
for(const f of ['index.html','site.webmanifest'])cpSync(join(root,f),join(out,f));
const skip=p=>/(^|\/)assets\/(Models|characters\/cutouts)(\/|$)/.test(p)||/\.(md|py|psd|blend)$/i.test(p);
cpSync(join(root,'assets'),join(out,'assets'),{recursive:true,filter:src=>!skip(src.slice(root.length))});
let n=0,size=0;const walk=d=>{for(const e of readdirSync(d,{withFileTypes:true})){const p=join(d,e.name);if(e.isDirectory())walk(p);else{n++;size+=statSync(p).size}}};walk(out);
console.log(`www/ : ${n} fichiers, ${(size/1e6).toFixed(0)} Mo`);
