#!/usr/bin/env python3
"""v451 — Chapitre VI « Erevan et Mirrhol », raconté par Bolduc (d’après son récit) : parties c6p1 à c6p11, 3 duels.
Écrit les parties c6 dans assets/story-data-v193.js (les remplace si elles existent déjà).
Relancer ensuite : python3 scripts/tag-story-emotions.py && python3 scripts/story-sprite-bounds.py"""
import json
P = 'assets/story-data-v193.js'
head, rest = open(P, encoding='utf-8').read().split('\n', 1)
PRE = 'window.HACKENIA_STORY='
data = json.loads(rest[len(PRE):].rstrip('\n')[:-1])
data = [p for p in data if not p['id'].startswith('c6')]

# Gabarits d'illustration repris des chapitres précédents (repli quand une humeur n'a pas de pose dédiée)
TPL = {}
for p in data:
    for k in ('intro', 'victory', 'lose', 'silence'):
        for b in p.get(k) or []:
            for c in b.get('cast', []):
                if c.get('n') and not c.get('art') and c['n'] not in TPL and c.get('img'):
                    TPL[c['n']] = {x: c[x] for x in ('img', 'sz', 'pos') if x in c}
TPL['Bulbalina'] = {'img': 'url("assets/story/emo/bulbalina-3.webp")', 'sz': 'contain', 'pos': 'center bottom'}
TPL['Sans-chiffre'] = {'img': 'url("assets/story/emo/sans-chiffre-1.webp")', 'sz': 'contain', 'pos': 'center bottom'}
for n in ('Kala', 'Ébérien', 'Bolduc', 'Grimgors', 'Jhimm', 'Maebril'):
    assert n in TPL, n

def bg(img, tint):
    return f'linear-gradient({tint}), url("{img}")'
FARM = ('La ferme des collines', ['cabin'], bg('assets/story/cabin-background.webp', 'rgba(20, 14, 8, 0.1), rgba(12, 8, 4, 0.45)'))
ROAD = ('La route de Mirrhol', ['forest'], bg('assets/story/mirrhol-road-background.webp', 'rgba(14, 12, 18, 0.12), rgba(10, 8, 14, 0.5)'))
KERZ = ('Kierzan', ['night'], bg('assets/story/berdesa-village-background.webp', 'rgba(70, 14, 4, 0.38), rgba(20, 4, 2, 0.72)'))
JOURNAL = 'Journal de Kala'

def beat(place, speaker, text, *cast, art=None):
    l, c, b = place
    out = {'s': speaker, 't': text, 'l': l, 'c': c, 'bg': b, 'cast': []}
    if art:
        out['cast'].append({'art': art, 'alt': art.split('/')[-1]})
    if speaker == JOURNAL and not art:
        # Le journal : Kala prend des notes (illustration dédiée), les autres gardent leur humeur de la scène
        out['cast'].append({'n': 'Kala', 'p': 'assets/story/kala-journal-chibi.webp', 'k': ['story-journal'], 'e': 'neutral'})
    for name, mood in cast:
        if speaker == JOURNAL and name == 'Kala':
            continue
        e = dict(TPL[name]); e['n'] = name; e['k'] = ['is-speaking'] if name == speaker else (['is-listener'] if speaker != JOURNAL else [])
        e['e'] = 'neutral'; e['mm'] = mood; out['cast'].append(e)
    return out

