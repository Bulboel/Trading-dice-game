#!/usr/bin/env python3
"""v432 — Chapitre V « Les fidèles d’Orcus » (v450, ex-« L’attaque à Kierzan ») : parties 1 à 6 racontées par Kala (son journal),
parties 7 à 12 par Jhimm (v450, d’après son récit). Écrit les parties c5p1 à c5p12 dans assets/story-data-v193.js (les remplace si elles existent déjà).
Chaque personnage d'une réplique porte son humeur choisie à la main (« mm ») ; scripts/tag-story-emotions.py la respecte.
Relancer ensuite : python3 scripts/tag-story-emotions.py && python3 scripts/story-sprite-bounds.py"""
import json
P = 'assets/story-data-v193.js'
head, rest = open(P, encoding='utf-8').read().split('\n', 1)
PRE = 'window.HACKENIA_STORY='
data = json.loads(rest[len(PRE):].rstrip('\n')[:-1])
data = [p for p in data if not p['id'].startswith('c5')]

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
for n in ('Kala', 'Ébérien', 'Bolduc', 'Grimgors', 'Jhimm', 'Maebril', 'Velmarys'):
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
parts = []
parts.append({'id': 'c5p1', 'chapter': 5, 'title': 'Partie 1 : La prime de Maebril', 'intro': [
    beat(FARM, JOURNAL, 'La journée a commencé paisiblement. Jhimm s’est levé le premier, comme souvent, et notre hôtesse l’a aussitôt envoyé nourrir ses vaches.', (K, 'neutral'), (J, 'happy')),
    beat(FARM, JOURNAL, 'Elle avait prévenu Maebril de nos exploits face à l’ogre. Au petit déjeuner, nous avons parlé de nos prochains pas.', (K, 'happy'), (B, 'happy'), (G, 'neutral')),
    beat(FARM, E, 'Et ces traces mystérieuses que nous avons repérées hier… il faudra bien savoir d’où elles viennent.', (E, 'neutral'), (K, 'neutral')),
    beat(FARM, JOURNAL, 'C’est alors que le sac sans fond s’est mis à vibrer. Ébérien en a sorti le médaillon, qui s’est mis à grandir sous nos yeux…', (E, 'surprised'), (K, 'surprised')),
    beat(FARM, JOURNAL, '… et Maebril en est sorti. Entièrement nu. Un spectacle aussi inattendu qu’embarrassant.', (MA, 'neutral'), (K, 'surprised'), (B, 'happy')),
    beat(FARM, MA, 'Voici votre prime : 500 pièces d’or chacun. Et ces colliers de dents d’ogre : avec eux, vous comprendrez leur langue.', (MA, 'neutral'), (G, 'proud'), (K, 'happy')),
    beat(FARM, B, 'Et moi, je vous offre l’oreille de l’ogre ! La preuve de notre victoire !', (B, 'happy'), (MA, 'neutral')),
    beat(FARM, MA, 'C’est… très aimable. Mais des dents auraient été préférables.', (MA, 'neutral'), (B, 'sad')),
    beat(FARM, JOURNAL, 'Nous nous en souviendrons pour la prochaine fois. Ébérien lui a parlé de notre route vers Mirrhol et des morphes que nous avions croisés. Pendant ce temps, le médaillon a commencé à se refermer.', (E, 'neutral'), (MA, 'neutral')),
    beat(FARM, J, 'Vite, Maebril ! Consultez la harpe de Bulbalina, elle en saura sûrement plus !', (J, 'neutral'), (MA, 'neutral')),
    beat(FARM, B, 'Avant Mirrhol, passons par Kierzan ! Je veux voir la guilde des cuisiniers… et Grimgors y trouvera une nouvelle armure.', (B, 'happy'), (G, 'proud')),
    beat(FARM, JOURNAL, 'Avant de partir, Bolduc a réclamé des rations à notre hôtesse. Jhimm lui a donné 2 pièces d’or ; Ébérien a complimenté sa cuisine, sans rien ajouter. 2 pièces d’or, c’est déjà une belle somme.', (J, 'happy'), (E, 'happy'), (B, 'happy')),
]})
parts.append({'id': 'c5p2', 'chapter': 5, 'title': 'Partie 2 : Le hibou blessé', 'intro': [
    beat(ROAD, JOURNAL, 'Nous avons pris la route dans le calme. Deux ou trois heures plus tard, un hibou a foncé droit sur moi.', (K, 'surprised')),
    beat(ROAD, JOURNAL, 'J’ai tendu le bras sans réfléchir, et il s’y est posé. À sa patte, un parchemin en partie brûlé.', (K, 'neutral')),
    beat(ROAD, E, 'Laisse-moi t’aider à le dérouler… Étrange, je ne vois rien d’écrit.', (E, 'neutral'), (K, 'neutral')),
    beat(ROAD, JOURNAL, 'Mais quand il me l’a montré, j’ai pu lire clairement : « Yoris trouvé mais il… » La suite manquait. C’était signé Velmarys.', (K, 'scared'), (E, 'neutral')),
    beat(ROAD, JOURNAL, 'J’ai aussitôt écrit une réponse : nous n’avions reçu que le début du message, le hibou était blessé, et nous pouvions communiquer grâce au médaillon de Maebril.', (K, 'neutral')),
    beat(ROAD, B, 'Pourvu que ce pauvre hibou ne finisse pas en poulet grillé…', (B, 'sad'), (K, 'neutral')),
    beat(ROAD, G, 'Et Orcus ? Que savons-nous vraiment de lui ?', (G, 'neutral'), (K, 'neutral')),
    beat(ROAD, JOURNAL, 'Pas grand-chose : il règne sur son propre royaume, Thanatos, et rêve de changer le monde entier en royaume de morts-vivants.', (K, 'sad'), (G, 'angry')),
]})
parts.append({'id': 'c5p3', 'chapter': 5, 'title': 'Partie 3 : L’embuscade des Sans-chiffres', 'intro': [
    beat(ROAD, B, 'Chut ! J’entends du bruit… Un groupe arrive derrière nous.', (B, 'fight'), (K, 'neutral')),
    beat(ROAD, G, 'Écartons-nous, laissons-les passer.', (G, 'neutral'), (B, 'neutral')),
    beat(ROAD, JOURNAL, 'Mais ils nous ont attaqués directement. Nous avons reconnu les tenues de la guilde des Sans-chiffres, que nous avions déjà combattue.', (SC, 'fight'), (K, 'fight')),
    beat(ROAD, G, 'Gardez-en au moins un vivant !', (G, 'fight'), (SC, 'fight')),
], 'victory': [
    beat(ROAD, JOURNAL, 'Dès le début du combat, j’en ai abattu un d’une seule flèche. Un tir dont je suis plutôt fière.', (K, 'happy')),
    beat(ROAD, JOURNAL, 'Jhimm, fidèle à lui-même, nous a soutenus de sa bénédiction. Ébérien en a fauché un autre d’un fracassement qui en a touché plusieurs.', (J, 'fight'), (E, 'fight')),
    beat(ROAD, JOURNAL, 'Bolduc a lancé une hachette… qui a manqué sa cible. Pas très impressionnant. Puis il s’est changé en loup sanguinaire : beaucoup plus impressionnant.', (B, 'fight')),
    beat(ROAD, JOURNAL, 'C’est alors qu’une flèche venue de nulle part a frappé l’un d’eux. Velmarys et Bulbalina !', (V, 'neutral'), (BU, 'happy'), (K, 'happy')),
    beat(ROAD, JOURNAL, 'J’ai enchanté mes flèches de mon élément, la terre, pour immobiliser mes cibles. Quand il n’en resta que deux, Grimgors en acheva un.', (K, 'fight'), (G, 'fight')),
    beat(ROAD, SC, 'Vingt… et un…', (SC, 'ko')),
    beat(ROAD, JOURNAL, 'Ce furent ses derniers mots. Ces membres de la guilde des Sans-chiffres restent un mystère.', (K, 'neutral'), (G, 'neutral')),
], 'duel': {'foe': 'La guilde des Sans-chiffres', 'terrain': 'terre', 'level': 'moyen', 'dice': [293, 311, 119, 314, 57, 66, 293, 119, 310, 312],
            'cards': ['Les Sans-chiffres', 'Les Sans-chiffres', 'La dague des Sans-chiffres', 'Les Sans-chiffres', 'Les Sans-chiffres']}})
