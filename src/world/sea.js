const seaTones=[['#bc9294','#ac858e','#9b7c8a','#8a7587','#7c6e80','#72697d','#646477','#585e70','#50596a','#495465'],['#ae9998','#9a8e91','#84878a','#748184','#6c797e','#607378','#586d73','#51676e','#496067','#405760'],['#a69ba4','#8e8fa2','#7f839a','#717e92','#64758b','#586c84','#50657e','#475e77','#41566d','#394e65']].map(row=>row.map(hex=>parseInt(hex.slice(1),16)));
const paletteCache=new Map();
function waterWeights(wx,wz){
 const u=Math.max(0,Math.min(99.999,wx/1000)),v=Math.max(0,Math.min(99.999,wz/1000)),i=Math.floor(u),j=Math.floor(v),dx=u-i,dz=v-j;
 const k=j*101+i,depth=(shoreDistance[k]*(1-dx)+shoreDistance[k+1]*dx)*(1-dz)+(shoreDistance[k+101]*(1-dx)+shoreDistance[k+102]*dx)*dz;
 const offshore=Math.min(1,Math.max(0,(depth-8)/53));
 const strait=Math.max(0,1-Math.hypot((wx-82800-400*Math.sin(wz/1900))/4500,(wz-50200)/7100))*(1-offshore);
 return [offshore,strait]
}
function seaZone(wx,wz){const [offshore,strait]=waterWeights(wx,wz);return offshore>.6?2:strait>.38?1:0}
function waterPalette(wx,wz){
 const w=waterWeights(wx,wz).map(v=>Math.round(v*16)),key=w.join(',');
 if(!paletteCache.has(key)){
  const [offshore,strait]=w,tints=seaTones[0].map((_,j)=>{
   const rgb=[16,8,0].map(shift=>seaTones.reduce((sum,row,i)=>sum+((row[j]>>shift)&255)*[16-offshore-strait,strait,offshore][i]/16,0));
   return 'rgb('+rgb.map(Math.round).join(',')+')'
  });paletteCache.set(key,tints)
 }
 return paletteCache.get(key)
}
