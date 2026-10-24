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
  shot(s, "c-filter.png", 0.5, 1.55, 5.2, { cap: "游戏截图：领舞说「不跳了」——情绪最高时，前半句（原因）被情绪滤镜模糊掉了" });
  const rows = [
    [C.T, "偏理性的人", "知道\"要共情\"。可同学说\"我不跳了\"，脱口而出的是：「那就换人吧。」"],
    [C.F, "偏感性的人", "知道\"要冷静\"。可只听见\"不跳了\"四个字，掏出手机就要往 48 人的班群发长文。"],
  ];
  rows.forEach(([c, t, d], i) => {
    const y = 1.55 + i * 1.32;
    s.addShape(pres.shapes.RECTANGLE, { x: 6.0, y, w: 3.5, h: 1.15, fill: { color: C.card }, line: { color: C.line, width: 1 } });
    s.addShape(pres.shapes.RECTANGLE, { x: 6.0, y, w: 0.08, h: 1.15, fill: { color: c }, line: { color: c, width: 0 } });
    s.addText(t, { x: 6.22, y: y + 0.1, w: 3.2, h: 0.3, fontFace: FONT, fontSize: 13, bold: true, color: c, margin: 0 });
    s.addText(d, { x: 6.22, y: y + 0.42, w: 3.2, h: 0.68, fontFace: FONT, fontSize: 11, color: C.ink, margin: 0, valign: "top" });
  });
  s.addText("卡住人的从来不是知识，而是「那一刻的视角」。", { x: 6.0, y: 4.25, w: 3.5, h: 0.6, fontFace: FONT, fontSize: 14, bold: true, color: C.violet, margin: 0 });
}

// 3 一句话方案 + 核心循环 ------------------------------------------------
{
  const s = darkS();
  head(s, "我们的解法", "同一句话，你先当说的人，再当听的人", true);
  const steps = [
    ["① 经历", "用你习惯的方式做选择", "c-impulse.png", C.F],
    ["② 镜面", "切进对方身体，听见「对方听到的」", "c-decode.png", C.violet],
    ["③ 倒带", "回到那一刻，换一种做法", "c-replay.png", C.T],
    ["④ 复盘", "第一次 vs 倒带后，收技能卡", "c-review.png", C.gold],
  ];
  steps.forEach(([t, d, img, c], i) => {
    const x = 0.5 + i * 2.3, w = 2.1;
    shot(s, img, x, 1.6, w, { border: c, bw: 2 });
    s.addText(t, { x, y: 2.9, w, h: 0.4, fontFace: FONT, fontSize: 16, bold: true, color: c, margin: 0 });
    s.addText(d, { x, y: 3.3, w, h: 0.6, fontFace: FONT, fontSize: 11, color: "E6E3F3", margin: 0, valign: "top" });
    if (i < 3) s.addText("›", { x: x + w, y: 2.0, w: 0.2, h: 0.4, fontFace: FONT, fontSize: 22, color: "8C88A8", align: "center", margin: 0 });
  });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 4.25, w: 9, h: 0.75, fill: { color: "2C2A4A" }, line: { color: "2C2A4A", width: 0 } });
  s.addText([
    { text: "倒带不扣分。", options: { bold: true, color: C.gold } },
    { text: "第一次的自然反应只用来复盘\"你的习惯\"；倒带后的那个选择，是你多出来的一种。不是把一种人变成另一种人，而是多一种选择。" },
  ], { x: 0.7, y: 4.25, w: 8.6, h: 0.75, fontFace: FONT, fontSize: 12, color: "FFFFFF", valign: "middle", margin: 0 });
}

// 4 章节页：一段真实体验 -------------------------------------------------
{
  const s = pres.addSlide(); N++;
  s.background = { color: "000000" };
  duo(s, 0.7, 1.9, 1.2, 0.1);
  s.addText("一段真实体验", { x: 0.7, y: 2.1, w: 8, h: 0.7, fontFace: FONT, fontSize: 34, bold: true, color: "FFFFFF", margin: 0 });
  s.addText("校园篇《汇演前三天》第一章 · 约 15 分钟（推荐首玩）", { x: 0.7, y: 2.85, w: 8, h: 0.4, fontFace: FONT, fontSize: 15, color: C.gold, margin: 0 });
  s.addText("元旦汇演前三天，领舞林可突然说不跳了。文艺委员苏小满（偏感性），班长陈屿（偏理性）。\n以下画面全部是游戏实机截图。", { x: 0.7, y: 3.4, w: 8.5, h: 0.8, fontFace: FONT, fontSize: 13, color: "C9C4E6", margin: 0, valign: "top" });
  page(s, N, true);
}

