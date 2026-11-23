const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:980,height:620}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  let html=require.resolve('../BrassWings-preview.html');
  await page.route('**/*',r=>r.request().url()==='https://offline.test/game'?r.fulfill({path:html,contentType:'text/html'}):r.abort());
  await page.addInitScript(()=>{
   window.nextFrame=requestAnimationFrame.bind(window);requestAnimationFrame=()=>0;
   window.calls=window.tris=0;
   const gl=WebGLRenderingContext.prototype,draw=gl.drawArrays;
   gl.drawArrays=function(mode,start,count){calls++;if(mode===this.TRIANGLES)tris+=count/3;return draw.call(this,mode,start,count)}
  });
  async function open(){await page.goto('https://offline.test/game');await page.evaluate(()=>{startFlight('free');deckMode='';live=false})}
  await open();
  const tests=await page.evaluate(()=>{
   const heights=[];
   for(let i=0;i<64;i++)for(let j=0;j<=20;j++)heights.push(skyVertex(i,j)[1]);
   const peak=Math.max(...heights);
   const dates=Object.fromEntries(journalSites.map((s,i)=>[s.id,new Date(1600000000000+i*1000).toISOString()]));
   localStorage.setItem(saveKey,JSON.stringify({...campaign,discoveries:dates}));
   const visits=[];
   for(let i=0;i<20;i++){
    ({x,z}=worldToLocal(27000,56000));yaw=cameraYaw=Math.atan2(23000,-6000);alt=100;draw(.1);
    const ground=surfaceRenderer.skyStats();
    if(!surfaceRenderer.areaStats().bytes)throw Error("Missing ground terrain before ascent");
    alt=700;draw(.1);const sky=surfaceRenderer.areaStats();
    if(!surfaceRenderer.skyStats().bytes||terrainAreas.size>4)throw Error("Sky residency");
    alt=580;draw(.1);const held=inSky;
    alt=520;draw(.1);visits.push([ground.bytes,sky.bytes,sky.railBytes,held,inSky,ruinDistrictCache.size])
   }
   // Instrument the actual ground submission and streaming entry points.
   const originalVisible=visibleTerrain,originalUpdate=updateWorld;
   let streams=0,submissions=0;
   updateWorld=(...args)=>{streams++;return originalUpdate(...args)};
   visibleTerrain=(...args)=>{submissions++;return originalVisible(...args)};
   ({x,z}=worldToLocal(49100,48100));alt=1820;
   let maximum=0;
   for(let i=0;i<40;i++){yaw=cameraYaw=i*.5;draw(.016);maximum=Math.max(maximum,surfaceRenderer.skyStats().bytes)}
   if(streams||submissions||!maximum||maximum>skyBudget)throw Error('Sky isolation or cache budget');
   updateWorld=originalUpdate;visibleTerrain=originalVisible;
   // Continuous fast descent samples the upper skin, then the underside from below.
   const rimX=59990,rimZ=50000,surface=skyLevels(rimX,rimZ);
   ({x,z}=worldToLocal(rimX,rimZ));alt=surface.top-8;
   if(!impact(x,z,surface.top+25))throw Error('Descent missed terrain');
   crash=null;alt=surface.bottom+7;
   if(!impact(x,z,surface.bottom-20))throw Error('Ascent missed underside');
   crash=null;alt=(surface.top+surface.bottom)/2;
   if(!impact(x+40,z,alt))throw Error('Flight missed cliff');
   crash=null;
   let summit;
   for(let i=0;i<64;i++)for(let j=0;j<=20;j++){const p=skyVertex(i,j);if(!summit||p[1]>summit[1])summit=p}
   ({x,z}=worldToLocal(summit[0]-240,summit[2]));alt=summit[1]+110;yaw=Math.PI/2;power=1;airspeed=132;
   for(let i=0;i<90;i++){const px=x,pz=z,py=alt;advance(.05);if(impact(px,pz,py))throw Error('Summit route blocked')}
   if(x+operation().wx<summit[0]+240)throw Error('Summit route too short');
   const contacts=[];
   for(const f of [.03,.35,.86,.999,1.01]){
    const X=50000+10000*f,Z=50000,l=skyLevels(X,Z);
    contacts.push(l?[skyContact(X,l.top+3,Z),skyContact(X,l.top-2,Z),skyContact(X,l.bottom+2,Z),skyContact(X,l.bottom-3,Z)]:null)
   }
   const positions=skyDistricts.map(d=>{
    const p=districtData(d).find(p=>p.shape!=='arch'&&p.shape!=='ring');
    return !!ruinContact(p.x,p.y+12,p.z)
   });
   ({x,z}=worldToLocal(50000,50000));alt=peak+140;pitch=1;applyClimb(1);const over=alt>peak+140&&!hitObject(x,z,alt);
   titleScreen();return {peak,low:Math.min(...heights),visits,contacts,positions,over,dates}
  });
  assert.ok(tests.over&&tests.peak<3000&&tests.positions.every(Boolean));assert.equal(tests.contacts.pop(),null);
  for(const entry of tests.contacts)assert.deepEqual(entry,[false,true,true,false]);
  for(const row of tests.visits)assert.deepEqual(row,[0,0,0,true,false,0]);
  console.log('Sky surface min/max (m)',tests.low,tests.peak);
  await open();assert.deepEqual(await page.evaluate(()=>discoveries),tests.dates);
  const output=process.env.SKY_SCREENSHOTS;if(output)fs.mkdirSync(output,{recursive:true});
  const shots=[['ocean',62000,49400,100,60000,50000],['cloud-entry',62000,49400,565,60000,50000],
   ['reveal',63300,49900,660,60000,50000],['underside',60800,49500,740,58800,50000],
   ['falls',60700,50500,1200,59800,50000],['mountains',48500,42600,2620,50000,52000]];
  const districts=await page.evaluate(()=>skyDistricts.map(([name,X,Z,kind])=>[kind,X,Z,skyLevels(X,Z).top]));
  for(const [kind,X,Z,h] of districts)if(!shots.some(s=>s[0]===kind))shots.push([kind,X+260,Z-(kind==='court'?1000:460),h+(kind==='court'?320:180),X+(kind==='court'?340:150),Z]);
  for(const [id,X,Z,Y,tx,tz] of shots){
   await page.evaluate(([X,Z,Y,tx,tz])=>{({x,z}=worldToLocal(X,Z));alt=Y;yaw=cameraYaw=Math.atan2(tx-X,tz-Z);for(let i=0;i<8;i++)draw(.1)},[X,Z,Y,tx,tz]);
   if(output)await page.screenshot({path:path.join(output,id+'.png')})
  }
  for(const [width,height] of [[390,844],[844,390]]){
   await page.setViewportSize({width,height});await page.evaluate(()=>{resize();draw(.016)});
   if(output)await page.screenshot({path:path.join(output,'garden-'+width+'.png')})
  }
  await page.setViewportSize({width:980,height:620});
  async function measure(label){
   for(const [scene,X,Z,Y] of [['ground',22000,40000,100],['sky',49200,47920,1800]]){
    const result=await page.evaluate(async([X,Z,Y])=>{
     resize();({x,z}=worldToLocal(X,Z));alt=Y;yaw=cameraYaw=0;
     for(let i=0;i<10;i++)draw(.1);
     calls=tris=0;const frames=32,start=await new Promise(nextFrame);
     let end=start;for(let i=0;i<frames;i++){draw(.016);end=await new Promise(nextFrame)}
     return {fps:+(frames*1000/(end-start)).toFixed(1),calls:calls/frames,triangles:tris/frames,cpuTerrain:terrainAreaBytes,...surfaceRenderer.areaStats(),skyGpu:surfaceRenderer.skyStats?.().bytes||0}
    },[X,Z,Y]);console.log(label,scene,JSON.stringify(result))
   }
  }
  await measure('current');if(process.env.SKY_BASELINE){html=process.env.SKY_BASELINE;await open();await measure('baseline')}
  assert.deepEqual(errors,[]);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
