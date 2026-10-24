// 生成路演 PPT：node pitch/build.js → pitch/Overself-路演.pptx
// 截图来自 tools/pitch-shots.mjs（游戏真实画面），挑选后放在 pitch/assets/。
const path = require("path");
const pptxgen = require(path.join(process.env.NPM_ROOT || "", "pptxgenjs"));
const A = f => path.join(__dirname, "assets", f);

const C = {
  night: "1B1A33", ink: "26243A", cream: "F7F4EE", card: "FFFFFF", muted: "6E6A80",
  T: "4A8FE0", F: "F07C5A", violet: "6B5BD2", line: "E4DFD6", gold: "F2C14E",
};
const FONT = "PingFang SC";
const pres = new pptxgen();
pres.layout = "LAYOUT_16x9"; // 10 × 5.625
pres.title = "Overself —— AI for 人格成长";
pres.author = "Overself";

const shadow = () => ({ type: "outer", color: "000000", blur: 8, offset: 3, angle: 135, opacity: 0.22 });
// 视觉母题：蓝 | 珊瑚 两段色条（偏理性与偏感性，两面）
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
  duo(s, 0.7, 1.35, 1.2, 0.1);
  s.addText("Overself", { x: 0.7, y: 1.55, w: 7, h: 1.1, fontFace: FONT, fontSize: 60, bold: true, color: "FFFFFF", margin: 0, charSpacing: 2 });
  s.addText("AI for 人格成长 · 不做应试，做成长", { x: 0.7, y: 2.75, w: 7, h: 0.5, fontFace: FONT, fontSize: 24, bold: true, color: C.gold, margin: 0 });
  s.addText("分数之外，也要长成更好的人。", { x: 0.7, y: 3.3, w: 7, h: 0.4, fontFace: FONT, fontSize: 15, color: "FFFFFF", margin: 0 });
  s.addText("yuyuyuzero.github.io/overself-ai-edu-game", { x: 0.7, y: 4.85, w: 6, h: 0.3, fontFace: FONT, fontSize: 11, color: "B9B4D6", margin: 0 });
}

// 2 背景：分数之外 ----------------------------------------------------------
{
  const s = darkS();
  head(s, "为什么做", "分数之外，人格的成长常常被搁在一边", true);
  s.addText([
    { text: "十几年围着分数转。可走出考场以后，真正决定一个人过得好不好的，常常是另一些能力：", options: { breakLine: true } },
    { text: "能不能读懂身边的人；能不能在情绪上头时稳住自己；能不能把一件砸过来的事拆开、解决掉。", options: { bold: true, color: C.gold, breakLine: true } },
    { text: "这些能力没有考纲，也很少有人系统地教。我们不做应试产品——AI for 人格成长。" },
  ], { x: 0.5, y: 1.45, w: 4.3, h: 3.2, fontFace: FONT, fontSize: 13.5, color: "E6E3F3", margin: 0, valign: "top", paraSpaceAfter: 12, lineSpacingMultiple: 1.2 });
  const col = (x, c, who, good, stuck, learn) => {
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.45, w: 2.2, h: 3.6, fill: { color: "2C2A4A" }, line: { color: c, width: 1.5 } });
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.45, w: 2.2, h: 0.08, fill: { color: c }, line: { color: c, width: 0 } });
    s.addText([
      { text: who, options: { bold: true, color: c, fontSize: 15, breakLine: true } },
      { text: "长处", options: { color: "8C88A8", fontSize: 9.5, breakLine: true } },
      { text: good, options: { breakLine: true } },
      { text: "容易卡住", options: { color: "8C88A8", fontSize: 9.5, breakLine: true } },
      { text: stuck, options: { breakLine: true } },
      { text: "在这里学", options: { color: "8C88A8", fontSize: 9.5, breakLine: true } },
      { text: learn, options: { bold: true, color: c } },
    ], { x: x + 0.15, y: 1.65, w: 1.9, h: 3.3, fontFace: FONT, fontSize: 11, color: "FFFFFF", margin: 0, valign: "top", paraSpaceAfter: 5 });
  };
  col(5.05, C.T, "偏理性的人", "冷静、讲道理、会解决问题", "道理都对，却读不懂人心；方案给早了，被听成冷漠", "读懂人心");
  col(7.3, C.F, "偏感性的人", "敏锐、体贴、懂别人的感受", "感受很深，却被情绪带着走；情绪最高时做了收不回的决定", "稳住情绪，冷静解题");
  s.addText("不用 MBTI 字母、不贴标签：每个人都有两面，只是压力下更习惯用其中一面。", { x: 0.5, y: 4.85, w: 4.3, h: 0.4, fontFace: FONT, fontSize: 10.5, color: "B9B4D6", margin: 0 });
}

