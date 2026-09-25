export const BAY_X=[-10,-3,4,-20,-30];
export const BAY_Z=12;
export const GATE_POSTS=[{x:14.5,z:5.2,r:.28},{x:14.5,z:10.8,r:.28}];
export const GARAGE_POSTS=[-34,-25,-16,-6.5,.5,7.5].flatMap(x=>[{x,z:9.1,r:.12},{x,z:15.3,r:.12}]);
export function yardPosition(leg,elapsed,home=-10){const points=leg.yard==='in'?[{x:22,z:7.3},{x:home,z:7.3},{x:home,z:BAY_Z}]:[{x:home,z:BAY_Z},{x:home,z:7.3},{x:22,z:7.3}];const lengths=points.slice(1).map((p,i)=>Math.hypot(p.x-points[i].x,p.z-points[i].z)),distance=lengths.reduce((a,b)=>a+b,0);let left=Math.max(0,Math.min(1,(elapsed-(leg.hold||0))/(leg.duration-(leg.hold||0))))*distance;for(let i=0;i<lengths.length;i++){if(left<=lengths[i]||i===lengths.length-1){const f=Math.min(1,left/lengths[i]),a=points[i],b=points[i+1];return {x:a.x+(b.x-a.x)*f,z:a.z+(b.z-a.z)*f,yaw:leg.yard==='in'&&i===lengths.length-1?Math.PI/2:Math.atan2(-(b.z-a.z),b.x-a.x)}}left-=lengths[i]}return {...points[0],yaw:Math.PI/2}}
