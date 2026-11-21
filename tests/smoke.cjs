const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {createServer}=require('node:http');
const {readFileSync}=require('node:fs');
const {resolve}=require('node:path');
const html=readFileSync(resolve(__dirname,'../Brass_Wings_Homeward (5).html'));
(async()=>{
 const server=createServer((_req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html)});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:800,height:600}}), errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.requestAnimationFrame=()=>0});
 await page.goto('http://127.0.0.1:'+server.address().port);
 for(const which of ['free','combat']) for(const stage of [0,1,2]){
  await page.evaluate(stage=>{campaign.stage=stage;campaign.hangar=false;titleScreen()},stage);
  await page.locator('#'+which).click();
  const result=await page.evaluate(()=>{
   const check=(pass,label)=>{if(!pass)throw Error(mode+'/'+campaign.stage+' '+label+' '+JSON.stringify({x,z,alt,deckMode,live,t,crash:crash?.cause}))};
   const throttle=value=>{$('thrust').value=value;$('thrust').dispatchEvent(new Event('input'))};
   const pos=[x,z,alt];const initialGround=ground(x,z);
   check(live&&deckMode==='moored'&&power===0&&airspeed===0&&$('thrust').value==='0'&&t===0&&landingSite===base&&x===base.x&&Math.abs(z-base.z)<150&&alt>initialGround,'spawn');
   for(let i=0;i<10;i++)draw(.05);
   throttle(71);for(let i=0;i<20;i++)draw(.05);
   check(deckMode==='moored'&&t===0&&airspeed===0&&pos.every((v,i)=>v===[x,z,alt][i]),'wait at 0/71');
   $('pause').click();draw(.05);$('go').click();
   check(live&&deckMode==='moored'&&t===0&&$('fire').hidden,'pause/resume');
   throttle(72);draw(.05);check(deckMode==='launch'&&t===0&&airspeed===0,'threshold at 72');
   for(let i=0;i<60&&deckMode;i++){draw(.05);check(live&&!crash,'launch safety')}
   check(deckMode===''&&airspeed===105&&alt>40&&t>=2.2&&$('fire').hidden===(mode!=='combat'),'handoff');
   const released={x,z,alt,t};
   document.activeElement.blur();
   window.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowUp'}));window.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight'}));
   for(let i=0;i<20;i++)draw(.05);
   window.dispatchEvent(new KeyboardEvent('keyup',{key:'ArrowUp'}));window.dispatchEvent(new KeyboardEvent('keyup',{key:'ArrowRight'}));
   check(live&&!crash&&alt>released.alt&&x>released.x&&bank>0&&pitch>0,'normal controls');
   return {mode,stage:campaign.stage,spawn:pos,ground:initialGround,handoff:released};
  });console.log(JSON.stringify(result));
 }
 for(const [which,site] of [['combat','base+'],['combat','base-'],['combat','ship'],['free','base+'],['free','ship']]){
  await page.evaluate(which=>{campaign.stage=0;titleScreen();$(which).click()},which);
  const result=await page.evaluate(site=>{
   const port=site==='ship'?ship:base,dir=site==='base-'?-1:1;
   deckMode='';x=port.x;z=port.z-dir*110;alt=25;yaw=cameraYaw=dir===1?0:Math.PI;airspeed=88;power=.35;ammo=15;energy=40;
   draw(.05);if(deckMode!=='capture'||landingSite!==port||!live)throw Error(site+' capture failed');
   for(let i=0;i<100;i++)draw(.05);
   if(deckMode!=='moored'||airspeed!==0||(mode==='combat'&&(!supplying||energy<=40||ammo<=15))||(mode==='free'&&(energy!==40||ammo!==15)))throw Error(site+' supply failed');
   const waited=t;power=.72;draw(.05);
   if(t!==waited)throw Error(site+' wait counted');
   for(let i=0;i<60&&deckMode;i++)draw(.05);
   if(!live||crash||deckMode)throw Error(site+' relaunch failed '+crash?.cause);
   return {mode,site,energy,ammo};
  },site);
  console.log(JSON.stringify(result));
 }
 // Arrange only enemy positions, then exercise firing, damage, wave clearance and return.
 await page.evaluate(()=>{campaign={stage:0,funds:0,mag:0,wear:0,hangar:false};titleScreen()});
 for(let stage=0;stage<3;stage++){
  await page.locator(stage===0?'#combat':'#go').click();
  await page.evaluate(stage=>{
   if(campaign.stage!==stage||mode!=='combat'||!live)throw Error('Campaign stage did not start');
   const step=(n,fn)=>{for(let i=0;i<n;i++)fn(.05)};
   power=.8;step(50,draw);
   for(let wave=0;wave<2;wave++){
    x=zone.x;z=zone.z;alt=220;yaw=cameraYaw=bank=pitch=0;
    fight(.05);
    if(enemies.length!==3)throw Error('Expected three enemies in wave '+wave);
    for(const target of enemies){
     for(let shot=0;shot<2;shot++){
      for(const e of enemies){e.x=x+350;e.z=z+300;e.y=alt;e.heading=0;e.state='formation';e.age=0}
      target.x=x;target.z=z+12;locked=null;reload=0;trigger=true;
      fight(.05);
      if(target.hp!==1-shot)throw Error('Shot did not damage arranged target');
     }
    }
    trigger=false;step(16,fight);
    if(cleared!==wave+1)throw Error('Wave did not complete');
   }
   if(!returningHome||score!==1500)throw Error('Return or score missing');
   x=zone.x;z=zone.z;fight(.05);
   if(!approachReady)throw Error('Return waypoint did not advance');
   const port=goalPort();
   x=port.x;z=port.z-110;alt=25;power=.35;yaw=cameraYaw=0;
   step(75,draw);
   if(live||panel!==(stage===2?'finish':'hangar'))throw Error('Campaign did not advance after landing');
   const saved=JSON.parse(localStorage.getItem(saveKey));
   if(saved.stage!==(stage+1)%3||saved.hangar!==(stage!==2))throw Error('Campaign was not saved');
  },stage);
 }
 await page.locator('#go').click();
 assert(await page.evaluate(()=>campaign.stage===0&&live&&deckMode==='moored'&&airspeed===0));
 await page.evaluate(()=>{
  x=ship.x;z=ship.z;
  if(hitObject(x,z,13)!=='船体'||hitObject(x,z,15))throw Error('Carrier clearance');
  if(hitObject(x+16,z+14,20)!=='艦橋')throw Error('Carrier bridge collision');
 });
 await page.evaluate(()=>{
  titleScreen();$('free').click();deckMode='';airspeed=78;power=.5;
  const [townX,townZ]=operation().town;
  x=townX;z=townZ;alt=220;draw(.05);
  if(score!==250||found.size!==1)throw Error('Discovery result');
  draw(.05);
  if(score!==250)throw Error('Duplicate discovery reward');
  readGesture(1,0);readGesture(0,0);readGesture(1,0);
  if(trick!=='roll')throw Error('Roll gesture did not register');
  for(let i=0;i<40;i++)draw(.05);
  if(!live||trick)throw Error('Roll did not hand control back');
  x=base.x;z=base.z;alt=9;power=.8;draw(.05);
  for(let i=0;i<25;i++)draw(.05);
  if(panel!=='crash'||crash.cause!=='地面')throw Error('Ground collision did not end free flight');
 });
 assert.deepEqual(errors,[]);
 assert.equal(await page.locator('#route').count(),0);
 }finally{await browser?.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
