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
    for(const [,,tri] of ridgeFaces){
     const [X,Y,Z]=[0,1,2].map(k=>tri.reduce((sum,v)=>sum+v[k],0)/3);
     if(Math.abs(ground(X,Z)-Y)>.001)throw Error('Ridge triangle height');
    }
    for(const island of shoreMeshes)for(let j=0;j<64;j++){
     const k=(j+1)%64;
     for(const tri of [[island.outer[j],island.outer[k],island.inner[k]],[island.outer[j],island.inner[k],island.inner[j]]]){
      const [X,Y,Z]=[0,1,2].map(k=>tri.reduce((sum,v)=>sum+v[k],0)/3);
      if(!mainlandAt(X,Z)&&Math.abs(ground(X,Z)-Y)>.001)throw Error('Shore triangle height');
     }
    }
    x=1500;z=2500;updateWorld();
    const snapshot=JSON.stringify(groves),tree=groves[0];
    if(!tree||hitObject(tree.X,tree.Z,tree.Y+tree.H*.5)!=='木')throw Error('Tree collision');
    x+=5000;updateWorld();x-=5000;updateWorld();
    if(JSON.stringify(groves)!==snapshot)throw Error('Forest regeneration');
    for(const b of quarters)if(hitObject(b.x,b.z,b.y+b.h-1)!=='建物')throw Error('Building collision');
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
