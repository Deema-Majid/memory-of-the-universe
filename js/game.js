"use strict";
/* منطق اللعبة والواجهة */
const stageEl=$("#stage"),cv=$("#cv"),ctx=cv.getContext("2d");
let G=null,mode="loading",tLast=0,clock=0;
function fit(){const s=Math.min(innerWidth/1600,innerHeight/900);stageEl.style.transform="translate(-50%,-50%) scale("+s+")";}
addEventListener("resize",fit);fit();
const SCREENS=["loading","menu","story","worlds","stages","tutorial","settings","hud"];
function show(id){mode=id;SCREENS.forEach(s=>$("#"+s).classList.toggle("show",s===id));cv.style.display=id==="hud"?"block":"none";}
function toast(msg,ms=2600){const t=$("#toast");t.textContent=msg;t.classList.add("on");clearTimeout(toast.h);toast.h=setTimeout(()=>t.classList.remove("on"),ms);}
function modal(html,cls=""){const m=$("#modal");$("#modalCard").className="card "+cls;$("#modalCard").innerHTML=html;m.classList.add("show");}
function closeModal(){$("#modal").classList.remove("show");}
const stars=n=>[1,2,3].map(i=>'<img class="st" src="assets/ui/'+(i<=n?"star":"star0")+'.png" alt="">').join("");
/* ---------- التنقل ---------- */
document.addEventListener("click",e=>{const b=e.target.closest("[data-go]");if(!b)return;SFX.click();go(b.dataset.go);});
function go(name){
 closeModal();
 if(name==="menu"){renderMenu();show("menu");}
 else if(name==="worlds"){renderWorlds();show("worlds");}
 else if(name==="story"){startStory(()=>go("menu"));}
 else if(name==="tutorial"){show("tutorial");}
 else if(name==="settings"){renderSettings();show("settings");}
 else if(name==="play"){
  if(!SAVE.d.story){startStory(()=>{SAVE.d.story=true;SAVE.save();go("play");});return;}
  if(!SAVE.d.tut){SAVE.d.tut=true;SAVE.save();show("tutorial");return;}
  let pick=null;for(let w=1;w<=4&&!pick;w++)for(let s=1;s<=3&&!pick;s++)if(SAVE.unlocked(w,s)&&SAVE.stars(w,s)===0)pick=[w,s];
  if(pick)startStage(pick[0],pick[1]);else go("worlds");}
}
function renderMenu(){$("#menuStars").innerHTML=stars(0).replace(/<img[^>]*star0[^>]*>/g,"").length?'<span>النجوم: '+AR(SAVE.total(),0)+' / ٣٦</span>':"";}
function renderSettings(){$("#setSound").textContent="الصوت: "+(SFX.on?"مفعّل":"مغلق");}
$("#setSound").onclick=()=>{SFX.set(!SFX.on);SAVE.d.sound=SFX.on;SAVE.save();SFX.click();renderSettings();};
$("#setReset").onclick=()=>{modal('<h2>مسح التقدّم؟</h2><p>ستعود كل المراحل إلى البداية.</p><div class="row"><button class="btn danger" id="mYes">نعم، امسح</button><button class="btn" id="mNo">إلغاء</button></div>');
 $("#mYes").onclick=()=>{SAVE.reset();closeModal();toast("تم مسح التقدّم");renderMenu();};$("#mNo").onclick=closeModal;};
/* ---------- القصة ---------- */
let storyI=0,storyDone=null;
function startStory(done){storyI=0;storyDone=done;show("story");drawStory();}
function drawStory(){$("#storyImg").src="assets/story/story_"+(storyI+1)+".png";$("#storyDots").innerHTML=[0,1,2,3].map(i=>'<i class="'+(i===storyI?"on":"")+'"></i>').join("");$("#storyNext").textContent=storyI===3?"ابدأ المغامرة":"التالي";}
$("#storyNext").onclick=()=>{SFX.click();if(storyI<3){storyI++;drawStory();}else{SAVE.d.story=true;SAVE.save();storyDone&&storyDone();}};
$("#storySkip").onclick=()=>{SFX.click();SAVE.d.story=true;SAVE.save();storyDone&&storyDone();};
/* ---------- العوالم والمراحل ---------- */
function renderWorlds(){
 $("#worldCards").innerHTML=WORLDS.map(w=>{const lock=!SAVE.unlocked(w.id,1);
  return '<button class="wcard '+(lock?"lock":"")+'" data-w="'+w.id+'" style="--c:'+w.color+'"><img class="wi" src="assets/ui/'+w.icon+'.png" alt=""><b>'+w.name+'</b><small>'+w.law+'</small><div class="ws">'+(lock?'<img class="lk" src="assets/ui/lock.png" alt="مقفل">':stars(Math.ceil(SAVE.worldStars(w.id)/3)).replace(/class="st"/g,'class="st sm"')+'<em>'+AR(SAVE.worldStars(w.id),0)+'/٩</em>')+'</div></button>';}).join("");
 $$("#worldCards .wcard").forEach(b=>b.onclick=()=>{if(b.classList.contains("lock")){SFX.bad();return;}SFX.click();openWorld(+b.dataset.w);});}
