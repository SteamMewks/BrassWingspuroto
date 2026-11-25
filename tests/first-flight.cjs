const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');
const seed=require('./helpers/adventure.cjs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const p=await browser.newPage({offline:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{requestAnimationFrame=()=>0});
  await p.route('**/*',r=>r.request().url()==='https://offline.test/game'?r.fulfill({path:path.resolve(__dirname,'../BrassWings-preview.html'),contentType:'text/html'}):r.abort());
  const open=()=>p.goto('https://offline.test/game'),press=s=>p.getByRole('button',{name:s,exact:true}).click();
  await open();
  await p.evaluate(()=>{localStorage.setItem('other.game','keep');localStorage.setItem('brassWings.worldCampaign.v1',JSON.stringify({wear:40,mag:3,discoveries:{gear:'2000-01-01'}}));localStorage.setItem(saveKey,'{')});
  await open();assert.equal(await p.getByText('続きから').isDisabled(),true);
  await press('新規ゲーム');await press('キャンセル');assert.equal(await p.evaluate(()=>localStorage.getItem(saveKey)),'{');
  await press('新規ゲーム');await press('上書きして始める');
  assert.deepEqual(await p.evaluate(()=>[adventure.money,adventure.visited,adventure.liberated,adventure.job,adventure.mag,adventure.wear,discoveries,adventure.tutorial,Object.keys(outposts).filter(id=>affiliation(id)==='pirate').length]),[500,['home'],[],null,0,0,{},'home',await p.evaluate(()=>Object.keys(outposts).length-1)]);
  await press('黄銅港市を目的地にする');await press('手帳');await press('タイトルへ');await press('続きから');
  assert.equal(await p.evaluate(()=>waypointId),'brass-city');
  await p.evaluate(()=>{adventure.money=97;adventure.cargo=[{item:'ore',qty:2,price:5,origin:'home',metres:0}];discoveries.gear='2000-01-01';saveAdventure();titleScreen()});
  await press('新規ゲーム');await press('キャンセル');await press('記録を初期化');await press('キャンセル');
  assert.equal(await p.evaluate(()=>adventure.money),97);
  await p.evaluate(()=>{window.originalRemove=Storage.prototype.removeItem;Storage.prototype.removeItem=function(){throw Error('blocked')}});
  await press('記録を初期化');await press('記録を消去する');assert.match(await p.locator('#notice').innerText(),/失敗/);
  await p.evaluate(()=>{Storage.prototype.removeItem=window.originalRemove;titleScreen();window.originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw Error('full')}});
  await press('新規ゲーム');await press('上書きして始める');assert.match(await p.locator('#notice').innerText(),/保存できません/);assert.equal(await p.evaluate(()=>adventure.money),97);
  await p.evaluate(()=>{Storage.prototype.setItem=window.originalSet;titleScreen()});await press('記録を初期化');await press('記録を消去する');
  assert.deepEqual(await p.evaluate(()=>[localStorage.getItem(saveKey),localStorage.getItem('brassWings.worldCampaign.v1'),localStorage.getItem('other.game'),adventure.money,discoveries]),[null,null,'keep',500,{}]);
  await press('新規ゲーム');await press('黄銅港市を目的地にする');
  // Restore each interruption from storage, including the safe-spawn fallback.
  for(const stage of ['battle','liberated','landing','visit','done']){
   const freed=['liberated','landing','visit','done'].includes(stage);
   await p.evaluate(seed,{liberated:freed?['brass-city']:[],last:stage==='visit'?'brass-city':'home',money:123,wear:7,mag:2,tutorial:stage,discoveries:'all',persist:true});
   await open();await press('続きから');
   assert.deepEqual(await p.evaluate(()=>[adventure.money,adventure.wear,adventure.mag,Object.keys(discoveries).length,affiliation('brass-city'),enemies.length]),[123,7,2,20,freed?'friendly':'pirate',0]);
   assert.equal(await p.evaluate(()=>panel),['liberated','visit'].includes(stage)?'guide':'dock');
  }
  await p.evaluate(()=>{const v=JSON.parse(localStorage.getItem(saveKey));v.last='deleted';v.liberated.push('home','missing',null);v.visited.push({id:'invalid'});localStorage.setItem(saveKey,JSON.stringify(v))});
  await open();await press('続きから');assert.deepEqual(await p.evaluate(()=>[landingSite.id,adventure.liberated,adventure.visited]),['home',['brass-city'],['home']]);
  await p.evaluate(()=>titleScreen());await press('新規ゲーム');await press('上書きして始める');await press('黄銅港市を目的地にする');
  const towns=await p.evaluate(()=>Object.keys(settlements).filter(id=>id!=='home'));
  for(const id of towns){
   // For subsequent flights all other ports are safe, isolating the target's defence.
   if(id!=='brass-city'){
    const options=await p.evaluate(id=>{
     const ports=Object.values(outposts).filter(b=>b.id!==id),s=outposts[id];
     ports.sort((a,b)=>Math.hypot(a.wx-s.wx,a.wz-s.wz)-Math.hypot(b.wx-s.wx,b.wz-s.wz));
     return {liberated:ports.map(b=>b.id).filter(k=>k!=='home'),last:ports[0].id,tutorial:'done'}
    },id);
    await p.evaluate(seed,options);await p.evaluate(()=>startFlight(adventure.last))
   }
   const log=await p.evaluate(id=>{
    const site=outposts[id],first=id==='brass-city',snap=[];
    const check=(v,s)=>{if(!v)throw Error(id+' '+s+' '+JSON.stringify({pos:localToWorld(x,z),alt,deckMode,crash:crash?.cause,tutorial:adventure.tutorial,encounter:encounter?.id,panel}))};
    const click=label=>{const btn=[...document.querySelectorAll('#cover button')].find(b=>b.textContent===label);check(btn&&!btn.disabled,label);btn.click()};
    check(!landingPorts.some(b=>b.id===id)&&!selectable(id),'occupied');
    click('離陸');let fought=false;
    const clamp=n=>Math.max(-1,Math.min(1,n));
    function step(wx,wz,height,throttle){
     const pos=localToWorld(x,z),aim=Math.atan2(wx-pos.wx,wz-pos.wz);
     ax=clamp(angleDelta(aim-yaw)*2.7);ay=-clamp((height-alt)/25);power=throttle;updateFlight(.05);
     check(!crash,'flight collision');
     if(encounter){
      check(encounter.id===id,'unexpected defenders');
      if(panel==='guide'){snap.push(adventure.tutorial);click('戦闘を開始')}
      for(let volley=0;volley<2;volley++){for(const e of enemies)bolts.push({x:e.x,y:e.y,z:e.z,dx:0,dy:0,dz:0,life:1});fight(0)}
      if(panel==='guide'){snap.push(adventure.tutorial);click('着陸案内を確認')}
      check(!encounter&&affiliation(id)==='friendly'&&!selectable(id),'liberated before visit');fought=true
     }
    }
    // Fly a circuit with ordinary steering, throttle and climb inputs only.
    if(!first){
     for(let i=0;i<700&&alt<base.height+950;i++){
      const heading=yaw+.95,pos=localToWorld(x,z);
      step(pos.wx+180*Math.sin(heading),pos.wz+180*Math.cos(heading),base.height+1000,.22)
     }
    }
    const start=localToWorld(x,z),direction=start.wz>=site.wz?-1:1;
    function navigate(wx,wz,clearance,radius){
     for(let i=0;i<35000;i++){
      const pos=localToWorld(x,z),dx=wx-pos.wx,dz=wz-pos.wz,d=Math.hypot(dx,dz);if(d<radius)return;
      const ahead=worldToLocal(pos.wx+dx/d*400,pos.wz+dz/d*400);
      step(wx,wz,Math.max(site.height+clearance,ground(ahead.x,ahead.z)+clearance,ground(x,z)+clearance,first?0:Math.min(900,d*.34)+site.height),.75)
     }check(false,'navigation timeout')
    }
    navigate(site.wx,site.wz-direction*1700,240,90);
    for(let i=0;i<1000&&deckMode!=='moored';i++){
     const pos=localToWorld(x,z),along=(site.wz-pos.wz)*direction;
     step(site.wx,site.wz+direction*160,site.height+Math.max(12,Math.min(240,(along-130)*.15)),.28)
    }
    check(fought&&deckMode==='moored'&&landingSite.id===id&&selectable(id),'landing');
    if(panel==='guide')click('町に入る');
    check(panel==='dock','reception');click('依頼掲示板');check(panel==='jobs','jobs');
    click('戻る');click('離陸');for(let i=0;i<50;i++)updateFlight(.05);
    check(!deckMode&&live&&!crash,'takeoff');return {id,firstFlightStages:snap}
   },id);
   await open();assert.ok(await p.evaluate(id=>selectable(id)&&adventure.last===id&&adventure.tutorial==='done',id));console.log(JSON.stringify(log))
  }
  assert.deepEqual(errors,[])
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1})
