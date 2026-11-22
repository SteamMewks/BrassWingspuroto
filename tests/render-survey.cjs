const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path');
const output=process.argv[2];fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
 try{
  for(const [layout,width,height] of [['portrait',360,640],['landscape',640,360],['desktop',1100,700]]){
   const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:layout==='desktop'?1:2,isMobile:layout!=='desktop'});
   await page.evaluate(()=>{window.surveyFrame=requestAnimationFrame.bind(window);requestAnimationFrame=()=>0});
   await page.setContent(fs.readFileSync(require.resolve('../BrassWings-preview.html'),'utf8'));
   await page.evaluate(()=>{
    window.timings={};window.wrap=(fn,key)=>function(...args){const start=performance.now();try{return fn.apply(this,args)}finally{timings[key]=(timings[key]||0)+performance.now()-start}};
    drawRail=wrap(drawRail,'rail');drawChannels=wrap(drawChannels,'water');drawScenery=wrap(drawScenery,'scenery');
    if(surfaceRenderer){for(const key of ['begin','end'])surfaceRenderer[key]=wrap(surfaceRenderer[key],key)}
   });
   const rows=[];
   const sites=process.argv[3]?JSON.parse(fs.readFileSync(process.argv[3],'utf8')):['ocean','freight','central','industry','ridge','fall','junction','bridge','estuary'];
   for(const site of sites){
    const id=typeof site==='string'?site:site.id;
    const row=await page.evaluate(async ({id,site})=>{
     titleScreen();$('free-base').value=id==='ocean'?'pelagic':'western-plain';startFlight('free');deckMode='';airspeed=70;power=.45;
     const m=operation();let cx=base.x,cz=base.z,facing=.35;
     if(id==='freight'){const p=railCars(railLines[0],0)[0];cx=p.x;cz=p.z;facing=Math.atan2(p.dx,p.dz)}
     if(id==='central'||id==='industry'){const p=id==='central'?railSites.find(p=>p.kind==='central'):railLots.find(p=>p.style==='works');cx=p.x;cz=p.z}
     if(id==='ridge'){cx=regionOrigins[1].wx-m.wx;cz=regionOrigins[1].wz-m.wz+3648}
     if(['fall','junction','estuary'].includes(id)){const r=id==='fall'?waterfalls[0].a:id==='junction'?watersheds.reaches.find(r=>r.rank>=3).samples[0]:watersheds.reaches[watersheds.basins[8].outlet].samples.at(-1);cx=r[0]-m.wx;cz=r[1]-m.wz}
     if(id==='bridge'){const l=railLines.find(l=>l.bridges.length),s=l.bridges[0],p=railSample(l,(s.start+s.end)/2);cx=p.x;cz=p.z}
     if(typeof site==='object'){cx=site.wx-m.wx;cz=site.wz-m.wz}
     x=cx-310*Math.sin(facing);z=cz-310*Math.cos(facing);yaw=cameraYaw=facing;alt=Math.max(ground(cx,cz),ground(x,z))+115;
     const dt=[],cpu=[];let prev;
     for(let i=0;i<48;i++){const stamp=await new Promise(window.surveyFrame);if(i===8)window.timings={};const start=performance.now();draw(1/60);if(i>=8){dt.push(stamp-prev);cpu.push(performance.now()-start)}prev=stamp}
     if(!live||crash)throw Error('Flight interrupted '+id);
     dt.sort((a,b)=>a-b);const round=v=>Math.round(v*10)/10;
     return {id,fps:round(40000/dt.reduce((a,b)=>a+b)),low:round(1000/dt.at(-1)),p95:round(dt[37]),cpu:round(cpu.reduce((a,b)=>a+b)/40),ms:Object.fromEntries(Object.entries(timings).map(([k,v])=>[k,round(v/40)])),heapMB:Math.round(performance.memory.usedJSHeapSize/1048576)}
    },{id,site});rows.push(row);if(layout==='landscape')await page.screenshot({path:path.join(output,id+'.jpg'),quality:88});
   }
   fs.writeFileSync(path.join(output,layout+'.json'),JSON.stringify(rows,null,2));await page.close()
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
