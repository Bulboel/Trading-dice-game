# Usage : depuis un dossier contenant capture.json (capture des scènes de Bulboel/Triade-of-Hackenia), avec le dépôt Triade cloné à côté.
import json,re,os,shutil,base64,hashlib
SRC='/home/user/bulboel/triade-of-hackenia/';DST='/home/user/Trading-dice-game/assets/story/'
os.makedirs(DST,exist_ok=True)
d=json.load(open('capture.json'))
inline={}
def fixurl(s):
  def rep(m):
    u=m.group(1)
    if u.startswith('data:'):
      h=hashlib.md5(u.encode()).hexdigest()[:10];ext=u.split(';')[0].split('/')[1];name=f'inline-{h}.{ext}'
      if name not in inline:
        open(DST+name,'wb').write(base64.b64decode(u.split(',',1)[1]));inline[name]=1
      return f'url("assets/story/{name}")'
    u=re.sub(r'^https?://localhost:8766/','',u)
    if u.startswith('assets/story/'):
      f=u.split('?')[0];shutil.copy(SRC+f,'/home/user/Trading-dice-game/'+f)
    return f'url("{u}")'
  return re.sub(r'url\("([^"]+)"\)',rep,s) if isinstance(s,str) else s
def beat(b):
  o={'s':b['speaker'],'t':b['text'],'l':b['location'],'c':[x for x in b['sceneClass'] if x not in('has-portrait',)],'bg':fixurl(b['bg'])}
  if b['bgBefore']!='none':o['bgb']=fixurl(b['bgBefore'])
  cast=[]
  for x in b['cast']:
    if 'art' in x:
      shutil.copy(SRC+x['art'],'/home/user/Trading-dice-game/'+x['art']);cast.append({'art':x['art'],'alt':x['alt']})
    else:
      cast.append({'n':x['name'],'img':fixurl(x['img']),'sz':x['size'],'pos':x['pos'],'k':[c for c in x['cls'].split() if c!='story-sprite'],'e':x['emotion'],**({'p':x['portrait']} if x['portrait'] else {})})
  o['cast']=cast
  if b['choices']:o['choices']=[{'label':c['label'],'go':'duel' if 'duel' in c['action'] else 'silence'} for c in b['choices']]
  if b['next']!='Continuer':o['next']=b['next']
  return o
def seqs(lst):
  out=[]
  for c in lst or []:
    if 'beats' in c:out+= [beat(b) for b in c['beats']]
  return out
for p in d:
  if p.get('defeat') and not p.get('lose'):p['lose']=p['defeat']
  for b in [b for c in p.get('lose') or [] for b in c.get('beats',[])]:
    for x in b['cast']:
      if 'art' in x and x['art'].startswith('assets/story'):shutil.copy(SRC+x['art'],'/home/user/Trading-dice-game/'+x['art'])
# Réglages des duels en version dés.
DUELS={ # terrain, niveau IA, dés imposés à l'adversaire (ids du jeu de dés)
 'c1p1':('terre','facile',[25,26,41]),'c1p2':('terre','facile',[38,8]),'c1p4':('feu','moyen',[]),'c1p5':('feu','moyen',[]),
 'c1p6':('vent','moyen',[]),'c1p6bis':('terre','moyen',[8]),'c1p7':('glace','moyen',[]),'c1p8':('eau','difficile',[30]),
 'c1p9':('eau','difficile',[41]),'c1p10':('eau','difficile',[34]),'c2p1':('foudre','difficile',[25]),'c2p2':('vent','difficile',[40]),
 'c2p4':('terre','difficile',[]),'c2p5':('vent','difficile',[0,34]),'c2p6':('eau','difficile',[])}
