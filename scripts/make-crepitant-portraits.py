"""v269 — Miniatures des dés Crépitants : la miniature d'origine devient un morceau de voie lactée (nébuleuses violettes, roses et cyan,
bande lumineuse, étoiles scintillantes), détails du personnage conservés par la luminosité. Sortie : assets/characters/<clé>-crep-128|512.webp
(même découpe et même transparence que l'originale). Même palette que le shader des modèles 3D (assets/variant-look.js).
Usage : python3 scripts/make-crepitant-portraits.py"""
import json, subprocess, zlib
from pathlib import Path
from PIL import Image
import numpy as np
from scipy import ndimage as ndi
ROOT=Path(__file__).resolve().parents[1]; CH=ROOT/'assets'/'characters'
def smooth(a,b,x):
    t=np.clip((x-a)/(b-a),0,1);return t*t*(3-2*t)
def field(rng,h,w,scale):
    g=rng.random((h//scale+3,w//scale+3)).astype(np.float32)
    return ndi.zoom(g,(h/(g.shape[0]-2),w/(g.shape[1]-2)),order=3)[:h,:w]
def galaxy(key,size=512):
    im=Image.open(CH/f'{key}-512.webp').convert('RGBA').resize((size,size),Image.Resampling.LANCZOS);a=np.asarray(im).astype(np.float32)/255;rgb=a[...,:3];alpha=a[...,3]
    h=w=size;rng=np.random.default_rng(zlib.crc32(key.encode()))
    L=(rgb*np.array([.299,.587,.114],np.float32)).sum(-1)
    n1=sum(field(rng,h,w,s)*k for s,k in((h//4,.5),(h//8,.25),(h//16,.15),(h//32,.1)));n2=sum(field(rng,h,w,s)*k for s,k in((h//6,.5),(h//12,.25),(h//24,.15),(h//48,.1)))
    n1=(n1-n1.min())/(n1.max()-n1.min());n2=(n2-n2.min())/(n2.max()-n2.min())
    yy,xx=np.mgrid[0:h,0:w].astype(np.float32);u=xx/w;v=yy/h
    band=np.exp(-((u*.9+v*.55-.95)*2.6+(n1-.5)*.9)**2)[...,None]
    deep=np.array([.02,.01,.10],np.float32);vio=np.array([.28,.07,.5],np.float32);mag=np.array([.75,.18,.62],np.float32);cy=np.array([.1,.55,.85],np.float32)
    def mix(c0,c1,t):return c0*(1-t[...,None])+c1*t[...,None]
    gal=mix(deep,vio,smooth(.25,.75,n1));gal=mix(gal,mag,smooth(.55,.9,n2)*.7);gal=mix(gal,cy,smooth(.62,.95,n1*n2*2)*.6)
    gal=gal+band*np.array([.45,.35,.75],np.float32)*(.4+n2[...,None])
    Lb=np.clip((L-.04)/.9,0,1)**.78
    out=gal*(.22+2.05*Lb[...,None])+gal*.14   # détails du personnage mieux conservés
    # étoiles : points lumineux avec croix et halo, uniquement sur le personnage / le cadre
    stars=np.zeros((h,w,3),np.float32);n=int(h*w/950)
    xs=rng.integers(0,w,n);ys=rng.integers(0,h,n);b=rng.random(n)**2.2;col=np.where(rng.random((n,1))<.5,np.array([.85,.95,1.],np.float32),np.array([1.,.78,.95],np.float32))
    for x,y,bb,c in zip(xs,ys,b,col):
        if alpha[y,x]<.5:continue
        stars[y,x]+=c*(.5+bb*2.5)
        if bb>.55:
            r=int(2+bb*5)
            for d in range(1,r+1):
                f=(1-d/(r+1))*bb
                for dx,dy in((d,0),(-d,0),(0,d),(0,-d)):
                    X,Y=x+dx,y+dy
                    if 0<=X<w and 0<=Y<h:stars[Y,X]+=c*f*1.4
    glow=ndi.gaussian_filter(stars,(1.4,1.4,0))*1.8+ndi.gaussian_filter(stars,(4,4,0))*2.2
    out=out+stars+glow
    out=np.clip(out/(1+out*.12),0,1)  # douce compression des hautes lumières
    res=np.dstack([out,alpha]);return Image.fromarray((res*255).astype(np.uint8),'RGBA')
if __name__=='__main__':
    keys=json.loads(subprocess.check_output(['node',str(ROOT/'scripts/list-shiny-portraits.cjs')]))
    n=0
    for k in keys:
        if not (CH/f'{k}-512.webp').exists():print('absent',k);continue
        big=galaxy(k,512);big.save(CH/f'{k}-crep-512.webp',quality=88,method=6)
        small=big.resize((128,128),Image.Resampling.LANCZOS);small.save(CH/f'{k}-crep-128.webp',quality=88,method=6);n+=1
    print('miniatures Crépitantes :',n)
