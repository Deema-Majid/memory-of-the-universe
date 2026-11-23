"use strict";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
let RNG = Math.random;
function seeded(str) { let h = 1779033703 ^ str.length; for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; } let a = h >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rnd = a => a[Math.floor(RNG() * a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(RNG() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
let LANG = "ar";
const L = (a, e) => LANG === "en" ? e : a;
const AR2 = n => { const v = Math.round(n * 100) / 100, s = String(v); return LANG === "en" ? s : s.replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]).replace(".", "٫"); };
const FX = s => LANG === "en" ? s : "\u2066" + s.replace(/([×÷=≈()√+−·:])/g, "\u200E$1\u200E").replace(/ /g, "\u200E \u200E") + "\u2069";
const AR = n => { if (LANG === "en") return String(Math.round(n * 10) / 10); const s = (Math.round(n * 10) / 10).toString(); return s.replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]).replace(".", "٫"); };
const ease = t => t * t * (3 - 2 * t);

/* ---------- تحميل الصور ---------- */
const IMG = {};
const IMG_LIST = {
  bg1: "bg1", bg2: "bg2", bg3: "bg3", bg4: "bg4", gt1: "gt1", gt2: "gt2", gt4: "gt4",
  crate1: "crate1", crate2: "crate2", crate3: "crate3", chasm: "chasm", gateC: "gateC", gateO: "gateO",
  wall: "wall", rubble: "rubble", pickup: "pickup", emitter: "emitter", sensorOff: "sensorOff", sensorOn: "sensorOn",
  gateL: "gateL", planetK: "planetK", planetU: "planetU", astA: "astA", astB: "astB", astC: "astC",
  probe: "probe", ring: "ring", coreGate: "coreGate", core: "core"
};
const ROBOT = { idle: 4, push: 4, roll: 6, success: 4, fail: 3, think: 3, low: 3, scan: 4, jump: 5 };
function loadImages() {
  const jobs = [];
  const add = (key, src) => jobs.push(new Promise(res => { const i = new Image(); i.onload = () => { IMG[key] = i; res(); }; i.onerror = () => { console.warn("missing", src); res(); }; i.src = src; }));
  for (const k in IMG_LIST) add(k, `assets/img/${IMG_LIST[k]}.png`);
  for (const k in ROBOT) for (let n = 1; n <= ROBOT[k]; n++) add(`r_${k}_${n}`, `assets/robot/${k === "push" ? "pushc" : k}_${String(n).padStart(2, "0")}.png`);
  return Promise.all(jobs);
}

