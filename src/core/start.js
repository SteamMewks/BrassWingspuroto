titleScreen();
function frame(now){if(live||(crash&&panel!=='crash')||!last||needsRedraw)draw(Math.min(.05,(now-last)/1000));needsRedraw=false;last=now;requestAnimationFrame(frame)}requestAnimationFrame(frame);
