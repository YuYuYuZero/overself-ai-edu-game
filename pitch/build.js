// 生成路演 PPT：node pitch/build.js → pitch/Overself-路演.pptx
// 截图来自 tools/pitch-shots.mjs（游戏真实画面），挑选后放在 pitch/assets/。
const path = require("path");
const pptxgen = require(path.join(process.env.NPM_ROOT || "", "pptxgenjs"));
const A = f => path.join(__dirname, "assets", f);

const C = {
  night: "281C5C", ink: "26243A", cream: "F7F4EE", card: "FFFFFF", muted: "6E6A80",
  T: "4A8FE0", F: "F07C5A", violet: "6B5BD2", line: "E4DFD6", gold: "F2C14E",
};
const FONT = "PingFang SC";
const pres = new pptxgen();
pres.layout = "LAYOUT_16x9"; // 10 × 5.625
pres.title = "MBTI 性格修炼手册（Overself）";
pres.author = "Overself";

const shadow = () => ({ type: "outer", color: "000000", blur: 8, offset: 3, angle: 135, opacity: 0.22 });
// 视觉母题：蓝 | 珊瑚 两段色条（T 与 F，两面）
function duo(s, x, y, w = 0.9, h = 0.08) {
  s.addShape(pres.shapes.RECTANGLE, { x, y, w: w / 2, h, fill: { color: C.T }, line: { color: C.T, width: 0 } });
  s.addShape(pres.shapes.RECTANGLE, { x: x + w / 2, y, w: w / 2, h, fill: { color: C.F }, line: { color: C.F, width: 0 } });
}
function head(s, kicker, title, dark) {
  duo(s, 0.5, 0.42);
  s.addText(kicker, { x: 1.5, y: 0.3, w: 7, h: 0.3, fontFace: FONT, fontSize: 11, color: dark ? "B9B4D6" : C.muted, margin: 0, charSpacing: 2 });
  s.addText(title, { x: 0.5, y: 0.62, w: 9, h: 0.65, fontFace: FONT, fontSize: 26, bold: true, color: dark ? "FFFFFF" : C.ink, margin: 0 });
}
function shot(s, file, x, y, w, opt = {}) {
  const h = w * 9 / 16;
  s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: "000000" }, line: { color: opt.border || "FFFFFF", width: opt.bw ?? 2 }, shadow: shadow() });
  s.addImage({ path: A(file), x, y, w, h });
  if (opt.cap) s.addText(opt.cap, { x, y: y + h + 0.06, w, h: 0.3, fontFace: FONT, fontSize: 10, color: opt.capColor || C.muted, margin: 0, align: opt.capAlign || "left" });
  return h;
}
function bullets(s, items, x, y, w, h, o = {}) {
  s.addText(items.map((t, i) => {
    const runs = Array.isArray(t) ? t : [t];
    return runs.map((r, j) => ({ text: typeof r === "string" ? r : r.text, options: { ...(typeof r === "string" ? {} : r.options), breakLine: j === runs.length - 1 && i < items.length - 1 } }));
  }).flat(), { x, y, w, h, fontFace: FONT, fontSize: o.size || 13, color: o.color || C.ink, valign: "top", margin: 0, paraSpaceAfter: o.gap ?? 8, lineSpacingMultiple: 1.15 });
}
function tagPill(s, text, x, y, color, w) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: w || 0.15 + text.length * 0.16, h: 0.28, fill: { color }, line: { color, width: 0 }, rectRadius: 0.14 });
  s.addText(text, { x, y, w: w || 0.15 + text.length * 0.16, h: 0.28, fontFace: FONT, fontSize: 10, bold: true, color: "FFFFFF", align: "center", valign: "middle", margin: 0 });
}
function page(s, n, dark) {
  s.addText(String(n), { x: 9.3, y: 5.25, w: 0.4, h: 0.25, fontFace: FONT, fontSize: 9, color: dark ? "8C88A8" : "A39E92", align: "right", margin: 0 });
}
let N = 0;
const light = () => { const s = pres.addSlide(); s.background = { color: C.cream }; page(s, ++N); return s; };
const darkS = () => { const s = pres.addSlide(); s.background = { color: C.night }; page(s, ++N, true); return s; };

