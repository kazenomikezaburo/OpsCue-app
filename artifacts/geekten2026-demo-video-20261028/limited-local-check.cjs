const fs=require('fs'),path=require('path'),http=require('http'),crypto=require('crypto'),{spawnSync}=require('child_process');
const BASE=__dirname,SITE='C:/Users/user/OpsCue-Geekten-Demo/site',OUT=path.join(SITE,'out');
const RUN=path.join(BASE,'local-preview-'+new Date().toISOString().replace(/[:.]/g,'-'));fs.mkdirSync(RUN);
for(const p of ['tmp','profile-check','profile-video','videos'])fs.mkdirSync(path.join(RUN,p));
process.env.TEMP=process.env.TMP=path.join(RUN,'tmp');process.env.PLAYWRIGHT_BROWSERS_PATH=path.join(BASE,'playwright-cache');process.env.PLAYWRIGHT_SKIP_BROWSER_GC='1';
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const report={run:RUN,staticOutput:OUT,requests:[],denied:[],errors:[],started:new Date().toISOString()};
function save(name,data){fs.writeFileSync(path.join(RUN,name),typeof data==='string'?data:JSON.stringify(data,null,2),{flag:'wx'});}
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?(e.isSymbolicLink()?[]:files(path.join(dir,e.name))):[path.join(dir,e.name)]);}
const preserved=files(SITE).filter(f=>!f.includes(path.sep+'node_modules'+path.sep)&&!f.includes(path.sep+'.git'+path.sep));
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');const before=Object.fromEntries(preserved.map(f=>[f,hash(f)]));save('preservation-before.json',before);
const allowed=new Map(files(OUT).map(f=>['/'+path.relative(OUT,f).split(path.sep).join('/'),f]));
function resolveURL(raw){const u=new URL(raw);if(u.origin!=='http://127.0.0.1:4317')return null;let p=decodeURIComponent(u.pathname);if(p.endsWith('/'))p+='index.html';else if(!path.posix.extname(p)&&allowed.has(p+'/index.html'))p+='/index.html';return allowed.get(p)||null;}
const hashes=new Set();for(const f of allowed.values())if(f.endsWith('.html'))for(const m of fs.readFileSync(f,'utf8').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))if(m[1])hashes.add("'sha256-"+crypto.createHash('sha256').update(m[1]).digest('base64')+"'");
const csp="default-src 'none'; script-src 'self' "+[...hashes].join(' ')+"; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; font-src 'self'; worker-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.txt':'text/plain','.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2','.ico':'image/x-icon','.png':'image/png'};
let server,ctx;let fatal=null;
function deny(x){report.denied.push(x);fatal=new Error('Unapproved activity: '+JSON.stringify(x));}
function check(){if(fatal)throw fatal;}
async function launch(profile,video){
 const context=await chromium.launchPersistentContext(path.join(RUN,profile),{executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,viewport:{width:1280,height:720},deviceScaleFactor:1,serviceWorkers:'block',acceptDownloads:false,permissions:[],...(video?{recordVideo:{dir:path.join(RUN,'videos'),size:{width:1280,height:720}}}:{}),args:['--disable-background-networking','--disable-component-update','--disable-domain-reliability','--disable-sync','--disable-breakpad','--disable-crash-reporter','--no-first-run','--no-default-browser-check','--disable-features=MediaRouter,OptimizationHints','--proxy-server=http=127.0.0.1:9;https=127.0.0.1:9','--proxy-bypass-list=127.0.0.1']});
 await context.route('**/*',async route=>{const req=route.request(),entry={url:req.url(),method:req.method(),type:req.resourceType()};const ok=req.method()==='GET'&&resolveURL(req.url())&&!['websocket','eventsource'].includes(req.resourceType());report.requests.push({...entry,allowed:!!ok});if(!ok){deny(entry);await route.abort();}else await route.continue();});
 context.on('serviceworker',w=>deny({serviceworker:w.url()}));
 await context.addInitScript(()=>{const reject=name=>{console.error('OPSCUE_FORBIDDEN:'+name);throw Error('Forbidden '+name);};if(navigator.serviceWorker)Object.defineProperty(navigator.serviceWorker,'register',{value:()=>reject('serviceWorker.register')});if(globalThis.Notification){Object.defineProperty(Notification,'requestPermission',{value:()=>reject('Notification.requestPermission')});}globalThis.WebSocket=class{constructor(){reject('WebSocket')}};globalThis.EventSource=class{constructor(){reject('EventSource')}};});
 for(const p of context.pages())p.on('console',m=>{if(m.text().includes('OPSCUE_FORBIDDEN:'))deny({console:m.text()});});return context;
}
(async()=>{
 try{
 server=http.createServer((req,res)=>{const f=resolveURL('http://127.0.0.1:4317'+req.url);if(req.method!=='GET'||!f){deny({serverPath:req.url,method:req.method});res.writeHead(403);res.end();return;}res.writeHead(200,{'Content-Type':mime[path.extname(f)]||'application/octet-stream','Content-Security-Policy':csp,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});fs.createReadStream(f).pipe(res);});
 await new Promise((r,j)=>{server.once('error',j);server.listen(4317,'127.0.0.1',r);});report.listen=server.address();console.log('LISTEN '+JSON.stringify(report.listen));
 ctx=await launch('profile-check',false);let page=ctx.pages()[0];page.on('pageerror',e=>report.errors.push(String(e)));await page.goto('http://127.0.0.1:4317/worker/',{waitUntil:'networkidle'});check();
 report.home=await page.locator('body').innerText();save('worker-home.txt',report.home);console.log('HOME\n'+report.home);
 const link=page.getByRole('link',{name:'勤務詳細を見る',exact:true});report.detailHref=await link.getAttribute('href');await link.click();await page.waitForLoadState('networkidle');check();report.detailURL=page.url();report.detail=await page.locator('body').innerText();save('assignment-detail.txt',report.detail);console.log('DETAIL\n'+report.detail);
 await page.evaluate(()=>window.scrollBy(0,500));check();await ctx.close();ctx=null;
 ctx=await launch('profile-video',true);page=ctx.pages()[0];await page.goto(report.detailURL,{waitUntil:'networkidle'});check();await page.waitForTimeout(2200);check();const video=page.video();await ctx.close();ctx=null;report.videoPath=await video.path();
 const ff=path.join(BASE,'playwright-cache/ffmpeg-1011/ffmpeg-win64.exe');const decoded=spawnSync(ff,['-hide_banner','-i',report.videoPath,'-f','null','-'],{encoding:'utf8',env:process.env,windowsHide:true});save('ffmpeg-decode.log',decoded.stdout+'\n'+decoded.stderr);report.decodeExit=decoded.status;report.videoBytes=fs.statSync(report.videoPath).size;report.ffmpegOutput=decoded.stderr;report.status=decoded.status===0?'PASS':'DECODE_FAILED';
 }catch(e){report.status='BLOCKED';report.failure=String(e.stack||e);console.log(report.failure);}
 finally{if(ctx)await ctx.close().catch(e=>report.errors.push(String(e)));if(server?.listening)await new Promise(r=>server.close(r));report.stopped=true;report.preservationChanged=Object.entries(before).filter(([f,h])=>!fs.existsSync(f)||hash(f)!==h).map(([f])=>f);report.newSiteFiles=files(SITE).filter(f=>!f.includes(path.sep+'node_modules'+path.sep)&&!before[f]);save('result.json',report);console.log('RESULT '+path.join(RUN,'result.json'));console.log(JSON.stringify({status:report.status,changed:report.preservationChanged,newFiles:report.newSiteFiles,denied:report.denied,video:report.videoPath}));}
})();