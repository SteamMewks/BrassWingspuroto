const journalSites=[...relics,...wonders],saveKey='brassWings.adventure.v1';
const count=(n,max=1000000)=>Number.isSafeInteger(n)?Math.max(0,Math.min(n,max)):0;
const validIds=(ids,catalog)=>Array.isArray(ids)?[...new Set(ids.filter(id=>catalog(id)))]:[];
function restoreJob(job){
 if(!job||typeof job.origin!=='string'||!Object.hasOwn(settlements,job.origin)||job.origin==='home')return null;
 if(job.kind==='delivery'&&typeof job.to==='string'&&Object.hasOwn(settlements,job.to)&&job.to!==job.origin)return {kind:job.kind,origin:job.origin,to:job.to,ready:job.ready===true};
 if(job.kind==='survey')return {kind:job.kind,origin:job.origin,ready:job.ready===true};
 return null
}
const tutorialSteps=['new','home','flight','battle','liberated','landing','visit','done'];
function initialAdventure(){
 return {version:5,history:{visited:[],liberated:[]},flightMetres:0,fuelMax:standardTank,fuel:standardTank,ammo:90,known:['home'],seen:['home'],favorites:[],cargo:[],boards:{},rounds:{},freight:null,freightRecord:null,lastLoss:'',last:'home',visited:['home'],liberated:[],money:500,wear:0,mag:0,kills:0,skyClue:false,job:null,tutorial:'new'}
}
let adventure=initialAdventure(),discoveries={},hasRecord=false,hasStoredRecord=false;
function storageNotice(text){$('notice').textContent=text}
// A retired field keeps its original name and coordinates for the log and merchandise.
function migrateCountryRecord(v){
 const towns=Object.values(settlements).filter(isTown),redirects=new Map();
 function redirect(id){
  if(!Object.hasOwn(scenicMarkets,id))return id;
  if(redirects.has(id))return redirects.get(id);
  const old=scenicMarkets[id],safe=towns.filter(p=>p.initialSide==='civilian'||v.liberated.includes(p.id));
  const district=safe.filter(p=>p.stationId===old.stationId);
  const candidates=district.length?district:safe;
  const to=candidates.reduce((a,b)=>portDistance(old,a)<=portDistance(old,b)?a:b).id;
  redirects.set(id,to);return to
 }
 function delivery(job){
  if(!job)return job;
  const origin=redirect(job.origin),to=redirect(job.to);
  if(origin===job.origin&&to===job.to)return job;
  if(!settlements[origin]||!settlements[to])return job;
  const start=settlements[origin],distance=portDistance(start,settlements[to]);
  if(distance>=10000&&distance<=30000)return {...job,origin,to,distance};
  const former=scenicMarkets[job.to]||settlements[to];
  const candidates=towns.filter(p=>{const d=portDistance(start,p);return d>=10000&&d<=30000});
  const end=candidates.reduce((best,p)=>!best||portDistance(former,p)<portDistance(former,best)?p:best,null);
  return end?{...job,origin,to:end.id,distance:portDistance(start,end)}:{...job,origin,to,distance}
 }
 const history={visited:validIds([...(Array.isArray(v.history?.visited)?v.history.visited:[]),...v.visited],id=>Object.hasOwn(scenicMarkets,id)),
  liberated:validIds([...(Array.isArray(v.history?.liberated)?v.history.liberated:[]),...v.liberated],id=>Object.hasOwn(scenicMarkets,id)||settlements[id]?.initialSide==='civilian')};
 const mapIds=ids=>Array.isArray(ids)?ids.map(redirect):[];
 return {...v,history,last:redirect(v.last),visited:mapIds(v.visited),seen:mapIds(v.seen),known:mapIds(v.known),favorites:mapIds(v.favorites),
  freight:delivery(v.freight),freightRecord:delivery(v.freightRecord),job:v.job?.kind==='survey'?{...v.job,origin:redirect(v.job.origin)}:delivery(v.job)}
}
function restoreAdventure(){
 let raw;
 try{raw=localStorage.getItem(saveKey)}catch{storageNotice('記録を読み込めません。');return}
 hasStoredRecord=raw!==null;if(!raw)return;
 let v;try{v=JSON.parse(raw)}catch{storageNotice('冒険記録を読み取れません。新規ゲームで開始できます。');return}
 if(!v||!Number.isSafeInteger(v.money)||!Array.isArray(v.visited)||!Array.isArray(v.liberated))return;
 v=migrateCountryRecord(v);
 adventure={...initialAdventure(),history:v.history,visited:validIds(['home',...v.visited],id=>typeof id==='string'&&Object.hasOwn(outposts,id)),liberated:validIds(v.liberated,id=>campaignTargets.has(id)),
 money:count(v.money,Number.MAX_SAFE_INTEGER),wear:count(v.wear,40),mag:count(v.mag,3),kills:count(v.kills),skyClue:v.skyClue===true,job:restoreJob(v.job),tutorial:tutorialSteps.includes(v.tutorial)?v.tutorial:'done'};
 adventure.flightMetres=Number.isFinite(v.flightMetres)?Math.max(0,v.flightMetres):0;
 adventure.fuelMax=Number.isFinite(v.fuelMax)&&v.fuelMax>0?Math.min(1000000,v.fuelMax):standardTank;
 adventure.fuel=Number.isFinite(v.fuel)?Math.max(0,Math.min(v.fuel,adventure.fuelMax)):adventure.fuelMax;
 adventure.ammo=Number.isFinite(v.ammo)?Math.max(0,Math.min(Math.floor(v.ammo),ammoCapacity())):ammoCapacity();
 adventure.last=selectable(v.last)?v.last:'home';
 const portId=id=>typeof id==='string'&&Object.hasOwn(outposts,id);
 adventure.known=validIds(v.known,portId);adventure.seen=validIds(v.seen,portId);
 adventure.favorites=validIds(v.favorites,id=>id!=='home'&&selectable(id)).slice(0,10);
 const legacy=adventure.job?.kind==='delivery'?adventure.job:null;
 function readLot(l){return l&&Object.hasOwn(merchandise,l.item)&&(portId(l.origin)||Object.hasOwn(scenicMarkets,l.origin))&&count(l.price)&&count(l.qty)&&Number.isFinite(l.metres)&&l.metres>=0}
 function readFreight(j){return j&&typeof j.id==='string'&&isTown(settlements[j.origin])&&isTown(settlements[j.to])&&Object.hasOwn(merchandise,j.item)&&count(j.qty,8)===j.qty&&j.qty>0&&count(j.reward)&&Number.isFinite(j.distance)}
 if(legacy){
  adventure.freight={...legacy,id:'legacy/'+legacy.origin,item:'rations',qty:1,reward:30,distance:portDistance(settlements[legacy.origin],settlements[legacy.to]),status:'active'};adventure.job=null
 }else if(readFreight(v.freight))adventure.freight=v.freight;
 if(readFreight(v.freightRecord))adventure.freightRecord=v.freightRecord;
 for(const [key,old] of [['cargo','goods'],['warehouse','stored']]){
  if(key==='warehouse'&&v.version>=3)continue;
  const legacyQty=count(v[old]);
  const lots=v.version>=2?v[key]:[{item:'rations',qty:legacyQty,price:5,origin:adventure.last,metres:0}];
  for(const lot of Array.isArray(lots)?lots:[]){
   if(!readLot(lot))continue;
   const qty=Math.min(8-cargoUsed(),lot.qty);if(qty)adventure.cargo.push({...lot,qty});
   if(key==='warehouse')adventure.money+=(lot.qty-qty)*lot.price
  }
 }
 for(const port of Object.values(settlements).filter(isTown)){
  adventure.rounds[port.id]=count(v.rounds?.[port.id]);
  const board=v.boards?.[port.id];
  if(Array.isArray(board)&&board.length<=5&&board.every(j=>readFreight(j)&&j.origin===port.id&&j.distance>=10000&&j.distance<=30000))adventure.boards[port.id]=board
 }
 for(const job of [adventure.freight,...Object.values(adventure.boards).flat()].filter(Boolean)){
  job.distance=portDistance(settlements[job.origin],settlements[job.to]);
  job.reward=Math.max(job.reward,transportFloor(job.distance))
 }
 if(typeof v.lastLoss==='string')adventure.lastLoss=v.lastLoss;
 if(adventure.freight)revealPort(adventure.freight.to);
 if(adventure.tutorial!=='new'&&adventure.tutorial!=='done')revealPort('brass-city');
 for(const s of journalSites){const date=v.discoveries?.[s.id];if(typeof date==='string'&&Number.isFinite(Date.parse(date)))discoveries[s.id]=date}
 hasRecord=true;if(!(v.version>=5))saveAdventure()
}
function persist(state,dates){
 try{localStorage.setItem(saveKey,JSON.stringify({...state,ammoMax:90+20*state.mag,discoveries:dates}));hasRecord=hasStoredRecord=true;storageNotice('');return true}
 catch{storageNotice('冒険を保存できません。保存設定と空き容量を確認してください。');return false}
}
function saveAdventure(){return persist(adventure,discoveries)}
function newAdventure(){
 const fresh=initialAdventure();if(!persist(fresh,{}))return;
 adventure=fresh;discoveries={};waypointId=null;startFlight('home')
}
function eraseAdventure(){
 try{
  localStorage.removeItem('brassWings.worldCampaign.v1');
  localStorage.removeItem(saveKey)
 }catch{storageNotice('記録の削除に失敗しました。冒険記録を確認してください。');return}
 adventure=initialAdventure();discoveries={};hasRecord=hasStoredRecord=false;waypointId=null;storageNotice('');titleScreen()
}
function selectable(id){return typeof id==='string'&&Object.hasOwn(outposts,id)&&(id==='home'||affiliation(id)!=='pirate'&&adventure.visited.includes(id))}
function revealPort(id){if(!adventure.known.includes(id))adventure.known.push(id)}
function knownPort(id){return adventure.seen.includes(id)||adventure.known.includes(id)||adventure.visited.includes(id)||adventure.liberated.includes(id)}
function toggleFavorite(id){
 if(id==='home'||!selectable(id))return false;
 const ids=adventure.favorites,index=ids.indexOf(id);
 if(index>=0)ids.splice(index,1);else if(townDock(id)&&!encounter&&ids.length<10)ids.push(id);else return false;
 saveAdventure();return true
}
restoreAdventure();
addEventListener('pagehide',()=>{if(live)saveAdventure()});