/* ---------- الصوت (WebAudio، بلا ملفات) ---------- */
const SFX = {
  ctx: null, on: true, mus: null, _tick: 0,
  get() { if (!this.ctx && !this.unl) return null; if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); this.master = this.ctx.createGain(); this.master.gain.value = 1; this.master.connect(this.ctx.destination); this.mg = this.ctx.createGain(); this.mg.gain.value = .5; this.mg.connect(this.master); } catch (e) { } } if (this.ctx && this.ctx.state === "suspended") this.ctx.resume(); return this.ctx; },
  unlock() { this.unl = true; this.get(); },
  tone(f, d = .12, type = "sine", v = .08, when = 0, to = null, dest = null) {
    if (!this.on) return; const c = this.get(); if (!c) return;
    const t = c.currentTime + when, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(dest || this.master); o.start(t); o.stop(t + d + .03);
  },
  noise(d = .3, v = .05, f0 = 1200, f1 = 300, when = 0) {
    if (!this.on) return; const c = this.get(); if (!c) return; const t = c.currentTime + when, n = Math.floor(c.sampleRate * d), buf = c.createBuffer(1, n, c.sampleRate), data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(); s.buffer = buf; fl.type = "bandpass"; fl.frequency.setValueAtTime(f0, t); fl.frequency.exponentialRampToValueAtTime(f1, t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); s.connect(fl); fl.connect(g); g.connect(this.master); s.start(t);
  },
  click() { this.tone(620, .07, "triangle", .07); },
  tick() { const n = performance.now(); if (n - this._tick < 70) return; this._tick = n; this.tone(900, .03, "square", .018); },
  test() { this.tone(330, .1, "triangle", .08); this.tone(494, .14, "triangle", .07, .09); },
  push() { this.noise(.9, .06, 500, 120); this.tone(90, .8, "sawtooth", .04, 0, 160); },
  beam() { this.tone(300, .7, "sawtooth", .03, 0, 1400); this.tone(1200, .5, "sine", .03, .1, 1800); },
  launch() { this.noise(1.1, .07, 300, 2600); this.tone(150, 1, "triangle", .05, 0, 700); },
  collect() { [660, 880, 1175, 1568].forEach((f, i) => this.tone(f, .14, "sine", .08, i * .06)); },
  good() { [523, 659, 784].forEach((f, i) => this.tone(f, .2, "sine", .09, i * .1)); },
  law() { [392, 494, 587, 784, 988].forEach((f, i) => this.tone(f, .35, "sine", .08, i * .11)); this.tone(196, 1, "triangle", .06, 0); },
  bad() { this.tone(200, .25, "sawtooth", .05, 0, 120); this.tone(150, .3, "sawtooth", .05, .13, 90); },
  win() { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => this.tone(f, .4, "sine", .09, i * .12)); [262, 330, 392].forEach(f => this.tone(f, 1.2, "triangle", .05, .5)); },
  crash() { this.noise(.6, .12, 900, 80); this.tone(70, .5, "sawtooth", .07, 0, 35); },
  roar() { this.noise(1.1, .14, 300, 60); this.tone(120, 1, "sawtooth", .07, 0, 45); this.tone(180, .9, "square", .03, .05, 70); },
  charge() { this.tone(160, 1.05, "sawtooth", .045, 0, 900); },
  zap() { this.tone(900, .35, "square", .05, 0, 120); this.noise(.3, .06, 2500, 400); },
  sizzle() { this.noise(.8, .05, 4000, 1500); },
  lose() { [392, 330, 262, 196].forEach((f, i) => this.tone(f, .4, "triangle", .08, i * .2)); },
  /* موسيقى خلفية هادئة تتغير حسب العالم */
  SC: { boss: [0, 1, 3, 7, 8, 12], menu: [0, 3, 7, 10, 14, 12], 0: [0, 2, 4, 7, 9, 12], 1: [0, 3, 5, 7, 10, 12], 2: [0, 2, 3, 7, 8, 12], 3: [0, 2, 5, 7, 9, 14] },
  music(key) {
    this.stopMusic(); this.key = key; if (!this.on) return; const c = this.get(); if (!c) return;
    const root = { menu: 220, 0: 196, 1: 233, 2: 175, 3: 208, boss: 147 }[key], sc = this.SC[key], bpm = key === "menu" ? 70 : key === "boss" ? 132 : 84, step = 60 / bpm / 2;
    let i = 0, next = c.currentTime + .1; const mus = this.mus = { alive: true };
    const hz = k => root * Math.pow(2, k / 12);
    const sched = () => { if (!mus.alive) return; while (next < c.currentTime + .8) {
      const t = next - c.currentTime;
      if (i % 16 === 0) { const ch = [sc[0], sc[2], sc[4]]; ch.forEach(k => { this.tone(hz(k - 12), step * 15, "sine", .05, t, null, this.mg); this.tone(hz(k - 12) * 1.003, step * 15, "sine", .03, t, null, this.mg); }); }
      const pat = [0, 2, 1, 3, 2, 4, 3, 5][i % 8], skip = (i % 8 === 5 || i % 8 === 7) && Math.random() < .4;
      if (!skip) this.tone(hz(sc[pat]), step * 1.8, "triangle", .035, t, null, this.mg);
      if (i % 4 === 0) this.tone(hz(sc[0] - 24), step * 2, "sine", .05, t, null, this.mg);
      i++; next += step; } };
    sched(); mus.id = setInterval(sched, 250);
  },
  stopMusic() { if (this.mus) { this.mus.alive = false; clearInterval(this.mus.id); this.mus = null; } },
  toggle() { this.on = !this.on; if (this.on) this.music(this.key || "menu"); else this.stopMusic(); return this.on; }
};

