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
      goal: L(`الهدف: تسارع ${FX(`a = ${AR(aT)}`)} م/ث²`, `Goal: acceleration a = ${AR(aT)} m/s²`) , cellsAt: SPOTS.force };
  },
  measure(T) {
    const F = T.vals[0], a = F / T.m; T.anim = { mode: "test", a, t: 0, dur: 1.1 };
    return { raw: { F, a }, cells: [AR(F), AR2(a)], key: F };
  },
  options(T) { return { q: L("من القراءات، كم تبلغ كتلة الصندوق؟", "From your readings, what is the crate's mass?"), opts: [2, 4, 5].map(m => ({ t: L(`${AR(m)} كغ`, `${AR(m)} kg`), ok: m === T.m, why: m })) }; },
  wrong(T, o, rows) { const r = rows[rows.length - 1].raw; return L(`لو كانت الكتلة ${AR(o.why)} كغ لأعطت القوة ${AR(r.F)}N تسارعًا ${AR(r.F / o.why)}، لكنك قِستِ ${AR(r.a)}.`, `If the mass were ${AR(o.why)} kg, a force of ${AR(r.F)} N would give an acceleration of ${AR(r.F / o.why)}, but you measured ${AR(r.a)}.`); },
  act(T) { const a = T.vals[0] / T.m; T.rot = 0; T.anim = { mode: "act", a, t: 0, dur: 2 }; },
  update(T, dt) {
    const an = T.anim; if (!an) return; an.t += dt;
    const tt = Math.min(an.t, an.mode === "test" ? .8 : 2);
    const px = T.cx; T.cx = Math.max(90, T.x0 - 100 * an.a * tt * tt);
    if (an.t < .3) { const pr = (Eng.players[T.pusher || 0] || Eng.P).rb; pr.x = T.cx + 100; pr.dir = -1; }
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
  proof: { get h() { return "F ÷ a"; }, f: r => r.F / r.a },
  sol(T) { const F = T.vals[0]; return L(`${FX(`F = m × a = ${AR(T.m)} × ${AR2(T.aT)} = ${AR2(T.m * T.aT)}`)} نيوتن`, `F = m × a = ${T.m} × ${AR2(T.aT)} = ${AR2(T.m * T.aT)} N`) + (Math.abs(F - T.m * T.aT) > 1e-6 ? L(` (استخدمتِ ${AR(F)})`, ` (you used ${F})`) : ""); },
  over(c, T) {
    c.save(); c.translate(T.cx, GY - 68); c.rotate(T.rot || 0); c.drawImage(IMG.crate1, -80, -80, 160, 160); c.restore();
    if (Eng.boss && !T.anim) { c.save(); c.fillStyle = "#0b0f2bdd"; c.beginPath(); c.roundRect(T.cx - 78, GY - 205, 156, 44, 14); c.fill(); c.fillStyle = "#FFE08A"; c.font = "800 28px Cairo"; c.textAlign = "center"; c.direction = LANG === "en" ? "ltr" : "rtl"; c.fillText(L(`m = ${AR(T.m)} كغ`, `m = ${AR(T.m)} kg`), T.cx, GY - 173); c.restore(); }
    const ch = Eng.charge; if (ch) { const f = (ch.v - 1) / 9, x = T.cx - 22, y = GY - 420; c.save(); c.fillStyle = "#0b0f2bdd"; c.strokeStyle = "#fff"; c.lineWidth = 4; c.beginPath(); c.roundRect(x, y, 44, 220, 14); c.fill(); c.stroke();
      const g = c.createLinearGradient(0, y + 220, 0, y); g.addColorStop(0, "#5CE08A"); g.addColorStop(.6, "#FFC83D"); g.addColorStop(1, "#ff6b6b"); c.fillStyle = g; c.beginPath(); c.roundRect(x + 6, y + 214 - 208 * f, 32, 208 * f, 9); c.fill();
      c.fillStyle = "#FFE08A"; c.font = "800 38px Cairo"; c.textAlign = "center"; c.fillText(`F = ${AR(Math.round(ch.v * 2) / 2)}`, T.cx, y - 14); c.restore(); }
  },
  draw(c, T, ph) {
    const gi = T.open ? IMG.gateO : IMG.gateC;
    if ((ph === "act" || T.open) && !Eng.boss) c.drawImage(gi, T.gateX - 100, GY - 260 + 6, 200, 260);

    if (ph === "act") { c.strokeStyle = "rgba(255,200,61,.6)"; c.setLineDash([10, 10]); c.lineWidth = 3; c.beginPath(); c.moveTo(T.gateX, GY + 28); c.lineTo(T.x0, GY + 28); c.stroke(); c.setLineDash([]); }
  },
  get hint() { return L("a = F ÷ m. غيّري القوة وقارني التسارع: النسبة F÷a ثابتة وتساوي الكتلة.", "a = F ÷ m. Change the force and compare the acceleration: the ratio F÷a stays constant and equals the mass."); },
  robot: { x: 1330, gy: GY }, terminal: 200, hz: [260, 960], frags: [[430, 360], [640, 350], [860, 340]]
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
    const m = T.mirrors[0], n = { x: Math.sin(rad(m.phi)), y: Math.cos(rad(m.phi)) }; let i = 0, r = 0;
    if (solo.hits[0] && solo.pts.length >= 3) { const A = solo.pts[1], B = solo.pts[2], dl = Math.hypot(B.x - A.x, B.y - A.y) || 1; i = solo.hits[0].i; r = deg(Math.acos(clamp(Math.abs(((B.x - A.x) * n.x + (B.y - A.y) * n.y) / dl), 0, 1))); }
    i = Math.round(i * 10) / 10; r = Math.round(r * 10) / 10;
    return { raw: { i, r }, cells: [`${AR(i)}°`, `${AR(r)}°`], key: T.vals[0] };
  },
  options() { return { q: L("ماذا تلاحظين في القراءات؟", "What do you notice in the readings?"), opts: [
    { t: L("زاوية الانعكاس تساوي زاوية السقوط", "The angle of reflection equals the angle of incidence"), ok: true }, { t: L("زاوية الانعكاس ضعف زاوية السقوط", "The angle of reflection is double the angle of incidence"), ok: false, why: 2 }, { t: L("لا علاقة بين الزاويتين", "The two angles are unrelated"), ok: false, why: 0 }] }; },
  wrong(T, o, rows) { const r = rows[rows.length - 1].raw; return o.why === 2 ? L(`في آخر قراءة: i = ${AR(r.i)}° فلو كانت r ضعفها لبلغت ${AR(r.i * 2)}°، لكن الجدول يُظهر ${AR(r.r)}°.`, `In your last reading i = ${AR(r.i)}°, so r would be ${AR(r.i * 2)}° if it were double, but the table shows ${AR(r.r)}°.`) : L(`قارني الصفوف: كلما تغيّرت i تغيّرت r بالقدر نفسه، فالعلاقة واضحة.`, `Compare the rows: whenever i changes, r changes by the same amount, so they are clearly related.`); },
  sol(T) { return L(`زاوية السقوط = زاوية الانعكاس، فكانت زاوية ${T.vals.length > 1 ? "المرايا" : "المرآة"} الصحيحة: ${T.vals.map(v => FX(AR(v) + "°")).join(" و ")}`, `Incidence = reflection, so the right mirror angle${T.vals.length > 1 ? "s were" : " was"}: ${T.vals.map(v => v + "°").join(" and ")}`); },
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
    if (act && !Eng.boss) c.drawImage(T.hit ? IMG.sensorOn : IMG.sensorOff, T.sensor.x - 56, T.sensor.y - 56, 112, 112);
    if (act && Eng.boss && !T.anim) { const m0 = T.mirrors[0], r0 = trace(T.E, [m0], []); if (r0.hits.length) { const A = r0.pts[1], B = r0.pts[2], d = Math.hypot(B.x - A.x, B.y - A.y) || 1, n = { x: Math.sin(rad(m0.phi)), y: Math.cos(rad(m0.phi)) };
      c.save(); c.setLineDash([12, 10]); c.lineDashOffset = -Eng.t * 40; c.lineWidth = 5; c.strokeStyle = "rgba(255,224,138,.85)"; c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(A.x + (B.x - A.x) / d * 230, A.y + (B.y - A.y) / d * 230); c.stroke();
      c.strokeStyle = "rgba(255,255,255,.35)"; c.lineWidth = 3; c.beginPath(); c.moveTo(A.x - n.x * 90, A.y - n.y * 90); c.lineTo(A.x + n.x * 90, A.y + n.y * 90); c.stroke(); c.restore(); } }
    if (T.beam && T.beamT > 0) {
      const pts = T.beam; let total = 0; for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      let left = total * T.beamT; c.save(); c.lineCap = "round";
      for (const [w, col] of [[14, "rgba(255,200,61,.25)"], [5, "#FFE08A"]]) {
        c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(pts[0].x, pts[0].y); let l = left;
        for (let i = 1; i < pts.length && l > 0; i++) { const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y), f = Math.min(1, l / d); c.lineTo(pts[i - 1].x + (pts[i].x - pts[i - 1].x) * f, pts[i - 1].y + (pts[i].y - pts[i - 1].y) * f); l -= d; }
        c.stroke();
      } c.restore();
    }
    if (Eng.grab != null && T.mirrors[Eng.grab]) { const gp = (Eng.players[Eng.grabPi] || Eng.P).rb, m = T.mirrors[Eng.grab], rx = gp.x, ry = Eng.gyBase() - gp.jh - 210; c.save(); c.strokeStyle = "rgba(127,232,255,.8)"; c.lineWidth = 4; c.setLineDash([10, 8]); c.lineDashOffset = -Eng.t * 60; c.beginPath(); c.moveTo(rx, ry); c.quadraticCurveTo((rx + m.x) / 2, Math.min(ry, m.y) - 80, m.x, m.y); c.stroke(); c.setLineDash([]); c.strokeStyle = "rgba(127,232,255,.9)"; c.beginPath(); c.arc(m.x, m.y, 100 + Math.sin(Eng.t * 6) * 6, 0, 7); c.stroke(); c.restore(); }
    else if (ph === "measure" || ph === "act") { const k = Eng.nearMirror(); if (k != null) { const m = T.mirrors[k]; c.save(); c.fillStyle = "#FFC83D"; c.font = "800 30px Cairo"; c.textAlign = "center"; c.fillText(L("↓ أمسكي المرآة", "↓ grab mirror"), m.x, m.y - 100 + Math.sin(Eng.t * 4) * 5); c.restore(); } }
    ms.forEach(m => { const u = { x: Math.cos(rad(m.phi)), y: -Math.sin(rad(m.phi)) };
      c.save(); c.lineCap = "round"; c.strokeStyle = "#1c2a4a"; c.lineWidth = 16; c.beginPath(); c.moveTo(m.x - u.x * m.len / 2, m.y - u.y * m.len / 2); c.lineTo(m.x + u.x * m.len / 2, m.y + u.y * m.len / 2); c.stroke();
      c.strokeStyle = "#BFEFFF"; c.lineWidth = 8; c.stroke(); c.fillStyle = "#FFC83D"; c.beginPath(); c.arc(m.x, m.y, 9, 0, 7); c.fill(); c.restore(); });
  },
  get hint() { return L("قِسي الزاوية بين الشعاع والعمودي على المرآة. الارتداد يحفظ هذه الزاوية. غيّري زاوية المرآة فتدور الزاوية المنعكسة ضعف ما دارت المرآة.", "Measure the angle between the beam and the normal to the mirror. Reflection keeps this angle. Rotate the mirror and the reflected beam turns twice as much."); },
  robot: { x: 1330, gy: GY }, terminal: 400, hz: [740, 1160], frags: [[860, 360], [1040, 350], [1200, 370]]
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
    return { M, vs, ring: { x: 1300, y: ringY }, ast, anim: null, trail: null, hit: false, dthT: Math.round(path.dth * 100) / 100,
      sliders: [{ label: L("سرعة الإطلاق v", "Launch speed v"), min: 1, max: 10, step: .5, val: 5 }], vals: [5], goal: L(`الانحراف المطلوب ${FX(`Δθ = ${AR2(path.dth)}°`)}`, `Required deflection Δθ = ${AR2(path.dth)}°`), cellsAt: SPOTS.gravity };
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
  measure(T) { T.dead = false; const L = this.launch(T, T.vals[0], 1), d = Math.round(L.dth * 100) / 100; T.trail = L.pts; T.anim = { mode: "test", t: 0, dur: 1.2, res: L.res };
    return { raw: { v: T.vals[0], d: L.dth }, cells: [AR(T.vals[0]), `${AR2(d)}°`], key: T.vals[0] }; },
  options() { return { q: L("ما العلاقة بين سرعة المسبار وانحرافه؟", "What is the relation between the probe's speed and its deflection?"), opts: [
    { t: L("الانحراف يتناسب مع 1/v²: ضعف السرعة يعني ربع الانحراف", "Deflection ∝ 1/v²: double the speed means a quarter of the deflection"), ok: true }, { t: L("الانحراف يتناسب مع 1/v: ضعف السرعة يعني نصف الانحراف", "Deflection ∝ 1/v: double the speed means half the deflection"), ok: false, why: 1 }, { t: L("الانحراف لا يعتمد على السرعة", "Deflection does not depend on speed"), ok: false, why: 0 }] }; },
  wrong(T, o, rows) { const a = rows[0].raw, b = rows[rows.length - 1].raw; return o.why === 0 ? L(`انظري: عند v=${AR(a.v)} كان الانحراف ${AR(a.d)}° وعند v=${AR(b.v)} كان ${AR(b.d)}°، إذن السرعة تؤثّر.`, `Look: at v=${AR(a.v)} the deflection was ${AR(a.d)}° and at v=${AR(b.v)} it was ${AR(b.d)}°, so speed matters.`) : L(`قارني ${AR(a.d)}° عند v=${AR(a.v)} و${AR(b.d)}° عند v=${AR(b.v)}: احسبي Δθ×v² و Δθ×v في الصفين، أيّهما يبقى ثابتًا؟`, `Compare ${AR(a.d)}° at v=${AR(a.v)} with ${AR(b.d)}° at v=${AR(b.v)}: compute Δθ×v² and Δθ×v for both rows. Which stays constant?`); },
  proof: { get h() { return "Δθ × v²"; }, f: r => r.d * r.v * r.v },
  sol(T) { const k = 20 * T.M, v = T.vals[0]; return L(`الثابت ${FX(`Δθ × v² = ${AR2(k)}`)}، إذن ${FX(`v = √(${AR2(k)} ÷ ${AR2(T.dthT)}) ≈ ${AR2(Math.sqrt(k / T.dthT))}`)}، وأطلقتِ بسرعة ${AR(v)}`, `Δθ × v² is constant = ${AR2(k)}, so v = √(${AR2(k)} ÷ ${AR2(T.dthT)}) ≈ ${AR2(Math.sqrt(k / T.dthT))} → you launched at ${v}`); },
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
    if (act) { T.ast.forEach(a => c.drawImage(IMG[a.k], a.x - a.s, a.y - a.s * .9, a.s * 2, a.s * 1.8)); if (!Eng.boss) c.drawImage(IMG.ring, T.ring.x - 70, T.ring.y - 70, 140, 140); }
    if (Eng.boss) { c.save(); c.fillStyle = "#0b0f2bdd"; c.beginPath(); c.roundRect(750 - 70, 240 - 26, 140, 52, 16); c.fill(); c.fillStyle = "#FFE08A"; c.font = "800 32px Cairo"; c.textAlign = "center"; c.fillText(`M = ${AR(T.M)}`, 750, 252); c.restore(); }
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
  robot: { x: 150, gy: 730 }, terminal: 1260, hz: [480, 1120], frags: [[470, 400], [1000, 390], [1180, 400]]
};


