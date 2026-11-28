#!/usr/bin/env python3
"""v459 — Chapitre VIII « La brume de Mirrhol », raconté par Grimgors (d’après son récit). Parties c8p1 à c8p8, 2 duels."""
import json
P = 'assets/story-data-v193.js'
head, rest = open(P, encoding='utf-8').read().split('\n', 1)
PRE = 'window.HACKENIA_STORY='
data = json.loads(rest[len(PRE):].rstrip('\n')[:-1])
data = [p for p in data if not p['id'].startswith('c8')]

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
for n in ('Kala', 'Ébérien', 'Bolduc', 'Grimgors', 'Jhimm'):
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
K, E, B, G, J, BO, MA, CA = 'Kala', 'Ébérien', 'Bolduc', 'Grimgors', 'Jhimm', 'Bosco', 'Maebril', 'Caleïzis'
def emo(n): return {'img': f'url("assets/story/emo/{n}.webp")', 'sz': 'contain', 'pos': 'center bottom'}
TPL[BO] = emo('bosco-2'); TPL[CA] = emo('caleizis-2'); TPL[MA] = emo('maebril-2')
OM = 'Les ombres'; TPL[OM] = emo('sans-chiffre-1')
CR = 'La créature'; TPL[CR] = emo('elementaire-de-vent-majeur-2')
JG = 'Journal de Grimgors'
CAMP = ('Le campement', ['night'], bg('assets/story/forest-background.webp', 'rgba(10, 14, 30, 0.45), rgba(4, 6, 14, 0.75)'))
DREAM = ('Le rêve partagé', ['night', 'night-dream'], 'radial-gradient(at 50% 32%, rgb(70, 20, 40), rgb(14, 4, 10) 78%)')
SNOW = ('Vers Mirrhol', ['forest'], bg('assets/story/snowy-road-background.webp', 'rgba(20, 30, 50, 0.04), rgba(20, 30, 50, 0.35)'))
MIST = ('La route de Mirrhol', ['forest'], bg('assets/story/mirrhol-misty-road-background.webp', 'rgba(20, 20, 24, 0.05), rgba(10, 10, 14, 0.42)'))
INN = ('L’auberge de Mirrhol', ['dassom-tavern'], bg('assets/story/griffon-dore-interior.webp', 'rgba(20, 14, 8, 0.1), rgba(10, 6, 2, 0.4)'))
STONE = ('La pierre d’Aliam', ['forest'], bg('assets/story/mirrhol-misty-road-background.webp', 'rgba(120, 125, 140, 0.35), rgba(20, 22, 30, 0.6)'))
CAVE = ('La grotte des ombres', ['night'], bg('assets/story/humid-cavern-background.webp', 'rgba(60, 70, 90, 0.3), rgba(8, 10, 16, 0.7)'))
def gb(place, speaker, text, *cast, art=None):
    """Réplique du récit de Grimgors : quand il raconte, il est à l’image avec l’humeur de la scène."""
    if speaker == JG and not art and G not in [n for n, _ in cast]:
        cast = ((G, 'neutral'),) + cast
    out = beat(place, speaker, text, *cast, art=art)
    if speaker == JG:
        for c in out['cast']:
            if c.get('n') == G: c['k'] = ['is-speaking']
    return out
