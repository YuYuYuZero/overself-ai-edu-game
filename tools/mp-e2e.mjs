// 小程序版逻辑层自动通关测试：在 Node 里模拟 wx / Page / setData，用虚拟时钟把三个故事（两个视角）、
// 目录跳章、读档、全部练习关、MBTI 测试和首页各跑一遍。不需要开发者工具，也不装任何 npm 包。
//   node tools/mp-e2e.mjs            # 全部
//   node tools/mp-e2e.mjs story      # 只跑故事（story / level / quiz / land / home / toc）
// 检查：流程能走到结局 / 结算；setData 里不能有函数、单次不能超过 1MB；没有未捕获的异常。
// 画面（WXML/WXSS）要在微信开发者工具或真机上看，这里只验证逻辑层。
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(root, "miniprogram/app.js"));
const only = process.argv[2];

// ---------- 虚拟时钟：setTimeout / setInterval / Date.now 全部走假时间，瞬间跑完 ----------
const realImmediate = setImmediate;
let now = 0, seq = 0;
const queue = [], intervals = new Set(), base = Date.now();
globalThis.setTimeout = (fn, ms = 0, ...args) => { const id = ++seq; queue.push({ id, t: now + Math.max(0, +ms || 0), fn, args }); return id; };
globalThis.clearTimeout = id => { const i = queue.findIndex(x => x.id === id); if (i >= 0) queue.splice(i, 1); };
globalThis.setInterval = (fn, ms) => {
  const id = ++seq; intervals.add(id);
  const tick = () => { fn(); if (intervals.has(id)) queue.push({ id, t: now + ms, fn: tick, args: [] }); };
  queue.push({ id, t: now + ms, fn: tick, args: [] });
  return id;
};
globalThis.clearInterval = id => { intervals.delete(id); globalThis.clearTimeout(id); };
Date.now = () => base + now;
const drain = async () => { for (let i = 0; i < 4; i++) await new Promise(r => realImmediate(r)); };
async function tick() {
  await drain();
  if (!queue.length) return false;
  queue.sort((a, b) => a.t - b.t || a.id - b.id);
  const next = queue.shift();
  now = Math.max(now, next.t);
  next.fn(...next.args);
  return true;
}

// ---------- wx / Page 替身 ----------
const storage = new Map(), errors = [], nav = [];
let maxPayload = 0;
globalThis.wx = {
  getStorageSync: k => (storage.has(k) ? storage.get(k) : ""),
  setStorageSync: (k, v) => storage.set(k, v),
  removeStorageSync: k => storage.delete(k),
  getWindowInfo: () => ({ windowWidth: 390, windowHeight: 844, statusBarHeight: 47, safeArea: { bottom: 810 } }),
  getMenuButtonBoundingClientRect: () => ({ top: 51, height: 32, bottom: 83, left: 296, right: 383, width: 87 }),
  createSelectorQuery: () => { const q = { in: () => q, select: () => q, boundingClientRect: cb => { q.cb = cb; return q; }, exec: () => q.cb && q.cb({ bottom: 160, height: 110 }) }; return q; },
  navigateTo: o => nav.push(["navigateTo", o.url]), redirectTo: o => nav.push(["redirectTo", o.url]),
  navigateBack: () => nav.push(["navigateBack"]), reLaunch: o => nav.push(["reLaunch", o.url]),
  setNavigationBarTitle: () => {}, pageScrollTo: () => {}, showToast: () => {}, canvasToTempFilePath: o => o.fail && o.fail({})
};
let lastPageConfig = null;
globalThis.Page = cfg => { lastPageConfig = cfg; };
globalThis.App = () => {};
globalThis.getCurrentPages = () => [{}, {}];

