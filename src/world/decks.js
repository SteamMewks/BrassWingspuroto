let base,regionRunway,localBases=[],landingPorts=[];
let ship,localShips=[];
const deckHeight=13,deckSections=Array.from({length:11},(_,i)=>{
 const j=i-5;
 return {offset:j*21,width:48-Math.max(0,Math.abs(j)-3)*7}
});
const shipStructures=[
 [16,14,13,13,43,13,'#a7997d'],[16,18,26,16,16,7,'#637b7a'],
 [16,20,33,2,2,15,'#c7ab78'],[15,-1,26,5,6,9,'#564b44']
];
function deckAxes(b,X,Z){
 const dx=X-b.x,dz=Z-b.z;return {side:dx*b.cos-dz*b.sin,along:dx*b.sin+dz*b.cos}
}
function deckPoint(b,side,along){
 return {x:b.x+side*b.cos+along*b.sin,z:b.z-side*b.sin+along*b.cos}
}
function deckAt(X,Z){
 for(const b of localShips){
  if(Math.abs(X-b.x)>125||Math.abs(Z-b.z)>125)continue;
  const {side,along}=deckAxes(b,X,Z),section=deckSections[Math.floor((along+115.5)/21)];
  if(section&&Math.abs(side)<=section.width/2)return b
 }
}
function overDeck(X,Z){return Boolean(deckAt(X,Z))}
let tileKey='';
const shoreMeshes=[];
let mainlandPlan,islandPlan;
const worldMap=document.createElement('canvas');worldMap.width=worldMap.height=128;
// Surveyed control points use metres east and north of the atlas origin.
