"use strict";
const Story = {
  cols: ["#E8A33C", "#4CC3D9", "#9B6BFF", "#FF8A5C"], names: ["الثِقل", "المرايا", "المقلاع", "الذاكرة"],
  run(i) { const cv = $("#sc"); if (!cv) return; const c = cv.getContext("2d"), t0 = performance.now(); this.id = (this.id || 0) + 1; const my = this.id;
    const loop = now => { if (this.id !== my || !document.body.contains(cv)) return; this.draw(c, i, (now - t0) / 1000); requestAnimationFrame(loop); }; requestAnimationFrame(loop); },
  glow(c, x, y, r, col, a = 1) { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)"); c.save(); c.globalAlpha = a; c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.restore(); },
  stars(c, t, n = 40) { c.save(); for (let k = 0; k < n; k++) { const x = (k * 97.3) % 960, y = (k * 53.7) % 540, tw = .4 + .6 * Math.abs(Math.sin(t * 1.5 + k)); c.globalAlpha = tw; c.fillStyle = "#fff"; c.fillRect(x, y, 2 + (k % 3), 2 + (k % 3)); } c.restore(); },
  robot(c, st, x, gy, t, w = 230, flip = true) { const n = ROBOT[st], im = IMG[`r_${st}_${(Math.floor(t * 6) % n) + 1}`]; if (!im) return; const h = w * im.height / im.width; c.save(); c.translate(x, gy); if (flip) c.scale(-1, 1); c.drawImage(im, -w / 2, -222 * (w / 300), w, h); c.restore(); },
  draw(c, i, t) {
    c.clearRect(0, 0, 960, 540); const bgn = [3, 1, 4, 4][i]; c.drawImage(IMG["bg" + bgn], 0, 0, 960, 540); c.fillStyle = "rgba(5,8,30,.35)"; c.fillRect(0, 0, 960, 540); this.stars(c, t);
    const lt = t % 7;
    if (i === 0) {
      const cx = 480, cy = 250, ex = Math.min(1, Math.max(0, (lt - 2.2) / 2)), e = ex * ex * (3 - 2 * ex);
      c.save(); c.globalAlpha = 1 - .65 * e; this.glow(c, cx, cy, 230 + Math.sin(t * 3) * 14, "rgba(255,190,70,.8)"); c.drawImage(IMG.core, cx - 120 + (lt > 2 && lt < 2.5 ? Math.sin(t * 90) * 4 : 0), cy - 120 + Math.sin(t * 2) * 6, 240, 240); c.restore();
      const P = [[800, 130], [150, 140], [790, 420], [170, 410]];
      P.forEach((p, k) => { for (let q = 6; q >= 0; q--) { const ee = Math.max(0, e - q * .035), x = cx + (p[0] - cx) * ee, y = cy + (p[1] - cy) * ee - Math.sin(ee * Math.PI) * 60; this.glow(c, x, y, 34 - q * 3 + (e >= 1 ? Math.sin(t * 4 + k) * 4 : 0), this.cols[k], q ? .12 : .95); } });
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
const UI = {
  scale: 1, scr: null, unlockAll: /[?&]unlock=1/.test(location.search),
  show(id) { ["menu", "worlds", "stages"].forEach(s => $("#" + s).classList.toggle("hidden", s !== id)); $("#hud").classList.add("hidden"); this.scr = id; Eng.phase = "idle"; Eng.T = null; if (!id) return; },
  fit() { const s = Math.min(innerWidth / 1600, innerHeight / 900); this.scale = s; $("#stage").style.transform = `scale(${s})`; },
  /* ---------- القوائم ---------- */
  menu() {
    this.show("menu"); SFX.music("menu"); const any = Object.keys(Save.d.stars).length;
    $("#menu").innerHTML = `<img class="logo" src="assets/logo/logo_stacked_dark.png" alt="ذاكرة الكون"><div class="row"><button class="btn pri" id="mPlay">${any ? "تابعي اللعب" : "ابدئي"}</button><button class="btn" id="mStory">القصة</button><button class="btn" id="mSound">${SFX.on ? "🔊 الصوت" : "🔇 الصوت"}</button></div><p>لعبة فيزياء ثنائية الأبعاد: قيسي · استنتجي · تصرّفي</p>`;
    $("#mPlay").onclick = () => { SFX.click(); if (!Save.d.story) this.story(() => this.worlds()); else this.worlds(); };
    $("#mStory").onclick = () => { SFX.click(); this.story(() => this.menu()); };
    $("#mSound").onclick = () => { SFX.toggle(); Save.d.sound = SFX.on; Save.save(); SFX.click(); this.menu(); };
  },
  story(done) {
    let i = 0; const go = () => { const s = STORY[i];
      this.modal(`<canvas id="sc" class="sc" width="960" height="540"></canvas><p>${s.t}</p><div class="row"><button class="btn pri" id="sx">${i < STORY.length - 1 ? "التالي" : "هيا نبدأ"}</button><button class="btn small" id="ss">تخطّي</button></div>`);
      $("#sx").onclick = () => { SFX.click(); if (++i < STORY.length) go(); else fin(); }; $("#ss").onclick = fin; Story.run(i); };
    const fin = () => { Save.d.story = true; Save.save(); this.closeModal(); done(); }; go();
  },
  worldStars(w) { return w.stages.reduce((a, _, i) => a + Save.stars(`${w.id - 1}-${i}`), 0); },
  unlockedWorld(wi) { return this.unlockAll || wi === 0 || WORLDS[wi - 1].stages.every((_, i) => Save.stars(`${wi - 1}-${i}`) > 0); },
  worlds() {
    this.show("worlds");
    $("#worlds").innerHTML = `<h2>اختاري عالمًا</h2><div class="cards">${WORLDS.map((w, i) => { const ul = this.unlockedWorld(i), st = this.worldStars(w);
      return `<div class="card ${ul ? "" : "lock"}" data-i="${i}" style="background-image:url(assets/img/${w.bg}.png)"><div class="sh"></div>${ul ? "" : `<img class="lk" src="assets/ui/lock.png" alt="">`}<div class="in"><img src="assets/ui/${w.law === "memory" ? "law_memory" : LAWS[w.law].icon}.png" alt=""><h3>${AR(w.id)}. ${w.name}</h3><small>${w.sub}</small><div class="st">★ ${AR(st)} / ٩</div></div></div>`; }).join("")}</div><div class="row" style="margin-top:34px"><button class="btn" id="wBack">القائمة</button></div>`;
    $$(".card").forEach(c => c.onclick = () => { const i = +c.dataset.i; if (!this.unlockedWorld(i)) { this.toast("أنهي مراحل العالم السابق أولًا."); return; } SFX.click(); this.stages(i); });
    $("#wBack").onclick = () => this.menu();
  },
  stages(wi) {
    this.show("stages"); const w = WORLDS[wi];
    $("#stages").innerHTML = `<h2>${AR(w.id)}. ${w.name}</h2><p style="font-size:28px;max-width:900px;text-align:center;opacity:.9">${w.intro}</p><div class="stagebtns">${[0, 1, 2].map(i => { const s = Save.stars(`${wi}-${i}`), ul = this.unlockAll || i === 0 || Save.stars(`${wi}-${i - 1}`) > 0;
      return `<div class="sb ${ul ? "" : "lock"}" data-i="${i}">${ul ? `<b>${AR(i + 1)}</b>` : `<img src="assets/ui/lock.png" alt="">`}<div class="s">${"★".repeat(s)}<span style="opacity:.3">${"★".repeat(3 - s)}</span></div>مرحلة</div>`; }).join("")}</div><button class="btn" id="sBack">رجوع</button>`;
    $$(".sb").forEach(b => b.onclick = () => { const i = +b.dataset.i; if (b.classList.contains("lock")) { this.toast("أنهي المرحلة السابقة أولًا."); return; } SFX.click(); this.play(wi, i); });
    $("#sBack").onclick = () => this.worlds();
  },
  play(wi, si) {
    ["menu", "worlds", "stages"].forEach(s => $("#" + s).classList.add("hidden")); $("#hud").classList.remove("hidden"); this.closeModal();
    const go = () => { SFX.music(wi); Eng.start(wi, si); };
    if (si === 0 && !Save.d["seen" + wi]) { Save.d["seen" + wi] = true; Save.save(); const w = WORLDS[wi];
      this.modal(`<h3>عالم ${w.name}</h3><p>${w.intro}</p><p style="font-size:26px;color:#9fb0ff">لديك ${AR(ENERGY_MAX)} وحدات طاقة. الاستنتاج الخاطئ يكلّف ٢، والمحاولة الفاشلة تكلّف ١. حرّكي ذرّة بالأسهم ← → واقفزي بـ ↑ (أو A وD وW)، والمسي البطاريات لجمعها (+٣).</p><div class="row"><button class="btn pri" id="gx">هيا</button></div>`);
      $("#gx").onclick = () => { this.closeModal(); go(); }; } else go();
  },
  /* ---------- HUD ---------- */
  onPhase() {
    const w = Eng.w, ph = Eng.phase, multi = Eng.tasks.length > 1;
    $("#title").textContent = `${w.name} · ${AR(Eng.si + 1)}${multi ? ` (${AR(Eng.ti + 1)}/${AR(Eng.tasks.length)})` : ""}`;
    const order = ["measure", "deduce", "act"], names = { measure: "قِس", deduce: "استنتج", act: "تصرّف" }, cur = ph === "law" ? -1 : ph === "measure" ? 0 : 1 + (ph === "act") * 1;
    $("#chips").innerHTML = order.map((p, i) => `<div class="chip ${i === cur ? "on" : i < cur ? "done" : ""}">${names[p]}</div>`).join("");
    this.energy(); this.buildSliders(); this.panel(); this.controls();
    $("#goal").style.display = ph === "act" ? "" : "none"; $("#goal").textContent = Eng.T.goal;
    if (ph === "law") this.lawModal();
    if (ph === "measure") this.toast(Eng.K.scene === "force" ? "غيّري القوة ثم اضغطي «جرّبي» لتسجيل التسارع." : Eng.K.scene === "light" ? "حرّكي المرآة واضغطي «جرّبي» لقياس زاويتي السقوط والانعكاس." : "غيّري السرعة وأطلقي مسبارًا تجريبيًا لقياس الانحراف.");
  },
  energy() { let h = ""; for (let i = 0; i < ENERGY_MAX; i++) h += `<div class="ec ${i < Eng.energy ? "" : "off"}"></div>`; $("#energy").innerHTML = h + `<span>${AR(Eng.energy)}</span>`; $("#energy").classList.toggle("low", Eng.energy <= 3); },
  buildSliders() {
    const T = Eng.T, ph = Eng.phase, n = ph === "act" ? T.sliders.length : 1;
    $("#sliders").innerHTML = T.sliders.slice(0, n).map((s, i) => `<div class="sl"><label><span>${s.label}</span><b id="sv${i}">${AR(T.vals[i])}</b></label><input type="range" tabindex="-1" id="sr${i}" min="${s.min}" max="${s.max}" step="${s.step}" value="${T.vals[i]}"></div>`).join("");
    T.sliders.slice(0, n).forEach((s, i) => { const r = $("#sr" + i); r.oninput = () => { T.vals[i] = +r.value; $("#sv" + i).textContent = AR(T.vals[i]); SFX.tick(); if (Eng.K.scene === "light") { T.beam = null; T.mirrors[i].phi = T.vals[i]; } if (Eng.K.scene === "gravity") T.trail = null; }; });
  },
  panel() {
    const p = $("#panel"), K = Eng.K, rows = Eng.rows; p.className = K.panel; p.style.display = Eng.phase === "law" ? "none" : "";
    p.innerHTML = `<h4>جدول القياسات</h4><table><tr>${K.cols.map(c => `<th>${c}</th>`).join("")}</tr>${rows.slice(-4).map(r => `<tr>${r.cells.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</table>${rows.length ? "" : `<div class="empty">لا قياسات بعد.</div>`}`;
  },
  controls() {
    const ph = Eng.phase, busy = Eng.K && Eng.T && Eng.K.busy(Eng.T);
    $("#bTest").style.display = ph === "measure" ? "" : "none"; $("#bDeduce").style.display = ph === "measure" ? "" : "none"; $("#bAct").style.display = ph === "act" ? "" : "none";
    $("#bTest").disabled = busy; $("#bDeduce").disabled = busy || !Eng.canDeduce(); $("#bAct").disabled = busy;
    $("#bAct").textContent = Eng.K.scene === "force" ? "ادفعي" : Eng.K.scene === "light" ? "أطلقي الشعاع" : "أطلقي المسبار";
    $("#bTest").textContent = Eng.K.scene === "gravity" ? "أطلقي تجريبيًا" : "جرّبي";
    $("#controls").style.display = ph === "law" ? "none" : "";
  },
  /* ---------- النوافذ ---------- */
  modal(html) { const m = $("#modal"); m.innerHTML = `<div class="mbox">${html}</div>`; m.classList.remove("hidden"); },
  closeModal() { $("#modal").classList.add("hidden"); $("#modal").innerHTML = ""; if (Eng.robot.hold > 50) Eng.robot.hold = .1; },
  toast(t) { const e = $("#toast"); e.textContent = t; e.classList.add("on"); clearTimeout(this._tt); this._tt = setTimeout(() => e.classList.remove("on"), 3200); },
  lawModal() {
    this.modal(`<h3>أي قانون تحتاجين؟</h3><p>انظري إلى المشهد واختاري القانون المناسب لهذه المهمة.</p><div class="laws">${["force", "light", "gravity"].map(k => `<button class="lw" data-k="${k}"><img src="assets/ui/${LAWS[k].icon}.png" alt="">${k === "force" ? "القوة والحركة" : k === "light" ? "انعكاس الضوء" : "الجاذبية"}</button>`).join("")}</div>`);
    $$(".lw").forEach(b => b.onclick = () => { SFX.click(); if (b.dataset.k === Eng.tasks[Eng.ti].kind) this.closeModal(); Eng.chooseLaw(b.dataset.k); });
  },
  deduceModal(o) {
    this.modal(`<h3>استنتجي</h3><p>${o.q}</p><div class="opts">${shuffle(o.opts).map((x, i) => `<button class="opt" data-i="${i}">${x.t}</button>`).join("")}</div><div class="row"><button class="btn small" id="dx">عودة للقياس</button></div>`);
    const list = $$(".opt"), map = {}; list.forEach(b => map[b.textContent] = b);
    list.forEach(b => b.onclick = () => { SFX.click(); Eng.answer(o.opts.find(x => x.t === b.textContent)); });
    $("#dx").onclick = () => { this.closeModal(); Eng.setRobot("idle", .1); };
  },
  wrongAnswer(msg) { this.modal(`<h3>ليس بعد…</h3><div class="bad">${msg}</div><p>خسرتِ ٢ من الطاقة. أعيدي النظر في القياسات.</p><div class="row"><button class="btn pri" id="wx">حاولي مجددًا</button></div>`); $("#wx").onclick = () => { this.closeModal(); if (Eng.phase !== "done") { Eng.setRobot("idle", .1); Eng.deduce(); } }; if (Eng.phase === "done") $("#modal").classList.add("hidden"); },
  lawReveal(kind) { const L = LAWS[kind]; this.toast(`✦ اكتشفتِ: ${L.short}`); },
  hintModal(t, free) { this.modal(`<h3>تلميح</h3><p>${t}</p><p style="font-size:22px;opacity:.7">${free ? "هذا التلميح مجاني." : "كلّف التلميح وحدة طاقة."}</p><div class="row"><button class="btn pri" id="hx">فهمت</button></div>`); $("#hx").onclick = () => this.closeModal(); },
  pause() { if (Eng.phase === "idle") return; this.modal(`<h3>إيقاف مؤقت</h3><div class="row"><button class="btn pri" id="p1">متابعة</button><button class="btn" id="p2">إعادة المرحلة</button><button class="btn" id="p3">المراحل</button><button class="btn" id="p4">${SFX.on ? "🔊" : "🔇"} الصوت</button></div>`);
    $("#p1").onclick = () => this.closeModal(); $("#p2").onclick = () => { this.closeModal(); Eng.start(Eng.wi, Eng.si); }; $("#p3").onclick = () => { this.closeModal(); this.stages(Eng.wi); };
    $("#p4").onclick = () => { SFX.toggle(); Save.d.sound = SFX.on; Save.save(); this.pause(); }; },
  winModal(stars) {
    const w = Eng.w, L = w.id === 4 ? null : LAWS[w.law], hasNext = Eng.si < 2, lastWorld = Eng.wi === 3 && Eng.si === 2;
    this.modal(`<h3>${lastWorld ? "استعدتِ ذاكرة الكون! 🎉" : "أحسنتِ!"}</h3><div class="stars">${[1, 2, 3].map(i => `<img src="assets/ui/${i <= stars ? "star" : "star0"}.png" alt="">`).join("")}</div><p>${L ? `<b style="color:#FFE08A">${L.name}</b><br>${L.text}` : "جمعتِ القوانين كلها في الذاكرة."}</p><p style="font-size:24px;opacity:.8">الطاقة المتبقية: ${AR(Eng.energy)}</p><div class="row">${hasNext ? `<button class="btn pri" id="n1">المرحلة التالية</button>` : `<button class="btn pri" id="n1">${Eng.wi < 3 ? "العالم التالي" : "القائمة"}</button>`}<button class="btn" id="n2">إعادة</button><button class="btn" id="n3">المراحل</button></div>`);
    $("#n1").onclick = () => { this.closeModal(); if (hasNext) this.play(Eng.wi, Eng.si + 1); else if (Eng.wi < 3) this.stages(Eng.wi + 1); else this.menu(); };
    $("#n2").onclick = () => { this.closeModal(); this.play(Eng.wi, Eng.si); }; $("#n3").onclick = () => { this.closeModal(); this.stages(Eng.wi); };
  },
  loseModal() { const free = Eng.losses >= 2; this.modal(`<h3>نفدت الطاقة</h3><p>ذرّة تحتاج إلى إعادة شحن. جرّبي من جديد، فالقيم تتغيّر في كل مرة.${free ? "<br>التلميحات صارت مجانية الآن." : ""}</p><div class="row"><button class="btn pri" id="l1">إعادة المحاولة</button><button class="btn" id="l2">المراحل</button></div>`);
    $("#l1").onclick = () => { this.closeModal(); this.play(Eng.wi, Eng.si); }; $("#l2").onclick = () => { this.closeModal(); this.stages(Eng.wi); }; },
  async init() {
    Save.load(); this.fit(); addEventListener("resize", () => this.fit()); await loadImages();
    const cv = $("#cv"); cv.addEventListener("pointerdown", e => { const r = cv.getBoundingClientRect(); Eng.collect((e.clientX - r.left) / this.scale, (e.clientY - r.top) / this.scale); });
    $("#bTest").onclick = () => Eng.test(); $("#bDeduce").onclick = () => Eng.deduce(); $("#bAct").onclick = () => Eng.act();
    $("#bHint").onclick = () => Eng.hint(); $("#bPause").onclick = () => this.pause(); $("#bBack").onclick = () => this.stages(Eng.wi); $("#bSound").onclick = () => { SFX.toggle(); Save.d.sound = SFX.on; Save.save(); $("#bSound img").src = `assets/ui/sound_${SFX.on ? "on" : "off"}.png`; };
    addEventListener("pointerdown", () => { SFX.unlock(); if (SFX.on && !SFX.mus) SFX.music(SFX.key || "menu"); }, { once: false });
    const KM = { ArrowLeft: "l", a: "l", A: "l", ArrowRight: "r", d: "r", D: "r", ArrowUp: "j", w: "j", W: "j", " ": "j" };
    addEventListener("keydown", e => { const k = KM[e.key]; if (!k || $("#hud").classList.contains("hidden")) return; e.preventDefault(); Eng.keys[k] = 1; });
    addEventListener("keyup", e => { const k = KM[e.key]; if (k && k !== "j") Eng.keys[k] = 0; });
    addEventListener("blur", () => { Eng.keys.l = Eng.keys.r = Eng.keys.j = 0; });
    [["pL", "l"], ["pR", "r"], ["pJ", "j"]].forEach(([id, k]) => { const b = $("#" + id); b.addEventListener("pointerdown", e => { e.preventDefault(); Eng.keys[k] = 1; }); ["pointerup", "pointerleave", "pointercancel"].forEach(ev => b.addEventListener(ev, () => { if (k !== "j") Eng.keys[k] = 0; })); });
    this.menu(); $("#bSound img").src = `assets/ui/sound_${SFX.on ? "on" : "off"}.png`; const c = cv.getContext("2d"); let last = performance.now();
    const loop = now => { const dt = Math.min(.05, (now - last) / 1000); last = now; Eng.update(dt); Eng.draw(c); requestAnimationFrame(loop); }; requestAnimationFrame(loop);
    window.__ready = true;
  }
};
UI.init();
