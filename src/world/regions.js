const regions=['黄銅港市','紫煙の屈曲谷','赤銅要塞群島'];
const quarters=[],cliffs=[];
for(const [stage,m] of missions.entries()){
 const {x:bx,z:bz}=worldToLocal(airbases[m.departure].wx,airbases[m.departure].wz,m);
 const normal=Math.hypot(bx,bz),nx=bx/normal,nz=bz/normal;
 m.town=stage===1?[-1450,1450]:[-nx*1780,-nz*1780];
 if(stage===2)for(let j=-2;j<=2;j++){
  const offshore=(1600+220*Math.cos(j*2))/5,along=j*610/5;
  continents.push([m.wx+nx*offshore-nz*along,m.wz+nz*offshore+nx*along,'赤銅群島',3,(145+32*Math.cos(j))/5,(115+25*Math.sin(j))/5,j+4,.42*j])
 }
}
function valleyAxis(Z){return -160+300*Math.sin(Z/550)+42*Math.sin(Z/183)}
// Each cross-section has a floor, crown and depth shared by the mesh and collision.
const archZ=810,archX=valleyAxis(archZ);
const archSections=Array.from({length:41},(_,i)=>{
 const u=(i-20)/20,dx=u*209,inner=Math.abs(dx-5)/142;
 const floor=10+100*Math.sqrt(Math.max(0,1-inner*inner));
 const roof=10+(128+6*Math.sin(u*8)+3*Math.cos(u*17))*Math.pow(Math.max(0,1-u*u),.55);
 return [archX+dx,floor,Math.max(floor,roof),archZ+11*Math.sin(u*3),20+11*u*u+3*Math.cos(u*11)]
});
function hitsArch(X,Z,Y){
 const slot=(X-archSections[0][0])/10.45,i=Math.floor(slot);
 if(i<0||i>=40)return false;
 const a=archSections[i],b=archSections[i+1],f=slot-i;
 const mix=k=>a[k]+(b[k]-a[k])*f;
 return Math.abs(Z-mix(3))<=mix(4)&&Y>=mix(1)-.55&&Y<=mix(2)+.55
}
const roads=[];
