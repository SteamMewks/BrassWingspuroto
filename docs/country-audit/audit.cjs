const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {execFileSync} = require('node:child_process');
const {chromium} = require('playwright');
const {assemble} = require('../../scripts/build.js');

const baseline = 'de2ea6742018c8db30f33cd5c0ada8f406cbfecc';
const root = path.resolve(__dirname, '../..');
const output = __dirname;

function selectScenes() {
  const town = localBases.find(b => b.id === 'market-小麦台');
  const station = railSites.find(s => s.name === town.stationId);
  const tiles = Object.entries(countrySurvey).map(([key, data]) => {
    const [i,j] = key.split(',').map(Number);
    return loadCountryTile(i,j,data);
  });
  const lots = tiles.flatMap(tile => tile.lots);
  const roads = tiles.flatMap(tile => tile.roads).filter(road => !road.crossing);
  const dist = (a,b) => Math.hypot(a.x-b.x,a.z-b.z);
  const nearest = (items, score) => items.reduce((a,b) => score(a)<score(b)?a:b);
  const fields = lots.filter(b => b.style === 'field' && b.stationId === station.name);
  const field = nearest(fields.filter(b=>b.hamletId), b => dist(b,town));
  const roadNear = (a,b) => {
    const mid = {x:(a.x+b.x)/2,z:(a.z+b.z)/2};
    const points = roads.map(r => ({x:r[1][0], z:r[1][2]}));
    return nearest(points,p => dist(p,mid));
  };
  const remote = nearest(lots.filter(b=>b.style==='house'), b =>
    -Math.min(...railSites.map(s=>dist(b,s)),...localBases.map(s=>dist(b,s))));
  let coast=null,shoreHeading=0,shoreDistance=Infinity;
  for(const b of lots.filter(b=>b.hamletId&&['nets','shed'].includes(b.style))){
    for(let k=0;k<12;k++){
      const a=k*Math.PI/6;
      for(let d=60;d<Math.min(shoreDistance,1400);d+=80){
        if(!mainlandAt(b.x+d*Math.sin(a),b.z+d*Math.cos(a))){
          coast=b;shoreHeading=a;shoreDistance=d;break
        }
      }
    }
  }
  if(!coast)throw Error('No coastal village in survey');
  return [
    ['station',station,Math.atan2(station.dx,station.dz)], ['city-town',roadNear(station,town),Math.atan2(town.x-station.x,town.z-station.z)],
    ['town-village',roadNear(town,field),Math.atan2(field.x-town.x,field.z-town.z)],
    ['farmland',field,0.5], ['remote',remote,0], ['coast',coast,shoreHeading]
  ].map(([id,p,heading]) => ({id,...localToWorld(p.x,p.z),heading,
    station:p.stationId || station.name, nearestStationMetres:Math.min(...railSites.map(s=>dist(p,s)))}));
}

function place({scene,height}) {
  const target = worldToLocal(scene.wx,scene.wz);
  yaw = cameraYaw = scene.heading;
  const back=height===55?200:370,side=back*.34;
  x=target.x-Math.sin(yaw)*back+Math.cos(yaw)*side;
  z=target.z-Math.cos(yaw)*back-Math.sin(yaw)*side;
  alt = ground(x,z) + height;
  updateWorld();
  draw(0);
  if (!live || deckMode) throw Error('Camera left free flight '+scene.id);
}

async function benchmark(page,cdp) {
  const heap = async () => {
    await cdp.send('HeapProfiler.collectGarbage');
    return (await cdp.send('Runtime.getHeapUsage')).usedSize;
  };
  await page.evaluate(()=>{startFlight('home');enterFlight();deckMode=''});
  const laps = [];
  for (let lap=0; lap<3; lap++) {
    const stats = await page.evaluate(async () => {
      const intervals = [];
      const caches = [];
      const station=railSites.find(s=>s.name==='小麦台'),origin=localToWorld(station.x,station.z);
      let prev;
      for(let i=0;i<240;i++) {
        ({x,z}=worldToLocal(origin.wx,origin.wz-500+24*i));alt=ground(x,z)+125;
        yaw=cameraYaw=0;
        updateWorld(); draw(0);
        const now=await new Promise(window.auditFrame);
        if(i>=24) intervals.push(now-prev);
        prev=now;
        caches.push([tileCache.size,typeof countryDistricts==='undefined'?0:countryDistricts.size]);
      }
      intervals.sort((a,b)=>a-b);
      return {fps:1000*intervals.length/intervals.reduce((a,b)=>a+b),p95ms:intervals[Math.floor(intervals.length*.95)],
        maxTerrainTiles:Math.max(...caches.map(c=>c[0])),maxCountryTiles:Math.max(...caches.map(c=>c[1])),endCaches:caches.at(-1)};
    });
    laps.push({...stats,retainedJSBytes:await heap()});
  }
  return laps;
}

async function run() {
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'country-audit-'));
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox']});
  const report={baseline,chromium:browser.version(),viewport:{width:844,height:390},seed:4315,builds:{}};
  try {
    for(const label of ['main','baseline','revised']) {
      const html=label!=='revised'?execFileSync('git',['show',(label==='main'?'4aefdc78bcc10de51ff421a3f9954538cf71574c':baseline)+':BrassWings-preview.html'],{cwd:root,maxBuffer:12e6}):assemble();
      const file=path.join(tmp,label+'.html');
      fs.writeFileSync(file,html);
      const page=await browser.newPage({viewport:report.viewport,offline:true,isMobile:true,hasTouch:true});
      await page.addInitScript(seed=>{
        Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
        window.auditFrame=requestAnimationFrame.bind(window);
        window.requestAnimationFrame=()=>0;
      },report.seed);
      await page.route('https://offline.test/game',route=>route.fulfill({path:file,contentType:'text/html'}));
      await page.goto('https://offline.test/game');
      const stats=await page.evaluate(()=>{
        startFlight('home');enterFlight();deckMode='';
        return {large:localBases.filter(b=>b.kind&&b.id!=='home'&&b.tier==='large').length,medium:localBases.filter(b=>b.kind&&b.id!=='home'&&b.tier==='medium').length,
          scenicMarkets:typeof scenicMarkets==='undefined'?0:Object.keys(scenicMarkets).length,saveVersion:adventure.version};
      });
      const cdp=await page.context().newCDPSession(page);
      report.builds[label]={sha256:createHash('sha256').update(html).digest('hex'),...stats,laps:await benchmark(page,cdp)};
      if(label==='revised') {
        report.scenes=await page.evaluate(selectScenes);
        for(const scene of report.scenes) for(const height of [55,170]) {
          await page.evaluate(place,{scene,height});
          await page.screenshot({path:path.join(output,scene.id+'-'+height+'.png')});
        }
      }
      await page.setViewportSize({width:390,height:844});
      report.builds[label].portraitLaps=await benchmark(page,cdp);
      await page.close();
    }
    fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(report,null,2)+'\n');
  } finally {await browser.close();fs.rmSync(tmp,{recursive:true,force:true});}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
