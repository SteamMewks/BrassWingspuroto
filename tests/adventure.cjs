const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.request().url()==='https://offline.test/game'?r.fulfill({path:path.resolve(__dirname,'../BrassWings-preview.html'),contentType:'text/html'}):r.abort());
  await page.goto('https://offline.test/game');await page.evaluate(require('./helpers/adventure.cjs'),{tutorial:'done',persist:true});await page.evaluate(()=>{titleScreen()});await page.getByText('続きから').click();
  assert.deepEqual(errors,[]);
  for(const [width,height] of [[360,640],[640,360],[1100,700]]){
   await page.setViewportSize({width,height});await page.screenshot({path:'/tmp/brass-dock-'+width+'.png'});
   assert.ok(await page.getByText('離陸',{exact:true}).isVisible())
  }
  const result=await page.evaluate(()=>{
   const check=(v,s)=>{if(!v)throw Error(s)};
   check(base.id==='home','new home');
   for(const b of [...localBases,...localShips]){
    if(b.kind){
     for(let u=-b.width/2;u<=b.width/2;u+=5)for(let v=-b.length/2;v<=b.length/2;v+=10){
      const X=b.x+u,Z=b.z+v;
      check(Math.abs(ground(X,Z)-b.height)<.09,'grade '+b.id+' '+[X,Z,ground(X,Z),b.height]);
      check(!nearRail(X,Z)&&!nearRiver(X+worldRegion().wx,Z+worldRegion().wz,5),'corridor '+b.id)
     }
    }
    {
     const original=surfaceRenderer.face;let flagFaces=0;
     surfaceRenderer.face=function(points,color){if(color===colors[affiliation(b.id)])flagFaces++;return original.call(this,points,color)};
     live=false;deckMode='';x=b.x;z=b.z-240;alt=b.height+30;yaw=cameraYaw=0;
     try{draw(0)}finally{surfaceRenderer.face=original}
     check(flagFaces>0,'flag '+b.id)
    }
    const p=b.deck?deckPoint(b,0,-95):{x:b.x,z:b.z-95};
    x=p.x;z=p.z;alt=b.height+12;yaw=b.heading||0;power=.25;deckMode='';live=true;
    for(let i=0;i<73;i++)deckAssist(.05);
    check(affiliation(b.id)==='pirate'?!deckMode:deckMode==='moored'&&landingSite.id===b.id,b.id);
    if(b.kind&&affiliation(b.id)!=='pirate'){
     updateWorld();
     check(!groves.some(t=>Math.abs(t.X-b.x)<b.width/2+t.R&&Math.abs(t.Z-b.z)<b.length/2+t.R),'trees '+b.id);
     check(!quarters.some(q=>Math.abs(q.x-b.x)<b.width/2+q.radius&&Math.abs(q.z-b.z)<b.length/2+q.radius),'town buildings '+b.id);
     [...$('actions').children].find(button=>button.textContent==='離陸').click();
     for(let i=0;i<48;i++)deckAssist(.05);
     check(!deckMode&&live&&!crash,'takeoff '+b.id)
    }
   }
   const forbidden=localBases.find(b=>affiliation(b.id)==='pirate');
   check(!selectable(forbidden.id)&&!selectable('nonexistent'),'hostile or unknown travel');
   enterFlight();deckMode='';const previous=adventure.last;travelMenu(false);
   check(panel==='flight'&&adventure.last===previous,'airborne travel');
   const successes=[];
   for(const id of [forbidden.id,localShips.find(b=>affiliation(b.id)==='pirate').id]){
    const target=[...localBases,...localShips].find(b=>b.id===id);
    x=target.x;z=target.z;alt=target.height+160;deckMode='';live=true;encounterDelay=0;fight(.05);check(enemies.length===3,'defenders');
    x+=3400;fight(0);check(!encounter&&affiliation(target.id)==='pirate','retreat');
    fight(4);x=target.x;fight(0);
    const moneyBefore=adventure.money,killsBefore=adventure.kills;
    for(let hit=0;hit<2;hit++){
     for(const e of enemies)bolts.push({x:e.x,y:e.y,z:e.z,dx:0,dy:0,dz:0,life:1});
     fight(0)
    }
    fight(.05);
    check(adventure.kills===killsBefore+3&&adventure.money===moneyBefore+60,'single reward');
    check(!selectable(target.id)&&landingPorts.includes(target)&&target.side==='friendly','liberation');
    const approach=target.deck?deckPoint(target,0,-95):{x:target.x,z:target.z-95};x=approach.x;z=approach.z;alt=target.height+12;yaw=target.heading||0;power=.25;for(let i=0;i<73;i++)deckAssist(.05);check(selectable(target.id),'first landing');services();check(panel==='service','liberated service');successes.push(target.id)
   }
   return successes
  });
  await page.reload();assert.ok(await page.evaluate(ids=>ids.every(id=>adventure.liberated.includes(id)),result));
  await page.evaluate(()=>{const raw=JSON.parse(localStorage.getItem(saveKey));raw.last='reefs-missing';raw.liberated.push('home');localStorage.setItem(saveKey,JSON.stringify(raw))});
  await page.reload();await page.getByText('続きから').click();
  assert.ok(await page.evaluate(()=>landingSite.id==='home'&&affiliation('home')==='player'&&!adventure.liberated.includes('home')));
  assert.deepEqual(errors,[]);
  console.log('Runways, flag meshes, blocked landing, retreat, liberation, persistence and home fallback passed')

 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1})
