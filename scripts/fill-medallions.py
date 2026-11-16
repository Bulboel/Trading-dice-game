"""v322 — Fait remplir le cercle de la fiche par chaque médaillon rond (assets/characters/*-128|512.webp).
Beaucoup de médaillons ont un disque plein entouré d'une zone transparente avec des ornements (pointes, gemmes) : dans le cercle de la fiche,
ils paraissaient plus petits, décalés, avec des ornements coupés. On ajuste un cercle sur le disque PLEIN (alpha opaque, ornements ignorés),
puis on recadre juste à l'intérieur : le disque remplit exactement le cercle de la fiche. Idempotent.
Usage : python3 scripts/fill-medallions.py [--apply]"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np
ROOT=Path(__file__).resolve().parents[1]/'assets'/'characters'
APPLY='--apply' in sys.argv
def fit(a,th=245):
    m=a>=th;S=a.shape[0]
    if m.sum()<.35*S*S:return None
    edge=m&~(np.roll(m,1,0)&np.roll(m,-1,0)&np.roll(m,1,1)&np.roll(m,-1,1))
    ys,xs=np.nonzero(edge);pts=np.c_[xs,ys].astype(float)
    if len(pts)<100:return None
    keep=np.ones(len(pts),bool)
    for _ in range(10):
        P=pts[keep];A=np.c_[2*P[:,0],2*P[:,1],np.ones(len(P))];b=(P**2).sum(1)
        cx,cy,c=np.linalg.lstsq(A,b,rcond=None)[0];r=np.sqrt(max(c+cx*cx+cy*cy,1))
        res=np.hypot(pts[:,0]-cx,pts[:,1]-cy)-r
        keep=np.abs(res)<max(1.5,.01*S)
        if keep.sum()<.4*len(pts):return None
    # le disque plein : l'alpha doit rester opaque sur presque tout le cercle de rayon .97 r
    t=np.linspace(0,2*np.pi,360,endpoint=False);xs=(cx+np.cos(t)*r*.97).astype(int).clip(0,S-1);ys=(cy+np.sin(t)*r*.97).astype(int).clip(0,S-1)
    if (a[ys,xs]>=th).mean()<.97 or r<.3*S:return None
    return cx/S,cy/S,r/S
rows=[];n=0
for p in sorted(ROOT.glob('*-512.webp')):
    base=p.stem[:-4];im=Image.open(p).convert('RGBA');f=fit(np.asarray(im.getchannel('A')))
    if not f:continue
    cx,cy,r=f;off=np.hypot(cx-.5,cy-.5)
    if r>.492 and off<.004:continue
    rows.append((base,round(off,3),round(r,3)))
    if APPLY:
        for size in('512','128'):
            q=ROOT/f'{base}-{size}.webp'
            if not q.exists():continue
            I=Image.open(q).convert('RGBA');W=I.width;R=r*.985*W
            box=[cx*W-R,cy*W-R,cx*W+R,cy*W+R];bi=[int(round(v)) for v in box]
            c=Image.new('RGBA',(bi[2]-bi[0],bi[3]-bi[1]),(0,0,0,0));c.paste(I,(-bi[0],-bi[1]));c=c.resize((W,W),Image.Resampling.LANCZOS)
            K=4;m=Image.new('L',(W*K,W*K),0);ImageDraw.Draw(m).ellipse([0,0,W*K-1,W*K-1],fill=255);m=m.resize((W,W),Image.Resampling.LANCZOS)
            c.putalpha(Image.fromarray(np.minimum(np.asarray(c.getchannel('A')),np.asarray(m))));c.save(q,quality=92,method=6);n+=1
print(len(rows),'médaillons à faire remplir le cercle');[print(r) for r in rows] if not APPLY else print('images réécrites :',n)
