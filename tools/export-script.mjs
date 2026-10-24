// 把 demo/ 里的剧情数据导出成「剧本与选项全表」：每个节点、每个选项、对应结果与数值，按推荐游玩顺序排列。
// 用法：node tools/export-script.mjs  → 写入 docs/08-剧本与选项全表.md
// 台词与数值全部来自数据文件（和游戏里一字不差）；设计思路来自下方 DESIGN（摘自 docs/00、01、02、05、06）。
import vm from "node:vm";
import fs from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ctx = { window: {}, console };
ctx.window.window = ctx.window;
vm.createContext(ctx);
for (const f of ["scenarios.js", "story-data.js", "story-campus.js", "story-work.js"])
  vm.runInContext(fs.readFileSync(`${root}/demo/${f}`, "utf8"), ctx, { filename: f });
const W = ctx.window;

// ---------- 设计思路（人工撰写，和数据一起维护） ----------
const DESIGN = {
  campus: {
    why: [
      "F 型的学生最常卡住的，不是\"被压力裹挟\"，而是**一件需要自己去解决的事突然砸过来**：节目要黄了、被老师点名、群里一片猜测。这一刻情绪抢在思考前面做了决定。",
      "所以本篇的主线是**把问题解决掉**，不是\"扛住\"。小满（F）学的每一个动作都对应一个机制：先停→回听原话→分开事实和剧本→问清楚→排出先后→对事不对人→发一条结构化消息。",
      "陈屿（T）是镜子：**他是全班最会解决问题的人，可他的方案差点把林可彻底推走**。他要学的是\"动手之前先看人\"。两个人合在一起，节目才活下来。",
      "选它做第一个故事：节奏最紧（三天）、冲突最贴近学生和职场新人、两侧的学习目标都清楚，适合作为第一印象。",
    ],
    ch: {
      ch1: "**关键时刻：林可那句\"我每天六点前得去接我弟……汇演我不跳了\"。** 同一句话，小满在情绪滤镜里只听见\"不跳了、找别人吧\"，陈屿听得清清楚楚却只当成\"排练时间冲突\"。一个没听见原因，一个没看见人——这是 F 与 T 各自的盲点在同一秒暴露。冲动选项（班群长文 / 撤节目 / 私聊骂人）的后果都写得很具体，让玩家亲眼看到\"情绪顶点做的决定\"会怎样扩散；暂停之后的回听让玩家自己发现\"她第一句就说了原因\"。",
      ch2: "**关键时刻：周老师一句话里的\"可以撤 / 教室申请了 / 你得出来说句话\"。** F 侧在滤镜里只听见\"你这个文艺委员不行\"，接着用**排序**学\"按卡住了谁排，不按哪件最难受排\"，用**对事不对人**处理大刘，用**拼句**在班群发一条只有事实、安排和请求的消息。T 侧学\"情绪也是事实\"：四十个人的猜测也是要处理的问题，自己耳朵发烫也是信号。林可回不回来，取决于两侧有没有合力（问出原因 + 安全的位置 + 群里的澄清）。",
      ep: "尾声不再有镜面，是两条线的回收：林可站在台上转那个身。结局按关系值和\"林可回来了\"判定，最差结局可以倒带回第二章。",
    },
  },
  week: {
    why: [
      "**普适**：几乎每个人都经历过或将经历家人生病，代入门槛最低。",
      "**高压**：危机时刻性格差异会被放大到极致——T 更 T，F 更 F，冲突真实且必然。",
      "**双方都对**：弟弟的冷静确实在救场（查资料、比较方案、排班），姐姐的敏感确实在救场（读出妈妈没说出口的恐惧）。没有谁是\"错的那一方\"。",
      "**有真实决策**：手术方案是一个真实的两难，有数据、有风险、有感受，天然需要两面结合。爸爸是反例：很多人以为\"不表达情绪 = 理性\"，他其实是回避——**理性是面对问题，回避是离开问题**。",
    ],
    ch: {
      p: "序章是机制教学：家庭群里妈妈那条\"我没事，就摔了一下\"。弟弟入门信号捕捉，姐姐入门情绪温度。",
      ch1: "**关键时刻：电话里\"姐你别哭了，先说正事\"。** 弟弟学：冷静会被听成冷漠，先接住情绪再说事；姐姐学：情绪滤镜让你没听见\"明天下午手术、医生说不危险\"，先停再动（深夜打车三个多小时的冲动）。",
      ch2: "**关键时刻：医生办公室，爸爸说\"你们定\"，妈妈说\"选便宜的就行\"。** 弟弟学：妈妈的\"便宜\"不是钱的问题——情绪是决策数据；姐姐学：在医生面前把问题问清楚，用事实替恐惧做决定。数据表格是故意给的：只有两面合力，才能读出表格少了的那一栏。",
      ch3: "**关键时刻：凌晨病房外\"你就知道排表！\"。** 弟弟学：说出自己的累和怕，才不会被当成机器（身体信号机制在这里回收\"T 不允许自己有情绪\"）；姐姐学：责任和自责的区别，爆发之前先暂停，用拼句说出需要。",
      endNote: "`hearts(G)` = 第二章妈妈说出真心话的层数（标记 heart1~3）：heart1 她说出\"不想拖累你们\"；heart2 她说出\"我不怕疼，我怕躺着\"；heart3 在 heart2 且关系值 ≥ 20 时，她对姐弟俩说\"小晚别老怪自己，朗朗别老憋着\"。",
      ep: "尾声：出院那天，给对方发一条消息；妈妈的一段语音把整周收束为\"你们俩互相学一点，就够了\"。",
    },
  },
  work: {
    why: [
      "刻意避开\"加班好累、老板好坏\"的诉苦叙事。核心是一个**能被解决的问题**：上线前一周客户加了三个需求，周会上总监当众问\"这个排期是谁拍的脑袋？\"，许诺有两天时间交一个\"可以执行的方案\"。",
      "许诺（F）要学：批评是信息，先把信息听全；情绪顶点不做不可撤回的动作；事实拿来用、观点可以谈、猜测去求证；问出真实诉求、先解卡在别人手里的依赖；汇报 = 事实 + 选项与代价 + 建议 + 需要的支持。",
      "赵总监（T）那句话**信息全对**，但漏了一句\"我要你做什么，以及我相信你做得到\"。批评里如果只有问题，听的人会自己补上\"你不行\"。他的盲点是自己就是被这样骂出来的。",
      "**两人都对，都需要对方**：救下项目的方案，一半来自许诺听出客户没说出口的\"老板只盯着积分抵现\"（F 的强项），一半来自她把这句话变成有代价、有建议的选项表（T 的强项）。",
    ],
    ch: {
      ch1: "**关键时刻：周会上\"这个排期是谁拍的脑袋？\"。** 许诺的滤镜把\"我要的是一个可以执行的方案\"过滤掉了；冲动选项（群里揽下所有 / 说自己不适合带项目）在情绪顶点不可撤回。赵总监在镜面里第一次看到自己那句话被听成了什么。",
      ch2: "**关键时刻：周三的方案。** 许诺用提问问出人天和客户真实诉求，用排序决定先做哪件，用拼句写给总监的方案邮件；赵总监在身体信号节点面对自己\"不允许有情绪\"，学会说出\"这个项目是我提名你带的\"。",
      ep: "尾声：上线那天。结局按关系值和方案质量判定。",
      endNote: "`planScore(G)` = 第二章拼句 `2B-08`（给总监的方案邮件）的得分。",
    },
  },
};
const TYPE_NOTE = [
  ["冲动", "情绪顶点的第一反应。可以选，会看到具体后果，然后被倒回那一刻、数值复原，直到选\"⏸ 先停一下\"——让玩家亲眼看见冲动的代价，而不是被说教"],
  ["暂停", "刺激和反应之间的空隙；接呼吸、回听或分类，温度下降"],
  ["解决 / 讲理", "T 的习惯：给方案、讲道理。事实往往是对的，问题是来早了"],
  ["共情 / 表达", "先接住情绪、说出自己的感受；关系值上升"],
  ["求证 / 共情+求证", "把感受变成问题、先问清楚再判断；F→T 解题的核心动作"],
  ["回避", "离开问题（爸爸的模式），不等于理性"],
  ["🔍 信号选项", "只有捕捉到对应信号才解锁——觉察要主动"],
];

