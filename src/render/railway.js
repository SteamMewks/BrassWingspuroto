const railwayTileSize=384;
let chartLines=null,railTileCenters=[];
function drawRail(face,gpu){
 if(gpu&&chartLines!==railLines){
  chartLines=railLines;gpu.clearRail();const cells=new Map();
  const add=p=>{const i=Math.floor(p.x/railwayTileSize),j=Math.floor(p.z/railwayTileSize);cells.set(i+','+j,{i,j,x:(i+.5)*railwayTileSize,z:(j+.5)*railwayTileSize})};
  for(const l of railLines){l.path.forEach(add);for(const b of l.bridges)add(railSample(l,(b.start+b.end)/2))}
  for(const collection of [railSites,railLots,railCrossings])collection.forEach(add);
  for(const s of baseSpurs)add(s.end);
  for(const id of ['brass-port','red-strait']){const b=airbases[id];add(worldToLocal(b.wx+265,b.wz))}
  railTileCenters=[...cells.values()]
 }
 for(const area of countryDistricts.values()){
  const dx=area.x-x,dz=area.z-z,range=Math.hypot(dx,dz);
  if(range>2650||dx*Math.sin(cameraYaw)+dz*Math.cos(cameraYaw)<-385)continue;
  const tier=range<680?0:range<1450?1:2;
  if(gpu)gpu.railTile('country/'+area.key+'/'+tier,area,emit=>railGeometry(emit,null,tier,false,area));
  else railGeometry(face,null,tier,false,area)
 }
 if(!gpu){railGeometry(face);return}
 const sn=Math.sin(cameraYaw),cs=Math.cos(cameraYaw),detail=Math.max(.8,Math.min(1.4,h/420));
 for(const tile of railTileCenters){
  const dx=tile.x-x,dz=tile.z-z,d=dx*sn+dz*cs,r=Math.hypot(dx,dz);
  if(r>2900||d< -540||Math.abs(dx*cs-dz*sn)>Math.max(0,d)*w/h+540)continue;
  const range=Math.hypot(Math.max(0,r-272),Math.max(0,alt-ground(tile.x,tile.z)))/detail;
  const tier=range<340?0:range<1050?1:2;
  gpu.railTile(tile.i+','+tile.j+','+tier,tile,emit=>railGeometry(emit,tile,tier))
 }
 railGeometry(face,null,0,true)
}
function railGeometry(face,tile=null,tier=0,movingOnly=false,area=null){
 const sn=Math.sin(cameraYaw),cs=Math.cos(cameraYaw);
 const near=(p,r,margin=180)=>{
  if(area)return tier===0||r>=(tier===1?500:1000);
  if(tile)return Math.floor(p.x/railwayTileSize)===tile.i&&Math.floor(p.z/railwayTileSize)===tile.j&&(tier===0||r>=(tier===1?500:1000));
  const dx=p.x-x,dz=p.z-z,forward=dx*sn+dz*cs;
  return Math.abs(dx)<r&&Math.abs(dz)<r&&forward>=-margin&&Math.abs(dx*cs-dz*sn)<Math.max(0,forward)*w/h+margin
 };
 function ribbon(a,b,left,right,h,color,order=2){face([railOffset(a,left,0,h),railOffset(a,right,0,h),railOffset(b,right,0,h),railOffset(b,left,0,h)],color,order)}
 function box(p,side,along,w,l,h,color,roof,base=0,pitch=0){
  const at=(u,v,y)=>railOffset(p,side+u,along+v,base+y);
  const foot=[at(-w/2,-l/2,0),at(w/2,-l/2,0),at(w/2,l/2,0),at(-w/2,l/2,0)];
  const top=foot.map(([a,b,c])=>[a,b+h,c]);
  for(let i=0;i<4;i++){const j=(i+1)%4;face([foot[i],foot[j],top[j],top[i]],color,3)}
  if(pitch){const a=at(0,-l/2,h+pitch),b=at(0,l/2,h+pitch);face([top[0],top[3],b,a],roof,4);face([a,b,top[2],top[1]],roof,4);face([top[0],a,top[1]],color,4);face([top[3],top[2],b],color,4)}
  else face(top,roof,4)
 }
 if(area){
  for(const quad of area.roads)face(quad,quad.crossing?'#7b6550':'#ae8961',2);
  drawLots(area.lots);return
 }
 // Eight-sided boiler and driving wheels share the vehicle heading through bends.
 function roundPart(p,axis,side,along,up,radius,length,colors){
  const ends=[[],[]];
  for(let e=0;e<2;e++)for(let i=0;i<8;i++){
   const a=i*Math.PI/4,h=radius*Math.sin(a),v=radius*Math.cos(a),d=(e-.5)*length;
   ends[e].push(railOffset(p,side+(axis==='axle'?d:v),along+(axis==='axle'?v:d),up+h))
  }
  for(let i=0;i<8;i++){const j=(i+1)%8;face([ends[0][i],ends[0][j],ends[1][j],ends[1][i]],colors[i%colors.length],5)}
  for(const ring of ends)face(ring,colors[0],5)
 }
 if(!movingOnly)for(const spur of baseSpurs){
  if(!near(spur.end,2000,1100))continue;
  for(let i=1;i<spur.curve.length;i++){
   const a=spur.curve[i-1],b=spur.curve[i];ribbon(a,b,-2,2,-.2,'#82725e');
   for(const k of [-.74,.74])ribbon(a,b,k-.12,k+.12,.1,'#c7b99e',4)
  }
  box(spur.end,-5,0,5,25,1.3,'#937e67','#bfa88c');box(spur.end,-13,0,10,21,6,'#a26950','#767563',0,2)
 }
 if(!movingOnly)for(const p of railCrossings)if(near(p,450)){
  for(const side of [-1,1]){box(p,side*8,-4,1,1,3.5,'#755f48','#c9ad79');box(p,side*8,-1,.4,6,.35,'#a45a45','#d7bf90',2.4)}
 }
 if(!movingOnly)for(const id of ['brass-port','red-strait']){
  const base=airbases[id],p={...worldToLocal(base.wx+265,base.wz),dx:1,dz:0,y:10};
  if(!near(p,1400))continue;
  box(p,0,0,17,35,9,'#8c6b52','#6b7366',0,3);
  box(p,-17,0,8,14,3,'#514b41','#575044');
  for(let k=0;k<11;k++){box(p,0,32+k*16,9,16,.8,'#826c50','#a48a68');box(p,0,32+k*16,6,2,10,'#716855','#99886d',-10)}
 }
 if(!tile)for(const line of shipping){
  const time=(railClock*7+80)%(2*line.length),p=railSample(line,time>line.length?2*line.length-time:time);
  if(near(p,2400)){box(p,0,0,9,32,3,'#4e5351','#9b8466');box(p,0,-7,6,8,4,'#b8a182','#72776f',3);box(p,0,-4,1.6,2,5,'#764a3b','#443c37',7);
   for(const v of [0,6,12])box(p,0,v,5,4,2,'#846047','#aa805a',3)}
 }
 for(const l of railLines){
  if(!nearLine(l,tile?tile.x:x,tile?tile.z:z,tile?800:2600))continue;
  if(!movingOnly)for(let i=1;i<l.path.length;i++){
   const a=l.path[i-1],b=l.path[i];if(!near(a,1850))continue;
   const p=a.pose??=railSample(l,a.d),q=b.pose??=railSample(l,b.d),close=near(p,350);
   const floorA=a.floor??=ground(p.x,p.z),floorB=b.floor??=ground(q.x,q.z);
   const bridge=l.bridges.some(span=>a.d>=span.start-.01&&b.d<=span.end+.01);
   const raised=bridge||p.y-floorA>1.1||q.y-floorB>1.1;
   ribbon(p,q,-5,5,-.24,raised?'#777c70':'#766a59');
   if(raised)for(const side of [-5,5]){
    const outer=bridge?side:side*1.5;
    face([railOffset(p,outer,0,bridge?-1.25:floorA-p.y),railOffset(q,outer,0,bridge?-1.25:floorB-q.y),railOffset(q,side,0,-.23),railOffset(p,side,0,-.23)],bridge?'#485954':'#978775',3)
   }
   if(tier===2){for(const side of [-2.5,2.5])ribbon(p,q,side-.78,side+.78,.08,'#ada18b',4);continue}
   for(const side of [-2.5,2.5]){
    if(close)for(let d=2*Math.ceil(a.d/2);d<b.d;d+=2){const s=railSample(l,d);face([railOffset(s,side-1.25,-.14),railOffset(s,side+1.25,-.14),railOffset(s,side+1.25,.14),railOffset(s,side-1.25,.14)],'#524338',3)}
    for(const u of [-.74,.74])ribbon(p,q,side+u-.11,side+u+.11,.11,'#c8bca3',4)
   }
  }
  if(!movingOnly)for(const span of l.bridges){
   const mid=railSample(l,(span.start+span.end)/2);if(!near(mid,1700))continue;
   for(const d of [span.start,span.end]){const p=railSample(l,d);box(p,0,0,12,4,Math.max(.4,p.y-ground(p.x,p.z)-.6),'#887d6c','#b6a895',ground(p.x,p.z)-p.y)}
   const panels=Math.ceil((span.end-span.start)/8);
   for(let j=0;j<panels;j++){
    const a=railSample(l,span.start+(span.end-span.start)*j/panels),b=railSample(l,span.start+(span.end-span.start)*(j+1)/panels);
    for(const side of [-5.1,5.1]){
     const girder=(lo,hi,depth)=>face([railOffset(a,side,0,lo),railOffset(b,side,0,hi),railOffset(b,side,0,hi+depth),railOffset(a,side,0,lo+depth)],'#455b55',5);
     girder(2.9,2.9,.3);girder(j%2?2.9:.1,j%2?.1:2.9,.33);
     if(j%8===4&&panels>12)box(a,0,0,10,2.5,Math.max(.4,a.y-ground(a.x,a.z)-.8),'#867f70','#a79c86',ground(a.x,a.z)-a.y)
    }
   }
  }
  if(!movingOnly)for(const dir of [-1,1]){
   const terminal=dir===1?l.path[0]:l.path.at(-1);if(!near(terminal,650))continue;
   for(let j=85;j<140;j+=5){
    const d=dir===1?j:l.length-j,next=d+dir*5,a=railSample(l,d),b=railSample(l,next);
    for(const u of [-.74,.74]){
     const left=terminalTrack(l,d,dir)+u,right=terminalTrack(l,next,dir)+u;
     face([railOffset(a,left-.11,0,.14),railOffset(a,left+.11,0,.14),railOffset(b,right+.11,0,.14),railOffset(b,right-.11,0,.14)],'#c8bca3',5)
    }
   }
  }
  if(!tile)for(const service of [0,1])for(const c of railCars(l,service)){
   if(!near(c,2500))continue;
   box(c,0,0,2.9,8.6,1,'#433a34','#5a4d40');
   box(c,0,0,c.engine?1.7:2.8,c.engine?7:8,c.engine?1.4:2.6,c.engine?'#354642':service?'#80513d':'#793e35',service?'#595046':'#aa9976',1,.35);
   if(near(c,300))for(const axle of [-3,0,3])for(const side of [-1.43,1.43])roundPart(c,'axle',side,axle,.72,.73,.24,['#423e37','#6d5947']);
   if(c.engine&&near(c,1050)){if(near(c,550))roundPart(c,'boiler',0,c.dir*.6,2.25,1.15,5.2,['#45544b','#596257','#37463f','#324139']);box(c,0,-c.dir*2.7,2.9,2.5,2.8,'#475649','#b69c66',1);
    box(c,0,c.dir*2.4,.8,.8,1.6,'#3b3631','#ae9271',3);
    if(near(c,480))for(let j=0;j<3;j++){const u=(railClock*.5+j/3)%1,R=.6+u*1.7;box(c,u*2,c.dir*(2.4-u*8),R,R,R,'rgba(120,115,109,.35)','rgba(170,163,149,.4)',4.6+u*7)}
   }else if(!service&&near(c,420))for(let j=-3;j<=3;j+=2)box(c,0,j,2.84,1,.85,'#d2b680','#b29574',2)
  }
 }
 if(!movingOnly)for(const s of railSites){
  if(!near(s,1800))continue;const big=s.kind==='central',L=big?98:43;
  for(const side of big?[-6,6]:[-6])box(s,side,0,3.5,L,1,'#98836c','#d1bd9e');
  if(s.kind==='port'){
   box(s,0,58,42,19,9,'#817566','#b3a083',-9);
   for(const side of [-15,15]){box(s,side,53,2,2,13,'#5d655a','#a99571');box(s,side,58,1,13,1.4,'#6c7366','#b69568',12)}
  }
  if(big&&tier<2){box(s,-51,0,23,104,.18,'#ad997c','#b8a285');
   for(let j=-35;j<=35;j+=10)box(s,0,j,18,.65,.8,'#54665f','#64756c',10);
   for(const side of [-7,7])for(let j=-36;j<=36;j+=18)box(s,side,j,.7,.8,9,'#4d5752','#5f6559');
   box(s,0,0,19,81,.5,'#58685f','#93aaa3',9,3)}
  const count=tier===2?0:big?3:1;
  for(let n=0;n<count;n++){
   const offset=11+n*6;
   for(const u of [-.74,.74])for(const sign of [-1,1]){
    const start=railOffset(s,2.5+u,sign*(L/2+32)),end=railOffset(s,offset+u,sign*(L/2-4));
    face([start,end,[end[0]+.3,end[1],end[2]],[start[0]+.3,start[1],start[2]]],'#c9baa0',4);
    box(s,offset+u,0,.24,L-8,.18,'#797165','#b7b19b')
   }
  }
 }
 drawLots(railLots);
 function drawLots(lots){
  for(const b of lots){
   if(b.style==='beacon'){if(tile)continue;
    if(near(b,2300)){
     box(b,0,0,7,7,7,'#958a74','#ae9e84');box(b,0,0,5,5,11,'#c4b9a1','#ac9a7c',7);
     box(b,0,0,6,6,1,'#595e51','#777469',18);
     box(b,0,0,3.8,3.8,2.6,Math.cos(railClock*1.6)>.45?'#ffe7a3':'#bfaa78','#9a8f71',19);
     box(b,0,0,5,5,.5,'#745344','#87634e',21.6,1)
    }
    continue
   }
   if(!tile&&b.style==='stack'&&near(b,800))for(let j=0;j<4;j++){const u=(railClock*.14+j/4)%1,R=1+u*3;box(b,2*u,u*5,R,R,R,'rgba(102,99,91,.35)','rgba(126,122,112,.35)',b.h+u*12)}
   if(movingOnly||!near(b,1900))continue;const colors={field:['#90804f','#aa9657'],coal:['#4c4843','#5c5146'],logs:['#805a3c','#ae8555'],tank:['#625748','#88918a'],stack:['#9a5948','#d1aa84'],house:['#a17a64','#746457'],hall:['#a05d48','#687673'],works:['#995e49','#736759'],shed:['#947459','#70746b']};
   const [wall,roof]=colors[b.style],gable=['house','hall','shed','works'].includes(b.style);
   box(b,0,0,b.w,b.l,b.h,wall,roof,0,gable&&tier<2&&near(b,950)?b.w*.22:0);
   if(gable&&near(b,600))for(let k=-b.l/2+3;k<b.l/2-1;k+=6)box(b,0,k,b.w+.16,2,2.4,'#dab889','#b79a70',b.h-4);
   if(b.stationId&&b.style==='field'&&near(b,340)){
    for(const side of [-1,1]){
     box(b,side*b.w/2,0,.6,b.l,1.1,'#806649','#ac9467');
     for(const along of [-1,0,1])box(b,side*b.w/2,along*b.l/2,1,1,2,'#765a43','#a1875c')
    }
   }
   if(tier<2&&b.style==='tank')box(b,0,0,b.w+3,b.l+3,5,'#758080','#9a9b89',b.h-4)
  }
 }
}
