const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--enable-precise-memory-info']});
 try{
  const page=await browser.newPage({viewport:{width:360,height:640}});
  await page.addInitScript(()=>{window.nextFrame=requestAnimationFrame.bind(window);requestAnimationFrame=()=>0});
  await page.route('https://offline.test/game',r=>r.fulfill({path:require('node:path').resolve(process.argv[2]||'BrassWings-preview.html'),contentType:'text/html'}));await page.goto('https://offline.test/game');
  await page.evaluate(require('./helpers/adventure.cjs'),{tutorial:'done',liberated:'all',visited:'all'});
  console.log(await page.evaluate(async()=>{
   startFlight('home');deckMode='';enterFlight();alt=300;power=.75;
   const step=async()=>{await new Promise(nextFrame);draw(1/60)};
   for(let i=0;i<15;i++)await step();
   const begin=performance.now();for(let i=0;i<90;i++)await step();
   return {fps:90000/(performance.now()-begin),heapMiB:performance.memory.usedJSHeapSize/1048576}
  }))
 }finally{await browser.close()}
})()
