const surfaceRenderer=(()=>{
 const view=document.createElement('canvas'),gl=view.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:false});
 if(!gl)return null;
 const shader=(type,code)=>{const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);return s};
 const program=gl.createProgram();
 gl.attachShader(program,shader(gl.VERTEX_SHADER,`attribute vec3 pos;attribute vec4 ink;varying lowp vec4 tint;
 uniform vec3 eye;uniform vec2 heading,projection;uniform float horizon;
 void main(){vec3 v=pos-eye;float d=32.0+dot(v.xz,heading);
 gl_Position=vec4(dot(v.xz,vec2(heading.y,-heading.x))*projection.x,v.y*projection.y+horizon*d,d*1.00005-4.00010,d);tint=ink;}`));
 gl.attachShader(program,shader(gl.FRAGMENT_SHADER,'precision mediump float;varying lowp vec4 tint;void main(){gl_FragColor=tint;}'));
 gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))return null;
 const pos=gl.getAttribLocation(program,'pos'),ink=gl.getAttribLocation(program,'ink');
 const loc=name=>gl.getUniformLocation(program,name),eye=loc('eye'),heading=loc('heading'),projection=loc('projection'),horizon=loc('horizon');
 const palette=new Map();
 function color(hex){
  if(palette.has(hex))return palette.get(hex);
  let rgba;
  if(hex[0]==='#'){const v=parseInt(hex.slice(1),16);rgba=[(v>>16)/255,((v>>8)&255)/255,(v&255)/255,1]}
  else{const nums=hex.match(/[\d.]+/g).map(Number);rgba=[nums[0]/255,nums[1]/255,nums[2]/255,nums[3]??1]}
  palette.set(hex,rgba);return rgba
 }
 const dynamic=gl.createBuffer(),gpuAreas=new Map();
 let terrainGpuBytes=0,stream=new Float32Array(65536),streamInk=new Uint8Array(stream.buffer),size=0;
 function bindPacked(buffer){
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.vertexAttribPointer(pos,3,gl.FLOAT,false,16,0);gl.vertexAttribPointer(ink,4,gl.UNSIGNED_BYTE,true,16,12)
 }
 function releaseArea(key){
  const entry=gpuAreas.get(key);gl.deleteBuffer(entry.buffer);
  terrainGpuBytes-=entry.bytes;gpuAreas.delete(key)
 }
 function drawArea(i,j){
  const m=operation(),distance=Math.hypot((i+.5)*terrainAreaSize-x-m.wx,(j+.5)*terrainAreaSize-z-m.wz);
  const coarse=altitudeBand(alt)>=2&&distance>Math.max(1700,6200-(alt-420)*10);
  const key=[i,j,Number(coarse)].join(',');
  let entry=gpuAreas.get(key);
  if(!entry&&groundWarmup&&terrainUploadsThisFrame++>=3)return;
  if(entry)gpuAreas.delete(key);
  else{
   const area=terrainArea(i,j),{vertices,triangles,colors}=coarse?aerialTerrain(area):area;
   let count=0;
   for(let t=0;t<colors.length;t+=3)if(colors[t])count+=3;
   if(!count)return;
   const bytes=new ArrayBuffer(count*16),positions=new Float32Array(bytes),inks=new Uint8Array(bytes);
   let cursor=0;
   for(let t=0;t<colors.length;t+=3){
    if(!colors[t])continue;
    for(let k=t;k<t+3;k++){
     const n=triangles[k]*3;
     positions[cursor++]=area.wx+vertices[n]/20;positions[cursor++]=vertices[n+2]/20;positions[cursor++]=area.wz+vertices[n+1]/20;
     const d=cursor++*4;inks[d]=colors[t];inks[d+1]=colors[t+1];inks[d+2]=colors[t+2];inks[d+3]=255
    }
   }
   const buffer=gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,inks,gl.STATIC_DRAW);
   entry={buffer,count,bytes:inks.byteLength};terrainGpuBytes+=entry.bytes
  }
  gpuAreas.set(key,entry);
  while(gpuAreas.size>1&&terrainGpuBytes>terrainLimits.gpuBytes)releaseArea(gpuAreas.keys().next().value);
  bindPacked(entry.buffer);gl.drawArrays(gl.TRIANGLES,0,entry.count)
 }
 function bind(buffer){gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.vertexAttribPointer(pos,3,gl.FLOAT,false,28,0);gl.vertexAttribPointer(ink,4,gl.FLOAT,false,28,12)}
 // The six original tree paintings share an atlas. Screen-space quads retain
 // their original projected dimensions and use terrain depth for occlusion.
 const foliage=gl.createProgram();
 gl.attachShader(foliage,shader(gl.VERTEX_SHADER,`attribute vec3 vertex;attribute vec3 tex;varying vec3 uv;
 void main(){float d=vertex.z;gl_Position=vec4(vertex.xy,d*1.00005-4.00010,d);uv=tex;}`));
 gl.attachShader(foliage,shader(gl.FRAGMENT_SHADER,`precision mediump float;varying vec3 uv;uniform sampler2D image;
 void main(){vec4 c=texture2D(image,uv.xy);c.a*=uv.z;if(c.a<0.025)discard;gl_FragColor=c;}`));
 gl.linkProgram(foliage);
 const foliageReady=gl.getProgramParameter(foliage,gl.LINK_STATUS);
 const treePos=gl.getAttribLocation(foliage,'vertex'),treeUV=gl.getAttribLocation(foliage,'tex');
 const atlas=document.createElement('canvas');atlas.width=pines[0].width*pines.length;atlas.height=pines[0].height;
 const brush=atlas.getContext('2d');pines.forEach((pine,i)=>brush.drawImage(pine,i*pine.width,0));
 const texture=gl.createTexture(),treeBuffer=gl.createBuffer();gl.bindTexture(gl.TEXTURE_2D,texture);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,atlas);
 let treeVerts=new Float32Array(36*256);
 const relicBuffers=new Map(),skyBuffers=new Map();
 let skyEyeHeight=0,skyBytes=0,terrainUploadsThisFrame=0;
 function releaseSky(i){
  const entry=skyBuffers.get(i);gl.deleteBuffer(entry.buffer);skyBytes-=entry.bytes;skyBuffers.delete(i)
 }
 const railCache=new Map();let railBytes=0;
 const skyLayer=document.createElement('canvas'),skyInk=skyLayer.getContext('2d');
 for(const layer of [skyLayer,view,canvas]){layer.style.position='fixed';layer.style.inset='0';layer.style.pointerEvents='none'}
 canvas.before(skyLayer,view);
 return {
  pruneSkyDetail(distance){
   if(distance<16500)return;
   for(const [key,entry] of skyBuffers)if(typeof key==='number'&&entry.step===1)releaseSky(key)
  },
  skyTerrainStep(i,d){
   const old=skyBuffers.get(i)?.step;
   if(old===1&&d<10000||old===2&&d>9000&&d<16000||old===4&&d>15000)return old;
   return d<9500?1:d<15500?2:4
  },
  dropSkyPart(key){if(skyBuffers.has(key))releaseSky(key)},
  clearSky(){for(const i of skyBuffers.keys())releaseSky(i)},
  skyStats(){return {bytes:skyBytes,sectors:skyBuffers.size}},
  skySector(i,step,build){
   let entry=skyBuffers.get(i);
   if(entry&&entry.step!==step){releaseSky(i);entry=null}
   if(!entry){
    const vertices=[];
    build((points,style)=>{const ink=color(style);for(let n=1;n+1<points.length;n++)for(const k of [0,n,n+1])vertices.push(...points[k],...ink)});
    const data=new Float32Array(vertices);
    while(skyBytes+data.byteLength>skyBudget&&skyBuffers.size)releaseSky(skyBuffers.keys().next().value);
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
    entry={buffer,step,bytes:data.byteLength,count:vertices.length/7};skyBuffers.set(i,entry);skyBytes+=entry.bytes
   }
   const m=operation();gl.uniform3f(eye,x+m.wx,skyEyeHeight,z+m.wz);bind(entry.buffer);gl.drawArrays(gl.TRIANGLES,0,entry.count);
   gl.uniform3f(eye,x,skyEyeHeight,z)
  },
  hasTrees(){return foliageReady&&!gl.isContextLost()},
  trees(sn,cs,eyeY,f,sky){
   const range=620*groundDetailRange(eyeY-ground(x,z));
   if(!foliageReady||range<1)return;
   let size=0;
   function vertex(px,py,d,u,v,alpha){treeVerts[size++]=px;treeVerts[size++]=py;treeVerts[size++]=d;treeVerts[size++]=u;treeVerts[size++]=v;treeVerts[size++]=alpha}
   for(const t of groves){
    const dx=t.X-x,dz=t.Z-z,d=32+dx*sn+dz*cs,dist2=dx*dx+dz*dz;
    if(d<2||dist2>=range*range)continue;
    const center=(dx*cs-dz*sn)*2*f/w,extent=t.R*2*f/w;
    if(Math.abs(center)>d+extent)continue;
    const bottom=(1-2*sky/h)*d+(t.Y-eyeY)*2*f/h,top=bottom+t.H*2*f/h;
    if(top< -d||bottom>d)continue;
    if(size+36>treeVerts.length){const grown=new Float32Array(treeVerts.length*2);grown.set(treeVerts);treeVerts=grown}
    const left=center-extent,right=center+extent,i=Math.abs(Math.floor(t.X))%pines.length;
    const u=i/pines.length,v=(i+1)/pines.length,alpha=Math.min(1,(620-Math.sqrt(dist2))/150);
    vertex(left,top,d,u,0,alpha);vertex(left,bottom,d,u,1,alpha);vertex(right,bottom,d,v,1,alpha);
    vertex(left,top,d,u,0,alpha);vertex(right,bottom,d,v,1,alpha);vertex(right,top,d,v,0,alpha)
   }
   if(!size)return;
   gl.useProgram(foliage);gl.bindTexture(gl.TEXTURE_2D,texture);gl.bindBuffer(gl.ARRAY_BUFFER,treeBuffer);
   gl.bufferData(gl.ARRAY_BUFFER,treeVerts.subarray(0,size),gl.STREAM_DRAW);
   gl.enableVertexAttribArray(treePos);gl.enableVertexAttribArray(treeUV);
   gl.vertexAttribPointer(treePos,3,gl.FLOAT,false,24,0);gl.vertexAttribPointer(treeUV,3,gl.FLOAT,false,24,12);
   gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.drawArrays(gl.TRIANGLES,0,size/6);gl.disable(gl.BLEND)
  },
  areaStats(){return {count:gpuAreas.size,bytes:terrainGpuBytes,railBytes}},
  relicMesh(site,detail,emit){
   let e=relicBuffers.get(site);
   if(!e||detail!==e.detail){
    if(e)gl.deleteBuffer(e.buffer);
    const data=[];
    emit((pts,style)=>{const rgba=color(style);for(let j=1;j+1<pts.length;j++)for(const k of [0,j,j+1])data.push(...pts[k],...rgba)});
    const buffer=gl.createBuffer(),vertices=new Float32Array(data);
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);
    e={buffer,count:vertices.length/7,detail};relicBuffers.set(site,e)
   }
   bind(e.buffer);gl.drawArrays(gl.TRIANGLES,0,e.count)
  },
  clearAreas(){for(const e of relicBuffers.values())gl.deleteBuffer(e.buffer);relicBuffers.clear();for(const key of gpuAreas.keys())releaseArea(key);this.clearRail()},
  pruneAreas(wx,wz){
   for(const [s,e] of relicBuffers)if(Math.hypot(s.x-wx,s.z-wz)>(e.detail?4200+s.radius:19500)){gl.deleteBuffer(e.buffer);relicBuffers.delete(s)}
   for(const key of gpuAreas.keys()){
    const [i,j]=key.split(',').map(Number);
    if(outsideTerrain(i,j,wx,wz))releaseArea(key)
   }
   for(const [key,entry] of railCache){
    if(Math.abs(entry.x-x)>3500||Math.abs(entry.z-z)>3500){
     gl.deleteBuffer(entry.buffer);railBytes-=entry.bytes;railCache.delete(key)
    }
   }
  },
  clearRail(){for(const entry of railCache.values())gl.deleteBuffer(entry.buffer);railCache.clear();railBytes=0},
  railTile(key,tile,build){
   let entry=railCache.get(key);
   if(!entry){
    const data=[];
    build((pts,style)=>{const rgba=color(style);for(let j=1;j+1<pts.length;j++)for(const k of [0,j,j+1])data.push(...pts[k],...rgba)});
    const buffer=gl.createBuffer(),vertices=new Float32Array(data);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);
    entry={buffer,count:vertices.length/7,bytes:vertices.byteLength,x:tile.x,z:tile.z};railBytes+=entry.bytes;
   }else railCache.delete(key);
   railCache.set(key,entry);
   while(railCache.size>128||railBytes>terrainLimits.railGpuBytes&&railCache.size>1){const oldest=railCache.keys().next().value,old=railCache.get(oldest);railBytes-=old.bytes;gl.deleteBuffer(old.buffer);railCache.delete(oldest)}
   if(entry.count){bind(entry.buffer);gl.drawArrays(gl.TRIANGLES,0,entry.count)}
  },
  hide(){view.hidden=skyLayer.hidden=true},
  sky(){
   if(gl.isContextLost()){view.hidden=skyLayer.hidden=true;return frontInk}
   view.hidden=skyLayer.hidden=false;
   if(skyLayer.width!==w||skyLayer.height!==h){skyLayer.width=w;skyLayer.height=h}
   frontInk.clearRect(0,0,w,h);return skyInk
  },
  begin(sn,cs,Y,f,sky){
   if(gl.isContextLost())return false;
   const width=Math.round(w*.75),height=Math.round(h*.75);
   if(view.width!==width||view.height!==height){view.width=width;view.height=height}
   gl.viewport(0,0,width,height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
   gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.useProgram(program);gl.enableVertexAttribArray(pos);gl.enableVertexAttribArray(ink);
   const m=operation(),X=x+m.wx,Z=z+m.wz;
   gl.uniform3f(eye,X,Y,Z);gl.uniform2f(heading,sn,cs);gl.uniform2f(projection,2*f/w,2*f/h);gl.uniform1f(horizon,1-2*sky/h);
   skyEyeHeight=Y;terrainUploadsThisFrame=0;
   if(!inSky)visibleTerrain(X,Z,sn,cs,drawArea);
   size=0;gl.uniform3f(eye,x,Y,z);return true
  },
  face(pts,style){
   const c=color(style),need=(pts.length-2)*12;
   if(size+need>stream.length){
    const next=new Uint8Array(Math.max(stream.length*2,size+need)*4);next.set(streamInk);
    streamInk=next;stream=new Float32Array(next.buffer)
   }
   for(let j=1;j<pts.length-1;j++)for(const k of [0,j,j+1]){
    const p=pts[k];stream[size++]=p[0];stream[size++]=p[1];stream[size++]=p[2];
    const offset=size++*4;
    streamInk[offset]=Math.round(c[0]*255);streamInk[offset+1]=Math.round(c[1]*255);
    streamInk[offset+2]=Math.round(c[2]*255);streamInk[offset+3]=Math.round(c[3]*255)
   }
  },
  end(){
   bindPacked(dynamic);gl.bufferData(gl.ARRAY_BUFFER,streamInk.subarray(0,size*4),gl.DYNAMIC_DRAW);
   gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
   gl.drawArrays(gl.TRIANGLES,0,size/4);gl.disable(gl.BLEND);
   g=frontInk
  }
 }
})();