// 3 问题 ---------------------------------------------------------------
{
  const s = light();
  head(s, "我们要解决的问题", "道理人人都懂，可到了那一刻，人只会用习惯的那一面");
  const rows = [
    [C.T, "偏理性的人", "知道\"要共情\"。可同学说\"我不跳了\"，脱口而出的是：「那就换人吧。」"],
    [C.F, "偏感性的人", "知道\"要冷静\"。可只听见\"不跳了\"四个字，掏出手机就要往 48 人的班群发长文。"],
  ];
  rows.forEach(([c, t, d], i) => {
    const x = 0.5 + i * 4.6;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.55, w: 4.4, h: 1.5, fill: { color: C.card }, line: { color: C.line, width: 1 } });
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.55, w: 0.08, h: 1.5, fill: { color: c }, line: { color: c, width: 0 } });
    s.addText(t, { x: x + 0.25, y: 1.7, w: 4, h: 0.35, fontFace: FONT, fontSize: 15, bold: true, color: c, margin: 0 });
    s.addText(d, { x: x + 0.25, y: 2.1, w: 4, h: 0.85, fontFace: FONT, fontSize: 13, color: C.ink, margin: 0, valign: "top" });
  });
  s.addText("卡住人的从来不是知识，而是「那一刻的视角」。", { x: 0.5, y: 3.45, w: 9, h: 0.5, fontFace: FONT, fontSize: 20, bold: true, color: C.violet, margin: 0 });
  s.addText("所以我们不出题、不讲道理，而是把人放回那一刻：同一句话，你先当说的人，再当听的人。", { x: 0.5, y: 4.0, w: 9, h: 0.5, fontFace: FONT, fontSize: 14, color: C.muted, margin: 0 });
}

// 4 解法：核心循环 ------------------------------------------------------
{
  const s = darkS();
  head(s, "我们的解法", "每一章都是同一个循环", true);
  const steps = [
    ["1", "经历", "以和你相像的那个人进入故事，用你习惯的方式做选择", C.F],
    ["2", "镜面", "切到对方身上重走一遍。你说的每句话，屏幕上都会浮出「对方听到的」", C.violet],
    ["3", "倒带", "时间回到关键那一刻，换一种做法", C.T],
    ["4", "复盘", "并排看「第一次」与「倒带后」，收技能卡，领本周小任务", C.gold],
  ];
  steps.forEach(([n, t, d, c], i) => {
    const x = 0.5 + i * 2.3, w = 2.1;
    s.addShape(pres.shapes.OVAL, { x, y: 1.6, w: 0.7, h: 0.7, fill: { color: c }, line: { color: c, width: 0 } });
    s.addText(n, { x, y: 1.6, w: 0.7, h: 0.7, fontFace: FONT, fontSize: 22, bold: true, color: "FFFFFF", align: "center", valign: "middle", margin: 0 });
    if (i < 3) s.addShape(pres.shapes.LINE, { x: x + 0.85, y: 1.95, w: 1.3, h: 0, line: { color: "4A4770", width: 1.5, dashType: "dash" } });
    s.addText(t, { x, y: 2.5, w, h: 0.45, fontFace: FONT, fontSize: 20, bold: true, color: c, margin: 0 });
    s.addText(d, { x, y: 3.0, w, h: 1.0, fontFace: FONT, fontSize: 12, color: "E6E3F3", margin: 0, valign: "top" });
  });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 4.3, w: 9, h: 0.75, fill: { color: "2C2A4A" }, line: { color: "2C2A4A", width: 0 } });
  s.addText([
    { text: "倒带不扣分。", options: { bold: true, color: C.gold } },
    { text: "第一次的自然反应只用来看见\"你的习惯\"；倒带后的那个选择，是你多出来的一种。" },
  ], { x: 0.7, y: 4.3, w: 8.6, h: 0.75, fontFace: FONT, fontSize: 13, color: "FFFFFF", valign: "middle", margin: 0 });
}

