// The survey stores decimetres relative to a 512 m world tile.
const countryDistricts=new Map(),countryTileSize=512;
function loadCountryTile(i,j,encoded){
 const origin=worldToLocal(i*countryTileSize,j*countryTileSize);
 const unpack=s=>new Int16Array(Uint8Array.from(atob(s),c=>c.charCodeAt(0)).buffer);
 const roads=[],lots=[],points=unpack(encoded[0]),buildings=unpack(encoded[1]);
 for(let n=0;n<points.length;n+=13){
  const road=[];
  road.crossing=Boolean(points[n]);
  for(let k=n+1;k<n+13;k+=3)road.push([origin.x+points[k]/10,points[k+1]/10,origin.z+points[k+2]/10]);
  roads.push(road)
 }
 const owners=encoded[2]?unpack(encoded[2]):null;
 for(let n=0;n<buildings.length;n+=9){
  const [station,style,X,Y,Z,W,L,H,angle]=buildings.subarray(n,n+9);
  lots.push({hamletId:owners?countryHamlets[owners[n/9]-1]?.id:undefined,stationId:countryStations[station],style:countryStyles[style],x:origin.x+X/10,y:Y/10,z:origin.z+Z/10,
   w:W/10,l:L/10,h:H/10,radius:Math.hypot(W,L)/20,dx:Math.sin(angle/1000),dz:Math.cos(angle/1000)})
 }
 return {key:i+','+j,i,j,x:origin.x+256,z:origin.z+256,roads,lots}
}
function streamDistricts(){
 const {wx,wz}=localToWorld(x,z),tx=Math.floor(wx/countryTileSize),tz=Math.floor(wz/countryTileSize);
 for(const [key,tile] of countryDistricts)if(Math.abs(tile.i-tx)>6||Math.abs(tile.j-tz)>6)countryDistricts.delete(key);
 for(let i=tx-5;i<=tx+5;i++)for(let j=tz-5;j<=tz+5;j++){
  const key=i+','+j;
  if(countrySurvey[key]&&!countryDistricts.has(key))countryDistricts.set(key,loadCountryTile(i,j,countrySurvey[key]))
 }
}
