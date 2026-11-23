const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path');
const output=process.argv[2];fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
 try{
  for(const [layout,width,height] of [['portrait',360,640],['landscape',640,360],['desktop',1100,700]]){
   const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:layout==='desktop'?1:2,isMobile:layout!=='desktop'});
   await page.evaluate(()=>{
    window.surveyFrame=requestAnimationFrame.bind(window);requestAnimationFrame=()=>0;
    const proto=WebGLRenderingContext.prototype,sizes=new WeakMap();
    window.glSurvey={draws:0,triangles:0,uploadBytes:0,staticBytes:0,textureBytes:0};
    const draw=proto.drawArrays,upload=proto.bufferData,dispose=proto.deleteBuffer,texture=proto.texImage2D;
    proto.drawArrays=function(mode,first,count){
     glSurvey.draws++;
     if(mode===this.TRIANGLES)glSurvey.triangles+=count/3;
     return draw.apply(this,arguments);
    };
    proto.bufferData=function(target,data,usage){
     const bytes=data?.byteLength??data??0;
     glSurvey.uploadBytes+=bytes;
     if(usage===this.STATIC_DRAW&&target===this.ARRAY_BUFFER){
      const buffer=this.getParameter(this.ARRAY_BUFFER_BINDING);
      if(buffer){glSurvey.staticBytes+=bytes-(sizes.get(buffer)||0);sizes.set(buffer,bytes)}
     }
     return upload.apply(this,arguments);
    };
    proto.deleteBuffer=function(buffer){
     glSurvey.staticBytes-=sizes.get(buffer)||0;sizes.delete(buffer);
     return dispose.apply(this,arguments);
    };
    proto.texImage2D=function(...args){
     const source=args[5];
     if(args.length===6&&source?.width)glSurvey.textureBytes+=source.width*source.height*4;
     return texture.apply(this,args);
    };
   });
   const html=fs.readFileSync(process.env.BRASS_HTML||require.resolve('../BrassWings-preview.html'),'utf8');
   const initialized=Date.now();
   await page.setContent(html);
   const startupMs=Date.now()-initialized;
   const {titleGpu,renderer}=await page.evaluate(()=>{
    const gl=[...document.querySelectorAll('canvas')].map(canvas=>canvas.getContext('webgl')).find(Boolean);
    const debug=gl?.getExtension('WEBGL_debug_renderer_info');
    return {titleGpu:glSurvey.staticBytes,renderer:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):null};
   });
   await page.evaluate(()=>{
    window.timings={};window.wrap=(fn,key)=>function(...args){const start=performance.now();try{return fn.apply(this,args)}finally{timings[key]=(timings[key]||0)+performance.now()-start}};
    drawRail=wrap(drawRail,'rail');drawChannels=wrap(drawChannels,'water');drawScenery=wrap(drawScenery,'scenery');
    if(surfaceRenderer){for(const key of ['begin','end'])surfaceRenderer[key]=wrap(surfaceRenderer[key],key)}
   });
   const rows=[];
   const sites=process.argv[3]?JSON.parse(fs.readFileSync(process.argv[3],'utf8')):['ocean','freight','central','industry','base','ridge','fall','junction','bridge','estuary'];
   for(const site of sites){
    const id=typeof site==='string'?site:site.id;
    const row=await page.evaluate(async ({id,site})=>{
     titleScreen();startFlight(id==='ocean'?'pelagic':'western-plain');deckMode='';airspeed=70;power=.45;
     const m=worldRegion();let cx=base.x,cz=base.z,facing=.35;
     if(id==='freight'){const p=railCars(railLines[0],0)[0];cx=p.x;cz=p.z;facing=Math.atan2(p.dx,p.dz)}
     if(id==='central'||id==='industry'){const p=id==='central'?railSites.find(p=>p.kind==='central'):railLots.find(p=>p.style==='works');cx=p.x;cz=p.z}
     if(id==='ridge'){cx=regionOrigins[1].wx-m.wx;cz=regionOrigins[1].wz-m.wz+3648}
     if(['fall','junction','estuary'].includes(id)){const r=id==='fall'?waterfalls[0].a:id==='junction'?watersheds.reaches.find(r=>r.rank>=3).samples[0]:watersheds.reaches[watersheds.basins[8].outlet].samples.at(-1);cx=r[0]-m.wx;cz=r[1]-m.wz}
     if(id==='bridge'){const l=railLines.find(l=>l.bridges.length),s=l.bridges[0],p=railSample(l,(s.start+s.end)/2);cx=p.x;cz=p.z}
     if(typeof site==='object'){cx=site.wx-m.wx;cz=site.wz-m.wz}
     x=cx-310*Math.sin(facing);z=cz-310*Math.cos(facing);yaw=cameraYaw=facing;alt=Math.max(ground(cx,cz),ground(x,z))+115;
     const dt=[],cpu=[];let prev;
     const startWork=performance.now();draw(0);
     const firstDrawMs=performance.now()-startWork;
     for(let i=0;i<48;i++){const stamp=await new Promise(window.surveyFrame);if(i===8){window.timings={};glSurvey.draws=glSurvey.triangles=glSurvey.uploadBytes=0}const start=performance.now();draw(1/60);if(i>=8){dt.push(stamp-prev);cpu.push(performance.now()-start)}prev=stamp}
     if(!live||crash)throw Error('Flight interrupted '+id);
     dt.sort((a,b)=>a-b);const round=v=>Math.round(v*10)/10;
     return {id,firstDrawMs:round(firstDrawMs),fps:round(40000/dt.reduce((a,b)=>a+b)),low:round(1000/dt.at(-1)),p95:round(dt[37]),cpu:round(cpu.reduce((a,b)=>a+b)/40),ms:Object.fromEntries(Object.entries(timings).map(([k,v])=>[k,round(v/40)])),heapMB:Math.round(performance.memory.usedJSHeapSize/1048576),draws:round(glSurvey.draws/40),triangles:round(glSurvey.triangles/40),uploadBytes:round(glSurvey.uploadBytes/40),staticBytes:glSurvey.staticBytes,textureBytes:glSurvey.textureBytes,trees:groves.length}
    },{id,site});rows.push({...row,startupMs,titleGpu,renderer});
    const image=await page.screenshot({path:path.join(output,layout+'-'+id+'.jpg'),quality:88});
    if(layout==='landscape')fs.writeFileSync(path.join(output,id+'.jpg'),image);
   }
   fs.writeFileSync(path.join(output,layout+'.json'),JSON.stringify(rows,null,2));await page.close()
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
