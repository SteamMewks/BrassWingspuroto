// Reserve authored town blocks in world coordinates before surveying procedural sites.
const existingBlocks=new Map();
function surveyExistingBlocks(){
 for(const region of landscapes){
  regionContext=region;buildWorld();
  for(const q of quarters){
   const {wx,wz}=localToWorld(q.x,q.z),r=q.radius+8;
   for(let i=Math.floor((wx-r)/128);i<=Math.floor((wx+r)/128);i++)for(let j=Math.floor((wz-r)/128);j<=Math.floor((wz+r)/128);j++){
    const key=i+','+j;
    if(!existingBlocks.has(key))existingBlocks.set(key,[]);
    existingBlocks.get(key).push({wx,wz,r})
   }
  }
 }
}
function ruralGround(X,Z,margin,crossing=false){
 const {wx,wz}=localToWorld(X,Z);
 const blocks=existingBlocks.get(Math.floor(wx/128)+','+Math.floor(wz/128));
 if(blocks?.some(b=>Math.hypot(b.wx-wx,b.wz-wz)<b.r+margin))return null;
 if(!mainlandAt(X,Z)||(!crossing&&nearRail(X,Z))||nearRiver(wx,wz,margin))return null;
 if(localBases.some(b=>Math.abs(b.x-X)<(b.kind?70:190)+margin&&Math.abs(b.z-Z)<(b.length||300)/2+margin))return null;
 if(journalSites.some(b=>Math.abs(b.x-wx)<(b.rx||b.radius)+margin&&Math.abs(b.z-wz)<(b.rz||b.radius)+margin))return null;
 const y=ground(X,Z);
 if(crossing&&nearRail(X,Z)){
  if(railLots.some(b=>Math.abs(X-b.x)<Math.hypot(b.w,b.l)/2+margin&&Math.abs(Z-b.z)<Math.hypot(b.w,b.l)/2+margin))return null;
  if(railSites.some(b=>Math.hypot(X-b.x,Z-b.z)<65))return null;
  for(const line of railLines)if(nearLine(line,X,Z,65)){
   for(const p of line.path)if(Math.hypot(p.x-X,p.z-Z)<28&&Math.abs(p.y-y)>2)return null
  }
 }
 return y>1?y:null
}
function buildDistrict(site,index){
 const roads=[],lots=[],hamlets=[],district={stationId:site.name,roads,lots,hamlets};
 const towns=localBases.filter(b=>b.stationId===site.name);
 function roadStrip(start,end,width){
  const dx=end.x-start.x,dz=end.z-start.z,len=Math.hypot(dx,dz);
  if(len<12)return false;
  const pieces=Math.ceil(len/14),sideX=dz/len,sideZ=-dx/len,strip=[];
  let prev=null;
  for(let j=0;j<=pieces;j++){
   const t=j/pieces,swing=Math.sin(t*Math.PI*2)*Math.min(28,len*.05);
   const X=start.x+dx*t+sideX*swing,Z=start.z+dz*t+sideZ*swing;
   const edge=[];
   for(const sign of [-1,1]){
    const u=X+sign*sideX*width,v=Z+sign*sideZ*width,y=ruralGround(u,v,5,true);
    if(y===null||prev&&Math.abs(prev[edge.length][1]-y)>3.6)return false;
    edge.push([u,y+.32,v])
   }
   if(prev){
    const quad=[prev[0],prev[1],edge[1],edge[0]];
    quad.crossing=nearRail(X,Z);strip.push(quad)
   }
   prev=edge
  }
  return strip
 }
 function road(start,end,width){
  const direct=roadStrip(start,end,width);
  if(direct){roads.push(...direct);return true}
  const dx=end.x-start.x,dz=end.z-start.z,distance=Math.hypot(dx,dz);
  if(distance<30)return false;
  for(const offset of [72,-72,185,-185,360,-360]){
   const bend={x:(start.x+end.x)/2+offset*dz/distance,z:(start.z+end.z)/2-offset*dx/distance};
   const first=roadStrip(start,bend,width);if(!first)continue;
   const second=roadStrip(bend,end,width);
   if(second){roads.push(...first,...second);return true}
  }
  return false
 }
 // Search a coarse terrain grid only when a main road cannot follow a direct bend.
 // Each accepted edge uses the same bank, grade and rail checks as the final mesh.
 function arterial(from,to,width,step=90,limit=650){
  if(road(from,to,width))return true;
  if(ruralGround(from.x,from.z,5,true)===null||ruralGround(to.x,to.z,5,true)===null)return false;
  const open=[],cost=new Map(),blocked=new Set();
  function enqueue(i,j,g,parent,strip){
   const key=i+','+j,p={x:from.x+i*step,z:from.z+j*step};
   if(g>=(cost.get(key)??Infinity))return;
   cost.set(key,g);open.push({i,j,p,g,parent,strip,f:g+1.15*distance(p,to)})
  }
  enqueue(0,0,0,null,[]);
  for(let visited=0;open.length&&visited<limit;visited++){
   open.sort((a,b)=>b.f-a.f);
   const node=open.pop();
   if(node.g!==cost.get(node.i+','+node.j))continue;
   if(distance(node.p,to)<230){
    const finish=roadStrip(node.p,to,width);
    if(finish){
     for(let n=node;n.parent;n=n.parent)roads.push(...n.strip);
     roads.push(...finish);return true
    }
   }
   for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
    const i=node.i+di,j=node.j+dj,g=node.g+Math.hypot(di,dj)*step,key=i+','+j;
    if(g>=(cost.get(key)??Infinity)||blocked.has(key))continue;
    const p={x:from.x+i*step,z:from.z+j*step};
    if(ruralGround(p.x,p.z,width,true)===null){blocked.add(key);continue}
    const strip=roadStrip(node.p,p,width);
    if(strip)enqueue(i,j,g,node,strip)
   }
  }
  return false
 }
 function cluster(center,count,radius,hamletId=null){
  const attempts=count*5;
  for(let k=0;k<attempts&&count>0;k++){
   const n=noise(index,k,Math.round(radius)),angle=k*2.4+n;
   const X=center.x+Math.sin(angle)*radius*(.3+n),Z=center.z+Math.cos(angle)*radius*(.3+n);
   const fishing=site.kind==='port'||/網元|埠頭|漁/.test(site.name);
   const style=hamletId&&fishing&&k%4===0?'nets':hamletId&&site.kind==='farm'&&k===0?'mill':k%6===4?'field':k%4!==0?'house':({farm:'field',timber:'logs',mine:'coal',port:'shed',works:'works'}[site.kind]||'field');
   const w=style==='field'?36:10+6*n,l=style==='field'?52:12+5*n,r=Math.hypot(w,l)/2;
   if(lots.some(b=>Math.hypot(b.x-X,b.z-Z)<r+b.radius+3))continue;
   const y=ruralGround(X,Z,r);
   if(y===null||![-1,1].every(a=>[-1,1].every(b=>{const h=ruralGround(X+a*r,Z+b*r,3);return h!==null&&Math.abs(y-h)<1.4})))continue;
   lots.push({hamletId,stationId:site.name,x:X,z:Z,y,w,l,h:style==='mill'?17:style==='nets'?4:style==='field'?.6:style==='logs'||style==='coal'?3:6+n*6,style,dx:Math.sin(angle),dz:Math.cos(angle),radius:r});count--
  }
 }
 const sides=[126,-126,176,-176,225,-225].flatMap(offset=>[0,70,-70].map(along=>{
  const [x,,z]=railOffset(site,offset,along);return {x,z}
 }));
 const start=sides.find(p=>ruralGround(p.x,p.z,5)!==null)||sides[0];
 cluster(start,14,75);
 const junctions=[start];
 const city=towns.find(b=>b.tier==='large');
 if(city){
  const side=Math.sign(site.x-city.x||1);
  const edges=[side,-side].flatMap(sign=>[0,105,-105].map(offset=>({x:city.x+sign*96,z:city.z+offset})));
  const edge=edges.find(p=>arterial(start,p,5))||edges.find(p=>ruralGround(p.x,p.z,5,true)!==null)||edges[0];
  junctions.push(edge);cluster(edge,12,55)
 }
 // Extend roads from the station forecourt, city access and connected villages.
 function access(point,width){
  const nearest=[...junctions].sort((a,b)=>distance(a,point)-distance(b,point));
  for(const origin of nearest)if(width>=4?arterial(origin,point,width):road(origin,point,width)){junctions.push(point);return true}
  return false
 }
 function distance(a,b){return Math.hypot(a.x-b.x,a.z-b.z)}
 for(const town of towns.filter(b=>b.tier==='medium')){
  for(const offset of [98,-98]){
   const edge={x:town.x+offset,z:town.z};
   if(access(edge,4.5)){cluster(edge,9,58);break}
  }
 }
 function addHamlet(id,point,retired){
  const before=lots.length;
  cluster(point,retired?13:9,retired?76:62,id);
  if(lots.length-before<3){lots.length=before;return false}
  if(!access(point,3)){lots.length=before;return false}
  const {wx,wz}=localToWorld(point.x,point.z);
  hamlets.push({id,stationId:site.name,wx:Math.round(wx),wz:Math.round(wz)});
  return true
 }
 for(const market of Object.values(scenicMarkets).filter(b=>b.stationId===site.name)){
  const center=worldToLocal(market.wx,market.wz);
  for(let attempt=0;attempt<96;attempt++){
   const radius=attempt===0?0:20+attempt*5,angle=attempt*2.4;
   const point={x:center.x+radius*Math.sin(angle),z:center.z+radius*Math.cos(angle)};
   if(addHamlet(market.id,point,true))break
  }
  // In an isolated valley, start a local lane at the old market's outer farms.
  if(!hamlets.some(h=>h.id===market.id)){
   for(let k=0;k<100;k++){
    const angle=k*2.4,reach=75+k*1.8;
    const lane={x:center.x+Math.sin(angle)*reach,z:center.z+Math.cos(angle)*reach};
    if(!road(lane,center,2.6))continue;
    junctions.push(lane);
    if(addHamlet(market.id,center,true)){cluster(lane,6,44);break}
   }
  }
 }
 const hub=junctions[junctions.length-1];
 for(let arm=0;arm<4;arm++){
  for(let attempt=0;attempt<18;attempt++){
   const angle=arm*2.1+noise(index,attempt,arm+12)*3.4;
   const reach=550+noise(index,arm,attempt+32)*(arm===3?3900:1250);
   const point={x:hub.x+reach*Math.sin(angle),z:hub.z+reach*Math.cos(angle)};
   if(junctions.some(p=>distance(p,point)<280))continue;
   if(addHamlet('rural-'+index+'-'+arm,point,false))break
  }
 }
 // Connect valley-side lanes to a reachable edge of the station or town, even
 // when the first forecourt lies on the opposite side of a rail cutting.
 const nodes=new Map();
 function endpoint(a,b){
  const x=(a[0]+b[0])/2,z=(a[2]+b[2])/2,key=Math.round(x)+','+Math.round(z);
  if(!nodes.has(key)){const n={x,z};n.root=n;nodes.set(key,n)}
  return nodes.get(key)
 }
 function root(n){while(n.root!==n){n.root=n.root.root;n=n.root}return n}
 for(const [a,b,c,d] of roads)root(endpoint(a,b)).root=root(endpoint(c,d));
 const components=new Map();
 for(const n of nodes.values()){
  const r=root(n);if(!components.has(r))components.set(r,[]);components.get(r).push(n)
 }
 for(const group of components.values()){
  if(group.some(n=>distance(n,site)<245||city&&distance(n,city)<195))continue;
  const gates=[];
  for(const center of [site,city].filter(Boolean))for(let k=0;k<24;k++){
   const a=k*Math.PI/12,r=center===site?216:169;
   const p={x:center.x+Math.sin(a)*r,z:center.z+Math.cos(a)*r};
   if(ruralGround(p.x,p.z,4,true)===null)continue;
   const n=group.reduce((best,q)=>distance(q,p)<distance(best,p)?q:best);
   gates.push({p,n,d:distance(p,n)})
  }
  gates.sort((a,b)=>a.d-b.d);
  if(!gates.some(g=>road(g.n,g.p,3.4))&&!gates.slice(0,12).some(g=>arterial(g.n,g.p,3.4))){
   gates.some(g=>arterial(g.n,g.p,3.4,52,1800))
  }
 }
 district.lots=lots.filter(b=>!roads.some(quad=>{
  const X=quad.reduce((sum,p)=>sum+p[0],0)/4,Z=quad.reduce((sum,p)=>sum+p[2],0)/4;
  return Math.hypot(b.x-X,b.z-Z)<b.radius+6
 }));
 for(const h of hamlets)h.lots=district.lots.filter(b=>b.hamletId===h.id).length;
 return district
}
