import * as T from '../vendor/three.module.js';
import * as Agency from '../economy.js';

export const scene = {
box(w,h,d,x,y,z,mat='wood',parent=this.scene){const m=new T.Mesh(new T.BoxGeometry(w,h,d),typeof mat==='string'?this.mats[mat]:mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m},

cyl(rt,rb,h,x,y,z,mat='metal',parent=this.scene,segments=16){const m=new T.Mesh(new T.CylinderGeometry(rt,rb,h,segments),typeof mat==='string'?this.mats[mat]:mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m},

sphere(r,x,y,z,mat='skin',parent=this.scene){const m=new T.Mesh(new T.SphereGeometry(r,16,12),this.mats[mat]);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m},

label(text,w,h,x,y,z,color='#e8d0a1',bg='#193d40',parent=this.scene){const c=document.createElement('canvas');c.width=1024;c.height=256;const g=c.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,1024,256);g.strokeStyle=color;g.lineWidth=3;g.strokeRect(12,12,1000,232);g.font='bold 96px Tahoma, Arial';g.textAlign='center';g.textBaseline='middle';g.fillStyle=color;g.direction='rtl';g.fillText(text,512,125,930);let tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;let mesh=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:tex,roughness:.8,side:T.DoubleSide}));mesh.position.set(x,y,z);parent.add(mesh);return mesh},

wall(w,h,d,x,y,z){let m=this.box(w,h,d,x,y,z,'wall');this.obstacle(x,z,w,d);return m},

obstacle(x,z,w,d){this.obstacles.push({x,z,w:w+.55,d:d+.55})},

