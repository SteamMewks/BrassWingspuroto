function advance(dt){
 const previousAltitude=alt;
 if(!adventure.fuel){trick=null;airspeed+=(52-airspeed)*(1-Math.exp(-dt));alt-=dt*(10-4*pitch);x+=airspeed*dt*Math.sin(yaw);z+=airspeed*dt*Math.cos(yaw);return}
 if(trick==='loop'){advanceReversal(dt);return}
 const targetSpeed=78+54*power;
 airspeed+=(targetSpeed-airspeed)*(1-Math.exp(-dt*3.6));
 const speed=airspeed;
 let forward=speed*dt,side=0;
 if(trick){
  const old=phase,duration=1.65;
  const step=Math.min(dt,duration-elapsedTrick);
  elapsedTrick+=step;
  const u=elapsedTrick/duration;
  // Ease angular speed at entry and recovery without stopping forward flight.
  const ramp=.16;
  function eased(v){return v<ramp?v*v/(2*ramp*(1-ramp)):
   v>1-ramp?1-(1-v)*(1-v)/(2*ramp*(1-ramp)):(v-ramp/2)/(1-ramp)}
  phase=tau*eased(u);
  side=hand*9*(Math.sin(phase)-Math.sin(old));
  alt+=9*(Math.cos(old)-Math.cos(phase));
  // Blend vertical stick authority back in as the plane levels out.
  const endWeight=Math.min(1,Math.max(0,(u-.82)/.18));
  const startWeight=Math.max(0,1-u/.18);
  applyClimb(dt*(startWeight+endWeight*endWeight*(3-2*endWeight)));
  if(elapsedTrick>=duration){trick=null;phase=0}
 }
 x+=Math.sin(yaw)*forward+Math.cos(yaw)*side;
 z+=Math.cos(yaw)*forward-Math.sin(yaw)*side;
 if(trick&&alt>previousAltitude)alt=Math.min(alt,Math.max(previousAltitude,ground(x,z)+flightCeiling));
 alt=Math.max(.65,alt);
}
function smoothTurn(value){
 const u=Math.max(0,Math.min(1,value));return u*u*(3-2*u)
}
function reversalPose(seconds){
 const arc=Math.PI*smoothTurn(seconds/2.25);
 // Blend the compass heading near the vertical, where horizontal speed approaches zero.
 const flip=smoothTurn((arc/Math.PI-.46)/.08);
 return {heading:turnHeading+Math.PI*flip,pitch:Math.min(arc,Math.PI-arc),roll:-Math.PI*flip*(1-smoothTurn((seconds-2.25)/1.25))}
}
function advanceReversal(dt){
 const end=Math.min(3.5,elapsedTrick+dt),mid=reversalPose((elapsedTrick+end)/2);
 const step=end-elapsedTrick,span=airspeed*step,horizontal=span*Math.cos(mid.pitch);
 x+=horizontal*Math.sin(mid.heading);z+=horizontal*Math.cos(mid.heading);
 alt+=Math.min(span*Math.sin(mid.pitch),Math.max(0,ground(x,z)+flightCeiling-alt));
 elapsedTrick=end;const pose=reversalPose(end);yaw=pose.heading;turnPitch=pose.pitch;turnRoll=pose.roll;
 if(end===3.5){
  const remaining=airspeed*Math.max(0,dt-step);x+=remaining*Math.sin(yaw);z+=remaining*Math.cos(yaw);
  trick=null;turnPitch=turnRoll=0;pitch=bank=0
 }
}