// 5 情绪滤镜 ----------------------------------------------------------------
{
  const s = light();
  head(s, "时刻 1 · 情绪滤镜", "情绪最高的时候，你听不见事实");
  shot(s, "c-filter.png", 0.5, 1.5, 5.6);
  s.addShape(pres.shapes.RECTANGLE, { x: 6.4, y: 1.5, w: 3.1, h: 1.25, fill: { color: C.card }, line: { color: C.line, width: 1 } });
  s.addText([
    { text: "林可的原话", options: { bold: true, color: C.muted, fontSize: 10, breakLine: true } },
    { text: "小满……我每天六点前得去接我弟，排练老拖到七点……汇演我" },
    { text: "不跳了", options: { bold: true, color: "D9381E" } },
    { text: "。你们" },
    { text: "找别人吧", options: { bold: true, color: "D9381E" } },
    { text: "。" },
  ], { x: 6.55, y: 1.58, w: 2.85, h: 1.1, fontFace: FONT, fontSize: 11, color: C.ink, margin: 0, valign: "top" });
  bullets(s, [
    "情绪温度 ≥ 60 时，句子里的事实（原因）变模糊，只剩情绪词放大变红",
    "黑屏白字：「她走了。还剩三天。」",
    [{ text: "设计意图：", options: { bold: true, color: C.violet } }, "让偏感性的玩家亲身体验\"我只听见了一半\"，而不是被告知"],
  ], 6.4, 2.95, 3.1, 2.2, { size: 12 });
}

// 6 冲动与后果 ----------------------------------------------------------
{
  const s = light();
  head(s, "时刻 2 · 冲动与后果", "6 秒倒计时。「先停一下」就混在选项里，并不显眼");
  shot(s, "c-impulse.png", 0.5, 1.5, 4.4, { cap: "限时冲动选项：班群长文 / 去办公室撂挑子 / 私聊骂人 / 先停一下" });
  shot(s, "c-consequence.png", 5.1, 1.5, 4.4, { cap: "选了冲动选项，你会看到「后来……」，然后被倒回那一刻" });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 4.35, w: 9, h: 0.75, fill: { color: "FFF1EC" }, line: { color: C.F, width: 1 } });
  s.addText([
    { text: "后来……", options: { bold: true, color: C.F } },
    { text: "消息发出去一分钟，十七个人看了。八点零三分，群里弹出一行灰字：「林可 退出了群聊」。九点，周老师私聊你：「明天上午来办公室一趟。」" },
  ], { x: 0.7, y: 4.35, w: 8.6, h: 0.75, fontFace: FONT, fontSize: 11.5, color: C.ink, valign: "middle", margin: 0 });
}

// 7 暂停 · 回听 · 分类 -------------------------------------------------
{
  const s = light();
  head(s, "时刻 3 · 暂停、回听、分类", "停下来，再听一遍——「她第一句就说了原因」");
  shot(s, "c-breathe.png", 0.5, 1.5, 2.9, { cap: "暂停：世界沉入水下，跟着呼吸两轮" });
  shot(s, "c-replay.png", 0.5, 3.3, 2.9, { cap: "回听：前半句清清楚楚地回来了" });
  shot(s, "c-sort.png", 3.65, 1.5, 3.4, { cap: "分类：事实 / 评判 / 读心术 / 灾难化" });
  bullets(s, [
    [{ text: "事实只有四条", options: { bold: true } }, "，其中两条（接弟弟的时间、那条视频）是可以被解决的问题"],
    [{ text: "「她太自私了」", options: { bold: true, color: C.F } }, "是评判；「全班都会觉得我不行」是灾难化"],
    [{ text: "剧本只能被相信，问题才能被解决。", options: { bold: true, color: C.violet } }],
  ], 7.3, 1.5, 2.2, 3.5, { size: 12, gap: 12 });
}

