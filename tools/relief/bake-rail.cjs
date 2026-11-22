const {chromium}=require('playwright');
const fs=require('node:fs');
const source=require.resolve('../../Brass_Wings_Homeward (5).html');

(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
 try{
  const page=await browser.newPage();
  await page.evaluate(()=>{requestAnimationFrame=()=>0});
  const html=fs.readFileSync(source,'utf8');
  const input=html.replace(/^const (railElevationArchive|townLayoutArchive)=.*;$/gm,'const $1=[];');
  await page.setContent(input);
  const packed=await page.evaluate(()=>{
   const results=[],layouts=[];
   for(let stage=0;stage<missions.length;stage++){
    campaign.stage=stage;startFlight('free');
    const elevations=[];
    buildRail((x,z)=>{const y=ground(x,z);elevations.push(y);return y});
    results.push(elevations);
    // Quarry bench structures are authored by buildCopperPass and retain
    // their shared cross sections, placement and collision rules.
    layouts.push(JSON.stringify({roads,quarters:quarters.filter(b=>!b.industry)}));
   }
   return {results,layouts};
  });
  const encoded=packed.results.map(row=>{
   const buffer=Buffer.alloc(row.length*4);
   row.forEach((value,i)=>buffer.writeFloatLE(value,i*4));
   return buffer.toString('base64');
  });
  fs.writeFileSync(source,input
   .replace(/^const railElevationArchive=.*;$/m,'const railElevationArchive='+JSON.stringify(encoded)+';')
   .replace(/^const townLayoutArchive=.*;$/m,'const townLayoutArchive='+JSON.stringify(packed.layouts)+';'));
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
