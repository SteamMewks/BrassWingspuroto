
function buildWorld(){
 leaveSky();ruinDistrictCache.clear();clearTerrain();terrainFocus='';
 terraces.length=isles.length=groves.length=groundPixels.length=0;tileCache.clear();tileKey='';
 const m=worldRegion();
 localBases=Object.values({...airbases,...settlements}).map(b=>({...b,...worldToLocal(b.wx,b.wz,m),side:affiliation(b.id)}));
 localShips=Object.values(carriers).map(b=>({...b,...worldToLocal(b.wx,b.wz,m),side:affiliation(b.id),sin:Math.sin(b.heading),cos:Math.cos(b.heading)}));
 base=[...localBases,...localShips].find(b=>b.id===m.departure);
 regionRunway=localBases.find(b=>b.id===landscapes[m.region].departure);
 ship=localShips[m.region===2?1:0];
 landingPorts=[...localBases,...localShips].filter(b=>b.side!=='pirate');
 occupiedPorts=[...localBases,...localShips].filter(b=>b.side==='pirate');
 cutCoast();
 for(const l of continents){
  const {x:X,z:Z}=worldToLocal(l[0],l[1],m);
  isles.push([X,Z,...l.slice(2)])
 }
 shoreMeshes.length=0;
 for(const [cx,cz,,,rx,rz,phase,rotation,anchor] of isles){
  const outer=[],inner=[],faces=[],c=Math.cos(rotation),s=Math.sin(rotation);
  for(let j=0;j<64;j++){
   const a=j*tau/64,r=coast(a,phase),u=rx*r*Math.cos(a),v=rz*r*Math.sin(a);
   const dx=u*c-v*s,dz=u*s+v*c,inset=.08+.27*field(cx+dx+(anchor?m.wx-anchor.wx:0),cz+dz+(anchor?m.wz-anchor.wz:0),175,37);
   outer.push([cx+dx,0,cz+dz]);inner.push([cx+dx*(1-inset),10,cz+dz*(1-inset)])
  }
  for(let j=0;j<64;j++){
   const k=(j+1)%64,a=outer[j],b=outer[k],c=inner[k],d=inner[j];
   const area=(p,q,r)=>(q[0]-p[0])*(r[2]-p[2])-(q[2]-p[2])*(r[0]-p[0]);
   faces.push({outerArea:area(a,b,c),innerArea:area(c,d,a),color:Math.hypot(a[0]-d[0],a[2]-d[2])>42?'#cfb789':'#aa997c'})
  }
  const bound=1.25*Math.max(rx,rz);
  shoreMeshes.push({cx,cz,c,s,rx,rz,bound,outer,inner,faces});
  for(const [points,y,color] of [[outer,0,'#cfb789'],[inner,10,'#81895c']])
   terraces.push({ring:points.map(([X,Y,Z])=>[X,Z]),cx,cz,rx:bound,rz:bound,y,color})
 }
 buildRegion();
 if(!townLayoutArchive[m.region])for(const road of roads)for(const v of road)v[1]=ground(v[0],v[2])+.12;
 buildRail();activeRiverCells.clear();
 for(let i=quarters.length-1;i>=0;i--)if(nearRail(quarters[i].x,quarters[i].z))quarters.splice(i,1);
 mainlandPlan=new Path2D();islandPlan=new Path2D();
 const mapContext=worldMap.getContext('2d'),mapScale=worldMap.width/worldSize;
 const worldMainland=new Path2D(),worldIslands=new Path2D();
 for(const layer of terraces){
  if(!layer.mainland&&layer.y!==0)continue;
  const path=layer.mainland?mainlandPlan:islandPlan,worldPath=layer.mainland?worldMainland:worldIslands;
  layer.ring.forEach(([X,Z],i)=>{
   const {wx,wz}=localToWorld(X,Z,m);
   if(i){path.lineTo(X,Z);worldPath.lineTo(wx*mapScale,(worldSize-wz)*mapScale)}
   else{path.moveTo(X,Z);worldPath.moveTo(wx*mapScale,(worldSize-wz)*mapScale)}
  });
  path.closePath();worldPath.closePath()
 }
 mapContext.clearRect(0,0,worldMap.width,worldMap.height);
 mapContext.fillStyle='#879661';mapContext.fill(worldMainland,'evenodd');mapContext.fill(worldIslands);
 for(const survey of railSurvey){mapContext.beginPath();survey.points.forEach(([X,Z],i)=>mapContext[i?'lineTo':'moveTo'](X*mapScale,(worldSize-Z)*mapScale));mapContext.lineWidth=.65;mapContext.strokeStyle='#a97649';mapContext.stroke()}
}
function updateWorld(){
 if(inSky)return;
 updateTerrainFocus();
 const m=worldRegion(),tx=Math.floor(x/256),tz=Math.floor(z/256);
 if(!groundWarmup&&tileKey===tx+','+tz)return;
 tileKey=tx+','+tz;groves.length=groundPixels.length=0;
 for(let i=tx-2;i<=tx+2;i++)for(let j=tz-2;j<=tz+2;j++){
  const key=i+','+j;
  let tile=tileCache.get(key);
  if(!tile&&groundWarmup&&alt>200&&Math.max(Math.abs(tx-i),Math.abs(tz-j))>Math.floor((12-groundWarmup)/3))continue;
  if(!tile){
   tile={trees:[],pixels:[]};tileCache.set(key,tile);
   const cx=(i+.5)*256,cz=(j+.5)*256;
   const bases=localBases.filter(b=>{
    const pad=gradingSites[b.id]||{rx:100,rz:185};
    return Math.abs(b.x-cx)<pad.rx+280&&Math.abs(b.z-cz)<pad.rz+280
   });
   const insideBase=(X,Z,margin)=>bases.some(b=>{
    const pad=gradingSites[b.id]||{rx:100,rz:185};
    return Math.abs(X-b.x)<pad.rx+margin&&Math.abs(Z-b.z)<pad.rz+margin
   });
   const sites=railSites.filter(s=>Math.abs(s.x-cx)<440&&Math.abs(s.z-cz)<440);
   const insideStation=(X,Z,margin)=>sites.some(s=>Math.hypot(s.x-X,s.z-Z)<(s.kind==='central'?180:115)+margin);
   const town=quarters.filter(b=>Math.abs(b.x-cx)<265&&Math.abs(b.z-cz)<265);
   const nearbyRoads=roads.filter(r=>r.some(([X,,Z])=>Math.abs(X-cx)<280&&Math.abs(Z-cz)<280));
   const streets=nearbyRoads.map(r=>[Math.min(...r.map(p=>p[0]))-15,Math.max(...r.map(p=>p[0]))+15,Math.min(...r.map(p=>p[2]))-15,Math.max(...r.map(p=>p[2]))+15]);
   function plant(X,Z,place){
    if(Math.floor(X/256)!==i||Math.floor(Z/256)!==j||insideBase(X,Z,28)||insideStation(X,Z,8)||nearRail(X,Z))return;
    if(town.some(b=>Math.hypot(X-b.x,Z-b.z)<b.radius+6))return;
    if(streets.some(([west,east,south,north])=>X>west+9&&X<east-9&&Z>south+9&&Z<north-9))return;
    if(tile.trees.some(tree=>Math.hypot(X-tree.X,Z-tree.Z)<20))return;
    const Y=ground(X,Z);
    if(Y<3||nearRiver(X+m.wx,Z+m.wz,8)||Math.abs(ground(X+6,Z+6)-Y)>2.5)return;
    const seed=noise(Math.round(X+m.wx),Math.round(Z+m.wz),861);
    tile.trees.push({X,Z,Y,H:7+seed*4,R:2+seed,planted:place})
   }
   for(const road of nearbyRoads){
    const [a,b,c,d]=road,dx=(b[0]+c[0]-a[0]-d[0])/2,dz=(b[2]+c[2]-a[2]-d[2])/2;
    const length=Math.hypot(dx,dz);
    if(length<45)continue;
    const X=(a[0]+d[0])/2,Z=(a[2]+d[2])/2;
    const seed=noise(Math.round(X+m.wx),Math.round(Z+m.wz),862);
    if(seed<.35){
     const side=seed<.175?-1:1;
     plant(X+dx*.55-side*dz*18/length,Z+dz*.55+side*dx*18/length,'street')
    }
   }
   for(const base of bases){
    const pad=gradingSites[base.id]||{rx:100,rz:185};
    for(const sign of [-1,1])plant(base.x+sign*(pad.rx+46),base.z+sign*pad.rz*.55,'airfield')
   }
   for(const site of sites){
    const edge=site.kind==='central'?201:139;
    for(const side of [-1,1]){
     const [X,,Z]=railOffset(site,side*edge,side*24);
     plant(X,Z,'station')
    }
   }
   if(!insideBase(cx,cz,-128)&&!insideStation(cx,cz,-181))for(let n=0;n<49;n++){
    const val=k=>noise(i,j,8*n+k),step=256/7;
    const X=i*256+(n%7+.5+(val(0)-.5)*.45)*step,Z=j*256+(Math.floor(n/7)+.5+(val(1)-.5)*.45)*step;
    if(insideBase(X,Z,25)||insideStation(X,Z,0)||nearRail(X,Z))continue;
    if(streets.some(([west,east,south,north])=>X>west&&X<east&&Z>south&&Z<north))continue;
    if(town.some(b=>Math.hypot(X-b.x,Z-b.z)<b.radius+25))continue;
    if(cliffs.length&&Math.abs(X-valleyAxis(Z)-24*Math.sin(Z/117))<27)continue;
    if(cliffs.length&&Math.abs(X-archX)<205&&Math.abs(Z-archZ)<95)continue;
    if(m.region===1&&Z>=passStart&&Z<=passStart+passRows*64){
     const offset=X-passAxis(Z);
     if(Math.abs(offset)<50||offset>50&&offset<540&&quarryWeight((Z-passStart)/64)>.4)continue
    }
    const Y=ground(X,Z);
    if(Y<1||nearRiver(X+m.wx,Z+m.wz))continue;
    const riparian=nearRiver(X+m.wx,Z+m.wz,70)?.13:0;
    const canopy=riparian+.7*field(X,Z,355,59)+.3*field(X,Z,110,60);
    const slope=Math.max(Math.abs(ground(X+10,Z)-Y),Math.abs(ground(X,Z+10)-Y))/10;
    const fringe=insideBase(X,Z,140)||insideStation(X,Z,130)||town.some(b=>Math.hypot(X-b.x,Z-b.z)<b.radius+80);
    const density=Math.min(.76,Math.max(0,(canopy-.32)*1.85))*(fringe?.18:1)*
     Math.min(1,Y/10,Math.max(0,(220-Y)/90))*Math.max(0,1-slope);
    if(val(4)<density&&Y>=5&&!tile.trees.some(tree=>tree.planted&&Math.hypot(tree.X-X,tree.Z-Z)<18))tile.trees.push({X,Z,Y,H:15+val(2)*16+6*canopy,R:4+val(3)*3});
    else if(val(6)<.28)tile.pixels.push({X,Z,Y,width:1+val(2)*5,color:Y<6?'#dbc299':slope>.38?'#a29882':canopy<.4?'#a1a06c':'#798c61'})
   }
  }
  if(!tile.relicChecked){tile.trees=tile.trees.filter(p=>!relics.some(s=>Math.abs(p.X+m.wx-s.x)<s.rx&&Math.abs(p.Z+m.wz-s.z)<s.rz&&relicDistance(s,p.X+m.wx,p.Y+p.H/2,p.Z+m.wz)<p.H/2+p.R));tile.relicChecked=true}
  groves.push(...tile.trees);groundPixels.push(...tile.pixels)
 }
 for(const key of tileCache.keys()){
  const [i,j]=key.split(',').map(Number);
  if(Math.abs(i-tx)>2||Math.abs(j-tz)>2)tileCache.delete(key)
 }
}
function branchRadius(tree,dy){
 if(dy<0||dy>tree.H)return 0;
 return dy<tree.H*.25?1.2:tree.R*Math.max(.12,1-(dy/tree.H-.25)/.75)
}

// Rebuild regional scenery only on entering another authored region.
// Flight and navigation continue in world metres across the origin change.
function enterNearbyRegion(){
 if(deckMode||encounter||inSky)return;
 const position=localToWorld(x,z);
 const next=landscapes.find(r=>r.region!==regionContext.region&&Math.hypot(position.wx-r.wx,position.wz-r.wz)<6800);
 if(!next)return;
 regionContext={...next};buildWorld();
 ({x,z}=worldToLocal(position.wx,position.wz));found.clear()
}