function openWorld(w){const W=WORLDS[w-1];$("#stagesTitle").textContent="عالم "+W.name;$("#stagesIntro").textContent=W.intro;
 $("#stageCards").innerHTML=[1,2,3].map(s=>{const lock=!SAVE.unlocked(w,s);return '<button class="scard '+(lock?"lock":"")+'" data-s="'+s+'" style="--c:'+W.color+'"><span class="sn">'+AR(s,0)+'</span><b>'+W.stages[s-1]+'</b><div>'+(lock?'<img class="lk" src="assets/ui/lock.png" alt="مقفل">':stars(SAVE.stars(w,s)))+'</div></button>';}).join("");
 $$("#stageCards .scard").forEach(b=>b.onclick=()=>{if(b.classList.contains("lock")){SFX.bad();return;}SFX.click();startStage(w,+b.dataset.s);});
 $("#stages").querySelector(".icon").dataset.go="worlds";show("stages");}
/* ---------- بدء المرحلة ---------- */
function startStage(w,s){
 closeModal();
 G={w,s,tasks:makeStage(w,s),ti:0,energy:10,solved:false,parts:[],used:{scan:0,hint:0,fail:0}};
 show("hud");$("#hWorld").textContent="عالم "+WORLDS[w-1].name;$("#hStage").textContent="المرحلة "+AR(s,0)+": "+WORLDS[w-1].stages[s-1];
 startTask();
 if(s===1||w===4){const W=WORLDS[w-1];G.paused=true;modal('<img class="mi" src="assets/ui/'+W.icon+'.png" alt=""><h2>عالم '+W.name+'</h2><p>'+W.intro+'</p><button class="btn big" id="mGo">ابدأ</button>');$("#mGo").onclick=()=>{SFX.click();closeModal();G.paused=false;};}}
function startTask(){
 const t=G.task=G.tasks[G.ti];
 Object.assign(G,{phase:"measure",scanned:false,scanInfo:null,mood:"idle",anim:null,firstTry:true,deduced:false,cellTaken:false,cellFly:null,plateOn:false,gateOpen:false,sensorLock:false,crateX:t.x0,sel:0,angles:t.kind==="light"?t.start.slice():null,F:0,V:null,disabled:[],opts:null,msg:null});
 t.cellPos=t.kind==="light"?{x:760,y:105}:{x:700,y:225};
 G.F=t.kind==="force"?Math.round(t.Fmax/4):0;G.V=t.kind==="grav"?6:null;
 render();}
/* ---------- الطاقة ---------- */
function spend(n){G.energy=Math.max(0,G.energy-n);renderHud();}
function gain(n){G.energy=Math.min(10,G.energy+n);renderHud();}
function renderHud(){$("#hEnergy").innerHTML=Array.from({length:10},(_,i)=>'<i class="'+(i<G.energy?"on":"")+'"></i>').join("");$("#hEnergyN").textContent=AR(G.energy,0);
 $("#hDots").innerHTML=G.tasks.length>1?G.tasks.map((_,i)=>'<i class="'+(i<G.ti?"done":i===G.ti?"cur":"")+'"></i>').join(""):"";
 $("#hSound").firstChild.src="assets/ui/"+(SFX.on?"sound_on":"sound_off")+".png";}
