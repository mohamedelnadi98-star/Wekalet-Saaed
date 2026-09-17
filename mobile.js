export function installMobileUI(getWorld){
 const body=document.body;
 document.querySelectorAll('[data-mobile-panel]').forEach(button=>button.addEventListener('click',()=>{const key=button.dataset.mobilePanel,was=body.classList.contains('show-'+key);for(const k of ['maps','tasks','views'])body.classList.remove('show-'+k);if(!was)body.classList.add('show-'+key);getWorld()?.resetInput?.()}));
 const reset=()=>getWorld()?.resetInput?.();window.addEventListener('orientationchange',reset);window.addEventListener('blur',reset);document.addEventListener('visibilitychange',reset);
}
export function bindTouchControls(world,buttons){
 const pressed=new Map();const release=id=>{const key=pressed.get(id);pressed.delete(id);if(key&&!Array.from(pressed.values()).includes(key))world.keys[key]=false};
 world.resetInput=()=>{pressed.clear();world.keys={};world.path=[];world.pending=null;world.speed=0};
 for(const button of buttons){button.addEventListener('contextmenu',e=>e.preventDefault());button.addEventListener('selectstart',e=>e.preventDefault());button.addEventListener('pointerdown',e=>{e.preventDefault();if(world.cb.blocked())return;release(e.pointerId);pressed.set(e.pointerId,button.dataset.key);world.keys[button.dataset.key]=true;button.setPointerCapture?.(e.pointerId)});for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,e=>{e.preventDefault();release(e.pointerId)})}
 for(const type of ['pointerup','pointercancel'])window.addEventListener(type,e=>release(e.pointerId));
}
