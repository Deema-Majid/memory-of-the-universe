"use strict";
const LAWS = {
  force: { name: "قانون نيوتن الثاني", short: "F = m × a", icon: "law_force", text: "التسارع يساوي القوة مقسومة على الكتلة: a = F ÷ m" },
  light: { name: "قانون الانعكاس", short: "زاوية السقوط = زاوية الانعكاس", icon: "law_light", text: "يرتدّ الضوء عن المرآة بنفس زاوية سقوطه، مقيسةً من العمودي" },
  gravity: { name: "الجاذبية والمدارات", short: "Δθ ∝ M ÷ v²", icon: "law_gravity", text: "كلما زادت سرعة المسبار قلّ انحرافه، فالانحراف يتناسب مع 1/v²" }
};
const WORLDS = [
  { id: 1, name: "الثِقل", sub: "القوة والتسارع", law: "force", bg: "bg1", gt: "gt1", color: "#E8A33C",
    intro: "في عالم الثِقل تتحرك الأشياء بقدر ما تُدفَع. اكتشفي كم تزن الصناديق من دون أن تحمليها." ,
    stages: [{ tasks: [{ kind: "force", level: 1 }] }, { tasks: [{ kind: "force", level: 2 }] }, { tasks: [{ kind: "force", level: 3 }] }, { boss: true, tasks: [{ kind: "force", level: 1 }, { kind: "force", level: 2 }, { kind: "force", level: 3 }] }] },
  { id: 2, name: "المرايا", sub: "انعكاس الضوء", law: "light", bg: "bg2", gt: "gt2", color: "#4CC3D9",
    intro: "في عالم المرايا يسير الضوء في خطوط مستقيمة ويرتدّ عند المرايا. وجّهي الشعاع نحو المستشعر.",
    stages: [{ tasks: [{ kind: "light", level: 1 }] }, { tasks: [{ kind: "light", level: 2 }] }, { tasks: [{ kind: "light", level: 3 }] }, { boss: true, tasks: [{ kind: "light", level: 1 }, { kind: "light", level: 1 }, { kind: "light", level: 2 }] }] },
  { id: 3, name: "المقلاع", sub: "الجاذبية والمدارات", law: "gravity", bg: "bg3", gt: null, color: "#9B6BFF",
    intro: "في عالم المقلاع تنحني المسارات حول الكواكب. أطلقي المسبار بالسرعة الصحيحة ليعبر الحلقة.",
    stages: [{ tasks: [{ kind: "gravity", level: 1 }] }, { tasks: [{ kind: "gravity", level: 2 }] }, { tasks: [{ kind: "gravity", level: 3 }] }, { boss: true, tasks: [{ kind: "gravity", level: 2 }, { kind: "gravity", level: 2 }, { kind: "gravity", level: 3 }] }] },
  { id: 4, name: "الذاكرة", sub: "كل القوانين معًا", law: "memory", bg: "bg4", gt: "gt4", color: "#FF8A5C",
    intro: "هنا تلتقي القوانين كلها. في كل مهمة اختاري القانون المناسب أولًا، ثم قيسي واستنتجي وتصرّفي.",
    stages: [{ tasks: [{ kind: "force", level: 2 }, { kind: "light", level: 1 }] },
             { tasks: [{ kind: "light", level: 2 }, { kind: "gravity", level: 2 }] },
             { tasks: [{ kind: "gravity", level: 3 }, { kind: "force", level: 3 }, { kind: "light", level: 3 }] },
             { boss: true, tasks: [{ kind: "force", level: 3 }, { kind: "light", level: 2 }, { kind: "gravity", level: 3 }] }] }
];
const STORY = [
  { img: "story_1", t: "ذاكرة الكون تحفظ قوانينه كلها… حتى جاء «المُشتِّت» فحطّمها إلى أربعة عوالم." },
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
  story: ["The Memory of the Universe held all its laws… until the Scatterer came and shattered it into four worlds.", "Zarra, a little robot, arrived to restore it piece by piece.", "It has only its limited energy… and a mind that measures and deduces.", "Measure, deduce, then act. And don't waste energy!"]
};
const wt = (w, f) => LANG === "en" ? EN.worlds[w.id - 1][f] : w[f];
const lw = (k, f) => LANG === "en" ? EN.laws[k][f] : LAWS[k][f];
const stt = i => LANG === "en" ? EN.story[i] : STORY[i].t;