/* ============ الوحش «المُشتِّت» ============ */
const BOSS_COL = ["#FF9A3C", "#3CE0FF", "#B06BFF", "#FF3C6B"];
const Boss = {
  on: false, hurt: 0, die: 0, wind: 0, timer: 0, shots: [], every: 9, col: "#B06BFF",
  start(wi) { this.on = true; this.hurt = 0; this.die = 0; this.wind = 0; this.shots = []; this.timer = 0; this.every = [8, 12, 9, 9][wi]; this.col = BOSS_COL[wi]; },
  stop() { this.on = false; this.shots = []; this.wind = 0; },
  hp() { return Eng.tasks.length - Eng.ti - (this.die > 0 || this.hurtDone ? 1 : 0); },
  prep(T, sc) {
    this.timer = 0; this.wind = 0; this.shots = []; this.hurtDone = false;
    if (sc === "force") { const pairs = []; [2, 3, 4, 5].forEach(m => [1, 1.5, 2].forEach(a => { if (m * a <= 10) pairs.push([m, a]); }));
      const [m, a] = rnd(pairs); T.m = m; T.aT = a; T.gateX = T.x0 - 400 * a;
      T.goal = L(`ليصل الصندوق إلى الوحش يحتاج تسارع ${FX(`a = ${AR(a)}`)} م/ث² · كتلة الصندوق ${FX(`m = ${AR(m)}`)} كغ`, `To reach the monster the crate needs a = ${AR(a)} m/s² · crate mass m = ${AR(m)} kg`); }
    if (sc === "light") T.goal = L("وجّهي الشعاع إلى عين الوحش!", "Aim the beam at the monster's eye!");
    if (sc === "gravity") T.goal = L(`${FX("Δθ = 20 × M ÷ v²")} · كتلة الكوكب ${FX(`M = ${AR(T.M)}`)} · المطلوب ${FX(`Δθ = ${AR2(T.dthT)}°`)}`, `Δθ = 20 × M ÷ v² · planet mass M = ${AR(T.M)} · needed Δθ = ${AR2(T.dthT)}°`);
  },
  pos() { const T = Eng.T, sc = Eng.K.scene; if (sc === "force") return { x: T.gateX, y: GY - 115, s: 92 }; if (sc === "light") return { x: T.sensor.x, y: T.sensor.y, s: 78 }; return { x: T.ring.x, y: T.ring.y, s: 84 }; },
  update(dt) {
    if (!this.on || !Eng.T) return;
    this.hurt = Math.max(0, this.hurt - dt * 2.2); if (this.die > 0) this.die = Math.min(1, this.die + dt * .9);
    const p = this.pos(), active = Eng.phase === "act" && !Eng.locked && !Eng.K.busy(Eng.T) && !document.querySelector("#modal:not(.hidden)") && this.die === 0;
    if (active) { if (this.wind > 0) { this.wind += dt; if (this.wind >= 1.1) { this.wind = 0; this.fire(p); } } else { this.timer += dt; if (this.timer >= this.every) { this.timer = 0; this.wind = .001; SFX.charge(); } } }
    else if (this.wind > 0 && Eng.phase !== "act") this.wind = 0;
    this.shots.forEach(s => { const hitP = Eng.players.find(p => Math.hypot(s.x - p.rb.x, s.y - (Eng.gyBase() - p.rb.jh - 110)) < 72); const rx = hitP ? hitP.rb.x : -9999, ry = hitP ? Eng.gyBase() - hitP.rb.jh - 110 : -9999; s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; if (Math.random() < .7) Eng.part(s.x, s.y, { col: this.col, vx: (Math.random() - .5) * 40, vy: (Math.random() - .5) * 40, g: 0, life: .45, r: 6 + Math.random() * 6 });
      if (!s.dead && Math.hypot(s.x - rx, s.y - ry) < 72) { s.dead = true; Eng.boom(s.x, s.y, [this.col, "#2a0f45", "#fff"], 22, 320); Eng.shake = 12; const kk = Eng.ai; Eng.ai = Eng.players.indexOf(hitP); Eng.setRobot("fail", .8); Eng.say("ouch", true); Eng.stun = .35; Eng.ai = kk; Eng.spend(1); UI.toast(L("أصابتك كرة الظلام! (−١ طاقة) اقفزي ↑ لتتفاديها.", "The dark orb hit you! (−1 energy) Jump ↑ to dodge it.")); } });
    this.shots = this.shots.filter(s => !s.dead && s.t < 6 && s.x > -80 && s.x < 1680 && s.y > -80 && s.y < 980);
  },
  fire(p) { const tp = rnd(Eng.players), rx = tp.rb.x, ry = Eng.gyBase() - tp.rb.jh - 110, d = Math.hypot(rx - p.x, ry - p.y) || 1, sp = 560; this.shots.push({ x: p.x, y: p.y, vx: (rx - p.x) / d * sp, vy: (ry - p.y) / d * sp, t: 0 }); SFX.zap(); Eng.say("incoming"); },
  hit() { this.hurt = 1; this.hurtDone = true; this.shots = []; this.wind = 0; const p = this.pos(); Eng.boom(p.x, p.y, [this.col, "#fff", "#FFE08A"], 50, 520); Eng.shake = 20; SFX.roar(); if (Eng.ti >= Eng.tasks.length - 1) { this.die = .001; } },
  draw(c) {
    if (!this.on || !Eng.T) return; const p = this.pos();
    if (this.die >= 1) return;
    if (this.die > 0 && Math.random() < .8) Eng.part(p.x + (Math.random() - .5) * p.s * 2, p.y + (Math.random() - .5) * p.s * 2, { col: rnd([this.col, "#2a0f45", "#FFE08A", "#fff"]), vx: (Math.random() - .5) * 300, vy: -100 - Math.random() * 300, g: 200, life: 1, r: 5 + Math.random() * 9 });
    Boss.monster(c, p.x, p.y, p.s, this.col, { t: Eng.t, look: { x: Eng.rb.x, y: Eng.robotY() - 110 }, wind: Math.min(1, this.wind), hurt: this.hurt, die: this.die, hp: Math.max(0, this.hp()), max: Eng.tasks.length });
  },
  drawShots(c) { this.shots.forEach(s => { c.save(); const g = c.createRadialGradient(s.x, s.y, 0, s.x, s.y, 44); g.addColorStop(0, "#fff"); g.addColorStop(.25, this.col); g.addColorStop(.6, "rgba(42,15,69,.9)"); g.addColorStop(1, "rgba(42,15,69,0)"); c.fillStyle = g; c.beginPath(); c.arc(s.x, s.y, 44, 0, 7); c.fill(); c.restore(); }); },
  monster(c, x, y, s, col, o) {
    const t = o.t, k = 1 - (o.die || 0), sh = o.hurt ? (Math.random() - .5) * 18 * o.hurt : 0;
    c.save(); c.translate(x + sh, y + Math.sin(t * 2.2) * s * .07); c.scale(k * (1 + (o.wind || 0) * .08), k * (1 + (o.wind || 0) * .08));
    const au = c.createRadialGradient(0, 0, s * .4, 0, 0, s * 2); au.addColorStop(0, col + "88"); au.addColorStop(1, col + "00"); c.fillStyle = au; c.beginPath(); c.arc(0, 0, s * 2, 0, 7); c.fill();
    for (let i = 0; i < 6; i++) { const a = Math.PI / 2 + (i - 2.5) * .42, sw = Math.sin(t * 3 + i) * s * .35; c.lineCap = "round";
      const x1 = Math.cos(a) * s * .7, y1 = Math.sin(a) * s * .7, x2 = Math.cos(a) * s * 1.6 + sw, y2 = Math.sin(a) * s * 1.55;
      c.strokeStyle = "#160826"; c.lineWidth = s * .2; c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo((x1 + x2) / 2 - sw, (y1 + y2) / 2, x2, y2); c.stroke();
      c.strokeStyle = col; c.globalAlpha = .55; c.lineWidth = s * .06; c.stroke(); c.globalAlpha = 1; }
    const blob = () => { c.beginPath(); for (let i = 0; i <= 32; i++) { const a = i / 32 * Math.PI * 2, r = s * (1 + .07 * Math.sin(3 * a + t * 3) + .045 * Math.sin(5 * a - t * 2.3)); i ? c.lineTo(Math.cos(a) * r, Math.sin(a) * r) : c.moveTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); };
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * .38, h = s * (.55 + (i === 2 ? .35 : i % 2 ? .1 : .22)) + Math.sin(t * 4 + i) * s * .05;
      c.save(); c.rotate(a + Math.PI / 2); c.fillStyle = col; c.strokeStyle = "#fff"; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-s * .13, -s * .82); c.lineTo(0, -s * .82 - h); c.lineTo(s * .13, -s * .82); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = "rgba(255,255,255,.45)"; c.beginPath(); c.moveTo(-s * .05, -s * .85); c.lineTo(0, -s * .82 - h * .8); c.lineTo(s * .02, -s * .85); c.fill(); c.restore(); }
    const bg = c.createRadialGradient(-s * .25, -s * .3, s * .1, 0, 0, s * 1.1); bg.addColorStop(0, "#4a1d7a"); bg.addColorStop(.7, "#1f0a38"); bg.addColorStop(1, "#12061f"); blob(); c.fillStyle = bg; c.fill(); c.lineWidth = s * .06; c.strokeStyle = col; c.stroke();
    for (let i = 0; i < 9; i++) { const a = i * 2.4 + t * .3, r = s * (.35 + (i % 3) * .18); c.fillStyle = "rgba(255,255,255," + (.25 + .25 * Math.sin(t * 3 + i)) + ")"; c.beginPath(); c.arc(Math.cos(a) * r, Math.sin(a) * r * .8 + s * .25, s * .025 + (i % 2) * 1.5, 0, 7); c.fill(); }
    const ex = 0, ey = -s * .12, er = s * .42, lx = o.look.x - x, ly = o.look.y - y, ld = Math.hypot(lx, ly) || 1, blink = (t % 4.3) < .12 ? .15 : 1;
    c.save(); c.translate(ex, ey); c.scale(1, blink); c.fillStyle = "#fff"; c.beginPath(); c.ellipse(0, 0, er, er * .9, 0, 0, 7); c.fill(); c.strokeStyle = "#12061f"; c.lineWidth = s * .05; c.stroke();
    const ix = lx / ld * er * .38, iy = ly / ld * er * .32, ig = c.createRadialGradient(ix, iy, 0, ix, iy, er * .58); ig.addColorStop(0, "#fff8"); ig.addColorStop(.25, col); ig.addColorStop(1, "#2a0f45"); c.fillStyle = ig; c.beginPath(); c.arc(ix, iy, er * .56, 0, 7); c.fill();
    c.fillStyle = "#0b0414"; c.beginPath(); c.ellipse(ix, iy, er * .13 * (1 + (o.wind || 0) * .8), er * .4, 0, 0, 7); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.arc(ix - er * .2, iy - er * .22, er * .1, 0, 7); c.fill(); c.restore();
    c.strokeStyle = "#0b0414"; c.lineWidth = s * .13; c.lineCap = "round"; c.beginPath(); c.moveTo(-er * 1.05, ey - er * 1.05); c.lineTo(-er * .1, ey - er * .72); c.moveTo(er * 1.05, ey - er * 1.05); c.lineTo(er * .1, ey - er * .72); c.stroke();
    const mo = s * (.1 + (o.wind || 0) * .3 + (o.hurt || 0) * .25), my = s * .52, mw = s * .62;
    c.fillStyle = "#0b0414"; c.beginPath(); c.moveTo(-mw, my); c.quadraticCurveTo(0, my + mo * 2.2, mw, my); c.quadraticCurveTo(0, my + mo * .4, -mw, my); c.fill();
    if ((o.wind || 0) > 0) { const mg = c.createRadialGradient(0, my + mo, 0, 0, my + mo, mw); mg.addColorStop(0, col); mg.addColorStop(1, col + "00"); c.fillStyle = mg; c.beginPath(); c.arc(0, my + mo, mw * .7, 0, 7); c.fill(); }
    c.fillStyle = "#fff"; for (let i = 0; i < 6; i++) { const tx = -mw * .8 + i * mw * .32; c.beginPath(); c.moveTo(tx - s * .06, my + 2); c.lineTo(tx, my + s * .12 + mo * .3); c.lineTo(tx + s * .06, my + 2); c.fill(); }
    for (let i = 0; i < 3; i++) { const a = t * 1.4 + i * 2.09, r = s * 1.38; c.save(); c.translate(Math.cos(a) * r, Math.sin(a) * r * .55); c.rotate(a * 2); c.fillStyle = col; c.strokeStyle = "#fff"; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -s * .16); c.lineTo(s * .09, 0); c.lineTo(0, s * .16); c.lineTo(-s * .09, 0); c.closePath(); c.fill(); c.stroke(); c.restore(); }
    if (o.hurt) { c.globalAlpha = o.hurt * .75; blob(); c.fillStyle = "#fff"; c.fill(); c.globalAlpha = 1; }
    c.restore();
    if ((o.wind || 0) > 0) { c.save(); c.strokeStyle = "#ff4f5e"; c.lineWidth = 6; c.globalAlpha = .4 + .6 * Math.abs(Math.sin(t * 14)); c.beginPath(); c.arc(x, y, s * (1.5 + o.wind * .3), 0, 7); c.stroke(); c.fillStyle = "#ff4f5e"; c.font = "800 64px Cairo"; c.textAlign = "center"; c.fillText("!", x, y - s * 1.75); c.restore(); }
    if (o.max && !o.die) { const w = s * 2.2, hx = x - w / 2, hy = y - s * 2.05 - ((o.wind || 0) > 0 ? 60 : 0); c.save(); c.fillStyle = "#0b0414cc"; c.beginPath(); c.roundRect(hx - 6, hy - 6, w + 12, 30, 12); c.fill();
      for (let i = 0; i < o.max; i++) { const sw = (w - (o.max - 1) * 6) / o.max; c.fillStyle = i < o.hp ? col : "#ffffff22"; c.beginPath(); c.roundRect(hx + i * (sw + 6), hy, sw, 18, 7); c.fill(); }
      c.fillStyle = "#fff"; c.font = "800 24px Cairo"; c.textAlign = "center"; c.direction = LANG === "en" ? "ltr" : "rtl"; c.fillText(L(BOSS_TXT.name[0], BOSS_TXT.name[1]), x, hy - 12); c.restore(); }
  }
};

