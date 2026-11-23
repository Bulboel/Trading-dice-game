#!/usr/bin/env python3
"""v428 — Icônes de l'application : logo (ic_launcher_foreground) sur un fond vert pomme en dégradé doux.
Génère les icônes classiques (carrée arrondie et ronde) de chaque densité, et l'icône 512 × 512 de la fiche Play Store.
L'icône adaptative (Android 8+) utilise le même dégradé, décrit dans res/drawable/ic_launcher_background.xml."""
from PIL import Image, ImageDraw, ImageFilter
import os
RES='android/app/src/main/res'
TOP=(178,230,104);MID=(118,190,72);BOT=(46,122,60)   # vert pomme clair → vert profond
def gradient(n):
    im=Image.new('RGB',(n,n));px=im.load()
    for y in range(n):
        for x in range(n):
            t=(0.62*y+0.38*x)/n                       # diagonale douce, lumière en haut à gauche
            if t<.55: a,b,k=TOP,MID,t/.55
            else: a,b,k=MID,BOT,(t-.55)/.45
            px[x,y]=tuple(round(a[i]+(b[i]-a[i])*k) for i in range(3))
    glow=Image.new('L',(n,n),0);ImageDraw.Draw(glow).ellipse((-n*.25,-n*.35,n*.85,n*.6),fill=70)   # léger halo clair
    glow=glow.filter(ImageFilter.GaussianBlur(n*.12))
    return Image.composite(Image.new('RGB',(n,n),(236,255,214)),im,glow)
def icon(n,fg,shape):
    bg=gradient(n).convert('RGBA');f=fg.resize((n,n),Image.LANCZOS);bg.alpha_composite(f)
    m=Image.new('L',(n,n),0);d=ImageDraw.Draw(m)
    if shape=='round':d.ellipse((0,0,n-1,n-1),fill=255)
    elif shape=='square':d.rounded_rectangle((0,0,n-1,n-1),radius=round(n*.18),fill=255)
    else:d.rectangle((0,0,n,n),fill=255)
    out=Image.new('RGBA',(n,n),(0,0,0,0));out.paste(bg,(0,0),m);return out
for d in sorted(os.listdir(RES)):
    if not d.startswith('mipmap-') or 'anydpi' in d:continue
    fgp=os.path.join(RES,d,'ic_launcher_foreground.png');fg=Image.open(fgp).convert('RGBA')
    n=Image.open(os.path.join(RES,d,'ic_launcher.png')).size[0]
    icon(n,fg,'square').save(os.path.join(RES,d,'ic_launcher.png'))
    icon(n,fg,'round').save(os.path.join(RES,d,'ic_launcher_round.png'))
big=Image.open(os.path.join(RES,'mipmap-xxxhdpi','ic_launcher_foreground.png')).convert('RGBA')
icon(512,big,'full').convert('RGB').save('store/icone-512.png')
print('icônes générées')