K, E, B, G, J, MA, V, BU, SC = 'Kala', 'Ébérien', 'Bolduc', 'Grimgors', 'Jhimm', 'Maebril', 'Velmarys', 'Bulbalina', 'Sans-chiffre'
K, E, B, G, J, MA, BU, OR, BO, EV, LI = 'Kala', 'Ébérien', 'Bolduc', 'Grimgors', 'Jhimm', 'Maebril', 'Bulbalina', 'Orven', 'Bosco', 'Erevan', 'La licorne'
def emo(n): return {'img': f'url("assets/story/emo/{n}.webp")', 'sz': 'contain', 'pos': 'center bottom'}
SQ, MO, MI, MAI, CH, DR = 'Les squelettes', 'Auguste', 'Le minotaure', 'Le vieux maître d’armes', 'Les chevaliers', 'Les drones'
for n, k in ((SQ, 'squelette-2'), (MO, 'momie-2'), (MI, 'minotaure-2'), (MAI, 'maitre-d-armes-2'), (CH, 'chevalier-d-egide-2'), (DR, 'drone-pentagone-2')): TPL[n] = emo(k)
TPL[OR] = emo('orven-2'); TPL[BO] = emo('bosco-2'); TPL[EV] = emo('erevan-2'); TPL[LI] = emo('licorne-enrage-1')
JB = 'Journal de Bolduc'
WOODS = ('Les bois de la route de Mirrhol', ['forest'], bg('assets/story/forest-background.webp', 'rgba(14, 16, 10, 0.12), rgba(8, 10, 6, 0.45)'))
DARK = ('Le domaine d’Erevan', ['night'], bg('assets/story/erevan-cave-background.webp', 'rgba(10, 8, 20, 0.05), rgba(6, 4, 14, 0.4)'))
FOOT = ('Le pied de la statue', ['night'], bg('assets/story/egide-foot-background.webp', 'rgba(20, 12, 4, 0.08), rgba(10, 6, 2, 0.45)'))
LEG = ('L’intérieur de la statue', ['night'], bg('assets/story/egide-leg-background.webp', 'rgba(20, 14, 6, 0.06), rgba(10, 6, 2, 0.4)'))
ARMORY = ('La salle d’armes', ['night'], bg('assets/story/egide-armory-background.webp', 'rgba(20, 12, 4, 0.06), rgba(10, 6, 2, 0.4)'))
MUSH = ('Les champignons de métal', ['night'], bg('assets/story/metal-mushrooms-background.webp', 'rgba(8, 10, 24, 0.05), rgba(4, 6, 14, 0.4)'))
CHEESE = ('Dans la meule géante', ['night'], bg('assets/story/cheese-interior-background.webp', 'rgba(40, 24, 4, 0.04), rgba(20, 12, 2, 0.38)'))
ARENA = ('L’arène des meules', ['night'], bg('assets/story/cheese-arena-background.webp', 'rgba(40, 24, 4, 0.04), rgba(20, 12, 2, 0.38)'))
FIELD = ('Le champ de bataille d’Erevan', ['night'], bg('assets/story/erevan-battlefield-background.webp', 'rgba(20, 4, 14, 0.06), rgba(10, 2, 8, 0.42)'))
def bb(place, speaker, text, *cast, art=None):
    """Réplique du récit de Bolduc : quand il raconte, il est à l’image avec l’humeur de la scène."""
    if speaker == JB and not art and B not in [n for n, _ in cast]:
        cast = ((B, 'happy'),) + cast
    out = beat(place, speaker, text, *cast, art=art)
    if speaker == JB:
        for c in out['cast']:
            if c.get('n') == B: c['k'] = ['is-speaking']
    return out