/* ============ المحرّك ============ */
const Eng = {
  w: null, wi: 0, si: 0, ti: 0, tasks: null, T: null, K: null, energy: 10, phase: "idle", rows: [], cells: [], fx: [], t: 0,
  parts: [], shake: 0, slow: 0, charge: null, grab: null, gacc: 0, drag: null, bubble: null, idleT: 0, code: null, sandbox: false, t0: 0, lowSaid: false,
  players: [], ai: 0, me: 0, team: false, WW: 1600, camX: 0, grabPi: 0,
  mkP(id, name, look) { return { id, name, look, rb: { x: 0, vx: 0, sq: 0, dir: -1, jh: 0, vy: 0, air: false, moving: false }, keys: { l: 0, r: 0, j: 0, g: 0 }, robot: { s: "idle", hold: 0 }, stun: 0, jbuf: 0 }; },
  get P() { if (!this.players.length) this.players = [this.mkP("me", "", null)]; return this.players[this.ai] || this.players[0]; },
  get rb() { return this.P.rb; }, get keys() { return this.P.keys; }, get robot() { return this.P.robot; },
  get stun() { return this.P.stun; }, set stun(v) { this.P.stun = v; }, get jbuf() { return this.P.jbuf; }, set jbuf(v) { this.P.jbuf = v; },
  each(fn) { const k = this.ai; this.players.forEach((p, i) => { this.ai = i; fn(p, i); }); this.ai = k; },
  gyBase() { return this.w.gt ? Math.min(this.K.robot.gy, GY) : this.K.robot.gy; },
  losses: 0, lawOk: false, hintUsed: false, solved: false, locked: false,
  start(wi, si, opts = {}) {
    this.team = !!opts.team; this.wi = wi; this.si = si; this.w = WORLDS[wi]; this.energy = ENERGY_MAX; this.ti = 0; this.solved = false; this.locked = false;
    if (!this.team) { const pk = this.players[0] && this.players[0].keys; this.players = [this.mkP("me", (Save.d.profile || {}).name || "", null)]; if (pk) this.players[0].keys = pk; this.me = 0; } this.ai = this.me; this.WW = this.team ? 2400 : 1600; this.camX = 0;
    this.code = opts.code || null; this.sandbox = !!opts.lab; this.t0 = performance.now(); this.lastSol = "";
    this.boss = !this.sandbox && !!(this.w.stages[si] && this.w.stages[si].boss); if (this.boss) Boss.start(wi); else Boss.stop();
    const key = `${wi}-${si}`; this.losses = Save.d.losses[key] || 0;
    this.tasks = this.sandbox ? [{ kind: this.w.law, level: [2, 2, 3][wi] }] : this.w.stages[si].tasks; this.beginTask();
  },
  beginTask() {
    const d = this.tasks[this.ti]; this.K = KINDS[d.kind];
    if (this.code) RNG = seeded(`${this.code}|${this.wi}|${this.si}|${this.ti}`);
    this.T = this.K.make(d.level); if (this.boss && this.K.scene === "light") for (let k = 0; k < 60 && (this.T.sensor.y < 290 || this.T.sensor.x > 1120); k++) this.T = this.K.make(d.level);
    this.rows = []; this.fx = []; this.parts = []; this.charge = null; this.grab = null; this.drag = null; this.lowSaid = false; this.stun = 0;
    const n = this.boss ? 1 : this.tasks.length > 1 ? 2 : 4; this.cells = this.sandbox ? [] : shuffle(this.K.cellsAt || this.T.cellsAt).slice(0, n).map(p => ({ x: p[0], y: p[1], got: false }));
    if (this.boss) { Boss.prep(this.T, this.K.scene); const bp = Boss.pos(), sp = (this.K.cellsAt || this.T.cellsAt).filter(p => Math.hypot(p[0] - bp.x, p[1] - bp.y) > 230 && Math.abs(p[0] - this.termX()) > 120); this.cells = shuffle(sp).slice(0, 1).map(p => ({ x: p[0], y: p[1], got: false })); }
    RNG = Math.random;
    this.players.forEach((p, i) => { Object.assign(p.rb, { x: clamp(this.K.robot.x + (this.K.robot.x < 800 ? 1 : 1) * i * 170, 90, this.WW - 90), vx: 0, dir: -1, jh: 0, vy: 0, air: false, moving: false }); p.stun = 0; p.jbuf = 0; p.robot.s = "idle"; p.robot.hold = 0; });
    if (this.team && !this.sandbox) [[1850, 590], [2150, 470], [2300, 600]].slice(0, this.players.length).forEach(p => this.cells.push({ x: p[0], y: this.K.scene === "gravity" ? p[1] + 20 : p[1], got: false }));
    const K = this.K, fk = `${this.wi}-${this.si}`;
    this.hz = (this.sandbox || this.boss) ? null : { x: K.hz[0] + (K.hz[1] - K.hz[0]) * Math.random(), dir: Math.random() < .5 ? -1 : 1, kind: ["dust", "spark", "rock", ["dust", "spark", "rock"][this.ti % 3]][this.wi], spin: 0 };
    this.frag = (!this.sandbox && !this.boss && !this.team && this.ti === 0 && K.frags[this.si] && !Save.d.frags[fk]) ? { x: K.frags[this.si][0], y: K.frags[this.si][1], key: fk } : null;
    if (this.sandbox) { const T = this.T, sc = this.K.scene;
      if (sc === "force") { T.sliders.push({ label: L("كتلة الصندوق m (كغ)", "Crate mass m (kg)"), min: 1, max: 10, step: .5, key: "m" }); T.vals.push(T.m); T.goal = L("المختبر الحر: غيّري القوة والكتلة وراقبي التسارع", "Free lab: change force and mass and watch the acceleration"); }
      if (sc === "gravity") { T.sliders.push({ label: L("كتلة الكوكب M", "Planet mass M"), min: 1, max: 6, step: .5, key: "M" }); T.vals.push(T.M); T.goal = L("المختبر الحر: غيّري السرعة وكتلة الكوكب", "Free lab: change the speed and the planet's mass"); }
      if (sc === "light") T.goal = L("المختبر الحر: وجّهي الشعاع كما تشائين", "Free lab: bounce the beam however you like");
      T.sliders.forEach((s, i) => s.val = T.vals[i]); }
    this.hintUsed = false; this.phase = this.sandbox ? "act" : this.w.id === 4 ? "law" : this.boss ? "act" : "measure"; UI.onPhase();
    this.say(this.sandbox ? "lab" : this.boss ? (this.ti ? "bossnext" : "boss") : "start", true);
  },
  robotY() { return this.gyBase() - this.rb.jh; },
  part(x, y, o) { if (this.parts.length < 400) this.parts.push(Object.assign({ x, y, vx: 0, vy: 0, g: 600, life: 1, t: 0, r: 6, col: "#fff", grow: 0 }, o)); },
  boom(x, y, cols, n = 24, sp = 400) { for (let k = 0; k < n; k++) { const a = Math.random() * Math.PI * 2, v = sp * (.3 + Math.random() * .7); this.part(x, y, { col: cols[k % cols.length], vx: Math.cos(a) * v, vy: Math.sin(a) * v - sp * .3, g: 700, life: .6 + Math.random() * .6, r: 4 + Math.random() * 7 }); } },
  say(key, force = false) {
    const pool = SAY[key]; if (!pool) return; if (this.bubble && this.bubble.t < this.bubble.dur - .3 && !force) return;
    const p = pool[Math.floor(Math.random() * pool.length)]; this.bubble = { txt: LANG === "en" ? p[1] : p[0], t: 0, dur: 2.9, pi: this.ai };
  },
  modalFor() { return this.ai === this.me && !!document.querySelector("#modal:not(.hidden)"); },
  busyNow() { return !this.T || this.K.busy(this.T) || this.locked || (this.phase !== "measure" && this.phase !== "act") || this.modalFor(); },
  pressStart() { this.idleT = 0; if (this.busyNow()) return; if (this.K.scene === "force") { this.charge = { v: 1, t: 0, st: 0, pi: this.ai }; if (this.grabPi === this.ai) this.grab = null; this.bubble = null; } },
  pressEnd() {
    const ch = this.charge; this.charge = null; if (this.busyNow()) return;
    if (ch && ch.t > .15) { this.T.vals[0] = Math.round(ch.v * 2) / 2; UI.syncSlider(0); }
    if (this.phase === "measure") this.test(); else this.act();
  },
  nearMirror() { if (!this.T || this.K.scene !== "light") return null; const ms = this.phase === "act" ? this.T.mirrors : [this.T.mirrors[0]]; let best = null, bd = 130;
    ms.forEach((m, i) => { const d = Math.abs(this.rb.x - m.x); if (d < bd) { bd = d; best = i; } }); return best; },
  termX() { return this.boss ? (this.K.scene === "gravity" ? 700 : 1470) : this.K.terminal; },
  interact() {
    if (this.grab != null && this.grabPi === this.ai) { this.grab = null; SFX.click(); return; }
    if (this.K.scene === "light" && this.nearMirror() != null) return this.toggleGrab();
    const tx = this.termX(); if (!this.sandbox && tx != null && Math.abs(this.rb.x - tx) < 95) { if (this.busyNow()) return; this.setRobot("scan", 1.2); SFX.test(); this.say("archive", true); UI.hintModal(this.hintText(), true, true); return; }
    UI.toast(this.K.scene === "light" ? L("اقتربي من مرآة أو من جهاز الأرشيف 🖥️ ثم اضغطي ↓", "Walk to a mirror or the archive terminal 🖥️, then press ↓") : L("اقتربي من جهاز الأرشيف 🖥️ ثم اضغطي ↓ لتلميح مجاني", "Walk to the archive terminal 🖥️ and press ↓ for a free hint"));
  },
  drawWorldBits(c) {
    const gy = this.w.gt ? Math.min(this.K.robot.gy, GY) : this.K.robot.gy, t = this.t, tx = this.termX();
    if (!this.sandbox && tx != null) { c.save(); c.fillStyle = "#2a3170"; c.fillRect(tx - 10, gy - 120, 20, 120); c.fillStyle = "#1c2250"; c.strokeStyle = "#7FE8FF"; c.lineWidth = 5; c.beginPath(); c.roundRect(tx - 62, gy - 230, 124, 110, 16); c.fill(); c.stroke();
      c.fillStyle = "#7FE8FF"; for (let k = 0; k < 4; k++) { const w = 30 + ((Math.sin(t * 3 + k * 1.7) + 1) / 2) * 60; c.globalAlpha = .55 + .45 * Math.sin(t * 5 + k); c.fillRect(tx - 46, gy - 214 + k * 22, w, 10); } c.globalAlpha = 1;
      c.font = "800 30px Cairo"; c.textAlign = "center"; c.fillText("🖥️", tx, gy - 248 + Math.sin(t * 3) * 4);
      if (Math.abs(this.rb.x - tx) < 95 && (this.phase === "measure" || this.phase === "act")) { c.fillStyle = "#FFC83D"; c.font = "800 28px Cairo"; c.fillText(L("↓ تلميح مجاني", "↓ free hint"), tx, gy - 290); } c.restore(); }
    const fr = this.frag; if (fr && !fr.got) { const y = fr.y + Math.sin(t * 2.5) * 8; c.save(); const g = c.createRadialGradient(fr.x, y, 0, fr.x, y, 70); g.addColorStop(0, "rgba(127,232,255,.7)"); g.addColorStop(1, "rgba(127,232,255,0)"); c.fillStyle = g; c.beginPath(); c.arc(fr.x, y, 70, 0, 7); c.fill();
      c.translate(fr.x, y); c.rotate(Math.sin(t * 2) * .2); c.fillStyle = "#BFF4FF"; c.strokeStyle = "#fff"; c.lineWidth = 3; c.beginPath(); c.moveTo(0, -36); c.lineTo(22, -6); c.lineTo(0, 36); c.lineTo(-22, -6); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = "#7FE8FF"; c.beginPath(); c.moveTo(0, -36); c.lineTo(22, -6); c.lineTo(0, 0); c.closePath(); c.fill(); c.restore(); }
    const hz = this.hz; if (hz) { const y = gy - 46; c.save(); c.translate(hz.x, y);
      if (hz.kind === "spark") { const g = c.createRadialGradient(0, 0, 0, 0, 0, 60); g.addColorStop(0, "rgba(220,250,255,1)"); g.addColorStop(.4, "rgba(80,200,255,.8)"); g.addColorStop(1, "rgba(80,200,255,0)"); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 60, 0, 7); c.fill();
        c.strokeStyle = "#fff"; c.lineWidth = 3; for (let k = 0; k < 5; k++) { const a = t * 7 + k * 1.26; c.beginPath(); c.moveTo(Math.cos(a) * 18, Math.sin(a) * 18); c.lineTo(Math.cos(a + .3) * 40, Math.sin(a + .3) * 40); c.lineTo(Math.cos(a) * 58, Math.sin(a) * 58); c.stroke(); } }
      else if (hz.kind === "rock") { c.rotate(hz.spin); c.drawImage(IMG.astC, -48, -44, 96, 88); }
      else { c.rotate(hz.spin); c.strokeStyle = "#b07a3c"; c.lineWidth = 5; for (let k = 0; k < 7; k++) { c.beginPath(); c.arc(0, 0, 14 + k * 5, k, k + 3.6); c.stroke(); } c.strokeStyle = "#e9c48a"; for (let k = 0; k < 5; k++) { c.beginPath(); c.arc(0, 0, 10 + k * 7, k * 2, k * 2 + 2.4); c.stroke(); } }
      c.restore(); if (Math.random() < .25) this.part(hz.x - hz.dir * 30, gy - 10, { col: hz.kind === "spark" ? "#BFF4FF" : "rgba(233,196,138,.8)", vx: -hz.dir * 50, vy: -30 - Math.random() * 40, g: 60, life: .6, r: 4 + Math.random() * 5 }); }
  },
  toggleGrab() {
    if (this.K.scene !== "light" || this.busyNow()) return;
    if (this.grab != null && this.grabPi === this.ai) { this.grab = null; SFX.click(); return; }
    if (this.grab != null) { UI.toast(L("صديقتك ممسكة بالمرآة الآن.", "Your friend is holding the mirror.")); return; }
    const k = this.nearMirror(); if (k == null) { UI.toast(L("اقتربي من المرآة أولًا، ثم اضغطي ↓", "Walk to a mirror first, then press ↓")); return; }
    this.grab = k; this.grabPi = this.ai; this.gacc = 0; SFX.click(); this.say("grab", true);
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
    if (kind === this.tasks[this.ti].kind) { this.phase = this.boss ? "act" : "measure"; SFX.good(); UI.onPhase(); if (!this.boss) UI.toast(L("صحيح! الآن قيسي.", "Correct! Now measure.")); }
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
    this.grab = null; this.T.pusher = this.ai; this.K.act(this.T); this.setRobot(this.K.scene === "force" ? "push" : "scan", 3); ({ force: "push", light: "beam", gravity: "launch" })[this.K.scene] && SFX[{ force: "push", light: "beam", gravity: "launch" }[this.K.scene]](); UI.controls();
  },
  actDone(ok, msg) {
    if (this.sandbox) { const T = this.T, sc = this.K.scene;
      if (sc === "force") { const a = T.vals[0] / T.m; this.rows.push({ cells: [AR(T.vals[0]), AR(a)], key: Math.random() }); }
      if (sc === "gravity") { const d = Math.round(20 * T.M / (T.vals[0] * T.vals[0]) * 10) / 10; this.rows.push({ cells: [AR(T.vals[0]), `${AR(d)}°`], key: Math.random() }); }
      UI.panel(); this.setRobot(ok ? "success" : "fail", 1.2); this.say(ok ? "good" : "labmiss", true); if (ok) SFX.good(); else UI.toast(msg);
      setTimeout(() => { if (!this.sandbox || this.T !== T) return; T.open = false; T.hit = false; T.cx = T.x0; T.rot = 0; T.dead = false; UI.controls(); }, 1300); UI.controls(); return; }
    if (ok) { this.lastSol = this.K.sol ? this.K.sol(this.T) : ""; this.say("good", true); SFX.good(); this.setRobot("success", 1.4); const last = this.ti >= this.tasks.length - 1; this.locked = true; if (this.boss) Boss.hit();
      setTimeout(() => { if (this.phase === "done") return; if (last) this.win(); else { this.ti++; this.locked = false; this.beginTask(); } }, last ? (this.boss ? 1900 : 1100) : 2600);
      if (!last) UI.toast((this.boss ? L(`💥 ضربة! بقي للمُشتِّت ${AR(this.tasks.length - this.ti - 1)}`, `💥 Hit! The Scatterer has ${this.tasks.length - this.ti - 1} left`) : L("أحسنتِ! المهمة التالية…", "Well done! Next task…")) + (this.lastSol ? "  ✔ " + this.lastSol : "")); }
    else { this.setRobot("fail", 1.3); this.say("fail", true); UI.toast(msg || L("لم تنجح المحاولة (−١ طاقة).", "That attempt failed (−1 energy).")); this.spend(1); UI.controls(); }
  },
  win() {
    const stars = this.energy >= 6 ? 3 : this.energy >= 3 ? 2 : 1; if (!this.team) { Save.set(`${this.wi}-${this.si}`, stars); Save.d.losses[`${this.wi}-${this.si}`] = 0; Save.save(); } SFX.win(); this.phase = "done"; UI.winModal(stars);
  },
  lose() { if (this.phase === "done") return; this.phase = "done"; this.locked = true; const key = `${this.wi}-${this.si}`; this.losses++; if (!this.team) { Save.d.losses[key] = this.losses; Save.save(); } SFX.lose(); this.setRobot("fail", 99); setTimeout(() => UI.loseModal(), 500); },
  hint() {
    if (this.phase === "done") return; const free = this.losses >= 2 || this.hintUsed;
    if (!free) { if (this.energy <= 1) { UI.toast(L("طاقتك لا تكفي للتلميح.", "Not enough energy for a hint.")); return; } this.spend(1); }
    this.hintUsed = true; UI.hintModal(this.hintText(), free);
  },
  hintText() { const h = this.boss && BOSS_TXT.hint[this.K.scene]; return h ? L(h[0], h[1]) : this.K.hint;
  },
  update(dt) {
    this.t += dt; if (!this.T) return; if (typeof Net !== "undefined" && Net.guest) return Net.guestUpdate(dt);
    const sdt = this.slow > 0 ? dt * .28 : dt; if (this.slow > 0) this.slow -= dt; this.shake = Math.max(0, this.shake - dt * 40);
    this.players.forEach(p => { const r = p.robot; if (r.hold > 0) { r.hold -= dt; if (r.hold <= 0) r.s = "idle"; } });
    const ch = this.charge; if (ch) { if (this.busyNow() || !this.players[ch.pi]) this.charge = null; else { ch.t += dt; ch.v = Math.min(10, 1 + Math.max(0, ch.t - .15) * 4.2); const cr = this.players[ch.pi]; cr.rb.x = this.T.cx + 100; cr.rb.dir = -1; cr.robot.s = "push"; cr.robot.hold = .2;
      const st = Math.floor(ch.v * 2); if (st !== ch.st) { ch.st = st; SFX.tone(200 + ch.v * 70, .05, "triangle", .03); } } }
    const hz = this.hz; if (hz) { const [a, z] = this.K.hz, sp = hz.kind === "spark" ? 210 : 165, busyR = [this.grab != null ? this.players[this.grabPi] : null, ch ? this.players[ch.pi] : null].filter(Boolean);
      busyR.forEach(p => { if (Math.abs(hz.x - p.rb.x) < 260) hz.dir = hz.x > p.rb.x ? 1 : -1; }); if (this.drag && Math.abs(hz.x - this.players[this.me].rb.x) < 260) hz.dir = hz.x > this.players[this.me].rb.x ? 1 : -1;
      hz.x += hz.dir * sp * dt; hz.spin += hz.dir * dt * 6; if (hz.x < a) { hz.x = a; hz.dir = 1; } if (hz.x > z) { hz.x = z; hz.dir = -1; } }
    this.each(() => this.moveRobot(dt)); this.K.update(this.T, sdt); Boss.update(dt); this.fx.forEach(f => f.t += dt); this.fx = this.fx.filter(f => f.t < 1.2);
    this.parts.forEach(p => { p.t += sdt; p.vy += p.g * sdt; p.x += p.vx * sdt; p.y += p.vy * sdt; p.r += p.grow * sdt; }); this.parts = this.parts.filter(p => p.t < p.life);
    if (this.bubble) { this.bubble.t += dt; if (this.bubble.t > this.bubble.dur) this.bubble = null; }
    if (this.team) { const mx = this.players[this.me].rb.x; this.camX += (clamp(mx - 800, 0, this.WW - 1600) - this.camX) * Math.min(1, dt * 6); } else this.camX = 0;
    const quiet = !this.keys.l && !this.keys.r && !this.charge && !this.drag && !this.K.busy(this.T) && (this.phase === "measure" || this.phase === "act") && !document.querySelector("#modal:not(.hidden)");
    if (quiet) { this.idleT += dt; if (this.idleT > 15) { this.idleT = 0; this.say("idle"); } } else this.idleT = 0;
  },
  moveRobot(dt) {
    const b = this.rb, can = !this.modalFor() && this.phase !== "law" && this.phase !== "done" && this.phase !== "idle";
    if (this.keys.g) { this.keys.g = 0; if (can) this.interact(); }
    let dx = can ? (this.keys.r - this.keys.l) : 0; if (this.stun > 0) { this.stun -= dt; dx = 0; }
    if (this.grab != null && this.grabPi === this.ai) { if (!can || this.K.busy(this.T)) this.grab = null; else { const i = this.grab, s = this.T.sliders[i]; this.gacc += dx * 30 * dt; const st = Math.trunc(this.gacc);
      if (st) { this.gacc -= st; this.T.vals[i] = clamp(this.T.vals[i] + st, s.min, s.max); this.T.mirrors[i].phi = this.T.vals[i]; this.T.beam = null; UI.syncSlider(i); SFX.tick(); } if (dx) this.setRobot("scan", .2); dx = 0; } }
    if (this.charge && this.charge.pi === this.ai) dx = 0;
    const target = dx * 420, acc = (dx ? 2600 : 3400) * dt;
    b.vx += clamp(target - b.vx, -acc, acc); b.moving = Math.abs(b.vx) > 40 && !b.air; if (Math.abs(b.vx) > 20) b.dir = b.vx > 0 ? 1 : -1;
    b.x = clamp(b.x + b.vx * dt, 90, this.WW - 90); if (b.x <= 90 || b.x >= this.WW - 90) b.vx = 0;
    if (this.keys.j && b.air) { this.jbuf = .16; this.keys.j = 0; } if (this.jbuf > 0) { this.jbuf -= dt; if (!b.air) { this.keys.j = 1; this.jbuf = 0; } }
    if (this.keys.j) { if (can && !b.air) { b.air = true; b.vy = 1000; b.sq = -.12; if (this.ai === this.me) SFX.tone(420, .2, "square", .04, 0, 780); } this.keys.j = 0; }
    if (b.air) { b.vy -= 1900 * dt; b.jh += b.vy * dt; if (b.jh <= 0) { b.jh = 0; b.air = false; b.vy = 0; b.sq = .14; if (this.ai === this.me) SFX.tone(110, .08, "sine", .05); } }
    b.sq += (0 - b.sq) * Math.min(1, dt * 12);
    const gy0 = this.w.gt ? Math.min(this.K.robot.gy, GY) : this.K.robot.gy;
    if (can) { this.collect(b.x, gy0 - 105 - b.jh, 95);
      const fr = this.frag; if (fr && !fr.got && Math.hypot(fr.x - b.x, fr.y - (gy0 - 105 - b.jh)) < 90) { fr.got = true; if (!this.team) { Save.d.frags[fr.key] = 1; Save.save(); } SFX.law(); this.boom(fr.x, fr.y, ["#7FE8FF", "#FFFFFF", "#FFC83D", "#B06BFF"], 40, 420); this.say("frag", true);
        const wi = this.wi, n = fragsOf(wi); UI.toast(n >= 3 ? L(`💎 ${AR(3)}/${AR(3)}! فتحتِ إكسسوارًا نادرًا لذرّة: ${ACCS.find(a => a.w === wi).ar} ${ACCS.find(a => a.w === wi).e}. البسيه من «الحساب».`, `💎 3/3! You unlocked a rare accessory for Zarra: ${ACCS.find(a => a.w === wi).en} ${ACCS.find(a => a.w === wi).e}. Wear it from Profile.`) : L(`💎 شظية ذاكرة ${AR(n)}/${AR(3)} في هذا العالم`, `💎 Memory shard ${n}/3 in this world`)); } }
    const hz = this.hz; if (hz) { const mine = (this.grab != null && this.grabPi === this.ai) || (this.charge && this.charge.pi === this.ai) || (this.drag && this.ai === this.me);
      if (can && !mine && this.stun <= 0 && !this.K.busy(this.T) && Math.abs(hz.x - b.x) < 78 && b.jh < 75) { const away = b.x >= hz.x ? 1 : -1; b.vx = away * 950; b.air = true; b.vy = 560; this.stun = .55; if (this.ai === this.me) this.shake = 9;
        this.setRobot("fail", .7); SFX.bad(); this.say("ouch", true); this.boom(b.x - away * 40, gy0 - 60, hz.kind === "spark" ? ["#7FE8FF", "#fff"] : ["#e9c48a", "#a07a4a"], 14, 260); } }
    if (b.moving && this.ai === this.me && Math.floor(this.t * 5) !== this._st) { this._st = Math.floor(this.t * 5); SFX.tone(140, .05, "square", .012); }
  },
  draw(c) {
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H); const w = this.w; if (!w || !this.T) { if (typeof Menu !== "undefined") Menu.draw(c, this.t); return; }
    if (this.shake > 0) c.translate((Math.random() - .5) * this.shake, (Math.random() - .5) * this.shake);
    c.translate(-Math.round(this.camX), 0);
    { const off = clamp((this.players[this.me].rb.x - 800) * .05, -40, 40), bg = IMG["bg" + w.id]; c.drawImage(bg, -48 - off, -27, W * 1.06, H * 1.06);
      if (this.WW > W) { c.save(); c.translate(-48 - off + W * 1.06 * 2, -27); c.scale(-1, 1); c.drawImage(bg, 0, 0, W * 1.06, H * 1.06); c.restore(); } }
    if (w.gt) for (let x = 0; x < this.WW; x += 600) c.drawImage(IMG[w.gt], x, GY, 600, 220);
    this.K.draw(c, this.T, this.phase);
    this.drawWorldBits(c); if (this.boss) Boss.draw(c);
    this.cells.forEach((p, i) => { if (!p.got) { const bob = Math.sin(this.t * 3 + i) * 6; c.drawImage(IMG.pickup, p.x - 38, p.y - 45 + bob, 76, 90); } });
    this.parts.forEach(p => { c.globalAlpha = Math.max(0, 1 - p.t / p.life); c.fillStyle = p.col; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 7); c.fill(); }); c.globalAlpha = 1;
    this.each((p, i) => { if (i !== this.me) this.drawRobot(c); }); this.ai = this.me; this.drawRobot(c); if (this.K.over) this.K.over(c, this.T); if (this.boss) Boss.drawShots(c); this.drawBubble(c);
    this.fx.forEach(f => { c.save(); c.globalAlpha = 1 - f.t / 1.2; c.fillStyle = f.col; c.font = "800 44px Cairo"; c.textAlign = "center"; c.fillText(f.txt, f.x, f.y - f.t * 60); c.restore(); });
  },
  drawBubble(c) {
    const b = this.bubble; if (!b) return; const keep = this.ai; this.ai = this.players[b.pi] ? b.pi : this.me; try { this.drawBubble2(c, b); } finally { this.ai = keep; } },
  drawBubble2(c, b) { const a = Math.min(1, b.t * 6, (b.dur - b.t) * 4); if (a <= 0) return;
    c.save(); c.globalAlpha = a; c.font = "700 27px Cairo"; c.direction = LANG === "en" ? "ltr" : "rtl"; c.textAlign = "center";
    const words = b.txt.split(" "), lines = []; let cur = ""; words.forEach(w => { const t = cur ? cur + " " + w : w; if (c.measureText(t).width > 380 && cur) { lines.push(cur); cur = w; } else cur = t; }); lines.push(cur);
    const wd = Math.max(...lines.map(l => c.measureText(l).width)) + 44, ht = lines.length * 38 + 24, x = clamp(this.rb.x, this.camX + wd / 2 + 20, this.camX + W - wd / 2 - 20), y = this.robotY() - 250 - ht - (1 - Math.min(1, b.t * 6)) * 14;
    c.fillStyle = "#fff"; c.strokeStyle = "#1c2250"; c.lineWidth = 4; c.beginPath(); c.roundRect(x - wd / 2, y, wd, ht, 22); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(clamp(this.rb.x, x - wd / 2 + 30, x + wd / 2 - 30) - 14, y + ht - 2); c.lineTo(clamp(this.rb.x, x - wd / 2 + 30, x + wd / 2 - 30), y + ht + 22); c.lineTo(clamp(this.rb.x, x - wd / 2 + 30, x + wd / 2 - 30) + 14, y + ht - 2); c.fill();
    c.fillStyle = "#1c2250"; lines.forEach((l, i) => c.fillText(l, x, y + 44 + i * 38)); c.restore();
  },
  drawRobot(c) {
    let s = this.robot.s; if (s === "idle" && this.energy <= 3 && this.phase !== "done") s = "low"; if (s === "idle" || s === "low") { if (this.rb.air) s = "jump"; else if (this.rb.moving) s = "roll"; } if (this.phase === "measure" && s === "idle" && this.K.busy(this.T)) s = "scan";
    if (this.phase === "deduce") s = "think"; const R = this.K.robot, P = this.P;
    if (this.team) { c.save(); c.font = "800 24px Cairo"; c.textAlign = "center"; c.direction = "rtl"; const nm = P.name || "?", tw = c.measureText(nm).width + 26, ty = this.robotY() - 225; c.fillStyle = this.ai === this.me ? "#FFC83Dee" : "#0b0f2bcc"; c.beginPath(); c.roundRect(this.rb.x - tw / 2, ty - 26, tw, 36, 14); c.fill(); c.fillStyle = this.ai === this.me ? "#2a1a00" : "#fff"; c.fillText(nm, this.rb.x, ty); c.restore(); }
    Robo.draw(c, P.look || myLook(), s, Robo.frame(s, this.t), this.rb.x, (this.w.gt ? Math.min(R.gy, GY) : R.gy) - this.rb.jh, 300, this.rb.dir < 0, this.rb.sq, this.t);
  }
};