// 5 一段真实体验（唯一的实机流程页） --------------------------------------------
{
  const s = light();
  head(s, "一段真实体验 · 校园篇《汇演前三天》", "领舞说「不跳了」——同一个傍晚，两个人各自卡住");
  shot(s, "c-filter.png", 0.5, 1.5, 4.6, { cap: "情绪滤镜：情绪最高时，原因（前半句）被模糊掉了" });
  const flow = [
    ["情绪滤镜", "小满只听见「不跳了、找别人吧」"],
    ["冲动 6 秒", "班群长文 / 撂挑子 / 私聊骂人；选了就看见后果，再被倒回"],
    ["暂停 · 回听", "「她第一句就说了原因」"],
    ["分类 · 提问", "分开事实和剧本；车来前只能问两个问题"],
    ["镜面", "换成陈屿：「换人吧」被听成「你那三个星期也不重要」"],
    ["排序 · 拼句", "按「卡住了谁」排先后；给班群发一条只有事实和安排的消息"],
  ];
  flow.forEach(([t, d], i) => {
    const y = 1.5 + i * 0.6;
    s.addShape(pres.shapes.OVAL, { x: 5.4, y: y + 0.08, w: 0.32, h: 0.32, fill: { color: i === 4 ? C.violet : i % 2 ? C.F : C.T }, line: { color: "FFFFFF", width: 0 } });
    s.addText(String(i + 1), { x: 5.4, y: y + 0.08, w: 0.32, h: 0.32, fontFace: FONT, fontSize: 11, bold: true, color: "FFFFFF", align: "center", valign: "middle", margin: 0 });
    s.addText([{ text: t + "　", options: { bold: true } }, { text: d, options: { color: C.muted } }], { x: 5.85, y, w: 3.65, h: 0.5, fontFace: FONT, fontSize: 11, color: C.ink, margin: 0, valign: "middle" });
  });
}

// 6 镜面 ---------------------------------------------------------------
{
  const s = light();
  head(s, "核心时刻 · 镜面", "同一个意思，换一种说法，对方听到的完全不同");
  const rows = [
    [{ text: "陈屿说的", options: { bold: true, color: "FFFFFF", fill: { color: C.T } } }, { text: "小满听到的", options: { bold: true, color: "FFFFFF", fill: { color: C.F } } }],
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

// 7 两个方向各学什么 ------------------------------------------------------
{
  const s = light();
  head(s, "学到什么", "冷静不是忍住，共情不是附和");
  const col = (x, c, t, items) => {
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.5, w: 4.4, h: 3.55, fill: { color: C.card }, line: { color: C.line, width: 1 } });
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.5, w: 4.4, h: 0.08, fill: { color: c }, line: { color: c, width: 0 } });
    s.addText(t, { x: x + 0.25, y: 1.7, w: 4, h: 0.4, fontFace: FONT, fontSize: 16, bold: true, color: c, margin: 0 });
    s.addText(items.map((it, i) => ({ text: it, options: { bullet: true, breakLine: i < items.length - 1 } })),
      { x: x + 0.25, y: 2.2, w: 3.95, h: 2.75, fontFace: FONT, fontSize: 12.5, color: C.ink, margin: 0, valign: "top", paraSpaceAfter: 8 });
  };
  col(0.5, C.T, "偏理性的人 → 学会读懂人心", ["看见信号：低头、攥紧的手、躲开的视线", "先接住情绪，再说事", "知道自己那句话会被听成什么", "情绪也是事实，也是要处理的问题"]);
  col(5.1, C.F, "偏感性的人 → 学会稳住情绪", ["先听全原话，情绪最高时不做决定", "分开事实、评判、读心术、灾难化", "先问清楚，再下判断", "按「卡住了谁」排先后，对事不对人", "发一条事实 + 安排 + 请求的消息"]);
}

