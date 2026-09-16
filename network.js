import {PRODUCTS} from './economy.js';
export class AgencyNetwork{
 constructor(getSim,slots,storage=localStorage,transport=fetch){Object.assign(this,{getSim,slots,storage,transport});this.players=[];this.inbox=[];}
 get key(){return 'saeed_network_'+this.slots.active}
 get session(){return JSON.parse(this.storage.getItem(this.key)||'null')}
 async api(path,data){const token=this.session?.token;const r=await this.transport('./api/'+path,{method:data?'POST':'GET',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(data?{body:JSON.stringify(data)}:{})});let body;try{body=await r.json()}catch{throw Error('خادم التبادل غير متاح. شغّل اللعبة باستخدام node server.mjs.')}if(!r.ok)throw Error(body.error||'تعذر الاتصال');return body}
 async register(){if(this.session)return this.refresh();const d=await this.api('register',{name:'وكالة '+this.getSim().s.name});this.storage.setItem(this.key,JSON.stringify(d));await this.refresh()}
 async refresh(){const [p,i]=await Promise.all([this.api('players'),this.api('inbox')]);this.players=p.players;this.inbox=i.shipments}
 save(){this.slots.save(this.getSim().s)}
 async send(to,pid,qty){
 const g=this.getSim(),s=g.s;qty=Number(qty);if(s.networkOutbox)return this.retry();
 if(!this.session||!this.players.some(p=>p.id===to)||to===this.session.player.id||!PRODUCTS[pid]||!Number.isInteger(qty)||qty<1||qty>60||g.qty(pid)<qty)throw Error('راجع الوكالة المستلمة والكمية المتاحة من ١ إلى ٦٠.');
 const before=structuredClone(s);let need=qty,cost=0,life=PRODUCTS[pid].life;for(const b of s.stock.filter(b=>b.pid===pid).sort((a,b)=>a.expires-b.expires)){const n=Math.min(need,b.qty);b.qty-=n;need-=n;cost+=n*b.unit;life=Math.min(life,b.expires-s.day);if(!need)break}if(life<1){g.s=before;throw Error('البضاعة انتهت صلاحيتها')}
 s.stock=s.stock.filter(b=>b.qty>0);s.networkOutbox={nonce:crypto.randomUUID(),to,pid,qty,life};s.expenses+=cost;g.log('شحنة تعاون لوكالة أخرى — تكلفة البضاعة',0);try{this.save()}catch(e){g.s=before;throw e}g.change();return this.retry();
 }
 async retry(){const s=this.getSim().s;if(!s.networkOutbox)return;await this.api('send',s.networkOutbox);const before=s.networkOutbox;s.networkOutbox=null;try{this.save()}catch(e){s.networkOutbox=before;throw e}this.getSim().change();await this.refresh()}
 async claim(id){
 const g=this.getSim(),s=g.s,item=this.inbox.find(v=>v.id===id);if(!item)throw Error('حدث صندوق الشحنات أولًا');
 s.networkReceived=s.networkReceived||[];if(s.networkReceived.includes(id)){await this.api('claim',{id});await this.refresh();return}
 const cid=PRODUCTS[item.pid]?.company;if(!cid||!g.enabled(item.pid)||g.companyUsage(cid)+item.qty>s.warehouses[cid].capacity||g.stockTotal+g.pendingStock+g.reservedStorage+item.qty>s.capacity)throw Error('استكمل التوكيل ومساحة المخزن أولًا');
 const before=structuredClone(s);s.stock.push({id:s.seq++,pid:item.pid,qty:item.qty,unit:0,expires:s.day+item.life});s.networkReceived.push(id);try{this.save()}catch(e){g.s=before;throw e}g.change();await this.api('claim',{id});await this.refresh();
 }
}
