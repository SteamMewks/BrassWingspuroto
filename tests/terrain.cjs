const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
 try{
  const page=await browser.newPage();
  await page.setContent(fs.readFileSync(require.resolve('../Brass_Wings_Homeward (5).html'),'utf8'));
  for(let stage=0;stage<3;stage++){
   const result=await page.evaluate(stage=>{
    campaign.stage=stage;startFlight('free');
    const m=operation(),ctx=document.createElement('canvas').getContext('2d'),outline=new Path2D(worldOutline);
    let mismatches=0;
    for(let u=.31;u<1254;u+=11)for(let v=.78;v<1254;v+=13){
     const land=mainlandAt(u*atlasMetre-m.wx,(1254-v)*atlasMetre-m.wz);
     if(land!==ctx.isPointInPath(outline,u,v,'evenodd'))mismatches++
    }
    if(localPeaks.length){
     const r=localPeaks[0],edge=a=>[Math.cos(a)*coast(a,r.phase)*r.r,Math.sin(a)*coast(a,r.phase)*r.r*.82];
     const a=edge(0),b=edge(tau/24);
     const height=ground(r.x+.25*(a[0]+b[0]),r.z+.25*(a[1]+b[1]));
     if(Math.abs(height-(10+.5*r.h))>.001)throw Error('Mountain face and surface height differ');
    }
    x=worldSize-m.wx+1;z=0;limitAirspace();
    if(Math.abs(x+m.wx-worldSize)>.001||returnHeading===null)throw Error('World boundary');
    pause();
    const marker=$('atlas').querySelector('circle');
    if(Math.abs(Number(marker.getAttribute('cx'))-500)>.001)throw Error('Atlas position');
    return {mismatches,worldSize,runway:ground(base.x,base.z),water:m.carrier?ground(ship.x,ship.z):0}
   },stage);
   assert.deepEqual(result,{mismatches:0,worldSize:100000,runway:10,water:0});
  }
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
