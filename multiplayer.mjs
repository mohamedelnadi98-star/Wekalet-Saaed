// Cooperative, asynchronous exchange. Inventory remains client-side; not a ranked economy.
import {cloudService} from './cloud-server.mjs';
import {randomUUID,createHash} from 'node:crypto';
import {readFile,writeFile,rename,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {PRODUCTS} from './economy.js';
export async function createMultiplayer(directory,options={}){
 await mkdir(directory,{recursive:true});const file=path.join(directory,'world.json');
 let db;try{db=JSON.parse(await readFile(file,'utf8'))}catch(e){if(e.code!=='ENOENT')throw e;db={players:[],shipments:[]}}
 let queue=Promise.resolve();const hash=t=>createHash('sha256').update(t).digest('hex');
 const persist=async()=>{await writeFile(file+'.tmp',JSON.stringify(db),{mode:0o600});await rename(file+'.tmp',file)};
 const publicPlayer=p=>({id:p.id,name:p.name,x:p.x,y:p.y});
 const cloud=cloudService({db,persist,publicPlayer,...options});
 return async function handle(req,res,url){
 if(!url.pathname.startsWith('/api/'))return false;
 const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data))};
 if(req.headers.origin&&req.headers.origin!==('http://'+req.headers.host)&&req.headers.origin!==('https://'+req.headers.host)){send(403,{error:'مصدر طلب غير مسموح'});return true}
 let data={};try{if(req.method==='POST'){let bytes=0,body='';for await(const chunk of req){bytes+=chunk.length;if(bytes>1500000)throw Error('الطلب أكبر من المسموح');body+=chunk}data=JSON.parse(body||'{}')}}catch{send(400,{error:'طلب غير صالح'});return true}
 const operation=async()=>{const before=structuredClone(db);try{
 if(url.pathname==='/api/register'&&req.method==='POST'){if(db.players.length>=1000)throw Error('الخادم ممتلئ');const name=String(data.name||'').trim().slice(0,30);if(!name)throw Error('اسم الوكالة مطلوب');const token=randomUUID()+randomUUID(),p={id:randomUUID(),name,token:hash(token),x:90+(db.players.length%6)*130,y:380+Math.floor(db.players.length/6)%3*40};db.players.push(p);await persist();send(201,{player:publicPlayer(p),token});return}
 const token=String(req.headers.authorization||'').replace(/^Bearer /,'');const player=db.players.find(p=>p.token===hash(token));if(await cloud(url.pathname,req.method,data,player,send,req.socket.remoteAddress))return;
 if(!player){send(401,{error:'سجل وكالة على هذا الخادم أولًا'});return}
 if(url.pathname==='/api/players'&&req.method==='GET'){send(200,{players:db.players.map(publicPlayer)});return}
 if(url.pathname==='/api/inbox'&&req.method==='GET'){send(200,{shipments:db.shipments.filter(s=>s.to===player.id&&!s.claimed).map(s=>({...s,fromName:db.players.find(p=>p.id===s.from)?.name||'وكالة'}))});return}
 if(url.pathname==='/api/send'&&req.method==='POST'){
 if(typeof data.nonce!=='string'||!/^[-a-zA-Z0-9]{8,80}$/.test(data.nonce))throw Error('معرف إرسال غير صالح');
 const exists=db.shipments.find(s=>s.from===player.id&&s.nonce===data.nonce);if(exists){send(200,{shipment:exists});return}
 if(!db.players.some(p=>p.id===data.to)||data.to===player.id||!PRODUCTS[data.pid]||!Number.isInteger(data.qty)||data.qty<1||data.qty>60||!Number.isInteger(data.life)||data.life<1||data.life>PRODUCTS[data.pid].life)throw Error('بيانات شحنة غير صالحة');
 if(db.shipments.length>=10000)throw Error('أرشيف الخادم ممتلئ');
 const shipment={id:randomUUID(),nonce:data.nonce,from:player.id,to:data.to,pid:data.pid,qty:data.qty,life:data.life,claimed:false};db.shipments.push(shipment);await persist();send(201,{shipment});Promise.resolve(options.notify?.(db.players.find(p=>p.id===data.to),{title:'شحنة جديدة لوكالة سعيد',body:'وصلت شحنة تعاون من '+player.name})).catch(()=>{});return}
 if(url.pathname==='/api/claim'&&req.method==='POST'){const s=db.shipments.find(s=>s.id===data.id&&s.to===player.id);if(!s)throw Error('الشحنة غير موجودة');s.claimed=true;await persist();send(200,{ok:true});return}
 send(404,{error:'مسار غير موجود'});
 }catch(e){Object.keys(db).forEach(k=>delete db[k]);Object.assign(db,before);send(400,{error:e.message})}};
 queue=queue.then(operation,operation);await queue;return true;
 };
}
