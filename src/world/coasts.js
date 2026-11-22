const shoreRows=new Map(),shoreTiles=new Map();
function cutCoast(){
 shoreRows.clear();shoreTiles.clear();
 const m=operation();
 for(const coastRing of worldCoasts){
  const ring=coastRing.map(([X,Z])=>[X-m.wx,Z-m.wz]);
  let prev=ring[ring.length-1];
  for(const pt of ring){
   const edge=[prev,pt];
   for(let i=Math.floor(Math.min(prev[0],pt[0])/512);i<=Math.floor(Math.max(prev[0],pt[0])/512);i++){
    for(let j=Math.floor(Math.min(prev[1],pt[1])/512);j<=Math.floor(Math.max(prev[1],pt[1])/512);j++){
     const key=i+','+j;if(!shoreTiles.has(key))shoreTiles.set(key,[]);shoreTiles.get(key).push(edge)
    }
   }
   if(pt[1]!==prev[1])for(let row=Math.floor(Math.min(pt[1],prev[1])/128);row<=Math.floor(Math.max(pt[1],prev[1])/128);row++){
    if(!shoreRows.has(row))shoreRows.set(row,[]);
    shoreRows.get(row).push([prev,pt])
   }
   prev=pt
  }
  const xs=ring.map(p=>p[0]),zs=ring.map(p=>p[1]);
  const west=Math.min(...xs),east=Math.max(...xs),south=Math.min(...zs),north=Math.max(...zs);
  terraces.push({ring,cx:(west+east)/2,cz:(south+north)/2,rx:(east-west)/2,rz:(north-south)/2,y:0,mainland:true,color:'#81895c'})
 }
}
function mainlandAt(X,Z){
 let inside=false;
 for(const [a,b] of shoreRows.get(Math.floor(Z/128))||[])
  if((a[1]>Z)!==(b[1]>Z)&&X<(b[0]-a[0])*(Z-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 return inside
}
