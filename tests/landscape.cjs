const { chromium } = require('playwright');
const { mkdirSync, readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const html = readFileSync(process.argv[2] || resolve(__dirname, '../Brass_Wings_Homeward (5).html'), 'utf8');
const output = resolve(process.argv[3] || '/tmp/brass-wings-landscape');
const views = [
 ['shore',0,200,-1620,60,-.25], ['plain',0,1600,1900,90,0],
 ['forest',0,1700,2540,46,-.45], ['ridge',0,800,2420,190,-.55],
 ['valley',1,-100,-100,85,0], ['town',0,240,1060,126,-.27],
 ['base',0,10,-1480,76,0], ['fort',2,120,-1160,130,Math.PI],
 ['approach',1,-350,1680,310,.16], ['pass',1,10,2440,210,.04], ['saddle',1,70,4520,145,-.27],
 ['mine',1,35,3060,254,.52], ['benches',1,25,3530,240,.98]
];
(async()=>{
 mkdirSync(output,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:800,height:450}});
  await page.evaluate(()=>{window.requestAnimationFrame=()=>0});
  await page.setContent(html);
  for(const [name,...view] of views){
   const sample=await page.evaluate(([stage,X,Z,H,A])=>{
    campaign.stage=stage;startFlight('free');
    live=false;deckMode='';x=X;z=Z;alt=H;yaw=cameraYaw=A;
    for(let i=0;i<4;i++)draw(0);
    const start=performance.now();
    for(let i=0;i<16;i++)draw(0);
    return {ms:(performance.now()-start)/16,trees:groves.length};
   },view);
   await page.screenshot({path:resolve(output,name+'.jpg'),quality:90});
   console.log(name,JSON.stringify(sample));
  }
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
