import {drawBrand} from '../brands.js';
import * as T from '../vendor/three.module.js';
import * as Agency from '../economy.js';

export const warehouse = {
desk(x,z,w=3,d=1.5){this.box(w,.14,d,x,1.2,z,'wood');this.box(w,.055,d,x,1.29,z,'edge');for(const dx of [-w/2+.18,w/2-.18])for(const dz of [-d/2+.13,d/2-.13])this.box(.14,1.15,.14,x+dx,.57,z+dz,'wood');this.box(w*.4,.75,d*.8,x+w*.22,.8,z,'wood')},

chair(x,z,rot=0){let g=new T.Group();g.position.set(x,0,z);g.rotation.y=rot;this.scene.add(g);this.box(.8,.18,.85,0,.6,0,'teal',g);this.box(.8,.8,.15,0,1.05,-.36,'teal',g);for(const x of [-.3,.3])for(const z of [-.3,.3])this.box(.09,.6,.09,x,.3,z,'wood',g);return g},

lamp(x,y,z){this.cyl(.24,.3,.1,x,y+.05,z,'brass');this.cyl(.035,.045,.65,x,y+.4,z,'brass');this.cyl(.24,.4,.3,x,y+.85,z,'teal');const l=new T.PointLight(0xffd592,3,5,2);l.position.set(x,y+.6,z);this.scene.add(l)},

phone(x,y,z){this.box(.56,.18,.42,x,y+.09,z,'dark');let dial=this.cyl(.13,.13,.035,x,y+.2,z,'brass');this.box(.75,.12,.18,x,y+.3,z-.04,'rubber');for(let dx of [-.3,.3])this.sphere(.12,x+dx,y+.23,z-.04,'rubber')},

plant(x,z){this.cyl(.3,.23,.55,x,.28,z,'red');for(let i=0;i<7;i++){let leaf=this.sphere(.26,x+Math.cos(i)*.23,.8+Math.sin(i)*.12,z+Math.sin(i)*.23,'leaf');leaf.scale.set(.65,1.7,.65)}},

rack(x,z,parent=this.scene){for(let dx of [-1.45,1.45])for(let dz of [-.7,.7])this.box(.095,3.15,.095,x+dx,1.58,z+dz,'teal',parent);for(let y of [.25,1.25,2.25]){this.box(3,.09,1.5,x,y,z,'wood',parent);this.box(3,.16,.06,x,y,z+.75,'brass',parent)}this.box(3,.1,1.5,x,3.15,z,'teal',parent)},

pallet(x,z,w=2,d=1.4,parent=this.scene){for(let dx of [-w*.36,0,w*.36])this.box(.16,.17,d,x+dx,.12,z,'wood',parent);for(let i=0;i<5;i++)this.box(w,.08,d/6,x,.24,z-d/2+i*d/4,'edge',parent)},

carton(x,y,z,scale=1,parent=this.scene,color){let g=new T.Group();g.position.set(x,y,z);g.scale.setScalar(scale);parent.add(g);this.box(.75,.58,.58,0,.29,0,color||'box',g);this.box(.13,.012,.59,0,.586,0,'edge',g);this.box(.13,.58,.012,0,.29,.297,'edge',g);const pid=color?.name?.startsWith('product_')?color.name.slice(8):null,key='cartonLabel_'+(pid||'agency');let label=this.mats[key];if(!label){const c=document.createElement('canvas');c.width=512;c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#f2e5cb';ctx.fillRect(0,0,512,256);ctx.fillStyle=pid?'#'+Agency.PRODUCTS[pid].color.toString(16).padStart(6,'0'):'#285b5d';ctx.fillRect(0,0,512,52);ctx.fillStyle='#20383b';ctx.font='bold 40px Tahoma';ctx.textAlign='center';ctx.direction='rtl';ctx.fillText(pid?Agency.COMPANIES[Agency.PRODUCTS[pid].company].short:'وكالة سعيد',305,103,375);drawBrand(ctx,pid?Agency.PRODUCTS[pid].company:'agency',15,65,95);ctx.font='30px Tahoma';ctx.fillText(pid?Agency.PRODUCTS[pid].name:'توزيع مواد غذائية',305,150,375);for(let i=0;i<38;i++)ctx.fillRect(70+i*9,177,i%3+2,48);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;label=this.mat(key,0xffffff,.9,0,tx);}const tag=new T.Mesh(new T.PlaneGeometry(.43,.23),label);tag.position.set(0,.31,.298);tag.userData.sharedTexture=true;g.add(tag);return g},

crane(x,z){let g=new T.Group();g.position.set(x,-1,z);this.scene.add(g);for(let dx of [-2,2])this.box(.25,12,.3,dx,6,0,'metal',g);this.box(15,.3,.4,3.5,12,0,'brass',g);this.box(.15,4,.15,0,13,0,'metal',g);let rope=this.box(.035,7,.035,9,8.5,0,'metal',g);this.box(1,.5,.5,9,5,0,'dark',g);for(let i=0;i<5;i++){let b=this.box(.12,3,.12,-1.5+i*2,11,0,'metal',g);b.rotation.z=.7}},

palm(x,z){const g=new T.Group();g.position.set(x,-.15,z);this.scene.add(g);g.userData.groundedPalm=true;this.cyl(1.15,1.22,.2,0,.02,0,'edge',g);this.cyl(1.03,1.03,.08,0,.15,0,'wood',g);this.cyl(.16,.3,6,0,3,0,'wood',g,12);for(let y=.4;y<5.7;y+=.3)this.cyl(.19+(6-y)*.018,.21+(6-y)*.018,.055,0,y,0,'edge',g,12);for(let i=0;i<10;i++){const frond=new T.Group();frond.position.y=5.95;frond.rotation.y=i*Math.PI/5;g.add(frond);const points=[];for(let j=0;j<14;j++){let t=j/13,x=t*3.4,y=Math.sin(t*Math.PI)*.65-t*.8,w=Math.sin(t*Math.PI)*.36;points.push(x,y,-w,x,y,w)}const indices=[];for(let j=0;j<13;j++){const k=j*2;indices.push(k,k+1,k+2,k+1,k+3,k+2)}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(points,3));geo.setIndex(indices);geo.computeVertexNormals();const leaf=new T.Mesh(geo,this.mats.leaf);leaf.material.side=T.DoubleSide;leaf.castShadow=true;frond.add(leaf)}return g},
updateWarehouseWork(dt,s){
 if(!this.facilityGroup){this.facilityGroup=new T.Group();this.scene.add(this.facilityGroup)}const sig=JSON.stringify(s.warehousePlan)+s.branch+JSON.stringify(s.returnQuarantine.map(b=>[b.id,b.qty]));
 if(sig!==this.facilitySignature){this.facilitySignature=sig;this.clearGroup(this.facilityGroup);const w=s.warehousePlan;
 if(w.staging){this.box(2,.1,1,-.6,.9,3.6,'metal',this.facilityGroup);for(const x of [-1.4,.2])this.box(.08,.9,.08,x,.45,3.6,'metal',this.facilityGroup);this.label('تجهيز '+w.staging,1.4,.25,-.6,1.3,3.8,'#f1d8a8','#284749',this.facilityGroup)}
 if(w.returnsZone){this.pallet(12,5,2,1.4,this.facilityGroup);for(let i=0;i<Math.min(6,s.returnQuarantine.reduce((n,b)=>n+Math.ceil(b.qty/5),0));i++)this.carton(11.5+i%2*.8,.3+Math.floor(i/4)*.6,4.7+Math.floor(i%4/2)*.65,.8,this.facilityGroup);this.label('فحص المرتجعات',1.8,.3,12,1.3,5.5,'#eedcae','#744e40',this.facilityGroup)}
 if(w.secondGate){this.box(.22,2.6,.22,14.5,1.3,3.8,'metal',this.facilityGroup);this.box(.22,2.6,.22,14.5,1.3,.7,'metal',this.facilityGroup);this.label('تحميل ٢',1.8,.35,14.5,2.6,2.3,'#d7eee4','#274c50',this.facilityGroup).rotation.y=-Math.PI/2}
 if(s.branch){this.box(7,4,4,70,1.85,43,'cream',this.facilityGroup);this.label('وكالة سعيد • فرع الدقهلية',6,.7,70,3.1,40.9,'#edd4a4','#24484b',this.facilityGroup).rotation.y=Math.PI}
 }
 const job=s.pickingJob||s.workerJob;if(this.workerActor&&job){const key=job.vehicle+':'+job.batch.order;if(this.workerPathKey!==key){this.workerPathKey=key;const player=this.player;this.player=this.workerActor;this.workerPath=this.findPath(job.from.x,job.from.z);this.workerPickupLength=0;let last={x:this.workerActor.position.x,z:this.workerActor.position.z};for(const point of this.workerPath){this.workerPickupLength+=Math.hypot(point.x-last.x,point.z-last.z);last=point;}this.player={position:new T.Vector3(job.from.x,0,job.from.z)};this.workerPath.push(...this.findPath(job.to.x,job.to.z));this.player=player;this.workerPath=[{x:this.workerActor.position.x,z:this.workerActor.position.z},...this.workerPath];this.workerBox=this.carton(0,.8,.5,.7,this.workerActor)}
 const points=this.workerPath||[],lengths=points.slice(1).map((p,i)=>Math.hypot(p.x-points[i].x,p.z-points[i].z));let distance=Math.min(1,job.elapsed/job.duration)*lengths.reduce((a,b)=>a+b,0);this.workerBox.visible=distance>=this.workerPickupLength;for(const arm of this.workerActor.userData.arms)arm.rotation.x=this.workerBox.visible?-1:-.12;for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]||i===lengths.length-1){const f=lengths[i]?distance/lengths[i]:0,a=points[i],b=points[i+1];this.workerActor.position.set(a.x+(b.x-a.x)*f,0,a.z+(b.z-a.z)*f);this.workerActor.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);break}distance-=lengths[i]}this.workerActor.userData.legs[0].rotation.x=Math.sin(this.elapsed*10)*.5;this.workerActor.userData.legs[1].rotation.x=-Math.sin(this.elapsed*10)*.5;
 }else{this.workerPathKey=null;if(this.workerBox?.parent){this.workerBox.parent.remove(this.workerBox);this.clearGroup(this.workerBox)}this.workerBox=null}
 if(this.truck.userData.door){const target=s.carry||s.pickingJob||(s.ops.doors['v'+s.selectedVehicle]||0)>s.elapsed?-1.1:0;this.truck.userData.door.rotation.z+=(target-this.truck.userData.door.rotation.z)*Math.min(1,dt*4)}
},


boat(x,z){const g=new T.Group();g.position.set(x,-.65,z);this.scene.add(g);this.box(5,.5,1.7,0,0,0,'dark',g);this.box(1.6,1.3,1.4,-.8,.8,0,'edge',g);this.box(1.7,.13,1.6,-.8,1.5,0,'teal',g);this.cyl(.07,.07,2.6,.5,1.4,0,'wood',g);}
};
