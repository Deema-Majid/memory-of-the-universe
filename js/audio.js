"use strict";
/* أصوات مولّدة برمجيًا (لا ملفات صوت) */
const SFX=(()=>{let ctx=null,on=true;
 const c=()=>{if(!ctx){try{ctx=new(window.AudioContext||window.webkitAudioContext)();}catch(e){}}if(ctx&&ctx.state==="suspended")ctx.resume();return ctx;};
 function tone(f,d,type="sine",vol=.12,t0=0,f2=null){const a=c();if(!a||!on)return;const o=a.createOscillator(),g=a.createGain(),t=a.currentTime+t0;
  o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+d+.05);}
 return{set(v){on=v;},get on(){return on;},
  click(){tone(520,.07,"triangle");},
  scan(){tone(300,.5,"sine",.1,0,900);tone(900,.2,"triangle",.06,.45);},
  good(){tone(523,.12,"triangle");tone(659,.12,"triangle",.12,.1);tone(784,.2,"triangle",.12,.2);},
  bad(){tone(220,.25,"sawtooth",.08,0,110);},
  cell(){tone(880,.1,"square",.05);tone(1320,.18,"square",.05,.09);},
  push(){tone(120,1.6,"sawtooth",.04,0,200);},
  beam(){tone(700,.3,"sine",.06,0,1100);},
  launch(){tone(200,.9,"sawtooth",.05,0,600);},
  win(){[523,659,784,1047].forEach((f,i)=>tone(f,.25,"triangle",.13,i*.14));}};})();
