"""v267 — Détoure les miniatures livrées sur fond clair (cadre rond sur blanc ou damier de transparence simulé) :
le fond relié aux bords de l'image devient transparent, le liseré est adouci. Résultat : assets/characters/cutouts/<clé>.webp (RGBA),
repris ensuite par scripts/build-character-assets.py (tailles 128 et 512).
Usage : python3 scripts/cutout-miniatures.py"""
from pathlib import Path
from PIL import Image
import numpy as np
from scipy import ndimage as ndi
ROOT=Path(__file__).resolve().parents[1]/'assets'
SRC=ROOT/'Models/Characters';OUT=ROOT/'characters/cutouts'
MINIS={'lathandre':'Lathandre miniature.png','shauntea':'Shauntea miniature.png','jordan':'Jordan miniature.png','max':'Max commun miniature.png',
       'max-alastor':'miniature max alastor 2.PNG','orcus':'miniature orcus 2.PNG'}
# Miniatures dont l'intérieur du cadre est un faux damier de transparence : fond de remplacement (dégradé radial centre→bord).
FILL_INTERIOR={'max':((190,150,104),(92,64,44))}
def fill_interior(im,colors):
    a=np.asarray(im).astype(np.float32);rgb=a[...,:3];h,w=rgb.shape[:2]
    light=(rgb.min(axis=2)>=205)&((rgb.max(axis=2)-rgb.min(axis=2))<=26)&(a[...,3]>200)
    lab,n=ndi.label(light);sizes=ndi.sum(light,lab,range(1,n+1));big=np.isin(lab,[i+1 for i,v in enumerate(sizes) if v>h*w*.0008])
    big=ndi.binary_dilation(big,iterations=2)&(rgb.min(axis=2)>=150)   # reprend le liseré gris autour du personnage
    m=ndi.gaussian_filter(big.astype(np.float32),1.2)[...,None]
    yy,xx=np.mgrid[0:h,0:w];r=np.clip(np.hypot((xx-w/2)/(w/2),(yy-h*.45)/(h/2)),0,1)[...,None]
    c0=np.array(colors[0],np.float32);c1=np.array(colors[1],np.float32);bgc=c0*(1-r)+c1*r
    out=rgb*(1-m)+bgc*m
    return Image.fromarray(np.dstack([out.clip(0,255),a[...,3]]).astype(np.uint8),'RGBA')
def cutout(path):
    im=Image.open(path).convert('RGBA');a=np.asarray(im).astype(np.int16);rgb=a[...,:3]
    if (a[...,3]<250).mean()>.05:  # déjà détouré : on garde l'alpha existant
        return im
    light=(rgb.min(axis=2)>=214)&((rgb.max(axis=2)-rgb.min(axis=2))<=22)
    lab,n=ndi.label(light);border=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
    bg=np.isin(lab,list(border))
    # le fond isolé à l'intérieur des ornements du cadre (entre le cercle et les pointes) est aussi du fond : taches claires étendues
    holes=ndi.binary_fill_holes(~bg)&bg  # (vide : bg relié aux bords) ; on garde la logique simple
    alpha=(~bg).astype(float)
    alpha=ndi.binary_opening(alpha>.5,iterations=1).astype(float)           # supprime les poussières
    alpha=ndi.binary_erosion(alpha>.5,iterations=1).astype(float)           # mange le liseré blanc
    alpha=ndi.gaussian_filter(alpha,.9)                                      # bord adouci
    out=np.dstack([a[...,:3].astype(np.uint8),np.clip(alpha*255,0,255).astype(np.uint8)])
    return Image.fromarray(out,'RGBA')
if __name__=='__main__':
    OUT.mkdir(parents=True,exist_ok=True)
    for key,name in MINIS.items():
        im=cutout(SRC/name)
        if key in FILL_INTERIOR:im=fill_interior(im,FILL_INTERIOR[key])
        im.save(OUT/f'{key}.webp',quality=92,method=6);print(key,im.size)
