const {chromium}=require('playwright');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
 try{
  const page=await browser.newPage();
  await page.evaluate(()=>{window.requestAnimationFrame=()=>0});
  await page.setContent(fs.readFileSync(require.resolve('../BrassWings-preview.html'),'utf8'));
  console.log(await page.evaluate(()=>{
   const check=(condition,label)=>{if(!condition)throw Error(label)};
   const land=Object.values(airbases),ships=Object.values(carriers);
   check(Object.keys(outposts).length===32&&land.length===24&&ships.length===8,'Registry');
   for(const [tier,count] of [['large',4],['medium',8],['small',12]])check(land.filter(b=>b.tier===tier).length===count,tier);
   for(const [region,count] of [[0,12],[1,5],[2,5]])check(land.filter(b=>!b.island&&b.region===region).length===count,'Continent '+region);
   let wet=0,total=0;
   const water=(wx,wz)=>{const p=worldToLocal(wx,wz);return ground(p.x,p.z)===0};
   for(let X=30000;X<=70000;X+=400)for(let Z=30000;Z<=70000;Z+=400){
    const r=Math.hypot(X-50000,Z-50000);if(r>20000)continue;
    total++;if(water(X,Z))wet++;else check(r>17500,'Land in ocean core')
   }
   check(wet/total>.95,'Ocean area');
   const queue=[[50,50]],seen=new Set(['50,50']);let outlet=false;
   for(let i=0;i<queue.length&&!outlet;i++){const [x,z]=queue[i];for(const [dx,dz] of [[0,1],[0,-1],[-1,0],[1,0]]){
    const X=x+dx,Z=z+dz,key=X+','+Z;if(seen.has(key))continue;seen.add(key);
    if(!water(X*1000,Z*1000)||!water((X+x)*500,(Z+z)*500))continue;
    if(X===0||X===100||Z===0||Z===100){outlet=true;break}queue.push([X,Z])
   }}
   check(outlet,'Ocean outlet');
   for(const b of localBases)check(hitObject(b.x,b.z,b.height-.5)==='地面',b.id+' terrain collision');
   for(const def of ships){
    $('free-base').value=def.id;startFlight('free');
    const b=base;check(b.side==='neutral',b.id+' neutral affiliation');check(b.id===def.id&&deckAt(x,z)===b&&Math.abs(angleDelta(yaw-b.heading))<.001,b.id+' departure');
    for(const a of [-300,-120,0,120,300])for(const side of [-75,0,75]){
     const p=deckPoint(b,side,a);check(ground(p.x,p.z)===0,b.id+' sea clearance')
    }
    for(const line of shipping)for(let d=0;d<line.length;d+=35){const p=railSample(line,d),q=deckAxes(b,p.x,p.z);check(Math.abs(q.side)>40||Math.abs(q.along)>145,b.id+' shipping lane')}
    check(hitObject(b.x,b.z,12)==='船体',b.id+' hull');
    const bridge=deckPoint(b,16,14);check(hitObject(bridge.x,bridge.z,20)==='艦橋',b.id+' bridge');
    power=.8;for(let j=0;j<51;j++)draw(.05);
    check(live&&!deckMode&&!crash&&alt>40,b.id+' launch');
    const approach=deckPoint(b,0,-110);x=approach.x;z=approach.z;yaw=cameraYaw=b.heading;power=.3;alt=24;
    for(let j=0;j<76;j++)draw(.05);
    check(deckMode==='moored'&&landingSite===b&&airspeed===0,b.id+' recovery');
    titleScreen()
   }
   trial=trialMissions.sea;startFlight('combat');check(base===goalPort()&&base.id==='pelagic','Assigned deck');
   check(!landingPorts.some(b=>b.id==='sea-lark'),'Hostile carrier landing');
   check(base.side==='friendly'&&base.roles.includes('defend'),'Defence assignment');
   for(const p of [base,goalPort(),zone]){const c=airspaceCenter();check(Math.max(Math.abs(p.x-c.x),Math.abs(p.z-c.z))<boundary,'Patrol boundary')}
   power=.8;for(let i=0;i<51;i++)draw(.05);
   x=zone.x;z=zone.z;alt=180;fight(.05);check(enemies.length===3,'Sea patrol');
   for(const e of enemies){e.hp=0;e.fall=1}fight(.05);
   check(sortiePhase==='return','Sea return');
   const other=localShips.find(b=>b.id==='west-wind'),otherApproach=deckPoint(other,0,-110);
   x=otherApproach.x;z=otherApproach.z;yaw=cameraYaw=other.heading;power=.3;alt=24;
   for(let j=0;j<76;j++)draw(.05);
   check(landingSite===other&&panel==='flight'&&sortiePhase==='return','Wrong carrier completed mission');
   deckMode='';
   const approach=deckPoint(goalPort(),0,-110);x=approach.x;z=approach.z;yaw=cameraYaw=base.heading;power=.3;alt=24;
   for(let j=0;j<76;j++)draw(.05);check(panel==='result','Assigned carrier result');
   return {ships:ships.length,bases:land.length,oceanCoverage:wet/total,openToMapEdge:outlet}
  }))
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
