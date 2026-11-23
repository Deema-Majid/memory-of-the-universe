"use strict";
const W = 1600, H = 900, GY = 700;
const ri = (a, b) => a + Math.floor(RNG() * (b - a + 1));
const SPOTS = {
  force: [[330, 585], [520, 585], [760, 585], [980, 450], [640, 430], [1180, 585]],
  light: [[330, 300], [900, 230], [480, 500], [1040, 520], [300, 470], [1100, 360]],
  gravity: [[480, 540], [900, 520], [620, 130], [1100, 150], [560, 400], [1000, 360]]
};

/* ============ تتبّع الأشعة ============ */
function trace(E, ms, walls) {
  let p = { x: E.x, y: E.y }, th = E.th, last = -1; const pts = [{ x: p.x, y: p.y }], hits = [];
  for (let k = 0; k < 6; k++) {
    const d = { x: Math.cos(rad(th)), y: -Math.sin(rad(th)) }; let best = null;
    const test = (x1, y1, x2, y2, type, idx) => {
      const ex = x2 - x1, ey = y2 - y1, den = d.x * ey - d.y * ex; if (Math.abs(den) < 1e-9) return;
      const t = ((x1 - p.x) * ey - (y1 - p.y) * ex) / den, u = ((x1 - p.x) * d.y - (y1 - p.y) * d.x) / den;
      if (t > 1e-3 && u >= 0 && u <= 1 && (!best || t < best.t)) best = { t, type, idx };
    };
    ms.forEach((m, i) => { if (i === last) return; const u = { x: Math.cos(rad(m.phi)), y: -Math.sin(rad(m.phi)) };
      test(m.x - u.x * m.len / 2, m.y - u.y * m.len / 2, m.x + u.x * m.len / 2, m.y + u.y * m.len / 2, "m", i); });
    walls.forEach(w => test(w.x1, w.y1, w.x2, w.y2, "w"));
    if (!best) { pts.push({ x: p.x + d.x * 2500, y: p.y + d.y * 2500 }); break; }
    p = { x: p.x + d.x * best.t, y: p.y + d.y * best.t }; pts.push(p);
    if (best.type === "w") break;
    const m = ms[best.idx], n = { x: Math.sin(rad(m.phi)), y: Math.cos(rad(m.phi)) };
    hits.push({ idx: best.idx, i: deg(Math.acos(clamp(Math.abs(d.x * n.x + d.y * n.y), 0, 1))) });
    th = 2 * m.phi - th; last = best.idx;
  }
  return { pts, hits };
}
function distSeg(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy; let t = l2 ? ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2 : 0; t = clamp(t, 0, 1);
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}
function lightSolved(T, phis) {
  T.mirrors.forEach((m, i) => m.phi = phis[i]);
  const r = trace(T.E, T.mirrors, T.walls), nm = T.mirrors.length;
  const ok = r.hits.length >= nm && distSeg(T.sensor, r.pts[nm], r.pts[nm + 1]) <= T.sensor.r;
  return { r, ok };
}

/* ============ المهام ============ */
const KINDS = {};

KINDS.force = {
  scene: "force", get cols() { return [L("القوة F", "Force F"), L("التسارع a", "Accel. a")]; }, panel: "right",
  make(level) {
    const m = rnd([2, 4, 5]), aT = [1, 1.5, 2][level - 1], x0 = 1100;
    return { m, aT, x0, gateX: x0 - 400 * aT, cx: x0, anim: null, open: false,
      sliders: [{ label: L("القوة F (نيوتن)", "Force F (N)"), min: 1, max: 10, step: .5, val: 5 }], vals: [5],
      goal: L(`الهدف: تسارع a = ${AR(aT)} م/ث²`, `Goal: acceleration a = ${AR(aT)} m/s²`) , cellsAt: SPOTS.force };
  },
  measure(T) {
    const F = T.vals[0], a = F / T.m; T.anim = { mode: "test", a, t: 0, dur: 1.1 };
    return { raw: { F, a }, cells: [AR(F), AR(a)], key: F };
  },
  options(T) { return { q: L("من القراءات، كم تبلغ كتلة الصندوق؟", "From your readings, what is the crate's mass?"), opts: [2, 4, 5].map(m => ({ t: L(`${AR(m)} كغ`, `${AR(m)} kg`), ok: m === T.m, why: m })) }; },
  wrong(T, o, rows) { const r = rows[rows.length - 1].raw; return L(`لو كانت الكتلة ${AR(o.why)} كغ لأعطت القوة ${AR(r.F)}N تسارعًا ${AR(r.F / o.why)}، لكنك قِستِ ${AR(r.a)}.`, `If the mass were ${AR(o.why)} kg, a force of ${AR(r.F)} N would give an acceleration of ${AR(r.F / o.why)}, but you measured ${AR(r.a)}.`); },
  act(T) { const a = T.vals[0] / T.m; T.rot = 0; T.anim = { mode: "act", a, t: 0, dur: 2 }; },
  update(T, dt) {
    const an = T.anim; if (!an) return; an.t += dt;
    const tt = Math.min(an.t, an.mode === "test" ? .8 : 2);
    const px = T.cx; T.cx = Math.max(90, T.x0 - 100 * an.a * tt * tt);
    if (an.t < .3) { Eng.rb.x = T.cx + 70; Eng.rb.dir = -1; }
    if (px - T.cx > 2 && Math.random() < .6) Eng.part(T.cx + 70, GY - 4, { col: "#e9c48a", vx: 40 + Math.random() * 60, vy: -40 - Math.random() * 60, g: 120, life: .7, r: 6 + Math.random() * 8 });
    if (an.t >= an.dur) {
      T.anim = null;
      if (an.mode === "test") { T.cx = T.x0; Eng.testDone(); }
      else { const ok = Math.abs(T.cx - T.gateX) <= 70; if (ok) { T.open = true; Eng.boom(T.gateX, GY - 140, ["#FFE08A", "#FFC83D", "#fff"], 34, 380); }
        else if (T.cx < T.gateX) { T.rot = -.5; Eng.boom(T.cx, GY - 80, ["#c98a4b", "#8a5a2b", "#f2d29b"], 30, 460); Eng.shake = 18; SFX.crash(); }
        else Eng.boom(T.cx, GY - 10, ["#e9c48a"], 10, 120);
        Eng.actDone(ok, T.cx > T.gateX ? L("توقف الصندوق قبل البوابة: تسارع أقل من المطلوب.", "The crate stopped short of the gate: acceleration too low.") : L("اندفع الصندوق متجاوزًا البوابة: تسارع أكبر من المطلوب.", "The crate overshot the gate: acceleration too high.")); }
    }
  },
  busy: T => !!T.anim,
  over(c, T) {
    c.save(); c.translate(T.cx, GY - 68); c.rotate(T.rot || 0); c.drawImage(IMG.crate1, -80, -80, 160, 160); c.restore();
    const ch = Eng.charge; if (ch) { const f = (ch.v - 1) / 9, x = T.cx - 22, y = GY - 420; c.save(); c.fillStyle = "#0b0f2bdd"; c.strokeStyle = "#fff"; c.lineWidth = 4; c.beginPath(); c.roundRect(x, y, 44, 220, 14); c.fill(); c.stroke();
      const g = c.createLinearGradient(0, y + 220, 0, y); g.addColorStop(0, "#5CE08A"); g.addColorStop(.6, "#FFC83D"); g.addColorStop(1, "#ff6b6b"); c.fillStyle = g; c.beginPath(); c.roundRect(x + 6, y + 214 - 208 * f, 32, 208 * f, 9); c.fill();
      c.fillStyle = "#FFE08A"; c.font = "800 38px Cairo"; c.textAlign = "center"; c.fillText(`F = ${AR(Math.round(ch.v * 2) / 2)}`, T.cx, y - 14); c.restore(); }
  },
  draw(c, T, ph) {
    const gi = T.open ? IMG.gateO : IMG.gateC;
    if (ph === "act" || T.open) c.drawImage(gi, T.gateX - 100, GY - 260 + 6, 200, 260);

    if (ph === "act") { c.strokeStyle = "rgba(255,200,61,.6)"; c.setLineDash([10, 10]); c.lineWidth = 3; c.beginPath(); c.moveTo(T.gateX, GY + 28); c.lineTo(T.x0, GY + 28); c.stroke(); c.setLineDash([]); }
  },
  get hint() { return L("a = F ÷ m. غيّري القوة وقارني التسارع: النسبة F÷a ثابتة وتساوي الكتلة.", "a = F ÷ m. Change the force and compare the acceleration: the ratio F÷a stays constant and equals the mass."); },
  robot: { x: 1330, gy: GY }
};