parts.append({'id': 'c5p4', 'chapter': 5, 'title': 'Partie 4 : Kierzan appelle à l’aide', 'intro': [
    beat(ROAD, V, 'Pas le temps de souffler : Kierzan est attaqué ! Il faut nous dépêcher.', (V, 'neutral'), (K, 'scared')),
    beat(ROAD, V, 'On parle de Yoris et de Gliska, d’une tentative de prise de pouvoir… Mais ce ne sont que des soupçons : impossible d’alerter les sages.', (V, 'neutral'), (G, 'angry')),
    beat(ROAD, JOURNAL, 'En chemin, Velmarys m’a glissé que l’atmosphère était tendue avec Bulbalina. Elle était sur son cheval et pouvait très bien nous entendre.', (K, 'neutral'), (BU, 'neutral')),
    beat(ROAD, K, 'Bulbalina, je n’ai pas apprécié que tu essaies de kidnapper un canourson. Tu nous as tous mis en danger.', (K, 'neutral'), (BU, 'thinking')),
    beat(ROAD, JOURNAL, 'J’ai eu l’impression qu’elle commençait enfin à comprendre. Cette prise de conscience m’a rassurée.', (K, 'happy'), (BU, 'neutral')),
    beat(KERZ, JOURNAL, 'Trois ou quatre heures plus tard, Kierzan est apparu. Murets détruits, du sang partout, de la fumée au centre du village… et des cris de bêtes que nous ne connaissions pas.', (K, 'scared'), (J, 'scared')),
    beat(KERZ, G, 'J’ai une idée : crions « Les renforts de Zackarie arrivent ! »', (G, 'fight'), (K, 'neutral')),
    beat(KERZ, JOURNAL, 'Nous avons tous approuvé, et Bulbalina a fait naître l’illusion d’une foule de soldats accourant en renfort.', (BU, 'happy'), (G, 'proud')),
]})
parts.append({'id': 'c5p5', 'chapter': 5, 'title': 'Partie 5 : La bête de Kierzan', 'intro': [
    beat(KERZ, JOURNAL, 'La double porte de bois s’est ouverte, puis refermée. Un grondement sourd, un bruit de bête…', (K, 'scared')),
    beat(KERZ, JOURNAL, 'Nous sommes entrés : une énorme bête, des squelettes, des morts-vivants partout.', (K, 'fight'), (G, 'fight'), (B, 'fight')),
    beat(KERZ, V, 'Attention, il y a autre chose… Écoutez : des incantations !', (V, 'neutral'), (K, 'neutral')),
    beat(KERZ, J, 'Là-haut ! Les voix viennent de ce toit !', (J, 'fight'), (E, 'neutral')),
    beat(KERZ, JOURNAL, 'J’ai escaladé le toit voisin. Je m’approchais sans parvenir à viser… Puis une voix : « Loué soit Orcus. » Et ce que nous apercevions a disparu.', (K, 'scared')),
    beat(KERZ, JOURNAL, 'Il ne restait plus qu’à protéger les villageois, coûte que coûte.', (K, 'fight'), (J, 'fight'), (G, 'fight')),
], 'victory': [
    beat(KERZ, JOURNAL, 'Jhimm a lancé un sort qui a fait fuir la plupart des morts-vivants. Un soulagement… temporaire.', (J, 'fight'), (K, 'neutral')),
    beat(KERZ, JOURNAL, 'C’est ma flèche qui a achevé la dernière créature. Une victoire amère : beaucoup de villageois sont morts malgré nos efforts.', (K, 'sad')),
], 'duel': {'foe': 'La horde de Kierzan', 'terrain': 'feu', 'level': 'difficile', 'dice': [263, 246, 252, 248, 250, 263, 249, 251, 247, 252],
            'cards': ['Morts-vivants de Kierzan', 'Morts-vivants de Kierzan', 'La bête de Kierzan', 'Morts-vivants de Kierzan', 'La bête de Kierzan']}})
