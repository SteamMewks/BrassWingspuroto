const portBlocks={columns:4,rows:3,dx:132,dz:150};
// The northern pass and its workings share the valley's 64 m cross-section mesh.
const passStart=2048,passRows=64;
function passAxis(Z){return 180*Math.sin((Z-passStart)/510)+85*Math.sin((Z-passStart)/295)}
function quarryWeight(row){return Math.min(1,Math.max(0,(row-10)/6),Math.max(0,(42-row)/6))}
function buildCopperPass(){
 for(const side of [-1,1]){
  const wall=[];
  for(let row=0;row<=passRows;row++){
   const Z=passStart+64*row,mid=passAxis(Z);
   const taper=Math.min(1,row/9,(passRows-row)/10);
   const saddle=Math.exp(-(((row-46)/5)**2));
   const summit=(390+135*field(Z,side*180,380,76)+58*field(Z,side*90,150,77)-265*saddle)*taper;
   const floor=10+taper*(22+48*saddle),lip=65+22*field(Z,0,310,73);
   const cut=side===1?quarryWeight(row):0;
   const offsets=[0,lip,lip+55,lip+140,lip+162,lip+252,lip+278,lip+375,lip+510,lip+740,lip+1080];
   const natural=[0,.04,.27,.49,.54,.69,.74,.89,1,.51,0];
   const bench=[0,0,49,49,104,104,163,163,0,0,0];
   wall.push(offsets.map((offset,k)=>{
    const height=k===10?10:floor+natural[k]*summit;
    const level=k===0?floor:k<8?height+(10+bench[k]-height)*cut:height;
    const spread=1+.10*Math.sin(row*.24+side)+.08*(field(Z,side,215,79)-.5);
    return [mid+side*offset*spread,level,Z]
   }));
  }
  wall.passSide=side;cliffs.push(wall);
  if(side===1){
   // The three level haul benches carry different parts of the town.
   const place=(row,lane,fraction,kind,w,l,h,roof,dz=0)=>{
    const a=wall[row][lane],b=wall[row][lane+1],X=a[0]+(b[0]-a[0])*fraction;
    quarters.push({x:X,z:a[2]+dz,y:a[1],w,l,h,roof,angle:0,radius:Math.hypot(w,l)/2,industry:kind})
   };
   for(let row=17;row<=35;row+=2){
    place(row,6,.34,'housing',24,23,14+8*noise(row,1,67),'#876959');
    place(row,6,.72,'housing',17,20,12,'#708181')
   }
   for(const row of [19,25,32]){
    place(row,4,.48,'mill',40,56,32,'#637c7e');
    place(row+1,4,.53,'stack',14,14,80+(row%3)*13,'#523d3b');
    for(let j=0;j<3;j++)place(row,2,.55,'stock',20,10,7+j*2,['#af714c','#706860','#be9366'][j],(j-1)*18);

   }
  }
 }
}
function buildRegion(){
 quarters.length=cliffs.length=roads.length=0;ridgeCells.clear();ridgeFaces.length=0;
 const m=operation(),stage=m.region,[cx,cz]=m.town;
 if(stage!==1){
  const inland=stage===0?1:-1;
  function vertex(i,j){
   const X=i*ridgeStep,Z=j*ridgeStep;
   const axis=3150+840*Math.sin(X/1020)+290*(field(X,0,460,39)-.5);
   const distance=Math.abs(inland*Z-axis),width=610+580*field(X,Z,790,41);
   const flank=Math.max(0,1-distance/width);
   return 10+flank*flank*(3-2*flank)*(85+180*field(X,Z,770,42)+68*field(X,Z,305,43)+22*noise(i,j,44))*Math.min(1,(32-Math.abs(i))/5)
  }
  for(let i=-32;i<32;i++)for(let j=-34;j<34;j++){
   const corners=[[i,j],[i+1,j],[i+1,j+1],[i,j+1]];
   const heights=corners.map(([u,v])=>{
    const X=u*ridgeStep,Z=v*ridgeStep;
    // Taper against the coast with a one-cell land buffer.
    return [[0,0],[1,1],[-1,1],[1,-1],[-1,-1]].every(([dx,dz])=>mainlandAt(X+dx*ridgeStep,Z+dz*ridgeStep))?vertex(u,v):10
   });
   if(Math.max(...heights)>10)ridgeCells.set(i+','+j,heights)
  }
 }
 if(stage===1){
  for(const side of [-1,1]){
   const wall=[];
   for(let row=0;row<=64;row++){
    const Z=-2048+row*64,mid=valleyAxis(Z),lip=145+32*Math.sin(Z/215+side);
    const crest=(65+145*(.5+.5*Math.sin(Z/510+side*1.8))**2+72*(.5+.5*Math.cos(Z/163-side))**3)*Math.min(1,row/5,(64-row)/5);
    const shear=.5+.5*Math.sin(Z/440+side);
    wall.push([0,45,62+42*shear,85+67*shear,165,315,535,760].map((d,i)=>
     [mid+side*(lip+d*(1+.09*Math.sin(Z/186+side))),10+crest*[0,.09,.49,.78,.98,.85,.42,0][i],Z]))
   }
   cliffs.push(wall)
  }
  buildCopperPass()

 }
 for(const [key,heights] of ridgeCells){
  const [i,j]=key.split(',').map(Number),X=i*ridgeStep,Z=j*ridgeStep;

  const [a,b,c,d]=heights.map((Y,n)=>[X+(n===1||n===2?ridgeStep:0),Y,Z+(n>=2?ridgeStep:0)]);
  for(const tri of [[a,b,c],[c,d,a]]){
   const direction=tri[0]===a?1:-1;
   const gradient=direction*((tri[1][1]-tri[0][1])-.45*(tri[2][1]-tri[1][1]))/ridgeStep;
   const mean=(tri[0][1]+tri[1][1]+tri[2][1])/3;
   const high=Math.min(1,Math.max(0,(mean-45)/220)),shade=26*Math.max(-.5,Math.min(.5,gradient));
   const color=[126+43*high,137+24*high,94+42*high].map(v=>Math.round(v+shade));
   ridgeFaces.push([X,Z,tri,'rgb('+color.join(',')+')'])
  }
 }
 const layout=townLayoutArchive[stage];
 if(layout){
  const {roads:streets,quarters:buildings}=JSON.parse(layout);
  roads.push(...streets);quarters.push(...buildings);return
 }
 const grid=stage===0?{...portBlocks,columns:9,rows:4}:{columns:stage===1?5:7,rows:3,dx:100,dz:116};
 const street=(i,j)=>cz+j*grid.dz+(.5-field(cx+i*grid.dx,j*95,410,82))*grid.dz*.65;
 for(let j=-grid.rows;j<=grid.rows;j++)for(let i=-grid.columns;i<=grid.columns;i++){
  const X=cx+i*grid.dx,Z=street(i,j),next=street(i+1,j);
  const dx=grid.dx,dz=next-Z,length=Math.hypot(dx,dz),angle=Math.atan2(dz,dx);
  const flat=(a,b)=>mainlandAt(a,b)&&Math.abs(ground(a,b)-ground(a+8,b+8))<1.5;
  if(!flat(X,Z)||!flat(X+dx,next)||!flat(X+dx/2,(Z+next)/2))continue;
  roads.push([[X,10.12,Z-4],[X+dx,10.12,next-4],[X+dx,10.12,next+4],[X,10.12,Z+4]]);
  if((i+grid.columns)%4===0&&j<grid.rows&&flat(X,street(i,j+1)))
   roads.push([[X-4,10.12,Z],[X+4,10.12,Z],[X+4,10.12,street(i,j+1)],[X-4,10.12,street(i,j+1)]]);
  const fringe=Math.max(Math.abs(i)/grid.columns,Math.abs(j)/grid.rows);
  for(const side of [-1,1]){
   const tag=90+stage*4+side,v=noise(i,j,tag);
   if(v<.1+.4*fringe||stage===2&&Math.abs(i)<3&&Math.abs(j)<2&&i!==0)continue;
   const t=.35+.32*noise(i,j,tag+10),w=22+17*v,l=20+14*noise(i,j,tag+20);
   const offset=side*(9+l/2+5*v),bx=X+t*dx-offset*dz/length,bz=Z+t*dz+offset*dx/length;
   const radius=Math.hypot(w,l)/2;
   if(![-1,1].every(a=>[-1,1].every(b=>flat(bx+a*radius,bz+b*radius))))continue;
   if(quarters.some(b=>Math.hypot(b.x-bx,b.z-bz)<radius+b.radius+3))continue;
   quarters.push({x:bx,z:bz,y:ground(bx,bz),w,l,radius,angle,h:6+(stage===2?16:13)*v*v+8*(1-fringe),
    roof:(stage===2?['#a34c43','#83443c','#bb6951']:['#827864','#668482','#ad7058'])[Math.floor(v*3)],tower:v>.84})
  }
 }

}
