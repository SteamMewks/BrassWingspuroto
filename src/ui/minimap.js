function minimapBox(){
 const side=Math.min(108,Math.round(w*.24),Math.round(h*.26));
 return {side,left:w-side-10,top:Math.max(63,h*.205)}
}
function discoverRelics(){
 const {wx,wz}=localToWorld(x,z);
 for(const b of radarNeighbors(wx,wz)){
  if(!adventure.seen.includes(b.id)&&Math.hypot(b.wx-wx,b.wz-wz)<=1200){adventure.seen.push(b.id);saveAdventure()}
 }
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
const radarRange=4000,radarCells=new Map();
for(const port of Object.values(outposts)){
 const key=Math.floor(port.wx/radarRange)+','+Math.floor(port.wz/radarRange);
 if(!radarCells.has(key))radarCells.set(key,[]);radarCells.get(key).push(port)
}
let lastRadarCell='',radarPorts=[];
function radarNeighbors(wx,wz){
 const i=Math.floor(wx/radarRange),j=Math.floor(wz/radarRange),key=i+','+j;
 if(lastRadarCell!==key){
  radarPorts=[];for(let a=i-1;a<=i+1;a++)for(let b=j-1;b<=j+1;b++)radarPorts.push(...(radarCells.get(a+','+b)||[]));
  lastRadarCell=key
 }
 return radarPorts
}
function radarDial(battle){
 const {left,top,side}=minimapBox(),r=side/2-2;
 g.save();g.translate(left+side/2,top+side/2);
 const circle=radius=>{g.beginPath();g.arc(0,0,radius,0,tau)};
 circle(r);g.fillStyle=battle?'#102522':'#162f39eb';g.fill();g.lineWidth=1.5;g.strokeStyle=battle?'#84cda9':'#d3b783';g.stroke();g.clip();
 g.lineWidth=1;g.strokeStyle=battle?'#487664':'#47636b';
 for(const f of [.33,.66]){circle(r*f);g.stroke()}
 for(let i=0;i<24;i++){g.save();g.rotate(i*tau/24);g.fillStyle=i===0?'#ffe5aa':'#839e98';g.fillRect(-.7,-r,1.4,i%6===0?6:2);g.restore()}
 g.fillStyle='#e6efce';g.font='bold 9px system-ui';g.textAlign='center';g.fillText('N',0,10-r);
 return r
}
function radarAircraft(dx,dz){
 g.save();g.translate(dx,dz);g.rotate(yaw);poly([[0,-5],[-3,4],[0,2],[3,4]],'#c6ffdd');g.restore()
}
function worldMinimap(){
 const r=radarDial(false),scale=(r-4)/radarRange,p=localToWorld(x,z);
 for(const b of radarNeighbors(p.wx,p.wz)){
  const dx=(b.wx-p.wx)*scale,dy=(p.wz-b.wz)*scale;
  if(dx*dx+dy*dy>(r-4)**2||!knownPort(b.id))continue;
  g.fillStyle=colors[affiliation(b.id)];
  if(b.deck)poly([[dx,dy-3],[dx+3,dy+2],[dx-3,dy+2]],g.fillStyle);
  else if(b.kind){g.beginPath();g.arc(dx,dy,2.5,0,tau);g.fill()}
  else g.fillRect(dx-2,dy-2,4,4)
 }
 const target=routeTarget();
 if(target){const dx=target.wx-p.wx,dy=p.wz-target.wz,d=Math.hypot(dx,dy),k=Math.min(scale,(r-5)/(d||1));
  g.save();g.translate(dx*k,dy*k);g.strokeStyle='#ffdf69';if(d>radarRange){g.rotate(Math.atan2(dx,-dy));poly([[0,-4],[-4,3],[4,3]],'#ffdf69')}else g.strokeRect(-4,-4,8,8);g.restore()}
 radarAircraft(0,0);g.restore()
}
function battleMinimap(){
 const r=radarDial(true),scale=(r-4)/(Math.SQRT2*battleHalf),p=localToWorld(x,z);
 const X=wx=>(wx-encounter.wx)*scale,Y=wz=>(encounter.wz-wz)*scale;
 const edge=battleHalf*scale;g.strokeStyle='#efc27e';g.strokeRect(-edge,-edge,2*edge,2*edge);
 g.strokeRect(-2,-2,4,4);
 for(const e of enemies)if(e.hp){const b=localToWorld(e.x,e.z);g.fillStyle='#ff7168';g.beginPath();g.arc(X(b.wx),Y(b.wz),2.5,0,tau);g.fill()}
 radarAircraft(X(p.wx),Y(p.wz));g.restore()
}
