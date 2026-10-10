import * as T from '../vendor/three.module.js';
import {INDUSTRIAL_MESHES} from '../assets/harbor/industrial.js';
import {SHIP_MESHES} from '../assets/harbor/ships.js';
import {HARBOR} from './harbor-layout.js';
import {batchScenery} from './static-batch.js';

export const harbor={
 libraryProp(name,x,y,z,w,h,d,parent=this.scene){
  const data=INDUSTRIAL_MESHES[name]||SHIP_MESHES[name];
  this.harborGeometries??=new Map();let geometry=this.harborGeometries.get(name);
  if(!geometry){geometry=new T.BufferGeometry();for(const [attribute,key]of [['position','p'],['normal','n'],['color','c']])geometry.setAttribute(attribute,new T.Float32BufferAttribute(data[key],3));geometry.setIndex(data.i);geometry.computeBoundingSphere();this.harborGeometries.set(name,geometry)}
  if(!this.mats.libraryHarbor){this.mat('libraryHarbor',0xffffff,.82,.06);this.mats.libraryHarbor.vertexColors=true;}
  const mesh=new T.Mesh(geometry,this.mats.libraryHarbor);mesh.position.set(x,y,z);mesh.scale.set(w/data.size[0],h/data.size[1],d/data.size[2]);mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.sharedGeometry=true;mesh.userData.libraryModel=name;parent.add(mesh);return mesh;
 },
 supportedSign(text,w,h,x,y,z,parent=this.scene){
  for(const dx of [-w*.4,w*.4])this.box(.09,y+h/2,.09,x+dx,(y+h/2)/2,z-.035,'metal',parent);
  return this.label(text,w,h,x,y,z,'#f1dfb9','#244d53',parent);
 },
 buildHarbor(){
  this.harborGroup=new T.Group();this.harborGroup.name='Port of Saeed';this.scene.add(this.harborGroup);const g=this.harborGroup;
  this.mat('quayStone',0xabb6ae,.9);this.mat('harborRail',0x557078,.55,.5);this.mat('reservedLand',0xaaa18b,.98);this.mat('agencyEpoxy',0x889f9a,.66,.08);this.mat('tileGrout',0x83918a,.94);
  // Western expansion land ends at exactly the same quay edge as the existing city.
  this.box(60,.35,86,-92.5,-.35,-9.5,'reservedLand',g);
  this.box(140,1.65,1.25,-52.5,-.91,-51.9,'quayStone',g);
  this.box(215,1.65,1.25,125,-.91,-51.9,'quayStone',g);
  this.box(HARBOR.quay.w,.2,HARBOR.quay.d,HARBOR.quay.x,-.075,HARBOR.quay.z,'concrete',g);
  // Cheap opaque water: a repeating normal ripple, no expensive reflection pass.
  const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#8080ff';ctx.fillRect(0,0,128,128);
  for(let i=0;i<32;i++){ctx.strokeStyle=i%2?'#708aff':'#8d78ff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,i*4);ctx.bezierCurveTo(35,i*4+3,75,i*4-3,128,i*4);ctx.stroke()}
  this.harborRipple=new T.CanvasTexture(c);this.harborRipple.wrapS=this.harborRipple.wrapT=T.RepeatWrapping;this.harborRipple.repeat.set(35,15);
  this.mat('harborWater',0x285f70,.29,.28);this.mats.harborWater.normalMap=this.harborRipple;this.mats.harborWater.normalScale=new T.Vector2(.24,.24);
  const a=HARBOR.water;this.harborWater=new T.Mesh(new T.PlaneGeometry(a.w,a.d),this.mats.harborWater);this.harborWater.rotation.x=-Math.PI/2;this.harborWater.position.set(a.x,-.95,a.z);this.harborWater.receiveShadow=true;this.scene.add(this.harborWater);
  // Quay furniture is fixed to its slab; vehicle lanes and the company plots stay clear.
  for(let x=-57;x<22;x+=5){this.box(2.5,.025,.3,x,.04,-51.25,'brass',g);const tyre=new T.Mesh(new T.TorusGeometry(.4,.13,6,12),this.mats.rubber);tyre.position.set(x,-.65,-52.57);g.add(tyre);this.cyl(.15,.19,.45,x,.2,-50.9,'harborRail',g);this.cyl(.23,.23,.09,x,.45,-50.9,'harborRail',g)}
  for(const x of [-58,-18,20]){this.cyl(.11,.18,7,x,3.5,-46,'harborRail',g);this.box(2,.15,.18,x,6.9,-46,'harborRail',g);for(const dx of [-.7,.7])this.box(.55,.13,.45,x+dx,6.77,-46,'light',g);const light=new T.PointLight(0xffdeb4,60,28,1.8);light.position.set(x,6.6,-46);light.userData.nightPower=60;this.scene.add(light);this.cityLights.push(light)}
  // A mounted harbor jib crane; all supports end on the quay, not in mid-air.
  for(const x of [-49,13]){this.box(2.8,.5,2.8,x,.2,-48,'quayStone',g);this.cyl(.42,.62,8,x,4.35,-48,'brass',g);this.box(.45,.55,12,x,8.3,-52,'brass',g);this.box(2,1.2,2,x,7.5,-47,'teal',g);this.cyl(.027,.027,5.5,x,5.4,-57,'metal',g);const hook=new T.Mesh(new T.TorusGeometry(.25,.045,5,10,Math.PI*1.5),this.mats.metal);hook.position.set(x,2.5,-57);g.add(hook)}
  this.mooredShips=HARBOR.ships.map(p=>{const ship=this.libraryProp(p.model,p.x,-2.15,p.z,p.length*.37,8,p.length,g);ship.rotation.y=Math.PI/2;ship.userData.baseY=-2.15;for(const dx of [-8,8]){const rope=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(p.x+dx,.38,-50.9),new T.Vector3(p.x+dx,0,-54),new T.Vector3(p.x+dx,1,p.z+3.8)]),new T.LineBasicMaterial({color:0x665c43}));g.add(rope)}return ship});
  this.harborTug=this.libraryProp('boat-tug-a',48,-1.7,-79,3.5,4.2,7,g);this.harborTug.rotation.y=Math.PI/2;
  for(const x of [-65,35,100])this.libraryProp('buoy',x,-1.25,-92,1.2,2.3,1.2,g);
  // Containers and rear annex use actual CC0 industrial library meshes.
  for(const [x,z]of [[-8,-47],[-3,-47],[2,-47]])this.libraryProp('shipping-container-a',x,.03,z,2.8,2.7,4.5,g);
  const b=HARBOR.annex;this.box(b.w+.8,.2,b.d+.8,b.x,-.04,b.z,'quayStone',g);this.libraryProp('building-s',b.x,.06,b.z,b.w,b.h,b.d,g).rotation.y=Math.PI;this.obstacle(b.x,b.z,b.w,b.d);
  this.label('وكالة سعيد • جناح الخدمات',9,.55,b.x,2.7,b.z+b.d/2+.03,'#f4dfb4','#294b51',g);
  for(const r of HARBOR.reserves){this.box(r.w,.08,r.d,r.x,-.13,r.z,'reservedLand',g);for(const side of [-1,1]){this.box(r.w,.12,.18,r.x,-.02,r.z+side*r.d/2,'quayStone',g);this.box(.18,.12,r.d,r.x+side*r.w/2,-.02,r.z,'quayStone',g)}this.supportedSign(r.name,12,1.2,r.x,2.6,r.z+r.d/2-.6,g);}
  this.supportedSign('ميناء دمياط • رصيف الخدمات',13,1.2,-31,3,-42.3,g);
  this.harborBatchStats=batchScenery(g);
  this.buildAgencyArchitecture();
 },
 buildAgencyArchitecture(){
  const g=new T.Group();g.name='Agency structure';this.scene.add(g);this.agencyStructure=g;
  // Solid connected beams above the office and loading canopy carry the fixtures.
  const beam=(w,h,d,x,y,z,mat='metal')=>{const mesh=this.box(w,h,d,x,y,z,mat,g);mesh.userData.structural=true;return mesh};
  beam(11.7,.22,.24,-8.85,4.67,-2.5);beam(11.7,.22,.24,-8.85,4.67,1.65);beam(.22,4.65,.22,-14.7,2.3,1.65);beam(.22,4.65,.22,-3,2.3,1.65);
  this.obstacle(-14.7,1.65,.22,.22);this.obstacle(-3,1.65,.22,.22);
  for(const x of [-14.7,-3,6,14])beam(.22,.22,10,x,4.67,-3);
  // Short cantilever arms join each existing luminaire to the actual roof frame.
  for(const [x,z]of [[-7,-2],[5,-3]]){beam(.07,.36,.07,x,4.43,z);beam(x<0?11.7:17,.12,.12,x<0?-8.85:5.5,4.67,z)}
  beam(.14,.16,6.9,3,4.67,5.1);beam(.06,.36,.06,3,4.43,7);
  beam(17,.24,.2,5.5,4.67,1.7);beam(17,.24,.2,5.5,4.67,8.55); // joins existing garage beam
  // Roofs are removed as a whole in close interior views, never faded to floating fragments.
  this.agencyRoof=new T.Group();this.agencyRoof.name='Cutaway roof';this.scene.add(this.agencyRoof);
  this.box(30.4,.2,10.7,-.2,4.9,-3,'roofSteel',this.agencyRoof).userData.structural=true;
  for(let x=-14.8;x<15;x+=1.1)this.box(.07,.1,10.7,x,5.03,-3,'metal',this.agencyRoof).userData.structural=true;
  for(const x of [-14.9,14.65])beam(.11,4.45,.11,x,2.17,-8,'metal');
  // Agency surfaces: small stone tiles in the office; satin epoxy and joints in the warehouse.
  this.box(11.1,.016,10,-8.8,.05,-3,'floor',g);
  for(let x=-14.3;x<-3.2;x+=1.2)this.box(.013,.005,10,x,.061,-3,'tileGrout',g);
  for(let z=-8;z<2;z+=1.2)this.box(11.1,.005,.013,-8.8,.061,z,'tileGrout',g);
  this.box(16,.018,10.1,5,.045,-3,'agencyEpoxy',g);
  for(const x of [-2.5,1.5,5.5,9.5,13])this.box(.018,.006,10,x,.058,-3,'tileGrout',g);
  for(const z of [-7.8,-3.8,.2])this.box(16,.006,.018,5,.058,z,'tileGrout',g);
  for(const x of [-2.1,13.25])this.box(.08,.01,9.2,x,.064,-3,'brass',g);
  // Loading sign moves onto the beam; the route underneath remains unchanged.
  this.label('منطقة التحميل',4,.55,4,4.35,1.84,'#f0d9a5','#284b50',g);
  this.agencyBatchStats=batchScenery(g);
 },
 updateHarbor(dt){
  this.harborRipple.offset.x=(this.elapsed*.008)%1;this.harborRipple.offset.y=(this.elapsed*.003)%1;
  for(const [i,ship]of this.mooredShips.entries()){ship.position.y=ship.userData.baseY+Math.sin(this.elapsed*.6+i)*.035;ship.rotation.z=Math.sin(this.elapsed*.4+i)*.002}
  this.harborTug.position.x=48+Math.sin(this.elapsed*.012)*28;this.harborTug.rotation.y=Math.cos(this.elapsed*.012)>=0?Math.PI/2:-Math.PI/2;
  this.harborTug.position.y=-1.7+Math.sin(this.elapsed*.7)*.04;
  this.agencyRoof.visible=(this.view==='harbor'||this.view==='city'||this.radius>95)&&!this.storyScene;
  if(this.garageRoof)this.garageRoof.visible=this.agencyRoof.visible;
 }
};
