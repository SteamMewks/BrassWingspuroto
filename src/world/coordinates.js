const atlasMetre=worldSize/1254;
const worldCoasts=worldOutline.match(/M[^Z]+/g).map(path=>
 path.slice(1).trim().split(/\s+/).map(pair=>{
  const [u,v]=pair.split(',').map(Number);
  return [u*atlasMetre,(1254-v)*atlasMetre]
 }));
const atlasSites=[[376.04,853.4],[970,310],[1038,647]];
const continents=[];
// Flight coordinates use the fixed scenery origin of the selected region.
const regionOrigins=atlasSites.map(([u,v])=>({wx:u*atlasMetre,wz:(1254-v)*atlasMetre}));
function worldToLocal(wx,wz,origin=operation()){return {x:wx-origin.wx,z:wz-origin.wz}}
function localToWorld(X,Z,origin=operation()){return {wx:origin.wx+X,wz:origin.wz+Z}}
const runwayHeight=10,runwayWidth=36,runwayLength=300;