// 1 封面 ---------------------------------------------------------------
{
  const s = pres.addSlide(); N++;
  s.background = { path: A("c-stage.png") };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 5.625, fill: { color: C.night, transparency: 8 }, line: { color: C.night, width: 0 } });
  s.addImage({ path: path.join(__dirname, "..", "demo", "img", "logo-icon.png"), x: 0.7, y: 1.0, w: 1.1, h: 1.1, rounding: true });
  s.addText("Overself", { x: 1.95, y: 1.3, w: 4, h: 0.5, fontFace: FONT, fontSize: 18, bold: true, color: "D9CDFA", margin: 0, charSpacing: 4 });
  s.addText([{ text: "MBTI ", options: { color: "FFFFFF" } }, { text: "性格修炼手册", options: { color: "C9B2FF" } }],
    { x: 0.7, y: 2.3, w: 8.5, h: 0.95, fontFace: FONT, fontSize: 48, bold: true, margin: 0 });
  s.addText("测出你的 MBTI，体验另一面，解锁另一个你。", { x: 0.7, y: 3.35, w: 7, h: 0.45, fontFace: FONT, fontSize: 18, color: C.gold, bold: true, margin: 0 });
  s.addText("yuyuyuzero.github.io/overself-ai-edu-game", { x: 0.7, y: 4.85, w: 6, h: 0.3, fontFace: FONT, fontSize: 11, color: "B9B4D6", margin: 0 });
}

// 2 问题：测完然后呢 ------------------------------------------------------
{
  const s = darkS();
  head(s, "我们看到的问题", "MBTI 测完了，然后呢？", true);
  s.addText([
    { text: "「我是 INFP」「他是典型的 ESTJ」——MBTI 已经是很多人认识自己的第一种语言。", options: { breakLine: true } },
    { text: "可大多数测试停在第一步：给你四个字母、一段描述，然后就结束了。", options: { breakLine: true } },
    { text: "你知道自己是 T，却从没从 F 的眼睛里看过自己说的那句话。", options: { bold: true, color: C.gold } },
  ], { x: 0.5, y: 1.45, w: 4.3, h: 3.4, fontFace: FONT, fontSize: 14, color: "E6E3F3", margin: 0, valign: "top", paraSpaceAfter: 14, lineSpacingMultiple: 1.2 });
  const rows = [["测出类型", "✓", "✓"], ["体验另一型怎么想", "只能读描述", "✓ 换到对方身上重走一遍"], ["把另一面练出来", "—", "✓ 倒带重来 + 本周小任务"]];
  const hdr = t => ({ text: t, options: { bold: true, color: "FFFFFF", fill: { color: "4D3C8F" } } });
  s.addTable([[hdr(""), hdr("一般的 MBTI 测试"), { text: "MBTI 性格修炼手册", options: { bold: true, color: C.night, fill: { color: C.gold } } }],
    ...rows.map(r => r.map((t, i) => ({ text: t, options: { color: i === 2 ? C.gold : i === 0 ? "FFFFFF" : "B9B4D6", bold: i === 0 } })))],
    { x: 5.05, y: 1.5, w: 4.45, colW: [1.35, 1.35, 1.75], fontFace: FONT, fontSize: 11.5, border: { pt: 0.75, color: "5A4A9C" }, fill: { color: "3A2B78" }, rowH: 0.62, valign: "middle" });
}