parts.append({'id': 'c5p6', 'chapter': 5, 'title': 'Partie 6 : Une victoire amère', 'intro': [
    beat(KERZ, JOURNAL, 'Seuls trois villageois ont survécu. L’un d’eux a reconnu Bolduc quand il a repris forme humaine : il était en lion pendant le combat.', (B, 'sad'), (K, 'sad')),
    beat(KERZ, 'Un survivant', 'Ce matin, un régiment d’une trentaine de soldats était ici, avec Yoris et Gliska. La légion de Lunargent. Ils sont partis vers Forfalla en laissant leurs tentes.', (K, 'scared'), (G, 'angry')),
    beat(KERZ, E, 'Mettons de l’ordre, mangeons un peu et reposons-nous. Nous en avons tous besoin.', (E, 'sad'), (K, 'sad')),
    beat(KERZ, JOURNAL, 'Velmarys est resté très discret. Je me suis promis d’aller lui parler cette nuit, pour savoir ce qui le préoccupe.', (K, 'neutral'), (V, 'neutral')),
    beat(KERZ, B, 'Au moins une bonne nouvelle : la guilde des cuisiniers avait la liste des ingrédients d’un fromage spécial… pour moi !', (B, 'happy'), (K, 'happy')),
    beat(KERZ, JOURNAL, 'En fouillant les tentes abandonnées, nous avons compris que le feu n’avait rien de naturel. Mais à l’intérieur, rien d’intéressant.', (G, 'neutral'), (E, 'neutral')),
    beat(KERZ, JOURNAL, 'Cette journée a été éprouvante. Trop de morts, trop de questions sans réponses. Orcus, Yoris, Gliska, la légion de Lunargent… Les pièces d’un puzzle inquiétant se mettent en place, et je crains ce que nous découvrirons ensuite.', art='assets/story/night-kala-courage.webp'),
]})

