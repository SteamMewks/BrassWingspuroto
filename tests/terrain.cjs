const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
 try{
  const page=await browser.newPage();
  await page.setContent(fs.readFileSync(require.resolve('../BrassWings-preview.html'),'utf8'));
  for(let stage=0;stage<3;stage++){
   const result=await page.evaluate(stage=>{
    startFlight(landscapes[stage].departure);enterFlight();
    const m=worldRegion(),ctx=document.createElement('canvas').getContext('2d'),outline=new Path2D(worldOutline);
    let mismatches=0;
    for(let u=.31;u<1254;u+=11)for(let v=.78;v<1254;v+=13){
     const land=mainlandAt(u*atlasMetre-m.wx,(1254-v)*atlasMetre-m.wz);
     if(land!==ctx.isPointInPath(outline,u,v,'evenodd'))mismatches++
    }
    const sameRidge=ridgeFaces.filter(([,,tri])=>{
     const [X,Y,Z]=[0,1,2].map(k=>tri.reduce((sum,v)=>sum+v[k],0)/3);
     return Math.abs(ground(X,Z)-Y)<.15
    });
    if(ridgeFaces.length&&sameRidge.length/ridgeFaces.length<.98)throw Error('Authored ridge relief lost');
    if(stage===1){
     const walls=cliffs.filter(w=>w.passSide);
     if(walls.length!==2)throw Error('Missing mountain walls');
     for(const wall of walls)for(let row=0;row<passRows;row++){
      const a=wall[row],b=wall[row+1];
      for(let i=0;i<a.length-1;i++)for(const tri of [[a[i],a[i+1],b[i+1]],[a[i],b[i+1],b[i]]]){
       const [X,Y,Z]=[0,1,2].map(k=>tri.reduce((sum,v)=>sum+v[k],0)/3);
       const stationCut=railSites.some(s=>Math.hypot(X-s.x,Z-s.z)<360);
       if(!mainlandAt(X,Z)||Math.abs(ground(X,Z)-Y)>(stationCut?10:.15))throw Error('Pass face '+row+','+i);
      }
     }
     for(let Z=passStart;Z<=passStart+64*passRows;Z+=32){
      x=passAxis(Z);z=Z;updateWorld();
      if(ground(x,z)>90||hitObject(x,z,110))throw Error('Pass corridor obstructed');
     }
     // Steer the normal flight loop through the saddle with level pitch.
     deckMode='';power=.4;airspeed=100;alt=110;z=passStart;x=passAxis(z);
     yaw=cameraYaw=Math.atan2(passAxis(z+70)-x,70);
     for(let frame=0;frame<1000&&z<passStart+passRows*64;frame++){
      const heading=Math.atan2(passAxis(z+70)-x,70);
      ax=Math.max(-1,Math.min(1,(heading-yaw)*2.8));
      draw(.05);
      if(!live)throw Error('Flight through pass: '+crash?.cause);
     }
     ax=0;
     if(z<passStart+passRows*64||!found.has(passAxis(4992)+',4992'))throw Error('Saddle transit or discovery');
     for(const b of quarters.filter(b=>b.industry)){
      for(const side of [-1,1])for(const end of [-1,1])
       if(Math.abs(ground(b.x+side*b.w/2,b.z+end*b.l/2)-b.y)>1)throw Error('Mine foundation '+b.industry+' '+b.z);
     }
    }
    for(const island of shoreMeshes)for(const [X,,Z] of island.outer){
     const wx=Math.round((X+m.wx)*20)/20,wz=Math.round((Z+m.wz)*20)/20;
     if(!mainlandAt(X,Z)&&Math.abs(landElevation(wx,wz)??0)>.2)throw Error('Island shoreline '+[wx,wz]);
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
    const marker=$('atlas').querySelector('#atlas-position');
    if(Math.abs(Number(marker.getAttribute('cx'))-500)>.001)throw Error('Atlas position');
    return {mismatches,worldSize,runway:ground(base.x,base.z),water:m.carrier?ground(ship.x,ship.z):0}
   },stage);
   assert.deepEqual(result,{mismatches:0,worldSize:100000,runway:10,water:0});
  }
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
