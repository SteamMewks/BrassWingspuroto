const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');
const seed=require('./helpers/adventure.cjs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.addInitScript(()=>{requestAnimationFrame=()=>0});
  await page.route('https://offline.test/game',r=>r.fulfill({path:path.resolve(__dirname,'../BrassWings-preview.html'),contentType:'text/html'}));
  await page.goto('https://offline.test/game');
  await page.evaluate(seed,{liberated:'all',visited:'all',last:'windmill',money:500,tutorial:'done'});
  await page.evaluate(()=>{startFlight('windmill');shop()});
  await page.getByRole('button',{name:/買う.*穀物/}).tap();
  const qty=page.getByLabel('購入数量'),confirm=page.locator('#actions button').first();
  for(const n of ['0','-1','1.5','9','999999999999']){
   await qty.fill(n);assert.equal(await confirm.isDisabled(),true)
  }
  await qty.fill('8');await confirm.tap();
  assert.deepEqual(await page.evaluate(()=>{
   const lot=adventure.cargo[0],price=buyPrice(merchandise.grain,landingSite);
   return [lot.qty,cargoUsed(),adventure.money===500-price*8,lot.origin,lot.metres,transportFloor(20000)]
  }),[8,8,true,'windmill',0,78]);
  const stats=await page.evaluate(()=>{
   const allTowns=Object.values(settlements).filter(isTown),stats={stations:railSites.length,towns:allTowns.length,tiles:0,lots:0,roads:0};
   for(const s of railSites)if(!allTowns.some(b=>b.stationId===s.name&&b.tier==='large'))throw Error('Missing station city '+s.name);
   const represented=new Set();
   for(const key of Object.keys(countrySurvey)){
    const [i,j]=key.split(',').map(Number),tile=loadCountryTile(i,j,countrySurvey[key]);stats.tiles++;
    for(const b of tile.lots){represented.add(b.stationId);stats.lots++}
    stats.roads+=tile.roads.length
   }
   for(const s of railSites)if(!represented.has(s.name))throw Error('Missing scenery '+s.name);
   for(const town of allTowns){
    const b=localBases.find(p=>p.id===town.id);
    for(const sign of [-1,1]){
     deckMode='';x=b.x;z=b.z-sign*(b.length/2-10);alt=b.height+12;yaw=sign>0?0:Math.PI;power=.2;live=true;
     if(!deckAssist(.05)||landingSite.id!==b.id||deckMode!=='capture')throw Error('Runway capture '+b.id);
    }
   }
   return stats
  });
  console.log(stats)
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
