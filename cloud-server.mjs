import {scrypt as rawScrypt,randomBytes,timingSafeEqual,createHash} from 'node:crypto';
import {promisify} from 'node:util';
import {Simulation} from './economy.js';
const scrypt=promisify(rawScrypt),hash=s=>createHash('sha256').update(s).digest('hex');
export function cloudService({db,persist,publicPlayer,notify=async()=>{},pushKey=null}){
 const attempts=new Map();
 return async function(route,method,data,player,send,ip){
  if(route==='/api/login'&&method==='POST'){
   const now=Date.now(),a=attempts.get(ip)||{count:0,until:now+60000};if(a.until<now){a.count=0;a.until=now+60000}attempts.set(ip,a);if(++a.count>10){send(429,{error:'محاولات كثيرة؛ استنى دقيقة.'});return true}if(attempts.size>5000)for(const [k,v]of attempts)if(v.until<now)attempts.delete(k);
   const p=db.players.find(p=>p.account===String(data.account).toLowerCase());
   const candidate=await scrypt(String(data.password||'').slice(0,128),p?.salt||'invalid',64);
   if(!p?.password||!timingSafeEqual(candidate,Buffer.from(p.password,'hex'))){send(401,{error:'اسم الحساب أو كلمة المرور غير صحيحة.'});return true}
   const token=randomBytes(48).toString('base64url');p.token=hash(token);await persist();send(200,{player:publicPlayer(p),token});return true;
  }
  if(!player)return false;
  if(route==='/api/account'&&method==='POST'){
   const name=String(data.account||'').toLowerCase(),password=String(data.password||'');
   if(player.account)throw Error('الحساب مرتبط بالفعل.');
   if(!/^[a-z0-9_]{4,32}$/.test(name)||password.length<12||password.length>128)throw Error('اسم إنجليزي ٤–٣٢ حرفًا أو رقمًا، وكلمة مرور ١٢ حرفًا على الأقل.');
   if(db.players.some(p=>p.account===name))throw Error('اسم الحساب مستخدم.');
   player.salt=randomBytes(16).toString('hex');player.password=(await scrypt(password,player.salt,64)).toString('hex');player.account=name;await persist();send(200,{account:name});return true;
  }
  if(route==='/api/cloud'&&method==='GET'){send(200,{slots:player.saves||{},account:player.account||null});return true}
  if(route==='/api/cloud'&&method==='POST'){
   if(!player.account)throw Error('اربط الوكالة بحساب أولًا.');
   if(!['1','2','3'].includes(String(data.slot)))throw Error('خانة غير صالحة.');
   const state=Simulation.validate(data.state);player.saves??={};const old=player.saves[data.slot];
   if(data.revision!==(old?.revision||0)){send(409,{error:'فيه حفظ أحدث على الخادم. حدّث القائمة قبل الرفع.',revision:old?.revision||0});return true}
   const item={revision:(old?.revision||0)+1,updatedAt:Date.now(),state};player.saves[data.slot]=item;await persist();send(200,{revision:item.revision});return true;
  }
  if(route==='/api/push'&&method==='GET'){send(200,{publicKey:pushKey,enabled:!!pushKey});return true}
  if(route==='/api/push'&&method==='POST'){
   if(!pushKey)throw Error('مالك الخادم لم يفعّل مفاتيح التنبيهات بعد.');
   if(data.unsubscribe){player.subscriptions=[];await persist();send(200,{ok:true});return true}
   const sub=data.subscription;let u;try{u=new URL(sub.endpoint)}catch{throw Error('اشتراك غير صالح.')}
   const allowed=['fcm.googleapis.com','updates.push.services.mozilla.com','web.push.apple.com'];
   if(u.protocol!=='https:'||u.port||u.username||u.password||!allowed.some(h=>u.hostname===h||u.hostname.endsWith('.'+h))||!/^[-_a-zA-Z0-9]{80,100}$/.test(sub.keys?.p256dh||'')||!/^[-_a-zA-Z0-9]{20,30}$/.test(sub.keys?.auth||''))throw Error('عنوان أو مفاتيح خدمة التنبيه غير مدعومة.');
   player.subscriptions=[...(player.subscriptions||[]).filter(x=>x.endpoint!==sub.endpoint),{endpoint:sub.endpoint,keys:sub.keys}].slice(-5);await persist();send(200,{ok:true});return true;
  }
  if(route==='/api/push-test'&&method==='POST'){if(!pushKey||!player.subscriptions?.length)throw Error('فعّل اشتراك التنبيهات أولًا.');await notify(player,{title:'وكالة سعيد',body:'تنبيهات الشحنات متصلة بالخادم.'});send(200,{ok:true});return true}
  return false;
 };
}