KINDS.light = {
  scene: "light", get cols() { return [L("سقوط i", "Incidence i"), L("انعكاس r", "Reflection r")]; }, panel: "right",
  make(level) {
    for (let tries = 0; tries < 2000; tries++) {
      const E = { x: 230, y: 620, th: 0 }, M = [{ x: level === 1 ? 620 : 560, y: 620, len: 160 }];
      const sol = [ri(level === 1 ? 20 : 15, level === 1 ? 40 : 35)]; let th = 2 * sol[0], sensor;
      if (level === 1) sensor = { x: M[0].x + 380 * Math.cos(rad(th)), y: M[0].y - 380 * Math.sin(rad(th)), r: 46 };
      else {
        const m2 = { x: M[0].x + 300 * Math.cos(rad(th)), y: M[0].y - 300 * Math.sin(rad(th)), len: 160 }; M.push(m2);
        sol.push(ri(0, 180)); const th2 = 2 * sol[1] - th; sensor = { x: m2.x + 300 * Math.cos(rad(th2)), y: m2.y - 300 * Math.sin(rad(th2)), r: 46 };
        const dd = { x: Math.cos(rad(th)), y: -Math.sin(rad(th)) }, nn = { x: Math.sin(rad(sol[1])), y: Math.cos(rad(sol[1])) };
        if (Math.abs(dd.x * nn.x + dd.y * nn.y) < .35) continue;
      }
      if (sensor.x < 260 || sensor.x > 1130 || sensor.y < 150 || sensor.y > 640) continue;
      const walls = level === 3 ? [{ x1: 930, y1: 420, x2: 930, y2: 700 }] : [];
      const T = { E, mirrors: M, sensor, walls };
      if (level >= 2 && Math.hypot(sensor.x - M[1].x, sensor.y - M[1].y) < 200) continue;
      if (!lightSolved(T, sol).ok) continue;
      const rad0 = M.map(() => 45);
      Object.assign(T, { sol, level, anim: null, beam: null, hit: false, goal: L("الهدف: وجّهي الشعاع إلى المستشعر", "Goal: aim the beam at the sensor"),
        sliders: M.map((m, i) => ({ label: M.length > 1 ? L(`المرآة ${AR(i + 1)} (درجة)`, `Mirror ${AR(i + 1)} (deg)`) : L("زاوية المرآة (درجة)", "Mirror angle (deg)"), min: 0, max: i === 0 ? 90 : 180, step: 1, val: rad0[i] })),
        vals: rad0.slice(), cellsAt: SPOTS.light });
      M.forEach((m, i) => m.phi = T.vals[i]);
      return T;
    }
    throw new Error("light gen failed");
  },
  measure(T) {
    T.mirrors[0].phi = T.vals[0]; const solo = trace(T.E, [T.mirrors[0]], []); T.beam = solo.pts; T.beamT = 0; T.anim = { mode: "test", t: 0, dur: 1 };
    const i = Math.round(solo.hits[0] ? solo.hits[0].i : 0);
    return { raw: { i, r: i }, cells: [`${AR(i)}°`, `${AR(i)}°`], key: T.vals[0] };
  },
  options() { return { q: L("ماذا تلاحظين في القراءات؟", "What do you notice in the readings?"), opts: [
    { t: L("زاوية الانعكاس تساوي زاوية السقوط", "The angle of reflection equals the angle of incidence"), ok: true }, { t: L("زاوية الانعكاس ضعف زاوية السقوط", "The angle of reflection is double the angle of incidence"), ok: false, why: 2 }, { t: L("لا علاقة بين الزاويتين", "The two angles are unrelated"), ok: false, why: 0 }] }; },
  wrong(T, o, rows) { const r = rows[rows.length - 1].raw; return o.why === 2 ? L(`في آخر قراءة: i = ${AR(r.i)}° فلو كانت r ضعفها لبلغت ${AR(r.i * 2)}°، لكن الجدول يُظهر ${AR(r.r)}°.`, `In your last reading i = ${AR(r.i)}°, so r would be ${AR(r.i * 2)}° if it were double, but the table shows ${AR(r.r)}°.`) : L(`قارني الصفوف: كلما تغيّرت i تغيّرت r بالقدر نفسه، فالعلاقة واضحة.`, `Compare the rows: whenever i changes, r changes by the same amount, so they are clearly related.`); },
  act(T) {
    T.hit = false; const res = lightSolved(T, T.vals); T.beam = res.r.pts; T.anim = { mode: "act", t: 0, dur: 1.1, ok: res.ok, miss: res.r.hits.length < T.mirrors.length };
  },
  update(T, dt) {
    const an = T.anim; if (!an) return; an.t += dt; T.beamT = Math.min(1, an.t / .7);
    if (an.t >= an.dur) { T.anim = null; if (an.mode === "test") Eng.testDone(); else { const bp = T.beam, A = bp[bp.length - 2], B = bp[bp.length - 1]; let lp = B; if (B.x < 0 || B.x > 1600 || B.y < 0 || B.y > 900) { let t = 1; [[B.x - A.x, 15 - A.x, 1585 - A.x], [B.y - A.y, 15 - A.y, 885 - A.y]].forEach(([d, lo, hi]) => { if (d) [lo / d, hi / d].forEach(q => { if (q > 0 && q < t) t = q; }); }); lp = { x: A.x + (B.x - A.x) * t, y: A.y + (B.y - A.y) * t }; } if (an.ok) { T.hit = true; Eng.boom(T.sensor.x, T.sensor.y, ["#5CE08A", "#BFFFD0", "#fff"], 34, 360); } else if (lp) { Eng.boom(lp.x, lp.y, ["#FFB347", "#FF6B3D", "#FFE08A"], 22, 300); for (let k = 0; k < 14; k++) Eng.part(lp.x + (Math.random() - .5) * 20, lp.y, { col: "rgba(120,120,140,.7)", vx: (Math.random() - .5) * 40, vy: -60 - Math.random() * 80, g: -20, life: 1.6, r: 10 + Math.random() * 14, grow: 18 }); SFX.sizzle(); } Eng.actDone(an.ok, an.miss ? L("الشعاع لم يصل إلى كل المرايا.", "The beam did not reach every mirror.") : L("مرّ الشعاع بجانب المستشعر. عدّلي الزوايا قليلًا.", "The beam passed beside the sensor. Adjust the angles a little.")); } }
  },
  busy: T => !!T.anim,
  draw(c, T, ph) {
    const act = ph === "act", ms = act ? T.mirrors : [T.mirrors[0]];
    if (act) ms.forEach((m, i) => m.phi = T.vals[i]); else T.mirrors[0].phi = T.vals[0];
    const E = T.E; c.drawImage(IMG.emitter, E.x - 70, E.y - 60, 130, 130);
    T.walls.forEach(w => { if (act) c.drawImage(IMG.wall, w.x1 - 60, w.y1 - 10, 120, w.y2 - w.y1 + 12); });
    if (act) c.drawImage(T.hit ? IMG.sensorOn : IMG.sensorOff, T.sensor.x - 56, T.sensor.y - 56, 112, 112);
    if (T.beam && T.beamT > 0) {
      const pts = T.beam; let total = 0; for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      let left = total * T.beamT; c.save(); c.lineCap = "round";
      for (const [w, col] of [[14, "rgba(255,200,61,.25)"], [5, "#FFE08A"]]) {
        c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(pts[0].x, pts[0].y); let l = left;
        for (let i = 1; i < pts.length && l > 0; i++) { const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y), f = Math.min(1, l / d); c.lineTo(pts[i - 1].x + (pts[i].x - pts[i - 1].x) * f, pts[i - 1].y + (pts[i].y - pts[i - 1].y) * f); l -= d; }
        c.stroke();
      } c.restore();
    }
    if (Eng.grab != null && T.mirrors[Eng.grab]) { const m = T.mirrors[Eng.grab], rx = Eng.rb.x, ry = Eng.robotY() - 210; c.save(); c.strokeStyle = "rgba(127,232,255,.8)"; c.lineWidth = 4; c.setLineDash([10, 8]); c.lineDashOffset = -Eng.t * 60; c.beginPath(); c.moveTo(rx, ry); c.quadraticCurveTo((rx + m.x) / 2, Math.min(ry, m.y) - 80, m.x, m.y); c.stroke(); c.setLineDash([]); c.strokeStyle = "rgba(127,232,255,.9)"; c.beginPath(); c.arc(m.x, m.y, 100 + Math.sin(Eng.t * 6) * 6, 0, 7); c.stroke(); c.restore(); }
    else if (ph === "measure" || ph === "act") { const k = Eng.nearMirror(); if (k != null) { const m = T.mirrors[k]; c.save(); c.fillStyle = "#FFC83D"; c.font = "800 30px Cairo"; c.textAlign = "center"; c.fillText(L("↓ أمسكي المرآة", "↓ grab mirror"), m.x, m.y - 100 + Math.sin(Eng.t * 4) * 5); c.restore(); } }
    ms.forEach(m => { const u = { x: Math.cos(rad(m.phi)), y: -Math.sin(rad(m.phi)) };
      c.save(); c.lineCap = "round"; c.strokeStyle = "#1c2a4a"; c.lineWidth = 16; c.beginPath(); c.moveTo(m.x - u.x * m.len / 2, m.y - u.y * m.len / 2); c.lineTo(m.x + u.x * m.len / 2, m.y + u.y * m.len / 2); c.stroke();
      c.strokeStyle = "#BFEFFF"; c.lineWidth = 8; c.stroke(); c.fillStyle = "#FFC83D"; c.beginPath(); c.arc(m.x, m.y, 9, 0, 7); c.fill(); c.restore(); });
  },
  get hint() { return L("قِسي الزاوية بين الشعاع والعمودي على المرآة. الارتداد يحفظ هذه الزاوية. غيّري زاوية المرآة فتدور الزاوية المنعكسة ضعف ما دارت المرآة.", "Measure the angle between the beam and the normal to the mirror. Reflection keeps this angle. Rotate the mirror and the reflected beam turns twice as much."); },
  robot: { x: 1330, gy: GY }
};

