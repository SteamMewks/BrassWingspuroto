const assert=require('node:assert/strict');
const {createServer}=require('node:http');
const {mkdirSync,readFileSync}=require('node:fs');
const {resolve}=require('node:path');
const {chromium}=require('playwright');
const html=readFileSync(resolve(__dirname,'../Brass_Wings_Homeward (5).html'));
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
  const bases=await page.evaluate(()=>{
   const check=(valid,label)=>{if(!valid)throw Error(label)};
   check(Object.keys(airbases).length===24,'base count');
   for(let stage=0;stage<3;stage++){
    campaign.stage=stage;startFlight('free');
    for(const b of localBases){
     const {wx,wz}=localToWorld(b.x,b.z);
     check(Math.abs(wx-b.wx)<.001&&Math.abs(wz-b.wz)<.001&&wx>0&&wx<worldSize&&wz>0&&wz<worldSize,b.id+' coordinates');
     for(let dx=-b.width/2;dx<=b.width/2;dx+=6)for(let dz=-b.length/2;dz<=b.length/2;dz+=5)
      check(Math.abs(ground(b.x+dx,b.z+dz)-b.height)<.051,b.id+' runway '+stage);
     for(const building of baseFacilities(b).filter(obj=>obj.y===0)){
      for(const dx of [-1,1])for(const dz of [-1,1]){
       const X=b.x+building.x+dx*building.w/2,Z=b.z+building.z+dz*building.l/2;
       check(Math.abs(ground(X,Z)-b.height)<.051,b.id+' building footprint '+stage+' '+X+','+Z)
      }
      check(hitObject(b.x+building.x,b.z+building.z,b.height+2)==='基地施設',b.id+' building collision')
     }
    }
   }
   titleScreen();
   return Object.values(airbases).map(({id,wx,wz,height})=>({id,wx,wz,height}))
  });
  for(const b of bases){
   await page.locator('#free-base').selectOption(b.id);
   await page.locator('#free').click();
   await page.evaluate(()=>draw(0));
   await page.screenshot({path:resolve(output,'base-'+b.id+'.png')});
   await page.evaluate(b=>{
    const check=(valid,label)=>{if(!valid)throw Error(b.id+' '+label)};
    const spawn=localToWorld(x,z);
    check(mode==='free'&&base.id===b.id&&airspeed===0&&power===0&&deckMode==='moored','selected spawn');
    check(Math.abs(spawn.wx-b.wx)<.001&&Math.abs(spawn.wz-(b.wz-95))<.001&&alt===b.height+1.5,'spawn coordinates');
    power=.72;
    for(let i=0;i<50;i++)draw(.05);
    check(live&&!crash&&!deckMode&&alt>40,'takeoff');
    yaw=cameraYaw=Math.PI;x=base.x;z=base.z+110;alt=base.height+15;power=.35;
    for(let i=0;i<75;i++)draw(.05);
    check(deckMode==='moored'&&landingSite===base&&live&&!crash&&airspeed===0,'landing');
    deckMode='';alt=base.height-.5;
    check(impact(x,z,base.height+3)&&crash.cause==='地面','runway ground collision');
    titleScreen();
   },b);
  }
  console.log(JSON.stringify(bases));
  assert.deepEqual(errors,[]);

  for(const [layout,width,height] of [['portrait',360,640],['landscape',640,360],['compact',568,320],['desktop',1100,700]]){
   const mobile=layout!=='desktop';
   const view=await browser.newPage({viewport:{width,height},isMobile:mobile,hasTouch:mobile});
   view.on('pageerror',error=>errors.push(error.message));
   await view.addInitScript(()=>{window.requestAnimationFrame=()=>0});
   await view.goto(url);
   const press=selector=>mobile?view.locator(selector).tap():view.locator(selector).click();
   const shot=name=>view.screenshot({path:resolve(output,layout+'-'+name+'.png')});
   await view.evaluate(()=>{campaign={stage:1,funds:7,wear:20,mag:1,hangar:true};saveCampaign();titleScreen();draw(0)});
   const save=await view.evaluate(()=>localStorage.getItem(saveKey));
   for(const id of ['a','b']){
    await view.locator('#operation-choice').selectOption(id);
    assert.match(await view.locator('#atlas').innerText(),id==='a'?/黄銅港航空基地 味方・出撃・帰投/:/黄銅港航空基地 敵管理.*港北平原飛行場 味方・出撃.*東野飛行場 味方・帰投/);
    for(const selector of ['#combat','#free','#operation-choice','#free-base']){
     const box=await view.locator(selector).boundingBox(),card=await view.locator('article').boundingBox();
     assert(box.y>=card.y&&box.y+box.height<=card.y+card.height,layout+' '+id+' '+selector+' clipped');
    }
    if(id==='b')await shot('briefing');
    await press('#combat');
    await view.evaluate(id=>{
     const check=(valid,label)=>{if(!valid)throw Error(id+' '+label)};
     const port=localBases.find(b=>b.id==='brass-port');
     check(sortiePhase==='departure'&&deckMode==='moored'&&base.id===(id==='a'?'brass-port':'port-plain'),'departure');
     check(port.side===(id==='a'?'friendly':'enemy')&&landingPorts.includes(port)===(id==='a'),'base affiliation');
     check(goalPort().id===(id==='a'?'brass-port':'east-fields'),'return destination');
     const [centerX,centerZ]=id==='a'?[0,0]:[200,150];
     const center=airspaceCenter();
     check(Math.abs(center.x-centerX)<.001&&Math.abs(center.z-centerZ)<.001&&boundary===2500,'airspace');
     draw(0);
    },id);
    if(id==='b')await shot('departure');
    await view.evaluate(id=>{
     const check=(valid,label)=>{if(!valid)throw Error(id+' '+label)};
     const step=n=>{for(let i=0;i<n;i++)draw(.05)};
     power=.72;step(50);
     check(sortiePhase==='scenario'&&!deckMode&&live,'scenario after takeoff');
     x=zone.x;z=zone.z;alt=180;fight(.05);
     check(enemies.length===3,'patrol enemies');
     for(const enemy of enemies){enemy.hp=0;enemy.fall=1}
     fight(.05);
     check(sortiePhase==='return'&&live,'return after patrol');
     x=zone.x;z=zone.z;fight(.05);
     check(approachReady,'return waypoint');
     const landAt=port=>{
      x=port.x;z=port.z-110;alt=port.height+15;power=.35;yaw=cameraYaw=0;step(75);
     };
     if(id==='b'){
      landAt(base);
      check(live&&sortiePhase==='return'&&landingSite===base,'diversion leaves sortie active');
      power=.72;step(50);
     }
     landAt(goalPort());
     check(sortiePhase==='result'&&panel==='result'&&!live,'result after landing');
    },id);
    assert.equal(await view.evaluate(()=>localStorage.getItem(saveKey)),save);
    if(id==='b')await shot('result');
    await press('#menu');
   }
   await view.locator('#free-base').selectOption('copper-works');
   await press('#free');
   await view.evaluate(()=>{
    draw(0);
    const {left,top}=minimapBox();
    const pixel=Array.from(g.getImageData(left+2,top+2,1,1).data);
    if(pixel[3]<200||pixel[0]>70||base.id!=='copper-works')throw Error('World minimap or selected free base missing');
   });
   await shot('free-world-map');
   await view.close()
  }
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();server.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
