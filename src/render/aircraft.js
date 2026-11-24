const sprite=document.createElement('canvas'),size=216,center=size/2;
sprite.width=sprite.height=size;
const ink=sprite.getContext('2d'),pixels=ink.createImageData(size,size),depths=new Float32Array(size*size);
function rgb(hex,light=1){
 const n=parseInt(hex.slice(1),16);
 return [n>>16,(n>>8)&255,n&255].map(v=>Math.round(v*light))
}
const solids=layers.map((layer,index)=>({...layer,bias:index*.0015,cap:rgb(layer.color),side:rgb(layer.color,.83),
 thickness:layer.color==='#c6a675'?.12:1.06}));
// Upload the closed sprite layers once; rotation uses the same depth-tested mesh.
let aircraftLayer=null;
function makeRenderer(){
 const surface=document.createElement('canvas');surface.width=surface.height=size;
 const gl=surface.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true});
 if(!gl||!gl.createShader||!gl.getParameter)return null;
 const program=gl.createProgram();
 function shader(type,code){
  const sh=gl.createShader(type);gl.shaderSource(sh,code);gl.compileShader(sh);
  if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))return false;
  gl.attachShader(program,sh);return true
 }
 if(!shader(gl.VERTEX_SHADER,'attribute vec3 pos,col;attribute float bias;uniform vec4 turn;uniform float spin;uniform vec2 heading;varying vec3 paint;void main(){vec3 v=pos;if(spin>-1.){v.xy=mat2(cos(spin),sin(spin),-sin(spin),cos(spin))*v.xy+vec2(0.,1.);}float x=v.x*turn.x-v.y*turn.y,y=v.x*turn.y+v.y*turn.x;float up=y*turn.z+v.z*turn.w,d=v.z*turn.z-y*turn.w;gl_Position=vec4((x*heading.x+d*heading.y)/36.,up/36.,(d*heading.x-x*heading.y-bias)/40.,1.);paint=col;}')||
 !shader(gl.FRAGMENT_SHADER,'precision mediump float;varying vec3 paint;void main(){gl_FragColor=vec4(paint,1.);}'))return null;
 gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))return null;
 const verts=[];let bias=0;
 function tri(a,b,c,color){for(const v of [a,b,c])verts.push(...v,...color.map(n=>n/255),bias)}
 for(const part of solids){
  bias=part.bias;
  const cap=y=>part.points.map(([x,z])=>[x,y,z]);
  const top=cap(part.y+.08),base=cap(part.y+.08-part.thickness);
  for(let i=1;i<top.length-1;i++){tri(top[0],top[i],top[i+1],part.cap);tri(base[0],base[i],base[i+1],part.side)}
  for(let i=0;i<top.length;i++){let j=(i+1)%top.length;tri(top[i],top[j],base[j],part.side);tri(top[i],base[j],base[i],part.side)}
 }
 const body=verts.length/7,blade=[[-8,-.8,16],[8,-.8,16],[8,.8,16],[-8,.8,16]];
 tri(blade[0],blade[1],blade[2],[153,96,53]);tri(blade[0],blade[2],blade[3],[153,96,53]);
 gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.STATIC_DRAW);
 for(const [name,offset] of [['pos',0],['col',12],['bias',24]]){const i=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,name==="bias"?1:3,gl.FLOAT,false,28,offset)}
 const heading=gl.getUniformLocation(program,'heading');const turn=gl.getUniformLocation(program,'turn'),spin=gl.getUniformLocation(program,'spin');
 gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
 aircraftLayer=surface;canvas.after(surface);surface.style.cssText='position:fixed;left:50%;top:58%;transform:translate(-50%,-50%);pointer-events:none';
 return (cr,sr,ca,sa)=>{
  if(gl.isContextLost())return false;
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniform2f(heading,Math.cos(yaw-cameraYaw),Math.sin(yaw-cameraYaw));gl.uniform4f(turn,cr,sr,ca,sa);gl.uniform1f(spin,-2);
  gl.drawArrays(gl.TRIANGLES,0,body);gl.uniform1f(spin,(t*28)%tau);gl.drawArrays(gl.TRIANGLES,body,6);
  const k=Math.min(w/79,h/115)/3;surface.style.width=(size*k/w*100)+'vw';surface.style.height=(size*k/h*100)+'vh';return true
 }
}
const renderMesh=makeRenderer();
function triangle(a,b,c,color){
 const ux=b[0]-a[0],uy=b[1]-a[1],vx=c[0]-a[0],vy=c[1]-a[1],det=ux*vy-uy*vx;
 if(Math.abs(det)<.0001)return;
 for(let y=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1])));y<=Math.min(size-1,Math.ceil(Math.max(a[1],b[1],c[1])));y++)
 for(let x=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0])));x<=Math.min(size-1,Math.ceil(Math.max(a[0],b[0],c[0])));x++){
  const dx=x+.5-a[0],dy=y+.5-a[1],u=(dx*vy-dy*vx)/det,v=(ux*dy-uy*dx)/det;
  if(u<-.00001||v<-.00001||u+v>1.00001)continue;
  const i=y*size+x,d=a[2]+u*(b[2]-a[2])+v*(c[2]-a[2]);
  if(d>depths[i])continue;
  depths[i]=d;pixels.data.set(color,i*4);pixels.data[i*4+3]=255
 }
}
function plane(enemyView=null){
 const enemy=enemyView!==null;
 const roll=enemy?.12:aircraftRoll(),ang=enemy?.27:.40+pitch*.16+(aircraftPitch());
 const ca=Math.cos(ang),sa=Math.sin(ang),cr=Math.cos(roll),sr=Math.sin(roll);
 if(!enemy&&renderMesh&&renderMesh(cr,sr,ca,sa))return;
 const heading=enemy?enemyView:yaw-cameraYaw,ch=Math.cos(heading),sh=Math.sin(heading);
 let bias=0;
 function vertex(u,y,v){const xx=u*cr-y*sr,yy=u*sr+y*cr;const d=v*ca-yy*sa;return [center+3*(xx*ch+d*sh),center-3*(yy*ca+v*sa),d*ch-xx*sh-bias]}
 pixels.data.fill(0);depths.fill(Infinity);
 for(const part of solids){
  bias=part.bias;
  const upper=part.points.map(([u,v])=>vertex(u,part.y+.08,v)),lower=part.points.map(([u,v])=>vertex(u,part.y+.08-part.thickness,v));
  for(let i=1;i<upper.length-1;i++){
   triangle(upper[0],upper[i],upper[i+1],part.cap);triangle(lower[0],lower[i],lower[i+1],part.side)
  }
  for(let i=0;i<upper.length;i++){let j=(i+1)%upper.length;
   triangle(upper[i],upper[j],lower[j],part.side);triangle(upper[i],lower[j],lower[i],part.side)
  }
 }
 const a=t*28,c=Math.cos(a),q=Math.sin(a);
 const blade=[[-8,-.8],[8,-.8],[8,.8],[-8,.8]].map(([l,v])=>vertex(l*c-v*q,1+l*q+v*c,16));
 triangle(blade[0],blade[1],blade[2],[153,96,53]);triangle(blade[0],blade[2],blade[3],[153,96,53]);
 if(enemy){
  for(let i=0;i<pixels.data.length;i+=4){if(!pixels.data[i+3])continue;
   const lum=pixels.data[i+1];pixels.data[i]=Math.min(242,lum*1.35+35);pixels.data[i+1]=lum*.32;pixels.data[i+2]=lum*.30
  }
  const frame=document.createElement('canvas');frame.width=frame.height=size;frame.getContext('2d').putImageData(pixels,0,0);return frame
 }
 ink.putImageData(pixels,0,0);g.imageSmoothingEnabled=true;
 const scale=Math.min(w/79,h/115)/3;g.drawImage(sprite,w*.5-center*scale,h*.58-center*scale,size*scale,size*scale)
}
function poly(p,c){g.fillStyle=c;g.beginPath();p.forEach(([a,b],i)=>i?g.lineTo(a,b):g.moveTo(a,b));g.closePath();g.fill()}
function ellipse(a,b,rx,ry,c){g.fillStyle=c;g.beginPath();g.ellipse(a,b,Math.max(.2,rx),Math.max(.2,ry),0,0,tau);g.fill()}
