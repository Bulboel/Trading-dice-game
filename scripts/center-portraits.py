"""v261 — Recentre les miniatures des personnages (assets/characters/*-128.webp et *-512.webp).
Médaillons (cadre rond inclus) : centrés sur leur boîte englobante. Découpes sans cadre : centrées entre leur boîte englobante
et leur centre de masse (le visage, pas le chapeau ou la queue de cape), avec une marge régulière. Sans effet sur une image déjà centrée.
Usage : python3 scripts/center-portraits.py"""
from pathlib import Path
from PIL import Image
import numpy as np
ROOT=Path(__file__).resolve().parents[1]/'assets'/'characters'
changed=0
for p in sorted(ROOT.glob('*-*.webp')):
    if p.stem.rsplit('-',1)[-1] not in('128','512'):continue
    im=Image.open(p).convert('RGBA');a=np.asarray(im.getchannel('A')).astype(float)/255;h,w=a.shape
    mask=a>.08;ys,xs=np.where(mask)
    if not len(xs):continue
    x0,x1,y0,y1=xs.min(),xs.max()+1,ys.min(),ys.max()+1;bw,bh=x1-x0,y1-y0
    medallion=(a>.5).sum()/(bw*bh)>=.7
    yy,xx=np.mgrid[0:h,0:w];m=a.sum();cx=(a*xx).sum()/m;cy=(a*yy).sum()/m
    ccx,ccy=((x0+x1)/2,(y0+y1)/2) if medallion else (((x0+x1)/2+cx)/2,((y0+y1)/2+cy)/2)
    side=max(bw,bh);margin=1.0 if medallion else 1.06
    S=int(round(side*margin));S=max(S,max(bw,bh))
    # fenêtre carrée de côté S centrée sur (ccx,ccy), remise à l'échelle de l'image d'origine
    left=ccx-S/2;top=ccy-S/2
    canvas=Image.new('RGBA',(S,S),(0,0,0,0));canvas.paste(im,(int(round(-left)),int(round(-top))))
    out=canvas.resize((w,h),Image.Resampling.LANCZOS)
    # n'écrit que si l'image change nettement (évite de recompresser inutilement)
    if abs(left)>.012*w or abs(top)>.012*h or abs(S-w)>.02*w:
        out.save(p,quality=90,method=6);changed+=1
print('portraits recentrés :',changed)
