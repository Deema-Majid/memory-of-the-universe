"use strict";
const SAVE=(()=>{const K="dhakirat_alkawn_v1";let d={stars:{},sound:true,tut:false,story:false};
 try{const r=JSON.parse(localStorage.getItem(K)||"null");if(r)d=Object.assign(d,r);}catch(e){}
 const dev=/[?&]dev=1/.test(location.search);
 const w=()=>{try{localStorage.setItem(K,JSON.stringify(d));}catch(e){}};
 return{d,save:w,
  stars:(a,b)=>d.stars[a+"-"+b]||0,
  setStars(a,b,n){const k=a+"-"+b;if((d.stars[k]||0)<n)d.stars[k]=n;w();},
  unlocked(a,b){if(dev)return true;if(b===1)return a===1||(d.stars[(a-1)+"-3"]||0)>0;return(d.stars[a+"-"+(b-1)]||0)>0;},
  worldStars(a){return[1,2,3].reduce((s,b)=>s+(d.stars[a+"-"+b]||0),0);},
  total(){return Object.values(d.stars).reduce((a,b)=>a+b,0);},
  reset(){d.stars={};d.tut=false;d.story=false;w();}};})();
