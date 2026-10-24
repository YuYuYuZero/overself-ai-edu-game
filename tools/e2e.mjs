// 冒烟测试：headless Chrome 自动通关全部 6 关并截图。用法：node tools/e2e.mjs
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9333, OUT = `${root}/tools/shots`;
mkdirSync(OUT, { recursive: true });
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, "--user-data-dir=/tmp/cg-e2e", "--window-size=420,900", "about:blank"], { stdio: "ignore" });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let tabs; for (let i = 0; i < 40; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); break; } catch { await sleep(250); } }
const ws = new WebSocket(tabs.find(t => t.type === "page").webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
let id = 0; const pending = new Map(); const errors = [];
ws.onmessage = e => { const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails.exception?.description);
  if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errors.push(JSON.stringify(m.params.args)); };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async expr => (await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true })).result?.value;
const shot = async name => { const r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }); writeFileSync(`${OUT}/${name}.png`, Buffer.from(r.data, "base64")); };
await send("Runtime.enable"); await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 420, height: 900, deviceScaleFactor: 1, mobile: true });
await send("Page.navigate", { url: `file://${root}/demo/index.html` }); await sleep(800);
await ev("localStorage.clear()"); await shot("01-home");

// 单步驱动器：每次调用做一个动作，返回动作名
const STEP = `(() => {
  const q = s => [...document.querySelectorAll(s)];
  const btn = t => q("button").find(b => b.textContent.includes(t) && !b.disabled && b.offsetParent);
  if (q(".big-stars").length) return "result";
  let b;
  if ((b = btn("倒带") || btn("倒回"))) { b.click(); return "rewind"; }
  if ((b = q(".opt.pause")[0])) { b.click(); return "pause"; }
  if ((b = btn("我平静下来了"))) { b.click(); return "breathe-skip"; }
  if (q(".breathe").length && !q(".next-row .btn").length) return "breathing";
  const chips = q(".chip:not([disabled])"); if (chips.length) { if (!q(".chip.on").length) { chips[1].click(); chips[2].click(); } btn("就是这些")?.click(); return "read"; }
  const rows = q(".sort-row").filter(r => !r.classList.contains("ok") && !r.classList.contains("no"));
  if (rows.length) { rows.forEach(r => r.querySelector(".bin:not([disabled])")?.click()); btn("分好了")?.click(); return "sort"; }
  const flips = q(".flip:not(.open)"); if (flips.length) { flips.forEach(f => f.click()); return "cards"; }
  if ((b = q(".next-row .btn").find(x => !x.disabled && x.offsetParent))) { b.click(); return "next"; }
  const opts = q(".action .opt:not(.tried)"); if (opts.length) { opts[0].click(); return "choice"; }
  return "wait";
})()`;
const report = [];
for (const [route, n] of [["t2f", 3], ["f2t", 3]]) {
  for (let lv = 0; lv < n; lv++) {
    await ev(`document.querySelector(".back")?.click()`); await sleep(150);
    await ev(`[...document.querySelectorAll(".route-card")].find(c=>c.textContent.includes("${route === "t2f" ? "读懂人心" : "冷静解题"}"))?.click()`); await sleep(150);
    await ev(`document.querySelectorAll(".level-item")[${lv}].click()`); await sleep(300);
    const acts = []; let snapped = false;
    for (let k = 0; k < 400; k++) {
      const a = await ev(STEP); acts.push(a);
      if (!snapped && ["impulse"].includes(a) || (!snapped && k === 12)) { await shot(`${route}-${lv + 1}-mid`); snapped = true; }
      if (a === "result") break;
      await sleep(a === "breathing" ? 500 : 1300);
    }
    await shot(`${route}-${lv + 1}-result`);
    const stars = await ev(`document.querySelectorAll(".big-stars .stars span:not(.off)").length`);
    report.push(`${route}-${lv + 1}: ${acts.at(-1)} stars=${stars} actions=${acts.filter(a => a !== "wait" && a !== "breathing").join(",")}`);
    await ev(`[...document.querySelectorAll("button")].find(b=>b.textContent.includes("首页")||b.textContent.includes("关卡列表"))?.click()`); await sleep(200);
    await ev(`document.querySelector(".back")?.click()`); await sleep(200);
  }
}
await ev(`[...document.querySelectorAll("button")].find(b=>b.textContent.includes("先测一测"))?.click()`); await sleep(200);
for (let i = 0; i < 8; i++) { await ev(`document.querySelectorAll(".opt")[0].click()`); await sleep(120); }
await shot("90-quiz-result");
await ev(`location.reload()`); await sleep(600); await shot("91-home-after");
console.log(report.join("\n")); console.log("JS errors:", errors.length ? errors : "none");
ws.close(); chrome.kill();
