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
const palms=[];world.scene.traverse(o=>{if(o.userData.groundedPalm)palms.push(o)});assert.equal(palms.length,3);assert(palms.every(p=>p.position.y===-.15));assert.equal(world.buildingSigns.length,6);
sim.s.trip=null;sim.s.warehousePlan={layout:'compact',slots:{bakery:3,dairy:2,pantry:1,frozen:0},staging:2,secondGate:true,returnsZone:true};sim.s.pickingJob={batch:{pid:'bread',qty:10,order:42},vehicle:1,elapsed:5,duration:10,from:{x:1,z:.3},to:{x:1.4,z:5.3}};world.update(.016,sim.s);assert(world.workerPath.length>1);for(const point of world.workerPath)assert(!world.blockedAt(point.x,point.z),'Worker crossed an obstacle');
world.setView('city');assert.equal(world.view,'city');assert.equal(world.zoomTarget,95);
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
