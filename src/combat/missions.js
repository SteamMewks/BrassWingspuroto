const missions=['黄昏の帰投','紫煙高地の防衛','赤銅海峡'].map((name,region)=>{
 const departure=['brass-port','smoke-highlands','red-strait'][region];
 const sea=region===0?-1:1,carrier=region!==1,origin=regionOrigins[region];
 return {name,region,...origin,airspace:{...origin},departure,returnTo:carrier?(region===0?'harbour-tender':'strait-guard'):departure,
  carrier,sx:690,sz:sea*1670,objective:'patrol',waves:2,
  bases:{[departure]:{side:'friendly',roles:region===1?['defend']:[]}}}
});
const trialMissions={
 a:{...missions[0],name:'試験A　黄銅港哨戒',carrier:false,returnTo:'brass-port',waves:1},
 b:{...missions[0],name:'試験B　港北から東野へ',carrier:false,departure:'port-plain',returnTo:'east-fields',
  airspace:localToWorld(200,150,regionOrigins[0]),waves:1,
  bases:{'brass-port':{side:'enemy',roles:[]},'port-plain':{side:'friendly',roles:[]},
   'east-fields':{side:'friendly',roles:[]}},firstSector:{x:100,z:-800}}
};
trialMissions.sea={...missions[0],name:'試験C　中央大海哨戒',departure:'pelagic',returnTo:'pelagic',airspace:{wx:carriers.pelagic.wx,wz:carriers.pelagic.wz},firstSector:{x:680,z:1050},waves:1,bases:{pelagic:{side:'friendly',roles:['defend']},'sea-lark':{side:'enemy',roles:[]}}};
const baseSides={friendly:'味方',enemy:'敵管理',neutral:'中立'};
const baseRoles={departure:'出撃',return:'帰投',defend:'防衛',attack:'攻撃目標'};
const baseColors={friendly:'#b7fff0',enemy:'#ff8074',neutral:'#e3bd79'};
function baseAssignment(m,id){
 const settings=m.bases[id],roles=[...(settings?.roles||[])];
 if(m.departure===id)roles.push('departure');
 if(m.returnTo===id)roles.push('return');
 return {side:settings?.side||'neutral',roles}
}
for(const [id,m] of Object.entries(trialMissions))$('operation-choice').add(new Option(m.name,id));
$('operation-choice').onchange=()=>{
 const m=trialMissions[$('operation-choice').value];
 document.querySelector('.card p').innerHTML=m
  ? '推力72%以上で発進。指定空域で赤翼機3機を撃退し、指定基地に帰投。施設上空22 m以下・推力42%以下で滑走路へ進入。'
  : flightInstructions;
 atlas()
};
for(const b of Object.values(outposts)){
 $('free-base').add(new Option(b.name,b.id));
 if(b.island)continents.push([b.wx,b.wz,b.name,2,390,275,1.8,0,b.islandOrigin])
}
$('free-base').onchange=atlas;