function findFn(x, at = "") {
  if (typeof x === "function") return at;
  if (x && typeof x === "object") for (const k of Object.keys(x)) { const r = findFn(x[k], at + "." + k); if (r) return r; }
  return null;
}
function setPath(o, key, v) {
  const parts = key.split(".");
  for (let i = 0; i < parts.length - 1; i++) { if (o[parts[i]] == null || typeof o[parts[i]] !== "object") o[parts[i]] = {}; o = o[parts[i]]; }
  o[parts[parts.length - 1]] = v;
}
function makePage(file, query) {
  lastPageConfig = null;
  require(path.join(root, "miniprogram", file.startsWith("package") ? "" : "pages", file));
  const cfg = lastPageConfig;
  const page = Object.create(cfg);
  page.data = JSON.parse(JSON.stringify(cfg.data || {}));
  page.setData = (obj, cb) => {
    const fnAt = findFn(obj);
    if (fnAt) errors.push(`setData 里有函数：${fnAt}`);
    const json = JSON.stringify(obj);
    maxPayload = Math.max(maxPayload, json.length);
    if (json.length > 1024 * 1024) errors.push(`setData 超过 1MB：${json.length}`);
    const o = JSON.parse(json);
    for (const k of Object.keys(o)) setPath(page.data, k, o[k]);
    if (cb) setTimeout(cb, 0);
  };
  page.onLoad && page.onLoad(query || {});
  page.onShow && page.onShow();
  return page;
}
// 每个测试独立：清空页面模块缓存（共享数据模块保留）
function fresh() { for (const k of Object.keys(require.cache)) if (k.includes("/pages/") || k.includes("/packageShare/")) delete require.cache[k]; }

