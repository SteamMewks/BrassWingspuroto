function updateSpray(dt){
 spray=spray.filter(p=>t-p.birth<.6);sprayClock-=dt;
 if(alt>=3.2||ground(x,z)||sprayClock>0)return;
 sprayClock=.028;const force=(3.2-alt)/2.55;
 for(const sign of [-1,1])for(let i=0;i<3;i++){
  const side=sign*(2+rand()*2);
  spray.push({x:x+Math.cos(yaw)*side,z:z-Math.sin(yaw)*side,birth:t,
   vx:Math.cos(yaw)*sign*(3+rand()*8)*force,vz:-Math.sin(yaw)*sign*(3+rand()*8)*force,
   vy:(5+rand()*10)*force,r:.12+rand()*.28})
 }
}

// Rasterize closed slices into one pixel sprite with per-pixel depth.
