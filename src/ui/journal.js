function journalEntry(selected){
 const detail=$('entryDetail');detail.replaceChildren();
 if(selected){const h=document.createElement('h3'),p=document.createElement('p');h.textContent=selected.name;
 p.textContent=selected.region+'　X '+selected.x+' m / Z '+selected.z+' m　'+new Date(discoveries[selected.id]).toLocaleString('ja-JP')+'　'+selected.note;detail.append(h,p)}
 const ctx=$('journalMap').getContext('2d');ctx.fillStyle='#29474e';ctx.fillRect(0,0,256,256);
 ctx.save();ctx.scale(256/1254,256/1254);ctx.fillStyle='#879661';ctx.fill(new Path2D(worldOutline),'evenodd');ctx.restore();
 for(const s of journalSites)if(discoveries[s.id]){ctx.beginPath();ctx.fillStyle=s===selected?'#fff2ab':'#cb894d';ctx.arc(s.x/worldSize*256,256-s.z/worldSize*256,s===selected?5:3,0,tau);ctx.fill();ctx.stroke()}
}
function journalList(){const sites=$('journalCategory').selectedIndex?wonders:relics;const list=$('entries');list.replaceChildren();
 $('progress').textContent='発見数　'+sites.filter(s=>discoveries[s.id]).length+' / '+sites.length;
 for(const s of sites){const b=document.createElement('button');b.disabled=!discoveries[s.id];b.textContent=b.disabled?'？？？？？':s.name;b.onclick=()=>journalEntry(s);list.append(b)}
 journalEntry(null)
}
$('journalCategory').onchange=journalList;
$('journalOpen').onclick=()=>{journalList();$('journal').showModal()
};
$('journalClose').onclick=()=>$('journal').close();
