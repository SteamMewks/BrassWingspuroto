const assert=require('node:assert/strict');
const {createServer}=require('node:http');
const {mkdirSync,readFileSync}=require('node:fs');
const {resolve}=require('node:path');
const {chromium}=require('playwright');
const html=readFileSync(resolve(__dirname,'../BrassWings-preview.html'));
const output=process.env.OPERATION_SCREENSHOTS||'/tmp/brass-operations';

(async()=>{
 mkdirSync(output,{recursive:true});
 const server=createServer((_,res)=>res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'}).end(html));
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
  const url='http://127.0.0.1:'+server.address().port;
  const page=await browser.newPage({viewport:{width:800,height:450}});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0});
  await page.goto(url);
  await page.evaluate(()=>{
   for(let region=0;region<3;region++){
    startFlight(landscapes[region].departure);
    for(const b of localBases){
     for(let u=-b.width/2;u<=b.width/2;u+=6)for(let v=-b.length/2;v<=b.length/2;v+=5)
      if(Math.abs(ground(b.x+u,b.z+v)-b.height)>.09)throw Error('Runway '+b.id);
     for(const obj of baseFacilities(b).filter(o=>!o.y))
      if(hitObject(b.x+obj.x,b.z+obj.z,b.height+2)!=='基地施設')throw Error('Building '+b.id+' '+JSON.stringify(obj)+' '+hitObject(b.x+obj.x,b.z+obj.z,b.height+2))
    }
   }
  });
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();server.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
