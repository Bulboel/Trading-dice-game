"""v270 — Miniatures des variantes de Max et d'Orcus refaites à partir des nouvelles illustrations :
  - Max des Brumes : Max passé dans la brume (tons menthe pâle, voile de brouillard, cadre argenté) ;
  - Idole d'or d'Orcus : Orcus coulé dans l'or (monochrome doré, cadre doré brillant).
Sortie : assets/characters/max-brumes-128|512.webp et orcus-or-128|512.webp (même transparence que l'original).
Usage : python3 scripts/variant-portraits-max-orcus.py"""
from pathlib import Path
from PIL import Image
import numpy as np
from scipy import ndimage as ndi
CH=Path(__file__).resolve().parents[1]/'assets'/'characters'
def ramp(L,stops):
    xs=[s[0] for s in stops];out=np.zeros(L.shape+(3,),np.float32)
    for c in range(3):out[...,c]=np.interp(L,xs,[s[1][c] for s in stops])
    return out
def make(src,dst,stops,mix,fog=0.0,seed=1):
    im=Image.open(CH/f'{src}-512.webp').convert('RGBA');a=np.asarray(im).astype(np.float32)/255;rgb=a[...,:3];alpha=a[...,3]
    L=(rgb*np.array([.299,.587,.114],np.float32)).sum(-1);L=np.clip((L-.03)/.92,0,1)
    tinted=ramp(L,stops)/255.0;out=rgb*(1-mix)+tinted*mix
    if fog>0:
        rng=np.random.default_rng(seed);h,w=L.shape
        f=ndi.zoom(rng.random((h//64+3,w//64+3)).astype(np.float32),(h/(h//64+1),w/(w//64+1)),order=3)[:h,:w];f=ndi.gaussian_filter(f,6);f=(f-f.min())/(f.max()-f.min())
        yy=np.mgrid[0:h,0:w][0].astype(np.float32)/h;veil=(f*(.35+.65*yy))[...,None]*fog
        out=out*(1-veil)+np.array([.86,1.,.94],np.float32)*veil
    res=Image.fromarray((np.dstack([np.clip(out,0,1),alpha])*255).astype(np.uint8),'RGBA')
    res.save(CH/f'{dst}-512.webp',quality=90,method=6);res.resize((128,128),Image.Resampling.LANCZOS).save(CH/f'{dst}-128.webp',quality=90,method=6)
if __name__=='__main__':
    make('max','max-brumes',[(0,(18,52,48)),(.45,(110,176,160)),(.8,(206,244,228)),(1,(250,255,250))],.82,fog=.55,seed=4)
    make('orcus','orcus-or',[(0,(30,20,4)),(.35,(150,106,22)),(.7,(236,186,70)),(1,(255,243,184))],.94)
    print('ok')
