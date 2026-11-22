function buildRail(sampleElevation){
 const encoded=railElevationArchive[operation().region];
 const elevations=!sampleElevation&&encoded?surveyArray(encoded,Float32Array):null;
 let elevationIndex=0;
 const elevation=sampleElevation||(elevations?()=>elevations[elevationIndex++]:ground);
 shipping=shippingSurvey.map(points=>{
  let length=0;const path=points.map(([wx,wz],i)=>{if(i)length+=Math.hypot(wx-points[i-1][0],wz-points[i-1][1]);return {...worldToLocal(wx,wz),d:length,y:1}});
  return {length,path}
 });
 railCells.clear();railSites=[];railLots=[];const names=new Set();
 railLines=railSurvey.map(({points,ends},index)=>{
  const knots=points.map(([wx,wz])=>worldToLocal(wx,wz)),curve=[knots[0]];
  function toward(a,b,d){const q=d/Math.hypot(a.x-b.x,a.z-b.z);return {x:a.x+(b.x-a.x)*q,z:a.z+(b.z-a.z)*q}}
  for(let i=1;i<knots.length-1;i++){
   const p=knots[i],a=knots[i-1],b=knots[i+1],r=Math.min(320,.33*Math.hypot(a.x-p.x,a.z-p.z),.33*Math.hypot(b.x-p.x,b.z-p.z));
   const s=toward(p,a,r),e=toward(p,b,r);
   const steps=Math.max(2,Math.ceil(r/28));
   for(let j=0;j<=steps;j++){const u=j/steps,v=1-u;curve.push({x:v*v*s.x+2*u*v*p.x+u*u*e.x,z:v*v*s.z+2*u*v*p.z+u*u*e.z})}
  }
  curve.push(knots.at(-1));const path=[];let length=0;
  for(let i=0;i<curve.length;i++){
   const b=curve[i],a=curve[i-1]||b,l=Math.hypot(b.x-a.x,b.z-a.z),count=Math.max(1,Math.ceil(l/48));
   for(let j=1;j<=count;j++){const x=a.x+(b.x-a.x)*j/count,z=a.z+(b.z-a.z)*j/count;length+=l/count;
    path.push({x,z,y:0,d:length})}
  }
  for(const p of path)p.y=trackLevel(index,p.d,length)+.65;
  for(let d=0;d<=length;d+=10){const p=railSample({path,length},d);for(const v of [-8,0,8]){const [a,,b]=railOffset(p,v);railCells.add(Math.floor(a/32)+','+Math.floor(b/32))}}
  const line={path,length,index,stops:[]};buildRailBridges(line);
  line.bounds={west:Math.min(...path.map(p=>p.x)),east:Math.max(...path.map(p=>p.x)),south:Math.min(...path.map(p=>p.z)),north:Math.max(...path.map(p=>p.z))};
  for(const p of path){
   if(line.bridges.some(b=>p.d>=b.start&&p.d<=b.end))continue;
   const frame=railSample(line,p.d);
   for(const side of [-4,0,4]){const [X,,Z]=railOffset(frame,side);p.y=Math.max(p.y,elevation(X,Z)+.35)}
  }
  for(let j=1;j<path.length;j++)path[j].y=Math.max(path[j].y,path[j-1].y-.02*(path[j].d-path[j-1].d));
  for(let j=path.length-2;j>=0;j--)path[j].y=Math.max(path[j].y,path[j+1].y-.02*(path[j+1].d-path[j].d));
  const stations=[[0,ends[0]],...railStops[index],[1,ends[1]]];
  for(const [fraction,name,type] of stations){
   const d=fraction===0?60:fraction===1?length-60:fraction*length;line.stops.push(d);
   if(names.has(name))continue;names.add(name);
   const kind=type||((/中央|南銅都|西都鋳造廠/.test(name))?'central':/埠頭|河口/.test(name)?'port':name.includes('鉱山')?'mine':'works');
   const site={...railSample(line,d),kind,name,d,line};railSites.push(site);
   const central=kind==='central',scale=central?1:.57;
   function lot(side,along,w,l,h,style){
    const [x,,z]=railOffset(site,side,along),y=elevation(x,z);
    if(!mainlandAt(x,z)||nearRiver(x+operation().wx,z+operation().wz,2))return;
    railLots.push({x,z,y,w,l,h,style,dx:site.dx,dz:site.dz});
    for(let a=-w/2;a<=w/2+8;a+=8)for(let b=-l/2;b<=l/2+8;b+=8){const [u,,v]=railOffset(site,side+a,along+b);railCells.add(Math.floor(u/32)+','+Math.floor(v/32))}
   }
   if(kind==='port')lot(-36,37,7,7,23,'beacon');
   lot(-29*scale,0,23*scale,96*scale,19*scale,'hall');
   lot(33,12,17,central?68:29,central?15:9,'shed');
   lot(49,-28,7,7,central?25:13,'tank');
   if(central||kind==='works'||kind==='mine'){lot(58,26,19,34,13,'works');lot(68,42,4,4,32,'stack')}
   if(central){
    lot(55,-74,16,48,12,'shed');lot(40,77,12,28,5,'coal');
    if(name==='黄銅港中央')for(let k=0;k<3;k++)lot(85,48*k-50,22,38,11,'shed');
    if(name==='紫煙中央'){lot(83,0,27,66,18,'works');lot(97,34,5,5,35,'stack')}
    if(name==='西都鋳造廠'||name==='南銅都'){
     const foundry=name==='西都鋳造廠';lot(77,-50,26,53,16,'works');lot(95,-38,5,5,32,'stack');
     for(let row=0;row<3;row++)for(let k=0;k<(foundry?6:8);k++){
      const n=noise(row,k,foundry?35:67);lot(-86-row*29,(k-3)*25+5*n,12+4*n,16,7+5*n,'house')
     }
     lot(89,41,25,57,13,'shed');lot(108,84,18,28,6,foundry?'logs':'coal')
    }
    if(name==='赤銅中央'){lot(78,-25,28,58,13,'shed');lot(78,36,20,30,6,'coal')}
   }
   for(let j=0;j<(central?9:4);j++)lot(-54-(j%2)*24,(j-3)*19,10+j%3*2,12+j%2*4,6+j%4,'house');
   if(kind==='farm')for(let j=0;j<4;j++)lot(76,38*j-55,41,32,.6,'field');
   if(kind==='timber'||kind==='mine'||kind==='port')for(let j=0;j<5;j++)lot(56,(j-2)*12,18,7,3+j%3,kind==='timber'?'logs':kind==='mine'?'coal':'shed');
  }
  return line
 });
 baseSpurs=[];
 for(const b of localBases.filter(b=>!b.island&&b.tier!=='small')){
  const end={x:b.x-225,z:b.z+92};let best=800,entry;
  for(const l of railLines){
   if(!nearLine(l,b.x,b.z,980))continue;
   for(const p of l.path){
    const dist=Math.hypot(p.x-end.x,p.z-end.z);
    if(dist<105||dist>best||p.x>b.x-205)continue;
    best=dist;entry=railSample(l,p.d)
   }
  }
  if(!entry)continue;
  const dir=(end.x-entry.x)*entry.dx+(end.z-entry.z)*entry.dz>0?1:-1;
  const start=railOffset(entry,dir*2.5),curve=[];
  for(let j=0;j<=24;j++){
   const u=j/24,v=1-u,a=3*u*v*v,c=3*u*u*v;
   curve.push({x:v*v*v*start[0]+a*(start[0]+entry.dx*dir*best*.34)+c*end.x+u*u*u*end.x,
    z:v*v*v*start[2]+a*(start[2]+entry.dz*dir*best*.34)+c*(end.z-45)+u*u*u*end.z,y:10.62})
  }
  for(const p of curve)p.y=elevation(p.x,p.z)+.62;
  if(curve.some(p=>Math.abs(p.x-b.x)<200||nearRiver(p.x+operation().wx,p.z+operation().wz,5)))continue;
  for(let i=0;i<curve.length;i++){
   const p=curve[i],a=curve[Math.max(0,i-1)],c=curve[Math.min(i+1,curve.length-1)],d=Math.hypot(c.x-a.x,c.z-a.z);
   p.dx=(c.x-a.x)/d;p.dz=(c.z-a.z)/d;railCells.add(Math.floor(p.x/32)+','+Math.floor(p.z/32))
  }
  baseSpurs.push({id:b.id,curve,end:curve.at(-1)})
 }
 railCrossings=[];
 for(const line of railLines)for(let i=1;i<line.path.length;i++){
  const a=line.path[i-1],b=line.path[i];
  for(const road of roads){
   const cx=(road[0][0]+road[3][0])/2,cz=(road[0][2]+road[3][2])/2;
   if(Math.abs(cx-a.x)>240||Math.abs(cz-a.z)>240)continue;
   const u=(road[1][0]+road[2][0])/2-cx,v=(road[1][2]+road[2][2])/2-cz;
   const dx=b.x-a.x,dz=b.z-a.z,den=dx*v-dz*u;
   if(Math.abs(den)<1)continue;
   const t=((cx-a.x)*v-(cz-a.z)*u)/den,r=((cx-a.x)*dz-(cz-a.z)*dx)/den;
   if(t>=0&&t<1&&r>=0&&r<1)railCrossings.push(railSample(line,a.d+t*(b.d-a.d)))
  }
 }
 if(elevations&&elevationIndex!==elevations.length)throw Error("Rail elevation archive does not match the survey");
}
function terminalTrack(line,d,dir){
 const distance=dir===1?d:line.length-d;
 const u=Math.max(0,Math.min(1,(distance-85)/55));
 return dir*2.5*(2*u*u*(3-2*u)-1)
}
function nearLine(line,X,Z,r){
 const b=line.bounds;return X>=b.west-r&&X<=b.east+r&&Z>=b.south-r&&Z<=b.north+r
}
function railCars(line,service){
 const stops=line.stops,legs=[],speed=22,dwell=12;
 // Each leg has symmetric constant acceleration and braking and a cruise phase.
 for(let i=1;i<stops.length;i++){
  const span=stops[i]-stops[i-1],v=Math.min(speed,Math.sqrt(span*.65)),ramp=v/.65;
  legs.push({span,v,ramp,run:span/v+ramp})
 }
 const half=legs.reduce((n,l)=>n+l.run+dwell,0);
 let clock=(railClock+(service?half:0)+line.index*33)%(2*half),reverse=clock>=half;
 clock%=half;let d=0;
 for(let j=0;j<legs.length;j++){
  const k=reverse?legs.length-1-j:j,l=legs[k];
  if(clock>l.run+dwell){clock-=l.run+dwell;continue}
  const u=Math.min(l.run,Math.max(0,clock-dwell));
  const shift=u<l.ramp?.325*u*u:u>l.run-l.ramp?l.span-.325*(l.run-u)**2:l.v*(u-l.ramp/2);
  d=reverse?stops[k+1]-shift:stops[k]+shift;break
 }
 const dir=reverse?-1:1,cars=[];
 for(let i=0;i<4;i++){
  // Leave room at terminal buffers for the entire consist in either direction.
  const carDistance=d+(service?-1:1)*(15-i*10),p=railSample(line,carDistance);
  const [x,y,z]=railOffset(p,terminalTrack(line,carDistance,dir));cars.push({...p,x,y,z,dir,engine:i===0,freight:!!service})
 }
 return cars
}
function nearRail(X,Z){
 return railCells.has(Math.floor(X/32)+','+Math.floor(Z/32))
}
function railHit(X,Z,Y){
 for(const l of railLines)for(const span of l.bridges){
  const a=railSample(l,span.start),b=railSample(l,span.end);
  if(X<Math.min(a.x,b.x)-15||X>Math.max(a.x,b.x)+15||Z<Math.min(a.z,b.z)-15||Z>Math.max(a.z,b.z)+15)continue;
  for(let d=span.start;d<span.end;d+=4){
   const p=railSample(l,d),dx=X-p.x,dz=Z-p.z,side=Math.abs(dx*p.dz-dz*p.dx);
   if(Math.abs(dx*p.dx+dz*p.dz)<3&&side<5.5&&Y>=p.y-1.3&&Y<=p.y+(side>4.8?3.3:.15))return '鉄道橋'
  }
 }
 for(const s of railSites){
  const dx=X-s.x,dz=Z-s.z,along=dx*s.dx+dz*s.dz,side=dx*s.dz-dz*s.dx,big=s.kind==='central';
  if(big&&Math.abs(along)<40.5&&Math.abs(side)<9.5&&Y>=s.y+8.5&&Y<s.y+12.5)return '駅大屋根';
  if(Math.abs(along)<(big?49:21.5)&&Math.abs((big?Math.abs(side):side)- (big?6:-6))<1.75&&Y<=s.y+1)return 'ホーム'
 }
 for(const b of railLots){
  const u=X-b.x,v=Z-b.z;if(Math.abs(u*b.dz-v*b.dx)<b.w/2&&Math.abs(u*b.dx+v*b.dz)<b.l/2&&Y<b.y+b.h+1)return '駅施設'
 }
 for(const l of railLines)if(nearLine(l,X,Z,12))for(const s of [0,1])for(const c of railCars(l,s)){
  const u=X-c.x,v=Z-c.z;if(Math.abs(u*c.dz-v*c.dx)<2&&Math.abs(u*c.dx+v*c.dz)<5&&Y<c.y+4)return '列車'
 }
}
// Static rail lots and formation are grouped in local tiles, invalidated on an origin change.
