// Pass this function to page.evaluate in an isolated Playwright context.
module.exports=function seedAdventure(options={}){
 const all=Object.keys(outposts).filter(id=>id!=='home');
 const liberated=options.liberated==='all'?all:validIds(options.liberated,id=>all.includes(id));
 const last=options.last||'home';
 if(last!=='home'&&!liberated.includes(last))throw Error('Start must be liberated');
 const visited=validIds(['home',last,...(options.visited==='all'?liberated:options.visited||[])],id=>Object.hasOwn(outposts,id));
 const state={...initialAdventure(),liberated,visited,last,money:options.money??30,wear:options.wear??0,mag:options.mag??0,tutorial:options.tutorial??'new'};
 if(!tutorialSteps.includes(state.tutorial))throw Error('Unknown tutorial stage');
 adventure=state;discoveries=options.discoveries==='all'?Object.fromEntries(journalSites.map(s=>[s.id,'2000-01-01T00:00:00.000Z'])):{};
 if(options.persist)saveAdventure()
};
