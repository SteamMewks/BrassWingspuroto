function clearEncounter(){encounter=null;enemies=[];bolts=[];hostile=[];locked=null;trigger=false;syncFireButton()}
function fight(dt){
 if(encounter&&Math.hypot(encounter.x-x,encounter.z-z)>3200)clearEncounter();
 if(!encounter){
  encounter=localBases.concat(localShips).find(b=>affiliation(b.id)==='pirate'&&Math.hypot(b.x-x,b.z-z)<900);
  if(!encounter)return;
  deploy();syncFireButton();message=encounter.name+' 空賊防衛隊';messageUntil=t+4
 }
 reload=Math.max(0,reload-dt);
 for(const [i,e] of enemies.entries()){
  if(e.hp<=0){e.fall+=dt;e.y-=32*e.fall*dt;continue}
  moveEnemy(e,i,dt)
 }
 if(t>=nextAttack&&!enemies.some(e=>e.hp&&e.state==='attack')){
  const ready=enemies.filter(e=>e.hp&&e.state==='circle').sort((a,b)=>a.turn-b.turn);
  if(ready.length){switchMove(ready[0],'attack');ready[0].turn=Math.max(...enemies.map(e=>e.turn))+1;nextAttack=t+1}
 }
 chooseLock();
 if((trigger||keys.has('Space'))&&!trick&&reload<=0&&ammo>=1){
  ammo-=1;
  reload=.12;let vx=Math.sin(yaw),vz=Math.cos(yaw),vy=pitch*100/390;
  if(locked&&bearing(locked).angle<.19){
   const lead=bearing(locked).range/390,dx=locked.x-x+Math.sin(locked.heading)*80*lead,dz=locked.z-z+Math.cos(locked.heading)*80*lead,dy=locked.y-alt,n=Math.hypot(dx,dz,dy)||1;
   vx=.2*vx+.8*dx/n;vz=.2*vz+.8*dz/n;vy=.2*vy+.8*dy/n
  }
  bolts.push({x,z,y:alt,dx:vx*390,dz:vz*390,dy:vy*390,life:1.8})
 }
 grace=Math.max(0,grace-dt);
 for(const b of hostile){
  const dx=b.dx*dt,dz=b.dz*dt,dy=b.dy*dt;
  const u=Math.max(0,Math.min(1,((x-b.x)*dx+(z-b.z)*dz+(alt-b.y)*dy)/(dx*dx+dy*dy+dz*dz||1)));
  if(Math.hypot(b.x+dx*u-x,b.z+dz*u-z,b.y+dy*u-alt)<5){
   b.life=0;if(!grace){grace=1.2;adventure.wear=Math.min(40,adventure.wear+2);energy=Math.max(0,energy-25);message='被弾　EN −25%';messageUntil=t+1;if(!energy){down('敵弾');return}}
  }
  b.x+=dx;b.z+=dz;b.y+=dy;b.life-=dt
 }
 hostile=hostile.filter(b=>b.life>0);
 for(const b of bolts){
  const dx=b.dx*dt,dz=b.dz*dt,dy=b.dy*dt;
  for(const e of enemies){if(e.hp<=0)continue;
   const u=Math.max(0,Math.min(1,((e.x-b.x)*dx+(e.z-b.z)*dz+(e.y-b.y)*dy)/(dx*dx+dz*dz+dy*dy||1)));
   if(Math.hypot(e.x-b.x-u*dx,e.z-b.z-u*dz,e.y-b.y-u*dy)<7){
    e.hp--;if(e.hp)switchMove(e,'evade');e.hit=.17;b.life=0;if(!e.hp)award(250,'赤翼機撃墜');break
   }
  }
  b.x+=dx;b.z+=dz;b.y+=dy;b.life-=dt
 }
 bolts=bolts.filter(b=>b.life>0);
 if(enemies.length&&enemies.every(e=>!e.hp)){
  adventure.liberated.push(encounter.id);adventure.kills+=enemies.length;adventure.money+=60;
  encounter.side='friendly';landingPorts.push(encounter);message=encounter.name+' 解放　報酬60';messageUntil=t+5;
  clearEncounter();saveAdventure()
 }
}
