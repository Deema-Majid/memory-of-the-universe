"use strict";
/* ============ اللعب الجماعي أونلاين (تجريبي) ============
   المضيفة تشغّل اللعبة فعليًا (هي المرجع)، والصديقات يرسلن حركاتهن
   ويستقبلن حالة المشهد ١٥ مرة في الثانية عبر WebRTC (PeerJS). */
const NET_PREFIX = "dhakirat-alkawn-v1-";
const NET_MAX = 3;
const NET_UI = ["onPhase", "panel", "controls", "energy", "toast", "lawReveal", "deduceModal", "wrongAnswer", "closeModal", "winModal", "loseModal"];
const NET_ACT = ["test", "act", "deduce", "answer", "chooseLaw", "pressStart", "pressEnd", "hint", "pointer"];

const Net = {
  peer: null, host: false, guest: false, live: false, room: "", lobby: [], conn: null, you: 0, sel: { wi: 0, si: 0 },
  _orig: {}, _sendT: 0, _lastKeys: "", _hooked: false,

  /* ---------- اتصال ---------- */
  cfg() {
    const q = new URLSearchParams(location.search), h = q.get("peerhost");
    const c = h ? { host: h, port: +(q.get("peerport") || 9000), path: q.get("peerpath") || "/myapp", secure: false } : {};
    c.debug = 0; c.config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:global.stun.twilio.com:3478" }] }; return c;
  },
  load() {
    if (window.Peer) return Promise.resolve();
    return new Promise((res, rej) => { const s = document.createElement("script"); s.src = "js/vendor/peerjs.min.js"; s.onload = res; s.onerror = () => rej(new Error("load")); document.head.appendChild(s); });
  },
  me() { const P = Save.d.profile || {}; return { name: (P.name || L("لاعبة", "Player")).slice(0, 14), look: myLook() }; },
  mkCode() { return Array.from({ length: 5 }, () => "ABCDEFGHJKMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 31)]).join(""); },
  err(e) {
    const t = e && e.type, msg = t === "peer-unavailable" ? L("لا توجد غرفة بهذا الكود. تأكدي من الكود واطلبي من صديقتك إنشاء الغرفة أولًا.", "No room with this code. Check the code and ask your friend to create the room first.")
      : t === "unavailable-id" ? L("هذا الكود مستخدم، جرّبي مرة ثانية.", "That code is taken, try again.")
      : t === "network" || t === "server-error" || t === "socket-error" || t === "socket-closed" ? L("تعذّر الوصول إلى خادم الاتصال. تأكدي من الإنترنت أو جرّبي شبكة أخرى.", "Couldn't reach the connection server. Check your internet or try another network.")
      : t === "browser-incompatible" ? L("متصفحك لا يدعم اللعب الجماعي.", "Your browser doesn't support team play.")
      : L("حدث خطأ في الاتصال. جرّبي مرة ثانية.", "Connection error. Please try again.");
    UI.teamStatus(msg, true);
  },
  async create() {
    UI.teamStatus(L("جارٍ إنشاء الغرفة…", "Creating room…"));
    try { await this.load(); } catch (e) { return this.err({ type: "network" }); }
    this.reset(); this.room = this.mkCode(); this.host = true;
    const p = this.peer = new Peer(NET_PREFIX + this.room, this.cfg());
    p.on("open", () => { this.lobby = [Object.assign({ id: "host" }, this.me())]; this.hookHost(); UI.teamLobby(); });
    p.on("error", e => { if (e.type === "unavailable-id") { p.destroy(); this.create(); } else this.err(e); });
    p.on("connection", c => {
      c.on("open", () => { if (this.lobby.length >= NET_MAX || this.live && Eng.T) { c.send({ t: "full", live: !!(this.live && Eng.T) }); setTimeout(() => c.close(), 400); return; } });
      c.on("data", d => this.onHost(c, d));
      c.on("close", () => this.drop(c.peer)); c.on("error", () => this.drop(c.peer));
    });
    p.on("disconnected", () => { try { p.reconnect(); } catch (e) { } });
  },
  async join(code) {
    code = (code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (code.length < 4) { UI.teamStatus(L("اكتبي كود الغرفة كاملًا.", "Type the full room code."), true); return; }
    UI.teamStatus(L("جارٍ الاتصال بالغرفة…", "Connecting to the room…"));
    try { await this.load(); } catch (e) { return this.err({ type: "network" }); }
    this.reset(); this.room = code; this.guest = true;
    const p = this.peer = new Peer(undefined, this.cfg());
    p.on("error", e => this.err(e));
    p.on("open", () => {
      const c = this.conn = p.connect(NET_PREFIX + code, { reliable: true, serialization: "json" });
      const to = setTimeout(() => { if (!this.lobby.length) this.err({ type: "peer-unavailable" }); }, 12000);
      c.on("open", () => c.send(Object.assign({ t: "hello" }, this.me())));
      c.on("data", d => { clearTimeout(to); this.onGuest(d); });
      c.on("close", () => { if (this.guest) { this.reset(); UI.menu(); UI.toast(L("انقطع الاتصال بالغرفة.", "Disconnected from the room.")); } });
    });
  },
  reset() {
    try { if (this.peer) this.peer.destroy(); } catch (e) { }
    this.peer = null; this.conn = null; this.lobby = []; this.live = false;
    if (this.guest) this.unhookGuest();
    this.host = false; this.guest = false; Eng.team = false;
  },
  leave() { this.reset(); Eng.players = []; UI.menu(); },
  send(c, m) { try { if (c && c.open) c.send(m); } catch (e) { } },
  bcast(m) { this.lobby.forEach(p => p.conn && this.send(p.conn, m)); },

  /* ---------- المضيفة ---------- */
  onHost(c, d) {
    if (d.t === "hello") {
      if (this.lobby.find(p => p.id === c.peer)) return;
      if (this.lobby.length >= NET_MAX) { this.send(c, { t: "full" }); return; }
      this.lobby.push({ id: c.peer, name: String(d.name || "?").slice(0, 14), look: d.look || { body: 0, acc: 0, accCol: 8 }, conn: c });
      SFX.collect(); UI.toast(L(`انضمّت ${d.name} 👋`, `${d.name} joined 👋`)); this.pushLobby(); return;
    }
    const idx = this.lobby.findIndex(p => p.id === c.peer); if (idx < 0 || !this.live || !Eng.T) return;
    if (d.t === "keys") { const pl = Eng.players[idx]; if (pl) { pl.keys.l = d.k.l; pl.keys.r = d.k.r; if (d.k.j) pl.keys.j = 1; if (d.k.g) pl.keys.g = 1; } return; }
    if (d.t === "act") this.runAct(idx, d.fn, d.a || []);
  },
  runAct(idx, fn, a) {
    if (!Eng.players[idx]) return; const k = Eng.ai; Eng.ai = idx;
    try {
      if (fn === "answer") { const o = Eng.K.options(Eng.T).opts.find(x => x.t === a[0]); if (o && Eng.phase === "measure") Eng.answer(o); }
      else if (fn === "val") { const T = Eng.T, i = a[0], s = T.sliders[i]; if (s && Eng.phase !== "done") { const v = clamp(+a[1], s.min, s.max); T.vals[i] = v; if (s.key) T[s.key] = v; if (Eng.K.scene === "light") { T.beam = null; T.mirrors[i].phi = v; } if (Eng.K.scene === "gravity") T.trail = null; UI.syncSlider(i); } }
      else if (NET_ACT.includes(fn)) Eng[fn](...a);
    } finally { Eng.ai = k; }
  },
  drop(id) {
    const i = this.lobby.findIndex(p => p.id === id); if (i <= 0) return;
    const p = this.lobby.splice(i, 1)[0]; UI.toast(L(`غادرت ${p.name}`, `${p.name} left`));
    if (this.live && Eng.T) { Eng.players.splice(i, 1); if (Eng.grabPi === i) Eng.grab = null; if (Eng.charge && Eng.charge.pi === i) Eng.charge = null; }
    this.pushLobby();
  },
  pushLobby() { this.lobby.forEach((p, i) => p.conn && this.send(p.conn, { t: "lobby", you: i, room: this.room, sel: this.sel, live: this.live && !!Eng.T, players: this.lobby.map(q => ({ name: q.name, look: q.look })) })); if (!(this.live && Eng.T)) UI.teamLobby(); },
  start(wi, si) {
    this.sel = { wi, si }; this.live = true;
    Eng.players = this.lobby.map(p => Eng.mkP(p.id, p.name, p.look)); Eng.me = 0;
    this.bcast({ t: "start", wi, si }); UI.play(wi, si, { team: true });
  },
  toLobby() { this.live = false; Eng.T = null; this.bcast({ t: "tolobby" }); this.pushLobby(); },
  hookHost() {
    if (this._hooked) return; this._hooked = true;
    NET_UI.forEach(fn => { const o = UI[fn].bind(UI); this._orig[fn] = o; UI[fn] = (...a) => { const r = o(...a); if (this.host && this.live && Eng.T) this.bcast({ t: "ui", fn, a, st: this.snap() }); return r; }; });
    const hm = UI.hintModal.bind(UI); UI.hintModal = (...a) => { if (this.host && this.live && Eng.team && Eng.ai !== Eng.me) { const p = this.lobby[Eng.ai]; if (p) this.send(p.conn, { t: "ui", fn: "hintModal", a, st: this.snap() }); return; } return hm(...a); };
    const bm = Eng.boom.bind(Eng); Eng.boom = (...a) => { bm(...a); if (this.host && this.live) this.bcast({ t: "fx", a }); };
    ["test", "push", "beam", "launch", "collect", "good", "law", "bad", "win", "lose", "crash", "sizzle", "roar", "charge", "zap"].forEach(n => { const o = SFX[n].bind(SFX); SFX[n] = (...a) => { o(...a); if (this.host && this.live && Eng.T) this.bcast({ t: "sfx", n }); }; });
  },
  snap() {
    const E = Eng, r2 = v => Math.round(v * 100) / 100;
    return JSON.parse(JSON.stringify({
      wi: E.wi, si: E.si, ti: E.ti, kinds: E.tasks.map(t => t.kind), boss: E.boss, phase: E.phase, energy: E.energy, locked: E.locked, T: E.T, rows: E.rows,
      cells: E.cells, hz: E.hz, frag: null, grab: E.grab, grabPi: E.grabPi, charge: E.charge, drag: E.drag, bubble: E.bubble, lastSol: E.lastSol, shake: E.shake, slow: E.slow,
      P: E.players.map(p => ({ n: p.name, l: p.look, rb: p.rb, s: p.robot.s })),
      B: { on: Boss.on, hurt: Boss.hurt, die: Boss.die, wind: Boss.wind, shots: Boss.shots, col: Boss.col, hurtDone: Boss.hurtDone }
    }, (k, v) => typeof v === "number" ? r2(v) : v));
  },
  tick(dt) {
    if (this.host && this.live && Eng.T && this.lobby.length > 1) { this._sendT += dt; if (this._sendT >= 1 / 15) { this._sendT = 0; this.bcast({ t: "st", st: this.snap() }); } }
  },

  /* ---------- الصديقة (الضيفة) ---------- */
  onGuest(d) {
    if (d.t === "full") { this.reset(); UI.teamStatus(d.live ? L("اللعب بدأ في هذه الغرفة. اطلبي من صديقتك الرجوع لغرفة الفريق ثم انضمي.", "The game already started in this room. Ask your friend to go back to the team room, then join.") : L("الغرفة ممتلئة (٣ لاعبات كحد أقصى).", "The room is full (3 players max)."), true); return; }
    if (d.t === "lobby") { this.lobby = d.players; this.you = d.you; this.sel = d.sel; if (!this._hooked) this.hookGuest(); if (!Eng.T || !d.live) UI.teamLobby(); return; }
    if (d.t === "start") { UI.teamGuestPlay(d.wi); return; }
    if (d.t === "tolobby") { Eng.T = null; UI.teamLobby(); return; }
    if (d.t === "st") { this.apply(d.st); return; }
    if (d.t === "ui") { if (d.st) this.apply(d.st); this.guestUI(d.fn, d.a || []); return; }
    if (d.t === "fx") { Eng.boom(...d.a); return; }
    if (d.t === "sfx") { if (SFX[d.n]) SFX[d.n](); return; }
  },
  hookGuest() {
    this._hooked = true;
    NET_ACT.forEach(fn => { this._orig["E_" + fn] = Eng[fn]; Eng[fn] = (...a) => { if (!this.guest) return this._orig["E_" + fn].apply(Eng, a); if (fn === "answer") a = [a[0] && a[0].t]; if (fn === "pointer" && a[0] === "down") Eng.idleT = 0; this.send(this.conn, { t: "act", fn, a }); }; });
  },
  unhookGuest() { NET_ACT.forEach(fn => { if (this._orig["E_" + fn]) Eng[fn] = this._orig["E_" + fn]; }); this._hooked = false; },
  guestUI(fn, a) {
    if (!Eng.T && fn !== "toast") return;
    const f = UI[fn]; if (!f) return; f.apply(UI, a);
    if (fn === "winModal" || fn === "loseModal") { const row = $("#modal .row:last-child"); if (row) { row.innerHTML = `<p style="font-size:24px;opacity:.85;width:100%">${L("بانتظار المضيفة لتختار…", "Waiting for the host to choose…")}</p><button class="btn small" id="gLeave">${L("خروج من الغرفة", "Leave room")}</button>`; $("#gLeave").onclick = () => this.leave(); } }
  },
  apply(st) {
    const E = Eng; E.team = true; E.WW = 2400; E.wi = st.wi; E.si = st.si; E.w = WORLDS[st.wi]; E.ti = st.ti; E.tasks = st.kinds.map(k => ({ kind: k })); E.boss = st.boss; E.K = KINDS[st.kinds[st.ti]];
    const T = st.T, old = E.T; E.T = T; E.phase = st.phase; E.energy = st.energy; E.locked = st.locked; E.rows = st.rows; E.cells = st.cells; E.hz = st.hz; E.frag = null; E.grab = st.grab; E.grabPi = st.grabPi; E.charge = st.charge; E.drag = st.drag; E.lastSol = st.lastSol; E.slow = st.slow;
    if (st.shake > E.shake) E.shake = st.shake;
    if (st.bubble && (!E.bubble || E.bubble.txt !== st.bubble.txt || st.bubble.t < E.bubble.t)) E.bubble = st.bubble;
    const keep = E.players[this.you] ? E.players[this.you].keys : { l: 0, r: 0, j: 0, g: 0 };
    E.players = st.P.map((p, i) => { const o = E.players[i] && E.players[i].name === p.n ? E.players[i] : E.mkP(i, p.n, p.l); o.name = p.n; o.look = p.l; o.tx = p.rb.x; o.tj = p.rb.jh;
      if (o.rb.x === 0 || Math.abs(o.rb.x - p.rb.x) > 400) { o.rb.x = p.rb.x; o.rb.jh = p.rb.jh; } Object.assign(o.rb, { dir: p.rb.dir, air: p.rb.air, moving: p.rb.moving, sq: p.rb.sq }); o.robot.s = p.s; return o; });
    E.me = clamp(this.you, 0, E.players.length - 1); E.ai = E.me; E.players[E.me].keys = keep;
    Object.assign(Boss, st.B); Boss.on = st.B.on;
    if (T && T.sliders) T.sliders.forEach((s, i) => { const r = $("#sr" + i); if (r && document.activeElement !== r && !r.matches(":active")) { r.value = T.vals[i]; const v = $("#sv" + i); if (v) v.textContent = AR(T.vals[i]); } });
  },
  guestUpdate(dt) {
    const E = Eng; if (!E.T) return;
    E.fx.forEach(f => f.t += dt); E.fx = E.fx.filter(f => f.t < 1.2); E.shake = Math.max(0, E.shake - dt * 40);
    E.parts.forEach(p => { p.t += dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.grow * dt; }); E.parts = E.parts.filter(p => p.t < p.life);
    if (E.bubble) { E.bubble.t += dt; if (E.bubble.t > E.bubble.dur) E.bubble = null; }
    E.players.forEach(p => { if (p.tx != null) { p.rb.x += (p.tx - p.rb.x) * Math.min(1, dt * 14); p.rb.jh += (p.tj - p.rb.jh) * Math.min(1, dt * 18); } });
    const T = E.T, an = T.anim; if (an) { an.t = Math.min(an.t + dt, an.dur - .001); const sc = E.K.scene;
      if (sc === "light") T.beamT = Math.min(1, an.t / .7);
      if (sc === "force") { const tt = Math.min(an.t, an.mode === "test" ? .8 : 2); T.cx = Math.max(90, T.x0 - 100 * an.a * tt * tt); } }
    if (E.hz) { E.hz.x += E.hz.dir * (E.hz.kind === "spark" ? 210 : 165) * dt; E.hz.spin += E.hz.dir * dt * 6; }
    Boss.shots.forEach(s => { s.x += s.vx * dt; s.y += s.vy * dt; }); Boss.hurt = Math.max(0, Boss.hurt - dt * 2.2); if (Boss.die > 0) Boss.die = Math.min(1, Boss.die + dt * .9);
    const mx = E.players[E.me] ? E.players[E.me].rb.x : 800; E.camX += (clamp(mx - 800, 0, E.WW - 1600) - E.camX) * Math.min(1, dt * 6);
    const k = E.players[E.me] && E.players[E.me].keys; if (k) { const s = `${k.l}${k.r}${k.j}${k.g}`; if (s !== this._lastKeys || k.j || k.g) { this._lastKeys = s; this.send(this.conn, { t: "keys", k: { l: k.l, r: k.r, j: k.j, g: k.g } }); k.j = 0; k.g = 0; } }
  }
};