parts = []
parts.append({'id': 'c6p1', 'chapter': 6, 'title': 'Partie 1 : Un sang maudit ?', 'intro': [
    bb(WOODS, JB, 'Après ce rude combat contre les ogres, la licorne maléfique et la nécromancienne, nous étions tous fourbus.', (B, 'sad'), (J, 'sad')),
    bb(WOODS, OR, 'Jhimm… votre sang ne serait-il pas maudit ?', (OR, 'haughty'), (J, 'scared')),
    bb(WOODS, JB, 'Grimgors l’a touché pour vérifier. Pas de malédiction en vue… mais ça lui a tout de même refermé la plaie !', (G, 'neutral'), (J, 'neutral')),
    bb(WOODS, G, 'Pour en avoir le cœur net, nous irons dans un grand temple, à Forfalla.', (G, 'neutral'), (J, 'neutral')),
    bb(WOODS, LI, 'Aidez-moi, je vous en supplie : mon petit est encore prisonnier. Il me faut de la magie pour aller le sauver.', (LI, 'sad'), (OR, 'friendly')),
    bb(WOODS, E, 'J’irai. Orven aussi. Gardez mon médaillon de Maebril pour communiquer : Orven a le même.', (E, 'neutral'), (OR, 'friendly')),
    bb(WOODS, JB, 'On suppose que Maebril acceptera de faire le messager. Et pouf : Ébérien, Orven et la licorne ont disparu.', (B, 'sad'), (K, 'neutral')),
]})
parts.append({'id': 'c6p2', 'chapter': 6, 'title': 'Partie 2 : Le pique-nique', 'intro': [
    bb(WOODS, JB, 'Je me sentais un peu perdu sans Ébérien… Alors je me suis ressaisi !', (B, 'sad')),
    bb(WOODS, B, 'Et si on faisait un pique-nique ? Un petit temps de repos, ça nous fera du bien !', (B, 'happy'), (J, 'happy'), (G, 'neutral')),
    bb(WOODS, JB, 'Kala a repéré quelque chose dans un arbre. Pas la peine de s’approcher sans être vue, en terrain découvert c’était peine perdue. Alors j’ai gueulé :', (K, 'neutral'), (B, 'happy')),
    bb(WOODS, B, 'Y a quelqu’un ?', (B, 'happy'), (K, 'surprised')),
    bb(WOODS, BO, 'Je cherche la compagnie du rêve !', (BO, 'surprised'), (B, 'happy')),
    bb(WOODS, JB, 'Il tombait bien, celui-là ! Grimgors a pris la parole pour le questionner… avec tact.', (G, 'neutral'), (BO, 'shy')),
    bb(WOODS, BO, 'Je suis Bosco, de la guilde des chasseurs de primes du Griffon Doré. Maebril m’a dit que vous étiez dans le coin. J’aimerais faire un bout de chemin avec des aventuriers aguerris comme vous !', (BO, 'happy'), (G, 'proud')),
    bb(WOODS, JB, 'J’étais trop fier ! Nous sommes célèbres !', (B, 'happy'), (BO, 'happy')),
    bb(WOODS, B, 'Bienvenue, Bosco ! Un petit apéro ?', (B, 'happy'), (BO, 'happy')),
]})
parts.append({'id': 'c6p3', 'chapter': 6, 'title': 'Partie 3 : La voix dans le ciel', 'intro': [
    bb(WOODS, EV, 'VOUS ! Vous avez semé le bazar parmi MES licornes !', (EV, 'fight'), (B, 'angry')),
    bb(WOODS, JB, 'J’ai été coupé dans mon élan par une grosse voix venue du ciel. Ça ne m’a pas plu du tout.', (B, 'angry')),
    bb(WOODS, B, 'T’es qui, toi ?', (B, 'angry'), (EV, 'haughty'), (J, 'scared')),
    bb(WOODS, EV, 'Je suis Erevan. Un dieu, petit nain.', (EV, 'haughty'), (B, 'angry')),
    bb(WOODS, JB, 'Jhimm et Grimgors, qui ont l’habitude de traiter les dieux avec plus de respect, en ont blêmi. Moi, son apparition elfique ne m’impressionnait pas. Je ne lui faisais pas confiance.', (J, 'scared'), (G, 'surprised'), (B, 'angry')),
    bb(WOODS, G, 'C’est le dieu de l’espièglerie…', (G, 'neutral'), (EV, 'friendly')),
    bb(WOODS, EV, 'Je vais vérifier que vous dites la vérité sur mes licornes.', (EV, 'friendly'), (B, 'angry')),
    bb(WOODS, JB, 'Lui, évidemment, on devait le croire direct…', (B, 'angry')),
]})
parts.append({'id': 'c6p4', 'chapter': 6, 'title': 'Partie 4 : La statue colossale', 'intro': [
    bb(DARK, JB, 'Téléportés, ou revenus à nous ? Toujours est-il qu’on s’est retrouvés dans un endroit sombre, une sorte d’immense grotte. Sans nos chevaux… mais avec ce pauvre Bosco, qui n’avait même pas eu le temps de manger.', (B, 'scared'), (BO, 'shy')),
    bb(DARK, JB, 'Nous lui avons raconté l’épisode des licornes.', (BO, 'surprised'), (K, 'neutral')),
    bb(DARK, BO, 'Et si on coupait la tête de cette girafe lumineuse, là-bas ?', (BO, 'thinking'), (K, 'surprised')),
    bb(DARK, J, 'Restons discrets.', (J, 'neutral'), (G, 'neutral')),
    bb(DARK, G, 'J’allume ma torche.', (G, 'neutral'), (J, 'neutral')),
    bb(DARK, B, 'Moi, je veux avancer !', (B, 'happy'), (G, 'neutral')),
    bb(DARK, JB, 'Avec un peu plus de lumière (merci Jhimm et Grimgors), nous avons distingué un sentier. Nous l’avons emprunté en restant sur nos gardes.', (J, 'neutral'), (G, 'neutral')),
    bb(DARK, JB, 'Après une bonne marche, Bosco a aperçu une énorme statue au loin. Deux kilomètres plus tard : la plus colossale statue de notre vie. Elle représentait Égide.', (BO, 'surprised'), (B, 'happy')),
    bb(DARK, J, 'Une statue d’Égide, ici ? C’est bizarre… Une illusion de l’autre dieu coquin ?', (J, 'neutral'), (G, 'neutral')),
    bb(DARK, JB, 'Encore un kilomètre jusqu’à ses gros pieds. J’ai touché direct pour trouver une porte secrète, aussitôt imité par Bosco. Il me plaît, ce p’tit gars : en plus de ne pas être grand, il est tactile comme moi !', (B, 'happy'), (BO, 'happy')),
    bb(DARK, K, 'Ne touchez à rien ! Combien de fois faudra-t-il le répéter ?', (K, 'neutral'), (B, 'sad'), (BO, 'shy')),
    bb(DARK, JB, 'Les trois grands nous ont grondés. Pfff… En contournant le pied, nous avons découvert une image de Jhimm sur le talon. Forcément, lui, il a eu l’autorisation de Grimgors pour la toucher !', (J, 'happy'), (G, 'proud'), (B, 'angry')),
]})
parts.append({'id': 'c6p5', 'chapter': 6, 'title': 'Partie 5 : Le pied d’Égide', 'intro': [
    bb(FOOT, JB, 'Nous sommes entrés dans le pied : une grande pièce sombre.', (B, 'neutral'), (J, 'neutral')),
    bb(FOOT, JB, 'Jhimm a allumé sa masse avec sa magie. La magie ou la lumière ? Toujours est-il que six stèles se sont ouvertes…', (J, 'neutral'), (K, 'scared')),
    bb(FOOT, JB, '… et ont libéré des squelettes, des momies et un minotaure !', (SQ, 'fight'), (MO, 'fight'), (MI, 'fight'), (B, 'fight')),
], 'victory': [
    bb(FOOT, JB, 'Gros combat ! Kala a ouvert le bal avec son arc, et Bosco s’en est bien sorti avec sa première attaque à l’arbalète.', (K, 'fight'), (BO, 'happy')),
    bb(FOOT, JB, 'Auguste, la momie, a mis cher à Grimgors. Jhimm a envoyé une grosse boule de feu qui a touché quatre ennemis d’un coup. Bravo !', (MO, 'fight'), (G, 'sad'), (J, 'fight')),
    bb(FOOT, JB, 'Et là, j’ai eu l’idée du siècle : j’ai invoqué une horde de huit sangliers et je les ai envoyés sur le minotaure. Ça l’a occupé un long moment !', (B, 'happy'), (MI, 'neutral')),
    bb(FOOT, JB, 'Notre Kala a fini par achever la momie au corps à corps, avec son arc. Grandiose ! Et Bosco a achevé le minotaure.', (K, 'fight'), (BO, 'happy')),
    bb(FOOT, B, 'Tiens, mon grand : vingt baies nourricières ! Ça va te requinquer.', (B, 'happy'), (G, 'sad')),
], 'duel': {'foe': 'Les gardiens du pied', 'terrain': 'grotte', 'level': 'difficile', 'dice': [315, 317, 320, 315, 246, 317, 249, 252, 315, 250],
            'cards': ['Squelettes', 'La momie Auguste', 'Le minotaure', 'Momies', 'Squelettes']}})
