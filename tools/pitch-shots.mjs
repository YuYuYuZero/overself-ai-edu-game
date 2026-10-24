// 路演截图：自动通关，在每种关键交互（冲动、分类、提问、排序、镜面解码……）第一次出现时截图。
// 用法：node tools/pitch-shots.mjs [A|B] [week|campus|work] [宽x高]  → tools/shots/pitch/<故事>-<视角>/
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const POV = process.argv[2] || "A", SID = process.argv[3] || "week";
const [W, Hh] = (process.argv[4] || "420x860").split("x").map(Number);
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9500 + (POV === "B" ? 1 : 0) + { week: 0, campus: 2, work: 4 }[SID] + (W > 800 ? 10 : 0), OUT = `${root}/tools/shots/pitch/${SID}-${POV}`;
mkdirSync(OUT, { recursive: true });
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=/tmp/cg-pitch-${SID}-${POV}-${W}`, "--autoplay-policy=no-user-gesture-required", "about:blank"], { stdio: "ignore" });
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
await ev(`window.Story.start("${SID}", "${POV}")`);

// 驱动器：每次做一个动作。经历阶段选默认（第一个），镜面/倒带优先选信号解锁的选项
const STEP = `(() => {
  const q = s => [...document.querySelectorAll(s)];
  const vis = b => b && !b.disabled && b.offsetParent !== null;
  const btn = t => q("button").find(b => vis(b) && b.textContent.includes(t));
  if (q(".interstitial,.title-card").length) return "wait-inter";
  if (q(".hero").length) return "home";
  if (q(".backlog.on").length) { q(".backlog .btn")[0].click(); return "close-log"; }
  const sigs = q(".sig:not(.got):not(.gone):not(.fake)"); if (sigs.length) { sigs.forEach(s => s.click()); return "sig"; }
  let b;
  if ((b = btn("倒回那一刻"))) { b.click(); return "rewind"; }
  if ((b = btn("开始")) && q(".chapter-intro").length) { b.click(); return "chapter"; }
  if (q(".result").length && (b = btn("下一章") || btn("完成"))) { b.click(); return "review"; }
  if (q(".ending").length && !window.__endSeen) { window.__endSeen = 1; return "ending-view"; }
  if ((b = btn("回到首页"))) { b.click(); return "end"; }
  if ((b = btn("我平静下来了"))) { b.click(); return "breathe-skip"; }
  if (q(".breathe").length) return "breathing";
  if ((b = q(".voice")[0]) && !b.classList.contains("playing")) { b.click(); return "voice"; }
  const rk = q(".rank-item:not(.on):not(.ok):not(.no)"); if (rk.length) { rk.forEach(r => r.click()); return "rank"; }
  if ((b = btn("排好了"))) { b.click(); return "rank-submit"; }
  if ((b = btn("回听"))) { b.click(); return "replay"; }
  const part = q(".part:not(.named):not(.named-off)")[0];
  if (part) { const chip = part.nextElementSibling?.querySelector?.(".chip"); if (chip) { [...part.nextElementSibling.querySelectorAll(".chip")].find(c => /委屈|想哭|紧张|累/.test(c.textContent))?.click() || chip.click(); } else part.click(); return "body"; }
  const slots = q(".cslot"); if (slots.length) { slots.forEach(s => { if (!s.querySelector(".chip.on")) s.querySelector(".chip").click(); }); (btn("说出口") || btn("发送"))?.click(); return "compose"; }
  const rows = q(".sort-row").filter(r => !r.classList.contains("ok") && !r.classList.contains("no"));
  if (rows.length) { rows.forEach(r => r.querySelector(".bin").click()); btn("分好了")?.click(); return "sort"; }
  if (q(".tipbox").length && (b = btn("知道了"))) { b.click(); return "tip"; }
  if ((b = q(".action .next-row .btn").find(vis))) { b.click(); return "next-panel"; }
  const opts0 = q(".action .opt").filter(vis);
  if (!opts0.length && (b = q(".next-row .btn").find(vis))) { b.click(); return "next"; }
  const phase = document.querySelector(".phase-tag")?.textContent || "";
  const opts = q(".action .opt").filter(vis);
  if (opts.length) {
    const pause = opts.find(o => o.classList.contains("pause"));
    const unlocked = opts.find(o => o.classList.contains("unlocked"));
    const pick = pause || (phase !== "经历" && unlocked) || opts.find(o => !/先停一下/.test(o.textContent)) || opts[0];
    pick.click(); return "opt:" + phase + ":" + pick.textContent.slice(0, 14);
  }
  return "wait";
})()`;
// 交互面板出现、还没操作时先截一张；每种最多 N 张
const DETECT = `(() => {
  const q = s => document.querySelector(s), vis = e => e && e.offsetParent !== null;
  const ph = document.querySelector(".phase-tag")?.textContent || "";
  if (q(".interstitial.mirror-it")) return "mirror-transition";
  if (q(".interstitial.rewind-it")) return "rewind-transition";
  if (q(".title-card")) return "blackscreen";
  if (q(".impulse-opt")) return "impulse-" + ph;
  if (q(".sort-row")) return "sort";
  if (q(".rank-item")) return "rank";
  if (q(".cslot")) return "compose";
  if (q(".part")) return "body";
  if (q(".breathe")) return "breathe";
  if (q(".reveal-card")) return "reveal";
  if ([...document.querySelectorAll(".action .opt")].some(o => o.classList.contains("unlocked"))) return "signal-unlocked";
  if ([...document.querySelectorAll(".action .prompt")].some(p => /还能问/.test(p.textContent))) return "qa";
  if (q(".sig:not(.got):not(.gone):not(.fake)")) return "signal";
  if (q(".dtext.filtered")) return "filtered";
  if (q(".dtext.replayed")) return "replayed";
  if (q(".decode")) return "decode-" + ph;
  if (q(".feedback.bad")) return "consequence";
  if (q(".phone.on")) return "phone";
  if ([...document.querySelectorAll(".action .opt")].some(vis)) return "choice-" + ph;
  if (q(".chapter-intro")) return "chapter-intro";
  if (q(".result:not(.ending)")) return "review";
  if (q(".ending")) return "ending";
  if (q(".caption.on")) return "caption";
  if (q(".dialog.inner.on")) return "inner";
  if (q(".dialog.on")) return "dialog-" + ph;
  return null;
})()`;
const LIMIT = { caption: 3, "dialog-经历": 3, "dialog-镜面": 3, "dialog-倒带": 2, inner: 2, signal: 3, phone: 2, blackscreen: 3 };
const count = {}; const acts = [];
const t0 = Date.now();
for (let k = 0; k < 3000; k++) {
  const tag = await ev(DETECT);
  if (tag && (count[tag] || 0) < (LIMIT[tag] || 2)) {
    count[tag] = (count[tag] || 0) + 1;
    const title = await ev(`(document.querySelector(".level-head h2") || document.querySelector(".chapter-intro h1"))?.textContent || ""`);
    await sleep(tag.includes("transition") ? 900 : 350);
    await shot(`${tag}-${title.replace(/[\s·/]+/g, "").slice(0, 8)}`);
  }
  const a = await ev(STEP); acts.push(a);
  if (a === "end" || a === "home") break;
  if (Date.now() - t0 > 900000) { acts.push("TIMEOUT"); break; }
  await sleep(a === "breathing" || a === "wait-inter" || a === "wait" ? 300 : a === "sig" ? 200 : 450);
}
console.log(SID, POV, "截图", shotN, "张", JSON.stringify(count));
console.log("JS errors:", errors.length ? errors : "none");
ws.close(); chrome.kill();