/* ---------- الحفظ ---------- */
const SAVE_KEY = "dhakirat_alkawn_v1";
const Save = {
  d: { stars: {}, sound: true, story: false, losses: {}, profile: null, lang: "ar", laws: {} },
  load() { try { Object.assign(this.d, JSON.parse(localStorage.getItem(SAVE_KEY) || "{}")); } catch (e) { } this.d.laws = this.d.laws || {}; this.d.frags = this.d.frags || {}; this.d.skin = this.d.skin || 0; SFX.on = this.d.sound !== false; LANG = this.d.lang === "en" ? "en" : "ar"; },
  save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.d)); } catch (e) { } },
  stars(id) { return this.d.stars[id] || 0; },
  set(id, n) { if (n > this.stars(id)) this.d.stars[id] = n; this.save(); },
  wipe() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } this.d = { stars: {}, sound: true, story: false, losses: {}, profile: null, lang: "ar", laws: {}, frags: {}, skin: 0 }; LANG = "ar"; SFX.on = true; },
  reset() { this.d = { stars: {}, sound: this.d.sound, story: false, losses: {}, profile: this.d.profile, lang: this.d.lang, laws: {}, frags: {}, skin: 0 }; this.save(); }
};

/* ---------- شكل ذرّة وألوانه ---------- */
const HEADS = {"fail_01":[253,173,278],"fail_02":[180,178,204],"fail_03":[242,199,204],"idle_01":[259,177,202],"idle_02":[260,171,188],"idle_03":[259,166,186],"idle_04":[259,172,186],"jump_01":[240,231,228],"jump_02":[254,89,200],"jump_03":[231,71,202],"jump_04":[282,86,188],"jump_05":[260,221,244],"low_01":[260,187,212],"low_02":[263,194,194],"low_03":[269,186,198],"push_01":[190,178,204],"push_02":[217,183,202],"push_03":[243,192,202],"push_04":[221,187,202],"roll_01":[270,178,204],"roll_02":[270,174,204],"roll_03":[270,174,204],"roll_04":[270,178,204],"roll_05":[270,174,204],"roll_06":[270,174,204],"scan_01":[199,177,202],"scan_02":[205,178,202],"scan_03":[205,178,202],"scan_04":[205,178,202],"success_01":[259,215,234],"success_02":[241,93,214],"success_03":[260,77,184],"success_04":[260,208,252],"think_01":[319,101,282],"think_02":[325,101,270],"think_03":[225,178,202]};
const COLORS = [null, "#FF5C5C", "#FF9A3C", "#FFE14D", "#5CE08A", "#28D8FF", "#5B7CFF", "#B06BFF", "#FF4F8B", "#4a5070"];
const ACCS = [
  { id: "none", ar: "بدون", en: "None", e: "∅" }, { id: "cap", ar: "كاب", en: "Cap", e: "🧢" }, { id: "bow", ar: "فيونكة", en: "Bow", e: "🎀" },
  { id: "phones", ar: "سماعات", en: "Headphones", e: "🎧" }, { id: "wizard", ar: "قبعة ساحر", en: "Wizard hat", e: "🧙" },
  { id: "crown", ar: "تاج", en: "Crown", e: "👑", w: 0 }, { id: "halo", ar: "هالة", en: "Halo", e: "😇", w: 1 }, { id: "wings", ar: "أجنحة", en: "Wings", e: "🪽", w: 2 }, { id: "aura", ar: "هالة كونية", en: "Cosmic aura", e: "🌌", w: 3 }];
