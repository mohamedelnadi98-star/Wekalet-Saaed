from pathlib import Path
import hashlib,json
root=Path(__file__).resolve().parent.parent
files=sorted(p for p in root.rglob('*') if p.is_file() and p.suffix in ['.html','.js','.css','.json','.png','.svg'] and not any(part in ['tests','server-data'] for part in p.relative_to(root).parts) and p.name not in ['service-worker.js','Play-Offline.html','package.json'])
version=hashlib.sha256(b''.join(p.read_bytes() for p in files)).hexdigest()[:12]
assets=['./']+['./'+str(p.relative_to(root)) for p in files]
(root/'service-worker.js').write_text("const CACHE='saeed-"+version+"',ASSETS="+json.dumps(assets)+""";
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('saeed-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.includes('/api/'))return;event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)))}return response}).catch(()=>caches.match(event.request).then(r=>r||(event.request.mode==='navigate'?caches.match('./index.html'):Response.error()))))});
self.addEventListener('push',event=>{let data={title:'وكالة سعيد',body:'تنبيه الوكالة'};try{data={...data,...event.data.json()}}catch{}event.waitUntil(self.registration.showNotification(String(data.title).slice(0,80),{body:String(data.body).slice(0,200),icon:'./assets/icon-192.png'}))});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(self.clients.matchAll({type:'window'}).then(list=>list.length?list[0].focus():self.clients.openWindow('./')))});
""")
print(f'Offline cache: {len(assets)} assets, version {version}')
