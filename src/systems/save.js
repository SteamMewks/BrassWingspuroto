let discoveries={};
let campaign={stage:0,funds:0,wear:0,mag:0,hangar:false};
const saveKey='brassWings.worldCampaign.v1';
try{const v=JSON.parse(localStorage.getItem(saveKey));if(v&&Number.isInteger(v.stage)&&v.stage>=0&&v.stage<missions.length)
 {discoveries=Object.fromEntries(relics.filter(s=>typeof v.discoveries?.[s.id]==="string"&&Number.isFinite(Date.parse(v.discoveries[s.id]))).map(s=>[s.id,v.discoveries[s.id]]));campaign={stage:v.stage,funds:Math.max(0,v.funds|0),wear:Math.min(40,Math.max(0,v.wear|0)),mag:Math.min(3,Math.max(0,v.mag|0)),hangar:!!v.hangar}}}catch{}
function saveCampaign(){try{localStorage.setItem(saveKey,JSON.stringify(Object.keys(discoveries).length?{...campaign,discoveries}:campaign))}catch{}}
