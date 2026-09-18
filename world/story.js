import * as T from '../vendor/three.module.js';
import {CAST} from '../story-data.js';
export const narrativeWorld={
 beginStory(scene,who='rabie',shot='wide'){
  if(!this.storyCast){this.storyCast=new T.Group();this.storyActors={};for(const [id,c]of Object.entries(CAST)){if(id==='saeed')continue;const actor=this.human('shirt',c.profile);actor.visible=false;this.storyActors[id]=actor;this.storyCast.add(actor)}const light=new T.PointLight(0xffe5bd,32,13,2);light.position.set(0,3,2);this.storyCast.add(light);this.scene.add(this.storyCast)}
  this.storyCast.visible=true;this.storyScene={scene,who,shot};this.resetInput?.();this.setStoryShot(who,shot);
 },
 setStoryShot(who,shot='face'){
  if(!this.storyScene)return;this.storyScene.who=who;this.storyScene.shot=shot;const place=this.storyScene.scene.place;
  const positions={office:[-9,2.5],warehouse:[6,2.8],yard:[9,9],city:[25,3]};const [x,z]=positions[place]||positions.yard;this.storyCast.position.set(x,0,z);
  const speaker=who==='player'?'rabie':who==='saeed'?'rabie':who;
  for(const [id,a]of Object.entries(this.storyActors)){a.visible=id===speaker||id==='player';a.position.set(id==='player'?-.7:.7,0,0);a.rotation.y=id==='player'?.45:-.45;}
 },
 endStory(){if(this.storyCast)this.storyCast.visible=false;this.storyScene=null;this.resetInput?.();},
 updateStoryShot(dt,s){
  if(s.story?.flags.finished&&!this.storyPlaque){this.storyPlaque=new T.Group();this.scene.add(this.storyPlaque);this.label('وكالة سعيد وأولاده',5,.7,-8.8,4.7,-7.9,'#ffe8af','#254843',this.storyPlaque)}if(this.storyPlaque)this.storyPlaque.visible=!!s.story?.flags.finished;
  if(!this.storyScene)return;const {who,shot}=this.storyScene,{x,z}=this.storyCast.position,wide=shot==='wide',portrait=innerWidth<700;
  this.camera.position.set(x+(wide?3:1.6),wide?3.1:2.2,z+(wide?6.5:4.3)*(portrait?1.25:1));this.camera.lookAt(x+(innerHeight<520&&innerWidth>innerHeight?2.2:0),portrait?.5:1.1,z);
  for(const [id,a]of Object.entries(this.storyActors)){if(!a.visible)continue;const talk=id===who||(who==='saeed'&&id==='rabie');a.userData.arms[0].rotation.x=talk?-.28+Math.sin(this.elapsed*2.7)*.12:0;a.userData.arms[1].rotation.z=talk?-.12:0;a.rotation.z=Math.sin(this.elapsed*1.4)*.008;}
 }
};
