"use strict";
/* نواة الفيزياء: دوال نقيّة بلا واجهة (تُختبر آليًا) */
const GROUND=690;
/* ---- القوة والتسارع ---- */
function forceSim(t,F){const a=F/t.m;return{F,a,ok:Math.abs(a-t.A)<=t.tol,slow:a<t.A-t.tol};}
/* ---- الانعكاس ---- */
function rayHit(p,d,A,B){const ex=B.x-A.x,ey=B.y-A.y,den=d.x*ey-d.y*ex;if(Math.abs(den)<1e-9)return null;
 const s=((A.x-p.x)*ey-(A.y-p.y)*ex)/den,u=((A.x-p.x)*d.y-(A.y-p.y)*d.x)/den;return(s>1e-3&&u>=0&&u<=1)?{s,u}:null;}
function segCircle(p,q,c,r){const dx=q.x-p.x,dy=q.y-p.y,l2=dx*dx+dy*dy;let t=l2?((c.x-p.x)*dx+(c.y-p.y)*dy)/l2:0;t=clamp(t,0,1);
 return Math.hypot(p.x+t*dx-c.x,p.y+t*dy-c.y)<=r;}
function traceBeam(task,angles){const L=task.len||170,E=task.E;let p={x:E.x,y:E.y},d={x:-1,y:0};const pts=[{x:p.x,y:p.y}];let first=null,hit=false;
 for(let b=0;b<7;b++){let best=null;
  task.mirrors.forEach((m,i)=>{const a=rad(angles[i]),u={x:Math.cos(a),y:Math.sin(a)};
   const A={x:m.x-u.x*L/2,y:m.y-u.y*L/2},B={x:m.x+u.x*L/2,y:m.y+u.y*L/2},h=rayHit(p,d,A,B);if(h&&(!best||h.s<best.s))best={s:h.s,i,u};});
  const far=best?best.s:2200,q={x:p.x+d.x*far,y:p.y+d.y*far};
  if(segCircle(p,q,task.sensor,task.sensor.r)){hit=true;pts.push({x:task.sensor.x,y:task.sensor.y});break;}
  pts.push(q);if(!best)break;
  const n={x:-best.u.y,y:best.u.x},dn=d.x*n.x+d.y*n.y,nd={x:d.x-2*dn*n.x,y:d.y-2*dn*n.y};
  if(!first){const inc=deg(Math.acos(clamp(Math.abs(dn),0,1))),refl=deg(Math.acos(clamp(Math.abs(nd.x*n.x+nd.y*n.y),0,1)));first={inc,refl,i:best.i};}
  p=q;d=nd;}
 return{pts,hit,first};}
/* ---- الجاذبية والمدارات: الانحناء = k × الكتلة ÷ السرعة² ---- */
function gravDth(t,v){return t.k*t.M/(v*v);}
function gravPath(t,dth){const pts=[];let x=t.start.x,y=t.start.y;
 for(let i=0;i<500&&x>60;i++){const u=clamp((1150-x)/700,0,1),psi=Math.PI-rad(dth)*smooth(u);x+=Math.cos(psi)*8;y+=Math.sin(psi)*8;pts.push([x,y]);}
 return pts;}
function gravSim(t,v){const dth=gravDth(t,v),full=gravPath(t,dth);let idx=full.length-1,crash=null,hit=false;
 for(let i=0;i<full.length;i++){const[x,y]=full[i];
  if(Math.hypot(x-t.planet.x,y-t.planet.y)<t.planet.r*.92){crash="planet";idx=i;break;}
  for(const a of t.asteroids)if(Math.hypot(x-a.x,y-a.y)<a.r+12){crash="ast";idx=i;break;}
  if(crash)break;
  if(Math.hypot(x-t.ring.x,y-t.ring.y)<=t.ring.r){hit=true;idx=i;break;}}
 return{v,dth,pts:full.slice(0,idx+1),hit,crash};}
function gravSetup(t){ // يضع الحلقة والكويكبات بعد معرفة السرعة المطلوبة
 t.start={x:1370,y:310};t.planet={x:780,y:640,r:105};t.k=20;
 const dt=gravDth(t,t.vT),good=gravPath(t,dt);
 let pr=good.reduce((b,p)=>Math.abs(p[0]-230)<Math.abs(b[0]-230)?p:b,good[0]);
 t.ring={x:pr[0],y:pr[1],r:40};t.dthT=dt;t.asteroids=[];
 if(t.rocks){for(const f of[1.8,.45]){const alt=gravPath(t,dt*f);let placed=false;
   for(const xx of[640,560,720,480,800]){const q=alt.reduce((b,p)=>Math.abs(p[0]-xx)<Math.abs(b[0]-xx)?p:b,alt[0]);
    if(good.every(g=>Math.hypot(g[0]-q[0],g[1]-q[1])>78+45)){t.asteroids.push({x:q[0],y:q[1],r:42+Math.floor(Math.random()*8),img:rnd(["astA","astB","astC"])});placed=true;break;}}}}
 return t;}
if(typeof module!=="undefined")module.exports={forceSim,traceBeam,gravSim,gravSetup,gravDth,gravPath,GROUND};
