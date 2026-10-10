import * as T from '../vendor/three.module.js';
// One actor, one payload and one continuous cached route per job.
export function updateWorker(w,dt,s){
 const actor=w.workerActor,job=s.pickingJob||s.workerJob;if(!actor)return;
 actor.position.y=0;actor.userData.seated=false;
 for(const leg of actor.userData.legs){leg.rotation.x=0;leg.userData.knee.rotation.x=0;}
 for(const arm of actor.userData.arms){arm.rotation.x=0;arm.userData.elbow.rotation.x=-.08;}
 if(!w.workerBox){w.workerBox=w.carton(0,.8,.5,.7,actor);w.workerBox.visible=false;}
 if(!job){
  if(w.workerJobRef&&w.workerPath?.length){const p=w.workerPath.at(-1);actor.position.set(p.x,0,p.z);
   if(w.workerJobRef.equipment==='forklift'){const angle=actor.rotation.y;for(const side of [1,-1]){const x=p.x+Math.cos(angle)*side*1.25,z=p.z-Math.sin(angle)*side*1.25;if(!w.blockedAt(x,z)){actor.position.set(x,0,z);break;}}}
  }
  w.workerJobRef=null;w.workerPathKey=null;w.workerBox.visible=!!s.carry?.workerStaged;
  if(w.workerBox.visible)for(const arm of actor.userData.arms)arm.rotation.x=-1;return;
 }
 if(w.workerJobRef!==job){
  if(w.workerJobRef&&w.workerPath?.length){const end=w.workerPath.at(-1);actor.position.set(end.x,0,end.z);}
  w.workerJobRef=job;w.workerPathKey=job.vehicle+':'+job.batch.order;
  const player=w.player,start={x:actor.position.x,z:actor.position.z};let pickup=[],delivery=[];
  try{w.player=actor;pickup=w.findPath(job.from.x,job.from.z);const end=pickup.at(-1)||start;w.player={position:new T.Vector3(end.x,0,end.z)};delivery=w.findPath(job.to.x,job.to.z);}finally{w.player=player;}
  w.workerPath=[start,...pickup,...delivery];w.workerPickupLength=0;w.workerRouteLength=0;w.workerLengths=[];
  for(let i=1;i<w.workerPath.length;i++){const a=w.workerPath[i-1],b=w.workerPath[i],n=Math.hypot(b.x-a.x,b.z-a.z);w.workerLengths.push(n);w.workerRouteLength+=n;if(i<=pickup.length)w.workerPickupLength+=n;}
 }
 let distance=Math.max(0,Math.min(1,job.elapsed/Math.max(.1,job.duration)))*w.workerRouteLength;
 w.workerHasPayload=distance>=w.workerPickupLength;w.workerBox.visible=w.workerHasPayload;
 for(let i=0;i<w.workerLengths.length;i++){const len=w.workerLengths[i];if(distance<=len||i===w.workerLengths.length-1){const a=w.workerPath[i],b=w.workerPath[i+1],f=len?Math.min(1,distance/len):0;actor.position.set(a.x+(b.x-a.x)*f,0,a.z+(b.z-a.z)*f);if(len)actor.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);break;}distance-=len;}
 const walk=job.elapsed<job.duration?Math.sin(job.elapsed*10)*.5:0;actor.userData.legs[0].rotation.x=walk;actor.userData.legs[1].rotation.x=-walk;for(const arm of actor.userData.arms)arm.rotation.x=w.workerHasPayload?-1:-.12;
}
