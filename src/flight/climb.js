const wake=[];let wakeTime=0;
let airspeed=0,elapsedTrick=0;
function applyClimb(dt){
 const delta=pitch*dt*46;
 alt+=delta>0?Math.min(delta,Math.max(0,Math.max(0,ground(x,z))+flightCeiling-alt)):Math.max(delta,Math.min(0,.65-alt))
}
const flightInstructions=document.querySelector('.card p').innerHTML;
$('menu').onclick=titleScreen;$('free').onclick=()=>startFlight('free');
$('go').onclick=()=>{if(panel==='hangar'){campaign.hangar=false;saveCampaign();startFlight('combat');return}if(panel==='pause'){enterFlight()}else if(panel!=='title')startFlight(mode)};
const flightCeiling=3200;
function altitudeBand(height){
 return height<220?0:height<420?1:height<620?2:3
}
function groundDetailRange(height){
 return Math.max(0,Math.min(1,(600-height)/380))
}
