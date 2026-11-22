const layers=[];
function slice(y,color,points){layers.push({y,color,points})}
function oval(y,rx,rz,cz,c){slice(y,c,Array.from({length:20},(_,i)=>[rx*Math.cos(i*tau/20),cz+rz*Math.sin(i*tau/20)]))}
function box(y,a,b,c,d,color){slice(y,color,[[a,c],[b,c],[b,d],[a,d]])}
for(let y=-8;y<=-4;y++)for(let s of [-1,1])box(y,s*5-1,s*5+1,3,8,'#393337');
for(let y=-4;y<=4;y++){let r=Math.sqrt(Math.max(.12,1-(y/5)**2));slice(y,['#323c37','#454c40','#545e4c'][Math.min(2,Math.floor((y+4)/3))],[[0,-22],[2,-15],[4.5,-3],[5,9],[3.8,14],[-3.8,14],[-5,9],[-4.5,-3],[-2,-15]].map(([u,v])=>[u*r,v*r]));box(y,-3*r,3*r,11,14,'#c18c42')}
function wing(y){for(let k=0;k<2;k++){slice(y+k,k?'#949579':'#a97f50',[[-26,3],[-24,10],[23,10],[26,7],[25,2],[22,1],[-24,1]]);if(k)for(let a=-22;a<=22;a+=5)box(y+k+.01,a,a+.55,2,9,'#c6a675')}}
wing(-2);for(let y=0;y<9;y++)for(let s of [-1,1])for(let v of [0,1])box(y,s*(19+y*.12),s*(19+y*.12)+1,3+v*(1+y*.53),4+v*(1+y*.53),'#513e30');wing(9);
slice(2,'#ddbe87',[[-11,-17],[-8,-12],[0,-10],[8,-12],[11,-17],[0,-16]]);for(let y=2;y<9;y++)box(y,-.65,.65,-16+y*.35,-9-y*.12,'#545540');oval(4.5,2.8,4,-1,'#3b3030');oval(5,1.6,1.8,-2,'#84563a');
// Lacquered wing tips, paired brass stripes and a stepped engine cowling.
for(const height of [-.85,10.15]){
 for(const side of [-1,1]){
  function panel(points,color){slice(height,color,points.map(([u,v])=>[side*u,v]))}
  panel([[19,2],[25,2],[26,7],[23,10],[19,10]],'#494f45');
  panel([[17,2],[17.8,2],[17.8,10],[17,10]],'#c19544');
  panel([[20,2],[21,2],[21,10],[20,10]],'#baa16d');
  panel([[7,7],[15,6],[12,7.7],[6,8.3]],'#8f5839')
 }
}
for(let y=-4;y<=4;y++){
 const r=Math.sqrt(1-(y/5)**2);
 box(y,-4.8*r,4.8*r,10,14.8,'#495357');
 box(y,-4.9*r,4.9*r,13.6,15.3,'#d5a851');
 for(const side of [-1,1])box(y,side*3.8*r-.45,side*3.8*r+.45,-7,8,'#e4b765')
}
oval(4.65,3.1,4.7,-2,'#ddb473');oval(4.85,2.5,4,-2,'#302e30');
oval(5.1,1.65,1.8,-3.4,'#8f5944');box(5,-2,2,.2,1,'#83bec0');
for(let y=3;y<9;y++)box(y,-.72,.72,-15+y*.24,-13+y*.24,'#f1c57a');
// Inner cabane and crossed outer braces link the cockpit deck to the upper wing.
for(let level=0;level<=9;level++){
 const blend=level/9;
 for(const side of [-1,1]){
  const inner=side*(4+blend*4);
  box(level,inner-.62,inner+.62,4+blend*2,5.3+blend*2,'#bea26d');
  const brace=side*(13+blend*6);
  box(level,brace-.58,brace+.58,6-blend*2,7.1-blend*2,'#b88150');
 }
}
// Twin copper exhaust manifolds, collars and dark open stacks behind the cowling.
for(const side of [-1,1]){
 const pipe=side*4.7;
 box(2.7,pipe-.85,pipe+.85,-7.6,9.6,'#af6747');
 for(const z of [-6,-1,4,8])box(2.92,pipe-1,pipe+1,z,z+.85,'#af956b');
 for(let level=3;level<=6;level++){
  const u=pipe+side*(level-3)*.24,v=-7-(level-3)*.52;
  box(level,u-.98,u+.98,v-1.1,v+1.1,level===6?'#deb07a':'#9c6045');
  if(level===6)box(6.18,u-.57,u+.57,v-.65,v+.65,'#352f30')
 }
}
// Annular gear and spokes are painted on the starboard upper wing.
for(let i=0;i<32;i++){
 const point=(n,r)=>[12+r*Math.cos(n*tau/32),5.7+r*Math.sin(n*tau/32)];
 const outer=i%4<2?3.5:2.8;
 slice(10.38,'#4b4838',[point(i,1.85),point(i,outer),point(i+1,outer),point(i+1,1.85)]);
 if(i%8===0)slice(10.38,'#4b4838',[point(i,.1),point(i,2),point(i+1,2),point(i+1,.1)])
}