// ---------- 自动玩家 ----------
function rng(seed) { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const tap = (page, id) => page.onTap({ currentTarget: { dataset: { id } } });

// 根据当前页面数据做一个动作；做了返回 true
function act(page, rand, log) {
  const d = page.data;
  if (d.inter || d.tcard) return false;
  if (d.toc) { const chips = d.toc.rows.flatMap(r => r.chips); const c = chips[Math.floor(rand() * chips.length)]; log.push("toc→" + c.text); tap(page, c.id); return true; }
  if (d.mode === "page" && d.view) {
    if (d.view.go) { tap(page, d.view.go.id); log.push(d.view.type); return true; }
    if (d.view.btns) { const b = d.view.btns.find(x => /首页/.test(x.text)); log.push("ending:" + d.view.title); tap(page, b.id); return true; }
  }
  if (d.mode === "result" && d.result) { const b = d.result.btns.find(x => /下一关|路线完成/.test(x.text)); log.push("result:" + d.result.head); tap(page, b.id); return true; }
  const vn = d.vn || {};
  // 偶尔点一下信号
  const sig = (vn.sigs || []).find(s => s.id && !/got|gone|fake/.test(s.c));
  if (sig && rand() < 0.5) { tap(page, sig.id); log.push("sig"); return true; }
  const P = d.panel;
  if (P && P.blocks) {
    const B = k => P.blocks.find(b => b.k === k);
    const live = items => (items || []).filter(x => x.id);
    if (B("muted") && /语音条/.test(B("muted").text)) { page.onVoice(); log.push("voice"); return true; }
    if (B("breathe")) { const b = B("breathe"); if (b.skip && b.skip.id && rand() < 0.5) { tap(page, b.skip.id); log.push("breathe-skip"); return true; } return false; }
    if (B("sort")) { for (const r of B("sort").rows) { const free = live(r.bins); if (free.length && !r.bins.some(x => x.on)) { tap(page, free[Math.floor(rand() * free.length)].id); return true; } } }
    if (B("rank")) { const free = live(B("rank").items); if (free.length) { tap(page, free[Math.floor(rand() * free.length)].id); return true; } }
    if (B("body")) {
      for (const p of B("body").parts) {
        if (p.words) { tap(page, p.words[Math.floor(rand() * p.words.length)].id); log.push("body"); return true; }
        if (p.id) { tap(page, p.id); return true; }
      }
    }
    if (B("compose")) { for (const s of B("compose").slots) if (!s.opts.some(o => o.on)) { tap(page, s.opts[Math.floor(rand() * s.opts.length)].id); return true; } }
    if (B("flips")) { const f = live(B("flips").items); if (f.length) { tap(page, f[0].id); return true; } }
    if (B("chips")) { const c = B("chips").items; if (c.every(x => x.id) && !c.some(x => /on/.test(x.c))) { tap(page, c[0].id); tap(page, c[1].id); return true; } }
    if (B("opts")) {
      const items = live(B("opts").items);
      if (B("timer") && rand() < 0.25) return false; // 冲动：偶尔不选，等超时
      if (items.length) { const o = items[Math.floor(rand() * items.length)]; log.push("opt:" + o.text.slice(0, 12)); tap(page, o.id); return true; }
    }
    if (B("btns")) { const b = live(B("btns").items).filter(x => !/重排/.test(x.text))[0]; if (b) { log.push("btn:" + b.text); tap(page, b.id); return true; } }
  }
  if (vn.adv) { page.onAdv(); return true; }
  return false;
}

async function play(page, rand, label, maxSteps = 400000) {
  const log = [];
  let steps = 0;
  const t0 = now;
  while (steps++ < maxSteps) {
    await drain();
    if (nav.length) return { log, nav: nav.splice(0), steps, mins: ((now - t0) / 60000).toFixed(1) };
    if (act(page, rand, log)) continue;
    if (!(await tick())) { errors.push(`${label}：卡住了（没有可点的东西，也没有计时器） mode=${page.data.mode} panel=${JSON.stringify(page.data.panel).slice(0, 200)}`); break; }
  }
  if (steps >= maxSteps) errors.push(`${label}：超过 ${maxSteps} 步还没结束`);
  return { log, nav: nav.splice(0), steps, mins: ((now - t0) / 60000).toFixed(1) };
}

process.on("unhandledRejection", e => errors.push("未处理的异常：" + (e && e.stack || e)));
const env = require("./shared/index.js");
const results = [];

if (!only || only === "story") {
  for (const id of Object.keys(env.STORIES)) for (const pov of ["A", "B"]) for (const seed of [1, 2]) {
    fresh(); storage.clear();
    const page = makePage("story/story.js", { id, pov });
    const r = await play(page, rng(seed * 97 + pov.charCodeAt(0)), `${id}/${pov}/${seed}`);
    // 与网页版一致：看完结局点「回到首页」后，存档回到尾声开始时（exit 会还原 _chStart），所以这里看是否到过结局页
    const G = JSON.parse(storage.get(env.STORIES[id].key) || "null");
    const end = r.log.filter(x => x.startsWith("ending:")).pop();
    const ok = !!end && r.nav.some(n => n[0] === "navigateBack");
    results.push([`故事 ${id} 从 ${pov} 开始（seed ${seed}）`, ok, `${end ? "结局" + end.slice(7) : "没到结局"}，关系 ${G && G.v.rel}，技能卡 ${G && G.cards.length}，${r.steps} 步，约 ${r.mins} 分钟`]);
    page.onUnload();
  }
}
if (!only || only === "toc") {
  // 目录：从首页打开 → 随机跳一章 → 中途存档退出 → 读档继续到结局
  for (const id of Object.keys(env.STORIES)) {
    fresh(); storage.clear();
    let page = makePage("story/story.js", { id, act: "toc" });
    await drain();
    const okToc = !!page.data.toc;
    const chips = page.data.toc.rows[1].chips;
    tap(page, chips[chips.length - 1].id);
    for (let i = 0; i < 60; i++) { await drain(); if (!act(page, rng(5), [])) await tick(); }
    page.onExit(); await drain();
    const saved = JSON.parse(storage.get(env.STORIES[id].key));
    nav.splice(0); page.onUnload(); fresh();
    page = makePage("story/story.js", { id, act: "resume" });
    // 舞台上打开目录、切视角、跳到另一章的镜面
    for (let i = 0; i < 40; i++) { await drain(); if (!act(page, rng(9), [])) await tick(); }
    page.onToc(); await drain();
    const pov = page.data.toc.povs.find(p => !p.c);
    tap(page, pov.id); await drain();
    const ch3 = page.data.toc.rows[2].chips;
    tap(page, ch3[Math.min(1, ch3.length - 1)].id);
    const r = await play(page, rng(11), `toc ${id}`);
    const end = r.log.filter(x => x.startsWith("ending:")).pop();
    results.push([`目录 / 读档 ${id}`, okToc && saved && saved.ch >= 1 && !!end, `从首页目录跳进第 2 章，中途退出存在第 ${saved && saved.ch + 1} 章；读档后切视角跳第 3 章，打到结局${end ? end.slice(7) : "（没到）"}`]);
    page.onUnload();
  }
}
if (!only || only === "level") {
  for (const rid of Object.keys(env.ROUTES)) {
    fresh(); storage.clear();
    const page = makePage("level/level.js", { route: rid, i: 0 });
    const r = await play(page, rng(3), `level ${rid}`);
    const p = JSON.parse(storage.get("complement.progress.v1"));
    const n = env.ROUTES[rid].levels.length;
    results.push([`练习路线 ${rid}`, Object.keys(p.cards).length === n, `${n} 关全部完成，星级 ${env.ROUTES[rid].levels.map(l => p.stars[l.id]).join("/")}`]);
    page.onUnload();
  }
}
if (!only || only === "quiz") {
  // 答完一整套：每道题按 pickV(题目) 作答，逐页翻到结果
  const answerAll = (page, pickV) => {
    for (let guard = 0; guard < 40 && page.data.mode === "quiz"; guard++) {
      for (const it of page.data.q.items) page.pick({ currentTarget: { dataset: { id: it.id, v: pickV(it) } } });
      page.next();
    }
  };
  const M = env.MBTI;
  const lean = { E: 2, N: 1, F: 3, P: 1, I: -1, S: -1, T: -2, J: 0 }; // 偏 E N F P
  const byKey = it => lean[M.ITEMS.find(x => x.id === it.id).key];
  for (const mode of ["full", "quick"]) {
    fresh(); storage.clear();
    const page = makePage("quiz/quiz.js", {});
    const introOk = page.data.mode === "intro" && page.data.intro.modes.length === 2;
    page.startMode({ currentTarget: { dataset: { k: mode } } });
    answerAll(page, byKey);
    const res = page.data.res, saved = JSON.parse(storage.get("overself.mbti.v1"));
    const ok = introOk && page.data.mode === "result" && res.type === "ENFP" && res.dims.length === 4 && saved.v === 2 && saved.mode === mode && !!res.best && !!page.data.avatar;
    results.push([`MBTI 测试（${M.MODES[mode].label}）`, ok, `${M.items(mode).length} 题 → ${res.type} ${res.name}（${res.g.name}）；${res.dims.map(d => d.p + "%" + d.letterName).join(" ")}；推荐：${res.best && res.best.btn}`]);
  }
  // 中途暂停 → 草稿 → 继续；全选「说不准」按官方规则得 INFP
  fresh(); storage.clear();
  {
    const page = makePage("quiz/quiz.js", {});
    page.startMode({ currentTarget: { dataset: { k: "full" } } });
    for (const it of page.data.q.items) page.pick({ currentTarget: { dataset: { id: it.id, v: 0 } } });
    page.next(); page.pause();
    const draft = JSON.parse(storage.get("overself.quiz.draft.v2"));
    fresh();
    const p2 = makePage("quiz/quiz.js", {});
    const hasResume = !!p2.data.intro.draft;
    p2.resume();
    const resumedAt = p2.data.q.label;
    answerAll(p2, () => 0);
    results.push(["测试草稿与平分规则", draft.page === 1 && hasResume && /第 2 \/ 10 页/.test(resumedAt) && p2.data.res.type === "INFP" && !storage.has("overself.quiz.draft.v2"),
      `暂停时已答 ${Object.keys(draft.answers).length} 题，从「${resumedAt}」继续；全中立 → ${p2.data.res.type}`]);
  }
  // 旧版存档（22 题二选一）能直接打开结果页
  fresh(); storage.clear();
  storage.set("overself.mbti.v1", JSON.stringify({ type: "ISTJ", score: { E: 1, I: 4, S: 4, N: 1, T: 5, F: 2, J: 4, P: 1 } }));
  {
    const page = makePage("quiz/quiz.js", { view: "result" });
    results.push(["读取 v1 存档", page.data.mode === "result" && page.data.res.type === "ISTJ" && page.data.res.dims[0].p === 80, `ISTJ：${page.data.res.dims.map(d => d.p + "%").join(" / ")}；${page.data.res.modeNote}`]);
    page.setSex({ currentTarget: { dataset: { s: "m" } } });
  }
  // 分享卡片：用记录调用的假画布把海报和封面各画一遍（真机绘制要在开发者工具 / 手机上看）
  {
    const calls = [];
    const ctx = new Proxy({}, {
      get(t, k) {
        if (k in t) return t[k];
        if (k === "measureText") return s => ({ width: String(s).length * 20 });
        if (k === "createLinearGradient") return () => ({ addColorStop() {} });
        return (...a) => { calls.push(k); };
      },
      set(t, k, v) { t[k] = v; return true; }
    });
    const SC = env.ShareCard, img = { width: 680, height: 1060 };
    const d = SC.data(M.normalize(JSON.parse(storage.get("overself.mbti.v1"))), { footer: "微信搜索" });
    SC.poster(ctx, d, { portrait: img, logo: img, qr: img });
    SC.cover(ctx, d, { portrait: img });
    const fs = await import("node:fs");
    const missing = [];
    for (const t of Object.keys(M.names)) for (const s of ["f", "m"]) if (!fs.existsSync(path.join(root, `miniprogram/packageShare/portraits/${t}-${s}.png`))) missing.push(`${t}-${s}`);
    results.push(["分享卡片绘制", calls.includes("fillText") && calls.includes("drawImage") && !missing.length, `${calls.length} 次绘制调用；形象图 ${missing.length ? "缺 " + missing.join(",") : "32 张齐全"}`]);
    fresh();
    wx.createSelectorQuery = () => { const q = { in: () => q, select: () => q, fields: () => q, boundingClientRect: cb => { q.cb = cb; return q; }, exec: cb => (cb || q.cb) && (cb || q.cb)([null]) }; return q; };
    const card = makePage("packageShare/card/card.js", {});
    results.push(["分享卡片页", card.data.type === "ISTJ" && typeof card.onShareAppMessage().title === "string", card.onShareAppMessage().title]);
  }
}
if (!only || only === "land") {
  // 横屏：窗口改成横向后触发 onResize，lay 切到 land，立绘按舞台高度重新算；横着把一关练习打完
  fresh(); storage.clear();
  const page = makePage("level/level.js", { route: "f2t", i: "0" });
  const portrait = page.data.lay;
  const winInfo = wx.getWindowInfo, menu = wx.getMenuButtonBoundingClientRect;
  wx.getWindowInfo = () => ({ windowWidth: 844, windowHeight: 390, statusBarHeight: 0, safeArea: { bottom: 390 } });
  wx.getMenuButtonBoundingClientRect = () => ({ top: 8, height: 32, bottom: 40, left: 750, right: 837, width: 87 });
  page.onResize();
  const land = page.data.lay;
  const r = await play(page, rng(5), "level f2t landscape");
  wx.getWindowInfo = winInfo; wx.getMenuButtonBoundingClientRect = menu;
  results.push(["横屏", !portrait.land && land.land && land.sw > 0 && land.sw !== portrait.sw && page.data.mode === "result",
    `竖屏立绘宽 ${portrait.sw}px → 横屏 ${land.sw}px；横屏打完一关：${page.data.result && page.data.result.head}`]);
  page.onUnload();
}
if (!only || only === "home") {
  fresh();
  const page = makePage("index/index.js", {});
  const d = page.data;
  results.push(["首页", d.stories.length === Object.keys(env.STORIES).length && d.hero.bg.startsWith("data:image/svg+xml;base64,"), `${d.stories.length} 个故事、${d.routes.length} 条练习路线、技能卡 ${d.cardCount}；类型 ${d.mine && d.mine.type}`]);
}

console.log("\n小程序逻辑层测试");
for (const [name, ok, note] of results) console.log(`${ok ? "✅" : "❌"} ${name}  ${note}`);
console.log(`单次 setData 最大 ${(maxPayload / 1024).toFixed(0)} KB`);
if (errors.length) { console.log("\n问题："); [...new Set(errors)].slice(0, 30).forEach(e => console.log(" - " + e)); }
process.exit(errors.length || results.some(r => !r[1]) ? 1 : 0);