// ---------- 工具 ----------
const stubG = () => ({ f: {}, v: { rel: 0, tempA: 20, tempB: 20, aware: 10, named: 0 }, picks: {}, start: "A" });
const val = x => (typeof x === "function" ? x(stubG()) : x);
const isFn = x => typeof x === "function";
const clean = s => String(s ?? "").replace(/\[(.+?)\]/g, "$1").replace(/\*\*(.+?)\*\*/g, "$1").replace(/==(.+?)==/g, "$1");
const cell = s => clean(s).replace(/\|/g, "\\|").replace(/\n+/g, " ");
const src = f => f.toString().replace(/^\s*G\s*=>\s*/, "").replace(/\s+/g, " ").trim();
const FX = { temp: "温", aware: "觉察", rel: "关系", named: "命名", connect: "连接", calm: "平静", clarity: "清晰", trust: "信任" };
const fx = o => !o ? "" : Object.entries(o).map(([k, v]) => `${FX[k] || k}${v > 0 ? "+" : ""}${v}`).join(" ");
const flags = o => !o ? "" : Object.entries(o).map(([k, v]) => (v === 1 || v === true ? k : `${k}=${v}`)).join(" ");
const replies = r => (r || []).map(([who, t, e]) => `${who}${e ? `（${e}）` : ""}：${clean(t)}`).join(" / ");
const out = [];
const P = (...l) => out.push(...l);