parts.append({'id': 'c6p6', 'chapter': 6, 'title': 'Partie 6 : L’épreuve de Jhimm', 'intro': [
    bb(LEG, JB, 'Nous avons entamé l’ascension de la statue par l’intérieur de sa jambe. Des escaliers, encore des escaliers, et des couloirs sonores, lumineux ou vibrants…', (B, 'happy'), (G, 'neutral')),
    bb(LEG, JB, '… dont les alcôves étaient très, très tentantes pour Bosco. Héhé ! Il est pire que moi : il s’est encore fait gronder et attraper par le col par les deux grands !', (BO, 'shy'), (G, 'angry'), (J, 'neutral')),
    bb(ARMORY, JB, 'Nouvelle pièce : un vieux qui pue et quatre chevaliers en armure.', (MAI, 'neutral'), (CH, 'neutral'), (B, 'scared')),
    bb(ARMORY, J, 'Maître… C’est moi qui avais mis du caca puant dans votre armure. J’étais enfant. Je vous demande pardon.', (J, 'sad'), (MAI, 'neutral')),
    bb(ARMORY, MAI, 'Je m’en souviens, petit chenapan. Expie ta faute : laisse mes quatre chevaliers te frapper.', (MAI, 'neutral'), (J, 'sad')),
    bb(ARMORY, JB, 'Il était rigolo, le Jhimm, à une époque ! Le vieux maître d’armes lui a proposé d’expier sa faute en se faisant taper par les quatre chevaliers. Jhimm a accepté immédiatement. Nous n’étions pas du tout sereins.', (B, 'happy'), (K, 'scared'), (G, 'neutral')),
    bb(ARMORY, JB, 'Un seul chevalier l’a touché, et il n’a pris que trois points de dégâts !', (CH, 'fight'), (J, 'happy'), (B, 'happy')),
    bb(ARMORY, JB, 'Alors le livre de Jhimm est apparu… et nous nous sommes rendu compte que nous avions tous perdu notre objet le plus précieux pendant notre évanouissement. Bon sang de bonsoir !', (J, 'surprised'), (B, 'angry'), (K, 'sad')),
    bb(ARMORY, JB, 'Quand Jhimm a récupéré son livre pour le vérifier…', (J, 'neutral')),
]})
parts.append({'id': 'c6p7', 'chapter': 6, 'title': 'Partie 7 : La meule géante', 'intro': [
    bb(MUSH, JB, '… nous avons encore été téléportés. Un endroit sombre, dehors, plein de champignons métalliques lumineux. Tiens, un petit sentier ! Ça nous rappelait quelque chose. On a foncé : j’aime ça !', (B, 'happy'), (BO, 'happy')),
    bb(MUSH, JB, 'Et au loin… une énorme meule ! Waouh, quelle vision ! Ça sentait l’épreuve pour moi, ça !', (B, 'happy')),
    bb(MUSH, JB, 'En parlant de sentir, mes compagnons avaient beaucoup de mal à supporter l’odeur de cette merveille.', (K, 'sad'), (G, 'angry'), (BO, 'shy')),
    bb(MUSH, JB, 'En faisant le tour, j’ai trouvé une image de moi. Je lui ai mis le doigt dans le nez… et nous sommes entrés dans le fromage !', (B, 'happy'), (J, 'surprised')),
    bb(CHEESE, JB, 'Première pièce : le bleu d’Auvergne. Il nous a fallu un moment pour comprendre que je devais lécher les gardes myconides pour accéder à la porte.', (B, 'happy'), (K, 'surprised')),
    bb(CHEESE, JB, 'Puis des couloirs en fromages (au pluriel !) et des alcôves de la tentation pour Bosco.', (BO, 'shy'), (G, 'angry')),
    bb(CHEESE, JB, 'Dans la pièce suivante, j’ai remis dans l’ordre d’affinage les huit meules, hyper rapidement.', (B, 'happy'), (J, 'happy')),
]})
parts.append({'id': 'c6p8', 'chapter': 6, 'title': 'Partie 8 : La descente des meules', 'intro': [
    bb(ARENA, JB, 'Nous nous sommes retrouvés en haut d’une sorte d’arène de cheese-rolling. Tout au fond grouillaient les petits vers qu’on trouve dans le casu marzu, le fromage corse.', (B, 'happy'), (K, 'scared'), (BO, 'surprised')),
    bb(ARENA, B, 'À vos meules, les amis ! Et gare aux vers !', (B, 'fight'), (G, 'fight')),
], 'victory': [
    bb(ARENA, JB, 'Mes camarades ont fièrement réussi à stopper la deuxième meule ! Ils ont tout déchiré : je songe à leur proposer de rejoindre mon équipe à la fin de nos aventures.', (B, 'happy'), (G, 'proud'), (K, 'happy')),
    bb(ARENA, JB, 'Nous avons lancé les dix-huit meules et, nom d’un fromage, ma cuillère magique est apparue en bas ! Oh !', (B, 'happy')),
    bb(ARENA, JB, 'Quand je l’ai récupérée, nous avons de nouveau été téléportés.', (B, 'surprised'), (BO, 'surprised')),
], 'duel': {'foe': 'Les vers du casu marzu', 'terrain': 'terre', 'level': 'moyen', 'dice': [239, 240, 241, 264, 242, 243, 244, 245, 254, 264],
            'cards': ['Les vers du casu marzu', 'Les vers du casu marzu', 'La meule folle', 'Les vers du casu marzu', 'La meule folle']}})
