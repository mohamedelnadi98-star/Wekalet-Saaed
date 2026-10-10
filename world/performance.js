// Changes only render detail. Simulation time, prices and delivery outcomes are unaffected.
export class RenderBudget{
 constructor(){this.scale=1;this.total=0;this.frames=0;this.slow=0;this.fast=0;}
 sample(dt){if(!Number.isFinite(dt)||dt<=0||dt>.2)return null;this.total+=dt;this.frames++;if(this.total<3)return null;const mean=this.total/this.frames;this.total=0;this.frames=0;if(mean>.027){this.slow++;this.fast=0}else if(mean<.018){this.fast++;this.slow=0}else{this.slow=0;this.fast=0}let next=this.scale;if(this.slow>=2){next=Math.max(.7,this.scale-.15);this.slow=0}if(this.fast>=5){next=Math.min(1,this.scale+.1);this.fast=0}if(next===this.scale)return null;this.scale=next;return next;}
}
