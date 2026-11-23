const landscapes=regionOrigins.map((origin,region)=>({...origin,region,departure:['brass-port','smoke-highlands','red-strait'][region]}));
const pirates=new Set(['west-foundry','moor-watch','silver-ridge','copper-works','slate-bay','coal-quay','clay-works','sea-lark','reef-watch']);
const neutral=new Set(['pine-yard','amber-bay','high-firth','south-cross','west-wind']);
const colors={player:'#78e3ac',friendly:'#70bcff',neutral:'#ffd376',pirate:'#ff7369',civil:'#eadac1'};
const labels={player:'本拠地',friendly:'友好',neutral:'中立',pirate:'空賊占領',civil:'町村'};
function affiliation(id){
 if(id==='home')return 'player';
 if(settlements[id])return 'civil';
 if(pirates.has(id)&&!adventure.liberated.includes(id))return 'pirate';
 return neutral.has(id)?'neutral':'friendly'
}
for(const b of Object.values(airbases))if(b.island)continents.push([b.wx,b.wz,b.name,2,390,275,1.8,0,b.islandOrigin]);
let regionContext=landscapes[0];
function worldRegion(){return regionContext}
