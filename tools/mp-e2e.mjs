// 小程序版逻辑层自动通关测试：在 Node 里模拟 wx / Page / setData，用虚拟时钟把三个故事（两个视角）、
// 目录跳章、读档、全部练习关、MBTI 测试和首页各跑一遍。不需要开发者工具，也不装任何 npm 包。
//   node tools/mp-e2e.mjs            # 全部
//   node tools/mp-e2e.mjs story      # 只跑故事（story / level / quiz / home / toc）
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
  setNavigationBarTitle: () => {}, pageScrollTo: () => {}
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
  require(path.join(root, "miniprogram/pages", file));
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
function fresh() { for (const k of Object.keys(require.cache)) if (k.includes("/pages/")) delete require.cache[k]; }

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
  fresh(); storage.clear();
  const page = makePage("quiz/quiz.js", {});
  for (let i = 0; i < env.QUIZ.length; i++) page.pick({ currentTarget: { dataset: { i: i % 2, q: page.data.i } } });
  const res = page.data.res;
  results.push(["MBTI 测试", page.data.mode === "result" && res.letters.length === 4 && !!res.best, `结果 ${res.letters.join("")} ${res.name}；推荐：${res.best && res.best.btn}`]);
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
