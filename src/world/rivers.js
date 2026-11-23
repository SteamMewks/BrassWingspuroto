const riverCells=new Map(),channelTiles=new Map(),waterfalls=[];
const activeRiverCells=new Map(),activeChannelTiles=new Map();
function riverSegment(reach,index){
 const a=reach.samples[index],b=reach.samples[index+1];
 const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
 return {a,b,dx,dz,len,width:Math.max(a[3],b[3]),reach,index}
}
function* surveyRiverSegments(){
 for(const reach of watersheds.reaches)for(let i=1;i<reach.samples.length;i++){
  const segment=riverSegment(reach,i-1);
  if(segment.len>=.001)yield segment
 }
}
function indexRiver(map,key,id){
 if(!map.has(key))map.set(key,[]);
 map.get(key).push(id)
}
for(const {a,b,width,reach,index} of surveyRiverSegments()){
 const id=reach.id*65536+index;
 for(let i=Math.floor((Math.min(a[0],b[0])-width-82)/256);i<=Math.floor((Math.max(a[0],b[0])+width+82)/256);i++)
  for(let j=Math.floor((Math.min(a[1],b[1])-width-82)/256);j<=Math.floor((Math.max(a[1],b[1])+width+82)/256);j++)indexRiver(riverCells,i+','+j,id);
 indexRiver(channelTiles,Math.floor(a[0]/800)*256+Math.floor(a[1]/800),id);
 if(index===reach.fall)waterfalls.push(riverSegment(reach,index))
}
function riverTile(index,cache,key,limit){
 const ids=index.get(key);
 if(!ids)return [];
 let segments=cache.get(key);
 if(segments)cache.delete(key);
 else segments=ids.map(id=>riverSegment(watersheds.reaches[id>>>16],id&65535));
 cache.set(key,segments);
 if(cache.size>limit)cache.delete(cache.keys().next().value);
 return segments
}
function pruneRiverTiles(wx,wz){
 for(const key of activeRiverCells.keys()){
  const [i,j]=key.split(',').map(Number);
  if(Math.abs((i+.5)*256-wx)>1900||Math.abs((j+.5)*256-wz)>1900)activeRiverCells.delete(key)
 }
 for(const key of activeChannelTiles.keys()){
  const i=Math.floor(key/256),j=key%256;
  if(Math.abs((i+.5)*800-wx)>4500||Math.abs((j+.5)*800-wz)>4500)activeChannelTiles.delete(key)
 }
}
function riverAt(wx,wz,margin=0){
 let best=null,closest=Infinity;
 for(const s of riverTile(riverCells,activeRiverCells,Math.floor(wx/256)+','+Math.floor(wz/256),64)){
  const u=Math.max(0,Math.min(1,((wx-s.a[0])*s.dx+(wz-s.a[1])*s.dz)/(s.len*s.len)));
  const d=Math.hypot(wx-s.a[0]-u*s.dx,wz-s.a[1]-u*s.dz),width=s.a[3]+u*(s.b[3]-s.a[3]);
  if(d<=width+margin&&d<closest){closest=d;best={segment:s,height:s.a[2]+u*(s.b[2]-s.a[2]),width,d}}
 }
 return best
}
function nearRiver(wx,wz,margin=0){return Boolean(riverAt(wx,wz,margin))}
// Carry the receiving channel's colour and distance to tidewater through each junction.
const tides=new Map();
function tidalDistances(reach){
 if(tides.has(reach.id))return tides.get(reach.id);
 const points=reach.samples,dist=new Float64Array(points.length);
 dist[dist.length-1]=reach.down<0?0:tidalDistances(watersheds.reaches[reach.down])[0];
 for(let i=points.length-2;i>=0;i--)dist[i]=dist[i+1]+Math.hypot(points[i][0]-points[i+1][0],points[i][1]-points[i+1][1]);
 tides.set(reach.id,dist);return dist
}
for(const reach of watersheds.reaches)tidalDistances(reach);
function drawChannels(face,sn,cs,eye,f,horizon){
 const m=worldRegion(),wx=x+m.wx,wz=z+m.wz;
 for(let i=Math.floor((wx-3300)/800);i<=Math.floor((wx+3300)/800);i++)for(let j=Math.floor((wz-3300)/800);j<=Math.floor((wz+3300)/800);j++)for(const s of riverTile(channelTiles,activeChannelTiles,i*256+j,112)){
  const dx=s.a[0]-wx,dz=s.a[1]-wz,depth=dx*sn+dz*cs;
  if(depth< -s.len-100||Math.abs(dx*cs-dz*sn)>Math.max(0,depth)*w/h+s.len+160)continue;
  if(Math.abs(s.a[0]-wx)>3300||Math.abs(s.a[1]-wz)>3300)continue;
  const points=s.reach.samples;
  const edge=(i,k,along=0,rise=0)=>{
   const p=points[i],prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)],dx=next[0]-prev[0],dz=next[1]-prev[1],len=Math.hypot(dx,dz)||1;
   return [p[0]-m.wx+k*p[3]*dz/len+along*dx/len,p[2]+rise,p[1]-m.wz-k*p[3]*dx/len+along*dz/len]
  };
  const i=s.index,falls=i===s.reach.fall;
  const dist=tides.get(s.reach.id),end=points.at(-1),receiver=watersheds.reaches[s.reach.down];
  const bandCount=falls||depth>1000?1:Math.min(6,Math.max(1,Math.ceil(s.len/(dist[i+1]<750?50:140))));
  const banks=[edge(i,-1),edge(i,1),edge(i+1,-1),edge(i+1,1)];
  const bank=(side,u)=>banks[side].map((n,j)=>n+(banks[side+2][j]-n)*u);
  for(let n=0;n<bandCount;n++){
   const u=(n+.5)/bandCount,X=s.a[0]+s.dx*u,Z=s.a[1]+s.dz*u;
   let width=s.a[3]+(s.b[3]-s.a[3])*u;
   if(receiver){const mix=Math.max(0,1-Math.hypot(X-end[0],Z-end[1])/260);width+=(receiver.samples[0][3]-width)*mix}
   const deep=Math.min(1,Math.max(0,(width-9)/23)),fresh=[115-21*deep,151-19*deep,145-15*deep];
   const fromSea=dist[i+1]+s.len*(1-u),salt=Math.max(0,1-fromSea/650);
   if(salt>0){
    const depth=Math.max(2,32+(X-wx)*sn+(Z-wz)*cs);
    const band=Math.min(9,Math.floor(10*Math.pow(Math.max(0,eye*f/depth/(h-horizon)),1/1.7)));
    const sea=waterPalette(wx,wz)[band].match(/\d+/g).map(Number),weight=salt*salt*(3-2*salt);
    for(let k=0;k<3;k++)fresh[k]+=(sea[k]-fresh[k])*weight
   }
   face([bank(0,n/bandCount),bank(1,n/bandCount),bank(1,(n+1)/bandCount),bank(0,(n+1)/bandCount)],falls?'#d1e2d1':'rgb('+fresh.map(Math.round).join(',')+')',4)
  }
  if(falls){
   const below=points[i+1],last=points[Math.min(i+2,points.length-1)],f=Math.min(.25,18/Math.max(1,Math.hypot(last[0]-below[0],last[1]-below[1])));
   const zoom=k=>{const a=edge(i+1,k),b=edge(Math.min(i+2,points.length-1),k);return a.map((v,j)=>v+(b[j]-v)*f)};
   face([edge(i+1,-.92,0,.14),edge(i+1,.92,0,.14),zoom(.75),zoom(-.7)],'#c7dfd1',6);
   if(Math.hypot(below[0]-wx,below[1]-wz)<420)for(let plume=0;plume<3;plume++){
    const phase=(railClock*.65+plume/3)%1,k=(plume-1)*.38;
    const spray=edge(i+1,k,1+phase*2,.4+2.5*Math.sin(phase*Math.PI));
    const [X,Y,Z]=spray,size=.6+phase;
    face([[X-size*cs,Y,Z+size*sn],[X,Y+size,Z],[X+size*cs,Y,Z-size*sn]],'rgba(211,228,216,.48)',7)
   }
   if(depth<1050)for(const k of [-.68,-.2,.37,.72])face([edge(i,k),edge(i,k+.06),edge(i+1,k+.12),edge(i+1,k-.03)],'#eef4df',6)
  }else if(Math.abs(s.a[0]-wx)<550&&Math.abs(s.a[1]-wz)<550){
   const u=(railClock*.09+i*.31)%1,p=(t,k)=>{const a=edge(i,k),b=edge(i+1,k);return a.map((v,j)=>v+(b[j]-v)*t)};
   face([p(u*.8,.15),p(u*.8+.07,.17),p(u*.8+.1,.2)],'#b2cbc0',5)
  }
 }
}
