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
