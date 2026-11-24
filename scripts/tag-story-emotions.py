#!/usr/bin/env python3
"""v429 — Humeur des personnages de l'Histoire, réplique par réplique (champ « m » de chaque membre du « cast »).
Lue par assets/story-v193.js pour afficher la bonne pose des planches d'émotions (assets/story/emo/, scripts/split-emotions.py).
Règles : la réplique d'un personnage colore son humeur (mots-clés du texte) ; une phrase de la voix off qui nomme un
personnage colore la sienne ; une phrase collective (« ils », « la compagnie »…) colore tout le monde. Sans indice : neutre,
ou l'expression choisie à la main auparavant (champ « e ») quand elle est marquée (joie, fierté, larmes…).
Relancer après toute modification de assets/story-data-v193.js : python3 scripts/tag-story-emotions.py"""
import json,re,collections
P='assets/story-data-v193.js'
CUES=[('ko',r"assomm|inconscien|évanoui|k\.-?o\b|perd connaissance|est étourdi|s’effondre"),
 ('scared',r"\bpeur\b|effray|terrifi|panique|au secours|fuyez|tremble|\baïe\b|aaa+h|horreur|frisson|recule"),
 ('sad',r"trist|je pleure|pleurent|en pleurs|larmes|hélas|malheureusement|chagrin|deuil|snif|déçu|déception|sanglot|attristé"),
 ('angry',r"colère|furieu|inadmissible|\brage|grogne|enrag|maudit|scandal|insupportable|\bgrr|vexé|agacé|énerv|outré|s’emporte"),
 ('fight',r"combat s’engage|à l’assaut|chargez|en garde|montrez-vous|parés au combat|dégain|les lames sortent|attaquez|à l’attaque|se jettent sur|fonce sur|pour le combat|au combat !"),
 ("happy",r"hé hé|ha ha|haha|hi hi|me plaît|j’adore|génial"),
 ('surprised',r"^(hein|quoi|oh|ah|wow|hé)\b|incroyable|surpris|étonn|sursaut|stupéf|bouche bée|n’en reviennent|impossible|\?!|!\?|grands yeux"),
 ('happy',r"\brit\b|\brient\b|\brire\b|riant|souri|ha ha|haha|génial|\bsuper\b|merci|bravo|ravi|youpi|hourra|parfait|\bjoie|content|heureu|chouette|félicit|bonne nouvelle|excellent|formidable|ouf\b|amusé|s’esclaffe|chante|bien joué|soulagé"),
 ('thinking',r"réfléchi|\bhmm|je me demande|perplexe|intrigu|songeu|pensif|pensive")]
GROUP_MOODS={'fight','happy','surprised','thinking','scared'}
GROUP=r"\bils\b|la compagnie|les aventuriers|le groupe|tout le monde|ses amis|nos héros|nos aventuriers"
# Réglages à la main (partie, séquence, n° de réplique, personnage) → humeur, prioritaires sur les mots-clés.
OVERRIDES={('c1p5','intro',1,'Jhimm'):'neutral',('c1p5','intro',2,'Jhimm'):'fight',('c1p5','intro',3,'Jhimm'):'fight',('c1p5','intro',4,'Jhimm'):'neutral'}
KEEP={'happy','proud','haughty','blasé','friendly','crying','embarrassed'}
def mood(text):
    t=text.lower()
    for m,rx in CUES:
        if re.search(rx,t):return m
    return None
def first(name):return name.split(' ')[0].split('-')[0]
s=open(P,encoding='utf-8').read();head,rest=s.split('\n',1);pre='window.HACKENIA_STORY='
data=json.loads(rest[len(pre):].rstrip('\n')[:-1]);stats=collections.Counter()
for part in data:
    for k in ('intro','victory','lose','silence'):
        for bi,b in enumerate(part.get(k) or []):
            cast=[c for c in b.get('cast',[]) if c.get('n') and not c.get('art')];text=b.get('t','');sp=b.get('s','')
            for c in cast:c.pop('m',None)
            if not cast:continue
            found={}
            if sp and sp!='Voix off':
                m=mood(text)
                for c in cast:
                    if c['n']==sp and m:found[c['n']]=m
            else:
                for sent in re.split(r'(?<=[.!?…])\s+',re.sub(r'«[^»]*»','',text)):
                    m=mood(sent)
                    if not m:continue
                    named=[c['n'] for c in cast if re.search(r'\b'+re.escape(first(c['n'])),sent)]
                    for n in named:found.setdefault(n,m)
                    if not named and m in GROUP_MOODS and re.search(GROUP,sent.lower()):
                        for c in cast:found.setdefault(c['n'],m)
            for c in cast:
                m=OVERRIDES.get((part['id'],k,bi,c['n'])) or found.get(c['n']) or (c.get('e') if c.get('e') in KEEP else 'neutral')
                if m=='crying':m='sad'
                if m=='embarrassed':m='shy'
                if m!='neutral':c['m']=m
                stats[m]+=1
open(P,'w',encoding='utf-8').write(head+'\n'+pre+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';'+('\n' if rest.endswith('\n') else ''))
print(dict(stats))
