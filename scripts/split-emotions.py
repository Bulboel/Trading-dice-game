#!/usr/bin/env python3
"""Découpe les planches d'émotions (assets/Models/Characters/*chibi*motion*.png, fond transparent, poses côte à côte)
en images séparées : assets/story/emo/<perso>-<n>.webp (recadrées, 440 px de haut au plus).
Les coupes se font aux creux du profil d'opacité des colonnes (les poses peuvent se toucher : massue, ailes…),
en gardant des poses d'au moins 30 % de la hauteur de large. Planches de contrôle dans le dossier donné en argument."""
import sys,os,glob,re,unicodedata,json
import numpy as np
from PIL import Image,ImageDraw
SRC='assets/Models/Characters';OUT='assets/story/emo';os.makedirs(OUT,exist_ok=True)
MAXH=440
check=sys.argv[1] if len(sys.argv)>1 else None
def slug(s):
    s=unicodedata.normalize('NFD',os.path.splitext(s)[0]).encode('ascii','ignore').decode().lower()
    s=re.sub(r'\b(chibi|emotion|sup)\b','',s);return re.sub(r'[^a-z0-9]+','-',s).strip('-')
def cuts(prof,H):
    W=len(prof);sm=np.convolve(prof,np.ones(9)/9,'same');mx=sm.max();minw=int(H*0.30)
    occ=np.nonzero(sm>mx*0.02)[0];x0,x1=occ[0],occ[-1]+1
    cand=[x for x in range(x0+minw,x1-minw) if sm[x]<=sm[max(0,x-12):x+13].min()+1e-9 and sm[x]<mx*0.22]
    cand.sort(key=lambda x:sm[x]);chosen=[]
    for x in cand:
        if all(abs(x-c)>=minw for c in chosen):chosen.append(x)
    chosen.sort();return [x0]+chosen+[x1]
def force(xs,prof,n):
    # sépare la pose la plus large à son creux le plus profond (deux poses collées, ex. la harpe K.-O.)
    while len(xs)-1<n:
        i=max(range(len(xs)-1),key=lambda k:xs[k+1]-xs[k]);a,b=xs[i],xs[i+1];lo,hi=a+(b-a)//4,b-(b-a)//4
        xs.insert(i+1,lo+int(np.argmin(prof[lo:hi])))
    return xs
FORCE={'harpe-de-bulbalina':6}
ROWS={'faux-enfants'}  # planche en grille : deux rangées de poses
SKIP={'mimic-levier'}  # fond opaque : pas de détourage possible
index={}
for f in sorted(glob.glob(SRC+'/*.png')):
    base=os.path.basename(f)
    if not re.search(r'chibi.*[ée]motion',base,re.I):continue
    im=Image.open(f).convert('RGBA');A=np.array(im.getchannel('A'))>24;H=A.shape[0]
    name=slug(base)
    if name in SKIP:continue
    prof=A.sum(0).astype(float);xs=cuts(prof,H)
    if name in FORCE:xs=force(xs,np.convolve(prof,np.ones(9)/9,'same'),FORCE[name])
    index[name]=[];boxes=[]
    for i in range(len(xs)-1):
        sub=A[:,xs[i]:xs[i+1]];bands=[(0,H)]
        if name in ROWS:
            rp=sub.sum(1);m=H//3+int(np.argmin(rp[H//3:2*H//3]));bands=[(0,m),(m,H)]
        for y0,y1 in bands:boxes.append((i,y0,y1))
    for i,y0,y1 in boxes:
        sub=A[y0:y1,xs[i]:xs[i+1]];ys=np.nonzero(sub.any(1))[0];cs=np.nonzero(sub.any(0))[0]
        if len(ys)==0:continue
        box=(xs[i]+max(0,cs[0]-4),y0+max(0,ys[0]-4),xs[i]+min(sub.shape[1],cs[-1]+5),y0+min(y1-y0,ys[-1]+5))
        crop=im.crop(box);k=min(1,MAXH/crop.height)
        crop=crop.resize((max(1,round(crop.width*k)),max(1,round(crop.height*k))),Image.LANCZOS)
        p=f'{OUT}/{name}-{len(index[name])+1}.webp';crop.save(p,'WEBP',quality=80,method=4);index[name].append(p)
    if check:
        tiles=[Image.open(p) for p in index[name]];th=180;row=Image.new('RGB',(sum(round(t.width*th/t.height)+10 for t in tiles)+10,th+30),(40,40,60));xx=10;d=ImageDraw.Draw(row)
        for j,t in enumerate(tiles):
            t2=t.resize((round(t.width*th/t.height),th));row.paste(t2,(xx,25),t2);d.text((xx+4,4),f'{name} {j+1}',fill=(255,230,150));xx+=t2.width+10
        row.save(f'{check}/emo-{name}.png')
json.dump(index,open(OUT+'/index.json','w'),ensure_ascii=False,indent=1)
print(len(index),'planches,',sum(len(v) for v in index.values()),'émotions')