// ---------- 节点渲染 ----------
function renderNodes(nodes, ctxS) {
  for (const n of nodes || []) {
    const id = n.id ? ` \`${n.id}\`` : "";
    switch (n.t) {
      case "scene": {
        const who = (n.chars || []).map(c => ctxS.nameOf[c] || c).join("、");
        P("", `**📍 ${clean(n.text || "")}**${n.bg ? `　〔背景 ${n.bg}${who ? ` · 在场：${who}` : ""}〕` : ""}${id}`, "");
        break;
      }
      case "title": P(`- ⬛ **黑屏：${clean(n.text)}**${id}`); break;
      case "tip": P(`- 💡 提示：${clean(n.text)}`); break;
      case "say": {
        const texts = val(n.text), dyn = isFn(n.text) ? "（随剧情标记变化，此为默认版本）" : "";
        const tag = n.who === "旁白" ? "*旁白*" : n.who === "内心" ? "💭 内心" : `**${n.who}**`;
        const meta = [n.chat ? "📱消息" : "", n.call ? "📞电话" : "", n.expr || ""].filter(Boolean).join("·");
        P(`- ${tag}${meta ? `（${meta}）` : ""}：${clean(texts)}${dyn}${id}`);
        if (n.filter) P(`  - 🌫 情绪滤镜：温度高时方括号里的事实变模糊，只剩情绪词放大`);
        for (const s of n.sig || []) P(`  - 🔍 信号（${s.dur}s）\`${s.id}\`：${clean(s.text)}${s.fake ? "（干扰项）" : ""}`);
        if (n.decode) P(`  - 🪞 对方听到：「${cell(val(n.decode))}」${n.decodeInner ? `　心里：${cell(val(n.decodeInner))}` : ""}${n.decodeWhen ? `（条件：\`${src(n.decodeWhen)}\`）` : ""}`);
        if (n.preFx || n.fx || n.set) P(`  - 数值：${[fx(n.preFx), fx(n.fx)].filter(Boolean).join(" ")}${n.set ? ` 标记 ${flags(val(n.set))}` : ""}`);
        break;
      }
      case "choice": case "impulse": {
        P("", `> **${n.t === "impulse" ? `⏱ 冲动（限时 ${n.secs}s）` : "🔀 选择"}${id}${n.key ? "　★计入复盘" : ""}**：${clean(n.prompt || "")}${n.chat ? "（在手机里回复）" : ""}`, "");
        P("| 选项 | 类型 | 条件 | 结果 | 数值 / 标记 |", "|---|---|---|---|---|");
        for (const o of n.opts) {
          const cond = [o.req ? `需捕捉信号 ${o.req.map(r => ctxS.sigText[r] ? `「${ctxS.sigText[r]}」` : r).join("+")}` : "", o.reqAny ? `任一信号 ${o.reqAny.join("/")}` : "", o.when ? `\`${src(o.when)}\`` : ""].filter(Boolean).join("；");
          const res = [o.cons ? `后来……${o.cons}` : "", o.reply ? replies(o.reply) : "", o.inner ? `💭 ${o.inner}` : "", o.goto ? `→ 跳到 \`${o.goto}\`` : ""].filter(Boolean).join("　");
          P(`| ${o.req || o.reqAny ? "🔍 " : ""}${cell(o.text)} | ${o.type || ""} | ${cell(cond)} | ${cell(res)} | ${[fx(o.fx), o.set ? "标记 " + flags(o.set) : ""].filter(Boolean).join(" ")} |`);
        }
        if (n.t === "impulse") P(`| ⏸ ${cell(n.pauseText || "先停一下")} | 暂停 | 位置随机、不显眼；倒带阶段置顶高亮 | 进入呼吸 / 回听 / 分类（见下） | |`, "",
          "选了冲动选项：看到\"后来……\"的后果 → 点「⏪ 倒回那一刻」，数值复原、\"先停一下\"置顶 → 直到选择暂停才继续。超时不选，按第一个冲动选项处理（\"情绪替你做了选择\"）。");
        P("");
        break;
      }
      case "echo": {
        P("", `> **🪞 镜面回放${id}**：${n.who} 在 \`${n.from}\` 实际说的那句（没玩过时取 ${n.def}）`, "");
        P("| 对方当时选了 | 原话 | 你听到的 | 你心里 | 数值 |", "|---|---|---|---|---|");
        for (const k of Object.keys(n.lines || {})) P(`| ${k} | ${cell(val(n.lines[k]))} | ${cell(n.decode?.[k] || "")} | ${cell(n.inner?.[k] || "")} | ${fx(n.fx?.[k])} |`);
        P("");
        break;
      }
      case "breathe": P(`- 🫧 呼吸 ${n.cycles} 轮（${fx(n.fx)}）：${clean(n.text || "")}`); break;
      case "replay": P(`- ⏪ 回听：${n.who}：「${clean(n.text)}」（${fx(n.fx)}）${(n.after || []).length ? "　→ 💭 " + n.after.map(clean).join(" / ") : ""}`); break;
      case "sort": {
        P("", `> **🗂 分类${id}**：${clean(n.prompt)}（${fx(n.fx)}，按正确率折算）`, "", "| 念头 | 应归入 |", "|---|---|");
        for (const [t, b] of n.items) P(`| ${cell(t)} | ${b} |`);
        if (n.explain) P("", `解析：${clean(n.explain)}`);
        P("");
        break;
      }
      case "rank": {
        P("", `> **🔢 排序${id}**：${clean(n.prompt)}（${fx(n.fx)}，按离正确位置的距离计分）`, "", "| 正确顺序 | 事项 |", "|---|---|");
        [...n.items].sort((a, b) => a[1] - b[1]).forEach(([t, i]) => P(`| ${i + 1} | ${cell(t)} |`));
        if (n.explain) P("", `解析：${clean(n.explain)}`);
        P("");
        break;
      }
      case "qa": {
        P("", `> **❓ 提问${id}**：问${n.who || ""}${n.call ? "（电话）" : ""}，选 ${n.pick} 个。${clean(n.intro || "")}`, "", "| 问题 | 类型 | 回答 | 数值 / 标记 |", "|---|---|---|---|");
        for (const q of n.qs) P(`| ${q.key ? "★ " : ""}${cell(q.q)} | ${q.type || ""} | ${cell(q.a)} | ${[fx(q.fx), q.set ? "标记 " + flags(q.set) : ""].filter(Boolean).join(" ")} |`);
        P("");
        break;
      }
      case "compose": {
        P("", `> **✍️ 拼句${id}**：${clean(n.prompt)}`, "");
        const groups = n.slotsBy ? Object.entries(n.slotsBy) : [["", n.slots]];
        for (const [g, slots] of groups) {
          if (g) P(`*${g}：*`);
          P("| 列 | 选项（✓ = 得分句） |", "|---|---|");
          for (const s of slots || []) P(`| ${s.label} | ${s.opts.map(([t, ok]) => `${ok ? "✓" : "✗"} ${cell(t)}`).join("<br>")} |`);
          P("");
        }
        P("| 得分 | 结果 | 反馈 | 数值 |", "|---|---|---|---|");
        for (const o of n.outcomes || []) P(`| ≥${o.min} | ${cell(replies(o.reply))} | ${cell(o.feedback || "")} | ${fx(o.fx)} |`);
        P("");
        break;
      }
      case "body": {
        P("", `> **🫀 身体信号${id}**：${clean(n.prompt)}`, "", "| 部位 | 感觉 | 可选的词（✓ = 贴切） |", "|---|---|---|");
        for (const p of n.parts) P(`| ${p.name} | ${cell(p.desc)} | ${p.words.map(w => (p.ok.includes(w) ? "✓" : "") + w).join("、")} |`);
        if (n.after) P("", `命名之后：💭 ${clean(n.after)}`);
        P("");
        break;
      }
      case "table": {
        P("");
        n.rows.forEach((r, i) => { P(`| ${r.map(cell).join(" | ")} |`); if (!i) P(`|${r.map(() => "---").join("|")}|`); });
        P("");
        break;
      }
      case "reveal": P(`- 📜 **${clean(n.title)}**：${clean(n.text)}`); break;
      case "voice": {
        const t = val(n.text);
        P(`- 🎙 ${n.who}的语音（${n.secs}s）${isFn(n.text) ? "（最后一句随手术决定变化）" : ""}：${(Array.isArray(t) ? t : [t]).map(clean).join(" ")}`);
        break;
      }
      case "if": P(`- ↪ 条件 \`${src(n.cond)}\`，不满足则跳到 \`${n.else}\`${id}`); break;
      case "goto": P(`- ↪ 跳到 \`${n.to}\``); break;
      case "ending": P(`- 🏁 进入结局判定`); break;
      case "noop": break;
      default: P(`- （${n.t}）${cell(JSON.stringify(n))}`);
    }
  }
}

