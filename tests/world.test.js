import assert from 'node:assert/strict';
import * as Agency from '../economy.js';
import {AgencyWorld} from '../world.js';
const canvasContext=new Proxy({},{get:()=>()=>{}});const elements={};function el(){return{hidden:false,style:{},dataset:{},classList:{toggle(){},add(){},remove(){}},addEventListener(){},appendChild(){},setAttribute(){},querySelector(){return el()},getContext(){return canvasContext}}}
const document={createElement:()=>el(),getElementById:id=>elements[id]||(elements[id]=el()),querySelector:()=>el(),querySelectorAll:()=>[],addEventListener(){},activeElement:{tagName:'BODY'}};
class Renderer{constructor(){this.shadowMap={};}setPixelRatio(){}setSize(){}render(){}}
Object.assign(globalThis,{document,window:{addEventListener(){}},innerWidth:1440,innerHeight:900,devicePixelRatio:1});let hits=[];const world=new AgencyWorld({rendererFactory:()=>new Renderer(),blocked:()=>false,interact:id=>hits.push(id)});world.active=true;let sim=new Agency.Simulation();
for(const o of world.interactables){world.player.position.set(-6,0,4);let p=world.findPath(o.approach.x,o.approach.z);assert(p.length,'No path: '+o.id);let end=p.at(-1);assert(Math.hypot(end.x-o.approach.x,end.z-o.approach.z)<2,'Endpoint too far: '+o.id);for(const point of p)assert(!world.blockedAt(point.x,point.z),'Path inside obstruction: '+o.id);world.goTo(o.id);for(let i=0;i<2000&&world.pending;i++)world.update(.016,sim.s);assert.equal(world.pending,null,'Path got stuck: '+o.id);assert(hits.includes(o.id),'Interaction failed: '+o.id);}
console.log('PASS: all interactive destinations reachable, collision-safe paths, movement reaches and activates each object');
sim.s.capacity=480;sim.s.officeLevel=2;sim.s.truckCount=3;sim.s.vehicles=[{id:1,kind:'normal',condition:100,capacity:60},{id:2,kind:'normal',condition:100,capacity:60},{id:3,kind:'chilled',condition:100,capacity:60}];sim.s.cooling=true;sim.s.staff={worker:1,driver:1,rep:1,accountant:1};world.sync(sim.s);for(const o of world.interactables){world.player.position.set(-6,0,4);const route=world.findPath(o.approach.x,o.approach.z);assert(route.length,'Upgrade blocks access: '+o.id);}let tagged=new Set();world.scene.traverse(m=>{if(m.userData.action)tagged.add(m.userData.action)});for(const o of world.interactables)assert(tagged.has(o.id),'Missing mesh interaction: '+o.id);console.log('PASS: expanded warehouse/fleet paths and mesh picking tags');

// Cargo is removed visually at customer unloading and never reappears on return.
sim.s.trip=sim.buildTrip([{id:1,client:0}],[{pid:'bread',qty:10,cost:100,order:1}]);sim.s.trip.vehicleId=1;world.sync(sim.s);assert(world.dynamicCargo.children.length>0);
sim.s.trip.cargo=[];sim.s.trip.remaining=3;sim.s.trip.legIndex=2;world.update(.016,sim.s);assert.equal(world.dynamicCargo.children.length,0);assert.equal(world.dynamicCargo.visible,false);
for(const weather of ['clear','rain','heat','wind'])for(const time of [0,225,450,600,750,899]){sim.s.weather=weather;sim.s.time=time;world.update(.016,sim.s);assert(Number.isFinite(world.sun.intensity));assert(world.sun.intensity>=0);}
console.log('PASS: empty return cargo and complete day/weather light cycle');

sim.s.time=600;sim.s.weather='clear';world.update(.016,sim.s);assert(world.hemi.intensity>=1.25);assert(world.lamps.filter(l=>l.userData.nightPower>=65).length>=3);
const palms=[];world.scene.traverse(o=>{if(o.userData.groundedPalm)palms.push(o)});assert.equal(palms.length,3);assert(palms.every(p=>p.position.y===-.15));assert.equal(world.buildingSigns.length,12);
sim.s.trip=null;sim.s.warehousePlan={layout:'compact',slots:{bakery:3,dairy:2,pantry:1,frozen:0},staging:2,secondGate:true,returnsZone:true};sim.s.pickingJob={batch:{pid:'bread',qty:10,order:42},vehicle:1,elapsed:5,duration:10,from:{x:1,z:.3},to:{x:1.4,z:5.3}};world.update(.016,sim.s);assert(world.workerPath.length>1);for(const point of world.workerPath)assert(!world.blockedAt(point.x,point.z),'Worker crossed an obstacle');
world.setView('city');assert.equal(world.view,'city');assert.equal(world.zoomTarget,155);
console.log('PASS: bright midnight, grounded palms, six customer buildings and collision-safe worker route');

