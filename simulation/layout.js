export const DEFAULT_RACKS=[{x:1,z:-6.6},{x:5,z:-6.6},{x:9,z:-6.6},{x:1,z:-1.1}];
export function validRacks(racks,capacity=160){
 if(!Array.isArray(racks)||racks.length!==4)return false;
 if(racks.some(p=>!p||!Number.isFinite(p.x)||!Number.isFinite(p.z)||p.x<.5||p.x>9||p.z< -6.6||p.z>0))return false;
 const all=racks;
 for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++)if(Math.abs(all[i].x-all[j].x)<3.6&&Math.abs(all[i].z-all[j].z)<2.1)return false;
 const blocked=(x,z)=>all.some(p=>Math.abs(x-p.x)<1.78&&Math.abs(z-p.z)<1.03);
 const seen=new Set(),q=[[0,10]];for(let i=0;i<q.length;i++){const [x,z]=q[i],k=x+','+z;if(seen.has(k)||x< -4||x>23||z< -15||z>10||blocked(x/2,z/2))continue;seen.add(k);q.push([x+1,z],[x-1,z],[x,z+1],[x,z-1])}
 return racks.every(p=>seen.has(Math.round(p.x*2)+','+Math.round((p.z+1.5)*2)));
}
export function rackApproach(s,slot){const r=(s.warehousePlan.customRacks||DEFAULT_RACKS)[slot];return {x:r.x,z:r.z+1.8}}
