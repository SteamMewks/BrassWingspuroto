const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {chromium}=require('playwright');
const seed=require('./helpers/adventure.cjs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true,offline:true});
  const errors=[];page.on('pageerror',err=>errors.push(err.message));
  await page.addInitScript(()=>{requestAnimationFrame=()=>0});
  await page.route('https://offline.test/game',r=>r.fulfill({path:path.resolve(__dirname,'../BrassWings-preview.html'),contentType:'text/html'}));
  await page.goto('https://offline.test/game');
  const tap=name=>page.getByRole('button',{name,exact:true}).tap();
  const shoot=async name=>{if(process.env.SUPPLY_SHOTS){fs.mkdirSync(process.env.SUPPLY_SHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.SUPPLY_SHOTS,name+'.png')})}};
  await page.evaluate(()=>{
   const v=initialAdventure();v.version=2;v.money=20;
   const lot={item:'fuel',origin:'windmill',price:44,qty:6,metres:997};
   v.cargo=[{...lot,qty:5}];v.warehouse=[lot];v.mag=2;delete v.ammo;delete v.fuel;
   localStorage.setItem(saveKey,JSON.stringify(v))
  });
  for(let n=0;n<2;n++){
   await page.reload();
   assert.deepEqual(await page.evaluate(()=>[cargoUsed(),adventure.money,adventure.cargo[1].metres,adventure.ammo,adventure.fuel,'warehouse' in JSON.parse(localStorage.getItem(saveKey))]),[8,152,997,130,20000,false])
  }
  await page.evaluate(seed,{liberated:'all',visited:'all',tutorial:'done',money:300});
  await page.evaluate(()=>{
   const check=(v,msg)=>{if(!v)throw Error(msg)},near=(a,b)=>Math.abs(a-b)<1e-7;
   startFlight('home');const initial=adventure.fuel;
   updateFlight(.05);check(initial===adventure.fuel,'docked fuel');
   const item={item:'ammo',origin:'home',price:7,qty:1,metres:0};adventure.cargo=[item];
   enterFlight();deckMode='launch';power=.8;
   for(let i=0;i<48;i++)updateFlight(.05);
   check(item.metres>0&&near(initial-adventure.fuel,item.metres),'launch distance counted once');
   alt=450;deckMode='';x=base.x;z=base.z;yaw=.47;cameraYaw=yaw;bank=pitch=ax=ay=0;airspeed=108;
   const oldYaw=yaw,oldAlt=alt,oldFuel=adventure.fuel;
   function double(u,v){readGesture(u,v);readGesture(0,0);readGesture(u,v)}
   resetGesture();double(0,-1);check(trick==='loop','double up');
   for(let i=0;i<45;i++)updateFlight(.05);
   check(Math.abs(Math.abs(aircraftRoll())-Math.PI)<.001&&Math.abs(aircraftPitch())<.001&&alt>oldAlt+70,'inverted after half loop');
   for(let i=0;i<12;i++)updateFlight(.05);
   check(Math.abs(aircraftRoll())>1&&Math.abs(aircraftRoll())<2,'half roll');
   for(let i=0;i<14;i++)updateFlight(.05);
   check(!trick&&Math.abs(Math.abs(angleDelta(yaw-oldYaw))-Math.PI)<1e-5&&Math.abs(airspeed-108)<4,'reverse heading and speed');
   const x0=x,z0=z;updateFlight(.05);check((x-x0)*Math.sin(oldYaw)+(z-z0)*Math.cos(oldYaw)<0,'reversed ground track');
   check(oldFuel-adventure.fuel>330&&near(initial-adventure.fuel,item.metres),'maneuver fuel distance');
   for(const sign of [-1,1]){resetGesture();double(sign,0);check(trick==='roll'&&hand===sign,'aileron roll');for(let i=0;i<34;i++)updateFlight(.05)}
   adventure.fuel=0;alt=400;power=1;ay=-1;
   for(let i=0;i<40;i++)updateFlight(.05);check(alt<390&&airspeed<65&&live,'controlled unpowered descent');
   const storedAmmo=adventure.ammo=12;down('地面');check(adventure.fuel===initial&&adventure.ammo===storedAmmo&&adventure.cargo.length===1,'crash recovery');
   startFlight('home');adventure.fuel=2300;adventure.ammo=2;saveAdventure()
  });
  await page.reload();await tap('続きから');assert.deepEqual(await page.evaluate(()=>[adventure.fuel,adventure.ammo]),[2300,2]);
  await page.evaluate(()=>{
   const check=(v,msg)=>{if(!v)throw Error(msg)};
   for(const id of ['home',Object.keys(carriers)[0],Object.keys(airbases)[0]]){
    startFlight(id);adventure.money=10;adventure.fuel=100;adventure.ammo=1;supplyMenu();
    check(buySupply('fuel',10000)&&adventure.money===0&&adventure.fuel===5100,'affordable fuel '+id);
    check(!buySupply('ammo',30),'insufficient funds');
    adventure.money=6;check(buySupply('ammo',30)&&adventure.ammo===31&&adventure.money===1,'ammo price');
    adventure.ammo=ammoCapacity()-1;buySupply('ammo',30);check(adventure.ammo===ammoCapacity()&&adventure.money===0,'partial magazine');
    adventure.fuel=adventure.fuelMax-43;adventure.money=1;buySupply('fuel',5000);check(adventure.fuel===adventure.fuelMax&&adventure.money===0,'partial tank')
   }
   startFlight('windmill');supplyMenu();adventure.fuel=350;adventure.money=200;check(buySupply('fuel',5000)&&adventure.money===185&&adventure.fuel===5350,'town fuel price');
   for(const port of Object.values(settlements).filter(isTown)){
    const b=nearestBase(port);check(Object.values(airbases).every(air=>portDistance(air,port)>=portDistance(b,port)),'nearest '+port.id)
   }
   const port=landingSite,b=nearestBase(port);
   adventure.liberated=adventure.liberated.filter(id=>id!==b.id);adventure.visited=adventure.visited.filter(id=>id!==b.id);
   tavern();check(knownPort(b.id)&&affiliation(b.id)==='pirate'&&!selectable(b.id)&&!toggleFavorite(b.id),'rumor only');
   const board=boardFor(port.id),offer=board.find(j=>j.qty>1)||board[0];
   const retained=board.filter(j=>j!==offer).map(j=>JSON.stringify(j));
   acceptFreight(offer);economy.loss=1;escapeLoss(()=>.9999);
   const rec=adventure.freightRecord;check(rec.status==='failed'&&rec.lost===1&&rec.returned===offer.qty-1&&adventure.lastLoss.includes('返却'),'lost and returned');
   check(retained.every(s=>boardFor(port.id).some(j=>JSON.stringify(j)===s)),'retain other jobs');
   adventure.cargo=['fuel','ammo'].map(item=>({item,qty:1,origin:port.id,price:7,metres:22}));
   adventure.ammo=ammoCapacity()-10;enterFlight();deckMode='';encounter=b;({x,z}=worldToLocal(b.wx,b.wz));alt=ground(x,z)+350;deploy();draw(0);pause()
  });
  const frozen=await page.evaluate(()=>[x,z,t,adventure.fuel,enemies.length]);
  await tap('積荷');await page.getByRole('button',{name:/予備燃料/}).tap();
  await page.getByRole('button',{name:/1個使用/}).tap();
  await page.getByRole('button',{name:/予備弾薬/}).tap();await page.getByRole('button',{name:/1個使用/}).tap();
  assert.deepEqual(await page.evaluate(()=>[x,z,t,20000,enemies.length,adventure.fuel,adventure.ammo,cargoUsed()]),[...frozen.slice(0,3),20000,frozen[4],20000,90,0]);
  await page.reload();assert.deepEqual(await page.evaluate(()=>[adventure.fuel,adventure.ammo,cargoUsed()]),[20000,90,0]);
  await page.evaluate(()=>{
   const check=(v,msg)=>{if(!v)throw Error(msg)};
   startFlight('windmill');adventure.money=10;adventure.ammo=17;adventure.fuel=3123;
   travelMenu();check(fastTravel('home')&&adventure.fuel===3123&&adventure.ammo===17,'no teleport refill');
   const funds=adventure.money;economy.loss=1;
   for(const item of ['fuel','ammo']){
    adventure.cargo=[{item,origin:'home',qty:2,price:7,metres:0}];
    escapeLoss(()=>0);check(adventure.cargo[0].qty===1&&adventure.money===funds,'reserve loss');
   }
   adventure.cargo=[];escapeLoss(()=>{throw Error('empty hold lottery')});
   const lot={item:'fuel',qty:2,origin:'home',price:42,metres:10};adventure.cargo=[lot];adventure.fuel=adventure.fuelMax;
   enterFlight();deckMode='';pause();cargoMenu(true);cargoDetail(lot,true);
   check($('actions').firstChild.disabled,'full tank');
   adventure.fuel=123;cargoDetail(lot,true);const use=$('actions').firstChild;use.click();use.click();
   check(lot.qty===1&&adventure.fuel===adventure.fuelMax,'consume exactly once');
   cargoDetail(lot,true);[...$('actions').children].find(b=>b.textContent==='破棄を確認').click();
   check(cargoUsed()===1,'discard confirmation');$('actions').firstChild.click();check(cargoUsed()===0,'discard');
  });
  for(const [width,height] of [[390,844],[568,320],[1100,700]]){
   await page.setViewportSize({width,height});await page.evaluate(()=>{startFlight('home');adventure.fuel=825;adventure.ammo=5;adventure.money=200;supplyMenu()});
   await shoot('supply-'+width);await tap('戻る');
   await page.evaluate(()=>{startFlight('windmill');tavern()});await shoot('tavern-'+width);await tap('戻る');await tap('依頼掲示板');await page.getByRole('button',{name:/行/}).first().tap();await shoot('offer-'+width);
   await tap('世界地図で位置を確認');await tap('戻る');assert.equal(await page.locator('#panel-title').textContent(),'輸送依頼の詳細');
   await page.evaluate(()=>{
    enterFlight();deckMode='';const b=localBases.find(s=>s.id==='west-city');encounter=b;x=b.x+2300;z=b.z;alt=350;deploy();syncFireButton();draw(0)
   });await shoot('radar-'+width);await page.evaluate(()=>{adventure.cargo=[{item:'fuel',qty:1,price:42,metres:991,origin:'windmill'}]});await page.locator('#pause').tap();await tap('積荷');await page.getByRole('button',{name:/予備燃料/}).tap();await shoot('cargo-'+width);await tap('戻る');await tap('戻る')
  }
  if(process.env.SUPPLY_SHOTS){
   await page.setViewportSize({width:568,height:320});
   await page.evaluate(()=>{
    startFlight('home');enterFlight();deckMode='';alt=400;airspeed=110;power=.6;
    readGesture(0,-1);readGesture(0,0);readGesture(0,-1)
   });
   for(const [stage,frames] of [['entry',0],['vertical',22],['inverted',23],['roll',12],['exit',14]]){
    await page.evaluate(n=>{for(let i=0;i<n;i++)updateFlight(.05);draw(0)},frames);await shoot('turn-'+stage)
   }
  }
  assert.deepEqual(errors,[]);console.log('Reversal, glide, flight distance, depot prices, reserve consumption, persistence, migration, taverns, freight and layouts passed')
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1})
