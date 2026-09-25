// Stable plots: each company's expansion stays inside its own land parcel.
export const COMPANY_PLOTS={bakery:{x:-27,z:-13},dairy:{x:-48,z:-13},pantry:{x:-27,z:-34},frozen:{x:-48,z:-34}};
export function warehouseFootprint(cid,capacity){const p=COMPANY_PLOTS[cid];const level=Math.max(0,Math.min(3,(capacity-160)/160));return {...p,w:8+level*1.5,d:6+level*1.3,h:3.6+level*.25};}