function setFace(k){$("#face").src="assets/ui/"+k+".png";}
function mood(m,ms){G.mood=m;clearTimeout(G.mt);if(ms)G.mt=setTimeout(()=>{G.mood="idle";},ms);}
/* ---------- بناء اللوحة ---------- */
function chips(){const t=G.task,c=[];
 if(G.scanned){
  if(t.kind==="force"){c.push(["الكتلة",fmt(t.m)+" كغ"],["التسارع المطلوب",fmt(t.A)+" م/ث²"]);}
  else if(t.kind==="light"){const i=G.scanInfo;c.push(["زاوية السقوط",AR(i,0)+"°"],["زاوية الانعكاس",AR(i,0)+"°"]);}
  else c.push(["كتلة الكوكب",fmt(t.M)],["الانحناء المطلوب",AR(t.dthT,1)+"°"]);}
 if(G.phase==="act"){
  if(t.kind==="force")c.push(["التسارع الناتج",AR(G.F/t.m,2)+" م/ث²","live"]);
  if(t.kind==="grav")c.push(["الانحناء الناتج",AR(gravDth(t,G.V),1)+"°","live"]);}
 $("#chips").innerHTML=c.map(x=>'<div class="chip '+(x[2]||"")+'"><small>'+x[0]+'</small><b>'+x[1]+'</b></div>').join("");}
function render(){
 const t=G.task,ph=G.phase,say=$("#say"),ctl=$("#ctl");renderHud();chips();
 setFace(G.energy<=2?"tired":ph==="measure"?"neutral":ph==="deduce"?"thinking":"happy");
 if(ph==="measure"){
  say.textContent=t.kind==="force"?"هذا صندوق لا أعرف كتلته. اضغط «قِس» ليقرأ حسّاسي الكتلة والتسارع المطلوب.":t.kind==="light"?"الشعاع يخرج من المصدر. اضغط «قِس» لأقيس زاويتي السقوط والانعكاس عند المرآة الأولى.":"المسبار جاهز للإطلاق. اضغط «قِس» لأعرف كتلة الكوكب والانحناء المطلوب.";
  ctl.innerHTML='<button class="btn big" id="bScan">قِس <small>−١ ⚡</small></button>';$("#bScan").onclick=scan;}
 else if(ph==="deduce"){
  say.textContent=t.deduce.q;
  if(!G.opts)G.opts=shuffle(t.deduce.opts.map((o,i)=>({txt:o[0],ok:!!o[1],i})));
  ctl.innerHTML='<div class="opts">'+G.opts.map((o,k)=>'<button class="btn opt" data-k="'+k+'" '+(G.disabled.includes(k)?"disabled":"")+'>'+o.txt+'</button>').join("")+'</div>';
  $$(".opt",ctl).forEach(b=>b.onclick=()=>pick(+b.dataset.k));}
 else if(ph==="act"){
  if(t.kind==="force"){say.textContent="القوة = الكتلة × التسارع. اضبط القوة اللازمة ثم ادفع.";
   ctl.innerHTML='<div class="sl"><label>القوة: <b id="vF">'+fmt(G.F)+'</b> نيوتن</label><input id="rF" type="range" min="0" max="'+t.Fmax+'" step="0.5" value="'+G.F+'"></div><button class="btn big" id="bGo">ادفع</button>';
   $("#rF").oninput=e=>{G.F=+e.target.value;$("#vF").textContent=fmt(G.F);chips();};$("#bGo").onclick=fire;}
  else if(t.kind==="light"){say.textContent="أدِر المرايا حتى يضيء المستشعر، ثم ثبّتها.";
   ctl.innerHTML='<div class="sls">'+t.mirrors.map((m,i)=>'<div class="sl"><label>المرآة '+AR(i+1,0)+': <b id="vA'+i+'">'+AR(G.angles[i],0)+'</b>°</label><input data-i="'+i+'" type="range" min="10" max="170" step="1" value="'+G.angles[i]+'"></div>').join("")+'</div><button class="btn big" id="bGo">ثبّت</button>';
   $$("input[type=range]",ctl).forEach(r=>{const f=e=>{const i=+r.dataset.i;G.angles[i]=+r.value;G.sel=i;$("#vA"+i).textContent=AR(r.value,0);};r.oninput=f;r.onfocus=()=>G.sel=+r.dataset.i;r.onpointerdown=()=>G.sel=+r.dataset.i;});$("#bGo").onclick=fire;}
  else{say.textContent="الانحناء = ٢٠ × الكتلة ÷ السرعة². اختر سرعة تعطي الانحناء المطلوب.";
   ctl.innerHTML='<div class="sl"><label>سرعة الإطلاق: <b id="vV">'+fmt(G.V)+'</b></label><input id="rV" type="range" min="2" max="10" step="0.5" value="'+G.V+'"></div><button class="btn big" id="bGo">أطلق</button>';
   $("#rV").oninput=e=>{G.V=+e.target.value;$("#vV").textContent=fmt(G.V);chips();};$("#bGo").onclick=fire;}}
 else{ctl.innerHTML="";}
 if(G.msg){say.textContent=G.msg;}}