// 3 产品概念：测 → 体验 → 解锁 ---------------------------------------------
{
  const s = light();
  head(s, "产品概念", "三步：测 → 体验 → 解锁");
  const steps = [
    ["测", "测出你的类型", "22 道情境题，得到四个字母、每一维的偏向，以及你的解锁方向和最像你的角色", C.violet],
    ["验", "体验另一面", "以和你同型的角色走进真实故事，再切到相反类型的人身上。同一句话，你先当说的人，再当听的人", C.F],
    ["解", "解锁另一个你", "倒带回到那一刻换一种做法；带走技能卡和本周小任务，把不常用的那一面也练出来", C.T],
  ];
  steps.forEach(([n, t, d, c], i) => {
    const x = 0.5 + i * 3.05, w = 2.85;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.5, w, h: 3.0, fill: { color: C.card }, line: { color: C.line, width: 1 } });
    s.addShape(pres.shapes.OVAL, { x: x + 0.25, y: 1.75, w: 0.8, h: 0.8, fill: { color: c }, line: { color: c, width: 0 } });
    s.addText(n, { x: x + 0.25, y: 1.75, w: 0.8, h: 0.8, fontFace: FONT, fontSize: 24, bold: true, color: "FFFFFF", align: "center", valign: "middle", margin: 0 });
    if (i < 2) s.addText("→", { x: x + w - 0.05, y: 2.75, w: 0.3, h: 0.4, fontFace: FONT, fontSize: 18, bold: true, color: C.muted, align: "center", margin: 0 });
    s.addText(t, { x: x + 0.25, y: 2.7, w: w - 0.5, h: 0.4, fontFace: FONT, fontSize: 17, bold: true, color: c, margin: 0 });
    s.addText(d, { x: x + 0.25, y: 3.15, w: w - 0.5, h: 1.25, fontFace: FONT, fontSize: 11.5, color: C.ink, margin: 0, valign: "top" });
  });
  s.addText("解锁不是把 T 变成 F：另一面本来就在你身上，只是还没打开。Overself = 越过习惯的自己。", { x: 0.5, y: 4.7, w: 9, h: 0.4, fontFace: FONT, fontSize: 13, bold: true, color: C.violet, margin: 0 });
}

// 4 测：22 题 + 结果页 ----------------------------------------------------
{
  const s = light();
  head(s, "第一步 · 测", "测完不是结束，而是给你一个解锁方向");
  bullets(s, [
    [{ text: "22 道情境题", options: { bold: true } }, "：E/I、S/N、J/P 各 5 题，T/F 7 题；每维奇数题，不会打平"],
    [{ text: "四个字母 + 维度条形图", options: { bold: true } }, "：两边很接近时，提示「两种方式你都常用」"],
    [{ text: "你的解锁方向", options: { bold: true } }, "：T → 解锁 F「读懂人心」；F → 解锁 T「冷静解题」"],
    [{ text: "最像你的角色", options: { bold: true } }, "：六个主角各有 MBTI，按字母重合度推荐你从谁开始"],
    [{ text: "另外三维", options: { bold: true } }, "：E/I、S/N、J/P 的解锁方向一并给出（即将上线）"],
  ], 0.5, 1.5, 4.1, 3.6, { size: 12.5, gap: 10 });
  shot(s, "result.png", 4.9, 1.5, 4.6, { cap: "测试结果页：类型、维度、解锁方向、推荐角色" });
}

// 5 第一组解锁：T 与 F -----------------------------------------------------
{
  const s = light();
  head(s, "第一组解锁", "T 与 F：道理都懂，那一刻只会用习惯的一面");
  const col = (x, c, who, good, stuck, moment, learn) => {
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.5, w: 4.4, h: 3.55, fill: { color: C.card }, line: { color: C.line, width: 1 } });
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.5, w: 4.4, h: 0.08, fill: { color: c }, line: { color: c, width: 0 } });
    s.addText([
      { text: who, options: { bold: true, color: c, fontSize: 16, breakLine: true } },
      { text: "长处　", options: { color: C.muted, fontSize: 10 } }, { text: good, options: { breakLine: true } },
      { text: "卡点　", options: { color: C.muted, fontSize: 10 } }, { text: stuck, options: { breakLine: true } },
      { text: "那一刻　", options: { color: C.muted, fontSize: 10 } }, { text: moment, options: { breakLine: true } },
      { text: learn, options: { bold: true, color: c, fontSize: 14 } },
    ], { x: x + 0.25, y: 1.7, w: 3.95, h: 3.25, fontFace: FONT, fontSize: 12, color: C.ink, margin: 0, valign: "top", paraSpaceAfter: 9 });
  };
  col(0.5, C.T, "T 型（思考）", "冷静、讲道理、会解决问题", "道理都对，却读不懂人心；方案给早了，被听成冷漠", "同学说「我不跳了」，ISTJ 的班长脱口而出：「那就换人吧。」", "→ 解锁 F · 读懂人心");
  col(5.1, C.F, "F 型（情感）", "敏锐、体贴、懂别人的感受", "感受很深，却被情绪带着走；情绪最高时做了收不回的决定", "ENFP 的文艺委员只听见「不跳了」，掏出手机就要往 48 人的班群发长文。", "→ 解锁 T · 冷静解题");
}

