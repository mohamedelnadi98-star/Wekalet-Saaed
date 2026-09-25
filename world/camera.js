import * as T from '../vendor/three.module.js';
export const freeCamera={
 groundAt(x,y){const rect=this.canvas.getBoundingClientRect(),pointer=new T.Vector2((x-rect.left)/rect.width*2-1,-(y-rect.top)/rect.height*2+1),ray=new T.Raycaster();this.camera.updateMatrixWorld(true);ray.setFromCamera(pointer,this.camera);return ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),0),new T.Vector3())},
 placeCamera(){const mobile=innerWidth<700?1.25:1;this.camera.position.set(this.target.x+Math.sin(this.angle)*this.radius*mobile,this.radius*Math.sin(this.elevation)*mobile,this.target.z+Math.cos(this.angle)*this.radius*mobile);this.camera.lookAt(this.target);this.camera.updateMatrixWorld(true)},
 limitFocus(){this.focusTarget.x=T.MathUtils.clamp(this.focusTarget.x,-65,170);this.focusTarget.z=T.MathUtils.clamp(this.focusTarget.z,-50,90)},
 panCamera(x1,y1,x2,y2){const a=this.groundAt(x1,y1),b=this.groundAt(x2,y2);if(!a||!b)return;this.followTruck=false;this.focusTarget.add(a.sub(b));this.limitFocus();this.target.copy(this.focusTarget);this.placeCamera()},
 zoomAt(x,y,value){const before=this.groundAt(x,y);this.zoomTarget=T.MathUtils.clamp(value,8,180);this.radius=this.zoomTarget;this.target.copy(this.focusTarget);this.placeCamera();const after=this.groundAt(x,y);if(before&&after){this.followTruck=false;this.focusTarget.add(before.sub(after));this.limitFocus();this.target.copy(this.focusTarget);this.placeCamera()}},
 toggleCameraMode(){this.cameraDragMode=this.cameraDragMode==='pan'?'orbit':'pan';return this.cameraDragMode}
};
