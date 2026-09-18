import * as T from '../vendor/three.module.js';
export const profiles=[
 {name:'صاحب الوكالة',skin:0xb88765,shirt:0xe1d7c1,pants:0x303e47,hair:0x302a26,height:1.82,build:1,beard:true},
 {name:'حسن',skin:0xa77550,shirt:0x687f87,pants:0x293a42,hair:0x352d27,height:1.78,build:1.08,beard:true},
 {name:'إبراهيم',skin:0xc89972,shirt:0xa78b61,pants:0x3a3a35,hair:0x736e63,height:1.86,build:.96,glasses:true},
 {name:'خالد',skin:0x8c5e43,shirt:0x536c59,pants:0x383e40,hair:0x242522,height:1.75,build:1.12},
 {name:'محمود',skin:0xa67652,shirt:0x3c7576,pants:0x344453,hair:0x302721,height:1.8,build:1.1,vest:true},
 {name:'منى',skin:0xc79776,shirt:0xaab9b6,pants:0x34495b,hair:0x49322b,height:1.7,build:.85,female:true},
 {name:'كريم',skin:0xaa7858,shirt:0x8998a4,pants:0x344448,hair:0x262324,height:1.88,build:.92,glasses:true},
 {name:'سارة',skin:0xb18166,shirt:0xa28c80,pants:0x344448,hair:0x29262a,height:1.73,build:.9,female:true},
 {name:'عادل',skin:0xc39c7c,shirt:0xd1d3c6,pants:0x323c43,hair:0x77756f,height:1.76,build:1.06,glasses:true},
 {name:'عم ربيع',skin:0xa77550,shirt:0x647b89,pants:0x303c42,hair:0xa6a49b,height:1.77,build:1.08,mustache:true},
 {name:'منى — الأمانة',skin:0xb98c6b,shirt:0xb4a68f,pants:0x34443d,hair:0x66715d,height:1.69,build:.91,female:true,hijab:true},
 {name:'حسام',skin:0xb68465,shirt:0x6f8ba1,pants:0x293848,hair:0x242626,height:1.82,build:.94},
 {name:'شريف',skin:0xab7757,shirt:0x6a343b,pants:0x33343c,hair:0x242220,height:1.81,build:1.1,beard:true},
 {name:'صاحب الوكالة — الحكاية',skin:0xb18060,shirt:0xd8cbb5,pants:0x3a4144,hair:0x292722,height:1.82,build:1,beard:true}
];
export function adultHuman(world,identity=0){const spec=profiles[identity%profiles.length],g=new T.Group(),mats={};g.userData.identity=identity;g.userData.profile=spec.name;
 for(const [name,color]of Object.entries({skin:spec.skin,shirt:spec.shirt,pants:spec.pants,hair:spec.hair,shoe:0x262824,eye:0x343027,lip:0x95695b,button:0xc2c3b4,vest:0xdda54c})){const key='person_'+identity+'_'+name;mats[name]=world.mats[key]||world.mat(key,color,name==='skin'?.7:.9)}
 if(!world.clothTexture)world.clothTexture=world.tex?.('fabric','#ddddda');for(const name of ['shirt','pants'])if(world.clothTexture){mats[name].bumpMap=world.clothTexture;mats[name].bumpScale=.007;}
 function ell(x,y,z,sx,sy,sz,mat,parent=g){const mesh=new T.Mesh(new T.SphereGeometry(1,16,12),mats[mat]);mesh.scale.set(sx,sy,sz);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}
 function garment(rings,mat,parent=g){const vertices=[],uv=[],indices=[],segments=24;for(let j=0;j<rings.length;j++){const [y,rx,rz]=rings[j];for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2;vertices.push(Math.cos(a)*rx,y,Math.sin(a)*rz);uv.push(i/segments,j/(rings.length-1));if(j&&i){const n=j*(segments+1)+i;indices.push(n,n-segments-1,n-1,n-1,n-segments-1,n-segments-2)}}}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();const m=new T.Mesh(geo,mats[mat]);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
 function limb(radius,length,x,y,z,mat,parent){const mesh=new T.Mesh(new T.CapsuleGeometry(radius,length,5,12),mats[mat]);mesh.position.set(x,y,z);parent.add(mesh);mesh.castShadow=true;return mesh}
 // Adult proportions: 1.82 m body / 0.24 m head, shoulders, articulated knees and elbows.
 garment([[.93,.15,.09],[.97,.178,.108],[1.07,.18,.117],[1.2,.195,.126],[1.35,.224,.128],[1.43,.235,.098],[1.47,.073,.065]].map(([y,x,z])=>[y,x*spec.build,z]),'shirt');ell(0,.94,0,.17*spec.build,.13,.105,'pants');limb(.056,.08,0,1.5,0,'skin',g);
 const head=new T.Group();head.position.set(0,1.68,0);g.add(head);ell(0,0,0,.078+(identity%3)*.004,.118+(identity%2)*.004,.085,'skin',head);ell(0,-.055,.006,.072,.068,.073,'skin',head);const scalp=new T.Mesh(new T.SphereGeometry(1,20,12,0,Math.PI*2,0,1.33),mats.hair);scalp.scale.set(.085,.127,.089);scalp.position.set(0,.001,-.006);head.add(scalp);for(let i=0;i<7;i++)ell(-.065+i*.02,.076+Math.sin(i*.5)*.016,-.037,.015,.04,.055,'hair',head);
 for(const side of [-1,1]){ell(side*.084,-.01,0,.017,.031,.017,'skin',head);ell(side*.031,.006,.078,.014,.007,.006,'eye',head);ell(side*.032,.025,.076,.022,.005,.006,'hair',head)}ell(0,-.018,.086,.012,.023,.018,'skin',head);ell(0,-.056,.074,.023,.004,.007,'lip',head);
 if(spec.mustache)ell(0,-.04,.086,.04,.013,.012,'hair',head);
 if(spec.hijab){ell(0,-.09,-.05,.107,.19,.09,'hair',head);garment([[1.3,.17,.115],[1.43,.13,.1],[1.53,.1,.09]],'hair');}
 if(spec.beard)ell(0,-.072,.035,.07,.039,.049,'hair',head);if(spec.female){ell(0,.013,-.052,.087,.112,.056,'hair',head);ell(0,-.043,-.11,.046,.073,.045,'hair',head)}
 if(spec.glasses){for(const x of [-.032,.032]){const rim=new T.Mesh(new T.TorusGeometry(.024,.0035,6,14),mats.shoe);rim.position.set(x,.005,.091);head.add(rim)}limb(.003,.021,0,.005,.09,'shoe',head).rotation.z=Math.PI/2}
 for(const x of [-.045,.045]){const collar=ell(x,1.45,.102,.038,.058,.012,'shirt');collar.rotation.z=x<0?.35:-.35}for(let y=1.03;y<1.43;y+=.08)ell(0,y,.123,.008,.008,.004,'button');
 if(spec.vest)for(const x of [-.155,.155])ell(x,1.21,.056,.065,.25,.089,'vest');else ell(-.11,1.29,.113,.045,.05,.008,'shirt');
 const legs=[],arms=[];for(const side of [-1,1]){const leg=new T.Group();leg.position.set(side*.093,.92,0);g.add(leg);limb(.076,.29,0,-.2,0,'pants',leg);const knee=new T.Group();knee.position.y=-.43;leg.add(knee);limb(.06,.28,0,-.19,0,'pants',knee);ell(0,-.395,.044,.067,.044,.124,'shoe',knee);leg.userData.knee=knee;legs.push(leg);
 const arm=new T.Group();arm.position.set(side*.235*spec.build,1.4,0);g.add(arm);limb(.061,.2,0,-.12,0,'shirt',arm);const elbow=new T.Group();elbow.position.y=-.27;arm.add(elbow);limb(.046,.2,0,-.13,.008,'skin',elbow);ell(0,-.285,.014,.038,.044,.023,'skin',elbow);for(let finger=0;finger<4;finger++)limb(.0075,.036,(finger-1.5)*.017,-.334-(finger===0||finger===3?0:.009),.017,'skin',elbow);ell(side*.035,-.275,.028,.015,.033,.018,'skin',elbow);arm.userData.elbow=elbow;arms.push(arm)}
 g.scale.setScalar(spec.height/1.82);g.userData={...g.userData,legs,arms,head,baseShirt:spec.shirt,adult:true,headHeight:.24,totalHeight:spec.height};(world.adults??=new Set()).add(g);return g;
}