// 8 三个故事 ------------------------------------------------------------
{
  const s = light();
  head(s, "内容", "三个故事，都是理性与感性互相学（按推荐顺序）");
  const st = [
    ["校园《汇演前三天》", "推荐首玩 · 30 分钟", "元旦汇演前三天，领舞突然说不跳了。", "陈屿（偏理性）：先看见人，再排人", "苏小满（偏感性）：情绪是警报不是导航", C.violet],
    ["家庭《那一周》", "60 分钟", "妈妈摔倒骨折，一对性格相反的姐弟在医院的七天。", "弟弟林朗（偏理性）：先接情绪，再说事", "姐姐林晚（偏感性）：把害怕变成问题", C.T],
    ["职场《第一次带项目》", "30 分钟", "上线前一周客户改需求，总监当众问：「这个排期是谁拍的脑袋？」", "赵总监（偏理性）：知道自己那句话被听成了什么", "许诺（偏感性）：把批评当信息，交出能执行的方案", C.F],
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

// 9 产品画面 -------------------------------------------------------------
{
  const s = light();
  head(s, "产品", "浏览器即玩：漫画幻灯片式的视觉小说");
  shot(s, "home.png", 0.5, 1.45, 4.5, { cap: "首页：两个成长方向、三个故事、日常练习" });
  shot(s, "c-decode.png", 5.2, 1.45, 4.3, { cap: "镜面解码：「对方听到的」浮在画面上" });
  s.addText("21 个按年龄与人设设计的角色 × 9 种表情 · 21 张场景 · 程序化音乐音效 · 全局进度条与目录，课堂可直接跳到某一刻", { x: 0.5, y: 4.55, w: 9, h: 0.5, fontFace: FONT, fontSize: 12, color: C.ink, margin: 0 });
}

// 10 AI ---------------------------------------------------------------
{
  const s = darkS();
  head(s, "AI 的角色", "从「选择题」到「自己说出口」", true);
  s.addText("真实生活里没有选项。AI 让玩家用自己的话回应，并立刻看到对方会听到什么。", { x: 0.5, y: 1.4, w: 9, h: 0.4, fontFace: FONT, fontSize: 13, color: "E6E3F3", margin: 0 });
  const card = (x, c, t, where, what) => {
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.95, w: 4.4, h: 1.9, fill: { color: "2C2A4A" }, line: { color: c, width: 1.5 } });
    s.addText(t, { x: x + 0.2, y: 2.05, w: 4, h: 0.4, fontFace: FONT, fontSize: 15, bold: true, color: c, margin: 0 });
    s.addText([{ text: "接在哪：", options: { bold: true, color: "B9B4D6" } }, { text: where, options: { breakLine: true } }, { text: "AI 做什么：", options: { bold: true, color: "B9B4D6" } }, { text: what }],
      { x: x + 0.2, y: 2.5, w: 4, h: 1.3, fontFace: FONT, fontSize: 11.5, color: "FFFFFF", margin: 0, valign: "top", paraSpaceAfter: 6 });
  };
  card(0.5, C.gold, "① 自由表达（先做）", "拼句节点，如小满给 48 人班群发的澄清消息", "按评分维度（事实 / 安排 / 请求）打分，以角色口吻回应，给一句点评；分数接入原剧情分支");
  card(5.1, C.F, "② 动态镜面", "关键回应，如陈屿面对快哭的小满说的第一句话", "对玩家自己写的话，生成「对方听到的」「对方心里」和情绪变化");
  s.addText([
    { text: "之后：", options: { bold: true, color: C.T } },
    { text: "③ 与带隐藏情绪的 AI 角色自由对话一整个场景　④ 描述你生活里的一件事，AI 生成对应练习" },
  ], { x: 0.5, y: 4.05, w: 9, h: 0.4, fontFace: FONT, fontSize: 12, color: "E6E3F3", margin: 0 });
  s.addText("边界：不做心理咨询和诊断；高风险内容固定话术引导求助；青少年内容安全过滤；接口不可用时自动退回选项模式。", { x: 0.5, y: 4.6, w: 9, h: 0.4, fontFace: FONT, fontSize: 10.5, color: "B9B4D6", margin: 0 });
}

