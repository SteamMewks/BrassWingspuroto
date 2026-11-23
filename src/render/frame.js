function draw(dt){
 if(panel==='title'){
  surfaceRenderer?.hide();
  if(aircraftLayer)aircraftLayer.hidden=true;
  const backdrop=frontInk.createLinearGradient(0,0,0,h);
  backdrop.addColorStop(0,'#52496b');backdrop.addColorStop(.44,'#c87976');backdrop.addColorStop(1,'#29474e');
  frontInk.fillStyle=backdrop;frontInk.fillRect(0,0,w,h);return
 }
 if(live)railClock+=dt;
 if(live)enterNearbyRegion();
 selectFlightLayer(dt);
 if(!inSky)updateWorld();
 const wasWaiting=deckMode==='moored';
 if(live&&deckAssist(dt)){
  if(!wasWaiting)t+=dt
 }else if(live){
  let lr=ax+Number(keys.has('ArrowRight'))-Number(keys.has('ArrowLeft')),ud=-ay+Number(keys.has('ArrowUp'))-Number(keys.has('ArrowDown'));const px=x,pz=z,py=alt;
 const returning=returnHeading!==null;
 if(returning){
  const error=Math.atan2(Math.sin(returnHeading-yaw),Math.cos(returnHeading-yaw));
  lr=Math.max(-1,Math.min(1,error*2.6));
  if(Math.abs(error)<.12)returnHeading=null
 }
 bank+=(Math.max(-1,Math.min(1,lr))-bank)*(1-Math.exp(-8*dt));pitch+=(Math.max(-1,Math.min(1,ud))-pitch)*(1-Math.exp(-6*dt));yaw+=bank*dt*(returning?2:1.03+.15*power);if(!trick)applyClimb(dt);advance(dt);limitAirspace();discoverRelics();if(!impact(px,pz,py)){fight(dt);updateSpray(dt)}cameraYaw+=(yaw-cameraYaw)*(1-Math.exp(-5.6*dt));t+=dt}
g=surfaceRenderer?.sky()||frontInk;
let horizon=h*(.36+pitch*.09),f=h*(.62-.10*Math.max(0,(airspeed-78)/54));let sky=g.createLinearGradient(0,0,0,horizon);sky.addColorStop(0,'#52496b');sky.addColorStop(.65,'#c87976');sky.addColorStop(1,'#f4b479');g.fillStyle=sky;g.fillRect(0,0,w,horizon+1);const sunAngle=.12-cameraYaw;if(Math.cos(sunAngle)>.1){let sunX=w/2+f*Math.tan(sunAngle),radius=h*.033;ellipse(sunX,horizon-radius*(1.7-Math.min(1,t/180)*2.5),radius,radius,'#ffda9b')}const seaBands=inSky?['#e3d2c5','#eddfd4','#eadfd7','#e7dad2','#dfd5cf','#e7dad2','#efdfd4','#e7dad2','#e6d7cd','#e3d2c5']:waterPalette(x+worldRegion().wx,z+worldRegion().wz);
for(let i=0;i<seaBands.length;i++){
 const y0=Math.floor(horizon+(h-horizon)*(i/10)**1.7),y1=Math.ceil(horizon+(h-horizon)*((i+1)/10)**1.7);
 g.fillStyle=seaBands[i];g.fillRect(0,y0,w,y1-y0)
}
let objects=[],nearest=Infinity,target;
function project(X,Z,Y){let dx=X-x,dz=Z-z,d=32+dx*Math.sin(cameraYaw)+dz*Math.cos(cameraYaw);if(d<2||d>3600)return;let s=f/d;return [w/2+(dx*Math.cos(cameraYaw)-dz*Math.sin(cameraYaw))*s,horizon+(alt+(.58*h-horizon)*32/f-Y)*s,s,d]}
function add(X,Z,Y,fn){let p=project(X,Z,Y);if(p)objects.push([p[3],()=>fn(...p)])}
if(alt<480)for(let i=-6;i<=6;i++)for(let j=-6;j<=6;j++){let A=Math.floor(x/240)+i,B=Math.floor(z/240)+j,n=Math.sin(A*78.1+B*21.7)*43758,n1=n-Math.floor(n),X=A*240+n1*165,Z=B*240+(1-n1)*125;if(n1>.66)add(X,Z,160+n1*90,(a,b,s)=>{g.imageSmoothingEnabled=false;g.drawImage(cloudArt[Math.floor(n1*21)%5],a-52*s,b-19*s,104*s,33*s)})}
 const detail=inSky?0:groundDetailRange(alt-ground(x,z));
 const [offshoreWave,channelWave]=inSky?[0,0]:waterWeights(x+worldRegion().wx,z+worldRegion().wz);
 // World-anchored glints enlarge and separate as they approach the camera.
 if(detail>.45)for(let i=-9;i<=9;i++)for(let j=-9;j<=9;j++){
  const ix=Math.floor(x/24)+i,iz=Math.floor(z/24)+j,n=noise(ix,iz,813);
  const X=(ix+n)*24,Z=(iz+noise(ix,iz,814))*24,p=project(X,Z,0);
  if(!p||p[0]<-50||p[0]>w+50||p[1]>h+5)continue;
  const swell=.5+.5*Math.sin((X+worldRegion().wx)*.016+(Z+worldRegion().wz)*(.032+channelWave*.025)-railClock*.75);
  const length=Math.min(64,(1.4+n*4+offshoreWave*8*swell+channelWave*2)*p[2]),glow=Math.cos(cameraYaw-.12)>.5&&Math.abs(p[0]-w/2-f*Math.tan(sunAngle))<w*.16;
  g.fillStyle=glow?'#deaa91':n>.55?'#a998a3':'#777789';
  g.fillRect(Math.round(p[0]),Math.round(p[1]),Math.max(1,length),Math.max(1,p[2]*.12));
 }
if(!inSky){
 const landmarks=[...waterfalls.map(s=>[s.a[0]-worldRegion().wx,s.a[1]-worldRegion().wz,watersheds.basins[s.reach.basin].name+'の滝']),...isles,[...worldRegion().town,regions[worldRegion().region]]];
 if(worldRegion().region===1)landmarks.push([passAxis(4992),4992,'白嶺峠'],[passAxis(3648)+270,3648,'赤棚鉱山市']);
 for(const b of localShips)landmarks.push([b.x,b.z,b.name]);
 for(const [X,Z,name,kind] of landmarks){
  if(kind===2)continue;
  const key=X+','+Z,d=Math.hypot(x-X,z-Z);
  if(live&&!deckMode&&d<145&&!found.has(key)){found.add(key);award(250,name+' 発見')}
  if(!found.has(key)&&d<nearest){nearest=d;target=[X,Z,name]}
 }
}
 // Clip each horizontal land slice at the camera before projecting it.
 const sn=Math.sin(cameraYaw),cs=Math.cos(cameraYaw),eye=alt+(.58*h-horizon)*32/f;
 if(!inSky){
 const mainlandPath=new Path2D();
 for(const layer of terraces){
  if(Math.abs(x-layer.cx)>layer.rx*1.25+16000||Math.abs(z-layer.cz)>layer.rz*1.25+16000)continue;
  const ring=layer.ring.map(([X,Z])=>[(X-x)*cs-(Z-z)*sn,32+(X-x)*sn+(Z-z)*cs]);
  const clipped=[];
  for(let i=0;i<ring.length;i++){let a=ring[(i+ring.length-1)%ring.length],b=ring[i];
   if((a[1]>2)!==(b[1]>2)){let u=(2-a[1])/(b[1]-a[1]);clipped.push([a[0]+u*(b[0]-a[0]),2])}
   if(b[1]>2)clipped.push(b)
  }
  if(clipped.length>2){
   const pts=clipped.map(([side,d])=>[w/2+side*f/d,horizon+(eye-layer.y)*f/d]);
   if(layer.mainland){
    pts.forEach(([u,v],i)=>i?mainlandPath.lineTo(u,v):mainlandPath.moveTo(u,v));mainlandPath.closePath()
   }else if(layer.y===0)poly(pts,layer.color)
  }
 }
 g.fillStyle='#81895c';g.fill(mainlandPath,'evenodd');
 }
 drawScenery(sn,cs,eye,f,horizon,objects);
 if(detail>.1)for(const pixel of groundPixels){
  if(Math.abs(pixel.X-x)>580*detail||Math.abs(pixel.Z-z)>580*detail)continue;
  const pt=project(pixel.X,pixel.Z,pixel.Y+.06);
  if(!pt||pt[0]<-8||pt[0]>w+8||pt[1]>h+8||pt[1]<horizon)continue;
  const wid=Math.min(44,pt[2]*pixel.width);if(wid<1)continue;
  g.fillStyle=pixel.color;g.fillRect(Math.round(pt[0]),Math.round(pt[1]),Math.ceil(wid),Math.max(1,Math.round(wid*.33)))
 }
 const mist=Math.max(cloudVeil,Math.max(0,1-Math.abs(alt-575)/92)*.84);
 if(groundWarmup)groundWarmup--;
 if(mist){g.fillStyle='rgba(235,222,218,'+mist+')';g.fillRect(0,0,w,h)}
 const onCarrier=overDeck(x,z)&&ground(x,z)<deckHeight;
 const levels=inSky?skyLevels(x+worldRegion().wx,z+worldRegion().wz):null;
 const aboveIsland=levels&&alt>=levels.top;
 const floorY=aboveIsland?levels.top:onCarrier?deckHeight:ground(x,z),clearance=Math.max(0,alt-floorY);
 if(!inSky&&clearance<95&&!crash){
  const offset=clearance*.48,roll=bank*.62+(trick==='roll'?hand*phase:0),loop=trick==='loop'?phase:0;
  const sx=x-Math.sin(.12)*offset,sz=z-Math.cos(.12)*offset;
  const silhouette=shadowOutline.map(([side,nose])=>{
   const u=side*Math.cos(roll),v=nose*Math.cos(loop)+side*Math.sin(roll)*Math.sin(loop);
   const X=sx+Math.cos(yaw)*u+Math.sin(yaw)*v,Z=sz-Math.sin(yaw)*u+Math.cos(yaw)*v;
   return project(X,Z,ground(X,Z)+.03)
  });
  if(silhouette.every(Boolean))poly(silhouette,'rgba(52,44,62,'+(.46*(1-clearance/95))+')')
 }
 if(detail>.45)for(const tree of groves){
  if(Math.abs(tree.X-x)>145*detail||Math.abs(tree.Z-z)>145*detail)continue;
  const p=project(tree.X,tree.Z,tree.Y),end=project(tree.X-tree.H*.13,tree.Z-tree.H*.75,tree.Y);
  if(!p||!end||p[0]<-80||p[0]>w+80)continue;
  const width=tree.R*p[2]*.65;
  poly([[p[0]-width*.2,p[1]],[end[0]-width,end[1]],[end[0],end[1]-width*.16],[end[0]+width,end[1]],[p[0]+width*.2,p[1]]],'rgba(57,56,58,.23)')
 }
 if(detail>0&&!surfaceRenderer?.hasTrees())for(const tree of groves){
  const distance=Math.hypot(tree.X-x,tree.Z-z);if(distance>=620*detail)continue;
  add(tree.X,tree.Z,tree.Y,(a,b,s)=>{
  if(a+tree.R*s<0||a-tree.R*s>w)return;
  const width=tree.R*2*s,height=tree.H*s;
  g.imageSmoothingEnabled=false;
  g.globalAlpha=Math.min(1,(620-distance)/150);
  g.drawImage(pines[Math.abs(Math.floor(tree.X))%pines.length],a-width/2,b-height,width,height);g.globalAlpha=1;
 })}
 for(const p of spray){
  const age=t-p.birth,height=Math.max(.05,.2+p.vy*age-12*age*age);
  add(p.x+p.vx*age,p.z+p.vz*age,height,(sx,sy,k)=>ellipse(sx,sy,Math.max(.6,p.r*k),Math.max(.7,p.r*k*1.35),'rgba(255,231,216,'+Math.max(0,1-age/.6)+')'))
 }
 // Sample both wing tips in world space so the wake stays behind the aircraft.
 if(live&&airspeed>0&&t>=wakeTime){
  wakeTime=t+.035;
  const roll=bank*.62+(trick==='roll'?hand*phase:0), tilt=trick==='loop'?phase:0;
  const span=Math.min(w/79,h/115)*26*32/f;
  const tips=[-1,1].map(sign=>{
   const lateral=sign*span*Math.cos(roll),vertical=sign*span*Math.sin(roll);
   return [x+Math.cos(yaw)*lateral-Math.sin(yaw)*vertical*Math.sin(tilt),z-Math.sin(yaw)*lateral-Math.cos(yaw)*vertical*Math.sin(tilt),alt+vertical*Math.cos(tilt)]
  });
  wake.push({tips,time:t,alpha:trick?.62:.15+.2*power});
  while(wake.length&&t-wake[0].time>.74)wake.shift()
 }
 for(let n=1;n<wake.length;n++)for(let wing=0;wing<2;wing++){
  const prev=project(...wake[n-1].tips[wing]),cur=project(...wake[n].tips[wing]);
  if(!cur||!prev)continue;
  objects.push([(prev[3]+cur[3])/2,()=>{g.beginPath();g.moveTo(prev[0],prev[1]);g.lineTo(cur[0],cur[1]);g.lineWidth=1;g.strokeStyle='rgba(255,244,209,'+Math.max(0,wake[n].alpha*(1-(t-wake[n].time)/.74))+')';g.stroke()}])
 }
 // Fixed wisps in world space give near-field parallax over open water.
 for(let i=-2;i<=2;i++)for(let j=-2;j<=2;j++){
  const cellX=Math.floor(x/55)+i,cellZ=Math.floor(z/55)+j;
  const hash=Math.sin(cellX*81.7+cellZ*29.3)*23991;
  const unit=hash-Math.floor(hash),wx=(cellX+unit)*55,wz=(cellZ+1-unit)*55;
  const wy=Math.floor(alt/38)*38+unit*36;
  const head=project(wx,wz,wy),tail=project(wx,wz+6,wy+.35);
  if(!head||!tail||head[3]>120||head[3]<9)continue;
  objects.push([head[3],()=>{g.beginPath();g.moveTo(head[0],head[1]);g.lineTo(tail[0],tail[1]);g.lineWidth=1;g.strokeStyle='rgba(245,248,213,'+(.15+.22*airspeed/132)+')';g.stroke()}])
 }
 if(encounter){
  for(const e of enemies){if(e.fall>1.8)continue;add(e.x,e.z,e.y,(a,b,k)=>{
   const index=(Math.round((e.heading-cameraYaw)*24/tau)%24+24)%24;
   if(!enemyFrames.has(index))enemyFrames.set(index,plane(index*tau/24));
   const span=k*22;g.save();g.translate(a,b);g.rotate(e.fall*4+e.bank);g.drawImage(enemyFrames.get(index),-span/2,-span/2,span,span);g.restore();
   if(e.state==="attack"&&e.warning&&e.hp)ellipse(a,b,Math.max(3,k*2),Math.max(3,k*2),"#ffdb77");
   if(e.hit||e.fall)ellipse(a,b,Math.max(2,k*2),Math.max(2,k*2),'#ffc981')
  })}
  for(const b of hostile)add(b.x,b.z,b.y,(a,y,k)=>ellipse(a,y,Math.max(2,k*.55),Math.max(2,k*.55),"#ff9468"));
  for(const shot of bolts)add(shot.x,shot.z,shot.y,(a,b,k)=>ellipse(a,b,Math.max(1,k*.32),Math.max(1,k*.65),'#fff2a5'));
 }
 objects.sort((a,b)=>b[0]-a[0]);objects.forEach(o=>o[1]());if(aircraftLayer)aircraftLayer.hidden=Boolean(crash);if(crash)wreck(dt);else plane();$('meter').textContent=(alt<3?alt.toFixed(1):Math.round(alt))+' m　'+(alt>=620?'雲上　':alt>=480?'雲層　':'')+Math.round(((yaw*180/Math.PI)%360+360)%360)+'°\n'+(aboveIsland?'天空地表':onCarrier?'甲板':'地表')+' '+clearance.toFixed(clearance<10?1:0)+' m';if(encounter){
 const aim=project(x+Math.sin(yaw)*190,z+Math.cos(yaw)*190,alt+pitch*100*190/390);
 if(aim&&!crash){g.beginPath();g.arc(aim[0],aim[1],8,0,tau);g.lineWidth=1.5;g.strokeStyle='#fff1c7';g.stroke()}
 if(locked&&locked.hp){const mark=project(locked.x,locked.z,locked.y);if(mark){const [a,b,k]=mark,r=Math.max(11,k*9);g.strokeStyle="#aaf5cd";g.lineWidth=2;g.strokeRect(a-r,b-r,r*2,r*2)}}
 const enemy=locked?.hp?locked:enemies.filter(e=>e.hp>0).sort((a,b)=>Math.hypot(a.x-x,a.z-z)-Math.hypot(b.x-x,b.z-z))[0];
 $('place').textContent=encounter.name+' 空賊 '+enemies.filter(e=>e.hp).length+'機';
 }else{worldMinimap();let dir=target?Math.atan2(target[0]-x,target[1]-z)-yaw:0;$('place').textContent=target?['↑','↗','→','↘','↓','↙','←','↖'][(Math.round(dir/(tau/8))%8+8)%8]+' '+target[2]+'　'+(nearest/1000).toFixed(1)+' km　'+'発見 '+found.size:'自由飛行'}
 if(adventure.job&&!deckMode&&!encounter){
  const site=jobDestination(),p=worldToLocal(site.wx,site.wz),angle=Math.atan2(p.x-x,p.z-z)-yaw;
  const arrow=['↑','↗','→','↘','↓','↙','←','↖'][((Math.round(angle/(tau/8))%8)+8)%8];
  $('place').textContent=arrow+' '+site.name+'　'+(Math.hypot(p.x-x,p.z-z)/1000).toFixed(1)+' km'
 }
 if(deckMode&&live)$('place').textContent=landingSite.name;
 $('feedback').textContent=t<messageUntil?message:'';
 const scoreboard=(encounter?'弾 '+Math.floor(ammo)+'　EN '+Math.ceil(energy)+'%　':'')+score+' pt';
 if($('score').textContent!==scoreboard)$('score').textContent=scoreboard}
