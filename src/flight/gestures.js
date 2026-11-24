let turnHeading=0,turnPitch=0,turnRoll=0;
function aircraftRoll(){return bank*.62+(trick==='loop'?turnRoll:trick==='roll'?hand*phase:0)}
function aircraftPitch(){return trick==='loop'?turnPitch:0}
let trick=null,phase=0,hand=1;
let tapDir='',tapAt=0,stickOut=false;
function resetGesture(){tapDir='';tapAt=0;stickOut=false}
function readGesture(rawX=ax,rawY=ay){
 if(!live||trick||deckMode||!adventure.fuel){resetGesture();return}
 const u=rawX+Number(keys.has('ArrowRight'))-Number(keys.has('ArrowLeft'));
 const v=-rawY+Number(keys.has('ArrowUp'))-Number(keys.has('ArrowDown'));
 if(Math.hypot(u,v)<.4){stickOut=false;return}
 if(stickOut||Math.max(Math.abs(u),Math.abs(v))<.72)return;
 stickOut=true;
 const dir=Math.abs(u)>Math.abs(v)?(u<0?'left':'right'):(v>0?'up':'down');
 const now=performance.now();
 if(dir!=='down'&&dir===tapDir&&now-tapAt<=380){
  trick=dir==='up'?'loop':'roll';
  hand=dir==='left'?-1:1;
  turnHeading=yaw;turnPitch=turnRoll=0;phase=elapsedTrick=0;
  tapDir='';
 }else{tapDir=dir;tapAt=now}
}
