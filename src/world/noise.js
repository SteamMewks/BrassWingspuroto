const groves=[], terraces=[];
const groundPixels=[],tileCache=new Map();
let seed=479;function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
function noise(i,j,tag){
 let n=Math.imul(i,73856093)^Math.imul(j,19349663)^Math.imul(tag+17,83492791);
 n=Math.imul(n^(n>>>16),0x45d9f3b);return ((n^(n>>>16))>>>0)/4294967296
}
function coast(a,phase){return 1+.12*Math.sin(3*a+phase)+.075*Math.cos(5*a-phase)+.04*Math.sin(9*a+phase)}
function field(X,Z,scale,tag){
 const u=X/scale,v=Z/scale,i=Math.floor(u),j=Math.floor(v);
 const smooth=t=>t*t*(3-2*t),a=smooth(u-i),b=smooth(v-j);
 const mix=(p,q,t)=>p+(q-p)*t;
 return mix(mix(noise(i,j,tag),noise(i+1,j,tag),a),mix(noise(i,j+1,tag),noise(i+1,j+1,tag),a),b)
}
// Each inland cell uses the same diagonal for painting and surface queries.
const ridgeCells=new Map(),ridgeFaces=[],ridgeStep=160;

// The constrained survey mesh is in world metres. Rendering and collision interpolate
// the same three charted vertices; buckets only accelerate lookup and visibility.
function surveyArray(encoded,Type){
 const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));return new Type(bytes.buffer)
}
