"use strict";
/* الرسم على اللوحة ١٦٠٠×٩٠٠. الاتجاه: التقدّم من اليمين إلى اليسار، والروبوت يُعكس برمجيًا */
const IMG={};
const IMG_LIST={};
["bg1","bg2","bg3","bg4","gt1","gt2","gt4","crate1","crate2","crate3","gateC","gateO","pickup","emitter","sensorOff","sensorOn","planetK","planetU","astA","astB","astC","probe","ring","coreGate","core","rubble","wall","chasm"].forEach(n=>IMG_LIST[n]="assets/img/"+n+".png");
const FR={idle:4,scan:4,think:3,success:4,fail:3,push:4,roll:6,jump:5,low:3};
Object.entries(FR).forEach(([k,n])=>{for(let i=1;i<=n;i++)IMG_LIST[k+i]="assets/robot/"+k+"_0"+i+".png";});
["star","star0","happy","neutral","sad","thinking","scanning","tired"].forEach(n=>IMG_LIST["ui_"+n]="assets/ui/"+n+".png");
function loadAll(onp){const ks=Object.keys(IMG_LIST);let done=0;
 return Promise.all(ks.map(k=>new Promise(res=>{const im=new Image();im.onload=im.onerror=()=>{IMG[k]=im;onp&&onp(++done/ks.length);res();};im.src=IMG_LIST[k];})));}
const RS=.5,RAX=200,RAY=515; // مقياس الروبوت ونقطة ارتكازه (مركز الجسم، القدمان)
function robot(ctx,anim,time,x,y,flip,opts={}){
 const n=FR[anim],f=Math.floor(time*(opts.fps||8))%n+1,im=IMG[anim+f];if(!im)return;
 ctx.save();ctx.translate(x,y);ctx.scale(flip?-1:1,1);
 if(anim==="push")ctx.drawImage(im,0,0,385,570,-RAX*RS,-RAY*RS,385*RS,570*RS);else ctx.drawImage(im,-RAX*RS,-RAY*RS,680*RS,570*RS);
 ctx.restore();}
function shadow(ctx,x,y,w){ctx.save();ctx.fillStyle="rgba(0,0,0,.28)";ctx.beginPath();ctx.ellipse(x,y,w,w*.18,0,0,7);ctx.fill();ctx.restore();}
function img(ctx,k,cx,cy,w,h,a=1){const im=IMG[k];if(!im)return;h=h||w*im.height/im.width;ctx.save();ctx.globalAlpha=a;ctx.drawImage(im,cx-w/2,cy-h/2,w,h);ctx.restore();}
function groundStrip(ctx,k,y){const im=IMG[k];if(!im)return;for(let x=0;x<1600;x+=im.width)ctx.drawImage(im,x,y);}
function cell(ctx,x,y,time,a=1){img(ctx,"pickup",x,y+Math.sin(time*3)*7,64,null,a);}
/* ---------- المشهد الكامل ---------- */
function drawScene(ctx,G,time){
 const W=WORLDS[G.w-1],t=G.task;ctx.clearRect(0,0,1600,900);
 ctx.drawImage(IMG[W.bg],0,0,1600,900);
 if(G.w===3&&t.kind==="grav"){ctx.fillStyle="rgba(5,3,20,.45)";ctx.fillRect(0,0,1600,900);}
 if(t.kind==="force")sceneForce(ctx,G,t,time);else if(t.kind==="light")sceneLight(ctx,G,t,time);else sceneGrav(ctx,G,t,time);
 if(!G.cellTaken&&t.cellPos)cell(ctx,t.cellPos.x,t.cellPos.y,time,G.cellFly?0:1);
 if(G.cellFly){const p=ease(G.cellFly.p),x=t.cellPos.x+(1300-t.cellPos.x)*p,y=t.cellPos.y+(46-t.cellPos.y)*p;cell(ctx,x,y-Math.sin(p*3.14)*120,time);}
 G.parts=(G.parts||[]).filter(p=>p.l>0);G.parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.25;p.l--;ctx.globalAlpha=Math.min(1,p.l/20);ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,7);ctx.fill();});ctx.globalAlpha=1;}
