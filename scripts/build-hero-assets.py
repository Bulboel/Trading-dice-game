"""v300 — Héros du joueur : extrait les clips d'animation du modèle neutre (attente, marche, attaque, victoire) en GLB légers.
Sortie : assets/characters/hero-<type><n>.glb (même squelette que le modèle de base). Ne touche à aucun autre fichier.
Usage : python3 scripts/build-hero-assets.py   (puis python3 scripts/optimize-models.py pour la version web du modèle)"""
import re, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[1]
src = (ROOT/'scripts/build-character-assets.py').read_text(encoding='utf-8')
head = src[:src.index("OUTPUT.mkdir")]
head = head.replace("for key,filename in PORTRAITS", "for key,filename in []")
ns = {'__file__': str(ROOT/'scripts/build-character-assets.py')}
exec(compile(head.replace("ROOT = pathlib.Path(__file__).resolve().parents[1]", f"ROOT = pathlib.Path(r'{ROOT}')"), 'bca', 'exec'), ns)
animation_only, find, OUTPUT = ns['animation_only'], ns['find'], ns['OUTPUT']
HERO = {
 'idle':   [('Modele neutre idle 1.glb','Happy_Sway_Standing'), ('Modele neutre idle 2.glb','Idle_10')],
 'walk':   [('Modele neutre marche course et rig.glb','Walking'), ('modele neutre marche 2.glb','Confident_Strut'), ('Modele neutre marche course et rig.glb','Running')],
 'spell':  [('Modele neutre attaque 1.glb','Charged_Upward_Slash'), ('Modele neutre attaque 2.glb','Spartan_Kick'), ('Modele neutre attaque 3.glb','mage_soell_cast_2'), ('modele neutre attaque 4.glb','Charged_Spell_Cast')],
 'victory':[('Modele neutre victoire.glb','Hip_Hop_Dance_1'), ('Modele neutre victoire 2.glb','Magic_Genie'), ('Modele neutre victoire 3.glb','FunnyDancing_03'), ('Modele victoire 2.glb','Handbag_Walk')],
}
for kind, items in HERO.items():
    for i, (f, clip) in enumerate(items, 1):
        animation_only(find(f), clip, OUTPUT/f'hero-{kind}{i}.glb')
print('Clips héros :', {k: len(v) for k, v in HERO.items()})
