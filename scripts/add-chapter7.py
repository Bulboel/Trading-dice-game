#!/usr/bin/env python3
"""v458 — Chapitre VII « Les malices d’Erevan, détour vers Mirrhol », raconté par Erevan (d’après le récit du joueur). Parties c7p1 à c7p9, 2 duels.
Relancer ensuite : python3 scripts/tag-story-emotions.py && python3 scripts/story-sprite-bounds.py"""
import json
P = 'assets/story-data-v193.js'
head, rest = open(P, encoding='utf-8').read().split('\n', 1)
PRE = 'window.HACKENIA_STORY='
data = json.loads(rest[len(PRE):].rstrip('\n')[:-1])
data = [p for p in data if not p['id'].startswith('c7')]

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
K, E, B, G, J, BO, EV, CA = 'Kala', 'Ébérien', 'Bolduc', 'Grimgors', 'Jhimm', 'Bosco', 'Erevan', 'Caleïzis'
def emo(n): return {'img': f'url("assets/story/emo/{n}.webp")', 'sz': 'contain', 'pos': 'center bottom'}
TPL[BO] = emo('bosco-2'); TPL[EV] = emo('erevan-2'); TPL[CA] = emo('caleizis-2')
DR = 'Les drones fantassins'; TPL[DR] = emo('drone-pentagone-2')
NEST = ('Le nid des licornes', ['forest'], bg('assets/story/forest-background.webp', 'rgba(60, 30, 90, 0.18), rgba(20, 8, 30, 0.5)'))
TOWER = ('La tour de Kala', ['night'], bg('assets/story/egide-leg-background.webp', 'rgba(70, 30, 110, 0.32), rgba(16, 6, 28, 0.6)'))
FATE = ('La salle de destinée', ['night'], bg('assets/story/fairy-mists-district.webp', 'rgba(40, 20, 70, 0.2), rgba(12, 6, 24, 0.5)'))
WOOD = ('Les bois d’Erevan', ['forest'], bg('assets/story/forest-background.webp', 'rgba(30, 20, 50, 0.25), rgba(8, 6, 16, 0.6)'))
BTRIAL = ('L’épreuve de Bosco', ['night'], bg('assets/story/twins-cave-background.webp', 'rgba(20, 40, 60, 0.25), rgba(6, 10, 20, 0.6)'))
FLAMES = ('La salle des flammes', ['night'], bg('assets/story/ice-ritual-background.webp', 'rgba(140, 60, 10, 0.35), rgba(30, 10, 2, 0.6)'))
GTRIAL = ('L’épreuve de Grimgors', ['night'], bg('assets/story/ice-ritual-background.webp', 'rgba(130, 10, 20, 0.45), rgba(30, 2, 6, 0.75)'))
FIELD = ('Le champ de bataille d’Erevan', ['night'], bg('assets/story/erevan-battlefield-background.webp', 'rgba(20, 4, 14, 0.06), rgba(10, 2, 8, 0.42)'))
def eb(place, speaker, text, *cast, mood='friendly', art=None):
    """Réplique du chapitre VII : Erevan raconte, depuis le nid de ses licornes, et il est à l’image quand il parle."""
    if speaker == EV and not art and EV not in [n for n, _ in cast]:
        cast = ((EV, mood),) + cast
    out = beat(place, speaker, text, *cast, art=art)
    if speaker == EV:
        for c in out['cast']:
            if c.get('n') == EV: c['k'] = ['is-speaking']
    return out
