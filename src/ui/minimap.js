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
 for(const b of Object.values(outposts)){g.fillStyle=colors[affiliation(b.id)];g.fillRect(X(b.wx)-1,Z(b.wz)-1,3,3)}
 g.fillStyle='#a5dfe3';
 const {wx,wz}=localToWorld(x,z);
 g.save();g.translate(X(wx),Z(wz));g.rotate(yaw);
 poly([[0,-4],[-3,3],[0,2],[3,3]],'#b7fff0');g.restore()
}
