function artwork(width,height,paint){
 const image=document.createElement('canvas');image.width=width;image.height=height;
 paint(image.getContext('2d'));return image
}
const pines=Array.from({length:6},(_,variant)=>artwork(112,216,c=>{
 function rect(x,y,w,h,col){c.fillStyle=col;c.fillRect(x,y,w,h)}
 rect(50,152,12,64,'#634e3e');rect(52,160,3,56,'#a47e50');
 for(let i=0;i<9;i++){const level=8-i,cy=12+level*18,r=7+level*5.7;
  for(let j=0;j<24;j++){
   const v=j/23,span=r*(.19+.81*v);
   const fringe=2*Math.sin(j*.8+variant+i);
   rect(Math.round(56-span),cy+j,Math.round(span*2),3,'#294d46');
   rect(Math.round(56-span+2),cy+j-2,Math.round(span*1.32+fringe),3,['#527a58','#5b8563','#658d66'][(variant+i)%3]);
  }
  for(let k=0;k<9;k++){const u=Math.sin(k*24+i*33+variant);rect(54+u*r*.68,cy+16+Math.cos(k*13+i)*4,3,2,'#87a275')}
 }
}));
const cloudArt=Array.from({length:5},(_,v)=>artwork(120,38,c=>{
 const bumps=Array.from({length:7},(_,j)=>[12+j*15,9+12*noise(j,v,34),10+11*noise(j,v,67)]);
 for(let x=0;x<120;x+=2){
  let rise=0;for(const [cx,height,width] of bumps)rise=Math.max(rise,height*(1-((x-cx)/width)**2));
  if(rise<=0)continue;
  const top=26-2*Math.round(rise/2),bottom=30+2*Math.floor(2*Math.sin(x/22+v));
  for(const [start,end,color] of [[top,bottom,'#967888'],[top,bottom-5,'#b98c92'],[top,top+Math.max(2,rise*.45),'#dba59a'],[top,top+2,'#edc09f']]){
   c.fillStyle=color;c.fillRect(x,start,2,Math.max(1,Math.round(end-start)))
  }
 }
}));
const shadowOutline=[[0,4],[.8,2.7],[5.7,2],[5.8,.7],[1,.5],[.5,-2.8],[2,-3.4],[2,-4],[0,-3.8],[-2,-4],[-2,-3.4],[-.5,-2.8],[-1,.5],[-5.8,.7],[-5.7,2],[-.8,2.7]];
const enemyFrames=new Map();let enemies=[],bolts=[],trigger=false,reload=0;
$('combat').onclick=()=>{
 trial=trialMissions[$('operation-choice').value]||null;
 if(!trial&&campaign.hangar)openHangar();else startFlight('combat')
};
$('fire').onpointerdown=e=>{if(live&&mode==='combat'&&!deckMode){$('fire').setPointerCapture(e.pointerId);trigger=true}};
$('fire').onpointerup=$('fire').onlostpointercapture=$('fire').onpointercancel=()=>{trigger=false};
