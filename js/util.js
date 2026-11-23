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

/* ---------- ألوان ذرّة (تُفتح بجمع شظايا الذاكرة) ---------- */
const SKINS = [{ col: null, ar: "الأصلي", en: "Classic" }, { col: "#FFB020", w: 0, ar: "ذهبي", en: "Gold" }, { col: "#28D8FF", w: 1, ar: "سماوي", en: "Sky" }, { col: "#B06BFF", w: 2, ar: "بنفسجي", en: "Violet" }, { col: "#FF4F8B", w: 3, ar: "وردي", en: "Pink" }];
const fragsOf = wi => [0, 1, 2].filter(i => Save.d.frags[`${wi}-${i}`]).length;
const skinOpen = k => k === 0 || fragsOf(SKINS[k].w) >= 3;
const _tint = {};
function tinted(im, key) {
  const sk = SKINS[Save.d.skin || 0]; if (!sk || !sk.col || !skinOpen(Save.d.skin)) return im;
  const k = key + sk.col; if (_tint[k]) return _tint[k];
  const cv = document.createElement("canvas"); cv.width = im.width; cv.height = im.height; const c = cv.getContext("2d");
  c.drawImage(im, 0, 0); c.globalCompositeOperation = "source-atop"; c.globalAlpha = .42; c.fillStyle = sk.col; c.fillRect(0, 0, cv.width, cv.height);
  return (_tint[k] = cv);
}
