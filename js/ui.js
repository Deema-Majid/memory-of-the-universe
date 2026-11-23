"use strict";
const UI = {
  scale: 1, scr: null, unlockAll: /[?&]unlock=1/.test(location.search),
  show(id) { ["menu", "worlds", "stages"].forEach(s => $("#" + s).classList.toggle("hidden", s !== id)); $("#hud").classList.add("hidden"); this.scr = id; Eng.phase = "idle"; Eng.T = null; if (!id) return; },
  fit() { const s = Math.min(innerWidth / 1600, innerHeight / 900); this.scale = s; $("#stage").style.transform = `scale(${s})`; },
  /* ---------- القوائم ---------- */
  menu() {
    this.show("menu"); const any = Object.keys(Save.d.stars).length;
    $("#menu").innerHTML = `<img class="logo" src="assets/logo/logo_stacked_dark.png" alt="ذاكرة الكون"><div class="row"><button class="btn pri" id="mPlay">${any ? "تابعي اللعب" : "ابدئي"}</button><button class="btn" id="mStory">القصة</button><button class="btn" id="mSound">${SFX.on ? "🔊 الصوت" : "🔇 الصوت"}</button></div><p>لعبة فيزياء ثنائية الأبعاد: قيسي · استنتجي · تصرّفي</p>`;
    $("#mPlay").onclick = () => { SFX.click(); if (!Save.d.story) this.story(() => this.worlds()); else this.worlds(); };
    $("#mStory").onclick = () => { SFX.click(); this.story(() => this.menu()); };
    $("#mSound").onclick = () => { SFX.on = !SFX.on; Save.d.sound = SFX.on; Save.save(); SFX.click(); this.menu(); };
  },
  story(done) {
    let i = 0; const go = () => { const s = STORY[i];
      this.modal(`<img class="sc" src="assets/story/${s.img}.png" alt=""><p>${s.t}</p><div class="row"><button class="btn pri" id="sx">${i < STORY.length - 1 ? "التالي" : "هيا نبدأ"}</button><button class="btn small" id="ss">تخطّي</button></div>`);
      $("#sx").onclick = () => { SFX.click(); if (++i < STORY.length) go(); else fin(); }; $("#ss").onclick = fin; };
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
    const go = () => Eng.start(wi, si);
    if (si === 0 && !Save.d["seen" + wi]) { Save.d["seen" + wi] = true; Save.save(); const w = WORLDS[wi];
      this.modal(`<h3>عالم ${w.name}</h3><p>${w.intro}</p><p style="font-size:26px;color:#9fb0ff">لديك ${AR(ENERGY_MAX)} وحدات طاقة. الاستنتاج الخاطئ يكلّف ٢، والمحاولة الفاشلة تكلّف ١. اضغطي على بطاريات الطاقة في المشهد لجمعها (+٣).</p><div class="row"><button class="btn pri" id="gx">هيا</button></div>`);
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
    $("#sliders").innerHTML = T.sliders.slice(0, n).map((s, i) => `<div class="sl"><label><span>${s.label}</span><b id="sv${i}">${AR(T.vals[i])}</b></label><input type="range" id="sr${i}" min="${s.min}" max="${s.max}" step="${s.step}" value="${T.vals[i]}"></div>`).join("");
    T.sliders.slice(0, n).forEach((s, i) => { const r = $("#sr" + i); r.oninput = () => { T.vals[i] = +r.value; $("#sv" + i).textContent = AR(T.vals[i]); if (Eng.K.scene === "light") { T.beam = null; T.mirrors[i].phi = T.vals[i]; } if (Eng.K.scene === "gravity") T.trail = null; }; });
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
    $("#p4").onclick = () => { SFX.on = !SFX.on; Save.d.sound = SFX.on; Save.save(); this.pause(); }; },
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
    $("#bHint").onclick = () => Eng.hint(); $("#bPause").onclick = () => this.pause(); $("#bBack").onclick = () => this.stages(Eng.wi);
    this.menu(); const c = cv.getContext("2d"); let last = performance.now();
    const loop = now => { const dt = Math.min(.05, (now - last) / 1000); last = now; Eng.update(dt); Eng.draw(c); requestAnimationFrame(loop); }; requestAnimationFrame(loop);
    window.__ready = true;
  }
};
UI.init();