# ——— v450 — La suite, racontée par Jhimm (d’après son récit) ———
JJ = 'Journal de Jhimm'
TPL['Orven'] = {'img': 'url("assets/story/emo/orven-2.webp")', 'sz': 'contain', 'pos': 'center bottom'}
TPL['La nécromancienne'] = {'img': 'url("assets/story/emo/necromancienne-2.webp")', 'sz': 'contain', 'pos': 'center bottom'}
TPL['Les ogres'] = {'img': 'url("assets/story/emo/ogre-2.webp")', 'sz': 'contain', 'pos': 'center bottom'}
TPL['La licorne corrompue'] = {'img': 'url("assets/story/emo/licorne-enrage-2.webp")', 'sz': 'contain', 'pos': 'center bottom'}
KERZ_DAWN = ('Kierzan, à l’aube', ['night'], bg('assets/story/berdesa-village-background.webp', 'rgba(120, 70, 30, 0.18), rgba(40, 20, 8, 0.42)'))
WOODS = ('Les bois de la route de Mirrhol', ['forest'], bg('assets/story/forest-background.webp', 'rgba(14, 16, 10, 0.2), rgba(8, 10, 6, 0.55)'))
OR, MB, LC, NE, OG = 'Orven', 'Messire Balai', 'La licorne corrompue', 'La nécromancienne', 'Les ogres'
def jb(place, speaker, text, *cast, art=None):
    """Réplique du récit de Jhimm : quand il raconte, il est à l’image avec l’humeur de la scène (sinon calme)."""
    if speaker == JJ and not art and J not in [n for n, _ in cast]:
        cast = ((J, 'neutral'),) + cast
    out = beat(place, speaker, text, *cast, art=art)
    if speaker == JJ:
        for c in out['cast']:
            if c.get('n') == J:
                c['k'] = ['is-speaking']
    return out
