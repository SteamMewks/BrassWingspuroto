
// Members are tapered polygonal shafts. Their axes and radii also drive contact tests.
function buildRelic(site,detail){
 const members=[],iron='#454e4c',brass='#b59152',rust='#965d44',stone='#776f64',light='#dbc897';
 const shaft=(a,b,r,end=r,color=iron,sides=detail?8:5)=>members.push({a,b,r,end,color,sides});
 const upright=(x,z,low,high,r,end=r,col=iron,n)=>shaft([x,low,z],[x,high,z],r,end,col,n);
 const beam=(a,b,r,col=iron)=>shaft(a,b,r,r,col);
 function ring(cx,cy,cz,r,width,tilt=0,turn=0,segments=detail?32:16,col=brass){
  const point=a=>{const u=r*Math.cos(a),v=r*Math.sin(a);return [cx+u*Math.cos(turn)-v*Math.sin(tilt)*Math.sin(turn),cy+v*Math.cos(tilt),cz+u*Math.sin(turn)+v*Math.sin(tilt)*Math.cos(turn)]};
  for(let i=0;i<segments;i++)beam(point(i*tau/segments),point((i+1)*tau/segments),width,col)
 }
 function gear(cx,cy,cz,r,teeth){
  const pt=(a,d,z)=>[cx+d*Math.cos(a),cy+d*Math.sin(a),cz+z];
  ring(cx,cy,cz,r*.84,r*.075,0,0,teeth*2,iron);
  for(let i=0;i<teeth;i++){let a=tau*i/teeth;
   shaft(pt(a,r*.84,0),pt(a,r*Math.sqrt(1-.06**2),0),r*.082,r*.06,i%7===0?rust:brass,4);
   if(i%2===0)beam(pt(a,r*.1,0),pt(a,r*.83,0),r*.046,iron)
  }
  shaft([cx,cy,cz-r*.15],[cx,cy,cz+r*.15],r*.16,r*.16,brass)
 }
 switch(site.id){
 case 'gear':gear(0,80,0,2000,24);break;
 case 'clock':
  upright(0,0,-45,175,145,85,stone,6);upright(0,0,160,715,90,72,iron,4);
  for(let i=0;i<4;i++){let a=i*tau/4,n=[Math.sin(a),Math.cos(a)],P=(u,y,v)=>[u*n[1]+v*n[0],y,-u*n[0]+v*n[1]];
   shaft(P(0,595,48),P(0,595,78),83,83,light,24);
   for(let j=0;j<12;j++)beam(P(65*Math.sin(j*tau/12),595+65*Math.cos(j*tau/12),81),P(75*Math.sin(j*tau/12),595+75*Math.cos(j*tau/12),81),3);
   for(const [angle,len] of [[i+1,42],[2*i+2,61]])beam(P(0,595,84),P(len*Math.sin(angle),595+len*Math.cos(angle),84),5)
  }
  for(let i=0;i<8;i++){let a=i*tau/8;upright(98*Math.cos(a),98*Math.sin(a),-20,48+i%3*26,37,29,stone,5)}
  gear(-68,318,-60,78,12);gear(41,372,-65,48,10);upright(0,0,714,845,108,4,brass,4);break;
 case 'chain':
  for(const side of [-1,1]){let u=side*570;upright(u,0,-85,325,94,47,stone,6);shaft([u,314,-88],[u,314,88],74,74,brass)}
  for(let i=-10;i<=10;i++)ring(i*54,138+166*(i/10)**2,0,38,9,i%2?.95:0,0,detail?12:8,iron);break;
 case 'orrery':
  upright(0,0,-48,145,115,60,stone);
  for(let i=0;i<4;i++)ring(0,355,0,196+i*16,10,.25+i*.51,i*.82);
  upright(0,0,250,460,44,24,brass);gear(0,355,0,73,10);break;
 case 'vents':
  for(let i=-1;i<=1;i++){let u=i*158,h=420+90*(1-Math.abs(i));upright(u,0,-40,h,66,43,i?iron:rust);
   for(let j=1;j<=4;j++)upright(u,0,h*j/4-12,h*j/4,66-5*j,66-5*j,brass);
   beam([u,70,0],[u,70,-100],23,rust);ring(u,92,-112,26,4)
  if(detail)for(let j=0;j<10;j++){let a=j*tau/10;upright(u+49*Math.cos(a),49*Math.sin(a),h*.75-2,h*.75+3,4,4,light,5)}
  }beam([-200,70,-100],[200,70,-100],25);
  for(let i=0;i<6;i++)upright(-186+i*70,115,-20,15+(i%3)*9,22,16,stone,4);break;
 case 'walker':
  shaft([-145,54,0],[166,82,0],103,72,iron,12);
  for(let i=-1;i<=1;i++)for(const side of [-1,1]){let u=i*100;beam([u,110,side*50],[u+28,178,side*130],24,brass);shaft([u+28,178,side*130],[u+55,-22,side*198],26,11,rust);shaft([u+31,161,side*138],[u+46,65,side*169],18,18,light)}break;
 case 'twins':
  upright(0,0,-38,98,185,165,stone,6);
  for(const u of [-86,86]){upright(u,0,90,340,62,62,rust);upright(u,0,340,570,27,27,light);upright(u,0,556,606,60,60,brass);
   for(const z of [-57,57])beam([u,98,z],[u,604,z],8);
  for(let z of [-61,61]){beam([u,300,z],[-u,492,z],9,rust);beam([u,94,z],[u,370,z],12,brass)}
  }beam([-90,495,0],[90,495,0],19,brass);break;
 case 'spiral':
  upright(0,0,-40,680,54,24,brass);
  for(let i=0;i<72;i++){let point=j=>[128*Math.cos(j*tau/24),j*9,128*Math.sin(j*tau/24)];beam(point(i),point(i+1),11,rust);
   if(i%4===0){beam(point(i),[0,i*9+35,0],8);beam(point(i),point(i+24>72?72:i+24),6)}
  }for(let i=1;i<=3;i++)ring(0,i*203,0,130,7,Math.PI/2);break;
 case 'gauge':
  shaft([0,111,38],[0,111,-30],99,99,brass,32);shaft([0,111,-30],[0,111,-34],87,87,light,32);
  for(let i=-5;i<=5;i++){let a=i*.42;beam([70*Math.sin(a),111+70*Math.cos(a),-38],[81*Math.sin(a),111+81*Math.cos(a),-38],3)}
  beam([0,111,-42],[48,166,-42],5,rust);for(let u of [-95,95]){beam([u,-35,18],[u,73,18],17);beam([u,73,18],[0,80,0],17)}break;
 case 'dock':
  for(const side of [-1,1]){let u=side*127;beam([u,7,-275],[u,7,230],17,rust);
   for(let i=-3;i<=3;i++){let z=i*61;beam([u,-22,z],[u,11,z],12);beam([0,3,z],[side*62,38,z],7);beam([side*62,38,z],[side*78,74,z],6,rust)}
   upright(u,65,-25,194,22,13,iron);beam([u,190,65],[side*18,248,-26],10,brass);beam([u,130,65],[side*18,248,-26],7);beam([side*18,248,-26],[side*18,98,-26],2)
  }beam([0,4,-216],[0,4,205],10);break
 }
 return members
}
function relicFaces(site,detail){
 const key=detail?'near':'far';
 if(site[key])return site[key];
 const faces=[];
 for(const {a,b,r,end,color,sides} of buildRelic(site,detail)){
  const v=b.map((n,i)=>n-a[i]),len=Math.hypot(...v);if(!len)continue;
  const [x,y,z]=v.map(n=>n/len),h=Math.hypot(x,z),u=h?[z/h,0,-x/h]:[1,0,0],w=[y*u[2],z*u[0]-x*u[2],-y*u[0]];
  const circle=(p,r)=>Array.from({length:sides},(_,i)=>p.map((n,j)=>n+r*(u[j]*Math.cos(i*tau/sides)+w[j]*Math.sin(i*tau/sides))));
  const lo=circle(a,r),hi=circle(b,end);faces.push([hi,color],[lo,color]);
  for(let i=0;i<sides;i++){let j=(i+1)%sides;const shade=.78+.20*Math.cos(i*tau/sides-.8);
   const tint='#'+[1,3,5].map(k=>Math.round(parseInt(color.slice(k,k+2),16)*shade).toString(16).padStart(2,'0')).join('');
   faces.push([[lo[i],lo[j],hi[j],hi[i]],tint])
  }
 }
 // Clip buried members even when the detailed ground tile is beyond the streaming radius.
 if(site.id==='gear'){
  const exposed=[];
  for(const [polygon,color] of faces){
   const clipped=[];
   for(let i=0;i<polygon.length;i++){
    const a=polygon[(i+polygon.length-1)%polygon.length],b=polygon[i];
    if((a[1]>=0)!==(b[1]>=0)){const u=a[1]/(a[1]-b[1]);clipped.push([a[0]+u*(b[0]-a[0]),0,a[2]+u*(b[2]-a[2])])}
    if(b[1]>=0)clipped.push(b)
   }
   if(clipped.length>=3)exposed.push([clipped,color])
  }
  return site[key]=exposed
 }
 return site[key]=faces
}
function drawRelics(face,visible,gpu){
 const m=operation();
 for(const s of relics){
  const X=s.x-m.wx,Z=s.z-m.wz,d=Math.hypot(X-x,Z-z);
  if(d>19000||!visible(X,Z,s.radius+500))continue;
  const Y=s.base;
  const detail=d<3500+s.radius,emit=submit=>{for(const [pts,color] of relicFaces(s,detail))submit(pts.map(([u,v,w])=>[X+u,Y+v,Z+w]),color)};
  if(gpu)surfaceRenderer.relicMesh(s,detail,emit);else emit(face);
  if(s.id==='chain'&&d<3300){
   for(let i=-2;i<3;i++){const u=X+i*82,top=Y+90+12*Math.sin(t*.26+i);
    face([[u-98,top-16,Z+55],[u-44,top+8,Z+67],[u+66,top+3,Z+57],[u+108,top-14,Z+60]],'rgba(210,218,211,0.18)')
   }
  }
  if(s.id==='vents'&&d<4200&&t%10<4){
   for(let i=0;i<5;i++){let q=(t%4+i*.45)%4,r=12+q*8;
    face([[X-r+q*15,Y+516+q*33,Z],[X+q*15,Y+530+q*33+r,Z],[X+r+q*15,Y+516+q*33,Z],[X+q*15,Y+516+q*33-r,Z]],'#dae1db')
   }
  }
 }
}
function relicDistance(s,wx,y,wz){
 const dx=wx-s.x,dz=wz-s.z;if(Math.hypot(dx,dz)>s.radius+s.reach)return Infinity;
 const dy=y-s.base;let best=Infinity;
 for(const {a,b,r,end} of s.members??(s.members=buildRelic(s,true))){
  const vx=b[0]-a[0],vy=b[1]-a[1],vz=b[2]-a[2],len=vx*vx+vy*vy+vz*vz;if(!len)continue;
  const px=dx-a[0],py=dy-a[1],pz=dz-a[2],u=Math.min(1,Math.max(0,(px*vx+py*vy+pz*vz)/len));
  const axial=(px*vx+py*vy+pz*vz)/Math.sqrt(len),radial=Math.sqrt(Math.max(0,px*px+py*py+pz*pz-axial*axial));
  best=Math.min(best,Math.hypot(Math.max(0,-axial,axial-Math.sqrt(len)),Math.max(0,radial-r-(end-r)*u)))
 }
 return best
}
