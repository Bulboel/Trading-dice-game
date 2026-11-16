"""v327 — Recadrage au pixel près de toutes les miniatures rondes (assets/characters/*-128|512.webp).
Pour chaque image : on lance 720 rayons depuis le centre et on garde, sur chacun, le pixel opaque le plus éloigné (bord extérieur du médaillon,
cadre peint compris). On ajuste un cercle sur ces points en rejetant les ornements qui dépassent (pointes, gemmes, oreilles, cheveux),
puis on recadre exactement sur ce cercle : le bord du médaillon tombe pile sur le cercle de la fiche. Les images qui ne sont pas des médaillons
ronds (découpes libres) ne sont pas touchées. Idempotent.
Usage : python3 scripts/exact-medallions.py [--apply]"""
import sys,json
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np
ROOT=Path(__file__).resolve().parents[1]/'assets'/'characters'
APPLY='--apply' in sys.argv
def outer_points(a,n=720):
    S=a.shape[0];c=(S-1)/2;pts=[]
    rs=np.arange(S*.5,S*.25,-.5)
    for t in np.linspace(0,2*np.pi,n,endpoint=False):
        xs=np.clip((c+np.cos(t)*rs).round().astype(int),0,S-1);ys=np.clip((c+np.sin(t)*rs).round().astype(int),0,S-1)
        hit=np.nonzero(a[ys,xs]>=128)[0]
        if len(hit):k=hit[0];pts.append((c+np.cos(t)*rs[k],c+np.sin(t)*rs[k]))
    return np.array(pts)
def fit(pts,S):
    if len(pts)<300:return None
    keep=np.ones(len(pts),bool)
    for it in range(12):
        P=pts[keep];A=np.c_[2*P[:,0],2*P[:,1],np.ones(len(P))];b=(P**2).sum(1)
        cx,cy,c=np.linalg.lstsq(A,b,rcond=None)[0];r=np.sqrt(max(c+cx*cx+cy*cy,1))
        res=np.hypot(pts[:,0]-cx,pts[:,1]-cy)-r
        tol=max(1.2,S*(.02 if it<4 else .006))
        keep=np.abs(res)<tol
    frac=keep.mean()
    return (cx,cy,r,frac)
rows=[];n=0;free=[]
for p in sorted(ROOT.glob('*-512.webp')):
    base=p.stem[:-4];im=Image.open(p).convert('RGBA');S=im.width;a=np.asarray(im.getchannel('A'))
    f=fit(outer_points(a),S)
    if not f or f[3]<.6 or f[2]<.36*S:free.append(base);continue
    cx,cy,r,frac=f;c=(S-1)/2;dx,dy,dr=cx-c,cy-c,r-S/2
    if abs(dx)<.6 and abs(dy)<.6 and abs(dr)<1.0:continue
    rows.append((base,round(dx,1),round(dy,1),round(dr,1),round(frac,2)))
    if APPLY:
        for size in('512','128'):
            q=ROOT/f'{base}-{size}.webp'
            if not q.exists():continue
            I=Image.open(q).convert('RGBA');W=I.width;k=W/S;R=(r-.6)*k;X=(cx+.5)*k;Y=(cy+.5)*k
            c2=I.resize((W*4,W*4),Image.Resampling.LANCZOS).crop((int(round((X-R)*4)),int(round((Y-R)*4)),int(round((X+R)*4)),int(round((Y+R)*4)))).resize((W,W),Image.Resampling.LANCZOS)
            m=Image.new('L',(W*4,W*4),0);ImageDraw.Draw(m).ellipse([0,0,W*4-1,W*4-1],fill=255);m=m.resize((W,W),Image.Resampling.LANCZOS)
            c2.putalpha(Image.fromarray(np.minimum(np.asarray(c2.getchannel('A')),np.asarray(m))));c2.save(q,quality=92,method=6);n+=1
print(len(rows),'à recadrer ;',len(free),'découpes libres (non rondes) :',free)
if not APPLY:[print(r) for r in rows]
else:print('images réécrites :',n)
json.dump(free,open('/tmp/free.json','w'))