function burst(G,x,y,c="#FFD166",n=28){G.parts=G.parts||[];for(let i=0;i<n;i++){const a=Math.random()*6.28,s=2+Math.random()*6;G.parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-3,r:3+Math.random()*4,l:40+Math.random()*30,c});}}
/* ---------- القوة ---------- */
const CR_SZ=[310,240,192],CR_VIS=[130,150,178];function crateLv(t){return t.level>1?2:t.level;}
function sceneForce(ctx,G,t,time){
 groundStrip(ctx,WORLDS[G.w-1].gt,GROUND-4);
 const gx=215;img(ctx,G.gateOpen?"gateO":"gateC",gx,GROUND-120,200,260);
 // علامة الهدف
 const px=t.plateX,on=G.plateOn;
 ctx.save();ctx.setLineDash([10,9]);ctx.strokeStyle=on?"#6BE675":"rgba(255,255,255,.55)";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(px,GROUND-250);ctx.lineTo(px,GROUND+8);ctx.stroke();ctx.restore();
 img(ctx,on?"sensorOn":"sensorOff",px,GROUND-285,110);
 // الصندوق والروبوت
 const lv=crateLv(t),sz=CR_SZ[lv],cw=CR_VIS[lv],cx=G.crateX!=null?G.crateX:t.x0;
 shadow(ctx,cx,GROUND+4,cw*.55);
 img(ctx,t.crate,cx,GROUND+10-sz*.47,sz,sz);
 const rx=cx+cw/2+104;
 let anim="idle";if(G.anim&&G.anim.type==="push"&&G.anim.p<1)anim="push";else if(G.mood==="scan")anim="scan";else if(G.mood==="think")anim="think";else if(G.mood==="success")anim="success";else if(G.mood==="fail")anim="fail";
 const rrx=rx;
 shadow(ctx,rrx,GROUND+4,62);robot(ctx,anim,time,rrx,GROUND+6,true);
 if(G.scanned){ // مجسّ القياس: خطّ المسافة
  ctx.save();ctx.strokeStyle="rgba(255,255,255,.7)";ctx.lineWidth=3;ctx.setLineDash([2,8]);ctx.beginPath();ctx.moveTo(t.x0,GROUND-cw-34);ctx.lineTo(px,GROUND-cw-34);ctx.stroke();ctx.restore();}}
/* ---------- الضوء ---------- */
function sceneLight(ctx,G,t,time){
 groundStrip(ctx,WORLDS[G.w-1].gt,GROUND+20);
 const ang=G.angles||t.start,tr=traceBeam(t,ang),E=t.E;
 G.lastTrace=tr;
 // المصدر مقلوب ليواجه اليسار
 ctx.save();ctx.translate(E.x+40,E.y);ctx.scale(-1,1);ctx.drawImage(IMG.emitter,-70,-70,140,140);ctx.restore();
 // الشعاع
 const pts=tr.pts,pulse=.75+.25*Math.sin(time*9);
 [[26,.12],[14,.25],[6,1]].forEach(([w,a],i)=>{ctx.save();ctx.lineCap="round";ctx.lineJoin="round";ctx.strokeStyle=i===2?"#FFF6C8":"#FFD84A";ctx.globalAlpha=a*pulse;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(E.x-30,E.y);pts.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));ctx.stroke();ctx.restore();});
 // المرايا
 t.mirrors.forEach((m,i)=>{const a=rad(ang[i]),u={x:Math.cos(a),y:Math.sin(a)},L=t.len/2,sel=G.sel===i;
  ctx.save();ctx.lineCap="round";
  if(sel||G.scanned){ctx.strokeStyle="rgba(120,220,255,.28)";ctx.lineWidth=34;ctx.beginPath();ctx.moveTo(m.x-u.x*L,m.y-u.y*L);ctx.lineTo(m.x+u.x*L,m.y+u.y*L);ctx.stroke();}
  ctx.strokeStyle="#16324F";ctx.lineWidth=20;ctx.beginPath();ctx.moveTo(m.x-u.x*L,m.y-u.y*L);ctx.lineTo(m.x+u.x*L,m.y+u.y*L);ctx.stroke();
  const g=ctx.createLinearGradient(m.x-u.x*L,m.y-u.y*L,m.x+u.x*L,m.y+u.y*L);g.addColorStop(0,"#BDEBFF");g.addColorStop(.5,"#FFFFFF");g.addColorStop(1,"#7FC4EA");
  ctx.strokeStyle=g;ctx.lineWidth=11;ctx.beginPath();ctx.moveTo(m.x-u.x*L,m.y-u.y*L);ctx.lineTo(m.x+u.x*L,m.y+u.y*L);ctx.stroke();
  ctx.fillStyle=sel?"#FFD84A":"#F28A30";ctx.strokeStyle="#16324F";ctx.lineWidth=4;ctx.beginPath();ctx.arc(m.x,m.y,13,0,7);ctx.fill();ctx.stroke();
  ctx.fillStyle="#fff";ctx.font="900 22px Cairo,sans-serif";ctx.textAlign="center";ctx.fillText(AR(i+1,0),m.x+u.y*38,m.y-u.x*38+8);
  ctx.restore();});
 // المستشعر
 const on=tr.hit||G.sensorLock;img(ctx,on?"sensorOn":"sensorOff",t.sensor.x,t.sensor.y,120);
 // الروبوت
 let anim=G.mood==="scan"?"scan":G.mood==="think"?"think":G.mood==="success"?"success":G.mood==="fail"?"fail":"idle";
 shadow(ctx,1500,GROUND+4,60);robot(ctx,anim,time,1500,GROUND+6,true);
 if(G.scanned&&G.scanInfo){const m=t.mirrors[0],a=rad(ang[0]),n={x:Math.sin(a),y:-Math.cos(a)};
  ctx.save();ctx.setLineDash([8,8]);ctx.strokeStyle="rgba(255,255,255,.85)";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(m.x-n.x*90,m.y-n.y*90);ctx.lineTo(m.x+n.x*90,m.y+n.y*90);ctx.stroke();ctx.restore();}}
