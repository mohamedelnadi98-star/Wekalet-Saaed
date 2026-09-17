import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createMultiplayer} from '../multiplayer.mjs';
import {Simulation} from '../economy.js';
test('cloud account, cross-device login, private slots, revisions, rollback and durable saves',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'saeed-cloud-'));let handler=await createMultiplayer(dir);const server=http.createServer(async(req,res)=>handler(req,res,new URL(req.url,'http://localhost')));await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port;
 const api=async(p,data,token)=>{const r=await fetch(url+'/api/'+p,{method:data?'POST':'GET',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(data?{body:JSON.stringify(data)}:{})});return {status:r.status,...await r.json()}};
 try{
  const a=await api('register',{name:'سعيد'}),b=await api('register',{name:'آخر'}),password='A-long-test-password-123';
  assert.equal((await api('account',{account:'saeed_test',password},a.token)).status,200);
  assert.equal((await api('account',{account:'saeed_test',password},b.token)).status,400);
  const state=new Simulation().s;state.name='حفظ عبر جهازين';
  assert.equal((await api('cloud',{slot:'1',revision:0,state},a.token)).revision,1);
  assert.equal((await api('cloud',{slot:'1',revision:0,state},a.token)).status,409);
  assert.equal((await api('cloud',null,b.token)).slots['1'],undefined);
  assert.equal((await api('login',{account:'saeed_test',password:'wrong'})).status,401);
  const login=await api('login',{account:'saeed_test',password});assert.equal(login.player.id,a.player.id);
  assert.equal((await api('cloud',null,a.token)).status,401);
  assert.equal((await api('cloud',null,login.token)).slots['1'].state.name,state.name);
  assert.equal((await api('cloud',{slot:'1',revision:1,state:{bad:true}},login.token)).status,400);
  assert.equal((await api('cloud',null,login.token)).slots['1'].revision,1);
  handler=await createMultiplayer(dir);assert.equal((await api('cloud',null,login.token)).slots['1'].state.name,state.name);
  const raw=await readFile(path.join(dir,'world.json'),'utf8');assert(!raw.includes(password));assert(!raw.includes(login.token));
  assert.equal((await api('push',null,login.token)).enabled,false);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true})}
});
test('push subscription rejects arbitrary URLs and actual shipment triggers recipient notifier once',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'saeed-push-')),sent=[];const handler=await createMultiplayer(dir,{pushKey:'test-key',notify:async(p,d)=>sent.push([p.id,d])});const server=http.createServer((req,res)=>handler(req,res,new URL(req.url,'http://localhost')));await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port;
 const api=async(p,data,token)=>{const r=await fetch(url+'/api/'+p,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(data)});return {status:r.status,...await r.json()}};
 try{const a=await api('register',{name:'أ'}),b=await api('register',{name:'ب'}),keys={p256dh:'a'.repeat(87),auth:'a'.repeat(22)};
 assert.equal((await api('push',{subscription:{endpoint:'https://127.0.0.1/private',keys}},b.token)).status,400);
 assert.equal((await api('push',{subscription:{endpoint:'https://fcm.googleapis.com/fcm/send/test',keys}},b.token)).status,200);
 const shipment={nonce:'test-nonce-001',to:b.player.id,pid:'bread',qty:10,life:1};await api('send',shipment,a.token);await api('send',shipment,a.token);assert.equal(sent.length,1);assert.equal(sent[0][0],b.player.id);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true})}
});
