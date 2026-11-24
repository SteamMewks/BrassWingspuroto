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
 $('panel-title').textContent=title;document.querySelector('.card p').textContent=description;
 $('cover').dataset.panel=state;$('actions').replaceChildren();$('tools').replaceChildren();$('actions').scrollTop=0;$('atlas').hidden=state!=='title';
 $('journalOpen').hidden=!['title','log','pause'].includes(state);syncAudio();

 if(state==='crash')action(adventure.tutorial==='done'?'安全な拠点で再開':'本拠地から再挑戦',()=>startFlight(adventure.tutorial==='done'?adventure.last:'home'));
 if(state==='pause'){action('飛行を再開',enterFlight);action('世界地図',()=>navigationMenu(true));action('操作説明',()=>flightHelp(()=>pauseMenu()))}
}
function titleScreen(){
 leaveSky();ruinDistrictCache.clear();clearTerrain();tileCache.clear();groves.length=groundPixels.length=0;clearEncounter();crash=null;needsRedraw=true;
 showPanel('title','Brass Wings','群島飛行記　町村で仕事を引き受け、雲海の向こうへ。');atlas();
 action('新規ゲーム',()=>hasStoredRecord?confirmRecord(false):newAdventure());
 action('続きから',()=>{if(hasRecord)startFlight(adventure.last)},!hasRecord);
 action('記録を初期化',()=>confirmRecord(true))
}
function confirmRecord(erase){
 showPanel('confirm',erase?'記録を初期化':'新規ゲーム','冒険進行、所持金、所持品、倉庫、解放・訪問地点、依頼、機体改造、発見記録、チュートリアル進行を消去します。この操作は取り消せません。');
 action('キャンセル',titleScreen);action(erase?'記録を消去する':'上書きして始める',erase?eraseAdventure:newAdventure)
}
function startFlight(id){
 if(!selectable(id))id='home';
 const site=outposts[id];regionContext={...landscapes[site.region],departure:id};
 encounterDelay=0;reentryBlocked.clear();returnHeading=null;restartFlight();clearEncounter();energy=100-adventure.wear;ammo=90+adventure.mag*20;buildWorld();parkAtStart();updateWorld();enterFlight();draw(0);arrive(base)
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
 if(isTown(b)){
  action('依頼掲示板',jobs);action('商店',shop);action('住民',()=>{showPanel('resident',b.name+'の住民','「'+b.name+'の特産は'+stock(b).filter(i=>producer(i,b)).map(i=>i.name).join('・')+'。輸送先は掲示板で確認できます。」');fixedAction('戻る',dockMenu)});
  action('積荷',cargoMenu);action('旅の記録',travelLog)
 }else{
  action('補給',()=>{ammo=90+20*adventure.mag;energy=100-adventure.wear;dockMenu();document.querySelector('.card p').append('　補給完了')});
  action('整備 · 10',()=>{adventure.money-=10;adventure.wear=0;energy=100;saveAdventure();dockMenu()},!adventure.wear||adventure.money<10);
  action('改造 · 40',()=>{adventure.money-=40;adventure.mag++;saveAdventure();dockMenu()},adventure.mag>=3||adventure.money<40);
  if(b.id==='home')action('倉庫',warehouseMenu)
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
  action('買う　'+item.name+' · '+price,()=>refreshList(shop,()=>buyItem(item)),adventure.money<price||cargoUsed()>=8)
 }
 for(const lot of adventure.cargo)action('売る　'+lotLabel(lot)+' · '+salePrice(lot,b),()=>refreshList(shop,()=>sellUnit(lot)));
 fixedAction('戻る',dockMenu)
}
function cargoMenu(){
 showPanel('cargo','積荷',cargoUsed()+'/8 枠');
 for(const lot of adventure.cargo)action(lotLabel(lot)+'　仕入 '+lot.price,null,true);
 const j=adventure.freight;if(j)action('預かり品　'+merchandise[j.item].name+' ×'+j.qty+' → '+outposts[j.to].name,jobs);
 fixedAction('戻る',dockMenu)
}
function warehouseMenu(){
 showPanel('warehouse','工房倉庫','積荷 '+cargoUsed()+'/8　預けた商品の飛行距離は保管されます。');
 for(const [from,to,label] of [[adventure.cargo,adventure.warehouse,'預ける'],[adventure.warehouse,adventure.cargo,'取り出す']]){
  for(const lot of from)action(label+'　'+lotLabel(lot),()=>refreshList(warehouseMenu,()=>moveUnit(from,to,lot)),to===adventure.cargo&&cargoUsed()>=8)
 }
 fixedAction('戻る',dockMenu)
}
function travelLog(){
 const towns=adventure.visited.filter(id=>settlements[id]&&id!=='home').map(id=>outposts[id].name);
 showPanel('log','旅の記録','訪問した町村　'+(towns.join('・')||'まだありません')+'。'+adventure.lastLoss+'　解放 '+adventure.liberated.length+' 拠点、空賊撃退 '+adventure.kills+' 機。'+(adventure.skyClue?' 観測の手掛かり　中央大海の上空610 mへ。':''));
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
function jobs(){
 const b=landingSite,j=adventure.job,freight=adventure.freight;
 showPanel('jobs','依頼掲示板',freight?'輸送中　'+merchandise[freight.item].name+' ×'+freight.qty+' → '+outposts[freight.to].name+'　納品までファストトラベル不可':'発着距離 10–30 km　積荷 '+cargoUsed()+'/8');
 if(freight){
  action('納品 · '+freight.reward,()=>{endFreight('completed');jobs()},!townDock(freight.to));
  action('輸送を破棄',()=>{showPanel('abandon','輸送を破棄','預かり品を返却し、この依頼を終了します。');action('破棄する',()=>{endFreight('abandoned');jobs()});fixedAction('戻る',jobs)})
 }else if(isTown(b)){
  const offers=boardFor(b.id);if(!offers.length)document.querySelector('.card p').append('　現在、この距離帯の輸送先はありません。');
  for(const offer of offers)action(outposts[offer.to].name+'行　'+merchandise[offer.item].name+' ×'+offer.qty+'　'+(offer.distance/1000).toFixed(1)+' km · '+offer.reward,()=>{acceptFreight(offer);jobs()},cargoUsed()+offer.qty>8)
 }
 if(j){action('遺構調査を報告 · 50',()=>{if(adventure.job!==j||!j.ready||!townDock(j.origin))return;adventure.money+=50;adventure.skyClue=true;adventure.job=null;saveAdventure();jobs()},!j.ready||b.id!==j.origin)}
 else if(isTown(b))action('遺構調査 → 天象演算儀',()=>{adventure.job={origin:b.id,kind:'survey',ready:false};saveAdventure();jobs()});
 fixedAction('戻る',dockMenu)
}
function award(points,label){score+=points;message=label;messageUntil=t+2}
