"use strict";
const LAWS = {
  force: { name: "قانون نيوتن الثاني", short: "F = m × a", icon: "law_force", text: "التسارع يساوي القوة مقسومة على الكتلة: a = F ÷ m" },
  light: { name: "قانون الانعكاس", short: "زاوية السقوط = زاوية الانعكاس", icon: "law_light", text: "يرتدّ الضوء عن المرآة بنفس زاوية سقوطه، مقيسةً من العمودي" },
  gravity: { name: "الجاذبية والمدارات", short: "Δθ ∝ M ÷ v²", icon: "law_gravity", text: "كلما زادت سرعة المسبار قلّ انحرافه، فالانحراف يتناسب مع 1/v²" }
};
const WORLDS = [
  { id: 1, name: "الثِقل", sub: "القوة والتسارع", law: "force", bg: "bg1", gt: "gt1", color: "#E8A33C",
    intro: "في عالم الثِقل تتحرك الأشياء بقدر ما تُدفَع. اكتشفي كم تزن الصناديق من دون أن تحمليها." ,
    stages: [{ tasks: [{ kind: "force", level: 1 }] }, { tasks: [{ kind: "force", level: 2 }] }, { tasks: [{ kind: "force", level: 3 }] }] },
  { id: 2, name: "المرايا", sub: "انعكاس الضوء", law: "light", bg: "bg2", gt: "gt2", color: "#4CC3D9",
    intro: "في عالم المرايا يسير الضوء في خطوط مستقيمة ويرتدّ عند المرايا. وجّهي الشعاع نحو المستشعر.",
    stages: [{ tasks: [{ kind: "light", level: 1 }] }, { tasks: [{ kind: "light", level: 2 }] }, { tasks: [{ kind: "light", level: 3 }] }] },
  { id: 3, name: "المقلاع", sub: "الجاذبية والمدارات", law: "gravity", bg: "bg3", gt: null, color: "#9B6BFF",
    intro: "في عالم المقلاع تنحني المسارات حول الكواكب. أطلقي المسبار بالسرعة الصحيحة ليعبر الحلقة.",
    stages: [{ tasks: [{ kind: "gravity", level: 1 }] }, { tasks: [{ kind: "gravity", level: 2 }] }, { tasks: [{ kind: "gravity", level: 3 }] }] },
  { id: 4, name: "الذاكرة", sub: "كل القوانين معًا", law: "memory", bg: "bg4", gt: "gt4", color: "#FF8A5C",
    intro: "هنا تلتقي القوانين كلها. في كل مهمة اختاري القانون المناسب أولًا، ثم قيسي واستنتجي وتصرّفي.",
    stages: [{ tasks: [{ kind: "force", level: 2 }, { kind: "light", level: 1 }] },
             { tasks: [{ kind: "light", level: 2 }, { kind: "gravity", level: 2 }] },
             { tasks: [{ kind: "gravity", level: 3 }, { kind: "force", level: 3 }, { kind: "light", level: 3 }] }] }
];
const STORY = [
  { img: "story_1", t: "ذاكرة الكون تحفظ قوانينه كلها… لكنها تشتّتت في أربعة عوالم." },
  { img: "story_2", t: "ذرّة، روبوت صغير، وصل ليستعيدها قطعةً قطعة." },
  { img: "story_3", t: "لا يملك إلا طاقته المحدودة… وعقلًا يقيس ويستنتج." },
  { img: "story_4", t: "قيسي، استنتجي، ثم تصرّفي. ولا تهدري الطاقة!" }
];
const ENERGY_MAX = 10;

const EN = {
  laws: { force: { name: "Newton's Second Law", short: "F = m × a", text: "Acceleration equals force divided by mass: a = F ÷ m" },
    light: { name: "Law of Reflection", short: "angle of incidence = angle of reflection", text: "Light bounces off a mirror at the same angle it arrived, measured from the normal" },
    gravity: { name: "Gravity & Orbits", short: "Δθ ∝ M ÷ v²", text: "The faster the probe, the less it bends: deflection is proportional to 1/v²" } },
  worlds: [
    { name: "Weight", sub: "Force & acceleration", intro: "In Weight world things move as much as they are pushed. Find out how heavy the crates are without lifting them." },
    { name: "Mirrors", sub: "Reflection of light", intro: "In Mirrors world light travels in straight lines and bounces off mirrors. Aim the beam at the sensor." },
    { name: "Slingshot", sub: "Gravity & orbits", intro: "In Slingshot world paths bend around planets. Launch the probe at the right speed to pass through the ring." },
    { name: "Memory", sub: "All laws together", intro: "Here all the laws meet. In each task pick the right law first, then measure, deduce and act." }],
  story: ["The Memory of the Universe holds all its laws… but it shattered into four worlds.", "Zarra, a little robot, arrived to restore it piece by piece.", "It has only its limited energy… and a mind that measures and deduces.", "Measure, deduce, then act. And don't waste energy!"]
};
const wt = (w, f) => LANG === "en" ? EN.worlds[w.id - 1][f] : w[f];
const lw = (k, f) => LANG === "en" ? EN.laws[k][f] : LAWS[k][f];
const stt = i => LANG === "en" ? EN.story[i] : STORY[i].t;
