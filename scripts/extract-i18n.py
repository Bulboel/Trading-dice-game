#!/usr/bin/env python3
"""Extrait les textes français affichables (littéraux JS, HTML) vers un fichier numéroté pour traduction.
Usage : python3 scripts/extract-i18n.py > fr-strings.txt"""
import re,glob,sys,json
FILES=['index.html']+sorted(f for f in glob.glob('assets/*.js') if 'vendor' not in f and not f.endswith(('i18n-en-v316.js','i18n-v316.js')))
STOP=re.compile(r"\b(le|la|les|des|une|un|du|de|vous|votre|vos|pour|avec|dans|sur|est|pas|que|qui|au|aux|et|ou|en|ce|cette|ces|se|ne|par|plus|tout|chaque|il|elle|ils|on|nous|mon|ma|mes|ton|ta|son|sa|ses|leur|leurs|si|mais|donc|où|y|sans|sous|entre|après|avant|tour|dé|dés)\b",re.I)
ACC=re.compile(r"[àâçéèêëîïôûùüœÀÂÇÉÈÊËÎÏÔÛÙÜŒ]")
CAP=re.compile(r"^[A-ZÀ-Ý][a-zà-ÿ’' -]{2,40}$")
LIT=re.compile(r"'((?:[^'\\\n]|\\.)*)'|\"((?:[^\"\\\n]|\\.)*)\"|`((?:[^`\\]|\\.)*)`",re.S)
def unesc(t):
    return t.replace("\\'","'").replace('\\"','"').replace('\\n',' ').replace('\\u00a0',' ').replace('\\\\','\\')
def strip_expr(t):
    out=[];i=0;n=0
    while i<len(t):
        if t.startswith('${',i):
            d=1;j=i+2
            while j<len(t) and d:
                d+= (t[j]=='{')-(t[j]=='}');j+=1
            out.append('{%d}'%n);n+=1;i=j
        else:
            out.append(t[i]);i+=1
    return ''.join(out)
def pieces(t):
    t=strip_expr(unesc(t))
    ps=re.split(r"<[^>]*>",t) if '<' in t else [t]
    res=[]
    for p in ps:
        p=re.sub(r"&nbsp;"," ",p);p=re.sub(r"&amp;","&",p);p=re.sub(r"&[a-z#0-9]+;","",p)
        q=re.sub(r"\s+"," ",p).strip()
        if len(q)<2: continue
        res.append(q)
    return res
def ok(q):
    if not re.search(r"[A-Za-zÀ-ÿ]{2}",q): return False
    if re.search(r"[{}();=<>\[\]]|=>|\.js|\.css|\.svg|\.png|\.webp|\.glb|https?:|^#|^\.|px\b|rgba?\(|var\(|^\w+\(",q) and not re.search(r"\{\d+\}",q.replace('{0}','')) and not ACC.search(q): return False
    body=re.sub(r"\{\d+\}","",q).strip()
    if not re.search(r"[A-Za-zÀ-ÿ]{2}",body): return False
    if ACC.search(q) or STOP.search(q): return True
    if CAP.match(q) and not re.search(r"[a-z][A-Z]",q): return True
    return False
def js_literals(src):
    """Petit analyseur JS : renvoie les littéraux de chaîne et de gabarit (les expressions ${} sont analysées récursivement)."""
    out=[];i=0;n=len(src)
    def tmpl(i):
        buf=[];
        while i<n:
            c=src[i]
            if c=='\\': buf.append(src[i:i+2]);i+=2;continue
            if c=='`': return ''.join(buf),i+1
            if c=='$' and src.startswith('${',i):
                d=1;j=i+2;k=j
                inner_start=j
                while j<n and d:
                    if src[j] in "'\"`":
                        q=src[j]
                        if q=='`':
                            _,j=tmpl(j+1);continue
                        j+=1
                        while j<n and src[j]!=q:
                            j+=2 if src[j]=='\\' else 1
                        j+=1;continue
                    d+=(src[j]=='{')-(src[j]=='}');j+=1
                expr=src[inner_start:j-1]
                for lit in js_literals(expr): out.append(lit)
                buf.append(src[i:j]);i=j;continue
            buf.append(c);i+=1
        return ''.join(buf),i
    while i<n:
        c=src[i]
        if c=='/' and i+1<n and src[i+1]=='/': 
            j=src.find('\n',i);i=n if j<0 else j;continue
        if c=='/' and i+1<n and src[i+1]=='*':
            j=src.find('*/',i+2);i=n if j<0 else j+2;continue
        if c in "'\"":
            j=i+1;buf=[]
            while j<n and src[j]!=c and src[j]!='\n':
                if src[j]=='\\': buf.append(src[j:j+2]);j+=2
                else: buf.append(src[j]);j+=1
            out.append(''.join(buf));i=j+1;continue
        if c=='`':
            t,i=tmpl(i+1);out.append(t);continue
        i+=1
    return out
seen={};order=[]
for f in FILES:
    s=open(f,encoding='utf8',errors='ignore').read()
    if f=='index.html':
        s2=re.sub(r"<script\b[^>]*>.*?</script>|<style\b[^>]*>.*?</style>","\n",s,flags=re.S)
        for m in re.finditer(r">([^<>]{2,})<|(?:title|aria-label|placeholder|alt|content)=\"([^\"]{2,})\"",s2):
            for q in pieces(m.group(1) or m.group(2)):
                if ok(q) and q not in seen: seen[q]=f;order.append(q)
    src=s if f!='index.html' else '\n'.join(re.findall(r"<script\b[^>]*>(.*?)</script>",s,flags=re.S))
    for t in js_literals(src):
        if len(t)<2 or len(t)>40000: continue
        for q in pieces(t):
            if ok(q) and q not in seen: seen[q]=f;order.append(q)
json.dump(order,sys.stdout,ensure_ascii=False,indent=0)