/* ---------- القياس ---------- */
function scan(){
 if(G.phase!=="measure"||G.busy)return;G.busy=true;spend(1);G.used.scan++;SFX.scan();mood("scan");setFace("scanning");
 setTimeout(()=>{const t=G.task;
  if(t.kind==="light"){const a=rad(G.angles[0]);G.scanInfo=Math.round(deg(Math.acos(Math.min(1,Math.abs(Math.sin(a))))));}
  G.scanned=true;G.phase="deduce";G.busy=false;mood("think",800);
  if(G.energy<=0){lose();return;}render();},1300);}
/* ---------- الاستنتاج ---------- */
function pick(k){
 const o=G.opts[k];
 if(o.ok){SFX.good();G.phase="act";G.msg=null;mood("success",900);
  if(G.firstTry){G.cellFly={p:0};SFX.cell();tween(1000,p=>{G.cellFly&&(G.cellFly.p=p);},()=>{G.cellFly=null;G.cellTaken=true;gain(1);toast("التقطتَ خلية طاقة ⚡ +١");});}
  else toast("صحيح. لكن الخلية تُمنح للإجابة الأولى فقط.");
  render();}
 else{G.firstTry=false;G.disabled.push(k);SFX.bad();mood("fail",800);spend(1);toast("ليست الإجابة الصحيحة (−١ ⚡)");if(G.energy<=0){lose();return;}render();}}
function tween(ms,f,done){const t0=performance.now();(function s(n){const p=Math.min(1,(n-t0)/ms);f(p);if(p<1)requestAnimationFrame(s);else done&&done();})(t0);}
/* ---------- التنفيذ ---------- */
function fire(){
 if(G.busy||G.phase!=="act")return;const t=G.task;
 if(t.kind==="force"){const res=forceSim(t,G.F);G.busy=true;SFX.push();G.anim={type:"push",p:0,res};
  tween(2200,p=>{G.anim.p=p;const tt=p*t.T,d=.5*res.a*tt*tt*t.pxm;G.crateX=Math.max(400,t.x0-d);},()=>endAttempt(res.ok,res.slow?"القوة ضعيفة: توقف الصندوق قبل علامة الهدف.":"القوة كبيرة: تجاوز الصندوق علامة الهدف."));}
 else if(t.kind==="light"){const tr=traceBeam(t,G.angles);SFX.beam();G.busy=true;setTimeout(()=>{endAttempt(tr.hit,"لم يصل الشعاع إلى المستشعر. تتبّع الشعاع وأدِر المرايا.");},350);}
 else{const res=gravSim(t,G.V);G.busy=true;SFX.launch();G.anim={type:"launch",p:0,res};
  tween(Math.max(1400,res.pts.length*26),p=>{G.anim.p=p;},()=>endAttempt(res.hit&&!res.crash,res.crash==="planet"?"سقط المسبار في الكوكب: الانحناء كبير جدًا.":res.crash==="ast"?"اصطدم المسبار بكويكب.":res.dth>t.dthT?"انحنى المسار أكثر من اللازم.":"انحنى المسار أقل من اللازم."));}}
function endAttempt(ok,failMsg){
 const t=G.task;G.busy=false;
 if(ok){if(t.kind==="force"){G.plateOn=true;G.gateOpen=true;}if(t.kind==="light")G.sensorLock=true;
  mood("success");setFace("happy");SFX.good();const P=t.kind==="force"?{x:t.plateX,y:GROUND-285}:t.kind==="light"?t.sensor:t.ring;burst(G,P.x,P.y,"#FFD166",40);
  G.phase="done";render();G.msg="أحسنت! عاد قانون جديد إلى مكانه.";$("#say").textContent=G.msg;
  setTimeout(()=>{if(G.ti+1<G.tasks.length){G.ti++;G.msg=null;fade(startTask);}else stageWin();},1500);}
 else{G.used.fail++;mood("fail",1400);SFX.bad();spend(2);setFace("sad");G.msg=failMsg+" (−٢ ⚡)";$("#say").textContent=G.msg;
  if(G.energy<=0){setTimeout(lose,900);return;}
  setTimeout(()=>{G.anim=null;G.crateX=t.x0;G.msg=null;if(G.phase==="act")render();},1300);}}