parts = []
parts.append({'id': 'c7p1', 'chapter': 7, 'title': 'Partie 1 : Le nid des licornes', 'intro': [
    eb(NEST, EV, 'Ah, mes licornes… D’après ce que je vois dans leur nid, ces petits aventuriers que j’ai envoyés subir mes foudres dans ma « caverne aux destins » ne sont pas responsables de la mort de ma précieuse licorne.', mood='sad'),
    eb(NEST, EV, 'Soit. Je les ai quand même laissés apprendre d’eux-mêmes… d’autant plus qu’ils m’amusent beaucoup, hahaha !', mood='friendly'),
    eb(NEST, EV, 'Rappelons-nous où ils en sont : le petit humain, Jhimm, a retrouvé son livre ; le tout petit bonhomme rigolo, Bolduc, sa cuillère. Il reste trois épreuves : celle de mon enfant elfe, Kala, celle du petit oiseau, Bosco, et celle du demi-orque, Grimgors.', (J, 'neutral'), (B, 'happy'), mood='haughty'),
    eb(NEST, EV, 'Regardons la suite. Je ne voudrais pas manquer le spectacle.', mood='friendly'),
]})
parts.append({'id': 'c7p2', 'chapter': 7, 'title': 'Partie 2 : La tour de Kala', 'intro': [
    eb(TOWER, EV, 'Après la salle de mes chefs drones, le petit humain ne semble pas bien. Mais le groupe décide d’avancer quand même. C’est marrant comme elles sont fragiles, ces petites choses.', (J, 'sad'), (G, 'neutral'), mood='haughty'),
    eb(TOWER, G, 'Tiens bon, Jhimm. On monte ensemble.', (G, 'neutral'), (J, 'sad')),
    eb(TOWER, EV, 'Les voilà qui montent la tour de mon enfant elfe. Et le petit oiseau est toujours aussi attiré par mes jolies décorations !', (BO, 'happy'), (K, 'neutral')),
    eb(TOWER, BO, 'Oh, regardez celle-là… Et celle-là ! Je peux juste…', (BO, 'happy'), (B, 'happy')),
    eb(TOWER, B, 'Ne pas toucher, Bosco ! C’est notre devise !', (B, 'happy'), (BO, 'shy')),
    eb(TOWER, EV, 'Je ne comprends pas. Malgré tous les souvenirs que je leur ai laissés, ils n’ont rien voulu prendre. Quels rabat-joie !', (BO, 'sad'), mood='sad'),
]})
parts.append({'id': 'c7p3', 'chapter': 7, 'title': 'Partie 3 : Le dernier étage', 'intro': [
    eb(TOWER, EV, 'Ils arrivent enfin au dernier étage de la tour. Deux chemins s’offrent à eux : combattre mes fantassins drones, ou monter au travers de mes pièges.', (K, 'thinking'), (G, 'neutral')),
    eb(TOWER, K, 'Les pièges, c’est son terrain à lui. Je préfère encore voir venir l’ennemi.', (K, 'thinking'), (J, 'neutral')),
    eb(TOWER, G, 'Alors on se bat. Restez groupés.', (G, 'fight'), (B, 'fight')),
    eb(TOWER, EV, 'Ils mettent du temps à choisir… mais finissent par choisir le combat. Ils ont le sang chaud, ces petits !', (DR, 'fight'), mood='fight'),
], 'victory': [
    eb(TOWER, EV, 'C’était distrayant de les voir s’agiter dans tous les sens et taper sur mes petites mouches, héhéhé.', (G, 'fight'), (BO, 'fight'), (DR, 'ko'), mood='friendly'),
    eb(TOWER, EV, 'Et ils ont l’air de s’être bien amusés, eux aussi.', (B, 'happy'), (K, 'happy')),
], 'lose': [
    eb(TOWER, EV, 'Mes petites mouches les ont renvoyés à l’escalier. Allez, encore un essai : je n’ai pas fini de m’amuser !', (G, 'angry'), mood='friendly'),
], 'duel': {'foe': 'Les drones fantassins', 'terrain': 'foudre', 'level': 'difficile', 'dice': [316, 316, 316, 316, 316, 247, 248, 249, 251, 252],
            'cards': ['Les drones fantassins', 'Les drones fantassins', 'Les drones fantassins', 'Les drones fantassins', 'Les drones fantassins']}})
