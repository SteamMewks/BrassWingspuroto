const landscapes=regionOrigins.map((origin,region)=>({...origin,region,departure:['brass-port','smoke-highlands','red-strait'][region]}));
const colors={player:'#78e3ac',civilian:'#ead195',friendly:'#70bcff',pirate:'#ff7369'};
const labels={player:'本拠地',civilian:'民間都市',friendly:'解放済み',pirate:'空賊占領'};
const campaignTargets=new Set([...Object.keys(airbases),...Object.keys(carriers),...Object.values(settlements).filter(s=>s.initialSide==='pirate').map(s=>s.id)]);
function affiliation(id){
 if(campaignTargets.has(id))return adventure.liberated.includes(id)?'friendly':'pirate';
 return settlements[id]?.initialSide
}
for(const b of Object.values(airbases))if(b.island)continents.push([b.wx,b.wz,b.name,2,390,275,1.8,0,b.islandOrigin]);
let regionContext=landscapes[0];
function worldRegion(){return regionContext}
