// District anchors are stable independently of journal IDs. Dimensions are metres.
const skyDistricts=[
 ['王都・冠の広場',49000,49000,'court'],['南門の集落',52300,46400,'village'],
 ['風読みの集落',45400,50900,'village'],['星環の観測院',53600,52100,'stars'],
 ['水鏡の空中庭園',56000,50000,'garden']
];
let ruinDistrictCache=new Map();
function districtParts([name,X,Z,kind]){
 const parts=[];
 function add(shape,u,v,r,h,color,options={}){
  const x=X+u,z=Z+v,base=skyLevels(x,z)?.top;
  if(base===undefined)return;
  const foot=options.lift?0:Math.max(4,...[0,1,2,3].map(i=>
   base-(skyLevels(x+r*Math.cos(i*tau/4),z+r*Math.sin(i*tau/4))?.top??base)+5));
  parts.push({shape,x,z,y:base+(options.lift||0)-4,r,h,color,foot,...options})
 }
 if(kind==='court'){
  add('drum',0,0,240,34,'#c9c5ab',{sides:12});
  add('spire',0,150,100,365,'#ece2bf',{moss:true});
  for(let n=0;n<7;n++){
   const a=n*tau/8;add('arch',350*Math.cos(a),320*Math.sin(a),70,145,'#d6cfb2',{turn:-a});
   if(n%2===0)add('spire',490*Math.cos(a),460*Math.sin(a),62,185+37*n,'#e1d6b7',{broken:n===2,moss:true})
  }
  add('hall',-220,110,115,160,'#d8ccb1',{moss:true});
  for(let i=-2;i<=2;i++){
   add('arch',i*84,-150,44,105,'#d6d1b7');
   if(i%2===0)add('tree',i*84+17,-135,25,85,'#668b68')
  }
 }else if(kind==='village'){
  for(let n=0;n<14;n++){
   const a=n*2.4,r=60+56*Math.sqrt(n);
   add('hall',Math.cos(a)*r,Math.sin(a)*r,25+(n%4)*6,32+(n%5)*8,'#c4b99c',{turn:a,moss:n%3===0,broken:n%4===0})
  }
  add('arch',-50,-70,48,58,'#bbb69e',{turn:.25});
  add('bridge',-50,-70,62,14,'#b7b39a',{turn:.25,lift:54});
  for(let i=0;i<4;i++)add('tree',95*Math.cos(i*1.7),130*Math.sin(i*1.7),20,68,'#789566')
 }else if(kind==='stars'){
  add('drum',0,0,155,28,'#c3c4ad',{sides:12});
  add('ring',0,0,100,225,'#d9d2b8',{lift:27});
  add('crystal',-25,3,23,80,'#89b9b4',{lift:28});
  for(let n=0;n<6;n++)add('spire',185*Math.cos(n*tau/6),185*Math.sin(n*tau/6),26,68+n*9,'#d1c9ac',{broken:n%2===0});
 }else{
  for(let n=0;n<4;n++){
   add('drum',-120*n,100+92*n,125-n*9,36+n*7,'#a5ae86',{sides:8});
   add('tree',-120*n,100+92*n,40+n*3,106+n*12,'#588567',{lift:35+n*7})
  }
  for(let n=0;n<5;n++){
   add('arch',-160+n*72,88,39,75,'#c9c7ad');
   add('bridge',-160+n*72,88,38,9,'#bcbea4',{lift:72})
  }
 }
 return parts
}
function districtData(d){
 if(!ruinDistrictCache.has(d))ruinDistrictCache.set(d,districtParts(d));
 return ruinDistrictCache.get(d)
}
function ruinContact(X,Y,Z){
 for(const d of skyDistricts){
  if(Math.hypot(X-d[1],Z-d[2])>820)continue;
  for(const p of districtData(d)){
   const dx=X-p.x,dz=Z-p.z,h=Y-p.y;
   if(h< -p.foot||h>p.h)continue;
   const c=Math.cos(p.turn||0),s=Math.sin(p.turn||0),u=c*dx+s*dz,v=-s*dx+c*dz;
   if(p.shape==='bridge'){
    if(Math.abs(u)<=p.r&&Math.abs(v)<p.r*.23)return d[0]
   }else if(p.shape==='arch'||p.shape==='ring'){
    const center=p.shape==='arch'?.40:.50;
    const rho=Math.hypot(u/p.r,(h/p.h-center)/(1-center));
    if(Math.abs(v)<p.r*.17&&((p.shape==='arch'&&h<p.h*center&&Math.abs(Math.abs(u)/p.r-.89)<.12)||(h>=p.h*center||p.shape==='ring')&&rho<=1.03&&rho>=.74))return d[0]
   }else{
    const sides=p.sides||(p.shape==='hall'?4:8),angle=Math.atan2(v,u);
    const sector=tau/sides,offset=((angle%sector)+sector)%sector-sector/2;
    const edge=Math.cos(sector/2)/Math.cos(offset);
    if(Math.hypot(dx,dz)<p.r*edge*ruinWidth(p,Math.max(0,h/p.h)))return d[0]
   }
  }
 }
 return ''
}
function ruinWidth(p,h){
 if(p.shape==='tree')return h<.48?.16:h<.62?.72:h<.84?1:Math.max(.14,(1-h)*5);
 if(p.shape==='crystal')return Math.min(.75+h,2.4*(1-h));
 if(p.shape==='spire')return h<.65?.88:p.broken?.78:Math.max(.04,(1-h)*2.5);
 return h<.82?1:p.shape==='hall'?.83:1
}
function drawSkyRuins(local,wx,wz,gpu){
 for(const d of skyDistricts){
  const distance=Math.hypot(wx-d[1],wz-d[2]);
  if(distance>15500){ruinDistrictCache.delete(d);surfaceRenderer?.dropSkyPart(d[0]);continue}
  const detail=distance<2600,mid=distance<6500,close=distance<1250;
  function emitDistrict(face){
  if(detail&&d[3]==='village'){
   for(let j=-5;j<5;j++){
    const path=(i,w)=>{const X=d[1]+36*i,Z=d[2]+30*Math.sin(i*.7)+w;return [X,skyLevels(X,Z).top+2,Z]};
    face([path(j,-7),path(j,7),path(j+1,7),path(j+1,-7)],'#b6b291')
   }
  }
  for(const p of districtData(d)){
   if(!mid&&p.h<130)continue;
   const c=Math.cos(p.turn||0),s=Math.sin(p.turn||0);
   const point=(u,h,v)=>[p.x+u*c-v*s,p.y+h,p.z+u*s+v*c];
   if(p.shape==='bridge'){
    const corners=[[-1,-.23],[-1,.23],[1,.23],[1,-.23]];
    const deck=corners.map(([u,v])=>point(u*p.r,p.h,v*p.r));face(deck,p.color);
    corners.forEach(([u,v],i)=>{const n=(i+1)%4;
     face([deck[i],deck[n],point(corners[n][0]*p.r,0,corners[n][1]*p.r),point(u*p.r,0,v*p.r)],'#989581')});
    continue
   }
   if(p.shape==='arch'||p.shape==='ring'){
    const ring=p.shape==='ring',cy=ring?.5:.4,N=ring?16:8;
    const arc=(a,r,depth)=>point(p.r*r*Math.cos(a),p.h*(cy+(1-cy)*r*Math.sin(a)),depth*p.r);
    for(let n=0;n<N;n++){
     const a=n*Math.PI/8,b=(n+1)*Math.PI/8;
     for(const dep of [-.16,.16])face([arc(a,1,dep),arc(b,1,dep),arc(b,.76,dep),arc(a,.76,dep)],p.color);
     face([arc(a,1,-.16),arc(b,1,-.16),arc(b,1,.16),arc(a,1,.16)],'#b5ae98');
     face([arc(a,.76,-.16),arc(b,.76,-.16),arc(b,.76,.16),arc(a,.76,.16)],'#a29989')
    }
    if(!ring)for(const side of [-1,1]){
     const l=side*p.r*.76,r=side*p.r;
     for(const v of [-.16,.16])face([point(l,-p.foot,v*p.r),point(r,-p.foot,v*p.r),point(r,cy*p.h,v*p.r),point(l,cy*p.h,v*p.r)],p.color);
     for(const u of [l,r])face([point(u,-p.foot,-.16*p.r),point(u,-p.foot,.16*p.r),point(u,cy*p.h,.16*p.r),point(u,cy*p.h,-.16*p.r)],'#b8b099')
    }
    continue
   }
   const sides=p.sides||(p.shape==='hall'?4:mid?8:5);
   const layers=p.shape==='tree'?[0,.47,.48,.63,.84,.94,1]:p.shape==='spire'?[0,.12,.64,.66,1]:[0,.78,1];
   const vertex=(i,h)=>{const a=tau*i/sides,r=p.r*ruinWidth(p,h);
    const chip=p.broken&&h===1?.19*(.5+.5*Math.sin(a+1)):0;
    return point(r*Math.cos(a),p.h*(h-chip),r*Math.sin(a))};
   if(p.foot>4)for(let i=0;i<sides;i++){
    const a=vertex(i,0),b=vertex(i+1,0);
    face([a,b,[b[0],b[1]-p.foot,b[2]],[a[0],a[1]-p.foot,a[2]]],'#aca792')
   }
   for(let k=1;k<layers.length;k++)for(let i=0;i<sides;i++){
    const a=layers[k-1],b=layers[k],paint=p.shape==='tree'&&k===1?'#796c55':p.moss&&i===3?'#748970':i%4===1?'#b5ae96':p.color;
    face([vertex(i,a),vertex(i+1,a),vertex(i+1,b),vertex(i,b)],paint);
    if(detail&&p.moss&&k===1&&i%2===0)face([vertex(i,b),vertex(i+.26,b),vertex(i+.14,a+.03)],'#59805c')
   }
   face(Array.from({length:sides},(_,i)=>vertex(i,1)),p.moss?'#9ba781':p.color);
   if(close&&(p.shape==='hall'||p.shape==='spire')){
    // Inset arched apertures follow each wall; the lower arch becomes a door.
    for(let i=0;i<sides;i++){
     const left=vertex(i,.28),right=vertex(i+1,.28),angle=tau*(i+.5)/sides;
     const wall=(u,h)=>[left[0]+(right[0]-left[0])*u+Math.cos(angle)*1.4,p.y+p.h*h,left[2]+(right[2]-left[2])*u+Math.sin(angle)*1.4];
     const sill=p.shape==='hall'?.02:.31;
     face([wall(.32,sill),wall(.65,sill),wall(.65,.47),wall(.49,.58),wall(.32,.47)],'#7a8175');
     if(p.moss)face([wall(.06,.76),wall(.31,.76),wall(.23,.58),wall(.16,.64),wall(.13,.4)],'#64825c')
    }
   }
   if(detail&&p.shape==='drum')for(let i=0;i<8;i++){
    const a=i*tau/8,b=a+tau/8;
    const mark=(r,q)=>point(p.r*r*Math.cos(q),p.h+1,p.r*r*Math.sin(q));
    face([mark(.8,a),mark(.8,b),mark(.75,b),mark(.75,a)],'#779b91');
    face([mark(.18,a),mark(.75,b),mark(.72,b)],'#779b91')
   }
  }
  }
  if(gpu)surfaceRenderer.skySector(d[0],close?0:detail?1:mid?2:3,emitDistrict);
  else emitDistrict(local)
 }
}
