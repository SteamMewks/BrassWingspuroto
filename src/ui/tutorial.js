const firstCity='brass-city';
const tutorialNext={
 new:['home'],home:['flight'],flight:['battle','liberated'],battle:['liberated'],
 liberated:['landing','visit'],landing:['visit'],visit:['done'],done:[]
};
function tutorialStage(stage){
 if(adventure.tutorial===stage)return;
 if(!tutorialNext[adventure.tutorial].includes(stage))return;
 adventure.tutorial=stage;saveAdventure()
}
let flightHint=0;
function tutorialFlightHints(){
 if(adventure.tutorial!=='flight'||encounter||deckMode)return;
 const p=localToWorld(x,z),city=outposts[firstCity];
 if(flightHint<2&&Math.hypot(city.wx-p.wx,city.wz-p.wz)<1500){
  flightHint=2;message='黄銅港市は空賊占領下。赤い旗に近づくと防衛隊が出現します';messageUntil=t+5
 }else if(!flightHint&&t>6){
  flightHint=1;message='左右で旋回、上下で昇降。方位と距離を確認し、地図の黄銅港市へ';messageUntil=t+6
 }
}
function flightHelp(back){
 showPanel('guide','飛行手帳','離陸ボタンで発進。推力はスライダー、旋回と昇降は操縦桿または矢印キー。空賊は照準内で捕捉し、射撃ボタンかスペースで迎撃します。戦闘空域外へ逃走できますが、所持品を失うことがあります。着陸時は滑走路に沿って低速・低空で進入してください。');
 action('戻る',back)
}
function tutorialArrival(port){
 if(adventure.tutorial==='done')return;
 revealPort(firstCity);waypointId=firstCity;
 if(port.id===firstCity&&affiliation(firstCity)==='friendly'){
  tutorialStage('visit');dockMenu();
  showPanel('guide',port.name+'へようこそ','住民と話し、掲示板で最初の輸送を受注できます。商店と積荷を確認し、旅の記録を残しましょう。飛行場に戻ると再出発できます。');
  action('依頼掲示板へ',()=>{tutorialStage('done');waypointId=null;jobs()});
  action('町に入る',()=>{tutorialStage('done');waypointId=null;dockMenu()});return
 }
 if(adventure.liberated.includes(firstCity)){if(adventure.tutorial==='liberated')landingGuide(dockMenu);return}
 if(adventure.tutorial==='new'||adventure.tutorial==='home'){
  tutorialStage('home');
  showPanel('guide','真鍮の翼工房から旅立つ','ここはあなたの本拠地。外の町や飛行場は空賊に占領されています。まず黄銅港市へ飛び、防衛隊を撃退しましょう。工房では補給と機体状態を確認できます。');
  action('黄銅港市を目的地にする',()=>{tutorialStage('flight');dockMenu()})
 }
}
function tutorialLaunch(){
 if(adventure.tutorial==='done')return;
 revealPort(firstCity);waypointId=firstCity;flightHint=0;message=adventure.tutorial==='landing'?'滑走路に沿い、推力42%以下で低空進入':'推力スライダーで速度を調整。上昇して安全な高度を確保しよう';messageUntil=t+12
}
function tutorialBattle(){
 if(encounter.id!==firstCity||adventure.tutorial!=='flight')return false;
 tutorialStage('battle');showPanel('guide','空賊防衛隊接近','戦闘地図は街を中心に5 km四方。敵機を正面に捉え、捕捉枠が出たら射撃。被弾するとENが低下します。戦闘空域外へ逃走できます。逃走時は25%の確率で積荷を1個失います。');
 action('戦闘を開始',enterFlight);return true
}
function landingGuide(back){
 showPanel('guide','黄銅港市の滑走路へ','南北に延びる滑走路の中心線に機首を合わせ、地上22 m以下・推力42%以下で進入します。着陸補助で停機したら町へ入りましょう。');
 action('着陸案内を確認',()=>{tutorialStage('landing');waypointId=firstCity;back()})
}
function tutorialLiberation(id){
 if(id!==firstCity||adventure.tutorial==='done')return;
 tutorialStage('liberated');waypointId=id;landingGuide(enterFlight)
}
