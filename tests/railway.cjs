const { chromium } = require('playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
 try {
  const page = await browser.newPage();
  await page.evaluate(() => { window.requestAnimationFrame = () => 0 });
  await page.setContent(fs.readFileSync(require.resolve('../Brass_Wings_Homeward (5).html'),'utf8'));
  const reports = await page.evaluate(() => {
   const results = [];
   for (let stage=0;stage<3;stage++) {
    campaign.stage=stage;startFlight('free');
    for (const line of railLines) for(let d=0;d<line.length;d+=8) {
     const p=railSample(line,d);
     for(const side of [-4,0,4]){
      const [X,,Z]=railOffset(p,side);
      if(ground(X,Z)>p.y+.15)throw Error('Rail formation '+line.index+' at '+d);
     }
    }
    for(const line of shipping)for(let d=0;d<line.length;d+=10){
     const p=railSample(line,d);if(ground(p.x,p.z)>1)throw Error('Shipping channel crosses land');
    }
    for(const line of railLines)for(let d=0;d<line.length;d+=2){
     const p=railSample(line,d);
     if(!nearRiver(p.x+operation().wx,p.z+operation().wz,5))continue;
     if(!line.bridges.some(b=>d>=b.start&&d<=b.end)||p.y<riverAt(p.x+operation().wx,p.z+operation().wz,5).height+4)throw Error('Missing bridge deck');
    }
    if(baseSpurs.length!==12)throw Error('Base freight siding count');
    for(const spur of baseSpurs)for(const p of spur.curve){
     if(Math.abs(p.y-ground(p.x,p.z)-.62)>.051)throw Error('Freight formation '+spur.id);
    }
    const hall=railLots.find(b=>b.style==='hall');
    if(railHit(hall.x,hall.z,hall.y+3)!=='駅施設')throw Error('Passenger hall collision');
    results.push(railSites.map(p=>[p.name,Math.round(p.x+operation().wx),Math.round(p.z+operation().wz)]));
   }
   if(railSites.filter(s=>s.kind==='central').length!==5)throw Error('Central station count');
   if(railLines.reduce((n,l)=>n+l.bridges.length,0)<3)throw Error('River crossing survey');
   for(const line of railLines)for(const span of line.bridges){
    const middle=railSample(line,(span.start+span.end)/2);
    if(railHit(middle.x,middle.z,middle.y)!=='鉄道橋')throw Error('Bridge collision');
    const directions=new Set();
    for(let tick=0;tick<line.length/7+480&&directions.size<2;tick+=.25){
     railClock=tick;for(const service of [0,1]){
      const cars=railCars(line,service);
      if(Math.hypot(cars[0].x-middle.x,cars[0].z-middle.z)<6&&Math.abs(cars[0].y-middle.y)<.5)directions.add(cars[0].dir);
     }
    }
    if(directions.size!==2)throw Error('Trains did not traverse bridge in both directions');
   }
   const line=railLines[1];let previous,passing=false,held=0,resumed=false;
   for(let tick=0;tick<420;tick+=.5){
    railClock=tick;
    const cars=[0,1].map(i=>railCars(line,i)[0]);
    const separation=(cars[0].x-cars[1].x)*cars[0].dx+(cars[0].z-cars[1].z)*cars[0].dz;
    if(previous){
     const speed=Math.hypot(cars[0].x-previous.x,cars[0].z-previous.z)*2;
     if(speed<.001&&tick>30&&cars[0].dir===1)held++;
     if(held>=12&&speed>1)resumed=true;
     if(separation*previous.separation<0&&cars[0].dir!==cars[1].dir){
      const lateral=Math.abs((cars[0].x-cars[1].x)*cars[0].dz-(cars[0].z-cars[1].z)*cars[0].dx);
      if(Math.abs(lateral-5)>.01)throw Error('Track spacing');
      passing=true;
     }
    }
    previous={...cars[0],separation}
   }
   if(!passing||!resumed)throw Error('Opposing services or station dwell');
   const car=railCars(line,0)[0];
   if(railHit(car.x,car.z,car.y+2)!=='列車')throw Error('Train collision');
   return results
  });
  assert.deepEqual(reports[0],reports[1]);assert.deepEqual(reports[0],reports[2]);
  console.log(reports[0].length+' fixed stations; formation, dwell, restart, passing and collision passed');
 } finally { await browser.close() }
})().catch(e=>{console.error(e);process.exitCode=1});
