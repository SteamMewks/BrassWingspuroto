const {chromium}=require('playwright');
const fs=require('node:fs');

(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
 try{
  const page=await browser.newPage();
  await page.evaluate(()=>{
   requestAnimationFrame=()=>0;
   const sizes=new Map();window.surveyBuffers={uploads:0,bytes:0};
   const upload=WebGLRenderingContext.prototype.bufferData,remove=WebGLRenderingContext.prototype.deleteBuffer;
   WebGLRenderingContext.prototype.bufferData=function(target,data,usage){
    if(usage===this.STATIC_DRAW&&target===this.ARRAY_BUFFER){
     const id=this.getParameter(this.ARRAY_BUFFER_BINDING),bytes=data.byteLength??data;
     surveyBuffers.uploads++;surveyBuffers.bytes+=bytes-(sizes.get(id)||0);sizes.set(id,bytes)
    }
    return upload.apply(this,arguments)
   };
   WebGLRenderingContext.prototype.deleteBuffer=function(id){
    surveyBuffers.bytes-=sizes.get(id)||0;sizes.delete(id);return remove.apply(this,arguments)
   }
  });
  await page.setContent(fs.readFileSync(require.resolve('../BrassWings-preview.html'),'utf8'));
  console.log(await page.evaluate(()=>{
   if(!surfaceRenderer?.hasTrees())throw Error('WebGL foliage unavailable');
   const baseline=surveyBuffers.bytes;
   startFlight('brass-port');live=false;deckMode='';
   const visit=s=>{x=s.x-100;z=s.z-250;alt=ground(x,z)+120;draw(0)};
   visit(railSites[0]);
   const first=surveyBuffers.uploads;for(let i=0;i<5;i++)draw(0);
   if(first!==surveyBuffers.uploads)throw Error('Station mesh uploaded again');
   for(let i=0;i<railSites.length;i+=3){
    visit(railSites[i]);
    if(surveyBuffers.bytes>baseline+32*1024*1024)throw Error('Rail cache budget')
   }
   return {stations:railSites.length,residentMiB:Math.round((surveyBuffers.bytes-baseline)/1048576),staticUploads:surveyBuffers.uploads-first}
  }))
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