// 6 体验：每一章的循环 -----------------------------------------------------
{
  const s = darkS();
  head(s, "第二步 · 体验", "每一章都是同一个循环", true);
  const steps = [
    ["1", "经历", "以和你同型的角色进入故事，用你习惯的方式做选择", C.F],
    ["2", "镜面", "切到相反类型的人身上重走一遍。你说的每句话，屏幕上都会浮出「对方听到的」", C.violet],
    ["3", "倒带", "时间回到关键那一刻，换一种做法", C.T],
    ["4", "复盘", "并排看「第一次」与「倒带后」，收技能卡，领本周小任务", C.gold],
  ];
  steps.forEach(([n, t, d, c], i) => {
    const x = 0.5 + i * 2.3, w = 2.1;
    s.addShape(pres.shapes.OVAL, { x, y: 1.6, w: 0.7, h: 0.7, fill: { color: c }, line: { color: c, width: 0 } });
    s.addText(n, { x, y: 1.6, w: 0.7, h: 0.7, fontFace: FONT, fontSize: 22, bold: true, color: "FFFFFF", align: "center", valign: "middle", margin: 0 });
    if (i < 3) s.addShape(pres.shapes.LINE, { x: x + 0.85, y: 1.95, w: 1.3, h: 0, line: { color: "5A4A9C", width: 1.5, dashType: "dash" } });
    s.addText(t, { x, y: 2.5, w, h: 0.45, fontFace: FONT, fontSize: 20, bold: true, color: c, margin: 0 });
    s.addText(d, { x, y: 3.0, w, h: 1.0, fontFace: FONT, fontSize: 12, color: "E6E3F3", margin: 0, valign: "top" });
  });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 4.3, w: 9, h: 0.75, fill: { color: "3A2B78" }, line: { color: "3A2B78", width: 0 } });
  s.addText([
    { text: "倒带不扣分。", options: { bold: true, color: C.gold } },
    { text: "第一次的自然反应只用来看见\"你这一型的习惯\"；倒带后的那个选择，是你解锁出来的一种。" },
  ], { x: 0.7, y: 4.3, w: 8.6, h: 0.75, fontFace: FONT, fontSize: 13, color: "FFFFFF", valign: "middle", margin: 0 });
}

// 7 一段真实体验 --------------------------------------------
{
  const s = light();
  head(s, "一段真实体验 · 校园篇《汇演前三天》", "领舞说「不跳了」——ENFP 和 ISTJ 各自卡住");
  shot(s, "c-filter.png", 0.5, 1.5, 4.6, { cap: "情绪滤镜：情绪最高时，原因（前半句）被模糊掉了" });
  const flow = [
    ["情绪滤镜", "小满（ENFP）只听见「不跳了、找别人吧」"],
    ["冲动 6 秒", "班群长文 / 撂挑子 / 私聊骂人；选了就看见后果，再被倒回"],
    ["暂停 · 回听", "「她第一句就说了原因」"],
    ["分类 · 提问", "分开事实和剧本；车来前只能问两个问题"],
    ["镜面", "换成陈屿（ISTJ）：「换人吧」被听成「你那三个星期也不重要」"],
    ["排序 · 拼句", "按「卡住了谁」排先后；给班群发一条只有事实和安排的消息"],
  ];
  flow.forEach(([t, d], i) => {
    const y = 1.5 + i * 0.6;
    s.addShape(pres.shapes.OVAL, { x: 5.4, y: y + 0.08, w: 0.32, h: 0.32, fill: { color: i === 4 ? C.violet : i % 2 ? C.F : C.T }, line: { color: "FFFFFF", width: 0 } });
    s.addText(String(i + 1), { x: 5.4, y: y + 0.08, w: 0.32, h: 0.32, fontFace: FONT, fontSize: 11, bold: true, color: "FFFFFF", align: "center", valign: "middle", margin: 0 });
    s.addText([{ text: t + "　", options: { bold: true } }, { text: d, options: { color: C.muted } }], { x: 5.85, y, w: 3.65, h: 0.5, fontFace: FONT, fontSize: 11, color: C.ink, margin: 0, valign: "middle" });
  });
}

