
function buildRailBridges(line){
 const m=operation(),spans=[];let previous=-Infinity;
 for(let d=0;d<=line.length;d+=3){
  const p=railSample(line,d);
  const crossing=riverAt(p.x+m.wx,p.z+m.wz,6);if(!crossing)continue;
  if(d-previous>32)spans.push({start:Math.max(0,d-10),end:d+10,height:p.y});
  const span=spans.at(-1);span.end=Math.min(line.length,d+10);span.height=Math.max(span.height,p.y,crossing.height+5.25);
  previous=d
 }
 line.bridges=spans;
 const extra=[];
 for(const span of spans)for(const d of [span.start-210,span.start,span.end,span.end+210]){
  if(d>0&&d<line.length&&!line.path.some(pt=>Math.abs(pt.d-d)<.01))extra.push({...railSample(line,d),d})
 }
 for(const span of spans)for(let d=span.start+4;d<span.end;d+=4)if(!line.path.some(p=>Math.abs(p.d-d)<.01))extra.push({...railSample(line,d),d});
 line.path.push(...extra);line.path.sort((a,b)=>a.d-b.d);
 for(const p of line.path)for(const span of spans){
  const approach=Math.max(0,span.start-p.d,p.d-span.end);
  p.y=Math.max(p.y,span.height-.018*approach)
 }
}
