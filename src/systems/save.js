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
 return {last:'home',visited:['home'],liberated:[],money:30,wear:0,mag:0,goods:0,stored:0,kills:0,skyClue:false,job:null,tutorial:'new'}
}
let adventure=initialAdventure(),discoveries={},hasRecord=false,hasStoredRecord=false;
function storageNotice(text){$('notice').textContent=text}
function restoreAdventure(){
 let raw;
 try{raw=localStorage.getItem(saveKey)}catch{storageNotice('記録を読み込めません。');return}
 hasStoredRecord=raw!==null;if(!raw)return;
 let v;try{v=JSON.parse(raw)}catch{storageNotice('冒険記録を読み取れません。新規ゲームで開始できます。');return}
 if(!v||!Number.isSafeInteger(v.money)||!Array.isArray(v.visited)||!Array.isArray(v.liberated))return;
 adventure={...initialAdventure(),visited:validIds(['home',...v.visited],id=>typeof id==='string'&&Object.hasOwn(outposts,id)),liberated:validIds(v.liberated,id=>typeof id==='string'&&id!=='home'&&Object.hasOwn(outposts,id)),
 money:count(v.money),wear:count(v.wear,40),mag:count(v.mag,3),goods:count(v.goods,8),stored:count(v.stored),kills:count(v.kills),skyClue:v.skyClue===true,job:restoreJob(v.job),tutorial:tutorialSteps.includes(v.tutorial)?v.tutorial:'done'};
 adventure.last=selectable(v.last)?v.last:'home';
 for(const s of journalSites){const date=v.discoveries?.[s.id];if(typeof date==='string'&&Number.isFinite(Date.parse(date)))discoveries[s.id]=date}
 hasRecord=true
}
function persist(state,dates){
 try{localStorage.setItem(saveKey,JSON.stringify({...state,discoveries:dates}));hasRecord=hasStoredRecord=true;storageNotice('');return true}
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
function selectable(id){return typeof id==='string'&&Object.hasOwn(outposts,id)&&(id==='home'||affiliation(id)==='friendly'&&adventure.visited.includes(id))}
restoreAdventure();
