#!/usr/bin/env python3
"""Assemble scripts/i18n/en-*.tsv (id<TAB>anglais) + scripts/i18n/fr.json en assets/i18n-en-v316.js."""
import json,glob,re
fr=json.load(open('scripts/i18n/fr.json'))
out={};bad=[]
for f in sorted(glob.glob('scripts/i18n/en-*.tsv')):
    for ln in open(f,encoding='utf8').read().split('\n'):
        if not ln.strip():continue
        i,_,t=ln.partition('\t')
        try:k=fr[int(i)]
        except Exception:bad.append(ln[:40]);continue
        if t.strip():out[k]=t
# traductions manuelles complémentaires (hors extraction)
extra=json.load(open('scripts/i18n/extra.json')) if glob.glob('scripts/i18n/extra.json') else {}
out.update(extra)
open('assets/i18n-en-v316.js','w',encoding='utf8').write('/* v316 — dictionnaire français → anglais (généré par scripts/build-i18n.py) */\nwindow.HACKENIA_EN='+json.dumps(out,ensure_ascii=False,separators=(',',':'))+';\n')
print(len(out),'entrées',len(bad),'ids invalides',bad[:5])
