const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const seed=require('./helpers/adventure.cjs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,offline:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{requestAnimationFrame=()=>0});
  await page.route('https://offline.test/game',r=>r.fulfill({path:path.resolve(__dirname,'../BrassWings-preview.html'),contentType:'text/html'}));
  await page.goto('https://offline.test/game');
  const shot=async name=>{if(process.env.LOGISTICS_SHOTS){fs.mkdirSync(process.env.LOGISTICS_SHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.LOGISTICS_SHOTS,name+'.png')})}};
  await page.evaluate(()=>{
   const legacy={money:77,visited:['home','windmill'],liberated:['windmill'],last:'windmill',goods:4,stored:9,tutorial:'done',
    job:{kind:'delivery',origin:'windmill',to:'west-city'},mag:1,wear:3};
   localStorage.setItem(saveKey,JSON.stringify(legacy))
  });
  await page.reload();
  assert.deepEqual(await page.evaluate(()=>[cargoUsed(),adventure.version,adventure.freight.reward,adventure.mag,adventure.money,adventure.visited.length]),[8,3,30,1,107,2]);
  await page.evaluate(()=>{startFlight('windmill');navigationMenu(false)});
  assert.deepEqual(await page.locator('#actions option').allTextContents(),['西都鋳造廠','風車村','真鍮の翼工房']);
  await page.evaluate(()=>{
   const b=outposts.windmill,hidden=outposts['mill-village'];
   if(toggleFavorite(hidden.id))throw Error('unvisited registration');
   enterFlight();deckMode='';({x,z}=worldToLocal(b.wx-1000,b.wz-500));
   // Record instrument primitives at their local dial coordinates.
   const context=g,arcs=[],rects=[],positions=[],rotations=[];
   g=new Proxy(context,{get(ctx,key){
    if(key==='translate')return (a,b)=>{positions.push([a,b]);ctx.translate(a,b)};
    if(key==='rotate')return a=>{rotations.push(a);ctx.rotate(a)};
    if(key==='arc')return (...args)=>{arcs.push(args);ctx.arc(...args)};
    if(key==='strokeRect')return (...args)=>{rects.push(args);ctx.strokeRect(...args)};
    const value=ctx[key];return typeof value==='function'?value.bind(ctx):value
   },set(ctx,key,value){ctx[key]=value;return true}});
   try{
    const scale=(minimapBox().side/2-6)/4000;
    worldMinimap();if(!arcs.some(([a,b,r])=>a===1000*scale&&b===-500*scale&&r===2.5))throw Error('north-up radar');
    const count=arcs.length;adventure.visited=['home'];adventure.liberated=[];arcs.length=0;
    worldMinimap();if(arcs.length!==count-1)throw Error('hidden radar pin');
    revealPort('windmill');arcs.length=0;worldMinimap();if(arcs.length!==count)throw Error('revealed radar pin');
    encounter=b;rects.length=positions.length=rotations.length=0;
    enemies=[{hp:1,x:x+750,z:z+100,heading:.789},{hp:1,x:x+1501,z,heading:1.234}];
    battleMinimap();const radius=minimapBox().side/2-2;
    if(!positions.some(([a,b])=>Math.abs(a-radius/2)<1e-8&&Math.abs(b+radius/15)<1e-8)||!rotations.includes(.789)||rotations.includes(1.234))throw Error('3 km enemy range or heading');
    if(positions.at(-1).some(v=>v!==0))throw Error('ownship center');
    const edge=(minimapBox().side/2-2)*2500/1500;
    if(!rects.some(([a,b,w,h])=>Math.abs(a+.6*edge)<1e-6&&Math.abs(b+1.2*edge)<1e-6&&w===h&&Math.abs(w-2*edge)<1e-6))throw Error('square dial');
    clearEncounter()
   }finally{g=context}
  });
  await page.evaluate(seed,{last:'windmill',liberated:'all',visited:'all',money:500,tutorial:'done'});
  await page.evaluate(()=>{
   const check=(v,s)=>{if(!v)throw Error(s)};
   startFlight('windmill');
   const ids=Object.keys(outposts).filter(id=>id!=='home');
   for(const id of ids.slice(0,10)){startFlight(id);check(toggleFavorite(id),'register')}
   startFlight(ids[10]);
   check(!toggleFavorite(ids[10])&&!toggleFavorite('home'),'cap and home');
   toggleFavorite(ids[0]);check(toggleFavorite(ids[10]),'replacement');startFlight('windmill');
   for(const port of Object.values(settlements).filter(isTown)){
    const board=boardFor(port.id),eligible=Object.values(settlements).filter(b=>isTown(b)&&portDistance(port,b)>=10000&&portDistance(port,b)<=30000);
    check(board.length===Math.min(5,eligible.length),'eligible count');
    check(board.every(j=>eligible.includes(settlements[j.to])&&producer(merchandise[j.item],port)),'regional requests');
    check(board===boardFor(port.id),'stable board')
   }
   const item=merchandise.grain;buyItem(item);
   const lot=adventure.cargo[0],price=lot.price,port=landingSite;
   check(price===buyPrice(item,port)&&salePrice(lot,port)<price,'home spread');
   const dest=outposts['west-city'];check(salePrice(lot,dest)<=price,'teleport spread');
   const observed=[];for(const d of [0,8000,20000,35000,50000]){
    lot.metres=d;observed.push(salePrice(lot,dest))
   }
   check(observed[0]<observed[1]&&observed[1]<observed[2]&&observed[3]===observed[4],'distance cap');
   lot.metres=0;enterFlight();deckMode='';alt=300;power=.8;
   for(let i=0;i<90;i++){yaw=i*Math.PI/45;updateFlight(.05)}
   check(lot.metres>300,'actual circuit');
   const flown=lot.metres;startFlight('windmill');buyItem(item);
   check(adventure.cargo[1].metres===0&&lot.metres===flown,'distinct lots and resume');
   travelMenu();check(fastTravel('home')&&lot.metres===flown,'cargo travel');
   startFlight('windmill');const offer=boardFor('windmill')[0];
   adventure.cargo[0].qty=7;acceptFreight(offer);check(!adventure.freight,'capacity');
   adventure.cargo[0].qty=1;acceptFreight(offer);check(adventure.freight&&knownPort(offer.to),'accept');
   const old=adventure.money;panel='travel';check(!fastTravel('home')&&!endFreight('completed'),'travel and landing guards');
   economy.loss=0;escapeLoss(()=>0);check(adventure.freight&&cargoUsed()===2+offer.qty,'zero loss');
   economy.loss=1;escapeLoss(()=>0);check(adventure.freight&&cargoUsed()===1+offer.qty,'ordinary loss');
   const enemyPort=localBases.find(p=>p.id!==landingSite.id&&p.id!=='home');
   encounter=enemyPort;enterFlight();deckMode='';x=enemyPort.x+2501;z=enemyPort.z;
   const original=Math.random;let calls=0;
   try{Math.random=()=>{calls++;return .99};fight(0);fight(0)}finally{Math.random=original}
   check(calls===2&&!encounter&&!adventure.freight&&adventure.freightRecord.status==='failed'&&adventure.money===old,'one escape lottery');
   check(adventure.cargo.length===1&&!enemies.length&&!bolts.length&&!hostile.length,'combat cleanup');
   saveAdventure()
  });
  await page.reload();
  assert.deepEqual(await page.evaluate(()=>[adventure.favorites.length,adventure.freightRecord.status,adventure.freight,adventure.cargo.length]),[10,'failed',null,1]);
  await page.evaluate(()=>{
   startFlight('windmill');const offer=boardFor('windmill')[0];acceptFreight(offer);
   startFlight(offer.to);const money=adventure.money;
   if(!endFreight('completed')||endFreight('completed')||adventure.money!==money+offer.reward)throw Error('double payment');
   startFlight('windmill');acceptFreight(boardFor('windmill')[0]);endFreight('abandoned');
   if(adventure.freight||cargoUsed()!==1)throw Error('abandon');
   startFlight('windmill');dockMenu()
  });
  const click=name=>page.getByRole('button',{name,exact:true}).tap();
  for(const [width,height] of [[390,844],[568,320],[1100,700]]){
   await page.setViewportSize({width,height});
   assert.ok(await page.evaluate(()=>{const a=$('actions');return a.scrollHeight<=a.clientHeight&&[...document.querySelectorAll('#actions button,#tools button')].every(b=>{const r=b.getBoundingClientRect();return r.height>=44&&r.bottom<=innerHeight&&r.top>=0})}));
   await shot('dock-'+width);await click('世界地図');const at=await page.evaluate(()=>{
    const b=outposts['west-city'],svg=$('atlas').firstChild;
    const p=new DOMPoint(b.wx*500/worldSize,500-b.wz*500/worldSize).matrixTransform(svg.getScreenCTM());
    return [p.x,p.y]
   });
   await page.touchscreen.tap(...at);
   assert.equal(await page.locator('#panel-title').innerText(),'西都鋳造廠');await click('拡大');await shot('map-'+width);await click('戻る');
  }
  await page.setViewportSize({width:390,height:480});await click('ファストトラベル');
  const list=page.locator('#actions'),box=await list.boundingBox(),cdp=await page.context().newCDPSession(page);
  const point=y=>[{x:box.x+30,y,id:1}];
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:point(box.y+box.height-8)});
  for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:point(box.y+box.height-8-i*(box.height-20)/8)});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForFunction(()=>$('actions').scrollTop>0,null,{polling:25});
  await page.mouse.move(box.x+30,box.y+45);await page.mouse.wheel(0,2000);
  await page.waitForFunction(()=>{const a=$('actions');return a.scrollTop+a.clientHeight>=a.scrollHeight-1},null,{polling:25});
  assert.ok(await page.evaluate(()=>panel==='travel'&&!live&&deckMode==='moored'&&!ax&&!ay));await click('戻る');
  await page.evaluate(()=>{enterFlight();deckMode='';alt=300;draw(0);pause()});await click('世界地図');assert.ok(await page.locator('#atlas svg').isVisible());
  await page.evaluate(()=>{enterFlight();deckMode='';const b=localBases.find(s=>s.id==='west-city');encounter=b;x=b.x+300;z=b.z;deploy();draw(0)});
  await shot('combat');assert.deepEqual(errors,[]);console.log('Migration, map, favorites, freight, distance, loss, responsive layout and touch/wheel scrolling passed')
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
