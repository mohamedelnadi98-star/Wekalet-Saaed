import {BAY_X} from '../world/fleet-path.js';
import {rackApproach} from './layout.js';
const SPEEDS=[1,1.5,2];
export function rescaleTrip(trip,speed){
 for(let i=0;i<trip.legs.length;i++){const leg=trip.legs[i];if(leg.kind!=='drive'||leg.yard)continue;const ratio=(leg.travelSpeed||1)/speed;leg.duration*=ratio;if(i===trip.legIndex)trip.legElapsed*=ratio;leg.travelSpeed=speed;}
 trip.total=trip.legs.reduce((n,l)=>n+l.duration,0);trip.remaining=trip.legs.slice(trip.legIndex).reduce((n,l)=>n+l.duration,0)-trip.legElapsed;
}
export function installTravelSpeed(Simulation,{PRODUCTS:P}){
 const p=Simulation.prototype,build=p.buildTrip;
 p.buildTrip=function(...args){const t=build.apply(this,args);rescaleTrip(t,this.s?.settings?.travelSpeed||1);return t;};
 p.setTravelSpeed=function(value){const speed=Number(value);if(!SPEEDS.includes(speed))return false;this.s.settings.travelSpeed=speed;for(const t of this.allTrips())rescaleTrip(t,speed);this.notice('سرعة رحلات الخريطة ×'+speed+'؛ وقت اليوم والطلبيات ثابت.');this.change();return true;};
 const validate=Simulation.validate;Simulation.validate=function(data){const s=validate(data);s.settings.travelSpeed??=1;if(!SPEEDS.includes(s.settings.travelSpeed))throw Error('سرعة رحلة غير صالحة.');for(const t of [s.trip,...s.fleetTrips].filter(Boolean))for(const l of t.legs)if(l.travelSpeed!==undefined&&!SPEEDS.includes(l.travelSpeed))throw Error('بيانات سرعة الطريق غير صالحة.');const j=s.pickingJob;if(j&&j.to.x===1.4&&j.to.z===5.3){j.to={x:BAY_X[s.vehicles.findIndex(v=>v.id===j.vehicle)],z:15.9};j.from=rackApproach(s,s.warehousePlan.slots[P[j.batch.pid].company]);j.equipment??=s.development.equipment;}
 if(s.carry?.workerStaged!==undefined&&typeof s.carry.workerStaged!=='boolean')throw Error('بيانات حمولة العامل غير صالحة.');return s;};
}
