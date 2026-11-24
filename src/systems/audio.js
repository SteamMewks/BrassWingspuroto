let soundOn=false,audioCtx=null,motor=null,volume=null;
function syncAudio(){
 if(!audioCtx)return;
 volume.gain.setTargetAtTime(live&&soundOn&&adventure.fuel>0?.021:0,audioCtx.currentTime,.045);
 motor.frequency.setTargetAtTime(46+28*power,audioCtx.currentTime,.12)
}
$('sound').onclick=async()=>{
 try{
  if(!audioCtx){
   const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
   audioCtx=new Audio();motor=audioCtx.createOscillator();volume=audioCtx.createGain();
   const filter=audioCtx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=310;
   motor.type='sawtooth';volume.gain.value=0;motor.connect(filter);filter.connect(volume);volume.connect(audioCtx.destination);motor.start()
  }
  soundOn=!soundOn;if(soundOn)await audioCtx.resume();
  $('sound').textContent=soundOn?'音 ON':'音 OFF';$('sound').setAttribute('aria-pressed',String(soundOn));syncAudio()
 }catch{soundOn=false;$('sound').textContent='音 OFF';syncAudio()}
};
