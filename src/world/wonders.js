// Atlas metres. Footprints also set the horizontal journal discovery envelopes.
const wonders=[
 ['skyland','天蓋浮遊大陸',50000,50000,10000,10000,610,3200,'中央大海','緑の天蓋の下面に、切り立った岩の竜骨が連なる。'],
 ['skyfalls','天蓋の千丈滝',60000,50000,900,900,610,1600,'中央大海','雲を貫いた水の帯が、海上で白い飛沫にほどける。'],
 ['crater','星痕環湖',27000,56000,4300,3700,340,2600,'西部','衝突で押し上げられた外縁が青い窪地を囲む。'],
 ['abyss','地底回廊の大穴',33000,75000,2100,1700,5,510,'北西部','崩落壁の段々が暗い縦穴の奥に続く。'],
 ['peak','白冠天峰',71000,90000,4200,3800,560,3600,'北部','雪をまとった岩稜が雲海を割る。'],
 ['canyon','琥珀大峡谷',75000,61000,1900,3500,5,1700,'東部','蛇行する谷に沿って赤褐色の崖が続く。'],
 ['fault','熾火断層',22000,23000,4000,1300,10,1800,'南西部','黒い断裂の奥に細い赤熱帯がのぞく。'],
 ['caldera','蒼輪カルデラ',61000,17000,2000,1800,200,2000,'南部','火山の外輪に守られた広い盆地。'],
 ['pillars','雲梯石柱台地',85000,37000,3300,2500,250,2400,'南東部','風食された石塔が高原の縁に林立する。'],
 ['basin','白靄深盆地',21000,65000,3600,3000,10,1700,'西部','すり鉢の底には夕暮れにも白い霧が残る。']
].map(([id,name,x,z,rx,rz,minY,maxY,region,note])=>({id,name,x,z,rx,rz,minY,maxY,region,note}));
const waterfallSpokes=[0,9,26,43,55];
function withinWonder(s,wx,y,wz){
 if(y<s.minY||y>s.maxY)return false;
 if(s.id==='skyland')return Math.hypot(wx-50000,wz-50000)<1.04*skyRim(Math.atan2(wz-50000,wx-50000));
 if(s.id==='skyfalls')return waterfallSpokes.some(i=>{
  const [X,,Z]=skyVertex(i,20);
  return Math.hypot(wx-X,wz-Z)<s.rx
 });
 return Math.hypot((wx-s.x)/s.rx,(wz-s.z)/s.rz)<=1.08
}
const terrestrialWonders=wonders.slice(2);
function wonderProfile(id,u,v){
 const r=Math.hypot(u,v),edge=Math.max(0,1-r*r);
 const ridge=(at,width)=>Math.max(0,1-Math.abs(r-at)/width);
 switch(id){
 case 'crater':return 560*ridge(.76,.24)-180*edge;
 case 'abyss':return 195*ridge(.58,.4)-240*Math.max(0,1-r/.51);
 case 'peak':return 1500*(1-r)**1.45*(.88+.12*Math.cos(Math.atan2(v,u)*5));
 case 'canyon':return edge*(290-355*Math.max(0,1-Math.abs(u-.24*Math.sin(v*5))/.48));
 case 'fault':return edge*(120-225*Math.max(0,1-Math.abs(v-.18*Math.sin(7*u))/.22));
 case 'caldera':return 420*ridge(.69,.31)-95*edge;
 case 'pillars':return edge*(250+670*Math.pow(Math.max(0,Math.cos(u*12)*Math.cos(v*11)),3));
 default:return 220*ridge(.76,.24)-150*edge
 }
}
function wonderColor(id,r,u,v,height){
 if(id==='peak')return height>920?[234,221,209]:[115,111,124];
 if(id==='fault'&&Math.abs(v-.18*Math.sin(7*u))<.15)return [177,78,49];
 if(id==='crater'&&r<.45)return [76,122,135];
 if(id==='abyss'&&r<.43)return [48,43,58];
 if(id==='basin'&&r<.58)return [193,196,183];
 if(id==='caldera'&&r<.45)return [119,145,123];
 return height>330?[152,131,118]:[154,138,104]
}
function shapeWonderTerrain(wx,wz,vertices,triangles,colors){
 for(const s of terrestrialWonders){
  if(Math.abs(wx-s.x)>s.rx+1024||Math.abs(wz-s.z)>s.rz+1024)continue;
  for(let k=0;k<vertices.length;k+=3){
   const u=(wx+vertices[k]/20-s.x)/s.rx,v=(wz+vertices[k+1]/20-s.z)/s.rz;
   if(u*u+v*v>=1||vertices[k+2]<=0)continue;
   vertices[k+2]=Math.round(20*Math.min(1637,Math.max(3,vertices[k+2]/20+wonderProfile(s.id,u,v))))
  }
  for(let k=0;k<triangles.length;k+=3){
   const i=3*triangles[k],u=(wx+vertices[i]/20-s.x)/s.rx,v=(wz+vertices[i+1]/20-s.z)/s.rz,r=Math.hypot(u,v);
   if(r<.96&&colors[k])colors.set(wonderColor(s.id,r,u,v,vertices[i+2]/20),k)
  }
 }
}

// Beyond streamed terrain, a small radial mesh carries each skyline.
function drawDistantWonders(face,visible){
 const m=worldRegion();
 for(const s of terrestrialWonders){
  const X=s.x-m.wx,Z=s.z-m.wz,d=Math.hypot(X-x,Z-z);
  if(!visible(X,Z,Math.max(s.rx,s.rz))||d>34000)continue;
  if(s.id==='basin'&&d<11000){
   for(let j=0;j<3;j++){
    const radius=.36+j*.08,y=49+j*7;
    face(Array.from({length:14},(_,i)=>[X+radius*s.rx*Math.cos(tau*i/14),y,Z+radius*s.rz*Math.sin(tau*i/14)]),'rgba(220,222,210,0.32)')
   }
  }
  if(d<terrainViewRadius-Math.max(s.rx,s.rz))continue;
  for(const triangle of wonderSkylines[s.id]){
   const [a,b,c,color]=triangle;
   const dx=X+(a[0]+b[0]+c[0])/3-x,dz=Z+(a[2]+b[2]+c[2])/3-z;
   if(Math.hypot(dx,dz)<terrainViewRadius+800)continue;
   face([a,b,c].map(([u,y,v])=>[X+u,y,Z+v]),color)
  }
 }
}