// 11 落地 + 现状 ---------------------------------------------------------
{
  const s = light();
  head(s, "落地与现状", "可玩 Demo 已上线，下一步是验证效果");
  const stats = [["3", "个完整故事"], ["6", "个练习关"], ["21", "个角色"], ["0", "安装，浏览器即玩"]];
  stats.forEach(([n, l], i) => {
    const x = 0.5 + i * 2.3;
    s.addText(n, { x, y: 1.4, w: 2.1, h: 0.8, fontFace: FONT, fontSize: 40, bold: true, color: [C.violet, C.T, C.F, C.ink][i], margin: 0 });
    s.addText(l, { x, y: 2.2, w: 2.1, h: 0.3, fontFace: FONT, fontSize: 11.5, color: C.muted, margin: 0 });
  });
  const block = (x, t, items) => {
    s.addText(t, { x, y: 2.75, w: 2.85, h: 0.35, fontFace: FONT, fontSize: 14, bold: true, color: C.ink, margin: 0 });
    s.addText(items.map((it, i) => ({ text: it, options: { bullet: true, breakLine: i < items.length - 1 } })), { x, y: 3.15, w: 2.85, h: 2.0, fontFace: FONT, fontSize: 11, color: C.ink, margin: 0, valign: "top", paraSpaceAfter: 6 });
  };
  block(0.5, "怎么用", ["个人：8 题测验推荐起点，一章约 15 分钟", "班会：45 分钟一章 + 讨论，交换「你听到的那一句」", "学生干部 / 职场新人培训"]);
  block(3.55, "在验证", ["镜面那一刻，有没有那一声「啊」", "「先停一下」会不会被觉得是说教", "一周后，有没有用上「本周小任务」"]);
  block(6.6, "下一步", ["AI 自由表达与动态镜面", "学校与新人培训小范围试玩", "更多方向：计划与弹性、表达与倾听"]);
}

// 12 结尾 ---------------------------------------------------------------
{
  const s = darkS();
  duo(s, 0.7, 1.6, 1.2, 0.1);
  s.addText("你学会了另一面。\n不是变成对方——是你们之间，多了一种语言。", { x: 0.7, y: 1.85, w: 8.6, h: 1.4, fontFace: FONT, fontSize: 24, bold: true, color: "FFFFFF", margin: 0, valign: "top" });
  s.addText("——校园篇结局「追光」", { x: 0.7, y: 3.25, w: 8, h: 0.35, fontFace: FONT, fontSize: 12, color: C.gold, margin: 0 });
  s.addText("Overself · AI for 人格成长", { x: 0.7, y: 4.3, w: 8, h: 0.35, fontFace: FONT, fontSize: 14, bold: true, color: "FFFFFF", margin: 0 });
  s.addText("在线试玩：yuyuyuzero.github.io/overself-ai-edu-game", { x: 0.7, y: 4.68, w: 8, h: 0.3, fontFace: FONT, fontSize: 11, color: "C9C4E6", margin: 0 });
}

pres.writeFile({ fileName: path.join(__dirname, "Overself-路演.pptx") }).then(f => console.log("写入", f));
