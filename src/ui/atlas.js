function atlas(){
 const k=500/worldSize;
 const pins=Object.values(outposts).map(b=>{
  const side=affiliation(b.id),X=b.wx*k,Y=500-b.wz*k;
  return '<g fill="'+colors[side]+'"><title>'+b.name+'・'+labels[side]+'</title>'+(b.id==='home'?'<path d="M'+X+' '+(Y-6)+'l5 6 -5 5 -5 -5Z"/>':'<circle cx="'+X+'" cy="'+Y+'" r="3"/>')+'</g>'
 }).join('');
 const location=panel==='pause'?localToWorld(x,z):outposts[adventure.last]||settlements.home;
 const target=outposts[waypointId]||jobDestination();
 const objective=target?'<circle cx="'+target.wx*k+'" cy="'+(500-target.wz*k)+'" r="8" fill="none" stroke="#fff2aa" stroke-dasharray="3 2"><title>'+target.name+'</title></circle>':'';
 const marker='<circle id="atlas-position" cx="'+location.wx*k+'" cy="'+(500-location.wz*k)+'" r="6" fill="none" stroke="#fff2b2"/>';
 const rail=railSurvey.map(line=>'<polyline points="'+line.points.map(([X,Z])=>[X*k,500-Z*k].join(',')).join(' ')+'" fill="none" stroke="#916e55" stroke-width=".8"/>').join('');
 const water=watersheds.reaches.map(reach=>'<polyline points="'+reach.samples.map(([X,Z])=>[X*k,500-Z*k].join(',')).join(' ')+'" fill="none" stroke="#527d79" stroke-width=".7"/>').join('');
 const records=journalSites.filter(s=>discoveries[s.id]).map(s=>'<circle cx="'+s.x*k+'" cy="'+(500-s.z*k)+'" r="2" fill="#fff4ab"/>').join('');
 $('atlas').innerHTML='<svg viewBox="0 0 500 500" aria-label="世界地図"><rect width="500" height="500" fill="#29474e"/><path transform="scale('+500/1254+')" d="'+worldOutline+'" fill="#879661" fill-rule="evenodd"/>'+water+rail+pins+records+objective+marker+'</svg>'
}
