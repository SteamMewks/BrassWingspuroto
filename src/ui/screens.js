let trial=null,freeOperation=null;
let mode='free',panel='title',message='',messageUntil=0;
let score=0,spray=[],sprayClock=0;
const flightControls=[document.querySelector('header'),document.querySelector('footer')];
function enterFlight(){
 panel='flight';live=true;$('cover').hidden=true;
 flightControls.forEach(element=>element.inert=false);
 syncFireButton();syncAudio()
}
function showPanel(state,title,description){
 panel=state;$('journalOpen').hidden=state!=='title';
 $('operation-picker').hidden=$('free-picker').hidden=state!=='title';$('atlas').hidden=!['title','hangar','pause'].includes(state);$('service').hidden=state!=='hangar';trigger=false;$('combat').hidden=state!=='title';$('fire').hidden=true;syncAudio();$('cover').hidden=false;
 document.querySelector('.card h1').textContent=title;
 document.querySelector('.card p').textContent=description;
 $('free').hidden=state!=='title';$('go').hidden=state==='title';
 $('menu').hidden=state==='title';
 $('go').textContent=state==='pause'?'再開':'もう一度飛ぶ';
 flightControls.forEach(element=>element.inert=true);
 $(state==='title'?'combat':'go').focus({preventScroll:true})

}
function titleScreen(){
 leaveSky();ruinDistrictCache.clear();clearTerrain();terrainFocus=tileKey='';tileCache.clear();groves.length=groundPixels.length=0;
 live=false;crash=null;trial=freeOperation=null;$('operation-choice').value='';$('free-base').value='';showPanel('title','Brass Wings','');
 document.querySelector('.card p').innerHTML=flightInstructions;atlas()
}
function startFlight(selectedMode){
 mode=selectedMode;freeOperation=null;
 if(mode==='free'){
  trial=null;
  const departure=$('free-base').value;
  if(departure){
   const m=missions[outposts[departure].region??0];
   freeOperation={...m,departure,returnTo:departure,bases:{}}
  }
 }
 restartFlight();resetCombat();
 buildWorld();parkAtStart();
 if(mode==='combat')selectSector();
 message='';messageUntil=0;updateWorld();enterFlight()
}
function award(points,label){
 score+=points;$('score').textContent=score+' pt';message=label+'　+'+points;messageUntil=t+1.5
}
