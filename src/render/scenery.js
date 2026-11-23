
function drawScenery(sn,cs,eye,f,horizon,objects){
 updateTerrainFocus();
 const accelerated=surfaceRenderer?.begin(sn,cs,eye,f,horizon);
 function sceneryVisible(X,Z,radius){
  const dx=X-x,dz=Z-z,d=32+dx*sn+dz*cs;
  return d>=2-radius&&Math.abs(dx*cs-dz*sn)<=Math.max(0,d)*w/(2*f)+radius*(1+w/(2*f))
 }
 let building=null;
 function face(points,color,order=0){
  if(building){const {x:cx,z:cz,angle}=building,c=Math.cos(angle),s=Math.sin(angle);points=points.map(([X,Y,Z])=>[cx+(X-cx)*c-(Z-cz)*s,Y,cz+(X-cx)*s+(Z-cz)*c])}
  if(accelerated){surfaceRenderer.face(points,color);return}
  const pts=points.map(([X,Y,Z])=>[(X-x)*cs-(Z-z)*sn,Y,32+(X-x)*sn+(Z-z)*cs]);
  const clipped=[];
  for(let i=0;i<pts.length;i++){const a=pts[(i+pts.length-1)%pts.length],b=pts[i];
   if((a[2]>2)!==(b[2]>2)){let u=(2-a[2])/(b[2]-a[2]);clipped.push([a[0]+u*(b[0]-a[0]),a[1]+u*(b[1]-a[1]),2])}
   if(b[2]>2)clipped.push(b)
  }
  if(clipped.length<3)return;
  const screen=clipped.map(([u,Y,d])=>[w/2+u*f/d,horizon+(eye-Y)*f/d]);
  if(screen.every(p=>p[0]<0)||screen.every(p=>p[0]>w)||screen.every(p=>p[1]>h))return;
  objects.push([clipped.reduce((sum,p)=>sum+p[2],0)/clipped.length-order,()=>poly(screen,color)])
 }
 drawSkyland(face,sceneryVisible);
 drawDistantWonders(face,sceneryVisible);
 drawRelics(face,sceneryVisible,accelerated);
 if(!accelerated)drawSurface(face,sn,cs);drawChannels(face,sn,cs,eye,f,horizon);
 function strip(cx,cz,Y,width,length,color,order=0){
  face([[cx-width/2,Y,cz-length/2],[cx+width/2,Y,cz-length/2],[cx+width/2,Y,cz+length/2],[cx-width/2,Y,cz+length/2]],color,order)
 }
 function block(cx,cz,Y,width,length,height,roof){
  const foot=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([u,v])=>[cx+u*width/2,Y,cz+v*length/2]),top=foot.map(([X,y,Z])=>[X,y+height,Z]);
  for(let j=0;j<4;j++){const n=(j+1)%4;face([foot[j],foot[n],top[n],top[j]],(building?.industry==='stack'?(width>building.w?'#e9c5a1':'#9a5545'):building?.industry==='stock'?roof:building?.deck?['#5c6865','#4d5654','#80877e','#67706b'][j]:building&&!building.industry?['#a06a52','#875741','#b58062','#916b54'][j]:['#78766a','#575e58','#939080','#66695e'][j]))}
  face(top,roof,.1)
 }

 for(const wall of cliffs)for(let row=0;row<wall.length-1;row++){
  const a=wall[row],b=wall[row+1];
  if(Math.abs(a[0][2]-z)>3200||!sceneryVisible(a[0][0],a[0][2],1200))continue;
  for(let i=0;i<a.length-1;i++){
   // The cliff and benches themselves belong to the shared survey mesh.
   if(wall.passSide===1&&row>=16&&row<36&&[2,4,6].includes(i)){
    const lane=(r,t)=>[r[i][0]+(r[i+1][0]-r[i][0])*t,r[i][1]+.16,r[i][2]];
    face([lane(a,.04),lane(a,.15),lane(b,.15),lane(b,.04)],'#796b5d',2);
   }
   if(wall.passSide===1&&i===5&&[20,27,34].includes(row)){
    // Paint the adit mouth on the cut face. Its back wall remains solid.
    const mouth=(t,rise)=>{
     const lower=a[i][0]+(b[i][0]-a[i][0])*t,upper=a[i+1][0]+(b[i+1][0]-a[i+1][0])*t;
     return [lower+(upper-lower)*rise-.4,a[i][1]+(a[i+1][1]-a[i][1])*rise,a[i][2]+64*t]
    };
    face([mouth(.27,0),mouth(.27,.23),mouth(.36,.34),mouth(.64,.34),mouth(.73,.23),mouth(.73,0)],'#453e39',3)
   }
  }
 }
 if(cliffs.length&&sceneryVisible(archX,archZ,240)){
  const corners=([X,low,high,Z,d])=>[[X,low,Z-d],[X,high,Z-d],[X,high,Z+d],[X,low,Z+d]];
  for(let i=0;i<40;i++){
   const a=corners(archSections[i]),b=corners(archSections[i+1]);
   for(let j=0;j<4;j++){const n=(j+1)%4;face([a[j],b[j],b[n],a[n]],['#a78c73','#bda888','#937966','#655c58'][j])}
  }
 }
 const detail=groundDetailRange(alt-ground(x,z));
 if(detail>.35)for(const road of roads)if(Math.abs(road[0][0]-x)<2700&&Math.abs(road[0][2]-z)<2700&&sceneryVisible(road[0][0],road[0][2],180))face(road,'#989077');
 for(const b of quarters){
  const distance=Math.hypot(x-b.x,z-b.z);
  if(distance>2700*detail||!sceneryVisible(b.x,b.z,b.radius+4))continue;
  building=b;
  block(b.x,b.z,b.y,b.w,b.l,b.h,b.roof);
  if(distance>1250*detail)continue;
  if(b.industry){
   if(b.industry==='stack'&&distance<720)for(const fraction of [.6,.86])
    block(b.x,b.z,b.y+b.h*fraction,b.w+.2,b.l+.2,5,'#e9c5a1');
   continue
  }
  const eaves=b.y+b.h,rise=4+b.w*.13,roofPoint=(i,j,h)=>[b.x+i*b.w,eaves+h,b.z+j*b.l];
  for(const side of [-1,1]){
   face([roofPoint(side*.52,-.52,0),roofPoint(side*.52,.52,0),roofPoint(0,.52,rise),roofPoint(0,-.52,rise)],b.roof,1);
   face([roofPoint(-.5,side*.5,0),roofPoint(.5,side*.5,0),roofPoint(0,side*.5,rise)],'#a87960',1)
  }
  if(distance<600)block(b.x+b.w*.22,b.z-b.l*.2,eaves+b.w*.05,2.2,2.6,rise,'#ad775b');
  if(distance<520)for(const side of [-1,1])for(let j=-1;j<=1;j++){
   const X=b.x+j*b.w*.28,Z=b.z+side*(b.l/2+.1);
   for(let Y=b.y+b.h-7;Y>b.y+2;Y-=12){
   face([[X-2,Y,Z],[X+2,Y,Z],[X+2,Y+3,Z],[X-2,Y+3,Z]],'#edbc76',1)}
  }
 }
 building=null;if(detail>.18)drawRail(face,accelerated?surfaceRenderer:null);
 for(const b of localBases){
  const distance=Math.hypot(x-b.x,z-b.z);
  if(distance>=3500||!sceneryVisible(b.x,b.z,360))continue;
  const Y=b.height;
  if(distance>1050)strip(b.x,b.z,Y+.13,b.width,b.length,'#535959');
  else
  for(let offset=10-b.length/2;offset<b.length/2;offset+=20){
   const Z=b.z+offset;
   strip(b.x,Z,Y+.1,b.width,20,'#535959');strip(b.x,Z,Y+.2,1.5,10,'#e1d4ae',.3);
   for(const u of [-1,1]){strip(b.x+u*16,Z,Y+.2,.8,20,'#cabfa0',.3);strip(b.x+u*62,Z,Y+.1,10,20,'#99917a')}
  }
  for(const obj of baseFacilities(b)){
   const X=b.x+obj.x,Z=b.z+obj.z;
   if(obj.y===0)strip(X,Z,Y+.15,obj.w+18,obj.l+9,'#a39b83');
   block(X,Z,Y+obj.y,obj.w,obj.l,obj.h,obj.roof);
   if(obj.h===15){strip(X,Z,Y+15.2,obj.w-3,3,'#99a294',.5);strip((X+b.x)/2,Z,Y+.25,Math.abs(obj.x)-32,8,'#a29b89',.5)}
  }
 }
 for(const ship of localShips)if(Math.hypot(x-ship.x,z-ship.z)<3500&&sceneryVisible(ship.x,ship.z,130)){
  building={x:ship.x,z:ship.z,angle:-ship.heading,deck:true};
  for(const {offset,width} of deckSections){
   const Z=ship.z+offset;
   block(ship.x,Z,0,width,21,deckHeight,'#625f58');
   strip(ship.x-4,Z,13.15,1.3,12,'#e5cf96',.4);
   for(const sign of [-1,1]){strip(ship.x+sign*(width/2-2),Z,13.15,1,20,'#c6ad7b',.4);
    if(offset<0)strip(ship.x+sign*(width/2-1),Z-8,13.3,2,2,'#9aefd6',1)}
  }
  for(const [dx,dz,y,width,length,height,color] of shipStructures)block(ship.x+dx,ship.z+dz,y,width,length,height,color)
 }
 drawCloudBanks(face,sceneryVisible);
 if(accelerated){surfaceRenderer.end();surfaceRenderer.trees(sn,cs,eye,f,horizon)}
}

