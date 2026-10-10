import test from 'node:test';import assert from 'node:assert/strict';import {HandsUI} from '../ui-hands.js';import {Simulation} from '../economy.js';
test('direct cards complete accept, real carton selection, selected cell loading and dispatch without tablet',()=>{
 const el=()=>({hidden:true,innerHTML:'',setAttribute(){},addEventListener(k,f){this[k]=f}});let root;globalThis.document={createElement:el,body:{appendChild(e){if(e.id==='world-actions')root=e},classList:{add(){},remove(){}}}};
 const g=new Simulation();g.beginCampaign();g.rng=()=>.99;let opened=0,saved=0;const w={player:{position:{x:4,z:-4.1}},interactables:[{id:'shelf',approach:{x:4,z:-4.1}},{id:'truck',approach:{x:1.4,z:5.3}}],setView(){},goTo(){}};
 const ui=HandsUI({getSim:()=>g,getWorld:()=>w,open(){opened++},close(){},save(){saved++},refresh(){},esc:String,egp:n=>String(n),toast(){},panels:{settings:()=>['','','']}});
 const click=(hand,extra={})=>root.click({target:{closest:()=>({dataset:{hand,...extra}})},stopPropagation(){}});
 assert(ui.interact('phone'));assert(root.innerHTML.includes('أقبل الطلب'));click('accept',{id:String(g.s.orders[0].id)});assert(g.s.orders[0].accepted);
 for(let i=0;i<1;i++){w.player.position={x:4,z:-4.1};ui.interact('shelf');assert(root.innerHTML.includes('ورقة الطلب'));click('pick',{pid:'pastry'});assert(!g.s.carry);click('pick',{pid:'bread'});assert.equal(g.s.carry.qty,10);w.player.position={x:1.4,z:5.3};ui.interact('truck');assert(w.handsLoading);click('slot',{slot:'0'});assert(!g.s.carry);}
 assert(root.innerHTML.includes('اقتصادي'));assert(root.innerHTML.includes('سريع'));click('send',{route:'safe'});assert(g.s.trip);assert(!ui.active);assert(!w.handsLoading);assert.equal(opened,0);assert(saved>=3);
});
