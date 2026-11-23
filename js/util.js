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

/* ---------- الصوت (WebAudio بسيط) ---------- */
const SFX = {
  ctx: null, on: true,
  tone(f, d = .12, type = "sine", v = .08, when = 0) {
    if (!this.on) return;
    try {
      this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)();
      const t = this.ctx.currentTime + when, o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      o.connect(g); g.connect(this.ctx.destination); o.start(t); o.stop(t + d + .02);
    } catch (e) { }
  },
  click() { this.tone(520, .06, "triangle") },
  test() { this.tone(330, .1, "triangle"); this.tone(440, .12, "triangle", .07, .09) },
  collect() { [660, 880, 1100].forEach((f, i) => this.tone(f, .12, "sine", .08, i * .07)) },
  good() { [523, 659, 784].forEach((f, i) => this.tone(f, .18, "sine", .09, i * .1)) },
  law() { [392, 494, 587, 784].forEach((f, i) => this.tone(f, .25, "sine", .09, i * .12)) },
  bad() { this.tone(180, .25, "sawtooth", .06); this.tone(140, .3, "sawtooth", .06, .12) },
  win() { [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, .3, "sine", .09, i * .12)) },
  lose() { [330, 262, 196].forEach((f, i) => this.tone(f, .3, "triangle", .08, i * .16)) }
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
