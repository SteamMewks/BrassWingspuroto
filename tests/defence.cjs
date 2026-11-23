const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const seed=require('./helpers/adventure.cjs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const p=await browser.newPage();await p.addInitScript(()=>{requestAnimationFrame=()=>0});
  await p.route('**/*',r=>r.fulfill({path:path.resolve(__dirname,'../BrassWings-preview.html'),contentType:'text/html'}));
  await p.goto('https://offline.test/game');await p.evaluate(seed,{tutorial:'done',persist:true});
  const result=await p.evaluate(()=>{
   const check=(v,s)=>{if(!v)throw Error(s)};
   startFlight('home');enterFlight();deckMode='';
   const origin=localToWorld(x,z);
   for(let i=0;i<46;i++)fight(.05);
   check(!encounter&&!enemies.length&&affiliation('home')==='player','workshop sanctuary');
   const results=[];
   for(const target of [...localBases,...localShips].filter(s=>s.id!=='home')){
    x=target.x;z=target.z;alt=target.height+160;encounterDelay=0;fight(.05);
    check(encounter?.id===target.id&&enemies.length===3,'defenders '+target.id);
    check(!outsideBattle(target.wx+2500,target.wz-2500)&&outsideBattle(target.wx,target.wz+2500.1),'square boundary');
    x+=2501;const position=[x,z,alt];fight(.05);
    check(!encounter&&!enemies.length&&!bolts.length&&!hostile.length&&!locked&&!trigger&&affiliation(target.id)==='pirate','retreat');
    check(x===position[0]&&z===position[1]&&alt===position[2],'escape motion');
    x=target.x;fight(.1);fight(4.1);check(!encounter,'must re-enter');
    x+=1100;fight(.05);if(encounter)clearEncounter();x=target.x;fight(.05);
    check(encounter?.id===target.id,'retry');
    const money=adventure.money;
    for(let n=0;n<2;n++){for(const e of enemies)bolts.push({x:e.x,y:e.y,z:e.z,dx:0,dy:0,dz:0,life:1});fight(0)}
    check(!encounter&&adventure.money===money+60&&affiliation(target.id)==='friendly'&&landingPorts.includes(target)&&!selectable(target.id),'liberation '+target.id);
    check(!fastTravel(target.id),'unvisited flight shortcut');results.push(target.id)
   }
   return results
  });
  assert.equal(result.length,46);await p.reload();assert.equal(await p.evaluate(()=>adventure.liberated.length),46);
  console.log('46 target encounters, square boundaries, cooldown/re-entry, independent unlocks, persistence and cleanup passed')
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1})
