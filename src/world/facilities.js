const station=[];
for(const side of [-1,1])for(let j=-1;j<=1;j++)station.push({x:side*105,z:j*70,w:55,l:39,h:15,roof:'#657670'});
station.push({x:61,z:90,w:17,l:18,h:31,roof:'#bca277'},{x:-189,z:-38,w:44,l:26,h:10,roof:'#9d705d'},{x:-189,z:4,w:44,l:26,h:10,roof:'#9d705d'});
for(const obj of station)obj.y=0;
station.push({x:61,z:90,y:26,w:24,l:23,h:6,roof:'#c7b68e'});
const coastalStation=[...station,...Array.from({length:7},(_,j)=>({
 x:-210-j*25,z:-30,y:-10,w:25,l:13,h:11,roof:'#987f60'
}))];
const basePlans={
 small:[{x:-84,z:14,w:34,l:28,h:10,roof:'#826e5b'},{x:72,z:-42,w:16,l:20,h:7,roof:'#8c795c'},{x:61,z:90,w:7,l:8,h:18,roof:'#b3916a'}],
 medium:station.filter((o,i)=>[0,2,3,6,7,9].includes(i)),
 large:[...station,{x:173,z:45,w:58,l:80,h:19,roof:'#946752'},{x:181,z:-48,w:41,l:44,h:14,roof:'#88715b'},{x:206,z:-56,w:5,l:6,h:34,roof:'#a67559'}]
};
for(const plan of Object.values(basePlans))for(const b of plan)b.y??=0;
const islandFacilities=[...basePlans.small,...coastalStation.slice(station.length)];
function baseFacilities(b){return b.island?islandFacilities:basePlans[b.tier]}
// All architecture uses world coordinates, including the near-plane clipping used on deck.
// Draw the chart and the scenery in one depth buffer. The 2D face path remains available
// on devices without WebGL. GPU tiles are released as the flight moves away.