parts=[]
for p in d:
  part={'id':p['id'],'chapter':1 if p['id'].startswith('c1') else 2,'title':p['title'],'intro':seqs(p['intro'])}
  if p.get('duel'):
    t,lv,dice=DUELS[p['id']];part['duel']={'foe':p['duel']['right'],'terrain':t,'level':lv,'dice':dice,'cards':[o['name'] for o in p['duel']['opponent']]}
    part['victory']=seqs(p.get('victory') or p.get('victoryDuel'));part['lose']=seqs(p.get('lose'))
  if p.get('victorySilence'):part['silence']=seqs(p['victorySilence'])
  if p['id']=='c1p6bonus':part['optional']=True
  parts.append(part)
js='/* Histoire de la Triade d’Hackénia (chapitres 1 et 2), reprise à l’identique : textes, décors, personnages. Généré par scripts/import-triade-story. */\nwindow.HACKENIA_STORY='+json.dumps(parts,ensure_ascii=False,separators=(',',':'))+';\n'
open('/home/user/Trading-dice-game/assets/story-data-v193.js','w',encoding='utf8').write(js)
print(len(parts),sum(len(p['intro'])+len(p.get('victory',[]))+len(p.get('lose',[]))+len(p.get('silence',[])) for p in parts),'beats',len(js)//1024,'KB',len(inline),'inline imgs')
for p in parts:print(p['id'],len(p['intro']),p.get('duel',{}).get('foe'),len(p.get('victory',[])),len(p.get('lose',[])),[b.get('choices') for b in p['intro'] if b.get('choices')])
# Adaptations minimales au jeu de dés.
REPL=[('une petite partie de Triade','une petite partie de dés'),('un duel de Triade','un duel de dés'),('une partie de Triade','une partie de dés'),('fan de la Triade','fan des duels de dés'),
 (' Attention : ce duel se joue avec la règle « Addition » (Clair). Si les valeurs de deux côtés adjacents forment la même somme, les cartes concernées peuvent être capturées !',''),
 ('Provoquer Caleizis — duel Éléments actifs (Clair)','Provoquer Caleizis en duel de dés')]
def adapt(t):
  for a,b in REPL:t=t.replace(a,b)
  t=t.replace(' Attention : ce duel se joue avec la règle « Identique » (Clair). Si les valeurs de plusieurs côtés en contact sont identiques, vous pouvez retourner plusieurs cartes à la fois.','')
  t=t.replace('Nous jouerons en Clair, avec Addition et Identique réunies. Deux sommes égales peuvent déclencher Addition ; deux valeurs égales en contact peuvent déclencher Identique. Montrez-moi votre manière de jouer.','Montrez-moi votre manière de jouer.')
  t=t.replace('La pixie joue en Clair, avec toutes les règles : Addition, Identique et Éléments actifs. Sa main est visible, et les bonus élémentaires s’appliquent aux contacts avant les captures.','La pixie joue avec ses dés les plus malicieux, et les bonus élémentaires comptent dans chaque combat.')
  t=t.replace('Le duel contre le golem se joue en Obscur, avec la règle Addition. Deux sommes égales sur des contacts adjacents peuvent déclencher des captures.','Le golem de pierre est massif : ses dés de terre frappent fort sur ce terrain.')
  t=t.replace('Le duel contre Zackarie se joue en Obscur, avec la règle Éléments. Sa main reste cachée : choisissez les bons contacts élémentaires pour prendre l’avantage.','Zackarie cache bien son jeu : jouez avec les bonus élémentaires pour prendre l’avantage.')
  return t
for p in parts:
  for k in ['intro','victory','lose','silence']:
    for b in p.get(k,[]):
      b['t']=adapt(b['t'])
      for c in b.get('choices',[]):c['label']=adapt(c['label'])
js='/* Histoire de la Triade d’Hackénia (chapitres 1 et 2), reprise à l’identique (textes, décors, personnages) ; seuls les duels deviennent des duels de dés. */\nwindow.HACKENIA_STORY='+json.dumps(parts,ensure_ascii=False,separators=(',',':'))+';\n'
open('/home/user/Trading-dice-game/assets/story-data-v193.js','w',encoding='utf8').write(js)
