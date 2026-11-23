// World coordinates throughout this module. One sector owns both faces of the rim.
const skyRadius=10000,skyCenter=50000,skyBudget=1536*1024;
let inSky=false,cloudVeil=0,groundWarmup=0;
function leaveSky(){
 inSky=false;cloudVeil=0;groundWarmup=0;surfaceRenderer?.clearSky()
}
function selectFlightLayer(dt){
 const m=worldRegion(),distance=Math.hypot(x+m.wx-skyCenter,z+m.wz-skyCenter);
 const next=inSky?alt>=550&&distance<28500:alt>=610&&distance<27000;
 cloudVeil=Math.max(0,cloudVeil-dt*1.8);
 if(next===inSky)return;
 inSky=next;cloudVeil=1;terrainFocus=tileKey='';
 if(next){
  clearTerrain();tileCache.clear();groves.length=groundPixels.length=0
 }else{surfaceRenderer?.clearSky();ruinDistrictCache.clear();groundWarmup=12}
}
function skyRim(a){return skyRadius*(1+.047*Math.sin(5*a)+.031*Math.sin(9*a)+.022*Math.sin(13*a))}
function skyVertex(i,j,bottom=false){
 const a=(i%64)*tau/64,r=j/20,R=r*skyRim(a),u=R*Math.cos(a)/skyRadius,v=R*Math.sin(a)/skyRadius;
 let y;
 if(bottom)y=730+265*r*r+60*r*Math.sin(5*a)-60*Math.sin(Math.PI*r);
 else{
  const ridge=Math.exp(-((v-.22*Math.sin(4*u)-.27)**2)/.037);
  const spine=1050*ridge*(.58+.42*Math.cos(6*u)**2);
  const hill=180*(1+Math.sin(u*10+v*5)*Math.cos(v*11));
  y=1160+(1-r*r)*(hill+spine)+45*r*Math.sin(7*a);
  // Five headwater basins lead into radial valleys descending to the lip.
  for(const spoke of waterfallSpokes){
   const b=spoke*tau/64,along=u*Math.cos(b)+v*Math.sin(b),side=-u*Math.sin(b)+v*Math.cos(b);
   if(along<.48)continue;
   const influence=Math.max(0,1-Math.abs(side)/.115)*Math.min(1,(along-.48)/.09);
   y+=influence*(1235-90*along-y)
  }
 }
 return [skyCenter+u*skyRadius,y,skyCenter+v*skyRadius]
}
// The two projected rays form a linear basis. Its barycentric weights select
// precisely the same triangle as the nearest terrain LOD, including cliff lips.
function skyLevels(X,Z){
 const dx=X-skyCenter,dz=Z-skyCenter;
 if(Math.abs(dx)>11100||Math.abs(dz)>11100)return null;
 const i=Math.floor(((Math.atan2(dz,dx)/tau+1)%1)*64);
 const a=skyVertex(i,20),b=skyVertex(i+1,20),ax=a[0]-skyCenter,az=a[2]-skyCenter,bx=b[0]-skyCenter,bz=b[2]-skyCenter;
 const det=ax*bz-az*bx,U=(dx*bz-dz*bx)/det,V=(ax*dz-az*dx)/det;
 const r=Math.max(0,(U+V)*20);if(r>20.00001)return null;

 function level(bottom){
  const j=bottom?(r<11?0:11):Math.min(19,Math.floor(r)),k=bottom?(j===0?11:20):j+1;
  const f=Math.min(1,(r-j)/(k-j));
  const p=skyVertex(i,j,bottom)[1],q=skyVertex(i+1,j,bottom)[1],s=skyVertex(i,k,bottom)[1],t=skyVertex(i+1,k,bottom)[1];
  // diagonal joins inner left to outer right
  if(V*20>=k*f&&j){const w=(V*20-k*f)/j;return p*(1-f-w)+q*w+t*f}
  const w=V*20/k;return p*(1-f)+s*(f-w)+t*w
 }
 return {top:level(false),bottom:level(true)}
}
function skyContact(X,Y,Z){
 if(Y<650||Y>2800)return false;
 const levels=skyLevels(X,Z);return !!levels&&Y>=levels.bottom-.55&&Y<=levels.top+.55
}
function skySector(i,step,emit){
 for(let j=0;j<20;j+=step){
  const k=Math.min(20,j+step),a=skyVertex(i,j),b=skyVertex(i+1,j),c=skyVertex(i+1,k),d=skyVertex(i,k);
  const paint=(p,q,r)=>{
   const steep=(Math.max(p[1],q[1],r[1])-Math.min(p[1],q[1],r[1]))/(k-j);
   const tint=p[1]>2040?'#d8d5c0':steep>190?'#817b76':steep>100?'#9a927b':['#869969','#91a473','#a1ac79'][(i+Math.floor(j/3))%3];
   emit([p,q,r],tint)
  };
  if(j)paint(a,b,c);paint(a,c,d)
 }
 const rim=skyVertex(i,20),next=skyVertex(i+1,20);
 for(const [j,k] of [[0,11],[11,20]]){
  const a=skyVertex(i,j,true),b=skyVertex(i+1,j,true),c=skyVertex(i+1,k,true),d=skyVertex(i,k,true);
  if(j)emit([a,b,c],'#76665e');emit([a,c,d],j?'#76665e':'#615a60')
 }
 emit([rim,next,skyVertex(i+1,20,true),skyVertex(i,20,true)],i%3?'#a08973':'#b39a80')
}
function drawKingdom(face,visible,gpu){
 const m=worldRegion(),wx=x+m.wx,wz=z+m.wz,dist=Math.hypot(wx-skyCenter,wz-skyCenter);
 if(gpu)surfaceRenderer.pruneSkyDetail(dist);
 const local=(points,color)=>face(points.map(([X,Y,Z])=>[X-m.wx,Y,Z-m.wz]),color);
 for(let i=0;i<64;i+=4){
  const a=(i+2)*tau/64,X=skyCenter+5400*Math.cos(a),Z=skyCenter+5400*Math.sin(a);
  if(!visible(X-m.wx,Z-m.wz,6400))continue;
  const d=Math.hypot(wx-X,wz-Z),step=gpu?surfaceRenderer.skyTerrainStep(i,d):d<9500?1:d<15500?2:4;
  const build=emit=>{for(let k=i;k<i+4;k++)skySector(k,step,emit)};
  if(gpu)surfaceRenderer.skySector(i,step,build);else build(local)
 }
 drawSkyRuins(local,wx,wz,gpu);
 for(const i of waterfallSpokes){
  const [X,Y,Z]=skyVertex(i,20),a=i*tau/64,cs=Math.cos(a),sn=Math.sin(a);
  if(!visible(X-m.wx,Z-m.wz,4800))continue;
  const at=(r,width,y)=>[skyCenter+r*cs-width*sn,y,skyCenter+r*sn+width*cs];
  for(let j=12;j<20;j++){
   const p=skyVertex(i,j),q=skyVertex(i,j+1),r=j*skyRim(a)/20,s=(j+1)*skyRim(a)/20,width=j===12?175:58;
   local([at(r,-width,p[1]+6),at(r,width,p[1]+6),at(s,58,q[1]+6),at(s,-58,q[1]+6)],'#8ac3bd')
  }
  // A spring lake fills the head of each stepped channel.
  const lakeRadius=skyRim(a)*.60,lakeY=skyVertex(i,12)[1]+8;
  const lake=Array.from({length:16},(_,k)=>{
   const q=k*tau/16;return at(lakeRadius+230*Math.cos(q),175*Math.sin(q),lakeY)
  });
  local(lake,'#84bcb5');
  const R=skyRim(a);
  for(let n=-2;n<2;n++)local([at(R,n*30,Y+6),at(R,(n+1)*30,Y+6),at(R+75,(n+1)*52,475+15*Math.sin(t+n)),at(R+75,n*52,475+15*Math.sin(t+n))],n%2?'#dbede2':'#a9d6d4')
 }
}