function gpath(M, v) {
  const dth = 20 * M / (v * v), pts = []; let y = 650;
  for (let x = 330; x <= 1700; x += 5) { const s = ease(clamp((x - 500) / 500, 0, 1)); pts.push({ x, y }); y -= Math.tan(rad(dth * s)) * 5; }
  return { pts, dth };
}
KINDS.gravity = {
  scene: "gravity", get cols() { return [L("السرعة v", "Speed v"), L("الانحراف Δθ", "Deflection Δθ")]; }, panel: "left",
  make(level) {
    const M = rnd([2, 3, 4]), opts = [1.5, 2, 2.5, 3].filter(v => { const d = 20 * M / (v * v); return d >= 8 && d <= 30; }), vs = rnd(opts);
    const path = gpath(M, vs), ringY = path.pts.find(p => p.x >= 1300).y, ast = [];
    if (level >= 2) ast.push({ x: 1300, y: ringY - 130, k: "astA", s: 90 });
    if (level >= 3) ast.push({ x: 1300, y: ringY + 135, k: "astB", s: 80 }, { x: 1010, y: path.pts.find(p => p.x >= 1010).y + 120, k: "astC", s: 70 });
    return { M, vs, ring: { x: 1300, y: ringY }, ast, anim: null, trail: null, hit: false, dthT: Math.round(path.dth * 10) / 10,
      sliders: [{ label: L("سرعة الإطلاق v", "Launch speed v"), min: 1, max: 10, step: .5, val: 5 }], vals: [5], goal: L(`الانحراف المطلوب تقريبًا Δθ ≈ ${AR(Math.round(path.dth * 10) / 10)}°`, `Required deflection Δθ ≈ ${AR(Math.round(path.dth * 10) / 10)}°`), cellsAt: SPOTS.gravity };
  },
  launch(T, v, lim) {
    const p = gpath(T.M, v); let end = p.pts.length - 1, res = "out"; const act = lim === undefined;
    for (let i = 0; i < p.pts.length; i++) { const q = p.pts[i];
      if (!act && q.x > 1100) { end = i; res = "test"; break; }
      if (act) {
        if (T.ast.some(a => Math.hypot(q.x - a.x, q.y - a.y) < a.s * .55 + 12)) { end = i; res = "ast"; break; }
        if (Math.hypot(q.x - T.ring.x, q.y - T.ring.y) <= 42) { end = i; res = "ring"; break; }
        if (q.y < 20) { end = i; res = "out"; break; }
        if (Math.hypot(q.x - 750, q.y - 240) < 110) { end = i; res = "planet"; break; }
      } }
    return { pts: p.pts.slice(0, end + 1), res, dth: p.dth };
  },
  measure(T) { T.dead = false; const L = this.launch(T, T.vals[0], 1), d = Math.round(L.dth * 10) / 10; T.trail = L.pts; T.anim = { mode: "test", t: 0, dur: 1.2, res: L.res };
    return { raw: { v: T.vals[0], d }, cells: [AR(T.vals[0]), `${AR(d)}°`], key: T.vals[0] }; },
  options() { return { q: L("ما العلاقة بين سرعة المسبار وانحرافه؟", "What is the relation between the probe's speed and its deflection?"), opts: [
    { t: L("الانحراف يتناسب مع 1/v²: ضعف السرعة يعني ربع الانحراف", "Deflection ∝ 1/v²: double the speed means a quarter of the deflection"), ok: true }, { t: L("الانحراف يتناسب مع 1/v: ضعف السرعة يعني نصف الانحراف", "Deflection ∝ 1/v: double the speed means half the deflection"), ok: false, why: 1 }, { t: L("الانحراف لا يعتمد على السرعة", "Deflection does not depend on speed"), ok: false, why: 0 }] }; },
  wrong(T, o, rows) { const a = rows[0].raw, b = rows[rows.length - 1].raw; return o.why === 0 ? L(`انظري: عند v=${AR(a.v)} كان الانحراف ${AR(a.d)}° وعند v=${AR(b.v)} كان ${AR(b.d)}°، إذن السرعة تؤثّر.`, `Look: at v=${AR(a.v)} the deflection was ${AR(a.d)}° and at v=${AR(b.v)} it was ${AR(b.d)}°, so speed matters.`) : L(`قارني ${AR(a.d)}° عند v=${AR(a.v)} و${AR(b.d)}° عند v=${AR(b.v)}: احسبي Δθ×v² و Δθ×v في الصفين، أيّهما يبقى ثابتًا؟`, `Compare ${AR(a.d)}° at v=${AR(a.v)} with ${AR(b.d)}° at v=${AR(b.v)}: compute Δθ×v² and Δθ×v for both rows. Which stays constant?`); },
  act(T) { T.hit = false; T.dead = false; const L = this.launch(T, T.vals[0]); T.trail = L.pts; T.anim = { mode: "act", t: 0, dur: 1.8, res: L.res, last: L.pts[L.pts.length - 1] }; },
  update(T, dt) {
    const an = T.anim; if (!an) return; an.t += dt; const crash = an.res === "ast" || an.res === "planet";
    if (an.mode === "act" && crash && an.t > an.dur - .5 && !an.sl) { an.sl = 1; Eng.slow = .9; }
    if (an.t >= an.dur) { T.anim = null; if (an.mode === "test") Eng.testDone(); else if (an.res === "ring") { T.hit = true; Eng.boom(T.ring.x, T.ring.y, ["#FFE08A", "#FFC83D", "#fff"], 40, 420); Eng.actDone(true); } else {
      if (crash) { T.dead = true; Eng.boom(an.last.x, an.last.y, ["#FFB347", "#FF6B3D", "#FFF3B0", "#9a9aa8"], 46, 520); Eng.shake = 24; SFX.crash(); }
      const dy = an.last.y - T.ring.y; Eng.actDone(false, an.res === "ast" ? L("اصطدم المسبار بكويكب.", "The probe hit an asteroid.") : an.res === "planet" ? L("اصطدم المسبار بالكوكب.", "The probe hit the planet.") : (dy < 0 ? L("مرّ المسبار فوق الحلقة: انحراف أكبر من اللازم.", "The probe passed above the ring: too much deflection.") : L("مرّ المسبار تحت الحلقة: انحراف أقل من اللازم.", "The probe passed below the ring: too little deflection."))); } }
  },
  busy: T => !!T.anim,
  draw(c, T, ph) {
    const act = ph === "act"; c.drawImage(IMG.planetU, 750 - 130, 240 - 130, 260, 260);
    c.save(); c.strokeStyle = "rgba(255,255,255,.18)"; c.setLineDash([8, 14]); c.lineWidth = 3; c.beginPath(); c.moveTo(330, 650); c.lineTo(500, 650); c.stroke(); c.restore();
    if (act) { T.ast.forEach(a => c.drawImage(IMG[a.k], a.x - a.s, a.y - a.s * .9, a.s * 2, a.s * 1.8)); c.drawImage(IMG.ring, T.ring.x - 70, T.ring.y - 70, 140, 140); }
    let pos = { x: 330, y: 650 }, ang = 0; const dg = Eng.drag;
    c.save(); c.lineCap = "round"; c.strokeStyle = "#6b4a2b"; c.lineWidth = 16; c.beginPath(); c.moveTo(320, 820); c.lineTo(320, 730); c.lineTo(345, 600); c.moveTo(320, 730); c.lineTo(345, 700); c.stroke(); c.restore();
    if (dg) { const dx = dg.x - 330, dy = dg.y - 650, d = Math.hypot(dx, dy), k = Math.min(1, 220 / (d || 1)); pos = { x: 330 + dx * k, y: 650 + dy * k }; ang = Math.atan2(-dy, -dx);
      c.save(); c.strokeStyle = "#ff8a5c"; c.lineWidth = 7; c.beginPath(); c.moveTo(345, 600); c.lineTo(pos.x, pos.y); c.lineTo(345, 700); c.stroke();
      c.fillStyle = "#FFE08A"; c.font = "800 36px Cairo"; c.textAlign = "center"; c.fillText(`v = ${AR(T.vals[0])}`, pos.x, pos.y - 70); c.restore(); }
    else if (!T.trail && (ph === "measure" || ph === "act") && !T.anim) { c.save(); c.globalAlpha = .6 + .4 * Math.sin(Eng.t * 4); c.fillStyle = "#FFC83D"; c.font = "800 28px Cairo"; c.textAlign = "center"; c.fillText(L("اسحبي ← ثم اتركي", "Pull back ← and release"), 330, 560); c.restore();
      c.save(); c.strokeStyle = "#ff8a5c"; c.lineWidth = 6; c.beginPath(); c.moveTo(345, 600); c.lineTo(330, 650); c.lineTo(345, 700); c.stroke(); c.restore(); }
    if (T.trail && !dg) {
      const f = T.anim ? Math.min(1, T.anim.t / T.anim.dur) : 1, n = Math.max(1, Math.floor((T.trail.length - 1) * f));
      c.save(); c.strokeStyle = "rgba(255,224,138,.8)"; c.lineWidth = 5; c.setLineDash([2, 12]); c.lineCap = "round"; c.beginPath(); c.moveTo(T.trail[0].x, T.trail[0].y);
      for (let i = 1; i <= n; i++) c.lineTo(T.trail[i].x, T.trail[i].y); c.stroke(); c.restore();
      pos = T.trail[n]; const pv = T.trail[Math.max(0, n - 2)]; ang = Math.atan2(pos.y - pv.y, pos.x - pv.x);
    }
    if (!T.dead) { c.save(); c.translate(pos.x, pos.y); c.rotate(ang + (Eng.slow > 0 ? Eng.t * 14 : 0)); c.drawImage(IMG.probe, -55, -46, 110, 92); c.restore(); }
  },
  get hint() { return L("إذا ضاعفتِ السرعة صار الانحراف الربع. احسبي Δθ×v² من قراءتك: هذا الثابت يعطيك السرعة المطلوبة: v = √(ثابت ÷ Δθ).", "Doubling the speed makes the deflection a quarter. Compute Δθ×v² from your readings: this constant gives the needed speed: v = √(constant ÷ Δθ)."); },
  robot: { x: 150, gy: 730 }
};

