function stick(a,b){
 const distance=Math.hypot(a,b),limit=Math.max(1,distance);
 const rawX=a/limit,rawY=b/limit;
 // Treat each axis independently so a mostly horizontal drag stays level.
 function response(value){
  const travel=Math.min(1,Math.max(0,(Math.abs(value)-.18)/.82));
  return Math.sign(value)*travel*(.52+.48*travel)
 }
 ax=response(rawX);ay=response(rawY);readGesture(rawX,rawY);
 $('knob').style.transform='translate('+rawX*36+'px,'+rawY*36+'px)'
}
function move(e){let r=$('pad').getBoundingClientRect();stick((e.clientX-r.left-r.width/2)/43,(e.clientY-r.top-r.height/2)/43)}
const pad=$('pad'),thrust=$('thrust'),fire=$('fire');
function releaseStick(pointerId=id){
 if(id===null||pointerId!==id)return;
 id=null;
 if(pad.hasPointerCapture(pointerId))pad.releasePointerCapture(pointerId);
 stick(0,0)
}
function clearFlightInput(){
 keys.clear();trigger=false;releaseStick();stick(0,0)
}
pad.onpointerdown=e=>{if(!live||id!==null)return;id=e.pointerId;pad.setPointerCapture(id);move(e)};
pad.onpointermove=e=>{if(live&&id===e.pointerId)move(e)};
pad.onpointerup=pad.onpointercancel=pad.onlostpointercapture=e=>releaseStick(e.pointerId);
thrust.oninput=e=>{power=Number(e.target.value)/100;syncAudio()};
function pause(){
 if(!live)return;
 live=false;clearFlightInput();
 showPanel('pause','一時停止','現在の飛行を再開できます。');atlas()
}
$('pause').onclick=pause;onblur=pause;
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
onkeydown=e=>{
 if(!live)return;
 if(e.key==='Escape'){e.preventDefault();pause();return}
 if(e.code==='Space'&&encounter&&!deckMode&&(e.target===fire||!e.target.closest?.('button,input'))){
  e.preventDefault();keys.add('Space');return
 }
 if(document.activeElement===thrust)return;
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
  e.preventDefault();keys.add(e.key);readGesture()
 }
};
onkeyup=e=>{if(e.code==='Space')keys.delete('Space');if(keys.delete(e.key))readGesture()};