/* ---------- الجاذبية ---------- */
function sceneGrav(ctx,G,t,time){
 const P=t.planet;
 img(ctx,t.img,P.x,P.y,P.r*3.4);
 t.asteroids.forEach((a,i)=>{ctx.save();ctx.translate(a.x,a.y);ctx.rotate(time*.15+i);ctx.drawImage(IMG[a.img],-a.r*1.2,-a.r*1.2*IMG[a.img].height/IMG[a.img].width,a.r*2.4,a.r*2.4*IMG[a.img].height/IMG[a.img].width);ctx.restore();});
 const rg=t.ring;ctx.save();ctx.translate(rg.x,rg.y);ctx.rotate(time*.4);ctx.drawImage(IMG.ring,-62,-62,124,124);ctx.restore();
 const A=G.anim&&G.anim.type==="launch"?G.anim:null;
 let pos={x:t.start.x,y:t.start.y},hd=Math.PI;
 if(A){const pts=A.res.pts,i=Math.min(pts.length-1,Math.floor(A.p*(pts.length-1)));
  ctx.save();ctx.strokeStyle="rgba(120,230,255,.75)";ctx.lineWidth=5;ctx.setLineDash([2,12]);ctx.lineCap="round";ctx.beginPath();ctx.moveTo(t.start.x,t.start.y);for(let k=0;k<=i;k++)ctx.lineTo(pts[k][0],pts[k][1]);ctx.stroke();ctx.restore();
  pos={x:pts[i][0],y:pts[i][1]};const j=Math.max(0,i-1),k=Math.min(pts.length-1,i+1);if(k>j)hd=Math.atan2(pts[k][1]-pts[j][1],pts[k][0]-pts[j][0]);
  if(A.p>=1&&A.res.crash==="planet"){burst(G,pos.x,pos.y,"#FF8A5B",2);}}
 if(!(A&&A.p>=1&&A.res.crash)){ctx.save();ctx.translate(pos.x,pos.y);ctx.rotate(hd-Math.PI);ctx.drawImage(IMG.probe,-70,-58,140,117);ctx.restore();}
 else if(A.res.crash){ctx.fillStyle="rgba(255,140,60,.55)";ctx.beginPath();ctx.arc(pos.x,pos.y,34+Math.sin(time*20)*4,0,7);ctx.fill();}
 const an=G.mood==="scan"?"scan":G.mood==="think"?"think":G.mood==="success"?"success":G.mood==="fail"?"fail":"idle";
 // الروبوت على منصة صغيرة فوق اللوحة
 ctx.save();ctx.fillStyle="rgba(20,16,50,.7)";ctx.strokeStyle="rgba(155,107,232,.8)";ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(1380,GROUND-6,190,24,12);ctx.fill();ctx.stroke();ctx.restore();
 robot(ctx,an,time,1475,GROUND-4,true);}
