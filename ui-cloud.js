export function CloudUI({panels,network,getSim,slots,btn,esc,open,toast,replaceState}){
 let remote={},account=null,busy=false;
 const prev=panels.settings;panels.settings=()=>{const p=prev();p[2]+=btn('الحساب والحفظ عبر الأجهزة','cloudOpen');return p};
 panels.cloud=()=>['الخادم والحساب','الحفظ عبر الأجهزة','<p>يعمل على نفس خادم اللعبة. يلزم نشر الخادم بـ HTTPS للاتصال من أجهزة مختلفة. احتفظ بتصدير محلي قبل الاسترجاع.</p><label>اسم الحساب (إنجليزي)</label><input id="cloud-account" autocomplete="username"><label>كلمة المرور (١٢ حرفًا على الأقل)</label><input id="cloud-password" type="password" autocomplete="current-password">'+btn('ربط الوكالة الحالية بحساب','cloudCreate')+btn('دخول حساب موجود','cloudLogin')+'<p>الحساب المتصل: '+esc(account||'غير مرتبط')+'</p>'+btn('تحديث الحفظ الموجود','cloudRefresh')+[1,2,3].map(n=>'<div class="card">خانة '+n+' · '+(remote[n]?'نسخة '+remote[n].revision+' — '+esc(new Date(remote[n].updatedAt).toLocaleString('ar-EG')):'فارغة')+btn('رفع اللعب الحالي هنا','cloudUpload','data-slot="'+n+'"')+(remote[n]?btn('استرجاع إلى الخانة الحالية','cloudRestore','data-slot="'+n+'"'):'')+'</div>').join('')+'<p>الرفع والاسترجاع يدويان لتجنب فقد التقدم. قبل الاسترجاع تُحفظ نسخة احتياطية محلية قابلة للتنزيل.</p>'+btn('تنزيل نسخة ما قبل الاسترجاع','cloudBackup')+'<hr>'+btn('تفعيل تنبيهات الشحنات بعد الإغلاق','cloudPush')+btn('اختبار التنبيه','cloudPushTest')+btn('إلغاء تنبيهات هذا الحساب','cloudUnpush')];
 const refresh=async()=>{const d=await network.api('cloud');remote=d.slots;account=d.account};
 async function act(a,d){if(busy)return;busy=true;network.busy=true;try{
  const fields={account:document.getElementById('cloud-account')?.value||'',password:document.getElementById('cloud-password')?.value||''};
  if(a==='cloudCreate'){if(!network.session)await network.register();await network.api('account',{account:fields.account,password:fields.password});await refresh()}
  if(a==='cloudLogin'){const r=await network.api('login',{account:fields.account,password:fields.password});network.storage.setItem(network.key,JSON.stringify(r));await refresh();await network.refresh()}
  if(a==='cloudRefresh')await refresh();
  if(a==='cloudUpload'){await network.api('cloud',{slot:d.slot,revision:remote[d.slot]?.revision||0,state:getSim().s});await refresh();toast('اتحفظت نسخة على الخادم.')}
  if(a==='cloudRestore'){if(getSim().s.networkOutbox)throw Error('كمّل الشحنة المحجوزة قبل الاسترجاع.');const latest=await network.api('cloud');const item=latest.slots[d.slot];if(!item)throw Error('الخانة فارغة.');network.storage.setItem('saeed_before_cloud_restore',JSON.stringify(getSim().s));replaceState(item.state);remote=latest.slots;toast('تم الاسترجاع؛ النسخة السابقة محفوظة محليًا.')}
  if(a==='cloudBackup'){const data=network.storage.getItem('saeed_before_cloud_restore');if(!data)throw Error('لا توجد نسخة احتياطية بعد.');const u=URL.createObjectURL(new Blob([data],{type:'application/json'})),link=document.createElement('a');link.href=u;link.download='saeed-before-restore.json';link.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
  if(a==='cloudPush'){
   if(!('serviceWorker'in navigator)||!('PushManager'in window))throw Error('المتصفح لا يدعم التنبيهات هنا. استخدم HTTPS أو localhost.');
   const config=await network.api('push');if(!config.enabled)throw Error('مفاتيح التنبيه غير مفعلة على الخادم؛ راجع دليل النشر.');
   if(await Notification.requestPermission()!=='granted')throw Error('لم تمنح إذن التنبيهات.');
   const reg=await navigator.serviceWorker.ready;let sub=await reg.pushManager.getSubscription();if(!sub){const raw=atob(config.publicKey.replace(/-/g,'+').replace(/_/g,'/'));sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:Uint8Array.from(raw,c=>c.charCodeAt(0))})}await network.api('push',{subscription:sub.toJSON()});toast('تم تفعيل تنبيهات الشحنات.')
  }
  if(a==='cloudUnpush'){await network.api('push',{unsubscribe:true});toast('تم إلغاء اشتراكات تنبيه الحساب.')}
  if(a==='cloudPushTest')await network.api('push-test',{});
  open('cloud');
 }catch(e){toast(e.message,'bad')}finally{busy=false;network.busy=false}}
 return {handle(b){const a=b.dataset.action;if(a==='cloudOpen'){open('cloud');return true}if(!a.startsWith('cloud'))return false;act(a,b.dataset);return true}};
}