parts.append({'id': 'c7p4', 'chapter': 7, 'title': 'Partie 4 : La salle de destinée', 'intro': [
    eb(FATE, EV, 'Mon enfant elfe est entrée dans sa salle de destinée. J’ai senti que les combats l’avaient chamboulée intérieurement, et que ses ambitions étaient à un tournant.', (K, 'thinking'), mood='friendly'),
    eb(FATE, EV, 'Kala, mon enfant… et si tu te laissais tenter par une nouvelle destinée ?', (EV, 'friendly'), (K, 'surprised')),
    eb(FATE, EV, 'Elle l’a embrassée sans hésiter, en déclamant un poème divinement inspiré, hahaha !', (K, 'happy'), mood='friendly'),
    eb(FATE, K, '« Mon arc a choisi la lune, ma voix a choisi le vent : que ma flèche devienne chant, et le destin m’appartient ! »', (K, 'happy')),
    eb(FATE, EV, 'Une fois sortie de la tour, elle a même joué avec l’une de ses nouvelles capacités magiques : une main flottante. Qu’ils sont mignons quand ils jouent avec les jouets qu’on leur donne !', (K, 'happy'), (B, 'surprised')),
    eb(FATE, B, 'Une main qui flotte toute seule ! Elle peut attraper du fromage ?', (B, 'happy'), (K, 'happy')),
]})
parts.append({'id': 'c7p5', 'chapter': 7, 'title': 'Partie 5 : Le perroquet guide', 'intro': [
    eb(WOOD, EV, 'Les voilà repartis vers l’épreuve suivante, celle du petit oiseau. Non sans se méfier des arbres et des plantes ! Ils sont vraiment craintifs. Je me demande comment ils font pour ne pas avoir peur de leur ombre.', (K, 'scared'), (J, 'scared'), mood='haughty'),
    eb(WOOD, EV, 'Pendant une pause, le tout petit bonhomme rigolo a proposé un rouleau détraqué au petit oiseau. Je l’aime bien, lui : il ose, il aime jouer. Il faudra que je le prenne un jour dans un de mes jeux, pour faire peur à des aventuriers !', (B, 'happy'), (BO, 'surprised'), mood='friendly'),
    eb(WOOD, B, 'Tiens, Bosco : un parchemin magique. Il est un peu… détraqué. Mais c’est ce qui fait son charme !', (B, 'happy'), (BO, 'thinking')),
    eb(WOOD, EV, 'Sur le chemin, le demi-orque a joué avec le petit oiseau en le lançant très haut, à la verticale. Je n’ai pas compris, mais l’oiseau a l’air d’avoir aimé. Ils sont bizarres, quand même.', (G, 'proud'), (BO, 'happy')),
    eb(WOOD, EV, 'J’ai envoyé un perroquet pour les guider : ils n’avaient pas l’air bien dégourdis. Je l’avais réglé en langage de base… et j’ai bien fait : le petit oiseau a tout de suite entamé la conversation.', (BO, 'happy'), mood='friendly'),
    eb(WOOD, BO, 'Par ici ? Merci, cousin à plumes !', (BO, 'happy'), (G, 'neutral')),
]})
parts.append({'id': 'c7p6', 'chapter': 7, 'title': 'Partie 6 : L’épreuve de Bosco', 'intro': [
    eb(BTRIAL, EV, 'Arrivés à l’entrée de son épreuve, ils sont descendus, et ils ont beaucoup débattu pour savoir comment passer la première salle… gardée par mes dragons.', (K, 'thinking'), (G, 'thinking'), mood='friendly'),
    eb(BTRIAL, EV, 'Leur solution : ligoter le petit oiseau sur le dos du demi-orque. Vraiment bizarres ! Il devait être fatigué d’avoir couru après mon perroquet.', (G, 'proud'), (BO, 'shy')),
    eb(BTRIAL, EV, 'Ils n’ont même pas voulu jouer avec les dragons. Dommage. Il y a des éléments rabat-joie dans ce groupe…', (J, 'neutral'), (K, 'neutral'), mood='sad'),
    eb(FLAMES, EV, 'Dans la salle suivante, mes petites flammes ont fait leur jolie danse. Et cette bande de joyeux drilles a pris le temps de danser avec elles ! Ils ne sont pas irrécupérables, finalement.', (B, 'happy'), (BO, 'happy'), (K, 'happy'), mood='friendly'),
    eb(FLAMES, EV, 'Dans la dernière salle, le petit oiseau a entonné un joli chant. Les autres chanteurs n’ont pas trop apprécié : un démon s’en est vite débarrassé, avant de repartir par son portail.', (BO, 'happy'), (J, 'scared'), mood='haughty'),
    eb(FLAMES, BO, 'Ils n’aimaient pas ma chanson ? Tant pis pour eux !', (BO, 'happy'), (B, 'happy')),
]})
parts.append({'id': 'c7p7', 'chapter': 7, 'title': 'Partie 7 : L’épreuve de Grimgors', 'intro': [
    eb(WOOD, EV, 'La joyeuse troupe a repris le chemin de la dernière épreuve : celle du demi-orque. Je les sentais impatients d’en terminer. Ils avaient compris depuis un moment que chacun aurait la sienne. Pas si bêtes, finalement…', (G, 'neutral'), (K, 'neutral'), mood='haughty'),
    eb(GTRIAL, EV, 'Le cœur de ce demi-orque est bien particulier : en entrant dans son épreuve, ils ont tous pris une apparence démoniaque ! Il faudra que je me penche là-dessus.', (G, 'angry'), (B, 'scared'), (J, 'scared'), mood='fight'),
    eb(GTRIAL, EV, 'Dès la première salle, il n’a pas pu résister à l’appel de la violence. J’aime bien : ça a pimenté mon spectacle. Il n’y avait plus beaucoup d’action depuis mes mouches.', (G, 'fight'), mood='friendly'),
    eb(GTRIAL, EV, 'Puis sont apparus leurs doubles. Et le premier instinct du demi-orque a été de s’attaquer lui-même, avec une violence inouïe… Il aurait besoin de se faire soigner, celui-là.', (G, 'fight'), (K, 'scared'), mood='scared'),
], 'victory': [
    eb(GTRIAL, EV, 'Ils sont venus à bout de leurs doubles assez vite… sauf le tout petit bonhomme grassouillet, qui a duré un peu plus longtemps. Il a de la ressource, quand même !', (B, 'fight'), (G, 'proud'), mood='friendly'),
], 'lose': [
    eb(GTRIAL, EV, 'Les doubles ont eu le dessus, cette fois. Se battre contre soi-même, ce n’est jamais simple… Recommencez !', (G, 'sad'), mood='sad'),
], 'duel': {'foe': 'Les doubles', 'terrain': 'feu', 'level': 'difficile', 'dice': [38, 37, 39, 40, 29, 76, 77, 246, 248, 250],
            'cards': ['Le double de Grimgors', 'Le double de Kala', 'Le double de Jhimm', 'Le double de Bolduc', 'Le double de Bosco']}})
