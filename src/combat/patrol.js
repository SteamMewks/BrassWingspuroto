let occupiedPorts=[];
function clearEncounter(){encounter=null;nextAttack=0;grace=0;reload=0;enemies=[];bolts=[];hostile=[];locked=null;trigger=false;syncFireButton()}
const battleHalf=2500,triggerRadius=900;
let encounterDelay=0;
const defenceCells=new Map(),reentryBlocked=new Set();
function indexDefenders(){
 defenceCells.clear();
 for(const b of occupiedPorts){
  const key=Math.floor(b.wx/triggerRadius)+','+Math.floor(b.wz/triggerRadius);
  if(!defenceCells.has(key))defenceCells.set(key,[]);
  defenceCells.get(key).push(b)
 }
}
function outsideBattle(wx,wz){return encounter&&Math.max(Math.abs(wx-encounter.wx),Math.abs(wz-encounter.wz))>battleHalf}
function homeDistance(wx,wz){return Math.hypot(wx-settlements.home.wx,wz-settlements.home.wz)}
function nearbyDefender(wx,wz){
 const cx=Math.floor(wx/triggerRadius),cz=Math.floor(wz/triggerRadius);
 let nearest=null,distance=triggerRadius;
 for(let i=cx-1;i<=cx+1;i++)for(let j=cz-1;j<=cz+1;j++)for(const b of defenceCells.get(i+','+j)||[]){
  const d=Math.hypot(b.wx-wx,b.wz-wz);if(encounterDelay>0&&d<triggerRadius)reentryBlocked.add(b.id);
  if(b.side==='pirate'&&!reentryBlocked.has(b.id)&&d<distance){nearest=b;distance=d}
 }
 return nearest
}
function leaveBattle(wx,wz){
 const safe=homeDistance(wx,wz)<400;
 if(!safe&&!outsideBattle(wx,wz))return false;
 if(encounter){
  clearEncounter();encounterDelay=4;nearbyDefender(wx,wz);
  message=safe?'本拠地へ安全に帰還':escapeLoss();messageUntil=t+5
 }
 return true
}
function fight(dt){
 if(!live)return;
 const {wx,wz}=localToWorld(x,z);
 if(leaveBattle(wx,wz))return;
 encounterDelay=Math.max(0,encounterDelay-dt);
 if(!encounter){
  for(const id of reentryBlocked){const b=outposts[id];if(Math.hypot(wx-b.wx,wz-b.wz)>=triggerRadius)reentryBlocked.delete(id)}
  const candidate=nearbyDefender(wx,wz);if(encounterDelay)return;
  encounter=candidate;
  if(!encounter)return;
  deploy();syncFireButton();message=encounter.name+' 空賊防衛隊接近';messageUntil=t+4;
  if(tutorialBattle())return
 }
 reload=Math.max(0,reload-dt);
 for(const [i,e] of enemies.entries()){
  if(e.hp<=0){e.fall+=dt;e.y-=32*e.fall*dt;continue}
  moveEnemy(e,i,dt);
  const pos=localToWorld(e.x,e.z),distance=homeDistance(pos.wx,pos.wz);
  if(distance<400){const a=Math.atan2(pos.wx-settlements.home.wx,pos.wz-settlements.home.wz);const safe=worldToLocal(settlements.home.wx+401*Math.sin(a),settlements.home.wz+401*Math.cos(a));e.x=safe.x;e.z=safe.z;e.heading=a}
 }
 if(t>=nextAttack&&!enemies.some(e=>e.hp&&e.state==='attack')){
  const ready=enemies.filter(e=>e.hp&&e.state==='circle').sort((a,b)=>a.turn-b.turn);
  if(ready.length){switchMove(ready[0],'attack');ready[0].turn=Math.max(...enemies.map(e=>e.turn))+1;nextAttack=t+1}
 }
 chooseLock();
 if((trigger||keys.has('Space'))&&!trick&&reload<=0&&adventure.ammo>=1){
  adventure.ammo--;
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
    e.hp--;if(e.hp)switchMove(e,'evade');e.hit=.17;b.life=0;if(!e.hp){adventure.kills++;saveAdventure();award(250,'空賊機撃墜')}break
   }
  }
  b.x+=dx;b.z+=dz;b.y+=dy;b.life-=dt
 }
 bolts=bolts.filter(b=>b.life>0);
 if(enemies.length&&enemies.every(e=>!e.hp)){
  adventure.liberated.push(encounter.id);adventure.money+=60;
  encounter.side='friendly';landingPorts.push(encounter);occupiedPorts=occupiedPorts.filter(b=>b!==encounter);message=encounter.name+' 解放　報酬60';messageUntil=t+5;
  const freed=encounter.id;clearEncounter();encounterDelay=4;saveAdventure();tutorialLiberation(freed)
 }
}
