import {CITY_CLIENTS} from '../city-catalog.js';
import {batchScenery} from './static-batch.js';
import {yardPosition} from './fleet-path.js';
import * as T from '../vendor/three.module.js';
import {MAP,routePosition,PRODUCTS} from '../economy.js';
import {neighborhoodLayout,cityPoint} from './neighborhood-layout.js';
export {cityPoint} from './neighborhood-layout.js';

export const city={
 buildCity(){
 this.cityGroup=new T.Group();this.scene.add(this.cityGroup);this.cityTrucks=new Map();this.roadMarks=new T.Group();this.scene.add(this.roadMarks);
 this.mat('asphalt',0x38464b,.98);this.mat('sidewalk',0xb1b2a4,.96);this.mat('terracotta',0xb87556,.92);this.mat('cream',0xe1d3b5,.87);this.mat('windowLit',0xadc5bb,.4,.1);this.mats.windowLit.emissive.set(0xffd596);this.mats.windowLit.emissiveIntensity=.25;
 this.box(245,.35,140,56,-.35,24,'concrete',this.cityGroup);
 // Continuous depot driveway, main avenues and client access roads.
 const road=(x,z,w,d)=>{this.box(w,.035,d,x,-.15,z,'asphalt',this.cityGroup);if(w>d){for(let a=x-w/2+1;a<x+w/2;a+=3)this.box(1.4,.014,.09,a,-.122,z,'paper',this.cityGroup)}else for(let a=z-d/2+1;a<z+d/2;a+=3)this.box(.09,.014,1.4,x,-.122,a,'paper',this.cityGroup)};
 this.neighborhood=neighborhoodLayout();this.shops=[];
 for(const r of this.neighborhood.streets){this.box(r.w+1.3,.12,r.d+1.3,r.x,-.17,r.z,'sidewalk',this.cityGroup);road(r.x,r.z,r.w,r.d)}
 for(const plot of this.neighborhood.plots){if(plot.client!==undefined){const g=this.buildShop(plot.x,plot.z,plot.client);g.rotation.y=plot.rotation+Math.PI;this.shops[plot.client]=g;}else if(!plot.facility){const b=this.buildApartment(plot.x,plot.z,plot.floors);const avenue=[-19,7.3,35].sort((a,b)=>Math.abs(a-plot.z)-Math.abs(b-plot.z))[0];b.rotation.y=avenue<plot.z?Math.PI:0}}
 for(const [x,z,name]of [[27,-14,'حي السوق'],[51,26,'حي النخيل'],[77,43,'حي التوسع'],[114,17,'حي المطاعم'],[112,65,'حي السلاسل'],[130,76,'حي الجامعة']]){this.cyl(.045,.065,2.7,x,1.2,z,'metal',this.cityGroup);this.label(name,3.1,.55,x,2.5,z,'#f0e5ce','#2c5c55',this.cityGroup)}
 // Loading bays are at the real route endpoints, not at invented map coordinates.
 for(const p of this.neighborhood.clients){for(const side of [-1,1])this.box(.045,.015,3,p.x+side*1.3,-.10,p.z,'paper',this.cityGroup);this.label('استلام',1.6,.6,p.x,-.08,p.z,'#eee1b6','#4c6461',this.cityGroup).rotation.x=-Math.PI/2}
 this.cityLights=[];for(const [x,z]of [[20,4],[20,17],[35,4],[50,4],[67,4],[83,4],[38,31],[61,31],[83,31],[100,4],[120,4],[142,4],[100,46],[124,46],[144,65]]){this.cyl(.055,.095,4,x,1.9,z,'metal',this.cityGroup);this.box(1.1,.08,.15,x+.45,3.88,z,'metal',this.cityGroup);this.box(.5,.06,.32,x+.8,3.84,z,'light',this.cityGroup);const l=new T.PointLight(0xffddb0,30,15,1.8);l.position.set(x+.8,3.7,z);l.userData.nightPower=30;this.scene.add(l);this.cityLights.push(l)}
 for(const [x,z]of [[-7,-2],[5,-3],[3,7]]){const l=new T.PointLight(0xffe5ba,65,24,1.5);l.position.set(x,4.1,z);l.userData.nightPower=65;this.scene.add(l);this.box(1.8,.08,.3,x,4.25,z,'light')}
 this.repActors=new Map();this.repActorGroup=new T.Group();this.scene.add(this.repActorGroup);this.cityTrucksGroup=new T.Group();this.scene.add(this.cityTrucksGroup);
 this.buildingSigns=[];this.cityGroup.traverse(o=>{if(o.userData.client!==undefined)this.buildingSigns.push(o)});this.cityBatchStats=batchScenery(this.cityGroup);
 },
 buildApartment(x,z,floors){
 const g=new T.Group();g.position.set(x,-.15,z);this.cityGroup.add(g);const h=floors*2.8;this.box(8,h,6,0,h/2,0,'cream',g);this.box(8.4,.25,6.4,0,h+.1,0,'edge',g);this.box(9,.18,7,0,.09,0,'sidewalk',g);
 for(let floor=0;floor<floors;floor++)for(const dx of [-2.5,0,2.5]){this.box(1.25,1.45,.06,dx,1.6+floor*2.8,3.04,'windowLit',g);this.box(1.65,.12,.65,dx,.85+floor*2.8,3.2,'edge',g);for(const ox of [-.6,0,.6])this.box(.04,.6,.04,dx+ox,1.15+floor*2.8,3.45,'metal',g);this.box(1.6,.045,.045,dx,1.46+floor*2.8,3.45,'metal',g)}
 this.box(1.3,2.2,.08,0,1.1,3.08,'wood',g);this.cyl(.8,.8,1.3,-2,h+.9,0,'dark',g);this.box(1,.7,.5,2,h+.5,1,'paper',g);return g;
 },
 buildShop(x,z,i){const g=new T.Group();g.position.set(x,-.15,z);g.userData.client=i;g.userData.action='customer:'+i;this.cityGroup.add(g);
 this.box(6,3.5,4,0,1.75,0,i%2?'cream':'terracotta',g);this.box(6.2,.18,4.2,0,3.6,0,'edge',g);this.box(2.2,2.6,.06,1.25,1.4,-2.04,'glass',g);const door=new T.Group();door.position.set(-2.1,0,-2.05);g.add(door);this.box(1.2,2.5,.09,.6,1.3,0,'dark',door);this.box(.05,.2,.08,1,1.3,-.1,'brass',door);g.userData.door=door;
 const sign=this.label(CITY_CLIENTS[i].name,5.5,.65,0,3.1,-2.12,'#fff0ce','#284a49',g);sign.rotation.y=Math.PI;
 for(let j=0;j<6;j++){this.box(.95,.1,1.3,-2.4+j*.96,2.6,-2.5,j%2?'paper':'teal',g);this.carton(-2.3+j*.8,.02,-2.6,.6,g)}
 this.box(6.2,.10,4.8,0,-.02,0,'sidewalk',g);if(CITY_CLIENTS[i].type==='restaurant'){for(const dx of [-1.5,1.5]){this.cyl(.45,.45,.08,dx,.8,-3.3,'wood',g);this.cyl(.055,.08,.8,dx,.4,-3.3,'metal',g);for(const side of [-1,1]){this.box(.38,.08,.4,dx+side*.65,.45,-3.3,'teal',g);this.box(.06,.43,.06,dx+side*.65,.21,-3.3,'metal',g)}}this.label('مطبخ · توريد منتظم',3.6,.35,0,3.9,-2.14,'#fff1d2','#815b3c',g).rotation.y=Math.PI;}else if(i>=9){this.box(6.4,.5,4.4,0,4,0,'teal',g);this.label('سلسلة فروع · استلام موردين',5.5,.4,0,4.15,-2.3,'#fff0ce','#284a49',g).rotation.y=Math.PI;}
 const customer=this.human('shirt',(i+2)%9);customer.position.set(-1.3,0,-2.8);customer.rotation.y=Math.PI;customer.userData.action='customer:'+i;g.add(customer);g.userData.customer=customer;g.userData.renewal=new T.Group();g.add(g.userData.renewal);return g;
 },
 updateCity(dt,s){
 for(const [id,actor]of this.repActors)if(!s.repRoutes.some(r=>r.index===id)){this.repActorGroup.remove(actor);this.clearGroup(actor);this.repActors.delete(id)}for(const r of s.repRoutes){let actor=this.repActors.get(r.index);if(!actor){actor=this.human('teal',5+r.index);this.repActorGroup.add(actor);this.repActors.set(r.index,actor)}const f=r.phase==='visit'?1:Math.min(1,r.elapsed/r.duration),p=cityPoint({x:r.from.x+(r.to.x-r.from.x)*f,y:r.from.y+(r.to.y-r.from.y)*f});actor.position.set(p.x,0,p.z);actor.rotation.y=Math.atan2(r.to.x-r.from.x,r.to.y-r.from.y);const walk=r.phase==='visit'?0:Math.sin(this.elapsed*10)*.5;actor.userData.legs[0].rotation.x=walk;actor.userData.legs[1].rotation.x=-walk;actor.userData.arms[0].rotation.x=-walk;actor.userData.arms[1].rotation.x=walk}
 const trips=[s.trip,...(s.fleetTrips||[])].filter(Boolean),ids=new Set(trips.map(t=>t.vehicleId));
 for(const [id,g]of this.cityTrucks)if(!ids.has(id)){this.cityTrucksGroup.remove(g);this.clearGroup(g);this.cityTrucks.delete(id)}
 for(const t of trips){let truck=this.cityTrucks.get(t.vehicleId);if(!truck){truck=this.makeTruck();truck.scale.setScalar(1);this.decorateTruck(truck,s.vehicles.find(v=>v.id===t.vehicleId)?.kind);this.cityTrucksGroup.add(truck);truck.userData.action='vehicle:'+t.vehicleId;truck.userData.cargo=new T.Group();truck.add(truck.userData.cargo);this.cityTrucks.set(t.vehicleId,truck)}
 const quantity=t.cargo.reduce((n,b)=>n+b.qty,0);if(truck.userData.quantity!==quantity){truck.userData.quantity=quantity;this.clearGroup(truck.userData.cargo);for(let i=0;i<Math.min(8,Math.ceil(quantity/5));i++){const b=t.cargo[Math.min(t.cargo.length-1,Math.floor(i/8*t.cargo.length))],m=this.mats['product_'+b.pid]||this.mat('product_'+b.pid,PRODUCTS[b.pid].color,.93);this.carton(-1.8+i%4*.75,1.03,-.4+Math.floor(i/4)*.8,.85,truck.userData.cargo,m)}}const yard=t.legs[t.legIndex]?.yard;const p=yard?yardPosition(t.legs[t.legIndex],t.legElapsed,t.yardHome):cityPoint(routePosition(t));truck.position.set(p.x,yard?.04-.19*Math.max(0,Math.min(1,(p.x-14)/8)):-.15,p.z);truck.visible=true;if(yard)truck.rotation.y=p.yaw;const prev=truck.userData.previous;if(!yard&&prev&&Math.hypot(p.x-prev.x,p.z-prev.z)>.001)truck.rotation.y=Math.atan2(-(p.z-prev.z),p.x-prev.x);truck.userData.previous=p;for(const w of truck.userData.wheels)if(t.legs[t.legIndex]?.kind==='drive'&&!t.paused)w.rotation.y+=dt*4;
 const leg=t.legs[t.legIndex];truck.userData.open=leg.kind==='unload'&&t.legElapsed>=(leg.windowWait||0);if(truck.userData.door)truck.userData.door.rotation.z+=(truck.userData.open?-1.15-truck.userData.door.rotation.z:-truck.userData.door.rotation.z)*Math.min(1,dt*5);
 }
 const sig=trips.map(t=>t.vehicleId+':'+t.legs.map(l=>l.points?.map(p=>p.x+','+p.y).join(';')).join('|')).join('/');
 if(sig!==this.cityRouteSignature){this.cityRouteSignature=sig;this.clearGroup(this.roadMarks);for(const t of trips)for(const l of t.legs.filter(l=>l.kind==='drive'))for(let i=1;i<l.points.length;i++){const a=cityPoint(l.points[i-1]),b=cityPoint(l.points[i]),dist=Math.hypot(b.x-a.x,b.z-a.z);const mark=this.box(dist,.012,.035,(a.x+b.x)/2,-.103,(a.z+b.z)/2,'brass',this.roadMarks);mark.rotation.y=-Math.atan2(b.z-a.z,b.x-a.x)}}
 if(this.view==='city'&&this.followTruck&&s.trip){const t=s.trip,leg=t.legs[t.legIndex],p=leg.yard?yardPosition(leg,t.legElapsed,t.yardHome):cityPoint(routePosition(t));this.focusTarget.set(p.x,0,p.z)}
 },
};
