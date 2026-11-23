const { chromium } = require('playwright');
const fs = require('node:fs');
const { resolve } = require('node:path');

const html = fs.readFileSync(require.resolve('../BrassWings-preview.html'), 'utf8');
const output = resolve(process.env.CONTINENTAL_SCREENSHOTS || '/tmp/brass-continental');
const views = [
 ['large','south-foundry'], ['medium','coal-quay'], ['small','red-cape'],
 ['ocean','pelagic'], ['near','brass-port'], ['strait','red-strait']
];

(async () => {
 fs.mkdirSync(output, {recursive:true});
 const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
 try {
  const page = await browser.newPage({viewport:{width:960,height:540}});
  await page.evaluate(() => {window.requestAnimationFrame=()=>0});
  await page.setContent(html);
  for (const [key,id] of views) {
   await page.evaluate(({key,id}) => {
    titleScreen();startFlight(id);live=false;deckMode='';
    let dx=-185,dz=-205;alt=108;
    if(key==='near'||key==='strait'){dx=-350;dz=key==='near'?-380:480;alt=125}
    if(key==='ocean'){dx=-280;dz=-435;alt=80}
    x=base.x+dx;z=base.z+dz;alt+=base.deck?0:base.height-10;yaw=cameraYaw=Math.atan2(-dx,-dz)+.46;draw(0);
    const zone=seaZone(x+worldRegion().wx,z+worldRegion().wz);
    if(['near','strait','ocean'].includes(key)&&zone!==['near','strait','ocean'].indexOf(key))throw Error(key+' sea zone');
   }, {key,id});
   await page.screenshot({path:resolve(output,key+'.jpg'),quality:92});
  }
  const data=await page.evaluate(()=>({
   rails:railSurvey,sites:railSites.map(p=>({...localToWorld(p.x,p.z),name:p.name,kind:p.kind,line:p.line.index})),
   spurs:baseSpurs.map(p=>p.id),shipping:shippingSurvey,base:Object.values(airbases),ships:Object.values(carriers)
  }));
  fs.writeFileSync(resolve(output,'registry.json'),JSON.stringify(data));
  await page.close();

  const perf=[];
  for(const [layout,width,height] of [['縦',360,640],['横',640,360]]){
   const mobile=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:2});
   await mobile.evaluate(()=>{
    window.nativeFrame=requestAnimationFrame.bind(window);
    window.requestAnimationFrame=()=>0;
   });
   await mobile.setContent(html);
   for(const id of ['south-foundry','station','pelagic']){
    const result=await mobile.evaluate(async id=>{
     titleScreen();startFlight(id==='station'?'western-plain':id);
     deckMode='';alt=118;power=.45;airspeed=70;x=base.x-310;z=base.z-230;cameraYaw=yaw=.35;
     if(id==='station'){
      railClock=19;
      const train=railCars(railLines[0],0)[0];
      x=train.x-train.dx*320+train.dz*65;z=train.z-train.dz*320-train.dx*65;
      yaw=cameraYaw=Math.atan2(train.x-x,train.z-z);
     }
     alt+=Math.max(0,ground(x,z)-10);
     const frames=[],cpu=[];let previous;
     for(let j=0;j<81;j++){
      const stamp=await new Promise(nativeFrame),dt=previous?(stamp-previous)/1000:1/60;
      const start=performance.now();draw(Math.min(.05,dt));
      if(j>10){frames.push(dt);cpu.push(performance.now()-start)}
      previous=stamp;
     }
     if(!live||crash)throw Error('Flight interrupted at '+id);
     return {fps:Math.round(10*frames.length/frames.reduce((a,b)=>a+b,0))/10,
      p95:Math.round(10*cpu.sort((a,b)=>a-b)[Math.floor(.95*cpu.length)])/10};
    },id);
    perf.push({layout,width,height,id,...result});
    await mobile.screenshot({path:resolve(output,width+'-'+id+'.jpg'),quality:88});
   }
   await mobile.close();
  }
  fs.writeFileSync(resolve(output,'perf.json'),JSON.stringify(perf,null,2));
  console.log(perf);
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
