#!/usr/bin/env python3
"""v432 — Chapitre V « La route maudite de Mirrhol », raconté par Kala (son journal) : 6 parties, 2 duels.
Écrit les parties c5p1 à c5p6 dans assets/story-data-v193.js (les remplace si elles existent déjà).
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
KERZ = ('Kerzian', ['night'], bg('assets/story/berdesa-village-background.webp', 'rgba(70, 14, 4, 0.38), rgba(20, 4, 2, 0.72)'))
JOURNAL = 'Journal de Kala'

def beat(place, speaker, text, *cast, art=None):
    l, c, b = place
    out = {'s': speaker, 't': text, 'l': l, 'c': c, 'bg': b, 'cast': []}
    if art:
        out['cast'].append({'art': art, 'alt': art.split('/')[-1]})
    for name, mood in cast:
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
    beat(FARM, B, 'Avant Mirrhol, passons par Kerzian ! Je veux voir la guilde des cuisiniers… et Grimgors y trouvera une nouvelle armure.', (B, 'happy'), (G, 'proud')),
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
], 'duel': {'foe': 'La guilde des Sans-chiffres', 'terrain': 'terre', 'level': 'moyen', 'dice': [293, 293, 119, 293, 57, 66, 293, 119, 92, 96],
            'cards': ['Les Sans-chiffres', 'Les Sans-chiffres', 'La dague des Sans-chiffres', 'Les Sans-chiffres', 'Les Sans-chiffres']}})
parts.append({'id': 'c5p4', 'chapter': 5, 'title': 'Partie 4 : Kerzian appelle à l’aide', 'intro': [
    beat(ROAD, V, 'Pas le temps de souffler : Kerzian est attaqué ! Il faut nous dépêcher.', (V, 'neutral'), (K, 'scared')),
    beat(ROAD, V, 'On parle de Loris et de Gliska, d’une tentative de prise de pouvoir… Mais ce ne sont que des soupçons : impossible d’alerter les sages.', (V, 'neutral'), (G, 'angry')),
    beat(ROAD, JOURNAL, 'En chemin, Velmarys m’a glissé que l’atmosphère était tendue avec Bulbalina. Elle était sur son cheval et pouvait très bien nous entendre.', (K, 'neutral'), (BU, 'neutral')),
    beat(ROAD, K, 'Bulbalina, je n’ai pas apprécié que tu essaies de kidnapper un canourson. Tu nous as tous mis en danger.', (K, 'neutral'), (BU, 'thinking')),
    beat(ROAD, JOURNAL, 'J’ai eu l’impression qu’elle commençait enfin à comprendre. Cette prise de conscience m’a rassurée.', (K, 'happy'), (BU, 'neutral')),
    beat(KERZ, JOURNAL, 'Trois ou quatre heures plus tard, Kerzian est apparu. Murets détruits, du sang partout, de la fumée au centre du village… et des cris de bêtes que nous ne connaissions pas.', (K, 'scared'), (J, 'scared')),
    beat(KERZ, G, 'J’ai une idée : crions « Les renforts de Zackarie arrivent ! »', (G, 'fight'), (K, 'neutral')),
    beat(KERZ, JOURNAL, 'Nous avons tous approuvé, et Bulbalina a fait naître l’illusion d’une foule de soldats accourant en renfort.', (BU, 'happy'), (G, 'proud')),
]})
parts.append({'id': 'c5p5', 'chapter': 5, 'title': 'Partie 5 : La bête de Kerzian', 'intro': [
    beat(KERZ, JOURNAL, 'La double porte de bois s’est ouverte, puis refermée. Un grondement sourd, un bruit de bête…', (K, 'scared')),
    beat(KERZ, JOURNAL, 'Nous sommes entrés : une énorme bête, des squelettes, des morts-vivants partout.', (K, 'fight'), (G, 'fight'), (B, 'fight')),
    beat(KERZ, V, 'Attention, il y a autre chose… Écoutez : des incantations !', (V, 'neutral'), (K, 'neutral')),
    beat(KERZ, J, 'Là-haut ! Les voix viennent de ce toit !', (J, 'fight'), (E, 'neutral')),
    beat(KERZ, JOURNAL, 'J’ai escaladé le toit voisin. Je m’approchais sans parvenir à viser… Puis une voix : « Loué soit Orcus. » Et ce que nous apercevions a disparu.', (K, 'scared')),
    beat(KERZ, JOURNAL, 'Il ne restait plus qu’à protéger les villageois, coûte que coûte.', (K, 'fight'), (J, 'fight'), (G, 'fight')),
], 'victory': [
    beat(KERZ, JOURNAL, 'Jhimm a lancé un sort qui a fait fuir la plupart des morts-vivants. Un soulagement… temporaire.', (J, 'fight'), (K, 'neutral')),
    beat(KERZ, JOURNAL, 'C’est ma flèche qui a achevé la dernière créature. Une victoire amère : beaucoup de villageois sont morts malgré nos efforts.', (K, 'sad')),
], 'duel': {'foe': 'La horde de Kerzian', 'terrain': 'feu', 'level': 'difficile', 'dice': [263, 246, 252, 248, 250, 263, 249, 251, 247, 252],
            'cards': ['Morts-vivants de Kerzian', 'Morts-vivants de Kerzian', 'La bête de Kerzian', 'Morts-vivants de Kerzian', 'La bête de Kerzian']}})
parts.append({'id': 'c5p6', 'chapter': 5, 'title': 'Partie 6 : Une victoire amère', 'intro': [
    beat(KERZ, JOURNAL, 'Seuls trois villageois ont survécu. L’un d’eux a reconnu Bolduc quand il a repris forme humaine : il était en lion pendant le combat.', (B, 'sad'), (K, 'sad')),
    beat(KERZ, 'Un survivant', 'Ce matin, un régiment d’une trentaine de soldats était ici, avec Loris et Gliska. La légion de Lunargent. Ils sont partis vers Forfalla en laissant leurs tentes.', (K, 'scared'), (G, 'angry')),
    beat(KERZ, E, 'Mettons de l’ordre, mangeons un peu et reposons-nous. Nous en avons tous besoin.', (E, 'sad'), (K, 'sad')),
    beat(KERZ, JOURNAL, 'Velmarys est resté très discret. Je me suis promis d’aller lui parler cette nuit, pour savoir ce qui le préoccupe.', (K, 'neutral'), (V, 'neutral')),
    beat(KERZ, B, 'Au moins une bonne nouvelle : la guilde des cuisiniers avait la liste des ingrédients d’un fromage spécial… pour moi !', (B, 'happy'), (K, 'happy')),
    beat(KERZ, JOURNAL, 'En fouillant les tentes abandonnées, nous avons compris que le feu n’avait rien de naturel. Mais à l’intérieur, rien d’intéressant.', (G, 'neutral'), (E, 'neutral')),
    beat(KERZ, JOURNAL, 'Cette journée a été éprouvante. Trop de morts, trop de questions sans réponses. Orcus, Loris, Gliska, la légion de Lunargent… Les pièces d’un puzzle inquiétant se mettent en place, et je crains ce que nous découvrirons ensuite.', art='assets/story/night-kala-courage.webp'),
]})
data.extend(parts)
open(P, 'w', encoding='utf-8').write(head + '\n' + PRE + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';' + ('\n' if rest.endswith('\n') else ''))
print('chapitre V :', len(parts), 'parties,', sum(len(p.get('intro', [])) + len(p.get('victory', [])) for p in parts), 'répliques')