parts = []
parts.append({'id': 'c8p1', 'chapter': 8, 'title': 'Partie 1 : Le retour d’Ébérien', 'intro': [
    gb(CAMP, JG, 'Nous voilà enfin sortis de l’illusion d’Erevan. Un dieu que je n’apprécie guère : il pense plus à son amusement qu’à ce que subissent ceux dont il se joue.', (G, 'angry')),
    gb(CAMP, JG, 'Et nous avons retrouvé Ébérien. Je me réjouis de le revoir en bonne santé, après qu’il soit parti seul et à la hâte avec Orven, au secours du petit de la licorne. Lui qui n’est pas le plus robuste…', (E, 'happy'), (G, 'happy')),
    gb(CAMP, E, 'Le petit est sauvé, et sa mère aussi. Mais vous… vous avez l’air d’avoir vécu cent ans en une journée.', (E, 'happy'), (K, 'sad')),
    gb(CAMP, JG, 'Pour une illusion, elle nous a sacrément secoués. Nous avons décidé de passer la nuit ici pour faire le point et récupérer.', (J, 'sad'), (B, 'sad')),
]})
parts.append({'id': 'c8p2', 'chapter': 8, 'title': 'Partie 2 : Le rêve d’Orcus', 'intro': [
    gb(DREAM, JG, 'Impossible d’être tranquilles. Cette nuit-là, nous sommes tous tombés dans le même rêve : Orcus et Caleïzis, en train de comploter.', (G, 'angry'), (CA, 'haughty')),
    gb(DREAM, CA, 'Je t’ai rendu service, Orcus. À ton tour de m’aider quand l’heure viendra.', (CA, 'haughty')),
    gb(DREAM, JG, 'Ils parlaient d’une prophétie, des sages, de Forfalla, de Mirrhol… et de notre groupe. Il nous reste encore bien des zones d’ombre à éclaircir.', (G, 'thinking'), (CA, 'haughty')),
    gb(DREAM, JG, 'J’ai senti la haine monter en moi. Mais je me suis contenu : la mission compte plus que ma vengeance, et je dois protéger mes compagnons, pas les mettre en danger.', (G, 'angry')),
    gb(CAMP, E, 'Moi aussi, j’ai rêvé cette nuit. Mais autre chose : un Céleste est venu me guider. Il ne m’a pas dit son nom.', (E, 'thinking'), (G, 'neutral')),
    gb(CAMP, G, 'Un Céleste qui ne se présente pas ? Je trouve ça louche. Méfie-toi : ce pourrait être un usurpateur.', (G, 'thinking'), (E, 'neutral')),
]})
parts.append({'id': 'c8p3', 'chapter': 8, 'title': 'Partie 3 : Neige et départ de Bosco', 'intro': [
    gb(SNOW, JG, 'Nous avons repris le chemin de Mirrhol. Il faisait de plus en plus froid.', (G, 'neutral'), (K, 'neutral')),
    gb(SNOW, B, 'De la neige aux fruits ! Goûtez-moi ça, c’est un délice !', (B, 'happy'), (BO, 'happy')),
    gb(SNOW, JG, 'Nous en avons dégusté avec Bolduc et Bosco. C’était plutôt bon, je l’avoue.', (G, 'happy'), (B, 'happy')),
    gb(SNOW, JG, 'Arrivés à l’entrée de la route de Mirrhol, nous avons commencé nos préparatifs : un déguisement de marchands, pour passer inaperçus.', (K, 'neutral'), (J, 'neutral')),
    gb(SNOW, JG, 'C’est alors que Maebril est arrivé… toujours aussi nu. Bosco est reparti avec lui.', (MA, 'happy'), (BO, 'happy')),
    gb(SNOW, G, 'Fais attention à toi, Bosco. Et ne touche pas à tout ce qui traîne !', (G, 'neutral'), (BO, 'shy')),
    gb(SNOW, JG, 'J’espère qu’il ne va pas trop se mettre en danger, avec sa manie de vouloir toucher, voire prendre pour lui, tout ce qui traîne… pour ne pas dire voler.', (G, 'thinking')),
]})
parts.append({'id': 'c8p4', 'chapter': 8, 'title': 'Partie 4 : La brume maudite', 'intro': [
    gb(MIST, JG, 'Nous sommes vraiment entrés sur la route de Mirrhol. Toute la zone est recouverte d’une brume très épaisse, qui ne paraît pas naturelle.', (G, 'neutral'), (K, 'scared')),
    gb(MIST, E, 'Cette brume découle d’une malédiction. Je le sens.', (E, 'thinking'), (G, 'neutral')),
    gb(MIST, JG, 'Une malédiction de plus… Des silhouettes obscures nous entouraient dans la brume. Nous sommes restés sur nos gardes tant qu’elles ne montraient pas d’hostilité.', (G, 'fight'), (J, 'scared')),
    gb(MIST, 'Matrick', 'Suivez-moi jusqu’au village, voyageurs. Ici, il ne faut pas traîner.', (K, 'neutral'), (G, 'thinking')),
    gb(MIST, JG, 'Matrick, drôle de nom. Nous l’avons suivi, un peu méfiants au début. Il porte une amulette qui permet de parcourir la route avec moins de risques d’être attaqué par ces créatures étranges.', (G, 'thinking'), (J, 'neutral')),
]})
parts.append({'id': 'c8p5', 'chapter': 8, 'title': 'Partie 5 : Mirrhol', 'intro': [
    gb(INN, JG, 'Au village, nous nous sommes restaurés à l’auberge. Un vrai repas chaud, enfin !', (B, 'happy'), (G, 'happy')),
    gb(INN, JG, 'Puis nous sommes allés voir Vanessa, la cartographe de Mirrhol, pour obtenir une carte jusqu’à la pierre d’Aliam.', (K, 'neutral'), (J, 'neutral')),
    gb(INN, 'Vanessa', 'La pierre d’Aliam, couverte de runes… Tout le village pense que c’est le cœur de la malédiction qui pèse sur notre route.', (J, 'thinking'), (G, 'neutral')),
    gb(INN, JG, 'Jhimm, toujours aussi généreux et bienveillant, a payé de sa poche le service que Vanessa nous rendait.', (J, 'happy'), (G, 'proud')),
    gb(INN, 'Matrick', 'Prenez mon amulette. Vous en aurez plus besoin que moi, là où vous allez.', (G, 'surprised'), (K, 'happy')),
    gb(INN, JG, 'Matrick nous a confié son amulette pour nous aider dans notre quête. Et nous nous sommes mis en route vers la pierre.', (G, 'proud'), (E, 'neutral')),
]})
parts.append({'id': 'c8p6', 'chapter': 8, 'title': 'Partie 6 : Les formes dans la brume', 'intro': [
    gb(STONE, JG, 'Très vite, des formes nous ont entourés et poursuivis. Nous avons essayé d’avancer au maximum, mais elles se rapprochaient trop.', (G, 'fight'), (K, 'scared')),
    gb(STONE, E, 'Assez ! Je ne les laisserai pas nous encercler !', (E, 'fight'), (OM, 'fight')),
    gb(STONE, JG, 'C’est Ébérien qui a lancé les hostilités. Ça ne lui ressemble pas… mais c’est bien : il apprend à agir vite quand le danger est imminent, lui qui se pose d’habitude mille questions.', (E, 'fight'), (G, 'proud')),
], 'victory': [
    gb(STONE, JG, 'Nous avons mis ces créatures à terre sans trop de difficulté. Seul Ébérien a pris quelques coups ; Bolduc et Kala l’ont remis sur pied. C’est vraiment une brindille.', (E, 'sad'), (B, 'happy'), (K, 'neutral')),
    gb(STONE, 'Une voix', 'Vous avez tué mes enfants… Venez me rejoindre dans la grotte, près de la pierre.', (G, 'angry'), (J, 'scared')),
    gb(STONE, JG, 'Ses enfants ? C’étaient des morts-vivants, qu’il faut détruire pour qu’ils reposent en paix. Et lui, nous allions justement venir le détruire. Ça tombe bien.', (G, 'angry')),
], 'lose': [
    gb(STONE, JG, 'Les formes nous ont repoussés dans la brume. Serrons les rangs, et recommençons.', (G, 'angry'), (E, 'sad')),
], 'duel': {'foe': 'Les ombres de la brume', 'terrain': 'vent', 'level': 'moyen', 'dice': [248, 248, 246, 247, 249, 250, 251, 252, 255, 248],
            'cards': ['Les ombres de la brume', 'Les ombres de la brume', 'Les ombres de la brume', 'Les ombres de la brume', 'Les ombres de la brume']}})
