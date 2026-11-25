let mapBack=null,mapAirborne=false,mapSelection=null,mapZoom=1,mapScroll=0,mapCluster=null;
function mapLocations(){
 const known=Object.values(outposts).filter(b=>knownPort(b.id));
 for(const s of journalSites)if(discoveries[s.id]||(adventure.job&&!adventure.job.ready&&s.id==='orrery'))known.push({...s,wx:s.x,wz:s.z});
 return known
}
function routeTarget(){
 if(!waypointId)return jobDestination();
 const record=outposts[waypointId]?null:journalSites.find(s=>s.id===waypointId);
 return outposts[waypointId]||(record&&{...record,wx:record.x,wz:record.z})||jobDestination()
}
function mapStatus(b){
 if(!outposts[b.id])return discoveries[b.id]?'発見済み':'位置判明';
 if(adventure.visited.includes(b.id))return '訪問済み';
 if(adventure.liberated.includes(b.id))return '解放済み';
 return adventure.seen.includes(b.id)?'発見済み・未訪問':'位置判明・未訪問'
}
function navigationMenu(airborne,selected=null,back=null){
 mapBack=back||(airborne?pauseMenu:dockMenu);
 mapAirborne=airborne;mapZoom=1;mapCluster=null;mapScroll=0;mapSelection=selected||waypointId||adventure.freight?.to||adventure.last;worldMapPanel()
}
function selectMapSite(id){
 mapScroll=$('actions').scrollTop;mapSelection=id;mapCluster=null;worldMapPanel()
}
function worldMapPanel(){
 const sites=mapLocations(),b=sites.find(s=>s.id===mapSelection)||sites[0],port=outposts[b.id];
 const p=mapAirborne?localToWorld(x,z):landingSite;
 const facilities=port?(isTown(b)?'掲示板・商店・酒場・補給':'補給・整備・改造'):'探訪記録';
 showPanel('map',b.name,(port?portType(b)+'・'+labels[affiliation(b.id)]:wonders.some(s=>s.id===b.id)?'巨景':'遺構')+'　'+mapStatus(b)+'　'+(portDistance(p,b)/1000).toFixed(1)+' km　'+facilities);
 $('atlas').hidden=false;atlas(sites,b,p);
 const choices=mapCluster||sites;
 const select=document.createElement('select');select.setAttribute('aria-label','地点を選択');
 for(const s of choices)select.add(new Option(s.name,s.id,false,s.id===b.id));
 select.onchange=()=>selectMapSite(select.value);$('actions').append(select);
 action('航路を設定',()=>{waypointId=b.id;mapBack()});
 if(port&&b.id!=='home'){
  const registered=adventure.favorites.includes(b.id),here=townDock(b.id)&&!encounter&&selectable(b.id);
  action((registered?'登録解除':here?'この地点をファストトラベルに登録':'現地へ着陸すると登録できます')+'　'+adventure.favorites.length+'/10',()=>{toggleFavorite(b.id);worldMapPanel()},!registered&&(!here||adventure.favorites.length>=10))
 }
 fixedAction(mapZoom===1?'拡大':'全域',()=>{mapZoom=mapZoom===1?4:1;worldMapPanel()});
 fixedAction('戻る',mapBack);$('actions').scrollTop=mapScroll
}
let atlasTerrain='';
function atlas(sites=mapLocations(),selected=null,location=outposts[adventure.last]){
 const k=500/worldSize,zoom=selected?mapZoom:1,span=500/zoom;
 const clampView=v=>Math.max(0,Math.min(500-span,v-span/2));
 const X=b=>b.wx*k,Y=b=>500-b.wz*k;
 const paths=lines=>lines.map(line=>line.map(([x,z])=>x*k+','+(500-z*k)).join(' '));
 if(!atlasTerrain){
  const lines=(data,color)=>paths(data).map(points=>'<polyline points="'+points+'" fill="none" stroke="'+color+'" stroke-width=".7"/>').join('');
  atlasTerrain='<rect width="500" height="500" fill="#29474e"/><path transform="scale('+500/1254+')" d="'+worldOutline+'" fill="#879661" fill-rule="evenodd"/>'+lines(watersheds.reaches.map(r=>r.samples),'#527d79')+lines(railSurvey.map(l=>l.points),'#916e55')
 }
 const objectives=[adventure.freight&&outposts[adventure.freight.to],surveyDestination(),routeTarget()].filter(Boolean);
 const markers=sites.map(b=>{
  const color=outposts[b.id]?colors[affiliation(b.id)]:'#ffe985';
  const shape=b.deck?'<path d="M0 -4l4 7h-8Z"/>':outposts[b.id]&&!b.kind?'<rect x="-3" y="-3" width="6" height="6"/>':'<circle r="3"/>';
  const ring=(r,c)=>'<circle r="'+r+'" fill="none" stroke="'+c+'" stroke-width="2"/>';
  return '<g transform="translate('+X(b)+' '+Y(b)+') scale('+(2/zoom)+')" fill="'+color+'">'+shape+(adventure.favorites.includes(b.id)?ring(5,'#ecad65'):'')+(objectives.some(target=>target.wx===b.wx&&target.wz===b.wz)?ring(8,'#ffff75'):'')+(selected?.id===b.id?ring(11,'white'):'')+'</g>'
 }).join('');
 const view=selected?[clampView(X(selected)),clampView(Y(selected)),span,span]:[0,0,500,500];
 $('atlas').innerHTML='<svg viewBox="'+view.join(' ')+'" aria-label="世界地図">'+atlasTerrain+markers+'<circle id="atlas-position" cx="'+X(location)+'" cy="'+Y(location)+'" r="'+5/zoom+'" fill="none" stroke="#fff2b2"/></svg>';
 if(!selected)return;
 const svg=$('atlas').firstChild;
 svg.onclick=e=>{
  const m=svg.getScreenCTM(),point=new DOMPoint(e.clientX,e.clientY).matrixTransform(m.inverse());
  const near=sites.map(s=>({s,d:Math.hypot(X(s)-point.x,Y(s)-point.y)*m.a})).filter(hit=>hit.d<=22).sort((a,b)=>a.d-b.d);
  if(!near.length)return;
  mapSelection=near[0].s.id;mapCluster=near.length>1?near.map(hit=>hit.s):null;worldMapPanel()
 }
}