// Free layout must move physical stock and preserve navigation and save compatibility.
sim.s.trip=null;sim.s.warehousePlan.customRacks=[{x:.5,z:-6.6},{x:4.5,z:-6.6},{x:8.5,z:-6.6},{x:.5,z:-1}];
world.sync(sim.s);assert.equal(world.rackGroup.visible,false);assert(world.blockedAt(.5,-6.6));assert(!world.blockedAt(9.9,-1));
const layoutSave=new Agency.Simulation().s;layoutSave.warehousePlan.customRacks=sim.s.warehousePlan.customRacks;const loaded=Agency.Simulation.validate(layoutSave);assert.deepEqual(loaded.warehousePlan.customRacks,sim.s.warehousePlan.customRacks);
for(const p of sim.s.warehousePlan.customRacks){world.player.position.set(-6,0,4);const route=world.findPath(p.x,p.z+1.8);assert(route.length);for(const node of route)assert(!world.blockedAt(node.x,node.z))}
const invalid=structuredClone(layoutSave);invalid.warehousePlan.customRacks[1]={...invalid.warehousePlan.customRacks[0]};assert.throws(()=>Agency.Simulation.validate(invalid));
console.log('PASS: custom rack geometry, collision, worker access and saved layout validation');

// v8 facilities must appear only when purchased, retain rear-loading access and animate real stops.
const evolved=new Agency.Simulation();evolved.s.development.owned={frontage:true,jack:true,paving:true,wash:true,uniforms:true,forklift:true,dispatch:true,landmark:true};evolved.s.development.stage=4;evolved.s.development.equipment='forklift';evolved.s.staff.worker=1;world.update(.016,evolved.s);assert(world.equipment.forklift);assert(world.detailGroup.children.length>10);assert(world.cityBatchStats.after<world.cityBatchStats.before/5);
for(const home of [-10,-3,4]){world.player.position.set(-6,0,4);const path=world.findPath(home,15.9);assert(path.length);for(const point of path)assert(!world.blockedAt(point.x,point.z));}
const delivery={id:42,client:4,pid:'bread',qty:10,price:132,discount:0,payment:'cash',accepted:true,expires:99999,deadline:99999};evolved.s.trip=evolved.buildTrip([delivery],[{order:42,pid:'bread',qty:10,cost:900,expires:8}]);evolved.s.trip.vehicleId=1;
world.update(.016,evolved.s);assert(world.cityTrucks.get(1).userData.entering.visible);assert(!world.cityTrucks.get(1).userData.driver.visible);
evolved.s.trip.legIndex=evolved.s.trip.legs.findIndex(l=>l.kind==='unload');const leg=evolved.s.trip.legs[evolved.s.trip.legIndex];evolved.s.trip.legElapsed=leg.duration*.6;world.update(.2,evolved.s);assert(world.shops[4].userData.door.rotation.y<0);assert(world.shops[4].userData.customer.userData.deliveryBox.visible);assert(world.cityTrucks.get(1).userData.driver.visible);
evolved.s.trip=null;world.update(.1,evolved.s);assert(!world.shops[4].userData.customer.userData.deliveryBox.visible);assert(!world.truck.userData.driver.visible);assert(!world.cityTrucks.size);
const rearSave=new Agency.Simulation().s;rearSave.position={x:-10,z:15.9};assert.doesNotThrow(()=>Agency.Simulation.validate(rearSave));
console.log('PASS: v8 upgrades, static batching, rear loading access, boarding and customer delivery animations');

