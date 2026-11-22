const canvas=document.querySelector('canvas'),frontInk=canvas.getContext('2d'),$=s=>document.getElementById(s);
let g=frontInk;
let w,h,x=0,z=0,alt=0,yaw=0,cameraYaw=0,bank=0,pitch=0,power=0,live=false,t=0,last=0,ax=0,ay=0,id=null;
const keys=new Set(),found=new Set(),isles=[],tau=Math.PI*2;
function resize(){let k=Math.max(innerWidth/1080,innerHeight/900,1);canvas.width=w=Math.round(innerWidth/k);canvas.height=h=Math.round(innerHeight/k)}
let needsRedraw=true;onresize=()=>{resize();needsRedraw=true};resize();