parts.append({'id': 'c5p7', 'chapter': 5, 'title': 'Partie 7 : Le réveil de Jhimm', 'intro': [
    jb(KERZ, JJ, 'Après la bataille, je me suis éclipsé sans un mot. Je n’avais aucune envie de feindre la bonne humeur près du feu : je me suis écroulé tout habillé dans une tente à l’écart.', (J, 'sad')),
    jb(KERZ, JJ, 'Les soins de mes compagnons avaient beau être irréprochables, cette mort frôlée de trop près me secouait encore. Égide enseigne que la mort nourrit la vie… mais je suis encore au matin de la mienne.', (J, 'sad')),
    jb(KERZ, G, 'Debout ! Tout le monde debout ! Ils reviennent !', (G, 'fight'), (J, 'scared')),
    jb(KERZ, JJ, 'Les cris de Grimgors m’ont arraché au sommeil, avec une douleur nouvelle dans les côtes. Je ne me souvenais pas d’avoir été touché à cet endroit… rien de rassurant.', (J, 'scared')),
    jb(KERZ, JJ, 'À la lueur vacillante du feu, j’ai compris : encore ces maudits morts-vivants. Pas de Kala ni de Velmarys en vue.', (J, 'fight')),
    jb(KERZ, JJ, 'Bolduc cognait un zombie avec son éternel enthousiasme et son gourdin magique. Grimgors fonçait vers Ébérien, aux prises avec trois créatures… Bulbalina et Messire Balai gisaient inanimés à ses pieds.', (B, 'fight'), (E, 'fight'), (G, 'fight')),
], 'victory': [
    jb(KERZ, JJ, 'Ces créatures impies n’étaient pas de taille : nous les avons balayées sans trop de difficulté.', (J, 'fight'), (G, 'proud')),
    jb(KERZ, K, 'Il y en avait d’autres de notre côté du village. Velmarys et moi nous en sommes chargés.', (K, 'neutral'), (V, 'neutral')),
    jb(KERZ, JJ, 'Il semble qu’il y ait eu bien des conciliabules pendant mon sommeil, mais je n’avais plus la force de m’y intéresser. L’adrénaline retombée, l’épuisement m’a submergé.', (J, 'sad')),
    jb(KERZ, E, 'Finissons la nuit dans les maisons encore debout. Un zombie éventre une tente bien trop facilement.', (E, 'neutral'), (J, 'sad')),
    jb(KERZ, JJ, 'J’ai vaguement entendu parler d’une prophétie qui aurait fait s’évanouir Bulbalina et Messire Balai… puis je me suis écroulé dans un coin, incapable de penser davantage.', (BU, 'neutral'), (MB, 'sad')),
], 'duel': {'foe': 'Les morts-vivants de la nuit', 'terrain': 'ville', 'level': 'moyen', 'dice': [246, 252, 249, 247, 255, 250, 246, 248, 251, 252],
            'cards': ['Morts-vivants de Kierzan', 'Morts-vivants de Kierzan', 'Morts-vivants de Kierzan', 'Morts-vivants de Kierzan', 'Morts-vivants de Kierzan']}})
