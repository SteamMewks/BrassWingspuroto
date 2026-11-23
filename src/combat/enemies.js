let encounter=null,returnHeading=null;
function limitAirspace(){
 const center=worldToLocal(worldSize/2,worldSize/2),dx=x-center.x,dz=z-center.z,limit=worldSize/2,margin=limit-Math.max(Math.abs(dx),Math.abs(dz)),bx=Math.max(-limit,Math.min(limit,dx))-dx,bz=Math.max(-limit,Math.min(limit,dz))-dz;
 if(returnHeading===null&&margin<=0){
  returnHeading=Math.atan2(-dx,-dz);message='空域端　自動旋回';messageUntil=t+2.5
 }
 x+=bx;z+=bz
}
function deploy(){
 const height=Math.max(64,Math.min(alt,230));
 for(let i=0;i<3;i++){
  const side=(i-1)*32,forward=175-Math.abs(i-1)*26;
  enemies.push({x:x+Math.sin(yaw)*forward+Math.cos(yaw)*side,z:z+Math.cos(yaw)*forward-Math.sin(yaw)*side,y:height+i*3,
   heading:yaw+.35,hp:2,hit:0,fall:0,state:'formation',age:0,tail:0,sign:i%2?1:-1,bank:0,turn:i})
 }
}
function angleDelta(n){return Math.atan2(Math.sin(n),Math.cos(n))}
function switchMove(e,state){
 e.state=state;e.age=0;e.tail=0;e.depart=e.heading+e.sign*(state==='evade'?1.1:.65);
 if(state==='attack'){e.warning=0;e.fired=0;e.shotTime=0}
}
function bearing(e){
 const dx=e.x-x,dz=e.z-z,range=Math.hypot(dx,dz);
 return {range,angle:Math.hypot(angleDelta(Math.atan2(dx,dz)-yaw),Math.atan2(e.y-alt,range)-Math.atan(pitch*100/390))}
}
function chooseLock(){
 if(locked&&locked.hp>0){const b=bearing(locked);if(b.range<680&&b.angle<.63)return}
 locked=null;let best=.35;
 for(const e of enemies){if(e.hp<=0)continue;const b=bearing(e);
  if(b.range<520&&b.angle<best){best=b.angle;locked=e}
 }
}
function moveEnemy(e,i,dt){
 e.age+=dt;e.hit=Math.max(0,e.hit-dt);
 const dx=x-e.x,dz=z-e.z,d=Math.hypot(dx,dz),toward=Math.atan2(dx,dz);
 let aim=e.heading,speed=80,height=Math.max(62,alt+i*4);
 if(e.state==='formation'){
  speed=70;if(trigger||keys.has('Space')||d<128||e.age>4)switchMove(e,'circle')
 }else if(e.state==='circle'){
  const a=t*.21+i*tau/3;
  aim=Math.atan2(x+230*Math.sin(a)-e.x,z+230*Math.cos(a)-e.z);
 }else if(e.state==='attack'){
  const lateral=e.sign*42;
  aim=Math.atan2(dx+Math.sin(yaw)*65+Math.cos(yaw)*lateral,dz+Math.cos(yaw)*65-Math.sin(yaw)*lateral);
  speed=112;height=Math.max(55,alt+6);
  if(!e.warning&&d<420&&Math.abs(angleDelta(toward-e.heading))<.55){
   e.warning=.85;message='敵機接近　射撃予告';messageUntil=t+1
  }
  if(e.warning){e.warning+=dt;e.shotTime-=dt;
   if(e.warning>=1.7&&e.shotTime<=0&&e.fired<3){
    const lead=d/245,tx=dx+Math.sin(yaw)*airspeed*lead,tz=dz+Math.cos(yaw)*airspeed*lead,ty=alt-e.y+pitch*35*lead,n=Math.hypot(tx,tz,ty)||1;
    hostile.push({x:e.x,z:e.z,y:e.y,dx:245*tx/n,dz:245*tz/n,dy:245*ty/n,life:2.8});e.fired++;e.shotTime=.18
   }
  }
  if(e.fired===3||d<52||e.age>6){switchMove(e,'exit');nextAttack=t+1}
 }else{
  aim=e.depart;speed=e.state==='exit'?110:86;
  if(e.age>2.5)switchMove(e,'circle')
 }
 if(e.state==='circle'||e.state==='attack'){
  const chased=d<245&&Math.abs(angleDelta(toward-e.heading))>2.55&&bearing(e).angle<.38;
  e.tail=chased?e.tail+dt:0;if(e.tail>1.15)switchMove(e,'evade')
 }
 const center=encounter;
 if(Math.max(Math.abs(e.x-center.x),Math.abs(e.z-center.z))>2200)aim=Math.atan2(center.x-e.x,center.z-e.z);
 const rate=Math.max(-1.32,Math.min(1.32,angleDelta(aim-e.heading)*2));
 e.bank+=(rate*.46-e.bank)*(1-Math.exp(-5*dt));e.heading+=rate*dt;
 e.x+=Math.sin(e.heading)*speed*dt;e.z+=Math.cos(e.heading)*speed*dt;e.y+=Math.max(-24,Math.min(24,height-e.y))*dt
}
