const fs=require('node:fs');
const {chromium}=require('playwright');

async function measure(browser,file){
 const page=await browser.newPage({viewport:{width:1000,height:640},offline:true});
 await page.evaluate(()=>{
  window.profileFrame=requestAnimationFrame.bind(window);
  requestAnimationFrame=()=>0;
  window.profileCounters={calls:0,bytes:0};
  const sizes=new WeakMap(),gl=WebGLRenderingContext.prototype;
  const draw=gl.drawArrays,upload=gl.bufferData,remove=gl.deleteBuffer;
  gl.drawArrays=function(...args){
   profileCounters.calls++;
   return draw.apply(this,args)
  };
  gl.bufferData=function(target,data,...args){
   if(target===this.ARRAY_BUFFER){
    const buffer=this.getParameter(this.ARRAY_BUFFER_BINDING),bytes=data.byteLength??data;
    profileCounters.bytes+=bytes-(sizes.get(buffer)||0);
    sizes.set(buffer,bytes)
   }
   return upload.call(this,target,data,...args)
  };
  gl.deleteBuffer=function(buffer){
   profileCounters.bytes-=sizes.get(buffer)||0;
   sizes.delete(buffer);
   return remove.call(this,buffer)
  }
 });
 const html=fs.readFileSync(file,'utf8'),start=performance.now();
 await page.setContent(html);
 const init=Math.round(performance.now()-start);
 const results=await page.evaluate(async()=>{
  titleScreen();startFlight('brass-port');live=false;deckMode='';
  const samples=[];
  for(const [wx,wz,altitude] of [[14000,33300,480],[65500,11800,130],[50000,50000,150]]){
   ({x,z}=worldToLocal(wx,wz));alt=altitude;yaw=cameraYaw=0;
   for(let i=0;i<12;i++){await new Promise(profileFrame);draw(0)}
   const start=await new Promise(profileFrame);
   profileCounters.calls=0;
   for(let i=0;i<50;i++){await new Promise(profileFrame);draw(0)}
   const stop=await new Promise(profileFrame);
   samples.push({
    fps:Math.round(51000/(stop-start)*10)/10,
    draws:profileCounters.calls/50,
    gpuMiB:+(profileCounters.bytes/1048576).toFixed(2)
   })
  }
  return samples
 });
 console.log(JSON.stringify({file,init,results}));
 await page.close()
}

(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
 try{for(const file of process.argv.slice(2))await measure(browser,file)}
 finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
