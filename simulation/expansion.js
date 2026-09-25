import {CITY_CLIENTS,careFor} from '../city-catalog.js';
import {validRacks,rackApproach} from './layout.js';
// Additive systems. The selected vehicle retains the v4 trip/cargo fields.
export const LAYOUTS={
 classic:{name:'التوزيع الأصلي',racks:[{x:1,z:-6.6},{x:5,z:-6.6},{x:9,z:-6.6}],factor:1},
 compact:{name:'تجهيز قريب من التحميل',racks:[{x:1,z:-6.6},{x:5,z:-6.6},{x:9,z:-6.6}],factor:.82},
 cold:{name:'أولوية سلسلة التبريد',racks:[{x:1,z:-6.6},{x:5,z:-6.6},{x:9,z:-6.6}],factor:.9}
};
export function expansionDefaults(){return {
 expansion:1,dayLength:900,guideSeen:false,fleetTrips:[],vehicleLoads:{},routePriorities:{},collectionReceipts:[],
 customerCare:CITY_CLIENTS.map(careFor),
 repRoutes:[],repReports:[],companyRelations:{},supplierBills:[],supplierTerms:{},storyChoices:{},storyLog:[],
 warehousePlan:{layout:'classic',slots:{bakery:0,dairy:2,pantry:1,frozen:3},staging:0,secondGate:false,returnsZone:false},
 returnQuarantine:[],pickingJob:null,workerJob:null,branch:false,rivalAction:null
};}
export function installExpansion(Simulation,{PRODUCTS:P,COMPANIES:C,ROLES,MAP,MONEY}){
 ROLES.driver.max=5;
 const proto=Simulation.prototype;
 const wrap=(key,fn)=>{const old=proto[key];proto[key]=function(...args){return fn.call(this,old,...args)}};
 const total=b=>b.reduce((n,x)=>n+x.qty,0);
 proto.allTrips=function(){return [this.s.trip,...this.s.fleetTrips].filter(Boolean)};
 proto.hasWork=function(){return !!(this.allTrips().length||this.s.carry||this.s.cargo.length||Object.entries(this.s.vehicleLoads).some(([id,b])=>Number(id)!==this.s.selectedVehicle&&b.length)||this.s.pickingJob||this.s.workerJob||this.s.repRoutes.length)};
 proto.otherLoads=function(){return Object.entries(this.s.vehicleLoads).filter(([id])=>Number(id)!==this.s.selectedVehicle).flatMap(([,b])=>b)};
 const reserved=Object.getOwnPropertyDescriptor(proto,'reservedStorage').get;
 Object.defineProperty(proto,'reservedStorage',{get(){return reserved.call(this)+total(this.s.returnQuarantine)+total(this.otherLoads())+this.s.fleetTrips.reduce((n,t)=>n+total(t.cargo),0)}});
 wrap('companyUsage',function(old,cid){return old.call(this,cid)+[...this.s.returnQuarantine,...this.otherLoads(),...this.s.fleetTrips.flatMap(t=>t.cargo)].filter(b=>P[b.pid].company===cid).reduce((n,b)=>n+b.qty,0)});
 // Swaps preserve every vehicle's cargo and decision, without advancing the clock.
 proto.switchFleet=function(id){
 const s=this.s,v=s.vehicles.find(v=>v.id===Number(id));if(!v)return false;
 s.vehicleLoads[s.selectedVehicle]=s.cargo;
 if(s.trip){s.trip.event=s.tripEvent;s.trip.delay=s.tripDelay}
 const trips=this.allTrips();s.fleetTrips=trips.filter(t=>t.vehicleId!==v.id);s.trip=trips.find(t=>t.vehicleId===v.id)||null;
 s.cargo=s.vehicleLoads[v.id]||[];s.selectedVehicle=v.id;s.truckCondition=v.condition;s.tripEvent=s.trip?.event||null;s.tripDelay=s.trip?.delay||0;
 return true;
 };
 proto.chooseVehicle=function(id){if(this.s.carry||this.s.pickingJob)return this.fail('كمّل تجهيز وتحميل الكراتين اللي في إيدك قبل تبديل العربية.');if(!this.switchFleet(id))return false;this.change();return true};
 proto.withVehicle=function(id,fn){
 const selected=this.s.selectedVehicle,onChange=this.onChange;let changed=false;this.onChange=()=>{changed=true};
 this.switchFleet(id);try{return fn()}finally{this.switchFleet(selected);this.onChange=onChange;if(changed)this.onChange(this.s)}
 };
 wrap('moveTrip',function(old,dt){const ids=this.allTrips().map(t=>t.vehicleId);for(const id of ids)this.withVehicle(id,()=>old.call(this,dt))});
 wrap('dispatch',function(old,route){
 if(this.s.pickingJob)return this.fail('استنى العامل يكمّل تجهيز الحمولة قبل الخروج.');
 if(this.allTrips().length>=this.s.staff.driver)return this.fail('كل السائقين في رحلات؛ عيّن سائقًا إضافيًا أو انتظر الرجوع.');
 const extra=this.vehicle.kind==='chilled'?40:this.vehicle.kind==='frozen'?65:this.vehicle.kind==='jumbo'?100:0;
 if(this.s.money<extra+70)return this.fail('الخزنة لا تكفي للوقود وتشغيل التبريد.');
 const r=old.call(this,route);if(r){this.s.money-=extra;this.s.expenses+=extra;if(extra)this.log(this.vehicle.kind==='jumbo'?'تشغيل الجامبو':'تشغيل وحدة التبريد أثناء الرحلة',-extra);
 const used=this.s.fleetTrips.map(t=>t.driverIndex);this.s.trip.driverIndex=Array.from({length:this.s.staff.driver},(_,i)=>i).find(i=>!used.includes(i));this.s.vehicleLoads[this.s.selectedVehicle]=[];
 this.notice('العربية '+this.s.selectedVehicle+' خرجت؛ تقدر تختار عربية ثانية وتكمل التحميل.');this.change()}return r;
 });
 wrap('buildTrip',function(old,...args){const t=old.apply(this,args);const plan=this.s?.warehousePlan;
 if(plan)for(const l of t.legs)if(l.kind==='unload')l.duration*=plan.secondGate?.85:1;if(this.s?.branch)for(const l of t.legs)if(l.kind==='drive'&&l.client!==undefined&&this.s.clients[l.client].area==='الدقهلية')l.duration*=.8;
 t.total=t.remaining=t.legs.reduce((n,l)=>n+l.duration,0);return t});
 proto.prioritize=function(client){client=Number(client);if(!Number.isInteger(client)||client<0||client>=CITY_CLIENTS.length||this.s.trip)return false;const id=this.s.selectedVehicle,prev=this.s.routePriorities[id]||[];this.s.routePriorities[id]=[client,...prev.filter(i=>i!==client)];this.change();return true};
 // Receipts are append-only and bounded. Collection changes cash, not sales revenue.
 proto.collect=function(id,amount){
 const s=this.s,v=s.invoices.find(v=>v.id===Number(id)&&v.type==='sale'&&!v.settled);amount=MONEY(Number(amount));
 if(!v||!Number.isFinite(amount)||amount<=0)return this.fail('اكتب مبلغ تحصيل موجبًا.');
 if(v.amount!==v.expected)return this.fail('صحح الفاتورة قبل التحصيل.');
 if(s.day<v.due)return this.fail('ميعاد الاستحقاق يوم '+v.due);
 const remaining=MONEY(v.amount-(v.paid||0));if(amount>remaining)return this.fail('المبلغ أكبر من المتبقي على الفاتورة.');
 v.approved=true;v.paid=MONEY((v.paid||0)+amount);s.money=MONEY(s.money+amount);s.clients[v.client].outstanding=MONEY(Math.max(0,s.clients[v.client].outstanding-amount));
 s.collectionReceipts.unshift({id:s.seq++,invoice:v.id,client:v.client,amount,day:s.day});s.collectionReceipts=s.collectionReceipts.slice(0,300);
 if(v.repAssigned){const fee=MONEY(amount*.01);s.commissionDue=MONEY(s.commissionDue+fee);s.expenses=MONEY(s.expenses+fee)}
 if(v.paid>=v.amount){v.settled=true;s.delivered++;s.clients[v.client].served++;if(!s.served.includes(v.client))s.served.push(v.client);s.customerCare[v.client].loyalty=Math.min(100,s.customerCare[v.client].loyalty+2)}
 this.log('تحصيل '+s.clients[v.client].name+' — فاتورة '+v.id,amount);this.notice('اتحصّل '+amount+' ج؛ المتبقي '+MONEY(v.amount-v.paid)+' ج.');this.change();return true;
 };
 wrap('approve',function(old,id){const v=this.s.invoices.find(v=>v.id===Number(id));if(v?.type==='sale'&&!v.settled&&this.s.day>=v.due)return this.collect(id,MONEY(v.amount-(v.paid||0)));return old.call(this,id)});
 proto.setCredit=function(client,limit){const c=this.s.customerCare[Number(client)];limit=Number(limit);if(!c||!Number.isInteger(limit)||limit<0||limit>30000)return this.fail('حد الائتمان من صفر إلى ٣٠ ألف.');c.creditLimit=limit;this.s.clients[client].credit=limit;this.change();return true};
 proto.remind=function(client){const s=this.s,c=s.customerCare[client];if(!c||c.remindedDay===s.day)return false;c.remindedDay=s.day;const v=s.invoices.find(v=>v.client===Number(client)&&v.type==='sale'&&!v.settled&&v.due<=s.day);
 this.notice(v?'العميل وافق على دفعة ٥٠٪ من المتبقي. راجع دفتر التحصيل.':'العميل: مفيش استحقاق واجب النهارده.');if(v)return this.collect(v.id,MONEY((v.amount-(v.paid||0))*.5));this.change();return true};
 wrap('accept',function(old,id,discount=0,payment='cash'){
 const s=this.s,o=s.orders.find(o=>o.id===id);if(!o)return false;const care=s.customerCare[o.client];
 if(payment==='credit'){const reserved=this.allTrips().flatMap(t=>t.orders.filter(o=>!t.deliveredOrders.includes(o.id)&&!t.refusedOrders?.includes(o.id))).filter(v=>v.client===o.client&&v.payment==='credit').reduce((n,v)=>n+v.qty*v.price*(1-v.discount/100),0);
 const pending=s.orders.filter(v=>v.accepted&&v.payment==='credit'&&v.client===o.client).reduce((n,v)=>n+v.qty*v.price*(1-v.discount/100),0);
 if(s.clients[o.client].outstanding+reserved+pending+o.qty*o.price*(1-Number(discount)/100)>care.creditLimit)return this.fail('حد ائتمان العميل يشمل الفواتير والطلبات اللي في الطريق.')}
 const r=old.call(this,id,discount,payment);if(r&&!o.first){o.deadline=s.elapsed+(care.type==='chain'?300:care.type==='super'?420:480);this.change()}return r;
 });
 wrap('generateOrder',function(old,first=false){
 const seq=this.s.seq;old.call(this,first);const s=this.s,o=s.orders.find(o=>o.id>=seq);if(!o||first)return;
 if(s.customerCare[o.client].lostUntil>s.day){const available=s.clients.filter(c=>s.delivered>=(c.unlock||0)&&s.regions.includes(c.area)&&s.customerCare[c.id].lostUntil<=s.day);if(!available.length){s.orders=s.orders.filter(x=>x.id!==o.id);return}o.client=available[Math.floor(this.rng()*available.length)].id}
 const care=s.customerCare[o.client];o.qty=care.type==='chain'?40:care.type==='super'?20:10;o.profile=care.type;
 if(care.type==='chain')o.price=MONEY(o.price*.98);this.onChange(s);
 });
 wrap('deliverOrder',function(old,o,t){const prior=t.deliveredOrders.includes(o.id);old.call(this,o,t);if(!prior&&t.deliveredOrders.includes(o.id)){const care=this.s.customerCare[o.client],late=this.s.elapsed>o.deadline;care.late+=late?1:0;care.loyalty=Math.max(0,Math.min(100,care.loyalty+(late?care.type==='chain'?-12:-7:4)));const v=this.s.invoices.filter(v=>v.type==='sale').at(-1);if(v){v.paid=0;if(!o.first&&o.payment==='credit')v.due=this.s.day+(care.type==='chain'?5:3)}}});
wrap('resolveTrip',function(old,choice){const t=this.s.trip,e=this.s.tripEvent,client=t?.legs[t.legIndex]?.client;const r=old.call(this,choice);if(r&&e?.kind==='rejection'&&choice==='return'&&client!==undefined){const c=this.s.customerCare[client];c.shortages=(c.shortages||0)+1;c.loyalty=Math.max(0,c.loyalty-5);this.change()}return r});
 // Sales representatives have an actual itinerary and progress on the map.
 proto.assignRep=function(index,region,task){
 index=Number(index);if(index<0||index>=this.s.staff.rep||!this.s.regions.includes(region)||!['sales','collect','recover'].includes(task))return false;
 if(this.s.repRoutes.some(r=>r.index===index))return this.fail('المندوب في زيارة بالفعل.');
 const clients=this.s.clients.filter(c=>c.area===region&&this.s.delivered>=(c.unlock||0)).map(c=>c.id);this.s.repRoutes.push({index,region,task,clients,stop:0,elapsed:0,duration:18,from:{...MAP.depot},to:{...MAP.clients[clients[0]]},phase:'drive',visits:0});this.change();return true;
 };
 proto.tickReps=function(dt){const s=this.s;for(const r of [...s.repRoutes]){const member=s.team.filter(m=>m.role==='rep')[r.index];r.elapsed+=dt*(1+(member?.level||1)*.04);if(r.elapsed<r.duration)continue;r.elapsed=0;
 if(r.phase==='return'){s.repRoutes=s.repRoutes.filter(x=>x!==r);this.notice('المندوب '+(r.index+1)+' رجع من '+r.visits+' زيارات.');this.change();continue}
 if(r.phase==='drive'){r.phase='visit';r.duration=6;continue}
 const id=r.clients[r.stop],care=s.customerCare[id];let result='';
 if(r.task==='collect'){const v=s.invoices.find(v=>v.client===id&&v.type==='sale'&&!v.settled&&v.due<=s.day&&(!this.repCanCollect||this.repCanCollect(r.index,v.id)));if(v){const amount=MONEY((v.amount-(v.paid||0))*.5);(this.collectForRep?this.collectForRep(r.index,v.id,amount):this.collect(v.id,amount));result='تحصيل '+amount+' ج'}else result='لا توجد مستحقات حالية'}
 else if(r.task==='recover'){care.loyalty=Math.min(100,care.loyalty+12);care.lostUntil=0;result='استعادة التعامل وتحسين الولاء'}
 else if(care.lostUntil>s.day)result='رفض: العميل مع المنافس؛ يحتاج زيارة استعادة';
 else if(this.visitRepCustody?.(r.index,id))result='بيع من عهدة المندوب وتسجيل النقدي والآجل';
 else{const seq=s.seq;this.generateOrder();const o=s.orders.find(o=>o.id>=seq);if(o){for(const line of s.orders.filter(x=>x.id>=seq)){line.client=id;line.repAssigned=r.index+1;}if(this.territories&&!this.territories(P[o.pid].company).includes(s.clients[id].area)){s.orders=s.orders.filter(x=>x.id<seq);result='المنطقة تحتاج تصريح الشركة';}else result='طلب جديد '+o.qty+' كرتونة'}else result='لا يوجد طلب مناسب الآن'}
 s.repReports.unshift({day:s.day,index:r.index,client:id,result});s.repReports=s.repReports.slice(0,80);r.visits++;r.from={...MAP.clients[id]};r.stop++;
 if(r.stop>=r.clients.length){r.phase='return';r.to={...MAP.depot};r.duration=18}else{r.phase='drive';r.to={...MAP.clients[r.clients[r.stop]]};r.duration=18}this.change();
 }};
 // Warehouses keep their original collision-safe aisles; functional zones are configurable.
 proto.setWarehouse=function(layout){if(!LAYOUTS[layout]||this.s.pickingJob||this.s.workerJob)return this.fail('استنى انتهاء حركة العامل.');this.s.warehousePlan.layout=layout;this.change();return true};
 proto.moveStorage=function(cid,slot){slot=Number(slot);if(!C[cid]||!this.s.warehouses[cid].owned||!Number.isInteger(slot)||slot<0||slot>3||this.s.pickingJob||this.s.workerJob)return false;
 const slots=this.s.warehousePlan.slots,other=Object.keys(slots).find(k=>slots[k]===slot);if(other)slots[other]=slots[cid];slots[cid]=slot;this.change();return true};
 proto.buyFacility=function(kind){const s=this.s,w=s.warehousePlan,prices={staging:2500,secondGate:7000,returnsZone:2000,branch:22000};if(!(kind in prices))return false;
 if(kind==='staging'&&w.staging>=2||kind==='secondGate'&&w.secondGate||kind==='returnsZone'&&w.returnsZone||kind==='branch'&&s.branch)return false;
 if(kind==='branch'&&(s.delivered<40||s.rep<70||!s.regions.includes('الدقهلية')))return this.fail('الفرع يحتاج ٤٠ طلبية وسمعة ٧٠ وخط الدقهلية.');
 if(!this.spend(prices[kind],false,'تجهيز '+kind))return this.fail('الخزنة لا تكفي.');
 if(kind==='staging')w.staging++;else if(kind==='branch'){s.branch=true;this.story('branch','افتتحت أول فرع لوكالة سعيد في الدقهلية.')}else w[kind]=true;this.change();return true;
 };
 wrap('pack',function(old,id){if(this.otherLoads().some(b=>b.order===id))return this.fail('الطلب محجوز على عربية أخرى؛ اختارها أو فرغ حمولتها أولًا.');if(this.s.workerJob)return this.fail('العامل بينقل شحنة الاستلام للرف.');if(this.s.pickingJob)return this.fail('العامل بيجهّز الطلب الحالي.');
 if(!this.s.staff.worker)return old.call(this,id);
 const r=old.call(this,id);if(r){const b=this.s.carry;this.s.carry=null;const slot=this.s.warehousePlan.slots[P[b.pid].company],from=rackApproach(this.s,slot);
 const duration=Math.max(2,(6+Math.hypot(from.x-7.4,from.z+3.3))*LAYOUTS[this.s.warehousePlan.layout].factor/(1+this.s.warehousePlan.staging*.3));
 this.s.pickingJob={batch:b,vehicle:this.s.selectedVehicle,elapsed:0,duration,from,to:{x:1.4,z:5.3}};this.notice('العامل بدأ تجهيز الطلب؛ تقدر تتابعه داخل المخزن.');this.change()}return r;
 });
 const reserve2=Object.getOwnPropertyDescriptor(proto,'reservedStorage').get;
 Object.defineProperty(proto,'reservedStorage',{get(){return reserve2.call(this)+(this.s.pickingJob?.batch.qty||0)}});
 wrap('companyUsage',function(old,cid){return old.call(this,cid)+(this.s.pickingJob&&P[this.s.pickingJob.batch.pid].company===cid?this.s.pickingJob.batch.qty:0)});
 wrap('arrive',function(old){const before=new Set(this.s.stock);const result=old.call(this);if(this.s.warehousePlan.returnsZone){const returned=this.s.stock.filter(b=>!before.has(b));for(const b of returned){b.id=b.id||this.s.seq++;this.s.returnQuarantine.push(b)}this.s.stock=this.s.stock.filter(b=>before.has(b));if(returned.length){this.notice('المرتجع في منطقة الفحص؛ راجعه قبل إتاحته للبيع.');this.change()}}return result});
 proto.inspectReturn=function(id){const s=this.s,index=s.returnQuarantine.findIndex(b=>b.id===Number(id));if(index<0)return false;const b=s.returnQuarantine.splice(index,1)[0];if(b.expires<=s.day){s.expenses+=b.qty*b.unit;this.notice('الدفعة انتهت صلاحيتها واتسجلت تالفًا.','bad')}else{s.stock.push(b);this.notice('فحص الصلاحية اكتمل والدفعة متاحة للبيع.')}this.change();return true};
 const receiveNow=proto.receive;
 proto.receive=function(id){const s=this.s;if(!s.staff.worker)return receiveNow.call(this,id);if(s.workerJob||s.pickingJob)return false;const b=s.incoming.find(b=>b.id===Number(id)&&b.ready);if(!b)return false;const slot=s.warehousePlan.slots[P[b.pid].company],to=rackApproach(s,slot);
 s.workerJob={id:b.id,elapsed:0,duration:8,batch:{pid:b.pid,qty:b.qty,order:'receive'+b.id},vehicle:0,from:{x:9,z:4.3},to};this.notice('العامل بينقل الشحنة من البالتة لمنطقة الشركة.');this.change();return true};
 proto.story=function(key,text){if(this.s.storyLog.some(x=>x.key===key))return;this.s.storyLog.push({key,text,day:this.s.day});this.notice(text)};
 proto.storyDecision=function(key,choice){
 const s=this.s;if(s.storyChoices[key]||!['service','cash'].includes(choice))return false;
 if(key==='oldClient'&&s.delivered>=3){s.storyChoices[key]=choice;if(choice==='service'){if(!this.spend(300,true,'خدمة عميل عم سعيد')){delete s.storyChoices[key];return false}s.customerCare[0].loyalty=Math.min(100,s.customerCare[0].loyalty+20);s.rep=Math.min(100,s.rep+3);this.story(key,'رجعت ثقة عميل عم سعيد بعد خدمة خاصة.')}else{this.setCredit(0,0);this.story(key,'اخترت التعامل النقدي لحماية خزنة الوكالة.')}this.change();return true}
 return false;
 };
 // Company inspectors and negotiated terms are separate from the v4 target/rebate.
 proto.relation=function(cid){return this.s.companyRelations[cid]||(this.s.companyRelations[cid]={score:50,nextVisit:this.s.day+7,warningUntil:0,suspended:false,benefit:null})};
 proto.negotiate=function(cid,benefit){if(!this.s.contracts[cid]||!['credit','support','exclusive'].includes(benefit))return false;const r=this.relation(cid);if(r.score<70||this.s.cycles[cid].successes<1)return this.fail('التفاوض يحتاج تقييم شركة ٧٠ ودورة ناجحة.');if(r.benefit)return this.fail('يوجد اتفاق مزايا قائم لهذه الشركة.');r.benefit=benefit;this.notice(benefit==='credit'?'تم أجل توريد ٣ أيام. اختره من مشتريات الشركة.':benefit==='support'?'دعم عروض: ٢٥٠ ج كل دورة ناجحة.':'حصرية محلية: المنافس لا يسحب عملاء هذه الشركة.');this.change();return true};
 proto.requestTerms=function(cid,enabled){if(!C[cid]||this.relation(cid).benefit!=='credit')return false;this.s.supplierTerms[cid]=!!enabled;this.change();return true};
 
 wrap('buy',function(old,pid,qty){const cid=P[pid]?.company;if(!cid)return old.call(this,pid,qty);if(this.s.companyRelations[cid]?.suspended)return this.fail('توريد الشركة متوقف لحين تصحيح الإنذار.');const terms=this.s.supplierTerms[cid]&&this.relation(cid).benefit==='credit';if(!terms)return old.call(this,pid,qty);
 const outstanding=this.s.supplierBills.filter(b=>b.cid===cid&&!b.settled).reduce((n,b)=>n+b.amount,0),amount=MONEY(this.cost(pid)*Number(qty));if(!Number.isFinite(amount)||amount<=0||outstanding+amount>10000)return this.fail('حد أجل المورد ١٠٬٠٠٠ ج لكل شركة.');
 const seq=this.s.seq;this.s.money+=amount;const onChange=this.onChange;this.onChange=()=>{};let r;try{r=old.call(this,pid,qty);if(!r)this.s.money-=amount;else{const incoming=this.s.incoming.find(b=>b.id>=seq);if(incoming)incoming.onCredit=true;const line=this.s.ledger.find(l=>l.id>=seq&&l.amount===-amount);if(line){line.amount=0;line.text='مسحوبات بأجل — '+C[cid].short}this.s.supplierBills.push({id:this.s.seq++,cid,amount,due:this.s.day+3,settled:false,purchase:incoming?.id})}}finally{this.onChange=onChange}this.change();return r;
 });
 proto.paySupplier=function(id){const b=this.s.supplierBills.find(b=>b.id===Number(id)&&!b.settled);if(!b||!this.spend(b.amount,false,'سداد أجل '+C[b.cid].short))return false;b.settled=true;this.change();return true};
 proto.correctCompany=function(cid){const r=this.s.companyRelations[cid];if(!r||!r.warningUntil||!this.requirements(cid).every(x=>x.met))return this.fail('استكمل التجهيزات المطلوبة أولًا.');if(this.s.supplierBills.some(b=>b.cid===cid&&!b.settled&&b.due<this.s.day))return this.fail('سدّد المديونية المتأخرة للشركة أولًا.');const cycle=this.s.cycles[cid];if(cycle.misses>=2&&this.s.purchases[cid]<cycle.target*.5)return this.fail('حقق نصف التارجت الحالي لإثبات تصحيح المسحوبات.');r.suspended=false;r.warningUntil=0;r.score=Math.max(55,r.score);this.notice('الشركة قبلت خطة التصحيح واستمرار التوريد.');this.change();return true};
 proto.counterRival=function(kind){const s=this.s,a=s.rivalAction;if(!a||a.resolved||!['service','offer','schedule'].includes(kind))return false;const cost=kind==='service'?350:kind==='offer'?250:100;if(!this.spend(cost,true,'مواجهة المنافس'))return false;
 const care=s.customerCare[a.client];care.loyalty=Math.min(100,care.loyalty+(kind==='service'?15:8));care.lostUntil=0;if(kind==='schedule')care.visitHour=(care.visitHour+2)%24;a.resolved=true;this.notice('تم الاحتفاظ بالعميل؛ راقب الخدمة وميعاد الزيارة.');this.change();return true};
 wrap('nextDay',function(old){if(this.s.bankrupt)return;old.call(this);const s=this.s;
 for(const [cid]of Object.entries(C))if(s.contracts[cid]){const r=this.relation(cid);if(s.day>=r.nextVisit){const okay=this.requirements(cid).every(x=>x.met)&&s.cycles[cid].misses<2&&!s.supplierBills.some(b=>b.cid===cid&&!b.settled&&b.due<s.day);r.score=Math.max(0,Math.min(100,r.score+(okay?10:-15)));r.nextVisit=s.day+7;if(!okay&&!r.warningUntil){r.warningUntil=s.day+3;this.notice('مسؤول '+C[cid].short+': مهلة ٣ أيام لتصحيح التجهيزات أو المسحوبات أو المديونية.','bad')}if(okay&&r.benefit==='support'&&s.cycleHistory.some(h=>h.cid===cid&&h.endDay===s.day&&h.achieved)){s.money+=250;s.expenses-=250;this.log('دعم عروض '+C[cid].short,250)}}if(r.warningUntil&&s.day>=r.warningUntil&&!r.suspended){r.suspended=true;this.notice('توريد '+C[cid].short+' متوقف لحين التصحيح؛ المخزون القديم محفوظ.','bad')}}
 if(s.rivalAction&&!s.rivalAction.resolved&&s.day>s.rivalAction.deadline){const care=s.customerCare[s.rivalAction.client];if(care.loyalty<60&&!Object.values(s.companyRelations).some(r=>r.benefit==='exclusive'&&!r.suspended)){care.lostUntil=s.day+3;this.notice('العميل انتقل مؤقتًا للمنافس: '+s.clients[s.rivalAction.client].name+' بسبب ضعف الولاء. زيارة استعادة ترجّعه.','bad')}s.rivalAction.resolved=true}
 if(s.day%3===0&&s.delivered>=3){const ids=s.clients.filter(c=>s.delivered>=(c.unlock||0)&&s.regions.includes(c.area)&&!s.customerCare[c.id].lostUntil).map(c=>c.id);const client=ids.sort((a,b)=>s.customerCare[a].loyalty-s.customerCare[b].loyalty)[0];if(client!==undefined)s.rivalAction={client,kind:['price','route','service'][Math.floor(this.rng()*3)],deadline:s.day+1,resolved:false};}
 for(const c of s.customerCare)if(c.lostUntil&&c.lostUntil<=s.day)c.lostUntil=0;
 s.returnQuarantine=s.returnQuarantine.filter(b=>{if(b.expires>s.day)return true;s.expenses+=b.qty*b.unit;this.notice('دفعة مرتجع انتهت صلاحيتها واتسجلت تالفًا.','bad');return false});
 if(s.branch){s.money-=150;s.expenses+=150;this.log('تشغيل فرع الدقهلية',-150)}
 if(s.delivered>=3)this.story('oldClientAvailable','عميل قديم لعم سعيد طلب منك قرارًا: خدمة خاصة ولا التعامل نقدي؟');
 if(s.enterprise)this.story('enterprise','وقعت أول عقد توريد كبير. سمعة اسم سعيد على المحك.');
 if(s.regions.includes('الدقهلية'))this.story('delta','خط الدقهلية بقى جزءًا من شبكة وكالة سعيد.');
 this.change();
 });
 wrap('tick',function(old,dt){const elapsed=this.s.elapsed;old.call(this,dt);const advanced=this.s.elapsed-elapsed;if(advanced<=0)return;this.tickReps(advanced);
 const reception=this.s.workerJob;if(reception){reception.elapsed+=advanced;if(reception.elapsed>=reception.duration){this.s.workerJob=null;receiveNow.call(this,reception.id);this.change()}}
 const job=this.s.pickingJob;if(job){job.elapsed+=advanced;if(job.elapsed>=job.duration){this.s.carry=job.batch;this.s.pickingJob=null;this.notice('العامل جهّز الكراتين عند التحميل. حمّلها في العربية.');if(this.s.auto&&job.vehicle===this.s.selectedVehicle&&!this.s.trip){if(this.load())this.dispatch()}this.change()}}
 });
 // Validate every extra vehicle with the original validator; never trust hidden trips.
 const baseValidate=Simulation.validate;
 Simulation.validate=function(data){
 const d={...expansionDefaults(),...data};if(data?.version===4&&!data.expansion)d.time=Number(data.time)*3;const s=baseValidate(d),bad=()=>{throw Error('بيانات التوسع غير صالحة.')};
 const n=(x,min=0,max=1e12)=>Number.isFinite(x)&&x>=min&&x<=max;
 if(![900,1800].includes(s.dayLength)||typeof s.guideSeen!=='boolean')bad();
 if(!Array.isArray(s.returnQuarantine)||s.returnQuarantine.length>2000)bad();baseValidate({...s,stock:s.returnQuarantine});
 if(!Array.isArray(s.fleetTrips)||s.fleetTrips.length>4||!s.vehicleLoads||!s.routePriorities)bad();
 if(s.trip&&s.trip.vehicleId!==s.selectedVehicle)bad();
 if(s.fleetTrips.some(t=>!s.vehicles.some(v=>v.id===t.vehicleId)||t.vehicleId===s.selectedVehicle)||new Set(s.fleetTrips.map(t=>t.vehicleId)).size!==s.fleetTrips.length)bad();
 for(const t of s.fleetTrips)baseValidate({...s,trip:t,selectedVehicle:t.vehicleId,tripEvent:t.event||null,tripDelay:t.delay||0,cargo:s.vehicleLoads[t.vehicleId]||[]});
 for(const [id,cargo]of Object.entries(s.vehicleLoads)){if(!s.vehicles.some(v=>v.id===Number(id)))bad();baseValidate({...s,cargo});if(total(cargo)>s.vehicles.find(v=>v.id===Number(id)).capacity)bad()}
 for(const plan of Object.values(s.routePriorities))if(!Array.isArray(plan)||plan.length>CITY_CLIENTS.length||new Set(plan).size!==plan.length||plan.some(i=>!Number.isInteger(i)||i<0||i>=CITY_CLIENTS.length))bad();
 if(Array.isArray(s.customerCare)&&s.customerCare.length===6)s.customerCare.push(...CITY_CLIENTS.slice(6).map(careFor));if(!Array.isArray(s.customerCare)||s.customerCare.length!==CITY_CLIENTS.length)bad();s.customerCare.forEach((c,i)=>{c.shortages=c.shortages||0;if(!n(c.shortages)||!['grocery','super','chain','restaurant'].includes(c.type)||!n(c.loyalty,0,100)||!n(c.creditLimit,0,30000)||!n(c.late)||!n(c.lostUntil)||!n(c.remindedDay)||!n(c.visitHour,0,23))bad();s.clients[i].credit=c.creditLimit});
 if(!Array.isArray(s.collectionReceipts)||s.collectionReceipts.length>300||s.collectionReceipts.some(r=>!n(r.id,1)||!n(r.amount,.01)||!n(r.day,1)||!Number.isInteger(r.client)||r.client<0||r.client>=CITY_CLIENTS.length))bad();
 for(const v of s.invoices)if(v.paid!==undefined&&!n(v.paid,0,v.amount))bad();
 const w=s.warehousePlan;if(w?.customRacks&&!validRacks(w.customRacks,s.capacity))bad();if(!w||!LAYOUTS[w.layout]||!w.slots||Object.keys(w.slots).length!==4||Object.keys(C).some(cid=>!Number.isInteger(w.slots[cid])||!n(w.slots[cid],0,3))||new Set(Object.values(w.slots)).size!==4||!n(w.staging,0,2)||typeof w.secondGate!=='boolean'||typeof w.returnsZone!=='boolean'||typeof s.branch!=='boolean')bad();
 if(s.workerJob){const j=s.workerJob;if(!s.incoming.some(b=>b.id===j.id&&b.ready)||!n(j.elapsed)||!n(j.duration,1,100)||!j.batch||!P[j.batch.pid])bad();for(const p of [j.from,j.to])if(!p||!n(p.x,-60,14)||!n(p.z,-45,18))bad()}
 if(s.pickingJob){const j=s.pickingJob;if(!n(j.elapsed)||!n(j.duration,.1,100)||!s.vehicles.some(v=>v.id===j.vehicle)||s.carry)bad();baseValidate({...s,carry:j.batch});for(const p of [j.from,j.to])if(!p||!n(p.x,-60,14)||!n(p.z,-45,18))bad()}
 if(!Array.isArray(s.repRoutes)||s.repRoutes.length>3||new Set(s.repRoutes.map(r=>r.index)).size!==s.repRoutes.length)bad();
 for(const r of s.repRoutes){if(!Number.isInteger(r.index)||!n(r.index,0,s.staff.rep-1)||!['sales','collect','recover'].includes(r.task)||!['drive','visit','return'].includes(r.phase)||!n(r.elapsed)||!n(r.duration,1,100)||!Array.isArray(r.clients)||r.clients.length>CITY_CLIENTS.length||r.clients.some(i=>!Number.isInteger(i)||i<0||i>=CITY_CLIENTS.length)||!Number.isInteger(r.stop)||!n(r.stop,0,r.clients.length)||!n(r.visits))bad();for(const p of [r.from,r.to])if(!p||!n(p.x,0,MAP.width)||!n(p.y,0,MAP.height))bad()}
 if(!Array.isArray(s.repReports)||s.repReports.length>80||s.repReports.some(r=>typeof r.result!=='string'||r.result.length>200||!n(r.index,0,2)||!n(r.client,0,CITY_CLIENTS.length-1)||!n(r.day,1)))bad();
 if(!s.companyRelations||!s.supplierTerms||!Array.isArray(s.supplierBills)||s.supplierBills.length>2000)bad();
 for(const [cid,r]of Object.entries(s.companyRelations))if(!C[cid]||!n(r.score,0,100)||!n(r.nextVisit,1)||!n(r.warningUntil)||typeof r.suspended!=='boolean'||![null,'credit','support','exclusive'].includes(r.benefit))bad();
 if(s.supplierBills.some(b=>!C[b.cid]||!n(b.amount,.01,10000)||!n(b.id,1)||!n(b.due,1)||typeof b.settled!=='boolean'))bad();
 if(!s.storyChoices||!Array.isArray(s.storyLog)||s.storyLog.length>100||s.storyLog.some(x=>typeof x.key!=='string'||typeof x.text!=='string'||x.text.length>300||!n(x.day,1)))bad();
 if(s.rivalAction&&(!Number.isInteger(s.rivalAction.client)||!n(s.rivalAction.client,0,CITY_CLIENTS.length-1)||!['price','route','service'].includes(s.rivalAction.kind)||!n(s.rivalAction.deadline,1)||typeof s.rivalAction.resolved!=='boolean'))bad();
 return s;
 };
}