// 8 提问 ---------------------------------------------------------------
{
  const s = light();
  head(s, "时刻 4 · 提问", "车还有三分钟到，你只能问两个问题");
  shot(s, "c-qa.png", 0.5, 1.5, 5.2);
  const qa = [
    ["你说要接弟弟，是从什么时候开始的？", "上周。我奶奶住院了……我弟五点五十放学，没人接。", C.T],
    ["是因为大刘那个视频吗？", "……转了四百多次。我一想到要在台上转那个身，就喘不上气。", C.T],
    ["你为什么不早说？", "……说了有用吗。", C.F],
  ];
  qa.forEach(([q, a, c], i) => {
    const y = 1.5 + i * 1.0;
    s.addShape(pres.shapes.RECTANGLE, { x: 6.0, y, w: 3.5, h: 0.88, fill: { color: C.card }, line: { color: C.line, width: 1 } });
    s.addShape(pres.shapes.RECTANGLE, { x: 6.0, y, w: 0.07, h: 0.88, fill: { color: c }, line: { color: c, width: 0 } });
    s.addText([{ text: "问：" + q, options: { bold: true, breakLine: true } }, { text: "答：" + a, options: { color: C.muted } }],
      { x: 6.17, y: y + 0.05, w: 3.28, h: 0.8, fontFace: FONT, fontSize: 10.5, color: C.ink, margin: 0, valign: "middle" });
  });
  s.addText("问对了，原因就浮出来；问成指责，她只想快点走。问到的事实会解锁后面的选项。", { x: 6.0, y: 4.55, w: 3.5, h: 0.6, fontFace: FONT, fontSize: 11, color: C.violet, bold: true, margin: 0 });
}

// 9 镜面 ---------------------------------------------------------------
{
  const s = light();
  head(s, "时刻 5 · 镜面", "现在你是陈屿。你说的每一句，小满都会「听到」");
  shot(s, "c-decode.png", 0.5, 1.5, 4.9, { cap: "镜面解码：陈屿说「换人吧」，小满听到「你那三个星期也不重要」" });
  const rows = [
    [{ text: "陈屿说的", options: { bold: true, color: "FFFFFF", fill: { color: C.T } } }, { text: "小满听到的", options: { bold: true, color: "FFFFFF", fill: { color: C.F } } }],
    ["换人吧，赵婷是替补，三天够了。", "林可不重要。你那三个星期也不重要。"],
    ["她早退本来就影响排练，走了反而省事。", "是你选错了人。"],
    ["先别急着定，会不会是排练时间的问题？", "这件事可能有解。"],
    ["你先坐会儿。三个星期白练谁都难受。", "我看见你了，你不是一个人。"],
  ];
  s.addTable(rows, { x: 5.65, y: 1.5, w: 3.85, colW: [1.95, 1.9], fontFace: FONT, fontSize: 10, color: C.ink, border: { pt: 0.75, color: C.line }, fill: { color: C.card }, rowH: 0.52, valign: "middle" });
  s.addText("同一个意思，换一种说法，对方听到的是完全不同的东西。", { x: 5.65, y: 4.35, w: 3.85, h: 0.6, fontFace: FONT, fontSize: 12, bold: true, color: C.violet, margin: 0 });
}

// 10 「啊」的那一声 --------------------------------------------------------
{
  const s = darkS();
  duo(s, 0.7, 1.2, 1.2, 0.1);
  s.addText("镜面结束时的旁白", { x: 0.7, y: 1.4, w: 8, h: 0.4, fontFace: FONT, fontSize: 13, color: "B9B4D6", margin: 0 });
  s.addText([
    { text: "你在核对节目单的时候，她在心里已经把节目撤了三次。", options: { breakLine: true } },
    { text: "她其实想说的是——「我好慌。三个星期的心血要没了，我需要有人跟我站在一起。」", options: { breakLine: true } },
    { text: "你给了她一个方案。她那时候要的，是一个同伴。", options: { bold: true, color: C.gold } },
  ], { x: 0.7, y: 1.95, w: 8.6, h: 2.2, fontFace: FONT, fontSize: 20, color: "FFFFFF", margin: 0, valign: "top", paraSpaceAfter: 14 });
  s.addText("这就是这个游戏最想制造的那一声「啊」。", { x: 0.7, y: 4.5, w: 8, h: 0.4, fontFace: FONT, fontSize: 14, color: "C9C4E6", margin: 0 });
}

