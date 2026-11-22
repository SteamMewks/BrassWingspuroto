const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const current=require.resolve('../BrassWings-preview.html');

(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'brass-journal-'));
 const launch=()=>chromium.launchPersistentContext(profile,{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox'],offline:true,viewport:{width:1000,height:640}});
 let browser=await launch();
 try{
  const output=process.env.MYSTERY_SCREENSHOTS;
  if(output)fs.mkdirSync(output,{recursive:true});
  let page;
  const errors=[];
  async function open(){
   page=await browser.newPage();
   page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>{
    requestAnimationFrame=()=>0;window.allocatedBuffers=new Set();
    const gl=WebGLRenderingContext.prototype,create=gl.createBuffer,remove=gl.deleteBuffer;
    gl.createBuffer=function(){const buffer=create.call(this);allocatedBuffers.add(buffer);return buffer};
    gl.deleteBuffer=function(buffer){allocatedBuffers.delete(buffer);return remove.call(this,buffer)}
   });
   await page.route('**/*',route=>{
    const url=route.request().url(),file=url==='https://offline.test/game'?current:url==='https://offline.test/original'?process.env.MYSTERY_BASELINE:null;
    if(!file){errors.push('Unexpected request '+url);return route.abort()}
    return route.fulfill({contentType:'text/html',body:fs.readFileSync(file)})
   });
   await page.goto('https://offline.test/game')
  }
  await open();
  const legacy={stage:1,funds:7,wear:13,mag:2,hangar:true};
  await page.evaluate(v=>localStorage.setItem(saveKey,JSON.stringify(v)),legacy);
  await page.reload();
  assert.deepEqual(await page.evaluate(()=>campaign),legacy);
  await page.click('#journalOpen');
  assert.equal(await page.locator('#entries button:disabled').count(),10);
  assert.equal(await page.locator('#entryDetail').innerText(),'');
  assert.equal(await page.locator('#entries button').first().innerText(),'？？？？？');
  await page.click('#journalClose');
  const sites=await page.evaluate(()=>relics.map(({id,x,z,name,radius})=>({id,x,z,name,radius})));
  assert.equal(sites.length,10);
  const terrain=await page.evaluate(()=>{
   const site=id=>relics.find(s=>s.id===id);
   const sample=(s,dx,dz)=>landElevation(s.x+dx,s.z+dz)??0;
   return {
    contact:relics.slice(0,8).every(s=>Math.abs(sample(s,0,0)-s.base)<.1),
    cliff:sample(site('gauge'),0,30)-sample(site('gauge'),0,-90),
    inlet:sample(site('dock'),0,230),
    sand:landElevation(52033+390*.814,81340+390*.581),
    shelf:landElevation(1794+230*.981,46890+230*.196)
   }
  });
  assert.ok(terrain.contact&&terrain.cliff>190&&terrain.inlet===0);
  assert.ok(terrain.sand>0&&terrain.sand<6&&terrain.shelf>15&&terrain.shelf<36);
  const baseline=process.env.MYSTERY_BASELINE;
  const capture=async(id)=>{if(output)await page.screenshot({path:path.join(output,id+'.png')})};
  for(const original of baseline?[true,false]:[false]){
   if(original)await page.goto('https://offline.test/original');
   else if(baseline)await page.goto('https://offline.test/game');
   await page.evaluate(()=>{titleScreen();startFlight('free');deckMode='';live=false});
   for(const site of sites){
    await page.evaluate(s=>{
     const distance=s.id==='gear'?4900:s.id==='clock'?1700:s.id==='spiral'?1550:s.id==='twins'?1350:s.id==='chain'?1850:s.id==='dock'?620:s.id==='walker'?520:950;
     const dx=s.id==='gear'?-.13:s.id==='gauge'?-.34:s.id==='walker'?.85:.28;
     ({x,z}=worldToLocal(s.x+distance*dx,s.z-distance));
     alt=(landElevation(s.x,s.z)??0)+(s.id==='gear'?670:s.id==='dock'?115:s.id==='gauge'?100:s.id==='walker'?94:180);
     yaw=cameraYaw=Math.atan2(-dx,1);draw(0)
    },site);
    await capture((original?'before-':'')+site.id);
   }
   for(const [id,wx,wz,nx,nz] of [['sand',52033,81340,.814,.581],['rock',1794,46890,.981,.196]]){
    await page.evaluate(([wx,wz,nx,nz])=>{
     ({x,z}=worldToLocal(wx-nx*340+nz*240,wz-nz*340-nx*240));alt=74;
     yaw=cameraYaw=Math.atan2(nx*340-nz*240,nz*340+nx*240);draw(0)
    },[wx,wz,nx,nz]);await capture((original?'before-':'')+id)
   }
  }
  assert.ok(await page.evaluate(()=>{
   const gear=relics[0],points=relicFaces(gear,true).flatMap(([pts])=>pts);
   const radius=Math.max(...points.map(([u,v])=>Math.hypot(u,v-80)));
   const depth=Math.max(...points.map(p=>Math.abs(p[2])));
   return Math.abs(radius-2000)<.1&&depth<=301&&points.every(p=>p[1]>=0)
  }));
  await page.evaluate(()=>{live=true;deckMode='';});
  for(const site of sites){
   const result=await page.evaluate(id=>{
    const s=relics.find(v=>v.id===id),part=buildRelic(s,true)[0],p=part.b;
    const Y=s.base+p[1];
    const collision=hitObject(s.x-operation().wx+p[0],s.z-operation().wz+p[2],Y);
    ({x,z}=worldToLocal(s.x+p[0],s.z+p[2]-part.r-36));alt=Y+24;
    draw(.001);const first=discoveries[id];message='revisit';discoverRelics();
    return {collision,first,stable:first===discoveries[id],message}
   },site.id);
   assert.equal(result.collision,site.name);
   assert.ok(result.first&&result.stable,site.id);
   assert.equal(result.message,'revisit');
  }
  await browser.close();browser=await launch();await open();
  assert.deepEqual(await page.evaluate(()=>campaign),legacy);
  for(const [name,width,height] of [['portrait',360,640],['landscape',640,360],['desktop',1000,640]]){
   await page.setViewportSize({width,height});await page.click('#journalOpen');
   assert.match(await page.locator('#progress').innerText(),/10 \/ 10/);
   for(const [i,s] of sites.entries()){await page.locator('#entries button').nth(i).click();assert.ok((await page.locator('#entryDetail').innerText()).includes(String(s.x)))}
   await capture('journal-'+name);await page.click('#journalClose');
   await page.evaluate(()=>{startFlight('free');deckMode='';live=false;const s=relics[0];({x,z}=worldToLocal(s.x,s.z-3900));alt=s.base+520;yaw=cameraYaw=0;draw(0)});
   await capture('flight-'+name);await page.evaluate(()=>titleScreen());
  }
  const buffers=await page.evaluate(()=>{
   const baseline=allocatedBuffers.size;
   const counts=[];
   for(let i=0;i<2;i++){
    startFlight('free');live=false;deckMode='';
    for(const s of relics){({x,z}=worldToLocal(s.x,s.z-700));alt=s.base+120;yaw=cameraYaw=0;draw(0)}
    titleScreen();counts.push(allocatedBuffers.size)
   }
   return [baseline,...counts]
  });
  assert.equal(new Set(buffers).size,1,'GPU buffers returned to title baseline after each circuit');
  assert.deepEqual(errors,[]); console.log('10 landmarks, collisions, registration, revisits, legacy progress, reload, journal and three layouts passed.');
 }finally{await browser.close();fs.rmSync(profile,{recursive:true,force:true})}
})().catch(e=>{console.error(e);process.exitCode=1});
