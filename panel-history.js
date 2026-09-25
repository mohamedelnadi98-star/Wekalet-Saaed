// Ephemeral navigation only: no game saves or browser history are modified.
export class PanelHistory{
 constructor(){this.entries=[]}
 visit(current,next,started){if(current?.id===next)return;if(current)this.entries.push(current);else if(started&&next!=='tablet')this.entries.push({id:'tablet'});if(this.entries.length>30)this.entries.shift()}
 back(){return this.entries.pop()||null}
 clear(){this.entries=[]}
 get canBack(){return this.entries.length>0}
}
