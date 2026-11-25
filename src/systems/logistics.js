// Each row defines the producing and importing industries. A named town grows a local specialty.
const merchandise = Object.fromEntries([
 ['grain','穀物','農産物','farm','works',8],['rations','保存食','農産物','central','mine',12],
 ['timber','木材','林産物','timber','works',10],['resin','樹脂','林産物','timber','central',14],
 ['ore','鉱石','鉱産物','mine','works',16],['coal','石炭','鉱産物','mine','central',11],
 ['parts','機械部品','工業品','works','farm',18],['precision','精密部品','工業品','central','works',24],
 ['fuel','予備燃料','航空用品','works','timber',52],['ammo','予備弾薬','航空用品','central','mine',7],['patch','補修材','航空用品','central','farm',9],
 ['ceramic','登窯の焼物','地域特産品','kiln','central',22],['fish','東岸の干物','地域特産品','net-village','mine',13],
 ['flour','北原の挽き粉','地域特産品','mill-village','works',12]
].map(([id,name,category,source,demand,base])=>[id,{id,name,category,source,demand,base,slots:1}]));
const economy={producer:.8,retail:1.18,buyback:.84,demand:1.2,perKm:.023,maxBonus:1.5,loss:.25};
function producer(item,port){return item.source===port.id||item.source===port.industry}
function stock(port){return Object.values(merchandise).filter(item=>producer(item,port)||item.demand===port.industry)}
const marketFactors={'brass-city':1.02,'west-city':1.08,'casting-town':.97,'smoke-city':1.03,windmill:.94,'mill-village':.96,'copper-city':1.01,'red-city':1.06,'fortress-town':1.04,charcoal:.95,smelter:.98,'south-city':1.05,kiln:.96,'net-village':.97};
function buyPrice(item,port){return Math.ceil(item.base*(marketFactors[port.id]||1)*(producer(item,port)?economy.producer:economy.retail))}
function portDistance(a,b){return Math.hypot(a.wx-b.wx,a.wz-b.wz)}
function salePrice(lot,port){
 const item=merchandise[lot.item],km=Math.min(lot.metres,portDistance(outposts[lot.origin],port))/1000;
 const demand=item.demand===port.industry?economy.demand:1;
 return Math.floor(Math.min(lot.price,buyPrice(item,port))*economy.buyback+item.base*demand*economy.maxBonus*(1-Math.exp(-km*economy.perKm/economy.maxBonus)))
}
function cargoUsed(){return adventure.cargo.reduce((sum,l)=>sum+l.qty*merchandise[l.item].slots,adventure.freight?.qty||0)}
const standardTank=20000;
function ammoCapacity(){return 90+20*adventure.mag}
let cargoSaveTime=0;
function recordFlight(metres){
 if(!(metres>0))return;
 const before=adventure.fuel;adventure.fuel=Math.max(0,before-metres);
 if(before>0&&!adventure.fuel)syncAudio();
 for(const lot of adventure.cargo)lot.metres+=metres;
 if(t<cargoSaveTime||t-cargoSaveTime>=20){saveAdventure();cargoSaveTime=t}
}
function townDock(id){return !live&&deckMode==='moored'&&landingSite?.id===id&&affiliation(id)!=='pirate'}
function buyItem(item){
 const port=landingSite,price=buyPrice(item,port);
 if(!townDock(port.id)||!stock(port).includes(item)||adventure.money<price||cargoUsed()+item.slots>8)return;
 adventure.cargo.push({item:item.id,qty:1,origin:port.id,price,metres:0});adventure.money-=price;saveAdventure()
}
function removeUnit(list,lot){if(--lot.qty===0)list.splice(list.indexOf(lot),1)}
function sellUnit(lot){
 if(!townDock(landingSite.id)||!adventure.cargo.includes(lot)||!isTown(landingSite))return;
 adventure.money+=salePrice(lot,landingSite);removeUnit(adventure.cargo,lot);saveAdventure()
}
function isTown(port){return Boolean(port?.kind&&port.kind!=='home')}
function fillOffers(origin,offers){
 const port=settlements[origin],generation=adventure.rounds[origin]||0;
 const candidates=Object.values(settlements).filter(to=>{
  const d=portDistance(port,to);return isTown(to)&&d>=10000&&d<=30000
 });
 const local=stock(port).filter(item=>producer(item,port));
 for(let i=0;i<candidates.length&&offers.length<5;i++){
  const to=candidates[(i+generation)%candidates.length],distance=portDistance(port,to);
  if(offers.some(offer=>offer.to===to.id))continue;
  const item=local[(i+generation)%local.length],qty=1+(i+generation)%3;
  offers.push({id:[origin,generation,to.id].join('/'),origin,to:to.id,item:item.id,qty,distance,reward:Math.round(distance/1000+qty*item.base*.7),status:'posted'})
 }
}
function boardFor(origin){
 if(!adventure.boards[origin]){adventure.boards[origin]=[];fillOffers(origin,adventure.boards[origin]);saveAdventure()}
 return adventure.boards[origin]
}
function acceptFreight(offer){
 if(adventure.freight||!townDock(offer.origin)||!boardFor(offer.origin).includes(offer)||cargoUsed()+offer.qty>8)return;
 adventure.freight={...offer,status:'active'};revealPort(offer.to);saveAdventure()
}
function endFreight(status){
 const job=adventure.freight;if(!job)return false;
 if(status==='completed'){
  if(!townDock(job.to))return false;
  adventure.money+=job.reward
 }
 adventure.freightRecord={...job,status,lost:status==='failed'?1:0,returned:status==='failed'?job.qty-1:status==='abandoned'?job.qty:0};adventure.freight=null;
 adventure.rounds[job.origin]=(adventure.rounds[job.origin]||0)+1;
 const remaining=(adventure.boards[job.origin]||[]).filter(offer=>offer.id!==job.id);
 fillOffers(job.origin,remaining);adventure.boards[job.origin]=remaining;saveAdventure();return true
}
function escapeLoss(random=Math.random){
 const freight=adventure.freight,types=[...new Set(adventure.cargo.map(l=>l.item))];
 if(freight)types.push('freight');
 if(!types.length||random()>=economy.loss)return '空賊から逃走した。積荷は無事だった';
 const type=types[Math.floor(random()*types.length)];
 const item=type==='freight'?freight.item:type;
 const result='空賊の追撃で'+merchandise[item].name+'を1個失った'+(type==='freight'?'。輸送依頼失敗。残り'+(freight.qty-1)+'個は返却扱い':'');
 adventure.lastLoss=result;
 if(type==='freight')endFreight('failed');
 else{removeUnit(adventure.cargo,adventure.cargo.find(l=>l.item===type));saveAdventure()}
 return result
}