parts.append({'id': 'c5p8', 'chapter': 5, 'title': 'Partie 8 : La lumière de l’aube', 'intro': [
    jb(KERZ_DAWN, JJ, 'À l’aube, par habitude, je me suis levé pour prier face au soleil levant. J’étais encore accablé…', (J, 'sad')),
    jb(KERZ_DAWN, JJ, '… mais Égide n’abandonne pas ses fidèles. Au fil de mes prières, mes angoisses se sont dissipées, remplacées par une force neuve, presque tangible.', (J, 'happy')),
    jb(KERZ_DAWN, JJ, 'La matinée a été consacrée à organiser la suite… jusqu’à ce que Maebril surgisse, toujours aussi peu vêtu.', (MA, 'neutral'), (J, 'surprised'), (B, 'happy')),
    jb(KERZ_DAWN, J, 'Bulbalina a prononcé une prophétie cette nuit, juste avant de s’évanouir. Cela vous évoque-t-il quelque chose ?', (J, 'neutral'), (MA, 'neutral')),
    jb(KERZ_DAWN, MA, 'Rien du tout, je le crains. En revanche, j’ai beaucoup à vous apprendre sur Gliska.', (MA, 'neutral'), (G, 'angry')),
    jb(KERZ_DAWN, MA, 'Et sur la dague maudite que vous transportez : il n’existe qu’une manière de la détruire… l’utiliser, et s’y lier.', (MA, 'neutral'), (E, 'scared'), (J, 'scared')),
    jb(KERZ_DAWN, MA, 'Une dernière chose : Orven, de la guilde, est parti hier vers la route maudite de Mirrhol.', (MA, 'neutral'), (K, 'neutral')),
    jb(KERZ_DAWN, JJ, 'Nous avons aussi fait notre rapport aux jumeaux. Leur réponse fut… concise. Trop occupés pour intervenir, ils promettaient d’envoyer quelqu’un au village.', (J, 'neutral'), (G, 'angry')),
    jb(KERZ_DAWN, V, 'Je serai franc : j’ai l’intention d’assassiner Yoris.', (V, 'neutral'), (K, 'neutral'), (J, 'surprised')),
    jb(KERZ_DAWN, G, 'Nous manquons de preuves sur ses agissements. Et nous ne le connaissons pas aussi bien que Kala et toi.', (G, 'neutral'), (V, 'neutral')),
    jb(KERZ_DAWN, JJ, 'Je partageais les réticences de Grimgors. Nous avons fini par convenir de nous retrouver dans deux ou trois jours à la Taverne d’Argile, à Forfalla, pour aviser ensemble.', (J, 'neutral'), (G, 'neutral'), (V, 'neutral')),
]})
parts.append({'id': 'c5p9', 'chapter': 5, 'title': 'Partie 9 : Orven, sur la route maudite', 'intro': [
    jb(ROAD, JJ, 'Velmarys a escorté Bulbalina jusqu’à Dassom. Nous, nous avons pris la route pour la mission de la guilde : enquêter sur la route maudite de Mirrhol.', (V, 'neutral'), (BU, 'neutral')),
    jb(ROAD, JJ, 'Grimgors nous a surpris en faisant apparaître une monture impressionnante. Je l’ai senti soulagé de ne plus devoir traîner Bol… pauvre pépère.', (G, 'proud'), (J, 'happy')),
    jb(ROAD, B, 'Psst… On nous observe. Là, entre les arbres.', (B, 'fight'), (K, 'neutral')),
    jb(ROAD, JJ, 'Avec Kala et Grimgors, Bolduc a repéré un homme-chien : c’était Orven, amaigri mais vivant.', (OR, 'friendly'), (K, 'surprised'), (G, 'surprised')),
    jb(ROAD, OR, 'Aidez-moi, je vous en prie. Des ogres ont capturé deux licornes. Je ne peux pas les sauver seul.', (OR, 'friendly'), (J, 'neutral')),
    jb(ROAD, JJ, 'Malgré nos tâches déjà innombrables, refuser aurait été indigne.', (J, 'neutral')),
    jb(ROAD, G, 'Jhimm et moi, nous attirons les ogres. Les plus discrets libéreront la licorne.', (G, 'fight'), (J, 'fight'), (K, 'neutral')),
    jb(ROAD, JJ, 'Car une seule licorne était visible. Où pouvait bien être la seconde ?', (J, 'neutral'), (OR, 'haughty')),
]})
parts.append({'id': 'c5p10', 'chapter': 5, 'title': 'Partie 10 : Les ogres et l’ombre', 'intro': [
    jb(WOODS, JJ, 'Deux tentatives de Grimgors pour communiquer — ou pour provoquer, difficile à dire — grâce à son collier de dents d’ogre…', (G, 'fight'), (J, 'neutral')),
    jb(WOODS, JJ, '… et les ogres se sont mis en marche vers nous. C’est Ébérien qui a ouvert les hostilités : une énorme boule de feu a éclaté sur les deux créatures.', (E, 'fight'), (OG, 'fight'), (G, 'fight')),
    jb(WOODS, JJ, 'Malgré cela, une inquiétude sourde me tenaillait. Je sentais une autre présence.', (J, 'scared')),
    jb(WOODS, JJ, 'Je ne me trompais pas : une silhouette sombre est apparue et m’a lancé une dague. La blessure était superficielle, mais la sensation… étrange.', (NE, 'fight'), (J, 'scared')),
    jb(WOODS, J, 'Une nécromancienne ! Elle est avec eux !', (J, 'fight'), (NE, 'neutral'), (K, 'fight')),
], 'victory': [
    jb(WOODS, JJ, 'La puissance décuplée du groupe a rapidement fait plier les ogres et mis la nécromancienne en fuite.', (J, 'fight'), (B, 'fight')),
    jb(WOODS, JJ, 'Kala et Grimgors semblaient encore plus rapides et efficaces que lors de nos précédents combats.', (K, 'fight'), (G, 'proud')),
    jb(WOODS, JJ, 'C’est alors que la seconde licorne est apparue. Mais au lieu de me rassurer, une angoisse glacée m’a saisi : elle était corrompue, pervertie par une magie impie.', (LC, 'angry'), (J, 'scared')),
], 'duel': {'foe': 'Les ogres et la nécromancienne', 'terrain': 'terre', 'level': 'difficile', 'dice': [294, 321, 252, 294, 249, 250, 294, 247, 251, 248],
            'cards': ['Les ogres des collines', 'La nécromancienne', 'Les ogres des collines', 'Morts-vivants', 'La nécromancienne'], 'boss': 'ogre'}})