for(const kind of ['normal','chilled','frozen']){const truck=world.makeTruck();world.decorateTruck(truck,kind);assert.equal(truck.userData.boxPanels.length,4);assert(truck.userData.boxPanels.every(p=>!p.material.transparent&&p.material.opacity===1));assert.equal(truck.userData.rearDoors.length,2);assert.equal(truck.userData.door.visible,false);assert(truck.userData.rearDoors.every(d=>d.rotation.y===0));world.clearGroup(truck)}
const branded=new Agency.Simulation();branded.s.development.branding[1]='agency';world.update(.016,branded.s);assert.equal(world.truck.userData.brandGroup.children.length,2);const frontBanner=world.truck.userData.brandGroup.children[0].material;branded.s.development.branding[1]='bakery';world.update(.016,branded.s);assert.notEqual(world.truck.userData.brandGroup.children[0].material,frontBanner);assert.equal(world.truck.userData.brandGroup.children[0].material,world.truck.userData.brandGroup.children[1].material);branded.s.carry={order:1,pid:'bread',qty:10,cost:900,expires:4};world.update(.016,branded.s);assert(world.truck.userData.rearDoors[0].rotation.y<0);assert(world.truck.userData.rearDoors[1].rotation.y>0);branded.s.carry=null;world.update(.016,branded.s);assert(world.truck.userData.rearDoors.every(d=>d.rotation.y===0));
console.log('PASS: every vehicle is enclosed, company banners update on both sides, rear doors open outward and close');

// Narrative camera stages real meshes without moving player or changing logistics state.
const storySave=new Agency.Simulation(),position={...storySave.s.position},stateJSON=JSON.stringify(storySave.s);world.player.position.set(position.x,0,position.z);world.path=[];world.keys={};world.beginStory({place:'yard'},'rabie','wide');world.update(.016,storySave.s);assert(world.storyCast.visible);assert(world.storyActors.rabie.visible);assert(world.storyActors.player.visible);assert(Number.isFinite(world.camera.position.x));const camera=world.camera.position.clone();world.setStoryShot('mona','face');world.update(.016,storySave.s);assert(world.storyActors.mona.visible);assert(!world.storyActors.rabie.visible);assert(camera.distanceTo(world.camera.position)>1);world.endStory();assert(!world.storyCast.visible);assert.equal(world.storyScene,null);assert.deepEqual(storySave.s.position,position);console.log('PASS: story camera, cast changes, cleanup and unchanged player state');

// Low frame rate must not oscillate around a waypoint.
world.path=[];world.keys={};for(const o of world.interactables){world.player.position.set(-6,0,4);world.goTo(o.id);for(let i=0;i<800&&world.pending;i++)world.update(.1,sim.s);assert.equal(world.pending,null,'Low-FPS path stuck: '+o.id)}
world.canvas.getBoundingClientRect=()=>({left:0,top:0,width:1440,height:900});world.setView('all');world.target.copy(world.focusTarget);world.radius=42;world.placeCamera();const anchor=world.groundAt(800,450);world.zoomAt(800,450,25);assert(world.groundAt(800,450).distanceTo(anchor)<.00001);const old=world.focusTarget.clone();world.panCamera(720,450,820,450);assert(world.focusTarget.distanceTo(old)>1);console.log('PASS: low-FPS paths finish and cursor-anchored zoom/pan preserve the selected ground point');
// Largest buildings and five bays must retain accessible loading doors.
const campus=new Agency.Simulation();campus.s.vehicles=[...Array(5)].map((_,i)=>({id:i+1,kind:i===4?'jumbo':'normal',condition:100,capacity:i===4?120:60}));campus.s.truckCount=5;campus.s.selectedVehicle=5;campus.s.capacity=2560;for(const w of Object.values(campus.s.warehouses)){w.owned=true;w.capacity=640;}world.update(.1,campus.s);assert.equal(world.extraTrucks.children.length,4);assert.equal(world.truck.scale.x,1.2);for(const o of world.interactables.filter(o=>o.id.startsWith('storage:')||o.id==='truck')){world.player.position.set(-6,0,4);const path=world.findPath(o.approach.x,o.approach.z);assert(path.length,'Expanded campus unreachable: '+o.id);assert(Math.hypot(path.at(-1).x-o.approach.x,path.at(-1).z-o.approach.z)<.6,'Expanded campus approach blocked: '+o.id);assert(path.every(p=>!world.blockedAt(p.x,p.z)))}assert.doesNotThrow(()=>Agency.Simulation.validate({...campus.s,position:{x:-48,z:-26}}));console.log('PASS: separate expanded warehouses and fifth jumbo loading door remain accessible');
// Performance regressions: inventory changes must not rebuild unrelated actors/vehicles.
const parked=world.extraTrucks.children[0],workerBefore=world.workerActor,adultCount=world.adults.size;
for(let i=0;i<25;i++){campus.s.stock=[{pid:'bread',qty:10+i,unit:90,expires:7}];world.update(.016,campus.s);assert.equal(world.extraTrucks.children[0],parked);assert.equal(world.workerActor,workerBefore);assert.equal(world.adults.size,adultCount)}
let points=0;world.scene.traverse(o=>{if(o.isPointLight)points++});assert.equal(world.lamps.length,4);assert(points<=5);assert(world.lightSites.length>points);
const temp=new (await import('../vendor/three.module.js')).Group(),nested=new (await import('../vendor/three.module.js')).Group();temp.add(nested);const discarded=world.human('shirt',1);nested.add(discarded);assert(world.adults.has(discarded));world.clearGroup(temp);assert(!world.adults.has(discarded));
console.log('PASS: 25 stock updates retain fleet/actors, nested actor disposal releases registry, four environment point lights plus the separate story light');