function collectSigs(st) {
  const m = {};
  const walk = ns => (ns || []).forEach(n => (n.sig || []).forEach(s => (m[s.id] = clean(s.text))));
  for (const c of st.chapters) ["A", "B", "seq", "after"].forEach(k => walk(c[k]));
  return m;
}

// ---------- 正文 ----------
const ORDER = Object.values(W.STORIES).sort((a, b) => (a.order || 99) - (b.order || 99));
P("# 剧本与选项全表（按推荐游玩顺序）", "",
  "> 本文件由 `node tools/export-script.mjs` 从 `demo/` 的剧情数据生成，台词、选项、数值和游戏里一字不差。改剧情后重新运行即可更新；**不要手改本文件**，设计思路写在脚本里的 `DESIGN`。",
  "> 逐句剧本的创作稿（含音效提示、人物小传）见 [05 校园篇](05-校园篇剧本.md)、[02 主线](02-主线剧情脚本.md)、[06 职场篇](06-职场篇剧本.md)。", "",
  "## 怎么读", "",
  "- **推荐顺序**：" + ORDER.map((s, i) => `${i + 1}. 《${s.title}》`).join("　") + `　${ORDER.length + 1}. 日常练习关`,
  "- 每章三段：**经历**（默认视角）→ **镜面**（另一视角，同一时间线）→ **倒带**（回到倒带点重选）。下面每章先列默认视角的段落，再列另一视角。",
  "- **数值**：温 = 情绪温度（F 视角，越低越能听清事实）；觉察（T 视角，捕捉信号得分）；关系 = 两位主角之间的关系值，决定结局。",
  "- **标记**：剧情标记（如 `LK_HOME`），后面的节点、结局会读取。条件写作 `G.f.标记`、`G.v.rel`（关系值）。",
  "- 🔍 选项需要先捕捉对应信号才会出现；★ 表示计入复盘的关键选择。", "",
  "### 选项类型与设计意图", "", "| 类型 | 设计意图 |", "|---|---|", ...TYPE_NOTE.map(([a, b]) => `| ${a} | ${b} |`), "",
  "**第一次的反应不扣分。** 经历阶段的选择只用于复盘\"你的习惯\"；倒带后的选择，才是\"多出来的那一种\"。", "",
  "## 目录", "", ...ORDER.map((s, i) => `- [${i + 1}. 《${s.title}》](#${i + 1}-${s.title})`), `- [${ORDER.length + 1}. 日常练习关](#${ORDER.length + 1}-日常练习关)`, "");

