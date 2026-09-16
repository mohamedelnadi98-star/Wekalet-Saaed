import * as T from '../vendor/three.module.js';
import {MAP,routePosition} from '../economy.js';
export const cityPoint=p=>({x:22+(p.x-85)/12,z:7.3+(p.y-105)/12});
export const city={
 buildCity(){
 this.cityGroup=new T.Group();this.scene.add(this.cityGroup);this.cityTrucks=new Map();this.roadMarks=new T.Group();this.scene.add(this.roadMarks);
 this.mat('asphalt',0x38464b,.98);this.mat('sidewalk',0xb1b2a4,.96);this.mat('terracotta',0xb87556,.92);this.mat('cream',0xe1d3b5,.87);this.mat('windowLit',0xadc5bb,.4,.1);this.mats.windowLit.emissive.set(0xffd596);this.mats.windowLit.emissiveIntensity=.25;
 this.box(130,.35,91,33,-.35,6,'concrete',this.cityGroup);
 // Continuous depot driveway, main avenues and client access roads.
 const road=(x,z,w,d)=>{this.box(w,.035,d,x,-.15,z,'asphalt',this.cityGroup);if(w>d){for(let a=x-w/2+1;a<x+w/2;a+=3)this.box(1.4,.014,.09,a,-.122,z,'paper',this.cityGroup)}else for(let a=z-d/2+1;a<z+d/2;a+=3)this.box(.09,.014,1.4,x,-.122,a,'paper',this.cityGroup)};
 road(55,7.3,85,5);road(22,15,5,60);road(55,33,85,5);road(84,17,5,50);
 for(let i=0;i<MAP.clients.length;i++){const p=cityPoint(MAP.clients[i]);road(p.x,(p.z+7.3)/2,4,Math.abs(p.z-7.3)+4);this.buildShop(p.x,p.z+6,i)}
 // A settled city block outside the original playable depot.
 for(let i=0;i<7;i++)this.buildApartment(-23+i*15,-20,3+(i%3));
 for(let i=0;i<4;i++)this.buildApartment(37+i*14,44,3+i%2);
 this.cityLights=[];for(const [x,z]of [[20,4],[20,17],[35,4],[50,4],[67,4],[83,4],[38,31],[61,31],[83,31]]){this.cyl(.055,.095,4,x,1.9,z,'metal',this.cityGroup);this.box(1.1,.08,.15,x+.45,3.88,z,'metal',this.cityGroup);this.box(.5,.06,.32,x+.8,3.84,z,'light',this.cityGroup);const l=new T.PointLight(0xffddb0,30,15,1.8);l.position.set(x+.8,3.7,z);l.userData.nightPower=30;this.scene.add(l);this.cityLights.push(l)}
 for(const [x,z]of [[-7,-2],[5,-3],[3,7]]){const l=new T.PointLight(0xffe5ba,65,24,1.5);l.position.set(x,4.1,z);l.userData.nightPower=65;this.scene.add(l);this.box(1.8,.08,.3,x,4.25,z,'light')}
 this.repActors=new Map();this.repActorGroup=new T.Group();this.scene.add(this.repActorGroup);this.cityTrucksGroup=new T.Group();this.scene.add(this.cityTrucksGroup);
 this.buildingSigns=[];this.cityGroup.traverse(o=>{if(o.userData.client!==undefined)this.buildingSigns.push(o)});
 },
 buildApartment(x,z,floors){
 const g=new T.Group();g.position.set(x,-.15,z);this.cityGroup.add(g);const h=floors*2.8;this.box(8,h,6,0,h/2,0,'cream',g);this.box(8.4,.25,6.4,0,h+.1,0,'edge',g);this.box(9,.18,7,0,.09,0,'sidewalk',g);
 for(let floor=0;floor<floors;floor++)for(const dx of [-2.5,0,2.5]){this.box(1.25,1.45,.06,dx,1.6+floor*2.8,3.04,'windowLit',g);this.box(1.65,.12,.65,dx,.85+floor*2.8,3.2,'edge',g);for(const ox of [-.6,0,.6])this.box(.04,.6,.04,dx+ox,1.15+floor*2.8,3.45,'metal',g);this.box(1.6,.045,.045,dx,1.46+floor*2.8,3.45,'metal',g)}
 this.box(1.3,2.2,.08,0,1.1,3.08,'wood',g);this.cyl(.8,.8,1.3,-2,h+.9,0,'dark',g);this.box(1,.7,.5,2,h+.5,1,'paper',g);
 },
 buildShop(x,z,i){const g=new T.Group();g.position.set(x,-.15,z);g.userData.client=i;g.userData.action='customer:'+i;this.cityGroup.add(g);
 this.box(6,3.5,4,0,1.75,0,i%2?'cream':'terracotta',g);this.box(6.2,.18,4.2,0,3.6,0,'edge',g);this.box(2.2,2.6,.06,1.25,1.4,-2.04,'glass',g);this.box(1.2,2.5,.09,-1.5,1.3,-2.05,'dark',g);
 const sign=this.label(['ماركت الأمانة','سوبرماركت التقوى','أسواق المدينة','هايبر الأمل','أسواق مكة','ميني ماركت البركة'][i],5.5,.65,0,3.1,-2.12,'#fff0ce','#284a49',g);sign.rotation.y=Math.PI;
 for(let j=0;j<6;j++){this.box(.95,.1,1.3,-2.4+j*.96,2.6,-2.5,j%2?'paper':'teal',g);this.carton(-2.3+j*.8,.02,-2.6,.6,g)}
 this.box(7,.18,6,0,-.02,-.3,'sidewalk',g);return g;
 },
 updateCity(dt,s){
 for(const [id,actor]of this.repActors)if(!s.repRoutes.some(r=>r.index===id)){this.repActorGroup.remove(actor);this.clearGroup(actor);this.repActors.delete(id)}for(const r of s.repRoutes){let actor=this.repActors.get(r.index);if(!actor){actor=this.human('teal');actor.scale.setScalar(.8);this.repActorGroup.add(actor);this.repActors.set(r.index,actor)}const f=r.phase==='visit'?1:Math.min(1,r.elapsed/r.duration),p=cityPoint({x:r.from.x+(r.to.x-r.from.x)*f,y:r.from.y+(r.to.y-r.from.y)*f});actor.position.set(p.x,0,p.z);actor.rotation.y=Math.atan2(r.to.x-r.from.x,r.to.y-r.from.y);const walk=r.phase==='visit'?0:Math.sin(this.elapsed*10)*.5;actor.userData.legs[0].rotation.x=walk;actor.userData.legs[1].rotation.x=-walk;actor.userData.arms[0].rotation.x=-walk;actor.userData.arms[1].rotation.x=walk}
 const trips=[s.trip,...(s.fleetTrips||[])].filter(Boolean),ids=new Set(trips.map(t=>t.vehicleId));
 for(const [id,g]of this.cityTrucks)if(!ids.has(id)){this.cityTrucksGroup.remove(g);this.clearGroup(g);this.cityTrucks.delete(id)}
 for(const t of trips){let truck=this.cityTrucks.get(t.vehicleId);if(!truck){truck=this.makeTruck();truck.scale.setScalar(.6);this.decorateTruck(truck,s.vehicles.find(v=>v.id===t.vehicleId)?.kind);this.cityTrucksGroup.add(truck);truck.userData.action='vehicle:'+t.vehicleId;truck.userData.cargo=new T.Group();truck.add(truck.userData.cargo);this.cityTrucks.set(t.vehicleId,truck)}
 const quantity=t.cargo.reduce((n,b)=>n+b.qty,0);if(truck.userData.quantity!==quantity){truck.userData.quantity=quantity;this.clearGroup(truck.userData.cargo);for(let i=0;i<Math.min(8,Math.ceil(quantity/5));i++)this.carton(-1.8+i%4*.75,1.03,-.4+Math.floor(i/4)*.8,.85,truck.userData.cargo)}const p=cityPoint(routePosition(t));truck.position.set(p.x,0,p.z);truck.visible=!(t.legIndex===0&&t.legElapsed<4);const prev=truck.userData.previous;if(prev&&Math.hypot(p.x-prev.x,p.z-prev.z)>.001)truck.rotation.y=Math.atan2(-(p.z-prev.z),p.x-prev.x);truck.userData.previous=p;for(const w of truck.userData.wheels)w.rotation.y+=dt*4;
 const leg=t.legs[t.legIndex];truck.userData.open=leg.kind==='unload';if(truck.userData.door)truck.userData.door.rotation.z+=(truck.userData.open?-1.15-truck.userData.door.rotation.z:-truck.userData.door.rotation.z)*Math.min(1,dt*5);
 }
 const sig=trips.map(t=>t.vehicleId+':'+t.legs.map(l=>l.points?.map(p=>p.x+','+p.y).join(';')).join('|')).join('/');
 if(sig!==this.cityRouteSignature){this.cityRouteSignature=sig;this.clearGroup(this.roadMarks);for(const t of trips)for(const l of t.legs.filter(l=>l.kind==='drive'))for(let i=1;i<l.points.length;i++){const a=cityPoint(l.points[i-1]),b=cityPoint(l.points[i]),dist=Math.hypot(b.x-a.x,b.z-a.z);const pavement=this.box(dist+.5,.022,2.8,(a.x+b.x)/2,-.12,(a.z+b.z)/2,'asphalt',this.roadMarks);pavement.rotation.y=-Math.atan2(b.z-a.z,b.x-a.x);const mark=this.box(dist,.012,.065,(a.x+b.x)/2,-.103,(a.z+b.z)/2,'brass',this.roadMarks);mark.rotation.y=pavement.rotation.y}}
 if(this.view==='city'&&this.followTruck&&s.trip){const p=cityPoint(routePosition(s.trip));this.focusTarget.set(p.x,0,p.z)}
 },
};
