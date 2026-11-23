"use strict";
/* بيانات العوالم وتوليد المراحل (عشوائي لكن قابل للحل دائمًا) */
const WORLDS=[
 {id:1,name:"الثِقل",law:"القوة والتسارع",icon:"law_force",bg:"bg1",gt:"gt1",color:"#E8913A",
  intro:"في عالم الثِقل لكل صندوق كتلة تخفيها الأقفال. قِس الكتلة، واستنتج كم دفعة تحتاج، ثم ادفع بالقوة الصحيحة.",
  stages:["صندوق خفيف","صندوق متوسط","صندوق ثقيل"]},
 {id:2,name:"المرايا",law:"انعكاس الضوء",icon:"law_light",bg:"bg2",gt:"gt2",color:"#3AA8E8",
  intro:"في عالم المرايا يسير الضوء بخط مستقيم حتى يلتقي مرآة. أدِر المرايا ليصل الشعاع إلى المستشعر.",
  stages:["مرآة واحدة","مرآتان","ثلاث مرايا"]},
 {id:3,name:"المقلاع",law:"الجاذبية والمدارات",icon:"law_gravity",bg:"bg3",gt:null,color:"#9B6BE8",
  intro:"في عالم المقلاع تسحب الكواكب المسبار. اختر سرعة الإطلاق ليمرّ المسار من الحلقة الذهبية.",
  stages:["كوكب معلوم","كويكبات في الطريق","كوكب أثقل"]},
 {id:4,name:"الذاكرة",law:"القوانين مجتمعة",icon:"law_memory",bg:"bg4",gt:"gt4",color:"#F2B84B",
  intro:"هنا تُختبر ذاكرتك: ثلاثة قوانين في بوابة واحدة. لا تلمح لك المرحلة بأي قانون تبدأ.",
  stages:["القوة ثم الضوء","الضوء ثم الجاذبية","القوانين الثلاثة"]}
];
/* كل مرحلة = قائمة مهام؛ العالم ٤ يخلط أنواع المهام */
const PLAN={
 "1-1":["force:0"],"1-2":["force:1"],"1-3":["force:2"],
 "2-1":["light:0"],"2-2":["light:1"],"2-3":["light:2"],
 "3-1":["grav:0"],"3-2":["grav:1"],"3-3":["grav:2"],
 "4-1":["force:1","light:0"],"4-2":["light:1","grav:1"],"4-3":["force:2","light:2","grav:2"]
};
const LAWS={
 force:"القوة = الكتلة × التسارع",
 light:"زاوية السقوط = زاوية الانعكاس",
 grav:"كلما زادت السرعة قلّ انحناء المسار نحو الكوكب"
};
function fmt(n){return AR(n,Number.isInteger(n)?0:1);}
/* ---------- القوة ---------- */
function makeForce(level){
 const MS=[[2,3],[3,4,5],[5,6,8]][level], AS=[[1.5,2,2.5,3],[1.5,2,2.5,3],[1,1.5,2,2.5]][level];
 const m=rnd(MS),A=rnd(AS),Fs=m*A;
 const t={kind:"force",level,m,A,tol:0.26/m,Fs,crate:["crate1","crate2","crate3"][level>1?2:level],
  Fmax:Math.max(30,Math.ceil(Fs*2/5)*5),T:2,pxm:120};
 t.x0=1270;t.plateX=t.x0-0.5*A*t.T*t.T*t.pxm;
 const wrong=[A/m*1,m/A,m+A].map(v=>Math.round(v*10)/10).filter(v=>Math.abs(v-Fs)>.4);
 if(level===0)t.deduce={q:"قسنا الكتلة والتسارع المطلوب. ما العلاقة التي تربط القوة بهما؟",opts:[["القوة = الكتلة × التسارع",1],["القوة = الكتلة ÷ التسارع",0],["القوة = الكتلة + التسارع",0]]};
 else if(level===1){const a2=Math.round(Fs/m*10)/10; // تسارع لو دفعنا بقوة معلومة
  const F2=m*rnd([1,2,4]);const good=F2/m;const o=[[fmt(good)+" م/ث²",1],[fmt(F2*m)+" م/ث²",0],[fmt(F2+m)+" م/ث²",0]];
  t.deduce={q:"صندوق كتلته "+fmt(m)+" كغ دُفع بقوة "+fmt(F2)+" نيوتن. كم تسارعه؟",opts:o};}
 else {const F2=m*2;t.deduce={q:"دفعنا الصندوق بقوة "+fmt(F2)+" نيوتن فتسارع "+fmt(2)+" م/ث². لو ضاعفنا القوة وبقيت الكتلة، يصير التسارع:",opts:[["الضعف",1],["النصف",0],["لا يتغير",0]]};}
 t.hint="التسارع المطلوب "+fmt(A)+" م/ث² والكتلة "+fmt(m)+" كغ. القوة = الكتلة × التسارع.";
 return t;}
