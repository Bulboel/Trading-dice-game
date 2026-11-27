"""v342 — Médaillons des créatures d'Histoire rendues en 3D (scripts/render-foes.cjs) : fond dégradé, cadre doré, créature en entier.
Sortie : assets/characters/<clé>-512.webp et -128.webp (RGBA, coins transparents). Usage : python3 scripts/medallion-foes.py"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
ROOT=Path(__file__).resolve().parents[1]/'assets'/'characters'
FOES={'squelette':(150, 115, 75),'drone-pentagone':(150, 120, 210),'momie':(200, 90, 60),'chevalier-d-egide':(90, 170, 130),'maitre-d-armes':(150, 115, 75),'minotaure':(200, 90, 60),'necromancienne':(60, 110, 200),'loup':(120,140,170),'larve':(190,120,70),'guerrier-fantome':(60,190,170),'canourson':(170,130,90),'canours':(140,100,70),'ver-geant':(120,150,90),'gobelin':(110,150,70),'ogre':(130,110,90),'maestro':(70,130,200),'rat-a-forfalla':(150,200,230),
 'krak':(150, 115, 75),'krek':(90, 170, 130),'soldat-de-lunargent':(140, 195, 225),'velcan':(200, 90, 60),'transporteur':(150, 120, 210),'pelerin':(90, 170, 130),'faux-enfants':(60, 110, 200),'harpe-de-bulbalina':(90, 170, 130),'naia':(140, 195, 225),'lamie':(60, 110, 200),'drahul':(150, 115, 75),'griselda':(200, 90, 60),'sans-chiffre':(150, 120, 210),'golem-de-pierre':(150, 115, 75),'heaum':(150, 120, 210),'licorne-enrage':(90, 170, 130),'bolduc-papier':(200, 90, 60),'grimgors-papier':(60, 110, 200),'eberien-papier':(140, 195, 225),'kala-papier':(150, 115, 75),'jhimm-papier':(90, 170, 130),'elementaire-feu-majeur':(200, 90, 60),'elementaire-glace-majeur':(140, 195, 225),'erevan':(150, 120, 210)}
N=1024
def lerp(a,b,t):return tuple(int(a[i]*(1-t)+b[i]*t) for i in range(3))
def medallion(key,c):
    dark=lerp(c,(12,10,28),.8);mid=lerp(c,(255,255,255),.1)
    yy,xx=np.mgrid[0:N,0:N];t=np.clip(np.hypot(xx-N/2,yy-N*.44)/(N/2),0,1)[...,None]
    base=np.array(mid,np.float32)*(1-t)+np.array(dark,np.float32)*t
    img=Image.fromarray(np.dstack([base,np.full((N,N),255)]).astype(np.uint8),'RGBA')
    r3=Image.open(ROOT/'cutouts'/'renders'/f'{key}.png').convert('RGBA');r3=r3.crop(r3.getchannel('A').getbbox())
    sc=N*.72/max(r3.size);r3=r3.resize((int(r3.width*sc),int(r3.height*sc)),Image.Resampling.LANCZOS)
    x0=(N-r3.width)//2;y0=int(N*.53-r3.height/2)
    sh=Image.new('RGBA',img.size,(0,0,0,0));sh.paste(r3.filter(ImageFilter.GaussianBlur(N*.012)),(x0,y0+int(N*.02)))
    a=np.asarray(sh).copy();a[...,:3]=0;a[...,3]=(a[...,3]*.4).astype(np.uint8);img.alpha_composite(Image.fromarray(a,'RGBA'));img.alpha_composite(r3,(x0,y0))
    mask=Image.new('L',(N,N),0);R=N*.455;cx=cy=N/2;ImageDraw.Draw(mask).ellipse([cx-R,cy-R,cx+R,cy+R],fill=255)
    out=Image.new('RGBA',(N,N),(0,0,0,0));out.paste(img,(0,0),mask);g=ImageDraw.Draw(out)
    for rad,col in [(R+N*.034,(120,84,24)),(R+N*.026,(226,190,102)),(R+N*.016,(250,226,150)),(R+N*.008,(200,150,60)),(R,(110,76,22))]:
        g.ellipse([cx-rad,cy-rad,cx+rad,cy+rad],outline=col+(255,),width=int(N*.011))
    big=out.resize((512,512),Image.Resampling.LANCZOS);big.save(ROOT/f'{key}-512.webp',quality=88,method=6)
    big.resize((128,128),Image.Resampling.LANCZOS).save(ROOT/f'{key}-128.webp',quality=88,method=6)
import sys
for k,c in FOES.items():
    if len(sys.argv)>1 and k not in sys.argv[1:]:continue
    medallion(k,c);print('médaillon',k)
