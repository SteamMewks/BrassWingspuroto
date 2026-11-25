// Audit the actual packed survey with the same decoder used in flight.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
const inputs=['src/world/settlements.js','src/data/countrySurvey.js','src/world/countryside.js'];
const source=inputs.map(file=>fs.readFileSync(path.join(root,file),'utf8')).join('\n');
const result=vm.runInNewContext(source+`\n(()=>{
 const lots=new Map(),endpoints=new Set();
 let buildings=0,roadQuads=0;
 for(const [key,data] of Object.entries(countrySurvey)){
  const [i,j]=key.split(',').map(Number);
  const tile=loadCountryTile(i,j,data);
  assert.equal(data.length,3);
  for(const b of tile.lots){
   buildings++;
   if(b.hamletId)lots.set(b.hamletId,(lots.get(b.hamletId)||0)+1)
  }
  for(const q of tile.roads){
   roadQuads++;
   for(const [a,b] of [[q[0],q[1]],[q[2],q[3]]]){
    endpoints.add(Math.round((a[0]+b[0])/2)+','+Math.round((a[2]+b[2])/2))
   }
  }
 }
 const ids=new Set(countryHamlets.map(h=>h.id));
 assert.equal(ids.size,countryHamlets.length);
 assert.equal(ids.size,lots.size);
 for(const id of Object.keys(scenicMarkets))assert.ok(ids.has(id),id);
 for(const h of countryHamlets){
  assert.equal(lots.get(h.id),h.lots,h.id);
  assert.ok(h.lots>=2&&!settlements[h.id]&&countryStations.includes(h.stationId),h.id);
  // Each encoded road edge is independently rounded to 0.1 m.
  assert.ok([-1,0,1].some(dx=>[-1,0,1].some(dz=>endpoints.has((h.wx+dx)+','+(h.wz+dz)))),h.id);
 }
 return {stations:countryStations.length,hamletStations:new Set(countryHamlets.map(h=>h.stationId)).size,
  hamlets:ids.size,retired:Object.keys(scenicMarkets).length,outlying:ids.size-Object.keys(scenicMarkets).length,
  tiles:Object.keys(countrySurvey).length,buildings,roadQuads}
})()`,{assert,atob,worldToLocal:(x,z)=>({x,z})});
console.log(result);
