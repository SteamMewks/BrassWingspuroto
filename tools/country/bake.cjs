// Run after building the HTML whenever terrain, rail stops or settlement pads change.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage();
  await page.addInitScript(()=>{requestAnimationFrame=()=>0});
  await page.route('https://offline.test/game',r=>r.fulfill({body:require('../../scripts/build.js').assemble(),contentType:'text/html'}));
  await page.goto('https://offline.test/game');
  await page.addScriptTag({path:path.join(__dirname,'layout.js')});
  const survey=await page.evaluate(()=>{
   surveyExistingBlocks();startFlight('home');
   const tiles={},hamlets=[],names=railSites.map(s=>s.name),styles=['field','house','coal','logs','shed','works','mill','nets'];
   function tile(X,Z){
    const {wx,wz}=localToWorld(X,Z),i=Math.floor(wx/512),j=Math.floor(wz/512),key=i+','+j;
    return {ox:i*512-worldRegion().wx,oz:j*512-worldRegion().wz,data:tiles[key]||=( {roads:[],lots:[],owners:[]} )}
   }
   for(const [i,s] of railSites.entries()){
    const district=buildDistrict(s,i);
    hamlets.push(...district.hamlets);
    for(const road of district.roads){
     const {ox,oz,data}=tile(road[0][0],road[0][2]);
     data.roads.push(road.crossing?1:0);
     for(const [X,Y,Z] of road)data.roads.push(Math.round((X-ox)*10),Math.round(Y*10),Math.round((Z-oz)*10))
    }
    for(const b of district.lots){
     const {ox,oz,data}=tile(b.x,b.z);
     data.owners.push(b.hamletId?hamlets.findIndex(h=>h.id===b.hamletId)+1:0);
     data.lots.push(i,styles.indexOf(b.style),...[b.x-ox,b.y,b.z-oz,b.w,b.l,b.h].map(v=>Math.round(v*10)),Math.round(Math.atan2(b.dx,b.dz)*1000))
    }
   }
   const missing=Object.keys(scenicMarkets).filter(id=>!hamlets.some(h=>h.id===id));
   if(missing.length||hamlets.some(h=>h.lots<2))throw Error(JSON.stringify({missing,sparse:hamlets.filter(h=>h.lots<2)}));
   return {tiles,names,styles,hamlets}
  });
  function pack(numbers){
   const bytes=Buffer.alloc(numbers.length*2);numbers.forEach((n,i)=>bytes.writeInt16LE(n,i*2));return bytes.toString('base64')
  }
  const rows=Object.entries(survey.tiles).map(([k,d])=>' '+JSON.stringify(k)+':['+[pack(d.roads),pack(d.lots),pack(d.owners)].map(v=>JSON.stringify(v)).join(',')+']');
  fs.writeFileSync(path.join(root,'src/data/countrySurvey.js'),'const countryHamlets='+JSON.stringify(survey.hamlets)+';\nconst countryStations='+JSON.stringify(survey.names)+',countryStyles='+JSON.stringify(survey.styles)+';\nconst countrySurvey={\n'+rows.join(',\n')+'\n};\n');
  console.log(survey.hamlets.length+' scenic hamlets, '+survey.names.length+' station districts, '+rows.length+' occupied scenery tiles')
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