// 11 第二章：解题 --------------------------------------------------------
{
  const s = light();
  head(s, "时刻 6 · 偏感性的人学冷静解题", "冷静不是忍住，是把问题解决掉");
  shot(s, "c-rank.png", 0.5, 1.5, 4.4, { cap: "排序：按「卡住了谁」排，不按「哪件最难受」排" });
  shot(s, "c-compose.png", 5.1, 1.5, 4.4, { cap: "拼句：在班群发一条只有事实、安排和请求的消息" });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 4.35, w: 9, h: 0.75, fill: { color: C.card }, line: { color: C.line, width: 1 } });
  s.addText([
    { text: "一整套解题动作：", options: { bold: true, color: C.F } },
    { text: "先听全原话 → 情绪最高时不做决定 → 分开事实和猜测 → 问清楚 → 排出先后 → 对事不对人 → 发一条结构化的消息" },
  ], { x: 0.7, y: 4.35, w: 8.6, h: 0.75, fontFace: FONT, fontSize: 12, color: C.ink, valign: "middle", margin: 0 });
}

// 12 偏理性的人也在学 ----------------------------------------------------------
{
  const s = light();
  head(s, "时刻 7 · 偏理性的人学先看见人", "捕捉到的信号，会解锁原本没有的选项");
  shot(s, "c-signal.png", 0.5, 1.5, 4.4, { cap: "信号一闪就消失：林可低头看手机、攥紧的手" });
  shot(s, "c-signal-unlocked.png", 5.1, 1.5, 4.4, { cap: "看见了，才有「🔍 你先坐会儿……我们一起想办法」" });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 4.35, w: 9, h: 0.75, fill: { color: "EEF4FD" }, line: { color: C.T, width: 1 } });
  s.addText([
    { text: "设计意图：", options: { bold: true, color: C.T } },
    { text: "觉察要主动。没看见的人，连共情的选项都没有——这正是偏理性的人在现实里的处境。" },
  ], { x: 0.7, y: 4.35, w: 8.6, h: 0.75, fontFace: FONT, fontSize: 12, color: C.ink, valign: "middle", margin: 0 });
}

// 13 三个故事 ------------------------------------------------------------
{
  const s = light();
  head(s, "内容", "三个故事，都是理性与感性互相学（按推荐顺序）");
  const st = [
    ["c-stage.png", "校园《汇演前三天》", "推荐首玩 · 30 分钟", "陈屿（偏理性）：先看见人，再排人", "苏小满（偏感性）：情绪是警报不是导航；先排序、问清楚", "陈屿的方案给了节目退路，小满问出的原因给了林可回来的理由"],
    ["w-decode2.png", "家庭《那一周》", "60 分钟", "弟弟林朗（偏理性）：先接情绪，再说事", "姐姐林晚（偏感性）：把害怕变成问题", "一起替妈妈做手术决定，听见\"选便宜的\"背后的\"我怕躺着\""],
    ["k-filter.png", "职场《第一次带项目》", "30 分钟", "赵总监（偏理性）：知道自己那句话被听成了什么", "许诺（偏感性）：把批评当信息，交出能执行的方案", "总监的直接 + 许诺问出客户真正要的东西"],
  ];
  st.forEach(([img, t, sub, a, b, both], i) => {
    const x = 0.5 + i * 3.05, w = 2.85;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.45, w, h: 3.75, fill: { color: C.card }, line: { color: C.line, width: 1 }, shadow: shadow() });
    s.addImage({ path: A(img), x, y: 1.45, w, h: w * 9 / 16 });
    s.addText(t, { x: x + 0.15, y: 3.12, w: w - 0.3, h: 0.32, fontFace: FONT, fontSize: 13, bold: true, color: C.ink, margin: 0 });
    s.addText(sub, { x: x + 0.15, y: 3.43, w: w - 0.3, h: 0.22, fontFace: FONT, fontSize: 9.5, color: C.muted, margin: 0 });
    s.addText([
      { text: a, options: { color: C.T, breakLine: true } },
      { text: b, options: { color: "D2603F", breakLine: true } },
      { text: "合力：" + both, options: { color: C.ink } },
    ], { x: x + 0.15, y: 3.7, w: w - 0.3, h: 1.45, fontFace: FONT, fontSize: 9.5, margin: 0, valign: "top", paraSpaceAfter: 4 });
  });
}

