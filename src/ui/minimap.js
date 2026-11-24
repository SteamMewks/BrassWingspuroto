function minimapBox(){
 const side=Math.min(108,Math.round(w*.24),Math.round(h*.26));
 return {side,left:w-side-10,top:Math.max(63,h*.205)}
}
function discoverRelics(){
 const {wx,wz}=localToWorld(x,z);
 const job=adventure.job;
 if(job?.kind==='survey'&&!job.ready){
  const site=relics.find(s=>s.id==='orrery');
  if(relicDistance(site,wx,alt,wz)<site.reach){job.ready=true;saveAdventure();message='観測完了　依頼主へ報告';messageUntil=t+4}
 }
 for(const s of wonders){
  if(discoveries[s.id]||!withinWonder(s,wx,alt,wz))continue;
  discoveries[s.id]=new Date().toISOString();saveAdventure();
  message=s.name+' 発見　探訪記録に登録されました';messageUntil=t+4
 }
 for(const s of relics)if(!discoveries[s.id]&&relicDistance(s,wx,alt,wz)<s.reach){
  discoveries[s.id]=new Date().toISOString();saveAdventure();
  message='未知の構造物を発見 — '+s.name+'　探訪記録に登録されました';messageUntil=t+4
 }
}
function worldMinimap(){
 const {side,left,top}=minimapBox(),scale=(side-8)/worldSize;
 const X=wx=>left+4+wx*scale,Z=wz=>top+4+(worldSize-wz)*scale;
 g.fillStyle='rgba(24,40,44,.82)';g.fillRect(left,top,side,side);
 g.drawImage(worldMap,left+4,top+4,side-8,side-8);
 g.strokeStyle='#d3b783';g.lineWidth=1;g.strokeRect(left+4,top+4,side-8,side-8);
 g.fillStyle='#ffe999';for(const s of journalSites)if(discoveries[s.id])g.fillRect(X(s.x)-2,Z(s.z)-2,4,4);
 g.fillStyle='#e3bd79';
 for(const b of [...localBases,...localShips]){
  const cx=X(b.wx),cz=Z(b.wz),color=colors[b.side];g.fillStyle=color;
  if(b.id==='home')poly([[cx,cz-3],[cx+3,cz],[cx,cz+3],[cx-3,cz]],color);
  else if(b.deck)poly([[cx,cz-2],[cx+2,cz+2],[cx-2,cz+2]],color);
  else if(b.kind){g.beginPath();g.arc(cx,cz,1.8,0,tau);g.fill()}
  else g.fillRect(cx-1.5,cz-1.5,3,3)
 }
 const target=outposts[waypointId]||jobDestination();
 if(target){g.strokeStyle='#fff3a1';g.strokeRect(X(target.wx)-4,Z(target.wz)-4,8,8)}
 const {wx,wz}=localToWorld(x,z);
 g.save();g.translate(X(wx),Z(wz));g.rotate(yaw);
 poly([[0,-4],[-3,3],[0,2],[3,3]],'#b7fff0');g.restore()
}
function battleMinimap(){
 const {left,top,side}=minimapBox(),scale=(side-8)/(battleHalf*2),cx=left+side/2,cz=top+side/2;
 const X=wx=>cx+(wx-encounter.wx)*scale,Z=wz=>cz-(wz-encounter.wz)*scale;
 g.save();g.fillStyle='#263c42';g.fillRect(left,top,side,side);g.strokeStyle='#ffc76e';g.strokeRect(left+4,top+4,side-8,side-8);
 g.beginPath();g.rect(left+4,top+4,side-8,side-8);g.clip();
 g.strokeRect(cx-3,cz-3,6,6);
 for(const enemy of enemies)if(enemy.hp){const p=localToWorld(enemy.x,enemy.z);g.fillStyle='#ff7369';g.fillRect(X(p.wx)-2,Z(p.wz)-2,4,4)}
 const p=localToWorld(x,z);g.translate(X(p.wx),Z(p.wz));g.rotate(yaw);poly([[0,-5],[-3,3],[3,3]],colors.player);g.restore()
}
