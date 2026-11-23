"use strict";
const Story = {
  cols: ["#E8A33C", "#4CC3D9", "#9B6BFF", "#FF8A5C"], get names() { return LANG === "en" ? EN.worlds.map(w => w.name) : ["الثِقل", "المرايا", "المقلاع", "الذاكرة"]; },
  run(i) { const cv = $("#sc"); if (!cv) return; const c = cv.getContext("2d"), t0 = performance.now(); this.id = (this.id || 0) + 1; const my = this.id;
    const loop = now => { if (this.id !== my || !document.body.contains(cv)) return; this.draw(c, i, (now - t0) / 1000); requestAnimationFrame(loop); }; requestAnimationFrame(loop); },
  glow(c, x, y, r, col, a = 1) { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)"); c.save(); c.globalAlpha = a; c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.restore(); },
  stars(c, t, n = 40) { c.save(); for (let k = 0; k < n; k++) { const x = (k * 97.3) % 960, y = (k * 53.7) % 540, tw = .4 + .6 * Math.abs(Math.sin(t * 1.5 + k)); c.globalAlpha = tw; c.fillStyle = "#fff"; c.fillRect(x, y, 2 + (k % 3), 2 + (k % 3)); } c.restore(); },
  robot(c, st, x, gy, t, w = 230, flip = true) { Robo.draw(c, myLook(), st, Robo.frame(st, t), x, gy, w, flip, 0, t); },
  draw(c, i, t) {
    c.clearRect(0, 0, 960, 540); const bgn = [3, 1, 4, 4][i]; c.drawImage(IMG["bg" + bgn], 0, 0, 960, 540); c.fillStyle = "rgba(5,8,30,.35)"; c.fillRect(0, 0, 960, 540); this.stars(c, t);
    const lt = t % 7;
    if (i === 0) {
      const cx = 480, cy = 250, ex = Math.min(1, Math.max(0, (lt - 2.2) / 2)), e = ex * ex * (3 - 2 * ex);
      c.save(); c.globalAlpha = 1 - .65 * e; this.glow(c, cx, cy, 230 + Math.sin(t * 3) * 14, "rgba(255,190,70,.8)"); c.drawImage(IMG.core, cx - 120 + (lt > 2 && lt < 2.5 ? Math.sin(t * 90) * 4 : 0), cy - 120 + Math.sin(t * 2) * 6, 240, 240); c.restore();
      const P = [[800, 130], [150, 140], [790, 420], [170, 410]];
      P.forEach((p, k) => { for (let q = 6; q >= 0; q--) { const ee = Math.max(0, e - q * .035), x = cx + (p[0] - cx) * ee, y = cy + (p[1] - cy) * ee - Math.sin(ee * Math.PI) * 60; this.glow(c, x, y, 34 - q * 3 + (e >= 1 ? Math.sin(t * 4 + k) * 4 : 0), this.cols[k], q ? .12 : .95); } });
      { const ap = Math.min(1, Math.max(0, (lt - .6) / 1.2)), lv = lt > 4.2 ? Math.min(1, (lt - 4.2) / 1) : 0; if (ap > 0 && lv < 1) { c.save(); c.globalAlpha = ap * (1 - lv); Boss.monster(c, 480 + 230 * lv, 250 - 40 * (1 - ap) - 60 * lv, 70, "#B06BFF", { t, look: { x: 480, y: 250 }, wind: lt > 1.8 && lt < 2.4 ? 1 : 0 }); c.restore(); } }
      [["astA", 90], ["astB", 60], ["astC", 40]].forEach(([k, sz], j) => { const x = ((t * (12 + j * 7) + j * 300) % 1100) - 80, y = 60 + j * 150 + Math.sin(t + j) * 20; c.save(); c.translate(x, y); c.rotate(t * .4 + j); c.drawImage(IMG[k], -sz / 2, -sz / 2, sz, sz * .9); c.restore(); });
    } else if (i === 1) {
      c.drawImage(IMG.gt1, 0, 440, 600, 100); c.drawImage(IMG.gt1, 600, 440, 600, 100); c.drawImage(IMG.rubble, 560, 380, 260, 150); c.drawImage(IMG.rubble, 80, 400, 200, 120);
      const awake = lt > 2.5; this.glow(c, 470, 330, awake ? 170 : 90, "rgba(80,180,255,.5)", awake ? .8 : .3);
      this.robot(c, awake ? "idle" : "low", 470, 470, t, 300 * (awake ? 1 : .98), true);
      for (let k = 0; k < 5; k++) { const x = (k * 211 + t * 160) % 1000 - 40, y = (k * 97 + t * 90) % 420; c.strokeStyle = "rgba(255,230,160,.7)"; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 40, y - 22); c.stroke(); }
      c.drawImage(IMG.pickup, 700, 350 + Math.sin(t * 3) * 8, 58, 68);
      if (awake) { c.fillStyle = "#FFE08A"; c.font = "800 54px Cairo"; c.textAlign = "center"; c.fillText("!", 470 + 80, 250 + Math.sin(t * 6) * 4); }
    } else if (i === 2) {
      const act = Math.floor(lt / 1.7) % 4;
      for (let k = 0; k < 4; k++) { const x = 60 + (3 - k) * 225, y = 130, on = k === act, sc = on ? 1.04 : 1;
        c.save(); c.translate(x + 100, y + 150); c.scale(sc, sc); c.beginPath(); c.roundRect(-100, -150, 200, 300, 26); c.clip(); c.drawImage(IMG["bg" + (k + 1)], -267, -150, 534, 300); c.fillStyle = on ? "rgba(0,0,0,0)" : "rgba(5,8,30,.35)"; c.fillRect(-100, -150, 200, 300); c.restore();
        c.save(); c.strokeStyle = this.cols[k]; c.lineWidth = on ? 7 : 3; c.beginPath(); c.roundRect(x - (on ? 4 : 0), y - (on ? 4 : 0), 200 + (on ? 8 : 0), 300 + (on ? 8 : 0), 26); c.stroke(); c.restore();
        c.fillStyle = "#fff"; c.font = "800 32px Cairo"; c.textAlign = "center"; c.fillText(this.names[k], x + 100, y + 345); if (on) this.glow(c, x + 100, y + 150, 160, this.cols[k], .35); }
      const f = (lt / 1.7) % 1, ax = 60 + (3 - act) * 225 + 100, bx = 60 + (3 - ((act + 1) % 4)) * 225 + 100, rx = ax + (bx - ax) * f;
      this.robot(c, "jump", rx, 120 - Math.sin(f * Math.PI) * 50 + 40, t * 1.2, 170, bx < ax);
    } else {
      c.save(); c.translate(480, 270); c.rotate(t * .15); for (let k = 0; k < 12; k++) { c.rotate(Math.PI / 6); const g = c.createLinearGradient(0, 0, 0, -480); g.addColorStop(0, "rgba(255,200,80,.30)"); g.addColorStop(1, "rgba(255,200,80,0)"); c.fillStyle = g; c.beginPath(); c.moveTo(-18, 0); c.lineTo(18, 0); c.lineTo(60, -480); c.lineTo(-60, -480); c.fill(); } c.restore();
      this.glow(c, 480, 260, 260 + Math.sin(t * 2) * 20, "rgba(255,190,70,.75)"); c.drawImage(IMG.coreGate, 480 - 140, 60, 280, 340); c.drawImage(IMG.core, 480 - 90, 200 + Math.sin(t * 2) * 10, 180, 180);
      c.drawImage(IMG.gt4, 0, 440, 600, 100); c.drawImage(IMG.gt4, 600, 440, 600, 100); this.robot(c, lt > 3 ? "success" : "idle", 700, 470, t, 260, true);
      for (let k = 0; k < 18; k++) { const a = t * .8 + k * 1.7, r = 140 + (k * 37) % 160; c.fillStyle = "rgba(255,230,150,.9)"; c.beginPath(); c.arc(480 + Math.cos(a) * r, 260 + Math.sin(a) * r * .6, 2 + (k % 3), 0, 7); c.fill(); }
    }
  }
};
/* ---------- مشهد متحرك خلف القوائم ---------- */
const Menu = {
  draw(c, t) {
    if (!IMG.bg3) { c.fillStyle = "#0d1330"; c.fillRect(0, 0, 1600, 900); return; }
    c.drawImage(IMG.bg3, -60 + Math.sin(t * .1) * 50, -40 + Math.cos(t * .13) * 25, 1720, 980);
    c.fillStyle = "rgba(10,12,40,.35)"; c.fillRect(0, 0, 1600, 900);
    for (let k = 0; k < 70; k++) { const x = (k * 233.7) % 1600, y = (k * 127.3) % 760; c.globalAlpha = .25 + .75 * Math.abs(Math.sin(t * (0.6 + k % 5 * .3) + k)); c.fillStyle = "#fff"; c.fillRect(x, y, 2 + k % 3, 2 + k % 3); } c.globalAlpha = 1;
    const sh = (t % 7) / 1.2; if (sh < 1) { const x = 1500 - sh * 900, y = 60 + sh * 260; c.save(); const g = c.createLinearGradient(x, y, x + 180, y - 52); g.addColorStop(0, "rgba(255,255,255,.95)"); g.addColorStop(1, "rgba(255,255,255,0)"); c.strokeStyle = g; c.lineWidth = 4; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 180, y - 52); c.stroke(); c.restore(); }
    Story.glow(c, 800, 330, 330 + Math.sin(t * 1.6) * 25, "rgba(123,77,255,.45)");
    { const pk = Math.max(0, Math.sin(t * .45)), up = Math.pow(pk, 3); if (up > .02) Boss.monster(c, 1340 - 40 + up * -60, 210 + 110 - up * 150, 52, "#B06BFF", { t, look: { x: 800, y: 600 } }); }
    c.save(); c.translate(1340, 210 + Math.sin(t * .7) * 14); c.rotate(t * .05); c.drawImage(IMG.planetU, -150, -150, 300, 300); c.restore();
    c.save(); c.translate(230, 170 + Math.cos(t * .8) * 12); c.rotate(-t * .08); c.drawImage(IMG.planetK, -85, -85, 170, 170); c.restore();
    const oa = t * .6; c.save(); c.translate(230 + Math.cos(oa) * 150, 170 + Math.sin(oa) * 50); c.drawImage(IMG.ring, -26, -26, 52, 52); c.restore();
    [["astA", 120, 12, 0], ["astB", 80, 20, 380], ["astC", 60, 30, 760]].forEach(([k, s, sp, o], j) => { const x = 1700 - ((t * sp + o * 2.3) % 1900), y = 330 + j * 120 + Math.sin(t * .8 + j) * 30; c.save(); c.translate(x, y); c.rotate(t * (.3 + j * .2)); c.globalAlpha = .9; c.drawImage(IMG[k], -s / 2, -s / 2, s, s * .9); c.restore(); });
    const pf = (t % 9) / 4; if (pf < 1) { const pts = []; for (let k = 0; k <= 40; k++) { const u = k / 40 * pf; pts.push([-100 + u * 1800, 640 - Math.sin(u * Math.PI) * 420]); } c.save(); c.setLineDash([2, 14]); c.lineCap = "round"; c.strokeStyle = "rgba(255,224,138,.7)"; c.lineWidth = 5; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); c.restore();
      const p = pts[40], q = pts[38]; c.save(); c.translate(p[0], p[1]); c.rotate(Math.atan2(p[1] - q[1], p[0] - q[0])); c.drawImage(IMG.probe, -50, -42, 100, 84); c.restore(); }
    for (let x = -((t * 40) % 600); x < 1600; x += 600) c.drawImage(IMG.gt4, x, 845, 600, 200);
    [260, 640, 1060, 1420].forEach((x, i) => { const bx = (x - t * 40) % 1600 + (x - t * 40 < 0 ? 1600 : 0); c.drawImage(IMG.pickup, bx - 22, 790 + Math.sin(t * 3 + i) * 5, 44, 52); });
    const cyc = (t % 16) / 16, dir = cyc < .5 ? 1 : -1, ph = cyc < .5 ? cyc * 2 : (1 - cyc) * 2, rx = 160 + ease(ph) * 1280, jump = Math.max(0, Math.sin(t * 2.2)) > .97 ? 0 : Math.max(0, Math.sin((t % 3.2) / 3.2 * Math.PI * 6)) * (((t / 3.2) | 0) % 2 ? 90 : 0);
    Story.robot(c, jump > 5 ? "jump" : "roll", rx, 858 - jump, t, 170, dir < 0);
  }
};
const AVATARS = ["happy", "thinking", "scanning", "law_force", "law_light", "law_gravity"];
const UI = {
  _bic: 0,
  scale: 1, scr: null, unlockAll: /[?&]unlock=1/.test(location.search),
  show(id) { $("#toast").classList.remove("on"); ["menu", "worlds", "stages", "profile", "book", "team"].forEach(s => $("#" + s).classList.toggle("hidden", s !== id)); $("#hud").classList.add("hidden"); this.scr = id; Eng.phase = "idle"; Eng.T = null; if (!id) return; },
  fit() { const s = Math.min(innerWidth / 1600, innerHeight / 900); this.scale = s; $("#stage").style.transform = `scale(${s})`; },
  /* ---------- القوائم ---------- */
  menu() {
    this.show("menu"); SFX.music("menu"); const any = Object.keys(Save.d.stars).length;
    const P = Save.d.profile; $("#menu").innerHTML = `${P ? `<div class="me" id="mMe"><canvas id="meCv" width="120" height="120"></canvas><span>${L("أهلًا", "Hi")} ${P.name.replace(/[<>&"]/g, "")}</span></div>` : ""}<img class="logo" src="assets/logo/logo_stacked_dark.png" alt="ذاكرة الكون"><div class="row"><button class="btn pri" id="mPlay">${any ? L("تابعي اللعب", "Continue") : L("ابدئي", "Play")}</button><button class="btn" id="mStory">${L("القصة", "Story")}</button><button class="btn" id="mSound">${SFX.on ? "🔊" : "🔇"} ${L("الصوت", "Sound")}</button>${any ? `<button class="btn" id="mNew">${L("لعبة جديدة", "New game")}</button>` : ""}<button class="btn team" id="mTeam">👥 ${L("العب مع صديقاتك", "Play with friends")} <i>${L("تجريبي", "beta")}</i></button><button class="btn" id="mBook">📖 ${L("كتاب الذاكرة", "Memory Book")}</button><button class="btn" id="mAcc">${L("الحساب", "Profile")}</button></div><p>${L("لعبة فيزياء ثنائية الأبعاد: قيسي · استنتجي · تصرّفي", "A 2D physics game: Measure · Deduce · Act")}</p>`;
    $("#mPlay").onclick = () => { SFX.click(); const go = () => { if (!Save.d.story) this.story(() => this.worlds()); else this.worlds(); }; if (!Save.d.profile) this.profile(go); else go(); };
    if ($("#mNew")) $("#mNew").onclick = () => { SFX.click(); this.modal(`<h3>${L("لعبة جديدة؟", "Start a new game?")}</h3><p>${L("سيُمسح تقدمك ونجومك وتبدأين من العالم الأول. اسمك وصورتك ولغتك تبقى كما هي.", "Your progress and stars will be erased and you start from world 1. Your name, avatar and language stay.")}</p><div class="row"><button class="btn pri" id="nY">${L("نعم، ابدئي من جديد", "Yes, start over")}</button><button class="btn" id="nN">${L("إلغاء", "Cancel")}</button></div>`);
      $("#nN").onclick = () => this.closeModal(); $("#nY").onclick = () => { Save.reset(); this.closeModal(); this.toast(L("بدأت لعبة جديدة!", "New game started!")); this.menu(); }; };
    $("#mBook").onclick = () => { SFX.click(); this.book(); };
    $("#mTeam").onclick = () => { SFX.click(); if (!Save.d.profile) this.profile(() => this.team()); else this.team(); };
    $("#mAcc").onclick = () => { SFX.click(); this.profile(() => this.menu()); }; if ($("#mMe")) { $("#mMe").onclick = () => $("#mAcc").click(); const mc = $("#meCv"), g = mc.getContext("2d"), my = ++this._bic, lp = () => { if (this._bic !== my || !document.body.contains(mc)) return; g.clearRect(0, 0, 120, 120); Robo.draw(g, myLook(), "idle", Robo.frame("idle", performance.now() / 1000), Robo.cx(60, 235), 136, 235, true, 0, performance.now() / 1000); requestAnimationFrame(lp); }; lp(); }
    $("#mStory").onclick = () => { SFX.click(); this.story(() => this.menu()); };
    $("#mSound").onclick = () => { SFX.toggle(); Save.d.sound = SFX.on; Save.save(); SFX.click(); this.menu(); };
  },
  story(done) {
    let i = 0; const go = () => { const s = STORY[i];
      this.modal(`<canvas id="sc" class="sc" width="960" height="540"></canvas><p>${stt(i)}</p><div class="row"><button class="btn pri" id="sx">${i < STORY.length - 1 ? L("التالي", "Next") : L("هيا نبدأ", "Let's go")}</button><button class="btn small" id="ss">${L("تخطّي", "Skip")}</button></div>`);
      $("#sx").onclick = () => { SFX.click(); if (++i < STORY.length) go(); else fin(); }; $("#ss").onclick = fin; Story.run(i); };
    const fin = () => { Save.d.story = true; Save.save(); this.closeModal(); done(); }; go();
  },
  applyLang() { const h = document.documentElement; h.lang = LANG; h.dir = LANG === "en" ? "ltr" : "rtl"; document.title = L("ذاكرة الكون", "Memory of the Universe"); const bt = $("#bTest"); if (bt) { bt.textContent = L("جرّبي", "Try"); $("#bDeduce").textContent = L("ثبّتي الاستنتاج", "Lock deduction"); $("#bAct").textContent = L("نفّذي", "Go"); } },
  profile(done) {
    this.show("profile"); this.applyLang(); const P = Save.d.profile || { name: "", av: 0 }, lk = Object.assign({ body: 0, acc: 0, accCol: 8 }, Save.d.look || {});
    if (!accOpen(lk.acc)) lk.acc = 0;
    const sw = (cls, sel) => COLORS.map((c, i) => `<button class="cs ${cls} ${i === sel ? "on" : ""}" data-i="${i}" style="--c:${c || "#eef1ff"}" title="${i}"></button>`).join("");
    $("#profile").innerHTML = `<h2>${L("حسابي", "My profile")}</h2><div class="pgrid"><div class="pprev"><canvas id="pv" width="340" height="360"></canvas><small>${L("هذا ذرّتك! يراه أصدقاؤك في اللعب الجماعي.", "This is your Zarra! Friends see it in team play.")}</small></div><div class="popts">
      <label>${L("اسمك", "Your name")}</label><input type="text" id="pName" maxlength="14" value="${P.name.replace(/[<>&"]/g, "")}" placeholder="${L("اكتبي اسمك", "Type your name")}">
      <label>${L("لون ذرّة", "Zarra's color")}</label><div class="cols" id="cBody">${sw("b", lk.body)}</div>
      <label>${L("الشكل", "Style")} <small style="opacity:.7">${L("(النادرة تُفتح بجمع ٣ شظايا 💎 في عالم)", "(rare ones unlock with 3 shards 💎 in a world)")}</small></label><div class="accs">${ACCS.map((x, i) => `<button class="ac ${i === lk.acc ? "on" : ""} ${accOpen(i) ? "" : "lockb"} ${x.w !== undefined ? "rare" : ""}" data-i="${i}"><b>${x.e}</b>${accOpen(i) ? (LANG === "en" ? x.en : x.ar) : "🔒 " + AR(fragsOf(x.w)) + "/" + AR(3)}</button>`).join("")}</div>
      <label>${L("لون الإكسسوار", "Accessory color")}</label><div class="cols" id="cAcc">${sw("a", lk.accCol)}</div>
      <label>${L("اللغة", "Language")}</label><div class="langs"><button class="btn ${LANG === "ar" ? "on" : ""}" id="lAr">العربية</button><button class="btn ${LANG === "en" ? "on" : ""}" id="lEn">English</button></div>
    </div></div><div class="row" style="margin-top:14px"><button class="btn pri" id="pOk">${L("حفظ", "Save")}</button>${Save.d.profile ? `<button class="btn danger" id="pDel">🗑 ${L("حذف الحساب", "Delete account")}</button>` : ""}</div>`;
    const pv = $("#pv"), g = pv.getContext("2d"), my = ++this._bic, sts = ["idle", "idle", "jump", "roll", "success"];
    const lp = () => { if (this._bic !== my || !document.body.contains(pv)) return; const t = performance.now() / 1000, st = sts[Math.floor(t / 2.2) % sts.length]; g.clearRect(0, 0, 340, 360); const gr = g.createRadialGradient(170, 210, 20, 170, 210, 170); gr.addColorStop(0, "#3a2f9a"); gr.addColorStop(1, "rgba(23,28,79,0)"); g.fillStyle = gr; g.fillRect(0, 0, 340, 360);
      Robo.draw(g, Object.assign({}, lk, { acc: accOpen(lk.acc) ? lk.acc : 0 }), st, Robo.frame(st, t), Robo.cx(170, 330), 330 - (st === "jump" ? Math.abs(Math.sin(t * 3)) * 30 : 0), 330, true, 0, t); requestAnimationFrame(lp); }; lp();
    $$(".cs.b").forEach(b => b.onclick = () => { lk.body = +b.dataset.i; $$(".cs.b").forEach(x => x.classList.toggle("on", x === b)); SFX.click(); });
    $$(".cs.a").forEach(b => b.onclick = () => { lk.accCol = +b.dataset.i; $$(".cs.a").forEach(x => x.classList.toggle("on", x === b)); SFX.click(); });
    $$(".ac").forEach(b => b.onclick = () => { const k = +b.dataset.i; if (!accOpen(k)) { this.toast(L(`اجمعي شظايا الذاكرة الثلاث 💎 في عالم ${wt(WORLDS[ACCS[k].w], "name")} لتفتحي ${ACCS[k].ar}.`, `Collect the 3 memory shards 💎 in ${wt(WORLDS[ACCS[k].w], "name")} to unlock the ${ACCS[k].en}.`)); return; } lk.acc = k; $$(".ac").forEach(x => x.classList.toggle("on", x === b)); SFX.click(); });
    const setLang = l => { const nm = $("#pName").value; Save.d.look = lk; LANG = l; Save.d.lang = l; Save.save(); this.profile(done); $("#pName").value = nm; };
    $("#lAr").onclick = () => setLang("ar"); $("#lEn").onclick = () => setLang("en");
    if ($("#pDel")) $("#pDel").onclick = () => { SFX.click(); this.modal(`<h3>${L("حذف الحساب نهائيًا؟", "Delete your account for good?")}</h3><p>${L("سيُحذف كل شيء: اسمك وشكل ذرّة ونجومك وتقدمك وبطاقات كتاب الذاكرة. لا يمكن التراجع.", "Everything will be erased: your name, Zarra's look, stars, progress and Memory Book cards. This can't be undone.")}</p><div class="row"><button class="btn danger" id="dY">${L("نعم، احذفي كل شيء", "Yes, delete everything")}</button><button class="btn" id="dN">${L("إلغاء", "Cancel")}</button></div>`);
      $("#dN").onclick = () => this.closeModal(); $("#dY").onclick = () => { Save.wipe(); this.closeModal(); this.applyLang(); SFX.music("menu"); this.menu(); this.toast(L("حُذف الحساب. ابدئي من جديد!", "Account deleted. Start fresh!")); }; };
    $("#pOk").onclick = () => { const n = $("#pName").value.trim(); if (!n) { this.toast(L("اكتبي اسمك أولًا.", "Please type your name first.")); $("#pName").focus(); return; } Save.d.profile = { name: n.slice(0, 14), av: 0 }; Save.d.look = lk; Save.save(); SFX.click(); done(); };
  },
  /* ---------- اللعب الجماعي ---------- */
  team() {
    this.show("team"); SFX.music("menu");
    $("#team").innerHTML = `<h2>👥 ${L("العب مع صديقاتك", "Play with friends")} <span class="beta">${L("تجريبي", "beta")}</span></h2>
      <p class="tsub">${L("حتى ٣ لاعبات، كل وحدة من جهازها، في خريطة أوسع. تعاونّ: تقسّمن المهام وتتفادين الوحش معًا!", "Up to 3 players, each on her own device, in a wider map. Team up: split the tasks and dodge the monster together!")}</p>
      <div class="tcards"><div class="tcard"><div class="ti">🏠</div><h3>${L("أنشئي غرفة", "Create a room")}</h3><p>${L("تحصلين على كود ترسلينه لصديقاتك.", "You get a code to send to your friends.")}</p><button class="btn pri" id="tCreate">${L("أنشئي الغرفة", "Create room")}</button></div>
      <div class="tcard"><div class="ti">🔑</div><h3>${L("انضمي بكود", "Join with a code")}</h3><input type="text" id="tCode" maxlength="5" placeholder="K7Q2M" autocomplete="off"><button class="btn pri" id="tJoin">${L("انضمي", "Join")}</button></div></div>
      <div class="tstatus" id="tStatus"></div><p class="tnote">${L("يحتاج إنترنت. التقدم والنجوم في هذا الوضع لا تُحفظ في حسابك.", "Needs internet. Progress and stars in this mode aren't saved to your account.")}</p>
      <div class="row"><button class="btn" id="tBack">${L("القائمة", "Menu")}</button></div>`;
    $("#tCreate").onclick = () => { SFX.click(); Net.create(); };
    $("#tJoin").onclick = () => { SFX.click(); Net.join($("#tCode").value); };
    $("#tCode").addEventListener("keydown", e => { if (e.key === "Enter") $("#tJoin").click(); e.stopPropagation(); });
    $("#tCode").addEventListener("input", e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""); });
    $("#tBack").onclick = () => { Net.reset(); this.menu(); };
  },
  teamStatus(msg, bad) { const e = $("#tStatus"); if (!e) { this.toast(msg); return; } e.textContent = msg; e.className = "tstatus " + (bad ? "bad" : "ok"); },
  teamLobby() {
    this.show("team"); Eng.team = false; const host = Net.host, L3 = Net.lobby, sel = Net.sel || { wi: 0, si: 0 };
    const slots = [0, 1, 2].map(i => { const p = L3[i]; return p ? `<div class="slot ${i === (host ? 0 : Net.you) ? "mine" : ""}"><canvas class="slotcv" data-i="${i}" width="220" height="220"></canvas><b>${String(p.name).replace(/[<>&"]/g, "")}</b><span>${i === 0 ? "👑 " + L("المضيفة", "Host") : ""}${i === (host ? 0 : Net.you) ? (i === 0 ? " · " : "") + L("أنتِ", "You") : ""}</span></div>`
      : `<div class="slot empty"><div class="q">+</div><b>${L("بانتظار لاعبة…", "Waiting for a player…")}</b><span>${L("أرسلي لها الكود", "Send her the code")}</span></div>`; }).join("");
    const stName = (wi, si) => `${wt(WORLDS[wi], "name")} · ${WORLDS[wi].stages[si].boss ? L("الوحش", "Boss") : L("مرحلة", "Stage") + " " + AR(si + 1)}`;
    $("#team").innerHTML = `<h2>👥 ${L("غرفة الفريق", "Team room")} <span class="beta">${L("تجريبي", "beta")}</span></h2>
      <div class="roomcode"><small>${L("كود الغرفة", "Room code")}</small><b>${Net.room}</b>${host ? `<button class="btn small" id="tCopy">📋 ${L("نسخ", "Copy")}</button>` : ""}</div>
      <div class="slots">${slots}</div>
      ${host ? `<div class="pick"><div class="prow">${WORLDS.map((w, i) => `<button class="chipb w ${i === sel.wi ? "on" : ""}" data-w="${i}" style="--c:${w.color}">${wt(w, "name")}</button>`).join("")}</div>
        <div class="prow">${WORLDS[sel.wi].stages.map((s, i) => `<button class="chipb s ${i === sel.si ? "on" : ""} ${s.boss ? "boss" : ""}" data-s="${i}">${s.boss ? "👾 " + L("الوحش", "Boss") : L("مرحلة", "Stage") + " " + AR(i + 1)}</button>`).join("")}</div></div>
        <div class="row"><button class="btn pri" id="tStart">▶ ${L("ابدئي اللعب", "Start")} (${AR(L3.length)}/${AR(3)})</button><button class="btn" id="tLeave">${L("إغلاق الغرفة", "Close room")}</button></div>`
      : `<p class="twait">⏳ ${L("بانتظار المضيفة لتبدأ…", "Waiting for the host to start…")} <b>${stName(sel.wi, sel.si)}</b></p><div class="row"><button class="btn" id="tLeave">${L("خروج من الغرفة", "Leave room")}</button></div>`}
      <div class="tstatus" id="tStatus"></div>`;
    const my = ++this._bic, cvs = $$(".slotcv"), lp = () => { if (this._bic !== my || !cvs.length || !document.body.contains(cvs[0])) return; const t = performance.now() / 1000;
      cvs.forEach(cv => { const g = cv.getContext("2d"), p = L3[+cv.dataset.i]; if (!p) return; g.clearRect(0, 0, 220, 220); const st = ["idle", "idle", "success", "idle"][Math.floor(t / 1.8 + +cv.dataset.i) % 4]; Robo.draw(g, p.look || { body: 0, acc: 0, accCol: 8 }, st, Robo.frame(st, t + +cv.dataset.i), Robo.cx(110, 255), 212, 255, true, 0, t); }); requestAnimationFrame(lp); }; lp();
    if (host) {
      $("#tCopy").onclick = () => { try { navigator.clipboard.writeText(Net.room); this.toast(L("نُسخ الكود ✔", "Code copied ✔")); } catch (e) { } };
      $$(".chipb.w").forEach(b => b.onclick = () => { Net.sel = { wi: +b.dataset.w, si: 0 }; SFX.click(); Net.pushLobby(); });
      $$(".chipb.s").forEach(b => b.onclick = () => { Net.sel = { wi: Net.sel.wi, si: +b.dataset.s }; SFX.click(); Net.pushLobby(); });
      $("#tStart").onclick = () => { SFX.click(); Net.start(Net.sel.wi, Net.sel.si); };
    }
    $("#tLeave").onclick = () => Net.leave();
  },
  teamGuestPlay(wi) {
    ["menu", "worlds", "stages", "profile", "book", "team"].forEach(s => $("#" + s).classList.add("hidden")); $("#hud").classList.remove("hidden"); this.closeModal();
    Eng.team = true; Eng.T = null; Eng.parts = []; Eng.fx = []; SFX.music(wi);
  },
  teamExit(fromPause) {
    if (Net.host) { this.modal(`<h3>${L("الرجوع لغرفة الفريق؟", "Back to the team room?")}</h3><p>${L("ستنتهي المرحلة الحالية للجميع.", "The current stage will end for everyone.")}</p><div class="row"><button class="btn pri" id="xY">${L("نعم", "Yes")}</button><button class="btn" id="xN">${L("إلغاء", "Cancel")}</button></div>`); $("#xY").onclick = () => { this.closeModal(); Net.toLobby(); }; $("#xN").onclick = () => this.closeModal(); }
    else { this.modal(`<h3>${L("الخروج من الغرفة؟", "Leave the room?")}</h3><div class="row"><button class="btn pri" id="xY">${L("خروج", "Leave")}</button><button class="btn" id="xN">${L("إلغاء", "Cancel")}</button></div>`); $("#xY").onclick = () => { this.closeModal(); Net.leave(); }; $("#xN").onclick = () => this.closeModal(); }
  },
  worldStars(w) { return w.stages.reduce((a, _, i) => a + Save.stars(`${w.id - 1}-${i}`), 0); },
  unlockedWorld(wi) { return this.unlockAll || wi === 0 || WORLDS[wi - 1].stages.every((_, i) => Save.stars(`${wi - 1}-${i}`) > 0); },
  worlds() {
    this.show("worlds");
    $("#worlds").innerHTML = `<h2>${L("اختاري عالمًا", "Choose a world")}</h2><div class="cards">${WORLDS.map((w, i) => { const ul = this.unlockedWorld(i), st = this.worldStars(w);
      return `<div class="card ${ul ? "" : "lock"}" data-i="${i}" style="background-image:url(assets/img/${w.bg}.png)"><div class="sh"></div>${ul ? "" : `<img class="lk" src="assets/ui/lock.png" alt="">`}<div class="in"><img src="assets/ui/${w.law === "memory" ? "law_memory" : LAWS[w.law].icon}.png" alt=""><h3>${AR(w.id)}. ${wt(w, "name")}</h3><small>${wt(w, "sub")}</small><div class="st">★ ${AR(st)} / ${AR(w.stages.length * 3)} &nbsp; 💎 ${AR(fragsOf(i))}/${AR(3)}</div></div></div>`; }).join("")}</div><div class="row" style="margin-top:34px"><button class="btn" id="wBack">${L("القائمة", "Menu")}</button></div>`;
    $$(".card").forEach(c => c.onclick = () => { const i = +c.dataset.i; if (!this.unlockedWorld(i)) { this.toast(L("أنهي مراحل العالم السابق أولًا.", "Finish the previous world first.")); return; } SFX.click(); this.stages(i); });
    $("#wBack").onclick = () => this.menu();
  },
  stages(wi) {
    this.show("stages"); const w = WORLDS[wi];
    $("#stages").innerHTML = `<h2>${AR(w.id)}. ${wt(w, "name")}</h2><p style="font-size:28px;max-width:900px;text-align:center;opacity:.9">${wt(w, "intro")}</p><div class="stagebtns">${w.stages.map((st, i) => { const s = Save.stars(`${wi}-${i}`), ul = this.unlockAll || i === 0 || Save.stars(`${wi}-${i - 1}`) > 0;
      return `<div class="sb ${ul ? "" : "lock"} ${st.boss ? "boss" : ""}" data-i="${i}">${st.boss ? `<canvas class="bossic" width="200" height="192"></canvas>` : ul ? `<b>${AR(i + 1)}</b>` : `<img src="assets/ui/lock.png" alt="">`}<div class="s">${"★".repeat(s)}<span style="opacity:.3">${"★".repeat(3 - s)}</span></div>${st.boss ? (ul ? L("الوحش!", "Boss!") : "🔒 " + L("الوحش", "Boss")) : L("مرحلة", "Stage")}</div>`; }).join("")}</div><div class="row" style="gap:16px"><button class="btn" id="sChal">🏁 ${L("تحدّي الصديقات", "Challenge friends")}</button>${wi < 3 ? `<button class="btn ${this.worldDone(wi) ? "" : "lockb"}" id="sLab">🧪 ${L("المختبر الحر", "Free lab")}</button>` : ""}<button class="btn" id="sBack">${L("رجوع", "Back")}</button></div>`;
    const bc = $(".bossic"); if (bc) { const g = bc.getContext("2d"), my = ++this._bic, cl = !$(".sb.boss").classList.contains("lock"), loop = () => { if (this._bic !== my || !document.body.contains(bc)) return; g.clearRect(0, 0, 200, 192); g.globalAlpha = cl ? 1 : .45; Boss.monster(g, 100, 104, 46, BOSS_COL[wi], { t: performance.now() / 1000, look: { x: 100, y: 200 } }); requestAnimationFrame(loop); }; loop(); }
    $$(".sb").forEach(b => b.onclick = () => { const i = +b.dataset.i; if (b.classList.contains("lock")) { this.toast(L("أنهي المرحلة السابقة أولًا.", "Finish the previous stage first.")); return; } SFX.click(); this.play(wi, i); });
    $("#sBack").onclick = () => this.worlds(); $("#sChal").onclick = () => { SFX.click(); this.challenge(wi); };
    if ($("#sLab")) $("#sLab").onclick = () => { if (!this.worldDone(wi) && !this.unlockAll) { this.toast(L("ينفتح المختبر الحر بعد إنهاء مراحل هذا العالم الثلاث.", "The free lab unlocks after you finish this world's three stages.")); return; } SFX.click(); this.play(wi, 0, { lab: true }); };
  },
  worldDone(wi) { return [0, 1, 2].every(i => Save.stars(`${wi}-${i}`) > 0); },
  challenge(wi) {
    const mk = () => Array.from({ length: 4 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
    this.modal(`<h3>🏁 ${L("تحدّي الصديقات", "Challenge your friends")}</h3><p>${L("كل من يلعب بالكود نفسه يحصل على القيم المخفية نفسها بالضبط. أرسلي الكود لصديقاتك، ومن تنهي بطاقة أكثر تفوز، والتعادل يحسمه الوقت.", "Everyone who plays with the same code gets exactly the same hidden values. Send the code to your friends: whoever finishes with more energy wins, and time breaks ties.")}</p>
      <input type="text" id="cCode" maxlength="6" value="${mk()}" style="font:800 46px Cairo;width:300px;text-align:center;letter-spacing:8px;padding:8px;border-radius:18px;border:3px solid #FFC83D;background:#141a42;color:#FFE08A;direction:ltr;user-select:text"> <button class="btn small" id="cNew">🎲 ${L("كود جديد", "New code")}</button>
      <p style="margin-top:16px">${L("اختاري المرحلة:", "Pick a stage:")}</p><div class="row">${[0, 1, 2].map(i => { const ul = this.unlockAll || i === 0 || Save.stars(`${wi}-${i - 1}`) > 0; return `<button class="btn ${ul ? "pri" : "lockb"}" data-s="${i}">${L("مرحلة", "Stage")} ${AR(i + 1)}</button>`; }).join("")}</div><div class="row"><button class="btn small" id="cX">${L("إلغاء", "Cancel")}</button></div>`);
    $("#cNew").onclick = () => { $("#cCode").value = mk(); SFX.click(); }; $("#cX").onclick = () => this.closeModal();
    $$("[data-s]").forEach(b => b.onclick = () => { if (b.classList.contains("lockb")) { this.toast(L("أنهي المرحلة السابقة أولًا.", "Finish the previous stage first.")); return; }
      const code = $("#cCode").value.toUpperCase().replace(/[^A-Z0-9]/g, ""); if (code.length < 3) { this.toast(L("اكتبي كودًا من ٣ أحرف على الأقل.", "Type a code of at least 3 characters.")); return; } this.closeModal(); this.play(wi, +b.dataset.s, { code }); });
  },
  book() {
    this.show("book"); const keys = ["force", "light", "gravity", "memory"], got = k => k === "memory" ? Save.stars("3-2") > 0 : !!Save.d.laws[k];
    $("#book").innerHTML = `<h2>📖 ${L("كتاب ذاكرة الكون", "The Memory Book")}</h2><p style="font-size:24px;opacity:.8;margin:-18px 0 22px">${L(`جمعتِ ${AR(keys.filter(got).length)} من ${AR(4)} بطاقات`, `You collected ${keys.filter(got).length} of 4 cards`)}</p><div class="bk">${keys.map(k => { const B = BOOK[k], t = B[LANG];
      return got(k) ? `<div class="bc"><img src="assets/ui/${B.icon}.png" alt=""><h3>${t.t}</h3><div class="fm">${k === "memory" ? L(B.f, "Measure → Deduce → Act") : B.f}</div><p>${t.d}</p><h4>${L("في حياتك", "In real life")}</h4>${t.ex.map(e => `<div class="ex">${e}</div>`).join("")}</div>`
        : `<div class="bc off"><div class="q">؟</div><p>${k === "memory" ? L("أنهي عالم الذاكرة لتفتحيها.", "Finish the Memory world to unlock.") : L("اكتشفي هذا القانون في اللعب لتفتحي البطاقة.", "Discover this law while playing to unlock it.")}</p></div>`; }).join("")}</div><div class="row" style="margin-top:22px"><button class="btn" id="bkB">${L("القائمة", "Menu")}</button></div>`;
    $("#bkB").onclick = () => this.menu();
  },
  play(wi, si, opts = {}) {
    if (Net.host && Net.live && !opts.team) return Net.start(wi, si);
    ["menu", "worlds", "stages", "profile", "book", "team"].forEach(s => $("#" + s).classList.add("hidden")); $("#hud").classList.remove("hidden"); this.closeModal();
    const isBoss = !opts.lab && WORLDS[wi].stages[si] && WORLDS[wi].stages[si].boss, go = () => { SFX.music(isBoss ? "boss" : wi); Eng.start(wi, si, opts); };
    if (isBoss && !opts.team && !Save.d["boss" + wi]) { Save.d["boss" + wi] = true; Save.save(); this.modal(`<canvas id="bIntro" width="360" height="300" style="width:360px;height:300px"></canvas><h3>${L("المعركة!", "Boss fight!")}</h3><p>${L(BOSS_TXT.intro[0], BOSS_TXT.intro[1])}</p><div class="row"><button class="btn pri" id="gx">${L("لنهزمه!", "Let's beat it!")}</button></div>`);
      const bi = $("#bIntro"), g = bi.getContext("2d"), loop = () => { if (!document.body.contains(bi)) return; g.clearRect(0, 0, 360, 300); Boss.monster(g, 180, 170, 62, BOSS_COL[wi], { t: performance.now() / 1000, look: { x: 180, y: 320 }, wind: (performance.now() / 1000 % 3) > 2.2 ? .8 : 0 }); requestAnimationFrame(loop); }; loop(); SFX.roar();
      $("#gx").onclick = () => { this.closeModal(); go(); }; return; }
    if (si === 0 && !opts.team && !Save.d["seen" + wi]) { Save.d["seen" + wi] = true; Save.save(); const w = WORLDS[wi];
      this.modal(`<h3>${L("عالم", "World:")} ${wt(w, "name")}</h3><p>${wt(w, "intro")}</p><p style="font-size:26px;color:#9fb0ff">${L(`لديك ${AR(ENERGY_MAX)} وحدات طاقة. الاستنتاج الخاطئ يكلّف ٢، والمحاولة الفاشلة تكلّف ١. حرّكي ذرّة بالأسهم ← → واقفزي بـ ↑ (أو A وD وW)، والمسي البطاريات لجمعها (+٣).`, `You have ${AR(ENERGY_MAX)} energy units. A wrong deduction costs 2, a failed attempt costs 1. Move Zarra with the arrow keys ← → and jump with ↑ (or A, D, W), and touch batteries to collect them (+3).`)}<br>${[L("في هذا العالم: اضغطي مطوّلًا على «جرّبي» لتشحني قوة الدفع، ثم اتركي ليدفع ذرّة الصندوق.", "In this world: press and hold Try to charge the push force, then release so Zarra pushes the crate."), L("في هذا العالم: امشي إلى المرآة واضغطي ↓ لتمسكيها، ثم دوّريها بـ ← →.", "In this world: walk to the mirror and press ↓ to grab it, then rotate it with ← →."), L("في هذا العالم: اسحبي المسبار للخلف بالفأرة مثل المقلاع ثم اتركيه.", "In this world: pull the probe back with the mouse like a slingshot, then let go."), L("في هذا العالم: كل الحركات السابقة معًا!", "In this world: all the previous moves together!")][wi]}</p><div class="row"><button class="btn pri" id="gx">${L("هيا", "Go")}</button></div>`);
      $("#gx").onclick = () => { this.closeModal(); go(); }; } else go();
  },
  /* ---------- HUD ---------- */
  onPhase() {
    const w = Eng.w, ph = Eng.phase, multi = Eng.tasks.length > 1;
    $("#title").textContent = Eng.sandbox ? `🧪 ${L("المختبر الحر", "Free lab")} · ${wt(w, "name")}` : `${wt(w, "name")} · ${AR(Eng.si + 1)}${multi ? ` (${AR(Eng.ti + 1)}/${AR(Eng.tasks.length)})` : ""}${Eng.code ? ` · 🏁 ${Eng.code}` : ""}`;
    $("#chips").style.display = Eng.sandbox || Eng.boss ? "none" : "";
    const order = ["measure", "deduce", "act"], names = { measure: L("قِس", "Measure"), deduce: L("استنتج", "Deduce"), act: L("تصرّف", "Act") }, cur = ph === "law" ? -1 : ph === "measure" ? 0 : 1 + (ph === "act") * 1;
    $("#chips").innerHTML = order.map((p, i) => `<div class="chip ${i === cur ? "on" : i < cur ? "done" : ""}">${names[p]}</div>`).join("");
    this.energy(); this.buildSliders(); this.panel(); this.controls();
    $("#goal").style.display = ph === "act" ? "" : "none"; $("#goal").textContent = Eng.T.goal;
    if (ph === "law") this.lawModal();
    if (Eng.boss && ph === "act") this.toast(Eng.K.scene === "force" ? L("احسبي القوة F = m × a ثم ادفعي الصندوق نحو الوحش!", "Compute F = m × a, then push the crate at the monster!") : Eng.K.scene === "light" ? L("أمسكي المرآة ↓ ووجّهي الشعاع إلى عين الوحش!", "Grab the mirror ↓ and aim the beam at the monster's eye!") : L("احسبي السرعة من Δθ = 20 × M ÷ v² ثم أطلقي المسبار على الوحش!", "Compute the speed from Δθ = 20 × M ÷ v², then launch the probe at the monster!"));
    else if (ph === "measure" || Eng.sandbox) this.toast(Eng.K.scene === "force" ? L("اضغطي مطوّلًا على «جرّبي» لتشحني القوة ثم اتركي، أو اختاري القوة من المنزلق.", "Hold Try to charge the force then release, or pick the force on the slider.") : Eng.K.scene === "light" ? L("امشي إلى المرآة واضغطي ↓ ثم دوّريها بـ ← →، ثم «جرّبي».", "Walk to the mirror, press ↓ and rotate it with ← →, then press Try.") : L("اسحبي المسبار للخلف واتركيه: كلما سحبتِ أكثر زادت سرعته.", "Pull the probe back and let go: the further you pull, the faster it flies."));
  },
  energy() { if (Eng.sandbox) { $("#energy").innerHTML = `<span style="font-size:34px">∞ ${L("طاقة", "energy")}</span>`; $("#energy").classList.remove("low"); return; } let h = ""; for (let i = 0; i < ENERGY_MAX; i++) h += `<div class="ec ${i < Eng.energy ? "" : "off"}"></div>`; $("#energy").innerHTML = h + `<span>${AR(Eng.energy)}</span>`; $("#energy").classList.toggle("low", Eng.energy <= 3); },
  buildSliders() {
    const T = Eng.T, ph = Eng.phase, n = ph === "act" ? T.sliders.length : 1;
    $("#sliders").innerHTML = T.sliders.slice(0, n).map((s, i) => `<div class="sl"><label><span>${s.label}</span><b id="sv${i}">${AR(T.vals[i])}</b></label><input type="range" tabindex="-1" id="sr${i}" min="${s.min}" max="${s.max}" step="${s.step}" value="${T.vals[i]}"></div>`).join("");
    T.sliders.slice(0, n).forEach((s, i) => { const r = $("#sr" + i); r.oninput = () => { if (Net.guest) Net.send(Net.conn, { t: "act", fn: "val", a: [i, +r.value] }); T.vals[i] = +r.value; if (s.key) T[s.key] = T.vals[i]; $("#sv" + i).textContent = AR(T.vals[i]); SFX.tick(); if (Eng.K.scene === "light") { T.beam = null; T.mirrors[i].phi = T.vals[i]; } if (Eng.K.scene === "gravity") T.trail = null; }; });
  },
  syncSlider(i) { const r = $("#sr" + i), v = $("#sv" + i); if (r) r.value = Eng.T.vals[i]; if (v) v.textContent = AR(Eng.T.vals[i]); },
  panel() {
    const p = $("#panel"), K = Eng.K, rows = Eng.rows; p.className = K.panel; p.style.display = Eng.phase === "law" || Eng.boss ? "none" : "";
    const pf = Eng.phase === "act" && !Eng.sandbox && K.proof && rows.length && rows[0].raw;
    p.innerHTML = `<h4>${L("جدول القياسات", "Measurements")}</h4><table><tr>${K.cols.map(c => `<th>${c}</th>`).join("")}${pf ? `<th class="pf">${K.proof.h}</th>` : ""}</tr>${rows.slice(-4).map(r => `<tr>${r.cells.map(c => `<td>${c}</td>`).join("")}${pf ? `<td class="pf">${AR2(K.proof.f(r.raw))}</td>` : ""}</tr>`).join("")}</table>${pf ? `<div class="pfn">${L(Eng.K.scene === "force" ? "✔ النسبة ثابتة = كتلة الصندوق" : "✔ الناتج ثابت في كل القياسات", Eng.K.scene === "force" ? "✔ The ratio is constant = the crate's mass" : "✔ The product is the same in every reading")}</div>` : ""}${rows.length ? "" : `<div class="empty">${L("لا قياسات بعد.", "No readings yet.")}</div>`}`;
  },
  controls() {
    const ph = Eng.phase, busy = Eng.K && Eng.T && Eng.K.busy(Eng.T);
    $("#bTest").style.display = ph === "measure" ? "" : "none"; $("#bDeduce").style.display = ph === "measure" ? "" : "none"; $("#bAct").style.display = ph === "act" ? "" : "none";
    $("#bTest").disabled = busy; $("#bDeduce").disabled = busy || !Eng.canDeduce(); $("#bAct").disabled = busy;
    $("#bAct").textContent = Eng.K.scene === "force" ? L("ادفعي", "Push") : Eng.K.scene === "light" ? L("أطلقي الشعاع", "Fire beam") : L("أطلقي المسبار", "Launch probe"); $("#bDeduce").textContent = L("ثبّتي الاستنتاج", "Lock deduction");
    $("#bTest").textContent = Eng.K.scene === "gravity" ? L("أطلقي تجريبيًا", "Test launch") : L("جرّبي", "Try");
    $("#controls").style.display = ph === "law" ? "none" : "";
  },
  /* ---------- النوافذ ---------- */
  modal(html) { const m = $("#modal"); m.innerHTML = `<div class="mbox">${KB(html)}</div>`; m.classList.remove("hidden"); },
  closeModal() { $("#modal").classList.add("hidden"); $("#modal").innerHTML = ""; if (Eng.robot.hold > 50) Eng.robot.hold = .1; },
  toast(t) { const e = $("#toast"); e.textContent = KB(t); e.classList.add("on"); clearTimeout(this._tt); this._tt = setTimeout(() => e.classList.remove("on"), 3200); },
  lawModal() {
    this.modal(`<h3>${L("أي قانون تحتاجين؟", "Which law do you need?")}</h3><p>${L("انظري إلى المشهد واختاري القانون المناسب لهذه المهمة.", "Look at the scene and pick the right law for this task.")}</p><div class="laws">${["force", "light", "gravity"].map(k => `<button class="lw" data-k="${k}"><img src="assets/ui/${LAWS[k].icon}.png" alt="">${k === "force" ? L("القوة والحركة", "Force & motion") : k === "light" ? L("انعكاس الضوء", "Reflection") : L("الجاذبية", "Gravity")}</button>`).join("")}</div>`);
    $$(".lw").forEach(b => b.onclick = () => { SFX.click(); if (b.dataset.k === Eng.tasks[Eng.ti].kind) this.closeModal(); Eng.chooseLaw(b.dataset.k); });
  },
  deduceModal(o) {
    this.modal(`<h3>${L("استنتجي", "Deduce")}</h3><p>${o.q}</p><div class="opts">${shuffle(o.opts).map((x, i) => `<button class="opt" data-i="${i}">${x.t}</button>`).join("")}</div><div class="row"><button class="btn small" id="dx">${L("عودة للقياس", "Back to measuring")}</button></div>`);
    const list = $$(".opt"), map = {}; list.forEach(b => map[b.textContent] = b);
    list.forEach(b => b.onclick = () => { SFX.click(); Eng.answer(o.opts.find(x => x.t === b.textContent)); });
    $("#dx").onclick = () => { this.closeModal(); Eng.setRobot("idle", .1); };
  },
  wrongAnswer(msg) { this.modal(`<h3>${L("ليس بعد…", "Not yet…")}</h3><div class="bad">${msg}</div><p>${L("خسرتِ ٢ من الطاقة. أعيدي النظر في القياسات.", "You lost 2 energy. Take another look at the readings.")}</p><div class="row"><button class="btn pri" id="wx">${L("حاولي مجددًا", "Try again")}</button></div>`); $("#wx").onclick = () => { this.closeModal(); if (Eng.phase !== "done") { Eng.setRobot("idle", .1); Eng.deduce(); } }; if (Eng.phase === "done") $("#modal").classList.add("hidden"); },
  lawReveal(kind, fresh) { this.toast(L("✦ اكتشفتِ: ", "✦ You discovered: ") + lw(kind, "short") + (fresh ? L(" · 📖 بطاقة جديدة في كتاب الذاكرة!", " · 📖 New card in the Memory Book!") : "")); },
  hintModal(t, free, arch) { this.modal(`<h3>${arch ? "🖥️ " + L("أرشيف الذاكرة", "Memory Archive") : L("تلميح", "Hint")}</h3><p>${t}</p><p style="font-size:22px;opacity:.7">${free ? L("هذا التلميح مجاني.", "This hint is free.") : L("كلّف التلميح وحدة طاقة.", "The hint cost 1 energy.")}</p><div class="row"><button class="btn pri" id="hx">${L("فهمت", "Got it")}</button></div>`); $("#hx").onclick = () => this.closeModal(); },
  pause() { if (Eng.phase === "idle") return; this.modal(`<h3>${L("إيقاف مؤقت", "Paused")}</h3><div class="row"><button class="btn pri" id="p1">${L("متابعة", "Resume")}</button><button class="btn" id="p2">${L("إعادة المرحلة", "Restart stage")}</button><button class="btn" id="p3">${L("المراحل", "Stages")}</button><button class="btn" id="p4">${SFX.on ? "🔊" : "🔇"} ${L("الصوت", "Sound")}</button></div>`);
    $("#p1").onclick = () => this.closeModal(); $("#p2").onclick = () => { this.closeModal(); if (Eng.team) { if (Net.host) Net.start(Eng.wi, Eng.si); return; } Eng.start(Eng.wi, Eng.si, { code: Eng.code, lab: Eng.sandbox }); }; $("#p3").onclick = () => { this.closeModal(); if (Eng.team) return this.teamExit(true); this.stages(Eng.wi); };
    $("#p4").onclick = () => { SFX.toggle(); Save.d.sound = SFX.on; Save.save(); this.pause(); }; },
  winModal(stars) { $("#toast").classList.remove("on");
    const w = Eng.w, LW = w.id === 4 ? null : w.law, hasNext = Eng.si < w.stages.length - 1, lastWorld = Eng.wi === 3 && Eng.si === w.stages.length - 1, bossWin = Eng.boss;
    this.modal(`<h3>${bossWin ? (lastWorld ? L("هزمتِ المُشتِّت واستعدتِ ذاكرة الكون! 🎉", "You beat the Scatterer and restored the Memory of the Universe! 🎉") : L("هزمتِ المُشتِّت! 💥", "You beat the Scatterer! 💥")) : lastWorld ? L("استعدتِ ذاكرة الكون! 🎉", "You restored the Memory of the Universe! 🎉") : L("أحسنتِ!", "Well done!")}</h3><div class="stars">${[1, 2, 3].map(i => `<img src="assets/ui/${i <= stars ? "star" : "star0"}.png" alt="">`).join("")}</div><p>${LW ? `<b style="color:#FFE08A">${lw(LW, "name")}</b><br>${lw(LW, "text")}` : L("جمعتِ القوانين كلها في الذاكرة.", "You gathered all the laws into the Memory.")}</p>${Eng.lastSol ? `<div class="solv">✔ ${L("الحل", "Solution")}: ${Eng.lastSol}</div>` : ""}<p style="font-size:24px;opacity:.8">${L("الطاقة المتبقية: ", "Energy left: ")}${AR(Eng.energy)}</p>${Eng.code ? (() => { const s = Math.round((performance.now() - Eng.t0) / 1000), tm = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; return `<div class="chal">🏁 ${L("كود التحدي", "Challenge code")}: <b>${Eng.code}</b> · ⚡ ${AR(Eng.energy)} · ⏱ ${tm}<br><small>${L("أرسلي الكود لصديقاتك وقارنّ النتائج!", "Send the code to your friends and compare scores!")}</small></div>`; })() : ""}<div class="row">${hasNext ? `<button class="btn pri" id="n1">${L("المرحلة التالية", "Next stage")}</button>` : `<button class="btn pri" id="n1">${Eng.wi < 3 ? L("العالم التالي", "Next world") : L("القائمة", "Menu")}</button>`}<button class="btn" id="n2">${L("إعادة", "Replay")}</button><button class="btn" id="n3">${L("المراحل", "Stages")}</button></div>`);
    $("#n1").onclick = () => { this.closeModal(); if (hasNext) this.play(Eng.wi, Eng.si + 1); else if (Eng.team) { if (Eng.wi < 3) Net.start(Eng.wi + 1, 0); else Net.toLobby(); } else if (Eng.wi < 3) this.stages(Eng.wi + 1); else this.menu(); };
    if (Eng.team) { $("#n3").textContent = "👥 " + L("غرفة الفريق", "Team room"); }
    $("#n2").onclick = () => { this.closeModal(); this.play(Eng.wi, Eng.si, { code: Eng.code }); }; $("#n3").onclick = () => { this.closeModal(); if (Eng.team) return Net.toLobby(); this.stages(Eng.wi); };
  },
  loseModal() { $("#toast").classList.remove("on"); const free = Eng.losses >= 2; this.modal(`<h3>${L("نفدت الطاقة", "Out of energy")}</h3><p>${L("ذرّة تحتاج إلى إعادة شحن. جرّبي من جديد، فالقيم تتغيّر في كل مرة.", "Zarra needs a recharge. Try again, the values change every time.")}${free ? "<br>" + L("التلميحات صارت مجانية الآن.", "Hints are free now.") : ""}</p><div class="row"><button class="btn pri" id="l1">${L("إعادة المحاولة", "Try again")}</button><button class="btn" id="l2">${L("المراحل", "Stages")}</button></div>`);
    $("#l1").onclick = () => { this.closeModal(); this.play(Eng.wi, Eng.si, { code: Eng.code }); }; $("#l2").onclick = () => { this.closeModal(); if (Eng.team) return Net.toLobby(); this.stages(Eng.wi); }; if (Eng.team) $("#l2").textContent = "👥 " + L("غرفة الفريق", "Team room"); },
  async init() {
    Save.load(); this.applyLang(); this.fit(); addEventListener("resize", () => this.fit()); await loadImages();
    const cv = $("#cv"), P = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / this.scale + Eng.camX, (e.clientY - r.top) / this.scale]; };
    cv.addEventListener("pointerdown", e => { cv.setPointerCapture && cv.setPointerCapture(e.pointerId); Eng.pointer("down", ...P(e)); });
    cv.addEventListener("pointermove", e => Eng.pointer("move", ...P(e))); cv.addEventListener("pointerup", e => Eng.pointer("up", ...P(e))); cv.addEventListener("pointercancel", () => { Eng.drag = null; });
    ["bTest", "bAct"].forEach(id => { const b = $("#" + id); b.addEventListener("pointerdown", e => { e.preventDefault(); Eng.pressStart(); }); b.addEventListener("pointerup", () => Eng.pressEnd()); b.addEventListener("pointerleave", () => { if (Eng.charge) Eng.pressEnd(); }); });
    $("#bDeduce").onclick = () => Eng.deduce();
    $("#bHint").onclick = () => Eng.hint(); $("#bPause").onclick = () => this.pause(); $("#bBack").onclick = () => { if (Eng.team) return this.teamExit(); this.stages(Eng.wi); }; $("#bSound").onclick = () => { SFX.toggle(); Save.d.sound = SFX.on; Save.save(); $("#bSound img").src = `assets/ui/sound_${SFX.on ? "on" : "off"}.png`; };
    addEventListener("pointerdown", () => { SFX.unlock(); if (SFX.on && !SFX.mus) SFX.music(SFX.key || "menu"); }, { once: false });
    const KM = { ArrowLeft: "l", a: "l", A: "l", ArrowRight: "r", d: "r", D: "r", ArrowUp: "j", w: "j", W: "j", " ": "j", ArrowDown: "g", s: "g", S: "g" };
    addEventListener("keydown", e => { if ($("#hud").classList.contains("hidden") || e.target.tagName === "INPUT" && e.target.type === "text") return; if (e.key === "Enter") { e.preventDefault(); if (!e.repeat) Eng.pressStart(); return; } const k = KM[e.key]; if (!k) return; e.preventDefault(); if (k === "g" && e.repeat) return; Eng.keys[k] = 1; Eng.idleT = 0; });
    addEventListener("keyup", e => { if (e.key === "Enter" && !$("#hud").classList.contains("hidden")) { Eng.pressEnd(); return; } const k = KM[e.key]; if (k && k !== "j" && k !== "g") Eng.keys[k] = 0; });
    addEventListener("blur", () => { Eng.keys.l = Eng.keys.r = Eng.keys.j = 0; });
    /* لوحة اللمس: يسار = مشي بالسحب دون رفع الإصبع، يمين = قفز وإمساك (تعمل معًا بإصبعين) */
    const pl = $("#padL"), knob = pl.querySelector(".knob"); let pid = null;
    const steer = e => { const r = pl.getBoundingClientRect(), dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2), d = Math.abs(dx) < .12 ? 0 : dx < 0 ? -1 : 1; Eng.keys.l = d < 0 ? 1 : 0; Eng.keys.r = d > 0 ? 1 : 0; Eng.idleT = 0;
      knob.style.transform = `translateX(${clamp(dx, -1, 1) * 38}%)`; pl.querySelectorAll(".pk").forEach(p => p.classList.toggle("on", (p.dataset.k === "l" && d < 0) || (p.dataset.k === "r" && d > 0))); };
    const stop = () => { pid = null; Eng.keys.l = Eng.keys.r = 0; knob.style.transform = ""; pl.querySelectorAll(".pk").forEach(p => p.classList.remove("on")); pl.classList.remove("act"); };
    pl.addEventListener("pointerdown", e => { e.preventDefault(); pid = e.pointerId; try { pl.setPointerCapture(pid); } catch (x) { } pl.classList.add("act"); steer(e); });
    pl.addEventListener("pointermove", e => { if (e.pointerId === pid) steer(e); });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach(ev => pl.addEventListener(ev, e => { if (e.pointerId === pid) stop(); }));
    [["pJ", "j"], ["pG", "g"]].forEach(([id, k]) => { const b = $("#" + id); b.addEventListener("pointerdown", e => { e.preventDefault(); Eng.keys[k] = 1; Eng.idleT = 0; b.classList.add("on"); }); ["pointerup", "pointercancel", "pointerleave"].forEach(ev => b.addEventListener(ev, () => b.classList.remove("on"))); });
    addEventListener("blur", stop);
    this.menu(); $("#bSound img").src = `assets/ui/sound_${SFX.on ? "on" : "off"}.png`; const c = cv.getContext("2d"); let last = performance.now();
    const padLbl = () => { const g = $("#pG small"), j = $("#pJ small"); if (g) g.textContent = Eng.K && Eng.K.scene === "light" ? L("أمسكي", "Grab") : L("أرشيف", "Archive"); if (j) j.textContent = L("قفز", "Jump"); };
    let padT = 0; const loop = now => { if (now - padT > 500) { padT = now; padLbl(); } const dt = Math.min(.05, (now - last) / 1000); last = now; Eng.update(dt); Net.tick(dt); Eng.draw(c); requestAnimationFrame(loop); }; requestAnimationFrame(loop);
    window.__ready = true;
  }
};
UI.init();
