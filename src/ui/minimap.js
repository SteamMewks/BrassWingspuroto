function minimapBox(){
 const side=Math.min(108,Math.round(w*.24),Math.round(h*.26));
 return {side,left:w-side-10,top:Math.max(63,h*.205)}
}
function discoverRelics(){
 const {wx,wz}=localToWorld(x,z);
 for(const s of wonders){
  if(discoveries[s.id]||!withinWonder(s,wx,alt,wz))continue;
  discoveries[s.id]=new Date().toISOString();saveCampaign();
  message=s.name+' 発見　探訪記録に登録されました';messageUntil=t+4
 }
 for(const s of relics)if(!discoveries[s.id]&&relicDistance(s,wx,alt,wz)<s.reach){
  discoveries[s.id]=new Date().toISOString();saveCampaign();
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
 for(const b of Object.values(airbases))g.fillRect(X(b.wx)-1,Z(b.wz)-1,2,2);
 g.fillStyle='#a5dfe3';for(const b of Object.values(carriers))g.fillRect(X(b.wx)-1,Z(b.wz)-1,3,2);
 const {wx,wz}=localToWorld(x,z);
 g.save();g.translate(X(wx),Z(wz));g.rotate(yaw);
 poly([[0,-4],[-3,3],[0,2],[3,3]],'#b7fff0');g.restore()
}
function patrolMap(){
 const {side,left,top}=minimapBox();
 const zoom=ammo>18&&energy>25&&enemies.some(e=>e.hp>0),scale=(side-8)/(zoom?1250:2*boundary);
 const center=airspaceCenter();
 const mx=X=>left+side/2+(X-(zoom?x:center.x))*scale,my=Z=>top+side/2-(Z-(zoom?z:center.z))*scale;
 g.fillStyle='rgba(24,40,44,.82)';g.fillRect(left,top,side,side);
 g.strokeStyle='#d3b783';g.lineWidth=1;g.strokeRect(left+4,top+4,side-8,side-8);
 g.save();g.beginPath();g.rect(left+4,top+4,side-8,side-8);g.clip();
 g.save();g.translate(mx(0),my(0));g.scale(scale,-scale);g.fillStyle='#778469';
 g.fill(mainlandPlan,'evenodd');g.fill(islandPlan);g.restore();
 for(const wall of cliffs)poly([...wall.map(row=>row[2]),...wall.map(row=>row[6]).reverse()].map(([X,Y,Z])=>[mx(X),my(Z)]),'#a5987e');
 if(cliffs.length){g.fillStyle='#e2bd8e';g.fillRect(mx(archX-165),my(archZ),330*scale,2)}
 for(const b of quarters){g.fillStyle=b.roof;g.fillRect(mx(b.x),my(b.z),Math.max(1,b.w*scale),Math.max(1,b.l*scale))}

 for(const b of localShips){g.fillStyle='#b6eaf0';g.fillRect(mx(b.x)-2,my(b.z)-2,4,4)}
 for(const b of localBases){
  g.fillStyle=baseColors[b.side];g.fillRect(mx(b.x)-2,my(b.z)-2,4,4)
 }
 g.beginPath();g.arc(mx(sortiePhase==='return'&&approachReady?goalPort().x:zone.x),my(sortiePhase==='return'&&approachReady?goalPort().z:zone.z),Math.max(4,sectorRadius*scale),0,tau);
 g.strokeStyle='#ffe39a';g.stroke();
 for(const e of enemies)if(e.hp>0){g.fillStyle=e===locked?'#b7fff0':e.state==='attack'?'#ffdd7c':'#ff8074';g.fillRect(mx(e.x)-1.5,my(e.z)-1.5,3,3)}
 g.save();g.translate(mx(x),my(z));g.rotate(yaw);poly([[0,-5],[-3.5,4],[0,2],[3.5,4]],'#b7fff0');g.restore();g.restore()
}
