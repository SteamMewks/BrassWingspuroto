const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {createServer}=require('node:http');
const {readFileSync}=require('node:fs');
const {resolve}=require('node:path');
const html=readFileSync(resolve(__dirname,'../BrassWings-preview.html'));
(async()=>{
 const server=createServer((_req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html)});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:800,height:600}}), errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.requestAnimationFrame=()=>0});
 await page.goto('http://127.0.0.1:'+server.address().port);await page.evaluate(require('./helpers/adventure.cjs'),{liberated:'all',visited:'all',tutorial:'done',persist:true});
 await page.evaluate(()=>titleScreen());
 const choose=text=>page.getByRole('button',{name:text,exact:true}).click();
 await choose('続きから');await choose('離陸');
 await page.evaluate(()=>{for(let i=0;i<48;i++)draw(.05);if(!live||deckMode||alt<40)throw Error('Launch')});
 await page.keyboard.down('ArrowUp');await page.evaluate(()=>{for(let i=0;i<15;i++)draw(.05);if(pitch<=0)throw Error('Pitch')});await page.keyboard.up('ArrowUp');
 const land=async id=>page.evaluate(id=>{
  const b=localBases.find(site=>site.id===id);
  enterFlight();deckMode='';x=b.x;z=b.z-80;alt=b.height+10;power=.25;yaw=cameraYaw=0;
  for(let i=0;i<75;i++)draw(.05);
  if(panel!=='dock'||landingSite.id!==id)throw Error('Destination '+id)
 },id);
 await land('windmill');await choose('町に入る');await choose('依頼掲示板・報告');
 await page.getByRole('button',{name:/物資輸送 →/}).click();
 const destination=await page.evaluate(()=>adventure.job.to);
 await page.reload();await choose('続きから');
 await land(destination);await choose('町に入る');await choose('依頼掲示板・報告');await choose('報告して報酬を受領');
 assert.equal(await page.evaluate(()=>adventure.money),60);
 await page.getByRole('button',{name:/遺構調査 →/}).click();
 await page.evaluate(()=>{const s=relics.find(r=>r.id==='orrery');({x,z}=worldToLocal(s.x,s.z));alt=s.base+130;discoverRelics();if(!adventure.job.ready)throw Error('Survey')});
 await land(destination);await choose('町に入る');await choose('依頼掲示板・報告');await choose('報告して報酬を受領');
 await choose('戻る');await choose('商店　物資を買う · 5');await choose('飛行場へ戻る');await choose('移動先を選ぶ');await choose('真鍮の翼工房・本拠地');await choose('施設を利用');await choose('倉庫に預ける');await choose('弾倉改造 · 40');
 await page.reload();assert.deepEqual(await page.evaluate(()=>[adventure.money,adventure.stored,adventure.mag,adventure.job,adventure.last]),[65,1,1,null,'home']);
 assert.deepEqual(errors,[]);console.log('Flight, village delivery, survey, payment, spending, storage, travel and reload passed');
 }finally{await browser?.close();server.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
