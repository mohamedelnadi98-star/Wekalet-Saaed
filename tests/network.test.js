import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createMultiplayer} from '../multiplayer.mjs';
import {AgencyNetwork} from '../network.js';
import {Simulation} from '../economy.js';
import {SaveSlots} from '../save-slots.js';
test('authenticated asynchronous shipment, duplicate send/claim, persistence and client inventory',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'saeed-test-'));const handler=await createMultiplayer(dir);const server=http.createServer(async(req,res)=>{if(!await handler(req,res,new URL(req.url,'http://localhost'))){res.writeHead(404);res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port;
 const transport=(p,opt)=>fetch(url+'/'+p.replace('./',''),opt);
 const create=()=>{const m=new Map(),storage={getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)};const slots=new SaveSlots(storage),g=new Simulation();g.sign('تجربة');g.inventory();g.repair();g.hire('driver');g.contract('bakery');return {g,slots,n:new AgencyNetwork(()=>g,slots,storage,transport)}};
 try{const a=create(),b=create();await a.n.register();await b.n.register();await a.n.refresh();assert.equal(a.n.players.length,2);
 a.g.s.stock.push({id:a.g.s.seq++,pid:'bread',qty:20,unit:100,expires:a.g.s.day+3});
 await a.n.send(b.n.session.player.id,'bread',10);assert.equal(a.g.qty('bread'),10);await b.n.refresh();assert.equal(b.n.inbox.length,1);const item=b.n.inbox[0];
 await a.n.api('send',{...item,nonce:item.nonce});await b.n.refresh();assert.equal(b.n.inbox.length,1);
 await b.n.claim(item.id);assert.equal(b.g.qty('bread'),10);assert.equal(b.g.s.purchases.bakery,0);await b.n.api('claim',{id:item.id});assert.equal(b.g.qty('bread'),10);await assert.rejects(a.n.api('claim',{id:item.id}));
 const unauthorized=await fetch(url+'/api/players');assert.equal(unauthorized.status,401);
 const badOrigin=await fetch(url+'/api/register',{method:'POST',headers:{Origin:'https://other.example','Content-Type':'application/json'},body:'{"name":"x"}'});assert.equal(badOrigin.status,403);
 await createMultiplayer(dir);assert.equal(Simulation.validate(b.g.s).networkReceived.length,1);
 }finally{await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true})}
});
