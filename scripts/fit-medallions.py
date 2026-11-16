"""v320 — Recentre les médaillons ronds des personnages (assets/characters/*-128|512.webp).
Chaque médaillon est un disque (parfois avec un cadre doré/argenté et des ornements qui dépassent). On ajuste un cercle sur le contour du disque
(en ignorant les ornements), puis on recadre exactement dessus : le médaillon est alors concentrique au cercle de la fiche, sans arc coupé.
Usage : python3 scripts/fit-medallions.py [--apply]"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np
ROOT=Path(__file__).resolve().parents[1]/'assets'/'characters'
APPLY='--apply' in sys.argv
def fit(a):
    """a : alpha 0..255 (512 px). Renvoie (cx,cy,r) du disque ou None si l'image n'est pas un médaillon rond."""
    m=a>128;S=a.shape[0]
    if m.sum()<.5*S*S*.7:return None
    edge=m&~(np.roll(m,1,0)&np.roll(m,-1,0)&np.roll(m,1,1)&np.roll(m,-1,1))
    ys,xs=np.nonzero(edge);pts=np.c_[xs,ys].astype(float)
    if len(pts)<200:return None
    keep=np.ones(len(pts),bool)
    for _ in range(8):
        P=pts[keep];A=np.c_[2*P[:,0],2*P[:,1],np.ones(len(P))];b=(P**2).sum(1)
        cx,cy,c=np.linalg.lstsq(A,b,rcond=None)[0];r=np.sqrt(c+cx*cx+cy*cy)
        res=np.abs(np.hypot(pts[:,0]-cx,pts[:,1]-cy)-r);keep=res<max(1.5,.012*S)
        if keep.sum()<.5*len(pts):return None
    # médaillon rond : le contour doit suivre le cercle sur l'essentiel de son périmètre
    if keep.sum()<.55*len(pts) or r<.3*S:return None
    return cx,cy,r
rows=[];n=0
for p in sorted(ROOT.glob('*-512.webp')):
    im=Image.open(p).convert('RGBA');S=im.width;f=fit(np.asarray(im.getchannel('A')))
    if not f:continue
    cx,cy,r=f;off=np.hypot(cx-S/2,cy-S/2)/S;rr=r/S
    bad=off>.008 or rr<.485
    rows.append((p.stem[:-4],round(off,3),round(rr,3),bad))
    if bad and APPLY:
        for size in(512,128):
            q=ROOT/f"{p.stem[:-4]}-{size}.webp"
            if not q.exists():continue
            I=Image.open(q).convert('RGBA');k=I.width/S
            box=(int(round((cx-r)*k)),int(round((cy-r)*k)),int(round((cx+r)*k)),int(round((cy+r)*k)))
            c=Image.new('RGBA',(box[2]-box[0],box[3]-box[1]),(0,0,0,0));c.paste(I,(-box[0],-box[1]))
            c=c.resize((I.width,I.width),Image.Resampling.LANCZOS)
            K=4;m=Image.new('L',(I.width*K,)*2,0);ImageDraw.Draw(m).ellipse([0,0,I.width*K-1,I.width*K-1],fill=255);m=m.resize((I.width,)*2,Image.Resampling.LANCZOS)
            al=np.minimum(np.asarray(c.getchannel('A')),np.asarray(m));c.putalpha(Image.fromarray(al));c.save(q,quality=92,method=6);n+=1
print(len(rows),'médaillons ronds ;',sum(1 for r in rows if r[3]),'à recentrer')
if not APPLY:
    for r in rows:
        if r[3]:print(r)
else:print('images réécrites :',n)
