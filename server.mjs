import http from 'node:http';
import {spawn} from 'node:child_process';
import {createMultiplayer} from './multiplayer.mjs';
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.dirname(fileURLToPath(import.meta.url)),port=Number(process.env.PORT||8787);
const mime={'.glb':'model/gltf-binary','.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8'};
let pushKey=null,notify=async()=>{};
if(process.env.VAPID_PUBLIC_KEY&&process.env.VAPID_PRIVATE_KEY){const {default:webpush}=await import('web-push');pushKey=process.env.VAPID_PUBLIC_KEY;webpush.setVapidDetails(process.env.VAPID_SUBJECT,pushKey,process.env.VAPID_PRIVATE_KEY);notify=async(player,payload)=>{for(const sub of player?.subscriptions||[])try{await webpush.sendNotification(sub,JSON.stringify(payload),{TTL:86400,timeout:8000})}catch(e){console.error('Push delivery failed:',e.statusCode||'network')}}}
const multiplayer=await createMultiplayer(process.env.DATA_DIR||path.join(root,'server-data'),{notify,pushKey});
http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');if(await multiplayer(req,res,url))return;let relative=decodeURIComponent(url.pathname);if(relative==='/')relative='/index.html';const file=path.resolve(root,'.'+relative);if(!file.startsWith(root+path.sep)||relative.includes('..')||relative.startsWith('/node_modules/')||relative.startsWith('/tests/')||relative.startsWith('/server-data/')||!mime[path.extname(file)])throw Error();if(!(await stat(file)).isFile())throw Error();const data=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(data)}catch{res.writeHead(404);res.end('Not found')}}).listen(port,process.env.HOST||'127.0.0.1',()=>{const url='http://localhost:'+port;console.log('وكالة سعيد: '+url);if(process.argv.includes('--open')&&process.platform==='win32')spawn('cmd',['/c','start','',url],{stdio:'ignore'})});
