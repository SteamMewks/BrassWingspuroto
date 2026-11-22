const {chromium}=require('playwright'),fs=require('fs');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});try{
const p=await browser.newPage({viewport:{width:360,height:640},deviceScaleFactor:2,isMobile:true});
await p.evaluate(()=>{window.nativeFrame=requestAnimationFrame.bind(window);requestAnimationFrame=()=>0;window.statistics={};const add=(s,v)=>statistics[s]=(statistics[s]||0)+v;
for(const [obj,method,key] of [[CanvasRenderingContext2D.prototype,'drawImage','sprite'],[WebGLRenderingContext.prototype,'drawArrays','gpu'],[WebGLRenderingContext.prototype,'bufferData','upload']]){
 const orig=obj[method];obj[method]=function(...args){add(key,1);if(key==='gpu')add('triangles',args[2]/3);if(key==='upload')add('bytes',args[1]?.byteLength||0);return orig.apply(this,args)}
}});
await p.setContent(fs.readFileSync(process.argv[2]||require.resolve('../BrassWings-preview.html'),'utf8'));const c=await p.context().newCDPSession(p);await c.send('Profiler.enable');
await p.evaluate(()=>{titleScreen();$('free-base').value='western-plain';startFlight('free');railClock=19;const tr=railCars(railLines[0],0)[0];x=tr.x-tr.dx*320+tr.dz*65;z=tr.z-tr.dz*320-tr.dx*65;yaw=cameraYaw=Math.atan2(tr.x-x,tr.z-z);alt=108+ground(x,z);deckMode='';airspeed=70;power=.45;for(let k=0;k<5;k++)draw(.016);statistics={}});
await c.send('Profiler.start');const counts=await p.evaluate(async()=>{const gl=[...document.querySelectorAll('canvas')].map(e=>e.getContext('webgl')).find(ctx=>ctx&&ctx!==aircraftLayer?.getContext('webgl'));const ext=gl?.getExtension('EXT_disjoint_timer_query');let query,elapsed;
for(let k=0;k<90;k++){await new Promise(nativeFrame);if(ext&&k===8){query=ext.createQueryEXT();ext.beginQueryEXT(ext.TIME_ELAPSED_EXT,query)}draw(1/60);if(ext&&k===8)ext.endQueryEXT(ext.TIME_ELAPSED_EXT);if(query&&k>8&&ext.getQueryObjectEXT(query,ext.QUERY_RESULT_AVAILABLE_EXT)&&!gl.getParameter(ext.GPU_DISJOINT_EXT)){elapsed=ext.getQueryObjectEXT(query,ext.QUERY_RESULT_EXT)/1e6;ext.deleteQueryEXT(query);query=null}}
return {...Object.fromEntries(Object.entries(statistics).map(([k,v])=>[k,Math.round(v/90)])),gpuMs:elapsed??null}});
const {profile}=await c.send('Profiler.stop');const nodes=profile.nodes.filter(n=>n.hitCount).sort((a,b)=>b.hitCount-a.hitCount).slice(0,25).map(n=>[n.callFrame.functionName,n.hitCount]);const turn=await p.evaluate(async()=>{
 const startYaw=yaw,intervals=[],cpu=[];
 let previous=await new Promise(nativeFrame),maxUpload=0;
 for(let i=0;i<32;i++){
  const now=await new Promise(nativeFrame),start=performance.now(),bytes=statistics.bytes||0;
  yaw=cameraYaw=startYaw+(i+1)*Math.PI/32;draw(0);
  intervals.push(now-previous);cpu.push(performance.now()-start);
  maxUpload=Math.max(maxUpload,(statistics.bytes||0)-bytes);previous=now;
 }
 intervals.sort((a,b)=>a-b);
 return {p95Ms:intervals[30],worstMs:intervals.at(-1),maxCpuMs:Math.max(...cpu),maxUpload};
});
console.log(JSON.stringify({counts,nodes,turn},null,2));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
