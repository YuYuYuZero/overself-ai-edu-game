// 故事冒烟：headless Chrome 自动通关并截图。用法：node tools/e2e-story.mjs [A|B] [week|campus|work] [宽x高]
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const POV = process.argv[2] || "A", SID = process.argv[3] || "week";
const [W, Hh] = (process.argv[4] || "420x860").split("x").map(Number);
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9334 + (POV === "B" ? 1 : 0) + { week: 0, campus: 2, work: 4 }[SID] + (W > 800 ? 10 : 0), OUT = `${root}/tools/shots/${SID}-${POV}-${W}`;
mkdirSync(OUT, { recursive: true });
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=/tmp/cg-story-${SID}-${POV}-${W}`, "--autoplay-policy=no-user-gesture-required", "about:blank"], { stdio: "ignore" });
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
for (let i = 0; i < 40 && !(await ev(`!!(window.Story && document.querySelector(".hero"))`)); i++) await sleep(250);
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
const acts = []; const want = { filtered: 0, decode: 0, mirror: 0, body: 0, ending: 0, hot: 0, compose: 0, caption: 0, phone: 0, title: 0, rank: 0, dialog: 0 };
const t0 = Date.now();
for (let k = 0; k < 3000; k++) {
  const a = await ev(STEP); acts.push(a);
  const probe = await ev(`({ f: !!document.querySelector(".dtext.filtered"), d: document.querySelectorAll(".decode").length, cap: !!document.querySelector(".caption.on"), ph2: !!document.querySelector(".phone.on"), tc: !!document.querySelector(".title-card"), rk: !!document.querySelector(".rank-list"), m: !!document.querySelector(".mirror-it"), b: !!document.querySelector(".body-panel"), e: !!document.querySelector(".ending"), h: document.body.classList.contains("very-hot"), c: !!document.querySelector(".compose"), title: document.querySelector(".level-head h2")?.textContent, ph: document.querySelector(".phase-tag")?.textContent })`);
  for (const [k2, key] of [["f", "filtered"], ["m", "mirror"], ["b", "body"], ["e", "ending"], ["h", "hot"], ["c", "compose"]]) if (probe[k2] && want[key] < 2) { want[key]++; await shot(`${key}-${(probe.title || "").slice(0, 6)}-${probe.ph || ""}`); }
  if (probe.d > 0 && want.decode < 3 && a === "next") { want.decode++; await shot(`decode-${(probe.title || "").slice(0, 6)}`); }
  for (const [k2, key, n] of [["cap", "caption", 3], ["ph2", "phone", 2], ["tc", "title", 2], ["rk", "rank", 1]]) if (probe[k2] && want[key] < n) { want[key]++; await shot(`${key}-${(probe.title || "").slice(0, 6)}`); }
  if (a === "next" && !probe.cap && want.dialog < 6 && k % 7 === 0) { want.dialog++; await shot(`dialog-${(probe.title || "").slice(0, 6)}-${probe.ph || ""}`); }
  if (a === "end" || a === "home") break;
  if (Date.now() - t0 > 900000) { acts.push("TIMEOUT"); break; }
  await sleep(a === "breathing" || a === "wait-inter" || a === "wait" ? 400 : a === "sig" ? 200 : 450);
}
await shot("final");
const state = await ev(`JSON.stringify((() => { const s = JSON.parse(localStorage.getItem(window.STORIES["${SID}"].key)); return { ch: s.ch, ended: s.ended, rel: s.v.rel, f: s.f, cards: s.cards.length, hist: s.history.map(h => h.ch + h.pov + h.phase[0] + ":" + h.type) }; })())`);
const compact = acts.filter(a => !["wait", "breathing", "wait-inter"].includes(a));
console.log("POV", POV, "耗时", Math.round((Date.now() - t0) / 1000) + "s", "动作数", compact.length);
console.log("最后动作:", compact.slice(-6).join(" | "));
console.log("选择:", compact.filter(a => a.startsWith("opt")).join(" | "));
console.log("状态:", state);
console.log("截图计数:", JSON.stringify(want));
console.log("JS errors:", errors.length ? errors : "none");
ws.close(); chrome.kill();