parts.append({'id': 'c5p11', 'chapter': 5, 'title': 'Partie 11 : La licorne corrompue', 'intro': [
    jb(WOODS, JJ, 'Les ogres à terre, nous pensions souffler. Mais la seconde licorne, celle que nous étions venus sauver, avait les yeux injectés d’une lueur impie.', (LC, 'angry'), (J, 'scared')),
    jb(WOODS, OR, 'Ce n’est plus elle… On l’a corrompue ! Ne la tuez pas, je vous en prie !', (OR, 'fight'), (LC, 'angry')),
        jb(WOODS, LC, 'Hiiiiii !', (LC, 'fight'), (J, 'scared')),
    jb(WOODS, JJ, 'La nécromancienne était revenue, et la licorne corrompue chargeait à ses côtés.', (NE, 'fight'), (LC, 'fight'), (G, 'fight')),
    jb(WOODS, JJ, 'Orven et la première licorne, affolée et blessée, étaient en plein milieu.', (OR, 'fight'), (J, 'fight')),
    jb(WOODS, G, 'Occupez la licorne sans la blesser. Moi, je m’occupe de la magicienne : c’est elle qui tire les ficelles.', (G, 'fight'), (NE, 'fight')),
], 'victory': [
    jb(WOODS, JJ, 'J’ai vu Grimgors fondre sur la magicienne, sans comprendre comment il l’avait arrêtée.', (G, 'fight'), (NE, 'neutral')),
    jb(WOODS, JJ, 'Je me suis précipité vers Orven et la licorne blessée. Je faisais confiance à mes compagnons pour terminer le combat : je me suis tourné vers Égide et j’ai prié de toutes mes forces.', (J, 'fight'), (OR, 'friendly')),
    jb(WOODS, JJ, 'Peu à peu, la licorne a retrouvé son souffle, apaisée.', (J, 'happy'), (OR, 'friendly')),
    jb(WOODS, JJ, 'Bolduc, Ébérien, Kala et Grimgors nous ont rejoints. La nécromancienne gisait sans vie. Quant à la licorne corrompue, elle s’était enfuie en se téléportant…', (B, 'neutral'), (E, 'neutral'), (K, 'neutral'), (G, 'neutral')),
], 'duel': {'foe': 'La licorne corrompue', 'terrain': 'vent', 'level': 'difficile', 'dice': [297, 321, 297, 248, 250, 297, 249, 252, 246, 251],
            'cards': ['La licorne corrompue', 'La nécromancienne', 'La licorne corrompue', 'Morts-vivants', 'La licorne corrompue']}})
parts.append({'id': 'c5p12', 'chapter': 5, 'title': 'Partie 12 : Une blessure de trop ?', 'intro': [
    jb(WOODS, JJ, 'En examinant la licorne blessée, j’ai remarqué de nombreuses coupures, toutes identiques à celle que m’avait faite la dague de la nécromancienne.', (J, 'thinking'), (OR, 'friendly')),
    jb(WOODS, K, 'Sa dague n’est plus là. Je l’ai cherchée partout.', (K, 'neutral'), (J, 'scared')),
    jb(WOODS, JJ, 'Disparue, étrangement. Peut-être pas si insignifiante que cela, cette blessure, finalement…', (J, 'scared')),
    jb(WOODS, JJ, 'Et la liste de nos problèmes continue de s’allonger. Les jumeaux et leurs secrets, le retour de Caleïzis, les complots de Gliska ou de Yoris, la dague maudite, la secte des Sans-chiffres, l’ombre d’Orcus…', (J, 'sad'), (G, 'angry'), (K, 'sad')),
    jb(WOODS, JJ, '… et maintenant, une blessure peut-être maudite. À ce rythme, la compagnie finira par rêver de repos plus que d’aventure.', art='assets/story/night-jhimm-message.webp'),
]})
at = next((i for i, p in enumerate(data) if p['chapter'] > 5), len(data))  # v451 — avant le chapitre VI
data[at:at] = parts
open(P, 'w', encoding='utf-8').write(head + '\n' + PRE + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';' + ('\n' if rest.endswith('\n') else ''))
print('chapitre V :', len(parts), 'parties,', sum(len(p.get('intro', [])) + len(p.get('victory', [])) for p in parts), 'répliques')