parts.append({'id': 'c7p8', 'chapter': 7, 'title': 'Partie 8 : Les vieilles rancœurs', 'intro': [
    eb(GTRIAL, EV, 'Dans la salle suivante, des démons. Cette fois, ils ont assez vite choisi de ne pas s’acharner sur eux. Le demi-orque a l’air d’apprendre… Il ne faut pas s’acharner sur de vieilles rancœurs : ça finit toujours mal !', (G, 'thinking'), mood='friendly'),
    eb(GTRIAL, EV, 'À la fin de son épreuve, il devait comprendre qu’il est bien trop tôt pour s’attaquer à Orcus… et il aurait dû mourir de sa haine aveugle.', (G, 'angry'), mood='haughty'),
    eb(GTRIAL, G, 'Orcus ! Montre-toi, que je te…', (G, 'angry'), (J, 'scared')),
    eb(GTRIAL, EV, 'Mais cette satanée Caleïzis s’en est mêlée, et a empêché mon divertissement final ! Elle me le paiera un jour : je n’aime pas qu’on s’immisce dans mes petits jeux !', (CA, 'haughty'), (G, 'surprised'), mood='fight'),
]})
parts.append({'id': 'c7p9', 'chapter': 7, 'title': 'Partie 9 : Fin de partie', 'intro': [
    eb(FIELD, EV, 'Bon. J’ai quand même décidé d’arrêter là le jeu.', mood='sad'),
    eb(FIELD, EV, 'Vous m’avez bien amusé, petits aventuriers. Je rejouerai peut-être avec vous un jour… Vous vous êtes tellement amusés, et moi aussi. Alors pourquoi pas ?', (EV, 'friendly'), (B, 'happy'), (G, 'neutral')),
    eb(FIELD, EV, 'J’en ai profité pour achever la transformation de mon enfant, qui s’est clairement retrouvée dans sa nouvelle voie. Elle m’en sera forcément reconnaissante.', (K, 'happy'), mood='haughty'),
    eb(FIELD, EV, 'Avant de les laisser, j’ai vu l’autre de mes enfants, Ébérien, rejoindre le groupe. Ils ont échangé un peu…', (E, 'happy'), (K, 'happy'), (J, 'happy'), mood='friendly'),
    eb(FIELD, E, 'Je vous ai manqué ? On dirait que vous avez eu de drôles d’aventures sans moi.', (E, 'happy'), (B, 'happy')),
    eb(FIELD, EV, '… avant que le demi-orque et le petit oiseau refassent leur jeu de saut. Complètement raté, celui-là ! Ils sont prêts pour le cirque, ceux-là. Hahaha !', (G, 'surprised'), (BO, 'scared'), mood='friendly'),
]})
data.extend(parts)
open(P, 'w', encoding='utf-8').write(head + '\n' + PRE + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';' + ('\n' if rest.endswith('\n') else ''))
print('chapitre VII :', len(parts), 'parties,', sum(len(p.get('intro', [])) + len(p.get('victory', [])) for p in parts), 'répliques')
