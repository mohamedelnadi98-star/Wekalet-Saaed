// Pointer Events handle mouse and multitouch without treating a pinch as a tap.
export function bindWorldGestures(canvas,{enabled,getAngle,setAngle,getZoom,setZoom,tap}){
 const pointers=new Map();let anchor=null,pinch=null,suppressTap=false,dragged=false;
 const distance=()=>{const [a,b]=[...pointers.values()];return Math.max(1,Math.hypot(a.x-b.x,a.y-b.y))};
 const rebase=()=>{pinch=pointers.size>=2?{distance:distance(),zoom:getZoom()}:null;};
 const reset=()=>{const ids=[...pointers.keys()];pointers.clear();anchor=pinch=null;suppressTap=dragged=false;for(const id of ids)try{if(canvas.hasPointerCapture?.(id))canvas.releasePointerCapture(id)}catch{}};
 canvas.addEventListener('pointerdown',e=>{if(!enabled()||e.button!==undefined&&e.button!==0)return;e.preventDefault();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});try{canvas.setPointerCapture?.(e.pointerId)}catch{}if(pointers.size===1){anchor={x:e.clientX,y:e.clientY,angle:getAngle()};suppressTap=dragged=false;}else{suppressTap=true;rebase();}});
 canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;if(!enabled()){reset();return}e.preventDefault();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size>=2){if(!pinch)rebase();setZoom(Math.max(15,Math.min(110,pinch.zoom*pinch.distance/distance())));suppressTap=true;}else if(anchor&&!suppressTap){const dx=e.clientX-anchor.x,dy=e.clientY-anchor.y;if(Math.hypot(dx,dy)>7)dragged=true;if(dragged)setAngle(anchor.angle-dx*.006);}});
 const end=(e,cancelled)=>{if(!pointers.has(e.pointerId))return;e.preventDefault();const click=!cancelled&&pointers.size===1&&!suppressTap&&!dragged&&anchor&&Math.hypot(e.clientX-anchor.x,e.clientY-anchor.y)<=7;pointers.delete(e.pointerId);if(pointers.size){suppressTap=true;rebase();}else{anchor=pinch=null;suppressTap=dragged=false;}try{if(canvas.hasPointerCapture?.(e.pointerId))canvas.releasePointerCapture(e.pointerId)}catch{}if(click&&enabled())tap(e);};
 canvas.addEventListener('pointerup',e=>end(e,false));canvas.addEventListener('pointercancel',e=>end(e,true));canvas.addEventListener('lostpointercapture',e=>end(e,true));canvas.addEventListener('contextmenu',e=>e.preventDefault());
 return {reset,get active(){return pointers.size>0}};
}
