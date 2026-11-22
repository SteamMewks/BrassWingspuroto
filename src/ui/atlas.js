for(const m of Object.values(trialMissions))m.town=missions[m.region].town;
function operation(){return trial||freeOperation||missions[campaign.stage]}
function atlas(){
 const preview=panel==='title'&&trialMissions[$('operation-choice').value];
 const m=preview||operation(),k=500/worldSize;
 const selectedBase=panel==='title'&&!preview&&outposts[$('free-base').value];
 const marker=panel==='pause'?localToWorld(x,z):selectedBase||m.airspace,sx=marker.wx*k,sy=500-marker.wz*k;
 const rivers=watersheds.reaches.map(r=>'<polyline points="'+r.samples.map(p=>[p[0]/atlasMetre,1254-p[1]/atlasMetre].join(',')).join(' ')+'" fill="none" stroke="#527d79" stroke-width="'+(r.rank>2?2:1)+'"/>').join('');
 const shapes='<g transform="scale('+500/1254+')"><path fill="#879661" stroke="#bfad83" stroke-width="3" fill-rule="evenodd" d="'+worldOutline+'"/>'+'<defs><clipPath id="land-clip"><path clip-rule="evenodd" d="'+worldOutline+'"/></clipPath></defs><g clip-path="url(#land-clip)">'+reliefBands.map((path,i)=>'<path fill="'+['#958665','#ae9779','#d3c5ab'][i]+'" fill-rule="evenodd" d="'+path+'"/>').join('')+rivers+'</g></g>';
 const islands=continents.map(([cx,cz,,,rx,rz,phase,rotation])=>{
  const points=Array.from({length:96},(_,i)=>{
   const a=tau*i/96,r=coast(a,phase),u=rx*r*Math.cos(a),v=rz*r*Math.sin(a);
   return [(cx+u*Math.cos(rotation)-v*Math.sin(rotation))*k,500-(cz+u*Math.sin(rotation)+v*Math.cos(rotation))*k].join(',')
  });
  return '<polygon fill="#879661" points="'+points.join(' ')+'"/>'
 }).join('');
 const bases=Object.values(outposts).map(b=>{
  const {side,roles}=baseAssignment(m,b.id);
  const label=b.name+' '+[baseSides[side],...roles.map(role=>baseRoles[role])].join('・');
  if(b.deck)return '<path d="M-3 3 L0 -4 L3 3 Z" transform="translate('+b.wx*k+' '+(500-b.wz*k)+')" fill="#9ee7ed"><title>'+label+'</title></path>';
  return '<circle cx="'+b.wx*k+'" cy="'+(500-b.wz*k)+'" r="3" fill="'+baseColors[side]+'"><title>'+label+'</title></circle>'
 }).join('');
 const railMap=railSurvey.map(line=>'<polyline points="'+line.points.map(([X,Z])=>[X*k,500-Z*k].join(',')).join(' ')+'" fill="none" stroke="#8a583e" stroke-width="1"/>').join('');
 const pins=relics.filter(s=>discoveries[s.id]).map(s=>'<circle cx="'+s.x*k+'" cy="'+(500-s.z*k)+'" r="3" fill="#ffe999"><title>'+s.name+'</title></circle>').join('');
 const marks=missions.map((v,i)=>'<rect x="'+(v.wx*k-2)+'" y="'+(498-v.wz*k)+'" width="4" height="4" fill="'+['#f4d49c','#d2bfab','#ea8774'][i]+'"/>').join('');
 $('atlas').innerHTML='<svg viewBox="0 0 500 500" aria-label="世界地図と作戦位置"><rect width="500" height="500" fill="#29474e"/>'+shapes+islands+railMap+marks+bases+pins+'<circle id="atlas-position" cx="'+sx+'" cy="'+sy+'" r="12" fill="none" stroke="#ffd880" stroke-width="4"/><rect x="'+(sx-2.5)+'" y="'+(sy-2.5)+'" width="5" height="5" fill="#fff2b2"/></svg>'+(preview||trial?m.name:'第'+(campaign.stage+1)+'面 '+m.name+'・'+regions[m.region])+
  ' ｜ 世界 100 km 四方・作戦空域 5 km 四方';
 if(preview||trial){
  const brief=Object.entries(m.bases).map(([id])=>{
   const {side,roles}=baseAssignment(m,id);
   return outposts[id].name+' '+[baseSides[side],...roles.map(role=>baseRoles[role])].join('・')
  });
  $('atlas').append(document.createElement('br'),brief.join(' ｜ '))
 }
}
