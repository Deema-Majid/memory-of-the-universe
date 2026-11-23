"use strict";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
const rnd = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const AR = n => { const s = (Math.round(n * 10) / 10).toString(); return s.replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]).replace(".", "٫"); };
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
  for (const k in ROBOT) for (let n = 1; n <= ROBOT[k]; n++) add(`r_${k}_${n}`, `assets/robot/${k}_${String(n).padStart(2, "0")}.png`);
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
  lose() { [392, 330, 262, 196].forEach((f, i) => this.tone(f, .4, "triangle", .08, i * .2)); },
  /* موسيقى خلفية هادئة تتغير حسب العالم */
  SC: { menu: [0, 3, 7, 10, 14, 12], 0: [0, 2, 4, 7, 9, 12], 1: [0, 3, 5, 7, 10, 12], 2: [0, 2, 3, 7, 8, 12], 3: [0, 2, 5, 7, 9, 14] },
  music(key) {
    this.stopMusic(); this.key = key; if (!this.on) return; const c = this.get(); if (!c) return;
    const root = { menu: 220, 0: 196, 1: 233, 2: 175, 3: 208 }[key], sc = this.SC[key], bpm = key === "menu" ? 70 : 84, step = 60 / bpm / 2;
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
  d: { stars: {}, sound: true, story: false, losses: {} },
  load() { try { Object.assign(this.d, JSON.parse(localStorage.getItem(SAVE_KEY) || "{}")); } catch (e) { } SFX.on = this.d.sound !== false; },
  save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.d)); } catch (e) { } },
  stars(id) { return this.d.stars[id] || 0; },
  set(id, n) { if (n > this.stars(id)) this.d.stars[id] = n; this.save(); },
  reset() { this.d = { stars: {}, sound: this.d.sound, story: false, losses: {} }; this.save(); }
};