parts.append({'id': 'c6p9', 'chapter': 6, 'title': 'Partie 9 : L’épreuve de Kala', 'intro': [
    bb(FIELD, JB, 'Cette fois, un champ de bataille sombre.', (B, 'scared'), (K, 'neutral')),
    bb(FIELD, K, 'Je crois que c’est mon tour.', (K, 'neutral'), (B, 'happy')),
    bb(FIELD, JB, 'Nous avons foncé sur le sentier. Au loin, une statue de flèche qui pique une boule… enfin, un œil, on l’a vu en approchant.', (B, 'happy'), (J, 'neutral')),
    bb(FIELD, JB, 'En connaisseurs, nous avons directement fait le tour, et Kala a touché délicatement son image.', (K, 'neutral'), (G, 'neutral')),
    bb(FIELD, 'Une voix', 'Tout sera une question de choix.', (K, 'scared')),
    bb(FIELD, JB, 'Première épreuve : viser trois cibles animales… ou les mécanismes entre leurs pattes. Kala a réussi : un pont est apparu.', (K, 'happy'), (B, 'happy')),
    bb(FIELD, J, 'Ce dieu est farceur et illusionniste. Rien n’est réel ici, Kala.', (J, 'neutral'), (K, 'sad')),
    bb(FIELD, JB, 'Je l’espère… J’aimerais quand même revoir Jordan vivant quand on sortira de là !', (B, 'sad')),
]})
parts.append({'id': 'c6p10', 'chapter': 6, 'title': 'Partie 10 : Les drones pentagones', 'intro': [
    bb(FIELD, JB, 'Ensuite : un combat contre des drones pentagones !', (DR, 'fight'), (B, 'fight'), (K, 'fight'), (G, 'fight')),
], 'victory': [
    bb(FIELD, JB, 'Victoire nette ! Jhimm et Bosco ont découpé un drone chacun, Grimgors en a découpé trois.', (J, 'fight'), (BO, 'happy'), (G, 'proud')),
    bb(FIELD, JB, 'Kala a démontré ses aptitudes au cimeterre. Jhimm a pris cher.', (K, 'fight'), (J, 'sad')),
    bb(FIELD, JB, 'Et moi ? Paralysé pendant tout le combat : j’ai compté les points !', (B, 'sad')),
], 'duel': {'foe': 'Les drones pentagones', 'terrain': 'foudre', 'level': 'difficile', 'dice': [316, 316, 316, 295, 316, 247, 252, 316, 249, 250],
            'cards': ['Les drones pentagones', 'Les drones pentagones', 'Les drones pentagones', 'Les drones pentagones', 'Les drones pentagones']}})
parts.append({'id': 'c6p11', 'chapter': 6, 'title': 'Partie 11 : Ne pas toucher !', 'intro': [
    bb(FIELD, JB, 'Et qu’est-ce qui nous attend pour la suite ? Sans doute des alcôves tentatrices, pleines de trésors et de représentations de mes transformations animales…', (B, 'happy'), (BO, 'happy')),
    bb(FIELD, B, 'Je vous rappelle notre devise : « Ne pas toucher » !', (B, 'happy'), (BO, 'shy'), (K, 'happy'), (G, 'proud'), (J, 'happy')),
]})
data.extend(parts)
open(P, 'w', encoding='utf-8').write(head + '\n' + PRE + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';' + ('\n' if rest.endswith('\n') else ''))
print('chapitre VI :', len(parts), 'parties,', sum(len(p.get('intro', [])) + len(p.get('victory', [])) for p in parts), 'répliques')
