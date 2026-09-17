import {MAP} from '../economy.js';
export const cityPoint=p=>({x:22+(p.x-85)/12,z:7.3+(p.y-105)/12});
export const overlaps=(a,b,pad=0)=>Math.abs(a.x-b.x)<(a.w+b.w)/2+pad&&Math.abs(a.z-b.z)<(a.d+b.d)/2+pad;
// One street plan owns paving, plots and customer entrances. Buildings cannot land on roads.
export function neighborhoodLayout(){
 const streets=[{x:55,z:7.3,w:85,d:5},{x:22,z:8,w:5,d:59},{x:59,z:35,w:79,d:5},{x:96,z:8,w:5,d:59},{x:59,z:-19,w:79,d:5}];
 const clients=MAP.clients.map(cityPoint);for(const p of clients)streets.push({x:p.x,z:(p.z+7.3)/2,w:4.6,d:Math.abs(p.z-7.3)+4.6});
 const plots=[],shops=[];const clear=b=>!streets.some(r=>overlaps(b,r,.75))&&!plots.some(r=>overlaps(b,r,1));
 for(let i=0;i<clients.length;i++){const p=clients[i],candidates=[];for(let dz=-12;dz<=12;dz+=2)for(let dx=-12;dx<=12;dx+=2){const b={x:p.x+dx,z:p.z+dz,w:6.2,d:4.8,client:i};if(b.x<26||b.z< -10||b.z>43)continue;candidates.push(b)}candidates.sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z));const b=candidates.find(clear);if(!b)throw Error('No connected customer plot '+i);b.rotation=p.z>=b.z?0:Math.PI;b.front={x:b.x,z:b.z+(b.rotation? -2.5:2.5)};plots.push(b);shops.push(b)}
 plots.push({x:70,z:43,w:8.4,d:7.5,facility:'branch'});
 for(const z of [-10,-2,17,26,43])for(let x=30;x<=90;x+=10){const b={x,z,w:8.4,d:7.5,floors:2+(plots.length%3)};if(clear(b))plots.push(b)}
 return {streets,shops,plots,clients};
}
