"""v349 — Illustrations des adversaires de l’Histoire (assets/story/cards/pNN.webp), reprises des cartes de la Triade :
toute l’illustration est gardée (plus de bande recadrée qui coupait les têtes) ; le losange des valeurs (en haut à droite)
et le badge d’élément (en haut à gauche) sont effacés par remplissage progressif depuis les bords, puis le cadre est retiré.
Usage : python3 scripts/crop-story-cards.py <dossier des cartes HQ de la Triade> p02 p05 …  (écrit dans assets/story/cards/)"""
import sys
from PIL import Image,ImageDraw,ImageFilter
import numpy as np
from scipy import ndimage as ndi
SRC=sys.argv[1].rstrip('/')+'/' if len(sys.argv)>1 else ''
def art(key,L=.058,R=.942,T=.05,B=.78,dia=(.66,.006,.995,.266)):
    im=Image.open(SRC+key+'.webp').convert('RGB');W,H=im.size
    a=np.asarray(im).astype(np.float32)/255
    m=np.zeros((H,W),bool);x0,y0,x1,y1=[int(v*s) for v,s in zip(dia,(W,H,W,H))]
    mk=Image.new('L',(W,H),0);d=ImageDraw.Draw(mk);cx,cy=(x0+x1)/2,(y0+y1)/2;d.polygon([(cx,y0),(x1,cy),(cx,y1),(x0,cy)],fill=255);d.ellipse([0,0,int(.175*W),int(.125*H)],fill=255)  # badge d’élément en haut à gauche
    mk=mk.filter(ImageFilter.MaxFilter(25))
    m=np.asarray(mk)>0
    out=a.copy();known=(~m).astype(np.float32)
    for sg in (256,128,64,32,16,8,4):
        num=ndi.gaussian_filter(out*known[...,None],(sg,sg,0));den=ndi.gaussian_filter(known,sg)[...,None]+1e-6
        fill=num/den;out=np.where((m[...,None])&(den>.05),fill,out)
    # bruit léger pour éviter l'aspect lissé
    rng=np.random.default_rng(1);out=np.where(m[...,None],np.clip(out+rng.normal(0,.012,out.shape),0,1),out)
    res=Image.fromarray((out*255).astype(np.uint8)).crop((int(L*W),int(T*H),int(R*W),int(B*H)))
    return res
if __name__=='__main__':
    import pathlib;OUT=str(pathlib.Path(__file__).resolve().parents[1]/'assets'/'story'/'cards')
    for k in sys.argv[2:]:
        r=art(k);r.thumbnail((900,900));r.save(OUT+'/'+k+'.webp',quality=86,method=6);print(k,r.size)
