const {chromium}=require('playwright'),fs=require('fs'),dir=process.env.RELIEF_SCREENSHOTS||'/tmp/brass-relief';
(async()=>{fs.mkdirSync(dir,{recursive:true});const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});const p=await b.newPage({viewport:{width:960,height:540}});await p.evaluate(()=>requestAnimationFrame=()=>0);await p.setContent(fs.readFileSync(require.resolve('../BrassWings-preview.html'),'utf8'));for(const key of ['mountain','hills','gorge','river','fall','mouth','base','coast']){
const pose=await p.evaluate(key=>{campaign.stage=key==='gorge'?1:0;startFlight('free');live=false;deckMode='';const m=operation();let [X,Z,A,H]=[0,0,.2,110];
 if(['fall','mouth','river','coast'].includes(key)){
  const target=key==='fall'?waterfalls[0]:key==='mouth'||key==='coast'?riverSegments.filter(s=>s.reach.down===-1&&s.reach.basin===8).at(-1):riverSegments.find(s=>s.reach.rank>=3&&s.index===0);
  const {dx,dz,len}=target,a=key==='mouth'||key==='coast'?target.b:target.a;const nx=dx/len,nz=dz/len,d=key==='fall'?100:key==='coast'?850:240;
  X=a[0]+nx*d+nz*d*.48;Z=a[1]+nz*d-nx*d*.48;A=Math.atan2(a[0]-X,a[1]-Z)+.37;H=key==='fall'?38:key==='coast'?132:86;
 }else if(key==='gorge'){X=m.wx-170;Z=m.wz+2750;H=170}
 else if(key==='base'){const b=airbases['silver-ridge'];X=b.wx+140;Z=b.wz-265;A=-.2;H=115}
 else {const pt=watersheds.reaches.filter(r=>!r.legacy&&r.samples.length>15).sort((a,b)=>b.samples[0][2]-a.samples[0][2])[key==='mountain'?0:5].samples[0];X=pt[0]-460;Z=pt[1]-580;A=.45;H=key==='mountain'?170:115}
 x=X-m.wx;z=Z-m.wz;alt=Math.max(ground(x,z),0)+H;cameraYaw=yaw=A;draw(0);return [X,Z,alt,A]
},key);console.log(key,pose);await p.screenshot({path:dir+'/'+key+'.jpg',quality:93})}await b.close()})()
