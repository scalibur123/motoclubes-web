# WEB-IT-1 (142.ª): después de generar-idiomas.py, enseña los textos de fr/pt/it que ni son traducción ni son iguales al castellano
# (lo que se ha quedado a medias). Uso: python3 comprobar-idiomas.py
import re,io,html
src=io.open('generar-idiomas.py',encoding='utf8').read()
ns={}; exec(src[:src.index('def generar(')],ns)
def nodos(s):
    t=re.sub(r'<script.*?</script>|<style.*?</style>|<svg.*?</svg>','',s,flags=re.S)
    out=[html.unescape(' '.join(x.split())) for x in re.split(r'<[^>]+>',t)]
    out+= [html.unescape(a) for a in re.findall(r'(?:content|aria-label|placeholder|data-ok|data-err|alt|title)="([^"]+)"',s)]
    return [x for x in out if x and re.search('[A-Za-zÀ-ÿ]{3}',x)]
es=set(nodos(io.open('index.html',encoding='utf8').read()))
for cod,n in [('fr','FR'),('pt','PT'),('it','IT')]:
    d=ns[n]; vals=[html.unescape(re.sub(r'<[^>]+>',' ',v)) for v in d.values()]
    vals=[' '.join(v.split()) for v in vals]
    big='\n'.join(vals)
    s=io.open(f'{cod}/index.html',encoding='utf8').read()
    raros=[]
    for x in nodos(s):
        if x in es and x not in big:  # idéntico al castellano y no es traducción
            raros.append('IGUAL: '+x)
        elif x not in big and x not in es:
            raros.append('MEZCLA?: '+x)
    print('==',cod); 
    for r in sorted(set(raros)): print('  ',r[:150])
