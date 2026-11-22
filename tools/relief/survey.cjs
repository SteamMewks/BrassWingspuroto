const {chromium}=require('playwright'),fs=require('fs');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});const page=await browser.newPage();await page.evaluate(()=>requestAnimationFrame=()=>0);await page.setContent(fs.readFileSync(require.resolve('../../Brass_Wings_Homeward (5).html'),'utf8'));const data=await page.evaluate(()=>{
 const data={coasts:worldCoasts,origins:regionOrigins,bases:Object.values(airbases),legacy:[],towns:[],paths:[],sites:[],spurs:[],lots:[],oldRiver:Array.from({length:65},(_,i)=>{const z=-2048+i*64;return [regionOrigins[1].wx+valleyAxis(z)+24*Math.sin(z/117),regionOrigins[1].wz+z]})};
 for(let i=0;i<3;i++){campaign.stage=i;startFlight('free');const m=operation(),point=p=>[p[0]+m.wx,p[2]+m.wz,p[1]];
 const faces=ridgeFaces.map(q=>q[2]);for(const wall of cliffs)for(let j=0;j<wall.length-1;j++)for(let k=0;k<wall[j].length-1;k++){const a=wall[j],b=wall[j+1];faces.push([a[k],a[k+1],b[k+1]],[a[k],b[k+1],b[k]])}
 if(i===0){data.islands=shoreMeshes.map(island=>island.outer.map(v=>point(v).slice(0,2)));for(const island of shoreMeshes)for(let j=0;j<64;j++){const k=(j+1)%64;faces.push([island.outer[j],island.outer[k],island.inner[k]],[island.outer[j],island.inner[k],island.inner[j]])}}
 data.legacy.push(...faces.map(tri=>tri.map(point)));data.towns.push([m.wx+m.town[0],m.wz+m.town[1]]);
 if(i===0){data.paths=railLines.map(l=>Array.from({length:Math.ceil(l.length/42)+1},(_,j)=>{const d=Math.min(l.length,j*42),p=railSample(l,d);return [p.x+m.wx,p.z+m.wz,d]}));data.sites=railSites.map(s=>[s.x+m.wx,s.z+m.wz,s.d,s.line.index,s.name,s.kind]);data.spurs=baseSpurs.map(s=>[s.id,s.curve.map(p=>[p.x+m.wx,p.z+m.wz])]);data.lots=railLots.map(o=>[o.x+m.wx,o.z+m.wz])}
 }
 return data
 });fs.writeFileSync(require('path').join(process.argv[2],'survey.json'),JSON.stringify(data));await browser.close()})()
