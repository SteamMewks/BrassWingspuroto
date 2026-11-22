const boundary=2500, sectorRadius=210;
let sector=0,zone=null,returnHeading=null;
let cleared=0,sortiePhase='departure',approachReady=false,missionHits=0;
function openHangar(){
 showPanel('hangar','整備格納庫','整備券 '+campaign.funds+' 枚　出撃EN '+(100-campaign.wear)+'%　装弾数 '+(90+campaign.mag*20)+' 発');
 $('repair').disabled=campaign.funds<1||!campaign.wear;
 $('magazine').disabled=campaign.funds<2||campaign.mag>=3;
 $('go').textContent='次の面へ出撃';atlas()
}
function completeSortie(){
 if(sortiePhase!=='return')return;
 sortiePhase='result';live=false;clearFlightInput();score+=missionHits===0?500:250;
 if(trial){showPanel('result','試験作戦完了',goalPort().name+' 帰還成功　'+score+' pt');return}
 const current=operation().name;
 campaign.wear=Math.min(40,campaign.wear+missionHits*10);campaign.funds+=2+(missionHits===0?1:0);
 if(campaign.stage===missions.length-1){
  showPanel('finish','全作戦完了',current+' 帰還成功　'+score+' pt');campaign={stage:0,funds:0,wear:0,mag:0,hangar:false};
  $('go').textContent='第1面から再出撃'
 }else{
  campaign.stage++;campaign.hangar=true;openHangar();document.querySelector('.card h1').textContent=current+' クリア'
 }
 saveCampaign()
}
$('repair').onclick=()=>{if(panel==='hangar'&&campaign.wear&&campaign.funds){campaign.wear=Math.max(0,campaign.wear-20);campaign.funds--;saveCampaign();openHangar()}};
$('magazine').onclick=()=>{if(panel==='hangar'&&campaign.mag<3&&campaign.funds>=2){campaign.mag++;campaign.funds-=2;saveCampaign();openHangar()}};
function selectSector(){
 sector++;
 const center=airspaceCenter();
 if(sector===1){
  const waypoint=operation().firstSector;
  zone=waypoint?{x:center.x+waypoint.x,z:center.z+waypoint.z}:{x:base.x-300,z:base.z+1250};
  return
 }
 const heading=yaw+sector*2.39996;
 for(let i=0;i<12;i++){
  const a=heading+i*tau/12,xx=x+1250*Math.sin(a),zz=z+1250*Math.cos(a);
  if(Math.abs(xx-center.x)<boundary-450&&Math.abs(zz-center.z)<boundary-450){zone={x:xx,z:zz};return}
 }
 zone={x:center.x+(x-center.x)*.35,z:center.z+(z-center.z)*.35}
}
