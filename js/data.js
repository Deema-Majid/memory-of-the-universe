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
