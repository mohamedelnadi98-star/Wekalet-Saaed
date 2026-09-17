import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
test('portable HTML rewrites all modules to embedded URLs, and PWA caches every module/texture',()=>{
 const html=fs.readFileSync(path.join(root,'Play-Offline.html'),'utf8'),script=html.match(/<script type="module">([\s\S]*)<\/script>/)[1];
 const blobs=[];class BlobMock{constructor(parts){this.source=parts.join('')}}
 const context={window:{},Blob:BlobMock,URL:{createObjectURL:b=>{blobs.push(b.source);return 'blob:embedded-'+blobs.length}}};vm.createContext(context);
 vm.runInContext(script.replace(/import\(moduleURL\('game.js'\)\)[\s\S]*$/,''),context);context.moduleURL('game.js');assert.equal(blobs.length,vm.runInContext('Object.keys(sources).length',context));assert(blobs.length>=31);for(const code of blobs)assert(!/from\s*['"]\./.test(code),'Unbundled relative import');assert(context.window.SAEED_ASSETS.wood.startsWith('data:image/png;base64,'));
 const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8'),assets=JSON.parse(sw.match(/ASSETS=(\[[^;]+?\]),HASHES=/)[1]);for(const asset of assets)assert(fs.existsSync(path.join(root,asset)),'Missing precache asset: '+asset);assert(assets.includes('./network.js'));assert(assets.includes('./guide.js'));assert(assets.includes('./Guide.html'));assert(assets.includes('./world/city.js'));assert(assets.includes('./world/effects.js'));assert(assets.includes('./assets/icon-512.png'));assert(sw.includes("url.pathname.includes('/api/')"));assert(!assets.some(a=>a.includes('server-data')));
});
