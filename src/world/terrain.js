const terrainAreaSize=2048,terrainViewRadius=6200;
const terrainLimits={cpuBytes:8*1048576,gpuBytes:16*1048576,railGpuBytes:8*1048576};
const terrainAreas=new Map();
let terrainAreaBytes=0,terrainLoads=0,terrainEvictions=0;
function trimTerrain(){
 while(terrainAreas.size>1&&terrainAreaBytes>terrainLimits.cpuBytes){
  const key=terrainAreas.keys().next().value;
  terrainAreaBytes-=terrainAreas.get(key).bytes;
  terrainAreas.delete(key);terrainEvictions++
 }
}
function clearTerrain(){
 terrainEvictions+=terrainAreas.size;terrainAreas.clear();terrainAreaBytes=0;
 activeRiverCells.clear();activeChannelTiles.clear();
 surfaceRenderer?.clearAreas()
}
function unpackTerrain(packed){
 const [vertexSize,indexSize,encoded]=packed,wide=vertexSize<0;
 const vertexBytes=Math.abs(vertexSize),colorBytes=indexSize/2;
 const planes=new Uint8Array(vertexBytes+indexSize+colorBytes),input=atob(encoded);
 let src=0,dst=0;
 function length(n){
  if(n===15){let extra;do{extra=input.charCodeAt(src++);n+=extra}while(extra===255)}
  return n
 }
 // LZ4 sequences contain literals followed by an optional overlapping match.
 while(src<input.length){
  const token=input.charCodeAt(src++),literals=length(token>>>4);
  for(let i=0;i<literals;i++)planes[dst++]=input.charCodeAt(src++);
  if(src===input.length)break;
  const offset=input.charCodeAt(src++)+256*input.charCodeAt(src++),count=4+length(token&15);
  for(let i=0;i<count;i++){planes[dst]=planes[dst-offset];dst++}
 }
 let cursor=0;
 function restore(size,stride,Type){
  const bytes=new Uint8Array(size);
  for(let lane=0;lane<stride;lane++)for(let i=lane;i<size;i+=stride)bytes[i]=planes[cursor++];
  return new Type(bytes.buffer)
 }
 return {vertices:restore(vertexBytes,wide?12:6,wide?Int32Array:Int16Array),
  triangles:restore(indexSize,2,Uint16Array),colors:restore(colorBytes,3,Uint8Array)}
}
function terrainArea(i,j){
 const key=i+','+j,packed=terrainArchive[key];
 if(!packed)return null;
 const existing=terrainAreas.get(key);
 if(existing){terrainAreas.delete(key);terrainAreas.set(key,existing);return existing}
 const {vertices,triangles,colors}=unpackTerrain(packed);
 const wx=(i+.5)*terrainAreaSize,wz=(j+.5)*terrainAreaSize;
 const area={wx,wz,vertices,triangles,colors,collision:null,bytes:vertices.byteLength+triangles.byteLength+colors.byteLength};
 terrainAreas.set(key,area);terrainAreaBytes+=area.bytes;terrainLoads++;trimTerrain();
 return area
}
function terrainCollision(area){
 if(area.collision)return area.collision;
 const {vertices,triangles}=area,counts=new Uint32Array(65);
 const inverse=new Float64Array(triangles.length/3);
 function visit(triangle,callback){
  const a=triangles[triangle]*3,b=triangles[triangle+1]*3,c=triangles[triangle+2]*3;
  const ax=vertices[a],az=vertices[a+1],bx=vertices[b],bz=vertices[b+1],cx=vertices[c],cz=vertices[c+1];
  const cell=n=>Math.min(7,Math.max(0,Math.floor((n+20480)/5120)));
  for(let i=cell(Math.min(ax,bx,cx));i<=cell(Math.max(ax,bx,cx));i++)
   for(let j=cell(Math.min(az,bz,cz));j<=cell(Math.max(az,bz,cz));j++)callback(i*8+j);
 }
 for(let t=0;t<triangles.length;t+=3){
  const a=triangles[t]*3,b=triangles[t+1]*3,c=triangles[t+2]*3;
  inverse[t/3]=1/((vertices[b]-vertices[a])*(vertices[c+1]-vertices[a+1])-(vertices[b+1]-vertices[a+1])*(vertices[c]-vertices[a]));
  visit(t,cell=>counts[cell+1]++)
 }
 for(let n=1;n<counts.length;n++)counts[n]+=counts[n-1];
 const slots=new Uint32Array(counts[64]),cursor=counts.slice();
 for(let t=0;t<triangles.length;t+=3)visit(t,cell=>{slots[cursor[cell]++]=t});
 area.collision={counts,slots,inverse};
 const bytes=counts.byteLength+slots.byteLength+inverse.byteLength;
 area.bytes+=bytes;terrainAreaBytes+=bytes;trimTerrain();
 return area.collision
}
function landElevation(X,Z){
 const area=terrainArea(Math.floor(X/terrainAreaSize),Math.floor(Z/terrainAreaSize));
 if(!area)return null;
 const {wx,wz,vertices,triangles}=area,{counts,slots,inverse}=terrainCollision(area);
 const lx=(X-wx)*20,lz=(Z-wz)*20;
 const bin=v=>Math.max(0,Math.min(7,Math.floor(v/256)));
 const cell=bin(X-(wx-1024))*8+bin(Z-(wz-1024));
 for(let k=counts[cell];k<counts[cell+1];k++){
  const t=slots[k],a=triangles[t]*3,b=triangles[t+1]*3,c=triangles[t+2]*3;
  const dx=lx-vertices[a],dz=lz-vertices[a+1],bx=vertices[b]-vertices[a],bz=vertices[b+1]-vertices[a+1],cx=vertices[c]-vertices[a],cz=vertices[c+1]-vertices[a+1];
  const u=(dx*cz-dz*cx)*inverse[t/3],v=(bx*dz-bz*dx)*inverse[t/3];
  if(u>=-.000001&&v>=-.000001&&u+v<=1.000001)
   return (vertices[a+2]+(vertices[b+2]-vertices[a+2])*u+(vertices[c+2]-vertices[a+2])*v)/20
 }
 return null
}
let terrainFocus='';
function closestOnSortieRoute(wx,wz,center,port){
 const dx=port.wx-center.wx,dz=port.wz-center.wz,length2=dx*dx+dz*dz;
 const u=length2?Math.max(0,Math.min(1,((wx-center.wx)*dx+(wz-center.wz)*dz)/length2)):0;
 return {wx:center.wx+dx*u,wz:center.wz+dz*u}
}
function missionTerrainDistance(wx,wz){
 if(mode!=='combat')return 0;
 const m=operation(),c=m.airspace;
 let distance=Math.hypot(Math.max(0,Math.abs(wx-c.wx)-boundary),Math.max(0,Math.abs(wz-c.wz)-boundary));
 for(const id of [m.departure,m.returnTo]){
  const point=closestOnSortieRoute(wx,wz,c,outposts[id]);
  distance=Math.min(distance,Math.hypot(wx-point.wx,wz-point.wz))
 }
 return distance
}
function outsideTerrain(i,j,wx,wz){
 const r=terrainViewRadius+terrainAreaSize*1.2;
 return Math.hypot((i+.5)*terrainAreaSize-wx,(j+.5)*terrainAreaSize-wz)>r
}
function updateTerrainFocus(){
 const m=operation(),wx=x+m.wx,wz=z+m.wz;
 const key=Math.floor(wx/512)+','+Math.floor(wz/512);
 if(terrainFocus===key)return;
 terrainFocus=key;
 for(const [key,area] of terrainAreas){
  if(Math.hypot(area.wx-wx,area.wz-wz)<=terrainViewRadius+terrainAreaSize*1.2)continue;
  terrainAreas.delete(key);terrainAreaBytes-=area.bytes;terrainEvictions++
 }
 surfaceRenderer?.pruneAreas(wx,wz);
 pruneRiverTiles(wx,wz);
 // Collision is also loaded synchronously on a cache miss, including after a teleport.
 const lead=Math.min(1600,320+airspeed*8);
 for(const distance of [0,lead*.5,lead]){
  const area=terrainArea(Math.floor((wx+Math.sin(yaw)*distance)/terrainAreaSize),Math.floor((wz+Math.cos(yaw)*distance)/terrainAreaSize));
  if(area)terrainCollision(area)
 }
}
function visibleTerrain(wx,wz,sn,cs,draw){
 const r=terrainViewRadius+terrainAreaSize*.71;
 for(let i=Math.floor((wx-r)/terrainAreaSize);i<=Math.floor((wx+r)/terrainAreaSize);i++)
  for(let j=Math.floor((wz-r)/terrainAreaSize);j<=Math.floor((wz+r)/terrainAreaSize);j++){
   const dx=(i+.5)*terrainAreaSize-wx,dz=(j+.5)*terrainAreaSize-wz,d=dx*sn+dz*cs;
   if(dx*dx+dz*dz>r*r||d< -1600||Math.abs(dx*cs-dz*sn)>Math.max(0,d)*w/h+2000)continue;
   if(terrainArchive[i+','+j]&&missionTerrainDistance(wx+dx,wz+dz)<4200+terrainAreaSize*.71)draw(i,j)
  }
}
function terrainPoint(area,t){
 const n=area.triangles[t]*3,v=area.vertices;
 return [area.wx+v[n]/20,v[n+2]/20,area.wz+v[n+1]/20]
}
function drawSurface(face,sn,cs){
 const m=operation();
 visibleTerrain(x+m.wx,z+m.wz,sn,cs,(i,j)=>{
  const area=terrainArea(i,j),{colors}=area;
  for(let t=0;t<colors.length;t+=3){
   if(!colors[t])continue;
   const pts=[t,t+1,t+2].map(k=>{const [X,Y,Z]=terrainPoint(area,k);return [X-m.wx,Y,Z-m.wz]});
   face(pts,'rgb('+colors[t]+','+colors[t+1]+','+colors[t+2]+')',-12)
  }
 })
}

function ground(X,Z){
 const m=operation(),elevation=landElevation(X+m.wx,Z+m.wz);
 return elevation??0
}
// Atlas coordinates are metres, measured east and north from the southwest corner.