buildWorld(){const hemi=new T.HemisphereLight(0xdaece8,0x68543d,2);this.hemi=hemi;this.scene.add(hemi);this.sun=new T.DirectionalLight(0xffd299,3.6);this.sun.position.set(-18,30,12);this.sun.castShadow=true;this.sun.shadow.mapSize.set(this.touchDevice?1024:2048,this.touchDevice?1024:2048);this.sun.shadow.camera.left=-32;this.sun.shadow.camera.right=32;this.sun.shadow.camera.top=28;this.sun.shadow.camera.bottom=-28;this.sun.shadow.normalBias=.035;this.sun.shadow.bias=-.00015;this.scene.add(this.sun);const fill=new T.DirectionalLight(0xc0e6ee,1.15);fill.position.set(15,10,-20);this.fill=fill;this.scene.add(fill);
 // Floating foundation and distinct physical floor surfaces.
 this.box(32,.9,23,-.5,-.65,1.7,'dark');this.box(31.8,.12,22.8,-.5,-.14,1.7,'concrete');this.box(11.3,.16,10.3,-8.8,-.04,-3,'floor');this.box(16,.14,10.3,5,-.04,-3,'concrete');
 for(let x=-14;x<15;x+=1.3)this.box(.6,.15,.22,x,.03,13,'edge');
 this.wall(29.6,4.5,.35,0,2.2,-8.3);this.box(29.7,1.6,.4,0,.8,-8.08,'teal');this.box(29.8,.16,.6,0,4.52,-8.3,'edge');this.wall(.35,4.5,10.5,-14.7,2.2,-3.2);this.box(.42,1.6,10.4,-14.47,.8,-3.2,'teal');
 // Warehouse steel structure; front is deliberately cut away for camera visibility.
 this.wall(.3,3.9,4.8,-3,1.9,-5.8);this.wall(.3,1.1,1.5,-3,.52,1.2);this.box(.38,1.4,4.7,-3,.7,-5.8,'teal');this.box(.45,.15,5,-3,4,-5.8,'edge');
 for(const x of [-2,6,14]){this.box(.22,4.65,.23,x,2.3,-7.8,'metal');this.box(.2,4.65,.23,x,2.3,1.7,'metal');this.box(.22,.2,9.8,x,4.55,-3,'metal');}
 this.box(16.4,.22,.25,6,4.55,1.7,'metal');
 // Windows, sill and mullions.
 for(let x=-12;x<-6;x+=3){this.box(2.3,2,.11,x,2.85,-8.02,'glass');this.box(2.5,.12,.38,x,1.8,-7.95,'wood');this.box(.09,2,.13,x,2.85,-7.91,'wood');this.box(2.3,.08,.13,x,2.8,-7.91,'wood');this.box(2.5,.12,.14,x,3.86,-7.95,'wood')}
 this.label('وكالة سعيد',5.3,1.1,-8.8,4.3,-7.97);this.label('التجارة أمانة',2.1,.55,-4.6,3.65,-7.96);this.label('المخزن • استلام وتوزيع',5,.85,5,3.65,-8.02);
 // Office furniture with individually actionable objects.
 this.desk(-10,-4,3.5,1.7);this.chair(-10,-5.6);this.obstacle(-10,-4,3.5,1.7);
 const ledger=this.box(.95,.1,.65,-10.4,1.32,-3.7,'paper');ledger.rotation.y=.1;for(let i=0;i<7;i++)this.box(.62,.005,.009,-10.4,1.375,-3.93+i*.065,'metal');this.box(.045,.12,.68,-10.87,1.33,-3.7,'red');
 this.lamp(-11.15,1.3,-4.45);this.phone(-8.85,1.29,-3.9);
 this.box(1.3,1.5,.65,-13.6,.75,-5.8,'wood');for(let i=0;i<3;i++){this.box(1.15,.035,.65,-13.6,.2+i*.5,-5.8,'edge');this.box(.27,.08,.06,-13.6,.45+i*.45,-5.43,'brass')};this.obstacle(-13.6,-5.8,1.3,.65);
 this.desk(-12,.1,2.8,1.45);this.chair(-13.4,.1,Math.PI/2);this.obstacle(-12,.1,2.8,1.45);this.box(.7,.1,.65,-11.8,1.32,.1,'paper');this.box(.2,.25,.2,-12.8,1.4,.4,'brass');this.label('الحسابات',1.1,.28,-11.8,1.68,.5);
 this.desk(-5.1,-5.8,2.3,1.2);this.chair(-5.1,-7);this.obstacle(-5.1,-5.8,2.3,1.2);this.box(.8,.12,.55,-5.1,1.33,-5.8,'paper');
 this.mapObject=this.box(1.8,1.8,.13,-4.4,2.4,-7.98,'wood');this.label('دمياط ← الدقهلية',1.65,.42,-4.4,2.45,-7.89,'#29423b','#ddcfaa');
 this.fan=new T.Group();this.fan.position.set(-8,4.25,-2.5);this.scene.add(this.fan);this.cyl(.11,.11,.5,-8,4.4,-2.5,'metal');for(let i=0;i<3;i++){let b=this.box(1.6,.04,.26,0,0,0,'wood',this.fan);b.position.set(Math.cos(i*2.094)*.75,0,Math.sin(i*2.094)*.75);b.rotation.y=-i*2.094;}this.cyl(.2,.26,.12,0,0,0,'brass',this.fan);
 this.plant(-13.6,-1.6);this.plant(-3.8,1.1);
 // Warehouse shelving: actual carton meshes are rebuilt from stock.
 this.interact('dialogue','حسن • اتكلم',4.8,2.5,5.6,5,5);this.rackGroup=new T.Group();this.scene.add(this.rackGroup);this.racks=[];for(const x of [1,5,9]){this.rack(x,-6.6,this.rackGroup);this.racks.push({x,z:-6.6});}
 this.coolGroup=new T.Group();this.scene.add(this.coolGroup);this.box(2.8,3.4,2.5,12.15,1.7,-6.45,'dark',this.coolGroup);this.coldDoorMeshes={};for(const [key,x]of [['dairy',10.9],['frozen',12.2]]){const door=new T.Group();door.position.set(x,0,-5.14);this.coolGroup.add(door);this.box(1.2,3.1,.1,.6,1.6,0,'metal',door);this.box(.08,.7,.15,.95,1.6,.1,'brass',door);this.coldDoorMeshes[key]=door;}this.label('غرف الحرارة',1.5,.48,12.15,2.8,-5.04,'#bbe4da','#275655',this.coolGroup);this.obstacle(12.15,-6.45,2.8,2.5);
 this.desk(11,-2,2.4,1.25);this.obstacle(11,-2,2.4,1.25);this.box(.8,.1,.6,11,1.31,-2,'paper');this.label('المشتريات',1.1,.28,11,1.72,-1.7);
 this.pallet(9,2.6,3,2.2);this.obstacle(9,2.6,3,2.2);
 // Physical loading lane, bollards, gate and delivery truck.
 for(let i=0;i<4;i++){this.box(4,.012,.07,2,.025,4.3+i*1.8,'edge');}this.label('منطقة التحميل',3,.5,4,1.7,1.85);
 for(let x=-1;x<14;x+=3)this.cyl(.1,.14,.65,x,.32,2.2,'brass');
 this.truck=this.makeTruck();this.truck.position.set(-10,0,12);this.truck.rotation.y=Math.PI/2;this.scene.add(this.truck);
 this.extraTrucks=new T.Group();this.extraRacks=new T.Group();this.extraRacks.userData.action="shelf";this.scene.add(this.extraTrucks,this.extraRacks);
 this.gate=new T.Group();this.gate.position.set(14.5,0,8);this.scene.add(this.gate);for(let z of [-2.8,2.8]){this.box(.4,2.8,.4,0,1.4,z,'wall',this.gate);this.sphere(.25,0,2.95,z,'brass',this.gate)}
 this.gateBar=new T.Group();this.gateBar.position.set(0,1.6,2.8);this.gate.add(this.gateBar);this.box(.14,.18,5.5,0,0,-2.8,'teal',this.gateBar);
 this.dynamicStock=new T.Group();this.dynamicIncoming=new T.Group();this.dynamicCargo=new T.Group();this.scene.add(this.dynamicStock,this.dynamicIncoming);this.truck.add(this.dynamicCargo);this.dynamicStock.userData.action='shelf';this.dynamicIncoming.userData.action='receiving';this.truck.userData.action='truck';
 this.npcs=new T.Group();this.scene.add(this.npcs);this.workerActor=null;
 this.interact('desk','عقد الوكالة',-10.4,2,-3.7,-10,-1.85);this.interact('phone','التليفون',-8.8,2,-3.9,-7.8,-2.6);this.interact('accounts','الحسابات',-12,2,.1,-10,.1);this.interact('staff','الموظفين',-5.1,2,-5.8,-5,-4.3);this.interact('map','خريطة التوزيع',-4.4,3.4,-7.9,-4.4,-6.6);this.interact('shelf','المخزون',4,2.1,-5,4,-4.1);this.interact('supplier','المشتريات',11,2,-2,10.6,-.7);this.interact('receiving','استلام البضاعة',9,1.9,2.6,9,4.3);this.interact('truck','العربية',1.3,3.25,7.3,1.4,5.3);this.interact('cooling','التبريد',12.2,3.6,-5.1,12.3,-4.1);
 // Harbor surroundings: real low-detail background geometry, kept outside playable boundaries.
 this.box(220,.3,220,0,-1.55,0,'water');this.box(100,.25,15,2,-1.05,29,'concrete');// Harbor buildings are laid out with the neighborhood instead of scattered boxes.
 for(const x of [-22,22,42])this.crane(x,-24);for(const x of [-19,20])this.palm(x,14);this.palm(-18,-11);
 this.boat(-22,-47);this.boat(20,-50);
 this.destinationRing=new T.Mesh(new T.RingGeometry(.24,.32,32),new T.MeshBasicMaterial({color:0xffd891,side:T.DoubleSide,transparent:true,opacity:.8}));this.destinationRing.rotation.x=-Math.PI/2;this.destinationRing.position.y=.08;this.destinationRing.visible=false;this.scene.add(this.destinationRing);
 }
};