// 8 镜面 ---------------------------------------------------------------
{
  const s = light();
  head(s, "核心时刻 · 镜面", "T 说的，和 F 听到的");
  const rows = [
    [{ text: "陈屿（ISTJ）说的", options: { bold: true, color: "FFFFFF", fill: { color: C.T } } }, { text: "小满（ENFP）听到的", options: { bold: true, color: "FFFFFF", fill: { color: C.F } } }],
    ["换人吧，赵婷是替补，三天够了。", "林可不重要。你那三个星期也不重要。"],
    ["她早退本来就影响排练，走了反而省事。", "是你选错了人。"],
    ["先别急着定，会不会是排练时间的问题？", "这件事可能有解。"],
    ["你先坐会儿。三个星期白练谁都难受。我们一起想办法。", "我看见你了，你不是一个人。"],
  ];
  s.addTable(rows, { x: 0.5, y: 1.5, w: 5.0, colW: [2.6, 2.4], fontFace: FONT, fontSize: 11.5, color: C.ink, border: { pt: 0.75, color: C.line }, fill: { color: C.card }, rowH: 0.6, valign: "middle" });
  s.addShape(pres.shapes.RECTANGLE, { x: 5.8, y: 1.5, w: 3.7, h: 3.0, fill: { color: C.night }, line: { color: C.night, width: 0 } });
  s.addText([
    { text: "镜面结束时的旁白", options: { color: "B9B4D6", fontSize: 10, breakLine: true } },
    { text: "她其实想说的是——「我好慌。三个星期的心血要没了，我需要有人跟我站在一起。」", options: { breakLine: true } },
    { text: "你给了她一个方案。她那时候要的，是一个同伴。", options: { bold: true, color: C.gold } },
  ], { x: 6.0, y: 1.65, w: 3.3, h: 2.7, fontFace: FONT, fontSize: 14, color: "FFFFFF", margin: 0, valign: "top", paraSpaceAfter: 10 });
  s.addText("这就是这个游戏最想制造的那一声「啊」。", { x: 5.8, y: 4.65, w: 3.7, h: 0.4, fontFace: FONT, fontSize: 12, bold: true, color: C.violet, margin: 0 });
}

// 9 解锁了什么 ------------------------------------------------------
{
  const s = light();
  head(s, "第三步 · 解锁", "冷静不是忍住，共情不是附和");
  const col = (x, c, t, items) => {
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.5, w: 4.4, h: 3.55, fill: { color: C.card }, line: { color: C.line, width: 1 } });
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.5, w: 4.4, h: 0.08, fill: { color: c }, line: { color: c, width: 0 } });
    s.addText(t, { x: x + 0.25, y: 1.7, w: 4, h: 0.4, fontFace: FONT, fontSize: 16, bold: true, color: c, margin: 0 });
    s.addText(items.map((it, i) => ({ text: it, options: { bullet: true, breakLine: i < items.length - 1 } })),
      { x: x + 0.25, y: 2.2, w: 3.95, h: 2.75, fontFace: FONT, fontSize: 12.5, color: C.ink, margin: 0, valign: "top", paraSpaceAfter: 8 });
  };
  col(0.5, C.T, "T 解锁 F · 读懂人心", ["看见信号：低头、攥紧的手、躲开的视线", "先接住情绪，再说事", "知道自己那句话会被听成什么", "情绪也是事实，也是要处理的问题"]);
  col(5.1, C.F, "F 解锁 T · 冷静解题", ["先听全原话，情绪最高时不做决定", "分开事实、评判、读心术、灾难化", "先问清楚，再下判断", "按「卡住了谁」排先后，对事不对人", "发一条事实 + 安排 + 请求的消息"]);
}

