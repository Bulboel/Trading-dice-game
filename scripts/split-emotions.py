#!/usr/bin/env python3
"""Découpe les planches d'émotions (assets/Models/Characters/*chibi*motion*.png, fond transparent, poses côte à côte)
en images séparées : assets/story/emo/<perso>-<n>.webp (recadrées, 440 px de haut au plus).
Les coupes se font aux creux du profil d'opacité des colonnes (les poses peuvent se toucher : massue, ailes…),
en gardant des poses d'au moins 30 % de la hauteur de large. Planches de contrôle dans le dossier donné en argument."""
import sys,os,glob,re,unicodedata,json
import numpy as np
from scipy import ndimage
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
CUTS={'maebril':[1640]}  # coupes ajoutées à la main (poses qui se chevauchent : la pose effrayée de Maebril touche sa pose K.-O.)
FORCE={'harpe-de-bulbalina':6,'velmarys':8,'minotaure':6,'licorne':8}
ROWS={'faux-enfants'}  # planche en grille : deux rangées de poses
SKIP={'mimic-levier','bobo'}  # mimic : fond opaque, pas de détourage possible ; bobo : pas encore utilisé dans l'Histoire
def split_touching(m,rg,cnt):
    """Deux poses qui se touchent (lame contre cape…) : on érode jusqu'à ce que le point de contact cède, chaque noyau revient à la pose
    où il se trouve, puis chaque pixel rejoint le noyau le plus proche. À défaut, coupe droite entre les poses."""
    tot=m.sum();need=int((cnt>=0.3*cnt.max()).sum())
    for k in (2,4,6,9,13,18,24,32):
        core=ndimage.binary_erosion(m,iterations=k)
        cl,cn=ndimage.label(core,np.ones((3,3)))
        if cn<2:continue
        sizes=ndimage.sum(core,cl,range(1,cn+1));big=[i+1 for i,v in enumerate(sizes) if v>=0.03*tot]
        own={}
        for c in big:
            r=rg[cl==c];r=r[r>=0]
            if len(r):own[c]=int(np.bincount(r).argmax())
        if len(set(own.values()))<max(2,need):continue
        seed=np.zeros(m.shape,dtype=int)
        for c,j in own.items():seed[cl==c]=j+1
        _,(iy,ix)=ndimage.distance_transform_edt(seed==0,return_indices=True)
        near=seed[iy,ix]-1
        return [(j,m&(near==j)) for j in sorted(set(own.values()))]
    top=np.sort(cnt)[::-1]
    if top[1]<0.3*top[0]:return [(int(cnt.argmax()),m)]  # une seule pose (bout d'arme qui dépasse) : le morceau entier
    return [(j,m&(rg==j)) for j in np.nonzero(cnt)[0]]
index={}
for f in sorted(glob.glob(SRC+'/*.png')):
    base=os.path.basename(f)
    if not re.search(r'chibi.*[ée]motion',base,re.I):continue
    im=Image.open(f).convert('RGBA');A=np.array(im.getchannel('A'))>24;H=A.shape[0]
    name=slug(base)
    if name in SKIP:continue
    prof=A.sum(0).astype(float);xs=cuts(prof,H)
    if name in CUTS:xs=sorted(set(xs+CUTS[name]))
    if name in FORCE:xs=force(xs,np.convolve(prof,np.ones(9)/9,'same'),FORCE[name])
    index[name]=[];boxes=[]
    for i in range(len(xs)-1):
        sub=A[:,xs[i]:xs[i+1]];bands=[(0,H)]
        if name in ROWS:
            rp=sub.sum(1);m=H//3+int(np.argmin(rp[H//3:2*H//3]));bands=[(0,m),(m,H)]
        for y0,y1 in bands:boxes.append((i,y0,y1))
    # v450 — détourage par morceaux connexes : un morceau appartient en entier à la pose où se trouve l'essentiel de sa matière
    # (plus de bout de hache coupé, plus de fragment de la pose voisine). Seuls les morceaux vraiment partagés (poses qui se touchent)
    # sont coupés, au creux entre les deux poses.
    lab,nl=ndimage.label(np.array(im.getchannel('A'))>0,structure=np.ones((3,3)))
    reg=np.full(A.shape,-1,dtype=int)
    for j,(i,y0,y1) in enumerate(boxes):reg[y0:y1,xs[i]:xs[i+1]]=j
    keep=np.zeros((len(boxes),)+A.shape,dtype=bool)
    objs=ndimage.find_objects(lab);sizes=[0]+[int((lab[sl]==c).sum()) if sl is not None else 0 for c,sl in enumerate(objs,1)];big=max(sizes)*0.05
    small=[]
    for c,sl in enumerate(objs,1):
        if sl is None:continue
        m=lab[sl]==c;r=reg[sl][m];r=r[r>=0]
        if sizes[c]<big or len(r)==0:small.append((c,sl,m));continue
        cnt=np.bincount(r,minlength=len(boxes));best=int(cnt.argmax())
        if (cnt>0).sum()==1:
            keep[best][sl]|=m
        else:
            for j,part in split_touching(m,reg[sl],cnt):keep[j][sl]|=part
    # petits morceaux détachés (étoiles, gouttes, mèche, bout de lame…) : à la pose dont le corps est le plus proche
    if small:
        dist=np.stack([ndimage.distance_transform_edt(~keep[j]) if keep[j].any() else np.full(A.shape,1e9) for j in range(len(boxes))])
        for c,sl,m in small:
            d=[dist[j][sl][m].min() for j in range(len(boxes))];keep[int(np.argmin(d))][sl]|=m
    alpha=np.array(im.getchannel('A'))
    for j,(i,y0,y1) in enumerate(boxes):
        mk=keep[j]&(alpha>24);ys=np.nonzero(mk.any(1))[0];cs=np.nonzero(mk.any(0))[0]
        if len(ys)==0:continue
        box=(max(0,cs[0]-4),max(0,ys[0]-4),min(A.shape[1],cs[-1]+5),min(A.shape[0],ys[-1]+5))
        rgba=np.array(im);rgba[...,3]=np.where(keep[j],alpha,0)
        crop=Image.fromarray(rgba).crop(box);k=min(1,MAXH/crop.height)
        crop=crop.resize((max(1,round(crop.width*k)),max(1,round(crop.height*k))),Image.LANCZOS)
        p=f'{OUT}/{name}-{len(index[name])+1}.webp';crop.save(p,'WEBP',quality=80,method=4);index[name].append(p)
    if check:
        tiles=[Image.open(p) for p in index[name]];th=180;row=Image.new('RGB',(sum(round(t.width*th/t.height)+10 for t in tiles)+10,th+30),(40,40,60));xx=10;d=ImageDraw.Draw(row)
        for j,t in enumerate(tiles):
            t2=t.resize((round(t.width*th/t.height),th));row.paste(t2,(xx,25),t2);d.text((xx+4,4),f'{name} {j+1}',fill=(255,230,150));xx+=t2.width+10
        row.save(f'{check}/emo-{name}.png')
json.dump(index,open(OUT+'/index.json','w'),ensure_ascii=False,indent=1)
print(len(index),'planches,',sum(len(v) for v in index.values()),'émotions')
