"""Génère sw.js (mode hors ligne) à partir de scripts/sw-template.js.
SHELL : tout ce que la page charge au démarrage (repéré dans index.html et les scripts) + les portraits miniatures.
FULL : le reste du contenu lourd (modèles 3D, animations, grands portraits, images de l'Histoire), pour « Télécharger tout le jeu ».
À relancer après chaque mise à jour : python3 scripts/build-offline.py"""
import hashlib,json,os,re,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[1];os.chdir(ROOT)
html=open('index.html',encoding='utf8').read()
EXT=r'(?:js|css|json|webp|png|svg|jpg|mp3)'
refs=set(re.findall(r'''(?:src|href)=["'](assets/[^"'#\s]+)["']''',html))
refs|=set(re.findall(r'''["'`](assets/[^"'`\s$+]+?\.'''+EXT+r'''(?:\?[^"'`\s+]*)?)["'`]''',html))
for f in sorted(os.listdir('assets')):
    if not f.endswith('.js'):continue
    s=open('assets/'+f,encoding='utf8',errors='ignore').read()
    refs|={'assets/'+m for m in re.findall(r'''import[^'"]*['"]\./([^'"]+)['"]''',s)}
    refs|=set(re.findall(r'''["'`](assets/[^"'`\s$+]+?\.'''+EXT+r'''(?:\?[^"'`\s+]*)?)["'`]''',s))
refs={r for r in refs if os.path.exists(r.split('?')[0]) and not r.startswith('assets/Models/')}
shell=['./','./index.html','./site.webmanifest','assets/manifest.json']+sorted(refs)
shell+=sorted('assets/characters/'+f for f in os.listdir('assets/characters') if f.endswith(('-128.webp','-512.webp')))
shell=list(dict.fromkeys(shell))
full=[]
for d,pat in [('assets/models-web',r'\.glb$'),('assets/characters',r'\.glb$'),('assets/story',r'\.(webp|png|jpg)$'),('assets/models',r'\.glb$')]:
    if os.path.isdir(d):full+=sorted(f'{d}/{f}' for f in os.listdir(d) if re.search(pat,f))
full=[f for f in full if f not in shell]
h=hashlib.sha1()
for u in shell:
    p=u.split('?')[0];p='index.html' if p in('./','./index.html') else p
    if os.path.isfile(p):h.update(u.encode());h.update(open(p,'rb').read())
version=h.hexdigest()[:12]
tpl=open('scripts/sw-template.js',encoding='utf8').read()
out=tpl.replace('__VERSION__',version).replace('__SHELL__',json.dumps(shell,ensure_ascii=False)).replace('__FULL__',json.dumps(full,ensure_ascii=False))
import sys
if '--check' in sys.argv:
    cur=open('sw.js',encoding='utf8').read() if os.path.exists('sw.js') else ''
    if cur!=out:print('sw.js n’est pas à jour : lancez python3 scripts/build-offline.py');sys.exit(1)
    print('sw.js à jour ('+version+')');sys.exit(0)
open('sw.js','w',encoding='utf8').write(out)
size=lambda L:sum(os.path.getsize(u.split('?')[0]) for u in L if os.path.isfile(u.split('?')[0]))
print(f'sw.js {version} : {len(shell)} fichiers au démarrage ({size(shell)/1e6:.1f} Mo), {len(full)} fichiers à la demande ({size(full)/1e6:.0f} Mo)')
