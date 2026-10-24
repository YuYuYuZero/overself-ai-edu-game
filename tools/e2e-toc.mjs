// 目录/跳章冒烟：进度条、目录打开、跨章跨阶段跳转、切视角、首页目录。用法：node tools/e2e-toc.mjs [宽x高]
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SID = "toc";
const [W, Hh] = (process.argv[2] || "420x860").split("x").map(Number);
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9360 + (W > 800 ? 1 : 0), OUT = `${root}/tools/shots/toc-${W}`;
mkdirSync(OUT, { recursive: true });
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=/tmp/cg-toc-${W}`, "--autoplay-policy=no-user-gesture-required", "about:blank"], { stdio: "ignore" });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let tabs; for (let i = 0; i < 40; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); break; } catch { await sleep(250); } }
const ws = new WebSocket(tabs.find(t => t.type === "page").webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
let id = 0; const pending = new Map(); const errors = [];
ws.onmessage = e => { const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  if (m.method === "Runtime.consoleAPICalled" && ["error", "warn"].includes(m.params.type)) errors.push(m.params.type + ": " + m.params.args.map(a => a.value ?? a.description).join(" ")); };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async expr => (await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true })).result?.value;
let shotN = 0;
const shot = async name => { const r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }); writeFileSync(`${OUT}/${String(++shotN).padStart(2, "0")}-${name}.png`, Buffer.from(r.data, "base64")); };
await send("Runtime.enable"); await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: W, height: Hh, deviceScaleFactor: 1, mobile: W < 800 });
await send("Page.navigate", { url: `file://${root}/demo/index.html` }); await sleep(800);
await ev("localStorage.clear(); location.reload()"); await sleep(800);
await shot("home");

const fails = [];
const check = (ok, msg) => { console.log((ok ? "✓ " : "✗ ") + msg); if (!ok) fails.push(msg); };
const click = async sel => ev(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (b) b.click(); return !!b; })()`);
const clickText = async (sel, t) => ev(`(() => { const b = [...document.querySelectorAll(${JSON.stringify(sel)})].find(x => x.textContent.includes(${JSON.stringify(t)})); if (b) b.click(); return !!b; })()`);
const state = () => ev(`({ title: document.querySelector(".level-head h2")?.textContent, phase: document.querySelector(".phase-tag")?.textContent, pov: document.querySelector(".pov-badge")?.textContent,
  segs: document.querySelectorAll(".prog .seg").length, cur: [...document.querySelectorAll(".prog .seg")].findIndex(s => s.classList.contains("cur")), toc: !!document.querySelector(".toc"),
  intro: !!document.querySelector(".chapter-intro"), save: JSON.parse(localStorage.getItem("complement.story.v1") || "null") })`);
const wait = async (cond, ms = 9000) => { for (let t = 0; t < ms; t += 200) { if (await ev(cond)) return true; await sleep(200); } return false; };

// 1. 首页目录：那一周
check(await clickText("button", "章节目录"), "首页有「章节目录」按钮");
await sleep(300); await shot("home-toc");
check((await state()).toc, "首页点开目录");
check(await ev(`document.querySelectorAll(".toc-row").length`) === 5, "那一周目录列出 5 章");
// 跳到第二章 · 镜面
check(await ev(`(() => { const r = document.querySelectorAll(".toc-row")[2]; const c = [...r.querySelectorAll(".toc-chip")].find(x => x.textContent.includes("镜面")); c.click(); return true; })()`), "点第二章 · 镜面");
check(await wait(`document.querySelector(".phase-tag")?.textContent === "镜面"`), "直接进入第二章镜面（跳过章首和经历）");
let st = await state();
check(st.title?.includes("第二章") && st.cur === 2 && st.segs === 5, `进度条 5 段、当前第 3 段：${st.title} cur=${st.cur}`);
check(st.pov?.includes("林晚"), "林朗开局时镜面是林晚视角：" + st.pov);
await sleep(1500); await shot("ch2-mirror");
// 2. 游戏中打开目录
check(await click(".hud .toc-btn"), "HUD 有目录按钮"); await sleep(300);
check(await ev(`!!document.querySelector(".toc-row.cur") && !!document.querySelector(".toc-chip.here")`), "目录标出当前章与当前阶段");
check(await ev(`document.querySelector(".toc-row:nth-child(3) .toc-chip.seen")?.textContent.includes("镜面")`), "玩过的阶段打勾");
await shot("ingame-toc");
// 切到林晚视角，跳第一章 · 倒带
check(await clickText(".toc-pov-btn", "林晚"), "目录切视角");
check(await ev(`(() => { const r = document.querySelectorAll(".toc-row")[1]; [...r.querySelectorAll(".toc-chip")].find(x => x.textContent.includes("倒带")).click(); return true; })()`), "点第一章 · 倒带");
check(await wait(`document.querySelector(".phase-tag")?.textContent === "倒带"`), "进入第一章倒带");
st = await state();
check(st.pov?.includes("林晚") && st.save?.start === "B" && st.save?.ch === 1, `视角切成林晚并存档：start=${st.save?.start} ch=${st.save?.ch}`);
await sleep(1200); await shot("ch1-rewind-B");
// 3. 进度条点击打开目录，Esc 关闭
await click(".prog"); await sleep(200);
check((await state()).toc, "点进度条打开目录");
await ev(`document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))`); await sleep(200);
check(!(await state()).toc, "Esc 关闭目录");
// 4. 跳到序章（noMirror），应有章首
await click(".hud .toc-btn"); await sleep(200);
await ev(`document.querySelectorAll(".toc-row")[0].querySelector(".toc-chip").click()`);
check(await wait(`!!document.querySelector(".chapter-intro")`), "跳到序章从章首开始");
await shot("prologue-intro");
check(await ev(`!!document.querySelector(".page-bar .toc-btn")`), "章首页也有目录按钮");
// 5. 存档退出 → 首页「继续」指向序章
await click(".page-bar .back"); await sleep(400);
check(await ev(`[...document.querySelectorAll("button")].some(b => b.textContent.includes("继续：序章"))`), "退出后首页显示「继续：序章」");
// 6. 校园篇首页目录直接跳尾声
await ev(`[...document.querySelectorAll(".story-card")].find(c => c.textContent.includes("汇演前三天")).querySelector(".btn.plain").click()`); await sleep(300);
await ev(`[...document.querySelectorAll(".toc-row")].at(-1).querySelector(".toc-chip").click()`);
check(await wait(`!!document.querySelector(".chapter-intro") && document.querySelector(".chapter-intro h1")?.textContent.includes("尾声")`), "校园篇从目录跳到尾声");
await shot("campus-ep");

console.log(errors.length ? "JS 错误：\n" + errors.join("\n") : "无 JS 错误");
console.log(fails.length ? `失败 ${fails.length} 项` : "全部通过");
ws.close(); chrome.kill(); process.exit(fails.length || errors.length ? 1 : 0);