parts.append({'id': 'c8p7', 'chapter': 8, 'title': 'Partie 7 : La pierre d’Aliam', 'intro': [
    gb(STONE, JG, 'Nous sommes arrivés au mégalithe : une grande pierre couverte de runes, au cœur de la brume.', (G, 'neutral'), (E, 'thinking')),
    gb(STONE, E, 'Ces runes sont brisées… Je ne vois pas comment la réparer. Pas encore.', (E, 'sad'), (K, 'neutral')),
    gb(STONE, G, 'Alors allons rendre visite à celui qui nous menace.', (G, 'fight'), (J, 'neutral')),
    gb(CAVE, JG, 'Nous sommes entrés dans la grotte et avons avancé jusqu’à une très grande salle. Une créature gigantesque nous y attendait : un élémentaire de vent majeur, un tourbillon vivant.', (CR, 'neutral'), (G, 'fight'), (K, 'scared')),
    gb(CAVE, CR, 'Mes frères… Vous les avez détruits. Vous allez les rejoindre.', (CR, 'angry'), (G, 'angry'), (J, 'scared')),
]})
parts.append({'id': 'c8p8', 'chapter': 8, 'title': 'Partie 8 : Le gardien de la grotte', 'intro': [
    gb(CAVE, JG, 'Autour de la créature, l’air s’est mis à tourbillonner, et de petites silhouettes se sont détachées des parois : d’autres morts-vivants, ses « enfants ».', (OM, 'fight'), (K, 'scared'), (J, 'scared')),
    gb(CAVE, G, 'Occupez-vous des petits. Le grand est pour moi !', (G, 'fight'), (E, 'fight'), (B, 'fight')),
    gb(CAVE, JG, 'Le combat a commencé. Mes camarades se sont occupés des petits morts-vivants avec facilité, et moi, j’ai chargé le monstre.', (G, 'fight'), (K, 'fight'), (B, 'fight')),
    gb(CAVE, JG, 'Il a fait quelque chose qui m’empêchait de le toucher. Mais il ne pourrait pas fuir mon courroux indéfiniment.', (CR, 'fight'), (G, 'angry')),
], 'victory': [
    gb(CAVE, JG, 'Peu après, avec l’aide de mon dieu, j’ai pu lui asséner deux attaques dévastatrices.', (G, 'fight')),
    gb(CAVE, JG, 'Mais le combat n’est pas terminé : il est toujours debout… et il fait venir d’autres ombres.', (CR, 'angry'), (G, 'surprised'), (J, 'scared')),
    gb(CAVE, G, 'Restez près de moi. Ce n’est pas fini.', (G, 'fight'), (E, 'fight')),
], 'lose': [
    gb(CAVE, JG, 'Le monstre nous a repoussés jusqu’à l’entrée de la salle. Je ne lâcherai pas : on y retourne !', (G, 'angry')),
], 'duel': {'foe': 'Le gardien de la grotte', 'terrain': 'vent', 'level': 'difficile', 'dice': [322, 248, 248, 255, 246, 249, 250, 251, 252, 247],
            'cards': ['Le gardien de la grotte', 'Les ombres de la brume', 'Le gardien de la grotte', 'Les ombres de la brume', 'Le gardien de la grotte']}})
at = next((i for i, p in enumerate(data) if p['chapter'] > 8), len(data))
data[at:at] = parts
open(P, 'w', encoding='utf-8').write(head + '\n' + PRE + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';' + ('\n' if rest.endswith('\n') else ''))
print('chapitre VIII :', len(parts), 'parties,', sum(len(p.get('intro', [])) + len(p.get('victory', [])) for p in parts), 'répliques')
