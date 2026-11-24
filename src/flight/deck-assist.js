let locked=null, hostile=[], grace=0, nextAttack=0;
let ammo=90,energy=100,supplying=false;
let deckMode='',deckTime=0,landingSite=null,landingDirection=1;
function parkAtStart(){
 landingSite=base;landingDirection=1;deckMode='moored';deckTime=0;
 const spawn=base.deck?deckPoint(base,0,-95):{x:base.x,z:base.z-95};
 x=spawn.x;z=spawn.z;alt=base.height+(base.deck?2:1.5);yaw=cameraYaw=base.heading||0
}
function syncFireButton(){$('fire').hidden=!encounter||Boolean(deckMode)}
function deckAssist(dt){
 let port=landingSite;
 if(!deckMode){
  if(power>.42)return false;
  port=null;let nearest=Infinity;
  for(const b of landingPorts){
   const direction=!b.deck&&Math.cos(yaw)<0?-1:1;
   const axes=b.deck?deckAxes(b,x,z):{side:x-b.x,along:z-b.z},side=Math.abs(axes.side),along=axes.along*direction,range=side*side+along*along;
   const height=b.deck?deckHeight+2:b.height+1.5;
   if(alt>(b.deck?32:b.height+22)||alt<height-1||side>31||along < -(b.deck?130:b.length/2+15)||along>55||range>=nearest)continue;
   port=b;nearest=range
  }
  if(!port)return false
 }
 const runway=!port.deck,direction=deckMode?landingDirection:(runway&&Math.cos(yaw)<0?-1:1);
 const heading=(port.heading||0)+(direction===1?0:Math.PI),side=x-port.x;
 const touchHeight=runway?port.height+1.5:deckHeight+2,stop=port.deck?deckPoint(port,0,62):{x:port.x,z:port.z+direction*62};
 if(!deckMode){
  if(Math.abs(angleDelta(yaw-heading))>1.7)return false;
  landingSite=port;landingDirection=direction;deckMode='capture';deckTime=0;trick=null;phase=0;returnHeading=null;clearFlightInput();syncFireButton()
 }
 const movingX=x,movingZ=z,movingAlt=alt;
 deckTime+=dt;
 const capture=1-Math.exp(-2.4*dt);
 bank*=1-capture;pitch*=1-capture;yaw+=angleDelta(heading-yaw)*capture;
 if(deckMode==='capture'){
  if(port.deck){const axes=deckAxes(port,x,z),p=deckPoint(port,axes.side*(1-capture),axes.along+(62-axes.along)*(1-Math.exp(-.72*dt)));x=p.x;z=p.z}
  else{x-=side*capture;z+=(stop.z-z)*(1-Math.exp(-.72*dt))}
  alt+=(touchHeight-alt)*(1-Math.exp(-1.45*dt));airspeed*=Math.exp(-1.5*dt);
  if(encounter){const p=localToWorld(x,z);leaveBattle(p.wx,p.wz)}
  if(deckTime>3.4){deckMode='moored';airspeed=0;alt=touchHeight;x=stop.x;z=stop.z;recordFlight(Math.hypot(x-movingX,z-movingZ,alt-movingAlt));arrive(port)}
  else recordFlight(Math.hypot(x-movingX,z-movingZ,alt-movingAlt))
 }else if(deckMode==='moored'){
  
 }else{
  const prevX=x,prevZ=z,prevAlt=alt;
  airspeed=Math.min(105,airspeed+64*dt);x+=Math.sin(heading)*airspeed*dt;z+=Math.cos(heading)*airspeed*dt;alt+=Math.min(26,deckTime*14)*dt;
  recordFlight(Math.hypot(x-prevX,z-prevZ,alt-prevAlt));
  if(impact(prevX,prevZ,prevAlt))return true;
  if(deckTime>=2.2){
   deckMode='';cameraYaw=yaw;
   
   if(document.activeElement===$('thrust'))$('thrust').blur();
   syncFireButton()
  }
 }
 cameraYaw+=angleDelta(yaw-cameraYaw)*capture;return true
}
