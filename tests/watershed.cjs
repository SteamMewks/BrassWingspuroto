const {chromium}=require('playwright');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
 try{
  const page=await browser.newPage();
  await page.setContent(fs.readFileSync(require.resolve('../BrassWings-preview.html'),'utf8'));await page.evaluate(require('./helpers/adventure.cjs'),{liberated:'all',visited:'all',tutorial:'done'});
  const report=await page.evaluate(()=>{
   const check=(ok,message)=>{if(!ok)throw Error(message)};
   const {basins,reaches}=watersheds;
   let stable;
   for(let stage=0;stage<3;stage++){
    startFlight(landscapes[stage].departure);
    const m=worldRegion();
    const depths=reaches.map(r=>{const [x,z]=r.samples[0];return ground(x-m.wx,z-m.wz).toFixed(3)}).join();
    if(stage)check(stable===depths,'Mission-dependent riverbed');stable=depths;
    for(const b of localBases.filter(b=>!b.kind)){
     const pad=gradingSites[b.id];
     for(let i=-1;i<=1;i+=.25)for(let j=-1;j<=1;j+=.125){
      const x=b.x+i*(pad.rx-1),z=b.z+j*(pad.rz-1);
      check(Math.abs(ground(x,z)-pad.h)<.06,'Pad slope '+b.id);
      check(!nearRiver(x+m.wx,z+m.wz),'Channel inside '+b.id);
     }
    }
   }
   for(const r of reaches){
    const end=r.samples.at(-1);
    if(r.down>=0){
     const next=reaches[r.down];
     check(end.slice(0,3).every((n,i)=>Math.abs(n-next.samples[0][i])<.01),'Disconnected '+r.id);
     check(next.samples[0][3]>=end[3]-.01,'Confluence width '+r.id);
    }
    let node=r;const visited=new Set();
    while(node.down>=0){check(!visited.has(node.id),'River cycle');visited.add(node.id);node=reaches[node.down]}
    check(node.id===basins[r.basin].outlet,'Wrong outlet');
   }
   for(const s of surveyRiverSegments()){
    check(s.a[2]>=s.b[2],'Uphill '+s.reach.id);
    for(let i=0;i<=8;i++){
     const t=i/8,h=landElevation(s.a[0]+s.dx*t,s.a[1]+s.dz*t);
     check(h===null||h<s.a[2]+(s.b[2]-s.a[2])*t-.04,'Dry channel '+s.reach.id)
    }
   }
   for(const s of waterfalls)check(s.a[2]-s.b[2]>8&&s.len<35,'Missing waterfall drop');
   const moveCamera=(px,pz)=>{x=px;z=pz},viewportHeight=()=>h;
   return basins.map(b=>{
    const end=reaches[b.outlet].samples.at(-1),[x,z,h]=end;
    const shore=Math.min(...worldCoasts.map(r=>Math.min(...r.map((a,i)=>{
     const c=r[(i+1)%r.length],dx=c[0]-a[0],dz=c[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));
     return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz)
    }))));
    check(shore<.1&&h===0,'Estuary '+b.name);
    check(Array.from({length:16},(_,i)=>landElevation(x+5*Math.cos(i*Math.PI/8),z+5*Math.sin(i*Math.PI/8))).includes(null),'Sea beyond estuary');
    // Find the downstream edge of the rendered strip and compare it to the adjacent sea.
    const m=worldRegion();
    const out=reaches[b.outlet],prev=out.samples.at(-2);
    const dx=x-prev[0],dz=z-prev[1],len=Math.hypot(dx,dz);
    const boatX=x+dx/len*180,boatZ=z+dz/len*180;
    const view=worldToLocal(boatX,boatZ),sn=-dx/len,cs=-dz/len;
    moveCamera(view.x,view.z);
    const screenHeight=viewportHeight(),sky=screenHeight*.36,eye=60,focal=screenHeight*.62;
    let lip;
    drawChannels((points,color,order)=>{
     if(order!==4)return;
     const a=points[2],c=points[3];
     if(Math.hypot((a[0]+c[0])/2+m.wx-x,(a[2]+c[2])/2+m.wz-z)<.05)lip=color
    },sn,cs,eye,focal,sky);
    const band=Math.floor(10*(eye*focal/212/(screenHeight-sky))**(1/1.7));
    const target=waterPalette(boatX,boatZ)[Math.min(9,band)];
    check(lip&&lip.match(/\d+/g).every((v,i)=>Math.abs(v-target.match(/\d+/g)[i])<20),'Estuary colour '+b.name);
    return {basin:b.name,x,z,height:h,shoreError:shore}
   })
  });
  const prior=await page.evaluate(()=>{
   const {reaches,basins}=watersheds;
   const ids=new Set(waterfalls.map(s=>s.reach.fallId));
   if(ids.size!==waterfalls.length||ids.has(undefined))throw Error('Waterfall IDs');
   for(const [region,min] of [[0,7],[1,4],[2,4]]){
    const additions=basins.slice(9).filter(b=>b.region===region);
    if(additions.length<min||additions.some(b=>!(b.areaKm2>0)))throw Error('Secondary catchment distribution');
   }
   return JSON.stringify(reaches.slice(0,78).map(({fallId,...original})=>original))
  });
  const checksum=require('node:crypto').createHash('sha256').update(prior).digest('hex');
  if(checksum!=='9f3a2aa18700638b56896ff531e30ed11002a54c49127cdf1e131fbe5b80fedf')throw Error('Original nine catchments changed');
  console.log(JSON.stringify(report,null,2))
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