// Broken banks are anchored to the world grid. The camera can pass between them.
function drawCloudBanks(face,visible){
 const density=Math.min(1,Math.max(0,(alt-280)/200));
 if(!density)return;
 const m=operation(),cell=960,wx=x+m.wx,wz=z+m.wz;
 for(let i=-7;i<=7;i++)for(let j=-7;j<=7;j++){
  const a=Math.floor(wx/cell)+i,b=Math.floor(wz/cell)+j,n=noise(a,b,617);
  if(n<.19)continue;
  const X=(a+.5)*cell-m.wx,Z=(b+.5)*cell-m.wz;
  if(!visible(X,Z,800))continue;
  const distance=Math.hypot(x-X,z-Z),fade=Math.min(1,Math.max(0,(6500-distance)/1700));
  if(!fade)continue;
  const y=480+75*n,r=cell*(.50+n*.33);
  // Updrafts break the cloud deck above conspicuous terrain.
  let cover=1;
  for(const s of terrestrialWonders){
   const radial=Math.hypot((X+m.wx-s.x)/s.rx,(Z+m.wz-s.z)/s.rz);
   cover=Math.min(cover,Math.max(0,(radial-.72)*2))
  }
  const inside=Math.max(0,1-Math.abs(alt-y)/80)*Math.max(0,1-distance/1450);
  const opacity=Math.round(16*density*fade*cover*(1-.72*inside))/16;
  if(!opacity)continue;
  const sides=distance<2400?16:8;
  const rim=Array.from({length:sides},(_,k)=>{const angle=tau*k/sides;
   const lobe=1+.09*Math.cos(5*angle+n*7)+.06*Math.sin(3*angle);
   return [X+r*lobe*Math.cos(angle),y-18+9*Math.sin(3*angle),Z+r*lobe*.85*Math.sin(angle)]});
  for(let k=0;k<sides;k++)face([rim[k],rim[(k+1)%sides],[X,y+42,Z]],
   k<sides/2?'rgba(251,235,222,'+opacity+')':'rgba(229,216,218,'+opacity+')')
 }
}