const fragsOf = wi => [0, 1, 2].filter(i => Save.d.frags[`${wi}-${i}`]).length;
const accOpen = k => ACCS[k] && (ACCS[k].w === undefined || fragsOf(ACCS[k].w) >= 3);
const myLook = () => { const l = Save.d.look || {}; return { body: l.body || 0, acc: accOpen(l.acc || 0) ? (l.acc || 0) : 0, accCol: l.accCol == null ? 8 : l.accCol }; };
const _tint = {};
function tintCol(im, key, col) {
  if (!col) return im; const k = key + col; if (_tint[k]) return _tint[k];
  const cv = document.createElement("canvas"); cv.width = im.width; cv.height = im.height; const c = cv.getContext("2d");
  c.drawImage(im, 0, 0); c.globalCompositeOperation = "source-atop"; c.globalAlpha = .42; c.fillStyle = col; c.fillRect(0, 0, cv.width, cv.height);
  return (_tint[k] = cv);
}
const Robo = {
  /* يرسم ذرّة بشكل ولون معيّنين. x,gy: موضع القدمين؛ left: يتجه يسارًا */
  draw(c, look, st, fi, x, gy, w = 300, left = true, sq = 0, t = 0) {
    let im = IMG[`r_${st}_${fi}`]; if (!im) return; im = tintCol(im, `${st}${fi}`, COLORS[look.body]);
    const k = w / 680, h = w * im.height / im.width, hd = HEADS[`${st}_${String(fi).padStart(2, "0")}`] || [259, 175, 200];
    const hx = hd[0] * k - w / 2, hy = hd[1] * k - 222 * (w / 300), hw = Math.max(70, hd[2]) * k, acc = ACCS[look.acc] ? ACCS[look.acc].id : "none", ac = COLORS[look.accCol] || "#FF4F8B";
    c.save(); c.translate(x, gy); c.scale(left ? -1 : 1, 1); c.scale(1 - sq * .6, 1 + sq);
    if (acc === "wings") this.wings(c, hx - hw * .15, hy + hw * .9, hw, ac, t);
    if (acc === "aura") { const g = c.createRadialGradient(hx, hy + hw * .9, hw * .2, hx, hy + hw * .9, hw * 1.7); [0, .35, .6, 1].forEach((p, i) => g.addColorStop(p, ["rgba(255,255,255,.35)", "#7FE8FF66", "#B06BFF55", "rgba(255,79,139,0)"][i])); c.fillStyle = g; c.beginPath(); c.arc(hx, hy + hw * .9, hw * 1.7, 0, 7); c.fill();
      for (let i = 0; i < 6; i++) { const a = t * 1.5 + i * 1.05; c.fillStyle = ["#FFE14D", "#7FE8FF", "#FF4F8B"][i % 3]; c.beginPath(); c.arc(hx + Math.cos(a) * hw * 1.3, hy + hw * .9 + Math.sin(a) * hw * .7, 3 + (i % 2) * 2, 0, 7); c.fill(); } }
    c.drawImage(im, -w / 2, -222 * (w / 300), w, h);
    this.acc(c, acc, hx, hy, hw, ac, t);
    c.restore();
  },
  wings(c, x, y, s, col, t) { const f = Math.sin(t * 7) * .18; c.save(); c.translate(x, y); for (const sd of [-1, 1]) { c.save(); c.scale(sd, 1); c.rotate(-.55 + f); [[.55, -.05, .62, .2], [.78, .18, .5, .17], [.92, .42, .38, .14]].forEach(([dx, dy, rx, ry], i) => { c.save(); c.translate(dx * s, dy * s - s * .15); c.rotate(.25 + i * .3); c.fillStyle = i ? col : "#ffffff"; c.globalAlpha = .92; c.strokeStyle = "#ffffff"; c.lineWidth = 3; c.beginPath(); c.ellipse(0, 0, rx * s, ry * s, 0, 0, 7); c.fill(); c.globalAlpha = 1; c.stroke(); c.restore(); }); c.restore(); } c.restore(); },
  acc(c, id, x, y, s, col, t) {
    c.save(); c.lineJoin = "round"; c.lineCap = "round";
    if (id === "cap") { c.fillStyle = col; c.strokeStyle = "#1c2250"; c.lineWidth = 4; c.beginPath(); c.ellipse(x, y + s * .12, s * .5, s * .32, 0, Math.PI, 0); c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.ellipse(x + s * .42, y + s * .1, s * .36, s * .08, 0, 0, 7); c.fill(); c.stroke(); c.fillStyle = "#fff"; c.beginPath(); c.arc(x, y - s * .2, s * .06, 0, 7); c.fill(); }
    if (id === "bow") { const bx = x - s * .3, by = y + s * .02; c.fillStyle = col; c.strokeStyle = "#1c2250"; c.lineWidth = 3; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx + sd * s * .32, by - s * .3, bx + sd * s * .36, by); c.quadraticCurveTo(bx + sd * s * .32, by + s * .28, bx, by); c.fill(); c.stroke(); }
      c.beginPath(); c.arc(bx, by, s * .08, 0, 7); c.fill(); c.stroke(); }
    if (id === "phones") { c.strokeStyle = "#1c2250"; c.lineWidth = s * .12; c.beginPath(); c.arc(x, y + s * .42, s * .56, Math.PI * 1.08, Math.PI * 1.92); c.stroke(); c.strokeStyle = col; c.lineWidth = s * .07; c.stroke();
      for (const sd of [-1, 1]) { c.fillStyle = col; c.strokeStyle = "#1c2250"; c.lineWidth = 3; c.beginPath(); c.roundRect(x + sd * s * .58 - s * .12, y + s * .3, s * .24, s * .34, s * .08); c.fill(); c.stroke(); } }
    if (id === "wizard") { c.fillStyle = col; c.strokeStyle = "#1c2250"; c.lineWidth = 4; c.beginPath(); c.moveTo(x - s * .5, y + s * .08); c.quadraticCurveTo(x - s * .1, y - s * .5, x + s * .25, y - s * .95); c.quadraticCurveTo(x + s * .12, y - s * .4, x + s * .5, y + s * .08); c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.ellipse(x, y + s * .08, s * .62, s * .1, 0, 0, 7); c.fill(); c.stroke(); c.fillStyle = "#FFE14D"; [[-.1, -.2], [.12, -.5], [.05, .0]].forEach(([a, b]) => { c.beginPath(); c.arc(x + a * s, y + b * s, s * .045, 0, 7); c.fill(); }); }
    if (id === "crown") { c.fillStyle = "#FFC83D"; c.strokeStyle = "#8a5a00"; c.lineWidth = 3; const w = s * .8, b = y + s * .05; c.beginPath(); c.moveTo(x - w / 2, b); c.lineTo(x - w / 2, b - s * .3); c.lineTo(x - w / 4, b - s * .14); c.lineTo(x, b - s * .4); c.lineTo(x + w / 4, b - s * .14); c.lineTo(x + w / 2, b - s * .3); c.lineTo(x + w / 2, b); c.closePath(); c.fill(); c.stroke();
      [[-w / 2, -.3], [0, -.4], [w / 2, -.3]].forEach(([dx, dy], i) => { c.fillStyle = [col, "#FF4F5E", col][i]; c.beginPath(); c.arc(x + dx, b + dy * s, s * .06, 0, 7); c.fill(); }); }
    if (id === "halo") { c.shadowColor = "#FFE14D"; c.shadowBlur = 18; c.strokeStyle = "#FFE98A"; c.lineWidth = s * .08; c.beginPath(); c.ellipse(x, y - s * .28 + Math.sin(t * 3) * 4, s * .42, s * .12, 0, 0, 7); c.stroke(); }
    c.restore();
  },
  frame(st, t) { const n = ROBOT[st] || 1; return (Math.floor(t * (st === "roll" ? 10 : 6)) % n) + 1; }
};
