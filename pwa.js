let installPrompt;
export async function registerPWA(){if(location.protocol==='http:'||location.protocol==='https:')if('serviceWorker'in navigator)try{await navigator.serviceWorker.register('./service-worker.js')}catch(e){console.warn('Offline cache unavailable',e.message)}window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e});}
export async function installPWA(){if(installPrompt){await installPrompt.prompt();installPrompt=null;return true}return false}
export async function requestNotifications(){return 'Notification'in window?await Notification.requestPermission():'unsupported'}
export function notifyLocal(title,body){if('Notification'in window&&Notification.permission==='granted'&&document.hidden)navigator.serviceWorker?.ready.then(r=>r.showNotification(title,{body,icon:'./assets/icon.svg',tag:'saeed-status'}));}
