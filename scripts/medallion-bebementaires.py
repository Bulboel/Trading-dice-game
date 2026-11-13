"""v267 — Monte les rendus 3D des bébémentaires (assets/characters/cutouts/renders/) en médaillons ronds : fond dégradé à la couleur de l'élément,
cadre doré, gemme de l'élément. Sortie : assets/characters/cutouts/bebementaire-<élément>.webp (RGBA 1254 px, coins transparents).
Usage : python3 scripts/medallion-bebementaires.py"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
ROOT=Path(__file__).resolve().parents[1]/'assets'/'characters'
COL={'eau':(79,176,255),'feu':(255,110,60),'foudre':(178,120,255),'glace':(130,232,250),'terre':(214,150,70),'vent':(90,235,130)}
S=1254;SS=2
def lerp(a,b,t):return tuple(int(a[i]*(1-t)+b[i]*t) for i in range(3))
def medallion(el):
    N=S*SS;c=COL[el];dark=lerp(c,(12,10,28),.78);mid=lerp(c,(255,255,255),.15)
    yy,xx=np.mgrid[0:N,0:N];r=np.hypot(xx-N/2,yy-N*.46)/(N/2)
    t=np.clip(r,0,1)[...,None];base=np.array(mid,np.float32)*(1-t)+np.array(dark,np.float32)*t
    img=Image.fromarray(np.dstack([base,np.full((N,N),255)]).astype(np.uint8),'RGBA')
    # personnage : buste (tête et épaules), recadré sur la boîte englobante du rendu
    r3=Image.open(ROOT/'cutouts'/'renders'/f'bebementaire-{el}.png').convert('RGBA');bb=r3.getchannel('A').getbbox();r3=r3.crop(bb)
    w,h=r3.size;top=r3.crop((0,0,w,int(h*.64)));tw,th=top.size;k=(N*.78)/max(tw*1.0,th*1.0)*(1 if tw>=th else 1)
    top=top.resize((int(tw*k),int(th*k)),Image.Resampling.LANCZOS)
    # ombre douce sous le personnage
    sh=Image.new('RGBA',img.size,(0,0,0,0));sh.paste(top.filter(ImageFilter.GaussianBlur(N*.012)),(int(N/2-top.width/2),int(N*.13)))
    a=np.asarray(sh).copy();a[...,:3]=0;a[...,3]=(a[...,3]*.35).astype(np.uint8);img.alpha_composite(Image.fromarray(a,'RGBA'))
    img.alpha_composite(top,(int(N/2-top.width/2),int(N*.10)))
    # masque rond + cadre
    mask=Image.new('L',(N,N),0);d=ImageDraw.Draw(mask);R=N*.455;cx,cy=N/2,N/2;d.ellipse([cx-R,cy-R,cx+R,cy+R],fill=255)
    out=Image.new('RGBA',(N,N),(0,0,0,0));out.paste(img,(0,0),mask)
    ring=Image.new('RGBA',(N,N),(0,0,0,0));g=ImageDraw.Draw(ring)
    for i,(rad,col) in enumerate([(R+N*.034,(120,84,24)),(R+N*.026,(226,190,102)),(R+N*.016,(250,226,150)),(R+N*.008,(200,150,60)),(R,(110,76,22))]):
        g.ellipse([cx-rad,cy-rad,cx+rad,cy+rad],outline=col+(255,),width=int(N*.011))
    # gemme de l'élément en bas du cadre et quatre pointes
    gr=N*.036;gx,gy=cx,cy+R+N*.02
    g.ellipse([gx-gr*1.5,gy-gr*1.5,gx+gr*1.5,gy+gr*1.5],fill=(226,190,102,255),outline=(120,84,24,255),width=int(N*.005))
    g.ellipse([gx-gr,gy-gr,gx+gr,gy+gr],fill=lerp(c,(255,255,255),.2)+(255,),outline=(255,255,255,200),width=int(N*.004))
    for ang in (0,90,180):
        import math
        px=cx+math.cos(math.radians(ang-90))*(R+N*.04);py=cy+math.sin(math.radians(ang-90))*(R+N*.04)
        g.polygon([(px,py-N*.03),(px+N*.016,py),(px,py+N*.03),(px-N*.016,py)],fill=(226,190,102,255),outline=(120,84,24,255))
    out.alpha_composite(ring)
    return out.resize((S,S),Image.Resampling.LANCZOS)
if __name__=='__main__':
    (ROOT/'cutouts').mkdir(exist_ok=True)
    for el in COL:
        m=medallion(el);m.save(ROOT/'cutouts'/f'bebementaire-{el}.webp',quality=92,method=6);print(el)
