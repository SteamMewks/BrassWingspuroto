function advance(dt){
 const targetSpeed=78+54*power;
 airspeed+=(targetSpeed-airspeed)*(1-Math.exp(-dt*3.6));
 const speed=airspeed;
 let forward=speed*dt,side=0;
 if(trick){
  const old=phase,duration=trick==='loop'?3.5:1.65;
  const step=Math.min(dt,duration-elapsedTrick);
  elapsedTrick+=step;
  const u=elapsedTrick/duration;
  // Ease angular speed at entry and recovery without stopping forward flight.
  const ramp=.16;
  function eased(v){return v<ramp?v*v/(2*ramp*(1-ramp)):
   v>1-ramp?1-(1-v)*(1-v)/(2*ramp*(1-ramp)):(v-ramp/2)/(1-ramp)}
  phase=tau*eased(u);
  const mid=(old+phase)/2;
  if(trick==='loop'){
   forward=speed*(step*Math.cos(mid)+dt-step);
   alt+=speed*step*Math.sin(mid)
  }else{
   side=hand*9*(Math.sin(phase)-Math.sin(old));
   alt+=9*(Math.cos(old)-Math.cos(phase))
  }
  // Blend vertical stick authority back in as the plane levels out.
  const endWeight=Math.min(1,Math.max(0,(u-.82)/.18));
  const startWeight=Math.max(0,1-u/.18);
  applyClimb(dt*(startWeight+endWeight*endWeight*(3-2*endWeight)));
  if(elapsedTrick>=duration){trick=null;phase=0}
 }
 x+=Math.sin(yaw)*forward+Math.cos(yaw)*side;
 z+=Math.cos(yaw)*forward-Math.sin(yaw)*side;
 alt=Math.max(.65,alt);
}