for(const p of world.cityFixtureFootprints){for(const r of [...world.neighborhood.streets,...world.neighborhood.plots])assert(!(Math.abs(p.x-r.x)<(p.w+r.w)/2&&Math.abs(p.z-r.z)<(p.d+r.d)/2),'street furniture clips road/building');}
const people=[...world.adults],bodies=people.map(g=>g.getObjectByName('Anatomical body')).filter(Boolean);assert(bodies.length>1);assert.equal(new Set(bodies.map(m=>m.geometry)).size,1,'characters must share immutable geometry');
console.log('PASS: v17 fixture footprints and shared full-character geometry');

// Harbor assets must stay inside their intended footprints and out of routes.
const {HARBOR}=await import('../world/harbor-layout.js');
const {INDUSTRIAL_MESHES}=await import('../assets/harbor/industrial.js');
const {SHIP_MESHES}=await import('../assets/harbor/ships.js');
for(const data of Object.values({...INDUSTRIAL_MESHES,...SHIP_MESHES})){
 assert(data.p.length===data.n.length&&data.p.length===data.c.length);
 assert(data.p.every(Number.isFinite)&&data.n.every(Number.isFinite));
 assert(data.i.every(i=>Number.isInteger(i)&&i>=0&&i<data.p.length/3));
 assert(data.size.every(n=>n>0));
}
assert.equal(HARBOR.water.z+HARBOR.water.d/2,HARBOR.shoreZ);
assert(world.neighborhood.plots.every(p=>p.z-p.d/2>HARBOR.shoreZ));
assert(world.mooredShips.every(m=>m.position.z+HARBOR.ships[0].length*.37/2<HARBOR.shoreZ));
for(const reserve of HARBOR.reserves){assert(reserve.x+reserve.w/2<-60);assert(reserve.z-reserve.d/2>=HARBOR.shoreZ);}
assert(world.harborBatchStats.after<world.harborBatchStats.before/4);
assert(world.harborGeometries.size<=12);
world.setView('harbor');world.updateHarbor(.1);assert(world.agencyRoof.visible);assert(world.garageRoof.visible);
world.setView('office');world.radius=23;world.updateHarbor(.1);assert(!world.agencyRoof.visible);assert(!world.garageRoof.visible);
assert.equal(world.mats.roofSteel.transparent,false);assert.equal(world.mats.roofSteel.opacity,1);
assert.doesNotThrow(()=>world.cyl(.1,.1,1,0,0,0,'concrete'));assert.doesNotThrow(()=>world.sphere(.1,0,0,0,'concrete'));
const geometryBefore=world.harborGeometries.get('building-i');let disposed=false;geometryBefore.addEventListener('dispose',()=>disposed=true);campus.s.warehouses.bakery.capacity=320;world.updateEnvironment(.1,campus.s);assert(!disposed,'shared library model was disposed during a warehouse upgrade');
const mesh=world.siteUpgrades.children.find(g=>g.userData.action==='storage:bakery').children.find(m=>m.userData.libraryModel);assert.equal(mesh.geometry,geometryBefore);
console.log('PASS: harbor shoreline, reserve parcels, library meshes, cutaway roofs, shared geometry lifetime and ground primitives');
world.handsLoading=true;world.state.trip=null;world.updateHands();assert(world.handSlots.visible);assert.equal(world.handSlotMeshes.length,6);assert(world.truck.userData.boxPanels.every(p=>!p.visible));world.handsLoading=false;world.updateHands();assert(!world.handSlots.visible);assert(world.truck.userData.boxPanels.every(p=>p.visible));console.log('PASS: six clickable loading cells and closed truck restored after manual loading');
sim=new Agency.Simulation();sim.beginCampaign();sim.s.delivered=25;sim.loopState();for(const id of ['team','tools','brands','fleet','people','dispatch','routes','signature'])sim.grantWorkshop(id);sim.s.carry={order:sim.s.orders[0].id,pid:'bread',qty:20,cost:100,expires:5,manual:true};world.path=[];world.pending=null;world.player.position.set(4,0,-4);world.update(.016,sim.s);assert(world.workCart.visible);assert(!world.carryMesh.visible);assert(world.cartForks.visible);const cart=world.workCart,sheet=world.truckSheet,place=world.workplace;let meshes=0;world.scene.traverse(n=>{if(n.isMesh)meshes++});for(let i=0;i<120;i++)world.update(.016,sim.s);let after=0;world.scene.traverse(n=>{if(n.isMesh)after++});assert.equal(after,meshes);assert.equal(world.workCart,cart);assert.equal(world.truckSheet,sheet);assert.equal(world.workplace,place);for(const o of world.interactables){world.player.position.set(-6,0,4);assert(world.findPath(o.approach.x,o.approach.z).length,'v20 upgrade blocks '+o.id);}sim.s.carry=null;world.update(.016,sim.s);assert(!world.workCart.visible);console.log('PASS: v20 carts, bounded geometry and reachable destinations');