/* ============ المحرّك ============ */
const Eng = {
  w: null, wi: 0, si: 0, ti: 0, tasks: null, T: null, K: null, energy: 10, phase: "idle", rows: [], cells: [], fx: [], t: 0,
  parts: [], shake: 0, slow: 0, charge: null, grab: null, gacc: 0, drag: null, bubble: null, idleT: 0, code: null, sandbox: false, t0: 0, lowSaid: false,
  robot: { s: "idle", hold: 0 }, rb: { x: 0, vx: 0, sq: 0, dir: -1, jh: 0, vy: 0, air: false, moving: false }, keys: { l: 0, r: 0, j: 0 }, losses: 0, lawOk: false, hintUsed: false, solved: false, locked: false,
  start(wi, si, opts = {}) {
    this.wi = wi; this.si = si; this.w = WORLDS[wi]; this.energy = ENERGY_MAX; this.ti = 0; this.solved = false; this.locked = false;
    this.code = opts.code || null; this.sandbox = !!opts.lab; this.t0 = performance.now();
    const key = `${wi}-${si}`; this.losses = Save.d.losses[key] || 0;
    this.tasks = this.sandbox ? [{ kind: this.w.law, level: [2, 2, 3][wi] }] : this.w.stages[si].tasks; this.beginTask();
  },
  beginTask() {
    const d = this.tasks[this.ti]; this.K = KINDS[d.kind];
    if (this.code) RNG = seeded(`${this.code}|${this.wi}|${this.si}|${this.ti}`);
    this.T = this.K.make(d.level); this.rows = []; this.fx = []; this.parts = []; this.charge = null; this.grab = null; this.drag = null; this.lowSaid = false;
    const n = this.tasks.length > 1 ? 2 : 4; this.cells = this.sandbox ? [] : shuffle(this.K.cellsAt || this.T.cellsAt).slice(0, n).map(p => ({ x: p[0], y: p[1], got: false }));
    RNG = Math.random;
    Object.assign(this.rb, { x: this.K.robot.x, vx: 0, dir: -1, jh: 0, vy: 0, air: false, moving: false });
    if (this.sandbox) { const T = this.T, sc = this.K.scene;
      if (sc === "force") { T.sliders.push({ label: L("كتلة الصندوق m (كغ)", "Crate mass m (kg)"), min: 1, max: 10, step: .5, key: "m" }); T.vals.push(T.m); T.goal = L("المختبر الحر: غيّري القوة والكتلة وراقبي التسارع", "Free lab: change force and mass and watch the acceleration"); }
      if (sc === "gravity") { T.sliders.push({ label: L("كتلة الكوكب M", "Planet mass M"), min: 1, max: 6, step: .5, key: "M" }); T.vals.push(T.M); T.goal = L("المختبر الحر: غيّري السرعة وكتلة الكوكب", "Free lab: change the speed and the planet's mass"); }
      if (sc === "light") T.goal = L("المختبر الحر: وجّهي الشعاع كما تشائين", "Free lab: bounce the beam however you like");
      T.sliders.forEach((s, i) => s.val = T.vals[i]); }
    this.hintUsed = false; this.phase = this.sandbox ? "act" : this.w.id === 4 ? "law" : "measure"; UI.onPhase();
    this.say(this.sandbox ? "lab" : "start", true);
  },
  robotY() { return (this.w.gt ? Math.min(this.K.robot.gy, GY) : this.K.robot.gy) - this.rb.jh; },
  part(x, y, o) { if (this.parts.length < 400) this.parts.push(Object.assign({ x, y, vx: 0, vy: 0, g: 600, life: 1, t: 0, r: 6, col: "#fff", grow: 0 }, o)); },
  boom(x, y, cols, n = 24, sp = 400) { for (let k = 0; k < n; k++) { const a = Math.random() * Math.PI * 2, v = sp * (.3 + Math.random() * .7); this.part(x, y, { col: cols[k % cols.length], vx: Math.cos(a) * v, vy: Math.sin(a) * v - sp * .3, g: 700, life: .6 + Math.random() * .6, r: 4 + Math.random() * 7 }); } },
  say(key, force = false) {
    const pool = SAY[key]; if (!pool) return; if (this.bubble && this.bubble.t < this.bubble.dur - .3 && !force) return;
    const p = pool[Math.floor(Math.random() * pool.length)]; this.bubble = { txt: LANG === "en" ? p[1] : p[0], t: 0, dur: 2.9 };
  },
  busyNow() { return !this.T || this.K.busy(this.T) || this.locked || (this.phase !== "measure" && this.phase !== "act") || !!document.querySelector("#modal:not(.hidden)"); },
  pressStart() { this.idleT = 0; if (this.busyNow()) return; if (this.K.scene === "force") { this.charge = { v: 1, t: 0, st: 0 }; this.grab = null; this.bubble = null; } },
  pressEnd() {
    const ch = this.charge; this.charge = null; if (this.busyNow()) return;
    if (ch && ch.t > .15) { this.T.vals[0] = Math.round(ch.v * 2) / 2; UI.syncSlider(0); }
    if (this.phase === "measure") this.test(); else this.act();
  },
  nearMirror() { if (!this.T || this.K.scene !== "light") return null; const ms = this.phase === "act" ? this.T.mirrors : [this.T.mirrors[0]]; let best = null, bd = 130;
    ms.forEach((m, i) => { const d = Math.abs(this.rb.x - m.x); if (d < bd) { bd = d; best = i; } }); return best; },
  toggleGrab() {
    if (this.K.scene !== "light" || this.busyNow()) return;
    if (this.grab != null) { this.grab = null; SFX.click(); return; }
    const k = this.nearMirror(); if (k == null) { UI.toast(L("اقتربي من المرآة أولًا، ثم اضغطي ↓", "Walk to a mirror first, then press ↓")); return; }
    this.grab = k; this.gacc = 0; SFX.click(); this.say("grab", true);
  },
  pointer(type, x, y) {
    if (type === "down") { this.idleT = 0; this.collect(x, y);
      if (this.K && this.K.scene === "gravity" && !this.busyNow() && Math.hypot(x - 330, y - 650) < 140) { this.drag = { x, y }; this.T.trail = null; } return; }
    if (!this.drag) return;
    if (type === "move") { this.drag = { x, y }; const d = Math.hypot(x - 330, y - 650), v = Math.round((1 + 9 * clamp(d, 0, 220) / 220) * 2) / 2; if (v !== this.T.vals[0]) { this.T.vals[0] = v; UI.syncSlider(0); SFX.tick(); } }
    if (type === "up") { const d = Math.hypot(x - 330, y - 650); this.drag = null; if (d > 25) this.pressEnd(); }
  },
  setRobot(s, hold = 1.2) { this.robot.s = s; this.robot.hold = hold; },
  gain(n) { this.energy = clamp(this.energy + n, 0, ENERGY_MAX); UI.energy(); },
  spend(n, why) { if (this.sandbox) return; this.energy = Math.max(0, this.energy - n); UI.energy(); this.fx.push({ x: 1370, y: 300, t: 0, txt: `−${AR(n)}`, col: "#ff6b6b" }); SFX.bad(); if (this.energy <= 0) this.lose(); else if (this.energy <= 3 && !this.lowSaid) { this.lowSaid = true; this.say("low", true); } },
  collect(x, y, rr = 70) {
    if (this.locked || this.phase === "law" || this.phase === "done") return;
    for (const c of this.cells) if (!c.got && Math.hypot(c.x - x, c.y - y) < rr) { c.got = true; this.gain(3); SFX.collect(); this.fx.push({ x: c.x, y: c.y - 40, t: 0, txt: L("+٣", "+3"), col: "#5CE08A" }); this.boom(c.x, c.y, ["#5CE08A", "#BFFFD0", "#FFE08A"], 16, 260); this.setRobot("success", .8); this.say("collect"); return; }
  },
  chooseLaw(kind) {
    if (kind === this.tasks[this.ti].kind) { this.phase = "measure"; SFX.good(); UI.onPhase(); UI.toast(L("صحيح! الآن قيسي.", "Correct! Now measure.")); }
    else { this.spend(1); UI.toast(L("ليس هذا القانون المناسب لهذا المشهد (−١ طاقة).", "That is not the right law for this scene (−1 energy).")); this.setRobot("think", 1); }
  },
  test() {
    if (this.K.busy(this.T) || this.phase !== "measure") return;
    this.grab = null; const r = this.K.measure(this.T); this.rows.push(r); this.setRobot("scan", 2); SFX.test(); UI.panel(); UI.controls(); this.say(this.rows.length === 1 ? "measure1" : "measure");
  },
  testDone() { UI.controls(); },
  canDeduce() { const ks = new Set(this.rows.map(r => r.key)); return ks.size >= 2; },
  deduce() { if (this.K.busy(this.T)) return; if (!this.canDeduce()) { UI.toast(L("قيسي مرتين على الأقل بقيم مختلفة.", "Measure at least twice with different values.")); return; } this.setRobot("think", 99); UI.deduceModal(this.K.options(this.T)); },
  answer(o) {
    if (o.ok) { const k = this.tasks[this.ti].kind, fresh = !Save.d.laws[k]; Save.d.laws[k] = 1; Save.save(); this.phase = "act"; this.setRobot("success", 1.2); SFX.law(); UI.closeModal(); UI.lawReveal(k, fresh); UI.onPhase(); this.say("law", true); this.boom(this.rb.x, this.robotY() - 150, ["#FFE08A", "#FFC83D", "#BFEFFF"], 30, 380); }
    else { const m = this.K.wrong(this.T, o, this.rows); this.spend(2); UI.wrongAnswer(m); this.setRobot("fail", 1.5); this.say("wrong", true); }
  },
  act() {
    if (this.K.busy(this.T) || this.phase !== "act" || this.locked) return;
    this.grab = null; this.K.act(this.T); this.setRobot(this.K.scene === "force" ? "push" : "scan", 3); ({ force: "push", light: "beam", gravity: "launch" })[this.K.scene] && SFX[{ force: "push", light: "beam", gravity: "launch" }[this.K.scene]](); UI.controls();
  },
  actDone(ok, msg) {
    if (this.sandbox) { const T = this.T, sc = this.K.scene;
      if (sc === "force") { const a = T.vals[0] / T.m; this.rows.push({ cells: [AR(T.vals[0]), AR(a)], key: Math.random() }); }
      if (sc === "gravity") { const d = Math.round(20 * T.M / (T.vals[0] * T.vals[0]) * 10) / 10; this.rows.push({ cells: [AR(T.vals[0]), `${AR(d)}°`], key: Math.random() }); }
      UI.panel(); this.setRobot(ok ? "success" : "fail", 1.2); this.say(ok ? "good" : "labmiss", true); if (ok) SFX.good(); else UI.toast(msg);
      setTimeout(() => { if (!this.sandbox || this.T !== T) return; T.open = false; T.hit = false; T.cx = T.x0; T.rot = 0; T.dead = false; UI.controls(); }, 1300); UI.controls(); return; }
    if (ok) { this.say("good", true); SFX.good(); this.setRobot("success", 1.4); const last = this.ti >= this.tasks.length - 1; this.locked = true;
      setTimeout(() => { if (last) this.win(); else { this.ti++; this.locked = false; this.beginTask(); } }, 1100); if (!last) UI.toast(L("أحسنتِ! المهمة التالية…", "Well done! Next task…")); }
    else { this.setRobot("fail", 1.3); this.say("fail", true); UI.toast(msg || L("لم تنجح المحاولة (−١ طاقة).", "That attempt failed (−1 energy).")); this.spend(1); UI.controls(); }
  },
  win() {
    const stars = this.energy >= 6 ? 3 : this.energy >= 3 ? 2 : 1; Save.set(`${this.wi}-${this.si}`, stars); Save.d.losses[`${this.wi}-${this.si}`] = 0; Save.save(); SFX.win(); this.phase = "done"; UI.winModal(stars);
  },
  lose() { if (this.phase === "done") return; this.phase = "done"; this.locked = true; const key = `${this.wi}-${this.si}`; this.losses++; Save.d.losses[key] = this.losses; Save.save(); SFX.lose(); this.setRobot("fail", 99); setTimeout(() => UI.loseModal(), 500); },
  hint() {
    if (this.phase === "done") return; const free = this.losses >= 2 || this.hintUsed;
    if (!free) { if (this.energy <= 1) { UI.toast(L("طاقتك لا تكفي للتلميح.", "Not enough energy for a hint.")); return; } this.spend(1); }
    this.hintUsed = true; UI.hintModal(this.K.hint, free);
  },
  update(dt) {
    this.t += dt; if (!this.T) return;
    const sdt = this.slow > 0 ? dt * .28 : dt; if (this.slow > 0) this.slow -= dt; this.shake = Math.max(0, this.shake - dt * 40);
    const r = this.robot; if (r.hold > 0) { r.hold -= dt; if (r.hold <= 0) r.s = "idle"; }
    const ch = this.charge; if (ch) { if (this.busyNow()) this.charge = null; else { ch.t += dt; ch.v = Math.min(10, 1 + Math.max(0, ch.t - .15) * 4.2); this.rb.x = this.T.cx + 70; this.rb.dir = -1; this.setRobot("push", .2);
      const st = Math.floor(ch.v * 2); if (st !== ch.st) { ch.st = st; SFX.tone(200 + ch.v * 70, .05, "triangle", .03); } } }
    this.moveRobot(dt); this.K.update(this.T, sdt); this.fx.forEach(f => f.t += dt); this.fx = this.fx.filter(f => f.t < 1.2);
    this.parts.forEach(p => { p.t += sdt; p.vy += p.g * sdt; p.x += p.vx * sdt; p.y += p.vy * sdt; p.r += p.grow * sdt; }); this.parts = this.parts.filter(p => p.t < p.life);
    if (this.bubble) { this.bubble.t += dt; if (this.bubble.t > this.bubble.dur) this.bubble = null; }
    const quiet = !this.keys.l && !this.keys.r && !this.charge && !this.drag && !this.K.busy(this.T) && (this.phase === "measure" || this.phase === "act") && !document.querySelector("#modal:not(.hidden)");
    if (quiet) { this.idleT += dt; if (this.idleT > 15) { this.idleT = 0; this.say("idle"); } } else this.idleT = 0;
  },
  moveRobot(dt) {
    const b = this.rb, can = !document.querySelector("#modal:not(.hidden)") && this.phase !== "law" && this.phase !== "done" && this.phase !== "idle";
    if (this.keys.g) { this.keys.g = 0; if (can) this.toggleGrab(); }
    let dx = can ? (this.keys.r - this.keys.l) : 0;
    if (this.grab != null) { if (!can || this.K.busy(this.T)) this.grab = null; else { const i = this.grab, s = this.T.sliders[i]; this.gacc += dx * 30 * dt; const st = Math.trunc(this.gacc);
      if (st) { this.gacc -= st; this.T.vals[i] = clamp(this.T.vals[i] + st, s.min, s.max); this.T.mirrors[i].phi = this.T.vals[i]; this.T.beam = null; UI.syncSlider(i); SFX.tick(); } if (dx) this.setRobot("scan", .2); dx = 0; } }
    if (this.charge) dx = 0;
    const target = dx * 420, acc = (dx ? 2600 : 3400) * dt;
    b.vx += clamp(target - b.vx, -acc, acc); b.moving = Math.abs(b.vx) > 40 && !b.air; if (Math.abs(b.vx) > 20) b.dir = b.vx > 0 ? 1 : -1;
    b.x = clamp(b.x + b.vx * dt, 90, 1510); if (b.x <= 90 || b.x >= 1510) b.vx = 0;
    if (this.keys.j) { if (can && !b.air) { b.air = true; b.vy = 1000; b.sq = -.12; SFX.tone(420, .2, "square", .04, 0, 780); } this.keys.j = 0; }
    if (b.air) { b.vy -= 1900 * dt; b.jh += b.vy * dt; if (b.jh <= 0) { b.jh = 0; b.air = false; b.vy = 0; b.sq = .14; SFX.tone(110, .08, "sine", .05); } }
    b.sq += (0 - b.sq) * Math.min(1, dt * 12);
    if (can) { const gy = this.w.gt ? Math.min(this.K.robot.gy, GY) : this.K.robot.gy; this.collect(b.x, gy - 105 - b.jh, 95); }
    if (b.moving && Math.floor(this.t * 5) !== this._st) { this._st = Math.floor(this.t * 5); SFX.tone(140, .05, "square", .012); }
  },
  draw(c) {
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H); const w = this.w; if (!w || !this.T) return;
    if (this.shake > 0) c.translate((Math.random() - .5) * this.shake, (Math.random() - .5) * this.shake);
    { const off = clamp((this.rb.x - 800) * .05, -40, 40); c.drawImage(IMG["bg" + w.id], -48 - off, -27, W * 1.06, H * 1.06); }
    if (w.gt) for (let x = 0; x < W; x += 600) c.drawImage(IMG[w.gt], x, GY, 600, 220);
    this.K.draw(c, this.T, this.phase);
    this.cells.forEach((p, i) => { if (!p.got) { const bob = Math.sin(this.t * 3 + i) * 6; c.drawImage(IMG.pickup, p.x - 38, p.y - 45 + bob, 76, 90); } });
    this.parts.forEach(p => { c.globalAlpha = Math.max(0, 1 - p.t / p.life); c.fillStyle = p.col; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 7); c.fill(); }); c.globalAlpha = 1;
    this.drawRobot(c); if (this.K.over) this.K.over(c, this.T); this.drawBubble(c);
    this.fx.forEach(f => { c.save(); c.globalAlpha = 1 - f.t / 1.2; c.fillStyle = f.col; c.font = "800 44px Cairo"; c.textAlign = "center"; c.fillText(f.txt, f.x, f.y - f.t * 60); c.restore(); });
  },
  drawBubble(c) {
    const b = this.bubble; if (!b) return; const a = Math.min(1, b.t * 6, (b.dur - b.t) * 4); if (a <= 0) return;
    c.save(); c.globalAlpha = a; c.font = "700 27px Cairo"; c.direction = LANG === "en" ? "ltr" : "rtl"; c.textAlign = "center";
    const words = b.txt.split(" "), lines = []; let cur = ""; words.forEach(w => { const t = cur ? cur + " " + w : w; if (c.measureText(t).width > 380 && cur) { lines.push(cur); cur = w; } else cur = t; }); lines.push(cur);
    const wd = Math.max(...lines.map(l => c.measureText(l).width)) + 44, ht = lines.length * 38 + 24, x = clamp(this.rb.x, wd / 2 + 20, W - wd / 2 - 20), y = this.robotY() - 250 - ht - (1 - Math.min(1, b.t * 6)) * 14;
    c.fillStyle = "#fff"; c.strokeStyle = "#1c2250"; c.lineWidth = 4; c.beginPath(); c.roundRect(x - wd / 2, y, wd, ht, 22); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(clamp(this.rb.x, x - wd / 2 + 30, x + wd / 2 - 30) - 14, y + ht - 2); c.lineTo(clamp(this.rb.x, x - wd / 2 + 30, x + wd / 2 - 30), y + ht + 22); c.lineTo(clamp(this.rb.x, x - wd / 2 + 30, x + wd / 2 - 30) + 14, y + ht - 2); c.fill();
    c.fillStyle = "#1c2250"; lines.forEach((l, i) => c.fillText(l, x, y + 44 + i * 38)); c.restore();
  },
  drawRobot(c) {
    let s = this.robot.s; if (s === "idle" && this.energy <= 3 && this.phase !== "done") s = "low"; if (s === "idle" || s === "low") { if (this.rb.air) s = "jump"; else if (this.rb.moving) s = "roll"; } if (this.phase === "measure" && s === "idle" && this.K.busy(this.T)) s = "scan";
    if (this.phase === "deduce") s = "think"; const n = ROBOT[s]; const f = (Math.floor(this.t * (s === "roll" ? 10 : 6)) % n) + 1, im = IMG[`r_${s}_${f}`]; if (!im) return;
    const R = this.K.robot, w = 300, h = w * im.height / im.width; c.save(); c.translate(this.rb.x, (this.w.gt ? Math.min(R.gy, GY) : R.gy) - this.rb.jh); c.scale(this.rb.dir < 0 ? -1 : 1, 1); c.scale(1 - this.rb.sq * .6, 1 + this.rb.sq); c.drawImage(im, -w / 2, -222 * (w / 300), w, h); c.restore();
  }
};
