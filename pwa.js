let installPrompt;
// Each controller represents a completely downloaded, verified release.
export async function registerPWA({canReload=()=>true,beforeReload=()=>true,onUpdate=()=>{}}={},env=globalThis){
 const {window,document,navigator,location}=env;
 window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e});
 if(!['http:','https:'].includes(location.protocol)||!navigator.serviceWorker)return;
 let registration,pending=false,reloading=false,checking=false,preparing=false,retry=null,lastCheck=0;
 const attemptReload=async()=>{if(!pending||reloading||preparing||document.hidden)return;preparing=true;try{if(!canReload()||await beforeReload()===false){if(!retry)retry=env.setTimeout(()=>{retry=null;attemptReload()},3000);return}reloading=true;onUpdate('اكتمل تنزيل التحديث وحفظ تقدمك؛ جاري فتح النسخة الجديدة…');location.reload();}catch{if(!retry)retry=env.setTimeout(()=>{retry=null;attemptReload()},3000)}finally{preparing=false}};
 navigator.serviceWorker.addEventListener('controllerchange',()=>{pending=true;attemptReload()});
 const check=async(force=false)=>{if(document.hidden||navigator.onLine===false||!registration||checking)return;if(!force&&Date.now()-lastCheck<15000)return;checking=true;lastCheck=Date.now();try{await registration.update()}catch{/* Offline or incomplete publication: keep the working release. */}finally{checking=false}};
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){attemptReload();check()}});
 window.addEventListener('online',()=>check(true));window.addEventListener('pageshow',()=>{attemptReload();check()});
 try{registration=await navigator.serviceWorker.register('./service-worker.js',{updateViaCache:'none'});await check(true);const interval=env.setInterval(()=>{attemptReload();check()},60000);return {check,attemptReload,dispose(){env.clearInterval(interval);if(retry)env.clearTimeout(retry)}}}catch(e){console.warn('Offline cache unavailable',e.message)}
}
export async function installPWA(){if(installPrompt){await installPrompt.prompt();installPrompt=null;return true}return false}
export async function requestNotifications(){return 'Notification'in window?await Notification.requestPermission():'unsupported'}
export function notifyLocal(title,body){if('Notification'in window&&Notification.permission==='granted'&&document.hidden)navigator.serviceWorker?.ready.then(r=>r.showNotification(title,{body,icon:'./assets/icon.svg',tag:'saeed-status'}));}
