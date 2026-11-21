const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {createServer}=require('node:http');
const {mkdirSync,readFileSync}=require('node:fs');
const {resolve}=require('node:path');
const html=readFileSync(resolve(__dirname,'../Brass_Wings_Homeward (5).html'));
const output=resolve(process.env.FLIGHT_SCREENSHOTS||'/tmp/brass-wings-screenshots');
const layouts=[['portrait',360,640],['landscape',640,360],['desktop',1100,700],['compact-landscape',568,320]];

(async()=>{
 mkdirSync(output,{recursive:true});
 const server=createServer((_,res)=>res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'}).end(html));
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
  for(const [layout,width,height] of layouts){
   const touch=layout!=='desktop';
   const page=await browser.newPage({viewport:{width,height},hasTouch:touch,isMobile:touch});
   const errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.addInitScript(()=>{window.requestAnimationFrame=()=>0});
   const url='http://127.0.0.1:'+server.address().port;
   await page.route('**/*',route=>route.request().url().startsWith(url)?route.continue():route.abort());
   await page.goto(url);
   const shot=name=>page.screenshot({path:resolve(output,layout+'-'+name+'.png')});
   const press=selector=>touch?page.locator(selector).tap():page.locator(selector).click();
   const step=n=>page.evaluate(n=>{for(let i=0;i<n;i++)draw(.05)},n);
   await step(1);
   for(const menu of ['#combat','#free']){
    const box=await page.locator(menu).boundingBox(),card=await page.locator('.card article').boundingBox();
    assert(box.y>=card.y&&box.y+box.height<=card.y+card.height,layout+' title action clipped');
   }
   await shot('title');
   await press('#combat');await step(1);await shot('base');
   const thrust=await page.locator('#thrust').boundingBox();
   if(touch)await page.touchscreen.tap(thrust.x+thrust.width/2,thrust.y+10);
   else await page.mouse.click(thrust.x+thrust.width/2,thrust.y+10);
   assert(await page.evaluate(()=>power>=.72),layout+' throttle input');
   await step(25);assert(await page.evaluate(()=>deckMode==='launch'));await shot('launch');
   await step(25);
   assert(await page.evaluate(()=>live&&!deckMode&&alt>40));await shot('flight');
   const fireBox=await page.locator('#fire').boundingBox();
   const map=await page.evaluate(()=>({x:w-Math.min(108,Math.round(w*.24),Math.round(h*.26))-10,
    y:Math.max(63,h*.205),side:Math.min(108,Math.round(w*.24),Math.round(h*.26))}));
   assert(fireBox.x+fireBox.width<=map.x||fireBox.y>=map.y+map.side,layout+' fire overlaps map');
   if(touch){
    const cdp=await page.context().newCDPSession(page),stick=await page.locator('#pad').boundingBox();
    const left={x:stick.x+stick.width/2+28,y:stick.y+stick.height/2,id:1};
    const right={x:fireBox.x+fireBox.width/2,y:fireBox.y+fireBox.height/2,id:2};
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[left]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[left,right]});
    await step(3);
    assert(await page.evaluate(()=>ax>.2&&bank>0&&trigger&&ammo<90),'multitouch steering and firing');
    await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
    // CDP can acknowledge cancellation before Blink delivers both pointer events.
    await page.waitForFunction(()=>ax===0&&!trigger&&id===null,null,{polling:20,timeout:1500});
   }else{
    await page.keyboard.down('Space');await step(3);await page.keyboard.up('Space');
    assert(await page.evaluate(()=>ammo<90&&!keys.has('Space')),'keyboard firing');
   }
   await press('#pause');await shot('pause');
   assert(await page.evaluate(()=>!live&&document.querySelector('footer').inert));
   await press('#go');
   await page.evaluate(()=>{x=ship.x;z=ship.z-110;alt=25;power=.3;$('thrust').value=30;yaw=cameraYaw=0});
   await step(75);assert(await page.evaluate(()=>live&&deckMode==='moored'&&landingSite===ship&&$('meter').textContent.includes('甲板')));
   await shot('carrier');
   await page.evaluate(()=>{energy=0;power=.8;$('thrust').value=80});await step(85);
   assert(await page.evaluate(()=>panel==='crash'));await shot('end');
   await press('#go');await step(1);
   assert(await page.evaluate(()=>live&&deckMode==='moored'&&power===0));
   await press('#pause');await press('#menu');
   assert(await page.evaluate(()=>panel==='title'));
   assert.deepEqual(errors,[]);
   await page.close();
   console.log(layout+' passed');
  }
  const page=await browser.newPage({viewport:{width:900,height:650}});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:'+server.address().port);
  await page.locator('#free').click();
  const slider=page.locator('#thrust');
  for(let i=0;i<7;i++)await slider.press('PageUp');
  await slider.press('ArrowRight');
  assert(await page.evaluate(()=>power===.71&&t===0&&deckMode==='moored'));
  await slider.press('ArrowRight');
  await page.waitForFunction(()=>live&&power===.72&&!deckMode&&alt>40);
  await page.keyboard.down('ArrowUp');
  try{await page.waitForFunction(()=>pitch>.2)}finally{await page.keyboard.up('ArrowUp')}
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>panel==='pause');
  await page.locator('#go').click();
  await page.waitForFunction(()=>live&&panel==='flight');
  assert.deepEqual(errors,[]);
  console.log('Live animation loop passed');
 }finally{await browser?.close();server.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