// v21: repeated jobs keep one payload and reset the operator pose; fleet changes cannot teleport him.
const ops=new Agency.Simulation();ops.s.staff.worker=1;ops.s.development.owned={jack:true,forklift:true};ops.s.development.stage=3;world.update(.1,ops.s);
for(const equipment of ['manual','jack','forklift']){const actor=world.workerActor;ops.s.workerJob={id:81,vehicle:0,batch:{order:'receive81',pid:'bread',qty:10},from:{x:9,z:4.3},to:{x:5,z:-4.8},duration:8,elapsed:0,equipment};world.update(.1,ops.s);const box=world.workerBox;
for(let i=1;i<80;i++){ops.s.workerJob.elapsed=i/10;world.update(.1,ops.s);assert.equal(world.workerBox,box);assert(Number.isFinite(actor.position.x));if(equipment==='forklift'){assert(actor.userData.seated);assert.equal(actor.position.y,.02);assert.equal(actor.userData.legs[0].userData.knee.rotation.x,1.4);}}
const position=actor.position.clone();ops.s.staff.driver=2;world.sync(ops.s);assert.equal(world.workerActor,actor);assert(actor.position.distanceTo(position)<.001);ops.s.workerJob=null;world.update(.1,ops.s);assert.equal(actor.position.y,0);assert.equal(actor.userData.seated,false);assert(!box.visible);for(const leg of actor.userData.legs){assert.equal(leg.rotation.x,0);assert.equal(leg.userData.knee.rotation.x,0);}assert.equal(world.workerBox,box);}
ops.s.carry={order:81,pid:'bread',qty:10,cost:100,expires:8,workerStaged:true};world.update(.1,ops.s);assert(!world.carryMesh.visible);assert(world.workerBox.visible);ops.s.carry=null;ops.s.development.loadMotion={vehicle:1,pid:'bread',qty:10,start:ops.s.elapsed,x:14,z:-40};world.update(.1,ops.s);assert(Math.abs(world.loadingGroup.position.x+10)<.01);assert(world.loadingGroup.position.z>14&&world.loadingGroup.position.z<16);ops.s.development.loadMotion=null;world.update(.1,ops.s);assert(!world.workerBox.visible);world.goTo('phone');world.keys.KeyD=true;world.update(.1,ops.s);world.keys.KeyD=false;assert(!world.destinationRing.visible);
console.log('PASS: worker lifecycle, one payload, fleet stability, bay-local loading and cancelled target markers');