/* ===== كلام ذرّة ===== */
const SAY = {
  start: [["طاقتي محدودة… فكّري قبل ما نضغط!", "My battery is limited… think before we press!"], ["مستعدة؟ أنا مستعد… تقريبًا.", "Ready? I'm ready… almost."], ["هذا المكان يحتاج عالِمة. وصلتِ في الوقت المناسب!", "This place needs a scientist. Perfect timing!"], ["حرّكيني بالأسهم، أنا أحب المشي!", "Move me with the arrows, I love walking!"]],
  lab: [["مختبر بلا عقوبات! خرّبي براحتك 😄", "A lab with no penalties! Break things freely 😄"], ["هنا كل شيء مسموح. جرّبي أغرب فكرة!", "Anything goes here. Try your weirdest idea!"]],
  measure1: [["رقم جديد! قياس واحد ما يكفي… العلماء يكرّرون.", "New number! One reading isn't enough… scientists repeat."]],
  measure: [["الجدول يحب الأرقام. هاتِ المزيد!", "The table loves numbers. Give it more!"], ["لاحظتِ نمطًا؟ أنا بدأت ألاحظ…", "Spot a pattern? I'm starting to…"], ["تسجيل… تم ✔", "Recording… done ✔"]],
  wrong: [["أممم… الأرقام تقول شيئًا آخر.", "Hmm… the numbers say otherwise."], ["دماغي الإلكتروني اعترض!", "My electronic brain objects!"], ["قريبة! لكن الجدول ما وافق.", "Close! But the table disagrees."]],
  law: [["وجدناه! قانون جديد في الذاكرة ✨", "Found it! A new law for the Memory ✨"], ["الكون تذكّر شيئًا بفضلك!", "The universe remembered something, thanks to you!"]],
  fail: [["أوه… ما كان هذا المقصود.", "Oops… that wasn't the plan."], ["لا بأس، الفشل بيانات أيضًا!", "It's fine, failure is data too!"], ["سجّلتها: لا نكرّرها 😅", "Noted: let's not do that again 😅"], ["على الأقل كان المنظر جميلًا!", "At least it looked cool!"]],
  labmiss: [["ههه! جرّبي قيمة ثانية.", "Ha! Try another value."], ["فشل رائع. ماذا تعلّمنا منه؟", "Beautiful failure. What did we learn?"]],
  good: [["إصابة مباشرة!", "Direct hit!"], ["فيزياء ١٠٠٪!", "100% physics!"], ["شفتي؟ الأرقام ما تكذب.", "See? Numbers don't lie."]],
  low: [["بطاريتي تصفّر… أبغى شحن!", "My battery's beeping… I need a charge!"]],
  collect: [["يمّي! طاقة طازجة ⚡", "Yum! Fresh energy ⚡"], ["+٣… أحس إني أقدر أطير!", "+3… I feel like I could fly!"]],
  idle: [["أنا هنا… أنتظر عبقريتك.", "Still here… waiting for your genius."], ["لو تعبتِ، زر المصباح فيه تلميح 💡", "Stuck? The bulb button has a hint 💡"], ["أفكر في الفيزياء… وفي البطاريات.", "Thinking about physics… and batteries."]],
  boss: [["هذا هو المُشتِّت! 😨 نحن نعرف القانون، لنضربه بالفيزياء!", "That's the Scatterer! 😨 We know the law, let's hit it with physics!"], ["لا تخافي… أقصد، أنا خايف شوي. يلا!", "Don't be scared… okay, I'm a bit scared. Let's go!"]],
  bossnext: [["غضب! ركّزي، القيم تغيّرت.", "It's angry! Focus, the values changed."], ["ضربة ثانية وننتهي منه!", "One more hit and it's done!"]],
  incoming: [["انتبهي! اقفزي ↑", "Watch out! Jump ↑"], ["كرة ظلام قادمة!", "Dark orb incoming!"]],
  grab: [["أمسكتها! دوّريها بـ ← →", "Got it! Rotate with ← →"]],
  ouch: [["آي! هذا الشي يدفّ!", "Ouch! That thing pushes!"], ["اقفزي فوقه المرة الجاية ↑", "Jump over it next time ↑"], ["دوّخني… 😵", "I'm dizzy… 😵"]],
  frag: [["شظية ذاكرة! 💎 الكون يتذكّر أكثر.", "A memory shard! 💎 The universe remembers more."], ["وصلناها! القفزة كانت تستاهل.", "Got it! That jump was worth it."]],
  archive: [["الأرشيف يعرف أسرار هذا العالم 🖥️", "The archive knows this world's secrets 🖥️"], ["تلميح مجاني! المشي له فوائد.", "A free hint! Walking pays off."]]
};

