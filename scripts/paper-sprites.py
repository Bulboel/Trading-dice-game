#!/usr/bin/env python3
"""v457 — Poses des figurines en papier (assets/manifest.json, champ « sprite ») déduites des planches d'émotions :
garde = neutre (ou content), victoire = content, coup reçu = effrayé, K.-O. = vraie pose K.-O. seulement (jamais la pose triste),
attaque = pose de combat puis, s'il existe une planche « <perso> attaque », ses deux images (élan, coup) : l'attaque s'anime.
Relancer après avoir ajouté une planche : python3 scripts/split-emotions.py && python3 scripts/paper-sprites.py"""
import json,re,subprocess,os
os.chdir(os.path.dirname(os.path.abspath(__file__))+'/..')
P=json.loads(subprocess.check_output(['node','-e',"global.window={};require('./assets/story-emotions-v429.js');console.log(JSON.stringify(window.HackeniaEmo.poses))"]))
idx=json.load(open('assets/story/emo/index.json'))
raw=open('assets/manifest.json',encoding='utf-8').read();m=json.loads(raw);n=0
for k,v in m['creatures'].items():
    sp=v.get('sprite')
    if not sp or v.get('glb'):continue
    first=next(iter(sp.values()));base=re.match(r'story/emo/(.+)-\d+\.webp$',first if isinstance(first,str) else first[0])
    if not base or base.group(1) not in P:continue
    e=base.group(1);E=P[e];f=lambda s:f'story/emo/{s}.webp'
    calm=E.get('neutral') or E.get('happy') or next(iter(E.values()))
    new={'idle':f(calm),'walk':f(calm)}
    atk=[f(E[x]) for x in ('fight','angry') if E.get(x)][:1]
    atk+=[p.replace('assets/','') for p in idx.get(e+'-attaque',[])]
    if not atk:atk=[f(calm)]
    new['attack']=atk if len(atk)>1 else atk[0]
    if E.get('scared') or E.get('surprised'):new['hit']=f(E.get('scared') or E['surprised'])
    if E.get('ko'):new['ko']=f(E['ko'])
    new['win']=f(E.get('happy') or calm)
    if v['sprite']!=new:v['sprite']=new;n+=1
open('assets/manifest.json','w',encoding='utf-8').write(json.dumps(m,ensure_ascii=False,indent=2)+('\n' if raw.endswith('\n') else ''))
print(n,'figurines mises à jour')