// 14 机制 ---------------------------------------------------------------
{
  const s = light();
  head(s, "机制", "每个机制本身就是一个隐喻");
  const m = [
    ["信号捕捉", "觉察要主动", "c-signal.png"],
    ["情绪滤镜 + 回听", "感受不等于事实", "w-filter.png"],
    ["冲动 + 暂停", "刺激和反应之间有空隙", "c-impulse.png"],
    ["镜面解码", "你给的，她听到的", "k-decode.png"],
    ["身体信号", "先命名，才能处理", "w-body.png"],
    ["分类 · 提问 · 排序 · 拼句", "冷静是为了解决问题", "k-rank.png"],
  ];
  m.forEach(([t, d, img], i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = 0.5 + col * 3.05, y = 1.45 + row * 1.9, w = 1.55;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: 2.85, h: 1.7, fill: { color: C.card }, line: { color: C.line, width: 1 } });
    s.addImage({ path: A(img), x: x + 0.1, y: y + 0.12, w, h: w * 9 / 16 });
    s.addText(t, { x: x + 1.75, y: y + 0.12, w: 1.05, h: 0.9, fontFace: FONT, fontSize: 11.5, bold: true, color: C.ink, margin: 0, valign: "top" });
    s.addText(d, { x: x + 0.12, y: y + 1.07, w: 2.65, h: 0.5, fontFace: FONT, fontSize: 11, color: C.violet, margin: 0, valign: "middle" });
  });
}

// 15 画面与人物 -----------------------------------------------------------
{
  const s = light();
  head(s, "视听", "漫画幻灯片式的视觉小说：按年龄与人设设计的人物");
  s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 1.45, w: 5.6, h: 5.6 * 708 / 1472, fill: { color: "CFDCDD" }, line: { color: "FFFFFF", width: 2 }, shadow: shadow() });
  s.addImage({ path: A("chars-main.png"), x: 0.5, y: 1.45, w: 5.6, h: 5.6 * 708 / 1472 });
  s.addText("16 岁高中生、二三十岁职场人、四十多岁的班主任和总监、六十岁的父母：头身比、眼睛、脸型、发型、服装都不同。21 个角色 × 9 种表情。", { x: 0.5, y: 4.25, w: 5.6, h: 0.8, fontFace: FONT, fontSize: 11, color: C.muted, margin: 0, valign: "top" });
  shot(s, "w-car.png", 6.55, 1.45, 2.95);
  shot(s, "c-black.png", 6.55, 3.28, 2.95, { cap: "上：场景 + 立绘 + 对话框　下：关键转折切黑屏白字" });
}

// 16 AI 路线图 -----------------------------------------------------------
{
  const s = darkS();
  head(s, "AI 的角色", "从「选择题」到「真实表达」", true);
  const p = [
    ["现在 · P0", "剧情、镜面解码、复盘全部人工精写，离线可玩、对学生安全", "8C88A8"],
    ["P1 自由表达", "玩家自己写一句回应，AI 按评分表打分，并以角色口吻回你——能自己说出来才算学会", C.gold],
    ["P2 动态镜面", "对玩家自己写的那句话，生成「对方听到的」", C.F],
    ["P3 自由对话关", "和带隐藏情绪状态的 AI 角色自由对话一整个场景，结束后复盘", C.T],
    ["P4 你自己的场景", "描述生活里的一件事，AI 生成一个对应的练习", C.violet],
  ];
  p.forEach(([t, d, c], i) => {
    const y = 1.5 + i * 0.66;
    s.addShape(pres.shapes.OVAL, { x: 0.55, y: y + 0.1, w: 0.26, h: 0.26, fill: { color: c }, line: { color: c, width: 0 } });
    if (i < p.length - 1) s.addShape(pres.shapes.LINE, { x: 0.68, y: y + 0.36, w: 0, h: 0.4, line: { color: "4A4770", width: 1.5 } });
    s.addText(t, { x: 1.0, y, w: 2.0, h: 0.46, fontFace: FONT, fontSize: 13, bold: true, color: c, margin: 0, valign: "middle" });
    s.addText(d, { x: 3.0, y, w: 6.5, h: 0.46, fontFace: FONT, fontSize: 11.5, color: "E6E3F3", margin: 0, valign: "middle" });
  });
  s.addText("边界：不做心理咨询、不做诊断；高风险内容固定话术引导求助；青少年内容安全过滤。", { x: 0.55, y: 4.85, w: 9, h: 0.35, fontFace: FONT, fontSize: 10.5, color: "B9B4D6", margin: 0 });
}