ORDER.forEach((st, si) => {
  const d = DESIGN[st.id] || { why: [], ch: {} };
  const nameOf = {};
  for (const [name, cid] of Object.entries(st.cast || {})) if (!nameOf[cid] || name.length > 1) nameOf[cid] = nameOf[cid] || name;
  for (const p of ["A", "B"]) nameOf[st.POV[p].char] = st.POV[p].name;
  const ctxS = { nameOf, sigText: collectSigs(st) };
  const first = st.defaultStart || "A", second = first === "A" ? "B" : "A";
  P("---", "", `## ${si + 1}. 《${st.title}》`, "",
    `**${st.tag} · 约 ${st.minutes} 分钟**　${st.blurb}`, "",
    `| 视角 | 人物 | 倾向 |`, `|---|---|---|`,
    ...["A", "B"].map(p => `| ${p}${p === first ? "（默认开局）" : ""} | ${st.POV[p].name} | ${st.POV[p].tag} |`), "",
    "### 设计思路", "", ...d.why.map(x => `- ${x}`), "");
  st.chapters.forEach((ch, ci) => {
    P(`### ${si + 1}.${ci + 1} ${ch.title}　〔${ch.sub || ""}〕`, "");
    if (d.ch[ch.id]) P(`**设计要点**：${d.ch[ch.id]}`, "");
    if (ch.goal) P("| | 这一章要学会 |", "|---|---|", ...["A", "B"].map(p => `| ${st.POV[p].name}（${st.POV[p].tag}） | ${cell(ch.goal[p])} |`), "");
    if (ch.rewindAt) P(`**倒带点**：${["A", "B"].map(p => `${st.POV[p].name} → \`${ch.rewindAt[p]}\`（${ch.rewindTip?.[p] || ""}）`).join("；")}`, "");
    if (ch.seq) { P("#### 剧情（无镜面）", ""); renderNodes(ch.seq, ctxS); P(""); }
    else for (const p of [first, second]) {
      if (!ch[p]) continue;
      P(`#### ${p} 段 · ${st.POV[p].name}视角${p === first ? "（默认经历）" : "（默认镜面）"}`, "");
      renderNodes(ch[p], ctxS);
      P("");
    }
    if (ch.after) { P("#### 两个视角都完成后", ""); renderNodes(ch.after, ctxS); P(""); }
    if (ch.mirrorOutro) {
      P("#### 镜面结束旁白", "");
      for (const p of [first, second]) if (ch.mirrorOutro[p]) P(`- 从${st.POV[p].name}开始时：`, ...ch.mirrorOutro[p].map(n => `  - ${clean(val(n.text))}`));
      P("");
    }
    if (ch.cards) {
      P("#### 复盘", "");
      for (const p of ["A", "B"]) P(`- 🎴 **${st.POV[p].name}的技能卡「${ch.cards[p].title}」**：${ch.cards[p].points.map(clean).join("；")}`);
      if (ch.tasks) for (const p of ["A", "B"]) P(`- 📌 本周小任务（从${st.POV[p].name}开始）：${clean(ch.tasks[p])}`);
      if (ch.questions) P(`- 💬 讨论题：${ch.questions.map((q, i) => `${i + 1}）${clean(q)}`).join("　")}`);
      P("");
    }
  });
  P(`### 结局`, "", "| 结局 | 条件（按顺序判定，命中即止） | 文案 | 收尾 |", "|---|---|---|---|");
  for (const e of st.endings) P(`| 「${e.title}」 | ${e.when ? `\`${src(e.when).replace(/\|/g, "\\|")}\`` : "其余情况"} | ${cell(e.text)} | ${cell((val(e.lines) || []).map(l => l.t === "scene" ? "" : `${l.who}：${clean(l.text)}`).filter(Boolean).join(" / "))}${e.retry ? `（可倒带回 ${e.retry}）` : ""} |`);
  if (d.ch.endNote) P("", d.ch.endNote);
  P("");
});

// ---------- 练习关 ----------
P("---", "", `## ${ORDER.length + 1}. 日常练习关`, "", "每关约 3 分钟，一个日常场景练一个动作。T→F 路线练\"读懂人心\"，F→T 路线练\"冷静解题\"（校园和职场）。", "");
for (const r of Object.values(W.ROUTES)) {
  P(`### ${r.from} → ${r.to}：${r.title}`, "", r.subtitle || "", "");
  for (const l of r.levels) {
    P(`#### ${l.title}　〔练：${l.skill}〕`, "", `*${clean(l.intro)}*`, "");
    for (const s of l.steps) {
      if (s.type === "say") P(`- ${s.who === "旁白" ? "*旁白*" : s.who === "内心" ? "💭 内心" : `**${s.who}**`}：${clean(s.text)}`);
      else if (s.type === "read") P("", `> **读心**：${clean(s.prompt)}`, "", `选项：${s.options.join("、")}　→ 答案：**${s.answer.join("、")}**`, "", `解析：${clean(s.explain)}`, "");
      else if (s.type === "choice") {
        P("", `> **🔀 ${clean(s.prompt)}**`, "", "| 选项 | 类型 | 对方回应 | 对方心里 | 点评 | 数值 |", "|---|---|---|---|---|---|");
        for (const o of s.options) P(`| ${o.good ? "✅ " : ""}${cell(o.text)} | ${o.tag || ""} | ${cell(o.reply ? `${o.reply.who}：${o.reply.text}` : "")} | ${cell(o.inner || "")} | ${cell(o.feedback || "")} | ${fx(o.effects)} |`);
        P("");
      } else if (s.type === "impulse") {
        P("", `> **⏱ 冲动（限时 ${s.seconds}s）**：${clean(s.prompt)}`, "", "| 选项 | 后来…… | 数值 |", "|---|---|---|");
        for (const o of s.options) P(`| ${cell(o.text)} | ${cell(o.consequence || "")} | ${fx(o.effects)} |`);
        P(`| ⏸ ${cell(s.pauseText || "先停一下")} | 进入呼吸 | |`, "");
      } else if (s.type === "breathe") P(`- 🫧 呼吸 ${s.cycles} 轮（${fx(s.effects)}）：${clean(s.text)}`);
      else if (s.type === "reveal") P(`- 📜 **${clean(s.title)}**：${clean(s.text)}`);
      else if (s.type === "sort") {
        P("", `> **🗂 ${clean(s.prompt || "分类")}**`, "", "| 内容 | 应归入 |", "|---|---|");
        for (const it of s.items || []) P(`| ${cell(it.text ?? it[0])} | ${cell(it.bin ?? it.answer ?? it[1])} |`);
        if (s.explain) P("", `解析：${clean(s.explain)}（${fx(s.effects)}）`);
        P("");
      } else P(`- （${s.type}）${cell(s.text || s.prompt || JSON.stringify(s).slice(0, 300))}`);
    }
    if (l.takeaway) P("", `**带走**：${cell(Array.isArray(l.takeaway) ? l.takeaway.join("；") : l.takeaway.title ? `${l.takeaway.title}——${(l.takeaway.points || []).join("；")}` : JSON.stringify(l.takeaway))}`);
    P("");
  }
}

fs.writeFileSync(`${root}/docs/08-剧本与选项全表.md`, out.join("\n") + "\n");
console.log(`写入 docs/08-剧本与选项全表.md：${out.length} 行`);
