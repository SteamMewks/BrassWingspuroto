const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');

(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({offline:true});
  const errors=[],network=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',request=>{if(/^https?:/.test(request.url()))network.push(request.url())});
  await page.evaluate(()=>{
   requestAnimationFrame=()=>0;
   Object.defineProperty(window,'indexedDB',{get(){throw Error('IndexedDB unavailable')}});
  });
  await page.setContent(fs.readFileSync(require.resolve('../BrassWings-preview.html'),'utf8'));
  const result=await page.evaluate(()=>{
   const check=(ok,message)=>{if(!ok)throw Error(message)};
   const location=(wx,wz)=>{
    ({x,z}=worldToLocal(wx,wz));alt=ground(x,z)+130;draw(0)
   };
   const gpu=()=>surfaceRenderer.areaStats();
   const clean=()=>terrainAreas.size===0&&terrainAreaBytes===0&&gpu().count===0&&!gpu().railBytes&&tileCache.size===0;
   check(clean(),'Title must start without detailed terrain or scenery');
   check(surfaceRenderer.hasTrees(),'WebGL unavailable');
   $('operation-choice').value='sea';$('combat').click();
   check(mode==='combat'&&terrainAreas.size<Object.keys(terrainArchive).length/5,'Mission terrain is not local');
   const carrierAreaCount=terrainAreas.size;
   check(base.deck&&goalPort().id===base.id,'Carrier departure and return');
   titleScreen();$('combat').click();draw(0);
   const combatAreaCount=terrainAreas.size;
   check(combatAreaCount>0&&combatAreaCount<Object.keys(terrainArchive).length/5,'Land sortie terrain is not local');
   check(missionTerrainDistance(operation().airspace.wx,operation().airspace.wz)===0,'Mission center missing');
   for(const id of [operation().departure,operation().returnTo]){
    const b=outposts[id];
    check(missionTerrainDistance(b.wx,b.wz)===0,'Outpost missing from mission: '+id);
   }
   const world=operation();
   trial={...world,returnTo:'western-plain'};
   const destination=outposts[trial.returnTo];
   check(missionTerrainDistance((trial.airspace.wx+destination.wx)/2,(trial.airspace.wz+destination.wz)/2)<.001,'Distant outpost corridor missing');
   ({x,z}=worldToLocal(destination.wx,destination.wz));
   const approach=[x,z];limitAirspace();
   check(x===approach[0]&&z===approach[1],'Distant outpost clipped by the mission boundary');
   titleScreen();check(clean(),'Mission leaked data after switching to title');

   $('free-base').value='western-plain';startFlight('free');live=false;deckMode='';airspeed=150;
   const start=[22000,40000];
   location(...start);
   const key=Math.floor(start[0]/terrainAreaSize)+','+Math.floor(start[1]/terrainAreaSize);
   const height=ground(x,z),trees=JSON.stringify(groves),cpuBefore=terrainAreaBytes,gpuBefore=gpu().bytes;
   check(terrainAreas.has(key)&&gpuBefore>0,'Departure tiles missing');
   const pad=gradingSites['western-plain'];
   check(groves.every(t=>Math.abs(t.X+operation().wx-pad.x)>=pad.rx||Math.abs(t.Z+operation().wz-pad.z)>=pad.rz),'Tree on runway pad');
   check(groves.some(t=>t.planted==='airfield'),'Airfield perimeter missing planted trees');
   let plantedStations=0;
   for(const site of railSites.filter(s=>s.kind==='central')){
    location(site.x+operation().wx,site.z+operation().wz);
    check(groves.every(t=>Math.hypot(t.X-site.x,t.Z-site.z)>=180),'Tree in central station yard');
    if(groves.some(t=>t.planted==='station'&&Math.hypot(t.X-site.x,t.Z-site.z)<210))plantedStations++;
   }
   check(plantedStations>0,'Central stations missing perimeter trees');
   const [townX,townZ]=operation().town;
   location(townX+operation().wx,townZ+operation().wz);
   check(groves.some(t=>t.planted==='street'),'Town missing planted street trees');
   for(const t of groves.filter(t=>t.planted)){
    check(t.H<=11&&!nearRail(t.X,t.Z)&&!nearRiver(t.X+operation().wx,t.Z+operation().wz,8),'Planted tree obstructs a surveyed route');
   }

   // Sweep both sides of real grid edges with all detailed caches cold.
   const edge=2048*11,west=landElevation(edge-.02,start[1]),east=landElevation(edge+.02,start[1]);
   check(west!==null&&east!==null&&Math.abs(east-west)<.1,'Terrain seam');
   for(let i=0;i<20;i++){
    location(4096+i*4800,5500+(i%5)*19000);
    check(terrainAreaBytes<=terrainLimits.cpuBytes&&gpu().bytes<=terrainLimits.gpuBytes,'Area budget');
    check(tileCache.size<=25&&activeRiverCells.size<=64&&activeChannelTiles.size<=112,'Scenery budget');
   }
   check(!terrainAreas.has(key)&&terrainEvictions>0,'Departure area did not unload');
   location(...start);
   check(ground(x,z)===height&&JSON.stringify(groves)===trees,'Revisited terrain or forest changed');
   location(50000,50000);
   const cpuSea=terrainAreaBytes,gpuSea=gpu().bytes;
   check(cpuSea<cpuBefore&&gpuSea<gpuBefore,'Open-ocean transition retained local ground mesh');
   check(activeRiverCells.size===0&&activeChannelTiles.size===0,'Open-ocean transition retained river tiles');
   titleScreen();check(clean(),'Title retained the last free-flight areas');
   return {combatAreaCount,carrierAreaCount,archivedTiles:Object.keys(terrainArchive).length,terrainLoads,terrainEvictions,cpuBefore,gpuBefore,cpuSea,gpuSea}
  });
  assert.deepEqual(errors,[]);
  assert.deepEqual(network,[]);
  console.log(JSON.stringify(result));
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