// 10 三个故事 ------------------------------------------------------------
{
  const s = light();
  head(s, "内容", "三个故事，六个主角，每人都有自己的 MBTI");
  const st = [
    ["校园《汇演前三天》", "推荐首玩 · 30 分钟", "元旦汇演前三天，领舞突然说不跳了。", "陈屿 ISTJ：先看见人，再排人", "苏小满 ENFP：情绪是警报不是导航", C.violet],
    ["家庭《那一周》", "60 分钟", "妈妈摔倒骨折，一对性格相反的姐弟在医院的七天。", "弟弟林朗 ISTP：先接情绪，再说事", "姐姐林晚 ESFJ：把害怕变成问题", C.T],
    ["职场《第一次带项目》", "30 分钟", "上线前一周客户改需求，总监当众问：「这个排期是谁拍的脑袋？」", "赵总监 ENTJ：知道自己那句话被听成了什么", "许诺 INFP：把批评当信息，交出能执行的方案", C.F],
  ];
  st.forEach(([t, sub, plot, a, b, c], i) => {
    const x = 0.5 + i * 3.05, w = 2.85;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.5, w, h: 3.55, fill: { color: C.card }, line: { color: C.line, width: 1 } });
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.5, w, h: 0.08, fill: { color: c }, line: { color: c, width: 0 } });
    s.addText(String(i + 1), { x: x + 0.2, y: 1.7, w: 0.6, h: 0.6, fontFace: FONT, fontSize: 30, bold: true, color: c, margin: 0 });
    s.addText(t, { x: x + 0.2, y: 2.3, w: w - 0.4, h: 0.35, fontFace: FONT, fontSize: 14, bold: true, color: C.ink, margin: 0 });
    s.addText(sub, { x: x + 0.2, y: 2.65, w: w - 0.4, h: 0.25, fontFace: FONT, fontSize: 10, color: C.muted, margin: 0 });
    s.addText([
      { text: plot, options: { breakLine: true } },
      { text: a, options: { color: C.T, breakLine: true } },
      { text: b, options: { color: "D2603F" } },
    ], { x: x + 0.2, y: 3.0, w: w - 0.4, h: 1.95, fontFace: FONT, fontSize: 11, color: C.ink, margin: 0, valign: "top", paraSpaceAfter: 6 });
  });
}

// 11 产品画面 -------------------------------------------------------------
{
  const s = light();
  head(s, "产品", "浏览器即玩：漫画幻灯片式的视觉小说");
  shot(s, "home.png", 0.5, 1.45, 4.5, { cap: "首页：测 → 体验 → 解锁、T 与 F、三个故事" });
  shot(s, "c-decode.png", 5.2, 1.45, 4.3, { cap: "镜面解码：「对方听到的」浮在画面上" });
  s.addText("21 个按年龄与人设设计的角色 × 9 种表情 · 21 张场景 · 程序化音乐音效 · 全局进度条与目录，课堂可直接跳到某一刻", { x: 0.5, y: 4.55, w: 9, h: 0.5, fontFace: FONT, fontSize: 12, color: C.ink, margin: 0 });
}

