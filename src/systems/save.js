const journalSites=[...relics,...wonders],saveKey='brassWings.adventure.v1';
function loadRecord(key){try{return JSON.parse(localStorage.getItem(key))||{}}catch{return {}}}
const legacy=loadRecord('brassWings.worldCampaign.v1'),record=loadRecord(saveKey);
const count=(n,max=1000000)=>Number.isSafeInteger(n)?Math.max(0,Math.min(n,max)):0;
const validIds=(ids,catalog)=>Array.isArray(ids)?[...new Set(ids.filter(id=>catalog(id)))]:[];
let discoveries={};
for(const s of journalSites){const date=record.discoveries?.[s.id]||legacy.discoveries?.[s.id];if(typeof date==='string'&&Number.isFinite(Date.parse(date)))discoveries[s.id]=date}
function restoreJob(job){
 if(!job||!Object.hasOwn(settlements,job.origin)||job.origin==='home')return null;
 if(job.kind==='delivery'&&Object.hasOwn(settlements,job.to)&&job.to!==job.origin)return {kind:job.kind,origin:job.origin,to:job.to,ready:job.ready===true};
 if(job.kind==='survey')return {kind:job.kind,origin:job.origin,ready:job.ready===true};
 return null
}
const adventure={last:record.last||'home',visited:validIds(record.visited,id=>Object.hasOwn(outposts,id)),liberated:validIds(record.liberated,id=>pirates.has(id)),money:count(record.money??30),wear:count(record.wear??legacy.wear,40),mag:count(record.mag??legacy.mag,3),goods:count(record.goods,8),stored:count(record.stored),kills:count(record.kills),skyClue:record.skyClue===true,job:restoreJob(record.job)};
function saveAdventure(){try{localStorage.setItem(saveKey,JSON.stringify({...adventure,discoveries}));return true}catch{$('notice').textContent='保存できません。ブラウザの保存設定をご確認ください。';return false}}
function selectable(id){return Object.hasOwn(outposts,id)&&affiliation(id)!=='pirate'&&(id==='home'||!settlements[id]&&affiliation(id)!=='neutral'||adventure.visited.includes(id))}
