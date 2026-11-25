function ruralGround(X,Z,margin,crossing=false){
 const {wx,wz}=localToWorld(X,Z);
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
 const roads=[],lots=[],district={stationId:site.name,roads,lots};
 const towns=localBases.filter(b=>b.stationId===site.name);
 const market=towns.find(b=>b.tier==='medium');
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
 function cluster(center,count,radius){
  const attempts=count*5;
  for(let k=0;k<attempts&&count>0;k++){
   const n=noise(index,k,Math.round(radius)),angle=k*2.4+n;
   const X=center.x+Math.sin(angle)*radius*(.3+n),Z=center.z+Math.cos(angle)*radius*(.3+n);
   const style=k%6===4?'field':k%4!==0?'house':({farm:'field',timber:'logs',mine:'coal',port:'shed',works:'works'}[site.kind]||'field');
   const w=style==='field'?36:10+6*n,l=style==='field'?52:12+5*n,r=Math.hypot(w,l)/2;
   if(lots.some(b=>Math.hypot(b.x-X,b.z-Z)<r+b.radius+3))continue;
   const y=ruralGround(X,Z,r);
   if(y===null||![-1,1].every(a=>[-1,1].every(b=>{const h=ruralGround(X+a*r,Z+b*r,3);return h!==null&&Math.abs(y-h)<1.4})))continue;
   lots.push({stationId:site.name,x:X,z:Z,y,w,l,h:style==='field'?.6:style==='logs'||style==='coal'?3:6+n*6,style,dx:Math.sin(angle),dz:Math.cos(angle),radius:r});count--
  }
 }
 const sides=[126,-126,176,-176,225,-225].flatMap(offset=>[0,70,-70].map(along=>{
  const [x,,z]=railOffset(site,offset,along);return {x,z}
 }));
 const start=sides.find(p=>ruralGround(p.x,p.z,5)!==null)||sides[0];
 cluster(start,14,75);
 const city=towns.find(b=>b.tier==='large');
 if(city){
  const edge={x:city.x+Math.sign(site.x-city.x||1)*96,z:city.z};
  road(start,edge,5);cluster(edge,12,55)
 }
 let junction=start;
 if(market){
  junction={x:market.x+Math.sign(site.x-market.x||1)*95,z:market.z};
  cluster(junction,9,58);road(start,junction,4.5)
 }
 for(let arm=0;arm<3;arm++){
  for(let attempt=0;attempt<10;attempt++){
   const angle=arm*2.1+noise(index,attempt,arm+12)*2.4;
   const reach=420+noise(index,arm,attempt+32)*900;
   const village={x:junction.x+reach*Math.sin(angle),z:junction.z+reach*Math.cos(angle)};
   if(!road(junction,village,2.2))continue;
   cluster(village,5+arm,65);break
  }
 }
 district.lots=lots.filter(b=>!roads.some(quad=>{
  const X=quad.reduce((sum,p)=>sum+p[0],0)/4,Z=quad.reduce((sum,p)=>sum+p[2],0)/4;
  return Math.hypot(b.x-X,b.z-Z)<b.radius+6
 }));
 return district
}