// 12 解锁路线图 -----------------------------------------------------------
{
  const s = darkS();
  head(s, "解锁路线图", "T/F 只是第一组，四个维度都要解锁", true);
  const rows = [
    ["T / F", "T 解锁 F · 读懂人心", "F 解锁 T · 冷静解题", "✅ 已上线"],
    ["E / I", "E 解锁 I · 安静地听", "I 解锁 E · 迈出第一句", "下一组"],
    ["J / P", "J 解锁 P · 拥抱计划外", "P 解锁 J · 学会做计划", "规划中"],
    ["S / N", "S 解锁 N · 看见可能性", "N 解锁 S · 落到细节", "规划中"],
  ];
  const hdr = t => ({ text: t, options: { bold: true, color: "FFFFFF", fill: { color: "4D3C8F" } } });
  s.addTable([[hdr("维度"), hdr("这一边解锁…"), hdr("那一边解锁…"), hdr("状态")],
    ...rows.map((r, k) => r.map((t, i) => ({ text: t, options: { color: i === 3 ? (k ? "B9B4D6" : C.gold) : "FFFFFF", bold: i === 0 || (i === 3 && !k) } })))],
    { x: 0.5, y: 1.5, w: 9, colW: [1.2, 3.1, 3.1, 1.6], fontFace: FONT, fontSize: 12.5, border: { pt: 0.75, color: "5A4A9C" }, fill: { color: "3A2B78" }, rowH: 0.55, valign: "middle" });
  s.addText("每一维都用同一套方法：找到两边各自「那一刻」的卡点 → 写一个双视角故事 → 配一组 3 分钟日常练习。测试结果页已经给出另外三维的解锁方向。", { x: 0.5, y: 4.45, w: 9, h: 0.6, fontFace: FONT, fontSize: 12, color: "E6E3F3", margin: 0 });
}

// 13 落地 + 现状 ---------------------------------------------------------
{
  const s = light();
  head(s, "落地与现状", "可玩 Demo 已上线，下一步是验证效果");
  const stats = [["22", "题 MBTI 测试"], ["3", "个完整故事"], ["6", "个练习关"], ["0", "安装，浏览器即玩"]];
  stats.forEach(([n, l], i) => {
    const x = 0.5 + i * 2.3;
    s.addText(n, { x, y: 1.4, w: 2.1, h: 0.8, fontFace: FONT, fontSize: 40, bold: true, color: [C.violet, C.T, C.F, C.ink][i], margin: 0 });
    s.addText(l, { x, y: 2.2, w: 2.1, h: 0.3, fontFace: FONT, fontSize: 11.5, color: C.muted, margin: 0 });
  });
  const block = (x, t, items) => {
    s.addText(t, { x, y: 2.75, w: 2.85, h: 0.35, fontFace: FONT, fontSize: 14, bold: true, color: C.ink, margin: 0 });
    s.addText(items.map((it, i) => ({ text: it, options: { bullet: true, breakLine: i < items.length - 1 } })), { x, y: 3.15, w: 2.85, h: 2.0, fontFace: FONT, fontSize: 11, color: C.ink, margin: 0, valign: "top", paraSpaceAfter: 6 });
  };
  block(0.5, "怎么用", ["个人：测完 MBTI 直接进故事，一章约 15 分钟", "朋友 / 情侣 / 团队：T 和 F 各玩一边，再交换「你听到的那一句」", "班会、新人培训：按 T/F 分组选视角"]);
  block(3.55, "在验证", ["测完之后，愿不愿意继续玩故事", "镜面那一刻，有没有那一声「啊」", "一周后，有没有用上「本周小任务」"]);
  block(6.6, "下一步", ["E/I 解锁故事", "小范围试玩", "测试结果分享卡，带来新玩家"]);
}

// 14 结尾 ---------------------------------------------------------------
{
  const s = darkS();
  duo(s, 0.7, 1.6, 1.2, 0.1);
  s.addText("你学会了另一面。\n不是变成对方——是你们之间，多了一种语言。", { x: 0.7, y: 1.85, w: 8.6, h: 1.4, fontFace: FONT, fontSize: 24, bold: true, color: "FFFFFF", margin: 0, valign: "top" });
  s.addText("——校园篇结局「追光」", { x: 0.7, y: 3.25, w: 8, h: 0.35, fontFace: FONT, fontSize: 12, color: C.gold, margin: 0 });
  s.addText("MBTI 性格修炼手册 · Overself", { x: 0.7, y: 4.3, w: 8, h: 0.35, fontFace: FONT, fontSize: 14, bold: true, color: "FFFFFF", margin: 0 });
  s.addText("在线试玩：yuyuyuzero.github.io/overself-ai-edu-game", { x: 0.7, y: 4.68, w: 8, h: 0.3, fontFace: FONT, fontSize: 11, color: "C9C4E6", margin: 0 });
}

pres.writeFile({ fileName: path.join(__dirname, "Overself-路演.pptx") }).then(f => console.log("写入", f));
