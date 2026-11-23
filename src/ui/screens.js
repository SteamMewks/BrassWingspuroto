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
 $('actions').replaceChildren();$('atlas').hidden=!['title','pause','travel'].includes(state);
 $('journalOpen').hidden=false;syncAudio();
 if(state==='pause')atlas();
 if(state==='crash')action('安全な拠点で再開',()=>startFlight(adventure.last));
 if(state==='pause'){action('飛行を再開',enterFlight);action('航路を設定',()=>navigationMenu(true))}
}
function titleScreen(){
 leaveSky();ruinDistrictCache.clear();clearTerrain();tileCache.clear();groves.length=groundPixels.length=0;clearEncounter();crash=null;needsRedraw=true;
 showPanel('title','Brass Wings','群島飛行記　町村で仕事を引き受け、雲海の向こうへ。');atlas();
 action('冒険を始める・再開',()=>startFlight(adventure.last));
 action('出発地点を選ぶ',()=>travelMenu(true))
}
function startFlight(id){
 if(!selectable(id))id='home';
 const site=outposts[id];regionContext={...landscapes[site.region],departure:id};
 returnHeading=null;restartFlight();clearEncounter();energy=100-adventure.wear;ammo=90+adventure.mag*20;buildWorld();parkAtStart();updateWorld();enterFlight();draw(0);arrive(base)
}
function arrive(port){
 if(waypointId===port.id)waypointId=null;
 adventure.last=port.id;if(!adventure.visited.includes(port.id))adventure.visited.push(port.id);
 const job=adventure.job;if(job?.kind==='delivery'&&job.to===port.id)job.ready=true;
 power=0;$('thrust').value=0;
 if(port.id==='home'||encounter&&Math.hypot(port.x-encounter.x,port.z-encounter.z)>3200)clearEncounter();
 saveAdventure();dockMenu()
}
function dockMenu(){
 const b=landingSite;showPanel('dock',b.name,labels[affiliation(b.id)]+(b.kind&&b.kind!=='home'?'・'+({city:'大型都市',town:'町',village:'村'})[b.kind]:'')+'　所持金 '+adventure.money+'　積荷 '+adventure.goods+'/8');
 action(b.kind&&b.kind!=='home'?'町に入る':'施設を利用',services);
 action('移動先を選ぶ',()=>travelMenu(false),Boolean(encounter));
 action('離陸',()=>{if(deckMode!=='moored'||affiliation(landingSite.id)==='pirate')return;deckMode='launch';deckTime=0;power=.78;$('thrust').value=78;enterFlight()});
 action('航路を設定',()=>navigationMenu(false));
 action('タイトルへ',titleScreen,Boolean(encounter))
}
function navigationMenu(airborne){
 showPanel('travel','航路を設定','目的地を選ぶと、飛行中に方位と距離を表示します。');atlas();
 const back=airborne?()=>showPanel('pause','一時停止','飛行を再開できます。'):dockMenu;
 action('戻る',back);
 for(const site of Object.values(outposts))action(site.name+'・'+labels[affiliation(site.id)],()=>{waypointId=site.id;back()})
}
function travelMenu(start){
 if(start?panel!=='title':live||encounter||deckMode!=='moored'||affiliation(landingSite.id)==='pirate')return;
 showPanel('travel','航路図','青は友好、黄は中立、赤は空賊。中立は自力で初訪問すると移動先に登録。');atlas();
 for(const b of Object.values(outposts))action(b.name+'・'+labels[affiliation(b.id)],()=>startFlight(b.id),!selectable(b.id));
 action('戻る',start?titleScreen:dockMenu)
}
const industries={works:'工業',timber:'林業',mine:'鉱業',farm:'農業',central:'商業'};
function services(){
 const b=landingSite;if(live||deckMode!=='moored'||affiliation(b.id)==='pirate')return;
 const town=b.kind&&b.kind!=='home';
 showPanel('service',b.name,(industries[b.industry]||'航空施設')+'　所持金 '+adventure.money+'　商品 '+adventure.goods+'　依頼品 '+Number(adventure.job?.kind==='delivery'));
 if(town){
  action('住民と話す',()=>{document.querySelector('.card p').textContent=b.name+'の住民「'+(industries[b.industry]||'地元')+'の品が必要なら掲示板へ。天象演算儀は東の高地にあるそうだ。」'});
  action('依頼掲示板・報告',jobs);
  action('商店　物資を買う · 5',()=>{adventure.money-=5;adventure.goods++;saveAdventure();services()},adventure.money<5||adventure.goods+Number(adventure.job?.kind==='delivery')>=8);
  action('積荷を確認',()=>{document.querySelector('.card p').textContent='商品 '+adventure.goods+'　依頼物資 '+Number(adventure.job?.kind==='delivery')+'　積載上限 8';});
  if(b.kind!=='village')action('商店　物資を売る · 4',()=>{adventure.money+=4;adventure.goods--;saveAdventure();services()},!adventure.goods)
 }else{
  action('補給',()=>{ammo=90+20*adventure.mag;energy=100-adventure.wear;saveAdventure();services()});
  action('機関補修 · 10',()=>{adventure.money-=10;adventure.wear=0;energy=100;saveAdventure();services()},!adventure.wear||adventure.money<10);
  action('弾倉改造 · 40',()=>{adventure.money-=40;adventure.mag++;saveAdventure();services()},adventure.mag>=3||adventure.money<40);
  if(b.id==='home'){
   action('倉庫に預ける',()=>{adventure.goods--;adventure.stored++;saveAdventure();services()},!adventure.goods);
   action('倉庫から取り出す · 在庫 '+adventure.stored,()=>{adventure.goods++;adventure.stored--;saveAdventure();services()},!adventure.stored||adventure.goods+Number(adventure.job?.kind==='delivery')>=8);
   action('依頼を確認',jobs)
  }
 }
 action('飛行場へ戻る',dockMenu)
}
function jobDestination(){
 const job=adventure.job;
 if(!job)return null;
 if(job.kind==='survey'&&!job.ready){
  const site=relics.find(s=>s.id==='orrery');
  return {wx:site.x,wz:site.z,name:'天象演算儀の調査空域'}
 }
 return outposts[job.kind==='delivery'?job.to:job.origin]
}
function jobs(){
 const b=landingSite,j=adventure.job;
 showPanel('jobs','依頼掲示板',j?(j.kind==='delivery'?'依頼物資を '+outposts[j.to].name+' へ':'天象演算儀を調査し '+outposts[j.origin].name+' へ'):adventure.skyClue?'観測報告　演算軸は中央大海を指す。世界の中央で高度610 mを越えて調査しよう。':'受注できる仕事');
 if(j){
  const destination=j.kind==='delivery'?j.to:j.origin;
  action('報告して報酬を受領',()=>{adventure.money+=j.kind==='delivery'?30:50;if(j.kind==='survey')adventure.skyClue=true;adventure.job=null;saveAdventure();jobs()},!j.ready||b.id!==destination)
 }else if(b.id!=='home'){
  const villages=Object.values(settlements).filter(v=>v.kind==='village'&&v.id!==b.id).sort((a,c)=>Math.hypot(a.wx-b.wx,a.wz-b.wz)-Math.hypot(c.wx-b.wx,c.wz-b.wz));
  action('物資輸送 → '+villages[0].name,()=>{adventure.job={origin:b.id,to:villages[0].id,kind:'delivery',ready:false};saveAdventure();jobs()},adventure.goods>=8);
  action('遺構調査 → 天象演算儀 (74000, 84500)',()=>{adventure.job={origin:b.id,kind:'survey',ready:false};saveAdventure();jobs()})
 }
 action('戻る',services)
}
function award(points,label){score+=points;message=label;messageUntil=t+2}
