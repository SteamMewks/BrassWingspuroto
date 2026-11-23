const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:980,height:620}});
  await page.addInitScript(()=>{
   requestAnimationFrame=()=>0;
   window.triangleCount=0;
   const original=WebGLRenderingContext.prototype.drawArrays;
   WebGLRenderingContext.prototype.drawArrays=function(mode,start,count){
    if(mode===this.TRIANGLES)triangleCount+=count/3;
    return original.call(this,mode,start,count)
   }
  });
  await page.route('https://offline.test/game',r=>r.fulfill({path:require.resolve('../BrassWings-preview.html'),contentType:'text/html'}));
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('https://offline.test/game');
  const record=await page.evaluate(()=>{
   startFlight('free');deckMode='';live=false;
   ({x,z}=worldToLocal(50000,50000));alt=950;pitch=1;applyClimb(1);pitch=0;
   const ceiling=alt,contacts=[480,620,950].map(y=>skyContact(50000,y,50000));
   for(const s of wonders){
    ({x,z}=worldToLocal(s.x,s.z));
    alt=Math.min(s.maxY,Math.max(s.minY+5,ground(x,z)+25));
    discoverRelics()
   }
   const dates={...discoveries};discoverRelics();
   return {ceiling,contacts,stable:JSON.stringify(dates)===JSON.stringify(discoveries),
    found:wonders.filter(s=>discoveries[s.id]).length,peak:landElevation(71000,90000)}
  });
  assert.equal(record.ceiling,960);assert.deepEqual(record.contacts,[false,true,false]);assert.equal(record.found,10);assert.ok(record.stable&&record.peak>1000);
  await page.reload();await page.click('#journalOpen');await page.selectOption('#journalCategory',{index:1});
  assert.equal(await page.locator('#entries button:enabled').count(),10);
  await page.locator('#entries button').first().click();assert.match(await page.locator('#entryDetail').innerText(),/50000/);
  await page.click('#journalClose');
  const output=process.env.CLOUD_SCREENSHOTS;
  if(output)fs.mkdirSync(output,{recursive:true});
  await page.evaluate(()=>{startFlight('free');live=false;deckMode=''});
  for(const [name,height] of [['low',100],['middle',330],['cloud',525],['above',940]]){
   const stats=await page.evaluate(height=>{
    ({x,z}=worldToLocal(71900,49000));yaw=cameraYaw=Math.atan2(-1900,1000);alt=height;draw(0);
    triangleCount=0;draw(0);return {height,triangles:triangleCount,band:altitudeBand(height)}
   },height);
   if(output)await page.screenshot({path:path.join(output,name+'.png')});console.log(stats)
  }
  await page.evaluate(()=>{titleScreen();startFlight('free');deckMode='';live=false});
  for(const height of [100,950]){
   console.log('inland',await page.evaluate(height=>{
    ({x,z}=worldToLocal(22000,40000));yaw=cameraYaw=0;alt=height;draw(0);triangleCount=0;draw(0);
    return {height,triangles:triangleCount}
   },height))
  }
  for(const [width,height] of [[390,844],[844,390],[980,620]]){
   await page.setViewportSize({width,height});
   await page.evaluate(()=>{resize();({x,z}=worldToLocal(71000,86800));yaw=cameraYaw=0;alt=940;draw(0)});
   if(output)await page.screenshot({path:path.join(output,'peak-'+width+'.png')});
  }
  if(output)for(const id of ['crater','abyss']){
   await page.evaluate(id=>{
    const site=wonders.find(s=>s.id===id);
    ({x,z}=worldToLocal(site.x,site.z-site.rz*1.25));yaw=cameraYaw=0;alt=950;draw(0)
   },id);
   await page.screenshot({path:path.join(output,id+'.png')})
  }
  const cleared=await page.evaluate(()=>{
   for(const s of wonders){
    ({x,z}=worldToLocal(s.x,s.z));alt=s.minY+20;draw(0);alt=940;draw(0)
   }
   titleScreen();return surfaceRenderer?.areaStats()??null
  });
  if(cleared)assert.deepEqual(cleared,{count:0,bytes:0,railBytes:0});
  assert.deepEqual(errors,[]);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
