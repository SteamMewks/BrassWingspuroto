const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.request().url()==='https://offline.test/game'?r.fulfill({path:path.resolve(__dirname,'../BrassWings-preview.html'),contentType:'text/html'}):r.abort());
  await page.goto('https://offline.test/game');await page.getByText('冒険を始める・再開').click({timeout:3000});
  assert.deepEqual(errors,[]);
  for(const [width,height] of [[360,640],[640,360],[1100,700]]){
   await page.setViewportSize({width,height});await page.screenshot({path:'/tmp/brass-dock-'+width+'.png'});
   assert.ok(await page.getByText('離陸',{exact:true}).isVisible())
  }
  const result=await page.evaluate(()=>{
   const check=(v,s)=>{if(!v)throw Error(s)};
   check(base.id==='home','new home');
   for(const b of [...localBases,...localShips]){
    const p=b.deck?deckPoint(b,0,-95):{x:b.x,z:b.z-95};
    x=p.x;z=p.z;alt=b.height+12;yaw=b.heading||0;power=.25;deckMode='';live=true;
    for(let i=0;i<73;i++)deckAssist(.05);
    check(affiliation(b.id)==='pirate'?!deckMode:deckMode==='moored'&&landingSite.id===b.id,b.id)
   }
   const target=localShips.find(b=>affiliation(b.id)==='pirate');
   x=target.x;z=target.z;alt=160;deckMode='';live=true;fight(.05);check(enemies.length===3,'defenders');
   for(const e of enemies)e.hp=0;
   fight(.05);check(selectable(target.id)&&landingPorts.includes(target),'liberation');return target.id
  });
  await page.reload();assert.ok(await page.evaluate(id=>adventure.liberated.includes(id),result));assert.deepEqual(errors,[]);
  console.log('Landing, flags ownership eligibility, carrier liberation, persistence and three layouts checked')
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1})
