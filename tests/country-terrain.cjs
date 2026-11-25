const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {assemble}=require('../scripts/build');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage();
  await page.addInitScript(()=>{requestAnimationFrame=()=>0});
  await page.route('https://offline.test/game',r=>r.fulfill({body:assemble(),contentType:'text/html'}));
  await page.goto('https://offline.test/game');
  const report=await page.evaluate(()=>{
   startFlight('home');
   let lots=0,roads=0,crossings=0,maxGrade=0;
   const points=[],parents=[],cells=new Map();
   function root(i){while(parents[i]!==i){parents[i]=parents[parents[i]];i=parents[i]}return i}
   function endpoint(a,b){
    const X=(a[0]+b[0])/2,Z=(a[2]+b[2])/2,i=Math.round(X),j=Math.round(Z);
    for(let u=i-1;u<=i+1;u++)for(let v=j-1;v<=j+1;v++){
     for(const n of cells.get(u+','+v)||[])if(Math.hypot(points[n].x-X,points[n].z-Z)<.25)return n
    }
    const key=i+','+j,n=points.length;
    if(!cells.has(key))cells.set(key,[]);
    cells.get(key).push(n);points.push({x:X,z:Z});parents.push(n);return n
   }
   for(const [key,data] of Object.entries(countrySurvey)){
    const [i,j]=key.split(',').map(Number),tile=loadCountryTile(i,j,data);
    const pads=localBases.filter(b=>Math.abs(b.x-tile.x)<660&&Math.abs(b.z-tile.z)<660);
    const runway=(X,Z,r)=>pads.some(b=>Math.abs(b.x-X)<b.width/2+r&&Math.abs(b.z-Z)<b.length/2+r);
    for(const b of tile.lots){
     const {wx,wz}=localToWorld(b.x,b.z);
     if(ground(b.x,b.z)<=0||Math.abs(ground(b.x,b.z)-b.y)>.25||nearRiver(wx,wz,2)||runway(b.x,b.z,b.radius)||nearRail(b.x,b.z))throw Error('Lot at '+[wx,wz,b.stationId]);
     lots++
    }
    for(const quad of tile.roads){
     for(const [X,Y,Z] of quad){
      const {wx,wz}=localToWorld(X,Z);
      if(ground(X,Z)<=0||nearRiver(wx,wz,1)||runway(X,Z,0)||Math.abs(Y-ground(X,Z))>.65)throw Error('Road at '+[wx,wz])
     }
     const [a,b,c,d]=quad;
     parents[root(endpoint(a,b))]=root(endpoint(c,d));
     maxGrade=Math.max(maxGrade,Math.abs(a[1]-d[1])/Math.hypot(a[0]-d[0],a[2]-d[2]));
     roads++;if(quad.crossing)crossings++
    }
   }
   const districts=new Map();
   for(const station of railSites){
    const city=localBases.find(b=>b.stationId===station.name&&b.tier==='large'),networks=new Set();
    for(const [i,p] of points.entries()){
     if(Math.hypot(p.x-city.x,p.z-city.z)<210||Math.hypot(p.x-station.x,p.z-station.z)<260)networks.add(root(i))
    }
    districts.set(station.name,networks)
   }
   for(const h of countryHamlets){
    const p=worldToLocal(h.wx,h.wz),roots=districts.get(h.stationId);
    if(!points.some((n,i)=>Math.hypot(n.x-p.x,n.z-p.z)<1.2&&roots.has(root(i))))throw Error('Isolated village '+h.id)
   }
   const tours=[];let maxLoaded=0;
   for(let lap=0;lap<3;lap++){
    let sum=0;
    for(const s of railSites){x=s.x;z=s.z;streamDistricts();sum+=countryDistricts.size;maxLoaded=Math.max(maxLoaded,countryDistricts.size)}
    tours.push(sum)
   }
   return {lots,roads,crossings,maxGrade,maxLoaded,tours,connected:countryHamlets.length}
  });
  assert.ok(report.maxGrade<.35&&report.maxLoaded<=169);
  assert.equal(report.tours[0],report.tours[2]);console.log(report)
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
