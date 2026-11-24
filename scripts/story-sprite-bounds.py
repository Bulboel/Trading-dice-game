#!/usr/bin/env python3
"""v431 — Silhouettes des personnages de l'Histoire : pour chaque illustration (case de planche « 400% 300% » ou image seule,
y compris les poses d'émotions de assets/story/emo/), la boîte réellement occupée par le personnage (pixels opaques),
en fractions de la case. assets/story-v193.js s'en sert pour afficher chaque personnage à sa vraie taille relative
(STATURE dans assets/story-emotions-v429.js). Écrit assets/story-sprites-v431.js. Relancer après tout ajout d'illustration."""
import json,re,glob,os
import numpy as np
from PIL import Image
s=open('assets/story-data-v193.js',encoding='utf-8').read().split('\n',1)[1]
data=json.loads(s[len('window.HACKENIA_STORY='):].rstrip().rstrip(';'))
srcs=set()
for p in data:
    for k in ('intro','victory','lose','silence'):
        for l in p.get(k) or []:
            for c in l.get('cast',[]):
                if c.get('art'):continue
                m=re.search(r'url\("?([^")]+)"?\)',c.get('img') or '')
                if c.get('p'):srcs.add((c['p'],None))
                elif m:
                    if c.get('sz')=='400% 300%':
                        px,py=[float(v.rstrip('%')) for v in c['pos'].split()]
                        col,row=round(px/33.3333),round(py/50)
                        if 0<=col<4 and 0<=row<3:srcs.add((m.group(1),(col,row)))
                    else:srcs.add((m.group(1),None))
for f in glob.glob('assets/story/emo/*.webp'):srcs.add((f,None))
out={}
cache={}
for path,cell in sorted(srcs,key=lambda t:(t[0],t[1] or (0,0))):
    if not os.path.exists(path):continue
    if path not in cache:cache[path]=np.array(Image.open(path).convert('RGBA'))[...,3]>40
    A=cache[path];H,W=A.shape
    if cell:
        cw,ch=W/4,H/3;x0,y0=int(cell[0]*cw),int(cell[1]*ch);A2=A[y0:int(y0+ch),x0:int(x0+cw)];w,h=cw,ch
    else:A2=A;w,h=W,H
    ys=np.nonzero(A2.any(1))[0];xs=np.nonzero(A2.any(0))[0]
    if not len(ys):continue
    key=path+('#%d,%d'%cell if cell else '')
    out[key]=[round(xs[0]/w,4),round(ys[0]/h,4),round((xs[-1]+1)/w,4),round((ys[-1]+1)/h,4),round(w/h,4)]
js='/* v431 — généré par scripts/story-sprite-bounds.py : silhouette [x0,y0,x1,y1] (fractions de la case) et rapport largeur/hauteur de la case. */\nwindow.HACKENIA_SPRITE_BOUNDS='+json.dumps(out,separators=(',',':'))+';\n'
open('assets/story-sprites-v431.js','w').write(js);print(len(out),'silhouettes')
