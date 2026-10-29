from pathlib import Path
import urllib.request, urllib.parse, hashlib, json
from html.parser import HTMLParser
ROOT=Path(__file__).parent
DEMO=Path('C:/Users/user/OpsCue-Geekten-Demo/site')
ORIGIN='https://ops-cue-geekten-demo.vercel.app'
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*a,**k): raise RuntimeError('Redirect refused')
opener=urllib.request.build_opener(NoRedirect)
class Links(HTMLParser):
    def __init__(self): super().__init__(); self.assets=set(); self.links=set()
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='script' and a.get('src'): self.assets.add(a['src'])
        if tag=='link' and a.get('href') and any(x in a.get('rel','').split() for x in ['stylesheet','preload','modulepreload','icon']):self.assets.add(a['href'])
        if tag=='a' and a.get('href'):self.links.add(a['href'])
def digest(b):return hashlib.sha256(b).hexdigest()
report={'origin':ORIGIN,'requests':[],'pages':{},'assets':[],'failures':[],'claim':'Static GET comparison only; no browser execution or recording.'}
seen={}
def get(urlpath):
    u=urllib.parse.urljoin(ORIGIN+'/',urlpath)
    parsed=urllib.parse.urlsplit(u)
    if parsed.scheme!='https' or parsed.netloc!='ops-cue-geekten-demo.vercel.app' or parsed.query:raise RuntimeError('Unapproved URL')
    if u in seen:return seen[u]
    req=urllib.request.Request(u,headers={'User-Agent':'OpsCue-ReadOnly-Static-Audit','Accept-Encoding':'identity'})
    with opener.open(req,timeout=25) as r:
        b=r.read(8*1024*1024+1)
        if len(b)>8*1024*1024:raise RuntimeError('Oversized static resource')
        if r.headers.get('Set-Cookie'):raise RuntimeError('Set-Cookie response requires review')
        entry={'path':parsed.path,'status':r.status,'bytes':len(b),'sha256':digest(b),'contentType':r.headers.get('Content-Type'),'csp':r.headers.get('Content-Security-Policy'),'matches':{}}
    relative=parsed.path.lstrip('/')+('index.html' if parsed.path.endswith('/') else '')
    for kind,folder in [('out',DEMO/'out'),('vercelStatic',DEMO/'.vercel/output/static')]:
        p=folder/relative
        entry['matches'][kind]=p.is_file() and digest(p.read_bytes())==digest(b)
    report['requests'].append(entry);seen[u]=(b,entry)
    return b,entry
try:
    for route in ['/admin/','/worker/','/worker/assignments/demo-assignment-reception-1/']:
        b,entry=get(route)
        if not any(entry['matches'].values()):raise RuntimeError('Published HTML differs from both local outputs: '+route)
        parser=Links();parser.feed(b.decode('utf-8'))
        report['pages'][route]={'links':sorted(parser.links),'assets':sorted(parser.assets)}
        for asset in sorted(parser.assets):
            ab,ae=get(asset)
            if not any(ae['matches'].values()):raise RuntimeError('Published asset differs from local output: '+ae['path'])
            if ae['path'] not in report['assets']:report['assets'].append(ae['path'])
    report['status']='PASS_STATIC_MATCH'
except Exception as e:
    report['status']='BLOCKED';report['failures'].append(str(e))
(ROOT/'public-static-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'status':report['status'],'requestCount':len(report['requests']),'pages':list(report['pages']),'failures':report['failures']},ensure_ascii=False))
