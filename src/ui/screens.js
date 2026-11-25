let waypointId=null;
let panel='title',message='',messageUntil=0,score=0,spray=[],sprayClock=0;
const flightControls=[document.querySelector('header'),document.querySelector('footer')];
function action(label,run,disabled=false){
 const button=document.createElement('button');button.textContent=label;button.disabled=disabled;button.onclick=run;$('actions').append(button);return button
}
function enterFlight(){
 panel='flight';live=true;$('cover').hidden=true;flightControls.forEach(e=>e.inert=false);syncFireButton();syncAudio()
}
function showPanel(state,title,description){
 live=false;clearFlightInput();panel=state;$('cover').hidden=false;flightControls.forEach(e=>e.inert=true);
 updateResourceHud();$('panel-title').textContent=title;document.querySelector('.card p').textContent=description;
 $('cover').dataset.panel=state;$('actions').replaceChildren();$('tools').replaceChildren();$('actions').scrollTop=0;$('atlas').hidden=state!=='title';
 $('journalOpen').hidden=!['title','log','pause'].includes(state);syncAudio();

 if(state==='crash')action(adventure.tutorial==='done'?'安全な拠点で再開':'本拠地から再挑戦',()=>startFlight(adventure.tutorial==='done'?adventure.last:'home'));
 if(state==='pause'){action('飛行を再開',enterFlight);action('世界地図',()=>navigationMenu(true));action('積荷',()=>cargoMenu(true));action('操作説明',()=>flightHelp(pauseMenu))}
}
function titleScreen(){
 leaveSky();ruinDistrictCache.clear();clearTerrain();tileCache.clear();groves.length=groundPixels.length=0;clearEncounter();crash=null;needsRedraw=true;
 showPanel('title','Brass Wings','群島飛行記　町村で仕事を引き受け、雲海の向こうへ。');atlas();
 action('新規ゲーム',()=>hasStoredRecord?confirmRecord(false):newAdventure());
 action('続きから',()=>{if(hasRecord)startFlight(adventure.last)},!hasRecord);
 action('記録を初期化',()=>confirmRecord(true))
}
function confirmRecord(erase){
 showPanel('confirm',erase?'記録を初期化':'新規ゲーム','冒険進行、所持金、所持品、解放・訪問地点、依頼、機体改造、発見記録、チュートリアル進行を消去します。この操作は取り消せません。');
 action('キャンセル',titleScreen);action(erase?'記録を消去する':'上書きして始める',erase?eraseAdventure:newAdventure)
}
function startFlight(id){
 if(!selectable(id))id='home';
 const site=outposts[id];regionContext={...landscapes[site.region],departure:id};
 encounterDelay=0;reentryBlocked.clear();returnHeading=null;restartFlight();clearEncounter();energy=100-adventure.wear;buildWorld();parkAtStart();updateWorld();enterFlight();draw(0);arrive(base)
}
function arrive(port){
 if(affiliation(port.id)==='pirate')return;
 if(waypointId===port.id)waypointId=null;
 adventure.last=port.id;if(!adventure.visited.includes(port.id))adventure.visited.push(port.id);

 power=0;$('thrust').value=0;
 if(encounter)leaveBattle(port.wx,port.wz);
 saveAdventure();dockMenu();tutorialArrival(port)
}
function fixedAction(label,run){const button=action(label,run);$('tools').append(button)}
function pauseMenu(){showPanel('pause','一時停止','現在の飛行を再開できます。')}
function portType(b){return ({home:'本拠地',city:'都市',town:'町',village:'村'})[b.kind]||(b.deck?'空母':'航空基地')}
function dockMenu(){
 const b=landingSite;
 showPanel('dock',b.name,portType(b)+'　所持金 '+adventure.money+'　積荷 '+cargoUsed()+'/8');
 action('補給',supplyMenu,Boolean(encounter));
 if(isTown(b)){
  action('依頼掲示板',jobs);action('商店',shop);action('住民',()=>{showPanel('resident',b.name+'の住民','「'+b.name+'の特産は'+stock(b).filter(i=>producer(i,b)).map(i=>i.name).join('・')+'。輸送先は掲示板で確認できます。」');fixedAction('戻る',dockMenu)});
  action('積荷',()=>cargoMenu(false));action('酒場',tavern);action('旅の記録',travelLog)
 }else{
  action('整備 · 10',()=>{adventure.money-=10;adventure.wear=0;energy=100;saveAdventure();dockMenu()},!adventure.wear||adventure.money<10);
  action('改造 · 40',()=>{adventure.money-=40;adventure.mag++;saveAdventure();dockMenu()},adventure.mag>=3||adventure.money<40);
  action('積荷',()=>cargoMenu(false))
 }
 action('世界地図',()=>navigationMenu(false));action('ファストトラベル',travelMenu,Boolean(encounter||adventure.freight));
 fixedAction('手帳',()=>{showPanel('book','飛行手帳','冒険の記録と操作');action('操作説明',()=>flightHelp(dockMenu));action('旅の記録',travelLog);action('タイトルへ',titleScreen,Boolean(encounter));fixedAction('戻る',dockMenu)});
 fixedAction('離陸',()=>{if(!townDock(b.id))return;deckMode='launch';deckTime=0;power=.78;$('thrust').value=78;enterFlight();tutorialLaunch()})
}
function travelMenu(){
 if(!townDock(landingSite.id)||encounter||adventure.freight)return;
 showPanel('travel','ファストトラベル','登録 '+adventure.favorites.length+'/10　工房は固定枠');
 for(const id of ['home',...adventure.favorites])action(outposts[id].name,()=>fastTravel(id),id===landingSite.id);
 fixedAction('戻る',dockMenu)
}
function fastTravel(id){
 if(panel!=='travel'||!townDock(landingSite.id)||encounter||adventure.freight||!selectable(id)||(id!=='home'&&!adventure.favorites.includes(id)))return false;
 startFlight(id);return true
}
function refreshList(render,change){
 const top=$('actions').scrollTop;change();render();$('actions').scrollTop=top
}
function lotLabel(l){return merchandise[l.item].name+' ×'+l.qty+'　'+outposts[l.origin].name+'発　'+(l.metres/1000).toFixed(1)+' km'}
function shop(){
 const b=landingSite;
 showPanel('shop',b.name+' 商店','所持金 '+adventure.money+'　積荷 '+cargoUsed()+'/8');
 for(const item of stock(b)){
  const price=buyPrice(item,b);
  action('買う　'+item.name+' · '+price,()=>purchaseMenu(item),adventure.money<price||cargoUsed()>=8)
 }
 for(const lot of adventure.cargo)action('売る　'+lotLabel(lot)+' · '+salePrice(lot,b),()=>refreshList(shop,()=>sellUnit(lot)));
 fixedAction('戻る',dockMenu)
}
function resourceText(){
 return '燃料 '+(adventure.fuel/1000).toFixed(1)+' / '+(adventure.fuelMax/1000)+' km　弾薬 '+adventure.ammo+' / '+ammoCapacity()+' 発'
}
function cargoMenu(airborne){
 showPanel('cargo','積荷',cargoUsed()+'/8 枠　'+resourceText());
 for(const lot of adventure.cargo){
  const item=merchandise[lot.item],available=airborne&&reserveAmount(item.id)>0;
  action(lotLabel(lot)+'　'+item.category+(available?'・使用可':'・使用不可'),()=>cargoDetail(lot,airborne))
 }
 const j=adventure.freight;if(j)action('預かり品　'+merchandise[j.item].name+' ×'+j.qty+' → '+outposts[j.to].name,null,true);
 fixedAction('戻る',airborne?pauseMenu:dockMenu)
}
function cargoDetail(lot,airborne){
 const back=()=>cargoMenu(airborne),item=merchandise[lot.item];
 showPanel('cargo-detail',item.name,item.category+'　'+lotLabel(lot)+'　'+resourceText());
 const amount=reserveAmount(item.id);
 if(item.id==='fuel'||item.id==='ammo')action('1個使用　'+supplyAmount(item.id,amount),()=>{
  if(airborne&&panel==='cargo-detail'&&!live&&deckMode!=='moored'&&adventure.cargo.includes(lot)&&reserveAmount(item.id)>0){
   adventure[item.id]+=reserveAmount(item.id);removeUnit(adventure.cargo,lot);saveAdventure()
  }
  back()
 },!airborne||!amount);
 action('破棄を確認',()=>{
  showPanel('discard','積荷を破棄',item.name+'を1個破棄しますか？');
  action('1個破棄する',()=>{if(panel==='discard'&&adventure.cargo.includes(lot)){removeUnit(adventure.cargo,lot);saveAdventure()}back()});
  fixedAction('戻る',()=>cargoDetail(lot,airborne))
 });
 fixedAction('戻る',back)
}
function reserveAmount(id){
 if(id==='fuel')return Math.min(20000,adventure.fuelMax-adventure.fuel);
 if(id==='ammo')return Math.min(30,ammoCapacity()-adventure.ammo);
 return 0
}
function supplyAmount(id,amount){return id==='fuel'?(amount/1000).toLocaleString('ja-JP',{maximumFractionDigits:3})+' km':amount+' 発'}
function purchaseMenu(item){
 const port=landingSite,price=buyPrice(item,port),max=purchaseLimit(item,port);
 showPanel('purchase',item.name,'単価 '+price+' G　積荷 '+cargoUsed()+'/8　購入上限 '+max+' 個');
 const label=document.createElement('label'),input=document.createElement('input');
 label.textContent='購入数量　';input.type='number';input.inputMode='numeric';input.min='1';input.max=String(max);input.step='1';input.value='1';
 label.append(input);$('actions').append(label);
 const confirm=action('',()=>{if(panel==='purchase'&&input.validity.valid){buyItem(item,input.valueAsNumber);shop()}});
 function update(){
  const qty=input.valueAsNumber;
  confirm.disabled=!Number.isSafeInteger(qty)||qty<1||qty>max;
  confirm.textContent=confirm.disabled?'1〜'+max+'の整数を入力':'購入確定　'+qty*price+' G'
 }
 input.oninput=update;update();fixedAction('戻る',shop)
}
function supplyQuote(id,requested){
 const fuel=id==='fuel',town=isTown(landingSite);
 const units=fuel?5000:30,rate=fuel?(town?townFuelPrice:10):(town?8:5);
 const amount=Math.max(0,Math.min(requested,(fuel?adventure.fuelMax:ammoCapacity())-adventure[id],Math.floor(adventure.money*units/rate)));
 return {amount,price:Math.ceil(amount*rate/units)}
}
function buySupply(id,requested){
 if(!['fuel','ammo'].includes(id)||!(requested>0)||panel!=='supply'||!townDock(landingSite.id)||encounter)return false;
 const {amount,price}=supplyQuote(id,requested);if(!amount)return false;
 adventure.money-=price;adventure[id]+=amount;saveAdventure();return true
}
function supplyMenu(){
 showPanel('supply','補給',resourceText()+'　所持金 '+adventure.money+' G');
 for(const id of ['fuel','ammo']){
  const steps=id==='fuel'?[5000,10000,15000,Infinity]:[30,Infinity];
  let previous=-1;
  for(const step of steps){
   const {amount,price}=supplyQuote(id,step);if(previous===amount)continue;previous=amount;
   action((id==='fuel'?'燃料 ':'弾薬 ')+supplyAmount(id,amount)+' · '+price+' G',()=>{buySupply(id,step);supplyMenu()},!amount)
  }
 }
 fixedAction('戻る',dockMenu)
}
function nearestBase(port){
 return Object.values(airbases).reduce((best,b)=>portDistance(b,port)<portDistance(best,port)?b:best)
}
function tavern(){
 const port=landingSite,b=nearestBase(port);
 const angle=Math.atan2(b.wx-port.wx,b.wz-port.wz);
 const direction=['北','北東','東','南東','南','南西','西','北西'][(Math.round(angle/(Math.PI/4))+8)%8];
 if(!knownPort(b.id)){revealPort(b.id);saveAdventure()}
 showPanel('tavern',port.name+'の酒場','「最寄りは'+b.name+'。ここから'+direction+'へ約'+(portDistance(b,port)/1000).toFixed(1)+' kmだ。今は'+labels[affiliation(b.id)]+'だよ」');
 action('世界地図で確認',()=>navigationMenu(false,b.id,tavern));fixedAction('戻る',dockMenu)
}
function travelLog(){
 const towns=adventure.visited.filter(id=>settlements[id]&&id!=='home').map(id=>outposts[id].name);
 showPanel('log','旅の記録','訪問した町村　'+(towns.join('・')||'まだありません')+'。'+adventure.lastLoss+'　解放 '+adventure.liberated.length+'/'+(Object.keys(outposts).length-1)+' 拠点、空賊撃退 '+adventure.kills+' 機。'+(adventure.skyClue?' 観測の手掛かり　中央大海の上空610 mへ。':''));
 fixedAction('戻る',dockMenu)
}
function jobDestination(){
 return adventure.freight?outposts[adventure.freight.to]:surveyDestination()
}
function surveyDestination(){
 const job=adventure.job;
 if(!job)return null;
 if(job.kind==='survey'&&!job.ready){
  const site=relics.find(s=>s.id==='orrery');
  return {wx:site.x,wz:site.z,name:'天象演算儀の調査空域'}
 }
 return outposts[job.kind==='delivery'?job.to:job.origin]
}
function offerDetail(offer){
 const to=outposts[offer.to];
 showPanel('offer','輸送依頼の詳細',outposts[offer.origin].name+' → '+to.name+'（'+labels[affiliation(to.id)]+'）　'+merchandise[offer.item].name+' ×'+offer.qty+'　'+(offer.distance/1000).toFixed(1)+' km　報酬 '+offer.reward+' G　積荷 '+cargoUsed()+'/8');
 action('世界地図で位置を確認',()=>{revealPort(to.id);saveAdventure();navigationMenu(false,to.id,()=>offerDetail(offer))});
 action('受注する',()=>{acceptFreight(offer);jobs()},Boolean(adventure.freight)||cargoUsed()+offer.qty>8);fixedAction('戻る',jobs)
}
function jobs(){
 const b=landingSite,j=adventure.job,freight=adventure.freight;
 showPanel('jobs','依頼掲示板',freight?'輸送中　'+merchandise[freight.item].name+' ×'+freight.qty+' → '+outposts[freight.to].name+'　納品までファストトラベル不可':'発着距離 10–30 km　積荷 '+cargoUsed()+'/8');
 if(freight){
  action('納品 · '+freight.reward,()=>{endFreight('completed');jobs()},!townDock(freight.to));
  action('輸送を破棄',()=>{showPanel('abandon','輸送を破棄','預かり品を返却し、この依頼を終了します。');action('破棄する',()=>{endFreight('abandoned');jobs()});fixedAction('戻る',jobs)})
 }else if(isTown(b)){
  const offers=boardFor(b.id);if(!offers.length)document.querySelector('.card p').append('　現在、この距離帯の輸送先はありません。');
  for(const offer of offers)action(outposts[offer.to].name+'行　'+merchandise[offer.item].name+' ×'+offer.qty+'　'+(offer.distance/1000).toFixed(1)+' km · '+offer.reward,()=>offerDetail(offer))
 }
 if(j){action('遺構調査を報告 · 50',()=>{if(adventure.job!==j||!j.ready||!townDock(j.origin))return;adventure.money+=50;adventure.skyClue=true;adventure.job=null;saveAdventure();jobs()},!j.ready||b.id!==j.origin)}
 else if(isTown(b))action('遺構調査 → 天象演算儀',()=>{adventure.job={origin:b.id,kind:'survey',ready:false};saveAdventure();jobs()});
 fixedAction('戻る',dockMenu)
}
function award(points,label){score+=points;message=label;messageUntil=t+2}

function updateResourceHud(){
 const scoreboard=(adventure.fuel===0?'滑空':adventure.fuel<=1000?'燃料危険':adventure.fuel<=5000?'燃料注意':'燃料')+' '+(adventure.fuel/1000).toFixed(1)+' km　弾 '+adventure.ammo+'\n'+(encounter?'EN '+Math.ceil(energy)+'%　':'')+score+' pt';
 const low=adventure.fuel<=5000?'yes':'';if($('score').dataset.low!==low)$('score').dataset.low=low;
 if($('score').textContent!==scoreboard)$('score').textContent=scoreboard}
