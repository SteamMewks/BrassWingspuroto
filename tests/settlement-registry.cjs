const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {assemble}=require('../scripts/build.js');

(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,offline:true});
  const html=assemble();
  await page.route('https://offline.test/game',route=>route.fulfill({body:html,contentType:'text/html'}));
  await page.addInitScript(()=>{requestAnimationFrame=()=>0});
  await page.goto('https://offline.test/game');
  const registry=await page.evaluate(()=>{
   const towns=Object.values(settlements).filter(isTown);
   const large=towns.filter(t=>t.tier==='large'),medium=towns.filter(t=>t.tier==='medium');
   const originalTowns='brass-city west-city casting-town smoke-city windmill mill-village copper-city red-city fortress-town charcoal smelter south-city kiln net-village'.split(' ');
   const original=[...originalTowns,...Object.keys(airbases),...Object.keys(carriers)];
   startFlight('home');
   for(const id of original)if(!campaignTargets.has(id)||affiliation(id)!=='pirate')throw Error('Original target '+id);
   for(const s of railSites)if(large.filter(t=>t.stationId===s.name).length!==1)throw Error('Station city '+s.name);
   for(const town of towns){
    if(!original.includes(town.id)&&(affiliation(town.id)!=='civilian'||!landingPorts.some(b=>b.id===town.id)))throw Error('Civilian landing '+town.id);
   }
   adventure.known=Object.keys(outposts).concat(Object.keys(scenicMarkets));
   navigationMenu(false,'windmill');
   const options=[...document.querySelectorAll('#actions optgroup option')].map(o=>o.value);
   for(const [id,site] of Object.entries(scenicMarkets)){
    if(outposts[id]||site.length||site.width||isTown(site)||selectable(id)||townDock(id)||toggleFavorite(id)||options.includes(id)||localBases.some(b=>b.id===id))throw Error('Scenery exposed '+id);
   }
   return [large.length,medium.length,Object.keys(scenicMarkets).length,Object.keys(outposts).length,campaignTargets.size,new Set(options).size]
  });
  assert.deepEqual(registry,[77,24,57,134,46,134]);
  await page.getByLabel('地点を選択').selectOption('station-西域貨物');
  assert.equal(await page.locator('#panel-title').innerText(),'西域貨物駅前市');
  const lot={item:'grain',price:11,qty:2,origin:'market-西域貨物',metres:12345};
  await page.evaluate(lot=>{
   const old=lot.origin;
   localStorage.setItem(saveKey,JSON.stringify({version:4,last:old,visited:['home','windmill',old],known:[old],seen:[old],
    liberated:['windmill',old],favorites:[old],money:789,fuel:4567,ammo:34,tutorial:'done',discoveries:{gear:'2000-01-01'},
    cargo:[lot],freight:{id:'old-contract',origin:'windmill',to:old,qty:1,item:'grain',reward:999,distance:20000,status:'active'}}))
  },lot);
  await page.reload();
  const snapshot=()=>page.evaluate(()=>({
   version:adventure.version,last:adventure.last,visited:adventure.visited,favorites:adventure.favorites,liberated:adventure.liberated,
   history:adventure.history,freight:adventure.freight,cargo:adventure.cargo,money:adventure.money,fuel:adventure.fuel,ammo:adventure.ammo,
   tutorial:adventure.tutorial,discovery:discoveries.gear,validDelivery:isTown(settlements[adventure.freight?.to])
  }));
  const migrated=await snapshot();
  assert.equal(migrated.version,5);
  assert.equal(migrated.last,'station-西域貨物');
  assert.ok(migrated.visited.includes(migrated.last)&&migrated.history.visited.includes(lot.origin)&&migrated.history.liberated.includes(lot.origin));
  assert.deepEqual(migrated.favorites,[migrated.last]);
  assert.deepEqual(migrated.liberated,['windmill']);
  assert.deepEqual(migrated.cargo,[lot]);
  assert.ok(migrated.validDelivery&&migrated.freight.to!==migrated.freight.origin);
  assert.equal(migrated.freight.id,'old-contract');
  assert.deepEqual([migrated.money,migrated.fuel,migrated.ammo,migrated.tutorial,migrated.discovery],[789,4567,34,'done','2000-01-01']);
  await page.evaluate(()=>saveAdventure());
  await page.reload();
  assert.deepEqual(await snapshot(),migrated);
  console.log('Settlement registry, regional selection and v4 save migration passed');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