// 17 适合谁 -------------------------------------------------------------
{
  const s = light();
  head(s, "落地", "适合谁、怎么用");
  const u = [
    ["个人", "8 题倾向测验 → 推荐从哪个角色开始；一章约 15 分钟", C.violet],
    ["课堂 / 班会", "45 分钟一章 + 讨论；按测验分组选视角，玩完交换\"你听到的那一句\"", C.T],
    ["学生干部 / 职场新人", "校园篇、职场篇各对应真实岗位：文艺委员、班长、项目负责人与主管", C.F],
    ["日常练习", "6 关 × 3 分钟：给偏理性的人「读懂人心」，给偏感性的人「冷静解题」", C.gold],
  ];
  u.forEach(([t, d, c], i) => {
    const y = 1.5 + i * 0.9;
    s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y, w: 4.7, h: 0.75, fill: { color: C.card }, line: { color: C.line, width: 1 } });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y, w: 0.08, h: 0.75, fill: { color: c }, line: { color: c, width: 0 } });
    s.addText([{ text: t, options: { bold: true, breakLine: true, fontSize: 12.5 } }, { text: d, options: { color: C.muted } }],
      { x: 0.72, y, w: 4.4, h: 0.75, fontFace: FONT, fontSize: 10.5, color: C.ink, margin: 0, valign: "middle" });
  });
  shot(s, "toc.png", 5.5, 1.5, 4.0, { cap: "全局进度条 + 目录：可直接跳到任意章的经历 / 镜面 / 倒带，方便课堂重看某一刻" });
}

// 18 现状与下一步 ----------------------------------------------------------
{
  const s = light();
  head(s, "现状", "可玩 Demo 已上线，下一步是验证效果");
  const stats = [["3", "个完整故事"], ["6", "个练习关"], ["21", "个角色 × 9 表情"], ["0", "安装，浏览器即玩"]];
  stats.forEach(([n, l], i) => {
    const x = 0.5 + i * 2.3;
    s.addText(n, { x, y: 1.45, w: 2.1, h: 0.85, fontFace: FONT, fontSize: 44, bold: true, color: [C.violet, C.T, C.F, C.ink][i], margin: 0 });
    s.addText(l, { x, y: 2.3, w: 2.1, h: 0.3, fontFace: FONT, fontSize: 11.5, color: C.muted, margin: 0 });
  });
  s.addText("我们在验证", { x: 0.5, y: 2.95, w: 4.3, h: 0.35, fontFace: FONT, fontSize: 14, bold: true, color: C.ink, margin: 0 });
  bullets(s, [
    "镜面那一刻，玩家有没有\"啊\"的一声？（开放问卷）",
    "偏感性的玩家会不会觉得\"先停一下\"是说教？（看暂停后的解题环节能否接住）",
    "一周后，玩家在现实里用上\"本周小任务\"了吗？",
  ], 0.5, 3.35, 4.3, 1.8, { size: 11.5 });
  s.addText("下一步", { x: 5.2, y: 2.95, w: 4.3, h: 0.35, fontFace: FONT, fontSize: 14, bold: true, color: C.ink, margin: 0 });
  bullets(s, [
    "AI 自由表达（P1）：从选择题到自己说出口",
    "小范围试玩：学校班会 + 职场新人培训",
    "正式插画与配乐（接口已留，可逐张替换）",
    "扩展维度：P↔J、I↔E",
  ], 5.2, 3.35, 4.3, 1.8, { size: 11.5 });
}

// 19 结尾 ---------------------------------------------------------------
{
  const s = pres.addSlide(); N++;
  s.background = { path: A("c-ending.png") };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 5.625, fill: { color: C.night, transparency: 5 }, line: { color: C.night, width: 0 } });
  duo(s, 0.7, 1.6, 1.2, 0.1);
  s.addText("你学会了另一面。\n不是变成对方——是你们之间，多了一种语言。", { x: 0.7, y: 1.85, w: 8.6, h: 1.4, fontFace: FONT, fontSize: 24, bold: true, color: "FFFFFF", margin: 0, valign: "top" });
  s.addText("——校园篇结局「追光」", { x: 0.7, y: 3.25, w: 8, h: 0.35, fontFace: FONT, fontSize: 12, color: C.gold, margin: 0 });
  s.addText("Overself · AI for 人格成长", { x: 0.7, y: 4.3, w: 8, h: 0.35, fontFace: FONT, fontSize: 14, bold: true, color: "FFFFFF", margin: 0 });
  s.addText("在线试玩：yuyuyuzero.github.io/overself-ai-edu-game", { x: 0.7, y: 4.68, w: 8, h: 0.3, fontFace: FONT, fontSize: 11, color: "C9C4E6", margin: 0 });
}

pres.writeFile({ fileName: path.join(__dirname, "Overself-路演.pptx") }).then(f => console.log("写入", f));
