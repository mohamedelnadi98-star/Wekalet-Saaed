import * as T from '../vendor/three.module.js';
export const handsWorld={
 updateHands(){
  if(!this.handSlots){this.handSlots=new T.Group();this.truck.add(this.handSlots);this.handSlotMeshes=[];for(let i=0;i<6;i++){const g=new T.Group();g.position.set(-1.95+(i%3)*1.12,1.04+Math.floor(i/3)*.78,0);g.userData.action='loadslot:'+i;this.handSlots.add(g);const m=new T.Mesh(new T.BoxGeometry(1.02,.08,1.7),new T.MeshBasicMaterial({color:0xe8c77b,transparent:true,opacity:.45,depthTest:false}));m.renderOrder=10;g.add(m);this.label(String(i+1),.48,.3,0,.06,.2,'#ffffff','#23484b',g).rotation.x=-Math.PI/2;const box=this.carton(0,.12,0,.8,g);box.userData.action='loadslot:'+i;this.handSlotMeshes.push({g,m,box});}}
  const visible=!!this.handsLoading&&!this.state?.trip&&!this.storyScene;this.handSlots.visible=visible;
  for(const panel of this.truck.userData.boxPanels||[])panel.visible=!visible;
  if(visible){this.dynamicCargo.visible=false;for(const [i,{m,box}]of this.handSlotMeshes.entries()){const batches=this.state.cargo.filter(b=>b.slot===i),qty=batches.reduce((n,b)=>n+b.qty,0);box.visible=qty>0;box.scale.y=.6+Math.min(1,qty/10);m.material.color.set(qty?0x78c9a4:0xe8c77b);for(const door of this.truck.userData.rearDoors||[])door.rotation.y=door===this.truck.userData.rearDoors[0]?-1.65:1.65;}}
  else this.dynamicCargo.visible=!!(this.state?.trip?this.state.trip.cargo:this.state?.cargo)?.length;
 }
};
