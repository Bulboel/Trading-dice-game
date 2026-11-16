"""v319 — Retire le cadre doré des médaillons de bébémentaires (assets/characters/bebe*-128|512.webp).
Les fiches et les cartes dessinent déjà leur propre cercle : le cadre doré du médaillon, plus grand et décalé, en laissait voir un arc en haut.
On recadre sur le disque intérieur (fond + personnage) et on arrondit les bords. Idempotent : ne touche que les images qui ont encore leur anneau doré.
Usage : python3 scripts/trim-medallion-rings.py"""
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np
ROOT=Path(__file__).resolve().parents[1]/'assets'/'characters'
IN=.452  # rayon du disque intérieur / côté de l'image
def has_ring(im):
    a=np.asarray(im);S=a.shape[0];c=S/2;hits=0;tot=0
    for t in np.linspace(0,2*np.pi,48,endpoint=False):
        for r in (.472,.482):
            x=int(c+np.cos(t)*r*S);y=int(c+np.sin(t)*r*S)
            if 0<=x<S and 0<=y<S:
                R,G,B,A=[int(v) for v in a[y,x]];tot+=1
                if A>200 and R>150 and G>100 and B<150 and R>B+40:hits+=1
    return tot and hits/tot>.6
n=0
for p in sorted(ROOT.glob('bebe*-*.webp')):
    if p.stem.rsplit('-',1)[-1] not in('128','512'):continue
    im=Image.open(p).convert('RGBA');S=im.width
    if im.width!=im.height or not has_ring(im):continue
    r=IN*S;box=(S/2-r,S/2-r,S/2+r,S/2+r)
    out=im.crop(tuple(int(round(v)) for v in box)).resize((S,S),Image.Resampling.LANCZOS)
    k=4;m=Image.new('L',(S*k,S*k),0);ImageDraw.Draw(m).ellipse([0,0,S*k-1,S*k-1],fill=255);m=m.resize((S,S),Image.Resampling.LANCZOS)
    a=np.minimum(np.asarray(out.getchannel('A')),np.asarray(m));out.putalpha(Image.fromarray(a))
    out.save(p,quality=92,method=6);n+=1
print('médaillons recadrés :',n)
