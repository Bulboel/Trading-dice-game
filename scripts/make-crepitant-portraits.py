"""v269 — Miniatures des dés Crépitants : la miniature d'origine devient un morceau de voie lactée (nébuleuses violettes, roses et cyan,
bande lumineuse, étoiles scintillantes), détails du personnage conservés par la luminosité. Sortie : assets/characters/<clé>-crep-128|512.webp
(même découpe et même transparence que l'originale). Même palette que le shader des modèles 3D (assets/variant-look.js).
Usage : python3 scripts/make-crepitant-portraits.py [clés…] (v338 : génère aussi les versions émeraude <clé>-crep2-128|512.webp)"""
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
A=lambda *v:np.array(v,np.float32)
# v338 : v1 = noir / violet / blanc (moins de rose) ; v2 « émeraude » = noir / vert, éclats dorés. Mêmes palettes que assets/variant-look.js.
# v340 : teintes vives (la galaxie prime sur les détails), v1 noir / violet vif / blanc, v2 noir / émeraude vif / or
PALETTES={'v1':dict(deep=A(.02,.0,.07),mid=A(.40,.08,.92),acc=A(.66,.36,1.),hi=A(.96,.93,1.),band=A(.55,.40,1.),s1=A(1,1,1),s2=A(.86,.80,1.),ht=.68,hw=.45,lit=A(.70,.62,1.)),
          'v2':dict(deep=A(.0,.035,.012),mid=A(.0,.62,.24),acc=A(.12,.95,.46),hi=A(1.,.80,.22),band=A(.10,.80,.38),s1=A(1.,.93,.62),s2=A(.88,1.,.90),ht=.66,hw=.55,lit=A(.55,.95,.62))}
def galaxy(key,size=512,pal='v1'):
    im=Image.open(CH/f'{key}-512.webp').convert('RGBA').resize((size,size),Image.Resampling.LANCZOS);a=np.asarray(im).astype(np.float32)/255;rgb=a[...,:3];alpha=a[...,3]
    h=w=size;rng=np.random.default_rng(zlib.crc32(key.encode()))
    L=(rgb*np.array([.299,.587,.114],np.float32)).sum(-1)
    n1=sum(field(rng,h,w,s)*k for s,k in((h//4,.5),(h//8,.25),(h//16,.15),(h//32,.1)));n2=sum(field(rng,h,w,s)*k for s,k in((h//6,.5),(h//12,.25),(h//24,.15),(h//48,.1)))
    n1=(n1-n1.min())/(n1.max()-n1.min());n2=(n2-n2.min())/(n2.max()-n2.min())
    yy,xx=np.mgrid[0:h,0:w].astype(np.float32);u=xx/w;v=yy/h
    band=np.exp(-((u*.9+v*.55-.95)*2.6+(n1-.5)*.9)**2)[...,None]
    P=PALETTES[pal]
    def mix(c0,c1,t):return c0*(1-t[...,None])+c1*t[...,None]
    gal=mix(P['deep'],P['mid'],smooth(.42,.8,n1));gal=mix(gal,P['acc'],smooth(.62,.9,n2)*.55);gal=mix(gal,P['hi'],smooth(P['ht'],.95,n1*n2*2)*P['hw'])
    gal=gal+band*P['band']*(.2+.8*n2[...,None])
    Lb=np.clip((L-.04)/.9,0,1)**.78
    out=gal*(.5+1.1*Lb[...,None])+(Lb**1.3)[...,None]*P['lit']*.32   # v340 : la galaxie domine, le personnage reste devinable
    # v340 : une multitude de tailles d'étoiles (poussière fine, petites, moyennes, et de rares grosses étoiles à croix)
    n=int(h*w/380);xs=rng.integers(0,w,n);ys=rng.integers(0,h,n);b=rng.random(n);col=np.where(rng.random((n,1))<.5,P['s1'],P['s2'])
    layers={.5:np.zeros((h,w,3),np.float32),.9:np.zeros((h,w,3),np.float32),1.5:np.zeros((h,w,3),np.float32),2.4:np.zeros((h,w,3),np.float32)}
    cross=np.zeros((h,w,3),np.float32)
    for x,y,bb,c in zip(xs,ys,b,col):
        if alpha[y,x]<.5:continue
        sig=.5 if bb<.55 else .9 if bb<.82 else 1.5 if bb<.95 else 2.4
        layers[sig][y,x]+=c*(1.+bb)
        if bb>.975:
            r=int(4+bb*4)
            for d in range(1,r+1):
                f=(1-d/(r+1))
                for dx,dy in((d,0),(-d,0),(0,d),(0,-d)):
                    X,Y=x+dx,y+dy
                    if 0<=X<w and 0<=Y<h:cross[Y,X]+=c*f*.9
    stars=sum(ndi.gaussian_filter(L_,(sg,sg,0))*(2*3.14159*sg*sg)*(.8 if sg<1 else 1.) for sg,L_ in layers.items())
    glow=ndi.gaussian_filter(stars,(3,3,0))*.7+ndi.gaussian_filter(cross,(.7,.7,0))*1.4
    out=out+stars+glow
    out=np.clip(out/(1+out*.12),0,1)  # douce compression des hautes lumières
    res=np.dstack([out,alpha]);return Image.fromarray((res*255).astype(np.uint8),'RGBA')
if __name__=='__main__':
    keys=json.loads(subprocess.check_output(['node',str(ROOT/'scripts/list-shiny-portraits.cjs')]))
    import sys
    if len(sys.argv)>1:keys=[k for k in keys if k in sys.argv[1:]]  # v345 : seulement les clés données (ex. loup larve guerrier-fantome)
    n=0
    for k in keys:
        if not (CH/f'{k}-512.webp').exists():print('absent',k);continue
        for pal,suf in(('v1','crep'),('v2','crep2')):
            big=galaxy(k,512,pal);big.save(CH/f'{k}-{suf}-512.webp',quality=88,method=6)
            small=big.resize((128,128),Image.Resampling.LANCZOS);small.save(CH/f'{k}-{suf}-128.webp',quality=88,method=6)
        n+=1
    print('miniatures Crépitantes :',n)
