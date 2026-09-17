const VERSION=__VERSION__,ASSETS=__ASSETS__,HASHES=__HASHES__;
const PREFIX='saeed@'+self.registration.scope+':',CACHE=PREFIX+VERSION;
const scoped=path=>new URL(path,self.registration.scope).href;
const known=new Map(ASSETS.map(path=>[scoped(path),path]));
async function installRelease(){
 const cache=await caches.open(CACHE);
 // All release resources bypass the HTTP cache and are verified before activation.
 for(let offset=0;offset<ASSETS.length;offset+=6)await Promise.all(ASSETS.slice(offset,offset+6).map(async path=>{
  const url=scoped(path),requestURL=new URL(url);requestURL.searchParams.set('__saeed_build',VERSION);
  const response=await fetch(requestURL.href,{cache:'no-store',credentials:'same-origin'});
  if(!response.ok)throw Error('Incomplete release: '+path);
  const bytes=await response.clone().arrayBuffer(),digest=await crypto.subtle.digest('SHA-256',bytes),hash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
  if(hash!==HASHES[path])throw Error('Release hash mismatch: '+path);
  await cache.put(url,response);
 }));
 await self.skipWaiting();
}
self.addEventListener('install',event=>event.waitUntil(installRelease()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 await self.clients.claim();
 // Other games on the same github.io origin and all local saves are untouched.
 for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);
})()));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url),base=new URL(self.registration.scope);
 if(event.request.method!=='GET'||url.origin!==base.origin||!url.pathname.startsWith(base.pathname)||url.pathname.includes('/api/'))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE),canonical=new URL(url);canonical.search='';canonical.hash='';
  // Serve one immutable release, including JS imports: never mix old and new modules.
  if(known.has(canonical.href)){const hit=await cache.match(canonical.href);if(hit)return hit;}
  try{return await fetch(event.request,{cache:'no-store'})}catch(e){
   if(event.request.mode==='navigate'){const fallback=await cache.match(scoped('./index.html'));if(fallback)return fallback;}
   return Response.error();
  }
 })());
});
self.addEventListener('push',event=>{let data={title:'وكالة سعيد',body:'تنبيه الوكالة'};try{data={...data,...event.data.json()}}catch{}event.waitUntil(self.registration.showNotification(String(data.title).slice(0,80),{body:String(data.body).slice(0,200),icon:'./assets/icon-192.png'}))});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(self.clients.matchAll({type:'window'}).then(list=>{const client=list.find(c=>c.url.startsWith(self.registration.scope));return client?client.focus():self.clients.openWindow('./')}))});
