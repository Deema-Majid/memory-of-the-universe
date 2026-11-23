"use strict";
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rad=d=>d*Math.PI/180, deg=r=>r*180/Math.PI;
const rnd=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const AR=(n,d=1)=>{const f=Math.pow(10,d);let s=(Math.round(n*f)/f).toString();return s.replace(/\d/g,x=>"٠١٢٣٤٥٦٧٨٩"[x]).replace(".","٫").replace("-","−");};
const ease=p=>1-Math.pow(1-clamp(p,0,1),2);
const smooth=u=>u*u*(3-2*u);