function fade(cb){const el=$("#hud");el.classList.add("fade");setTimeout(()=>{cb();el.classList.remove("fade");},400);}
/* ---------- فوز وخسارة ---------- */
function stageWin(){
 const n=G.energy>=6?3:G.energy>=3?2:1;SAVE.setStars(G.w,G.s,n);SFX.win();
 const kinds=[...new Set(G.tasks.map(t=>t.kind))],laws=kinds.map(k=>'<li>'+LAWS[k]+'</li>').join("");
 const last=G.w===4&&G.s===3;
 if(last){modal('<img class="core" src="assets/img/core.png" alt=""><h2>عاد الكون كاملًا!</h2><div class="stars">'+stars(n)+'</div><p>تذكّرت العوالم الأربعة قوانينها بفضلك يا بطل. مجموع نجومك: '+AR(SAVE.total(),0)+' من ٣٦.</p><ul class="laws">'+laws+'</ul><div class="row"><button class="btn" data-go="worlds" id="mW">العوالم</button><button class="btn" id="mR">أعد المرحلة</button></div>','win');
  $("#mW").onclick=()=>{closeModal();};$("#mR").onclick=()=>startStage(G.w,G.s);return;}
 modal('<h2>أحسنت! أُنجزت المرحلة</h2><div class="stars">'+stars(n)+'</div><p>استعدنا قانونًا:</p><ul class="laws">'+laws+'</ul><p class="small">بقيت لديك '+AR(G.energy,0)+' وحدات طاقة.</p><div class="row"><button class="btn big" id="mN">التالي</button><button class="btn" id="mR">أعد المرحلة</button><button class="btn ghost" id="mH">العوالم</button></div>','win');
 $("#mN").onclick=()=>{SFX.click();if(G.s<3)startStage(G.w,G.s+1);else startStage(G.w+1,1);};
 $("#mR").onclick=()=>{SFX.click();startStage(G.w,G.s);};
 $("#mH").onclick=()=>{SFX.click();closeModal();go("worlds");};}
function lose(){G.phase="lost";G.paused=true;SFX.bad();modal('<img class="mi" src="assets/ui/tired.png" alt=""><h2>نفدت الطاقة</h2><p>لا بأس. القياس والاستنتاج أولًا يوفّران الطاقة. جرّب من جديد.</p><div class="row"><button class="btn big" id="mR">حاول مجددًا</button><button class="btn ghost" id="mH">العوالم</button></div>','lose');
 $("#mR").onclick=()=>{SFX.click();startStage(G.w,G.s);};$("#mH").onclick=()=>{SFX.click();closeModal();go("worlds");};}
/* ---------- أزرار الشريط العلوي ---------- */
$("#hPause").onclick=()=>{if(!G||G.phase==="lost")return;SFX.click();G.paused=true;modal('<h2>متوقّف</h2><div class="row v"><button class="btn big" id="mC">متابعة</button><button class="btn" id="mR">أعد المرحلة</button><button class="btn ghost" id="mH">العوالم</button></div>');
 $("#mC").onclick=()=>{closeModal();G.paused=false;};$("#mR").onclick=()=>startStage(G.w,G.s);$("#mH").onclick=()=>{closeModal();go("worlds");};};
$("#hBack").onclick=()=>{SFX.click();closeModal();go("worlds");};
$("#hSound").onclick=()=>{SFX.set(!SFX.on);SAVE.d.sound=SFX.on;SAVE.save();SFX.click();renderHud();};
$("#hHint").onclick=()=>{if(!G||G.busy||G.phase==="lost"||G.phase==="done")return;if(G.energy<2){toast("طاقتك لا تكفي لتلميح");SFX.bad();return;}
 SFX.click();spend(1);G.used.hint++;G.paused=true;modal('<img class="mi" src="assets/ui/hint.png" alt=""><h2>تلميح</h2><p>'+G.task.hint+'</p><button class="btn" id="mC">حسنًا (−١ ⚡)</button>');$("#mC").onclick=()=>{closeModal();G.paused=false;};};
/* ---------- الحلقة الرئيسية ---------- */
function loop(ts){const dt=Math.min(.05,(ts-tLast)/1000||0);tLast=ts;clock+=dt;
 if(mode==="hud"&&G&&G.task)drawScene(ctx,G,clock);
 requestAnimationFrame(loop);}
/* ---------- الإقلاع ---------- */
SFX.set(SAVE.d.sound!==false);
loadAll(p=>{$("#lbar").style.width=(p*100)+"%";}).then(()=>{(document.fonts&&document.fonts.ready||Promise.resolve()).then(()=>{renderMenu();show("menu");requestAnimationFrame(loop);});});
window.__dbg={G:()=>G,go,startStage,SAVE};
