"""Build lightweight web portraits and animation-only GLBs from the uploaded exports."""
import copy, json, pathlib, struct
from PIL import Image
ROOT = pathlib.Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets'
SOURCE = ASSETS / 'Models/Characters'
OUTPUT = ASSETS / 'characters'
PORTRAITS = {
 'eberien':'Miniature eberien.png', 'kala':'Kala miniature.png',
 'grimgors':'Grimgors miniature.png', 'jhimm':'Jhimm miniature.png',
 'bolduc':'Bolduc miniature.png', 'gardienne':'gardienne miniature.png',
 'messire-balai':'Messire Balai miniature.png',
 'bosco':'Bosco miniature.png', 'bulbalina':'Bulbalina miniature.png',
 'pachie':'La fée pachié miniature.png', 'kayla-legendaire':'miniature Kayla.PNG',
 'bolduc-legendaire':'Bolduc légendaire miniature.PNG', 'caleizis':'Caleïzis divine miniature.png',
 'eberien-legendaire':'Eberien légendaire miniature.png', 'frolgor':'Frolgor peu commun miniature.png',
 'gliska':'Gliska légendaire miniature.png', 'hilam':'Hilam miniature.PNG', 'maebril':'Maebril miniature.png',
}
CLIPS = {
 'eberien': {'spell':('Eberien Spell cast.glb',None), 'victory':('Eberien Victory.glb',None), 'walk':('Eberien chibi.glb','Walking')},
 'kala': {'spell':('Kala attaque.glb','Axe_Spin_Attack'), 'victory':('kala victoire.glb','Joyful_Dance_with_Hand_Sway'), 'walk':('Kala attaque.glb','Walking')},
 'grimgors': {'spell':('Grimgors attaque.glb',None), 'victory':('Grimgors victoire.glb',None), 'walk':('Grimgors marche.glb',None)},
 'jhimm': {'spell':('Jhimm attaque.glb',None), 'victory':('Jhimm victoire.glb',None), 'walk':('Jhimm marche.glb',None)},
 'bolduc': {'spell':('Bolduc attaque.glb',None), 'victory':('Bolduc victoire.glb',None), 'walk':('Bolduc marche.glb',None)},
 'gardienne': {'spell':('Gardienne du lac attaque.glb',None), 'victory':('Gardienne du lac victoire.glb',None), 'walk':('gardienne du lac marche.glb',None)},
}
# Personnages qui remplacent des dés existants (une animation complète par fichier : idle, attaque, marche, victoire).
for key,prefix,idle in [
 ('caleizis','Caleizis divine',None), ('pachie','La fée pachié divine','La fée Pachié divine idle.glb'),
 ('gliska','Gliska légendaire',None), ('kayla-legendaire','Kayla légendaire',None),
 ('hilam','Hilam légendaire',None), ('eberien-legendaire','Eberien légendaire',None),
 ('bolduc-legendaire','Bolduc légendaire',None), ('bosco','Bosco légendaire',None),
 ('bulbalina','Bulbalina peu commune',None), ('frolgor','Frolgor peu commun',None),
 ('maebril','Maebril',None), ('orven','Orven',None)]:
 CLIPS[key]={'spell':(f'{prefix} attaque.glb',None), 'victory':(f'{prefix} victoire.glb',None), 'walk':(f'{prefix} marche.glb',None)}
def animation_only(source, name, destination):
 data=source.read_bytes(); length=struct.unpack_from('<I',data,12)[0]
 doc=json.loads(data[20:20+length]); binary=data[28+length:]
 selected=next((a for a in doc['animations'] if name is None or a['name']==name),None)
 if selected is None: raise ValueError(f'Missing clip {name} in {source}')
 animation=copy.deepcopy(selected)
 indices=sorted({s[key] for s in animation['samplers'] for key in ('input','output')})
 accessors=[copy.deepcopy(doc['accessors'][i]) for i in indices]
 views=sorted({a['bufferView'] for a in accessors}); buffer=bytearray(); newviews=[]
 for i in views:
  view=doc['bufferViews'][i]; start=view.get('byteOffset',0)
  buffer.extend(b'\0' * (-len(buffer)%4))
  newviews.append({'buffer':0,'byteOffset':len(buffer),'byteLength':view['byteLength']})
  buffer.extend(binary[start:start+view['byteLength']])
 for a in accessors: a['bufferView']=views.index(a['bufferView'])
 for sampler in animation['samplers']:
  for key in ('input','output'): sampler[key]=indices.index(sampler[key])
 nodes=[{k:v for k,v in n.items() if k in ('name','children','translation','rotation','scale','matrix')} for n in doc['nodes']]
 out={'asset':{'version':'2.0'},'scene':doc.get('scene',0),'scenes':doc['scenes'],'nodes':nodes,'animations':[animation],'accessors':accessors,'bufferViews':newviews,'buffers':[{'byteLength':len(buffer)}]}
 header=json.dumps(out,separators=(',',':')).encode();header+=b' ' * (-len(header)%4);buffer.extend(b'\0' * (-len(buffer)%4))
 destination.write_bytes(struct.pack('<III',0x46546c67,2,28+len(header)+len(buffer))+struct.pack('<II',len(header),0x4e4f534a)+header+struct.pack('<II',len(buffer),0x004e4942)+buffer)
OUTPUT.mkdir(exist_ok=True)
for key,filename in PORTRAITS.items():
 with Image.open(OUTPUT/'cutouts'/f'{key}.webp' if (OUTPUT/'cutouts'/f'{key}.webp').exists() else SOURCE/filename) as original:
  for size in (128,512):
   image=original.convert('RGBA');image.thumbnail((size,size),Image.Resampling.LANCZOS)
   image.save(OUTPUT/f'{key}-{size}.webp',quality=88,method=6)
for key,clips in CLIPS.items():
 for kind,(source,name) in clips.items(): animation_only(SOURCE/source,name,OUTPUT/f'{key}-{kind}.glb')
print(f'Built {2*len(PORTRAITS)} portraits and {sum(map(len,CLIPS.values()))} animation-only clips.')
