import {MAP} from '../economy.js';
export const cityPoint=p=>({x:22+(p.x-85)/12,z:7.3+(p.y-105)/12});
export const overlaps=(a,b,pad=0)=>Math.abs(a.x-b.x)<(a.w+b.w)/2+pad&&Math.abs(a.z-b.z)<(a.d+b.d)/2+pad;
// One street plan owns paving, plots and customer entrances. Buildings cannot land on roads.
export function neighborhoodLayout(){
 const streets=[{x:80,z:7.3,w:135,d:5},{x:22,z:8,w:5,d:59},{x:59,z:35,w:79,d:5},{x:96,z:8,w:5,d:59},{x:59,z:-19,w:79,d:5}];
 streets.push({x:118,z:49,w:68,d:5},{x:148,z:34,w:5,d:124},{x:96,z:34,w:5,d:124},{x:118,z:76,w:68,d:5});
 const clients=MAP.clients.map(cityPoint);for(const p of clients)streets.push({x:p.x,z:(p.z+7.3)/2,w:4.6,d:Math.abs(p.z-7.3)+4.6});
 streets.push({x:119,z:-38,w:198,d:5},{x:119,z:94,w:198,d:5},{x:178,z:28,w:5,d:137},{x:216,z:28,w:5,d:137},{x:183,z:7.3,w:70,d:5},{x:183,z:49,w:70,d:5},{x:183,z:76,w:70,d:5},{x:22,z:-28,w:5,d:24});
 const plots=[],shops=[];const clear=b=>!streets.some(r=>overlaps(b,r,.75))&&!plots.some(r=>overlaps(b,r,.2));
 for(let i=0;i<clients.length;i++){const p=clients[i],candidates=[];for(let dz=-22;dz<=22;dz+=2)for(let dx=-22;dx<=22;dx+=2){const b={x:p.x+dx,z:p.z+dz,w:6.6,d:8,client:i};if(b.x<26||b.z< -10||b.z>80)continue;candidates.push(b)}candidates.sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z));const b=candidates.find(clear);if(!b)throw Error('No connected customer plot '+i);b.rotation=p.z>=b.z?0:Math.PI;b.front={x:b.x,z:b.z+(b.rotation? -2.5:2.5)};plots.push(b);shops.push(b)}
 plots.push({x:70,z:43,w:8.4,d:7.5,facility:'branch'});
 // Street-facing terraces: neighbors have a narrow service gap, not empty lots.
 const horizontal=streets.filter(r=>r.w>r.d).sort((a,b)=>a.z-b.z);
 for(const r of horizontal)for(const side of [-1,1])for(let x=Math.max(29,r.x-r.w/2+4.5);x<Math.min(210,r.x+r.w/2-4);x+=8.7){const b={x:Math.round(x*10)/10,z:r.z+side*(r.d/2+4.6),w:8.4,d:7.5,floors:2+(Math.round(x)%3),rotation:side>0?Math.PI:0};if(clear(b))plots.push(b)}
 // Fill only the inside of blocks; reserve agency expansion, roads, shop frontage and branch.
 for(const z of [-29,-10,-2,17,26,43,59,68,84,104])for(let x=30;x<=208;x+=8.7){if(plots.length>=175)break;const b={x:Math.round(x*10)/10,z,w:8.4,d:7.5,floors:2+((Math.round(x)+z+500)%3)};if(clear(b))plots.push(b)}
 const furniture=[];for(const z of [-34.2,10.9,38.7,52.7,80])for(let x=28;x<211;x+=14){const item={x,z,w:2.1,d:1.4};if(!streets.some(r=>overlaps(item,r,.08))&&!plots.some(r=>overlaps(item,r,.1)))furniture.push(item)}
 return {streets,shops,plots,clients,furniture};
}