/* ===== كتاب ذاكرة الكون ===== */
const BOOK = {
  force: { icon: "law_force", f: "F = m × a",
    ar: { t: "قانون نيوتن الثاني", d: "الدفعة نفسها تحرّك الجسم الخفيف أسرع من الثقيل. التسارع = القوة ÷ الكتلة.", ex: ["🛒 عربة التسوق الفارغة تنطلق بدفعة خفيفة، والممتلئة تحتاج دفعة أقوى بكثير للتسارع نفسه.", "⚽ ركلة واحدة تطيّر كرة القدم، لكنها بالكاد تحرّك كرة طبية ثقيلة."] },
    en: { t: "Newton's Second Law", d: "The same push moves a light object faster than a heavy one. Acceleration = force ÷ mass.", ex: ["🛒 An empty shopping cart zooms off with a light push; a full one needs a much harder push for the same acceleration.", "⚽ One kick sends a football flying but barely moves a heavy medicine ball."] } },
  light: { icon: "law_light", f: "i = r",
    ar: { t: "قانون الانعكاس", d: "يرتدّ الضوء عن المرآة بالزاوية نفسها التي سقط بها، مقيسةً من العمودي.", ex: ["🔭 البيريسكوب في الغواصة: مرآتان مائلتان بزاوية ٤٥° تنقلان المنظر من فوق الماء.", "🚗 مرآة السيارة الجانبية تريك السيارات خلفك لأن الضوء يرتدّ بالزاوية نفسها."] },
    en: { t: "Law of Reflection", d: "Light bounces off a mirror at the same angle it arrived, measured from the normal.", ex: ["🔭 A submarine periscope uses two mirrors at 45° to bring the view down from above the water.", "🚗 A car's side mirror shows the cars behind you because light bounces at the same angle."] } },
  gravity: { icon: "law_gravity", f: "Δθ ∝ M ÷ v²",
    ar: { t: "الجاذبية والمدارات", d: "الكوكب يحني مسار ما يمرّ بجانبه: كلما زادت كتلته زاد الانحراف، وكلما زادت السرعة قلّ.", ex: ["🛰️ مسبار فوياجر ٢ استعمل جاذبية المشتري وزحل وأورانوس ليغيّر مساره ويصل إلى نبتون.", "🌙 القمر لا يسقط على الأرض لأنه سريع بما يكفي لتحني الجاذبية مساره إلى مدار."] },
    en: { t: "Gravity & Orbits", d: "A planet bends the path of anything passing by: more mass means more bending, more speed means less.", ex: ["🛰️ Voyager 2 used the gravity of Jupiter, Saturn and Uranus to bend its path and reach Neptune.", "🌙 The Moon doesn't fall to Earth because it moves fast enough for gravity to bend its path into an orbit."] } },
  memory: { icon: "law_memory", f: "قِس ← استنتج ← تصرّف",
    ar: { t: "طريقة العلماء", d: "العلم ليس حفظًا: قياس، ثم استنتاج، ثم تجربة تثبت أو تنفي. هذا ما فعلتِه في كل مرحلة.", ex: ["🔬 هكذا اكتشف نيوتن وغاليليو قوانينهما: بتجارب متكررة لا بالتخمين.", "🧠 كل مرة أخطأتِ وأعدتِ النظر في الجدول، كنتِ تفكرين كعالِمة."] },
    en: { t: "The Scientist's Way", d: "Science isn't memorising: measure, deduce, then test. That's what you did in every stage.", ex: ["🔬 That's how Newton and Galileo found their laws: by repeated experiments, not guesses.", "🧠 Every time you got it wrong and looked at the table again, you were thinking like a scientist."] } }
};

const BOSS_TXT = {
  name: ["المُشتِّت", "The Scatterer"],
  intro: ["المُشتِّت هنا! هو من حطّم ذاكرة الكون. اضربيه ٣ ضربات باستخدام القانون الذي تعلّمتِه، ولا يوجد قياس هذه المرة: أنتِ تعرفين القانون! وكل بضع ثوانٍ يطلق كرة ظلام، فاقفزي ↑ أو تحرّكي لتتفاديها، فهي تسرق خلية طاقة.", "The Scatterer is here! It shattered the Memory of the Universe. Hit it 3 times using the law you learned. No measuring this time: you know the law! Every few seconds it fires a dark orb: jump ↑ or move to dodge it, or it steals an energy cell."],
  hint: { force: ["كتلة الصندوق مكتوبة عليه، والتسارع المطلوب مكتوب في الأعلى. استعملي F = m × a.", "The crate's mass is written on it and the needed acceleration is shown at the top. Use F = m × a."],
    light: ["زاوية الانعكاس = زاوية السقوط. الخط المتقطع يريك أين سيذهب الشعاع بعد المرآة الأولى. وجّهيه نحو عين الوحش.", "Angle of reflection = angle of incidence. The dashed line shows where the beam goes after the first mirror. Aim it at the monster's eye."],
    gravity: ["Δθ = 20 × M ÷ v². كتلة الكوكب M مكتوبة عليه. إذن v = √(20 × M ÷ Δθ).", "Δθ = 20 × M ÷ v². The planet's mass M is written on it. So v = √(20 × M ÷ Δθ)."] }
};