/* ---------- الضوء ---------- */
function lightTry(nm){
 const E={x:1430,y:250+Math.floor(Math.random()*170)};
 let p={x:E.x,y:E.y},d={x:-1,y:0};const mirrors=[],angles=[];
 for(let i=0;i<nm;i++){
  const dist=i===0?(520+Math.random()*420):(230+Math.random()*190);
  const c={x:p.x+d.x*dist,y:p.y+d.y*dist};
  if(c.x<150||c.x>1450||c.y<150||c.y>640)return null;
  if(mirrors.some(m=>Math.hypot(m.x-c.x,m.y-c.y)<190))return null;
  const phi=25+Math.random()*130,a=rad(phi),u={x:Math.cos(a),y:Math.sin(a)},n={x:-u.y,y:u.x};
  const dn=d.x*n.x+d.y*n.y;if(Math.abs(dn)<.3||Math.abs(dn)>.96)return null;
  d={x:d.x-2*dn*n.x,y:d.y-2*dn*n.y};p=c;mirrors.push({x:c.x,y:c.y,phi:0});angles.push(Math.round(phi));}
 /* أعد الحساب بالزوايا المقرّبة لضمان الدقة */
 const t={E,mirrors,len:170,sensor:{x:0,y:0,r:34}};
 mirrors.forEach((m,i)=>m.phi=angles[i]);
 const tr=traceBeam({...t,sensor:{x:-9999,y:-9999,r:1}},angles);
 if(tr.pts.length!==nm+2)return null;
 for(let i=0;i<nm;i++)if(Math.hypot(tr.pts[i+1].x-mirrors[i].x,tr.pts[i+1].y-mirrors[i].y)>6)return null;
 const last=tr.pts[nm],nxt=tr.pts[nm+1],dl=Math.hypot(nxt.x-last.x,nxt.y-last.y),ux=(nxt.x-last.x)/dl,uy=(nxt.y-last.y)/dl,L=250+Math.random()*130;
 t.sensor={x:last.x+ux*L,y:last.y+uy*L,r:34};
 if(t.sensor.x<90||t.sensor.x>1510||t.sensor.y<110||t.sensor.y>650)return null;
 if(mirrors.some(m=>Math.hypot(m.x-t.sensor.x,m.y-t.sensor.y)<150))return null;
 t.target=angles;const chk=traceBeam(t,angles);if(!chk.hit||chk.pts.length!==nm+2)return null;return t;}
function makeLight(level){
 const nm=level+1;let t=null;for(let i=0;i<4000&&!t;i++)t=lightTry(nm);
 if(!t)throw new Error("light gen failed");
 t.kind="light";t.level=level;
 /* زوايا البداية بعيدة عن الحل */
 let cur;for(let k=0;k<400;k++){cur=t.target.map(a=>{let v;do{v=20+Math.floor(Math.random()*140);}while(Math.abs(v-a)<18);return v;});
  if(!traceBeam(t,cur).hit)break;}
 t.mirrors.forEach((m,i)=>m.phi=cur[i]);t.start=cur;
 const inc=rnd([25,35,40,50,55]);
 if(level===0)t.deduce={q:"قسنا زاويتي السقوط والانعكاس عند المرآة فكانتا متساويتين. ما القانون؟",opts:[["زاوية السقوط = زاوية الانعكاس",1],["زاوية الانعكاس = ضعف زاوية السقوط",0],["زاوية الانعكاس = ٩٠° − زاوية السقوط",0]]};
 else if(level===1)t.deduce={q:"سقط شعاع على مرآة بزاوية "+fmt(inc)+"° عن العمود. كم زاوية انعكاسه؟",opts:[[fmt(inc)+"°",1],[fmt(90-inc)+"°",0],[fmt(inc*2)+"°",0]]};
 else t.deduce={q:"إذا أدرنا المرآة فصارت زاوية السقوط "+fmt(inc)+"°، فالانعكاس يصبح:",opts:[[fmt(inc)+"°",1],[fmt(180-inc)+"°",0],[fmt(inc/2)+"°",0]]};
 t.hint="لكل مرآة: الشعاع الخارج يصنع مع العمود الزاوية نفسها التي دخل بها. ابدأ من المرآة الأولى وتتبّع الشعاع.";
 return t;}
/* ---------- الجاذبية ---------- */
function makeGrav(level){
 let t,tries=0;
 do{const M=rnd([8,10,12,14,16,20]),vT=rnd([3,3.5,4,4.5,5,5.5,6]),dt=20*M/(vT*vT);
  t={kind:"grav",level,M,vT,k:20,rocks:level>=1};tries++;
  if(dt<9||dt>30)continue;
  gravSetup(t);
  const r=gravSim(t,vT);if(!r.hit||r.crash)continue;
  /* مجاورتها في المنزلق (٠٫٥) يجب ألا تكون أسهل صدفة كبرى؛ نقبل */
  break;}while(tries<500);
 if(tries>=500)throw new Error("grav gen failed");
 t.img=level===2?"planetU":"planetK";
 const Mb=t.M;
 if(level===0)t.deduce={q:"أطلقنا المسبار بسرعتين: البطيء انحنى كثيرًا والسريع انحنى قليلًا. ماذا نستنتج؟",opts:[["كلما زادت السرعة قلّ الانحناء",1],["كلما زادت السرعة زاد الانحناء",0],["السرعة لا تؤثر في الانحناء",0]]};
 else if(level===1)t.deduce={q:"أي تغيير يزيد انحناء مسار المسبار نحو الكوكب؟",opts:[["زيادة كتلة الكوكب أو إنقاص السرعة",1],["إنقاص كتلة الكوكب وزيادة السرعة",0],["زيادة السرعة فقط",0]]};
 else t.deduce={q:"لو ضاعفنا سرعة الإطلاق مع بقاء الكوكب نفسه، فإن الانحناء يصبح:",opts:[["ربع ما كان",1],["نصف ما كان",0],["ضعف ما كان",0]]};
 t.hint="الانحناء = ٢٠ × الكتلة ÷ السرعة². الكتلة "+fmt(Mb)+". اختر سرعة تعطي انحناءً يمر بالحلقة.";
 return t;}
function makeTask(spec){const[k,l]=spec.split(":");const lv=+l;return k==="force"?makeForce(lv):k==="light"?makeLight(lv):makeGrav(lv);}
function makeStage(w,s){return PLAN[w+"-"+s].map(makeTask);}
if(typeof module!=="undefined")module.exports={WORLDS,PLAN,makeStage,makeTask,makeForce,makeLight,makeGrav};
