let crash=null;
function restartFlight(){
 crash=null;yaw=cameraYaw=bank=pitch=t=phase=elapsedTrick=0;
 trick=null;power=0;airspeed=0;score=0;
 spray=[];sprayClock=0;wake.length=0;wakeTime=0;found.clear();
 clearFlightInput();$('score').textContent='0 pt';$('thrust').value='0';
 document.querySelector('.card h1').textContent='Brass Wings';
 document.querySelector('.card p').innerHTML=flightInstructions
}
function hitObject(X,Z,Y){
 const m=worldRegion();if(Y>=650&&Math.abs(X+m.wx-50000)<11200&&Math.abs(Z+m.wz-50000)<11200){
  if(skyContact(X+m.wx,Y,Z+m.wz))return wonders[0].name;
  const ruin=ruinContact(X+m.wx,Y,Z+m.wz);if(ruin)return ruin
 }for(const s of relics)if(relicDistance(s,X+m.wx,Y,Z+m.wz)<2)return s.name;
 for(const spur of baseSpurs){const p=spur.end,dx=X-p.x,dz=Z-p.z; if(Math.abs(dx*p.dz-dz*p.dx+13)<5&&Math.abs(dx*p.dx+dz*p.dz)<10.5&&Y<p.y+8)return '貨物倉庫'}
 const rail=railHit(X,Z,Y);if(rail)return rail;
 for(const offset of [-3.8,0,3.8]){
  const px=X+offset*Math.cos(yaw),pz=Z-offset*Math.sin(yaw),py=Y-offset*Math.sin(bank*.62);
  if(encounter)for(const e of enemies){
   if(e.hp>0&&Math.abs(py-e.y)<2.4&&Math.hypot(px-e.x,pz-e.z)<5.4)return '敵機'
  }
  for(const b of quarters){
   const u=px-b.x,v=pz-b.z;
   if(Math.abs(u)>b.radius||Math.abs(v)>b.radius)continue;
   const dx=Math.abs(u*Math.cos(b.angle)+v*Math.sin(b.angle)),dz=Math.abs(v*Math.cos(b.angle)-u*Math.sin(b.angle));
   if(dx<b.w/2&&dz<b.l/2&&py<=b.y+b.h||!b.industry&&dx<=b.w*.5&&dz<=b.l*.5&&py<=b.y+b.h+(4+b.w*.13)*(1-2*dx/b.w))return '建物'
  }
  if(cliffs.length&&hitsArch(px,pz,py))return '岩のアーチ';
  const land=ground(px,pz);if(land&&py-.55<=land)return '地面';
  const water=riverAt(px+worldRegion().wx,pz+worldRegion().wz);if(water&&py-.55<=water.height)return '川面';
  if(overDeck(px,pz)&&py-.55<=deckHeight)return '船体';
  const carrier=deckAt(px,pz);if(carrier)for(const [dx,dz,y,width,length,height] of shipStructures){
   const axes=deckAxes(carrier,px,pz);
   if(Math.abs(axes.side-dx)<=width/2&&Math.abs(axes.along-dz)<=length/2&&py-.55<=y+height&&py+.55>=y)return '艦橋'
  }
  for(const b of localBases){
   if(Math.abs(px-b.x)>400||Math.abs(pz-b.z)>180)continue;
   for(const obj of baseFacilities(b))
    if(Math.abs(px-b.x-obj.x)<obj.w/2&&Math.abs(pz-b.z-obj.z)<obj.l/2&&py<=b.height+obj.y+obj.h&&py>=b.height+obj.y)return '基地施設'
  }
  for(let i=Math.floor((px-11)/256);i<=Math.floor((px+11)/256);i++)for(let j=Math.floor((pz-11)/256);j<=Math.floor((pz+11)/256);j++)for(const tree of tileCache.get(i+","+j)?.trees||[]){
   if(Math.abs(tree.X-px)>11||Math.abs(tree.Z-pz)>11)continue;
   const r=branchRadius(tree,py-tree.Y);if(r&&Math.hypot(px-tree.X,pz-tree.Z)<r+.55)return '木'
  }
 }
 return ''
}
function impact(px,pz,py){
 const steps=Math.max(1,Math.ceil(Math.hypot(x-px,z-pz,alt-py)/1.6));
 for(let i=1;i<=steps;i++){
  const u=i/steps,X=px+(x-px)*u,Z=pz+(z-pz)*u,Y=py+(alt-py)*u,cause=hitObject(X,Z,Y);
  if(!cause)continue;
  x=X;z=Z;alt=Y;down(cause);
  return true
 }
 return false
}
function down(cause){
  saveAdventure();
  live=false;syncAudio();clearFlightInput();
  crash={cause,age:0,pieces:Array.from({length:36},(_,j)=>({dx:(rand()-.5)*.38,dy:-rand()*.31-.035,spin:(rand()-.5)*8,c:['#b18b52','#454c40','#f9be68','#745247'][j%4]}))};
}
function wreck(dt){
 crash.age+=dt;const a=crash.age;
 for(const bit of crash.pieces){
  g.save();g.translate(w*.5+bit.dx*w*a,h*.58+h*(bit.dy*a+.32*a*a));g.rotate(bit.spin*a);
  g.fillStyle=bit.c;g.fillRect(-3,-1,7,3);g.restore()
 }
 if(a>=1&&$('cover').hidden){
  showPanel('crash','GAME OVER',(crash.cause==='エネルギー切れ'?crash.cause:crash.cause+'に接触')+'　'+score+' pt　'+('発見 '+found.size))

 }
}
